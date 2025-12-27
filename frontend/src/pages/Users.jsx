import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { UsersAPI, TenantsAPI } from '../api';
import MainLayout from '../components/MainLayout';
import { PageHeader, Modal, RoleBadge, Button, EmptyState, Toast } from '../components/UIComponents';
import { Users as UsersIcon, Plus, Trash2, Search, UserPlus, Building2 } from 'lucide-react';

export default function Users() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'user', isActive: true });
  const [reload, setReload] = useState(0);
  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [toast, setToast] = useState('');
  const [newDomain, setNewDomain] = useState({ name: '', subdomain: '', subscriptionPlan: 'free', status: 'active' });
  const isSuperAdmin = user?.role === 'super_admin';

  const loadUsers = async () => {
    try {
      const query = { search, role };
      const r = isSuperAdmin ? await UsersAPI.listAll(query) : await UsersAPI.list(user?.tenant?.id, query);
      setItems(r.data?.data?.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setItems([]);
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
      await loadUsers();
    };
    init();
  }, [user, search, role, isSuperAdmin, reload]);

  const add = async () => {
    try {
      if (!form.email || !form.fullName || !form.password) {
        alert('Please fill all fields');
        return;
      }
      if (isSuperAdmin) {
        if (!selectedTenantId) {
          alert('Please select a domain');
          return;
        }
        let targetTenantId = selectedTenantId;
        if (selectedTenantId === '__new__') {
          if (!newDomain.name || !newDomain.subdomain) {
            alert('Domain name and subdomain are required');
            return;
          }
          try {
            const tRes = await TenantsAPI.create(newDomain);
            targetTenantId = tRes.data?.data?.id;
            if (!targetTenantId) throw new Error('Failed to retrieve new domain id');
            setToast('Domain created successfully');
          } catch (e) {
            console.error('Failed to create domain:', e);
            alert(e.response?.data?.message || 'Failed to create domain');
            return;
          }
        }
        await UsersAPI.add(targetTenantId, form);
      } else {
        await UsersAPI.add(user.tenant.id, form);
      }
      setShowModal(false);
      setForm({ email: '', fullName: '', password: '', role: 'user', isActive: true });
      setSelectedTenantId(tenants.length ? tenants[0].id : '');
      setReload((r) => r + 1);
      setToast('User created successfully');
      setTimeout(() => setToast(''), 3000);
    } catch (error) {
      console.error('Failed to add user:', error);
      alert(error.response?.data?.message || 'Failed to add user');
    }
  };

  const remove = async (id) => {
    try {
      if (confirm('Are you sure you want to delete this user?')) {
        await UsersAPI.remove(id);
        setReload((r) => r + 1);
        setToast('User deleted successfully');
        setTimeout(() => setToast(''), 3000);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title={isSuperAdmin ? 'All Users' : 'Team Members'}
        subtitle={
          isSuperAdmin
            ? 'System-wide access — Manage users across all domains'
            : 'Manage your team members and permissions'
        }
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
            Add User
          </Button>
        }
      />

      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="select w-full sm:w-auto"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="tenant_admin">Tenant Admin</option>
            {isSuperAdmin && <option value="super_admin">Super Admin</option>}
          </select>
        </div>
      </div>

      {/* Users Table */}
      {items.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Add your first team member to get started"
          action={
            <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
              Add User
            </Button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  {isSuperAdmin && <th>Domain</th>}
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {u.fullName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">{u.email}</td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    {isSuperAdmin && (
                      <td>
                        <span className="text-sm text-gray-600">{u.tenantName || 'System'}</span>
                      </td>
                    )}
                    <td>
                      {u.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-gray">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => remove(u.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New User" size="md">
        <div className="space-y-4">
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <select
                className="select"
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
              >
                <option value="">Select a domain</option>
                <option value="__new__">+ Create New Domain</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subdomain})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTenantId === '__new__' && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4" />
                <span>New Domain Details</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain Name</label>
                <input
                  className="input"
                  placeholder="Acme Inc."
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subdomain</label>
                <input
                  className="input"
                  placeholder="acme"
                  value={newDomain.subdomain}
                  onChange={(e) => setNewDomain({ ...newDomain, subdomain: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  className="select"
                  value={newDomain.subscriptionPlan}
                  onChange={(e) => setNewDomain({ ...newDomain, subscriptionPlan: e.target.value })}
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
                  value={newDomain.status}
                  onChange={(e) => setNewDomain({ ...newDomain, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              className="input"
              placeholder="John Doe"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="input"
              placeholder="john@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              className="select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="tenant_admin">Tenant Admin</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={UserPlus} onClick={add}>
              Add User
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
