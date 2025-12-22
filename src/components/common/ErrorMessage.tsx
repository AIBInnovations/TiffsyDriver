import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export default function ErrorMessage({
  message,
  onRetry,
  fullScreen = false,
}: ErrorMessageProps) {
  const content = (
    <>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        {content}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 40,
    marginBottom: 16,
  },
  title: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
