import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { ProjectsAPI, TasksAPI, UsersAPI, TenantsAPI } from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalProjects: 0, totalTasks: 0, completedTasks: 0, pendingTasks: 0, totalUsers: 0 });
  const [recent, setRecent] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const isSuperAdmin = user?.role === 'super_admin';
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantForm, setTenantForm] = useState({ name: '', subdomain: '', subscriptionPlan: 'free', status: 'active' });
  const [toast, setToast] = useState('');

  useEffect(() => {
    const load = async () => {
      if (isSuperAdmin) {
        // Super admin sees system-wide stats
        try {
          const pAll = await ProjectsAPI.listAll({ limit: 5 });
          const projects = pAll.data.data.projects || [];
          setRecent(projects);
          const totalProjects = pAll.data.data.total || 0;
          
          const tAll = await TasksAPI.listAll({});
          const totalTasks = tAll.data.data.total || 0;
          const completedTasks = (tAll.data.data.tasks || []).filter(x => x.status === 'completed').length;
          
          const uAll = await UsersAPI.listAll({});
          const totalUsers = uAll.data.data.total || 0;
          
          setStats({ totalProjects, totalTasks, completedTasks, pendingTasks: totalTasks - completedTasks, totalUsers });
          setMyTasks([]);
        } catch (e) {
          console.error('Super admin dashboard load failed:', e);
        }
      } else {
        // Regular tenant user sees their tenant stats
        const p = await ProjectsAPI.list({ limit: 5 });
        const projects = p.data.data.projects || [];
        setRecent(projects);
        const totalProjects = p.data.data.total || projects.length;
        // naive task counts by fetching each project's tasks (ok for demo)
        let totalTasks = 0, completedTasks = 0;
        const my = [];
        for (const proj of projects) {
          const t = await TasksAPI.list(proj.id, {});
          const tasks = t.data.data.tasks || [];
          totalTasks += tasks.length;
          completedTasks += tasks.filter(x => x.status === 'completed').length;
          my.push(...tasks.filter(x => x.assignedTo && x.assignedTo.id === user.id));
        }
        setStats({ totalProjects, totalTasks, completedTasks, pendingTasks: totalTasks - completedTasks, totalUsers: 0 });
        setMyTasks(my);
      }
    };
    load();
  }, [user, isSuperAdmin]);

  return (
    <div>
      <h2>Dashboard</h2>
      {isSuperAdmin && <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>📊 System-wide overview - You have view access to all tenants, users, projects, and tasks</p>}
      {toast && (<div className="card" style={{ background:'#e7f7ed', border:'1px solid #35a07d' }}>✅ {toast}</div>)}
      {isSuperAdmin && (
        <div className="stack" style={{ marginBottom: 12 }}>
          <button className="btn btn-primary" onClick={()=>setShowTenantModal(true)}>Create Tenant</button>
        </div>
      )}
      <div className="grid-4">
        {isSuperAdmin ? (
          <>
            <Card title="Total Projects" value={stats.totalProjects} />
            <Card title="Total Tasks" value={stats.totalTasks} />
            <Card title="Completed Tasks" value={stats.completedTasks} />
            <Card title="Total Users" value={stats.totalUsers} />
          </>
        ) : (
          <>
            <Card title="Total Projects" value={stats.totalProjects} />
            <Card title="Total Tasks" value={stats.totalTasks} />
            <Card title="Completed" value={stats.completedTasks} />
            <Card title="Pending" value={stats.pendingTasks} />
          </>
        )}
      </div>
      <div className="spacer"></div>
      <h3>{isSuperAdmin ? 'Recent Projects (All Tenants)' : 'Recent Projects'}</h3>
      <ul className="item-list">
        {recent.length > 0 ? (
          recent.map(p => (
            <li key={p.id}>
              <div>
                <strong>{p.name}</strong> <span className="badge">{p.status}</span>
                {isSuperAdmin && <span className="text-muted" style={{ marginLeft: '8px' }}>({p.tenantName})</span>}
              </div>
              <small className="text-muted">Tasks: {p.taskCount}</small>
            </li>
          ))
        ) : (
          <li><em>No projects</em></li>
        )}
      </ul>
      {!isSuperAdmin && (
        <>
          <div className="spacer"></div>
          <h3>My Tasks</h3>
          <ul className="item-list">
            {myTasks.length > 0 ? (
              myTasks.map(t => <li key={t.id}><strong>{t.title}</strong> <span className="badge">{t.priority}</span> <span className="badge">{t.status}</span></li>)
            ) : (
              <li><em>No tasks assigned to you</em></li>
            )}
          </ul>
        </>
      )}
      {showTenantModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header"><h3>Create Tenant</h3><button className="btn" onClick={()=>setShowTenantModal(false)}>✕</button></div>
            <label>Name</label>
            <input className="input" value={tenantForm.name} onChange={e=>setTenantForm({ ...tenantForm, name:e.target.value })} />
            <label>Subdomain</label>
            <input className="input" value={tenantForm.subdomain} onChange={e=>setTenantForm({ ...tenantForm, subdomain:e.target.value })} />
            <label>Plan</label>
            <select className="select" value={tenantForm.subscriptionPlan} onChange={e=>setTenantForm({ ...tenantForm, subscriptionPlan:e.target.value })}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <label>Status</label>
            <select className="select" value={tenantForm.status} onChange={e=>setTenantForm({ ...tenantForm, status:e.target.value })}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="modal-actions">
              <button className="btn" onClick={()=>setShowTenantModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={async ()=>{
                try {
                  if (!tenantForm.name || !tenantForm.subdomain) { alert('Name and subdomain required'); return; }
                  await TenantsAPI.create(tenantForm);
                  setShowTenantModal(false);
                  setToast('Tenant created successfully');
                  setTimeout(()=>setToast(''), 2500);
                } catch (e) {
                  alert(e.response?.data?.message || 'Failed to create tenant');
                }
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
    </div>
  );
}
