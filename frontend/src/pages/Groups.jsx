import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { TenantsAPI, UsersAPI } from '../api';
import MainLayout from '../components/MainLayout';
import {
  PageHeader,
  Button,
  Toast,
  EmptyState,
} from '../components/UIComponents';
import { Building2, Users as UsersIcon, Search, Filter, Trash2 } from 'lucide-react';

export default function Groups() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [tenantUsers, setTenantUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const isSuperAdmin = user?.role === 'super_admin';
  const isTenantAdmin = user?.role === 'tenant_admin';

  const loadTenants = async () => {
    try {
      if (isSuperAdmin) {
        const r = await TenantsAPI.list({ limit: 100 });
        const list = r.data?.data?.tenants || [];
        setTenants(list);
        if (list.length && !selectedTenantId) {
          setSelectedTenantId(list[0].id);
        }
      } else if (isTenantAdmin && user?.tenant?.id) {
        // Tenant admin: only own tenant
        const t = user.tenant;
        setTenants([{
          id: t.id,
          name: t.name,
          subdomain: t.subdomain,
          subscriptionPlan: t.subscriptionPlan,
          status: 'active',
          totalUsers: undefined,
        }]);
        setSelectedTenantId(t.id);
      }
    } catch (e) {
      console.error('Failed to load tenants:', e);
    }
  };

  const loadTenantUsers = async () => {
    if (!selectedTenantId) return;
    setLoading(true);
    try {
      const query = { search, page, limit: 20 };
      const r = await UsersAPI.list(selectedTenantId, query);
      setTenantUsers(r.data?.data?.users || []);
      const pg = r.data?.data?.pagination;
      setTotalPages(pg?.totalPages || 1);
    } catch (e) {
      console.error('Failed to load tenant users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadTenants();
  }, [user, isSuperAdmin, isTenantAdmin]);

  useEffect(() => {
    loadTenantUsers();
  }, [selectedTenantId, search, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const removeUser = async (id) => {
    try {
      if (confirm('Delete user?')) {
        await UsersAPI.remove(id);
        setToast('User deleted successfully');
        setTimeout(() => setToast(''), 2500);
        await loadTenantUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!isSuperAdmin && !isTenantAdmin) {
    return (
      <MainLayout>
        <div className="card p-6">Access Denied</div>
      </MainLayout>
    );
  }

  const currentTenant = tenants.find((t) => t.id === selectedTenantId);

  return (
    <MainLayout>
      <PageHeader
        title="Groups (Domains)"
        subtitle={
          isSuperAdmin
            ? 'System-wide domain management — view and manage all domains and members'
            : `Your domain: ${user?.tenant?.name || ''} (${user?.tenant?.subdomain || ''})`
        }
      />

      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      {/* Filters bar */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Domain</label>
              <select
                className="select"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
              >
                <option value="">Select a domain</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subdomain})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Search Members</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="input pl-10"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Domain summary */}
      {selectedTenantId && currentTenant && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Domain</p>
              <p className="text-lg font-semibold text-gray-900">{currentTenant.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <div className="text-xs text-gray-500">Subdomain</div>
              <div className="text-sm font-medium text-gray-900">{currentTenant.subdomain}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Plan</div>
              <div className="text-sm font-medium text-gray-900">{currentTenant.subscriptionPlan}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <span className="badge">{currentTenant.status}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500">Members</div>
              <div className="text-sm font-medium text-gray-900">{currentTenant.totalUsers || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center">
              <UsersIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Domain Members</p>
              <p className="text-lg font-semibold text-gray-900">{tenantUsers.length} users</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading members...</div>
        ) : tenantUsers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={UsersIcon}
              title="No members found"
              description="Try adjusting your search or select a different domain."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="sticky top-0 bg-white shadow-sm">
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenantUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge">{u.role}</span>
                    </td>
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        {isSuperAdmin || (isTenantAdmin && u.id !== user.id) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => removeUser(u.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
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
    </MainLayout>
  );
}
