import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { DeliveriesStackParamList } from '../../navigation/types';
import DeliveryCard from './components/DeliveryCard';
import FilterBar from './components/FilterBar';
import BatchGroup from './components/BatchGroup';
import AvailableBatchesModal from './components/AvailableBatchesModal';
import { getMyBatch, getAvailableBatches, updateDeliveryStatus as apiUpdateDeliveryStatus, acceptBatch } from '../../services/deliveryService';
import type { Batch, Order, OrderStatus, AvailableBatch } from '../../types/api';

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
}

export default function DeliveriesScreen() {
  const route = useRoute<RouteProp<DeliveriesStackParamList, 'DeliveriesList'>>();
  const initialFilter = route.params?.initialFilter;
  const selectedBatchId = route.params?.batchId;

  // State
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

  // Backend data
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [availableBatches, setAvailableBatches] = useState<AvailableBatch[]>([]);

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

  // Fetch available batches
  const fetchAvailableBatches = useCallback(async () => {
    try {
      console.log('📥 Fetching available batches...');
      const response = await getAvailableBatches();
      const batches = response.data.batches || [];
      setAvailableBatches(batches);
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
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchCurrentBatch(), fetchAvailableBatches()]);
      } catch (error) {
        console.error('❌ Error loading deliveries data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchCurrentBatch, fetchAvailableBatches]);

  // Update filter and batch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen comes into focus
      fetchCurrentBatch();
      fetchAvailableBatches();

      // Reset filters based on params
      if (selectedBatchId) {
        setViewingBatchId(selectedBatchId);
        setExpandedBatches([selectedBatchId]);
      } else {
        setViewingBatchId(null);
      }
    }, [selectedBatchId, fetchCurrentBatch, fetchAvailableBatches])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchCurrentBatch(), fetchAvailableBatches()]);
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCurrentBatch, fetchAvailableBatches]);

  // Handle status change
  const handleStatusChange = async (deliveryId: string, newStatus: OrderStatus) => {
    try {
      console.log('📝 Updating order status:', deliveryId, newStatus);

      // Call the API to update status
      await apiUpdateDeliveryStatus(deliveryId, { status: newStatus });

      console.log('✅ Status updated successfully');

      // Refresh the current batch to get updated data
      await fetchCurrentBatch();
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      // Optionally show an alert to the user
      Alert.alert(
        'Error',
        error.message || 'Failed to update delivery status. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleBatchExpand = (batchId: string) => {
    setExpandedBatches(prev =>
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

  // Convert API orders to local delivery format
  const convertOrderToDelivery = (order: Order, batchId?: string): LocalDelivery => {
    return {
      id: order._id,
      orderId: order.orderNumber,
      customerName: order.deliveryAddress.name || 'Customer',
      customerPhone: order.deliveryAddress.phone || '',
      pickupLocation: currentBatch && typeof currentBatch.kitchenId === 'object'
        ? `${currentBatch.kitchenId.name}, ${currentBatch.kitchenId.address.area}`
        : 'Kitchen',
      dropoffLocation: `${order.deliveryAddress.street}, ${order.deliveryAddress.area}, ${order.deliveryAddress.city}`,
      status: order.status,
      eta: '15 mins', // TODO: Calculate ETA
      deliveryWindow: currentBatch?.mealWindow || 'LUNCH',
      batchId: batchId,
      distance: '5 km', // TODO: Calculate distance
      sequenceNumber: order.sequenceNumber,
    };
  };

  // Get deliveries from current batch
  const deliveries: LocalDelivery[] = useMemo(() => {
    if (!currentBatch || !currentOrders || currentOrders.length === 0) {
      console.log('📭 No deliveries to display - currentBatch:', !!currentBatch, 'currentOrders:', currentOrders?.length || 0);
      return [];
    }

    const converted = currentOrders.map(order => convertOrderToDelivery(order, currentBatch._id));
    console.log('📦 Displaying', converted.length, 'deliveries from API');
    console.log('📋 Order IDs:', converted.map(d => d.orderId).join(', '));
    return converted;
  }, [currentBatch, currentOrders]);

  // Filter and sort deliveries
  const filteredAndSortedDeliveries = useMemo(() => {
    let result = [...deliveries];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        d =>
          d.orderId.toLowerCase().includes(query) ||
          d.customerName.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(d => d.status === filterStatus);
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
  }, [currentBatch, filteredAndSortedDeliveries, viewingBatchId]);

  const activeDeliveriesCount = (deliveries || []).filter(
    d => d.status === 'READY' || d.status === 'PICKED_UP' || d.status === 'OUT_FOR_DELIVERY'
  ).length;

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
              <Text style={styles.title}>
                {viewingBatchId && currentBatch
                  ? currentBatch.batchNumber
                  : 'Your Deliveries'}
              </Text>
              <Text style={styles.subtitle}>
                {currentBatch
                  ? `${activeDeliveriesCount} active • ${(deliveries || []).length} total`
                  : 'No active deliveries'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => availableBatches.length > 0 && setShowAvailableBatchesModal(true)}
          >
            <MaterialCommunityIcons name="bell-outline" size={28} color="#F56B4C" />
            {availableBatches.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{availableBatches.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
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
      </View>

      {/* Filter Bar */}
      <FilterBar
        filterStatus={filterStatus as any}
        sortBy={sortBy as any}
        onFilterChange={setFilterStatus as any}
        onSortChange={setSortBy as any}
      />

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
            <Text style={styles.emptyTitle}>No deliveries found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
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
                  />
                ))}
              </BatchGroup>
            ))}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
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
});
