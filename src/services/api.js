import { auth } from '../firebase';
import { isDevPreview } from '../config/devPreview'; // DEV PREVIEW ONLY (see config/devPreview.js)

/** Port the FastAPI backend uses when the API endpoint is not explicitly set. */
const DEFAULT_BACKEND_PORT = 8000;

/**
 * Resolve the API endpoint for ANY machine — never hard-code 127.0.0.1, which
 * would silently point every teammate (Farah/Swayam/…) at their own localhost.
 *
 *   1. VITE_API_BASE_URL when set  -> deployed / custom backend (see .env.example).
 *   2. Vite dev server             -> same-origin "/api/v1", proxied to the
 *                                     backend by vite.config.js. Works on
 *                                     localhost, 127.0.0.1, a LAN IP, etc. and
 *                                     needs no CORS configuration.
 *   3. Production build            -> same host that served the app, backend
 *                                     port 8000 (unless VITE_API_BASE_URL is set).
 *
 * Each developer only has to run the backend next to the frontend; nobody has to
 * borrow someone else's localhost or edit this file.
 */
function resolveApiBase() {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) {
    const stripped = configured.replace(/\/+$/, '');
    return stripped.endsWith('/api/v1') ? stripped : `${stripped}/api/v1`;
  }

  if (import.meta.env.DEV) return '/api/v1';

  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const { protocol, hostname, port } = window.location;
    // When running locally on developer machines
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const portSuffix = port === String(DEFAULT_BACKEND_PORT) ? '' : `:${DEFAULT_BACKEND_PORT}`;
      return `${protocol}//${hostname}${portSuffix}/api/v1`;
    }
    // Production deployed URL fallback (e.g. Vercel deployment)
    return 'https://ai-goal-journal-backend.onrender.com/api/v1';
  }

  return 'https://ai-goal-journal-backend.onrender.com/api/v1';
}

const API_BASE = resolveApiBase();

/**
 * Retrieves the current Firebase user's ID token and formats Authorization header.
 */
export async function getAuthHeaders() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    // =========================================================================
    // DEVELOPMENT / LOCAL PREVIEW ONLY — when the dev-preview login bypass is
    // active (VITE_DEV_PREVIEW=true in the dev server), there is no real
    // Firebase session, so send the backend's accepted mock dev token instead
    // of no header at all. Never active in production builds
    // (see config/devPreview.js). Real Firebase auth is untouched otherwise.
    // =========================================================================
    if (isDevPreview) {
      return {
        Authorization: 'Bearer mock-dev-token-123',
      };
    }
    return {};
  }
  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Standard fetch wrapper with automatic Firebase token injection and error handling.
 */
export async function fetchWithAuth(url, options = {}) {
  const authHeaders = await getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...options.headers,
  };

  // Generous timeout guard (300s / 5 minutes) to ensure Render cold starts or AI inference never abort
  const timeoutMs = options.timeout || 300000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    if (!response.ok) {
      let errorDetail = 'API request failed';
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
      } catch {
        errorDetail = `${response.status} ${response.statusText}`;
      }
      throw new Error(errorDetail);
    }

    // If No Content (204)
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Server is taking longer to respond (cold start). Please retry in a few seconds.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * User Profile API
 */
