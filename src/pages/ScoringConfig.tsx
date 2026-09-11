import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconPlus } from "@tabler/icons-react";

interface UserInfo {
  userID: number;
  email: string;
  role: string;
}

interface IndicatorInfo {
  indicatorID: number;
  name: string;
  dataType: string;
  minValue: number;
  maxValue: number;
  isActive: boolean;
  higherIsBetter: boolean;
}

interface WeightInfo {
  weightID: number;
  indicatorID: number;
  weightValue: number;
}

interface ThresholdInfo {
  thresholdID: number;
  lowMax: number;
  mediumMax: number;
}

function ScoringConfig() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [indicators, setIndicators] = useState<IndicatorInfo[]>([]);
  const [, setWeights] = useState<WeightInfo[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showIndicatorForm, setShowIndicatorForm] = useState(false);
  const [indName, setIndName] = useState("");
  const [indDataType, setIndDataType] = useState("Percentage");
  const [indMin, setIndMin] = useState("0");
  const [indMax, setIndMax] = useState("100");
  const [indHigherBetter, setIndHigherBetter] = useState(true);
  const [savingIndicator, setSavingIndicator] = useState(false);

  const [weightInputs, setWeightInputs] = useState<Record<number, string>>({});
  const [savingWeight, setSavingWeight] = useState<number | null>(null);

  const [lowMax, setLowMax] = useState("");
  const [mediumMax, setMediumMax] = useState("");
  const [savingThreshold, setSavingThreshold] = useState(false);

  const loadAll = async () => {
    try {
      const [indRes, wRes, tRes] = await Promise.all([
        api.get("/indicators/"),
        api.get("/scoring-config/weights"),
        api.get("/scoring-config/thresholds"),
      ]);
      setIndicators(indRes.data);
      setWeights(wRes.data);
      setThresholds(tRes.data);

      const initialWeights: Record<number, string> = {};
      wRes.data.forEach((w: WeightInfo) => {
        initialWeights[w.indicatorID] = String(w.weightValue);
      });
      setWeightInputs(initialWeights);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load scoring configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);
        await loadAll();
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load data");
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCreateIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIndicator(true);
    setError("");
    try {
      await api.post("/indicators/", {
        name: indName,
        dataType: indDataType,
        minValue: Number(indMin),
        maxValue: Number(indMax),
        isActive: true,
        higherIsBetter: indHigherBetter,
      });
      setIndName("");
      setIndMin("0");
      setIndMax("100");
      setShowIndicatorForm(false);
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create indicator");
    } finally {
      setSavingIndicator(false);
    }
  };

  const handleSaveWeight = async (indicatorID: number) => {
    setSavingWeight(indicatorID);
    setError("");
    try {
      await api.post("/scoring-config/weights", {
        indicatorID,
        weightValue: Number(weightInputs[indicatorID] || 0),
      });
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save weight");
    } finally {
      setSavingWeight(null);
    }
  };

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingThreshold(true);
    setError("");
    try {
      await api.post("/scoring-config/thresholds", {
        lowMax: Number(lowMax),
        mediumMax: Number(mediumMax),
      });
      setLowMax("");
      setMediumMax("");
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save thresholds");
    } finally {
      setSavingThreshold(false);
    }
  };

  const currentThreshold = thresholds[thresholds.length - 1];

  if (user && user.role !== "Admin") {
    return (
      <DashboardLayout userEmail={user.email} userRole={user.role}>
        <p style={{ color: "#c0392b" }}>You do not have permission to view this page.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <h1 style={{ margin: "0 0 4px", fontSize: "22px", color: "#1a1a1a" }}>Scoring configuration</h1>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>
        Manage indicators, weights, and risk thresholds.
      </p>

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}

      {loading ? (
        <p style={{ color: "#1a1a1a" }}>Loading...</p>
      ) : (
        <>
          {/* Indicators + Weights */}
          <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontWeight: 600, color: "#1a1a1a" }}>Indicators &amp; weights</div>
              <button
                onClick={() => setShowIndicatorForm(!showIndicatorForm)}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
              >
                <IconPlus size={14} />
                New indicator
              </button>
            </div>

            {showIndicatorForm && (
              <form onSubmit={handleCreateIndicator} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px", marginBottom: "20px", padding: "16px", background: "#f7f7fa", borderRadius: "8px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#555" }}>Name</label>
                  <input type="text" value={indName} onChange={(e) => setIndName(e.target.value)} required style={{ padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", background: "#fff", color: "#1a1a1a" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#555" }}>Data type</label>
                  <input type="text" value={indDataType} onChange={(e) => setIndDataType(e.target.value)} style={{ padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", background: "#fff", color: "#1a1a1a" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#555" }}>Min value</label>
                  <input type="number" value={indMin} onChange={(e) => setIndMin(e.target.value)} style={{ padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", background: "#fff", color: "#1a1a1a" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#555" }}>Max value</label>
                  <input type="number" value={indMax} onChange={(e) => setIndMax(e.target.value)} style={{ padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", background: "#fff", color: "#1a1a1a" }} />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" checked={indHigherBetter} onChange={(e) => setIndHigherBetter(e.target.checked)} id="higherBetter" />
                  <label htmlFor="higherBetter" style={{ fontSize: "13px", color: "#1a1a1a" }}>Higher value is better (e.g. marks, attendance)</label>
                </div>
                <button type="submit" disabled={savingIndicator} style={{ gridColumn: "1 / -1", padding: "8px 14px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                  {savingIndicator ? "Saving..." : "Save indicator"}
                </button>
              </form>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th style={{ padding: "8px 0", color: "#666", fontWeight: 500, fontSize: "12px" }}>Name</th>
                  <th style={{ padding: "8px 0", color: "#666", fontWeight: 500, fontSize: "12px" }}>Range</th>
                  <th style={{ padding: "8px 0", color: "#666", fontWeight: 500, fontSize: "12px" }}>Direction</th>
                  <th style={{ padding: "8px 0", color: "#666", fontWeight: 500, fontSize: "12px" }}>Weight</th>
                  <th style={{ padding: "8px 0", color: "#666", fontWeight: 500, fontSize: "12px" }}></th>
                </tr>
              </thead>
              <tbody>
                {indicators.map((ind) => (
                  <tr key={ind.indicatorID} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 0", color: "#1a1a1a" }}>{ind.name}</td>
                    <td style={{ padding: "10px 0", color: "#666" }}>{ind.minValue}–{ind.maxValue}</td>
                    <td style={{ padding: "10px 0", color: "#666" }}>{ind.higherIsBetter ? "Higher = better" : "Higher = worse"}</td>
                    <td style={{ padding: "10px 0" }}>
                      <input
                        type="number"
                        step="0.01"
                        value={weightInputs[ind.indicatorID] ?? ""}
                        onChange={(e) => setWeightInputs({ ...weightInputs, [ind.indicatorID]: e.target.value })}
                        style={{ padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #d0d0d8", width: "80px", background: "#fff", color: "#1a1a1a" }}
                      />
                    </td>
                    <td style={{ padding: "10px 0" }}>
                      <button
                        onClick={() => handleSaveWeight(ind.indicatorID)}
                        disabled={savingWeight === ind.indicatorID}
                        style={{ padding: "6px 12px", background: "#fff", color: "#4338ca", border: "1px solid #4338ca", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                      >
                        {savingWeight === ind.indicatorID ? "..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Thresholds */}
          <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "20px", maxWidth: "480px" }}>
            <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: "8px" }}>Risk thresholds</div>
            {currentThreshold && (
              <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
                Current: Low ≤ {currentThreshold.lowMax}, Medium ≤ {currentThreshold.mediumMax}, High above that.
              </p>
            )}
            <form onSubmit={handleSaveThreshold} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#555" }}>Low max</label>
                <br />
                <input type="number" value={lowMax} onChange={(e) => setLowMax(e.target.value)} required style={{ padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1.5px solid #d0d0d8", width: "100px", background: "#fff", color: "#1a1a1a" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#555" }}>Medium max</label>
                <br />
                <input type="number" value={mediumMax} onChange={(e) => setMediumMax(e.target.value)} required style={{ padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1.5px solid #d0d0d8", width: "100px", background: "#fff", color: "#1a1a1a" }} />
              </div>
              <button type="submit" disabled={savingThreshold} style={{ padding: "8px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                {savingThreshold ? "Saving..." : "Update"}
              </button>
            </form>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default ScoringConfig;