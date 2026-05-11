import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ setAuth }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuth(false);
    navigate("/login");
  };

  return (
    <nav className="glass-panel" style={{ 
      margin: "1rem", 
      padding: "1rem 2rem", 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center",
      borderRadius: "16px",
      position: "sticky",
      top: "1rem",
      zIndex: 100,
      background: "rgba(30, 41, 59, 0.85)"
    }}>
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.5rem" }}>🚀</span>
        <span style={{ 
          fontWeight: "700", 
          fontSize: "1.2rem", 
          background: "linear-gradient(to right, #a78bfa, #818cf8)", 
          WebkitBackgroundClip: "text", 
          WebkitTextFillColor: "transparent",
          letterSpacing: "0.5px"
        }}>AI Hiring</span>
      </Link>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <Link to="/home" className="nav-link">Dashboard</Link>
        <Link to="/" className="nav-link">Tool</Link>
        <Link to="/recruiter" className="nav-link" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Recruiter Mode 🏢</Link>
        <Link to="/profile" className="nav-link">Profile</Link>
        <button 
          onClick={handleLogout} 
          style={{ 
            background: "rgba(239, 68, 68, 0.15)", 
            border: "1px solid var(--error)", 
            color: "var(--error)", 
            padding: "0.4rem 1rem", 
            borderRadius: "8px", 
            cursor: "pointer",
            fontWeight: "500",
            transition: "all 0.2s"
          }}
          className="logout-btn-nav"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
