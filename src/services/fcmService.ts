import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { EventType } from '@notifee/react-native';
import { API_CONFIG } from '../config/api';
import { getFirebaseToken } from './authService';
import { getChannelForNotificationType } from './notificationChannels';

// Firebase messaging - wrapped to handle missing configuration
let messaging: any = null;
let isFirebaseAvailable = false;

try {
  messaging = require('@react-native-firebase/messaging').default;
  isFirebaseAvailable = true;
} catch (error) {
  console.warn('⚠️ Firebase messaging not available');
}

// Helper to safely get messaging instance
const getMessaging = () => {
  if (!isFirebaseAvailable || !messaging) {
    console.warn('⚠️ Firebase not configured - FCM features disabled');
    return null;
  }
  try {
    return messaging();
  } catch (error) {
    console.warn('⚠️ Firebase not initialized:', error);
    isFirebaseAvailable = false;
    return null;
  }
};

// Storage key for profile (same as useDriverProfileStore)
const PROFILE_STORAGE_KEY = '@driver_profile';

const FCM_TOKEN_KEY = '@fcm_token';
const DEVICE_ID_KEY = '@device_id';

// Generate a unique device ID (UUID v4)
const generateDeviceId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Get or create device ID
const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate and store new device ID
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('📱 Generated new device ID:', deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a timestamp-based ID if storage fails
    return `device_${Date.now()}`;
  }
};

// Check if notification permission is granted
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        console.log('📱 Android notification permission status:', granted);
        return granted;
      } else {
        return true; // Android < 13 doesn't need runtime permission
      }
    } else {
      // iOS: Check permission status
      const msg = getMessaging();
      if (!msg) return false;
      const authStatus = await msg.hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      console.log('📱 iOS notification permission status:', enabled);
      return enabled;
    }
  } catch (error) {
    console.error('❌ Error checking notification permission:', error);
    return false;
  }
};

// Request notification permission (Android & iOS)
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    console.log('🔔 Requesting notification permission...');
    console.log('📱 Platform:', Platform.OS, 'Version:', Platform.Version);

    if (Platform.OS === 'android') {
      // Android 13+ (API level 33+) requires runtime permission for POST_NOTIFICATIONS
      if (Platform.Version >= 33) {
        console.log('📱 Android 13+: Requesting POST_NOTIFICATIONS permission');

        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'Tiffsy Driver needs notification permission to send you important updates about your deliveries and batches.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Android notification permission granted');
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          console.log('⚠️ Android notification permission denied');
          return false;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          console.log('❌ Android notification permission blocked (Never Ask Again)');
          return false;
        }

        return false;
      } else {
        // Android < 13 doesn't need runtime permission
        console.log('✅ Android < 13: No runtime permission needed');
        return true;
      }
    } else {
      // iOS: Request permission using Firebase Messaging
      console.log('📱 iOS: Requesting notification permission');

      const msg = getMessaging();
      if (!msg) {
        console.log('⚠️ Firebase not available - cannot request iOS permission');
        return false;
      }

      const authStatus = await msg.requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ iOS notification permission granted');
        console.log('📋 Permission status:', authStatus);
        return true;
      } else {
        console.log('❌ iOS notification permission denied');
        console.log('📋 Permission status:', authStatus);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return false;
  }
};

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const msg = getMessaging();
    if (!msg) {
      console.log('⚠️ Firebase not available - cannot get FCM token');
      return null;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    const fcmToken = await msg.getToken();
    console.log('🔔 FCM Token:', fcmToken);

    // Store token locally
    await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);

    return fcmToken;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Get stored FCM token
export const getStoredFCMToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting stored FCM token:', error);
    return null;
  }
};

