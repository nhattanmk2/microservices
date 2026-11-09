import axiosClient from './axiosClient';

const authApi = {
  login: async (credentials) => {
    // credentials: { username, password }
    const response = await axiosClient.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    // userData: { username, password, email }
    const response = await axiosClient.post('/api/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosClient.get('/api/auth/me');
    return response.data;
  },

  getUserByUsername: async (username) => {
    const response = await axiosClient.get(`/api/auth/users/${username}`);
    return response.data;
  },

  checkStatus: async () => {
    const response = await axiosClient.get('/api/auth/status');
    return response.data;
  },

  getAllUsers: async () => {
    const response = await axiosClient.get('/api/auth/users');
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await axiosClient.put(`/api/auth/users/${id}/role`, { role });
    return response.data;
  },
};

export default authApi;

