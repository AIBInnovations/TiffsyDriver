import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@firebase_id_token';
const USER_KEY = '@user_data';

export const tokenStorage = {
  // Store Firebase ID token
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('✅ Token stored successfully');
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  },

  // Get Firebase ID token
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Remove Firebase ID token
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      console.log('🗑️ Token removed successfully');
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  },

  // Store user data
  async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      console.log('✅ User data stored successfully');
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  },

  // Get user data
  async getUserData(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Remove user data
  async removeUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
      console.log('🗑️ User data removed successfully');
    } catch (error) {
      console.error('Error removing user data:', error);
      throw error;
    }
  },

  // Clear all stored data (logout)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      console.log('🗑️ All data cleared successfully');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },
};
