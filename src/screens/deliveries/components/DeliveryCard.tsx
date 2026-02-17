import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { useState, useEffect } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Delivery } from "../../../context/DeliveryContext";
import type { OrderStatus } from "../../../types/api";
import ActionSheet from "../../../components/common/ActionSheet";
import CustomAlert from "../../../components/common/CustomAlert";
import OrderSourceBadge from "../../../components/common/OrderSourceBadge";

interface DeliveryCardProps {
  delivery: Delivery | any; // Allow both old Delivery and API order types
  onStatusChange: (deliveryId: string, newStatus: any) => void;
  onCallCustomer?: (phone: string) => void;
  onNavigate?: (latitude?: number, longitude?: number, address?: string) => void;
}

// Status config for both old context statuses and new API statuses
const statusConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  // Old context statuses
  pending: { bg: "#F3F4F6", text: "#6B7280", label: "Pending", icon: "clock-outline" },
  in_progress: { bg: "#DBEAFE", text: "#1E40AF", label: "In Progress", icon: "truck-fast" },
  picked_up: { bg: "#FEF3C7", text: "#92400E", label: "Picked Up", icon: "package-variant" },
  completed: { bg: "#D1FAE5", text: "#065F46", label: "Completed", icon: "check-circle" },
  failed: { bg: "#FEE2E2", text: "#991B1B", label: "Failed", icon: "close-circle" },

  // API statuses (new backend format)
  READY: { bg: "#F3F4F6", text: "#6B7280", label: "Ready", icon: "clock-outline" },
  EN_ROUTE: { bg: "#DBEAFE", text: "#1E40AF", label: "En Route", icon: "truck-fast" },
  ARRIVED: { bg: "#FEF3C7", text: "#92400E", label: "Arrived", icon: "package-variant" },
  DELIVERED: { bg: "#D1FAE5", text: "#065F46", label: "Delivered", icon: "check-circle" },
  FAILED: { bg: "#FEE2E2", text: "#991B1B", label: "Failed", icon: "close-circle" },
  RETURNED: { bg: "#FEE2E2", text: "#991B1B", label: "Returned", icon: "undo-variant" },

  // Legacy API statuses (for backward compatibility)
  OUT_FOR_DELIVERY: { bg: "#DBEAFE", text: "#1E40AF", label: "Out for Delivery", icon: "truck-fast" },
  PICKED_UP: { bg: "#FEF3C7", text: "#92400E", label: "Picked Up", icon: "package-variant" },
};

