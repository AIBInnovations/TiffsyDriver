import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Switch,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { MainTabsParamList } from '../../navigation/types';
import StatsCard from './components/StatsCard';
import { useDriverProfileStore } from '../profile/useDriverProfileStore';
import { getMyBatch, getAvailableBatches, markBatchPickedUp } from '../../services/deliveryService';
import { getCurrentUser } from '../../services/authService';
import type { Batch, BatchSummary } from '../../types/api';

export default function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabsParamList>>();
  const { profile, setAvailabilityStatus } = useDriverProfileStore();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Backend Data
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [batchSummary, setBatchSummary] = useState<BatchSummary>({
    totalOrders: 0,
    delivered: 0,
    pending: 0,
    failed: 0,
  });
  const [availableBatchesCount, setAvailableBatchesCount] = useState(0);

  const isOnline = profile.availabilityStatus === 'ONLINE';
  const driverName = profile.fullName || 'Driver';

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

  // Fetch current batch from backend
  const fetchCurrentBatch = useCallback(async () => {
    try {
      console.log('📥 Fetching current batch...');
      const response = await getMyBatch();

      if (response.data.batch) {
        setCurrentBatch(response.data.batch);
        setBatchSummary(response.data.summary);
        console.log('✅ Current batch loaded:', response.data.batch.batchNumber);
      } else {
        setCurrentBatch(null);
        setBatchSummary({
          totalOrders: 0,
          delivered: 0,
          pending: 0,
          failed: 0,
        });
        console.log('ℹ️ No active batch');
      }
    } catch (error: any) {
      console.error('❌ Error fetching current batch:', error);
      showToast('Failed to load current batch', 'error');
    }
  }, [showToast]);

  // Fetch available batches count
  const fetchAvailableBatches = useCallback(async () => {
    try {
      console.log('📥 Fetching available batches count...');
      const response = await getAvailableBatches();
      const batchCount = response?.data?.batches?.length || 0;
      setAvailableBatchesCount(batchCount);
      console.log('✅ Available batches:', batchCount);
    } catch (error: any) {
      console.error('❌ Error fetching available batches:', error);
      setAvailableBatchesCount(0);
      // Don't show error toast for this as it's not critical
    }
  }, []);

  // Fetch user profile for updated stats
  const fetchUserProfile = useCallback(async () => {
    try {
      console.log('📥 Fetching user profile...');
      const response = await getCurrentUser();

      // Update profile store with latest data
      if (response.data.user) {
        console.log('✅ User profile updated');
      }
    } catch (error: any) {
      console.error('❌ Error fetching user profile:', error);
      // Don't show error toast for this
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCurrentBatch(),
          fetchAvailableBatches(),
          fetchUserProfile(),
        ]);
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchCurrentBatch, fetchAvailableBatches, fetchUserProfile]);

  // Auto-refresh current batch if active (every 30 seconds)
  useEffect(() => {
    if (!currentBatch) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing current batch...');
      fetchCurrentBatch();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentBatch, fetchCurrentBatch]);

  // Toggle online/offline status
  const handleToggleOnline = useCallback((value: boolean) => {
    setAvailabilityStatus(value ? 'ONLINE' : 'OFFLINE');
    showToast(value ? 'You are now online' : 'You are now offline');
  }, [setAvailabilityStatus, showToast]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchCurrentBatch(),
        fetchAvailableBatches(),
        fetchUserProfile(),
      ]);
      showToast('Dashboard refreshed');
    } catch (error) {
      console.error('❌ Error refreshing dashboard:', error);
      showToast('Failed to refresh', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchCurrentBatch, fetchAvailableBatches, fetchUserProfile, showToast]);

  // Navigate to batch details
  const handleViewBatch = useCallback(() => {
    if (!currentBatch) return;

    // Navigate to Deliveries tab with active batch
    navigation.navigate('Deliveries', {
      screen: 'DeliveriesList',
      params: { batchId: currentBatch._id },
    });
  }, [currentBatch, navigation]);

  // Navigate to available batches
  const handleFindBatches = useCallback(() => {
    navigation.navigate('Deliveries', {
      screen: 'DeliveriesList',
    });
  }, [navigation]);

  // Navigate to kitchen or continue deliveries
  const handlePrimaryAction = useCallback(async () => {
    if (!currentBatch) return;

    if (currentBatch.status === 'READY_FOR_DISPATCH') {
      // Mark batch as picked up from kitchen
      Alert.alert(
        'Pickup Batch',
        'Have you picked up all items from the kitchen?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Picked Up',
            onPress: async () => {
              try {
                await markBatchPickedUp(currentBatch._id);
                showToast('Batch marked as picked up!', 'success');
                fetchCurrentBatch();
              } catch (error: any) {
                showToast(error.message || 'Failed to mark batch as picked up', 'error');
              }
            }
          },
        ]
      );
    } else if (currentBatch.status === 'DISPATCHED') {
      // Navigate to kitchen pickup screen
      Alert.alert(
        'Navigate to Kitchen',
        'Open maps to navigate to the kitchen?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Maps',
            onPress: () => {
              // TODO: Open maps with kitchen coordinates
              showToast('Opening maps...');
            }
          },
        ]
      );
    } else if (currentBatch.status === 'IN_PROGRESS') {
      // Navigate to active delivery screen
      navigation.navigate('Deliveries', {
        screen: 'DeliveriesList',
        params: { batchId: currentBatch._id },
      });
    }
  }, [currentBatch, navigation, showToast, fetchCurrentBatch]);

  // Get batch status text and color
  const getBatchStatusInfo = () => {
    if (!currentBatch) return { text: 'No Batch', color: '#6B7280' };

    switch (currentBatch.status) {
      case 'COLLECTING':
        return { text: 'Collecting Orders', color: '#8B5CF6' };
      case 'READY_FOR_DISPATCH':
        return { text: 'Ready for Pickup', color: '#F59E0B' };
      case 'DISPATCHED':
        return { text: 'Dispatched', color: '#F59E0B' };
      case 'IN_PROGRESS':
        return { text: 'In Progress', color: '#3B82F6' };
      case 'COMPLETED':
        return { text: 'Completed', color: '#10B981' };
      case 'PARTIAL_COMPLETE':
        return { text: 'Partial Complete', color: '#F59E0B' };
      case 'CANCELLED':
        return { text: 'Cancelled', color: '#EF4444' };
      default:
        return { text: currentBatch.status, color: '#6B7280' };
    }
  };

  // Get primary action button text
  const getPrimaryActionText = () => {
    if (!currentBatch) return 'Find Batches';

    switch (currentBatch.status) {
      case 'READY_FOR_DISPATCH':
        return 'Pickup from Kitchen';
      case 'DISPATCHED':
        return 'Navigate to Kitchen';
      case 'IN_PROGRESS':
        return 'Continue Deliveries';
      default:
        return 'View Details';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F56B4C" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.greeting}>
              {new Date().getHours() < 12 ? 'Good Morning' :
               new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}
            </Text>
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

          {/* Earnings Button */}
          <TouchableOpacity style={styles.earningsButton} activeOpacity={0.7}>
            <View style={styles.earningsIconCircle}>
              <MaterialCommunityIcons name="currency-inr" size={20} color="#F56B4C" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Current Batch Card */}
        {currentBatch ? (
          <View style={styles.currentBatchSection}>
            <View style={styles.currentBatchCard}>
              <View style={styles.currentBatchHeader}>
                <View>
                  <Text style={styles.currentBatchLabel}>Current Batch</Text>
                  <Text style={styles.currentBatchNumber}>{currentBatch.batchNumber}</Text>
                </View>
                <View style={[styles.batchStatusBadge, { backgroundColor: getBatchStatusInfo().color + '20' }]}>
                  <Text style={[styles.batchStatusText, { color: getBatchStatusInfo().color }]}>
                    {getBatchStatusInfo().text}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>
                  {batchSummary.delivered} of {batchSummary.totalOrders} delivered
                </Text>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${batchSummary.totalOrders > 0
                          ? (batchSummary.delivered / batchSummary.totalOrders) * 100
                          : 0}%`
                      }
                    ]}
                  />
                </View>
              </View>

              {/* Kitchen Info */}
              {typeof currentBatch.kitchenId === 'object' && currentBatch.kitchenId !== null && (
                <View style={styles.kitchenInfo}>
                  <MaterialCommunityIcons name="store" size={20} color="#6B7280" />
                  <View style={styles.kitchenTextContainer}>
                    <Text style={styles.kitchenName}>{currentBatch.kitchenId.name}</Text>
                    <Text style={styles.kitchenArea}>{currentBatch.kitchenId.address.area}</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.batchActions}>
                <TouchableOpacity
                  style={styles.primaryBatchButton}
                  onPress={handlePrimaryAction}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={currentBatch.status === 'DISPATCHED' ? 'navigation' : 'truck-fast'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryBatchButtonText}>{getPrimaryActionText()}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBatchButton}
                  onPress={handleViewBatch}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryBatchButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* Empty State - No Active Batch */
          <View style={styles.currentBatchSection}>
            <View style={styles.emptyBatchCard}>
              <MaterialCommunityIcons name="package-variant" size={64} color="#D1D5DB" />
              <Text style={styles.emptyBatchTitle}>No Active Deliveries</Text>
              <Text style={styles.emptyBatchText}>
                Accept a batch to start earning
              </Text>
              <TouchableOpacity
                style={styles.findBatchesButton}
                onPress={handleFindBatches}
                activeOpacity={0.8}
              >
                <Text style={styles.findBatchesButtonText}>Find Batches</Text>
                {availableBatchesCount > 0 && (
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>{availableBatchesCount} Available</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <StatsCard
              label="Today's Deliveries"
              value={batchSummary.delivered.toString()}
              subLabel="Completed"
              icon="truck-check"
              iconColor="#3B82F6"
            />
            <View style={styles.statsSpacer} />
            <StatsCard
              label="Earnings"
              value="₹0"
              subLabel="Today"
              valueColor="#10B981"
              icon="cash"
              iconColor="#10B981"
            />
          </View>
          <View style={[styles.statsRow, { marginTop: 12 }]}>
            <StatsCard
              label="Success Rate"
              value={batchSummary.totalOrders > 0
                ? `${Math.round((batchSummary.delivered / batchSummary.totalOrders) * 100)}%`
                : '0%'}
              subLabel={`${batchSummary.failed} failed`}
              valueColor="#F59E0B"
              icon="star"
              iconColor="#F59E0B"
            />
            <View style={styles.statsSpacer} />
            <StatsCard
              label="Pending"
              value={batchSummary.pending.toString()}
              subLabel="Deliveries"
              valueColor="#F56B4C"
              icon="clock-outline"
              iconColor="#F56B4C"
            />
          </View>
        </View>

        {/* Available Batches Notification */}
        {availableBatchesCount > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.availableBatchesBanner}
              onPress={handleFindBatches}
              activeOpacity={0.8}
            >
              <View style={styles.availableBatchesContent}>
                <MaterialCommunityIcons name="package-variant-closed" size={24} color="#F56B4C" />
                <View style={styles.availableBatchesTextContainer}>
                  <Text style={styles.availableBatchesTitle}>
                    {availableBatchesCount} {availableBatchesCount === 1 ? 'Batch' : 'Batches'} Available
                  </Text>
                  <Text style={styles.availableBatchesSubtitle}>
                    Tap to view and accept batches
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#F56B4C" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={handleFindBatches}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="package-variant" size={28} color="#3B82F6" />
              </View>
              <Text style={styles.quickActionLabel}>Available{'\n'}Batches</Text>
              {availableBatchesCount > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>{availableBatchesCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Deliveries', { screen: 'DeliveriesList' })}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
                <MaterialCommunityIcons name="history" size={28} color="#10B981" />
              </View>
              <Text style={styles.quickActionLabel}>Delivery{'\n'}History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                <MaterialCommunityIcons name="account" size={28} color="#EF4444" />
              </View>
              <Text style={styles.quickActionLabel}>Profile{'\n'}Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="help-circle" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionLabel}>Help &{'\n'}Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#F56B4C',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  driverName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 8,
  },
  statusPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPillOnline: {
    backgroundColor: '#D1FAE5',
  },
  statusPillOffline: {
    backgroundColor: '#FEE2E2',
  },
  statusPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillDotOnline: {
    backgroundColor: '#10B981',
  },
  statusPillDotOffline: {
    backgroundColor: '#EF4444',
  },
  statusPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusPillTextOnline: {
    color: '#065F46',
  },
  statusPillTextOffline: {
    color: '#991B1B',
  },
  statusPillSwitch: {
    transform: [{ scale: 0.7 }],
  },
  earningsButton: {
    padding: 4,
    position: 'relative',
  },
  earningsIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentBatchSection: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  currentBatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  currentBatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  currentBatchLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  currentBatchNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  batchStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  batchStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  kitchenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  kitchenTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  kitchenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  kitchenArea: {
    fontSize: 14,
    color: '#6B7280',
  },
  batchActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryBatchButton: {
    flex: 1,
    backgroundColor: '#F56B4C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryBatchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBatchButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryBatchButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyBatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyBatchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBatchText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  findBatchesButton: {
    backgroundColor: '#F56B4C',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  findBatchesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableBadgeText: {
    color: '#F56B4C',
    fontSize: 12,
    fontWeight: '700',
  },
  statsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  availableBatchesBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  availableBatchesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  availableBatchesTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  availableBatchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  availableBatchesSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 18,
  },
  quickActionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F56B4C',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  quickActionBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
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
