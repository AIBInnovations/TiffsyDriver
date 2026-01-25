# 🔧 Profile Not Saving to Backend - Fix

## समस्या (Problem)

जब user profile complete करता है, तो data backend में save नहीं हो रहा। इसलिए next login में backend कहता है "User not found"।

When user completes profile, data is not being saved to backend. That's why on next login, backend says "User not found".

## मूल कारण (Root Cause)

ProfileOnboarding screen में सिर्फ fake API call था:
```javascript
// ❌ OLD CODE
// Simulate API call
await new Promise(resolve => setTimeout(resolve, 1000));
```

Backend को data भेजा ही नहीं जा रहा था!

## ✅ Fix Applied

अब ProfileOnboarding screen real API call करती है:
```javascript
// ✅ NEW CODE
const response = await updateProfile({
  name: fullName,
  email: email,
  profileImage: '',
});
```

## ⚠️ Important: Driver Account Creation

**Backend documentation के अनुसार:**

> "Driver accounts cannot be self-registered. Only admins can create driver accounts."

इसका मतलब:

### Option 1: Admin Creates Account (Recommended)
```
1. Admin creates driver account in backend
   - Phone: +919522455243
   - Role: DRIVER
   - Status: ACTIVE

2. Driver logs in with phone number
   ↓
3. Backend returns: isNewUser=false, isProfileComplete=false
   ↓
4. Driver completes profile (name, email, vehicle details)
   ↓
5. Profile saved via PUT /api/auth/profile
   ↓
6. Next login: Goes directly to Main App ✅
```

### Option 2: Self-Registration (Needs Backend Update)
```
1. Driver logs in with phone number
   ↓
2. Backend returns: isNewUser=true
   ↓
3. Driver completes profile
   ↓
4. Backend creates driver account automatically
   ↓
5. Next login: Goes directly to Main App ✅
```

## 🔧 Backend Changes Needed

### Change 1: PUT /api/auth/profile - Accept Vehicle Details

Currently backend only accepts:
```javascript
{
  name: string,
  email: string,
  profileImage: string
}
```

**Need to update to accept:**
```javascript
{
  name: string,
  email: string,
  profileImage: string,
  vehicleType: "BIKE" | "SCOOTER" | "CAR",  // ⭐ Add
  vehicleNumber: string,                     // ⭐ Add
  licenseNumber: string                      // ⭐ Add (if needed)
}
```

Backend code update:
```javascript
// Backend: /api/auth/profile endpoint

const updateProfile = async (req, res) => {
  const { name, email, profileImage, vehicleType, vehicleNumber, licenseNumber } = req.body;

  const user = await User.findById(req.user._id);

  // Update fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (profileImage) user.profileImage = profileImage;
  if (vehicleType) user.vehicleType = vehicleType;  // ⭐ Add
  if (vehicleNumber) user.vehicleNumber = vehicleNumber;  // ⭐ Add
  if (licenseNumber) user.licenseNumber = licenseNumber;  // ⭐ Add (optional)

  // ⭐ Mark profile as complete
  user.isProfileComplete = !!(
    user.name &&
    user.email &&
    user.vehicleType &&
    user.vehicleNumber
  );

  await user.save();

  res.json({
    message: "Profile updated",
    data: {
      user: user,
      isProfileComplete: user.isProfileComplete
    }
  });
};
```

### Change 2: Create Driver Account on Registration (Optional)

If you want to allow self-registration, add this logic:

```javascript
// Backend: /api/auth/sync endpoint

const syncUser = async (req, res) => {
  const { uid, phone_number } = req.user; // From Firebase token

  let user = await User.findOne({ firebaseUid: uid });

  if (!user) {
    // ⭐ Auto-create driver account
    user = await User.create({
      firebaseUid: uid,
      phone: phone_number,
      role: 'DRIVER',
      status: 'ACTIVE',
      isProfileComplete: false
    });

    return res.json({
      message: "User created",
      data: {
        user: user,
        isNewUser: true,
        isProfileComplete: false
      }
    });
  }

  // Existing user
  res.json({
    message: "User authenticated",
    data: {
      user: user,
      isNewUser: false,
      isProfileComplete: user.isProfileComplete || false
    }
  });
};
```

## 📱 App Flow After Fix

### First Time Registration:
```
1. Enter phone: +919522455243
2. Enter OTP
3. Backend: "User not found" → isNewUser=true
4. Fill profile form:
   - Name: John Doe
   - Email: john@example.com
   - Vehicle Type: BIKE
   - Vehicle Number: MH12AB1234
5. Click Submit
6. App calls: PUT /api/auth/profile
7. Backend saves profile
8. Navigate to Main App ✅
```

### Next Login:
```
1. Enter phone: +919522455243
2. Enter OTP
3. Backend: isNewUser=false, isProfileComplete=true
4. Navigate directly to Main App ✅ (No profile screen!)
```

## 🧪 Testing

### Test Case 1: Admin Creates Account First
```bash
# 1. Admin creates driver in backend
POST /api/admin/drivers
{
  "phone": "+919522455243",
  "role": "DRIVER",
  "status": "ACTIVE"
}

# 2. Driver logs in and completes profile
# 3. Next login should go to Main App
```

### Test Case 2: Self-Registration (After Backend Update)
```bash
# 1. Driver logs in with new phone number
# 2. Backend auto-creates account
# 3. Driver completes profile
# 4. Next login should go to Main App
```

## 📋 Checklist

- [x] App now calls real API (updateProfile)
- [x] Profile data logged to console
- [ ] Backend accepts vehicleType and vehicleNumber
- [ ] Backend sets isProfileComplete = true after profile save
- [ ] Backend auto-creates driver account (or admin creates manually)

## 🎯 What You Need to Do

### Immediate Action:
1. **Check backend logs** - क्या PUT /api/auth/profile call आ रही है?
2. **Update backend** - Vehicle details accept करें
3. **Set isProfileComplete** - Profile save होने पर true करें

### Backend Developer को बताएं:

> "Please update PUT /api/auth/profile endpoint to accept vehicleType and vehicleNumber fields, and set isProfileComplete=true when all required fields are filled."

```javascript
// Backend changes needed:
{
  name: string,
  email: string,
  vehicleType: string,  // ⭐ ADD THIS
  vehicleNumber: string, // ⭐ ADD THIS
}

// After saving:
user.isProfileComplete = !!(user.name && user.email && user.vehicleType && user.vehicleNumber);
```

## 🔍 Debug

Console में ये logs दिखेंगे:
```
💾 Saving profile to backend...
📝 Profile data: {
  name: "John Doe",
  email: "john@example.com",
  vehicleType: "BIKE",
  vehicleNumber: "MH12AB1234"
}
📡 Calling /auth/profile endpoint...
📡 Response status: 200
✅ Profile saved successfully!
```

अगर error आए:
```
❌ Error saving profile: User not found
```

तो इसका मतलब backend में driver account नहीं है। Admin को पहले create करना होगा।

---

## Summary

- ✅ App अब profile data backend को भेजती है
- ⚠️ Backend को vehicle fields accept करने होंगे
- ⚠️ Backend को isProfileComplete = true set करना होगा
- 💡 Admin को driver account create करना होगा (या backend में auto-create logic add करना होगा)

Fix होने के बाद, profile एक ही बार भरनी होगी! 🎉
