import axios from 'axios';

// Use VITE_API_URL in production, fallback to /api for development (Vite proxy)
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Clerk auth token
api.interceptors.request.use(
    async (config) => {
        try {
            // Get token from Clerk
            if (window.Clerk?.session) {
                const token = await window.Clerk.session.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - could redirect to login
            console.error('Unauthorized - please sign in');
        }
        return Promise.reject(error);
    }
);

// API methods
export const logsApi = {
    getAll: (params, config = {}) => api.get('/logs', { params, ...config }),
    getById: (id) => api.get(`/logs/${id}`),
    create: (data) => api.post('/logs', data),
    update: (id, data) => api.put(`/logs/${id}`, data),
    delete: (id) => api.delete(`/logs/${id}`),
    getStats: (config = {}) => api.get('/logs/stats', config),
};

export const projectsApi = {
    getAll: (params) => api.get('/projects', { params }),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post('/projects', data),
    update: (id, data) => api.put(`/projects/${id}`, data),
    delete: (id) => api.delete(`/projects/${id}`),
    getStats: () => api.get('/projects/stats'),
};

export const healthApi = {
    check: () => api.get('/health'),
};

export const githubApi = {
    getProfile: () => api.get('/github/profile'),
    getRepos: (limit = 10) => api.get('/github/repos', { params: { limit } }),
    getLanguages: () => api.get('/github/languages'),
    analyzeRepo: (owner, repo) => api.get(`/github/repo/${owner}/${repo}`),
    getActivity: () => api.get('/github/activity'),
    getCommits: (days = 30) => api.get('/github/commits', { params: { days } }),
    getRepoLanguages: (owner, repo) => api.get(`/github/repo/${owner}/${repo}/languages`),
    createRepo: (name, description, isPrivate) => api.post('/github/repo', { name, description, isPrivate }),
};

export const geminiApi = {
    chat: (message, context) => api.post('/gemini/chat', { message, context }),
    analyzeProject: (repoInfo) => api.post('/gemini/analyze-project', { repoInfo }),
};

export const authApi = {
    sync: () => api.post('/auth/sync'),
    getMe: () => api.get('/auth/me'),
};

export const preferencesApi = {
    get: () => api.get('/preferences'),
    save: (data) => api.post('/preferences', data),
    update: (data) => api.put('/preferences', data),
    skip: () => api.post('/preferences/skip'),
};

export const notificationsApi = {
    getStatus: () => api.get('/notifications/status'),
    registerToken: (token) => api.post('/notifications/register', { token }),
    unregisterToken: () => api.delete('/notifications/register'),
    sendTest: () => api.post('/notifications/test'),
};

export const tasksApi = {
    getAll: (params) => api.get('/tasks', { params }),
    getByRange: (start, end) => api.get('/tasks/range', { params: { start, end } }),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    toggle: (id) => api.patch(`/tasks/${id}/toggle`),
};

export default api;
