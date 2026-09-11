import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconBooks, IconPlus, IconUserCog } from "@tabler/icons-react";

interface UserInfo {
  userID: number;
  email: string;
  role: string;
  fullName?: string;
}

interface ModuleInfo {
  moduleID: number;
  moduleCode: string;
  moduleName: string;
}

function Modules() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [lecturers, setLecturers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [moduleCode, setModuleCode] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [assigningID, setAssigningID] = useState<number | null>(null);
  const [selectedLecturerID, setSelectedLecturerID] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  const loadModules = async (role: string) => {
    try {
      const endpoint = role === "Admin" ? "/modules/" : "/lecturer-modules/my-modules";
      const res = await api.get(endpoint);
      setModules(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  const loadLecturers = async () => {
    try {
      const res = await api.get("/users/");
      setLecturers(res.data.filter((u: UserInfo) => u.role === "Lecturer"));
    } catch (err: any) {
      // silently skip if not Admin / endpoint unavailable
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);
        await loadModules(userRes.data.role);
        if (userRes.data.role === "Admin") {
          await loadLecturers();
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load data");
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      await api.post("/modules/", { moduleCode, moduleName });
      setModuleCode("");
      setModuleName("");
      setShowForm(false);
      if (user) await loadModules(user.role);
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || "Failed to create module");
    } finally {
      setCreating(false);
    }
  };

  const handleAssignLecturer = async (moduleID: number) => {
    if (!selectedLecturerID) return;
    setAssigning(true);
    setSuccessMsg("");
    setError("");
    try {
      const res = await api.post("/lecturer-modules/", null, {
        params: { lecturerID: selectedLecturerID, moduleID },
      });
      setSuccessMsg(res.data.message);
      setAssigningID(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to assign lecturer");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", color: "#1a1a1a" }}>My modules</h1>
        {user?.role === "Admin" && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              background: "#4338ca",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <IconPlus size={16} />
            New module
          </button>
        )}
      </div>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>
        {user?.role === "Admin" ? "All modules in the system." : "Modules assigned to you."}
      </p>

      {showForm && (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "24px", marginBottom: "24px", maxWidth: "440px" }}>
          <form onSubmit={handleCreateModule} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Module code</label>
              <br />
              <input
                type="text"
                value={moduleCode}
                onChange={(e) => setModuleCode(e.target.value)}
                required
                placeholder="e.g. CSIQ6809"
                style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Module name</label>
              <br />
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                required
                placeholder="e.g. Honours Project"
                style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff" }}
              />
            </div>
            {createError && (
              <div style={{ padding: "10px 12px", background: "#fde8e8", color: "#c0392b", borderRadius: "6px", fontSize: "13px" }}>
                {createError}
              </div>
            )}
            <button
              type="submit"
              disabled={creating}
              style={{ padding: "10px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" }}
            >
              {creating ? "Creating..." : "Create module"}
            </button>
          </form>
        </div>
      )}

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}
      {successMsg && <p style={{ color: "#1e8e3e" }}>{successMsg}</p>}

      {loading ? (
        <p style={{ color: "#1a1a1a" }}>Loading...</p>
      ) : modules.length === 0 ? (
        <p style={{ color: "#1a1a1a" }}>No modules found.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {modules.map((m) => (
            <div key={m.moduleID} style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "18px" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: user?.role === "Admin" ? "14px" : 0 }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#eef0fd", color: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <IconBooks size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "14px" }}>{m.moduleCode}</div>
                  <div style={{ color: "#666", fontSize: "13px", marginTop: "2px" }}>{m.moduleName}</div>
                </div>
              </div>

              {user?.role === "Admin" && (
                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "12px" }}>
                  {assigningID === m.moduleID ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <select
                        value={selectedLecturerID ?? ""}
                        onChange={(e) => setSelectedLecturerID(Number(e.target.value))}
                        style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #d0d0d8", background: "#fff", color: "#1a1a1a", fontSize: "13px" }}
                      >
                        <option value="">Select lecturer</option>
                        {lecturers.map((l) => (
                          <option key={l.userID} value={l.userID}>
                            {l.fullName || l.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignLecturer(m.moduleID)}
                        disabled={assigning || !selectedLecturerID}
                        style={{ padding: "6px 12px", background: "#1e8e3e", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigningID(m.moduleID)}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#fff", color: "#4338ca", border: "1px solid #4338ca", borderRadius: "6px", cursor: "pointer", fontSize: "13px", width: "100%", justifyContent: "center" }}
                    >
                      <IconUserCog size={14} />
                      Assign lecturer
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default Modules;