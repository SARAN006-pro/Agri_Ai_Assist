import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

export const sendChat = (message, sessionId, history, language, deviceId) =>
  api.post('/chat', { message, session_id: sessionId, history, language, device_id: deviceId })

export const getChatHistory = (sessionId) =>
  api.get(`/chat/history/${sessionId}`)

export const uploadDocument = (formData) =>
  api.post('/rag/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const queryDocuments = (question) =>
  api.post('/rag/query', { question })

export const getRagStats = () =>
  api.get('/rag/stats')

export const predictCrop = (data) =>
  api.post('/predict/crop', data)

export const predictYield = (data) =>
  api.post('/predict/yield', data)

export const getCropsList = () =>
  api.get('/predict/crops/list')

export const getStats = () =>
  api.get('/stats')

export const getStatsHistory = () => api.get('/stats/history')

export const getStatsBreakdown = () => api.get('/stats/breakdown')

export const getSettings = () => api.get('/settings')

export const resetRagIndex = () => api.post('/settings/reset-index')

export const clearChatHistory = () => api.post('/settings/clear-history')

// Farm Profile
export const getFarmProfiles = () => api.get('/farm/profile')
export const createFarmProfile = (data) => api.post('/farm/profile', data)
export const updateFarmProfile = (id, data) => api.put(`/farm/profile/${id}`, data)
export const deleteFarmProfile = (id) => api.delete(`/farm/profile/${id}`)

// Chat Sessions
export const getSessions = () => api.get('/chat/sessions')
export const createSession = (name) => api.post('/chat/sessions', { name })
export const deleteSession = (sessionId) => api.delete(`/chat/sessions/${sessionId}`)
export const renameSession = (sessionId, name) => api.patch(`/chat/sessions/${sessionId}`, { name })
export const exportChat = (sessionId, format) => api.get(`/chat/export/${sessionId}?format=${format}`, { responseType: 'blob' })

// Market Prices
export const getMarketPrices = () => api.get('/market/prices')
export const getMarketPricesCrop = (crop) => api.get(`/market/prices/${crop}`)

// Irrigation
export const getIrrigationAdvice = (data) => api.post('/irrigation/advice', data)
export const getIrrigationLogs = (params) => api.get('/irrigation/logs', { params })

// Economics
export const getProfitMargin = (data) => api.post('/economics/margin', data)

// Calendar
export const getCalendar = (location) => api.get('/calendar', { params: location ? { location } : {} })
export const getCalendarCropsList = () => api.get('/calendar/crops/list')

// Yield Records
export const getYieldRecords = (farmId) => api.get('/records', { params: farmId ? { farm_id: farmId } : {} })
export const createYieldRecord = (data) => api.post('/records', data)
export const updateYieldRecord = (id, data) => api.put(`/records/${id}`, data)
export const deleteYieldRecord = (id) => api.delete(`/records/${id}`)

// Sensors
export const getSensorReadings = (params) => api.get('/sensors/readings', { params })
export const getWebhookUrl = () => api.get('/sensors/webhook-url')
export const sendSensorData = (data) => api.post('/sensors/data', data)

// Translation
export const translateText = (data) => api.post('/translate', data)
export const detectLanguage = (data) => api.post('/detect-language', data)
export const getSupportedLanguages = () => api.get('/languages')

// Adaptive Learning
export const submitFeedback = (data) => api.post('/feedback', data)
export const submitCorrection = (data) => api.post('/correction', data)
export const updateUserPreferences = (data) => api.post('/profile/preferences', data)
export const getUserProfile = (deviceId) => api.get(`/profile/${deviceId}`)
export const getLearningStats = (deviceId) => api.get(`/profile/${deviceId}/stats`)
export const getPersonalizedContext = (deviceId) => api.get(`/profile/${deviceId}/context`)
export const addLearnedContext = (deviceId, key, value) => api.post(`/profile/${deviceId}/context?key=${key}&value=${value}`)
export const recordCropOutcome = (data) => api.post('/crop-outcome', data)
export const getCropPatterns = (deviceId) => api.get(`/profile/${deviceId}/crop-patterns`)
export const getChatContext = (sessionId, deviceId) => api.get(`/chat/context/${sessionId}?device_id=${deviceId}`)

export default api