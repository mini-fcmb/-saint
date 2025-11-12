import React, { useEffect, useState } from "react";
import "../styles/students.css";

const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"assignments" | "exam">(
    "assignments"
  );

  useEffect(() => {
    const canvas = document.getElementById("lineChart") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { width: w, height: h } = canvas;

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#5a67d8";
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(30, 90);
    ctx.bezierCurveTo(80, 60, 130, 70, 180, 50);
    ctx.bezierCurveTo(230, 30, 280, 80, 330, 65);
    ctx.bezierCurveTo(380, 50, 430, 85, w - 30, 75);
    ctx.stroke();
  }, []);

  return (
    <div className="wrapper">
      {/* ==================== TOP BAR ==================== */}
      <header className="top-bar">
        <div className="top-left">
          <i className="bx bxs-graduation-cap logo"></i>
          <h1 className="uni">Arck University</h1>
          <div className="search-box">
            <input type="text" placeholder="Search" />
            <button className="search-btn">
              <i className="bx bx-search"></i>
            </button>
          </div>
        </div>

        <div className="top-right">
          <img
            src="https://i.pravatar.cc/40?u=saurabh"
            alt="Saurabh"
            className="user-avatar"
          />
          <span className="user-name">Saurabh Kumar</span>
          <span className="user-status">Available for work</span>
          <button className="follow-btn">
            <i className="bx bx-heart"></i>
          </button>
          <button className="share-btn">
            <i className="bx bx-share-alt"></i>
          </button>
          <button className="get-in-touch">Get in touch</button>
        </div>
      </header>

      {/* ==================== SIDEBAR ==================== */}
      <aside className="sidebar">
        <nav>
          <ul>
            <li className="active">
              <i className="bx bx-home"></i> Dashboard
            </li>
            <li>
              <i className="bx bx-book"></i> My Courses
            </li>
            <li>
              <i className="bx bx-file"></i> Request
            </li>
            <li>
              <i className="bx bx-question-mark"></i> Query
            </li>
            <li>
              <i className="bx bx-upload"></i> Project Submission
            </li>
            <li>
              <i className="bx bx-coffee"></i> Semester Break
            </li>
            <li>
              <i className="bx bx-group"></i> Connection
            </li>
            <li>
              <i className="bx bx-video"></i> Virtual Lab
            </li>
            <li>
              <i className="bx bx-help-circle"></i> Exam FAQ
            </li>
            <li>
              <i className="bx bx-bar-chart-alt-2"></i> Attendance
            </li>
          </ul>
        </nav>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="main-content">
        {/* ==================== QUICK ACTION TILES ==================== */}
        <section className="tiles">
          <div className="tile open">
            <i className="bx bx-message-square-dots"></i>
            <span>Open Queries</span>
          </div>
          <div className="tile assign">
            <i className="bx bx-clipboard"></i>
            <span>Assignments</span>
          </div>
          <div className="tile proj">
            <i className="bx bx-rocket"></i>
            <span>Projects</span>
          </div>
          <div className="tile sport">
            <i className="bx bx-football"></i>
            <span>Sports</span>
          </div>
        </section>

        {/* ==================== ROW 1: Chart + Donuts + Profile ==================== */}
        <section className="top-row">
          {/* Line Chart */}
          <div className="chart-container">
            <h3>Student Progress</h3>
            <div className="chart-box">
              <canvas id="lineChart" width="460" height="130"></canvas>
              <div className="x-labels">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Donut Charts */}
          <div className="donuts-container">
            <div className="donut">
              <svg viewBox="0 0 36 36">
                <path
                  className="bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="fill avg"
                  strokeDasharray="62,100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="pct">
                  62%
                </text>
              </svg>
              <p>Average</p>
            </div>
            <div className="donut">
              <svg viewBox="0 0 36 36">
                <path
                  className="bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="fill proj"
                  strokeDasharray="70,100"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="pct">
                  70%
                </text>
              </svg>
              <p>Project</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="profile-card-inline">
            <img
              src="https://i.pravatar.cc/80?u=ella"
              alt="Ella"
              className="profile-img"
            />
            <div className="profile-info">
              <h4>Ella Hudson</h4>
              <p>ella.hudson@gmail.com</p>
              <button className="view-profile-btn">View Profile</button>
            </div>
            <div className="profile-details">
              <p>
                <strong>Enrollment No:</strong> A231231231
              </p>
              <p>
                <strong>Course:</strong> BCA
              </p>
              <p>
                <strong>Session:</strong> Jan 2020 - July 2020
              </p>
              <p>
                <strong>Semester:</strong> IV
              </p>
            </div>
          </div>
        </section>

        {/* ==================== ROW 2: Assignments/Exam + Calendar ==================== */}
        <section className="bottom-row">
          {/* Assignments / Exam Schedule */}
          <div className="assignments-container">
            <div className="tab-header">
              <button
                className={activeTab === "assignments" ? "active" : ""}
                onClick={() => setActiveTab("assignments")}
              >
                Assignments
              </button>
              <button
                className={activeTab === "exam" ? "active" : ""}
                onClick={() => setActiveTab("exam")}
              >
                Exam Schedule
              </button>
            </div>

            <div className="tab-content">
              {activeTab === "assignments" ? (
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Mathematics", "21.01.2020", "1.05.2020", "pending"],
                      [
                        "Fundamentals of C++",
                        "21.02.2020",
                        "1.06.2020",
                        "submitted",
                      ],
                      ["Java", "21.02.2020", "1.06.2020", "submitted"],
                      ["Html & Css", "21.02.2020", "1.06.2020", "pending"],
                      [
                        "Computer Applications",
                        "21.02.2020",
                        "1.06.2020",
                        "pending",
                      ],
                    ].map(([sub, start, end, status], i) => (
                      <tr key={i}>
                        <td>{sub}</td>
                        <td>{start}</td>
                        <td>{end}</td>
                        <td>
                          <span className={`status ${status}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Mid-Term</td>
                      <td>15.03.2020</td>
                      <td>10:00 AM</td>
                      <td>A-101</td>
                    </tr>
                    <tr>
                      <td>Final</td>
                      <td>25.06.2020</td>
                      <td>09:00 AM</td>
                      <td>B-205</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="calendar-card">
            <div className="cal-head">
              <button>
                <i className="bx bx-chevron-left"></i>
              </button>
              <span>June 2020</span>
              <button>
                <i className="bx bx-chevron-right"></i>
              </button>
            </div>
            <div className="cal-grid">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="day-name">
                  {d}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const day = i;
                const isJune = day >= 0 && day < 30;
                return (
                  <div
                    key={i}
                    className={isJune ? "" : "empty"}
                    style={{
                      background: day === 11 ? "#fed7d7" : undefined,
                      color: day === 11 ? "#e53e3e" : undefined,
                    }}
                  >
                    {isJune ? day + 1 : ""}
                  </div>
                );
              })}
            </div>
            <div className="event">Hacking Competition</div>
          </div>
        </section>

        {/* ==================== SUPPORT WIDGET ==================== */}
        <div className="support-widget">
          <img
            src="https://i.pravatar.cc/60?u=support"
            alt="Support"
            className="support-img"
          />
          <div className="support-text">
            <p>Support 24/7</p>
            <p>Need help at any time</p>
          </div>
          <button className="call-btn">Call</button>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
