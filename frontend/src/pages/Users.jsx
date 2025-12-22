import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { UsersAPI } from '../api';

export default function Users() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'user', isActive: true });

  const load = async () => {
    const r = await UsersAPI.list(user.tenant.id, { search, role });
    setItems(r.data.data.users || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    await UsersAPI.add(user.tenant.id, form);
    setShowModal(false); setForm({ email:'', fullName:'', password:'', role:'user', isActive:true });
    await load();
  };
  const remove = async (id) => { if (confirm('Delete user?')) { await UsersAPI.remove(id); await load(); } };

  return (
    <div style={{ padding: 16 }}>
      <h2>Users</h2>
      <div style={{ display:'flex', gap:8, margin:'8px 0' }}>
        <input placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option value="">All</option>
          <option value="user">User</option>
          <option value="tenant_admin">Tenant Admin</option>
        </select>
        <button onClick={load}>Filter</button>
        <button style={{ marginLeft:'auto' }} onClick={()=>setShowModal(true)}>Add User</button>
      </div>
      <table width="100%" cellPadding="6" style={{ borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ textAlign:'left', borderBottom:'1px solid #eee' }}>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(u => (
            <tr key={u.id} style={{ borderBottom:'1px solid #f3f3f3' }}>
              <td>{u.fullName}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.isActive ? 'Active' : 'Inactive'}</td>
              <td><button onClick={()=>remove(u.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)' }}>
          <div style={{ background:'#fff', width:420, margin:'10% auto', padding:16, borderRadius:8 }}>
            <h3>Add User</h3>
            <label>Full Name</label>
            <input value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} />
            <label>Email</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            <label>Password</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
            <label>Role</label>
            <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
              <option value="user">User</option>
              <option value="tenant_admin">Tenant Admin</option>
            </select>
            <div style={{ marginTop: 12, display:'flex', gap:8 }}>
              <button onClick={()=>setShowModal(false)}>Cancel</button>
              <button onClick={add}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
