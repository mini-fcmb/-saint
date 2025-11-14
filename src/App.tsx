// src/App.tsx
import React from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigationType,
} from "react-router-dom";

import Home from "./pages/Home";
import Signup from "./pages/signup";
import SignIn from "./pages/login";
import LoadingOverlay from "./components/LoadingOverlay";
import { useLoading } from "./hooks/useLoading";
import StudentDashboard from "./pages/students";
import TeacherDashboard from "./pages/teachers";
import QuizDashboard from "./pages/quiz";

function useRouteLoading() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { setLoading } = useLoading();

  React.useEffect(() => {
    if (navigationType === "PUSH" || navigationType === "REPLACE") {
      setLoading(true);
    }
  }, [location.pathname, navigationType]);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);
}

export default function App() {
  useRouteLoading();

  return (
    <>
      <LoadingOverlay />
      <div style={{ position: "relative" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/students" element={<StudentDashboard />} />
          <Route path="/teachers" element={<TeacherDashboard />} />
          <Route path="/quiz" element={<QuizDashboard />} />
        </Routes>
      </div>
    </>
  );
}
