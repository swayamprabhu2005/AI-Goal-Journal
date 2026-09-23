/**
 * MOCK ROADMAP DATA (Panshobh — AI Roadmap Frontend/UI)
 *
 * Structure copied EXACTLY from Aditya's backend `RoadmapResponse`
 * (backend/app/schemas/roadmap.py — see docs/sampleRoadmap.json) so the mock
 * fallback exercises the same code path as the real API, including the
 * milestone-level `completed` field. Only used when USE_MOCK_ROADMAP_API is
 * enabled in src/services/roadmapApi.js.
 */

export const MOCK_ROADMAP = {
  goal_title: 'Learn Frontend Development',
  total_milestones: 2,
  estimated_total_duration: '10-12 weeks',
  milestones: [
    {
      step_number: 1,
      title: 'Semantic HTML5 & Accessible Structure',
      short_description:
        'Master document structure, semantic tags, forms, validation, and accessibility (ARIA basics).',
      estimated_duration: '1-2 weeks',
      key_action_item:
        'Build an accessible multi-page product landing page strictly with HTML5.',
      completed: false,
    },
    {
      step_number: 2,
      title: 'Modern CSS, Flexbox & Grid Layouts',
      short_description:
        'Learn the box model, responsive design with media queries, Flexbox, CSS Grid, and CSS variables.',
      estimated_duration: '2 weeks',
      key_action_item:
        'Style the landing page to be responsive across mobile, tablet, and desktop viewports.',
      completed: false,
    },
  ],
  completed_count: 0,
  progress_percentage: 0,
};
