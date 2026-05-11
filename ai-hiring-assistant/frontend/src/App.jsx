import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./App.css";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import RecruiterMode from "./pages/RecruiterMode";
import Navbar from "./components/Navbar";

function Analysis({ setAuth }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState("");
  const [tailoredResume, setTailoredResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get("/api/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(res.data.history);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const deleteHistoryItem = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHistory();
    } catch (err) {
      alert("Failed to delete history item");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuth(false);
    navigate("/login");
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a resume (PDF)");
      return;
    }

    try {
      setLoading(true);
      setResult("");
      setTailoredResume("");

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const formData = new FormData();
      formData.append("resume", file);

      const uploadRes = await axios.post(
        "/api/upload",
        formData,
        { headers }
      );

      const resumeText = uploadRes.data.text;

      const analysisRes = await axios.post(
        "/api/analyze",
        { resumeText, jobDescription },
        { headers }
      );

      setResult(analysisRes.data.result);
      fetchHistory();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        setResult("Error occurred while analyzing resume. Please check the backend connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTailor = async () => {
    if (!file) {
      alert("Please upload a resume (PDF)");
      return;
    }
    if (!jobDescription) {
      alert("Please provide a Job Description to tailor the resume to!");
      return;
    }

    try {
      setTailorLoading(true);
      setTailoredResume("");
      setResult("");

      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const formData = new FormData();
      formData.append("resume", file);

      const uploadRes = await axios.post(
        "/api/upload",
        formData,
        { headers }
      );
      const resumeText = uploadRes.data.text;

      const tailorRes = await axios.post(
        "/api/tailor",
        { resumeText, jobDescription },
        { headers }
      );

      setTailoredResume(tailorRes.data.tailoredResume);
      fetchHistory();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      } else {
        alert("Error occurred while tailoring resume.");
      }
    } finally {
      setTailorLoading(false);
    }
  };

  const downloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = document.getElementById('resume-template');
    
    const opt = {
      margin:       0.5,
      filename:     'Tailored_Resume.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="app-container" style={{ paddingTop: 0 }}>
      <div className="glass-panel">
        <header className="header">
          <h1>AI Resume Tool</h1>
          <p>Analyze and Tailor your professional documents</p>
        </header>

        <main className="main-content">
          <div className="input-group">
            <label className="section-label">1. Upload Resume</label>
            <div className={`file-upload-wrapper ${file ? 'has-file' : ''}`}>
              <input
                type="file"
                id="file-input"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="file-input"
              />
              <label htmlFor="file-input" className="file-label">
                <span className="upload-icon">📄</span>
                {file ? file.name : "Choose PDF File"}
              </label>
            </div>
          </div>

          <div className="input-group">
            <label className="section-label" htmlFor="job-desc">
              2. Job Description (Optional for analysis)
            </label>
            <textarea
              id="job-desc"
              placeholder="Paste the job description here..."
              rows="5"
              className="text-area glass-input"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className={`analyze-btn ${loading ? 'loading' : ''}`}
              onClick={handleUpload} 
              disabled={loading || tailorLoading}
              style={{ flex: 1 }}
            >
              {loading ? (
                <span className="spinner-container">
                  <span className="spinner"></span> Analyzing...
                </span>
              ) : (
                "Run Analysis"
              )}
            </button>
            <button 
              className={`analyze-btn ${tailorLoading ? 'loading' : ''}`}
              onClick={handleTailor} 
              disabled={loading || tailorLoading}
              style={{ flex: 1, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
            >
              {tailorLoading ? (
                <span className="spinner-container">
                  <span className="spinner"></span> Tailoring...
                </span>
              ) : (
                "Tailor Resume"
              )}
            </button>
          </div>

          {result && (
            <div className="result-container glass-panel" style={{ marginTop: '2rem' }}>
              <h2 className="result-title">Analysis Results</h2>
              <div className="markdown-body">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          )}

          {tailoredResume && (
            <div className="result-container glass-panel" style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="result-title">Your Tailored Resume</h2>
                <button 
                  onClick={downloadPDF} 
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Download PDF
                </button>
              </div>
              
              <div style={{ marginTop: '1rem' }}>
                <div id="resume-template" className="resume-print-area" style={{ padding: '2rem', borderRadius: '8px', textAlign: 'left', fontFamily: 'Arial, sans-serif' }}>
                  <ReactMarkdown>{tailoredResume}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {history.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <h2 className="result-title">Recent Activity</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1rem',
            justifyContent: 'center'
          }}>
            {history.map((item) => (
              <div 
                key={item.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1rem', 
                  fontSize: '0.9rem', 
                  cursor: 'pointer', 
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(0,0,0,0.2)',
                  textAlign: 'left'
                }}
                onClick={() => {
                  setJobDescription(item.job_description || "");
                  if (item.type === 'analysis') {
                    setResult(item.result_content);
                    setTailoredResume("");
                  } else {
                    setTailoredResume(item.result_content);
                    setResult("");
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <button 
                  onClick={(e) => deleteHistoryItem(item.id, e)}
                  style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                >✕</button>
                <div style={{ fontWeight: 'bold', color: item.type === 'analysis' ? 'var(--primary)' : 'var(--success)', marginBottom: '0.5rem' }}>
                  {item.type === 'analysis' ? '🔍 Analysis' : '📝 Tailored'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                </div>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                   {item.job_description || "General Analysis"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PrivateLayout({ children, setAuth }) {
  return (
    <>
      <Navbar setAuth={setAuth} />
      {children}
    </>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) return null;

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <PrivateLayout setAuth={setIsAuthenticated}><Analysis setAuth={setIsAuthenticated} /></PrivateLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/home" 
          element={isAuthenticated ? <PrivateLayout setAuth={setIsAuthenticated}><Home /></PrivateLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <PrivateLayout setAuth={setIsAuthenticated}><Profile /></PrivateLayout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/recruiter" 
          element={isAuthenticated ? <PrivateLayout setAuth={setIsAuthenticated}><RecruiterMode /></PrivateLayout> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;