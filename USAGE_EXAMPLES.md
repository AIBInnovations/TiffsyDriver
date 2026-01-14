# Usage Examples - API Integration

This document provides practical examples of using the API services in your React Native screens.

## 🔐 Authentication Examples

### Example 1: Phone Login Flow

```typescript
// LoginScreen.tsx
import auth from '@react-native-firebase/auth';

const handleGetOtp = async () => {
  setLoading(true);
  try {
    const phoneNumber = `+91${phone}`;
    console.log('📱 Sending OTP to:', phoneNumber);

    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    console.log('✅ OTP sent successfully');

    navigation.navigate('OtpVerify', { phoneNumber, confirmation });
  } catch (error: any) {
    console.error('❌ Error sending OTP:', error);
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
};
```

### Example 2: OTP Verification + Backend Sync

```typescript
// OtpVerifyScreen.tsx
import { syncUser, getFirebaseToken } from '../../services/authService';
import { tokenStorage } from '../../utils/tokenStorage';

const handleVerifyOTP = async (code: string) => {
  setVerifying(true);
  try {
    // Step 1: Verify with Firebase
    console.log('🔐 Verifying OTP...');
    await confirmation.confirm(code);

    // Step 2: Get & store token
    const token = await getFirebaseToken();
    await tokenStorage.setToken(token);

    // Step 3: Sync with backend
    const response = await syncUser();

    // Step 4: Handle response
    if (response.data.isNewUser) {
      Alert.alert('Account Not Found', 'Please contact admin');
    } else if (response.data.user?.role !== 'DRIVER') {
      Alert.alert('Access Denied', 'This app is for drivers only');
    } else {
      navigation.navigate('Dashboard');
    }
  } catch (error: any) {
    Alert.alert('Error', error.message);
  } finally {
    setVerifying(false);
  }
};
```

### Example 3: Check Authentication on App Launch

```typescript
// App.tsx or AuthNavigator.tsx
import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import { tokenStorage } from './utils/tokenStorage';
import { getCurrentUser } from './services/authService';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = auth().currentUser;
      const storedToken = await tokenStorage.getToken();

      if (currentUser && storedToken) {
        // Validate token with backend
        const response = await getCurrentUser();
        if (response.data.user) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await tokenStorage.clearAll();
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <SplashScreen />;
  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
};
```

### Example 4: Logout

```typescript
// ProfileScreen.tsx
import { logout } from '../../services/authService';

const handleLogout = async () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            navigation.replace('Auth');
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]
  );
};
```

## 📦 Delivery Operations Examples

### Example 1: Fetch Available Batches

```typescript
// AvailableBatchesScreen.tsx
import { useState, useEffect } from 'react';
import { getAvailableBatches } from '../../services/deliveryService';
import type { AvailableBatch } from '../../types/api';

const AvailableBatchesScreen = () => {
  const [batches, setBatches] = useState<AvailableBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await getAvailableBatches();
      setBatches(response.data.batches);
      console.log(`📦 Found ${response.data.batches.length} available batches`);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBatches();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={batches}
      refreshing={refreshing}
      onRefresh={onRefresh}
      renderItem={({ item }) => (
        <BatchCard batch={item} onAccept={() => handleAcceptBatch(item._id)} />
      )}
    />
  );
};
```

### Example 2: Accept a Batch

```typescript
// AvailableBatchesScreen.tsx (continued)
import { acceptBatch } from '../../services/deliveryService';

const handleAcceptBatch = async (batchId: string) => {
  Alert.alert(
    'Accept Batch',
    'Do you want to accept this batch?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            setAccepting(true);
            const response = await acceptBatch(batchId);

            Alert.alert('Success', 'Batch accepted successfully!');

            // Navigate to batch details with accepted batch data
            navigation.navigate('BatchDetails', {
              batch: response.data.batch,
              orders: response.data.orders,
              pickupAddress: response.data.pickupAddress,
            });
          } catch (error: any) {
            if (error.message.includes('already taken')) {
              Alert.alert(
                'Batch Unavailable',
                'This batch was already accepted by another driver.'
              );
              fetchBatches(); // Refresh list
            } else {
              Alert.alert('Error', error.message);
            }
          } finally {
            setAccepting(false);
          }
        },
      },
    ]
  );
};
```

