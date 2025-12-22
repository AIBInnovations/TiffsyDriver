import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useState } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface OrderDetailsCardProps {
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  deliveryWindow?: string;
  specialInstructions?: string;
  onLocationPress?: (location: string, type: "pickup" | "dropoff") => void;
}

export default function OrderDetailsCard({
  orderId,
  customerName,
  customerPhone,
  pickupLocation,
  dropoffLocation,
  deliveryWindow,
  specialInstructions,
  onLocationPress,
}: OrderDetailsCardProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleCall = () => {
    if (customerPhone) {
      Linking.openURL(`tel:${customerPhone}`);
    }
  };

  const handleLocationPress = (location: string | undefined, type: "pickup" | "dropoff") => {
    if (location) {
      if (onLocationPress) {
        onLocationPress(location, type);
      } else {
        const address = encodeURIComponent(location);
        Linking.openURL(`https://maps.google.com/?q=${address}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Order ID */}
      <View style={styles.header}>
        <View style={styles.orderIdContainer}>
          <MaterialCommunityIcons name="receipt" size={20} color="#3B82F6" />
          <Text style={styles.orderId}>{orderId}</Text>
        </View>
      </View>

      {/* Customer Info */}
      {customerName && (
        <View style={styles.customerSection}>
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <MaterialCommunityIcons name="account" size={20} color="#6B7280" />
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{customerName}</Text>
              {showPhone && customerPhone && (
                <Text style={styles.customerPhone}>{customerPhone}</Text>
              )}
            </View>
          </View>
          <View style={styles.customerActions}>
            {customerPhone && (
              <>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowPhone(!showPhone)}
                >
                  <MaterialCommunityIcons
                    name={showPhone ? "eye-off" : "eye"}
                    size={18}
                    color="#6B7280"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                  <MaterialCommunityIcons name="phone" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Delivery Window */}
      {deliveryWindow && (
        <View style={styles.deliveryWindowContainer}>
          <MaterialCommunityIcons name="clock-outline" size={18} color="#F59E0B" />
          <View style={styles.deliveryWindowInfo}>
            <Text style={styles.deliveryWindowLabel}>Delivery Window</Text>
            <Text style={styles.deliveryWindowTime}>{deliveryWindow}</Text>
          </View>
        </View>
      )}

      {/* Locations */}
      <View style={styles.locationsContainer}>
        {/* Pickup Location */}
        {pickupLocation && (
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => handleLocationPress(pickupLocation, "pickup")}
            activeOpacity={0.7}
          >
            <View style={styles.locationIconContainer}>
              <View style={[styles.locationDot, styles.pickupDot]} />
              <View style={styles.locationLine} />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>PICKUP</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {pickupLocation}
              </Text>
              <View style={styles.navigateHint}>
                <MaterialCommunityIcons name="navigation" size={12} color="#3B82F6" />
                <Text style={styles.navigateHintText}>Tap to navigate</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Dropoff Location */}
        {dropoffLocation && (
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => handleLocationPress(dropoffLocation, "dropoff")}
            activeOpacity={0.7}
          >
            <View style={styles.locationIconContainer}>
              <View style={[styles.locationDot, styles.dropoffDot]} />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>DROP-OFF</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {dropoffLocation}
              </Text>
              <View style={styles.navigateHint}>
                <MaterialCommunityIcons name="navigation" size={12} color="#3B82F6" />
                <Text style={styles.navigateHintText}>Tap to navigate</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Special Instructions */}
      {specialInstructions && (
        <View style={styles.instructionsContainer}>
          <TouchableOpacity
            style={styles.instructionsHeader}
            onPress={() => setShowInstructions(!showInstructions)}
          >
            <View style={styles.instructionsHeaderLeft}>
              <MaterialCommunityIcons name="information-outline" size={18} color="#F59E0B" />
              <Text style={styles.instructionsLabel}>Special Instructions</Text>
            </View>
            <MaterialCommunityIcons
              name={showInstructions ? "chevron-up" : "chevron-down"}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
          {showInstructions && (
            <View style={styles.instructionsContent}>
              <Text style={styles.instructionsText}>{specialInstructions}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    marginBottom: 16,
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  customerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  customerPhone: {
    fontSize: 13,
    color: "#3B82F6",
    marginTop: 2,
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
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryWindowContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  deliveryWindowInfo: {
    flex: 1,
  },
  deliveryWindowLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  deliveryWindowTime: {
    fontSize: 15,
    fontWeight: "600",
    color: "#78350F",
    marginTop: 2,
  },
  locationsContainer: {
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  locationIconContainer: {
    width: 24,
    alignItems: "center",
    marginRight: 12,
  },
  locationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  pickupDot: {
    borderColor: "#10B981",
    backgroundColor: "#D1FAE5",
  },
  dropoffDot: {
    borderColor: "#EF4444",
    backgroundColor: "#FEE2E2",
  },
  locationLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginTop: 6,
    marginBottom: -12,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  navigateHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  navigateHintText: {
    fontSize: 11,
    color: "#3B82F6",
  },
  instructionsContainer: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  instructionsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  instructionsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  instructionsContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
  },
  instructionsText: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
  },
});
