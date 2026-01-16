// src/screens/help/HelpSupportScreen.tsx

import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useHelpSupportStore } from "./useHelpSupportStore";

import {
  SearchInput,
  InlineBanner,
  SectionHeader,
  Skeleton,
  SkeletonCard,
} from "./components/UIComponents";
import { FAQAccordion } from "./components/FAQAccordion";
import { ContactModal } from "./components/ContactModal";
import { SafetyFlow } from "./components/SafetyFlow";

export default function HelpSupportScreen() {
  const navigation = useNavigation();

  const {
    // State
    isLoading,
    isHydrated,
    hydrationError,
    searchQuery,
    expandedFaqId,

    // Actions
    hydrate,
    retryHydration,
    setSearchQuery,
    setExpandedFaqId,
    getFilteredFaqs,
    openContactModal,
    openSafetyFlow,

    // Modal States
    isContactModalOpen,
    isSafetyFlowOpen,
    closeContactModal,
    closeSafetyFlow,
  } = useHelpSupportStore();

  // Hydrate on mount
  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  const filteredFaqs = getFilteredFaqs();

  const handleRefresh = useCallback(() => {
    hydrate();
  }, [hydrate]);

  // Loading State
  if (isLoading && !isHydrated) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Skeleton width={180} height={24} borderRadius={6} />
          </View>
          <Skeleton width={80} height={36} borderRadius={8} />
        </View>
        <View style={styles.content}>
          <Skeleton
            width="100%"
            height={48}
            borderRadius={12}
            style={{ marginBottom: 16 }}
          />
          <View style={styles.quickActions}>
            <Skeleton width={100} height={36} borderRadius={20} />
            <Skeleton width={80} height={36} borderRadius={20} />
            <Skeleton width={90} height={36} borderRadius={20} />
          </View>
          <Skeleton
            width={60}
            height={16}
            borderRadius={4}
            style={{ marginTop: 24, marginBottom: 12 }}
          />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#374151"
            />
          </Pressable>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} />
        }
      >
        {/* Error Banner */}
        {hydrationError && (
          <InlineBanner
            message={hydrationError}
            type="warning"
            action={{ label: "Retry", onPress: retryHydration }}
          />
        )}

        {/* Search */}
        <View style={styles.searchSection}>
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
          <Text style={styles.searchHint}>
            Search FAQs for quick answers
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>

          <Pressable
            style={[styles.actionChip, styles.safetyChip]}
            onPress={openSafetyFlow}
          >
            <MaterialCommunityIcons
              name="shield-alert"
              size={18}
              color="#D97706"
            />
            <Text style={[styles.actionChipText, styles.safetyChipText]}>
              Safety
            </Text>
          </Pressable>

          <Pressable style={styles.actionChip} onPress={openContactModal}>
            <MaterialCommunityIcons name="phone" size={18} color="#16A34A" />
            <Text style={styles.actionChipText}>Contact</Text>
          </Pressable>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <SectionHeader
            title={searchQuery ? "Search Results" : "Frequently Asked Questions"}
          />
          <FAQAccordion
            faqs={filteredFaqs}
            expandedId={expandedFaqId}
            onToggle={setExpandedFaqId}
            searchQuery={searchQuery}
          />
        </View>


        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modals & Bottom Sheets */}
      <ContactModal visible={isContactModalOpen} onClose={closeContactModal} />
      <SafetyFlow visible={isSafetyFlowOpen} onClose={closeSafetyFlow} />
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
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  content: {
    padding: 16,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  safetyChip: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  actionChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 6,
  },
  safetyChipText: {
    color: "#92400E",
  },
  faqSection: {
    marginBottom: 24,
  },
});
