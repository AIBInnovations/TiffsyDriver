import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/core';
import { getCurrentUser, logout } from '../../services/authService';
import CustomAlert from '../../components/common/CustomAlert';
import ActionSheet from '../../components/common/ActionSheet';
import { useAlert } from '../../hooks/useAlert';
import type { AuthStackParamList } from '../../navigation/types';

type ApprovalWaitingScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ApprovalWaiting'
>;

type ApprovalWaitingScreenRouteProp = RouteProp<
  AuthStackParamList,
  'ApprovalWaiting'
>;

interface ApprovalWaitingScreenProps {
  navigation: ApprovalWaitingScreenNavigationProp;
  route: ApprovalWaitingScreenRouteProp;
}

export default function ApprovalWaitingScreen({
  navigation,
  route,
}: ApprovalWaitingScreenProps) {
  const { phoneNumber } = route.params;
  const [checking, setChecking] = useState(false);
  const [contactSheetVisible, setContactSheetVisible] = useState(false);
  const { alertProps, showAlert } = useAlert();

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      console.log('🔄 Checking approval status...');
      const meResponse = await getCurrentUser();

      const { approvalStatus, rejectionReason } = meResponse.data.user as any;

      console.log('📊 Approval status:', approvalStatus);

      switch (approvalStatus) {
        case 'APPROVED':
          showAlert({
            title: 'Approved! 🎉',
            message: 'Your driver registration has been approved. Welcome to Tiffsy!',
            icon: 'check-circle',
            iconColor: '#10B981',
            buttons: [
              {
                text: 'Continue',
                onPress: () => navigation.getParent()?.navigate('Main'),
              },
            ],
          });
          break;

        case 'REJECTED':
          navigation.replace('Rejection', {
            phoneNumber,
            rejectionReason: rejectionReason || 'No reason provided',
          });
          break;

        case 'PENDING':
          showAlert({
            title: 'Still Pending',
            message: 'Your registration is still under review. We will notify you once approved.',
            icon: 'clock-outline',
            iconColor: '#F59E0B',
          });
          break;

        default:
          showAlert({
            title: 'Status Unknown',
            message: 'Could not determine your approval status. Please contact support.',
            icon: 'help-circle-outline',
            iconColor: '#6B7280',
          });
      }
    } catch (error: any) {
      console.error('❌ Error checking status:', error);
      showAlert({
        title: 'Error',
        message: error.message || 'Failed to check approval status. Please try again.',
        icon: 'alert-circle',
        iconColor: '#EF4444',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleContactSupport = () => {
    setContactSheetVisible(true);
  };

  const handleLogout = () => {
    showAlert({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      icon: 'logout',
      iconColor: '#EF4444',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Login');
            } catch {
              showAlert({
                title: 'Error',
                message: 'Failed to logout. Please try again.',
                icon: 'alert-circle',
                iconColor: '#EF4444',
              });
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        {/* Animation Area */}
        <View style={styles.animationContainer}>
          <Text style={styles.hourglassIcon}>⏳</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Registration Under Review</Text>
          <Text style={styles.subtitle}>
            Your driver registration is pending admin approval. We'll notify you
            once it's approved.
          </Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>PENDING</Text>
        </View>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Usually approved within 24-48 hours
        </Text>

        {/* Check Status Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCheckStatus}
          disabled={checking}
          activeOpacity={0.8}
        >
          {checking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Check Status</Text>
          )}
        </TouchableOpacity>

        {/* Secondary Actions */}
        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleContactSupport}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Phone: {phoneNumber}
        </Text>
      </View>

      <ActionSheet
        visible={contactSheetVisible}
        title="Contact Support"
        message="How would you like to contact us?"
        onClose={() => setContactSheetVisible(false)}
        options={[
          { label: 'Call', icon: 'phone', iconColor: '#10B981', onPress: () => Linking.openURL('tel:+919522455243') },
          { label: 'WhatsApp', icon: 'whatsapp', iconColor: '#25D366', onPress: () => Linking.openURL('https://wa.me/919522455243') },
        ]}
      />

      <CustomAlert {...alertProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    marginBottom: 32,
  },
  hourglassIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF9800',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
  },
  infoText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});
