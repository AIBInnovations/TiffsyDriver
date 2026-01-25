import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { AvailableBatch } from '../../../types/api';
import CustomAlert from '../../../components/common/CustomAlert';

interface AvailableBatchesModalProps {
  visible: boolean;
  batches: AvailableBatch[];
  onClose: () => void;
  onAcceptBatch: (batchId: string) => Promise<void>;
}

export default function AvailableBatchesModal({
  visible,
  batches,
  onClose,
  onAcceptBatch,
}: AvailableBatchesModalProps) {
  const [acceptingBatchId, setAcceptingBatchId] = useState<string | null>(null);
  const [skippedBatchIds, setSkippedBatchIds] = useState<string[]>([]);
  const [confirmBatch, setConfirmBatch] = useState<AvailableBatch | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
  }>({ visible: false, title: '', message: '' });

  // Debug logging when modal opens (using useEffect to avoid re-render loops)
  useEffect(() => {
    if (visible) {
      console.log('📊 Modal opened with batches:', batches?.length || 0);
      console.log('📦 First batch:', batches[0]);
    }
  }, [visible, batches]);

  const handleAcceptBatch = (batch: AvailableBatch) => {
    // Show confirmation dialog
    setConfirmBatch(batch);
  };

  const confirmAcceptBatch = async () => {
    if (!confirmBatch) return;

    const batch = confirmBatch;
    setConfirmBatch(null);

    try {
      setAcceptingBatchId(batch._id);
      await onAcceptBatch(batch._id);
      // Modal will be closed by parent component after successful acceptance
      setAlertConfig({
        visible: true,
        title: 'Batch Accepted!',
        message: `${batch.batchNumber} has been assigned to you.\n\nHead to ${batch.kitchen.name} to pick up ${batch.orderCount} ${batch.orderCount === 1 ? 'order' : 'orders'}.`,
        icon: 'check-circle',
        iconColor: '#10B981',
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to accept batch';

      // Check if batch was already taken
      if (errorMsg.includes('already taken') || errorMsg.includes('not available')) {
        setAlertConfig({
          visible: true,
          title: 'Batch Already Taken',
          message: 'Another driver has already accepted this batch. Please check other available batches.',
          icon: 'alert',
          iconColor: '#F59E0B',
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: errorMsg,
          icon: 'alert-circle',
          iconColor: '#EF4444',
        });
      }
      setAcceptingBatchId(null);
    }
  };

  const handleSkipBatch = (batchId: string) => {
    // Temporarily hide this batch in current session
    setSkippedBatchIds(prev => [...prev, batchId]);
  };

  // Filter out skipped batches
  const filteredBatches = useMemo(() => {
    const filtered = batches.filter(b => !skippedBatchIds.includes(b._id));
    console.log('🔍 Filtered batches count:', filtered.length);
    console.log('🔍 Skipped batch IDs:', skippedBatchIds);
    return filtered;
  }, [batches, skippedBatchIds]);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={24}
                  color="#F56B4C"
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>Available Batches</Text>
                <Text style={styles.headerSubtitle}>
                  {batches.length} {batches.length === 1 ? 'batch' : 'batches'} available
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Batch List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredBatches.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="package-variant" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Batches Available</Text>
                <Text style={styles.emptySubtitle}>
                  Check back later for new batch assignments
                </Text>
              </View>
            ) : (
              filteredBatches.map((batch) => (
                <View key={batch._id} style={styles.batchCard}>
                    {/* Batch Header */}
                    <View style={styles.batchHeader}>
                      <View style={styles.batchHeaderLeft}>
                        <View style={styles.batchIcon}>
                          <MaterialCommunityIcons
                            name="package-variant-closed"
                            size={18}
                            color="#FFFFFF"
                          />
                        </View>
                        <View style={styles.batchHeaderText}>
                          <Text style={styles.batchNumber} numberOfLines={1} ellipsizeMode="tail">
                            {batch.batchNumber}
                          </Text>
                          <View style={styles.mealWindowBadge}>
                            <MaterialCommunityIcons
                              name="clock-outline"
                              size={12}
                              color="#F59E0B"
                              style={styles.mealWindowIcon}
                            />
                            <Text style={styles.mealWindowText} numberOfLines={1} ellipsizeMode="tail">
                              {batch.mealWindow}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Kitchen Info */}
                    <View style={styles.infoSection}>
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="store" size={18} color="#6B7280" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Kitchen</Text>
                          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                            {batch.kitchen?.name || 'Kitchen Name N/A'}
                          </Text>
                          <Text style={styles.infoSubtext} numberOfLines={1} ellipsizeMode="tail">
                            {batch.kitchen?.address?.locality || batch.kitchen?.address?.area || 'Area'}, {batch.kitchen?.address?.city || 'City'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="map-marker" size={18} color="#6B7280" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Zone</Text>
                          <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="tail">
                            {batch.zone?.name || 'Zone Name N/A'}
                          </Text>
                          <Text style={styles.infoSubtext} numberOfLines={1} ellipsizeMode="tail">
                            {batch.zone?.city || 'City'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons
                          name="package-variant"
                          size={20}
                          color="#3B82F6"
                        />
                        <Text style={styles.statValue}>{batch.orderCount}</Text>
                        <Text style={styles.statLabel}>
                          {batch.orderCount === 1 ? 'Order' : 'Orders'}
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <MaterialCommunityIcons name="cash" size={20} color="#10B981" />
                        <Text style={[styles.statValue, { color: '#10B981' }]}>
                          ₹{batch.estimatedEarnings}
                        </Text>
                        <Text style={styles.statLabel}>Est. Earnings</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[
                          styles.skipButton,
                          acceptingBatchId !== null && styles.buttonDisabled,
                        ]}
                        onPress={() => handleSkipBatch(batch._id)}
                        disabled={acceptingBatchId !== null}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="close" size={18} color="#EF4444" style={styles.buttonIcon} />
                        <Text style={styles.skipButtonText} numberOfLines={1} ellipsizeMode="tail">
                          Not Interested
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.acceptButton,
                          acceptingBatchId === batch._id && styles.acceptButtonDisabled,
                          acceptingBatchId !== null && acceptingBatchId !== batch._id && styles.buttonDisabled,
                        ]}
                        onPress={() => handleAcceptBatch(batch)}
                        disabled={acceptingBatchId !== null}
                        activeOpacity={0.8}
                      >
                        {acceptingBatchId === batch._id ? (
                          <>
                            <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.acceptButtonText} numberOfLines={1} ellipsizeMode="tail">
                              Accepting...
                            </Text>
                          </>
                        ) : (
                          <>
                            <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                            <Text style={styles.acceptButtonText} numberOfLines={1} ellipsizeMode="tail">
                              Accept
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* Confirmation Alert */}
      <CustomAlert
        visible={!!confirmBatch}
        title="Accept Batch"
        message={confirmBatch ? `${confirmBatch.batchNumber}\n\nOrders: ${confirmBatch.orderCount}\nEstimated Earnings: ₹${confirmBatch.estimatedEarnings}\nMeal Window: ${confirmBatch.mealWindow}\nZone: ${confirmBatch.zone.name}\n\nAccept this batch and head to ${confirmBatch.kitchen.name}?` : ''}
        icon="package-variant-closed"
        iconColor="#F56B4C"
        buttons={[
          { text: 'Cancel', style: 'cancel', onPress: () => setConfirmBatch(null) },
          { text: 'Accept Batch', style: 'default', onPress: confirmAcceptBatch },
        ]}
        onClose={() => setConfirmBatch(null)}
      />

      {/* Status Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        buttons={[{ text: 'OK', style: 'default' }]}
        onClose={() => setAlertConfig({ visible: false, title: '', message: '' })}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 16,
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
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'center',
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    width: '100%',
  },
  batchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  batchIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F56B4C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  batchHeaderText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  batchNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    width: '100%',
  },
  mealWindowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexShrink: 1,
    marginLeft: -4,
  },
  mealWindowIcon: {
    flexShrink: 0,
    marginRight: 4,
  },
  mealWindowText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    flexShrink: 1,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonIcon: {
    flexShrink: 0,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    flex: 1,
    textAlign: 'center',
  },
  acceptButton: {
    flex: 1.2,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
});
