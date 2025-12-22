import { View, Text, Switch, StyleSheet } from "react-native";
import { useState } from "react";

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: "new_delivery",
      label: "New Deliveries",
      description: "Get notified when new deliveries are assigned",
      enabled: true,
    },
    {
      id: "status_updates",
      label: "Status Updates",
      description: "Receive updates about delivery status changes",
      enabled: true,
    },
    {
      id: "earnings",
      label: "Earnings",
      description: "Get notified about payments and earnings",
      enabled: true,
    },
    {
      id: "promotions",
      label: "Promotions",
      description: "Receive promotional offers and bonuses",
      enabled: false,
    },
  ]);

  const togglePreference = (id: string) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  return (
    <View style={styles.container}>
      {preferences.map((pref) => (
        <View key={pref.id} style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.label}>{pref.label}</Text>
            <Text style={styles.description}>{pref.description}</Text>
          </View>
          <Switch
            value={pref.enabled}
            onValueChange={() => togglePreference(pref.id)}
            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
            thumbColor="#ffffff"
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
