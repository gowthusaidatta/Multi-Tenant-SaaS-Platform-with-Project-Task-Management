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
    <div>
      <h2>Dashboard</h2>
      <div className="grid-4">
        <Card title="Total Projects" value={stats.totalProjects} />
        <Card title="Total Tasks" value={stats.totalTasks} />
        <Card title="Completed" value={stats.completedTasks} />
        <Card title="Pending" value={stats.pendingTasks} />
      </div>
      <div className="spacer"></div>
      <h3>Recent Projects</h3>
      <ul className="item-list">
        {recent.map(p => <li key={p.id}><strong>{p.name}</strong> <span className="badge">{p.status}</span> <span className="text-muted">• tasks: {p.taskCount}</span></li>)}
      </ul>
      <div className="spacer"></div>
      <h3>My Tasks</h3>
      <ul className="item-list">
        {myTasks.map(t => <li key={t.id}><strong>{t.title}</strong> <span className="badge">{t.priority}</span> <span className="badge">{t.status}</span></li>)}
      </ul>
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
