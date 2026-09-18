import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconFileSearch, IconFileSpreadsheet } from "@tabler/icons-react";

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

interface ReportRow {
  studentID: number;
  studentNumber: string;
  fullName: string;
  totalScore: number;
  riskLabel: string;
  isPartial: boolean;
  computedAt: string;
  openInterventions: number;
  resolvedInterventions: number;
}

function Reports() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModuleID, setSelectedModuleID] = useState<number | null>(null);
  const [riskLabel, setRiskLabel] = useState("");
  const [interventionStatus, setInterventionStatus] = useState("");
  const [results, setResults] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const runReport = async (moduleID: number, riskLabelVal = riskLabel, interventionStatusVal = interventionStatus) => {
    setFetching(true);
    setError("");

    try {
      const params: Record<string, string> = { moduleID: String(moduleID) };
      if (riskLabelVal) params.riskLabel = riskLabelVal;
      if (interventionStatusVal) params.interventionStatus = interventionStatusVal;

      const res = await api.get("/reports/students", { params });
      setResults(res.data.results);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to run report");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);

        const endpoint = userRes.data.role === "Admin" ? "/modules/" : "/lecturer-modules/my-modules";
        const res = await api.get(endpoint);
        setModules(res.data);

        if (res.data.length > 0) {
          const firstModuleID = res.data[0].moduleID;
          setSelectedModuleID(firstModuleID);
          await runReport(firstModuleID);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load modules");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleModuleChange = async (moduleID: number) => {
    setSelectedModuleID(moduleID);
    await runReport(moduleID);
  };

  const handleRiskLabelChange = async (value: string) => {
    setRiskLabel(value);
    if (selectedModuleID) await runReport(selectedModuleID, value, interventionStatus);
  };

  const handleInterventionStatusChange = async (value: string) => {
    setInterventionStatus(value);
    if (selectedModuleID) await runReport(selectedModuleID, riskLabel, value);
  };

  const handleDownload = () => {
    if (results.length === 0) return;

    const rows = results.map((r) => ({
      "Student Number": r.studentNumber,
      "Full Name": r.fullName,
      "Risk Score": r.totalScore,
      "Risk Level": r.riskLabel,
      "Partial Data": r.isPartial ? "Yes" : "No",
      "Open Interventions": r.openInterventions,
      "Resolved Interventions": r.resolvedInterventions,
      "Computed At": new Date(r.computedAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set sensible column widths so it looks clean when opened in Excel
    worksheet["!cols"] = [
      { wch: 16 }, // Student Number
      { wch: 24 }, // Full Name
      { wch: 12 }, // Risk Score
      { wch: 12 }, // Risk Level
      { wch: 12 }, // Partial Data
      { wch: 18 }, // Open Interventions
      { wch: 20 }, // Resolved Interventions
      { wch: 20 }, // Computed At
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Risk Report");

    const moduleName = modules.find((m) => m.moduleID === selectedModuleID)?.moduleCode || "report";
    const dateStr = new Date().toISOString().split("T")[0];

    XLSX.writeFile(workbook, `${moduleName}_risk_report_${dateStr}.xlsx`);
  };

  const riskColor = (label: string) => {
    if (label === "High") return { bg: "#fde8e8", text: "#c0392b" };
    if (label === "Medium") return { bg: "#fff3e0", text: "#c77700" };
    return { bg: "#e6f6ea", text: "#1e8e3e" };
  };

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <h1 style={{ margin: "0 0 4px", fontSize: "22px", color: "#1a1a1a" }}>Reports</h1>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>
        Filter students by risk level, intervention status, and module.
      </p>

      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "20px", marginBottom: "24px", display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Module</label>
          <br />
          {modules.length === 0 ? (
            <p style={{ color: "#1a1a1a", marginTop: "6px" }}>No modules available.</p>
          ) : (
            <select
              value={selectedModuleID ?? ""}
              onChange={(e) => handleModuleChange(Number(e.target.value))}
              style={{ padding: "8px 12px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ddd", color: "#1a1a1a", background: "#fff", minWidth: "220px" }}
            >
              {modules.map((m) => (
                <option key={m.moduleID} value={m.moduleID}>
                  {m.moduleCode} — {m.moduleName}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Risk level</label>
          <br />
          <select
            value={riskLabel}
            onChange={(e) => handleRiskLabelChange(e.target.value)}
            style={{ padding: "8px 12px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ddd", color: "#1a1a1a", background: "#fff" }}
          >
            <option value="">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Intervention status</label>
          <br />
          <select
            value={interventionStatus}
            onChange={(e) => handleInterventionStatusChange(e.target.value)}
            style={{ padding: "8px 12px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ddd", color: "#1a1a1a", background: "#fff" }}
          >
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <button
          onClick={() => selectedModuleID && runReport(selectedModuleID)}
          disabled={fetching || !selectedModuleID}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
        >
          <IconFileSearch size={16} />
          {fetching ? "Running..." : "Run report"}
        </button>
      </div>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {loading ? (
        <p style={{ color: "#1a1a1a" }}>Loading...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee", fontWeight: 600, color: "#1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{results.length} result{results.length !== 1 ? "s" : ""}</span>
            {results.length > 0 && (
              <button
                onClick={handleDownload}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "#fff", color: "#1e8e3e", border: "1px solid #1e8e3e", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}
              >
                <IconFileSpreadsheet size={15} />
                Download Excel
              </button>
            )}
          </div>
          {results.length === 0 ? (
            <p style={{ padding: "20px", color: "#1a1a1a" }}>No students match these filters.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Student</th>
                  <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Score</th>
                  <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Risk</th>
                  <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Open</th>
                  <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const colors = riskColor(r.riskLabel);
                  return (
                    <tr key={r.studentID} style={{ borderTop: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>
                        {r.fullName} <span style={{ color: "#888", fontSize: "12px" }}>({r.studentNumber})</span>
                      </td>
                      <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{r.totalScore}</td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ background: colors.bg, color: colors.text, fontSize: "12px", padding: "4px 10px", borderRadius: "6px" }}>
                          {r.riskLabel}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{r.openInterventions}</td>
                      <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{r.resolvedInterventions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default Reports;
