import {
  Settings as SettingsIcon,
  Bell,
  Sparkles,
  BookOpen,
  Save,
  Check,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  KeyRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { userApi, calendarApi } from "../services/api";
import GoogleCalendarSetupModal from "../components/GoogleCalendarSetupModal";

const defaults = {
  notifications: true,
  aiInsights: true,
  journalReminders: true,
};

function mergeWithDefaults(preferences) {
  return { ...defaults, ...(preferences || {}) };
}

export default function Settings() {
  const { userProfile, updateProfileLocal } = useData();
  const [settings, setSettings] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Google Calendar integration state
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarConfigured, setCalendarConfigured] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarActionLoading, setCalendarActionLoading] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState("");
  const [calendarMsg, setCalendarMsg] = useState(null);

  useEffect(() => {
    if (userProfile?.preferences) {
      setSettings(mergeWithDefaults(userProfile.preferences));
    }
  }, [userProfile]);

  useEffect(() => {
    fetchCalendarStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar_connected") === "success") {
      setCalendarMsg({ type: "success", text: "Google Calendar connected successfully!" });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("calendar_error")) {
      setCalendarMsg({ type: "error", text: `Connection error: ${params.get("calendar_error")}` });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  async function fetchCalendarStatus() {
    setCalendarLoading(true);
    try {
      const res = await calendarApi.getStatus();
      setCalendarConnected(!!res.connected);
      setCalendarConfigured(!!res.is_configured);
      setCalendarEmail(res.email || "");
    } catch {
      setCalendarConnected(false);
      setCalendarConfigured(false);
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleConnectCalendar() {
    setCalendarActionLoading(true);
    try {
      const res = await calendarApi.getAuthUrl();
      if (res && res.auth_url) {
        window.location.href = res.auth_url;
      } else if (res && !res.is_configured) {
        setShowSetupModal(true);
      }
    } catch (err) {
      setCalendarMsg({ type: "error", text: err.message || "Failed to start Google Calendar connection." });
    } finally {
      setCalendarActionLoading(false);
    }
  }

  async function handleDisconnectCalendar() {
    setCalendarActionLoading(true);
    try {
      await calendarApi.disconnect();
      setCalendarConnected(false);
      setCalendarEmail("");
      setCalendarMsg({ type: "success", text: "Google Calendar disconnected." });
    } catch (err) {
      setCalendarMsg({ type: "error", text: err.message || "Failed to disconnect Google Calendar." });
    } finally {
      setCalendarActionLoading(false);
    }
  }

  function update(key) {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
    setSaved(false);
    setError("");
  }

  async function saveSettings() {
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const updatedUser = await userApi.updatePreferences(settings);
      if (updateProfileLocal) {
        updateProfileLocal(updatedUser);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-page bg-[#F4F1E8] min-h-screen">
      <main className="mx-auto max-w-4xl px-5 py-6 md:px-8 animate-rise">
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-[#C1622C]/30 bg-[#FBEBE3] px-4 py-3 text-xs text-[#C1622C]">
              {error}
            </div>
          )}

          <SettingSection
            icon={Bell}
            title="Notifications"
            description="Stay updated with reminders."
          >
            <SettingRow
              title="Enable notifications"
              description="Receive important reminders and updates."
              enabled={settings.notifications}
              onChange={() => update("notifications")}
              disabled={saving}
            />
          </SettingSection>

          <SettingSection
            icon={Sparkles}
            title="AI Preferences"
            description="Control personalized AI insights."
          >
            <SettingRow
              title="Enable AI insights"
              description="Generate reflections based on your activity."
              enabled={settings.aiInsights}
              onChange={() => update("aiInsights")}
              disabled={saving}
            />
          </SettingSection>

          <SettingSection
            icon={BookOpen}
            title="Journal"
            description="Manage your reflection experience."
          >
            <SettingRow
              title="Journal reminders"
              description="Receive reminders to maintain your journaling habit."
              enabled={settings.journalReminders}
              onChange={() => update("journalReminders")}
              disabled={saving}
            />
          </SettingSection>

          <SettingSection
            icon={Calendar}
            title="Google Calendar Integration"
            description="Sync your goal milestones and action tasks directly with your Google Calendar."
          >
            {calendarMsg && (
              <div
                className={`mb-4 flex items-center justify-between gap-3 rounded-xl p-3 text-xs font-medium ${
                  calendarMsg.type === "success"
                    ? "bg-[#E2E9DF] text-[#4B5D3C] border border-[#4B5D3C]/30"
                    : "bg-[#FBEBE3] text-[#C1622C] border border-[#C1622C]/30"
                }`}
              >
                <span>{calendarMsg.text}</span>
                <button
                  type="button"
                  onClick={() => setCalendarMsg(null)}
                  className="font-bold hover:opacity-75"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="rounded-xl border border-[#E2E9DF] bg-[#F4F1E8]/70 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#26261F]">Connection Status</h3>
                    {calendarLoading ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        <Loader2 size={10} className="animate-spin" /> Checking
                      </span>
                    ) : calendarConnected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E2E9DF] px-2.5 py-0.5 text-[10px] font-bold text-[#4B5D3C] border border-[#4B5D3C]/30">
                        <CheckCircle2 size={10} /> Connected
                      </span>
                    ) : !calendarConfigured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FBEBE3] px-2.5 py-0.5 text-[10px] font-bold text-[#C1622C] border border-[#C1622C]/30">
                        Setup Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        Not connected
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 font-medium max-w-lg">
                    {calendarConnected
                      ? `Sync is active with ${calendarEmail || "your Google Account"}. Goals and milestones you schedule will appear in your primary calendar.`
                      : !calendarConfigured
                      ? "Free 1-click Google Calendar integration. A one-time setup of Google OAuth credentials in your .env file is needed."
                      : "Authorize AI Goal Journal to schedule goal deadlines and accountability events in your calendar. Journals are never shared."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {calendarConnected ? (
                    <>
                      <a
                        href="https://calendar.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#E2E9DF] bg-white px-3 py-2 text-xs font-semibold text-[#26261F] hover:bg-[#E2E9DF] transition shadow-2xs"
                      >
                        <ExternalLink size={13} /> Open Calendar
                      </a>
                      <button
                        type="button"
                        onClick={handleDisconnectCalendar}
                        disabled={calendarActionLoading}
                        className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition shadow-2xs disabled:opacity-50"
                      >
                        {calendarActionLoading ? "Disconnecting…" : "Disconnect"}
                      </button>
                    </>
                  ) : !calendarConfigured ? (
                    <button
                      type="button"
                      onClick={() => setShowSetupModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#C1622C] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#A75223] transition"
                    >
                      <HelpCircle size={13} /> Setup Guide
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectCalendar}
                      disabled={calendarActionLoading || calendarLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#4B5D3C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3A492E] transition shadow-2xs disabled:opacity-50"
                    >
                      {calendarActionLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Calendar size={13} />
                      )}
                      Connect Google Calendar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <GoogleCalendarSetupModal
              isOpen={showSetupModal}
              onClose={() => {
                setShowSetupModal(false);
                fetchCalendarStatus();
              }}
            />
          </SettingSection>

          <div className="flex items-center justify-end gap-4 pt-2">
            {saved && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4B5D3C]">
                <Check size={14} />
                Settings saved
              </div>
            )}

            <button
              onClick={saveSettings}
              disabled={saving}
              className="primary-button text-xs font-bold py-2 px-4"
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function SettingSection({ icon: Icon, title, description, children }) {
  return (
    <section className="panel p-6 shadow-xs bg-white border border-[#E2E9DF] rounded-2xl">
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2E9DF] text-[#4B5D3C]">
          <Icon size={18} />
        </div>
        <div>
          <h2 className="font-bold text-[#26261F] text-base">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SettingRow({ title, description, enabled, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl border border-[#E2E9DF] bg-[#F4F1E8]/60 p-4">
      <div>
        <h3 className="text-xs sm:text-sm font-bold text-[#26261F]">{title}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-600 font-medium">{description}</p>
      </div>

      <button
        type="button"
        onClick={disabled ? undefined : onChange}
        aria-pressed={enabled}
        aria-disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-[#4B5D3C]" : "bg-slate-300"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