// Register FCM token with backend
// Note: Notifications work regardless of driver's availability status (ONLINE/OFFLINE)
// The availability status only affects whether drivers can accept new batches
export const registerFCMToken = async (): Promise<boolean> => {
  try {
    console.log('🔔 ========================================');
    console.log('🔔 STARTING FCM TOKEN REGISTRATION');
    console.log('🔔 ========================================');

    const fcmToken = await getFCMToken();
    if (!fcmToken) {
      console.log('❌ No FCM token available');
      return false;
    }

    console.log('✅ FCM Token obtained');
    console.log('📱 Token (first 50 chars):', fcmToken.substring(0, 50) + '...');

    const deviceId = await getDeviceId();
    const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

    console.log('📡 Registering FCM token with backend...');
    console.log('📱 Device Type:', deviceType);
    console.log('📱 Device ID:', deviceId);

    // Get Firebase auth token for API call
    const authToken = await getFirebaseToken();

    // Get notification preferences from storage
    let notificationPreferences = {
      newAssignment: true,
      batchUpdates: true,
      promotions: false,
    };

    try {
      const profileData = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (profileData) {
        const profile = JSON.parse(profileData);
        if (profile?.notificationPrefs) {
          notificationPreferences = profile.notificationPrefs;
          console.log('📋 Notification preferences:', notificationPreferences);
        }
      }
    } catch (error) {
      console.log('⚠️ Could not load notification preferences, using defaults');
    }

    console.log('📡 Sending FCM token to backend API...');
    console.log('📡 Endpoint:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FCM_TOKEN}`);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FCM_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fcmToken,
          deviceType,
          deviceId,
          notificationPreferences, // Send preferences to backend
        }),
      }
    );

    console.log('📡 Response status:', response.status);

    const data = await response.json();
    console.log('📡 FCM Registration Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to register FCM token');
    }

    console.log('✅ ========================================');
    console.log('✅ FCM TOKEN REGISTERED SUCCESSFULLY');
    console.log('✅ Backend can now send push notifications');
    console.log('✅ ========================================');
    return true;
  } catch (error: any) {
    console.error('❌ ========================================');
    console.error('❌ ERROR REGISTERING FCM TOKEN');
    console.error('❌ Error:', error.message);
    console.error('❌ ========================================');
    return false;
  }
};

// Remove FCM token from backend
export const removeFCMToken = async (): Promise<boolean> => {
  try {
    const fcmToken = await getStoredFCMToken();
    if (!fcmToken) {
      console.log('⚠️ No FCM token to remove');
      return true; // Consider it success if there's no token
    }

    console.log('📡 Removing FCM token from backend...');

    // Get Firebase auth token for API call
    const authToken = await getFirebaseToken();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FCM_TOKEN}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fcmToken }),
      }
    );

    const data = await response.json();
    console.log('📡 FCM Removal Response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to remove FCM token');
    }

    // Clear locally stored token
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);

    console.log('✅ FCM token removed successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Error removing FCM token:', error);
    return false;
  }
};

// Check if notification should be shown based on user preferences
const shouldShowNotification = async (notificationType?: string): Promise<boolean> => {
  try {
    // Get stored profile preferences
    const profileData = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

    if (!profileData) {
      console.log('⚠️ No profile data found, showing notification by default');
      return true; // Show notification if no preferences found
    }

    const profile = JSON.parse(profileData);
    const notificationPrefs = profile?.notificationPrefs;

    if (!notificationPrefs) {
      console.log('⚠️ No notification preferences found, showing notification by default');
      return true;
    }

    // Check preferences based on notification type
    if (!notificationType) {
      return true; // Show if no type specified
    }

    // Map notification types to preference settings
    if (notificationType.includes('BATCH')) {
      // BATCH_READY, BATCH_ASSIGNED, BATCH_UPDATED, BATCH_CANCELLED
      const shouldShow = notificationPrefs.batchUpdates === true;
      console.log(`🔔 Batch notification - User preference: ${shouldShow ? 'ENABLED' : 'DISABLED'}`);
      return shouldShow;
    } else if (notificationType.includes('ORDER') || notificationType.includes('ASSIGNMENT')) {
      // ORDER_* and general assignments
      const shouldShow = notificationPrefs.newAssignment === true;
      console.log(`🔔 Assignment notification - User preference: ${shouldShow ? 'ENABLED' : 'DISABLED'}`);
      return shouldShow;
    }

    // Show other notifications by default
    return true;
  } catch (error) {
    console.error('❌ Error checking notification preferences:', error);
    return true; // Show notification on error to be safe
  }
};

// Handle notification received in foreground
export const handleForegroundNotification = async (remoteMessage: any) => {
  console.log('🔔 ========================================');
  console.log('🔔 FOREGROUND NOTIFICATION RECEIVED');
  console.log('🔔 ========================================');
  console.log('🔔 Full message:', JSON.stringify(remoteMessage, null, 2));
  console.log('🔔 Title:', remoteMessage?.notification?.title);
  console.log('🔔 Body:', remoteMessage?.notification?.body);
  console.log('🔔 Data:', remoteMessage?.data);
  console.log('🔔 ========================================');

  try {
    const { notification, data } = remoteMessage;

    // Check if notification should be shown based on user preferences
    const shouldShow = await shouldShowNotification(data?.type);

    if (!shouldShow) {
      console.log('🔕 Notification blocked by user preferences');
      return;
    }

    console.log('✅ Notification will be displayed');

    // Get appropriate channel based on notification type
    const channelId = getChannelForNotificationType(data?.type);
    console.log('📱 Using channel:', channelId);

    // Display notification using notifee
    const notificationId = await notifee.displayNotification({
      title: notification?.title || 'New Notification',
      body: notification?.body || '',
      data: data || {},
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
        // Add sound and vibration
        sound: 'default',
        // Show notification badge
        showTimestamp: true,
        timestamp: Date.now(),
        // Make it a heads-up notification for important updates
        importance: data?.type?.includes('BATCH') ? 4 : 3,
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          alert: true,
          badge: true,
          sound: true,
        },
      },
    });

    console.log('✅ ========================================');
    console.log('✅ NOTIFICATION DISPLAYED SUCCESSFULLY');
    console.log('✅ Notification ID:', notificationId);
    console.log('✅ ========================================');

    // Handle data payload
    if (data) {
      console.log('📦 Notification data:', data);
      handleNotificationData(data);
    }
  } catch (error) {
    console.error('❌ Error displaying foreground notification:', error);
  }
};

