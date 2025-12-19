// src/pages/Login.tsx
import { Eye, EyeOff } from "lucide-react";
import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import "../styles/signin.css";

const ADMIN_EMAIL = "minibossfcmb@proton.me";
const ADMIN_CODE = "971566510072";
const TEACHER_CODE = "mini-fcmb";

const DASHBOARD_ROUTES = {
  admin: "/admin",
  teacher: "/teachers",
  student: "/students",
} as const;

export default function Login() {
  const navigate = useNavigate();
  const {
    initializeAuth,
    user,
    authInitialized,
    loading: storeLoading,
  } = useFirebaseStore();

  const [userType, setUserType] = useState<"teacher" | "student">("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Initialize auth store on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Redirect if already logged in
  useEffect(() => {
    if (authInitialized && user) {
      const { role } = useFirebaseStore.getState().userData || {};

      if (role === "teacher") {
        navigate(DASHBOARD_ROUTES.teacher, { replace: true });
      } else if (role === "student") {
        navigate(DASHBOARD_ROUTES.student, { replace: true });
      } else if (email === ADMIN_EMAIL && adminCode === ADMIN_CODE) {
        navigate(DASHBOARD_ROUTES.admin, { replace: true });
      }
    }
  }, [authInitialized, user, navigate]);

  // Show loading while store is initializing
  if (!authInitialized || storeLoading) {
    return (
      <div className="login-page">
        <div className="login-modal">
          <div className="login-card">
            <div className="loading-spinner">Initializing...</div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);

      // The store will automatically update via onAuthStateChanged
      // and the useEffect above will handle redirection
    } catch (err: any) {
      alert(err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      // The store will automatically update via onAuthStateChanged
      // and the useEffect above will handle redirection
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        alert(err.message || "Google login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already logged in, show redirecting message
  if (user) {
    return (
      <div className="login-page">
        <div className="login-modal">
          <div className="login-card">
            <div className="loading-spinner">Redirecting to dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

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
              disabled={isLoading}
            >
              Teacher
            </button>
            <button
              className={`tab ${userType === "student" ? "active" : ""}`}
              onClick={() => setUserType("student")}
              disabled={isLoading}
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
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
