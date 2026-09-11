import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";

interface ContributionInfo {
  contributionID: number;
  indicatorID: number;
  rawValue: number;
  weightApplied: number;
  weightedContribution: number;
}

interface UserInfo {
  userID: number;
  email: string;
  role: string;
}

function ScoreBreakdown() {
  const { riskScoreID } = useParams();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [contributions, setContributions] = useState<ContributionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);

        const res = await api.get(`/risk-scores/${riskScoreID}/breakdown`);
        setContributions(res.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load breakdown");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [riskScoreID]);

  const totalContribution = contributions.reduce((sum, c) => sum + c.weightedContribution, 0);

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <h1 style={{ margin: "0 0 4px", fontSize: "22px", color: "#1a1a1a" }}>Score breakdown</h1>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>
        Per-indicator contribution to this student's risk score.
      </p>

      {loading && <p style={{ color: "#1a1a1a" }}>Loading...</p>}
      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {!loading && !error && (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", overflow: "hidden", maxWidth: "700px" }}>
          {contributions.length === 0 ? (
            <p style={{ padding: "20px", color: "#1a1a1a" }}>No breakdown data found for this score.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Indicator ID</th>
                  <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Raw value</th>
                  <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Weight applied</th>
                  <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Contribution</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.contributionID} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{c.indicatorID}</td>
                    <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{c.rawValue}</td>
                    <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{c.weightApplied}</td>
                    <td style={{ padding: "12px 20px", color: "#1a1a1a", fontWeight: 500 }}>{c.weightedContribution.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #ddd" }}>
                  <td colSpan={3} style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: "#1a1a1a" }}>
                    Total score:
                  </td>
                  <td style={{ padding: "12px 20px", fontWeight: 600, color: "#1a1a1a" }}>{totalContribution.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

export default ScoreBreakdown;