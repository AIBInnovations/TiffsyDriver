import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import SettingsOption from "./components/SettingsOption";
import NotificationPreferences from "./components/NotificationPreferences";

export default function SettingsScreen() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView style={styles.scrollView}>
        <LinearGradient colors={['#FD9E2F', '#FF6636']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.header, { paddingTop: (StatusBar.currentHeight || 0) + 12 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.headerRight} />
        </LinearGradient>

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
              onPress={() => { }}
            />
            <SettingsOption
              icon="🔊"
              label="Sound Effects"
              hasSwitch
              onPress={() => { }}
            />
            <SettingsOption
              icon="📍"
              label="Location Services"
              value="Always"
              onPress={() => { }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.optionsContainer}>
            <SettingsOption
              icon="📥"
              label="Download Data"
              onPress={() => { }}
            />
            <SettingsOption
              icon="🗑️"
              label="Clear Cache"
              onPress={() => { }}
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
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerRight: {
    width: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
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
