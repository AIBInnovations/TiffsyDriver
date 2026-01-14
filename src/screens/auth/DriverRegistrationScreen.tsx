import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/core';
import { registerDriver } from '../../services/authService';
import type { AuthStackParamList } from '../../navigation/types';
import type { VehicleDocument, VehicleType, DocumentType } from '../../types/api';

type DriverRegistrationScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'DriverRegistration'
>;

type DriverRegistrationScreenRouteProp = RouteProp<
  AuthStackParamList,
  'DriverRegistration'
>;

interface DriverRegistrationScreenProps {
  navigation: DriverRegistrationScreenNavigationProp;
  route: DriverRegistrationScreenRouteProp;
}

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: 'BIKE', label: 'Bike' },
  { value: 'SCOOTER', label: 'Scooter' },
  { value: 'BICYCLE', label: 'Bicycle' },
  { value: 'OTHER', label: 'Other' },
];

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'RC', label: 'RC (Registration Certificate)' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'PUC', label: 'PUC (Pollution Certificate)' },
  { value: 'OTHER', label: 'Other' },
];

export default function DriverRegistrationScreen({
  navigation,
  route,
}: DriverRegistrationScreenProps) {
  const { phoneNumber, reapply } = route.params;

  // Personal Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // License Details
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseImageUrl, setLicenseImageUrl] = useState<string | null>(null);
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');

  // Vehicle Details
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('BIKE');

  // Vehicle Documents
  const [documents, setDocuments] = useState<VehicleDocument[]>([
    { type: 'RC', imageUrl: '', expiryDate: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Placeholder function for image upload
  const handleImageUpload = async (type: 'profile' | 'license' | 'document', index?: number) => {
    Alert.alert(
      'Image Upload',
      'Image upload functionality will be implemented with react-native-image-picker or similar library.',
      [
        {
          text: 'Use Test URL',
          onPress: () => {
            const testUrl = 'https://via.placeholder.com/300';
            if (type === 'profile') {
              setProfileImage(testUrl);
            } else if (type === 'license') {
              setLicenseImageUrl(testUrl);
            } else if (type === 'document' && index !== undefined) {
              const newDocs = [...documents];
              newDocs[index].imageUrl = testUrl;
              setDocuments(newDocs);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const addDocument = () => {
    setDocuments([...documents, { type: 'RC', imageUrl: '', expiryDate: '' }]);
  };

  const removeDocument = (index: number) => {
    if (documents.length > 1) {
      const newDocs = documents.filter((_, i) => i !== index);
      setDocuments(newDocs);
    } else {
      Alert.alert('Required', 'At least one document is required');
    }
  };

  const updateDocument = (index: number, field: keyof VehicleDocument, value: string) => {
    const newDocs = [...documents];
    if (field === 'type') {
      newDocs[index].type = value as DocumentType;
    } else if (field === 'imageUrl') {
      newDocs[index].imageUrl = value;
    } else if (field === 'expiryDate') {
      newDocs[index].expiryDate = value;
    }
    setDocuments(newDocs);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    if (!licenseNumber.trim()) {
      Alert.alert('Required', 'Please enter your license number');
      return false;
    }

    if (!licenseImageUrl) {
      Alert.alert('Required', 'Please upload your license photo');
      return false;
    }

    if (!vehicleName.trim()) {
      Alert.alert('Required', 'Please enter your vehicle name/model');
      return false;
    }

    if (!vehicleNumber.trim()) {
      Alert.alert('Required', 'Please enter your vehicle number');
      return false;
    }

    if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(vehicleNumber.toUpperCase())) {
      Alert.alert('Invalid Format', 'Vehicle number should be in format: MH12AB1234');
      return false;
    }

    if (documents.length === 0) {
      Alert.alert('Required', 'Please add at least one vehicle document');
      return false;
    }

    for (let i = 0; i < documents.length; i++) {
      if (!documents[i].imageUrl) {
        Alert.alert('Required', `Please upload document ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      console.log('📝 Submitting driver registration...');

      const registrationData = {
        name: name.trim(),
        email: email.trim() || undefined,
        profileImage: profileImage || undefined,
        licenseNumber: licenseNumber.trim(),
        licenseImageUrl: licenseImageUrl!,
        licenseExpiryDate: licenseExpiryDate || undefined,
        vehicleName: vehicleName.trim(),
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleType,
        vehicleDocuments: documents.map(doc => ({
          type: doc.type,
          imageUrl: doc.imageUrl,
          expiryDate: doc.expiryDate || undefined,
        })),
      };

      console.log('📦 Registration data:', JSON.stringify(registrationData, null, 2));

      // ⚠️ TEMPORARY WORKAROUND: Backend /auth/register-driver endpoint not implemented yet
      // TODO: Remove this mock when backend is ready
      const USE_MOCK_FOR_TESTING = true; // Set to false when backend endpoint is ready

      if (USE_MOCK_FOR_TESTING) {
        console.log('🧪 MOCK MODE: Simulating successful registration');
        console.log('⚠️ Backend endpoint /auth/register-driver needs to be implemented');
        console.log('📄 See BACKEND_INTEGRATION_NEEDED.md for details');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        Alert.alert(
          '✅ Success! (Mock)',
          'UI Test Mode: Your driver registration form is complete.\n\nIn production, this will call POST /api/auth/register-driver.\n\nBackend endpoint needs to be implemented.',
          [
            {
              text: 'Continue to Waiting Screen',
              onPress: () => {
                navigation.replace('ApprovalWaiting', { phoneNumber });
              },
            },
          ]
        );
      } else {
        // Real API call (use when backend is ready)
        const response = await registerDriver(registrationData);

        console.log('✅ Driver registration submitted successfully');

        Alert.alert(
          'Success!',
          'Your driver registration has been submitted for approval. We will notify you once approved.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.replace('ApprovalWaiting', { phoneNumber });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error submitting driver registration:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit registration. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {reapply ? 'Re-apply as Driver' : 'Driver Registration'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email (optional)"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Profile Photo</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => handleImageUpload('profile')}
          >
            <Text style={styles.uploadButtonText}>
              {profileImage ? '✓ Photo Added' : '+ Upload Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* License Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>License Details</Text>

          <Text style={styles.label}>License Number *</Text>
          <TextInput
            style={styles.input}
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            placeholder="Enter license number"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>License Photo *</Text>
          <TouchableOpacity
            style={[styles.uploadButton, licenseImageUrl && styles.uploadButtonSuccess]}
            onPress={() => handleImageUpload('license')}
          >
            <Text style={styles.uploadButtonText}>
              {licenseImageUrl ? '✓ License Photo Added' : '+ Upload License Photo'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>License Expiry Date</Text>
          <TextInput
            style={styles.input}
            value={licenseExpiryDate}
            onChangeText={setLicenseExpiryDate}
            placeholder="YYYY-MM-DD (optional)"
            placeholderTextColor="#999"
          />
        </View>

        {/* Vehicle Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>

          <Text style={styles.label}>Vehicle Name/Model *</Text>
          <TextInput
            style={styles.input}
            value={vehicleName}
            onChangeText={setVehicleName}
            placeholder="e.g., Honda Activa"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Vehicle Number *</Text>
          <TextInput
            style={styles.input}
            value={vehicleNumber}
            onChangeText={(text) => setVehicleNumber(text.toUpperCase())}
            placeholder="MH12AB1234"
            placeholderTextColor="#999"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Vehicle Type *</Text>
          <View style={styles.vehicleTypeContainer}>
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.vehicleTypeButton,
                  vehicleType === type.value && styles.vehicleTypeButtonActive,
                ]}
                onPress={() => setVehicleType(type.value)}
              >
                <Text
                  style={[
                    styles.vehicleTypeText,
                    vehicleType === type.value && styles.vehicleTypeTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Vehicle Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Documents *</Text>
          <Text style={styles.sectionSubtitle}>At least one document required</Text>

          {documents.map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentTitle}>Document {index + 1}</Text>
                {documents.length > 1 && (
                  <TouchableOpacity onPress={() => removeDocument(index)}>
                    <Text style={styles.removeButton}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>Document Type</Text>
              <View style={styles.documentTypeContainer}>
                {documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.documentTypeButton,
                      doc.type === type.value && styles.documentTypeButtonActive,
                    ]}
                    onPress={() => updateDocument(index, 'type', type.value)}
                  >
                    <Text
                      style={[
                        styles.documentTypeText,
                        doc.type === type.value && styles.documentTypeTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Document Photo *</Text>
              <TouchableOpacity
                style={[styles.uploadButton, doc.imageUrl && styles.uploadButtonSuccess]}
                onPress={() => handleImageUpload('document', index)}
              >
                <Text style={styles.uploadButtonText}>
                  {doc.imageUrl ? '✓ Document Added' : '+ Upload Document'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Expiry Date (Optional)</Text>
              <TextInput
                style={styles.input}
                value={doc.expiryDate}
                onChangeText={(text) => updateDocument(index, 'expiryDate', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addDocumentButton} onPress={addDocument}>
            <Text style={styles.addDocumentButtonText}>+ Add Another Document</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {reapply ? 'Re-submit Application' : 'Submit for Approval'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  uploadButtonSuccess: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  uploadButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  vehicleTypeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  vehicleTypeText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  vehicleTypeTextActive: {
    color: '#FFFFFF',
  },
  documentItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  removeButton: {
    color: '#EF5350',
    fontSize: 14,
    fontWeight: '500',
  },
  documentTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  documentTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  documentTypeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  documentTypeText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  documentTypeTextActive: {
    color: '#FFFFFF',
  },
  addDocumentButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addDocumentButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
