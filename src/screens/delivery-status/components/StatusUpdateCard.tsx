import { View, Text, TouchableOpacity } from "react-native";

interface StatusUpdateCardProps {
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
  onPress: () => void;
}

export default function StatusUpdateCard({
  label,
  isCompleted,
  isCurrent,
  onPress,
}: StatusUpdateCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center p-4 mb-2 rounded-xl border ${
        isCurrent
          ? "bg-blue-50 border-blue-200"
          : isCompleted
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-200"
      }`}
    >
      <View
        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
          isCompleted ? "bg-green-500" : isCurrent ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        {isCompleted ? (
          <Text className="text-white font-bold">✓</Text>
        ) : (
          <View className="w-3 h-3 rounded-full bg-white" />
        )}
      </View>
      <Text
        className={`text-base font-medium ${
          isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
