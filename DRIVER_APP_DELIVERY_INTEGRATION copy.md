# Driver App — Delivery & Navigation Integration

> **Give this entire file to the Driver App's Claude as context.**
> This is a self-contained integration guide. No other files needed.

## Overview

Drivers pick up food batches from kitchens and deliver them to customers. The driver app needs to:

1. **Browse** available batches and accept one
2. **Navigate** the delivery route (pickup → deliveries in sequence)
3. **Update** delivery status for each order (EN_ROUTE, ARRIVED, DELIVERED, FAILED)
4. **Report** GPS location in the background for live tracking
5. **Complete** the batch when all orders are delivered/failed
6. **View** delivery history

**Base URL:** Your API base (e.g., `https://api.tiffsy.com`)
**Auth:** All endpoints require admin JWT token in `Authorization: Bearer <token>` header. The logged-in user must have role `DRIVER`.
**All delivery endpoints are under:** `/api/delivery/...`

---

## SCREEN 1: Available Batches (Browse & Accept)

**Location:** Home screen when driver has no active batch

### List Available Batches

**Endpoint:** `GET /api/delivery/available-batches`

No query params needed. Returns all `READY_FOR_DISPATCH` batches.

### Response

```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "_id": "batch_id",
        "batchNumber": "BATCH-20260214-L-KIT1-Z2-001",
        "kitchen": {
          "_id": "kitchen_id",
          "name": "Sunrise Kitchen",
          "address": "123 Main St, Koramangala"
        },
        "zone": {
          "_id": "zone_id",
          "name": "Koramangala",
          "city": "Bangalore"
        },
        "orderCount": 5,
        "mealWindow": "LUNCH",
        "estimatedEarnings": 100
      }
    ]
  }
}
```

### UI Layout

```
Available Batches
═════════════════

Pull to refresh

┌──────────────────────────────────────────────┐
│ 🍱 LUNCH • 5 orders • ₹100 est.             │
│ Sunrise Kitchen → Koramangala                │
│                                              │
│                            [Accept Batch →]  │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ 🍱 LUNCH • 3 orders • ₹60 est.              │
│ Royal Kitchen → Indiranagar                  │
│                                              │
│                            [Accept Batch →]  │
└──────────────────────────────────────────────┘

No batches? Show: "No batches available. Check back soon!"
```

**Poll every 30 seconds** or use pull-to-refresh.

---

## SCREEN 2: Accept Batch

**Endpoint:** `POST /api/delivery/batches/:batchId/accept`

No request body needed.

### Response (Success — Standard Mode)

```json
{
  "success": true,
  "message": "Batch accepted",
  "data": {
    "batch": {
      "_id": "batch_id",
      "batchNumber": "BATCH-20260214-L-KIT1-Z2-001",
      "status": "DISPATCHED",
      "kitchenId": "kitchen_id",
      "orderIds": ["order1", "order2", "order3"],
      "mealWindow": "LUNCH"
    },
    "orders": [
      {
        "_id": "order_id",
        "orderNumber": "T-1234",
        "status": "READY",
        "deliveryAddress": {
          "addressLine1": "123 Main St",
          "landmark": "Near Park",
          "locality": "Koramangala 4th Block",
          "city": "Bangalore",
          "pincode": "560034",
          "contactName": "Rahul S.",
          "contactPhone": "9876543210",
          "coordinates": { "latitude": 12.9352, "longitude": 77.6245 }
        },
        "items": [{ "name": "Lunch Thali", "quantity": 1 }]
      }
    ],
    "pickupAddress": "456 Kitchen Lane, HSR Layout",
    "deliveries": [
      {
        "order": { /* order object */ },
        "address": { /* deliveryAddress */ },
        "sequence": 1
      }
    ]
  }
}
```

**Note:** When Smart Driver Assignment is enabled on the backend, the response shape differs slightly — no `deliveries` array, but includes `assignmentMode: "SMART"`. The `batch`, `orders`, and `pickupAddress` fields are the same in both modes. Use `GET /my-batch` after accepting for the canonical batch view with sequence numbers.

### Error: Batch Already Taken

```json
{
  "success": false,
  "message": "Batch already taken or not available"
}
```

**UI Flow:**
```
[Accept Batch] tapped
  ↓
Call API
  ↓
If success → Navigate to Active Batch screen
If error (already taken) → Show toast "Batch already taken" → Refresh list
```

**Race condition note:** Multiple drivers can try to accept the same batch. The backend uses atomic assignment — only the first driver gets it. Handle the 400 error gracefully.

