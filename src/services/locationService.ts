import { Platform, PermissionsAndroid, Linking, AppState } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import notifee, { AndroidImportance, AndroidForegroundServiceType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendDriverLocation } from './deliveryService';
import { NOTIFICATION_CHANNELS, createNotificationChannels } from './notificationChannels';

const LOCATION_TRACKING_NOTIFICATION_ID = 'location-tracking';
const LOCATION_TRACKING_ENABLED_KEY = '@tiffsy/location-tracking-enabled';
const SEND_INTERVAL_MS = 15000;

export class LocationTrackingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'LocationTrackingError';
  }
}

type DriverLocation = {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
};

let watchId: number | null = null;
let sendInterval: ReturnType<typeof setInterval> | null = null;
let lastLocation: DriverLocation | null = null;
let isTracking = false;
let foregroundServiceLoopRunning = false;
let appStateSubscription: { remove: () => void } | null = null;

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const getAndroidVersion = (): number => {
  return typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
};

const setPersistedTrackingEnabled = async (enabled: boolean): Promise<void> => {
  if (enabled) {
    await AsyncStorage.setItem(LOCATION_TRACKING_ENABLED_KEY, 'true');
  } else {
    await AsyncStorage.removeItem(LOCATION_TRACKING_ENABLED_KEY);
  }
};

const getPersistedTrackingEnabled = async (): Promise<boolean> => {
  return (await AsyncStorage.getItem(LOCATION_TRACKING_ENABLED_KEY)) === 'true';
};

const getCurrentLocationWithDetails = (timeoutMs = 20000): Promise<DriverLocation> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          accuracy: position.coords.accuracy,
        });
      },
      reject,
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 5000,
      }
    );
  });
};

// Quickly probes whether device location services are enabled. We use the
// LOW-accuracy provider with a generous maximumAge so we accept a cached
// network/cell fix from the last 5 minutes — the goal is to confirm location
// services are ON, not to get a precise GPS fix. If the system reports
// POSITION_UNAVAILABLE the master Location toggle is off; everything else
// (cold GPS, brief network outage) we treat as "enabled" so we don't block
// the driver on a slow first fix.
const detectLocationServicesState = async (): Promise<{ enabled: boolean; reason?: string }> => {
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      () => resolve({ enabled: true }),
      (error: any) => {
        const code = error?.code;
        if (code === 2) {
          resolve({ enabled: false, reason: 'Location services (GPS) are turned off on this device.' });
        } else {
          // PERMISSION_DENIED (1) shouldn't reach here (we just granted) and
          // TIMEOUT (3) is treated as "enabled but slow" — let tracking start
          // and the FGS notification will surface any further problems.
          resolve({ enabled: true });
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  });
};

// Open the Android Location Services system settings so the user can enable GPS.
export const openLocationSettings = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      return;
    } catch (error: any) {
      console.warn('Could not open LOCATION_SOURCE_SETTINGS, falling back to app settings:', error?.message);
    }
  }
  await Linking.openSettings();
};

const updateFgsNotificationBody = async (body: string): Promise<void> => {
  try {
    await notifee.displayNotification({
      id: LOCATION_TRACKING_NOTIFICATION_ID,
      title: 'Delivery in Progress',
      body,
      android: {
        channelId: NOTIFICATION_CHANNELS.DELIVERY,
        asForegroundService: true,
        foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION],
        ongoing: true,
        smallIcon: 'ic_notification',
        color: '#FE8733',
        pressAction: { id: 'default' },
        importance: AndroidImportance.LOW,
      },
    });
  } catch (error: any) {
    console.warn('Failed to update FGS notification body:', error?.message || error);
  }
};