export default function DeliveryCard({ delivery, onStatusChange, onCallCustomer, onNavigate: onNavigateProp }: DeliveryCardProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showNavigationSheet, setShowNavigationSheet] = useState(false);
  const [showPhoneError, setShowPhoneError] = useState(false);

  const status = statusConfig[delivery.status] || {
    bg: "#F3F4F6",
    text: "#6B7280",
    label: delivery.status || "Unknown",
    icon: "help-circle"
  };

  // Timer for in-progress deliveries
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const isActive =
      delivery.status === "in_progress" ||
      delivery.status === "picked_up" ||
      delivery.status === "EN_ROUTE" ||
      delivery.status === "ARRIVED" ||
      delivery.status === "OUT_FOR_DELIVERY" ||  // Legacy
      delivery.status === "PICKED_UP";  // Legacy

    if (isActive && delivery.startTime) {
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
    if (onCallCustomer) {
      onCallCustomer(delivery.customerPhone);
    } else {
      // Fallback to simple call
      const phoneUrl = Platform.OS === 'ios' ? `telprompt:${delivery.customerPhone}` : `tel:${delivery.customerPhone}`;
      Linking.canOpenURL(phoneUrl)
        .then(supported => {
          if (supported) {
            return Linking.openURL(phoneUrl);
          } else {
            setShowPhoneError(true);
          }
        })
        .catch(err => console.error('Error opening phone dialer:', err));
    }
  };

  const openInMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    if (Platform.OS === 'ios') {
      const appleMapsUrl = `maps://?daddr=${encodedAddress}`;
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
      Linking.canOpenURL(appleMapsUrl)
        .then(supported => {
          if (supported) {
            return Linking.openURL(appleMapsUrl);
          } else {
            return Linking.openURL(webUrl);
          }
        })
        .catch(() => {
          Linking.openURL(webUrl);
        });
    } else {
      // Android - Use Google Maps search URL for accurate address matching
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      Linking.openURL(googleMapsUrl);
    }
  };

  const handleNavigate = () => {
    // Show action sheet to choose destination
    setShowNavigationSheet(true);
  };

  const handleNavigateToPickup = () => {
    if (delivery.pickupLocation) {
      openInMaps(delivery.pickupLocation);
    }
  };

  const handleNavigateToDropoff = () => {
    if (onNavigateProp) {
      // Use enhanced navigation with coordinates if available
      const latitude = delivery.deliveryAddress?.latitude || delivery.deliveryAddress?.coordinates?.latitude;
      const longitude = delivery.deliveryAddress?.longitude || delivery.deliveryAddress?.coordinates?.longitude;
      onNavigateProp(latitude, longitude, delivery.dropoffLocation);
    } else {
      openInMaps(delivery.dropoffLocation);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header with Order ID and Status */}
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>{delivery.orderId}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <OrderSourceBadge orderSource={delivery.orderSource} />
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <MaterialCommunityIcons name={status.icon} size={14} color={status.text} />
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>
      </View>

      {/* Timer for active deliveries */}
      {(delivery.status === "in_progress" || delivery.status === "picked_up" || delivery.status === "EN_ROUTE" || delivery.status === "ARRIVED" || delivery.status === "OUT_FOR_DELIVERY" || delivery.status === "PICKED_UP") && delivery.startTime && (
        <View style={styles.timerContainer}>
          <MaterialCommunityIcons name="timer-outline" size={16} color="#F56B4C" />
          <Text style={styles.timerText}>Time elapsed: {formatTime(elapsedTime)}</Text>
        </View>
      )}

      {/* Delivery Window */}
      <View style={styles.deliveryWindow}>
        <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
        <Text style={styles.deliveryWindowText}>Delivery Window: {delivery.deliveryWindow}</Text>
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

      {/* Route Preview */}
      <TouchableOpacity style={styles.routePreview} onPress={handleNavigate} activeOpacity={0.8}>
        <View style={styles.routeVisualization}>
          {/* Pickup marker */}
          <View style={styles.markerContainer}>
            <View style={[styles.marker, styles.pickupMarker]}>
              <MaterialCommunityIcons name="package-variant" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.markerLabel}>Pickup</Text>
          </View>

          {/* Route line */}
          <View style={styles.routeLine}>
            <View style={styles.routeLineDashed} />
            <MaterialCommunityIcons name="truck-fast-outline" size={20} color="#3B82F6" />
            <View style={styles.routeLineDashed} />
          </View>

          {/* Dropoff marker */}
          <View style={styles.markerContainer}>
            <View style={[styles.marker, styles.dropoffMarker]}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.markerLabel}>Drop-off</Text>
          </View>
        </View>

        {/* Tap hint */}
        <View style={styles.tapHint}>
          <MaterialCommunityIcons name="cursor-default-click" size={14} color="#6B7280" />
          <Text style={styles.tapHintText}>Tap to open in maps</Text>
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
        </View>
      </View>
      {showPhone && (
        <Text style={styles.phoneNumber}>{delivery.customerPhone}</Text>
      )}

      {/* Navigation Action Sheet */}
      <ActionSheet
        visible={showNavigationSheet}
        title="Open Navigation"
        message="Choose a destination"
        options={[
          {
            label: "Navigate to Pickup",
            icon: "package-variant",
            iconColor: "#10B981",
            onPress: handleNavigateToPickup,
          },
          {
            label: "Navigate to Drop-off",
            icon: "map-marker",
            iconColor: "#EF4444",
            onPress: handleNavigateToDropoff,
          },
        ]}
        onClose={() => setShowNavigationSheet(false)}
      />

      {/* Phone Error Alert */}
      <CustomAlert
        visible={showPhoneError}
        title="Error"
        message="Phone dialer is not available"
        icon="phone-off"
        iconColor="#EF4444"
        buttons={[{ text: "OK", style: "default" }]}
        onClose={() => setShowPhoneError(false)}
      />
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
    alignItems: "center",
    marginBottom: 12,
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
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
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
    flexWrap: "wrap",
  },
  deliveryWindowText: {
    fontSize: 13,
    color: "#6B7280",
    flexShrink: 1,
  },
  locationsContainer: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 40,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
    marginRight: 12,
    flexShrink: 0,
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
    minWidth: 0,
  },
  locationLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  locationAddress: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    flexWrap: "wrap",
  },
  routePreview: {
    marginBottom: 12,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    height: 100,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderStyle: "dashed",
    justifyContent: "center",
  },
  routeVisualization: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  pickupMarker: {
    backgroundColor: "#10B981",
  },
  dropoffMarker: {
    backgroundColor: "#EF4444",
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
  },
  routeLine: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    gap: 8,
  },
  routeLineDashed: {
    flex: 1,
    height: 2,
    backgroundColor: "#BFDBFE",
    borderRadius: 1,
  },
  tapHint: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tapHintText: {
    fontSize: 11,
    color: "#6B7280",
  },
  customerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    marginLeft: 28,
  },
});
