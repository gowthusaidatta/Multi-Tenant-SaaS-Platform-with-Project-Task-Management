import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { ProjectsAPI, TenantsAPI } from '../api';
import { Link } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import { PageHeader, Modal, StatusBadge, Button, EmptyState, Toast } from '../components/UIComponents';
import { FolderKanban, Plus, Grid3x3, List, Eye, Trash2, Search, Filter } from 'lucide-react';

export default function Projects() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'active' });
  const [reload, setReload] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const isSuperAdmin = user?.role === 'super_admin';

  const loadProjects = async () => {
    try {
      const query = { search, status, page, limit: 12 };
      const r = isSuperAdmin ? await ProjectsAPI.listAll(query) : await ProjectsAPI.list(query);
      setItems(r.data?.data?.projects || []);
      const pg = r.data?.data?.pagination;
      if (pg) {
        setTotalPages(pg.totalPages || 1);
        if (pg.currentPage && pg.currentPage !== page) setPage(pg.currentPage);
      } else {
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setItems([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      if (isSuperAdmin) {
        try {
          const tRes = await TenantsAPI.list({ limit: 50 });
          const list = tRes.data?.data?.tenants || [];
          setTenants(list);
          if (list.length && !selectedTenantId) setSelectedTenantId(list[0].id);
        } catch (e) {
          console.error('Failed to load tenants:', e);
        }
      }
      await loadProjects();
    };
    init();
  }, [user, search, status, isSuperAdmin, reload, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const create = async () => {
    try {
      if (!form.name) {
        alert('Project name is required');
        return;
      }
      const payload = { ...form };
      if (isSuperAdmin) {
        if (!selectedTenantId) {
          alert('Please select a tenant');
          return;
        }
        payload.tenantId = selectedTenantId;
      }
      await ProjectsAPI.create(payload);
      setShowModal(false);
      setForm({ name: '', description: '', status: 'active' });
      setReload((r) => r + 1);
      setToast('Project created successfully');
      setTimeout(() => setToast(''), 3000);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert(error.response?.data?.message || 'Failed to create project');
    }
  };

  const remove = async (id) => {
    try {
      if (confirm('Are you sure you want to delete this project?')) {
        await ProjectsAPI.remove(id);
        setReload((r) => r + 1);
        setToast('Project deleted successfully');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert(error.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Projects"
        subtitle={isSuperAdmin ? 'System-wide access - Manage projects across all tenants' : 'Manage your projects'}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
            New Project
          </Button>
        }
      />

      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      {/* Filters and View Toggle */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="select w-full sm:w-auto"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Create your first project to get started"
          action={
            <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
              Create Project
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {items.map((project) => (
            <div key={project.id} className="card card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    {isSuperAdmin && project.tenantName && (
                      <p className="text-xs text-gray-500 truncate">{project.tenantName}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description || 'No description provided'}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <span>{project.taskCount || 0} tasks</span>
                <span>By {project.createdBy?.fullName || 'Unknown'}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/projects/${project.id}`} className="flex-1">
                  <Button variant="ghost" size="sm" icon={Eye} className="w-full">
                    View
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => remove(project.id)}
                  className="text-red-600 hover:bg-red-50"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Table View
        <div className="card overflow-hidden mb-6">
          <table className="table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Tasks</th>
                {isSuperAdmin && <th>Tenant</th>}
                <th>Created By</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((project) => (
                <tr key={project.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900">{project.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-gray-600 line-clamp-1">
                      {project.description || 'No description'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={project.status} />
                  </td>
                  <td>{project.taskCount || 0}</td>
                  {isSuperAdmin && (
                    <td>
                      <span className="text-gray-600">{project.tenantName}</span>
                    </td>
                  )}
                  <td>{project.createdBy?.fullName || 'Unknown'}</td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="ghost" size="sm" icon={Eye}>
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => remove(project.id)}
                        className="text-red-600 hover:bg-red-50"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Project"
        size="md"
      >
        <div className="space-y-4">
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
              <select
                className="select"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subdomain})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              className="input"
              placeholder="Enter project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="textarea"
              rows="3"
              placeholder="Enter project description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="select"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={create}>
              Create Project
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
