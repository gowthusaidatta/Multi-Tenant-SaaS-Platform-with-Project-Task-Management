import React, { useState } from 'react';
import { AuthAPI } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ tenantName: '', subdomain: '', adminEmail: '', adminFullName: '', adminPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isValidSubdomain = (s) => {
    if (!s) return false;
    const v = String(s).toLowerCase();
    if (v.length < 3 || v.length > 63) return false;
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(v);
  };
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setMessage(''); setError('');
    if (!isValidSubdomain(form.subdomain)) {
      setLoading(false);
      setError('Invalid subdomain. Use 3–63 chars: lowercase letters, numbers, hyphens. No dots. Example: "saidatta"');
      return;
    }
    try {
      await AuthAPI.registerTenant(form);
      setMessage('Tenant registered successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1000);
    } catch (e) {
      setError('Registration failed. Please ensure the backend API is running and the subdomain is unique.');
    } finally { setLoading(false); }
  };
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2>Create your tenant</h2>
      <p className="text-muted">Set up your organization and admin account</p>
      <div className="card">
        <form onSubmit={submit}>
          <label>Organization Name</label>
          <input className="input" required value={form.tenantName} onChange={e=>setForm({...form, tenantName:e.target.value})} />
          <label>Subdomain</label>
          <input className="input" required value={form.subdomain} onChange={e=>setForm({...form, subdomain:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})} />
          <small className="text-muted">Allowed: lowercase letters, numbers, hyphens. No dots. Example: saidatta → saidatta.yourapp.com</small>
          <label>Admin Full Name</label>
          <input className="input" required value={form.adminFullName} onChange={e=>setForm({...form, adminFullName:e.target.value})} />
          <label>Admin Email</label>
          <input className="input" required type="email" value={form.adminEmail} onChange={e=>setForm({...form, adminEmail:e.target.value})} />
          <label>Password</label>
          <input className="input" required type="password" value={form.adminPassword} onChange={e=>setForm({...form, adminPassword:e.target.value})} />
          <div className="spacer"></div>
          <button className="btn btn-primary" disabled={loading || !isValidSubdomain(form.subdomain)}>{loading ? 'Registering…' : 'Register'}</button>
        </form>
        {message && <p className="badge badge-success" style={{ marginTop: 10 }}>{message}</p>}
        {error && <p className="badge badge-warning" style={{ marginTop: 10 }}>{error}</p>}
      </div>
    </div>
  );
}
