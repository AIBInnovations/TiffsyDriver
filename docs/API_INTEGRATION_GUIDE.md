# API Integration Guide - TiffsyDriver

This guide explains the authentication flow and API integration implemented in the TiffsyDriver React Native application.

## 🎯 Overview

The authentication system implements a complete Firebase Phone OTP + Backend API flow:

1. **Firebase Phone Authentication** - Sends and verifies OTP
2. **Backend API Sync** - Syncs authenticated user with backend database
3. **Token Management** - Stores Firebase ID tokens securely
4. **Role Validation** - Ensures only drivers can access the app

## 📁 Project Structure

```
src/
├── config/
│   └── api.ts                    # API configuration and endpoints
├── services/
│   └── authService.ts            # Authentication API calls
├── utils/
│   └── tokenStorage.ts           # Token and data storage utilities
├── types/
│   └── api.ts                    # TypeScript types for API responses
└── screens/
    └── auth/
        ├── LoginScreen.tsx       # Phone number input
        └── OtpVerifyScreen.tsx   # OTP verification + API sync
```

## 🔧 Configuration

### Step 1: Set Your Backend URL

Open [src/config/api.ts](src/config/api.ts) and update the `BASE_URL`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://your-backend-domain.com/api',
  // For local development:
  // BASE_URL: 'http://192.168.1.100:3000/api',
  // For ngrok testing:
  // BASE_URL: 'https://your-ngrok-url.ngrok.io/api',
};
```

**Important:**
- For Android emulator: Use `http://10.0.2.2:3000/api` (localhost mapping)
- For physical devices: Use your computer's IP address or ngrok URL
- For production: Use your deployed backend URL

### Step 2: Verify Firebase Configuration

Ensure [google-services.json](android/app/google-services.json) is in place with your Firebase project credentials.

## 🔐 Authentication Flow

### Complete Flow Diagram

```
User enters phone number
         ↓
Firebase sends OTP
         ↓
User enters OTP
         ↓
Firebase verifies OTP ✅
         ↓
Get Firebase ID Token 🔑
         ↓
Store token in AsyncStorage 💾
         ↓
Call POST /api/auth/sync 📡
         ↓
Backend validates token
         ↓
Return user data (isNewUser, isProfileComplete, user)
         ↓
Navigate based on response
```

## 📱 Screen Flow

### LoginScreen.tsx

**What it does:**
- Collects 10-digit phone number
- Validates phone format (must start with 6-9)
- Calls Firebase `signInWithPhoneNumber`
- Navigates to OTP screen with confirmation object

**Console logs:**
```
📱 Sending OTP to: +919876543210
✅ OTP sent successfully
```

### OtpVerifyScreen.tsx

**What it does:**
1. Collects 6-digit OTP
2. Verifies OTP with Firebase
3. Gets Firebase ID token
4. Stores token in AsyncStorage
5. Calls backend `/auth/sync` endpoint
6. Validates user role and profile status
7. Navigates to appropriate screen

**Console logs:**
```
🔐 Verifying OTP with Firebase...
✅ Firebase OTP verified successfully
👤 User: firebase_uid_string
🔑 Getting Firebase ID token...
🔑 Firebase ID Token: eyJhbGciOiJSUzI1NiIsImtpZCI6...
🔑 Token preview: eyJhbGciOiJSUzI1NiIsImtpZCI6IjBiZGYxNmRhOTlhN...
💾 Token stored in AsyncStorage
📡 Calling /auth/sync endpoint...
📡 Response status: 200
📡 Response data: { message: "User authenticated", data: { user: {...}, isNewUser: false, isProfileComplete: true } }
📊 Sync response: { isNewUser: false, isProfileComplete: true, userName: "John Doe", userRole: "DRIVER" }
✅ Authentication successful, navigating to main app...
```

## 🔑 Token Management

### Storage

Tokens and user data are stored using `AsyncStorage`:

```typescript
// Store token
await tokenStorage.setToken(idToken);

// Get token
const token = await tokenStorage.getToken();

// Store user data
await tokenStorage.setUserData(userData);

// Get user data
const userData = await tokenStorage.getUserData();

// Clear all (logout)
await tokenStorage.clearAll();
```

### Token Usage

The `authService.ts` automatically includes the Firebase ID token in all API requests:

```typescript
const headers = await createHeaders();
// Returns:
// {
//   'Content-Type': 'application/json',
//   'Authorization': 'Bearer <firebase_id_token>'
// }
```

## 📡 API Endpoints

### POST /api/auth/sync

**Purpose:** Check if user exists in backend and get user data

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:**
```json
{}
```

