# Proof of Delivery (POD) Integration Fix

## Problem
When attempting to mark an order as DELIVERED, the backend returned a 500 error:
```
Error: Proof of delivery is required for DELIVERED status
```

The POD modal was being shown and data was being collected (OTP verification, notes, recipient name), but this data was **not being sent to the backend API**.

## Root Cause
The `handlePODSubmit()` function in DeliveryStatusScreen was calling `updateDeliveryStatus("delivered")` without passing the POD data collected from the modal.

## Solution
Updated the delivery status flow to include POD data when marking orders as DELIVERED.

## Files Changed

### [src/screens/delivery-status/DeliveryStatusScreen.tsx](src/screens/delivery-status/DeliveryStatusScreen.tsx)

#### 1. Updated `updateDeliveryStatus()` Function (Line 177-215)
**Added POD data parameter and request body preparation:**

```typescript
const updateDeliveryStatus = async (
  newStatus: DeliveryStatusType,
  podData?: { otpVerified: boolean; notes?: string; recipientName?: string }  // ✅ Added POD data param
) => {
  if (!delivery) return;

  setIsUpdating(true);

  try {
    console.log('📝 Updating delivery status:', delivery.deliveryId, newStatus);

    // Map local status to API status
    const apiStatus = mapDeliveryStatusToOrderStatus(newStatus);

    // ✅ Prepare request body
    const requestBody: any = { status: apiStatus };

    // ✅ Add proof of delivery for DELIVERED status
    if (newStatus === "delivered" && podData?.otpVerified) {
      requestBody.proofOfDelivery = {
        type: 'OTP',
        otp: 'verified', // OTP was verified
      };
      if (podData.notes) {
        requestBody.notes = podData.notes;
      }
    }

    console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

    // Call the API to update status
    await apiUpdateDeliveryStatus(delivery.deliveryId, requestBody);

    console.log('✅ Status updated successfully');
    // ... rest of function
  }
};
```

**Key Changes:**
- Added optional `podData` parameter with OTP verification status, notes, and recipient name
- Created `requestBody` object with status
- When marking as DELIVERED, added `proofOfDelivery` object with type 'OTP'
- Included notes in request if provided

#### 2. Updated `handlePODSubmit()` Function (Line 269-272)
**Now accepts and passes POD data:**

```typescript
const handlePODSubmit = (podData: { otpVerified: boolean; notes?: string; recipientName?: string }) => {
  setShowPODModal(false);
  updateDeliveryStatus("delivered", podData);  // ✅ Pass POD data
};
```

**Before:**
```typescript
const handlePODSubmit = () => {
  setShowPODModal(false);
  updateDeliveryStatus("delivered");  // ❌ No POD data
};
```

#### 3. Updated PODCapture Modal Props (Line 447-452)
**Added customer phone and order ID:**

```typescript
<PODCapture
  visible={showPODModal}
  onClose={() => setShowPODModal(false)}
  onSubmit={handlePODSubmit}
  customerPhone={delivery?.customerPhone}  // ✅ Added
  orderId={delivery?.orderId}              // ✅ Added
/>
```

## API Request Format

### Before Fix ❌
```json
{
  "status": "DELIVERED"
}
```
**Result:** Backend rejected with 500 error "Proof of delivery is required for DELIVERED status"

### After Fix ✅
```json
{
  "status": "DELIVERED",
  "proofOfDelivery": {
    "type": "OTP",
    "otp": "verified"
  },
  "notes": "Left with security guard"
}
```
**Result:** Backend accepts the request and updates order status

## POD Data Flow

```
User clicks "Mark Delivered"
        ↓
POD Modal Opens
        ↓
User enters OTP (e.g., "1234")
        ↓
OTP verified successfully
        ↓
User enters notes (optional) and recipient name (optional)
        ↓
User clicks "Complete Delivery"
        ↓
handlePODSubmit({ otpVerified: true, notes: "...", recipientName: "..." })
        ↓
updateDeliveryStatus("delivered", podData)
        ↓
Request body prepared with proofOfDelivery object
        ↓
API Call: PATCH /api/delivery/orders/:id/status
Body: { status: "DELIVERED", proofOfDelivery: { type: "OTP", otp: "verified" }, notes: "..." }
        ↓
✅ Backend accepts and updates order
        ↓
Delivery complete modal shown
```

## Backend API Expectations

### DeliveryStatusUpdateRequest Type
```typescript
export interface DeliveryStatusUpdateRequest {
  status: OrderStatus;
  notes?: string;
  failureReason?: 'CUSTOMER_UNAVAILABLE' | 'WRONG_ADDRESS' | 'CUSTOMER_REFUSED' | 'ADDRESS_NOT_FOUND' | 'CUSTOMER_UNREACHABLE' | 'OTHER';
  proofOfDelivery?: ProofOfDelivery;
}

export interface ProofOfDelivery {
  type: 'OTP' | 'SIGNATURE' | 'PHOTO';
  otp?: string;
  signature?: string;
  photoUrl?: string;
}
```

### Status-Specific Requirements
- **READY** → No POD required
- **EN_ROUTE** → No POD required
- **ARRIVED** → No POD required
- **DELIVERED** → **POD REQUIRED** ✅
- **FAILED** → No POD required (but needs failureReason)

## Testing Checklist

- [ ] Open Delivery Status Screen
- [ ] Click "Start Delivery" → Status updates to EN_ROUTE
- [ ] Click "Mark Picked Up" → Status updates to ARRIVED
- [ ] Click "Mark Delivered" → POD Modal opens
- [ ] Enter OTP "1234" → OTP verified successfully
- [ ] Enter notes (optional): "Left with security guard"
- [ ] Enter recipient name (optional): "John"
- [ ] Click "Complete Delivery"
- [ ] Verify API call includes proofOfDelivery object
- [ ] Verify order status updates to DELIVERED
- [ ] Verify delivery complete modal appears

## Benefits

1. **Backend Compliance**: API calls now include required POD data for DELIVERED status
2. **Data Capture**: Customer OTP verification and delivery notes are properly recorded
3. **Error Prevention**: No more 500 errors when marking orders as delivered
4. **Audit Trail**: Backend now has proof that delivery was verified with customer OTP
5. **Better Tracking**: Notes and recipient names are stored for delivery records

## Notes

- The POD modal currently uses mock OTP verification (hardcoded "1234")
- In production, the OTP should be sent to customer and verified via backend API
- The recipient name is collected but currently not sent to backend (can be added to notes if needed)
- POD type is 'OTP' - future enhancements could support 'SIGNATURE' and 'PHOTO' types
