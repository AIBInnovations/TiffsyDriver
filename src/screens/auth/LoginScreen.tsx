import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  StyleSheet,
  Image,
} from 'react-native';
import type { AuthStackScreenProps } from "../../navigation/types";

type Props = AuthStackScreenProps<'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [phone, setPhone] = useState('');
  const [remember, setRemember] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'login' | 'register'>('login');

  const handleGetOtp = () => {
    if (phone.length >= 10) {
      navigation.navigate('OtpVerify', { phoneNumber: `+91 ${phone}` });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F56B4C" />

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
        {/* Login / Register Switch */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setSelectedTab('login')}
            style={[
              styles.tab,
              selectedTab === 'login' && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'login' && styles.activeTabText,
              ]}
            >
              Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('register')}
            style={[
              styles.tab,
              selectedTab === 'register' && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'register' && styles.activeTabText,
              ]}
            >
              Register
            </Text>
          </TouchableOpacity>
        </View>

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
          onPress={() => setRemember(!remember)}
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
          style={styles.otpButton}
        >
          <Text style={styles.otpButtonText}>Get OTP</Text>
        </TouchableOpacity>

        {/* Divider with "or" */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        {/* Explore button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.exploreButton}
        >
          <Text style={styles.exploreButtonText}>Explore</Text>
        </TouchableOpacity>

        {/* Footer text */}
        <Text style={styles.footerText}>
          By signing in, you agree to{' '}
          <Text style={styles.link}>Terms of Service</Text>
          {'\n'}and <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F56B4C',
  },
  header: {
    height: 220,
    backgroundColor: '#F56B4C',
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  illustrationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  illustration: {
    width: 230,
    height: 190,
    marginTop: -5,
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },
  tabContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 100,
    flexDirection: 'row',
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  label: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(250, 250, 252, 1)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 239, 239, 1)',
    paddingHorizontal: 15,
    paddingVertical: 4,
    marginBottom: 12,
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
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  otpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#9CA3AF',
    fontSize: 14,
  },
  exploreButton: {
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F56B4C',
    marginBottom: 20,
  },
  exploreButtonText: {
    color: '#F56B4C',
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
