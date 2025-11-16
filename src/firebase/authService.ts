import { auth, db } from "./config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

type TeachingData = string[] | { subject: string; classLevel: string }[];

interface VerificationData {
  lastSent: Timestamp;
  attemptsToday: number;
}

// ✅ Automatically persist login session even after refresh
setPersistence(auth, browserLocalPersistence);

export const registerWithRole = async (
  email: string,
  password: string,
  role: "student" | "teacher",
  fullName: string,
  subjectsOrTeaching: TeachingData
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: fullName });

  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    fullName,
    email,
    role,
    ...(role === "student"
      ? { studentSubjects: subjectsOrTeaching }
      : { teaching: subjectsOrTeaching }),
    verification: { lastSent: serverTimestamp(), attemptsToday: 1 },
    createdAt: serverTimestamp(),
  });

  await sendEmailVerification(user);

  return user;
};

export const resendVerificationEmail = async (user: User) => {
  const userRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) throw new Error("User not found.");

  const data = docSnap.data();
  const now = Timestamp.now();
  const verification: VerificationData = data.verification || { lastSent: now, attemptsToday: 0 };

  const lastSentDate = verification.lastSent.toDate();
  const today = new Date();
  if (
    lastSentDate.getFullYear() !== today.getFullYear() ||
    lastSentDate.getMonth() !== today.getMonth() ||
    lastSentDate.getDate() !== today.getDate()
  ) {
    verification.attemptsToday = 0;
  }

  if (verification.attemptsToday >= 3) {
    throw new Error("You have reached the maximum of 3 verification attempts today.");
  }

  const diff = now.toMillis() - verification.lastSent.toMillis();
  if (diff < 10 * 60 * 1000) {
    throw new Error("You can only request a new verification email every 10 minutes.");
  }

  await sendEmailVerification(user);

  await updateDoc(userRef, {
    verification: { lastSent: now, attemptsToday: verification.attemptsToday + 1 },
  });
};

export const loginWithRole = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) throw new Error("User data not found in database.");

  const userData = docSnap.data();

  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in.");
  }

  return {
    user,
    role: userData.role as "student" | "teacher",
    studentSubjects: userData.studentSubjects || [],
    teaching: userData.teaching || [],
  };
};

export const logout = async () => await signOut(auth);

export const getCurrentUser = (): User | null => auth.currentUser;

// ✅ Listen for auth changes globally (useful for dashboards)
export const onUserStateChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
