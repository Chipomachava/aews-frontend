import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  IconAlertTriangle,
  IconClipboardList,
  IconCircleCheck,
  IconClock,
  IconFilter,
  IconChevronRight,
} from "@tabler/icons-react";

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

interface StudentRow {
  studentID: number;
  studentNumber: string;
  fullName: string;
  riskScoreID: number;
  totalScore: number;
  riskLabel: string;
  isPartial: boolean;
  indicatorValues: Record<string, number>;
}

interface InterventionInfo {
  interventionID: number;
  status: string;
}

interface LatestUpload {
  fileName: string;
  uploadedAt: string;
  recordCount: number;
}

const INDICATOR_WEIGHTS: Record<string, number> = {
  AssessmentPerformance: 0.40,
  TestPerformance: 0.35,
  AttendanceEngagement: 0.25,
};

const INDICATOR_LABELS: Record<string, string> = {
  AssessmentPerformance: "Assessments",
  TestPerformance: "Tests",
  AttendanceEngagement: "Attendance",
};

// Theme tokens - matched to Dashboard.tsx
const COLORS = {
  purple: "#4338ca",
  purpleBg: "#eef0fd",
  red: "#c0392b",
  redBg: "#fde8e8",
  orange: "#c77700",
  orangeBg: "#fff3e0",
  green: "#1e8e3e",
  greenBg: "#e6f6ea",
  heading: "#1a1a1a",
  secondaryText: "#555",
  mutedText: "#666",
  faintText: "#888",
  border: "#eee",
  rowBorder: "#f0f0f0",
  rowHover: "#fafafa",
};

interface BreakdownRow {
  name: string;
  label: string;
  raw: number;
  effectiveWeight: number;
  points: number;
}

function getBreakdownData(student: StudentRow, indicatorNames: string[]) {
  const present = indicatorNames.filter((n) => student.indicatorValues[n] !== undefined);
  const missing = indicatorNames.filter((n) => student.indicatorValues[n] === undefined);

  const totalDefinedWeight = present.reduce(
    (sum, n) => sum + (INDICATOR_WEIGHTS[n] ?? 1 / (indicatorNames.length || 1)),
    0
  );

  const rows: BreakdownRow[] = present.map((n) => {
    const rawWeight = INDICATOR_WEIGHTS[n] ?? 1 / (indicatorNames.length || 1);
    const effectiveWeight = totalDefinedWeight > 0 ? rawWeight / totalDefinedWeight : 0;
    const raw = student.indicatorValues[n];
    const points = raw * effectiveWeight;
    return { name: n, label: INDICATOR_LABELS[n] ?? n, raw, effectiveWeight, points };
  });

  return { rows, missing };
}

function riskColor(label: string) {
  if (label === "High") return { bg: COLORS.redBg, text: COLORS.red };
  if (label === "Medium") return { bg: COLORS.orangeBg, text: COLORS.orange };
  return { bg: COLORS.greenBg, text: COLORS.green };
}

