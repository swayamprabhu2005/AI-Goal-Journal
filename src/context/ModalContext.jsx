import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Trash2,
} from 'lucide-react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  // Confirm Modal state
  const [modalState, setModalState] = useState(null); // { title, message, confirmText, cancelText, variant, icon, resolve }

  // Toasts state
  const [toasts, setToasts] = useState([]);

  // Confirm method returns a Promise resolving to true or false
  const confirm = useCallback(
    ({
      title = 'Are you sure?',
      message = 'This action cannot be undone.',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      variant = 'danger', // 'danger' | 'warning' | 'info' | 'success'
      icon = null,
    }) => {
      return new Promise((resolve) => {
        setModalState({
          title,
          message,
          confirmText,
          cancelText,
          variant,
          icon,
          resolve,
        });
      });
    },
    []
  );

  // Alert method returns a Promise resolving when acknowledged
  const customAlert = useCallback(
    ({
      title = 'Notice',
      message = '',
      buttonText = 'OK',
      variant = 'info',
    }) => {
      return new Promise((resolve) => {
        setModalState({
          title,
          message,
          confirmText: buttonText,
          cancelText: null, // No cancel button for alerts
          variant,
          resolve,
        });
      });
    },
    []
  );

  const closeModal = useCallback((result) => {
    setModalState((prev) => {
      if (prev && prev.resolve) {
        prev.resolve(result);
      }
      return null;
    });
  }, []);

  // Toast Notifications
  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ModalContext.Provider value={{ confirm, alert: customAlert, toast }}>
      {children}

      {/* Confirmation & Alert Modal */}
      <AnimatePresence>
        {modalState && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => closeModal(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 z-10 overflow-hidden"
              role="dialog"
              aria-modal="true"
            >
              {/* Close Icon Button */}
              <button
                type="button"
                onClick={() => closeModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                {/* Variant Icon Pill */}
                <div
                  className={`p-3 rounded-2xl shrink-0 flex items-center justify-center border ${
                    modalState.variant === 'danger'
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : modalState.variant === 'warning'
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : modalState.variant === 'success'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}
                >
                  {modalState.variant === 'danger' && <Trash2 className="w-6 h-6" />}
                  {modalState.variant === 'warning' && <AlertTriangle className="w-6 h-6" />}
                  {modalState.variant === 'success' && <CheckCircle2 className="w-6 h-6" />}
                  {modalState.variant === 'info' && <Info className="w-6 h-6" />}
                </div>

                {/* Content */}
                <div className="flex-1 pr-6">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {modalState.title}
                  </h3>
                  {modalState.message && (
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                      {modalState.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                {modalState.cancelText && (
                  <button
                    type="button"
                    onClick={() => closeModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    {modalState.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => closeModal(true)}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm active:scale-[0.98] transition-all ${
                    modalState.variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                      : modalState.variant === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
                      : modalState.variant === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  }`}
                  autoFocus
                >
                  {modalState.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-[110] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className="pointer-events-auto w-full bg-white rounded-xl shadow-lg border border-slate-200/80 p-4 flex items-start gap-3"
            >
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-indigo-500" />}
              </div>
              <div className="flex-1 text-sm font-medium text-slate-800 leading-snug">
                {t.message}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

export function useToast() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useToast must be used within a ModalProvider');
  }
  return context.toast;
}
