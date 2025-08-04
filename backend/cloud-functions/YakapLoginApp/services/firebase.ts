// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';  // Use Web Auth
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCAG7uRyW-Ng6chx938sxSbKIN55trYIlA",
  authDomain: "carb-on.firebaseapp.com",
  projectId: "carb-on",
  storageBucket: "carb-on.firebasestorage.app",
  messagingSenderId: "52247729811",
  appId: "1:52247729811:web:17d14d4fd20b845bca9f66",
  measurementId: "G-7V446XVETG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Use default memory persistence for now
const db = getFirestore(app);

export { auth, db };
