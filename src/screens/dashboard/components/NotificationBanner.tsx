import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type NotificationType = 'info' | 'warning' | 'success' | 'error';

interface NotificationBannerProps {
  message: string;
  type: NotificationType;
  onDismiss?: () => void;
  icon?: string;
}

const typeStyles: Record<NotificationType, { bg: string; border: string; text: string; icon: string }> = {
  info: {
    bg: '#EFF6FF',
    border: '#3B82F6',
    text: '#1E40AF',
    icon: 'information',
  },
  warning: {
    bg: '#FFFBEB',
    border: '#F59E0B',
    text: '#B45309',
    icon: 'alert',
  },
  success: {
    bg: '#ECFDF5',
    border: '#10B981',
    text: '#047857',
    icon: 'check',
  },
  error: {
    bg: '#FEF2F2',
    border: '#EF4444',
    text: '#B91C1C',
    icon: 'close',
  },
};

export default function NotificationBanner({
  message,
  type,
  onDismiss,
  icon,
}: NotificationBannerProps) {
  const style = typeStyles[type];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: style.bg, borderLeftColor: style.border },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: style.border }]}>
          <MaterialCommunityIcons name={icon || style.icon} size={14} color="white" />
        </View>
        <Text style={[styles.message, { color: style.text }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <MaterialCommunityIcons name="close" size={18} color={style.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
  },
});
