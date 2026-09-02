import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

function formatAuthError(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-credential') {
    return 'Invalid email or password. If creating an account, please ensure Email/Password sign-in is enabled in Firebase Console under Authentication > Sign-in method.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is disabled in Firebase Console. Go to Authentication > Sign-in method to enable it.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'Incorrect email or password. Please try again.';
  }
  return err.message || 'Authentication error. Please try again.';
}

export async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
}

export async function logout() {
  await signOut(auth);
}
