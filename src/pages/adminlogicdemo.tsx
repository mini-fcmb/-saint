import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  ArrowUpCircle,
  Link2,
  Settings,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  Bell,
  Menu,
  UserCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";

/* ============================================================================
   TYPES
============================================================================ */

type ID = string;

interface ClassRoom {
  id: ID;
  level: string; // "JSS 1", "SS 2"
  arm: string; // "A", "B"
  session: string; // "2025/2026"
  classTeacherId: ID | null;
  subjectIds: ID[];
  studentIds: ID[];
}

interface Teacher {
  id: ID;
  name: string;
  email: string;
  color: string;
  classIds: ID[];
  subjectIds: ID[];
}

interface Subject {
  id: ID;
  name: string;
  code: string;
}

interface Student {
  id: ID;
  name: string;
  studentId: string;
  email: string;
  classId: ID;
  session: string;
  status: "Active" | "Inactive";
}

interface Announcement {
  id: ID;
  title: string;
  time: string;
}

/* ============================================================================
   MOCK DATA
============================================================================ */

const uid = (() => {
  let n = 1000;
  return (prefix: string) => `${prefix}-${n++}`;
})();

const initialSubjects: Subject[] = [
  { id: uid("sub"), name: "Mathematics", code: "MTH" },
  { id: uid("sub"), name: "English Language", code: "ENG" },
  { id: uid("sub"), name: "Physics", code: "PHY" },
  { id: uid("sub"), name: "Chemistry", code: "CHM" },
  { id: uid("sub"), name: "Biology", code: "BIO" },
  { id: uid("sub"), name: "Further Mathematics", code: "FMT" },
];

const initialTeachers: Teacher[] = [
  { id: uid("tch"), name: "Mr. John Doe", email: "john.doe@sxaint.edu", color: "#3B6FF2", classIds: [], subjectIds: [] },
  { id: uid("tch"), name: "Mrs. Jane Smith", email: "jane.smith@sxaint.edu", color: "#F2A93B", classIds: [], subjectIds: [] },
  { id: uid("tch"), name: "Mr. James Brown", email: "james.brown@sxaint.edu", color: "#3BD6C6", classIds: [], subjectIds: [] },
  { id: uid("tch"), name: "Mrs. Amaka Obi", email: "amaka.obi@sxaint.edu", color: "#B23BF2", classIds: [], subjectIds: [] },
];

const initialClasses: ClassRoom[] = [
  { id: uid("cls"), level: "JSS 1", arm: "A", session: "2025/2026", classTeacherId: null, subjectIds: [], studentIds: [] },
  { id: uid("cls"), level: "JSS 1", arm: "B", session: "2025/2026", classTeacherId: null, subjectIds: [], studentIds: [] },
  { id: uid("cls"), level: "SS 1", arm: "A", session: "2025/2026", classTeacherId: null, subjectIds: [], studentIds: [] },
  { id: uid("cls"), level: "SS 2", arm: "B", session: "2025/2026", classTeacherId: null, subjectIds: [], studentIds: [] },
];

// wire up relationships
initialClasses[0].classTeacherId = initialTeachers[1].id;
initialClasses[1].classTeacherId = initialTeachers[2].id;
initialClasses[2].classTeacherId = initialTeachers[0].id;
initialClasses[3].classTeacherId = initialTeachers[3].id;

initialClasses[2].subjectIds = [initialSubjects[0].id, initialSubjects[1].id, initialSubjects[2].id];
initialClasses[3].subjectIds = [initialSubjects[0].id, initialSubjects[3].id, initialSubjects[5].id];
initialClasses[0].subjectIds = [initialSubjects[0].id, initialSubjects[1].id];
initialClasses[1].subjectIds = [initialSubjects[0].id, initialSubjects[1].id];

initialTeachers[0].classIds = [initialClasses[2].id];
initialTeachers[0].subjectIds = [initialSubjects[0].id, initialSubjects[5].id];
initialTeachers[1].classIds = [initialClasses[0].id];
initialTeachers[1].subjectIds = [initialSubjects[1].id];
initialTeachers[2].classIds = [initialClasses[1].id];
initialTeachers[2].subjectIds = [initialSubjects[2].id];
initialTeachers[3].classIds = [initialClasses[3].id];
initialTeachers[3].subjectIds = [initialSubjects[3].id];

const firstNames = ["Chidi", "Ifeoma", "Tunde", "Amara", "Emeka", "Ngozi", "Bello", "Yusuf", "Fatima", "Grace", "Kelechi", "Bisi", "Tobi", "Chioma", "Sade"];
const lastNames = ["Okafor", "Adeyemi", "Balogun", "Nwosu", "Okonkwo", "Yusuf", "Eze", "Abiodun", "Musa", "Chukwu"];

const initialStudents: Student[] = Array.from({ length: 42 }).map((_, i) => {
  const cls = initialClasses[i % initialClasses.length];
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[(i * 3) % lastNames.length];
  const student: Student = {
    id: uid("stu"),
    name: `${fn} ${ln}`,
    studentId: `SX-${2025000 + i}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}@student.sxaint.edu`,
    classId: cls.id,
    session: "2025/2026",
    status: i % 11 === 0 ? "Inactive" : "Active",
  };
  cls.studentIds.push(student.id);
  return student;
});

const initialAnnouncements: Announcement[] = [
  { id: uid("ann"), title: "New student registrations opened for 2025/2026 session", time: "2h ago" },
  { id: uid("ann"), title: "Mr. John Doe submitted SS 1 A Mathematics scheme of work", time: "5h ago" },
  { id: uid("ann"), title: "Promotion window for JSS 1 closes in 3 days", time: "1d ago" },
  { id: uid("ann"), title: "Term 2 CBT exams scheduled for next week", time: "2d ago" },
];

/* ============================================================================
   SMALL HELPERS
============================================================================ */

function classLabel(c: ClassRoom) {
  return `${c.level} ${c.arm}`;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/* ============================================================================
   REUSABLE UI PRIMITIVES
============================================================================ */

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; width?: number }> = ({
  title,
  onClose,
  children,
  width = 480,
}) => (
  <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="modal-card" style={{ maxWidth: width }}>
      <div className="modal-head">
        <h3>{title}</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="field">
    <span>{label}</span>
    {children}
  </label>
);

const Pill: React.FC<{ tone?: "blue" | "green" | "gray" | "amber"; children: React.ReactNode }> = ({
  tone = "blue",
  children,
}) => <span className={`pill pill-${tone}`}>{children}</span>;

