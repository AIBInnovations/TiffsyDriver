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
  Linking,
  Platform,
} from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { DashboardStackParamList } from '../../navigation/types';
import StatsCard from './components/StatsCard';
import CustomAlert from '../../components/common/CustomAlert';
import { useDriverProfileStore } from '../profile/useDriverProfileStore';
import { getMyBatch, getAvailableBatches, markBatchPickedUp, acceptBatch, getDriverBatchHistory, completeBatch } from '../../services/deliveryService';
import { startLocationTracking, stopLocationTracking, isLocationTrackingActive } from '../../services/locationService';
import { getCurrentUser } from '../../services/authService';
import { getDriverStats, updateDriverStatus, manageShift } from '../../services/driverProfileService';
import { getNotifications } from '../../services/notificationService';
import type { Batch, BatchSummary, AvailableBatch, DriverStats, HistoryBatch, HistorySingleOrder } from '../../types/api';
import AvailableBatchItem from './components/AvailableBatchItem';


export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
  const { profile, setAvailabilityStatus } = useDriverProfileStore();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Header animation
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerVisible = useRef(true);
  const HEADER_HEIGHT = 140;

  // Backend Data
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [batchSummary, setBatchSummary] = useState<BatchSummary>({
    totalOrders: 0,
    delivered: 0,
    pending: 0,
    failed: 0,
  });
  const [availableBatches, setAvailableBatches] = useState<AvailableBatch[]>([]);
  const [availableBatchesCount, setAvailableBatchesCount] = useState(0);
  const [acceptingBatch, setAcceptingBatch] = useState(false);
  const [acceptingBatchId, setAcceptingBatchId] = useState<string | null>(null);
  const [driverStats, setDriverStats] = useState<DriverStats>({
    totalDeliveries: 0,
    deliveredCount: 0,
    failedCount: 0,
    activeCount: 0,
    successRate: 0,
  });
  const [historyBatches, setHistoryBatches] = useState<HistoryBatch[]>([]);
  const [historySingleOrders, setHistorySingleOrders] = useState<HistorySingleOrder[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Custom alert states
  const [showPickupConfirm, setShowPickupConfirm] = useState(false);
  const [showNavigateConfirm, setShowNavigateConfirm] = useState(false);
  const [navigationKitchen, setNavigationKitchen] = useState<{ name: string; address: string; coordinates?: { latitude: number; longitude: number } } | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
  }>({ visible: false, title: '', message: '' });

  const [isTogglingOnline, setIsTogglingOnline] = useState(false);

  const isOnline = profile.availabilityStatus === 'ONLINE';
  const driverName = profile.fullName || 'Driver';

  // Calculate total delivered count from history
  const totalDeliveredCount = (() => {
    let count = 0;

    // Count delivered orders from batches
    historyBatches.forEach(batch => {
      batch.orders.forEach(order => {
        if (order.status === 'DELIVERED') {
          count++;
        }
      });
    });

    // Count delivered single orders
    historySingleOrders.forEach(order => {
      if (order.status === 'DELIVERED') {
        count++;
      }
    });

    return count;
  })();

  // Calculate total failed count from history
  const totalFailedCount = (() => {
    let count = 0;

    // Count failed orders from batches
    historyBatches.forEach(batch => {
      batch.orders.forEach(order => {
        if (order.status === 'FAILED') {
          count++;
        }
      });
    });

    // Count failed single orders
    historySingleOrders.forEach(order => {
      if (order.status === 'FAILED') {
        count++;
      }
    });

    return count;
  })();

  // Calculate success rate from history
  const successRate = (() => {
    const totalCompleted = totalDeliveredCount + totalFailedCount;
    if (totalCompleted === 0) return 0;
    return (totalDeliveredCount / totalCompleted) * 100;
  })();

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

        // Auto-start GPS tracking if batch is active and not already tracking
        const batchStatus = response.data.batch.status;
        if ((batchStatus === 'DISPATCHED' || batchStatus === 'IN_PROGRESS') && !isLocationTrackingActive()) {
          startLocationTracking();
        }
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

  // Fetch available batches
  const fetchAvailableBatches = useCallback(async () => {
    try {
      console.log('📥 Fetching available batches...');
      const response = await getAvailableBatches();
      const batches = response?.data?.batches || [];
      setAvailableBatches(batches);
      setAvailableBatchesCount(batches.length);
      console.log('✅ Available batches:', batches.length);
    } catch (error: any) {
      console.error('❌ Error fetching available batches:', error);
      setAvailableBatches([]);
      setAvailableBatchesCount(0);
      // Don't show error toast for this as it's not critical
    }
  }, []);

  // Fetch driver stats
  const fetchDriverStats = useCallback(async () => {
    try {
      console.log('📥 Fetching driver stats...');
      const response = await getDriverStats();

      if (response.data) {
        setDriverStats(response.data);
        console.log('✅ Driver stats loaded:', response.data);
      }
    } catch (error: any) {
      console.error('❌ Error fetching driver stats:', error);
      // Don't show error toast for this as it's not critical
    }
  }, []);

  // Fetch driver batch history
  const fetchHistory = useCallback(async () => {
    try {
      console.log('📥 Fetching driver batch history for dashboard...');
      const response = await getDriverBatchHistory();

      const allBatches = response.data.batches || [];
      const singleOrders = response.data.singleOrders || [];

      // Filter to only show completed batches (same as deliveries screen)
      const historicalBatches = allBatches.filter(batch =>
        batch.status !== 'DISPATCHED' &&
        batch.status !== 'COLLECTING' &&
        batch.status !== 'READY_FOR_DISPATCH' &&
        batch.status !== 'IN_PROGRESS'
      );

      setHistoryBatches(historicalBatches);
      setHistorySingleOrders(singleOrders);

      console.log('✅ History loaded - Batches:', historicalBatches.length, 'Single Orders:', singleOrders.length);
    } catch (error: any) {
      console.error('❌ Error fetching driver batch history:', error);
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

  // Fetch unread notification count
  const fetchUnreadNotificationCount = useCallback(async () => {
    try {
      console.log('📥 Fetching unread notification count...');
      const response = await getNotifications(10, 0); // Fetch first 10 to get unread count
      setUnreadNotificationCount(response.data.unreadCount);
      console.log('✅ Unread notification count:', response.data.unreadCount);
    } catch (error: any) {
      console.error('❌ Error fetching unread notification count:', error);
      // Don't show error toast for this as it's not critical
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
          fetchDriverStats(),
          fetchUserProfile(),
          fetchHistory(),
          fetchUnreadNotificationCount(),
        ]);
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchCurrentBatch, fetchAvailableBatches, fetchDriverStats, fetchUserProfile, fetchHistory, fetchUnreadNotificationCount]);

  // Auto-refresh current batch if active (every 30 seconds)
  useEffect(() => {
    if (!currentBatch) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing current batch...');
      fetchCurrentBatch();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentBatch, fetchCurrentBatch]);

  // Auto-poll available batches when no active batch (every 30 seconds)
  useEffect(() => {
    if (currentBatch) return;

    const interval = setInterval(() => {
      console.log('🔄 Polling available batches...');
      fetchAvailableBatches();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentBatch, fetchAvailableBatches]);

  // Set status bar color when screen is focused
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      StatusBar.setBackgroundColor('#F56B4C');
    }, [])
  );

  // Refresh unread notification count when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUnreadNotificationCount();
    }, [fetchUnreadNotificationCount])
  );

  // Toggle online/offline status with backend shift + status APIs
  const handleToggleOnline = useCallback(async (value: boolean) => {
    // Prevent going offline if there are active deliveries
    if (!value && batchSummary.pending > 0) {
      setAlertConfig({
        visible: true,
        title: 'Cannot Go Offline',
        message: `You have ${batchSummary.pending} active ${batchSummary.pending === 1 ? 'delivery' : 'deliveries'}.\n\nPlease complete all active deliveries before going offline.`,
        icon: 'truck-alert',
        iconColor: '#F59E0B',
      });
      return;
    }

    if (isTogglingOnline) return;
    setIsTogglingOnline(true);

    try {
      if (value) {
        // Going ONLINE: Start shift first, then set AVAILABLE
        await manageShift('START');
        await updateDriverStatus('AVAILABLE');
        setAvailabilityStatus('ONLINE');
        showToast('You are now online');
      } else {
        // Going OFFLINE: Set OFFLINE first, then end shift
        await updateDriverStatus('OFFLINE');
        await manageShift('END');
        setAvailabilityStatus('OFFLINE');
        showToast('You are now offline');
      }
    } catch (error: any) {
      console.error('Error toggling online status:', error);
      showToast(error.message || 'Failed to update status', 'error');
    } finally {
      setIsTogglingOnline(false);
    }
  }, [setAvailabilityStatus, showToast, batchSummary.pending, isTogglingOnline]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchCurrentBatch(),
        fetchAvailableBatches(),
        fetchDriverStats(),
        fetchUserProfile(),
        fetchHistory(),
        fetchUnreadNotificationCount(),
      ]);
      showToast('Dashboard refreshed');
    } catch (error) {
      console.error('❌ refreshing dashboard:', error);
      showToast('Failed to refresh', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [fetchCurrentBatch, fetchAvailableBatches, fetchDriverStats, fetchUserProfile, fetchHistory, fetchUnreadNotificationCount, showToast]);

  // Handle scroll for header animation
  const handleScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDiff = currentScrollY - lastScrollY.current;

    // Only trigger animation after scrolling past a threshold
    if (currentScrollY > 50) {
      if (scrollDiff > 5 && headerVisible.current) {
        // Scrolling down - hide header
        headerVisible.current = false;
        Animated.timing(headerTranslateY, {
          toValue: -HEADER_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (scrollDiff < -5 && !headerVisible.current) {
        // Scrolling up - show header
        headerVisible.current = true;
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } else if (currentScrollY <= 50 && !headerVisible.current) {
      // Near top - always show header
      headerVisible.current = true;
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = currentScrollY;
  }, [headerTranslateY]);

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

  // Accept a batch
  const handleAcceptBatch = useCallback(async (batchId: string) => {
    if (acceptingBatch) return;

    setAcceptingBatch(true);
    setAcceptingBatchId(batchId);
    try {
      console.log('📦 Accepting batch:', batchId);
      const response = await acceptBatch(batchId);
      showToast('Batch accepted successfully!', 'success');

      // Start GPS location tracking
      startLocationTracking();

      // Refresh data
      await Promise.all([fetchCurrentBatch(), fetchAvailableBatches()]);

      // Navigate to batch details
      if (response.data.batch) {
        navigation.navigate('Deliveries', {
          screen: 'DeliveriesList',
          params: { batchId: response.data.batch._id },
        });
      }
    } catch (error: any) {
      console.error('❌ Error accepting batch:', error);
      showToast(error.message || 'Failed to accept batch', 'error');
    } finally {
      setAcceptingBatch(false);
      setAcceptingBatchId(null);
    }
  }, [acceptingBatch, fetchCurrentBatch, fetchAvailableBatches, navigation, showToast]);

  // Reject a batch (simply close/dismiss)
  const handleRejectBatch = useCallback(() => {
    showToast('Batch declined');
  }, [showToast]);

  // Handle pickup confirmation
  const handlePickupConfirm = useCallback(async () => {
    if (!currentBatch) return;
    setShowPickupConfirm(false);
    try {
      await markBatchPickedUp(currentBatch._id);
      showToast('Batch marked as picked up!', 'success');
      fetchCurrentBatch();
    } catch (error: any) {
      showToast(error.message || 'Failed to mark batch as picked up', 'error');
    }
  }, [currentBatch, showToast, fetchCurrentBatch]);

  // Handle navigation to kitchen
  const handleNavigateToKitchen = useCallback(() => {
    if (!navigationKitchen) return;
    setShowNavigateConfirm(false);

    const { coordinates, address } = navigationKitchen;

    // Use coordinates for precise location when available
    if (coordinates?.latitude && coordinates?.longitude) {
      const lat = coordinates.latitude;
      const lng = coordinates.longitude;

      if (Platform.OS === 'ios') {
        const appleMapsUrl = `maps://?daddr=${lat},${lng}`;
        Linking.canOpenURL(appleMapsUrl)
          .then(supported => {
            if (supported) {
              return Linking.openURL(appleMapsUrl);
            } else {
              return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
            }
          })
          .catch(err => {
            console.error('Error opening maps:', err);
            showToast('Failed to open maps', 'error');
          });
      } else {
        // Android - Use Google Maps search URL for accurate address matching
        const encodedAddress = encodeURIComponent(address);
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        Linking.openURL(googleMapsUrl);
      }
    } else {
      // Fallback to address if coordinates not available
      const encodedAddress = encodeURIComponent(address);

      if (Platform.OS === 'ios') {
        const appleMapsUrl = `maps://?daddr=${encodedAddress}`;
        Linking.openURL(appleMapsUrl).catch(() => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
        });
      } else {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        Linking.openURL(googleMapsUrl);
      }
    }
  }, [navigationKitchen, showToast]);

  // Navigate to kitchen or continue deliveries
  const handlePrimaryAction = useCallback(async () => {
    if (!currentBatch) return;

    if (currentBatch.status === 'READY_FOR_DISPATCH') {
      // Show pickup confirmation dialog
      setShowPickupConfirm(true);
    } else if (currentBatch.status === 'DISPATCHED') {
      // Navigate to kitchen pickup screen
      const kitchen = typeof currentBatch.kitchenId === 'object' ? currentBatch.kitchenId : null;
      if (!kitchen) {
        showToast('Kitchen information not available', 'error');
        return;
      }

      const coordinates = kitchen.address?.coordinates;
      const kitchenAddress = [
        kitchen.address?.addressLine1,
        kitchen.address?.locality,
        kitchen.address?.city
      ].filter(Boolean).join(', ');

      // Set navigation data and show confirmation
      setNavigationKitchen({
        name: kitchen.name,
        address: kitchenAddress,
        coordinates: coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude } : undefined,
      });
      setShowNavigateConfirm(true);
    } else if (currentBatch.status === 'IN_PROGRESS') {
      if (batchSummary.pending === 0) {
        // All orders done — complete the batch
        try {
          await completeBatch(currentBatch._id);
          await stopLocationTracking();
          showToast('Batch completed successfully!', 'success');
          await Promise.all([fetchCurrentBatch(), fetchAvailableBatches()]);
        } catch (error: any) {
          showToast(error.message || 'Failed to complete batch', 'error');
        }
      } else {
        // Navigate to active delivery screen
        navigation.navigate('Deliveries', {
          screen: 'DeliveriesList',
          params: { batchId: currentBatch._id },
        });
      }
    }
  }, [currentBatch, batchSummary.pending, navigation, showToast, fetchCurrentBatch, fetchAvailableBatches]);

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
        if (batchSummary.pending === 0) return 'Complete Batch';
        return 'Continue Deliveries';
      default:
        return 'View Details';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F56B4C" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />

      {/* Main Content Wrapper with Background */}
      <View style={styles.mainWrapper}>
        {/* Header Section - Animated */}
        <Animated.View style={[styles.header, { transform: [{ translateY: headerTranslateY }] }]}>
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
                trackColor={{ false: '#FCA5A5', true: '#86EFAC' }}
                thumbColor={isOnline ? '#10B981' : '#EF4444'}
                style={styles.statusPillSwitch}
                disabled={isTogglingOnline}
              />
            </View>
          </View>

          {/* Notification Icon */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={28}
                color="#FFFFFF"
              />
              {/* Badge for unread count */}
              {unreadNotificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadNotificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

        </Animated.View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
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

          {/* KPI Cards - Always show */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.kpiSection}
            contentContainerStyle={styles.kpiScrollContent}
          >
            <StatsCard
              label="Total Deliveries"
              value={totalDeliveredCount.toString()}
              subLabel="Completed"
              icon="truck-check"
              iconColor="#3B82F6"
              flex={false}
            />
            <View style={styles.kpiSpacer} />
            <StatsCard
              label="Available Batches"
              value={availableBatchesCount.toString()}
              subLabel="Ready to accept"
              valueColor="#F56B4C"
              icon="package-variant"
              iconColor="#F56B4C"
              flex={false}
            />
            <View style={styles.kpiSpacer} />
            <StatsCard
              label="Active Deliveries"
              value={batchSummary.pending.toString()}
              subLabel="In progress"
              valueColor="#10B981"
              icon="truck-delivery"
              iconColor="#10B981"
              flex={false}
            />
            <View style={styles.kpiSpacer} />
            <StatsCard
              label="Success Rate"
              value={`${successRate.toFixed(0)}%`}
              subLabel={`${totalFailedCount} failed`}
              valueColor="#F59E0B"
              icon="star"
              iconColor="#F59E0B"
              flex={false}
            />
          </ScrollView>

          {/* Batch Card Section - Current Batch or Available Batch */}
          <View style={styles.currentBatchSection}>
            {currentBatch ? (
              /* Active Batch Card */
              <View style={styles.currentBatchCard}>
                <View style={styles.currentBatchHeader}>
                  <View style={styles.currentBatchHeaderLeft}>
                    <Text style={styles.currentBatchLabel}>Current Batch</Text>
                    <Text style={styles.currentBatchNumber} numberOfLines={1} ellipsizeMode="tail">
                      {currentBatch.batchNumber}
                    </Text>
                  </View>
                  <View style={[styles.batchStatusBadge, { backgroundColor: getBatchStatusInfo().color + '20' }]}>
                    <Text style={[styles.batchStatusText, { color: getBatchStatusInfo().color }]} numberOfLines={1}>
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
                      <Text style={styles.kitchenName} numberOfLines={1} ellipsizeMode="tail">
                        {currentBatch.kitchenId.name}
                      </Text>
                      <Text style={styles.kitchenArea} numberOfLines={1} ellipsizeMode="tail">
                        {[
                          currentBatch.kitchenId.address?.addressLine1,
                          currentBatch.kitchenId.address?.locality,
                          currentBatch.kitchenId.address?.city
                        ].filter(Boolean).join(', ')}
                      </Text>
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
                      style={styles.batchButtonIcon}
                    />
                    <Text style={styles.primaryBatchButtonText} numberOfLines={1} ellipsizeMode="tail">
                      {getPrimaryActionText()}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBatchButton}
                    onPress={handleViewBatch}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryBatchButtonText} numberOfLines={1}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : availableBatches.length > 0 ? (
              /* Available Batch Card */
              <View style={styles.availableBatchCard}>
                <View style={styles.availableBatchHeader}>
                  <MaterialCommunityIcons name="package-variant-closed" size={48} color="#F56B4C" />
                  <Text style={styles.availableBatchTitle}>New Batch Available!</Text>
                </View>

                <View style={styles.batchInfoSection}>
                  <View style={styles.batchInfoRow}>
                    <MaterialCommunityIcons name="store" size={20} color="#6B7280" />
                    <Text style={styles.batchInfoLabel}>Kitchen:</Text>
                    <Text style={styles.batchInfoValue}>{availableBatches[0].kitchen.name}</Text>
                  </View>

                  <View style={styles.batchInfoRow}>
                    <MaterialCommunityIcons name="map-marker" size={20} color="#6B7280" />
                    <Text style={styles.batchInfoLabel}>Zone:</Text>
                    <Text style={styles.batchInfoValue}>{availableBatches[0].zone.name}</Text>
                  </View>

                  <View style={styles.batchInfoRow}>
                    <MaterialCommunityIcons name="package" size={20} color="#6B7280" />
                    <Text style={styles.batchInfoLabel}>Orders:</Text>
                    <Text style={styles.batchInfoValue}>{availableBatches[0].orderCount}</Text>
                  </View>

                  <View style={styles.batchInfoRow}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#6B7280" />
                    <Text style={styles.batchInfoLabel}>Meal:</Text>
                    <Text style={styles.batchInfoValue}>{availableBatches[0].mealWindow}</Text>
                  </View>
                </View>

                <View style={styles.batchActionButtons}>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={handleRejectBatch}
                    activeOpacity={0.8}
                    disabled={acceptingBatch}
                  >
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.acceptButton, acceptingBatch && styles.buttonDisabled]}
                    onPress={() => handleAcceptBatch(availableBatches[0]._id)}
                    activeOpacity={0.8}
                    disabled={acceptingBatch}
                  >
                    {acceptingBatch ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.acceptButtonText}>Accept Batch</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Empty State Message */
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
                </TouchableOpacity>
              </View>
            )}
          </View>






          {/* Available Batches List Section */}
          {/* Available Batches List Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Available Batches</Text>
              {availableBatches.length > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{availableBatches.length} new</Text>
                </View>
              )}
            </View>
            {availableBatches.length > 0 ? (
              <View style={styles.batchListContainer}>
                {availableBatches.map((batch) => (
                  <AvailableBatchItem
                    key={batch._id}
                    batch={batch}
                    onAccept={handleAcceptBatch}
                    isAccepting={acceptingBatchId === batch._id}
                    hasActiveBatch={!!currentBatch}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyListContainer}>
                <MaterialCommunityIcons name="package-variant" size={48} color="#D1D5DB" />
                <Text style={styles.emptyListText}>No batches available right now</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Toast */}
      {
        toastVisible && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: toastType === 'error' ? '#EF4444' : '#10B981' }]}>
            <MaterialCommunityIcons name={toastType === 'error' ? 'close-circle' : 'check-circle'} size={20} color="#FFFFFF" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )
      }

      {/* Pickup Confirmation Alert */}
      <CustomAlert
        visible={showPickupConfirm}
        title="Pickup Batch"
        message="Have you picked up all items from the kitchen?"
        icon="package-variant"
        iconColor="#F56B4C"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setShowPickupConfirm(false) },
          { text: 'Yes, Picked Up', style: 'default', onPress: handlePickupConfirm },
        ]}
        onClose={() => setShowPickupConfirm(false)}
      />

      {/* Navigate to Kitchen Confirmation Alert */}
      <CustomAlert
        visible={showNavigateConfirm}
        title="Navigate to Kitchen"
        message={navigationKitchen ? `Open maps to navigate to ${navigationKitchen.name}?` : ''}
        icon="navigation"
        iconColor="#3B82F6"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setShowNavigateConfirm(false) },
          { text: 'Open Maps', style: 'default', onPress: handleNavigateToKitchen },
        ]}
        onClose={() => setShowNavigateConfirm(false)}
      />

      {/* General Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        buttons={[{ text: 'OK', style: 'default' }]}
        onClose={() => setAlertConfig({ visible: false, title: '', message: '' })}
      />
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F56B4C',
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
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 140,
    paddingBottom: 20,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#F56B4C',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 24,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F56B4C',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  driverName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPillOnline: {},
  statusPillOffline: {},
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
    color: '#FFFFFF',
  },
  statusPillTextOnline: {},
  statusPillTextOffline: {},
  statusPillSwitch: {
    transform: [{ scale: 0.7 }],
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
    gap: 12,
  },
  currentBatchHeaderLeft: {
    flex: 1,
    minWidth: 0,
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
    flexShrink: 0,
  },
  batchStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  batchButtonIcon: {
    flexShrink: 0,
  },
  primaryBatchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  secondaryBatchButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  secondaryBatchButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
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
  availableBatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  availableBatchHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  availableBatchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  batchInfoSection: {
    gap: 10,
    marginBottom: 16,
  },
  batchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  batchInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 70,
  },
  batchInfoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  batchActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  kpiSection: {
    marginTop: 6,
    marginBottom: 24,
    marginRight: 16,
  },
  kpiScrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 8,
  },
  kpiRow: {
    flexDirection: 'row',
  },
  kpiSpacer: {
    width: 12,
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
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  badgeContainer: {
    backgroundColor: '#F56B4C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  batchListContainer: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  emptyListText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
