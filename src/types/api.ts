// API Response wrapper
export interface ApiResponse<T> {
  success?: boolean;
  message: string;
  data: T;
  error: string | null;
}

// User roles
export type UserRole = 'CUSTOMER' | 'KITCHEN_STAFF' | 'DRIVER' | 'ADMIN';

// User status
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// User interface
export interface User {
  _id: string;
  phone: string;
  role: UserRole;
  name: string;
  email?: string;
  profileImage?: string;
  status: UserStatus;
  firebaseUid: string;
  lastLoginAt: string;
  fcmTokens?: string[];
  createdAt: string;
  updatedAt: string;
}

// Approval Status for Drivers
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Driver availability/status (backend status values)
export type DriverAvailabilityStatus = 'OFFLINE' | 'AVAILABLE' | 'ON_DELIVERY' | 'RETURNING' | 'ON_BREAK';

// Driver Status Update Response
export interface DriverStatusUpdateData {
  previousStatus: DriverAvailabilityStatus;
  currentStatus: DriverAvailabilityStatus;
  isOnShift: boolean;
}

// Shift Management
export type ShiftAction = 'START' | 'END';

// Shift Management Response
export interface ShiftManageData {
  isOnShift: boolean;
  shiftStartedAt?: string;
  shiftEndedAt?: string;
  driverStatus: DriverAvailabilityStatus;
}

// Auth Sync Response
export interface AuthSyncData {
  user: User | null;
  isNewUser: boolean;
  isProfileComplete: boolean;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string;
  message?: string;
}

// Auth Me Response
export interface AuthMeData {
  user: User;
}

// Auth Profile Update Request
export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  profileImage?: string;
}

// Auth Profile Update Response
export interface ProfileUpdateData {
  user: User;
  isProfileComplete: boolean;
}

// Batch statuses
export type BatchStatus =
  | 'COLLECTING'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PARTIAL_COMPLETE'
  | 'CANCELLED';

// Order statuses (backend accepted values)
export type OrderStatus =
  | 'READY'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED'
  | 'PICKED_UP'  // Legacy support
  | 'OUT_FOR_DELIVERY';  // Legacy support

// Order source types
export type OrderSource = 'DIRECT' | 'SCHEDULED' | 'AUTO_ORDER';

// Meal window
export type MealWindow = 'LUNCH' | 'DINNER';

