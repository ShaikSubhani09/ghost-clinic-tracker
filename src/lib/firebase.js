// Import Firebase core + services
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your NEW Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD_YZAK7oJXvpan_mFX4wZfQIRG_6o-AAk",
  authDomain: "ghost-clinic-tracker-1bea2.firebaseapp.com",
  projectId: "ghost-clinic-tracker-1bea2",
  storageBucket: "ghost-clinic-tracker-1bea2.firebasestorage.app",
  messagingSenderId: "1053398021061",
  appId: "1:1053398021061:web:4d4679e3e8504e056851ac"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
