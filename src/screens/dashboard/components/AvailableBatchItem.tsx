import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AvailableBatch } from '../../../types/api';

interface AvailableBatchItemProps {
  batch: AvailableBatch;
  onAccept: (batchId: string) => void;
  isAccepting: boolean;
  hasActiveBatch?: boolean;
}

export default function AvailableBatchItem({
  batch,
  onAccept,
  isAccepting,
  hasActiveBatch,
}: AvailableBatchItemProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="package-variant-closed" size={20} color="#F56B4C" />
          </View>
          <View>
            <Text style={styles.batchNumber} numberOfLines={1}>
              {batch.batchNumber}
            </Text>
            <Text style={styles.mealWindow}>{batch.mealWindow} Delivery</Text>
          </View>
        </View>
      </View>

      {/* Details Grid */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="store" size={16} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {batch.kitchen.name}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {batch.zone.name}
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="package" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{batch.orderCount} Orders</Text>
          </View>
        </View>
      </View>

      {/* Action Button - Hidden if driver has an active batch */}
      {!hasActiveBatch && (
        <TouchableOpacity
          style={[styles.acceptButton, isAccepting && styles.disabledButton]}
          onPress={() => onAccept(batch._id)}
          disabled={isAccepting}
          activeOpacity={0.8}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept Batch</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12, // Reduced from 16
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12, // Reduced from 16
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF0EB', // Light orange
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  mealWindow: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  detailsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 12, // Reduced from 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#F56B4C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
