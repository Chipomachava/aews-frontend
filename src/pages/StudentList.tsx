import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconUsers } from "@tabler/icons-react";

interface UserInfo {
  userID: number;
  email: string;
  role: string;
}

interface ModuleInfo {
  moduleID: number;
  moduleCode: string;
  moduleName: string;
}

interface StudentInfo {
  studentID: number;
  studentNumber: string;
  fullName: string;
}

function StudentList() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModuleID, setSelectedModuleID] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);

        const endpoint = userRes.data.role === "Admin" ? "/modules/" : "/lecturer-modules/my-modules";
        const modRes = await api.get(endpoint);
        setModules(modRes.data);
        if (modRes.data.length > 0) {
          setSelectedModuleID(modRes.data[0].moduleID);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedModuleID) return;

    const loadStudents = async () => {
      try {
        const res = await api.get(`/enrollments/module/${selectedModuleID}/students`);
        setStudents(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load students");
      }
    };
    loadStudents();
  }, [selectedModuleID]);

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <h1 style={{ margin: "0 0 4px", fontSize: "22px", color: "#1a1a1a" }}>Student list</h1>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>
        Students enrolled in your module.
      </p>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Module</label>
        <br />
        {modules.length === 0 ? (
          <p style={{ color: "#1a1a1a" }}>No modules assigned yet.</p>
        ) : (
          <select
            value={selectedModuleID ?? ""}
            onChange={(e) => setSelectedModuleID(Number(e.target.value))}
            style={{ padding: "8px 12px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", color: "#1a1a1a" }}
          >
            {modules.map((m) => (
              <option key={m.moduleID} value={m.moduleID}>
                {m.moduleCode} — {m.moduleName}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee", fontWeight: 600, color: "#1a1a1a", display: "flex", alignItems: "center", gap: "8px" }}>
          <IconUsers size={18} />
          {students.length} student{students.length !== 1 ? "s" : ""} enrolled
        </div>
        {loading ? (
          <p style={{ padding: "20px", color: "#1a1a1a" }}>Loading...</p>
        ) : students.length === 0 ? (
          <p style={{ padding: "20px", color: "#1a1a1a" }}>No students enrolled in this module yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Student number</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Full name</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.studentID} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{s.studentNumber}</td>
                  <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{s.fullName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StudentList;