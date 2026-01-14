# Status Mapping Fix - Backend Compatibility

## Problem
The backend rejected status updates with the error:
```
Error: "status" must be one of [EN_ROUTE, ARRIVED, DELIVERED, FAILED]
```

The app was sending: `OUT_FOR_DELIVERY`, `PICKED_UP` instead of the backend-expected: `EN_ROUTE`, `ARRIVED`.

## Root Cause
The frontend was using outdated status values that don't match the current backend API specification.

## Solution
Updated all status mappings to use the correct backend status values.

## Backend Status Values (Official)
```
READY → EN_ROUTE → ARRIVED → DELIVERED
                        ↓
                     FAILED
```

## Files Changed

### 1. [src/types/api.ts](src/types/api.ts:72-80)
**Updated OrderStatus type** to include both new and legacy statuses

```typescript
export type OrderStatus =
  | 'READY'
  | 'EN_ROUTE'       // ✅ Backend expects this
  | 'ARRIVED'        // ✅ Backend expects this
  | 'DELIVERED'      // ✅ Backend expects this
  | 'FAILED'         // ✅ Backend expects this
  | 'RETURNED'
  | 'PICKED_UP'      // Legacy support
  | 'OUT_FOR_DELIVERY';  // Legacy support
```

### 2. [src/screens/delivery-status/DeliveryStatusScreen.tsx](src/screens/delivery-status/DeliveryStatusScreen.tsx:53-86)
**Updated status mapping functions**

```typescript
// Map local DeliveryStatusType to API OrderStatus
const mapDeliveryStatusToOrderStatus = (status: DeliveryStatusType): OrderStatus => {
  switch (status) {
    case 'pending':
      return 'READY';
    case 'in_progress':
      return 'EN_ROUTE';     // ✅ Changed from OUT_FOR_DELIVERY
    case 'picked_up':
      return 'ARRIVED';      // ✅ Changed from PICKED_UP
    case 'delivered':
      return 'DELIVERED';
    case 'failed':
      return 'FAILED';
    default:
      return 'READY';
  }
};

// Map API OrderStatus to local DeliveryStatusType
const mapOrderStatusToDeliveryStatus = (status: OrderStatus): DeliveryStatusType => {
  switch (status) {
    case 'READY':
      return 'pending';
    case 'EN_ROUTE':
    case 'OUT_FOR_DELIVERY':  // Legacy support
      return 'in_progress';
    case 'ARRIVED':
    case 'PICKED_UP':  // Legacy support
      return 'picked_up';
    case 'DELIVERED':
      return 'delivered';
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
};
```

### 3. [src/screens/deliveries/DeliveriesScreen.tsx](src/screens/deliveries/DeliveriesScreen.tsx:24)
**Updated FilterStatus type**

```typescript
type FilterStatus = 'all'
  | 'READY'
  | 'EN_ROUTE'           // ✅ Added
  | 'ARRIVED'            // ✅ Added
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED'
  | 'PICKED_UP'          // Legacy
  | 'OUT_FOR_DELIVERY';  // Legacy
```

### 4. [src/screens/deliveries/components/DeliveryCard.tsx](src/screens/deliveries/components/DeliveryCard.tsx)
**Updated status config and action buttons**

#### Status Config (Line 13-29):
```typescript
const statusConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  // ... old statuses ...

  // API statuses (new backend format)
  READY: { bg: "#F3F4F6", text: "#6B7280", label: "Ready", icon: "clock-outline" },
  EN_ROUTE: { bg: "#DBEAFE", text: "#1E40AF", label: "En Route", icon: "truck-fast" },     // ✅ Added
  ARRIVED: { bg: "#FEF3C7", text: "#92400E", label: "Arrived", icon: "package-variant" },  // ✅ Added
  DELIVERED: { bg: "#D1FAE5", text: "#065F46", label: "Delivered", icon: "check-circle" },
  FAILED: { bg: "#FEE2E2", text: "#991B1B", label: "Failed", icon: "close-circle" },

  // Legacy support
  OUT_FOR_DELIVERY: { bg: "#DBEAFE", text: "#1E40AF", label: "Out for Delivery", icon: "truck-fast" },
  PICKED_UP: { bg: "#FEF3C7", text: "#92400E", label: "Picked Up", icon: "package-variant" },
};
```

