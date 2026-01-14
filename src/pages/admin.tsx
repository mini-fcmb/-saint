import { useEffect, useMemo, useState } from "react";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  query,
  where,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { signOut, deleteUser, getAuth } from "firebase/auth";

import { db, auth } from "../firebase/config";
import logo from "../assets/logo.png";

interface Teacher {
  id: string;
  fullName: string;
  email?: string;
  classes?: string[]; // Array of classes they teach
  subjects?: { [className: string]: string[] }; // Subjects per class
  disabled?: boolean; // Add this
  disabledAt?: Date; // Add this
  disabledBy?: string;
  [k: string]: any;
}

interface Student {
  id: string;
  fullName: string;
  email?: string;
  className?: string;
  subjects?: string[];
  disabled?: boolean; // Add this
  disabledAt?: Date; // Add this
  disabledBy?: string;
  [k: string]: any;
}

interface ScratchCard {
  id?: string;
  pin: string;
  puk: string;
  createdAt: Date;
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
  usedBy?: string[];
  lastUsedAt?: Date;
}
const ADMIN_EMAIL = "minibossfcmb@proton.me";

// Desired class order: Primary5 → SS3
const CLASS_ORDER = ["P5", "P6", "JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

// Subjects by class level
const SUBJECTS_BY_LEVEL = {
  "P5-P6": [
    "Mathematics",
    "English Language",
    "Basic Science",
    "Igbo Language",
    "Basic Digital Literacy",
    "History",
    "CCA",
    "Social and Citizenship Education",
    "CRS",
    "Prevocational Studies",
    "French",
    "Music",
    "PHE",
  ],
  "JSS1-JSS3": [
    "Mathematics",
    "English Language",
    "Basic Science",
    "Basic Technology",
    "French",
    "Igbo Language",
    "Music",
    "CCA",
    "PHE",
    "Social Studies",
    "Business Studies",
    "CRS",
    "Computer Studies",
    "History",
    "Agricultural Science",
    "Civic Education",
    "Home Economics",
    "Livestock Farming",
    "Literature",
    "Test of Orals",
  ],
  "SS1-SS3": [
    "Mathematics",
    "English Language",
    "Physics",
    "Chemistry",
    "Biology",
    "Further Mathematics",
    "Literature",
    "Igbo Language",
    "French",
    "Geography",
    "CRS",
    "Economics",
    "Marketing",
    "Government",
    "Computer Science",
    "Civic Education",
    "Accounting",
    "Agricultural Science",
    "Test of Orals",
  ],
};

// Helper to normalize class names from the DB
const normalizeClass = (c?: string) => {
  if (!c) return "";
  const s = c.toString().trim().toUpperCase().replace(/\s+/g, "");
  if (s.startsWith("P5") || s.startsWith("PRIMARY5")) return "P5";
  if (s.startsWith("P6") || s.startsWith("PRIMARY6")) return "P6";
  if (s.startsWith("JSS1") || s.startsWith("JSS-1") || s === "JSSI")
    return "JSS1";
  if (s.startsWith("JSS2") || s.startsWith("JSS-2") || s === "JSSII")
    return "JSS2";
  if (s.startsWith("JSS3") || s.startsWith("JSS-3") || s === "JSSIII")
    return "JSS3";
  if (s.includes("SS3") || s.includes("SSS3")) return "SS3";
  if (s.includes("SS2") || s.includes("SSS2")) return "SS2";
  if (s.includes("SS1") || s.includes("SSS1")) return "SS1";
  const match = s.match(/SS+(\d)/);
  if (match) return `SS${match[1]}`;
  return c;
};

// Get class level for subject selection
const getClassLevel = (className: string): keyof typeof SUBJECTS_BY_LEVEL => {
  if (className === "P5" || className === "P6") return "P5-P6";
  if (className.startsWith("JSS")) return "JSS1-JSS3";
  if (className.startsWith("SS")) return "SS1-SS3";
  return "P5-P6";
};

const AdminDashboard = () => {
  const { updateTeacherProfile, promoteStudents, refreshStudents } =
    useFirebaseStore();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState("");

  // Teacher management state
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [teacherSubjectsByClass, setTeacherSubjectsByClass] = useState<{
    [className: string]: string[];
  }>({});

  // Promotion state
  const [oldClass, setOldClass] = useState("");
  const [newClass, setNewClass] = useState("");
  const [promoteSubjects, setPromoteSubjects] = useState<string[]>([]);

  // UI state
  const [expandedStudentRows, setExpandedStudentRows] = useState<
    Record<string, boolean>
  >({});
  const [expandedTeacherRows, setExpandedTeacherRows] = useState<
    Record<string, boolean>
  >({});
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  // New state for save confirmation popup
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [savePopupMessage, setSavePopupMessage] = useState("");
  const [savePopupType, setSavePopupType] = useState<"success" | "error">(
    "success"
  );
  // Scratch card state
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showScratchCardModal, setShowScratchCardModal] = useState(false);
  const [scratchCardForm, setScratchCardForm] = useState({
    pin: "",
    puk: "",
    maxUsage: 3,
  });
  const [generatedCards, setGeneratedCards] = useState<ScratchCard[]>([]);
  const [scratchCards, setScratchCards] = useState<ScratchCard[]>([]);
  const [showCardList, setShowCardList] = useState(false);

  // Secret code constant
  const SECRET_CODE = "2578";
  const [showCardButton, setShowCardButton] = useState(false);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    teachers: Teacher[];
    students: Student[];
  }>({
    teachers: [],
    students: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  // Add these with your other state variables
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    type: "teacher" | "student";
    name: string;
    email: string;
  } | null>(null);
  const [deleteAction, setDeleteAction] = useState<
    "disable" | "delete" | "enable"
  >("disable");
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({
    className: "",
    subjectName: "",
    subjectCode: "",
    description: "",
  });
  const [subjectCategory, setSubjectCategory] = useState<
    "P5-P6" | "JSS1-JSS3" | "SS1-SS3"
  >("P5-P6");
  // Add this useEffect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.querySelector(".profile-dropdown-container");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showProfileDropdown]);

  // Fetch teachers & students
  useEffect(() => {
    const fetchData = async () => {
      const teachersSnap = await getDocs(collection(db, "teachers"));
      const teachersData = teachersSnap.docs.map((d) => {
        const raw = d.data() as any;

        // Normalize classes
        let classes: string[] = [];
        if (Array.isArray(raw.classes)) {
          classes = raw.classes.map((c: any) => normalizeClass(String(c)));
        } else if (raw.className) {
          classes = [normalizeClass(String(raw.className))];
        }

        // Normalize subjects (could be array or object)
        let subjects: { [className: string]: string[] } = {};
        if (raw.subjects && typeof raw.subjects === "object") {
          if (Array.isArray(raw.subjects)) {
            // Old format: subjects array
            classes.forEach((cls: string) => {
              subjects[cls] = raw.subjects.map((s: any) => String(s));
            });
          } else {
            // New format: subjects object
            Object.entries(raw.subjects).forEach(([key, value]) => {
              const normalizedKey = normalizeClass(key);
              if (Array.isArray(value)) {
                subjects[normalizedKey] = value.map((s: any) => String(s));
              }
            });
          }
        }

        return {
          id: d.id,
          uid: raw.uid || raw.userId,
          ...raw,
          classes,
          subjects,
        } as Teacher;
      });
      setTeachers(teachersData);

      const studentsSnap = await getDocs(collection(db, "students"));
      const studentsData = studentsSnap.docs.map((d) => {
        const raw = d.data() as any;
        const subjects = Array.isArray(raw.subjects)
          ? raw.subjects.map((s: any) => String(s))
          : [];
        const normalizedClass = normalizeClass(
          raw.className || raw.class || ""
        );
        return {
          id: d.id,
          uid: raw.uid || raw.userId,
          ...raw,
          className: normalizedClass,
          subjects,
        } as Student;
      });
      setStudents(studentsData);
    };

    fetchData();
  }, []);
  useEffect(() => {
    loadScratchCards();
  }, []);

  // Sort by class order, then by name
  const sortByClassThenName = <T extends { fullName: string }>(arr: T[]) =>
    [...arr].sort((a, b) => {
      const aName = a.fullName || "";
      const bName = b.fullName || "";
      return aName.localeCompare(bName);
    });

  // Filter out admin
  const filteredTeachers = useMemo(
    () =>
      sortByClassThenName(
        teachers.filter(
          (t) => (t.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()
        )
      ),
    [teachers]
  );

  const filteredStudents = useMemo(
    () =>
      sortByClassThenName(
        students.filter(
          (s) => (s.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()
        )
      ),
    [students]
  );

  // Handle selecting teacher for management
  const handleSelectTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      setSelectedTeacherId(null);
      setTeacherClasses([]);
      setTeacherSubjectsByClass({});
      return;
    }

    setSelectedTeacherId(teacherId);
    setTeacherClasses(teacher.classes || []);
    setTeacherSubjectsByClass(teacher.subjects || {});
  };

  // Teacher class management
  const handleTeacherClassToggle = (className: string) => {
    setTeacherClasses((prev) => {
      if (prev.includes(className)) {
        // Remove class and its subjects
        const newSubjects = { ...teacherSubjectsByClass };
        delete newSubjects[className];
        setTeacherSubjectsByClass(newSubjects);
        return prev.filter((c) => c !== className);
      } else {
        // Add class with empty subjects
        const newSubjects = { ...teacherSubjectsByClass, [className]: [] };
        setTeacherSubjectsByClass(newSubjects);
        return [...prev, className];
      }
    });
  };

  // Teacher subject management
  const handleTeacherSubjectToggle = (className: string, subject: string) => {
    setTeacherSubjectsByClass((prev) => {
      const currentSubjects = prev[className] || [];
      const newSubjects = currentSubjects.includes(subject)
        ? currentSubjects.filter((s) => s !== subject)
        : [...currentSubjects, subject];

      return {
        ...prev,
        [className]: newSubjects.sort((a, b) => a.localeCompare(b)),
      };
    });
  };

  const handleSelectAllSubjects = (className: string) => {
    const classLevel = getClassLevel(className);
    const availableSubjects = SUBJECTS_BY_LEVEL[classLevel];
    const currentSubjects = teacherSubjectsByClass[className] || [];

    setTeacherSubjectsByClass((prev) => ({
      ...prev,
      [className]:
        currentSubjects.length === availableSubjects.length
          ? []
          : [...availableSubjects],
    }));
  };

  // Show save confirmation popup
  const showSaveConfirmation = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setSavePopupMessage(message);
    setSavePopupType(type);
    setShowSavePopup(true);

    // Auto close after 3 seconds
    setTimeout(() => {
      setShowSavePopup(false);
      // If success, reset teacher selection
      if (type === "success") {
        setSelectedTeacherId(null);
        setTeacherClasses([]);
        setTeacherSubjectsByClass({});
      }
    }, 3000);
  };

  // Save teacher updates
  const handleSaveTeacher = async () => {
    if (!selectedTeacherId) {
      showSaveConfirmation("Please select a teacher.", "error");
      return;
    }

    if (teacherClasses.length === 0) {
      showSaveConfirmation("Teacher must have at least one class.", "error");
      return;
    }

    // Validate each class has at least one subject
    for (const className of teacherClasses) {
      if (
        !teacherSubjectsByClass[className] ||
        teacherSubjectsByClass[className].length === 0
      ) {
        showSaveConfirmation(
          `Please select at least one subject for ${className}`,
          "error"
        );
        return;
      }
    }

    try {
      const teacherRef = doc(db, "teachers", selectedTeacherId);
      await updateDoc(teacherRef, {
        classes: teacherClasses,
        subjects: teacherSubjectsByClass,
        updatedAt: new Date(),
      });

      // Update local state
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === selectedTeacherId
            ? {
                ...t,
                classes: teacherClasses,
                subjects: teacherSubjectsByClass,
              }
            : t
        )
      );

      showSaveConfirmation("✅ Teacher profile updated successfully!");
      refreshStudents();
    } catch (error: any) {
      console.error("Error updating teacher:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  // Handle promotion with subject updates
  const handlePromoteStudents = async () => {
    if (!oldClass || !newClass || oldClass === newClass) {
      showSaveConfirmation("Select valid classes for promotion.", "error");
      return;
    }

    // For SS2-SS3, show subject selection modal
    if (newClass === "SS2" || newClass === "SS3") {
      setShowSubjectModal(true);
      return;
    }

    // For other classes, auto-assign subjects
    await performPromotion(oldClass, newClass);
  };

  const performPromotion = async (
    fromClass: string,
    toClass: string,
    selectedSubjects?: string[]
  ) => {
    try {
      const studentsToPromote = students.filter(
        (s) => s.className === fromClass
      );

      for (const student of studentsToPromote) {
        const studentRef = doc(db, "students", student.id);

        // Determine new subjects based on class
        let newSubjects: string[] = [];
        if (selectedSubjects && selectedSubjects.length > 0) {
          // Use selected subjects for SS2/SS3
          newSubjects = selectedSubjects;
        } else {
          // Auto-assign based on class level
          const classLevel = getClassLevel(toClass);
          newSubjects = [...SUBJECTS_BY_LEVEL[classLevel]];
        }

        await updateDoc(studentRef, {
          className: toClass,
          subjects: newSubjects,
          promotedAt: new Date(),
        });
      }

      // Show success message in popup
      showSaveConfirmation(
        `✅ Successfully promoted ${studentsToPromote.length} students from ${fromClass} to ${toClass}`
      );

      // Refresh data
      const snap = await getDocs(collection(db, "students"));
      const data = snap.docs.map((d) => {
        const raw = d.data() as any;
        const subjects = Array.isArray(raw.subjects)
          ? raw.subjects.map((s: any) => String(s))
          : [];
        const normalizedClass = normalizeClass(
          raw.className || raw.class || ""
        );
        return {
          id: d.id,
          ...raw,
          className: normalizedClass,
          subjects,
        } as Student;
      });
      setStudents(data);

      // Reset promotion form
      setOldClass("");
      setNewClass("");
      setPromoteSubjects([]);
    } catch (error: any) {
      console.error("Error promoting students:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  const handleConfirmPromotionWithSubjects = () => {
    if (promoteSubjects.length === 0) {
      showSaveConfirmation(
        "Please select at least one subject for SS2/SS3 students.",
        "error"
      );
      return;
    }
    setShowSubjectModal(false);
    performPromotion(oldClass, newClass, promoteSubjects);
  };

  // ============ SCRATCH CARD FUNCTIONS ============

  // Function to check for secret code or perform search
  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    setSearchQuery(value); // Also update search query for filtering

    // If first character is 2 or 9, enable secret mode
    if (value.length === 1 && (value === "2" || value === "9")) {
      setIsSecretMode(true);
    }

    // Check secret codes first
    if (value.trim() === SECRET_CODE) {
      setShowScratchCardModal(true);
      setSearchInput("");
      setSearchQuery("");
      setShowSearchBar(false);
      showTemporaryMessage("✅ Special features unlocked!");
      return;
    }

    if (value.trim() === "9715") {
      setShowCardButton(true);
      setSecretUnlocked(true);
      setSearchInput("");
      setSearchQuery("");
      setShowSearchBar(false);
      showTemporaryMessage("✅ Special features unlocked!");

      setTimeout(() => {
        setShowCardButton(false);
        setShowCardList(false);
        setSecretUnlocked(false);
      }, 50000);
      return;
    }

    // If not a secret code and has at least 2 characters, perform search
    if (value.trim().length >= 2) {
      setIsSearching(true);
      performSearch(value.trim());
    } else {
      setIsSearching(false);
      setSearchResults({
        teachers: [],
        students: [],
      });
    }
  };

  // Function to perform search
  const performSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();

    // Search in teachers
    const foundTeachers = filteredTeachers.filter(
      (teacher) =>
        teacher.fullName?.toLowerCase().includes(lowerQuery) ||
        teacher.email?.toLowerCase().includes(lowerQuery) ||
        teacher.classes?.some((cls) =>
          cls.toLowerCase().includes(lowerQuery)
        ) ||
        Object.values(teacher.subjects || {}).some((subjects) =>
          subjects.some((subject) => subject.toLowerCase().includes(lowerQuery))
        )
    );

    // Search in students
    const foundStudents = filteredStudents.filter(
      (student) =>
        student.fullName?.toLowerCase().includes(lowerQuery) ||
        student.email?.toLowerCase().includes(lowerQuery) ||
        student.className?.toLowerCase().includes(lowerQuery) ||
        student.subjects?.some((subject) =>
          subject.toLowerCase().includes(lowerQuery)
        )
    );

    setSearchResults({
      teachers: foundTeachers,
      students: foundStudents,
    });
  };
  // Function to highlight search matches
  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <>
        {before}
        <span className="search-highlight">{match}</span>
        {after}
      </>
    );
  };

  // Function to show temporary message (for secret codes)
  const showTemporaryMessage = (
    message: string,
    type: "success" | "error" = "success",
    duration: number = 2000
  ) => {
    setSavePopupMessage(message);
    setSavePopupType(type);
    setShowSavePopup(true);
    setTimeout(() => setShowSavePopup(false), duration);
  };
  // Function to generate random PIN/PUK
  const generateRandomCode = (length: number = 12): string => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  // Add this function with your other handler functions
  const handleLogout = async () => {
    try {
      // If using Firebase Auth
      await signOut(auth);

      // If using a store/context for auth
      // const { logout } = useFirebaseStore(); // If you have this
      // logout();

      // Clear any local storage
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Show success message
      showSaveConfirmation("✅ Logged out successfully!");

      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "/login"; // Or your login route
      }, 1500);
    } catch (error: any) {
      console.error("Error logging out:", error);
      showSaveConfirmation(`❌ Error logging out: ${error.message}`, "error");
    }
  };
  // Function to disable/enable user account
  const toggleUserStatus = async (
    userId: string,
    userType: "teacher" | "student",
    currentStatus: boolean
  ) => {
    try {
      const collectionName = userType === "teacher" ? "teachers" : "students";
      const userRef = doc(db, collectionName, userId);

      const updateData: any = {
        disabled: !currentStatus,
        disabledAt: new Date(),
        disabledBy: "admin",
      };

      await updateDoc(userRef, updateData);

      // Update local state
      if (userType === "teacher") {
        setTeachers((prev) =>
          prev.map((t) => (t.id === userId ? { ...t, ...updateData } : t))
        );
      } else {
        setStudents((prev) =>
          prev.map((s) => (s.id === userId ? { ...s, ...updateData } : s))
        );
      }

      showSaveConfirmation(
        `✅ User ${!currentStatus ? "enabled" : "disabled"} successfully!`
      );
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  // Function to permanently delete user
  const deleteUserAccount = async () => {
    if (!userToDelete) return;

    try {
      const { id, type, email } = userToDelete;
      const collectionName = type === "teacher" ? "teachers" : "students";

      // 1. Delete from Firestore
      const userRef = doc(db, collectionName, id);
      await deleteDoc(userRef);

      // 2. Try to delete from Firebase Auth (if we have the user object)
      // Note: You need to have the user's UID. You might need to store it in Firestore
      // or fetch the user by email. This requires additional setup.

      // For now, we'll just delete from Firestore
      // You can implement Firebase Auth deletion later if needed

      // Update local state
      if (type === "teacher") {
        setTeachers((prev) => prev.filter((t) => t.id !== id));
      } else {
        setStudents((prev) => prev.filter((s) => s.id !== id));
      }

      showSaveConfirmation(
        `✅ ${type === "teacher" ? "Teacher" : "Student"} deleted successfully!`
      );

      // Close modal
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  // Function to prepare user deletion
  const prepareUserAction = (
    userId: string,
    type: "teacher" | "student",
    name: string,
    email: string,
    action: "disable" | "delete" | "enable"
  ) => {
    const user =
      type === "teacher"
        ? teachers.find((t) => t.id === userId)
        : students.find((s) => s.id === userId);

    setUserToDelete({ id: userId, type, name, email });
    setDeleteAction(action);

    if (action === "delete") {
      setShowDeleteUserModal(true);
    } else if (action === "disable" || action === "enable") {
      // Immediately toggle status for enable/disable
      toggleUserStatus(userId, type, action === "enable");
    }
  };

  // Function to add new subject
  const addNewSubject = async () => {
    try {
      if (!newSubjectForm.className || !newSubjectForm.subjectName) {
        showSaveConfirmation(
          "Please enter class name and subject name",
          "error"
        );
        return;
      }

      // Determine which category this class belongs to
      const className = newSubjectForm.className;
      const classLevel = getClassLevel(className);

      // Add to appropriate SUBJECTS_BY_LEVEL category
      const updatedSubjects = [
        ...SUBJECTS_BY_LEVEL[classLevel],
        newSubjectForm.subjectName,
      ];

      // Sort alphabetically
      updatedSubjects.sort((a, b) => a.localeCompare(b));

      // In a real app, you would save this to Firestore
      // For now, we'll update the local constant and show success

      showSaveConfirmation(
        `✅ New subject "${newSubjectForm.subjectName}" added to ${className} (${classLevel})`
      );

      // Reset form
      setNewSubjectForm({
        className: "",
        subjectName: "",
        subjectCode: "",
        description: "",
      });
      setShowAddSubjectModal(false);

      // Note: To persist this, you should create a Firestore collection for subjects
      // Here's how you could save it:
      /*
    const subjectRef = await addDoc(collection(db, 'subjects'), {
      className: newSubjectForm.className,
      subjectName: newSubjectForm.subjectName,
      subjectCode: newSubjectForm.subjectCode,
      description: newSubjectForm.description,
      category: classLevel,
      createdAt: new Date(),
      createdBy: 'admin'
    });
    */
    } catch (error: any) {
      console.error("Error adding subject:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  // Function to create scratch card
  const createScratchCard = async () => {
    try {
      // Validate inputs
      if (!scratchCardForm.pin || !scratchCardForm.puk) {
        showSaveConfirmation("Please enter both PIN and PUK", "error");
        return;
      }

      // Check if PIN already exists
      const cardsRef = collection(db, "scratchCards");
      const q = query(cardsRef, where("pin", "==", scratchCardForm.pin));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        showSaveConfirmation(
          "This PIN already exists. Please use a different PIN.",
          "error"
        );
        return;
      }

      // Create new card
      const newCard: ScratchCard = {
        pin: scratchCardForm.pin,
        puk: scratchCardForm.puk,
        createdAt: new Date(),
        usageCount: 0,
        maxUsage: scratchCardForm.maxUsage,
        isActive: true,
        usedBy: [],
      };

      // Save to Firebase
      const docRef = await addDoc(collection(db, "scratchCards"), newCard);

      // Add to local state
      const createdCard = { ...newCard, id: docRef.id };
      setGeneratedCards((prev) => [...prev, createdCard]);
      setScratchCards((prev) => [...prev, createdCard]);

      // Reset form
      setScratchCardForm({
        pin: "",
        puk: "",
        maxUsage: 3,
      });

      showSaveConfirmation("✅ Scratch card created successfully!");
    } catch (error: any) {
      console.error("Error creating scratch card:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  // Function to load all scratch cards
  const loadScratchCards = async () => {
    try {
      const cardsSnap = await getDocs(collection(db, "scratchCards"));
      const cardsData = cardsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          pin: data.pin,
          puk: data.puk,
          createdAt: data.createdAt?.toDate() || new Date(),
          usageCount: data.usageCount || 0,
          maxUsage: data.maxUsage || 3,
          isActive: data.isActive !== false,
          usedBy: data.usedBy || [],
          lastUsedAt: data.lastUsedAt?.toDate(),
        } as ScratchCard;
      });

      // Sort by creation date (newest first)
      cardsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setScratchCards(cardsData);
    } catch (error: any) {
      console.error("Error loading scratch cards:", error);
      showSaveConfirmation(`❌ Error loading cards: ${error.message}`, "error");
    }
  };

  // Function to toggle card status
  const toggleCardStatus = async (cardId: string, currentStatus: boolean) => {
    try {
      const cardRef = doc(db, "scratchCards", cardId);
      await updateDoc(cardRef, {
        isActive: !currentStatus,
      });

      // Update local state
      setScratchCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, isActive: !currentStatus } : card
        )
      );

      showSaveConfirmation(
        `✅ Card ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
    } catch (error: any) {
      console.error("Error toggling card status:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  // Function to delete card from database
  const deleteCard = async (cardId: string) => {
    if (!cardId) {
      showSaveConfirmation("❌ No card selected for deletion", "error");
      return;
    }

    try {
      const cardRef = doc(db, "scratchCards", cardId);

      // Permanently delete from Firebase
      await deleteDoc(cardRef);

      // Remove from local state
      setScratchCards((prev) => prev.filter((card) => card.id !== cardId));
      setGeneratedCards((prev) => prev.filter((card) => card.id !== cardId));

      showSaveConfirmation("✅ Card permanently deleted from database!");
    } catch (error: any) {
      console.error("Error deleting card:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  // Render helpers
  const renderTeacherClassesAndSubjects = (teacher: Teacher) => {
    const classes = teacher.classes || [];
    const subjects = teacher.subjects || {};
    const expanded = !!expandedTeacherRows[teacher.id];

    return (
      <div className="teacher-classes-cell">
        <button
          className="mini-toggle"
          onClick={() =>
            setExpandedTeacherRows((prev) => ({
              ...prev,
              [teacher.id]: !prev[teacher.id],
            }))
          }
        >
          <span>
            {classes.length} class{classes.length !== 1 ? "es" : ""}
          </span>
          <span className="chev">{expanded ? "▾" : "▸"}</span>
        </button>

        {expanded && (
          <div className="teacher-details">
            {classes.map((className) => (
              <div key={className} className="class-subject-group">
                <strong>{className}:</strong>
                <div className="subject-chips">
                  {(subjects[className] || []).map((subject) => (
                    <span key={subject} className="chip">
                      {subject}
                    </span>
                  ))}
                  {(!subjects[className] ||
                    subjects[className].length === 0) && (
                    <span className="muted">No subjects</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStudentSubjects = (student: Student) => {
    const subjects = student.subjects || [];
    const expanded = !!expandedStudentRows[student.id];

    return (
      <div className="subjects-cell">
        <button
          className="mini-toggle"
          onClick={() =>
            setExpandedStudentRows((prev) => ({
              ...prev,
              [student.id]: !prev[student.id],
            }))
          }
        >
          <span>
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
          </span>
          <span className="chev">{expanded ? "▾" : "▸"}</span>
        </button>

        {expanded && (
          <ul className="subjects-list">
            {subjects.map((subject) => (
              <li key={subject}>{subject}</li>
            ))}
            {subjects.length === 0 && <li className="muted">No subjects</li>}
          </ul>
        )}
      </div>
    );
  };

  // Available classes
  const availableClasses = [
    "P5",
    "P6",
    "JSS1",
    "JSS2",
    "JSS3",
    "SS1",
    "SS2",
    "SS3",
  ];

  return (
    <div className="dashboard-container">
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            {/* Replace this div with your logo */}
            <div className="logo-placeholder">
              <img
                src={logo}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #4299e1",
                }}
              />
              {!sidebarCollapsed && <span className="logo-text">SXaint</span>}
            </div>
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? "▶" : "◀"}
          </button>
        </div>

        <nav>
          <ul>
            <li className="active">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              {!sidebarCollapsed && <span>Dashboard</span>}
            </li>
            <li>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              {!sidebarCollapsed && <span>Teachers</span>}
            </li>
            <li>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              {!sidebarCollapsed && <span>Students</span>}
            </li>
            <li>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
              {!sidebarCollapsed && <span>Reports</span>}
            </li>
            <li>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
              {!sidebarCollapsed && <span>Settings</span>}
            </li>
          </ul>
        </nav>

        {!sidebarCollapsed && (
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">AD</div>
              <div>
                <div className="user-name">Administrator</div>
                <div className="user-role">Super Admin</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
        <div className="topbar">
          <div className="page-title">
            <h1>Admin Dashboard</h1>
            <p className="breadcrumb">Home / Dashboard</p>
          </div>

          <div className="topbar-right">
            <div className="search-container">
              {showSearchBar ? (
                <div className="search-input-wrapper">
                  <input
                    type={isSecretMode ? "password" : "search"}
                    placeholder={
                      isSecretMode
                        ? "Enter code..."
                        : "Search teachers/students ..."
                    }
                    value={searchInput}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    autoFocus
                    className={isSecretMode ? "secret-input" : ""}
                  />
                  {isSearching && searchQuery && (
                    <div className="search-results-count">
                      Found: {searchResults.teachers.length} teachers,{" "}
                      {searchResults.students.length} students
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="search-trigger"
                  onClick={() => setShowSearchBar(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
                      stroke="#718096"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21 21L16.65 16.65"
                      stroke="#718096"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Search students/teachers...</span>
                </div>
              )}
              {showSearchBar && (
                <button
                  className="cancel-search"
                  onClick={() => {
                    setShowSearchBar(false);
                    setSearchInput("");
                    setSearchQuery("");
                    setIsSearching(false);
                    setIsSecretMode(false);
                    setSearchResults({
                      teachers: [],
                      students: [],
                    });
                    setShowCardButton(false);
                    setShowCardList(false);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="topbar-actions">
              <button className="action-btn notification-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                    stroke="#718096"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                    stroke="#718096"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="17" cy="5" r="4" fill="#e53e3e" />
                </svg>
                <span className="notification-count">3</span>
              </button>

              <div className="profile-dropdown-container">
                <button
                  className="action-btn"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="6"
                      r="4"
                      stroke="#718096"
                      strokeWidth="2"
                    />
                    <path
                      d="M20 17.5C20 19.985 20 22 12 22C4 22 4 19.985 4 17.5C4 15.015 8.582 13 12 13C15.418 13 20 15.015 20 17.5Z"
                      stroke="#718096"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Profile</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ marginLeft: "4px", transition: "transform 0.2s" }}
                    className={showProfileDropdown ? "dropdown-open" : ""}
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="#718096"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {showProfileDropdown && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">AD</div>
                      <div>
                        <div className="dropdown-name">Administrator</div>
                        <div className="dropdown-email">{ADMIN_EMAIL}</div>
                        <div className="dropdown-role">Super Admin</div>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-menu">
                      <button className="dropdown-item">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z"
                            stroke="#4a5568"
                            strokeWidth="2"
                          />
                          <path
                            d="M4 20V18C4 15.79 5.79 14 8 14H16C18.21 14 20 15.79 20 18V20"
                            stroke="#4a5568"
                            strokeWidth="2"
                          />
                        </svg>
                        <span>My Profile</span>
                      </button>

                      <button className="dropdown-item">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                            stroke="#4a5568"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M19.4 15C21.176 12.479 21.176 8.52101 19.4 6C17.624 3.479 14.376 3.479 12.6 6"
                            stroke="#4a5568"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M4.6 15C2.824 12.479 2.824 8.52101 4.6 6C6.376 3.479 9.624 3.479 11.4 6"
                            stroke="#4a5568"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Settings</span>
                      </button>

                      <button className="dropdown-item">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 15V3M12 15L8 11M12 15L16 11"
                            stroke="#4a5568"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 17L2 21H22V17"
                            stroke="#4a5568"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Activity Log</span>
                      </button>

                      <div className="dropdown-divider"></div>
                      <button
                        className="dropdown-item logout-item"
                        onClick={() => {
                          // Call the logout function
                          handleLogout();
                          setShowProfileDropdown(false);
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                            stroke="#e53e3e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M16 17L21 12L16 7"
                            stroke="#e53e3e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M21 12H9"
                            stroke="#e53e3e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {showCardButton && (
                <button
                  className="action-btn special-btn"
                  onClick={() => setShowCardList(!showCardList)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="2"
                      y="7"
                      width="20"
                      height="14"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M7 7V5.5C7 4.11929 8.11929 3 9.5 3H14.5C15.8807 3 17 4.11929 17 5.5V7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 11V17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15 14H9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>{showCardList ? "Hide Cards" : "View Cards"}</span>
                  {secretUnlocked && (
                    <span className="secret-indicator">⚡</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "rgba(66, 153, 225, 0.1)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#4299e1">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>{filteredTeachers.length}</h3>
              <p>Total Teachers</p>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "rgba(56, 161, 105, 0.1)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#38a169">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3>{filteredStudents.length}</h3>
              <p>Total Students</p>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "rgba(214, 158, 46, 0.1)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#d69e2e">
                <path
                  d="M4 6H20V16H4V6Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 10L18 10"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 10L2 10"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 20V16"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 16H14"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="stat-content">
              <h3>{scratchCards.filter((c) => c.isActive).length}</h3>
              <p>Active Cards</p>
            </div>
          </div>

          <div className="stat-card">
            <div
              className="stat-icon"
              style={{ backgroundColor: "rgba(229, 62, 62, 0.1)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#e53e3e">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="stat-content">
              <h3>{availableClasses.length}</h3>
              <p>Classes</p>
            </div>
          </div>
        </div>

        {/* Search Results Section */}
        {isSearching && searchQuery && (
          <section className="management search-results-section">
            <div className="section-header">
              <h2>Search Results for "{searchQuery}"</h2>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setIsSearching(false);
                  setSearchResults({
                    teachers: [],
                    students: [],
                  });
                }}
              >
                Clear Search
              </button>
            </div>

            {searchResults.teachers.length === 0 &&
            searchResults.students.length === 0 ? (
              <div className="no-results">
                <p>No teachers or students found matching "{searchQuery}"</p>
              </div>
            ) : (
              <>
                {/* Teachers Results */}
                {searchResults.teachers.length > 0 && (
                  <div className="search-results-group">
                    <h3>Teachers ({searchResults.teachers.length})</h3>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Full name</th>
                            <th>Email</th>
                            <th>Classes & Subjects</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.teachers.map((t) => (
                            <tr key={t.id}>
                              <td>{t.fullName}</td>
                              <td>{t.email || "N/A"}</td>
                              <td>{renderTeacherClassesAndSubjects(t)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Students Results */}
                {searchResults.students.length > 0 && (
                  <div className="search-results-group">
                    <h3>Students ({searchResults.students.length})</h3>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Full name</th>
                            <th>Email</th>
                            <th>Class</th>
                            <th>Subjects</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.students.map((s) => (
                            <tr key={s.id}>
                              <td>{s.fullName}</td>
                              <td>{s.email || "N/A"}</td>
                              <td>{s.className || "N/A"}</td>
                              <td>{renderStudentSubjects(s)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Teacher Management */}
        <div className="content-grid">
          <section className="management">
            <div className="section-header">
              <h2>Teacher Management</h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowAddSubjectModal(true)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Add New Subject
                </button>
                <span className="section-subtitle"></span>
              </div>
              <span className="section-subtitle"></span>
            </div>

            <div className="row">
              <select
                value={selectedTeacherId || ""}
                onChange={(e) => handleSelectTeacher(e.target.value)}
              >
                <option value="">Select Teacher</option>
                {filteredTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>

              <button className="btn-primary" onClick={handleSaveTeacher}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM12 19C10.34 19 9 17.66 9 16C9 14.34 10.34 13 12 13C13.66 13 15 14.34 15 16C15 17.66 13.66 19 12 19ZM15 9H5V5H15V9Z" />
                </svg>
                Save Teacher Profile
              </button>
            </div>

            {/* Teacher Classes Selection - Only show when teacher is selected */}
            {selectedTeacherId && (
              <div className="teacher-management-section">
                <div className="section-header">
                  <h3>Select Classes</h3>
                  <button
                    className="select-all-btn"
                    onClick={() => {
                      if (teacherClasses.length === availableClasses.length) {
                        setTeacherClasses([]);
                        setTeacherSubjectsByClass({});
                      } else {
                        setTeacherClasses([...availableClasses]);
                        const newSubjects: { [key: string]: string[] } = {};
                        availableClasses.forEach((cls) => {
                          newSubjects[cls] = [];
                        });
                        setTeacherSubjectsByClass(newSubjects);
                      }
                    }}
                  >
                    {teacherClasses.length === availableClasses.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="classes-grid">
                  {availableClasses.map((className) => (
                    <label
                      key={className}
                      className={`class-checkbox ${
                        teacherClasses.includes(className) ? "selected" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={teacherClasses.includes(className)}
                        onChange={() => handleTeacherClassToggle(className)}
                      />
                      {className}
                    </label>
                  ))}
                </div>

                {/* Subjects for each selected class */}
                {teacherClasses.length > 0 && (
                  <div className="subjects-management">
                    <h3>Subjects per Class</h3>
                    {teacherClasses.map((className) => (
                      <div key={className} className="class-subjects-panel">
                        <div className="panel-header">
                          <h4>Subjects for {className}</h4>
                          <button
                            className="select-all-subjects-btn"
                            onClick={() => handleSelectAllSubjects(className)}
                          >
                            {teacherSubjectsByClass[className]?.length ===
                            SUBJECTS_BY_LEVEL[getClassLevel(className)].length
                              ? "Deselect All"
                              : "Select All"}
                          </button>
                        </div>

                        <div className="subjects-grid">
                          {SUBJECTS_BY_LEVEL[getClassLevel(className)].map(
                            (subject) => (
                              <label
                                key={subject}
                                className={`subject-checkbox ${
                                  teacherSubjectsByClass[className]?.includes(
                                    subject
                                  )
                                    ? "selected"
                                    : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    teacherSubjectsByClass[className]?.includes(
                                      subject
                                    ) || false
                                  }
                                  onChange={() =>
                                    handleTeacherSubjectToggle(
                                      className,
                                      subject
                                    )
                                  }
                                />
                                {subject}
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Promote Students */}
          <section className="management">
            <div className="section-header">
              <h2>Promote Students</h2>
              <span className="section-subtitle">
                Move students to next class
              </span>
            </div>
            <div className="row">
              <select
                value={oldClass}
                onChange={(e) => setOldClass(e.target.value)}
              >
                <option value="">From Class</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
              >
                <option value="">To Class</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button className="btn-primary" onClick={handlePromoteStudents}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M16 6L18.29 8.29L13.41 13.17L9.41 9.17L2 16.59L3.41 18L9.41 12L13.41 16L19.71 9.71L22 12V6H16Z" />
                </svg>
                Promote
              </button>
            </div>

            {oldClass && (
              <div className="promotion-info">
                <p>
                  <strong>
                    {students.filter((s) => s.className === oldClass).length}
                  </strong>{" "}
                  students in {oldClass}
                </p>
              </div>
            )}
          </section>
        </div>

        {!isSearching && (
          <div className="content-grid full-width">
            {/* Students Table */}
            <section className="management">
              <div className="section-header">
                <h2>All Students ({filteredStudents.length})</h2>
                <span className="section-subtitle">
                  Manage student information
                </span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Full name</th>
                      <th>Email</th>
                      <th>Class</th>
                      <th>Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr
                        key={s.id}
                        className={s.disabled ? "disabled-user" : ""}
                      >
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-small">S</div>
                            <div>
                              <span>{s.fullName}</span>
                              {s.disabled && (
                                <span className="disabled-badge">Disabled</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{s.email || "N/A"}</td>
                        <td>
                          <span className="class-badge">
                            {s.className || "N/A"}
                          </span>
                        </td>
                        <td>{renderStudentSubjects(s)}</td>
                        <td>
                          <div className="user-actions">
                            {s.disabled ? (
                              <button
                                className="enable-btn"
                                onClick={() =>
                                  prepareUserAction(
                                    s.id,
                                    "student",
                                    s.fullName,
                                    s.email || "",
                                    "enable"
                                  )
                                }
                              >
                                Enabled
                              </button>
                            ) : (
                              <button
                                className="disable-btn"
                                onClick={() =>
                                  prepareUserAction(
                                    s.id,
                                    "student",
                                    s.fullName,
                                    s.email || "",
                                    "disable"
                                  )
                                }
                              >
                                Disabled
                              </button>
                            )}
                            <button
                              className="delete-user-btn"
                              onClick={() =>
                                prepareUserAction(
                                  s.id,
                                  "student",
                                  s.fullName,
                                  s.email || "",
                                  "delete"
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Teachers Table */}
            <section className="management">
              <div className="section-header">
                <h2>All Teachers ({filteredTeachers.length})</h2>
                <span className="section-subtitle">
                  Manage teacher information
                </span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Full name</th>
                      <th>Email</th>
                      <th>Classes & Subjects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((t) => (
                      <tr
                        key={t.id}
                        className={t.disabled ? "disabled-user" : ""}
                      >
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-small">T</div>
                            <div>
                              <span>{t.fullName}</span>
                              {t.disabled && (
                                <span className="disabled-badge">Disabled</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{t.email || "N/A"}</td>
                        <td>{renderTeacherClassesAndSubjects(t)}</td>
                        <td>
                          <div className="user-actions">
                            {t.disabled ? (
                              <button
                                className="enable-btn"
                                onClick={() =>
                                  prepareUserAction(
                                    t.id,
                                    "teacher",
                                    t.fullName,
                                    t.email || "",
                                    "enable"
                                  )
                                }
                              >
                                Enabled
                              </button>
                            ) : (
                              <button
                                className="disable-btn"
                                onClick={() =>
                                  prepareUserAction(
                                    t.id,
                                    "teacher",
                                    t.fullName,
                                    t.email || "",
                                    "disable"
                                  )
                                }
                              >
                                Disabled
                              </button>
                            )}
                            <button
                              className="delete-user-btn"
                              onClick={() =>
                                prepareUserAction(
                                  t.id,
                                  "teacher",
                                  t.fullName,
                                  t.email || "",
                                  "delete"
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
        {/* Scratch Cards List Section */}
        {showCardList && (
          <section className="management">
            <div className="section-header">
              <h2>
                Scratch Cards ({scratchCards.filter((c) => c.isActive).length}{" "}
                active)
              </h2>
              <button onClick={loadScratchCards}>Refresh</button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>PIN</th>
                    <th>PUK</th>
                    <th>Usage</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Last Used</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scratchCards.map((card) => (
                    <tr
                      key={card.id}
                      className={!card.isActive ? "inactive-card" : ""}
                    >
                      <td>
                        <code>{card.pin}</code>
                      </td>
                      <td>
                        <code>{card.puk}</code>
                      </td>
                      <td>
                        <div className="usage-info">
                          <span className="usage-count">
                            {card.usageCount}/{card.maxUsage}
                          </span>
                          <div className="usage-bar">
                            <div
                              className="usage-fill"
                              style={{
                                width: `${
                                  (card.usageCount / card.maxUsage) * 100
                                }%`,
                                backgroundColor:
                                  card.usageCount >= card.maxUsage
                                    ? "#e53e3e"
                                    : card.usageCount >= card.maxUsage * 0.8
                                    ? "#d69e2e"
                                    : "#38a169",
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            card.isActive ? "active" : "inactive"
                          }`}
                        >
                          {card.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{card.createdAt.toLocaleDateString()}</td>
                      <td>
                        {card.lastUsedAt
                          ? card.lastUsedAt.toLocaleDateString()
                          : "Never"}
                      </td>
                      <td>
                        <div className="card-actions">
                          <button
                            className="toggle-btn"
                            onClick={() =>
                              card.id &&
                              toggleCardStatus(card.id, card.isActive)
                            }
                          >
                            {card.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => {
                              setCardToDelete(card.id || "");
                              setShowDeleteModal(true);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {scratchCards.length === 0 && (
                    <tr>
                      <td colSpan={7} className="no-data">
                        <div className="empty-state">
                          <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="#718096"
                          >
                            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" />
                          </svg>
                          <p>No scratch cards created yet.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Subject Selection Modal for SS2/SS3 Promotion */}
        {showSubjectModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Select Subjects for {newClass}</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowSubjectModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <p>
                  Please select the subjects for students being promoted to{" "}
                  {newClass}:
                </p>

                <div className="subjects-grid-modal">
                  {SUBJECTS_BY_LEVEL["SS1-SS3"].map((subject) => (
                    <label
                      key={subject}
                      className={`subject-checkbox ${
                        promoteSubjects.includes(subject) ? "selected" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={promoteSubjects.includes(subject)}
                        onChange={() => {
                          setPromoteSubjects((prev) =>
                            prev.includes(subject)
                              ? prev.filter((s) => s !== subject)
                              : [...prev, subject]
                          );
                        }}
                      />
                      {subject}
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowSubjectModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleConfirmPromotionWithSubjects}
                  disabled={promoteSubjects.length === 0}
                >
                  Confirm Promotion ({promoteSubjects.length} subjects)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Confirmation Popup */}
        {showSavePopup && (
          <div className="modal-overlay">
            <div className="save-popup">
              <div className={`popup-content ${savePopupType}`}>
                <div className="popup-icon">
                  {savePopupType === "success" ? "✅" : "❌"}
                </div>
                <h3>{savePopupType === "success" ? "Success!" : "Error!"}</h3>
                <p>{savePopupMessage}</p>
                <div className="popup-progress">
                  <div className="progress-bar"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Scratch Card Creation Modal */}
        {showScratchCardModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Create Scratch Card</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowScratchCardModal(false);
                    setScratchCardForm({
                      pin: "",
                      puk: "",
                      maxUsage: 3,
                    });
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>PIN (12 characters recommended)</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      value={scratchCardForm.pin}
                      onChange={(e) =>
                        setScratchCardForm((prev) => ({
                          ...prev,
                          pin: e.target.value,
                        }))
                      }
                      placeholder="Enter or generate PIN"
                      maxLength={20}
                    />
                    <button
                      className="generate-btn"
                      onClick={() =>
                        setScratchCardForm((prev) => ({
                          ...prev,
                          pin: generateRandomCode(12),
                        }))
                      }
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>PUK (12 characters recommended)</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      value={scratchCardForm.puk}
                      onChange={(e) =>
                        setScratchCardForm((prev) => ({
                          ...prev,
                          puk: e.target.value,
                        }))
                      }
                      placeholder="Enter or generate PUK"
                      maxLength={20}
                    />
                    <button
                      className="generate-btn"
                      onClick={() =>
                        setScratchCardForm((prev) => ({
                          ...prev,
                          puk: generateRandomCode(12),
                        }))
                      }
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Maximum Usage Count</label>
                  <input
                    type="number"
                    value={scratchCardForm.maxUsage}
                    onChange={(e) =>
                      setScratchCardForm((prev) => ({
                        ...prev,
                        maxUsage: parseInt(e.target.value) || 3,
                      }))
                    }
                    min="1"
                    max="100"
                  />
                  <small>Card will be disabled after reaching this limit</small>
                </div>

                {/* Preview generated cards */}
                {generatedCards.length > 0 && (
                  <div className="generated-cards">
                    <h4>Recently Generated Cards:</h4>
                    {generatedCards.slice(-3).map((card, index) => (
                      <div key={index} className="card-preview">
                        <div>
                          PIN: <strong>{card.pin}</strong>
                        </div>
                        <div>
                          PUK: <strong>{card.puk}</strong>
                        </div>
                        <div>Max Usage: {card.maxUsage}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowScratchCardModal(false);
                    setScratchCardForm({
                      pin: "",
                      puk: "",
                      maxUsage: 3,
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={createScratchCard}
                  disabled={!scratchCardForm.pin || !scratchCardForm.puk}
                >
                  Create Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && cardToDelete && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>⚠️ Delete Scratch Card</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCardToDelete(null);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="warning-message">
                  <div className="warning-icon">⚠️</div>
                  <h4>Are you sure you want to delete this card?</h4>
                  <p>This action will:</p>
                  <ul>
                    <li>Permanently delete the card from the database</li>
                    <li>Remove all usage history</li>
                    <li>This action cannot be undone!</li>
                  </ul>
                  <p className="warning-note">
                    <strong>Note:</strong> If the card has been used by
                    students/teachers, they will no longer be able to use it.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCardToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={async () => {
                    await deleteCard(cardToDelete);
                    setShowDeleteModal(false);
                    setCardToDelete(null);
                  }}
                >
                  Yes, Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete User Modal */}
        {showDeleteUserModal && userToDelete && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>
                  ⚠️ Delete{" "}
                  {userToDelete.type === "teacher" ? "Teacher" : "Student"}
                </h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setUserToDelete(null);
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="warning-message">
                  <div className="warning-icon">⚠️</div>
                  <h4>
                    Are you sure you want to delete this {userToDelete.type}?
                  </h4>
                  <p>
                    <strong>Name:</strong> {userToDelete.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {userToDelete.email}
                  </p>
                  <p>This action will:</p>
                  <ul>
                    <li>
                      Permanently delete the {userToDelete.type} from the
                      database
                    </li>
                    <li>Remove all associated data</li>
                    <li>This action cannot be undone!</li>
                  </ul>
                  <p className="warning-note">
                    <strong>Note:</strong> Consider disabling the account
                    instead if you want to temporarily restrict access.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setUserToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button className="btn-danger" onClick={deleteUserAccount}>
                  Yes, Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add New Subject Modal */}
        {showAddSubjectModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>➕ Add New Subject</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setNewSubjectForm({
                      className: "",
                      subjectName: "",
                      subjectCode: "",
                      description: "",
                    });
                  }}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Select Class Level</label>
                  <select
                    value={subjectCategory}
                    onChange={(e) => setSubjectCategory(e.target.value as any)}
                  >
                    <option value="P5-P6">Primary 5-6</option>
                    <option value="JSS1-JSS3">JSS 1-3</option>
                    <option value="SS1-SS3">SS 1-3</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Class Name</label>
                  <select
                    value={newSubjectForm.className}
                    onChange={(e) =>
                      setNewSubjectForm((prev) => ({
                        ...prev,
                        className: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Class</option>
                    {subjectCategory === "P5-P6" && (
                      <>
                        <option value="P5">Primary 5</option>
                        <option value="P6">Primary 6</option>
                      </>
                    )}
                    {subjectCategory === "JSS1-JSS3" && (
                      <>
                        <option value="JSS1">JSS 1</option>
                        <option value="JSS2">JSS 2</option>
                        <option value="JSS3">JSS 3</option>
                      </>
                    )}
                    {subjectCategory === "SS1-SS3" && (
                      <>
                        <option value="SS1">SS 1</option>
                        <option value="SS2">SS 2</option>
                        <option value="SS3">SS 3</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject Name *</label>
                  <input
                    type="text"
                    value={newSubjectForm.subjectName}
                    onChange={(e) =>
                      setNewSubjectForm((prev) => ({
                        ...prev,
                        subjectName: e.target.value,
                      }))
                    }
                    placeholder="e.g., Advanced Mathematics"
                  />
                </div>

                <div className="form-group">
                  <label>Subject Code (Optional)</label>
                  <input
                    type="text"
                    value={newSubjectForm.subjectCode}
                    onChange={(e) =>
                      setNewSubjectForm((prev) => ({
                        ...prev,
                        subjectCode: e.target.value,
                      }))
                    }
                    placeholder="e.g., MATH301"
                  />
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    value={newSubjectForm.description}
                    onChange={(e) =>
                      setNewSubjectForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of the subject"
                    rows={3}
                  />
                </div>

                <div className="existing-subjects">
                  <h4>Existing Subjects for {subjectCategory}</h4>
                  <div className="subject-chips">
                    {SUBJECTS_BY_LEVEL[subjectCategory].map((subject) => (
                      <span key={subject} className="chip">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddSubjectModal(false);
                    setNewSubjectForm({
                      className: "",
                      subjectName: "",
                      subjectCode: "",
                      description: "",
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={addNewSubject}
                  disabled={
                    !newSubjectForm.className || !newSubjectForm.subjectName
                  }
                >
                  Add Subject
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        :root { 
          --primary: #4299e1; 
          --primary-light: rgba(66, 153, 225, 0.1);
          --primary-hover: #3182ce;
          --success: #38a169;
          --success-light: rgba(56, 161, 105, 0.1);
          --danger: #e53e3e;
          --danger-light: rgba(229, 62, 62, 0.1);
          --warning: #d69e2e;
          --warning-light: rgba(214, 158, 46, 0.1);
          --muted: #718096;
          --bg: #f7fafc;
          --border: #e2e8f0;
          --card-bg: #ffffff;
          --sidebar-width: 260px;
          --sidebar-collapsed: 80px;
          --topbar-height: 70px;
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: var(--bg);
          color: #2d3748;
        }
        
        .dashboard-container { 
          display: flex; 
          min-height: 100vh;
          background: var(--bg);
        }
        
        /* Sidebar Styles */
        .sidebar { 
          width: var(--sidebar-width);
          background: var(--card-bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width 0.3s ease;
          position: fixed;
          height: 100vh;
          z-index: 100;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
        }
        
        .sidebar.collapsed {
          width: var(--sidebar-collapsed);
        }
        
        .sidebar-header {
          padding: 20px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: var(--topbar-height);
        }
        
        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-placeholder {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          background: var(--primary-light);
        }
        
        .logo-text {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary);
        }
        
        .sidebar-toggle {
          background: none;
          border: none;
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--muted);
          transition: all 0.2s;
        }
        
        .sidebar-toggle:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
        
        .sidebar nav {
          flex: 1;
          padding: 20px 0;
        }
        
        .sidebar ul { 
          list-style: none; 
          padding: 0; 
          margin: 0; 
        }
        
        .sidebar li { 
          padding: 12px 20px; 
          color: #4a5568;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          margin: 4px 8px;
          border-radius: 8px;
          font-weight: 500;
        }
        
        .sidebar li:hover {
          background: var(--primary-light);
          color: var(--primary);
        }
        
        .sidebar li.active {
          background: var(--primary);
          color: white;
        }
        
        .sidebar li.active svg {
          fill: white;
        }
        
        .sidebar-footer {
          padding: 20px 16px;
          border-top: 1px solid var(--border);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }
        
        .user-name {
          font-weight: 600;
          font-size: 14px;
          color: #2d3748;
        }
        
        .user-role {
          font-size: 12px;
          color: var(--muted);
        }
        
        /* Main Content Styles */
        .main-content { 
          flex: 1; 
          padding: 24px; 
          margin-left: var(--sidebar-width);
          transition: margin-left 0.3s ease;
        }
        
        .main-content.expanded {
          margin-left: var(--sidebar-collapsed);
        }
        
        /* Topbar Styles */
        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .page-title h1 {
          font-size: 24px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 4px;
        }
        
        .breadcrumb {
          font-size: 14px;
          color: var(--muted);
        }
        
        /* Search Styles */
        .search-container {
          position: relative;
          min-width: 300px;
        }
        
        .search-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          color: var(--muted);
          transition: all 0.2s;
        }
        
        .search-trigger:hover {
          border-color: var(--primary);
        }
        
        .search-input-wrapper {
          position: relative;
        }
        
        .search-input-wrapper input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid var(--primary);
          border-radius: 8px;
          font-size: 14px;
          background: var(--card-bg);
          transition: all 0.2s;
        }
        
        .search-input-wrapper input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }
        
        .cancel-search {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--primary);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.5s;
        }
        
        .cancel-search:hover {
          background: var(--primary-hover);
          transform: translateY(-45%) !important; 
        }
        
        /* Topbar Actions */
        .topbar-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--muted);
          transition: all 0.2s;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .action-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        
        .notification-btn {
          position: relative;
        }
        
        .notification-count {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--danger);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }
        
        .special-btn {
          background: var(--primary-light);
          color: var(--primary);
          border-color: rgba(66, 153, 225, 0.3);
        }
        
        .secret-indicator {
          animation: pulse 2s infinite;
          font-size: 12px;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 20px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }
        
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-content h3 {
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 4px;
        }
        
        .stat-content p {
          font-size: 14px;
          color: var(--muted);
        }
        
        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }
        
        .content-grid.full-width {
          grid-template-columns: 1fr;
        }
        
        /* Management Sections */
        .management { 
          background: var(--card-bg); 
          padding: 24px; 
          border-radius: 12px; 
          border: 1px solid var(--border);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
          transition: box-shadow 0.2s;
        }
        
        .management:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .management h2 {
          margin: 0 0 4px 0;
          font-size: 18px;
          color: #2d3748;
          font-weight: 600;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        
        .section-subtitle {
          font-size: 14px;
          color: var(--muted);
        }
        
        .row { 
          display: flex; 
          gap: 12px; 
          align-items: center; 
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        select { 
          padding: 12px 16px; 
          border-radius: 8px; 
          border: 1px solid var(--border);
          background: var(--card-bg);
          font-size: 14px;
          min-width: 200px;
          color: #4a5568;
          transition: border-color 0.2s;
        }
        
        select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }
        
        /* Buttons */
        button {
          padding: 12px 20px;
          border-radius: 8px;
          border: none;
          background: var(--card-bg);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          color: #4a5568;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border);
        }
        
        button:hover {
          transform: translateY(-1px);
        }
        
        .btn-primary {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        
        .btn-primary:hover {
          background: var(--primary-hover);
          border-color: var(--primary-hover);
        }
        
        .btn-secondary {
          background: var(--card-bg);
          color: #4a5568;
          border-color: var(--border);
        }
        
        .btn-secondary:hover {
          background: #f7fafc;
        }
        
        .btn-danger {
          background: var(--danger);
          color: white;
          border-color: var(--danger);
        }
        
        .btn-danger:hover {
          background: #c53030;
          border-color: #c53030;
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        /* Teacher Management */
        .teacher-management-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        
        .select-all-btn, .select-all-subjects-btn {
          padding: 8px 16px;
          font-size: 13px;
          background: var(--primary-light);
          color: var(--primary);
          border: none;
        }
        
        .select-all-btn:hover, .select-all-subjects-btn:hover {
          background: rgba(66, 153, 225, 0.2);
        }
        
        .classes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .class-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 2px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          justify-content: center;
        }
        
        .class-checkbox:hover {
          border-color: var(--primary);
        }
        
        .class-checkbox.selected {
          border-color: var(--primary);
          background: var(--primary-light);
          color: var(--primary);
        }
        
        .class-checkbox input {
          margin: 0;
        }
        
        .subjects-management {
          margin-top: 24px;
        }
        
        .class-subjects-panel {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        
        .subject-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          background: var(--card-bg);
        }
        
        .subject-checkbox:hover {
          border-color: var(--primary);
        }
        
        .subject-checkbox.selected {
          border-color: var(--primary);
          background: var(--primary-light);
          color: var(--primary);
        }
        
        .promotion-info {
          background: var(--success-light);
          border: 1px solid rgba(56, 161, 105, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }
        
        .promotion-info p {
          margin: 0;
          color: #276749;
        }
        
        /* Tables */
        .table-wrap { 
          overflow: auto; 
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-top: 16px;
        }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
        }
        
        th, td { 
          border-bottom: 1px solid var(--border); 
          padding: 16px; 
          text-align: left; 
          vertical-align: middle; 
        }
        
        th { 
          background: var(--bg); 
          font-weight: 600; 
          color: #4a5568;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        
        tr:hover {
          background: var(--bg);
        }
        
        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
        }
        
        .class-badge {
          padding: 4px 12px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
        }
        
        /* Teacher and Student Details */
        .teacher-classes-cell, .subjects-cell {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .mini-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--card-bg);
          cursor: pointer;
          font-size: 14px;
          color: #4a5568;
          transition: all 0.2s;
          width: fit-content;
          min-width: 120px;
        }
        
        .mini-toggle:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        
        .teacher-details {
          padding: 16px;
          background: var(--bg);
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        
        .class-subject-group {
          margin-bottom: 16px;
        }
        
        .class-subject-group:last-child {
          margin-bottom: 0;
        }
        
        .subject-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .chip {
          padding: 4px 12px;
          background: var(--card-bg);
          border-radius: 16px;
          font-size: 13px;
          color: #4a5568;
          border: 1px solid var(--border);
        }
        
        .subjects-list {
          margin: 0;
          padding-left: 20px;
        }
        
        .subjects-list li {
          margin: 8px 0;
          color: #4a5568;
          font-size: 14px;
        }
        
        .muted { 
          color: var(--muted);
          font-style: italic;
        }
        
        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
          padding: 20px;
        }
        
        .modal {
          background: var(--card-bg);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          animation: modalSlideIn 0.3s ease;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .modal-header {
          padding: 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #2d3748;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--muted);
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background-color 0.2s;
        }
        
        .modal-close:hover {
          background: var(--bg);
        }
        
        .modal-body {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        
        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        /* Scratch Card Styles */
        .input-with-button {
          display: flex;
          gap: 8px;
        }
        
        .generate-btn {
          padding: 8px 16px;
          font-size: 13px;
          background: var(--primary-light);
          color: var(--primary);
          border: none;
          white-space: nowrap;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #4a5568;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid var(--border);
          font-size: 14px;
          background: var(--card-bg);
        }
        
        .form-group input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }
        
        .generated-cards {
          margin-top: 24px;
          padding: 20px;
          background: var(--bg);
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        
        .generated-cards h4 {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #4a5568;
        }
        
        .card-preview {
          padding: 12px;
          background: var(--card-bg);
          border-radius: 8px;
          margin-bottom: 8px;
          border: 1px solid var(--border);
        }
        
        .card-preview:last-child {
          margin-bottom: 0;
        }
        
        /* Usage Bar */
        .usage-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .usage-count {
          font-weight: 500;
          color: #4a5568;
        }
        
        .usage-bar {
          height: 6px;
          background: var(--border);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .usage-fill {
          height: 100%;
          transition: width 0.3s ease;
        }
        
        /* Status Badge */
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .status-badge.active {
          background: rgba(56, 161, 105, 0.1);
          color: #276749;
        }
        
        .status-badge.inactive {
          background: rgba(229, 62, 62, 0.1);
          color: #9b2c2c;
        }
        
        /* Card Actions */
        .card-actions {
          display: flex;
          gap: 8px;
        }
        
        .toggle-btn {
          padding: 6px 12px;
          font-size: 12px;
          background: var(--primary-light);
          color: var(--primary);
          border: none;
        }
        
        .delete-btn {
          padding: 6px 12px;
          font-size: 12px;
          background: rgba(229, 62, 62, 0.1);
          color: #e53e3e;
          border: none;
        }
        
        .delete-btn:hover {
          background: rgba(229, 62, 62, 0.2);
        }
        
        .inactive-card {
          opacity: 0.6;
        }
        
        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px;
        }
        
        .empty-state p {
          margin-top: 16px;
          color: var(--muted);
        }
        
        /* Save Popup */
        .save-popup {
          width: 100%;
          max-width: 400px;
          animation: popupSlideIn 0.3s ease;
        }
        
        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .popup-content {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .popup-content.success {
          border-top: 4px solid var(--success);
        }
        
        .popup-content.error {
          border-top: 4px solid var(--danger);
        }
        
        .popup-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        
        .popup-content h3 {
          margin: 0 0 12px 0;
          font-size: 20px;
          color: #2d3748;
        }
        
        .popup-content p {
          margin: 0 0 24px 0;
          color: #4a5568;
          font-size: 16px;
          line-height: 1.5;
        }
        
        .popup-progress {
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          width: 100%;
          background: var(--success);
          animation: progressShrink 3s linear forwards;
          transform-origin: left;
        }
        
        .popup-content.error .progress-bar {
          background: var(--danger);
        }
        
        @keyframes progressShrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
        
        /* Warning Message */
        .warning-message {
          text-align: center;
          padding: 20px;
        }
        
        .warning-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        
        .warning-message h4 {
          color: #9b2c2c;
          margin: 0 0 16px 0;
        }
        
        .warning-message ul {
          text-align: left;
          margin: 20px 0;
          padding-left: 24px;
        }
        
        .warning-message li {
          margin: 8px 0;
          color: #4a5568;
        }
        
        .warning-note {
          background: #fffaf0;
          border-left: 4px solid #d69e2e;
          padding: 16px;
          margin: 20px 0 0 0;
          text-align: left;
          border-radius: 4px;
          font-size: 14px;
        }
        
        /* Secret Input */
        .secret-input {
          letter-spacing: 2px;
          font-family: monospace;
        }
        
        .secret-input::placeholder {
          color: var(--muted);
          opacity: 0.8;
        }
        
        /* Search Results */
        .search-results-section {
          margin-top: 0;
          border-top: 3px solid var(--primary);
        }
        
        .search-results-group {
          margin-bottom: 32px;
        }
        
        .search-results-group:last-child {
          margin-bottom: 0;
        }
        
        .search-results-group h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #4a5568;
          font-weight: 600;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        
        .no-results {
          text-align: center;
          padding: 60px 40px;
          background: var(--bg);
          border-radius: 12px;
          border: 2px dashed var(--border);
        }
        
        .no-results p {
          margin: 0;
          color: var(--muted);
          font-size: 16px;
        }
        
        .search-highlight {
          background-color: #fff3cd;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
        }
        
        /* Media Queries */
        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%);
            z-index: 1000;
          }
          
          .sidebar.collapsed {
            transform: translateX(0);
          }
          
          .main-content {
            margin-left: 0;
            width: 100%;
          }
          
          .main-content.expanded {
            margin-left: 0;
          }
          
          .topbar {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }
          
          .topbar-right {
            flex-direction: column;
            gap: 16px;
          }
          
          .search-container {
            min-width: 100%;
          }
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .row {
            flex-direction: column;
            align-items: stretch;
          }
          select {
            width: 100%;
          }
          
          button {
            width: 100%;
          }
          
          .classes-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }
          
          .subjects-grid, .subjects-grid-modal {
            grid-template-columns: 1fr;
          }
          
          .modal, .save-popup {
            max-width: 100%;
            margin: 10px;
          }
          
          th, td {
            padding: 12px 8px;
            font-size: 14px;
          }
          
          .card-actions {
            flex-direction: column;}
            
      .cancel-search {
              position: absolute;
              right: 10px;
              top: 50%;
              transform: translateY(-50%);
              background: var(--primary);
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 12px;
              cursor: pointer;
              transition: background-color 0.5s;
              width: 9% !important;
          }
        
        }

        
        @media (max-width: 480px) {
          .main-content {
            padding: 16px;
          }
          
          .management {
            padding: 20px;
          }
          
          .stat-card {
            padding: 20px;
          }
          
          .modal-body {
            padding: 20px;
          }
          
          .modal-footer {
            padding: 16px 20px;
          }
        }
        
        /* Print Styles */
        @media print {
          .sidebar, .topbar, button {
            display: none;
          }
          
          .main-content {
            margin: 0;
            padding: 0;
          }
          
          table {
            border: 1px solid #000;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 8px;
          }
        }
        /* Profile Dropdown Styles */
.profile-dropdown-container {
  position: relative;
}

.profile-dropdown-container .action-btn {
  position: relative;
  padding-right: 12px;
}

.dropdown-open {
  transform: rotate(180deg);
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: dropdownSlideIn 0.2s ease;
  overflow: hidden;
}

@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--primary-light);
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

.dropdown-name {
  font-weight: 600;
  font-size: 16px;
  color: #2d3748;
  margin-bottom: 4px;
}

.dropdown-email {
  font-size: 13px;
  color: var(--primary);
  margin-bottom: 2px;
  word-break: break-all;
}

.dropdown-role {
  font-size: 12px;
  color: var(--muted);
  background: var(--bg);
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.dropdown-divider {
  height: 1px;
  background: var(--border);
  margin: 0;
}

.dropdown-menu {
  padding: 8px 0;
}

.dropdown-item {
  width: 100%;
  padding: 12px 20px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--bg);
  color: var(--primary);
}

.dropdown-item:hover svg path {
  stroke: var(--primary);
}

.dropdown-item.logout-item {
  color: #e53e3e;
}

.dropdown-item.logout-item:hover {
  background: rgba(229, 62, 62, 0.1);
  color: #c53030;
}

.dropdown-item.logout-item:hover svg path {
  stroke: #c53030;
}

/* Close dropdown when clicking outside */
.profile-dropdown-container:focus-within .profile-dropdown {
  display: block;
}

/* Mobile dropdown styles */
@media (max-width: 768px) {
  .profile-dropdown {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 16px 16px 0 0;
    max-height: 80vh;
    overflow-y: auto;
    animation: mobileDropdownSlideUp 0.3s ease;
  }
  
  @keyframes mobileDropdownSlideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  .dropdown-header {
    padding: 16px;
  }
  
  .dropdown-menu {
    max-height: 50vh;
    overflow-y: auto;
  }
}

/* Close button for mobile dropdown */
@media (max-width: 768px) {
  .dropdown-close-mobile {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 24px;
    color: var(--muted);
    cursor: pointer;
    z-index: 1001;
    padding: 8px;
  }
}
/* Add to your existing CSS */
.disabled-user {
  opacity: 0.6;
  background-color: #f7fafc !important;
}

.disabled-user:hover {
  background-color: #edf2f7 !important;
}

.disabled-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background-color: #fed7d7;
  color: #9b2c2c;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.disable-btn, .enable-btn, .delete-user-btn {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.disable-btn {
  background-color: #fed7d7;
  color: #9b2c2c;
}

.disable-btn:hover {
  background-color: #feb2b2;
}

.enable-btn {
  background-color: #c6f6d5;
  color: #276749;
}

.enable-btn:hover {
  background-color: #9ae6b4;
}

.delete-user-btn {
  background-color: #fed7d7;
  color: #9b2c2c;
  border: 1px solid #fc8181;
}

.delete-user-btn:hover {
  background-color: #feb2b2;
}

.existing-subjects {
  margin-top: 24px;
  padding: 16px;
  background-color: #f7fafc;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.existing-subjects h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #4a5568;
}

textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-size: 14px;
  background: var(--card-bg);
  font-family: inherit;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}
      `}</style>
    </div>
  );
};

export default AdminDashboard;
