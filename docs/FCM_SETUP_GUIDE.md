# FCM Push Notifications - Quick Setup Guide

## What Was Implemented

✅ **FCM Token Management**
- Token registration on login
- Token removal on logout
- Automatic token refresh handling

✅ **Notification Handlers**
- Foreground notifications (shows alert)
- Background notifications (system tray)
- Notification tap actions (navigation)
- App opened from quit state

✅ **Android Configuration**
- POST_NOTIFICATIONS permission added
- Firebase Messaging dependency added
- Google Services plugin configured

✅ **Service Module**
- Created `src/services/fcmService.ts` with all FCM functionality
- Device ID tracking
- Permission request handling

## Next Steps

### 1. Build the App (Required)

Since we added new native dependencies, you **must** rebuild the app:

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Build and run
npm run android
```

### 2. Verify Installation

After the app builds successfully, check the logs:

```bash
# In a separate terminal
npx react-native log-android
```

Look for these log messages:
- `🚀 Initializing FCM listeners in App.tsx...`
- `🔄 Setting up FCM token refresh listener...`

### 3. Test Login Flow

1. Open the app
2. Login with phone number and OTP
3. Look for these logs:
   ```
   🔔 Registering FCM token for push notifications...
   📱 Device Type: ANDROID
   📱 Device ID: <unique-device-id>
   📡 FCM Registration Response: { success: true, message: "FCM token registered" }
   ✅ FCM token registered successfully
   ```

### 4. Test Logout Flow

1. Go to Profile → Logout
2. Look for these logs:
   ```
   🔔 Removing FCM token from backend...
   📡 FCM Removal Response: { success: true, message: "FCM token removed" }
   ✅ FCM token removed successfully
   ```

### 5. Test Notifications

#### Option A: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to "Cloud Messaging" → "Send your first message"
4. Fill in:
   - **Notification title**: "New Batch Available"
   - **Notification text**: "15 orders ready for pickup from Sharma Kitchen"
5. Click "Send test message"
6. Enter the FCM token from logs (search for "🔔 FCM Token:")
7. Send

#### Option B: Backend API
Your backend should send notifications using the FCM tokens stored in the database when batches are ready for pickup.

## Troubleshooting

### Build Fails
```bash
# Clear gradle cache
cd android
./gradlew clean
./gradlew --stop

# Clear React Native cache
cd ..
npm start -- --reset-cache

# Rebuild
npm run android
```

### "google-services.json" Missing Error
- Ensure `android/app/google-services.json` exists
- If missing, download from Firebase Console → Project Settings → Your Android App

### Notifications Not Working
1. **Check Permissions**: Go to App Settings → Notifications → Enable
2. **Check Token**: Search logs for "🔔 FCM Token:" - should not be null
3. **Check Registration**: Search logs for "✅ FCM token registered successfully"
4. **Check Backend**: Verify `/api/auth/fcm-token` endpoint is implemented and working

### Token Registration Fails
- Verify backend URL in `src/config/api.ts`
- Check if backend `/api/auth/fcm-token` endpoint exists
- Verify Firebase ID token is valid (check auth service logs)

## Files Changed

Here's a summary of what was modified:

1. **New Service**: [src/services/fcmService.ts](src/services/fcmService.ts)
2. **Login Flow**: [src/screens/auth/OtpVerifyScreen.tsx:106](src/screens/auth/OtpVerifyScreen.tsx#L106)
3. **Logout Flow**: [src/screens/profile/ProfileScreen.tsx:257](src/screens/profile/ProfileScreen.tsx#L257)
4. **App Init**: [App.tsx](App.tsx)
5. **Background Handler**: [index.js](index.js)
6. **Android Manifest**: [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)
7. **Android Build**: [android/app/build.gradle](android/app/build.gradle)

## Backend Requirements

Ensure your backend implements these endpoints:

### POST /api/auth/fcm-token
Registers FCM token for a user
```typescript
Request:
{
  fcmToken: string;
  deviceType: "ANDROID" | "IOS";
  deviceId: string;
}

Response:
{
  success: boolean;
  message: string;
}
```

### DELETE /api/auth/fcm-token
Removes FCM token
```typescript
Request:
{
  fcmToken: string;
}

Response:
{
  success: boolean;
  message: string;
}
```

## Notification Payload Format

When sending notifications from backend, use this format:

```json
{
  "notification": {
    "title": "New Batch Available",
    "body": "15 orders ready for pickup from Sharma Kitchen"
  },
  "data": {
    "kitchenId": "678a9b2c3d4e5f67890abce0",
    "mealWindow": "LUNCH",
    "batchCount": "2"
  }
}
```

## Support

For detailed implementation documentation, see [FCM_IMPLEMENTATION.md](FCM_IMPLEMENTATION.md)

For Firebase documentation: https://rnfirebase.io/messaging/usage
