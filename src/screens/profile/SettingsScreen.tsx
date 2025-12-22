import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SettingsOption from "./components/SettingsOption";
import NotificationPreferences from "./components/NotificationPreferences";

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <NotificationPreferences />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.optionsContainer}>
            <SettingsOption
              icon="🌙"
              label="Dark Mode"
              hasSwitch
              onPress={() => {}}
            />
            <SettingsOption
              icon="🔊"
              label="Sound Effects"
              hasSwitch
              onPress={() => {}}
            />
            <SettingsOption
              icon="📍"
              label="Location Services"
              value="Always"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.optionsContainer}>
            <SettingsOption
              icon="📥"
              label="Download Data"
              onPress={() => {}}
            />
            <SettingsOption
              icon="🗑️"
              label="Clear Cache"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  optionsContainer: {
    backgroundColor: 'white',
  },
});
