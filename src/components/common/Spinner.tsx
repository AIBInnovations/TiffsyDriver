import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

interface SpinnerProps {
  size?: "small" | "large";
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

export default function Spinner({
  size = "large",
  color = "#3b82f6",
  fullScreen = false,
  message,
}: SpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <ActivityIndicator size={size} color={color} />
        {message && (
          <Text style={styles.fullScreenMessage}>{message}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  fullScreenMessage: {
    color: '#6B7280',
    marginTop: 16,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  message: {
    color: '#6B7280',
    marginTop: 8,
  },
});
