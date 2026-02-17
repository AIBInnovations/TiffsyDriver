import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { OrderSource } from '../../types/api';

interface OrderSourceBadgeProps {
  orderSource?: OrderSource;
}

const ORDER_SOURCE_CONFIG: Record<OrderSource, { label: string; bg: string; text: string; icon: string }> = {
  DIRECT: { label: 'Direct', bg: '#F3F4F6', text: '#6B7280', icon: 'cart-outline' },
  SCHEDULED: { label: 'Scheduled', bg: '#DBEAFE', text: '#1E40AF', icon: 'calendar-clock' },
  AUTO_ORDER: { label: 'Auto', bg: '#EDE9FE', text: '#6D28D9', icon: 'lightning-bolt' },
};

export default function OrderSourceBadge({ orderSource }: OrderSourceBadgeProps) {
  if (!orderSource) return null;

  const config = ORDER_SOURCE_CONFIG[orderSource];
  if (!config) return null;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <MaterialCommunityIcons name={config.icon} size={12} color={config.text} />
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
