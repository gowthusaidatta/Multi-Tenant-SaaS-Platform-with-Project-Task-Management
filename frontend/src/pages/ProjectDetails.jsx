import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectsAPI, TasksAPI } from '../api';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' });

  const load = async () => {
    // naive: get list and find project
    const pr = await ProjectsAPI.list({});
    const p = (pr.data.data.projects || []).find(x => x.id === projectId);
    setProject(p);
    const tr = await TasksAPI.list(projectId, filter);
    setTasks(tr.data.data.tasks || []);
  };
  useEffect(() => { load(); }, []);

  const updateProject = async () => {
    await ProjectsAPI.update(projectId, { name: project.name, description: project.description, status: project.status });
    await load();
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
      <div className="card">
        <label>Name</label>
        <input className="input" value={project.name} onChange={e => setProject({ ...project, name: e.target.value })} />
        <label>Status</label>
        <select className="select" value={project.status} onChange={e => setProject({ ...project, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>
        <label>Description</label>
        <textarea className="input" rows={3} value={project.description||''} onChange={e => setProject({ ...project, description: e.target.value })} />
        <div className="stack" style={{ marginTop:8 }}>
          <button className="btn btn-primary" onClick={updateProject}>Save</button>
          <button className="btn" onClick={()=>setShowModal(true)}>Add Task</button>
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