const StatCard: React.FC<{
  label: string;
  value: string | number;
  delta?: string;
  icon: React.ReactNode;
}> = ({ label, value, delta, icon }) => (
  <div className="stat-card">
    <div className="stat-top">
      <span className="stat-icon">{icon}</span>
      {delta && <span className="stat-delta">{delta}</span>}
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

/* Simple inline SVG donut chart (no external chart lib) */
const Donut: React.FC<{ segments: { value: number; color: string; label: string }[]; size?: number }> = ({
  segments,
  size = 132,
}) => {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
        <circle r={r} fill="none" stroke="#EEF3FB" strokeWidth={14} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const circle = (
            <circle
              key={i}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={14}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += dash;
          return circle;
        })}
      </g>
      <text x="50%" y="46%" textAnchor="middle" className="donut-num">
        {total}
      </text>
      <text x="50%" y="62%" textAnchor="middle" className="donut-sub">
        Total
      </text>
    </svg>
  );
};

/* Simple inline SVG bar chart */
const MiniBars: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bars-wrap">
      {data.map((d, i) => (
        <div className="bar-col" key={i}>
          <div className="bar-track">
            <div className="bar-fill" style={{ height: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

type ViewKey = "overview" | "students" | "teachers" | "classes" | "subjects" | "promotions" | "assignments" | "settings";

const NAV: { key: ViewKey; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
  { key: "students", label: "Students", icon: <Users size={18} /> },
  { key: "teachers", label: "Teachers", icon: <GraduationCap size={18} /> },
  { key: "classes", label: "Classes", icon: <Layers size={18} /> },
  { key: "subjects", label: "Subjects", icon: <BookOpen size={18} /> },
  { key: "promotions", label: "Promotions", icon: <ArrowUpCircle size={18} /> },
  { key: "assignments", label: "Assignments", icon: <Link2 size={18} /> },
  { key: "settings", label: "Settings", icon: <Settings size={18} /> },
];

export default function AdminDashboard() {
  const [view, setView] = useState<ViewKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [classes, setClasses] = useState<ClassRoom[]>(initialClasses);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [announcements] = useState<Announcement[]>(initialAnnouncements);

  /* ---------- derived stats ---------- */
  const stats = useMemo(
    () => ({
      students: students.length,
      teachers: teachers.length,
      classes: classes.length,
      subjects: subjects.length,
    }),
    [students, teachers, classes, subjects]
  );

  const classDistribution = useMemo(
    () => classes.map((c) => ({ label: classLabel(c), value: c.studentIds.length })),
    [classes]
  );

  const donutSegments = useMemo(() => {
    const palette = ["#3B6FF2", "#8CB2FF", "#3BD6C6", "#F2A93B", "#B23BF2", "#F26E6E"];
    return classes.map((c, i) => ({
      label: classLabel(c),
      value: c.studentIds.length,
      color: palette[i % palette.length],
    }));
  }, [classes]);

  /* ---------- CRUD: classes ---------- */
  const [classModal, setClassModal] = useState<null | { mode: "create" | "edit"; data?: ClassRoom }>(null);
  const [classDraft, setClassDraft] = useState({ level: "", arm: "", session: "2025/2026", classTeacherId: "" });

  const openCreateClass = () => {
    setClassDraft({ level: "", arm: "", session: "2025/2026", classTeacherId: "" });
    setClassModal({ mode: "create" });
  };
  const openEditClass = (c: ClassRoom) => {
    setClassDraft({ level: c.level, arm: c.arm, session: c.session, classTeacherId: c.classTeacherId ?? "" });
    setClassModal({ mode: "edit", data: c });
  };
  const saveClass = () => {
    if (!classDraft.level || !classDraft.arm) return;
    if (classModal?.mode === "edit" && classModal.data) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classModal.data!.id
            ? { ...c, level: classDraft.level, arm: classDraft.arm, session: classDraft.session, classTeacherId: classDraft.classTeacherId || null }
            : c
        )
      );
    } else {
      setClasses((prev) => [
        ...prev,
        {
          id: uid("cls"),
          level: classDraft.level,
          arm: classDraft.arm,
          session: classDraft.session,
          classTeacherId: classDraft.classTeacherId || null,
          subjectIds: [],
          studentIds: [],
        },
      ]);
    }
    setClassModal(null);
  };
  const deleteClass = (id: ID) => {
    setClasses((prev) => prev.filter((c) => c.id !== id));
    setStudents((prev) => prev.filter((s) => s.classId !== id));
  };

  /* ---------- CRUD: teachers ---------- */
  const [teacherModal, setTeacherModal] = useState<null | { mode: "create" | "edit"; data?: Teacher }>(null);
  const [teacherDraft, setTeacherDraft] = useState({ name: "", email: "", classIds: [] as ID[], subjectIds: [] as ID[] });
  const colorPool = ["#3B6FF2", "#F2A93B", "#3BD6C6", "#B23BF2", "#F26E6E", "#2FBF71"];

  const openCreateTeacher = () => {
    setTeacherDraft({ name: "", email: "", classIds: [], subjectIds: [] });
    setTeacherModal({ mode: "create" });
  };
  const openEditTeacher = (t: Teacher) => {
    setTeacherDraft({ name: t.name, email: t.email, classIds: t.classIds, subjectIds: t.subjectIds });
    setTeacherModal({ mode: "edit", data: t });
  };
  const toggleDraftId = (list: ID[], id: ID) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const saveTeacher = () => {
    if (!teacherDraft.name) return;
    if (teacherModal?.mode === "edit" && teacherModal.data) {
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacherModal.data!.id ? { ...t, ...teacherDraft } : t))
      );
    } else {
      setTeachers((prev) => [
        ...prev,
        { id: uid("tch"), color: colorPool[prev.length % colorPool.length], ...teacherDraft },
      ]);
    }
    setTeacherModal(null);
  };
  const deleteTeacher = (id: ID) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    setClasses((prev) => prev.map((c) => (c.classTeacherId === id ? { ...c, classTeacherId: null } : c)));
  };

  /* ---------- CRUD: subjects ---------- */
  const [subjectModal, setSubjectModal] = useState<null | { mode: "create" | "edit"; data?: Subject }>(null);
  const [subjectDraft, setSubjectDraft] = useState({ name: "", code: "" });

  const openCreateSubject = () => {
    setSubjectDraft({ name: "", code: "" });
    setSubjectModal({ mode: "create" });
  };
  const openEditSubject = (s: Subject) => {
    setSubjectDraft({ name: s.name, code: s.code });
    setSubjectModal({ mode: "edit", data: s });
  };
  const saveSubject = () => {
    if (!subjectDraft.name) return;
    if (subjectModal?.mode === "edit" && subjectModal.data) {
      setSubjects((prev) => prev.map((s) => (s.id === subjectModal.data!.id ? { ...s, ...subjectDraft } : s)));
    } else {
      setSubjects((prev) => [...prev, { id: uid("sub"), ...subjectDraft }]);
    }
    setSubjectModal(null);
  };
  const deleteSubject = (id: ID) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setClasses((prev) => prev.map((c) => ({ ...c, subjectIds: c.subjectIds.filter((x) => x !== id) })));
    setTeachers((prev) => prev.map((t) => ({ ...t, subjectIds: t.subjectIds.filter((x) => x !== id) })));
  };

  /* ---------- CRUD: students ---------- */
  const [studentModal, setStudentModal] = useState<null | { mode: "create" | "edit"; data?: Student }>(null);
  const [studentDraft, setStudentDraft] = useState({ name: "", email: "", classId: "", status: "Active" as Student["status"] });
  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState<string>("all");

  const openCreateStudent = () => {
    setStudentDraft({ name: "", email: "", classId: classes[0]?.id ?? "", status: "Active" });
    setStudentModal({ mode: "create" });
  };
  const openEditStudent = (s: Student) => {
    setStudentDraft({ name: s.name, email: s.email, classId: s.classId, status: s.status });
    setStudentModal({ mode: "edit", data: s });
  };
  const saveStudent = () => {
    if (!studentDraft.name || !studentDraft.classId) return;
    if (studentModal?.mode === "edit" && studentModal.data) {
      const prevClassId = studentModal.data.classId;
      setStudents((prev) => prev.map((s) => (s.id === studentModal.data!.id ? { ...s, ...studentDraft } : s)));
      if (prevClassId !== studentDraft.classId) {
        setClasses((prev) =>
          prev.map((c) => {
            if (c.id === prevClassId) return { ...c, studentIds: c.studentIds.filter((id) => id !== studentModal.data!.id) };
            if (c.id === studentDraft.classId) return { ...c, studentIds: [...c.studentIds, studentModal.data!.id] };
            return c;
          })
        );
      }
    } else {
      const id = uid("stu");
      setStudents((prev) => [
        ...prev,
        { id, studentId: `SX-${2025000 + prev.length}`, session: "2025/2026", ...studentDraft },
      ]);
      setClasses((prev) => prev.map((c) => (c.id === studentDraft.classId ? { ...c, studentIds: [...c.studentIds, id] } : c)));
    }
    setStudentModal(null);
  };
  const deleteStudent = (s: Student) => {
    setStudents((prev) => prev.filter((x) => x.id !== s.id));
    setClasses((prev) => prev.map((c) => (c.id === s.classId ? { ...c, studentIds: c.studentIds.filter((id) => id !== s.id) } : c)));
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.studentId.toLowerCase().includes(studentSearch.toLowerCase());
      const matchesClass = studentClassFilter === "all" || s.classId === studentClassFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, studentSearch, studentClassFilter]);

  /* ---------- Promotions ---------- */
  const [promoteFromClass, setPromoteFromClass] = useState<string>(classes[0]?.id ?? "");
  const [selectedStudentIds, setSelectedStudentIds] = useState<ID[]>([]);
  const [promoteModal, setPromoteModal] = useState(false);
  const [promoteToClass, setPromoteToClass] = useState<string>("");

  const studentsInPromoteClass = students.filter((s) => s.classId === promoteFromClass);

  const toggleSelectStudent = (id: ID) =>
    setSelectedStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSelectAllInClass = () => {
    const ids = studentsInPromoteClass.map((s) => s.id);
    const allSelected = ids.every((id) => selectedStudentIds.includes(id));
    setSelectedStudentIds(allSelected ? selectedStudentIds.filter((id) => !ids.includes(id)) : Array.from(new Set([...selectedStudentIds, ...ids])));
  };
  const confirmPromotion = () => {
    if (!promoteToClass || selectedStudentIds.length === 0) return;
    setStudents((prev) => prev.map((s) => (selectedStudentIds.includes(s.id) ? { ...s, classId: promoteToClass } : s)));
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === promoteFromClass) return { ...c, studentIds: c.studentIds.filter((id) => !selectedStudentIds.includes(id)) };
        if (c.id === promoteToClass) return { ...c, studentIds: Array.from(new Set([...c.studentIds, ...selectedStudentIds])) };
        return c;
      })
    );
    setSelectedStudentIds([]);
    setPromoteModal(false);
  };

  /* ---------- Assignments ---------- */
  const [assignClassId, setAssignClassId] = useState<string>(classes[0]?.id ?? "");
  const assignClass = classes.find((c) => c.id === assignClassId) ?? classes[0];

  const setClassTeacher = (classId: ID, teacherId: ID | null) => {
    setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, classTeacherId: teacherId } : c)));
    if (teacherId) {
      setTeachers((prev) => prev.map((t) => (t.id === teacherId ? { ...t, classIds: Array.from(new Set([...t.classIds, classId])) } : t)));
    }
  };
  const toggleClassSubject = (classId: ID, subjectId: ID) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === classId ? { ...c, subjectIds: toggleDraftId(c.subjectIds, subjectId) } : c))
    );
  };
  const subjectTeacherMap = (classId: ID, subjectId: ID) =>
    teachers.find((t) => t.classIds.includes(classId) && t.subjectIds.includes(subjectId));
  const setSubjectTeacherForClass = (classId: ID, subjectId: ID, teacherId: ID) => {
    setTeachers((prev) =>
      prev.map((t) => {
        if (t.id !== teacherId) return t;
        return {
          ...t,
          classIds: Array.from(new Set([...t.classIds, classId])),
          subjectIds: Array.from(new Set([...t.subjectIds, subjectId])),
        };
      })
    );
  };

  /* ============================================================================
     RENDER: NAV
  ============================================================================ */

  const NavList = (
    <nav className="nav-list">
      {NAV.map((n) => (
        <button
          key={n.key}
          className={`nav-item ${view === n.key ? "active" : ""}`}
          onClick={() => {
            setView(n.key);
            setSidebarOpen(false);
          }}
        >
          <span className="nav-icon">{n.icon}</span>
          <span>{n.label}</span>
          {view === n.key && <ChevronRight size={14} className="nav-chevron" />}
        </button>
      ))}
    </nav>
  );

  /* ============================================================================
     RENDER: OVERVIEW
  ============================================================================ */

  const Overview = (
    <>
      <div className="stat-grid">
        <StatCard label="Total Students" value={stats.students} delta="+4.2%" icon={<Users size={18} />} />
        <StatCard label="Total Teachers" value={stats.teachers} delta="+1" icon={<GraduationCap size={18} />} />
        <StatCard label="Total Classes" value={stats.classes} icon={<Layers size={18} />} />
        <StatCard label="Total Subjects" value={stats.subjects} icon={<BookOpen size={18} />} />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h3>Class distribution</h3>
            <span className="muted-tag">This session</span>
          </div>
          <MiniBars data={classDistribution} />
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Students by class</h3>
          </div>
          <div className="donut-row">
            <Donut segments={donutSegments} />
            <div className="donut-legend">
              {donutSegments.map((s, i) => (
                <div key={i} className="legend-row">
                  <span className="legend-dot" style={{ background: s.color }} />
                  <span className="legend-label">{s.label}</span>
                  <span className="legend-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h3>Teacher activity</h3>
          </div>
          <ul className="activity-list">
            {teachers.map((t) => (
              <li key={t.id} className="activity-row">
                <span className="avatar" style={{ background: t.color }}>
                  {initialsOf(t.name)}
                </span>
                <div className="activity-text">
                  <strong>{t.name}</strong>
                  <span>
                    {t.classIds.length} class{t.classIds.length === 1 ? "" : "es"} &middot; {t.subjectIds.length} subject
                    {t.subjectIds.length === 1 ? "" : "s"}
                  </span>
                </div>
                <UserCheck size={16} className="activity-check" />
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Recent activity</h3>
          </div>
          <ul className="feed-list">
            {announcements.map((a) => (
              <li key={a.id} className="feed-row">
                <span className="feed-dot" />
                <div className="feed-text">
                  <p>{a.title}</p>
                  <span>
                    <Clock size={12} /> {a.time}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Quick actions</h3>
        </div>
        <div className="quick-actions">
          <button className="quick-btn" onClick={openCreateStudent}>
            <Users size={16} /> Add student
          </button>
          <button className="quick-btn" onClick={openCreateTeacher}>
            <GraduationCap size={16} /> Add teacher
          </button>
          <button className="quick-btn" onClick={openCreateClass}>
            <Layers size={16} /> Create class
          </button>
          <button className="quick-btn" onClick={() => setView("promotions")}>
            <ArrowUpCircle size={16} /> Promote students
          </button>
        </div>
      </div>
    </>
  );

  /* ============================================================================
     RENDER: CLASSES
  ============================================================================ */

  const ClassesView = (
    <div className="panel">
      <div className="panel-head">
        <h3>Classes</h3>
        <button className="primary-btn" onClick={openCreateClass}>
          <Plus size={15} /> Create class
        </button>
      </div>
      <div className="card-grid">
        {classes.map((c) => {
          const teacher = teachers.find((t) => t.id === c.classTeacherId);
          return (
            <div className="entity-card" key={c.id}>
              <div className="entity-card-top">
                <div>
                  <h4>{classLabel(c)}</h4>
                  <span className="muted-tag">{c.session}</span>
                </div>
                <div className="entity-actions">
                  <button className="icon-btn" onClick={() => openEditClass(c)}>
                    <Pencil size={14} />
                  </button>
                  <button className="icon-btn danger" onClick={() => deleteClass(c.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="entity-row">
                <span className="entity-label">Class teacher</span>
                <span>{teacher ? teacher.name : "Unassigned"}</span>
              </div>
              <div className="entity-row">
                <span className="entity-label">Students</span>
                <Pill tone="blue">{c.studentIds.length}</Pill>
              </div>
              <div className="entity-row">
                <span className="entity-label">Subjects</span>
                <span className="chip-wrap">
                  {c.subjectIds.slice(0, 3).map((sid) => (
                    <span key={sid} className="chip">
                      {subjects.find((s) => s.id === sid)?.code}
                    </span>
                  ))}
                  {c.subjectIds.length > 3 && <span className="chip">+{c.subjectIds.length - 3}</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ============================================================================
     RENDER: TEACHERS
  ============================================================================ */

  const TeachersView = (
    <div className="panel">
      <div className="panel-head">
        <h3>Teachers</h3>
        <button className="primary-btn" onClick={openCreateTeacher}>
          <Plus size={15} /> Add teacher
        </button>
      </div>
      <div className="card-grid">
        {teachers.map((t) => (
          <div className="entity-card" key={t.id}>
            <div className="entity-card-top">
              <div className="entity-identity">
                <span className="avatar" style={{ background: t.color }}>
                  {initialsOf(t.name)}
                </span>
                <div>
                  <h4>{t.name}</h4>
                  <span className="muted-tag">{t.email}</span>
                </div>
              </div>
              <div className="entity-actions">
                <button className="icon-btn" onClick={() => openEditTeacher(t)}>
                  <Pencil size={14} />
                </button>
                <button className="icon-btn danger" onClick={() => deleteTeacher(t.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="entity-row">
              <span className="entity-label">Classes</span>
              <span className="chip-wrap">
                {t.classIds.length === 0 && <span className="muted-tag">None</span>}
                {t.classIds.map((cid) => (
                  <span key={cid} className="chip">
                    {classLabel(classes.find((c) => c.id === cid)!)}
                  </span>
                ))}
              </span>
            </div>
            <div className="entity-row">
              <span className="entity-label">Subjects</span>
              <span className="chip-wrap">
                {t.subjectIds.length === 0 && <span className="muted-tag">None</span>}
                {t.subjectIds.map((sid) => (
                  <span key={sid} className="chip chip-alt">
                    {subjects.find((s) => s.id === sid)?.name}
                  </span>
                ))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ============================================================================
     RENDER: SUBJECTS
  ============================================================================ */

  const SubjectsView = (
    <div className="panel">
      <div className="panel-head">
        <h3>Subjects</h3>
        <button className="primary-btn" onClick={openCreateSubject}>
          <Plus size={15} /> Add subject
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Code</th>
            <th>Classes</th>
            <th>Teachers</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => {
            const classesFor = classes.filter((c) => c.subjectIds.includes(s.id));
            const teachersFor = teachers.filter((t) => t.subjectIds.includes(s.id));
            return (
              <tr key={s.id}>
                <td className="cell-strong">{s.name}</td>
                <td>
                  <Pill tone="gray">{s.code}</Pill>
                </td>
                <td>
                  <span className="chip-wrap">
                    {classesFor.length === 0 ? <span className="muted-tag">None</span> : classesFor.map((c) => (
                      <span key={c.id} className="chip">
                        {classLabel(c)}
                      </span>
                    ))}
                  </span>
                </td>
                <td>
                  <span className="chip-wrap">
                    {teachersFor.length === 0 ? <span className="muted-tag">None</span> : teachersFor.map((t) => (
                      <span key={t.id} className="chip chip-alt">
                        {t.name}
                      </span>
                    ))}
                  </span>
                </td>
                <td>
                  <div className="entity-actions">
                    <button className="icon-btn" onClick={() => openEditSubject(s)}>
                      <Pencil size={14} />
                    </button>
                    <button className="icon-btn danger" onClick={() => deleteSubject(s.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  /* ============================================================================
     RENDER: STUDENTS
  ============================================================================ */

  const StudentsView = (
    <div className="panel">
      <div className="panel-head">
        <h3>Students</h3>
        <button className="primary-btn" onClick={openCreateStudent}>
          <Plus size={15} /> Add student
        </button>
      </div>
      <div className="toolbar">
        <div className="search-box">
          <Search size={15} />
          <input
            placeholder="Search by name or student ID"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
        </div>
        <select value={studentClassFilter} onChange={(e) => setStudentClassFilter(e.target.value)}>
          <option value="all">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classLabel(c)}
            </option>
          ))}
        </select>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Student ID</th>
            <th>Class</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((s) => (
            <tr key={s.id}>
              <td>
                <div className="entity-identity">
                  <span className="avatar avatar-sm">{initialsOf(s.name)}</span>
                  <div>
                    <div className="cell-strong">{s.name}</div>
                    <span className="muted-tag">{s.email}</span>
                  </div>
                </div>
              </td>
              <td>{s.studentId}</td>
              <td>{classLabel(classes.find((c) => c.id === s.classId)!)}</td>
              <td>
                <Pill tone={s.status === "Active" ? "green" : "amber"}>{s.status}</Pill>
              </td>
              <td>
                <div className="entity-actions">
                  <button className="icon-btn" onClick={() => openEditStudent(s)}>
                    <Pencil size={14} />
                  </button>
                  <button className="icon-btn danger" onClick={() => deleteStudent(s)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filteredStudents.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-row">
                No students match this search or filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  /* ============================================================================
     RENDER: PROMOTIONS
  ============================================================================ */

  const PromotionsView = (
    <div className="panel">
      <div className="panel-head">
        <h3>Promote students</h3>
      </div>
      <div className="promo-flow">
        <span className="flow-chip">{promoteFromClass ? classLabel(classes.find((c) => c.id === promoteFromClass)!) : "Select class"}</span>
        <ChevronRight size={16} />
        <span className="flow-chip">Select students</span>
        <ChevronRight size={16} />
        <span className="flow-chip">Choose new class</span>
        <ChevronRight size={16} />
        <span className="flow-chip flow-chip-accent">Confirm</span>
      </div>

      <div className="toolbar">
        <select
          value={promoteFromClass}
          onChange={(e) => {
            setPromoteFromClass(e.target.value);
            setSelectedStudentIds([]);
          }}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classLabel(c)}
            </option>
          ))}
        </select>
        <button className="ghost-btn" onClick={toggleSelectAllInClass}>
          Select all in class
        </button>
        <span className="muted-tag">{selectedStudentIds.length} selected</span>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th />
            <th>Student</th>
            <th>Student ID</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {studentsInPromoteClass.map((s) => (
            <tr key={s.id}>
              <td>
                <input type="checkbox" checked={selectedStudentIds.includes(s.id)} onChange={() => toggleSelectStudent(s.id)} />
              </td>
              <td className="cell-strong">{s.name}</td>
              <td>{s.studentId}</td>
              <td>
                <Pill tone={s.status === "Active" ? "green" : "amber"}>{s.status}</Pill>
              </td>
            </tr>
          ))}
          {studentsInPromoteClass.length === 0 && (
            <tr>
              <td colSpan={4} className="empty-row">
                No students in this class.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="panel-footer">
        <button
          className="primary-btn"
          disabled={selectedStudentIds.length === 0}
          onClick={() => {
            setPromoteToClass("");
            setPromoteModal(true);
          }}
        >
          Promote selected students
        </button>
      </div>

      {promoteModal && (
        <Modal title="Confirm promotion" onClose={() => setPromoteModal(false)}>
          <p className="modal-copy">
            Move <strong>{selectedStudentIds.length}</strong> student{selectedStudentIds.length === 1 ? "" : "s"} from{" "}
            <strong>{classLabel(classes.find((c) => c.id === promoteFromClass)!)}</strong> to a new class.
          </p>
          <Field label="Promote to">
            <select value={promoteToClass} onChange={(e) => setPromoteToClass(e.target.value)}>
              <option value="">Choose a class</option>
              {classes
                .filter((c) => c.id !== promoteFromClass)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {classLabel(c)}
                  </option>
                ))}
            </select>
          </Field>
          <div className="modal-actions">
            <button className="ghost-btn" onClick={() => setPromoteModal(false)}>
              Cancel
            </button>
            <button className="primary-btn" disabled={!promoteToClass} onClick={confirmPromotion}>
              <CheckCircle2 size={15} /> Confirm promotion
            </button>
          </div>
        </Modal>
      )}
    </div>
  );

  /* ============================================================================
     RENDER: ASSIGNMENTS
  ============================================================================ */

  const AssignmentsView = (
    <div className="panel">
      <div className="panel-head">
        <h3>Class assignments</h3>
        <select value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)}>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classLabel(c)}
            </option>
          ))}
        </select>
      </div>

      {assignClass && (
        <>
          <div className="assign-section">
            <span className="entity-label">Class teacher</span>
            <select
              value={assignClass.classTeacherId ?? ""}
              onChange={(e) => setClassTeacher(assignClass.id, e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="assign-section">
            <span className="entity-label">Subjects for this class</span>
            <div className="subject-assign-grid">
              {subjects.map((s) => {
                const active = assignClass.subjectIds.includes(s.id);
                const currentTeacher = subjectTeacherMap(assignClass.id, s.id);
                return (
                  <div className={`subject-assign-row ${active ? "active" : ""}`} key={s.id}>
                    <label className="check-row">
                      <input type="checkbox" checked={active} onChange={() => toggleClassSubject(assignClass.id, s.id)} />
                      {s.name}
                    </label>
                    {active && (
                      <select
                        value={currentTeacher?.id ?? ""}
                        onChange={(e) => setSubjectTeacherForClass(assignClass.id, s.id, e.target.value)}
                      >
                        <option value="">Assign teacher</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="assign-section">
            <span className="entity-label">Students in {classLabel(assignClass)}</span>
            <Pill tone="blue">{assignClass.studentIds.length} students</Pill>
          </div>
        </>
      )}
    </div>
  );

  /* ============================================================================
     RENDER: SETTINGS (stub)
  ============================================================================ */

  const SettingsView = (
    <div className="panel">
      <div className="panel-head">
        <h3>Settings</h3>
      </div>
      <p className="modal-copy">Academic session, roles, and platform preferences will live here.</p>
    </div>
  );

  const viewMap: Record<ViewKey, React.ReactNode> = {
    overview: Overview,
    students: StudentsView,
    teachers: TeachersView,
    classes: ClassesView,
    subjects: SubjectsView,
    promotions: PromotionsView,
    assignments: AssignmentsView,
    settings: SettingsView,
  };

  const titleMap: Record<ViewKey, string> = {
    overview: "Overview",
    students: "Students",
    teachers: "Teachers",
    classes: "Classes",
    subjects: "Subjects",
    promotions: "Promotions",
    assignments: "Assignments",
    settings: "Settings",
  };

  /* ============================================================================
     ROOT LAYOUT
  ============================================================================ */

  return (
    <div className="admin-shell">
      <style>{CSS}</style>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">SX</span>
          <span className="brand-name">SXaint</span>
        </div>
        {NavList}
      </aside>

      {sidebarOpen && <div className="sidebar-scrim" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-main">
        <header className="admin-header">
          <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div>
            <h1>{titleMap[view]}</h1>
            <span className="header-sub">School administration &middot; 2025/2026 session</span>
          </div>
          <div className="header-actions">
            <button className="icon-btn">
              <Bell size={18} />
            </button>
            <span className="avatar">AD</span>
          </div>
        </header>

        <main className="admin-content">{viewMap[view]}</main>
      </div>

      {/* ---------------- Modals ---------------- */}

      {classModal && (
        <Modal title={classModal.mode === "edit" ? "Edit class" : "Create class"} onClose={() => setClassModal(null)}>
          <Field label="Class level">
            <input
              placeholder="e.g. JSS 1, SS 2"
              value={classDraft.level}
              onChange={(e) => setClassDraft({ ...classDraft, level: e.target.value })}
            />
          </Field>
          <Field label="Class arm">
            <input
              placeholder="e.g. A, B"
              value={classDraft.arm}
              onChange={(e) => setClassDraft({ ...classDraft, arm: e.target.value })}
            />
          </Field>
          <Field label="Academic session">
            <input value={classDraft.session} onChange={(e) => setClassDraft({ ...classDraft, session: e.target.value })} />
          </Field>
          <Field label="Class teacher">
            <select
              value={classDraft.classTeacherId}
              onChange={(e) => setClassDraft({ ...classDraft, classTeacherId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="modal-actions">
            <button className="ghost-btn" onClick={() => setClassModal(null)}>
              Cancel
            </button>
            <button className="primary-btn" onClick={saveClass}>
              Save class
            </button>
          </div>
        </Modal>
      )}

      {teacherModal && (
        <Modal title={teacherModal.mode === "edit" ? "Edit teacher" : "Add teacher"} onClose={() => setTeacherModal(null)}>
          <Field label="Full name">
            <input value={teacherDraft.name} onChange={(e) => setTeacherDraft({ ...teacherDraft, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input value={teacherDraft.email} onChange={(e) => setTeacherDraft({ ...teacherDraft, email: e.target.value })} />
          </Field>
          <Field label="Assigned classes">
            <div className="check-grid">
              {classes.map((c) => (
                <label className="check-row" key={c.id}>
                  <input
                    type="checkbox"
                    checked={teacherDraft.classIds.includes(c.id)}
                    onChange={() => setTeacherDraft({ ...teacherDraft, classIds: toggleDraftId(teacherDraft.classIds, c.id) })}
                  />
                  {classLabel(c)}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Assigned subjects">
            <div className="check-grid">
              {subjects.map((s) => (
                <label className="check-row" key={s.id}>
                  <input
                    type="checkbox"
                    checked={teacherDraft.subjectIds.includes(s.id)}
                    onChange={() => setTeacherDraft({ ...teacherDraft, subjectIds: toggleDraftId(teacherDraft.subjectIds, s.id) })}
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </Field>
          <div className="modal-actions">
            <button className="ghost-btn" onClick={() => setTeacherModal(null)}>
              Cancel
            </button>
            <button className="primary-btn" onClick={saveTeacher}>
              Save teacher
            </button>
          </div>
        </Modal>
      )}

      {subjectModal && (
        <Modal title={subjectModal.mode === "edit" ? "Edit subject" : "Add subject"} onClose={() => setSubjectModal(null)}>
          <Field label="Subject name">
            <input value={subjectDraft.name} onChange={(e) => setSubjectDraft({ ...subjectDraft, name: e.target.value })} />
          </Field>
          <Field label="Subject code">
            <input value={subjectDraft.code} onChange={(e) => setSubjectDraft({ ...subjectDraft, code: e.target.value })} />
          </Field>
          <div className="modal-actions">
            <button className="ghost-btn" onClick={() => setSubjectModal(null)}>
              Cancel
            </button>
            <button className="primary-btn" onClick={saveSubject}>
              Save subject
            </button>
          </div>
        </Modal>
      )}

      {studentModal && (
        <Modal title={studentModal.mode === "edit" ? "Edit student" : "Add student"} onClose={() => setStudentModal(null)}>
          <Field label="Full name">
            <input value={studentDraft.name} onChange={(e) => setStudentDraft({ ...studentDraft, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input value={studentDraft.email} onChange={(e) => setStudentDraft({ ...studentDraft, email: e.target.value })} />
          </Field>
          <Field label="Class">
            <select value={studentDraft.classId} onChange={(e) => setStudentDraft({ ...studentDraft, classId: e.target.value })}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabel(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={studentDraft.status}
              onChange={(e) => setStudentDraft({ ...studentDraft, status: e.target.value as Student["status"] })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
          <div className="modal-actions">
            <button className="ghost-btn" onClick={() => setStudentModal(null)}>
              Cancel
            </button>
            <button className="primary-btn" onClick={saveStudent}>
              Save student
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================================
   STYLES
============================================================================ */

const CSS = `
:root{
  --bg:#eef3fb;
  --card:#ffffff;
  --card-soft:#f4f8ff;
  --border:#e3ebf7;
  --accent:#3b6ff2;
  --accent-dark:#2451d6;
  --accent-soft:#e7efff;
  --text-1:#17233d;
  --text-2:#6b7a99;
  --green:#1f9d63; --green-soft:#e6f7ee;
  --amber:#b9790a; --amber-soft:#fdf1de;
  --radius-lg:24px; --radius-md:16px; --radius-sm:10px;
  --shadow:0 10px 30px -14px rgba(23,35,61,0.16);
}
*{box-sizing:border-box;}
.admin-shell{
  display:flex; min-height:100vh; background:var(--bg);
  font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif;
  color:var(--text-1);
}
.sidebar{
  width:250px; background:var(--card); margin:16px 0 16px 16px;
  border-radius:var(--radius-lg); padding:20px 14px; display:flex; flex-direction:column; gap:22px;
  box-shadow:var(--shadow); flex-shrink:0; height:calc(100vh - 32px); position:sticky; top:16px;
}
.brand{ display:flex; align-items:center; gap:10px; padding:4px 8px; }
.brand-mark{ width:36px; height:36px; border-radius:12px; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; }
.brand-name{ font-weight:700; font-size:16px; letter-spacing:-0.02em; }
.nav-list{ display:flex; flex-direction:column; gap:4px; }
.nav-item{
  display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:12px;
  border:none; background:transparent; color:var(--text-2); font-size:14px; font-weight:500;
  cursor:pointer; text-align:left; width:100%; transition:background .15s, color .15s;
}
.nav-item:hover{ background:var(--card-soft); color:var(--text-1); }
.nav-item.active{ background:var(--accent); color:#fff; }
.nav-icon{ display:flex; }
.nav-chevron{ margin-left:auto; }
.sidebar-scrim{ display:none; }

.admin-main{ flex:1; min-width:0; padding:16px 20px 32px; }
.admin-header{
  display:flex; align-items:center; gap:14px; padding:16px 22px; margin-bottom:18px;
  background:var(--card); border-radius:var(--radius-lg); box-shadow:var(--shadow);
}
.admin-header h1{ font-size:20px; margin:0; letter-spacing:-0.02em; }
.header-sub{ font-size:12.5px; color:var(--text-2); }
.header-actions{ margin-left:auto; display:flex; align-items:center; gap:12px; }
.mobile-only{ display:none; }

.admin-content{ display:flex; flex-direction:column; gap:18px; }

.stat-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.stat-card{ background:var(--card); border:1px solid var(--border); border-radius:var(--radius-md); padding:18px; box-shadow:var(--shadow); }
.stat-top{ display:flex; justify-content:space-between; align-items:center; }
.stat-icon{ width:34px; height:34px; border-radius:10px; background:var(--accent-soft); color:var(--accent); display:flex; align-items:center; justify-content:center; }
.stat-delta{ font-size:12px; color:var(--green); font-weight:600; }
.stat-value{ font-size:26px; font-weight:700; margin-top:12px; letter-spacing:-0.02em; }
.stat-label{ font-size:13px; color:var(--text-2); margin-top:2px; }

.grid-2{ display:grid; grid-template-columns:1.2fr 1fr; gap:16px; }

.panel{ background:var(--card); border:1px solid var(--border); border-radius:var(--radius-lg); padding:20px 22px; box-shadow:var(--shadow); }
.panel-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; gap:12px; flex-wrap:wrap; }
.panel-head h3{ font-size:15.5px; margin:0; letter-spacing:-0.01em; }
.panel-footer{ margin-top:16px; display:flex; justify-content:flex-end; }
.muted-tag{ font-size:12px; color:var(--text-2); }

.bars-wrap{ display:flex; align-items:flex-end; gap:14px; height:160px; padding-top:8px; }
.bar-col{ display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; height:100%; }
.bar-track{ width:100%; height:100%; display:flex; align-items:flex-end; background:var(--card-soft); border-radius:10px; overflow:hidden; }
.bar-fill{ width:100%; background:linear-gradient(180deg,#5b8bff,var(--accent)); border-radius:10px 10px 0 0; transition:height .3s; }
.bar-label{ font-size:11.5px; color:var(--text-2); }

.donut-row{ display:flex; align-items:center; gap:20px; }
.donut-num{ font-size:20px; font-weight:700; fill:var(--text-1); }
.donut-sub{ font-size:10px; fill:var(--text-2); }
.donut-legend{ display:flex; flex-direction:column; gap:8px; flex:1; }
.legend-row{ display:flex; align-items:center; gap:8px; font-size:13px; }
.legend-dot{ width:9px; height:9px; border-radius:50%; }
.legend-label{ flex:1; color:var(--text-2); }
.legend-value{ font-weight:600; }

.activity-list, .feed-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
.activity-row{ display:flex; align-items:center; gap:12px; }
.activity-text{ display:flex; flex-direction:column; font-size:13px; flex:1; }
.activity-text span{ color:var(--text-2); font-size:12px; }
.activity-check{ color:var(--green); }
.feed-row{ display:flex; gap:10px; align-items:flex-start; }
.feed-dot{ width:7px; height:7px; margin-top:6px; border-radius:50%; background:var(--accent); flex-shrink:0; }
.feed-text p{ margin:0; font-size:13px; }
.feed-text span{ font-size:11.5px; color:var(--text-2); display:flex; align-items:center; gap:4px; margin-top:3px; }

.avatar{ width:34px; height:34px; border-radius:50%; background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; }
.avatar-sm{ width:28px; height:28px; font-size:11px; background:var(--text-2); }

.quick-actions{ display:flex; gap:12px; flex-wrap:wrap; }
.quick-btn{ display:flex; align-items:center; gap:8px; padding:10px 16px; border-radius:12px; border:1px solid var(--border); background:var(--card-soft); color:var(--text-1); font-size:13.5px; font-weight:500; cursor:pointer; }
.quick-btn:hover{ background:var(--accent-soft); }

.primary-btn{ display:flex; align-items:center; gap:6px; background:var(--accent); color:#fff; border:none; padding:10px 16px; border-radius:12px; font-size:13.5px; font-weight:600; cursor:pointer; }
.primary-btn:hover{ background:var(--accent-dark); }
.primary-btn:disabled{ opacity:.5; cursor:not-allowed; }
.ghost-btn{ background:transparent; border:1px solid var(--border); padding:10px 16px; border-radius:12px; font-size:13.5px; font-weight:500; cursor:pointer; color:var(--text-1); }
.icon-btn{ width:34px; height:34px; border-radius:10px; border:1px solid var(--border); background:var(--card); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--text-2); }
.icon-btn:hover{ background:var(--card-soft); color:var(--text-1); }
.icon-btn.danger:hover{ background:#fdeaea; color:#c53030; border-color:#f6c9c9; }

.card-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
.entity-card{ border:1px solid var(--border); background:var(--card-soft); border-radius:var(--radius-md); padding:16px; display:flex; flex-direction:column; gap:10px; }
.entity-card-top{ display:flex; justify-content:space-between; align-items:flex-start; }
.entity-card-top h4{ margin:0; font-size:15px; }
.entity-identity{ display:flex; gap:10px; align-items:center; }
.entity-actions{ display:flex; gap:6px; }
.entity-row{ display:flex; justify-content:space-between; align-items:center; font-size:12.5px; gap:10px; }
.entity-label{ color:var(--text-2); }

.chip-wrap{ display:flex; flex-wrap:wrap; gap:6px; justify-content:flex-end; }
.chip{ background:var(--accent-soft); color:var(--accent-dark); font-size:11px; font-weight:600; padding:4px 9px; border-radius:999px; }
.chip-alt{ background:#fbeee0; color:#a15c15; }

.pill{ font-size:11.5px; font-weight:600; padding:4px 10px; border-radius:999px; display:inline-block; }
.pill-blue{ background:var(--accent-soft); color:var(--accent-dark); }
.pill-green{ background:var(--green-soft); color:var(--green); }
.pill-amber{ background:var(--amber-soft); color:var(--amber); }
.pill-gray{ background:#eef1f6; color:var(--text-2); }

.data-table{ width:100%; border-collapse:collapse; font-size:13.5px; }
.data-table th{ text-align:left; color:var(--text-2); font-weight:600; font-size:12px; padding:10px 12px; border-bottom:1px solid var(--border); }
.data-table td{ padding:12px; border-bottom:1px solid var(--border); vertical-align:middle; }
.cell-strong{ font-weight:600; }
.empty-row{ text-align:center; color:var(--text-2); padding:24px; }

.toolbar{ display:flex; gap:10px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
.search-box{ display:flex; align-items:center; gap:8px; background:var(--card-soft); border:1px solid var(--border); border-radius:12px; padding:9px 12px; flex:1; min-width:220px; color:var(--text-2); }
.search-box input{ border:none; background:transparent; outline:none; flex:1; font-size:13.5px; color:var(--text-1); }
select, .field input{
  border:1px solid var(--border); border-radius:10px; padding:9px 12px; font-size:13.5px; background:var(--card); color:var(--text-1); outline:none;
}
select:focus, .field input:focus{ border-color:var(--accent); }

.promo-flow{ display:flex; align-items:center; gap:8px; margin-bottom:16px; flex-wrap:wrap; color:var(--text-2); }
.flow-chip{ background:var(--card-soft); border:1px solid var(--border); padding:7px 14px; border-radius:999px; font-size:12.5px; font-weight:600; }
.flow-chip-accent{ background:var(--accent-soft); color:var(--accent-dark); border-color:transparent; }

.assign-section{ margin-bottom:20px; display:flex; flex-direction:column; gap:10px; }
.subject-assign-grid{ display:flex; flex-direction:column; gap:8px; }
.subject-assign-row{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; border:1px solid var(--border); border-radius:12px; background:var(--card); }
.subject-assign-row.active{ background:var(--card-soft); border-color:var(--accent); }
.check-row{ display:flex; align-items:center; gap:8px; font-size:13.5px; }
.check-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:8px; max-height:160px; overflow-y:auto; padding:4px; }

.modal-overlay{ position:fixed; inset:0; background:rgba(23,35,61,0.45); display:flex; align-items:center; justify-content:center; z-index:50; padding:20px; }
.modal-card{ background:var(--card); border-radius:var(--radius-lg); width:100%; box-shadow:0 30px 60px -20px rgba(0,0,0,0.35); max-height:88vh; overflow-y:auto; }
.modal-head{ display:flex; justify-content:space-between; align-items:center; padding:18px 22px; border-bottom:1px solid var(--border); }
.modal-head h3{ margin:0; font-size:16px; }
.modal-body{ padding:20px 22px; display:flex; flex-direction:column; gap:14px; }
.modal-copy{ font-size:13.5px; color:var(--text-2); }
.modal-actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:6px; }
.field{ display:flex; flex-direction:column; gap:6px; font-size:12.5px; color:var(--text-2); font-weight:600; }

@media (max-width:1024px){
  .grid-2{ grid-template-columns:1fr; }
  .stat-grid{ grid-template-columns:repeat(2,1fr); }
}
@media (max-width:768px){
  .sidebar{ position:fixed; left:0; top:0; margin:0; height:100vh; z-index:60; transform:translateX(-110%); transition:transform .25s ease; border-radius:0 24px 24px 0; }
  .sidebar.open{ transform:translateX(0); }
  .sidebar-scrim{ display:block; position:fixed; inset:0; background:rgba(23,35,61,0.4); z-index:55; }
  .mobile-only{ display:flex; }
  .admin-main{ padding:12px; }
  .stat-grid{ grid-template-columns:1fr 1fr; }
  .check-grid{ grid-template-columns:1fr; }
}
@media (max-width:425px){
  .stat-grid{ grid-template-columns:1fr; }
  .data-table{ font-size:12px; }
  .toolbar{ flex-direction:column; align-items:stretch; }
}
`;
