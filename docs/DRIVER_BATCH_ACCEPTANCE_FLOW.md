# Driver Batch Acceptance Flow - Frontend Implementation Guide

## 📋 Table of Contents
1. [Flow Overview](#flow-overview)
2. [API Integration](#api-integration)
3. [Implementation Details](#implementation-details)
4. [Error Handling](#error-handling)
5. [Testing Guide](#testing-guide)

---

## 🔄 Flow Overview

### Complete Driver Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Driver Opens Deliveries Screen                               │
│    GET /api/delivery/available-batches                          │
│    GET /api/delivery/my-batch                                   │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Driver Sees Available Batches                                │
│    • Bell icon shows badge with count (e.g., "3")              │
│    • "View 3 Available Batches" button visible                 │
│    • Both trigger AvailableBatchesModal                         │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Driver Views Batch Details in Modal                          │
│    Each batch shows:                                             │
│    • Batch Number (e.g., BATCH-20260115-Z1-ABC12)              │
│    • Kitchen Name & Address                                      │
│    • Zone Name                                                   │
│    • Order Count (e.g., 12 orders)                             │
│    • Meal Window (LUNCH/DINNER)                                 │
│    • Estimated Earnings (₹240)                                  │
│    Actions:                                                      │
│    • [Not Interested] - Skip this batch                        │
│    • [Accept] - Accept batch (First-Come-First-Served)         │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4A. Driver Clicks "Not Interested"                              │
│    • Batch hidden from current view (session only)              │
│    • Driver can still see other batches                         │
│    • No API call made (implicit rejection)                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 4B. Driver Clicks "Accept"                                       │
│    Confirmation Dialog Shows:                                    │
│    ┌──────────────────────────────────────────────┐            │
│    │ 🎯 Accept Batch                              │            │
│    │                                               │            │
│    │ BATCH-20260115-Z1-ABC12                      │            │
│    │                                               │            │
│    │ 📦 Orders: 12                                │            │
│    │ 💰 Estimated Earnings: ₹240                  │            │
│    │ 🍽️ Meal Window: LUNCH                        │            │
│    │ 📍 Zone: Andheri West                        │            │
│    │                                               │            │
│    │ Accept this batch and head to                │            │
│    │ Main Kitchen Central?                        │            │
│    │                                               │            │
│    │ [Cancel]        [Accept Batch]               │            │
│    └──────────────────────────────────────────────┘            │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. API Call: POST /api/delivery/batches/:batchId/accept        │
│    🔒 ATOMIC OPERATION (First-Come-First-Served)                │
│                                                                  │
│    Backend Logic:                                                │
│    DeliveryBatch.findOneAndUpdate({                             │
│      _id: batchId,                                              │
│      status: "READY_FOR_DISPATCH",                             │
│      driverId: null  ← MUST be unassigned                       │
│    })                                                            │
│                                                                  │
│    ✅ SUCCESS: Only ONE driver succeeds                         │
│    • Batch assigned to driver                                   │
│    • Status: READY_FOR_DISPATCH → DISPATCHED                   │
│    • OTPs generated for each delivery                           │
│                                                                  │
│    ❌ FAILURE: Other drivers get rejection                      │
│    • "Batch already taken" error                                │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6A. Success Response                                             │
│    ┌──────────────────────────────────────────────┐            │
│    │ ✅ Batch Accepted!                           │            │
│    │                                               │            │
│    │ BATCH-20260115-Z1-ABC12 has been             │            │
│    │ assigned to you.                             │            │
│    │                                               │            │
│    │ Head to Main Kitchen Central to pick up      │            │
│    │ 12 orders.                                    │            │
│    │                                               │            │
│    │ [Start Delivery]                              │            │
│    └──────────────────────────────────────────────┘            │
│                                                                  │
│    Actions Performed:                                            │
│    • Modal closed                                                │
│    • Data refreshed (current batch + available batches)         │
│    • Batch auto-expanded in deliveries list                     │
│    • Driver sees all orders in the batch                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 6B. Already Taken Response                                       │
│    ┌──────────────────────────────────────────────┐            │
│    │ ⚠️ Batch Already Taken                       │            │
│    │                                               │            │
│    │ Another driver has already accepted this     │            │
│    │ batch. Please check other available          │            │
│    │ batches.                                      │            │
│    │                                               │            │
│    │ [OK]                                          │            │
│    └──────────────────────────────────────────────┘            │
│                                                                  │
│    • Modal stays open                                            │
│    • Driver can try other batches                               │
│    • Batch removed from driver's view                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 7. Driver Views Accepted Batch                                  │
│    Screen shows:                                                 │
│    • Batch details (kitchen, zone, status)                      │
│    • All orders in the batch                                     │
│    • Delivery sequence                                           │
│    • Action buttons:                                             │
│      - [Pickup from Kitchen] (if DISPATCHED)                    │
│      - [Continue Deliveries] (if IN_PROGRESS)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Integration

### 1. Get Available Batches

**Endpoint:** `GET /api/delivery/available-batches`

**When Called:**
- Screen loads (initial load)
- Screen comes into focus (useFocusEffect)
- Pull-to-refresh triggered
- After accepting/rejecting a batch

**Implementation:**
```typescript
// src/services/deliveryService.ts

export const getAvailableBatches = async (): Promise<ApiResponse<{ batches: AvailableBatch[] }>> => {
  const headers = await createHeaders();

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AVAILABLE_BATCHES}`,
    {
      method: 'GET',
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to get available batches');
  }

  return data;
};
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Available batches retrieved",
  "data": {
    "batches": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "batchNumber": "BATCH-20260115-Z1-ABC12",
        "kitchen": {
          "_id": "507f...",
          "name": "Main Kitchen Central",
          "address": {
            "street": "123 Kitchen Street",
            "area": "Andheri West",
            "city": "Mumbai",
            "pincode": "400001"
          }
        },
        "zone": {
          "_id": "507f...",
          "name": "Andheri West",
          "city": "Mumbai"
        },
        "orderCount": 12,
        "mealWindow": "LUNCH",
        "estimatedEarnings": 240
      }
    ]
  },
  "error": null
}
```

### 2. Accept Batch (Atomic Operation)

**Endpoint:** `POST /api/delivery/batches/:batchId/accept`

**When Called:**
- Driver confirms batch acceptance in dialog

**Implementation:**
```typescript
// src/services/deliveryService.ts

export const acceptBatch = async (batchId: string): Promise<ApiResponse<BatchAcceptData>> => {
  const headers = await createHeaders();

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCEPT_BATCH(batchId)}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to accept batch');
  }

  return data;
};
```

**Success Response:**
```json
{
  "success": true,
  "message": "Batch accepted",
  "data": {
    "batch": {
      "_id": "507f1f77bcf86cd799439011",
      "batchNumber": "BATCH-20260115-Z1-ABC12",
      "status": "DISPATCHED",
      "driverId": "507f1f77bcf86cd799439015",
      "kitchenId": { /* kitchen object */ },
      "orderIds": ["507f...", "507f..."],
      "mealWindow": "LUNCH"
    },
    "orders": [
      {
        "_id": "507f...",
        "orderNumber": "ORD-20260115-ABC12",
        "status": "READY",
        "deliveryAddress": { /* address */ },
        "items": [ /* order items */ ],
        "sequenceNumber": 1
      }
    ],
    "pickupAddress": { /* kitchen address */ },
    "deliveries": [
      {
        "order": { /* full order */ },
        "address": { /* delivery address */ },
        "sequence": 1
      }
    ]
  },
  "error": null
}
```

**Failure Response (Already Taken):**
```json
{
  "success": false,
  "message": "Batch already taken or not available",
  "data": null,
  "error": null
}
```

### 3. Get Current Batch

**Endpoint:** `GET /api/delivery/my-batch`

**When Called:**
- After accepting a batch (to refresh)
- Screen loads
- Pull-to-refresh

**Response:**
```json
{
  "success": true,
  "message": "Current batch retrieved",
  "data": {
    "batch": {
      "_id": "507f...",
      "batchNumber": "BATCH-20260115-Z1-ABC12",
      "status": "DISPATCHED",
      "kitchenId": { /* kitchen object */ }
    },
    "orders": [ /* array of orders */ ],
    "summary": {
      "totalOrders": 12,
      "delivered": 0,
      "pending": 12,
      "failed": 0
    }
  },
  "error": null
}
```

---

## 💻 Implementation Details

### Component Structure

```
DeliveriesScreen.tsx
├── State Management
│   ├── availableBatches: AvailableBatch[]
│   ├── showAvailableBatchesModal: boolean
│   ├── currentBatch: Batch | null
│   └── expandedBatches: string[]
│
├── Functions
│   ├── fetchAvailableBatches()
│   ├── fetchCurrentBatch()
│   ├── handleAcceptBatch(batchId)
│   └── onRefresh()
│
└── Components
    ├── Bell Icon (notification button)
    ├── "View X Available Batches" Button
    └── AvailableBatchesModal

