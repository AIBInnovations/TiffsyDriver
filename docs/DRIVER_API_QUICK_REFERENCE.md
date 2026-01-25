# Driver API Quick Reference

**Quick lookup for all driver-related API endpoints**

## Base URL
```
https://your-domain.com/api
```

## Authentication Header
```
Authorization: Bearer <firebase_id_token>
```

---

## Authentication Endpoints

### 1. Check User Exists (Sync)
```
POST /api/auth/sync
Headers: Authorization: Bearer <token>
Body: {}
Returns: user profile, isNewUser, approvalStatus
```

### 2. Register Driver
```
POST /api/auth/register-driver
Headers: Authorization: Bearer <token>
Body: {
  name, email, profileImage,
  licenseNumber, licenseImageUrl, licenseExpiryDate,
  vehicleName, vehicleNumber, vehicleType,
  vehicleDocuments: [{ type, imageUrl, expiryDate }]
}
Returns: user with PENDING status
```

### 3. Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Returns: full user profile
```

### 4. Update Profile
```
PUT /api/auth/profile
Headers: Authorization: Bearer <token>
Body: { name?, email?, profileImage? }
Returns: updated user profile
```

### 5. Register FCM Token
```
POST /api/auth/fcm-token
Headers: Authorization: Bearer <token>
Body: { fcmToken, deviceId? }
Returns: success
```

### 6. Remove FCM Token
```
DELETE /api/auth/fcm-token
Headers: Authorization: Bearer <token>
Body: { fcmToken }
Returns: success
```

---

## Delivery Operation Endpoints

### 1. Get Available Batches
```
GET /api/delivery/available-batches
Headers: Authorization: Bearer <token>
Access: DRIVER role required
Returns: array of batches with status READY_FOR_DISPATCH
```

### 2. Accept Batch
```
POST /api/delivery/batches/:batchId/accept
Headers: Authorization: Bearer <token>
Access: DRIVER role required
Body: {}
Returns: batch details, orders, pickup address
Errors: 400 if already taken
```

### 3. Get My Current Batch
```
GET /api/delivery/my-batch
Headers: Authorization: Bearer <token>
Access: DRIVER role required
Returns: current active batch with orders and summary
```

### 4. Mark Batch Picked Up
```
PATCH /api/delivery/batches/:batchId/pickup
Headers: Authorization: Bearer <token>
Access: DRIVER role required
Body: { notes? }
Returns: batch with status IN_PROGRESS
Errors: 403 if not assigned, 400 if wrong status
```

### 5. Update Delivery Status
```
PATCH /api/delivery/orders/:orderId/status
Headers: Authorization: Bearer <token>
Access: DRIVER role required
Body: {
  status: "EN_ROUTE" | "ARRIVED" | "DELIVERED" | "FAILED",
  notes?,
  failureReason?, // required if status=FAILED
  proofOfDelivery? // required if status=DELIVERED
    { type: "OTP" | "SIGNATURE" | "PHOTO", otp?, signatureUrl?, photoUrl? }
}
Returns: updated order, assignment, batch progress
```

### 6. Update Delivery Sequence
```
PATCH /api/delivery/batches/:batchId/sequence
Headers: Authorization: Bearer <token>
Access: DRIVER role required
Body: {
  sequence: [
    { orderId, sequenceNumber },
    ...
  ]
}
Returns: updated batch
```

### 7. Complete Batch
```
PATCH /api/delivery/batches/:batchId/complete
Headers: Authorization: Bearer <token>
Access: DRIVER role required
Body: { notes? }
Returns: batch with status COMPLETED or PARTIAL_COMPLETE, summary
Errors: 400 if not all orders have final status
```

### 8. Get Batch Details
```
GET /api/delivery/batches/:batchId
Headers: Authorization: Bearer <token>
Access: DRIVER role required
Returns: full batch details, orders, assignments
```

---

## Enums & Constants

### Batch Statuses
```
COLLECTING - Orders being added (not visible to drivers)
READY_FOR_DISPATCH - Ready for acceptance
DISPATCHED - Driver accepted, not picked up
IN_PROGRESS - Driver picked up, delivering
COMPLETED - All delivered
PARTIAL_COMPLETE - Some delivered, some failed
CANCELLED - Cancelled by admin
```

### Delivery Assignment Statuses
```
ASSIGNED - Assigned to driver
ACKNOWLEDGED - Driver acknowledged
PICKED_UP - Picked up from kitchen
EN_ROUTE - On the way
ARRIVED - Arrived at location
DELIVERED - Successfully delivered
FAILED - Delivery failed
RETURNED - Returned to kitchen
CANCELLED - Cancelled
```

### Failure Reasons
```
CUSTOMER_UNAVAILABLE - Customer not available
WRONG_ADDRESS - Address incorrect
CUSTOMER_REFUSED - Customer refused
ADDRESS_NOT_FOUND - Could not locate
CUSTOMER_UNREACHABLE - Could not contact
OTHER - Other reason
```

### Vehicle Types
```
BIKE
SCOOTER
BICYCLE
OTHER
```

### Document Types
```
RC - Registration Certificate
INSURANCE - Vehicle Insurance
PUC - Pollution Under Control
OTHER - Other documents
```

### Meal Windows
```
LUNCH - Lunch time orders (ends 1:00 PM)
DINNER - Dinner time orders (ends 10:00 PM)
```

---

## Response Format

All endpoints return:
```json
{
  "message": "Human readable message",
  "data": { /* response data */ },
  "error": null // or error message
}
```

---

## HTTP Status Codes

```
200 - Success
201 - Created
400 - Bad Request (validation errors)
401 - Unauthorized (invalid/expired token)
403 - Forbidden (insufficient permissions, suspended, pending)
404 - Not Found
409 - Conflict (already exists)
500 - Internal Server Error
```

---

## Common Error Responses

### Token Expired
```json
{
  "message": "Unauthorized",
  "data": null,
  "error": "Token expired"
}
```
**Action:** Refresh Firebase token, retry request

### Account Pending
```json
{
  "message": "Driver pending approval",
  "data": { user, approvalStatus: "PENDING" },
  "error": null
}
```
**Action:** Show waiting screen

### Account Rejected
```json
{
  "message": "Driver registration rejected",
  "data": { user, approvalStatus: "REJECTED", rejectionReason: "..." },
  "error": null
}
```
**Action:** Show rejection screen with reason

### Batch Already Taken
```json
{
  "message": "Batch already taken or not available",
  "data": null,
  "error": "..."
}
```
**Action:** Refresh batch list, show toast

### Not Assigned to Batch
```json
{
  "message": "Not assigned to this batch",
  "data": null,
  "error": "..."
}
```
**Action:** Show error, navigate back

---

## Push Notification Payloads

### New Batch Available
```json
{
  "notification": { "title": "...", "body": "..." },
  "data": {
    "type": "NEW_BATCH_AVAILABLE",
    "batchId": "...",
    "zone": "...",
    "orderCount": "..."
  }
}
```

### Driver Approved
```json
{
  "notification": { "title": "...", "body": "..." },
  "data": {
    "type": "DRIVER_APPROVED",
    "action": "navigate_home"
  }
}
```

### Driver Rejected
```json
{
  "notification": { "title": "...", "body": "..." },
  "data": {
    "type": "DRIVER_REJECTED",
    "action": "navigate_rejection",
    "reason": "..."
  }
}
```

### Batch Reassigned
```json
{
  "notification": { "title": "...", "body": "..." },
  "data": {
    "type": "BATCH_REASSIGNED",
    "batchId": "..."
  }
}
```

### Order Cancelled
```json
{
  "notification": { "title": "...", "body": "..." },
  "data": {
    "type": "ORDER_CANCELLED",
    "orderId": "...",
    "batchId": "..."
  }
}
```

---

## Validation Rules

### Phone Number
- Format: 10 digits, starts with 6-9
- Example: 9179621765

### License Number
- Non-empty string
- Example: MH1234567890

### Vehicle Number
- Format: State code (2 letters) + District (1-2 digits) + Series (0-3 letters) + Number (4 digits)
- Example: MH12AB1234

### OTP
- 4 digits
- Example: 1234

### Image URLs
- Valid URL format
- Max size: 5MB recommended
- Formats: JPG, PNG

### Notes
- Max length: 200 characters

---

## Screen Flow Quick Reference

```
Phone OTP
   ↓
