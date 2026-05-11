import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import Groq from 'groq-sdk';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase, { initDb } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB (non-blocking)
initDb();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token provided. Please log in.' });
  jwt.verify(token.replace('Bearer ', ''), JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized. Token invalid.' });
    req.userId = decoded.id;
    next();
  });
};

// Multer memory storage for serverless-friendly uploads
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const uploadSingle = multer({ storage: memoryStorage }).single('resume');

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Dynamic pdf-parse loader
const loadPdfParse = async () => {
  const module = await import('pdf-parse');
  return module.PDFParse || module.default || module;
};

app.get('/', (req, res) => res.send('API Running'));

app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert([{ name, email, password_hash }]);
    if (error) {
      if (error.code === '23505' || (error.message && error.message.includes('duplicate'))) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      throw error;
    }
    res.json({ message: 'User registered successfully!', user: data?.[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'All fields are required' });
  try {
    const { data: rows, error } = await supabase.from('users').select('*').eq('email', email).limit(1);
    if (error) throw error;
    const user = rows && rows[0];
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: 'Error logging in' });
  }
});

app.get('/auth/me', verifyToken, async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('users').select('id, name, email, gender, bio, location, profile_image, created_at').eq('id', req.userId).limit(1);
    if (error) throw error;
    const user = rows && rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('GET ME ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch profile details' });
  }
});

app.put('/auth/profile', verifyToken, async (req, res) => {
  try {
    const { name, gender, bio, location } = req.body;
    const { error } = await supabase.from('users').update({ name, gender, bio, location }).eq('id', req.userId);
    if (error) throw error;
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('PROFILE UPDATE ERROR:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Profile image upload -> store in Supabase Storage and save public URL
app.post('/auth/profile-image', verifyToken, multer({ storage: memoryStorage }).single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const ext = (req.file.originalname.split('.').pop() || 'jpg').replace(/\?.*$/, '');
    const filename = `profile_${req.userId}_${Date.now()}.${ext}`;
    const bucket = process.env.SUPABASE_PROFILE_BUCKET || 'profiles';

    const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
    if (uploadError) throw uploadError;

    // Construct public URL
    const publicUrl = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${encodeURIComponent(filename)}`;

    const { error: imgErr } = await supabase.from('users').update({ profile_image: publicUrl }).eq('id', req.userId);
    if (imgErr) throw imgErr;

    res.json({ message: 'Profile image updated', imageUrl: publicUrl });
  } catch (err) {
    console.error('IMAGE UPLOAD ERROR:', err);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

app.post('/upload', verifyToken, upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const PDFParse = await loadPdfParse();
    const data = await PDFParse(req.file.buffer);
    res.json({ text: data.text });
  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

app.post('/analyze', verifyToken, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText) return res.status(400).json({ error: 'resumeText is required' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key missing' });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert resume reviewer and ATS evaluator. Provide structured, clear, and professional feedback.' },
        { role: 'user', content: `${jobDescription ? `Job Description:\n${jobDescription}\n` : ''}\nResume:\n${resumeText}\n\nProvide:\n1. Match Score (0-100 if job description is provided, otherwise general ATS score)\n2. Strengths\n3. Weaknesses / gaps\n4. Suggestions for improvement\n5. Final verdict` }
      ]
    });

    const result = completion.choices[0]?.message?.content;

    const { error: histErr } = await supabase.from('history').insert([{ user_id: req.userId, type: 'analysis', job_description: jobDescription, result_content: result, resume_text_sample: resumeText.substring(0, 500) }]);
    if (histErr) throw histErr;

    res.json({ result });
  } catch (err) {
    console.error('ANALYZE ERROR:', err);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.post('/tailor', verifyToken, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) return res.status(400).json({ error: 'resumeText and jobDescription are required for tailoring' });
    if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'Groq API key missing' });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are an expert ATS-friendly Resume Writer. Output ONLY a clean, professional ATS-friendly Markdown resume.' },
        { role: 'user', content: `Job Description:\n${jobDescription}\n\nOriginal Resume:\n${resumeText}` }
      ]
    });

    const result = completion.choices[0]?.message?.content;
    const { error: histErr2 } = await supabase.from('history').insert([{ user_id: req.userId, type: 'tailor', job_description: jobDescription, result_content: result, resume_text_sample: resumeText.substring(0, 500) }]);
    if (histErr2) throw histErr2;

    res.json({ tailoredResume: result });
  } catch (err) {
    console.error('TAILOR ERROR:', err);
    res.status(500).json({ error: 'Tailoring failed' });
  }
});

app.post('/bulk-upload', verifyToken, upload.array('resumes', 20), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  try {
    const PDFParse = await loadPdfParse();
    const results = [];
    for (const file of req.files) {
      const data = await PDFParse(file.buffer);
      results.push({ filename: file.originalname, text: data.text });
    }
    res.json({ resumes: results });
  } catch (err) {
    console.error('BULK UPLOAD ERROR:', err);
    res.status(500).json({ error: 'Failed to parse one or more PDFs' });
  }
});

app.post('/bulk-analyze', verifyToken, async (req, res) => {
  try {
    const { resumes, jobDescription } = req.body;
    if (!resumes || !Array.isArray(resumes) || resumes.length === 0) return res.status(400).json({ error: 'Resumes are required' });
    if (!jobDescription) return res.status(400).json({ error: 'Job Description is required for ranking' });

    const analysisPromises = resumes.map(async (resume) => {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are an expert recruiter and ATS engine. Evaluate the candidate for the provided job description. Return ONLY a JSON object with format: { "score": integer (0-100), "summary": "string", "verdict": "Short" }' },
            { role: 'user', content: `Job: ${jobDescription}\nResume Content: ${resume.text}` }
          ],
          response_format: { type: 'json_object' }
        });

        const evaluation = JSON.parse(completion.choices[0]?.message?.content || '{}');
        let rawScore = evaluation.score || 0;
        if (rawScore > 0 && rawScore <= 1) rawScore = Math.round(rawScore * 100);
        else rawScore = Math.round(rawScore);

        return { name: resume.filename.replace(/\.[^/.]+$/, ''), score: rawScore, summary: evaluation.summary || 'No summary', verdict: evaluation.verdict || 'N/A' };
      } catch (err) {
        console.error(`Error analyzing ${resume.filename}:`, err);
        return { name: resume.filename, score: 0, summary: 'Analysis failed', verdict: 'Error' };
      }
    });

    const results = await Promise.all(analysisPromises);
    results.sort((a, b) => b.score - a.score);
    res.json({ leaderboard: results });
  } catch (err) {
    console.error('BULK ANALYZE ERROR:', err);
    res.status(500).json({ error: 'Batch analysis failed' });
  }
});

app.get('/history', verifyToken, async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('history').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ history: rows });
  } catch (err) {
    console.error('HISTORY GET ERROR:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.delete('/history/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('history').delete().eq('id', id).eq('user_id', req.userId);
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Item not found or unauthorized' });
    res.json({ message: 'History item deleted' });
  } catch (err) {
    console.error('HISTORY DELETE ERROR:', err);
    res.status(500).json({ error: 'Failed to delete history item' });
  }
});

export default serverless(app);
