import React, { useEffect, useState } from "react";
import {
  Search,
  Bell,
  Menu,
  Home,
  BookOpen,
  BarChart3,
  Users,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle,
  X,
  TrendingUp,
  MessageSquare,
  Clipboard,
  Rocket,
  Target,
  LogOut,
  Zap,
  FileText,
  HelpCircle,
  Upload,
  Coffee,
  Video,
  BarChart,
} from "lucide-react";
import logo from "../assets/logo.png";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import { useNavigate } from "react-router-dom";

// Define proper TypeScript interfaces
interface UserInfo {
  fullName: string;
  firstName: string;
  userInitial: string;
  email: string;
}

interface StudentData {
  id: string;
  first: string;
  last: string;
  email: string;
  progress: number;
  className: string;
  enrollmentNo: string;
  course: string;
  session: string;
  semester: string;
}

const StudentDashboard: React.FC = () => {
  // State declarations
  const [activeTab, setActiveTab] = useState<"assignments" | "exam">(
    "assignments"
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showLoading, setShowLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: "Loading...",
    firstName: "Loading...",
    userInitial: "L",
    email: "loading...",
  });

  const { user, userData, signOutUser, loading } = useFirebaseStore();
  const navigate = useNavigate();

  // Handle user data loading properly
  useEffect(() => {
    console.log("Firebase Store State:", { user, userData, loading });

    // Stop if still loading
    if (loading) return;

    // Handle user not logged in or no data found
    if (!user) {
      setUserInfo({
        fullName: "Unknown User",
        firstName: "Unknown",
        userInitial: "U",
        email: "No email",
      });
      setShowLoading(false);
      return;
    }

    // Handle proper user and data
    const fullName = userData?.fullName || user.displayName || "Student";
    const firstName = fullName.split(" ")[0];
    const userInitial = firstName.charAt(0).toUpperCase();
    const email = userData?.email || user.email || "student@email.com";

    setUserInfo({
      fullName,
      firstName,
      userInitial,
      email,
    });

    setShowLoading(false);
  }, [userData, user, loading]);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = document.getElementById("lineChart") as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: w, height: h } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Set styles
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#5a67d8";
    ctx.lineCap = "round";

    // Draw line
    ctx.beginPath();
    ctx.moveTo(30, 90);
    ctx.bezierCurveTo(80, 60, 130, 70, 180, 50);
    ctx.bezierCurveTo(230, 30, 280, 80, 330, 65);
    ctx.bezierCurveTo(380, 50, 430, 85, w - 30, 75);
    ctx.stroke();
  }, []);

  // Student data - only use fields that exist in UserData
  const currentStudent: StudentData = {
    id: user?.uid || "",
    first: userInfo.firstName,
    last: userInfo.fullName.split(" ").slice(1).join(" ") || "",
    email: userInfo.email,
    progress: 0,
    className: userData?.className || "Not assigned",
    enrollmentNo: userData?.enrollmentNo || "A231231231",
    course: userData?.course || "Computer Science",
    session: userData?.session || "2023 - 2024",
    semester: userData?.semester || "IV",
  };

  // Mock data
  const mockNotifications = [
    {
      id: "1",
      title: "Course Completed",
      message: "You've completed UI/UX Design Fundamentals!",
      time: "2 hours ago",
      isRead: false,
      type: "success",
    },
    {
      id: "2",
      title: "New Lesson",
      message: "New lesson available in React Native Masterclass",
      time: "5 hours ago",
      isRead: false,
      type: "info",
    },
  ];

  const stats = {
    totalCourses: 8,
    completedCourses: 3,
    inProgressCourses: 5,
    totalLearningTime: 45,
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const examSchedule = [
    {
      exam: "Mid-Term",
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15),
      time: "10:00 AM",
      room: "A-101",
    },
    {
      exam: "Final",
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 25),
      time: "09:00 AM",
      room: "B-205",
    },
  ].filter((exam) => exam.date.getMonth() === currentMonth.getMonth());

  const handleMarkAsRead = (notificationId: string) => {
    console.log("Mark as read:", notificationId);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const sidebarItems = [
    { icon: Home, label: "Dashboard" },
    { icon: BookOpen, label: "My Courses" },
    { icon: FileText, label: "Request" },
    { icon: HelpCircle, label: "Query" },
    { icon: Upload, label: "Project Submission" },
    { icon: Coffee, label: "Semester Break" },
    { icon: Users, label: "Connection" },
    { icon: Video, label: "Virtual Lab" },
    { icon: HelpCircle, label: "Exam FAQ" },
    { icon: BarChart, label: "Attendance" },
  ];

  // Show loading only if still loading and showLoading is true
  if (showLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={20} />
          </button>
          <div className="logo">
            <img src={logo} alt="SXaint Logo" />
            <span className="logo-text">SXaint</span>
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search courses, lessons, or instructors..."
            />
          </div>
        </div>

        <div className="header-right">
          <button
            className={`icon-btn notification-btn ${
              mockNotifications.some((n) => !n.isRead)
                ? "has-notifications"
                : ""
            }`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
          </button>

          <div className="user-profile">
            <div className="avatar">{userInfo.userInitial}</div>
            <div className="user-info">
              <span className="user-name">{userInfo.firstName}</span>
              <span className="user-role">Student</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Notifications Panel */}
        {showNotifications && (
          <div className="notifications-panel">
            <div className="notifications-header">
              <h3>Notifications</h3>
              <button
                className="close-btn"
                onClick={() => setShowNotifications(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="notifications-list">
              {mockNotifications.map((notification) => (
                <div key={notification.id} className="notification-item">
                  <div className="notification-icon">
                    <CheckCircle size={16} className="success" />
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {notification.time}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <button
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Profile Card with real user data */}
      {showProfileCard && (
        <div className="fixed-profile-card">
          <button
            className="profile-card-close"
            onClick={() => setShowProfileCard(false)}
          >
            <X size={16} />
          </button>
          <div className="profile-card-content">
            <div className="profile-header">
              <div className="profile-avatar-large">{userInfo.userInitial}</div>
              <div className="profile-info">
                <h4>{userInfo.fullName}</h4>
                <p>{userInfo.email}</p>
              </div>
            </div>
            <div className="profile-details">
              <div className="detail-item">
                <strong>Enrollment No:</strong>
                <span>{currentStudent.enrollmentNo}</span>
              </div>
              <div className="detail-item">
                <strong>Course:</strong>
                <span>{currentStudent.course}</span>
              </div>
              <div className="detail-item">
                <strong>Session:</strong>
                <span>{currentStudent.session}</span>
              </div>
              <div className="detail-item">
                <strong>Semester:</strong>
                <span>{currentStudent.semester}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <nav className="sidebar-nav">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  className={`nav-item ${
                    activeMenu === item.label.toLowerCase() ? "active" : ""
                  }`}
                  onClick={() => setActiveMenu(item.label.toLowerCase())}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div className="sidebar-footer">
              <div className="ai-assistant">
                <div className="ai-icon">
                  <Zap size={20} />
                </div>
                <div className="ai-content">
                  <h4>AI Assistant</h4>
                  <p>Get personalized help</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Welcome Section */}
          <section className="welcome-section">
            <div className="welcome-content">
              <h1>Welcome back, {userInfo.firstName}! 👋</h1>
              <p>Continue your learning journey and unlock new achievements</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon total-courses">
                  <BookOpen size={20} />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalCourses}</h3>
                  <p>Total Courses</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon completed">
                  <CheckCircle size={20} />
                </div>
                <div className="stat-content">
                  <h3>{stats.completedCourses}</h3>
                  <p>Completed</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon in-progress">
                  <TrendingUp size={20} />
                </div>
                <div className="stat-content">
                  <h3>{stats.inProgressCourses}</h3>
                  <p>In Progress</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon learning-time">
                  <Clock size={20} />
                </div>
                <div className="stat-content">
                  <h3>{stats.totalLearningTime}h</h3>
                  <p>Learning Time</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Action Tiles */}
          <section className="tiles-section">
            <div className="tiles">
              <div className="tile open">
                <MessageSquare size={28} />
                <span>Open Queries</span>
              </div>
              <div className="tile assign">
                <Clipboard size={28} />
                <span>Assignments</span>
              </div>
              <div className="tile proj">
                <Rocket size={28} />
                <span>Projects</span>
              </div>
              <div className="tile sport">
                <Target size={28} />
                <span>Sports</span>
              </div>
            </div>
          </section>

          {/* Chart and Progress Section */}
          <section className="top-row">
            <div className="chart-container">
              <h3>Student Progress</h3>
              <div className="chart-box">
                <canvas id="lineChart" width="460" height="130"></canvas>
                <div className="x-labels">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map(
                    (m) => (
                      <span key={m}>{m}</span>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="donuts-container">
              <div className="donut">
                <svg viewBox="0 0 36 36">
                  <path
                    className="bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="fill avg"
                    strokeDasharray="62,100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="pct">
                    62%
                  </text>
                </svg>
                <p>Average</p>
              </div>
              <div className="donut">
                <svg viewBox="0 0 36 36">
                  <path
                    className="bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="fill proj"
                    strokeDasharray="70,100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="pct">
                    70%
                  </text>
                </svg>
                <p>Project</p>
              </div>
            </div>

            <div className="empty-space"></div>
          </section>

          {/* Assignments and Calendar Section */}
          <section className="bottom-row">
            <div className="assignments-container">
              <div className="tab-header">
                <button
                  className={activeTab === "assignments" ? "active" : ""}
                  onClick={() => setActiveTab("assignments")}
                >
                  Assignments
                </button>
                <button
                  className={activeTab === "exam" ? "active" : ""}
                  onClick={() => setActiveTab("exam")}
                >
                  Exam Schedule
                </button>
              </div>

              <div className="tab-content">
                {activeTab === "assignments" ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Mathematics", "21.01.2020", "1.05.2020", "pending"],
                        [
                          "Fundamentals of C++",
                          "21.02.2020",
                          "1.06.2020",
                          "submitted",
                        ],
                        ["Java", "21.02.2020", "1.06.2020", "submitted"],
                        ["Html & Css", "21.02.2020", "1.06.2020", "pending"],
                        [
                          "Computer Applications",
                          "21.02.2020",
                          "1.06.2020",
                          "pending",
                        ],
                      ].map(([sub, start, end, status], i) => (
                        <tr key={i}>
                          <td>{sub}</td>
                          <td>{start}</td>
                          <td>{end}</td>
                          <td>
                            <span className={`status ${status}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Exam</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Room</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examSchedule.map((exam, index) => (
                        <tr key={index}>
                          <td>{exam.exam}</td>
                          <td>{exam.date.toLocaleDateString()}</td>
                          <td>{exam.time}</td>
                          <td>{exam.room}</td>
                        </tr>
                      ))}
                      {examSchedule.length === 0 && (
                        <tr>
                          <td colSpan={4} className="no-exams">
                            No exams scheduled for{" "}
                            {currentMonth.toLocaleDateString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="calendar-card">
              <div className="cal-head">
                <button onClick={() => navigateMonth("prev")}>
                  <ChevronLeft size={18} />
                </button>
                <span>
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button onClick={() => navigateMonth("next")}>
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="cal-grid">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="day-name">
                    {d}
                  </div>
                ))}
                {calendarDays.map((day, i) => {
                  const today = new Date();
                  const isToday =
                    day === today.getDate() &&
                    currentMonth.getMonth() === today.getMonth() &&
                    currentMonth.getFullYear() === today.getFullYear();
                  const hasExam = examSchedule.some(
                    (exam) => exam.date.getDate() === day
                  );

                  return (
                    <div
                      key={i}
                      className={`calendar-day ${!day ? "empty" : ""} ${
                        isToday ? "today" : ""
                      } ${hasExam ? "exam-day" : ""}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              <div className="event">
                Hacking Competition - {new Date().getDate()}th
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Support Widget */}
      <div className="support-widget">
        <div className="support-avatar">{userInfo.userInitial}</div>
        <div className="support-text">
          <p>Support 24/7</p>
          <p>Need help at any time</p>
        </div>
        <button className="call-btn">Call</button>
      </div>

      {/* CSS Styles */}
      <style>{`
        .student-dashboard {
          min-height: 100vh;
          background: #f0f4f8;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .dashboard-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 1000;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .sidebar-toggle {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sidebar-toggle:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 24px;
          color: #3b82f6;
        }

        .logo img {
          width: 36px;
          height: 36px;
          object-fit: contain;
          border-radius: 50%;
          display: block;
        }

        .header-center {
          flex: 1;
          max-width: 500px;
          margin: 0 40px;
        }

        .search-bar {
          position: relative;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
        }

        .search-bar:focus-within {
          background: white;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-bar input {
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
          width: 100%;
          color: #334155;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-btn {
          position: relative;
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .icon-btn:hover {
          background: #f1f5f9;
          color: #334155;
        }

        .notification-btn.has-notifications::after {
          content: "";
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .user-profile:hover {
          background: #f1f5f9;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .user-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .user-role {
          font-size: 12px;
          color: #64748b;
        }

        .logout-btn {
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
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background: #4338ca;
        }

        .fixed-profile-card {
          position: fixed;
          top: 90px;
          right: 32px;
          width: 320px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 999;
          border: 1px solid #e2e8f0;
          animation: slideInRight 0.5s ease;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .profile-card-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .profile-card-close:hover {
          background: #e2e8f0;
        }

        .profile-card-content {
          padding: 24px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .profile-avatar-large {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 20px;
        }

        .profile-info h4 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .profile-info p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-item strong {
          color: #374151;
          font-size: 14px;
        }

        .detail-item span {
          color: #6b7280;
          font-size: 14px;
        }

        .notifications-panel {
          position: absolute;
          top: 100%;
          right: 32px;
          width: 400px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 1001;
          animation: slideInDown 0.3s ease;
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .notifications-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .close-btn {
          background: none;
          border: none;
          padding: 4px;
          border-radius: 6px;
          color: #64748b;
          cursor: pointer;
        }

        .notifications-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s;
          cursor: pointer;
        }

        .notification-item:hover {
          background: #f8fafc;
        }

        .notification-icon .success {
          color: #10b981;
        }

        .notification-content {
          flex: 1;
        }

        .notification-content h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .notification-content p {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #64748b;
          line-height: 1.4;
        }

        .notification-time {
          font-size: 12px;
          color: #94a3b8;
        }

        .mark-read-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .dashboard-layout {
          display: flex;
          margin-top: 70px;
          min-height: calc(100vh - 70px);
        }

        .sidebar {
          width: 280px;
          background: white;
          border-right: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          position: fixed;
          left: 0;
          top: 70px;
          height: calc(100vh - 70px);
          z-index: 999;
        }

        .sidebar.closed {
          width: 80px;
        }

        .sidebar-nav {
          padding: 24px 0;
        }

        .nav-item {
          width: 100%;
          background: none;
          border: none;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
        }

        .nav-item:hover {
          background: #f8fafc;
          color: #334155;
        }

        .nav-item.active {
          background: #eff6ff;
          color: #3b82f6;
          border-right: 3px solid #3b82f6;
        }

        .sidebar-footer {
          padding: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .ai-assistant {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f0f9ff;
          border-radius: 12px;
          border: 1px solid #e0f2fe;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .ai-assistant:hover {
          background: #e0f2fe;
        }

        .ai-icon {
          width: 40px;
          height: 40px;
          background: #3b82f6;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .ai-content h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .ai-content p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }

        .main-content {
          flex: 1;
          margin-left: 280px;
          padding: 32px;
          transition: margin-left 0.3s ease;
          background: #f0f4f8;
        }

        .sidebar.closed ~ .main-content {
          margin-left: 80px;
        }

        .welcome-section {
          margin-bottom: 32px;
        }

        .welcome-content h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
        }

        .welcome-content p {
          margin: 0;
          font-size: 16px;
          color: #64748b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 24px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.total-courses {
          background: #eff6ff;
          color: #3b82f6;
        }
        .stat-icon.completed {
          background: #f0fdf4;
          color: #10b981;
        }
        .stat-icon.in-progress {
          background: #fef3c7;
          color: #f59e0b;
        }
        .stat-icon.learning-time {
          background: #f3e8ff;
          color: #8b5cf6;
        }

        .stat-content h3 {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-content p {
          margin: 0;
          font-size: 14px;
          color: #64748b;
        }

        .tiles-section {
          margin-bottom: 24px;
        }

        .tiles {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .tile {
          padding: 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .tile:hover {
          transform: translateY(-6px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .tile.open {
          background: linear-gradient(135deg, #38b2ac, #319795);
        }
        .tile.assign {
          background: linear-gradient(135deg, #4299e1, #3182ce);
        }
        .tile.proj {
          background: linear-gradient(135deg, #f56565, #e53e3e);
        }
        .tile.sport {
          background: linear-gradient(135deg, #9f7aea, #805ad5);
        }

        .top-row {
          display: flex;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .chart-container,
        .donuts-container,
        .empty-space {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          flex: 1;
          min-width: 280px;
        }

        .chart-container h3 {
          margin: 0 0 16px;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .x-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #718096;
          margin-top: 12px;
        }

        .donuts-container {
          display: flex;
          justify-content: center;
          gap: 32px;
          align-items: center;
        }

        .donut {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .donut svg {
          width: 100px;
          height: 100px;
        }

        .donut .bg {
          fill: none;
          stroke: #e2e8f0;
          stroke-width: 3.8;
        }
        .donut .fill {
          fill: none;
          stroke-linecap: round;
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
          stroke-width: 3.8;
        }
        .donut .fill.avg {
          stroke: #f56565;
        }
        .donut .fill.proj {
          stroke: #4299e1;
        }
        .donut .pct {
          font-size: 16px;
          font-weight: bold;
          fill: #2d3748;
          text-anchor: middle;
        }

        .donut p {
          margin-top: 12px;
          font-size: 14px;
          color: #4a5568;
          font-weight: 600;
        }

        .empty-space {
          background: transparent;
          box-shadow: none;
        }

        .bottom-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .assignments-container,
        .calendar-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          flex: 1;
          min-width: 300px;
        }

        .tab-header {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .tab-header button {
          flex: 1;
          padding: 12px;
          border: none;
          background: none;
          font-weight: 500;
          color: #718096;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-header button:hover {
          color: #4a5568;
        }

        .tab-header button.active {
          color: #5a67d8;
          border-bottom: 2px solid #5a67d8;
        }

        .tab-content {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 500px;
          border-collapse: collapse;
          font-size: 14px;
        }

        th,
        td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        tr:hover td {
          background: #f8fafc;
        }

        th {
          color: #4a5568;
          font-weight: 600;
        }

        .status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status.pending {
          background: #fff5f5;
          color: #e53e3e;
        }
        .status.submitted {
          background: #f0fff4;
          color: #38a169;
        }

        .no-exams {
          text-align: center;
          color: #718096;
        }

        .cal-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .cal-head button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #718096;
          transition: all 0.3s ease;
        }

        .cal-head button:hover {
          color: #4a5568;
        }

        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          background: #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 16px;
        }

        .day-name,
        .cal-grid > div {
          background: #fff;
          padding: 12px;
          text-align: center;
          font-size: 14px;
        }

        .day-name {
          background: #f7fafc;
          font-weight: 600;
          color: #4a5568;
        }

        .calendar-day:hover:not(.empty) {
          background: #f0f9ff;
        }

        .calendar-day.today {
          background: #3b82f6;
          color: #fff;
          font-weight: 700;
        }

        .calendar-day.exam-day {
          background: #fed7d7;
          color: #e53e3e;
          font-weight: 600;
        }

        .empty {
          background: transparent;
        }

        .event {
          background: #fed7d7;
          color: #e53e3e;
          text-align: center;
          padding: 8px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .support-widget {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: #fff;
          padding: 16px 20px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
          z-index: 100;
          transition: all 0.3s ease;
        }

        .support-widget:hover {
          transform: scale(1.05);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .support-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #48bb78, #38a169);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }

        .support-text p {
          font-size: 14px;
          margin: 2px 0;
          font-weight: 500;
        }

        .call-btn {
          background: #48bb78;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .call-btn:hover {
          background: #38a169;
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .top-row,
          .bottom-row {
            flex-direction: column;
          }
          .chart-container,
          .donuts-container,
          .empty-space,
          .assignments-container,
          .calendar-card {
            min-width: 100%;
          }
          .fixed-profile-card {
            right: 16px;
            width: 280px;
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            padding: 0 16px;
          }
          .header-center {
            display: none;
          }
          .main-content {
            padding: 20px;
            margin-left: 0;
          }
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .tiles {
            grid-template-columns: repeat(2, 1fr);
          }
          .fixed-profile-card {
            width: calc(100vw - 32px);
            right: 16px;
            left: 16px;
          }
        }

        @media (max-width: 480px) {
          .tiles {
            grid-template-columns: 1fr;
          }
          .support-widget {
            bottom: 70px;
            right: 16px;
            padding: 12px 16px;
          }
          .donuts-container {
            flex-direction: column;
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
