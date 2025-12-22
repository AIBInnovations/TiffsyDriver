import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useEffect } from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
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

// Mock data for demonstration
const mockDeliveryData: DeliveryData = {
  deliveryId: "DEL-001",
  orderId: "Order #12345",
  customerName: "John Doe",
  customerPhone: "+1 (555) 123-4567",
  pickupLocation: "123 Main Street, Downtown, City 10001",
  dropoffLocation: "456 Oak Avenue, Suburbs, City 10002",
  deliveryWindow: "10:00 AM - 11:00 AM",
  specialInstructions: "Please ring the doorbell twice. Leave package at the door if no answer. Gate code: 1234",
  currentStatus: "pending",
  stopNumber: 1,
  totalStops: 3,
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

  // Load delivery data
  useEffect(() => {
    loadDeliveryData();
  }, [route.params]);

  const loadDeliveryData = useCallback(() => {
    if (route.params?.deliveryId) {
      // Use params if provided
      setDelivery({
        deliveryId: route.params.deliveryId,
        orderId: route.params.orderId || "Order #12345",
        customerName: route.params.customerName || "Customer",
        customerPhone: route.params.customerPhone || "",
        pickupLocation: route.params.pickupLocation || "",
        dropoffLocation: route.params.dropoffLocation || "",
        deliveryWindow: route.params.deliveryWindow || "",
        specialInstructions: route.params.specialInstructions || "",
        currentStatus: route.params.currentStatus || "pending",
        batchId: route.params.batchId,
        stopNumber: route.params.stopNumber,
        totalStops: route.params.totalStops,
      });
    } else {
      // Use mock data
      setDelivery(mockDeliveryData);
    }
  }, [route.params]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadDeliveryData();
      setIsRefreshing(false);
      showNotification("success", "Updated", "Delivery details refreshed");
    }, 1000);
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

  const updateDeliveryStatus = (newStatus: DeliveryStatusType) => {
    if (!delivery) return;

    setIsUpdating(true);

    // Simulate API call
    setTimeout(() => {
      setDelivery({ ...delivery, currentStatus: newStatus });
      setIsUpdating(false);

      // Show completion modal for delivered status
      if (newStatus === "delivered") {
        setShowCompleteModal(true);
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
    }, 500);
  };

  const handleStartDelivery = () => {
    updateDeliveryStatus("in_progress");
  };

  const handleMarkPickedUp = () => {
    updateDeliveryStatus("picked_up");
  };

  const handleMarkDelivered = () => {
    setShowPODModal(true);
  };

  const handlePODSubmit = () => {
    setShowPODModal(false);
    updateDeliveryStatus("delivered");
  };

  const handleMarkFailed = () => {
    setShowFailedModal(true);
  };

  const handleFailedSubmit = (reason: string, notes?: string) => {
    setShowFailedModal(false);
    updateDeliveryStatus("failed");
    console.log("Failed reason:", reason, "Notes:", notes);
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleProfilePress = () => {
    // Navigate to profile
  };

  const handleNextDelivery = () => {
    setShowCompleteModal(false);
    // In a real app, this would load the next delivery data
    // For now, simulate loading next delivery
    if (delivery && delivery.stopNumber && delivery.totalStops && delivery.stopNumber < delivery.totalStops) {
      setDelivery({
        ...delivery,
        deliveryId: `DEL-00${(delivery.stopNumber || 0) + 1}`,
        orderId: `Order #1234${(delivery.stopNumber || 0) + 1}`,
        customerName: `Customer ${(delivery.stopNumber || 0) + 1}`,
        stopNumber: (delivery.stopNumber || 0) + 1,
        currentStatus: "pending",
      });
    }
  };

  const handleViewAllDeliveries = () => {
    setShowCompleteModal(false);
    navigation.navigate("Deliveries" as never);
  };

  const handleCloseCompleteModal = () => {
    setShowCompleteModal(false);
  };

  // Calculate next delivery info for the modal
  const getNextDeliveryInfo = () => {
    if (!delivery || !delivery.stopNumber || !delivery.totalStops) return undefined;
    if (delivery.stopNumber >= delivery.totalStops) return undefined;

    return {
      orderId: `Order #1234${delivery.stopNumber + 1}`,
      customerName: `Customer ${delivery.stopNumber + 1}`,
      stopNumber: delivery.stopNumber + 1,
      totalStops: delivery.totalStops,
    };
  };

  // Empty state
  if (!delivery) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Status</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialCommunityIcons name="bell-outline" size={28} color="#F56B4C" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="package-variant" size={48} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Delivery Assigned</Text>
          <Text style={styles.emptySubtitle}>
            Waiting for delivery assignment. Check back soon!
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
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Status</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <MaterialCommunityIcons name="bell-outline" size={28} color="#F56B4C" />
        </TouchableOpacity>
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
          onMarkPickedUp={handleMarkPickedUp}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerRight: {
    width: 40,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
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