function formatSyncTime(iso: string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
  const timePart = d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart} ${timePart}`;
}

function Analysis() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModuleID, setSelectedModuleID] = useState<number | null>(null);
  const [indicatorNames, setIndicatorNames] = useState<string[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [interventionMap, setInterventionMap] = useState<Record<number, InterventionInfo>>({});
  const [latestUpload, setLatestUpload] = useState<LatestUpload | null>(null);
  const [riskFilter, setRiskFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadInterventions = async () => {
    try {
      const res = await api.get("/interventions/");
      const all: any[] = res.data || [];
      const sorted = [...all].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const map: Record<number, InterventionInfo> = {};
      for (const iv of sorted) {
        if (!(iv.studentID in map)) {
          map[iv.studentID] = { interventionID: iv.interventionID, status: iv.status };
        }
      }
      setInterventionMap(map);
    } catch {
      setInterventionMap({});
    }
  };

  const loadLatestUpload = async (moduleID: number) => {
    try {
      const res = await api.get(`/uploads/module/${moduleID}/history`);
      const history = res.data || [];
      setLatestUpload(history.length > 0 ? history[0] : null);
    } catch {
      setLatestUpload(null);
    }
  };

  const loadAnalysis = async (moduleID: number) => {
    try {
      const res = await api.get(`/risk-scores/module/${moduleID}/full`);
      const fetchedStudents: StudentRow[] = res.data.students || [];
      setIndicatorNames(res.data.indicatorNames || []);
      setStudents(fetchedStudents);

      const sorted = [...fetchedStudents].sort((a, b) => b.totalScore - a.totalScore);
      setSelectedStudent(sorted[0] ?? null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load module analysis records");
    }

    await Promise.all([loadInterventions(), loadLatestUpload(moduleID)]);
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
          const firstModuleID = modRes.data[0].moduleID;
          setSelectedModuleID(firstModuleID);
          await loadAnalysis(firstModuleID);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load module data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleModuleChange = async (moduleID: number) => {
    setSelectedModuleID(moduleID);
    setLoading(true);
    await loadAnalysis(moduleID);
    setLoading(false);
  };

  const handleRecordNote = async () => {
    if (!selectedStudent) return;
    const interventionType = window.prompt(
      "Intervention type (e.g. Academic Counseling, Parent Contact, Tutoring Referral):"
    );
    if (!interventionType) return;
    const description = window.prompt("Description of intervention:");
    if (!description) return;

    setActionLoading(true);
    setActionError("");
    try {
      await api.post("/interventions/", {
        studentID: selectedStudent.studentID,
        interventionType,
        description,
      });
      await loadInterventions();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to record intervention");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveCase = async () => {
    if (!selectedStudent) return;
    const current = interventionMap[selectedStudent.studentID];
    if (!current || current.status !== "Open") return;

    const outcomeNote = window.prompt("Outcome note (what happened / resolution):");
    if (!outcomeNote) return;

    setActionLoading(true);
    setActionError("");
    try {
      await api.patch(`/interventions/${current.interventionID}/resolve`, { outcomeNote });
      await loadInterventions();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to resolve intervention");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = [...students]
    .sort((a, b) => b.totalScore - a.totalScore)
    .filter((s) => (riskFilter === "All" ? true : s.riskLabel === riskFilter))
    .filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.studentNumber.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q)
      );
    });

  const counts = {
    High: students.filter((s) => s.riskLabel === "High").length,
    Medium: students.filter((s) => s.riskLabel === "Medium").length,
    Low: students.filter((s) => s.riskLabel === "Low").length,
    Total: students.length,
  };

  const breakdown = selectedStudent ? getBreakdownData(selectedStudent, indicatorNames) : null;
  const selectedIntervention = selectedStudent ? interventionMap[selectedStudent.studentID] : undefined;

  const summaryCards = [
    { label: "High Risk", value: counts.High, icon: <IconAlertTriangle size={22} />, color: COLORS.red, bg: COLORS.redBg },
    { label: "Medium Risk", value: counts.Medium, icon: <IconClipboardList size={22} />, color: COLORS.orange, bg: COLORS.orangeBg },
    { label: "Low Risk", value: counts.Low, icon: <IconCircleCheck size={22} />, color: COLORS.green, bg: COLORS.greenBg },
  ];

  if (loading && !selectedModuleID) {
    return (
      <DashboardLayout userEmail={user?.email} userRole={user?.role}>
        <p>Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "22px", color: COLORS.heading }}>
            Student Indicator Analysis
          </h1>
        </div>
      </div>
      <p style={{ color: COLORS.secondaryText, margin: "0 0 24px", fontSize: "14px" }}>
        Granular breakdown of uploaded academic assessments, test trends, and calculated risk levels.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 3 risk cards + sync card, styled like Dashboard's KPI tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {summaryCards.map((card) => (
          <div key={card.label} style={{ background: "#fff", borderRadius: "10px", padding: "18px", border: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "13px", color: COLORS.mutedText }}>{card.label}</div>
              <div style={{ fontSize: "26px", fontWeight: 600, marginTop: "4px", color: COLORS.heading }}>{card.value}</div>
            </div>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: card.bg, color: card.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {card.icon}
            </div>
          </div>
        ))}

        <div style={{ background: "#fff", borderRadius: "10px", padding: "18px", border: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "13px", color: COLORS.mutedText }}>Last Ingested Sync</div>
            {latestUpload ? (
              <>
                <div style={{ fontSize: "17px", fontWeight: 600, marginTop: "4px", color: COLORS.heading }}>
                  {formatSyncTime(latestUpload.uploadedAt)}
                </div>
                <div style={{ fontSize: "12px", color: COLORS.faintText, marginTop: "2px" }}>
                  {latestUpload.recordCount} records verified
                </div>
              </>
            ) : (
              <div style={{ fontSize: "14px", fontWeight: 600, marginTop: "4px", color: COLORS.faintText }}>
                No data yet
              </div>
            )}
          </div>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: COLORS.purpleBg, color: COLORS.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconClock size={22} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ fontSize: "13px", color: COLORS.secondaryText, fontWeight: 500 }}>Module</label>
        <br />
        {modules.length === 0 ? (
          <p style={{ color: COLORS.heading }}>No modules assigned yet.</p>
        ) : (
          <select
            value={selectedModuleID ?? ""}
            onChange={(e) => handleModuleChange(Number(e.target.value))}
            style={{ padding: "8px 12px", marginTop: "4px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", color: COLORS.heading }}
          >
            {modules.map((m) => (
              <option key={m.moduleID} value={m.moduleID}>
                {m.moduleCode} — {m.moduleName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table + Indicator Breakdown, side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "16px", alignItems: "start" }}>

        <div style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontWeight: 600, color: COLORS.heading }}>Priority Student Alerts</span>
              <span style={{ fontSize: "12px", color: COLORS.faintText }}>Sorted by Risk Score (Desc) — {filteredStudents.length} shown</span>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ID or Name..."
                style={{
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ddd",
                  fontSize: "13px",
                  outline: "none",
                  width: "170px",
                  color: COLORS.heading,
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <IconFilter size={15} color={COLORS.mutedText} />
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                    background: "#fff",
                    fontSize: "13px",
                    color: COLORS.heading,
                    outline: "none",
                  }}
                >
                  <option value="All">All Risk Bands</option>
                  <option value="High">High Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="Low">Low Risk</option>
                </select>
              </div>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <p style={{ padding: "20px", color: COLORS.mutedText }}>No student records match the active criteria.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 14px", color: COLORS.mutedText, fontWeight: 500, fontSize: "12px" }}>#</th>
                    <th style={{ padding: "10px 14px", color: COLORS.mutedText, fontWeight: 500, fontSize: "12px" }}>Student ID</th>
                    <th style={{ padding: "10px 14px", color: COLORS.mutedText, fontWeight: 500, fontSize: "12px" }}>Full Name</th>
                    {indicatorNames.map((name) => (
                      <th key={name} style={{ padding: "10px 14px", color: COLORS.mutedText, fontWeight: 500, fontSize: "12px" }}>
                        {INDICATOR_LABELS[name] ?? name}
                        {INDICATOR_WEIGHTS[name] !== undefined && ` (${Math.round(INDICATOR_WEIGHTS[name] * 100)}%)`}
                      </th>
                    ))}
                    <th style={{ padding: "10px 14px", color: COLORS.mutedText, fontWeight: 500, fontSize: "12px" }}>Score</th>
                    <th style={{ padding: "10px 14px", color: COLORS.mutedText, fontWeight: 500, fontSize: "12px" }}>Risk Band</th>
                    <th style={{ padding: "10px 14px", color: COLORS.mutedText, fontWeight: 500, fontSize: "12px" }}>Status</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", color: COLORS.mutedText, fontWeight: 500, fontSize: "12px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, i) => {
                    const colors = riskColor(s.riskLabel);
                    const isSelected = selectedStudent?.studentID === s.studentID;
                    const intervention = interventionMap[s.studentID];
                    const statusColors = intervention
                      ? intervention.status === "Open"
                        ? { bg: COLORS.orangeBg, text: COLORS.orange }
                        : { bg: COLORS.greenBg, text: COLORS.green }
                      : null;

                    return (
                      <tr
                        key={s.studentID}
                        onClick={() => setSelectedStudent(s)}
                        style={{
                          borderTop: `1px solid ${COLORS.rowBorder}`,
                          cursor: "pointer",
                          background: isSelected ? COLORS.purpleBg : "transparent",
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = COLORS.rowHover; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? COLORS.purpleBg : "transparent"; }}
                      >
                        <td style={{ padding: "12px 14px", color: COLORS.faintText }}>{i + 1}</td>
                        <td style={{ padding: "12px 14px", color: COLORS.heading, fontWeight: 500 }}>{s.studentNumber}</td>
                        <td style={{ padding: "12px 14px", color: COLORS.heading }}>{s.fullName}</td>
                        {indicatorNames.map((name) => {
                          const val = s.indicatorValues[name];
                          const isFailing = typeof val === "number" && val < 50;
                          return (
                            <td key={name} style={{ padding: "12px 14px", color: isFailing ? COLORS.red : COLORS.heading }}>
                              {val !== undefined ? `${val}%` : "–"}
                            </td>
                          );
                        })}
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: COLORS.heading }}>{s.totalScore}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: colors.bg, color: colors.text, fontSize: "12px", padding: "4px 10px", borderRadius: "6px" }}>
                            {s.riskLabel}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {statusColors ? (
                            <span style={{ background: statusColors.bg, color: statusColors.text, fontSize: "12px", padding: "4px 10px", borderRadius: "6px" }}>
                              {intervention!.status}
                            </span>
                          ) : (
                            <span style={{ color: "#ccc" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <span
                            onClick={(e) => { e.stopPropagation(); navigate(`/breakdown/${s.riskScoreID}`); }}
                            style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: COLORS.purple, fontWeight: 500, fontSize: "12.5px", cursor: "pointer" }}
                          >
                            Details <IconChevronRight size={14} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Indicator Breakdown Panel */}
        <div style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${COLORS.border}`, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <span style={{ fontWeight: 600, color: COLORS.heading }}>Indicator Breakdown</span>
            {selectedStudent && (
              <span style={{ fontSize: "12px", fontWeight: 500, color: COLORS.red, background: COLORS.redBg, padding: "3px 9px", borderRadius: "999px" }}>
                ID: {selectedStudent.studentNumber}
              </span>
            )}
          </div>

          {!selectedStudent || !breakdown ? (
            <p style={{ color: COLORS.faintText, fontSize: "13px", padding: "20px 0", textAlign: "center" }}>
              Select a student from the table to view their score breakdown.
            </p>
          ) : (
            <>
              <div style={{ marginBottom: "18px" }}>
                <div style={{ fontSize: "12px", color: COLORS.mutedText }}>Calculated Risk Score</div>
                <div style={{
                  fontSize: "30px",
                  fontWeight: 600,
                  color: riskColor(selectedStudent.riskLabel).text,
                  lineHeight: 1.2,
                }}>
                  {selectedStudent.totalScore} <span style={{ fontSize: "15px", color: COLORS.faintText, fontWeight: 500 }}>/ 100</span>
                </div>
                <div style={{ fontSize: "12px", color: COLORS.faintText, marginTop: "2px" }}>High Risk Threshold: 60</div>
              </div>

              {breakdown.rows.map((row) => (
                <div key={row.name} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px", gap: "8px" }}>
                    <span style={{ color: COLORS.heading }}>
                      {row.label}{" "}
                      <span style={{ color: COLORS.faintText }}>(Weight: {Math.round(row.effectiveWeight * 100)}%)</span>
                    </span>
                    <span style={{ fontWeight: 600, color: row.raw < 50 ? COLORS.red : COLORS.heading, whiteSpace: "nowrap" }}>
                      +{row.points.toFixed(1)} pts{" "}
                      <span style={{ color: COLORS.faintText, fontWeight: 500 }}>(Raw: {row.raw}%)</span>
                    </span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", background: "#f0f0f0", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.min(row.raw, 100)}%`,
                      borderRadius: "3px",
                      background: row.raw < 50 ? COLORS.red : row.raw < 70 ? COLORS.orange : COLORS.green,
                    }} />
                  </div>
                </div>
              ))}

              {breakdown.missing.map((name) => (
                <div key={name} style={{ fontSize: "12px", color: COLORS.faintText, fontStyle: "italic", marginBottom: "8px" }}>
                  {INDICATOR_LABELS[name] ?? name}: no data — excluded, remaining weights re-normalized
                </div>
              ))}

              {actionError && (
                <div style={{ padding: "8px 10px", background: COLORS.redBg, color: COLORS.red, borderRadius: "6px", marginBottom: "10px", fontSize: "12px" }}>
                  {actionError}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button
                  onClick={handleRecordNote}
                  disabled={actionLoading}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: "6px", border: "none",
                    background: COLORS.purple, color: "#fff", fontSize: "13px", fontWeight: 500,
                    cursor: actionLoading ? "default" : "pointer", opacity: actionLoading ? 0.6 : 1,
                  }}
                >
                  + Record Note
                </button>
                <button
                  onClick={handleResolveCase}
                  disabled={actionLoading || !selectedIntervention || selectedIntervention.status !== "Open"}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: "6px", border: "1px solid #ddd",
                    background: "#fff",
                    color: (!selectedIntervention || selectedIntervention.status !== "Open") ? "#ccc" : COLORS.heading,
                    fontSize: "13px", fontWeight: 500,
                    cursor: (actionLoading || !selectedIntervention || selectedIntervention.status !== "Open") ? "default" : "pointer",
                  }}
                >
                  Resolve Case
                </button>
              </div>

              <button
                onClick={() => navigate(`/breakdown/${selectedStudent.riskScoreID}`)}
                style={{
                  width: "100%", marginTop: "8px", padding: "8px 0", borderRadius: "6px",
                  border: `1px solid ${COLORS.border}`, background: "transparent",
                  color: COLORS.mutedText, fontSize: "12.5px", fontWeight: 500, cursor: "pointer",
                }}
              >
                Open Full Breakdown →
              </button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Analysis;