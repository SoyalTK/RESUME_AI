import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="glass-panel" style={{ maxWidth: "400px", margin: "auto" }}>
        <header className="header" style={{ marginBottom: "1.5rem" }}>
          <h2>Get Started</h2>
          <p>Create a new account</p>
        </header>

        <form onSubmit={handleSignup} className="main-content">
          {error && <div style={{ color: "var(--error)", textAlign: "center" }}>{error}</div>}

          <div className="input-group">
            <label className="section-label">Name</label>
            <input
              type="text"
              className="text-area glass-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
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
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", color: "var(--text-muted)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--primary)" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
