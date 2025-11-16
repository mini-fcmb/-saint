// src/pages/Signup.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  sendEmailVerification,
  User,
  fetchSignInMethodsForEmail,
} from "firebase/auth";

import { auth, db, googleProvider, appleProvider } from "../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "../styles/signup.css";

const ADMIN_CODE = "mini-fcmb";
const MAX_ADMIN_ATTEMPTS = 3;
const ATTEMPT_KEY = "adminCodeAttempts";

const DASHBOARD_ROUTES = {
  teacher: "/teachers",
  student: "/students",
} as const;

export default function Signup() {
  const navigate = useNavigate();

  // ---------- Form state ----------
  const [userType, setUserType] = useState<"teacher" | "student">("teacher");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [className, setClassName] = useState("");
  const [adminCodeInput, setAdminCodeInput] = useState("");

  // ---------- Google/Apple + Modals ----------
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showGoogleInfoModal, setShowGoogleInfoModal] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleInfo, setGoogleInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    className: "",
  });

  // ---------- Admin attempts ----------
  const [adminAttempts, setAdminAttempts] = useState(() => {
    const saved = localStorage.getItem(ATTEMPT_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  const fullName = `${firstName} ${lastName}`.trim();
  const classOptions = [
    "Primary5",
    "JSS 1",
    "JSS 2",
    "JSS 3",
    "SSS 1",
    "SSS 2",
    "SSS 3",
  ];

  // --------------------------------------------------------------
  // Save user to Firestore
  // --------------------------------------------------------------
  const saveUserToFirestore = async (uid: string, base: any) => {
    const collection = userType === "teacher" ? "teachers" : "students";
    const data = userType === "teacher" ? { ...base, subjects: [] } : base;
    await setDoc(doc(db, collection, uid), data);
  };

  // --------------------------------------------------------------
  // Handle Email/Password Signup
  // --------------------------------------------------------------
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();

    // Validate admin code for teachers
    if (userType === "teacher" && adminCodeInput !== ADMIN_CODE) {
      handleWrongAdminCode();
      return;
    }

    try {
      // 1. Create Auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // 2. Update profile
      await updateProfile(user, { displayName: fullName });

      // 3. Save to Firestore
      const base = {
        fullName,
        email,
        phone,
        className,
        createdAt: serverTimestamp(),
      };
      await saveUserToFirestore(user.uid, base);

      // 4. Send verification email (DO NOT WAIT)
      await sendEmailVerification(user);
      alert("Account created! Check your email to verify, then log in.");

      // 5. Redirect immediately
      navigate(DASHBOARD_ROUTES[userType]);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please sign in.");
        navigate("/login");
      } else {
        alert(err.message || "Signup failed. Please try again.");
      }
    }
  };

  // --------------------------------------------------------------
  // Handle Google Signup
  // --------------------------------------------------------------
  const handleGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      // Block if email already exists
      const methods = await fetchSignInMethodsForEmail(auth, user.email!);
      if (methods.length > 0) {
        alert("This email is already registered. Please sign in.");
        await auth.signOut();
        navigate("/login");
        return;
      }

      // Populate form
      const [first = "", ...lastParts] = (user.displayName ?? "").split(" ");
      const last = lastParts.join(" ");
      setGoogleUser(user);
      setGoogleInfo({
        fullName: user.displayName ?? "",
        email: user.email ?? "",
        phone: user.phoneNumber ?? "",
        className: "",
      });
      setFirstName(first);
      setLastName(last);
      setEmail(user.email ?? "");
      setPhone(user.phoneNumber ?? "");
      setShowGoogleInfoModal(true);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        alert(err.message);
      }
    }
  };

  // --------------------------------------------------------------
  // Handle Apple Signup
  // --------------------------------------------------------------
  const handleApple = async () => {
    try {
      const res = await signInWithPopup(auth, appleProvider);
      const user = res.user;

      const methods = await fetchSignInMethodsForEmail(auth, user.email!);
      if (methods.length > 0) {
        alert("This email is already registered. Please sign in.");
        await auth.signOut();
        navigate("/login");
        return;
      }

      const [first = "", ...lastParts] = (user.displayName ?? "").split(" ");
      const last = lastParts.join(" ");
      setGoogleUser(user);
      setGoogleInfo({
        fullName: user.displayName ?? "",
        email: user.email ?? "",
        phone: user.phoneNumber ?? "",
        className: "",
      });
      setFirstName(first);
      setLastName(last);
      setEmail(user.email ?? "");
      setPhone(user.phoneNumber ?? "");
      setShowGoogleInfoModal(true);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        alert(err.message);
      }
    }
  };

  // --------------------------------------------------------------
  // Confirm Google/Apple Info
  // --------------------------------------------------------------
  const confirmGoogleInfo = async () => {
    if (!googleUser) return;

    const base = {
      fullName: googleInfo.fullName,
      email: googleInfo.email,
      phone: googleInfo.phone,
      className: googleInfo.className,
      createdAt: serverTimestamp(),
    };

    try {
      await saveUserToFirestore(googleUser.uid, base);

      // Send verification if needed
      if (!googleUser.emailVerified) {
        await sendEmailVerification(googleUser);
        alert("Verification email sent! Please check your inbox.");
      }

      // Teacher → show admin modal
      if (userType === "teacher") {
        setShowGoogleInfoModal(false);
        setShowAdminModal(true);
        return;
      }

      // Student → go to dashboard
      alert("Account created! Welcome!");
      setShowGoogleInfoModal(false);
      navigate(DASHBOARD_ROUTES[userType]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --------------------------------------------------------------
  // Finalize Teacher (after admin code)
  // --------------------------------------------------------------
  const finalizeTeacherSignup = () => {
    alert("Teacher account created successfully!");
    setShowAdminModal(false);
    setAdminCodeInput("");
    navigate(DASHBOARD_ROUTES.teacher);
  };

  // --------------------------------------------------------------
  // Admin Code Logic
  // --------------------------------------------------------------
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

  const confirmAdminCode = () => {
    if (adminCodeInput === ADMIN_CODE) {
      finalizeTeacherSignup();
    } else {
      handleWrongAdminCode();
    }
  };

  const resetAndRedirect = () => {
    localStorage.removeItem(ATTEMPT_KEY);
    setAdminAttempts(0);
    setShowAdminModal(false);
    setShowGoogleInfoModal(false);
    setGoogleUser(null);
    setAdminCodeInput("");
    auth.signOut();
    navigate("/signup", { replace: true });
  };

  // ────────────────────────────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ======== MAIN SIGNUP FORM ======== */}
      <div className="signup-page">
        <div className="signup-modal">
          <div className="modal-backdrop"></div>

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

            <form onSubmit={handleSignup} className="signup-form">
              <h2>Create an account</h2>

              <div className="name-row">
                <input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                />
              </div>

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                className="input-select"
              >
                <option value="">Select Class</option>
                {classOptions.map((c) => (
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
                />
              )}

              <button type="submit" className="create-btn">
                Create Account
              </button>
            </form>

            <div className="divider">OR SIGN UP WITH</div>

            <div className="social-row">
              <button onClick={handleGoogle} className="social google">
                <img src="/icons/google.svg" alt="Google" />
              </button>
              <button onClick={handleApple} className="social apple">
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

      {/* ======== GOOGLE/APPLE INFO MODAL ======== */}
      {showGoogleInfoModal && (
        <div className="signup-page" style={{ zIndex: 1100 }}>
          <div className="signup-modal">
            <div className="modal-backdrop"></div>
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
                value={googleInfo.fullName}
                onChange={(e) =>
                  setGoogleInfo((s) => ({ ...s, fullName: e.target.value }))
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
                value={googleInfo.email}
                onChange={(e) =>
                  setGoogleInfo((s) => ({ ...s, email: e.target.value }))
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
                  value={googleInfo.phone}
                  onChange={(e) =>
                    setGoogleInfo((s) => ({ ...s, phone: e.target.value }))
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
                value={googleInfo.className}
                onChange={(e) =>
                  setGoogleInfo((s) => ({ ...s, className: e.target.value }))
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
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={confirmGoogleInfo}
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

      {/* ======== ADMIN CODE MODAL ======== */}
      {showAdminModal && (
        <div className="signup-page" style={{ zIndex: 1200 }}>
          <div className="signup-modal">
            <div className="modal-backdrop"></div>
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
    </>
  );
}
