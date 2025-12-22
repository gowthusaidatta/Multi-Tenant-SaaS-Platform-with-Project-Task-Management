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
      setError('Invalid credentials');
    } finally { setLoading(false); }
  };
  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <label>Email</label>
        <input required type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <label>Password</label>
        <input required type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
        <label>Tenant Subdomain (omit for Super Admin)</label>
        <input value={form.tenantSubdomain} onChange={e=>setForm({...form, tenantSubdomain:e.target.value.toLowerCase()})} />
        <div style={{ marginTop: 12 }}>
          <button disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
        </div>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p>No account? <Link to="/register">Register here</Link></p>
    </div>
  );
}
