import React, { useEffect, useState, useCallback } from "react";
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
  AlertCircle,
  Lock,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  EyeOff,
  UserCheck,
  UserX,
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

interface Quiz {
  id: string;
  name: string;
  subject: string;
  teacherName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  totalDuration: number;
  status: "upcoming" | "active" | "expired";
  questions: Question[];
  maxScore: number;
}

interface Question {
  id: number;
  text: string;
  imageUrl: string;
  options: string[];
  correctAnswer: number;
  studentAnswer?: number;
}

interface QuizSubmission {
  quizId: string;
  status: "submitted" | "in-progress";
  score?: number;
  maxScore: number;
  submittedAt: string;
  attempts: number;
}

// Enhanced Interfaces for Monitoring
interface Violation {
  id: string;
  timestamp: Date;
  type:
    | "keyboard"
    | "right-click"
    | "tab-switch"
    | "dev-tools"
    | "fullscreen-exit";
  description: string;
  severity: "low" | "medium" | "high";
}

interface StudentMonitoringData {
  studentId: string;
  studentName: string;
  quizId: string;
  quizName: string;
  status: "in-progress" | "submitted" | "violation" | "expired";
  progress: number;
  timeSpent: string;
  currentQuestion: number;
  totalQuestions: number;
  violations: Violation[];
  lastActivity: Date;
  score?: number;
  maxScore?: number;
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
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [showQuizSection, setShowQuizSection] = useState(false);
  const [quizSubmissions, setQuizSubmissions] = useState<{
    [key: string]: QuizSubmission;
  }>({});
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showAdminCodeModal, setShowAdminCodeModal] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [quizInProgress, setQuizInProgress] = useState(false);

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

  // Load quizzes and submissions
  useEffect(() => {
    const loadQuizzes = () => {
      const savedQuizzes = localStorage.getItem("teacher-quizzes");
      if (savedQuizzes) {
        try {
          const parsedQuizzes: Quiz[] = JSON.parse(savedQuizzes);
          const updatedQuizzes = parsedQuizzes.map((quiz) => {
            const now = new Date();
            const scheduledDateTime = new Date(
              `${quiz.scheduledDate}T${quiz.scheduledTime}`
            );
            const endTime = new Date(
              scheduledDateTime.getTime() + quiz.totalDuration * 60000
            );

            let status: "upcoming" | "active" | "expired" = "upcoming";
            if (now >= scheduledDateTime && now <= endTime) {
              status = "active";
            } else if (now > endTime) {
              status = "expired";
            }
            return { ...quiz, status };
          });
          setQuizzes(updatedQuizzes);
        } catch (error) {
          console.error("Error loading quizzes:", error);
        }
      }
    };

    const savedSubmissions = localStorage.getItem("student-quiz-submissions");
    if (savedSubmissions) {
      setQuizSubmissions(JSON.parse(savedSubmissions));
    }

    loadQuizzes();
    const interval = setInterval(loadQuizzes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save submissions
  useEffect(() => {
    localStorage.setItem(
      "student-quiz-submissions",
      JSON.stringify(quizSubmissions)
    );
  }, [quizSubmissions]);

  const handleLogout = async () => {
    await signOutUser();
    navigate("/login");
  };

  const handleStartQuiz = (quiz: Quiz) => {
    if (quiz.status !== "active") return;

    const submission = quizSubmissions[quiz.id];
    if (submission?.status === "submitted") {
      alert("You have already submitted this quiz. You cannot retake it.");
      return;
    }

    setSelectedQuiz(quiz);
    setShowQuizModal(true);
    setQuizInProgress(true);
  };

  const handleQuizSubmitted = (
    quizId: string,
    score: number,
    maxScore: number
  ) => {
    setQuizSubmissions((prev) => ({
      ...prev,
      [quizId]: {
        quizId,
        status: "submitted",
        score,
        maxScore,
        submittedAt: new Date().toISOString(),
        attempts: (prev[quizId]?.attempts || 0) + 1,
      },
    }));
    setShowQuizModal(false);
    setSelectedQuiz(null);
    setQuizInProgress(false);
  };

  const handleAdminCodeSubmit = () => {
    if (adminCode === "mini-fcmb") {
      setShowAdminCodeModal(false);
      setShowQuizModal(false);
      setSelectedQuiz(null);
      setAdminCode("");
      setQuizInProgress(false);
    } else {
      alert("Invalid admin code. Please try again.");
    }
  };

  const handleCancelAdminCode = () => {
    setShowAdminCodeModal(false);
    setAdminCode("");
    // Re-activate strict mode when returning to quiz
    setQuizInProgress(true);
  };

  const getQuizStatusText = (quiz: Quiz) => {
    const submission = quizSubmissions[quiz.id];
    if (submission?.status === "submitted") return "Submitted";
    if (quiz.status === "active") return "Active";
    if (quiz.status === "upcoming") return "Upcoming";
    return "Expired";
  };

  const getQuizStatusColor = (quiz: Quiz) => {
    const submission = quizSubmissions[quiz.id];
    if (submission?.status === "submitted") return "#10b981";
    if (quiz.status === "active") return "#3b82f6";
    if (quiz.status === "upcoming") return "#f59e0b";
    return "#ef4444";
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
            { icon: Home, label: "Home", active: !showQuizSection },
            { icon: BookOpen, label: "Lessons" },
            { icon: Clock, label: "Timetable" },
            { icon: FileText, label: "Homework" },
            { icon: MessageSquare, label: "Messages" },
            { icon: BarChart3, label: "Assessments" },
            { icon: Calendar, label: "Quizzes", active: showQuizSection },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`nav-item ${item.active ? "active" : ""}`}
                onClick={() => {
                  if (item.label === "Quizzes") {
                    setShowQuizSection(true);
                  } else if (item.label === "Home") {
                    setShowQuizSection(false);
                  }
                }}
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

          {!showQuizSection ? (
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
          ) : (
            /* Quiz Section */
            <div className="quiz-section">
              <div className="quiz-header">
                <h2>Available Quizzes</h2>
                <button
                  className="back-btn"
                  onClick={() => setShowQuizSection(false)}
                >
                  <ChevronLeft size={20} />
                  Back to Dashboard
                </button>
              </div>

              <div className="quizzes-grid">
                {quizzes.length === 0 ? (
                  <div className="no-quizzes">
                    <FileText size={48} color="#6b7280" />
                    <h3>No quizzes available</h3>
                    <p>Your teacher hasn't uploaded any quizzes yet.</p>
                  </div>
                ) : (
                  quizzes.map((quiz) => {
                    const submission = quizSubmissions[quiz.id];
                    const statusText = getQuizStatusText(quiz);
                    const statusColor = getQuizStatusColor(quiz);

                    return (
                      <div key={quiz.id} className="quiz-card">
                        <div className="quiz-card-header">
                          <div className="quiz-subject">{quiz.subject}</div>
                          <div
                            className="quiz-status"
                            style={{
                              backgroundColor: statusColor,
                              color: "white",
                            }}
                          >
                            {statusText}
                          </div>
                        </div>

                        <h3 className="quiz-title">{quiz.name}</h3>
                        <p className="quiz-teacher">
                          By: {quiz.teacherName || "Teacher"}
                        </p>

                        <div className="quiz-details">
                          <div className="detail">
                            <Calendar size={16} />
                            {new Date(quiz.scheduledDate).toLocaleDateString()}
                          </div>
                          <div className="detail">
                            <Clock size={16} />
                            {quiz.scheduledTime} ({quiz.duration} mins)
                          </div>
                          <div className="detail">
                            <FileText size={16} />
                            {quiz.questions.length} questions
                          </div>
                          <div className="detail">
                            <Award size={16} />
                            Max score: {quiz.maxScore}
                          </div>
                          {submission?.score && (
                            <div className="detail">
                              <CheckCircle size={16} />
                              Your score: {submission.score}/
                              {submission.maxScore}
                            </div>
                          )}
                        </div>

                        <div className="quiz-actions">
                          {quiz.status === "active" && !submission && (
                            <button
                              className="start-quiz-btn"
                              onClick={() => handleStartQuiz(quiz)}
                            >
                              <Play size={16} />
                              Start Quiz
                            </button>
                          )}
                          {quiz.status === "active" &&
                            submission?.status === "submitted" && (
                              <div className="submitted-message">
                                <CheckCircle size={16} />
                                Quiz Submitted - Score: {submission.score}/
                                {submission.maxScore}
                              </div>
                            )}
                          {quiz.status === "upcoming" && (
                            <div className="upcoming-message">
                              <Clock size={16} />
                              Available at {quiz.scheduledTime} on{" "}
                              {new Date(
                                quiz.scheduledDate
                              ).toLocaleDateString()}
                            </div>
                          )}
                          {quiz.status === "expired" && (
                            <div className="expired-message">
                              <Lock size={16} />
                              Quiz expired
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Quiz Modal */}
          {showQuizModal && selectedQuiz && (
            <StrictQuizInterface
              quiz={selectedQuiz}
              onClose={() => {
                setQuizInProgress(false); // Deactivate strict mode for admin modal
                setShowAdminCodeModal(true);
              }}
              onSubmit={handleQuizSubmitted}
              existingSubmission={quizSubmissions[selectedQuiz.id]}
              strictModeActive={quizInProgress}
              studentName={userInfo.fullName}
              studentId={user?.uid || "unknown"}
            />
          )}

          {/* Admin Code Modal */}
          {showAdminCodeModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <Lock size={24} />
                  <h3>Admin Authorization Required</h3>
                  <button className="close-btn" onClick={handleCancelAdminCode}>
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <p>Enter admin code to exit the quiz without submission:</p>
                  <input
                    type="password"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Enter admin code"
                    className="code-input"
                  />
                  <p className="warning-text">
                    Exiting without admin code will submit your quiz.
                  </p>
                </div>
                <div className="modal-actions">
                  <button
                    className="modal-btn cancel"
                    onClick={handleCancelAdminCode}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn confirm"
                    onClick={handleAdminCodeSubmit}
                  >
                    Submit Code
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CSS Styles */}
      <style>{`
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

        /* Quiz Section Styles */
        .quiz-section {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .quiz-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f3f4f6;
          border: none;
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: #e5e7eb;
        }

        .quizzes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .quiz-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
        }

        .quiz-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .quiz-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .quiz-subject {
          background: #3b82f6;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .quiz-status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .quiz-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1f2937;
        }

        .quiz-teacher {
          color: #6b7280;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .quiz-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .detail {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .quiz-actions {
          margin-top: auto;
        }

        .start-quiz-btn {
          width: 100%;
          background: #10b981;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .start-quiz-btn:hover {
          background: #059669;
        }

        .submitted-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: #d1fae5;
          border-radius: 12px;
          font-size: 14px;
          color: #065f46;
          font-weight: 600;
        }

        .upcoming-message,
        .expired-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 12px;
          font-size: 14px;
          color: #6b7280;
        }

        .no-quizzes {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .no-quizzes h3 {
          margin: 16px 0 8px;
          font-size: 20px;
        }

        /* Admin Code Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.5rem;
          color: #1e293b;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-body {
          margin-bottom: 24px;
        }

        .modal-body p {
          margin: 0 0 16px 0;
          color: #64748b;
        }

        .code-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          margin-bottom: 16px;
        }

        .code-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .warning-text {
          color: #dc2626;
          font-weight: 500;
          background: #fef2f2;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid #dc2626;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-btn {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-btn.cancel {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .modal-btn.cancel:hover {
          background: #e2e8f0;
        }

        .modal-btn.confirm {
          background: #dc2626;
          color: white;
        }

        .modal-btn.confirm:hover {
          background: #b91c1c;
        }

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
          .quizzes-grid {
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
          .quiz-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

// Enhanced Strict Quiz Interface Component with Monitoring
interface StrictQuizInterfaceProps {
  quiz: Quiz;
  onClose: () => void;
  onSubmit: (quizId: string, score: number, maxScore: number) => void;
  existingSubmission?: QuizSubmission;
  strictModeActive: boolean;
  studentName: string;
  studentId: string;
}

const StrictQuizInterface: React.FC<StrictQuizInterfaceProps> = ({
  quiz,
  onClose,
  onSubmit,
  existingSubmission,
  strictModeActive,
  studentName,
  studentId,
}) => {
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [violationAttempts, setViolationAttempts] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);

  // Function to report violation to teacher monitoring
  const reportViolation = useCallback(
    (
      type: Violation["type"],
      description: string,
      severity: Violation["severity"]
    ) => {
      const violation: Violation = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type,
        description,
        severity,
      };

      setViolations((prev) => [...prev, violation]);

      // Update monitoring data in localStorage for teacher to see
      const monitoringData: StudentMonitoringData = {
        studentId: studentId,
        studentName,
        quizId: quiz.id,
        quizName: quiz.name,
        status: "violation",
        progress: Math.round(
          (Object.keys(answers).length / quiz.questions.length) * 100
        ),
        timeSpent: formatTime(quiz.duration * 60 - timeLeft),
        currentQuestion: currentQuestion + 1,
        totalQuestions: quiz.questions.length,
        violations: [...violations, violation],
        lastActivity: new Date(),
        score: existingSubmission?.score,
        maxScore: quiz.maxScore,
      };

      // Save to localStorage for teacher monitoring
      updateMonitoringData(monitoringData);
    },
    [
      studentId,
      studentName,
      quiz,
      answers,
      timeLeft,
      currentQuestion,
      violations,
      existingSubmission,
    ]
  );

  // Function to update monitoring data
  const updateMonitoringData = useCallback(
    (monitoringData: StudentMonitoringData) => {
      const existingMonitoring = localStorage.getItem(
        "student-quiz-monitoring"
      );
      let allMonitoring: StudentMonitoringData[] = [];

      if (existingMonitoring) {
        allMonitoring = JSON.parse(existingMonitoring);
      }

      // Update or add this student's monitoring data
      const studentIndex = allMonitoring.findIndex(
        (m) => m.studentId === monitoringData.studentId && m.quizId === quiz.id
      );
      if (studentIndex !== -1) {
        allMonitoring[studentIndex] = monitoringData;
      } else {
        allMonitoring.push(monitoringData);
      }

      localStorage.setItem(
        "student-quiz-monitoring",
        JSON.stringify(allMonitoring)
      );
    },
    [quiz.id]
  );

  // Enhanced violation handler
  const handleViolation = useCallback(
    (type: Violation["type"], description: string) => {
      const severity = violationAttempts >= 1 ? "high" : "medium";
      reportViolation(type, description, severity);

      const newAttempts = violationAttempts + 1;
      setViolationAttempts(newAttempts);

      if (newAttempts >= 2) {
        handleAutoSubmit();
        alert(
          "Maximum violation attempts reached. Quiz submitted automatically."
        );
      } else {
        setShowViolationWarning(true);
        setTimeout(() => setShowViolationWarning(false), 5000);
      }
    },
    [violationAttempts, reportViolation]
  );

  // Enhanced strict mode restrictions with monitoring
  const preventNavigation = useCallback(
    (e: BeforeUnloadEvent) => {
      if (quizStarted && strictModeActive) {
        handleViolation("tab-switch", "Attempted to navigate away from quiz");
        e.preventDefault();
        e.returnValue =
          "Are you sure you want to leave? Your quiz progress will be lost.";
        return e.returnValue;
      }
    },
    [quizStarted, strictModeActive, handleViolation]
  );

  const preventContextMenu = useCallback(
    (e: MouseEvent) => {
      if (quizStarted && strictModeActive) {
        e.preventDefault();
        handleViolation("right-click", "Right-click context menu attempted");
      }
    },
    [quizStarted, strictModeActive, handleViolation]
  );

  const preventShortcuts = useCallback(
    (e: KeyboardEvent) => {
      if (quizStarted && strictModeActive) {
        // Allow only Tab and Escape keys for accessibility
        if (e.key === "Tab" || e.key === "Escape") {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleViolation("keyboard", `Keyboard shortcut attempted: ${e.key}`);
        return false;
      }
    },
    [quizStarted, strictModeActive, handleViolation]
  );

  const preventDevTools = useCallback(
    (e: KeyboardEvent) => {
      if (quizStarted && strictModeActive) {
        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && e.key === "I") ||
          (e.ctrlKey && e.shiftKey && e.key === "J") ||
          (e.ctrlKey && e.shiftKey && e.key === "C") ||
          (e.ctrlKey && e.key === "u")
        ) {
          e.preventDefault();
          handleViolation("dev-tools", "Developer tools access attempted");
        }
      }
    },
    [quizStarted, strictModeActive, handleViolation]
  );

  // Update monitoring data periodically
  useEffect(() => {
    if (quizStarted && strictModeActive) {
      const updateMonitoring = () => {
        const monitoringData: StudentMonitoringData = {
          studentId: studentId,
          studentName,
          quizId: quiz.id,
          quizName: quiz.name,
          status: "in-progress",
          progress: Math.round(
            (Object.keys(answers).length / quiz.questions.length) * 100
          ),
          timeSpent: formatTime(quiz.duration * 60 - timeLeft),
          currentQuestion: currentQuestion + 1,
          totalQuestions: quiz.questions.length,
          violations,
          lastActivity: new Date(),
          score: existingSubmission?.score,
          maxScore: quiz.maxScore,
        };

        updateMonitoringData(monitoringData);
      };

      const interval = setInterval(updateMonitoring, 5000);
      return () => clearInterval(interval);
    }
  }, [
    quizStarted,
    strictModeActive,
    studentId,
    studentName,
    quiz,
    answers,
    timeLeft,
    currentQuestion,
    violations,
    existingSubmission,
    updateMonitoringData,
  ]);

  // Enhanced effect for strict mode restrictions
  useEffect(() => {
    if (quizStarted && strictModeActive) {
      console.log("Strict mode ACTIVATED - restrictions enabled");

      window.addEventListener("beforeunload", preventNavigation);
      window.addEventListener("contextmenu", preventContextMenu);
      window.addEventListener("keydown", preventShortcuts, true);
      window.addEventListener("keyup", preventShortcuts, true);
      window.addEventListener("keypress", preventShortcuts, true);
      window.addEventListener("keydown", preventDevTools, true);

      // Enter fullscreen
      const enterFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (error) {
          console.log("Fullscreen not supported");
        }
      };
      enterFullscreen();

      // Monitor fullscreen changes
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement && quizStarted && strictModeActive) {
          handleViolation("fullscreen-exit", "Fullscreen mode exited");
          // Optionally re-enter fullscreen
          enterFullscreen();
        }
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);

      return () => {
        console.log("Strict mode DEACTIVATED - restrictions removed");

        window.removeEventListener("beforeunload", preventNavigation);
        window.removeEventListener("contextmenu", preventContextMenu);
        window.removeEventListener("keydown", preventShortcuts, true);
        window.removeEventListener("keyup", preventShortcuts, true);
        window.removeEventListener("keypress", preventShortcuts, true);
        window.removeEventListener("keydown", preventDevTools, true);
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
      };
    }
  }, [
    quizStarted,
    strictModeActive,
    preventNavigation,
    preventContextMenu,
    preventShortcuts,
    preventDevTools,
    handleViolation,
  ]);

  // Timer countdown
  useEffect(() => {
    if (quizStarted && timeLeft > 0 && strictModeActive) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, timeLeft, strictModeActive]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleEmergencyExit = () => {
    console.log("Emergency exit clicked - deactivating strict mode");
    onClose(); // This will trigger the admin code modal
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const handleFlagQuestion = (questionIndex: number) => {
    setFlagged((prev) =>
      prev.includes(questionIndex)
        ? prev.filter((q) => q !== questionIndex)
        : [...prev, questionIndex]
    );
  };

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    calculateResults();
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const handleAutoSubmit = () => {
    calculateResults();
  };

  // Enhanced submit function to update monitoring status
  const calculateResults = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / quiz.questions.length) * quiz.maxScore;
    const finalScore = Math.round(score);

    // Update monitoring data to show submitted status
    const monitoringData: StudentMonitoringData = {
      studentId: studentId,
      studentName,
      quizId: quiz.id,
      quizName: quiz.name,
      status: "submitted",
      progress: 100,
      timeSpent: formatTime(quiz.duration * 60),
      currentQuestion: quiz.questions.length,
      totalQuestions: quiz.questions.length,
      violations,
      lastActivity: new Date(),
      score: finalScore,
      maxScore: quiz.maxScore,
    };

    updateMonitoringData(monitoringData);

    // Save score to grade management system
    const submissionData = {
      quizId: quiz.id,
      studentId: studentId,
      studentName,
      subject: quiz.subject,
      score: finalScore,
      maxScore: quiz.maxScore,
      submittedAt: new Date().toISOString(),
      status: "submitted",
    };

    const existingSubmissions = localStorage.getItem(
      "student-quiz-submissions"
    );
    let allSubmissions: any = {};

    if (existingSubmissions) {
      allSubmissions = JSON.parse(existingSubmissions);
    }

    allSubmissions[quiz.id] = submissionData;
    localStorage.setItem(
      "student-quiz-submissions",
      JSON.stringify(allSubmissions)
    );

    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }

    onSubmit(quiz.id, finalScore, quiz.maxScore);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;
  const currentQuestionData = quiz.questions[currentQuestion];

  if (!quizStarted) {
    return (
      <div className="quiz-instructions">
        <div className="instructions-container">
          <div className="instructions-header">
            <Lock size={48} />
            <h1>Quiz Instructions</h1>
            <p>
              {quiz.name} - {quiz.subject}
            </p>
          </div>

          <div className="instructions-content">
            <div className="warning-section">
              <AlertTriangle size={24} />
              <h3>Strict Mode Enabled</h3>
              <p>
                This quiz will run in strict mode with the following
                restrictions:
              </p>
            </div>

            <div className="rules-list compact">
              <div className="rule-item">
                <div className="rule-icon">🚫</div>
                <div className="rule-text">
                  <strong>Keyboard keys disabled during quiz</strong>
                  <span>Only mouse interactions allowed</span>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">🚫</div>
                <div className="rule-text">
                  <strong>No new tabs/windows</strong>
                  <span>Browser navigation restricted</span>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">🚫</div>
                <div className="rule-text">
                  <strong>Right-click disabled</strong>
                  <span>Context menu disabled</span>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">⚠️</div>
                <div className="rule-text">
                  <strong>2 violation limit</strong>
                  <span>Auto-submit after 2 violations</span>
                </div>
              </div>
            </div>

            <div className="quiz-info compact">
              <div className="info-item">
                <strong>Duration:</strong>
                <span>{quiz.duration} mins</span>
              </div>
              <div className="info-item">
                <strong>Questions:</strong>
                <span>{quiz.questions.length}</span>
              </div>
              <div className="info-item">
                <strong>Max Score:</strong>
                <span>{quiz.maxScore}</span>
              </div>
            </div>
          </div>

          <div className="instructions-actions">
            <button className="back-btn" onClick={onClose}>
              <ChevronLeft size={20} />
              Back to Quizzes
            </button>
            <button className="start-btn" onClick={handleStartQuiz}>
              Start Quiz
            </button>
          </div>
        </div>

        <style>{`
          .quiz-instructions {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 2000;
          }

          .instructions-container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-height: 90vh;
            overflow-y: auto;
          }

          .instructions-header {
            text-align: center;
            margin-bottom: 24px;
          }

          .instructions-header h1 {
            margin: 16px 0 8px 0;
            font-size: 1.8rem;
            color: #1e293b;
          }

          .instructions-header p {
            margin: 0;
            color: #64748b;
            font-size: 1rem;
          }

          .warning-section {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
            text-align: center;
          }

          .warning-section h3 {
            margin: 8px 0;
            color: #d97706;
            font-size: 1.1rem;
          }

          .rules-list.compact {
            margin-bottom: 24px;
          }

          .rule-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .rule-item:last-child {
            border-bottom: none;
          }

          .rule-icon {
            font-size: 1.1rem;
            flex-shrink: 0;
          }

          .rule-text {
            flex: 1;
          }

          .rule-text strong {
            display: block;
            color: #1e293b;
            margin-bottom: 2px;
            font-size: 0.9rem;
          }

          .rule-text span {
            color: #64748b;
            font-size: 0.8rem;
          }

          .quiz-info.compact {
            background: #f8fafc;
            border-radius: 12px;
            padding: 16px;
          }

          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 0.9rem;
          }

          .info-item:not(:last-child) {
            border-bottom: 1px solid #e2e8f0;
          }

          .instructions-actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
          }

          .back-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            color: #64748b;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
          }

          .back-btn:hover {
            background: #e2e8f0;
          }

          .start-btn {
            flex: 2;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .start-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="quiz-dashboard">
      {/* Violation Warning */}
      {showViolationWarning && strictModeActive && (
        <div className="violation-warning">
          <AlertTriangle size={20} />
          <span>
            Violation detected! {2 - violationAttempts} attempt(s) remaining
            before auto-submission.
          </span>
        </div>
      )}

      {/* Strict Mode Status Indicator */}
      {!strictModeActive && (
        <div className="strict-mode-inactive-warning">
          <AlertTriangle size={20} />
          <span>
            Strict mode temporarily disabled - Enter admin code or return to
            quiz
          </span>
        </div>
      )}

      {/* Header */}
      <header className="quiz-header">
        <div className="header-left">
          <div className="quiz-logo">Q</div>
          <div className="quiz-info">
            <h1>
              {quiz.name} - {quiz.subject}
            </h1>
            <p>
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="timer-display">
            <Clock size={20} />
            <span className="timer">{formatTime(timeLeft)}</span>
          </div>
          <button className="emergency-exit" onClick={handleEmergencyExit}>
            Emergency Exit
          </button>
        </div>
      </header>

      {/* Progress Navigation */}
      <div className="progress-nav">
        <div className="question-grid">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              className={`question-indicator ${
                index === currentQuestion ? "current" : ""
              } ${answers[index] !== undefined ? "answered" : ""} ${
                flagged.includes(index) ? "flagged" : ""
              }`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
              {flagged.includes(index) && <AlertTriangle size={12} />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="quiz-content">
        {/* Question Area */}
        <div className="question-area">
          <div className="question-header">
            <h2>{currentQuestionData.text}</h2>
            <button
              className={`flag-btn ${
                flagged.includes(currentQuestion) ? "flagged" : ""
              }`}
              onClick={() => handleFlagQuestion(currentQuestion)}
            >
              <AlertTriangle size={16} />
              {flagged.includes(currentQuestion) ? "Unflag" : "Flag Question"}
            </button>
          </div>

          {currentQuestionData.imageUrl && (
            <div className="diagram-container">
              <img
                src={currentQuestionData.imageUrl}
                alt="Question"
                className="question-image"
              />
            </div>
          )}

          <div className="options-grid">
            {currentQuestionData.options.map((option, index) => (
              <button
                key={index}
                className={`option-btn ${
                  answers[currentQuestion] === index ? "selected" : ""
                }`}
                onClick={() => handleAnswerSelect(currentQuestion, index)}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-value">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="navigation-controls">
          <button
            className="nav-btn prev"
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="nav-center">
            <span>
              Question {currentQuestion + 1} of {quiz.questions.length}
            </span>
          </div>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button className="nav-btn submit" onClick={handleSubmitClick}>
              Submit Quiz
            </button>
          ) : (
            <button
              className="nav-btn next"
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(quiz.questions.length - 1, prev + 1)
                )
              }
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirmation-modal">
          <div className="modal-overlay" onClick={handleCancelSubmit}></div>
          <div className="modal-content">
            <div className="modal-header">
              <AlertCircle size={24} className="modal-icon" />
              <h3>Confirm Submission</h3>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to submit your quiz?</p>
              <div className="submission-stats">
                <div className="stat-item">
                  <span className="stat-label">Questions Answered:</span>
                  <span className="stat-value">
                    {answeredQuestions}/{totalQuestions}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Flagged Questions:</span>
                  <span className="stat-value">{flagged.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Time Remaining:</span>
                  <span className="stat-value">{formatTime(timeLeft)}</span>
                </div>
              </div>
              <p className="warning-text">
                Once submitted, you cannot change your answers or retake this
                quiz.
              </p>
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={handleCancelSubmit}>
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleConfirmSubmit}
              >
                Yes, Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .quiz-dashboard {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f8fafc;
          font-family: 'Inter', sans-serif;
          z-index: 2000;
        }

        .violation-warning {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #fef3c7;
          border-bottom: 2px solid #f59e0b;
          color: #92400e;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-weight: 600;
          z-index: 2001;
        }

        .strict-mode-inactive-warning {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #3b82f6;
          border-bottom: 2px solid #1d4ed8;
          color: white;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-weight: 600;
          z-index: 2001;
        }

        .quiz-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .quiz-logo {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .quiz-info h1 {
          margin: 0;
          font-size: 1.25rem;
          color: #1e293b;
        }

        .quiz-info p {
          margin: 4px 0 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .timer-display {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          padding: 8px 16px;
          border-radius: 20px;
          color: #dc2626;
          font-weight: 600;
        }

        .emergency-exit {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.3s;
        }

        .emergency-exit:hover {
          background: #dc2626;
        }

        .progress-nav {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 32px;
          overflow-x: auto;
        }

        .question-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .question-indicator {
          width: 40px;
          height: 40px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          position: relative;
        }

        .question-indicator:hover {
          border-color: #667eea;
        }

        .question-indicator.current {
          border-color: #667eea;
          background: #667eea;
          color: white;
        }

        .question-indicator.answered {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .question-indicator.flagged {
          border-color: #f59e0b;
        }

        .question-indicator.flagged::after {
          content: '';
          position: absolute;
          top: 2px;
          right: 2px;
          width: 8px;
          height: 8px;
          background: #f59e0b;
          border-radius: 50%;
        }

        .quiz-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 32px;
          height: calc(100vh - 200px);
          display: flex;
          flex-direction: column;
        }

        .question-area {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
          flex: 1;
          overflow-y: auto;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .question-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #1e293b;
          line-height: 1.4;
          flex: 1;
        }

        .flag-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .flag-btn:hover {
          background: #f1f5f9;
        }

        .flag-btn.flagged {
          background: #fef3c7;
          border-color: #f59e0b;
          color: #d97706;
        }

        .diagram-container {
          margin: 24px 0;
          text-align: center;
        }

        .question-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .options-grid {
          display: grid;
          gap: 12px;
          margin-top: 24px;
        }

        .option-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .option-btn:hover {
          border-color: #667eea;
          background: #f8fafc;
        }

        .option-btn.selected {
          border-color: #667eea;
          background: #eff6ff;
        }

        .option-letter {
          width: 32px;
          height: 32px;
          border: 2px solid #64748b;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #64748b;
          transition: all 0.3s ease;
        }

        .option-btn.selected .option-letter {
          border-color: #667eea;
          background: #667eea;
          color: white;
        }

        .option-value {
          font-size: 1rem;
          color: #1e293b;
          font-weight: 500;
        }

        .navigation-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 20px 32px;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .nav-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #667eea;
          color: #667eea;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .nav-btn.submit {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .nav-btn.submit:hover {
          background: #059669;
        }

        .nav-center {
          color: #64748b;
          font-weight: 500;
        }

        /* Confirmation Modal Styles */
        .confirmation-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          padding: 20px;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .modal-content {
          position: relative;
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .modal-icon {
          color: #f59e0b;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 1.5rem;
          color: #1e293b;
        }

        .modal-body {
          margin-bottom: 24px;
        }

        .modal-body p {
          margin: 0 0 16px 0;
          color: #64748b;
          line-height: 1.5;
        }

        .submission-stats {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .stat-item:not(:last-child) {
          border-bottom: 1px solid #e2e8f0;
        }

        .stat-label {
          color: #64748b;
          font-weight: 500;
        }

        .stat-value {
          color: #1e293b;
          font-weight: 600;
        }

        .warning-text {
          color: #dc2626 !important;
          font-weight: 500;
          background: #fef2f2;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid #dc2626;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .modal-btn {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .modal-btn.cancel {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .modal-btn.cancel:hover {
          background: #e2e8f0;
        }

        .modal-btn.confirm {
          background: #dc2626;
          color: white;
        }

        .modal-btn.confirm:hover {
          background: #b91c1c;
        }

        @media (max-width: 768px) {
          .quiz-header {
            padding: 16px;
            flex-direction: column;
            gap: 16px;
          }

          .quiz-content {
            padding: 16px;
          }

          .question-area {
            padding: 24px;
          }

          .question-header {
            flex-direction: column;
            gap: 16px;
          }

          .navigation-controls {
            flex-direction: column;
            gap: 16px;
          }

          .nav-center {
            order: -1;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-content {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
