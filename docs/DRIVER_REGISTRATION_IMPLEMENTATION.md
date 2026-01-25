# 🚀 Driver Registration Implementation Plan

Based on `driver-registration-frontend (1).md` document.

## 📋 Current Status

✅ **Completed:**
- API types updated with `ApprovalStatus`, `DriverRegistrationRequest`, etc.
- `/auth/register-driver` endpoint added to API config

⏳ **In Progress:**
- Creating comprehensive implementation

## 🔄 Complete Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Login Flow                               │
└─────────────────────────────────────────────────────────────┘

User enters phone → Firebase OTP → Verify OTP
                                       ↓
                              POST /api/auth/sync
                                       ↓
                    ┌──────────────────┴──────────────────┐
                    │                                     │
               isNewUser: true                  isNewUser: false
                    │                                     │
                    ↓                                     ↓
          ┌──────────────────┐              Check user.role & approvalStatus
          │ RoleSelection    │                           │
          │ Screen           │              ┌────────────┼────────────┐
          └──────┬───────────┘              │            │            │
                 │                    role=CUSTOMER  role=DRIVER  role=DRIVER
           Choose Role                      │       approvalStatus  approvalStatus
           │        │                       │         PENDING      APPROVED/REJECTED
      CUSTOMER   DRIVER                     │            │               │
           │        │                       ↓            ↓               ↓
           │        ↓                  Customer    Waiting         Check status
           │  ┌──────────────┐          Home      Screen               │
           │  │ Driver        │                      │        ┌────────┼────────┐
           │  │ Registration  │                      │    APPROVED   REJECTED
           │  │ Form          │                      │        │           │
           │  └──────┬────────┘                      │        ↓           ↓
           │         │                               │    Driver      Rejection
           │         ↓                               │     Home       Screen
           │  POST /register-driver                  │                   │
           │         │                               │                   │
           │         ↓                               │                   │
           │  ┌──────────────┐                      │                   │
           │  │ Waiting      │◄─────────────────────┘                   │
           │  │ Screen       │                                           │
           │  │ (PENDING)    │                                           │
           │  └──────┬───────┘                                           │
           │         │                                                   │
           │    Pull to Refresh                                          │
           │         │                                                   │
           │         └───────────────────────────────────────────────────┘
           │                         │
           └─────────────────────────┘
                                     ↓
                              (Customer flow not shown)
```

## 📱 Screens to Implement

### 1. RoleSelectionScreen ⭐ NEW
**File:** `src/screens/auth/RoleSelectionScreen.tsx`

**Purpose:** Let new users choose between Customer or Driver role

**UI Elements:**
```
┌──────────────────────────────────────────┐
│          Welcome to Tiffsy!              │
│    How would you like to use Tiffsy?    │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  🍱  Order Food                    │ │
│  │  Get delicious meals delivered     │ │
│  │                           [Customer]│ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  🚗  Deliver Food                  │ │
│  │  Earn by delivering orders         │ │
│  │                            [Driver]│ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Navigation:**
- Customer → Customer registration/home (not in scope)
- Driver → DriverRegistrationScreen

---

### 2. DriverRegistrationScreen 🔄 UPDATE EXISTING
**File:** `src/screens/auth/ProfileOnboardingScreen.tsx` → Rename to `DriverRegistrationScreen.tsx`

**Purpose:** Collect all driver details including documents

**Required Fields:**

#### Personal Info
- ✅ Name (already exists)
- ✅ Email (already exists)
- ✅ Profile Photo (already exists)

#### License Details ⭐ ADD
- License Number (text input)
- License Photo (image upload) **REQUIRED**
- License Expiry Date (date picker) optional

#### Vehicle Details
- ✅ Vehicle Type (already exists as dropdown)
- ✅ Vehicle Number (already exists)
- ⭐ Vehicle Name/Model (ADD - e.g., "Honda Activa")

#### Vehicle Documents ⭐ ADD
- Dynamic list of documents
- Each document:
  - Type (dropdown: RC, INSURANCE, PUC, OTHER)
  - Image Upload
  - Expiry Date (optional)
- "Add Document" button
- Minimum 1 document required

**API Call:**
```typescript
POST /api/auth/register-driver
Body: DriverRegistrationRequest
```

