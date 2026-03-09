import { API_CONFIG } from '../config/api';
import { tokenStorage } from '../utils/tokenStorage';
import type {
  ApiResponse,
  AuthSyncData,
  AuthMeData,
  ProfileUpdateRequest,
  ProfileUpdateData,
  DriverRegistrationRequest,
  DriverRegistrationData,
} from '../types/api';

// Get stored JWT token
export const getStoredToken = async (): Promise<string> => {
  const token = await tokenStorage.getToken();
  if (!token) {
    throw new Error('No auth token found');
  }
  return token;
};

// Create authorized headers with stored JWT token
const createHeaders = async () => {
  const token = await getStoredToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Send OTP to phone number via backend (MSG91)
export const sendOTP = async (phone: string): Promise<void> => {
  const url = `${API_CONFIG.BASE_URL}/auth/send-otp`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send OTP');
  }
};

// Verify OTP via backend and get JWT + user data
export const verifyAndSync = async (phone: string, otp: string): Promise<ApiResponse<AuthSyncData>> => {
  const url = `${API_CONFIG.BASE_URL}/auth/verify-otp`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  });

  const responseText = await response.text();
  let data: ApiResponse<AuthSyncData>;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`Backend returned non-JSON response. Status: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify OTP');
  }

  // Store JWT token if present
  if (data.data?.token) {
    await tokenStorage.setToken(data.data.token);
  }

  // Store user data if present
  if (data.data?.user) {
    await tokenStorage.setUserData(data.data.user);
  }

  return data;
};

// Resend OTP via backend (MSG91)
export const resendOTP = async (phone: string): Promise<void> => {
  const url = `${API_CONFIG.BASE_URL}/auth/resend-otp`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to resend OTP');
  }
};

// Register driver with registrationToken (after OTP verification for new users)
export const registerDriverWithOtp = async (
  registrationToken: string,
  data: DriverRegistrationRequest
): Promise<ApiResponse<DriverRegistrationData>> => {
  try {
    const url = `${API_CONFIG.BASE_URL}/auth/otp/register-driver`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${registrationToken}`,
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    let responseData: ApiResponse<DriverRegistrationData>;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error(`Backend returned non-JSON response. Status: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to register driver');
    }

    // Store the JWT token from registration response
    if (responseData.data?.token) {
      await tokenStorage.setToken(responseData.data.token);
    }

    return responseData;
  } catch (error: any) {
    console.error('Error registering driver:', error);
    throw error;
  }
};

// Get current user profile
export const getCurrentUser = async (): Promise<ApiResponse<AuthMeData>> => {
  try {
    console.log('📡 Calling /auth/me endpoint...');

    const headers = await createHeaders();

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_ME}`, {
      method: 'GET',
      headers,
    });

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<AuthMeData> = await response.json();
    console.log('📡 Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to get user profile');
    }

    // Update stored user data
    if (data.data.user) {
      await tokenStorage.setUserData(data.data.user);
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error getting current user:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (
  updates: ProfileUpdateRequest
): Promise<ApiResponse<ProfileUpdateData>> => {
  try {
    console.log('📡 Calling /auth/profile endpoint...');
    console.log('📡 Update data:', JSON.stringify(updates, null, 2));

    const headers = await createHeaders();

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_PROFILE}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    console.log('📡 Response status:', response.status);

    const data: ApiResponse<ProfileUpdateData> = await response.json();
    console.log('📡 Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to update profile');
    }

    // Update stored user data
    if (data.data.user) {
      await tokenStorage.setUserData(data.data.user);
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
};

// Register driver with admin approval
export const registerDriver = async (
  data: DriverRegistrationRequest
): Promise<ApiResponse<DriverRegistrationData>> => {
  try {
    console.log('📡 Calling /auth/register-driver endpoint...');
    console.log('📝 Driver data:', JSON.stringify(data, null, 2));

    const headers = await createHeaders();

    const response = await fetch(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER_DRIVER}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }
    );

    console.log('📡 Response status:', response.status);
    console.log('📡 Response content-type:', response.headers.get('content-type'));

    const responseText = await response.text();
    console.log('📡 Response preview:', responseText.substring(0, 500));
    console.log('📡 Full response length:', responseText.length);

    let responseData: ApiResponse<DriverRegistrationData>;
    try {
      responseData = JSON.parse(responseText);
      console.log('📡 Response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('❌ Response is not valid JSON');
      console.error('📄 Full response text:', responseText);
      console.error('⚠️ This usually means:');
      console.error('   1. The endpoint /auth/register-driver does not exist on backend');
      console.error('   2. Backend is returning an HTML error page');
      console.error('   3. Backend URL is incorrect');
      console.error('🔗 Full URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER_DRIVER}`);
      throw new Error(`Backend returned non-JSON response. Status: ${response.status}. Check console for full response.`);
    }

    if (!response.ok) {
      throw new Error(
        responseData.error || responseData.message || 'Failed to register driver'
      );
    }

    return responseData;
  } catch (error: any) {
    console.error('❌ Error registering driver:', error);
    throw error;
  }
};

// Logout user
export const logout = async (): Promise<void> => {
  try {
    console.log('Logging out user...');
    await tokenStorage.clearAll();
    console.log('Logout successful');
  } catch (error: any) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// Check if user is authenticated (has stored JWT token)
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    return await tokenStorage.hasValidToken();
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};
