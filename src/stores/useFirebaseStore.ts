// stores/useFirebaseStore.ts - FIXED VERSION
"use client";

import { create } from "zustand";
import {
  onAuthStateChanged,
  User,
  Unsubscribe,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

export interface TeacherClass {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  first: string;
  last: string;
  email: string;
  progress: number;
  className?: string;
  enrollmentNo?: string;
  course?: string;
  session?: string;
  semester?: string;
}

interface UserData {
  role: "teacher" | "student";
  fullName: string;
  email: string;
  className?: string;
  enrollmentNo?: string;
  course?: string;
  session?: string;
  semester?: string;
  teaching?: any[];
}

interface FirebaseStore {
  user: User | null;
  userData: UserData | null;
  teacherClasses: TeacherClass[];
  students: Student[];
  loading: boolean;
  error: string | null;
  debug: string[];
  authInitialized: boolean; // NEW: Track if auth is initialized
  initializeAuth: () => Unsubscribe;
  refreshStudents: () => void;
  clearError: () => void;
  signOutUser: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ") ?? "";
  return { first, last };
};

/* ------------------------------------------------------------------ */
export const useFirebaseStore = create<FirebaseStore>((set, get) => {
  let studentUnsub: Unsubscribe | null = null;
  let authUnsubscribe: Unsubscribe | null = null;
  let currentUserId: string | null = null; // NEW: Track current user to prevent reloads

  const log = (msg: string) => {
    const time = new Date().toISOString().slice(11, 19);
    console.log("[FB-Store]", msg);
    set((s) => ({ debug: [...s.debug.slice(-50), `[${time}] ${msg}`] })); // Limit debug array size
  };

  const loadUserData = async (uid: string): Promise<{ userData: UserData; role: "teacher" | "student" }> => {
    // FIXED: Prevent reloading same user data
    if (currentUserId === uid && get().userData) {
      log(`User data already loaded for UID: ${uid}`);
      return { userData: get().userData!, role: get().userData!.role };
    }

    log(`Loading user data for UID: ${uid}`);
    
    // Try teacher collection first
    const teacherRef = doc(db, "teachers", uid);
    const teacherSnap = await getDoc(teacherRef);

    if (teacherSnap.exists()) {
      const data = teacherSnap.data()!;
      log(`Teacher data found: ${JSON.stringify(data)}`);
      
      const userData: UserData = {
        role: "teacher",
        fullName: data.fullName || "",
        email: data.email || "",
        teaching: data.teaching || [],
        className: data.className || "",
      };
      
      currentUserId = uid; // Track current user
      return { userData, role: "teacher" };
    }

    // Try student collection
    const studentRef = doc(db, "students", uid);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      const data = studentSnap.data()!;
      log(`Student data found: ${JSON.stringify(data)}`);
      
      const userData: UserData = {
        role: "student",
        fullName: data.fullName || "",
        email: data.email || "",
        className: data.className || "",
        enrollmentNo: data.enrollmentNo || "",
        course: data.course || "Computer Science",
        session: data.session || "2023-2024",
        semester: data.semester || "IV",
      };
      
      currentUserId = uid; // Track current user
      return { userData, role: "student" };
    }

    log("User document not found in teachers or students collection");
    throw new Error("User profile not found");
  };

  const loadTeacherClasses = (userData: UserData): TeacherClass[] => {
    if (userData.role !== "teacher") return [];

    let classLevels: string[] = [];

    if (Array.isArray(userData.teaching)) {
      classLevels = userData.teaching
        .map((t: any) => (t.classLevel ?? "").toString().trim())
        .filter(Boolean);
    }

    if (!classLevels.length && userData.className) {
      const name = userData.className.toString().trim();
      if (name) classLevels = [name];
    }

    const classes: TeacherClass[] = classLevels.map((l) => ({ id: l, name: l }));
    log(`Teacher classes: ${JSON.stringify(classes)}`);
    return classes;
  };

  const startStudentListener = (classLevels: string[]) => {
    if (studentUnsub) {
      studentUnsub();
      studentUnsub = null;
    }

    const clean = classLevels.map((l) => l.trim()).filter(Boolean);

    if (!clean.length) {
      log("No class levels → empty student list");
      set({ students: [], loading: false });
      return;
    }

    log(`Query students WHERE className IN [${clean.join(", ")}]`);
    const q = query(collection(db, "students"), where("className", "in", clean));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const students: Student[] = snap.docs.map((d) => {
          const data = d.data();
          const { first, last } = splitName(data.fullName);
          return {
            id: d.id,
            first,
            last,
            email: data.email ?? "",
            progress: typeof data.progress === "number" ? data.progress : 0,
            className: data.className,
            enrollmentNo: data.enrollmentNo,
            course: data.course,
            session: data.session,
            semester: data.semester,
          };
        });

        students.sort((a, b) =>
          `${a.first} ${a.last}`.localeCompare(`${b.first} ${b.last}`)
        );

        log(`Students loaded: ${students.length}`);
        set({ students, loading: false, error: null });
      },
      (err) => {
        log(`Student listener error: ${err.message}`);
        set({ error: "Failed to load students", loading: false });
      }
    );

    studentUnsub = unsub;
  };

  return {
    user: null,
    userData: null,
    teacherClasses: [],
    students: [],
    loading: true,
    error: null,
    debug: [],
    authInitialized: false, // NEW

    initializeAuth: () => {
      // FIXED: Only initialize once
      if (authUnsubscribe) {
        log("Auth already initialized, returning existing unsubscribe");
        return authUnsubscribe;
      }

      log("Initializing auth listener...");
      
      const unsub = onAuthStateChanged(auth, async (user) => {
        log(`Auth state changed: ${user ? `User ${user.uid}` : 'No user'}`);
        
        // FIXED: Prevent unnecessary state updates for same user
        const currentUser = get().user;
        if (user?.uid === currentUser?.uid && !get().loading) {
          log("Same user, skipping state update");
          return;
        }

        if (!user) {
          log("No user - clearing state");
          if (studentUnsub) {
            studentUnsub();
            studentUnsub = null;
          }
          currentUserId = null;
          
          set({
            user: null,
            userData: null,
            teacherClasses: [],
            students: [],
            loading: false,
            error: null,
            authInitialized: true,
          });
          return;
        }

        log(`Processing user: ${user.uid} – ${user.email}`);
        set({ user, loading: true, error: null, authInitialized: true });

        try {
          const { userData, role } = await loadUserData(user.uid);
          
          // FIXED: Only update if we're still dealing with the same user
          const currentState = get();
          if (currentState.user?.uid !== user.uid) {
            log("User changed during data load, skipping update");
            return;
          }

          set({ userData });

          if (role === "teacher") {
            const classes = loadTeacherClasses(userData);
            set({ teacherClasses: classes });
            startStudentListener(classes.map((c) => c.id));
          } else {
            // For students, we don't need to load other students
            set({ 
              teacherClasses: [],
              students: [],
              loading: false 
            });
          }

        } catch (error: any) {
          log(`Error loading user data: ${error.message}`);
          
          // Only update state if user hasn't changed
          const currentState = get();
          if (currentState.user?.uid === user.uid) {
            set({
              userData: null,
              teacherClasses: [],
              students: [],
              loading: false,
              error: error.message,
            });
          }
        }
      });

      authUnsubscribe = unsub;
      
      // FIXED: Return proper cleanup function
      return () => {
        log("Cleaning up auth listener");
        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
        if (studentUnsub) {
          studentUnsub();
          studentUnsub = null;
        }
        currentUserId = null;
      };
    },

    refreshStudents: () => {
      const { user, teacherClasses } = get();
      if (!user || !teacherClasses.length) return;
      startStudentListener(teacherClasses.map((c) => c.id));
    },

    clearError: () => set({ error: null }),

    signOutUser: async () => {
      try {
        log("Signing out user...");
        
        // Clean up listeners first
        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
        if (studentUnsub) {
          studentUnsub();
          studentUnsub = null;
        }
        currentUserId = null;
        
        await signOut(auth);
        log("Sign-out successful");

        set({
          user: null,
          userData: null,
          teacherClasses: [],
          students: [],
          loading: false,
          error: null,
          authInitialized: false,
          debug: [],
        });
      } catch (err: any) {
        log(`Sign-out error: ${err.message}`);
        throw err;
      }
    },
  };
});