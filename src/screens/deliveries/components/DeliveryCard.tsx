import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useState, useEffect } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Delivery } from "../../../context/DeliveryContext";

interface DeliveryCardProps {
  delivery: Delivery;
  onStatusChange: (deliveryId: string, newStatus: Delivery["status"]) => void;
}

const statusConfig: Record<Delivery["status"], { bg: string; text: string; label: string; icon: string }> = {
  pending: { bg: "#F3F4F6", text: "#6B7280", label: "Pending", icon: "clock-outline" },
  in_progress: { bg: "#DBEAFE", text: "#1E40AF", label: "In Progress", icon: "truck-fast" },
  picked_up: { bg: "#FEF3C7", text: "#92400E", label: "Picked Up", icon: "package-variant" },
  completed: { bg: "#D1FAE5", text: "#065F46", label: "Completed", icon: "check-circle" },
  failed: { bg: "#FEE2E2", text: "#991B1B", label: "Failed", icon: "close-circle" },
};

export default function DeliveryCard({ delivery, onStatusChange }: DeliveryCardProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const status = statusConfig[delivery.status];

  // Timer for in-progress deliveries
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if ((delivery.status === "in_progress" || delivery.status === "picked_up") && delivery.startTime) {
      const updateElapsed = () => {
        setElapsedTime(Math.floor((Date.now() - delivery.startTime!) / 1000));
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [delivery.status, delivery.startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mins}:${secsStr}`;
  };

  const handleCall = () => {
    Linking.openURL(`tel:${delivery.customerPhone}`);
  };

  const handleNavigate = () => {
    const address = encodeURIComponent(delivery.dropoffLocation);
    Linking.openURL(`https://maps.google.com/?q=${address}`);
  };

  const getActionButton = () => {
    switch (delivery.status) {
      case "pending":
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => onStatusChange(delivery.id, "in_progress")}
          >
            <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Start Delivery</Text>
          </TouchableOpacity>
        );
      case "in_progress":
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.pickupButton]}
            onPress={() => onStatusChange(delivery.id, "picked_up")}
          >
            <MaterialCommunityIcons name="package-variant" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Mark as Picked Up</Text>
          </TouchableOpacity>
        );
      case "picked_up":
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.deliverButton]}
            onPress={() => onStatusChange(delivery.id, "completed")}
          >
            <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const showFailButton = delivery.status === "in_progress" || delivery.status === "picked_up";

  return (
    <View style={styles.card}>
      {/* Header with Order ID and Status */}
      <View style={styles.cardHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{delivery.orderId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <MaterialCommunityIcons name={status.icon} size={14} color={status.text} />
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>
        {delivery.distance && (
          <View style={styles.distanceBadge}>
            <MaterialCommunityIcons name="map-marker-distance" size={14} color="#6B7280" />
            <Text style={styles.distanceText}>{delivery.distance}</Text>
          </View>
        )}
      </View>

      {/* Timer for active deliveries */}
      {(delivery.status === "in_progress" || delivery.status === "picked_up") && delivery.startTime && (
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="timer-outline" size={16} color="#F56B4C" />
          <Text style={styles.timerText}>Time elapsed: {formatTime(elapsedTime)}</Text>
        </View>
      )}

      {/* Delivery Window */}
      <View style={styles.deliveryWindow}>
        <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
        <Text style={styles.deliveryWindowText}>Delivery Window: {delivery.deliveryWindow}</Text>
        {delivery.eta !== "-" && (
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>ETA: {delivery.eta}</Text>
          </View>
        )}
      </View>

      {/* Locations */}
      <View style={styles.locationsContainer}>
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: "#10B981" }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>{delivery.pickupLocation}</Text>
          </View>
        </View>
        <View style={styles.locationLine} />
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: "#EF4444" }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Drop-off</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>{delivery.dropoffLocation}</Text>
          </View>
        </View>
      </View>

      {/* Map Preview Placeholder */}
      <TouchableOpacity style={styles.mapPreview} onPress={handleNavigate}>
        <View style={styles.mapPlaceholder}>
          <MaterialCommunityIcons name="map" size={32} color="#9CA3AF" />
          <Text style={styles.mapPlaceholderText}>Tap to view route</Text>
        </View>
      </TouchableOpacity>

      {/* Customer Info */}
      <View style={styles.customerContainer}>
        <View style={styles.customerInfo}>
          <MaterialCommunityIcons name="account" size={20} color="#6B7280" />
          <Text style={styles.customerName}>{delivery.customerName}</Text>
        </View>
        <View style={styles.customerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setShowPhone(!showPhone)}>
            <MaterialCommunityIcons
              name={showPhone ? "eye-off" : "eye"}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleCall}>
            <MaterialCommunityIcons name="phone" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleNavigate}>
            <MaterialCommunityIcons name="navigation" size={20} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>
      {showPhone && (
        <Text style={styles.phoneNumber}>{delivery.customerPhone}</Text>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {getActionButton()}
        {showFailButton && (
          <TouchableOpacity
            style={[styles.actionButton, styles.failButton]}
            onPress={() => onStatusChange(delivery.id, "failed")}
          >
            <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Fail</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    marginHorizontal: 2,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: "#6B7280",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  deliveryWindow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  deliveryWindowText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  etaBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  etaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
  },
  locationsContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E5E7EB",
    marginLeft: 5,
    marginVertical: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  mapPreview: {
    marginBottom: 12,
  },
  mapPlaceholder: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  mapPlaceholderText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  customerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  customerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  phoneNumber: {
    fontSize: 14,
    color: "#3B82F6",
    marginBottom: 12,
    marginLeft: 28,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  startButton: {
    backgroundColor: "#3B82F6",
  },
  pickupButton: {
    backgroundColor: "#F59E0B",
  },
  deliverButton: {
    backgroundColor: "#10B981",
  },
  failButton: {
    backgroundColor: "#EF4444",
    flex: 0,
    paddingHorizontal: 16,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
