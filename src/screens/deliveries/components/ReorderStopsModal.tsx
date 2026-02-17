import { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export interface Stop {
  id: string;
  address: string;
  customerName: string;
}

interface ReorderStopsModalProps {
  visible: boolean;
  stops: Stop[];
  onClose: () => void;
  onSave: (reorderedStops: Stop[]) => void;
  isSaving?: boolean;
}

export default function ReorderStopsModal({
  visible,
  stops,
  onClose,
  onSave,
  isSaving = false,
}: ReorderStopsModalProps) {
  const [localStops, setLocalStops] = useState<Stop[]>(stops);

  // Reset local state when modal opens with new stops
  const handleShow = () => {
    setLocalStops(stops);
  };

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<Stop>) => {
    const index = getIndex() ?? 0;
    return (
      <ScaleDecorator>
        <TouchableOpacity
          activeOpacity={0.7}
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.stopItem,
            isActive && styles.stopItemActive,
          ]}
        >
          <View style={[styles.stopNumber, isActive && styles.stopNumberActive]}>
            <Text style={[styles.stopNumberText, isActive && styles.stopNumberTextActive]}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.stopInfo}>
            <Text style={styles.stopCustomer} numberOfLines={1}>{item.customerName}</Text>
            <Text style={styles.stopAddress} numberOfLines={1}>{item.address}</Text>
          </View>
          <View style={styles.dragHandle}>
            <MaterialCommunityIcons
              name="drag"
              size={24}
              color={isActive ? "#F56B4C" : "#9CA3AF"}
            />
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={handleShow}
    >
      {/* GestureHandlerRootView is needed inside Modal because Modal creates a separate native view hierarchy */}
      <GestureHandlerRootView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reorder Stops</Text>
          <TouchableOpacity
            onPress={() => onSave(localStops)}
            style={styles.headerButton}
            disabled={isSaving}
          >
            <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
              {isSaving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Drag hint */}
        <View style={styles.hintContainer}>
          <MaterialCommunityIcons name="gesture-swipe" size={18} color="#6B7280" />
          <Text style={styles.hintText}>
            Long press and drag to reorder delivery stops
          </Text>
        </View>

        {/* Draggable List */}
        <DraggableFlatList
          data={localStops}
          onDragEnd={({ data }) => setLocalStops(data)}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          containerStyle={styles.listContainer}
          contentContainerStyle={styles.listContent}
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  cancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F56B4C",
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  hintText: {
    fontSize: 13,
    color: "#6B7280",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  stopItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  stopItemActive: {
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stopNumberActive: {
    backgroundColor: "#F56B4C",
  },
  stopNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  stopNumberTextActive: {
    color: "#FFFFFF",
  },
  stopInfo: {
    flex: 1,
    marginRight: 8,
  },
  stopCustomer: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  stopAddress: {
    fontSize: 13,
    color: "#6B7280",
  },
  dragHandle: {
    padding: 4,
  },
});
