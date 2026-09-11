import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconActivity, IconRefresh } from "@tabler/icons-react";

interface UserInfo {
  userID: number;
  email: string;
  role: string;
}

interface AuditLogEntry {
  logID: number;
  eventType: string;
  description: string;
  userID: number;
  targetEntity: string | null;
  targetID: number | null;
  timestamp: string;
}

interface HealthReportEntry {
  reportID: number;
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
  flaggedIssues: string | null;
  generatedAt: string;
}

function SystemHealth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [health, setHealth] = useState<HealthReportEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = async () => {
    try {
      const res = await api.get("/audit-logs/");
      setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load audit logs");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);
        await loadLogs();
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleGenerateHealth = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await api.post("/health-reports/generate");
      setHealth(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate health report");
    } finally {
      setGenerating(false);
    }
  };

  const eventColor = (eventType: string) => {
    if (eventType.includes("SUSPEND") || eventType.includes("FAILED")) return { bg: "#fde8e8", text: "#c0392b" };
    if (eventType.includes("CONFIG") || eventType.includes("REACTIVATED")) return { bg: "#fff3e0", text: "#c77700" };
    return { bg: "#eef0fd", text: "#4338ca" };
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
      <h1 style={{ margin: "0 0 4px", fontSize: "22px", color: "#1a1a1a" }}>System health &amp; audit logs</h1>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>
        System activity trail and health monitoring.
      </p>

      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ fontWeight: 600, color: "#1a1a1a" }}>System health</div>
          <button
            onClick={handleGenerateHealth}
            disabled={generating}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
          >
            <IconRefresh size={14} />
            {generating ? "Generating..." : "Generate report"}
          </button>
        </div>

        {health ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#666" }}>Uptime</div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "#1a1a1a" }}>{health.uptime}%</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#666" }}>Avg response time</div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "#1a1a1a" }}>{health.avgResponseTime}ms</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#666" }}>Error rate</div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: health.errorRate > 20 ? "#c0392b" : "#1a1a1a" }}>
                {health.errorRate}%
              </div>
            </div>
            {health.flaggedIssues && (
              <div style={{ gridColumn: "1 / -1", marginTop: "8px", padding: "10px 14px", background: "#fde8e8", color: "#c0392b", borderRadius: "6px", fontSize: "13px" }}>
                <IconActivity size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                {health.flaggedIssues}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "#666", fontSize: "13px" }}>Click "Generate report" to compute a fresh system health snapshot.</p>
        )}
      </div>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee", fontWeight: 600, color: "#1a1a1a" }}>
          Audit log
        </div>
        {loading ? (
          <p style={{ padding: "20px", color: "#1a1a1a" }}>Loading...</p>
        ) : logs.length === 0 ? (
          <p style={{ padding: "20px", color: "#1a1a1a" }}>No events recorded yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Event</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Description</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>User ID</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const colors = eventColor(log.eventType);
                return (
                  <tr key={log.logID} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ background: colors.bg, color: colors.text, fontSize: "11px", padding: "3px 8px", borderRadius: "6px", fontWeight: 500 }}>
                        {log.eventType}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{log.description}</td>
                    <td style={{ padding: "12px 20px", color: "#666" }}>{log.userID}</td>
                    <td style={{ padding: "12px 20px", color: "#666", fontSize: "13px" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SystemHealth;