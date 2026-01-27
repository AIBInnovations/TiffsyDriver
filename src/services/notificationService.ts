import { API_CONFIG } from '../config/api';
import { getFirebaseToken } from './authService';
import type {
  ApiResponse,
  NotificationsData,
  Notification,
} from '../types/api';

// Create authorized headers with Firebase token
const createHeaders = async () => {
  const token = await getFirebaseToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Fetch all notifications for the current driver
 * @param limit - Number of notifications to fetch (default: 50)
 * @param offset - Offset for pagination (default: 0)
 */
export const getNotifications = async (
  limit: number = 50,
  offset: number = 0
): Promise<ApiResponse<NotificationsData>> => {
  try {
    console.log('📬 Fetching notifications...', { limit, offset });

    const headers = await createHeaders();
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTIFICATIONS}?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('📬 Response status:', response.status);

    const responseText = await response.text();
    let data: ApiResponse<NotificationsData>;

    try {
      data = JSON.parse(responseText);
      console.log('📬 Fetched notifications:', data.data.notifications.length);
    } catch (parseError) {
      console.error('❌ Response is not valid JSON');
      throw new Error('Backend returned non-JSON response');
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to fetch notifications');
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark a specific notification as read
 * @param notificationId - ID of the notification to mark as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<ApiResponse<{ notification: Notification }>> => {
  try {
    console.log('✅ Marking notification as read:', notificationId);

    const headers = await createHeaders();
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MARK_NOTIFICATION_READ(notificationId)}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
    });

    const responseText = await response.text();
    let data: ApiResponse<{ notification: Notification }>;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Response is not valid JSON');
      throw new Error('Backend returned non-JSON response');
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to mark notification as read');
    }

    console.log('✅ Notification marked as read');
    return data;
  } catch (error: any) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (): Promise<ApiResponse<{ updatedCount: number }>> => {
  try {
    console.log('✅ Marking all notifications as read...');

    const headers = await createHeaders();
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ}`;

    console.log('📡 Request URL:', url);
    console.log('📡 Request method: PATCH');

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
    });

    console.log('📡 Response status:', response.status);

    const responseText = await response.text();
    console.log('📡 Response text (first 500 chars):', responseText.substring(0, 500));

    let data: ApiResponse<{ updatedCount: number }>;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Response is not valid JSON');
      console.error('❌ Full response text:', responseText);
      console.error('❌ Parse error:', parseError);
      throw new Error('Backend returned non-JSON response');
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to mark all notifications as read');
    }

    console.log('✅ All notifications marked as read:', data.data.updatedCount);
    return data;
  } catch (error: any) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
};