export const userApi = {
  getProfile: () => fetchWithAuth('/users/me'),
  updateProfile: (data) =>
    fetchWithAuth('/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updatePreferences: (preferences) =>
    fetchWithAuth('/users/me/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    }),
};

/**
 * Goal Management API
 */
export const goalApi = {
  listGoals: (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchWithAuth(`/goals${query}`);
  },
  list: (status) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return fetchWithAuth(`/goals${query}`);
  },
  getGoal: (id) => fetchWithAuth(`/goals/${id}`),
  get: (id) => fetchWithAuth(`/goals/${id}`),
  createGoal: (data) =>
    fetchWithAuth('/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  create: (data) =>
    fetchWithAuth('/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateGoal: (id, data) =>
    fetchWithAuth(`/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    fetchWithAuth(`/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteGoal: (id) =>
    fetchWithAuth(`/goals/${id}`, {
      method: 'DELETE',
    }),
  delete: (id) =>
    fetchWithAuth(`/goals/${id}`, {
      method: 'DELETE',
    }),
  getFocusNext: () => fetchWithAuth('/goals/focus-next'),
};

/**
 * Journal & Voice API
 */
export const journalApi = {
  listJournals: () => fetchWithAuth('/journals'),
  list: () => fetchWithAuth('/journals'),
  getJournal: (id) => fetchWithAuth(`/journals/${id}`),
  get: (id) => fetchWithAuth(`/journals/${id}`),
  createJournal: (data) =>
    fetchWithAuth('/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  create: (data) =>
    fetchWithAuth('/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  updateJournal: (id, data) =>
    fetchWithAuth(`/journals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    fetchWithAuth(`/journals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteJournal: (id) =>
    fetchWithAuth(`/journals/${id}`, {
      method: 'DELETE',
    }),
  delete: (id) =>
    fetchWithAuth(`/journals/${id}`, {
      method: 'DELETE',
    }),
  transcribeAudio: async (audioBlob, filename = 'recording.webm') => {
    const authHeaders = await getAuthHeaders();
    const formData = new FormData();
    formData.append('file', audioBlob, filename);

    const response = await fetch(`${API_BASE}/journals/voice/transcribe`, {
      method: 'POST',
      headers: {
        ...authHeaders,
      },
      body: formData,
    });

    if (!response.ok) {
      let errDetail = 'Transcription failed';
      try {
        const errJson = await response.json();
        errDetail = errJson.detail || errJson.message || errDetail;
      } catch {
        errDetail = `${response.status} ${response.statusText}`;
      }
      throw new Error(errDetail);
    }

    return response.json();
  },
};

/**
 * Weekly AI Summary API
 */
export const summaryApi = {
  getWeeklySummary: () => fetchWithAuth('/summaries/weekly'),
  generateWeeklySummary: () =>
    fetchWithAuth('/summaries/weekly', {
      method: 'POST',
    }),
  generateSummary: () =>
    fetchWithAuth('/summaries/weekly', {
      method: 'POST',
    }),
};

/**
 * Goal Progress API
 */
export const progressApi = {
  createProgress: (data) =>
    fetchWithAuth('/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  getGoalProgress: (goalId) => fetchWithAuth(`/progress/goal/${goalId}`),
  getProgressHistory: (goalId) => fetchWithAuth(`/progress/goal/${goalId}`),
  getProgressTrend: (goalId, days) => {
    const query = days ? `?days=${encodeURIComponent(days)}` : '';
    return fetchWithAuth(`/progress/goal/${goalId}/trend${query}`);
  },
  getLatestGoalProgress: (goalId) => fetchWithAuth(`/progress/goal/${goalId}/latest`),
  getLatestProgress: (goalId) => fetchWithAuth(`/progress/goal/${goalId}/latest`),
};

/**
 * Habit Tracker API
 */
export const habitApi = {
  listHabits: () => fetchWithAuth('/habits'),
  list: () => fetchWithAuth('/habits'),

  getHabit: (id) => fetchWithAuth(`/habits/${id}`),
  get: (id) => fetchWithAuth(`/habits/${id}`),

  createHabit: (data) =>
    fetchWithAuth('/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  create: (data) =>
    fetchWithAuth('/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  updateHabit: (id, data) =>
    fetchWithAuth(`/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    fetchWithAuth(`/habits/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteHabit: (id) =>
    fetchWithAuth(`/habits/${id}`, {
      method: 'DELETE',
    }),
  delete: (id) =>
    fetchWithAuth(`/habits/${id}`, {
      method: 'DELETE',
    }),

  completeHabit: (id, completedDate) => {
    const query = completedDate ? `?completed_date=${encodeURIComponent(completedDate)}` : '';
    return fetchWithAuth(`/habits/${id}/complete${query}`, {
      method: 'POST',
    });
  },

  uncompleteHabit: (id, completedDate) => {
    const query = completedDate ? `?completed_date=${encodeURIComponent(completedDate)}` : '';
    return fetchWithAuth(`/habits/${id}/complete${query}`, {
      method: 'DELETE',
    });
  },

  getHabitLogs: (id) => fetchWithAuth(`/habits/${id}/logs`),

  getHabitStatus: (id) => fetchWithAuth(`/habits/${id}/status`),
};

/**
 * Productivity Score API
 */
export const productivityApi = {
  getProductivityScore: () => fetchWithAuth('/productivity-score'),
};

/**
 * Google Calendar Integration API
 */
export const calendarApi = {
  getAuthUrl: () => fetchWithAuth('/calendar/auth-url'),
  getStatus: () => fetchWithAuth('/calendar/status'),
  connect: (email) =>
    fetchWithAuth('/calendar/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
  syncGoal: (goalId, options = {}) =>
    fetchWithAuth('/calendar/sync-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal_id: goalId,
        target_date: options.target_date,
        start_time: options.start_time,
        duration_minutes: options.duration_minutes || 60,
      }),
    }),
  disconnect: () =>
    fetchWithAuth('/calendar/disconnect', {
      method: 'DELETE',
    }),
};

/**
 * AI Goal Roadmap API
 */
export const roadmapApi = {
  generateRoadmap: (data) =>
    fetchWithAuth('/roadmap/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  getSampleRoadmap: () => fetchWithAuth('/roadmap/sample'),
  getGoalRoadmap: (goalId, timeline = 'Self-paced', level = 'Beginner') =>
    fetchWithAuth(`/goals/${goalId}/roadmap?timeline=${encodeURIComponent(timeline)}&level=${encodeURIComponent(level)}`),
  generateGoalRoadmap: (goalId, data = {}) =>
    fetchWithAuth(`/goals/${goalId}/roadmap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  toggleMilestone: (goalId, stepNumber, completed) => {
    const query = completed !== undefined && completed !== null ? `?completed=${completed}` : '';
    return fetchWithAuth(`/goals/${goalId}/roadmap/milestones/${stepNumber}/toggle${query}`, {
      method: 'POST',
    });
  },
};

/**
 * AI Coach Conversational API (Groq Cloud)
 */
export const coachApi = {
  chat: (message, history = []) =>
    fetchWithAuth('/coach/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    }),
};