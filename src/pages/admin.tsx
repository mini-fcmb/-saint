import { useEffect, useMemo, useState } from "react";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

interface Teacher {
  id: string;
  fullName: string;
  email?: string;
  className?: string;
  subjects?: string[]; 
  [k: string]: any;
}

interface Student {
  id: string;
  fullName: string;
  email?: string;
  className?: string;
  subjects?: string[];
  [k: string]: any;
}

const ADMIN_EMAIL = "minibossfcmb@proton.me";

// Desired class order: Primary5 → SS3
const CLASS_ORDER = ["P5", "P6", "JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

// Helper to normalize class names from the DB (e.g. "SSS 3" -> "SS3", "Primary 5" -> "P5")
const normalizeClass = (c?: string) => {
  if (!c) return "";
  const s = c.toString().trim().toUpperCase().replace(/\s+/g, "");
  // Accept some common variants
  if (s.startsWith("P5") || s.startsWith("PRIMARY5")) return "P5";
  if (s.startsWith("P6") || s.startsWith("PRIMARY6")) return "P6";
  if (s.startsWith("JSS1") || s.startsWith("JSS-1") || s === "JSSI")
    return "JSS1";
  if (s.startsWith("JSS2") || s.startsWith("JSS-2") || s === "JSSII")
    return "JSS2";
  if (s.startsWith("JSS3") || s.startsWith("JSS-3") || s === "JSSIII")
    return "JSS3";
  if (s.includes("SS3") || s.includes("SSS3") || s.includes("SSS3"))
    return "SS3";
  if (s.includes("SS2") || s.includes("SSS2")) return "SS2";
  if (s.includes("SS1") || s.includes("SSS1")) return "SS1";
  // fallback: try to match "SS" + digit
  const match = s.match(/SS+(\d)/);
  if (match) return `SS${match[1]}`;
  // fallback: return original trimmed
  return c;
};

const AdminDashboard = () => {
  const {
    updateTeacherProfile,
    promoteStudents,
    refreshStudents,
  } = useFirebaseStore();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const [teacherClass, setTeacherClass] = useState("");
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const [oldClass, setOldClass] = useState("");
  const [newClass, setNewClass] = useState("");

  // UI state for expanded subject dropdowns
  const [expandedStudentRows, setExpandedStudentRows] = useState<
    Record<string, boolean>
  >({});
  const [expandedTeacherRows, setExpandedTeacherRows] = useState<
    Record<string, boolean>
  >({});

  // Fetch teachers & students once
  useEffect(() => {
    const fetchTeachers = async () => {
      const snap = await getDocs(collection(db, "teachers"));
      const data = snap.docs.map((d) => {
        const raw = d.data() as any;
        // Normalize subjects if they exist; ensure array of strings
        const subjects = Array.isArray(raw.subjects)
          ? raw.subjects.map((s: any) => String(s))
          : [];
        const normalizedClass = normalizeClass(
          raw.className || raw.class || ""
        );
        return {
          id: d.id,
          ...raw,
          className: normalizedClass,
          subjects,
        } as Teacher;
      });
      setTeachers(data);
    };

    const fetchStudents = async () => {
      const snap = await getDocs(collection(db, "students"));
      const data = snap.docs.map((d) => {
        const raw = d.data() as any;
        const subjects = Array.isArray(raw.subjects)
          ? raw.subjects.map((s: any) => String(s))
          : [];
        const normalizedClass = normalizeClass(
          raw.className || raw.class || ""
        );
        return {
          id: d.id,
          ...raw,
          className: normalizedClass,
          subjects,
        } as Student;
      });
      setStudents(data);
    };

    fetchTeachers();
    fetchStudents();
  }, []);

  // Sort by class order (CLASS_ORDER), then by name A→Z
  const sortByClassThenName = <
    T extends { className?: string; fullName: string }
  >(
    arr: T[]
  ) =>
    [...arr].sort((a, b) => {
      const aClassIndex = CLASS_ORDER.indexOf(a.className || "");
      const bClassIndex = CLASS_ORDER.indexOf(b.className || "");
      const ai = aClassIndex === -1 ? Number.MAX_SAFE_INTEGER : aClassIndex;
      const bi = bClassIndex === -1 ? Number.MAX_SAFE_INTEGER : bClassIndex;
      if (ai !== bi) return ai - bi;
      return a.fullName.localeCompare(b.fullName);
    });

  // Exclude admin by email (explicit)
  const filteredTeachers = useMemo(
    () =>
      sortByClassThenName(
        teachers.filter(
          (t) => (t.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()
        )
      ),
    [teachers]
  );

  const filteredStudents = useMemo(
    () =>
      sortByClassThenName(
        students.filter(
          (s) => (s.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()
        )
      ),
    [students]
  );

  // Handle selecting teacher for management (populate class + subjects)
  const handleSelectTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      setSelectedTeacherId(null);
      setTeacherClass("");
      setTeacherSubjects([]);
      return;
    }
    setSelectedTeacherId(teacherId);
    setTeacherClass(teacher.className || "");
    // subjects sorted alphabetically
    const subs = Array.isArray(teacher.subjects)
      ? [...teacher.subjects].sort((a, b) => a.localeCompare(b))
      : [];
    setTeacherSubjects(subs);
  };

  const handleSubjectToggle = (subject: string) => {
    setTeacherSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSaveTeacher = async () => {
    if (!selectedTeacherId || !teacherClass) {
      setMessage("Please select a teacher and class.");
      return;
    }
    // Save as array of strings per Option A
    const res = await updateTeacherProfile(selectedTeacherId, {
      className: teacherClass,
      subjects: teacherSubjects,
    });
    if (res.success) {
      setMessage("Teacher profile updated ✅");
      refreshStudents();
    } else {
      setMessage(`Error: ${res.error}`);
    }
  };

  const handlePromoteStudents = async () => {
    if (!oldClass || !newClass || oldClass === newClass) {
      setMessage("Select valid classes for promotion.");
      return;
    }
    const res = await promoteStudents(oldClass, newClass);
    if (res.success) {
      setMessage(`Students promoted from ${oldClass} → ${newClass} ✅`);
      refreshStudents();
    } else setMessage(`Error: ${res.error}`);
  };

  // Expand toggles
  const toggleStudentRow = (id: string) =>
    setExpandedStudentRows((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleTeacherRow = (id: string) =>
    setExpandedTeacherRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // Render helpers
  const renderSubjectsCellForStudent = (s: Student) => {
    const subs = (s.subjects || [])
      .slice()
      .map(String)
      .sort((a, b) => a.localeCompare(b));
    const first = subs.length ? subs[0] : "—";
    const expanded = !!expandedStudentRows[s.id];
    return (
      <div className="subjects-cell">
        <button className="mini-toggle" onClick={() => toggleStudentRow(s.id)}>
          <span className="first">{first}</span>
          <span className="chev">{expanded ? "▾" : "▸"}</span>
        </button>
        {expanded && (
          <ul className="subjects-list">
            {subs.length ? (
              subs.map((sb) => <li key={sb}>{sb}</li>)
            ) : (
              <li className="muted">No subjects</li>
            )}
          </ul>
        )}
      </div>
    );
  };

  const renderSubjectsCellForTeacher = (t: Teacher) => {
    const subs = (t.subjects || [])
      .slice()
      .map(String)
      .sort((a, b) => a.localeCompare(b));
    const first = subs.length ? subs[0] : "—";
    const expanded = !!expandedTeacherRows[t.id];
    return (
      <div className="subjects-cell">
        <button className="mini-toggle" onClick={() => toggleTeacherRow(t.id)}>
          <span className="first">{first}</span>
          <span className="chev">{expanded ? "▾" : "▸"}</span>
        </button>
        {expanded && (
          <ul className="subjects-list">
            {subs.length ? (
              subs.map((sb) => (
                <li key={sb}>
                  <span>{sb}</span>
                  <span className="dot">•</span>
                  <small className="class-note">{t.className || "N/A"}</small>
                </li>
              ))
            ) : (
              <li className="muted">No subjects</li>
            )}
          </ul>
        )}
      </div>
    );
  };

  // available classes for selects (normalized labels)
  const availableClasses = [
    "P5",
    "P6",
    "JSS1",
    "JSS2",
    "JSS3",
    "SS1",
    "SS2",
    "SS3",
  ];

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Admin Panel</h2>
        <nav>
          <ul>
            <li>Dashboard</li>
            <li>Teachers</li>
            <li>Students</li>
            <li>Reports</li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <input type="search" placeholder="Search..." />
          <div className="topbar-actions">
            <button>Notifications</button>
            <button>Profile</button>
          </div>
        </div>

        {/* Teacher Management */}
        <section className="management">
          <h2>Teacher Management</h2>

          <div className="row">
            <select
              value={selectedTeacherId || ""}
              onChange={(e) => handleSelectTeacher(e.target.value)}
            >
              <option value="">Select Teacher</option>
              {filteredTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} {t.className ? ` — ${t.className}` : ""}
                </option>
              ))}
            </select>

            <select
              value={teacherClass}
              onChange={(e) => setTeacherClass(e.target.value)}
            >
              <option value="">Select Class</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button onClick={handleSaveTeacher}>Save Teacher</button>
          </div>

          {/* subjects toggles when a teacher is selected */}
          {selectedTeacherId && (
            <div className="teacher-subjects">
              <p style={{ margin: 0 }}>Assigned subjects (click to toggle):</p>
              <div className="subjects-edit">
                {getSubjectsForDisplay(teacherSubjects).map((subj) => (
                  <button
                    key={subj}
                    className={
                      teacherSubjects.includes(subj) ? "chip selected" : "chip"
                    }
                    onClick={() => handleSubjectToggle(subj)}
                  >
                    {subj}
                  </button>
                ))}
                {teacherSubjects.length === 0 && (
                  <small className="muted">No subjects assigned yet</small>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Promote Students */}
        <section className="management">
          <h2>Promote Students</h2>
          <div className="row">
            <select
              value={oldClass}
              onChange={(e) => setOldClass(e.target.value)}
            >
              <option value="">From Class</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
            >
              <option value="">To Class</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button onClick={handlePromoteStudents}>Promote</button>
          </div>
        </section>

        {/* Students Table */}
        <section className="management">
          <h2>All Students</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full name</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Subjects</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.fullName}</td>
                    <td>{s.email || "N/A"}</td>
                    <td>{s.className || "N/A"}</td>
                    <td>{renderSubjectsCellForStudent(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Teachers Table */}
        <section className="management">
          <h2>All Teachers</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full name</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Subjects</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id}>
                    <td>{t.fullName}</td>
                    <td>{t.email || "N/A"}</td>
                    <td>{t.className || "N/A"}</td>
                    <td>{renderSubjectsCellForTeacher(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {message && <p className="message">{message}</p>}
      </main>

      <style>{`
        :root { --muted:#777; --accent:#2b6cb0; --bg:#f7f8fc; }
        .dashboard-container { display:flex; height:100vh; font-family: Inter, Arial, sans-serif; }
        .sidebar { width:220px; background:var(--bg); padding:20px; border-right:1px solid #e6e9ef; }
        .sidebar h2 { margin:0 0 12px 0; font-size:18px; }
        .sidebar ul { list-style:none; padding:0; margin:0; }
        .sidebar li { padding:8px 0; color:#333; }
        .main-content { flex:1; padding:20px; overflow:auto; }
        .topbar { display:flex; justify-content:space-between; margin-bottom:18px; gap:12px; }
        .topbar input { width:50%; padding:8px 10px; border-radius:6px; border:1px solid #ddd; }
        .management { background:#fff; padding:14px; border-radius:8px; margin-bottom:18px; box-shadow:0 0 0 1px rgba(0,0,0,0.02); }
        .row { display:flex; gap:10px; align-items:center; margin-top:8px; }
        select { padding:8px; border-radius:6px; border:1px solid #ddd; }
        button { padding:8px 10px; border-radius:6px; border:1px solid #d0d7df; background:#fff; cursor:pointer; }
        button.selected { background:var(--accent); color:#fff; border-color:var(--accent); }
        .teacher-subjects { margin-top:12px; }
        .subjects-edit { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
        .chip { padding:6px 10px; border-radius:16px; border:1px solid #ddd; background:#fafafa; cursor:pointer; }
        .chip.selected { background:var(--accent); color:#fff; border-color:var(--accent); }
        .table-wrap { overflow:auto; }
        table { width:100%; border-collapse:collapse; margin-top:10px; }
        th, td { border:1px solid #eee; padding:10px; text-align:left; vertical-align:top; }
        th { background:#fafafa; font-weight:600; }
        .subjects-cell { display:flex; flex-direction:column; gap:6px; }
        .mini-toggle { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; border:1px solid #e6e9ef; background:#fff; cursor:pointer; }
        .mini-toggle .chev { font-size:12px; color:var(--muted); margin-left:6px; }
        .subjects-list { margin:0; padding-left:18px; }
        .subjects-list li { margin:6px 0; list-style:disc; font-size:14px; }
        .subjects-list .muted { color:var(--muted); }
        .class-note { margin-left:8px; color:var(--muted); }
        .dot { margin:0 8px; color:#999; }
        .message { color:green; margin-top:10px; font-weight:600; }
        .muted { color:var(--muted); }
        .dashboard-container {
            display: flex;
            height: 100vh;
            font-family: Arial, sans-serif;
          }
          
          .sidebar {
            width: 220px;
            background: #f7f8fc;
            padding: 20px;
            border-right: 1px solid #ddd;
          }
          
          .sidebar h2 {
            font-size: 20px;
            margin-bottom: 20px;
          }
          
          .sidebar nav ul {
            list-style: none;
            padding: 0;
          }
          
          .sidebar nav li {
            padding: 10px 0;
            cursor: pointer;
          }
          
          .main-content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            scrollbar-width:thin;
            scrollbar-color:transparent transparent;
          }
          
          .topbar {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          
          .topbar input {
            width: 50%;
            padding: 8px;
          }
          
          .cards-grid {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
          }
          
          .card {
            flex: 1;
            background: #fff;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #ddd;
          }
          
          .management {
            background: #fff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          
          .management select, .management button {
            margin-top: 10px;
          }
          
          button.selected {
            background-color: #4a90e2;
            color: white;
          }
          .message {
            color: green;
            font-weight: bold;
          }
          
      `}</style>
    </div>
  );
};

// small helper to unify subject display when editing teacherSubjects
function getSubjectsForDisplay(list: string[]) {
  // You could return a master list. For now, just return the sorted unique list given.
  return Array.from(new Set(list.slice().sort((a, b) => a.localeCompare(b))));
}

export default AdminDashboard;
