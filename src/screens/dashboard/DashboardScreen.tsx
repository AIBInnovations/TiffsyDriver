import { View, Text, ScrollView, RefreshControl, StyleSheet, StatusBar, TouchableOpacity, Switch, Animated } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MainTabsParamList } from '../../navigation/types';
import DeliveryCard from './components/DeliveryCard';
import BatchCard from './components/BatchCard';
import NotificationBanner from './components/NotificationBanner';
import StatsCard from './components/StatsCard';
import NewDeliveryRequestModal, { NewDeliveryRequest } from './components/NewDeliveryRequestModal';
import { useDriverProfileStore } from '../profile/useDriverProfileStore';
import { useDeliveryContext } from '../../context/DeliveryContext';

// Mock data - replace with actual data from API/state
const mockDeliveries = [
  {
    id: 'DEL-001',
    customerName: 'John Doe',
    pickupLocation: 'Tiffsy Kitchen, Ikeja',
    dropoffLocation: '123 Main Street, Victoria Island',
    status: 'pending' as const,
    eta: '15 mins',
  },
  {
    id: 'DEL-002',
    customerName: 'Jane Smith',
    pickupLocation: 'Tiffsy Kitchen, Ikeja',
    dropoffLocation: '456 Oak Avenue, Lekki Phase 1',
    status: 'in_progress' as const,
    eta: '25 mins',
  },
];

const mockBatches = [
  {
    batchId: 'BATCH-001',
    stops: 5,
    status: 'in_progress' as const,
    estimatedTime: '2:30 PM',
  },
];

// Mock new delivery request - simulating incoming delivery
const mockNewDeliveryRequest: NewDeliveryRequest = {
  id: 'DEL-NEW-001',
  orderId: 'Order #98765',
  customerName: 'Michael Johnson',
  pickupLocation: 'Tiffsy Kitchen, Lekki Phase 1',
  dropoffLocation: '789 Palm Avenue, Ikoyi',
  estimatedDistance: '8.5 km',
  estimatedEarnings: 'N2,500',
  deliveryWindow: '30 mins',
};

