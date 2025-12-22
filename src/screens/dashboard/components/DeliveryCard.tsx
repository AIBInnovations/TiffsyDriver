import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type DeliveryStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface DeliveryCardProps {
  id: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: DeliveryStatus;
  eta: string;
  onPress?: () => void;
  onStartDelivery?: () => void;
}

const statusColors: Record<DeliveryStatus, string> = {
  pending: '#F59E0B',
  in_progress: '#3B82F6',
  completed: '#10B981',
  failed: '#EF4444',
};

const statusLabels: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
};

export default function DeliveryCard({
  id,
  customerName,
  pickupLocation,
  dropoffLocation,
  status,
  eta,
  onPress,
  onStartDelivery,
}: DeliveryCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[status] + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
            <Text style={[styles.statusText, { color: statusColors[status] }]}>
              {statusLabels[status]}
            </Text>
          </View>
        </View>
        <Text style={styles.eta}>ETA: {eta}</Text>
      </View>

      {/* Customer Name */}
      <Text style={styles.customerName}>{customerName}</Text>

      {/* Locations */}
      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <View style={styles.locationIcon}>
            <View style={styles.pickupDot} />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText} numberOfLines={1}>{pickupLocation}</Text>
          </View>
        </View>

        <View style={styles.locationLine} />

        <View style={styles.locationRow}>
          <View style={styles.locationIcon}>
            <View style={styles.dropoffDot} />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Drop-off</Text>
            <Text style={styles.locationText} numberOfLines={1}>{dropoffLocation}</Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      {status === 'pending' && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onStartDelivery}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Start Delivery</Text>
        </TouchableOpacity>
      )}

      {status === 'in_progress' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.viewDetailsButton]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionButtonText, styles.viewDetailsText]}>View Details</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  eta: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  locationContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginTop: 4,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginTop: 4,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#D1D5DB',
    marginLeft: 11,
    marginVertical: 4,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#F56B4C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  viewDetailsButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#F56B4C',
  },
  viewDetailsText: {
    color: '#F56B4C',
  },
});
