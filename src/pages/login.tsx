// src/pages/Login.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  reload,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";
import "../styles/signin.css";

const ADMIN_EMAIL = "minibossfcmb@proton.me"; // admin email
const ADMIN_CODE = "971566510072"; // admin code
const TEACHER_CODE = "mini-fcmb"; // teacher code

const DASHBOARD_ROUTES = {
  admin: "/admin",
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
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      await reload(user);
      const refreshedUser = auth.currentUser;
      if (!refreshedUser) throw new Error("User not found after reload");

      const isAdmin = email === ADMIN_EMAIL && adminCode === ADMIN_CODE;

      // Skip email verification for admin only
      if (!refreshedUser.emailVerified && !isAdmin) {
        alert("Please verify your email before logging in.");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      // Teacher admin code validation
      if (userType === "teacher" && !isAdmin && adminCode !== TEACHER_CODE) {
        alert("Invalid Admin Code for Teacher!");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      // Direct admin login
      if (isAdmin) {
        navigate(DASHBOARD_ROUTES.admin);
        setIsLoading(false);
        return;
      }

      // Check Firestore profile for teacher/student
      const collection = userType === "teacher" ? "teachers" : "students";
      const docSnap = await getDoc(doc(db, collection, user.uid));

      if (!docSnap.exists()) {
        alert(`No ${userType} profile found. Please sign up.`);
        await auth.signOut();
        navigate("/signup");
        setIsLoading(false);
        return;
      }

      // SUCCESS: go to the right dashboard
      navigate(DASHBOARD_ROUTES[userType]);
    } catch (err: any) {
      alert(err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      await reload(user);
      const refreshedUser = auth.currentUser;
      if (!refreshedUser) throw new Error("User not found after reload");

      const isAdmin = email === ADMIN_EMAIL && adminCode === ADMIN_CODE;

      if (!refreshedUser.emailVerified && !isAdmin) {
        alert("Google account email is not verified.");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      if (userType === "teacher" && !isAdmin && adminCode !== TEACHER_CODE) {
        alert("Invalid Admin Code for Teacher!");
        await auth.signOut();
        setIsLoading(false);
        return;
      }

      if (isAdmin) {
        navigate(DASHBOARD_ROUTES.admin);
        setIsLoading(false);
        return;
      }

      const collection = userType === "teacher" ? "teachers" : "students";
      const docSnap = await getDoc(doc(db, collection, user.uid));

      if (!docSnap.exists()) {
        alert(`No ${userType} profile linked to this Google account.`);
        await auth.signOut();
        navigate("/signup");
        setIsLoading(false);
        return;
      }

      navigate(DASHBOARD_ROUTES[userType]);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user")
        alert(err.message || "Google login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-modal">
        <div className="modal-backdrop"></div>
        <div className="login-card">
          <button className="close-btn" onClick={() => navigate("/")}>
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