// Send a single GPS fix and reflect the outcome on the FGS notification body
// so the driver can SEE in real time whether pings are landing on the backend.
const sendLocation = async (location: DriverLocation): Promise<void> => {
  lastLocation = location;
  const result = await sendDriverLocation({
    latitude: location.latitude,
    longitude: location.longitude,
    speed: location.speed ?? undefined,
    heading: location.heading ?? undefined,
    accuracy: location.accuracy ?? undefined,
  });

  const time = new Date().toLocaleTimeString();
  let body: string;
  if (result.ok) {
    body = `${time} ✓ ${result.coords}`;
  } else if (result.kind === 'rejected') {
    body = `${time} ✗ HTTP ${result.status}: ${result.detail.slice(0, 80)}`;
  } else {
    body = `${time} ✗ NETWORK: ${result.detail.slice(0, 80)}`;
  }
  await updateFgsNotificationBody(body);
};

const waitForActiveAppState = async (timeoutMs = 4000): Promise<boolean> => {
  if (AppState.currentState === 'active') return true;
  return new Promise<boolean>((resolve) => {
    let done = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !done) {
        done = true;
        sub.remove();
        resolve(true);
      }
    });
    setTimeout(() => {
      if (!done) {
        done = true;
        sub.remove();
        resolve(AppState.currentState === 'active');
      }
    }, timeoutMs);
  });
};

const safePermissionRequest = async (
  permission: any,
  rationale: any
): Promise<string> => {
  try {
    return await PermissionsAndroid.request(permission, rationale);
  } catch (error: any) {
    const msg = String(error?.message || error);
    if (msg.includes('not attached to an Activity')) {
      console.warn('⏸ Permission prompt skipped — Activity not attached:', permission);
      return PermissionsAndroid.RESULTS.DENIED;
    }
    throw error;
  }
};

