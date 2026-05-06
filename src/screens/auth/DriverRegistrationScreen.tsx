import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary, type Asset } from 'react-native-image-picker';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/core';
import { registerDriverWithOtp } from '../../services/authService';
import { uploadImage, type UploadFolder } from '../../services/uploadService';
import ActionSheet from '../../components/common/ActionSheet';
import CustomAlert from '../../components/common/CustomAlert';
import { useAlert } from '../../hooks/useAlert';
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
  const { phoneNumber, registrationToken, reapply } = route.params;

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
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingDocIndex, setUploadingDocIndex] = useState<number | null>(null);
  const { alertProps, showAlert } = useAlert();
  const [pickerTarget, setPickerTarget] = useState<
    { type: 'profile' | 'license' | 'document'; index?: number } | null
  >(null);
  // Ref preserves the target across the ActionSheet close → onPress timing gap
  const pickerTargetRef = useRef<{ type: 'profile' | 'license' | 'document'; index?: number } | null>(null);

  // Date picker state — null when closed, otherwise identifies which date is being edited
  const [datePickerTarget, setDatePickerTarget] = useState<
    { type: 'license' } | { type: 'document'; index: number } | null
  >(null);

  const formatDate = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDate = (s: string): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDateForDisplay = (s: string): string => {
    const d = parseDate(s);
    if (!d) return '';
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    const target = datePickerTarget;
    // On Android, the picker dismisses itself; iOS stays inline
    if (Platform.OS === 'android') {
      setDatePickerTarget(null);
    }
    if (event.type === 'dismissed' || !selected || !target) return;

    const formatted = formatDate(selected);
    if (target.type === 'license') {
      setLicenseExpiryDate(formatted);
    } else {
      updateDocument(target.index, 'expiryDate', formatted);
    }
  };

  const getCurrentPickerDate = (): Date => {
    if (!datePickerTarget) return new Date();
    const value =
      datePickerTarget.type === 'license'
        ? licenseExpiryDate
        : documents[datePickerTarget.index]?.expiryDate || '';
    return parseDate(value) || new Date();
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Tiffsy Driver needs camera access to capture your license, profile, and vehicle document photos.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const uploadAsset = async (
    asset: Asset,
    target: { type: 'profile' | 'license' | 'document'; index?: number }
  ) => {
    if (!asset.uri) return;
    const folder: UploadFolder =
      target.type === 'profile' ? 'driver-profiles' :
      target.type === 'license' ? 'driver-licenses' : 'vehicle-documents';

    if (target.type === 'profile') setUploadingProfile(true);
    else if (target.type === 'license') setUploadingLicense(true);
    else if (target.type === 'document' && typeof target.index === 'number') setUploadingDocIndex(target.index);

    try {
      const uploaded = await uploadImage(
        { uri: asset.uri, fileName: asset.fileName, type: asset.type },
        folder
      );

      if (target.type === 'profile') {
        setProfileImage(uploaded.url);
      } else if (target.type === 'license') {
        setLicenseImageUrl(uploaded.url);
      } else if (target.type === 'document' && typeof target.index === 'number') {
        updateDocument(target.index, 'imageUrl', uploaded.url);
      }
    } catch (error: any) {
      console.error('❌ Image upload failed:', error);
      showAlert({ title: 'Upload Failed', message: error.message || 'Could not upload image. Please try again.', icon: 'alert-circle', iconColor: '#EF4444' });
    } finally {
      setUploadingProfile(false);
      setUploadingLicense(false);
      setUploadingDocIndex(null);
    }
  };

  const handlePickFromCamera = async () => {
    const target = pickerTargetRef.current;
    if (!target) return;
    pickerTargetRef.current = null;

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showAlert({ title: 'Permission Required', message: 'Camera permission is needed to take a photo. You can enable it in your device settings.', icon: 'camera-off', iconColor: '#F59E0B' });
      return;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
      saveToPhotos: false,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      showAlert({ title: 'Camera Error', message: result.errorMessage || `Could not open camera (${result.errorCode}).`, icon: 'camera-off', iconColor: '#EF4444' });
      return;
    }
    const asset = result.assets?.[0];
    if (asset) await uploadAsset(asset, target);
  };

  const handlePickFromGallery = async () => {
    const target = pickerTargetRef.current;
    if (!target) return;
    pickerTargetRef.current = null;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
      selectionLimit: 1,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      showAlert({ title: 'Gallery Error', message: result.errorMessage || `Could not open gallery (${result.errorCode}).`, icon: 'image-off', iconColor: '#EF4444' });
      return;
    }
    const asset = result.assets?.[0];
    if (asset) await uploadAsset(asset, target);
  };

  const handleImageUpload = (type: 'profile' | 'license' | 'document', index?: number) => {
    pickerTargetRef.current = { type, index };
    setPickerTarget({ type, index });
  };

  const addDocument = () => {
    setDocuments([...documents, { type: 'RC', imageUrl: '', expiryDate: '' }]);
  };

  const removeDocument = (index: number) => {
    if (documents.length > 1) {
      const newDocs = documents.filter((_, i) => i !== index);
      setDocuments(newDocs);
    } else {
      showAlert({ title: 'Required', message: 'At least one document is required', icon: 'alert-circle-outline', iconColor: '#F59E0B' });
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
    const warn = (title: string, message: string) =>
      showAlert({ title, message, icon: 'alert-circle-outline', iconColor: '#F59E0B' });

    if (!name.trim()) {
      warn('Required', 'Please enter your full name');
      return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      warn('Invalid Email', 'Please enter a valid email address');
      return false;
    }
    if (!licenseNumber.trim()) {
      warn('Required', 'Please enter your license number');
      return false;
    }
    if (!licenseImageUrl) {
      warn('Required', 'Please upload your license photo');
      return false;
    }
    if (!vehicleName.trim()) {
      warn('Required', 'Please enter your vehicle name/model');
      return false;
    }
    if (!vehicleNumber.trim()) {
      warn('Required', 'Please enter your vehicle number');
      return false;
    }
    if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(vehicleNumber.toUpperCase())) {
      warn('Invalid Format', 'Vehicle number should be in format: MH12AB1234');
      return false;
    }
    if (documents.length === 0) {
      warn('Required', 'Please add at least one vehicle document');
      return false;
    }
    for (let i = 0; i < documents.length; i++) {
      if (!documents[i].imageUrl) {
        warn('Required', `Please upload document ${i + 1}`);
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

      // Both new registrations and re-applications go through /auth/otp/register-driver.
      // The backend handles REJECTED drivers by updating their existing record.
      if (registrationToken) {
        await registerDriverWithOtp(registrationToken, registrationData);
      } else {
        showAlert({ title: 'Error', message: 'Registration token is missing. Please verify your OTP again.', icon: 'alert-circle', iconColor: '#EF4444' });
        return;
      }

      showAlert({
        title: 'Success!',
        message: 'Your driver registration has been submitted for approval. We will notify you once approved.',
        icon: 'check-circle',
        iconColor: '#10B981',
        buttons: [
          {
            text: 'OK',
            onPress: () => navigation.replace('ApprovalWaiting', { phoneNumber }),
          },
        ],
      });
    } catch (error: any) {
      console.error('❌ Error submitting driver registration:', error);
      showAlert({
        title: 'Error',
        message: error.message || 'Failed to submit registration. Please try again.',
        icon: 'alert-circle',
        iconColor: '#EF4444',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
            style={[styles.uploadButton, profileImage && styles.uploadButtonSuccess]}
            onPress={() => handleImageUpload('profile')}
            disabled={uploadingProfile}
          >
            {uploadingProfile ? (
              <ActivityIndicator color="#FE8733" />
            ) : profileImage ? (
              <View style={styles.uploadButtonInner}>
                <Image source={{ uri: profileImage }} style={styles.thumbnail} />
                <Text style={styles.uploadButtonText}>✓ Photo Added (tap to change)</Text>
              </View>
            ) : (
              <Text style={styles.uploadButtonText}>+ Upload Photo</Text>
            )}
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
            disabled={uploadingLicense}
          >
            {uploadingLicense ? (
              <ActivityIndicator color="#FE8733" />
            ) : licenseImageUrl ? (
              <View style={styles.uploadButtonInner}>
                <Image source={{ uri: licenseImageUrl }} style={styles.thumbnail} />
                <Text style={styles.uploadButtonText}>✓ License Photo Added (tap to change)</Text>
              </View>
            ) : (
              <Text style={styles.uploadButtonText}>+ Upload License Photo</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>License Expiry Date</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setDatePickerTarget({ type: 'license' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.dateInputText, !licenseExpiryDate && styles.dateInputPlaceholder]}>
              {licenseExpiryDate ? formatDateForDisplay(licenseExpiryDate) : 'Select date (optional)'}
            </Text>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#666666" />
          </TouchableOpacity>
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
                disabled={uploadingDocIndex === index}
              >
                {uploadingDocIndex === index ? (
                  <ActivityIndicator color="#FE8733" />
                ) : doc.imageUrl ? (
                  <View style={styles.uploadButtonInner}>
                    <Image source={{ uri: doc.imageUrl }} style={styles.thumbnail} />
                    <Text style={styles.uploadButtonText}>✓ Document Added (tap to change)</Text>
                  </View>
                ) : (
                  <Text style={styles.uploadButtonText}>+ Upload Document</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Expiry Date (Optional)</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setDatePickerTarget({ type: 'document', index })}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateInputText, !doc.expiryDate && styles.dateInputPlaceholder]}>
                  {doc.expiryDate ? formatDateForDisplay(doc.expiryDate) : 'Select date'}
                </Text>
                <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#666666" />
              </TouchableOpacity>
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

      <ActionSheet
        visible={pickerTarget !== null}
        title="Upload Photo"
        message="Choose a source"
        onClose={() => setPickerTarget(null)}
        options={[
          { label: 'Take Photo', icon: 'camera', iconColor: '#FE8733', onPress: handlePickFromCamera },
          { label: 'Choose from Gallery', icon: 'image-multiple', iconColor: '#3B82F6', onPress: handlePickFromGallery },
        ]}
      />

      <CustomAlert {...alertProps} />

      {datePickerTarget && (
        <DateTimePicker
          value={getCurrentPickerDate()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FAFAFA',
  },
  dateInputText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  dateInputPlaceholder: {
    color: '#999',
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
  uploadButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
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
