// src/screens/help/components/SafetyFlow.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BottomSheet, CompactModal } from "./BottomSheet";
import { Button, InlineBanner, Card } from "./UIComponents";
import { useHelpSupportStore } from "../useHelpSupportStore";

interface SafetyFlowProps {
  visible: boolean;
  onClose: () => void;
}

export function SafetyFlow({ visible, onClose }: SafetyFlowProps) {
  const { submitSafetyTicket, isSubmitting } = useHelpSupportStore();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSafe, setIsSafe] = useState<boolean | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const resetForm = () => {
    setSubject("");
    setDescription("");
    setIsSafe(null);
    setError(null);
    setValidationErrors({});
    setShowConfirm(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateAndProceed = () => {
    const errors: Record<string, string> = {};

    if (!subject.trim()) {
      errors.subject = "Subject is required";
    }
    if (!description.trim()) {
      errors.description = "Please describe the safety concern";
    }
    if (isSafe === null) {
      errors.safety = "Please confirm your safety status";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setShowConfirm(true);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    const result = await submitSafetyTicket({
      subject,
      description,
      isSafe: isSafe ?? false,
    });

    if (result.success) {
      resetForm();
    } else {
      setShowConfirm(false);
      setError(result.error || "Failed to submit");
    }
  };

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={handleClose}
        title="Report Safety Issue"
        height="auto"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Emergency Warning */}
          <Card style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <MaterialCommunityIcons
                name="alert-octagon"
                size={24}
                color="#DC2626"
              />
              <Text style={styles.warningTitle}>Emergency?</Text>
            </View>
            <Text style={styles.warningText}>
              If you are in immediate danger, please contact local emergency
              services (Police: 100, Ambulance: 102) before using this form.
            </Text>
          </Card>

          {error && (
            <InlineBanner
              message={error}
              type="error"
              onDismiss={() => setError(null)}
            />
          )}

          {/* Safety Status */}
          <View style={styles.section}>
            <Text style={styles.label}>Are you safe right now? *</Text>
            <View style={styles.safetyOptions}>
              <Pressable
                style={[
                  styles.safetyOption,
                  isSafe === true && styles.safetyOptionSelected,
                  isSafe === true && styles.safetyOptionSafe,
                ]}
                onPress={() => {
                  setIsSafe(true);
                  if (validationErrors.safety) {
                    setValidationErrors((prev) => ({ ...prev, safety: "" }));
                  }
                }}
              >
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={isSafe === true ? "#16A34A" : "#9CA3AF"}
                />
                <Text
                  style={[
                    styles.safetyOptionText,
                    isSafe === true && styles.safetyOptionTextSafe,
                  ]}
                >
                  Yes, I'm safe
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.safetyOption,
                  isSafe === false && styles.safetyOptionSelected,
                  isSafe === false && styles.safetyOptionUnsafe,
                ]}
                onPress={() => {
                  setIsSafe(false);
                  if (validationErrors.safety) {
                    setValidationErrors((prev) => ({ ...prev, safety: "" }));
                  }
                }}
              >
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={24}
                  color={isSafe === false ? "#DC2626" : "#9CA3AF"}
                />
                <Text
                  style={[
                    styles.safetyOptionText,
                    isSafe === false && styles.safetyOptionTextUnsafe,
                  ]}
                >
                  No, I need help
                </Text>
              </Pressable>
            </View>
            {validationErrors.safety && (
              <Text style={styles.errorText}>{validationErrors.safety}</Text>
            )}
          </View>

          {/* Subject */}
          <View style={styles.section}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={[
                styles.input,
                validationErrors.subject && styles.inputError,
              ]}
              placeholder="Brief description of the issue"
              placeholderTextColor="#9CA3AF"
              value={subject}
              onChangeText={(text) => {
                setSubject(text);
                if (validationErrors.subject) {
                  setValidationErrors((prev) => ({ ...prev, subject: "" }));
                }
              }}
              maxLength={100}
            />
            {validationErrors.subject && (
              <Text style={styles.errorText}>{validationErrors.subject}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Describe what happened *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                validationErrors.description && styles.inputError,
              ]}
              placeholder="Please provide details about the safety concern..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (validationErrors.description) {
                  setValidationErrors((prev) => ({ ...prev, description: "" }));
                }
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {validationErrors.description && (
              <Text style={styles.errorText}>
                {validationErrors.description}
              </Text>
            )}
          </View>

          {/* Priority Notice */}
          <View style={styles.priorityNotice}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={16}
              color="#D97706"
            />
            <Text style={styles.priorityText}>
              Safety reports are treated as high priority and reviewed
              immediately during working hours.
            </Text>
          </View>

          {/* Submit Button */}
          <Button
            label="Submit Safety Report"
            onPress={validateAndProceed}
            variant="danger"
            size="large"
            fullWidth
            icon="shield-alert"
          />
        </ScrollView>
      </BottomSheet>

      {/* Confirmation Modal */}
      <CompactModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Confirm Submission"
      >
        <View style={styles.confirmContent}>
          <View style={styles.confirmIcon}>
            <MaterialCommunityIcons
              name="shield-alert"
              size={40}
              color="#D97706"
            />
          </View>
          <Text style={styles.confirmText}>
            You're about to submit a safety report. Our team will review this
            with high priority.
          </Text>
          {isSafe === false && (
            <View style={styles.urgentNotice}>
              <MaterialCommunityIcons
                name="phone"
                size={16}
                color="#DC2626"
              />
              <Text style={styles.urgentText}>
                We'll attempt to contact you immediately.
              </Text>
            </View>
          )}
        </View>
        <View style={styles.confirmActions}>
          <Button
            label="Cancel"
            onPress={() => setShowConfirm(false)}
            variant="secondary"
            size="medium"
          />
          <View style={{ width: 12 }} />
          <Button
            label="Submit"
            onPress={handleSubmit}
            variant="danger"
            size="medium"
            loading={isSubmitting}
          />
        </View>
      </CompactModal>
    </>
  );
}

const styles = StyleSheet.create({
  warningCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 20,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
    marginLeft: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  safetyOptions: {
    flexDirection: "row",
    gap: 12,
  },
  safetyOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  safetyOptionSelected: {
    borderWidth: 2,
  },
  safetyOptionSafe: {
    borderColor: "#16A34A",
    backgroundColor: "#F0FDF4",
  },
  safetyOptionUnsafe: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  safetyOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 8,
  },
  safetyOptionTextSafe: {
    color: "#16A34A",
  },
  safetyOptionTextUnsafe: {
    color: "#DC2626",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 4,
  },
  priorityNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  priorityText: {
    fontSize: 12,
    color: "#92400E",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  confirmContent: {
    alignItems: "center",
    marginBottom: 20,
  },
  confirmIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFBEB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  confirmText: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
  },
  urgentNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  urgentText: {
    fontSize: 13,
    color: "#DC2626",
    marginLeft: 8,
    fontWeight: "500",
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
