import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import type { AuthStackScreenProps } from "../../navigation/types";
import CustomAlert from '../../components/common/CustomAlert';
import { LegalModal } from '../profile/components/ProfileModals';

const REMEMBER_PHONE_KEY = '@remember_phone';
const SAVED_PHONE_KEY = '@saved_phone';

type Props = AuthStackScreenProps<'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [phone, setPhone] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
  }>({ visible: false, title: '', message: '' });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Load saved phone number on mount
  useEffect(() => {
    const loadSavedPhone = async () => {
      try {
        const savedRemember = await AsyncStorage.getItem(REMEMBER_PHONE_KEY);
        const savedPhone = await AsyncStorage.getItem(SAVED_PHONE_KEY);

        if (savedRemember === 'true' && savedPhone) {
          setRemember(true);
          setPhone(savedPhone);
          console.log('📱 Loaded saved phone number');
        }
      } catch (error) {
        console.error('Error loading saved phone:', error);
      }
    };

    loadSavedPhone();
  }, []);

  const handleGetOtp = async () => {
    if (phone.length >= 10) {
      setLoading(true);
      try {
        // Save or clear phone number based on "Remember me" checkbox
        if (remember) {
          await AsyncStorage.setItem(REMEMBER_PHONE_KEY, 'true');
          await AsyncStorage.setItem(SAVED_PHONE_KEY, phone);
          console.log('💾 Phone number saved (Remember me enabled)');
        } else {
          await AsyncStorage.removeItem(REMEMBER_PHONE_KEY);
          await AsyncStorage.removeItem(SAVED_PHONE_KEY);
          console.log('🗑️ Saved phone number cleared (Remember me disabled)');
        }

        const phoneNumber = `+91${phone}`;
        console.log('📱 Sending OTP to:', phoneNumber);

        const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
        console.log('✅ OTP sent successfully');

        // Navigate to OTP screen with confirmation object
        navigation.navigate('OtpVerify', {
          phoneNumber: `+91 ${phone}`,
          confirmation
        });
      } catch (error: any) {
        console.error('❌ Error sending OTP:', error);
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: error.message || 'Failed to send OTP. Please try again.',
          icon: 'alert-circle',
          iconColor: '#EF4444',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top header area */}
        <View style={styles.header}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../../../assets/images/pana.png')}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Bottom white card */}
      <View style={styles.card}>
        {/* Your Number label */}
        <Text style={styles.label}>Your Number</Text>

        {/* Phone input */}
        <View
          style={[
            styles.inputContainer,
            phone.length === 10 && styles.inputValid,
          ]}
        >
          <View style={styles.countryCode}>
            <Image
              source={require('../../../assets/icons/indianflag2.png')}
              style={styles.flagIcon}
              resizeMode="contain"
            />
            <Text style={styles.countryCodeText}>+91</Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter the number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor="rgba(206, 206, 206, 1)"
            maxLength={10}
          />

          {phone.length === 10 && (
            <Image
              source={require('../../../assets/icons/greentick.png')}
              style={styles.checkmark}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Remember me */}
        <TouchableOpacity
          style={styles.rememberContainer}
          onPress={async () => {
            const newRememberValue = !remember;
            setRemember(newRememberValue);

            // If unchecking, clear saved phone immediately
            if (!newRememberValue) {
              try {
                await AsyncStorage.removeItem(REMEMBER_PHONE_KEY);
                await AsyncStorage.removeItem(SAVED_PHONE_KEY);
                console.log('🗑️ Cleared saved phone number (Remember me unchecked)');
              } catch (error) {
                console.error('Error clearing saved phone:', error);
              }
            }
          }}
        >
          <View
            style={[
              styles.checkbox,
              remember && styles.checkboxChecked,
            ]}
          >
            {remember && (
              <Text style={styles.checkboxTick}>✓</Text>
            )}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </TouchableOpacity>

        {/* Get OTP button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleGetOtp}
          disabled={loading || phone.length < 10}
          style={[
            styles.otpButton,
            (loading || phone.length < 10) && styles.otpButtonDisabled
          ]}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.otpButtonText}>Get OTP</Text>
          )}
        </TouchableOpacity>

        {/* Footer text */}
        <Text style={styles.footerText}>
          By signing in, you agree to{' '}
          <Text style={styles.link} onPress={() => setShowTermsModal(true)}>Terms of Service</Text>
          {'\n'}and{' '}
          <Text style={styles.link} onPress={() => setShowPrivacyModal(true)}>Privacy Policy</Text>
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
        buttons={[{ text: 'OK', style: 'default' }]}
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

const styles = StyleSheet.create({
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
    paddingTop: 40,
    justifyContent: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  label: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(250, 250, 252, 1)',
    borderWidth: 2,
    borderColor: 'rgba(239, 239, 239, 1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    height: 60,
  },
  inputValid: {
    borderColor: 'rgba(55, 200, 127, 1)',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    marginRight: 10,
  },
  flagIcon: {
    width: 24,
    height: 16,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
  },
  checkmark: {
    width: 20,
    height: 20,
    marginLeft: 8,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    borderColor: 'rgba(55, 200, 127, 1)',
    backgroundColor: 'rgba(55, 200, 127, 1)',
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rememberText: {
    color: 'rgba(36, 36, 36, 1)',
    fontSize: 14,
  },
  otpButton: {
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
  otpButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  otpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#6B7280',
  },
});

export default LoginScreen;
