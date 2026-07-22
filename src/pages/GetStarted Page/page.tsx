// src/pages/signup.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider, appleProvider } from "../../firebase/config";
import auth_wallpaper from "../../assets/auth_wallpaper.mp4";
import Logo from "../../assets/logo.png";

const ADMIN_CODE = "mini-fcmb";
const MAX_ADMIN_ATTEMPTS = 3;
const ATTEMPT_KEY = "adminCodeAttempts";

const DASHBOARD_ROUTES = {
  teacher: "/teachers",
  student: "/students",
} as const;

// Helper function to normalize class names
const normalizeClassName = (className: string): string => {
  if (!className) return "";
  const trimmed = className.trim();
  const match = trimmed.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    return `${match[1]} ${match[2]}`;
  }
  return trimmed;
};

// Subjects configuration based on class levels
const SUBJECTS_BY_LEVEL = {
  "Primary 5-6": [
    "Mathematics",
    "English Language",
    "Basic Science",
    "Igbo Language",
    "Basic Digital Literacy",
    "History",
    "CCA (Creative & Cultural Arts)",
    "Social and Citizenship Education",
    "CRS (Christian Religious Studies)",
    "Prevocational Studies (PVS)",
    "French",
    "Music",
    "PHE (Physical & Health Education)",
  ],
  "JSS 1-3": [
    "Mathematics",
    "English Language",
    "Basic Science",
    "Basic Technology",
    "French",
    "Igbo Language",
    "Music",
    "CCA (Creative & Cultural Arts)",
    "PHE (Physical & Health Education)",
    "Social Studies",
    "Business Studies",
    "CRS (Christian Religious Studies)",
    "Computer Studies",
    "History",
    "Agricultural Science",
    "Civic Education",
    "Home Economics",
    "Livestock Farming",
    "Literature in English",
    "Test of Orals",
  ],
  "SSS 1-3": [
    "Mathematics",
    "English Language",
    "Physics",
    "Chemistry",
    "Biology",
    "Further Mathematics",
    "Literature in English",
    "Igbo Language",
    "French",
    "Geography",
    "CRS (Christian Religious Studies)",
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

const ALL_CLASSES = [
  "Primary 5",
  "Primary 6",
  "JSS 1",
  "JSS 2",
  "JSS 3",
  "SSS 1",
  "SSS 2",
  "SSS 3",
];

export default function Signup() {
  const navigate = useNavigate();

  // ───── Form State ─────
  const [userType, setUserType] = useState<"teacher" | "student">("teacher");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [className, setClassName] = useState("");
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ───── Custom Select State ─────
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  // ───── Google/Apple Info Modal ─────
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [info, setInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    className: "",
  });

  // ───── Admin Modal (only for social signup) ─────
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminAttempts, setAdminAttempts] = useState(() => {
    const saved = localStorage.getItem(ATTEMPT_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  // ───── Subject Selection Modal ─────
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [tempUserData, setTempUserData] = useState<any>(null);

  // ───── Teacher Classes & Subjects Modal ─────
  const [showTeacherClassesModal, setShowTeacherClassesModal] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<{
    [key: string]: string[];
  }>({});

  const fullName = `${firstName} ${lastName}`.trim();

  // ───── Helper: Get subjects based on class ─────
  const getSubjectsForClass = (className: string) => {
    if (className.includes("Primary")) {
      return SUBJECTS_BY_LEVEL["Primary 5-6"];
    } else if (className.includes("JSS")) {
      return SUBJECTS_BY_LEVEL["JSS 1-3"];
    } else if (className.includes("SSS")) {
      return SUBJECTS_BY_LEVEL["SSS 1-3"];
    }
    return [];
  };

  // ───── Helper: Get class level ─────
  const getClassLevel = (className: string): keyof typeof SUBJECTS_BY_LEVEL => {
    if (className.includes("Primary")) return "Primary 5-6";
    if (className.includes("JSS")) return "JSS 1-3";
    if (className.includes("SSS")) return "SSS 1-3";
    return "Primary 5-6";
  };

  const saveUserToFirestore = async (uid: string, data: any) => {
    const collection = userType === "teacher" ? "teachers" : "students";

    const normalizedData = {
      ...data,
      className: data.className ? normalizeClassName(data.className) : "",
    };

    await setDoc(doc(db, collection, uid), normalizedData);
    console.log(
      `[Firestore] Saved ${userType} ${uid} with className: ${normalizedData.className}`,
    );
  };

  // ───── Teacher Classes Selection Handlers ─────
  const handleTeacherClassToggle = (className: string) => {
    setSelectedClasses((prev) => {
      const newClasses = prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className];

      const newTeacherSubjects = { ...teacherSubjects };
      if (!prev.includes(className)) {
        newTeacherSubjects[className] = [];
      } else {
        delete newTeacherSubjects[className];
      }
      setTeacherSubjects(newTeacherSubjects);

      return newClasses;
    });
  };

  const handleSelectAllClasses = () => {
    if (selectedClasses.length === ALL_CLASSES.length) {
      setSelectedClasses([]);
      setTeacherSubjects({});
    } else {
      setSelectedClasses(ALL_CLASSES);
      const newTeacherSubjects: { [key: string]: string[] } = {};
      ALL_CLASSES.forEach((cls) => {
        newTeacherSubjects[cls] = [];
      });
      setTeacherSubjects(newTeacherSubjects);
    }
  };

  const handleTeacherSubjectToggle = (className: string, subject: string) => {
    setTeacherSubjects((prev) => {
      const currentSubjects = prev[className] || [];
      const newSubjects = currentSubjects.includes(subject)
        ? currentSubjects.filter((s) => s !== subject)
        : [...currentSubjects, subject];

      return {
        ...prev,
        [className]: newSubjects,
      };
    });
  };

  const handleSelectAllSubjectsForClass = (className: string) => {
    const availableSubjects = getSubjectsForClass(className);
    const currentSubjects = teacherSubjects[className] || [];

    setTeacherSubjects((prev) => ({
      ...prev,
      [className]:
        currentSubjects.length === availableSubjects.length
          ? []
          : availableSubjects,
    }));
  };

  const handleTeacherClassesSubmit = async () => {
    if (selectedClasses.length === 0) {
      alert("Please select at least one class to teach.");
      return;
    }

    for (const className of selectedClasses) {
      if (
        !teacherSubjects[className] ||
        teacherSubjects[className].length === 0
      ) {
        alert(`Please select at least one subject for ${className}`);
        return;
      }
    }

    setIsLoading(true);
    try {
      if (tempUserData && tempUserData.type === "email") {
        const { email, password, userData } = tempUserData;

        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = cred.user;

        await updateProfile(user, { displayName: userData.fullName });

        const teacherData = {
          ...userData,
          classes: selectedClasses,
          subjects: teacherSubjects,
          createdAt: serverTimestamp(),
        };

        await saveUserToFirestore(user.uid, teacherData);

        await sendEmailVerification(user);
        console.log("[Email] Verification email sent");

        alert(
          "Teacher account created! Check your inbox to verify your email, then log in.",
        );
        setShowTeacherClassesModal(false);
        setTempUserData(null);
        navigate("/login");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        alert("Session expired. Please try again.");
        navigate("/login");
        return;
      }

      await updateDoc(doc(db, "teachers", user.uid), {
        classes: selectedClasses,
        subjects: teacherSubjects,
        updatedAt: serverTimestamp(),
      });

      console.log(
        "[Firestore] Updated classes and subjects for teacher",
        user.uid,
      );

      setShowTeacherClassesModal(false);
      setSelectedClasses([]);
      setTeacherSubjects({});

      if (user.emailVerified) {
        navigate(DASHBOARD_ROUTES.teacher);
      } else {
        alert("Please verify your email before accessing the dashboard.");
        navigate("/login");
      }
    } catch (error: any) {
      console.error("[Teacher Classes] Save failed:", error);
      alert("Failed to save classes and subjects: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ───── Student Subject Selection Handlers ─────
  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
  };

  const handleSelectAllSubjects = () => {
    const currentLevel = getClassLevel(className);
    const availableSubjects = SUBJECTS_BY_LEVEL[currentLevel];

    if (selectedSubjects.length === availableSubjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects([...availableSubjects]);
    }
  };

  const handleSubjectsSubmit = async () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject.");
      return;
    }

    setIsLoading(true);
    try {
      if (tempUserData && tempUserData.type === "email") {
        const { email, password, userData } = tempUserData;

        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = cred.user;

        await updateProfile(user, { displayName: userData.fullName });

        await saveUserToFirestore(user.uid, {
          ...userData,
          subjects: selectedSubjects,
          createdAt: serverTimestamp(),
        });

        await sendEmailVerification(user);
        console.log("[Email] Verification email sent");

        alert(
          "Account created! Check your inbox to verify your email, then log in.",
        );
        setShowSubjectsModal(false);
        setTempUserData(null);
        navigate("/login");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        alert("Session expired. Please try again.");
        navigate("/login");
        return;
      }

      await updateDoc(doc(db, "students", user.uid), {
        subjects: selectedSubjects,
        updatedAt: serverTimestamp(),
      });

      console.log("[Firestore] Updated subjects for student", user.uid);

      setShowSubjectsModal(false);
      setSelectedSubjects([]);

      if (user.emailVerified) {
        navigate(DASHBOARD_ROUTES.student);
      } else {
        alert("Please verify your email before accessing the dashboard.");
        navigate("/login");
      }
    } catch (error: any) {
      console.error("[Subjects] Save failed:", error);
      alert("Failed to save subjects: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ───── Admin Code Handlers (only for social signup) ─────
  const handleWrongAdminCode = () => {
    const next = adminAttempts + 1;
    setAdminAttempts(next);
    localStorage.setItem(ATTEMPT_KEY, next.toString());
    setAdminCodeInput("");

    if (next >= MAX_ADMIN_ATTEMPTS) {
      alert("Too many attempts. Try again later.");
      resetAndRedirect();
    } else {
      alert(`Invalid code. ${MAX_ADMIN_ATTEMPTS - next} attempt(s) left.`);
    }
  };

  const confirmAdminCode = async () => {
    if (adminCodeInput !== ADMIN_CODE) {
      handleWrongAdminCode();
      return;
    }

    setShowAdminModal(false);
    setShowTeacherClassesModal(true);
  };

  const resetAndRedirect = () => {
    localStorage.removeItem(ATTEMPT_KEY);
    setAdminAttempts(0);
    setShowAdminModal(false);
    setShowInfoModal(false);
    setShowSubjectsModal(false);
    setShowTeacherClassesModal(false);
    setAdminCodeInput("");
    setSelectedSubjects([]);
    setSelectedClasses([]);
    setTeacherSubjects({});
    setTempUserData(null);
    auth.signOut();
    navigate("/signup", { replace: true });
  };

  // ───── Google / Apple Provider Handler ─────
  const handleProvider = async (
    provider: typeof googleProvider | typeof appleProvider,
  ) => {
    try {
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      const methods = await fetchSignInMethodsForEmail(auth, user.email!);

      if (methods.length > 0) {
        alert("This email is already registered. Please sign in instead.");
        await auth.signOut();
        navigate("/login");
        return;
      }

      const [first = "", ...lastParts] = (user.displayName ?? "").split(" ");
      const last = lastParts.join(" ");
      setFirstName(first);
      setLastName(last);
      setEmail(user.email ?? "");
      setPhone(user.phoneNumber ?? "");
      setInfo({
        fullName: user.displayName ?? "",
        email: user.email ?? "",
        phone: user.phoneNumber ?? "",
        className: "",
      });
      setShowInfoModal(true);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error("[Provider] Error:", err);
        alert(err.message || "Sign in failed.");
      }
    }
  };

  // ───── Confirm Google/Apple Info ─────
  const confirmInfo = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Session lost. Please try again.");
      navigate("/login");
      return;
    }

    const baseData = {
      fullName: info.fullName,
      email: info.email,
      phone: info.phone,
      className: normalizeClassName(info.className),
      createdAt: serverTimestamp(),
    };

    try {
      await saveUserToFirestore(user.uid, baseData);
      console.log("[Provider] Profile saved to Firestore");

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        console.log("[Provider] Verification email sent");
      }

      setShowInfoModal(false);

      if (userType === "teacher") {
        const normalizedClass = normalizeClassName(info.className);
        setSelectedClasses([normalizedClass]);
        setTeacherSubjects({
          [normalizedClass]: [],
        });
        setShowAdminModal(true);
        return;
      }

      setClassName(info.className);
      setShowSubjectsModal(true);
    } catch (err: any) {
      console.error("[Provider] Save failed:", err);
      alert("Failed to save profile: " + err.message);
    }
  };

  // ───── Email/Password Signup ─────
  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      if (methods.length > 0) {
        alert("This email is already registered. Please sign in instead.");
        navigate("/login");
        setIsLoading(false);
        return;
      }
    } catch (error: any) {
      console.error("[Email Check] Error:", error);
    }

    if (userType === "teacher") {
      if (adminCodeInput !== ADMIN_CODE) {
        handleWrongAdminCode();
        setIsLoading(false);
        return;
      }
    }

    try {
      const userData = {
        fullName,
        email,
        phone,
        className: normalizeClassName(className),
        createdAt: serverTimestamp(),
        subjects: userType === "student" ? [] : undefined,
      };
      if (userType === "teacher") {
        const normalizedClass = normalizeClassName(className);
        setSelectedClasses([normalizedClass]);
        setTeacherSubjects({
          [normalizedClass]: [],
        });

        setTempUserData({
          type: "email",
          email,
          password,
          userData,
        });
        setShowTeacherClassesModal(true);
      } else {
        setTempUserData({
          type: "email",
          email,
          password,
          userData,
        });
        setShowSubjectsModal(true);
      }
    } catch (err: any) {
      console.error("[Email] Signup error:", err.code);
      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please sign in.");
        navigate("/login");
      } else {
        alert(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ───── UI ─────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        :root {
          --accent: #2563eb;
          --accent-dark: #141d4d;
          --accent-soft: #eef1fb;
          --ink: #0f1226;
          --ink-soft: #6b7280;
          --line: #e6e8f0;
          --field-bg: #f7f8fb;
          --success: #10b981;
          --danger: #ef4444;
          --radius-xl: 30px;
          --radius-lg: 18px;
          --radius-md: 14px;
          --radius-sm: 10px;
          --shadow-card: 0 40px 80px -20px rgba(10, 14, 45, 0.45);
        }

        * { box-sizing: border-box; }

        .modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(8, 10, 30, 0.4);
          backdrop-filter: blur(8px);
        }

        .signup-modal {
          position: relative;
          width: 100%;
          max-width: 980px;
          z-index: 1;
        }

        .signup-card {
          position:fixed;
          display: flex;
          width: 100%;
          min-height: 640px;
          max-height: 8vh;
          background: #ffffff;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-card);
          overflow: hidden;
        }

        /* ───── Left panel: form ───── */
        .form-panel {
          flex: 1 1 52%;
          padding: 44px 48px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .form-panel::-webkit-scrollbar { width: 6px; }
        .form-panel::-webkit-scrollbar-thumb { background: var(--line); border-radius: 10px; }

        .brand-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
        }
        .brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        .brand-mark:hover {
          opacity: 0.8;
        }
        .brand-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--ink);
          letter-spacing: 0.2px;
        }

        .tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--field-bg);
          border-radius: 999px;
          margin-bottom: 26px;
        }
        .tab {
          flex: 1;
          padding: 11px 0;
          border: none;
          background: transparent;
          border-radius: 999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 600;
          font-size: 14px;
          color: var(--ink-soft);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .tab.active {
          background: #1A1D21;
          color: #fff;
          box-shadow: 0 8px 18px -6px rgba(29, 42, 107, 0.55);
        }

        .signup-form h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 6px;
          letter-spacing: -0.3px;
        }
        .form-subtitle {
          font-size: 14px;
          color: var(--ink-soft);
          margin: 0 0 24px;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .name-row { display: flex; gap: 12px; }

        input {
          width: 100%;
          padding: 14px 16px;
          font-size: 14.5px;
          font-family: 'Inter', sans-serif;
          color: var(--ink);
          background: var(--field-bg);
          border: 1.5px solid transparent;
          border-radius: var(--radius-md);
          outline: none;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        input::placeholder { color: #9aa0ae; }
        input:focus {
          background: #fff;
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-soft);
        }
        input:disabled { opacity: 0.6; cursor: not-allowed; }

        .phone-row {
          display: flex;
        }
        .country {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          background: var(--field-bg);
          border: 1.5px solid transparent;
          border-right: 1px solid var(--line);
          border-radius: var(--radius-md) 0 0 var(--radius-md);
          white-space: nowrap;
          font-size: 14.5px;
          color: var(--ink);
        }
        .country img { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; }
        .phone-row input { border-radius: 0 var(--radius-md) var(--radius-md) 0; }

        .password-input-container { position: relative; }
        .password-input-container input { padding-right: 46px; }
        .password-toggle {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          border: none;
          background: transparent;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .password-toggle:hover { background: var(--line); }

        /* ───── Custom Select Styles ───── */
        .custom-select {
          position: relative;
          width: 100%;
        }

        .select-trigger {
          width: 100%;
          padding: 14px 16px;
          font-size: 14.5px;
          font-family: 'Inter', sans-serif;
          color: var(--ink);
          background: var(--field-bg);
          border: 1.5px solid transparent;
          border-radius: var(--radius-md);
          outline: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          text-align: left;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        

        .select-trigger:focus {
          background: #fff;
          border-color: var(--accent);
          box-shadow: 0 0 0 4px var(--accent-soft);
        }

        .select-trigger .arrow {
          transition: transform 0.2s ease;
          font-size: 16px;
          color: var(--ink-soft);
        }

        .select-trigger .arrow.open {
          transform: rotate(180deg);
        }

        .select-dropdown {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          width: 100%;
          background: white;
          border: 1.5px solid var(--accent);
          border-radius: var(--radius-md);
          padding: 5px;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          max-height: 200px;
          overflow-y: auto;
        }

        .select-dropdown::-webkit-scrollbar {
          width: 4px;
        }

        .select-dropdown::-webkit-scrollbar-thumb {
          background: var(--line);
          border-radius: 10px;
        }

        .select-option {
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: var(--ink);
          transition: all 0.15s ease;
        }

        .select-option:hover {
          background-color: var(--accent);
          color: white;
        }

        .create-btn {
          margin-top: 6px;
          padding: 15px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          background: #1A1D21;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          box-shadow: 0 14px 28px -10px rgba(29, 42, 107, 0.55);
        }
        .create-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 18px 32px -10px rgba(29, 42, 107, 0.6); }
        .create-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 18px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #a7acb9;
        }
        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--line);
        }

        .social-row { display: flex; justify-content: center; gap: 14px; }
        .social {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1.5px solid var(--line);
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .social img { width: 20px; height: 20px; }
        .social:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px -8px rgba(15, 18, 38, 0.25); border-color: var(--accent); }
        .social:disabled { opacity: 0.5; cursor: not-allowed; }

        .terms {
          text-align: center;
          font-size: 12.5px;
          color: var(--ink-soft);
          margin: 22px 0 0;
        }
        .terms a { color: var(--accent); font-weight: 600; text-decoration: none; }
        .terms a:hover { text-decoration: underline; }

        /* ───── Right panel: media / wallpaper ───── */
        .wallpaper-panel {
          flex: 1 1 48%;
          position: relative;
          width:20%;
          margin: 12px;
          border-radius: 50px;
          overflow: hidden;
          background:
            radial-gradient(circle at 25% 20%, #6a5cf0 0%, transparent 55%),
            radial-gradient(circle at 75% 80%, #2f3aa8 0%, transparent 55%),
            linear-gradient(160deg, #262c8f 0%, #10143f 100%);
        }

        .wallpaper-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .wallpaper-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(10, 12, 40, 0.35) 0%, transparent 35%);
          pointer-events: none;
        }

        .float-controls {
          position: absolute;
          right: 18px;
          bottom: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .float-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(6px);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .float-btn:hover { background: rgba(255, 255, 255, 0.28); }

        @media (max-width: 860px) {
          .wallpaper-panel { display: none; }
          .form-panel { flex: 1 1 100%; padding: 36px 24px; }
          .signup-card { min-height: auto; max-height: none; }
        }

        /* ───── Shared dialog styles (info / admin / subjects / teacher classes) ───── */
        .dialog-card {
          position: relative;
          width: 100%;
          background: #fff;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 30px;
          max-height: 88vh;
          overflow-y: auto;
        }
        .dialog-card.dialog-sm { max-width: 440px; }
        .dialog-card.dialog-md { max-width: 520px; }
        .dialog-card.dialog-lg { max-width: 860px; }
        .dialog-card.dialog-xl { max-width: 1040px; }

        .dialog-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--ink);
          text-align: center;
          margin: 0 0 8px;
        }
        .dialog-subtitle {
          font-size: 13.5px;
          color: var(--ink-soft);
          text-align: center;
          margin: 0 0 22px;
          line-height: 1.5;
        }
        .dialog-subtitle strong { color: var(--ink); }

        .dialog-field { margin-bottom: 12px; }

        .dialog-actions { display: flex; gap: 12px; margin-top: 8px; }
        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }
        .btn-primary {
          color: #fff;
          background: linear-gradient(135deg, var(--accent), var(--accent-dark));
          box-shadow: 0 14px 28px -10px rgba(29, 42, 107, 0.5);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; background: #c6cadb; box-shadow: none; }
        .btn-secondary {
          color: var(--ink);
          background: var(--field-bg);
          border: 1.5px solid var(--line);
        }
        .btn-secondary:hover:not(:disabled) { background: #eef0f5; }
        .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        .section-block {
          padding: 18px;
          border-radius: var(--radius-md);
          border: 1px solid var(--line);
          background: var(--field-bg);
          margin-bottom: 18px;
        }
        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .section-head span { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 14.5px; color: var(--ink); }
        .chip-btn {
          padding: 8px 14px;
          font-size: 12.5px;
          font-weight: 700;
          color: #fff;
          background: var(--accent);
          border: none;
          border-radius: 999px;
          cursor: pointer;
        }
        .chip-btn.alt { background: var(--success); }

        .grid { display: grid; gap: 10px; }
        .grid-subjects { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); max-height: 360px; overflow-y: auto; padding: 4px; }
        .grid-classes { grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); }

        .option-chip {
          position: relative;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 12px;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--line);
          background: #fff;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--ink);
        }
        .option-chip:hover { border-color: #c7cbe6; }
        .option-chip.selected {
          background: var(--accent-soft);
          border-color: var(--accent);
        }
        .option-chip input { width: 15px; height: 15px; margin: 0; padding: 0; flex-shrink: 0; accent-color: var(--accent); }

        .class-chip {
          flex-direction: column;
          justify-content: center;
          text-align: center;
          min-height: 62px;
          gap: 6px;
        }
        .class-chip.selected { background: var(--accent-soft); border-color: var(--accent); }
        .class-chip .pin-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--success);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .selection-note {
          text-align: center;
          font-size: 12.5px;
          color: var(--ink-soft);
          margin-top: 14px;
        }
        .selection-note .ok { color: var(--success); font-weight: 600; margin-left: 6px; }

        .subject-block {
          margin-bottom: 16px;
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--line);
          background: #fff;
        }
        .subject-block:last-child { margin-bottom: 0; }
        .subject-block .grid-subjects { max-height: none; overflow: visible; }
        .subject-count { text-align: right; font-size: 12px; color: var(--ink-soft); margin-top: 10px; }
      `}</style>

      {/* MAIN SIGNUP FORM */}

      <div className="signup-page">
        <div className="signup-modal">
          <div className="signup-card">
            {/* Left: form panel */}
            <div className="form-panel">
              <div className="brand-row">
                <div
                  className="brand-mark"
                  onClick={() => navigate("/")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && navigate("/")}
                >
                  <img
                    src={Logo}
                    style={{
                      borderRadius: "50%",
                      width: "38px",
                      height: "38px",
                    }}
                    alt="SXaint Logo"
                  />
                </div>
                <span className="brand-name">SXaint</span>
              </div>

              <div className="tabs">
                <button
                  className={`tab ${userType === "teacher" ? "active" : ""}`}
                  onClick={() => setUserType("teacher")}
                  type="button"
                >
                  Teacher
                </button>
                <button
                  className={`tab ${userType === "student" ? "active" : ""}`}
                  onClick={() => setUserType("student")}
                  type="button"
                >
                  Student
                </button>
              </div>

              <form onSubmit={handleEmailSignup} className="signup-form">
                <h2>Create an account</h2>
                <p className="form-subtitle">
                  Please enter your details to get started.
                </p>

                <div className="name-row">
                  <input
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <input
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />

                <div className="phone-row">
                  <div className="country">
                    <img src="/flags/ng.svg" alt="NG" />
                    <span>+234</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="775-351-6501"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#6b7280" />
                    ) : (
                      <Eye size={18} color="#6b7280" />
                    )}
                  </button>
                </div>

                {/* Custom Class Selection Dropdown */}
                <div className="custom-select">
                  <button
                    type="button"
                    className="select-trigger"
                    onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                    disabled={isLoading}
                  >
                    {className || "Select Class"}
                    <span
                      className={`arrow ${isClassDropdownOpen ? "open" : ""}`}
                    ></span>
                  </button>

                  {isClassDropdownOpen && (
                    <div className="select-dropdown">
                      {ALL_CLASSES.map((c) => (
                        <div
                          key={c}
                          className="select-option"
                          onClick={() => {
                            setClassName(c);
                            setIsClassDropdownOpen(false);
                          }}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Code Input (only for teachers) */}
                {userType === "teacher" && (
                  <input
                    type="password"
                    placeholder="Admin Code"
                    value={adminCodeInput}
                    onChange={(e) => setAdminCodeInput(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                )}

                <button
                  type="submit"
                  className="create-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <div className="divider">OR SIGN UP WITH</div>

              <div className="social-row">
                <button
                  onClick={() => handleProvider(googleProvider)}
                  className="social"
                  disabled={isLoading}
                  aria-label="Sign up with Google"
                >
                  <img src="/icons/google.svg" alt="Google" />
                </button>
                <button
                  onClick={() => handleProvider(appleProvider)}
                  className="social"
                  disabled={isLoading}
                  aria-label="Sign up with Apple"
                >
                  <img src="/icons/apple.svg" alt="Apple" />
                </button>
              </div>

              <p className="terms">
                By creating an account, you agree to our{" "}
                <a href="#">Terms &amp; Service</a>
              </p>
            </div>

            {/* Right: media / wallpaper panel */}
            <div className="wallpaper-panel">
              <video
                className="wallpaper-media"
                autoPlay
                loop
                muted
                playsInline
                src={auth_wallpaper}
              />
              <div className="wallpaper-fade" />
              <div className="float-controls"></div>
            </div>
          </div>
        </div>
      </div>

      {/* GOOGLE/APPLE INFO MODAL */}
      {showInfoModal && (
        <div className="signup-page" style={{ zIndex: 1100 }}>
          <div className="modal-backdrop" />
          <div className="dialog-card dialog-sm">
            <h3 className="dialog-title">Confirm your details</h3>
            <p className="dialog-subtitle">
              We pulled this from your account. Please verify.
            </p>

            <div className="dialog-field">
              <input
                type="text"
                placeholder="Full name"
                value={info.fullName}
                onChange={(e) =>
                  setInfo((s) => ({ ...s, fullName: e.target.value }))
                }
              />
            </div>
            <div className="dialog-field">
              <input
                type="email"
                placeholder="Email"
                value={info.email}
                onChange={(e) =>
                  setInfo((s) => ({ ...s, email: e.target.value }))
                }
              />
            </div>
            <div className="phone-row dialog-field">
              <div className="country">
                <img src="/flags/ng.svg" alt="NG" />
                <span>+234</span>
              </div>
              <input
                type="tel"
                placeholder="775-351-6501"
                value={info.phone}
                onChange={(e) =>
                  setInfo((s) => ({ ...s, phone: e.target.value }))
                }
              />
            </div>
            <div className="dialog-field">
              <select
                value={info.className}
                onChange={(e) =>
                  setInfo((s) => ({ ...s, className: e.target.value }))
                }
                required
              >
                <option value="">Select Class</option>
                {ALL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="dialog-actions">
              <button className="btn-primary" onClick={confirmInfo}>
                Confirm
              </button>
              <button className="btn-secondary" onClick={resetAndRedirect}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CODE MODAL (only for social signup teachers) */}
      {showAdminModal && (
        <div className="signup-page" style={{ zIndex: 1200 }}>
          <div className="modal-backdrop" />
          <div className="dialog-card dialog-sm" style={{ maxWidth: 420 }}>
            <h3 className="dialog-title">Admin Access Required</h3>
            <p className="dialog-subtitle">
              Enter the admin code to complete teacher signup.
            </p>

            <div className="dialog-field">
              <input
                type="password"
                placeholder="Admin Code"
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmAdminCode()}
                autoFocus
              />
            </div>

            <div className="dialog-actions">
              <button className="btn-primary" onClick={confirmAdminCode}>
                Confirm
              </button>
              <button className="btn-secondary" onClick={resetAndRedirect}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT SUBJECT SELECTION MODAL */}
      {showSubjectsModal && (
        <div className="signup-page" style={{ zIndex: 1300 }}>
          <div className="modal-backdrop" />
          <div className="dialog-card dialog-lg">
            <h3 className="dialog-title">Select Your Subjects</h3>
            <p className="dialog-subtitle">
              Choose the subjects you offer for <strong>{className}</strong>.
              You can change this later in your profile.
            </p>

            <div className="section-head">
              <span>Available subjects for {getClassLevel(className)}</span>
              <button
                className="chip-btn"
                onClick={handleSelectAllSubjects}
                type="button"
              >
                {selectedSubjects.length ===
                getSubjectsForClass(className).length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div
              className="grid grid-subjects"
              style={{
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                marginBottom: 18,
              }}
            >
              {getSubjectsForClass(className).map((subject) => (
                <label
                  key={subject}
                  className={`option-chip ${selectedSubjects.includes(subject) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                  />
                  <span>{subject}</span>
                </label>
              ))}
            </div>

            <p className="selection-note">
              Selected: {selectedSubjects.length} subject(s)
            </p>

            <div className="dialog-actions">
              <button
                className="btn-primary"
                onClick={handleSubjectsSubmit}
                disabled={selectedSubjects.length === 0 || isLoading}
              >
                {isLoading ? "Saving..." : "Save Subjects & Continue"}
              </button>
              <button
                className="btn-secondary"
                onClick={resetAndRedirect}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER CLASSES & SUBJECTS MODAL */}
      {showTeacherClassesModal && (
        <div className="signup-page" style={{ zIndex: 1400 }}>
          <div className="modal-backdrop" />
          <div className="dialog-card dialog-xl">
            <h3 className="dialog-title">Select Classes You Teach</h3>
            <p className="dialog-subtitle">
              <strong>Note:</strong> Your selected class "{className}" is
              already pre-selected.
              <br />
              You can add more classes or remove it if needed.
            </p>

            <div className="section-block">
              <div className="section-head">
                <span>Available Classes</span>
                <button
                  className="chip-btn"
                  onClick={handleSelectAllClasses}
                  type="button"
                >
                  {selectedClasses.length === ALL_CLASSES.length
                    ? "Deselect All Classes"
                    : "Select All Classes"}
                </button>
              </div>

              <div className="grid grid-classes">
                {ALL_CLASSES.map((cls) => (
                  <label
                    key={cls}
                    className={`option-chip class-chip ${selectedClasses.includes(cls) ? "selected" : ""}`}
                  >
                    {cls === className && selectedClasses.includes(cls) && (
                      <span className="pin-badge">
                        <Check size={12} />
                      </span>
                    )}
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(cls)}
                      onChange={() => handleTeacherClassToggle(cls)}
                    />
                    <span>{cls}</span>
                  </label>
                ))}
              </div>

              <p className="selection-note">
                Selected: {selectedClasses.length} class(es)
                {selectedClasses.includes(className) && (
                  <span className="ok">✓ Includes your selected class</span>
                )}
              </p>
            </div>

            {selectedClasses.length > 0 && (
              <div
                style={{ maxHeight: 360, overflowY: "auto", marginBottom: 20 }}
              >
                {selectedClasses.map((cls) => (
                  <div key={cls} className="subject-block">
                    <div className="section-head">
                      <span>Subjects for {cls}</span>
                      <button
                        className="chip-btn alt"
                        onClick={() => handleSelectAllSubjectsForClass(cls)}
                        type="button"
                      >
                        {teacherSubjects[cls]?.length ===
                        getSubjectsForClass(cls).length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    <div className="grid grid-subjects">
                      {getSubjectsForClass(cls).map((subject) => (
                        <label
                          key={subject}
                          className={`option-chip ${teacherSubjects[cls]?.includes(subject) ? "selected" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              teacherSubjects[cls]?.includes(subject) || false
                            }
                            onChange={() =>
                              handleTeacherSubjectToggle(cls, subject)
                            }
                          />
                          <span>{subject}</span>
                        </label>
                      ))}
                    </div>

                    <p className="subject-count">
                      Selected: {teacherSubjects[cls]?.length || 0} subject(s)
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="dialog-actions">
              <button
                className="btn-primary"
                onClick={handleTeacherClassesSubmit}
                disabled={selectedClasses.length === 0 || isLoading}
              >
                {isLoading ? "Saving..." : "Save & Complete Signup"}
              </button>
              <button
                className="btn-secondary"
                onClick={resetAndRedirect}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
