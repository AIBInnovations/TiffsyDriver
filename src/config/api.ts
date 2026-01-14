// API Configuration
export const API_CONFIG = {
  // Replace with your actual backend URL
  BASE_URL: 'https://tiffsy-backend.onrender.com/api',

  // Timeouts
  TIMEOUT: 30000, // 30 seconds

  // Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH_SYNC: '/auth/sync',
    AUTH_ME: '/auth/me',
    AUTH_PROFILE: '/auth/profile',
    REGISTER_DRIVER: '/auth/register-driver',
    FCM_TOKEN: '/auth/fcm-token',

    // Delivery endpoints
    AVAILABLE_BATCHES: '/delivery/available-batches',
    MY_BATCH: '/delivery/my-batch',
    ACCEPT_BATCH: (batchId: string) => `/delivery/batches/${batchId}/accept`,
    PICKUP_BATCH: (batchId: string) => `/delivery/batches/${batchId}/pickup`,
    UPDATE_DELIVERY_STATUS: (orderId: string) => `/delivery/orders/${orderId}/status`,
    UPDATE_SEQUENCE: (batchId: string) => `/delivery/batches/${batchId}/sequence`,
    COMPLETE_BATCH: (batchId: string) => `/delivery/batches/${batchId}/complete`,
    GET_BATCH: (batchId: string) => `/delivery/batches/${batchId}`,
  },
};

// For development, you can use ngrok or local IP
// Example: 'http://192.168.1.100:3000/api' for local development
// Example: 'https://your-ngrok-url.ngrok.io/api' for testing
