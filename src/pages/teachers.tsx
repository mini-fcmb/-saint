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
    { day: "Mon", hours: 8 },
    { day: "Tue", hours: 6 },
    { day: "Wed", hours: 7 },
    { day: "Thu", hours: 5 },
    { day: "Fri", hours: 4 },
    { day: "Sat", hours: 0 },
    { day: "Sun", hours: 0 },
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
      {/* --------------------------------------------------------------
          GLOBAL STYLES – plain CSS (no Tailwind, no duplicate rules)
      -------------------------------------------------------------- */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; }

        /* 4K baseline */
        .header { padding:0 48px; }
        .sidebar { width:${sidebarOpen ? "320px" : "88px"}; padding:40px 0; }
        .main { margin-left:${sidebarOpen ? "320px" : "88px"}; padding:48px; }

        /* 2560px */
        @media (max-width:2560px) {
          .header { padding:0 32px; }
          .sidebar { padding:32px 0; }
          .main { padding:32px; }
        }

        /* 1920px */
        @media (max-width:1920px) {
          .header { padding:0 24px; }
          .sidebar { width:${sidebarOpen ? "280px" : "80px"}; padding:24px 0; }
          .main { margin-left:${sidebarOpen ? "280px" : "80px"}; padding:24px; }
        }

        /* 1440px */
        @media (max-width:1440px) {
          .main { padding:20px; }
        }
      `}</style>

      <div
        style={{
          backgroundColor: "#f9fafb",
          minHeight: "100vh",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #e5e7eb 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      >
        {/* ---------- HEADER ---------- */}
        <header
          className="header"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "80px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            zIndex: 50,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "40px",
              flex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: "#6d28d9",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    border: "4px solid white",
                    borderTop: "none",
                    borderLeft: "none",
                    transform: "rotate(-45deg)",
                    position: "absolute",
                  }}
                />
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#111827" }}>
                Axicube
              </span>
              <span style={{ fontSize: 14, color: "#6b7280" }}>
                Available for work
              </span>
              <button
                style={{
                  backgroundColor: "#f3f4f6",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 13,
                  color: "#374151",
                }}
              >
                Follow
              </button>
            </div>

            <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
              {[Search, Bell, Menu].map((Icon, i) => (
                <button
                  key={i}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "#f3f4f6",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color="#6b7280" />
                </button>
              ))}
              <button
                style={{
                  backgroundColor: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "0 32px",
                  fontSize: 15,
                  fontWeight: 600,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Get in touch
              </button>
            </div>
          </div>
        </header>

        {/* ---------- SIDEBAR ---------- */}
        <aside
          className="sidebar"
          style={{
            position: "fixed",
            top: 80,
            left: 0,
            height: "calc(100vh - 80px)",
            backgroundColor: "#fff",
            borderRight: "1px solid #e5e7eb",
            transition: "width .3s cubic-bezier(.4,0,.2,1)",
            boxShadow: "2px 0 10px rgba(0,0,0,.05)",
          }}
        >
          <div style={{ padding: "0 32px", marginBottom: 40 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "#f3f4f6",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: sidebarOpen ? "auto" : 0,
              }}
            >
              {sidebarOpen ? (
                <ChevronLeft size={18} color="#6b7280" />
              ) : (
                <ChevronRight size={18} color="#6b7280" />
              )}
            </button>
          </div>

          <nav style={{ padding: "0 24px" }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedMenu(item.id)}
                  style={{
                    width: "100%",
                    padding: sidebarOpen ? "16px 20px" : "16px",
                    marginBottom: 8,
                    borderRadius: 16,
                    backgroundColor:
                      selectedMenu === item.id ? "#eef2ff" : "transparent",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    color: selectedMenu === item.id ? "#4f46e5" : "#6b7280",
                    fontSize: 15,
                    fontWeight: selectedMenu === item.id ? 600 : 500,
                  }}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div
              style={{ position: "absolute", bottom: 40, left: 32, right: 32 }}
            >
              <div
                style={{
                  backgroundColor: "#eef2ff",
                  borderRadius: 24,
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    backgroundColor: "#c7d2fe",
                    borderRadius: "50%",
                    backgroundSize: "cover",
                  }}
                />
                <button
                  style={{
                    backgroundColor: "#4f46e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: 16,
                    padding: "14px 28px",
                    fontSize: 15,
                    fontWeight: 600,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <Plus size={18} /> Create new class chat now
                </button>
                <button
                  style={{
                    background: "transparent",
                    color: "#4f46e5",
                    border: "none",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Create class
                </button>
              </div>
              <div
                style={{
                  marginTop: 24,
                  fontSize: 13,
                  color: "#9ca3af",
                  textAlign: "center",
                }}
              >
                © Atwood School
              </div>
            </div>
          )}
        </aside>

        {/* ---------- MAIN CONTENT ---------- */}
        <main className="main">
          {/* Welcome */}
          <div style={{ marginBottom: 40 }}>
            <h1
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 8px",
              }}
            >
              Welcome back, Anna
            </h1>
            <p style={{ fontSize: 18, color: "#6b7280" }}>June 06, Wednesday</p>
          </div>

          {/* Progress Card */}
          <div
            style={{
              backgroundColor: "#4f46e5",
              borderRadius: 24,
              padding: 40,
              marginBottom: 40,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 32,
              boxShadow: "0 10px 15px -3px rgba(79,70,229,.3)",
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                backgroundColor: "rgba(255,255,255,.15)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width={100}
                height={100}
                viewBox="0 0 36 36"
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx={18}
                  cy={18}
                  r={16}
                  fill="none"
                  stroke="rgba(255,255,255,.3)"
                  strokeWidth={3.5}
                />
                <circle
                  cx={18}
                  cy={18}
                  r={16}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={3.5}
                  strokeDasharray="75 100"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                73%
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px" }}>
                Your students average progress is 73%
              </h2>
              <p style={{ fontSize: 18, opacity: 0.95 }}>
                Level up your students to improve your teacher rank!
              </p>
            </div>
          </div>

          {/* Top Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 32,
              marginBottom: 40,
            }}
          >
            {/* Working Hours */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 32,
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                  Working Hours
                </h3>
                <span style={{ fontSize: 15, color: "#6b7280" }}>
                  01 - 08 June 2022
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 16,
                  height: 140,
                  marginBottom: 24,
                }}
              >
                {workingHours.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        height: `${d.hours * 17.5}px`,
                        width: "100%",
                        backgroundColor: d.hours ? "#10b981" : "#e5e7eb",
                        borderRadius: 6,
                      }}
                    />
                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 15,
                  color: "#6b7280",
                }}
              >
                <span>Total</span>
                <span>38h 15m</span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginTop: 12,
                  fontSize: 15,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: "#10b981",
                      borderRadius: 3,
                    }}
                  />
                  <span style={{ color: "#6b7280" }}>Online</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      backgroundColor: "#e5e7eb",
                      borderRadius: 3,
                    }}
                  />
                  <span style={{ color: "#6b7280" }}>Offline</span>
                </div>
              </div>
            </div>

            {/* Group Chats */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 32,
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                  Group chats
                </h3>
                <a
                  href="#"
                  style={{
                    fontSize: 15,
                    color: "#6366f1",
                    textDecoration: "none",
                  }}
                >
                  View all
                </a>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {groupChats.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        backgroundColor: "#f3f4f6",
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MessageSquare size={24} color="#6b7280" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "#111827",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 150,
                          }}
                        >
                          {c.name}
                        </h4>
                        <span style={{ fontSize: 13, color: "#9ca3af" }}>
                          {c.time}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.message}
                      </p>
                    </div>
                    {c.unread > 0 && (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          backgroundColor: "#ef4444",
                          borderRadius: "50%",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {c.unread}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 32,
                }}
              >
                <span style={{ fontSize: 15, color: "#6b7280" }}>
                  June 2022
                </span>
                <div style={{ display: "flex", gap: 12 }}>
                  {[ChevronLeft, ChevronRight].map((Icon, i) => (
                    <button
                      key={i}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: "#f3f4f6",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={18} color="#6b7280" />
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      fontSize: 13,
                      color: "#9ca3af",
                      fontWeight: 600,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  gap: 12,
                }}
              >
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 4;
                  const current = day === 6;
                  const event = [6, 13, 16, 20, 27].includes(day);
                  return (
                    <div
                      key={i}
                      style={{
                        height: 40,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: current ? 700 : 500,
                        color: day > 0 && day <= 30 ? "#111827" : "transparent",
                        backgroundColor: current
                          ? "#4f46e5"
                          : event
                          ? "#eef2ff"
                          : "transparent",
                        color: current ? "#fff" : event ? "#4f46e5" : "#111827",
                      }}
                    >
                      {day > 0 && day <= 30 && day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Grid */}
          <div
            style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 32 }}
          >
            {/* Student Tests */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 32,
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                  Student tests
                </h3>
                <a
                  href="#"
                  style={{
                    fontSize: 15,
                    color: "#6366f1",
                    textDecoration: "none",
                  }}
                >
                  All tests
                </a>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {studentTests.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        backgroundColor: "#f3f4f6",
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileText size={24} color="#6b7280" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#111827",
                          margin: "0 0 6px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.name}
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          gap: 24,
                          fontSize: 14,
                          color: "#6b7280",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Clock size={16} /> Deadline {t.deadline}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Users size={16} /> {t.student}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      {t.status === "Active" && (
                        <CheckCircle size={22} color="#10b981" />
                      )}
                      {t.status === "Reviewed" && (
                        <CheckCircle size={22} color="#f59e0b" />
                      )}
                      {t.status === "Not reviewed" && (
                        <AlertCircle size={22} color="#ef4444" />
                      )}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color:
                            t.status === "Active"
                              ? "#10b981"
                              : t.status === "Reviewed"
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      >
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Classes */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 32,
                }}
              >
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
                  Upcoming Classes
                </h3>
                <a
                  href="#"
                  style={{
                    fontSize: 15,
                    color: "#6366f1",
                    textDecoration: "none",
                  }}
                >
                  View all
                </a>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {upcomingClasses.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      padding: 20,
                      backgroundColor: "#f9fafb",
                      borderRadius: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        backgroundColor:
                          c.status === "active" ? "#10b981" : "#e5e7eb",
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {c.status === "active" ? (
                        <CheckCircle size={24} color="#fff" />
                      ) : (
                        <Clock size={24} color="#6b7280" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#111827",
                          margin: "0 0 6px",
                        }}
                      >
                        {c.time} {c.name}
                      </h4>
                      <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                        {c.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fixed Profile Card */}
          <div
            style={{
              position: "fixed",
              top: 100,
              right: 48,
              width: 320,
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 32,
              boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              zIndex: 40,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                backgroundColor: "#e0e7ff",
                borderRadius: "50%",
                backgroundSize: "cover",
              }}
            />
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111827",
                  margin: "0 0 6px",
                }}
              >
                Anna Wilson
              </h4>
              <p
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  margin: "0 0 12px",
                }}
              >
                annawilson@gmail.com
              </p>
              <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
                <div>
                  <span style={{ fontWeight: 700, color: "#111827" }}>
                    Rank 14
                  </span>{" "}
                  / 100
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: "#111827" }}>
                    Classes: 7
                  </span>
                </div>
              </div>
            </div>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "#f3f4f6",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowRight size={18} color="#6b7280" />
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
