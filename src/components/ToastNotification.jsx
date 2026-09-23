import React, { useEffect } from "react";

export default function ToastNotification({ type = "warning", message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 z-[200] max-w-sm w-full animate-rise">
      <ul className="notification-container">
        <li className={`notification-item ${type}`}>
          <div className="notification-content">
            <div className="notification-icon">
              {type === "success" && (
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  ></path>
                </svg>
              )}
              {type === "info" && (
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  ></path>
                </svg>
              )}
              {type === "warning" && (
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  ></path>
                </svg>
              )}
              {type === "error" && (
                <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m15 9-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  ></path>
                </svg>
              )}
            </div>
            <div className="notification-text">{message}</div>
          </div>
          <div
            className="notification-icon notification-close"
            onClick={onClose}
            role="button"
            tabIndex={0}
          >
            <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18 17.94 6M18 18 6.06 6"
              ></path>
            </svg>
          </div>
          <div className="notification-progress-bar"></div>
        </li>
      </ul>
    </div>
  );
}