**Response (Existing Driver):**
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
      "firebaseUid": "firebase_uid_string"
    },
    "isNewUser": false,
    "isProfileComplete": true
  },
  "error": null
}
```

**Response (New User):**
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

### GET /api/auth/me

**Purpose:** Get current user profile

**Usage:**
```typescript
import { getCurrentUser } from '../services/authService';

const response = await getCurrentUser();
console.log('User:', response.data.user);
```

### PUT /api/auth/profile

**Purpose:** Update user profile

**Usage:**
```typescript
import { updateProfile } from '../services/authService';

const response = await updateProfile({
  name: 'Updated Name',
  email: 'newemail@example.com'
});
```

## 🎭 User Flow Scenarios

### Scenario 1: Existing Driver (Happy Path)
```
1. Enter phone number → OTP sent
2. Enter OTP → Firebase verifies
3. Backend sync → User found
4. Role check → DRIVER ✅
5. Navigate → Main Dashboard
```

### Scenario 2: New User (Not Registered)
```
1. Enter phone number → OTP sent
2. Enter OTP → Firebase verifies
3. Backend sync → User not found
4. Show alert → "Contact administration"
5. Sign out → Return to login
```

### Scenario 3: Wrong Role (Not a Driver)
```
1. Enter phone number → OTP sent
2. Enter OTP → Firebase verifies
3. Backend sync → User found
4. Role check → CUSTOMER/ADMIN ❌
5. Show alert → "This app is for drivers only"
6. Sign out → Return to login
```

### Scenario 4: Incomplete Profile
```
1. Enter phone number → OTP sent
2. Enter OTP → Firebase verifies
3. Backend sync → User found
4. Profile check → Incomplete
5. Navigate → Profile Onboarding
```

## 🐛 Debugging

### Enable Metro Bundler Logs

Run the app and watch console logs:
```bash
npm start
```

### Check Token in Console

Every API call logs the Firebase ID token:
```
🔑 Firebase ID Token: eyJhbGciOiJSUzI1NiIsImtpZCI6...
🔑 Token preview: eyJhbGciOiJSUzI1NiIsImtpZCI6IjBiZGYxNmRhOT...
```

Copy this token to test backend APIs manually:
```bash
curl -X POST https://your-backend.com/api/auth/sync \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Common Issues

**Issue:** "Network request failed"
- **Fix:** Check if backend URL is correct in `api.ts`
- For Android emulator, use `http://10.0.2.2:3000/api`
- For physical devices, use computer's IP address

**Issue:** "Failed to sync user"
- **Fix:** Check backend server is running
- Verify Firebase token is valid
- Check backend logs for errors

**Issue:** "Invalid token"
- **Fix:** Token expired, re-authenticate
- Check Firebase configuration

## 🔐 Security Best Practices

1. **Never log tokens in production**
   - Remove console.log statements before release
   - Use environment-based logging

2. **Token Expiration**
   - Firebase tokens expire after 1 hour
   - Implement token refresh logic
   - Handle 401 errors gracefully

3. **Secure Storage**
   - Uses AsyncStorage for token storage
   - Consider using react-native-keychain for production

4. **HTTPS Only**
   - Always use HTTPS in production
   - Enable certificate pinning for added security

## 📦 Dependencies

Required packages (already installed):
```json
{
  "@react-native-firebase/app": "^23.7.0",
  "@react-native-firebase/auth": "^23.7.0",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

## 🚀 Next Steps

1. **Replace Backend URL** in [src/config/api.ts](src/config/api.ts)
2. **Test with your backend** using test phone numbers
3. **Implement delivery batch APIs** using the same pattern
4. **Add error handling** for network failures
5. **Implement token refresh** logic
6. **Remove debug logs** before production

## 📚 Related Documentation

- [Driver Integration Docs](Driver_integration_docs) - Complete backend API documentation
- [Firebase Auth Docs](https://rnfirebase.io/auth/usage) - React Native Firebase documentation
- [AsyncStorage Docs](https://react-native-async-storage.github.io/async-storage/) - AsyncStorage documentation

## 💡 Tips

1. **Test with Firebase Test Numbers**
   - Add test numbers in Firebase Console
   - Use predefined OTPs (e.g., 123456)
   - No SMS charges

2. **Use ngrok for Testing**
   ```bash
   ngrok http 3000
   # Copy the https URL to api.ts
   ```

3. **Monitor Network Calls**
   - Use React Native Debugger
   - Check Network tab for API calls
   - Verify request headers include token

---

**Need Help?** Check the console logs - they show every step of the authentication process with emoji markers for easy identification! 🚀
