import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { OrderItem } from "../../../types/api";

interface OrderItemsCardProps {
  items?: OrderItem[];
  // When more than this many distinct items exist, the list collapses behind
  // a "Show all" toggle so the card doesn't dominate the screen on big orders.
  collapseAfter?: number;
}

const PLURAL = (n: number, singular: string, plural?: string) =>
  n === 1 ? singular : plural || `${singular}s`;

export default function OrderItemsCard({
  items,
  collapseAfter = 4,
}: OrderItemsCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const distinctCount = items.length;
  const shouldCollapse = distinctCount > collapseAfter && !expanded;
  const visibleItems = shouldCollapse ? items.slice(0, collapseAfter) : items;
  const hiddenCount = distinctCount - visibleItems.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="food-variant" size={18} color="#FE8733" />
          <Text style={styles.headerTitle}>Order Items</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>
            {totalQuantity} {PLURAL(totalQuantity, "thali", "thalis")}
          </Text>
        </View>
      </View>

      {/* Items list */}
      <View style={styles.itemsContainer}>
        {visibleItems.map((item, index) => (
          <View
            key={item.menuItemId || `${item.name}-${index}`}
            style={[
              styles.itemRow,
              index === visibleItems.length - 1 && !hiddenCount && styles.itemRowLast,
            ]}
          >
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>{item.quantity}×</Text>
            </View>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Expand / collapse toggle */}
      {distinctCount > collapseAfter && (
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleText}>
            {expanded ? "Show less" : `Show all ${distinctCount} items`}
          </Text>
          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#3B82F6"
          />
        </TouchableOpacity>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  countPill: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  countPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C2410C",
  },
  itemsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  qtyBadge: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FE8733",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    lineHeight: 20,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 8,
    gap: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
});
