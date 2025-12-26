import React, { useState } from 'react';
import { useAuth } from '../auth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', tenantSubdomain: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (e) {
      console.error('Login error:', e);
      console.error('Error response:', e.response?.data);
      setError('Invalid credentials');
    } finally { setLoading(false); }
  };
  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <h2>Welcome back</h2>
      <p className="text-muted">Sign in to GPP Multi‑Tenant SaaS</p>
      <div className="card">
        <form onSubmit={submit}>
          <label>Email</label>
          <input className="input" required type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <label>Password</label>
          <input className="input" required type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
          <label>Tenant Subdomain <span className="text-muted">(omit for Super Admin)</span></label>
          <input className="input" value={form.tenantSubdomain} onChange={e=>setForm({...form, tenantSubdomain:e.target.value.toLowerCase()})} />
          <div className="spacer"></div>
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Signing in…' : 'Login'}</button>
        </form>
        {error && <p className="badge badge-warning" style={{ marginTop: 10 }}>{error}</p>}
      </div>
      <div className="spacer"></div>
      <p className="text-muted">No account? <Link to="/register">Register here</Link></p>
    </div>
  );
}