export const requestLocationPermission = async (): Promise<{ fine: boolean; background: boolean }> => {
  if (Platform.OS === 'android') {
    const fineAlready = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    let fineGranted: string = fineAlready
      ? PermissionsAndroid.RESULTS.GRANTED
      : PermissionsAndroid.RESULTS.DENIED;

    if (!fineAlready) {
      const ready = await waitForActiveAppState();
      if (!ready) {
        return { fine: false, background: false };
      }
      fineGranted = await safePermissionRequest(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Tiffsy Driver needs your location to track active deliveries and share live updates with customers.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
    }

    if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) {
      return { fine: false, background: false };
    }

    if (getAndroidVersion() < 29) {
      return { fine: true, background: true };
    }

    const backgroundPermission = PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;
    const hasBackgroundPermission = await PermissionsAndroid.check(backgroundPermission);
    if (hasBackgroundPermission) {
      return { fine: true, background: true };
    }

    const ready = await waitForActiveAppState();
    if (!ready) {
      return { fine: true, background: false };
    }

    const backgroundGranted = await safePermissionRequest(backgroundPermission, {
      title: 'Background Location',
      message: 'Allow Tiffsy Driver to access your location all the time so deliveries keep updating when the app is in the background.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });

    return {
      fine: true,
      background: backgroundGranted === PermissionsAndroid.RESULTS.GRANTED,
    };
  }

  return new Promise((resolve) => {
    Geolocation.requestAuthorization(
      () => resolve({ fine: true, background: true }),
      (error) => {
        console.warn('iOS location permission error:', error);
        resolve({ fine: false, background: false });
      }
    );
  });
};

export const openAppSettings = async (): Promise<void> => {
  await Linking.openSettings();
};

const startAppRuntimeLocationTracking = (): void => {
  watchId = Geolocation.watchPosition(
    (position) => {
      lastLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        accuracy: position.coords.accuracy,
      };
    },
    (error) => {
      console.warn('Location watch error:', error.message);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 20,
      interval: 10000,
      fastestInterval: 5000,
    }
  );

  sendInterval = setInterval(() => {
    if (lastLocation) {
      sendLocation(lastLocation);
    }
  }, SEND_INTERVAL_MS);
};

export const runLocationForegroundService = async (): Promise<void> => {
  if (foregroundServiceLoopRunning) {
    while (await getPersistedTrackingEnabled()) {
      await sleep(SEND_INTERVAL_MS);
    }
    return;
  }

  foregroundServiceLoopRunning = true;
  console.log('📍 Location foreground service loop started');

  // Maintain a hot cached fix via watchPosition. getCurrentPosition can take up
  // to 20s to resolve on the first call, which delays the first ping the kitchen
  // sees by that much. With a watcher running we always have a recent fix to send.
  let hotWatchId: number | null = null;
  try {
    hotWatchId = Geolocation.watchPosition(
      (position) => {
        lastLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          accuracy: position.coords.accuracy,
        };
      },
      (error) => {
        console.warn('FGS watcher error:', error?.message);
      },
      { enableHighAccuracy: true, distanceFilter: 10, interval: 5000, fastestInterval: 2000 }
    );
  } catch (error: any) {
    console.warn('Could not start hot location watcher:', error?.message || error);
  }

  // Immediate first push so the kitchen tracker sees the driver right away.
  try {
    const location = await getCurrentLocationWithDetails();
    await sendLocation(location);
  } catch (error: any) {
    console.warn('Initial location fix failed:', error?.message || error);
    const time = new Date().toLocaleTimeString();
    const codeHint = error?.code === 2 ? 'GPS OFF' : error?.code === 3 ? 'GPS TIMEOUT' : 'GPS ERROR';
    await updateFgsNotificationBody(`${time} ✗ ${codeHint}: ${(error?.message || '').slice(0, 60)}`);
  }

  try {
    while (await getPersistedTrackingEnabled()) {
      await sleep(SEND_INTERVAL_MS);
      if (!(await getPersistedTrackingEnabled())) break;
      try {
        // Prefer the hot cached fix from watchPosition; fall back to a fresh
        // getCurrentPosition if the watcher hasn't produced anything yet.
        const location = lastLocation || (await getCurrentLocationWithDetails());
        await sendLocation(location);
      } catch (error: any) {
        console.warn('Background location update failed:', error?.message || error);
        const time = new Date().toLocaleTimeString();
        const codeHint = error?.code === 2 ? 'GPS OFF' : error?.code === 3 ? 'GPS TIMEOUT' : 'GPS ERROR';
        await updateFgsNotificationBody(`${time} ✗ ${codeHint}: ${(error?.message || '').slice(0, 60)}`);
      }
    }
  } finally {
    if (hotWatchId !== null) {
      try { Geolocation.clearWatch(hotWatchId); } catch { /* ignore */ }
    }
    foregroundServiceLoopRunning = false;
    console.log('📍 Location foreground service loop stopped');
  }
};

const startAndroidForegroundService = async (): Promise<void> => {
  // Channel must exist before displayNotification or notifee throws.
  await createNotificationChannels();

  await notifee.displayNotification({
    id: LOCATION_TRACKING_NOTIFICATION_ID,
    title: 'Delivery in Progress',
    body: 'Tracking your location for active delivery',
    android: {
      channelId: NOTIFICATION_CHANNELS.DELIVERY,
      asForegroundService: true,
      // Required on Android 14+ (targetSdk 34+). Without this notifee passes -1 to
      // Service.startForeground(), which Android rejects with InvalidForegroundServiceTypeException.
      // Must match the type declared in AndroidManifest.xml for app.notifee.core.ForegroundService.
      foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION],
      ongoing: true,
      smallIcon: 'ic_notification',
      color: '#FE8733',
      pressAction: { id: 'default' },
      importance: AndroidImportance.LOW,
    },
  });
};

const ensureAppStateListener = (): void => {
  if (appStateSubscription) return;
  appStateSubscription = AppState.addEventListener('change', async (nextState) => {
    if (nextState !== 'active') return;
    if (isTracking) return;
    const persisted = await getPersistedTrackingEnabled();
    if (persisted) {
      console.log('📍 App resumed with persisted tracking flag — restarting location tracking');
      try {
        await startLocationTracking();
      } catch (error: any) {
        console.warn('Failed to auto-resume location tracking:', error?.message || error);
      }
    }
  });
};