---

## SCREEN 3: Active Batch (Main Delivery Screen)

**Location:** Main screen when driver has an active batch

### Get My Current Batch

**Endpoint:** `GET /api/delivery/my-batch`

### Response

```json
{
  "success": true,
  "data": {
    "batch": {
      "_id": "batch_id",
      "batchNumber": "BATCH-20260214-L-KIT1-Z2-001",
      "status": "DISPATCHED",
      "mealWindow": "LUNCH",
      "kitchenId": {
        "_id": "kitchen_id",
        "name": "Sunrise Kitchen",
        "address": "456 Kitchen Lane, HSR Layout",
        "phone": "9876543210"
      },
      "zoneId": { "_id": "zone_id", "name": "Koramangala", "city": "Bangalore" },
      "orderIds": ["order1", "order2", "order3"],
      "routeOptimization": {
        "algorithm": "TWO_OPT",
        "totalDistanceMeters": 4200,
        "totalDurationSeconds": 1680
      },
      "optimizedSequence": [
        {
          "orderId": "order1",
          "sequenceNumber": 1,
          "estimatedArrival": "2026-02-14T07:42:00.000Z",
          "distanceFromPrevMeters": 1200,
          "coordinates": { "latitude": 12.9352, "longitude": 77.6245 }
        }
      ],
      "driverAssignedAt": "2026-02-14T07:21:00.000Z",
      "pickedUpAt": null,
      "totalDelivered": 0,
      "totalFailed": 0
    },
    "orders": [
      {
        "_id": "order_id",
        "orderNumber": "T-1234",
        "status": "READY",
        "deliveryAddress": {
          "addressLine1": "123 Main St",
          "contactName": "Rahul S.",
          "contactPhone": "9876543210",
          "coordinates": { "latitude": 12.9352, "longitude": 77.6245 }
        },
        "items": [{ "name": "Lunch Thali", "quantity": 1 }],
        "sequenceNumber": 1,
        "assignmentStatus": "ASSIGNED"
      }
    ],
    "pickupAddress": "456 Kitchen Lane, HSR Layout",
    "summary": {
      "totalOrders": 3,
      "delivered": 0,
      "pending": 3,
      "failed": 0
    }
  }
}
```

**When `batch` is `null`:** No active batch — show the Available Batches screen instead.

### UI Layout

```
Active Batch
════════════

BATCH-...-L-Z2-001 • LUNCH • DISPATCHED
Sunrise Kitchen (9876543210)

── Summary ──
Total: 3  |  Delivered: 0  |  Pending: 3  |  Failed: 0

── Step 1: Pick Up ──
[📍 Navigate to Kitchen]   ← Opens Google Maps / in-app map
Kitchen: Sunrise Kitchen
456 Kitchen Lane, HSR Layout

[✅ Confirm Pickup]        ← Calls PATCH /batches/:batchId/pickup

── Step 2: Deliveries ──
1. Rahul S. — T-1234      [ASSIGNED]
   123 Main St, Koramangala
   Lunch Thali × 1
   [📍 Navigate] [📞 Call] [Update Status ▼]

2. Priya M. — T-1235      [ASSIGNED]
   456 Oak Ave, Koramangala
   Lunch Thali × 2
   [📍 Navigate] [📞 Call] [Update Status ▼]

3. Amit K. — T-1236       [ASSIGNED]
   789 Elm Rd, Koramangala
   Lunch Thali × 1
   [📍 Navigate] [📞 Call] [Update Status ▼]
```

**Navigation:** Use `Linking.openURL` with Google Maps deep link:
```
google.navigation:q=${latitude},${longitude}
```
Or use `react-native-maps` for in-app navigation view.

---

## ACTION: Confirm Pickup

Marks the batch as picked up. Batch moves from `DISPATCHED` → `IN_PROGRESS`.

**Endpoint:** `PATCH /api/delivery/batches/:batchId/pickup`

No request body needed.

### Response

```json
{
  "success": true,
  "message": "Batch picked up, driver out for delivery",
  "data": {
    "batch": { /* updated batch with status: "IN_PROGRESS", pickedUpAt: "..." */ }
  }
}
```

### Error: Wrong Status

```json
{
  "success": false,
  "message": "Batch must be in DISPATCHED status"
}
```

**After pickup:** All orders in the batch automatically move to `OUT_FOR_DELIVERY` status. Customers get push notifications.

---

## ACTION: Update Delivery Status (Per Order)

Driver updates each order's delivery status as they deliver.

