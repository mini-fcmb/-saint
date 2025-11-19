import React, { useEffect, useState } from "react";
import {
  Search,
  Bell,
  Menu,
  Home,
  BookOpen,
  Clock,
  Calendar,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Play,
  Award,
  CheckCircle,
  X,
} from "lucide-react";
import logo from "../assets/logo.png";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import { useNavigate } from "react-router-dom";

interface UserInfo {
  fullName: string;
  firstName: string;
  userInitial: string;
  email: string;
}

const StudentDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    fullName: "James Dean",
    firstName: "James",
    userInitial: "J",
    email: "james.dean@student.com",
  });

  const { user, userData, signOutUser } = useFirebaseStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (userData?.fullName || user?.displayName) {
      const fullName = userData?.fullName || user?.displayName || "Student";
      const firstName = fullName.split(" ")[0];
      setUserInfo({
        fullName,
        firstName,
        userInitial: firstName.charAt(0).toUpperCase(),
        email: userData?.email || user?.email || "student@email.com",
      });
    }
  }, [user, userData]);

  const handleLogout = async () => {
    await signOutUser();
    navigate("/login");
  };

  const upcomingEvents = [
    {
      day: "Mon 28",
      date: "28 Oct 2024",
      time: "09:00–09:50",
      subject: "Algebra",
      room: "A-101",
      color: "#3B82F6",
    },
    {
      day: "Tue 29",
      date: "29 Oct 2024",
      time: "10:00–11:30",
      subject: "Physics Lab",
      room: "Lab 204",
      color: "#10B981",
    },
    {
      day: "Wed 30",
      date: "30 Oct 2024",
      time: "14:00–15:00",
      subject: "English Literature",
      room: "B-105",
      color: "#8B5CF6",
    },
  ];

  const homeworkProgress = [
    { title: "Rational Inequalities | Assessment #5", date: "03 Mar 2024" },
    { title: "All about Homestats Quiz", date: "25 Mar 2024" },
    { title: "Shapes and Structures", date: "01 Apr 2024" },
    { title: "Word Wonders: Unraveling Language", date: "05 Apr 2024" },
  ];

  const onReview = [
    { title: "Chronicles: Exploring the Past", date: "10 Mar 2024" },
    { title: "Epoch Explorations: Unraveling Timelines", date: "20 Mar 2024" },
  ];

  const completed = [
    {
      title: "Physics Phantoms: Unraveling the Laws of Nature",
      date: "24 Mar 2024",
    },
    { title: "Language Landscape: Exploring Vocabulary", date: "24 Mar 2024" },
  ];

  return (
    <div className="studdy-dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <img src={logo} alt="Studdy" />
            </div>
            <span>SXaint</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { icon: Home, label: "Home", active: true },
            { icon: BookOpen, label: "Lessons" },
            { icon: Clock, label: "Timetable" },
            { icon: FileText, label: "Homework" },
            { icon: MessageSquare, label: "Messages" },
            { icon: BarChart3, label: "Assessments" },
            { icon: Calendar, label: "Support" },
            { icon: Settings, label: "Settings" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`nav-item ${item.active ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item">
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button onClick={handleLogout} className="nav-item logout">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Top Header */}
        <header className="top-header">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="menu-btn"
          >
            {sidebarOpen ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>

          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input type="text" placeholder="Search" />
          </div>

          <div className="header-right">
            <button className="notification-btn">
              <Bell size={22} />
              <span className="notification-dot"></span>
            </button>

            <div
              className="user-profile"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="avatar">{userInfo.userInitial}</div>
              <div className="user-info">
                <span className="name">{userInfo.firstName}</span>
                <span className="role">Student</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="dashboard-content">
          {/* Welcome Card */}
          <div className="welcome-card">
            <div className="welcome-text">
              <h1>Welcome back, {userInfo.firstName}!</h1>
              <p>
                You've learned 70% of your goal this week!
                <br />
                Keep it up and improve your progress.
              </p>
            </div>
            <div className="monster">
              <div className="monster-body"></div>
            </div>
          </div>

          <div className="grid-layout">
            {/* Left Column */}
            <div className="left-column">
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span>Attendance</span>
                    <Clock size={20} color="#3B82F6" />
                  </div>
                  <div className="stat-value">95%</div>
                  <div className="stat-subtitle">19/20 days this month</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span>Homework</span>
                    <CheckCircle size={20} color="#10B981" />
                  </div>
                  <div className="stat-value">53/56</div>
                  <div className="stat-subtitle success">Keep going!</div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span>Rating</span>
                    <Award size={20} color="#8B5CF6" />
                  </div>
                  <div className="stat-value rating">89/100</div>
                  <button className="report-link">Go to report →</button>
                </div>
              </div>

              {/* Timetable & Events */}
              <div className="timetable-events">
                <div className="card timetable">
                  <h3>Timetable</h3>
                  <div className="timetable-list">
                    {upcomingEvents.map((e, i) => (
                      <div key={i} className="timetable-item">
                        <div
                          className="color-bar"
                          style={{ backgroundColor: e.color }}
                        ></div>
                        <div>
                          <div className="subject">{e.subject}</div>
                          <div className="details">
                            {e.time} • {e.room}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card events">
                  <h3>Upcoming events</h3>
                  <div className="events-list">
                    {upcomingEvents.map((e, i) => (
                      <div key={i} className="event-item">
                        <div className="event-date">
                          <strong>{e.day.split(" ")[1]}</strong>
                          <span>{e.day.split(" ")[0]}</span>
                        </div>
                        <div>
                          <div className="subject">{e.subject}</div>
                          <div className="date">{e.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Homework Progress */}
            <div className="right-column">
              <div className="homework-card">
                <div className="homework-sections-card">
                  <div className="homework-header">
                    <h3>Homework progress</h3>
                    <a href="#" className="all-link">
                      All →
                    </a>
                  </div>
                  <div className="homework-sections">
                    <div className="section">
                      <h4>
                        <Play size={16} /> To do
                      </h4>
                      {homeworkProgress.map((item, i) => (
                        <div key={i} className="task-item">
                          <div className="checkbox"></div>
                          <div>
                            <div className="task-title">{item.title}</div>
                            <div className="task-date">{item.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="section">
                      <h4>On review</h4>
                      {onReview.map((item, i) => (
                        <div key={i} className="task-item review">
                          <div className="dot"></div>
                          <div>
                            <div className="task-title">{item.title}</div>
                            <div className="task-date">{item.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="section">
                      <h4>Completed</h4>
                      {completed.map((item, i) => (
                        <div key={i} className="task-item completed">
                          <CheckCircle size={16} color="#10B981" />
                          <div>
                            <div className="task-title">{item.title}</div>
                            <div className="task-date">{item.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ALL CSS INSIDE HERE — NO EXTERNAL FILES */}
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: "Inter", system-ui, sans-serif;
          background: #f9fafb;
        }

        .studdy-dashboard {
          min-height: 100vh;
          background: #f9fafb;
        }

        /* Sidebar */
        .sidebar {
          position: fixed;
          left: 0;
          top: 10px;
          width: 260px;
          height: 82vh;
          border-radius: 25px;
          background: #fff;
          color: #000;
          transition: transform 0.3s ease;
          z-index: 1000;
        }
        .sidebar.closed {
          transform: translateX(-100%);
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 800;
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-icon img {
          width: 32px;
          height: 32px;
          border-radius: 50px;
        }

        .sidebar-nav {
          padding: 16px 0;
        }
        .nav-item {
          width: 100%;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          background: transparent;
          border: none;
          color: #000;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .nav-item.active,
        .nav-item.active:hover {
          background: #4299e1;
          color: #fff;
          border-left: 4px solid white;
          border-radius: 40px;
          padding-left: 20px;
        }
        .nav-item.logout {
          color: #fca5a5;
        }

        .sidebar-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Main Layout */
        .main-layout {
          margin-left: 260px;
          min-height: 100vh;
        }

        /* Top Header */
        .top-header {
          position: fixed;
          top: 10px;
          left: 300px;
          border-radius: 25px;
          right: 0;
          width: 79%;
          height: 70px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          z-index: 900;
        }
        .menu-btn {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
        }
        .menu-btn:hover {
          background: #f3f4f6;
        }

        .search-bar {
          position: relative;
          width: 360px;
        }
        .search-bar input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
          font-size: 15px;
          position: relative;
          right: 250px;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .notification-btn {
          position: relative;
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
        }
        .notification-btn:hover {
          background: #f3f4f6;
        }
        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        .user-info .name {
          font-weight: 600;
        }
        .user-info .role {
          font-size: 13px;
          color: #6b7280;
        }

        /* Dashboard Content */
        .dashboard-content {
          padding: 90px 32px 32px;
        }

        /* Welcome Card */
        .welcome-card {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 24px;
          padding: 15px 30px;
          color: white;
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 65%;
          height: 2%;
        }
        .welcome-text h1 {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .welcome-text p {
          font-size: 18px;
          opacity: 0.9;
          line-height: 1.5;
        }
        .monster {
          width: 80px;
          height: 80px;
          position: relative;
        }
        .monster-body {
          width: 100px;
          height: 100px;
          background: #60a5fa;
          border-radius: 50%;
          position: relative;
          animation: float 6s ease-in-out infinite;
        }
        .monster-body::before {
          content: "";
          position: absolute;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 80px;
          background: white;
          border-radius: 50%;
        }
        .monster-body::after {
          content: "👾";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 80px;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        /* Grid Layout */
        .grid-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          color: #6b7280;
          font-size: 14px;
        }
        .stat-value {
          font-size: 36px;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 4px;
        }
        .stat-subtitle {
          font-size: 14px;
          color: #6b7280;
        }
        .stat-subtitle.success {
          color: #10b981;
          font-weight: 600;
        }
        .rating {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .report-link {
          margin-top: 12px;
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          cursor: pointer;
        }

        /* Timetable & Events */
        .timetable-events {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .card {
          background: white;
          padding: 24px;
          border-radius: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .card h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .timetable-item {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .color-bar {
          width: 4px;
          height: 60px;
          border-radius: 2px;
        }
        .subject {
          font-weight: 600;
        }
        .details {
          font-size: 13px;
          color: #6b7280;
        }

        .events-list .event-item {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }
        .event-date {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 12px;
          text-align: center;
          font-size: 13px;
          min-width: 56px;
        }
        .event-date strong {
          font-size: 18px;
          display: block;
        }

        /* Homework Card */
        .homework-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .homework-header {
          background: #fff;
          padding: 24px;
          color: #000;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        .homework-header h3 {
          font-size: 18px;
          font-weight: 700;
        }
        .all-link {
          font-size: 14px;
          text-decoration: underline;
          color: #000;
        }

        .homework-sections-card {
          background-color: #fff;
          border-radius: 25px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          width: fit-content;
          height: 700px;
          padding: 15px;
          position: absolute;
          top: 90px;
        }
        .homework-sections {
          padding: 24px;
          position: relative;
        }
        .section {
          margin-bottom: 32px;
        }
        .section h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        .task-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
        }
        .task-item.review .dot {
          width: 12px;
          height: 12px;
          background: #fbbf24;
          border-radius: 50%;
        }
        .task-title {
          font-size: 14px;
          font-weight: 500;
        }
        .task-date {
          font-size: 12px;
          color: #6b7280;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .grid-layout {
            grid-template-columns: 1fr;
          }
          .timetable-events {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .main-layout {
            margin-left: 0;
          }
          .top-header {
            left: 0;
            padding: 0 16px;
          }
          .search-bar {
            width: 200px;
          }
        }
        .sidebar-toggle {
          padding: 0 32px;
          margin-bottom: 40px;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
