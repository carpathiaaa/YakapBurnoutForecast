import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import firebaseConfig from "./config/firebaseConfig.js";

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();

async function handleGoogleSignIn() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Sign-in successful:", user);
        return user;
    } catch (error) {
        console.error("Sign-in failed:", error);
        throw error;
    }
}

// Function to sign out
async function handleSignOut() {
    try {
        await auth.signOut();
        console.log("Sign-out successful");
    } catch (error) {
        console.error("Sign-out failed:", error);
        throw error;
    }
}

// Function to get current user
function getCurrentUser() {
    return auth.currentUser;
}

// Function to listen to auth state changes
function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// Function to fetch meetings daily data
async function fetchMeetingsDaily() {
    try {
        const querySnapshot = await getDocs(collection(db, "meetings_daily"));
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return data;
    } catch (error) {
        console.error("Error fetching meetings_daily:", error);
        return [];
    }
}

// Function to fetch users data
async function fetchUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return data;
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

// Function to fetch wellness signals data
async function fetchWellnessSignals() {
    try {
        const querySnapshot = await getDocs(collection(db, "wellness_signals"));
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return data;
    } catch (error) {
        console.error("Error fetching wellness_signals:", error);
        return [];
    }
}

// Function to fetch burnout forecasts data
async function fetchBurnoutForecasts() {
    try {
        const querySnapshot = await getDocs(collection(db, "burnout_forecasts"));
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return data;
    } catch (error) {
        console.error("Error fetching burnout_forecasts:", error);
        return [];
    }
}

export { 
    handleGoogleSignIn, 
    handleSignOut, 
    getCurrentUser, 
    onAuthStateChange, 
    auth,
    fetchMeetingsDaily,
    fetchUsers,
    fetchWellnessSignals,
    fetchBurnoutForecasts
};
