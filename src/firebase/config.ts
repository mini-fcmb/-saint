// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDVf_t_dLIYymRbTNwLnYZg6vLoQvJIQmU",
  authDomain: "saints-741dc.firebaseapp.com",
  projectId: "saints-741dc",
  storageBucket: "saints-741dc.firebasestorage.app",
  messagingSenderId: "654034936315",
  appId: "1:654034936315:web:1e11e2a98446b6128cab5e",
  measurementId: "G-2M9341W3FH",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Create & export Google provider
export const googleProvider = new GoogleAuthProvider();
