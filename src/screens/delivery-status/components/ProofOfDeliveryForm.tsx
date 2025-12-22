import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useState } from "react";

interface ProofOfDeliveryFormProps {
  onSubmit: (data: {
    recipientName: string;
    signature?: string;
    photo?: string;
    notes: string;
  }) => void;
}

export default function ProofOfDeliveryForm({ onSubmit }: ProofOfDeliveryFormProps) {
  const [recipientName, setRecipientName] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    onSubmit({
      recipientName,
      notes,
    });
  };

  return (
    <View className="p-4">
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Recipient Name
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-gray-900"
          placeholder="Enter recipient name"
          placeholderTextColor="#9ca3af"
          value={recipientName}
          onChangeText={setRecipientName}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Capture Signature
        </Text>
        <TouchableOpacity className="h-32 bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300">
          <Text className="text-gray-500">Tap to capture signature</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Delivery Photo
        </Text>
        <TouchableOpacity className="h-32 bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300">
          <Text className="text-gray-500">Tap to take photo</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Notes
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 h-20 text-gray-900"
          placeholder="Add delivery notes..."
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-green-500 py-4 rounded-lg"
      >
        <Text className="text-white text-center font-semibold text-base">
          Complete Delivery
        </Text>
      </TouchableOpacity>
    </View>
  );
}
