import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {
  DriverProfile,
  VehicleType,
  Language,
  languageLabels,
} from "../useDriverProfileStore";
import { SegmentedControl } from "./ProfileUIComponents";

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  profile: DriverProfile;
  onSave: (updates: Partial<DriverProfile>) => Promise<void>;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  vehicleNumber?: string;
}

export default function EditProfileSheet({
  visible,
  onClose,
  profile,
  onSave,
}: EditProfileSheetProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [vehicleType, setVehicleType] = useState<VehicleType>(profile.vehicleType);
  const [vehicleNumber, setVehicleNumber] = useState(profile.vehicleNumber);
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(profile.preferredLanguage);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when profile changes or modal opens
  useEffect(() => {
    if (visible) {
      setFullName(profile.fullName);
      setEmail(profile.email);
      setVehicleType(profile.vehicleType);
      setVehicleNumber(profile.vehicleNumber);
      setPreferredLanguage(profile.preferredLanguage);
      setErrors({});
    }
  }, [visible, profile]);

  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue) return true; // Optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Name is required";
    }

    if (email && !validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!vehicleNumber.trim()) {
      newErrors.vehicleNumber = "Vehicle number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 600)); // Simulate delay
      await onSave({
        fullName: fullName.trim(),
        email: email.trim(),
        vehicleType,
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        preferredLanguage,
      });
      onClose();
    } catch (e) {
      Alert.alert("Error", "Couldn't save locally. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const vehicleOptions: { value: VehicleType; label: string }[] = [
    { value: "BIKE", label: "Bike" },
    { value: "SCOOTER", label: "Scooter" },
    { value: "CAR", label: "Car" },
  ];

  const languageOptions: { value: Language; label: string }[] = [
    { value: "EN", label: "English" },
    { value: "HI", label: "Hindi" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={["top"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              disabled={isSaving}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.headerButton} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Editable Fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  editable={!isSaving}
                />
                {errors.fullName && (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                )}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (Optional)</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSaving}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>
            </View>

            {/* Read-only Fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={profile.phone}
                  editable={false}
                />
                <Text style={styles.hintText}>Contact support to change</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Driver ID</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={profile.driverId}
                  editable={false}
                />
              </View>
            </View>

            {/* Vehicle Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Type</Text>
                <SegmentedControl
                  options={vehicleOptions}
                  value={vehicleType}
                  onChange={setVehicleType}
                  disabled={isSaving}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle Number *</Text>
                <TextInput
                  style={[styles.input, errors.vehicleNumber && styles.inputError]}
                  value={vehicleNumber}
                  onChangeText={(text) => setVehicleNumber(text.toUpperCase())}
                  placeholder="e.g., MH 12 AB 1234"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  editable={!isSaving}
                />
                {errors.vehicleNumber && (
                  <Text style={styles.errorText}>{errors.vehicleNumber}</Text>
                )}
              </View>
            </View>

            {/* Language Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferred Language</Text>

              <View style={styles.radioGroup}>
                {languageOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.radioOption,
                      preferredLanguage === option.value && styles.radioOptionActive,
                    ]}
                    onPress={() => setPreferredLanguage(option.value)}
                    disabled={isSaving}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        preferredLanguage === option.value && styles.radioCircleActive,
                      ]}
                    >
                      {preferredLanguage === option.value && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.radioLabel,
                        preferredLanguage === option.value && styles.radioLabelActive,
                      ]}
                    >
                      {languageLabels[option.value]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <Pressable
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#6B7280",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  radioOptionActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: "#3B82F6",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
  },
  radioLabel: {
    fontSize: 15,
    color: "#374151",
  },
  radioLabelActive: {
    color: "#1E40AF",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
