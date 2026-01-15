import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
  StatusBar,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { RootStackParamList, ProfileStackParamList } from "../../navigation/types";
import {
  useDriverProfileStore,
  getInitials,
  vehicleTypeLabels,
  languageLabels,
  VehicleType,
} from "./useDriverProfileStore";
import {
  getDriverProfile,
  updateDriverProfile as updateDriverProfileAPI,
  updateDriverVehicle,
} from "../../services/driverProfileService";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
  const [backendError, setBackendError] = useState<string | null>(null);
  const [hasAttemptedBackendSync, setHasAttemptedBackendSync] = useState(false);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ visible: true, message, type });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  // Fetch profile from backend and sync with local store
  const fetchBackendProfile = useCallback(async () => {
    try {
      console.log('🔄 Fetching profile from backend...');
      const response = await getDriverProfile();

      console.log('📥 Backend response received');
      console.log('📥 Response keys:', Object.keys(response || {}));
      console.log('📥 Response.data keys:', Object.keys(response?.data || {}));

      // Validate response structure
      if (!response || !response.data) {
        console.error('❌ Invalid response structure - missing data');
        throw new Error('Invalid response structure from backend');
      }

      const { user, driverDetails, statistics } = response.data;

      console.log('📥 User exists:', !!user);
      console.log('📥 DriverDetails exists:', !!driverDetails);
      console.log('📥 Statistics exists:', !!statistics);

      // Update local store with backend data only if we have valid user data
      // driverDetails might not exist if the backend hasn't implemented it yet
      const updates: any = {
        lastSyncedAt: new Date().toISOString(),
      };

      if (user) {
        if (user._id) updates.driverId = user._id;
        if (user.name) updates.fullName = user.name;
        if (user.phone) updates.phone = user.phone;
        if (user.email !== undefined) updates.email = user.email || '';
      } else {
        console.warn('⚠️ No user data in backend response');
        throw new Error('User data not found in backend response');
      }

      // Driver details are optional - backend may not have this endpoint yet
      if (driverDetails) {
        if (driverDetails.vehicleType) updates.vehicleType = driverDetails.vehicleType as VehicleType;
        if (driverDetails.vehicleNumber) updates.vehicleNumber = driverDetails.vehicleNumber;
        if (driverDetails.isAvailable !== undefined) {
          updates.availabilityStatus = driverDetails.isAvailable ? 'ONLINE' : 'OFFLINE';
        }
      } else {
        console.log('ℹ️ No driver details in backend response (endpoint may not be implemented yet)');
      }

      await updateProfile(updates);

      console.log('✅ Profile synced from backend');
      if (statistics) {
        console.log('📊 Statistics:', statistics);
      }
      // Don't clear backend error here - let the caller decide
    } catch (error: any) {
      console.error('❌ Error fetching backend profile:', error);
      console.error('❌ Error details:', error.message);

      // Re-throw to let caller handle the error
      // This allows different behavior for automatic vs manual sync
      throw error;
    }
  }, [updateProfile]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchBackendProfile();
      showToast("Profile synced", "success");
      setBackendError(null);
    } catch (error: any) {
      // Only show error toast on explicit user refresh
      const errorMessage = error?.message || "Failed to sync profile";
      showToast(errorMessage, "error");
      setBackendError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchBackendProfile, showToast]);

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

  // Fetch profile from backend on mount (only once per session)
  useEffect(() => {
    if (isHydrated && !isLoading && !hasAttemptedBackendSync) {
      setHasAttemptedBackendSync(true);
      InteractionManager.runAfterInteractions(() => {
        fetchBackendProfile().catch((error) => {
          // Silently fail on automatic sync
          // Error already logged in console
          console.log('ℹ️ Using local profile data, backend sync failed silently');
        });
      });
    }
  }, [isHydrated, isLoading, hasAttemptedBackendSync, fetchBackendProfile]);

  // Set status bar color when screen is focused
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#FFFFFF');
    }, [])
  );

  const handleLogout = useCallback(async () => {
    // Show loading state in modal
    setIsLoggingOut(true);

    try {
      // Clear session data
      await clearSessionData();

      // Small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      // Navigate - this will unmount the screen and modal automatically
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    } catch (error) {
      // Reset loading state if error occurs
      setIsLoggingOut(false);
      console.error("Logout error:", error);
    }
  }, [clearSessionData, navigation]);

  // Loading skeleton
  if (isLoading && !isHydrated) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
        {backendError && !error && (
          <ErrorBanner
            message={backendError}
            onRetry={handleRefresh}
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
          try {
            // Prepare backend API calls
            const profileUpdates: { name?: string; email?: string } = {};
            const vehicleUpdates: { vehicleType?: VehicleType; vehicleNumber?: string } = {};

            // Split updates into profile and vehicle
            if (updates.fullName !== undefined) {
              profileUpdates.name = updates.fullName;
            }
            if (updates.email !== undefined) {
              profileUpdates.email = updates.email;
            }
            if (updates.vehicleType !== undefined) {
              vehicleUpdates.vehicleType = updates.vehicleType;
            }
            if (updates.vehicleNumber !== undefined) {
              vehicleUpdates.vehicleNumber = updates.vehicleNumber;
            }

            // Try to call backend APIs in parallel if both have updates
            let backendSuccess = false;
            try {
              const apiCalls = [];
              if (Object.keys(profileUpdates).length > 0) {
                apiCalls.push(updateDriverProfileAPI(profileUpdates));
              }
              if (Object.keys(vehicleUpdates).length > 0) {
                apiCalls.push(updateDriverVehicle(vehicleUpdates));
              }

              if (apiCalls.length > 0) {
                await Promise.all(apiCalls);
                backendSuccess = true;
              }
            } catch (backendError: any) {
              console.error('❌ Backend update failed:', backendError);
              // Continue to save locally even if backend fails
              showToast("Saved locally (server sync failed)", "info");
            }

            // Always update local store
            await updateProfile(updates);

            if (backendSuccess) {
              showToast("Profile updated", "success");
            }
          } catch (error: any) {
            console.error('❌ Error updating profile:', error);
            showToast(error.message || "Failed to update profile", "error");
            throw error;
          }
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
          try {
            // Try to call backend API to update vehicle
            let backendSuccess = false;
            try {
              await updateDriverVehicle({ vehicleType, vehicleNumber });
              backendSuccess = true;
            } catch (backendError: any) {
              console.error('❌ Backend update failed:', backendError);
              // Continue to save locally even if backend fails
              showToast("Saved locally (server sync failed)", "info");
            }

            // Always update local store
            await updateProfile({ vehicleType, vehicleNumber });

            if (backendSuccess) {
              showToast("Vehicle updated", "success");
            }
          } catch (error: any) {
            console.error('❌ Error updating vehicle:', error);
            showToast(error.message || "Failed to update vehicle", "error");
            throw error;
          }
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
        onClose={() => {
          if (!isLoggingOut) {
            setShowLogoutConfirm(false);
          }
        }}
        title="Logout"
        message="Are you sure you want to logout? Your app settings will be preserved."
        confirmText="Logout"
        onConfirm={handleLogout}
        destructive
        isLoading={isLoggingOut}
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
