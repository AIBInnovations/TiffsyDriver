import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  OtpVerify: {
    phoneNumber: string;
    confirmation: FirebaseAuthTypes.ConfirmationResult;
  };
  RoleSelection: { phoneNumber: string };
  DriverRegistration: { phoneNumber: string; reapply?: boolean };
  ApprovalWaiting: { phoneNumber: string };
  Rejection: {
    phoneNumber: string;
    rejectionReason: string;
  };
  ProfileOnboarding: { phoneNumber: string }; // Keep for customers
};

// Delivery Status Screen Params
export interface DeliveryStatusParams {
  deliveryId: string;
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  deliveryWindow?: string;
  specialInstructions?: string;
  currentStatus?: DeliveryStatusType;
  batchId?: string;
  stopNumber?: number;
  totalStops?: number;
}

export type DeliveryStatusType =
  | "pending"
  | "picked_up"
  | "in_progress"
  | "delivered"
  | "failed";

// Main Tabs
export type MainTabsParamList = {
  Dashboard: undefined;
  Deliveries: NavigatorScreenParams<DeliveriesStackParamList> | undefined;
  DeliveryStatus: DeliveryStatusParams | undefined;
  Profile: undefined;
};

// Deliveries Stack (nested in tab)
export type DeliveriesStackParamList = {
  DeliveriesList: {
    initialFilter?: "all" | "pending" | "in_progress" | "picked_up" | "completed" | "failed";
    batchId?: string;
    completedOrderId?: string;
    completedOrderNumber?: string;
  } | undefined;
  DeliveryDetail: { deliveryId: string };
  DeliveryStatus: DeliveryStatusParams;
};

// Profile Stack (nested in tab)
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Settings: undefined;
  HelpSupport: undefined;
};

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabsParamList>;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type MainTabsScreenProps<T extends keyof MainTabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabsParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Declare global types for useNavigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
