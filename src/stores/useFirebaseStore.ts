// stores/useFirebaseStore.ts - MERGED VERSION (BEST OF BOTH) - FIXED
"use client";

import { create } from "zustand";
import { onAuthStateChanged, User, Unsubscribe, signOut } from "firebase/auth";
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
  role: "admin" | "teacher" | "student";
  fullName: string;
  email: string;
  className?: string;
  enrollmentNo?: string;
  classes?: string[];
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

  // Auth functions (from FIXED version)
  initializeAuth: () => void;
  cleanupAuth: () => void;
  refreshStudents: () => void;
  clearError: () => void;
  signOutUser: () => Promise<void>;
  forceReset: () => void;

  // Admin functions (from OLD version)
  updateTeacherProfile: (
    teacherId: string,
    data: Partial<Record<string, any>>,
  ) => Promise<{ success: boolean; error?: string }>;
  switchTeacherClass: (
    teacherId: string,
    newClass: string,
  ) => Promise<{ success: boolean; error?: string }>;
  promoteStudents: (
    oldClass: string,
    newClass: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateStudentClass: (
    studentId: string,
    newClass: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

/* ------------------------------------------------------------------ */
const splitName = (fullName = "", email = "") => {
  // If no fullName, try to extract from email
  if (!fullName || !fullName.trim()) {
    const emailPart = email?.split("@")[0] || "student";
    // Clean up email part (remove numbers, dots, underscores)
    const nameFromEmail = emailPart
      .replace(/[0-9._-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const parts = nameFromEmail.split(" ");
    if (parts.length >= 2) {
      return {
        first: parts[0] || "Student",
        last: parts.slice(1).join(" ") || "Name",
      };
    } else if (parts.length === 1) {
      return { first: parts[0] || "Student", last: "Student" };
    } else {
      return { first: "Student", last: "Name" };
    }
  }

  // Normal fullName processing
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] || "Student";
  const last = parts.slice(1).join(" ") || "Name";
  return { first, last };
};

/* ------------------------------------------------------------------ */
export const useFirebaseStore = create<FirebaseStore>((set, get) => {
  let studentUnsub: Unsubscribe | null = null;
  let authUnsubscribe: Unsubscribe | null = null;
  let currentUserId: string | null = null;

  const log = (msg: string) => {
    const time = new Date().toISOString().slice(11, 19);
    console.log("[FB-Store]", msg);
    set((state) => ({
      debug: [...state.debug.slice(-50), `[${time}] ${msg}`],
    }));
  };

  const loadUserData = async (
    uid: string,
  ): Promise<{ userData: UserData; role: "admin" | "teacher" | "student" }> => {
    if (currentUserId === uid && get().userData) {
      log(`User data already loaded for UID: ${uid}`);
      return { userData: get().userData!, role: get().userData!.role };
    }

    log(`Loading user data for UID: ${uid}`);

    // Check "users" collection first for admin role — this matches
    // Login.tsx's handleStaffLogin, which treats users/{uid} with
    // role === "admin" as the source of truth for admin accounts.
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data()?.role === "admin") {
      const data = userSnap.data()!;
      log(`Admin data found: ${JSON.stringify(data)}`);

      const userData: UserData = {
        role: "admin",
        fullName: data.fullName || "",
        email: data.email || "",
      };

      currentUserId = uid;
      return { userData, role: "admin" };
    }

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
        classes: data.classes || [],
      };

      currentUserId = uid;
      return { userData, role: "teacher" };
    }

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

    log("User document not found in users, teachers, or students collection");
    throw new Error("User profile not found");
  };
  // Add this function INSIDE the store creation, after the existing loadUserData function

  const loadStudentClassmates = async (
    studentClass: string,
    excludeEmail: string,
  ): Promise<Student[]> => {
    try {
      if (!studentClass.trim()) {
        log("No student class provided for classmates query");
        return [];
      }

      log(`Loading classmates for class: "${studentClass}"`);

      const q = query(
        collection(db, "students"),
        where("className", "==", studentClass),
      );

      const snapshot = await getDocs(q);
      const classmates: Student[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Skip current student (exclude by email)
        if (data.email === excludeEmail) return;

        // Use the existing splitName function
        const { first, last } = splitName(data.fullName, data.email);

        classmates.push({
          id: doc.id,
          first,
          last,
          email: data.email || "",
          progress: typeof data.progress === "number" ? data.progress : 0,
          className: data.className || studentClass,
          enrollmentNo: data.enrollmentNo,
          course: data.course,
          session: data.session,
          semester: data.semester,
        });
      });

      log(`Loaded ${classmates.length} classmates for class "${studentClass}"`);
      return classmates;
    } catch (error: any) {
      log(`Error loading classmates: ${error.message}`);
      return [];
    }
  };

  const loadTeacherClasses = (userData: UserData): TeacherClass[] => {
    if (userData.role !== "teacher") return [];

    const classes: TeacherClass[] = [];

    // Check teaching array first
    if (userData.teaching && Array.isArray(userData.teaching)) {
      userData.teaching.forEach((item) => {
        const classLevel = item?.classLevel || item?.className || "";
        if (classLevel && typeof classLevel === "string") {
          const trimmed = classLevel.trim();
          if (trimmed && !classes.find((c) => c.id === trimmed)) {
            classes.push({ id: trimmed, name: trimmed });
          }
        }
      });
    }

    // Check className as fallback
    if (userData.className && typeof userData.className === "string") {
      const trimmed = userData.className.trim();
      if (trimmed && !classes.find((c) => c.id === trimmed)) {
        classes.push({ id: trimmed, name: trimmed });
      }
    }

    // Check classes array
    if (userData.classes && Array.isArray(userData.classes)) {
      userData.classes.forEach((className) => {
        if (className && typeof className === "string") {
          const trimmed = className.trim();
          if (trimmed && !classes.find((c) => c.id === trimmed)) {
            classes.push({ id: trimmed, name: trimmed });
          }
        }
      });
    }

    log(`Loaded teacher classes: ${classes.map((c) => c.name).join(", ")}`);
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

    // SIMPLIFY: Use ONLY the original class names (no variations)
    const classNames = [...clean];

    // Remove duplicates
    const uniqueClassNames = [...new Set(classNames)];

    log(`Query students WHERE className IN [${uniqueClassNames.join(", ")}]`);

    // DEBUG: Check what we're querying
    console.log("[FB-Store] DEBUG - Final query classes:", uniqueClassNames);
    console.log(
      "[FB-Store] DEBUG - Includes SS2?",
      uniqueClassNames.includes("SS2"),
    );

    // Should be exactly 8 classes, well within the 10-item limit
    // No need to truncate to 10!

    const q = query(
      collection(db, "students"),
      where("className", "in", uniqueClassNames),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const students: Student[] = snap.docs.map((d) => {
          const data = d.data() as DocumentData;
          const { first, last } = splitName(data.fullName, data.email);
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
          `${a.first} ${a.last}`.localeCompare(`${b.first} ${b.last}`),
        );

        log(`Students loaded: ${students.length}`);
        console.log(
          "📋 Loaded students details:",
          students.map((s) => ({
            name: `${s.first} ${s.last}`,
            class: s.className,
            email: s.email,
          })),
        );

        set({ students, loading: false, error: null });
      },
      (err) => {
        log(`Student listener error: ${err.message}`);
        set({ error: "Failed to load students", loading: false });
      },
    );

    studentUnsub = unsub;
  };

  // Return the store state and actions
  return {
    user: null,
    userData: null,
    teacherClasses: [],
    students: [],
    loading: true,
    error: null,
    debug: [],
    authInitialized: false,

    // ✅ Auth functions from FIXED version
    initializeAuth: () => {
      if (authUnsubscribe) {
        log("Auth already initialized, returning without new listener");
        return;
      }

      log("Initializing auth listener...");

      const unsub = onAuthStateChanged(auth, async (user) => {
        log(`Auth state changed: ${user ? `User ${user.uid}` : "No user"}`);

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
          } else if (role === "student") {
            // ✅ For students, load their classmates
            const classmates = await loadStudentClassmates(
              userData.className || "",
              user.email || "",
            );

            // Sort classmates alphabetically
            classmates.sort((a, b) =>
              `${a.first} ${a.last}`.localeCompare(`${b.first} ${b.last}`),
            );

            set({
              teacherClasses: [],
              students: classmates, // ✅ Now populated with classmates!
              loading: false,
            });

            log(
              `Student ${user.email} has ${classmates.length} classmates in class "${userData.className}"`,
            );
          } else {
            // Admin: no classes/classmates to load
            set({
              teacherClasses: [],
              students: [],
              loading: false,
            });
            log(`Admin ${user.email} logged in`);
          }
        } catch (error: any) {
          log(`Error loading user data: ${error.message}`);

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
      set({ authInitialized: true });
    },

    cleanupAuth: () => {
      log("Manual cleanup of auth listeners");
      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }
      if (studentUnsub) {
        studentUnsub();
        studentUnsub = null;
      }
      currentUserId = null;
      set({ authInitialized: false });
    },

    forceReset: () => {
      log("🔄 FORCE RESET: Manually resetting entire store");

      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }
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
        authInitialized: false,
        debug: [],
      });
    },

    refreshStudents: () => {
      const { user, teacherClasses } = get();
      if (!user || !teacherClasses.length) return;
      startStudentListener(teacherClasses.map((c) => c.id));
    },

    clearError: () => set({ error: null }),

    signOutUser: async () => {
      try {
        log("🚪 Signing out user...");

        if (studentUnsub) {
          studentUnsub();
          studentUnsub = null;
        }

        await signOut(auth);
        log("✅ Sign-out successful");

        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
        currentUserId = null;

        set({
          user: null,
          userData: null,
          teacherClasses: [],
          students: [],
          loading: false,
          error: null,
          authInitialized: false,
        });

        log("🔄 Store fully reset after sign out");
      } catch (err: any) {
        log(`❌ Sign-out error: ${err.message}`);

        set({
          user: null,
          userData: null,
          teacherClasses: [],
          students: [],
          loading: false,
          error: err.message,
          authInitialized: false,
        });

        throw err;
      }
    },

    // ✅ Admin functions from OLD version
    updateTeacherProfile: async (
      teacherId: string,
      data: Partial<Record<string, any>>,
    ) => {
      try {
        const teacherRef = doc(db, "teachers", teacherId);
        await updateDoc(teacherRef, data);

        // Update local Zustand userData immediately if present
        set((state) => ({
          userData: state.userData
            ? {
                ...state.userData,
                ...data,
              }
            : null,
        }));

        // If className changed → refresh student listener and teacherClasses
        if (data.className) {
          const newClass = data.className.toString().trim();
          set({ teacherClasses: [{ id: newClass, name: newClass }] });

          // restart student listener for new class
          const { refreshStudents } = get();
          refreshStudents();
        }

        // If teaching array changed, reload teacherClasses
        if (Array.isArray(data.teaching) && data.teaching.length > 0) {
          const classes = (data.teaching as any[])
            .map((t) => {
              const id = (t.classLevel ?? t.className ?? "").toString().trim();
              return id ? { id, name: id } : null;
            })
            .filter(Boolean) as TeacherClass[];
          if (classes.length) set({ teacherClasses: classes });
          // restart listener with updated classes
          const { refreshStudents } = get();
          refreshStudents();
        }

        return { success: true };
      } catch (err: any) {
        const message = err?.message ?? "Failed to update teacher";
        log(`updateTeacherProfile error: ${message}`);
        return { success: false, error: message };
      }
    },

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

    promoteStudents: async (oldClass: string, newClass: string) => {
      try {
        log(`Promoting students from ${oldClass} → ${newClass}`);
        const q = query(
          collection(db, "students"),
          where("className", "==", oldClass),
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          log("No students found to promote");
          return { success: true };
        }

        // Use batch to update - respects Firestore batch semantics
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => {
          const ref = doc(db, "students", d.id);
          batch.update(ref, { className: newClass });
        });

        await batch.commit();
        log(`Promoted ${snapshot.docs.length} students to ${newClass}`);

        // If current user is a teacher whose class was promoted, refresh students
        const { refreshStudents } = get();
        refreshStudents();

        return { success: true };
      } catch (err: any) {
        const message = err?.message ?? "Failed to promote students";
        log(`promoteStudents error: ${message}`);
        return { success: false, error: message };
      }
    },

    updateStudentClass: async (studentId: string, newClass: string) => {
      try {
        const studentRef = doc(db, "students", studentId);
        await updateDoc(studentRef, { className: newClass });

        // If the current teacher is watching that class, refresh students
        const { refreshStudents } = get();
        refreshStudents();

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
