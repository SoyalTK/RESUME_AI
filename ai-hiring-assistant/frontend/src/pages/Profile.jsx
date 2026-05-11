import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    location: "",
    gender: ""
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = res.data.user;
      setUser(userData);
      setFormData({
        name: userData.name || "",
        bio: userData.bio || "",
        location: userData.location || "",
        gender: userData.gender || ""
      });
    } catch (err) {
      setError("Failed to load profile information.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5000/auth/profile", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProfile();
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("image", file);

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/auth/profile-image", uploadData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      await fetchProfile();
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const calculateCompletion = () => {
    if (!user) return 0;
    let score = 0;
    if (user.profile_image) score += 25;
    if (user.bio && user.bio.trim().length > 0) score += 25;
    if (user.location && user.location.trim().length > 0) score += 25;
    if (user.gender) score += 25;
    return score;
  };

  const completionScore = calculateCompletion();
  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (completionScore / 100) * circumference;

  const getAvatar = () => {
    if (user?.profile_image) return `http://localhost:5000${user.profile_image}`;
    return "https://api.dicebear.com/7.x/initials/svg?seed=" + (user?.name || "User") + "&backgroundColor=8b5cf6";
  };

  if (loading) return <div className="app-container"><div className="glass-panel" style={{textAlign:'center'}}>Loading Profile...</div></div>;
  if (error) return <div className="app-container"><div className="glass-panel" style={{color:'var(--error)', textAlign:'center'}}>{error}</div></div>;

  return (
    <div className="app-container">
      <div className="glass-panel" style={{ maxWidth: "700px", margin: "auto" }}>
        <header className="header" style={{ marginBottom: "1rem" }}>
          <div className="profile-avatar-container" onClick={() => fileInputRef.current?.click()}>
            <svg className="completion-ring-svg">
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
            <div className="profile-avatar-wrapper">
              {uploading ? (
                <div className="spinner"></div>
              ) : (
                <img src={getAvatar()} alt="Avatar" />
              )}
            </div>
            <div className="completion-badge">{completionScore}%</div>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{display:'none'}} 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--glass-border)', 
              color: 'var(--text-main)', 
              padding: '0.4rem 1rem', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '0.85rem',
              marginTop: '-1rem',
              marginBottom: '1rem'
            }}
          >
            {user?.profile_image ? "Change Photo" : "Upload Photo"}
          </button>
          <h2 style={{ 
            fontSize: '2rem', 
            margin: '0.5rem 0',
            background: 'linear-gradient(to right, #a78bfa, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>
            {user.name}
          </h2>
          <p style={{marginTop:'-10px', fontSize:'0.9rem'}}>Member since {new Date(user.created_at).getFullYear()}</p>
        </header>

        <form className="edit-profile-form" onSubmit={handleUpdateProfile}>
          <div className="input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              className="text-area glass-input" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Location</label>
              <input 
                type="text" 
                placeholder="e.g. San Francisco, US"
                className="text-area glass-input" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Gender (for avatar generation)</label>
              <select 
                className="gender-select"
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Professional Bio</label>
            <textarea 
              className="text-area glass-input" 
              placeholder="Tell us about yourself..."
              rows="4"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
            />
          </div>

          <button className="analyze-btn" type="submit" disabled={saving}>
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </form>
      </div>
    </div>
  );
}
