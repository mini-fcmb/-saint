"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "inbox", label: "Inbox", icon: MessageSquare },
    { id: "students", label: "Students", icon: Users },
    { id: "report", label: "Report", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const workingHours = [
    { day: "Mon", hours: 8, online: true },
    { day: "Tue", hours: 6, online: true },
    { day: "Wed", hours: 7, online: true },
    { day: "Thu", hours: 5, online: true },
    { day: "Fri", hours: 4, online: true },
    { day: "Sat", hours: 0, online: false },
    { day: "Sun", hours: 0, online: false },
  ];

  const groupChats = [
    {
      id: 1,
      name: "Teacher's Group",
      message: "Donna Clayton: Who can replace me on We...",
      time: "10s",
      unread: 2,
    },
    {
      id: 2,
      name: "Class 3A",
      message: "You: 3A Composition-task.pdf",
      time: "2m",
      unread: 0,
    },
    {
      id: 3,
      name: "Class 3B",
      message: "David Jordan: Where can I read the info for...",
      time: "3m",
      unread: 3,
    },
  ];

  const studentTests = [
    {
      id: 1,
      name: "Composition in web design",
      deadline: "June 07, 2022",
      student: "Marie Stephens",
      status: "Active",
    },
    {
      id: 2,
      name: "Responsive vs. Adaptive Design",
      deadline: "June 10, 2022",
      student: "Barbara Carter",
      status: "Active",
    },
    {
      id: 3,
      name: "Responsive vs. Adaptive Design",
      deadline: "June 10, 2022",
      student: "Daniel Evans",
      status: "Reviewed",
    },
    {
      id: 4,
      name: "8 point grid system in UX",
      deadline: "June 11, 2022",
      student: "Peta Robinson",
      status: "Not reviewed",
    },
  ];

  const upcomingClasses = [
    {
      id: 1,
      time: "10:30",
      name: "Composition | Class 3A",
      location: "June 06, Offline",
      status: "active",
    },
    {
      id: 2,
      time: "11:30",
      name: "Composition | Class 3B",
      location: "June 06, Offline",
      status: "active",
    },
    {
      id: 3,
      time: "14:30",
      name: "Grid system | Class 1B",
      location: "June 06, Online - Zoom meeting",
      status: "upcoming",
    },
  ];

  return (
    <>
      <div
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="logo-section">
              <div className="logo-icon">
                <div className="logo-shape"></div>
              </div>
              <span className="logo-text">Axicube</span>
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
              <button className="get-in-touch">Get in touch</button>
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
                  <button className="create-chat-btn">
                    <Plus size={18} /> Create new class chat now
                  </button>
                  <button className="create-class-link">Create class</button>
                </div>
                <div className="copyright">© Atwood School</div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="main-content">
            {/* Welcome */}
            <div className="welcome">
              <h1>Welcome back, Anna</h1>
              <p>June 06, Wednesday</p>
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
                    strokeDasharray="75 100"
                  />
                </svg>
                <div className="ring-text">73%</div>
              </div>
              <div>
                <h2>Your students average progress is 73%</h2>
                <p>Level up your students to improve your teacher rank!</p>
              </div>
            </div>

            {/* Top Grid */}
            <div className="top-grid">
              {/* Working Hours */}
              <div className="card working-hours">
                <div className="card-header">
                  <h3>Working Hours</h3>
                  <span>01 - 08 June 2022</span>
                </div>
                <div className="bar-chart">
                  {workingHours.map((day, i) => (
                    <div key={i} className="bar-item">
                      <div
                        className="bar"
                        style={{
                          height: `${day.hours * 17.5}px`,
                          backgroundColor:
                            day.hours > 0 ? "#10b981" : "#e5e7eb",
                        }}
                      ></div>
                      <span>{day.day}</span>
                    </div>
                  ))}
                </div>
                <div className="total">
                  Total <strong>38h 15m</strong>
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

              {/* Group Chats */}
              <div className="card group-chats">
                <div className="card-header">
                  <h3>Group chats</h3>
                  <a href="#" className="view-all">
                    View all
                  </a>
                </div>
                <div className="chat-list">
                  {groupChats.map((chat) => (
                    <div key={chat.id} className="chat-item">
                      <div className="chat-icon">
                        <MessageSquare size={24} />
                      </div>
                      <div className="chat-info">
                        <div className="chat-header">
                          <h4>{chat.name}</h4>
                          <span>{chat.time}</span>
                        </div>
                        <p>{chat.message}</p>
                      </div>
                      {chat.unread > 0 && (
                        <div className="unread-badge">{chat.unread}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="card calendar">
                <div className="card-header">
                  <span>June 2022</span>
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
                  {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                    <div key={d} className="day-header">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 4;
                    const isCurrent = day === 6;
                    const hasEvent = [6, 13, 16, 20, 27].includes(day);
                    return (
                      <div
                        key={i}
                        className={`calendar-day ${
                          isCurrent ? "current" : ""
                        } ${hasEvent ? "event" : ""}`}
                      >
                        {day > 0 && day <= 30 && day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="bottom-grid">
              {/* Student Tests */}
              <div className="card student-tests">
                <div className="card-header">
                  <h3>Student tests</h3>
                  <a href="#" className="view-all">
                    All tests
                  </a>
                </div>
                <div className="test-list">
                  {studentTests.map((test) => (
                    <div key={test.id} className="test-item">
                      <div className="test-icon">
                        <FileText size={24} />
                      </div>
                      <div className="test-info">
                        <h4>{test.name}</h4>
                        <div className="test-meta">
                          <span>
                            <Clock size={16} /> Deadline {test.deadline}
                          </span>
                          <span>
                            <Users size={16} /> {test.student}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`status ${test.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {test.status === "Active" && (
                          <CheckCircle size={22} color="#10b981" />
                        )}
                        {test.status === "Reviewed" && (
                          <CheckCircle size={22} color="#f59e0b" />
                        )}
                        {test.status === "Not reviewed" && (
                          <AlertCircle size={22} color="#ef4444" />
                        )}
                        <span>{test.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Classes */}
              <div className="card upcoming-classes">
                <div className="card-header">
                  <h3>Upcoming Classes</h3>
                  <a href="#" className="view-all">
                    View all
                  </a>
                </div>
                <div className="class-list">
                  {upcomingClasses.map((cls) => (
                    <div key={cls.id} className="class-item">
                      <div className={`class-status ${cls.status}`}>
                        {cls.status === "active" ? (
                          <CheckCircle size={24} />
                        ) : (
                          <Clock size={24} />
                        )}
                      </div>
                      <div>
                        <h4>
                          {cls.time} {cls.name}
                        </h4>
                        <p>{cls.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-avatar"></div>
            <div className="profile-info">
              <h4>Anna Wilson</h4>
              <p>annawilson@gmail.com</p>
              <div className="stats">
                <div>
                  <strong>Rank 14</strong> / 100
                </div>
                <div>
                  <strong>Classes: 7</strong>
                </div>
              </div>
            </div>
            <button className="profile-arrow">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <style jsx>{`
          /* Base Styles */
          .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 80px;
            background: white;
            border-bottom: 1px solid #e5e7eb;
            z-index: 50;
            padding: 0 48px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .logo-icon {
            width: 48px;
            height: 48px;
            background: #6d28d9;
            border-radius: 12px;
            position: relative;
          }
          .logo-shape {
            width: 28px;
            height: 28px;
            border: 4px solid white;
            border-top: none;
            border-left: none;
            transform: rotate(-45deg);
            position: absolute;
            top: 10px;
            left: 10px;
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
            color: white;
            border: none;
            border-radius: 12px;
            padding: 0 32px;
            height: 44px;
            font-size: 15px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .layout {
            display: flex;
            margin-top: 80px;
          }
          .sidebar {
            width: 320px;
            background: white;
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
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
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
            transition: all 0.2s;
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
            color: white;
            border: none;
            border-radius: 16px;
            padding: 14px 28px;
            font-size: 15px;
            font-weight: 600;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
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
            padding: 8px 0;
          }
          .copyright {
            margin-top: 24px;
            font-size: 13px;
            color: #9ca3af;
            text-align: center;
            font-weight: 500;
          }

          .main-content {
            margin-left: 320px;
            padding: 48px;
            transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            flex: 1;
          }
          .sidebar:not(.open) ~ .main-content {
            margin-left: 88px;
          }

          .welcome h1 {
            font-size: 36px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 8px;
            letter-spacing: -0.5px;
          }
          .welcome p {
            font-size: 18px;
            color: #6b7280;
            margin: 0;
            font-weight: 500;
          }

          .progress-card {
            background: #4f46e5;
            border-radius: 24px;
            padding: 15px;
            margin: 40px 0;
            color: white;
            display: flex;
            align-items: center;
            gap: 32px;
            box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3),
              0 4px 6px -2px rgba(79, 70, 229, 0.2);
            width: 71%;
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
            letter-spacing: -0.5px;
          }
          .progress-card p {
            font-size: 18px;
            margin: 0;
            opacity: 0.95;
            font-weight: 500;
          }

          .top-grid {
            display: grid;
            grid-template-columns: 1fr 1.5fr 1fr;
            gap: 32px;
            margin-bottom: 40px;
          }
          .card {
            background: white;
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
            color: #6366f1;
            text-decoration: none;
            font-weight: 600;
          }

          .bar-chart {
            display: flex;
            align-items: flex-end;
            gap: 16px;
            height: 140px;
            margin-top: 80px;
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
            transition: height 0.3s;
          }
          .total {
            display: flex;
            justify-content: space-between;
            font-size: 15px;
            color: #6b7280;
            font-weight: 500;
            margin-top: 20px;
          }
          .legend {
            display: flex;
            gap: 24px;
            margin-top: 12px;
            font-size: 15px;
            color: #6b7280;
            font-weight: 500;
            margin-left: 25px;
          }
          .dot {
            width: 14px;
            height: 14px;
            border-radius: 3px;
            display: inline-block;
            margin-right: 8px;
          }
          .dot.online {
            background: #10b981;
            margin-left: 0;
          }
          .dot.offline {
            background: #e5e7eb;
            margin-left: 0;
          }

          .chat-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .chat-item {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 4px 0;
          }
          .chat-icon {
            width: 56px;
            height: 56px;
            background: #f3f4f6;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: #6b7280;
          }
          .chat-info {
            flex: 1;
            min-width: 0;
          }
          .chat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
          }
          .chat-header h4 {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 150px;
          }
          .chat-header span {
            font-size: 13px;
            color: #9ca3af;
            font-weight: 500;
          }
          .chat-info p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .unread-badge {
            width: 24px;
            height: 24px;
            background: #ef4444;
            border-radius: 50%;
            color: white;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            margin-bottom: 12px;
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
          }
          .calendar-day.current {
            background: #4f46e5;
            color: white;
            font-weight: 700;
          }
          .calendar-day.event {
            background: #eef2ff;
            color: #4f46e5;
          }

          .bottom-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 32px;
            align-items: start;
          }
          .test-list,
          .class-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .test-item,
          .class-item {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 8px 0;
          }
          .test-icon {
            width: 56px;
            height: 56px;
            background: #f3f4f6;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            flex-shrink: 0;
          }
          .test-info h4 {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .test-meta {
            display: flex;
            gap: 24px;
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
          .test-meta span {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .status {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 600;
          }
          .status.active {
            color: #10b981;
          }
          .status.reviewed {
            color: #f59e0b;
          }
          .status.not-reviewed {
            color: #ef4444;
          }

          .class-status {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .class-status.active {
            background: #10b981;
            color: white;
          }
          .class-status.upcoming {
            background: #e5e7eb;
            color: #6b7280;
          }
          .class-item h4 {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 6px;
          }
          .class-item p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
            font-weight: 500;
          }

          .profile-card {
            position: fixed;
            top: 100px;
            right: 48px;
            width: 320px;
            background: white;
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            gap: 20px;
            z-index: 40;
          }
          .profile-avatar {
            width: 72px;
            height: 72px;
            background: #e0e7ff;
            border-radius: 50%;
            flex-shrink: 0;
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
            font-weight: 500;
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
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: #f3f4f6;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            flex-shrink: 0;
          }

          /* Responsive */
          @media (max-width: 1440px) {
            .header {
              padding: 0 32px;
            }
            .main-content {
              padding: 32px;
            }
            .sidebar {
              width: 280px;
              padding: 32px 0;
            }
            .sidebar:not(.open) {
              width: 80px;
            }
            .main-content {
              margin-left: 280px;
            }
            .sidebar:not(.open) ~ .main-content {
              margin-left: 80px;
            }
            .top-grid {
              grid-template-columns: 1fr 1.3fr 1fr;
              gap: 24px;
            }
          }

          @media (max-width: 1024px) {
            .top-grid {
              grid-template-columns: 1fr;
            }
            .bottom-grid {
              grid-template-columns: 1fr;
            }
            .progress-card {
              width: 100%;
            }
          }

          @media (max-width: 768px) {
            .header {
              padding: 0 16px;
            }
            .main-content {
              padding: 16px;
              margin-left: 80px !important;
            }
            .sidebar {
              width: 80px;
              padding: 16px 0;
            }
            .sidebar.open {
              width: 100%;
            }
            .welcome h1 {
              font-size: 28px;
            }
            .progress-card {
              flex-direction: column;
              text-align: center;
              gap: 16px;
              padding: 24px;
            }
            .progress-ring {
              width: 120px;
              height: 120px;
            }
          }

          @media (max-width: 640px) {
            .header-actions {
              gap: 8px;
            }
            .get-in-touch {
              display: none;
            }
            .profile-card {
              position: relative;
              top: 0;
              right: 0;
              width: 100%;
              margin: 24px 0;
            }
          }
        `}</style>
      </div>
    </>
  );
}
