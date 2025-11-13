// src/pages/Signup.tsx
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider } from "../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "../styles/signup.css";

export default function Signup() {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<"teacher" | "student">("teacher");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [className, setClassName] = useState("");
  const [adminCode, setAdminCode] = useState("");

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

  /* ---------- EMAIL / PASSWORD ---------- */
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();

    if (userType === "teacher" && adminCode !== "mini-fcmb") {
      alert("Invalid Admin Code!");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });

      const base = {
        fullName,
        email,
        phone,
        className,
        createdAt: serverTimestamp(),
      };

      if (userType === "teacher") {
        await setDoc(doc(db, "teachers", cred.user.uid), {
          ...base,
          subjects: [],
        });
        alert("Teacher created!");
      } else {
        await setDoc(doc(db, "students", cred.user.uid), base);
        alert("Student created!");
      }

      navigate("/dashboard");
    } catch (err: any) {
      alert(err.message);
    }
  };

  /* ---------- GOOGLE (admin code still required for teacher) ---------- */
  const handleGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const u = res.user;

      if (userType === "teacher" && adminCode !== "mini-fcmb") {
        alert("Invalid Admin Code for Teacher!");
        return;
      }

      const base = {
        fullName: u.displayName ?? fullName,
        email: u.email ?? email,
        phone: u.phoneNumber ?? phone,
        className,
        createdAt: serverTimestamp(),
      };

      if (userType === "teacher") {
        await setDoc(doc(db, "teachers", u.uid), { ...base, subjects: [] });
        alert("Teacher – Google");
      } else {
        await setDoc(doc(db, "students", u.uid), base);
        alert("Student – Google");
      }

      navigate("/dashboard");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
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
            Sign up
          </button>
          <button
            className={`tab ${userType === "student" ? "active" : ""}`}
            onClick={() => setUserType("student")}
          >
            Sign in
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
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              required
            />
          )}

          <button type="submit" className="create-btn">
            Create an account
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
          By creating an account, you agree to our{" "}
          <a href="#">Terms & Service</a>
        </p>
      </div>
    </div>
  );
}
