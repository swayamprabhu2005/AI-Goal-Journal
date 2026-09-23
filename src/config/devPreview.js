/**
 * ============================================================================
 * DEVELOPMENT / LOCAL PREVIEW ONLY — DO NOT SHIP
 * ============================================================================
 * Temporary frontend bypass so protected pages can be opened and tested in a
 * local dev server without a configured Firebase login.
 *
 * Enable:  VITE_DEV_PREVIEW=true  in the frontend .env, then restart Vite.
 * Disable: VITE_DEV_PREVIEW=false — the real Firebase login is always used.
 * Default (nothing set): the preview switches itself on in the dev server while
 *   no real VITE_FIREBASE_API_KEY is configured, so a teammate who clones this
 *   branch can open Goals / Roadmap / Progress Analytics without needing anyone
 *   else's Firebase credentials (previously that required a local-only .env flag,
 *   which is why the Roadmap/Progress UI was invisible to other developers).
 *
 * Safety: this flag is ALSO gated on `import.meta.env.DEV`, so production
 * builds (`npm run build`) can NEVER ship with the bypass active, even if the
 * env var is accidentally left in .env.
 *
 * Remove this file (and the two small gated checks in AuthContext.jsx /
 * ProtectedRoute.jsx) once Firebase auth is properly configured.
 */
const previewFlag = (import.meta.env.VITE_DEV_PREVIEW || '').toString().trim().toLowerCase();
const previewExplicitlyDisabled = ['false', '0', 'off', 'no'].includes(previewFlag);

/** Firebase counts as configured only when a non-placeholder API key is present. */
const firebaseApiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').toString().trim();
const hasRealFirebaseConfig =
  firebaseApiKey !== '' && firebaseApiKey !== 'your_firebase_api_key_here';

export const isDevPreview =
  import.meta.env.DEV === true &&
  !previewExplicitlyDisabled &&
  (previewFlag === 'true' || !hasRealFirebaseConfig);

/** Minimal mock user for preview pages that read the auth context. */
export const devPreviewUser = {
  uid: 'dev-user-local-123',
  email: 'dev-preview@localhost',
  displayName: 'Dev Preview',
  // Must match the backend's accepted mock dev token (backend/app/core/auth.py
  // accepts tokens starting with "mock-"). See services/api.js getAuthHeaders.
  getIdToken: async () => 'mock-dev-token-123',
};