**Endpoint:** `PATCH /api/delivery/orders/:orderId/status`

### Request Body

```json
{
  "status": "DELIVERED",
  "proofOfDelivery": {
    "type": "OTP",
    "otp": "1234"
  }
}
```

### Valid Status Values

| Status | When | Required Fields |
|--------|------|-----------------|
| `EN_ROUTE` | Driver heading to this delivery | — |
| `ARRIVED` | Driver arrived at customer location | — |
| `DELIVERED` | Order handed to customer | `proofOfDelivery` (required) |
| `FAILED` | Could not deliver | `failureReason` (required) |

### Proof of Delivery (for DELIVERED)

```json
// OTP verification (most common)
{
  "proofOfDelivery": {
    "type": "OTP",
    "otp": "1234"
  }
}

// Photo proof
{
  "proofOfDelivery": {
    "type": "PHOTO",
    "photoUrl": "https://storage.example.com/proof/photo123.jpg"
  }
}

// Signature proof
{
  "proofOfDelivery": {
    "type": "SIGNATURE",
    "signatureUrl": "https://storage.example.com/proof/sig123.png"
  }
}
```

### Failure Reasons (for FAILED)

```json
{
  "status": "FAILED",
  "failureReason": "CUSTOMER_UNAVAILABLE",
  "notes": "Called 3 times, no answer"
}
```

Valid `failureReason` values:
- `CUSTOMER_UNAVAILABLE`
- `WRONG_ADDRESS`
- `CUSTOMER_REFUSED`
- `ADDRESS_NOT_FOUND`
- `CUSTOMER_UNREACHABLE`
- `OTHER`

### Response

```json
{
  "success": true,
  "data": {
    "order": { /* updated order */ },
    "assignment": { /* updated assignment */ },
    "batchProgress": {
      "total": 5,
      "delivered": 3,
      "failed": 0
    }
  }
}
```

### Error: Invalid OTP

```json
{
  "success": false,
  "message": "Invalid OTP. Please enter the correct OTP to confirm delivery."
}
```

### UI Flow for Each Delivery

```
Order Card: Rahul S. — T-1234

[EN_ROUTE] → Driver taps "I'm heading here"
   ↓ Navigate to address
[ARRIVED] → Driver taps "I've arrived"
   ↓ Customer comes out
[DELIVERED] → Enter OTP from customer → Submit
   ↓
✅ Order complete, move to next

── OR ──

[FAILED] → Select reason → Add optional notes → Submit
   ↓
❌ Order failed, move to next
```

---

## ACTION: Update Delivery Sequence

Driver can reorder their delivery stops (unless sequence is locked by backend).

**Endpoint:** `PATCH /api/delivery/batches/:batchId/sequence`

### Request Body

```json
{
  "sequence": [
    { "orderId": "order_id_1", "sequenceNumber": 1 },
    { "orderId": "order_id_2", "sequenceNumber": 2 },
    { "orderId": "order_id_3", "sequenceNumber": 3 }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": { "batch": { /* updated batch */ } }
}
```

### Error: Locked Sequence

```json
{
  "success": false,
  "message": "Sequence is locked for this batch"
}
```

**UI:** Drag-and-drop reordering of delivery stops. Call API after user confirms new order.

---

## ACTION: Complete Batch

After all orders have been delivered or failed, driver completes the batch.

**Endpoint:** `PATCH /api/delivery/batches/:batchId/complete`

No request body needed.

### Response

```json
{
  "success": true,
  "data": {
    "batch": { /* status: "COMPLETED" or "PARTIAL_COMPLETE" */ },
    "summary": {
      "totalOrders": 5,
      "delivered": 4,
      "failed": 1
    }
  }
}
```

### Error: Not All Orders Done

```json
{
  "success": false,
  "message": "Not all orders have final status"
}
```

**Batch completion statuses:**
- `COMPLETED` — all orders delivered successfully
- `PARTIAL_COMPLETE` — some delivered, some failed

**UI:** Show "Complete Batch" button when `summary.pending === 0`. Show completion summary after.

---

## BACKGROUND: GPS Location Updates

The driver app must send GPS location updates in the background while on an active delivery.

**Endpoint:** `POST /api/delivery/driver/location`

### Request Body

