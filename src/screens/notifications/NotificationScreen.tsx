import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Notification } from '../../types/api';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';

export default function NotificationScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications(50, 0);
      setNotifications(response.data.notifications);
      console.log('📬 Loaded notifications:', response.data.notifications.length);
    } catch (error: any) {
      console.error('❌ Failed to load notifications:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to load notifications. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Get icon and color based on notification type
  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'BATCH_ASSIGNED':
      case 'BATCH_READY':
        return { icon: 'package-variant', color: '#3B82F6', bgColor: '#EFF6FF' };
      case 'BATCH_UPDATED':
        return { icon: 'package-variant-closed', color: '#F59E0B', bgColor: '#FEF3C7' };
      case 'BATCH_CANCELLED':
        return { icon: 'package-variant-remove', color: '#EF4444', bgColor: '#FEE2E2' };
      case 'ORDER_READY_FOR_PICKUP':
      case 'ORDER_PICKED_UP':
        return { icon: 'check-circle', color: '#10B981', bgColor: '#D1FAE5' };
      case 'ORDER_OUT_FOR_DELIVERY':
        return { icon: 'truck-delivery', color: '#8B5CF6', bgColor: '#EDE9FE' };
      case 'ORDER_DELIVERED':
        return { icon: 'check-all', color: '#10B981', bgColor: '#D1FAE5' };
      case 'ORDER_FAILED':
        return { icon: 'alert-circle', color: '#EF4444', bgColor: '#FEE2E2' };
      default:
        return { icon: 'bell', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read locally immediately for better UX
    setNotifications(prev =>
      prev.map(n => (n._id === notification._id ? { ...n, isRead: true } : n))
    );

    // Mark as read on backend
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id);
        console.log('✅ Notification marked as read:', notification._id);
      }
    } catch (error: any) {
      console.error('❌ Failed to mark notification as read:', error);
      // Silently fail - notification is already marked as read locally
    }

    // Navigate based on notification type
    if (notification.data?.batchId) {
      // Navigate to batch/delivery details if available
      console.log('📍 Navigating to batch:', notification.data.batchId);
      // TODO: Implement navigation to batch screen
      // navigation.navigate('DeliveryDetail', { batchId: notification.data.batchId });
    } else if (notification.data?.orderId) {
      console.log('📍 Navigating to order:', notification.data.orderId);
      // TODO: Implement navigation to order screen
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Mark all as read locally immediately for better UX
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

      // Mark all as read on backend
      const response = await markAllNotificationsAsRead();
      console.log('✅ Marked all notifications as read:', response.data.updatedCount);
    } catch (error: any) {
      console.error('❌ Failed to mark all notifications as read:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to mark all notifications as read. Please try again.',
      );
      // Reload notifications to get correct state
      loadNotifications();
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } catch (error) {
      // Error already handled in loadNotifications
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const style = getNotificationStyle(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.notificationItemUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: style.bgColor }]}>
          <MaterialCommunityIcons name={style.icon} size={24} color={style.color} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !item.isRead && styles.notificationTitleUnread]}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.notificationTime}>{formatTimestamp(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="bell-outline" size={80} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateText}>
        You're all caught up! We'll notify you when there's something new.
      </Text>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
            activeOpacity={0.7}
          >
            <Text style={styles.markAllButtonText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F56B4C" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item._id}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#F56B4C']}
              tintColor="#F56B4C"
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerBadge: {
    marginLeft: 8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  markAllButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContent: {
    paddingVertical: 8,
  },
  listContentEmpty: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationItemUnread: {
    backgroundColor: '#F0F9FF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  notificationTitleUnread: {
    color: '#111827',
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
