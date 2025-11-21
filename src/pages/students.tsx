// app/students/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
} from "lucide-react";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import { useLiveDate, useCalendar } from "../hooks/useDateUtils";
import { useNavigate } from "react-router-dom";

// Types (keep your existing types the same)
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

// Class List Panel Component (keep your existing component)
const ClassListPanel: React.FC<{
  students: Student[];
  isOpen: boolean;
  toggle: () => void;
  loading: boolean;
}> = ({ students, isOpen, toggle, loading }) => {
  return (
    <div className="card group-chats" id="group-chats">
      <div className="card-header">
        <h3>Classmates ({students.length})</h3>
        <button onClick={toggle} className="view-all">
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading classmates…</div>
      ) : !isOpen ? (
        <div className="class-list-collapsed" onClick={toggle}>
          {students.slice(0, 12).map((s) => (
            <div key={s.id} className="initial-circle">
              {s.first[0].toUpperCase()}
              {s.last[0].toUpperCase()}
            </div>
          ))}
          {students.length > 12 && (
            <div className="initial-circle">+{students.length - 12}</div>
          )}
          {students.length === 0 && <div className="initial-circle">-</div>}
        </div>
      ) : (
        <div className="class-list-modal" onClick={toggle}>
          <div
            className="class-list-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Classmates ({students.length})</h3>
              <button className="modal-close" onClick={toggle}>
                <X size={20} />
              </button>
            </div>
            {students.length === 0 ? (
              <div className="empty-state">
                No classmates found in your class.
              </div>
            ) : (
              <div className="students-list">
                {students.map((s) => (
                  <div key={s.id} className="student-row">
                    <div className="student-avatar">
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

// Quiz Instructions Modal Component (keep your existing component)
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
                  <h4>4 Violation Limit</h4>
                  <p>Quiz auto-submits after 4 violations</p>
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
                if you need to leave the quiz. Admin code required for exit.
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

// Score Display Modal Component - FIXED VERSION
const ScoreDisplayModal: React.FC<{
  score: number;
  maxScore: number;
  onClose: () => void;
}> = ({ score, maxScore, onClose }) => {
  const percentage = (score / maxScore) * 100;

  // Auto-close after 2 seconds - FIXED
  useEffect(() => {
    console.log("🔄 ScoreDisplayModal: Auto-close timer started");
    const timer = setTimeout(() => {
      console.log("✅ ScoreDisplayModal: Auto-closing now");
      onClose();
    }, 2000);

    return () => {
      console.log("🧹 ScoreDisplayModal: Cleaning up timer");
      clearTimeout(timer);
    };
  }, [onClose]);

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
            <p>Redirecting to dashboard in 2 seconds...</p>
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

// Strict Quiz Interface Component - FIXED VERSION
const StrictQuizInterface: React.FC<{
  quiz: Quiz;
  onClose: () => void;
  onSubmit: (quizId: string, score: number, maxScore: number) => void;
  existingSubmission?: QuizSubmission;
  strictModeActive: boolean;
  studentName: string;
  studentId: string;
}> = ({
  quiz,
  onClose,
  onSubmit,
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
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Enhanced violation detection
  const reportViolation = useCallback(
    (type: Violation["type"], description: string) => {
      const violation: Violation = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type,
        description,
        severity: violationAttempts >= 2 ? "high" : "medium",
      };

      setViolations((prev) => [...prev, violation]);
      setViolationAttempts((prev) => prev + 1);

      if (violationAttempts >= 3) {
        handleAutoSubmit();
        alert("Maximum violations reached! Quiz submitted automatically.");
      } else {
        setShowViolationWarning(true);
        setTimeout(() => setShowViolationWarning(false), 3000);
      }
    },
    [violationAttempts]
  );

  // STRICT MODE: Disable all keyboard inputs
  const preventAllKeys = useCallback(
    (e: KeyboardEvent) => {
      if (!strictModeActive || !quizStarted) return;

      const allowedKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
        "Escape",
        "Enter",
        " ",
      ];

      if (!allowedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        reportViolation("keyboard", `Key pressed: ${e.key}`);
      }
    },
    [strictModeActive, quizStarted, reportViolation]
  );

  // STRICT MODE: Prevent right-click
  const preventContextMenu = useCallback(
    (e: MouseEvent) => {
      if (strictModeActive && quizStarted) {
        e.preventDefault();
        reportViolation("right-click", "Right-click attempted");
      }
    },
    [strictModeActive, quizStarted, reportViolation]
  );

  // STRICT MODE: Prevent tab switching
  const preventTabSwitch = useCallback(
    (e: BeforeUnloadEvent) => {
      if (strictModeActive && quizStarted) {
        e.preventDefault();
        reportViolation("tab-switch", "Tab/window switch attempted");
        e.returnValue =
          "Are you sure you want to leave? Your quiz will be submitted.";
        return e.returnValue;
      }
    },
    [strictModeActive, quizStarted, reportViolation]
  );

  // STRICT MODE: Prevent developer tools
  const preventDevTools = useCallback(
    (e: KeyboardEvent) => {
      if (strictModeActive && quizStarted) {
        if (
          e.key === "F12" ||
          (e.ctrlKey &&
            e.shiftKey &&
            (e.key === "I" || e.key === "J" || e.key === "C")) ||
          (e.ctrlKey && e.key === "u")
        ) {
          e.preventDefault();
          reportViolation("dev-tools", "Developer tools access attempted");
        }
      }
    },
    [strictModeActive, quizStarted, reportViolation]
  );

  // STRICT MODE: Monitor fullscreen - FIXED
  const monitorFullscreen = useCallback(() => {
    if (strictModeActive && quizStarted && !document.fullscreenElement) {
      reportViolation("fullscreen-exit", "Fullscreen exited");
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log("Fullscreen request failed:", err);
          reportViolation("fullscreen-exit", "Fullscreen re-entry failed");
        });
      }
    }
  }, [strictModeActive, quizStarted, reportViolation]);

  // Apply strict mode restrictions
  useEffect(() => {
    if (strictModeActive && quizStarted) {
      console.log("🔒 STRICT MODE ACTIVATED");

      document.addEventListener("keydown", preventAllKeys, true);
      document.addEventListener("contextmenu", preventContextMenu, true);
      window.addEventListener("beforeunload", preventTabSwitch);
      document.addEventListener("keydown", preventDevTools, true);
      document.addEventListener("fullscreenchange", monitorFullscreen);

      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log("Fullscreen not supported:", err);
        });
      }

      return () => {
        console.log("🔓 STRICT MODE DEACTIVATED");
        document.removeEventListener("keydown", preventAllKeys, true);
        document.removeEventListener("contextmenu", preventContextMenu, true);
        window.removeEventListener("beforeunload", preventTabSwitch);
        document.removeEventListener("keydown", preventDevTools, true);
        document.removeEventListener("fullscreenchange", monitorFullscreen);
      };
    }
  }, [
    strictModeActive,
    quizStarted,
    preventAllKeys,
    preventContextMenu,
    preventTabSwitch,
    preventDevTools,
    monitorFullscreen,
  ]);

  // Timer
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
    console.log("🚨 Emergency exit requested");
    setShowAdminInput(true);
  };

  const handleAdminCodeSubmit = () => {
    if (adminCode === "mini-fcmb") {
      console.log("✅ Admin code accepted - Exiting quiz");
      setShowAdminInput(false);
      setQuizStarted(false);
      // Safely exit fullscreen
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.log("Error exiting fullscreen:", err);
        });
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

  // FIXED: Calculate results without fullscreen errors
  const calculateResults = () => {
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / quiz.questions.length) * quiz.maxScore;
    const finalScore = Math.round(score);

    setFinalScore(finalScore);

    // Safely exit fullscreen - FIXED
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.log("Error exiting fullscreen:", err);
      });
    }

    setShowScoreModal(true);

    // Submit the quiz results immediately
    onSubmit(quiz.id, finalScore, quiz.maxScore);
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

  // FIXED: Properly handle score modal close
  const handleScoreModalClose = () => {
    console.log("🎯 handleScoreModalClose called");
    setShowScoreModal(false);
    setQuizStarted(false);

    // Ensure we're out of fullscreen
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch((err) => {
        console.log("Error exiting fullscreen:", err);
      });
    }

    // Close the entire quiz interface
    onClose();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const answeredQuestions = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;
  const currentQuestionData = quiz.questions[currentQuestion];

  // Show score modal if quiz is completed - FIXED
  if (showScoreModal) {
    console.log("🎯 Rendering ScoreDisplayModal");
    return (
      <ScoreDisplayModal
        score={finalScore}
        maxScore={quiz.maxScore}
        onClose={handleScoreModalClose}
      />
    );
  }

  // Show admin input for emergency exit
  if (showAdminInput) {
    return (
      <div className="modal-overlay">
        <div className="modal-content small-modal">
          <div className="modal-header">
            <Lock size={24} />
            <h2>Emergency Exit - Admin Required</h2>
            <button
              className="close-btn"
              onClick={() => setShowAdminInput(false)}
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
            <p className="warning-text">
              Exiting without completing will not save your progress.
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="action-btn cancel"
              onClick={() => setShowAdminInput(false)}
            >
              Cancel
            </button>
            <button
              className="action-btn primary"
              onClick={handleAdminCodeSubmit}
            >
              Submit Code
            </button>
          </div>
        </div>
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

  // Main quiz interface (keep your existing JSX)
  return (
    <div className="quiz-interface">
      {/* Violation Warning */}
      {showViolationWarning && (
        <div className="violation-warning">
          <AlertTriangle size={20} />
          <span>
            VIOLATION! {4 - violationAttempts} attempts remaining before
            auto-submission.
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
          <div className="question-header">
            <h2>{currentQuestionData.text}</h2>
            <button
              className={`flag-btn ${
                flagged.includes(currentQuestion) ? "flagged" : ""
              }`}
              onClick={() => handleFlagQuestion(currentQuestion)}
            >
              {flagged.includes(currentQuestion)
                ? "🚩 Flagged"
                : "🏴 Flag Question"}
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
                <span className="option-text">{option}</span>
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

          <div className="progress-info">
            <span>
              Answered: {answeredQuestions}/{totalQuestions}
            </span>
            {flagged.length > 0 && (
              <span className="flagged-count">🚩 {flagged.length}</span>
            )}
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
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
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
        .timer-display {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #dc2626;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
        }
        .emergency-exit {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }
        .emergency-exit:hover {
          background: #d97706;
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
        .question-indicator:hover {
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
          border: 2px solid #334155;
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
        .flag-btn:hover {
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
        .option-btn:hover {
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
        .nav-btn.submit:hover {
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
        .action-btn, .modal-btn {
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

// Main Student Dashboard Component - FIXED
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

  // Enhanced students with class information
  const enhancedStudents = useMemo(() => {
    return students.map((student) => ({
      ...student,
      classId: "default-class",
      className: "Your Class",
    }));
  }, [students]);

  // User info
  const [userInfo, setUserInfo] = useState({
    fullName: "Student Name",
    firstName: "Student",
    userInitial: "S",
    email: "student@example.com",
  });

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

  useEffect(() => {
    console.log("🔄 StudentDashboard - Setting up auth");
    const unsubscribe = initializeAuth();
    return () => {
      console.log("🧹 StudentDashboard - Cleaning up auth");
      unsubscribe();
    };
  }, [initializeAuth]);

  // Initialize online status and working hours
  useEffect(() => {
    const today = new Date().toDateString();
    const lastOnlineDate = localStorage.getItem("student-last-online-date");
    const savedOnlineStartTime = localStorage.getItem(
      "student-online-start-time"
    );

    if (lastOnlineDate === today && savedOnlineStartTime) {
      setOnlineStartTime(new Date(savedOnlineStartTime));
    } else {
      const startTime = new Date();
      setOnlineStartTime(startTime);
      localStorage.setItem("student-last-online-date", today);
      localStorage.setItem(
        "student-online-start-time",
        startTime.toISOString()
      );
    }

    initializeWorkingHours();
  }, []);

  // Load quizzes from localStorage
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

  // Initialize working hours function
  const initializeWorkingHours = useCallback(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const todayIndex = (today.getDay() + 6) % 7;

    const savedWorkingHours = localStorage.getItem("student-working-hours");

    if (savedWorkingHours) {
      const parsedHours = JSON.parse(savedWorkingHours);
      const lastUpdated = localStorage.getItem(
        "student-working-hours-last-updated"
      );
      const todayStr = today.toDateString();

      if (lastUpdated !== todayStr) {
        const updatedHours = parsedHours.map(
          (day: WorkingHoursData, index: number) =>
            index === todayIndex
              ? { ...day, minutes: 1, online: true, startTime: new Date() }
              : day
        );
        setWorkingHours(updatedHours);
        localStorage.setItem("student-working-hours-last-updated", todayStr);
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
      localStorage.setItem(
        "student-working-hours-last-updated",
        today.toDateString()
      );
    }
  }, []);

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

  // Quiz functions
  const handleStartQuiz = (quiz: Quiz) => {
    if (quiz.status !== "active") return;

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
  };

  // FIXED: Proper quiz close function
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
        label: "Submitted",
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
      await signOutUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
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
        (sum, sub) => sum + (sub.score || 0) / sub.maxScore,
        0
      ) / submittedQuizzes.length;

    return Math.round(averageScore * 100);
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
    {
      id: "classmates",
      label: "Classmates",
      icon: Users,
      Hash: "#group-chats",
    },
    { id: "quizzes", label: "Quizzes", icon: FileText },
  ];

  // Upcoming classes and quizzes
  const upcomingClasses = useMemo(() => {
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
  }, [quizzes]);

  const firstName = userInfo.firstName;
  const fullName = userInfo.fullName;
  const email = userInfo.email;

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
        showQuizInstructions || quizInProgress ? "modal-open" : ""
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
              Online - Active Student
            </span>
            <button className="follow-btn">Student</button>
          </div>

          <div className="header-actions">
            <button className="icon-btn">
              <Search size={20} />
            </button>
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <button className="get-in-touch" onClick={handleLogout}>
              <LogOut size={16} />
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
                <div className="student-info">
                  <strong>{firstName}</strong>
                  <span>Student</span>
                </div>
              </div>
              <div className="copyright">© SXaint Student</div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main
          className={`main-content ${
            showQuizInstructions || quizInProgress ? "blurred" : ""
          }`}
        >
          <div className="welcome">
            <h1>Welcome back, {firstName}!</h1>
            <p>
              {dayStr} • {todayStr} • {timeStr}
            </p>
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
                <h3>Available Quizzes ({quizzes.length})</h3>
                <a href="#" className="view-all">
                  All quizzes
                </a>
              </div>
              <div className="quizzes-grid">
                {quizzes.length === 0 ? (
                  <div className="empty-state">
                    <FileText size={48} color="#6b7280" />
                    <h3>No quizzes available</h3>
                    <p>Your teacher hasn't uploaded any quizzes yet.</p>
                  </div>
                ) : (
                  quizzes.map((quiz) => {
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
        <div
          className={`profile-card ${
            showQuizInstructions || quizInProgress ? "blurred" : ""
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
          existingSubmission={quizSubmissions[selectedQuiz.id]}
          strictModeActive={quizInProgress}
          studentName={userInfo.fullName}
          studentId={user?.uid || "unknown"}
        />
      )}

      {/* Include all CSS styles - keep your existing CSS */}
      <style>{`
        /* Your existing CSS styles here - they are correct */
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
