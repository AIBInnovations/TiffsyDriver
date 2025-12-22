import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface DeliveryCompleteModalProps {
  visible: boolean;
  orderId: string;
  customerName: string;
  hasNextDelivery: boolean;
  nextDeliveryInfo?: {
    orderId: string;
    customerName: string;
    stopNumber: number;
    totalStops: number;
  };
  onNextDelivery: () => void;
  onViewAllDeliveries: () => void;
  onClose: () => void;
}

export default function DeliveryCompleteModal({
  visible,
  orderId,
  customerName,
  hasNextDelivery,
  nextDeliveryInfo,
  onNextDelivery,
  onViewAllDeliveries,
  onClose,
}: DeliveryCompleteModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Delivery Complete!</Text>

          {/* Completed Order Info */}
          <View style={styles.completedInfo}>
            <Text style={styles.completedLabel}>Successfully delivered</Text>
            <Text style={styles.completedOrderId}>{orderId}</Text>
            <Text style={styles.completedCustomer}>to {customerName}</Text>
          </View>

          {/* Next Delivery Preview */}
          {hasNextDelivery && nextDeliveryInfo && (
            <View style={styles.nextDeliveryCard}>
              <View style={styles.nextDeliveryHeader}>
                <MaterialCommunityIcons name="arrow-right-circle" size={20} color="#F56B4C" />
                <Text style={styles.nextDeliveryTitle}>Next Delivery</Text>
                <View style={styles.stopBadge}>
                  <Text style={styles.stopBadgeText}>
                    {nextDeliveryInfo.stopNumber}/{nextDeliveryInfo.totalStops}
                  </Text>
                </View>
              </View>
              <Text style={styles.nextOrderId}>{nextDeliveryInfo.orderId}</Text>
              <Text style={styles.nextCustomer}>{nextDeliveryInfo.customerName}</Text>
            </View>
          )}

          {/* No More Deliveries Message */}
          {!hasNextDelivery && (
            <View style={styles.allDoneCard}>
              <MaterialCommunityIcons name="party-popper" size={24} color="#F56B4C" />
              <Text style={styles.allDoneText}>All deliveries completed!</Text>
              <Text style={styles.allDoneSubtext}>Great job today!</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {hasNextDelivery ? (
              <>
                <Pressable style={styles.primaryButton} onPress={onNextDelivery}>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Next Delivery</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={onViewAllDeliveries}>
                  <Text style={styles.secondaryButtonText}>View All Deliveries</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable style={styles.primaryButton} onPress={onViewAllDeliveries}>
                  <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>View Deliveries</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={onClose}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  completedInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  completedLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  completedOrderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  completedCustomer: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  nextDeliveryCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 20,
  },
  nextDeliveryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  nextDeliveryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F56B4C",
    flex: 1,
  },
  stopBadge: {
    backgroundColor: "#F56B4C",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  stopBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  nextOrderId: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  nextCustomer: {
    fontSize: 14,
    color: "#6B7280",
  },
  allDoneCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  allDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  allDoneSubtext: {
    fontSize: 14,
    color: "#6B7280",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F56B4C",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
  },
});
