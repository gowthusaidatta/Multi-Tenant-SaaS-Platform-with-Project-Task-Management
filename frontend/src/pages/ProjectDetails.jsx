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

  if (!project) return <div style={{ padding:16 }}>Loading...</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Project Details</h2>
      <div>
        <input value={project.name} onChange={e => setProject({ ...project, name: e.target.value })} />
        <select value={project.status} onChange={e => setProject({ ...project, status: e.target.value })}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>
        <br />
        <textarea rows={3} value={project.description||''} onChange={e => setProject({ ...project, description: e.target.value })} />
        <div style={{ marginTop:8 }}>
          <button onClick={updateProject}>Save</button>
          <button onClick={()=>setShowModal(true)} style={{ marginLeft:8 }}>Add Task</button>
        </div>
      </div>
      <div style={{ marginTop:16 }}>
        <h3>Tasks</h3>
        <div style={{ display:'flex', gap:8 }}>
          <select value={filter.status} onChange={e=>setFilter({...filter, status:e.target.value})}>
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select value={filter.priority} onChange={e=>setFilter({...filter, priority:e.target.value})}>
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input placeholder="Search title" value={filter.search} onChange={e=>setFilter({...filter, search:e.target.value})} />
          <button onClick={load}>Apply</button>
        </div>
        <ul>
          {tasks.map(t => (
            <li key={t.id} style={{ display:'flex', alignItems:'center', gap:8, borderBottom:'1px solid #eee', padding:8 }}>
              <strong>{t.title}</strong>
              <span>• {t.status}</span>
              <span>• {t.priority}</span>
              {t.assignedTo && <span>• {t.assignedTo.fullName}</span>}
              <span style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                <select value={t.status} onChange={e=>updateTaskStatus(t.id, e.target.value)}>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={()=>removeTask(t.id)}>Delete</button>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)' }}>
          <div style={{ background:'#fff', width:420, margin:'10% auto', padding:16, borderRadius:8 }}>
            <h3>Add Task</h3>
            <label>Title</label>
            <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
            <label>Description</label>
            <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <label>Priority</label>
            <select value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <label>Assign To (User ID)</label>
            <input value={form.assignedTo} onChange={e=>setForm({...form, assignedTo:e.target.value})} />
            <div style={{ marginTop: 12, display:'flex', gap:8 }}>
              <button onClick={()=>setShowModal(false)}>Cancel</button>
              <button onClick={addTask}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
