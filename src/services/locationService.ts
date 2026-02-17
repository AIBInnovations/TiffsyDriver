import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { sendDriverLocation } from './deliveryService';
import { NOTIFICATION_CHANNELS } from './notificationChannels';

const LOCATION_TRACKING_NOTIFICATION_ID = 'location-tracking';
const SEND_INTERVAL_MS = 15000; // 15 seconds

let watchId: number | null = null;
let sendInterval: ReturnType<typeof setInterval> | null = null;
let lastLocation: { latitude: number; longitude: number; speed: number | null; heading: number | null; accuracy: number | null } | null = null;
let isTracking = false;

// Request location permissions
export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Tiffsy Driver needs access to your location to track deliveries and provide live updates to customers.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('📍 Location permission granted');
        return true;
      }
      console.warn('⚠️ Location permission denied');
      return false;
    } catch (error) {
      console.warn('⚠️ Error requesting location permission:', error);
      return false;
    }
  }

  // iOS — request via Geolocation API
  return new Promise((resolve) => {
    Geolocation.requestAuthorization(
      () => {
        console.log('📍 Location permission granted (iOS)');
        resolve(true);
      },
      (error) => {
        console.warn('⚠️ iOS location permission error:', error);
        resolve(false);
      }
    );
  });
};

// Start location tracking with background foreground service
export const startLocationTracking = async (): Promise<void> => {
  if (isTracking) {
    console.log('📍 Location tracking already active');
    return;
  }

  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    console.warn('⚠️ Cannot start tracking — no location permission');
    return;
  }

  console.log('📍 Starting location tracking...');

  // Start Android foreground service via Notifee
  if (Platform.OS === 'android') {
    try {
      await notifee.displayNotification({
        id: LOCATION_TRACKING_NOTIFICATION_ID,
        title: 'Delivery in Progress',
        body: 'Tracking your location for active delivery',
        android: {
          channelId: NOTIFICATION_CHANNELS.DELIVERY,
          asForegroundService: true,
          ongoing: true,
          smallIcon: 'ic_notification',
          pressAction: { id: 'default' },
          importance: AndroidImportance.LOW,
        },
      });
      console.log('📍 Foreground service notification displayed');
    } catch (error) {
      console.warn('⚠️ Failed to start foreground service:', error);
      // Continue anyway — location may still work in foreground
    }
  }

  // Watch position changes
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
      console.warn('⚠️ Location watch error:', error.message);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 20, // Update when moved 20+ meters
      interval: 10000,
      fastestInterval: 5000,
    }
  );

  // Send location to server every 15 seconds
  sendInterval = setInterval(() => {
    if (lastLocation) {
      sendDriverLocation({
        latitude: lastLocation.latitude,
        longitude: lastLocation.longitude,
        speed: lastLocation.speed ?? undefined,
        heading: lastLocation.heading ?? undefined,
        accuracy: lastLocation.accuracy ?? undefined,
      });
    }
  }, SEND_INTERVAL_MS);

  isTracking = true;
  console.log('📍 Location tracking started');
};

// Stop location tracking
export const stopLocationTracking = async (): Promise<void> => {
  if (!isTracking) {
    console.log('📍 Location tracking not active');
    return;
  }

  console.log('📍 Stopping location tracking...');

  // Clear position watch
  if (watchId !== null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }

  // Clear send interval
  if (sendInterval !== null) {
    clearInterval(sendInterval);
    sendInterval = null;
  }

  // Cancel foreground service notification
  if (Platform.OS === 'android') {
    try {
      await notifee.stopForegroundService();
      await notifee.cancelNotification(LOCATION_TRACKING_NOTIFICATION_ID);
    } catch (error) {
      console.warn('⚠️ Error stopping foreground service:', error);
    }
  }

  lastLocation = null;
  isTracking = false;
  console.log('📍 Location tracking stopped');
};

// Get current location (one-shot)
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
};

// Check if tracking is active
export const isLocationTrackingActive = (): boolean => {
  return isTracking;
};
