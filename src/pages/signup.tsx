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

import { auth, db, googleProvider } from "../firebase/config";
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

  // ---------- Google + Modals ----------
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  // NEW: Google-Info modal
  const [showGoogleInfoModal, setShowGoogleInfoModal] = useState(false);
  const [googleInfo, setGoogleInfo] = useState<{
    fullName: string;
    email: string;
    phone: string;
    className: string;
  }>({
    fullName: "",
    email: "",
    phone: "",
    className: "",
  });

  // ---------- Verification & attempts ----------
  const [verifying, setVerifying] = useState(false);
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

  /* --------------------------------------------------------------
     Save to Firestore
  -------------------------------------------------------------- */
  const saveUserToFirestore = async (uid: string, base: any) => {
    if (userType === "teacher") {
      await setDoc(doc(db, "teachers", uid), { ...base, subjects: [] });
    } else {
      await setDoc(doc(db, "students", uid), base);
    }
  };

  /* --------------------------------------------------------------
     Wait for email verification
  -------------------------------------------------------------- */
  const waitForVerification = async (user: User) => {
    setVerifying(true);
    if (!user.emailVerified) {
      await sendEmailVerification(user);
      alert("Verification email sent! Please check your inbox.");
    }

    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(async () => {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(interval);
          setVerifying(false);
          resolve();
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(interval);
        setVerifying(false);
        reject(new Error("Verification timeout"));
      }, 5 * 60 * 1000);
    });
  };

  /* --------------------------------------------------------------
     EMAIL / PASSWORD SIGNUP – BLOCK DUPLICATE EMAIL
  -------------------------------------------------------------- */
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();

    if (userType === "teacher" && adminCodeInput !== ADMIN_CODE) {
      handleWrongAdminCode();
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await updateProfile(user, { displayName: fullName });

      const base = {
        fullName,
        email,
        phone,
        className,
        createdAt: serverTimestamp(),
      };
      await saveUserToFirestore(user.uid, base);

      await waitForVerification(user);

      alert("Account created successfully! Welcome to your dashboard.");
      navigate(DASHBOARD_ROUTES[userType]);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please sign in instead.");
        navigate("/login");
      } else {
        alert(err.message);
      }
    }
  };

  /* --------------------------------------------------------------
     GOOGLE SIGNUP – BLOCK IF EMAIL ALREADY EXISTS (ANY PROVIDER)
  -------------------------------------------------------------- */
  const handleGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      // FINAL FIX: Block if email is 100% exists (password, google, etc.)
      const methods = await fetchSignInMethodsForEmail(auth, user.email!);
      if (methods.length > 0) {
        alert("This email is already registered. Please sign in instead.");
        await auth.signOut();
        navigate("/login");
        return;
      }

      // Proceed only if email is brand new
      setGoogleUser(user);

      const [first = "", ...lastParts] = (user.displayName ?? "").split(" ");
      const last = lastParts.join(" ");
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

  /* --------------------------------------------------------------
     GOOGLE – Step 2: Confirm Google Info Modal
  -------------------------------------------------------------- */
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

      if (!googleUser.emailVerified) {
        await waitForVerification(googleUser);
      }

      if (userType === "teacher") {
        setShowGoogleInfoModal(false);
        setShowAdminModal(true);
        return;
      }

      alert("Account created successfully! Welcome to your dashboard.");
      setShowGoogleInfoModal(false);
      navigate(DASHBOARD_ROUTES[userType]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  /* --------------------------------------------------------------
     GOOGLE – Step 3: Finalize after admin code (teacher only)
  -------------------------------------------------------------- */
  const finalizeGoogleLogin = async () => {
    alert("Teacher account created successfully! Welcome to your dashboard.");
    setShowAdminModal(false);
    setAdminCodeInput("");
    navigate(DASHBOARD_ROUTES[userType]);
  };

  /* --------------------------------------------------------------
     Admin Code: Wrong Attempt
  -------------------------------------------------------------- */
  const handleWrongAdminCode = () => {
    const next = adminAttempts + 1;
    setAdminAttempts(next);
    localStorage.setItem(ATTEMPT_KEY, next.toString());

    setAdminCodeInput("");

    if (next >= MAX_ADMIN_ATTEMPTS) {
      alert(
        "You have used all 3 attempts. Your email/Google account will be disabled if another attempt fails.\n(This is just a warning – try again on the signup page.)"
      );
      resetAndRedirect();
    } else {
      alert(
        `Invalid Admin Code! You have ${
          MAX_ADMIN_ATTEMPTS - next
        } attempt(s) left.`
      );
    }
  };

  /* --------------------------------------------------------------
     Reset & Redirect
  -------------------------------------------------------------- */
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

  /* --------------------------------------------------------------
     Confirm Admin Code (Modal Button)
  -------------------------------------------------------------- */
  const confirmAdminCode = () => {
    if (adminCodeInput === ADMIN_CODE) {
      finalizeGoogleLogin();
    } else {
      handleWrongAdminCode();
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  //  UI (unchanged)
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
                  placeholder="John"
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

              <button type="submit" className="create-btn" disabled={verifying}>
                {verifying ? "Verifying email…" : "Create an account"}
              </button>
            </form>

            <div className="divider">OR SIGN UP WITH</div>

            <div className="social-row">
              <button
                onClick={handleGoogle}
                className="social google"
                disabled={verifying}
              >
                <img src="/icons/google.svg" alt="Google" />
              </button>
              <button className="social apple" disabled>
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

      {/* ======== ADMIN CODE MODAL ======== */}
      {showAdminModal && (
        <div className="signup-page" style={{ zIndex: 1000 }}>
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

      {/* ======== GOOGLE INFO CONFIRMATION MODAL ======== */}
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
                We pulled the following from Google. Please verify / edit.
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
    </>
  );
}
