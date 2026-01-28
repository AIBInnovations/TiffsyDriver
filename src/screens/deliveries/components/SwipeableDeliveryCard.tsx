import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRef, useState } from "react";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import DeliveryCard from "./DeliveryCard";
import PODCapture from "../../delivery-status/components/PODCapture";
import { Delivery } from "../../../context/DeliveryContext";
import { updateDeliveryStatus } from "../../../services/deliveryService";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeableDeliveryCardProps {
  delivery: Delivery | any;
  onStatusChange: (deliveryId: string, newStatus: any) => void;
  onCallCustomer?: (phone: string) => void;
  onNavigate?: (latitude?: number, longitude?: number, address?: string) => void;
  onMarkComplete?: (deliveryId: string) => void;
  onCardPress?: (delivery: any) => void;
  canSwipeToComplete?: boolean;
  onDeliveryCompleted?: () => void;
}

export default function SwipeableDeliveryCard({
  delivery,
  onStatusChange,
  onCallCustomer,
  onNavigate,
  onMarkComplete,
  onCardPress,
  canSwipeToComplete = true,
  onDeliveryCompleted,
}: SwipeableDeliveryCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isRevealed, setIsRevealed] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Check if delivery can be marked as complete (must be in progress/active)
  const isActiveDelivery =
    delivery.status === "in_progress" ||
    delivery.status === "picked_up" ||
    delivery.status === "EN_ROUTE" ||
    delivery.status === "ARRIVED" ||
    delivery.status === "OUT_FOR_DELIVERY" ||
    delivery.status === "PICKED_UP";

  const showSwipeAction = canSwipeToComplete && isActiveDelivery;

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return (
          showSwipeAction &&
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow right swipe (positive dx)
        if (gestureState.dx > 0) {
          translateX.setValue(Math.min(gestureState.dx, SCREEN_WIDTH * 0.4));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          // Swipe past threshold - show OTP modal
          resetPosition();
          setShowOTPModal(true);
        } else {
          // Reset position
          resetPosition();
        }
        setIsRevealed(false);
      },
      onPanResponderGrant: () => {
        setIsRevealed(true);
      },
    })
  ).current;

  const handleCardPress = () => {
    if (onCardPress) {
      onCardPress(delivery);
    }
  };

  const handleVerifyOTP = async (otp: string, notes?: string, recipientName?: string): Promise<boolean> => {
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const deliveryId = delivery._id || delivery.id;

      const requestBody: any = {
        status: 'DELIVERED',
        proofOfDelivery: {
          type: 'OTP',
          otp: otp.trim(),
        },
      };

      if (notes) {
        requestBody.proofOfDelivery.notes = notes;
      }
      if (recipientName) {
        requestBody.proofOfDelivery.recipientName = recipientName;
      }

      await updateDeliveryStatus(deliveryId, requestBody);

      setShowOTPModal(false);

      // Notify parent that delivery was completed
      if (onDeliveryCompleted) {
        onDeliveryCompleted();
      }

      // Also call onStatusChange to refresh the list
      if (onStatusChange) {
        onStatusChange(deliveryId, 'DELIVERED');
      }

      return true;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setVerifyError(error.message || 'Failed to verify OTP. Please try again.');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // Interpolate action icon opacity
  const actionOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD],
    outputRange: [0.3, 0.7, 1],
    extrapolate: "clamp",
  });

  // Interpolate action icon scale
  const actionScale = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0.8, 1.1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Background action - Mark Complete */}
      {showSwipeAction && (
        <View style={styles.actionContainer}>
          <Animated.View
            style={[
              styles.actionContent,
              {
                opacity: actionOpacity,
                transform: [{ scale: actionScale }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={32}
              color="#FFFFFF"
            />
            <Text style={styles.actionText}>Complete</Text>
          </Animated.View>
        </View>
      )}

      {/* Swipeable card */}
      <Animated.View
        style={[
          styles.cardContainer,
          { transform: [{ translateX }] },
        ]}
        {...(showSwipeAction ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={handleCardPress}
          disabled={!onCardPress}
        >
          <DeliveryCard
            delivery={delivery}
            onStatusChange={onStatusChange}
            onCallCustomer={onCallCustomer}
            onNavigate={onNavigate}
          />
        </TouchableOpacity>

        {/* Swipe hint for active deliveries */}
        {showSwipeAction && !isRevealed && (
          <View style={styles.swipeHint}>
            <MaterialCommunityIcons
              name="gesture-swipe-right"
              size={16}
              color="#10B981"
            />
            <Text style={styles.swipeHintText}>Swipe to complete</Text>
          </View>
        )}
      </Animated.View>

      {/* OTP Modal */}
      <PODCapture
        visible={showOTPModal}
        onClose={() => {
          setShowOTPModal(false);
          setVerifyError(null);
        }}
        onVerifyOTP={handleVerifyOTP}
        customerPhone={delivery.customerPhone}
        orderId={delivery.orderId || delivery.orderNumber}
        isVerifying={isVerifying}
        verifyError={verifyError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginBottom: 0,
  },
  actionContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 16,
    borderRadius: 16,
    marginHorizontal: 2,
    justifyContent: "center",
    paddingLeft: 24,
    backgroundColor: "#10B981",
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  cardContainer: {
    backgroundColor: "transparent",
  },
  swipeHint: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  swipeHintText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
