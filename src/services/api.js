import { auth } from '../firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * Retrieves the current Firebase user's ID token and formats Authorization header.
 */
export async function getAuthHeaders() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
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

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
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
  getGoal: (id) => fetchWithAuth(`/goals/${id}`),
  createGoal: (data) =>
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
  deleteGoal: (id) =>
    fetchWithAuth(`/goals/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * Journal & Voice API
 */
export const journalApi = {
  listJournals: () => fetchWithAuth('/journals'),
  getJournal: (id) => fetchWithAuth(`/journals/${id}`),
  createJournal: (data) =>
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
  deleteJournal: (id) =>
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
  getProgressTrend: (goalId) => fetchWithAuth(`/progress/goal/${goalId}/trend`),
  getLatestGoalProgress: (goalId) => fetchWithAuth(`/progress/goal/${goalId}/latest`),
  getLatestProgress: (goalId) => fetchWithAuth(`/progress/goal/${goalId}/latest`),
};

/**
 * Habit Tracker API
 */
export const habitApi = {
  listHabits: () =>
    fetchWithAuth('/habits'),

  getHabit: (id) =>
    fetchWithAuth(`/habits/${id}`),

  createHabit: (data) =>
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

  deleteHabit: (id) =>
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

  getHabitLogs: (id) =>
    fetchWithAuth(`/habits/${id}/logs`),

  getHabitStatus: (id) =>
    fetchWithAuth(`/habits/${id}/status`),
};

/**
 * Productivity Score API
 */
export const productivityApi = {
  getProductivityScore: () => fetchWithAuth('/productivity-score'),
};