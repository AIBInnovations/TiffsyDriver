import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/core';
import { logout } from '../../services/authService';
import type { AuthStackParamList } from '../../navigation/types';

type RejectionScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Rejection'
>;

type RejectionScreenRouteProp = RouteProp<AuthStackParamList, 'Rejection'>;

interface RejectionScreenProps {
  navigation: RejectionScreenNavigationProp;
  route: RejectionScreenRouteProp;
}

export default function RejectionScreen({
  navigation,
  route,
}: RejectionScreenProps) {
  const { phoneNumber, rejectionReason } = route.params;

  const handleReapply = () => {
    Alert.alert(
      'Re-apply',
      'You can now update your information and re-submit your driver registration.',
      [
        {
          text: 'Continue',
          onPress: () => {
            navigation.replace('DriverRegistration', {
              phoneNumber,
              reapply: true,
            });
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        {
          text: 'Call',
          onPress: () => Linking.openURL('tel:+919522455243'),
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('https://wa.me/919522455243'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.replace('Login');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Registration Not Approved</Text>
            <Text style={styles.subtitle}>
              Your registration was not approved for the following reason:
            </Text>
          </View>

          {/* Rejection Reason Box */}
          <View style={styles.reasonBox}>
            <Text style={styles.reasonText}>{rejectionReason}</Text>
          </View>

          {/* What You Can Do */}
          <View style={styles.actionsInfo}>
            <Text style={styles.actionsTitle}>What you can do:</Text>
            <View style={styles.actionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.actionText}>
                Fix the issues mentioned above
              </Text>
            </View>
            <View style={styles.actionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.actionText}>
                Re-submit your application with updated information
              </Text>
            </View>
            <View style={styles.actionItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.actionText}>
                Contact support if you need help or have questions
              </Text>
            </View>
          </View>

          {/* Re-apply Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleReapply}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Re-apply</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  warningIcon: {
    fontSize: 64,
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
  reasonBox: {
    backgroundColor: '#FFF3F3',
    borderLeftWidth: 4,
    borderLeftColor: '#EF5350',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  reasonText: {
    fontSize: 15,
    color: '#C62828',
    lineHeight: 22,
  },
  actionsInfo: {
    marginBottom: 32,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#666666',
    marginRight: 8,
    marginTop: 2,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
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
