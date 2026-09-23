import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { isDevPreview, devPreviewUser } from '../config/devPreview'; // DEV PREVIEW ONLY (see config/devPreview.js)
import {
  register as firebaseRegister,
  login as firebaseLogin,
  loginWithGoogle as firebaseLoginWithGoogle,
  loginWithMicrosoft as firebaseLoginWithMicrosoft,
  logout as firebaseLogout,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // =========================================================================
    // DEVELOPMENT / LOCAL PREVIEW ONLY — bypass Firebase login in dev server.
    // Real onAuthStateChanged flow is untouched when the flag is off, and the
    // bypass can never activate in a production build (see config/devPreview.js).
    // =========================================================================
    if (isDevPreview) {
      setUser(devPreviewUser);
      setCheckingAuth(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        const savedDevUser = localStorage.getItem('local_dev_user');
        if (savedDevUser) {
          try {
            const parsed = JSON.parse(savedDevUser);
            parsed.getIdToken = async () => 'mock-dev-token-123';
            setUser(parsed);
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  async function login(email, password) {
    const loggedInUser = await firebaseLogin(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(email, password) {
    const registeredUser = await firebaseRegister(email, password);
    setUser(registeredUser);
    return registeredUser;
  }

  async function loginWithGoogle() {
    const googleUser = await firebaseLoginWithGoogle();
    if (googleUser) {
      setUser(googleUser);
    }
    return googleUser;
  }

  async function loginWithMicrosoft() {
    const msUser = await firebaseLoginWithMicrosoft();
    if (msUser) {
      setUser(msUser);
    }
    return msUser;
  }

  async function logout() {
    await firebaseLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        checkingAuth,
        login,
        register,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return ctx;
}
