import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('nt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle errors globally
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || 'Something went wrong'
    if (err.response?.status === 401) {
      localStorage.removeItem('nt_token')
      localStorage.removeItem('nt_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

// Sessions
export const sessionApi = {
  getAll: (params) => api.get('/sessions', { params }),
  getToday: () => api.get('/sessions/today'),
  create: (data) => api.post('/sessions', data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  delete: (id) => api.delete(`/sessions/${id}`),
}

// Analytics
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getCharts: (days) => api.get('/analytics/charts', { params: { days } }),
  getHeatmap: () => api.get('/analytics/heatmap'),
  getBestTime: () => api.get('/analytics/best-time'),
  getBurnout: () => api.get('/analytics/burnout'),
}

// Goals
export const goalApi = {
  getAll: (params) => api.get('/goals', { params }),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  updateProgress: (id, minutes) => api.put(`/goals/${id}/progress`, { minutes }),
  delete: (id) => api.delete(`/goals/${id}`),
}

// Notes
export const noteApi = {
  getAll: (params) => api.get('/notes', { params }),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
}

// Weakness
export const weaknessApi = {
  getAll: () => api.get('/weakness'),
  addQuiz: (data) => api.post('/weakness/quiz', data),
  delete: (id) => api.delete(`/weakness/${id}`),
}

// Gamification
export const gamificationApi = {
  get: () => api.get('/gamification'),
}

// Predictions
export const predictionApi = {
  get: () => api.get('/predictions'),
}

// Coach
export const coachApi = {
  message: (message) => api.post('/profile/coach', { message }),
}

// Insights, brief, review queue (added in upgrade)
export const insightsApi = {
  getInsights:   () => api.get('/analytics/insights'),
  getDailyBrief: () => api.get('/analytics/brief'),
  getReviewQueue:() => api.get('/analytics/review-queue'),
}
