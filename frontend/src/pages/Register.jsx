import React, { useState } from 'react';
import { AuthAPI } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({ tenantName: '', subdomain: '', adminEmail: '', adminFullName: '', adminPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setMessage('');
    try {
      await AuthAPI.registerTenant(form);
      setMessage('Tenant registered successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1000);
    } catch (e) {
      setMessage('Registration failed');
    } finally { setLoading(false); }
  };
  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h2>Register Tenant</h2>
      <form onSubmit={submit}>
        <label>Organization Name</label>
        <input required value={form.tenantName} onChange={e=>setForm({...form, tenantName:e.target.value})} />
        <label>Subdomain</label>
        <input required value={form.subdomain} onChange={e=>setForm({...form, subdomain:e.target.value.toLowerCase()})} />
        <small>Will be used as subdomain (e.g., {form.subdomain||'yourteam'}.yourapp.com)</small>
        <label>Admin Full Name</label>
        <input required value={form.adminFullName} onChange={e=>setForm({...form, adminFullName:e.target.value})} />
        <label>Admin Email</label>
        <input required type="email" value={form.adminEmail} onChange={e=>setForm({...form, adminEmail:e.target.value})} />
        <label>Password</label>
        <input required type="password" value={form.adminPassword} onChange={e=>setForm({...form, adminPassword:e.target.value})} />
        <div style={{ marginTop: 12 }}>
          <button disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
        </div>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
