# Context DOX Contract — src/context/AGENTS.md

> **Subtree Scope**: React Context Providers (`src/context/`)  
> **Parent Contract**: [`../AGENTS.md`](file:///../AGENTS.md)

---

## 1. Responsibilities

`AuthContext.jsx` manages the global authentication state of the application using Firebase Authentication's `onAuthStateChanged` listener.

---

## 2. Invariants & Rules

1. **Reactive Auth State**:
   - `user`: Holds the active Firebase User object or `null`.
   - `checkingAuth`: `true` while the initial Firebase SDK handshake completes, preventing premature redirects to `/login`.
2. **Exposed Helper Methods**:
   - `login(email, password)`: Proxies `signInWithEmailAndPassword`.
   - `register(email, password)`: Proxies `createUserWithEmailAndPassword`.
   - `logout()`: Proxies `signOut`.
3. **No Mock Bypass**:
   - Never inject hardcoded users into context state.
   - Any code consuming auth state must use the `useAuth()` custom hook.
