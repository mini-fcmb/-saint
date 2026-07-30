// src/pages/signup.tsx
import { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, appleProvider } from "../../firebase/config";
import auth_wallpaper from "../../assets/auth_wallpaper.mp4";
import Logo from "../../assets/logo.png";

/**
 * ── Admin dashboard destination ──
 * Update this to match your project's actual admin dashboard route if it
 * differs from this placeholder.
 */
const ADMIN_DASHBOARD_ROUTE = "/admin/dashboard";

/** Minimum seconds between resend-verification-email requests. */
const RESEND_COOLDOWN_SECONDS = 60;

interface FormErrors {
  schoolName?: string;
  adminName?: string;
  phone?: string;
  email?: string;
  password?: string;
  adminCode?: string;
  general?: string;
}

type ToastType = "success" | "error";

interface ToastState {
  message: string;
  type: ToastType;
}

const ADMIN_REFERENCE_CODE = "mini-fcmb";

async function validateAdminCode(
  code: string,
): Promise<{ valid: boolean; error?: string }> {
  const trimmed = code.trim();
  if (!trimmed)
    return { valid: false, error: "Admin reference code is required." };

  if (trimmed !== ADMIN_REFERENCE_CODE) {
    return { valid: false, error: "Invalid admin reference code." };
  }

  return { valid: true };
}

/** Returns true if an account already exists for this email. */
async function checkEmailExists(email: string): Promise<boolean> {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  return methods.length > 0;
}

interface SchoolAdminProfileData {
  schoolName: string;
  adminName: string;
  phone: string;
  email: string;
}

async function writeSchoolAdminDocuments(
  uid: string,
  data: SchoolAdminProfileData,
): Promise<string> {
  const schoolId = uid;
  const { schoolName, adminName, phone, email } = data;

  await setDoc(doc(db, "schools", schoolId), {
    schoolName,
    adminName,
    phone,
    email,
    adminUid: uid,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "users", uid), {
    uid,
    fullName: adminName,
    email,
    phone,
    role: "admin",
    schoolId,
    schoolName,
    createdAt: serverTimestamp(),
  });

  return schoolId;
}

interface SchoolAdminSignupData extends SchoolAdminProfileData {
  password: string;
}

/** Full email/password school-admin signup: auth user + Firestore docs + verification email. */
async function createSchoolAdminAccount(
  data: SchoolAdminSignupData,
): Promise<User> {
  const { schoolName, adminName, phone, email, password } = data;

  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = credential.user;

  await updateProfile(user, { displayName: adminName });
  await writeSchoolAdminDocuments(user.uid, {
    schoolName,
    adminName,
    phone,
    email,
  });
  await sendEmailVerification(user);

  return user;
}

