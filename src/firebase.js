// Firebase init. Swayam: drop real config below (Firebase console → project settings).
// Keep values in .env (VITE_FIREBASE_*) for real deploys — never commit real keys.
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const isValidApiKey = rawApiKey && rawApiKey !== 'your_firebase_api_key_here' && rawApiKey.trim() !== '';

const firebaseConfig = {
  apiKey: isValidApiKey ? rawApiKey : 'AIzaSyDummyDevKeyForLocalTesting12345',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:1234567890',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
