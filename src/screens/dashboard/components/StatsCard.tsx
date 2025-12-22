import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface StatsCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  valueColor?: string;
  icon?: string;
  iconColor?: string;
}

export default function StatsCard({
  label,
  value,
  subLabel,
  valueColor = '#111827',
  icon,
  iconColor = '#9CA3AF',
}: StatsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
          </View>
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  label: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
