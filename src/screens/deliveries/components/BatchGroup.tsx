import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ReactNode } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface BatchGroupProps {
  batchId: string;
  deliveryCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export default function BatchGroup({
  batchId,
  deliveryCount,
  isExpanded,
  onToggle,
  children,
}: BatchGroupProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <View style={styles.batchIcon}>
            <MaterialCommunityIcons name="package-variant-closed" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.batchInfo}>
            <Text style={styles.batchId} numberOfLines={1}>{batchId}</Text>
            <Text style={styles.deliveryCount}>
              {deliveryCount} {deliveryCount === 1 ? "delivery" : "deliveries"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Batch</Text>
          </View>
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#6B7280"
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  batchIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F56B4C",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  batchInfo: {
    flex: 1,
    minWidth: 0,
  },
  batchId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  deliveryCount: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  badge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 0,
  },
});