POST /sync
   ↓
   ├─→ isNewUser=true → Role Selection → Driver Registration Form → POST /register-driver → Waiting Screen
   │
   └─→ isNewUser=false
       ├─→ PENDING → Waiting Screen
       ├─→ REJECTED → Rejection Screen → Re-apply → Registration Form
       └─→ APPROVED → Driver Home
                         ↓
                    GET /available-batches
                         ↓
                    POST /batches/:id/accept
                         ↓
                    PATCH /batches/:id/pickup
                         ↓
                    PATCH /orders/:id/status (multiple times)
                         ↓
                    PATCH /batches/:id/complete (auto or manual)
                         ↓
                    Batch Complete Screen → Back to Home
```

---

## Testing Endpoints with cURL

### Sync User
```bash
curl -X POST https://your-domain.com/api/auth/sync \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Available Batches
```bash
curl -X GET https://your-domain.com/api/delivery/available-batches \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Accept Batch
```bash
curl -X POST https://your-domain.com/api/delivery/batches/BATCH_ID/accept \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Mark Delivered
```bash
curl -X PATCH https://your-domain.com/api/delivery/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DELIVERED",
    "proofOfDelivery": {
      "type": "OTP",
      "otp": "1234"
    }
  }'
```

---

## Development Checklist

- [ ] Setup Firebase Authentication
- [ ] Setup FCM for push notifications
- [ ] Implement image upload to cloud storage
- [ ] Create all 15 screens
- [ ] Implement all API integrations
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add offline support
- [ ] Test on iOS and Android
- [ ] Test push notifications
- [ ] Test with real devices
- [ ] Performance optimization
- [ ] Security audit

---

**Document Version:** 1.0
**Last Updated:** January 12, 2026
**For Full Documentation:** See `DRIVER_COMPLETE_INTEGRATION_GUIDE.md`
