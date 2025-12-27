import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { TasksAPI, ProjectsAPI } from '../api';

export default function Tasks() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState({ status: '', priority: '', project: '', search: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const isSuperAdmin = user?.role === 'super_admin';

  const loadTasks = async () => {
    try {
      const query = { ...filter, page, limit: 20 };
      const r = isSuperAdmin ? await TasksAPI.listAll(query) : await TasksAPI.listAllForProject(query);
      setItems(r.data?.data?.tasks || []);
      const pg = r.data?.data?.pagination;
      if (pg) {
        setTotalPages(pg.totalPages || 1);
        if (pg.currentPage && pg.currentPage !== page) setPage(pg.currentPage);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setItems([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      try {
        const pr = isSuperAdmin ? await ProjectsAPI.listAll({ limit: 50 }) : await ProjectsAPI.list({ limit: 50 });
        setProjects(pr.data?.data?.projects || []);
      } catch (e) {
        console.error('Failed to load projects:', e);
      }
      await loadTasks();
    };
    init();
  }, [user, filter, isSuperAdmin, page]);

  useEffect(() => {
    setPage(1);
  }, [filter.status, filter.priority, filter.project, filter.search]);

  const updateStatus = async (id, status) => {
    try {
      await TasksAPI.updateStatus(id, status);
      setToast('Task status updated');
      setTimeout(()=>setToast(''), 2500);
      await loadTasks();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update task');
    }
  };

  const removeTask = async (id) => {
    try {
      if (confirm('Delete task?')) {
        await TasksAPI.remove(id);
        setToast('Task deleted successfully');
        setTimeout(()=>setToast(''), 2500);
        await loadTasks();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <div>
      <h2>All Tasks</h2>
      {toast && (<div className="card" style={{ background:'#e7f7ed', border:'1px solid #35a07d' }}>✅ {toast}</div>)}
      {isSuperAdmin && <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>System-wide task view — Filter across all projects and domains</p>}
      
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {showFilters && (
        <div className="stack" style={{ margin:'8px 0' }}>
          <input className="input" placeholder="Search" value={filter.search} onChange={e=>setFilter({...filter, search:e.target.value})} />
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
          {projects.length > 0 && (
            <select className="select" value={filter.project} onChange={e=>setFilter({...filter, project:e.target.value})}>
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <button className="btn" onClick={loadTasks}>Apply</button>
        </div>
      )}
      
      <div className="stack" style={{ alignItems:'center', gap:8 }}>
        <button className="btn" disabled={page <= 1} onClick={()=>setPage(p => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn" disabled={page >= totalPages} onClick={()=>setPage(p => Math.min(totalPages, p + 1))}>Next</button>
      </div>
      <ul className="item-list">
        {items.map(t => (
          <li key={t.id}>
            <div>
              <div style={{ fontWeight:600 }}>{t.title} <span className="badge">{t.status}</span> <span className="badge">{t.priority}</span></div>
              <div className="text-muted">{t.description}</div>
              <small className="text-muted">Project: {t.projectName || 'Unknown'} {isSuperAdmin && `• Domain: ${t.tenantName}`} {t.assignedTo && `• Assigned: ${t.assignedTo.fullName}`}</small>
            </div>
            <span className="right stack">
              <select className="select" value={t.status} onChange={e=>updateStatus(t.id, e.target.value)} style={{ minWidth: 100 }}>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button className="btn btn-danger" onClick={()=>removeTask(t.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="text-muted" style={{ padding: 16 }}>No tasks found</p>}
    </div>
  );
}
