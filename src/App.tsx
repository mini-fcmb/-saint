// src/App.tsx
import React from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import Signup from "./pages/signup";
import SignIn from "./pages/login";
import LoadingOverlay from "./components/LoadingOverlay";
import { useLoading } from "./hooks/useLoading";
import StudentDashboard from "./pages/students";
import TeacherDashboard from "./pages/teachers";

// Hook to show loader on route change
function useRouteLoading() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const { setLoading } = useLoading();

  React.useEffect(() => {
    if (navigationType === "PUSH" || navigationType === "REPLACE") {
      setLoading(true);
    }
  }, [location.pathname, navigationType, setLoading]);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, [location.pathname, setLoading]);
}

export default function App() {
  useRouteLoading();

  return (
    <>
      <LoadingOverlay />
      <Routes>
        {/*<Route path="/" element={<Signup />} />
        <Route path="/login" element={<SignIn />} />*/}
        <Route path="/" element={<TeacherDashboard />} />
      </Routes>
    </>
  );
}
