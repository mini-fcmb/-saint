import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, FileText } from "lucide-react";

const QuizSubjects: React.FC = () => {
  const navigate = useNavigate();

  const subjects = [
    {
      id: "math",
      name: "Mathematics",
      description: "Algebra, Geometry, Calculus",
      totalQuizzes: 5,
      duration: 60,
      available: true,
    },
    {
      id: "physics",
      name: "Physics",
      description: "Mechanics, Thermodynamics, Electromagnetism",
      totalQuizzes: 3,
      duration: 45,
      available: true,
    },
    {
      id: "chemistry",
      name: "Chemistry",
      description: "Organic, Inorganic, Physical Chemistry",
      totalQuizzes: 4,
      duration: 50,
      available: true,
    },
    {
      id: "computer-science",
      name: "Computer Science",
      description: "Programming, Algorithms, Data Structures",
      totalQuizzes: 6,
      duration: 75,
      available: true,
    },
    {
      id: "biology",
      name: "Biology",
      description: "Botany, Zoology, Genetics",
      totalQuizzes: 2,
      duration: 40,
      available: false,
    },
  ];

  const handleSubjectSelect = (subjectId: string) => {
    // Navigate to quiz page with subject ID
    navigate(`/quiz/${subjectId}`);
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <div className="quiz-subjects-page">
      {/* Header */}
      <header className="subjects-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="header-content">
          <h1>Select Subject for Quiz</h1>
          <p>Choose a subject to start your assessment</p>
        </div>
      </header>

      {/* Subjects Grid */}
      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className={`subject-card ${!subject.available ? "disabled" : ""}`}
            onClick={() => subject.available && handleSubjectSelect(subject.id)}
          >
            <div className="subject-icon">
              <BookOpen size={24} />
            </div>

            <div className="subject-info">
              <h3>{subject.name}</h3>
              <p>{subject.description}</p>

              <div className="subject-meta">
                <div className="meta-item">
                  <FileText size={14} />
                  <span>{subject.totalQuizzes} quizzes</span>
                </div>
                <div className="meta-item">
                  <Clock size={14} />
                  <span>{subject.duration} min</span>
                </div>
              </div>
            </div>

            {!subject.available && (
              <div className="coming-soon">Coming Soon</div>
            )}

            {subject.available && <div className="select-btn">Start Quiz</div>}
          </div>
        ))}
      </div>

      <style>{`
        .quiz-subjects-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .subjects-header {
          max-width: 1200px;
          margin: 0 auto 40px;
          color: white;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .header-content h1 {
          margin: 0 0 8px 0;
          font-size: 2.5rem;
          font-weight: 700;
        }

        .header-content p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }

        .subjects-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
        }

        .subject-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .subject-card:not(.disabled):hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .subject-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .subject-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 16px;
        }

        .subject-info h3 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
        }

        .subject-info p {
          margin: 0 0 16px 0;
          color: #64748b;
          line-height: 1.5;
        }

        .subject-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 0.9rem;
        }

        .select-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          transition: all 0.3s ease;
        }

        .subject-card:not(.disabled):hover .select-btn {
          transform: scale(1.05);
        }

        .coming-soon {
          background: #f59e0b;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-align: center;
        }

        @media (max-width: 768px) {
          .subjects-grid {
            grid-template-columns: 1fr;
          }
          
          .header-content h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizSubjects;