export default function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabsParamList>>();
  const { profile, setAvailabilityStatus } = useDriverProfileStore();
  const { addDelivery } = useDeliveryContext();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [showRecentUpdates, setShowRecentUpdates] = useState(true);
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState(false);
  const [newDeliveryRequest, setNewDeliveryRequest] = useState<NewDeliveryRequest | null>(null);
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const isOnline = profile.availabilityStatus === 'ONLINE';
  const driverName = profile.fullName;

  // Show toast with animation
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  }, [toastOpacity]);

  // Simulate receiving a new delivery request after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setNewDeliveryRequest(mockNewDeliveryRequest);
      setShowNewDeliveryModal(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAcceptDelivery = useCallback((delivery: NewDeliveryRequest) => {
    // Add accepted delivery to local list (Dashboard)
    setDeliveries(prev => [
      ...prev,
      {
        id: delivery.id,
        customerName: delivery.customerName,
        pickupLocation: delivery.pickupLocation,
        dropoffLocation: delivery.dropoffLocation,
        status: 'pending' as const,
        eta: delivery.deliveryWindow,
      },
    ]);
    // Add to shared context (Deliveries screen)
    addDelivery({
      id: delivery.id,
      orderId: delivery.orderId,
      customerName: delivery.customerName,
      customerPhone: '+234 800 000 0000',
      pickupLocation: delivery.pickupLocation,
      dropoffLocation: delivery.dropoffLocation,
      status: 'pending',
      eta: delivery.deliveryWindow,
      deliveryWindow: delivery.deliveryWindow,
      distance: delivery.estimatedDistance,
    });
    setShowNewDeliveryModal(false);
    setNewDeliveryRequest(null);
    showToast(`${delivery.orderId} has been added to your deliveries`);
  }, [showToast, addDelivery]);

  const handleRejectDelivery = useCallback(() => {
    const rejectedOrder = newDeliveryRequest?.orderId;
    setShowNewDeliveryModal(false);
    setNewDeliveryRequest(null);
    if (rejectedOrder) {
      showToast(`${rejectedOrder} has been rejected`, 'error');
    }
  }, [newDeliveryRequest, showToast]);

  const handleToggleOnline = useCallback((value: boolean) => {
    setAvailabilityStatus(value ? 'ONLINE' : 'OFFLINE');
  }, [setAvailabilityStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch latest data from API
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleStartDelivery = (id: string) => {
    const delivery = mockDeliveries.find(d => d.id === id);
    if (delivery) {
      navigation.navigate('DeliveryStatus', {
        deliveryId: delivery.id,
        customerName: delivery.customerName,
        pickupLocation: delivery.pickupLocation,
        dropoffLocation: delivery.dropoffLocation,
        currentStatus: 'in_progress',
      });
    }
  };

  const handleViewDelivery = (id: string) => {
    const delivery = mockDeliveries.find(d => d.id === id);
    if (delivery) {
      navigation.navigate('DeliveryStatus', {
        deliveryId: delivery.id,
        customerName: delivery.customerName,
        pickupLocation: delivery.pickupLocation,
        dropoffLocation: delivery.dropoffLocation,
        currentStatus: delivery.status === 'in_progress' ? 'in_progress' : 'pending',
      });
    }
  };

  const handleStartBatch = (batchId: string) => {
    console.log('Starting batch:', batchId);
    // TODO: Start batch and navigate
  };

  const handleViewBatch = (batchId: string) => {
    navigation.navigate('Deliveries', { screen: 'DeliveriesList', params: { batchId } });
  };

  const handleClearAllUpdates = () => {
    setShowRecentUpdates(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F56B4C']}
            tintColor="#F56B4C"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.driverName}>{driverName}</Text>
            {/* Online/Offline Toggle */}
            <View style={[styles.statusPill, isOnline ? styles.statusPillOnline : styles.statusPillOffline]}>
              <View style={styles.statusPillContent}>
                <View style={[styles.statusPillDot, isOnline ? styles.statusPillDotOnline : styles.statusPillDotOffline]} />
                <Text style={[styles.statusPillText, isOnline ? styles.statusPillTextOnline : styles.statusPillTextOffline]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: '#E5E7EB', true: '#86EFAC' }}
                thumbColor={isOnline ? '#10B981' : '#9CA3AF'}
                style={styles.statusPillSwitch}
              />
            </View>
          </View>
          {/* Notification Button */}
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="bell-outline" size={28} color="#FFFFFF" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notification Banner */}
        {showNotification && (
          <NotificationBanner
            message="You have 3 pending deliveries waiting to be picked up"
            type="info"
            onDismiss={() => setShowNotification(false)}
          />
        )}

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatsCard
              label="Today's Deliveries"
              value="12"
              subLabel="Completed"
              icon="truck-check"
              iconColor="#3B82F6"
            />
            <View style={styles.statsSpacer} />
            <StatsCard
              label="Earnings"
              value="N15,400"
              subLabel="Today"
              valueColor="#10B981"
              icon="cash"
              iconColor="#10B981"
            />
          </View>
          <View style={[styles.statsRow, { marginTop: 12 }]}>
            <StatsCard
              label="Rating"
              value="4.8"
              subLabel="out of 5 stars"
              valueColor="#F59E0B"
              icon="star"
              iconColor="#F59E0B"
            />
            <View style={styles.statsSpacer} />
            <StatsCard
              label="Pending"
              value="3"
              subLabel="Deliveries"
              valueColor="#F56B4C"
              icon="clock-outline"
              iconColor="#F56B4C"
            />
          </View>
        </View>

        {/* Active Batches Section */}
        {mockBatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Batches</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Deliveries', { screen: 'DeliveriesList' })}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {mockBatches.map((batch) => (
              <BatchCard
                key={batch.batchId}
                batchId={batch.batchId}
                stops={batch.stops}
                status={batch.status}
                estimatedTime={batch.estimatedTime}
                onPress={() => handleViewBatch(batch.batchId)}
                onStartBatch={() => handleStartBatch(batch.batchId)}
              />
            ))}
          </View>
        )}

        {/* Upcoming Deliveries Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Deliveries</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Deliveries', { screen: 'DeliveriesList', params: { initialFilter: 'pending' } })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {deliveries.length > 0 ? (
            deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                id={delivery.id}
                customerName={delivery.customerName}
                pickupLocation={delivery.pickupLocation}
                dropoffLocation={delivery.dropoffLocation}
                status={delivery.status}
                eta={delivery.eta}
                onPress={() => handleViewDelivery(delivery.id)}
                onStartDelivery={() => handleStartDelivery(delivery.id)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>O</Text>
              <Text style={styles.emptyTitle}>No Deliveries Assigned</Text>
              <Text style={styles.emptyText}>
                You don't have any deliveries assigned yet.{'\n'}
                Pull down to refresh.
              </Text>
            </View>
          )}
        </View>

        {/* Notifications Section */}
        {showRecentUpdates && (
          <View style={[styles.section, { marginBottom: 20 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Updates</Text>
              <TouchableOpacity onPress={handleClearAllUpdates}>
                <Text style={styles.seeAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notificationsList}>
              <NotificationBanner
                message="New delivery assigned: DEL-003"
                type="success"
              />
              <NotificationBanner
                message="Traffic delay on Lekki-Epe Expressway"
                type="warning"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* New Delivery Request Modal */}
      <NewDeliveryRequestModal
        visible={showNewDeliveryModal}
        delivery={newDeliveryRequest}
        onAccept={handleAcceptDelivery}
        onReject={handleRejectDelivery}
      />

      {/* Toast */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: toastType === 'error' ? '#EF4444' : '#10B981' }]}>
          <MaterialCommunityIcons name={toastType === 'error' ? 'close-circle' : 'check-circle'} size={20} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgba(245, 107, 76, 1)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  driverName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
    paddingRight: 2,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  statusPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusPillOnline: {
    backgroundColor: '#D1FAE5',
  },
  statusPillOffline: {
    backgroundColor: '#FEE2E2',
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillDotOnline: {
    backgroundColor: '#10B981',
  },
  statusPillDotOffline: {
    backgroundColor: '#EF4444',
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusPillTextOnline: {
    color: '#065F46',
  },
  statusPillTextOffline: {
    color: '#991B1B',
  },
  statusPillSwitch: {
    transform: [{ scale: 0.6 }],
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statsSpacer: {
    width: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 14,
    color: '#F56B4C',
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    gap: 0,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