```json
{
  "latitude": 12.9352,
  "longitude": 77.6245,
  "speed": 25.5,
  "heading": 180,
  "accuracy": 10
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `latitude` | number | **Yes** | GPS latitude (-90 to 90) |
| `longitude` | number | **Yes** | GPS longitude (-180 to 180) |
| `speed` | number | No | Speed in m/s |
| `heading` | number | No | Direction (0-360 degrees) |
| `accuracy` | number | No | GPS accuracy in meters |

### Response

```json
{
  "success": true,
  "data": {
    "updated": true,
    "user": true,
    "assignment": true,
    "latitude": 12.9352,
    "longitude": 77.6245,
    "timestamp": "2026-02-14T07:42:00.000Z"
  }
}
```

### Implementation Notes

- **Frequency:** Send every 10-15 seconds while batch is active (`DISPATCHED` or `IN_PROGRESS`).
- **Background mode:** Use `react-native-background-geolocation` or similar library.
- **Battery:** Only track when there's an active batch. Stop tracking after batch completion.
- **Failure:** Fire-and-forget pattern — don't retry failed location updates. The next ping will succeed.
- **When to start:** After accepting a batch (`POST /batches/:batchId/accept`).
- **When to stop:** After completing the batch (`PATCH /batches/:batchId/complete`).

---

## SCREEN 4: Live Tracking View (Driver's Own Batch)

**Endpoint:** `GET /api/delivery/batches/:batchId/tracking`

**Poll every 15 seconds** to refresh ETA and distances.

### Response

```json
{
  "success": true,
  "data": {
    "batchId": "batch_id",
    "batchNumber": "BATCH-20260214-L-KIT1-Z2-001",
    "batchStatus": "IN_PROGRESS",
    "kitchenId": "kitchen_id",
    "driver": {
      "driverId": "driver_id",
      "name": "Rajesh K.",
      "latitude": 12.9352,
      "longitude": 77.6245,
      "updatedAt": "2026-02-14T07:42:00.000Z",
      "driverStatus": "ON_DELIVERY"
    },
    "routeOptimization": {
      "algorithm": "TWO_OPT",
      "totalDistanceMeters": 4200,
      "totalDurationSeconds": 1680,
      "improvementPercent": 23.5,
      "optimizedAt": "2026-02-14T07:15:00.000Z"
    },
    "totalOrders": 5,
    "deliveredCount": 2,
    "failedCount": 0,
    "deliveries": [
      {
        "orderId": "order_id",
        "orderNumber": "T-1234",
        "orderStatus": "DELIVERED",
        "deliveryStatus": "DELIVERED",
        "coordinates": { "latitude": 12.9352, "longitude": 77.6245 },
        "distanceFromDriverMeters": 0,
        "etaSeconds": 0,
        "etaStatus": "ON_TIME",
        "sequence": {
          "sequenceNumber": 1,
          "totalInBatch": 5,
          "source": "OPTIMIZED"
        }
      },
      {
        "orderId": "order_id_2",
        "orderNumber": "T-1235",
        "orderStatus": "OUT_FOR_DELIVERY",
        "deliveryStatus": "EN_ROUTE",
        "coordinates": { "latitude": 12.9380, "longitude": 77.6260 },
        "distanceFromDriverMeters": 850,
        "etaSeconds": 340,
        "etaStatus": "ON_TIME",
        "sequence": {
          "sequenceNumber": 2,
          "totalInBatch": 5,
          "source": "OPTIMIZED"
        }
      }
    ]
  }
}
```

**UI:** Map with driver's current position, remaining delivery stops, and route line. Or a simple list showing next stop with ETA.

---

## SCREEN 5: Delivery History

**Endpoint:** `GET /api/delivery/batches/driver/history`

### Response

```json
{
  "success": true,
  "data": {
    "batches": [
      {
        "batchId": "BATCH-20260214-L-KIT1-Z2-001",
        "_id": "batch_mongo_id",
        "status": "COMPLETED",
        "date": "2026-02-14T00:00:00.000Z",
        "totalOrders": 5,
        "kitchen": { "_id": "kitchen_id", "name": "Sunrise Kitchen", "address": "..." },
        "zone": { "_id": "zone_id", "name": "Koramangala", "city": "Bangalore" },
        "orders": [
          {
            "_id": "order_id",
            "orderNumber": "T-1234",
            "status": "DELIVERED",
            "deliveryAddress": { "addressLine1": "123 Main St", "contactName": "Rahul S." },
            "items": [{ "name": "Lunch Thali", "quantity": 1 }],
            "grandTotal": 150,
            "placedAt": "2026-02-14T05:00:00.000Z"
          }
        ],
        "driverAssignedAt": "2026-02-14T07:21:00.000Z",
        "completedAt": "2026-02-14T08:15:00.000Z"
      }
    ],
    "singleOrders": []
  }
}
```

### UI Layout

```
Delivery History
════════════════

