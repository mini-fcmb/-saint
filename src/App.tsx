// src/App.tsx
"use client";

import React, { useEffect } from "react";
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

const ADMIN_EMAIL = "minibossfcmb@proton.me";

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
// PRIVATE ROUTES - UPDATED
// --------------------------
function PrivateRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "teacher" | "student" | "admin";
}) {
  const { user, authInitialized, userData, loading } = useFirebaseStore();

  // If auth isn't initialized yet, show loading
  if (!authInitialized || loading) {
    return <LoadingOverlay />;
  }

  // No user? Redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If userData isn't loaded yet (should be quick after auth)
  if (!userData) {
    return <LoadingOverlay />;
  }

  // Check email verification for non-admin users
  const isAdminUser = user.email === ADMIN_EMAIL;
  if (!user.emailVerified && !isAdminUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole) {
    if (requiredRole === "admin" && !isAdminUser) {
      return <Navigate to="/login" replace />;
    }
    if (requiredRole === "teacher" && userData.role !== "teacher") {
      return <Navigate to="/login" replace />;
    }
    if (requiredRole === "student" && userData.role !== "student") {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

// --------------------------
// SMART REDIRECT - UPDATED
// --------------------------
function SmartRedirect() {
  const { user, authInitialized, userData, loading } = useFirebaseStore();

  // Wait for auth to initialize
  if (!authInitialized || loading) {
    return <LoadingOverlay />;
  }

  // No user? Go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If userData isn't loaded yet
  if (!userData) {
    return <LoadingOverlay />;
  }

  // Check email verification for non-admin users
  const isAdminUser = user.email === ADMIN_EMAIL;
  if (!user.emailVerified && !isAdminUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role/admin status
  if (isAdminUser) {
    return <Navigate to="/admin" replace />;
  }

  if (userData.role === "teacher") {
    return <Navigate to="/teachers" replace />;
  }

  if (userData.role === "student") {
    return <Navigate to="/students" replace />;
  }

  // Fallback to login
  return <Navigate to="/login" replace />;
}

// --------------------------
// PUBLIC ONLY ROUTE
// --------------------------
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, authInitialized, loading } = useFirebaseStore();

  // Wait for auth to initialize
  if (!authInitialized || loading) {
    return <LoadingOverlay />;
  }

  // If user is already logged in, redirect to appropriate dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// --------------------------
// MAIN APP - FIXED
// --------------------------
export default function App() {
  const location = useLocation();
  useRouteLoading();

  const initializeAuth = useFirebaseStore((state) => state.initializeAuth);
  const { authInitialized, loading: storeLoading } = useFirebaseStore();
  const { setLoading } = useLoading();

  // Initialize auth ONCE when app starts
  useEffect(() => {
    console.log("App: Initializing auth...");
    const cleanup = initializeAuth();

    return () => {
      console.log("App: Cleaning up auth...");
      cleanup();
    };
  }, [initializeAuth]);

  // Show loading overlay while store is loading AND auth isn't initialized
  // This prevents flash of login page when user is actually logged in
  if (!authInitialized || storeLoading) {
    return <LoadingOverlay />;
  }

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicOnlyRoute>
              <Home />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        {/* Protected dashboard routes */}
        <Route
          path="/teachers"
          element={
            <PrivateRoute requiredRole="teacher">
              <TeacherDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/students"
          element={
            <PrivateRoute requiredRole="student">
              <StudentDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute requiredRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Protected quiz routes */}
        <Route
          path="/quiz-subjects"
          element={
            <PrivateRoute requiredRole="student">
              <QuizSubjects />
            </PrivateRoute>
          }
        />
        <Route
          path="/quiz/:subjectId"
          element={
            <PrivateRoute requiredRole="student">
              <QuizDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/quiz/:subjectId/results"
          element={
            <PrivateRoute requiredRole="student">
              <QuizResults />
            </PrivateRoute>
          }
        />
        <Route
          path="/quiz"
          element={<Navigate to="/quiz-subjects" replace />}
        />

        {/* Smart redirect routes */}
        <Route path="/dashboard" element={<SmartRedirect />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
