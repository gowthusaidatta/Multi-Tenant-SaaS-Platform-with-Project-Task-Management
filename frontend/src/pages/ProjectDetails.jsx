import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectsAPI, TasksAPI } from '../api';
import { useAuth } from '../auth';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' });
  const [toast, setToast] = useState('');

  const load = async () => {
    // load project depending on role
    const pr = isSuperAdmin ? await ProjectsAPI.listAll({ limit: 50 }) : await ProjectsAPI.list({});
    const p = (pr.data.data.projects || []).find(x => x.id === projectId);
    setProject(p);
    const tr = await TasksAPI.list(projectId, filter);
    setTasks(tr.data.data.tasks || []);
  };
  useEffect(() => { load(); }, [projectId, isSuperAdmin]);

  const updateProject = async () => {
    try {
      await ProjectsAPI.update(projectId, { name: project.name, description: project.description, status: project.status });
      setEditMode(false);
      setToast('Project updated successfully');
      setTimeout(()=>setToast(''), 2500);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update project');
    }
  };
  const addTask = async () => {
    await TasksAPI.create(projectId, { title: form.title, description: form.description, priority: form.priority, assignedTo: form.assignedTo || null });
    setShowModal(false); setForm({ title:'', description:'', priority:'medium', assignedTo:'' });
    await load();
  };
  const updateTaskStatus = async (id, status) => { await TasksAPI.updateStatus(id, status); await load(); };
  const updateTask = async (t) => { await TasksAPI.update(t.id, t); await load(); };
  const removeTask = async (id) => { if (confirm('Delete task?')) { await TasksAPI.remove(id); await load(); } };

  if (!project) return <div className="card">Loading…</div>;

  return (
    <div>
      <h2>Project Details</h2>
      {toast && (<div className="card" style={{ background:'#e7f7ed', border:'1px solid #35a07d' }}>✅ {toast}</div>)}
      <div className="card">
        {!editMode ? (
          // View Mode
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>Project Name</div>
              <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{project.name}</div>
              <span className="badge" style={{ marginRight: 8 }}>{project.status}</span>
              <span className="badge" style={{ marginRight: 8 }}>By: {project.createdBy.fullName}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4 }}>Description</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{project.description || 'No description'}</div>
            </div>
            <div className="stack">
              <button className="btn btn-primary" onClick={()=>setEditMode(true)}>Edit Project</button>
              <button className="btn" onClick={()=>window.history.back()}>Close</button>
            </div>
          </>
        ) : (
          // Edit Mode
          <>
            <label>Project Name</label>
            <input className="input" value={project.name} onChange={e => setProject({ ...project, name: e.target.value })} />
            <label>Status</label>
            <select className="select" value={project.status} onChange={e => setProject({ ...project, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
            <label>Description</label>
            <textarea className="input" rows={4} value={project.description||''} onChange={e => setProject({ ...project, description: e.target.value })} />
            <div className="stack" style={{ marginTop:12 }}>
              <button className="btn btn-primary" onClick={updateProject}>Save Changes</button>
              <button className="btn" onClick={()=>setEditMode(false)}>Cancel</button>
            </div>
          </>
        )}
      </div>
      <div className="spacer"></div>
      <div className="grid-4">
        <div className="card">
          <div className="card-title">Total Tasks</div>
          <div className="card-value">{tasks.length}</div>
        </div>
        <div className="card">
          <div className="card-title">Completed</div>
          <div className="card-value" style={{ color: 'var(--success)' }}>{tasks.filter(t => t.status === 'completed').length}</div>
        </div>
        <div className="card">
          <div className="card-title">In Progress</div>
          <div className="card-value" style={{ color: 'var(--warning)' }}>{tasks.filter(t => t.status === 'in_progress').length}</div>
        </div>
        <div className="card">
          <div className="card-title">Todo</div>
          <div className="card-value">{tasks.filter(t => t.status === 'todo').length}</div>
        </div>
      </div>
      <div className="spacer"></div>
      <h3>Tasks</h3>
      <div className="stack">
        <select className="select" value={filter.status} onChange={e=>setFilter({...filter, status:e.target.value})}>
          <option value="">All Status</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        <select className="select" value={filter.priority} onChange={e=>setFilter({...filter, priority:e.target.value})}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input className="input" placeholder="Search title" value={filter.search} onChange={e=>setFilter({...filter, search:e.target.value})} />
        <button className="btn" onClick={load}>Apply</button>
        <button className="btn btn-primary right" onClick={()=>setShowModal(true)}>Add Task</button>
      </div>
      <ul className="item-list">
        {tasks.map(t => (
          <li key={t.id}>
            <strong>{t.title}</strong>
            <span className="badge">{t.status}</span>
            <span className="badge">{t.priority}</span>
            {t.assignedTo && <span className="text-muted">• {t.assignedTo.fullName}</span>}
            <span className="right stack">
              <select className="select" value={t.status} onChange={e=>updateTaskStatus(t.id, e.target.value)}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button className="btn btn-danger" onClick={()=>removeTask(t.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header"><h3>Add Task</h3><button className="btn" onClick={()=>setShowModal(false)}>✕</button></div>
            <label>Title</label>
            <input className="input" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
            <label>Description</label>
            <textarea className="input" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <label>Priority</label>
            <select className="select" value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <label>Assign To (User ID)</label>
            <input className="input" value={form.assignedTo} onChange={e=>setForm({...form, assignedTo:e.target.value})} />
            <div className="modal-actions">
              <button className="btn" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addTask}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