**On Success:**
- Navigate to ApprovalWaitingScreen

---

### 3. ApprovalWaitingScreen ⭐ NEW
**File:** `src/screens/auth/ApprovalWaitingScreen.tsx`

**Purpose:** Show while driver registration is pending admin approval

**UI Elements:**
```
┌──────────────────────────────────────────┐
│     [Hourglass Animation]                │
│                                          │
│   Registration Under Review              │
│                                          │
│   Your driver registration is pending    │
│   admin approval. We'll notify you      │
│   once it's approved.                    │
│                                          │
│   Status: 🟡 PENDING                     │
│                                          │
│   Usually approved within 24-48 hours    │
│                                          │
│   ┌────────────────────┐                │
│   │  Check Status      │                │
│   └────────────────────┘                │
│                                          │
│   Contact Support                        │
│   Logout                                 │
└──────────────────────────────────────────┘
```

**Features:**
- Pull-to-refresh
- "Check Status" button → calls `/api/auth/sync`
- Contact support link
- Logout option

---

### 4. RejectionScreen ⭐ NEW
**File:** `src/screens/auth/RejectionScreen.tsx`

**Purpose:** Show when driver registration is rejected with reason

**UI Elements:**
```
┌──────────────────────────────────────────┐
│     [Warning Icon]                       │
│                                          │
│   Registration Not Approved              │
│                                          │
│   Your registration was not approved     │
│   for the following reason:              │
│                                          │
│   ┌────────────────────────────────────┐│
│   │ "Invalid license document"         ││
│   └────────────────────────────────────┘│
│                                          │
│   What you can do:                       │
│   • Fix the issues mentioned above       │
│   • Re-submit your application          │
│   • Contact support if you need help    │
│                                          │
│   ┌────────────────────┐                │
│   │  Re-apply          │                │
│   └────────────────────┘                │
│                                          │
│   Contact Support                        │
│   Logout                                 │
└──────────────────────────────────────────┘
```

**Features:**
- Display rejection reason from API
- "Re-apply" button → Navigate to DriverRegistrationScreen with pre-filled data
- Contact support
- Logout

---

## 🔧 Code Changes Required

### 1. Update Navigation Types

```typescript
// src/navigation/types.ts

export type AuthStackParamList = {
  Login: undefined;
  OtpVerify: {
    phoneNumber: string;
    confirmation: FirebaseAuthTypes.ConfirmationResult;
  };
  RoleSelection: { phoneNumber: string };  // ⭐ ADD
  DriverRegistration: { phoneNumber: string; reapply?: boolean };  // ⭐ ADD/RENAME
  ApprovalWaiting: { phoneNumber: string };  // ⭐ ADD
  Rejection: {  // ⭐ ADD
    phoneNumber: string;
    rejectionReason: string;
  };
  ProfileOnboarding: { phoneNumber: string };  // Keep for customers if needed
};
```

### 2. Update OtpVerifyScreen Logic

```typescript
// src/screens/auth/OtpVerifyScreen.tsx

const handleVerifyOTP = async (code: string) => {
  // ... verify OTP ...

  // Get sync response
  const syncResponse = await syncUser();

  // Handle based on response
  if (syncResponse.data.isNewUser) {
    // New user → Role Selection
    navigation.replace('RoleSelection', { phoneNumber });
  } else {
    const { user, approvalStatus, rejectionReason } = syncResponse.data;

    if (user?.role === 'DRIVER') {
      switch (approvalStatus) {
        case 'PENDING':
          navigation.replace('ApprovalWaiting', { phoneNumber });
          break;

        case 'REJECTED':
          navigation.replace('Rejection', {
            phoneNumber,
            rejectionReason: rejectionReason || 'No reason provided'
          });
          break;

        case 'APPROVED':
          navigation.getParent()?.navigate('Main');
          break;

        default:
          // No approval status, go to registration
          navigation.replace('DriverRegistration', { phoneNumber });
      }
    } else if (user?.role === 'CUSTOMER') {
      // Customer flow (not implemented yet)
      navigation.getParent()?.navigate('Main');
    } else {
      // Unknown role, show role selection
      navigation.replace('RoleSelection', { phoneNumber });
    }
  }
};
```

### 3. Add Driver Registration API Service