// Handle notification opened app (background/quit state)
export const handleNotificationOpenedApp = (
  remoteMessage: any,
  navigation: any
) => {
  console.log('🔔 Notification opened app:', remoteMessage);

  if (remoteMessage.data) {
    handleNotificationData(remoteMessage.data, navigation);
  }
};

// Handle notification data payload and navigate accordingly
const handleNotificationData = (data: any, navigation?: any) => {
  console.log('📦 Processing notification data:', data);

  const notificationType = data?.type;

  if (!notificationType) {
    console.log('⚠️ No notification type specified');
    return;
  }

  console.log('🔔 Notification type:', notificationType);

  switch (notificationType) {
    case 'BATCH_READY':
      // New batches available for pickup
      console.log('🍱 Batch ready for pickup');
      console.log('🏪 Kitchen ID:', data.kitchenId);
      console.log('🍽️ Meal Window:', data.mealWindow);
      console.log('📦 Batch Count:', data.batchCount);

      if (navigation) {
        navigation.navigate('Main', {
          screen: 'Deliveries',
          params: {
            openAvailableBatches: true,
          },
        });
      }
      break;

    case 'BATCH_ASSIGNED':
      // Batch assigned to driver
      console.log('📦 Batch assigned to driver');
      console.log('🆔 Batch ID:', data.batchId);

      if (navigation) {
        navigation.navigate('Main', {
          screen: 'Deliveries',
          params: {
            screen: 'MyBatch',
            params: {
              batchId: data.batchId,
            },
          },
        });
      }
      break;

    case 'BATCH_UPDATED':
      // Batch details updated
      console.log('🔄 Batch updated');
      console.log('🆔 Batch ID:', data.batchId);

      if (navigation) {
        navigation.navigate('Main', {
          screen: 'Deliveries',
        });
      }
      break;

    case 'BATCH_CANCELLED':
      // Batch was cancelled
      console.log('❌ Batch cancelled');
      console.log('🆔 Batch ID:', data.batchId);

      if (navigation) {
        navigation.navigate('Main', {
          screen: 'Deliveries',
        });
      }
      break;

    case 'ORDER_READY_FOR_PICKUP':
    case 'ORDER_PICKED_UP':
    case 'ORDER_OUT_FOR_DELIVERY':
    case 'ORDER_DELIVERED':
    case 'ORDER_FAILED':
      // Order status updates
      console.log('📋 Order status update:', notificationType);
      console.log('🆔 Order ID:', data.orderId);

      if (navigation) {
        navigation.navigate('Main', {
          screen: 'Deliveries',
        });
      }
      break;

    default:
      console.log('ℹ️ Unknown notification type:', notificationType);
      if (navigation) {
        navigation.navigate('Main', {
          screen: 'Dashboard',
        });
      }
  }
};

// Initialize FCM listeners
export const initializeFCMListeners = (navigation?: any) => {
  console.log('🔔 Initializing FCM listeners...');

  const msg = getMessaging();
  let unsubscribeForeground = () => {};

  if (msg) {
    // Foreground message listener
    unsubscribeForeground = msg.onMessage(async (remoteMessage: any) => {
      handleForegroundNotification(remoteMessage);
    });

    // Background message handler (already set up in index.js)
    msg.setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('🔔 Background notification received:', remoteMessage);
    });

    // Notification opened app from background
    msg.onNotificationOpenedApp((remoteMessage: any) => {
      handleNotificationOpenedApp(remoteMessage, navigation);
    });

    // Check if app was opened from a notification (quit state)
    msg
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('🔔 App opened from notification (quit state):', remoteMessage);
          handleNotificationOpenedApp(remoteMessage, navigation);
        }
      });
  } else {
    console.log('⚠️ Firebase not available - FCM listeners not initialized');
  }

  // Notifee foreground event listener (handles notification taps when app is open)
  const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    console.log('🔔 Notifee foreground event:', type);

    if (type === EventType.PRESS) {
      console.log('👆 Notification pressed:', detail.notification);
      const data = detail.notification?.data;

      if (data) {
        handleNotificationData(data, navigation);
      }
    }
  });

  // Notifee background event listener (handles notification taps when app is in background)
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    console.log('🔔 Notifee background event:', type);

    if (type === EventType.PRESS) {
      console.log('👆 Background notification pressed:', detail.notification);
      // Navigation will be handled when app comes to foreground
    }
  });

  // Return combined unsubscribe function for cleanup
  return () => {
    unsubscribeForeground();
    unsubscribeNotifee();
  };
};

