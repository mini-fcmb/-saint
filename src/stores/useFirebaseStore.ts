// stores/useFirebaseStore.ts
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
}

interface FirebaseStore {
  user: User | null;
  teacherClasses: TeacherClass[];
  students: Student[];
  loading: boolean;
  error: string | null;
  debug: string[];
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

  const log = (msg: string) => {
    const time = new Date().toISOString().slice(11, 19);
    console.log("[FB-Store]", msg);
    set((s) => ({ debug: [...s.debug, `[${time}] ${msg}`] }));
  };

  const loadTeacher = async (uid: string) => {
    log(`Loading teacher doc for UID: ${uid}`);
    const ref = doc(db, "teachers", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      log("Teacher doc NOT FOUND");
      return null;
    }

    const data = snap.data()!;
    log(`Teacher raw data: ${JSON.stringify(data)}`);

    let classLevels: string[] = [];

    const isTeacher = data.role === "teacher" || data.role === "teachers" || !data.role;

    if (isTeacher) {
      if (Array.isArray(data.teaching)) {
        classLevels = data.teaching
          .map((t: any) => (t.classLevel ?? "").toString().trim())
          .filter(Boolean);
      }

      if (!classLevels.length && data.className) {
        const name = data.className.toString().trim();
        if (name) classLevels = [name];
      }
    }

    const classes: TeacherClass[] = classLevels.map((l) => ({ id: l, name: l }));
    log(`Teacher classes: ${JSON.stringify(classes)}`);
    return { classes, teacherData: data };
  };

  const startStudentListener = (classLevels: string[]) => {
    if (studentUnsub) studentUnsub();

    const clean = classLevels.map((l) => l.trim()).filter(Boolean);

    if (!clean.length) {
      log("No class levels → empty student list");
      set({ students: [], loading: false });
      return () => {};
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
          };
        });

        // FIXED: Removed stray '11'
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
    return unsub;
  };

  return {
    user: null,
    teacherClasses: [],
    students: [],
    loading: true,
    error: null,
    debug: [],

    initializeAuth: () => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          if (studentUnsub) studentUnsub();
          set({
            user: null,
            teacherClasses: [],
            students: [],
            loading: false,
            error: null,
            debug: [],
          });
          return;
        }

        log(`Auth user: ${user.uid} – ${user.email}`);
        set({ user, loading: true, error: null });

        const info = await loadTeacher(user.uid);
        if (!info) {
          set({
            teacherClasses: [],
            students: [],
            loading: false,
            error: "Teacher profile not found",
          });
          return;
        }

        const { classes } = info;
        set({ teacherClasses: classes });
        startStudentListener(classes.map((c) => c.id));
      });

      return () => {
        unsub();
        if (studentUnsub) studentUnsub();
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
        await signOut(auth);
        log("Sign-out successful");

        if (studentUnsub) {
          studentUnsub();
          studentUnsub = null;
        }

        set({
          user: null,
          teacherClasses: [],
          students: [],
          loading: false,
          error: null,
          debug: [],
        });
      } catch (err: any) {
        log(`Sign-out error: ${err.message}`);
        throw err;
      }
    },
  };
});