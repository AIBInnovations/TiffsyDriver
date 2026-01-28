/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Helper to get channel based on notification type
const getChannelForType = (type) => {
  if (type?.includes('BATCH')) return 'batch_channel';
  if (type?.includes('DELIVERY') || type?.includes('ORDER')) return 'delivery_channel';
  if (type?.includes('URGENT')) return 'urgent_channel';
  return 'general_channel';
};

// Register background handler for FCM
// This must be registered outside of the app lifecycle (before AppRegistry.registerComponent)
// Wrapped in try-catch to handle missing Firebase configuration
try {
  const messaging = require('@react-native-firebase/messaging').default;
  const notifee = require('@notifee/react-native').default;
  const { AndroidImportance } = require('@notifee/react-native');

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('🔔 ========================================');
    console.log('🔔 BACKGROUND NOTIFICATION RECEIVED');
    console.log('🔔 ========================================');
    console.log('🔔 Full message:', JSON.stringify(remoteMessage, null, 2));
    console.log('🔔 Title:', remoteMessage?.notification?.title);
    console.log('🔔 Body:', remoteMessage?.notification?.body);
    console.log('🔔 Data:', remoteMessage?.data);
    console.log('🔔 ========================================');

    try {
      const { notification, data } = remoteMessage;
      const channelId = getChannelForType(data?.type);

      console.log('📱 Displaying background notification with channel:', channelId);

      // Display notification using notifee
      await notifee.displayNotification({
        title: notification?.title || 'New Notification',
        body: notification?.body || '',
        data: data || {},
        android: {
          channelId,
          pressAction: {
            id: 'default',
          },
          sound: 'default',
          importance: AndroidImportance.HIGH,
          showTimestamp: true,
          timestamp: Date.now(),
        },
      });

      console.log('✅ ========================================');
      console.log('✅ BACKGROUND NOTIFICATION DISPLAYED');
      console.log('✅ ========================================');
    } catch (error) {
      console.error('❌ ========================================');
      console.error('❌ ERROR DISPLAYING BACKGROUND NOTIFICATION');
      console.error('❌ Error:', error);
      console.error('❌ ========================================');
    }
  });
} catch (error) {
  console.warn('⚠️ Firebase not configured - push notifications disabled');
  console.warn('⚠️ Add GoogleService-Info.plist to enable Firebase features');
}

AppRegistry.registerComponent(appName, () => App);
