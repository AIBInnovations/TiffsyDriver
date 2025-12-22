import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useMemo } from "react";
import { useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { DeliveriesStackParamList } from "../../navigation/types";
import DeliveryCard from "./components/DeliveryCard";
import FilterBar from "./components/FilterBar";
import BatchGroup from "./components/BatchGroup";
import { useDeliveryContext, Delivery, Batch } from "../../context/DeliveryContext";

type FilterStatus = "all" | "pending" | "in_progress" | "picked_up" | "completed" | "failed";
type SortOption = "eta" | "distance" | "status";

export default function DeliveriesScreen() {
  const route = useRoute<RouteProp<DeliveriesStackParamList, 'DeliveriesList'>>();
  const initialFilter = route.params?.initialFilter;
  const selectedBatchId = route.params?.batchId;

  const { deliveries, batches, updateDeliveryStatus } = useDeliveryContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(initialFilter || "all");
  const [sortBy, setSortBy] = useState<SortOption>("eta");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedBatches, setExpandedBatches] = useState<string[]>(
    selectedBatchId ? [selectedBatchId] : ["BATCH-001", "BATCH-002", "BATCH-003"]
  );
  const [viewingBatchId, setViewingBatchId] = useState<string | null>(selectedBatchId || null);

  // Update filter and batch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset filter based on params
      if (initialFilter) {
        setFilterStatus(initialFilter);
      } else {
        setFilterStatus("all");
      }

      // Reset batch filter based on params
      if (selectedBatchId) {
        setViewingBatchId(selectedBatchId);
        setExpandedBatches([selectedBatchId]);
      } else {
        setViewingBatchId(null);
        setExpandedBatches(["BATCH-001", "BATCH-002", "BATCH-003"]);
      }
    }, [initialFilter, selectedBatchId])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleStatusChange = (deliveryId: string, newStatus: Delivery["status"]) => {
    updateDeliveryStatus(deliveryId, newStatus);
  };

  const toggleBatchExpand = (batchId: string) => {
    setExpandedBatches(prev =>
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

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
    if (filterStatus !== "all") {
      result = result.filter(d => d.status === filterStatus);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "distance") {
        return parseFloat(a.distance || "0") - parseFloat(b.distance || "0");
      }
      if (sortBy === "eta") {
        const etaA = a.eta === "-" ? 999 : parseInt(a.eta);
        const etaB = b.eta === "-" ? 999 : parseInt(b.eta);
        return etaA - etaB;
      }
      // Sort by status priority
      const statusOrder = { in_progress: 0, picked_up: 1, pending: 2, completed: 3, failed: 4 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    return result;
  }, [deliveries, searchQuery, filterStatus, sortBy]);

  // Group deliveries by batch
  const { batchedDeliveries, unbatchedDeliveries } = useMemo(() => {
    const batched: { batch: Batch; deliveries: Delivery[] }[] = [];
    const unbatched: Delivery[] = [];

    // Filter batches if viewing a specific batch
    const batchesToShow = viewingBatchId
      ? batches.filter(b => b.batchId === viewingBatchId)
      : batches;

    batchesToShow.forEach(batch => {
      const batchDeliveries = filteredAndSortedDeliveries.filter(d =>
        batch.deliveryIds.includes(d.id)
      );
      if (batchDeliveries.length > 0) {
        batched.push({ batch, deliveries: batchDeliveries });
      }
    });

    // Only show unbatched deliveries when not viewing a specific batch
    if (!viewingBatchId) {
      filteredAndSortedDeliveries.forEach(d => {
        if (!d.batchId) {
          unbatched.push(d);
        }
      });
    }

    return { batchedDeliveries: batched, unbatchedDeliveries: unbatched };
  }, [filteredAndSortedDeliveries, viewingBatchId]);

  const activeDeliveriesCount = deliveries.filter(
    d => d.status === "pending" || d.status === "in_progress" || d.status === "picked_up"
  ).length;

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
    setExpandedBatches(["BATCH-001", "BATCH-002", "BATCH-003"]);
  };

  // Get batch info for header
  const viewingBatch = viewingBatchId
    ? batches.find(b => b.batchId === viewingBatchId)
    : null;

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
                {viewingBatchId ? `Batch ${viewingBatchId.replace('BATCH-', '#')}` : 'Your Deliveries'}
              </Text>
              <Text style={styles.subtitle}>
                {viewingBatchId
                  ? `${viewingBatch?.deliveryIds.length || 0} deliveries in this batch`
                  : `${activeDeliveriesCount} active • ${deliveries.length} total`}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialCommunityIcons name="bell-outline" size={28} color="#F56B4C" />
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
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Bar */}
      <FilterBar
        filterStatus={filterStatus}
        sortBy={sortBy}
        onFilterChange={setFilterStatus}
        onSortChange={setSortBy}
      />

      {/* Delivery List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F56B4C"]}
            tintColor="#F56B4C"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredAndSortedDeliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package-variant" size={80} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchQuery || filterStatus !== "all"
                ? "No deliveries found"
                : "You're all caught up!"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "No deliveries assigned at the moment"}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>Check for New Deliveries</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Batched Deliveries */}
            {batchedDeliveries.map(({ batch, deliveries: batchDeliveries }) => (
              <BatchGroup
                key={batch.batchId}
                batchId={batch.batchId}
                deliveryCount={batchDeliveries.length}
                isExpanded={expandedBatches.includes(batch.batchId)}
                onToggle={() => toggleBatchExpand(batch.batchId)}
              >
                {batchDeliveries.map(delivery => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </BatchGroup>
            ))}

            {/* Unbatched Deliveries */}
            {unbatchedDeliveries.map(delivery => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onStatusChange={handleStatusChange}
              />
            ))}
          </>
        )}

      </ScrollView>
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
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 0,
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
});
