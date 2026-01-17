import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useEffect } from "react";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { DeliveryStatusType, MainTabsParamList } from "../../navigation/types";
import ProgressTracker from "./components/ProgressTracker";
import OrderDetailsCard from "./components/OrderDetailsCard";
import MapPreview from "./components/MapPreview";
import ActionButtons from "./components/ActionButtons";
import PODCapture from "./components/PODCapture";
import FailedDeliveryModal from "./components/FailedDeliveryModal";
import DeliveryCompleteModal from "./components/DeliveryCompleteModal";
import NotificationBanner, { NotificationType } from "./components/NotificationBanner";
import { getMyBatch, updateDeliveryStatus as apiUpdateDeliveryStatus } from "../../services/deliveryService";
import type { Order, OrderStatus } from "../../types/api";

type DeliveryStatusScreenRouteProp = RouteProp<MainTabsParamList, "DeliveryStatus">;

interface DeliveryData {
  deliveryId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  deliveryWindow: string;
  specialInstructions: string;
  currentStatus: DeliveryStatusType;
  batchId?: string;
  stopNumber?: number;
  totalStops?: number;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// Map API OrderStatus to local DeliveryStatusType
const mapOrderStatusToDeliveryStatus = (status: OrderStatus): DeliveryStatusType => {
  switch (status) {
    case 'READY':
      return 'pending';
    case 'EN_ROUTE':
    case 'OUT_FOR_DELIVERY':  // Legacy support
      return 'in_progress';
    case 'ARRIVED':
    case 'PICKED_UP':  // Legacy support
      return 'picked_up';
    case 'DELIVERED':
      return 'delivered';
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
};

// Map local DeliveryStatusType to API OrderStatus (backend expects: EN_ROUTE, ARRIVED, DELIVERED, FAILED)
const mapDeliveryStatusToOrderStatus = (status: DeliveryStatusType): OrderStatus => {
  switch (status) {
    case 'pending':
      return 'READY';
    case 'in_progress':
      return 'EN_ROUTE';  // Backend expects EN_ROUTE, not OUT_FOR_DELIVERY
    case 'picked_up':
      return 'ARRIVED';  // Backend expects ARRIVED, not PICKED_UP
    case 'delivered':
      return 'DELIVERED';
    case 'failed':
      return 'FAILED';
    default:
      return 'READY';
  }
};

export default function DeliveryStatusScreen() {
  const navigation = useNavigation();
  const route = useRoute<DeliveryStatusScreenRouteProp>();

  // State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [showPODModal, setShowPODModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  // Set status bar colors when screen is focused
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#FFFFFF');
    }, [])
  );

  // Load delivery data
  useEffect(() => {
    loadDeliveryData();
  }, [route.params]);

  const loadDeliveryData = useCallback(async () => {
    try {
      console.log('📥 Fetching delivery data for status screen...');

      // Always fetch from API to get fresh data
      const response = await getMyBatch();

      if (response.data.batch && response.data.orders && response.data.orders.length > 0) {
        const batch = response.data.batch;
        const orders = response.data.orders;

        // If we have a deliveryId from params or current state, try to find that specific order
        const currentDeliveryId = route.params?.deliveryId || delivery?.deliveryId;
        let targetOrder;

        if (currentDeliveryId) {
          // Find the specific order by ID to get its fresh status
          targetOrder = orders.find(order => order._id === currentDeliveryId);
          console.log('🔍 Looking for order:', currentDeliveryId);
          console.log('🔍 Found order:', targetOrder ? targetOrder.orderNumber : 'Not found');
        }

        // If we didn't find the specific order, fall back to finding the next active one
        if (!targetOrder) {
          targetOrder = orders.find(
            order => order.status !== 'DELIVERED' && order.status !== 'FAILED'
          );
          if (targetOrder) {
            console.log('🔍 Using active order:', targetOrder.orderNumber);
          } else {
            console.log('✅ All deliveries completed - no active orders');
            setDelivery(null);
            return;
          }
        }

        const kitchen = typeof batch.kitchenId === 'object' ? batch.kitchenId : null;
        const kitchenAddress = kitchen?.address ?
          `${kitchen.name}, ${kitchen.address.locality || kitchen.address.area}, ${kitchen.address.city}` :
          'Kitchen';

        const deliveryAddr = targetOrder.deliveryAddress;
        const dropoffAddr = `${deliveryAddr.flatNumber || ''} ${deliveryAddr.street || deliveryAddr.addressLine1 || ''}, ${deliveryAddr.locality || deliveryAddr.area}, ${deliveryAddr.city}`.trim();

        setDelivery({
          deliveryId: targetOrder._id,
          orderId: targetOrder.orderNumber,
          customerName: deliveryAddr.name || 'Customer',
          customerPhone: deliveryAddr.phone || '',
          pickupLocation: kitchenAddress,
          dropoffLocation: dropoffAddr,
          deliveryWindow: batch.mealWindow,
          specialInstructions: targetOrder.specialInstructions || '',
          currentStatus: mapOrderStatusToDeliveryStatus(targetOrder.status),
          batchId: batch._id,
          stopNumber: targetOrder.sequenceNumber,
          totalStops: orders.length,
        });

        console.log('✅ Delivery data loaded:', targetOrder.orderNumber, 'Status:', targetOrder.status);
      } else {
        console.log('ℹ️ No active batch/orders found');
        setDelivery(null);
      }
    } catch (error: any) {
      console.error('❌ Error loading delivery data:', error);
      Alert.alert('Error', 'Failed to load delivery data. Please try again.');
      setDelivery(null);
    }
  }, [route.params, delivery?.deliveryId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadDeliveryData();
      showNotification("success", "Updated", "Delivery details refreshed");
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadDeliveryData]);

  const showNotification = (
    type: NotificationType,
    title: string,
    message?: string
  ) => {
    setNotification({
      id: Date.now().toString(),
      type,
      title,
      message,
    });
  };

  const updateDeliveryStatus = async (
    newStatus: DeliveryStatusType,
    podData?: { otpVerified: boolean; otp: string; notes?: string; recipientName?: string },
    failureData?: { reason: string; notes?: string }
  ) => {
    if (!delivery) return;

    setIsUpdating(true);

    try {
      console.log('📝 Updating delivery status:', delivery.deliveryId, newStatus);

      // Map local status to API status
      const apiStatus = mapDeliveryStatusToOrderStatus(newStatus);

      // Prepare request body
      const requestBody: any = { status: apiStatus };

      // Add proof of delivery for DELIVERED status
      if (newStatus === "delivered" && podData?.otpVerified && podData?.otp) {
        requestBody.proofOfDelivery = {
          type: 'OTP',
          otp: podData.otp, // Send actual OTP entered by driver
        };
        if (podData.notes) {
          requestBody.notes = podData.notes;
        }
      }

      // Add failure reason for FAILED status
      if (newStatus === "failed" && failureData?.reason) {
        requestBody.failureReason = failureData.reason;
        if (failureData.notes) {
          requestBody.notes = failureData.notes;
        }
      }

      console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

      // Call the API to update status
      await apiUpdateDeliveryStatus(delivery.deliveryId, requestBody);

      console.log('✅ Status updated successfully');

      // Update local state
      setDelivery({ ...delivery, currentStatus: newStatus });

      // Show completion modal for delivered status
      if (newStatus === "delivered") {
        setShowCompleteModal(true);
        setIsUpdating(false);
        return;
      }

      const statusMessages: Record<DeliveryStatusType, string> = {
        pending: "Status reset to pending",
        picked_up: "Package picked up successfully",
        in_progress: "Delivery started",
        delivered: "Delivery completed!",
        failed: "Delivery marked as failed",
      };

      showNotification(
        newStatus === "failed" ? "error" : "success",
        statusMessages[newStatus]
      );
    } catch (error: any) {
      console.error('❌ Error updating status:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error stack:', error?.stack);

      // Handle OTP-specific errors
      let errorMessage = error.message || 'Failed to update delivery status. Please try again.';

      if (newStatus === "delivered" && (
        errorMessage.toLowerCase().includes('otp') ||
        errorMessage.toLowerCase().includes('proof of delivery')
      )) {
        errorMessage = 'Invalid OTP. Please verify with customer and try again.';
      }

      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartDelivery = () => {
    updateDeliveryStatus("in_progress");
  };

  const handleMarkDelivered = () => {
    setShowPODModal(true);
  };

  const handlePODSubmit = (podData: { otpVerified: boolean; otp: string; notes?: string; recipientName?: string }) => {
    setShowPODModal(false);
    updateDeliveryStatus("delivered", podData);
  };

  const handleMarkFailed = () => {
    setShowFailedModal(true);
  };

  const handleFailedSubmit = (reason: string, notes?: string) => {
    setShowFailedModal(false);
    updateDeliveryStatus("failed", undefined, { reason, notes });
    console.log("Failed reason:", reason, "Notes:", notes);
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleNextDelivery = async () => {
    setShowCompleteModal(false);
    // Reload delivery data to get the next active order
    await loadDeliveryData();
  };

  const handleViewAllDeliveries = () => {
    setShowCompleteModal(false);
    // Pass completed order info to Deliveries screen
    // Navigate to Deliveries tab with nested screen params
    navigation.navigate("Deliveries" as any, {
      screen: 'DeliveriesList',
      params: {
        completedOrderId: delivery?.deliveryId,
        completedOrderNumber: delivery?.orderId,
      },
    });
  };

  const handleCloseCompleteModal = () => {
    setShowCompleteModal(false);
  };

  // Calculate next delivery info for the modal
  const getNextDeliveryInfo = () => {
    if (!delivery || !delivery.stopNumber || !delivery.totalStops) return undefined;
    if (delivery.stopNumber >= delivery.totalStops) return undefined;

    // Check if there are more deliveries in the batch
    const remainingDeliveries = delivery.totalStops - delivery.stopNumber;
    if (remainingDeliveries <= 0) return undefined;

    return {
      orderId: `Next Order`,
      customerName: `Next Customer`,
      stopNumber: delivery.stopNumber + 1,
      totalStops: delivery.totalStops,
    };
  };

  // Empty state
  if (!delivery) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Status</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color="#10B981" />
          </View>
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptySubtitle}>
            All deliveries completed. Great work!
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <MaterialCommunityIcons name="refresh" size={18} color="#3B82F6" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Status</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Notification Banner */}
      {notification && (
        <NotificationBanner
          visible={true}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onDismiss={() => setNotification(null)}
          autoDismiss
          autoDismissDelay={3000}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Progress Tracker */}
        <ProgressTracker
          currentStatus={delivery.currentStatus}
          stopNumber={delivery.stopNumber}
          totalStops={delivery.totalStops}
        />

        {/* Order Details */}
        <OrderDetailsCard
          orderId={delivery.orderId}
          customerName={delivery.customerName}
          customerPhone={delivery.customerPhone}
          pickupLocation={delivery.pickupLocation}
          dropoffLocation={delivery.dropoffLocation}
          deliveryWindow={delivery.deliveryWindow}
          specialInstructions={delivery.specialInstructions}
        />

        {/* Map Preview */}
        <MapPreview
          pickupLocation={delivery.pickupLocation}
          dropoffLocation={delivery.dropoffLocation}
        />

        {/* Action Buttons */}
        <ActionButtons
          currentStatus={delivery.currentStatus}
          onStartDelivery={handleStartDelivery}
          onMarkDelivered={handleMarkDelivered}
          onMarkFailed={handleMarkFailed}
          isLoading={isUpdating}
        />
      </ScrollView>

      {/* Modals */}
      <PODCapture
        visible={showPODModal}
        onClose={() => setShowPODModal(false)}
        onSubmit={handlePODSubmit}
        customerPhone={delivery?.customerPhone}
        orderId={delivery?.orderId}
      />

      <FailedDeliveryModal
        visible={showFailedModal}
        onClose={() => setShowFailedModal(false)}
        onSubmit={handleFailedSubmit}
        orderId={delivery.orderId}
      />

      <DeliveryCompleteModal
        visible={showCompleteModal}
        orderId={delivery.orderId}
        customerName={delivery.customerName}
        hasNextDelivery={!!(delivery.stopNumber && delivery.totalStops && delivery.stopNumber < delivery.totalStops)}
        nextDeliveryInfo={getNextDeliveryInfo()}
        onNextDelivery={handleNextDelivery}
        onViewAllDeliveries={handleViewAllDeliveries}
        onClose={handleCloseCompleteModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
  },
});
