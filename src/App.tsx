// src/App.tsx
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/signup";
import Login from "./pages/login";
import TeacherDashboard from "./pages/teachers";
import StudentDashboard from "./pages/students";
import QuizDashboard from "./pages/quiz";
import LoadingOverlay from "./components/LoadingOverlay";
import { useLoading } from "./hooks/useLoading";
import { useAuth } from "./hooks/useAuth";

function useRouteLoading() {
  const location = useLocation();
  const { setLoading } = useLoading();

  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [location.pathname, setLoading]);
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingOverlay />;

  if (!user) return <Navigate to="/login" replace />;

  if (!user.emailVerified) {
    alert("Please verify your email first.");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function SmartRedirect() {
  const { user } = useAuth();
  if (!user || !user.emailVerified) return <Navigate to="/login" replace />;

  // Let FirebaseStore decide — but for now, redirect to teachers
  return <Navigate to="/teachers" replace />;
}

export default function App() {
  useRouteLoading();

  return (
    <>
      <LoadingOverlay />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />{" "}
        {/* FIXED: was /signupní */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/teachers"
          element={
            <PrivateRoute>
              <TeacherDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/students"
          element={
            <PrivateRoute>
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route path="/quiz" element={<QuizDashboard />} />
        <Route path="/dashboard" element={<SmartRedirect />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
