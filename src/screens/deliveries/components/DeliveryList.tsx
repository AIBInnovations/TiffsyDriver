import { FlatList, View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Delivery {
  id: string;
  customerName: string;
  address: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  time: string;
  phone: string;
}

interface DeliveryListProps {
  deliveries: Delivery[];
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  in_progress: { bg: "#DBEAFE", text: "#1E40AF" },
  completed: { bg: "#D1FAE5", text: "#065F46" },
  failed: { bg: "#FEE2E2", text: "#991B1B" },
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  failed: "Failed",
};

export default function DeliveryList({ deliveries }: DeliveryListProps) {
  const renderItem = ({ item }: { item: Delivery }) => (
    <TouchableOpacity
      onPress={() => {
        // TODO: Navigate to delivery detail
      }}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.deliveryId}>{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status].bg }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status].text }]}>
            {statusLabels[item.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.customerName}>{item.customerName}</Text>
      <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.time}>{item.time}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={deliveries}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No deliveries found</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 16,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deliveryId: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  phone: {
    fontSize: 12,
    color: '#3B82F6',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
