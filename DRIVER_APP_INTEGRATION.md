# Driver App - Backend Integration Guide

> **Purpose:** This document covers all APIs the Driver App uses, including profile management, shift/status control, batch-based delivery workflow, live GPS tracking, and proof of delivery. The backend was recently restructured — the ordering system was split into **2 services** (Direct Orders + Scheduling) and a new `orderSource` field was added. Driver-facing APIs themselves had **minimal changes**, but order objects now include new fields the driver app should be aware of.

---

## Table of Contents

1. [Impact Summary](#1-impact-summary)
2. [Authentication](#2-authentication)
3. [Driver Profile](#3-driver-profile)
4. [Driver Status & Shift](#4-driver-status--shift)
5. [Batch Delivery Workflow](#5-batch-delivery-workflow)
6. [Individual Order Delivery](#6-individual-order-delivery)
7. [GPS Location Tracking](#7-gps-location-tracking)
8. [Live Tracking](#8-live-tracking)
9. [New `orderSource` Field](#9-new-ordersource-field)
10. [FCM Notifications](#10-fcm-notifications)
11. [Error Handling Reference](#11-error-handling-reference)

---

## 1. Impact Summary

### What Changed (from Ordering Refactoring)

| Area | Change | Driver Impact |
|------|--------|---------------|
| **Order schema** | New `orderSource` enum field (`DIRECT`, `SCHEDULED`, `AUTO_ORDER`) | Display badge on order cards |
| **Legacy flags** | `isAutoOrder` / `isScheduledMeal` auto-synced from `orderSource` | Can use either field |
| **New order status** | `SCHEDULED` status added to schema | Won't see these — they're promoted to `PLACED` before dispatch |
| **Auto-order addon payments** | Some auto-orders have `paymentStatus: "PENDING"` | These won't be batched/dispatched until paid |

### What Did NOT Change

- Driver profile APIs (`/api/driver/*`)
- Batch delivery workflow (`/api/delivery/*`)
- GPS location tracking
- Proof of delivery (OTP, signature, photo)
- Driver status & shift management
- All driver FCM notification types

---

## 2. Authentication

All driver endpoints use:
1. `adminAuthMiddleware` — Validates Firebase auth token
2. `roleMiddleware(["DRIVER", "ADMIN"])` — Verifies user role is DRIVER or ADMIN

Send the Firebase token in the `Authorization` header:
```
Authorization: Bearer <firebase_id_token>
```

---

## 3. Driver Profile

### 3.1 Get Profile

`GET /api/driver/profile`

**Response:**
```json
{
  "success": true,
  "message": "Driver profile retrieved",
  "data": {
    "user": {
      "_id": "...",
      "phone": "+919876543210",
      "name": "Ravi Kumar",
      "email": "ravi@example.com",
      "profileImage": "https://...",
      "status": "ACTIVE",
      "approvalStatus": "APPROVED",
      "driverDetails": {
        "vehicleName": "Honda Activa",
        "vehicleNumber": "DL01AB1234",
        "vehicleType": "SCOOTER",
        "licenseNumber": "DL-1234567890",
        "licenseExpiry": "2028-12-31"
      },
      "role": "DRIVER",
      "lastLoginAt": "2026-02-14T08:00:00.000Z",
      "createdAt": "2025-06-01T00:00:00.000Z",
      "updatedAt": "2026-02-14T08:00:00.000Z"
    },
    "stats": {
      "totalDeliveries": 450,
      "deliveredCount": 430,
      "failedCount": 12,
      "activeCount": 2,
      "successRate": 95.56
    }
  }
}
```

**Key fields:**
- `approvalStatus` — `PENDING`, `APPROVED`, or `REJECTED`. Driver cannot change status or start shift unless `APPROVED`
- `driverDetails` — Contains vehicle and document info
- `stats.successRate` — Percentage (0-100), calculated as `(deliveredCount / totalDeliveries) * 100`

### 3.2 Update Profile

`PUT /api/driver/profile`

**Request Body:**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "profileImage": "https://..."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | String | No | 2-100 chars |
| `email` | String | No | Valid email, allows null/"" |
| `profileImage` | String | No | Valid URL, allows null/"" |

> At least one field must be provided.

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "...",
      "phone": "+919876543210",
      "name": "Ravi Kumar",
      "email": "ravi@example.com",
      "profileImage": "https://...",
      "updatedAt": "2026-02-14T09:00:00.000Z"
    }
  }
}
```

### 3.3 Update Vehicle Details

`PATCH /api/driver/vehicle`

**Request Body:**
```json
{
  "vehicleName": "Honda Activa 6G",
  "vehicleNumber": "DL01AB1234",
  "vehicleType": "SCOOTER"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vehicleName` | String | No | 2-100 chars |
| `vehicleNumber` | String | No | Format: `XX00X(X)0000` — 2 letters, 2 digits, 1-2 letters, 4 digits (e.g., `DL01AB1234` or `DL01A1234`) |
| `vehicleType` | String | No | `BIKE`, `SCOOTER`, `BICYCLE`, `OTHER` |

> At least one field must be provided.

**Response:**
```json
{
  "success": true,
  "message": "Vehicle details updated successfully",
  "data": {
    "vehicleDetails": {
      "vehicleName": "Honda Activa 6G",
      "vehicleNumber": "DL01AB1234",
      "vehicleType": "SCOOTER"
    }
  }
}
```

### 3.4 Update Profile Image

`PATCH /api/driver/profile/image`

**Request Body:**
```json
{
  "profileImage": "https://storage.example.com/driver-photo.jpg"
}
```

| Field | Type | Required |
|-------|------|----------|
| `profileImage` | String (URL) | Yes |

**Response:**
```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "data": {
    "profileImage": "https://storage.example.com/driver-photo.jpg"
  }
}
```

### 3.5 Request Document Update

`POST /api/driver/documents/request`

Drivers can't directly update sensitive documents (license, RC, etc.). They submit a request for admin review.

**Request Body:**
```json
{
  "documentType": "LICENSE",
  "reason": "License renewed with new number after expiry",
  "currentValue": "DL-1234567890",
  "requestedValue": "DL-9876543210"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `documentType` | String | Yes | `LICENSE`, `RC`, `INSURANCE`, `PUC`, `OTHER` |
| `reason` | String | Yes | 10-500 chars |
| `currentValue` | String | No | Current document value |
| `requestedValue` | String | No | New value to update to |

**Response:**
```json
{
  "success": true,
  "message": "Document update request submitted. Admin will review and update your documents.",
  "data": {
    "request": {
      "driverId": "...",
      "driverName": "Ravi Kumar",
      "documentType": "LICENSE",
      "reason": "License renewed with new number after expiry",
      "currentValue": "DL-1234567890",
      "requestedValue": "DL-9876543210",
      "requestedAt": "2026-02-14T09:00:00.000Z"
    }
  }
}
```

### 3.6 Get Statistics

`GET /api/driver/stats`

**Response:**
```json
{
  "success": true,
  "message": "Driver statistics retrieved",
  "data": {
    "stats": {
      "totalDeliveries": 450,
      "deliveredCount": 430,
      "failedCount": 12,
      "activeCount": 2,
      "successRate": 95.56
    }
  }
}
```

---

## 4. Driver Status & Shift

### 4.1 Update Status

`PATCH /api/driver/status`

**Request Body:**
```json
{
  "status": "AVAILABLE"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `status` | String | Yes | `OFFLINE`, `AVAILABLE`, `ON_DELIVERY`, `RETURNING`, `ON_BREAK` |

**Status Transition Rules:**

```
OFFLINE ──────→ AVAILABLE (must start shift first)
AVAILABLE ────→ OFFLINE, ON_BREAK, ON_DELIVERY
ON_DELIVERY ──→ AVAILABLE, RETURNING
RETURNING ────→ AVAILABLE, OFFLINE
ON_BREAK ─────→ AVAILABLE, OFFLINE
```

**Constraints:**
- Must have `approvalStatus: "APPROVED"` to change status
- Must be on an active shift to go `AVAILABLE`
- `ON_DELIVERY` is set automatically when accepting a batch (you generally don't set this manually)

**Response:**
```json
{
  "success": true,
  "message": "Status updated to AVAILABLE",
  "data": {
    "previousStatus": "OFFLINE",
    "currentStatus": "AVAILABLE",
    "isOnShift": true
  }
}
```

### 4.2 Manage Shift

`PATCH /api/driver/shift`

**Request Body:**
```json
{
  "action": "START"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `action` | String | Yes | `START` or `END` |

**START Response:**
```json
{
  "success": true,
  "message": "Shift started",
  "data": {
    "isOnShift": true,
    "shiftStartedAt": "2026-02-14T08:00:00.000Z",
    "driverStatus": "AVAILABLE"
  }
}
```

**END Response:**
```json
{
  "success": true,
  "message": "Shift ended",
  "data": {
    "isOnShift": false,
    "shiftEndedAt": "2026-02-14T20:00:00.000Z",
    "driverStatus": "OFFLINE"
  }
}
```

**Constraints:**
- Must have `approvalStatus: "APPROVED"`
- Cannot start if already on shift
- Cannot end shift while `ON_DELIVERY` — must complete or reassign batch first
- Cannot end shift if no active shift exists (returns `400` "No active shift to end")
- Starting shift automatically sets status to `AVAILABLE`
- Ending shift automatically sets status to `OFFLINE`

---

## 5. Batch Delivery Workflow

The delivery system is batch-based. Orders are grouped by kitchen + zone into batches, dispatched, and accepted by drivers.

### Batch Lifecycle

```
COLLECTING → READY_FOR_DISPATCH → DISPATCHED → IN_PROGRESS → COMPLETED/PARTIAL_COMPLETE
                                                    ↓
                                                CANCELLED
```

### 5.1 Get Available Batches

`GET /api/delivery/available-batches`

Lists all batches in `READY_FOR_DISPATCH` status waiting for a driver to accept.

**Response:**
```json
{
  "success": true,
  "message": "Available batches retrieved",
  "data": {
    "batches": [
      {
        "_id": "...",
        "batchNumber": "BATCH-20260214-Z1-A3B2C",
        "kitchen": {
          "_id": "...",
          "name": "Kitchen Alpha",
          "address": { "...address object..." }
        },
        "zone": {
          "_id": "...",
          "name": "Zone 1",
          "city": "Delhi"
        },
        "orderCount": 5,
        "mealWindow": "LUNCH",
        "estimatedEarnings": 100
      }
    ]
  }
}
```

> `estimatedEarnings` is a simplified calculation (`orderCount * 20`). This may be refined in future.

### 5.2 Accept Batch

`POST /api/delivery/batches/:batchId/accept`

First driver to accept wins (atomic assignment, prevents race conditions).

**Request Body:** None

**Response (SELF_ACCEPT mode):**
```json
{
  "success": true,
  "message": "Batch accepted",
  "data": {
    "batch": { "...full batch object..." },
    "orders": [
      {
        "_id": "...",
        "orderNumber": "ORD-ABC123",
        "deliveryAddress": { "...address..." },
        "items": [...],
        "status": "READY",
        "userId": "..."
      }
    ],
    "pickupAddress": { "...kitchen address..." },
    "deliveries": [
      {
        "order": { "...order..." },
        "address": { "...delivery address..." },
        "sequence": 1
      }
    ]
  }
}
```

**Response (SMART assignment mode):**
```json
{
  "success": true,
  "message": "Batch accepted",
  "data": {
    "batch": { "...full batch object..." },
    "orders": [...],
    "pickupAddress": { "...kitchen address..." },
    "assignmentMode": "SMART"
  }
}
```

**Side effects:**
- All orders in batch get `driverId` set
- Delivery assignments created for each order
- FCM `BATCH_ASSIGNED` notification sent to driver
- FCM `ORDER_OUT_FOR_DELIVERY` notification sent to each customer

**Errors:**
- `400` — "Batch already taken or not available" (another driver was faster or batch status changed)

### 5.3 Get My Current Batch

`GET /api/delivery/my-batch`

Returns the driver's currently active batch (status `DISPATCHED` or `IN_PROGRESS`).

**Response (active batch):**
```json
{
  "success": true,
  "message": "Current batch retrieved",
  "data": {
    "batch": {
      "_id": "...",
      "batchNumber": "BATCH-20260214-Z1-A3B2C",
      "status": "IN_PROGRESS",
      "kitchenId": {
        "_id": "...",
        "name": "Kitchen Alpha",
        "address": { "..." },
        "phone": "+919..."
      },
      "zoneId": {
        "_id": "...",
        "name": "Zone 1",
        "city": "Delhi"
      },
      "orderIds": ["...", "...", "..."],
      "mealWindow": "LUNCH",
      "pickedUpAt": "2026-02-14T11:30:00.000Z"
    },
    "orders": [
      {
        "_id": "...",
        "orderNumber": "ORD-ABC123",
        "status": "OUT_FOR_DELIVERY",
        "orderSource": "DIRECT",
        "deliveryAddress": { "..." },
        "items": [...],
        "grandTotal": 165,
        "sequenceNumber": 1,
        "assignmentStatus": "EN_ROUTE"
      }
    ],
    "pickupAddress": { "...kitchen address..." },
    "summary": {
      "totalOrders": 5,
      "delivered": 2,
      "pending": 2,
      "failed": 1
    }
  }
}
```

**Response (no active batch):**
```json
{
  "success": true,
  "message": "No active batch",
  "data": {
    "batch": null,
    "orders": [],
    "summary": { "totalOrders": 0, "delivered": 0, "pending": 0, "failed": 0 }
  }
}
```

> **Key fields on each order:** `sequenceNumber` (delivery order in batch) and `assignmentStatus` (driver-side status: ASSIGNED/EN_ROUTE/ARRIVED/DELIVERED/FAILED).

### 5.4 Mark Batch as Picked Up

`PATCH /api/delivery/batches/:batchId/pickup`

Call this when the driver picks up all orders from the kitchen. Transitions batch to `IN_PROGRESS`.

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Batch picked up, driver out for delivery",
  "data": {
    "batch": { "...batch with status IN_PROGRESS, pickedUpAt set..." }
  }
}
```

**Side effects:**
- Batch status: `DISPATCHED` → `IN_PROGRESS`
- All orders: status → `OUT_FOR_DELIVERY`, `pickedUpAt` set
- Status timeline entries added: `PICKED_UP` + `OUT_FOR_DELIVERY`
- All delivery assignments updated to `OUT_FOR_DELIVERY`
- FCM `ORDER_OUT_FOR_DELIVERY` notification sent to each customer

**Constraints:**
- Batch must be in `DISPATCHED` status
- Driver must be assigned to this batch (admins can update any batch)

### 5.5 Update Delivery Sequence

`PATCH /api/delivery/batches/:batchId/sequence`

Driver can reorder the delivery sequence within a batch (if not locked by system optimization).

**Request Body:**
```json
{
  "sequence": [
    { "orderId": "order_id_1", "sequenceNumber": 1 },
    { "orderId": "order_id_2", "sequenceNumber": 2 },
    { "orderId": "order_id_3", "sequenceNumber": 3 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery sequence updated",
  "data": {
    "batch": { "...batch with updated deliverySequence..." }
  }
}
```

**Constraints:**
- Returns `400` if `sequencePolicy` is `LOCKED` (system-optimized route)
- Sequence policies: `DRIVER_CHOICE` (modifiable), `SYSTEM_OPTIMIZED` (modifiable), `LOCKED` (not modifiable)

### 5.6 Complete Batch

`PATCH /api/delivery/batches/:batchId/complete`

Call after all orders have a final status (DELIVERED or FAILED).

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Batch completed",
  "data": {
    "batch": { "...batch with status COMPLETED or PARTIAL_COMPLETE..." },
    "summary": {
      "totalOrders": 5,
      "delivered": 4,
      "failed": 1
    }
  }
}
```

**Completion statuses:**
- `COMPLETED` — All orders delivered successfully
- `PARTIAL_COMPLETE` — Some orders delivered, some failed

**Constraints:**
- Returns `400` "Not all orders have final status" if any order is still ASSIGNED/EN_ROUTE/ARRIVED

> **Note:** The `summary.delivered` and `summary.failed` counts are read from the batch document after calling `updateBatchCounters()`. In rare timing scenarios they may be slightly stale. Use the `updateDeliveryStatus` response's `batchProgress` for the most current counts.

### 5.7 Get Batch History

`GET /api/delivery/batches/driver/history`

Returns all batches ever assigned to this driver (past and current).

**Response:**
```json
{
  "success": true,
  "message": "Driver batch history retrieved",
  "data": {
    "batches": [
      {
        "batchId": "BATCH-20260214-Z1-A3B2C",
        "_id": "...",
        "status": "COMPLETED",
        "date": "2026-02-14T00:00:00.000Z",
        "totalOrders": 5,
        "kitchen": {
          "_id": "...",
          "name": "Kitchen Alpha",
          "address": { "..." }
        },
        "zone": {
          "_id": "...",
          "name": "Zone 1",
          "city": "Delhi"
        },
        "orders": [
          {
            "_id": "...",
            "orderNumber": "ORD-ABC123",
            "status": "DELIVERED",
            "deliveryAddress": { "..." },
            "items": [...],
            "grandTotal": 165,
            "placedAt": "2026-02-14T10:00:00.000Z"
          }
        ],
        "driverAssignedAt": "2026-02-14T11:00:00.000Z",
        "completedAt": "2026-02-14T13:30:00.000Z"
      }
    ],
    "singleOrders": []
  }
}
```

> `singleOrders` contains orders assigned to this driver but NOT part of any batch (ad-hoc assignments). Usually empty.

---

## 6. Individual Order Delivery

### 6.1 Update Delivery Status

`PATCH /api/delivery/orders/:orderId/status`

Updates the delivery status for a specific order within a batch.

**Request Body (EN_ROUTE):**
```json
{
  "status": "EN_ROUTE",
  "notes": "Heading to delivery location"
}
```

**Request Body (ARRIVED):**
```json
{
  "status": "ARRIVED",
  "notes": "At customer's building"
}
```

**Request Body (DELIVERED with OTP):**
```json
{
  "status": "DELIVERED",
  "proofOfDelivery": {
    "type": "OTP",
    "otp": "1234"
  }
}
```

**Request Body (DELIVERED with photo):**
```json
{
  "status": "DELIVERED",
  "proofOfDelivery": {
    "type": "PHOTO",
    "photoUrl": "https://storage.example.com/delivery-proof.jpg"
  }
}
```

**Request Body (FAILED):**
```json
{
  "status": "FAILED",
  "failureReason": "CUSTOMER_UNAVAILABLE",
  "notes": "Called 3 times, no answer"
}
```

### Validation Rules

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | String | Yes | `EN_ROUTE`, `ARRIVED`, `DELIVERED`, `FAILED` |
| `notes` | String | No | Max 200 chars |
| `failureReason` | String | Required if FAILED, **forbidden** otherwise | See failure reasons below |
| `proofOfDelivery` | Object | Required if DELIVERED, optional otherwise | See proof types below |

**Allowed Status Values (driver can set):**

| Status | Meaning | Order Status Mapped To |
|--------|---------|----------------------|
| `EN_ROUTE` | Heading to delivery location | `OUT_FOR_DELIVERY` |
| `ARRIVED` | At delivery location | `OUT_FOR_DELIVERY` (no change) |
| `DELIVERED` | Successfully delivered | `DELIVERED` |
| `FAILED` | Could not deliver | `FAILED` |

> **Note:** `EN_ROUTE` and `ARRIVED` both map to `OUT_FOR_DELIVERY` on the Order. The assignment tracks the granular status while the order status stays at `OUT_FOR_DELIVERY` until final delivery/failure.

**Failure Reasons:**

| Reason | Description |
|--------|-------------|
| `CUSTOMER_UNAVAILABLE` | Customer not at delivery location |
| `WRONG_ADDRESS` | Delivery address is incorrect |
| `CUSTOMER_REFUSED` | Customer refused to accept order |
| `ADDRESS_NOT_FOUND` | Could not find the address |
| `CUSTOMER_UNREACHABLE` | Cannot contact customer |
| `OTHER` | Other reason (provide details in `notes`) |

**Proof of Delivery Types:**

| Type | Required Field | Description |
|------|---------------|-------------|
| `OTP` | `otp` (String) | 4-digit OTP shared with customer |
| `SIGNATURE` | `signatureUrl` (URL) | Digital signature image URL |
| `PHOTO` | `photoUrl` (URL) | Photo of delivered order |

**Response:**
```json
{
  "success": true,
  "message": "Delivery status updated",
  "data": {
    "order": { "...full order object with updated status..." },
    "assignment": { "...full assignment object with updated status..." },
    "batchProgress": {
      "total": 5,
      "delivered": 3,
      "failed": 1
    }
  }
}
```

> **Note:** `batchProgress` contains `total`, `delivered`, and `failed` counts only. Calculate pending as `total - delivered - failed` on the client side.

**Side effects:**
- FCM notification sent to customer for: `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`
- No notification sent for `ARRIVED` status
- Batch auto-completes if all orders reach final status

**Important Validation Notes:**
- `failureReason` is **forbidden** (not just omitted) when status is not `FAILED`. Sending it with any other status will cause a `400` validation error.
- `proofOfDelivery` is **optional** for non-DELIVERED statuses — you can send it, but it won't be required.

**OTP Verification:**
- OTP is pre-generated on the assignment when the batch is created
- Driver enters OTP provided by the customer
- Returns `400` "Invalid OTP" if mismatch
- Returns `400` "OTP was not generated for this delivery" if OTP wasn't set up

---

## 7. GPS Location Tracking

### 7.1 Update Driver Location

`POST /api/delivery/driver/location`

Call this frequently (every 10-30 seconds) while on active delivery to update GPS position.

**Request Body:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "speed": 25.5,
  "heading": 180,
  "accuracy": 10
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `latitude` | Number | Yes | -90 to 90 |
| `longitude` | Number | Yes | -180 to 180 |
| `speed` | Number | No | Speed in km/h |
| `heading` | Number | No | 0-360 degrees |
| `accuracy` | Number | No | GPS accuracy in meters |

**Response:**
```json
{
  "success": true,
  "message": "Location updated",
  "data": {
    "updated": true,
    "user": true,
    "assignment": true,
    "latitude": 28.6139,
    "longitude": 77.2090,
    "timestamp": "2026-02-14T12:00:00.000Z"
  }
}
```

| Response Field | Type | Description |
|---------------|------|-------------|
| `updated` | Boolean | `true` if any update succeeded |
| `user` | Boolean | `true` if driver's User document was updated |
| `assignment` | Boolean | `true` if an active delivery assignment was updated with this location. `false` if no active assignment exists |
| `latitude` | Number | Echo of sent latitude |
| `longitude` | Number | Echo of sent longitude |
| `timestamp` | String | Server timestamp of this update |

> When `assignment` is `true`, ETA recalculation is also triggered (fire-and-forget) for the active batch.

---

## 8. Live Tracking

### 8.1 Get Order Tracking

`GET /api/delivery/orders/:orderId/tracking`

Live tracking data for a specific order. This endpoint uses `adminAuthMiddleware` only (no role restriction), so any authenticated user (customer, driver, admin) can access it.

**Response:**
```json
{
  "success": true,
  "message": "Order tracking retrieved",
  "data": {
    "orderId": "...",
    "orderNumber": "ORD-ABC123",
    "orderStatus": "OUT_FOR_DELIVERY",
    "batchId": "...",
    "batchStatus": "IN_PROGRESS",
    "driver": {
      "driverId": "...",
      "name": "Ravi Kumar",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "locationUpdatedAt": "2026-02-14T12:00:00.000Z"
    },
    "delivery": {
      "status": "EN_ROUTE",
      "distanceRemainingMeters": 2500,
      "etaSeconds": 600,
      "etaStatus": "ON_TIME",
      "lastRecalculatedAt": "2026-02-14T11:59:30.000Z"
    },
    "sequence": {
      "sequenceNumber": 2,
      "totalInBatch": 5,
      "source": "OPTIMIZED"
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `driver` | `null` if driver location not available |
| `delivery.status` | Assignment-level status: `ASSIGNED`, `EN_ROUTE`, `ARRIVED`, `DELIVERED`, `FAILED` |
| `delivery.distanceRemainingMeters` | Straight-line distance × 1.4 road factor. `null` if driver location unavailable |
| `delivery.etaSeconds` | Current ETA in seconds. `null` if not yet calculated |
| `delivery.etaStatus` | `EARLY`, `ON_TIME`, `LATE`, or `CRITICAL`. `null` if not available |
| `sequence` | Order's position in delivery sequence. `null` if no sequence set |
| `sequence.source` | `"OPTIMIZED"` (route optimizer) or `"MANUAL"` (driver/manual sequence) |

### 8.2 Get Batch Tracking

`GET /api/delivery/batches/:batchId/tracking`

Live tracking for the entire batch — shows all orders with their delivery status, distance, ETA, and sequence.

**Response:**
```json
{
  "success": true,
  "message": "Batch tracking retrieved",
  "data": {
    "batchId": "...",
    "batchNumber": "BATCH-20260214-Z1-A3B2C",
    "batchStatus": "IN_PROGRESS",
    "kitchenId": "...",
    "driver": {
      "driverId": "...",
      "name": "Ravi Kumar",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "updatedAt": "2026-02-14T12:00:00.000Z",
      "driverStatus": "ON_DELIVERY"
    },
    "routeOptimization": {
      "algorithm": "TWO_OPT",
      "totalDistanceMeters": 12500,
      "totalDurationSeconds": 1800,
      "improvementPercent": 18.5
    },
    "totalOrders": 5,
    "deliveredCount": 2,
    "failedCount": 1,
    "deliveries": [
      {
        "orderId": "...",
        "orderNumber": "ORD-ABC123",
        "orderStatus": "OUT_FOR_DELIVERY",
        "deliveryStatus": "EN_ROUTE",
        "coordinates": {
          "latitude": 28.6200,
          "longitude": 77.2100
        },
        "distanceFromDriverMeters": 1200,
        "etaSeconds": 300,
        "etaStatus": "ON_TIME",
        "sequence": {
          "sequenceNumber": 1,
          "totalInBatch": 5,
          "source": "OPTIMIZED"
        }
      }
    ]
  }
}
```

| Field | Description |
|-------|-------------|
| `driver` | `null` if driver location not available |
| `routeOptimization` | `null` if route was not optimized |
| `deliveries[].orderStatus` | Order-level status (`OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`) |
| `deliveries[].deliveryStatus` | Assignment-level status (`ASSIGNED`, `EN_ROUTE`, `ARRIVED`, `DELIVERED`, `FAILED`) |
| `deliveries[].coordinates` | Delivery address coordinates from the order. `null` if not set |
| `deliveries[].distanceFromDriverMeters` | Distance from driver to this delivery point. `null` if driver location unavailable |
| `deliveries[].sequence` | `null` if no delivery sequence has been set |

---

## 9. New `orderSource` Field

### What Changed

Orders now have an `orderSource` field indicating how they were created:

```
orderSource: "DIRECT" | "SCHEDULED" | "AUTO_ORDER"
```

- `DIRECT` — Customer placed order manually for same-day delivery
- `SCHEDULED` — Customer scheduled order for a future date (promoted to PLACED before dispatch)
- `AUTO_ORDER` — System created order from auto-ordering subscription

### Legacy Compatibility

The order schema auto-syncs `orderSource` with legacy boolean flags:

| `orderSource` | `isAutoOrder` | `isScheduledMeal` |
|---------------|--------------|-------------------|
| `DIRECT` | `false` | `false` |
| `SCHEDULED` | `false` | `true` |
| `AUTO_ORDER` | `true` | `false` |

Both fields are present in all API responses. **Prefer `orderSource`** going forward.

### Display Recommendations

| `orderSource` | Badge | Color |
|---------------|-------|-------|
| `DIRECT` | "Direct" | Default/Gray |
| `SCHEDULED` | "Scheduled" | Blue |
| `AUTO_ORDER` | "Auto" | Purple |

> **Driver impact:** The driver sees the `orderSource` on each order within a batch. This is informational only — the delivery process is identical regardless of order source.

---

## 10. FCM Notifications

### Notifications the Driver Receives

| Type | Title | When |
|------|-------|------|
| `BATCH_READY` | "New Batch Available!" | Batch dispatched and waiting for driver acceptance |
| `BATCH_ASSIGNED` | "Batch Assigned" | Batch assigned to this driver (auto-assignment mode) |
| `BATCH_CANCELLED` | "Batch Cancelled" | Admin cancelled a batch assigned to this driver |
| `BATCH_UPDATED` | "Batch Updated" | Batch details changed (orders added/removed) |
| `BATCH_OPTIMIZED` | "Optimized Route Available" | Route optimization completed for assigned batch |
| `ORDER_READY_FOR_PICKUP` | "Orders Ready!" | Kitchen marked orders as ready |

### FCM Data Payload

Notifications include a `data` object for deep linking:

```json
{
  "data": {
    "batchId": "batch_object_id",
    "batchNumber": "BATCH-20260214-Z1-A3B2C",
    "orderCount": "5",
    "kitchenId": "kitchen_object_id"
  }
}
```

> All values in the `data` payload are strings (Firebase requirement).

---

## 11. Error Handling Reference

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description here",
  "data": null
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Validation error / Bad request / Invalid state transition |
| 401 | Unauthorized (invalid/missing Firebase token) |
| 403 | Forbidden (wrong role, not assigned to batch/order, not approved) |
| 404 | Resource not found (driver/batch/order) |
| 500 | Server error |

### Common Driver-Specific Errors

| Error | Status | When |
|-------|--------|------|
| "Driver not approved. Cannot change status." | 403 | Trying to change status before admin approval |
| "Driver not approved. Cannot manage shift." | 403 | Trying to start/end shift before admin approval |
| "Must start shift before going AVAILABLE" | 400 | Setting AVAILABLE without active shift |
| "Cannot transition from X to Y. Allowed: A, B" | 400 | Invalid status transition (includes allowed targets) |
| "Shift already active" | 400 | Starting shift when already on shift |
| "No active shift to end" | 400 | Ending shift when no shift is active |
| "Cannot end shift while on active delivery" | 400 | Ending shift with ON_DELIVERY status |
| "Batch already taken or not available" | 400 | Another driver accepted the batch first |
| "Not assigned to this batch" | 403 | Operating on a batch assigned to another driver |
| "Batch must be in DISPATCHED status" | 400 | Trying to pick up a batch not yet dispatched |
| "Not all orders have final status" | 400 | Completing batch with pending orders |
| "Sequence is locked for this batch" | 400 | Reordering a system-optimized locked route |
| "Invalid OTP" | 400 | Wrong OTP entered for proof of delivery |
| "OTP was not generated for this delivery" | 400 | Trying OTP verification without OTP setup |
| "Not assigned to this order" | 403 | Updating delivery status for unassigned order |

---

## Quick Reference: All Driver Routes

### `/api/driver/` (Driver Profile Module)

```
GET    /profile                               Get profile + stats
PUT    /profile                               Update profile (name, email, image)
PATCH  /vehicle                               Update vehicle details
PATCH  /profile/image                         Update profile image only
POST   /documents/request                     Request document update (admin review)
GET    /stats                                 Get delivery statistics
PATCH  /status                                Update availability status
PATCH  /shift                                 Start or end shift
```

### `/api/delivery/` (Delivery Module - Driver Routes)

```
GET    /available-batches                     List batches waiting for pickup
GET    /batches/driver/history                Driver's batch history
GET    /my-batch                              Get current active batch
POST   /batches/:batchId/accept              Accept a batch (first wins)
PATCH  /batches/:batchId/pickup              Mark batch as picked up
PATCH  /batches/:batchId/complete            Complete batch
PATCH  /batches/:batchId/sequence            Reorder delivery sequence
PATCH  /orders/:orderId/status               Update individual delivery status
POST   /driver/location                       Update GPS location
GET    /orders/:orderId/tracking             Live tracking for order
GET    /batches/:batchId/tracking            Live tracking for batch
```