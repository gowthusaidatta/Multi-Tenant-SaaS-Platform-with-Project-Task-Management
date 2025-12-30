import api from './api';

const userService = {
  /**
   * Add user to tenant
   * @param {Object} userData - User data
   * @returns {Promise} - Axios promise
   */
  addUser(tenantId, userData) {
    const userPayload = {
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      role: userData.role
    };
    return api.post(`/tenants/${tenantId}/users`, userPayload);
  },

  /**
   * Get all users for tenant
   * @returns {Promise} - Axios promise
   */
  getUsers(tenantId) {
    return api.get(`/tenants/${tenantId}/users`);
  },

  /**
   * Get all users (super admin only)
   * @param {Object} params - Optional filters {search, role, page, limit, tenantSubdomain}
   * @returns {Promise}
   */
  getAllUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.role) query.set('role', params.role);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.tenantSubdomain) query.set('tenantSubdomain', params.tenantSubdomain);
    const qs = query.toString();
    return api.get(`/users/all${qs ? `?${qs}` : ''}`);
  },

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise} - Axios promise
   */
  updateUser(userId, userData) {
    return api.put(`/users/${userId}`, userData);
  },

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise} - Axios promise
   */
  deleteUser(userId) {
    return api.delete(`/users/${userId}`);
  }
};

export default userService;