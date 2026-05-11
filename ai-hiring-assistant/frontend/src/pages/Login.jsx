import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login({ setAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      setAuth(true);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="glass-panel" style={{ maxWidth: "400px", margin: "auto" }}>
        <header className="header" style={{ marginBottom: "1.5rem" }}>
          <h2>Welcome Back</h2>
          <p>Login to your account</p>
        </header>

        <form onSubmit={handleLogin} className="main-content">
          {error && <div style={{ color: "var(--error)", textAlign: "center" }}>{error}</div>}
          
          <div className="input-group">
            <label className="section-label">Email</label>
            <input
              type="email"
              className="text-area glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label className="section-label">Password</label>
            <input
              type="password"
              className="text-area glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={`analyze-btn ${loading ? 'loading' : ''}`} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", color: "var(--text-muted)" }}>
          Don't have an account? <Link to="/register" style={{ color: "var(--primary)" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
