import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { TenantsAPI, UsersAPI } from '../api';

export default function Groups() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [tenantUsers, setTenantUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const isSuperAdmin = user?.role === 'super_admin';
  const isTenantAdmin = user?.role === 'tenant_admin';

  const loadTenants = async () => {
    try {
      const r = await TenantsAPI.list({ limit: 100 });
      const list = r.data?.data?.tenants || [];
      setTenants(list);
      if (list.length && !selectedTenantId) {
        setSelectedTenantId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load tenants:', e);
    }
  };

  const loadTenantUsers = async () => {
    if (!selectedTenantId) return;
    try {
      const query = { search, page, limit: 20 };
      const r = await UsersAPI.list(selectedTenantId, query);
      setTenantUsers(r.data?.data?.users || []);
      const pg = r.data?.data?.pagination;
      if (pg) {
        setTotalPages(pg.totalPages || 1);
      } else {
        setTotalPages(1);
      }
    } catch (e) {
      console.error('Failed to load tenant users:', e);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadTenants();
  }, [user]);

  useEffect(() => {
    loadTenantUsers();
  }, [selectedTenantId, search, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const removeUser = async (id) => {
    try {
      if (confirm('Delete user?')) {
        await UsersAPI.remove(id);
        setToast('User deleted successfully');
        setTimeout(()=>setToast(''), 2500);
        await loadTenantUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!isSuperAdmin && !isTenantAdmin) {
    return <div className="card">Access Denied</div>;
  }

  const currentTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div>
      <h2>Groups (Domains)</h2>
      {toast && (<div className="card" style={{ background:'#e7f7ed', border:'1px solid #35a07d' }}>✅ {toast}</div>)}
      {isSuperAdmin && <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>System-wide domain management — View and manage all domains and their members</p>}
      {isTenantAdmin && <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>Your domain: <strong>{user?.tenant?.name}</strong> ({user?.tenant?.subdomain})</p>}
      
      <div className="stack" style={{ margin:'8px 0' }}>
        {isSuperAdmin && (
          <select className="select" value={selectedTenantId} onChange={e=>setSelectedTenantId(e.target.value)} style={{ flex: 1 }}>
            <option value="">Select a domain</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
            ))}
          </select>
        )}
        <input className="input" placeholder="Search members" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>

      {selectedTenantId && currentTenant && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div className="card-title">Domain Name</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{currentTenant.name}</div>
            </div>
            <div>
              <div className="card-title">Subdomain</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{currentTenant.subdomain}</div>
            </div>
            <div>
              <div className="card-title">Plan</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{currentTenant.subscriptionPlan}</div>
            </div>
            <div>
              <div className="card-title">Status</div>
              <span className="badge">{currentTenant.status}</span>
            </div>
            <div>
              <div className="card-title">Members</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{currentTenant.totalUsers || 0}</div>
            </div>
          </div>
        </div>
      )}

      <h3>Domain Members</h3>
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
          {tenantUsers.map(u => (
            <tr key={u.id}>
              <td>{u.fullName}</td>
              <td>{u.email}</td>
              <td><span className="badge">{u.role}</span></td>
              <td>{u.isActive ? <span className="badge badge-success">Active</span> : <span className="badge">Inactive</span>}</td>
              <td>
                {isSuperAdmin || (isTenantAdmin && u.id !== user.id) ? (
                  <button className="btn btn-danger" onClick={()=>removeUser(u.id)}>Delete</button>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {tenantUsers.length === 0 && <p className="text-muted" style={{ padding: 16 }}>No members found</p>}
      
      <div className="stack" style={{ alignItems:'center', gap:8, marginTop: 12 }}>
        <button className="btn" disabled={page <= 1} onClick={()=>setPage(p => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn" disabled={page >= totalPages} onClick={()=>setPage(p => Math.min(totalPages, p + 1))}>Next</button>
      </div>
    </div>
  );
}
