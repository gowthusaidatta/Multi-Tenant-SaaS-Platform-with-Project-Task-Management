import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { ProjectsAPI } from '../api';
import { Link } from 'react-router-dom';

export default function Projects() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const isSuperAdmin = user?.role === 'super_admin';

  const load = async () => {
    try {
      const query = { search, status };
      const r = isSuperAdmin ? await ProjectsAPI.listAll(query) : await ProjectsAPI.list(query);
      setItems(r.data?.data?.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setItems([]);
    }
  };
  useEffect(() => { 
    if (user) load(); 
  }, [user]);

  const create = async () => {
    try {
      if (!form.name) {
        alert('Project name is required');
        return;
      }
      await ProjectsAPI.create(form);
      setShowModal(false); 
      setForm({ name:'', description:'', status:'active' });
      await load();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(error.response?.data?.message || 'Failed to create project');
    }
  };
  const remove = async (id) => { 
    try {
      if (confirm('Delete project?')) { 
        await ProjectsAPI.remove(id); 
        await load(); 
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert(error.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <div>
      <h2>Projects</h2>
      {isSuperAdmin && <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>� System-wide access - You can view, create, and delete projects from any tenant</p>}
      <div className="stack" style={{ margin:'8px 0' }}>
        <input className="input" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>
        <button className="btn" onClick={load}>Filter</button>
        <button className="btn btn-primary right" onClick={()=>setShowModal(true)}>Create New Project</button>
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
              {!isSuperAdmin && <Link to={`/projects/${p.id}`}><button className="btn">View</button></Link>}
              <button className="btn btn-danger" onClick={()=>remove(p.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header"><h3>Create Project</h3><button className="btn" onClick={()=>setShowModal(false)}>✕</button></div>
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
