import { useEffect, useMemo, useState } from "react";
import { useFirebaseStore } from "../stores/useFirebaseStore";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

interface Teacher {
  id: string;
  fullName: string;
  email?: string;
  classes?: string[]; // Array of classes they teach
  subjects?: { [className: string]: string[] }; // Subjects per class
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

// Subjects by class level
const SUBJECTS_BY_LEVEL = {
  "P5-P6": [
    "Mathematics", "English Language", "Basic Science", "Igbo Language",
    "Basic Digital Literacy", "History", "CCA", "Social and Citizenship Education",
    "CRS", "Prevocational Studies", "French", "Music", "PHE"
  ],
  "JSS1-JSS3": [
    "Mathematics", "English Language", "Basic Science", "Basic Technology",
    "French", "Igbo Language", "Music", "CCA", "PHE", "Social Studies",
    "Business Studies", "CRS", "Computer Studies", "History",
    "Agricultural Science", "Civic Education", "Home Economics",
    "Livestock Farming", "Literature", "Test of Orals"
  ],
  "SS1-SS3": [
    "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
    "Further Mathematics", "Literature", "Igbo Language", "French", "Geography",
    "CRS", "Economics", "Marketing", "Government", "Computer Science",
    "Civic Education", "Accounting", "Agricultural Science", "Test of Orals"
  ]
};

// Helper to normalize class names from the DB
const normalizeClass = (c?: string) => {
  if (!c) return "";
  const s = c.toString().trim().toUpperCase().replace(/\s+/g, "");
  if (s.startsWith("P5") || s.startsWith("PRIMARY5")) return "P5";
  if (s.startsWith("P6") || s.startsWith("PRIMARY6")) return "P6";
  if (s.startsWith("JSS1") || s.startsWith("JSS-1") || s === "JSSI") return "JSS1";
  if (s.startsWith("JSS2") || s.startsWith("JSS-2") || s === "JSSII") return "JSS2";
  if (s.startsWith("JSS3") || s.startsWith("JSS-3") || s === "JSSIII") return "JSS3";
  if (s.includes("SS3") || s.includes("SSS3")) return "SS3";
  if (s.includes("SS2") || s.includes("SSS2")) return "SS2";
  if (s.includes("SS1") || s.includes("SSS1")) return "SS1";
  const match = s.match(/SS+(\d)/);
  if (match) return `SS${match[1]}`;
  return c;
};

// Get class level for subject selection
const getClassLevel = (className: string): keyof typeof SUBJECTS_BY_LEVEL => {
  if (className === "P5" || className === "P6") return "P5-P6";
  if (className.startsWith("JSS")) return "JSS1-JSS3";
  if (className.startsWith("SS")) return "SS1-SS3";
  return "P5-P6";
};

const AdminDashboard = () => {
  const { updateTeacherProfile, promoteStudents, refreshStudents } = useFirebaseStore();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Teacher management state
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [teacherSubjectsByClass, setTeacherSubjectsByClass] = useState<{
    [className: string]: string[];
  }>({});

  // Promotion state
  const [oldClass, setOldClass] = useState("");
  const [newClass, setNewClass] = useState("");
  const [promoteSubjects, setPromoteSubjects] = useState<string[]>([]);

  // UI state
  const [expandedStudentRows, setExpandedStudentRows] = useState<Record<string, boolean>>({});
  const [expandedTeacherRows, setExpandedTeacherRows] = useState<Record<string, boolean>>({});
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  
  // New state for save confirmation popup
  const [showSavePopup, setShowSavePopup] = useState(false);
  const [savePopupMessage, setSavePopupMessage] = useState("");
  const [savePopupType, setSavePopupType] = useState<"success" | "error">("success");

  // Fetch teachers & students
  useEffect(() => {
    const fetchData = async () => {
      const teachersSnap = await getDocs(collection(db, "teachers"));
      const teachersData = teachersSnap.docs.map((d) => {
        const raw = d.data() as any;
        
        // Normalize classes
        let classes: string[] = [];
        if (Array.isArray(raw.classes)) {
          classes = raw.classes.map((c: any) => normalizeClass(String(c)));
        } else if (raw.className) {
          classes = [normalizeClass(String(raw.className))];
        }
        
        // Normalize subjects (could be array or object)
        let subjects: { [className: string]: string[] } = {};
        if (raw.subjects && typeof raw.subjects === 'object') {
          if (Array.isArray(raw.subjects)) {
            // Old format: subjects array
            classes.forEach((cls: string) => {
              subjects[cls] = raw.subjects.map((s: any) => String(s));
            });
          } else {
            // New format: subjects object
            Object.entries(raw.subjects).forEach(([key, value]) => {
              const normalizedKey = normalizeClass(key);
              if (Array.isArray(value)) {
                subjects[normalizedKey] = value.map((s: any) => String(s));
              }
            });
          }
        }
        
        return {
          id: d.id,
          ...raw,
          classes,
          subjects,
        } as Teacher;
      });
      setTeachers(teachersData);

      const studentsSnap = await getDocs(collection(db, "students"));
      const studentsData = studentsSnap.docs.map((d) => {
        const raw = d.data() as any;
        const subjects = Array.isArray(raw.subjects)
          ? raw.subjects.map((s: any) => String(s))
          : [];
        const normalizedClass = normalizeClass(raw.className || raw.class || "");
        return {
          id: d.id,
          ...raw,
          className: normalizedClass,
          subjects,
        } as Student;
      });
      setStudents(studentsData);
    };

    fetchData();
  }, []);

  // Sort by class order, then by name
  const sortByClassThenName = <T extends { fullName: string }>(arr: T[]) =>
    [...arr].sort((a, b) => {
      const aName = a.fullName || "";
      const bName = b.fullName || "";
      return aName.localeCompare(bName);
    });

  // Filter out admin
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

  // Handle selecting teacher for management
  const handleSelectTeacher = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      setSelectedTeacherId(null);
      setTeacherClasses([]);
      setTeacherSubjectsByClass({});
      return;
    }
    