AvailableBatchesModal.tsx
├── Props
│   ├── visible: boolean
│   ├── batches: AvailableBatch[]
│   ├── onClose: () => void
│   └── onAcceptBatch: (batchId) => Promise<void>
│
├── State
│   ├── acceptingBatchId: string | null
│   └── skippedBatchIds: string[]
│
└── Functions
    ├── handleAcceptBatch(batch)
    └── handleSkipBatch(batchId)
```

### Key State Management

```typescript
// DeliveriesScreen.tsx

const [availableBatches, setAvailableBatches] = useState<AvailableBatch[]>([]);
const [showAvailableBatchesModal, setShowAvailableBatchesModal] = useState(false);
const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
const [expandedBatches, setExpandedBatches] = useState<string[]>([]);

// Fetch available batches on load
useEffect(() => {
  const loadData = async () => {
    await Promise.all([fetchCurrentBatch(), fetchAvailableBatches()]);
  };
  loadData();
}, []);

// Refresh on screen focus
useFocusEffect(
  useCallback(() => {
    fetchCurrentBatch();
    fetchAvailableBatches();
  }, [])
);
```

### Accept Batch Flow

```typescript
// DeliveriesScreen.tsx

const handleAcceptBatch = async (batchId: string) => {
  try {
    console.log('🎯 Accepting batch:', batchId);

    // Call API
    const response = await acceptBatch(batchId);

    console.log('✅ Batch accepted:', response.data.batch.batchNumber);

    // Close modal
    setShowAvailableBatchesModal(false);

    // Refresh data
    await Promise.all([fetchCurrentBatch(), fetchAvailableBatches()]);

    // Auto-expand accepted batch
    if (response.data.batch?._id) {
      setExpandedBatches([response.data.batch._id]);
      setViewingBatchId(response.data.batch._id);
    }

  } catch (error: any) {
    console.error('❌ Error:', error);
    throw error; // Modal handles error display
  }
};
```

### Modal Implementation

```typescript
// AvailableBatchesModal.tsx

