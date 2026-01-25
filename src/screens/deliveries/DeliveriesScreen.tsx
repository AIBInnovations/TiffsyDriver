import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Animated,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { DeliveriesStackParamList } from '../../navigation/types';
import DeliveryCard from './components/DeliveryCard';
import FilterBar from './components/FilterBar';
import BatchGroup from './components/BatchGroup';
import AvailableBatchesModal from './components/AvailableBatchesModal';
import CustomAlert from '../../components/common/CustomAlert';
import { getMyBatch, getAvailableBatches, updateDeliveryStatus as apiUpdateDeliveryStatus, acceptBatch, getDriverOrders, getDriverBatchHistory } from '../../services/deliveryService';
import type { Batch, Order, OrderStatus, AvailableBatch, DriverOrder, HistoryBatch, HistorySingleOrder } from '../../types/api';

type FilterStatus = 'all' | 'READY' | 'EN_ROUTE' | 'ARRIVED' | 'DELIVERED' | 'FAILED' | 'RETURNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY';
type SortOption = 'sequence' | 'distance' | 'status';

// Map API order to local delivery format
interface LocalDelivery {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: OrderStatus;
  eta: string;
  deliveryWindow: string;
  batchId?: string;
  distance?: string;
  sequenceNumber?: number;
  deliveryAddress?: {
    latitude?: number;
    longitude?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export default function DeliveriesScreen() {
  const route = useRoute<RouteProp<DeliveriesStackParamList, 'DeliveriesList'>>();
  const navigation = useNavigation<NativeStackNavigationProp<DeliveriesStackParamList>>();
  const initialFilter = route.params?.initialFilter;
  const selectedBatchId = route.params?.batchId;
  const completedOrderId = route.params?.completedOrderId;
  const completedOrderNumber = route.params?.completedOrderNumber;

  // Log route params for debugging
  console.log('📍 DeliveriesScreen route params:', {
    initialFilter,
    selectedBatchId,
    completedOrderId,
    completedOrderNumber,
  });

  // State
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('sequence');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedBatches, setExpandedBatches] = useState<string[]>(
    selectedBatchId ? [selectedBatchId] : []
  );
  const [viewingBatchId, setViewingBatchId] = useState<string | null>(selectedBatchId || null);
  const [showAvailableBatchesModal, setShowAvailableBatchesModal] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showNewBatchToast, setShowNewBatchToast] = useState(false);
  const [newBatchMessage, setNewBatchMessage] = useState('');
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');