// Address interface
export interface Address {
  name?: string;
  phone?: string;
  contactName?: string; // Customer name from order schema
  contactPhone?: string; // Customer phone from order schema
  flatNumber?: string;
  street?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  area?: string;
  locality?: string; // Backend uses "locality" for area
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Kitchen interface
export interface Kitchen {
  _id: string;
  name: string;
  address: Address;
  phone?: string;
}

// Zone interface
export interface Zone {
  _id: string;
  name: string;
  city: string;
}

// Batch interface
export interface Batch {
  _id: string;
  batchNumber: string;
  kitchenId: string | Kitchen;
  zoneId: string | Zone;
  driverId?: string;
  menuType: string;
  mealWindow: MealWindow;
  status: BatchStatus;
  orderIds: string[];
  batchDate: string;
  windowEndTime: string;
  maxBatchSize: number;
  totalDelivered: number;
  totalFailed: number;
  driverAssignedAt?: string;
  dispatchedAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Order Item interface
export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

// Order interface
export interface Order {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  orderSource?: OrderSource;
  deliveryAddress: Address;
  items: OrderItem[];
  grandTotal?: number;
  userId?: string;
  sequenceNumber?: number;
  assignmentStatus?: string;
  specialInstructions?: string;
}

// Available Batch (simplified for list view)
export interface AvailableBatch {
  _id: string;
  batchNumber: string;
  kitchen: Kitchen;
  zone: Zone;
  orderCount: number;
  mealWindow: MealWindow;
  estimatedEarnings?: number;
}

// Delivery Assignment interface
export interface DeliveryAssignment {
  order: Order;
  address: Address;
  sequence: number;
}

// Batch Accept Response
export interface BatchAcceptData {
  batch: Batch;
  orders: Order[];
  pickupAddress: Address;
  deliveries: DeliveryAssignment[];
}

// Current Batch Summary
export interface BatchSummary {
  totalOrders: number;
  delivered: number;
  pending: number;
  failed: number;
}

// Current Batch Response
export interface MyBatchData {
  batch: Batch | null;
  orders: Order[];
  pickupAddress?: Address;
  summary: BatchSummary;
}

// Proof of Delivery
export interface ProofOfDelivery {
  type: 'OTP' | 'SIGNATURE' | 'PHOTO';
  otp?: string;
  signature?: string;
  photoUrl?: string;
}

// Delivery Status Update Request
export interface DeliveryStatusUpdateRequest {
  status: OrderStatus;
  notes?: string;
  failureReason?: 'CUSTOMER_UNAVAILABLE' | 'WRONG_ADDRESS' | 'CUSTOMER_REFUSED' | 'ADDRESS_NOT_FOUND' | 'CUSTOMER_UNREACHABLE' | 'OTHER';
  proofOfDelivery?: ProofOfDelivery;
}

// Batch Progress
export interface BatchProgress {
  delivered: number;
  failed: number;
  total: number;
}

// Delivery Assignment Details
export interface DeliveryAssignmentDetails {
  _id: string;
  orderId: string;
  driverId: string;
  batchId: string;
  status: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  failureNotes?: string;
  proofOfDelivery?: any;
}

// Delivery Status Update Response
export interface DeliveryStatusUpdateData {
  order: Order;
  assignment: DeliveryAssignmentDetails;
  batchProgress: BatchProgress;
}

// ============================================
// Driver Registration Types
// ============================================

// Vehicle Types
export type VehicleType = 'BIKE' | 'SCOOTER' | 'BICYCLES' | 'OTHER';

// Document Types
export type DocumentType = 'RC' | 'INSURANCE' | 'PUC' | 'OTHER';

// Vehicle Document
export interface VehicleDocument {
  type: DocumentType;
  imageUrl: string;
  expiryDate?: string;
}

// Driver Registration Request
export interface DriverRegistrationRequest {
  name: string;
  email?: string;
  profileImage?: string;
  licenseNumber: string;
  licenseImageUrl: string;
  licenseExpiryDate?: string;
  vehicleName: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  vehicleDocuments: VehicleDocument[];
}

// Driver Registration Response
export interface DriverRegistrationData {
  user: User;
  approvalStatus: ApprovalStatus;
  message: string;
}

// ============================================
// Driver Orders Types
// ============================================

// Customer interface for driver orders
export interface Customer {
  name: string;
  phone: string;
}

// Driver Order interface
export interface DriverOrder {
  _id: string;
  orderNumber: string;
  customer: Customer;
  deliveryAddress: Address;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  specialInstructions?: string;
  scheduledDeliveryTime?: string;
  createdAt: string;
}

// Driver Orders Response
export interface DriverOrdersData {
  orders: DriverOrder[];
  count: number;
}

// ============================================
// Driver Profile Types
// ============================================

// Driver Profile Details
export interface DriverProfileDetails {
  licenseNumber: string;
  licenseImageUrl: string;
  licenseExpiryDate?: string;
  vehicleName: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  vehicleDocuments: VehicleDocument[];
  isAvailable: boolean;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

// Driver Delivery Statistics
export interface DriverStats {
  totalDeliveries: number;
  deliveredCount: number;
  failedCount: number;
  activeCount: number;
  successRate: number;
}

// Complete Driver Profile Response
export interface DriverProfileData {
  user: User;
  driverDetails: DriverProfileDetails;
  statistics: DriverStats;
}

// Update Basic Profile Request
export interface UpdateDriverProfileRequest {
  name?: string;
  email?: string;
  profileImage?: string;
}

// Update Vehicle Request
export interface UpdateVehicleRequest {
  vehicleName?: string;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
}

// Update Profile Image Request
export interface UpdateProfileImageRequest {
  profileImage: string;
}

// Document Update Request
export interface DocumentUpdateRequest {
  documentType: 'LICENSE' | 'RC' | 'INSURANCE' | 'PUC' | 'OTHER';
  reason: string;
  currentValue?: string;
  requestedValue?: string;
}

// Document Update Request Response
export interface DocumentUpdateRequestData {
  request: {
    _id: string;
    driverId: string;
    documentType: string;
    reason: string;
    currentValue?: string;
    requestedValue?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
  };
  message: string;
}

// ============================================
// Driver Batch History Types
// ============================================

// History Batch with Orders
export interface HistoryBatch {
  batchId: string;
  _id: string;
  status: BatchStatus;
  date: string;
  totalOrders: number;
  kitchen: Kitchen;
  zone: Zone;
  orders: Order[];
  driverAssignedAt: string;
  completedAt?: string;
}

// Single Order (not in batch)
export interface HistorySingleOrder {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  kitchenId: Kitchen;
  placedAt: string;
}

// Driver Batch History Response
export interface DriverBatchHistoryData {
  batches: HistoryBatch[];
  singleOrders: HistorySingleOrder[];
}

// ============================================
// Driver Location & Tracking Types
// ============================================

// Driver Location Update Request
export interface DriverLocationUpdate {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

// Driver Location Update Response
export interface DriverLocationResponse {
  updated: boolean;
  user: boolean;
  assignment: boolean;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// Tracking Delivery (per order in tracking response)
export interface TrackingDelivery {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  deliveryStatus: string;
  coordinates: { latitude: number; longitude: number };
  distanceFromDriverMeters: number;
  etaSeconds: number;
  etaStatus: 'ON_TIME' | 'LATE' | 'EARLY' | 'CRITICAL';
  sequence: {
    sequenceNumber: number;
    totalInBatch: number;
    source: string;
  };
}

// Batch Tracking Response
export interface BatchTrackingData {
  batchId: string;
  batchNumber: string;
  batchStatus: BatchStatus;
  kitchenId: string;
  driver: {
    driverId: string;
    name: string;
    latitude: number;
    longitude: number;
    updatedAt: string;
    driverStatus: string;
  };
  routeOptimization?: {
    algorithm: string;
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    improvementPercent: number;
    optimizedAt: string;
  };
  totalOrders: number;
  deliveredCount: number;
  failedCount: number;
  deliveries: TrackingDelivery[];
}

// Order-Level Tracking Response
export interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  batchId: string;
  batchStatus: BatchStatus;
  driver: {
    driverId: string;
    name: string;
    latitude: number;
    longitude: number;
    locationUpdatedAt: string;
  } | null;
  delivery: {
    status: string;
    distanceRemainingMeters: number | null;
    etaSeconds: number | null;
    etaStatus: 'ON_TIME' | 'LATE' | 'EARLY' | 'CRITICAL' | null;
    lastRecalculatedAt: string | null;
  };
  sequence: {
    sequenceNumber: number;
    totalInBatch: number;
    source: string;
  } | null;
}

// ============================================
// Notification Types
// ============================================

// Notification types that match backend
export type NotificationType =
  | 'BATCH_READY'
  | 'BATCH_ASSIGNED'
  | 'BATCH_UPDATED'
  | 'BATCH_CANCELLED'
  | 'BATCH_REASSIGNED'
  | 'BATCH_OPTIMIZED'
  | 'ORDER_READY_FOR_PICKUP'
  | 'ORDER_PICKED_UP'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'ORDER_DELIVERED'
  | 'ORDER_FAILED';

// Notification interface
export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: {
    batchId?: string;
    batchNumber?: string;
    orderId?: string;
    orderNumber?: string;
    orderCount?: string;
    kitchenId?: string;
    [key: string]: any;
  };
  entityType?: 'BATCH' | 'ORDER';
  entityId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notifications List Response
export interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}
