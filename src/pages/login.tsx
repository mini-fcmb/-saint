// src/pages/Login.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";
import "../styles/signin.css"; // <-- same folder as signup.css

export default function Login() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<"teacher" | "student">("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");

  /* ---------- EMAIL / PASSWORD ---------- */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // 1. Firebase Auth sign-in
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // 2. Email verification check
      if (!user.emailVerified) {
        alert("Please verify your email before logging in.");
        await auth.signOut();
        return;
      }

      // 3. Teacher admin-code check
      if (userType === "teacher" && adminCode !== "mini-fcmb") {
        alert("Invalid Admin Code!");
        await auth.signOut();
        return;
      }

      // 4. Verify user exists in the correct collection
      const col = userType === "teacher" ? "teachers" : "students";
      const snap = await getDoc(doc(db, col, user.uid));

      if (!snap.exists()) {
        alert(`No ${userType} account found with this email.`);
        await auth.signOut();
        return;
      }

      // Success!
      navigate("/dashboard");
    } catch (err: any) {
      alert(err.message);
    }
  };

  /* ---------- GOOGLE (admin code still required for teacher) ---------- */
  const handleGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      // Email verification (Google always verified)
      if (!user.emailVerified) {
        alert("Google account email not verified.");
        return;
      }

      if (userType === "teacher" && adminCode !== "mini-fcmb") {
        alert("Invalid Admin Code for Teacher!");
        return;
      }

      const col = userType === "teacher" ? "teachers" : "students";
      const snap = await getDoc(doc(db, col, user.uid));

      if (!snap.exists()) {
        alert(`No ${userType} account linked to this Google profile.`);
        return;
      }

      navigate("/dashboard");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-modal">
        <div className="modal-backdrop"></div>

        <div className="login-card">
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

          <form onSubmit={handleLogin} className="login-form">
            <h2>Sign Into your account</h2>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {userType === "teacher" && (
              <input
                type="password"
                placeholder="Admin Code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required
              />
            )}

            <button type="submit" className="login-btn">
              Log in
            </button>
          </form>

          <div className="divider">OR SIGN IN WITH</div>

          <div className="social-row">
            <button onClick={handleGoogle} className="social google">
              <img src="/icons/google.svg" alt="Google" />
            </button>
            <button className="social apple">
              <img src="/icons/apple.svg" alt="Apple" />
            </button>
          </div>

          <p className="terms">
            Don’t have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
