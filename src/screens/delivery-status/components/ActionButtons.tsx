import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { DeliveryStatusType } from "../../../navigation/types";

interface ActionButtonsProps {
  currentStatus: DeliveryStatusType;
  onStartDelivery: () => void;
  onMarkArrived: () => void;
  onMarkDelivered: () => void;
  onMarkFailed: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

interface ActionButton {
  label: string;
  icon: string;
  color: string;
  shadowColor: string;
  onPress: () => void;
}

export default function ActionButtons({
  currentStatus,
  onStartDelivery,
  onMarkArrived,
  onMarkDelivered,
  onMarkFailed,
  isLoading = false,
  disabled = false,
}: ActionButtonsProps) {
  const getActionButton = (): ActionButton | null => {
    switch (currentStatus) {
      case "pending":
        // Start Delivery button is now in MapPreview
        return null;
      case "in_progress":
        return {
          label: "I've Arrived",
          icon: "map-marker-check",
          color: "#3B82F6",
          shadowColor: "#3B82F6",
          onPress: onMarkArrived,
        };
      case "picked_up":
        // ARRIVED status — driver is at customer location, ready to deliver
        return {
          label: "Mark as Delivered",
          icon: "check-circle",
          color: "#10B981",
          shadowColor: "#10B981",
          onPress: onMarkDelivered,
        };
      default:
        return null;
    }
  };

  const primaryAction = getActionButton();
  const showFailButton = currentStatus === "in_progress" || currentStatus === "picked_up";
  const isCompleted = currentStatus === "delivered";
  const isFailed = currentStatus === "failed";
  const isPending = currentStatus === "pending";

  // Start Delivery button is now in MapPreview for pending status
  if (isPending) {
    return null;
  }

  if (isCompleted) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <View style={styles.completedIcon}>
            <MaterialCommunityIcons name="check-circle" size={32} color="#10B981" />
          </View>
          <Text style={styles.completedTitle}>Delivery Completed</Text>
          <Text style={styles.completedSubtitle}>
            This delivery has been successfully completed
          </Text>
        </View>
      </View>
    );
  }

  if (isFailed) {
    return (
      <View style={styles.container}>
        <View style={styles.failedContainer}>
          <View style={styles.failedIcon}>
            <MaterialCommunityIcons name="close-circle" size={32} color="#EF4444" />
          </View>
          <Text style={styles.failedTitle}>Delivery Failed</Text>
          <Text style={styles.failedSubtitle}>
            This delivery was marked as failed
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Primary Action Button */}
      {primaryAction && (
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: primaryAction.color },
            { shadowColor: primaryAction.shadowColor },
            (disabled || isLoading) && styles.buttonDisabled,
          ]}
          onPress={primaryAction.onPress}
          disabled={disabled || isLoading}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={isLoading ? "loading" : primaryAction.icon}
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Processing..." : primaryAction.label}
          </Text>
        </TouchableOpacity>
      )}

      {/* Secondary Actions Row */}
      {showFailButton && (
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.failButton}
            onPress={onMarkFailed}
            disabled={disabled || isLoading}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={20} color="#EF4444" />
            <Text style={styles.failButtonText}>Mark as Failed</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status-specific helper text */}
      {currentStatus === "in_progress" && (
        <View style={styles.helperContainer}>
          <View style={styles.helperRow}>
            <MaterialCommunityIcons name="truck-fast-outline" size={14} color="#6B7280" />
            <Text style={styles.helperText}>
              Navigate to delivery location to complete the order
            </Text>
          </View>
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
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryActions: {
    marginTop: 12,
  },
  failButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 8,
  },
  failButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
  helperContainer: {
    marginTop: 14,
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  completedContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  completedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 4,
  },
  completedSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  failedContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  failedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  failedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#991B1B",
    marginBottom: 4,
  },
  failedSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
