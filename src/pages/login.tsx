import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";
import "../styles/signin.css";

const ADMIN_CODE = "mini-fcmb";

export default function Login() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<"teacher" | "student">("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length === 0) {
        alert("No account found with this email. Please sign up.");
        navigate("/signup");
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      if (!user.emailVerified) {
        alert("Please verify your email before logging in.");
        await auth.signOut();
        return;
      }

      if (userType === "teacher" && adminCode !== ADMIN_CODE) {
        alert("Invalid Admin Code!");
        await auth.signOut();
        return;
      }

      const col = userType === "teacher" ? "teachers" : "students";
      const snap = await getDoc(doc(db, col, user.uid));

      if (!snap.exists()) {
        alert(`No ${userType} account found with this email.`);
        await auth.signOut();
        return;
      }

      if (userType === "teacher") {
        navigate("/teachers");
      } else {
        navigate("/students");
      }
    } catch (err: any) {
      if (err.code === "auth/wrong-password") {
        alert("Incorrect password. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        alert("No account found with this email. Please sign up.");
        navigate("/signup");
      } else {
        alert(err.message);
      }
    }
  };

  const handleGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      if (!user.emailVerified) {
        alert("Google account email not verified.");
        return;
      }

      if (userType === "teacher" && adminCode !== ADMIN_CODE) {
        alert("Invalid Admin Code for Teacher!");
        return;
      }

      const col = userType === "teacher" ? "teachers" : "students";
      const snap = await getDoc(doc(db, col, user.uid));

      if (!snap.exists()) {
        alert(`No ${userType} account linked to this Google profile.`);
        await auth.signOut();
        return;
      }

      if (userType === "teacher") {
        navigate("/teachers");
      } else {
        navigate("/students");
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") return;
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
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
