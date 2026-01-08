// app/students/page.tsx
"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Search,
  Bell,
  Home,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  X,
  Play,
  Calendar as CalendarIcon,
  BookOpen,
  Award,
  LogOut,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  BarChart3,
  UserCheck,
  RefreshCw,
  UserX,
  Building,
  Table,
  Upload,
  Download,
  Book,
  FileSpreadsheet,
  Calculator,
  Save,
  Users2,
} from "lucide-react";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import { useLiveDate, useCalendar } from "../hooks/useDateUtils";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import logo from "../assets/logo.png";

// Types
interface Student {
  id: string;
  first: string;
  last: string;
  email: string;
  progress: number;
  classId: string;
  className: string;
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
  targetClass?: string;
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

interface WorkingHoursData {
  day: string;
  minutes: number;
  online: boolean;
  startTime?: Date;
}

interface EnhancedMonitoringData {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  quizId: string;
  quizName: string;
  quizClass: string;
  status: "in-progress" | "submitted" | "violation" | "expired";
  progress: number;
  timeSpent: string;
  currentQuestion: number;
  totalQuestions: number;
  violations: EnhancedViolation[];
  lastActivity: Date;
  score?: number;
  maxScore?: number;
  studentEmail?: string;
}

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

interface EnhancedViolation {
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
  studentId: string;
  studentName: string;
  studentClass: string;
  quizId: string;
  quizName: string;
  quizClass: string;
  browser: string;
  deviceType: string;
}

// Enhanced Live Monitoring Modal Component for Students
interface StudentLiveMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: Quiz[];
  studentId: string;
  studentName: string;
  studentClass?: string;
  user: any;
}

