# Tiffsy Driver App - Complete Integration Guide

**Backend API Documentation & Frontend Implementation Prompts**

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Driver Registration](#driver-registration)
4. [Driver Profile Management](#driver-profile-management)
5. [Delivery Operations](#delivery-operations)
6. [All API Endpoints Reference](#all-api-endpoints-reference)
7. [Frontend Implementation Prompts](#frontend-implementation-prompts)
8. [Error Handling](#error-handling)
9. [Push Notifications](#push-notifications)
10. [Testing Checklist](#testing-checklist)

---

## Overview

This document provides complete specifications for building the Tiffsy Driver mobile application, including:
- All backend API endpoints with request/response formats
- Frontend implementation prompts for React Native
- UI/UX guidelines and screen flows
- Error handling and edge cases
- Push notification handling

### Technology Stack

**Backend:**
- Express.js with MongoDB and Mongoose
- Firebase Authentication for Phone OTP
- Role-based access control with Firebase ID tokens

**Frontend (Mobile App):**
- React Native
- Firebase SDK for authentication
- FCM for push notifications

### Base Configuration

**API Base URL:** `https://your-domain.com/api`

**Authentication Header:**
```
Authorization: Bearer <firebase_id_token>
```

**Response Format:**
All API responses follow this structure:
```json
{
  "message": "Human readable message",
  "data": { /* actual response data */ },
  "error": null  // or error details if failed
}
```

---

## Authentication Flow

### Overview

Drivers authenticate using Firebase Phone OTP. After OTP verification, the driver must:
1. Check if their account exists (sync)
2. If new → Register as driver (requires admin approval)
3. If existing → Check approval status
4. If approved → Access driver dashboard
5. If pending → Show waiting screen
6. If rejected → Show rejection screen with reason

### Step-by-Step Flow

```
┌─────────────────────┐
│  Phone OTP Screen   │
│  (Firebase Auth)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  POST /auth/sync    │
│  Check if user      │
│  exists             │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐  ┌────────────┐
│ New     │  │ Existing   │
│ User    │  │ Driver     │
└────┬────┘  └──────┬─────┘
     │              │
     ▼              ▼
┌──────────┐  ┌──────────────┐
│ Role     │  │ Check        │
│Selection │  │approvalStatus│
└────┬─────┘  └──────┬───────┘
     │               │
     ▼         ┌─────┼─────┬─────┐
┌──────────┐   │     │     │     │
│ Driver   │   ▼     ▼     ▼     ▼
│Register  │ PEND  APPR  REJCT  NULL
└────┬─────┘   │     │     │     │
     │         ▼     ▼     ▼     ▼
     ▼     ┌─────┐┌────┐┌────┐┌────┐
┌─────────┐│Wait ││Home││Rejc││Role│
│Approved?││Scrn ││    ││Scrn││Sel │
└─────────┘└─────┘└────┘└────┘└────┘
```

---

## Driver Registration

### Endpoint: Check User Exists (Sync)

**POST** `/api/auth/sync`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Response - New User:**
```json
{
  "message": "User not found",
  "data": {
    "user": null,
    "isNewUser": true,
    "isProfileComplete": false
  },
  "error": null
}
```

**Response - Pending Driver:**
```json
{
  "message": "Driver pending approval",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9179621765",
      "role": "DRIVER",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "PENDING",
      "licenseNumber": "MH1234567890",
      "vehicleNumber": "MH12AB1234"
    },
    "isNewUser": false,
    "isProfileComplete": true,
    "approvalStatus": "PENDING"
  },
  "error": null
}
```

**Response - Rejected Driver:**
```json
{
  "message": "Driver registration rejected",
  "data": {
    "user": { /* same as above */ },
    "isNewUser": false,
    "isProfileComplete": true,
    "approvalStatus": "REJECTED",
    "rejectionReason": "Invalid license document. Please upload a clear photo of your license."
  },
  "error": null
}
```

**Response - Approved Driver:**
```json
{
  "message": "User authenticated",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9179621765",
      "role": "DRIVER",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "ACTIVE",
      "profileImage": "https://storage.example.com/profile.jpg",
      "licenseNumber": "MH1234567890",
      "vehicleNumber": "MH12AB1234",
      "vehicleType": "SCOOTER",
      "lastLoginAt": "2025-01-12T10:30:00.000Z"
    },
    "isNewUser": false,
    "isProfileComplete": true,
    "approvalStatus": "APPROVED"
  },
  "error": null
}
```

---

### Endpoint: Register New Driver

**POST** `/api/auth/register-driver`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "profileImage": "https://storage.example.com/profile.jpg",
  "licenseNumber": "MH1234567890",
  "licenseImageUrl": "https://storage.example.com/license.jpg",
  "licenseExpiryDate": "2027-12-31",
  "vehicleName": "Honda Activa",
  "vehicleNumber": "MH12AB1234",
  "vehicleType": "SCOOTER",
  "vehicleDocuments": [
    {
      "type": "RC",
      "imageUrl": "https://storage.example.com/rc.jpg",
      "expiryDate": "2028-06-15"
    },
    {
      "type": "INSURANCE",
      "imageUrl": "https://storage.example.com/insurance.jpg",
      "expiryDate": "2025-03-20"
    }
  ]
}
```

**Field Validations:**
- `name` (required): String, min 2 characters
- `email` (optional): Valid email format
- `profileImage` (optional): Valid URL
- `licenseNumber` (required): String, non-empty
- `licenseImageUrl` (required): Valid URL
- `licenseExpiryDate` (optional): ISO date string, must be future date
- `vehicleName` (required): String, e.g., "Honda Activa"
- `vehicleNumber` (required): String, format: MH12AB1234
- `vehicleType` (required): Enum: "BIKE", "SCOOTER", "BICYCLE", "OTHER"
- `vehicleDocuments` (required): Array, at least 1 document
  - `type` (required): Enum: "RC", "INSURANCE", "PUC", "OTHER"
  - `imageUrl` (required): Valid URL
  - `expiryDate` (optional): ISO date string

**Success Response:**
```json
{
  "message": "Driver registration submitted for approval",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9179621765",
      "role": "DRIVER",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "PENDING",
      "licenseNumber": "MH1234567890",
      "vehicleNumber": "MH12AB1234",
      "vehicleType": "SCOOTER",
      "createdAt": "2025-01-12T10:30:00.000Z"
    },
    "approvalStatus": "PENDING",
    "message": "Your registration is pending admin approval. You will be notified once approved."
  },
  "error": null
}
```

**Error Responses:**

*Validation Error (400):*
```json
{
  "message": "Validation error",
  "data": null,
  "error": {
    "fields": {
      "licenseNumber": "License number is required",
      "vehicleNumber": "Invalid vehicle number format"
    }
  }
}
```

*Already Registered (409):*
```json
{
  "message": "Driver account already exists",
  "data": null,
  "error": "A driver account with this phone number already exists"
}
```

---

## Driver Profile Management

### Endpoint: Get Current User Profile

**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "message": "User profile",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "9179621765",
      "role": "DRIVER",
      "name": "John Doe",
      "email": "john@example.com",
      "profileImage": "https://storage.example.com/profile.jpg",
      "status": "ACTIVE",
      "licenseNumber": "MH1234567890",
      "licenseImageUrl": "https://storage.example.com/license.jpg",
      "licenseExpiryDate": "2027-12-31",
      "vehicleName": "Honda Activa",
      "vehicleNumber": "MH12AB1234",
      "vehicleType": "SCOOTER",
      "vehicleDocuments": [
        {
          "type": "RC",
          "imageUrl": "https://storage.example.com/rc.jpg",
          "expiryDate": "2028-06-15"
        }
      ],
      "lastLoginAt": "2025-01-12T10:30:00.000Z",
      "fcmTokens": ["fcm_token_1"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-12T10:30:00.000Z"
    }
  },
  "error": null
}
```

---

### Endpoint: Update Profile

**PUT** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "newemail@example.com",
  "profileImage": "https://storage.example.com/new-profile.jpg"
}
```

All fields are optional. Only include fields you want to update.

**Response:**
```json
{
  "message": "Profile updated",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe Updated",
      "email": "newemail@example.com",
      "profileImage": "https://storage.example.com/new-profile.jpg",
      /* ... other fields ... */
      "updatedAt": "2025-01-12T11:00:00.000Z"
    }
  },
  "error": null
}
```

---

### Endpoint: Register FCM Token

**POST** `/api/auth/fcm-token`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fcmToken": "fcm_token_from_firebase_messaging",
  "deviceId": "unique_device_identifier_optional"
}
```

**Response:**
```json
{
  "message": "FCM token registered",
  "data": null,
  "error": null
}
```

---

### Endpoint: Remove FCM Token (Logout)

**DELETE** `/api/auth/fcm-token`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fcmToken": "fcm_token_to_remove"
}
```

**Response:**
```json
{
  "message": "FCM token removed",
  "data": null,
  "error": null
}
```

---

## Delivery Operations

### Batch Lifecycle & Status Flow

**Batch Statuses:**
1. `COLLECTING` - Orders are being added (not visible to drivers)
2. `READY_FOR_DISPATCH` - Ready for drivers to accept (after meal window ends)
3. `DISPATCHED` - Driver accepted, hasn't picked up yet
4. `IN_PROGRESS` - Driver picked up and is delivering
5. `COMPLETED` - All orders delivered successfully
6. `PARTIAL_COMPLETE` - Some orders delivered, some failed
7. `CANCELLED` - Batch cancelled by admin

**Delivery Assignment Statuses:**
- `ASSIGNED` - Order assigned to driver
- `ACKNOWLEDGED` - Driver acknowledged
- `PICKED_UP` - Driver picked up from kitchen
- `EN_ROUTE` - Driver is on the way
- `ARRIVED` - Driver arrived at customer location
- `DELIVERED` - Successfully delivered
- `FAILED` - Delivery failed
- `RETURNED` - Order returned to kitchen
- `CANCELLED` - Order cancelled

**Failure Reasons:**
- `CUSTOMER_UNAVAILABLE` - Customer not available at location
- `WRONG_ADDRESS` - Address incorrect or not found
- `CUSTOMER_REFUSED` - Customer refused to accept order
- `ADDRESS_NOT_FOUND` - Could not locate the address
- `CUSTOMER_UNREACHABLE` - Could not contact customer by phone
- `OTHER` - Other reason (provide details in notes)

---

### Endpoint: Get Available Batches

**GET** `/api/delivery/available-batches`

View all delivery batches ready for acceptance. Batches become available after meal window ends.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "message": "Available batches retrieved",
  "data": {
    "batches": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "batchNumber": "BTH-KRN-20250112-001",
        "kitchen": {
          "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
          "name": "Tiffsy Kitchen Koramangala",
          "address": {
            "street": "123 Main Street",
            "area": "Koramangala",
            "city": "Bangalore",
            "state": "Karnataka",
            "pincode": "560034",
            "latitude": 12.9352,
            "longitude": 77.6245
          },
          "phone": "9876543210"
        },
        "zone": {
          "_id": "65a1b2c3d4e5f6a7b8c9d0e3",
          "name": "Koramangala",
          "city": "Bangalore"
        },
        "orderCount": 12,
        "mealWindow": "LUNCH",
        "estimatedEarnings": 240,
        "windowEndTime": "2025-01-12T13:00:00.000Z",
        "createdAt": "2025-01-12T12:30:00.000Z"
      }
    ]
  },
  "error": null
}
```

**Notes:**
- Batches are first-come-first-served
- Multiple drivers may see the same batch
- Only the first to accept gets assigned
- Empty array if no batches available

---

### Endpoint: Accept Batch

**POST** `/api/delivery/batches/:batchId/accept`

Accept a delivery batch. Atomic operation prevents race conditions.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**URL Parameters:**
- `batchId`: MongoDB ObjectId (24-character hex string)

**Request Body:**
```json
{}
```

**Success Response:**
```json
{
  "message": "Batch accepted",
  "data": {
    "batch": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "batchNumber": "BTH-KRN-20250112-001",
      "status": "DISPATCHED",
      "kitchenId": "65a1b2c3d4e5f6a7b8c9d0e2",
      "driverId": "507f1f77bcf86cd799439011",
      "mealWindow": "LUNCH",
      "orderIds": ["65a1b2c3d4e5f6a7b8c9d0e7", "65a1b2c3d4e5f6a7b8c9d0e8"],
      "driverAssignedAt": "2025-01-12T13:15:00.000Z",
      "dispatchedAt": "2025-01-12T13:15:00.000Z"
    },
    "orders": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e7",
        "orderNumber": "ORD-20250112-001",
        "status": "READY",
        "deliveryAddress": {
          "name": "Customer Name",
          "phone": "9876543210",
          "flatNumber": "Apt 401",
          "street": "10th Cross Road",
          "landmark": "Near Park",
          "area": "Koramangala 5th Block",
          "city": "Bangalore",
          "state": "Karnataka",
          "pincode": "560034",
          "latitude": 12.9350,
          "longitude": 77.6240
        },
        "items": [
          {
            "menuItemId": "65a1b2c3d4e5f6a7b8c9d0ea",
            "name": "Chicken Biryani",
            "quantity": 2,
            "price": 180
          }
        ],
        "sequenceNumber": 1
      }
    ],
    "pickupAddress": {
      "street": "123 Main Street",
      "area": "Koramangala",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560034",
      "latitude": 12.9352,
      "longitude": 77.6245
    }
  },
  "error": null
}
```

**Error Response - Already Taken (400):**
```json
{
  "message": "Batch already taken or not available",
  "data": null,
  "error": "This batch has been assigned to another driver"
}
```

---

### Endpoint: Get My Current Batch

**GET** `/api/delivery/my-batch`

Retrieve driver's currently assigned batch with all details.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response - Active Batch:**
```json
{
  "message": "Current batch retrieved",
  "data": {
    "batch": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "batchNumber": "BTH-KRN-20250112-001",
      "status": "IN_PROGRESS",
      "kitchenId": {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
        "name": "Tiffsy Kitchen Koramangala",
        "address": {
          "street": "123 Main Street",
          "area": "Koramangala",
          "city": "Bangalore",
          "pincode": "560034",
          "latitude": 12.9352,
          "longitude": 77.6245
        },
        "phone": "9876543210"
      },
      "driverId": "507f1f77bcf86cd799439011",
      "mealWindow": "LUNCH",
      "totalDelivered": 1,
      "totalFailed": 0,
      "driverAssignedAt": "2025-01-12T13:15:00.000Z",
      "dispatchedAt": "2025-01-12T13:15:00.000Z",
      "pickedUpAt": "2025-01-12T13:25:00.000Z"
    },
    "orders": [
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e7",
        "orderNumber": "ORD-20250112-001",
        "status": "DELIVERED",
        "deliveryAddress": {
          "name": "Customer Name",
          "phone": "9876543210",
          "flatNumber": "Apt 401",
          "street": "10th Cross Road",
          "landmark": "Near Park",
          "area": "Koramangala 5th Block",
          "city": "Bangalore",
          "pincode": "560034",
          "latitude": 12.9350,
          "longitude": 77.6240
        },
        "sequenceNumber": 1,
        "assignmentStatus": "DELIVERED",
        "deliveredAt": "2025-01-12T13:45:00.000Z"
      },
      {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e8",
        "orderNumber": "ORD-20250112-002",
        "status": "PICKED_UP",
        "deliveryAddress": {
          "name": "Another Customer",
          "phone": "9123456789",
          "flatNumber": "House 12",
          "street": "15th Main Road",
          "landmark": "Opposite Temple",
          "area": "Koramangala 6th Block",
          "city": "Bangalore",
          "pincode": "560034",
          "latitude": 12.9340,
          "longitude": 77.6250
        },
        "sequenceNumber": 2,
        "assignmentStatus": "PICKED_UP"
      }
    ],
    "summary": {
      "totalOrders": 2,
      "delivered": 1,
      "pending": 1,
      "failed": 0
    }
  },
  "error": null
}
```

**Response - No Active Batch:**
```json
{
  "message": "No active batch",
  "data": {
    "batch": null,
    "orders": [],
    "summary": {
      "totalOrders": 0,
      "delivered": 0,
      "pending": 0,
      "failed": 0
    }
  },
  "error": null
}
```

---

### Endpoint: Mark Batch as Picked Up

**PATCH** `/api/delivery/batches/:batchId/pickup`

Mark batch as picked up from kitchen. Updates status to IN_PROGRESS.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**URL Parameters:**
- `batchId`: MongoDB ObjectId

**Request Body:**
```json
{
  "notes": "All orders verified and picked up"
}
```

- `notes` (optional): String, max 200 characters

**Success Response:**
```json
{
  "message": "Batch picked up",
  "data": {
    "batch": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "batchNumber": "BTH-KRN-20250112-001",
      "status": "IN_PROGRESS",
      "pickedUpAt": "2025-01-12T13:25:00.000Z"
    }
  },
  "error": null
}
```

**Error - Not Assigned (403):**
```json
{
  "message": "Not assigned to this batch",
  "data": null,
  "error": "You are not assigned to this batch"
}
```

**Error - Wrong Status (400):**
```json
{
  "message": "Batch must be in DISPATCHED status",
  "data": null,
  "error": "Cannot mark as picked up. Current status: IN_PROGRESS"
}
```

---

### Endpoint: Update Delivery Status

**PATCH** `/api/delivery/orders/:orderId/status`

Update status of a specific order delivery.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**URL Parameters:**
- `orderId`: MongoDB ObjectId

**Request Body - Delivered:**
```json
{
  "status": "DELIVERED",
  "notes": "Delivered to customer at door",
  "proofOfDelivery": {
    "type": "OTP",
    "otp": "1234"
  }
}
```

**Request Body - En Route:**
```json
{
  "status": "EN_ROUTE",
  "notes": "On the way to customer location"
}
```

**Request Body - Arrived:**
```json
{
  "status": "ARRIVED",
  "notes": "Reached customer location"
}
```

**Request Body - Failed:**
```json
{
  "status": "FAILED",
  "notes": "Customer not available after multiple attempts",
  "failureReason": "CUSTOMER_UNAVAILABLE"
}
```

**Field Validations:**
- `status` (required): Enum: "EN_ROUTE", "ARRIVED", "DELIVERED", "FAILED"
- `notes` (optional): String, max 200 characters
- `failureReason` (required if status=FAILED): Enum: "CUSTOMER_UNAVAILABLE", "WRONG_ADDRESS", "CUSTOMER_REFUSED", "ADDRESS_NOT_FOUND", "CUSTOMER_UNREACHABLE", "OTHER"
- `proofOfDelivery` (required if status=DELIVERED): Object
  - `type` (required): Enum: "OTP", "SIGNATURE", "PHOTO"
  - `otp` (required if type=OTP): String (4 digits)
  - `signatureUrl` (required if type=SIGNATURE): Valid URL
  - `photoUrl` (required if type=PHOTO): Valid URL

**Success Response - Delivered:**
```json
{
  "message": "Delivery status updated",
  "data": {
    "order": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e7",
      "orderNumber": "ORD-20250112-001",
      "status": "DELIVERED",
      "deliveredAt": "2025-01-12T13:45:00.000Z"
    },
    "assignment": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0f0",
      "status": "DELIVERED",
      "deliveredAt": "2025-01-12T13:45:00.000Z",
      "proofOfDelivery": {
        "type": "OTP",
        "otp": "1234",
        "otpVerified": true,
        "verifiedAt": "2025-01-12T13:45:00.000Z"
      }
    },
    "batchProgress": {
      "delivered": 1,
      "failed": 0,
      "total": 3
    }
  },
  "error": null
}
```

**Success Response - Failed:**
```json
{
  "message": "Delivery status updated",
  "data": {
    "order": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e7",
      "orderNumber": "ORD-20250112-001",
      "status": "FAILED",
      "failedAt": "2025-01-12T13:50:00.000Z"
    },
    "assignment": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0f0",
      "status": "FAILED",
      "failedAt": "2025-01-12T13:50:00.000Z",
      "failureReason": "CUSTOMER_UNAVAILABLE",
      "failureNotes": "Customer not available after multiple attempts"
    },
    "batchProgress": {
      "delivered": 0,
      "failed": 1,
      "total": 3
    }
  },
  "error": null
}
```

---

### Endpoint: Update Delivery Sequence

**PATCH** `/api/delivery/batches/:batchId/sequence`

Reorder delivery sequence within a batch.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**URL Parameters:**
- `batchId`: MongoDB ObjectId

**Request Body:**
```json
{
  "sequence": [
    {
      "orderId": "65a1b2c3d4e5f6a7b8c9d0e8",
      "sequenceNumber": 1
    },
    {
      "orderId": "65a1b2c3d4e5f6a7b8c9d0e7",
      "sequenceNumber": 2
    },
    {
      "orderId": "65a1b2c3d4e5f6a7b8c9d0e9",
      "sequenceNumber": 3
    }
  ]
}
```

**Validations:**
- `sequence` (required): Array, min 1 item
- Each item must have `orderId` (24-char hex) and `sequenceNumber` (integer >= 1)
- All orders in batch must be included
- Sequence numbers must be unique

**Success Response:**
```json
{
  "message": "Delivery sequence updated",
  "data": {
    "batch": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "batchNumber": "BTH-KRN-20250112-001",
      "status": "IN_PROGRESS",
      "updatedAt": "2025-01-12T13:30:00.000Z"
    }
  },
  "error": null
}
```

---

### Endpoint: Complete Batch

**PATCH** `/api/delivery/batches/:batchId/complete`

Mark batch as complete. Usually called automatically when last order is updated.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**URL Parameters:**
- `batchId`: MongoDB ObjectId

**Request Body:**
```json
{
  "notes": "All deliveries completed"
}
```

**Success Response - All Delivered:**
```json
{
  "message": "Batch completed",
  "data": {
    "batch": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "batchNumber": "BTH-KRN-20250112-001",
      "status": "COMPLETED",
      "completedAt": "2025-01-12T14:30:00.000Z",
      "totalDelivered": 12,
      "totalFailed": 0
    },
    "summary": {
      "totalOrders": 12,
      "delivered": 12,
      "failed": 0
    }
  },
  "error": null
}
```

**Success Response - Some Failed:**
```json
{
  "message": "Batch completed",
  "data": {
    "batch": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "batchNumber": "BTH-KRN-20250112-001",
      "status": "PARTIAL_COMPLETE",
      "completedAt": "2025-01-12T14:30:00.000Z",
      "totalDelivered": 10,
      "totalFailed": 2
    },
    "summary": {
      "totalOrders": 12,
      "delivered": 10,
      "failed": 2
    }
  },
  "error": null
}
```

---

### Endpoint: Get Batch Details

**GET** `/api/delivery/batches/:batchId`

Get detailed information about a specific batch.

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**URL Parameters:**
- `batchId`: MongoDB ObjectId

**Response:**
```json
{
  "message": "Batch retrieved",
  "data": {
    "batch": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "batchNumber": "BTH-KRN-20250112-001",
      "status": "COMPLETED",
      "kitchenId": {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
        "name": "Tiffsy Kitchen Koramangala",
        "address": { /* full address */ }
      },
      "driverId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "phone": "9179621765"
      },
      "mealWindow": "LUNCH",
      "totalDelivered": 2,
      "totalFailed": 0,
      "completedAt": "2025-01-12T14:30:00.000Z"
    },
    "orders": [ /* array of orders with full details */ ],
    "assignments": [ /* array of delivery assignments with proof */ ]
  },
  "error": null
}
```

---

## All API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/sync` | Firebase Token | Check if user exists after OTP |
| POST | `/api/auth/register-driver` | Firebase Token | Register new driver (needs approval) |
| GET | `/api/auth/me` | Auth Token | Get current user profile |
| PUT | `/api/auth/profile` | Auth Token | Update user profile |
| POST | `/api/auth/fcm-token` | Auth Token | Register FCM token |
| DELETE | `/api/auth/fcm-token` | Auth Token | Remove FCM token |

### Delivery Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/delivery/available-batches` | DRIVER | Get batches ready for acceptance |
| POST | `/api/delivery/batches/:batchId/accept` | DRIVER | Accept a batch |
| GET | `/api/delivery/my-batch` | DRIVER | Get current active batch |
| PATCH | `/api/delivery/batches/:batchId/pickup` | DRIVER | Mark batch picked up |
| PATCH | `/api/delivery/orders/:orderId/status` | DRIVER | Update delivery status |
| PATCH | `/api/delivery/batches/:batchId/sequence` | DRIVER | Reorder delivery sequence |
| PATCH | `/api/delivery/batches/:batchId/complete` | DRIVER | Complete batch |
| GET | `/api/delivery/batches/:batchId` | DRIVER | Get batch details |

---

## Frontend Implementation Prompts

### Screen 1: Phone OTP Authentication

```
Create a Phone OTP authentication screen with Firebase:

1. Phone Input Screen:
   - Title: "Welcome to Tiffsy Driver"
   - Subtitle: "Enter your phone number to continue"
   - Phone input field with country code (+91 India)
   - Validation: 10 digits, starts with 6-9
   - "Send OTP" button
   - Use Firebase Phone Auth to send OTP

2. OTP Verification Screen:
   - Display masked phone number
   - 6-digit OTP input (auto-submit when 6 digits entered)
   - Resend OTP button with countdown timer (30 seconds)
   - Auto-focus on first input box
   - Use Firebase to verify OTP
   - On success: Get Firebase ID token and call POST /api/auth/sync

Design: Clean, professional, use primary brand colors
Loading states: Show spinner during API calls
Error handling: Display Firebase errors in user-friendly format
```

---

### Screen 2: Role Selection (New Users Only)

```
Create a role selection screen shown after OTP when isNewUser is true:

UI Elements:
- App logo at top
- Title: "Join Tiffsy"
- Subtitle: "How would you like to use Tiffsy?"
- Two large cards (50% width each):

  Card 1 - Customer:
  - Icon: Shopping bag or food icon
  - Title: "Order Food"
  - Description: "Get delicious meals delivered to your doorstep"
  - Action: Navigate to customer registration

  Card 2 - Driver:
  - Icon: Scooter or delivery icon
  - Title: "Deliver Food"
  - Description: "Earn money by delivering orders in your area"
  - Action: Navigate to driver registration form

Design:
- Cards should be prominent and easy to tap
- Use distinct colors for each role
- Add subtle shadows and rounded corners
- Responsive layout
```

---

### Screen 3: Driver Registration Form

```
Create a comprehensive driver registration form with multiple sections:

Structure: Use a multi-step form or long scrollable form with section headers

SECTION 1: Personal Information
- Full Name input (required, min 2 chars)
  - Label: "Full Name"
  - Placeholder: "John Doe"
- Email input (optional)
  - Label: "Email Address"
  - Placeholder: "john@example.com"
  - Validation: Valid email format
- Profile Photo Upload (optional)
  - Camera/gallery picker
  - Show preview after upload
  - Max size: 5MB
  - Upload to your storage service first, get URL

SECTION 2: License Details
- License Number input (required)
  - Label: "Driving License Number"
  - Placeholder: "MH1234567890"
- License Photo Upload (required)
  - Camera/gallery picker
  - Show preview with zoom option
  - Clear visibility instructions: "Upload clear photo of license"
  - Max size: 5MB
- License Expiry Date picker (optional)
  - Must be future date
  - Date picker component

SECTION 3: Vehicle Information
- Vehicle Name input (required)
  - Label: "Vehicle Name/Model"
  - Placeholder: "Honda Activa"
- Vehicle Number input (required)
  - Label: "Vehicle Registration Number"
  - Placeholder: "MH12AB1234"
  - Auto-uppercase input
  - Format validation
- Vehicle Type dropdown (required)
  - Options: Bike, Scooter, Bicycle, Other
  - Material dropdown or bottom sheet

SECTION 4: Vehicle Documents (Dynamic List)
- Initial: One document entry
- Each document entry has:
  - Document Type dropdown: RC, Insurance, PUC, Other
  - Document Photo Upload (camera/gallery)
  - Expiry Date picker (optional)
  - Delete button (if more than 1 entry)
- "Add Another Document" button at bottom
- Minimum 1 document required

Form Footer:
- "Submit Registration" button (full width)
- Terms checkbox: "I agree to terms and conditions"
- Button disabled until form is valid

Validation:
- Validate on field blur
- Show errors inline below each field
- Highlight required fields with asterisk (*)
- Scroll to first error on submit

Loading States:
- Show spinner during image uploads
- Disable form during submission
- Show upload progress for images

Image Upload Flow:
1. User selects image
2. Show loading indicator
3. Upload to storage service (Firebase Storage / S3)
4. Get URL back
5. Store URL in form state
6. Show thumbnail preview

Error Handling:
- Network errors: Show retry option, save form data
- Upload failures: Allow retry for individual images
- API errors: Display validation errors inline

On Success:
- Call POST /api/auth/register-driver with all data
- Navigate to Waiting for Approval screen
```

---

### Screen 4: Waiting for Approval

```
Create an approval waiting screen for drivers:

UI Elements:
- Animated illustration (hourglass, document review, or waiting animation)
- Status badge: "PENDING" (yellow/orange with hourglass icon)
- Title: "Registration Under Review"
- Message: "Your registration is being reviewed by our team. You'll be notified once it's approved."
- Estimated time: "Usually takes 24-48 hours"
- Info cards:
  - "What happens next?"
  - "You'll receive a notification once approved"
  - "Make sure your phone notifications are enabled"
- "Check Status" button (calls POST /api/auth/sync again)
- "Contact Support" link or button
- "Logout" option in menu/header

Functionality:
- Pull-to-refresh to check status
- Auto-check status on app launch
- Show last checked timestamp
- If status changes to APPROVED: Navigate to Driver Home
- If status changes to REJECTED: Navigate to Rejection Screen

Design:
- Use calming, reassuring colors
- Professional tone
- Not scary, informative
- Show that the process is in motion

Notifications:
- Listen for push notification: DRIVER_APPROVED
- When received: Show success message, navigate to home
```

---

### Screen 5: Registration Rejected

```
Create a driver registration rejection screen:

UI Elements:
- Icon: Warning (not error) - empathetic design
- Status badge: "REJECTED" (red with X icon)
- Title: "Registration Not Approved"
- Subtitle: "Your application needs attention"
- Rejection Reason Card:
  - Label: "Reason for rejection:"
  - Display rejection reason from API
  - Use clear, readable font
  - Red/orange background, white text
- "What you can do" section:
  - Bullet points with actionable steps
  - "Fix the issues mentioned above"
  - "Re-submit your application"
  - "Contact support if you need help"
- Primary button: "Re-apply"
  - Navigate back to registration form
  - Pre-fill previous data from local storage
  - Allow user to edit and fix issues
- Secondary button: "Contact Support"
  - Open support chat or email
- "Logout" option

Functionality:
- Store previous registration data locally
- On "Re-apply": Pre-fill form with previous data
- Highlight fields that likely caused rejection
- Allow full editing of all fields
- On re-submit: Call POST /api/auth/register-driver again

Design:
- Empathetic, not punishing
- Clear and helpful
- Show that fixing issues is straightforward
- Use warm colors, not harsh red everywhere

Edge Case:
- If user keeps getting rejected: Show "Need Help?" prominent button
```

---

### Screen 6: Driver Home Dashboard

```
Create the main driver dashboard screen (after approval):

Header:
- Profile photo (circular)
- Driver name
- Status badge: "Online" / "Offline" toggle
- Notification bell icon
- Hamburger menu for navigation

Main Content:

1. Current Batch Card (if active):
   - Batch number (e.g., "BTH-KRN-20250112-001")
   - Status badge: "Dispatched" / "In Progress" / "Completing"
   - Progress bar: X of Y delivered
   - Kitchen name and area
   - "View Details" button
   - Prominent primary action button:
     - If DISPATCHED: "Navigate to Kitchen"
     - If IN_PROGRESS: "Continue Deliveries"

2. No Active Batch (if no batch):
   - Illustration: Empty state with scooter
   - Message: "No active deliveries"
   - "Find Batches" button (navigate to Available Batches)

3. Quick Stats Cards (3 cards in row):
   - Today's Deliveries: Count
   - Today's Earnings: ₹ amount
   - Success Rate: percentage

4. Action Buttons (2 columns):
   - "Available Batches" (with count badge if available)
   - "Delivery History"
   - "Earnings"
   - "Profile Settings"

Bottom Navigation:
- Home
- Batches
- History
- Profile

On App Launch:
- Call GET /api/delivery/my-batch
- If active batch exists: Show current batch card
- If no active batch: Show empty state
- Call GET /api/auth/me for latest profile

Auto-refresh:
- Refresh batch status every 30 seconds if active
- Stop refreshing when batch complete

Functionality:
- Toggle online/offline status
- FCM notifications for new batches
- Pull-to-refresh
```

---

### Screen 7: Available Batches List

```
Create an available batches listing screen:

Header:
- Title: "Available Batches"
- Subtitle: "First come, first served"
- Refresh icon button

Filter/Sort Bar:
- Sort by: Nearest, Most Orders, Highest Earnings
- Filter: Zone dropdown (if multiple zones)

Batch Cards (List):
Each card displays:
- Batch Number (small, top right)
- Kitchen name (bold, large)
- Kitchen area/zone (subtitle)
- Order count: "12 Orders" (with icon)
- Estimated earnings: "₹ 240" (prominent, green)
- Meal window badge: "LUNCH" or "DINNER"
- Distance from driver (if location available): "2.3 km"
- Small map preview or address
- "Accept Batch" button (primary, full width)

Empty State:
- Illustration: Empty box or waiting
- Title: "No Batches Available"
- Subtitle: "Check back soon or enable notifications"
- "Refresh" button

Loading State:
- Skeleton loaders for cards
- Pull-to-refresh enabled

Functionality:
- Auto-refresh every 2 minutes
- Pull-to-refresh manual
- On "Accept Batch":
  1. Show loading on button
  2. Call POST /api/delivery/batches/:batchId/accept
  3. On success: Navigate to Batch Details screen
  4. On error (already taken): Show toast, refresh list
  5. On error (other): Show error message with retry

Race Condition Handling:
- If batch already taken: Show toast "This batch was taken by another driver"
- Automatically remove that batch from list
- Highlight next available batch

Real-time Updates:
- Listen for FCM notification: NEW_BATCH_AVAILABLE
- Auto-refresh list when notification received
- Show badge on notification bell

Design:
- Cards with shadows, rounded corners
- Use green for earnings (positive)
- Clear hierarchy of information
- Easy-to-tap buttons (min 44pt height)
```

---

### Screen 8: Batch Details & Kitchen Pickup

```
Create a batch details screen after accepting batch:

Screen State: DISPATCHED (Before Pickup)

Header:
- Title: Batch number (e.g., "BTH-KRN-20250112-001")
- Status badge: "Dispatched"

Kitchen Information Card:
- Kitchen name (bold, large)
- Full address with icon
- Phone number with "Call Kitchen" button
- Small map showing kitchen location
- "Navigate to Kitchen" button (primary, opens maps app)

Orders Summary Card:
- Total orders count
- List of order numbers (collapsed)
- "View All Orders" expansion
- When expanded: Show each order with:
  - Order number
  - Items summary (e.g., "2x Chicken Biryani")
  - Customer area (without full address)

Checklist Card:
- "Pickup Checklist"
- Checkboxes for each order:
  - [ ] ORD-001 - Verified
  - [ ] ORD-002 - Verified
  - etc.
- Can check off orders as driver verifies them

Action Button (Bottom Fixed):
- "Mark as Picked Up" (full width, primary)
- Disabled until at least manual confirmation
- Optional: Require all checkboxes checked

On "Mark as Picked Up":
1. Confirm dialog: "Confirm you have picked up all X orders?"
2. Call PATCH /api/delivery/batches/:batchId/pickup
3. On success: Navigate to Active Delivery Screen
4. On error: Show error message

Design:
- Clear visual hierarchy
- Large, easy-to-tap buttons
- Map should be tappable for full screen
- Use location icon for address
- Use phone icon for call button
```

---

### Screen 9: Active Delivery Screen

```
Create an active delivery management screen:

Screen State: IN_PROGRESS (After Pickup)

Header:
- Batch number
- Status badge: "In Progress"
- Progress: "3 of 12 delivered" (with progress bar)

Map View (Top Half):
- Show all pending delivery locations as pins
- Show current location (driver)
- Show route to next delivery
- Tappable to full screen
- Next delivery pin highlighted in different color

Delivery List (Bottom Half):
- Scrollable list of deliveries
- Current/next delivery highlighted

Each Delivery Card:
- Sequence number badge (e.g., "#1")
- Customer name (first name + last initial for privacy)
- Delivery address (street, area)
- Landmark (if available)
- Distance from current location
- Status badge: "Pending" / "Delivered" / "Failed"
- Order items summary (collapsible)
- Action buttons:vi
  - If next delivery: "Navigate" (primary) + "Call Customer"
  - If delivered: Green checkmark, timestamp
  - If failed: Red X, failure reason

Drag-to-Reorder:
- Long press on card to enable dragging
- Reorder deliveries
- "Save Order" button appears when changed
- Call PATCH /api/delivery/batches/:batchId/sequence

Bottom Sheet for Current Delivery:
- Swipe up to expand
- Full customer details
- Order items list with quantities
- Delivery instructions (if any)
- Customer phone with "Call" button
- "Mark as Delivered" button (primary)
- "Mark as Failed" button (secondary, red)

Functionality:
- Auto-scroll to next pending delivery
- Show distance and ETA to each delivery
- Update locations in real-time
- Handle background location tracking

On "Mark as Delivered":
- Show OTP input dialog (see Screen 10)

On "Mark as Failed":
- Show failure reason dialog (see Screen 11)

Design:
- Map should be prominent
- Easy to see next delivery at a glance
- Color coding: Green (delivered), Red (failed), Blue (pending)
- Large, finger-friendly buttons
```

---

### Screen 10: Delivery Confirmation Dialog (OTP)

```
Create a delivery confirmation dialog with OTP verification:

Dialog/Modal:
- Title: "Confirm Delivery"
- Subtitle: "Ask customer for their delivery OTP"

OTP Input:
- 4 digit input boxes (large, easy to type)
- Auto-focus on first box
- Auto-advance to next box
- Auto-submit when 4 digits entered
- Number keyboard

Buttons:
- Primary: "Verify & Complete" (auto-submits if 4 digits entered)
- Secondary: "Cancel"

Optional Fields:
- Notes text area: "Delivery notes (optional)"
  - Placeholder: "e.g., Delivered at door"

On Submit:
1. Validate OTP format (4 digits)
2. Call PATCH /api/delivery/orders/:orderId/status
   Body: {
     status: "DELIVERED",
     proofOfDelivery: { type: "OTP", otp: "1234" },
     notes: "..."
   }
3. On success:
   - Close dialog
   - Show success animation/toast: "Order delivered!"
   - Update delivery card in list (show green checkmark)
   - Auto-scroll to next pending delivery
   - If last delivery: Show batch completion screen
4. On error (invalid OTP):
   - Show error: "Invalid OTP. Please check with customer."
   - Allow retry
   - Keep dialog open
5. On error (network):
   - Show error with retry option
   - Cache delivery data locally, sync when online

Design:
- Clean, focused dialog
- Large OTP input boxes (easy to type)
- Clear call-to-action
- Green theme for successful delivery
```

---

### Screen 11: Failed Delivery Dialog

```
Create a failed delivery reporting dialog:

Dialog/Modal:
- Title: "Mark Delivery as Failed"
- Subtitle: "Please select a reason"

Failure Reason Dropdown/Picker:
- Required field
- Options (from API validation):
  1. Customer Unavailable
  2. Wrong Address
  3. Customer Refused
  4. Address Not Found
  5. Customer Unreachable
  6. Other

Notes Text Area:
- Label: "Additional details"
- Placeholder: "Describe what happened..."
- Optional but recommended
- Max 200 characters
- Character counter

Buttons:
- Primary: "Submit" (red/orange - warning color)
- Secondary: "Cancel"

Confirmation Step:
- After submit, show confirmation dialog:
  "Are you sure you want to mark this delivery as failed?"
- "Yes, Mark as Failed" (red)
- "Cancel"

On Submit:
1. Validate reason is selected
2. Call PATCH /api/delivery/orders/:orderId/status
   Body: {
     status: "FAILED",
     failureReason: "CUSTOMER_UNAVAILABLE",
     notes: "..."
   }
3. On success:
   - Close dialog
   - Show toast: "Delivery marked as failed"
   - Update delivery card (show red X, failure reason)
   - Move to next pending delivery
4. On error:
   - Show error message with retry

Design:
- Serious but not scary
- Use orange/amber colors (warning, not error)
- Make it clear this is a significant action
- Require confirmation
- Easy to cancel accidentally

Note to Frontend Developer:
- Encourage drivers to add detailed notes
- Failed deliveries affect driver rating
- Make "Other" reason require notes
```

---

### Screen 12: Batch Completion Summary

```
Create a batch completion summary screen:

Trigger: Automatically shown when last delivery is marked (delivered or failed)

Animation:
- Success animation (checkmark, confetti) if all delivered
- Partial success animation if some failed

Header:
- Status badge: "COMPLETED" (green) or "PARTIAL_COMPLETE" (yellow)
- Title: "Batch Complete!"

Summary Cards:

1. Delivery Statistics:
   - Total Orders: 12
   - Successfully Delivered: 11 (green)
   - Failed Deliveries: 1 (red)
   - Success Rate: 92% (large, prominent)

2. Earnings Card:
   - Estimated Earnings: ₹ 240 (large, green)
   - Base amount: ₹ 200
   - Bonus/Incentive: ₹ 40 (if applicable)
   - Note: "Earnings will be credited within 24 hours"

3. Time Summary:
   - Start Time: 1:15 PM
   - End Time: 2:45 PM
   - Duration: 1 hour 30 minutes

Failed Deliveries Section (if any):
- List of failed orders with reasons
- Info: "Admin will handle follow-up"

Action Buttons:
- Primary: "Find Next Batch" (navigate to Available Batches)
- Secondary: "View Details" (navigate to Batch History detail)
- Tertiary: "Back to Home"

Additional Options:
- Share achievement (social share if success rate high)
- "Rate your experience" (optional feedback)

Functionality:
- Auto-call PATCH /api/delivery/batches/:batchId/complete if not auto-completed
- Store batch summary locally
- Update earnings in profile

Design:
- Celebratory if all delivered
- Encouraging even if some failed
- Clear visual separation of success/failure
- Use green liberally for positive reinforcement
- Avoid making failed deliveries feel negative

Navigate Away:
- Can't go back to active delivery
- Remove batch from "current batch"
- Update home screen to show "no active batch"
```

---

### Screen 13: Delivery History

```
Create a delivery history screen showing past batches:

Header:
- Title: "Delivery History"
- Filter icon (date range, status filter)

Date Filters (Tabs):
- Today
- This Week
- This Month
- Custom Range

Batch Cards (List):
Each card shows:
- Batch number (small, top)
- Date and time (e.g., "Today, 1:15 PM" or "Jan 10, 2025")
- Status badge: Completed / Partial Complete
- Kitchen name and area
- Statistics in row:
  - Orders: 12
  - Delivered: 11
  - Failed: 1
- Earnings: ₹ 240 (prominent, right side)
- Success rate: 92% (small, bottom)
- Tap to view full details

Empty State:
- Illustration: Empty history book
- "No delivery history yet"
- "Complete your first batch to see it here"

Batch Detail View (on tap):
- Full batch information
- Kitchen details
- Complete delivery list with:
  - Order numbers
  - Customer areas
  - Delivery times
  - Proof of delivery (OTP, signature, photo)
  - For failed: Failure reason and notes
- Earnings breakdown
- Timeline of batch (accepted → picked up → completed)

Functionality:
- Infinite scroll for loading more
- Pull-to-refresh
- Search by batch number
- Filter by date range
- Filter by status (completed, partial)

Analytics Section (at top):
- Total batches completed
- Total deliveries made
- Total earnings (lifetime)
- Average success rate

Export Option:
- "Export Report" button
- Generate PDF or CSV of deliveries
```

---

### Screen 14: Earnings Dashboard

```
Create an earnings tracking screen:

Header:
- Title: "Earnings"
- Date range selector

Summary Cards:

1. Total Earnings (Large):
   - Current period total (big number)
   - Comparison: "+15% from last week"
   - Green arrow if up, red if down

2. Breakdown:
   - Completed Deliveries: Count
   - Average per Delivery: ₹ amount
   - Bonuses/Incentives: ₹ amount

Date Range Tabs:
- Today
- This Week
- This Month
- All Time

Earnings List:
Each entry shows:
- Date
- Batch number
- Orders delivered
- Base earnings
- Bonuses (if any)
- Total earnings
- Payment status: Paid / Pending

Chart/Graph:
- Line chart showing earnings over time
- X-axis: Dates
- Y-axis: Earnings
- Interactive (tap to see daily details)

Payment Status Section:
- Pending Payment: ₹ amount (yellow)
- Paid This Month: ₹ amount (green)
- Next Payment Date: "Jan 15, 2025"

Bank Details Card:
- Show masked bank account
- "Update Bank Details" button
- Navigate to settings

Filter/Sort:
- Sort by date (newest first)
- Filter by payment status

Functionality:
- Pull-to-refresh
- Show payment history
- Download statements
```

---

### Screen 15: Profile Settings

```
Create a driver profile and settings screen:

Profile Section (Top):
- Large profile photo (circular, tappable to change)
- Driver name (editable)
- Phone number (non-editable, show with mask)
- Email (editable)
- Status: Active / Inactive (from backend)
- "Edit Profile" button

Driver Details Section:
- License Number: MH1234567890
- License Expiry: Dec 31, 2027 (show warning if expiring soon)
- "Update License" button
- Vehicle Type: Scooter
- Vehicle Number: MH12AB1234
- "Update Vehicle" button

Documents Section:
- "View License" (opens image viewer)
- "View Vehicle Documents" (list of docs with view buttons)
- "Upload New Document" button

Settings List:
1. Notifications
   - Toggle: Push Notifications
   - Toggle: New Batch Alerts
   - Toggle: Earnings Updates

2. Preferences
   - Language selection
   - Theme: Light / Dark

3. Account
   - Bank Details
   - Change Password
   - Logout

4. Support
   - Help Center
   - Contact Support
   - FAQs
   - Terms & Conditions
   - Privacy Policy

5. About
   - App Version
   - Rate Us
   - Share App

Logout:
- Confirm dialog: "Are you sure you want to logout?"
- On confirm:
  1. Call DELETE /api/auth/fcm-token
  2. Clear local storage
  3. Clear Firebase auth
  4. Navigate to Phone OTP screen

Edit Profile Flow:
- Tap "Edit Profile"
- Show form with current values
- Allow editing: name, email, profile image
- Upload new image if changed
- Call PUT /api/auth/profile
- Show success message

Design:
- Clean, organized sections
- Use separators between sections
- Material Design or iOS native components
- Profile photo prominent at top
- Easy access to important settings
```

---

## Error Handling

### Common Error Responses

| Status | Error Type | Message | Frontend Action |
|--------|------------|---------|-----------------|
| 400 | Bad Request | Validation error | Show field-level errors inline |
| 401 | Unauthorized | Token expired | Refresh Firebase token, retry |
| 401 | Unauthorized | Invalid token | Re-authenticate, clear local data |
| 403 | Forbidden | Account suspended | Show message, logout user, contact support |
| 403 | Forbidden | Account pending approval | Navigate to waiting screen |
| 403 | Forbidden | Registration rejected | Navigate to rejection screen |
| 403 | Forbidden | Not assigned to batch | Show error message, refresh batch list |
| 404 | Not Found | Resource not found | Show error, navigate back |
| 409 | Conflict | Already exists | Show message, redirect to sync |
| 500 | Server Error | Internal server error | Show retry option, log error |

### Error Handling Implementation

```
Create a centralized error handler:

1. Network Errors:
   - Check if online/offline
   - If offline: Show "No internet connection" banner
   - Cache operations for later sync
   - Allow offline viewing of data

2. Authentication Errors:
   - 401 Unauthorized:
     - Attempt silent token refresh
     - If refresh fails: Clear auth, navigate to login
   - 403 Forbidden:
     - Check reason from response
     - If suspended: Show suspension message, logout
     - If pending: Navigate to waiting screen
     - If rejected: Navigate to rejection screen

3. Validation Errors (400):
   - Parse error response
   - Extract field-level errors
   - Display errors inline below relevant fields
   - Scroll to first error field
   - Highlight invalid fields with red border

4. Conflict Errors (409):
   - Batch already taken: Show toast, refresh list
   - User already exists: Show message, navigate to sync

5. Server Errors (500):
   - Show user-friendly error message
   - Provide "Retry" button
   - Log detailed error for debugging
   - Don't expose technical details to user

6. Timeout Errors:
   - Set request timeout: 30 seconds
   - On timeout: Show "Request timed out" message
   - Provide retry option
   - For critical operations: Queue for retry

Error Display Components:
- Toast for minor errors (auto-dismiss)
- Alert dialog for important errors (requires acknowledgment)
- Inline errors for form validation
- Banner for persistent issues (offline, suspended)

Retry Logic:
- Implement exponential backoff
- Retry up to 3 times for network errors
- Don't retry for 4xx errors (except 401)
- Do retry for 5xx errors

Logging:
- Log all errors to console (dev mode)
- Send critical errors to error tracking service (Sentry, etc.)
- Include: error message, stack trace, user ID, timestamp, request details
```

---

## Push Notifications

### Notification Types

1. **New Batch Available**
```json
{
  "notification": {
    "title": "New Batch Available!",
    "body": "BTH-KRN-20250112-001 in Koramangala (12 orders)"
  },
  "data": {
    "type": "NEW_BATCH_AVAILABLE",
    "batchId": "65a1b2c3d4e5f6a7b8c9d0e1",
    "batchNumber": "BTH-KRN-20250112-001",
    "zone": "Koramangala",
    "orderCount": "12"
  }
}
```
**Action:** Navigate to Available Batches screen, highlight specific batch

2. **Driver Approved**
```json
{
  "notification": {
    "title": "Registration Approved!",
    "body": "Your driver registration has been approved. Start delivering now!"
  },
  "data": {
    "type": "DRIVER_APPROVED",
    "action": "navigate_home"
  }
}
```
**Action:** Update local state, navigate to Driver Home, show success message

3. **Driver Rejected**
```json
{
  "notification": {
    "title": "Registration Update",
    "body": "Your registration needs attention. Tap to see details."
  },
  "data": {
    "type": "DRIVER_REJECTED",
    "action": "navigate_rejection",
    "reason": "Invalid license document"
  }
}
```
**Action:** Navigate to Rejection screen, display reason

4. **Batch Reassigned**
```json
{
  "notification": {
    "title": "Batch Reassigned",
    "body": "Your batch has been reassigned by admin"
  },
  "data": {
    "type": "BATCH_REASSIGNED",
    "batchId": "65a1b2c3d4e5f6a7b8c9d0e1"
  }
}
```
**Action:** Refresh current batch, show message

5. **Order Cancelled**
```json
{
  "notification": {
    "title": "Order Cancelled",
    "body": "Order #ORD-001 has been cancelled by customer"
  },
  "data": {
    "type": "ORDER_CANCELLED",
    "orderId": "65a1b2c3d4e5f6a7b8c9d0e7",
    "batchId": "65a1b2c3d4e5f6a7b8c9d0e1"
  }
}
```
**Action:** Refresh batch order list, remove cancelled order

### Implementation

```
Implement FCM push notifications:

1. Setup FCM:
   - Install @react-native-firebase/messaging
   - Configure for iOS (APNs) and Android (FCM)
   - Request notification permissions on app launch

2. Get FCM Token:
   - On app launch, get FCM token
   - Call POST /api/auth/fcm-token to register
   - Store token locally
   - Re-register if token refreshes

3. Foreground Notifications:
   - Listen to onMessage event
   - Show in-app notification banner
   - Handle based on notification type
   - Update app state accordingly

4. Background/Quit Notifications:
   - Listen to onBackgroundMessage
   - Show system notification
   - On tap: Navigate to appropriate screen
   - Use notification data to determine navigation

5. Notification Handler:
   switch (notification.data.type) {
     case "NEW_BATCH_AVAILABLE":
       - Navigate to Available Batches
       - Highlight specific batch if batchId provided
       - Refresh batch list
       break;

     case "DRIVER_APPROVED":
       - Update user status in local state
       - Navigate to Driver Home
       - Show success modal/alert
       break;

     case "DRIVER_REJECTED":
       - Update user status
       - Navigate to Rejection screen
       - Display rejection reason
       break;

     case "BATCH_REASSIGNED":
       - Refresh current batch data
       - Show alert message
       - Navigate to home if no longer assigned
       break;

     case "ORDER_CANCELLED":
       - Refresh batch order list
       - Update UI to remove cancelled order
       - Adjust batch totals
       break;
   }

6. Notification Settings:
   - Allow user to enable/disable notifications
   - Per-type settings (new batches, earnings, etc.)
   - Store preferences locally
   - Quiet hours (optional)

7. Badge Count:
   - Show badge on app icon for unread notifications
   - Clear badge when app opens
   - Update badge count based on notification type

Testing:
- Test foreground notifications
- Test background notifications
- Test notification tap handling
- Test with app killed
- Test on both iOS and Android
```

---

## Testing Checklist

### Authentication Flow
- [ ] New user sees role selection after OTP
- [ ] Driver registration form validates all fields
- [ ] Required fields show error when empty
- [ ] Email validation works correctly
- [ ] Images upload successfully to storage
- [ ] Vehicle number format validation works
- [ ] At least one document required validation
- [ ] License expiry date must be future date
- [ ] Form submission works
- [ ] Success navigation to waiting screen
- [ ] Pending driver sees waiting screen on login
- [ ] Rejected driver sees rejection screen with reason
- [ ] Approved driver navigates to home
- [ ] FCM token registers successfully
- [ ] Token persists across app restarts

### Batch Operations
- [ ] Available batches list loads correctly
- [ ] Empty state shows when no batches
- [ ] Batch acceptance works (happy path)
- [ ] Race condition handled (batch already taken)
- [ ] Error shown when batch already taken
- [ ] Current batch persists across app restart
- [ ] Kitchen pickup flow works
- [ ] Batch status updates to IN_PROGRESS after pickup
- [ ] All orders list correctly in delivery screen

### Delivery Operations
- [ ] Map shows all delivery locations
- [ ] Next delivery highlighted
- [ ] Navigation to maps app works (Google/Apple Maps)
- [ ] Call customer button works
- [ ] OTP delivery confirmation works
- [ ] Invalid OTP shows error
- [ ] Successful delivery updates UI
- [ ] Failed delivery dialog works
- [ ] All failure reasons available
- [ ] Failed delivery requires reason
- [ ] Delivery sequence reorder works
- [ ] Last delivery triggers batch completion
- [ ] Batch completion summary shows correct stats

### UI/UX
- [ ] Loading states show during API calls
- [ ] Error messages are user-friendly
- [ ] Form validation errors show inline
- [ ] Pull-to-refresh works on all lists
- [ ] Offline mode shows appropriate message
- [ ] Images load and display correctly
- [ ] Profile image upload works
- [ ] All buttons are easily tappable (min 44pt)
- [ ] Text is readable on all screen sizes
- [ ] Navigation flow is logical

### Push Notifications
- [ ] Notifications received in foreground
- [ ] Notifications received in background
- [ ] Notifications received when app killed
- [ ] Tap on notification navigates correctly
- [ ] NEW_BATCH_AVAILABLE notification works
- [ ] DRIVER_APPROVED notification works
- [ ] DRIVER_REJECTED notification works
- [ ] Notification badge updates

### Edge Cases
- [ ] App restart during active batch
- [ ] Network loss during delivery
- [ ] Token expiry handled gracefully
- [ ] Suspended account shows message
- [ ] Location permission denied handled
- [ ] Camera permission denied handled
- [ ] Low storage during image upload
- [ ] Large image upload (> 5MB) prevented
- [ ] Phone call interruption during delivery
- [ ] GPS/location services disabled

### Performance
- [ ] App launches quickly (< 3 seconds)
- [ ] Lists scroll smoothly
- [ ] Images load without blocking UI
- [ ] No memory leaks on navigation
- [ ] Background location tracking efficient
- [ ] API calls timeout after 30 seconds

---

## Summary

This guide provides complete specifications for building the Tiffsy Driver mobile application with:

**12 Backend API Endpoints:**
- 6 Authentication endpoints
- 8 Delivery operation endpoints

**15 Frontend Screens:**
1. Phone OTP Authentication
2. Role Selection
3. Driver Registration Form
4. Waiting for Approval
5. Registration Rejected
6. Driver Home Dashboard
7. Available Batches List
8. Batch Details & Kitchen Pickup
9. Active Delivery Screen
10. Delivery Confirmation (OTP)
11. Failed Delivery Dialog
12. Batch Completion Summary
13. Delivery History
14. Earnings Dashboard
15. Profile Settings

**Key Features:**
- Firebase Phone OTP authentication
- Driver registration with admin approval
- Batch-based delivery system
- OTP-based delivery confirmation
- Failed delivery handling with reasons
- Real-time location tracking
- Push notifications for updates
- Earnings tracking
- Delivery history

**Technical Implementation:**
- React Native mobile app
- Firebase Authentication & FCM
- RESTful API integration
- Image upload to cloud storage
- Offline data persistence
- Background location tracking
- Error handling & retry logic

All endpoints, request/response formats, validation rules, and UI implementation prompts are provided to enable complete development of the driver application.

---

**Document Version:** 1.0
**Last Updated:** January 12, 2026
**Backend Base URL:** `https://your-domain.com/api`
