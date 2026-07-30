// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyC1iNKDm__uI06XWv5ZJKJFo0VKSnpFHQY",
  authDomain: "megapend-auth.firebaseapp.com",
  projectId: "megapend-auth",
  storageBucket: "megapend-auth.appspot.com",
  messagingSenderId: "827105755249",
  appId: "1:827105755249:web:f9c6954d99582be497dbd0",
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");
export const functions = getFunctions(app);

export default app;
