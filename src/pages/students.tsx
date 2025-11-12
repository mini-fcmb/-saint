import React, { useEffect } from "react";
import "../styles/students.css";

const StudentDashboard: React.FC = () => {
  // ---- draw the exact line‑chart (no external lib) ----
  useEffect(() => {
    const canvas = document.getElementById("lineChart") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#5a67d8";
    ctx.beginPath();
    ctx.moveTo(30, 90);
    ctx.bezierCurveTo(80, 60, 130, 70, 180, 50);
    ctx.bezierCurveTo(230, 30, 280, 80, 330, 65);
    ctx.bezierCurveTo(380, 50, 430, 85, w - 30, 75);
    ctx.stroke();
  }, []);

  return (
    <div className="wrapper">
      {/* ---------- Header ---------- */}
      <header className="header">
        <div className="header-left">
          <i className="bx bxs-graduation-cap logo"></i>
          <h1 className="uni">Arck University</h1>
          <div className="search-box">
            <i className="bx bx-search"></i>
            <input type="text" placeholder="Search" />
          </div>
        </div>
        <div className="header-right">
          <i className="bx bx-bell bell"></i>
          <button className="logout-btn">Logout</button>
        </div>
      </header>

      {/* ---------- Sidebar ---------- */}
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

      {/* ---------- Main Card (exact layout) ---------- */}
      <main className="main-card">
        {/* Quick Action Tiles */}
        <section className="tiles">
          <div className="tile open">
            <i className="bx bx-message-square-dots"></i>Open Queries
          </div>
          <div className="tile assign">
            <i className="bx bx-clipboard"></i>Assignments
          </div>
          <div className="tile proj">
            <i className="bx bx-rocket"></i>Projects
          </div>
          <div className="tile sport">
            <i className="bx bx-football"></i>Sports
          </div>
        </section>

        {/* Progress + Donuts */}
        <section className="progress">
          <h3>Student Progress</h3>

          <div className="chart-area">
            <canvas id="lineChart" width="460" height="130"></canvas>
            <div className="x-labels">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
            </div>
          </div>

          <div className="donuts">
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
        </section>

        {/* Assignments Table */}
        <section className="assignments">
          <h3>Assignments</h3>
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
              <tr>
                <td>Mathematics</td>
                <td>21.01.2020</td>
                <td>1.05.2020</td>
                <td>
                  <span className="status pending">Pending</span>
                </td>
              </tr>
              <tr>
                <td>Fundamentals of C++</td>
                <td>21.02.2020</td>
                <td>1.06.2020</td>
                <td>
                  <span className="status submitted">Submitted</span>
                </td>
              </tr>
              <tr>
                <td>Java</td>
                <td>21.02.2020</td>
                <td>1.06.2020</td>
                <td>
                  <span className="status submitted">Submitted</span>
                </td>
              </tr>
              <tr>
                <td>Html & Css</td>
                <td>21.02.2020</td>
                <td>1.06.2020</td>
                <td>
                  <span className="status pending">Pending</span>
                </td>
              </tr>
              <tr>
                <td>Computer Applications</td>
                <td>21.02.2020</td>
                <td>1.06.2020</td>
                <td>
                  <span className="status pending">Pending</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Bottom Row – Profile + Calendar */}
        <div className="bottom">
          <section className="profile">
            <img src="https://i.pravatar.cc/80?u=ella" alt="Ella" />
            <div className="info">
              <h4>Ella Hudson</h4>
              <p>ella.hudson@gmail.com</p>
              <button className="view-btn">View Profile</button>
            </div>
            <div className="details">
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
          </section>

          <section className="calendar">
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
                <div key={d}>{d}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => i).map((n) => (
                <div key={n} className={n === 0 || n > 30 ? "empty" : ""}>
                  {n > 0 && n <= 30 ? n : ""}
                </div>
              ))}
            </div>
            <div className="event">Hacking Competition</div>
          </section>
        </div>

        {/* Support Widget (fixed) */}
        <div className="support">
          <img src="https://i.pravatar.cc/60?u=support" alt="Support" />
          <div>
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
