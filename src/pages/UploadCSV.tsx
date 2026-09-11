import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconUpload } from "@tabler/icons-react";

interface ModuleInfo {
  moduleID: number;
  moduleCode: string;
  moduleName: string;
}

interface UserInfo {
  userID: number;
  email: string;
  role: string;
}

function UploadCSV() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModuleID, setSelectedModuleID] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showViewResultsLink, setShowViewResultsLink] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);

        const endpoint = userRes.data.role === "Admin" ? "/modules/" : "/lecturer-modules/my-modules";
        const res = await api.get(endpoint);
        setModules(res.data);
        if (res.data.length > 0) {
          setSelectedModuleID(res.data[0].moduleID);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load modules");
      }
    };
    loadData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedModuleID) return;

    setUploading(true);
    setError("");
    setResult(null);
    setShowViewResultsLink(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(`/uploads/${selectedModuleID}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status === "Success") {
        try {
          const scoreRes = await api.post(`/risk-scores/compute/${res.data.uploadID}`);
          setResult({ ...res.data, scoring: scoreRes.data });
        } catch (scoreErr: any) {
          setResult({ ...res.data, scoringError: scoreErr.response?.data?.detail || "Scoring failed" });
        }
      } else {
        setResult(res.data);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const isDuplicate = err.response?.status === 409;
      setError(typeof detail === "string" ? detail : "Upload failed. Please check the file and try again.");
      setResult(err.response?.data || null);
      if (isDuplicate) {
        setShowViewResultsLink(true);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout userEmail={user?.email} userRole={user?.role}>
      <h1 style={{ margin: "0 0 4px", fontSize: "22px", color: "#1a1a1a" }}>Upload CSV</h1>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>
        Upload assessment data for one of your modules.
      </p>

      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "24px", maxWidth: "520px" }}>
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Module</label>
            <br />
            {modules.length === 0 ? (
              <p style={{ color: "#1a1a1a" }}>No modules assigned.</p>
            ) : (
              <select
                value={selectedModuleID ?? ""}
                onChange={(e) => setSelectedModuleID(Number(e.target.value))}
                style={{ padding: "8px 12px", marginTop: "6px", borderRadius: "6px", border: "1px solid #ddd", width: "100%", background: "#fff", color: "#1a1a1a" }}
              >
                {modules.map((m) => (
                  <option key={m.moduleID} value={m.moduleID}>
                    {m.moduleCode} — {m.moduleName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>CSV file</label>
            <br />
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ marginTop: "8px", color: "#1a1a1a" }}
            />
          </div>

          <button
            type="submit"
            disabled={uploading || !file || !selectedModuleID}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: uploading ? "#a5a5f0" : "#4338ca",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: uploading ? "default" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <IconUpload size={16} />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: "18px" }}>
            <div style={{ padding: "12px 14px", background: "#fde8e8", color: "#c0392b", borderRadius: "6px", fontSize: "13px", marginBottom: showViewResultsLink ? "10px" : 0 }}>
              {error}
            </div>
            {showViewResultsLink && (
              <button
                onClick={() => (window.location.href = "/analysis")}
                style={{ padding: "8px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px" }}
              >
                View existing results →
              </button>
            )}
          </div>
        )}

        {result?.status === "Success" && (
          <div style={{ marginTop: "18px", padding: "12px 14px", background: "#e6f6ea", color: "#1e8e3e", borderRadius: "6px", fontSize: "13px" }}>
            <strong>Upload successful.</strong> {result.recordsSaved} records saved (upload ID: {result.uploadID}).
            {result.scoring && (
              <div style={{ marginTop: "6px" }}>
                Risk scores computed for {result.scoring.studentsScored} student(s).
              </div>
            )}
            {result.scoringError && (
              <div style={{ marginTop: "6px", color: "#c0392b" }}>
                Note: scoring could not be computed automatically — {result.scoringError}
              </div>
            )}
          </div>
        )}

        {result?.status === "Failed" && (
          <div style={{ marginTop: "18px", padding: "12px 14px", background: "#fde8e8", color: "#c0392b", borderRadius: "6px", fontSize: "13px" }}>
            <strong>Upload failed. Errors:</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
              {result.errors?.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default UploadCSV;