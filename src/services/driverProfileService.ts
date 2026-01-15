import { API_CONFIG } from '../config/api';
import { getFirebaseToken } from './authService';
import type {
  ApiResponse,
  DriverProfileData,
  UpdateDriverProfileRequest,
  UpdateVehicleRequest,
  UpdateProfileImageRequest,
  DocumentUpdateRequest,
  DocumentUpdateRequestData,
  DriverStats,
} from '../types/api';

// Create authorized headers with Firebase token
const createHeaders = async () => {
  const token = await getFirebaseToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Get complete driver profile with statistics
export const getDriverProfile = async (): Promise<ApiResponse<DriverProfileData>> => {
  try {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_PROFILE}`;
    console.log('📡 Calling /driver/profile endpoint...');
    console.log('📡 Full URL:', url);

    const headers = await createHeaders();
    console.log('📡 Headers prepared');

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', JSON.stringify(response.headers, null, 2));

    // Get response text first for better error handling
    const responseText = await response.text();
    console.log('📡 Response text:', responseText);

    let data: ApiResponse<DriverProfileData>;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
      const errorMsg = data.error || data.message || 'Failed to get driver profile';
      console.error('❌ API Error:', errorMsg);
      console.error('❌ Full error response:', JSON.stringify(data, null, 2));
      throw new Error(errorMsg);
    }

    console.log('✅ Driver profile retrieved');
    console.log('📊 User data:', data?.data?.user);
    console.log('📊 Driver details:', data?.data?.driverDetails);
    console.log('📊 Statistics:', data?.data?.statistics);

    return data;
  } catch (error: any) {
    console.error('❌ Error getting driver profile:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

// Update basic profile (name, email, profileImage)
export const updateDriverProfile = async (
  updates: UpdateDriverProfileRequest
): Promise<ApiResponse<DriverProfileData>> => {
  try {
    console.log('📡 Calling PUT /driver/profile endpoint...');
    console.log('📝 Updates:', updates);

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_PROFILE}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<DriverProfileData> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update profile');
    }

    console.log('✅ Profile updated successfully');

    return data;
  } catch (error: any) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
};

// Update vehicle details
export const updateDriverVehicle = async (
  updates: UpdateVehicleRequest
): Promise<ApiResponse<DriverProfileData>> => {
  try {
    console.log('📡 Calling PATCH /driver/vehicle endpoint...');
    console.log('🚗 Updates:', updates);

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_VEHICLE}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<DriverProfileData> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update vehicle');
    }

    console.log('✅ Vehicle updated successfully');

    return data;
  } catch (error: any) {
    console.error('❌ Error updating vehicle:', error);
    throw error;
  }
};

// Update profile image only
export const updateDriverProfileImage = async (
  imageUrl: string
): Promise<ApiResponse<DriverProfileData>> => {
  try {
    console.log('📡 Calling PATCH /driver/profile/image endpoint...');

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_PROFILE_IMAGE}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ profileImage: imageUrl }),
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<DriverProfileData> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update profile image');
    }

    console.log('✅ Profile image updated successfully');

    return data;
  } catch (error: any) {
    console.error('❌ Error updating profile image:', error);
    throw error;
  }
};

// Request document update (requires admin approval)
export const requestDocumentUpdate = async (
  request: DocumentUpdateRequest
): Promise<ApiResponse<DocumentUpdateRequestData>> => {
  try {
    console.log('📡 Calling POST /driver/documents/request endpoint...');
    console.log('📄 Request:', request);

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_DOCUMENTS_REQUEST}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<DocumentUpdateRequestData> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to submit document update request');
    }

    console.log('✅ Document update request submitted');

    return data;
  } catch (error: any) {
    console.error('❌ Error requesting document update:', error);
    throw error;
  }
};

// Get driver delivery statistics
export const getDriverStats = async (): Promise<ApiResponse<DriverStats>> => {
  try {
    console.log('📡 Calling /driver/stats endpoint...');

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DRIVER_STATS}`,
      {
        method: 'GET',
        headers,
      }
    );

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<DriverStats> = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to get driver stats');
    }

    console.log('✅ Driver stats retrieved');
    console.log('📊 Stats:', data.data);

    return data;
  } catch (error: any) {
    console.error('❌ Error getting driver stats:', error);
    throw error;
  }
};
