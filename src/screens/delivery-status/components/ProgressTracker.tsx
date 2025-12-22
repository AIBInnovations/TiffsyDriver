import { View, Text, StyleSheet } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { DeliveryStatusType } from "../../../navigation/types";

interface ProgressStep {
  key: DeliveryStatusType;
  label: string;
  icon: string;
}

interface ProgressTrackerProps {
  currentStatus: DeliveryStatusType;
  stopNumber?: number;
  totalStops?: number;
}

const steps: ProgressStep[] = [
  { key: "pending", label: "Pending", icon: "clock-outline" },
  { key: "picked_up", label: "Picked Up", icon: "package-variant" },
  { key: "in_progress", label: "En Route", icon: "truck-fast" },
  { key: "delivered", label: "Delivered", icon: "check-circle" },
];

const statusOrder: Record<DeliveryStatusType, number> = {
  pending: 0,
  picked_up: 1,
  in_progress: 2,
  delivered: 3,
  failed: -1,
};

const getStatusColor = (status: DeliveryStatusType): { bg: string; text: string; border: string } => {
  switch (status) {
    case "pending":
      return { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" };
    case "picked_up":
      return { bg: "#DBEAFE", text: "#1E40AF", border: "#3B82F6" };
    case "in_progress":
      return { bg: "#FEF3C7", text: "#92400E", border: "#F59E0B" };
    case "delivered":
      return { bg: "#D1FAE5", text: "#065F46", border: "#10B981" };
    case "failed":
      return { bg: "#FEE2E2", text: "#991B1B", border: "#EF4444" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" };
  }
};

export default function ProgressTracker({
  currentStatus,
  stopNumber,
  totalStops,
}: ProgressTrackerProps) {
  const currentIndex = statusOrder[currentStatus];
  const isFailed = currentStatus === "failed";

  return (
    <View style={styles.container}>
      {/* Multi-stop indicator */}
      {stopNumber && totalStops && totalStops > 1 && (
        <View style={styles.stopIndicator}>
          <MaterialCommunityIcons name="map-marker-path" size={16} color="#3B82F6" />
          <Text style={styles.stopText}>
            Stop {stopNumber} of {totalStops}
          </Text>
        </View>
      )}

      {/* Failed state banner */}
      {isFailed && (
        <View style={styles.failedBanner}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#991B1B" />
          <Text style={styles.failedText}>Delivery Failed</Text>
        </View>
      )}

      {/* Progress steps */}
      {!isFailed && (
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => {
            const isCompleted = currentIndex >= index;
            const isCurrent = statusOrder[currentStatus] === index;
            const isLast = index === steps.length - 1;
            const stepColors = getStatusColor(step.key);

            return (
              <View key={step.key} style={styles.stepWrapper}>
                <View style={styles.stepContent}>
                  {/* Step circle */}
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && { backgroundColor: stepColors.border },
                      isCurrent && styles.currentStepCircle,
                      !isCompleted && styles.incompleteStepCircle,
                    ]}
                  >
                    {isCompleted ? (
                      <MaterialCommunityIcons
                        name={isCurrent ? step.icon : "check"}
                        size={isCurrent ? 18 : 14}
                        color="#FFFFFF"
                      />
                    ) : (
                      <View style={styles.emptyDot} />
                    )}
                  </View>

                  {/* Step label */}
                  <Text
                    style={[
                      styles.stepLabel,
                      isCompleted && { color: "#111827" },
                      isCurrent && styles.currentStepLabel,
                      !isCompleted && styles.incompleteStepLabel,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>

                {/* Connector line */}
                {!isLast && (
                  <View style={styles.connectorContainer}>
                    <View
                      style={[
                        styles.connector,
                        currentIndex > index && styles.completedConnector,
                      ]}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Current status badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus).bg }]}>
        <MaterialCommunityIcons
          name={isFailed ? "close-circle" : steps.find(s => s.key === currentStatus)?.icon || "help-circle"}
          size={16}
          color={getStatusColor(currentStatus).text}
        />
        <Text style={[styles.statusBadgeText, { color: getStatusColor(currentStatus).text }]}>
          {isFailed ? "Failed" : steps.find(s => s.key === currentStatus)?.label || currentStatus}
        </Text>
      </View>
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
  stopIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: "flex-start",
    gap: 6,
  },
  stopText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
  },
  failedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  failedText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#991B1B",
  },
  stepsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepContent: {
    alignItems: "center",
    width: 56,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  currentStepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  incompleteStepCircle: {
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  emptyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9CA3AF",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  currentStepLabel: {
    fontWeight: "700",
  },
  incompleteStepLabel: {
    color: "#9CA3AF",
  },
  connectorContainer: {
    width: 24,
    paddingTop: 15,
    paddingHorizontal: 4,
  },
  connector: {
    height: 2,
    backgroundColor: "#E5E7EB",
    borderRadius: 1,
  },
  completedConnector: {
    backgroundColor: "#10B981",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "center",
    gap: 6,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
