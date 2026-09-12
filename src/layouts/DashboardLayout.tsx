import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconLayoutDashboard,
  IconBooks,
  IconUpload,
  IconAlertTriangle,
  IconClipboardList,
  IconFileText,
  IconLogout,
  IconUsers,
  IconActivity,
  IconAdjustments,
  IconSchool,
  IconFile,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import { logout } from "../api";

interface Props {
  children: ReactNode;
  userEmail?: string;
  userRole?: string;
}

function DashboardLayout({ children, userEmail, userRole }: Props) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const goTo = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const navItem = (icon: ReactNode, label: string, path: string) => (
    <div
      onClick={() => goTo(path)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 16px",
        cursor: "pointer",
        borderRadius: "6px",
        fontSize: "14px",
        color: "#1a1a1a",
        fontWeight: 500,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f5")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      {label}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <style>{`
        .aews-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #e5e5e5;
          position: sticky;
          top: 0;
          height: 100vh;
          align-self: flex-start;
          display: flex;
          flex-direction: column;
          z-index: 30;
        }
        .aews-hamburger { display: none; }
        .aews-backdrop { display: none; }

        @media (max-width: 768px) {
          .aews-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            box-shadow: 2px 0 12px rgba(0,0,0,0.15);
          }
          .aews-sidebar.open {
            transform: translateX(0);
          }
          .aews-hamburger {
            display: flex !important;
          }
          .aews-backdrop.open {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.35);
            z-index: 20;
          }
          .aews-main {
            width: 100%;
          }
        }
      `}</style>

      {/* Mobile backdrop */}
      <div className={`aews-backdrop ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <div className={`aews-sidebar ${mobileOpen ? "open" : ""}`}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "#4338ca", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold" }}>
                A
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px" }}>AEWS</div>
                <div style={{ fontSize: "11px", color: "#888" }}>Academic Early Warning</div>
              </div>
            </div>
            <div className="aews-hamburger" onClick={() => setMobileOpen(false)} style={{ cursor: "pointer", color: "#888" }}>
              <IconX size={20} />
            </div>
          </div>

          {navItem(<IconLayoutDashboard size={18} />, "Dashboard", "/dashboard")}
          {navItem(<IconBooks size={18} />, "My Modules", "/modules")}
          {navItem(<IconUpload size={18} />, "Upload Data (CSV)", "/upload")}
          {navItem(<IconFile size={18} />, "Upload History", "/upload-history")}
          {navItem(<IconAlertTriangle size={18} />, "At-Risk Students", "/analysis")}
          {navItem(<IconUsers size={18} />, "Student List", "/student-list")}
          {navItem(<IconClipboardList size={18} />, "Interventions", "/interventions")}
          {navItem(<IconFileText size={18} />, "Reports", "/reports")}

          {userRole === "Admin" && (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #eee" }}>
              <div style={{ fontSize: "11px", color: "#999", padding: "0 16px 8px", fontWeight: 600, letterSpacing: "0.5px" }}>ADMIN</div>
              {navItem(<IconUsers size={18} />, "User Management", "/users")}
              {navItem(<IconActivity size={18} />, "System Health", "/system-health")}
              {navItem(<IconAdjustments size={18} />, "Scoring Config", "/scoring-config")}
              {navItem(<IconSchool size={18} />, "Students", "/students")}
            </div>
          )}
        </div>

        <div style={{ padding: "12px", borderTop: "1px solid #eee" }}>
          <div
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              cursor: "pointer",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#1a1a1a",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <IconLogout size={18} />
            Logout
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="aews-main" style={{ flex: 1, background: "#f7f7fa", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 20px",
            background: "#fff",
            borderBottom: "1px solid #e5e5e5",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div className="aews-hamburger" onClick={() => setMobileOpen(true)} style={{ cursor: "pointer", color: "#1a1a1a" }}>
            <IconMenu2 size={22} />
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ textAlign: "right", marginRight: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>{userEmail}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>{userRole}</div>
          </div>
          <div
            onClick={logout}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "#ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            title="Logout"
          >
            <IconLogout size={16} />
          </div>
        </div>

        <div style={{ padding: "32px" }}>{children}</div>
      </div>
    </div>
  );
}

export default DashboardLayout;