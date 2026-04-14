import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Live server URL
const baseURL = 'https://devtrack-api.onrender.com/api';

const CACHE_PREFIX = '@api_cache:';

const api = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Cache helpers
const getCacheKey = (url, params) => `${CACHE_PREFIX}${url}${params ? JSON.stringify(params) : ''}`;

const saveToCache = async (url, params, data) => {
    try {
        await AsyncStorage.setItem(getCacheKey(url, params), JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) { /* silent */ }
};

const getFromCache = async (url, params) => {
    try {
        const cached = await AsyncStorage.getItem(getCacheKey(url, params));
        return cached ? JSON.parse(cached).data : null;
    } catch (e) { return null; }
};

// Auth token management for React Native
let tokenProvider = null;

export const setTokenProvider = (provider) => {
    tokenProvider = provider;
};

// Request interceptor to add Clerk auth token
api.interceptors.request.use(
    async (config) => {
        if (tokenProvider) {
            try {
                const token = await tokenProvider();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    // console.log('🔑 Token refreshed & attached');
                } else {
                    console.warn('⚠️ Token provider returned null');
                }
            } catch (error) {
                console.error('❌ Error fetching token from provider:', error);
            }
        } else {
            console.warn('⚠️ No token provider set!');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling & caching
api.interceptors.response.use(
    async (response) => {
        // Cache GET requests
        if (response.config.method === 'get') {
            saveToCache(response.config.url, response.config.params, response.data);
        }
        return response;
    },
    async (error) => {
        const { config, response } = error;
        
        // If network error (offline), try to serve from cache
        if (!response && config && config.method === 'get') {
            const cachedData = await getFromCache(config.url, config.params);
            if (cachedData) {
                console.log(`🌐 [Cache] Serving ${config.url} from local storage`);
                return { 
                    ...error, 
                    data: cachedData, 
                    status: 200, 
                    statusText: 'OK (From Cache)',
                    headers: {},
                    config,
                    isFromCache: true 
                };
            }
        }

        if (error.response?.status === 401) {
            console.warn('Unauthorized - token may be invalid or expired');
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
    getInsights: () => api.get('/github/insights'),
    getSimilarProjects: (languages, topics, minStars, limit) =>
        api.get('/github/similar-projects', {
            params: {
                languages: languages?.join(','),
                topics: topics?.join(','),
                minStars,
                limit
            }
        }),
    downloadReport: () => api.get('/github/report', { responseType: 'arraybuffer' }),
};

export const geminiApi = {
    chat: (message, context = '') => api.post('/gemini/chat', { message, context }),
    analyzeProject: (repoInfo) => api.post('/gemini/analyze-project', { repoInfo }),
    getHistory: () => api.get('/gemini/history'),
    deleteHistory: () => api.delete('/gemini/history'),
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

export const bookmarksApi = {
    getAll: () => api.get('/bookmarks'),
    add: (repoData) => api.post('/bookmarks', repoData),
    checkStatus: (repoIds) => api.post('/bookmarks/check', { repoIds }),
    remove: (repoId) => api.delete(`/bookmarks/${repoId}`),
};

export const tasksApi = {
    getAll: (params) => api.get('/tasks', { params }),
    getByRange: (start, end) => api.get('/tasks/range', { params: { start, end } }),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    toggle: (id) => api.patch(`/tasks/${id}/toggle`),
};

export const projectIdeasApi = {
    generate: (options) => api.post('/project-ideas/generate', options),
};

export const savedIdeasApi = {
    getAll: () => api.get('/saved-ideas'),
    save: (ideaData) => api.post('/saved-ideas', ideaData),
    checkStatus: (titles) => api.post('/saved-ideas/check', { titles }),
    remove: (ideaId) => api.delete(`/saved-ideas/${ideaId}`),
};

export const readmeApi = {
    generate: (projectId) => api.post(`/readme/generate/${projectId}`),
    commit: (projectId, content, commitMessage) =>
        api.post(`/readme/commit/${projectId}`, { content, commitMessage }),
};

export const showcaseApi = {
    getAll: (excludeOwn = false, search = '', technology = '') =>
        api.get('/showcase', { params: { excludeOwn, search, technology } }),
    getMine: () => api.get('/showcase/mine'),
    getTrending: () => api.get('/showcase/trending'),
    checkStatus: (projectId) => api.get(`/showcase/check/${projectId}`),
    create: (data) => api.post('/showcase', data),
    delete: (id) => api.delete(`/showcase/${id}`),
    toggleStar: (id) => api.post(`/showcase/${id}/star`),
    addComment: (id, content, authorName, authorAvatar) =>
        api.post(`/showcase/${id}/comments`, { content, authorName, authorAvatar }),
    deleteComment: (showcaseId, commentId) =>
        api.delete(`/showcase/${showcaseId}/comments/${commentId}`),
};

export const leetCodeApi = {
    getStats: () => api.get('/leetcode/stats'),
    updateConfig: (username, verificationCode) => api.post('/leetcode/config', { username, verificationCode }),
};

export const publicApi = {
    getProfile: (username) => api.get(`/public/profile/${username}`),
};

export const resumeApi = {
    get: () => api.get('/resume'),
    save: (data) => api.post('/resume', data),
    generateSummary: (data) => api.post('/resume/generate-summary', data),
};

export const goalsApi = {
    getAll: () => api.get('/goals'),
    create: (data) => api.post('/goals', data),
    update: (id, data) => api.put(`/goals/${id}`, data),
    delete: (id) => api.delete(`/goals/${id}`),
};

export const socialApi = {
    vouch: (data) => api.post('/social/vouch', data),
    getEndorsements: (userId) => api.get(`/social/endorsements/${userId}`),
    updateCollaboration: (data) => api.post('/social/collaboration', data),
};

export default api;

