import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { RootStackParamList, ProfileStackParamList } from "../../navigation/types";
import {
  useDriverProfileStore,
  getInitials,
  vehicleTypeLabels,
  languageLabels,
} from "./useDriverProfileStore";
import {
  ProfileAvatar,
  SectionCard,
  ListRow,
  SwitchRow,
  Toast,
  QuickActionTile,
  ErrorBanner,
  SkeletonAvatar,
  SkeletonText,
} from "./components/ProfileUIComponents";
import EditProfileSheet from "./components/EditProfileSheet";
import {
  LanguageModal,
  SecurityModal,
  VehicleModal,
  DocumentsModal,
  ConfirmationModal,
  LegalModal,
} from "./components/ProfileModals";

export default function ProfileScreen() {
  const {
    profile,
    isLoading,
    isHydrated,
    error,
    isSaving,
    updateProfile,
    updateNotificationPrefs,
    refresh,
    clearSessionData,
    retryHydration,
  } = useDriverProfileStore();

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList & ProfileStackParamList>>();

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ visible: false, message: "", type: "success" });

  // Debounced save indicator
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh control
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ visible: true, message, type });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
    showToast("Updated", "success");
  }, [refresh, showToast]);

  // Handle preference changes with debounced "saved" indicator
  const handlePrefChange = useCallback(
    async (updateFn: () => Promise<void>) => {
      setIsSavingPrefs(true);
      await updateFn();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setIsSavingPrefs(false);
        showToast("Saved locally", "success");
      }, 600);
    },
    [showToast]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = useCallback(async () => {
    await clearSessionData();
    setShowLogoutConfirm(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  }, [clearSessionData, navigation]);

  // Loading skeleton
  if (isLoading && !isHydrated) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Skeleton Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.headerCardContent}>
              <SkeletonAvatar size={64} />
              <View style={styles.headerCardInfo}>
                <SkeletonText width="60%" height={20} />
                <View style={{ height: 8 }} />
                <SkeletonText width="40%" height={14} />
              </View>
            </View>
            <SkeletonText width="100%" height={44} />
          </View>

          {/* Skeleton Details Card */}
          <SectionCard>
            <View style={{ gap: 16 }}>
              <SkeletonText width="80%" height={16} />
              <SkeletonText width="60%" height={16} />
              <SkeletonText width="70%" height={16} />
            </View>
          </SectionCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable style={styles.helpButton} onPress={() => navigation.navigate("HelpSupport")}>
          <MaterialCommunityIcons name="help-circle-outline" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          profile.appSettings.compactMode && styles.scrollContentCompact,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={retryHydration}
          />
        )}

        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardContent}>
            <ProfileAvatar
              initials={getInitials(profile.fullName)}
              size="lg"
              isOnline={profile.availabilityStatus === "ONLINE"}
            />
            <View style={styles.headerCardInfo}>
              <Text style={styles.profileName}>{profile.fullName}</Text>
              <View style={[styles.statusBadge, profile.availabilityStatus === "ONLINE" ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
                <View style={[styles.statusBadgeDot, profile.availabilityStatus === "ONLINE" ? styles.statusBadgeDotOnline : styles.statusBadgeDotOffline]} />
                <Text style={[styles.statusBadgeText, profile.availabilityStatus === "ONLINE" ? styles.statusBadgeTextOnline : styles.statusBadgeTextOffline]}>
                  {profile.availabilityStatus === "ONLINE" ? "Online" : "Offline"}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerCardMeta}>
            <View style={[styles.metaItem, { gap: 6 }]}>
              <MaterialCommunityIcons name="card-account-details-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{profile.driverId}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="phone-outline" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{profile.phone}</Text>
            </View>
          </View>
          <Pressable
            style={styles.editProfileButton}
            onPress={() => setShowEditProfile(true)}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#F56B4C" />
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Quick Actions Grid */}
        <SectionCard title="Quick Actions" compact={profile.appSettings.compactMode}>
          <View style={styles.quickActionsGrid}>
            <QuickActionTile
              icon="file-document-multiple-outline"
              iconColor="#3B82F6"
              iconBgColor="#EFF6FF"
              title="My Documents"
              onPress={() => setShowDocumentsModal(true)}
              disabled={!isHydrated}
            />
            <QuickActionTile
              icon="motorbike"
              iconColor="#10B981"
              iconBgColor="#F0FDF4"
              title="Vehicle"
              onPress={() => setShowVehicleModal(true)}
              disabled={!isHydrated}
            />
            <QuickActionTile
              icon="translate"
              iconColor="#F59E0B"
              iconBgColor="#FFFBEB"
              title="Language"
              onPress={() => setShowLanguageModal(true)}
              disabled={!isHydrated}
            />
            <QuickActionTile
              icon="shield-lock-outline"
              iconColor="#8B5CF6"
              iconBgColor="#F5F3FF"
              title="Security"
              onPress={() => setShowSecurityModal(true)}
              disabled={!isHydrated}
            />
          </View>
        </SectionCard>

        {/* Profile Details Card */}
        <SectionCard title="Profile Details" compact={profile.appSettings.compactMode}>
          <ListRow
            icon="email-outline"
            iconColor="#3B82F6"
            iconBgColor="#EFF6FF"
            title="Email"
            value={profile.email || "Not set"}
            showChevron={false}
          />
          <ListRow
            icon="car-outline"
            iconColor="#10B981"
            iconBgColor="#F0FDF4"
            title="Vehicle"
            value={`${vehicleTypeLabels[profile.vehicleType]} - ${profile.vehicleNumber}`}
            showChevron={false}
          />
          <ListRow
            icon="translate"
            iconColor="#F59E0B"
            iconBgColor="#FFFBEB"
            title="Language"
            value={languageLabels[profile.preferredLanguage].split(" ")[0]}
            showChevron={false}
          />
          <View style={{ height: 16 }} />
          <View style={styles.editLinkContainer}>
            <Pressable onPress={() => setShowEditProfile(true)}>
              <Text style={styles.editLink}>Edit Details</Text>
            </Pressable>
          </View>
        </SectionCard>

        {/* Notification Preferences */}
        <SectionCard title="Notifications" compact={profile.appSettings.compactMode}>
          <SwitchRow
            icon="bell-ring-outline"
            iconColor="#3B82F6"
            iconBgColor="#EFF6FF"
            title="New Assignments"
            subtitle="Get notified for new delivery assignments"
            value={profile.notificationPrefs.newAssignment}
            onValueChange={(value) =>
              handlePrefChange(() => updateNotificationPrefs({ newAssignment: value }))
            }
            disabled={isSaving}
          />
          <SwitchRow
            icon="package-variant"
            iconColor="#10B981"
            iconBgColor="#F0FDF4"
            title="Batch Updates"
            subtitle="Updates about batch deliveries"
            value={profile.notificationPrefs.batchUpdates}
            onValueChange={(value) =>
              handlePrefChange(() => updateNotificationPrefs({ batchUpdates: value }))
            }
            disabled={isSaving}
          />
          <SwitchRow
            icon="tag-outline"
            iconColor="#F59E0B"
            iconBgColor="#FFFBEB"
            title="Promotions"
            subtitle="Offers and promotional messages"
            value={profile.notificationPrefs.promotions}
            onValueChange={(value) =>
              handlePrefChange(() => updateNotificationPrefs({ promotions: value }))
            }
            disabled={isSaving}
          />
          {isSavingPrefs && (
            <Text style={styles.savingLabel}>Saving...</Text>
          )}
        </SectionCard>

        {/* Support & Legal */}
        <SectionCard title="Support & Legal" compact={profile.appSettings.compactMode} style={{ marginBottom: 0 }}>
          <ListRow
            icon="help-circle-outline"
            iconColor="#3B82F6"
            iconBgColor="#EFF6FF"
            title="Help & Support"
            onPress={() => navigation.navigate("HelpSupport")}
          />
          <ListRow
            icon="file-document-outline"
            iconColor="#6B7280"
            iconBgColor="#F3F4F6"
            title="Terms of Service"
            onPress={() => setShowTermsModal(true)}
          />
          <ListRow
            icon="shield-outline"
            iconColor="#6B7280"
            iconBgColor="#F3F4F6"
            title="Privacy Policy"
            onPress={() => setShowPrivacyModal(true)}
          />
          <Pressable
            style={styles.logoutButton}
            onPress={() => setShowLogoutConfirm(true)}
            disabled={isSaving}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </SectionCard>
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />

      {/* Modals */}
      <EditProfileSheet
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
        onSave={async (updates) => {
          await updateProfile(updates);
          showToast("Profile updated", "success");
        }}
      />

      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        currentLanguage={profile.preferredLanguage}
        onSave={async (language) => {
          await updateProfile({ preferredLanguage: language });
          showToast("Language updated", "success");
        }}
      />

      <SecurityModal
        visible={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
      />

      <VehicleModal
        visible={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        currentVehicleType={profile.vehicleType}
        currentVehicleNumber={profile.vehicleNumber}
        onSave={async (vehicleType, vehicleNumber) => {
          await updateProfile({ vehicleType, vehicleNumber });
          showToast("Vehicle updated", "success");
        }}
      />

      <DocumentsModal
        visible={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
      />


      <LegalModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        type="terms"
      />

      <LegalModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        type="privacy"
      />

      <ConfirmationModal
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Logout"
        message="Are you sure you want to logout? Your app settings will be preserved."
        confirmText="Logout"
        onConfirm={handleLogout}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  helpButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  scrollContentCompact: {
    padding: 12,
  },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerCardInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusBadgeOnline: {
    backgroundColor: "#D1FAE5",
  },
  statusBadgeOffline: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeDotOnline: {
    backgroundColor: "#10B981",
  },
  statusBadgeDotOffline: {
    backgroundColor: "#EF4444",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadgeTextOnline: {
    color: "#065F46",
  },
  statusBadgeTextOffline: {
    color: "#991B1B",
  },
  headerCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  editProfileButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F56B4C",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 20,
    paddingLeft: 32,
  },
  editLinkContainer: {
    paddingTop: 8,
    alignItems: "center",
  },
  editLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F56B4C",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  savingLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EF4444",
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
});
