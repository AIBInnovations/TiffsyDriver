import { useState, useRef } from 'react';
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
} from 'react-native';
import { AuthStackScreenProps } from "../../navigation/types";
import { CommonActions } from '@react-navigation/native';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { updateProfile } from '../../services/authService';
import auth from '@react-native-firebase/auth';

type Props = AuthStackScreenProps<'ProfileOnboarding'>;

interface VehicleType {
  id: 'BIKE' | 'SCOOTER' | 'CAR';
  label: string;
  icon: string;
}

const vehicleTypes: VehicleType[] = [
  { id: 'BIKE', label: 'Bike', icon: 'motorbike' },
  { id: 'SCOOTER', label: 'Scooter', icon: 'moped' },
  { id: 'CAR', label: 'Car', icon: 'car' },
];

const ProfileOnboardingScreen = ({ navigation, route }: Props) => {
  const { phoneNumber } = route.params;

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'BIKE' | 'SCOOTER' | 'CAR'>('BIKE');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input refs
  const emailRef = useRef<TextInput>(null);
  const licenseRef = useRef<TextInput>(null);
  const vehicleNumberRef = useRef<TextInput>(null);

  // Validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!licenseNumber.trim()) {
      Alert.alert('Required', 'Please enter your driver license number');
      return;
    }

    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter your vehicle number');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('💾 Saving profile to backend...');
      console.log('📝 Profile data:', {
        name: fullName,
        email: email,
        vehicleType: vehicleType,
        vehicleNumber: vehicleNumber,
        licenseNumber: licenseNumber,
      });

      console.log('⚠️ NOTE: Backend currently only accepts name, email, profileImage');
      console.log('⚠️ Vehicle details need to be added to backend API');

      // Save profile data to backend
      // TODO: Backend needs to accept vehicleType and vehicleNumber
      const response = await updateProfile({
        name: fullName,
        email: email,
        profileImage: '', // Add profile image if needed
      });

      console.log('✅ Profile saved successfully!');
      console.log('📊 Response:', response);

      // Navigate to main app
      Alert.alert(
        'Success',
        'Profile created successfully!',
        [
          {
            text: 'Continue',
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })
              );
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);

      if (error.message?.includes('User not found') || error.message?.includes('Unauthorized')) {
        Alert.alert(
          'Account Not Found',
          'Your driver account has not been created yet. Please contact administration to create your driver account first.\n\nPhone: ' + phoneNumber,
          [
            {
              text: 'OK',
              onPress: () => {
                // Sign out and go back to login
                auth().signOut();
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  })
                );
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to save profile: ' + (error.message || 'Unknown error') + '\n\nPlease try again or contact support.'
        );
      }

      setIsSubmitting(false);
    }
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
        {/* Top header area */}
        <View
          style={{
            backgroundColor: '#F56B4C',
            paddingHorizontal: 20,
            paddingTop: 15,
            paddingBottom: 30,
          }}
        >
          {/* Back arrow */}
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

          {/* Title */}
          <View style={{ marginTop: 20 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: '#FFFFFF',
                marginBottom: 8,
              }}
            >
              Complete Your Profile
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 22,
              }}
            >
              Help us know you better to get started with deliveries
            </Text>
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
            paddingTop: 30,
            paddingBottom: 30,
          }}
        >
          {/* Profile Photo Section */}
          <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <MaterialCommunityIcons name="account" size={50} color="#9CA3AF" />
            </View>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                backgroundColor: '#FEF2F2',
              }}
            >
              <MaterialCommunityIcons name="camera" size={18} color="#F56B4C" />
              <Text style={{ color: '#F56B4C', fontSize: 14, fontWeight: '600' }}>
                Add Photo
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
              Optional
            </Text>
          </View>

          {/* Full Name */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}
            >
              Full Name *
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: fullName ? '#10B981' : '#E5E7EB',
                paddingHorizontal: 16,
                height: 52,
              }}
            >
              <MaterialCommunityIcons name="account-outline" size={20} color="#9CA3AF" />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  color: '#111827',
                }}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </View>
          </View>

          {/* Email */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}
            >
              Email Address *
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: email && validateEmail(email) ? '#10B981' : '#E5E7EB',
                paddingHorizontal: 16,
                height: 52,
              }}
            >
              <MaterialCommunityIcons name="email-outline" size={20} color="#9CA3AF" />
              <TextInput
                ref={emailRef}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  color: '#111827',
                }}
                returnKeyType="next"
                onSubmitEditing={() => licenseRef.current?.focus()}
              />
            </View>
          </View>

          {/* License Number */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}
            >
              Driver License Number *
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: licenseNumber ? '#10B981' : '#E5E7EB',
                paddingHorizontal: 16,
                height: 52,
              }}
            >
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#9CA3AF" />
              <TextInput
                ref={licenseRef}
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="DL-1420110012345"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  color: '#111827',
                }}
                returnKeyType="next"
                onSubmitEditing={() => vehicleNumberRef.current?.focus()}
              />
            </View>
          </View>

          {/* Vehicle Type */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 12,
              }}
            >
              Vehicle Type *
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
              }}
            >
              {vehicleTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setVehicleType(type.id)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderRadius: 12,
                    backgroundColor: vehicleType === type.id ? '#FEF2F2' : '#F9FAFB',
                    borderWidth: 1.5,
                    borderColor: vehicleType === type.id ? '#F56B4C' : '#E5E7EB',
                  }}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={28}
                    color={vehicleType === type.id ? '#F56B4C' : '#6B7280'}
                  />
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      fontWeight: vehicleType === type.id ? '600' : '500',
                      color: vehicleType === type.id ? '#F56B4C' : '#6B7280',
                    }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Vehicle Number */}
          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: '#374151',
                marginBottom: 8,
              }}
            >
              Vehicle Number *
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: vehicleNumber ? '#10B981' : '#E5E7EB',
                paddingHorizontal: 16,
                height: 52,
              }}
            >
              <MaterialCommunityIcons name="car-outline" size={20} color="#9CA3AF" />
              <TextInput
                ref={vehicleNumberRef}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                placeholder="DL 01 AB 1234"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 15,
                  color: '#111827',
                }}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? '#FCA5A5' : '#F56B4C',
              borderRadius: 100,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {isSubmitting ? 'Creating Profile...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>

          {/* Info text */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginTop: 20,
              backgroundColor: '#FFFBEB',
              padding: 12,
              borderRadius: 10,
              gap: 10,
            }}
          >
            <MaterialCommunityIcons name="information" size={20} color="#F59E0B" />
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                color: '#92400E',
                lineHeight: 18,
              }}
            >
              Your documents will be verified by our team within 24 hours. You'll receive a notification once approved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileOnboardingScreen;
