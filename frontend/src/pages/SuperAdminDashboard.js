import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import tenantService from '../services/tenantService';
import '../styles/Dashboard.css';

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', subdomain: '', subscriptionPlan: 'free', status: 'active', maxUsers: 5, maxProjects: 3 });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState('');

  const fetchTenants = async (pageParam = 1) => {
    try {
      setLoading(true);
      const response = await tenantService.getAllTenants({ page: pageParam, limit: 10 });
      if (response.data?.success) {
        const payload = response.data.data || {};
        setTenants(payload.tenants || []);
        const pagination = payload.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
        }
      } else {
        setError(response.data?.message || 'Failed to load tenants');
      }
    } catch (err) {
      setError('Failed to load tenants');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchTenants(page);
    }
  }, [user, page]);

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({
      name: t.name || '',
      subdomain: t.subdomain || '',
      subscriptionPlan: t.subscriptionPlan || 'free',
      status: t.status || 'active',
      maxUsers: t.maxUsers || 5,
      maxProjects: t.maxProjects || 3
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', subdomain: '' });
  };

  const saveTenant = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      const payload = { 
        name: editForm.name, 
        subdomain: editForm.subdomain,
        subscriptionPlan: editForm.subscriptionPlan,
        status: editForm.status,
        maxUsers: Number(editForm.maxUsers) || undefined,
        maxProjects: Number(editForm.maxProjects) || undefined
      };
      const res = await tenantService.updateTenant(editingId, payload);
      if (res.data?.success) {
        setTenants(prev => prev.map(t => t.id === editingId ? { 
          ...t, 
          name: payload.name || t.name, 
          subdomain: payload.subdomain || t.subdomain,
          subscriptionPlan: payload.subscriptionPlan || t.subscriptionPlan,
          status: payload.status || t.status,
          maxUsers: payload.maxUsers || t.maxUsers,
          maxProjects: payload.maxProjects || t.maxProjects
        } : t));
        setToast('Tenant updated');
        setTimeout(() => setToast(''), 3000);
        cancelEdit();
      } else {
        setError(res.data?.message || 'Failed to update tenant');
      }
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update tenant';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="dashboard-page">
        <div className="alert alert-error">
          Access denied. Super admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {error && <div className="alert alert-error">{error}</div>}
      {toast && <div className="alert alert-success">{toast}</div>}
      
      <div className="dashboard-header">
        <div>
          <h1>System Administration</h1>
          <p className="subtitle">Manage all tenants in the system</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading tenants...</div>
      ) : (
        <div className="dashboard-content">
          <section className="recent-section">
            <div className="section-header">
              <h2>All Tenants</h2>
              <span className="count">{tenants.length} total tenants</span>
            </div>
            
            {tenants.length > 0 ? (
              <div className="recent-list">
                {tenants.map(tenant => (
                  <div key={tenant.id} className="recent-item">
                    <div className="item-content">
                      {editingId === tenant.id ? (
                        <>
                          <div className="form-row">
                            <label>Name</label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </div>
                          <div className="form-row">
                            <label>Subdomain</label>
                            <input
                              type="text"
                              value={editForm.subdomain}
                              onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value })}
                            />
                          </div>
                          <div className="form-row">
                            <label>Plan</label>
                            <select
                              value={editForm.subscriptionPlan}
                              onChange={(e) => setEditForm({ ...editForm, subscriptionPlan: e.target.value })}
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </div>
                          <div className="form-row">
                            <label>Status</label>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="trial">Trial</option>
                            </select>
                          </div>
                          <div className="form-row grid-2">
                            <div>
                              <label>Max Users</label>
                              <input
                                type="number"
                                min="1"
                                value={editForm.maxUsers}
                                onChange={(e) => setEditForm({ ...editForm, maxUsers: e.target.value })}
                              />
                            </div>
                            <div>
                              <label>Max Projects</label>
                              <input
                                type="number"
                                min="1"
                                value={editForm.maxProjects}
                                onChange={(e) => setEditForm({ ...editForm, maxProjects: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="actions">
                            <button className="btn btn-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
                            <button className="btn btn-primary" onClick={saveTenant} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3>{tenant.name}</h3>
                          <p>Subdomain: {tenant.subdomain}</p>
                          <p>Plan: {tenant.subscriptionPlan}</p>
                          <p>Status: <span className={`status status-${tenant.status}`}>
                            {tenant.status}
                          </span></p>
                          <p>Limits: {tenant.maxUsers ?? '—'} users / {tenant.maxProjects ?? '—'} projects</p>
                          <div className="actions">
                            <button className="btn btn-secondary" onClick={() => startEdit(tenant)}>Edit</button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="item-meta">
                      <p>Created: {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No tenants found in the system.</p>
            )}
            <div className="pagination">
              <button 
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button 
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;