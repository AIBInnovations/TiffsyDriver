# 🎯 Navigation Flow Fix

## Problem
After registering and completing profile, users were being sent back to the profile screen every time they logged in, even though their profile was already complete.

## Root Cause
In [OtpVerifyScreen.tsx](src/screens/auth/OtpVerifyScreen.tsx), line 130 was navigating to `ProfileOnboarding` even when the profile was complete:

```typescript
// ❌ WRONG - Always goes to ProfileOnboarding
navigation.replace('ProfileOnboarding', { phoneNumber });
```

## Solution
Updated navigation logic to properly route users based on their profile status:

```typescript
// ✅ CORRECT - Goes to Main app when profile complete
navigation.getParent()?.navigate('Main');
```

## Navigation Structure

```
RootNavigator (initialRoute: "Auth")
├── Auth Stack
│   ├── Login
│   ├── OtpVerify
│   └── ProfileOnboarding
└── Main Stack (BottomTabs)
    ├── Dashboard
    ├── Deliveries
    ├── DeliveryStatus
    └── Profile
```

## Updated Flow Logic

### Scenario 1: New User Registration
```
Login → OTP → Backend Response (isNewUser: true)
                ↓
          ProfileOnboarding (Register)
                ↓
          Complete Profile → Navigate to Main
```

### Scenario 2: Existing User with Incomplete Profile
```
Login → OTP → Backend Response (isNewUser: false, isProfileComplete: false)
                ↓
          ProfileOnboarding (Complete Profile)
                ↓
          Submit Profile → Navigate to Main
```

### Scenario 3: Existing User with Complete Profile ✅
```
Login → OTP → Backend Response (isNewUser: false, isProfileComplete: true)
                ↓
          Main App (Dashboard) ✅
```

**This is the fix!** Users with complete profiles now go directly to the Main app instead of ProfileOnboarding.

### Scenario 4: Wrong Role (Not a Driver)
```
Login → OTP → Backend Response (role != "DRIVER")
                ↓
          Alert: "Access Denied"
                ↓
          Logout → Back to Login
```

## Code Changes

### 1. OtpVerifyScreen.tsx (Line 127-131)

**Before:**
```typescript
} else {
  // Existing driver with complete profile
  console.log('✅ Authentication successful, navigating to main app...');
  // TODO: Replace 'ProfileOnboarding' with your main app screen
  navigation.replace('ProfileOnboarding', { phoneNumber }); // ❌ Wrong!
}
```

**After:**
```typescript
} else {
  // Existing driver with complete profile - navigate to main app
  console.log('✅ Authentication successful, navigating to main app...');
  console.log('👤 User:', syncResponse.data.user?.name, '| Role:', syncResponse.data.user?.role);

  // Navigate to Main stack (root level)
  navigation.getParent()?.navigate('Main'); // ✅ Correct!
}
```

### 2. RootNavigator.tsx (Line 12)

**Before:**
```typescript
initialRouteName="Main"  // ❌ App starts at Main (without auth)
```

**After:**
```typescript
initialRouteName="Auth"  // ✅ App starts at Auth (login required)
```

## Testing the Fix

### Test Case 1: New User
1. Enter phone number
2. Enter OTP
3. Backend returns `isNewUser: true`
4. ✅ Should see ProfileOnboarding screen
5. Complete profile
6. ✅ Should navigate to Main app

### Test Case 2: Returning User with Complete Profile
1. Enter phone number
2. Enter OTP
3. Backend returns `isNewUser: false`, `isProfileComplete: true`
4. ✅ Should go directly to Main app (Dashboard)
5. ✅ Should NOT see ProfileOnboarding screen

### Test Case 3: User with Incomplete Profile
1. Enter phone number
2. Enter OTP
3. Backend returns `isNewUser: false`, `isProfileComplete: false`
4. ✅ Should see ProfileOnboarding screen
5. Complete profile
6. ✅ Should navigate to Main app

## Console Logs to Verify

When authentication succeeds with complete profile, you should see:

```
🔐 Verifying OTP with Firebase...
✅ Firebase OTP verified successfully
👤 User: firebase_uid_xxx
🔑 Getting Firebase ID token...
🔑 Firebase ID Token: eyJhbGci...
💾 Token stored in AsyncStorage
📡 Calling /auth/sync endpoint...
📡 Response status: 200
📡 Response data: {
  "data": {
    "user": { "name": "John Doe", "role": "DRIVER", ... },
    "isNewUser": false,
    "isProfileComplete": true
  }
}
📊 Sync response: {
  isNewUser: false,
  isProfileComplete: true,
  userName: "John Doe",
  userRole: "DRIVER"
}
✅ Authentication successful, navigating to main app...
👤 User: John Doe | Role: DRIVER
```

The last two lines confirm:
1. Profile is complete
2. Navigating to Main app (not ProfileOnboarding)

## Backend Requirements

For this to work correctly, your backend must return:

```json
{
  "message": "User authenticated",
  "data": {
    "user": {
      "name": "John Doe",
      "role": "DRIVER",
      ...
    },
    "isNewUser": false,
    "isProfileComplete": true  // ← This must be true for complete profiles
  }
}
```

Make sure your backend `/api/auth/sync` endpoint sets `isProfileComplete: true` when:
- User has filled all required profile fields
- User has completed onboarding

## Summary

✅ **Fixed:** Users with complete profiles now go directly to Main app
✅ **Fixed:** App now starts with Auth (login required)
✅ **Maintained:** New users still go to ProfileOnboarding for registration
✅ **Maintained:** Users with incomplete profiles go to ProfileOnboarding to complete

---

**The fix is complete!** Users will no longer see the profile screen after they've already completed it. 🎉