    setSelectedTeacherId(teacherId);
    setTeacherClasses(teacher.classes || []);
    setTeacherSubjectsByClass(teacher.subjects || {});
  };

  // Teacher class management
  const handleTeacherClassToggle = (className: string) => {
    setTeacherClasses((prev) => {
      if (prev.includes(className)) {
        // Remove class and its subjects
        const newSubjects = { ...teacherSubjectsByClass };
        delete newSubjects[className];
        setTeacherSubjectsByClass(newSubjects);
        return prev.filter((c) => c !== className);
      } else {
        // Add class with empty subjects
        const newSubjects = { ...teacherSubjectsByClass, [className]: [] };
        setTeacherSubjectsByClass(newSubjects);
        return [...prev, className];
      }
    });
  };

  // Teacher subject management
  const handleTeacherSubjectToggle = (className: string, subject: string) => {
    setTeacherSubjectsByClass((prev) => {
      const currentSubjects = prev[className] || [];
      const newSubjects = currentSubjects.includes(subject)
        ? currentSubjects.filter((s) => s !== subject)
        : [...currentSubjects, subject];
      
      return {
        ...prev,
        [className]: newSubjects.sort((a, b) => a.localeCompare(b))
      };
    });
  };

  const handleSelectAllSubjects = (className: string) => {
    const classLevel = getClassLevel(className);
    const availableSubjects = SUBJECTS_BY_LEVEL[classLevel];
    const currentSubjects = teacherSubjectsByClass[className] || [];
    
    setTeacherSubjectsByClass((prev) => ({
      ...prev,
      [className]:
        currentSubjects.length === availableSubjects.length
          ? []
          : [...availableSubjects]
    }));
  };

  // Show save confirmation popup
  const showSaveConfirmation = (message: string, type: "success" | "error" = "success") => {
    setSavePopupMessage(message);
    setSavePopupType(type);
    setShowSavePopup(true);
    
    // Auto close after 3 seconds
    setTimeout(() => {
      setShowSavePopup(false);
      // If success, reset teacher selection
      if (type === "success") {
        setSelectedTeacherId(null);
        setTeacherClasses([]);
        setTeacherSubjectsByClass({});
      }
    }, 3000);
  };

  // Save teacher updates
  const handleSaveTeacher = async () => {
    if (!selectedTeacherId) {
      showSaveConfirmation("Please select a teacher.", "error");
      return;
    }

    if (teacherClasses.length === 0) {
      showSaveConfirmation("Teacher must have at least one class.", "error");
      return;
    }

    // Validate each class has at least one subject
    for (const className of teacherClasses) {
      if (!teacherSubjectsByClass[className] || teacherSubjectsByClass[className].length === 0) {
        showSaveConfirmation(`Please select at least one subject for ${className}`, "error");
        return;
      }
    }

    try {
      const teacherRef = doc(db, "teachers", selectedTeacherId);
      await updateDoc(teacherRef, {
        classes: teacherClasses,
        subjects: teacherSubjectsByClass,
        updatedAt: new Date()
      });

      // Update local state
      setTeachers(prev => prev.map(t => 
        t.id === selectedTeacherId 
          ? { ...t, classes: teacherClasses, subjects: teacherSubjectsByClass }
          : t
      ));

      showSaveConfirmation("✅ Teacher profile updated successfully!");
      refreshStudents();
    } catch (error: any) {
      console.error("Error updating teacher:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  // Handle promotion with subject updates
  const handlePromoteStudents = async () => {
    if (!oldClass || !newClass || oldClass === newClass) {
      showSaveConfirmation("Select valid classes for promotion.", "error");
      return;
    }

    // For SS2-SS3, show subject selection modal
    if (newClass === "SS2" || newClass === "SS3") {
      setShowSubjectModal(true);
      return;
    }

    // For other classes, auto-assign subjects
    await performPromotion(oldClass, newClass);
  };

  const performPromotion = async (fromClass: string, toClass: string, selectedSubjects?: string[]) => {
    try {
      const studentsToPromote = students.filter(s => s.className === fromClass);
      
      for (const student of studentsToPromote) {
        const studentRef = doc(db, "students", student.id);
        
        // Determine new subjects based on class
        let newSubjects: string[] = [];
        if (selectedSubjects && selectedSubjects.length > 0) {
          // Use selected subjects for SS2/SS3
          newSubjects = selectedSubjects;
        } else {
          // Auto-assign based on class level
          const classLevel = getClassLevel(toClass);
          newSubjects = [...SUBJECTS_BY_LEVEL[classLevel]];
        }
        
        await updateDoc(studentRef, {
          className: toClass,
          subjects: newSubjects,
          promotedAt: new Date()
        });
      }

      // Show success message in popup
      showSaveConfirmation(`✅ Successfully promoted ${studentsToPromote.length} students from ${fromClass} to ${toClass}`);
      
      // Refresh data
      const snap = await getDocs(collection(db, "students"));
      const data = snap.docs.map((d) => {
        const raw = d.data() as any;
        const subjects = Array.isArray(raw.subjects)
          ? raw.subjects.map((s: any) => String(s))
          : [];
        const normalizedClass = normalizeClass(raw.className || raw.class || "");
        return {
          id: d.id,
          ...raw,
          className: normalizedClass,
          subjects,
        } as Student;
      });
      setStudents(data);
      
      // Reset promotion form
      setOldClass("");
      setNewClass("");
      setPromoteSubjects([]);
    } catch (error: any) {
      console.error("Error promoting students:", error);
      showSaveConfirmation(`❌ Error: ${error.message}`, "error");
    }
  };

  const handleConfirmPromotionWithSubjects = () => {
    if (promoteSubjects.length === 0) {
      showSaveConfirmation("Please select at least one subject for SS2/SS3 students.", "error");
      return;
    }
    setShowSubjectModal(false);
    performPromotion(oldClass, newClass, promoteSubjects);
  };

  // Render helpers
  const renderTeacherClassesAndSubjects = (teacher: Teacher) => {
    const classes = teacher.classes || [];
    const subjects = teacher.subjects || {};
    const expanded = !!expandedTeacherRows[teacher.id];
    
    return (
      <div className="teacher-classes-cell">
        <button className="mini-toggle" onClick={() => setExpandedTeacherRows(prev => ({
          ...prev,
          [teacher.id]: !prev[teacher.id]
        }))}>
          <span>{classes.length} class{classes.length !== 1 ? 'es' : ''}</span>
          <span className="chev">{expanded ? "▾" : "▸"}</span>
        </button>
        
        {expanded && (
          <div className="teacher-details">
            {classes.map((className) => (
              <div key={className} className="class-subject-group">
                <strong>{className}:</strong>
                <div className="subject-chips">
                  {(subjects[className] || []).map((subject) => (
                    <span key={subject} className="chip">{subject}</span>
                  ))}
                  {(!subjects[className] || subjects[className].length === 0) && (
                    <span className="muted">No subjects</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStudentSubjects = (student: Student) => {
    const subjects = student.subjects || [];
    const expanded = !!expandedStudentRows[student.id];
    
    return (
      <div className="subjects-cell">
        <button className="mini-toggle" onClick={() => setExpandedStudentRows(prev => ({
          ...prev,
          [student.id]: !prev[student.id]
        }))}>
          <span>{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</span>
          <span className="chev">{expanded ? "▾" : "▸"}</span>
        </button>
        
        {expanded && (
          <ul className="subjects-list">
            {subjects.map((subject) => (
              <li key={subject}>{subject}</li>
            ))}
            {subjects.length === 0 && <li className="muted">No subjects</li>}
          </ul>
        )}
      </div>
    );
  };

  // Available classes
  const availableClasses = ["P5", "P6", "JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

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
                  {t.fullName}
                </option>
              ))}
            </select>
            
            <button onClick={handleSaveTeacher}>Save Teacher Profile</button>
          </div>

          {/* Teacher Classes Selection - Only show when teacher is selected */}
          {selectedTeacherId && (
            <div className="teacher-management-section">
              <div className="section-header">
                <h3>Select Classes</h3>
                <button 
                  className="select-all-btn"
                  onClick={() => {
                    if (teacherClasses.length === availableClasses.length) {
                      setTeacherClasses([]);
                      setTeacherSubjectsByClass({});
                    } else {
                      setTeacherClasses([...availableClasses]);
                      const newSubjects: { [key: string]: string[] } = {};
                      availableClasses.forEach(cls => {
                        newSubjects[cls] = [];
                      });
                      setTeacherSubjectsByClass(newSubjects);
                    }
                  }}
                >
                  {teacherClasses.length === availableClasses.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              
              <div className="classes-grid">
                {availableClasses.map((className) => (
                  <label key={className} className={`class-checkbox ${teacherClasses.includes(className) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={teacherClasses.includes(className)}
                      onChange={() => handleTeacherClassToggle(className)}
                    />
                    {className}
                  </label>
                ))}
              </div>

              {/* Subjects for each selected class */}
              {teacherClasses.length > 0 && (
                <div className="subjects-management">
                  <h3>Subjects per Class</h3>
                  {teacherClasses.map((className) => (
                    <div key={className} className="class-subjects-panel">
                      <div className="panel-header">
                        <h4>Subjects for {className}</h4>
                        <button 
                          className="select-all-subjects-btn"
                          onClick={() => handleSelectAllSubjects(className)}
                        >
                          {teacherSubjectsByClass[className]?.length === SUBJECTS_BY_LEVEL[getClassLevel(className)].length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>
                      
                      <div className="subjects-grid">
                        {SUBJECTS_BY_LEVEL[getClassLevel(className)].map((subject) => (
                          <label 
                            key={subject} 
                            className={`subject-checkbox ${teacherSubjectsByClass[className]?.includes(subject) ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={teacherSubjectsByClass[className]?.includes(subject) || false}
                              onChange={() => handleTeacherSubjectToggle(className, subject)}
                            />
                            {subject}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
            >
              <option value="">To Class</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button onClick={handlePromoteStudents}>Promote</button>
          </div>
          
          {oldClass && (
            <div className="promotion-info">
              <p>
                <strong>{students.filter(s => s.className === oldClass).length}</strong> students in {oldClass}
              </p>
            </div>
          )}
        </section>

        {/* Students Table */}
        <section className="management">
          <h2>All Students ({filteredStudents.length})</h2>
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
                    <td>{renderStudentSubjects(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Teachers Table */}
        <section className="management">
          <h2>All Teachers ({filteredTeachers.length})</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full name</th>
                  <th>Email</th>
                  <th>Classes & Subjects</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id}>
                    <td>{t.fullName}</td>
                    <td>{t.email || "N/A"}</td>
                    <td>{renderTeacherClassesAndSubjects(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Subject Selection Modal for SS2/SS3 Promotion */}
        {showSubjectModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Select Subjects for {newClass}</h3>
                <button className="modal-close" onClick={() => setShowSubjectModal(false)}>×</button>
              </div>
              
              <div className="modal-body">
                <p>Please select the subjects for students being promoted to {newClass}:</p>
                
                <div className="subjects-grid-modal">
                  {SUBJECTS_BY_LEVEL["SS1-SS3"].map((subject) => (
                    <label 
                      key={subject} 
                      className={`subject-checkbox ${promoteSubjects.includes(subject) ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={promoteSubjects.includes(subject)}
                        onChange={() => {
                          setPromoteSubjects(prev =>
                            prev.includes(subject)
                              ? prev.filter(s => s !== subject)
                              : [...prev, subject]
                          );
                        }}
                      />
                      {subject}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowSubjectModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleConfirmPromotionWithSubjects}
                  disabled={promoteSubjects.length === 0}
                >
                  Confirm Promotion ({promoteSubjects.length} subjects)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Confirmation Popup */}
        {showSavePopup && (
          <div className="modal-overlay">
            <div className="save-popup">
              <div className={`popup-content ${savePopupType}`}>
                <div className="popup-icon">
                  {savePopupType === "success" ? "✅" : "❌"}
                </div>
                <h3>{savePopupType === "success" ? "Success!" : "Error!"}</h3>
                <p>{savePopupMessage}</p>
                <div className="popup-progress">
                  <div className="progress-bar"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        :root { 
          --primary: #2b6cb0; 
          --success: #38a169;
          --danger: #e53e3e;
          --warning: #d69e2e;
          --muted: #718096;
          --bg: #f7f8fc;
          --border: #e2e8f0;
          --card-bg: #ffffff;
        }
        
        * {
          box-sizing: border-box;
        }
        
        .dashboard-container { 
          display: flex; 
          height: 100vh; 
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg);
        }
        
        .sidebar { 
          width: 250px; 
          background: var(--card-bg); 
          padding: 24px; 
          border-right: 1px solid var(--border);
          box-shadow: 2px 0 8px rgba(0,0,0,0.05);
        }
        
        .sidebar h2 { 
          margin: 0 0 24px 0; 
          font-size: 20px; 
          color: #2d3748;
          font-weight: 600;
        }
        
        .sidebar ul { 
          list-style: none; 
          padding: 0; 
          margin: 0; 
        }
        
        .sidebar li { 
          padding: 12px 16px; 
          color: #4a5568;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .sidebar li:hover {
          background: #edf2f7;
          color: var(--primary);
        }
        
        .main-content { 
          flex: 1; 
          padding: 24px; 
          overflow: auto; 
        }
        
        .topbar { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          margin-bottom: 24px; 
          gap: 16px; 
        }
        
        .topbar input { 
          flex: 1;
          padding: 10px 16px; 
          border-radius: 8px; 
          border: 1px solid var(--border);
          font-size: 14px;
          max-width: 400px;
        }
        
        .topbar input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }
        
        .topbar-actions {
          display: flex;
          gap: 12px;
        }
        
        button {
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--card-bg);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          color: #4a5568;
        }
        
        button:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
          transform: translateY(-1px);
        }
        
        .btn-primary {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        
        .btn-primary:hover {
          background: #2c5282;
          border-color: #2c5282;
        }
        
        .btn-secondary {
          background: #edf2f7;
          color: #4a5568;
          border-color: #cbd5e0;
        }
        
        .btn-secondary:hover {
          background: #e2e8f0;
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .management { 
          background: var(--card-bg); 
          padding: 24px; 
          border-radius: 12px; 
          margin-bottom: 24px; 
          border: 1px solid var(--border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .management h2 {
          margin: 0 0 20px 0;
          font-size: 18px;
          color: #2d3748;
          font-weight: 600;
        }
        
        .management h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #4a5568;
          font-weight: 600;
        }
        
        .management h4 {
          margin: 0;
          font-size: 15px;
          color: #4a5568;
          font-weight: 600;
        }
        
        .row { 
          display: flex; 
          gap: 12px; 
          align-items: center; 
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        select { 
          padding: 10px 16px; 
          border-radius: 8px; 
          border: 1px solid var(--border);
          background: var(--card-bg);
          font-size: 14px;
          min-width: 200px;
          color: #4a5568;
        }
        
        select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }
        
        .teacher-management-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .select-all-btn, .select-all-subjects-btn {
          padding: 8px 16px;
          font-size: 13px;
          background: #edf2f7;
          border: none;
        }
        
        .select-all-btn:hover, .select-all-subjects-btn:hover {
          background: #e2e8f0;
        }
        
        .classes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .class-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 2px solid var(--border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .class-checkbox:hover {
          border-color: #cbd5e0;
          background: #f7fafc;
        }
        
        .class-checkbox.selected {
          border-color: var(--primary);
          background: rgba(43, 108, 176, 0.1);
          color: var(--primary);
        }
        
        .class-checkbox input {
          margin: 0;
        }
        
        .subjects-management {
          margin-top: 24px;
        }
        
        .class-subjects-panel {
          background: #f7fafc;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .subjects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        
        .subjects-grid-modal {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
          padding: 16px;
          background: #f7fafc;
          border-radius: 8px;
          margin: 16px 0;
        }
        
        .subject-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          background: var(--card-bg);
        }
        
        .subject-checkbox:hover {
          border-color: #cbd5e0;
          background: #f7fafc;
        }
        
        .subject-checkbox.selected {
          border-color: var(--primary);
          background: rgba(43, 108, 176, 0.1);
          color: var(--primary);
        }
        
        .subject-checkbox input {
          margin: 0;
        }
        
        .promotion-info {
          background: #f0fff4;
          border: 1px solid #c6f6d5;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }
        
        .promotion-info p {
          margin: 0;
          color: #276749;
        }
        
        .table-wrap { 
          overflow: auto; 
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
        }
        
        th, td { 
          border-bottom: 1px solid var(--border); 
          padding: 16px; 
          text-align: left; 
          vertical-align: top; 
        }
        
        th { 
          background: #f7fafc; 
          font-weight: 600; 
          color: #4a5568;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        tr:hover {
          background: #f7fafc;
        }
        
        .teacher-classes-cell, .subjects-cell {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .mini-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--card-bg);
          cursor: pointer;
          font-size: 14px;
          color: #4a5568;
          transition: all 0.2s;
        }
        
        .mini-toggle:hover {
          border-color: #cbd5e0;
          background: #f7fafc;
        }
        
        .mini-toggle .chev {
          font-size: 12px;
          color: var(--muted);
        }
        
        .teacher-details {
          padding: 16px;
          background: #f7fafc;
          border-radius: 8px;
          border: 1px solid var(--border);
        }
        
        .class-subject-group {
          margin-bottom: 16px;
        }
        
        .class-subject-group:last-child {
          margin-bottom: 0;
        }
        
        .subject-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        
        .chip {
          padding: 4px 12px;
          background: #edf2f7;
          border-radius: 16px;
          font-size: 13px;
          color: #4a5568;
          border: 1px solid #cbd5e0;
        }
        
        .subjects-list {
          margin: 0;
          padding-left: 20px;
        }
        
        .subjects-list li {
          margin: 8px 0;
          color: #4a5568;
          font-size: 14px;
        }
        
        .muted { 
          color: var(--muted);
          font-style: italic;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
          padding: 20px;
        }
        
        .modal {
          background: var(--card-bg);
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          animation: modalSlideIn 0.3s ease;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #2d3748;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--muted);
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: background-color 0.2s;
        }
        
        .modal-close:hover {
          background: #edf2f7;
          color: #4a5568;
        }
        
        .modal-body {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
        }
        
        .modal-body p {
          margin: 0 0 16px 0;
          color: #4a5568;
        }
        
        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        /* Save Confirmation Popup */
        .save-popup {
          width: 100%;
          max-width: 400px;
          animation: popupSlideIn 0.3s ease;
        }
        
        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .popup-content {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .popup-content.success {
          border-top: 4px solid var(--success);
        }
        
        .popup-content.error {
          border-top: 4px solid var(--danger);
        }
        
        .popup-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .popup-content h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #2d3748;
        }
        
        .popup-content p {
          margin: 0 0 20px 0;
          color: #4a5568;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .popup-progress {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          width: 100%;
          background: var(--success);
          animation: progressShrink 3s linear forwards;
          transform-origin: left;
        }
        
        .popup-content.error .progress-bar {
          background: var(--danger);
        }
        
        @keyframes progressShrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .dashboard-container {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            height: auto;
            position: relative;
          }
          
          .row {
            flex-direction: column;
            align-items: stretch;
          }
          
          select, .topbar input {
            min-width: 100%;
          }
          
          .classes-grid {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }
          
          .subjects-grid, .subjects-grid-modal {
            grid-template-columns: 1fr;
          }
          
          .modal, .save-popup {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