### Example 3: Get Current Active Batch on App Launch

```typescript
// DashboardScreen.tsx
import { useState, useEffect } from 'react';
import { getMyBatch } from '../../services/deliveryService';

const DashboardScreen = () => {
  const [activeBatch, setActiveBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkActiveBatch();
  }, []);

  const checkActiveBatch = async () => {
    try {
      const response = await getMyBatch();

      if (response.data.batch) {
        setActiveBatch(response.data);
        console.log('📦 Active batch found:', response.data.batch.batchNumber);
      } else {
        console.log('ℹ️ No active batch');
      }
    } catch (error: any) {
      console.error('Error checking active batch:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {activeBatch ? (
        <ActiveBatchCard
          batch={activeBatch}
          onContinue={() => navigation.navigate('BatchDetails', { batchId: activeBatch.batch._id })}
        />
      ) : (
        <View>
          <Text>No active batch</Text>
          <Button title="View Available Batches" onPress={() => navigation.navigate('AvailableBatches')} />
        </View>
      )}
    </View>
  );
};
```

### Example 4: Mark Batch as Picked Up

```typescript
// BatchDetailsScreen.tsx
import { markBatchPickedUp } from '../../services/deliveryService';

const handleMarkPickedUp = async () => {
  Alert.alert(
    'Confirm Pickup',
    'Have you collected all orders from the kitchen?',
    [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Picked Up',
        onPress: async () => {
          try {
            setLoading(true);
            await markBatchPickedUp(batchId);

            Alert.alert('Success', 'Batch marked as picked up!');

            // Navigate to delivery screen
            navigation.navigate('ActiveDeliveries', { batchId });
          } catch (error: any) {
            Alert.alert('Error', error.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]
  );
};
```

### Example 5: Mark Order as Delivered with OTP

```typescript
// DeliveryScreen.tsx
import { updateDeliveryStatus } from '../../services/deliveryService';

const handleMarkDelivered = async (orderId: string, otp: string) => {
  try {
    setSubmitting(true);

    const response = await updateDeliveryStatus(orderId, {
      status: 'DELIVERED',
      notes: 'Delivered to customer at door',
      proofOfDelivery: {
        type: 'OTP',
        otp: otp,
      },
    });

    Alert.alert('Success', 'Order delivered successfully!');

    // Check if batch is complete
    const { delivered, failed, total } = response.data.batchProgress;
    if (delivered + failed === total) {
      Alert.alert('Batch Complete', 'All orders have been delivered!');
      navigation.navigate('BatchSummary', { batchId });
    } else {
      // Move to next delivery
      navigation.replace('DeliveryScreen', { orderId: nextOrderId });
    }
  } catch (error: any) {
    if (error.message.includes('OTP')) {
      Alert.alert('Invalid OTP', 'The OTP you entered is incorrect.');
    } else {
      Alert.alert('Error', error.message);
    }
  } finally {
    setSubmitting(false);
  }
};
```

### Example 6: Mark Order as Failed

```typescript
// DeliveryScreen.tsx
const handleMarkFailed = async (orderId: string, reason: string, notes: string) => {
  try {
    setSubmitting(true);

    await updateDeliveryStatus(orderId, {
      status: 'FAILED',
      failureReason: reason, // 'CUSTOMER_UNAVAILABLE', 'WRONG_ADDRESS', etc.
      notes: notes,
    });

    Alert.alert('Marked as Failed', 'Order has been marked as failed.');

    // Move to next delivery
    navigation.replace('DeliveryScreen', { orderId: nextOrderId });
  } catch (error: any) {
    Alert.alert('Error', error.message);
  } finally {
    setSubmitting(false);
  }
};
```

### Example 7: Update Delivery Sequence

```typescript
// DeliveryListScreen.tsx
import { updateDeliverySequence } from '../../services/deliveryService';

const handleReorderDeliveries = async (newSequence: Order[]) => {
  try {
    const sequenceData = newSequence.map((order, index) => ({
      orderId: order._id,
      sequenceNumber: index + 1,
    }));

    await updateDeliverySequence(batchId, sequenceData);

    Alert.alert('Success', 'Delivery sequence updated!');
    setOrders(newSequence);
  } catch (error: any) {
    if (error.message.includes('locked')) {
      Alert.alert('Cannot Reorder', 'This batch sequence is locked by admin.');
    } else {
      Alert.alert('Error', error.message);
    }
  }
};
```

