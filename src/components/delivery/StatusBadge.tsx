import { View, Text, StyleSheet } from "react-native";

type Status = "pending" | "in_progress" | "completed" | "failed" | "cancelled";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<Status, { bg: string; text: string; label: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E", label: "Pending" },
  in_progress: { bg: "#DBEAFE", text: "#1E40AF", label: "In Progress" },
  completed: { bg: "#DCFCE7", text: "#166534", label: "Completed" },
  failed: { bg: "#FEE2E2", text: "#991B1B", label: "Failed" },
  cancelled: { bg: "#F3F4F6", text: "#1F2937", label: "Cancelled" },
};

const sizeConfig = {
  sm: { paddingHorizontal: 8, paddingVertical: 2, fontSize: 12 },
  md: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 14 },
  lg: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 16 },
};

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: config.bg,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
      }
    ]}>
      <Text style={[
        styles.text,
        {
          color: config.text,
          fontSize: sizeStyles.fontSize,
        }
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
  },
  text: {
    fontWeight: '500',
  },
});
