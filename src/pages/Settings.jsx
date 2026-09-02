import {
  Settings as SettingsIcon,
  Bell,
  Sparkles,
  BookOpen,
  Moon,
  Save,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import { userApi } from "../services/api";

const defaults = {
  notifications: true,
  aiInsights: true,
  journalReminders: true,
  compactMode: false,
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
    <div className="app-page bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-[1000px] px-5 py-7 md:px-8 lg:px-10 animate-rise">
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
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
            icon={Moon}
            title="Interface"
            description="Adjust the application layout."
          >
            <SettingRow
              title="Compact mode"
              description="Use a more condensed content layout."
              enabled={settings.compactMode}
              onChange={() => update("compactMode")}
              disabled={saving}
            />
          </SettingSection>

          <div className="flex items-center justify-end gap-4 pt-2">
            {saved && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <Check size={14} />
                Settings saved
              </div>
            )}

            <button
              onClick={saveSettings}
              disabled={saving}
              className="primary-button text-xs"
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
    <section className="panel p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Icon size={19} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">{description}</p>
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
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 font-medium">{description}</p>
      </div>

      <button
        type="button"
        onClick={disabled ? undefined : onChange}
        aria-pressed={enabled}
        aria-disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-indigo-600" : "bg-slate-300"
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
