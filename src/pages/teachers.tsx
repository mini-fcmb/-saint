// app/teachers/page.tsx
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
  ChevronDown,
  Book,
  Building,
  Info,
} from "lucide-react";
import {
  useFirebaseStore,
  Student as FirebaseStudent,
} from "../stores/useFirebaseStore";
import { useLiveDate, useCalendar } from "../hooks/useDateUtils";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Enhanced Types
interface TeacherClassInfo {
  className: string;
  subjects: string[];
}

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
  targetClass: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface WorkingHoursData {
  day: string;
  minutes: number;
  online: boolean;
  startTime?: Date;
}

interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  subject: string;
  term: string;
  session: string;
  objScore: number; // Auto from quiz results
  caScore: number;
  theoryScore: number;
  totalScore: number;
  percentage: number;
  grade: string;
  positionInClass?: number;
  remark: string;
  quizInfo?: {
    totalQuizzes: number;
    averagePercentage: number;
    lastQuiz?: string;
  };
}

// Update the GradeSystem interface
interface GradeSystem {
  grades: {
    A1: { min: number; max: number; points: number };
    B2: { min: number; max: number; points: number };
    B3: { min: number; max: number; points: number };
    C4: { min: number; max: number; points: number };
    C5: { min: number; max: number; points: number };
    C6: { min: number; max: number; points: number };
    D7: { min: number; max: number; points: number };
    E8: { min: number; max: number; points: number };
    F9: { min: number; max: number; points: number };
  };
  maxScores: {
    obj: number;
    ca: number;
    theory: number;
  };
}
// Real-time Monitoring Types
interface EnhancedMonitoringData {
  id?: string;
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

// Performance Management Menu Component
interface PerformanceMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFeatureSelect: (feature: string) => void;
}

