import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface StatsCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  valueColor?: string;
  icon?: string;
  iconColor?: string;
  flex?: boolean;
}

export default function StatsCard({
  label,
  value,
  subLabel,
  valueColor = '#111827',
  icon,
  iconColor = '#9CA3AF',
  flex = true,
}: StatsCardProps) {
  return (
    <View style={[styles.card, flex ? styles.flexCard : styles.fixedCard]}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
          </View>
        )}
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  flexCard: {
    flex: 1,
  },
  fixedCard: {
    width: 158,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
    flexWrap: 'wrap',
    maxWidth: 70,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
