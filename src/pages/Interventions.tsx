import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconPlus, IconCheck } from "@tabler/icons-react";

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

interface RiskStudent {
  studentID: number;
  studentNumber: string;
  fullName: string;
  riskLabel: string;
  totalScore: number;
}

interface InterventionInfo {
  interventionID: number;
  studentID: number;
  lecturerID: number;
  interventionType: string;
  description: string;
  riskLabelAtTime: string;
  status: string;
  outcomeNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

function Interventions() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [interventions, setInterventions] = useState<InterventionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [formModuleID, setFormModuleID] = useState<number | null>(null);
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [studentID, setStudentID] = useState("");
  const [interventionType, setInterventionType] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [resolvingID, setResolvingID] = useState<number | null>(null);
  const [outcomeNote, setOutcomeNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const [notifyingID, setNotifyingID] = useState<number | null>(null);
  const [notifyChannel, setNotifyChannel] = useState("Email");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState("");

  const loadInterventions = async () => {
    try {
      const res = await api.get("/interventions/");
      setInterventions(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load interventions");
    } finally {
      setLoading(false);
    }
  };

  const loadRiskStudents = async (moduleID: number) => {
    try {
      const res = await api.get(`/risk-scores/module/${moduleID}/full`);
      const atRisk = res.data.students.filter(
        (s: any) => s.riskLabel === "High" || s.riskLabel === "Medium"
      );
      setRiskStudents(atRisk);
      setStudentID(atRisk.length > 0 ? String(atRisk[0].studentID) : "");
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || "Failed to load at-risk students for this module");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);

        const endpoint = userRes.data.role === "Admin" ? "/modules/" : "/lecturer-modules/my-modules";
        const modRes = await api.get(endpoint);
        setModules(modRes.data);
        if (modRes.data.length > 0) {
          const firstID = modRes.data[0].moduleID;
          setFormModuleID(firstID);
          await loadRiskStudents(firstID);
        }

        await loadInterventions();
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load data");
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleFormModuleChange = async (moduleID: number) => {
    setFormModuleID(moduleID);
    await loadRiskStudents(moduleID);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentID) return;
    setCreating(true);
    setCreateError("");

    try {
      await api.post("/interventions/", {
        studentID: Number(studentID),
        interventionType,
        description,
      });
      setInterventionType("");
      setDescription("");
      setShowForm(false);
      await loadInterventions();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || "Failed to record intervention");
    } finally {
      setCreating(false);
    }
  };

  const handleResolve = async (interventionID: number) => {
    setResolving(true);
    try {
      await api.patch(`/interventions/${interventionID}/resolve`, { outcomeNote });
      setResolvingID(null);
      setOutcomeNote("");
      await loadInterventions();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to resolve intervention");
    } finally {
      setResolving(false);
    }
  };

  const handleNotify = async (interventionID: number) => {
    if (!notifyMessage) return;
    setNotifying(true);
    setNotifySuccess("");
    try {
      const res = await api.post(`/interventions/${interventionID}/notify`, {
        channel: notifyChannel,
        message: notifyMessage,
      });
      setNotifySuccess(res.data.message);
      setNotifyingID(null);
      setNotifyMessage("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send notification");
    } finally {
      setNotifying(false);
    }
  };

  const statusColor = (status: string) =>
    status === "Resolved" ? { bg: "#e6f6ea", text: "#1e8e3e" } : { bg: "#fff3e0", text: "#c77700" };

  const riskColor = (label: string) =>
    label === "High" ? "#c0392b" : label === "Medium" ? "#c77700" : "#1e8e3e";

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", color: "#1a1a1a" }}>Interventions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
        >
          <IconPlus size={16} />
          Record intervention
        </button>
      </div>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>
        Support actions recorded for at-risk students.
      </p>

