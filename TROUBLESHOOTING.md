# 🔧 Troubleshooting Guide

## ❌ Error: JSON Parse error: Unexpected character: <

### What This Means
The backend is returning HTML instead of JSON. This usually means:
- Backend server is not running
- Backend URL is incorrect
- Wrong API endpoint

### How to Fix

#### Step 1: Check Backend URL

Open [src/config/api.ts](src/config/api.ts):

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://your-backend-domain.com/api',  // ⚠️ Check this!
  // ...
};
```

**Important:** The URL depends on where your backend is running:

| Backend Location | URL to Use |
|-----------------|------------|
| **Android Emulator + Local Backend** | `http://10.0.2.2:3000/api` |
| **Physical Device + Local Backend** | `http://192.168.1.XXX:3000/api` (your computer's IP) |
| **ngrok tunnel** | `https://abc123.ngrok.io/api` |
| **Deployed backend** | `https://api.yourdomain.com/api` |

#### Step 2: Find Your Computer's IP Address

**On Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi/Ethernet adapter
# Example: 192.168.1.105
```

**On Mac/Linux:**
```bash
ifconfig | grep "inet "
# or
ip addr show
```

Then update `api.ts`:
```typescript
BASE_URL: 'http://192.168.1.105:3000/api',  // Replace with YOUR IP
```

#### Step 3: Verify Backend Server is Running

**Check if backend is running:**
```bash
cd your-backend-folder
npm start  # or however you start your backend
```

**Expected output:**
```
Server running on port 3000
MongoDB connected
```

#### Step 4: Test Backend URL Manually

**Test with curl:**
```bash
# Replace with your backend URL
curl http://10.0.2.2:3000/api/auth/sync

# Expected: JSON response
# Wrong: HTML page or "Cannot GET /api/auth/sync"
```

**Test with browser:**
Open: `http://YOUR_IP:3000/api/auth/sync`
- Should see JSON, not HTML error page

#### Step 5: Check Backend CORS Settings

Your backend must allow requests from React Native. In Express:

```javascript
// backend/server.js or app.js
const cors = require('cors');

app.use(cors({
  origin: '*',  // For development
  credentials: true
}));
```

#### Step 6: Check Console Logs

The app now logs detailed information:

```
🌐 Full URL: http://10.0.2.2:3000/api/auth/sync
📡 Response status: 200
📡 Response text preview: <!DOCTYPE html><html><head>...

👆 If you see HTML in "Response text preview", the URL is wrong!
```

**What to look for:**
- ✅ Response text starts with `{` (JSON)
- ❌ Response text starts with `<` (HTML)

### Quick Fix Checklist

- [ ] Backend server is running (`npm start`)
- [ ] Backend URL is correct in `src/config/api.ts`
  - [ ] Using `10.0.2.2` for Android emulator
  - [ ] Using actual IP for physical device
- [ ] Backend accepts `/api/auth/sync` POST endpoint
- [ ] CORS is enabled on backend
- [ ] Phone and backend are on same WiFi (if using IP)

## Other Common Errors

### Error: Network request failed

**Causes:**
- No internet connection
- Backend server not reachable
- Firewall blocking connection

**Fix:**
1. Check internet connection
2. Ping backend server: `ping 192.168.1.105`
3. Disable firewall temporarily (Windows Defender, etc.)
4. Check if backend is running on correct port

### Error: Unauthorized / 401

**Causes:**
- Firebase token expired
- Backend not validating token correctly
- Token not sent in headers

**Fix:**
1. Check console for token: `🔑 Firebase ID Token: ...`
2. Verify backend receives Authorization header
3. Check backend Firebase Admin SDK configuration

### Error: Failed to send OTP

**Causes:**
- Invalid phone number
- Firebase quota exceeded
- Firebase not configured correctly

**Fix:**
1. Check phone number format: `+919876543210`
2. Enable Phone Auth in Firebase Console
3. Check Firebase project settings
4. Use test phone numbers for development

### Error: Invalid OTP

**Causes:**
- Wrong OTP entered
- OTP expired (valid for 60 seconds)
- Test phone number not configured

**Fix:**
1. Check the OTP received via SMS
2. Use Firebase test numbers with predefined OTP
3. Resend OTP if expired

## Testing Tips

### Use Firebase Test Phone Numbers

1. Go to Firebase Console → Authentication → Sign-in method
2. Scroll to "Phone numbers for testing"
3. Add test numbers:
   - Phone: `+919876543210`
   - OTP: `123456`

No SMS charges, instant testing! 📱

### Use ngrok for Easy Testing

```bash
# In your backend folder
ngrok http 3000

# Copy the https URL
# https://abc123.ngrok.io

# Update api.ts
BASE_URL: 'https://abc123.ngrok.io/api'
```

### Check React Native Logs

```bash
# In your project folder
npm start

# Open another terminal
npx react-native log-android  # For Android
npx react-native log-ios      # For iOS
```

Watch for console.log messages with emojis! 🔍

## Still Having Issues?

### Enable Verbose Logging

The app already logs everything! Check your console for:
- 📱 Phone operations
- 🔐 OTP verification
- 🔑 Token operations
- 📡 API calls
- ✅ Success messages
- ❌ Error details

### Copy Full Error Log

When asking for help, include:
1. Full console error message
2. Backend URL from `api.ts`
3. Backend server logs
4. Screenshots of error alerts

### Manual API Test

```bash
# 1. Get your Firebase token from console logs
# Look for: 🔑 Firebase ID Token: eyJhbGci...

# 2. Test the API manually
curl -X POST http://YOUR_BACKEND:3000/api/auth/sync \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. Check response
# Should be JSON, not HTML!
```

## Quick Fixes for Common Scenarios

### "I'm using Android Emulator"
```typescript
// src/config/api.ts
BASE_URL: 'http://10.0.2.2:3000/api'
```

### "I'm using a physical Android phone"
```typescript
// src/config/api.ts
BASE_URL: 'http://YOUR_COMPUTER_IP:3000/api'
// Example: 'http://192.168.1.105:3000/api'
```

### "I'm using iOS Simulator"
```typescript
// src/config/api.ts
BASE_URL: 'http://localhost:3000/api'
```

### "My backend is on a cloud server"
```typescript
// src/config/api.ts
BASE_URL: 'https://api.yourdomain.com/api'
```

---

**Remember:** The console logs show EVERYTHING! Check them first! 🔍
