import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { userApi, goalApi, journalApi, summaryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState([]);
  const [journals, setJournals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [profileData, goalsData, journalsData, summaryData] = await Promise.allSettled([
        userApi.getProfile(),
        goalApi.listGoals(),
        journalApi.listJournals(),
        summaryApi.getWeeklySummary(),
      ]);

      if (profileData.status === 'fulfilled') setProfile(profileData.value);
      if (goalsData.status === 'fulfilled') setGoals(goalsData.value || []);
      if (journalsData.status === 'fulfilled') setJournals(journalsData.value || []);
      if (summaryData.status === 'fulfilled') setSummary(summaryData.value);
    } catch (err) {
      console.error('Dashboard data load error:', err);
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  const latestJournal = journals[0];
  const latestAnalysis = latestJournal?.ai_analysis;
  const activeGoals = goals.filter((g) => g.status === 'Active');
  const completedGoals = goals.filter((g) => g.status === 'Completed');

  // Aggregate active blockers from recent entries
  const recentBlockers = [];
  journals.slice(0, 5).forEach((j) => {
    const blockers = j.ai_analysis?.blockers || [];
    blockers.forEach((b) => recentBlockers.push(b));
  });

  return (
    <div className="mx-auto max-w-5xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">
            {profile?.display_name ? `Welcome back, ${profile.display_name}` : 'Welcome to your Goal Journal'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Track daily momentum, conquer blockers, and align your activities with your goals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/journal')} className="text-xs px-3.5 py-2">
            ✍️ New Journal
          </Button>
          <Button onClick={() => navigate('/goals')} className="text-xs px-4 py-2 font-bold">
            🎯 New Goal
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-card bg-status-error-bg p-4 text-xs text-status-error border border-status-error/30">
          <strong>Notice: </strong> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-card border border-card-border">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary-foreground/30 border-t-accent mb-3" />
          <p className="text-xs text-muted-foreground font-mono">Loading productivity metrics...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Key Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-card-border flex flex-col justify-between p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Goals
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-accent font-display">{activeGoals.length}</span>
                <span className="text-[11px] text-muted-foreground">In progress</span>
              </div>
            </Card>

            <Card className="bg-card border-card-border flex flex-col justify-between p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Completed Goals
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-status-success font-display">{completedGoals.length}</span>
                <span className="text-[11px] text-status-success">Achieved</span>
              </div>
            </Card>

            <Card className="bg-card border-card-border flex flex-col justify-between p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Journals Logged
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-foreground font-display">{journals.length}</span>
                <span className="text-[11px] text-muted-foreground">Total reflections</span>
              </div>
            </Card>

            <Card className="bg-card border-card-border flex flex-col justify-between p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recent Blockers
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-3xl font-bold text-status-error font-display">{recentBlockers.length}</span>
                <span className="text-[11px] text-status-error">Identified</span>
              </div>
            </Card>
          </div>

          {/* Today's Focus & Latest AI Insight Banner */}
          {latestAnalysis ? (
            <Card className="border-primary/40 bg-secondary/80 p-5 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-foreground flex items-center gap-1.5">
                  <span className="text-accent">✨</span> Latest AI Reflection Insight
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {new Date(latestJournal.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {latestAnalysis.quick_summary && (
                <p className="text-xs sm:text-sm font-medium text-foreground/90 italic mb-2 leading-relaxed">
                  "{latestAnalysis.quick_summary}"
                </p>
              )}

              {latestAnalysis.insights?.length > 0 && (
                <div className="rounded-card bg-muted/90 p-3 border border-card-border text-xs text-secondary-foreground">
                  <strong className="text-accent">Coach Note:</strong> {latestAnalysis.insights[0]}
                </div>
              )}
            </Card>
          ) : (
            <Card className="border-card-border bg-card text-center py-6">
              <p className="text-xs sm:text-sm text-muted-foreground">
                You haven't logged any journal entries yet. Record your thoughts to unlock AI insights!
              </p>
              <div className="mt-3">
                <Button onClick={() => navigate('/journal')} className="text-xs">
                  ✍️ Write First Journal
                </Button>
              </div>
            </Card>
          )}

          {/* Middle Row: AI Coach Summary Preview & Active Blockers */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Weekly Summary Card */}
            <Card className="bg-card border-card-border flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-foreground flex items-center gap-1.5">
                    <span className="text-accent">🛡️</span> AI Accountability Coach
                  </h3>
                  <button
                    onClick={() => navigate('/coach')}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    View Report →
                  </button>
                </div>

                {summary ? (
                  <div>
                    <h4 className="text-sm font-bold text-foreground font-display mb-2 leading-snug">
                      "{summary.headline}"
                    </h4>
                    {summary.coaching_suggestion && (
                      <p className="text-xs text-muted-foreground line-clamp-3 bg-muted p-2.5 rounded-card border border-card-border leading-relaxed">
                        {summary.coaching_suggestion}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground">
                      No weekly summary generated yet.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-card-border">
                <Button variant="secondary" onClick={() => navigate('/coach')} className="w-full text-xs">
                  Open Accountability Coach
                </Button>
              </div>
            </Card>

            {/* Active Blockers Alert Box */}
            <Card className="bg-card border-card-border flex flex-col justify-between p-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-status-error flex items-center gap-1.5">
                    <span>⚠️</span> Active Blockers ({recentBlockers.length})
                  </h3>
                  <span className="text-[11px] text-muted-foreground">From recent logs</span>
                </div>

                {recentBlockers.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {recentBlockers.slice(0, 4).map((b, i) => (
                      <li key={i} className="text-xs text-foreground flex items-center justify-between gap-2 bg-status-error-bg p-2 rounded border border-status-error/30">
                        <span className="truncate">{b.text}</span>
                        <span className="shrink-0 rounded bg-status-error/20 px-1.5 py-0.5 text-[10px] font-bold text-status-error capitalize">
                          {b.category || 'other'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">
                    Zero blockers detected in your recent reflections. Smooth sailing!
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-card-border">
                <Button variant="ghost" onClick={() => navigate('/journal')} className="w-full text-xs text-muted-foreground hover:text-foreground">
                  View Journal History →
                </Button>
              </div>
            </Card>
          </div>

          {/* Active Goals Preview */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground font-display">Active Goals ({activeGoals.length})</h3>
              <button
                onClick={() => navigate('/goals')}
                className="text-xs font-semibold text-accent hover:underline"
              >
                Manage Goals →
              </button>
            </div>

            {activeGoals.length === 0 ? (
              <Card className="text-center py-6 bg-card">
                <p className="text-xs text-muted-foreground">No active goals currently defined.</p>
                <div className="mt-2">
                  <Button variant="secondary" onClick={() => navigate('/goals')} className="text-xs">
                    Set a Goal
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeGoals.slice(0, 3).map((goal) => (
                  <Card key={goal.id} className="bg-card border-card-border p-4 hover:border-primary/40 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent border border-accent/30">
                        {goal.category || 'Goal'}
                      </span>
                      {goal.target_date && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Due {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-foreground font-display leading-snug">{goal.title}</h4>
                    {goal.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{goal.description}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}