## 🎯 Complete Screen Example

### Complete Active Delivery Screen

```typescript
// ActiveDeliveryScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, FlatList } from 'react-native';
import { getMyBatch, updateDeliveryStatus } from '../../services/deliveryService';
import type { Order, MyBatchData } from '../../types/api';

const ActiveDeliveryScreen = ({ navigation }) => {
  const [batchData, setBatchData] = useState<MyBatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

  useEffect(() => {
    fetchActiveBatch();
  }, []);

  const fetchActiveBatch = async () => {
    try {
      const response = await getMyBatch();
      if (response.data.batch) {
        setBatchData(response.data);
        // Find first pending order
        const pendingIndex = response.data.orders.findIndex(
          order => order.status === 'PICKED_UP'
        );
        setCurrentOrderIndex(pendingIndex !== -1 ? pendingIndex : 0);
      } else {
        Alert.alert('No Active Batch', 'You do not have an active batch.');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async (orderId: string, otp: string) => {
    try {
      await updateDeliveryStatus(orderId, {
        status: 'DELIVERED',
        proofOfDelivery: { type: 'OTP', otp },
      });

      // Refresh batch data
      await fetchActiveBatch();

      Alert.alert('Success', 'Order delivered!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!batchData) return null;

  const currentOrder = batchData.orders[currentOrderIndex];

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Batch: {batchData.batch.batchNumber}
      </Text>

      <Text style={{ fontSize: 18, marginTop: 10 }}>
        Progress: {batchData.summary.delivered} / {batchData.summary.totalOrders}
      </Text>

      {currentOrder && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 20 }}>Current Delivery:</Text>
          <Text>Order: {currentOrder.orderNumber}</Text>
          <Text>Customer: {currentOrder.deliveryAddress.name}</Text>
          <Text>Phone: {currentOrder.deliveryAddress.phone}</Text>
          <Text>Address: {currentOrder.deliveryAddress.street}</Text>

          <Button
            title="Mark as Delivered"
            onPress={() => {
              // Show OTP input dialog
              promptForOTP((otp) => handleDeliver(currentOrder._id, otp));
            }}
          />
        </View>
      )}

      <FlatList
        data={batchData.orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <OrderItem
            order={item}
            isActive={index === currentOrderIndex}
            onPress={() => setCurrentOrderIndex(index)}
          />
        )}
      />
    </View>
  );
};

export default ActiveDeliveryScreen;
```

## 🐛 Error Handling Examples

### Handling Token Expiration

```typescript
import { getFirebaseToken } from '../../services/authService';
import auth from '@react-native-firebase/auth';

const makeAuthenticatedRequest = async () => {
  try {
    // Your API call here
    await someApiCall();
  } catch (error: any) {
    if (error.message.includes('Token expired') || error.status === 401) {
      // Token expired, refresh and retry
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          const newToken = await currentUser.getIdToken(true); // Force refresh
          await tokenStorage.setToken(newToken);
          console.log('🔄 Token refreshed, retrying request...');

          // Retry the request
          await someApiCall();
        } else {
          // User not logged in, redirect to login
          navigation.replace('Auth');
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        await logout();
        navigation.replace('Auth');
      }
    } else {
      throw error;
    }
  }
};
```

### Handling Network Errors

```typescript
const fetchWithRetry = async (fetchFn: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchFn();
    } catch (error: any) {
      console.log(`❌ Attempt ${i + 1} failed:`, error.message);

      if (i === retries - 1) throw error;

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

// Usage
const fetchBatches = async () => {
  try {
    const response = await fetchWithRetry(() => getAvailableBatches());
    setBatches(response.data.batches);
  } catch (error: any) {
    Alert.alert('Network Error', 'Please check your connection and try again.');
  }
};
```

---

These examples show the complete integration patterns. Copy and adapt them to your specific screens! 🚀
