// Seed demo user and test login
const API = 'http://localhost:5000';

const demo = { name: 'Demo', email: 'demo@example.com', password: 'password' };

const register = async () => {
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(demo)
    });
    const data = await res.json().catch(() => ({}));
    console.log('Register:', res.status, data);
    return { ok: res.ok, data };
  } catch (err) {
    console.error('Register error:', err);
    return { ok: false, data: null };
  }
};

const login = async () => {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demo.email, password: demo.password })
    });
    const data = await res.json().catch(() => ({}));
    console.log('Login:', res.status, data);
    return { ok: res.ok, data };
  } catch (err) {
    console.error('Login error:', err);
    return { ok: false, data: null };
  }
};

const run = async () => {
  console.log('Seeding demo user:', demo.email);
  const r = await register();
  if (!r.ok && r.data && r.data.error && r.data.error.toLowerCase().includes('email')) {
    console.log('User may already exist, attempting login...');
  }
  const l = await login();
  if (l.ok && l.data && l.data.token) {
    console.log('Demo user seeded and login successful. Token:', l.data.token.slice(0,20) + '...');
  } else {
    console.log('Login failed or no token returned. See output above.');
  }
};

run();
