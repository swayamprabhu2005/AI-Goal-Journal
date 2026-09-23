import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Unplug,
  AlertCircle,
  HelpCircle,
  KeyRound,
} from "lucide-react";
import { calendarApi } from "../services/api";
import GoogleCalendarSetupModal from "./GoogleCalendarSetupModal";

const CALENDAR_CACHE_KEY = "ai_journal_cache_calendar_status";

function getCachedCalendarStatus() {
  try {
    const raw = localStorage.getItem(CALENDAR_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function GoogleCalendarBanner({ onStatusChange, className = "" }) {
  const [status, setStatus] = useState(() => getCachedCalendarStatus() || { connected: false, is_configured: false });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSetupModal, setShowSetupModal] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      setError("");
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );
      const res = await Promise.race([calendarApi.getStatus(), timeoutPromise]);
      if (res) {
        setStatus(res);
        try {
          localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify(res));
        } catch {}
        if (onStatusChange) onStatusChange(res);
      }
    } catch (err) {
      console.warn("Google Calendar status fetch skipped/fallback:", err?.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    try {
      setActionLoading(true);
      setError("");
      const res = await calendarApi.getAuthUrl();
      if (res && res.auth_url) {
        window.location.href = res.auth_url;
      } else if (res && !res.is_configured) {
        setShowSetupModal(true);
      }
    } catch (err) {
      console.error("Failed to get Google Calendar auth URL:", err);
      setError("Unable to initiate Google Calendar connection. Please check your credentials.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Are you sure you want to disconnect Google Calendar?")) return;

    try {
      setActionLoading(true);
      setError("");
      await calendarApi.disconnect();
      try {
        localStorage.removeItem(CALENDAR_CACHE_KEY);
      } catch {}
      await fetchStatus();
    } catch (err) {
      console.error("Failed to disconnect Google Calendar:", err);
      setError("Failed to disconnect Google Calendar.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse ${className}`}>
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-44 rounded-md bg-slate-100" />
            <div className="h-3 w-72 rounded-md bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  const isConfigured = Boolean(status?.is_configured);
  const isConnected = Boolean(status?.connected);

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 md:p-6 transition-all duration-200 shadow-xs ${
          isConnected
            ? "border-emerald-200 bg-emerald-50/50 text-slate-900"
            : !isConfigured
            ? "border-amber-200 bg-amber-50/40 text-slate-900"
            : "border-[#E2E9DF] bg-[#E2E9DF]/40 text-slate-900"
        } ${className}`}
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Brand & Status Details */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-xs border ${
                isConnected
                  ? "bg-emerald-600 text-white border-emerald-500"
                  : !isConfigured
                  ? "bg-amber-500 text-white border-amber-400"
                  : "bg-[#4B5D3C] text-white border-[#3A492E]"
              }`}
            >
              {isConnected ? (
                <CheckCircle2 size={24} />
              ) : !isConfigured ? (
                <KeyRound size={24} />
              ) : (
                <CalendarIcon size={24} />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-slate-900">
                  Google Calendar Integration
                </h3>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300 shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                  </span>
                ) : !isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
                    Setup Required
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Not Connected
                  </span>
                )}
              </div>

              <p className="mt-1.5 text-xs text-slate-600 max-w-xl leading-relaxed">
                {isConnected ? (
                  <>
                    Sync is active with <strong className="font-semibold text-slate-900">{status.email}</strong>. When you schedule a goal or milestone, it will be added directly to your personal Google Calendar.
                  </>
                ) : !isConfigured ? (
                  "Sync your goals to your personal Google Calendar for 100% free. Add your Google OAuth Client ID to your .env file to enable synchronization."
                ) : (
                  "Connect your Google account to automatically schedule your goals and milestones into your calendar. Only goals you choose to schedule are synced; journals remain completely private."
                )}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center shrink-0">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition shadow-xs"
                >
                  <span>Open Calendar</span>
                  <ExternalLink size={13} className="text-slate-400" />
                </a>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                  title="Disconnect Google Calendar"
                >
                  <Unplug size={13} />
                  <span>Disconnect</span>
                </button>
              </div>
            ) : !isConfigured ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition"
                >
                  <HelpCircle size={14} />
                  <span>Setup Guide</span>
                </button>
                <button
                  type="button"
                  onClick={fetchStatus}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  title="Refresh status"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#4B5D3C] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#3A492E] active:scale-[0.98] transition disabled:opacity-60"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Opening Google Login...</span>
                    </>
                  ) : (
                    <>
                      <CalendarIcon size={14} />
                      <span>Connect with Google</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  className="rounded-xl border border-slate-300 bg-white p-2.5 text-slate-600 hover:bg-slate-50 transition"
                  title="View Setup Instructions"
                >
                  <HelpCircle size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* SETUP GUIDE MODAL */}
      <GoogleCalendarSetupModal
        isOpen={showSetupModal}
        onClose={() => {
          setShowSetupModal(false);
          fetchStatus();
        }}
      />
    </>
  );
}
