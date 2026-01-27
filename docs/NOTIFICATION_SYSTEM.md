# Tiffsy Driver Notification System

## Overview
The Tiffsy Driver app has a comprehensive notification system that respects user preferences and works regardless of the driver's availability status. The system includes proper runtime permission handling for both Android and iOS platforms.

---

## ✅ Runtime Permission Handling (NEW)

### Automatic Permission Request
The app automatically requests notification permission after successful OTP verification during login. This ensures users can receive important delivery notifications right away.

### Permission Request Flow
```
1. User completes OTP verification ✓
2. App requests notification permission (native dialog)
3. User grants/denies permission
4. If denied: Show informational alert
5. If granted: Register FCM token and proceed
```

### Permission Re-request from Profile
If users initially denied permission, they can enable it later from the Profile screen:
- Navigate to **Profile → Notifications**
- If permission is denied, a yellow warning banner appears
- Tap **"Enable Notifications"** to request permission again
- If still denied, user must enable it manually in device settings

### Platform-Specific Implementation

#### Android 13+ (API Level 33+)
- Uses `PermissionsAndroid.request(POST_NOTIFICATIONS)`
- Shows native Android permission dialog
- Permission declared in AndroidManifest.xml
- Handles GRANTED, DENIED, and NEVER_ASK_AGAIN states

#### Android < 13
- No runtime permission needed
- Notifications work automatically

#### iOS
- Uses `messaging().requestPermission()`
- Shows native iOS permission alert
- Handles AUTHORIZED, PROVISIONAL, and DENIED states
- Permission prompt includes app name and standard iOS text

---

## Key Features

### ✅ 1. User-Controlled Notification Preferences
Drivers can control which notifications they receive through the Profile screen:

- **New Assignments** - Controls notifications for new delivery assignments
- **Batch Updates** - Controls notifications for batch-related updates (assigned, ready, updated, cancelled)

### ✅ 2. Works When Driver is OFFLINE
**Important:** Notifications work regardless of the driver's availability status:
- Driver status = **ONLINE** → Can accept new batches + Receives notifications
- Driver status = **OFFLINE** → Cannot accept new batches + Still receives notifications

The availability status only affects whether drivers can accept new work, not whether they receive notifications.

### ✅ 3. Android Notification Channels
Four distinct notification channels with different priorities:

| Channel | Purpose | Priority | Sound | Vibration |
|---------|---------|----------|-------|-----------|
| **Batch Updates** | Batch assignments, ready, updates | HIGH | Yes | Triple |
| **Deliveries** | Individual delivery updates | DEFAULT | Yes | Double |
| **Urgent** | Critical time-sensitive alerts | HIGH | Yes | Triple |
| **General** | Other app notifications | DEFAULT | Yes | Single |

---

## Notification Types

### Batch Notifications (Controlled by "Batch Updates" preference)
- `BATCH_READY` - New batches available for pickup
- `BATCH_ASSIGNED` - Batch assigned to you
- `BATCH_UPDATED` - Batch details changed
- `BATCH_CANCELLED` - Batch was cancelled

### Delivery/Assignment Notifications (Controlled by "New Assignments" preference)
- `ORDER_READY_FOR_PICKUP` - Order is ready
- `ORDER_PICKED_UP` - Order picked up confirmation
- `ORDER_OUT_FOR_DELIVERY` - Order is out for delivery
- `ORDER_DELIVERED` - Order delivered
- `ORDER_FAILED` - Delivery failed

---

## How It Works

### 1. Foreground Notifications (App Open)
```typescript
// When notification arrives
1. Check user preferences (newAssignment or batchUpdates)
2. If preference is DISABLED → Block notification
3. If preference is ENABLED → Display notification using notifee
4. User can tap notification → Navigate to relevant screen
```

### 2. Background Notifications (App Minimized)
```typescript
// When notification arrives
1. OS shows notification automatically
2. User taps notification → App opens
3. Check notification data → Navigate to relevant screen
```

### 3. Notification Preferences Sync
```typescript
// When user toggles preference in Profile
1. Update local storage immediately
2. Show "Saved" toast to user
3. Sync to backend in background (non-blocking)
4. Backend stores preferences for this device
```

---

## Technical Implementation

### Files Modified/Created

#### 1. `src/services/notificationChannels.ts` (NEW)
- Creates Android notification channels
- Maps notification types to channels
- Configurable sound, vibration, importance

#### 2. `src/services/fcmService.ts` (ENHANCED)
**New Functions:**
- `checkNotificationPermission()` - Checks if notification permission is granted (NEW)
- `requestNotificationPermission()` - Requests permission for Android & iOS (ENHANCED)
- `shouldShowNotification()` - Checks user preferences before displaying
- `syncNotificationPreferences()` - Syncs preferences to backend
- Enhanced `handleForegroundNotification()` - Respects preferences
- Enhanced `registerFCMToken()` - Sends preferences to backend

