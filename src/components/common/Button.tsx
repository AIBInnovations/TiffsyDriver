import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
}

const variantStyles = {
  primary: "bg-blue-500",
  secondary: "bg-gray-500",
  danger: "bg-red-500",
  outline: "bg-transparent border-2 border-blue-500",
};

const textStyles = {
  primary: "text-white",
  secondary: "text-white",
  danger: "text-white",
  outline: "text-blue-500",
};

const sizeStyles = {
  sm: "py-2 px-4",
  md: "py-3 px-6",
  lg: "py-4 px-8",
};

const textSizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-lg items-center justify-center ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#3b82f6" : "#ffffff"} />
      ) : (
        <Text className={`font-semibold ${textStyles[variant]} ${textSizes[size]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
