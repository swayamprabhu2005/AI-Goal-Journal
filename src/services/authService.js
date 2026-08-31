import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

function createMockDevUser(email) {
  const userEmail = email || 'swayamkiranprabhu2005@gmail.com';
  return {
    uid: 'dev-user-local-123',
    email: userEmail,
    displayName: userEmail.split('@')[0],
    getIdToken: async () => 'mock-dev-token-123',
  };
}

export async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    if (
      err.code === 'auth/api-key-not-valid' ||
      err.message?.includes('api-key-not-valid') ||
      err.message?.includes('API key') ||
      import.meta.env.VITE_FIREBASE_API_KEY === 'mock_key'
    ) {
      console.warn('Firebase API key is mock/invalid. Falling back to local development session.');
      const mockUser = createMockDevUser(email);
      localStorage.setItem('local_dev_user', JSON.stringify(mockUser));
      return mockUser;
    }
    throw err;
  }
}

export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    if (
      err.code === 'auth/api-key-not-valid' ||
      err.message?.includes('api-key-not-valid') ||
      err.message?.includes('API key') ||
      import.meta.env.VITE_FIREBASE_API_KEY === 'mock_key'
    ) {
      console.warn('Firebase API key is mock/invalid. Falling back to local development session.');
      const mockUser = createMockDevUser(email);
      localStorage.setItem('local_dev_user', JSON.stringify(mockUser));
      return mockUser;
    }
    throw err;
  }
}

export async function logout() {
  localStorage.removeItem('local_dev_user');
  try {
    await signOut(auth);
  } catch (e) {
    // Ignore sign-out error in mock dev mode
  }
}
