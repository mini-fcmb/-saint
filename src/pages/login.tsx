// src/pages/Login.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  reload,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";
import "../styles/signin.css";

const ADMIN_CODE = "mini-fcmb";

const DASHBOARD_ROUTES = {
  teacher: "/teachers",
  student: "/students",
} as const;

export default function Login() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<"teacher" | "student">("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --------------------------------------------------------------
  // Email/Password Login
  // --------------------------------------------------------------
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Try to sign in — Firebase will tell us if user exists
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // 2. RELOAD USER to get fresh email verification status
      await reload(user);
      const refreshedUser = auth.currentUser; // Get the refreshed user

      if (!refreshedUser) {
        throw new Error("User not found after reload");
      }

      // 3. Check email verification with refreshed data
      if (!refreshedUser.emailVerified) {
        alert(
          "Please verify your email before logging in. Check your inbox and spam folder."
        );
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      // 4. Validate admin code for teachers
      if (userType === "teacher" && adminCode !== ADMIN_CODE) {
        alert("Invalid Admin Code!");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      // 5. Check Firestore profile exists
      const collection = userType === "teacher" ? "teachers" : "students";
      const docSnap = await getDoc(doc(db, collection, user.uid));

      if (!docSnap.exists()) {
        alert(`No ${userType} profile found. Please sign up.`);
        await auth.signOut();
        navigate("/signup");
        setIsLoading(false);
        return;
      }

      // 6. SUCCESS! Go to dashboard
      navigate(DASHBOARD_ROUTES[userType]);
    } catch (err: any) {
      // Firebase gives accurate error codes
      if (err.code === "auth/user-not-found") {
        alert("No account found with this email. Please sign up.");
        navigate("/signup");
      } else if (err.code === "auth/wrong-password") {
        alert("Incorrect password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        alert("Too many failed attempts. Try again later.");
      } else if (err.code === "auth/invalid-credential") {
        alert("Invalid email or password.");
      } else {
        alert(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------------------
  // Google Login
  // --------------------------------------------------------------
  const handleGoogle = async () => {
    setIsLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;

      // 1. RELOAD USER to get fresh email verification status
      await reload(user);
      const refreshedUser = auth.currentUser;

      if (!refreshedUser) {
        throw new Error("User not found after reload");
      }

      // 2. Check email verification with refreshed data
      if (!refreshedUser.emailVerified) {
        alert("Google account email is not verified.");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      // 3. Validate admin code for teachers
      if (userType === "teacher" && adminCode !== ADMIN_CODE) {
        alert("Invalid Admin Code for Teacher!");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      // 4. Check Firestore profile
      const collection = userType === "teacher" ? "teachers" : "students";
      const docSnap = await getDoc(doc(db, collection, user.uid));

      if (!docSnap.exists()) {
        alert(`No ${userType} profile linked to this Google account.`);
        await auth.signOut();
        navigate("/signup");
        setIsLoading(false);
        return;
      }

      // 5. SUCCESS
      navigate(DASHBOARD_ROUTES[userType]);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        // User closed the popup, no need to show error
      } else {
        alert(err.message || "Google login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────────────────────────────
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
              disabled={isLoading}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            {userType === "teacher" && (
              <input
                type="password"
                placeholder="Admin Code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required
                disabled={isLoading}
              />
            )}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Log in"}
            </button>
          </form>

          <div className="divider">OR SIGN IN WITH</div>

          <div className="social-row">
            <button
              onClick={handleGoogle}
              className="social google"
              disabled={isLoading}
            >
              <img src="/icons/google.svg" alt="Google" />
            </button>
            <button className="social apple" disabled>
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
