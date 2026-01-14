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
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { AuthStackScreenProps } from "../../navigation/types";
import { syncUser, getFirebaseToken } from '../../services/authService';
import { tokenStorage } from '../../utils/tokenStorage';

type Props = AuthStackScreenProps<'OtpVerify'>;

const OTPVerificationScreen = ({ navigation, route }: Props) => {
  const { phoneNumber, confirmation } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);

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

        // Step 5: Handle response based on user status
        if (syncResponse.data.isNewUser) {
          // New user - navigate to role selection
          console.log('👤 New user detected, navigating to role selection...');
          navigation.replace('RoleSelection', { phoneNumber });
        } else if (syncResponse.data.user?.role !== 'DRIVER') {
          // User exists but is not a driver
          Alert.alert(
            'Access Denied',
            'This app is only for drivers. Your account has a different role.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await auth().signOut();
                  await tokenStorage.clearAll();
                  navigation.goBack();
                }
              }
            ]
          );
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
                console.log('✅ Profile complete, navigating to main app...');
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
                console.log('✅ Profile complete, navigating to main app...');
                navigation.getParent()?.navigate('Main');
              }
          }
        }

      } catch (error: any) {
        console.error('❌ Error during OTP verification:', error);

        // Check if it's a Firebase OTP error or backend error
        if (error.code?.includes('auth/')) {
          Alert.alert(
            'Invalid OTP',
            'The code you entered is incorrect. Please try again.'
          );
        } else {
          // Backend connection error
          let errorMessage = error.message || 'Failed to connect to server.';

          if (error.message?.includes('non-JSON response') || error.message?.includes('JSON Parse error')) {
            errorMessage = 'Cannot connect to backend server.\n\nPlease check:\n1. Backend server is running\n2. Backend URL is correct in src/config/api.ts\n3. Network connection is stable\n\nSee console logs for details.';
          }

          Alert.alert('Backend Connection Error', errorMessage);
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

        Alert.alert('Success', 'OTP has been resent to your phone.');
      } catch (error: any) {
        console.error('❌ Error resending OTP:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to resend OTP. Please try again.'
        );
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
      style={{ flex: 1, backgroundColor: '#F56B4C' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          {/* Top image / header area */}
          <View
            style={{
              height: 220,
              backgroundColor: '#F56B4C',
              paddingHorizontal: 20,
              paddingTop: 15,
            }}
          >
            {/* Back arrow in circle */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={require('../../../assets/icons/backarrow.png')}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Illustration placeholder */}
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              {/* Delivery illustration */}
              <Image
                source={require('../../../assets/images/pana.png')}
                style={{
                  width: 230,
                  height: 190,
                  marginTop: -35,
                }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Bottom white card */}
          <View
            style={{
              flex: 1,
              backgroundColor: 'white',
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 15,
            }}
          >
            {/* Login / Register Switch */}
            <View
              style={{
                backgroundColor: '#F3F4F6',
                borderRadius: 100,
                flexDirection: 'row',
                padding: 4,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'white',
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: '#111827',
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Login
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: '#9CA3AF',
                    fontSize: 16,
                    fontWeight: '500',
                  }}
                >
                  Register
                </Text>
              </View>
            </View>

            {/* Verify OTP title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#111827',
                marginBottom: 8,
              }}
            >
              Verify OTP
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              Enter the 6-digit code sent to{'\n'}
              {phoneNumber}
            </Text>

            {/* OTP Input Fields */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
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
                    style={{
                      width: 45,
                      height: 45,
                      borderWidth: 1,
                      borderColor: digit ? 'rgba(55, 200, 127, 1)' : 'rgba(239, 239, 239, 1)',
                      borderRadius: 10,
                      textAlign: 'center',
                      fontSize: 20,
                      fontWeight: '600',
                      color: '#111827',
                      backgroundColor: 'rgba(250, 250, 252, 1)',
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                  {index === 2 && (
                    <Text style={{ color: '#D1D5DB', fontSize: 20, marginHorizontal: 4 }}>-</Text>
                  )}
                </Fragment>
              ))}
            </View>

            {/* Resend code text */}
            <Text
              style={{
                textAlign: 'center',
                fontSize: 14,
                color: '#6B7280',
                marginBottom: 20,
              }}
            >
              {canResend ? (
                <Text>
                  Didn't receive code?{' '}
                  <Text
                    onPress={handleResendOTP}
                    style={{ color: '#F56B4C', fontWeight: '600' }}
                  >
                    Resend
                  </Text>
                </Text>
              ) : (
                <Text>
                  Re-send code in{' '}
                  <Text style={{ color: '#F56B4C', fontWeight: '600' }}>
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
              style={{
                backgroundColor: verifying || otp.some(digit => digit === '') ? '#CCCCCC' : '#F56B4C',
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
              }}
            >
              {verifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={{ color: 'white', fontSize: 16, fontWeight: '600' }}
                >
                  Get Started
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer text */}
            <Text
              style={{
                fontSize: 12,
                color: '#9CA3AF',
                textAlign: 'center',
                lineHeight: 18,
                marginBottom: 10,
              }}
            >
              By signing in, you agree to{' '}
              <Text style={{ textDecorationLine: 'underline', color: '#6B7280' }}>
                Terms of Service
              </Text>
              {'\n'}and{' '}
              <Text style={{ textDecorationLine: 'underline', color: '#6B7280' }}>
                Privacy Policy
              </Text>
            </Text>
          </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OTPVerificationScreen;