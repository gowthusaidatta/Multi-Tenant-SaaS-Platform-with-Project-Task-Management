import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { ProjectsAPI, TenantsAPI } from '../api';
import { Link } from 'react-router-dom';

export default function Projects() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const [reload, setReload] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState('');
  const isSuperAdmin = user?.role === 'super_admin';

  const loadProjects = async () => {
    try {
      const query = { search, status, page, limit: 10 };
      const r = isSuperAdmin ? await ProjectsAPI.listAll(query) : await ProjectsAPI.list(query);
      setItems(r.data?.data?.projects || []);
      const pg = r.data?.data?.pagination;
      if (pg) {
        setTotalPages(pg.totalPages || 1);
        // Keep page in sync with API response if it differs
        if (pg.currentPage && pg.currentPage !== page) setPage(pg.currentPage);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setItems([]);
      setTotalPages(1);
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
      await loadProjects();
    };
    init();
  }, [user, search, status, isSuperAdmin, reload, page]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const create = async () => {
    try {
      if (!form.name) {
        alert('Project name is required');
        return;
      }
      // Super admin must target a tenant
      const payload = { ...form };
      if (isSuperAdmin) {
        if (!selectedTenantId) {
          alert('Please select a tenant');
          return;
        }
        payload.tenantId = selectedTenantId;
      }
      await ProjectsAPI.create(payload);
      setShowModal(false); 
      setForm({ name:'', description:'', status:'active' });
      setReload(r => r + 1);
      setToast('Project created successfully');
      setTimeout(()=>setToast(''), 2500);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(error.response?.data?.message || 'Failed to create project');
    }
  };
  const remove = async (id) => { 
    try {
      if (confirm('Delete project?')) { 
        await ProjectsAPI.remove(id); 
        setReload(r => r + 1);
        setToast('Project deleted successfully');
        setTimeout(()=>setToast(''), 2500);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert(error.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <div>
      <h2>Projects</h2>
      {toast && (<div className="card" style={{ background:'#e7f7ed', border:'1px solid #35a07d' }}>✅ {toast}</div>)}
      {isSuperAdmin && <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>� System-wide access - You can view, create, and delete projects from any tenant</p>}
      <div className="stack" style={{ margin:'8px 0' }}>
        <input className="input" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>
        <button className="btn" onClick={loadProjects}>Filter</button>
        <button className="btn btn-primary right" onClick={()=>setShowModal(true)}>Create New Project</button>
      </div>
      <div className="stack" style={{ alignItems:'center', gap:8 }}>
        <button className="btn" disabled={page <= 1} onClick={()=>setPage(p => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn" disabled={page >= totalPages} onClick={()=>setPage(p => Math.min(totalPages, p + 1))}>Next</button>
      </div>
      <ul className="item-list">
        {items.map(p => (
          <li key={p.id}>
            <div>
              <div style={{ fontWeight:600 }}>{p.name} <span className="badge">{p.status}</span> {isSuperAdmin && <span className="text-muted">({p.tenantName})</span>}</div>
              <div className="text-muted">{p.description}</div>
              <small className="text-muted">Tasks: {p.taskCount} • By: {p.createdBy.fullName}</small>
            </div>
            <span className="right stack">
              <Link to={`/projects/${p.id}`}><button className="btn">View</button></Link>
              <button className="btn btn-danger" onClick={()=>remove(p.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header"><h3>Create Project</h3><button className="btn" onClick={()=>setShowModal(false)}>✕</button></div>
            {isSuperAdmin && (
              <>
                <label>Tenant</label>
                <select className="select" value={selectedTenantId} onChange={e=>setSelectedTenantId(e.target.value)}>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
                  ))}
                </select>
              </>
            )}
            <label>Name</label>
            <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
            <label>Description</label>
            <textarea className="input" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <label>Status</label>
            <select className="select" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
            <div className="modal-actions">
              <button className="btn" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={create}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
