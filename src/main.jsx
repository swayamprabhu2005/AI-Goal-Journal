import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import './index.css';

// Pre-flight wake-up ping for cloud backend cold starts (non-blocking)
fetch('https://ai-goal-journal-backend.onrender.com/api/v1/health', { mode: 'cors' }).catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <ModalProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ModalProvider>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);