const StudentLiveMonitoringModal: React.FC<StudentLiveMonitoringModalProps> = ({
  isOpen,
  onClose,
  quizzes,
  studentId,
  studentName,
  studentClass,
  user,
}) => {
  const [monitoringData, setMonitoringData] = useState<
    EnhancedMonitoringData[]
  >([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");

  // Load student's own monitoring data
  useEffect(() => {
    if (!isOpen || !studentId || !user?.email) return;

    const loadMonitoringData = async () => {
      try {
        // Load from Firestore - Method 1: Direct studentId match
        const monitoringRef = collection(db, "monitoring");
        const q = query(monitoringRef, where("studentId", "==", studentId));
        const querySnapshot = await getDocs(q);

        const firestoreData: EnhancedMonitoringData[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          firestoreData.push({
            id: doc.id,
            studentId: data.studentId || "",
            studentName: data.studentName || "",
            studentClass: data.studentClass || "",
            quizId: data.quizId || "",
            quizName: data.quizName || "",
            quizClass: data.quizClass || "",
            status: data.status || "in-progress",
            progress: data.progress || 0,
            timeSpent: data.timeSpent || "00:00",
            currentQuestion: data.currentQuestion || 0,
            totalQuestions: data.totalQuestions || 0,
            violations: (data.violations || []).map((v: any) => ({
              ...v,
              timestamp: v.timestamp?.toDate() || new Date(),
            })),
            lastActivity: data.lastActivity?.toDate() || new Date(),
            score: data.score,
            maxScore: data.maxScore,
            studentEmail: data.studentEmail || "",
          } as EnhancedMonitoringData);
        });

        // Method 2: Also check by student email
        const emailQ = query(
          monitoringRef,
          where("studentEmail", "==", user.email)
        );
        const emailSnapshot = await getDocs(emailQ);

        const emailData: EnhancedMonitoringData[] = [];

        emailSnapshot.forEach((doc) => {
          const data = doc.data();
          const emailItem: EnhancedMonitoringData = {
            id: doc.id,
            studentId: data.studentId || "",
            studentName: data.studentName || "",
            studentClass: data.studentClass || "",
            quizId: data.quizId || "",
            quizName: data.quizName || "",
            quizClass: data.quizClass || "",
            status: data.status || "in-progress",
            progress: data.progress || 0,
            timeSpent: data.timeSpent || "00:00",
            currentQuestion: data.currentQuestion || 0,
            totalQuestions: data.totalQuestions || 0,
            violations: (data.violations || []).map((v: any) => ({
              ...v,
              timestamp: v.timestamp?.toDate() || new Date(),
            })),
            lastActivity: data.lastActivity?.toDate() || new Date(),
            score: data.score,
            maxScore: data.maxScore,
            studentEmail: data.studentEmail || "",
          };
          emailData.push(emailItem);
        });

        // Combine both data sources
        const allData = [...firestoreData, ...emailData];

        // Remove duplicates (same quizId for same student)
        const uniqueData = Array.from(
          new Map(
            allData.map((item) => [`${item.quizId}_${item.studentId}`, item])
          ).values()
        );

        // Filter for current student (double-check)
        const studentData = uniqueData.filter(
          (data) =>
            data.studentId === studentId || data.studentEmail === user.email
        );

        setMonitoringData(studentData);
      } catch (error) {
        console.error("Error loading monitoring data from Firestore:", error);
        // Don't fallback to localStorage
      }
    };

    loadMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(loadMonitoringData, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh, studentId, user]);

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-progress":
        return <RefreshCw size={16} color="#3b82f6" />;
      case "submitted":
        return <CheckCircle size={16} color="#10b981" />;
      case "violation":
        return <AlertTriangle size={16} color="#ef4444" />;
      case "expired":
        return <Clock size={16} color="#6b7280" />;
      default:
        return <Clock size={16} color="#6b7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "#3b82f6";
      case "submitted":
        return "#10b981";
      case "violation":
        return "#ef4444";
      case "expired":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case "keyboard":
        return "⌨️";
      case "right-click":
        return "🖱️";
      case "tab-switch":
        return "🔍";
      case "dev-tools":
        return "⚙️";
      case "fullscreen-exit":
        return "📱";
      default:
        return "⚠️";
    }
  };

  const getViolationSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "#f59e0b";
      case "medium":
        return "#f97316";
      case "high":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  // Filter data based on selected quiz
  const filteredData =
    selectedQuiz === "all"
      ? monitoringData
      : monitoringData.filter((data) => data.quizId === selectedQuiz);

  // Calculate statistics for current student
  const activeQuizzes = filteredData.filter(
    (d) => d.status === "in-progress"
  ).length;
  const submittedQuizzes = filteredData.filter(
    (d) => d.status === "submitted"
  ).length;
  const violationQuizzes = filteredData.filter(
    (d) => d.status === "violation"
  ).length;
  const totalViolations = filteredData.reduce(
    (total, data) => total + data.violations.length,
    0
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content xl-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Your Quiz Activity Monitor</h2>
            <p>Track your quiz performance and activities</p>
          </div>
          <div className="monitoring-controls">
            <div className="live-indicator">
              <div className="live-dot"></div>
              Live Tracking
            </div>
            <button
              className={`refresh-btn ${autoRefresh ? "active" : ""}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw size={16} />
              Auto-refresh: {autoRefresh ? "ON" : "OFF"}
            </button>
            <select
              className="quiz-selector"
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
            >
              <option value="all">All Quizzes</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.name} ({quiz.subject})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-body">
          {/* Student Stats */}
          <div className="monitoring-stats">
            <div className="stat-card">
              <UserCheck size={24} color="#3b82f6" />
              <span className="stat-number">{activeQuizzes}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-card">
              <CheckCircle size={24} color="#10b981" />
              <span className="stat-number">{submittedQuizzes}</span>
              <span className="stat-label">Submitted</span>
            </div>
            <div className="stat-card">
              <AlertTriangle size={24} color="#ef4444" />
              <span className="stat-number">{violationQuizzes}</span>
              <span className="stat-label">Violations</span>
            </div>
            <div className="stat-card">
              <Users size={24} color="#6b7280" />
              <span className="stat-number">{filteredData.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>

          {/* Student's Quiz Activities */}
          <div className="students-monitoring">
            <h4>Your Quiz Activities ({filteredData.length} quizzes)</h4>
            <div className="monitoring-list">
              {filteredData.length === 0 ? (
                <div className="empty-state">
                  <EyeOff size={48} color="#9ca3af" />
                  <p>No monitoring data available</p>
                  <span>Start a quiz to see your activity here</span>
                </div>
              ) : (
                filteredData.map((data) => (
                  <div key={data.quizId} className="monitoring-item">
                    <div className="student-info">
                      <div className="student-avatar-small">
                        {studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="student-details">
                        <div className="student-name-section">
                          <strong>{studentName}</strong>
                          <span
                            className={`status-badge status-${data.status}`}
                          >
                            {getStatusIcon(data.status)}
                            {data.status === "in-progress"
                              ? "In Progress"
                              : data.status === "submitted"
                              ? "Submitted"
                              : data.status === "violation"
                              ? "Violation Detected"
                              : "Expired"}
                          </span>
                        </div>
                        <div className="student-meta">
                          <span>
                            <FileText size={12} /> Quiz: {data.quizName}
                          </span>
                          <span>
                            <Building size={12} /> Class: {data.studentClass}
                          </span>
                          <span>
                            <Clock size={12} /> Time Spent: {data.timeSpent}
                          </span>
                          <span>
                            <BookOpen size={12} /> Q: {data.currentQuestion}/
                            {data.totalQuestions}
                          </span>
                          {data.score !== undefined && (
                            <span>
                              <Award size={12} /> Score: {data.score}/
                              {data.maxScore}
                            </span>
                          )}
                        </div>
                        {data.violations.length > 0 && (
                          <div className="violations-list">
                            <div className="violation-header">
                              <strong>
                                Violations ({data.violations.length})
                              </strong>
                            </div>
                            {data.violations.map((violation, index) => (
                              <div key={index} className="violation-item">
                                <div className="violation-meta">
                                  <span className="violation-icon">
                                    {getViolationIcon(violation.type)}
                                  </span>
                                  <span className="violation-type">
                                    {violation.type.replace("-", " ")}
                                  </span>
                                  <span
                                    className="severity-badge"
                                    style={{
                                      backgroundColor:
                                        getViolationSeverityColor(
                                          violation.severity
                                        ),
                                      color: "white",
                                    }}
                                  >
                                    {violation.severity}
                                  </span>
                                </div>
                                <span className="violation-desc">
                                  {violation.description}
                                </span>
                                <span className="violation-time">
                                  {violation.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="progress-display">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${data.progress}%`,
                            backgroundColor: getStatusColor(data.status),
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{data.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn export-btn">
            <Download size={16} />
            Export Report
          </button>
          <button className="action-btn primary" onClick={onClose}>
            Close Monitor
          </button>
        </div>
      </div>
    </div>
  );
};

// Performance Menu Component
const PerformanceMenu: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect: (feature: string) => void;
}> = ({ isOpen, onClose, onFeatureSelect }) => {
  if (!isOpen) return null;

  const menuItems = [
    {
      id: "analytics",
      label: "Performance Analytics",
      description: "View detailed performance reports and insights",
      icon: BarChart3,
      color: "#3B82F6",
    },
    {
      id: "grades",
      label: "Grade History",
      description: "Track your grades over time",
      icon: Table,
      color: "#10B981",
    },
    {
      id: "progress",
      label: "Learning Progress",
      description: "Monitor your course completion and progress",
      icon: Award,
      color: "#8B5CF6",
    },
    {
      id: "live-monitoring",
      label: "Activity Monitor",
      description: "View your quiz activities and violations",
      icon: Eye,
      color: "#EF4444",
    },
    {
      id: "ranking",
      label: "Class Ranking",
      description: "See where you stand in your class",
      icon: Users2,
      color: "#F59E0B",
    },
  ];

  return (
    <div className="performance-menu-overlay" onClick={onClose}>
      <div
        className="performance-menu-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="performance-menu-header">
          <h2>Performance Dashboard</h2>
          <p>Access detailed performance metrics and insights</p>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="performance-menu-grid">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="performance-menu-item"
              onClick={() => onFeatureSelect(item.id)}
            >
              <div
                className="menu-item-icon"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <span style={{ fontSize: "24px" }}></span>
              </div>
              <div className="menu-item-content">
                <h4>{item.label}</h4>
                <p>{item.description}</p>
              </div>
              <div className="menu-item-arrow">
                <ChevronRight size={20} color={item.color} />
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="action-btn cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style>{`
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
      `}</style>
    </div>
  );
};

// Class List Panel Component - UPDATED to filter classmates by same class
const ClassListPanel: React.FC<{
  students: Student[];
  isOpen: boolean;
  toggle: () => void;
  loading: boolean;
  currentUserClass?: string;
}> = ({ students, isOpen, toggle, loading, currentUserClass }) => {
  // Filter students by same class as current user
  const classmates = useMemo(() => {
    if (!currentUserClass) return [];
    return students.filter(
      (student) =>
        student.className === currentUserClass ||
        student.classId === currentUserClass
    );
  }, [students, currentUserClass]);

  return (
    <div className="card group-chats" id="group-chats">
      <div className="card-header">
        <h3>Classmates ({classmates.length})</h3>
        <button onClick={toggle} className="view-all">
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading classmates…</div>
      ) : !isOpen ? (
        <div className="class-list-collapsed" onClick={toggle}>
          {classmates.slice(0, 12).map((s) => (
            <div
              key={s.id}
              className="initial-circle"
              title={`${s.first} ${s.last}`}
            >
              {s.first[0].toUpperCase()}
              {s.last[0].toUpperCase()}
            </div>
          ))}
          {classmates.length > 12 && (
            <div className="initial-circle">+{classmates.length - 12}</div>
          )}
          {classmates.length === 0 && <div className="initial-circle">-</div>}
        </div>
      ) : (
        <div className="class-list-modal" onClick={toggle}>
          <div
            className="class-list-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Classmates ({classmates.length})</h3>
              <p
                style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}
              >
                Class: {currentUserClass || "Not specified"}
              </p>
              <button className="modal-close" onClick={toggle}>
                <X size={20} />
              </button>
            </div>
            {classmates.length === 0 ? (
              <div className="empty-state">
                {currentUserClass
                  ? `No classmates found in class: ${currentUserClass}`
                  : "No classmates found in your class."}
              </div>
            ) : (
              <div className="students-list">
                {classmates.map((s) => (
                  <div key={s.id} className="student-row">
                    <div
                      className="student-avatar"
                      title={`${s.first} ${s.last}`}
                    >
                      {s.first[0].toUpperCase()}
                      {s.last[0].toUpperCase()}
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
                      {s.className && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#4f46e5",
                            marginTop: "2px",
                          }}
                        >
                          {s.className}
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, color: "#4f46e5" }}>
                      {s.progress}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Quiz Instructions Modal Component
const QuizInstructionsModal: React.FC<{
  quiz: Quiz;
  onStart: () => void;
  onClose: () => void;
}> = ({ quiz, onStart, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content large-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <Lock size={32} />
            <div>
              <h2>Quiz Instructions</h2>
              <p>
                {quiz.name} - {quiz.subject}
              </p>
            </div>
          </div>
        </div>

        <div className="modal-body">
          <div className="instructions-content">
            <div className="warning-section">
              <AlertTriangle size={24} />
              <h3>STRICT MODE ENABLED</h3>
              <p>
                This quiz runs in strict monitoring mode with enhanced security:
              </p>
            </div>

            <div className="rules-grid">
              <div className="rule-card">
                <div className="rule-icon">🚫</div>
                <div className="rule-content">
                  <h4>Keyboard Locked</h4>
                  <p>All keyboard keys are disabled during the quiz</p>
                </div>
              </div>
              <div className="rule-card">
                <div className="rule-icon">🚫</div>
                <div className="rule-content">
                  <h4>No Tab Switching</h4>
                  <p>Browser navigation and tab switching blocked</p>
                </div>
              </div>
              <div className="rule-card">
                <div className="rule-icon">🚫</div>
                <div className="rule-content">
                  <h4>Right-click Disabled</h4>
                  <p>Context menu and right-click completely blocked</p>
                </div>
              </div>
              <div className="rule-card">
                <div className="rule-icon">⚠️</div>
                <div className="rule-content">
                  <h4>3 Violation Limit</h4>
                  <p>Quiz auto-submits after 3 violations</p>
                </div>
              </div>
              <div className="rule-card">
                <div className="rule-icon">🔒</div>
                <div className="rule-content">
                  <h4>Fullscreen Required</h4>
                  <p>Must stay in fullscreen mode throughout</p>
                </div>
              </div>
              <div className="rule-card">
                <div className="rule-icon">📹</div>
                <div className="rule-content">
                  <h4>Activity Monitoring</h4>
                  <p>All actions are monitored and recorded</p>
                </div>
              </div>
            </div>

            <div className="quiz-info-section">
              <h4>Quiz Details</h4>
              <div className="info-grid">
                <div className="info-item">
                  <Clock size={18} />
                  <span>Duration:</span>
                  <strong>{quiz.duration} minutes</strong>
                </div>
                <div className="info-item">
                  <FileText size={18} />
                  <span>Questions:</span>
                  <strong>{quiz.questions.length}</strong>
                </div>
                <div className="info-item">
                  <Award size={18} />
                  <span>Max Score:</span>
                  <strong>{quiz.maxScore} points</strong>
                </div>
                <div className="info-item">
                  <BookOpen size={18} />
                  <span>Subject:</span>
                  <strong>{quiz.subject}</strong>
                </div>
              </div>
            </div>

            <div className="emergency-info">
              <AlertTriangle size={18} />
              <p>
                <strong>Emergency Exit:</strong> Use the emergency exit button
                if you need to leave the quiz. Strict mode will be temporarily
                disabled to allow admin code entry. Admin code required for
                exit.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn secondary" onClick={onClose}>
            <ChevronLeft size={18} />
            Cancel
          </button>
          <button className="action-btn primary" onClick={onStart}>
            <Play size={18} />
            Start Quiz Now
          </button>
        </div>
      </div>

      <style>{`
        .large-modal {
          max-width: 800px;
          max-height: 90vh;
        }
        .modal-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .modal-title-section h2 {
          margin: 0;
          font-size: 24px;
          color: #1f2937;
        }
        .modal-title-section p {
          margin: 4px 0 0 0;
          color: #6b7280;
        }
        .instructions-content {
          padding: 8px;
        }
        .warning-section {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: center;
        }
        .warning-section h3 {
          margin: 8px 0 4px 0;
          color: #d97706;
          font-size: 18px;
        }
        .warning-section p {
          margin: 0;
          color: #92400e;
        }
        .rules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .rule-card {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: transform 0.2s;
        }
        .rule-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
        }
        .rule-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .rule-content h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 16px;
        }
        .rule-content p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
        }
        .quiz-info-section {
          background: #f0f9ff;
          border: 2px solid #bae6fd;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .quiz-info-section h4 {
          margin: 0 0 16px 0;
          color: #0369a1;
          font-size: 18px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
        }
        .info-item span {
          color: #64748b;
          flex: 1;
        }
        .info-item strong {
          color: #1f2937;
        }
        .emergency-info {
          background: #fef2f2;
          border: 2px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .emergency-info p {
          margin: 0;
          color: #dc2626;
          font-size: 14px;
          line-height: 1.4;
        }
        .action-btn.secondary {
          background: #f3f4f6;
          color: #374151;
          border: 2px solid #d1d5db;
        }
        .action-btn.secondary:hover {
          background: #e5e7eb;
        }
        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .action-btn.primary {
          background: #10b981;
          color: white;
        }
        .action-btn.primary:hover {
          background: #059669;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

// Score Display Modal Component
const ScoreDisplayModal: React.FC<{
  score: number;
  maxScore: number;
  onClose: () => void;
}> = ({ score, maxScore, onClose }) => {
  const [countdown, setCountdown] = useState(3);
  const percentage = (score / maxScore) * 100;

  useEffect(() => {
    if (countdown === 0) {
      onClose();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onClose]);

  const getGradeColor = () => {
    if (percentage >= 80) return "#10b981";
    if (percentage >= 60) return "#3b82f6";
    if (percentage >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getGradeText = () => {
    if (percentage >= 80) return "Excellent!";
    if (percentage >= 60) return "Good Job!";
    if (percentage >= 50) return "Average!";
    return "Needs Improvement!";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content medium-modal">
        <div className="modal-header">
          <Award size={32} />
          <h2>Quiz Completed!</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <div
            className="score-display"
            style={{ borderColor: getGradeColor() }}
          >
            <div className="score-circle">
              <div
                className="score-percentage"
                style={{ color: getGradeColor() }}
              >
                {score}
              </div>
              <div className="score-text">out of {maxScore}</div>
            </div>
            <div className="grade-text" style={{ color: getGradeColor() }}>
              {getGradeText()}
            </div>
          </div>
          <div className="score-message">
            <p>Redirecting to dashboard in {countdown} seconds...</p>
          </div>
        </div>
      </div>

      <style>{`
        .medium-modal {
          max-width: 500px;
        }
        .score-display {
          text-align: center;
          padding: 40px 32px;
          border: 4px solid;
          border-radius: 20px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          margin-bottom: 24px;
        }
        .score-circle {
          margin-bottom: 16px;
        }
        .score-percentage {
          font-size: 3.5rem;
          font-weight: bold;
          margin-bottom: 8px;
          font-family: 'Inter', sans-serif;
        }
        .score-text {
          font-size: 1.25rem;
          color: #64748b;
          font-weight: 600;
        }
        .grade-text {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .score-message {
          text-align: center;
        }
        .score-message p {
          margin: 0;
          color: #475569;
          font-size: 1.1rem;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};

// Strict Quiz Interface Component with IMPROVED EMERGENCY EXIT
const StrictQuizInterface: React.FC<{
  quiz: Quiz;
  onClose: () => void;
  onSubmit: (quizId: string, score: number, maxScore: number) => void;
  strictModeActive: boolean;
  studentName: string;
  studentId: string;
  currentUserClass?: string;
  user: any;
}> = ({
  quiz,
  onClose,
  onSubmit,
  strictModeActive,
  studentName,
  studentId,
  currentUserClass,
  user,
}) => {
  // State declarations
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [quizStarted, setQuizStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [violationAttempts, setViolationAttempts] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [emergencyExitActive, setEmergencyExitActive] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / quiz.questions.length) * quiz.maxScore;
    const finalScore = Math.round(score);
    return finalScore;
  };

  // Save to teacher monitoring function
  const saveToTeacherMonitoring = useCallback(async () => {
    if (
      !quizStarted ||
      !studentName ||
      !studentId ||
      emergencyExitActive ||
      !user?.uid
    )
      return;

    try {
      // Calculate time elapsed
      const timeElapsed = quiz.duration * 60 - timeLeft;
      const totalTime = quiz.duration * 60;
      const progress = Math.round((timeElapsed / totalTime) * 100);

      // Ensure violations are properly structured
      const formattedViolations = violations.map((v) => ({
        id: v.id || Date.now().toString(),
        timestamp: v.timestamp || new Date(),
        type: v.type,
        description: v.description,
        severity: v.severity || "medium",
        studentId: studentId,
        studentName: studentName,
        studentClass: currentUserClass || "Unknown Class",
        quizId: quiz.id,
        quizName: quiz.name,
        quizClass: quiz.targetClass || currentUserClass || "Unknown Class",
        browser: navigator.userAgent.split(" ")[0] || "Unknown",
        deviceType: /mobile/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      }));

      const monitoringData = {
        studentId: studentId,
        studentName: studentName,
        studentClass: currentUserClass || "Unknown Class",
        quizId: quiz.id,
        quizName: quiz.name,
        quizClass: quiz.targetClass || currentUserClass || "Unknown Class",
        status: isAutoSubmitting ? "submitted" : "in-progress",
        progress: Math.min(100, progress),
        timeSpent: formatTime(timeElapsed),
        currentQuestion: currentQuestion + 1,
        totalQuestions: quiz.questions.length,
        violations: formattedViolations,
        lastActivity: new Date(),
        score: isAutoSubmitting ? calculateResults() : undefined,
        maxScore: quiz.maxScore,
        isOnline: true,
        studentEmail: user?.email || "",
        teacherId: null, // Will be populated by teacher's query
        createdAt: serverTimestamp(),
        updatedAt: new Date(),
      };

      // Save to Firestore
      const monitoringId = `${quiz.id}_${studentId}`;
      const monitoringRef = doc(db, "monitoring", monitoringId);

      await setDoc(monitoringRef, monitoringData, { merge: true });

      console.log("✅ Student monitoring data saved to Firestore");

      // Also save to a separate collection for easier querying
      const activityRef = doc(
        collection(db, "studentActivities"),
        monitoringId
      );
      await setDoc(
        activityRef,
        {
          ...monitoringData,
          timestamp: new Date(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving monitoring data to Firestore:", error);
    }
  }, [
    quizStarted,
    studentName,
    studentId,
    quiz,
    timeLeft,
    currentQuestion,
    violations,
    currentUserClass,
    isAutoSubmitting,
    emergencyExitActive,
    calculateResults,
    formatTime,
    user,
  ]);
  const saveViolationToFirestore = useCallback(
    async (violation: Violation) => {
      if (!user?.uid || !studentId || !quiz.id) return;

      try {
        const monitoringId = `${quiz.id}_${studentId}`;
        const monitoringRef = doc(db, "monitoring", monitoringId);

        const violationData = {
          id: violation.id,
          timestamp: violation.timestamp,
          type: violation.type,
          description: violation.description,
          severity: violation.severity,
          studentId: studentId,
          studentName: studentName,
          studentClass: currentUserClass || "Unknown",
          quizId: quiz.id,
          quizName: quiz.name,
          quizClass: quiz.targetClass || currentUserClass || "Unknown",
          browser: navigator.userAgent.split(" ")[0] || "Unknown",
          deviceType: /mobile/i.test(navigator.userAgent)
            ? "Mobile"
            : "Desktop",
        };

        // Get existing monitoring document
        const docSnap = await getDoc(monitoringRef);
        let existingData = docSnap.exists() ? docSnap.data() : {};
        let existingViolations = existingData.violations || [];

        // Add new violation
        const updatedViolations = [...existingViolations, violationData];

        // Update or create the monitoring document
        await setDoc(
          monitoringRef,
          {
            ...existingData,
            studentId: studentId,
            studentName: studentName,
            studentClass: currentUserClass || "Unknown",
            quizId: quiz.id,
            quizName: quiz.name,
            quizClass: quiz.targetClass || currentUserClass || "Unknown",
            status: "violation",
            progress: Math.round(
              ((currentQuestion + 1) / quiz.questions.length) * 100
            ),
            timeSpent: formatTime(quiz.duration * 60 - timeLeft),
            currentQuestion: currentQuestion + 1,
            totalQuestions: quiz.questions.length,
            violations: updatedViolations,
            lastActivity: new Date(),
            updatedAt: new Date(),
            teacherId: null, // Will be filled by teacher query
            studentEmail: user?.email || "",
          },
          { merge: true }
        );

        console.log("✅ Violation saved to Firestore:", violation.type);
      } catch (error) {
        console.error("❌ Error saving violation:", error);
      }
    },
    [
      user,
      studentId,
      quiz,
      currentUserClass,
      studentName,
      currentQuestion,
      timeLeft,
    ]
  );
  // Add this function to save progress periodically
  const saveQuizProgress = useCallback(async () => {
    if (!user?.uid || !studentId || !quiz.id || emergencyExitActive) return;

    try {
      const monitoringId = `${quiz.id}_${studentId}`;
      const monitoringRef = doc(db, "monitoring", monitoringId);

      const progress = Math.round(
        ((currentQuestion + 1) / quiz.questions.length) * 100
      );
      const timeElapsed = quiz.duration * 60 - timeLeft;

      await setDoc(
        monitoringRef,
        {
          studentId: studentId,
          studentName: studentName,
          studentClass: currentUserClass || "Unknown",
          quizId: quiz.id,
          quizName: quiz.name,
          quizClass: quiz.targetClass || currentUserClass || "Unknown",
          status: quizStarted ? "in-progress" : "not-started",
          progress: progress,
          timeSpent: formatTime(timeElapsed),
          currentQuestion: currentQuestion + 1,
          totalQuestions: quiz.questions.length,
          violations: violations,
          lastActivity: new Date(),
          updatedAt: new Date(),
          studentEmail: user?.email || "",
        },
        { merge: true }
      );

      console.log("📊 Quiz progress saved:", progress, "%");
    } catch (error) {
      console.error("❌ Error saving quiz progress:", error);
    }
  }, [
    user,
    studentId,
    quiz,
    currentUserClass,
    studentName,
    currentQuestion,
    timeLeft,
    quizStarted,
    violations,
    emergencyExitActive,
  ]);

  // Call this function periodically
  useEffect(() => {
    if (quizStarted && !emergencyExitActive) {
      const interval = setInterval(saveQuizProgress, 10000); // Save every 10 seconds
      return () => clearInterval(interval);
    }
  }, [quizStarted, emergencyExitActive, saveQuizProgress]);

  const reportViolation = useCallback(
    (type: Violation["type"], description: string) => {
      if (emergencyExitActive) return;

      const violation: Violation = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type,
        description,
        severity: violationAttempts >= 2 ? "high" : "medium",
      };

      // Save to Firestore FIRST
      saveViolationToFirestore(violation);

      // Then update local state
      setViolations((prev) => [...prev, violation]);
      const newAttempts = violationAttempts + 1;
      setViolationAttempts(newAttempts);

      if (newAttempts >= 3) {
        handleAutoSubmit();
        alert("Maximum violations reached! Quiz submitted automatically.");
      } else {
        setShowViolationWarning(true);
        setTimeout(() => setShowViolationWarning(false), 3000);
      }
    },
    [violationAttempts, emergencyExitActive, saveViolationToFirestore]
  );
  // Timer logic
  useEffect(() => {
    if (
      !quizStarted ||
      isPaused ||
      timeLeft <= 0 ||
      isAutoSubmitting ||
      emergencyExitActive
    ) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [quizStarted, isPaused, timeLeft, isAutoSubmitting, emergencyExitActive]);

  // Initialize quiz timer
  useEffect(() => {
    if (quizStarted) {
      setTimeLeft(quiz.duration * 60);
    }
  }, [quizStarted, quiz.duration]);

  // Event handlers for visibility changes - skip if emergency exit is active
  const handleVisibilityChange = useCallback(() => {
    if (emergencyExitActive) return; // Emergency exit active, don't pause

    if (strictModeActive && quizStarted && document.hidden) {
      setIsPaused(true);
      reportViolation("tab-switch", "Tab switched away from quiz");
      alert("⚠️ Quiz paused! Please return to the quiz tab.");
    } else {
      setIsPaused(false);
    }
  }, [strictModeActive, quizStarted, reportViolation, emergencyExitActive]);

  const handleBlur = useCallback(() => {
    if (strictModeActive && quizStarted && !emergencyExitActive) {
      setIsPaused(true);
    }
  }, [strictModeActive, quizStarted, emergencyExitActive]);

  const handleFocus = useCallback(() => {
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (strictModeActive && quizStarted && !emergencyExitActive) {
      // Allow answer selection keys (A,B,C,D and 1,2,3,4)
      const isAnswerKey = (key: string) => {
        return /^[a-dA-D1-4]$/.test(key);
      };

      // Allow navigation keys
      const isNavigationKey = (key: string) => {
        const navKeys = [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Tab",
          "Escape",
          "Enter",
          " ",
        ];
        return navKeys.includes(key);
      };

      const preventAllKeys = (e: KeyboardEvent) => {
        // Allow answer selection and navigation
        if (isAnswerKey(e.key) || isNavigationKey(e.key)) {
          return; // Allow these keys
        }

        // Block and report suspicious keys
        e.preventDefault();
        e.stopPropagation();

        // Don't spam for common keys like Shift, Control, Alt
        const commonKeys = [
          "Shift",
          "Control",
          "Alt",
          "Meta",
          "CapsLock",
          "NumLock",
        ];
        if (!commonKeys.includes(e.key)) {
          reportViolation(
            "keyboard",
            `Suspicious key pressed: ${e.key} (${e.code})`
          );
        }
      };

      const preventContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        reportViolation(
          "right-click",
          "Right-click attempted - context menu blocked"
        );
      };

      const preventBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue =
          "Are you sure you want to leave? Your quiz will be submitted.";
        reportViolation("tab-switch", "Tab/window switch or close attempted");
        return e.returnValue;
      };

      // Add fullscreen exit detection
      const handleFullscreenChange = () => {
        if (
          !document.fullscreenElement &&
          !emergencyExitActive &&
          quizStarted
        ) {
          reportViolation(
            "fullscreen-exit",
            "Exited fullscreen mode during quiz"
          );
          // Try to re-enter fullscreen
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((err) => {
              console.log("Failed to re-enter fullscreen:", err);
            });
          }
        }
      };

      // Add developer tools detection
      const handleDevTools = (e: Event) => {
        reportViolation("dev-tools", "Developer tools opened");
      };

      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(console.error);
      }

      document.addEventListener("keydown", preventAllKeys, true);
      document.addEventListener("contextmenu", preventContextMenu, true);
      window.addEventListener("beforeunload", preventBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);
      window.addEventListener("focus", handleFocus);
      document.addEventListener("fullscreenchange", handleFullscreenChange);

      // Add devtools detection (basic)
      window.addEventListener("devtoolschange", handleDevTools);

      return () => {
        document.removeEventListener("keydown", preventAllKeys, true);
        document.removeEventListener("contextmenu", preventContextMenu, true);
        window.removeEventListener("beforeunload", preventBeforeUnload);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("blur", handleBlur);
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange
        );
        window.removeEventListener("devtoolschange", handleDevTools);
      };
    }
  }, [
    strictModeActive,
    quizStarted,
    emergencyExitActive,
    reportViolation,
    handleVisibilityChange,
    handleBlur,
    handleFocus,
  ]);

  // Quiz functions
  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  // IMPROVED: Emergency exit handler - disables strict mode temporarily
  const handleEmergencyExit = () => {
    // Set emergency exit active
    setEmergencyExitActive(true);

    // Remove all strict mode restrictions temporarily
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(console.error);
    }

    // Show admin input modal
    setShowAdminInput(true);
  };

  const handleAdminCodeSubmit = () => {
    if (adminCode === "mini-fcmb") {
      setShowAdminInput(false);
      setQuizStarted(false);
      setEmergencyExitActive(false); // Reset emergency exit state
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(console.error);
      }
      onClose();
    } else {
      alert("❌ Invalid admin code. Please try again.");
      setAdminCode("");
    }
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

  const handleAutoSubmit = async () => {
    // Prevent multiple auto-submissions
    if (isAutoSubmitting) return;

    setIsAutoSubmitting(true);

    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Calculate score based on answers
    const finalScore = calculateResults();
    setFinalScore(finalScore);

    // Show the score modal (which has auto-redirect)
    setShowScoreModal(true);

    try {
      await onSubmit(quiz.id, finalScore, quiz.maxScore);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    const finalScore = calculateResults();
    setFinalScore(finalScore);
    setShowScoreModal(true);
    onSubmit(quiz.id, finalScore, quiz.maxScore);
  };

  const handleCancelSubmit = () => {
    setShowConfirmModal(false);
  };

  const handleScoreModalClose = () => {
    setShowScoreModal(false);
    setQuizStarted(false);
    setEmergencyExitActive(false); // Reset emergency exit state

    // Exit fullscreen
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(console.error);
    }

    // Close quiz interface
    onClose();
  };

  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;
  const currentQuestionData = quiz.questions[currentQuestion];

  // Show score modal
  if (showScoreModal) {
    return (
      <ScoreDisplayModal
        score={finalScore}
        maxScore={quiz.maxScore}
        onClose={handleScoreModalClose}
      />
    );
  }

  // Show admin input
  if (showAdminInput) {
    return (
      <div className="modal-overlay">
        <div className="modal-content small-modal">
          <div className="modal-header">
            <Lock size={24} />
            <h2>Emergency Exit - Admin Required</h2>
            <button
              className="close-btn"
              onClick={() => {
                setShowAdminInput(false);
                setEmergencyExitActive(false); // Re-enable strict mode
                // Re-enter fullscreen if needed
                if (quizStarted && !document.fullscreenElement) {
                  document.documentElement
                    .requestFullscreen()
                    .catch(console.error);
                }
              }}
            >
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <p>Enter admin code to exit the quiz:</p>
            <input
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Enter admin code"
              className="text-input"
              autoFocus
            />
            <div className="emergency-exit-info">
              <AlertTriangle size={16} />
              <p>
                <strong>Note:</strong> Strict mode is temporarily disabled. You
                can freely type the admin code.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="action-btn cancel"
              onClick={() => {
                setShowAdminInput(false);
                setEmergencyExitActive(false); // Re-enable strict mode
                // Re-enter fullscreen
                if (quizStarted && !document.fullscreenElement) {
                  document.documentElement
                    .requestFullscreen()
                    .catch(console.error);
                }
              }}
            >
              Continue Quiz
            </button>
            <button
              className="action-btn primary"
              onClick={handleAdminCodeSubmit}
            >
              Submit code
            </button>
          </div>
        </div>

        <style>{`
          .emergency-exit-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 10px;
            margin: 12px 0;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            color: #92400e;
          }
          
          .emergency-exit-info p {
            margin: 0;
            font-size: 13px;
            line-height: 1.3;
          }
          
          .admin-code-hint {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 13px;
            color: #0369a1;
          }
          
          .admin-code-hint strong {
            font-family: monospace;
            background: #e0f2fe;
            padding: 2px 6px;
            border-radius: 4px;
          }
        `}</style>
      </div>
    );
  }

  // Show confirmation modal
  if (showConfirmModal) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <AlertTriangle size={24} />
            <h3>Confirm Submission</h3>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to submit your quiz?</p>
            <div className="submission-stats">
              <div className="stat-item">
                <span>Questions Answered:</span>
                <strong>
                  {answeredQuestions}/{totalQuestions}
                </strong>
              </div>
              <div className="stat-item">
                <span>Flagged Questions:</span>
                <strong>{flagged.length}</strong>
              </div>
              <div className="stat-item">
                <span>Time Remaining:</span>
                <strong>{formatTime(timeLeft)}</strong>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="modal-btn cancel" onClick={handleCancelSubmit}>
              Cancel
            </button>
            <button className="modal-btn confirm" onClick={handleConfirmSubmit}>
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Start screen if quiz hasn't started
  if (!quizStarted) {
    return (
      <div className="quiz-interface">
        <div className="quiz-start-screen">
          <div className="start-screen-content">
            <Lock size={64} />
            <h1>Confirm Start?</h1>
            <p className="quiz-title">
              {quiz.name} - {quiz.subject}
            </p>

            <div className="quiz-details-start">
              <div className="detail-item">
                <Clock size={20} />
                <span>Duration: {quiz.duration} minutes</span>
              </div>
              <div className="detail-item">
                <FileText size={20} />
                <span>Questions: {quiz.questions.length}</span>
              </div>
              <div className="detail-item">
                <Award size={20} />
                <span>Max Score: {quiz.maxScore} points</span>
              </div>
            </div>

            <div className="warning-box">
              <AlertTriangle size={24} />
              <p>
                Strict mode will be enabled. All cheating attempts will be
                logged. Emergency exit available with admin code (strict mode
                will be temporarily disabled).
              </p>
            </div>

            <div className="start-buttons">
              <button className="nav-btn cancel" onClick={onClose}>
                <ChevronLeft size={20} />
                Cancel
              </button>
              <button className="nav-btn start" onClick={handleStartQuiz}>
                <Play size={20} />
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz interface
  return (
    <div className="quiz-interface">
      {/* Emergency Exit Active Warning */}
      {emergencyExitActive && (
        <div className="emergency-exit-active">
          <AlertTriangle size={20} />
          <span>EMERGENCY EXIT ACTIVE - Strict mode temporarily disabled</span>
        </div>
      )}

      {/* Violation Warning */}
      {showViolationWarning && !emergencyExitActive && (
        <div className="violation-warning">
          <AlertTriangle size={20} />
          <span>
            VIOLATION! {3 - violationAttempts} attempts remaining before
            auto-submission.
          </span>
        </div>
      )}

      {/* Paused Warning */}
      {isPaused && !emergencyExitActive && (
        <div className="paused-warning">
          <Clock size={20} />
          <span>QUIZ PAUSED - Please return to this tab</span>
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
          <div
            className="timer-display"
            style={{
              background:
                timeLeft < 60
                  ? "#dc2626"
                  : timeLeft < 120
                  ? "#f59e0b"
                  : "#3b82f6",
            }}
          >
            <Clock size={20} />
            <span className="timer">{formatTime(timeLeft)}</span>
            {isPaused && !emergencyExitActive && (
              <span className="paused-badge">PAUSED</span>
            )}
            {emergencyExitActive && (
              <span className="emergency-badge">EXIT MODE</span>
            )}
          </div>
          <button
            className="emergency-exit"
            onClick={handleEmergencyExit}
            style={{
              background: emergencyExitActive ? "#ef4444" : "#f59e0b",
              border: emergencyExitActive ? "2px solid #dc2626" : "none",
            }}
          >
            {emergencyExitActive ? "Exit Mode Active" : "Emergency Exit"}
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
              disabled={emergencyExitActive} // Disable during emergency exit
            >
              {index + 1}
              {flagged.includes(index) && (
                <span className="flag-indicator">🚩</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="quiz-content">
        <div className="question-area">
          <button
            className={`flag-btn ${
              flagged.includes(currentQuestion) ? "flagged" : ""
            }`}
            onClick={() => handleFlagQuestion(currentQuestion)}
            disabled={emergencyExitActive}
          >
            {flagged.includes(currentQuestion)
              ? "🚩 Flagged"
              : "🏴 Flag Question"}
          </button>
          <div className="question-header">
            <h2>{currentQuestionData.text}</h2>
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
                disabled={emergencyExitActive}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="navigation-controls">
          <button
            className="nav-btn-prev"
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0 || emergencyExitActive}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="progress-info">
            <span>
              Answered: {answeredQuestions}/{totalQuestions}
            </span>
            {flagged.length > 0 && (
              <span className="flagged-count">🚩 {flagged.length}</span>
            )}
            {emergencyExitActive && (
              <span className="emergency-status">⚠️ Exit Mode Active</span>
            )}
          </div>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              className="nav-btn-submit"
              onClick={handleSubmitClick}
              disabled={emergencyExitActive}
            >
              Submit Quiz
            </button>
          ) : (
            <button
              className="nav-btn-next"
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(quiz.questions.length - 1, prev + 1)
                )
              }
              disabled={emergencyExitActive}
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .quiz-interface {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0f172a;
          color: white;
          font-family: 'Inter', sans-serif;
          z-index: 2000;
        }
        .nav-btn-prev{
            width:200px !important;
            color:#fff;
            background-color:#4299e1;
            border:1px solid #4299e1;
            border-radius:15px;
            height:50px;
        }
        .nav-btn-submit{
            width:200px !important;
            color:#fff;
            background-color:#4299e1;
            border:1px solid #4299e1;
            border-radius:15px;
            height:50px;
        }
        .nav-btn-next{
            width:200px !important;
            color:#fff;
            background-color:#4299e1;
            border:1px solid #4299e1;
            border-radius:15px;
            height:50px;
        }
        
        .emergency-exit-active {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #ef4444;
          color: white;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-weight: 600;
          z-index: 2001;
          animation: flash 1s infinite;
        }
        
        .violation-warning {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #dc2626;
          color: white;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-weight: 600;
          z-index: 2001;
          animation: flash 1s infinite;
        }
        
        .paused-warning {
          position: fixed;
          top: 50px;
          left: 0;
          right: 0;
          background: #f59e0b;
          color: white;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-weight: 600;
          z-index: 2001;
        }
        
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .emergency-badge {
          background: #ef4444;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
          font-weight: 600;
        }
        
        .emergency-status {
          color: #ef4444;
          font-weight: 600;
          padding: 4px 8px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 4px;
          font-size: 12px;
        }
        
        .question-indicator:disabled,
        .flag-btn:disabled,
        .option-btn:disabled,
        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .emergency-exit {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .emergency-exit:hover {
          background: #d97706;
        }
        
        .quiz-start-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0); 
          z-index: 2000;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        
        .start-screen-content {
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          text-align: center;
          background: #1e293b;
          padding: 40px;
          border-radius: 20px;
          border: 2px solid #334155;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          overflow-y: auto; 
          overflow-x: hidden;
        }
        
        .quiz-details-start {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 30px;
          background: #0f172a;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #334155;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          color: #cbd5e1;
          min-width: 0;
        }
        
        .warning-box {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          color: #92400e;
          min-width: 0;
        }
        
        .warning-box p {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
          text-align: left;
          word-wrap: break-word;
          min-width: 0;
        }
        
        .start-buttons {
          display: flex;
          gap: 16px;
          margin-top: auto;
        }
        
        .nav-btn {
          flex: 1;
          padding: 14px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
          min-width: 120px;
        }
        
        .nav-btn.cancel {
          background: #374151;
          color: white;
          border: 1px solid #4b5563;
        }
        
        .nav-btn.cancel:hover {
          background: #4b5563;
          transform: translateY(-2px);
        }
        
        .nav-btn.start {
          background: #10b981;
          color: white;
          border: 1px solid #10b981;
        }
        
        .nav-btn.start:hover {
          background: #059669;
          transform: translateY(-2px);
        }
        
        .timer-display {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
        }
        
        .paused-badge {
          background: #f59e0b;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
        }
        
        .quiz-header {
          background: #1e293b;
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #334155;
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
          font-weight: bold;
          font-size: 1.2rem;
        }
        
        .quiz-info h1 {
          margin: 0;
          font-size: 1.25rem;
          color: white;
        }
        
        .quiz-info p {
          margin: 4px 0 0 0;
          color: #94a3b8;
          font-size: 0.9rem;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .progress-nav {
          background: #1e293b;
          padding: 16px 32px;
          border-bottom: 1px solid #334155;
        }
        
        .question-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .question-indicator {
          width: 40px;
          height: 40px;
          border: 2px solid #475569;
          border-radius: 8px;
          background: #1e293b;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          position: relative;
        }
        
        .question-indicator:hover:not(:disabled) {
          border-color: #64748b;
        }
        
        .question-indicator.current {
          border-color: #3b82f6;
          background: #3b82f6;
        }
        
        .question-indicator.answered {
          background: #10b981;
          border-color: #10b981;
        }
        
        .question-indicator.flagged {
          border-color: #f59e0b;
        }
        
        .flag-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          font-size: 12px;
        }
        
        .quiz-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 32px;
          height: calc(100vh - 160px);
          display: flex;
          flex-direction: column;
        }
        
        .question-area {
            background: #1e293b;
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 24px;
            flex: 1;
            overflow-y: auto; 
            overflow-x: hidden; 
            border: 2px solid #334155;
            word-wrap: break-word;
            word-break: break-word;
            hyphens: auto;
            gap: 20px;
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
            color: white;
            line-height: 1.4;
            flex: 1;
            word-wrap: break-word; 
            word-break: break-word; 
            overflow-wrap: break-word;
          }
        
        .flag-btn {
          background: #374151;
          border: 1px solid #4b5563;
          color: #d1d5db;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        
        .flag-btn:hover:not(:disabled) {
          background: #4b5563;
        }
        
        .flag-btn.flagged {
          background: #f59e0b;
          border-color: #f59e0b;
          color: white;
        }
        
        .diagram-container {
          margin: 24px 0;
          text-align: center;
        }
        
        .question-image {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          border: 2px solid #475569;
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
          border: 2px solid #475569;
          border-radius: 12px;
          background: #1e293b;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }
        
        .option-btn:hover:not(:disabled) {
          border-color: #64748b;
          background: #374151;
        }
        
        .option-btn.selected {
          border-color: #3b82f6;
          background: #1e40af;
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
          transition: all 0.3s ease;
        }
        
        .option-btn.selected .option-letter {
          border-color: white;
          background: white;
          color: #1e40af;
        }
        
        .option-text {
            font-size: 1rem;
            font-weight: 500;
            flex: 1;
            word-wrap: break-word;
            word-break: break-word;
            text-align: left;
          }
        
        .navigation-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1e293b;
          padding: 20px 32px;
          border-radius: 16px;
          border: 2px solid #334155;
        }
        
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border: 1px solid #475569;
          border-radius: 8px;
          background: #374151;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .nav-btn:hover:not(:disabled) {
          background: #4b5563;
          border-color: #64748b;
        }
        
        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .nav-btn.submit {
          background: #10b981;
          border-color: #10b981;
        }
        
        .nav-btn.submit:hover:not(:disabled) {
          background: #059669;
        }
        
        .progress-info {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #94a3b8;
        }
        
        .flagged-count {
          color: #f59e0b;
          font-weight: 600;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
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
          height:300px;
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
        
        .small-modal {
          max-width: 400px;
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .modal-header h2, .modal-header h3 {
          margin: 0;
          color: #1f2937;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          margin-left: auto;
        }
        
        .modal-body {
          margin-bottom: 24px;
        }
        
        .modal-body p {
          margin: 0 0 16px 0;
          color: #6b7280;
        }
        
        .text-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #1f2937;
          font-size: 1rem;
          margin-bottom: 12px;
        }
        
        .text-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        .warning-text {
          color: #ef4444;
          font-size: 0.9rem;
          margin-top: 8px;
        }
        
        .submission-stats {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }
        
        .stat-item:not(:last-child) {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-footer, .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .modal-btn .confirm{
            width:200px !important;
            color:#fff;
            background-color:#4299e1;
            border:1px solid #4299e1;
            border-radius:15px;
            height:50px;
        }
        .modal-btn .cancel{
            width:200px !important;
            color:#fff;
            background-color:#4299e1;
            border:1px solid #4299e1;
            border-radius:15px;
            height:50px;
        }
        
        .action-btn{
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .action-btn.cancel, .modal-btn.cancel {
          background: #6b7280;
          color: white;
        }
        
        .action-btn.cancel:hover, .modal-btn.cancel:hover {
          background: #4b5563;
        }
        
        .action-btn.primary, .modal-btn.confirm {
          background: #3b82f6;
          color: white;
        }
        
        .action-btn.primary:hover, .modal-btn.confirm:hover {
          background: #2563eb;
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
          .question-header h2 {
            font-size: 1.2rem;
            line-height: 1.3;
          }
          .option-text {
            font-size: 0.9rem;
          }
          .question-header {
            flex-direction: column;
            gap: 16px;
          }
          .navigation-controls {
            flex-direction: column;
            gap: 16px;
          }
          .progress-info {
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

// Main Student Dashboard Component
const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [classListOpen, setClassListOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHoursData[]>([]);
  const [onlineStartTime, setOnlineStartTime] = useState<Date | null>(null);
  const [quizSubmissions, setQuizSubmissions] = useState<{
    [key: string]: QuizSubmission;
  }>({});
  const [showQuizInstructions, setShowQuizInstructions] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [performanceMenuOpen, setPerformanceMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<string[]>([]);
  const [showLiveMonitoring, setShowLiveMonitoring] = useState(false);

  const {
    user,
    userData,
    students,
    loading,
    error,
    authInitialized,
    initializeAuth,
    signOutUser,
  } = useFirebaseStore();

  // Get current student's class from userData
  const currentUserClass = userData?.className;

  // Enhanced students with class information - FILTERED by same class
  const enhancedStudents = useMemo(() => {
    return students
      .map((student) => ({
        ...student,
        classId: student.className || "default-class",
        className: student.className || "Your Class",
      }))
      .filter(
        (student) =>
          // Only show students in the same class as current user
          !currentUserClass ||
          student.className === currentUserClass ||
          student.classId === currentUserClass
      );
  }, [students, currentUserClass]);

  // User info
  const [userInfo, setUserInfo] = useState({
    fullName: "Student Name",
    firstName: "Student",
    userInitial: "S",
    email: "student@example.com",
  });

  const loadQuizSubmissions = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const submissionsRef = collection(db, "quizSubmissions");
      const q = query(submissionsRef, where("studentId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const submissionsMap: { [key: string]: QuizSubmission } = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const quizId = data.quizId;

        submissionsMap[quizId] = {
          quizId,
          status: data.status || "submitted",
          score: data.score || 0,
          maxScore: data.maxScore || 0,
          submittedAt: data.submittedAt || new Date().toISOString(),
          attempts: data.attempts || 1,
        };
      });

      setQuizSubmissions(submissionsMap);
      console.log("Loaded quiz submissions from Firestore");
    } catch (error) {
      console.error("Error loading quiz submissions:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid && authInitialized) {
      loadQuizSubmissions();
    }
  }, [user, authInitialized, loadQuizSubmissions]);

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

  // Initialize online status and working hours
  useEffect(() => {
    const initializeOnlineStatus = async () => {
      if (!user?.uid) return;

      const today = new Date().toDateString();

      try {
        const onlineRef = doc(db, "studentOnlineStatus", user.uid);
        const docSnap = await getDoc(onlineRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.lastOnlineDate === today && data.startTime) {
            setOnlineStartTime(data.startTime.toDate());
          } else {
            const startTime = new Date();
            setOnlineStartTime(startTime);
            await setDoc(
              onlineRef,
              {
                lastOnlineDate: today,
                startTime: startTime,
                studentId: user.uid,
                updatedAt: new Date(),
              },
              { merge: true }
            );
          }
        } else {
          const startTime = new Date();
          setOnlineStartTime(startTime);
          await setDoc(onlineRef, {
            lastOnlineDate: today,
            startTime: startTime,
            studentId: user.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error initializing online status:", error);
      }
    };

    initializeOnlineStatus();
    initializeWorkingHours();
  }, [user]);

  // Load quizzes from Firestore
  useEffect(() => {
    if (!userData || userData.role !== "student" || !userData.className) return;

    const q = query(
      collection(db, "quizzes"),
      where("targetClass", "==", userData.className)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const updatedQuizzes = snapshot.docs.map((doc) => {
        const data = doc.data();
        const quiz = {
          id: doc.id,
          name: data.name || "Unnamed Quiz",
          subject: data.subject || "General",
          teacherName: data.teacherName || "Teacher",
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          duration: data.duration || 30,
          totalDuration: data.totalDuration || 40,
          questions: data.questions || [],
          maxScore: data.maxScore || 40,
          targetClass: data.targetClass || userData.className,
        } as Quiz;

        // Calculate status
        const now = new Date();
        const scheduledDateTime = new Date(
          `${quiz.scheduledDate}T${quiz.scheduledTime}`
        );
        const endTime = new Date(
          scheduledDateTime.getTime() + quiz.totalDuration * 60000
        );

        let status: "upcoming" | "active" | "expired" = "upcoming";
        if (now >= scheduledDateTime && now <= endTime) status = "active";
        else if (now > endTime) status = "expired";

        return { ...quiz, status };
      });

      setQuizzes(updatedQuizzes);
    });

    return () => unsub();
  }, [userData]);

  // Initialize working hours function
  const initializeWorkingHours = useCallback(async () => {
    if (!user?.uid) return;

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const todayIndex = (today.getDay() + 6) % 7;
    const todayStr = today.toDateString();

    try {
      // Load from Firestore
      const workingHoursRef = doc(
        db,
        "studentWorkingHours",
        `${user.uid}_${todayStr}`
      );
      const docSnap = await getDoc(workingHoursRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setWorkingHours(data.hours || []);
      } else {
        // Create initial working hours
        const hoursData = days.map((day, index) => ({
          day,
          minutes: index === todayIndex ? 1 : 0,
          online: index === todayIndex,
          startTime: index === todayIndex ? new Date() : undefined,
        }));
        setWorkingHours(hoursData);

        await setDoc(
          workingHoursRef,
          {
            studentId: user.uid,
            date: todayStr,
            hours: hoursData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Error loading working hours:", error);
    }
  }, [user]);

  // Save working hours to Firestore
  useEffect(() => {
    const saveWorkingHours = async () => {
      if (workingHours.length > 0 && user?.uid) {
        const todayStr = new Date().toDateString();
        try {
          const workingHoursRef = doc(
            db,
            "studentWorkingHours",
            `${user.uid}_${todayStr}`
          );
          await setDoc(
            workingHoursRef,
            {
              studentId: user.uid,
              date: todayStr,
              hours: workingHours,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error("Error saving working hours:", error);
        }
      }
    };

    const interval = setInterval(saveWorkingHours, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [workingHours, user]);

  // Load student subjects from Firestore
  useEffect(() => {
    const loadStudentSubjects = async () => {
      if (user?.email) {
        try {
          const studentsRef = collection(db, "students");
          const q = query(studentsRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const studentData = querySnapshot.docs[0].data();
            const subjects = studentData.subjects || [];
            setStudentSubjects(subjects);
          }
        } catch (error) {
          console.error("Error loading student subjects:", error);
        }
      }
    };

    if (user?.email) {
      loadStudentSubjects();
    }
  }, [user]);

  // Filter quizzes based on student class and subjects
  useEffect(() => {
    if (quizzes.length === 0 || !currentUserClass) {
      setFilteredQuizzes([]);
      return;
    }

    const filtered = quizzes.filter((quiz) => {
      const quizTargetClass = (quiz as any).targetClass || "All Classes";

      // Check 1: Is the quiz for the student's class?
      const classMatch =
        quizTargetClass === currentUserClass ||
        quizTargetClass === "All Classes";

      // Check 2: Does the student offer this subject?
      const subjectMatch =
        studentSubjects.length === 0 || studentSubjects.includes(quiz.subject);

      return classMatch && subjectMatch;
    });

    setFilteredQuizzes(filtered);
  }, [quizzes, currentUserClass, studentSubjects]);

  // Update working minutes
  useEffect(() => {
    const updateTodayMinutes = () => {
      const today = new Date();
      const todayIndex = (today.getDay() + 6) % 7;

      setWorkingHours((prev) =>
        prev.map((day, index) => {
          if (index === todayIndex && day.online && onlineStartTime) {
            const minutesOnline = Math.floor(
              (today.getTime() - onlineStartTime.getTime()) / (1000 * 60)
            );
            return {
              ...day,
              minutes: Math.min(1440, Math.max(1, minutesOnline)),
            };
          }
          return day;
        })
      );
    };

    const interval = setInterval(updateTodayMinutes, 60000);
    updateTodayMinutes();
    return () => clearInterval(interval);
  }, [onlineStartTime]);

  // Performance feature selection handler
  const handlePerformanceFeatureSelect = (feature: string) => {
    setPerformanceMenuOpen(false);

    switch (feature) {
      case "live-monitoring":
        setShowLiveMonitoring(true);
        break;
      case "analytics":
        alert("Performance Analytics feature coming soon!");
        break;
      case "grades":
        alert("Grade History feature coming soon!");
        break;
      case "progress":
        alert("Learning Progress feature coming soon!");
        break;
      case "ranking":
        alert("Class Ranking feature coming soon!");
        break;
      default:
        break;
    }
  };

  // Quiz functions
  const handleStartQuiz = (quiz: Quiz) => {
    if (quiz.status !== "active") {
      alert(`This quiz is ${quiz.status}. You can only start active quizzes.`);
      return;
    }

    const submission = quizSubmissions[quiz.id];
    if (submission?.status === "submitted") {
      alert("You have already submitted this quiz. You cannot retake it.");
      return;
    }

    setSelectedQuiz(quiz);
    setShowQuizInstructions(true);
  };

  const handleQuizStart = () => {
    setShowQuizInstructions(false);
    setQuizInProgress(true);
  };

  const handleQuizSubmitted = async (
    quizId: string,
    score: number,
    maxScore: number
  ) => {
    if (!user?.uid || !userInfo.fullName) {
      console.error("Cannot save quiz submission: User not authenticated");
      return;
    }

    const submission = {
      quizId,
      status: "submitted" as const,
      score,
      maxScore,
      submittedAt: new Date().toISOString(),
      attempts: 1,
      studentId: user.uid,
      studentName: userInfo.fullName,
      studentEmail: user.email || "",
      className: currentUserClass || "Unknown Class",
      subject: selectedQuiz?.subject || "Unknown",
      teacherId: null, // Will be populated when teacher views it
      teacherName: selectedQuiz?.teacherName || "Unknown Teacher",
    };

    // Update local state first
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

    // Save to Firestore
    try {
      const submissionId = `${user.uid}_${quizId}`;
      const submissionRef = doc(db, "quizSubmissions", submissionId);

      await setDoc(
        submissionRef,
        {
          ...submission,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Quiz submission saved to Firestore:", submissionId);

      // Also update the monitoring record if it exists
      try {
        const monitoringId = `${quizId}_${user.uid}`;
        const monitoringRef = doc(db, "monitoring", monitoringId);
        await updateDoc(monitoringRef, {
          status: "submitted",
          score: score,
          lastActivity: new Date(),
          updatedAt: serverTimestamp(),
        });
        console.log("✅ Monitoring record updated");
      } catch (monitoringError) {
        console.log("No monitoring record to update (this is normal)");
      }
    } catch (error) {
      console.error("Error saving quiz submission to Firestore:", error);
    }
  };

  const handleQuizClose = () => {
    console.log("🚪 handleQuizClose called - closing quiz");
    setShowQuizInstructions(false);
    setSelectedQuiz(null);
    setQuizInProgress(false);
  };

  const getQuizButtonProps = (quiz: Quiz) => {
    const submission = quizSubmissions[quiz.id];

    if (submission?.status === "submitted") {
      return {
        label: `Submitted (${submission.score}/${submission.maxScore})`,
        color: "#10b981",
        borderColor: "#10b981",
        disabled: true,
      };
    }

    switch (quiz.status) {
      case "active":
        return {
          label: "Start Now",
          color: "#10b981",
          borderColor: "#10b981",
          disabled: false,
        };
      case "upcoming":
        return {
          label: "Upcoming",
          color: "#f59e0b",
          borderColor: "#f59e0b",
          disabled: true,
        };
      case "expired":
        return {
          label: "Expired",
          color: "#ef4444",
          borderColor: "#ef4444",
          disabled: true,
        };
      default:
        return {
          label: "Unknown",
          color: "#6b7280",
          borderColor: "#6b7280",
          disabled: true,
        };
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      console.log("🚪 Dashboard: Logging out and redirecting...");
      await signOutUser();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
  };

  // Live date and calendar
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

  const calYear = now.getFullYear();
  const calMonth = now.getMonth();
  const { days: calDays } = useCalendar(calYear, calMonth);
  const today = now.getDate();
  const examDates = useMemo(() => [7, 14, 21], []);

  // Progress calculation
  const progressPercent = useMemo(() => {
    const submittedQuizzes = Object.values(quizSubmissions).filter(
      (sub) => sub.status === "submitted"
    );
    if (submittedQuizzes.length === 0) return 0;

    const averageScore =
      submittedQuizzes.reduce(
        (sum, sub) => sum + ((sub.score || 0) / sub.maxScore) * 100,
        0
      ) / submittedQuizzes.length;

    return Math.round(averageScore);
  }, [quizSubmissions]);

  const dashArray = `${progressPercent} ${100 - progressPercent}`;

  // Menu items
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    {
      id: "schedule",
      label: "Schedule",
      icon: Calendar,
      Hash: "#upcoming-classes",
    },
    { id: "inbox", label: "Inbox", icon: MessageSquare, Hash: "#" },

    { id: "quizzes", label: "Quizzes", icon: FileText },
  ];

  // Upcoming classes and quizzes
  const upcomingClasses = useMemo(() => {
    const quizItems = filteredQuizzes
      .filter((quiz) => quiz.status === "upcoming" || quiz.status === "active")
      .map((quiz) => ({
        id: `quiz-${quiz.id}`,
        time: quiz.scheduledTime,
        name: quiz.name,
        location: "Online Exam",
        type: "quiz" as const,
        status: quiz.status as "active" | "upcoming",
      }));

    const classItems = [
      {
        id: "class-1",
        time: "09:00",
        name: "Mathematics",
        location: "Room A-101",
        type: "class" as const,
        status: "upcoming" as const,
      },
      {
        id: "class-2",
        time: "11:00",
        name: "Science",
        location: "Lab 204",
        type: "class" as const,
        status: "upcoming" as const,
      },
    ];

    return [...classItems, ...quizItems].slice(0, 5);
  }, [filteredQuizzes]);

  const firstName = userInfo.firstName;
  const fullName = userInfo.fullName;
  const email = userInfo.email;

  // Get avatar initials for mobile
  const firstNameAvatar = userInfo.firstName;
  const lastNameAvatar = userInfo.fullName.split(" ")[1] || "";

  // Loading and error states
  if (loading && !authInitialized) {
    return (
      <div className="app">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">Error: {error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className={`app ${quizInProgress ? "modal-open" : ""}`}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          {/* Logo Section */}
          <div className="logo-section">
            <div className="logo-img"></div>
            <span className="logo-text">SXaint</span>
            <span className="status online-indicator">
              <div className="online-dot"></div>
              Online - Available for work
            </span>
            <button className="follow-btn">Follow</button>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            <button className="icon-btn">
              <Search size={20} />
            </button>
            <button className="icon-btn">
              <Bell size={20} />
            </button>

            {/* Performance Menu Button */}
            <div className="performance-menu-wrapper">
              <button
                className="icon-btn performance-btn"
                onClick={() => setPerformanceMenuOpen(!performanceMenuOpen)}
              >
                <BarChart3 size={20} />
              </button>

              <PerformanceMenu
                isOpen={performanceMenuOpen}
                onClose={() => setPerformanceMenuOpen(false)}
                onFeatureSelect={handlePerformanceFeatureSelect}
              />
            </div>
            <button className="get-in-touch" onClick={handleLogout}>
              <LogOut size={20} />
              Logout
            </button>

            {/* Mobile Profile Avatar */}
            {user && (
              <div className="profile-avatar-container">
                <div
                  className="profile-avatar-mobile"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span>{firstNameAvatar?.charAt(0)?.toUpperCase() || ""}</span>
                </div>

                <div
                  className={`profile-dropdown ${dropdownOpen ? "show" : ""}`}
                >
                  <h2>
                    {firstNameAvatar && lastNameAvatar
                      ? `${
                          firstNameAvatar.charAt(0).toUpperCase() +
                          firstNameAvatar.slice(1)
                        } ${
                          lastNameAvatar.charAt(0).toUpperCase() +
                          lastNameAvatar.slice(1)
                        }`
                      : "Unknown User"}
                  </h2>
                  <p>{user?.email || "No email available"}</p>
                  <p>Class: {currentUserClass || "Not specified"}</p>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </div>
            )}
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
              <div className="results-card">
                <button className="check-results-btn">
                  <BarChart3 size={18} /> Check Results
                </button>
              </div>
              <div className="copyright">© SXaint Student</div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className={`main-content ${quizInProgress ? "blurred" : ""}`}>
          <div className="welcome">
            <h1>Welcome back, {firstName}!</h1>
            <p>
              {dayStr} • {todayStr} • {timeStr}
            </p>
            {currentUserClass && (
              <p
                style={{ color: "#4f46e5", fontWeight: 600, marginTop: "8px" }}
              >
                Class: {currentUserClass}
              </p>
            )}
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
              <div className="ring-text">{progressPercent}%</div>
            </div>
            <div>
              <h2>Your learning progress is {progressPercent}%</h2>
              <p>Keep up the great work and improve your scores!</p>
            </div>
          </div>

          {/* Top Grid */}
          <div className="top-grid">
            <div className="card working-hours">
              <div className="card-header">
                <h3>Study Hours</h3>
                <span>This Week</span>
              </div>
              <div className="bar-chart">
                {workingHours.map((d, i) => {
                  const todayIndex = (new Date().getDay() + 6) % 7;
                  const isToday = i === todayIndex;
                  const barHeight = Math.min(100, (d.minutes / 1440) * 100);

                  return (
                    <div key={i} className="bar-item">
                      <div className="bar-container">
                        <div
                          className={`bar ${d.online ? "online" : "offline"} ${
                            isToday ? "today" : ""
                          }`}
                          style={{ height: `${barHeight}%` }}
                        >
                          {isToday && d.online && (
                            <div className="growing-indicator"></div>
                          )}
                        </div>
                      </div>
                      <span className={isToday ? "today-label" : ""}>
                        {d.day}
                      </span>
                      <div className="minutes-label">{d.minutes}m</div>
                    </div>
                  );
                })}
              </div>
              <div className="total">
                Total{" "}
                <strong>
                  {workingHours.reduce((sum, day) => sum + day.minutes, 0)}m
                </strong>{" "}
                this week
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

            <ClassListPanel
              students={enhancedStudents}
              isOpen={classListOpen}
              toggle={() => setClassListOpen((v) => !v)}
              loading={loading}
              currentUserClass={currentUserClass}
            />

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
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={`day-${i}`} className="day-header">
                    {d}
                  </div>
                ))}
                {calDays.map((day, i) => {
                  if (day === null)
                    return <div key={`empty-${i}`} className="calendar-day" />;
                  const isToday = day === today;
                  const isExam = examDates.includes(day);
                  return (
                    <div
                      key={`day-${i}`}
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

          {/* Bottom Grid - Quizzes in Grid Layout */}
          <div className="bottom-grid">
            <div className="card student-tests">
              <div className="card-header">
                <h3>Available Quizzes ({filteredQuizzes.length})</h3>
                <a href="#" className="view-all">
                  All quizzes
                </a>
              </div>
              <div className="quizzes-grid">
                {filteredQuizzes.length === 0 ? (
                  <div className="empty-state">
                    <FileText size={48} color="#6b7280" />
                    <h3>No quizzes available</h3>
                    <p>Your teacher hasn't uploaded any quizzes yet.</p>
                  </div>
                ) : (
                  filteredQuizzes.map((quiz) => {
                    const buttonProps = getQuizButtonProps(quiz);
                    const submission = quizSubmissions[quiz.id];

                    return (
                      <div
                        key={quiz.id}
                        className="quiz-card"
                        style={{ borderColor: buttonProps.borderColor }}
                      >
                        <div className="quiz-card-header">
                          <div className="quiz-subject">{quiz.subject}</div>
                          <div
                            className="quiz-status"
                            style={{ backgroundColor: buttonProps.color }}
                          >
                            {buttonProps.label}
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
                            {quiz.duration} minutes
                          </div>
                          <div className="detail">
                            <FileText size={16} />
                            {quiz.questions.length} questions
                          </div>
                          <div className="detail">
                            <Award size={16} />
                            Max: {quiz.maxScore} points
                          </div>
                          {submission?.score !== undefined && (
                            <div className="detail score">
                              <CheckCircle size={16} />
                              Your score: {submission.score}/
                              {submission.maxScore}
                            </div>
                          )}
                        </div>

                        <div className="quiz-actions">
                          <button
                            className="quiz-action-btn"
                            onClick={() => handleStartQuiz(quiz)}
                            disabled={buttonProps.disabled}
                            style={{
                              backgroundColor: buttonProps.color,
                              opacity: buttonProps.disabled ? 0.6 : 1,
                            }}
                          >
                            {buttonProps.label}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card upcoming-classes" id="upcoming-classes">
              <div className="card-header">
                <h3>Upcoming Classes & Exams</h3>
                <a href="#" className="view-all">
                  View all
                </a>
              </div>
              <div className="class-list">
                {upcomingClasses.length === 0 ? (
                  <div className="empty-state">
                    No upcoming classes or exams scheduled.
                  </div>
                ) : (
                  upcomingClasses.map((item) => (
                    <div key={item.id} className="class-item">
                      <div className={`class-status ${item.status}`}>
                        {item.type === "quiz" ? (
                          <FileText
                            size={20}
                            color={
                              item.status === "active" ? "#10b981" : "#f59e0b"
                            }
                          />
                        ) : (
                          <Clock size={20} color="#f59e0b" />
                        )}
                      </div>
                      <div>
                        <h4>
                          {item.time} {item.name}
                        </h4>
                        <p>
                          {item.location} •{" "}
                          {item.type === "quiz" ? "Exam" : "Class"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Profile Card */}
        <div className={`profile-card ${quizInProgress ? "blurred" : ""}`}>
          <div className="profile-avatar">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h4>{fullName}</h4>
            <p>{email}</p>
            {currentUserClass && (
              <p
                style={{
                  color: "#4f46e5",
                  fontSize: "14px",
                  marginBottom: "12px",
                }}
              >
                Class: {currentUserClass}
              </p>
            )}
            <div className="stats">
              <div>
                <strong>Rank 14</strong> / 100
              </div>
              <div>
                <strong>Quizzes: {Object.keys(quizSubmissions).length}</strong>
              </div>
            </div>
          </div>
          <button className="profile-arrow">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Quiz Instructions Modal */}
      {showQuizInstructions && selectedQuiz && (
        <QuizInstructionsModal
          quiz={selectedQuiz}
          onStart={handleQuizStart}
          onClose={handleQuizClose}
        />
      )}

      {/* Quiz Interface */}
      {quizInProgress && selectedQuiz && (
        <StrictQuizInterface
          quiz={selectedQuiz}
          onClose={handleQuizClose}
          onSubmit={handleQuizSubmitted}
          strictModeActive={quizInProgress}
          studentName={userInfo.fullName}
          studentId={user?.uid || "unknown"}
          user={user}
        />
      )}

      {/* Performance Menu */}
      <PerformanceMenu
        isOpen={performanceMenuOpen}
        onClose={() => setPerformanceMenuOpen(false)}
        onFeatureSelect={handlePerformanceFeatureSelect}
      />
      {showLiveMonitoring && (
        <StudentLiveMonitoringModal
          isOpen={showLiveMonitoring}
          onClose={() => setShowLiveMonitoring(false)}
          quizzes={filteredQuizzes}
          studentId={user?.uid || "unknown"}
          studentName={userInfo.fullName}
          studentClass={currentUserClass}
          user={user}
        />
      )}

      {/* Include all CSS styles */}
      <style>{`
      /* Results Card Styles */
      .results-card {
        background: #ffffff;
        border-radius: 24px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 2px solid #4299e1;
        margin-top: 20px;
        transition: all 0.3s ease;
      }
      
      .results-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(66, 153, 225, 0.3);
      }
      
      .results-logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }
      
      .logo-img-small {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4299e1, #3182ce);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 24px;
        box-shadow: 0 4px 6px rgba(66, 153, 225, 0.3);
      }
      
      .logo-text-small {
        font-size: 20px;
        font-weight: 700;
        color: #4299e1;
        letter-spacing: -0.5px;
      }
      
      .results-info {
        text-align: center;
      }
      
      .results-info p {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      }
      
      .check-results-btn {
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
        box-shadow: 0 4px 6px -1px rgba(66, 153, 225, 0.3);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .check-results-btn:hover {
        background: #3182ce;
        transform: translateY(-1px);
        box-shadow: 0 6px 8px -1px rgba(66, 153, 225, 0.4);
      }
      
      .check-results-btn:active {
        transform: translateY(0);
      }
      
      /* Responsive adjustments */
      @media (max-width: 1024px) {
        .results-card {
          padding: 24px;
          gap: 16px;
        }
        
        .logo-img-small {
          width: 50px;
          height: 50px;
          font-size: 20px;
        }
        
        .logo-text-small {
          font-size: 18px;
        }
        
        .check-results-btn {
          padding: 12px 16px;
          font-size: 14px;
        }
      }
      
      @media (max-width: 768px) {
        .results-card {
          padding: 20px;
          gap: 12px;
          margin-top: 16px;
        }
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
        
        .quizzes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .quiz-card {
          background: white;
          border: 3px solid;
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .quiz-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .quiz-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
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
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1f2937;
        }
        
        .quiz-teacher {
          color: #6b7280;
          margin-bottom: 15px;
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
        
        .detail.score {
          color: #10b981;
          font-weight: 600;
        }
        
        .quiz-actions {
          margin-top: auto;
        }
        
        .quiz-action-btn {
          width: 100%;
          background: #10b981;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .quiz-action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .quiz-action-btn:disabled {
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        /* Add all other necessary CSS styles here */
        .app.modal-open {
          overflow: hidden;
        }
        .profile-avatar-mobile {
          display: none;
        }
        .profile-dropdown {
          display: none;
        }
        .main-content.blurred,
        .profile-card.blurred {
          filter: blur(4px);
          pointer-events: none;
          user-select: none;
        }
        .quizzes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .quiz-card {
          background: white;
          border: 3px solid;
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .quiz-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        .quiz-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
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
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1f2937;
        }
        .quiz-teacher {
          color: #6b7280;
          margin-bottom: 15px;
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
        .detail.score {
          color: #10b981;
          font-weight: 600;
        }
        .quiz-actions {
          margin-top: auto;
        }
        .quiz-action-btn {
          width: 100%;
          background: #10b981;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .quiz-action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .quiz-action-btn:disabled {
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .modal-open {
          overflow: hidden;
        }
        .main-content.blurred,
        .profile-card.blurred {
          filter: blur(4px);
          pointer-events: none;
          user-select: none;
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
        /* ... rest of your CSS styles ... */
        .quizzes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .quiz-card {
          background: white;
          border: 3px solid;
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .quiz-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .quiz-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
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
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1f2937;
        }
        
        .quiz-teacher {
          color: #6b7280;
          margin-bottom: 15px;
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
        
        .detail.score {
          color: #10b981;
          font-weight: 600;
        }
        
        .quiz-actions {
          margin-top: auto;
        }
        
        .quiz-action-btn {
          width: 100%;
          background: #10b981;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .quiz-action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .quiz-action-btn:disabled {
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        /* Modal overlay styles */
        .modal-open {
          overflow: hidden;
        }
        
        .main-content.blurred,
        .profile-card.blurred {
          filter: blur(4px);
          pointer-events: none;
          user-select: none;
        }
        
        /* Add all other teacher dashboard CSS styles here */
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
          margin-top: 10px;
          font-size: 13px;
          color: #9ca3af;
          text-align: center;
        }
        .main-content {
          margin-left: 320px;
          padding: 48px;
          flex: 1;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease;
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
          background: #4299e1;
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
        /* Add these styles to your existing CSS */
        
        /* Quiz Start Screen Styles */
        .quiz-start-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0);
          z-index: 2000;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        
        .start-screen-content {
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          text-align: center;
          background: #1e293b;
          padding: 40px;
          border-radius: 20px;
          border: 2px solid #334155;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .start-screen-content h1 {
          margin: 20px 0 10px 0;
          color: white;
          font-size: 28px;
          font-weight: 600;
          line-height: 1.3;
          word-wrap: break-word;
        }
        .start-screen-content * {
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .quiz-title {
          margin: 0 0 30px 0;
          color: #94a3b8;
          font-size: 16px;
          line-height: 1.4;
          word-wrap: break-word;
        }
        
        .quiz-details-start {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 30px;
          background: #0f172a;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #334155;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          color: #cbd5e1;
          min-width: 0;
        }
        
        .detail-item svg {
          color: #60a5fa;
          flex-shrink: 0;
        }
        
        .warning-box {
          background: #fef3c7;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 30px;
          color: #92400e;
          min-width: 0;
        }
        
        .warning-box svg {
          color: #d97706;
          flex-shrink: 0;
        }
        
        .warning-box p {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
          text-align: left;
          word-wrap: break-word;
          min-width: 0;
        }
        
        .start-buttons {
          display: flex;
          gap: 16px;
          margin-top: auto;
        }
        
        .start-buttons .nav-btn {
          flex: 1;
          padding: 14px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 16px;
          transition: all 0.3s ease;
          min-width: 120px;
        }
        
        .start-buttons .nav-btn.cancel {
          background: #374151;
          color: white;
          border: 1px solid #4b5563;
        }
        
        .start-buttons .nav-btn.cancel:hover {
          background: #4b5563;
          transform: translateY(-2px);
        }
        
        .start-buttons .nav-btn.start {
          background: #10b981;
          color: white;
          border: 1px solid #10b981;
        }
        
        .start-buttons .nav-btn.start:hover {
          background: #059669;
          transform: translateY(-2px);
        }
        
        /* Ensure no overflow in quiz interface */
        .quiz-interface {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0f172a;
          color: white;
          font-family: "Inter", sans-serif;
          z-index: 2000;
          overflow: hidden;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .start-screen-content {
            padding: 30px 20px;
            width: 95%;
            max-height: 85vh;
          }
        
          .start-screen-content h1 {
            font-size: 24px;
          }
        
          .quiz-details-start {
            padding: 15px;
            max-height: 250px;
          }
        
          .detail-item {
            font-size: 14px;
          }
        
          .warning-box {
            padding: 12px;
          }
        
          .warning-box p {
            font-size: 13px;
          }
        
          .start-buttons {
            flex-direction: column;
            gap: 12px;
          }
        
          .start-buttons .nav-btn {
            width: 100%;
            padding: 12px 16px;
          }
        
          .header {
            padding: 0 24px;
          }
        
          .get-in-touch {
            display: none !important;
          }
        
          .main-content {
            padding: 24px;
            margin-left: 0;
          }
        
          .sidebar.open ~ .main-content {
            margin-left: 300px;
          }
        
          .sidebar:not(.open) ~ .main-content {
            margin-left: 88px;
          }
        
          .sidebar.open {
            transform: translateX(0);
          }
        
          .sidebar:not(.open) {
            width: 88px !important;
          }
        
          .profile-card {
            display: none !important;
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
        
          /* Mobile Profile Styles */
          .profile-avatar-container {
            display: block;
          }
        
          .profile-avatar-mobile {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #cce0ff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            cursor: pointer;
            color: #4299e1;
            user-select: none;
          }
        
          .profile-dropdown {
            position: absolute;
            top: 70px;
            right: 10px;
            width: 200px;
            background-color: #fff;
            border-radius: 8px;
            padding: 0.75rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            display: none;
            z-index: 100;
          }
        
          .profile-dropdown.show {
            display: block;
          }
        
          .profile-dropdown h2 {
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
            font-weight: 600;
          }
        
          .profile-dropdown p {
            font-size: 0.8rem;
            color: #555;
            margin-bottom: 0.5rem;
          }
        
          .profile-dropdown button {
            background: #4299e1;
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 0 24px;
            height: 30px;
            font-size: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
            width: 100%;
            gap: 8px;
            justify-content: center;
          }
        }
        
        @media (max-width: 480px) {
          .performance-menu-grid {
            grid-template-columns: 1fr;
          }
        
          .monitoring-stats {
            grid-template-columns: 1fr;
          }
        
          /* Reduce overall padding for small screens */
          .header {
            padding: 0 16px;
          }
        
          .main-content {
            padding: 16px;
            margin-left: 0 !important;
          }
        
          /* Sidebar behavior on very small screens */
          .sidebar.open ~ .main-content {
            margin-left: 260px;
          }
        
          .sidebar:not(.open) ~ .main-content {
            margin-left: 70px;
          }
        
          .sidebar.open {
            transform: translateX(0);
          }
        
          .sidebar:not(.open) {
            width: 70px !important;
          }
        
          /* Hide non-essential sections */
          .profile-card {
            display: none !important;
          }
        
          .get-in-touch {
            display: none !important;
          }
        
          /* Cards & grids collapse */
          .progress-card {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }
        
          .monitoring-stats {
            grid-template-columns: 1fr;
          }
        
          .monitoring-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        
          .progress-display {
            width: 100%;
            justify-content: space-between;
          }
        
          .grade-controls {
            grid-template-columns: 1fr;
          }
        
          .action-buttons,
          .modal-footer {
            flex-direction: column;
            gap: 12px;
          }
        
          .footer-left,
          .footer-right {
            justify-content: center;
            width: 100%;
          }
        
          /* Mobile avatar + dropdown */
          .profile-avatar-container {
            display: block;
          }
        
          .profile-avatar-mobile {
            width: 36px;
            height: 36px;
            font-size: 0.85rem;
          }
        
          .profile-dropdown {
            top: 45px;
            right: 0;
            width: 180px;
            padding: 0.5rem;
          }
        
          .profile-dropdown h2 {
            font-size: 0.85rem;
          }
        
          .profile-dropdown p {
            font-size: 0.75rem;
          }
        
          .profile-dropdown button {
            height: 28px;
            font-size: 14px;
            padding: 0 20px;
          }
        
          /* Quiz screen adjustments */
          .start-screen-content {
            padding: 25px 15px;
            border-radius: 16px;
          }
        
          .start-screen-content h1 {
            font-size: 22px;
            margin: 15px 0 8px 0;
          }
        
          .quiz-title {
            font-size: 14px;
            margin-bottom: 20px;
          }
        
          .detail-item {
            font-size: 13px;
            gap: 8px;
          }
        
          .quiz-details-start {
            padding: 12px;
            gap: 8px;
          }
        }
        
        /* Add emergency exit specific styles */
        .emergency-exit-active {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #ef4444;
          color: white;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-weight: 600;
          z-index: 2001;
          animation: flash 1s infinite;
        }
        
        .emergency-badge {
          background: #ef4444;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 8px;
          font-weight: 600;
        }
        
        .emergency-status {
          color: #ef4444;
          font-weight: 600;
          padding: 4px 8px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 4px;
          font-size: 12px;
        }
        
        @keyframes flash {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .question-indicator:disabled,
        .flag-btn:disabled,
        .option-btn:disabled,
        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
      `}</style>
    </div>
  );
};

export default StudentDashboard;
