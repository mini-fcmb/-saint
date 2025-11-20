// app/students/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Trash2,
  Image as ImageIcon,
  Edit3,
  Play,
  Calendar as CalendarIcon,
  Pencil,
  BarChart3,
  Upload,
  Download,
  BookOpen,
  Award,
  Users2,
  Eye,
  FileSpreadsheet,
  Calculator,
  Table,
  Save,
  AlertTriangle,
  EyeOff,
  RefreshCw,
  UserCheck,
  UserX,
  TrendingUp,
} from "lucide-react";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import { useLiveDate, useCalendar } from "../hooks/useDateUtils";
import { useNavigate } from "react-router-dom";

// === SHARED TYPES (SAME AS TEACHER DASHBOARD) ===
interface Question {
  id: number;
  text: string;
  image: File | null;
  imageUrl: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  id: string;
  name: string;
  questions: Question[];
  duration: number;
  scheduledDate: string;
  scheduledTime: string;
  status: "upcoming" | "active" | "expired";
  totalDuration: number;
  subject: string;
  maxScore: number;
  teacherName: string;
}

interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  subject: string;
  term: string;
  session: string;
  objScore: number;
  theoryScore: number;
  totalScore: number;
  percentage: number;
  grade: string;
  positionInClass?: number;
  remark: string;
}

interface Notification {
  id: string;
  type: "quiz" | "grade" | "announcement";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  quizId?: string;
  subject?: string;
  scheduledTime?: string;
}

interface ProgressData {
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  date: string;
  trend: number[];
}

// === REAL-TIME DATA HOOKS ===

// Hook to get teacher-uploaded quizzes from shared storage
const useTeacherQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    const loadTeacherQuizzes = () => {
      try {
        // Get quizzes from the same storage teachers use
        const savedQuizzes = localStorage.getItem("teacher-quizzes");
        if (savedQuizzes) {
          const teacherQuizzes: Quiz[] = JSON.parse(savedQuizzes);

          // Update quiz statuses in real-time
          const now = new Date();
          const updatedQuizzes = teacherQuizzes.map((quiz) => {
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
        }
      } catch (error) {
        console.error("Error loading teacher quizzes:", error);
      }
    };

    loadTeacherQuizzes();

    // Real-time updates - check every 30 seconds
    const interval = setInterval(loadTeacherQuizzes, 30000);
    return () => clearInterval(interval);
  }, []);

  return quizzes;
};

// Hook to get real-time notifications from teacher actions
const useStudentNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const loadNotifications = () => {
      try {
        // Get notifications from shared storage (teachers add to this)
        const savedNotifications = localStorage.getItem(
          "student-notifications"
        );
        if (savedNotifications) {
          const parsedNotifications = JSON.parse(savedNotifications).map(
            (n: any) => ({
              ...n,
              timestamp: new Date(n.timestamp),
            })
          );
          setNotifications(parsedNotifications);
        }
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    loadNotifications();

    // Check for new notifications every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  return { notifications, setNotifications };
};

// Hook to get student grades from teacher uploads
const useStudentGrades = (studentId: string) => {
  const [grades, setGrades] = useState<GradeRecord[]>([]);

  useEffect(() => {
    const loadGrades = () => {
      try {
        // Get grades from teacher uploads
        const savedGrades = localStorage.getItem("student-grades");
        if (savedGrades) {
          const allGrades: GradeRecord[] = JSON.parse(savedGrades);
          const studentGrades = allGrades.filter(
            (grade) => grade.studentId === studentId
          );
          setGrades(studentGrades);
        }
      } catch (error) {
        console.error("Error loading grades:", error);
      }
    };

    loadGrades();

    // Check for grade updates every 15 seconds
    const interval = setInterval(loadGrades, 15000);
    return () => clearInterval(interval);
  }, [studentId]);

  return grades;
};

// === QUIZ COMPONENTS (FOR STUDENTS TO TAKE QUIZZES) ===

interface TakeQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  studentId: string;
}

