// src/App.tsx - FIXED VERSION
"use client";

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
//import Home from "./pages/Home";
import Signup from "./pages/GetStarted Page/page";
import Login from "./pages/Login Page/page";
import TeacherDashboard from "./pages/Teachers Dashboard/page";
import StudentDashboard from "./pages/Student Dashboard/page";
import AdminDashboard from "./pages/Admin Dashboard/page";
import QuizDashboard from "./pages/Quizes/quiz";
import QuizSubjects from "./pages/Quizes/QuizSubject";
import QuizResults from "./pages/Quizes/QuizResults";
//import LoadingOverlay from "./components/LoadingOverlay";
//import { useLoading } from "./hooks/useLoading";
import { useFirebaseStore } from "./stores/useFirebaseStore";
import Homepage from "./pages/landing  page/page";
/*function useRouteLoading() {
  const location = useLocation();
  const { setLoading } = useLoading();

  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [location.pathname, setLoading]);
}*/

// FIXED: AuthInitializer doesn't call unsubscribe
function AuthInitializer() {
  const initializeAuth = useFirebaseStore((state) => state.initializeAuth);

  React.useEffect(() => {
    console.log("🔄 AuthInitializer: Setting up auth");

    // Just call it - store handles the cleanup internally
    initializeAuth();

    // No cleanup needed here - the store manages its own listeners
    return () => {
      console.log("🧹 AuthInitializer: Component unmounting");
    };
  }, [initializeAuth]);

  return null;
}

// FIXED: PrivateRoute with better state management
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, userData } = useFirebaseStore();
  const [hasRedirected, setHasRedirected] = React.useState(false);

  // Reset redirected flag when user changes
  React.useEffect(() => {
    if (user) {
      setHasRedirected(false);
    }
  }, [user?.uid]);

  console.log("🔐 PrivateRoute:", {
    loading,
    hasUser: !!user,
    hasUserData: !!userData,
    userRole: userData?.role,
    userEmail: user?.email,
    hasRedirected,
  });

  // Show loading overlay ONLY during initial auth check
  if (loading && !user) {
    console.log("⏳ PrivateRoute: Initial auth loading");
    return; //<LoadingOverlay />;
  }

  // No user after loading is complete
  if (!loading && !user && !hasRedirected) {
    console.log("❌ PrivateRoute: No user, redirecting to login");
    setHasRedirected(true);
    return <Navigate to="/login" replace />;
  }

  // User exists but data is still loading
  if (user && !userData && !hasRedirected) {
    console.log("🔄 PrivateRoute: User exists, loading data...");
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Email verification check
  const isAdmin = user?.email === "minibossfcmb@proton.me";
  if (user && !user.emailVerified && !isAdmin) {
    console.log("📧 PrivateRoute: Email not verified");
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-yellow-50 rounded-lg border border-yellow-200 max-w-md">
          <h2 className="text-xl font-bold mb-4">
            Email Verification Required
          </h2>
          <p className="mb-4">
            Please check your email and verify your account to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            I've Verified My Email
          </button>
        </div>
      </div>
    );
  }

  console.log("✅ PrivateRoute: Rendering children");
  return <>{children}</>;
}

// FIXED: SmartRedirect with improved logic
function SmartRedirect() {
  const { user, userData, loading } = useFirebaseStore();
  const [attempts, setAttempts] = React.useState(0);

  console.log("🔄 SmartRedirect:", {
    loading,
    hasUser: !!user,
    userId: user?.uid,
    hasUserData: !!userData,
    userDataRole: userData?.role,
    attempts,
  });

  // Track redirect attempts to prevent loops
  React.useEffect(() => {
    if (!user && attempts < 3) {
      const timer = setTimeout(() => {
        setAttempts((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, attempts]);

  // Emergency stop after 3 attempts
  if (attempts >= 3) {
    console.log("🛑 SmartRedirect: Too many redirect attempts");
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200 max-w-md">
          <h2 className="text-xl font-bold mb-4 text-red-600">
            Redirect Error
          </h2>
          <p className="mb-4">
            Too many redirect attempts. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Initial loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Initializing...</p>
        </div>
      </div>
    );
  }

  // No user
  if (!user) {
    console.log("🔄 SmartRedirect: No user, going to login");
    return <Navigate to="/login" replace />;
  }

  // User exists, waiting for data
  if (!userData) {
    console.log("🔄 SmartRedirect: User exists, waiting for data");
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Redirect based on role
  console.log(`✅ SmartRedirect: User is ${userData.role}, redirecting`);

  if (userData.role === "teacher") {
    return <Navigate to="/teachers" replace />;
  }

  if (userData.role === "student") {
    return <Navigate to="/students" replace />;
  }

  // Admin check
  if (user.email === "minibossfcmb@proton.me") {
    return <Navigate to="/admin" replace />;
  }

  // Fallback - go home
  console.warn("⚠️ SmartRedirect: Unknown role, going home");
  return <Navigate to="/" replace />;
}

// FIXED: Admin-specific route
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useFirebaseStore();

  if (loading) return; //<LoadingOverlay />;

  if (!user) return <Navigate to="/login" replace />;

  if (user.email !== "minibossfcmb@proton.me") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200 max-w-md">
          <h2 className="text-xl font-bold mb-4">Access Denied</h2>
          <p>This area is for administrators only.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  /* const { isLoading } = useLoading();
  useRouteLoading();

  console.log("🎬 App component rendering, global loading:", isLoading);*/

  return (
    <>
      {/* Only show LoadingOverlay when route is changing */}
      {/*{isLoading &&
        {
          //<LoadingOverlay />
        }}*/}

      {/* Initialize auth once */}
      <AuthInitializer />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
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

        {/* Quiz routes would go here if needed */}

        {/* Smart redirect */}
        <Route path="/dashboard" element={<SmartRedirect />} />

        {/* Simple 404 */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">
                  404 - Page Not Found
                </h1>
                <a href="/" className="text-blue-500 hover:underline">
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}
