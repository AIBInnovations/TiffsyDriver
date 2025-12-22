import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Language, languageLabels, VehicleType, vehicleTypeLabels } from "../useDriverProfileStore";

// ─────────────────────────────────────────────────────────────
// Base Modal Wrapper
// ─────────────────────────────────────────────────────────────
interface BaseModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function BaseModal({ visible, onClose, title, children }: BaseModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
          </Pressable>
        </View>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Language Selector Modal
// ─────────────────────────────────────────────────────────────
interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
  currentLanguage: Language;
  onSave: (language: Language) => void;
}

export function LanguageModal({
  visible,
  onClose,
  currentLanguage,
  onSave,
}: LanguageModalProps) {
  const [selected, setSelected] = useState<Language>(currentLanguage);

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  const languages: Language[] = ["EN", "HI"];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayContainer}>
        <View style={styles.languageModal}>
          <View style={styles.languageModalHeader}>
            <Text style={styles.languageModalTitle}>Select Language</Text>
            <Pressable onPress={onClose} style={styles.languageModalClose}>
              <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          <View style={styles.languageOptions}>
            {languages.map((lang, index) => (
              <Pressable
                key={lang}
                style={[
                  styles.languageOption,
                  index < languages.length - 1 && styles.languageOptionBorder,
                  selected === lang && styles.languageOptionActive,
                ]}
                onPress={() => setSelected(lang)}
              >
                <Text style={[
                  styles.languageOptionText,
                  selected === lang && styles.languageOptionTextActive,
                ]}>
                  {languageLabels[lang]}
                </Text>
                <View
                  style={[
                    styles.radioCircle,
                    selected === lang && styles.radioCircleActive,
                  ]}
                >
                  {selected === lang && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.languageModalButtons}>
            <Pressable style={styles.languageModalCancel} onPress={onClose}>
              <Text style={styles.languageModalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.languageModalSave} onPress={handleSave}>
              <Text style={styles.languageModalSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Vehicle Modal
// ─────────────────────────────────────────────────────────────
interface VehicleModalProps {
  visible: boolean;
  onClose: () => void;
  currentVehicleType: VehicleType;
  currentVehicleNumber: string;
  onSave: (vehicleType: VehicleType, vehicleNumber: string) => void;
}

export function VehicleModal({
  visible,
  onClose,
  currentVehicleType,
  currentVehicleNumber,
  onSave,
}: VehicleModalProps) {
  const [selectedType, setSelectedType] = useState<VehicleType>(currentVehicleType);

  const handleSave = () => {
    onSave(selectedType, currentVehicleNumber);
    onClose();
  };

  const vehicleTypes: VehicleType[] = ["BIKE", "SCOOTER", "CAR"];

  const vehicleIcons: Record<VehicleType, string> = {
    BIKE: "motorbike",
    SCOOTER: "moped",
    CAR: "car",
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayContainer}>
        <View style={styles.vehicleModal}>
          <View style={styles.vehicleModalHeader}>
            <Text style={styles.vehicleModalTitle}>Vehicle Details</Text>
            <Pressable onPress={onClose} style={styles.vehicleModalClose}>
              <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          <Text style={styles.vehicleModalLabel}>Vehicle Type</Text>
          <View style={styles.vehicleOptions}>
            {vehicleTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.vehicleOption,
                  selectedType === type && styles.vehicleOptionActive,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <MaterialCommunityIcons
                  name={vehicleIcons[type]}
                  size={24}
                  color={selectedType === type ? "#F56B4C" : "#6B7280"}
                />
                <Text style={[
                  styles.vehicleOptionText,
                  selectedType === type && styles.vehicleOptionTextActive,
                ]}>
                  {vehicleTypeLabels[type]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.vehicleModalLabel}>Vehicle Number</Text>
          <View style={styles.vehicleNumberInput}>
            <MaterialCommunityIcons name="card-text-outline" size={20} color="#6B7280" />
            <Text style={styles.vehicleNumberText}>{currentVehicleNumber}</Text>
          </View>
          <Text style={styles.vehicleNumberHint}>Contact support to update vehicle number</Text>

          <View style={styles.vehicleModalButtons}>
            <Pressable style={styles.vehicleModalCancel} onPress={onClose}>
              <Text style={styles.vehicleModalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.vehicleModalSave} onPress={handleSave}>
              <Text style={styles.vehicleModalSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Security Modal
// ─────────────────────────────────────────────────────────────
interface SecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SecurityModal({ visible, onClose }: SecurityModalProps) {
  const securityItems = [
    {
      icon: "lock-outline",
      title: "Change PIN",
      subtitle: "Coming soon",
      disabled: true,
    },
    {
      icon: "fingerprint",
      title: "Biometric Login",
      subtitle: "Coming soon",
      disabled: true,
    },
    {
      icon: "shield-check-outline",
      title: "Two-Factor Authentication",
      subtitle: "Coming soon",
      disabled: true,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayContainer}>
        <View style={styles.securityModal}>
          <View style={styles.securityModalHeader}>
            <Text style={styles.securityModalTitle}>Security</Text>
            <Pressable onPress={onClose} style={styles.securityModalClose}>
              <MaterialCommunityIcons name="close" size={22} color="#6B7280" />
            </Pressable>
          </View>

          <View style={styles.securityOptions}>
            {securityItems.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.securityOption,
                  index < securityItems.length - 1 && styles.securityOptionBorder,
                  item.disabled && styles.securityOptionDisabled,
                ]}
              >
                <View style={styles.securityOptionIcon}>
                  <MaterialCommunityIcons name={item.icon} size={20} color="#8B5CF6" />
                </View>
                <View style={styles.securityOptionContent}>
                  <Text style={styles.securityOptionTitle}>{item.title}</Text>
                  <Text style={styles.securityOptionSubtitle}>{item.subtitle}</Text>
                </View>
                {item.disabled && (
                  <View style={styles.securityComingSoonBadge}>
                    <Text style={styles.securityComingSoonText}>Soon</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.securityInfoCard}>
            <MaterialCommunityIcons name="shield-check" size={18} color="#10B981" />
            <Text style={styles.securityInfoText}>
              Your account is protected with SMS verification.
            </Text>
          </View>

          <Pressable style={styles.securityModalClose2} onPress={onClose}>
            <Text style={styles.securityModalCloseText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Documents Modal
// ─────────────────────────────────────────────────────────────
interface DocumentsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DocumentsModal({ visible, onClose }: DocumentsModalProps) {
  const documents = [
    {
      icon: "card-account-details-outline",
      title: "Driving License",
      status: "Not uploaded",
      statusColor: "#F59E0B",
    },
    {
      icon: "car-outline",
      title: "Vehicle RC",
      status: "Not uploaded",
      statusColor: "#F59E0B",
    },
    {
      icon: "badge-account-outline",
      title: "ID Proof",
      status: "Not uploaded",
      statusColor: "#F59E0B",
    },
    {
      icon: "shield-car",
      title: "Insurance",
      status: "Not uploaded",
      statusColor: "#F59E0B",
    },
  ];

  return (
    <BaseModal visible={visible} onClose={onClose} title="My Documents">
      <View style={[styles.card, { marginBottom: 12 }]}>
        {documents.map((doc, index) => (
          <View
            key={doc.title}
            style={[
              styles.listRow,
              index < documents.length - 1 && styles.listRowBorder,
            ]}
          >
            <View style={[styles.listRowIcon, { backgroundColor: "#FEF2F2" }]}>
              <MaterialCommunityIcons name={doc.icon} size={22} color="#F56B4C" />
            </View>
            <View style={styles.listRowContent}>
              <Text style={styles.listRowTitle}>{doc.title}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
              <Text style={[styles.statusBadgeText, { color: doc.statusColor }]}>
                {doc.status}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.outlineButton}
        onPress={() => Alert.alert(
          "Coming Soon",
          "Document upload functionality will be available soon. Please contact support for manual verification.",
          [{ text: "OK" }]
        )}
      >
        <MaterialCommunityIcons name="upload" size={18} color="#F56B4C" />
        <Text style={styles.outlineButtonText}>Upload Documents</Text>
      </Pressable>
    </BaseModal>
  );
}

// ─────────────────────────────────────────────────────────────
// Help Modal
// ─────────────────────────────────────────────────────────────
interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpModal({ visible, onClose }: HelpModalProps) {
  const helpItems = [
    {
      icon: "headset",
      title: "Contact Support",
      subtitle: "Get help from our team",
    },
    {
      icon: "frequently-asked-questions",
      title: "FAQs",
      subtitle: "Common questions answered",
    },
    {
      icon: "video-outline",
      title: "Video Tutorials",
      subtitle: "Learn how to use the app",
    },
    {
      icon: "chat-outline",
      title: "Live Chat",
      subtitle: "Chat with support",
    },
  ];

  return (
    <BaseModal visible={visible} onClose={onClose} title="Help Center">
      <View style={styles.card}>
        {helpItems.map((item, index) => (
          <Pressable
            key={item.title}
            style={[
              styles.listRow,
              index < helpItems.length - 1 && styles.listRowBorder,
            ]}
          >
            <View style={[styles.listRowIcon, { backgroundColor: "#F0FDF4" }]}>
              <MaterialCommunityIcons name={item.icon} size={22} color="#10B981" />
            </View>
            <View style={styles.listRowContent}>
              <Text style={styles.listRowTitle}>{item.title}</Text>
              <Text style={styles.listRowSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </Pressable>
        ))}
      </View>

      <View style={styles.helpContactCard}>
        <Text style={styles.helpContactTitle}>Need Immediate Help?</Text>
        <Text style={styles.helpContactSubtitle}>
          Our support team is available 24/7
        </Text>
        <Pressable style={styles.helpCallButton}>
          <MaterialCommunityIcons name="phone" size={18} color="#FFFFFF" />
          <Text style={styles.helpCallButtonText}>Call Support</Text>
        </Pressable>
      </View>
    </BaseModal>
  );
}

// ─────────────────────────────────────────────────────────────
// Confirmation Modal
// ─────────────────────────────────────────────────────────────
interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  destructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmationModal({
  visible,
  onClose,
  title,
  message,
  confirmText,
  onConfirm,
  destructive = false,
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayContainer}>
        <View style={styles.confirmModal}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmButtons}>
            <Pressable
              style={styles.confirmCancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.confirmCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmActionButton,
                destructive && styles.confirmActionButtonDestructive,
                isLoading && styles.confirmActionButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              <Text style={styles.confirmActionText}>
                {isLoading ? "..." : confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Terms & Privacy Modal
// ─────────────────────────────────────────────────────────────
interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

export function LegalModal({ visible, onClose, type }: LegalModalProps) {
  const title = type === "terms" ? "Terms of Service" : "Privacy Policy";
  const content =
    type === "terms"
      ? `Terms of Service

Last updated: January 2025

1. Acceptance of Terms
By accessing or using the Tiffsy Driver app, you agree to be bound by these Terms of Service.

2. Driver Eligibility
You must be at least 18 years old and possess a valid driver's license to use this service.

3. Service Description
The app provides a platform for drivers to receive and complete delivery assignments.

4. Driver Responsibilities
- Complete deliveries in a timely manner
- Maintain professional conduct
- Follow all traffic laws and regulations
- Keep your vehicle in good working condition

5. Payment Terms
Payments are processed weekly based on completed deliveries.

6. Termination
Either party may terminate this agreement at any time.

For questions, contact support@tiffsy.com`
      : `Privacy Policy

Last updated: January 2025

1. Information We Collect
- Personal information (name, phone, email)
- Location data during active deliveries
- Vehicle information
- Delivery history

2. How We Use Your Information
- To facilitate deliveries
- To process payments
- To improve our services
- To communicate with you

3. Data Security
We implement industry-standard security measures to protect your data.

4. Data Sharing
We do not sell your personal information. We may share data with:
- Restaurant partners (for delivery purposes)
- Payment processors
- As required by law

5. Your Rights
You may request access to, correction of, or deletion of your personal data.

6. Contact Us
For privacy inquiries: privacy@tiffsy.com`;

  return (
    <BaseModal visible={visible} onClose={onClose} title={title}>
      <View style={styles.legalCard}>
        <Text style={styles.legalText}>{content}</Text>
      </View>
    </BaseModal>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  radioRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  radioRowActive: {
    backgroundColor: "#EFF6FF",
  },
  radioRowContent: {
    flex: 1,
  },
  radioRowTitle: {
    fontSize: 15,
    color: "#111827",
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    borderColor: "#F56B4C",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F56B4C",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listRowDisabled: {
    opacity: 0.6,
  },
  listRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listRowContent: {
    flex: 1,
  },
  listRowTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  listRowSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#F56B4C",
    gap: 8,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F56B4C",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#C2410C",
    lineHeight: 18,
  },
  helpContactCard: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  helpContactTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  helpContactSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
  },
  helpCallButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  helpCallButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  confirmActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    alignItems: "center",
  },
  confirmActionButtonDestructive: {
    backgroundColor: "#EF4444",
  },
  confirmActionButtonDisabled: {
    opacity: 0.6,
  },
  confirmActionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  legalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  legalText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  // Language Modal Styles
  languageModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 320,
    overflow: "hidden",
  },
  languageModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  languageModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  languageModalClose: {
    padding: 4,
  },
  languageOptions: {
    paddingVertical: 8,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  languageOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  languageOptionActive: {
    backgroundColor: "#FEF2F2",
  },
  languageOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  languageOptionTextActive: {
    color: "#F56B4C",
    fontWeight: "600",
  },
  languageModalButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  languageModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  languageModalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  languageModalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F56B4C",
    alignItems: "center",
  },
  languageModalSaveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Security Modal Styles
  securityModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 320,
    overflow: "hidden",
  },
  securityModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  securityModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  securityModalClose: {
    padding: 4,
  },
  securityOptions: {
    paddingVertical: 8,
  },
  securityOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  securityOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  securityOptionDisabled: {
    opacity: 0.6,
  },
  securityOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  securityOptionContent: {
    flex: 1,
  },
  securityOptionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  securityOptionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  securityComingSoonBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  securityComingSoonText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  securityInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  securityInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#047857",
    lineHeight: 18,
  },
  securityModalClose2: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  securityModalCloseText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  // Vehicle Modal Styles
  vehicleModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 320,
    overflow: "hidden",
    padding: 20,
  },
  vehicleModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  vehicleModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  vehicleModalClose: {
    padding: 4,
  },
  vehicleModalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  vehicleOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  vehicleOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  vehicleOptionActive: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#F56B4C",
  },
  vehicleOptionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  vehicleOptionTextActive: {
    color: "#F56B4C",
    fontWeight: "600",
  },
  vehicleNumberInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  vehicleNumberText: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  vehicleNumberHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    marginBottom: 20,
  },
  vehicleModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  vehicleModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  vehicleModalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  vehicleModalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#F56B4C",
    alignItems: "center",
  },
  vehicleModalSaveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
