import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

// Notification Channel IDs
export const NOTIFICATION_CHANNELS = {
  DELIVERY: 'delivery_channel',
  BATCH: 'batch_channel',
  GENERAL: 'general_channel',
  URGENT: 'urgent_channel',
} as const;

// Initialize notification channels for Android
export const createNotificationChannels = async (): Promise<void> => {
  try {
    console.log('🔔 Creating notification channels...');

    // Delivery Channel - For individual delivery notifications
    await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.DELIVERY,
      name: 'Deliveries',
      description: 'Notifications for individual deliveries',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
      badge: true,
      visibility: AndroidVisibility.PUBLIC,
    });

    // Batch Channel - For batch-related notifications (highest priority)
    await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.BATCH,
      name: 'Batch Updates',
      description: 'Important notifications about batch assignments and updates',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [500, 500, 500],
      badge: true,
      visibility: AndroidVisibility.PUBLIC,
    });

    // Urgent Channel - For time-sensitive notifications
    await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.URGENT,
      name: 'Urgent Notifications',
      description: 'Critical time-sensitive notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [500, 1000, 500],
      badge: true,
      visibility: AndroidVisibility.PUBLIC,
    });

    // General Channel - For general app notifications
    await notifee.createChannel({
      id: NOTIFICATION_CHANNELS.GENERAL,
      name: 'General',
      description: 'General app notifications',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibration: true,
      badge: true,
    });

    console.log('✅ Notification channels created successfully');
  } catch (error) {
    console.error('❌ Error creating notification channels:', error);
  }
};

// Delete all notification channels (for development/testing)
export const deleteAllChannels = async (): Promise<void> => {
  try {
    const channels = await notifee.getChannels();
    console.log('🗑️ Deleting', channels.length, 'notification channels...');

    for (const channel of channels) {
      await notifee.deleteChannel(channel.id);
    }

    console.log('✅ All notification channels deleted');
  } catch (error) {
    console.error('❌ Error deleting notification channels:', error);
  }
};

// Get channel ID based on notification type
export const getChannelForNotificationType = (type?: string): string => {
  if (!type) return NOTIFICATION_CHANNELS.GENERAL;

  switch (type.toUpperCase()) {
    case 'BATCH_READY':
    case 'BATCH_ASSIGNED':
    case 'BATCH_UPDATED':
    case 'BATCH_CANCELLED':
      return NOTIFICATION_CHANNELS.BATCH;

    case 'ORDER_READY_FOR_PICKUP':
    case 'ORDER_PICKED_UP':
    case 'ORDER_OUT_FOR_DELIVERY':
    case 'ORDER_DELIVERED':
    case 'ORDER_FAILED':
      return NOTIFICATION_CHANNELS.DELIVERY;

    case 'URGENT_ALERT':
    case 'EMERGENCY':
      return NOTIFICATION_CHANNELS.URGENT;

    default:
      return NOTIFICATION_CHANNELS.GENERAL;
  }
};
