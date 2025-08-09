import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env';

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
console.log('[Firebase] Initialized', {
  projectId: FIREBASE_PROJECT_ID,
  authDomain: FIREBASE_AUTH_DOMAIN,
});

const db = getFirestore(app);
const auth = initializeAuth(app, {
  // Use any-cast to access getReactNativePersistence where types may lag behind
  persistence: (firebaseAuth as any).getReactNativePersistence(AsyncStorage),
});

// Optional: ensure functions region alignment elsewhere

export { db, auth };
