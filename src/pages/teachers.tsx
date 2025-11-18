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
} from "lucide-react";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import { useLiveDate, useCalendar } from "../hooks/useDateUtils";
import { useNavigate } from "react-router-dom";

// Types
interface Student {
  id: string;
  first: string;
  last: string;
  email: string;
  progress: number;
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
}

interface WorkingHoursData {
  day: string;
  minutes: number;
  online: boolean;
  startTime?: Date;
}

interface CACategory {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  isActive: boolean;
}

interface CAResult {
  studentId: string;
  categoryId: string;
  score: number;
  maxScore: number;
  uploadedBy: string;
  uploadedAt: Date;
  remarks?: string;
}

interface TheoryResult {
  studentId: string;
  examId: string;
  score: number;
  maxScore: number;
  uploadedBy: string;
  uploadedAt: Date;
  gradedBy: string;
  comments?: string;
}

interface FinalGrade {
  studentId: string;
  subject: string;
  term: string;
  session: string;
  cbtScore: number;
  caScores: { [category: string]: number };
  theoryScore: number;
  totalScore: number;
  percentage: number;
  grade: "A" | "B" | "C" | "D" | "E" | "F";
  positionInClass?: number;
  remark: string;
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
      id: "live-monitoring",
      label: "Live Exam Monitoring",
      icon: Eye,
      description: "Real-time tracking of active quizzes",
      color: "#10b981",
    },
    {
      id: "upload-ca",
      label: "Upload CA Scores",
      icon: Upload,
      description: "Bulk upload continuous assessment scores",
      color: "#3b82f6",
    },
    {
      id: "upload-theory",
      label: "Upload Theory Results",
      icon: BookOpen,
      description: "Upload theory exam scores",
      color: "#8b5cf6",
    },
    {
      id: "manage-ca",
      label: "Manage CA Categories",
      icon: Award,
      description: "Set up CA categories and weights",
      color: "#f59e0b",
    },
    {
      id: "view-grades",
      label: "View Final Grades",
      icon: BarChart3,
      description: "See calculated grades and reports",
      color: "#ef4444",
    },
    {
      id: "export-reports",
      label: "Export Reports",
      icon: Download,
      description: "Download report cards and analytics",
      color: "#06b6d4",
    },
    {
      id: "student-performance",
      label: "Student Performance",
      icon: Users2,
      description: "Detailed student analytics",
      color: "#84cc16",
    },
    {
      id: "bulk-upload",
      label: "Bulk Upload Scores",
      icon: FileSpreadsheet,
      description: "Upload scores via CSV template",
      color: "#f97316",
    },
    {
      id: "grading-system",
      label: "Grading System",
      icon: Calculator,
      description: "Configure grading scales",
      color: "#ec4899",
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

        <div className="performance-menu-footer">
          <div className="quick-stats">
            <div className="stat">
              <span className="stat-value">0</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat">
              <span className="stat-value">0</span>
              <span className="stat-label">Active Tests</span>
            </div>
            <div className="stat">
              <span className="stat-value">0</span>
              <span className="stat-label">Pending Grades</span>
            </div>
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
}

