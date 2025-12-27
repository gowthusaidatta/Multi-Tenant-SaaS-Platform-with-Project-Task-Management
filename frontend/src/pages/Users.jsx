import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { UsersAPI, TenantsAPI } from '../api';

export default function Users() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'user', isActive: true });
  const [reload, setReload] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [toast, setToast] = useState('');
  const [newDomain, setNewDomain] = useState({ name: '', subdomain: '', subscriptionPlan: 'free', status: 'active' });
  const isSuperAdmin = user?.role === 'super_admin';

  const loadUsers = async () => {
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
    if (!user) return;
    const init = async () => {
      if (isSuperAdmin) {
        try {
          const tRes = await TenantsAPI.list({ limit: 50 });
          const list = tRes.data?.data?.tenants || [];
          setTenants(list);
          if (list.length && !selectedTenantId) setSelectedTenantId(list[0].id);
        } catch (e) {
          console.error('Failed to load tenants:', e);
        }
      }
      await loadUsers();
    };
    init();
  }, [user, search, role, isSuperAdmin, reload]);

  const add = async () => {
    try {
      if (!form.email || !form.fullName || !form.password) {
        alert('Please fill all fields');
        return;
      }
      if (isSuperAdmin) {
        if (!selectedTenantId) {
          alert('Please select a domain');
          return;
        }
        let targetTenantId = selectedTenantId;
        if (selectedTenantId === '__new__') {
          if (!newDomain.name || !newDomain.subdomain) {
            alert('Domain name and subdomain are required');
            return;
          }
          try {
            const tRes = await TenantsAPI.create(newDomain);
            targetTenantId = tRes.data?.data?.id;
            if (!targetTenantId) throw new Error('Failed to retrieve new domain id');
          } catch (e) {
            console.error('Failed to create domain:', e);
            alert(e.response?.data?.message || 'Failed to create domain');
            return;
          }
        }
        await UsersAPI.add(targetTenantId, form);
      } else {
        await UsersAPI.add(user.tenant.id, form);
      }
      setShowModal(false); 
      setForm({ email:'', fullName:'', password:'', role:'user', isActive:true });
      setReload(r => r + 1);
      setToast('User created successfully');
      setTimeout(()=>setToast(''), 2500);
    } catch (error) {
      console.error('Failed to add user:', error);
      alert(error.response?.data?.message || 'Failed to add user');
    }
  };
  const remove = async (id) => { 
    try {
      if (confirm('Delete user?')) { 
        await UsersAPI.remove(id); 
        setReload(r => r + 1);
        setToast('User deleted successfully');
        setTimeout(()=>setToast(''), 2500);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <h2>{isSuperAdmin ? 'All Users' : 'Team Members'}</h2>
      {toast && (<div className="card" style={{ background:'#e7f7ed', border:'1px solid #35a07d' }}>✅ {toast}</div>)}
      {isSuperAdmin && <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>System-wide access — You can view, create, and delete users across all domains</p>}
      <div className="stack" style={{ margin:'8px 0' }}>
        <input className="input" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="select" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="">All</option>
          <option value="user">User</option>
          <option value="tenant_admin">Tenant Admin</option>
          {isSuperAdmin && <option value="super_admin">Super Admin</option>}
        </select>
        <button className="btn" onClick={loadUsers}>Filter</button>
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
            {isSuperAdmin && (
              <>
                <label>Domain</label>
                <select className="select" value={selectedTenantId} onChange={e=>setSelectedTenantId(e.target.value)}>
                  <option value="">Select a domain</option>
                  <option value="__new__">Create New Domain…</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
                  ))}
                </select>
                {selectedTenantId === '__new__' && (
                  <div className="card" style={{ marginTop: 8 }}>
                    <label>Domain Name</label>
                    <input className="input" value={newDomain.name} onChange={e=>setNewDomain({ ...newDomain, name:e.target.value })} />
                    <label>Subdomain</label>
                    <input className="input" value={newDomain.subdomain} onChange={e=>setNewDomain({ ...newDomain, subdomain:e.target.value })} />
                    <label>Plan</label>
                    <select className="select" value={newDomain.subscriptionPlan} onChange={e=>setNewDomain({ ...newDomain, subscriptionPlan:e.target.value })}>
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                    <label>Status</label>
                    <select className="select" value={newDomain.status} onChange={e=>setNewDomain({ ...newDomain, status:e.target.value })}>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}
              </>
            )}
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
