import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useState, useRef, useEffect } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OTPInput({
  length = 4,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  autoFocus = true,
}: OTPInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChange = (text: string, index: number) => {
    if (disabled) return;

    // Only allow digits
    const digit = text.replace(/[^0-9]/g, "").slice(-1);

    // Build new value
    const newValue = value.split("");
    newValue[index] = digit;
    const updatedValue = newValue.join("").slice(0, length);

    onChange(updatedValue);

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (disabled) return;

    if (e.nativeEvent.key === "Backspace") {
      if (!value[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
        const newValue = value.split("");
        newValue[index - 1] = "";
        onChange(newValue.join(""));
      } else {
        // Clear current input
        const newValue = value.split("");
        newValue[index] = "";
        onChange(newValue.join(""));
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const handlePaste = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, length);
    onChange(digits);
    if (digits.length === length) {
      inputRefs.current[length - 1]?.blur();
    } else if (digits.length > 0) {
      inputRefs.current[digits.length]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {Array.from({ length }, (_, index) => {
          const isFocused = focusedIndex === index;
          const hasValue = !!value[index];
          const hasError = !!error;

          return (
            <View key={index} style={styles.inputWrapper}>
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.input,
                  !hasError && isFocused && styles.inputFocused,
                  hasError && styles.inputError,
                  disabled && styles.inputDisabled,
                ]}
                value={value[index] || ""}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!disabled}
                caretHidden
              />
            </View>
          );
        })}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={14} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

interface OTPVerificationProps {
  onVerify: (otp: string) => void;
  onSkip?: () => void;
  isVerifying?: boolean;
  error?: string;
  customerPhone?: string; // Keep for compatibility but not used for display
}

export function OTPVerification({
  onVerify,
  onSkip,
  isVerifying = false,
  error,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState("");

  // Clear OTP when error occurs so user can easily re-enter
  useEffect(() => {
    if (error) {
      setOtp("");
    }
  }, [error]);

  const handleVerify = () => {
    if (otp.length === 4) {
      console.log('🔑 OTP Verification - Submitting OTP:', otp);
      onVerify(otp);
    }
  };

  return (
    <View style={styles.verificationContainer}>
      {/* Header */}
      <View style={styles.verificationHeader}>
        <View style={styles.otpIcon}>
          <MaterialCommunityIcons name="shield-check" size={32} color="#3B82F6" />
        </View>
        <Text style={styles.verificationTitle}>OTP Verification</Text>
        <Text style={styles.verificationSubtitle}>
          Ask customer for the 4-digit OTP{"\n"}displayed on their app
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpSection}>
        <OTPInput
          length={4}
          value={otp}
          onChange={setOtp}
          onComplete={handleVerify}
          error={error}
          disabled={isVerifying}
        />
      </View>

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <MaterialCommunityIcons name="information-outline" size={16} color="#6B7280" />
        <Text style={styles.helpText}>
          Customer can find OTP in their app under "Track Order"
        </Text>
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.verifyButton,
          (otp.length < 4 || isVerifying) && styles.verifyButtonDisabled,
        ]}
        onPress={handleVerify}
        disabled={otp.length < 4 || isVerifying}
        activeOpacity={0.8}
      >
        {isVerifying ? (
          <Text style={styles.verifyButtonText}>Verifying...</Text>
        ) : (
          <>
            <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" />
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Skip Option */}
      {onSkip && (
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipText}>Skip OTP verification</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    width: 56,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },
  inputFocused: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  inputFilled: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: "#F3F4F6",
  },
  dotIndicator: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  dotError: {
    backgroundColor: "#EF4444",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 4,
  },
  errorText: {
    fontSize: 13,
    color: "#EF4444",
  },
  verificationContainer: {
    padding: 20,
  },
  verificationHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  otpIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  verificationSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  otpSection: {
    marginBottom: 20,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 6,
    paddingHorizontal: 12,
  },
  helpText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
    textAlign: "center",
  },
  verifyButton: {
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
  verifyButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    color: "#6B7280",
    textDecorationLine: "underline",
  },
});
