import api from './api';

const projectService = {
  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @returns {Promise} - Axios promise
   */
  createProject(projectData) {
    return api.post('/projects', projectData);
  },

  /**
   * Get all projects
   * @returns {Promise} - Axios promise
   */
  getProjects() {
    return api.get('/projects');
  },

  /**
   * Get all projects (super admin)
   * @param {Object} params - Optional filters {status, search, page, limit, tenantSubdomain}
   * @returns {Promise}
   */
  getAllProjects(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.tenantSubdomain) query.set('tenantSubdomain', params.tenantSubdomain);
    const qs = query.toString();
    return api.get(`/projects/all${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get project by ID
   * @param {string} projectId - Project ID
   * @returns {Promise} - Axios promise
   */
  getProject(projectId) {
    return api.get(`/projects/${projectId}`);
  },

  /**
   * Update project
   * @param {string} projectId - Project ID
   * @param {Object} projectData - Project data to update
   * @returns {Promise} - Axios promise
   */
  updateProject(projectId, projectData) {
    return api.put(`/projects/${projectId}`, projectData);
  },

  /**
   * Delete project
   * @param {string} projectId - Project ID
   * @returns {Promise} - Axios promise
   */
  deleteProject(projectId) {
    return api.delete(`/projects/${projectId}`);
  }
};

export default projectService;