const UploadCAModal: React.FC<UploadCAModalProps> = ({
  isOpen,
  onClose,
  students,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [uploadMethod, setUploadMethod] = useState<"manual" | "csv">("manual");

  const caCategories = [
    { id: "1st-ca", name: "1st CA Test", maxScore: 20 },
    { id: "2nd-ca", name: "2nd CA Test", maxScore: 20 },
    { id: "3rd-ca", name: "3rd CA Test", maxScore: 20 },
    { id: "assignment", name: "Assignment", maxScore: 10 },
    { id: "project", name: "Project", maxScore: 10 },
    { id: "practical", name: "Practical", maxScore: 10 },
  ];

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

  const handleSaveScores = () => {
    // Implement save logic
    console.log("Saving scores:", scores);
    onClose();
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
                <label>Select CA Category</label>
                <select
                  className="text-input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Choose category...</option>
                  {caCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} (Max: {cat.maxScore})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCategory && (
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
                  {students.map((student) => (
                    <div key={student.id} className="score-row">
                      <span>
                        {student.first} {student.last}
                      </span>
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
            disabled={!selectedCategory && uploadMethod === "manual"}
          >
            Save Scores
          </button>
        </div>
      </div>
    </div>
  );
};

// Live Monitoring Modal Component
interface LiveMonitoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeQuizzes: Quiz[];
  students: Student[];
}

const LiveMonitoringModal: React.FC<LiveMonitoringModalProps> = ({
  isOpen,
  onClose,
  activeQuizzes,
  students,
}) => {
  const [monitoringData, setMonitoringData] = useState<any[]>([]);

  // Simulate live data
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setMonitoringData(
          students.map((student) => ({
            studentId: student.id,
            studentName: `${student.first} ${student.last}`,
            progress: Math.floor(Math.random() * 100),
            timeSpent: `${Math.floor(Math.random() * 30)}:${Math.floor(
              Math.random() * 60
            )
              .toString()
              .padStart(2, "0")}`,
            status: Math.random() > 0.2 ? "active" : "submitted",
            lastActivity: new Date(),
          }))
        );
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content large-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Live Exam Monitoring</h2>
            <p>Real-time tracking of active quizzes</p>
          </div>
          <div className="live-indicator">
            <div className="live-dot"></div>
            Live
          </div>
        </div>

        <div className="modal-body">
          <div className="monitoring-stats">
            <div className="stat-card">
              <span className="stat-number">{activeQuizzes.length}</span>
              <span className="stat-label">Active Quizzes</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {monitoringData.filter((d) => d.status === "active").length}
              </span>
              <span className="stat-label">Students Active</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {monitoringData.filter((d) => d.status === "submitted").length}
              </span>
              <span className="stat-label">Submitted</span>
            </div>
          </div>

          <div className="students-monitoring">
            <h4>Student Progress</h4>
            <div className="monitoring-list">
              {monitoringData.map((data) => (
                <div key={data.studentId} className="monitoring-item">
                  <div className="student-info">
                    <div className="student-avatar-small">
                      {data.studentName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <strong>{data.studentName}</strong>
                      <div className="student-meta">
                        <span>Time: {data.timeSpent}</span>
                        <span className={`status ${data.status}`}>
                          {data.status === "active"
                            ? "In Progress"
                            : "Submitted"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="progress-display">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${data.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{data.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="action-btn export-btn">
            <Download size={16} />
            Export Report
          </button>
          <button className="action-btn primary" onClick={onClose}>
            Close Monitoring
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
    scheduledTime: string
  ) => void;
  questions: Question[];
}

const QuizNameModal: React.FC<QuizNameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  questions,
}) => {
  const [quizName, setQuizName] = useState("");
  const [duration, setDuration] = useState(30);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split("T")[0]);
      setScheduledTime("09:00");
    }
  }, [isOpen]);

  const handleSave = () => {
    if (quizName.trim() && scheduledDate && scheduledTime) {
      onSave(quizName.trim(), duration, scheduledDate, scheduledTime);
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
            <input
              type="time"
              className="text-input"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          <div className="quiz-summary">
            <h4>Quiz Summary</h4>
            <p>
              <strong>Questions:</strong> {questions.length}
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
            disabled={!quizName.trim() || !scheduledDate || !scheduledTime}
          >
            Save Quiz
          </button>
        </div>
      </div>
    </div>
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
    if (isOpen) {
      if (editingQuiz) {
        setQuestions(editingQuiz.questions);
      } else {
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
      }
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
            <button className="action-btn save" onClick={handleSave}>
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
}

const ClassListPanel: React.FC<ClassListPanelProps> = ({
  students,
  isOpen,
  toggle,
  loading,
}) => {
  return (
    <div className="card group-chats" id="group-chats">
      <div className="card-header">
        <h3>My Students ({students.length})</h3>
        <button onClick={toggle} className="view-all">
          {isOpen ? (
            <i
              className="bx bx-expand"
              style={{
                fontSize: "16px",
                color: "#000",
                backgroundColor: "#fff",
                border: "1px solid #fff !important",
              }}
            />
          ) : (
            <i
              className="bx bx-collapse"
              style={{
                fontSize: "16px",
                color: "#000",
                backgroundColor: "#fff",
                border: "1px solid #fff !important",
              }}
            />
          )}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading students…</div>
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

// Main Teacher Dashboard Component
const TeacherDashboard: React.FC = () => {
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
  const [selectedFeature, setSelectedFeature] = useState<string>("");

  const {
    user,
    teacherClasses,
    students,
    loading,
    error,
    authInitialized,
    initializeAuth,
    signOutUser,
  } = useFirebaseStore();

  // Auth Initialization
  // CORRECTED VERSION - Only initialize if not already initialized
  // FIXED: Always return a cleanup function
  useEffect(() => {
    console.log("🔄 TeacherDashboard - Setting up auth");

    // Initialize auth - the store handles duplicate initializations
    const unsubscribe = initializeAuth();

    return () => {
      console.log("🧹 TeacherDashboard - Cleaning up auth");
      unsubscribe();
    };
  }, [initializeAuth]);

  // Initialize online status and working hours
  useEffect(() => {
    const today = new Date().toDateString();
    const lastOnlineDate = localStorage.getItem("teacher-last-online-date");
    const savedOnlineStartTime = localStorage.getItem(
      "teacher-online-start-time"
    );

    if (lastOnlineDate === today && savedOnlineStartTime) {
      setOnlineStartTime(new Date(savedOnlineStartTime));
    } else {
      const startTime = new Date();
      setOnlineStartTime(startTime);
      localStorage.setItem("teacher-last-online-date", today);
      localStorage.setItem(
        "teacher-online-start-time",
        startTime.toISOString()
      );
    }

    initializeWorkingHours();
  }, []);

  // Load quizzes from localStorage
  useEffect(() => {
    const savedQuizzes = localStorage.getItem("teacher-quizzes");
    if (savedQuizzes) {
      try {
        const parsedQuizzes = JSON.parse(savedQuizzes);
        setQuizzes(parsedQuizzes);
      } catch (error) {
        console.error("Error loading quizzes from localStorage:", error);
        setQuizzes([]);
      }
    }
  }, []);

  // Save quizzes to localStorage
  useEffect(() => {
    localStorage.setItem("teacher-quizzes", JSON.stringify(quizzes));
  }, [quizzes]);

  // Save working hours to localStorage
  useEffect(() => {
    if (workingHours.length > 0) {
      localStorage.setItem(
        "teacher-working-hours",
        JSON.stringify(workingHours)
      );
    }
  }, [workingHours]);

  // Initialize working hours function
  const initializeWorkingHours = useCallback(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const todayIndex = (today.getDay() + 6) % 7;

    const savedWorkingHours = localStorage.getItem("teacher-working-hours");

    if (savedWorkingHours) {
      const parsedHours = JSON.parse(savedWorkingHours);
      const lastUpdated = localStorage.getItem("working-hours-last-updated");
      const todayStr = today.toDateString();

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
      localStorage.setItem("working-hours-last-updated", today.toDateString());
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
      case "live-monitoring":
        setLiveMonitoringModalOpen(true);
        break;
      case "upload-ca":
        setUploadCAModalOpen(true);
        break;
      case "upload-theory":
        // Open theory upload modal
        break;
      case "manage-ca":
        // Open CA categories management
        break;
      case "view-grades":
        // Open grades view
        break;
      case "export-reports":
        // Handle export
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
      await signOutUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Quiz management functions
  const handleSaveQuestions = useCallback(
    (questions: Question[]) => {
      setTempQuestions(questions);
      if (editingQuiz) {
        const updatedQuizzes = quizzes.map((quiz) =>
          quiz.id === editingQuiz.id ? { ...quiz, questions } : quiz
        );
        setQuizzes(updatedQuizzes);
        setEditingQuiz(null);
        setQuizModalOpen(false);
      } else {
        setQuizNameModalOpen(true);
      }
    },
    [editingQuiz, quizzes]
  );

  const handleSaveQuizWithName = useCallback(
    (
      name: string,
      duration: number,
      scheduledDate: string,
      scheduledTime: string
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

      const newQuiz: Quiz = {
        id: Date.now().toString(),
        name,
        questions: tempQuestions,
        duration,
        scheduledDate,
        scheduledTime,
        totalDuration,
        status,
      };

      setQuizzes((prev) => [newQuiz, ...prev]);
      setQuizNameModalOpen(false);
      setQuizModalOpen(false);
      setTempQuestions([]);
    },
    [tempQuestions]
  );

  const handleEditQuiz = useCallback((quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizModalOpen(true);
  }, []);

  const handleDeleteQuiz = useCallback((quizId: string) => {
    if (confirm("Are you sure you want to delete this quiz?")) {
      setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));
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
    if (!students || students.length === 0) return 0;
    const total = students.reduce((sum, s) => sum + (s.progress ?? 0), 0);
    return Math.round(total / students.length);
  }, [students]);

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
      name: c.name,
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
        liveMonitoringModalOpen
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
              Online - Available for work
            </span>
            <button className="follow-btn">Follow</button>
          </div>

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

            <button className="icon-btn">
              <Menu size={20} />
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
            liveMonitoringModalOpen
              ? "blurred"
              : ""
          }`}
        >
          <div className="welcome">
            <h1>Welcome back, {firstName}</h1>
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
              students={students}
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
                          <h4>{quiz.name}</h4>
                          <div className="test-actions">
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
            liveMonitoringModalOpen
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
            </div>
          </div>
          <button className="profile-arrow">
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Modals */}
      <CreateQuizModal
        isOpen={quizModalOpen}
        onClose={() => {
          setQuizModalOpen(false);
          setEditingQuiz(null);
        }}
        onSaveQuiz={handleSaveQuestions}
        editingQuiz={editingQuiz}
      />

      <QuizNameModal
        isOpen={quizNameModalOpen}
        onClose={() => setQuizNameModalOpen(false)}
        onSave={handleSaveQuizWithName}
        questions={tempQuestions}
      />

      <UploadCAModal
        isOpen={uploadCAModalOpen}
        onClose={() => setUploadCAModalOpen(false)}
        students={students}
      />

      <LiveMonitoringModal
        isOpen={liveMonitoringModalOpen}
        onClose={() => setLiveMonitoringModalOpen(false)}
        activeQuizzes={activeQuizzes}
        students={students}
      />

      <style jsx="true">{`
        /* Add all your CSS styles here */
        /* ... (include all the CSS styles from your original code) */

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

        .performance-menu-header .close-btn {
          position: absolute;
          top: 32px;
          right: 32px;
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

        .performance-menu-footer {
          padding: 24px 32px 32px;
          border-top: 1px solid #e5e7eb;
        }

        .quick-stats {
          display: flex;
          justify-content: space-around;
          text-align: center;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #4f46e5;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        /* Upload CA Modal Styles */
        .medium-modal {
          max-width: 600px;
        }

        .large-modal {
          max-width: 900px;
        }

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

        .score-input {
          width: 100px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          text-align: center;
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

        /* Live Monitoring Styles */
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
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }

        .stat-number {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: #4f46e5;
          margin-bottom: 4px;
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
          align-items: center;
          gap: 12px;
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
          color: #4f46e5;
          font-size: 14px;
        }

        .student-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .status.active {
          color: #10b981;
          font-weight: 600;
        }

        .status.submitted {
          color: #8b5cf6;
          font-weight: 600;
        }

        .progress-display {
          display: flex;
          align-items: center;
          gap: 12px;
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
          background: #10b981;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          min-width: 40px;
        }

        .performance-menu-wrapper {
          position: relative;
        }

        .performance-btn {
          position: relative;
        }

        .performance-btn::after {
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

        /* Add to existing responsive styles */
        @media (max-width: 768px) {
          .performance-menu-grid {
            grid-template-columns: 1fr;
          }

          .monitoring-stats {
            grid-template-columns: 1fr;
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
        }
        /* Add all your CSS styles here with proper scrollable containers */
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

        .small-modal {
          max-width: 500px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 32px 0;
          margin-bottom: 24px;
        }

        .modal-body {
          padding: 0 32px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 24px 32px 32px;
          border-top: 1px solid #e5e7eb;
          gap: 12px;
        }

        /* Scrollable containers */
        .test-list,
        .class-list,
        .students-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 400px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #c7d2fe transparent;
        }

        .test-list::-webkit-scrollbar,
        .class-list::-webkit-scrollbar,
        .students-list::-webkit-scrollbar {
          width: 6px;
        }

        .test-list::-webkit-scrollbar-track,
        .class-list::-webkit-scrollbar-track,
        .students-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .test-list::-webkit-scrollbar-thumb,
        .class-list::-webkit-scrollbar-thumb,
        .students-list::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 3px;
        }

        .test-list::-webkit-scrollbar-thumb:hover,
        .class-list::-webkit-scrollbar-thumb:hover,
        .students-list::-webkit-scrollbar-thumb:hover {
          background: #a5b4fc;
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
        /* Modal Content Styles */
        .modal-content {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
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

        /* Form Group Styles */
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

        /* Question Textarea */
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

        /* Image Upload Section */
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

        /* Options List Styles */
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Option Item Styles */
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

        /* Option Header Styles */
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

        /* Correct Answer Selector Styles */
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

        /* Option Input Styles */
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

        /* Modal Footer Styles */
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
          gap: 16px;
        }

        .footer-left,
        .footer-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Button Styles */
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

        .action-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
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

        /* Test Actions (Edit/Delete in quiz list) */
        .test-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .test-item:hover .test-actions {
          opacity: 1;
        }

        .edit-btn,
        .delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .edit-btn {
          color: #4f46e5;
        }

        .edit-btn:hover {
          background: #eef2ff;
        }

        .delete-btn {
          color: #ef4444;
        }

        .delete-btn:hover {
          background: #fef2f2;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .modal-content {
            margin: 20px;
            max-height: 95vh;
          }

          .modal-header {
            padding: 24px 24px 0;
          }

          .modal-body {
            padding: 0 24px;
          }

          .modal-footer {
            padding: 20px 24px 24px;
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .footer-left,
          .footer-right {
            justify-content: center;
          }

          .option-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .correct-answer-selector {
            align-self: flex-end;
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
          cursor: pointer;
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

        /* Working Hours Bar Chart Styles - MINUTES BASED */
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

        /* RESPONSIVE MEDIA QUERIES */
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
        }

        //save_container
        /* Save Quiz Modal Styles */
        .small-modal .modal-body {
          padding: 0 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Form Group Styles for Save Modal */
        .small-modal .form-group {
          margin-bottom: 0;
        }

        .small-modal .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .small-modal .text-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.2s;
          background: white;
          font-weight: 500;
        }

        .small-modal .text-input:focus {
          outline: none;
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .small-modal .text-input::placeholder {
          color: #9ca3af;
          font-weight: normal;
        }

        .small-modal .form-group small {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-top: 6px;
          font-style: italic;
        }

        /* Quiz Summary Styles */
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

        .quiz-summary p:last-child {
          margin-bottom: 0;
        }

        /* Date and Time Input Specific Styles */
        .small-modal input[type="date"],
        .small-modal input[type="time"] {
          appearance: none;
          -webkit-appearance: none;
          background: white;
          cursor: pointer;
        }

        .small-modal input[type="date"]:focus,
        .small-modal input[type="time"]:focus {
          border-color: #4f46e5;
        }

        /* Number Input Specific Styles */
        .small-modal input[type="number"] {
          appearance: textfield;
          -moz-appearance: textfield;
        }

        .small-modal input[type="number"]::-webkit-outer-spin-button,
        .small-modal input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Modal Footer for Save Modal */
        .small-modal .modal-footer {
          padding: 24px 32px 32px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: white;
        }

        /* Action Buttons for Save Modal */
        .small-modal .action-btn {
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          min-width: 100px;
        }

        .small-modal .action-btn.cancel {
          background: white;
          color: #374151;
          border: 2px solid #d1d5db;
        }

        .small-modal .action-btn.cancel:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }

        .small-modal .action-btn.save {
          background: #4f46e5;
          color: white;
          box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
        }

        .small-modal .action-btn.save:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
        }

        .small-modal .action-btn.save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Form Validation Styles */
        .small-modal .text-input:invalid:not(:focus):not(:placeholder-shown) {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .small-modal .text-input:valid:not(:focus):not(:placeholder-shown) {
          border-color: #10b981;
          background: #f0fdf4;
        }

        /* Responsive Design for Save Modal */
        @media (max-width: 640px) {
          .small-modal .modal-body {
            padding: 0 24px;
            gap: 20px;
          }

          .small-modal .modal-footer {
            padding: 20px 24px 24px;
            flex-direction: column;
          }

          .small-modal .action-btn {
            width: 100%;
            min-width: auto;
          }

          .quiz-summary {
            padding: 20px;
          }

          .quiz-summary p {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .quiz-summary p strong {
            min-width: auto;
          }
        }

        /* Loading State for Save Button */
        .small-modal .action-btn.save:disabled::after {
          content: "";
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 8px;
          display: inline-block;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Success State */
        .small-modal .action-btn.save.success {
          background: #10b981;
        }

        .small-modal .action-btn.save.success:hover {
          background: #059669;
        }

        /* Error State */
        .small-modal .error-message {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Info Tooltip Style */
        .form-group:has(.text-input:focus) ~ .quiz-summary {
          border-color: #4f46e5;
          background: #f8fafc;
        }

        /* Duration Input Container */
        .duration-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .duration-input-container::after {
          content: "minutes";
          position: absolute;
          right: 16px;
          color: #6b7280;
          font-size: 12px;
          font-weight: 500;
          pointer-events: none;
        }

        .small-modal input[type="number"] {
          padding-right: 80px;
        }

        /* Date and Time Container */
        .datetime-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 480px) {
          .datetime-container {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }

        /* Required Field Indicator */
        .small-modal .form-group label::after {
          content: " *";
          color: #ef4444;
        }

        /* Focus States for Accessibility */
        .small-modal .text-input:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1), 0 0 0 1px #4f46e5;
        }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;
