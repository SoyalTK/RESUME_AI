import { useState, useRef } from "react";
import axios from "axios";

export default function RecruiterMode() {
  const [files, setFiles] = useState([]);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => 
      f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    console.log("Selected Files Count:", selectedFiles.length);
    if (selectedFiles.length > 20) {
      alert("Maximum 20 resumes at once allowed.");
      return;
    }
    setFiles(selectedFiles);
  };

  const handleBulkAnalysis = async () => {
    if (files.length === 0 || !jobDescription) {
      setError("Please upload resumes and provide a Job Description.");
      return;
    }

    setLoading(true);
    setProgress(10);
    setError("");
    setLeaderboard([]);

    try {
      const token = localStorage.getItem("token");
      
      // 1. Upload & Parse
      const formData = new FormData();
      files.forEach((file, index) => {
        console.log(`Appending File ${index + 1}:`, file.name);
        formData.append("resumes", file);
      });

      const uploadRes = await axios.post("http://localhost:5000/bulk-upload", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });

      const resumes = uploadRes.data.resumes;
      setProgress(40);

      // 2. Batch Analyze
      const analyzeRes = await axios.post("http://localhost:5000/bulk-analyze", {
        resumes,
        jobDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLeaderboard(analyzeRes.data.leaderboard);
      setProgress(100);
    } catch (err) {
      setError("Analysis failed. Please check your connection or file quantity.");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (leaderboard.length === 0) return;
    const headers = ["Candidate", "Score", "Verdict", "Summary"];
    const rows = leaderboard.map(c => [c.name, c.score, c.verdict, c.summary]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(r => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "candidate_leaderboard.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-container">
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <header className="header">
          <span className="logo-icon">🏢</span>
          <h1>Recruiter Mode</h1>
          <p>Bulk process resumes and rank candidates instantly.</p>
        </header>

        <div className="main-content">
          <div className="input-group">
            <label className="section-label">1. Job Description</label>
            <textarea 
              className="text-area glass-input" 
              placeholder="Paste the job requirements here..."
              rows="5"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="section-label">2. Upload Resumes (Max 20 PDFs)</label>
            <div 
              className={`file-upload-wrapper ${files.length > 0 ? 'has-file' : ''}`}
            >
              <input 
                type="file" 
                multiple 
                accept=".pdf" 
                ref={fileInputRef} 
                className="file-input" 
                onChange={handleFileChange}
              />
              <div className="file-label">
                <span>{files.length > 0 ? `${files.length} resumes selected` : "Select up to 20 Candidate Resumes"}</span>
              </div>
            </div>
          </div>

          <button 
            className="analyze-btn" 
            onClick={handleBulkAnalysis}
            disabled={loading || files.length === 0 || !jobDescription}
          >
            {loading ? `Processing Candidates (${progress}%)...` : "Generate AI Leaderboard"}
          </button>

          {error && <div style={{ color: 'var(--error)', marginTop: '1rem', textAlign: 'center' }}>{error}</div>}
        </div>
      </div>

      {leaderboard.length > 0 && (
        <div className="glass-panel slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="result-title" style={{ margin: 0 }}>Candidate Ranking</h2>
            <button 
              onClick={exportToCSV}
              style={{
                padding: '0.6rem 1.2rem',
                border: '1px solid var(--primary)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Export to CSV
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Rank</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Candidate</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>ATS Score</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>AI Verdict</th>
                  <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Quick Summary</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((c, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.3s' }}>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        background: index < 3 ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem'
                      }}>
                        {index + 1}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{c.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        color: c.score > 80 ? 'var(--success)' : c.score > 50 ? '#fbbf24' : 'var(--error)',
                        fontWeight: 'bold'
                      }}>
                        {c.score}%
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem',
                        background: c.verdict.toLowerCase().includes('recommend') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)'
                      }}>
                        {c.verdict}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{c.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