  // Custom alert states
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
  }>({ visible: false, title: '', message: '' });

  // Backend data
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [availableBatches, setAvailableBatches] = useState<AvailableBatch[]>([]);
  const [previousBatchCount, setPreviousBatchCount] = useState<number>(0);
  const [driverOrders, setDriverOrders] = useState<DriverOrder[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<DriverOrder[]>([]);
  const [failedOrders, setFailedOrders] = useState<DriverOrder[]>([]);

  // History Filter
  type HistoryFilter = 'all' | 'COMPLETED' | 'PARTIAL_COMPLETE' | 'CANCELLED';
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  // History data
  const [historyBatches, setHistoryBatches] = useState<HistoryBatch[]>([]);
  const [historySingleOrders, setHistorySingleOrders] = useState<HistorySingleOrder[]>([]);
  const [expandedHistoryBatches, setExpandedHistoryBatches] = useState<string[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Filtered history batches
  const filteredHistoryBatches = useMemo(() => {
    console.log('🔍 Filtering history:', { filter: historyFilter, totalBatches: historyBatches.length });

    if (historyFilter === 'all') return historyBatches;

    // For 'FAILED' logic (user asked for 'Failed' filter but we used 'CANCELLED' in types)
    // If the batches have explicit 'FAILED' status (unlikely for batches, usually CANCELLED)
    // we should check what statuses actually exist.
    // Assuming backend returns 'CANCELLED' for failed batches.

    return historyBatches.filter(batch => {
      // Direct match
      if (batch.status === historyFilter) return true;

      return false;
    });
  }, [historyBatches, historyFilter]);

  // Fetch current batch
  const fetchCurrentBatch = useCallback(async () => {
    try {
      console.log('📥 Fetching current batch for deliveries...');
      const response = await getMyBatch();

      if (response.data.batch) {
        setCurrentBatch(response.data.batch);
        setCurrentOrders(response.data.orders || []);
        console.log('✅ Current batch loaded:', response.data.batch.batchNumber);

        // Auto-expand current batch if it matches the selected batch
        if (selectedBatchId && response.data.batch._id === selectedBatchId) {
          setExpandedBatches([response.data.batch._id]);
        } else if (response.data.batch._id) {
          setExpandedBatches([response.data.batch._id]);
        }
      } else {
        setCurrentBatch(null);
        setCurrentOrders([]);
        console.log('ℹ️ No active batch');
      }
    } catch (error: any) {
      console.error('❌ Error fetching current batch:', error);
      setCurrentBatch(null);
      setCurrentOrders([]);
    }
  }, [selectedBatchId]);

  // Fetch driver orders (active orders not in batch)
  const fetchDriverOrders = useCallback(async () => {
    try {
      console.log('📥 Fetching driver orders...');
      const response = await getDriverOrders();

      const orders = response.data.orders || [];
      setDriverOrders(orders);
      console.log('✅ Driver orders loaded:', orders.length);
    } catch (error: any) {
      console.error('❌ Error fetching driver orders:', error);
      setDriverOrders([]);
    }
  }, []);

  // Fetch delivered orders history
  const fetchDeliveredOrders = useCallback(async () => {
    try {
      console.log('📥 Fetching delivered orders history...');
      const response = await getDriverOrders('DELIVERED');

      const orders = response.data.orders || [];
      setDeliveredOrders(orders);
      console.log('✅ Delivered orders loaded:', orders.length);

      // Log order details for debugging
      if (orders.length > 0) {
        console.log('📋 Delivered order IDs:', orders.map(o => o.orderNumber).join(', '));
        orders.forEach((order, index) => {
          console.log(`📦 Order ${index + 1}:`, {
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            customer: order.customer?.name || 'Unknown',
          });
        });
      } else {
        console.log('⚠️ No delivered orders found in response');
      }
    } catch (error: any) {
      console.error('❌ Error fetching delivered orders:', error);
      console.error('❌ Error details:', error.message);
      setDeliveredOrders([]);
    }
  }, []);

  // Fetch failed orders history
  const fetchFailedOrders = useCallback(async () => {
    try {
      console.log('📥 Fetching failed orders history...');
      const response = await getDriverOrders('FAILED');

      const orders = response.data.orders || [];
      setFailedOrders(orders);
      console.log('✅ Failed orders loaded:', orders.length);
    } catch (error: any) {
      console.error('❌ Error fetching failed orders:', error);
      setFailedOrders([]);
    }
  }, []);

  // Fetch driver batch history
  const fetchDriverBatchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      console.log('📥 Fetching driver batch history...');
      const response = await getDriverBatchHistory();

      // Defensive null checks
      if (!response || !response.data) {
        console.warn('⚠️ Empty response from getDriverBatchHistory');
        setHistoryBatches([]);
        setHistorySingleOrders([]);
        return;
      }

      const allBatches = Array.isArray(response.data.batches) ? response.data.batches : [];
      const singleOrders = Array.isArray(response.data.singleOrders) ? response.data.singleOrders : [];

      // Filter out DISPATCHED batches (they're still active, not historical)
      // Only show COMPLETED, PARTIAL_COMPLETE, and CANCELLED batches in history
      const historicalBatches = allBatches.filter(batch => {
        // Extra safety check
        if (!batch || !batch.status) return false;

        return batch.status !== 'DISPATCHED' &&
               batch.status !== 'COLLECTING' &&
               batch.status !== 'READY_FOR_DISPATCH' &&
               batch.status !== 'IN_PROGRESS';
      });

      setHistoryBatches(historicalBatches);
      setHistorySingleOrders(singleOrders);

      console.log('✅ History loaded - Total Batches:', allBatches.length, 'Historical Batches:', historicalBatches.length, 'Single Orders:', singleOrders.length);
      console.log('📋 Filtered out active batches:', allBatches.length - historicalBatches.length);
    } catch (error: any) {
      console.error('❌ Error fetching driver batch history:', error);
      console.error('❌ Error details:', error.message, error.stack);
      setHistoryBatches([]);
      setHistorySingleOrders([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Fetch available batches
  const fetchAvailableBatches = useCallback(async () => {
    try {
      console.log('📥 Fetching available batches...');
      const response = await getAvailableBatches();
      const batches = response.data.batches || [];

      // Check if new batches were added
      if (previousBatchCount > 0 && batches.length > previousBatchCount) {
        const newBatchCount = batches.length - previousBatchCount;
        setNewBatchMessage(`${newBatchCount} new ${newBatchCount === 1 ? 'batch' : 'batches'} available!`);
        setShowNewBatchToast(true);

        // Auto-dismiss after 4 seconds
        setTimeout(() => {
          setShowNewBatchToast(false);
        }, 4000);
      }

      setAvailableBatches(batches);
      setPreviousBatchCount(batches.length);
      console.log('✅ Available batches loaded:', batches.length);
      console.log('📦 Batches data:', JSON.stringify(batches, null, 2));

      // Log each batch details for debugging
      batches.forEach((batch, index) => {
        console.log(`📋 Batch ${index + 1}:`, {
          id: batch._id,
          number: batch.batchNumber,
          kitchen: batch.kitchen?.name,
          zone: batch.zone?.name,
          orderCount: batch.orderCount,
          earnings: batch.estimatedEarnings,
        });
      });
    } catch (error: any) {
      console.error('❌ Error fetching available batches:', error);
      console.error('❌ Error details:', error.message);
      setAvailableBatches([]);
    }
  }, [previousBatchCount]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCurrentBatch(), fetchAvailableBatches(), fetchDriverOrders()]);
      } catch (error) {
        console.error('❌ Error loading deliveries data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchCurrentBatch, fetchAvailableBatches, fetchDriverOrders]);

  // Fetch delivered orders when DELIVERED filter is selected
  useEffect(() => {
    if (filterStatus === 'DELIVERED') {
      fetchDeliveredOrders();
    }
  }, [filterStatus, fetchDeliveredOrders]);

  // Fetch failed orders when FAILED filter is selected
  useEffect(() => {
    if (filterStatus === 'FAILED') {
      fetchFailedOrders();
    }
  }, [filterStatus, fetchFailedOrders]);

  // Fetch history when History tab is selected
  useEffect(() => {
    if (activeTab === 'history') {
      fetchDriverBatchHistory();
    }
  }, [activeTab, fetchDriverBatchHistory]);

  // Update filter and batch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Set status bar color to match header
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#FFFFFF');

      console.log('🔄 DeliveriesScreen focused - refreshing data...');

      // Show completion toast if coming back from completed delivery
      if (completedOrderId && completedOrderNumber) {
        setCompletionMessage(`Order ${completedOrderNumber} delivered successfully!`);
        setShowCompletionToast(true);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setShowCompletionToast(false);
        }, 5000);

        console.log('✅ Completed order:', completedOrderNumber);

        // Fetch delivered orders after a short delay to allow backend to update
        console.log('🔄 Scheduling delivered orders fetch...');
        setTimeout(() => {
          console.log('🔄 Fetching delivered orders after completion...');
          fetchDeliveredOrders().catch((error) => {
            console.error('❌ Error fetching delivered orders:', error);
          });
        }, 1000); // 1 second delay to allow backend to process
      }

      // Refresh data when screen comes into focus
      // Run all fetch operations to ensure we have the latest data
      Promise.all([
        fetchCurrentBatch(),
        fetchAvailableBatches(),
        fetchDriverOrders(),
      ]).then(() => {
        console.log('✅ Data refreshed on focus');
      }).catch((error) => {
        console.error('❌ Error refreshing on focus:', error);
      });

      // Fetch delivered orders if filter is set to DELIVERED
      if (filterStatus === 'DELIVERED') {
        fetchDeliveredOrders();
      }

      // Fetch failed orders if filter is set to FAILED
      if (filterStatus === 'FAILED') {
        fetchFailedOrders();
      }

      // Reset filters based on params
      if (selectedBatchId) {
        setViewingBatchId(selectedBatchId);
        setExpandedBatches([selectedBatchId]);
      } else {
        setViewingBatchId(null);
      }
    }, [selectedBatchId, filterStatus, completedOrderId, completedOrderNumber, fetchCurrentBatch, fetchAvailableBatches, fetchDriverOrders, fetchDeliveredOrders, fetchFailedOrders])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'current') {
        const promises = [fetchCurrentBatch(), fetchAvailableBatches(), fetchDriverOrders()];

        // Also fetch delivered orders if filter is set to DELIVERED
        if (filterStatus === 'DELIVERED') {
          promises.push(fetchDeliveredOrders());
        }

        // Also fetch failed orders if filter is set to FAILED
        if (filterStatus === 'FAILED') {
          promises.push(fetchFailedOrders());
        }

        await Promise.all(promises);
      } else {
        // Refresh history tab
        await fetchDriverBatchHistory();
      }
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, filterStatus, fetchCurrentBatch, fetchAvailableBatches, fetchDriverOrders, fetchDeliveredOrders, fetchFailedOrders, fetchDriverBatchHistory]);

  // Handle status change
  const handleStatusChange = async (deliveryId: string, newStatus: OrderStatus) => {
    try {
      console.log('📝 Updating order status:', deliveryId, newStatus);

      // Prevent direct DELIVERED status change - navigate to DeliveryStatusScreen
      if (newStatus === 'DELIVERED') {
        // Find the order from either currentOrders or driverOrders
        const batchOrder = currentOrders.find(o => o._id === deliveryId);
        const driverOrder = driverOrders.find(o => o._id === deliveryId);

        if (batchOrder || driverOrder) {
          // Build dropoff location string
          const address = batchOrder?.deliveryAddress || driverOrder?.deliveryAddress;
          const dropoffLocation = address
            ? [address.flatNumber, address.street, address.addressLine1, address.landmark, address.area, address.locality, address.city, address.state, address.pincode]
              .filter(Boolean)
              .join(', ')
            : '';

          // Navigate to DeliveryStatus screen for completing delivery with OTP and POD
          navigation.navigate('DeliveryStatus', {
            deliveryId: (batchOrder || driverOrder)?._id || '',
            orderId: (batchOrder || driverOrder)?.orderNumber || '',
            customerName: driverOrder?.customer?.name || address?.name || 'Customer',
            customerPhone: driverOrder?.customer?.phone || address?.phone || '',
            dropoffLocation,
            specialInstructions: driverOrder?.specialInstructions,
            currentStatus: (batchOrder || driverOrder)?.status === 'OUT_FOR_DELIVERY' ? 'in_progress' :
              (batchOrder || driverOrder)?.status === 'PICKED_UP' ? 'picked_up' : 'in_progress',
            batchId: currentBatch?._id,
          });
        }
        return;
      }

      // Check if trying to start a new delivery (handles multiple status formats)
      const isStartingDelivery = (
        newStatus === 'OUT_FOR_DELIVERY' ||
        newStatus === 'EN_ROUTE' ||
        newStatus === 'in_progress'
      );

      if (isStartingDelivery) {
        // Check if there are any active deliveries from current batch (excluding the one being started)
        const activeOrdersInCurrentBatch = currentOrders.filter(order => {
          const isActive = order.status === 'OUT_FOR_DELIVERY' ||
            order.status === 'EN_ROUTE' ||
            order.status === 'PICKED_UP' ||
            order.status === 'ARRIVED';

          return isActive && order._id !== deliveryId;
        });

        // Also check driver orders for active deliveries
        const activeDriverOrders = driverOrders.filter(order => {
          return order.status === 'OUT_FOR_DELIVERY' ||
            order.status === 'EN_ROUTE' ||
            order.status === 'PICKED_UP' ||
            order.status === 'ARRIVED';
        });

        const totalActiveOrders = activeOrdersInCurrentBatch.length + activeDriverOrders.length;

        if (totalActiveOrders > 0) {
          setAlertConfig({
            visible: true,
            title: 'Complete Active Deliveries First',
            message: `You have ${totalActiveOrders} active ${totalActiveOrders === 1 ? 'delivery' : 'deliveries'}.\n\nPlease complete all active deliveries before starting a new one.`,
            icon: 'alert-circle',
            iconColor: '#F59E0B',
          });
          return;
        }

        // Navigate to DeliveryStatus screen when starting delivery
        const batchOrder = currentOrders.find(o => o._id === deliveryId);
        const driverOrder = driverOrders.find(o => o._id === deliveryId);

        if (batchOrder || driverOrder) {
          // Build dropoff location string
          const address = batchOrder?.deliveryAddress || driverOrder?.deliveryAddress;
          const dropoffLocation = address
            ? [address.flatNumber, address.street, address.addressLine1, address.landmark, address.area, address.locality, address.city, address.state, address.pincode]
              .filter(Boolean)
              .join(', ')
            : '';

          // Navigate to DeliveryStatus screen
          navigation.navigate('DeliveryStatus', {
            deliveryId: (batchOrder || driverOrder)?._id || '',
            orderId: (batchOrder || driverOrder)?.orderNumber || '',
            customerName: driverOrder?.customer?.name || address?.name || 'Customer',
            customerPhone: driverOrder?.customer?.phone || address?.phone || '',
            dropoffLocation,
            specialInstructions: driverOrder?.specialInstructions,
            currentStatus: 'pending', // Starting delivery, so status is pending
            batchId: currentBatch?._id,
          });
        }
        return;
      }

      // Call the API to update status
      await apiUpdateDeliveryStatus(deliveryId, { status: newStatus });

      console.log('✅ Status updated successfully');

      // Refresh the current batch to get updated data
      await fetchCurrentBatch();
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: error.message || 'Failed to update delivery status. Please try again.',
        icon: 'alert-circle',
        iconColor: '#EF4444',
      });
    }
  };

  const toggleBatchExpand = (batchId: string) => {
    setExpandedBatches(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  const toggleHistoryBatchExpand = (batchId: string) => {
    setExpandedHistoryBatches(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  // Handle accept batch
  const handleAcceptBatch = async (batchId: string) => {
    try {
      console.log('🎯 Accepting batch:', batchId);
      const response = await acceptBatch(batchId);

      console.log('✅ Batch accepted successfully!');
      console.log('📦 Batch details:', response.data.batch);
      console.log('📋 Orders count:', response.data.orders?.length || 0);

      // Close modal
      setShowAvailableBatchesModal(false);

      // Refresh data to show the newly accepted batch
      await Promise.all([fetchCurrentBatch(), fetchAvailableBatches()]);

      // Auto-expand the newly accepted batch
      if (response.data.batch?._id) {
        setExpandedBatches([response.data.batch._id]);
        setViewingBatchId(response.data.batch._id);
      }

      console.log('🎉 Batch accepted:', response.data.batch.batchNumber);
    } catch (error: any) {
      console.error('❌ Error accepting batch:', error);
      // Re-throw to let modal handle the error display with better messaging
      throw error;
    }
  };

  // Handle call customer
  const handleCallCustomer = (phone: string) => {
    const phoneUrl = Platform.OS === 'ios' ? `telprompt:${phone}` : `tel:${phone}`;
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          setAlertConfig({
            visible: true,
            title: 'Error',
            message: 'Phone dialer is not available',
            icon: 'phone-off',
            iconColor: '#EF4444',
          });
        }
      })
      .catch(err => console.error('Error opening phone dialer:', err));
  };

  // Handle navigate to address
  const handleNavigate = (latitude?: number, longitude?: number, address?: string) => {
    // Prefer address-based navigation for better location recognition
    if (address) {
      const encodedAddress = encodeURIComponent(address);

      if (Platform.OS === 'ios') {
        // iOS - Use Apple Maps with address
        const appleMapsUrl = `maps://?daddr=${encodedAddress}`;
        Linking.canOpenURL(appleMapsUrl)
          .then(supported => {
            if (supported) {
              return Linking.openURL(appleMapsUrl);
            } else {
              return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
            }
          })
          .catch(err => console.error('Error opening maps:', err));
      } else {
        // Android - Use Google Maps navigation intent
        const googleMapsUrl = `google.navigation:q=${encodedAddress}`;
        Linking.canOpenURL(googleMapsUrl)
          .then(supported => {
            if (supported) {
              return Linking.openURL(googleMapsUrl);
            } else {
              return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
            }
          })
          .catch(() => {
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
          });
      }
    } else if (latitude && longitude) {
      // Fallback to coordinates if no address available
      const coordQuery = `${latitude},${longitude}`;
      if (Platform.OS === 'ios') {
        const appleMapsUrl = `maps://?daddr=${coordQuery}`;
        Linking.openURL(appleMapsUrl).catch(() => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coordQuery}`);
        });
      } else {
        const googleMapsUrl = `google.navigation:q=${coordQuery}`;
        Linking.canOpenURL(googleMapsUrl)
          .then(supported => {
            if (supported) {
              return Linking.openURL(googleMapsUrl);
            } else {
              return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coordQuery}`);
            }
          })
          .catch(() => {
            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${coordQuery}`);
          });
      }
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'No address or coordinates available',
        icon: 'map-marker-off',
        iconColor: '#EF4444',
      });
    }
  };

  // Convert API orders to local delivery format
  const convertOrderToDelivery = (order: Order, batchId?: string): LocalDelivery => {
    // Build address string - use addressLine1, locality, city
    const addressParts = [
      order.deliveryAddress?.addressLine1,
      order.deliveryAddress?.locality || order.deliveryAddress?.area,
      order.deliveryAddress?.city
    ].filter(Boolean);

    const dropoffLocation = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';

    // Handle customer data - check contactName/contactPhone fields (from schema) and fallbacks
    const customerName = order.deliveryAddress?.contactName || order.deliveryAddress?.name || 'Customer';
    const customerPhone = order.deliveryAddress?.contactPhone || order.deliveryAddress?.phone || '';

    return {
      id: order._id,
      orderId: order.orderNumber,
      customerName,
      customerPhone,
      pickupLocation: currentBatch && typeof currentBatch.kitchenId === 'object'
        ? [
            currentBatch.kitchenId.name,
            currentBatch.kitchenId.address?.addressLine1,
            currentBatch.kitchenId.address?.locality || currentBatch.kitchenId.address?.area,
            currentBatch.kitchenId.address?.city
          ].filter(Boolean).join(', ')
        : 'Kitchen',
      dropoffLocation,
      status: order.status,
      eta: '15 mins', // TODO: Calculate ETA
      deliveryWindow: currentBatch?.mealWindow || 'LUNCH',
      batchId: batchId,
      distance: '5 km', // TODO: Calculate distance
      sequenceNumber: order.sequenceNumber,
      deliveryAddress: order.deliveryAddress ? {
        latitude: order.deliveryAddress.latitude,
        longitude: order.deliveryAddress.longitude,
        coordinates: order.deliveryAddress.coordinates,
      } : undefined,
    };
  };

  // Convert driver orders to local delivery format
  const convertDriverOrderToDelivery = (order: DriverOrder): LocalDelivery => {
    // Handle missing customer data - check contactName/contactPhone fields and fallbacks
    const customerName = order.deliveryAddress?.contactName || order.customer?.name || order.deliveryAddress?.name || 'Customer';
    const customerPhone = order.deliveryAddress?.contactPhone || order.customer?.phone || order.deliveryAddress?.phone || '';

    // Build address string - use addressLine1, locality, city
    const addressParts = [
      order.deliveryAddress?.addressLine1,
      order.deliveryAddress?.locality || order.deliveryAddress?.area,
      order.deliveryAddress?.city
    ].filter(Boolean);

    const dropoffLocation = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';

    return {
      id: order._id,
      orderId: order.orderNumber,
      customerName,
      customerPhone,
      pickupLocation: 'Kitchen',
      dropoffLocation,
      status: order.status,
      eta: '15 mins',
      deliveryWindow: 'LUNCH',
      distance: '5 km',
      deliveryAddress: order.deliveryAddress ? {
        latitude: order.deliveryAddress.latitude,
        longitude: order.deliveryAddress.longitude,
        coordinates: order.deliveryAddress.coordinates,
      } : undefined,
    };
  };

  // Convert history batch order to local delivery format
  const convertHistoryOrderToDelivery = (order: Order, batch: HistoryBatch): LocalDelivery => {
    // Build address string - use addressLine1, locality, city
    const addressParts = [
      order.deliveryAddress?.addressLine1,
      order.deliveryAddress?.locality || order.deliveryAddress?.area,
      order.deliveryAddress?.city
    ].filter(Boolean);

    const dropoffLocation = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';

    // Handle customer data - check contactName/contactPhone fields (from schema) and fallbacks
    const customerName = order.deliveryAddress?.contactName || order.deliveryAddress?.name || 'Customer';
    const customerPhone = order.deliveryAddress?.contactPhone || order.deliveryAddress?.phone || '';

    return {
      id: order._id,
      orderId: order.orderNumber,
      customerName,
      customerPhone,
      pickupLocation: [
        batch.kitchen.name,
        batch.kitchen.address?.addressLine1,
        batch.kitchen.address?.locality || batch.kitchen.address?.area,
        batch.kitchen.address?.city
      ].filter(Boolean).join(', '),
      dropoffLocation,
      status: order.status,
      eta: 'Completed',
      deliveryWindow: 'LUNCH',
      batchId: batch._id,
      distance: '-',
      sequenceNumber: order.sequenceNumber,
      deliveryAddress: order.deliveryAddress ? {
        latitude: order.deliveryAddress.latitude,
        longitude: order.deliveryAddress.longitude,
        coordinates: order.deliveryAddress.coordinates,
      } : undefined,
    };
  };

  // Get deliveries from current batch
  // NOTE: This returns ALL deliveries without filtering - filtering happens in filteredAndSortedDeliveries
  const deliveries: LocalDelivery[] = useMemo(() => {
    console.log('🔄 Calculating deliveries to display:', {
      filterStatus,
      deliveredOrdersCount: deliveredOrders.length,
      failedOrdersCount: failedOrders.length,
      driverOrdersCount: driverOrders.length,
      currentOrdersCount: currentOrders.length,
    });

    // Show batch orders + delivered orders + failed orders
    const allDeliveries: LocalDelivery[] = [];
    const seenIds = new Set<string>();

    // Add current batch orders first
    if (currentBatch && currentOrders && currentOrders.length > 0) {
      const converted = currentOrders.map(order => convertOrderToDelivery(order, currentBatch._id));
      converted.forEach(delivery => {
        if (!seenIds.has(delivery.id)) {
          seenIds.add(delivery.id);
          allDeliveries.push(delivery);
        }
      });
      console.log('📦 Added', converted.length, 'orders from current batch');
    }

    // Add delivered orders (skip if already added from batch)
    const convertedDelivered = deliveredOrders.map(order => convertDriverOrderToDelivery(order));
    let deliveredAdded = 0;
    convertedDelivered.forEach(delivery => {
      if (!seenIds.has(delivery.id)) {
        seenIds.add(delivery.id);
        allDeliveries.push(delivery);
        deliveredAdded++;
      }
    });
    console.log('📦 Added', deliveredAdded, 'delivered orders (', convertedDelivered.length - deliveredAdded, 'duplicates skipped)');

    // Add failed orders (skip if already added from batch)
    const convertedFailed = failedOrders.map(order => convertDriverOrderToDelivery(order));
    let failedAdded = 0;
    convertedFailed.forEach(delivery => {
      if (!seenIds.has(delivery.id)) {
        seenIds.add(delivery.id);
        allDeliveries.push(delivery);
        failedAdded++;
      }
    });
    console.log('📦 Added', failedAdded, 'failed orders (', convertedFailed.length - failedAdded, 'duplicates skipped)');

    console.log('📦 Total unique deliveries:', allDeliveries.length);
    return allDeliveries;
  }, [currentBatch, currentOrders, driverOrders, deliveredOrders, failedOrders]);

  // Filter and sort deliveries
  const filteredAndSortedDeliveries = useMemo(() => {
    console.log('🔍 Filtering deliveries:', {
      totalDeliveries: deliveries.length,
      filterStatus,
      searchQuery: searchQuery || 'none',
    });

    let result = [...deliveries];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        d =>
          d.orderId.toLowerCase().includes(query) ||
          d.customerName.toLowerCase().includes(query)
      );
      console.log('🔍 After search filter:', result.length, 'deliveries');
    }

    // Status filter
    if (filterStatus !== 'all') {
      const beforeFilter = result.length;
      result = result.filter(d => d.status === filterStatus);
      console.log(`🔍 Status filter '${filterStatus}': ${beforeFilter} → ${result.length} deliveries`);

      if (result.length > 0) {
        console.log('📋 Filtered order statuses:', result.map(d => `${d.orderId}:${d.status}`).join(', '));
      } else {
        console.log('⚠️ No deliveries match filter:', filterStatus);
        const uniqueStatuses = Array.from(new Set(deliveries.map(d => d.status)));
        console.log('⚠️ Available statuses:', uniqueStatuses.join(', '));
      }
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'sequence') {
        return (a.sequenceNumber || 0) - (b.sequenceNumber || 0);
      }
      if (sortBy === 'distance') {
        return parseFloat(a.distance || '0') - parseFloat(b.distance || '0');
      }
      // Sort by status priority
      const statusOrder: Record<OrderStatus, number> = {
        OUT_FOR_DELIVERY: 0,
        PICKED_UP: 1,
        EN_ROUTE: 1,  // Treat same as Picked Up/In Transit
        ARRIVED: 0,   // Treat same as Out For Delivery (Active)
        READY: 2,
        DELIVERED: 3,
        FAILED: 4,
        RETURNED: 5,
      };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    return result;
  }, [deliveries, searchQuery, filterStatus, sortBy]);

  // Group by batch
  const batchedDeliveries = useMemo(() => {
    // Don't group if viewing delivered or failed order history
    if (filterStatus === 'DELIVERED' || filterStatus === 'FAILED') {
      return [];
    }

    if (!currentBatch) return [];

    // Filter if viewing specific batch
    if (viewingBatchId && currentBatch._id !== viewingBatchId) {
      return [];
    }

    return [
      {
        batch: currentBatch,
        deliveries: filteredAndSortedDeliveries,
      },
    ];
  }, [filterStatus, currentBatch, filteredAndSortedDeliveries, viewingBatchId]);

  const activeDeliveriesCount = (deliveries || []).filter(
    d => d.status === 'READY' || d.status === 'PICKED_UP' || d.status === 'OUT_FOR_DELIVERY'
  ).length;

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F56B4C" />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const clearBatchFilter = () => {
    setViewingBatchId(null);
    setExpandedBatches(currentBatch ? [currentBatch._id] : []);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            {viewingBatchId && (
              <TouchableOpacity onPress={clearBatchFilter} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.title} numberOfLines={1}>
                {viewingBatchId && currentBatch
                  ? currentBatch.batchNumber
                  : 'Your Deliveries'}
              </Text>
              <Text style={styles.subtitle}>
                {activeTab === 'history'
                  ? `${historyBatches.length} batches • ${historySingleOrders.length} individual orders`
                  : filterStatus === 'DELIVERED'
                    ? `${deliveredOrders.length} delivered orders`
                    : filterStatus === 'FAILED'
                      ? `${failedOrders.length} failed orders`
                      : currentBatch
                        ? `${activeDeliveriesCount} active • ${(deliveries || []).length} total`
                        : 'No active deliveries'}
              </Text>
            </View>
          </View>

          {/* Search Icon */}
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setShowSearchBar(!showSearchBar)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconButtonCircle, showSearchBar && styles.iconButtonActive]}>
              <MaterialCommunityIcons
                name={showSearchBar ? "magnify-minus" : "magnify"}
                size={24}
                color={showSearchBar ? "#F56B4C" : "#374151"}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'current' && styles.activeTab]}
            onPress={() => setActiveTab('current')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
              Current
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar - Only show for current tab when enabled */}
        {activeTab === 'current' && showSearchBar && (
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Order ID or Customer Name"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Filter Bar - Only show for current tab */}
      {activeTab === 'current' && (
        <FilterBar
          filterStatus={filterStatus as any}
          sortBy={sortBy as any}
          onFilterChange={setFilterStatus as any}
          onSortChange={setSortBy as any}
        />
      )}

      {/* History Filter Bar - Only show for history tab */}
      {activeTab === 'history' && (
        <View style={styles.historyFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyFilterScroll}>
            {(['all', 'COMPLETED', 'PARTIAL_COMPLETE', 'CANCELLED'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.historyFilterChip,
                  historyFilter === filter && styles.historyFilterChipActive
                ]}
                onPress={() => {
                  console.log('🔄 Selected filter:', filter);
                  setHistoryFilter(filter);
                }}
              >
                <Text style={[
                  styles.historyFilterText,
                  historyFilter === filter && styles.historyFilterTextActive
                ]}>
                  {filter === 'all' ? 'All' :
                    filter === 'COMPLETED' ? 'Completed' :
                      filter === 'PARTIAL_COMPLETE' ? 'Partial Complete' : 'Failed'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Delivery List */}
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
        {activeTab === 'current' ? (
          <>
            {!currentBatch ? (
              // No batch state
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="package-variant" size={80} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Active Batch</Text>
                <Text style={styles.emptySubtitle}>
                  Accept a batch from available batches to start delivering
                </Text>
                {availableBatches.length > 0 && (
                  <TouchableOpacity
                    style={styles.viewBatchesButton}
                    onPress={() => setShowAvailableBatchesModal(true)}
                  >
                    <MaterialCommunityIcons name="package-variant-closed" size={20} color="#FFFFFF" />
                    <Text style={styles.viewBatchesButtonText}>
                      View {availableBatches.length} Available {availableBatches.length === 1 ? 'Batch' : 'Batches'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : filteredAndSortedDeliveries.length === 0 ? (
              // Filtered empty state
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="filter-off" size={80} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>
                  {filterStatus === 'DELIVERED'
                    ? 'No delivered orders found'
                    : filterStatus === 'FAILED'
                      ? 'No failed orders found'
                      : 'No deliveries found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {filterStatus === 'DELIVERED'
                    ? 'You haven\'t delivered any orders yet'
                    : filterStatus === 'FAILED'
                      ? 'You haven\'t had any failed deliveries'
                      : 'Try adjusting your search or filters'}
                </Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                >
                  <MaterialCommunityIcons name="filter-remove" size={20} color="#FFFFFF" />
                  <Text style={styles.refreshButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Show delivered orders without batch grouping */}
                {filterStatus === 'DELIVERED' ? (
                  <View style={styles.deliveredOrdersList}>
                    {filteredAndSortedDeliveries.map(delivery => (
                      <DeliveryCard
                        key={delivery.id}
                        delivery={delivery as any}
                        onStatusChange={handleStatusChange as any}
                        onCallCustomer={handleCallCustomer}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </View>
                ) : filterStatus === 'FAILED' ? (
                  <View style={styles.deliveredOrdersList}>
                    {filteredAndSortedDeliveries.map(delivery => (
                      <DeliveryCard
                        key={delivery.id}
                        delivery={delivery as any}
                        onStatusChange={handleStatusChange as any}
                        onCallCustomer={handleCallCustomer}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </View>
                ) : (
                  <>
                    {/* Batched Deliveries */}
                    {batchedDeliveries.map(({ batch, deliveries: batchDeliveries }) => (
                      <BatchGroup
                        key={batch._id}
                        batchId={batch._id}
                        deliveryCount={batchDeliveries.length}
                        isExpanded={expandedBatches.includes(batch._id)}
                        onToggle={() => toggleBatchExpand(batch._id)}
                      >
                        {batchDeliveries.map(delivery => (
                          <DeliveryCard
                            key={delivery.id}
                            delivery={delivery as any}
                            onStatusChange={handleStatusChange as any}
                            onCallCustomer={handleCallCustomer}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </BatchGroup>
                    ))}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          /* History Tab */
          <>
            {historyLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#F56B4C" />
                <Text style={styles.loadingText}>Loading history...</Text>
              </View>
            ) : historyBatches.length === 0 && historySingleOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="history" size={80} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Delivery History</Text>
                <Text style={styles.emptySubtitle}>
                  Your completed deliveries and batches will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.historyContainer}>
                {/* History Batches */}
                {filteredHistoryBatches.length > 0 && (
                  <View style={styles.historySection}>
                    <Text style={styles.historySectionTitle}>Batches</Text>
                    {filteredHistoryBatches.map((batch) => {
                      // Safety check for batch data
                      if (!batch || !batch._id) return null;

                      const isExpanded = expandedHistoryBatches.includes(batch._id);
                      const batchOrders = Array.isArray(batch.orders)
                        ? batch.orders.map(order => convertHistoryOrderToDelivery(order, batch))
                        : [];

                      return (
                        <View key={batch._id} style={styles.historyBatchCard}>
                          <TouchableOpacity
                            onPress={() => toggleHistoryBatchExpand(batch._id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.historyBatchHeader}>
                              {/* Top Row: Batch ID and Expand Icon */}
                              <View style={styles.historyBatchHeaderTop}>
                                <Text style={styles.historyBatchNumber}>{batch.batchId}</Text>
                                <MaterialCommunityIcons
                                  name={isExpanded ? "chevron-up" : "chevron-down"}
                                  size={24}
                                  color="#6B7280"
                                  style={styles.expandIcon}
                                />
                              </View>

                              {/* Bottom Row: Date and Status Badge */}
                              <View style={styles.historyBatchHeaderBottom}>
                                <Text style={styles.historyBatchDate}>
                                  {new Date(batch.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </Text>
                                <View
                                  style={[
                                    styles.historyBatchStatusBadge,
                                    {
                                      backgroundColor:
                                        batch.status === 'COMPLETED' ? '#D1FAE5' :
                                          batch.status === 'PARTIAL_COMPLETE' ? '#DBEAFE' :
                                            '#FEE2E2',
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.historyBatchStatusText,
                                      {
                                        color:
                                          batch.status === 'COMPLETED' ? '#065F46' :
                                            batch.status === 'PARTIAL_COMPLETE' ? '#1E40AF' :
                                              '#991B1B',
                                      },
                                    ]}
                                  >
                                    {batch.status === 'COMPLETED' ? 'Completed' :
                                      batch.status === 'PARTIAL_COMPLETE' ? 'Partial' :
                                        'Failed'}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            <View style={styles.historyBatchInfo}>
                              {batch.kitchen && (
                                <View style={styles.historyBatchInfoRow}>
                                  <MaterialCommunityIcons name="store" size={16} color="#6B7280" />
                                  <Text style={styles.historyBatchInfoText}>
                                    {batch.kitchen.name || 'Unknown Kitchen'}
                                  </Text>
                                </View>
                              )}
                              {batch.zone && (
                                <View style={styles.historyBatchInfoRow}>
                                  <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
                                  <Text style={styles.historyBatchInfoText}>
                                    {batch.zone.name || 'Unknown Zone'}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.historyBatchInfoRow}>
                                <MaterialCommunityIcons name="package-variant" size={16} color="#6B7280" />
                                <Text style={styles.historyBatchInfoText}>
                                  {batch.totalOrders || 0} orders
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>

                          {/* Expanded Orders */}
                          {isExpanded && batchOrders.length > 0 && (
                            <View style={styles.historyBatchOrders}>
                              <View style={styles.historyBatchOrdersDivider} />
                              <Text style={styles.historyBatchOrdersTitle}>Orders in this batch:</Text>
                              {batchOrders.map(delivery => (
                                <DeliveryCard
                                  key={delivery.id}
                                  delivery={delivery as any}
                                  onStatusChange={handleStatusChange as any}
                                  onCallCustomer={handleCallCustomer}
                                  onNavigate={handleNavigate}
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Single Orders */}
                {historySingleOrders.length > 0 && (
                  <View style={styles.historySection}>
                    <Text style={styles.historySectionTitle}>Individual Orders</Text>
                    {historySingleOrders.map((order) => {
                      // Safety check for order data
                      if (!order || !order._id) return null;

                      return (
                        <View key={order._id} style={styles.historyOrderCard}>
                        <View style={styles.historyOrderHeader}>
                          <Text style={styles.historyOrderNumber}>{order.orderNumber}</Text>
                          <View
                            style={[
                              styles.historyOrderStatusBadge,
                              {
                                backgroundColor:
                                  order.status === 'DELIVERED'
                                    ? '#D1FAE5'
                                    : order.status === 'FAILED'
                                      ? '#FEE2E2'
                                      : '#FEF3C7',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.historyOrderStatusText,
                                {
                                  color:
                                    order.status === 'DELIVERED'
                                      ? '#065F46'
                                      : order.status === 'FAILED'
                                        ? '#991B1B'
                                        : '#92400E',
                                },
                              ]}
                            >
                              {order.status}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.historyOrderInfo}>
                          <MaterialCommunityIcons name="store" size={16} color="#6B7280" />
                          <Text style={styles.historyOrderInfoText}>
                            {order.kitchenId?.name || 'Unknown Kitchen'}
                          </Text>
                        </View>
                        <Text style={styles.historyOrderDate}>
                          {new Date(order.placedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Available Batches Modal */}
      <AvailableBatchesModal
        visible={showAvailableBatchesModal}
        batches={availableBatches}
        onClose={() => setShowAvailableBatchesModal(false)}
        onAcceptBatch={handleAcceptBatch}
      />

      {/* New Batch Toast Notification */}
      {showNewBatchToast && (
        <Animated.View style={styles.toastContainer}>
          <View style={styles.toastContent}>
            <View style={styles.toastIconContainer}>
              <MaterialCommunityIcons name="package-variant-closed" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.toastTextContainer}>
              <Text style={styles.toastTitle}>New Batch Available!</Text>
              <Text style={styles.toastMessage}>{newBatchMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.toastButton}
              onPress={() => {
                setShowNewBatchToast(false);
                setShowAvailableBatchesModal(true);
              }}
            >
              <Text style={styles.toastButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Completion Toast Notification */}
      {showCompletionToast && (
        <Animated.View style={styles.toastContainer}>
          <View style={[styles.toastContent, styles.successToastContent]}>
            <View style={[styles.toastIconContainer, styles.successToastIcon]}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.toastTextContainer}>
              <Text style={styles.toastTitle}>Delivery Completed!</Text>
              <Text style={styles.toastMessage}>{completionMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.toastButton}
              onPress={async () => {
                setShowCompletionToast(false);
                setFilterStatus('DELIVERED');
                // Fetch delivered orders to ensure we have the latest data
                console.log('🔄 Fetching delivered orders after completion...');
                await fetchDeliveredOrders();
              }}
            >
              <Text style={styles.toastButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        buttons={[{ text: 'OK', style: 'default' }]}
        onClose={() => setAlertConfig({ visible: false, title: '', message: '' })}
      />
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerIconButton: {
    padding: 4,
    marginLeft: 12,
  },
  iconButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#FFF0EB',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  deliveredOrdersList: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F56B4C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewBatchesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  viewBatchesButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  toastContainer: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  toastButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  toastButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  successToastContent: {
    backgroundColor: '#10B981',
  },
  successToastIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  historyContainer: {
    paddingHorizontal: 16,
  },
  historySection: {
    marginBottom: 24,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  historyBatchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyBatchHeader: {
    marginBottom: 12,
  },
  historyBatchHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  historyBatchHeaderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyBatchNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  historyBatchDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  historyBatchStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyBatchStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandIcon: {
    marginLeft: 4,
  },
  historyBatchInfo: {
    gap: 8,
  },
  historyBatchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyBatchInfoText: {
    fontSize: 14,
    color: '#374151',
  },
  historyBatchOrders: {
    marginTop: 12,
  },
  historyBatchOrdersDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  historyBatchOrdersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  historyOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyOrderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  historyOrderStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexShrink: 0,
  },
  historyOrderStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyOrderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  historyOrderInfoText: {
    fontSize: 14,
    color: '#374151',
  },
  historyOrderDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  historyFilterContainer: {
    paddingVertical: 4,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  historyFilterScroll: {
    paddingHorizontal: 16,
  },
  historyFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  historyFilterChipActive: {
    backgroundColor: '#F56B4C',
  },
  historyFilterText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  historyFilterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});
