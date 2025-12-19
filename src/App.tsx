// src/App.tsx
"use client";

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/signup";
import Login from "./pages/login";
import TeacherDashboard from "./pages/teachers";
import StudentDashboard from "./pages/students";
import AdminDashboard from "./pages/admin";
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

// --------------------------
// PRIVATE ROUTES
// --------------------------
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, authInitialized, userData, loading } = useFirebaseStore();

  // Wait until auth + userData fully loaded
  if (!authInitialized || !userData || loading) return <LoadingOverlay />;

  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, authInitialized, userData, loading } = useFirebaseStore();

  if (!authInitialized || !userData || loading) return <LoadingOverlay />;

  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user.email === "minibossfcmb@proton.me";
  if (!user.emailVerified && !isAdmin) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { user, authInitialized, userData, loading } = useFirebaseStore();

  if (!authInitialized || !userData || loading) return <LoadingOverlay />;

  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/login" replace />;

  if (userData.role !== "student") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

// --------------------------
// SMART REDIRECT
// --------------------------
function SmartRedirect() {
  const { user, authInitialized, userData, loading } = useFirebaseStore();

  if (!authInitialized || !userData || loading) return <LoadingOverlay />;

  if (!user || !user.emailVerified) return <Navigate to="/login" replace />;

  if (userData.role === "teacher") return <Navigate to="/teachers" replace />;
  if (userData.role === "student") return <Navigate to="/students" replace />;

  return <Navigate to="/login" replace />;
}

// --------------------------
// MAIN APP
// --------------------------
export default function App() {
  useRouteLoading();

  const initializeAuth = useFirebaseStore((state) => state.initializeAuth);
  const { authInitialized, loading } = useFirebaseStore();

  React.useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  // Wait until Firebase auth is initialized before rendering Routes
  if (!authInitialized) return <LoadingOverlay />;

  return (
    <>
      {loading && <LoadingOverlay />}
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
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
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
