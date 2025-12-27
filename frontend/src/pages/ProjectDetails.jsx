import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectsAPI, TasksAPI } from '../api';
import { useAuth } from '../auth';
import MainLayout from '../components/MainLayout';
import { PageHeader, StatusBadge, PriorityBadge, Button, Modal, EmptyState, KPICard, Toast } from '../components/UIComponents';
import { ArrowLeft, Edit2, Save, X, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' });
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const pr = isSuperAdmin ? await ProjectsAPI.listAll({ limit: 50 }) : await ProjectsAPI.list({});
      const p = (pr.data.data.projects || []).find((x) => x.id === projectId);
      setProject(p);
      const tr = await TasksAPI.list(projectId, {});
      setTasks(tr.data.data.tasks || []);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId, isSuperAdmin]);

  const updateProject = async () => {
    try {
      await ProjectsAPI.update(projectId, {
        name: project.name,
        description: project.description,
        status: project.status,
      });
      setEditMode(false);
      setToast('Project updated successfully');
      setTimeout(() => setToast(''), 3000);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update project');
    }
  };

  const addTask = async () => {
    try {
      await TasksAPI.create(projectId, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        assignedTo: form.assignedTo || null,
      });
      setShowModal(false);
      setForm({ title: '', description: '', priority: 'medium', assignedTo: '' });
      setToast('Task created successfully');
      setTimeout(() => setToast(''), 3000);
      await load();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create task');
    }
  };

  const updateTaskStatus = async (id, status) => {
    try {
      await TasksAPI.updateStatus(id, status);
      await load();
    } catch (error) {
      alert('Failed to update task status');
    }
  };

  const removeTask = async (id) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await TasksAPI.remove(id);
        setToast('Task deleted successfully');
        setTimeout(() => setToast(''), 3000);
        await load();
      } catch (error) {
        alert('Failed to delete task');
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <EmptyState
          icon={AlertCircle}
          title="Project not found"
          description="The project you're looking for doesn't exist or you don't have access to it"
          action={
            <Button variant="primary" onClick={() => navigate('/projects')}>
              Back to Projects
            </Button>
          }
        />
      </MainLayout>
    );
  }

  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const KanbanColumn = ({ title, tasks, status, icon: Icon, color }) => (
    <div className="flex-1 min-w-[300px]">
      <div className={`bg-${color}-50 rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 text-${color}-600`} />
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span className={`badge badge-${color === 'primary' ? 'primary' : color === 'yellow' ? 'warning' : 'success'}`}>
              {tasks.length}
            </span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No tasks in {title.toLowerCase()}
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="card p-4 hover:shadow-soft-lg transition-all cursor-pointer"
              draggable
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => removeTask(task.id)}
                  className="text-red-600 hover:bg-red-50 -mt-2 -mr-2"
                />
              </div>
              {task.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center justify-between">
                <PriorityBadge priority={task.priority} />
                {task.assignedTo && (
                  <span className="text-xs text-gray-500">{task.assignedTo.fullName}</span>
                )}
              </div>
              <div className="mt-3">
                <select
                  className="select text-xs py-1"
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <PageHeader
        title={
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/projects')}>
            Back
          </Button>
        }
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
            Add Task
          </Button>
        }
      />

      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      {/* Project Header Card */}
      <div className="card p-6 mb-6">
        {!editMode ? (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
                <p className="text-gray-600 mb-3">{project.description || 'No description'}</p>
                <div className="flex items-center gap-3">
                  <StatusBadge status={project.status} />
                  <span className="text-sm text-gray-500">
                    Created by {project.createdBy?.fullName || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={Edit2} onClick={() => setEditMode(true)}>
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                className="input"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="textarea"
                rows="3"
                value={project.description || ''}
                onChange={(e) => setProject({ ...project, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="select"
                value={project.status}
                onChange={(e) => setProject({ ...project, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" icon={Save} onClick={updateProject}>
                Save Changes
              </Button>
              <Button variant="secondary" icon={X} onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Tasks" value={tasks.length} icon={CheckCircle2} color="primary" />
        <KPICard
          title="Completed"
          value={completedTasks.length}
          icon={CheckCircle2}
          color="success"
        />
        <KPICard
          title="In Progress"
          value={inProgressTasks.length}
          icon={Clock}
          color="warning"
        />
        <KPICard title="Todo" value={todoTasks.length} icon={AlertCircle} color="primary" />
      </div>

      {/* Kanban Board */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Board</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          <KanbanColumn
            title="To Do"
            tasks={todoTasks}
            status="todo"
            icon={AlertCircle}
            color="primary"
          />
          <KanbanColumn
            title="In Progress"
            tasks={inProgressTasks}
            status="in_progress"
            icon={Clock}
            color="yellow"
          />
          <KanbanColumn
            title="Completed"
            tasks={completedTasks}
            status="completed"
            icon={CheckCircle2}
            color="green"
          />
        </div>
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Task" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              className="input"
              placeholder="Enter task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="textarea"
              rows="3"
              placeholder="Enter task description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              className="select"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To (User ID)
            </label>
            <input
              className="input"
              placeholder="Optional"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addTask}>
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
