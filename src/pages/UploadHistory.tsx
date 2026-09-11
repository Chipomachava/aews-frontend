import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconFile, IconChevronDown, IconChevronUp, IconChartBar } from "@tabler/icons-react";

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

interface UploadEntry {
  uploadID: number;
  fileName: string;
  status: string;
  recordCount: number;
  uploadedAt: string;
}

interface UploadDetail {
  uploadID: number;
  fileName: string;
  uploadedAt: string;
  indicatorNames: string[];
  students: { studentID: number; studentNumber: string; fullName: string; values: Record<string, number> }[];
}

function UploadHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModuleID, setSelectedModuleID] = useState<number | null>(null);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [expandedID, setExpandedID] = useState<number | null>(null);
  const [detail, setDetail] = useState<UploadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [analyzingID, setAnalyzingID] = useState<number | null>(null);
  const [analyzeSuccess, setAnalyzeSuccess] = useState("");

  const loadUploads = async (moduleID: number) => {
    try {
      const res = await api.get(`/uploads/module/${moduleID}/history`);
      setUploads(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load upload history");
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
          setSelectedModuleID(firstID);
          await loadUploads(firstID);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleModuleChange = async (moduleID: number) => {
    setSelectedModuleID(moduleID);
    setExpandedID(null);
    setDetail(null);
    await loadUploads(moduleID);
  };

  const toggleExpand = async (uploadID: number) => {
    if (expandedID === uploadID) {
      setExpandedID(null);
      setDetail(null);
      return;
    }
    setExpandedID(uploadID);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/uploads/${uploadID}/records`);
      setDetail(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load upload details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAnalyze = async (uploadID: number) => {
    setAnalyzingID(uploadID);
    setAnalyzeSuccess("");
    setError("");
    try {
      const res = await api.post(`/risk-scores/compute/${uploadID}`);
      setAnalyzeSuccess(`Analyzed ${res.data.studentsScored} student(s) from this upload.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to analyze this upload");
    } finally {
      setAnalyzingID(null);
    }
  };

  const statusColor = (status: string) =>
    status === "Success" ? { bg: "#e6f6ea", text: "#1e8e3e" } : { bg: "#fde8e8", text: "#c0392b" };

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <h1 style={{ margin: "0 0 4px", fontSize: "22px", color: "#1a1a1a" }}>Upload history</h1>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>
        Review previously uploaded CSV files and re-analyze any of them.
      </p>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Module</label>
        <br />
        <select
          value={selectedModuleID ?? ""}
          onChange={(e) => handleModuleChange(Number(e.target.value))}
          style={{ padding: "8px 12px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", color: "#1a1a1a", minWidth: "220px" }}
        >
          {modules.map((m) => (
            <option key={m.moduleID} value={m.moduleID}>
              {m.moduleCode} — {m.moduleName}
            </option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}
      {analyzeSuccess && (
        <div style={{ marginBottom: "16px", padding: "10px 14px", background: "#e6f6ea", color: "#1e8e3e", borderRadius: "6px", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {analyzeSuccess}
          <button
            onClick={() => navigate("/analysis")}
            style={{ padding: "5px 12px", background: "#1e8e3e", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
          >
            View in Analysis →
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#1a1a1a" }}>Loading...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", overflow: "hidden" }}>
          {uploads.length === 0 ? (
            <p style={{ padding: "20px", color: "#1a1a1a" }}>No successful uploads found for this module.</p>
          ) : (
            uploads.map((u) => {
              const colors = statusColor(u.status);
              const isExpanded = expandedID === u.uploadID;
              return (
                <div key={u.uploadID} style={{ borderTop: "1px solid #f0f0f0" }}>
                  <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div
                      onClick={() => toggleExpand(u.uploadID)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: 1 }}
                    >
                      <IconFile size={18} color="#666" />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: "14px", color: "#1a1a1a" }}>{u.fileName}</div>
                        <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                          {new Date(u.uploadedAt).toLocaleString()} &middot; {u.recordCount} record{u.recordCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ background: colors.bg, color: colors.text, fontSize: "12px", padding: "4px 10px", borderRadius: "6px" }}>
                        {u.status}
                      </span>
                      <button
                        onClick={() => handleAnalyze(u.uploadID)}
                        disabled={analyzingID === u.uploadID}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#fff", color: "#4338ca", border: "1px solid #4338ca", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                      >
                        <IconChartBar size={14} />
                        {analyzingID === u.uploadID ? "Analyzing..." : "Analyze this upload"}
                      </button>
                      <div onClick={() => toggleExpand(u.uploadID)} style={{ cursor: "pointer" }}>
                        {isExpanded ? <IconChevronUp size={16} color="#888" /> : <IconChevronDown size={16} color="#888" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: "0 20px 16px" }}>
                      {loadingDetail ? (
                        <p style={{ color: "#1a1a1a", fontSize: "13px" }}>Loading records...</p>
                      ) : detail && detail.uploadID === u.uploadID ? (
                        detail.students.length === 0 ? (
                          <p style={{ color: "#666", fontSize: "13px" }}>No records saved from this upload.</p>
                        ) : (
                          <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: "8px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                              <thead>
                                <tr style={{ textAlign: "left", background: "#fafafa" }}>
                                  <th style={{ padding: "8px 14px", color: "#666", fontWeight: 500 }}>Student</th>
                                  {detail.indicatorNames.map((name) => (
                                    <th key={name} style={{ padding: "8px 14px", color: "#666", fontWeight: 500 }}>{name}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {detail.students.map((s) => (
                                  <tr key={s.studentID} style={{ borderTop: "1px solid #f0f0f0" }}>
                                    <td style={{ padding: "8px 14px", color: "#1a1a1a" }}>
                                      {s.studentNumber} — {s.fullName}
                                    </td>
                                    {detail.indicatorNames.map((name) => (
                                      <td key={name} style={{ padding: "8px 14px", color: "#1a1a1a" }}>
                                        {s.values[name] !== undefined ? s.values[name] : "–"}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      ) : null}
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

export default UploadHistory;