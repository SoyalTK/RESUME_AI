import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function Home() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalAnalyses: 0, totalTailored: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [userRes, historyRes] = await Promise.all([
          axios.get("http://localhost:5000/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/history", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setUser(userRes.data.user);
        const history = historyRes.data.history || [];
        setStats({
          totalAnalyses: history.filter(item => item.type === 'analysis').length,
          totalTailored: history.filter(item => item.type === 'tailor').length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateCompletion = () => {
    if (!user) return 0;
    let score = 0;
    if (user.profile_image) score += 25;
    if (user.bio && user.bio.trim().length > 0) score += 25;
    if (user.location && user.location.trim().length > 0) score += 25;
    if (user.gender) score += 25;
    return score;
  };

  const getAvatar = () => {
    if (user?.profile_image) return `http://localhost:5000${user.profile_image}`;
    return "https://api.dicebear.com/7.x/initials/svg?seed=" + (user?.name || "User") + "&backgroundColor=8b5cf6";
  };

  if (loading) return <div className="app-container"><div className="glass-panel" style={{textAlign:'center'}}>Loading Dashboard...</div></div>;

  const completionScore = calculateCompletion();
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completionScore / 100) * circumference;

  return (
    <div className="app-container">
      <header className="header" style={{ textAlign: "left", marginBottom: "3rem", display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div className="profile-avatar-container" style={{ margin: 0, width: '120px', height: '120px' }}>
          <svg viewBox="0 0 150 150" className="completion-ring-svg" style={{ width: '120px', height: '120px' }}>
            <circle className="ring-bg" cx="75" cy="75" r="65" />
            <circle 
              className="ring-progress" 
              cx="75" cy="75" r="65" 
              style={{ 
                strokeDasharray: circumference, 
                strokeDashoffset: offset 
              }} 
            />
          </svg>
          <div className="profile-avatar-wrapper" style={{ width: '100px', height: '100px', top: '10px', left: '10px' }}>
            <img src={getAvatar()} alt="Avatar" />
          </div>
          <div className="completion-badge" style={{ bottom: '-5px', right: '-5px', fontSize: '0.6rem' }}>{completionScore}%</div>
        </div>
        
        <div>
          <h2 style={{ 
            fontSize: "2.5rem", 
            marginBottom: "0.5rem",
            background: "linear-gradient(to right, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "700"
          }}>
            Welcome back, {user?.name || "User"}!
          </h2>
          <p style={{ fontSize: "1.2rem", color: "var(--text-muted)", margin: 0 }}>
            {completionScore < 100 ? (
              <span>Your profile is <span style={{color:'var(--primary)', fontWeight:'bold'}}>{completionScore}%</span> complete. <Link to="/profile" style={{color:'var(--primary)'}}>Finish it now</Link></span>
            ) : (
                "Your profile is looking great! Ready for the next application?"
            )}
          </p>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
        <div className="glass-panel" style={{ textAlign: "center", background: "rgba(139, 92, 246, 0.1)" }}>
          <div style={{ fontSize: "2.5rem", color: "var(--primary)", fontWeight: "bold" }}>{stats.totalAnalyses}</div>
          <div style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Resumes Analyzed</div>
        </div>
        <div className="glass-panel" style={{ textAlign: "center", background: "rgba(16, 185, 129, 0.1)" }}>
          <div style={{ fontSize: "2.5rem", color: "var(--success)", fontWeight: "bold" }}>{stats.totalTailored}</div>
          <div style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Resumes Tailored</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        <Link to="/" className="glass-panel" style={{ 
          textDecoration: "none", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: "1rem", 
          padding: "3rem",
          transition: "transform 0.3s",
          cursor: "pointer"
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: "3rem" }}>🔍</span>
          <h3 style={{ margin: 0, color: "var(--text-main)" }}>Analyze Resume</h3>
          <p style={{ margin: 0, textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Get detailed ATS feedback and score for your current resume.
          </p>
        </Link>

        <Link to="/" className="glass-panel" style={{ 
          textDecoration: "none", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: "1rem", 
          padding: "3rem",
          transition: "transform 0.3s",
          cursor: "pointer"
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: "3rem" }}>📝</span>
          <h3 style={{ margin: 0, color: "var(--text-main)" }}>Tailor Resume</h3>
          <p style={{ margin: 0, textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Rewrite your resume to perfectly match a specific job description.
          </p>
        </Link>

        <Link to="/recruiter" className="glass-panel" style={{ 
          textDecoration: "none", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: "1rem", 
          padding: "3rem",
          transition: "transform 0.3s",
          cursor: "pointer",
          border: "1px solid var(--primary)"
        }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <span style={{ fontSize: "3rem" }}>🏢</span>
          <h3 style={{ margin: 0, color: "var(--text-main)" }}>Recruiter Mode</h3>
          <p style={{ margin: 0, textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Bulk upload resumes and see a ranked leaderboard of candidates.
          </p>
        </Link>
      </div>
    </div>
  );
}
