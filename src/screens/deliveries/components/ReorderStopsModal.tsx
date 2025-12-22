import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";

interface Stop {
  id: string;
  address: string;
  customerName: string;
}

interface ReorderStopsModalProps {
  visible: boolean;
  stops: Stop[];
  onClose: () => void;
  onSave: (reorderedStops: Stop[]) => void;
}

export default function ReorderStopsModal({
  visible,
  stops,
  onClose,
  onSave,
}: ReorderStopsModalProps) {
  // TODO: Implement drag-and-drop reordering

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-white">
        <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-blue-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Reorder Stops</Text>
          <TouchableOpacity onPress={() => onSave(stops)}>
            <Text className="text-blue-500 text-base font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={stops}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View className="flex-row items-center p-4 border-b border-gray-100">
              <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Text className="font-bold text-gray-600">{index + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">
                  {item.customerName}
                </Text>
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
              <Text className="text-gray-400 text-lg">≡</Text>
            </View>
          )}
        />

        <View className="p-4">
          <Text className="text-sm text-gray-500 text-center">
            Drag and drop to reorder delivery stops
          </Text>
        </View>
      </View>
    </Modal>
  );
}
