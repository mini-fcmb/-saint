// src/pages/signup.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider, appleProvider } from "../firebase/config";
import "../styles/signup.css";

const ADMIN_CODE = "mini-fcmb";
const MAX_ADMIN_ATTEMPTS = 3;
const ATTEMPT_KEY = "adminCodeAttempts";

const DASHBOARD_ROUTES = {
  teacher: "/teachers",
  student: "/students",
} as const;

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

  // ───── Helper: Save to Firestore ─────
  const saveUserToFirestore = async (uid: string, data: any) => {
    const collection = userType === "teacher" ? "teachers" : "students";
    await setDoc(doc(db, collection, uid), data);
    console.log(`[Firestore] Saved ${userType} ${uid}`);
  };

  // ───── Teacher Classes Selection Handlers ─────
  const handleTeacherClassToggle = (className: string) => {
    setSelectedClasses((prev) => {
      const newClasses = prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className];

      // Initialize subjects for newly selected classes
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
      // Deselect all
      setSelectedClasses([]);
      setTeacherSubjects({});
    } else {
      // Select all
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
          ? [] // Deselect all
          : availableSubjects, // Select all
    }));
  };

  const handleTeacherClassesSubmit = async () => {
    // Validate that at least one class is selected
    if (selectedClasses.length === 0) {
      alert("Please select at least one class to teach.");
      return;
    }

    // Validate that each selected class has at least one subject
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
      // For email/password signup - create teacher account
      if (tempUserData && tempUserData.type === "email") {
        const { email, password, userData } = tempUserData;

        // Create the user account
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = cred.user;

        // Update display name
        await updateProfile(user, { displayName: userData.fullName });

        // Prepare teacher data with classes and subjects
        const teacherData = {
          ...userData,
          classes: selectedClasses,
          subjects: teacherSubjects,
          createdAt: serverTimestamp(),
        };

        // Save to Firestore
        await saveUserToFirestore(user.uid, teacherData);

        // Send verification email
        await sendEmailVerification(user);
        console.log("[Email] Verification email sent");

        alert(
          "Teacher account created! Check your inbox to verify your email, then log in."
        );
        setShowTeacherClassesModal(false);
        setTempUserData(null);
        navigate("/login");
        return;
      }

      // For provider signup - update existing teacher with classes and subjects
      const user = auth.currentUser;
      if (!user) {
        alert("Session expired. Please try again.");
        navigate("/login");
        return;
      }

      // Update Firestore with classes and subjects
      await updateDoc(doc(db, "teachers", user.uid), {
        classes: selectedClasses,
        subjects: teacherSubjects,
        updatedAt: serverTimestamp(),
      });

      console.log(
        "[Firestore] Updated classes and subjects for teacher",
        user.uid
      );

      setShowTeacherClassesModal(false);
      setSelectedClasses([]);
      setTeacherSubjects({});

      if (user.emailVerified) {
        // If already verified, go to dashboard
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
        : [...prev, subject]
    );
  };

  const handleSelectAllSubjects = () => {
    const currentLevel = getClassLevel(className);
    const availableSubjects = SUBJECTS_BY_LEVEL[currentLevel];

    if (selectedSubjects.length === availableSubjects.length) {
      // Deselect all
      setSelectedSubjects([]);
    } else {
      // Select all
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
      // For email/password signup - create user after subject selection
      if (tempUserData && tempUserData.type === "email") {
        const { email, password, userData } = tempUserData;

        // Create the user account
        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = cred.user;

        // Update display name
        await updateProfile(user, { displayName: userData.fullName });

        // Save to Firestore with subjects
        await saveUserToFirestore(user.uid, {
          ...userData,
          subjects: selectedSubjects,
          createdAt: serverTimestamp(),
        });

        // Send verification email
        await sendEmailVerification(user);
        console.log("[Email] Verification email sent");

        alert(
          "Account created! Check your inbox to verify your email, then log in."
        );
        setShowSubjectsModal(false);
        setTempUserData(null);
        navigate("/login");
        return;
      }

      // For provider signup - update existing user with subjects
      const user = auth.currentUser;
      if (!user) {
        alert("Session expired. Please try again.");
        navigate("/login");
        return;
      }

      // Update Firestore with subjects
      await updateDoc(doc(db, "students", user.uid), {
        subjects: selectedSubjects,
        updatedAt: serverTimestamp(),
      });

      console.log("[Firestore] Updated subjects for student", user.uid);

      setShowSubjectsModal(false);
      setSelectedSubjects([]);

      if (user.emailVerified) {
        // If already verified, go to dashboard
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

    // For social signup, show teacher classes modal
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
    provider: typeof googleProvider | typeof appleProvider
  ) => {
    try {
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      // Check if email already exists with any sign-in method
      const methods = await fetchSignInMethodsForEmail(auth, user.email!);

      // If email already registered with any method (password or provider)
      if (methods.length > 0) {
        alert("This email is already registered. Please sign in instead.");
        await auth.signOut();
        navigate("/login");
        return;
      }

      // Populate modal
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
      className: info.className,
      createdAt: serverTimestamp(),
    };

    try {
      // Save basic user data first
      await saveUserToFirestore(user.uid, baseData);
      console.log("[Provider] Profile saved to Firestore");

      // Send verification email if not verified
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        console.log("[Provider] Verification email sent");
      }

      setShowInfoModal(false);

      if (userType === "teacher") {
        // For social signup teachers, pre-select the class they chose
        setSelectedClasses([info.className]);
        setTeacherSubjects({
          [info.className]: [],
        });
        setShowAdminModal(true);
        return;
      }

      // For students - show subject selection modal
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

    // First check if email already exists with any sign-in method
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);

      // If email already registered with any method
      if (methods.length > 0) {
        alert("This email is already registered. Please sign in instead.");
        navigate("/login");
        setIsLoading(false);
        return;
      }
    } catch (error: any) {
      console.error("[Email Check] Error:", error);
      // Continue with signup if check fails (network issue, etc.)
    }

    // For teachers, validate admin code
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
        className,
        createdAt: serverTimestamp(),
        subjects: userType === "student" ? [] : undefined,
      };

      if (userType === "teacher") {
        // For teachers - store data and go to class selection
        // Pre-select the class they chose in the form
        setSelectedClasses([className]);
        setTeacherSubjects({
          [className]: [],
        });

        setTempUserData({
          type: "email",
          email,
          password,
          userData,
        });
        setShowTeacherClassesModal(true);
      } else {
        // For students - store data and show subject selection
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
      {/* MAIN SIGNUP FORM */}
      <div className="signup-page">
        <div className="signup-modal">
          <div className="modal-backdrop" />
          <div className="signup-card">
            <button className="close-btn" onClick={() => navigate(-1)}>
              ×
            </button>

            <div className="tabs">
              <button
                className={`tab ${userType === "teacher" ? "active" : ""}`}
                onClick={() => setUserType("teacher")}
              >
                Teacher
              </button>
              <button
                className={`tab ${userType === "student" ? "active" : ""}`}
                onClick={() => setUserType("student")}
              >
                Student
              </button>
            </div>

            <form onSubmit={handleEmailSignup} className="signup-form">
              <h2>Create an account</h2>

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
                className="text-input"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#6b7280" />
                ) : (
                  <Eye size={18} color="#6b7280" />
                )}
              </button>
            </div>

              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                className="input-select"
                disabled={isLoading}
              >
                <option value="">Select Class</option>
                {ALL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

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

              <button type="submit" className="create-btn" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="divider">OR SIGN UP WITH</div>

            <div className="social-row">
              <button
                onClick={() => handleProvider(googleProvider)}
                className="social google"
                disabled={isLoading}
              >
                <img src="/icons/google.svg" alt="Google" />
              </button>
              <button
                onClick={() => handleProvider(appleProvider)}
                className="social apple"
                disabled={isLoading}
              >
                <img src="/icons/apple.svg" alt="Apple" />
              </button>
            </div>

            <p className="terms">
              By creating an account, you agree to our{" "}
              <a href="#">Terms &amp; Service</a>
            </p>
          </div>
        </div>
      </div>

      {/* GOOGLE/APPLE INFO MODAL */}
      {showInfoModal && (
        <div className="signup-page" style={{ zIndex: 1100 }}>
          <div className="signup-modal">
            <div className="modal-backdrop" />
            <div
              className="signup-card"
              style={{ maxWidth: 460, padding: "24px" }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  textAlign: "center",
                  fontSize: 20,
                }}
              >
                Confirm your details
              </h3>
              <p
                style={{
                  textAlign: "center",
                  margin: "0 0 20px",
                  fontSize: 14,
                  color: "#555",
                }}
              >
                We pulled this from your account. Please verify.
              </p>

              <input
                type="text"
                placeholder="Full name"
                value={info.fullName}
                onChange={(e) =>
                  setInfo((s) => ({ ...s, fullName: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: 16,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginBottom: 12,
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={info.email}
                onChange={(e) =>
                  setInfo((s) => ({ ...s, email: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: 16,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginBottom: 12,
                }}
              />
              <div className="phone-row" style={{ marginBottom: 12 }}>
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
                  style={{
                    flex: 1,
                    padding: "14px",
                    fontSize: 16,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <select
                value={info.className}
                onChange={(e) =>
                  setInfo((s) => ({ ...s, className: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: 16,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginBottom: 16,
                }}
                required
              >
                <option value="">Select Class</option>
                {ALL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={confirmInfo}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={resetAndRedirect}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#f8f9fa",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN CODE MODAL (only for social signup teachers) */}
      {showAdminModal && (
        <div className="signup-page" style={{ zIndex: 1200 }}>
          <div className="signup-modal">
            <div className="modal-backdrop" />
            <div
              className="signup-card"
              style={{ maxWidth: 420, padding: "24px" }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  textAlign: "center",
                  fontSize: 20,
                }}
              >
                Admin Access Required
              </h3>
              <p
                style={{
                  textAlign: "center",
                  margin: "0 0 20px",
                  fontSize: 14,
                  color: "#555",
                }}
              >
                Enter the admin code to complete teacher signup.
              </p>
              <input
                type="password"
                placeholder="Admin Code"
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmAdminCode()}
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: 16,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                  marginBottom: 16,
                }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={confirmAdminCode}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={resetAndRedirect}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#f8f9fa",
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT SUBJECT SELECTION MODAL */}
      {showSubjectsModal && (
        <div className="signup-page" style={{ zIndex: 1300 }}>
          <div className="signup-modal">
            <div className="modal-backdrop" />
            <div
              className="signup-card"
              style={{ maxWidth: 800, padding: "24px" }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  textAlign: "center",
                  fontSize: 20,
                }}
              >
                Select Your Subjects
              </h3>
              <p
                style={{
                  textAlign: "center",
                  margin: "0 0 20px",
                  fontSize: 14,
                  color: "#555",
                }}
              >
                Choose the subjects you offer for {className}. You can change
                this later in your profile.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: "500" }}>
                  Available subjects for {getClassLevel(className)}
                </span>
                <button
                  onClick={handleSelectAllSubjects}
                  style={{
                    padding: "8px 16px",
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  {selectedSubjects.length ===
                  getSubjectsForClass(className).length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  marginBottom: "20px",
                  padding: "12px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              >
                {getSubjectsForClass(className).map((subject) => (
                  <label
                    key={subject}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      backgroundColor: selectedSubjects.includes(subject)
                        ? "#eff6ff"
                        : "white",
                      borderColor: selectedSubjects.includes(subject)
                        ? "#3b82f6"
                        : "#e2e8f0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subject)}
                      onChange={() => handleSubjectToggle(subject)}
                      style={{
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>
                      {subject}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <small style={{ color: "#64748b" }}>
                  Selected: {selectedSubjects.length} subject(s)
                </small>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleSubjectsSubmit}
                  disabled={selectedSubjects.length === 0 || isLoading}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background:
                      selectedSubjects.length === 0 || isLoading
                        ? "#cbd5e1"
                        : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    cursor:
                      selectedSubjects.length === 0 || isLoading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      selectedSubjects.length === 0 || isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? "Saving..." : "Save Subjects & Continue"}
                </button>
                <button
                  onClick={resetAndRedirect}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#f8f9fa",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER CLASSES & SUBJECTS MODAL */}
      {showTeacherClassesModal && (
        <div className="signup-page" style={{ zIndex: 1400 }}>
          <div className="signup-modal">
            <div className="modal-backdrop" />
            <div
              className="signup-card"
              style={{ maxWidth: 1000, padding: "24px" }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  textAlign: "center",
                  fontSize: 20,
                }}
              >
                Select Classes You Teach
              </h3>
              <p
                style={{
                  textAlign: "center",
                  margin: "0 0 20px",
                  fontSize: 14,
                  color: "#555",
                }}
              >
                <strong>Note:</strong> Your selected class "{className}" is
                already pre-selected.
                <br />
                You can add more classes or remove it if needed.
              </p>

              {/* Class Selection Section */}
              <div
                style={{
                  marginBottom: "24px",
                  padding: "16px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: "600" }}>
                    Available Classes
                  </span>
                  <button
                    onClick={handleSelectAllClasses}
                    style={{
                      padding: "8px 16px",
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    {selectedClasses.length === ALL_CLASSES.length
                      ? "Deselect All Classes"
                      : "Select All Classes"}
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {ALL_CLASSES.map((cls) => (
                    <label
                      key={cls}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "12px",
                        border: "2px solid",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        backgroundColor: selectedClasses.includes(cls)
                          ? "#eff6ff"
                          : "white",
                        borderColor: selectedClasses.includes(cls)
                          ? "#3b82f6"
                          : "#e2e8f0",
                        minHeight: "60px",
                        position: "relative",
                      }}
                    >
                      {cls === className && selectedClasses.includes(cls) && (
                        <div
                          style={{
                            position: "absolute",
                            top: "-8px",
                            right: "-8px",
                            background: "#10b981",
                            color: "white",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                          }}
                        >
                          ✓
                        </div>
                      )}
                      <input
                        type="checkbox"
                        checked={selectedClasses.includes(cls)}
                        onChange={() => handleTeacherClassToggle(cls)}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                          marginBottom: "8px",
                        }}
                      />
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {cls}
                      </span>
                    </label>
                  ))}
                </div>

                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <small style={{ color: "#64748b" }}>
                    Selected: {selectedClasses.length} class(es)
                    {selectedClasses.includes(className) && (
                      <span style={{ color: "#10b981", marginLeft: "8px" }}>
                        ✓ Includes your selected class
                      </span>
                    )}
                  </small>
                </div>
              </div>

              {/* Subjects Selection for Each Selected Class */}
              {selectedClasses.length > 0 && (
                <div
                  style={{
                    marginBottom: "24px",
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  {selectedClasses.map((className) => (
                    <div
                      key={className}
                      style={{
                        marginBottom: "20px",
                        padding: "16px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        backgroundColor: "white",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <span style={{ fontSize: "16px", fontWeight: "600" }}>
                          Subjects for {className}
                        </span>
                        <button
                          onClick={() =>
                            handleSelectAllSubjectsForClass(className)
                          }
                          style={{
                            padding: "6px 12px",
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                        >
                          {teacherSubjects[className]?.length ===
                          getSubjectsForClass(className).length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(180px, 1fr))",
                          gap: "10px",
                        }}
                      >
                        {getSubjectsForClass(className).map((subject) => (
                          <label
                            key={subject}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "10px",
                              border: "1px solid #e2e8f0",
                              borderRadius: "6px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              backgroundColor: teacherSubjects[
                                className
                              ]?.includes(subject)
                                ? "#d1fae5"
                                : "#f8fafc",
                              borderColor: teacherSubjects[className]?.includes(
                                subject
                              )
                                ? "#10b981"
                                : "#e2e8f0",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                teacherSubjects[className]?.includes(subject) ||
                                false
                              }
                              onChange={() =>
                                handleTeacherSubjectToggle(className, subject)
                              }
                              style={{
                                width: "14px",
                                height: "14px",
                                cursor: "pointer",
                              }}
                            />
                            <span style={{ fontSize: "13px" }}>{subject}</span>
                          </label>
                        ))}
                      </div>

                      <div style={{ textAlign: "right", marginTop: "12px" }}>
                        <small style={{ color: "#64748b" }}>
                          Selected: {teacherSubjects[className]?.length || 0}{" "}
                          subject(s)
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleTeacherClassesSubmit}
                  disabled={selectedClasses.length === 0 || isLoading}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background:
                      selectedClasses.length === 0 || isLoading
                        ? "#cbd5e1"
                        : "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    cursor:
                      selectedClasses.length === 0 || isLoading
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      selectedClasses.length === 0 || isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? "Saving..." : "Save & Complete Signup"}
                </button>
                <button
                  onClick={resetAndRedirect}
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: "14px",
                    background: "#f8f9fa",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    fontSize: "16px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
