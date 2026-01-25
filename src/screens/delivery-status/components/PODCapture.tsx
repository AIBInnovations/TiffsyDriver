import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { OTPVerification } from "./OTPInput";

interface PODCaptureProps {
  visible: boolean;
  onClose: () => void;
  onVerifyOTP: (otp: string, notes?: string, recipientName?: string) => Promise<boolean>;
  customerPhone?: string;
  orderId?: string;
  isVerifying?: boolean;
  verifyError?: string | null;
}

export default function PODCapture({
  visible,
  onClose,
  onVerifyOTP,
  customerPhone,
  orderId,
  isVerifying = false,
  verifyError,
}: PODCaptureProps) {
  const [otpError, setOtpError] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [showNotesSection, setShowNotesSection] = useState(false);

  // Sync external error to local state
  useEffect(() => {
    if (verifyError) {
      setOtpError(verifyError);
    }
  }, [verifyError]);

  const resetForm = () => {
    setOtpError(undefined);
    setNotes("");
    setRecipientName("");
    setShowNotesSection(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleOTPVerify = async (otp: string) => {
    console.log('🔑 PODCapture - handleOTPVerify called with OTP:', otp);
    console.log('🔑 PODCapture - OTP type:', typeof otp);
    console.log('🔑 PODCapture - OTP length:', otp.length);

    setOtpError(undefined);

    // Validate OTP format (must be 4 digits)
    if (!/^\d{4}$/.test(otp)) {
      console.log('❌ PODCapture - OTP validation failed: not 4 digits');
      setOtpError("Please enter a valid 4-digit OTP");
      return;
    }

    // Trim and ensure clean OTP string
    const cleanOtp = otp.trim();
    console.log('🔑 PODCapture - Clean OTP to send:', cleanOtp);

    // Call the backend to verify OTP and complete delivery
    try {
      console.log('🔑 PODCapture - Calling onVerifyOTP...');
      const success = await onVerifyOTP(cleanOtp, notes || undefined, recipientName || undefined);
      console.log('🔑 PODCapture - onVerifyOTP returned:', success);
      if (success) {
        // Success - parent will close modal and show completion
        resetForm();
      }
      // If not successful, error will be shown via verifyError prop
    } catch (error: any) {
      console.log('❌ PODCapture - Error caught:', error.message);
      setOtpError(error.message || "Failed to verify OTP. Please try again.");
    }
  };

  const renderContent = () => (
    <View style={styles.stepContent}>
      {/* OTP Verification */}
      <OTPVerification
        onVerify={handleOTPVerify}
        isVerifying={isVerifying}
        error={otpError || verifyError || undefined}
      />

      {/* Optional Notes Section Toggle */}
      {!showNotesSection ? (
        <TouchableOpacity
          style={styles.addNotesButton}
          onPress={() => setShowNotesSection(true)}
          disabled={isVerifying}
        >
          <MaterialCommunityIcons name="note-plus-outline" size={18} color="#6B7280" />
          <Text style={styles.addNotesButtonText}>Add delivery notes (optional)</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.notesSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Name (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Who received the package?"
              placeholderTextColor="#9CA3AF"
              value={recipientName}
              onChangeText={setRecipientName}
              editable={!isVerifying}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Any notes about the delivery..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
              maxLength={300}
              editable={!isVerifying}
            />
            <Text style={styles.charCount}>{notes.length}/300</Text>
          </View>

          <TouchableOpacity
            style={styles.hideNotesButton}
            onPress={() => setShowNotesSection(false)}
            disabled={isVerifying}
          >
            <Text style={styles.hideNotesButtonText}>Hide notes</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Proof of Delivery</Text>
            {orderId && <Text style={styles.headerSubtitle}>{orderId}</Text>}
          </View>
          <View style={styles.headerButton} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: "100%" },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Enter OTP to complete delivery
          </Text>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065F46",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryTextComplete: {
    fontSize: 14,
    color: "#065F46",
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  addNotesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  addNotesButtonText: {
    fontSize: 14,
    color: "#6B7280",
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  hideNotesButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  hideNotesButtonText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
});