const [acceptingBatchId, setAcceptingBatchId] = useState<string | null>(null);
const [skippedBatchIds, setSkippedBatchIds] = useState<string[]>([]);

const handleAcceptBatch = async (batch: AvailableBatch) => {
  // Show confirmation with full details
  Alert.alert(
    '🎯 Accept Batch',
    `${batch.batchNumber}\n\n` +
    `📦 Orders: ${batch.orderCount}\n` +
    `💰 Estimated Earnings: ₹${batch.estimatedEarnings}\n` +
    `🍽️ Meal Window: ${batch.mealWindow}\n` +
    `📍 Zone: ${batch.zone.name}\n\n` +
    `Accept this batch and head to ${batch.kitchen.name}?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept Batch',
        onPress: async () => {
          try {
            setAcceptingBatchId(batch._id);
            await onAcceptBatch(batch._id);

            // Success alert
            Alert.alert(
              '✅ Batch Accepted!',
              `${batch.batchNumber} has been assigned to you.\n\n` +
              `Head to ${batch.kitchen.name} to pick up ${batch.orderCount} orders.`
            );
          } catch (error: any) {
            // Error handling
            if (error.message.includes('already taken')) {
              Alert.alert(
                '⚠️ Batch Already Taken',
                'Another driver has already accepted this batch.'
              );
            } else {
              Alert.alert('❌ Error', error.message);
            }
            setAcceptingBatchId(null);
          }
        },
      },
    ]
  );
};

const handleSkipBatch = (batchId: string) => {
  // Hide batch temporarily in current session
  setSkippedBatchIds(prev => [...prev, batchId]);
};
```

---

## 🚨 Error Handling

### 1. Batch Already Taken

**Scenario:** Another driver accepted the batch while this driver was viewing it

**Handling:**
```typescript
if (error.message.includes('already taken') || error.message.includes('not available')) {
  Alert.alert(
    '⚠️ Batch Already Taken',
    'Another driver has already accepted this batch. Please check other available batches.',
    [{ text: 'OK' }]
  );
  // Keep modal open so driver can try other batches
}
```

### 2. Network Error

**Handling:**
```typescript
try {
  await acceptBatch(batchId);
} catch (error: any) {
  if (error.message.includes('network') || error.message.includes('fetch')) {
    Alert.alert(
      '📡 Connection Error',
      'Unable to connect to server. Please check your internet connection.',
      [{ text: 'Retry', onPress: () => handleAcceptBatch(batch) }, { text: 'Cancel' }]
    );
  }
}
```

### 3. Authentication Error

**Handling:**
```typescript
if (error.message.includes('unauthorized') || error.message.includes('token')) {
  Alert.alert(
    '🔒 Session Expired',
    'Your session has expired. Please login again.',
    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
  );
}
```

### 4. Driver Already Has Active Batch

**Handling:**
```typescript
if (error.message.includes('active batch')) {
  Alert.alert(
    'Active Batch Exists',
    'You already have an active batch. Please complete it before accepting a new one.',
    [{ text: 'View Current Batch', onPress: () => { /* navigate to current batch */ } }]
  );
}
```

---

## 🧪 Testing Guide

### Test Cases

#### 1. View Available Batches
- [ ] Bell icon shows correct badge count
- [ ] "View X Available Batches" button shows correct count
- [ ] Modal opens when clicking bell icon
- [ ] Modal opens when clicking "View Batches" button
- [ ] Modal displays all available batches correctly
- [ ] Kitchen name, zone, order count visible
- [ ] Estimated earnings displayed correctly

#### 2. Accept Batch (Success Path)
- [ ] Click Accept shows confirmation dialog
- [ ] Confirmation dialog shows all batch details
- [ ] Accepting shows loading state
- [ ] Success alert displays with batch details
- [ ] Modal closes after acceptance
- [ ] Current batch list refreshes
- [ ] Accepted batch appears in deliveries list
- [ ] Batch is auto-expanded
- [ ] Available batches list updates (batch removed)

#### 3. Accept Batch (Already Taken)
- [ ] Two drivers view same batch
- [ ] First driver accepts successfully
- [ ] Second driver gets "already taken" error
- [ ] Error alert displays correctly
- [ ] Modal stays open for second driver
- [ ] Batch removed from second driver's view
- [ ] Second driver can try other batches

#### 4. Skip Batch
- [ ] Click "Not Interested" hides batch
- [ ] Batch removed from modal view
- [ ] Other batches still visible
- [ ] Skipped batch not in current session
- [ ] On modal reopen, skipped batches not shown

#### 5. Empty State
- [ ] No batches: Shows "No Batches Available" message
- [ ] After skipping all: Shows empty state
- [ ] Empty state has proper messaging

#### 6. Error Handling
- [ ] Network error shows retry option
- [ ] Auth error navigates to login
- [ ] Generic errors show error message
- [ ] User can recover from errors

---

## 📊 Status Flow Reference

### Batch Statuses

```
COLLECTING
  ↓ (admin dispatches)
READY_FOR_DISPATCH ← Driver can see and accept
  ↓ (driver accepts)
DISPATCHED ← Driver assigned
  ↓ (driver picks up)
IN_PROGRESS
  ↓ (all deliveries done)
COMPLETED / PARTIAL_COMPLETE
```

### When Driver Can Accept

Driver can ONLY accept batches with status: **READY_FOR_DISPATCH**

### After Acceptance

1. Batch status: `READY_FOR_DISPATCH` → `DISPATCHED`
2. Batch `driverId` set to driver's ID
3. All orders in batch get `driverId` set
4. DeliveryAssignments created with OTPs
5. Driver can proceed to pickup

---

## 🎯 Key Takeaways

1. **First-Come-First-Served**: Atomic database operation ensures only one driver gets the batch
2. **No Explicit Reject API**: Rejection is implicit (not accepting)
3. **Session-Based Skip**: "Not Interested" only hides batch in current session
4. **Auto-Refresh**: After acceptance, data refreshes to show new state
5. **Rich Feedback**: Success/error messages guide driver through flow
6. **Error Recovery**: Errors keep modal open so driver can try other batches

---

## ✅ Implementation Checklist

- [x] Create AvailableBatchesModal component
- [x] Add accept batch API integration
- [x] Add skip/not interested functionality
- [x] Implement confirmation dialogs
- [x] Add success feedback alerts
- [x] Add error handling with specific messages
- [x] Auto-refresh data after acceptance
- [x] Auto-expand accepted batch
- [x] Handle "already taken" scenario
- [x] Add loading states
- [x] Update bell icon badge
- [x] Update "View Batches" button

---

**All features implemented and ready to use!** 🚀
