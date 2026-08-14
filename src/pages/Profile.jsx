import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { userApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [profession, setProfession] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await userApi.getProfile();
      setProfile(data);
      setDisplayName(data.display_name || '');
      setProfession(data.profession || '');
    } catch (err) {
      console.error('Failed to load profile:', err);
      setErrorMessage('Could not load profile information.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const updated = await userApi.updateProfile({
        display_name: displayName,
        profession: profession,
      });
      setProfile(updated);
      setStatusMessage('Profile updated successfully.');
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground font-display">User Profile</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Manage your account settings and review your journaling activity stats.
        </p>
      </div>

      {statusMessage && (
        <div role="status" className="mb-6 rounded-card bg-status-success-bg p-4 text-xs text-status-success border border-status-success/30">
          ✓ {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="mb-6 rounded-card bg-status-error-bg p-4 text-xs text-status-error border border-status-error/30">
          <strong>Notice: </strong> {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-card border border-card-border">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary-foreground/30 border-t-accent mb-3" />
          <p className="text-xs text-muted-foreground font-mono">Loading profile...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Identity & Stats Header Card */}
          <Card className="border-card-border bg-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl text-accent border border-primary/40">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground font-display">
                    {profile?.display_name || user?.displayName || 'Goal Journal User'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile?.profession || 'Productivity Enthusiast'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-muted px-2.5 py-0.5 font-mono text-secondary-foreground border border-card-border text-[11px]">
                      {profile?.email || user?.email}
                    </span>
                    <span className="rounded-full bg-status-success-bg px-2.5 py-0.5 text-[10px] font-bold text-status-success border border-status-success/30">
                      Firebase Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            {profile?.stats && (
              <div className="mt-6 pt-5 border-t border-card-border grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted p-3.5 rounded-card border border-card-border">
                  <div className="text-2xl font-bold text-foreground font-display">{profile.stats.total_journals}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">Journals</div>
                </div>
                <div className="bg-muted p-3.5 rounded-card border border-card-border">
                  <div className="text-2xl font-bold text-accent font-display">{profile.stats.active_goals}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">Active Goals</div>
                </div>
                <div className="bg-muted p-3.5 rounded-card border border-card-border">
                  <div className="text-2xl font-bold text-status-success font-display">{profile.stats.completed_goals}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">Completed</div>
                </div>
              </div>
            )}
          </Card>

          {/* Edit Profile Form */}
          <Card className="border-card-border bg-card p-6">
            <h3 className="text-base font-bold text-foreground font-display mb-4 border-b border-card-border pb-3">
              Account Details
            </h3>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-secondary-foreground block mb-1.5">
                  Email Address (Authoritative)
                </label>
                <input
                  type="email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  className="w-full rounded-card border border-card-border bg-muted/50 px-3.5 py-2.5 text-sm text-muted-foreground cursor-not-allowed font-mono"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Identity is managed securely by Firebase Authentication.
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

              <div className="flex justify-end pt-3 border-t border-card-border">
                <Button type="submit" loading={saving} disabled={saving} className="text-xs px-5 py-2.5 font-bold">
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}