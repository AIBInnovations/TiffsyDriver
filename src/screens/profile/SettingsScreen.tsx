import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import SettingsOption from "./components/SettingsOption";
import NotificationPreferences from "./components/NotificationPreferences";
import ActionSheet from "../../components/common/ActionSheet";
import {
  getPreferredIosMapsApp,
  setPreferredIosMapsApp,
  clearPreferredIosMapsApp,
  type IosMapsApp,
} from "../../utils/maps";

const mapsAppLabel = (app: IosMapsApp | null): string => {
  if (app === 'google') return 'Google Maps';
  if (app === 'apple') return 'Apple Maps';
  return 'Ask each time';
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [preferredMapsApp, setPreferredMapsAppState] = useState<IosMapsApp | null>(null);
  const [showMapsAppSheet, setShowMapsAppSheet] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    getPreferredIosMapsApp().then((value) => {
      if (active) setPreferredMapsAppState(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const choose = useCallback(async (app: IosMapsApp | null) => {
    if (app === null) {
      await clearPreferredIosMapsApp();
    } else {
      await setPreferredIosMapsApp(app);
    }
    setPreferredMapsAppState(app);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView style={styles.scrollView}>
        <LinearGradient colors={['#FD9E2F', '#FF6636']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
            <View style={styles.headerRight} />
          </View>
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
            {Platform.OS === 'ios' && (
              <SettingsOption
                icon="🗺️"
                label="Default Maps App"
                value={mapsAppLabel(preferredMapsApp)}
                onPress={() => setShowMapsAppSheet(true)}
              />
            )}
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

      <ActionSheet
        visible={showMapsAppSheet}
        title="Default Maps App"
        message="Choose how Tiffsy opens navigation"
        options={[
          {
            label: 'Google Maps',
            icon: 'google-maps',
            iconColor: '#10B981',
            onPress: () => choose('google'),
          },
          {
            label: 'Apple Maps',
            icon: 'map',
            iconColor: '#3B82F6',
            onPress: () => choose('apple'),
          },
          {
            label: 'Ask each time',
            icon: 'help-circle-outline',
            iconColor: '#6B7280',
            onPress: () => choose(null),
          },
        ]}
        onClose={() => setShowMapsAppSheet(false)}
      />
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