// Set up FCM token refresh listener
export const setupTokenRefreshListener = () => {
  console.log('🔄 Setting up FCM token refresh listener...');

  const msg = getMessaging();
  if (!msg) {
    console.log('⚠️ Firebase not available - token refresh listener not set up');
    return () => {};
  }

  const unsubscribe = msg.onTokenRefresh(async (newToken: string) => {
    console.log('🔄 FCM Token refreshed:', newToken);
    await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);

    // Re-register the new token with backend
    try {
      await registerFCMToken();
    } catch (error) {
      console.error('❌ Error re-registering refreshed FCM token:', error);
    }
  });

  return unsubscribe;
};

// Sync notification preferences to backend
// Call this when user changes notification settings in Profile
export const syncNotificationPreferences = async (preferences: {
  newAssignment: boolean;
  batchUpdates: boolean;
  promotions: boolean;
}): Promise<boolean> => {
  try {
    console.log('📡 Syncing notification preferences to backend...');
    console.log('📋 Preferences:', preferences);

    const fcmToken = await getStoredFCMToken();
    if (!fcmToken) {
      console.log('⚠️ No FCM token found, skipping backend sync');
      return false;
    }

    const authToken = await getFirebaseToken();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FCM_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fcmToken,
          deviceType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          deviceId: await getDeviceId(),
          notificationPreferences: preferences,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to sync preferences');
    }

    console.log('✅ Notification preferences synced to backend');
    return true;
  } catch (error: any) {
    console.error('❌ Error syncing notification preferences:', error);
    return false;
  }
};

/**
 * Test local notification display
 * Use this to verify that notifee is working correctly
 */
export const testLocalNotification = async (): Promise<void> => {
  try {
    console.log('🧪 ========================================');
    console.log('🧪 TESTING NOTIFICATION SYSTEM');
    console.log('🧪 ========================================');

    // Step 1: Check FCM token
    const fcmToken = await getStoredFCMToken();
    if (fcmToken) {
      console.log('✅ FCM Token EXISTS in storage');
      console.log('📱 Token (first 50 chars):', fcmToken.substring(0, 50) + '...');
      console.log('📱 Token (last 20 chars): ...' + fcmToken.substring(fcmToken.length - 20));
    } else {
      console.log('❌ NO FCM TOKEN FOUND');
      console.log('⚠️ You need to LOGOUT and LOGIN again to register FCM token');
      console.log('⚠️ Without FCM token, backend CANNOT send push notifications');
    }

    // Step 2: Check notification permission
    const hasPermission = await checkNotificationPermission();
    console.log(hasPermission ? '✅ Notification permission GRANTED' : '❌ Notification permission DENIED');

    // Step 3: Display test notification
    console.log('📱 Displaying test notification...');
    const { NOTIFICATION_CHANNELS } = require('./notificationChannels');

    await notifee.displayNotification({
      title: '🧪 Test Notification',
      body: 'If you see this, local notifications work! Check logs for FCM token status.',
      data: {
        type: 'TEST',
        timestamp: Date.now().toString(),
      },
      android: {
        channelId: NOTIFICATION_CHANNELS.GENERAL,
        pressAction: {
          id: 'default',
        },
        sound: 'default',
        importance: 4,
        showTimestamp: true,
        timestamp: Date.now(),
      },
      ios: {
        sound: 'default',
      },
    });

    console.log('✅ ========================================');
    console.log('✅ TEST RESULTS:');
    console.log('✅ Local notifications: WORKING ✓');
    console.log(fcmToken ? '✅ FCM Token: REGISTERED ✓' : '❌ FCM Token: NOT FOUND ✗');
    console.log(hasPermission ? '✅ Permissions: GRANTED ✓' : '❌ Permissions: DENIED ✗');
    console.log('✅ ========================================');

    if (!fcmToken) {
      console.log('⚠️  NEXT STEPS:');
      console.log('⚠️  1. Logout from the app');
      console.log('⚠️  2. Login again');
      console.log('⚠️  3. Look for "FCM TOKEN REGISTERED SUCCESSFULLY" in logs');
      console.log('⚠️ ========================================');
    }
  } catch (error: any) {
    console.error('❌ ========================================');
    console.error('❌ TEST FAILED');
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ ========================================');
  }
};
