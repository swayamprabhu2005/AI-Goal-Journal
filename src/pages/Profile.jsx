import { useState, useEffect } from "react";
import { User, ShieldCheck } from "lucide-react";
import Input from "../components/Input";
import { userApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function Profile() {
  const { user } = useAuth();
  const { profile, hasLoadedProfile, fetchProfile, updateProfileInCache, goals = [], journals = [] } = useData();

  const [displayName, setDisplayName] = useState(profile?.display_name || user?.displayName || "");
  const [profession, setProfession] = useState(profile?.profession || "");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loading = !hasLoadedProfile && !profile && !user;

  // Live tracked metrics computed from goals & journals with profile.stats fallback
  const totalJournalsCount = journals.length > 0 ? journals.length : (profile?.stats?.total_journals ?? 0);
  const activeGoalsCount = goals.length > 0
    ? goals.filter((g) => (g.status || "").toLowerCase() === "active").length
    : (profile?.stats?.active_goals ?? 0);
  const completedGoalsCount = goals.length > 0
    ? goals.filter((g) => (g.status || "").toLowerCase() === "completed").length
    : (profile?.stats?.completed_goals ?? 0);

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
    <div className="app-page bg-[#F4F1E8] min-h-screen">
      <main className="mx-auto max-w-4xl px-5 py-6 md:px-8 animate-rise">
        {statusMessage && (
          <div role="status" className="mb-5 rounded-xl border border-[#4B5D3C]/30 bg-[#E2E9DF] px-4 py-3 text-xs text-[#4B5D3C] font-semibold">
            ✓ {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="mb-5 rounded-xl border border-[#C1622C]/30 bg-[#FBEBE3] px-4 py-3 text-xs text-[#C1622C]">
            <strong>Notice: </strong> {errorMessage}
          </div>
        )}

        {loading ? (
          <section className="panel px-6 py-16 text-center shadow-xs">
            <p className="text-xs font-medium text-slate-500">Loading profile…</p>
          </section>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Identity & Stats Header Card */}
            <section className="panel p-6 shadow-xs bg-white border border-[#E2E9DF] rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#4B5D3C] text-xl text-white shadow-xs">
                    <User size={26} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#26261F]">
                      {profile?.display_name || displayName || user?.displayName || user?.email?.split("@")[0] || "Goal Journal User"}
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {profile?.profession || profession || "Productivity Enthusiast"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-lg bg-[#F4F1E8] px-2.5 py-1 font-mono text-[#26261F] border border-[#E2E9DF] text-[11px] font-medium">
                        {profile?.email || user?.email}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E2E9DF] px-2.5 py-0.5 text-[10px] font-bold text-[#4B5D3C] border border-[#4B5D3C]/20">
                        <ShieldCheck size={12} /> Firebase Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="mt-5 pt-4 border-t border-[#E2E9DF] grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#F4F1E8]/70 p-3 rounded-xl border border-[#E2E9DF]">
                  <div className="text-xl font-bold text-[#26261F]">{totalJournalsCount}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Journals</div>
                </div>
                <div className="bg-[#F4F1E8]/70 p-3 rounded-xl border border-[#E2E9DF]">
                  <div className="text-xl font-bold text-[#26261F]">{activeGoalsCount}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Active Goals</div>
                </div>
                <div className="bg-[#F4F1E8]/70 p-3 rounded-xl border border-[#E2E9DF]">
                  <div className="text-xl font-bold text-[#4B5D3C]">{completedGoalsCount}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-0.5">Completed</div>
                </div>
              </div>
            </section>

            {/* Edit Profile Form */}
            <section className="panel p-6 shadow-xs bg-white border border-[#E2E9DF] rounded-2xl">
              <h2 className="text-sm font-bold text-[#26261F] mb-4 border-b border-[#E2E9DF] pb-3">
                Account Details
              </h2>

              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#26261F] block mb-1.5">
                    Email Address (Authoritative)
                  </label>
                  <input
                    type="email"
                    value={profile?.email || user?.email || ""}
                    disabled
                    className="input-field px-3.5 py-2.5 text-xs text-slate-500 bg-[#F4F1E8]/80 border border-[#E2E9DF] rounded-xl cursor-not-allowed font-mono opacity-80"
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

                <div className="flex justify-end pt-3 border-t border-[#E2E9DF]">
                  <button type="submit" disabled={saving} className="primary-button text-xs font-bold py-2 px-4">
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