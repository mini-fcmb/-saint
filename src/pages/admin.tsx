import { useEffect, useState } from "react";
import {
  useFirebaseStore,
  Student,
  TeacherClass,
} from "../stores/useFirebaseStore";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

interface Teacher {
  id: string;
  fullName: string;
  className?: string;
  teaching?: { classLevel: string; subject: string }[];
}

const AdminDashboard = () => {
  const { updateTeacherProfile, promoteStudents, refreshStudents } =
    useFirebaseStore();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null
  );
  const [teacherClass, setTeacherClass] = useState("");
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const [oldClass, setOldClass] = useState("");
  const [newClass, setNewClass] = useState("");

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

  // Function to return subjects based on class
  const getSubjectsForClass = (className: string) => {
    if (className === "P5" || className === "P6") {
      return [
        "Maths",
        "English",
        "Basic Science",
        "Igbo",
        "Basic Digital Literacy",
        "History",
        "Creative and Cultural Art (CCA)",
        "Social and Citizenship Education",
        "Christian Religious Study (CRS)",
        "Pre Vocational Studies",
        "French",
        "Music",
        "Physical and Health Education",
      ];
    } else if (["JSS1", "JSS2", "JSS3"].includes(className)) {
      return [
        "Basic Tech",
        "Literature",
        "French",
        "Igbo",
        "Music",
        "Test or Orals",
        "Maths",
        "CCA",
        "English",
        "PHE",
        "Social Studies",
        "Business Studies",
        "CRS",
        "Computer",
        "History",
        "Agric",
        "Basic Science",
        "Civic",
        "Home Economics",
        "Livestock Farming",
      ];
    } else if (["SS1", "SS2", "SS3"].includes(className)) {
      return [
        "Further Maths",
        "Igbo",
        "Literature",
        "Test of Orals",
        "Geography",
        "CRS",
        "Economics",
        "Maths",
        "English",
        "Marketing",
        "Government",
        "Computer",
        "Chemistry",
        "Civic",
        "Accounting",
        "Biology",
        "Agric",
        "Physics",
      ];
    } else {
      return [];
    }
  };

  // Fetch teachers from Firestore
  useEffect(() => {
    const fetchTeachers = async () => {
      const snapshot = await getDocs(collection(db, "teachers"));
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Teacher)
      );
      setTeachers(data);
    };
    fetchTeachers();
  }, []);

  const handleSelectTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    setSelectedTeacherId(teacherId);
    setTeacherClass(teacher.className || "");
    setTeacherSubjects(teacher.teaching?.map((t) => t.subject) || []);
  };

  const handleSubjectToggle = (subject: string) => {
    setTeacherSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSaveTeacher = async () => {
    if (!selectedTeacherId) return;
    if (!teacherClass) {
      setMessage("Please select a class before saving.");
      return;
    }

    const teachingArray = teacherSubjects.map((subject) => ({
      classLevel: teacherClass,
      subject,
    }));

    const res = await updateTeacherProfile(selectedTeacherId, {
      className: teacherClass,
      teaching: teachingArray,
    });

    if (res.success) {
      setMessage("Teacher profile updated ✅");
      refreshStudents();
    } else {
      setMessage(`Error: ${res.error}`);
    }
  };

  const handlePromoteStudents = async () => {
    if (!oldClass || !newClass) {
      setMessage("Select both classes before promoting.");
      return;
    }
    if (oldClass === newClass) {
      setMessage("Old class and new class cannot be the same.");
      return;
    }

    const res = await promoteStudents(oldClass, newClass);
    if (res.success) {
      setMessage(`Students promoted from ${oldClass} → ${newClass} ✅`);
      refreshStudents();
    } else {
      setMessage(`Error: ${res.error}`);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="main-content">
        {/* Top Navbar */}
        <div className="topbar">
          <input type="search" placeholder="Search..." />
          <div className="topbar-actions">
            <button>Notifications</button>
            <button>Profile</button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="cards-grid">
          <div className="card">
            <h3>Portfolio Performance</h3>
            <p>Cash Deposits: 1.7M</p>
            <p>Invested Dividends: 9M</p>
            <p>Capital Gains: $563</p>
          </div>
          <div className="card">
            <h3>Technical Support</h3>
            <p>New Accounts: 78%</p>
          </div>
          <div className="card">
            <h3>Timeline</h3>
            <ul>
              <li>All Hands Meeting</li>
              <li>Build Production Release</li>
            </ul>
          </div>
        </div>

        {/* Teacher Management */}
        <section className="management">
          <h2>Teacher Management</h2>
          <select
            value={selectedTeacherId || ""}
            onChange={(e) => handleSelectTeacher(e.target.value)}
          >
            <option value="">Select Teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>

          {selectedTeacherId && (
            <>
              <label>Class</label>
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

              <label>Subjects</label>
              <div>
                {getSubjectsForClass(teacherClass).map((subj) => (
                  <button
                    key={subj}
                    onClick={() => handleSubjectToggle(subj)}
                    className={teacherSubjects.includes(subj) ? "selected" : ""}
                  >
                    {subj}
                  </button>
                ))}
              </div>

              <button onClick={handleSaveTeacher}>Save Teacher</button>
            </>
          )}
        </section>

        {/* Student Promotion */}
        <section className="management">
          <h2>Promote Students</h2>
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
        </section>

        {message && <p className="message">{message}</p>}
      </main>
      <style>{`
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

export default AdminDashboard;
