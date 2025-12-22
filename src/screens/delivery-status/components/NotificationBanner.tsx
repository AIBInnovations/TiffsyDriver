import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useEffect, useRef } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export type NotificationType = "info" | "warning" | "error" | "success";

interface NotificationBannerProps {
  visible: boolean;
  type: NotificationType;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

const notificationConfig: Record<
  NotificationType,
  { bg: string; border: string; icon: string; iconColor: string; titleColor: string }
> = {
  info: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    icon: "information",
    iconColor: "#3B82F6",
    titleColor: "#1E40AF",
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    icon: "alert",
    iconColor: "#F59E0B",
    titleColor: "#92400E",
  },
  error: {
    bg: "#FEF2F2",
    border: "#FECACA",
    icon: "alert-circle",
    iconColor: "#EF4444",
    titleColor: "#991B1B",
  },
  success: {
    bg: "#F0FDF4",
    border: "#BBF7D0",
    icon: "check-circle",
    iconColor: "#10B981",
    titleColor: "#065F46",
  },
};

export default function NotificationBanner({
  visible,
  type,
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
}: NotificationBannerProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoDismiss && onDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismissDelay);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, autoDismiss, autoDismissDelay]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  const config = notificationConfig[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name={config.icon} size={22} color={config.iconColor} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: config.titleColor }]}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}

        {actionLabel && onAction && (
          <TouchableOpacity style={styles.actionButton} onPress={onAction}>
            <Text style={[styles.actionText, { color: config.iconColor }]}>
              {actionLabel}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={config.iconColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <MaterialCommunityIcons name="close" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 2,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
