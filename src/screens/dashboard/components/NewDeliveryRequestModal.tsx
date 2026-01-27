import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useRef, useEffect } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export interface NewDeliveryRequest {
  id: string;
  orderId: string;
  customerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  estimatedDistance: string;
  deliveryWindow: string;
}

interface NewDeliveryRequestModalProps {
  visible: boolean;
  delivery: NewDeliveryRequest | null;
  onAccept: (delivery: NewDeliveryRequest) => void;
  onReject: (delivery: NewDeliveryRequest) => void;
}

export default function NewDeliveryRequestModal({
  visible,
  delivery,
  onAccept,
  onReject,
}: NewDeliveryRequestModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!delivery) return null;

  const handleAccept = () => {
    onAccept(delivery);
  };

  const handleReject = () => {
    onReject(delivery);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="package-variant" size={28} color="#F56B4C" />
            </View>
            <Text style={styles.headerTitle}>New Delivery Request</Text>
            <Text style={styles.headerSubtitle}>{delivery.orderId}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Customer Info */}
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialCommunityIcons name="account" size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Customer</Text>
                <Text style={styles.infoValue}>{delivery.customerName}</Text>
              </View>
            </View>

            {/* Pickup Location */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: "#D1FAE5" }]}>
                <MaterialCommunityIcons name="map-marker" size={18} color="#10B981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Pickup</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{delivery.pickupLocation}</Text>
              </View>
            </View>

            {/* Dropoff Location */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: "#FEE2E2" }]}>
                <MaterialCommunityIcons name="map-marker-check" size={18} color="#EF4444" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Drop-off</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{delivery.dropoffLocation}</Text>
              </View>
            </View>

            {/* Delivery Details Row */}
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="map-marker-distance" size={20} color="#3B82F6" />
                <Text style={styles.detailValue}>{delivery.estimatedDistance}</Text>
                <Text style={styles.detailLabel}>Distance</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#F59E0B" />
                <Text style={styles.detailValue}>{delivery.deliveryWindow}</Text>
                <Text style={styles.detailLabel}>Window</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleReject}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close" size={20} color="#EF4444" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  content: {
    padding: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    lineHeight: 20,
  },
  detailsRow: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#10B981",
    gap: 6,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
