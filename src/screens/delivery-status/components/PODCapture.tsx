import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView, Alert } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { OTPVerification } from "./OTPInput";

type PODStep = "otp" | "notes";

interface PODCaptureProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    otpVerified: boolean;
    notes?: string;
    recipientName?: string;
  }) => void;
  customerPhone?: string;
  orderId?: string;
}

export default function PODCapture({
  visible,
  onClose,
  onSubmit,
  customerPhone,
  orderId,
}: PODCaptureProps) {
  const [step, setStep] = useState<PODStep>("otp");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | undefined>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [notes, setNotes] = useState("");
  const [recipientName, setRecipientName] = useState("");

  const resetForm = () => {
    setStep("otp");
    setOtpVerified(false);
    setOtpError(undefined);
    setIsVerifying(false);
    setNotes("");
    setRecipientName("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleOTPVerify = (otp: string) => {
    setOtpError(undefined);

    // Simulate: 1234 is valid, anything else is invalid
    if (otp === "1234") {
      setIsVerifying(true);
      // Show loading only for successful verification
      setTimeout(() => {
        setOtpVerified(true);
        setStep("notes");
        setIsVerifying(false);
      }, 500);
    } else {
      // Show error immediately without loading
      setOtpError("Invalid OTP. Please try again.");
    }
  };

  const handleOTPResend = () => {
    setOtpError(undefined);
    Alert.alert("OTP Sent", "A new OTP has been sent to the customer.");
  };

  const handleSubmit = () => {
    onSubmit({
      otpVerified,
      notes: notes || undefined,
      recipientName: recipientName || undefined,
    });
    resetForm();
  };

  const renderOTPVerification = () => (
    <OTPVerification
      customerPhone={customerPhone}
      onVerify={handleOTPVerify}
      onResend={handleOTPResend}
      isVerifying={isVerifying}
      error={otpError}
    />
  );

  const renderNotesInput = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.successIcon}>
          <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
        </View>
        <Text style={styles.stepTitle}>OTP Verified!</Text>
        <Text style={styles.stepSubtitle}>
          Add any additional information about the delivery
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Recipient Name (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Who received the package?"
          placeholderTextColor="#9CA3AF"
          value={recipientName}
          onChangeText={setRecipientName}
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
        />
        <Text style={styles.charCount}>{notes.length}/300</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Verification Summary</Text>
        <View style={styles.summaryRow}>
          <MaterialCommunityIcons
            name="check-circle"
            size={18}
            color="#10B981"
          />
          <Text style={styles.summaryTextComplete}>
            OTP verified successfully
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="check-all" size={20} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>Complete Delivery</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case "otp":
        return renderOTPVerification();
      case "notes":
        return renderNotesInput();
      default:
        return renderOTPVerification();
    }
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
                { width: step === "otp" ? "50%" : "100%" },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {step === "otp" ? 1 : 2} of 2
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
});