export default function Signup() {
  const navigate = useNavigate();

  // ───── Form State ─────
  const [schoolName, setSchoolName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [socialSchoolName, setSocialSchoolName] = useState("");
  const [socialPhone, setSocialPhone] = useState("");
  const [socialAdminCode, setSocialAdminCode] = useState("");
  const [socialInfo, setSocialInfo] = useState({ adminName: "", email: "" });
  const [socialError, setSocialError] = useState("");

  const [signupComplete, setSignupComplete] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ───── Toast ─────
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 7000);
  };

  const closeToast = () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(null);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Countdown for the resend-verification cooldown, ticking once per second.
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const validateForm = (): boolean => {
    const next: FormErrors = {};

    if (!schoolName.trim()) next.schoolName = "School name is required.";
    if (!adminName.trim()) next.adminName = "Admin full name is required.";
    if (!phone.trim()) next.phone = "Phone number is required.";
    if (!email.trim()) next.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (!adminCodeInput.trim())
      next.adminCode = "Admin reference code is required.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ───── Email/Password Signup ─────
  const handleEmailSignup = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 1. Validate the admin/reference code first.
      const codeCheck = await validateAdminCode(adminCodeInput);
      if (!codeCheck.valid) {
        setErrors({
          adminCode: codeCheck.error || "Invalid admin reference code.",
        });
        setIsLoading(false);
        return;
      }

      // 2. Make sure the email isn't already registered.
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        setErrors({
          email: "This email is already registered. Please sign in instead.",
        });
        setIsLoading(false);
        return;
      }

      // 3. Create the Firebase Auth user + Firestore school/admin documents,
      //    and send the verification email.
      const user = await createSchoolAdminAccount({
        schoolName: schoolName.trim(),
        adminName: adminName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
      });

      // 4. Stay on this page — show the success toast + verification state
      //    instead of redirecting to /login.
      setPendingEmail(user.email || email.trim());
      setSignupComplete(true);
      showToast(
        "Account created successfully. Please verify your email to continue.",
        "success",
      );
    } catch (err: any) {
      console.error("[Signup] Error:", err.code || err);
      if (err.code === "auth/email-already-in-use") {
        setErrors({
          email: "This email is already registered. Please sign in.",
        });
      } else if (err.code === "auth/weak-password") {
        setErrors({ password: "Please choose a stronger password." });
      } else if (err.code === "auth/network-request-failed") {
        setErrors({
          general: "Network error. Please check your connection and try again.",
        });
      } else {
        setErrors({
          general: err.message || "Signup failed. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ───── Google / Apple ─────
  const handleProvider = async (
    provider: typeof googleProvider | typeof appleProvider,
  ) => {
    setErrors({});
    try {
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      setSocialInfo({
        adminName: user.displayName ?? "",
        email: user.email ?? "",
      });
      setSocialPhone(user.phoneNumber ?? "");
      setSocialSchoolName("");
      setSocialAdminCode("");
      setSocialError("");
      setShowCompleteModal(true);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error("[Provider] Error:", err);
        setErrors({
          general: err.message || "Sign in failed. Please try again.",
        });
      }
    }
  };

  const cancelSocialSignup = async () => {
    setShowCompleteModal(false);
    // The auth account exists but no school/admin docs were written for it —
    // remove it so it isn't left as an orphaned, role-less account.
    try {
      await auth.currentUser?.delete();
    } catch (err) {
      console.error("[Provider] Cleanup failed:", err);
      await auth.signOut();
    }
  };

  const confirmSocialSignup = async () => {
    setSocialError("");

    if (
      !socialSchoolName.trim() ||
      !socialPhone.trim() ||
      !socialAdminCode.trim()
    ) {
      setSocialError("All fields are required.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setSocialError("Session expired. Please try signing in again.");
      return;
    }

    setIsLoading(true);
    try {
      const codeCheck = await validateAdminCode(socialAdminCode);
      if (!codeCheck.valid) {
        setSocialError(codeCheck.error || "Invalid admin reference code.");
        setIsLoading(false);
        return;
      }

      await writeSchoolAdminDocuments(user.uid, {
        schoolName: socialSchoolName.trim(),
        adminName: socialInfo.adminName || user.displayName || "",
        phone: socialPhone.trim(),
        email: user.email,
      });

      setShowCompleteModal(false);

      if (user.emailVerified) {
        // Provider account was already verified — no need to wait.
        showToast("Account created successfully.", "success");
        navigate("../Admin Dashboard/page");
        return;
      }

      await sendEmailVerification(user);
      setPendingEmail(user.email);
      setSignupComplete(true);
      showToast(
        "Account created successfully. Please verify your email to continue.",
        "success",
      );
    } catch (err: any) {
      console.error("[Provider] Completion failed:", err);
      setSocialError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ───── Post-signup verification actions ─────
  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        showToast("Your session has expired. Please sign in again.", "error");
        return;
      }

      // Firebase Auth user objects can be stale — reload before checking.
      await user.reload();
      const refreshedUser = auth.currentUser;

      if (refreshedUser?.emailVerified) {
        navigate("../Admin Dashboard/page");
      } else {
        showToast(
          "Your email hasn't been verified yet. Please check your inbox and try again.",
          "error",
        );
      }
    } catch (err: any) {
      console.error("[Verification] Check failed:", err);
      showToast(
        err.message || "Could not check verification status. Please try again.",
        "error",
      );
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resending) return;

    const user = auth.currentUser;
    if (!user) {
      showToast("Your session has expired. Please sign in again.", "error");
      return;
    }

    setResending(true);
    try {
      await sendEmailVerification(user);
      showToast(
        "Verification email resent. Please check your inbox.",
        "success",
      );
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      console.error("[Verification] Resend failed:", err);
      showToast(
        err.message || "Could not resend verification email. Please try again.",
        "error",
      );
    } finally {
      setResending(false);
    }
  };

  // ───── UI ─────
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

        .signup-page {
          position: relative;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(8, 10, 30, 0.4);
          backdrop-filter: blur(8px);
        }

        .signup-modal {
          position: relative;
          width: 100%;
          max-width: 980px;
          z-index: 1;
        }

        .signup-card {
          position: relative;
          display: flex;
          width: 100%;
          min-height: 640px;
          background: #ffffff;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-card);
          overflow: hidden;
        }

        /* ───── Left panel: form ───── */
        .form-panel {
          flex: 1 1 52%;
          padding: 44px 48px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          min-width: 0;
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
        .brand-mark:hover { opacity: 0.8; }
        .brand-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--ink);
          letter-spacing: 0.2px;
        }

        .signup-form h2 {
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
          line-height: 1.5;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-error {
          font-size: 12px;
          color: var(--danger);
          margin: 0;
        }
        .general-error {
          font-size: 13px;
          color: var(--danger);
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          margin: 0 0 4px;
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
        input.has-error { border-color: var(--danger); }

        .phone-row { display: flex; width: 100%; }
        .country {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          background: var(--field-bg);
          border: 1.5px solid transparent;
          border-right: 1px solid var(--line);
          border-radius: var(--radius-md) 0 0 var(--radius-md);
          white-space: nowrap;
          font-size: 14.5px;
          color: var(--ink);
          flex-shrink: 0;
        }
        .country img { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; }
        .phone-row input { border-radius: 0 var(--radius-md) var(--radius-md) 0; min-width: 0; }

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

        .create-btn {
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
        .create-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 18px 32px -10px rgba(29, 42, 107, 0.6); }
        .create-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }

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
          margin: 12px;
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

        /* ───── Post-signup verification card ───── */
        .verify-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 12px 0 4px;
        }
        .verify-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.12);
          color: var(--success);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .verify-card h2 { margin-bottom: 8px; }
        .verify-card .form-subtitle { margin-bottom: 28px; }
        .verify-card .create-btn { width: 100%; }
        .verify-resend-btn {
          width: 100%;
          margin-top: 12px;
          padding: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          color: var(--ink);
          background: var(--field-bg);
          border: 1.5px solid var(--line);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .verify-resend-btn:hover:not(:disabled) { background: #eef0f5; }
        .verify-resend-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ───── Toast ───── */
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 380px;
          width: calc(100% - 48px);
          pointer-events: none;
        }
        .toast {
          pointer-events: auto;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: #fff;
          box-shadow: 0 20px 40px -12px rgba(10, 14, 45, 0.35);
          border: 1.5px solid var(--line);
          animation: toast-in 0.25s ease;
        }
        .toast.toast-success { border-left: 4px solid var(--success); }
        .toast.toast-error { border-left: 4px solid var(--danger); }
        .toast-icon { flex-shrink: 0; margin-top: 1px; }
        .toast.toast-success .toast-icon { color: var(--success); }
        .toast.toast-error .toast-icon { color: var(--danger); }
        .toast-message {
          flex: 1;
          font-size: 13.5px;
          color: var(--ink);
          line-height: 1.45;
        }
        .toast-close {
          flex-shrink: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--ink-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3px;
          border-radius: 50%;
        }
        .toast-close:hover { background: var(--field-bg); }

        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ───── Responsive breakpoints ───── */

        /* Tablet */
        @media (max-width: 1024px) {
          .form-panel { padding: 40px; }
          .wallpaper-panel { border-radius: 34px; margin: 10px; }
        }

        /* Small tablet / large phone: drop the wallpaper, form takes full width */
        @media (max-width: 860px) {
          .signup-page { padding: 16px; align-items: flex-start; }
          .wallpaper-panel { display: none; }
          .signup-card { flex-direction: column; min-height: auto; }
          .form-panel { flex: 1 1 100%; padding: 32px 24px; }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .signup-page { padding: 10px; }
          .form-panel { padding: 26px 18px; }
          .signup-form h2 { font-size: 22px; }
          .name-row, .phone-row { flex-direction: column; }
          .country {
            border-right: none;
            border-bottom: 1px solid var(--line);
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            padding: 10px 14px;
          }
          .phone-row input { border-radius: 0 0 var(--radius-md) var(--radius-md); }
          .social-row { gap: 10px; }
          .social { width: 46px; height: 46px; }
          .toast-container { top: 12px; right: 12px; left: 12px; max-width: none; width: auto; }
        }

        /* Very small screens */
        @media (max-width: 360px) {
          .form-panel { padding: 20px 14px; }
          input, .create-btn { padding: 12px 14px; font-size: 14px; }
        }

        /* ───── Complete-registration dialog (social sign-in) ───── */
        .dialog-card {
          position: relative;
          width: 100%;
          background: #fff;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-card);
          padding: 30px;
          max-height: 88vh;
          overflow-y: auto;
        }
        .dialog-card.dialog-sm { max-width: 440px; }

        .dialog-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: var(--ink);
          text-align: center;
          margin: 0 0 8px;
        }
        .dialog-subtitle {
          font-size: 13.5px;
          color: var(--ink-soft);
          text-align: center;
          margin: 0 0 22px;
          line-height: 1.5;
        }
        .dialog-subtitle strong { color: var(--ink); }

        .dialog-field { margin-bottom: 12px; }

        .dialog-actions { display: flex; gap: 12px; margin-top: 8px; }
        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
        }
        .btn-primary {
          color: #fff;
          background: linear-gradient(135deg, var(--accent), var(--accent-dark));
          box-shadow: 0 14px 28px -10px rgba(29, 42, 107, 0.5);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; background: #c6cadb; box-shadow: none; }
        .btn-secondary {
          color: var(--ink);
          background: var(--field-bg);
          border: 1.5px solid var(--line);
        }
        .btn-secondary:hover:not(:disabled) { background: #eef0f5; }
        .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 480px) {
          .dialog-card { padding: 22px; }
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast-container">
          <div
            className={`toast toast-${toast.type}`}
            role="status"
            aria-live="polite"
          >
            <span className="toast-icon">
              {toast.type === "success" ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button
              className="toast-close"
              onClick={closeToast}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MAIN SIGNUP FORM */}
      <div className="signup-page">
        <div className="signup-modal">
          <div className="signup-card">
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

              {signupComplete ? (
                /* ───── Post-signup verification state ───── */
                <div className="verify-card">
                  <div className="verify-icon">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2>Account created successfully</h2>
                  <p className="form-subtitle">
                    We've sent a verification link to{" "}
                    <strong>{pendingEmail}</strong>. Verify your email before
                    continuing to your admin dashboard.
                  </p>

                  <button
                    type="button"
                    className="create-btn"
                    onClick={handleCheckVerification}
                    disabled={checkingVerification}
                  >
                    {checkingVerification
                      ? "Checking..."
                      : "I've verified my email — Continue to Dashboard"}
                  </button>

                  <button
                    type="button"
                    className="verify-resend-btn"
                    onClick={handleResendVerification}
                    disabled={resending || resendCooldown > 0}
                  >
                    {resending
                      ? "Resending..."
                      : resendCooldown > 0
                        ? `Resend available in ${resendCooldown}s`
                        : "Resend verification email"}
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleEmailSignup}
                  className="signup-form"
                  noValidate
                >
                  <h2>Create your school account</h2>
                  <p className="form-subtitle">
                    Register your school to manage classes, teachers, subjects,
                    and students from one platform.
                  </p>

                  {errors.general && (
                    <p className="general-error">{errors.general}</p>
                  )}

                  <div className="field-group">
                    <input
                      placeholder="School name"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      disabled={isLoading}
                      className={errors.schoolName ? "has-error" : ""}
                    />
                    {errors.schoolName && (
                      <p className="field-error">{errors.schoolName}</p>
                    )}
                  </div>

                  <div className="field-group">
                    <input
                      placeholder="Admin full name"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      disabled={isLoading}
                      className={errors.adminName ? "has-error" : ""}
                    />
                    {errors.adminName && (
                      <p className="field-error">{errors.adminName}</p>
                    )}
                  </div>

                  <div className="field-group">
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
                        className={errors.phone ? "has-error" : ""}
                      />
                    </div>
                    {errors.phone && (
                      <p className="field-error">{errors.phone}</p>
                    )}
                  </div>

                  <div className="field-group">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className={errors.email ? "has-error" : ""}
                    />
                    {errors.email && (
                      <p className="field-error">{errors.email}</p>
                    )}
                  </div>

                  <div className="field-group">
                    <div className="password-input-container">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className={errors.password ? "has-error" : ""}
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
                    {errors.password && (
                      <p className="field-error">{errors.password}</p>
                    )}
                  </div>

                  <div className="field-group">
                    <input
                      type="password"
                      placeholder="Admin reference code"
                      value={adminCodeInput}
                      onChange={(e) => setAdminCodeInput(e.target.value)}
                      disabled={isLoading}
                      className={errors.adminCode ? "has-error" : ""}
                    />
                    {errors.adminCode && (
                      <p className="field-error">{errors.adminCode}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="create-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Admin Account"}
                  </button>
                </form>
              )}

              {!signupComplete && (
                <>
                  <div className="divider">OR SIGN UP WITH</div>

                  <div className="social-row">
                    <button
                      onClick={() => handleProvider(googleProvider)}
                      className="social"
                      disabled={isLoading}
                      aria-label="Sign up with Google"
                    >
                      <img src="/icons/google.svg" alt="Google" />
                    </button>
                    <button
                      onClick={() => handleProvider(appleProvider)}
                      className="social"
                      disabled={isLoading}
                      aria-label="Sign up with Apple"
                    >
                      <img src="/icons/apple.svg" alt="Apple" />
                    </button>
                  </div>

                  <p className="terms">
                    By creating an account, you agree to our{" "}
                    <a href="#">Terms &amp; Service</a>
                  </p>
                </>
              )}
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

      {/* COMPLETE SCHOOL REGISTRATION MODAL (Google/Apple sign-in) */}
      {showCompleteModal && (
        <div
          className="signup-page"
          style={{ position: "fixed", inset: 0, zIndex: 1100 }}
        >
          <div className="modal-backdrop" />
          <div className="dialog-card dialog-sm" style={{ zIndex: 1 }}>
            <h3 className="dialog-title">Complete School Registration</h3>
            <p className="dialog-subtitle">
              Signed in as <strong>{socialInfo.email}</strong>. Finish setting
              up your school and enter your admin reference code to activate the
              account.
            </p>

            {socialError && <p className="general-error">{socialError}</p>}

            <div className="dialog-field">
              <input
                type="text"
                placeholder="School name"
                value={socialSchoolName}
                onChange={(e) => setSocialSchoolName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="dialog-field">
              <div className="phone-row">
                <div className="country">
                  <img src="/flags/ng.svg" alt="NG" />
                  <span>+234</span>
                </div>
                <input
                  type="tel"
                  placeholder="775-351-6501"
                  value={socialPhone}
                  onChange={(e) => setSocialPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="dialog-field">
              <input
                type="password"
                placeholder="Admin reference code"
                value={socialAdminCode}
                onChange={(e) => setSocialAdminCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmSocialSignup()}
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div className="dialog-actions">
              <button
                className="btn-primary"
                onClick={confirmSocialSignup}
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Complete Registration"}
              </button>
              <button
                className="btn-secondary"
                onClick={cancelSocialSignup}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
