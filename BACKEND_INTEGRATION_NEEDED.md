# 🔧 Backend Integration Needed - Driver Registration

## ❌ Current Issue

The `/auth/register-driver` endpoint does not exist on the backend yet, causing the error:
```
Backend returned non-JSON response
```

## ✅ Backend Data Structure (Correct!)

I can see from your MongoDB document that the backend is storing driver data correctly:

```json
{
  "phone": "9522455243",
  "role": "DRIVER",
  "name": "Vaishnavi Sharma",
  "profileImage": "https://via.placeholder.com/300",
  "firebaseUid": "YUU7amMGWNTIETuT1iFf5m9dSWl2",
  "status": "ACTIVE",
  "driverDetails": {
    "licenseNumber": "DL5666445666655",
    "licenseImageUrl": "https://via.placeholder.com/300",
    "licenseExpiryDate": "2028-12-11",
    "vehicleName": "Honda Activa",
    "vehicleNumber": "MH12AB7867",
    "vehicleType": "SCOOTER",
    "vehicleDocuments": [
      {
        "type": "RC",
        "imageUrl": "https://via.placeholder.com/300",
        "expiryDate": "2027-12-11"
      }
    ]
  },
  "approvalStatus": "APPROVED"
}
```

This structure is **perfect** and matches what the app is sending! ✅

---

## 🚀 Backend Endpoint to Implement

### **POST /api/auth/register-driver**

The backend developer needs to create this endpoint:

#### Request Headers:
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

#### Request Body (from app):
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

#### Expected Response (Success):
```json
{
  "success": true,
  "message": "Driver registration submitted for approval",
  "data": {
    "user": {
      "_id": "...",
      "phone": "9522455243",
      "role": "DRIVER",
      "name": "John Doe",
      "email": "john@example.com",
      "profileImage": "https://...",
      "driverDetails": { ... },
      "approvalStatus": "PENDING",
      "status": "ACTIVE"
    },
    "approvalStatus": "PENDING",
    "message": "Your registration is pending admin approval. You will be notified once approved."
  }
}
```

#### Expected Response (Error):
```json
{
  "success": false,
  "error": "Validation error message",
  "message": "Invalid license number format"
}
```

---

## 📝 Backend Implementation Guide

### Step 1: Create the Endpoint

```javascript
// routes/authRoutes.js
router.post('/register-driver', authenticateFirebase, async (req, res) => {
  try {
    const { uid, phone_number } = req.user; // From Firebase auth middleware

    const {
      name,
      email,
      profileImage,
      licenseNumber,
      licenseImageUrl,
      licenseExpiryDate,
      vehicleName,
      vehicleNumber,
      vehicleType,
      vehicleDocuments
    } = req.body;

    // Validation
    if (!name || !licenseNumber || !licenseImageUrl || !vehicleName || !vehicleNumber || !vehicleType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Please provide all required information'
      });
    }

    if (!vehicleDocuments || vehicleDocuments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing vehicle documents',
        message: 'At least one vehicle document is required'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ firebaseUid: uid });

    if (user && user.approvalStatus === 'PENDING') {
      return res.status(409).json({
        success: false,
        error: 'Registration already pending',
        message: 'Your registration is already under review'
      });
    }

    if (user && user.approvalStatus === 'APPROVED') {
      return res.status(409).json({
        success: false,
        error: 'Driver already registered',
        message: 'You are already registered as a driver'
      });
    }

    // Create or update user with driver details
    if (!user) {
      user = new User({
        phone: phone_number,
        firebaseUid: uid,
        role: 'DRIVER',
        status: 'ACTIVE'
      });
    }

    // Update user details
    user.name = name;
    user.email = email;
    user.profileImage = profileImage;
    user.role = 'DRIVER';
    user.approvalStatus = 'PENDING'; // Set to PENDING for admin approval

    // Add driver details
    user.driverDetails = {
      licenseNumber,
      licenseImageUrl,
      licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : undefined,
      vehicleName,
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType,
      vehicleDocuments: vehicleDocuments.map(doc => ({
        type: doc.type,
        imageUrl: doc.imageUrl,
        expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : undefined
      }))
    };

    await user.save();

    // TODO: Send notification to admin for approval
    // await sendAdminNotification(user);

    return res.status(200).json({
      success: true,
      message: 'Driver registration submitted for approval',
      data: {
        user: user.toObject(),
        approvalStatus: 'PENDING',
        message: 'Your registration is pending admin approval. You will be notified once approved.'
      }
    });

  } catch (error) {
    console.error('Error in register-driver:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});
```

