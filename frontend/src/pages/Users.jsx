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
  const isSuperAdmin = user?.role === 'super_admin';

  const load = async () => {
    try {
      const query = { search, role };
      const r = isSuperAdmin ? await UsersAPI.listAll(query) : await UsersAPI.list(user?.tenant?.id, query);
      setItems(r.data?.data?.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setItems([]);
    }
  };
  useEffect(() => { 
    if (user) load(); 
  }, [user]);

  const add = async () => {
    try {
      if (!form.email || !form.fullName || !form.password) {
        alert('Please fill all fields');
        return;
      }
      if (isSuperAdmin) {
        await UsersAPI.add(user.tenant.id || 'system', form);
      } else {
        await UsersAPI.add(user.tenant.id, form);
      }
      setShowModal(false); 
      setForm({ email:'', fullName:'', password:'', role:'user', isActive:true });
      await load();
    } catch (error) {
      console.error('Failed to add user:', error);
      alert(error.response?.data?.message || 'Failed to add user');
    }
  };
  const remove = async (id) => { 
    try {
      if (confirm('Delete user?')) { 
        await UsersAPI.remove(id); 
        await load(); 
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <h2>{isSuperAdmin ? 'All Users' : 'Team Members'}</h2>
      {isSuperAdmin && <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>� System-wide access - You can view, create, and delete users across all tenants</p>}
      <div className="stack" style={{ margin:'8px 0' }}>
        <input className="input" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="select" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="">All</option>
          <option value="user">User</option>
          <option value="tenant_admin">Tenant Admin</option>
          {isSuperAdmin && <option value="super_admin">Super Admin</option>}
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
            {isSuperAdmin && <th>Tenant</th>}
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
              {isSuperAdmin && <td><small>{u.tenantName || 'System'}</small></td>}
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
