import { View, Text, TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  ...props
}: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      )}
      <TextInput
        className={`border rounded-lg p-3 text-gray-900 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
      {helperText && !error && (
        <Text className="text-gray-500 text-sm mt-1">{helperText}</Text>
      )}
    </View>
  );
}
