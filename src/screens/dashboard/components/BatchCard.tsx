import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type BatchStatus = 'pending' | 'in_progress' | 'completed';

interface BatchCardProps {
  batchId: string;
  stops: number;
  status: BatchStatus;
  estimatedTime: string;
  onPress?: () => void;
  onStartBatch?: () => void;
}

const statusColors: Record<BatchStatus, string> = {
  pending: '#F59E0B',
  in_progress: '#3B82F6',
  completed: '#10B981',
};

const statusLabels: Record<BatchStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export default function BatchCard({
  batchId,
  stops,
  status,
  estimatedTime,
  onPress,
  onStartBatch,
}: BatchCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.batchInfo}>
          <View style={styles.batchIcon}>
            <MaterialCommunityIcons name="package-variant-closed" size={22} color="white" />
          </View>
          <View>
            <Text style={styles.batchId}>{batchId}</Text>
            <Text style={styles.stopsText}>{stops} stops</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[status] + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
          <Text style={[styles.statusText, { color: statusColors[status] }]}>
            {statusLabels[status]}
          </Text>
        </View>
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.timeLabel}>Estimated completion</Text>
        <Text style={styles.timeValue}>{estimatedTime}</Text>
      </View>

      {status === 'pending' && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onStartBatch}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Start Batch</Text>
        </TouchableOpacity>
      )}

      {status === 'in_progress' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionButtonText, styles.viewButtonText]}>View Batch</Text>
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
    marginBottom: 16,
  },
  batchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  batchIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F56B4C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  stopsText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
  viewButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#F56B4C',
  },
  viewButtonText: {
    color: '#F56B4C',
  },
});
