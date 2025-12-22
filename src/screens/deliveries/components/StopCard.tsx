import { View, Text, TouchableOpacity } from "react-native";

interface StopCardProps {
  stopNumber: number;
  address: string;
  customerName: string;
  status: "pending" | "current" | "completed";
  estimatedTime?: string;
  onPress?: () => void;
}

export default function StopCard({
  stopNumber,
  address,
  customerName,
  status,
  estimatedTime,
  onPress,
}: StopCardProps) {
  const getStatusStyle = () => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "current":
        return "bg-blue-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-start bg-white p-4 mb-2 rounded-lg border border-gray-100"
    >
      <View className={`w-8 h-8 rounded-full items-center justify-center ${getStatusStyle()}`}>
        <Text className="text-white font-bold text-sm">{stopNumber}</Text>
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-base font-semibold text-gray-900">
          {customerName}
        </Text>
        <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
          {address}
        </Text>
        {estimatedTime && (
          <Text className="text-xs text-gray-400 mt-1">
            ETA: {estimatedTime}
          </Text>
        )}
      </View>
      {status === "completed" && (
        <Text className="text-green-500 text-lg">✓</Text>
      )}
    </TouchableOpacity>
  );
}