```typescript
// src/services/authService.ts

import type {
  DriverRegistrationRequest,
  DriverRegistrationData,
} from '../types/api';

export const registerDriver = async (
  data: DriverRegistrationRequest
): Promise<ApiResponse<DriverRegistrationData>> => {
  try {
    console.log('📡 Calling /auth/register-driver endpoint...');
    console.log('📝 Driver data:', JSON.stringify(data, null, 2));

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER_DRIVER}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }
    );

    console.log('📡 Response status:', response.status);

    const responseText = await response.text();
    console.log('📡 Response preview:', responseText.substring(0, 200));

    let responseData: ApiResponse<DriverRegistrationData>;
    try {
      responseData = JSON.parse(responseText);
      console.log('📡 Response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('❌ Response is not valid JSON');
      throw new Error('Backend returned non-JSON response');
    }

    if (!response.ok) {
      throw new Error(
        responseData.error || responseData.message || 'Failed to register driver'
      );
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ Error registering driver:', error);
    throw error;
  }
};
```

### 4. Update AuthNavigator

```typescript
// src/navigation/AuthNavigator.tsx

import RoleSelectionScreen from "../screens/auth/RoleSelectionScreen";
import DriverRegistrationScreen from "../screens/auth/DriverRegistrationScreen";
import ApprovalWaitingScreen from "../screens/auth/ApprovalWaitingScreen";
import RejectionScreen from "../screens/auth/RejectionScreen";

<Stack.Navigator>
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
  <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
  <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
  <Stack.Screen name="ApprovalWaiting" component={ApprovalWaitingScreen} />
  <Stack.Screen name="Rejection" component={RejectionScreen} />
</Stack.Navigator>
```

## 📦 New Components Needed

### 1. ImageUploadComponent
Reusable component for uploading images (license, documents, profile)

```typescript
interface ImageUploadProps {
  label: string;
  required?: boolean;
  value: string | null;
  onChange: (url: string) => void;
  error?: string;
}
```

### 2. DocumentListComponent
Dynamic list for vehicle documents

```typescript
interface DocumentListProps {
  documents: VehicleDocument[];
  onChange: (docs: VehicleDocument[]) => void;
  error?: string;
}
```

### 3. StatusBadgeComponent
Show approval status with colors

```typescript
interface StatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
```

## 🧪 Testing Checklist

- [ ] New user sees RoleSelectionScreen after OTP
- [ ] Selecting "Driver" navigates to DriverRegistrationScreen
- [ ] All required fields validated
- [ ] Image uploads work (license + documents)
- [ ] Vehicle number format validated
- [ ] At least one document required
- [ ] Form submission calls POST /register-driver
- [ ] After submission, navigate to ApprovalWaitingScreen
- [ ] Pull-to-refresh on waiting screen works
- [ ] Pending driver sees WaitingScreen on next login
- [ ] Rejected driver sees RejectionScreen with reason
- [ ] Re-apply button pre-fills form data
- [ ] Approved driver goes to Main app
- [ ] Logout works from all screens

## 📝 Implementation Order

1. ✅ Update API types
2. ✅ Add /register-driver endpoint to config
3. ⏳ Add registerDriver() to authService
4. ⏳ Update navigation types
5. ⏳ Create RoleSelectionScreen
6. ⏳ Update OtpVerifyScreen logic
7. ⏳ Create ApprovalWaitingScreen
8. ⏳ Create RejectionScreen
9. ⏳ Update DriverRegistrationScreen (existing ProfileOnboarding)
10. ⏳ Add to AuthNavigator
11. ⏳ Test complete flow

## 🎯 Key Points

1. **Role selection is mandatory** for new users
2. **Driver registration requires admin approval**
3. **Documents are mandatory** (at least one)
4. **Handle all approval states** (PENDING, APPROVED, REJECTED)
5. **Pre-fill data on re-apply** for rejected users
6. **Pull-to-refresh** for status checks
7. **Clear error messages** for all scenarios

---

**Total Screens:** 4 new + 1 updated = 5 screens
**Total API Calls:** 2 (/sync, /register-driver)
**Estimated Time:** Full implementation ~4-6 hours

**Status:** Foundation complete (types + API config), ready for screen implementation.