const PerformanceMenu: React.FC<PerformanceMenuProps> = ({
  isOpen,
  onClose,
  onFeatureSelect,
}) => {
  const menuItems = [
    {
      id: "grade-management",
      label: "Grade Management System",
      icon: Table,
      description: "Manage student grades and results",
      color: "#10b981",
    },
    {
      id: "live-monitoring",
      label: "Live Exam Monitoring",
      icon: Eye,
      description: "Real-time tracking of active quizzes",
      color: "#3b82f6",
    },
    {
      id: "upload-ca",
      label: "Upload CA Scores",
      icon: Upload,
      description: "Bulk upload continuous assessment scores",
      color: "#8b5cf6",
    },
    {
      id: "upload-theory",
      label: "Upload Theory Results",
      icon: BookOpen,
      description: "Upload theory exam scores",
      color: "#f59e0b",
    },
    {
      id: "view-grades",
      label: "View Final Grades",
      icon: BarChart3,
      description: "See calculated grades and reports",
      color: "#06b6d4",
    },
    {
      id: "export-reports",
      label: "Export Reports",
      icon: Download,
      description: "Download report cards and analytics",
      color: "#84cc16",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="performance-menu-overlay" onClick={onClose}>
      <div
        className="performance-menu-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="performance-menu-header">
          <h2>Performance Management</h2>
          <p>Manage student assessments and grades</p>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="performance-menu-grid">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="performance-menu-item"
                onClick={() => onFeatureSelect(item.id)}
              >
                <div
                  className="menu-item-icon"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon size={24} color={item.color} />
                </div>
                <div className="menu-item-content">
                  <h4>{item.label}</h4>
                  <p>{item.description}</p>
                </div>
                <div className="menu-item-arrow">
                  <ChevronRight size={16} color="#6b7280" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface Student extends FirebaseStudent {
  fullName: string;
  subjects: string[];
  classes?: string[];
  uid?: string;
  userId?: string;
  studentId?: string;
}

interface LiveMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeQuizzes: Quiz[];
  students: Student[];
  teacherClasses: TeacherClassInfo[];
  user: any;
}

const LiveMonitoringModal: React.FC<LiveMonitoringModalProps> = ({
  isOpen,
  onClose,
  activeQuizzes,
  students,
  teacherClasses,
  user,
}) => {
  const [monitoringData, setMonitoringData] = useState<
    EnhancedMonitoringData[]
  >([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Add these functions inside the LiveMonitoringModal component

  // 1. Check if student has started a quiz
  const checkIfStudentHasStartedQuiz = async (
    studentId: string,
    quizId: string
  ): Promise<boolean> => {
    try {
      // Check if there's a submission in progress for this student and quiz
      const submissionsRef = collection(db, "studentQuizSubmissions");
      const q = query(
        submissionsRef,
        where("studentId", "==", studentId),
        where("quizId", "==", quizId)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking if student started quiz:", error);
      return false;
    }
  };

  // 2. Setup submission listener
  const setupSubmissionListener = () => {
    if (!user?.uid || !teacherClasses.length) return () => {};

    const teacherClassNames = teacherClasses.map((c) => c.className);

    // Listen for quiz submissions
    const submissionsRef = collection(db, "studentQuizSubmissions");
    const q = query(
      submissionsRef,
      where("className", "in", teacherClassNames),
      where("status", "==", "submitted")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          console.log(
            `📝 Student ${data.studentName} submitted quiz ${data.quizName}`
          );

          // Update monitoring data to show "submitted" for this student
          setMonitoringData((prev) =>
            prev.map((item) => {
              if (
                item.studentId === data.studentId &&
                item.quizId === data.quizId
              ) {
                return {
                  ...item,
                  status: "submitted",
                  progress: 100,
                  score: data.score,
                  maxScore: data.maxScore,
                  lastActivity: new Date(),
                };
              }
              return item;
            })
          );
        }
      });
    });

    return unsubscribe;
  };

  // REPLACED the existing createSampleMonitoringData function with this:

  const createSampleMonitoringData = (): EnhancedMonitoringData[] => {
    if (students.length === 0 || activeQuizzes.length === 0) return [];

    const sampleData: EnhancedMonitoringData[] = [];

    // Only create sample data for active quizzes
    const activeQuiz = activeQuizzes.find((quiz) => quiz.status === "active");
    if (!activeQuiz) return [];

    // Only show 3 sample students (not all)
    students.slice(0, 3).forEach((student, index) => {
      // Simulate: 1st student in-progress, 2nd student violation, 3rd student submitted
      const statuses: ("in-progress" | "violation" | "submitted")[] = [
        "in-progress",
        "violation",
        "submitted",
      ];
      const status = statuses[index] || "in-progress";

      const data: EnhancedMonitoringData = {
        studentId: student.id || `student-${index}`,
        studentName: student.fullName || `Student ${index + 1}`,
        studentClass: student.className || "Class A",
        quizId: activeQuiz.id,
        quizName: activeQuiz.name,
        quizClass: activeQuiz.targetClass || "Class A",
        status: status,
        progress:
          status === "submitted" ? 100 : Math.floor(Math.random() * 30) + 70,
        timeSpent:
          status === "submitted"
            ? `${activeQuiz.duration}:00`
            : `${Math.floor(Math.random() * 20) + 1}:${Math.floor(
                Math.random() * 60
              )
                .toString()
                .padStart(2, "0")}`,
        currentQuestion:
          status === "submitted"
            ? activeQuiz.questions.length
            : Math.floor(Math.random() * activeQuiz.questions.length) + 1,
        totalQuestions: activeQuiz.questions.length,
        violations:
          status === "violation"
            ? [
                {
                  id: `violation-${Date.now()}-${index}`,
                  timestamp: new Date(Date.now() - Math.random() * 300000),
                  type: "tab-switch",
                  description: "Switched to another browser tab",
                  severity: "medium",
                  studentId: student.id || `student-${index}`,
                  studentName: student.fullName || `Student ${index + 1}`,
                  studentClass: student.className || "Class A",
                  quizId: activeQuiz.id,
                  quizName: activeQuiz.name,
                  quizClass: activeQuiz.targetClass || "Class A",
                  browser: "Chrome/120.0",
                  deviceType: "Desktop",
                },
              ]
            : [],
        lastActivity: new Date(Date.now() - Math.random() * 600000),
        score:
          status === "submitted"
            ? Math.floor(Math.random() * activeQuiz.maxScore)
            : undefined,
        maxScore: activeQuiz.maxScore,
      };

      sampleData.push(data);
    });

    return sampleData;
  };

  const saveMonitoringDataToFirestore = async (
    data: EnhancedMonitoringData
  ) => {
    if (!user?.uid) return;

    try {
      const monitoringId = `${data.quizId}_${data.studentId}`;
      const monitoringRef = doc(db, "monitoring", monitoringId);

      await setDoc(
        monitoringRef,
        {
          ...data,
          teacherId: user.uid,
          teacherName: user.displayName || "Teacher",
          lastActivity: new Date(),
          updatedAt: new Date(),
        },
        { merge: true }
      );

      console.log("✅ Monitoring data saved to Firestore");
    } catch (error) {
      console.error("❌ Error saving monitoring data:", error);
      throw error;
    }
  };

  // Add real-time listener for grade updates
  useEffect(() => {
    if (!user?.uid || !isOpen) return;

    // The real implementation would be in GradeManagementModal
    console.log("🔄 Live monitoring active");
  }, [user, isOpen]);

  // Update progress for in-progress quizzes
  useEffect(() => {
    if (!isOpen || monitoringData.length === 0 || !autoRefresh) return;

    const interval = setInterval(() => {
      setMonitoringData((prev) =>
        prev.map((item) => {
          // Only update items that are in-progress or have violations (still taking quiz)
          if (item.status === "in-progress" || item.status === "violation") {
            // Increase progress slightly (1-3%)
            const newProgress = Math.min(
              99,
              item.progress + (Math.random() * 0.5 + 0.1)
            );
            // Increase time spent by 1 minute
            const [minutes, seconds] = item.timeSpent.split(":").map(Number);
            const totalSeconds = minutes * 60 + seconds + 60; // Add 1 minute
            const newMinutes = Math.floor(totalSeconds / 60);
            const newSeconds = totalSeconds % 60;

            // Update current question based on progress
            const newCurrentQuestion = Math.min(
              item.totalQuestions,
              Math.floor((newProgress / 100) * item.totalQuestions) + 1
            );

            return {
              ...item,
              progress: Math.round(newProgress),
              timeSpent: `${newMinutes}:${newSeconds
                .toString()
                .padStart(2, "0")}`,
              currentQuestion: newCurrentQuestion,
              lastActivity: new Date(),
            };
          }
          return item;
        })
      );
    }, 10000); // Update every 10 seconds when auto-refresh is on

    return () => clearInterval(interval);
  }, [isOpen, monitoringData.length, autoRefresh]);

  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    const submissionUnsubscribe = setupSubmissionListener();

    return () => {
      if (submissionUnsubscribe) {
        submissionUnsubscribe();
      }
    };
  }, [isOpen, user, teacherClasses]);

  // Update the useEffect that loads monitoring data in LiveMonitoringModal
  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    const loadData = async () => {
      try {
        // Get teacher's classes first
        const teacherClassNames = teacherClasses.map(
          (c: TeacherClassInfo) => c.className
        );

        // Query monitoring collection
        const monitoringRef = collection(db, "monitoring");
        let q;

        if (selectedQuiz === "all") {
          // Get all monitoring for teacher's classes
          q = query(
            monitoringRef,
            where("quizClass", "in", teacherClassNames),
            where("status", "in", ["in-progress", "submitted", "violation"])
          );
        } else {
          q = query(
            monitoringRef,
            where("quizId", "==", selectedQuiz),
            where("status", "in", ["in-progress", "submitted", "violation"])
          );
        }

        const querySnapshot = await getDocs(q);
        const monitoringData: EnhancedMonitoringData[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Check if the quiz belongs to this teacher
          const quiz = activeQuizzes.find((q) => q.id === data.quizId);
          if (quiz) {
            monitoringData.push({
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
            });
          }
        });

        setMonitoringData(monitoringData);

        if (monitoringData.length === 0) {
          // Create sample data if no real data exists (for testing)
          const sampleData = createSampleMonitoringData();
          setMonitoringData(sampleData);
        }
      } catch (error) {
        console.error("Error loading monitoring data:", error);

        // Use sample data temporarily
        const sampleData = createSampleMonitoringData();
        setMonitoringData(sampleData);
      }
    };

    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh, selectedQuiz, teacherClasses, user, activeQuizzes]);
  // REPLACE THE ABOVE CODE WITH THIS:
  useEffect(() => {
    if (!isOpen || !user?.uid || !teacherClasses.length) return;

    const teacherClassNames = teacherClasses.map(
      (c: TeacherClassInfo) => c.className
    );

    console.log(
      "🎯 Setting up live monitoring for ACTIVE quizzes in classes:",
      teacherClassNames
    );

    // Only monitor ACTIVE quizzes
    const activeQuizIds = activeQuizzes
      .filter((quiz) => quiz.status === "active")
      .map((quiz) => quiz.id);

    if (activeQuizIds.length === 0) {
      console.log("❌ No active quizzes to monitor");
      setMonitoringData([]);
      return;
    }

    console.log("✅ Active quizzes to monitor:", activeQuizIds);

    // Set up real-time listener - ONLY for active quizzes and specific statuses
    const monitoringRef = collection(db, "monitoring");
    const q = query(
      monitoringRef,
      where("quizId", "in", activeQuizIds),
      where("quizClass", "in", teacherClassNames),
      where("status", "in", ["in-progress", "violation"])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(
          "🔄 Live monitoring snapshot update:",
          snapshot.size,
          "documents"
        );

        const monitoringData: EnhancedMonitoringData[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();

          // Check if this is relevant data (has required fields)
          if (!data.studentId || !data.quizId) {
            console.log("Skipping document - missing studentId or quizId");
            return;
          }

          // Log for debugging
          console.log("📊 Monitoring data received:", {
            id: doc.id,
            student: data.studentName,
            status: data.status,
            violations: data.violations?.length || 0,
          });

          // Convert Firestore timestamps
          const violations = (data.violations || []).map((v: any) => ({
            ...v,
            timestamp: v.timestamp?.toDate
              ? v.timestamp.toDate()
              : v.timestamp
              ? new Date(v.timestamp)
              : new Date(),
          }));

          // Determine correct status
          let status = data.status || "in-progress";

          // If there are violations, mark as violation (unless already submitted)
          if (violations.length > 0 && status !== "submitted") {
            status = "violation";
          }

          monitoringData.push({
            id: doc.id,
            studentId: data.studentId || "",
            studentName: data.studentName || "Unknown Student",
            studentClass: data.studentClass || "Unknown Class",
            quizId: data.quizId || "",
            quizName: data.quizName || "Unknown Quiz",
            quizClass: data.quizClass || "Unknown Class",
            status: status,
            progress: data.progress || 0,
            timeSpent: data.timeSpent || "00:00",
            currentQuestion: data.currentQuestion || 0,
            totalQuestions: data.totalQuestions || 0,
            violations: violations,
            lastActivity: data.lastActivity?.toDate
              ? data.lastActivity.toDate()
              : data.lastActivity
              ? new Date(data.lastActivity)
              : new Date(),
            score: data.score,
            maxScore: data.maxScore,
            studentEmail: data.studentEmail || "",
          });
        });

        console.log(
          "✅ Final active monitoring data count:",
          monitoringData.length
        );

        // If no real data but we have active quizzes, show sample data for demo
        if (monitoringData.length === 0 && activeQuizzes.length > 0) {
          const sampleData = createSampleMonitoringData();
          console.log("📋 Using sample data:", sampleData.length);
          setMonitoringData(sampleData);
        } else {
          setMonitoringData(monitoringData);
        }
      },
      (error) => {
        console.error("❌ Live monitoring error:", error);
        console.error("Error details:", error.code, error.message);

        // Fallback to sample data on error
        const sampleData = createSampleMonitoringData();
        setMonitoringData(sampleData);
      }
    );

    return () => {
      console.log("🧹 Cleaning up live monitoring listener");
      unsubscribe();
    };
  }, [isOpen, user, teacherClasses, activeQuizzes]);
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

  // Calculate statistics
  const activeStudents = filteredData.filter(
    (d) => d.status === "in-progress"
  ).length;
  const submittedStudents = filteredData.filter(
    (d) => d.status === "submitted"
  ).length;
  const violationStudents = filteredData.filter(
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
            <h2>Live Exam Monitoring</h2>
            <p>Real-time tracking of student activities</p>
          </div>
          <div className="monitoring-controls">
            <div className="live-indicator">
              <div className="live-dot"></div>
              Live
            </div>
            <button
              className="refresh-manual-btn"
              onClick={async () => {
                console.log("🔄 Manual refresh triggered");
                // Force a refresh by clearing and reloading
                setMonitoringData([]);
                // Add a small delay to show loading
                await new Promise((resolve) => setTimeout(resolve, 500));
                // Re-trigger the effect by changing a state
                setSelectedQuiz((prev) => (prev === "all" ? "temp" : "all"));
                setTimeout(() => {
                  setSelectedQuiz("all");
                }, 100);
              }}
            >
              <RefreshCw size={16} />
              Refresh Now
            </button>
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
              <option value="all">All Quizzes ({activeQuizzes.length})</option>
              {activeQuizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.name} ({quiz.targetClass})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-body">
          {/* Monitoring Stats */}
          <div className="monitoring-stats">
            <div className="stat-card">
              <UserCheck size={24} color="#3b82f6" />
              <span className="stat-number">{activeStudents}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-card">
              <CheckCircle size={24} color="#10b981" />
              <span className="stat-number">{submittedStudents}</span>
              <span className="stat-label">Submitted</span>
            </div>
            <div className="stat-card">
              <AlertTriangle size={24} color="#ef4444" />
              <span className="stat-number">{violationStudents}</span>
              <span className="stat-label">Violations</span>
            </div>
            <div className="stat-card">
              <Users size={24} color="#6b7280" />
              <span className="stat-number">{filteredData.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>

          {/* Students Monitoring */}
          <div className="students-monitoring">
            <h4>Student Progress ({filteredData.length} students)</h4>
            <div className="monitoring-list">
              {filteredData.length === 0 ? (
                <div className="empty-state">
                  <EyeOff size={48} color="#9ca3af" />
                  {activeQuizzes.filter((q) => q.status === "active").length ===
                  0 ? (
                    <>
                      <p>No active quizzes running</p>
                      <span>
                        Create and activate quizzes to start monitoring
                      </span>
                    </>
                  ) : (
                    <>
                      <p>No students currently taking quizzes</p>
                      <span>
                        Students will appear here when they start active quizzes
                      </span>
                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        Active quizzes:{" "}
                        {activeQuizzes
                          .filter((q) => q.status === "active")
                          .map((q) => q.name)
                          .join(", ")}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                filteredData.map((data) => (
                  <div key={data.studentId} className="monitoring-item">
                    <div className="student-info">
                      <div className="student-avatar-small">
                        {data.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="student-details">
                        <div className="student-name-section">
                          <strong>{data.studentName}</strong>
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
                            <Clock size={12} /> Time: {data.timeSpent}
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
          <button className="action-btn primary" onClick={onClose}>
            Close Monitoring
          </button>
        </div>
      </div>
    </div>
  );
};

// Reschedule Modal Component
interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (
    quizId: string,
    newDate: string,
    newTime: string,
    newDuration?: number
  ) => void;
  quiz: Quiz | null;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  onReschedule,
  quiz,
}) => {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState(30);

  useEffect(() => {
    if (quiz && isOpen) {
      setNewDate(quiz.scheduledDate);
      setNewTime(quiz.scheduledTime);
      setNewDuration(quiz.duration);
    }
  }, [quiz, isOpen]);

  const handleTimeAdjustment = (minutes: number) => {
    if (newTime) {
      const [hours, mins] = newTime.split(":").map(Number);
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(mins + minutes);
      setNewTime(
        `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
    }
  };

  const handleSubmit = () => {
    if (quiz && newDate && newTime) {
      onReschedule(quiz.id, newDate, newTime, newDuration);
      onClose();
    }
  };

  if (!isOpen || !quiz) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content small-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Reschedule Quiz</h2>
            <p>Adjust date, time, and duration for "{quiz.name}"</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Quiz Details</label>
            <div className="quiz-details">
              <p>
                <strong>Name:</strong> {quiz.name}
              </p>
              <p>
                <strong>Subject:</strong> {quiz.subject}
              </p>
              <p>
                <strong>Class:</strong> {quiz.targetClass}
              </p>
              <p>
                <strong>Questions:</strong> {quiz.questions.length}
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>New Date *</label>
            <input
              type="date"
              className="text-input"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="form-group">
            <label>New Time *</label>
            <div className="time-control">
              <input
                type="time"
                className="text-input"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <div className="time-adjustments">
                <button
                  type="button"
                  className="time-adjust-btn"
                  onClick={() => handleTimeAdjustment(5)}
                >
                  +5 min
                </button>
                <button
                  type="button"
                  className="time-adjust-btn"
                  onClick={() => handleTimeAdjustment(-5)}
                >
                  -5 min
                </button>
                <button
                  type="button"
                  className="time-adjust-btn"
                  onClick={() => handleTimeAdjustment(15)}
                >
                  +15 min
                </button>
                <button
                  type="button"
                  className="time-adjust-btn"
                  onClick={() => handleTimeAdjustment(-15)}
                >
                  -15 min
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Test Duration (minutes) *</label>
            <input
              type="number"
              min="5"
              max="180"
              className="text-input"
              value={newDuration}
              onChange={(e) => setNewDuration(parseInt(e.target.value) || 30)}
            />
            <small>Time students have to complete the test</small>
          </div>

          <div className="reschedule-summary">
            <h4>Schedule Summary</h4>
            <p>
              <strong>Current:</strong>{" "}
              {new Date(quiz.scheduledDate).toLocaleDateString()} at{" "}
              {quiz.scheduledTime} ({quiz.duration} min)
            </p>
            <p>
              <strong>New:</strong> {new Date(newDate).toLocaleDateString()} at{" "}
              {newTime} ({newDuration} min)
            </p>
            <p>
              <strong>Total Duration:</strong> {newDuration + 10} minutes
              (including 10min buffer)
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="action-btn save"
            onClick={handleSubmit}
            disabled={!newDate || !newTime}
          >
            Update Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

// Quiz Name Modal Component
interface QuizNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    duration: number,
    scheduledDate: string,
    scheduledTime: string,
    subject: string,
    maxScore: number,
    targetClass: string
  ) => void;
  questions: Question[];
  teacherClasses: TeacherClassInfo[];
}
// Enhanced Grade Management System Modal
interface GradeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teacherClasses: TeacherClassInfo[];
  user: any;
  initialSelectedClass?: string;
  initialSelectedSubject?: string;
  initialActiveTerm?: string;
  initialActiveSession?: string;
}

const GradeManagementModal: React.FC<GradeManagementModalProps> = ({
  isOpen,
  onClose,
  students,
  teacherClasses,
  user,
  initialSelectedClass = "",
  initialSelectedSubject = "",
  initialActiveTerm = "First Term",
  initialActiveSession = "2024/2025",
}) => {
  // State declarations
  const [isEditing, setIsEditing] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState(initialSelectedClass);
  const [selectedSubject, setSelectedSubject] = useState(
    initialSelectedSubject
  );
  const [activeTerm, setActiveTerm] = useState(initialActiveTerm);
  const [activeSession, setActiveSession] = useState(initialActiveSession);
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [savingGrades, setSavingGrades] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const { userData } = useFirebaseStore();

  const normalizeClassName = (className: string): string => {
    return (className || "").toLowerCase().replace(/\s+/g, "").trim();
  };

  // Initialize grade system
  const gradeSystem: GradeSystem = {
    grades: {
      A1: { min: 75, max: 100, points: 1 },
      B2: { min: 70, max: 74, points: 2 },
      B3: { min: 65, max: 69, points: 3 },
      C4: { min: 60, max: 64, points: 4 },
      C5: { min: 55, max: 59, points: 5 },
      C6: { min: 50, max: 54, points: 6 },
      D7: { min: 45, max: 49, points: 7 },
      E8: { min: 40, max: 44, points: 8 },
      F9: { min: 0, max: 39, points: 9 },
    },
    maxScores: {
      obj: 30,
      ca: 40,
      theory: 30,
    },
  };

  // Update available subjects when class changes
  useEffect(() => {
    if (selectedClass) {
      const classInfo = teacherClasses.find(
        (c) => c.className === selectedClass
      );
      if (classInfo) {
        setAvailableSubjects(classInfo.subjects);
        if (classInfo.subjects.length > 0 && !selectedSubject) {
          setSelectedSubject(classInfo.subjects[0]);
        }
      }
    }
  }, [selectedClass, teacherClasses, selectedSubject]);

  // Filter students by selected class - WITH NORMALIZATION
  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];

    console.log("🔍 Filtering students for class:", selectedClass);
    console.log("📊 Total students available:", students.length);
    console.log("🏫 Selected class:", selectedClass);
    console.log("📋 Teacher classes:", teacherClasses);

    // Enhanced normalization function
    const normalizeClassName = (className: string | undefined): string => {
      if (!className) return "";
      // Convert to lowercase, remove spaces, hyphens, underscores
      return className
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[_-]/g, "")
        .trim();
    };

    // Normalize the selected class
    const normalizedSelectedClass = normalizeClassName(selectedClass);
    console.log("🔤 Normalized selected class:", normalizedSelectedClass);

    // Filter students
    const filtered = students.filter((student) => {
      const studentClass = student.className || "";
      const normalizedStudentClass = normalizeClassName(studentClass);

      // Debug log for each student
      console.log(`👤 ${student.first} ${student.last}: 
      Original class: "${studentClass}"
      Normalized: "${normalizedStudentClass}"
      Matches? ${normalizedStudentClass === normalizedSelectedClass}`);

      return normalizedStudentClass === normalizedSelectedClass;
    });

    console.log(
      `✅ Found ${filtered.length} students for class "${selectedClass}"`
    );
    console.log(
      "📋 Filtered students:",
      filtered.map((s) => `${s.first} ${s.last} (${s.className})`)
    );

    return filtered;
  }, [students, selectedClass]);

  // Replace the current loadQuizResults function with this:
  // REPLACE your loadQuizResults function with this FIXED version:
  const loadQuizResults = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !user?.uid) return;

    try {
      console.log("🎯 FIXED VERSION - Loading quiz results");

      const submissionsRef = collection(db, "quizSubmissions");

      // Query 1: Get submissions with teacherId
      const q1 = query(submissionsRef, where("teacherId", "==", user.uid));

      // Query 2: Get submissions without teacherId but matching class/subject
      const q2 = query(
        submissionsRef,
        where("className", "==", selectedClass),
        where("subject", "==", selectedSubject)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      console.log(
        `📊 Results: ${snapshot1.docs.length} with teacherId, ${snapshot2.docs.length} without teacherId`
      );

      // Combine results
      const allDocs = new Map();

      // Add docs from first query
      snapshot1.docs.forEach((doc) => {
        allDocs.set(doc.id, doc.data());
      });

      // Add docs from second query (if they don't have teacherId or it's undefined)
      snapshot2.docs.forEach((doc) => {
        const data = doc.data();
        if (!data.teacherId && !data.teacherID && !data.teacher) {
          allDocs.set(doc.id, {
            ...data,
            teacherId: user.uid, // Add teacherId now
            teacherName: user.displayName || "Teacher",
            teacherEmail: user.email || "",
          });
        }
      });

      console.log(`📦 Total unique submissions: ${allDocs.size}`);

      // Group by student
      const submissionsByStudent = new Map();

      allDocs.forEach((data, docId) => {
        // Try multiple student ID fields
        const studentId =
          data.studentId ||
          data.studentID ||
          data.userId ||
          data.uid ||
          data.student?.id ||
          `student-${docId}`;

        const studentName =
          data.studentName ||
          data.student ||
          (typeof data.student === "object"
            ? data.student.name
            : "Unknown Student");

        if (!submissionsByStudent.has(studentId)) {
          submissionsByStudent.set(studentId, []);
        }

        const score = data.score || data.totalScore || data.obtainedScore || 0;
        const maxScore =
          data.maxScore ||
          data.totalPossibleScore ||
          data.maxPossibleScore ||
          100;
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

        submissionsByStudent.get(studentId).push({
          score: score,
          maxScore: maxScore,
          percentage: percentage,
          quizName: data.quizName || "Unknown Quiz",
          studentName: studentName,
          submittedAt:
            data.submittedAt?.toDate?.() ||
            data.timestamp?.toDate?.() ||
            new Date(),
          rawData: data,
        });
      });

      console.log(
        `📈 Student quiz data grouped: ${submissionsByStudent.size} students`
      );

      // Update grade records
      setGradeRecords((prev) => {
        return prev.map((record) => {
          console.log(
            `👤 Checking student: ${record.studentName} (ID: ${record.studentId})`
          );

          // Try to find submissions for this student
          let studentSubmissions = null;

          // Try by ID first
          studentSubmissions = submissionsByStudent.get(record.studentId);

          // If not found, try by name match
          if (!studentSubmissions) {
            for (const [sid, subs] of submissionsByStudent.entries()) {
              const submissionStudentName = (
                subs[0]?.studentName || ""
              ).toLowerCase();
              const recordName = record.studentName.toLowerCase();

              if (
                submissionStudentName === recordName ||
                submissionStudentName.includes(recordName) ||
                recordName.includes(submissionStudentName)
              ) {
                studentSubmissions = subs;
                console.log(`✅ Found by name match: ${record.studentName}`);
                break;
              }
            }
          }

          if (studentSubmissions && studentSubmissions.length > 0) {
            const totalPercentage = studentSubmissions.reduce(
              (sum: number, sub: any) => sum + sub.percentage,
              0
            );
            const averagePercentage =
              totalPercentage / studentSubmissions.length;
            const objScore = Math.round(
              (averagePercentage / 100) * gradeSystem.maxScores.obj
            );

            console.log(
              `📊 ${record.studentName}: ${
                studentSubmissions.length
              } quizzes, avg: ${averagePercentage.toFixed(
                1
              )}%, OBJ: ${objScore}`
            );

            return {
              ...record,
              objScore: Math.min(objScore, gradeSystem.maxScores.obj),
              quizInfo: {
                totalQuizzes: studentSubmissions.length,
                averagePercentage: Math.round(averagePercentage),
                lastQuiz: studentSubmissions[0]?.quizName,
                lastQuizDate:
                  studentSubmissions[0]?.submittedAt.toLocaleDateString(),
              },
            };
          }

          return record;
        });
      });
    } catch (error: any) {
      console.error("❌ Error loading quiz results:", error);
    }
  }, [selectedClass, selectedSubject, user, gradeSystem.maxScores.obj]);
  // Calculate grade based on percentage
  const calculateGrade = (percentage: number): string => {
    for (const [grade, range] of Object.entries(gradeSystem.grades)) {
      if (percentage >= range.min && percentage <= range.max) {
        return grade;
      }
    }
    return "F9";
  };

  // Calculate remark based on grade
  const calculateRemark = (grade: string): string => {
    const remarks: { [key: string]: string } = {
      A1: "Excellent",
      B2: "Very Good",
      B3: "Good",
      C4: "Credit",
      C5: "Credit",
      C6: "Credit",
      D7: "Pass",
      E8: "Pass",
      F9: "Fail",
    };
    return remarks[grade] || "Fail";
  };
  // Add event listener for manual reload
  // Add event listener for manual reload
  useEffect(() => {
    const handleReloadGrades = () => {
      if (selectedClass && selectedSubject) {
        console.log("🔄 Manual reload triggered");
        // Call the grade loading logic directly
        const event = new Event("force-reload-grades");
        window.dispatchEvent(event);
      }
    };

    window.addEventListener("reload-grades", handleReloadGrades);

    return () => {
      window.removeEventListener("reload-grades", handleReloadGrades);
    };
  }, [selectedClass, selectedSubject]);

  // ADD THIS useEffect near the top, after state declarations
  useEffect(() => {
    if (isOpen) {
      console.group("🔍 Grade Management Modal Opened");
      console.log("Teacher ID:", user?.uid);
      console.log("User object:", user);
      console.log("Selected Class:", selectedClass);
      console.log("Selected Subject:", selectedSubject);
      console.log("Grade Records:", gradeRecords.length);
      console.groupEnd();
    }
  }, [isOpen, user, selectedClass, selectedSubject]);

  // ADD THIS useEffect after the existing useEffects (around line 1250)
  useEffect(() => {
    if (!user?.uid || !isOpen) return;

    console.log("👂 Setting up real-time listener for 'scores' collection");

    const scoresRef = collection(db, "scores");
    const q = query(scoresRef, where("teacherId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("🎯 Real-time update for 'scores' collection:");
        console.log(`   Total documents: ${snapshot.docs.length}`);

        snapshot.docChanges().forEach((change) => {
          console.log(`   Change type: ${change.type}`);
          console.log(`   Document ID: ${change.doc.id}`);
          console.log(`   Data:`, change.doc.data());
        });
      },
      (error) => {
        console.error("❌ Real-time listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [user, isOpen]);

  // Then find this useEffect around line 1086 (the one that loads grades)
  // Add this event listener to it:
  useEffect(() => {
    // ... existing code ...

    // Add this inside the useEffect:
    const handleForceReload = () => {
      console.log("🔄 Force reload triggered via event");
      loadGrades(); // This will reference the loadGrades function inside this useEffect
    };

    window.addEventListener("force-reload-grades", handleForceReload);

    return () => {
      window.removeEventListener("force-reload-grades", handleForceReload);
    };
  }, [
    user,
    selectedClass,
    selectedSubject,
    activeTerm,
    activeSession,
    isOpen,
    filteredStudents,
  ]);

  // Initialize grade records from students
  useEffect(() => {
    if (
      isOpen &&
      selectedClass &&
      selectedSubject &&
      filteredStudents.length > 0
    ) {
      const initialRecords: GradeRecord[] = filteredStudents.map((student) => {
        // Get student ID from multiple possible fields
        const studentId =
          student.id ||
          student.uid ||
          student.userId ||
          `student-${student.email || student.fullName}`;

        return {
          id: `grade-${studentId}-${selectedSubject}-${selectedClass}-${activeTerm}`,
          studentId: studentId,
          studentName: student.fullName,
          className: selectedClass,
          subject: selectedSubject,
          term: activeTerm,
          session: activeSession,
          objScore: 0,
          caScore: 0,
          theoryScore: 0,
          totalScore: 0,
          percentage: 0,
          grade: "F9",
          remark: "Fail",
        };
      });
      setGradeRecords(initialRecords);
      loadQuizResults();
    }
  }, [
    isOpen,
    filteredStudents,
    selectedClass,
    selectedSubject,
    activeTerm,
    activeSession,
    loadQuizResults,
  ]);

  // Add this debug function
  const debugFirestoreQuery = async () => {
    if (!user?.uid || !selectedClass || !selectedSubject) {
      setDebugInfo("Missing user, class, or subject");
      return;
    }

    try {
      setDebugInfo("Running debug query...");

      // Test the query
      const gradesRef = collection(db, "grades");
      const q = query(
        gradesRef,
        where("teacherId", "==", user.uid),
        where("class", "==", selectedClass),
        where("subject", "==", selectedSubject)
      );

      const querySnapshot = await getDocs(q);

      const debugMessage = `Query results: ${querySnapshot.docs.length} documents found\n`;
      console.log("📊 Debug query results:", debugMessage);

      if (querySnapshot.docs.length > 0) {
        querySnapshot.docs.forEach((doc, index) => {
          console.log(`Document ${index + 1}:`, {
            id: doc.id,
            data: doc.data(),
          });
        });
      }

      setDebugInfo(`Found ${querySnapshot.docs.length} grade documents`);
    } catch (error: any) {
      console.error("🔍 Debug query error:", error);
      setDebugInfo(`Error: ${error.message || error.code || "Unknown error"}`);
    }
  };
  // Load grades from Firestore using query instead of direct document reference
  // Move loadGrades function outside useEffect
  const loadGrades = async () => {
    setLoadingGrades(true);
    if (!user?.uid || !selectedClass || !selectedSubject) {
      console.log("Missing required parameters for grade loading");
      setLoadingGrades(false);
      return;
    }

    try {
      console.log("📊 Loading grades for:", {
        teacherId: user.uid,
        class: selectedClass,
        subject: selectedSubject,
        term: activeTerm,
        session: activeSession,
      });

      // Query grades collection
      const gradesRef = collection(db, "grades");
      const q = query(
        gradesRef,
        where("teacherId", "==", user.uid),
        where("class", "==", selectedClass),
        where("subject", "==", selectedSubject),
        where("term", "==", activeTerm),
        where("session", "==", activeSession)
      );

      const querySnapshot = await getDocs(q);
      console.log(`📋 Found ${querySnapshot.docs.length} grade documents`);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        console.log("📄 Grade document data loaded");

        if (data.grades && Array.isArray(data.grades)) {
          setGradeRecords(data.grades);
          console.log("✅ Grades loaded from Firestore:", data.grades.length);

          // Load quiz results to update OBJ scores
          setTimeout(() => loadQuizResults(), 500);
        } else {
          console.log("⚠️ No grades array found in document");
          initializeGradeRecords();
          setTimeout(() => loadQuizResults(), 500);
        }
      } else {
        console.log("📭 No grade document found. Initializing new records.");
        initializeGradeRecords();
        setTimeout(() => loadQuizResults(), 500);
      }
    } catch (error: any) {
      console.error("❌ Error loading grades from Firestore:", error);
      initializeGradeRecords();
      setTimeout(() => loadQuizResults(), 500);
    } finally {
      setLoadingGrades(false);
    }
  };
  // Helper function to initialize grade records from students
  const initializeGradeRecords = () => {
    if (filteredStudents.length === 0) {
      setGradeRecords([]);
      return;
    }

    const initialRecords: GradeRecord[] = filteredStudents.map(
      (student, index) => {
        const studentId =
          student.id ||
          student.uid ||
          student.userId ||
          `student-${student.email || index}`;
        return {
          id: `grade-${studentId}-${selectedSubject}-${selectedClass}-${activeTerm}`,
          studentId: studentId,
          studentName: student.fullName || `${student.first} ${student.last}`,
          className: selectedClass,
          subject: selectedSubject,
          term: activeTerm,
          session: activeSession,
          objScore: 0,
          caScore: 0,
          theoryScore: 0,
          totalScore: 0,
          percentage: 0,
          grade: "F9",
          remark: "Fail",
          quizInfo: undefined,
        };
      }
    );

    setGradeRecords(initialRecords);
  };
  // Load grades when modal opens
  useEffect(() => {
    if (isOpen && selectedClass && selectedSubject) {
      console.log(
        "🔄 Loading grades using new single-document-per-student structure"
      );
      loadGradesFromStudentTerm(); // Changed from loadGrades()
    }
  }, [
    user,
    selectedClass,
    selectedSubject,
    activeTerm,
    activeSession,
    isOpen,
    filteredStudents,
  ]);

  // Auto-refresh quiz results - FIXED VERSION
  useEffect(() => {
    if (isOpen && selectedClass && selectedSubject && gradeRecords.length > 0) {
      console.log("🔄 Setting up auto-refresh for quiz results");

      // Initial load
      loadQuizResults();

      // Only set up interval if modal is open
      const interval = setInterval(() => {
        loadQuizResults();
      }, 30000); // Every 30 seconds

      return () => {
        console.log("🔄 Clearing auto-refresh interval");
        clearInterval(interval);
      };
    }
  }, [
    isOpen,
    selectedClass,
    selectedSubject,
    gradeRecords.length,
    loadQuizResults,
  ]);

  // Calculate totals when scores change
  useEffect(() => {
    if (gradeRecords.length === 0) return;

    const updatedRecords = gradeRecords.map((record) => {
      // Ensure no score exceeds its maximum
      const objScore = Math.min(record.objScore, gradeSystem.maxScores.obj);
      const caScore = Math.min(record.caScore, gradeSystem.maxScores.ca);
      const theoryScore = Math.min(
        record.theoryScore,
        gradeSystem.maxScores.theory
      );

      // Calculate total (max = 100)
      const totalScore = objScore + caScore + theoryScore;

      // Validate total doesn't exceed 100
      if (totalScore > 100) {
        console.warn(`Total score exceeds 100 for ${record.studentName}`);
      }

      const percentage = totalScore; // Since total is out of 100
      const grade = calculateGrade(percentage);
      const remark = calculateRemark(grade);

      return {
        ...record,
        objScore,
        caScore,
        theoryScore,
        totalScore: Math.min(100, totalScore), // Cap at 100
        percentage: Math.min(100, percentage),
        grade,
        remark,
      };
    });

    // Calculate positions
    const sortedRecords = [...updatedRecords].sort(
      (a, b) => b.totalScore - a.totalScore
    );
    const recordsWithPositions = sortedRecords.map((record, index) => ({
      ...record,
      positionInClass: index + 1,
    }));

    // Only update if there's actually a change
    setGradeRecords((prev) => {
      const hasChanged =
        JSON.stringify(prev) !== JSON.stringify(recordsWithPositions);
      return hasChanged ? recordsWithPositions : prev;
    });
  }, [gradeRecords]);

  // Already correct:
  const handleScoreChange = (
    studentId: string,
    field: "caScore" | "theoryScore",
    value: number
  ) => {
    setGradeRecords((prev) =>
      prev.map((record) => {
        if (record.studentId === studentId) {
          const maxScore =
            gradeSystem.maxScores[field === "caScore" ? "ca" : "theory"];
          const newValue = Math.min(Math.max(0, value), maxScore);

          if (value > maxScore) {
            alert(
              `Maximum allowed score for ${field.toUpperCase()} is ${maxScore}`
            );
            return record;
          }

          return {
            ...record,
            [field]: newValue,
          };
        }
        return record;
      })
    );
  };

  // SINGLE SAVE FUNCTION - One document per student per term per session
  const saveStudentTermGrades = async () => {
    if (!user?.uid || !selectedClass || !selectedSubject) {
      throw new Error("Missing required data");
    }

    console.log("📁 Saving ALL grades to student term documents...");

    const batch = writeBatch(db);
    const timestamp = new Date();
    let savedCount = 0;

    // Group grades by student ID
    const gradesByStudent: Record<string, GradeRecord[]> = {};

    gradeRecords.forEach((record) => {
      if (!gradesByStudent[record.studentId]) {
        gradesByStudent[record.studentId] = [];
      }
      gradesByStudent[record.studentId].push(record);
    });

    // For each student, create/update their term document
    for (const [studentId, studentGrades] of Object.entries(gradesByStudent)) {
      // Generate document ID: studentId_term_session
      const studentTermDocId = `${studentId}_${activeTerm}_${activeSession}`
        .replace(/\s+/g, "_")
        .replace(/\//g, "_");

      const studentTermRef = doc(db, "studentTermGrades", studentTermDocId);

      // Get student info from first grade record
      const studentInfo = studentGrades[0];

      // Check if document already exists
      let existingDoc;
      try {
        existingDoc = await getDoc(studentTermRef);
      } catch (error) {
        console.log("Creating new student term document");
      }

      let existingData = existingDoc?.exists() ? existingDoc.data() : {};
      let existingSubjects = existingData.subjects || {};

      // Create subjects object with ALL subjects
      const updatedSubjects = { ...existingSubjects };

      // Add/update the current subject grade
      studentGrades.forEach((grade) => {
        updatedSubjects[grade.subject] = {
          objScore: grade.objScore,
          caScore: grade.caScore,
          theoryScore: grade.theoryScore,
          totalScore: grade.totalScore,
          percentage: grade.percentage,
          grade: grade.grade,
          positionInClass: grade.positionInClass,
          remark: grade.remark,
          savedAt: timestamp,
          teacherId: user.uid,
          teacherName: user.displayName || "Teacher",
          className: grade.className,
        };
      });

      // Create ONE document per student per term per session
      const studentTermData = {
        id: studentTermDocId,
        studentId,
        studentName: studentInfo.studentName,
        className: selectedClass,
        term: activeTerm,
        session: activeSession,
        subjects: updatedSubjects, // ALL subjects stored here
        updatedAt: timestamp,
        createdAt: existingData.createdAt || timestamp,
        teacherId: user.uid,
        teacherName: user.displayName || "Teacher",
      };

      batch.set(studentTermRef, studentTermData, { merge: true });
      savedCount++;

      console.log(
        `✅ Prepared document for ${studentInfo.studentName} (ID: ${studentTermDocId})`
      );
    }

    await batch.commit();
    console.log(`✅ Saved ${savedCount} student term documents to Firestore`);
    return savedCount;
  };
  const validateScores = () => {
    let isValid = true;
    let errorMessage = "";

    gradeRecords.forEach((record) => {
      if (record.objScore > gradeSystem.maxScores.obj) {
        isValid = false;
        errorMessage = `OBJ score for ${record.studentName} exceeds maximum of ${gradeSystem.maxScores.obj}`;
      }
      if (record.caScore > gradeSystem.maxScores.ca) {
        isValid = false;
        errorMessage = `CA score for ${record.studentName} exceeds maximum of ${gradeSystem.maxScores.ca}`;
      }
      if (record.theoryScore > gradeSystem.maxScores.theory) {
        isValid = false;
        errorMessage = `Theory score for ${record.studentName} exceeds maximum of ${gradeSystem.maxScores.theory}`;
      }
      if (record.totalScore > 100) {
        isValid = false;
        errorMessage = `Total score for ${record.studentName} exceeds 100`;
      }
    });

    return { isValid, errorMessage };
  };
  // In your existing handleSaveGrades function, add this line:

  const handleSaveGrades = async () => {
    const validation = validateScores();
    if (!validation.isValid) {
      alert(`Validation Error: ${validation.errorMessage}`);
      return;
    }

    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject");
      return;
    }

    if (!user?.uid) {
      console.error("❌ User not authenticated in handleSaveGrades!");
      console.error("User object:", user);
      alert("Please log in again.");
      return;
    }

    console.log("✅ User authenticated for save:");
    console.log("   User ID:", user.uid);
    console.log("   User Email:", user.email);
    console.log("   User Display Name:", user.displayName);

    setSavingGrades(true);
    try {
      console.log("💾 Saving ALL grades to ONE document per student...");

      // JUST THIS ONE FUNCTION CALL
      const savedCount = await saveStudentTermGrades();

      setIsEditing(false);

      alert(
        `✅ Grades saved successfully!\n\n` +
          `• Class: ${selectedClass}\n` +
          `• Subject: ${selectedSubject}\n` +
          `• Term: ${activeTerm}\n` +
          `• Session: ${activeSession}\n` +
          `• Students: ${savedCount} documents saved\n\n` +
          `📄 Document format: studentId_term_session\n` +
          `📁 Collection: studentTermGrades\n\n` +
          `✅ Each student now has ONE document containing ALL their subjects!`
      );
    } catch (error: any) {
      console.error("❌ Error saving grades to Firestore:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack,
      });

      let errorMessage = "Failed to save grades. ";

      if (error.code === "permission-denied") {
        errorMessage += "Permission denied. Please check your Firebase rules.";
        console.error(
          "⚠️ FIREBASE RULES ISSUE: Check if scores collection is writable"
        );
      } else if (error.code === "unavailable") {
        errorMessage += "Network error. Please check your internet connection.";
      } else if (error.message.includes("quota")) {
        errorMessage += "Firebase quota exceeded. Please try again later.";
      } else {
        errorMessage += "Please try again.";
      }

      alert(errorMessage);

      // Try one more time with single saves
      try {
        console.log("🔄 Attempting fallback save...");
        await saveScoresOneByOne();
        alert("✅ Scores saved using fallback method!");
        setIsEditing(false);
      } catch (fallbackError) {
        console.error("❌ Fallback save also failed:", fallbackError);
      }
    } finally {
      setSavingGrades(false);
    }
  };
  // Function to save grades to student term documents (ONE DOCUMENT PER STUDENT)

  // Function to save to scores collection (for backward compatibility)

  // Function to load grades from student term documents
  const loadGradesFromStudentTerm = async () => {
    if (!user?.uid || !selectedClass || !selectedSubject) return;

    setLoadingGrades(true);

    try {
      console.log("📖 Loading grades from student term documents...");

      // Get all student IDs
      const studentIds = filteredStudents
        .map((s) => s.id || s.studentId || s.userId)
        .filter((id) => id);

      let loadedGrades: GradeRecord[] = [];

      if (studentIds.length > 0) {
        // Load each student's term document
        const promises = studentIds.map(async (studentId) => {
          const studentTermDocId = `${studentId}_${activeTerm}_${activeSession}`
            .replace(/\s+/g, "_")
            .replace(/\//g, "_");

          const studentTermRef = doc(db, "studentTermGrades", studentTermDocId);
          const docSnap = await getDoc(studentTermRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const studentGrades = data.grades || [];

            // Find grade for current subject and class
            const subjectGrade = studentGrades.find(
              (g: any) =>
                g.subject === selectedSubject && g.className === selectedClass
            );

            if (subjectGrade) {
              const student = filteredStudents.find(
                (s) => (s.id || s.studentId || s.userId) === studentId
              );

              if (student) {
                return {
                  id: `grade-${studentId}-${selectedSubject}-${selectedClass}-${activeTerm}`,
                  studentId,
                  studentName:
                    student.fullName || `${student.first} ${student.last}`,
                  className: selectedClass,
                  subject: selectedSubject,
                  term: activeTerm,
                  session: activeSession,
                  objScore: subjectGrade.objScore || 0,
                  caScore: subjectGrade.caScore || 0,
                  theoryScore: subjectGrade.theoryScore || 0,
                  totalScore: subjectGrade.totalScore || 0,
                  percentage: subjectGrade.percentage || 0,
                  grade: subjectGrade.grade || "F9",
                  positionInClass: subjectGrade.positionInClass,
                  remark: subjectGrade.remark || "Fail",
                } as GradeRecord;
              }
            }
          }
          return null;
        });

        const results = await Promise.all(promises);
        loadedGrades = results.filter((g): g is GradeRecord => g !== null);
      }

      // If we found grades, use them
      if (loadedGrades.length > 0) {
        console.log(
          `✅ Loaded ${loadedGrades.length} grades from student term documents`
        );

        // Sort by position or total score
        const sortedGrades = loadedGrades.sort(
          (a, b) => b.totalScore - a.totalScore
        );

        // Update positions
        const gradesWithPositions = sortedGrades.map((grade, index) => ({
          ...grade,
          positionInClass: index + 1,
        }));

        setGradeRecords(gradesWithPositions);
      } else {
        // Fallback to old method (scores collection)
        console.log(
          "📭 No student term documents found, falling back to scores collection"
        );
        await loadGradesFromScoresCollection();
      }

      // Load quiz results for OBJ scores
      await loadQuizResults();
    } catch (error) {
      console.error("❌ Error loading from student term documents:", error);
      // Fallback to old method
      await loadGradesFromScoresCollection();
    } finally {
      setLoadingGrades(false);
    }
  };

  // Fallback function to load from scores collection
  const loadGradesFromScoresCollection = async () => {
    if (!user?.uid || !selectedClass || !selectedSubject) return;

    try {
      const scoresRef = collection(db, "scores");
      const q = query(
        scoresRef,
        where("teacherId", "==", user.uid),
        where("classId", "==", selectedClass),
        where("subjectId", "==", selectedSubject),
        where("term", "==", activeTerm),
        where("session", "==", activeSession)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const loadedGrades: GradeRecord[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const student = filteredStudents.find(
            (s) => (s.id || s.studentId || s.userId) === data.studentId
          );

          if (student) {
            loadedGrades.push({
              id: doc.id,
              studentId: data.studentId,
              studentName: data.studentName || student.fullName,
              className: selectedClass,
              subject: selectedSubject,
              term: activeTerm,
              session: activeSession,
              objScore: data.obj || 0,
              caScore: data.ca || 0,
              theoryScore: data.theory || 0,
              totalScore: data.total || 0,
              percentage: data.percentage || 0,
              grade: data.grade || "F9",
              positionInClass: data.position,
              remark: data.remark || "Fail",
            });
          }
        });

        // Sort by total score
        const sortedGrades = loadedGrades.sort(
          (a, b) => b.totalScore - a.totalScore
        );

        // Update positions
        const gradesWithPositions = sortedGrades.map((grade, index) => ({
          ...grade,
          positionInClass: index + 1,
        }));

        setGradeRecords(gradesWithPositions);
        console.log(
          `✅ Loaded ${loadedGrades.length} grades from scores collection`
        );
      } else {
        // Initialize new records
        initializeGradeRecords();
      }
    } catch (error) {
      console.error("❌ Error loading from scores collection:", error);
      initializeGradeRecords();
    }
  };

  // Backup function to save grades collection

  // Fallback function to save scores one by one

  // ADD THIS FUNCTION right after saveScoresOneByOne function (around line 1090)
  const verifySavedScores = async () => {
    if (!user?.uid || !selectedClass || !selectedSubject) return;

    try {
      console.log("🔍 Verifying saved scores...");

      const scoresRef = collection(db, "scores");
      const q = query(
        scoresRef,
        where("teacherId", "==", user.uid),
        where("classId", "==", selectedClass),
        where("subjectId", "==", selectedSubject),
        where("term", "==", activeTerm),
        where("session", "==", activeSession)
      );

      const querySnapshot = await getDocs(q);
      console.log(
        `📊 Found ${querySnapshot.docs.length} documents in 'scores' collection`
      );

      if (querySnapshot.docs.length > 0) {
        console.log("📄 Document details:");
        querySnapshot.docs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.id}:`, {
            studentName: doc.data().studentName,
            ca: doc.data().ca,
            theory: doc.data().theory,
            total: doc.data().total,
            grade: doc.data().grade,
          });
        });
      } else {
        console.log("⚠️ No documents found in 'scores' collection!");
      }
    } catch (error) {
      console.error("❌ Verification failed:", error);
    }
  };
  // ADD THIS FUNCTION right after verifySavedScores
  const testDatabaseConnection = async () => {
    console.log("🔧 Testing database connection...");

    try {
      // Test 1: Try to create a test document
      const testRef = doc(db, "testCollection", "testDocument");
      await setDoc(testRef, {
        test: "Test document",
        timestamp: new Date(),
        teacherId: user?.uid,
      });
      console.log("✅ Test document created in 'testCollection'");

      // Test 2: Check if we can read it back
      const testSnap = await getDoc(testRef);
      console.log("✅ Test document read back:", testSnap.exists());

      // Test 3: Delete test document
      await deleteDoc(testRef);
      console.log("✅ Test document deleted");

      alert("✅ Database connection test successful!");
    } catch (error: any) {
      console.error("❌ Database test failed:", error);
      alert(
        `❌ Database error: ${error.message || error.code || "Unknown error"}`
      );
    }
  };

  const checkForDuplicateScores = async () => {
    if (!selectedClass || !selectedSubject || !activeTerm || !activeSession) {
      return { hasDuplicates: false, count: 0 };
    }

    try {
      console.log("🔍 Checking for duplicate scores...");

      const scoresRef = collection(db, "scores");
      const q = query(
        scoresRef,
        where("classId", "==", selectedClass),
        where("subjectId", "==", selectedSubject),
        where("term", "==", activeTerm),
        where("session", "==", activeSession)
      );

      const querySnapshot = await getDocs(q);
      const count = querySnapshot.docs.length;

      console.log(`📊 Found ${count} existing score documents`);

      if (count > 0) {
        console.log(
          "📄 Existing documents:",
          querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      }

      return {
        hasDuplicates: count > 0,
        count,
        documents: querySnapshot.docs,
      };
    } catch (error) {
      console.error("❌ Error checking for duplicates:", error);
      return { hasDuplicates: false, count: 0 };
    }
  };
  // ADD THIS RIGHT AFTER saveFinalGradesReport function
  const debugQuizSubmissionStructure = async () => {
    if (!user?.uid) return;

    try {
      console.log("🔍 Debugging quizSubmission collection structure...");

      const submissionsRef = collection(db, "quizSubmissions");
      const q = query(submissionsRef, where("teacherId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      console.log(
        `Total submissions for teacher: ${querySnapshot.docs.length}`
      );

      if (querySnapshot.docs.length > 0) {
        const sampleDoc = querySnapshot.docs[0];
        console.log("📄 Sample submission document structure:");
        console.log("Document ID:", sampleDoc.id);
        console.log("Full data:", sampleDoc.data());

        // Show all unique fields
        const allFields = new Set<string>();
        querySnapshot.docs.forEach((doc) => {
          Object.keys(doc.data()).forEach((key) => allFields.add(key));
        });
        console.log("📋 All field names in collection:", Array.from(allFields));

        // Show first 3 documents
        querySnapshot.docs.slice(0, 3).forEach((doc, i) => {
          console.log(`\n📄 Document ${i + 1}:`);
          const data = doc.data();
          console.log("- Student ID field:", data.studentId || "Not found");
          console.log("- Student name field:", data.studentName || "Not found");
          console.log("- Class field:", data.className || "Not found");
          console.log("- Subject field:", data.subject || "Not found");
          console.log("- Score field:", data.score || "Not found");
          console.log("- Max score field:", data.maxScore || "Not found");
        });
      } else {
        console.log("📭 No submissions found in quizSubmissions collection");
      }
    } catch (error) {
      console.error("❌ Debug error:", error);
    }
  };

  const handleExportCSV = () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select a class and subject");
      return;
    }

    const headers = [
      "S/N",
      "Student Name",
      "Class",
      "OBJ Score (30)",
      "CA Score (40)",
      "Theory Score (30)",
      "Total Score (100)",
      "Percentage",
      "Grade",
      "Position",
      "Remark",
    ];

    const csvData = gradeRecords.map((record, index) => [
      index + 1,
      record.studentName,
      record.className,
      record.objScore,
      record.caScore,
      record.theoryScore,
      record.totalScore,
      `${record.percentage}%`,
      record.grade,
      record.positionInClass,
      record.remark,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grades-${selectedClass}-${selectedSubject}-${activeTerm}-${activeSession}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content xl-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Grade Management System</h2>
            <p>Manage student grades - Auto-sync with quiz results</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Controls */}
          <div className="grade-controls">
            <div className="control-group">
              <label>Class *</label>
              <select
                className="text-input"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Select Class</option>
                {teacherClasses.map((cls) => (
                  <option key={cls.className} value={cls.className}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Subject *</label>
              <select
                className="text-input"
                value={selectedSubject || ""}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedClass}
              >
                <option value="">Select Subject</option>
                {availableSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Term</label>
              <select
                className="text-input"
                value={activeTerm}
                onChange={(e) => setActiveTerm(e.target.value)}
              >
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            <div className="control-group">
              <label>Session</label>
              <select
                className="text-input"
                value={activeSession}
                onChange={(e) => setActiveSession(e.target.value)}
              >
                <option value="2023/2024">2023/2024</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
              </select>
            </div>

            <div className="control-group">
              <label>Actions</label>
              <div className="action-buttons">
                <button
                  className={`action-btn ${isEditing ? "cancel" : "edit"}`}
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={!selectedClass || !selectedSubject || savingGrades}
                >
                  {isEditing ? "Cancel Editing" : "Edit Grades"}
                </button>
                <button
                  className="action-btn primary"
                  onClick={handleSaveGrades}
                  disabled={
                    savingGrades ||
                    !isEditing ||
                    !selectedClass ||
                    !selectedSubject
                  }
                >
                  {savingGrades ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Saving to Student Docs...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save All Grades
                    </>
                  )}
                </button>
              </div>

              {/* Add sync indicator */}
              <div className="sync-indicator">
                {savingGrades ? (
                  <div className="syncing">
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Saving to database...</span>
                  </div>
                ) : loadingGrades ? (
                  <div className="loading-grades">
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Loading grades...</span>
                  </div>
                ) : (
                  <div
                    className="online-status"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <div className="online-dot"></div>
                      <span>Connected to cloud database</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quiz Results Notice */}
          <div className="quiz-results-notice">
            <Info size={16} />
            <span>
              OBJ scores are automatically synced from student quiz submissions
              for {selectedSubject} in {selectedClass}. Manual edits are
              disabled for OBJ scores.
            </span>
          </div>

          {/* Grades Table */}
          {selectedClass && selectedSubject && gradeRecords.length > 0 ? (
            <div className="grades-table-container">
              {/* Grades Table Headers - UPDATED */}
              <table className="grades-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>S/N</th>
                    <th rowSpan={2}>Student Name</th>
                    <th rowSpan={2}>Class</th>
                    <th colSpan={3}>Components</th>
                    <th colSpan={4}>Results</th>
                  </tr>
                  <tr>
                    {/* Component Headers */}
                    <th>OBJ (Auto)</th>
                    <th>CA Score</th>
                    <th>Theory</th>

                    {/* Result Headers */}
                    <th>Total (100)</th>
                    <th>%</th>
                    <th>Grade</th>
                    <th>Position</th>
                    <th>Remark</th>
                  </tr>
                  <tr className="max-scores-row">
                    <th colSpan={3}>Max Scores</th>
                    <th>{gradeSystem.maxScores.obj}</th>
                    <th>{gradeSystem.maxScores.ca}</th>
                    <th>{gradeSystem.maxScores.theory}</th>
                    <th>100</th>
                    <th>100%</th>
                    <th>-</th>
                    <th>-</th>
                    <th>-</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeRecords.map((record, index) => (
                    <tr key={record.id} className="grade-row">
                      <td className="serial-number">{index + 1}</td>
                      <td className="student-name">{record.studentName}</td>
                      <td className="class-name">{record.className}</td>

                      {/* Component Scores */}
                      <td className="obj-score-cell">
                        <div className="auto-score-display">
                          <span className="score-value">{record.objScore}</span>
                          <span className="auto-badge">Auto</span>
                          {record.quizInfo && (
                            <div className="quiz-info-tooltip">
                              <span className="quiz-count">
                                {record.quizInfo.totalQuizzes} quiz
                                {record.quizInfo.totalQuizzes !== 1
                                  ? "zes"
                                  : ""}
                              </span>
                              <span className="quiz-avg">
                                {record.quizInfo.averagePercentage}% avg
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* CA Score Input */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={gradeSystem.maxScores.ca}
                          value={record.caScore}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value > gradeSystem.maxScores.ca) {
                              alert(
                                `Maximum CA score is ${gradeSystem.maxScores.ca}`
                              );
                              return;
                            }
                            handleScoreChange(
                              record.studentId,
                              "caScore",
                              value
                            );
                          }}
                          disabled={!isEditing}
                          className="score-input"
                        />
                      </td>

                      {/* Theory Score Input */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          max={gradeSystem.maxScores.theory}
                          value={record.theoryScore}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value > gradeSystem.maxScores.theory) {
                              alert(
                                `Maximum Theory score is ${gradeSystem.maxScores.theory}`
                              );
                              return;
                            }
                            handleScoreChange(
                              record.studentId,
                              "theoryScore",
                              value
                            );
                          }}
                          disabled={!isEditing}
                          className="score-input"
                        />
                      </td>

                      {/* Results - Auto-calculated */}
                      <td className="total-score">{record.totalScore}/100</td>
                      <td className="percentage">{record.percentage}%</td>
                      <td
                        className={`grade grade-${record.grade.toLowerCase()}`}
                      >
                        {record.grade}
                      </td>
                      <td className="position">{record.positionInClass}</td>
                      <td
                        className={`remark ${record.remark
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {record.remark}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              {!selectedClass ? (
                <>
                  <Book size={48} color="#9ca3af" />
                  <p>Select a class to view grades</p>
                </>
              ) : !selectedSubject ? (
                <>
                  <BookOpen size={48} color="#9ca3af" />
                  <p>Select a subject to view grades</p>
                </>
              ) : (
                <>
                  <Users size={48} color="#9ca3af" />
                  <p>
                    No students found for {selectedClass} - {selectedSubject}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Grade Legend */}
          <div className="grade-legend">
            <h4>Grading System</h4>
            <div className="legend-grid">
              {Object.entries(gradeSystem.grades).map(([grade, range]) => (
                <div key={grade} className="legend-item">
                  <span className={`grade-badge grade-${grade.toLowerCase()}`}>
                    {grade}
                  </span>
                  <span className="grade-range">
                    {range.min}% - {range.max}%
                  </span>
                  <span className="grade-remark">{calculateRemark(grade)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div
            className="debug-section"
            style={{
              position: "absolute",
              left: "20px",
              bottom: "20px",
            }}
          >
            <button
              onClick={testDatabaseConnection}
              style={{
                background: "#f59e0b",
                color: "white",
                padding: "6px 10px",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                cursor: "pointer",
                marginRight: "8px",
              }}
            >
              🐛 Test DB
            </button>
          </div>
          <div className="footer-stats">
            <div className="stat">
              <span className="stat-label">Total Students:</span>
              <span className="stat-value">{gradeRecords.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Class Average:</span>
              <span className="stat-value">
                {gradeRecords.length > 0
                  ? Math.round(
                      gradeRecords.reduce((sum, r) => sum + r.percentage, 0) /
                        gradeRecords.length
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Save Format:</span>
              <span
                className="stat-value"
                style={{ fontSize: "12px", color: "#10b981" }}
              >
                {gradeRecords.length} docs in "scores"
              </span>
            </div>
          </div>

          <div className="save-actions">
            <button
              className="action-btn cancel"
              onClick={onClose}
              disabled={savingGrades}
            >
              Cancel
            </button>
            <button
              className="action-btn primary"
              onClick={handleSaveGrades}
              disabled={
                savingGrades || !isEditing || !selectedClass || !selectedSubject
              }
            >
              {savingGrades ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Saving to Scores...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save All Scores
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Upload CA Modal Component
interface UploadCAModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teacherClasses: TeacherClassInfo[];
  user?: any;
}

const UploadCAModal: React.FC<UploadCAModalProps> = ({
  isOpen,
  onClose,
  students,
  teacherClasses,
  user,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [uploadMethod, setUploadMethod] = useState<"manual" | "csv">("manual");

  const caCategories = [
    { id: "ca1", name: "1st CA Test", maxScore: 10 },
    { id: "ca2", name: "2nd CA Test", maxScore: 10 },
    { id: "ca3", name: "3rd CA Test", maxScore: 10 },
    { id: "assignment", name: "Assignment", maxScore: 10 },
    { id: "project", name: "Project", maxScore: 10 },
    { id: "practical", name: "Practical", maxScore: 10 },
  ];

  const availableSubjects = useMemo(() => {
    if (!selectedClass) return [];
    const classInfo = teacherClasses.find((c) => c.className === selectedClass);
    return classInfo?.subjects || [];
  }, [selectedClass, teacherClasses]);

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter((s) => s.className === selectedClass);
  }, [students, selectedClass]);

  const handleScoreChange = (studentId: string, score: number) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: Math.min(
        score,
        caCategories.find((cat) => cat.id === selectedCategory)?.maxScore || 0
      ),
    }));
  };

  const handleBulkUpload = () => {
    // Implement CSV upload logic
    console.log("Bulk upload scores");
  };

  const handleSaveScores = async () => {
    if (!selectedClass || !selectedSubject || !selectedCategory) {
      alert("Please select class, subject, and CA category");
      return;
    }

    try {
      const caData = {
        class: selectedClass,
        subject: selectedSubject,
        category: selectedCategory,
        scores: scores,
        date: new Date().toISOString(),
      };

      // Save to Firestore
      try {
        const caId = `${caData.class}_${caData.subject}_${
          caData.category
        }_${Date.now()}`;
        const caRef = doc(db, "continuousAssessment", caId);

        await setDoc(caRef, {
          ...caData,
          id: caId,
          teacherId: user?.uid,
          teacherName: user?.displayName || "Teacher",
          createdAt: new Date(),
        });

        console.log("✅ CA scores saved to Firestore");
        alert("CA scores saved successfully!");
        onClose();
      } catch (error) {
        console.error("❌ Error saving CA scores:", error);
        alert("Failed to save CA scores");
      }
    } catch (error) {
      console.error("Error saving CA scores:", error);
      alert("Failed to save CA scores");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content medium-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Upload CA Scores</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Select Class *</label>
            <select
              className="text-input"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Choose class...</option>
              {teacherClasses.map((cls) => (
                <option key={cls.className} value={cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <div className="form-group">
              <label>Select Subject *</label>
              <select
                className="text-input"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">Choose subject...</option>
                {availableSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="upload-method-selector">
            <button
              className={`method-btn ${
                uploadMethod === "manual" ? "active" : ""
              }`}
              onClick={() => setUploadMethod("manual")}
            >
              <Edit3 size={16} />
              Manual Entry
            </button>
            <button
              className={`method-btn ${uploadMethod === "csv" ? "active" : ""}`}
              onClick={() => setUploadMethod("csv")}
            >
              <FileSpreadsheet size={16} />
              CSV Upload
            </button>
          </div>

          {uploadMethod === "manual" ? (
            <>
              <div className="form-group">
                <label>Select CA Category *</label>
                <select
                  className="text-input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={!selectedClass || !selectedSubject}
                >
                  <option value="">Choose category...</option>
                  {caCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (Max: {cat.maxScore})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClass && selectedSubject && selectedCategory && (
                <div className="scores-table">
                  <div className="table-header">
                    <span>Student</span>
                    <span>
                      Score (Max:{" "}
                      {
                        caCategories.find((cat) => cat.id === selectedCategory)
                          ?.maxScore
                      }
                      )
                    </span>
                  </div>
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="score-row">
                      <span>{student.fullName}</span>
                      <input
                        type="number"
                        min="0"
                        max={
                          caCategories.find(
                            (cat) => cat.id === selectedCategory
                          )?.maxScore
                        }
                        value={scores[student.id] || ""}
                        onChange={(e) =>
                          handleScoreChange(
                            student.id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="score-input"
                        placeholder="Enter score"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="csv-upload-section">
              <div className="upload-area">
                <FileSpreadsheet size={48} color="#6b7280" />
                <p>Upload CSV file with student scores</p>
                <button className="upload-csv-btn" onClick={handleBulkUpload}>
                  <Upload size={16} />
                  Choose CSV File
                </button>
                <small>Download template for correct format</small>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="action-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="action-btn save"
            onClick={handleSaveScores}
            disabled={!selectedClass || !selectedSubject || !selectedCategory}
          >
            Save Scores
          </button>
        </div>
      </div>
    </div>
  );
};

// Class Selection Modal Component
interface ClassSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherClasses: TeacherClassInfo[];
  selectedSubject: string;
  onSelectClass: (className: string) => void;
}

const ClassSelectionModal: React.FC<ClassSelectionModalProps> = ({
  isOpen,
  onClose,
  teacherClasses,
  selectedSubject,
  onSelectClass,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>("");

  const classesWithSubject = useMemo(() => {
    return teacherClasses.filter((cls) =>
      cls.subjects.includes(selectedSubject)
    );
  }, [teacherClasses, selectedSubject]);

  const handleSubmit = () => {
    if (selectedClass) {
      onSelectClass(selectedClass);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content small-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Select Class</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <p>
              You teach <strong>{selectedSubject}</strong> in multiple classes.
            </p>
            <p>Please select which class this quiz is for:</p>
            <div className="class-options">
              {classesWithSubject.map((cls) => (
                <button
                  key={cls.className}
                  className={`class-option-btn ${
                    selectedClass === cls.className ? "selected" : ""
                  }`}
                  onClick={() => setSelectedClass(cls.className)}
                >
                  <Building size={20} />
                  <span>{cls.className}</span>
                  <span className="student-count">
                    {cls.className} Students
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="action-btn save"
            onClick={handleSubmit}
            disabled={!selectedClass}
          >
            Select Class
          </button>
        </div>
      </div>
    </div>
  );
};

// Quiz Name Modal Component
interface QuizNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    duration: number,
    scheduledDate: string,
    scheduledTime: string,
    subject: string,
    maxScore: number,
    targetClass: string
  ) => void;
  questions: Question[];
  teacherClasses: TeacherClassInfo[];
}

const QuizNameModal: React.FC<QuizNameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  questions,
  teacherClasses,
}) => {
  const [quizName, setQuizName] = useState("");
  const [duration, setDuration] = useState(30);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [subject, setSubject] = useState("");
  const [maxScore, setMaxScore] = useState(30);
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");

  // Add this useEffect after the state declarations
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setQuizName("");
      setDuration(30);
      setMaxScore(30);
      setSelectedClass("");
      setShowClassModal(false);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split("T")[0]);
      setScheduledTime("09:00");
    }
  }, [isOpen]);

  const allSubjects = useMemo(() => {
    const subjects = new Set<string>();
    teacherClasses.forEach((cls) => {
      cls.subjects.forEach((sub) => subjects.add(sub));
    });
    return Array.from(subjects).sort();
  }, [teacherClasses]);

  const classesForSubject = useMemo(() => {
    if (!subject) return [];
    return teacherClasses.filter((cls) => cls.subjects.includes(subject));
  }, [subject, teacherClasses]);

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split("T")[0]);
      setScheduledTime("09:00");

      if (allSubjects.length > 0 && !subject) {
        setSubject(allSubjects[0]);
      }
    }
  }, [isOpen, allSubjects, subject]);

  const handleSave = () => {
    if (!quizName.trim()) {
      alert("Please enter quiz name");
      return;
    }

    if (!subject) {
      alert("Please select a subject");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      alert("Please select date and time");
      return;
    }

    if (classesForSubject.length === 1) {
      // Only one class, auto-select
      onSave(
        quizName.trim(),
        duration,
        scheduledDate,
        scheduledTime,
        subject,
        maxScore,
        classesForSubject[0].className
      );
    } else if (classesForSubject.length > 1) {
      // Multiple classes, show selection modal
      setShowClassModal(true);
    } else {
      alert("No classes found for selected subject");
    }
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    onSave(
      quizName.trim(),
      duration,
      scheduledDate,
      scheduledTime,
      subject,
      maxScore,
      className
    );
  };

  const handleTimeAdjustment = (minutes: number) => {
    if (scheduledTime) {
      const [hours, mins] = scheduledTime.split(":").map(Number);
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(mins + minutes);
      setScheduledTime(
        `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay">
        <div
          className="modal-content small-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>Save Quiz</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <label>Quiz Name *</label>
              <input
                type="text"
                placeholder="Enter quiz name..."
                className="text-input"
                value={quizName}
                onChange={(e) => setQuizName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Subject *</label>
              <select
                className="text-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                {allSubjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Maximum Score *</label>
              <input
                type="number"
                min="10"
                max="100"
                className="text-input"
                value={maxScore}
                onChange={(e) => setMaxScore(parseInt(e.target.value) || 30)}
              />
              <small>Total points for this quiz</small>
            </div>

            <div className="form-group">
              <label>Test Duration (minutes) *</label>
              <input
                type="number"
                min="5"
                max="180"
                className="text-input"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              />
              <small>Time students have to complete the test</small>
            </div>

            <div className="form-group">
              <label>Scheduled Date *</label>
              <input
                type="date"
                className="text-input"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="form-group">
              <label>Scheduled Time *</label>
              <div className="time-control">
                <input
                  type="time"
                  className="text-input"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
                <div className="time-adjustments">
                  <button
                    type="button"
                    className="time-adjust-btn"
                    onClick={() => handleTimeAdjustment(5)}
                  >
                    +5 min
                  </button>
                  <button
                    type="button"
                    className="time-adjust-btn"
                    onClick={() => handleTimeAdjustment(-5)}
                  >
                    -5 min
                  </button>
                  <button
                    type="button"
                    className="time-adjust-btn"
                    onClick={() => handleTimeAdjustment(15)}
                  >
                    +15 min
                  </button>
                  <button
                    type="button"
                    className="time-adjust-btn"
                    onClick={() => handleTimeAdjustment(-15)}
                  >
                    -15 min
                  </button>
                </div>
              </div>
              <small>Click buttons to adjust time quickly</small>
            </div>

            {subject && (
              <div className="form-group">
                <label>Available Classes for {subject}</label>
                <div className="class-tags">
                  {classesForSubject.map((cls) => (
                    <span key={cls.className} className="class-tag">
                      {cls.className}
                    </span>
                  ))}
                  {classesForSubject.length === 0 && (
                    <span className="class-tag warning">No classes</span>
                  )}
                </div>
              </div>
            )}

            <div className="quiz-summary">
              <h4>Quiz Summary</h4>
              <p>
                <strong>Questions:</strong> {questions.length}
              </p>
              <p>
                <strong>Subject:</strong> {subject || "Not selected"}
              </p>
              <p>
                <strong>Max Score:</strong> {maxScore}
              </p>
              <p>
                <strong>Total Duration:</strong> {duration + 10} minutes
                (including 10min buffer)
              </p>
              {scheduledDate && (
                <p>
                  <strong>Scheduled:</strong>{" "}
                  {new Date(scheduledDate).toLocaleDateString()} at{" "}
                  {scheduledTime}
                </p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="action-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="action-btn save"
              onClick={handleSave}
              disabled={
                !quizName.trim() || !subject || !scheduledDate || !scheduledTime
              }
            >
              Save Quiz
            </button>
          </div>
        </div>
      </div>

      <ClassSelectionModal
        isOpen={showClassModal}
        onClose={() => setShowClassModal(false)}
        teacherClasses={teacherClasses}
        selectedSubject={subject}
        onSelectClass={handleClassSelect}
      />
    </>
  );
};

// Create Quiz Modal Component
interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveQuiz: (questions: Question[]) => void;
  editingQuiz?: Quiz | null;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({
  isOpen,
  onClose,
  onSaveQuiz,
  editingQuiz,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setQuestions([
        {
          id: 1,
          text: "",
          image: null,
          imageUrl: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ]);
      setCurrentQuestionIndex(0);
      return;
    }

    if (editingQuiz) {
      // Load editing quiz
      setQuestions(editingQuiz.questions);
      setCurrentQuestionIndex(0);
    } else {
      // Fresh new quiz
      setQuestions([
        {
          id: 1,
          text: "",
          image: null,
          imageUrl: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
        },
      ]);
      setCurrentQuestionIndex(0);
    }
  }, [isOpen, editingQuiz]);
  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: questions.length + 1,
      text: "",
      image: null,
      imageUrl: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
      if (currentQuestionIndex >= newQuestions.length) {
        setCurrentQuestionIndex(newQuestions.length - 1);
      }
    }
  };

  const handleQuestionTextChange = (text: string) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex].text = text;
    setQuestions(newQuestions);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const newQuestions = [...questions];
      newQuestions[currentQuestionIndex].image = file;
      newQuestions[currentQuestionIndex].imageUrl = URL.createObjectURL(file);
      setQuestions(newQuestions);
    } else if (file) {
      alert("File size must be less than 5MB");
    }
  };

  const handleRemoveImage = () => {
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex].image = null;
    newQuestions[currentQuestionIndex].imageUrl = "";
    setQuestions(newQuestions);
  };

  const handleOptionChange = (optionIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex].options[optionIndex] = text;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[currentQuestionIndex].correctAnswer = optionIndex;
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    const current = questions[currentQuestionIndex];
    if (!current.text.trim()) {
      alert("Please enter question text");
      return;
    }
    if (current.options.some((opt) => !opt.trim())) {
      alert("Please fill all options");
      return;
    }

    onSaveQuiz(questions);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{editingQuiz ? "Edit Quiz" : "Create CBT Questions"}</h2>
            <span className="question-counter">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Question Text *</label>
            <textarea
              placeholder="Enter your question here..."
              className="question-textarea"
              value={currentQuestion?.text || ""}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Question Image (Optional)</label>
            <div className="image-upload-section">
              {currentQuestion?.imageUrl ? (
                <div className="image-preview">
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question preview"
                    className="preview-image"
                  />
                  <button
                    className="remove-image-btn"
                    onClick={handleRemoveImage}
                  >
                    <Trash2 size={16} />
                    Remove Image
                  </button>
                </div>
              ) : (
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="image-input"
                  />
                  <label htmlFor="image-upload" className="upload-label">
                    <ImageIcon size={32} color="#6b7280" />
                    <p>Click to upload question image</p>
                    <span>JPG, PNG, GIF - Max 5MB</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Answer Options *</label>
            <div className="options-list">
              {currentQuestion?.options.map((option, index) => (
                <div key={index} className="option-item">
                  <div className="option-header">
                    <span className="option-label">
                      Option {String.fromCharCode(65 + index)}
                    </span>
                    <div className="correct-answer-selector">
                      <input
                        type="radio"
                        name="correct-answer"
                        checked={currentQuestion.correctAnswer === index}
                        onChange={() => handleCorrectAnswerChange(index)}
                        className="correct-radio"
                      />
                      <label>Correct Answer</label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="option-input"
                    placeholder={`Enter option ${String.fromCharCode(
                      65 + index
                    )}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <button
              className="nav-btn prev"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            >
              Previous Question
            </button>
            {questions.length > 1 && (
              <button
                className="remove-question-btn"
                onClick={() => handleRemoveQuestion(currentQuestionIndex)}
              >
                <Trash2 size={16} />
                Remove This Question
              </button>
            )}
          </div>

          <div className="footer-right">
            <button
              className="nav-btn next"
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next Question
            </button>
            <button className="add-question-btn" onClick={handleAddQuestion}>
              <Plus size={16} />
              Add Another Question
            </button>
            <button
              className="action-btn save"
              onClick={handleSave}
              style={{ backgroundColor: "#4299e1 !important" }}
            >
              {editingQuiz ? "Update Questions" : "Save Questions"} (
              {questions.length} questions)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Class List Panel Component
interface ClassListPanelProps {
  students: Student[];
  isOpen: boolean;
  toggle: () => void;
  loading: boolean;
  teacherClasses: TeacherClassInfo[];
}

const ClassListPanel: React.FC<ClassListPanelProps> = ({
  students,
  isOpen,
  toggle,
  loading,
  teacherClasses,
}) => {
  return (
    <div className="card group-chats" id="group-chats">
      <div className="card-header">
        <h3>My Students ({students.length})</h3>
        <button onClick={toggle} className="view-all">
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading students…</div>
      ) : !isOpen ? (
        <div className="class-list-collapsed" onClick={toggle}>
          {students.length === 0 ? (
            <div
              className="empty-state-small"
              style={{
                textAlign: "center",
                color: "#9ca3af",
                padding: "20px",
                fontSize: "14px",
              }}
            >
              <div>No students found</div>
              <div style={{ fontSize: "12px", marginTop: "5px" }}>
                Check if classes match
              </div>
            </div>
          ) : (
            <>
              {students.slice(0, 12).map((s) => (
                <div
                  key={s.id}
                  className="initial-circle"
                  title={`${s.fullName} (${s.className})`}
                >
                  {s.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              ))}
              {students.length > 12 && (
                <div
                  className="initial-circle"
                  title={`+${students.length - 12} more`}
                >
                  +{students.length - 12}
                </div>
              )}
            </>
          )}
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
                <div style={{ marginBottom: "10px" }}>
                  <Users size={48} color="#9ca3af" />
                </div>
                <p style={{ marginBottom: "5px" }}>
                  No students have signed up for your classes yet.
                </p>
                <p style={{ fontSize: "14px", color: "#6b7280" }}>
                  Teacher Classes:{" "}
                  {teacherClasses?.map((c) => c.className).join(", ") || "None"}
                </p>
              </div>
            ) : (
              <div className="students-list">
                {students.map((s) => (
                  <div key={s.id} className="student-row">
                    <div className="student-avatar" title={s.fullName}>
                      {s.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div>
                        <strong>{s.fullName}</strong>
                        <span
                          style={{
                            fontSize: "12px",
                            background: "#e0e7ff",
                            color: "#4f46e5",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            marginLeft: "8px",
                          }}
                        >
                          {s.className}
                        </span>
                      </div>
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>
                        {s.email}
                      </div>
                      {s.subjects && s.subjects.length > 0 && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#10b981",
                            marginTop: "4px",
                          }}
                        >
                          Subjects: {s.subjects.join(", ")}
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

// Main Teacher Dashboard Component
const TeacherDashboard: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const {
    user,
    userData,
    teacherClasses: rawTeacherClasses,
    students,
    loading,
    error,
    authInitialized,
    initializeAuth,
    signOutUser,
  } = useFirebaseStore();

  const [teacherClasses, setTeacherClasses] = useState<TeacherClassInfo[]>([]);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [activeTerm, setActiveTerm] = useState<string>("First Term");
  const [activeSession, setActiveSession] = useState<string>("2024/2025");

  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [classListOpen, setClassListOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizNameModalOpen, setQuizNameModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [tempQuestions, setTempQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHoursData[]>([]);
  const [onlineStartTime, setOnlineStartTime] = useState<Date | null>(null);
  const [performanceMenuOpen, setPerformanceMenuOpen] = useState(false);
  const [uploadCAModalOpen, setUploadCAModalOpen] = useState(false);
  const [liveMonitoringModalOpen, setLiveMonitoringModalOpen] = useState(false);
  const [gradeManagementModalOpen, setGradeManagementModalOpen] =
    useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedQuizForReschedule, setSelectedQuizForReschedule] =
    useState<Quiz | null>(null);

  const debugStudentData = () => {
    console.log("🔍 DEBUG: Student & Teacher Data Analysis");

    // Show teacher data structure
    console.log("🏫 TEACHER DATA STRUCTURE:");
    console.log("Teacher classes from store:", rawTeacherClasses);
    console.log("Processed teacherClasses:", teacherClasses);

    // Show student data structure
    console.log("\n👥 STUDENT DATA STRUCTURE:");
    console.log("Total students from store:", students.length);

    // Show first 3 students
    students.slice(0, 3).forEach((student, index) => {
      console.log(`Student ${index + 1}:`);
      console.log(`  Name: ${student.first} ${student.last}`);
      console.log(`  Email: ${student.email}`);
      console.log(`  Class (className): "${student.className}"`);
      console.log(
        `  Has classes array?: ${"classes" in student ? "YES" : "NO"}`
      );
      if ("classes" in student) {
        console.log(
          `  Classes array: ${JSON.stringify((student as any).classes)}`
        );
      }
    });

    // Show filtering results
    console.log("\n🔍 FILTERING RESULTS:");
    console.log(
      `Teacher teaches classes: ${teacherClasses
        .map((tc) => tc.className)
        .join(", ")}`
    );
    console.log(`Filtered students count: ${classStudents.length}`);

    classStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.fullName} -> ${student.className}`);
    });
  };

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user?.email) return;

      try {
        console.log("🔍 Fetching teacher data for:", user.email);

        const teachersRef = collection(db, "teachers");
        const q = query(teachersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const teacherData = querySnapshot.docs[0].data();
          console.log("📋 Raw teacher data from Firestore:", teacherData);

          let classesData: TeacherClassInfo[] = [];

          // Multiple ways to extract classes and subjects
          if (teacherData.classes && Array.isArray(teacherData.classes)) {
            console.log("📚 Classes array found:", teacherData.classes);

            classesData = teacherData.classes
              .filter(
                (className: string) =>
                  className && typeof className === "string"
              )
              .map((className: string) => {
                const normalizedClassName = className.trim();

                // Extract subjects for this class
                let subjects: string[] = [];

                if (
                  teacherData.subjects &&
                  teacherData.subjects[normalizedClassName]
                ) {
                  subjects = teacherData.subjects[normalizedClassName];
                } else if (
                  teacherData.subjects &&
                  Array.isArray(teacherData.subjects)
                ) {
                  subjects = teacherData.subjects;
                } else if (teacherData[normalizedClassName]?.subjects) {
                  subjects = teacherData[normalizedClassName].subjects;
                } else if (teacherData.subject) {
                  subjects = [teacherData.subject];
                } else {
                  subjects = ["General"];
                }

                return {
                  className: normalizedClassName,
                  subjects: Array.isArray(subjects)
                    ? subjects
                        .filter((s) => s && typeof s === "string")
                        .map(String)
                    : ["General"],
                };
              })
              .filter((c: TeacherClassInfo) => c.className);
          } else if (
            teacherData.teaching &&
            Array.isArray(teacherData.teaching)
          ) {
            // Alternative: teaching array format
            console.log("📚 Teaching array found:", teacherData.teaching);

            classesData = teacherData.teaching
              .filter((t: any) => t && (t.classLevel || t.className))
              .map((t: any) => {
                const className = (t.classLevel || t.className || "")
                  .toString()
                  .trim();
                let subjects: string[] = [];

                if (t.subjects && Array.isArray(t.subjects)) {
                  subjects = t.subjects.map(String);
                } else if (
                  teacherData.subjects &&
                  teacherData.subjects[className]
                ) {
                  subjects = teacherData.subjects[className];
                } else if (teacherData.subject) {
                  subjects = [teacherData.subject];
                } else {
                  subjects = ["General"];
                }

                return {
                  className,
                  subjects: subjects.filter((s) => s && typeof s === "string"),
                };
              })
              .filter((c: TeacherClassInfo) => c.className);
          } else if (teacherData.className) {
            // Single class format
            console.log("📚 Single class found:", teacherData.className);

            const className = teacherData.className.toString().trim();
            let subjects: string[] = [];

            if (teacherData.subjects && Array.isArray(teacherData.subjects)) {
              subjects = teacherData.subjects.map(String);
            } else if (teacherData.subject) {
              subjects = [teacherData.subject];
            } else {
              subjects = ["General"];
            }

            classesData = [
              {
                className,
                subjects: subjects.filter((s) => s && typeof s === "string"),
              },
            ];
          }

          console.log("✅ Final teacherClasses:", classesData);
          setTeacherClasses(classesData);

          // Auto-select first class
          if (classesData.length > 0 && !selectedClass) {
            setSelectedClass(classesData[0].className);
          }

          // If no classes found, create a demo entry
          if (classesData.length === 0) {
            console.warn("⚠️ No valid classes found, creating demo class");
            const demoClasses = [
              { className: "Class A", subjects: ["Mathematics", "Science"] },
              { className: "Class B", subjects: ["English", "History"] },
            ];
            setTeacherClasses(demoClasses);
            setSelectedClass("Class A");
          }
        } else {
          console.warn("⚠️ No teacher document found for email:", user.email);
          // Create demo data for testing
          const demoClasses = [
            { className: "Class A", subjects: ["Mathematics", "Science"] },
            { className: "Class B", subjects: ["English", "History"] },
          ];
          setTeacherClasses(demoClasses);
          setSelectedClass("Class A");
        }
      } catch (error) {
        console.error("❌ Error fetching teacher data:", error);
        // Fallback to demo data
        const demoClasses = [
          { className: "Demo Class", subjects: ["Mathematics", "Science"] },
        ];
        setTeacherClasses(demoClasses);
        setSelectedClass("Demo Class");
      }
    };

    if (user?.email) {
      fetchTeacherData();
    }
  }, [user]);
  // Replace the entire student filtering useEffect with this CORRECTED version:
  useEffect(() => {
    console.log("🎯 ===== CORRECTED STUDENT FILTERING ===== ");
    console.log("📊 Teacher classes:", teacherClasses);
    console.log("👥 Students from store count:", students.length);

    if (teacherClasses.length === 0) {
      console.log("⏳ Waiting for teacher classes...");
      setClassStudents([]);
      return;
    }

    if (students.length === 0) {
      console.log("⏳ Waiting for students from store...");
      setClassStudents([]);
      return;
    }

    console.log("🔍 Checking student classes:");
    students.forEach((student, index) => {
      console.log(
        `${index + 1}. ${student.first} ${student.last}: "${student.className}"`
      );
    });

    // Enhanced normalization function
    const normalizeClassName = (className: string | undefined): string => {
      if (!className) return "";
      return className
        .toLowerCase()
        .replace(/\s+/g, "") // Remove all spaces
        .replace(/[_-]/g, "") // Remove hyphens and underscores
        .trim();
    };

    // Filter students - Students only have className, NOT classes array
    const filtered = students.filter((student) => {
      const studentClass = student.className || "";
      const studentNormalized = normalizeClassName(studentClass);

      if (!studentClass) {
        console.log(`❌ ${student.first} ${student.last}: No class found`);
        return false;
      }

      console.log(`🔍 Checking student: ${student.first} ${student.last}`);
      console.log(`  Original class: "${studentClass}"`);
      console.log(`  Normalized: "${studentNormalized}"`);

      // Check if student's className matches ANY teacher class
      const matches = teacherClasses.some((teacherClass) => {
        const teacherClassName = teacherClass.className;
        const teacherNormalized = normalizeClassName(teacherClassName);

        console.log(`  Comparing with teacher class: "${teacherClassName}"`);
        console.log(`  Teacher normalized: "${teacherNormalized}"`);

        // ONLY check for EXACT match after normalization
        if (studentNormalized === teacherNormalized) {
          console.log(
            `✅ Exact match: "${studentClass}" = "${teacherClassName}"`
          );
          return true;
        }

        console.log(
          `❌ No match: "${studentNormalized}" ≠ "${teacherNormalized}"`
        );
        return false;

        console.log(`❌ No match`);
        return false;
      });

      return matches;
    });

    console.log(
      `📈 Found ${filtered.length} matching students out of ${students.length}`
    );

    // Enhance students with fullName and subjects
    const enhanced = filtered.map((student) => {
      const studentClass = student.className || "";
      const studentNormalized = normalizeClassName(studentClass);

      // Find matching teacher class - ONLY EXACT MATCHES!
      const matchedClassInfo = teacherClasses.find((teacherClass) => {
        const teacherNormalized = normalizeClassName(teacherClass.className);
        return studentNormalized === teacherNormalized; // ONLY exact match
      });
      return {
        ...student,
        fullName: `${student.first} ${student.last}`,
        subjects: matchedClassInfo?.subjects || ["General"],
        className:
          matchedClassInfo?.className || student.className || "Unknown Class",
      } as Student;
    });

    console.log(
      "🎉 Enhanced students:",
      enhanced.map((s) => ({
        name: s.fullName,
        class: s.className,
        subjects: s.subjects,
      }))
    );

    setClassStudents(enhanced);
  }, [students, teacherClasses]);

  // Enhanced students with class information
  const enhancedStudents = useMemo(() => {
    return classStudents.map((student) => ({
      ...student,
      classId: student.className || "default-class",
      className: student.className || "Default Class",
      classes: student.classes || [], // Ensure classes is included
    }));
  }, [classStudents]);
  // Add this useEffect to listen for quiz deletions from other devices
  useEffect(() => {
    if (!user?.uid) return;

    const quizzesRef = collection(db, "quizzes");
    const q = query(quizzesRef, where("teacherId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const quizzesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Quiz[];

        // Check for deleted quizzes
        const localQuizIds = quizzes.map((q) => q.id);
        const firestoreQuizIds = quizzesData.map((q) => q.id);

        // Find quizzes that are in local state but not in Firestore
        const deletedQuizIds = localQuizIds.filter(
          (id) => !firestoreQuizIds.includes(id)
        );

        if (deletedQuizIds.length > 0) {
          console.log(
            "🧹 Removing deleted quizzes from local state:",
            deletedQuizIds
          );
          setQuizzes((prev) =>
            prev.filter((q) => !deletedQuizIds.includes(q.id))
          );
        }

        // Update quiz statuses
        const now = new Date();
        const updatedQuizzes = quizzesData.map((quiz) => {
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
      },
      (error) => {
        console.error("Error listening to quizzes:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Initialize online status and working hours
  useEffect(() => {
    const today = new Date().toDateString();

    // First, load online start time from Firestore
    const loadOnlineStatus = async () => {
      if (!user?.uid) return;

      try {
        const onlineRef = doc(db, "onlineStatus", user.uid);
        const docSnap = await getDoc(onlineRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.lastOnlineDate === today && data.startTime) {
            setOnlineStartTime(data.startTime.toDate());
          } else {
            const startTime = new Date();
            setOnlineStartTime(startTime);
            // Save to Firestore
            await setDoc(
              onlineRef,
              {
                lastOnlineDate: today,
                startTime: startTime,
                teacherId: user.uid,
                updatedAt: new Date(),
              },
              { merge: true }
            );
          }
        } else {
          // First time - create document
          const startTime = new Date();
          setOnlineStartTime(startTime);
          await setDoc(onlineRef, {
            lastOnlineDate: today,
            startTime: startTime,
            teacherId: user.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error loading online status:", error);
        // Use localStorage ONLY for working hours as fallback
        const savedOnlineStartTime = localStorage.getItem(
          "teacher-online-start-time"
        );
        if (savedOnlineStartTime) {
          setOnlineStartTime(new Date(savedOnlineStartTime));
        } else {
          const startTime = new Date();
          setOnlineStartTime(startTime);
          localStorage.setItem(
            "teacher-online-start-time",
            startTime.toISOString()
          );
        }
        localStorage.setItem("teacher-last-online-date", today);
      }
    };

    loadOnlineStatus();
    initializeWorkingHours();
  }, [user]);

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
        "teacherWorkingHours",
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

        // Save to Firestore
        await setDoc(
          workingHoursRef,
          {
            teacherId: user.uid,
            date: todayStr,
            hours: hoursData,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Error loading working hours:", error);
      // Fallback to localStorage for working hours only
      const savedWorkingHours = localStorage.getItem("teacher-working-hours");

      if (savedWorkingHours) {
        const parsedHours = JSON.parse(savedWorkingHours);
        const lastUpdated = localStorage.getItem("working-hours-last-updated");

        if (lastUpdated !== todayStr) {
          const updatedHours = parsedHours.map(
            (day: WorkingHoursData, index: number) =>
              index === todayIndex
                ? { ...day, minutes: 1, online: true, startTime: new Date() }
                : day
          );
          setWorkingHours(updatedHours);
          localStorage.setItem("working-hours-last-updated", todayStr);
        } else {
          setWorkingHours(parsedHours);
        }
      } else {
        const hoursData = days.map((day, index) => ({
          day,
          minutes: index === todayIndex ? 1 : 0,
          online: index === todayIndex,
          startTime: index === todayIndex ? new Date() : undefined,
        }));
        setWorkingHours(hoursData);
        localStorage.setItem("working-hours-last-updated", todayStr);
      }
    }
  }, [user]);

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

  // Save working hours to localStorage
  useEffect(() => {
    const saveWorkingHours = async () => {
      if (workingHours.length > 0 && user?.uid) {
        const todayStr = new Date().toDateString();
        try {
          const workingHoursRef = doc(
            db,
            "teacherWorkingHours",
            `${user.uid}_${todayStr}`
          );
          await setDoc(
            workingHoursRef,
            {
              teacherId: user.uid,
              date: todayStr,
              hours: workingHours,
              updatedAt: new Date(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error("Error saving working hours:", error);
          // Fallback to localStorage for working hours only
          localStorage.setItem(
            "teacher-working-hours",
            JSON.stringify(workingHours)
          );
        }
      }
    };

    saveWorkingHours();
  }, [workingHours, user]);

  // Load quizzes from Firestore in real-time
  useEffect(() => {
    if (!user?.uid) return;

    const quizzesRef = collection(db, "quizzes");
    const q = query(quizzesRef, where("teacherId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const quizzesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Quiz[];

        // Update quiz statuses
        const now = new Date();
        const updatedQuizzes = quizzesData.map((quiz) => {
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
        console.log("Loaded quizzes from Firestore:", updatedQuizzes.length);
      },
      (error) => {
        console.error("Error listening to quizzes:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Update quiz statuses in real-time
  useEffect(() => {
    const updateQuizStatuses = () => {
      const now = new Date();
      setQuizzes((prevQuizzes) =>
        prevQuizzes.map((quiz) => {
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
        })
      );
    };

    const interval = setInterval(updateQuizStatuses, 30000);
    updateQuizStatuses();
    return () => clearInterval(interval);
  }, []);

  // Performance feature handler
  const handlePerformanceFeatureSelect = (feature: string) => {
    setSelectedFeature(feature);
    setPerformanceMenuOpen(false);

    switch (feature) {
      case "grade-management":
        setGradeManagementModalOpen(true);
        break;
      case "live-monitoring":
        setLiveMonitoringModalOpen(true);
        break;
      case "upload-ca":
        setUploadCAModalOpen(true);
        break;
      default:
        break;
    }
  };

  const activeQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.status === "active"),
    [quizzes]
  );

  // Logout handler
  const handleLogout = async () => {
    try {
      console.log("🚪 Dashboard: Logging out and redirecting...");

      // 1. Sign out
      await signOutUser();

      // 2. ✅ CRITICAL: Force immediate navigation to login
      window.location.href = "/login"; // This breaks the loop!

      // OR if you have access to navigate hook:
      // navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/login"; // Fallback
    }
  };

  //handle scroll
  useEffect(() => {
    let lastScroll = window.scrollY;

    const handleScroll = () => {
      const card = document.querySelector(".profile-card");
      if (!card) return;

      if (window.scrollY > lastScroll) {
        // scrolling down → hide
        card.classList.add("hide-card");
      } else {
        // scrolling up → show
        card.classList.remove("hide-card");
      }

      lastScroll = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Quiz management functions
  const handleSaveQuestions = useCallback(
    (questions: Question[]) => {
      setTempQuestions(questions);
      if (editingQuiz) {
        // If editing, update the existing quiz
        setQuizNameModalOpen(true);
      } else {
        // If creating new, proceed to save
        setQuizNameModalOpen(true);
      }
    },
    [editingQuiz]
  );
  // Reschedule handler function
  const handleRescheduleQuiz = useCallback((quiz: Quiz) => {
    setSelectedQuizForReschedule(quiz);
    setRescheduleModalOpen(true);
  }, []);

  const handleUpdateSchedule = useCallback(
    async (
      quizId: string,
      newDate: string,
      newTime: string,
      newDuration?: number
    ) => {
      try {
        const quizRef = doc(db, "quizzes", quizId);
        const newTotalDuration = (newDuration || 30) + 10;
        const scheduledDateTime = new Date(`${newDate}T${newTime}`);
        const now = new Date();
        const endTime = new Date(
          scheduledDateTime.getTime() + newTotalDuration * 60000
        );

        let newStatus: "upcoming" | "active" | "expired" = "upcoming";
        if (now >= scheduledDateTime && now <= endTime) {
          newStatus = "active";
        } else if (now > endTime) {
          newStatus = "expired";
        }

        const updateData: any = {
          scheduledDate: newDate,
          scheduledTime: newTime,
          status: newStatus,
          active: newStatus === "active",
          updatedAt: new Date(),
        };

        if (newDuration !== undefined) {
          updateData.duration = newDuration;
          updateData.totalDuration = newTotalDuration;
        }

        // Update in Firestore
        await updateDoc(quizRef, updateData);

        // Update local state
        setQuizzes((prev) =>
          prev.map((q) =>
            q.id === quizId
              ? {
                  ...q,
                  scheduledDate: newDate,
                  scheduledTime: newTime,
                  duration: newDuration || q.duration,
                  totalDuration: newTotalDuration,
                  status: newStatus,
                }
              : q
          )
        );

        alert("Quiz schedule updated successfully!");
      } catch (error) {
        console.error("❌ Error updating quiz schedule:", error);
        alert("Failed to update quiz schedule. Please try again.");
      }
    },
    []
  );
  const handleSaveQuizWithName = useCallback(
    async (
      name: string,
      duration: number,
      scheduledDate: string,
      scheduledTime: string,
      subject: string,
      maxScore: number,
      targetClass: string
    ) => {
      const totalDuration = duration + 10;
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      const now = new Date();
      const endTime = new Date(
        scheduledDateTime.getTime() + totalDuration * 60000
      );

      let status: "upcoming" | "active" | "expired" = "upcoming";
      if (now >= scheduledDateTime && now <= endTime) {
        status = "active";
      } else if (now > endTime) {
        status = "expired";
      }

      try {
        if (editingQuiz) {
          // UPDATE EXISTING QUIZ
          const updatedQuiz: Quiz = {
            ...editingQuiz,
            name,
            questions: tempQuestions,
            duration,
            scheduledDate,
            scheduledTime,
            totalDuration,
            status,
            subject,
            maxScore,
            targetClass,
            updatedAt: new Date(),
          };

          // Update in Firestore
          const quizRef = doc(db, "quizzes", editingQuiz.id);
          await updateDoc(quizRef, {
            name,
            questions: tempQuestions.map((q) => ({
              id: q.id,
              text: q.text,
              imageUrl: q.imageUrl,
              options: q.options,
              correctAnswer: q.correctAnswer,
            })),
            duration,
            scheduledDate,
            scheduledTime,
            totalDuration,
            status,
            subject,
            maxScore,
            targetClass,
            updatedAt: new Date(),
            active: status === "active",
          });

          console.log("✅ Quiz updated in Firestore:", editingQuiz.id);
        } else {
          // CREATE NEW QUIZ
          const quizId = Date.now().toString();
          const newQuiz: Quiz = {
            id: quizId,
            name,
            questions: tempQuestions,
            duration,
            scheduledDate,
            scheduledTime,
            totalDuration,
            status,
            subject,
            maxScore,
            targetClass,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Save to Firestore
          await setDoc(doc(db, "quizzes", quizId), {
            ...newQuiz,
            teacherId: user?.uid,
            teacherName: user?.displayName || "Teacher",
            published: true,
            active: status === "active",
          });

          // Update local state
          console.log("✅ New quiz saved to Firestore:", quizId);
        }

        // Reset states
        setQuizNameModalOpen(false);
        setQuizModalOpen(false);
        setTempQuestions([]);
        setEditingQuiz(null);

        alert(
          editingQuiz
            ? "Quiz updated successfully!"
            : "Quiz created successfully!"
        );
      } catch (error) {
        console.error("❌ Error saving quiz to Firestore:", error);
        alert("Failed to save quiz. Please try again.");
      }
    },
    [tempQuestions, editingQuiz, user]
  );

  const saveQuizToFirestore = async (quiz: Quiz) => {
    try {
      const quizzesRef = collection(db, "quizzes");
      await setDoc(doc(quizzesRef, quiz.id), {
        name: quiz.name,
        subject: quiz.subject,
        scheduledDate: quiz.scheduledDate,
        scheduledTime: quiz.scheduledTime,
        duration: quiz.duration,
        totalDuration: quiz.totalDuration,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          text: q.text,
          imageUrl: q.imageUrl,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
        maxScore: quiz.maxScore,
        targetClass: quiz.targetClass,
        teacherId: user?.uid,
        teacherName: user?.displayName || "Teacher",
        createdAt: new Date(),
        updatedAt: new Date(),
        published: true,
        active: quiz.status === "active",
      });
      console.log("Quiz saved to Firestore successfully:", quiz.id);
    } catch (error) {
      console.error("Error saving quiz to Firestore:", error);
    }
  };

  const handleEditQuiz = useCallback((quiz: Quiz) => {
    setEditingQuiz(quiz);
    setTempQuestions(quiz.questions);
    setQuizModalOpen(true);
  }, []);

  const handleDeleteQuiz = useCallback(async (quizId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      try {
        // Delete from Firestore first
        const quizRef = doc(db, "quizzes", quizId);
        await deleteDoc(quizRef);
        console.log("✅ Quiz deleted from Firestore:", quizId);

        // Then delete from local state
        setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));

        alert("Quiz deleted successfully!");
      } catch (error) {
        console.error("❌ Error deleting quiz from Firestore:", error);
        alert("Failed to delete quiz. Please try again.");
      }
    }
  }, []);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play size={22} color="#10b981" />;
      case "upcoming":
        return <Clock size={22} color="#f59e0b" />;
      case "expired":
        return <AlertCircle size={22} color="#ef4444" />;
      default:
        return <Clock size={22} color="#6b7280" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "upcoming":
        return "Upcoming";
      case "expired":
        return "Expired";
      default:
        return "Unknown";
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
    if (!enhancedStudents || enhancedStudents.length === 0) return 0;
    const total = enhancedStudents.reduce(
      (sum, s) => sum + (s.progress ?? 0),
      0
    );
    return Math.round(total / enhancedStudents.length);
  }, [enhancedStudents]);

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
    { id: "students", label: "Students", icon: Users, Hash: "#group-chats" },
  ];

  // Upcoming classes
  const upcomingClasses = useMemo(() => {
    const classItems = teacherClasses.map((c, i) => ({
      id: `class-${i + 1}`,
      time: i % 2 === 0 ? "10:30" : "14:30",
      name: c.className,
      location: "Classroom",
      type: "class" as const,
      status: "active" as const,
    }));

    const quizItems = quizzes
      .filter((quiz) => quiz.status === "upcoming" || quiz.status === "active")
      .map((quiz) => ({
        id: `quiz-${quiz.id}`,
        time: quiz.scheduledTime,
        name: quiz.name,
        location: "Online Exam",
        type: "quiz" as const,
        status: quiz.status as "active" | "upcoming",
      }));

    return [...classItems, ...quizItems].slice(0, 5);
  }, [teacherClasses, quizzes]);

  const firstName = user?.displayName?.split(" ")[0] || "Teacher";
  const fullName = user?.displayName || "Teacher Name";
  const email = user?.email || "email@example.com";

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
    <div
      className={`app ${
        quizModalOpen ||
        quizNameModalOpen ||
        performanceMenuOpen ||
        uploadCAModalOpen ||
        liveMonitoringModalOpen ||
        gradeManagementModalOpen
          ? "modal-open"
          : ""
      }`}
    >
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
              <i className="bx bx-log-out">Logout</i>
            </button>

            {/* Mobile Profile Avatar */}
            {user && (
              <div className="profile-avatar-container">
                <div
                  className="profile-avatar-mobile"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span>{fullName.charAt(0).toUpperCase()}</span>
                </div>

                <div
                  className={`profile-dropdown ${dropdownOpen ? "show" : ""}`}
                >
                  <h2>{fullName}</h2>
                  <p>{email}</p>
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
              <div className="create-card">
                <div className="avatar-placeholder"></div>
                <button
                  className="create-chat-btn"
                  onClick={() => {
                    setEditingQuiz(null);
                    setQuizModalOpen(true);
                  }}
                >
                  <Plus size={18} /> Create Quiz
                </button>
                <button
                  className="create-class-link"
                  onClick={() => {
                    setEditingQuiz(null);
                    setQuizModalOpen(true);
                  }}
                >
                  Upload Questions
                </button>
              </div>
              <div className="copyright">© SXaint MegaPend</div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main
          className={`main-content ${
            quizModalOpen ||
            quizNameModalOpen ||
            performanceMenuOpen ||
            uploadCAModalOpen ||
            liveMonitoringModalOpen ||
            gradeManagementModalOpen
              ? "blurred"
              : ""
          }`}
        >
          <div className="welcome">
            <h1>Welcome back, {firstName}</h1>
            <p>
              {dayStr} • {todayStr} • {timeStr}
            </p>
            {teacherClasses.length > 0 && (
              <div className="teacher-classes-info">
                <span className="classes-tag">
                  <Building size={16} />
                  Classes: {teacherClasses.map((c) => c.className).join(", ")}
                </span>
              </div>
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
              <h2>Your students average progress is {progressPercent}%</h2>
              <p>Level up your students to improve your teacher rank!</p>
            </div>
          </div>

          {/* Top Grid */}
          <div className="top-grid">
            <div className="card working-hours">
              <div className="card-header">
                <h3>Working Hours</h3>
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
              teacherClasses={teacherClasses}
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

          {/* Bottom Grid */}
          <div className="bottom-grid">
            <div className="card student-tests">
              <div className="card-header">
                <h3>Student Tests ({quizzes.length})</h3>
                <a href="#" className="view-all">
                  All tests
                </a>
              </div>
              <div className="test-list">
                {quizzes.length === 0 ? (
                  <div className="empty-state">
                    No tests created yet. Click "Create Quiz" to get started.
                  </div>
                ) : (
                  quizzes.map((quiz) => (
                    <div key={quiz.id} className="test-item">
                      <div className="test-icon">
                        <FileText size={24} />
                      </div>
                      <div className="test-info">
                        <div className="test-title-section">
                          <h4>
                            {quiz.name} ({quiz.targetClass})
                          </h4>
                          <div className="test-actions">
                            <button
                              className="reschedule-btn"
                              onClick={() => handleRescheduleQuiz(quiz)}
                              title="Reschedule quiz"
                            >
                              <Calendar size={16} />
                            </button>
                            <button
                              className="edit-btn"
                              onClick={() => handleEditQuiz(quiz)}
                              title="Edit quiz"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                              title="Delete quiz"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="test-meta">
                          <span>
                            <Clock size={16} /> {quiz.duration} min test + 10min
                            buffer
                          </span>
                          <span>
                            <CalendarIcon size={16} />{" "}
                            {new Date(quiz.scheduledDate).toLocaleDateString()}{" "}
                            at {quiz.scheduledTime}
                          </span>
                          <span>
                            <Users size={16} /> {quiz.questions.length}{" "}
                            questions
                          </span>
                          <span>
                            <BookOpen size={16} /> {quiz.subject} (Max:{" "}
                            {quiz.maxScore})
                          </span>
                        </div>
                      </div>
                      <div className={`status ${quiz.status}`}>
                        {getStatusIcon(quiz.status)}
                        <span>{getStatusText(quiz.status)}</span>
                      </div>
                    </div>
                  ))
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
                        ) : item.status === "active" ? (
                          <CheckCircle size={20} color="#10b981" />
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
        <div
          className={`profile-card ${
            quizModalOpen ||
            quizNameModalOpen ||
            performanceMenuOpen ||
            uploadCAModalOpen ||
            liveMonitoringModalOpen ||
            gradeManagementModalOpen
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
                <strong>Rank 14</strong> / 100
              </div>
              <div>
                <strong>Classes: {teacherClasses.length}</strong>
              </div>
              <div>
                <strong>Students: {enhancedStudents.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateQuizModal
        key={editingQuiz ? `edit-${editingQuiz.id}` : "create-new"}
        isOpen={quizModalOpen}
        onClose={() => {
          setQuizModalOpen(false);
          setEditingQuiz(null);
        }}
        onSaveQuiz={handleSaveQuestions}
        editingQuiz={editingQuiz}
      />

      <QuizNameModal
        key={`quiz-name-${tempQuestions.length}`}
        isOpen={quizNameModalOpen}
        onClose={() => {
          setQuizNameModalOpen(false);
        }}
        onSave={handleSaveQuizWithName}
        questions={tempQuestions}
        teacherClasses={teacherClasses}
      />

      <UploadCAModal
        isOpen={uploadCAModalOpen}
        onClose={() => setUploadCAModalOpen(false)}
        students={enhancedStudents}
        teacherClasses={teacherClasses}
        user={user}
      />

      <LiveMonitoringModal
        isOpen={liveMonitoringModalOpen}
        onClose={() => setLiveMonitoringModalOpen(false)}
        activeQuizzes={activeQuizzes}
        students={enhancedStudents}
        teacherClasses={teacherClasses}
        user={user}
      />

      <GradeManagementModal
        isOpen={gradeManagementModalOpen}
        onClose={() => setGradeManagementModalOpen(false)}
        students={enhancedStudents}
        teacherClasses={teacherClasses}
        user={user}
        initialSelectedClass={selectedClass}
        initialSelectedSubject={selectedSubject}
        initialActiveTerm={activeTerm}
        initialActiveSession={activeSession}
      />
      <RescheduleModal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setSelectedQuizForReschedule(null);
        }}
        onReschedule={handleUpdateSchedule}
        quiz={selectedQuizForReschedule}
      />

      <style>{`
      /* Add these styles to your existing CSS */
      /* Add to your CSS styles */
.save-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat .stat-value[style*="color: #10b981"] {
  font-weight: 600;
  background: #d1fae5;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #a7f3d0;
}

/* Success message styling */
.score-save-info {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 12px;
  margin-top: 12px;
  font-size: 12px;
  color: #065f46;
}

.score-save-info h5 {
  margin: 0 0 8px 0;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.score-save-info ul {
  margin: 0;
  padding-left: 20px;
}

.score-save-info li {
  margin-bottom: 4px;
}

/* Debug info panel */
.debug-info-panel {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  margin-top: 16px;
  font-size: 11px;
  color: #6b7280;
  max-height: 200px;
  overflow-y: auto;
}

.debug-info-panel pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
      /* Reschedule button styles */
.reschedule-btn {
  background: none;
  border: none;
  color: #f59e0b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reschedule-btn:hover {
  background: #fef3c7;
  color: #d97706;
}

/* Reschedule modal styles */
.quiz-details {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.quiz-details p {
  margin: 8px 0;
  font-size: 14px;
}

.reschedule-summary {
  background: #f0f9ff;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #4299e1;
  margin-top: 20px;
}

.reschedule-summary h4 {
  color: #1e40af;
  margin-bottom: 12px;
}

.reschedule-summary p {
  margin: 8px 0;
  display: flex;
  justify-content: space-between;
}

.reschedule-summary p strong {
  color: #374151;
  min-width: 80px;
}
      .refresh-manual-btn {
        background: #10b981;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
        transition: all 0.2s;
      }
      
      .refresh-manual-btn:hover {
        background: #059669;
        transform: translateY(-1px);
      }
      
      .refresh-manual-btn:active {
        transform: translateY(0);
      }
      
      /* Update existing refresh-btn */
      .refresh-btn {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #e5e7eb;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        transition: all 0.2s;
      }
      
      .refresh-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      .quiz-info-tooltip {
        position: absolute;
        bottom: 100%;
        left: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 8px;
        font-size: 11px;
        color: #6b7280;
        min-width: 150px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: none;
        z-index: 10;
      }
      
      .auto-score-display:hover .quiz-info-tooltip {
        display: block;
      }
      
      .quiz-count, .quiz-avg, .quiz-last {
        display: block;
        margin-bottom: 4px;
      }
      
      .quiz-count {
        color: #1e40af;
        font-weight: 600;
      }
      
      .quiz-avg {
        color: #059669;
        font-weight: 600;
      }
      
      .quiz-last {
        color: #6b7280;
        font-size: 10px;
        border-top: 1px solid #e5e7eb;
        padding-top: 4px;
        margin-top: 4px;
      }
        /* Enhanced CSS styles with new features */
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

        /* Teacher Classes Info */
        .teacher-classes-info {
          margin-top: 8px;
        }

        .classes-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #e0e7ff;
          color: #4f46e5;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
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
          width:300px;
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

        /* Class Options Styling */
        .class-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 16px 0;
        }

        .class-option-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          gap: 8px;
        }

        .class-option-btn:hover {
          border-color: #c7d2fe;
          background: #f8fafc;
        }

        .class-option-btn.selected {
          border-color: #4f46e5;
          background: #eef2ff;
        }

        .class-option-btn span:first-of-type {
          font-weight: 600;
          color: #111827;
          font-size: 16px;
        }

        .student-count {
          font-size: 14px;
          color: #6b7280;
        }

        .class-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .class-tag {
          background: #e0e7ff;
          color: #4f46e5;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 500;
        }

        .class-tag.warning {
          background: #fef3c7;
          color: #92400e;
        }

        /* Time Adjustment Controls */
        .time-control {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .time-adjustments {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .time-adjust-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .time-adjust-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
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

        .sync-indicator {
          margin-top: 12px;
          font-size: 12px;
          color: #6b7280;
        }
        
        .syncing {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f59e0b;
        }
        
        .syncing .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .online-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
        }
        
        .online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
          border-radius:40px;
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
        .profile-avatar-container {
          display: none;
          position: relative;
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
          border-radius:40px;
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

@media (max-width: 1440px) {
  .profile-card {
    width: 280px !important;
    padding: 20px !important;
    gap: 14px !important;
    transition: transform 0.3s ease, opacity 0.3s ease !important;
  }

  .profile-card img {
    width: 55px !important;
    height: 55px !important;
  }

  .profile-card h2 {
    font-size: 1rem !important;
  }

  .profile-card p {
    font-size: 0.85rem !important;
  }

  .profile-card button {
    font-size: 0.85rem !important;
    padding: 6px 14px !important;
  }

  .profile-card.hide-card {
    transform: translateY(-40px) !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
}

        @media (max-width: 1024px) {
          .top-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .bottom-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .main-content {
            padding: 32px !important;
          }
          .profile-card {
            width: 280px !important;
            padding: 20px !important;
            gap: 14px !important;
          }

            .profile-card img {
              width: 55px !important;
              height: 55px !important;
            }
          
            .profile-card h2 {
              font-size: 1rem !important;
            }
          
            .profile-card p {
              font-size: 0.85rem !important;
            }
          
            .profile-card button {
              font-size: 0.85rem !important;
              padding: 6px 14px !important;
            }
              .profile-card {
              transition: transform 0.3s ease, opacity 0.3s ease !important;
            }
            
            .profile-card.hide-card {
              transform: translateY(-40px) !important;
              opacity: 0 !important;
              pointer-events: none !important;
            }
            .avatar-placeholder {
              width: 50px;
              height: 50px;
              background: #c7d2fe;
              border-radius: 50%;
             }
            .sidebar {
              width: 320px;
              background: #fff;
              border-right: 1px solid #e5e7eb;
              height: calc(100vh - 80px);
              position: fixed;
              left: 0;
              top: 80px;
              transition: width 0.3s  cubic-bezier(0.4, 0, 0.2, 1);
              padding: 20px 0;
              box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
              z-index: 40;
          }
          .create-card {
            background: #eef2ff;
            border-radius: 24px;
            padding: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            height: fit-content;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .create-chat-btn {
          background: #4299e1;
          color: #fff;
          border: none;
          border-radius: 16px;
          padding: 14px 20px;
          font-size: 10px;
          font-weight: 600;
          width: 80%;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
          cursor: pointer;
      }
      .avatar-placeholder {
        width: 50px;
        height: 50px;
        background: #c7d2fe;
        border-radius: 50%;
    }
    .copyright {
      margin-top: 10px;
      font-size: 13px;
      color: #9ca3af;
      text-align: center;
  }
  .create-class-link {
    background: transparent;
    color: #4299e1;
    border: none;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
}
          }
@media (max-width: 768px) {
  /* Existing responsive adjustments */
  .header {
    padding: 0 24px;
  }
get-in-touch{
  display:none;
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
    display: none !important; /* hide full profile card on mobile */
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

  /* ------------------ New avatar + dropdown ------------------ */
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
    top: 50px; /* adjust based on header height */
    right: 0;
    width: 200px;
    background-color: #fff;
    border-radius: 8px;
    padding: 0.75rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: none; /* hidden by default */
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
  .get-in-touch{
    display:none;
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
    width:100%;
    gap: 8px;
    justify-content:center;
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
        @media (max-width: 480px) {

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
    margin-left: 260px; /* slightly smaller than 300px */
  }

  .sidebar:not(.open) ~ .main-content {
    margin-left: 70px; /* reduced from 88px */
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
    grid-template-columns: 1fr; /* 1 column for tiny screens */
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
}
/* Enhanced Live Monitoring Styles - ADD THIS TO YOUR EXISTING STYLES */

.teacher-classes-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
}

.class-tag-monitoring {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.enhanced-stats {
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

        .stat-subnumber {
          font-size: 14px;
          color: #ef4444;
          font-weight: 600;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .student-counts {
          display: flex;
          gap: 16px;
        }

        .count-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #6b7280;
        }

        .count-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .student-id {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        }

        .class-badge {
          background: #f0f9ff;
          color: #0369a1;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .student-meta.enhanced {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .student-meta.enhanced span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .violations-list.enhanced {
          margin-top: 12px;
          padding: 12px;
          background: #fef2f2;
          border-radius: 8px;
          border-left: 4px solid #ef4444;
        }

        .violation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .view-details-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
        }

        .violation-item.enhanced {
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #fecaca;
        }

        .violation-item.enhanced:last-child {
          border-bottom: none;
        }

        .violation-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .violation-type {
          font-weight: 600;
          font-size: 12px;
          color: #374151;
          text-transform: capitalize;
        }

        .severity-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .violation-info {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }

        .violation-time,
        .violation-class,
        .violation-quiz-class {
          font-size: 10px;
          color: #6b7280;
        }

        .violation-report-preview {
          margin-top: 12px;
          padding: 12px;
          background: #f0f9ff;
          border-radius: 8px;
          border-left: 4px solid #0369a1;
        }

        .report-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .report-line {
          display: flex;
          margin-bottom: 4px;
        }

        .report-label {
          font-weight: 600;
          font-size: 11px;
          color: #374151;
          min-width: 70px;
        }

        .report-value {
          font-size: 11px;
          color: #6b7280;
          flex: 1;
        }

        /* Monitoring specific styles */
        .monitoring-list {
          max-height: 500px;
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
          margin-bottom: 12px;
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

        .student-details {
          flex: 1;
        }

        .student-name-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .progress-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
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
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .more-violations {
          font-size: 11px;
          color: #ef4444;
          font-weight: 600;
          text-align: center;
          padding-top: 8px;
          border-top: 1px dashed #fca5a5;
          margin-top: 8px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .enhanced-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .monitoring-item {
            flex-direction: column;
            gap: 16px;
          }
          
          .progress-display {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .enhanced-stats {
            grid-template-columns: 1fr;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .student-counts {
            width: 100%;
            justify-content: space-between;
          }
        }
        

      `}</style>
    </div>
  );
};

export default TeacherDashboard;
  
