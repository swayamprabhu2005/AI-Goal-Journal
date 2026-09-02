import { useState, useEffect } from "react";
import { User, ShieldCheck } from "lucide-react";
import Input from "../components/Input";
import { userApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function Profile() {
  const { user } = useAuth();
  const { profile, hasLoadedProfile, fetchProfile, updateProfileInCache } = useData();

  const [displayName, setDisplayName] = useState(profile?.display_name || user?.displayName || "");
  const [profession, setProfession] = useState(profile?.profession || "");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loading = !hasLoadedProfile && !profile && !user;

  useEffect(() => {
    fetchProfile({ quiet: true });
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || user?.displayName || "");
      setProfession(profile.profession || "");
    }
  }, [profile, user]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const updated = await userApi.updateProfile({
        display_name: displayName,
        profession: profession,
      });
      updateProfileInCache(updated);
      setStatusMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Save profile error:", err);
      setErrorMessage(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-page bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-[1000px] px-5 py-7 md:px-8 lg:px-10 animate-rise">
        {statusMessage && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-600 font-semibold">
            ✓ {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            <strong>Notice: </strong> {errorMessage}
          </div>
        )}

        {loading ? (
          <section className="panel px-6 py-20 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">Loading profile…</p>
          </section>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Identity & Stats Header Card */}
            <section className="panel p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-sm">
                    <User size={30} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {profile?.display_name || displayName || user?.displayName || user?.email?.split("@")[0] || "Goal Journal User"}
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {profile?.profession || profession || "Productivity Enthusiast"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-slate-700 border border-slate-200 text-[11px] font-medium">
                        {profile?.email || user?.email}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-0.5 text-[10px] font-bold text-emerald-600 border border-emerald-200">
                        <ShieldCheck size={12} /> Firebase Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-2xl font-bold text-slate-900">{profile?.stats?.total_journals ?? 0}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Journals</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-2xl font-bold text-slate-900">{profile?.stats?.active_goals ?? 0}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Active Goals</div>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-2xl font-bold text-emerald-600">{profile?.stats?.completed_goals ?? 0}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Completed</div>
                </div>
              </div>
            </section>

            {/* Edit Profile Form */}
            <section className="panel p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
                Account Details
              </h2>

              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Email Address (Authoritative)
                  </label>
                  <input
                    type="email"
                    value={profile?.email || user?.email || ""}
                    disabled
                    className="input-field px-3.5 py-2.5 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl cursor-not-allowed font-mono opacity-75"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block font-medium">
                    Identity is derived securely from Firebase Authentication.
                  </span>
                </div>

                <Input
                  id="profile-name"
                  label="Full Name / Display Name"
                  placeholder="e.g. Swayam"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />

                <Input
                  id="profile-profession"
                  label="Profession / Focus Area"
                  placeholder="e.g. Software Engineer / Student"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                />

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button type="submit" disabled={saving} className="primary-button text-xs">
                    {saving ? "Saving…" : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}