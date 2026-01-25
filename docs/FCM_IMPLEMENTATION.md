# FCM Push Notifications Implementation - Tiffsy Driver App

This document outlines the FCM (Firebase Cloud Messaging) push notifications implementation for the Tiffsy Driver app.

## Overview

The driver app now supports FCM push notifications for receiving real-time updates about:
- **Batch Ready for Pickup**: Notifications when new delivery batches are ready
- Other driver-specific notifications as defined by the backend

## Implementation Summary

### 1. Dependencies Installed
- `@react-native-firebase/messaging@23.7.0` - FCM messaging support

### 2. Files Created/Modified

#### New Files:
- **[src/services/fcmService.ts](src/services/fcmService.ts)** - FCM service module containing:
  - Token management (get, register, remove)
  - Notification permission handling
  - Foreground/background notification handlers
  - Deep linking support for notification actions
  - Token refresh listener

#### Modified Files:
- **[src/screens/auth/OtpVerifyScreen.tsx](src/screens/auth/OtpVerifyScreen.tsx:106)** - Added FCM token registration after successful login
- **[src/screens/profile/ProfileScreen.tsx](src/screens/profile/ProfileScreen.tsx:257)** - Added FCM token removal before logout
- **[App.tsx](App.tsx)** - Initialized FCM listeners on app startup
- **[index.js](index.js)** - Registered background message handler
- **[android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)** - Added POST_NOTIFICATIONS permission for Android 13+
- **[android/app/build.gradle](android/app/build.gradle)** - Added firebase-messaging dependency

## How It Works

### Login Flow (Token Registration)
1. User enters phone number and verifies OTP
2. After successful Firebase authentication and backend sync
3. App requests notification permissions (if not already granted)
4. FCM token is generated
5. Token is sent to backend via `POST /api/auth/fcm-token` with:
   - `fcmToken`: The FCM device token
   - `deviceType`: "ANDROID" or "IOS"
   - `deviceId`: Unique device identifier

### Logout Flow (Token Removal)
1. User clicks logout button
2. App removes FCM token from backend via `DELETE /api/auth/fcm-token`
3. Local token is cleared from AsyncStorage
4. User session is cleared and navigated to auth screen

### Notification Handling

#### Foreground Notifications
When the app is open and active:
- Notification is received via `messaging().onMessage()`
- Alert dialog is shown with notification title and body
- Data payload is processed for navigation/actions

#### Background Notifications
When the app is minimized but running:
- System displays notification in the notification tray
- Handled by `messaging().setBackgroundMessageHandler()` in [index.js](index.js)

#### Notification Opened App
When user taps on a notification:
- App is brought to foreground
- `messaging().onNotificationOpenedApp()` is triggered
- Data payload is processed and user is navigated to relevant screen (e.g., Dashboard)

#### App Opened from Quit State
When app is completely closed and notification is tapped:
- `messaging().getInitialNotification()` retrieves the notification
- User is navigated to the relevant screen

### Token Refresh
- FCM tokens can expire or change
- `messaging().onTokenRefresh()` listener automatically re-registers new tokens with backend
- Ensures notifications continue to work even after token changes

## Notification Data Payload (Driver App)

### Batch Ready for Pickup
```json
{
  "kitchenId": "678a9b2c3d4e5f67890abce0",
  "mealWindow": "LUNCH",
  "batchCount": "2"
}
```

**Notification Message:**
"New Batch Available! 15 orders ready for pickup from Sharma Kitchen"

**Action:** Navigates user to Dashboard to view available batches

## API Endpoints Used

### Register FCM Token
```
POST /api/auth/fcm-token
Headers:
  Authorization: Bearer <firebase_id_token>
  Content-Type: application/json
Body:
  {
    "fcmToken": "string",
    "deviceType": "ANDROID" | "IOS",
    "deviceId": "string"
  }
```

### Remove FCM Token
```
DELETE /api/auth/fcm-token
Headers:
  Authorization: Bearer <firebase_id_token>
  Content-Type: application/json
Body:
  {
    "fcmToken": "string"
  }
```

## Testing

### Prerequisites
1. Ensure `google-services.json` is present in `android/app/` directory
2. Backend server must be running and `/api/auth/fcm-token` endpoint must be implemented
3. Physical Android device or emulator with Google Play Services

### Test Steps

#### 1. Test Token Registration
```bash
# Run the app
npm run android

# Monitor logs
npx react-native log-android
```
- Login with phone number and OTP
- Check logs for: `✅ FCM token registered successfully`
- Verify token is sent to backend

#### 2. Test Foreground Notifications
- Keep app open and in foreground
- Send a test notification from Firebase Console or backend
- Alert should appear with notification content

#### 3. Test Background Notifications
- Minimize the app
- Send a test notification
- Notification should appear in system tray

#### 4. Test Notification Tap Action
- Receive a notification while app is in background
- Tap the notification
- App should open and navigate to Dashboard

#### 5. Test Token Removal
- Logout from the app
- Check logs for: `✅ FCM token removed successfully`
- Verify token is removed from backend

### Send Test Notification (Firebase Console)
1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Select the driver app
5. Add custom data (optional):
   ```
   Key: kitchenId, Value: 678a9b2c3d4e5f67890abce0
   Key: mealWindow, Value: LUNCH
   Key: batchCount, Value: 2
   ```
6. Send notification

## Permissions

### Android
- **POST_NOTIFICATIONS**: Required for Android 13+ (API level 33+)
- **INTERNET**: Already present, required for network communication

Permission request is handled automatically by the FCM service when requesting token.

## Storage Keys (AsyncStorage)

- `@fcm_token` - Stores the current FCM token locally
- `@firebase_id_token` - Firebase authentication token (existing)
- `@user_data` - User profile data (existing)

## Troubleshooting

### Token Registration Fails
- Check if `google-services.json` is present in `android/app/`
- Verify backend endpoint `/api/auth/fcm-token` is implemented
- Check network connectivity
- Review logs for specific error messages

### Notifications Not Received
- Verify FCM token is registered with backend (check logs)
- Ensure app has notification permissions granted
- Check if Google Play Services is installed (for Android)
- Verify backend is sending notifications with correct token

### Token Refresh Not Working
- Check logs for `🔄 FCM Token refreshed` message
- Verify backend endpoint accepts token updates
- Ensure listener is set up in [App.tsx](App.tsx)

### Background Handler Not Working
- Ensure `messaging().setBackgroundMessageHandler()` is registered in [index.js](index.js) BEFORE `AppRegistry.registerComponent()`
- Background handler runs in limited JS context - avoid complex operations

## Future Enhancements

1. **Rich Notifications**: Support images, action buttons
2. **Notification Channels**: Categorize notifications (batch alerts, updates, etc.)
3. **Sound/Vibration**: Custom notification sounds
4. **Badge Count**: Show unread notification count on app icon
5. **Local Notifications**: Schedule local reminders
6. **Notification History**: Store and display notification history in-app

## Additional Resources

- [React Native Firebase Messaging Docs](https://rnfirebase.io/messaging/usage)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Android Notification Permissions](https://developer.android.com/develop/ui/views/notifications/notification-permission)

## Notes

- FCM token registration is non-blocking - login will succeed even if token registration fails
- FCM token removal is non-blocking - logout will succeed even if token removal fails
- Token refresh happens automatically and re-registers with backend
- All FCM operations are logged with emoji prefixes (🔔, 🔄, ✅, ❌) for easy debugging
