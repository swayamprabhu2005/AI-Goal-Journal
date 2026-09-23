/**
 * Roadmap API abstraction (Panshobh — AI Roadmap Frontend/UI).
 *
 * CONNECTED to Aditya's real backend (commit 4a9bcb4, cherry-picked into
 * progress-analytics). Actual endpoints (verified against backend/app/api/v1/
 * goals.py and backend/app/api/v1/roadmap.py):
 *
 *   GET/POST /goals/{goalId}/roadmap?timeline=&level=
 *        -> get-or-generate the persisted roadmap for the goal
 *      Response: RoadmapResponse {
 *        goal_id, goal_title, total_milestones, estimated_total_duration,
 *        milestones: [{ step_number, title, short_description,
 *                       estimated_duration, key_action_item, completed }],
 *        completed_count, progress_percentage, created_at
 *      }
 *
 *   POST /goals/{goalId}/roadmap/milestones/{stepNumber}/toggle?completed=true|false
 *        -> returns the full updated RoadmapResponse (persisted)
 *
 * NOTE: the backend persists completion at MILESTONE level (each milestone has
 * a single key_action_item). The UI therefore maps one checkbox per milestone
 * action item, identified by the milestone's step_number.
 *
 * If the backend is unreachable during offline development, set
 * USE_MOCK_ROADMAP_API = true to fall back to src/data/mockRoadmap.js.
 */
import { roadmapApi as rawRoadmapApi } from './api';
import { MOCK_ROADMAP } from '../data/mockRoadmap';

/** Flip to `true` ONLY for offline UI development without the backend. */
export const USE_MOCK_ROADMAP_API = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const roadmapCache = new Map();

export const roadmapApi = {
  /**
   * Fetch (or generate & persist) the AI roadmap for an accepted goal.
   * Resolves with the roadmap object, or rejects when it cannot be loaded.
   *
   * @param {string} goalId
   * @param {{ simulate?: 'loading' | 'empty' | 'error', forceRefresh?: boolean }} options
   *   Mock-mode-only preview hooks (e.g. /goals/xyz/roadmap?simulate=empty).
   */
  getRoadmap: async (goalId, options = {}) => {
    if (!options.forceRefresh && !options.simulate && roadmapCache.has(goalId)) {
      return roadmapCache.get(goalId);
    }

    if (!USE_MOCK_ROADMAP_API) {
      const data = await rawRoadmapApi.getGoalRoadmap(goalId);
      if (data) roadmapCache.set(goalId, data);
      return data;
    }

    const { simulate } = options;
    if (simulate === 'error') {
      await delay(600);
      throw new Error('Roadmap service is currently unavailable.');
    }
    await delay(1400); // simulated AI generation latency
    if (simulate === 'empty') return null;
    const mockData = JSON.parse(JSON.stringify(MOCK_ROADMAP));
    roadmapCache.set(goalId, mockData);
    return mockData;
  },

  /**
   * Persist a completion toggle for a milestone action item.
   * @param {string} goalId
   * @param {string} taskId  the milestone step_number (string) acted upon
   * @param {boolean} completed
   */
  setTaskCompletion: async (goalId, taskId, completed) => {
    const updated = await rawRoadmapApi.toggleMilestone(goalId, Number(taskId), completed);
    if (updated) roadmapCache.set(goalId, updated);
    return updated;
  },
};
