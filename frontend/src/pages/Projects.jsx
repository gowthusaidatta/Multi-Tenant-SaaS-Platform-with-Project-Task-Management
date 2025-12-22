import React, { useEffect, useState } from 'react';
import { ProjectsAPI } from '../api';
import { Link } from 'react-router-dom';

export default function Projects() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });

  const load = async () => {
    const r = await ProjectsAPI.list({ search, status });
    setItems(r.data.data.projects || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    await ProjectsAPI.create(form);
    setShowModal(false); setForm({ name:'', description:'', status:'active' });
    await load();
  };
  const remove = async (id) => { if (confirm('Delete project?')) { await ProjectsAPI.remove(id); await load(); } };

  return (
    <div style={{ padding: 16 }}>
      <h2>Projects</h2>
      <div style={{ display:'flex', gap:8, margin:'8px 0' }}>
        <input placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)} />
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>
        <button onClick={load}>Filter</button>
        <button style={{ marginLeft: 'auto' }} onClick={()=>setShowModal(true)}>Create New Project</button>
      </div>
      <ul>
        {items.map(p => (
          <li key={p.id} style={{ padding:8, borderBottom:'1px solid #eee', display:'flex' }}>
            <div>
              <div style={{ fontWeight:600 }}>{p.name}</div>
              <div style={{ color:'#777' }}>{p.description}</div>
              <small>Status: {p.status} • Tasks: {p.taskCount} • By: {p.createdBy.fullName}</small>
            </div>
            <span style={{ marginLeft:'auto', display:'flex', gap:6 }}>
              <Link to={`/projects/${p.id}`}><button>View</button></Link>
              <button onClick={()=>remove(p.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)' }}>
          <div style={{ background:'#fff', width:400, margin:'10% auto', padding:16, borderRadius:8 }}>
            <h3>Create Project</h3>
            <label>Name</label>
            <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
            <label>Description</label>
            <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <label>Status</label>
            <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
            <div style={{ marginTop: 12, display:'flex', gap:8 }}>
              <button onClick={()=>setShowModal(false)}>Cancel</button>
              <button onClick={create}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
