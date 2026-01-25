import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from "react-native";
import { useState } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

// Backend OrderStatus values
type FilterStatus = "all" | "READY" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED" | "RETURNED";
type SortOption = "sequence" | "distance" | "status";

interface FilterBarProps {
  filterStatus: FilterStatus;
  sortBy: SortOption;
  onFilterChange: (filter: FilterStatus) => void;
  onSortChange: (sort: SortOption) => void;
}

const statusFilters: { value: FilterStatus; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "view-grid" },
  { value: "READY", label: "Ready", icon: "clock-outline" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "truck-fast" },
  { value: "DELIVERED", label: "Delivered", icon: "check-circle" },
  { value: "FAILED", label: "Failed", icon: "close-circle" },
];

const sortOptions: { value: SortOption; label: string; icon: string }[] = [
  { value: "sequence", label: "Delivery Sequence", icon: "sort-numeric-ascending" },
  { value: "distance", label: "Distance (Nearest)", icon: "map-marker-distance" },
  { value: "status", label: "Status Priority", icon: "sort" },
];

export default function FilterBar({ filterStatus, sortBy, onFilterChange, onSortChange }: FilterBarProps) {
  const [showSortModal, setShowSortModal] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          style={styles.scrollView}
        >
          {statusFilters.map(filter => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterChip,
                filterStatus === filter.value && styles.filterChipActive,
              ]}
              onPress={() => onFilterChange(filter.value)}
            >
              <MaterialCommunityIcons
                name={filter.icon}
                size={14}
                color={filterStatus === filter.value ? "#FFFFFF" : "#6B7280"}
              />
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === filter.value && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort Button */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <MaterialCommunityIcons name="sort" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort By</Text>
            {sortOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortOption,
                  sortBy === option.value && styles.sortOptionActive,
                ]}
                onPress={() => {
                  onSortChange(option.value);
                  setShowSortModal(false);
                }}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={20}
                  color={sortBy === option.value ? "#F56B4C" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.sortOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <MaterialCommunityIcons name="check" size={20} color="#F56B4C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  filtersContainer: {
    paddingLeft: 12,
    paddingRight: 8,
    flexDirection: "row",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8, // Increased back to 8
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginRight: 6,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: "#F56B4C",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: "#FEF3F2",
  },
  sortOptionText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
  },
  sortOptionTextActive: {
    color: "#F56B4C",
    fontWeight: "600",
  },
});
