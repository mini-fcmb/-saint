"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Bell,
  Menu,
  Home,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  Settings,
  ChevronRight,
  ChevronLeft,
  Clock,
  Plus,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  X,
} from "lucide-react";
import logo from "../assets/logo.png";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/config";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  getDoc,
} from "firebase/firestore";

/* ------------------------------------------------------------------ */
/*  Helper hooks                                                      */
/* ------------------------------------------------------------------ */
function useLiveDate() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return { days, daysInMonth };
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type TeacherClass = { id: string; name: string };
type Student = {
  id: string;
  first: string;
  last: string;
  email: string;
  progress: number;
};

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export default function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [classListOpen, setClassListOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [myStudents, setMyStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);

  /* --------------------- AUTH LISTENER --------------------- */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  /* --------------------- FETCH TEACHER CLASSES & STUDENTS --------------------- */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get teacher's classes
        const classesRef = collection(db, "teachers", user.uid, "classes");
        const classSnap = await getDocs(classesRef);
        const classes: TeacherClass[] = classSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().name ?? d.id,
        }));
        setTeacherClasses(classes);

        if (classes.length === 0) {
          setMyStudents([]);
          setLoading(false);
          return;
        }

        // 2. Get class IDs
        const classIds = classes.map((c) => c.id);

        // 3. Get enrollments for those classes
        const enrollQ = query(
          collection(db, "enrollments"),
          where("classId", "in", classIds)
        );
        const enrollSnap = await getDocs(enrollQ);

        const studentIds = new Set<string>();
        enrollSnap.forEach((d) => studentIds.add(d.data().studentId));

        if (studentIds.size === 0) {
          setMyStudents([]);
          setLoading(false);
          return;
        }

        // 4. Get student docs
        const studentPromises = Array.from(studentIds).map((sid) =>
          getDoc(doc(db, "students", sid))
        );
        const studentSnaps = await Promise.all(studentPromises);
        const students: Student[] = studentSnaps
          .filter((s) => s.exists())
          .map((s) => {
            const data = s.data();
            return {
              id: s.id,
              first: data.first ?? "",
              last: data.last ?? "",
              email: data.email ?? "",
              progress: data.progress ?? 0,
            };
          });

        setMyStudents(students);
      } catch (err) {
        console.error("Error loading teacher data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const firstName = user?.displayName?.split(" ")[0] || "Teacher";
  const fullName = user?.displayName || "Teacher Name";
  const email = user?.email || "email@example.com";

  /* --------------------- LIVE DATE --------------------- */
  const now = useLiveDate();
  const todayStr = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dayStr = now.toLocaleString("en-US", { weekday: "long" });

  /* --------------------- CALENDAR --------------------- */
  const calYear = now.getFullYear();
  const calMonth = now.getMonth();
  const { days: calDays } = useCalendar(calYear, calMonth);
  const today = now.getDate();
  const examDates = useMemo(() => [7, 14, 21], []);

  /* --------------------- PROGRESS (based on real students) --------------------- */
  const progressPercent = myStudents.length
    ? Math.round(
        myStudents.reduce((a, s) => a + s.progress, 0) / myStudents.length
      )
    : 0;
  const dashArray = `${progressPercent} ${100 - progressPercent}`;

  /* --------------------- MENU --------------------- */
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "inbox", label: "Inbox", icon: MessageSquare },
    { id: "students", label: "Students", icon: Users },
    { id: "report", label: "Report", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  /* --------------------- STATIC DATA (unchanged) --------------------- */
  const workingHours = [
    { day: "Mon", hours: 8, online: true },
    { day: "Tue", hours: 6, online: true },
    { day: "Wed", hours: 7, online: true },
    { day: "Thu", hours: 5, online: true },
    { day: "Fri", hours: 4, online: true },
    { day: "Sat", hours: 0, online: false },
    { day: "Sun", hours: 0, online: false },
  ];

  const studentTests = [
    {
      id: 1,
      name: "Composition in web design",
      deadline: "June 07, 2022",
      student: "Marie Stephens",
      status: "Active",
    },
    {
      id: 2,
      name: "Responsive vs. Adaptive Design",
      deadline: "June 10, 2022",
      student: "Barbara Carter",
      status: "Active",
    },
    {
      id: 3,
      name: "Responsive vs. Adaptive Design",
      deadline: "June 10, 2022",
      student: "Daniel Evans",
      status: "Reviewed",
    },
    {
      id: 4,
      name: "8 point grid system in UX",
      deadline: "June 11, 2022",
      student: "Peta Robinson",
      status: "Not reviewed",
    },
  ];

  /* --------------------- UPCOMING CLASSES --------------------- */
  const upcomingClasses = teacherClasses.map((c, i) => ({
    id: i + 1,
    time: i % 2 === 0 ? "10:30" : "14:30",
    name: c.name,
    location: "June 06, Offline",
    status: "active",
  }));

  /* ------------------------------------------------------------------ */
  return (
    <div className="app">
      {/* ====================== HEADER ====================== */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img src={logo} alt="logo" className="logo-img" />
            <span className="logo-text">SXaint</span>
            <span className="status">Available for work</span>
            <button className="follow-btn">Follow</button>
          </div>

          <div className="header-actions">
            <button className="icon-btn">
              <Search size={20} />
            </button>
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <button className="icon-btn">
              <Menu size={20} />
            </button>
            <button className="get-in-touch">Get in touch</button>
          </div>
        </div>
      </header>

      <div className="layout">
        {/* ====================== SIDEBAR ====================== */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-toggle">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="toggle-btn"
            >
              {sidebarOpen ? (
                <ChevronLeft size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          </div>

          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedMenu(item.id)}
                  className={`nav-item ${
                    selectedMenu === item.id ? "active" : ""
                  }`}
                >
                  <div className="nav-icon">
                    <Icon size={20} />
                  </div>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div className="sidebar-footer">
              <div className="create-card">
                <div className="avatar-placeholder"></div>
                <button className="create-chat-btn">
                  <Plus size={18} /> Create new class chat now
                </button>
                <button className="create-class-link">Create class</button>
              </div>
              <div className="copyright">© Atwood School</div>
            </div>
          )}
        </aside>

        {/* ====================== MAIN CONTENT ====================== */}
        <main className="main-content">
          {/* Welcome */}
          <div className="welcome">
            <h1>Welcome back, {firstName}</h1>
            <p>
              {dayStr} • {todayStr} • {timeStr}
            </p>
          </div>

          {/* Progress Card */}
          <div className="progress-card">
            <div className="progress-ring">
              <svg viewBox="0 0 36 36" className="ring-svg">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="white"
                  strokeWidth="3.5"
                  strokeDasharray={dashArray}
                />
              </svg>
              <div className="ring-text">{progressPercent}%</div>
            </div>
            <div>
              <h2>Your students average progress is {progressPercent}%</h2>
              <p>Level up your students to improve your teacher rank!</p>
            </div>
          </div>

          {/* TOP GRID */}
          <div className="top-grid">
            {/* Working Hours */}
            <div className="card working-hours">
              <div className="card-header">
                <h3>Working Hours</h3>
                <span>01 - 08 June 2022</span>
              </div>
              <div className="bar-chart">
                {workingHours.map((d, i) => (
                  <div key={i} className="bar-item">
                    <div
                      className="bar"
                      style={{
                        height: `${d.hours * 17.5}px`,
                        backgroundColor: d.hours > 0 ? "#10b981" : "#e5e7eb",
                      }}
                    ></div>
                    <span>{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="total">
                Total <strong>38h 15m</strong>
              </div>
              <div className="legend">
                <div>
                  <div className="dot online"></div> Online
                </div>
                <div>
                  <div className="dot offline"></div> Offline
                </div>
              </div>
            </div>

            {/* My Students – Firebase data */}
            <ClassListPanel
              students={myStudents}
              isOpen={classListOpen}
              toggle={() => setClassListOpen((v) => !v)}
              loading={loading}
            />

            {/* Calendar */}
            <div className="card calendar">
              <div className="card-header">
                <span>
                  {now.toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <div className="nav-buttons">
                  <button>
                    <ChevronLeft size={18} />
                  </button>
                  <button>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="calendar-grid">
                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div key={d} className="day-header">
                    {d}
                  </div>
                ))}
                {calDays.map((day, i) => {
                  if (day === null)
                    return <div key={i} className="calendar-day" />;
                  const isToday = day === today;
                  const isExam = examDates.includes(day);
                  return (
                    <div
                      key={i}
                      className={`calendar-day ${isToday ? "today" : ""} ${
                        isExam ? "exam" : ""
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM GRID */}
          <div className="bottom-grid">
            {/* Student Tests */}
            <div className="card student-tests">
              <div className="card-header">
                <h3>Student tests</h3>
                <a href="#" className="view-all">
                  All tests
                </a>
              </div>
              <div className="test-list">
                {studentTests.map((t) => (
                  <div key={t.id} className="test-item">
                    <div className="test-icon">
                      <FileText size={24} />
                    </div>
                    <div className="test-info">
                      <h4>{t.name}</h4>
                      <div className="test-meta">
                        <span>
                          <Clock size={16} /> Deadline {t.deadline}
                        </span>
                        <span>
                          <Users size={16} /> {t.student}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`status ${t.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {t.status === "Active" && (
                        <CheckCircle size={22} color="#10b981" />
                      )}
                      {t.status === "Reviewed" && (
                        <CheckCircle size={22} color="#f59e0b" />
                      )}
                      {t.status === "Not reviewed" && (
                        <AlertCircle size={22} color="#ef4444" />
                      )}
                      <span>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Classes */}
            <div className="card upcoming-classes">
              <div className="card-header">
                <h3>Upcoming Classes</h3>
                <a href="#" className="view-all">
                  View all
                </a>
              </div>
              <div className="class-list">
                {upcomingClasses.map((c) => (
                  <div key={c.id} className="class-item">
                    <div className={`class-status ${c.status}`}>
                      {c.status === "active" ? (
                        <CheckCircle size={24} />
                      ) : (
                        <Clock size={24} />
                      )}
                    </div>
                    <div>
                      <h4>
                        {c.time} {c.name}
                      </h4>
                      <p>{c.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* ====================== PROFILE CARD ====================== */}
        <div className="profile-card">
          <div className="profile-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h4>{fullName}</h4>
            <p>{email}</p>
            <div className="stats">
              <div>
                <strong>Rank 14</strong> / 100
              </div>
              <div>
                <strong>Classes: {teacherClasses.length}</strong>
              </div>
            </div>
          </div>
          <button className="profile-arrow">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* ====================== CSS (unchanged) ====================== */}
      <style jsx>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html,
        body {
          width: 100%;
          overflow-x: hidden;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
          background: #f9fafb;
          background-image: radial-gradient(
            circle at 1px 1px,
            #e5e7eb 1px,
            transparent 0
          );
          background-size: 40px 40px;
          min-height: 100vh;
        }
        .app {
          position: relative;
        }
        .layout {
          display: flex;
          margin-top: 80px;
        }
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          padding: 0 48px;
          display: flex;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          z-index: 50;
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: center;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .logo-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: contain;
        }
        .logo-text {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.5px;
        }
        .status {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
        .follow-btn {
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 13px;
          color: #374151;
          font-weight: 500;
        }
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .icon-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f3f4f6;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }
        .get-in-touch {
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 0 24px;
          height: 44px;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sidebar {
          width: 320px;
          background: #fff;
          border-right: 1px solid #e5e7eb;
          height: calc(100vh - 80px);
          position: fixed;
          left: 0;
          top: 80px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 40px 0;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
          z-index: 40;
        }
        .sidebar:not(.open) {
          width: 88px;
        }
        .sidebar-toggle {
          padding: 0 32px;
          margin-bottom: 40px;
        }
        .toggle-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #f3f4f6;
          border: none;
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }
        .sidebar-nav {
          padding: 0 24px;
        }
        .nav-item {
          width: 100%;
          padding: 16px 20px;
          margin-bottom: 8px;
          border-radius: 16px;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          gap: 16px;
          color: #6b7280;
          font-size: 15px;
          font-weight: 500;
          transition: 0.2s;
        }
        .nav-item span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nav-item.active,
        .nav-item:hover {
          background: #eef2ff;
          color: #4f46e5;
          font-weight: 600;
        }
        .nav-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-footer {
          position: absolute;
          bottom: 40px;
          left: 32px;
          right: 32px;
        }
        .create-card {
          background: #eef2ff;
          border-radius: 24px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .avatar-placeholder {
          width: 96px;
          height: 96px;
          background: #c7d2fe;
          border-radius: 50%;
        }
        .create-chat-btn {
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 16px;
          padding: 14px 20px;
          font-size: 15px;
          font-weight: 600;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
        }
        .create-class-link {
          background: transparent;
          color: #4f46e5;
          border: none;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .copyright {
          margin-top: 24px;
          font-size: 13px;
          color: #9ca3af;
          text-align: center;
        }
        .main-content {
          margin-left: 320px;
          padding: 48px;
          flex: 1;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar:not(.open) ~ .main-content {
          margin-left: 88px;
        }
        .welcome h1 {
          font-size: 36px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px;
        }
        .welcome p {
          font-size: 18px;
          color: #6b7280;
          margin: 0;
        }
        .progress-card {
          background: #4f46e5;
          border-radius: 24px;
          padding: 15px;
          margin: 40px 0;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 32px;
          box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3),
            0 4px 6px -2px rgba(79, 70, 229, 0.2);
          max-width: 800px;
        }
        .progress-ring {
          width: 140px;
          height: 140px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .ring-svg {
          transform: rotate(-90deg);
          width: 100px;
          height: 100px;
        }
        .ring-text {
          position: absolute;
          font-size: 24px;
          font-weight: 700;
        }
        .progress-card h2 {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 12px;
        }
        .progress-card p {
          font-size: 18px;
          margin: 0;
          opacity: 0.95;
        }
        .top-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr;
          gap: 32px;
          margin-bottom: 40px;
        }
        .bottom-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
        }
        .card {
          background: #fff;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        .card-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .view-all {
          font-size: 15px;
          color: #4f46e5;
          text-decoration: none;
          font-weight: 600;
        }
        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          height: 140px;
          margin-top: 80px;
        }
        .bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .bar {
          width: 40%;
          border-radius: 6px;
          background: #10b981;
          transition: height 0.3s;
        }
        .total {
          font-size: 14px;
          color: #6b7280;
          margin-top: 12px;
        }
        .legend {
          display: flex;
          gap: 24px;
          font-size: 13px;
          color: #6b7280;
          margin-top: 8px;
        }
        .dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
        }
        .dot.online {
          background: #10b981;
        }
        .dot.offline {
          background: #e5e7eb;
        }
        .test-list,
        .class-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .test-item,
        .class-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .test-icon,
        .class-status {
          width: 56px;
          height: 56px;
          background: #f3f4f6;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }
        .test-info {
          flex: 1;
        }
        .test-info h4,
        .class-item h4 {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px;
        }
        .test-meta,
        .class-item p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
        .status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 600;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
        }
        .day-header {
          text-align: center;
          font-size: 13px;
          color: #9ca3af;
          font-weight: 600;
        }
        .calendar-day {
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .calendar-day.today {
          background: #4f46e5;
          color: #fff;
          font-weight: 700;
        }
        .calendar-day.exam {
          background: #e5e7eb;
          color: #6b7280;
          font-weight: 600;
        }
        .calendar-day.today.exam {
          background: #4f46e5;
          color: #fff;
        }
        .profile-card {
          position: fixed;
          top: 100px;
          right: 48px;
          width: 320px;
          background: #fff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 20px;
          z-index: 40;
        }
        .profile-avatar {
          width: 72px;
          height: 72px;
          background: #e0e7ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
          color: #4f46e5;
        }
        .profile-info h4 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 6px;
        }
        .profile-info p {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 12px;
        }
        .stats {
          display: flex;
          gap: 24px;
          font-size: 14px;
        }
        .stats strong {
          color: #111827;
          font-weight: 700;
        }
        .profile-arrow {
          background: none;
          border: none;
          cursor: pointer;
        }

        /* ClassListPanel */
        .class-list-collapsed {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          cursor: pointer;
        }
        .initial-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #eef2ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
        }
        .class-list-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .class-list-modal-content {
          background: #fff;
          border-radius: 24px;
          padding: 32px;
          max-width: 560px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
        }
        .student-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .student-row:last-child {
          border-bottom: none;
        }
        .student-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #c7d2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #4f46e5;
        }
        .empty-state {
          text-align: center;
          color: #9ca3af;
          padding: 20px 0;
        }

        /* Responsive (unchanged) */
        @media (min-width: 1400px) {
          .sidebar {
            width: 340px;
          }
          .main-content {
            margin-left: 340px;
          }
        }
        @media (max-width: 1399px) {
          .header {
            padding: 0 32px;
          }
          .main-content {
            padding: 32px;
          }
          .sidebar {
            width: 280px;
          }
          .sidebar:not(.open) {
            width: 80px;
          }
          .main-content {
            margin-left: 280px;
          }
          .sidebar:not(.open) ~ .main-content {
            margin-left: 80px;
          }
          .top-grid {
            grid-template-columns: 1fr 1.3fr 1fr;
            gap: 24px;
          }
        }
        @media (max-width: 1199px) {
          .top-grid {
            grid-template-columns: 1fr 1fr;
          }
          .bottom-grid {
            grid-template-columns: 1fr;
          }
          .progress-card {
            max-width: 100%;
          }
          .profile-card {
            width: 280px;
            right: 32px;
            top: 90px;
          }
        }
        @media (max-width: 991px) {
          .header {
            padding: 0 24px;
          }
          .main-content {
            padding: 24px;
            margin-left: 80px !important;
          }
          .sidebar {
            width: 80px;
            padding: 16px 0;
          }
          .sidebar.open {
            width: 100%;
          }
          .welcome h1 {
            font-size: 28px;
          }
          .progress-card {
            flex-direction: column;
            text-align: center;
            gap: 16px;
            padding: 24px;
          }
          .progress-ring {
            width: 120px;
            height: 120px;
          }
          .ring-svg {
            width: 80px;
            height: 80px;
          }
          .top-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .profile-card {
            position: relative;
            top: 0;
            right: 0;
            width: 100%;
            margin: 24px 0;
          }
        }
        @media (max-width: 767 Cortes) {
          .header {
            height: 70px;
            padding: 0 12px;
          }
          .header-actions {
            gap: 6px;
          }
          .icon-btn {
            width: 38px;
            height: 38px;
          }
          .get-in-touch,
          .status,
          .follow-btn {
            display: none;
          }
          .logo-text {
            font-size: 20px;
          }
          .sidebar {
            width: 100%;
            height: 60px;
            bottom: 0;
            top: auto;
            left: 0;
            right: 0;
            position: fixed;
            padding: 0;
            display: flex;
            justify-content: space-around;
            align-items: center;
            background: #fff;
            border-top: 1px solid #e5e7eb;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
            z-index: 100;
          }
          .sidebar.open {
            height: auto;
            top: 70px;
            bottom: auto;
          }
          .sidebar-toggle,
          .sidebar-footer,
          .sidebar-nav > * > span {
            display: none;
          }
          .sidebar-nav {
            display: flex;
            width: 100%;
            padding: 0;
          }
          .nav-item {
            flex: 1;
            justify-content: center;
            padding: 0;
            font-size: 0;
            position: relative;
          }
          .nav-icon {
            width: 48px;
            height: 48px;
          }
          .nav-item.active::after {
            content: "";
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            background: #4f46e5;
            border-radius: 50%;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 12px 12px 72px 12px;
            min-height: calc(100vh - 70px - 60px);
          }
          .welcome h1 {
            font-size: 22px;
          }
          .welcome p {
            font-size: 15px;
          }
          .progress-card {
            flex-direction: column;
            text-align: center;
            gap: 12px;
            padding: 16px;
            margin: 24px 0;
          }
          .progress-ring {
            width: 90px;
            height: 90px;
          }
          .ring-svg {
            width: 65px;
            height: 65px;
          }
          .ring-text {
            font-size: 18px;
          }
          .progress-card h2 {
            font-size: 20px;
          }
          .progress-card p {
            font-size: 14px;
          }
          .top-grid,
          .bottom-grid {
            gap: 16px;
          }
          .top-grid {
            grid-template-columns: 1fr;
          }
          .bottom-grid {
            grid-template-columns: 1fr;
          }
          .card {
            padding: 12px;
          }
          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            margin-bottom: 16px;
          }
          .card-header h3 {
            font-size: 17px;
          }
          .view-all {
            font-size: 14px;
          }
          .bar-chart {
            height: 90px;
            gap: 8px;
            margin-top: 40px;
          }
          .bar {
            width: 50%;
          }
          .test-item,
          .class-item {
            gap: 10px;
          }
          .test-icon,
          .class-status {
            width: 44px;
            height: 44px;
          }
          .test-info h4,
          .class-item h4 {
            font-size: 14px;
          }
          .test-meta,
          .class-item p {
            font-size: 13px;
          }
          .calendar-day {
            height: 32px;
            font-size: 12px;
          }
          .profile-card {
            display: none;
          }
        }
        @media (max-width: 575px) {
          .header {
            padding: 0 8px;
          }
          .icon-btn {
            width: 36px;
            height: 36px;
          }
          .main-content {
            padding: 10px 10px 70px 10px;
          }
          .progress-card {
            padding: 12px;
          }
          .card {
            padding: 10px;
          }
          .bar-chart {
            height: 70px;
          }
          .test-icon,
          .class-status {
            width: 40px;
            height: 40px;
          }
          .test-info h4,
          .class-item h4 {
            font-size: 13px;
          }
          .test-meta,
          .class-item p {
            font-size: 12px;
          }
          .calendar-day {
            height: 28px;
            font-size: 11px;
          }
        }
        .bx-expand-right {
          color: black;
        }
        .bx-expand-left {
          color: black;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ClassListPanel (now with loading & empty states)                  */
/* ------------------------------------------------------------------ */
type ClassListPanelProps = {
  students: Student[];
  isOpen: boolean;
  toggle: () => void;
  loading: boolean;
};

function ClassListPanel({
  students,
  isOpen,
  toggle,
  loading,
}: ClassListPanelProps) {
  return (
    <div className="card group-chats">
      <div className="card-header">
        <h3>My Students ({students.length})</h3>
        <button onClick={toggle} className="view-all">
          {isOpen ? (
            <i className="bxr  bx-expand-right"></i>
          ) : (
            <i className="bxr  bx-expand-left" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading students…</div>
      ) : !isOpen ? (
        <div className="class-list-collapsed" onClick={toggle}>
          {students.slice(0, 12).map((s) => (
            <div key={s.id} className="initial-circle">
              {s.first[0]}
              {s.last[0]}
            </div>
          ))}
          {students.length > 12 && (
            <div className="initial-circle">+{students.length - 12}</div>
          )}
          {students.length === 0 && <div className="initial-circle">—</div>}
        </div>
      ) : (
        <div className="class-list-modal" onClick={toggle}>
          <div
            className="class-list-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>My Students ({students.length})</h3>
              <button className="modal-close" onClick={toggle}>
                <X size={20} />
              </button>
            </div>

            {students.length === 0 ? (
              <div className="empty-state">
                No students have signed up for your classes yet.
              </div>
            ) : (
              students.map((s) => (
                <div key={s.id} className="student-row">
                  <div className="student-avatar">
                    {s.first[0]}
                    {s.last[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div>
                      <strong>
                        {s.first} {s.last}
                      </strong>
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      {s.email}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: "#4f46e5" }}>
                    {s.progress}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
