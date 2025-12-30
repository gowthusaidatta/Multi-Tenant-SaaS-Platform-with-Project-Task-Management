import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';
import tenantService from '../services/tenantService';
import '../styles/Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user'
  });
  const [tenantOptions, setTenantOptions] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { tenant, user } = useContext(AuthContext);

  useEffect(() => {
    const load = async () => {
      if (user?.role === 'super_admin') {
        // Load tenants for selector
        try {
          const tRes = await tenantService.getAllTenants({ limit: 50 });
          const list = tRes.data?.data?.tenants || [];
          setTenantOptions(list);
          // Preselect first tenant if available
          if (list.length && !selectedTenantId) {
            setSelectedTenantId(list[0].id);
          }
        } catch (e) {
          // Non-blocking: still allow listing users
          console.error('Failed to load tenants list', e);
        }
        await fetchAllUsers(page);
      } else if (tenant?.id) {
        await fetchUsers();
      } else {
        setLoading(false);
      }
    };
    load();
  }, [tenant, user, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers(tenant.id);
      // The API response structure is {success: true, data: {users: [...], total, pagination}}
      if (response.data?.success && Array.isArray(response.data?.data?.users)) {
        setUsers(response.data.data.users || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
      console.error('Error details:', err.response || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async (pageParam = 1) => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers({ page: pageParam, limit: 10 });
      if (response.data?.success && Array.isArray(response.data?.data?.users)) {
        setUsers(response.data.data.users || []);
        const pagination = response.data?.data?.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || 1);
        }
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching all users:', err);
      console.error('Error details:', err.response || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    // Determine target tenant
    const targetTenantId = user?.role === 'super_admin' ? selectedTenantId : tenant?.id;
    if (!targetTenantId) {
      setError('Please select a tenant');
      return;
    }
    try {
      await userService.addUser(targetTenantId, newUser);
      setSuccess('User created successfully');
      setNewUser({ email: '', password: '', fullName: '', role: 'user' });
      setShowNewForm(false);
      if (user?.role === 'super_admin') {
        await fetchAllUsers(page);
      } else {
        await fetchUsers();
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      // Extract specific error message from backend response
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        // Handle express-validator errors
        const firstError = err.response.data.errors[0];
        setError(firstError?.msg || 'Failed to create user');
      } else {
        setError('Failed to create user');
      }
      console.error('Error creating user:', err);
      console.error('Error details:', err.response || err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      setSuccess('User deleted successfully');
      if (user?.role === 'super_admin') {
        await fetchAllUsers(page);
      } else {
        await fetchUsers();
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      // Extract specific error message from backend response
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to delete user');
      }
      console.error('Error deleting user:', err);
      console.error('Error details:', err.response || err.message);
    }
  };

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (user?.role !== 'tenant_admin' && user?.role !== 'super_admin') {
    return (
      <div className="users-page">
        <div className="alert alert-error">Only tenant admins can manage users.</div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Team Members</h1>
          <p className="subtitle">Manage your organization's users and permissions</p>
        </div>
        <button 
          className="btn btn-primary btn-large"
          onClick={() => setShowNewForm(!showNewForm)}
        >
          {showNewForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showNewForm && (
        <div className="create-form-container">
          <form onSubmit={handleCreateUser} className="create-form">
            {user?.role === 'super_admin' && (
              <div className="form-group">
                <label htmlFor="tenant">Tenant *</label>
                <select
                  id="tenant"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a tenant</option>
                  {tenantOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                id="fullName"
                type="text"
                value={newUser.fullName}
                onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                required
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                required
                placeholder="Enter password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">Add User</button>
          </form>
        </div>
      )}

      {users && users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h2>No team members yet</h2>
          <p>Add users to your organization to start collaborating on projects.</p>
          <button 
            className="btn btn-primary btn-large"
            onClick={() => setShowNewForm(true)}
          >
            Add Your First User
          </button>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users && users.map((user) => (
                <tr key={user.id || user._id}>
                  <td>{user.fullName || user.full_name || user.name || 'N/A'}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>
                    <span className={`role-badge role-${user.role || 'user'}`}>
                      {user.role === 'tenant_admin' ? 'Tenant Admin' : user.role || 'User'}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${user.isActive || user.is_active ? 'status-active' : 'status-inactive'}`}>
                      {(user.isActive !== undefined ? user.isActive : user.is_active) ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={() => alert('Edit functionality coming soon')}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {user?.role === 'super_admin' && (
            <div className="pagination">
              <button 
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Prev
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button 
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Users;