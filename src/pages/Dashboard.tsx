import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  IconAlertTriangle,
  IconUsers,
  IconBooks,
  IconClipboardCheck,
  IconUpload,
  IconClipboardList,
  IconArrowRight,
  IconFlame,
} from "@tabler/icons-react";

interface UserInfo {
  userID: number;
  email: string;
  role: string;
}

interface ModuleSummary {
  moduleID: number;
  moduleCode: string;
  moduleName: string;
  totalStudents: number;
  high: number;
  medium: number;
  low: number;
}

interface RecentUpload {
  uploadID: number;
  fileName: string;
  moduleID: number;
  recordCount: number;
  uploadedAt: string;
}

interface RecentIntervention {
  interventionID: number;
  studentID: number;
  interventionType: string;
  status: string;
  createdAt: string;
}

interface Overview {
  totals: {
    modules: number;
    students: number;
    high: number;
    medium: number;
    low: number;
    openInterventions: number;
    needsAttention: number;
  };
  modules: ModuleSummary[];
  recentUploads: RecentUpload[];
  recentInterventions: RecentIntervention[];
}

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
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);

        const res = await api.get("/risk-scores/overview");
        setOverview(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load dashboard overview");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <DashboardLayout userEmail={user?.email} userRole={user?.role}>
        <p style={{ color: COLORS.heading }}>Loading your overview...</p>
      </DashboardLayout>
    );
  }

  const totals = overview?.totals;
  const firstName = user?.email ? user.email.split("@")[0] : "";

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <h1 style={{ margin: "0 0 4px", fontSize: "23px", color: COLORS.heading }}>
        {greeting()}, {firstName}
      </h1>
      <p style={{ color: COLORS.secondaryText, margin: "0 0 22px", fontSize: "14px" }}>
        Here's what's happening across your {totals?.modules ?? 0} module{totals?.modules === 1 ? "" : "s"} today.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Urgent attention banner */}
      {totals && totals.needsAttention > 0 && (
        <div
          onClick={() => navigate("/analysis")}
          style={{
            background: COLORS.redBg,
            border: `1px solid #f3c6c2`,
            borderRadius: "10px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            cursor: "pointer",
          }}
        >
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fff", color: COLORS.red, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconFlame size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: COLORS.red, fontSize: "14.5px" }}>
              {totals.needsAttention} High-risk student{totals.needsAttention !== 1 ? "s" : ""} with no intervention yet
            </div>
            <div style={{ fontSize: "13px", color: "#8a3730", marginTop: "2px" }}>
              These students are flagged High risk but have no recorded follow-up action. Click to review.
            </div>
          </div>
          <IconArrowRight size={18} color={COLORS.red} />
        </div>
      )}

      {/* Top KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "22px" }}>
        {[
          { label: "My Modules", value: totals?.modules ?? 0, icon: <IconBooks size={20} />, color: COLORS.purple, bg: COLORS.purpleBg },
          { label: "Total Students", value: totals?.students ?? 0, icon: <IconUsers size={20} />, color: COLORS.purple, bg: COLORS.purpleBg },
          { label: "High Risk", value: totals?.high ?? 0, icon: <IconAlertTriangle size={20} />, color: COLORS.red, bg: COLORS.redBg },
          { label: "Medium Risk", value: totals?.medium ?? 0, icon: <IconAlertTriangle size={20} />, color: COLORS.orange, bg: COLORS.orangeBg },
          { label: "Open Interventions", value: totals?.openInterventions ?? 0, icon: <IconClipboardCheck size={20} />, color: COLORS.green, bg: COLORS.greenBg },
        ].map((card) => (
          <div key={card.label} style={{ background: "#fff", borderRadius: "10px", padding: "16px", border: `1px solid ${COLORS.border}` }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: card.bg, color: card.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
              {card.icon}
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: COLORS.heading, lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: "12px", color: COLORS.mutedText, marginTop: "4px" }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "18px" }}>
        {/* Module cards */}
        <div>
          <div style={{ fontWeight: 600, color: COLORS.heading, marginBottom: "10px", fontSize: "15px" }}>Your modules</div>
          {(!overview || overview.modules.length === 0) ? (
            <div style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${COLORS.border}`, padding: "24px", textAlign: "center", color: COLORS.mutedText, fontSize: "13px" }}>
              No modules assigned yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {overview.modules.map((m) => {
                const total = m.totalStudents || 1;
                return (
                  <div
                    key={m.moduleID}
                    onClick={() => navigate("/analysis")}
                    style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${COLORS.border}`, padding: "16px 18px", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: COLORS.heading, fontSize: "14px" }}>{m.moduleCode}</div>
                        <div style={{ fontSize: "12.5px", color: COLORS.mutedText }}>{m.moduleName}</div>
                      </div>
                      <div style={{ fontSize: "12.5px", color: COLORS.mutedText }}>{m.totalStudents} students</div>
                    </div>

                    {m.totalStudents === 0 ? (
                      <div style={{ fontSize: "12px", color: COLORS.faintText, fontStyle: "italic" }}>No risk data yet — upload a CSV to get started.</div>
                    ) : (
                      <>
                        <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "8px" }}>
                          {m.high > 0 && <div style={{ width: `${(m.high / total) * 100}%`, background: COLORS.red }} />}
                          {m.medium > 0 && <div style={{ width: `${(m.medium / total) * 100}%`, background: COLORS.orange }} />}
                          {m.low > 0 && <div style={{ width: `${(m.low / total) * 100}%`, background: COLORS.green }} />}
                        </div>
                        <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: COLORS.mutedText }}>
                          <span><span style={{ color: COLORS.red, fontWeight: 600 }}>{m.high}</span> high</span>
                          <span><span style={{ color: COLORS.orange, fontWeight: 600 }}>{m.medium}</span> medium</span>
                          <span><span style={{ color: COLORS.green, fontWeight: 600 }}>{m.low}</span> low</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div>
          <div style={{ fontWeight: 600, color: COLORS.heading, marginBottom: "10px", fontSize: "15px" }}>Recent activity</div>
          <div style={{ background: "#fff", borderRadius: "10px", border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: "12.5px", fontWeight: 600, color: COLORS.mutedText, display: "flex", alignItems: "center", gap: "6px" }}>
              <IconUpload size={14} /> Uploads
            </div>
            {(!overview || overview.recentUploads.length === 0) ? (
              <div style={{ padding: "16px", color: COLORS.faintText, fontSize: "12.5px" }}>No uploads yet.</div>
            ) : (
              overview.recentUploads.map((u) => (
                <div key={u.uploadID} style={{ padding: "10px 16px", borderBottom: `1px solid #f5f5f5`, fontSize: "13px" }}>
                  <div style={{ color: COLORS.heading, fontWeight: 500 }}>{u.fileName}</div>
                  <div style={{ color: COLORS.faintText, fontSize: "11.5px", marginTop: "2px" }}>
                    {u.recordCount} records &middot; {timeAgo(u.uploadedAt)}
                  </div>
                </div>
              ))
            )}

            <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, fontSize: "12.5px", fontWeight: 600, color: COLORS.mutedText, display: "flex", alignItems: "center", gap: "6px" }}>
              <IconClipboardList size={14} /> Interventions
            </div>
            {(!overview || overview.recentInterventions.length === 0) ? (
              <div style={{ padding: "16px", color: COLORS.faintText, fontSize: "12.5px" }}>No interventions recorded yet.</div>
            ) : (
              overview.recentInterventions.map((iv) => (
                <div key={iv.interventionID} style={{ padding: "10px 16px", borderBottom: `1px solid #f5f5f5`, fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: COLORS.heading, fontWeight: 500 }}>{iv.interventionType}</div>
                    <div style={{ color: COLORS.faintText, fontSize: "11.5px", marginTop: "2px" }}>{timeAgo(iv.createdAt)}</div>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      background: iv.status === "Open" ? COLORS.orangeBg : COLORS.greenBg,
                      color: iv.status === "Open" ? COLORS.orange : COLORS.green,
                      fontWeight: 500,
                    }}
                  >
                    {iv.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;