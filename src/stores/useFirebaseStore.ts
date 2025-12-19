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
  updateDoc,
  getDocs,
  writeBatch,
  DocumentData,
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
  authInitialized: boolean;
  
  // Core functions
  initializeAuth: () => () => void; // Returns cleanup function
  refreshStudents: () => void;
  clearError: () => void;
  signOutUser: () => Promise<void>;
  cleanup: () => void;
  
  // Teacher API
  updateTeacherProfile: (teacherId: string, data: Partial<Record<string, any>>) => Promise<{ success: boolean; error?: string }>;
  switchTeacherClass: (teacherId: string, newClass: string) => Promise<{ success: boolean; error?: string }>;
  promoteStudents: (oldClass: string, newClass: string) => Promise<{ success: boolean; error?: string }>;
  updateStudentClass: (studentId: string, newClass: string) => Promise<{ success: boolean; error?: string }>;
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
  let currentUserId: string | null = null;
  let initialized = false; // Track if store was initialized

  const log = (msg: string) => {
    const time = new Date().toISOString().slice(11, 19);
    console.log("[FB-Store]", msg);
    set((s) => ({ debug: [...s.debug.slice(-50), `[${time}] ${msg}`] }));
  };

  const internalCleanup = () => {
    log("Internal cleanup triggered");
    
    if (studentUnsub) {
      studentUnsub();
      studentUnsub = null;
    }
    
    currentUserId = null;
  };

  const loadUserData = async (uid: string): Promise<{ userData: UserData; role: "teacher" | "student" }> => {
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
      
      currentUserId = uid;
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
      
      currentUserId = uid;
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
          const data = d.data() as DocumentData;
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

  // Process user authentication
  const handleAuthStateChange = async (user: User | null) => {
    log(`Auth state changed: ${user ? `User ${user.uid}` : 'No user'}`);
    
    // Store the user in state immediately
    set({ 
      user, 
      loading: true,
      error: null 
    });

    if (!user) {
      log("No user - clearing all data");
      internalCleanup();
      set({
        userData: null,
        teacherClasses: [],
        students: [],
        loading: false,
        authInitialized: true,
      });
      return;
    }

    try {
      const { userData, role } = await loadUserData(user.uid);
      
      // Double-check we're still dealing with the same user
      const currentState = get();
      if (currentState.user?.uid !== user.uid) {
        log("User changed during data load, aborting");
        return;
      }

      log(`User role: ${role}, Name: ${userData.fullName}`);
      set({ userData });

      if (role === "teacher") {
        const classes = loadTeacherClasses(userData);
        log(`Setting teacher classes: ${JSON.stringify(classes)}`);
        set({ teacherClasses: classes });
        
        // Start student listener for teacher
        if (classes.length > 0) {
          startStudentListener(classes.map((c) => c.id));
        } else {
          set({ loading: false, students: [] });
        }
      } else {
        // For students, no need to load other students
        log("Student logged in, skipping student list");
        set({ 
          teacherClasses: [],
          students: [],
          loading: false,
          authInitialized: true 
        });
      }

    } catch (error: any) {
      log(`Error loading user data: ${error.message}`);
      
      // Only update error state if user hasn't changed
      const currentState = get();
      if (currentState.user?.uid === user.uid) {
        set({
          userData: null,
          teacherClasses: [],
          students: [],
          loading: false,
          error: error.message,
          authInitialized: true,
        });
      }
    }
  };

  return {
    user: null,
    userData: null,
    teacherClasses: [],
    students: [],
    loading: true,
    error: null,
    debug: [],
    authInitialized: false,

    initializeAuth: () => {
      if (initialized) {
        log("Auth already initialized");
        return () => {
          log("Cleanup skipped - already initialized");
        };
      }

      log("=== Initializing Firebase auth ===");
      initialized = true;
      
      // Set initial loading state
      set({ 
        loading: true,
        authInitialized: false 
      });

      // Set up auth state listener
      authUnsubscribe = onAuthStateChanged(auth, (user) => {
        handleAuthStateChange(user);
      });

      // Return cleanup function
      return () => {
        log("=== Cleaning up Firebase auth ===");
        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
        internalCleanup();
        initialized = false;
      };
    },

    refreshStudents: () => {
      const { user, teacherClasses } = get();
      if (!user || !teacherClasses.length) return;
      startStudentListener(teacherClasses.map((c) => c.id));
    },

    clearError: () => set({ error: null }),

    cleanup: () => {
      log("Manual cleanup called");
      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }
      internalCleanup();
      initialized = false;
      set({
        user: null,
        userData: null,
        teacherClasses: [],
        students: [],
        loading: false,
        error: null,
        authInitialized: false,
      });
    },

    signOutUser: async () => {
      try {
        log("=== Starting sign out ===");
        
        // First, clean up listeners
        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
        internalCleanup();
        initialized = false;
        
        // Sign out from Firebase
        await signOut(auth);
        log("Firebase sign out successful");

        // Clear Zustand state
        set({
          user: null,
          userData: null,
          teacherClasses: [],
          students: [],
          loading: false,
          error: null,
          authInitialized: true, // Set to true so UI knows auth is initialized
          debug: [],
        });
        
        log("=== Sign out completed ===");
      } catch (err: any) {
        log(`Sign-out error: ${err.message}`);
        throw err;
      }
    },

    // -------------------------------
    // Teacher Profile Update
    // -------------------------------
    updateTeacherProfile: async (teacherId: string, data: Partial<Record<string, any>>) => {
      try {
        const teacherRef = doc(db, "teachers", teacherId);
        await updateDoc(teacherRef, data);

        // Update local state
        set((state) => ({
          userData: state.userData
            ? {
                ...state.userData,
                ...data,
              }
            : null,
        }));

        // Handle class name changes
        if (data.className) {
          const newClass = data.className.toString().trim();
          set({ teacherClasses: [{ id: newClass, name: newClass }] });
          get().refreshStudents();
        }

        // Handle teaching array changes
        if (Array.isArray(data.teaching)) {
          const classes = (data.teaching as any[]).map((t) => {
            const id = (t.classLevel ?? t.className ?? "").toString().trim();
            return id ? { id, name: id } : null;
          }).filter(Boolean) as TeacherClass[];
          
          if (classes.length) {
            set({ teacherClasses: classes });
            get().refreshStudents();
          }
        }

        return { success: true };
      } catch (err: any) {
        const message = err?.message ?? "Failed to update teacher";
        log(`updateTeacherProfile error: ${message}`);
        return { success: false, error: message };
      }
    },

    // -------------------------------
    // Switch Teacher Class
    // -------------------------------
    switchTeacherClass: async (teacherId: string, newClass: string) => {
      try {
        const payload = { className: newClass };
        const res = await get().updateTeacherProfile(teacherId, payload);
        return res;
      } catch (err: any) {
        const message = err?.message ?? "Error switching teacher class";
        log(`switchTeacherClass error: ${message}`);
        return { success: false, error: message };
      }
    },

    // -------------------------------
    // Promote Students
    // -------------------------------
    promoteStudents: async (oldClass: string, newClass: string) => {
      try {
        log(`Promoting students from ${oldClass} → ${newClass}`);
        const q = query(collection(db, "students"), where("className", "==", oldClass));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          log("No students found to promote");
          return { success: true };
        }

        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => {
          const ref = doc(db, "students", d.id);
          batch.update(ref, { className: newClass });
        });

        await batch.commit();
        log(`Promoted ${snapshot.docs.length} students to ${newClass}`);

        get().refreshStudents();

        return { success: true };
      } catch (err: any) {
        const message = err?.message ?? "Failed to promote students";
        log(`promoteStudents error: ${message}`);
        return { success: false, error: message };
      }
    },

    // -------------------------------
    // Update Student Class
    // -------------------------------
    updateStudentClass: async (studentId: string, newClass: string) => {
      try {
        const studentRef = doc(db, "students", studentId);
        await updateDoc(studentRef, { className: newClass });

        get().refreshStudents();

        log(`Student ${studentId} moved to ${newClass}`);
        return { success: true };
      } catch (err: any) {
        const message = err?.message ?? "Failed to update student class";
        log(`updateStudentClass error: ${message}`);
        return { success: false, error: message };
      }
    },
  };
});
