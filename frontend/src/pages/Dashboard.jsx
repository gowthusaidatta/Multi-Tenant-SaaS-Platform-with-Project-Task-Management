import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { ProjectsAPI, TasksAPI, UsersAPI, TenantsAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { KPICard, PageHeader, Card, EmptyState, StatusBadge, Button, Modal, Toast } from '../components/UIComponents';
import { FolderKanban, CheckSquare, CheckCircle2, Clock, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <MainLayout>
      <PageHeader
        title={`Welcome back, ${user?.full_name || 'User'}!`}
        subtitle="Here's what's happening with your projects today"
        actions={
          isSuperAdmin && (
            <Button variant="primary" icon={Plus} onClick={() => setShowTenantModal(true)}>
              Create Tenant
            </Button>
          )
        }
      />

      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      {/* Upgrade Banner */}
      {user?.role === 'tenant_admin' && user?.subscription_plan === 'free' && (
        <Card className="bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200 mb-6">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Upgrade to Pro
              </h3>
              <p className="text-sm text-gray-600">
                Unlock unlimited projects, advanced analytics, and priority support
              </p>
            </div>
            <Button variant="primary" icon={TrendingUp} onClick={() => navigate('/subscription')}>
              Upgrade Now
            </Button>
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {isSuperAdmin ? (
          <>
            <KPICard title="Total Projects" value={stats.totalProjects} icon={FolderKanban} color="primary" />
            <KPICard title="Total Tasks" value={stats.totalTasks} icon={CheckSquare} color="success" />
            <KPICard title="Completed Tasks" value={stats.completedTasks} icon={CheckCircle2} color="success" />
            <KPICard title="Total Users" value={stats.totalUsers} icon={Users} color="warning" />
          </>
        ) : (
          <>
            <KPICard title="Total Projects" value={stats.totalProjects} icon={FolderKanban} color="primary" />
            <KPICard title="Total Tasks" value={stats.totalTasks} icon={CheckSquare} color="success" />
            <KPICard title="Completed" value={stats.completedTasks} icon={CheckCircle2} color="success" />
            <KPICard title="Pending" value={stats.pendingTasks} icon={Clock} color="warning" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
              <p className="text-sm text-gray-500 mt-0.5">Your active projects</p>
            </div>
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/projects')}>
              View All
            </Button>
          </div>

          <div className="p-4 lg:p-6">
            {recent.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Create your first project to get started"
                action={
                  <Button variant="primary" icon={Plus} onClick={() => navigate('/projects')}>
                    Create Project
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {recent.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-soft cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{p.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {p.description || 'No description'}
                        </p>
                        {isSuperAdmin && p.tenantName && (
                          <span className="text-xs text-gray-400 mt-1 block">({p.tenantName})</span>
                        )}
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* My Tasks */}
        <Card>
          <div className="p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isSuperAdmin ? 'System-wide tasks' : 'Tasks assigned to you'}
              </p>
            </div>
            <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate('/tasks')}>
              View All
            </Button>
          </div>

          <div className="p-4 lg:p-6">
            {myTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks yet"
                description="Tasks will appear here once created"
                action={
                  <Button variant="primary" icon={Plus} onClick={() => navigate('/tasks')}>
                    View Tasks
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {myTasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {task.projectName || 'Unknown Project'}
                        </p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tenant Creation Modal */}
      <Modal
        isOpen={showTenantModal}
        onClose={() => setShowTenantModal(false)}
        title="Create New Tenant"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              className="input"
              value={tenantForm.name}
              onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
              placeholder="Tenant name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
            <input
              className="input"
              value={tenantForm.subdomain}
              onChange={(e) => setTenantForm({ ...tenantForm, subdomain: e.target.value })}
              placeholder="subdomain"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select
              className="select"
              value={tenantForm.subscriptionPlan}
              onChange={(e) => setTenantForm({ ...tenantForm, subscriptionPlan: e.target.value })}
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="select"
              value={tenantForm.status}
              onChange={(e) => setTenantForm({ ...tenantForm, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowTenantModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                try {
                  if (!tenantForm.name || !tenantForm.subdomain) {
                    alert('Name and subdomain required');
                    return;
                  }
                  await TenantsAPI.create(tenantForm);
                  setShowTenantModal(false);
                  setToast('Tenant created successfully');
                  setTimeout(() => setToast(''), 3000);
                } catch (e) {
                  alert(e.response?.data?.message || 'Failed to create tenant');
                }
              }}
            >
              Create Tenant
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
