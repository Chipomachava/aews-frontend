import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconPlus, IconUserPlus, IconUpload } from "@tabler/icons-react";

interface UserInfo {
  userID: number;
  email: string;
  role: string;
}

interface StudentInfo {
  studentID: number;
  studentNumber: string;
  fullName: string;
}

interface ModuleInfo {
  moduleID: number;
  moduleCode: string;
  moduleName: string;
}

function Students() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [studentNumber, setStudentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [createModuleID, setCreateModuleID] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const [enrollingID, setEnrollingID] = useState<number | null>(null);
  const [enrollModuleID, setEnrollModuleID] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState("");

  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkModuleID, setBulkModuleID] = useState<number | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  const loadData = async () => {
    try {
      const [sRes, mRes] = await Promise.all([api.get("/students/"), api.get("/modules/")]);
      setStudents(sRes.data);
      setModules(mRes.data);
      if (mRes.data.length > 0) {
        setEnrollModuleID(mRes.data[0].moduleID);
        setCreateModuleID(mRes.data[0].moduleID);
        setBulkModuleID(mRes.data[0].moduleID);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);
        await loadData();
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load data");
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await api.post("/students/", { studentNumber, fullName });
      const newStudentID = res.data.studentID;

      if (createModuleID) {
        await api.post("/enrollments/", null, {
          params: { studentID: newStudentID, moduleID: createModuleID },
        });
      }

      setStudentNumber("");
      setFullName("");
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create student");
    } finally {
      setCreating(false);
    }
  };

  const handleEnroll = async (studentID: number) => {
    if (!enrollModuleID) return;
    setEnrolling(true);
    setEnrollMessage("");
    setError("");
    try {
      const res = await api.post("/enrollments/", null, {
        params: { studentID, moduleID: enrollModuleID },
      });
      setEnrollMessage(res.data.message);
      setEnrollingID(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to enroll student");
    } finally {
      setEnrolling(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile || !bulkModuleID) return;

    setBulkUploading(true);
    setError("");
    setBulkResult(null);

    const formData = new FormData();
    formData.append("file", bulkFile);

    try {
      const res = await api.post(`/students/bulk-upload/${bulkModuleID}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBulkResult(res.data);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
  };
    const handleDelete = async (studentID: number, studentName: string) => {
    if (!window.confirm(`Delete ${studentName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/students/${studentID}`);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete student");
    }
  };

  if (user && user.role !== "Admin") {
    return (
      <DashboardLayout userEmail={user.email} userRole={user.role}>
        <p style={{ color: "#c0392b" }}>You do not have permission to view this page.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", color: "#1a1a1a" }}>Students</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => { setShowBulkForm(!showBulkForm); setShowForm(false); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#fff", color: "#4338ca", border: "1.5px solid #4338ca", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
          >
            <IconUpload size={16} />
            Bulk upload CSV
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowBulkForm(false); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
          >
            <IconPlus size={16} />
            New student
          </button>
        </div>
      </div>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>Manage students and module enrollments.</p>

      {showBulkForm && (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "24px", marginBottom: "24px", maxWidth: "480px" }}>
          <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: "4px" }}>Bulk upload students</div>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
            CSV must have columns: <code>studentNumber</code>, <code>fullName</code>. Students will be created (if new) and enrolled into the selected module.
          </p>
          <form onSubmit={handleBulkUpload} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Module</label>
              <br />
              <select
                value={bulkModuleID ?? ""}
                onChange={(e) => setBulkModuleID(Number(e.target.value))}
                style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff" }}
              >
                {modules.map((m) => (
                  <option key={m.moduleID} value={m.moduleID}>
                    {m.moduleCode} — {m.moduleName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>CSV file</label>
              <br />
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                style={{ marginTop: "8px", color: "#1a1a1a" }}
              />
            </div>
            <button
              type="submit"
              disabled={bulkUploading || !bulkFile || !bulkModuleID}
              style={{ padding: "10px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
            >
              {bulkUploading ? "Uploading..." : "Upload"}
            </button>
          </form>

          {bulkResult && (
            <div style={{ marginTop: "16px", padding: "12px 14px", background: "#e6f6ea", color: "#1e8e3e", borderRadius: "8px", fontSize: "13px" }}>
              <strong>Done.</strong> {bulkResult.studentsCreated} new student(s) created, {bulkResult.studentsEnrolled} enrolled, {bulkResult.alreadyEnrolled} already enrolled.
              {bulkResult.errors?.length > 0 && (
                <ul style={{ margin: "8px 0 0", paddingLeft: "18px" }}>
                  {bulkResult.errors.map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "24px", marginBottom: "24px", maxWidth: "440px" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Student number</label>
              <br />
              <input type="text" value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} required style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff" }} />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Full name</label>
              <br />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff" }} />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Enroll in module</label>
              <br />
              <select
                value={createModuleID ?? ""}
                onChange={(e) => setCreateModuleID(Number(e.target.value))}
                style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff" }}
              >
                {modules.map((m) => (
                  <option key={m.moduleID} value={m.moduleID}>
                    {m.moduleCode} — {m.moduleName}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={creating} style={{ padding: "10px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}>
              {creating ? "Creating..." : "Create & enroll student"}
            </button>
          </form>
        </div>
      )}

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}
      {enrollMessage && <p style={{ color: "#1e8e3e" }}>{enrollMessage}</p>}

      {loading ? (
        <p style={{ color: "#1a1a1a" }}>Loading...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Student number</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Name</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Enroll in module</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Name</th>

              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.studentID} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{s.studentNumber}</td>
                  <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{s.fullName}</td>
                  <td style={{ padding: "12px 20px" }}>
                    {enrollingID === s.studentID ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <select
                          value={enrollModuleID ?? ""}
                          onChange={(e) => setEnrollModuleID(Number(e.target.value))}
                          style={{ padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #d0d0d8", background: "#fff", color: "#1a1a1a", fontSize: "13px" }}
                        >
                          {modules.map((m) => (
                            <option key={m.moduleID} value={m.moduleID}>
                              {m.moduleCode}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleEnroll(s.studentID)}
                          disabled={enrolling}
                          style={{ padding: "6px 12px", background: "#1e8e3e", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                        >
                          Confirm
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEnrollingID(s.studentID)}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#fff", color: "#4338ca", border: "1px solid #4338ca", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                      >
                        <IconUserPlus size={14} />
                        Enroll
                      </button>
                    )}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <button
                      onClick={() => handleDelete(s.studentID, s.fullName)}
                      style={{ padding: "6px 12px", background: "#fff", color: "#c0392b", border: "1px solid #c0392b", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export default Students;