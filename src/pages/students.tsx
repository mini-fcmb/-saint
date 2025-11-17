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
  Play,
  Award,
  Calendar,
  Bookmark,
  Settings,
  Brain,
  Timer,
  CheckSquare,
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

interface Quiz {
  id: string;
  title: string;
  subject: string;
  duration: number;
  questions: number;
  dueDate: string;
  status: "pending" | "completed" | "in-progress";
  score?: number;
}

const StudentDashboard: React.FC = () => {
  // State declarations
  const [activeTab, setActiveTab] = useState<
    "assignments" | "exam" | "quizzes"
  >("assignments");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
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

  // Mock quizzes data
  const [quizzes, setQuizzes] = useState<Quiz[]>([
    {
      id: "1",
      title: "Mathematics Mid-Term",
      subject: "Mathematics",
      duration: 60,
      questions: 25,
      dueDate: "2024-12-20",
      status: "pending",
    },
    {
      id: "2",
      title: "Physics Fundamentals",
      subject: "Physics",
      duration: 45,
      questions: 20,
      dueDate: "2024-12-18",
      status: "completed",
      score: 85,
    },
    {
      id: "3",
      title: "Chemistry Basics",
      subject: "Chemistry",
      duration: 30,
      questions: 15,
      dueDate: "2024-12-22",
      status: "pending",
    },
    {
      id: "4",
      title: "Computer Science Quiz",
      subject: "Computer Science",
      duration: 90,
      questions: 40,
      dueDate: "2024-12-25",
      status: "in-progress",
    },
  ]);

  // Handle user data loading properly
  useEffect(() => {
    console.log("Firebase Store State:", { user, userData, loading });

    if (loading) return;

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
    ctx.clearRect(0, 0, w, h);

    // Gradient line
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(1, "#764ba2");

    ctx.lineWidth = 4;
    ctx.strokeStyle = gradient;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(30, 90);
    ctx.bezierCurveTo(80, 60, 130, 70, 180, 50);
    ctx.bezierCurveTo(230, 30, 280, 80, 330, 65);
    ctx.bezierCurveTo(380, 50, 430, 85, w - 30, 75);
    ctx.stroke();
  }, []);

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
      title: "New Quiz Available",
      message: "Mathematics Mid-Term quiz is now available",
      time: "2 hours ago",
      isRead: false,
      type: "success",
    },
    {
      id: "2",
      title: "Quiz Completed",
      message: "You scored 85% in Physics Fundamentals",
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
    averageScore: 78,
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

  const handleStartQuiz = (quizId: string) => {
    // Navigate to subjects selection page
    navigate("/quiz-subjects");
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
    { icon: Brain, label: "CBT Quizzes" },
    { icon: FileText, label: "Assignments" },
    { icon: HelpCircle, label: "Query" },
    { icon: Upload, label: "Project Submission" },
    { icon: Video, label: "Virtual Lab" },
    { icon: BarChart, label: "Progress" },
    { icon: Users, label: "Connection" },
    { icon: Settings, label: "Settings" },
  ];

  if (showLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your learning dashboard...</p>
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
            <span className="logo-text">EduPortal</span>
          </div>
        </div>

        <div className="header-center">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search courses, quizzes, or materials..."
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

          <div
            className="user-profile"
            onClick={() => setShowProfileCard(!showProfileCard)}
          >
            <div className="avatar">{userInfo.userInitial}</div>
            <div className="user-info">
              <span className="user-name">{userInfo.firstName}</span>
              <span className="user-role">Student</span>
            </div>
          </div>
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

      {/* Profile Card */}
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
            <button className="logout-btn-full" onClick={handleLogout}>
              <LogOut size={16} /> Sign Out
            </button>
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
                  <h4>AI Learning Assistant</h4>
                  <p>Get personalized help 24/7</p>
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
              <div className="welcome-text">
                <h1>Welcome back, {userInfo.firstName}! 👋</h1>
                <p>
                  Ready to ace your next quiz? Continue your learning journey
                </p>
              </div>
              <div className="welcome-actions">
                <button className="primary-btn">
                  <Play size={16} />
                  Continue Learning
                </button>
                <button className="secondary-btn">
                  <Bookmark size={16} />
                  Save for Later
                </button>
              </div>
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
                  <Award size={20} />
                </div>
                <div className="stat-content">
                  <h3>{stats.averageScore}%</h3>
                  <p>Average Score</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-tiles">
              <div
                className="action-tile primary"
                onClick={() => navigate("/quiz-subjects")}
              >
                <Brain size={24} />
                <span>Take Quiz</span>
              </div>
              <div className="action-tile secondary">
                <BookOpen size={24} />
                <span>Study Materials</span>
              </div>
              <div className="action-tile accent">
                <BarChart3 size={24} />
                <span>Progress Report</span>
              </div>
              <div className="action-tile success">
                <Video size={24} />
                <span>Virtual Lab</span>
              </div>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="content-grid">
            {/* Left Column */}
            <div className="content-column">
              {/* Progress Chart */}
              <div className="content-card">
                <div className="card-header">
                  <h3>Learning Progress</h3>
                  <span className="card-badge">This Semester</span>
                </div>
                <div className="chart-container">
                  <canvas id="lineChart" width="500" height="150"></canvas>
                </div>
              </div>

              {/* Assignments/Quizzes Section */}
              <div className="content-card">
                <div className="tab-header">
                  <button
                    className={activeTab === "assignments" ? "active" : ""}
                    onClick={() => setActiveTab("assignments")}
                  >
                    Assignments
                  </button>
                  <button
                    className={activeTab === "quizzes" ? "active" : ""}
                    onClick={() => setActiveTab("quizzes")}
                  >
                    CBT Quizzes
                  </button>
                  <button
                    className={activeTab === "exam" ? "active" : ""}
                    onClick={() => setActiveTab("exam")}
                  >
                    Exam Schedule
                  </button>
                </div>

                <div className="tab-content">
                  {activeTab === "assignments" && (
                    <div className="assignments-list">
                      {[
                        ["Mathematics", "21.01.2024", "1.05.2024", "pending"],
                        ["Physics", "21.02.2024", "1.06.2024", "submitted"],
                        ["Chemistry", "21.02.2024", "1.06.2024", "submitted"],
                      ].map(([sub, start, end, status], i) => (
                        <div key={i} className="assignment-item">
                          <div className="assignment-info">
                            <h4>{sub}</h4>
                            <p>Due: {end}</p>
                          </div>
                          <span className={`status ${status}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "quizzes" && (
                    <div className="quizzes-list">
                      {quizzes.map((quiz) => (
                        <div key={quiz.id} className="quiz-item">
                          <div className="quiz-info">
                            <h4>{quiz.title}</h4>
                            <p>
                              {quiz.subject} • {quiz.questions} questions •{" "}
                              {quiz.duration} min
                            </p>
                            <span className="quiz-due">
                              Due: {quiz.dueDate}
                            </span>
                          </div>
                          <div className="quiz-actions">
                            {quiz.status === "completed" && (
                              <span className="quiz-score">{quiz.score}%</span>
                            )}
                            <button
                              className={`quiz-btn ${quiz.status}`}
                              onClick={() => handleStartQuiz(quiz.id)}
                            >
                              {quiz.status === "completed"
                                ? "Review"
                                : quiz.status === "in-progress"
                                ? "Continue"
                                : "Start"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "exam" && (
                    <div className="exam-schedule">
                      {examSchedule.map((exam, index) => (
                        <div key={index} className="exam-item">
                          <div className="exam-date">
                            <Calendar size={16} />
                            <span>{exam.date.toLocaleDateString()}</span>
                          </div>
                          <div className="exam-details">
                            <h4>{exam.exam} Exam</h4>
                            <p>
                              {exam.time} • Room {exam.room}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="content-column">
              {/* Calendar */}
              <div className="content-card">
                <div className="card-header">
                  <h3>Academic Calendar</h3>
                </div>
                <div className="calendar">
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
                    {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
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
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="content-card">
                <div className="card-header">
                  <h3>Performance</h3>
                </div>
                <div className="performance-metrics">
                  <div className="metric">
                    <div className="metric-info">
                      <span>Average Score</span>
                      <h4>78%</h4>
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: "78%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="metric">
                    <div className="metric-info">
                      <span>Completion Rate</span>
                      <h4>65%</h4>
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: "65%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="metric">
                    <div className="metric-info">
                      <span>Time Spent</span>
                      <h4>45h</h4>
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-fill"
                        style={{ width: "60%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="content-card">
                <div className="card-header">
                  <h3>Upcoming Deadlines</h3>
                </div>
                <div className="deadlines-list">
                  <div className="deadline-item urgent">
                    <div className="deadline-icon">
                      <Timer size={16} />
                    </div>
                    <div className="deadline-content">
                      <h4>Math Assignment</h4>
                      <p>Due tomorrow</p>
                    </div>
                  </div>
                  <div className="deadline-item warning">
                    <div className="deadline-icon">
                      <CheckSquare size={16} />
                    </div>
                    <div className="deadline-content">
                      <h4>Physics Quiz</h4>
                      <p>Due in 3 days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* CSS Styles */}
      <style>{`
        .student-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 16px;
          color: white;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 1000;
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
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo img {
          width: 36px;
          height: 36px;
          object-fit: contain;
          border-radius: 50%;
        }

        .header-center {
          flex: 1;
          max-width: 500px;
          margin: 0 40px;
        }

        .search-bar {
          position: relative;
          background: rgba(241, 245, 249, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
        }

        .search-bar:focus-within {
          background: white;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
          margin-bottom: 20px;
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

        .logout-btn-full {
          width: 100%;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-btn-full:hover {
          background: #dc2626;
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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.2);
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
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .nav-item.active {
          background: rgba(102, 126, 234, 0.15);
          color: #667eea;
          border-right: 3px solid #667eea;
        }

        .sidebar-footer {
          padding: 24px;
          border-top: 1px solid rgba(226, 232, 240, 0.6);
        }

        .ai-assistant {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(102, 126, 234, 0.2);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .ai-assistant:hover {
          background: rgba(102, 126, 234, 0.2);
        }

        .ai-icon {
          width: 40px;
          height: 40px;
          background: #667eea;
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
        }

        .sidebar.closed ~ .main-content {
          margin-left: 80px;
        }

        .welcome-section {
          margin-bottom: 32px;
        }

        .welcome-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .welcome-text h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 700;
          color: white;
        }

        .welcome-text p {
          margin: 0;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
        }

        .welcome-actions {
          display: flex;
          gap: 12px;
        }

        .primary-btn, .secondary-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .primary-btn {
          background: white;
          color: #667eea;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .secondary-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          backdrop-filter: blur(10px);
        }

        .secondary-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }
        .stat-icon.completed {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        .stat-icon.in-progress {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        .stat-icon.learning-time {
          background: rgba(139, 92, 246, 0.1);
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

        .quick-actions {
          margin-bottom: 32px;
        }

        .quick-actions h2 {
          margin: 0 0 16px 0;
          font-size: 24px;
          font-weight: 600;
          color: white;
        }

        .action-tiles {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .action-tile {
          padding: 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: white;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          cursor: pointer;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .action-tile:hover {
          transform: translateY(-6px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .action-tile.primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }
        .action-tile.secondary {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }
        .action-tile.accent {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
        }
        .action-tile.success {
          background: linear-gradient(135deg, #43e97b, #38f9d7);
        }

        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }

        .content-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .content-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .card-badge {
          background: #667eea;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .chart-container {
          padding: 20px 0;
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
          color: #667eea;
          border-bottom: 2px solid #667eea;
        }

        .assignments-list, .quizzes-list, .exam-schedule {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .assignment-item, .quiz-item, .exam-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .assignment-item:hover, .quiz-item:hover, .exam-item:hover {
          background: #f1f5f9;
        }

        .assignment-info h4, .quiz-info h4, .exam-details h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .assignment-info p, .quiz-info p, .exam-details p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }

        .quiz-due {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          display: block;
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

        .quiz-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quiz-score {
          font-weight: 600;
          color: #667eea;
        }

        .quiz-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .quiz-btn.pending {
          background: #667eea;
          color: white;
        }

        .quiz-btn.in-progress {
          background: #f59e0b;
          color: white;
        }

        .quiz-btn.completed {
          background: #10b981;
          color: white;
        }

        .quiz-btn:hover {
          transform: translateY(-1px);
        }

        .exam-date {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #667eea;
          font-weight: 600;
          font-size: 14px;
        }

        .calendar {
          padding: 0;
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
          gap: 1px;
          background: #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .day-name, .cal-grid > div {
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
          background: #667eea;
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

        .performance-metrics {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metric-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .metric-info span {
          font-size: 14px;
          color: #64748b;
        }

        .metric-info h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }

        .metric-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .metric-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .deadlines-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .deadline-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .deadline-item.urgent {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
        }

        .deadline-item.warning {
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
        }

        .deadline-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .deadline-item.urgent .deadline-icon {
          background: #fef2f2;
          color: #ef4444;
        }

        .deadline-item.warning .deadline-icon {
          background: #fffbeb;
          color: #f59e0b;
        }

        .deadline-content h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .deadline-content p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }

        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .action-tiles {
            grid-template-columns: repeat(2, 1fr);
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
          .welcome-content {
            flex-direction: column;
            gap: 16px;
          }
          .welcome-actions {
            width: 100%;
          }
          .primary-btn, .secondary-btn {
            flex: 1;
            justify-content: center;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .action-tiles {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .fixed-profile-card {
            width: calc(100vw - 32px);
            right: 16px;
            left: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
