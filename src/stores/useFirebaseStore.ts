// stores/useFirebaseStore.ts
"use client";

import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface TeacherClass {
  id: string;
  name: string;
}

interface Student {
  id: string;
  first: string;
  last: string;
  email: string;
  progress: number;
}

interface FirebaseStore {
  user: any;
  teacherClasses: TeacherClass[];
  students: Student[];
  loading: boolean;
  error: string | null;
  initializeAuth: () => void;
  refreshData: () => void; // This is the function you need
  clearError: () => void;
}

export const useFirebaseStore = create<FirebaseStore>((set, get) => ({
  user: null,
  teacherClasses: [],
  students: [],
  loading: true,
  error: null,

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      set({ user });
      if (user) {
        await get().loadTeacherData(user.uid);
      } else {
        set({ teacherClasses: [], students: [], loading: false });
      }
    });
  },

  loadTeacherData: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const teacherDoc = await getDoc(doc(db, "users", userId));
      if (!teacherDoc.exists()) {
        set({ teacherClasses: [], students: [], loading: false });
        return;
      }

      const teacherData = teacherDoc.data();
      if (teacherData.role !== "teacher" || !Array.isArray(teacherData.teaching)) {
        set({ teacherClasses: [], students: [], loading: false });
        return;
      }

      const classes: TeacherClass[] = teacherData.teaching
        .map((t: any) => {
          const level = t.classLevel?.trim();
          return level ? { id: level.toUpperCase(), name: level } : null;
        })
        .filter(Boolean) as TeacherClass[];

      set({ teacherClasses: classes });
      
      if (classes.length > 0) {
        await get().loadStudents(classes.map(c => c.id));
      } else {
        set({ students: [], loading: false });
      }
    } catch (err) {
      console.error("Error loading teacher data:", err);
      set({ error: "Failed to load data", loading: false });
    }
  },

  loadStudents: async (classLevels: string[]) => {
    try {
      const studentCol = collection(db, "users");
      
      const arrayQuery = query(
        studentCol,
        where("role", "==", "student"),
        where("classLevels", "array-contains-any", classLevels)
      );

      const unsubscribe = onSnapshot(arrayQuery, async (snapshot) => {
        let studentsData: Student[] = [];
        
        if (!snapshot.empty) {
          studentsData = snapshot.docs.map((d) => {
            const data = d.data();
            const names = (data.fullName || "").trim().split(" ");
            return {
              id: d.id,
              first: names[0] || "",
              last: names.slice(1).join(" ") || "",
              email: data.email || "",
              progress: data.progress ?? 0,
            };
          });
        }

        if (studentsData.length === 0) {
          const stringQuery = query(
            studentCol,
            where("role", "==", "student"),
            where("classLevel", "in", classLevels)
          );
          
          const stringSnapshot = await getDocs(stringQuery);
          studentsData = stringSnapshot.docs.map((d) => {
            const data = d.data();
            const names = (data.fullName || "").trim().split(" ");
            return {
              id: d.id,
              first: names[0] || "",
              last: names.slice(1).join(" ") || "",
              email: data.email || "",
              progress: data.progress ?? 0,
            };
          });
        }

        const uniqueStudents = studentsData.filter((student, index, self) => 
          index === self.findIndex(s => s.id === student.id)
        );
        
        uniqueStudents.sort((a, b) =>
          `${a.first} ${a.last}`.localeCompare(`${b.first} ${b.last}`)
        );

        set({ students: uniqueStudents, loading: false });
      });

      return unsubscribe;
    } catch (err) {
      console.error("Error loading students:", err);
      set({ error: "Failed to load students", loading: false });
    }
  },

  refreshData: () => {
    const { user } = get();
    if (user) {
      get().loadTeacherData(user.uid);
    }
  },

  clearError: () => set({ error: null }),
}));