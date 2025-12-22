import { View, Text, Image, StyleSheet } from "react-native";

interface ProfileHeaderProps {
  name: string;
  phone: string;
  rating: number;
  totalDeliveries: number;
  avatarUrl?: string;
}

export default function ProfileHeader({
  name,
  phone,
  rating,
  totalDeliveries,
  avatarUrl,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <Text style={styles.avatarEmoji}>👤</Text>
          )}
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.phone}>{phone}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalDeliveries}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 24,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEmoji: {
    fontSize: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  phone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
});
