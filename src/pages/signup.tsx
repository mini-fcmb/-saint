// src/pages/signup.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, appleProvider } from "../firebase/config";
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

  // ───── Form State ─────
  const [userType, setUserType] = useState<"teacher" | "student">("teacher");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [className, setClassName] = useState("");
  const [adminCodeInput, setAdminCodeInput] = useState("");

  // ───── Google/Apple Info Modal ─────
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [info, setInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    className: "",
  });

  // ───── Admin Modal ─────
  const [showAdminModal, setShowAdminModal] = useState(false);
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

  // ───── Helper: Save to Firestore ─────
  const saveUserToFirestore = async (uid: string, base: any) => {
    const collection = userType === "teacher" ? "teachers" : "students";
    const data = userType === "teacher" ? { ...base, subjects: [] } : base;
    await setDoc(doc(db, collection, uid), data);
    console.log(`[Firestore] Saved ${userType} ${uid}`);
  };

  // ───── Admin Code Handlers ─────
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
    if (adminCodeInput !== ADMIN_CODE) {
      handleWrongAdminCode();
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Session expired. Please try again.");
      navigate("/login");
      return;
    }

    if (!user.emailVerified) {
      alert("Please verify your email first.");
      navigate("/login");
      return;
    }

    alert("Teacher account created successfully!");
    setShowAdminModal(false);
    setAdminCodeInput("");
    navigate(DASHBOARD_ROUTES.teacher);
  };

  const resetAndRedirect = () => {
    localStorage.removeItem(ATTEMPT_KEY);
    setAdminAttempts(0);
    setShowAdminModal(false);
    setShowInfoModal(false);
    setAdminCodeInput("");
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

      // Block if email already used with password
      const methods = await fetchSignInMethodsForEmail(auth, user.email!);
      if (methods.includes("password")) {
        alert(
          "This email is already registered with a password. Please sign in."
        );
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

    const base = {
      fullName: info.fullName,
      email: info.email,
      phone: info.phone,
      className: info.className,
      createdAt: serverTimestamp(),
    };

    try {
      await saveUserToFirestore(user.uid, base);
      console.log("[Provider] Profile saved to Firestore");

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        console.log("[Provider] Verification email sent");
        alert("Verification email sent! Please check your inbox.");
      }

      setShowInfoModal(false);

      if (userType === "teacher") {
        setShowAdminModal(true);
        return;
      }

      if (user.emailVerified) {
        navigate(DASHBOARD_ROUTES[userType]);
      } else {
        alert("Please verify your email before accessing the dashboard.");
        navigate("/login");
      }
    } catch (err: any) {
      console.error("[Provider] Save failed:", err);
      alert("Failed to save profile: " + err.message);
    }
  };

  // ───── Email/Password Signup ─────
  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();

    if (userType === "teacher" && adminCodeInput !== ADMIN_CODE) {
      handleWrongAdminCode();
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      console.log("[Email] User created:", user.uid);

      // Update display name
      await updateProfile(user, { displayName: fullName });

      // Save to Firestore
      await saveUserToFirestore(user.uid, {
        fullName,
        email,
        phone,
        className,
        createdAt: serverTimestamp(),
      });

      // Send verification email
      await sendEmailVerification(user);
      console.log("[Email] Verification email sent");

      alert("Account created! Check your inbox to verify, then log in.");
      navigate("/login");
    } catch (err: any) {
      console.error("[Email] Signup error:", err.code);
      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please sign in.");
        navigate("/login");
      } else {
        alert(err.message || "Signup failed. Please try again.");
      }
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
              <button
                onClick={() => handleProvider(googleProvider)}
                className="social google"
              >
                <img src="/icons/google.svg" alt="Google" />
              </button>
              <button
                onClick={() => handleProvider(appleProvider)}
                className="social apple"
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
                {classOptions.map((c) => (
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

      {/* ADMIN CODE MODAL */}
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
    </>
  );
}
