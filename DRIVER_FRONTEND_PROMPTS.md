# Driver App - Frontend Implementation Prompts

**Copy-paste prompts for implementing each screen with AI assistance**

## Table of Contents
1. [Phone OTP Authentication](#phone-otp-authentication)
2. [Role Selection](#role-selection)
3. [Driver Registration Form](#driver-registration-form)
4. [Waiting for Approval](#waiting-for-approval)
5. [Registration Rejected](#registration-rejected)
6. [Driver Home Dashboard](#driver-home-dashboard)
7. [Available Batches List](#available-batches-list)
8. [Batch Details & Kitchen Pickup](#batch-details--kitchen-pickup)
9. [Active Delivery Screen](#active-delivery-screen)
10. [Delivery Confirmation Dialog](#delivery-confirmation-dialog)
11. [Failed Delivery Dialog](#failed-delivery-dialog)
12. [Batch Completion Summary](#batch-completion-summary)
13. [Delivery History](#delivery-history)
14. [Earnings Dashboard](#earnings-dashboard)
15. [Profile Settings](#profile-settings)

---

## Phone OTP Authentication

### Prompt
```
Create a Phone OTP authentication screen for a React Native driver app using Firebase Authentication:

Requirements:
1. Phone Input Screen:
   - Title: "Welcome to Tiffsy Driver"
   - Subtitle: "Enter your phone number to continue"
   - Phone input field with country code selector (default +91 for India)
   - Input validation: 10 digits, must start with 6-9
   - "Send OTP" button (disabled until valid phone entered)
   - Use @react-native-firebase/auth for Phone Auth
   - Show loading spinner during OTP send

2. OTP Verification Screen:
   - Display masked phone number at top (e.g., "+91 917***1765")
   - 6-digit OTP input using 6 individual text boxes
   - Auto-focus on first box
   - Auto-advance to next box on digit entry
   - Auto-submit when all 6 digits entered
   - Resend OTP button with 30-second countdown timer
   - "Edit Number" link to go back
   - Loading spinner during verification
   - Use Firebase to verify OTP

3. After OTP Verification Success:
   - Get Firebase ID token
   - Store token securely (AsyncStorage or SecureStore)
   - Call API: POST /api/auth/sync with token in Authorization header
   - Handle sync response based on isNewUser and approvalStatus

Design:
- Use Material Design or iOS Human Interface Guidelines
- Primary color for buttons
- Clean, professional look
- Large, easy-to-tap buttons (minimum 44pt height)
- Proper keyboard handling (auto-dismiss, smooth transitions)

Error Handling:
- Invalid phone number: Show inline error
- OTP send failed: Show toast with error message
- Invalid OTP: Show error below OTP boxes
- Network error: Show retry option
- Too many attempts: Show appropriate Firebase error

API Integration:
POST /api/auth/sync
Headers: { Authorization: "Bearer <firebase_token>" }
Response: { data: { isNewUser, user, approvalStatus, rejectionReason? } }

Navigation Logic:
- If isNewUser = true: Navigate to Role Selection
- If approvalStatus = "PENDING": Navigate to Waiting Screen
- If approvalStatus = "REJECTED": Navigate to Rejection Screen
- If approvalStatus = "APPROVED": Navigate to Driver Home
- If role != "DRIVER": Show error "This app is for drivers only"
```

---

## Role Selection

### Prompt
```
Create a role selection screen for new users in React Native:

UI Layout:
- App logo centered at top (80x80 or larger)
- Title: "Join Tiffsy" (large, bold)
- Subtitle: "How would you like to use Tiffsy?"
- Two large cards in a row or column:

Card 1 - Customer:
- Icon: Shopping bag or food bowl icon (large, 60x60)
- Title: "Order Food" (bold, 18pt)
- Description: "Get delicious meals delivered to your doorstep"
- Full-width touchable card with shadow
- On tap: Navigate to customer registration (different flow)

Card 2 - Driver:
- Icon: Scooter or delivery bike icon (large, 60x60)
- Title: "Deliver Food" (bold, 18pt)
- Description: "Earn money by delivering orders in your area"
- Full-width touchable card with shadow
- On tap: Navigate to Driver Registration Form

Design:
- Cards should be 48% width if in row, full width if column
- Rounded corners (12-16pt radius)
- Shadow depth: 4-6pt
- Padding: 20pt inside cards
- Use brand colors (primary for selected state)
- Add subtle press animation (scale down slightly on tap)
- Responsive layout for different screen sizes

Icons:
- Use react-native-vector-icons or @expo/vector-icons
- Customer: Ionicons "fast-food" or "cart"
- Driver: Ionicons "bicycle" or "car-sport"

Accessibility:
- Add proper accessibility labels
- Screen reader support
- Minimum touch target: 44x44 pt
```

---

## Driver Registration Form

### Prompt
```
Create a comprehensive multi-section driver registration form in React Native:

Form Structure: Use ScrollView with sections

SECTION 1: Personal Information
- Header: "Personal Information" (bold, 16pt)
- Full Name TextInput:
  - Label: "Full Name *"
  - Placeholder: "John Doe"
  - Validation: Required, min 2 characters
  - Auto-capitalize words
- Email TextInput:
  - Label: "Email Address"
  - Placeholder: "john@example.com"
  - Validation: Valid email format (optional field)
  - Keyboard type: email-address
- Profile Photo Upload:
  - Label: "Profile Photo"
  - Touchable area showing camera icon or current photo
  - On tap: Show action sheet (Camera / Gallery / Cancel)
  - Use react-native-image-picker
  - Show loading indicator during upload
  - Display thumbnail preview after upload
  - X button to remove photo
  - Upload to Firebase Storage/S3, get URL

SECTION 2: License Details
- Header: "Driving License" (bold, 16pt)
- License Number TextInput:
  - Label: "License Number *"
  - Placeholder: "MH1234567890"
  - Validation: Required, non-empty
  - Auto-capitalize
- License Photo Upload:
  - Label: "License Photo *"
  - Large touchable area (200x120)
  - On tap: Show action sheet (Camera / Gallery / Cancel)
  - Show preview with zoom functionality
  - Helper text: "Upload clear photo of your license"
  - Loading during upload
  - X button to remove and reupload
- License Expiry Date:
  - Label: "License Expiry Date"
  - Date picker component
  - Validation: Must be future date
  - Display: "DD MMM YYYY" format

SECTION 3: Vehicle Information
- Header: "Vehicle Details" (bold, 16pt)
- Vehicle Name TextInput:
  - Label: "Vehicle Name/Model *"
  - Placeholder: "Honda Activa"
  - Validation: Required
- Vehicle Number TextInput:
  - Label: "Registration Number *"
  - Placeholder: "MH12AB1234"
  - Validation: Required, format /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/
  - Auto-uppercase
  - Show green checkmark when valid
- Vehicle Type Dropdown:
  - Label: "Vehicle Type *"
  - Options: Bike, Scooter, Bicycle, Other
  - Use Picker or custom dropdown
  - Material design bottom sheet on Android
  - iOS native picker

SECTION 4: Vehicle Documents (Dynamic List)
- Header: "Vehicle Documents" (bold, 16pt)
- Minimum 1 document required
- Each document row has:
  - Document Type Dropdown (RC, Insurance, PUC, Other) *required
  - Document Photo Upload *required
  - Expiry Date Picker (optional)
  - Delete button (red trash icon, only if > 1 document)
- "Add Another Document" button at bottom (+ icon)
- Smooth animations for add/remove

Form Footer:
- Checkbox: "I agree to Terms & Conditions *"
- "Submit Registration" button:
  - Full width
  - Primary color
  - Disabled until form valid
  - Show loading spinner during submission
  - Haptic feedback on press

Validation:
- Real-time validation on blur
- Show errors inline below each field
- Red border for invalid fields
- Asterisk (*) for required fields
- Scroll to first error on submit
- Disable submit until all required fields valid

Image Upload Function:
1. Open image picker (camera/gallery)
2. Compress image if > 2MB
3. Show upload progress indicator
4. Upload to storage service
5. Get URL back
6. Store URL in state
7. Show thumbnail preview

API Integration:
POST /api/auth/register-driver
Headers: { Authorization: "Bearer <firebase_token>", Content-Type: "application/json" }
Body: {
  name, email?, profileImage?,
  licenseNumber, licenseImageUrl, licenseExpiryDate?,
  vehicleName, vehicleNumber, vehicleType,
  vehicleDocuments: [{ type, imageUrl, expiryDate? }]
}

On Success:
- Navigate to Waiting for Approval screen
- Clear form data

Error Handling:
- Show validation errors inline
- Network error: Show retry with cached data
- Upload error: Allow retry for individual images
- 409 Conflict: "Account already exists"

Use Libraries:
- react-native-image-picker for images
- @react-native-firebase/storage or AWS S3 for uploads
- react-native-date-picker or @react-native-community/datetimepicker
- Formik or react-hook-form for form management
- Yup for validation schema
```

---

## Waiting for Approval

### Prompt
```
Create a waiting for approval screen in React Native for drivers pending admin approval:

UI Components:
1. Animated Illustration:
   - Lottie animation of hourglass or document review
   - Or static illustration (can use react-native-svg)
   - Center top, 200x200 size
   - Continuous subtle animation

2. Status Badge:
   - Text: "PENDING"
   - Background: Orange/amber (#FFA726 or similar)
   - Icon: Hourglass icon
   - Rounded corners, centered
   - 120px width

3. Title:
   - Text: "Registration Under Review"
   - Font size: 24pt, bold
   - Centered
   - Color: Dark gray

4. Description:
   - Text: "Your registration is being reviewed by our team. You'll be notified once it's approved."
   - Font size: 16pt, regular
   - Centered
   - Color: Medium gray
   - Max width: 80% of screen

5. Info Card:
   - Light background (#F5F5F5)
   - Rounded corners
   - Padding: 20pt
   - Icon: Info icon
   - Title: "What happens next?"
   - Points:
     • Usually takes 24-48 hours
     • You'll receive a push notification
     • Make sure notifications are enabled

6. Last Checked:
   - Small text: "Last checked: 2 minutes ago"
   - Color: Light gray
   - Bottom of card

7. Buttons:
   - Primary: "Check Status" button
     - Full width
     - Calls POST /api/auth/sync
     - Shows loading spinner during check
     - Updates last checked time
   - Secondary: "Contact Support" button
     - Outline style
     - Opens support (email/chat)

8. Logout Option:
   - Top right: Logout icon/text
   - Confirmation dialog before logout

Functionality:
- Pull-to-refresh to check status
- On app launch: Auto-call sync API
- If status changes to APPROVED: Navigate to Driver Home
- If status changes to REJECTED: Navigate to Rejection Screen
- Show success animation if approved
- Handle FCM notification: DRIVER_APPROVED

Auto-refresh:
- Check status every 5 minutes while on screen
- Stop when app goes to background
- Resume when app comes to foreground

Design:
- Calming colors (blue, green, not harsh red)
- Reassuring tone
- Professional look
- Not scary or negative
- Encouraging message

Libraries:
- lottie-react-native for animations (optional)
- react-native-vector-icons for icons
```

---

## Registration Rejected

### Prompt
```
Create a driver registration rejection screen in React Native:

UI Components:
1. Icon:
   - Warning icon (not error X)
   - Color: Orange/amber
   - Size: 80x80
   - Centered top

2. Status Badge:
   - Text: "REJECTED"
   - Background: Red (#F44336)
   - White text
   - Rounded corners

3. Title:
   - Text: "Registration Not Approved"
   - Font size: 24pt, bold
   - Color: Dark gray
   - Centered

4. Subtitle:
   - Text: "Your application needs attention"
   - Font size: 16pt
   - Color: Medium gray

5. Rejection Reason Card:
   - Background: Light red (#FFEBEE)
   - Border: 2pt solid red
   - Rounded corners
   - Padding: 16pt
   - Header: "Reason for rejection:" (bold)
   - Display rejection reason from API (props.rejectionReason)
   - Font: 16pt, readable
   - Icon: Info icon

6. "What You Can Do" Section:
   - Card with light background
   - Title: "What you can do" (bold, 16pt)
   - Bullet points:
     • Review and fix the issues mentioned above
     • Re-submit your application with correct information
     • Contact support if you need help
   - Use bullet point icons

7. Buttons:
   - Primary: "Re-apply"
     - Full width
     - Primary color (blue/green)
     - On tap: Navigate to Registration Form with pre-filled data
   - Secondary: "Contact Support"
     - Outline style
     - Opens support channel
   - Tertiary: "Logout" in header

Functionality:
- Load previous registration data from local storage
- On "Re-apply":
  1. Navigate to registration form
  2. Pre-fill all previous data
  3. Allow full editing
  4. Highlight likely problematic fields
  5. On submit: Call POST /api/auth/register-driver again

Storage:
- Save registration data to AsyncStorage on submission
- Retrieve on rejection screen
- Clear after successful approval

API Integration:
- Receive rejectionReason from sync API response
- Display reason prominently
- Store reason locally

Design:
- Empathetic, not punishing
- Helpful and actionable
- Not overly harsh with red color
- Show that fixing is straightforward
- Professional and respectful tone
- Use warm colors, not harsh
- Clear visual hierarchy

Error Prevention:
- If driver keeps getting rejected (3+ times):
  - Show prominent "Need Help?" section
  - Offer direct contact to support
  - Consider disabling re-apply until contact made
```

---

## Driver Home Dashboard

### Prompt
```
Create the main driver home dashboard screen in React Native:

Screen Layout:

HEADER:
- Left: Profile photo (40x40, circular, touchable → Profile screen)
- Center: Driver name + "Good morning/afternoon/evening"
- Right: Notification bell icon (with badge count if unread)
- Online/Offline toggle switch below header

MAIN CONTENT (ScrollView):

1. Current Batch Card (if active batch exists):
   - Background: Gradient or primary color
   - Batch number: "BTH-KRN-20250112-001"
   - Status badge: "Dispatched" / "In Progress" / etc.
   - Progress bar: "3 of 12 delivered"
   - Kitchen: Name + area
   - "View Details" button (secondary)
   - Primary action button (full width):
     - If DISPATCHED: "Navigate to Kitchen" (with location icon)
     - If IN_PROGRESS: "Continue Deliveries" (with delivery icon)
   - Shadow depth: 8pt
   - Rounded corners: 12pt

2. Empty State (if no active batch):
   - Illustration: Scooter or empty state graphic
   - Text: "No Active Deliveries"
   - Subtext: "Accept a batch to start earning"
   - "Find Batches" button (primary)

3. Quick Stats (3 cards in row):
   - Card 1: Today's Deliveries
     - Icon: Delivery box
     - Count: Large number
     - Label: "Deliveries"
   - Card 2: Today's Earnings
     - Icon: Money/rupee
     - Amount: ₹ 240
     - Label: "Earnings"
     - Color: Green
   - Card 3: Success Rate
     - Icon: Star
     - Percentage: 95%
     - Label: "Success Rate"
   - Each card: 32% width, shadow, rounded

4. Action Grid (2 columns):
   - "Available Batches" (with count badge)
   - "Delivery History"
   - "Earnings"
   - "Profile Settings"
   - Each tile: Icon + label, touchable, shadow

BOTTOM TAB NAVIGATION:
- Home (active)
- Batches
- History
- Profile

Functionality:
- On mount: Call GET /api/delivery/my-batch
- If batch exists: Show current batch card
- If no batch: Show empty state
- Auto-refresh batch status every 30 seconds if active
- Stop refresh when batch complete
- Pull-to-refresh enabled
- Handle FCM notification: NEW_BATCH_AVAILABLE (show badge)

Online/Offline Toggle:
- Visual switch component
- Update driver status on backend (future)
- Show toast when toggled
- Gray out when offline

API Calls:
- GET /api/delivery/my-batch (on mount, every 30s)
- GET /api/auth/me (for profile data)

Navigation:
- Current batch card → Batch Details screen
- Find Batches → Available Batches List
- Available Batches tile → Available Batches List
- History → Delivery History
- Earnings → Earnings Dashboard
- Profile → Profile Settings

Design:
- Clean, modern dashboard
- Card-based layout
- Good use of whitespace
- Primary color for important actions
- Icons for visual hierarchy
- Easy navigation
- Professional look

Libraries:
- react-navigation for navigation
- @react-navigation/bottom-tabs for tabs
- react-native-vector-icons for icons
```

---

## Available Batches List

### Prompt
```
Create an available batches listing screen in React Native:

HEADER:
- Title: "Available Batches"
- Subtitle: "First come, first served"
- Right: Refresh icon button

FILTER BAR:
- Sort dropdown: "Nearest" / "Most Orders" / "Highest Earnings"
- Optional: Zone filter (if multiple zones)

BATCH LIST (FlatList):

Each Batch Card:
- Container: White card with shadow, rounded corners (12pt)
- Margin between cards: 12pt

Card Content:
- Top Right: Batch number (small, gray)
- Row 1:
  - Kitchen name (bold, 18pt, black)
  - Zone name (14pt, gray)
- Row 2:
  - Order icon + count: "12 Orders"
  - Earnings icon + amount: "₹ 240" (green, bold)
  - Meal window badge: "LUNCH" / "DINNER" (pill shape)
- Row 3:
  - Location icon + distance: "2.3 km away"
  - (calculate from driver's location)
- Small Map Preview (optional):
  - 100% width, 100pt height
  - Show kitchen location pin
  - Tappable for full map
- Kitchen address (truncated, 1 line)
- "Accept Batch" button:
  - Full width
  - Primary color
  - Height: 48pt
  - Loading spinner when pressed

EMPTY STATE:
- Illustration: Empty box
- Title: "No Batches Available"
- Subtitle: "Check back soon or enable notifications"
- "Refresh" button

LOADING STATE:
- Skeleton loaders for 3-5 cards
- Shimmer effect

Functionality:
- Load batches: GET /api/delivery/available-batches
- FlatList with keyExtractor (batch._id)
- Pull-to-refresh (RefreshControl)
- Auto-refresh every 2 minutes
- On "Accept Batch":
  1. Show loading on button (disable all other accept buttons)
  2. Call POST /api/delivery/batches/:batchId/accept
  3. On success: Navigate to Batch Details screen
  4. On error 400 (already taken):
     - Show toast: "Batch taken by another driver"
     - Remove batch from list
     - Refresh list
  5. On other error: Show error message with retry

Distance Calculation:
- Get driver's current location (react-native-geolocation-service)
- Calculate distance to kitchen using Haversine formula
- Display in km with 1 decimal

Real-time Updates:
- Listen for FCM: NEW_BATCH_AVAILABLE
- On notification: Auto-refresh list
- Show new badge on newly added batches

Sorting Logic:
- Nearest: Sort by calculated distance
- Most Orders: Sort by orderCount descending
- Highest Earnings: Sort by estimatedEarnings descending

Design:
- Card-based layout
- Green for earnings (positive association)
- Clear visual hierarchy
- Easy-to-scan information
- Large, tappable accept buttons
- Use icons for better UX

Libraries:
- react-native-geolocation-service for location
- react-native-maps for map preview (optional)

API:
GET /api/delivery/available-batches
Response: { data: { batches: [...] } }
```

---

## Batch Details & Kitchen Pickup

### Prompt
```
Create a batch details screen for after accepting a batch, focusing on kitchen pickup flow:

STATE: DISPATCHED (Before Pickup)

HEADER:
- Back button
- Title: Batch number (e.g., "BTH-001")
- Status badge: "Dispatched" (yellow)

CONTENT (ScrollView):

1. Kitchen Information Card:
   - Card style with shadow
   - Kitchen name (bold, 20pt)
   - Full address (icon + text):
     - Street
     - Area, City, State
     - Pincode
   - Phone number with "Call Kitchen" button:
     - Icon: Phone
     - Action: Open phone dialer
   - Distance: "2.5 km away"

2. Map Section:
   - Height: 200pt
   - Show kitchen location pin
   - Show driver's current location
   - "Navigate to Kitchen" button overlaid:
     - Opens Google Maps/Apple Maps with directions
     - Large, prominent button

3. Orders Summary Card:
   - Header: "Orders to Pickup (12)"
   - Collapsible list of orders
   - Initially collapsed showing count
   - "View All Orders" to expand
   - When expanded:
     - Each order: Order number + items summary
     - Example: "ORD-001 • 2x Chicken Biryani, 1x Paneer..."
     - Customer area (not full address)

4. Pickup Checklist Card:
   - Title: "Pickup Checklist"
   - Description: "Verify each order before marking as picked up"
   - List of checkboxes:
     - One checkbox per order
     - [ ] ORD-001 - Verified
     - [ ] ORD-002 - Verified
     - etc.
   - Toggle checkboxes on tap
   - Visual feedback when all checked

5. Notes Input (Optional):
   - TextInput for pickup notes
   - Placeholder: "Any notes about the pickup..."
   - Max 200 characters

BOTTOM FIXED BUTTON:
- "Mark as Picked Up" button
  - Full width
  - Primary color
  - Height: 56pt
  - Disabled if no checkboxes checked (optional)
  - On press: Show confirmation dialog

Confirmation Dialog:
- Title: "Confirm Pickup"
- Message: "Confirm you have picked up all 12 orders?"
- Buttons:
  - "Cancel" (secondary)
  - "Yes, Picked Up" (primary)

On Confirm:
1. Call PATCH /api/delivery/batches/:batchId/pickup
   Body: { notes: "..." }
2. Show loading indicator
3. On success:
   - Show success toast: "Batch marked as picked up"
   - Navigate to Active Delivery Screen
4. On error:
   - Show error message
   - Allow retry

API Integration:
PATCH /api/delivery/batches/:batchId/pickup
Headers: { Authorization: "Bearer <token>" }
Body: { notes?: string }

Map Integration:
- Use react-native-maps for map display
- Get kitchen coordinates from batch data
- Open navigation:
  - iOS: Open Apple Maps with coordinates
  - Android: Open Google Maps with coordinates
  - Use Linking.openURL() with geo: URL scheme

Design:
- Clear visual hierarchy
- Large, easy-to-tap elements
- Use location pin icon for address
- Use phone icon for call button
- Map should be prominent
- Checklist should be clear and organized
- Bottom button should be very visible

Libraries:
- react-native-maps for map
- @react-native-community/geolocation for location
- react-native-vector-icons for icons
```

---

## Active Delivery Screen

### Prompt
```
Create an active delivery management screen in React Native for drivers during deliveries:

STATE: IN_PROGRESS (After Pickup)

LAYOUT: Split Screen

TOP HALF - MAP VIEW:
- Use react-native-maps
- Show all delivery locations as numbered pins
- Show driver's current location (blue dot)
- Show route to next delivery
- Next delivery pin: Different color (red/green)
- Completed deliveries: Gray pins
- Failed deliveries: Red pins
- Auto-center on driver location
- Tappable for fullscreen map
- Height: 40% of screen

BOTTOM HALF - DELIVERY LIST:
- Batch info bar at top:
  - Batch number
  - Status: "In Progress"
  - Progress: "3 of 12 delivered"
  - Progress bar (green/gray)

- FlatList of deliveries:
  - Sorted by sequence number
  - Current/next delivery highlighted (different background)

Each Delivery Card:
- Sequence badge: "#1", "#2", etc. (top left corner)
- Status indicator (colored dot):
  - Blue: Pending
  - Green: Delivered
  - Red: Failed
  - Yellow: Current
- Customer name: "John D." (first name + last initial)
- Address: "10th Cross, Koramangala 5th Block"
- Landmark (if available): "Near Park"
- Distance from current location: "1.2 km"
- Order items (collapsible):
  - "2x Chicken Biryani, 1x Paneer Tikka"
  - Expand to show full list
- Action buttons (row):
  - If next/current delivery:
    - "Navigate" button (primary)
    - "Call" button (secondary)
  - If delivered:
    - Green checkmark icon
    - Delivery time: "2:45 PM"
  - If failed:
    - Red X icon
    - Failure reason: "Customer unavailable"

Drag to Reorder:
- Long press on card to enable drag
- Visual feedback (lift animation)
- Drop to reorder
- "Save Order" button appears when changed
- On save: Call PATCH /api/delivery/batches/:batchId/sequence

CURRENT DELIVERY BOTTOM SHEET:
- Swipe up from bottom to expand
- Show full details of current delivery:
  - Customer full name
  - Complete address with map
  - Phone with "Call Customer" button
  - Order items list with quantities and prices
  - Delivery instructions (if any)
  - Special notes
- Action buttons:
  - "Mark as Delivered" (primary, full width)
  - "Mark as Failed" (secondary, outline, red)

Functionality:
- Auto-scroll to next pending delivery
- Update driver location in real-time
- Calculate distance to each delivery
- Show ETA (optional)
- Background location tracking
- On "Navigate": Open maps app with destination
- On "Call": Open phone dialer
- On "Mark as Delivered": Show OTP dialog
- On "Mark as Failed": Show failure reason dialog

Location Tracking:
- Request location permissions
- Use react-native-geolocation-service
- Update location every 10-15 seconds
- Show accuracy circle on map

API Calls:
- GET /api/delivery/my-batch (on mount)
- PATCH /api/delivery/batches/:batchId/sequence (reorder)
- PATCH /api/delivery/orders/:orderId/status (mark delivered/failed)

Map Features:
- Pin clustering for many orders (optional)
- Show optimal route line
- Zoom to fit all pins initially
- Follow driver location (optional toggle)

Design:
- Map prominent and functional
- Easy to scan delivery list
- Color coding: Green (delivered), Red (failed), Blue (pending), Yellow (current)
- Large, finger-friendly buttons
- Clear visual hierarchy
- Smooth animations
- Professional look

Libraries:
- react-native-maps for map
- react-native-geolocation-service for location
- react-native-draggable-flatlist for reordering
- @gorhom/bottom-sheet for bottom sheet
```

---

## Delivery Confirmation Dialog

### Prompt
```
Create a delivery confirmation dialog with OTP verification in React Native:

DIALOG/MODAL (react-native-modal or custom):
- Semi-transparent background (overlay)
- White card centered
- Rounded corners: 16pt
- Padding: 24pt
- Shadow

CONTENT:

1. Title:
   - Text: "Confirm Delivery"
   - Font: Bold, 20pt
   - Color: Dark gray
   - Centered

2. Subtitle:
   - Text: "Ask customer for their delivery OTP"
   - Font: Regular, 14pt
   - Color: Medium gray
   - Centered

3. OTP Input:
   - 4 individual text boxes
   - Each box: 60x60 pt
   - Border: 2pt, gray
   - Border color when filled: Primary color
   - Font size: 28pt, centered
   - Number keyboard
   - Auto-focus on first box
   - Auto-advance to next box on input
   - Auto-submit when all 4 filled
   - Use react-native-confirmation-code-field

4. Error Message (if invalid OTP):
   - Text: "Invalid OTP. Please check with customer."
   - Color: Red
   - Font: 14pt
   - Below OTP boxes
   - Animate in (slide + fade)

5. Optional Notes:
   - Label: "Delivery Notes (optional)"
   - TextInput (multiline)
   - Placeholder: "e.g., Delivered at door"
   - Max 200 characters
   - Character counter: "25/200"

6. Buttons (row):
   - "Cancel" button:
     - Secondary style (outline)
     - 48% width
     - On press: Close dialog
   - "Verify & Complete" button:
     - Primary style (filled)
     - 48% width
     - Disabled until 4 digits entered
     - Loading spinner when verifying
     - On press: Submit

Functionality:
1. Auto-focus first OTP box on mount
2. When 4 digits entered:
   - Auto-submit (or enable button)
   - Show loading on button
3. Call API: PATCH /api/delivery/orders/:orderId/status
   Body: {
     status: "DELIVERED",
     proofOfDelivery: { type: "OTP", otp: "1234" },
     notes: "..."
   }
4. On success:
   - Close dialog
   - Show success animation (checkmark)
   - Show toast: "Order delivered successfully!"
   - Update delivery card in parent list
   - Auto-scroll to next pending delivery
   - If last delivery: Show batch completion screen
5. On error (invalid OTP):
   - Show error message below OTP
   - Clear OTP inputs
   - Allow retry
   - Keep dialog open
   - Shake animation for OTP boxes
6. On network error:
   - Show error toast
   - Keep dialog open
   - Provide retry button

Validation:
- OTP must be exactly 4 digits
- Numbers only (0-9)

Animation:
- Dialog slide up from bottom with fade in
- OTP boxes scale slightly when focused
- Error message slide in from top
- Success: Checkmark animation (Lottie or custom)

Design:
- Clean, focused modal
- Large OTP boxes (easy to type)
- Clear call-to-action
- Green theme for success
- Professional look
- Good contrast

Libraries:
- react-native-modal for modal
- react-native-confirmation-code-field for OTP input
- lottie-react-native for success animation (optional)

API:
PATCH /api/delivery/orders/:orderId/status
Headers: { Authorization: "Bearer <token>" }
Body: { status: "DELIVERED", proofOfDelivery: { type: "OTP", otp: "1234" }, notes?: string }
```

---

## Failed Delivery Dialog

### Prompt
```
Create a failed delivery reporting dialog in React Native:

DIALOG/MODAL:
- Semi-transparent background
- White card centered
- Rounded corners: 16pt
- Padding: 24pt
- Shadow

CONTENT:

1. Header:
   - Warning icon (orange, 60x60)
   - Title: "Mark Delivery as Failed"
   - Subtitle: "Please select a reason"

2. Failure Reason Picker:
   - Label: "Reason *" (required indicator)
   - Dropdown/Picker component
   - Options (from API):
     1. Customer Unavailable
     2. Wrong Address
     3. Customer Refused
     4. Address Not Found
     5. Customer Unreachable
     6. Other
   - Material bottom sheet on Android
   - iOS native picker
   - Required field (red border if not selected)

3. Notes TextInput:
   - Label: "Additional Details"
   - Placeholder: "Describe what happened..."
   - Multiline (4 rows)
   - Max length: 200 characters
   - Character counter: "0/200"
   - Optional but recommended
   - If "Other" selected: Make required

4. Warning Message:
   - Light orange background
   - Info icon
   - Text: "Failed deliveries may affect your rating. Please ensure you've attempted delivery properly."
   - Font: 12pt
   - Padding: 12pt

5. Buttons:
   - "Cancel" button:
     - Outline style
     - Gray color
     - 48% width
   - "Submit" button:
     - Filled style
     - Orange/red color (warning)
     - 48% width
     - Disabled until reason selected
     - Loading spinner when submitting

CONFIRMATION STEP:
After "Submit" pressed, show second confirmation dialog:
- Title: "Are you sure?"
- Message: "This delivery will be marked as failed. This action cannot be undone."
- Buttons:
  - "Cancel" (secondary)
  - "Yes, Mark as Failed" (red, primary)

Functionality:
1. On mount: Focus on reason picker
2. Validation:
   - Reason must be selected
   - If "Other": Notes required
   - Show error messages inline
3. On Submit:
   - Show confirmation dialog
4. On Confirm:
   - Call API: PATCH /api/delivery/orders/:orderId/status
   Body: {
     status: "FAILED",
     failureReason: "CUSTOMER_UNAVAILABLE",
     notes: "..."
   }
5. On success:
   - Close both dialogs
   - Show toast: "Delivery marked as failed"
   - Update delivery card (red X, show reason)
   - Move to next pending delivery
6. On error:
   - Show error message
   - Allow retry
   - Keep dialog open

Design:
- Serious but not scary
- Use orange/amber (warning, not error)
- Make it clear this is significant
- Require confirmation
- Easy to cancel accidentally
- Professional tone
- Clear that this affects driver

Validation Rules:
- Reason: Required
- Notes: Optional (required if "Other")
- Notes max length: 200 chars

API:
PATCH /api/delivery/orders/:orderId/status
Headers: { Authorization: "Bearer <token>" }
Body: { status: "FAILED", failureReason: "CUSTOMER_UNAVAILABLE", notes?: string }

Response Status Codes:
- 200: Success
- 400: Validation error
- 403: Not assigned to order
- 500: Server error

Libraries:
- react-native-modal for modals
- @react-native-picker/picker for picker
```

---

## Batch Completion Summary

### Prompt
```
Create a batch completion summary screen in React Native, shown after completing a batch:

TRIGGER: Automatically navigate to this screen when last delivery is marked

ANIMATION (on mount):
- If all delivered: Success animation (Lottie confetti or checkmark)
- If some failed: Partial success animation
- Duration: 2 seconds

HEADER:
- Status Badge:
  - "COMPLETED" (green) if all delivered
  - "PARTIAL_COMPLETE" (yellow) if some failed
- Title: "Batch Complete!" (large, bold)
- Celebration icon (trophy or star)

CONTENT (ScrollView):

1. Delivery Statistics Card:
   - White card with shadow
   - Title: "Delivery Summary"
   - Stats in grid (2x2):
     Row 1:
       - Total Orders: 12 (icon: package)
       - Delivered: 11 (icon: checkmark, green)
     Row 2:
       - Failed: 1 (icon: X, red)
       - Success Rate: 92% (icon: star, large, prominent)
   - Each stat: Icon + number + label
   - Numbers: Large (32pt), bold
   - Labels: Small (14pt), gray

2. Earnings Card:
   - Background: Light green (#E8F5E9)
   - Border: Green (#4CAF50)
   - Title: "Earnings"
   - Amount: ₹ 240 (very large, 36pt, green, bold)
   - Breakdown:
     - Base: ₹ 200
     - Bonus: ₹ 40 (if applicable)
   - Note: "Earnings will be credited within 24 hours"
   - Icon: Money bag or rupee symbol

3. Time Summary Card:
   - Title: "Time Breakdown"
   - Stats:
     - Started: "1:15 PM"
     - Completed: "2:45 PM"
     - Duration: "1 hour 30 minutes"
   - Icon: Clock

4. Failed Deliveries Section (if any):
   - Title: "Failed Deliveries"
   - List of failed orders:
     - Order number
     - Customer area
     - Failure reason
   - Info text: "Admin will handle follow-up"
   - Icon: Info icon

BUTTONS (Bottom):
- Primary: "Find Next Batch"
  - Full width
  - Primary color
  - Navigate to Available Batches
  - Most prominent
- Secondary: "View Details"
  - Outline style
  - Navigate to Batch History detail
- Tertiary: "Back to Home"
  - Text button
  - Navigate to Home

OPTIONAL FEATURES:
- Share Achievement:
  - If success rate >= 90%: Show "Share" button
  - Generate image: "Delivered 12 orders with 92% success!"
  - Share to social media
- Feedback:
  - "Rate Your Experience" button
  - 5-star rating
  - Optional feedback text

Functionality:
1. Load batch data from navigation params or API
2. Calculate statistics
3. Display animations
4. Call PATCH /api/delivery/batches/:batchId/complete (if not auto-completed)
5. Update local state (remove from current batch)
6. Store in history
7. Handle navigation

Design:
- Celebratory if all delivered
- Encouraging even if some failed
- Clear visual separation of stats
- Use green for positive (delivered, earnings)
- Use red sparingly (failed)
- Professional yet friendly
- Card-based layout
- Good use of icons
- Large, readable numbers

Animations:
- Success: Confetti or checkmark (Lottie)
- Partial: Checkmark with small warning icon
- Stats: Count up animation for numbers
- Cards: Fade in sequentially (stagger)

Libraries:
- lottie-react-native for animations
- react-native-share for sharing (optional)

API:
PATCH /api/delivery/batches/:batchId/complete
Headers: { Authorization: "Bearer <token>" }
Body: { notes?: string }

Navigation:
- Cannot go back to active delivery
- Hardware back button: Go to home
- "Find Next Batch" → Available Batches List
- "View Details" → Batch History Detail
- "Back to Home" → Driver Home
```

---

## Delivery History

### Prompt
```
Create a delivery history screen in React Native showing past completed batches:

HEADER:
- Title: "Delivery History"
- Right: Filter icon

FILTER BAR (Tabs):
- "Today" (active by default)
- "This Week"
- "This Month"
- "Custom" (opens date range picker)

BATCH LIST (FlatList):

Each Batch Card:
- Container: White card with shadow
- Padding: 16pt
- Margin: 8pt vertical
- Rounded corners: 12pt

Card Layout:
- Row 1 (Header):
  - Batch number (small, gray, top left)
  - Date & time (right aligned)
    - If today: "Today, 1:15 PM"
    - If yesterday: "Yesterday, 2:30 PM"
    - Else: "Jan 10, 2025"
- Row 2:
  - Status badge:
    - "Completed" (green)
    - "Partial Complete" (yellow)
- Row 3:
  - Kitchen name (bold, 16pt)
  - Kitchen area (gray, 14pt)
- Row 4 (Stats in row):
  - Orders icon + "12"
  - Delivered icon + "11"
  - Failed icon + "1"
  - Small icons with numbers
- Row 5:
  - Success rate: "92%" (left)
  - Earnings: "₹ 240" (right, green, bold, large)
- Bottom:
  - "View Details" button (text/outline)

On Tap: Navigate to Batch Detail View

BATCH DETAIL VIEW:
- Full batch information
- Kitchen details (name, address, phone)
- Complete delivery list:
  - Order numbers
  - Customer areas (privacy)
  - Delivery times
  - Proof of delivery type (OTP verified, etc.)
  - For failed: Failure reason and notes
- Earnings breakdown
- Timeline:
  - Accepted at: time
  - Picked up at: time
  - Completed at: time
  - Duration: X hours Y minutes

EMPTY STATE:
- Illustration: Empty history book or calendar
- Title: "No Delivery History Yet"
- Subtitle: "Complete your first batch to see it here"

ANALYTICS SECTION (Top):
- Summary cards (3 in row):
  - Total Batches: Count
  - Total Deliveries: Count
  - Total Earnings: ₹ amount
- Swipeable carousel of stats

FUNCTIONALITY:
- Infinite scroll (load more on scroll)
- Pull-to-refresh
- Filter by date range
- Search by batch number
- API call: GET /api/delivery/batches with query params
- Cache history locally for offline viewing

FILTER MODAL:
- Date range picker
  - Start date
  - End date
- Status filter:
  - All
  - Completed
  - Partial Complete
- "Apply Filters" button
- "Reset" button

EXPORT OPTION:
- "Export Report" button in header menu
- Generate PDF or CSV
- Share via email/WhatsApp

Design:
- Card-based layout
- Clear visual hierarchy
- Easy to scan
- Use icons for quick recognition
- Green for earnings/success
- Gray for neutral info
- Red only for failed counts
- Professional look

Libraries:
- react-native-pdf for PDF generation (optional)
- react-native-share for sharing
- @react-native-community/datetimepicker for date picker

API:
GET /api/delivery/batches/:batchId (for detail view)
Query params for filtering: dateFrom, dateTo, status
```

---

## Earnings Dashboard

### Prompt
```
Create an earnings tracking and dashboard screen in React Native:

HEADER:
- Title: "Earnings"
- Right: Date range selector button

DATE RANGE TABS:
- "Today" (active)
- "This Week"
- "This Month"
- "All Time"
- Horizontal scrollable

SUMMARY SECTION:

1. Total Earnings Card (Large):
   - Background: Gradient (green shades)
   - White text
   - Amount: ₹ 1,240 (very large, 42pt, bold)
   - Label: "Total Earnings"
   - Comparison: "+15% from last week" (with arrow)
   - Icon: Money bag or coins

2. Breakdown Cards (3 in row):
   - Card 1: Deliveries
     - Icon: Package
     - Count: 42
     - Label: "Completed"
   - Card 2: Average
     - Icon: Average/chart
     - Amount: ₹ 30
     - Label: "Per Delivery"
   - Card 3: Bonuses
     - Icon: Gift/star
     - Amount: ₹ 200
     - Label: "Bonuses"

CHART SECTION:
- Title: "Earnings Over Time"
- Line chart or bar chart
- X-axis: Dates
- Y-axis: Earnings amount
- Interactive: Tap to see daily details
- Use react-native-chart-kit or Victory Native

EARNINGS LIST (FlatList):
- Title: "Recent Earnings"

Each Entry:
- Date (left)
- Batch number (small, below date)
- Orders count
- Base earnings
- Bonuses (if any, green "+₹50")
- Total earnings (right, bold)
- Payment status badge:
  - "Paid" (green)
  - "Pending" (yellow)
- Divider between entries

PAYMENT STATUS SECTION:
- Card with summary:
  - Pending Payment: ₹ 450 (yellow)
  - Paid This Month: ₹ 2,340 (green)
  - Next Payment Date: "Jan 15, 2025"
- Info icon with tooltip: "Payments processed weekly"

BANK DETAILS CARD:
- Title: "Bank Account"
- Masked account: "XXXX XXXX 4567"
- Bank name: "ICICI Bank"
- "Update Bank Details" button
- Navigate to settings/bank details screen

FILTER/SORT:
- Sort by: Date (newest first / oldest first)
- Filter by: Payment status (All / Paid / Pending)

EXPORT BUTTON:
- "Download Statement" button
- Generate PDF with earnings details
- Date range selection
- Share/save options

FUNCTIONALITY:
- API call: GET /api/earnings or similar endpoint
- Pull-to-refresh
- Infinite scroll for list
- Calculate totals client-side
- Store data locally for offline viewing
- Update on app foreground

Design:
- Financial/professional look
- Use green for positive (earnings, paid)
- Use yellow for pending
- Clear visual hierarchy
- Large, readable numbers
- Card-based layout
- Good use of icons
- Charts for visual representation

Libraries:
- react-native-chart-kit or victory-native for charts
- react-native-pdf for PDF generation
- react-native-share for sharing

Mock API (if not available):
- Create dummy data structure
- Show realistic numbers
- Use local state management
```

---

## Profile Settings

### Prompt
```
Create a comprehensive driver profile and settings screen in React Native:

LAYOUT (ScrollView):

PROFILE SECTION (Top Card):
- Large circular profile photo (120x120)
  - Touchable to change
  - Camera icon overlay
  - On tap: Show action sheet (Camera/Gallery/View/Remove)
- Driver name (large, bold, 20pt)
  - Below photo, centered
- Phone number (medium, gray, masked: "+91 917***1765")
- Email address (if available)
- Status indicator:
  - "Active" (green dot) or "Inactive" (gray dot)
- "Edit Profile" button (outline, centered)

DRIVER DETAILS SECTION:
- Title: "Driver Information"
- List items (icon + label + value):
  - License Number: MH1234567890
  - License Expiry: Dec 31, 2027
    - If expiring soon (< 30 days): Show warning badge
  - Vehicle Type: Scooter
  - Vehicle Number: MH12AB1234
- "Update Details" button at bottom

DOCUMENTS SECTION:
- Title: "Documents"
- List items (icon + label + action):
  - "View License" → Open image viewer
  - "View RC" → Open image viewer
  - "View Insurance" → Open image viewer
  - "Upload New Document" → Upload flow
- Each with chevron right icon

SETTINGS SECTIONS:

1. Notifications:
   - Title: "Notifications"
   - Toggle switches:
     - Push Notifications (master toggle)
     - New Batch Alerts
     - Earnings Updates
     - Promotional Messages
   - Each with description below

2. Preferences:
   - Title: "Preferences"
   - Language Selection
     - Current: English
     - On tap: Show language picker
   - Theme
     - Options: Light / Dark / System
     - Use picker or segmented control
   - Maps Preference
     - Google Maps / Apple Maps

3. Account:
   - Title: "Account"
   - List items with chevron:
     - Bank Details → Bank details screen
     - Documents → Documents screen
     - Verification Status → Status screen

4. Support:
   - Title: "Help & Support"
   - List items:
     - Help Center → Open help articles
     - Contact Support → Email/chat
     - FAQs → FAQ screen
     - Report Issue → Issue form
     - Terms & Conditions → WebView
     - Privacy Policy → WebView

5. About:
   - Title: "About"
   - List items:
     - App Version: 1.0.0
     - Rate Us → Open store rating
     - Share App → Share app link
     - Check for Updates → Check updates

LOGOUT:
- "Logout" button (red, outline, bottom)
- Or in header menu (3 dots)

LOGOUT FLOW:
1. Show confirmation dialog:
   - Title: "Logout"
   - Message: "Are you sure you want to logout?"
   - Buttons: "Cancel" / "Logout" (red)
2. On confirm:
   - Call DELETE /api/auth/fcm-token
   - Clear AsyncStorage/SecureStore
   - Clear Firebase auth
   - Navigate to Phone OTP screen

EDIT PROFILE FLOW:
- Show modal or navigate to new screen
- Form with current values:
  - Name (editable)
  - Email (editable)
  - Profile Image (upload new)
- "Save Changes" button
- API call: PUT /api/auth/profile
- On success: Update local state, show toast

UPDATE DOCUMENT FLOW:
- Show document upload screen
- Select document type
- Upload new image
- Optional: Expiry date
- Submit to backend

FUNCTIONALITY:
- Load user data: GET /api/auth/me
- Update profile: PUT /api/auth/profile
- Toggle settings: Store locally, sync with backend
- Image upload: Use react-native-image-picker
- Image viewer: react-native-image-viewing

Design:
- Clean, organized sections
- Use section headers (bold, gray background)
- List items with icons for better UX
- Separators between sections
- Profile section prominent at top
- Easy access to important settings
- Professional look
- Material Design or iOS native styling

Components:
- Profile photo: TouchableOpacity with Image
- List items: Custom component or RN FlatList
- Toggle switches: React Native Switch
- Modals: react-native-modal
- Image viewer: react-native-image-viewing
- Icons: react-native-vector-icons

API:
GET /api/auth/me
PUT /api/auth/profile { name?, email?, profileImage? }
DELETE /api/auth/fcm-token { fcmToken }

Storage:
- Store settings locally: AsyncStorage
- Store sensitive data: react-native-encrypted-storage
- Clear on logout
```

---

## End of Prompts

**Usage Instructions:**
1. Copy each prompt as needed
2. Paste into your AI assistant (ChatGPT, Claude, etc.)
3. Adjust specifics based on your tech stack
4. Add project-specific requirements
5. Iterate based on results

**Tech Stack Assumptions:**
- React Native
- Firebase Authentication & FCM
- AsyncStorage or SecureStore
- react-navigation
- react-native-vector-icons

**API Base URL:**
Replace `https://your-domain.com/api` with your actual backend URL in all prompts.

---

**Document Version:** 1.0
**Last Updated:** January 12, 2026
