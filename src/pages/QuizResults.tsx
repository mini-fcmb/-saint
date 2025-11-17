import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Award,
  Clock,
  BarChart3,
  Home,
  RotateCcw,
} from "lucide-react";

interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeSpent: string;
  subject: string;
  answers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

const QuizResults: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectId } = useParams<{ subjectId: string }>();

  // Get results from navigation state
  const result: QuizResult = location.state?.result;

  // If no result data is passed, show an error or redirect
  if (!result) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h1>No Quiz Results Found</h1>
          <p>
            It seems you haven't completed a quiz yet, or there was an error
            loading your results.
          </p>
          <button
            onClick={() => navigate("/quiz-subjects")}
            className="back-btn"
          >
            Take a Quiz
          </button>
        </div>
        <style>{`
          .error-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .error-content {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            width: 100%;
          }
          .error-content h1 {
            color: #ef4444;
            margin-bottom: 16px;
          }
          .error-content p {
            color: #64748b;
            margin-bottom: 24px;
          }
          .back-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent! 🎉";
    if (score >= 80) return "Great Job! 👏";
    if (score >= 70) return "Good Work! 👍";
    if (score >= 60) return "Not Bad! 😊";
    return "Keep Practicing! 💪";
  };

  const handleBackToDashboard = () => {
    navigate("/students");
  };

  const handleRetakeQuiz = () => {
    navigate(`/quiz/${subjectId}`);
  };

  const handleReviewAnswers = () => {
    document
      .getElementById("review-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="quiz-results">
      <div className="results-container">
        {/* Header */}
        <header className="results-header">
          <div className="header-content">
            <Award size={48} className="trophy-icon" />
            <h1>Quiz Completed!</h1>
            <p>Here's how you performed in {result.subject}</p>
          </div>
        </header>

        {/* Score Overview */}
        <section className="score-overview">
          <div className="score-circle">
            <div
              className="score-progress"
              style={{
                background: `conic-gradient(${getScoreColor(result.score)} ${
                  result.score * 3.6
                }deg, #e2e8f0 0deg)`,
              }}
            >
              <div className="score-inner">
                <span className="score-percent">{result.score}%</span>
                <span className="score-label">Score</span>
              </div>
            </div>
          </div>

          <div className="score-message">
            <h2>{getScoreMessage(result.score)}</h2>
            <p>
              You answered {result.correctAnswers} out of{" "}
              {result.totalQuestions} questions correctly
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card correct">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{result.correctAnswers}</h3>
              <p>Correct</p>
            </div>
          </div>

          <div className="stat-card wrong">
            <div className="stat-icon">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{result.wrongAnswers}</h3>
              <p>Wrong</p>
            </div>
          </div>

          <div className="stat-card time">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <h3>{result.timeSpent}</h3>
              <p>Time Spent</p>
            </div>
          </div>

          <div className="stat-card accuracy">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <h3>
                {Math.round(
                  (result.correctAnswers / result.totalQuestions) * 100
                )}
                %
              </h3>
              <p>Accuracy</p>
            </div>
          </div>
        </section>

        {/* Performance Bar */}
        <section className="performance-bar">
          <div className="performance-labels">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <div className="performance-track">
            <div
              className="performance-fill"
              style={{
                width: `${result.score}%`,
                background: getScoreColor(result.score),
              }}
            ></div>
          </div>
          <div
            className="performance-marker"
            style={{ left: `${result.score}%` }}
          >
            <div className="marker-dot"></div>
            <span className="marker-text">Your Score: {result.score}%</span>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="action-buttons">
          <button className="btn primary" onClick={handleBackToDashboard}>
            <Home size={20} />
            Back to Dashboard
          </button>
          <button className="btn secondary" onClick={handleReviewAnswers}>
            Review Answers
          </button>
          <button className="btn outline" onClick={handleRetakeQuiz}>
            <RotateCcw size={20} />
            Retake Quiz
          </button>
        </section>

        {/* Answers Review */}
        <section id="review-section" className="answers-review">
          <h2>Review Your Answers</h2>
          <div className="answers-list">
            {result.answers.map((answer, index) => (
              <div key={index} className="answer-item">
                <div className="question-header">
                  <span className="question-number">Question {index + 1}</span>
                  <div
                    className={`status-badge ${
                      answer.isCorrect ? "correct" : "wrong"
                    }`}
                  >
                    {answer.isCorrect ? (
                      <>
                        <CheckCircle size={14} /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle size={14} /> Incorrect
                      </>
                    )}
                  </div>
                </div>

                <p className="question-text">{answer.question}</p>

                <div className="answer-comparison">
                  <div className="answer-row">
                    <span className="answer-label">Your Answer:</span>
                    <span
                      className={`answer-value ${
                        !answer.isCorrect ? "wrong" : ""
                      }`}
                    >
                      {answer.userAnswer}
                    </span>
                  </div>

                  {!answer.isCorrect && (
                    <div className="answer-row">
                      <span className="answer-label">Correct Answer:</span>
                      <span className="answer-value correct">
                        {answer.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        .quiz-results {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .results-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .results-header {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 40px 32px;
          text-align: center;
        }

        .header-content h1 {
          margin: 16px 0 8px 0;
          font-size: 2.5rem;
          font-weight: 700;
        }

        .header-content p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .trophy-icon {
          color: #fbbf24;
        }

        .score-overview {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          padding: 40px 32px;
          border-bottom: 1px solid #e2e8f0;
        }

        .score-circle {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .score-progress {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .score-inner {
          width: 120px;
          height: 120px;
          background: white;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .score-percent {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
        }

        .score-label {
          font-size: 0.9rem;
          color: #64748b;
          margin-top: 4px;
        }

        .score-message {
          text-align: center;
        }

        .score-message h2 {
          margin: 0 0 8px 0;
          font-size: 1.8rem;
          color: #1e293b;
        }

        .score-message p {
          margin: 0;
          color: #64748b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          padding: 32px;
          border-bottom: 1px solid #e2e8f0;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          border-radius: 12px;
          background: #f8fafc;
        }

        .stat-card.correct .stat-icon {
          background: #d1fae5;
          color: #10b981;
        }

        .stat-card.wrong .stat-icon {
          background: #fef2f2;
          color: #ef4444;
        }

        .stat-card.time .stat-icon {
          background: #f0f9ff;
          color: #0ea5e9;
        }

        .stat-card.accuracy .stat-icon {
          background: #faf5ff;
          color: #8b5cf6;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-content p {
          margin: 4px 0 0 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .performance-bar {
          padding: 32px;
          border-bottom: 1px solid #e2e8f0;
          position: relative;
        }

        .performance-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #64748b;
          font-size: 0.9rem;
        }

        .performance-track {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .performance-fill {
          height: 100%;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .performance-marker {
          position: absolute;
          top: 50px;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .marker-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          margin-bottom: 8px;
        }

        .marker-text {
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          background: white;
          padding: 4px 8px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          padding: 32px;
          border-bottom: 1px solid #e2e8f0;
        }

        .btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn.primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }

        .btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn.secondary {
          background: #10b981;
          color: white;
        }

        .btn.secondary:hover {
          background: #059669;
        }

        .btn.outline {
          background: white;
          border: 2px solid #e2e8f0;
          color: #64748b;
        }

        .btn.outline:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .answers-review {
          padding: 32px;
        }

        .answers-review h2 {
          margin: 0 0 24px 0;
          font-size: 1.5rem;
          color: #1e293b;
        }

        .answers-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .answer-item {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          background: #f8fafc;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .question-number {
          font-weight: 600;
          color: #1e293b;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-badge.correct {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.wrong {
          background: #fef2f2;
          color: #991b1b;
        }

        .question-text {
          margin: 0 0 16px 0;
          color: #374151;
          line-height: 1.5;
        }

        .answer-comparison {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .answer-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .answer-label {
          font-weight: 600;
          color: #64748b;
          min-width: 120px;
        }

        .answer-value {
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 600;
        }

        .answer-value.correct {
          background: #d1fae5;
          color: #065f46;
        }

        .answer-value.wrong {
          background: #fef2f2;
          color: #991b1b;
        }

        @media (max-width: 768px) {
          .score-overview {
            flex-direction: column;
            gap: 24px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .action-buttons {
            flex-direction: column;
          }

          .question-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }

          .results-header {
            padding: 32px 20px;
          }

          .results-header h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizResults;
