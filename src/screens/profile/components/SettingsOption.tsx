import { Text, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { useState } from "react";

interface SettingsOptionProps {
  icon: string;
  label: string;
  value?: string;
  hasSwitch?: boolean;
  onPress: () => void;
}

export default function SettingsOption({
  icon,
  label,
  value,
  hasSwitch,
  onPress,
}: SettingsOptionProps) {
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      {hasSwitch ? (
        <Switch
          value={isEnabled}
          onValueChange={setIsEnabled}
          trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
          thumbColor="#ffffff"
        />
      ) : value ? (
        <Text style={styles.value}>{value}</Text>
      ) : null}
      {!hasSwitch && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  value: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  arrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
});
