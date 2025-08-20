import { signOut } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebase';

export const clearAllAuthData = async () => {
  try {
    // Sign out from Firebase
    await signOut(auth);
    
    // Sign out from Google
    await GoogleSignin.signOut();
    
    // Clear all AsyncStorage data
    await AsyncStorage.clear();
    
    console.log('[Auth] All authentication data cleared successfully');
  } catch (error) {
    console.error('[Auth] Error clearing authentication data:', error);
  }
};

export const logout = async () => {
  try {
    // Sign out from Firebase
    await signOut(auth);
    
    // Sign out from Google
    await GoogleSignin.signOut();
    
    console.log('[Auth] Logged out successfully');
  } catch (error) {
    console.error('[Auth] Error during logout:', error);
  }
};
