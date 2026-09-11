import { useEffect, useState } from "react";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { IconPlus, IconBan, IconRefresh } from "@tabler/icons-react";

interface UserInfo {
  userID: number;
  email: string;
  role: string;
  fullName?: string;
  status?: string;
}

function UserManagement() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staffNumber, setStaffNumber] = useState("");
  const [creating, setCreating] = useState(false);

  const [resettingID, setResettingID] = useState<number | null>(null);
  const [newTempPassword, setNewTempPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await api.get("/users/");
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get("/me");
        setUser(userRes.data);
        await loadUsers();
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load data");
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setActionError("");

    try {
      await api.post("/users/lecturer", {
        fullName,
        email,
        role: "Lecturer",
        staffNumber: staffNumber || null,
        password,
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setStaffNumber("");
      setShowForm(false);
      await loadUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to create lecturer");
    } finally {
      setCreating(false);
    }
  };

  const handleSuspend = async (userID: number) => {
    setActionError("");
    try {
      await api.patch(`/users/${userID}/suspend`);
      await loadUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to suspend user");
    }
  };

  const handleReactivate = async (userID: number) => {
    setActionError("");
    try {
      await api.patch(`/users/${userID}/reactivate`);
      await loadUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to reactivate user");
    }
  };

  const handleResetPassword = async (userID: number) => {
    if (!newTempPassword) return;
    setResetting(true);
    setActionError("");
    try {
      await api.patch(`/users/${userID}/reset-password`, { newPassword: newTempPassword });
      setResettingID(null);
      setNewTempPassword("");
      await loadUsers();
    } catch (err: any) {
      setActionError(err.response?.data?.detail || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const statusColor = (status?: string) => {
    if (status === "Suspended") return { bg: "#fde8e8", text: "#c0392b" };
    if (status === "Pending First Login") return { bg: "#fff3e0", text: "#c77700" };
    return { bg: "#e6f6ea", text: "#1e8e3e" };
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <h1 style={{ margin: 0, fontSize: "22px", color: "#1a1a1a" }}>User management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
        >
          <IconPlus size={16} />
          New lecturer
        </button>
      </div>
      <p style={{ color: "#555", margin: "0 0 24px", fontSize: "14px" }}>Create and manage Lecturer accounts.</p>

      {showForm && (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", padding: "28px", marginBottom: "24px", maxWidth: "440px" }}>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Full name</label>
              <br />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Email</label>
              <br />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Staff number (optional)</label>
              <br />
              <input
                type="text"
                value={staffNumber}
                onChange={(e) => setStaffNumber(e.target.value)}
                style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", color: "#555", fontWeight: 500 }}>Temporary password</label>
              <br />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ padding: "10px 14px", marginTop: "6px", borderRadius: "8px", border: "1.5px solid #d0d0d8", width: "100%", boxSizing: "border-box", color: "#1a1a1a", background: "#fff", fontSize: "14px" }}
              />
            </div>

            {actionError && (
              <div style={{ padding: "10px 12px", background: "#fde8e8", color: "#c0392b", borderRadius: "6px", fontSize: "13px" }}>
                {actionError}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              style={{ padding: "10px 16px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
            >
              {creating ? "Creating..." : "Create lecturer"}
            </button>
          </form>
        </div>
      )}

      {error && <p style={{ color: "#c0392b" }}>{error}</p>}
      {actionError && !showForm && <p style={{ color: "#c0392b" }}>{actionError}</p>}

      {loading ? (
        <p style={{ color: "#1a1a1a" }}>Loading...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #eee", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Name</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Email</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Role</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Status</th>
                <th style={{ padding: "10px 20px", color: "#666", fontWeight: 500, fontSize: "12px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const colors = statusColor(u.status);
                return (
                  <tr key={u.userID} style={{ borderTop: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{u.fullName}</td>
                    <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{u.email}</td>
                    <td style={{ padding: "12px 20px", color: "#1a1a1a" }}>{u.role}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ background: colors.bg, color: colors.text, fontSize: "12px", padding: "4px 10px", borderRadius: "6px" }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      {u.role !== "Admin" && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {u.status === "Suspended" ? (
                            <button onClick={() => handleReactivate(u.userID)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#fff", color: "#1e8e3e", border: "1px solid #1e8e3e", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                              <IconRefresh size={14} />
                              Reactivate
                            </button>
                          ) : (
                            <button onClick={() => handleSuspend(u.userID)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#fff", color: "#c0392b", border: "1px solid #c0392b", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                              <IconBan size={14} />
                              Suspend
                            </button>
                          )}

                          {resettingID === u.userID ? (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <input
                                type="text"
                                value={newTempPassword}
                                onChange={(e) => setNewTempPassword(e.target.value)}
                                placeholder="New temp password"
                                style={{ padding: "6px 10px", borderRadius: "6px", border: "1.5px solid #d0d0d8", fontSize: "13px", color: "#1a1a1a", background: "#fff" }}
                              />
                              <button
                                onClick={() => handleResetPassword(u.userID)}
                                disabled={resetting || !newTempPassword}
                                style={{ padding: "6px 12px", background: "#4338ca", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                              >
                                Confirm
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setResettingID(u.userID)}
                              style={{ padding: "6px 12px", background: "#fff", color: "#4338ca", border: "1px solid #4338ca", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
                            >
                              Reset password
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

export default UserManagement;