      {showForm && (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "20px", marginBottom: "24px", maxWidth: "520px" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Module</label>
              <br />
              <select
                value={formModuleID ?? ""}
                onChange={(e) => handleFormModuleChange(Number(e.target.value))}
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
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>At-risk student</label>
              <br />
              {riskStudents.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#888", marginTop: "6px" }}>
                  No High or Medium risk students found for this module.
                </p>
              ) : (
                <select
                  value={studentID}
                  onChange={(e) => setStudentID(e.target.value)}
                  style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff" }}
                >
                  {riskStudents.map((s) => (
                    <option key={s.studentID} value={s.studentID}>
                      {s.studentNumber} — {s.fullName} ({s.riskLabel}, score {s.totalScore})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Intervention type</label>
              <br />
              <input
                type="text"
                value={interventionType}
                onChange={(e) => setInterventionType(e.target.value)}
                required
                placeholder="e.g. Check-in Meeting"
                style={{ padding: "8px 12px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ddd", width: "100%", color: "#1a1a1a", background: "#fff" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Description</label>
              <br />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                style={{ padding: "8px 12px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ddd", width: "100%", color: "#1a1a1a", fontFamily: "inherit", background: "#fff" }}
              />
            </div>
            {createError && (
              <div style={{ padding: "10px 12px", background: "#fde8e8", color: "#c0392b", borderRadius: "6px", fontSize: "13px" }}>
                {createError}
              </div>
            )}
            <button
              type="submit"
              disabled={creating || !studentID}
              style={{ padding: "8px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}
            >
              {creating ? "Saving..." : "Save intervention"}
            </button>
          </form>
        </div>
      )}

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}
      {notifySuccess && <p style={{ color: "#1e8e3e" }}>{notifySuccess}</p>}

      {loading ? (
        <p style={{ color: "#1a1a1a" }}>Loading...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", overflow: "hidden" }}>
          {interventions.length === 0 ? (
            <p style={{ padding: "20px", color: "#1a1a1a" }}>No interventions recorded yet.</p>
          ) : (
            interventions.map((iv) => {
              const colors = statusColor(iv.status);
              return (
                <div key={iv.interventionID} style={{ padding: "16px 20px", borderTop: "1px solid #f0f0f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "14px" }}>
                        {iv.interventionType} — Student {iv.studentID}
                      </div>
                      <div style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>{iv.description}</div>
                      <div style={{ color: "#888", fontSize: "12px", marginTop: "6px" }}>
                        Risk at time: <span style={{ color: riskColor(iv.riskLabelAtTime), fontWeight: 500 }}>{iv.riskLabelAtTime}</span>
                        {" "}&middot; {new Date(iv.createdAt).toLocaleDateString()}
                      </div>
                      {iv.outcomeNote && (
                        <div style={{ marginTop: "8px", fontSize: "13px", color: "#1a1a1a", background: "#f7f7fa", padding: "8px 10px", borderRadius: "6px" }}>
                          <strong>Outcome:</strong> {iv.outcomeNote}
                        </div>
                      )}
                    </div>
                    <span style={{ background: colors.bg, color: colors.text, fontSize: "12px", padding: "4px 10px", borderRadius: "6px", whiteSpace: "nowrap" }}>
                      {iv.status}
                    </span>
                  </div>

                  <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    {notifyingID === iv.interventionID ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "400px" }}>
                        <select
                          value={notifyChannel}
                          onChange={(e) => setNotifyChannel(e.target.value)}
                          style={{ padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #d0d0d8", fontSize: "13px", color: "#1a1a1a", background: "#fff" }}
                        >
                          <option value="Email">Email</option>
                          <option value="SMS">SMS</option>
                        </select>
                        <textarea
                          value={notifyMessage}
                          onChange={(e) => setNotifyMessage(e.target.value)}
                          placeholder={`Message to send via ${notifyChannel}...`}
                          rows={2}
                          style={{ padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #d0d0d8", fontSize: "13px", color: "#1a1a1a", background: "#fff", fontFamily: "inherit" }}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleNotify(iv.interventionID)}
                            disabled={notifying || !notifyMessage}
                            style={{ padding: "6px 12px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                          >
                            {notifying ? "Sending..." : "Send"}
                          </button>
                          <button
                            onClick={() => setNotifyingID(null)}
                            style={{ padding: "6px 12px", background: "#fff", color: "#666", border: "1px solid #ddd", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNotifyingID(iv.interventionID)}
                        style={{ padding: "6px 12px", background: "#fff", color: "#4338ca", border: "1px solid #4338ca", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                      >
                        Notify student
                      </button>
                    )}
                  </div>

                  {iv.status === "Open" && (
                    <div style={{ marginTop: "12px" }}>
                      {resolvingID === iv.interventionID ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <input
                            type="text"
                            value={outcomeNote}
                            onChange={(e) => setOutcomeNote(e.target.value)}
                            placeholder="Outcome note"
                            style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #d0d0d8", fontSize: "13px", color: "#1a1a1a", background: "#fff" }}
                          />
                          <button
                            onClick={() => handleResolve(iv.interventionID)}
                            disabled={resolving || !outcomeNote}
                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#1e8e3e", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                          >
                            <IconCheck size={14} />
                            Confirm
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setResolvingID(iv.interventionID)}
                          style={{ padding: "6px 12px", background: "#fff", color: "#4338ca", border: "1px solid #4338ca", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default Interventions;