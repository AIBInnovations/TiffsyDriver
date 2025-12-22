// src/screens/help/components/NewRequestForm.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { BottomSheet } from "./BottomSheet";
import {
  Card,
  Chip,
  Button,
  RadioGroup,
  ToggleRow,
  InlineBanner,
} from "./UIComponents";
import { TicketCategory, TicketFormData, ContactPreference } from "../types";
import { ticketCategories } from "../data/faqs";
import { useHelpSupportStore } from "../useHelpSupportStore";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

interface NewRequestFormProps {
  visible: boolean;
  onClose: () => void;
}

export function NewRequestForm({ visible, onClose }: NewRequestFormProps) {
  const {
    currentDraft,
    updateDraft,
    saveDraft,
    submitTicket,
    clearDraft,
    isSubmitting,
    draftSaveStatus,
  } = useHelpSupportStore();

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Debounced form for autosave
  const debouncedDraft = useDebounce(currentDraft, 2000);

  // Autosave effect
  useEffect(() => {
    if (
      visible &&
      (debouncedDraft.subject || debouncedDraft.description) &&
      debouncedDraft.category
    ) {
      saveDraft();
    }
  }, [debouncedDraft, visible]);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!currentDraft.category) {
      errors.category = "Please select a category";
    }
    if (!currentDraft.subject.trim()) {
      errors.subject = "Subject is required";
    }
    if (!currentDraft.description.trim()) {
      errors.description = "Description is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentDraft]);

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitError(null);
    const result = await submitTicket();

    if (!result.success) {
      setSubmitError(result.error || "Failed to submit");
    }
  };

  const handleSaveDraft = async () => {
    if (!currentDraft.subject && !currentDraft.description) {
      setValidationErrors({
        subject: "Add subject or description to save",
      });
      return;
    }
    await saveDraft();
  };

  const handleClose = () => {
    setValidationErrors({});
    setSubmitError(null);
    onClose();
  };

  const handleCategorySelect = (category: string) => {
    updateDraft({ category: category as TicketCategory });
    if (validationErrors.category) {
      setValidationErrors((prev) => ({ ...prev, category: "" }));
    }
  };

  const handleAddAttachment = (type: "photo" | "screenshot") => {
    // UI-only placeholder - no real camera/gallery integration
    const newAttachment = {
      id: `att-${Date.now()}`,
      type,
      uri: `placeholder-${type}-${Date.now()}`,
      name: `${type}-${currentDraft.attachments.length + 1}.jpg`,
    };
    updateDraft({
      attachments: [...currentDraft.attachments, newAttachment],
    });
  };

  const handleRemoveAttachment = (id: string) => {
    updateDraft({
      attachments: currentDraft.attachments.filter((a) => a.id !== id),
    });
  };

  const contactOptions = [
    { value: "Call", label: "Call" },
    { value: "WhatsApp", label: "WhatsApp" },
    { value: "Email", label: "Email" },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="New Support Request"
      height="full"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Autosave Status */}
        {draftSaveStatus !== "idle" && (
          <View style={styles.saveStatus}>
            {draftSaveStatus === "saving" && (
              <Text style={styles.saveStatusText}>Saving...</Text>
            )}
            {draftSaveStatus === "saved" && (
              <Text style={[styles.saveStatusText, styles.saveStatusSuccess]}>
                ✓ Draft saved
              </Text>
            )}
            {draftSaveStatus === "error" && (
              <Text style={[styles.saveStatusText, styles.saveStatusError]}>
                Draft not saved
              </Text>
            )}
          </View>
        )}

        {/* Submit Error */}
        {submitError && (
          <InlineBanner
            message={submitError}
            type="error"
            onDismiss={() => setSubmitError(null)}
          />
        )}

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {ticketCategories.map((cat) => (
              <Pressable
                key={cat.value}
                style={[
                  styles.categoryChip,
                  currentDraft.category === cat.value &&
                    styles.categoryChipSelected,
                ]}
                onPress={() => handleCategorySelect(cat.value)}
              >
                <MaterialCommunityIcons
                  name={cat.icon}
                  size={20}
                  color={
                    currentDraft.category === cat.value ? "#FFFFFF" : "#6B7280"
                  }
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    currentDraft.category === cat.value &&
                      styles.categoryLabelSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {validationErrors.category && (
            <Text style={styles.errorText}>{validationErrors.category}</Text>
          )}
        </View>

        {/* Order/Batch ID (Optional) */}
        <View style={styles.section}>
          <Text style={styles.label}>Link to Order/Batch (Optional)</Text>
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.input}
                placeholder="Order ID"
                placeholderTextColor="#9CA3AF"
                value={currentDraft.orderId}
                onChangeText={(text) => updateDraft({ orderId: text })}
              />
            </View>
            <View style={styles.halfInput}>
              <TextInput
                style={styles.input}
                placeholder="Batch ID"
                placeholderTextColor="#9CA3AF"
                value={currentDraft.batchId}
                onChangeText={(text) => updateDraft({ batchId: text })}
              />
            </View>
          </View>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={[
              styles.input,
              validationErrors.subject && styles.inputError,
            ]}
            placeholder="Brief summary of your issue"
            placeholderTextColor="#9CA3AF"
            value={currentDraft.subject}
            onChangeText={(text) => {
              updateDraft({ subject: text });
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
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              validationErrors.description && styles.inputError,
            ]}
            placeholder="Describe your issue in detail..."
            placeholderTextColor="#9CA3AF"
            value={currentDraft.description}
            onChangeText={(text) => {
              updateDraft({ description: text });
              if (validationErrors.description) {
                setValidationErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {validationErrors.description && (
            <Text style={styles.errorText}>{validationErrors.description}</Text>
          )}
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <Text style={styles.label}>Attachments</Text>
          <View style={styles.attachmentButtons}>
            <Pressable
              style={styles.attachmentButton}
              onPress={() => handleAddAttachment("photo")}
            >
              <MaterialCommunityIcons name="camera" size={20} color="#6B7280" />
              <Text style={styles.attachmentButtonText}>Add Photo</Text>
            </Pressable>
            <Pressable
              style={styles.attachmentButton}
              onPress={() => handleAddAttachment("screenshot")}
            >
              <MaterialCommunityIcons
                name="cellphone-screenshot"
                size={20}
                color="#6B7280"
              />
              <Text style={styles.attachmentButtonText}>Add Screenshot</Text>
            </Pressable>
          </View>

          {currentDraft.attachments.length > 0 && (
            <View style={styles.attachmentList}>
              {currentDraft.attachments.map((att) => (
                <View key={att.id} style={styles.attachmentItem}>
                  <MaterialCommunityIcons
                    name={att.type === "photo" ? "image" : "cellphone"}
                    size={16}
                    color="#6B7280"
                  />
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {att.name || att.type}
                  </Text>
                  <Pressable
                    onPress={() => handleRemoveAttachment(att.id)}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={18}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Contact Preference */}
        <View style={styles.section}>
          <Text style={styles.label}>Preferred Contact Method</Text>
          <RadioGroup
            options={contactOptions}
            value={currentDraft.contactPreference}
            onChange={(value) =>
              updateDraft({ contactPreference: value as ContactPreference })
            }
            horizontal
          />
        </View>

        {/* Consent Toggle */}
        <View style={styles.section}>
          <ToggleRow
            title="Include app logs"
            subtitle="Share diagnostic info to help resolve your issue faster"
            value={currentDraft.consentToShareLogs}
            onValueChange={(value) =>
              updateDraft({ consentToShareLogs: value })
            }
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Save Draft"
            onPress={handleSaveDraft}
            variant="secondary"
            size="large"
          />
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Button
              label="Submit"
              onPress={handleSubmit}
              variant="primary"
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  saveStatus: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  saveStatusText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  saveStatusSuccess: {
    color: "#16A34A",
  },
  saveStatusError: {
    color: "#DC2626",
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
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryChipSelected: {
    backgroundColor: "#F56B4C",
    borderColor: "#F56B4C",
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginLeft: 6,
  },
  categoryLabelSelected: {
    color: "#FFFFFF",
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  attachmentButtons: {
    flexDirection: "row",
    gap: 12,
  },
  attachmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#FAFAFA",
  },
  attachmentButtonText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 8,
  },
  attachmentList: {
    marginTop: 12,
    gap: 8,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  attachmentName: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
    marginLeft: 8,
    marginRight: 8,
  },
  actions: {
    flexDirection: "row",
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
});
