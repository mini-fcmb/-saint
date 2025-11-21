// QuizDashboard.tsx
import React, { useState } from "react";

export default function QuizDashboard() {
  const [selected, setSelected] = useState("B");

  const questions = Array.from({ length: 13 }, (_, i) => i + 1);

  const options = [
    { letter: "A", value: "6√2" },
    { letter: "B", value: "3√2" },
    { letter: "C", value: "12√2" },
    { letter: "D", value: "3" },
  ];

  return (
    <div className="page">
      <div className="exam-wrapper">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <div className="logo">S</div>
            <h1>Halaman Ujian - Penilaian Akhir Semester Matematika</h1>
          </div>
          <div className="timer">
            Waktu tersisa <strong>01:50:29</strong>
          </div>
        </header>

        {/* Main Layout */}
        <div className="main-layout">
          {/* Left Sidebar */}
          <aside className="sidebar">
            <div className="question-palette">
              {questions.map((n) => (
                <button
                  key={n}
                  className={`qbtn ${n === 7 ? "current" : ""} ${
                    n === 5 ? "answered" : ""
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button className="arrow-btn">&gt;</button>
          </aside>

          {/* Question Area */}
          <main className="question-area">
            <div className="question-box">
              <h2 className="question-title">
                Berapa panjang sisi AB dari segitiga di bawah ini?
              </h2>

              {/* Triangle */}
              <div className="triangle-wrapper">
                <svg width="320" height="220" viewBox="0 0 320 220">
                  <polygon
                    points="40,180 280,180 160,40"
                    fill="none"
                    stroke="#222"
                    strokeWidth="2"
                  />
                  <text x="155" y="30" fontSize="16" textAnchor="middle">
                    C
                  </text>
                  <text x="30" y="195" fontSize="16">
                    A
                  </text>
                  <text x="290" y="195" fontSize="16">
                    B
                  </text>
                  <text x="90" y="170" fontSize="14">
                    45°
                  </text>
                  <text x="230" y="170" fontSize="14">
                    75°
                  </text>
                  <text x="230" y="100" fontSize="18" fontWeight="bold">
                    √12
                  </text>
                </svg>
              </div>

              {/* Options */}
              <div className="options">
                {options.map((opt) => (
                  <button
                    key={opt.letter}
                    className={`option ${
                      selected === opt.letter ? "selected" : ""
                    }`}
                    onClick={() => setSelected(opt.letter)}
                  >
                    <span className="letter-circle">{opt.letter}</span>
                    <span className="option-text">{opt.value}</span>
                  </button>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="bottom-actions">
                <button className="flag-btn">Flag Tandai soal</button>
                <div className="nav-btns">
                  <button className="prev-btn">← Sebelumnya</button>
                  <button className="next-btn">Selanjutnya →</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Inline CSS */}
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(to bottom, #ffe4b5, #ffb347);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }

        .exam-wrapper {
          width: 1100px;
          height: 680px;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid #eee;
          background: white;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo {
          width: 44px;
          height: 44px;
          background: #007bff;
          color: white;
          font-weight: bold;
          font-size: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header h1 {
          font-size: 17px;
          font-weight: 500;
          color: #333;
        }

        .timer {
          background: #ffe5e5;
          color: #e91e1e;
          padding: 10px 20px;
          border-radius: 30px;
          font-size: 15px;
          font-weight: 600;
        }

        .main-layout {
          display: flex;
          flex: 1;
        }

        .sidebar {
          width: 90px;
          background: #f8f9fc;
          border-right: 1px solid #eee;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 30px;
        }

        .question-palette {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .qbtn {
          width: 42px;
          height: 42px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 50%;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .qbtn:hover {
          border-color: #007bff;
        }

        .qbtn.current {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .qbtn.answered {
          background: #e1f5fe;
          color: #007bff;
          border-color: #81d4fa;
        }

        .arrow-btn {
          margin-top: 30px;
          background: none;
          border: none;
          font-size: 28px;
          color: #aaa;
          cursor: pointer;
        }

        .question-area {
          flex: 1;
          background: #fdfdfd;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 40px;
        }

        .question-box {
          width: 100%;
          max-width: 620px;
        }

        .question-title {
          font-size: 19px;
          text-align: center;
          color: #222;
          margin-bottom: 40px;
          line-height: 1.5;
        }

        .triangle-wrapper {
          background: #f9f9f9;
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          margin-bottom: 40px;
        }

        .options {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 50px;
        }

        .option {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 24px;
          background: #f8f9fc;
          border-radius: 12px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 18px;
        }

        .option:hover {
          background: #edf2ff;
        }

        .option.selected {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .letter-circle {
          width: 42px;
          height: 42px;
          background: white;
          color: #007bff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          flex-shrink: 0;
        }

        .option.selected .letter-circle {
          background: #0056b3;
          color: white;
        }

        .option-text {
          font-weight: 500;
        }

        .bottom-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .flag-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #ddd;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .flag-btn::before {
          content: "Flag";
          font-size: 18px;
        }

        .nav-btns {
          display: flex;
          gap: 12px;
        }

        .prev-btn,
        .next-btn {
          padding: 12px 28px;
          border-radius: 8px;
          font-size: 15px;
          cursor: pointer;
          border: none;
        }

        .prev-btn {
          background: #f8f9fc;
          color: #555;
          border: 1px solid #ddd;
        }

        .next-btn {
          background: #007bff;
          color: white;
        }

        .next-btn:hover {
          background: #0056b3;
        }
      `}</style>
    </div>
  );
}
