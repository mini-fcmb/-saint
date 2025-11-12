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
  BarChart3,
  Plus,
  Eye,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
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
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          backgroundColor: "#f8f9fa",
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "80px",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            padding: "0 40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              flex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#6e56cf",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    border: "3px solid white",
                    borderTop: "none",
                    borderLeft: "none",
                    transform: "rotate(-45deg)",
                  }}
                ></div>
              </div>
              <span
                style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}
              >
                Axicube
              </span>
              <span
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginLeft: "8px",
                }}
              >
                Available for work
              </span>
              <button
                style={{
                  backgroundColor: "#f3f4f6",
                  border: "none",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  color: "#374151",
                }}
              >
                Follow
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backgroundColor: "#f3f4f6",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Search size={20} color="#6b7280" />
              </button>
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backgroundColor: "#f3f4f6",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={20} color="#6b7280" />
              </button>
              <button
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backgroundColor: "#f3f4f6",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Menu size={20} color="#6b7280" />
              </button>
              <button
                style={{
                  backgroundColor: "#4f46e5",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "0 24px",
                  fontSize: "14px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Get in touch
              </button>
            </div>
          </div>
        </header>

        <div style={{ display: "flex", marginTop: "80px" }}>
          {/* Sidebar */}
          <aside
            style={{
              width: sidebarOpen ? "280px" : "80px",
              backgroundColor: "#ffffff",
              borderRight: "1px solid #e5e7eb",
              height: "calc(100vh - 80px)",
              position: "fixed",
              left: 0,
              top: "80px",
              transition: "width 0.3s ease",
              padding: "32px 0",
            }}
          >
            <div style={{ padding: "0 24px", marginBottom: "32px" }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "#f3f4f6",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: sidebarOpen ? "auto" : "0",
                }}
              >
                {sidebarOpen ? (
                  <ChevronLeft size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            </div>

            <nav style={{ padding: "0 16px" }}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedMenu(item.id)}
                    style={{
                      width: "100%",
                      padding: sidebarOpen ? "12px 16px" : "12px",
                      marginBottom: "8px",
                      borderRadius: "12px",
                      backgroundColor:
                        selectedMenu === item.id ? "#eef2ff" : "transparent",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      color: selectedMenu === item.id ? "#4f46e5" : "#6b7280",
                      fontSize: "14px",
                      fontWeight: selectedMenu === item.id ? 500 : 400,
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
                style={{
                  position: "absolute",
                  bottom: "32px",
                  left: "24px",
                  right: "24px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#eef2ff",
                    borderRadius: "16px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      backgroundColor: "#c7d2fe",
                      borderRadius: "50%",
                      backgroundImage:
                        'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2780%27 height=%2780%27 viewBox=%270 0 80 80%27%3E%3Ccircle cx=%2740%27 cy=%2740%27 r=%2738%27 fill=%27%23c7d2fe%27/%3E%3C/svg%3E")',
                      backgroundSize: "cover",
                    }}
                  ></div>
                  <button
                    style={{
                      backgroundColor: "#4f46e5",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px 24px",
                      fontSize: "14px",
                      fontWeight: 500,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Plus size={16} />
                    Create new class chat now
                  </button>
                  <button
                    style={{
                      backgroundColor: "transparent",
                      color: "#4f46e5",
                      border: "none",
                      fontSize: "14px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Create class
                  </button>
                </div>
                <div
                  style={{
                    marginTop: "16px",
                    fontSize: "12px",
                    color: "#9ca3af",
                    textAlign: "center",
                  }}
                >
                  © Atwood School
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main
            style={{
              marginLeft: sidebarOpen ? "280px" : "80px",
              padding: "40px",
              transition: "margin-left 0.3s ease",
              flex: 1,
            }}
          >
            {/* ...other sections remain unchanged... */}

            {/* Calendar (fixed) */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <span style={{ fontSize: "14px", color: "#6b7280" }}>
                  June 2022
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#f3f4f6",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronLeft size={16} color="#6b7280" />
                  </button>
                  <button
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      backgroundColor: "#f3f4f6",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronRight size={16} color="#6b7280" />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <div
                    key={day}
                    style={{
                      textAlign: "center",
                      fontSize: "12px",
                      color: "#9ca3af",
                      fontWeight: 500,
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: "8px",
                }}
              >
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 4;
                  const isCurrent = day === 6;
                  const hasEvent = [6, 13, 16, 20, 27].includes(day);

                  let textColor = "transparent";
                  if (isCurrent) textColor = "white";
                  else if (hasEvent) textColor = "#4f46e5";
                  else if (day > 0 && day <= 30) textColor = "#1f2937";

                  return (
                    <div
                      key={i}
                      style={{
                        height: "32px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        backgroundColor: isCurrent
                          ? "#4f46e5"
                          : hasEvent
                          ? "#eef2ff"
                          : "transparent",
                        color: textColor,
                      }}
                    >
                      {day > 0 && day <= 30 && day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ...remaining sections like Student Tests, Upcoming Classes, User Profile remain unchanged... */}
          </main>
        </div>
      </div>
    </>
  );
}
