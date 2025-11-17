import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Lock,
} from "lucide-react";

const QuizDashboard: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);

  // Strict mode restrictions
  const [fullscreen, setFullscreen] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Prevent leaving the page
  const preventNavigation = useCallback(
    (e: BeforeUnloadEvent) => {
      if (quizStarted) {
        e.preventDefault();
        e.returnValue =
          "Are you sure you want to leave? Your quiz progress will be lost.";
        return e.returnValue;
      }
    },
    [quizStarted]
  );

  // Prevent right-click context menu
  const preventContextMenu = useCallback(
    (e: MouseEvent) => {
      if (quizStarted) {
        e.preventDefault();
      }
    },
    [quizStarted]
  );

  // Prevent keyboard shortcuts
  const preventShortcuts = useCallback(
    (e: KeyboardEvent) => {
      if (
        quizStarted &&
        (e.ctrlKey ||
          e.metaKey ||
          e.key === "F12" ||
          (e.altKey && e.key === "Tab") ||
          (e.ctrlKey && e.shiftKey && e.key === "I") ||
          (e.ctrlKey && e.shiftKey && e.key === "J") ||
          (e.ctrlKey && e.key === "U"))
      ) {
        e.preventDefault();
      }
    },
    [quizStarted]
  );

  useEffect(() => {
    if (quizStarted) {
      // Add event listeners for restrictions
      window.addEventListener("beforeunload", preventNavigation);
      window.addEventListener("contextmenu", preventContextMenu);
      window.addEventListener("keydown", preventShortcuts);

      // Try to enter fullscreen
      const enterFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            setFullscreen(true);
          }
        } catch (error) {
          console.log("Fullscreen not supported");
        }
      };
      enterFullscreen();

      return () => {
        window.removeEventListener("beforeunload", preventNavigation);
        window.removeEventListener("contextmenu", preventContextMenu);
        window.removeEventListener("keydown", preventShortcuts);
      };
    }
  }, [quizStarted, preventNavigation, preventContextMenu, preventShortcuts]);

  // Timer countdown
  useEffect(() => {
    if (quizStarted && timeLeft > 0) {
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
    }
  }, [quizStarted, timeLeft]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleFlagQuestion = (questionIndex: number) => {
    setFlagged((prev) =>
      prev.includes(questionIndex)
        ? prev.filter((q) => q !== questionIndex)
        : [...prev, questionIndex]
    );
  };

  const handleSubmitQuiz = () => {
    // Calculate results
    const totalQuestions = questions.length;
    const correctAnswers = Object.keys(answers).filter(
      (qIndex) => answers[parseInt(qIndex)] === "B" // Mock correct answer
    ).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Prepare result data
    const result = {
      score,
      totalQuestions,
      correctAnswers,
      wrongAnswers: totalQuestions - correctAnswers,
      timeSpent: formatTime(7200 - timeLeft),
      subject: subjectId || "Mathematics",
      answers: questions.map((question, index) => ({
        question: question.text,
        userAnswer: answers[index] || "Not answered",
        correctAnswer: "B", // Mock correct answer
        isCorrect: answers[index] === "B",
      })),
    };

    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }

    // Navigate to results page
    navigate(`/quiz/${subjectId}/results`, { state: { result } });
  };

  // Mock questions data
  const questions = [
    {
      id: 1,
      text: "Berapa panjang sisi AB dari segitiga di bawah ini?",
      type: "diagram",
      options: [
        { id: "A", value: "6√2" },
        { id: "B", value: "3√2" },
        { id: "C", value: "12√2" },
        { id: "D", value: "3" },
      ],
    },
    {
      id: 2,
      text: "Jika x² + 3x - 10 = 0, maka nilai x adalah...",
      type: "text",
      options: [
        { id: "A", value: "2 dan -5" },
        { id: "B", value: "-2 dan 5" },
        { id: "C", value: "2 dan 5" },
        { id: "D", value: "-2 dan -5" },
      ],
    },
    // Add more questions as needed
  ];

  if (!quizStarted) {
    return (
      <div className="quiz-instructions">
        <div className="instructions-container">
          <div className="instructions-header">
            <Lock size={48} />
            <h1>Quiz Instructions</h1>
            <p>Mathematics - Final Assessment</p>
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

            <div className="rules-list">
              <div className="rule-item">
                <div className="rule-icon">🚫</div>
                <div className="rule-text">
                  <strong>Cannot leave the page</strong>
                  <span>Closing the tab or browser will submit the quiz</span>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">🚫</div>
                <div className="rule-text">
                  <strong>No new tabs/windows</strong>
                  <span>Opening new tabs is restricted</span>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">🚫</div>
                <div className="rule-text">
                  <strong>Right-click disabled</strong>
                  <span>Context menu is not available</span>
                </div>
              </div>
              <div className="rule-item">
                <div className="rule-icon">🚫</div>
                <div className="rule-text">
                  <strong>Developer tools disabled</strong>
                  <span>F12 and other dev shortcuts are blocked</span>
                </div>
              </div>
            </div>

            <div className="quiz-info">
              <div className="info-item">
                <strong>Duration:</strong>
                <span>2 Hours</span>
              </div>
              <div className="info-item">
                <strong>Questions:</strong>
                <span>{questions.length}</span>
              </div>
              <div className="info-item">
                <strong>Subject:</strong>
                <span>Mathematics</span>
              </div>
            </div>
          </div>

          <div className="instructions-actions">
            <button
              className="back-btn"
              onClick={() => navigate("/quiz-subjects")}
            >
              <ChevronLeft size={20} />
              Back to Subjects
            </button>
            <button className="start-btn" onClick={handleStartQuiz}>
              Start Quiz
            </button>
          </div>
        </div>

        <style>{`
          .quiz-instructions {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .instructions-container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }

          .instructions-header {
            text-align: center;
            margin-bottom: 32px;
          }

          .instructions-header h1 {
            margin: 16px 0 8px 0;
            font-size: 2rem;
            color: #1e293b;
          }

          .instructions-header p {
            margin: 0;
            color: #64748b;
            font-size: 1.1rem;
          }

          .warning-section {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            text-align: center;
          }

          .warning-section h3 {
            margin: 8px 0;
            color: #d97706;
          }

          .rules-list {
            margin-bottom: 32px;
          }

          .rule-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .rule-item:last-child {
            border-bottom: none;
          }

          .rule-icon {
            font-size: 1.2rem;
          }

          .rule-text {
            flex: 1;
          }

          .rule-text strong {
            display: block;
            color: #1e293b;
            margin-bottom: 4px;
          }

          .rule-text span {
            color: #64748b;
            font-size: 0.9rem;
          }

          .quiz-info {
            background: #f8fafc;
            border-radius: 12px;
            padding: 20px;
          }

          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
          }

          .info-item:not(:last-child) {
            border-bottom: 1px solid #e2e8f0;
          }

          .instructions-actions {
            display: flex;
            gap: 16px;
            margin-top: 32px;
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
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .back-btn:hover {
            background: #e2e8f0;
          }

          .start-btn {
            flex: 2;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1.1rem;
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
      {/* Header */}
      <header className="quiz-header">
        <div className="header-left">
          <div className="quiz-logo">Q</div>
          <div className="quiz-info">
            <h1>Mathematics - Final Assessment</h1>
            <p>
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="header-right">
          <div className="timer-display">
            <Clock size={20} />
            <span className="timer">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Progress Navigation */}
      <div className="progress-nav">
        <div className="question-grid">
          {questions.map((_, index) => (
            <button
              key={index}
              className={`question-indicator ${
                index === currentQuestion ? "current" : ""
              } ${answers[index] ? "answered" : ""} ${
                flagged.includes(index) ? "flagged" : ""
              }`}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
              {flagged.includes(index) && <Flag size={12} />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="quiz-content">
        {/* Question Area */}
        <div className="question-area">
          <div className="question-header">
            <h2>{questions[currentQuestion].text}</h2>
            <button
              className={`flag-btn ${
                flagged.includes(currentQuestion) ? "flagged" : ""
              }`}
              onClick={() => handleFlagQuestion(currentQuestion)}
            >
              <Flag size={16} />
              {flagged.includes(currentQuestion) ? "Unflag" : "Flag Question"}
            </button>
          </div>

          {questions[currentQuestion].type === "diagram" && (
            <div className="diagram-container">
              <svg viewBox="0 0 300 200" className="triangle-svg">
                <line
                  x1="50"
                  y1="150"
                  x2="250"
                  y2="150"
                  stroke="black"
                  strokeWidth="2"
                />
                <line
                  x1="50"
                  y1="150"
                  x2="150"
                  y2="50"
                  stroke="black"
                  strokeWidth="2"
                />
                <line
                  x1="150"
                  y1="50"
                  x2="250"
                  y2="150"
                  stroke="black"
                  strokeWidth="2"
                />
                <text x="45" y="170" className="label">
                  A
                </text>
                <text x="255" y="170" className="label">
                  B
                </text>
                <text x="145" y="40" className="label">
                  C
                </text>
                <text x="80" y="145" className="angle">
                  45°
                </text>
                <text x="210" y="145" className="angle">
                  75°
                </text>
                <text x="195" y="100" className="side-label">
                  √12
                </text>
              </svg>
            </div>
          )}

          <div className="options-grid">
            {questions[currentQuestion].options.map((option) => (
              <button
                key={option.id}
                className={`option-btn ${
                  answers[currentQuestion] === option.id ? "selected" : ""
                }`}
                onClick={() => handleAnswerSelect(currentQuestion, option.id)}
              >
                <span className="option-letter">{option.id}</span>
                <span className="option-value">{option.value}</span>
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
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button className="nav-btn submit" onClick={handleSubmitQuiz}>
              Submit Quiz
            </button>
          ) : (
            <button
              className="nav-btn next"
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(questions.length - 1, prev + 1)
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
        .quiz-dashboard {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', sans-serif;
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
        }

        .question-area {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
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

        .triangle-svg {
          max-width: 400px;
          height: auto;
        }

        .label, .angle, .side-label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
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
        }
      `}</style>
    </div>
  );
};

export default QuizDashboard;
