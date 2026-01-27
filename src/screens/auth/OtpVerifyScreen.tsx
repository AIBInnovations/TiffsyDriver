// src/screens/auth/OTPVerificationScreen.tsx
import { useState, useRef, useEffect, Fragment } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { AuthStackScreenProps } from "../../navigation/types";
import { syncUser, getFirebaseToken } from '../../services/authService';
import { tokenStorage } from '../../utils/tokenStorage';
import { useDriverProfileStore } from '../profile/useDriverProfileStore';
import { registerFCMToken } from '../../services/fcmService';
import CustomAlert from '../../components/common/CustomAlert';
import { LegalModal } from '../profile/components/ProfileModals';

type Props = AuthStackScreenProps<'OtpVerify'>;

const OTPVerificationScreen = ({ navigation, route }: Props) => {
  const { phoneNumber, confirmation } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
    onConfirm?: () => void;
  }>({ visible: false, title: '', message: '' });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Get profile store to set availability status
  const { setAvailabilityStatus } = useDriverProfileStore();

  // Refs for input fields
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start timer
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all fields are filled
    if (newOtp.every(digit => digit !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length === 6) {
      setVerifying(true);
      try {
        // Step 1: Verify the OTP code with Firebase
        console.log('🔐 Verifying OTP with Firebase...');
        const userCredential = await confirmation.confirm(code);
        console.log('✅ Firebase OTP verified successfully');
        console.log('👤 User:', userCredential.user.uid);

        // Step 2: Get Firebase ID token
        console.log('🔑 Getting Firebase ID token...');
        const idToken = await getFirebaseToken();

        // Step 3: Store the token
        await tokenStorage.setToken(idToken);
        console.log('💾 Token stored in AsyncStorage');

        // Step 4: Sync with backend
        console.log('📡 Syncing user with backend...');
        const syncResponse = await syncUser();

        console.log('📊 Sync response:', {
          isNewUser: syncResponse.data.isNewUser,
          isProfileComplete: syncResponse.data.isProfileComplete,
          userName: syncResponse.data.user?.name,
          userRole: syncResponse.data.user?.role
        });

        // ⚠️ DEBUG: Show full backend response
        console.log('🔍 FULL BACKEND RESPONSE:', JSON.stringify(syncResponse, null, 2));

        // Step 5: Register FCM token for push notifications
        console.log('🔔 Registering FCM token for push notifications...');
        try {
          const fcmRegistered = await registerFCMToken();

          if (fcmRegistered) {
            console.log('✅ FCM token registered successfully');
          } else {
            console.log('⚠️ FCM token registration failed - likely permission denied');
            // Show informational alert about notifications
            setAlertConfig({
              visible: true,
              title: 'Notification Permission',
              message: 'Notification permission was not granted. You can enable it later in your Profile settings to receive important updates about deliveries and batches.',
              icon: 'bell-off-outline',
              iconColor: '#F59E0B',
            });
          }
        } catch (fcmError) {
          console.error('⚠️ Failed to register FCM token (non-critical):', fcmError);
          // Don't block login if FCM registration fails
        }

        // Step 6: Handle response based on user status
        if (syncResponse.data.isNewUser) {
          // New user - navigate directly to driver registration
          console.log('👤 New user detected, navigating to driver registration...');
          navigation.replace('DriverRegistration', { phoneNumber });
        } else if (syncResponse.data.user?.role !== 'DRIVER') {
          // User exists but is not a driver
          setAlertConfig({
            visible: true,
            title: 'Access Denied',
            message: 'This app is only for drivers. Your account has a different role.',
            icon: 'account-cancel',
            iconColor: '#EF4444',
            onConfirm: async () => {
              await auth().signOut();
              await tokenStorage.clearAll();
              navigation.goBack();
            },
          });
        } else {
          // User is a DRIVER - check approval status
          const { approvalStatus, rejectionReason } = syncResponse.data;
          console.log('🚗 Driver user, checking approval status:', approvalStatus);

          switch (approvalStatus) {
            case 'PENDING':
              console.log('⏳ Driver registration is PENDING approval');
              navigation.replace('ApprovalWaiting', { phoneNumber });
              break;

            case 'REJECTED':
              console.log('❌ Driver registration was REJECTED');
              navigation.replace('Rejection', {
                phoneNumber,
                rejectionReason: rejectionReason || 'No reason provided',
              });
              break;

            case 'APPROVED':
              console.log('✅ Driver is APPROVED, checking profile completion...');
              if (!syncResponse.data.isProfileComplete) {
                console.log('📝 Profile incomplete, navigating to profile completion...');
                navigation.replace('ProfileOnboarding', { phoneNumber });
              } else {
                console.log('✅ Profile complete, setting driver to ONLINE and navigating to main app...');
                await setAvailabilityStatus('ONLINE');
                navigation.getParent()?.navigate('Main');
              }
              break;

            default:
              // No approval status (legacy user or not yet registered as driver)
              console.log('⚠️ No approval status, checking profile completion...');
              if (!syncResponse.data.isProfileComplete) {
                console.log('📝 Profile incomplete, navigating to profile completion...');
                navigation.replace('ProfileOnboarding', { phoneNumber });
              } else {
                console.log('✅ Profile complete, setting driver to ONLINE and navigating to main app...');
                await setAvailabilityStatus('ONLINE');
                navigation.getParent()?.navigate('Main');
              }
          }
        }

      } catch (error: any) {
        console.error('❌ Error during OTP verification:', error);

        // Check if it's a Firebase OTP error or backend error
        if (error.code?.includes('auth/')) {
          setAlertConfig({
            visible: true,
            title: 'Invalid OTP',
            message: 'The code you entered is incorrect. Please try again.',
            icon: 'lock-alert',
            iconColor: '#EF4444',
          });
        } else {
          // Backend connection error
          let errorMessage = error.message || 'Failed to connect to server.';

          if (error.message?.includes('non-JSON response') || error.message?.includes('JSON Parse error')) {
            errorMessage = 'Cannot connect to backend server.\n\nPlease check:\n1. Backend server is running\n2. Backend URL is correct in src/config/api.ts\n3. Network connection is stable\n\nSee console logs for details.';
          }

          setAlertConfig({
            visible: true,
            title: 'Backend Connection Error',
            message: errorMessage,
            icon: 'server-network-off',
            iconColor: '#EF4444',
          });
        }

        // Clear OTP fields on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } finally {
        setVerifying(false);
      }
    }
  };

  const handleResendOTP = async () => {
    if (canResend) {
      setVerifying(true);
      try {
        console.log('🔄 Resending OTP...');

        // Remove +91 prefix and space, get just the digits
        const phoneDigits = phoneNumber.replace(/[^\d]/g, '');
        const fullPhoneNumber = `+91${phoneDigits}`;

        console.log('📱 Phone number:', fullPhoneNumber);

        // Resend OTP
        const newConfirmation = await auth().signInWithPhoneNumber(fullPhoneNumber);
        console.log('✅ OTP resent successfully');

        // Update route params with new confirmation
        navigation.setParams({ confirmation: newConfirmation });

        setTimer(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();

        setAlertConfig({
          visible: true,
          title: 'Success',
          message: 'OTP has been resent to your phone.',
          icon: 'check-circle',
          iconColor: '#10B981',
        });
      } catch (error: any) {
        console.error('❌ Error resending OTP:', error);
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: error.message || 'Failed to resend OTP. Please try again.',
          icon: 'alert-circle',
          iconColor: '#EF4444',
        });
      } finally {
        setVerifying(false);
      }
    }
  };

  const handleGetStarted = () => {
    handleVerifyOTP();
  };

  return (
    <KeyboardAvoidingView
      style={otpStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <ScrollView
        style={otpStyles.scrollView}
        contentContainerStyle={otpStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Top image / header area */}
          <View style={otpStyles.header}>
            {/* Back arrow in circle */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={otpStyles.backButton}
            >
              <Image
                source={require('../../../assets/icons/backarrow.png')}
                style={otpStyles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Illustration placeholder */}
            <View style={otpStyles.illustrationContainer}>
              {/* Delivery illustration */}
              <Image
                source={require('../../../assets/images/pana.png')}
                style={otpStyles.illustration}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Bottom white card */}
          <View style={otpStyles.card}>
            {/* Verify OTP title */}
            <Text style={otpStyles.title}>
              Verify OTP
            </Text>

            {/* Description */}
            <Text style={otpStyles.description}>
              Enter the 6-digit code sent to{'\n'}
              {phoneNumber}
            </Text>

            {/* OTP Input Fields */}
            <View style={otpStyles.otpContainer}>
              {otp.map((digit, index) => (
                <Fragment key={index}>
                  <TextInput
                    ref={(ref) => {
                      if (ref) {
                        inputRefs.current[index] = ref;
                      }
                    }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    style={[
                      otpStyles.otpInput,
                      digit && otpStyles.otpInputFilled,
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                  {index === 2 && (
                    <Text style={otpStyles.otpDivider}>-</Text>
                  )}
                </Fragment>
              ))}
            </View>

            {/* Resend code text */}
            <Text style={otpStyles.resendText}>
              {canResend ? (
                <Text>
                  Didn't receive code?{' '}
                  <Text
                    onPress={handleResendOTP}
                    style={otpStyles.resendLink}
                  >
                    Resend
                  </Text>
                </Text>
              ) : (
                <Text>
                  Re-send code in{' '}
                  <Text style={otpStyles.timerText}>
                    {timer}s
                  </Text>
                </Text>
              )}
            </Text>

            {/* Get Started button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGetStarted}
              disabled={verifying || otp.some(digit => digit === '')}
              style={[
                otpStyles.submitButton,
                (verifying || otp.some(digit => digit === '')) && otpStyles.submitButtonDisabled,
              ]}
            >
              {verifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={otpStyles.submitButtonText}>
                  Get Started
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer text */}
            <Text style={otpStyles.footerText}>
              By signing in, you agree to{' '}
              <Text style={otpStyles.link} onPress={() => setShowTermsModal(true)}>
                Terms of Service
              </Text>
              {'\n'}and{' '}
              <Text style={otpStyles.link} onPress={() => setShowPrivacyModal(true)}>
                Privacy Policy
              </Text>
            </Text>
          </View>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        buttons={[{
          text: 'OK',
          style: 'default',
          onPress: alertConfig.onConfirm,
        }]}
        onClose={() => setAlertConfig({ visible: false, title: '', message: '' })}
      />

      {/* Legal Modals */}
      <LegalModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        type="terms"
      />
      <LegalModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        type="privacy"
      />
    </KeyboardAvoidingView>
  );
};

const otpStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F56B4C',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    height: 280,
    backgroundColor: '#F56B4C',
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 40,
    height: 40,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  illustration: {
    width: 240,
    height: 200,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: 'rgba(239, 239, 239, 1)',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: 'rgba(250, 250, 252, 1)',
  },
  otpInputFilled: {
    borderColor: 'rgba(55, 200, 127, 1)',
  },
  otpDivider: {
    color: '#D1D5DB',
    fontSize: 20,
    marginHorizontal: 4,
  },
  resendText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  resendLink: {
    color: '#F56B4C',
    fontWeight: '600',
  },
  timerText: {
    color: '#F56B4C',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#F56B4C',
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#6B7280',
  },
});

export default OTPVerificationScreen;