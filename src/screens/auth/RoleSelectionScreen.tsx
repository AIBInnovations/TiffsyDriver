import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/core';

type AuthStackParamList = {
  Login: undefined;
  OtpVerify: {
    phoneNumber: string;
    confirmation: any;
  };
  RoleSelection: { phoneNumber: string };
  DriverRegistration: { phoneNumber: string; reapply?: boolean };
  ProfileOnboarding: { phoneNumber: string };
};

type RoleSelectionScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'RoleSelection'
>;

type RoleSelectionScreenRouteProp = RouteProp<
  AuthStackParamList,
  'RoleSelection'
>;

interface RoleSelectionScreenProps {
  navigation: RoleSelectionScreenNavigationProp;
  route: RoleSelectionScreenRouteProp;
}

export default function RoleSelectionScreen({
  navigation,
  route,
}: RoleSelectionScreenProps) {
  const { phoneNumber } = route.params;

  const handleCustomerSelect = () => {
    // For now, navigate to ProfileOnboarding for customers
    // This will be updated later when customer flow is implemented
    navigation.replace('ProfileOnboarding', { phoneNumber });
  };

  const handleDriverSelect = () => {
    // Navigate to Driver Registration form
    navigation.replace('DriverRegistration', { phoneNumber });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Tiffsy!</Text>
          <Text style={styles.subtitle}>How would you like to use Tiffsy?</Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* Customer Card */}
          <TouchableOpacity
            style={styles.roleCard}
            onPress={handleCustomerSelect}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardIcon}>🍱</Text>
              <Text style={styles.cardTitle}>Order Food</Text>
              <Text style={styles.cardDescription}>
                Get delicious meals delivered to your doorstep
              </Text>
            </View>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>Customer</Text>
            </View>
          </TouchableOpacity>

          {/* Driver Card */}
          <TouchableOpacity
            style={[styles.roleCard, styles.driverCard]}
            onPress={handleDriverSelect}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardIcon}>🚗</Text>
              <Text style={styles.cardTitle}>Deliver Food</Text>
              <Text style={styles.cardDescription}>
                Earn by delivering orders in your area
              </Text>
            </View>
            <View style={[styles.cardBadge, styles.driverBadge]}>
              <Text style={styles.cardBadgeText}>Driver</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          You can change this later in your account settings
        </Text>
      </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverCard: {
    borderColor: '#FF6B35',
  },
  cardContent: {
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  driverBadge: {
    backgroundColor: '#FFE8E0',
  },
  cardBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 24,
  },
});
