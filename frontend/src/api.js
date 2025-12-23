import axios from 'axios';

// Vite exposes env via import.meta.env; avoid process.env in client code
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const AuthAPI = {
  registerTenant: (payload) => api.post('/auth/register-tenant', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const TenantsAPI = {
  get: (tenantId) => api.get(`/tenants/${tenantId}`),
  list: (params) => api.get('/tenants', { params }),
  update: (tenantId, payload) => api.put(`/tenants/${tenantId}`, payload),
};

export const UsersAPI = {
  add: (tenantId, payload) => api.post(`/tenants/${tenantId}/users`, payload),
  list: (tenantId, params) => api.get(`/tenants/${tenantId}/users`, { params }),
  update: (userId, payload) => api.put(`/users/${userId}`, payload),
  remove: (userId) => api.delete(`/users/${userId}`)
};

export const ProjectsAPI = {
  create: (payload) => api.post('/projects', payload),
  list: (params) => api.get('/projects', { params }),
  update: (projectId, payload) => api.put(`/projects/${projectId}`, payload),
  remove: (projectId) => api.delete(`/projects/${projectId}`)
};

export const TasksAPI = {
  list: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  create: (projectId, payload) => api.post(`/projects/${projectId}/tasks`, payload),
  update: (taskId, payload) => api.put(`/tasks/${taskId}`, payload),
  updateStatus: (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status }),
  remove: (taskId) => api.delete(`/tasks/${taskId}`)
};