const TakeQuizModal: React.FC<TakeQuizModalProps> = ({
  isOpen,
  onClose,
  quiz,
  studentId,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60); // in seconds

  const currentQuestion = quiz.questions[currentQuestionIndex];

  // Timer countdown
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmitQuiz = () => {
    // Calculate score
    const score = quiz.questions.reduce((total, question, index) => {
      return total + (answers[index] === question.correctAnswer ? 1 : 0);
    }, 0);

    // Save submission
    const submission = {
      studentId,
      quizId: quiz.id,
      quizName: quiz.name,
      subject: quiz.subject,
      answers,
      score,
      maxScore: quiz.questions.length,
      percentage: Math.round((score / quiz.questions.length) * 100),
      submittedAt: new Date().toISOString(),
    };

    // Save to localStorage (teachers can see this)
    const existingSubmissions = JSON.parse(
      localStorage.getItem("student-quiz-submissions") || "{}"
    );
    existingSubmissions[`${studentId}-${quiz.id}`] = submission;
    localStorage.setItem(
      "student-quiz-submissions",
      JSON.stringify(existingSubmissions)
    );

    // Add notification for teacher
    const teacherNotifications = JSON.parse(
      localStorage.getItem("teacher-notifications") || "[]"
    );
    teacherNotifications.push({
      id: Date.now().toString(),
      type: "quiz-submission",
      title: "Quiz Submitted",
      message: `${submission.studentId} submitted ${quiz.name}`,
      timestamp: new Date().toISOString(),
      read: false,
      quizId: quiz.id,
    });
    localStorage.setItem(
      "teacher-notifications",
      JSON.stringify(teacherNotifications)
    );

    alert(`Quiz submitted! Score: ${score}/${quiz.questions.length}`);
    onClose();
  };

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content large-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>{quiz.name}</h2>
            <p>
              {quiz.subject} • Time Left: {formatTime(timeLeft)}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="quiz-progress">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>

          <div className="question-container">
            <h3>{currentQuestion.text}</h3>

            {currentQuestion.imageUrl && (
              <div className="question-image">
                <img src={currentQuestion.imageUrl} alt="Question" />
              </div>
            )}

            <div className="options-list">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`option ${
                    answers[currentQuestionIndex] === index ? "selected" : ""
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="option-text">{option}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="action-btn"
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>

          <div className="quiz-navigation">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                className={`nav-dot ${
                  currentQuestionIndex === index ? "active" : ""
                } ${answers[index] !== undefined ? "answered" : ""}`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <button className="action-btn primary" onClick={handleSubmitQuiz}>
              Submit Quiz
            </button>
          ) : (
            <button
              className="action-btn primary"
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// === PROGRESS CHART MODAL ===
interface ProgressChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressData: ProgressData[];
}

const ProgressChartModal: React.FC<ProgressChartModalProps> = ({
  isOpen,
  onClose,
  progressData,
}) => {
  const [showTrendline, setShowTrendline] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const filteredData = useMemo(() => {
    if (selectedSubject === "all") return progressData;
    return progressData.filter((data) => data.subject === selectedSubject);
  }, [progressData, selectedSubject]);

  const subjects = useMemo(() => {
    return [...new Set(progressData.map((data) => data.subject))];
  }, [progressData]);

  const averageProgress = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const total = filteredData.reduce((sum, data) => sum + data.percentage, 0);
    return Math.round(total / filteredData.length);
  }, [filteredData]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content large-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Academic Progress</h2>
            <p>Based on your quiz results and teacher-uploaded grades</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="progress-controls">
            <div className="control-group">
              <label>Subject</label>
              <select
                className="text-input"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="all">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            <div className="control-group">
              <label>View</label>
              <button
                className={`view-toggle ${showTrendline ? "active" : ""}`}
                onClick={() => setShowTrendline(!showTrendline)}
              >
                <TrendingUp size={16} />
                {showTrendline ? "Show Chart" : "Show Trendline"}
              </button>
            </div>
          </div>

          {/* Progress content remains the same as before */}
          {/* ... */}
        </div>
      </div>
    </div>
  );
};

// === TIMETABLE COMPONENT (USES REAL TEACHER QUIZZES) ===
interface TimetableProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: Quiz[];
}

const Timetable: React.FC<TimetableProps> = ({ isOpen, onClose, quizzes }) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const timetableData = useMemo(() => {
    const data: { [key: string]: Quiz[] } = {};
    days.forEach((day) => (data[day] = []));

    quizzes.forEach((quiz) => {
      const date = new Date(quiz.scheduledDate);
      const dayName = days[date.getDay()];
      if (data[dayName]) {
        data[dayName].push(quiz);
      }
    });

    // Sort quizzes by time within each day
    days.forEach((day) => {
      data[day].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    });

    return data;
  }, [quizzes]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content xl-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Exam Timetable</h2>
            <p>Automatically generated from teacher-uploaded quizzes</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="timetable-container">
            <table className="timetable">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Schedule</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day}>
                    <td className="day-column">
                      <strong>{day}</strong>
                    </td>
                    <td className="schedule-column">
                      {timetableData[day].length === 0 ? (
                        <div className="no-class">No scheduled exams</div>
                      ) : (
                        <div className="schedule-items">
                          {timetableData[day].map((quiz) => (
                            <div key={quiz.id} className="schedule-item">
                              <div className="subject-badge">
                                {quiz.subject}
                              </div>
                              <div className="quiz-details">
                                <strong>{quiz.name}</strong>
                                <span>Time: {quiz.scheduledTime}</span>
                                <span>Duration: {quiz.duration}min</span>
                                <span>Teacher: {quiz.teacherName}</span>
                                <span>
                                  Date:{" "}
                                  {new Date(
                                    quiz.scheduledDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <div className={`status status-${quiz.status}`}>
                                {quiz.status === "active"
                                  ? "Live"
                                  : quiz.status === "upcoming"
                                  ? "Upcoming"
                                  : "Expired"}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn primary" onClick={onClose}>
            Close Timetable
          </button>
        </div>
      </div>
    </div>
  );
};

// === NOTIFICATIONS PANEL (REAL-TIME FROM TEACHER ACTIONS) ===
interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content medium-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Notifications</h2>
            <p>Real-time updates from your teachers</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={48} color="#9ca3af" />
                <p>No notifications</p>
                <span>You're all caught up!</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    notification.read ? "read" : "unread"
                  }`}
                  onClick={() =>
                    !notification.read && onMarkAsRead(notification.id)
                  }
                >
                  <div className="notification-icon">
                    {notification.type === "quiz" && (
                      <FileText size={20} color="#3b82f6" />
                    )}
                    {notification.type === "grade" && (
                      <Award size={20} color="#10b981" />
                    )}
                    {notification.type === "announcement" && (
                      <Bell size={20} color="#f59e0b" />
                    )}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {notification.timestamp.toLocaleDateString()} at{" "}
                      {notification.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// === MAIN STUDENT DASHBOARD ===
const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [timetableOpen, setTimetableOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [takeQuizModalOpen, setTakeQuizModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  // REAL DATA HOOKS
  const teacherQuizzes = useTeacherQuizzes();
  const { notifications, setNotifications } = useStudentNotifications();
  const { user } = useFirebaseStore();
  const studentGrades = useStudentGrades(user?.uid || "student-1");

  // Calculate progress data from REAL grades
  const progressData = useMemo((): ProgressData[] => {
    return studentGrades.map((grade) => ({
      subject: grade.subject,
      score: grade.totalScore,
      maxScore: 100,
      percentage: grade.percentage,
      date: new Date().toISOString().split("T")[0],
      trend: [
        Math.max(0, grade.percentage - 10),
        grade.percentage,
        Math.min(100, grade.percentage + 5),
      ],
    }));
  }, [studentGrades]);

  // Calculate average progress
  const averageProgress = useMemo(() => {
    if (progressData.length === 0) return 0;
    const total = progressData.reduce((sum, data) => sum + data.percentage, 0);
    return Math.round(total / progressData.length);
  }, [progressData]);

  const dashArray = `${averageProgress} ${100 - averageProgress}`;

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );

    // Update in localStorage
    const updatedNotifications = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem(
      "student-notifications",
      JSON.stringify(updatedNotifications)
    );
  };

  const handleTakeQuiz = (quiz: Quiz) => {
    if (quiz.status !== "active") {
      alert("This quiz is not currently active. Please check the schedule.");
      return;
    }
    setSelectedQuiz(quiz);
    setTakeQuizModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Menu items for student dashboard
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "progress", label: "My Progress", icon: BarChart3 },
    { id: "timetable", label: "Timetable", icon: Calendar },
    { id: "quizzes", label: "Available Quizzes", icon: FileText },
  ];

  const upcomingQuizzes = useMemo(() => {
    return teacherQuizzes
      .filter((quiz) => quiz.status === "upcoming")
      .slice(0, 3);
  }, [teacherQuizzes]);

  const activeQuizzes = useMemo(() => {
    return teacherQuizzes.filter((quiz) => quiz.status === "active");
  }, [teacherQuizzes]);

  const recentGrades = useMemo(() => {
    return studentGrades.slice(0, 3);
  }, [studentGrades]);

  const firstName = user?.displayName?.split(" ")[0] || "Student";
  const fullName = user?.displayName || "Student Name";
  const email = user?.email || "student@example.com";

  return (
    <div
      className={`app ${
        progressModalOpen ||
        timetableOpen ||
        notificationsOpen ||
        takeQuizModalOpen
          ? "modal-open"
          : ""
      }`}
    >
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-img"></div>
            <span className="logo-text">SXaint</span>
            <span className="status online-indicator">
              <div className="online-dot"></div>
              Student Portal - Real-time Updates
            </span>
          </div>

          <div className="header-actions">
            <button className="icon-btn">
              <Search size={20} />
            </button>
            <button
              className="icon-btn"
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell size={20} />
              {notifications.filter((n) => !n.read).length > 0 && (
                <div className="notification-badge">
                  {notifications.filter((n) => !n.read).length}
                </div>
              )}
            </button>
            <button className="get-in-touch" onClick={handleLogout}>
              <i className="bx bx-log-out" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="layout">
        {/* Sidebar */}
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
                  onClick={() => {
                    setSelectedMenu(item.id);
                    if (item.id === "progress") setProgressModalOpen(true);
                    if (item.id === "timetable") setTimetableOpen(true);
                  }}
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
                <div className="student-info">
                  <strong>{firstName}</strong>
                  <span>Student</span>
                </div>
              </div>
              <div className="copyright">© SXaint MegaPend</div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main
          className={`main-content ${
            progressModalOpen ||
            timetableOpen ||
            notificationsOpen ||
            takeQuizModalOpen
              ? "blurred"
              : ""
          }`}
        >
          <div className="welcome">
            <h1>Welcome back, {firstName}!</h1>
            <p>Real-time updates from your teachers</p>
          </div>

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
                  strokeLinecap="round"
                />
              </svg>
              <div className="ring-text">{averageProgress}%</div>
            </div>
            <div>
              <h2>Your overall academic progress is {averageProgress}%</h2>
              <p>
                Based on {studentGrades.length} graded subjects from teachers
              </p>
            </div>
          </div>

          {/* Top Grid */}
          <div className="top-grid">
            <div className="card active-quizzes">
              <div className="card-header">
                <h3>Active Quizzes ({activeQuizzes.length})</h3>
                <span className="live-indicator-small">
                  <div className="live-dot"></div>
                  Live
                </span>
              </div>
              <div className="quiz-list">
                {activeQuizzes.length === 0 ? (
                  <div className="empty-state">No active quizzes right now</div>
                ) : (
                  activeQuizzes.map((quiz) => (
                    <div key={quiz.id} className="quiz-item">
                      <div className="quiz-icon">
                        <FileText size={24} color="#ef4444" />
                      </div>
                      <div className="quiz-info">
                        <h4>{quiz.name}</h4>
                        <p>
                          {quiz.subject} • {quiz.teacherName}
                        </p>
                        <span className="quiz-time">
                          Ends:{" "}
                          {new Date(
                            new Date(
                              `${quiz.scheduledDate}T${quiz.scheduledTime}`
                            ).getTime() +
                              quiz.totalDuration * 60000
                          ).toLocaleTimeString()}
                        </span>
                      </div>
                      <button
                        className="take-quiz-btn"
                        onClick={() => handleTakeQuiz(quiz)}
                      >
                        Take Quiz
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card recent-grades">
              <div className="card-header">
                <h3>Recent Grades</h3>
                <span>From teacher uploads</span>
              </div>
              <div className="grades-list">
                {recentGrades.length === 0 ? (
                  <div className="empty-state">No grades available yet</div>
                ) : (
                  recentGrades.map((grade) => (
                    <div key={grade.id} className="grade-item">
                      <div className="grade-badge">
                        {grade.subject.slice(0, 2)}
                      </div>
                      <div className="grade-info">
                        <h4>{grade.subject}</h4>
                        <p>Score: {grade.totalScore}/100</p>
                        <span>Position: {grade.positionInClass}</span>
                      </div>
                      <div
                        className={`grade-value grade-${grade.grade.toLowerCase()}`}
                      >
                        {grade.grade}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card quick-stats">
              <div className="card-header">
                <h3>Quick Stats</h3>
                <span>Real-time data</span>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">{teacherQuizzes.length}</div>
                  <div className="stat-label">Total Quizzes</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">{studentGrades.length}</div>
                  <div className="stat-label">Graded Subjects</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">
                    {
                      teacherQuizzes.filter((q) => q.status === "upcoming")
                        .length
                    }
                  </div>
                  <div className="stat-label">Upcoming</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">
                    {notifications.filter((n) => !n.read).length}
                  </div>
                  <div className="stat-label">Unread Notifications</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="bottom-grid">
            <div className="card upcoming-quizzes">
              <div className="card-header">
                <h3>Upcoming Quizzes</h3>
                <button
                  className="view-all"
                  onClick={() => setTimetableOpen(true)}
                >
                  View Timetable
                </button>
              </div>
              <div className="upcoming-list">
                {upcomingQuizzes.length === 0 ? (
                  <div className="empty-state">No upcoming quizzes</div>
                ) : (
                  upcomingQuizzes.map((quiz) => (
                    <div key={quiz.id} className="upcoming-item">
                      <div className="upcoming-date">
                        <strong>
                          {new Date(quiz.scheduledDate).getDate()}
                        </strong>
                        <span>
                          {new Date(quiz.scheduledDate).toLocaleDateString(
                            "en",
                            { month: "short" }
                          )}
                        </span>
                      </div>
                      <div className="upcoming-info">
                        <h4>{quiz.name}</h4>
                        <p>
                          {quiz.subject} at {quiz.scheduledTime}
                        </p>
                        <span>Teacher: {quiz.teacherName}</span>
                      </div>
                      <div className="upcoming-status upcoming">Upcoming</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card notifications-preview">
              <div className="card-header">
                <h3>Recent Notifications</h3>
                <button
                  className="view-all"
                  onClick={() => setNotificationsOpen(true)}
                >
                  View all
                </button>
              </div>
              <div className="notifications-list-preview">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="notification-preview">
                    <div className="notification-type">
                      {notification.type === "quiz" && <FileText size={16} />}
                      {notification.type === "grade" && <Award size={16} />}
                    </div>
                    <div className="notification-content">
                      <p>{notification.title}</p>
                      <span>{notification.timestamp.toLocaleDateString()}</span>
                    </div>
                    {!notification.read && (
                      <div className="unread-indicator"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Profile Card */}
        <div
          className={`profile-card ${
            progressModalOpen ||
            timetableOpen ||
            notificationsOpen ||
            takeQuizModalOpen
              ? "blurred"
              : ""
          }`}
        >
          <div className="profile-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h4>{fullName}</h4>
            <p>{email}</p>
            <div className="stats">
              <div>
                <strong>Average: {averageProgress}%</strong>
              </div>
              <div>
                <strong>Quizzes: {teacherQuizzes.length}</strong>
              </div>
            </div>
          </div>
          <button className="profile-arrow">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Modals */}
      <ProgressChartModal
        isOpen={progressModalOpen}
        onClose={() => setProgressModalOpen(false)}
        progressData={progressData}
      />

      <Timetable
        isOpen={timetableOpen}
        onClose={() => setTimetableOpen(false)}
        quizzes={teacherQuizzes}
      />

      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
      />

      {selectedQuiz && (
        <TakeQuizModal
          isOpen={takeQuizModalOpen}
          onClose={() => {
            setTakeQuizModalOpen(false);
            setSelectedQuiz(null);
          }}
          quiz={selectedQuiz}
          studentId={user?.uid || "student-1"}
        />
      )}

      <style jsx>{`
        /* Add student-specific styles here */
        .take-quiz-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .take-quiz-btn:hover {
          background: #dc2626;
        }

        .live-indicator-small {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #ef4444;
          font-weight: 600;
        }

        .active-quizzes .quiz-item {
          border-left: 4px solid #ef4444;
        }

        .app {
          position: relative;
          min-height: 100vh;
        }

        .app.modal-open {
          overflow: hidden;
        }

        .main-content.blurred,
        .profile-card.blurred {
          filter: blur(4px);
          pointer-events: none;
          user-select: none;
        }

        /* Enhanced Live Monitoring Styles */
        .monitoring-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .refresh-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .quiz-selector {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          font-size: 12px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-in-progress {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-submitted {
          background: #d1fae5;
          color: #065f46;
        }

        .status-violation {
          background: #fef2f2;
          color: #dc2626;
        }

        .status-expired {
          background: #f3f4f6;
          color: #6b7280;
        }

        .student-details {
          flex: 1;
        }

        .student-name-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .violations-list {
          margin-top: 8px;
          padding: 8px;
          width: 300px;
          background: #fef2f2;
          border-radius: 6px;
          border-left: 3px solid #ef4444;
        }

        .violation-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          font-size: 11px;
        }

        .violation-icon {
          font-size: 12px;
        }

        .violation-desc {
          flex: 1;
          color: #374151;
        }

        .violation-time {
          color: #6b7280;
          font-size: 10px;
        }

        .more-violations {
          font-size: 10px;
          color: #ef4444;
          font-weight: 600;
          margin-top: 4px;
        }

        /* Enhanced Grade Management Styles */
        .obj-score-cell {
          background: #f0f9ff;
        }

        .auto-score-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 8px;
        }

        .score-value {
          font-weight: 600;
          color: #1e40af;
        }

        .auto-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .quiz-results-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #0369a1;
        }

        /* Add all previous CSS styles here */
        /* ... (include all previous CSS from the original code) */

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .xl-modal {
          max-width: 95vw;
          max-height: 90vh;
        }

        .medium-modal {
          max-width: 600px;
        }

        .small-modal {
          max-width: 500px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 32px 32px 0;
          margin-bottom: 24px;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }

        .modal-body {
          padding: 0 32px;
          overflow-y: auto;
          flex: 1;
          scrollbar-width: thin;
          scrollbar-color: #c7d2fe transparent;
        }

        .modal-body::-webkit-scrollbar {
          width: 6px;
        }

        .modal-body::-webkit-scrollbar-track {
          background: transparent;
        }

        .modal-body::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 3px;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
          background: #a5b4fc;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 24px 32px 32px;
          border-top: 1px solid #e5e7eb;
          position: sticky;
          bottom: 0;
          background: white;
          z-index: 10;
          gap: 12px;
        }

        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background: #f3f4f6;
        }

        .action-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .action-btn.primary {
          background: #4f46e5;
          color: white;
        }

        .action-btn.primary:hover {
          background: #4338ca;
        }

        .action-btn.export-btn {
          background: #f59e0b;
          color: white;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn.export-btn:hover {
          background: #d97706;
        }

        /* Performance Menu Styles */
        .performance-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          padding: 20px;
        }

        .performance-menu-content {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 800px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .performance-menu-header {
          padding: 32px 32px 0;
          margin-bottom: 24px;
          position: relative;
        }

        .performance-menu-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .performance-menu-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .performance-menu-grid {
          padding: 0 24px 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          overflow-y: auto;
        }

        .performance-menu-item {
          display: flex;
          align-items: center;
          padding: 20px;
          border: 2px solid #f3f4f6;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          gap: 16px;
        }

        .performance-menu-item:hover {
          border-color: #4f46e5;
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .menu-item-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-item-content {
          flex: 1;
        }

        .menu-item-content h4 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .menu-item-content p {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .menu-item-arrow {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .performance-menu-item:hover .menu-item-arrow {
          opacity: 1;
        }

        /* Add all remaining CSS styles from the original code */
        /* ... (include all the CSS from the previous implementation) */

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
        .online-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
          font-weight: 600;
        }
        .online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
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
          background: #4299e1;
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
          color: #4299e1;
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
          background: #4299e1;
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
          cursor: pointer;
        }
        .create-class-link {
          background: transparent;
          color: #4299e1;
          border: none;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
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
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
            filter 0.3s ease;
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
          background: #4299e1;
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
          color: #4299e1;
          text-decoration: none;
          font-weight: 600;
        }

        /* Working Hours Bar Chart Styles */
        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          height: 160px;
          margin-top: 20px;
          padding: 0 10px;
        }
        .bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
        }
        .bar-container {
          height: 120px;
          display: flex;
          align-items: flex-end;
          width: 100%;
          position: relative;
        }
        .bar {
          width: 100%;
          border-radius: 6px 6px 0 0;
          transition: height 0.3s ease;
          position: relative;
          min-height: 4px;
        }
        .bar.online {
          background: #10b981;
        }
        .bar.offline {
          background: #e5e7eb;
        }
        .bar.today {
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        .growing-indicator {
          position: absolute;
          top: -2px;
          left: 0;
          right: 0;
          height: 4px;
          background: #34d399;
          border-radius: 2px;
          animation: grow 2s ease-in-out infinite;
        }
        @keyframes grow {
          0% {
            transform: scaleX(0);
            opacity: 0;
          }
          50% {
            transform: scaleX(1);
            opacity: 1;
          }
          100% {
            transform: scaleX(0);
            opacity: 0;
          }
        }
        .minutes-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
        }
        .today-label {
          font-weight: 700;
          color: #111827;
        }

        .total {
          font-size: 14px;
          color: #6b7280;
          margin-top: 12px;
          text-align: center;
        }
        .legend {
          display: flex;
          gap: 24px;
          font-size: 13px;
          color: #6b7280;
          margin-top: 8px;
          justify-content: center;
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
          max-height: 400px;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .test-list::-webkit-scrollbar,
        .class-list::-webkit-scrollbar {
          display: none;
        }
        .test-item,
        .class-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 12px;
          transition: background-color 0.2s;
        }
        .test-item:hover {
          background: #f8fafc;
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
        .test-title-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        .test-title-section h4 {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          flex: 1;
        }
        .test-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .test-item:hover .test-actions {
          opacity: 1;
        }
        .edit-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .edit-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }
        .test-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .test-meta span {
          font-size: 13px;
          color: #6b7280;
          display: flex;
          align-items: center;
          gap: 6px;
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
          padding: 6px 12px;
          border-radius: 20px;
          background: #f3f4f6;
        }
        .status.active {
          background: #d1fae5;
          color: #065f46;
        }
        .status.upcoming {
          background: #fef3c7;
          color: #92400e;
        }
        .status.expired {
          background: #fee2e2;
          color: #991b1b;
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
          background: #4299e1;
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
          width: 380px;
          background: #fff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 20px;
          z-index: 40;
          transition: filter 0.3s ease;
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
          color: #4299e1;
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
          background: #4299e1;
          color: #fff;
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
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .class-list-modal-content::-webkit-scrollbar {
          display: none;
        }
        .students-list {
          max-height: 400px;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .students-list::-webkit-scrollbar {
          display: none;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-radius: 40px;
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

        /* Grade Management Specific Styles */
        .grade-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-group label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .action-buttons .action-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-btn.edit {
          background: #3b82f6;
          color: white;
        }

        .action-btn.edit:hover {
          background: #2563eb;
        }

        .action-btn.cancel {
          background: #6b7280;
          color: white;
        }

        .action-btn.cancel:hover {
          background: #4b5563;
        }

        .action-btn.save {
          background: #10b981;
          color: white;
        }

        .action-btn.save:hover:not(:disabled) {
          background: #059669;
        }

        .action-btn.save:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .action-btn.export {
          background: #f59e0b;
          color: white;
        }

        .action-btn.export:hover {
          background: #d97706;
        }

        .grades-table-container {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .grades-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          background: white;
        }

        .grades-table th {
          background: #f8fafc;
          padding: 12px 8px;
          text-align: center;
          font-weight: 600;
          color: #374151;
          border: 1px solid #e5e7eb;
          white-space: nowrap;
        }

        .grades-table td {
          padding: 8px;
          text-align: center;
          border: 1px solid #e5e7eb;
          vertical-align: middle;
        }

        .max-scores-row th {
          background: #e5e7eb;
          font-size: 11px;
          color: #6b7280;
        }

        .grade-row:hover {
          background: #f9fafb;
        }

        .serial-number {
          font-weight: 600;
          color: #374151;
          background: #f8fafc;
        }

        .student-name {
          text-align: left;
          font-weight: 600;
          min-width: 150px;
        }

        .class-name {
          min-width: 100px;
        }

        .score-input {
          width: 60px;
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          text-align: center;
          font-size: 12px;
        }

        .score-input:disabled {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .score-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .total-score,
        .percentage {
          font-weight: 700;
          background: #f0f9ff;
        }

        .grade {
          font-weight: 700;
          border-radius: 4px;
          padding: 4px 8px;
        }

        .grade-a1 {
          background: #dcfce7;
          color: #166534;
        }
        .grade-b2 {
          background: #bbf7d0;
          color: #15803d;
        }
        .grade-b3 {
          background: #86efac;
          color: #15803d;
        }
        .grade-c4 {
          background: #fef9c3;
          color: #854d0e;
        }
        .grade-c5 {
          background: #fef08a;
          color: #854d0e;
        }
        .grade-c6 {
          background: #fde047;
          color: #854d0e;
        }
        .grade-d7 {
          background: #fed7aa;
          color: #9a3412;
        }
        .grade-e8 {
          background: #fdba74;
          color: #9a3412;
        }
        .grade-f9 {
          background: #fecaca;
          color: #991b1b;
        }

        .position {
          font-weight: 700;
          color: #1e40af;
        }

        .remark {
          font-weight: 600;
          border-radius: 4px;
          padding: 4px 8px;
          min-width: 80px;
        }

        .remark.excellent {
          background: #dcfce7;
          color: #166534;
        }
        .remark.very-good {
          background: #bbf7d0;
          color: #15803d;
        }
        .remark.good {
          background: #86efac;
          color: #15803d;
        }
        .remark.credit {
          background: #fef9c3;
          color: #854d0e;
        }
        .remark.pass {
          background: #fed7aa;
          color: #9a3412;
        }
        .remark.fail {
          background: #fecaca;
          color: #991b1b;
        }

        .grade-legend {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }

        .grade-legend h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #374151;
        }

        .legend-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .grade-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 11px;
          min-width: 30px;
          text-align: center;
        }

        .grade-range {
          font-size: 12px;
          color: #6b7280;
          flex: 1;
        }

        .grade-remark {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
        }

        .footer-stats {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .footer-stats .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .footer-stats .stat-label {
          font-size: 12px;
          color: #6b7280;
        }

        .footer-stats .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #1e40af;
        }

        /* Live Monitoring Enhanced Styles */
        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ef4444;
          font-weight: 600;
          font-size: 14px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          animation: pulse 1s infinite;
        }

        .monitoring-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .stat-number {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: #4299e1;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .students-monitoring {
          margin-top: 24px;
        }

        .students-monitoring h4 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #111827;
        }

        .monitoring-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .monitoring-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: white;
        }

        .student-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .student-avatar-small {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e0e7ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #4299e1;
          font-size: 14px;
          flex-shrink: 0;
        }

        .student-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .progress-display {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 140px;
        }

        .progress-bar {
          width: 120px;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          min-width: 40px;
        }

        /* Upload CA Modal Styles */
        .upload-method-selector {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .method-btn {
          flex: 1;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .method-btn.active {
          border-color: #4f46e5;
          background: #eef2ff;
          color: #4f46e5;
        }

        .method-btn:hover:not(.active) {
          border-color: #d1d5db;
        }

        .scores-table {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }

        .score-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          align-items: center;
        }

        .score-row:last-child {
          border-bottom: none;
        }

        .csv-upload-section {
          text-align: center;
          padding: 40px 20px;
        }

        .upload-area {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 40px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .upload-area:hover {
          border-color: #9ca3af;
        }

        .upload-csv-btn {
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          margin: 16px 0 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        /* Create Quiz Modal Styles */
        .modal-title-section h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .question-counter {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 32px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .question-textarea {
          width: 100%;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
          transition: border-color 0.2s;
          line-height: 1.5;
        }

        .question-textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .image-upload-section {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .image-upload-section:hover {
          border-color: #9ca3af;
        }

        .image-preview {
          position: relative;
          padding: 20px;
          text-align: center;
        }

        .preview-image {
          max-width: 100%;
          max-height: 200px;
          border-radius: 8px;
          margin-bottom: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .remove-image-btn {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 auto;
          transition: background-color 0.2s;
        }

        .remove-image-btn:hover {
          background: #dc2626;
        }

        .image-upload-area {
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .image-upload-area:hover {
          background: #f9fafb;
        }

        .image-input {
          display: none;
        }

        .upload-label {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .upload-label p {
          font-size: 16px;
          color: #374151;
          margin: 0;
          font-weight: 500;
        }

        .upload-label span {
          font-size: 14px;
          color: #6b7280;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .option-item {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          background: #f9fafb;
          transition: all 0.2s;
          position: relative;
        }

        .option-item:hover {
          border-color: #d1d5db;
          background: #f3f4f6;
        }

        .option-item:focus-within {
          border-color: #4f46e5;
          background: #f8fafc;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .option-label {
          font-size: 14px;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .correct-answer-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: white;
          border-radius: 20px;
          border: 1px solid #d1d5db;
          transition: all 0.2s;
        }

        .correct-answer-selector:hover {
          border-color: #9ca3af;
        }

        .correct-answer-selector:has(.correct-radio:checked) {
          background: #d1fae5;
          border-color: #10b981;
        }

        .correct-radio {
          margin: 0;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .correct-answer-selector label {
          font-size: 12px;
          color: #059669;
          font-weight: 600;
          margin: 0;
          cursor: pointer;
          user-select: none;
        }

        .correct-answer-selector:has(.correct-radio:checked) label {
          color: #065f46;
        }

        .option-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
          font-weight: 500;
        }

        .option-input:focus {
          outline: none;
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .option-input::placeholder {
          color: #9ca3af;
          font-weight: normal;
        }

        .modal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px 32px;
          border-top: 1px solid #e5e7eb;
          position: sticky;
          bottom: 0;
          background: white;
          z-index: 10;
          border-radius: 40px;
          gap: 16px;
        }

        .footer-left,
        .footer-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-btn {
          background: white;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .nav-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .remove-question-btn {
          background: white;
          border: 2px solid #ef4444;
          color: #ef4444;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .remove-question-btn:hover {
          background: #fef2f2;
          border-color: #dc2626;
        }

        .add-question-btn {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .add-question-btn:hover {
          background: #059669;
        }

        .action-btn.save {
          background: #4f46e5;
          color: white;
        }

        .action-btn.save:hover:not(:disabled) {
          background: #4338ca;
        }

        .action-btn.save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Quiz Name Modal Styles */
        .text-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
          font-weight: 500;
        }

        .text-input:focus {
          outline: none;
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .text-input::placeholder {
          color: #9ca3af;
          font-weight: normal;
        }

        .quiz-summary {
          background: #f8fafc;
          border-radius: 16px;
          padding: 24px;
          border: 2px solid #e2e8f0;
          margin-top: 8px;
        }

        .quiz-summary h4 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 16px 0;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
        }

        .quiz-summary p {
          font-size: 14px;
          color: #475569;
          margin: 12px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .quiz-summary p strong {
          color: #334155;
          font-weight: 600;
          min-width: 120px;
        }

        .action-btn.cancel {
          background: white;
          color: #374151;
          border: 2px solid #d1d5db;
        }

        .action-btn.cancel:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .top-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .bottom-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .main-content {
            padding: 32px;
          }
        }

        @media (max-width: 768px) {
          .header {
            padding: 0 24px;
          }
          .main-content {
            padding: 24px;
            margin-left: 0;
          }
          .sidebar:not(.open) ~ .main-content {
            margin-left: 0;
          }
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .profile-card {
            position: static;
            width: 100%;
            margin-top: 24px;
          }
          .progress-card {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }
          .monitoring-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          .monitoring-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .progress-display {
            width: 100%;
            justify-content: space-between;
          }
          .grade-controls {
            grid-template-columns: 1fr;
          }
          .action-buttons {
            flex-direction: column;
          }
          .modal-footer {
            flex-direction: column;
          }
          .footer-left,
          .footer-right {
            justify-content: center;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .performance-menu-grid {
            grid-template-columns: 1fr;
          }
          .monitoring-stats {
            grid-template-columns: 1fr;
          }
        }

        .loading,
        .error {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 18px;
        }
        .error {
          color: #ef4444;
          flex-direction: column;
          gap: 16px;
        }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
