// app/teachers/page.tsx (or components/TeacherDashboard.tsx)
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
  Trash2,
  CloudUpload,
  Image as ImageIcon,
  Edit3,
  Play,
  Calendar as CalendarIcon,
} from "lucide-react";
import logo from "../assets/logo.png";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import { useLiveDate, useCalendar } from "../hooks/useDateUtils";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
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
  duration: number; // in minutes
  scheduledDate: string; // ISO string
  scheduledTime: string; // HH:mm format
  status: "upcoming" | "active" | "expired";
  totalDuration: number; // duration + 10 minutes buffer
}

interface WorkingHoursData {
  day: string;
  hours: number;
  online: boolean;
}

/* ------------------------------------------------------------------ */
/*  Quiz Name Modal Component                                         */
/* ------------------------------------------------------------------ */
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

function QuizNameModal({
  isOpen,
  onClose,
  onSave,
  questions,
}: QuizNameModalProps) {
  const [quizName, setQuizName] = useState("");
  const [duration, setDuration] = useState(30); // default 30 minutes
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split("T")[0]);

    // Set default time to 09:00
    setScheduledTime("09:00");
  }, []);

  const handleSave = () => {
    if (quizName.trim() && scheduledDate && scheduledTime) {
      onSave(quizName.trim(), duration, scheduledDate, scheduledTime);
      setQuizName("");
      setDuration(30);
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

      <style jsx>{`
        .modal-overlay {
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

        .small-modal {
          max-width: 500px;
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .modal-content::-webkit-scrollbar {
          display: none;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 32px 0;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
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
        }

        .close-btn:hover {
          background: #f3f4f6;
        }

        .modal-body {
          padding: 0 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .text-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .text-input:focus {
          outline: none;
          border-color: #4f46e5;
        }

        .form-group small {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .quiz-summary {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          margin-top: 24px;
        }

        .quiz-summary h4 {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
        }

        .quiz-summary p {
          font-size: 14px;
          color: #6b7280;
          margin: 8px 0;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 24px 32px 32px;
          border-top: 1px solid #e5e7eb;
          gap: 12px;
        }

        .action-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .cancel {
          background: none;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .save {
          background: #4f46e5;
          color: white;
        }

        .save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CreateQuizModal Component                                         */
/* ------------------------------------------------------------------ */
interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveQuiz: (questions: Question[]) => void;
  editingQuiz?: Quiz | null;
}

function CreateQuizModal({
  isOpen,
  onClose,
  onSaveQuiz,
  editingQuiz,
}: CreateQuizModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize with empty question when creating new quiz
  useEffect(() => {
    if (isOpen && !editingQuiz) {
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

  // Load editing quiz questions
  useEffect(() => {
    if (editingQuiz && isOpen) {
      setQuestions(editingQuiz.questions);
      setCurrentQuestionIndex(0);
    }
  }, [editingQuiz, isOpen]);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: questions.length + 1,
      text: "",
      image: null,
      imageUrl: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    };
    setQuestions([...questions, newQuestion]);
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
    if (file) {
      const newQuestions = [...questions];
      newQuestions[currentQuestionIndex].image = file;
      newQuestions[currentQuestionIndex].imageUrl = URL.createObjectURL(file);
      setQuestions(newQuestions);
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

      <style jsx>{`
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
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .modal-content::-webkit-scrollbar {
          display: none;
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
        }

        .close-btn:hover {
          background: #f3f4f6;
        }

        .modal-body {
          padding: 0 32px;
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
          min-height: 80px;
          transition: border-color 0.2s;
        }

        .question-textarea:focus {
          outline: none;
          border-color: #4f46e5;
        }

        .image-upload-section {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
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
        }

        .image-upload-area {
          padding: 40px 20px;
          text-align: center;
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
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          background: #f9fafb;
        }

        .option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .option-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .correct-answer-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .correct-radio {
          margin: 0;
        }

        .correct-answer-selector label {
          font-size: 12px;
          color: #059669;
          font-weight: 600;
          margin: 0;
          cursor: pointer;
        }

        .option-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .option-input:focus {
          outline: none;
          border-color: #4f46e5;
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
          gap: 16px;
        }

        .footer-left,
        .footer-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-btn {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .remove-question-btn {
          background: none;
          border: 1px solid #ef4444;
          color: #ef4444;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .add-question-btn {
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .save {
          background: #4f46e5;
          color: white;
        }

        @media (max-width: 768px) {
          .modal-footer {
            flex-direction: column;
            align-items: stretch;
          }

          .footer-left,
          .footer-right {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ClassListPanel Component                                          */
/* ------------------------------------------------------------------ */
interface ClassListPanelProps {
  students: Student[];
  isOpen: boolean;
  toggle: () => void;
  loading: boolean;
}

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
          {isOpen ? "Collapse" : "Expand"}
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
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
export default function TeacherDashboard() {
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

  const {
    user,
    teacherClasses,
    students,
    loading,
    error,
    initializeAuth,
    refreshStudents,
    signOutUser,
  } = useFirebaseStore();

  /* --------------------- AUTH INITIALIZATION --------------------- */
  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [initializeAuth]);

  /* --------------------- PERSIST QUIZZES TO LOCALSTORAGE --------------------- */
  useEffect(() => {
    // Load quizzes from localStorage
    const savedQuizzes = localStorage.getItem("teacher-quizzes");
    if (savedQuizzes) {
      setQuizzes(JSON.parse(savedQuizzes));
    }

    // Load working hours from localStorage
    const savedWorkingHours = localStorage.getItem("teacher-working-hours");
    if (savedWorkingHours) {
      setWorkingHours(JSON.parse(savedWorkingHours));
    } else {
      // Initialize working hours for the week
      initializeWorkingHours();
    }
  }, []);

  useEffect(() => {
    // Save quizzes to localStorage whenever quizzes change
    localStorage.setItem("teacher-quizzes", JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    // Save working hours to localStorage whenever they change
    localStorage.setItem("teacher-working-hours", JSON.stringify(workingHours));
  }, [workingHours]);

  /* --------------------- INITIALIZE WORKING HOURS --------------------- */
  const initializeWorkingHours = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

    const hoursData = days.map((day, index) => {
      // Convert index to match getDay() format (0 = Sunday)
      const dayIndex = (index + 1) % 7;
      const isToday = dayIndex === today;

      return {
        day,
        hours: isToday ? 4 : 0, // Start with 4 hours for today if teacher is online
        online: isToday,
      };
    });

    setWorkingHours(hoursData);
  };

  /* --------------------- UPDATE WORKING HOURS IN REAL-TIME --------------------- */
  useEffect(() => {
    const updateTodayHours = () => {
      const today = new Date().getDay();
      const todayIndex = (today + 6) % 7; // Convert to our array index (0 = Monday)

      setWorkingHours((prev) =>
        prev.map((day, index) => {
          if (index === todayIndex) {
            // Increment hours by 0.1 (6 minutes) each time this runs
            return {
              ...day,
              hours: Math.min(24, day.hours + 0.1),
              online: true,
            };
          }
          return day;
        })
      );
    };

    // Update every 6 minutes (360000 ms)
    const interval = setInterval(updateTodayHours, 360000);

    // Initial update
    updateTodayHours();

    return () => clearInterval(interval);
  }, []);

  /* --------------------- UPDATE QUIZ STATUSES IN REAL-TIME --------------------- */
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

    // Update every minute
    const interval = setInterval(updateQuizStatuses, 60000);

    // Initial update
    updateQuizStatuses();

    return () => clearInterval(interval);
  }, []);

  /* --------------------- LOGOUT HANDLER --------------------- */
  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  /* --------------------- QUIZ MANAGEMENT --------------------- */
  const handleSaveQuestions = (questions: Question[]) => {
    setTempQuestions(questions);
    if (editingQuiz) {
      // Update existing quiz
      const updatedQuizzes = quizzes.map((quiz) =>
        quiz.id === editingQuiz.id ? { ...quiz, questions } : quiz
      );
      setQuizzes(updatedQuizzes);
      setEditingQuiz(null);
      setQuizModalOpen(false);
    } else {
      // New quiz - open name modal
      setQuizNameModalOpen(true);
    }
  };

  const handleSaveQuizWithName = (
    name: string,
    duration: number,
    scheduledDate: string,
    scheduledTime: string
  ) => {
    const totalDuration = duration + 10; // Add 10 minutes buffer

    // Calculate status based on current time
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

    setQuizzes([newQuiz, ...quizzes]);
    setQuizNameModalOpen(false);
    setQuizModalOpen(false);
    setTempQuestions([]);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizModalOpen(true);
  };

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
        return "Start";
      case "upcoming":
        return "Upcoming";
      case "expired":
        return "Expired";
      default:
        return "Unknown";
    }
  };

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

  /* --------------------- PROGRESS --------------------- */
  const progressPercent = useMemo(() => {
    if (!students || students.length === 0) return 0;
    const total = students.reduce((sum, s) => sum + (s.progress ?? 0), 0);
    return Math.round(total / students.length);
  }, [students]);

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

  /* --------------------- UPCOMING CLASSES --------------------- */
  const upcomingClasses = useMemo(() => {
    // Combine teacher classes with quizzes for upcoming classes
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
      .map((quiz, i) => ({
        id: `quiz-${quiz.id}`,
        time: quiz.scheduledTime,
        name: quiz.name,
        location: "Online Exam",
        type: "quiz" as const,
        status:
          quiz.status === "active"
            ? ("active" as const)
            : ("upcoming" as const),
      }));

    return [...classItems, ...quizItems].slice(0, 5); // Show max 5 items
  }, [teacherClasses, quizzes]);

  const firstName = user?.displayName?.split(" ")[0] || "Teacher";
  const fullName = user?.displayName || "Teacher Name";
  const email = user?.email || "email@example.com";

  /* --------------------- LOADING / ERROR --------------------- */
  if (loading) {
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
        <button onClick={refreshStudents}>Retry</button>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  return (
    <div
      className={`app ${
        quizModalOpen || quizNameModalOpen ? "modal-open" : ""
      }`}
    >
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

            <button className="get-in-touch" onClick={handleLogout}>
              Logout
            </button>
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

        {/* ====================== MAIN CONTENT ====================== */}
        <main
          className={`main-content ${
            quizModalOpen || quizNameModalOpen ? "blurred" : ""
          }`}
        >
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

          {/* TOP GRID */}
          <div className="top-grid">
            {/* Working Hours */}
            <div className="card working-hours">
              <div className="card-header">
                <h3>Working Hours</h3>
                <span>This Week</span>
              </div>
              <div className="bar-chart">
                {workingHours.map((d, i) => (
                  <div key={i} className="bar-item">
                    <div
                      className="bar"
                      style={{
                        height: `${Math.min(100, (d.hours / 24) * 100)}%`,
                        backgroundColor: d.online ? "#10b981" : "#e5e7eb",
                      }}
                    ></div>
                    <span>{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="total">
                Total{" "}
                <strong>
                  {Math.round(
                    workingHours.reduce((sum, day) => sum + day.hours, 0)
                  )}
                  h
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

            {/* My Students */}
            <ClassListPanel
              students={students}
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

          {/* BOTTOM GRID */}
          <div className="bottom-grid">
            {/* Student Tests */}
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
                              <i className="bx bx-pencil"></i>
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

            {/* Upcoming Classes */}
            <div className="card upcoming-classes">
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

        {/* ====================== PROFILE CARD ====================== */}
        <div
          className={`profile-card ${
            quizModalOpen || quizNameModalOpen ? "blurred" : ""
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

      {/* ====================== MODALS ====================== */}
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

      {/* ------------------------------------------------------------------ */}
      {/*  ALL STYLES                                                        */}
      {/* ------------------------------------------------------------------ */}
      <style jsx>{`
        .app.modal-open {
          overflow: hidden;
        }

        .main-content.blurred,
        .profile-card.blurred {
          filter: blur(4px);
          pointer-events: none;
          user-select: none;
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
        .bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          height: 140px;
          margin-top: 20px;
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
          min-height: 20px;
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

        /* Boxicons for edit icon */
        .bx-pencil {
          font-size: 16px;
        }

        /* RESPONSIVE MEDIA QUERIES */
        @media (min-width: 1400px) {
          .sidebar {
            width: 340px;
          }
          .main-content {
            margin-left: 340px;
          }
        }
        @media (max-width: 1399px) {
          /* ... */
        }
        @media (max-width: 1199px) {
          /* ... */
        }
        @media (max-width: 991px) {
          /* ... */
        }
        @media (max-width: 767px) {
          /* ... */
        }
        @media (max-width: 575px) {
          /* ... */
        }
      `}</style>
    </div>
  );
}
