import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface FailedDeliveryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, notes?: string) => void;
  orderId?: string;
}

interface FailureReason {
  id: string;
  label: string;
  icon: string;
}

const failureReasons: FailureReason[] = [
  { id: "customer_unavailable", label: "Customer not available", icon: "account-off" },
  { id: "wrong_address", label: "Wrong address", icon: "map-marker-off" },
  { id: "customer_refused", label: "Customer refused delivery", icon: "hand-back-left" },
  { id: "access_denied", label: "Access denied to location", icon: "lock" },
  { id: "package_damaged", label: "Package damaged", icon: "package-variant-remove" },
  { id: "business_closed", label: "Business closed", icon: "store-off" },
  { id: "other", label: "Other", icon: "dots-horizontal" },
];

export default function FailedDeliveryModal({
  visible,
  onClose,
  onSubmit,
  orderId,
}: FailedDeliveryModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    const reason = failureReasons.filter(r => r.id === selectedReason)[0];
    const reasonLabel = reason ? reason.label : selectedReason;
    onSubmit(reasonLabel, notes);
    resetForm();
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setSelectedReason(null);
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Failed Delivery</Text>
            {orderId && <Text style={styles.headerSubtitle}>{orderId}</Text>}
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.headerButton, !selectedReason && styles.headerButtonDisabled]}
            disabled={!selectedReason || isSubmitting}
          >
            <Text style={[styles.submitText, !selectedReason && styles.submitTextDisabled]}>
              {isSubmitting ? "..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#92400E" />
          <Text style={styles.warningText}>
            Please provide a reason for the failed delivery. This helps improve service quality.
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Reason Selection */}
          <Text style={styles.sectionTitle}>Select a reason</Text>
          <View style={styles.reasonsContainer}>
            {failureReasons.map((reason) => {
              const isSelected = selectedReason === reason.id;
              return (
                <TouchableOpacity
                  key={reason.id}
                  onPress={() => setSelectedReason(reason.id)}
                  style={[
                    styles.reasonCard,
                    isSelected && styles.reasonCardSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.reasonIcon, isSelected && styles.reasonIconSelected]}>
                    <MaterialCommunityIcons
                      name={reason.icon}
                      size={20}
                      color={isSelected ? "#FFFFFF" : "#6B7280"}
                    />
                  </View>
                  <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
                    {reason.label}
                  </Text>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Additional Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notesHint}>Optional - provide more details if needed</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Enter any additional details about the failed delivery..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
            />
            <Text style={styles.charCount}>{notes.length}/500</Text>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, !selectedReason && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="alert-circle-check"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Submitting..." : "Mark as Failed"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  submitTextDisabled: {
    color: "#D1D5DB",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FEF3C7",
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginTop: 20,
    marginBottom: 12,
  },
  reasonsContainer: {
    gap: 8,
  },
  reasonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  reasonCardSelected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
  },
  reasonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reasonIconSelected: {
    backgroundColor: "#EF4444",
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  reasonLabelSelected: {
    color: "#991B1B",
    fontWeight: "600",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: {
    borderColor: "#EF4444",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
  },
  notesSection: {
    marginTop: 8,
  },
  notesHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    height: 120,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  charCount: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#FCA5A5",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
