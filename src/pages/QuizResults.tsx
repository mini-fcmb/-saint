import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

  // Get results from navigation state
  const result: QuizResult = location.state?.result;

  // If no result data is passed, redirect to dashboard
  if (!result) {
    navigate("/students");
    return null;
  }

  const handleBackToDashboard = () => {
    navigate("/students");
  };

  // Determine score color
  const scoreColor = result.score < 16 ? "#ef4444" : "#10b981";

  return (
    <div className="quiz-results">
      <div className="score-container">
        <div className="score-content">
          {/* Score Display */}
          <div className="score-display">
            <div
              className="score-circle"
              style={{
                background: `conic-gradient(${scoreColor} ${
                  result.score * 3.6
                }deg, #e2e8f0 0deg)`,
              }}
            >
              <div className="score-inner">
                <span className="score-percent" style={{ color: scoreColor }}>
                  {result.score}%
                </span>
                <span className="score-label">Your Score</span>
              </div>
            </div>
          </div>

          {/* Score Message */}
          <div className="score-message">
            <h2 style={{ color: scoreColor }}>
              {result.score < 16 ? "Keep Practicing! 💪" : "Great Job! 🎉"}
            </h2>
            <p>
              You scored {result.score}% in {result.subject}
            </p>
          </div>

          {/* Cancel Button */}
          <button className="cancel-btn" onClick={handleBackToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>

      <style>{`
        .quiz-results {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .score-container {
          background: white;
          border-radius: 20px;
          padding: 60px 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }

        .score-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 30px;
        }

        .score-display {
          display: flex;
          justify-content: center;
        }

        .score-circle {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .score-inner {
          width: 160px;
          height: 160px;
          background: white;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .score-percent {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 8px;
          transition: color 0.3s ease;
        }

        .score-label {
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
        }

        .score-message h2 {
          margin: 0 0 8px 0;
          font-size: 2rem;
          font-weight: 700;
          transition: color 0.3s ease;
        }

        .score-message p {
          margin: 0;
          color: #64748b;
          font-size: 1.1rem;
        }

        .cancel-btn {
          background: #64748b;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 200px;
        }

        .cancel-btn:hover {
          background: #475569;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .score-container {
            padding: 40px 20px;
          }
          
          .score-circle {
            width: 180px;
            height: 180px;
          }
          
          .score-inner {
            width: 140px;
            height: 140px;
          }
          
          .score-percent {
            font-size: 2.5rem;
          }
          
          .score-message h2 {
            font-size: 1.8rem;
          }
        }

        @media (max-width: 480px) {
          .score-circle {
            width: 160px;
            height: 160px;
          }
          
          .score-inner {
            width: 120px;
            height: 120px;
          }
          
          .score-percent {
            font-size: 2rem;
          }
          
          .score-message h2 {
            font-size: 1.5rem;
          }
          
          .cancel-btn {
            padding: 14px 28px;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizResults;
