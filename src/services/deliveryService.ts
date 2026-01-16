import { API_CONFIG } from '../config/api';
import { getFirebaseToken } from './authService';
import type {
  ApiResponse,
  AvailableBatch,
  BatchAcceptData,
  MyBatchData,
  DeliveryStatusUpdateRequest,
  DeliveryStatusUpdateData,
  DriverOrdersData,
  DriverBatchHistoryData,
} from '../types/api';

// Create authorized headers with Firebase token
const createHeaders = async () => {
  const token = await getFirebaseToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Get available batches for driver to accept
export const getAvailableBatches = async (): Promise<ApiResponse<{ batches: AvailableBatch[] }>> => {
  try {
    console.log('📡 Calling /delivery/available-batches endpoint...');

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AVAILABLE_BATCHES}`,
      {
        method: 'GET',
        headers,
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<{ batches: AvailableBatch[] }> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to get available batches');
    }

    // Log available batches count after verifying response is ok
    const batchCount = data?.data?.batches?.length || 0;
    console.log('📡 Available batches count:', batchCount);

    return data;
  } catch (error: any) {
    console.error('❌ Error getting available batches:', error);
    throw error;
  }
};

// Accept a batch
export const acceptBatch = async (batchId: string): Promise<ApiResponse<BatchAcceptData>> => {
  try {
    console.log('📡 Calling /delivery/batches/:batchId/accept endpoint...');
    console.log('📦 Batch ID:', batchId);

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACCEPT_BATCH(batchId)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<BatchAcceptData> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to accept batch');
    }

    console.log('✅ Batch accepted:', data?.data?.batch?.batchNumber || 'Unknown');
    console.log('📦 Orders count:', data?.data?.orders?.length || 0);

    return data;
  } catch (error: any) {
    console.error('❌ Error accepting batch:', error);
    throw error;
  }
};

// Get current active batch
export const getMyBatch = async (): Promise<ApiResponse<MyBatchData>> => {
  try {
    console.log('📡 Calling /delivery/my-batch endpoint...');

    const headers = await createHeaders();

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MY_BATCH}`, {
      method: 'GET',
      headers,
    });

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<MyBatchData> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to get current batch');
    }

    if (data.data.batch) {
      console.log('✅ Active batch found:', data.data.batch.batchNumber);
      console.log('📊 Summary:', data.data.summary);
    } else {
      console.log('ℹ️ No active batch');
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error getting current batch:', error);
    throw error;
  }
};

// Mark batch as picked up from kitchen
export const markBatchPickedUp = async (batchId: string): Promise<ApiResponse<any>> => {
  try {
    console.log('📡 Calling /delivery/batches/:batchId/pickup endpoint...');
    console.log('📦 Batch ID:', batchId);

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PICKUP_BATCH(batchId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({}),
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<any> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to mark batch as picked up');
    }

    console.log('✅ Batch marked as picked up');

    return data;
  } catch (error: any) {
    console.error('❌ Error marking batch as picked up:', error);
    throw error;
  }
};

// Update delivery status (delivered, failed, etc.)
export const updateDeliveryStatus = async (
  orderId: string,
  statusUpdate: DeliveryStatusUpdateRequest
): Promise<ApiResponse<DeliveryStatusUpdateData>> => {
  try {
    console.log('📡 Calling /delivery/orders/:orderId/status endpoint...');
    console.log('📦 Order ID:', orderId);
    console.log('📊 Status:', statusUpdate.status);

    const headers = await createHeaders();
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_DELIVERY_STATUS(orderId)}`;
    const body = JSON.stringify(statusUpdate);

    console.log('📡 Full URL:', url);
    console.log('📡 Request body:', body);
    console.log('📡 Request headers:', JSON.stringify(headers, null, 2));

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body,
    });

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<DeliveryStatusUpdateData> = await response.json();

    console.log('📡 Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ API Error Response:', JSON.stringify(data, null, 2));
      console.error('❌ Status code:', response.status);
      console.error('❌ data.error:', data.error);
      console.error('❌ data.message:', data.message);
      throw new Error(data.error || data.message || 'Failed to update delivery status');
    }

    console.log('✅ Delivery status updated');
    if (data?.data?.batchProgress) {
      console.log('📊 Batch progress:', data.data.batchProgress);
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error updating delivery status:', error);
    throw error;
  }
};

// Complete batch
export const completeBatch = async (batchId: string): Promise<ApiResponse<any>> => {
  try {
    console.log('📡 Calling /delivery/batches/:batchId/complete endpoint...');
    console.log('📦 Batch ID:', batchId);

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMPLETE_BATCH(batchId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({}),
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<any> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to complete batch');
    }

    console.log('✅ Batch completed');
    if (data?.data?.summary) {
      console.log('📊 Summary:', data.data.summary);
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error completing batch:', error);
    throw error;
  }
};

// Update delivery sequence
export const updateDeliverySequence = async (
  batchId: string,
  sequence: Array<{ orderId: string; sequenceNumber: number }>
): Promise<ApiResponse<any>> => {
  try {
    console.log('📡 Calling /delivery/batches/:batchId/sequence endpoint...');
    console.log('📦 Batch ID:', batchId);

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_SEQUENCE(batchId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ sequence }),
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<any> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update delivery sequence');
    }

    console.log('✅ Delivery sequence updated');

    return data;
  } catch (error: any) {
    console.error('❌ Error updating delivery sequence:', error);
    throw error;
  }
};

// Get specific batch details
export const getBatchDetails = async (batchId: string): Promise<ApiResponse<any>> => {
  try {
    console.log('📡 Calling /delivery/batches/:batchId endpoint...');
    console.log('📦 Batch ID:', batchId);

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_BATCH(batchId)}`,
      {
        method: 'GET',
        headers,
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<any> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to get batch details');
    }

    console.log('✅ Batch details retrieved');

    return data;
  } catch (error: any) {
    console.error('❌ Error getting batch details:', error);
    throw error;
  }
};

// Get driver's active orders (PICKED_UP and OUT_FOR_DELIVERY) or filter by status
export const getDriverOrders = async (status?: string): Promise<ApiResponse<DriverOrdersData>> => {
  try {
    const endpoint = status
      ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_ORDERS}?status=${status}`
      : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_ORDERS}`;

    console.log('📡 Calling /orders/driver endpoint...', status ? `with status: ${status}` : '');

    const headers = await createHeaders();

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<DriverOrdersData> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to get driver orders');
    }

    console.log('✅ Driver orders retrieved:', data?.data?.count || 0);

    return data;
  } catch (error: any) {
    console.error('❌ Error getting driver orders:', error);
    throw error;
  }
};

// Get driver batch history (past and current batches and orders)
export const getDriverBatchHistory = async (): Promise<ApiResponse<DriverBatchHistoryData>> => {
  try {
    console.log('📡 Calling /delivery/batches/driver/history endpoint...');

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_BATCH_HISTORY}`,
      {
        method: 'GET',
        headers,
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<DriverBatchHistoryData> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to get driver batch history');
    }

    console.log('✅ Driver batch history retrieved');
    console.log('📦 Batches count:', data?.data?.batches?.length || 0);
    console.log('📦 Single orders count:', data?.data?.singleOrders?.length || 0);

    return data;
  } catch (error: any) {
    console.error('❌ Error getting driver batch history:', error);
    throw error;
  }
};
