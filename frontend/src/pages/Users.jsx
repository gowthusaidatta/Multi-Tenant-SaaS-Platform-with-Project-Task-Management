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
    <div>
      <h2>Users</h2>
      <div className="stack" style={{ margin:'8px 0' }}>
        <input className="input" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="select" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="">All</option>
          <option value="user">User</option>
          <option value="tenant_admin">Tenant Admin</option>
        </select>
        <button className="btn" onClick={load}>Filter</button>
        <button className="btn btn-primary right" onClick={()=>setShowModal(true)}>Add User</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(u => (
            <tr key={u.id}>
              <td>{u.fullName}</td>
              <td>{u.email}</td>
              <td><span className="badge">{u.role}</span></td>
              <td>{u.isActive ? <span className="badge badge-success">Active</span> : <span className="badge">Inactive</span>}</td>
              <td><button className="btn btn-danger" onClick={()=>remove(u.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header"><h3>Add User</h3><button className="btn" onClick={()=>setShowModal(false)}>✕</button></div>
            <label>Full Name</label>
            <input className="input" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} />
            <label>Email</label>
            <input className="input" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            <label>Password</label>
            <input className="input" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
            <label>Role</label>
            <select className="select" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
              <option value="user">User</option>
              <option value="tenant_admin">Tenant Admin</option>
            </select>
            <div className="modal-actions">
              <button className="btn" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={add}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
