import {
  Settings as SettingsIcon,
  Bell,
  Sparkles,
  BookOpen,
  Save,
  Check,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { userApi } from "../services/api";

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

  useEffect(() => {
    if (userProfile?.preferences) {
      setSettings(mergeWithDefaults(userProfile.preferences));
    }
  }, [userProfile]);

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
    <div className="app-page">
      <header className="border-b border-slate-200 bg-white px-5 py-7 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1000px]">
          <p className="section-label">PREFERENCES & PRIVACY</p>
          <div className="mt-2 flex items-center gap-3">
            <SettingsIcon size={23} className="text-teal-700" />
            <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Customize notification preferences, AI coaching, and privacy safeguards.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-5 py-7 md:px-8 lg:px-10">
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <SettingSection
            icon={Bell}
            title="Notifications"
            description="Stay updated with daily reflection reminders."
          >
            <SettingRow
              title="Enable notifications"
              description="Receive reminders to log your daily goal journal."
              enabled={settings.notifications}
              onChange={() => update("notifications")}
              disabled={saving}
            />
          </SettingSection>

          <SettingSection
            icon={Sparkles}
            title="AI Preferences"
            description="Control personalized AI coaching & structured extractions."
          >
            <SettingRow
              title="Enable AI insights & coaching"
              description="Generate reflections and progress calculations based on your activity."
              enabled={settings.aiInsights}
              onChange={() => update("aiInsights")}
              disabled={saving}
            />
          </SettingSection>

          <SettingSection
            icon={BookOpen}
            title="Journal Habits"
            description="Manage your habit and reflection experience."
          >
            <SettingRow
              title="Journal habit reminders"
              description="Receive subtle prompts to keep up your journaling streak."
              enabled={settings.journalReminders}
              onChange={() => update("journalReminders")}
              disabled={saving}
            />
          </SettingSection>

          {/* HIPAA & PRIVACY SECURITY GUARANTEE CARD */}
          <section className="panel p-6 shadow-card bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="font-bold text-emerald-950 flex items-center gap-2">
                  <Lock size={15} /> HIPAA Privacy & Security Guarantee
                </h2>
                <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                  Your daily reflections and health goals are secured with Application-Layer Envelope Encryption (AES-256-GCM). Audio transcripts are transcribed locally and deleted immediately from disk. Zero unencrypted logs are stored.
                </p>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 pt-2">
            {saved && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <Check size={14} />
                Settings saved
              </div>
            )}

            <button
              onClick={saveSettings}
              disabled={saving}
              className="primary-button"
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
    <section className="panel p-6 shadow-card bg-white border border-slate-200">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800 border border-teal-200">
          <Icon size={19} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SettingRow({ title, description, enabled, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={disabled ? undefined : onChange}
        aria-pressed={enabled}
        aria-disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-teal-700" : "bg-slate-300"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all shadow-sm ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
