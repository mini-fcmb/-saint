import React from "react";
import "../styles/quiz.css";

const QuizDashboard: React.FC = () => {
  return (
    <div className="quiz">
      <div className="quiz-container">
        {/* Header */}
        <header className="quiz-header">
          <div className="header-left">
            <div className="logo">S</div>
            <h1>Halaman Ujian - Penilaian Akhir Semester Matematika</h1>
          </div>
          <div className="header-right">
            <span className="timer">01:50:29</span>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
              <div
                key={num}
                className={`progress-item ${
                  num === 5 ? "current" : num < 5 ? "done" : ""
                }`}
              >
                {num}
              </div>
            ))}
            <span className="progress-arrow">⟩</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Sidebar */}
          <aside className="sidebar">
            <button className="sidebar-btn" title="Dashboard">
              <i className="bx bx-grid-alt"></i>
            </button>
            <button className="sidebar-btn" title="Questions">
              <i className="bx bx-file"></i>
            </button>
            <button className="sidebar-btn" title="Help">
              <i className="bx bx-help-circle"></i>
            </button>
            <button className="sidebar-btn" title="Settings">
              <i className="bx bx-cog"></i>
            </button>

            <button className="sidebar-btn flag-btn">
              <i className="bx bx-flag"></i>
              Tandai soal
            </button>
          </aside>

          {/* Question Area */}
          <main className="question-area">
            {/* Question Text */}

            {/* Diagram + Options Row */}
            <div className="diagram-options-row">
              {/* Triangle Diagram */}
              <div className="triangle-diagram">
                <div className="question-text">
                  Berapa panjang sisi AB dari segitiga di bawah ini?
                </div>
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

              {/* Answer Options */}
              <div className="options">
                {[
                  { id: "A", value: "6√2" },
                  { id: "B", value: "3√2", selected: true },
                  { id: "C", value: "12√2" },
                  { id: "D", value: "3" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    className={`option-btn ${opt.selected ? "selected" : ""}`}
                  >
                    <span className="option-letter">{opt.id}</span>
                    <span className="option-value">{opt.value}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="nav-buttons">
              <button className="nav-btn prev">
                <i className="bx bx-chevron-left"></i> Previous
              </button>
              <button className="nav-btn next">
                Next <i className="bx bx-chevron-right"></i>
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default QuizDashboard;
