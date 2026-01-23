import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import { getFirebaseToken } from './authService';

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

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.log('❌ Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return null;
    }

    const fcmToken = await messaging().getToken();
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
export const registerFCMToken = async (): Promise<boolean> => {
  try {
    const fcmToken = await getFCMToken();
    if (!fcmToken) {
      console.log('⚠️ No FCM token available');
      return false;
    }

    const deviceId = await getDeviceId();
    const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

    console.log('📡 Registering FCM token with backend...');
    console.log('📱 Device Type:', deviceType);
    console.log('📱 Device ID:', deviceId);

    // Get Firebase auth token for API call
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
          deviceType,
          deviceId,
        }),
      }
    );

    const data = await response.json();
    console.log('📡 FCM Registration Response:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to register FCM token');
    }

    console.log('✅ FCM token registered successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Error registering FCM token:', error);
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

// Handle notification received in foreground
export const handleForegroundNotification = (remoteMessage: any) => {
  console.log('🔔 Foreground notification received:', remoteMessage);

  // Show an alert or custom in-app notification
  if (remoteMessage.notification) {
    Alert.alert(
      remoteMessage.notification.title || 'New Notification',
      remoteMessage.notification.body || '',
      [{ text: 'OK' }]
    );
  }

  // Handle data payload
  if (remoteMessage.data) {
    console.log('📦 Notification data:', remoteMessage.data);
    handleNotificationData(remoteMessage.data);
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

  // Driver app specific notification handling
  if (data.kitchenId && data.mealWindow && data.batchCount) {
    console.log('🍱 Batch ready for pickup notification');
    console.log('🏪 Kitchen ID:', data.kitchenId);
    console.log('🍽️ Meal Window:', data.mealWindow);
    console.log('📦 Batch Count:', data.batchCount);

    // Navigate to available batches or dashboard
    if (navigation) {
      navigation.navigate('Dashboard');
    }
  }

  // Add more notification type handling as needed
};

// Initialize FCM listeners
export const initializeFCMListeners = (navigation?: any) => {
  console.log('🔔 Initializing FCM listeners...');

  // Foreground message listener
  const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
    handleForegroundNotification(remoteMessage);
  });

  // Background message handler (already set up in index.js)
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('🔔 Background notification received:', remoteMessage);
  });

  // Notification opened app from background
  messaging().onNotificationOpenedApp((remoteMessage) => {
    handleNotificationOpenedApp(remoteMessage, navigation);
  });

  // Check if app was opened from a notification (quit state)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('🔔 App opened from notification (quit state):', remoteMessage);
        handleNotificationOpenedApp(remoteMessage, navigation);
      }
    });

  // Return unsubscribe function for cleanup
  return unsubscribeForeground;
};

// Set up FCM token refresh listener
export const setupTokenRefreshListener = () => {
  console.log('🔄 Setting up FCM token refresh listener...');

  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
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