Today — Feb 14, 2026
┌──────────────────────────────────────────────┐
│ LUNCH • 5 orders • Sunrise Kitchen           │
│ Koramangala • COMPLETED ✅                    │
│ Assigned: 1:21 PM → Completed: 2:15 PM      │
│                                              │
│ Delivered: 5  Failed: 0                      │
│                                    [View →]  │
└──────────────────────────────────────────────┘

Yesterday — Feb 13, 2026
┌──────────────────────────────────────────────┐
│ DINNER • 3 orders • Royal Kitchen            │
│ Indiranagar • PARTIAL_COMPLETE ⚠️             │
│ Delivered: 2  Failed: 1                      │
│                                    [View →]  │
└──────────────────────────────────────────────┘
```

---

## NOTIFICATIONS (Push — Incoming to Driver App)

| Notification Type | When | Action on Tap |
|-------------------|------|---------------|
| `BATCH_READY` | New batches available for pickup | Navigate to Available Batches |
| `BATCH_ASSIGNED` | Batch assigned to this driver (AUTO_ASSIGNMENT mode) | Navigate to Active Batch |
| `BATCH_CANCELLED` | Admin cancelled the driver's batch | Show alert, navigate to Available Batches |
| `BATCH_REASSIGNED` | Batch reassigned to different driver | Show alert, navigate to Available Batches |

---

## WORKFLOW: Full Delivery Flow

```
1. Driver opens app → Checks for active batch (GET /my-batch)
   ↓
   If batch exists → Go to Active Batch screen
   If no batch → Go to Available Batches screen
   ↓
2. Driver browses available batches (GET /available-batches)
   ↓
3. Driver accepts a batch (POST /batches/:batchId/accept)
   ↓ Start GPS tracking
4. Driver navigates to kitchen → Picks up food
   ↓
5. Driver confirms pickup (PATCH /batches/:batchId/pickup)
   ↓ Batch → IN_PROGRESS, Orders → OUT_FOR_DELIVERY
6. For each delivery stop (in sequence):
   a. Driver navigates to customer address
   b. Update status: EN_ROUTE (PATCH /orders/:orderId/status)
   c. Arrive at location
   d. Update status: ARRIVED
   e. Hand over food:
      - Success: DELIVERED + OTP/Photo/Signature proof
      - Failure: FAILED + reason
   ↓
7. All orders done → Complete batch (PATCH /batches/:batchId/complete)
   ↓ Stop GPS tracking
8. Show summary → Back to Available Batches
```

---

## ALL DRIVER ENDPOINTS REFERENCE

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/delivery/available-batches` | List batches available to accept |
| `POST` | `/api/delivery/batches/:batchId/accept` | Accept a batch |
| `GET` | `/api/delivery/my-batch` | Get current active batch with orders |
| `PATCH` | `/api/delivery/batches/:batchId/pickup` | Confirm batch pickup from kitchen |
| `PATCH` | `/api/delivery/orders/:orderId/status` | Update individual delivery status |
| `PATCH` | `/api/delivery/batches/:batchId/sequence` | Reorder delivery stops |
| `PATCH` | `/api/delivery/batches/:batchId/complete` | Complete the batch |
| `POST` | `/api/delivery/driver/location` | Send GPS location (background) |
| `GET` | `/api/delivery/batches/:batchId/tracking` | Live tracking data (ETAs, distances) |
| `GET` | `/api/delivery/batches/driver/history` | Delivery history |
| `GET` | `/api/delivery/batches/:batchId` | Get batch detail |

---

## IMPLEMENTATION ORDER

| Priority | Feature | Effort |
|----------|---------|--------|
| 1 | Available Batches + Accept (Screens 1-2) | Medium (list + accept + race condition handling) |
| 2 | Active Batch + Pickup (Screen 3) | Medium (batch detail + pickup action) |
| 3 | Update Delivery Status per order | Medium (status flow + OTP input + failure reasons) |
| 4 | Complete Batch | Low (button + summary) |
| 5 | GPS Location Background Tracking | Medium (background service + battery management) |
| 6 | Navigation Integration (Google Maps) | Low (deep link to Google Maps) |
| 7 | Live Tracking View (Screen 4) | Medium (map + polling) |
| 8 | Delivery History (Screen 5) | Low (list view) |
| 9 | Reorder Delivery Sequence | Low (drag-and-drop) |