### Step 2: Update User Model (if needed)

Make sure the User schema has these fields:

```javascript
const userSchema = new mongoose.Schema({
  phone: String,
  firebaseUid: String,
  role: { type: String, enum: ['CUSTOMER', 'DRIVER', 'ADMIN', 'KITCHEN_STAFF'] },
  name: String,
  email: String,
  profileImage: String,
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },

  // Driver-specific fields
  driverDetails: {
    licenseNumber: String,
    licenseImageUrl: String,
    licenseExpiryDate: Date,
    vehicleName: String,
    vehicleNumber: String,
    vehicleType: { type: String, enum: ['BIKE', 'SCOOTER', 'BICYCLE', 'OTHER'] },
    vehicleDocuments: [{
      type: { type: String, enum: ['RC', 'INSURANCE', 'PUC', 'OTHER'] },
      imageUrl: String,
      expiryDate: Date
    }]
  },

  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: null
  },
  rejectionReason: String,

  fcmTokens: [String],
  lastLoginAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### Step 3: Update /auth/sync Endpoint

Make sure the sync endpoint returns approvalStatus:

```javascript
router.post('/sync', authenticateFirebase, async (req, res) => {
  try {
    const { uid, phone_number } = req.user;

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.json({
        success: true,
        message: 'User not found',
        data: {
          user: null,
          isNewUser: true,
          isProfileComplete: false
        }
      });
    }

    // Check if profile is complete
    const isProfileComplete = !!(
      user.name &&
      user.email &&
      user.role === 'DRIVER' &&
      user.driverDetails?.vehicleNumber &&
      user.driverDetails?.vehicleType
    );

    return res.json({
      success: true,
      message: 'User authenticated',
      data: {
        user: user.toObject(),
        isNewUser: false,
        isProfileComplete,
        approvalStatus: user.approvalStatus || null,
        rejectionReason: user.rejectionReason || null
      }
    });

  } catch (error) {
    console.error('Error in sync:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});
```

---

## 🔄 Temporary Workaround (Until Backend is Ready)

For now, you can test the UI flow by **temporarily** skipping the API call:

### Option 1: Mock Success Response

In `DriverRegistrationScreen.tsx`, temporarily replace the API call:

```typescript
// Temporary: Skip API call for UI testing
console.log('📝 Would submit to backend:', registrationData);

// Mock success
Alert.alert(
  'Success! (Mock)',
  'UI flow test: Your driver registration has been submitted. In production, this will call the backend API.',
  [
    {
      text: 'OK',
      onPress: () => {
        navigation.replace('ApprovalWaiting', { phoneNumber });
      },
    },
  ]
);
return; // Skip actual API call

// const response = await registerDriver(registrationData); // Uncomment when backend is ready
```

### Option 2: Use Admin Panel

Have the backend admin manually create driver entries using the structure shown above, then test the login flow with those users.

---

## ✅ Testing After Backend Implementation

Once the backend implements `/auth/register-driver`:

1. **Remove the mock/workaround** from DriverRegistrationScreen
2. **Test the complete flow:**
   ```
   Login → OTP → RoleSelection → DriverRegistration
   → Submit → ApprovalWaiting → (Admin approves)
   → Login again → Main App ✅
   ```

3. **Test rejection flow:**
   - Admin rejects with reason
   - Login → Rejection Screen
   - Re-apply → DriverRegistration (with reapply=true)

4. **Check console logs** - All API responses are logged

---

## 📞 Backend Developer Checklist

- [ ] Create POST `/api/auth/register-driver` endpoint
- [ ] Accept all driver registration fields
- [ ] Set `approvalStatus: "PENDING"` on new registrations
- [ ] Update User schema with `driverDetails` and `approvalStatus`
- [ ] Update `/auth/sync` to return `approvalStatus` and `rejectionReason`
- [ ] Test with the app frontend
- [ ] (Optional) Add admin notification when new driver registers

---

## 🎯 Summary

**The Issue:** Backend doesn't have `/auth/register-driver` endpoint yet

**The Solution:** Backend developer needs to implement the endpoint as shown above

**The Data Structure:** Already correct in your MongoDB! Just need the API endpoint.

**Temporary Workaround:** Use mock response in frontend OR have admin manually create drivers

Once the backend implements this endpoint, the entire driver registration flow will work perfectly! 🚀
