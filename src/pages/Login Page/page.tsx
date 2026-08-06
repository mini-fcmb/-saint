// src/pages/Login.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../../firebase/config";
import auth_wallpaper from "../../assets/auth_wallpaper.mp4";
import Logo from "../../assets/logo.png";

/**
 * Shared access code for the "Teacher" tab, which now covers BOTH admins
 * and teachers (they log in the same way). This is the same code
 * signup.tsx calls ADMIN_REFERENCE_CODE — kept as one constant here so the
 * two files can't drift out of sync. If you want separate codes for admins
 * vs teachers later, split this into two constants and branch on role
 * before comparing.
 */
const STAFF_ACCESS_CODE = "mini-fcmb";

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

  /**
   * Handles the "Teacher" tab, which now covers admins AND teachers.
   * 1. Validate the shared staff access code.
   * 2. Look up users/{uid} — if role === "admin", that's an admin account
   *    (written by signup.tsx). Send them to the admin dashboard.
   * 3. Otherwise look up teachers/{uid} — if it exists, that's a teacher
   *    account (written by admin.tsx's invite flow). Send them there.
   * 4. If neither doc exists, this Auth user has no staff profile at all.
   */
  const handleStaffLogin = async (uid: string, emailVerified: boolean) => {
    if (adminCode !== STAFF_ACCESS_CODE) {
      alert("Invalid access code.");
      await auth.signOut();
      return;
    }

    const userDocSnap = await getDoc(doc(db, "users", uid));
    if (userDocSnap.exists() && userDocSnap.data().role === "admin") {
      if (!emailVerified) {
        alert("Please verify your email before logging in.");
        await auth.signOut();
        return;
      }
      navigate(DASHBOARD_ROUTES.admin);
      return;
    }

    const teacherDocSnap = await getDoc(doc(db, "teachers", uid));
    if (!teacherDocSnap.exists()) {
      alert(
        "No profile found for this account. Please sign up, or ask your admin to invite you.",
      );
      await auth.signOut();
      navigate("/signup");
      return;
    }
    if (!emailVerified) {
      alert("Please verify your email before logging in.");
      await auth.signOut();
      return;
    }
    navigate(DASHBOARD_ROUTES.teacher);
  };

  const handleStudentLogin = async (uid: string, emailVerified: boolean) => {
    const docSnap = await getDoc(doc(db, "students", uid));
    if (!docSnap.exists()) {
      alert("No student profile found. Please sign up.");
      await auth.signOut();
      navigate("/signup");
      return;
    }
    if (!emailVerified) {
      alert("Please verify your email before logging in.");
      await auth.signOut();
      return;
    }
    navigate(DASHBOARD_ROUTES.student);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      await user.reload();
      const refreshedUser = auth.currentUser;
      if (!refreshedUser) throw new Error("User not found after reload");

      if (userType === "teacher") {
        await handleStaffLogin(refreshedUser.uid, refreshedUser.emailVerified);
      } else {
        await handleStudentLogin(
          refreshedUser.uid,
          refreshedUser.emailVerified,
        );
      }
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
      await user.reload();
      const refreshedUser = auth.currentUser;
      if (!refreshedUser) throw new Error("User not found after reload");

      if (userType === "teacher") {
        await handleStaffLogin(refreshedUser.uid, refreshedUser.emailVerified);
      } else {
        await handleStudentLogin(
          refreshedUser.uid,
          refreshedUser.emailVerified,
        );
      }
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        alert(err.message || "Google login failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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

        .login-modal {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100vh;
          z-index: 1;
        }

        .login-card {
          display: flex;
          width: 100%;
          height: 100%;
          min-height: 100vh;
          background: #ffffff;
          border-radius: 0;
          box-shadow: none;
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

        .login-form h2 {
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

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

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

        .login-btn {
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
        .login-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 18px 32px -10px rgba(29, 42, 107, 0.6); }
        .login-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

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
          margin: 10px;
          border-radius: 50px;
          overflow: hidden;
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

        @media (max-width: 860px) {
          .wallpaper-panel { display: none; }
          .form-panel { flex: 1 1 100%; padding: 36px 24px; }
          .login-card { min-height: auto; }
        }
      `}</style>

      <div>
        <div className="login-modal">
          <div className="login-card">
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

              <form onSubmit={handleLogin} className="login-form">
                <h2>Sign Into your account</h2>
                <p className="form-subtitle">
                  Welcome back! Please enter your credentials.
                </p>

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

                {userType === "teacher" && (
                  <input
                    type="password"
                    placeholder="Admin code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                )}

                <button
                  type="submit"
                  className="login-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Log in"}
                </button>
              </form>

              <div className="divider">OR SIGN IN WITH</div>

              <div className="social-row">
                <button
                  onClick={handleGoogle}
                  className="social"
                  disabled={isLoading}
                  aria-label="Sign in with Google"
                >
                  <img src="/icons/google.svg" alt="Google" />
                </button>
                <button
                  className="social"
                  disabled
                  aria-label="Sign in with Apple (coming soon)"
                >
                  <img src="/icons/apple.svg" alt="Apple" />
                </button>
              </div>

              <p className="terms">
                Don't have an account? <a href="/signup">Sign up</a>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