export const startLocationTracking = async (): Promise<void> => {
  if (isTracking) {
    console.log('Location tracking already active');
    return;
  }

  ensureAppStateListener();

  const { fine, background } = await requestLocationPermission();
  if (!fine) {
    throw new LocationTrackingError(
      'PERMISSION_FINE_DENIED',
      'Location permission is required to track deliveries. Please enable it in your phone settings.'
    );
  }

  // Permission granted ≠ GPS turned on. Probe before launching the FGS so we
  // can prompt the user to flip Location Services on instead of running an FGS
  // that never gets a fix.
  if (Platform.OS === 'android') {
    const gpsState = await detectLocationServicesState();
    if (!gpsState.enabled) {
      throw new LocationTrackingError(
        'LOCATION_SERVICES_OFF',
        gpsState.reason || 'Please enable Location Services (GPS) on your device.'
      );
    }
  }

  console.log('📍 Starting location tracking (background granted:', background, ')');

  if (Platform.OS === 'android') {
    // Persist BEFORE calling notifee.displayNotification, because notifee's FGS
    // handler (registered in index.js) reads this flag in its `while` loop the
    // moment the service starts. If we set it after, the handler sees `false`
    // and exits immediately — the FGS notification stays but no GPS pings fire.
    // Native crashes from startForeground are now prevented by the
    // foregroundServiceTypes option, so the catch below will reliably reset
    // the flag if something else goes wrong.
    await setPersistedTrackingEnabled(true);
    try {
      await startAndroidForegroundService();
      isTracking = true;
      console.log('✅ Foreground location service started');

      if (!background) {
        throw new LocationTrackingError(
          'BACKGROUND_PERMISSION_MISSING',
          'Background location is not enabled. Tracking will pause if the app is fully closed. Tap settings to enable "Allow all the time".'
        );
      }
      return;
    } catch (error: any) {
      if (error instanceof LocationTrackingError) {
        throw error;
      }
      await setPersistedTrackingEnabled(false);
      console.error('❌ Failed to start foreground service:', error);
      throw new LocationTrackingError(
        'FOREGROUND_SERVICE_FAILED',
        error?.message || 'Could not start the background location service.'
      );
    }
  }

  startAppRuntimeLocationTracking();
  isTracking = true;
  console.log('✅ Location tracking started (iOS in-app)');
};

export const stopLocationTracking = async (): Promise<void> => {
  console.log('📍 Stopping location tracking...');

  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (sendInterval !== null) {
    clearInterval(sendInterval);
    sendInterval = null;
  }

  await setPersistedTrackingEnabled(false);

  if (Platform.OS === 'android') {
    try {
      await notifee.stopForegroundService();
      await notifee.cancelNotification(LOCATION_TRACKING_NOTIFICATION_ID);
    } catch (error) {
      console.warn('Error stopping foreground service:', error);
    }
  }

  lastLocation = null;
  isTracking = false;
  console.log('✅ Location tracking stopped');
};

// Called once on app cold start. We do NOT auto-restart the foreground service here —
// Android 12+ will throw ForegroundServiceStartNotAllowedException when the activity
// isn't yet fully foreground, and notifee would crash the JS bridge. Instead we simply
// wipe any leftover "tracking enabled" flag so a previous crash can't re-trigger itself.
// The user will re-enable tracking when they next interact with the dashboard.
export const clearStaleTrackingState = async (): Promise<void> => {
  try {
    const persisted = await getPersistedTrackingEnabled();
    if (persisted) {
      console.log('📍 Clearing stale location-tracking flag from previous session');
      await setPersistedTrackingEnabled(false);
    }
  } catch (error: any) {
    console.warn('Failed to clear stale tracking state:', error?.message || error);
  }
};

export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return getCurrentLocationWithDetails().then(location => ({
    latitude: location.latitude,
    longitude: location.longitude,
  }));
};

export const isLocationTrackingActive = (): boolean => {
  return isTracking;
};
