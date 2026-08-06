// src/pages/Admin Dashboard/admin.tsx

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  deleteUser,
  onAuthStateChanged,
  getAuth,
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Bell,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Grid2X2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings,
  Users,
  User2,
  ArrowUpRight,
  Zap,
  GraduationCap,
  School,
  UsersRound,
  X,
  Search,
  Trash2,
  Mail,
  ArrowUpCircle,
  BookOpen,
  Layers,
  LogOut,
  Trash,
  CheckCheck,
  Camera,
  ShieldAlert,
} from "lucide-react";

import { db, storage } from "../../firebase/config";
import defaultFirebaseApp from "../../firebase/config";
import Logo from "../../assets/logo.png";
import DefaultProfile from "../../assets/default.jpg";

const firebaseConfig = defaultFirebaseApp.options;
const auth = getAuth(defaultFirebaseApp);

/* ============================================================================
   BRAND COLORS — matched to signup.tsx's --accent / --accent-dark. Swap
   these three if your actual logo colors differ.
============================================================================ */
const BRAND_LIGHT = "#4C7DFF";
const BRAND_PRIMARY = "#2563EB";
const BRAND_DARK = "#141D4D";
const BRAND_SOFT = "#EEF1FB";

/* ============================================================================
   TYPES
============================================================================ */

type ID = string;
type Status = "Active" | "Inactive" | "Pending Invitation" | "Archived";

interface TeacherDoc {
  id: ID;
  uid: string | null;
  fullname: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  status: Status;
  inviteAccepted: boolean;
  emailVerified: boolean;
  subjects: ID[];
  classes: ID[];
  arms: string[];
  role: "teacher" | "class_teacher";
  schoolId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface StudentDoc {
  id: ID;
  uid: string | null;
  authEmail: string | null;
  fullname: string;
  registrationNumber: string;
  gender?: "Male" | "Female";
  dateOfBirth?: string;
  classId: ID | null;
  arm?: string;
  subjects: ID[];
  status: Status;
  passwordChanged: boolean;
  schoolId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface ClassDoc {
  id: ID;
  level: string;
  arm: string;
  session: string;
  subjects: ID[];
  students: ID[];
  teachers: ID[];
  classTeacher: ID | null;
  schoolId: string;
}

interface SubjectDoc {
  id: ID;
  name: string;
  code: string;
  description?: string;
  status: "Active" | "Archived";
  schoolId: string;
}

interface NotificationDoc {
  id: ID;
  title: string;
  read: boolean;
  createdAt?: Timestamp;
  schoolId: string;
}

interface ActivityDoc {
  id: ID;
  action: string;
  description: string;
  performedBy: string;
  createdAt?: Timestamp;
  schoolId: string;
}

interface SchoolDoc {
  id: ID;
  schoolName: string;
  adminName: string;
  phone: string;
  email: string;
  address?: string;
  adminUid: string;
}

interface AdminUserDoc {
  id: ID;
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: string;
  schoolId: string;
  schoolName: string;
}

const CLASS_LEVELS = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

/* ============================================================================
   FIREBASE AUTH HELPERS (module scope — no schoolId dependency)
============================================================================ */

async function createAuthUserIsolated(email: string, tempPassword: string) {
  const secondaryApp = initializeApp(
    firebaseConfig,
    `secondary-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      tempPassword,
    );
    return cred.user.uid;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}

async function sendInviteEmail(email: string) {
  const secondaryApp = initializeApp(
    firebaseConfig,
    `secondary-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  try {
    await sendPasswordResetEmail(getAuth(secondaryApp), email);
  } finally {
    await deleteApp(secondaryApp).catch(() => {});
  }
}

function randomTempPassword() {
  return `Tmp-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
function generateDefaultStudentPassword(schoolName: string) {
  const clean = (schoolName || "School").replace(/\s+/g, "").slice(0, 8);
  return `${clean}@123`;
}

/* ============================================================================
   GENERIC REALTIME HOOKS
============================================================================ */

function useLiveCollection<T extends { id: ID }>(
  collectionName: string,
  constraints: any[],
  enabled: boolean,
): { data: T[]; loading: boolean } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const constraintsKey = JSON.stringify(
    constraints.map((c) => c?.toString?.() ?? ""),
  );

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, collectionName), ...constraints);
    const unsub = onSnapshot(
      q,
      (snap) => {
        setData(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as T[],
        );
        setLoading(false);
      },
      (err) => {
        console.error(`onSnapshot(${collectionName}) failed`, err);
        setLoading(false);
      },
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintsKey, enabled]);

  return { data, loading };
}

function useLiveDoc<T>(
  collectionName: string,
  id: string | null,
): { data: (T & { id: string }) | null; loading: boolean } {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, collectionName, id),
      (snap) => {
        setData(
          snap.exists()
            ? ({ id: snap.id, ...(snap.data() as any) } as T & { id: string })
            : null,
        );
        setLoading(false);
      },
      (err) => {
        console.error(`onSnapshot(${collectionName}/${id}) failed`, err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [collectionName, id]);

  return { data, loading };
}

/* ============================================================================
   SMALL HELPERS
============================================================================ */

function classLabel(c?: ClassDoc | null) {
  if (!c) return "Unassigned";
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
function timeAgo(ts?: Timestamp) {
  if (!ts) return "";
  const diffMs = Date.now() - ts.toDate().getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
const promotionOrder = (level: string) => CLASS_LEVELS.indexOf(level);

/* ============================================================================
   UI PRIMITIVES
============================================================================ */

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  accent?: string;
}> = ({ title, onClose, children, wide, accent = BRAND_PRIMARY }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0F2E]/50 backdrop-blur-sm p-4"
    onMouseDown={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[88vh] overflow-y-auto rounded-[28px] bg-white shadow-2xl`}
    >
      <div
        className="h-[5px] w-full rounded-t-[28px]"
        style={{
          background: `linear-gradient(90deg, ${accent}, ${BRAND_DARK})`,
        }}
      />
      <div className="flex items-center justify-between px-6 py-4">
        <h3 className="text-base font-semibold text-[#1A1D21]">{title}</h3>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-full text-[#6B7280] hover:bg-[#F4F7FB]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-4 px-6 pb-6">{children}</div>
    </div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#6B7280]">
    {label}
    {children}
  </label>
);

const inputCls = `w-full rounded-xl border border-[#E8EAF0] bg-white px-3 py-2.5 text-sm text-[#1A1D21] outline-none focus:border-[${BRAND_PRIMARY}] transition-colors`;

const PrimaryBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = "",
  style,
  ...props
}) => (
  <button
    {...props}
    style={{
      background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
      ...style,
    }}
    className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${className}`}
  />
);
const GhostBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = "",
  ...props
}) => (
  <button
    {...props}
    className={`rounded-full border border-[#E8EAF0] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1D21] hover:bg-[#F7F8FC] transition-colors ${className}`}
  />
);
const DangerBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = "",
  ...props
}) => (
  <button
    {...props}
    className={`rounded-full border border-[#F6C9C9] bg-white px-5 py-2.5 text-sm font-semibold text-[#C53030] hover:bg-[#FDEAEA] transition-colors ${className}`}
  />
);
const Pill: React.FC<{
  tone?: "blue" | "green" | "gray" | "amber";
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ tone = "blue", children, onClick }) => {
  const tones: Record<string, string> = {
    blue: `bg-[${BRAND_SOFT}] text-[${BRAND_DARK}]`,
    green: "bg-[#E6F7EE] text-[#1F9D63]",
    amber: "bg-[#FDF1DE] text-[#B9790A]",
    gray: "bg-[#EEF1F6] text-[#6B7280]",
  };
  const Comp: any = onClick ? "button" : "span";
  return (
    <Comp
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]} ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      {children}
    </Comp>
  );
};
const statusTone = (s: Status): "blue" | "green" | "gray" | "amber" =>
  s === "Active"
    ? "green"
    : s === "Pending Invitation"
      ? "amber"
      : s === "Archived"
        ? "gray"
        : "amber";

