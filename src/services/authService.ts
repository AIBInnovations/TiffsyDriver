import auth from '@react-native-firebase/auth';
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

// Get Firebase ID token and log it
export const getFirebaseToken = async (): Promise<string> => {
  const currentUser = auth().currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found');
  }

  const token = await currentUser.getIdToken();
  console.log('🔑 Firebase ID Token:', token);
  console.log('🔑 Token preview:', token.substring(0, 50) + '...');

  return token;
};

// Create authorized headers with Firebase token
const createHeaders = async () => {
  const token = await getFirebaseToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Sync user with backend after Firebase authentication
export const syncUser = async (): Promise<ApiResponse<AuthSyncData>> => {
  try {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_SYNC}`;
    console.log('📡 Calling /auth/sync endpoint...');
    console.log('🌐 Full URL:', url);

    const headers = await createHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    // Get response text first to check if it's JSON
    const responseText = await response.text();
    console.log('📡 Response text preview:', responseText.substring(0, 200));

    // Try to parse as JSON
    let data: ApiResponse<AuthSyncData>;
    try {
      data = JSON.parse(responseText);
      console.log('📡 Response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('❌ Response is not valid JSON');
      console.error('📄 Full response:', responseText);
      throw new Error(`Backend returned non-JSON response. Check if backend URL is correct: ${url}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to sync user');
    }

    // Store user data if exists
    if (data.data.user) {
      await tokenStorage.setUserData(data.data.user);
      console.log('✅ User data stored:', data.data.user.name);
    }

    return data;
  } catch (error: any) {
    console.error('❌ Error syncing user:', error);
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
    console.log('🚪 Logging out user...');

    // Sign out from Firebase
    await auth().signOut();

    // Clear stored data
    await tokenStorage.clearAll();

    console.log('✅ Logout successful');
  } catch (error: any) {
    console.error('❌ Error during logout:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const currentUser = auth().currentUser;
    const storedToken = await tokenStorage.getToken();

    return !!(currentUser && storedToken);
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};