**Permission Handling:**
- Android 13+: Uses `PermissionsAndroid.request(POST_NOTIFICATIONS)`
- Android < 13: No runtime permission needed
- iOS: Uses `messaging().requestPermission()` with detailed logging
- Proper error handling and user feedback

#### 3. `src/screens/auth/OtpVerifyScreen.tsx` (ENHANCED)
- Calls `registerFCMToken()` after successful OTP verification
- Shows informational alert if permission is denied
- Non-blocking - doesn't prevent user from proceeding if permission denied
- Comprehensive logging for debugging

#### 4. `src/screens/profile/ProfileScreen.tsx` (ENHANCED)
- Imports `syncNotificationPreferences()`, `checkNotificationPermission()`, `requestNotificationPermission()`
- Automatically syncs to backend when user toggles preferences
- Non-blocking sync (doesn't wait for backend response)
- **NEW: Permission status checking**
  - `useFocusEffect` to check permission when screen is focused
  - State tracking for permission status
  - Yellow warning banner if permission denied
  - "Enable Notifications" button to re-request permission
  - Real-time permission status updates

#### 5. `App.tsx` (ENHANCED)
- Calls `createNotificationChannels()` on app start
- Initializes notification system properly

---

## Backend API

### POST `/api/auth/fcm-token`
**Request:**
```json
{
  "fcmToken": "device_fcm_token",
  "deviceType": "ANDROID", // or "IOS"
  "deviceId": "unique_device_id",
  "notificationPreferences": {
    "newAssignment": true,
    "batchUpdates": true,
    "promotions": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token registered successfully"
}
```

**Backend Should:**
1. Store FCM token with device ID
2. Store notification preferences for this device
3. When sending notifications:
   - Check if user has `batchUpdates: true` before sending batch notifications
   - Check if user has `newAssignment: true` before sending assignment notifications
   - Send to ALL devices regardless of driver's availability status (ONLINE/OFFLINE)

---

## Testing

### Test 1: Runtime Permission Request (NEW)
```bash
# First-time user flow:
# 1. Fresh install of the app
# 2. Complete login with phone number
# 3. Verify OTP
# Expected: Native permission dialog appears
# - Android 13+: "Allow Tiffsy Driver to send you notifications?"
# - iOS: Standard iOS notification permission alert

# Grant permission:
# Expected: Alert shows "FCM token registered successfully" in console
# - No blocking alert shown to user
# - User proceeds to Dashboard/Registration

# Deny permission:
# Expected: Informational alert appears
# - Title: "Notification Permission"
# - Message: "...You can enable it later in your Profile settings..."
# - User can still proceed to use the app
```

### Test 2: Permission Re-request from Profile (NEW)
```bash
# 1. Login with account that denied permission
# 2. Navigate to Profile screen
# Expected: Yellow warning banner appears above notification toggles
# - Title: "Notification Permission Required"
# - Message: "Enable notifications to receive important updates..."
# - Button: "Enable Notifications"

# 3. Tap "Enable Notifications"
# Expected: Permission dialog appears again
# - If granted: Banner disappears, toast shows "Notification permission granted"
# - If denied: Toast shows "Permission denied. Please enable in device settings"
```

### Test 3: Notification Preferences
```bash
# 1. Open app → Go to Profile
# 2. Toggle "Batch Updates" to OFF
# 3. Send BATCH_ASSIGNED notification
# Expected: No notification shown (blocked by client-side filter)

# 4. Toggle "Batch Updates" to ON
# 5. Send BATCH_ASSIGNED notification
# Expected: Notification shown (if permission granted)
```

### Test 4: Offline Driver Receives Notifications
```bash
# 1. Set driver status to OFFLINE (toggle in Dashboard)
# 2. Send BATCH_READY notification from backend
# Expected: Driver receives notification even when OFFLINE
# Note: Driver cannot accept batch until going ONLINE
```

### Test 5: Notification Navigation
```bash
# Foreground (app open):
# - Send BATCH_ASSIGNED notification
# - Expected: Notification banner appears (via notifee)
# - Tap notification → Navigate to My Batch screen

# Background (app minimized):
# - Send BATCH_READY notification
# - Expected: System notification appears
# - Tap notification → App opens to Available Batches
```

### Test 6: Permission Status Persistence (NEW)
```bash
# 1. Grant notification permission during login
# 2. Close app completely
# 3. Reopen app and go to Profile
# Expected: No warning banner (permission already granted)

# 4. Revoke permission from device settings
# 5. Return to app and navigate to Profile
# Expected: Yellow warning banner appears immediately
```

---

## Notification Flow Diagram

```
┌─────────────────────────────────────────────────┐
│  Backend sends notification via FCM             │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Firebase Cloud Messaging delivers to device    │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
          ┌──────────────────────┐
          │ App State?           │
          └──────────┬───────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   Foreground   Background    Quit
        │            │            │
        ▼            ▼            ▼
 Check Prefs    OS Shows    OS Shows
        │       Notification  Notification
        │            │            │
        ▼            │            │
 Show/Block          │            │
 Notification        │            │
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
              User Taps?
                     │
                     ▼
          Navigate to Screen
```

---

## Important Notes

1. **Preferences are checked on CLIENT side** - The app checks preferences before displaying notifications
2. **Backend should also respect preferences** - Backend should check preferences before sending to reduce unnecessary network traffic
3. **Availability status is SEPARATE** - Driver can be OFFLINE but still receive notifications
4. **Preferences sync in background** - UI doesn't wait for backend sync to complete
5. **Default is ALL ON** - If preferences not found, show all notifications

---

## Troubleshooting

### Problem: Notifications not appearing
**Check:**
1. **Runtime Permission Granted?** (Most common issue)
   - Open Profile screen → Check for yellow warning banner
   - Android: Settings → Apps → Tiffsy Driver → Notifications → Enabled?
   - iOS: Settings → Tiffsy Driver → Notifications → Allow Notifications?
   - Check console logs: Look for "✅ Notification permission granted" or "❌ denied"

2. **Notification Preference Enabled in Profile?**
   - Profile → Notifications → Toggle switches ON
   - Check console: "🔔 Batch notification - User preference: ENABLED"

3. **FCM Token Registered?**
   - Check console logs: "✅ FCM token registered successfully"
   - Look for FCM token in logs: "🔔 FCM Token: ..."

4. **Notification Channels Created? (Android only)**
   - Android Settings → App → Notifications → Categories
   - Should see: Batch Updates, Deliveries, Urgent, General

### Problem: Permission dialog not showing
**Check:**
1. **Android 13+ only**: Make sure device is running Android 13 (API 33) or higher
2. **Already granted/denied**: Permission dialog only shows once per app install
3. **Clear app data**: Uninstall and reinstall app to reset permission state
4. **Console logs**: Look for "📱 Android 13+: Requesting POST_NOTIFICATIONS permission"

### Problem: Permission denied - can't re-request
**Solutions:**
1. **Use Profile screen**: Navigate to Profile → Tap "Enable Notifications" button
2. **Manual enable**:
   - Android: Settings → Apps → Tiffsy Driver → Notifications → Enable
   - iOS: Settings → Tiffsy Driver → Notifications → Allow Notifications
3. **Nuclear option**: Uninstall app, reinstall, and grant permission when prompted

### Problem: Notification appears but doesn't navigate
**Check:**
1. `data.type` field in notification payload?
2. Navigation ref initialized in App.tsx?
3. Console logs for navigation errors?

### Problem: Preferences not syncing to backend
**Check:**
1. FCM token exists in AsyncStorage?
2. Auth token valid?
3. Backend endpoint `/api/auth/fcm-token` working?
4. Check network tab for API calls

---

## Future Enhancements

- [ ] Custom notification sounds per channel
- [ ] Notification history in app
- [ ] Rich notifications with images
- [ ] Notification actions (Accept/Reject from notification)
- [ ] Notification scheduling/quiet hours
- [ ] Per-kitchen notification preferences

---

## Quick Test Guide (For Developers)

### 1. Test Fresh Install Permission Flow
```bash
# Uninstall app completely
adb uninstall com.driversapp  # Android
# OR delete app from iOS device

# Install fresh build
# Login with phone number + OTP
# Watch for permission dialog after OTP verification
# Check console logs for permission status
```

### 2. Test Permission Denial Handling
```bash
# During login permission prompt: Tap "Deny" or "Don't Allow"
# Expected: Informational alert appears
# Proceed to Profile screen
# Expected: Yellow warning banner appears
# Tap "Enable Notifications" button
# Permission dialog appears again
```

### 3. Test Permission Granted Flow
```bash
# During login permission prompt: Tap "Allow"
# Expected: No blocking alert, proceed normally
# Navigate to Profile screen
# Expected: No warning banner, notification toggles visible
# Send test notification from backend
# Expected: Notification appears
```

### 4. Test Android 13+ Specific
```bash
# Requires Android 13+ device/emulator
# Enable verbose logging: adb logcat | grep "FCM\|Notification"
# Look for: "📱 Android 13+: Requesting POST_NOTIFICATIONS permission"
# Verify permission dialog shows system's native Android 13 style
```

### 5. Test iOS Specific
```bash
# Requires iOS device/simulator
# Look for console logs: "📱 iOS: Requesting notification permission"
# Verify iOS native permission alert appears
# Check for authorization status in logs
```

---

## Summary

✅ **Runtime permission handling** for Android 13+ and iOS
✅ **Automatic permission request** after successful login
✅ **Permission re-request** from Profile screen if initially denied
✅ **Real-time permission status** checking with warning banners
✅ **User preferences** control notification display
✅ **Notifications work when driver is OFFLINE**
✅ **Preferences sync to backend** automatically (non-blocking)
✅ **Android notification channels** properly configured
✅ **Comprehensive navigation** handling for all notification types
✅ **Production-ready implementation** with proper error handling

The notification system is now fully functional with complete permission management, respects user preferences, and ensures drivers never miss important updates while maintaining a great user experience!
