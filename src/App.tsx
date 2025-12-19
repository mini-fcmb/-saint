// src/App.tsx
"use client";

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/signup";
import Login from "./pages/login";
import TeacherDashboard from "./pages/teachers";
import StudentDashboard from "./pages/students";
import AdminDashboard from "./pages/admin"; // <-- import admin dashboard
import QuizDashboard from "./pages/quiz";
import QuizSubjects from "./pages/QuizSubject";
import QuizResults from "./pages/QuizResults";
import LoadingOverlay from "./components/LoadingOverlay";
import { useLoading } from "./hooks/useLoading";
import { useFirebaseStore } from "./stores/useFirebaseStore";

function useRouteLoading() {
  const location = useLocation();
  const { setLoading } = useLoading();

  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [location.pathname, setLoading]);
}

// General private route for teachers/students
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebaseStore();

  if (loading) return <LoadingOverlay />;

  if (!user) return <Navigate to="/login" replace />;

  if (!user.emailVerified) {
    alert("Please verify your email first.");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin-specific route
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, userData } = useFirebaseStore();

  if (loading) return <LoadingOverlay />;

  if (!user) return <Navigate to="/login" replace />;

  // Allow admin to skip email verification
  const isAdmin = user.email === "minibossfcmb@proton.me";
  if (!user.emailVerified && !isAdmin) {
    alert("Please verify your email first.");
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    alert("Access denied. Admins only.");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useFirebaseStore();

  if (loading) return <LoadingOverlay />;

  if (!user) return <Navigate to="/login" replace />;

  if (!user.emailVerified) {
    alert("Please verify your email first.");
    return <Navigate to="/login" replace />;
  }

  if (userData?.role !== "student") {
    alert("Access denied. This page is for students only.");
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function SmartRedirect() {
  const { user, userData } = useFirebaseStore();

  if (!user || !user.emailVerified) return <Navigate to="/login" replace />;

  if (userData?.role === "teacher") return <Navigate to="/teachers" replace />;
  if (userData?.role === "student") return <Navigate to="/students" replace />;

  // Fallback
  return <Navigate to="/login" replace />;
}

export default function App() {
  useRouteLoading();

  const initializeAuth = useFirebaseStore((state) => state.initializeAuth);

  React.useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return (
    <>
      <LoadingOverlay />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Dashboards */}
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
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Quiz Routes */}
        <Route
          path="/quiz-subjects"
          element={
            <StudentRoute>
              <QuizSubjects />
            </StudentRoute>
          }
        />
        <Route
          path="/quiz/:subjectId"
          element={
            <StudentRoute>
              <QuizDashboard />
            </StudentRoute>
          }
        />
        <Route
          path="/quiz/:subjectId/results"
          element={
            <StudentRoute>
              <QuizResults />
            </StudentRoute>
          }
        />
        <Route
          path="/quiz"
          element={<Navigate to="/quiz-subjects" replace />}
        />

        <Route path="/dashboard" element={<SmartRedirect />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
