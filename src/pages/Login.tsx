import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { IconMail, IconLock, IconEye, IconEyeOff } from "@tabler/icons-react";
import campusBand from "../assets/ufs_campus_band.jpg";
import shieldWhite from "../assets/ufs_shield_white.jpg";
import ufsCsLogo from "../assets/ufs_cs_logo.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post(
        `/auth/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      );
      const { access_token } = response.data;
      localStorage.setItem("accessToken", access_token);
      navigate("/dashboard");
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Login failed. Please try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* 1. TOP BANNER SECTION */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "370px",
          backgroundImage: `url(${campusBand})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        {/* Center Blue Polygon with Brand Assets */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "175px",
            backgroundColor: "#0A1F44",
            clipPath: "polygon(0 0, 100% 0, 82% 100%, 18% 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 30px 18px 30px",
            zIndex: 1,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            {/* Trilingual University Text */}
            <div
              style={{
                textAlign: "right",
                fontSize: "9.5px",
                lineHeight: 1.3,
                fontWeight: 700,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                color: "#ffffff",
              }}
            >
              <div>UNIVERSITY OF THE</div>
              <div>FREE STATE</div>
              <div style={{ fontWeight: 400, opacity: 0.9 }}>UNIVERSITEIT VAN DIE</div>
              <div style={{ fontWeight: 400, opacity: 0.9 }}>VRYSTAAT</div>
              <div style={{ fontWeight: 400, opacity: 0.9 }}>YUNIVESITHI YA</div>
              <div style={{ fontWeight: 400, opacity: 0.9 }}>FREISTATA</div>
            </div>

            {/* Subtle Divider */}
            <div
              style={{
                width: "1.5px",
                height: "56px",
                backgroundColor: "rgba(255, 255, 255, 0.35)",
              }}
            />

            {/* Official UFS Shield Asset */}
            <img
              src={shieldWhite}
              alt="UFS Natural and Agricultural Sciences"
              style={{
                height: "64px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        {/* Maroon Accent Stripe */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "26px",
            backgroundColor: "#8B1D2C",
          }}
        />
      </div>

      {/* 2. FLOATING CARD CONTAINER */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          position: "relative",
          marginTop: "-155px",
          zIndex: 10,
          padding: "0 16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "510px",
            backgroundColor: "#ffffff",
            borderRadius: "6px",
            boxShadow: "0 14px 38px rgba(0, 0, 0, 0.22), 0 6px 12px rgba(0, 0, 0, 0.12)",
            padding: "26px 36px 20px 36px",
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: "20px",
              fontWeight: 700,
              color: "#0f1f38",
              letterSpacing: "-0.2px",
            }}
          >
            Academic Early Warning System
          </h1>
          <p
            style={{
              margin: "3px 0 16px 0",
              textAlign: "center",
              fontSize: "12.5px",
              color: "#334155",
            }}
          >
            Welcome back!
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11.5px",
                  color: "#475569",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                University Email
              </label>
              <div style={{ position: "relative" }}>
                <IconMail
                  size={15}
                  color="#64748b"
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="j.doe@ufs.ac.za"
                  required
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 12px 0 34px",
                    fontSize: "12.5px",
                    color: "#1e293b",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11.5px",
                  color: "#475569",
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <IconLock
                  size={15}
                  color="#64748b"
                  style={{
                    position: "absolute",
                    left: "11px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  style={{
                    width: "100%",
                    height: "36px",
                    padding: "0 34px 0 34px",
                    fontSize: "12.5px",
                    color: "#1e293b",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    color: "#64748b",
                  }}
                >
                  {showPassword ? <IconEyeOff size={15} /> : <IconEye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  fontSize: "11.5px",
                  color: "#b91c1c",
                  backgroundColor: "#fef2f2",
                  padding: "7px 10px",
                  borderRadius: "4px",
                  border: "1px solid #fecaca",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                height: "36px",
                marginTop: "3px",
                backgroundColor: loading ? "#254884" : "#0d47a1",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                transition: "background-color 0.15s ease",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "16px",
              marginTop: "12px",
              fontSize: "11px",
            }}
          >
            <span
              onClick={() => alert("Please contact your system administrator to reset your password.")}
              style={{ color: "#334155", cursor: "pointer", textDecoration: "none" }}
            >
              Forgot password?
            </span>
            <span
              onClick={() => alert("Please contact your administrator to request a Lecturer account.")}
              style={{ color: "#334155", cursor: "pointer", textDecoration: "none" }}
            >
              Request account?
            </span>
          </div>

          <p
            style={{
              margin: "18px 0 0 0",
              textAlign: "center",
              fontSize: "11.5px",
              fontStyle: "italic",
              color: "#334155",
            }}
          >
            Inspiring excellence, transforming lives through quality, impact, and care.
          </p>
        </div>
      </div>

      {/* 3. FOOTER SECTION */}
      <footer
        style={{
          marginTop: "16px",
          paddingBottom: "32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "10px", color: "#64748b", letterSpacing: "0.2px" }}>
          Informatics Honours Project CSIQ6809 | CT Machava | 2026
        </div>
        <img
          src={ufsCsLogo}
          alt="University of the Free State - Computer Science & Informatics"
          style={{ height: "42px", width: "auto", objectFit: "contain" }}
        />
      </footer>
    </div>
  );
}

export default Login;