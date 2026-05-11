import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView, Image, ActivityIndicator, Platform, PermissionsAndroid } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { launchCamera, launchImageLibrary, type Asset } from "react-native-image-picker";
import { OTPVerification } from "./OTPInput";

interface PODCaptureProps {
  visible: boolean;
  onClose: () => void;
  // OTP flow (used when leaveAtDoor=false)
  onVerifyOTP: (otp: string, notes?: string, recipientName?: string) => Promise<boolean>;
  // Photo-proof flow (used when leaveAtDoor=true). When omitted, the modal only does OTP.
  onSubmitPhoto?: (asset: Asset, notes?: string) => Promise<boolean>;
  customerPhone?: string;
  orderId?: string;
  isVerifying?: boolean;
  verifyError?: string | null;
  // Customer-side delivery preferences. leaveAtDoor switches the modal into photo-proof mode.
  leaveAtDoor?: boolean;
  doNotContact?: boolean;
}

const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: "Camera Permission",
        message: "We need camera access to capture proof-of-delivery photos.",
        buttonPositive: "Allow",
        buttonNegative: "Cancel",
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

export default function PODCapture({
  visible,
  onClose,
  onVerifyOTP,
  onSubmitPhoto,
  // customerPhone is part of the public API for future use (e.g., showing partial number
  // in confirmations), but the modal itself doesn't render it today. Underscore silences
  // the unused-variable hint without changing the prop contract.
  customerPhone: _customerPhone,
  orderId,
  isVerifying = false,
  verifyError,
  leaveAtDoor = false,
  doNotContact = false,
}: PODCaptureProps) {
  const [otpError, setOtpError] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [photoAsset, setPhotoAsset] = useState<Asset | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>();

  // Sync external error to local state
  useEffect(() => {
    if (verifyError) {
      setOtpError(verifyError);
      setPhotoError(verifyError);
    }
  }, [verifyError]);

  const resetForm = () => {
    setOtpError(undefined);
    setPhotoError(undefined);
    setNotes("");
    setRecipientName("");
    setShowNotesSection(false);
    setPhotoAsset(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleOTPVerify = async (otp: string) => {
    setOtpError(undefined);
    if (!/^\d{4}$/.test(otp)) {
      setOtpError("Please enter a valid 4-digit OTP");
      return;
    }
    try {
      const success = await onVerifyOTP(otp.trim(), notes || undefined, recipientName || undefined);
      if (success) resetForm();
    } catch (error: any) {
      setOtpError(error.message || "Failed to verify OTP. Please try again.");
    }
  };

  const handleTakePhoto = async () => {
    setPhotoError(undefined);
    const granted = await requestCameraPermission();
    if (!granted) {
      setPhotoError("Camera permission denied. Enable it in device settings.");
      return;
    }
    const result = await launchCamera({
      mediaType: "photo",
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
      saveToPhotos: false,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      setPhotoError(result.errorMessage || "Could not open camera.");
      return;
    }
    const asset = result.assets?.[0];
    if (asset) setPhotoAsset(asset);
  };

  const handlePickFromGallery = async () => {
    setPhotoError(undefined);
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
      selectionLimit: 1,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      setPhotoError(result.errorMessage || "Could not open gallery.");
      return;
    }
    const asset = result.assets?.[0];
    if (asset) setPhotoAsset(asset);
  };

  const handleSubmitPhoto = async () => {
    setPhotoError(undefined);
    if (!photoAsset) {
      setPhotoError("Please capture or pick a photo first.");
      return;
    }
    if (!onSubmitPhoto) {
      setPhotoError("Photo proof handler is not configured.");
      return;
    }
    try {
      const success = await onSubmitPhoto(photoAsset, notes || undefined);
      if (success) resetForm();
    } catch (error: any) {
      setPhotoError(error.message || "Failed to upload photo. Please try again.");
    }
  };

  // ---- Photo-proof flow (Leave at Door) ----
  const renderPhotoFlow = () => (
    <View style={styles.stepContent}>
      <View style={styles.flowHeader}>
        <View style={styles.flowIcon}>
          <MaterialCommunityIcons name="door-open" size={28} color="#FE8733" />
        </View>
        <Text style={styles.flowTitle}>Leave at Door</Text>
        <Text style={styles.flowSubtitle}>
          The customer asked you to leave the order at their door. No OTP needed — just take
          a clear photo as proof of delivery.
        </Text>
        {doNotContact && (
          <View style={styles.warningBadge}>
            <MaterialCommunityIcons name="bell-off-outline" size={14} color="#9A3412" />
            <Text style={styles.warningBadgeText}>Do not call or message</Text>
          </View>
        )}
      </View>

      {/* Preview / Pick area */}
      {photoAsset ? (
        <View style={styles.photoPreviewWrap}>
          <Image source={{ uri: photoAsset.uri }} style={styles.photoPreview} resizeMode="cover" />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => setPhotoAsset(null)}
            disabled={isVerifying}
          >
            <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoPickRow}>
          <TouchableOpacity style={styles.photoPickButton} onPress={handleTakePhoto} disabled={isVerifying}>
            <MaterialCommunityIcons name="camera" size={26} color="#FE8733" />
            <Text style={styles.photoPickButtonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoPickButton} onPress={handlePickFromGallery} disabled={isVerifying}>
            <MaterialCommunityIcons name="image-outline" size={26} color="#FE8733" />
            <Text style={styles.photoPickButtonText}>From Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {photoError && (
        <Text style={styles.errorText}>{photoError}</Text>
      )}

      {/* Optional notes */}
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
            <Text style={styles.inputLabel}>Delivery Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="E.g., Left at the front door under the mat"
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

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, (!photoAsset || isVerifying) && styles.submitButtonDisabled]}
        onPress={handleSubmitPhoto}
        disabled={!photoAsset || isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Submit Photo & Mark Delivered</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ---- OTP flow (default) ----
  const renderOTPFlow = () => (
    <View style={styles.stepContent}>
      <OTPVerification
        onVerify={handleOTPVerify}
        isVerifying={isVerifying}
        error={otpError || verifyError || undefined}
      />

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

        {/* Progress hint */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
          <Text style={styles.progressText}>
            {leaveAtDoor ? "Capture a photo to complete delivery" : "Enter OTP to complete delivery"}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {leaveAtDoor ? renderPhotoFlow() : renderOTPFlow()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  progressBar: { height: 4, backgroundColor: "#E5E7EB", borderRadius: 2, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#3B82F6", borderRadius: 2 },
  progressText: { fontSize: 12, color: "#6B7280", textAlign: "center" },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  stepContent: { padding: 20 },
  flowHeader: { alignItems: "center", marginBottom: 20 },
  flowIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  flowTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6, textAlign: "center" },
  flowSubtitle: { fontSize: 13, color: "#6B7280", textAlign: "center", lineHeight: 19, paddingHorizontal: 8 },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FED7AA",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginTop: 10,
  },
  warningBadgeText: { fontSize: 12, fontWeight: "600", color: "#9A3412" },
  photoPickRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  photoPickButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 14,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "#FED7AA",
    alignItems: "center",
    gap: 6,
  },
  photoPickButtonText: { fontSize: 13, fontWeight: "600", color: "#9A3412" },
  photoPreviewWrap: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#F3F4F6",
    position: "relative",
  },
  photoPreview: { width: "100%", height: 220 },
  retakeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  retakeButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  errorText: { color: "#DC2626", fontSize: 13, marginBottom: 12, textAlign: "center" },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: "#9CA3AF", textAlign: "right", marginTop: 4 },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: { backgroundColor: "#9CA3AF", shadowOpacity: 0 },
  submitButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  addNotesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
  },
  addNotesButtonText: { fontSize: 14, color: "#6B7280" },
  notesSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  hideNotesButton: { alignItems: "center", paddingVertical: 8 },
  hideNotesButtonText: { fontSize: 13, color: "#9CA3AF" },
});
