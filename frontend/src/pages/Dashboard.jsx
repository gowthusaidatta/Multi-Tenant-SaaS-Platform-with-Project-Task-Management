import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { ProjectsAPI, TasksAPI } from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalProjects: 0, totalTasks: 0, completedTasks: 0, pendingTasks: 0 });
  const [recent, setRecent] = useState([]);
  const [myTasks, setMyTasks] = useState([]);

  useEffect(() => {
    const load = async () => {
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
      setStats({ totalProjects, totalTasks, completedTasks, pendingTasks: totalTasks - completedTasks });
      setMyTasks(my);
    };
    load();
  }, [user]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Dashboard</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        <Card title="Total Projects" value={stats.totalProjects} />
        <Card title="Total Tasks" value={stats.totalTasks} />
        <Card title="Completed" value={stats.completedTasks} />
        <Card title="Pending" value={stats.pendingTasks} />
      </div>
      <h3 style={{ marginTop: 24 }}>Recent Projects</h3>
      <ul>
        {recent.map(p => <li key={p.id}>{p.name} • {p.status} • tasks: {p.taskCount}</li>)}
      </ul>
      <h3>My Tasks</h3>
      <ul>
        {myTasks.map(t => <li key={t.id}>{t.title} • {t.priority} • {t.status}</li>)}
      </ul>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ border:'1px solid #eee', padding:16, borderRadius:8 }}>
      <div style={{ color:'#777' }}>{title}</div>
      <div style={{ fontSize:24, fontWeight:600 }}>{value}</div>
    </div>
  );
}