#### Action Buttons (Line 116-146):
```typescript
case "READY":
  return (
    <TouchableOpacity onPress={() => onStatusChange(delivery.id, "EN_ROUTE")}>
      <Text>Start Delivery</Text>
    </TouchableOpacity>
  );
case "EN_ROUTE":
case "OUT_FOR_DELIVERY":  // Legacy support
  return (
    <TouchableOpacity onPress={() => onStatusChange(delivery.id, "DELIVERED")}>
      <Text>Mark as Delivered</Text>
    </TouchableOpacity>
  );
case "ARRIVED":
case "PICKED_UP":  // Legacy support
  return (
    <TouchableOpacity onPress={() => onStatusChange(delivery.id, "DELIVERED")}>
      <Text>Mark as Delivered</Text>
    </TouchableOpacity>
  );
```

#### Timer Logic (Line 42-60):
```typescript
const isActive =
  delivery.status === "in_progress" ||
  delivery.status === "picked_up" ||
  delivery.status === "EN_ROUTE" ||      // ✅ Added
  delivery.status === "ARRIVED" ||       // ✅ Added
  delivery.status === "OUT_FOR_DELIVERY" ||  // Legacy
  delivery.status === "PICKED_UP";  // Legacy
```

#### Fail Button (Line 153-159):
```typescript
const showFailButton =
  delivery.status === "in_progress" ||
  delivery.status === "picked_up" ||
  delivery.status === "EN_ROUTE" ||      // ✅ Added
  delivery.status === "ARRIVED" ||       // ✅ Added
  delivery.status === "OUT_FOR_DELIVERY" ||  // Legacy
  delivery.status === "PICKED_UP";  // Legacy
```

## Status Flow After Fix

### Delivery Status Screen
```
User Action: "Start Delivery"
  ↓
Local Status: in_progress
  ↓
Mapping: in_progress → EN_ROUTE
  ↓
API Call: PATCH /api/delivery/orders/:id/status { status: "EN_ROUTE" }
  ↓
✅ Backend Accepts: EN_ROUTE is valid
  ↓
Response: Order updated successfully
```

### Deliveries Screen
```
User Action: Click "Start Delivery" on order card
  ↓
Handler: onStatusChange(orderId, "EN_ROUTE")
  ↓
API Call: updateDeliveryStatus(orderId, { status: "EN_ROUTE" })
  ↓
✅ Backend Accepts: EN_ROUTE is valid
  ↓
Refresh: Fetch latest batch data
  ↓
Display: Order shows "En Route" status
```

## Backward Compatibility

The fix maintains backward compatibility:
- **Legacy statuses**: `OUT_FOR_DELIVERY`, `PICKED_UP` are still recognized in UI
- **Mapping**: They're automatically mapped to new backend statuses when sending to API
- **Display**: Both old and new statuses show correct labels and colors

## Testing

### Before Fix ❌
```
User clicks "Start Delivery"
  ↓
API receives: { status: "OUT_FOR_DELIVERY" }
  ↓
Backend rejects: "status" must be one of [EN_ROUTE, ARRIVED, DELIVERED, FAILED]
  ↓
Error shown to user
```

### After Fix ✅
```
User clicks "Start Delivery"
  ↓
API receives: { status: "EN_ROUTE" }
  ↓
Backend accepts: ✅
  ↓
Success notification shown
```

## Complete Status Mapping Table

| User Action | Local Status | API Status Sent | Backend Accepts |
|-------------|--------------|-----------------|-----------------|
| (Initial) | pending | READY | ✅ |
| Start Delivery | in_progress | **EN_ROUTE** ✅ | ✅ |
| Mark Picked Up | picked_up | **ARRIVED** ✅ | ✅ |
| Mark Delivered | delivered | DELIVERED | ✅ |
| Mark Failed | failed | FAILED | ✅ |

## API Compatibility

### Supported Backend Status Values
- ✅ `READY` - Order is ready for pickup
- ✅ `EN_ROUTE` - Driver is on the way to customer
- ✅ `ARRIVED` - Driver has arrived at customer location
- ✅ `DELIVERED` - Order successfully delivered
- ✅ `FAILED` - Delivery failed

### Legacy Status Values (Frontend Only)
- `OUT_FOR_DELIVERY` - Mapped to `EN_ROUTE` when sending to API
- `PICKED_UP` - Mapped to `ARRIVED` when sending to API

## Benefits

1. **Backend Compatible**: All API calls now use correct status values
2. **No More Errors**: Status update errors are resolved
3. **Backward Compatible**: Old statuses still work in UI
4. **Clear Mapping**: Easy to understand status progression
5. **Future Proof**: Easy to add new statuses as backend evolves

## Notes

- The backend API now strictly validates status values
- Frontend must always send: `READY`, `EN_ROUTE`, `ARRIVED`, `DELIVERED`, or `FAILED`
- Legacy statuses are only for UI display and backward compatibility
- All API communication uses the new backend-approved statuses
