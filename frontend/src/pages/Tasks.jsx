import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { TasksAPI, ProjectsAPI } from '../api';
import MainLayout from '../components/MainLayout';
import {
  PageHeader,
  StatusBadge,
  PriorityBadge,
  Button,
  EmptyState,
  Toast,
  LoadingSkeleton,
} from '../components/UIComponents';
import {
  ListChecks,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users as UsersIcon,
  MoreVertical,
  LayoutGrid,
  Rows,
  Plus,
  Calendar,
  ArrowLeft,
  Eye,
  Edit,
  Save,
  X,
} from 'lucide-react';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const priorityOptions = [
  { value: '', label: 'All Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function Tasks() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState({ status: '', priority: '', project: '', search: '', assignee: '', date: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('kanban');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', status: '', priority: '' });
  const isSuperAdmin = user?.role === 'super_admin';
  const isTenantAdmin = user?.role === 'tenant_admin';

  const loadTasks = async () => {
    setLoading(true);
    try {
      const query = { search: filter.search, status: filter.status, priority: filter.priority, projectId: filter.project, page, limit: 20 };
      const r = isSuperAdmin
        ? await TasksAPI.listAll(query)
        : isTenantAdmin
          ? await TasksAPI.listForTenant(query)
          : await TasksAPI.listMine(query);
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
    } finally {
      setLoading(false);
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
  }, [user, isSuperAdmin, page]);

  useEffect(() => {
    setPage(1);
    loadTasks();
  }, [filter.status, filter.priority, filter.project, filter.search]);

  const updateStatus = async (id, status) => {
    try {
      await TasksAPI.updateStatus(id, status);
      setToast('Task status updated');
      setTimeout(() => setToast(''), 2500);
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
        setTimeout(() => setToast(''), 2500);
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
        await loadTasks();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const resetFilters = () => {
    setFilter({ status: '', priority: '', project: '', search: '', assignee: '', date: '' });
  };

  const viewTaskDetail = (task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'low',
    });
    setIsEditing(false);
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
    setIsEditing(false);
  };

  const startEdit = () => {
    // Only allow edit if permitted by role or assignment
    const canEdit = isSuperAdmin || isTenantAdmin || (selectedTask?.assignedTo?.id === user?.id);
    if (!canEdit) {
      setToast('You can only edit tasks assigned to you');
      setTimeout(() => setToast(''), 2500);
      return;
    }
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (selectedTask) {
      setEditForm({
        title: selectedTask.title || '',
        description: selectedTask.description || '',
        status: selectedTask.status || 'todo',
        priority: selectedTask.priority || 'low',
      });
    }
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (!selectedTask) return;
    try {
      await TasksAPI.update(selectedTask.id, editForm);
      setToast('Task updated successfully');
      setTimeout(() => setToast(''), 2500);
      setIsEditing(false);
      await loadTasks();
      // Update selectedTask with new data
      const updatedTask = { ...selectedTask, ...editForm };
      setSelectedTask(updatedTask);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update task');
    }
  };

  const grouped = useMemo(() => {
    return STATUS_COLUMNS.map((col) => ({
      ...col,
      tasks: items.filter((t) => (t.status || 'todo') === col.key),
    }));
  }, [items]);

  const toggleSelectAll = (checked) => {
    if (checked) setSelectedIds(items.map((t) => t.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkComplete = async () => {
    for (const id of selectedIds) {
      await updateStatus(id, 'completed');
    }
    setSelectedIds([]);
  };

  const showCreateToast = () => {
    setToast('Create Task is coming soon. Use Project Details to add tasks.');
    setTimeout(() => setToast(''), 2500);
  };

  const renderTaskCard = (task) => {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    return (
      <div
        key={task.id}
        className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex flex-col gap-4 border border-gray-200 hover:border-primary-300 cursor-pointer transform hover:-translate-y-1"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-primary-700 transition-colors">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                viewTaskDetail(task);
              }}
              className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 text-xs font-semibold border border-primary-200">
            {task.projectName || 'Unknown Project'}
          </span>
          {isSuperAdmin && (
            <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs font-semibold border border-gray-200">
              {task.tenantName || 'Domain'}
            </span>
          )}
          <PriorityBadge priority={task.priority || 'low'} />
          <StatusBadge status={task.status} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {task.assignedTo ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {task.assignedTo.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-800 line-clamp-1">
                  {task.assignedTo.fullName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5" />
                </div>
                <span className="text-sm">Unassigned</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{dueDate}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      {selectedTask ? (
        // Task Detail View
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              icon={ArrowLeft} 
              onClick={closeTaskDetail}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Tasks
            </Button>
          </div>

          <div className="card p-8 shadow-soft-xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center">
                    <ListChecks className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
                    <p className="text-sm text-gray-500">ID: {selectedTask.id}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="primary" icon={Save} onClick={saveEdit}>
                      Save Changes
                    </Button>
                    <Button variant="ghost" icon={X} onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    {(isSuperAdmin || isTenantAdmin || (selectedTask?.assignedTo?.id === user?.id)) && (
                      <Button variant="secondary" icon={Edit} onClick={startEdit}>
                        Edit Task
                      </Button>
                    )}
                    {(isSuperAdmin || isTenantAdmin) && (
                      <Button
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => {
                          removeTask(selectedTask.id);
                          closeTaskDetail();
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                {isEditing ? (
                  <input
                    className="input text-lg"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Task title"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{selectedTask.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    className="input"
                    rows={5}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Task description"
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedTask.description || 'No description provided'}
                  </p>
                )}
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  {isEditing ? (
                    <select
                      className="select"
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      disabled={!(isSuperAdmin || isTenantAdmin || (selectedTask?.assignedTo?.id === user?.id))}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  ) : (
                    <div>
                      <StatusBadge status={selectedTask.status} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  {isEditing ? (
                    <select
                      className="select"
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      disabled={!(isSuperAdmin || isTenantAdmin || (selectedTask?.assignedTo?.id === user?.id))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <div>
                      <PriorityBadge priority={selectedTask.priority || 'low'} />
                    </div>
                  )}
                </div>
              </div>

              {/* Project and Tenant Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 font-medium">{selectedTask.projectName || 'Unknown Project'}</p>
                  </div>
                </div>

                {isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 font-medium">{selectedTask.tenantName || 'Domain'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignee and Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  {selectedTask.assignedTo ? (
                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center font-semibold">
                        {selectedTask.assignedTo.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedTask.assignedTo.fullName}</p>
                        <p className="text-sm text-gray-500">{selectedTask.assignedTo.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-500 flex items-center gap-2">
                      <UsersIcon className="w-5 h-5" />
                      <span>Unassigned</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-900">
                      {selectedTask.dueDate
                        ? new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'No due date'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Created and Updated */}
              <div className="pt-6 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Created:</span>{' '}
                    {selectedTask.createdAt
                      ? new Date(selectedTask.createdAt).toLocaleString()
                      : 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span>{' '}
                    {selectedTask.updatedAt
                      ? new Date(selectedTask.updatedAt).toLocaleString()
                      : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Task List View
        <>
          <PageHeader
            title="Tasks"
            subtitle={
              isSuperAdmin
                ? 'System-wide task view — filter across projects and tenants'
                : 'Track every task across your workspace'
            }
            actions={
              <div className="flex items-center gap-3">
                <Button variant="secondary" icon={Filter} onClick={resetFilters}>
                  Reset Filters
                </Button>
                <Button variant="primary" icon={Plus} onClick={showCreateToast}>
                  Create Task
                </Button>
              </div>
            }
          />

      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      <div className="sticky top-4 z-10">
        <div className="card p-4 shadow-soft-lg border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="input pl-10"
                placeholder="Search tasks"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>

            <select
              className="select"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              className="select"
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
            >
              {priorityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              className="select"
              value={filter.project}
              onChange={(e) => setFilter({ ...filter, project: e.target.value })}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              className="select"
              value={filter.assignee}
              onChange={(e) => setFilter({ ...filter, assignee: e.target.value })}
            >
              <option value="">Assignee (UI only)</option>
              <option value="me">Me</option>
            </select>

            <input
              type="date"
              className="input"
              value={filter.date}
              onChange={(e) => setFilter({ ...filter, date: e.target.value })}
            />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-gray-500">Showing {items.length} tasks</div>
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                icon={Rows}
                onClick={() => setView('list')}
              >
                List
              </Button>
              <Button
                variant={view === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                icon={LayoutGrid}
                onClick={() => setView('kanban')}
              >
                Kanban
              </Button>
            </div>
          </div>
        </div>
      </div>

      {view === 'list' && selectedIds.length > 0 && (
        <div className="card mt-4 p-4 flex items-center justify-between bg-primary-50 border border-primary-100">
          <div className="text-sm text-primary-800 font-medium">{selectedIds.length} selected</div>
          <div className="flex items-center gap-2">
            <Button variant="success" size="sm" onClick={handleBulkComplete}>
              Mark Completed
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4">
                <LoadingSkeleton lines={3} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card p-8">
            <EmptyState
              icon={ListChecks}
              title="No tasks yet"
              description="Create your first task to get started with your workspace."
              action={
                <Button variant="primary" icon={Plus} onClick={showCreateToast}>
                  Create your first task
                </Button>
              }
            />
          </div>
        ) : view === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {grouped.map((col) => (
              <div key={col.key} className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border-2 border-gray-200 p-4 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      col.key === 'todo' ? 'bg-gray-400' :
                      col.key === 'in_progress' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-base font-bold text-gray-800">{col.label}</span>
                    <span className="px-2.5 py-1 rounded-full bg-white border-2 border-gray-300 text-xs font-bold text-gray-700 shadow-sm">
                      {col.tasks.length}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Plus} 
                    onClick={showCreateToast}
                    className="hover:bg-white"
                  >
                    Add
                  </Button>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-400px)]">
                  {col.tasks.map((task) => (
                    <div key={task.id} onClick={() => viewTaskDetail(task)}>
                      {renderTaskCard(task)}
                    </div>
                  ))}
                  {col.tasks.length === 0 && (
                    <div className="text-sm text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <ListChecks className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="font-medium">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tasks</p>
                  <p className="text-lg font-semibold text-gray-900">{items.length} items</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selectedIds.length === items.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                <Button variant="ghost" icon={CheckCircle2} onClick={() => loadTasks()} className="text-primary-700">
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead className="sticky top-0 bg-white shadow-sm">
                  <tr>
                    <th className="w-12">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedIds.length === items.length}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="min-w-[220px]">Task</th>
                    <th>Project / Domain</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Due</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => {
                    const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date';
                    return (
                      <tr 
                        key={t.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => viewTaskDetail(t)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedIds.includes(t.id)}
                            onChange={() => toggleSelect(t.id)}
                          />
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-900 line-clamp-1">{t.title}</span>
                            {t.description && <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                              {t.projectName || 'Unknown'}
                            </span>
                            {isSuperAdmin && (
                              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                {t.tenantName || 'Domain'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <PriorityBadge priority={t.priority || 'low'} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            className="select text-sm min-w-[120px]"
                            value={t.status}
                            onChange={(e) => updateStatus(t.id, e.target.value)}
                            disabled={!(isSuperAdmin || isTenantAdmin || (t.assignedTo?.id === user?.id))}
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td>
                          {t.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center font-semibold text-sm">
                                {t.assignedTo.fullName?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <span className="text-gray-800 text-sm">{t.assignedTo.fullName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm flex items-center gap-1">
                              <UsersIcon className="w-4 h-4" /> Unassigned
                            </span>
                          )}
                        </td>
                        <td className="text-sm text-gray-700">{dueDate}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              icon={Eye}
                              onClick={() => viewTaskDetail(t)}
                              className="text-primary-600"
                            >
                              View
                            </Button>
                            {(isSuperAdmin || isTenantAdmin) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => removeTask(t.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </Button>
        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </Button>
      </div>
        </>
      )}
    </MainLayout>
  );
}
