import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({ prompt: 'select_account' });

function formatAuthError(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-credential') {
    return 'Invalid email or password. If creating an account, please ensure Email/Password sign-in is enabled in Firebase Console under Authentication > Sign-in method.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'This sign-in method is disabled in Firebase Console. Go to Authentication > Sign-in method to enable it.';
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
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed before completing.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Only one popup sign-in request is allowed at a time.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with the same email but different login credentials.';
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

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    if (err?.code === 'auth/popup-closed-by-user') {
      return null;
    }
    throw new Error(formatAuthError(err));
  }
}

export async function loginWithMicrosoft() {
  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    return result.user;
  } catch (err) {
    if (err?.code === 'auth/popup-closed-by-user') {
      return null;
    }
    throw new Error(formatAuthError(err));
  }
}

export async function logout() {
  await signOut(auth);
}
