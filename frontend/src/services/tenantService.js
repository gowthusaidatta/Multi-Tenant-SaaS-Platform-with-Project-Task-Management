import api from './api';

const tenantService = {
  /**
   * Get all tenants (Super Admin only)
   * @returns {Promise} - Axios promise
   */
  getAllTenants(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.status) query.set('status', params.status);
    if (params.subscriptionPlan) query.set('subscriptionPlan', params.subscriptionPlan);
    const qs = query.toString();
    return api.get(`/tenants${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get tenant by ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise} - Axios promise
   */
  getTenant(tenantId) {
    return api.get(`/tenants/${tenantId}`);
  },

  /**
   * Update tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} tenantData - Tenant data to update
   * @returns {Promise} - Axios promise
   */
  updateTenant(tenantId, tenantData) {
    return api.put(`/tenants/${tenantId}`, tenantData);
  }
};

export default tenantService;