const RemovableChip: React.FC<{
  label: string;
  onRemove: () => void;
  alt?: boolean;
}> = ({ label, onRemove, alt }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
      alt
        ? "bg-[#FBEEE0] text-[#A15C15]"
        : `bg-[${BRAND_SOFT}] text-[${BRAND_DARK}]`
    }`}
  >
    {label}
    <button
      onClick={onRemove}
      className="grid h-3.5 w-3.5 place-items-center rounded-full hover:bg-black/10"
    >
      <X className="h-2.5 w-2.5" />
    </button>
  </span>
);

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

type ViewKey =
  | "Dashboard"
  | "Projects"
  | "Team"
  | "Time"
  | "Reports"
  | "Files"
  | "Settings";
const NAV: { key: ViewKey; label: string }[] = [
  { key: "Dashboard", label: "Dashboard" },
  { key: "Team", label: "Teachers" },
  { key: "Projects", label: "Classes" },
  { key: "Time", label: "Students" },
  { key: "Reports", label: "Promotions" },
  { key: "Files", label: "Subjects" },
  { key: "Settings", label: "Settings" },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewKey>("Dashboard");

  /* ---- auth state -> schoolId ---- */
  const [adminUid, setAdminUid] = useState<string | null | undefined>(
    undefined,
  ); // undefined = not resolved yet
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) =>
      setAdminUid(u ? u.uid : null),
    );
    return () => unsub();
  }, []);
  const schoolId = adminUid ?? null;
  const ready = adminUid !== undefined;

  const { data: schoolDoc } = useLiveDoc<SchoolDoc>("schools", schoolId);
  const { data: adminUserDoc } = useLiveDoc<AdminUserDoc>("users", schoolId);
  const currentAdminName =
    adminUserDoc?.fullName || schoolDoc?.adminName || "Admin";
  const currentAdminPhoto = adminUserDoc?.photoURL || "";
  const currentSchoolName = schoolDoc?.schoolName || "Your School";

  /* ---- live collections (only once we know schoolId) ---- */
  const enabled = !!schoolId;
  const { data: teachers } = useLiveCollection<TeacherDoc>(
    "teachers",
    [where("schoolId", "==", schoolId ?? "_")],
    enabled,
  );
  const { data: students } = useLiveCollection<StudentDoc>(
    "students",
    [where("schoolId", "==", schoolId ?? "_")],
    enabled,
  );
  const { data: classes } = useLiveCollection<ClassDoc>(
    "classes",
    [where("schoolId", "==", schoolId ?? "_")],
    enabled,
  );
  const { data: subjects } = useLiveCollection<SubjectDoc>(
    "subjects",
    [where("schoolId", "==", schoolId ?? "_")],
    enabled,
  );
  const { data: notifications } = useLiveCollection<NotificationDoc>(
    "notifications",
    [
      where("schoolId", "==", schoolId ?? "_"),
      orderBy("createdAt", "desc"),
      fsLimit(50),
    ],
    enabled,
  );
  const { data: activity } = useLiveCollection<ActivityDoc>(
    "activityLogs",
    [
      where("schoolId", "==", schoolId ?? "_"),
      orderBy("createdAt", "desc"),
      fsLimit(20),
    ],
    enabled,
  );

  const unreadCount = notifications.filter((n) => !n.read).length;
  const classById = useMemo(
    () => new Map(classes.map((c) => [c.id, c])),
    [classes],
  );
  const teacherById = useMemo(
    () => new Map(teachers.map((t) => [t.id, t])),
    [teachers],
  );
  const subjectById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );

  const stats = {
    classes: classes.length,
    students: students.length,
    teachers: teachers.length,
    subjects: subjects.length,
    pendingInvites: teachers.filter((t) => t.status === "Pending Invitation")
      .length,
    activeTeachers: teachers.filter((t) => t.status === "Active").length,
    awaitingPasswordChange: students.filter((s) => !s.passwordChanged).length,
  };

  /* ---- inner helpers that close over schoolId / currentAdminName ---- */
  const withMeta = (extra: Record<string, any>) => ({
    ...extra,
    schoolId,
    createdBy: currentAdminName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const logActivity = async (action: string, description: string) => {
    if (!schoolId) return;
    await addDoc(collection(db, "activityLogs"), {
      action,
      description,
      performedBy: currentAdminName,
      schoolId,
      createdAt: serverTimestamp(),
    });
  };
  const pushNotification = async (title: string) => {
    if (!schoolId) return;
    await addDoc(collection(db, "notifications"), {
      title,
      read: false,
      schoolId,
      createdAt: serverTimestamp(),
    });
  };

  /* ---- global search ---- */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return { teachers: [], students: [], classes: [], subjects: [] };
    return {
      teachers: teachers
        .filter(
          (t) =>
            t.fullname.toLowerCase().includes(term) ||
            t.email.toLowerCase().includes(term),
        )
        .slice(0, 5),
      students: students
        .filter(
          (s) =>
            s.fullname.toLowerCase().includes(term) ||
            s.registrationNumber.toLowerCase().includes(term),
        )
        .slice(0, 5),
      classes: classes
        .filter((c) => classLabel(c).toLowerCase().includes(term))
        .slice(0, 5),
      subjects: subjects
        .filter(
          (s) =>
            s.name.toLowerCase().includes(term) ||
            s.code.toLowerCase().includes(term),
        )
        .slice(0, 5),
    };
  }, [searchTerm, teachers, students, classes, subjects]);

  /* ============================================================================
     CREATE CHOOSER
  ============================================================================ */
  const [createChooserOpen, setCreateChooserOpen] = useState(false);

  /* ============================================================================
     TEACHER CRUD + INVITE
  ============================================================================ */
  const [teacherModal, setTeacherModal] = useState<null | { mode: "create" }>(
    null,
  );
  const [teacherDraft, setTeacherDraft] = useState({ fullname: "", email: "" });
  const [teacherBusy, setTeacherBusy] = useState(false);

  const openCreateTeacher = () => {
    setTeacherDraft({ fullname: "", email: "" });
    setTeacherModal({ mode: "create" });
  };
  const inviteTeacher = async () => {
    if (!teacherDraft.fullname || !teacherDraft.email || !schoolId) return;
    setTeacherBusy(true);
    try {
      const uid = await createAuthUserIsolated(
        teacherDraft.email,
        randomTempPassword(),
      );
      await setDoc(
        doc(db, "teachers", uid),
        withMeta({
          uid,
          fullname: teacherDraft.fullname,
          email: teacherDraft.email,
          status: "Pending Invitation",
          inviteAccepted: false,
          emailVerified: false,
          subjects: [],
          classes: [],
          arms: [],
          role: "teacher",
        }),
      );
      await sendInviteEmail(teacherDraft.email);
      await logActivity(
        "Teacher Created",
        `${teacherDraft.fullname} invited as teacher`,
      );
      await pushNotification(`Invitation sent to ${teacherDraft.fullname}`);
      setTeacherModal(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Could not invite teacher.");
    } finally {
      setTeacherBusy(false);
    }
  };
  const patchTeacher = async (t: TeacherDoc, patch: Partial<TeacherDoc>) => {
    await updateDoc(doc(db, "teachers", t.id), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  };
  const deleteTeacher = async (t: TeacherDoc) => {
    if (!confirm(`Remove ${t.fullname}?`)) return;
    await deleteDoc(doc(db, "teachers", t.id));
    const batch = writeBatch(db);
    classes.forEach((c) => {
      if (c.classTeacher === t.id)
        batch.update(doc(db, "classes", c.id), { classTeacher: null });
    });
    await batch.commit();
    await logActivity("Teacher Removed", `${t.fullname} removed`);
  };
  const ARMS = ["A", "B", "C", "D"];
  const toggleTeacherArm = (t: TeacherDoc, arm: string) =>
    patchTeacher(t, {
      arms: t.arms.includes(arm)
        ? t.arms.filter((a) => a !== arm)
        : [...t.arms, arm],
    });

  /* ============================================================================
     STUDENT CRUD
  ============================================================================ */
  const [studentModal, setStudentModal] = useState<null | { mode: "create" }>(
    null,
  );
  const [studentDraft, setStudentDraft] = useState({
    fullname: "",
    registrationNumber: "",
    defaultPassword: generateDefaultStudentPassword(""),
    gender: "Male" as "Male" | "Female",
    dateOfBirth: "",
    classId: "",
  });
  const [studentBusy, setStudentBusy] = useState(false);

  const openCreateStudent = () => {
    const regNo = `SX-${Date.now().toString().slice(-6)}`;
    setStudentDraft({
      fullname: "",
      registrationNumber: regNo,
      defaultPassword: generateDefaultStudentPassword(currentSchoolName),
      gender: "Male",
      dateOfBirth: "",
      classId: classes[0]?.id ?? "",
    });
    setStudentModal({ mode: "create" });
  };
  const createStudent = async () => {
    if (
      !studentDraft.fullname ||
      !studentDraft.registrationNumber ||
      !studentDraft.classId ||
      !schoolId
    )
      return;
    setStudentBusy(true);
    try {
      const authEmail = `${studentDraft.registrationNumber.toLowerCase().replace(/\s+/g, "")}@students.school.local`;
      const uid = await createAuthUserIsolated(
        authEmail,
        studentDraft.defaultPassword,
      );
      await setDoc(
        doc(db, "students", uid),
        withMeta({
          uid,
          authEmail,
          fullname: studentDraft.fullname,
          registrationNumber: studentDraft.registrationNumber,
          gender: studentDraft.gender,
          dateOfBirth: studentDraft.dateOfBirth,
          classId: studentDraft.classId,
          subjects: [],
          status: "Active",
          passwordChanged: false,
        }),
      );
      const cls = classById.get(studentDraft.classId);
      await updateDoc(doc(db, "classes", studentDraft.classId), {
        students: Array.from(new Set([...(cls?.students ?? []), uid])),
      });
      await logActivity(
        "Student Created",
        `${studentDraft.fullname} registered (${studentDraft.registrationNumber})`,
      );
      await pushNotification(
        `New student registered: ${studentDraft.fullname}`,
      );
      setStudentModal(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Could not create student.");
    } finally {
      setStudentBusy(false);
    }
  };
  const deleteStudent = async (s: StudentDoc) => {
    if (!confirm(`Remove ${s.fullname}?`)) return;
    await deleteDoc(doc(db, "students", s.id));
    if (s.classId) {
      const c = classById.get(s.classId);
      if (c)
        await updateDoc(doc(db, "classes", s.classId), {
          students: c.students.filter((id) => id !== s.id),
        });
    }
    await logActivity("Student Removed", `${s.fullname} removed`);
  };
  const toggleStudentStatus = async (s: StudentDoc) => {
    const next: Status = s.status === "Active" ? "Inactive" : "Active";
    await updateDoc(doc(db, "students", s.id), {
      status: next,
      updatedAt: serverTimestamp(),
    });
    await logActivity("Student Status Changed", `${s.fullname} marked ${next}`);
  };
  const transferStudent = async (s: StudentDoc, newClassId: string) => {
    if (!newClassId || newClassId === s.classId) return;
    const batch = writeBatch(db);
    if (s.classId) {
      const oldClass = classById.get(s.classId);
      if (oldClass)
        batch.update(doc(db, "classes", oldClass.id), {
          students: oldClass.students.filter((id) => id !== s.id),
        });
    }
    const newClass = classById.get(newClassId);
    if (newClass)
      batch.update(doc(db, "classes", newClassId), {
        students: Array.from(new Set([...newClass.students, s.id])),
      });
    batch.update(doc(db, "students", s.id), {
      classId: newClassId,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    await logActivity(
      "Student Transferred",
      `${s.fullname} moved to ${classLabel(newClass)}`,
    );
  };

  /* ---- promotions (upward only) ---- */
  const [promoteFromClass, setPromoteFromClass] = useState<string>("");
  const [promoteToClass, setPromoteToClass] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<ID[]>([]);
  useEffect(() => {
    if (!promoteFromClass && classes.length) setPromoteFromClass(classes[0].id);
  }, [classes, promoteFromClass]);

  const studentsInPromoteClass = students.filter(
    (s) => s.classId === promoteFromClass,
  );
  const fromClass = classById.get(promoteFromClass);
  const validPromotionTargets = classes.filter(
    (c) =>
      !!fromClass &&
      promotionOrder(c.level) === promotionOrder(fromClass.level) + 1,
  );

  const confirmPromotion = async () => {
    if (!promoteToClass || selectedStudentIds.length === 0 || !fromClass)
      return;
    const toClass = classById.get(promoteToClass);
    if (!toClass) return;
    if (promotionOrder(toClass.level) <= promotionOrder(fromClass.level)) {
      alert("Promotion can only move students to a higher class level.");
      return;
    }
    const batch = writeBatch(db);
    selectedStudentIds.forEach((sid) =>
      batch.update(doc(db, "students", sid), {
        classId: promoteToClass,
        updatedAt: serverTimestamp(),
      }),
    );
    batch.update(doc(db, "classes", fromClass.id), {
      students: fromClass.students.filter(
        (id) => !selectedStudentIds.includes(id),
      ),
    });
    batch.update(doc(db, "classes", toClass.id), {
      students: Array.from(
        new Set([...toClass.students, ...selectedStudentIds]),
      ),
    });
    await batch.commit();
    await logActivity(
      "Student Promoted",
      `${selectedStudentIds.length} student(s) promoted ${fromClass.level} -> ${toClass.level}`,
    );
    await pushNotification(
      `${selectedStudentIds.length} student(s) promoted to ${classLabel(toClass)}`,
    );
    setSelectedStudentIds([]);
    setPromoteToClass("");
  };

  /* ============================================================================
     CLASS CRUD
  ============================================================================ */
  const [classModal, setClassModal] = useState<null | { mode: "create" }>(null);
  const [classDraft, setClassDraft] = useState({
    level: CLASS_LEVELS[0],
    arm: "A",
    session: "2025/2026",
  });

  const saveClass = async () => {
    if (!schoolId) return;
    await addDoc(
      collection(db, "classes"),
      withMeta({
        ...classDraft,
        subjects: [],
        students: [],
        teachers: [],
        classTeacher: null,
      }),
    );
    await logActivity(
      "Class Created",
      `${classDraft.level} ${classDraft.arm} created`,
    );
    await pushNotification(
      `New class created: ${classDraft.level} ${classDraft.arm}`,
    );
    setClassModal(null);
  };
  const deleteClassDoc = async (c: ClassDoc) => {
    if (
      !confirm(
        `Delete ${classLabel(c)}? Students in this class will be unassigned.`,
      )
    )
      return;
    await deleteDoc(doc(db, "classes", c.id));
    await logActivity("Class Archived", `${classLabel(c)} deleted`);
  };
  const setClassTeacher = async (c: ClassDoc, teacherId: ID | null) => {
    await updateDoc(doc(db, "classes", c.id), {
      classTeacher: teacherId,
      updatedAt: serverTimestamp(),
    });
    if (teacherId) {
      const t = teacherById.get(teacherId);
      if (t)
        await patchTeacher(t, {
          classes: Array.from(new Set([...t.classes, c.id])),
        });
    }
    await logActivity(
      "Teacher Reassigned",
      `${classLabel(c)} class teacher updated`,
    );
  };
  const toggleClassSubject = async (c: ClassDoc, subjectId: ID) => {
    const next = c.subjects.includes(subjectId)
      ? c.subjects.filter((id) => id !== subjectId)
      : [...c.subjects, subjectId];
    await updateDoc(doc(db, "classes", c.id), {
      subjects: next,
      updatedAt: serverTimestamp(),
    });
  };

  /* ============================================================================
     SUBJECT CRUD
  ============================================================================ */
  const [subjectModal, setSubjectModal] = useState<null | { mode: "create" }>(
    null,
  );
  const [subjectDraft, setSubjectDraft] = useState({
    name: "",
    code: "",
    description: "",
  });

  const saveSubject = async () => {
    if (!subjectDraft.name || !schoolId) return;
    await addDoc(
      collection(db, "subjects"),
      withMeta({ ...subjectDraft, status: "Active" }),
    );
    await logActivity("Subject Created", `${subjectDraft.name} added`);
    await pushNotification(`New subject added: ${subjectDraft.name}`);
    setSubjectModal(null);
  };
  const archiveSubject = async (s: SubjectDoc) =>
    updateDoc(doc(db, "subjects", s.id), {
      status: s.status === "Archived" ? "Active" : "Archived",
    });
  const deleteSubjectDoc = async (s: SubjectDoc) => {
    if (!confirm(`Delete ${s.name}?`)) return;
    await deleteDoc(doc(db, "subjects", s.id));
  };

  /* ============================================================================
     NOTIFICATIONS
  ============================================================================ */
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "read">(
    "all",
  );
  const markRead = (n: NotificationDoc) =>
    updateDoc(doc(db, "notifications", n.id), { read: true });
  const markAllRead = async () => {
    const batch = writeBatch(db);
    notifications
      .filter((n) => !n.read)
      .forEach((n) =>
        batch.update(doc(db, "notifications", n.id), { read: true }),
      );
    await batch.commit();
  };
  const deleteNotif = (n: NotificationDoc) =>
    deleteDoc(doc(db, "notifications", n.id));
  const filteredNotifs = notifications.filter((n) =>
    notifFilter === "all" ? true : notifFilter === "unread" ? !n.read : n.read,
  );

  /* ============================================================================
     PROFILE / SETTINGS / LOGOUT / DELETE ACCOUNT
  ============================================================================ */
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("all");

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    fullName: "",
    phone: "",
    schoolName: "",
    address: "",
  });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [profileBusy, setProfileBusy] = useState(false);

  const openProfileModal = () => {
    setProfileDraft({
      fullName: currentAdminName,
      phone: adminUserDoc?.phone || schoolDoc?.phone || "",
      schoolName: currentSchoolName,
      address: schoolDoc?.address || "",
    });
    setProfilePhotoFile(null);
    setProfilePhotoPreview(currentAdminPhoto);
    setProfileMenuOpen(false);
    setProfileModalOpen(true);
  };
  const onPickPhoto = (file: File | null) => {
    setProfilePhotoFile(file);
    setProfilePhotoPreview(
      file ? URL.createObjectURL(file) : currentAdminPhoto,
    );
  };
  const saveProfile = async () => {
    if (!schoolId) return;
    setProfileBusy(true);
    try {
      let photoURL = currentAdminPhoto;
      if (profilePhotoFile) {
        const photoRef = ref(storage, `profilePhotos/${schoolId}.jpg`);
        await uploadBytes(photoRef, profilePhotoFile);
        photoURL = await getDownloadURL(photoRef);
      }
      await updateDoc(doc(db, "users", schoolId), {
        fullName: profileDraft.fullName,
        phone: profileDraft.phone,
        photoURL,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "schools", schoolId), {
        schoolName: profileDraft.schoolName,
        address: profileDraft.address,
        phone: profileDraft.phone,
        updatedAt: serverTimestamp(),
      });
      await logActivity(
        "Profile Updated",
        "Admin profile / school info updated",
      );
      setProfileModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Could not save profile.");
    } finally {
      setProfileBusy(false);
    }
  };
  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await signOut(auth);
    navigate("/login");
  };
  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "This permanently deletes your admin account and school data. This cannot be undone. Continue?",
      )
    )
      return;
    if (
      !confirm("Are you absolutely sure? This is your last chance to cancel.")
    )
      return;
    try {
      if (schoolId) {
        await deleteDoc(doc(db, "schools", schoolId)).catch(() => {});
        await deleteDoc(doc(db, "users", schoolId)).catch(() => {});
      }
      if (auth.currentUser) await deleteUser(auth.currentUser);
      navigate("/signup");
    } catch (err: any) {
      if (err?.code === "auth/requires-recent-login") {
        alert(
          "For security, please log out and log back in, then try deleting your account again.",
        );
      } else {
        alert(err?.message ?? "Could not delete account.");
      }
    }
  };

  /* ============================================================================
     GUARD: not signed in yet
  ============================================================================ */
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[#6B7280]">
        Loading...
      </div>
    );
  }
  if (!schoolId) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-lg font-semibold text-[#1A1D21]">
            You need to sign in
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Please sign in as a school admin to view this dashboard.
          </p>
          <PrimaryBtn className="mt-4" onClick={() => navigate("/login")}>
            Go to sign in
          </PrimaryBtn>
        </div>
      </div>
    );
  }

  /* ============================================================================
     RENDER — TOP BAR
  ============================================================================ */
  const TopBar = (
    <div className="flex flex-wrap items-center gap-3 px-3 py-3 bg-white">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={Logo}
          className="h-[42px] w-[42px] sm:h-[50px] sm:w-[50px] rounded-full object-cover"
        />
        <span className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-[#1A1D21]">
          {currentSchoolName}
        </span>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <nav className="flex h-12 sm:h-14 items-center gap-0.5 overflow-x-auto rounded-full bg-[#F7F8FC] px-1.5 py-1">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className="shrink-0 whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 text-[13px] sm:text-[15px] font-medium transition-colors"
              style={
                view === item.key
                  ? { background: BRAND_PRIMARY, color: "#fff" }
                  : { color: "#6B7280" }
              }
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-[6px]">
          <button
            onClick={() => setSearchOpen(true)}
            className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full border border-[#E8EAF0] bg-white text-[#6B7280] hover:text-[#1A1D21]"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full border border-[#E8EAF0] bg-white text-[#6B7280] hover:text-[#1A1D21]"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: BRAND_PRIMARY }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 z-50 mt-2 w-[320px] max-w-[85vw] rounded-2xl border border-[#EEF2F7] bg-white p-3 shadow-2xl">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-[#1A1D21]">
                    Notifications
                  </p>
                  <button
                    className="text-xs font-medium"
                    style={{ color: BRAND_PRIMARY }}
                    onClick={markAllRead}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.slice(0, 6).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n)}
                      className={`flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-[#F7F8FC] ${!n.read ? "font-medium text-[#1A1D21]" : "text-[#6B7280]"}`}
                    >
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background: !n.read ? BRAND_PRIMARY : "transparent",
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{n.title}</span>
                        <span className="block text-[11px] text-[#9CA3AF]">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  ))}
                  {notifications.length === 0 && (
                    <p className="px-2 py-4 text-center text-xs text-[#9CA3AF]">
                      No notifications yet
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    setNotifModalOpen(true);
                  }}
                  className="mt-2 w-full rounded-xl py-2 text-xs font-semibold"
                  style={{ background: BRAND_SOFT, color: BRAND_PRIMARY }}
                >
                  View all
                </button>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen((v) => !v)}
              className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center overflow-hidden rounded-full border border-[#E8EAF0] bg-white text-[#6B7280] hover:text-[#1A1D21]"
            >
              {currentAdminPhoto ? (
                <img
                  src={currentAdminPhoto}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User2 className="h-5 w-5" />
              )}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-[240px] rounded-2xl border border-[#EEF2F7] bg-white p-2 shadow-2xl">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-[#1A1D21]">
                    {currentAdminName}
                  </p>
                  <p className="truncate text-[11px] text-[#6B7280]">
                    {adminUserDoc?.email || schoolDoc?.email}
                  </p>
                </div>
                <div className="my-1 border-t border-[#EEF2F7]" />
                <button
                  onClick={openProfileModal}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#1A1D21] hover:bg-[#F7F8FC]"
                >
                  <Settings className="h-4 w-4" /> My profile & settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#1A1D21] hover:bg-[#F7F8FC]"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
                <div className="my-1 border-t border-[#EEF2F7]" />
                <button
                  onClick={handleDeleteAccount}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#C53030] hover:bg-[#FDEAEA]"
                >
                  <ShieldAlert className="h-4 w-4" /> Delete account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const WelcomeSection = (
    <div className="px-3 pt-6 sm:pt-9 pb-3">
      <h1 className="text-[22px] sm:text-[30px] font-semibold tracking-tight text-[#1A1D21]">
        Welcome in, {currentAdminName}
      </h1>
    </div>
  );

  const DashboardControls = (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-3 pb-3">
      <div className="flex items-end gap-4 sm:gap-6 overflow-x-auto">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Create
          </span>
          <button
            onClick={() => setCreateChooserOpen(true)}
            style={{
              background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
            }}
            className="flex h-10 w-[80px] items-center justify-center gap-2 rounded-full border border-[#E8EAF0] transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Classes
          </span>
          <button
            onClick={() => setView("Projects")}
            style={{
              background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
            }}
            className="flex h-10 w-[80px] items-center justify-center gap-2 rounded-full border border-[#E8EAF0]"
          >
            <Grid2X2 className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Team
          </span>
          <button
            onClick={() => setView("Team")}
            style={{
              background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
            }}
            className="flex h-10 w-[100px] items-center justify-center gap-2 rounded-full border border-[#E8EAF0]"
          >
            <Users className="h-4 w-4 text-white" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
            Settings
          </span>
          <button
            onClick={() => setView("Settings")}
            style={{
              background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
            }}
            className="flex h-10 w-[150px] items-center justify-center gap-2 rounded-full border border-[#E8EAF0]"
          >
            <Settings className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-end gap-6 sm:gap-10 pb-[1px]">
        {[
          {
            icon: <School className="h-5 w-5 text-[#1A1D21]" />,
            value: stats.classes,
            label: "Classes",
          },
          {
            icon: <GraduationCap className="h-5 w-5 text-[#1A1D21]" />,
            value: stats.students,
            label: "Students",
          },
          {
            icon: <UsersRound className="h-5 w-5 text-[#1A1D21]" />,
            value: stats.teachers,
            label: "Teachers",
          },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#F4F7FB]">
              {s.icon}
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1A1D21]">
                {s.value}
              </p>
              <p className="text-[11px] text-[#6B7280]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProfileCard = (
    <div className="group relative h-[240px] sm:h-[270px] w-full lg:w-[360px] overflow-hidden rounded-[32px] sm:rounded-[40px] shadow-sm hover:shadow-xl transition-all duration-500">
      <img
        src={currentAdminPhoto || DefaultProfile}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute bottom-[16px] sm:bottom-[20px] left-[5px] right-[8px] flex items-end justify-between">
        <div className="px-3">
          <h2 className="text-[18px] sm:text-[22px] font-semibold text-white leading-none drop-shadow">
            {currentAdminName}
          </h2>
          <p className="mt-1 text-[13px] text-white/75">Administrator</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex h-[36px] min-w-[110px] max-w-[145px] items-center justify-center gap-2 rounded-full border border-white/70 bg-white/10 px-4 text-white/95 backdrop-blur-md shadow-lg transition-all hover:bg-white/20 hover:border-white hover:scale-105 active:scale-95"
          >
            <Users className="h-4 w-4 text-white/90" />
            <span className="text-[12px] font-medium tracking-wide">
              {stats.students + stats.teachers}
            </span>
          </button>
          {showStats && (
            <div className="absolute bottom-10 right-0 w-[170px] rounded-2xl bg-white p-4 shadow-2xl">
              <p className="mb-3 text-sm font-semibold text-[#1A1D21]">
                Total Users
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Students</span>
                  <span className="font-semibold">{stats.students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Teachers</span>
                  <span className="font-semibold">{stats.teachers}</span>
                </div>
                <div className="my-2 border-t border-[#E5E7EB]" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>{stats.students + stats.teachers}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ProgressCard = (
    <div className="h-[240px] sm:h-[270px] w-full lg:w-[360px] rounded-[32px] sm:rounded-[40px] border border-[#E8EAF0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#6B7280]">Teacher status</p>
        <ChevronDown className="h-4 w-4 text-[#6B7280]" />
      </div>
      <p className="mt-2 text-[28px] sm:text-[34px] font-semibold tracking-tight text-[#1A1D21]">
        {stats.activeTeachers}{" "}
        <span className="text-sm font-normal text-[#6B7280]">active</span>
      </p>
      <div className="mt-6 flex items-end gap-1.5 flex-1">
        {[
          { label: "Active", value: stats.activeTeachers },
          { label: "Pending", value: stats.pendingInvites },
          { label: "Total", value: stats.teachers },
        ].map((bar, i) => (
          <div
            key={i}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div
              className="w-full rounded-[6px] transition-all duration-500"
              style={{
                height: `${Math.max(8, (bar.value / Math.max(1, stats.teachers)) * 130)}px`,
                background: i === 0 ? BRAND_PRIMARY : `${BRAND_PRIMARY}33`,
              }}
            />
            <span className="text-[11px] font-medium text-[#6B7280]">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const TimeTrackedCard = (
    <div className="h-[240px] sm:h-[270px] w-full lg:w-[360px] rounded-[32px] sm:rounded-[40px] border border-[#E8EAF0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#6B7280]">
          Awaiting password change
        </p>
        <Clock className="h-4 w-4 text-[#6B7280]" />
      </div>
      <div className="flex flex-col items-center justify-center flex-1">
        <p
          style={{
            background: `linear-gradient(90deg, ${BRAND_LIGHT}, ${BRAND_PRIMARY}, ${BRAND_DARK})`,
          }}
          className="rounded-2xl px-6 py-3 text-[28px] sm:text-[34px] font-semibold tracking-tight text-white tabular-nums shadow-sm"
        >
          {stats.awaitingPasswordChange}
        </p>
        <p className="mt-3 text-[11px] text-[#6B7280]">
          Students who haven't changed their default password
        </p>
      </div>
    </div>
  );

  const TasksSidebar = (
    <div className="w-full lg:w-[470px] h-[420px] lg:h-[540px] flex flex-col rounded-[32px] sm:rounded-[40px] bg-[#1A1D21] p-6 text-white shadow-sm">
      <div className="h-[20%] flex flex-col justify-center">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[20px] sm:text-[22px] font-semibold tracking-tight">
            Recent activity
          </h2>
          <span className="text-[22px] sm:text-[28px] font-semibold">
            {activity.length}
          </span>
        </div>
        <p className="mt-1 text-[12px] opacity-50">
          Latest system events across the school
        </p>
      </div>
      <div className="flex-1 mt-5 rounded-[28px] bg-white/[0.04] p-5 pb-[2px] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-medium opacity-80">Events</p>
          <button className="grid h-8 w-8 place-items-center rounded-xl bg-white/15 hover:bg-white/25">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-2.5 pb-3">
          {activity.slice(0, 10).map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/15">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {a.description}
                </span>
                <span className="block text-[11px] opacity-70">
                  {timeAgo(a.createdAt)}
                </span>
              </span>
            </li>
          ))}
          {activity.length === 0 && (
            <p className="py-6 text-center text-xs opacity-50">
              No activity yet
            </p>
          )}
        </ul>
      </div>
    </div>
  );

  const FilesCard = (
    <div className="h-[240px] sm:h-[270px] w-full lg:w-[360px] rounded-[32px] sm:rounded-[40px] border border-[#E8EAF0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[#6B7280]">
          Recent students
        </p>
        <MoreHorizontal className="h-4 w-4 text-[#6B7280]" />
      </div>
      <ul className="mt-4 space-y-3 flex-1 overflow-y-auto">
        {students.slice(0, 4).map((s) => (
          <li
            key={s.id}
            className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-[#F7F8FC]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F7F8FC]">
              <FileText className="h-4 w-4" style={{ color: BRAND_PRIMARY }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-[#1A1D21]">
                {s.fullname}
              </span>
              <span className="block truncate text-[11px] text-[#6B7280]">
                {s.registrationNumber} &middot;{" "}
                {classLabel(classById.get(s.classId ?? ""))}
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-[#6B7280] opacity-0 group-hover:opacity-100" />
          </li>
        ))}
        {students.length === 0 && (
          <p className="py-6 text-center text-xs text-[#9CA3AF]">
            No students yet
          </p>
        )}
      </ul>
    </div>
  );

  const TeamActivityCard = (
    <div className="h-[240px] sm:h-[270px] w-full lg:w-[720px] rounded-[32px] sm:rounded-[40px] border border-[#E8EAF0] bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
      <div className="flex items-center justify-between px-2 pt-1">
        <p className="text-sm font-semibold text-[#1A1D21]">Teachers</p>
        <Pill tone="blue">{stats.teachers} total</Pill>
      </div>
      <div className="mt-3 flex-1 overflow-y-auto rounded-2xl border border-[#EEF2F7] p-2">
        {teachers.slice(0, 6).map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-[#F7F8FC]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                style={{ background: BRAND_PRIMARY }}
              >
                {initialsOf(t.fullname)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#1A1D21]">
                  {t.fullname}
                </p>
                <p className="truncate text-[11px] text-[#6B7280]">
                  {t.classes.length} class{t.classes.length === 1 ? "" : "es"}{" "}
                  &middot; {t.subjects.length} subject
                  {t.subjects.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <Pill tone={statusTone(t.status)}>{t.status}</Pill>
          </div>
        ))}
        {teachers.length === 0 && (
          <p className="py-8 text-center text-xs text-[#9CA3AF]">
            No teachers yet
          </p>
        )}
      </div>
    </div>
  );

  const DashboardView = (
    <div className="flex-1 flex flex-col justify-end">
      <div className="flex flex-col lg:flex-row gap-[10px]">
        <div className="flex flex-col gap-[10px]">
          <div className="flex flex-col sm:flex-row gap-[10px]">
            {ProfileCard}
            {ProgressCard}
            {TimeTrackedCard}
          </div>
          <div className="flex flex-col sm:flex-row gap-[10px]">
            {FilesCard}
            {TeamActivityCard}
          </div>
        </div>
        {TasksSidebar}
      </div>
    </div>
  );

  /* ---- TEACHERS ---- */
  const TeachersView = (
    <div className="rounded-[32px] border border-[#E8EAF0] bg-white p-5 sm:p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#1A1D21]">Teachers</h3>
        <PrimaryBtn onClick={openCreateTeacher}>
          <Plus className="h-4 w-4" /> Invite teacher
        </PrimaryBtn>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {teachers.map((t) => (
          <div
            key={t.id}
            className="flex flex-col gap-3 rounded-2xl border border-[#EEF2F7] bg-[#FAFBFD] p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ background: BRAND_PRIMARY }}
                >
                  {initialsOf(t.fullname)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1A1D21]">
                    {t.fullname}
                  </p>
                  <p className="truncate text-[11px] text-[#6B7280]">
                    {t.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteTeacher(t)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#6B7280] hover:bg-[#FDEAEA] hover:text-[#C53030]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Pill tone={statusTone(t.status)}>{t.status}</Pill>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase text-[#9CA3AF]">
                Classes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {t.classes.length === 0 && (
                  <span className="text-[11px] text-[#9CA3AF]">None</span>
                )}
                {t.classes.map((cid) => (
                  <RemovableChip
                    key={cid}
                    label={classLabel(classById.get(cid))}
                    onRemove={() =>
                      patchTeacher(t, {
                        classes: t.classes.filter((id) => id !== cid),
                      })
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase text-[#9CA3AF]">
                Subjects
              </p>
              <div className="flex flex-wrap gap-1.5">
                {t.subjects.length === 0 && (
                  <span className="text-[11px] text-[#9CA3AF]">None</span>
                )}
                {t.subjects.map((sid) => (
                  <RemovableChip
                    key={sid}
                    alt
                    label={subjectById.get(sid)?.name ?? sid}
                    onRemove={() =>
                      patchTeacher(t, {
                        subjects: t.subjects.filter((id) => id !== sid),
                      })
                    }
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase text-[#9CA3AF]">
                Arms
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ARMS.map((arm) => {
                  const active = t.arms.includes(arm);
                  return (
                    <button
                      key={arm}
                      onClick={() => toggleTeacherArm(t, arm)}
                      className="h-7 w-7 rounded-full text-[11px] font-semibold transition-colors"
                      style={
                        active
                          ? { background: BRAND_PRIMARY, color: "#fff" }
                          : { background: "#EEF1F6", color: "#6B7280" }
                      }
                    >
                      {arm}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-1 grid grid-cols-2 gap-2">
              <select
                className={inputCls + " text-xs"}
                value=""
                onChange={(e) =>
                  e.target.value &&
                  patchTeacher(t, {
                    classes: Array.from(
                      new Set([...t.classes, e.target.value]),
                    ),
                  })
                }
              >
                <option value="">+ Assign class</option>
                {classes
                  .filter((c) => !t.classes.includes(c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {classLabel(c)}
                    </option>
                  ))}
              </select>
              <select
                className={inputCls + " text-xs"}
                value=""
                onChange={(e) =>
                  e.target.value &&
                  patchTeacher(t, {
                    subjects: Array.from(
                      new Set([...t.subjects, e.target.value]),
                    ),
                  })
                }
              >
                <option value="">+ Assign subject</option>
                {subjects
                  .filter((s) => !t.subjects.includes(s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ))}
        {teachers.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-[#9CA3AF]">
            No teachers yet — invite your first one.
          </p>
        )}
      </div>
    </div>
  );

  /* ---- CLASSES ---- */
  const ClassesView = (
    <div className="rounded-[32px] border border-[#E8EAF0] bg-white p-5 sm:p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#1A1D21]">Classes</h3>
        <PrimaryBtn
          onClick={() => {
            setClassDraft({
              level: CLASS_LEVELS[0],
              arm: "A",
              session: "2025/2026",
            });
            setClassModal({ mode: "create" });
          }}
        >
          <Plus className="h-4 w-4" /> Create class
        </PrimaryBtn>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-3 rounded-2xl border border-[#EEF2F7] bg-[#FAFBFD] p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[#1A1D21]">
                  {classLabel(c)}
                </p>
                <p className="text-[11px] text-[#6B7280]">{c.session}</p>
              </div>
              <button
                onClick={() => deleteClassDoc(c)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#FDEAEA] hover:text-[#C53030]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Class teacher</span>
              <select
                className={inputCls + " w-auto text-xs"}
                value={c.classTeacher ?? ""}
                onChange={(e) => setClassTeacher(c, e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullname}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Students</span>
              <Pill tone="blue">{c.students.length}</Pill>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => {
                const active = c.subjects.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleClassSubject(c, s.id)}
                    className="rounded-full px-2 py-1 text-[10px] font-semibold transition-colors"
                    style={
                      active
                        ? { background: BRAND_PRIMARY, color: "#fff" }
                        : { background: "#EEF1F6", color: "#6B7280" }
                    }
                  >
                    {s.code}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-[#9CA3AF]">
            No classes yet — create JSS1, JSS2, etc.
          </p>
        )}
      </div>
    </div>
  );

  /* ---- STUDENTS ---- */
  const filteredStudents = students.filter((s) => {
    const term = studentSearch.toLowerCase();
    const matches =
      s.fullname.toLowerCase().includes(term) ||
      s.registrationNumber.toLowerCase().includes(term);
    const inClass =
      studentClassFilter === "all" || s.classId === studentClassFilter;
    return matches && inClass;
  });

  const StudentsView = (
    <div className="rounded-[32px] border border-[#E8EAF0] bg-white p-5 sm:p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#1A1D21]">Students</h3>
        <PrimaryBtn onClick={openCreateStudent}>
          <Plus className="h-4 w-4" /> Add student
        </PrimaryBtn>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#E8EAF0] bg-[#F7F8FC] px-3 py-2">
          <Search className="h-4 w-4 text-[#6B7280]" />
          <input
            placeholder="Search by name or reg. number"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <select
          className={inputCls + " w-auto"}
          value={studentClassFilter}
          onChange={(e) => setStudentClassFilter(e.target.value)}
        >
          <option value="all">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {classLabel(c)}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase text-[#6B7280]">
              <th className="pb-3">Student</th>
              <th className="pb-3">Reg. number</th>
              <th className="pb-3">Class</th>
              <th className="pb-3">Password</th>
              <th className="pb-3">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s.id} className="border-t border-[#EEF2F7]">
                <td className="py-3 font-medium text-[#1A1D21]">
                  {s.fullname}
                </td>
                <td className="py-3 text-[#6B7280]">{s.registrationNumber}</td>
                <td className="py-3">
                  <select
                    className={inputCls + " w-auto text-xs"}
                    value={s.classId ?? ""}
                    onChange={(e) => transferStudent(s, e.target.value)}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {classLabel(c)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3">
                  <Pill tone={s.passwordChanged ? "green" : "amber"}>
                    {s.passwordChanged ? "Changed" : "Default"}
                  </Pill>
                </td>
                <td className="py-3">
                  <Pill
                    tone={statusTone(s.status)}
                    onClick={() => toggleStudentStatus(s)}
                  >
                    {s.status}
                  </Pill>
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => deleteStudent(s)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#FDEAEA] hover:text-[#C53030]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-sm text-[#9CA3AF]"
                >
                  No students match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ---- PROMOTIONS ---- */
  const PromotionsView = (
    <div className="rounded-[32px] border border-[#E8EAF0] bg-white p-5 sm:p-6 shadow-sm">
      <h3 className="mb-5 text-base font-semibold text-[#1A1D21]">
        Promote students
      </h3>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className={inputCls + " w-auto"}
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
        <span className="text-xs text-[#6B7280]">
          {selectedStudentIds.length} selected
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#EEF2F7]">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase text-[#6B7280]">
              <th className="p-3" />
              <th className="p-3">Student</th>
              <th className="p-3">Reg. number</th>
            </tr>
          </thead>
          <tbody>
            {studentsInPromoteClass.map((s) => (
              <tr key={s.id} className="border-t border-[#EEF2F7]">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(s.id)}
                    onChange={() =>
                      setSelectedStudentIds((prev) =>
                        prev.includes(s.id)
                          ? prev.filter((x) => x !== s.id)
                          : [...prev, s.id],
                      )
                    }
                  />
                </td>
                <td className="p-3 font-medium text-[#1A1D21]">{s.fullname}</td>
                <td className="p-3 text-[#6B7280]">{s.registrationNumber}</td>
              </tr>
            ))}
            {studentsInPromoteClass.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-6 text-center text-sm text-[#9CA3AF]"
                >
                  No students in this class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className={inputCls + " w-auto"}
          value={promoteToClass}
          onChange={(e) => setPromoteToClass(e.target.value)}
        >
          <option value="">Promote to...</option>
          {validPromotionTargets.map((c) => (
            <option key={c.id} value={c.id}>
              {classLabel(c)}
            </option>
          ))}
        </select>
        <PrimaryBtn
          disabled={!promoteToClass || selectedStudentIds.length === 0}
          onClick={confirmPromotion}
        >
          <ArrowUpCircle className="h-4 w-4" /> Confirm promotion
        </PrimaryBtn>
        {fromClass && validPromotionTargets.length === 0 && (
          <span className="text-xs text-[#B9790A]">
            This is the highest level — no further promotion possible.
          </span>
        )}
      </div>
    </div>
  );

  /* ---- SUBJECTS ---- */
  const SubjectsView = (
    <div className="rounded-[32px] border border-[#E8EAF0] bg-white p-5 sm:p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#1A1D21]">Subjects</h3>
        <PrimaryBtn
          onClick={() => {
            setSubjectDraft({ name: "", code: "", description: "" });
            setSubjectModal({ mode: "create" });
          }}
        >
          <Plus className="h-4 w-4" /> Add subject
        </PrimaryBtn>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase text-[#6B7280]">
              <th className="pb-3">Subject</th>
              <th className="pb-3">Code</th>
              <th className="pb-3">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id} className="border-t border-[#EEF2F7]">
                <td className="py-3 font-medium text-[#1A1D21]">{s.name}</td>
                <td className="py-3">
                  <Pill tone="gray">{s.code}</Pill>
                </td>
                <td className="py-3">
                  <Pill tone={s.status === "Active" ? "green" : "gray"}>
                    {s.status}
                  </Pill>
                </td>
                <td className="py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => archiveSubject(s)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#F4F7FB]"
                    >
                      <BookOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSubjectDoc(s)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-[#6B7280] hover:bg-[#FDEAEA] hover:text-[#C53030]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-10 text-center text-sm text-[#9CA3AF]"
                >
                  No subjects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ---- SETTINGS ---- */
  const SettingsView = (
    <div className="rounded-[32px] border border-[#E8EAF0] bg-white p-5 sm:p-6 shadow-sm">
      <h3 className="mb-2 text-base font-semibold text-[#1A1D21]">Settings</h3>
      <p className="mb-6 text-sm text-[#6B7280]">
        Admin profile and school details live in one place now — use the button
        below (same form as the profile-menu shortcut).
      </p>
      <PrimaryBtn onClick={openProfileModal}>
        <Settings className="h-4 w-4" /> Edit profile & school info
      </PrimaryBtn>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#EEF2F7] p-4">
          <p className="mb-2 text-sm font-semibold text-[#1A1D21]">Security</p>
          <p className="text-xs text-[#6B7280]">
            Two-factor auth, recent logins, active devices — needs your
            session/device tracking wired in.
          </p>
        </div>
        <div className="rounded-2xl border border-[#EEF2F7] p-4">
          <p className="mb-2 text-sm font-semibold text-[#1A1D21]">System</p>
          <p className="text-xs text-[#6B7280]">
            Backup, restore, CSV/Excel import & export — wire to Cloud Functions
            when available.
          </p>
        </div>
      </div>
    </div>
  );

  const viewMap: Record<ViewKey, React.ReactNode> = {
    Dashboard: DashboardView,
    Team: TeachersView,
    Projects: ClassesView,
    Time: StudentsView,
    Reports: PromotionsView,
    Files: SubjectsView,
    Settings: SettingsView,
  };

  /* ============================================================================
     ROOT LAYOUT
  ============================================================================ */
  return (
    <>
      <div className="min-h-screen w-full bg-white px-3 sm:px-8 lg:px-15 pt-[5px] pb-[16px]">
        <div className="flex h-full flex-col max-w-[1800px] mx-auto">
          {TopBar}
          {WelcomeSection}
          {DashboardControls}
          <div className="mt-2">{viewMap[view]}</div>
        </div>
      </div>

      {/* ---------------- Create chooser ---------------- */}
      {createChooserOpen && (
        <Modal
          title="What would you like to create?"
          onClose={() => setCreateChooserOpen(false)}
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Teacher",
                icon: <GraduationCap className="h-5 w-5" />,
                onClick: openCreateTeacher,
              },
              {
                label: "Student",
                icon: <Users className="h-5 w-5" />,
                onClick: openCreateStudent,
              },
              {
                label: "Class",
                icon: <Layers className="h-5 w-5" />,
                onClick: () => {
                  setClassDraft({
                    level: CLASS_LEVELS[0],
                    arm: "A",
                    session: "2025/2026",
                  });
                  setClassModal({ mode: "create" });
                },
              },
              {
                label: "Subject",
                icon: <BookOpen className="h-5 w-5" />,
                onClick: () => {
                  setSubjectDraft({ name: "", code: "", description: "" });
                  setSubjectModal({ mode: "create" });
                },
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setCreateChooserOpen(false);
                  item.onClick();
                }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#E8EAF0] bg-[#FAFBFD] py-6 text-sm font-semibold text-[#1A1D21] transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ color: BRAND_DARK }}
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-full"
                  style={{ background: BRAND_SOFT, color: BRAND_PRIMARY }}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* ---------------- Global search ---------------- */}
      {searchOpen && (
        <Modal title="Search" onClose={() => setSearchOpen(false)} wide>
          <div className="flex items-center gap-2 rounded-xl border border-[#E8EAF0] bg-[#F7F8FC] px-3 py-2">
            <Search className="h-4 w-4 text-[#6B7280]" />
            <input
              autoFocus
              placeholder="Search students, teachers, classes, subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          {searchTerm && (
            <div className="flex flex-col gap-4">
              {(["teachers", "students", "classes", "subjects"] as const).map(
                (key) => {
                  const rows = searchResults[key];
                  if (rows.length === 0) return null;
                  return (
                    <div key={key}>
                      <p className="mb-2 text-xs font-semibold uppercase text-[#6B7280]">
                        {key}
                      </p>
                      <div className="flex flex-col gap-1">
                        {rows.map((r: any) => (
                          <div
                            key={r.id}
                            className="rounded-lg px-2 py-1.5 text-sm hover:bg-[#F7F8FC]"
                          >
                            {r.fullname ??
                              classLabel(r) ??
                              r.registrationNumber}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ---------------- Notification center ---------------- */}
      {notifModalOpen && (
        <Modal
          title="Notification center"
          onClose={() => setNotifModalOpen(false)}
          wide
        >
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "unread", "read"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setNotifFilter(f)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold capitalize"
                style={
                  notifFilter === f
                    ? { background: BRAND_PRIMARY, color: "#fff" }
                    : { background: "#F4F7FB", color: "#6B7280" }
                }
              >
                {f}
              </button>
            ))}
            <button
              onClick={markAllRead}
              className="ml-auto flex items-center gap-1 text-xs font-semibold"
              style={{ color: BRAND_PRIMARY }}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          <div className="flex max-h-[420px] flex-col gap-1 overflow-y-auto">
            {filteredNotifs.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-[#F7F8FC]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: !n.read ? BRAND_PRIMARY : "transparent",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${!n.read ? "font-semibold text-[#1A1D21]" : "text-[#6B7280]"}`}
                  >
                    {n.title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n)}
                    className="grid h-7 w-7 place-items-center rounded-lg text-[#6B7280] hover:bg-[#F4F7FB]"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotif(n)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-[#6B7280] hover:bg-[#FDEAEA] hover:text-[#C53030]"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {filteredNotifs.length === 0 && (
              <p className="py-10 text-center text-sm text-[#9CA3AF]">
                Nothing here.
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* ---------------- Teacher invite ---------------- */}
      {teacherModal && (
        <Modal title="Invite teacher" onClose={() => setTeacherModal(null)}>
          <Field label="Full name">
            <input
              className={inputCls}
              value={teacherDraft.fullname}
              onChange={(e) =>
                setTeacherDraft({ ...teacherDraft, fullname: e.target.value })
              }
            />
          </Field>
          <Field label="Email">
            <input
              className={inputCls}
              value={teacherDraft.email}
              onChange={(e) =>
                setTeacherDraft({ ...teacherDraft, email: e.target.value })
              }
            />
          </Field>
          <p className="flex items-start gap-2 rounded-xl bg-[#F4F7FB] p-3 text-xs text-[#6B7280]">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" /> The teacher gets an
            email to set their own password and accept the invitation.
          </p>
          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setTeacherModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn disabled={teacherBusy} onClick={inviteTeacher}>
              {teacherBusy ? "Sending..." : "Send invite"}
            </PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* ---------------- Student create ---------------- */}
      {studentModal && (
        <Modal title="Add student" onClose={() => setStudentModal(null)}>
          <Field label="Full name">
            <input
              className={inputCls}
              value={studentDraft.fullname}
              onChange={(e) =>
                setStudentDraft({ ...studentDraft, fullname: e.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Registration number">
              <input
                className={inputCls}
                value={studentDraft.registrationNumber}
                onChange={(e) =>
                  setStudentDraft({
                    ...studentDraft,
                    registrationNumber: e.target.value,
                  })
                }
              />
            </Field>
            <Field label="Default password">
              <input
                className={inputCls}
                value={studentDraft.defaultPassword}
                onChange={(e) =>
                  setStudentDraft({
                    ...studentDraft,
                    defaultPassword: e.target.value,
                  })
                }
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gender">
              <select
                className={inputCls}
                value={studentDraft.gender}
                onChange={(e) =>
                  setStudentDraft({
                    ...studentDraft,
                    gender: e.target.value as any,
                  })
                }
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>
            <Field label="Date of birth">
              <input
                type="date"
                className={inputCls}
                value={studentDraft.dateOfBirth}
                onChange={(e) =>
                  setStudentDraft({
                    ...studentDraft,
                    dateOfBirth: e.target.value,
                  })
                }
              />
            </Field>
          </div>
          <Field label="Class">
            <select
              className={inputCls}
              value={studentDraft.classId}
              onChange={(e) =>
                setStudentDraft({ ...studentDraft, classId: e.target.value })
              }
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {classLabel(c)}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setStudentModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn disabled={studentBusy} onClick={createStudent}>
              {studentBusy ? "Creating..." : "Create student"}
            </PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* ---------------- Class create ---------------- */}
      {classModal && (
        <Modal title="Create class" onClose={() => setClassModal(null)}>
          <Field label="Level">
            <select
              className={inputCls}
              value={classDraft.level}
              onChange={(e) =>
                setClassDraft({ ...classDraft, level: e.target.value })
              }
            >
              {CLASS_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Arm">
            <input
              className={inputCls}
              value={classDraft.arm}
              onChange={(e) =>
                setClassDraft({ ...classDraft, arm: e.target.value })
              }
            />
          </Field>
          <Field label="Academic session">
            <input
              className={inputCls}
              value={classDraft.session}
              onChange={(e) =>
                setClassDraft({ ...classDraft, session: e.target.value })
              }
            />
          </Field>
          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setClassModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={saveClass}>Save class</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* ---------------- Subject create ---------------- */}
      {subjectModal && (
        <Modal title="Add subject" onClose={() => setSubjectModal(null)}>
          <Field label="Subject name">
            <input
              className={inputCls}
              value={subjectDraft.name}
              onChange={(e) =>
                setSubjectDraft({ ...subjectDraft, name: e.target.value })
              }
            />
          </Field>
          <Field label="Subject code">
            <input
              className={inputCls}
              value={subjectDraft.code}
              onChange={(e) =>
                setSubjectDraft({ ...subjectDraft, code: e.target.value })
              }
            />
          </Field>
          <Field label="Description">
            <input
              className={inputCls}
              value={subjectDraft.description}
              onChange={(e) =>
                setSubjectDraft({
                  ...subjectDraft,
                  description: e.target.value,
                })
              }
            />
          </Field>
          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setSubjectModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={saveSubject}>Save subject</PrimaryBtn>
          </div>
        </Modal>
      )}

      {/* ---------------- Profile / school settings ---------------- */}
      {profileModalOpen && (
        <Modal
          title="My profile & settings"
          onClose={() => setProfileModalOpen(false)}
          wide
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border border-[#E8EAF0] bg-[#F7F8FC]">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User2 className="h-8 w-8 text-[#6B7280]" />
                )}
              </div>
              <label
                className="absolute -bottom-1 -right-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full text-white shadow"
                style={{ background: BRAND_PRIMARY }}
              >
                <Camera className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <Field label="Admin name">
                <input
                  className={inputCls}
                  value={profileDraft.fullName}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      fullName: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputCls}
                  value={profileDraft.phone}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, phone: e.target.value })
                  }
                />
              </Field>
              <Field label="School name">
                <input
                  className={inputCls}
                  value={profileDraft.schoolName}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      schoolName: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Address">
                <input
                  className={inputCls}
                  value={profileDraft.address}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      address: e.target.value,
                    })
                  }
                />
              </Field>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <GhostBtn onClick={() => setProfileModalOpen(false)}>
              Cancel
            </GhostBtn>
            <PrimaryBtn disabled={profileBusy} onClick={saveProfile}>
              {profileBusy ? "Saving..." : "Save changes"}
            </PrimaryBtn>
          </div>
        </Modal>
      )}
    </>
  );
};

export default AdminDashboard;
