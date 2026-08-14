import { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import { summaryApi } from '../services/api';

export default function AiCoach() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      setLoading(true);
      const data = await summaryApi.getWeeklySummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load weekly summary:', err);
      setError('Could not load weekly summary.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateFresh() {
    try {
      setGenerating(true);
      setError('');
      const data = await summaryApi.generateWeeklySummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setError(err.message || 'Could not generate weekly summary.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display flex items-center gap-2">
            <span className="text-accent">🛡️</span> Weekly AI Accountability Coach
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Synthesizes your recent reflections, goal progress, and recurring blockers into actionable coaching insights.
          </p>
        </div>

        <Button
          onClick={handleGenerateFresh}
          loading={generating}
          disabled={generating}
          className="shrink-0 text-xs px-5 py-2.5 font-bold"
        >
          {generating ? 'Analyzing with Gemini...' : '⚡ Generate Fresh Summary'}
        </Button>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-card bg-status-error-bg p-4 text-xs text-status-error border border-status-error/30">
          <strong>Notice: </strong> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-card rounded-card border border-card-border">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary-foreground/30 border-t-accent mb-3" />
          <p className="text-sm font-display text-foreground">Synthesizing weekly accountability report...</p>
        </div>
      ) : summary ? (
        <div className="flex flex-col gap-6">
          {/* Executive Headline & Coaching Advice Banner in secondary/purple */}
          <Card className="border-primary/40 bg-secondary/90 p-6 shadow-soft">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="rounded bg-primary/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary-foreground shadow-xs border border-primary/50">
                Weekly Evaluation
              </span>

              {summary.mood_trend && (
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${
                    summary.mood_trend === 'improving'
                      ? 'bg-status-success-bg text-status-success border border-status-success/30'
                      : summary.mood_trend === 'declining'
                      ? 'bg-status-error-bg text-status-error border border-status-error/30'
                      : 'bg-accent/15 text-accent border border-accent/30'
                  }`}
                >
                  Trend: {summary.mood_trend}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground font-display mb-4 leading-snug">
              "{summary.headline}"
            </h2>

            {summary.coaching_suggestion && (
              <div className="rounded-card bg-muted p-4 border border-card-border text-sm text-foreground leading-relaxed shadow-soft">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent mb-1.5">
                  <span>💡</span> Coach Recommendation
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{summary.coaching_suggestion}</p>
              </div>
            )}

            <div className="mt-3.5 text-right text-[11px] text-muted-foreground font-mono">
              Report Generated: {new Date(summary.created_at).toLocaleString()}
            </div>
          </Card>

          {/* Wins and Blockers Columns */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Key Wins */}
            <Card className="bg-card border-card-border p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-status-success mb-3 flex items-center gap-2">
                <span>🏆</span> Key Wins & Progress ({summary.wins?.length || 0})
              </h3>
              {summary.wins && summary.wins.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                  {summary.wins.map((win, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-2 bg-status-success-bg p-2.5 rounded-card border border-status-success/25">
                      <span className="text-status-success font-bold">✓</span>
                      <span className="leading-relaxed">{win}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  Keep recording your daily activities to surface wins.
                </p>
              )}
            </Card>

            {/* Recurring Blockers */}
            <Card className="bg-card border-card-border p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-status-error mb-3 flex items-center gap-2">
                <span>⚠️</span> Recurring Blockers & Hazards ({summary.recurring_blockers?.length || 0})
              </h3>
              {summary.recurring_blockers && summary.recurring_blockers.length > 0 ? (
                <ul className="flex flex-col gap-2.5">
                  {summary.recurring_blockers.map((blk, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-2 bg-status-error-bg p-2.5 rounded-card border border-status-error/25">
                      <span className="text-status-error font-bold">!</span>
                      <span className="leading-relaxed">{blk}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground italic py-2">
                  No major recurring blockers detected this week. Excellent flow!
                </p>
              )}
            </Card>
          </div>

          {/* Goal Status Evolutions */}
          {summary.goal_status_changes && summary.goal_status_changes.length > 0 && (
            <Card className="bg-card border-card-border p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-foreground mb-3 flex items-center gap-2">
                <span>🎯</span> Goal Milestones Evolution
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {summary.goal_status_changes.map((g, i) => (
                  <div key={i} className="rounded-card bg-muted p-3 border border-card-border text-xs">
                    <div className="font-bold text-foreground">{g.goal_title}</div>
                    <div className="text-muted-foreground mt-1">{g.change}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card className="text-center py-14 bg-card border-card-border">
          <span className="text-4xl mb-3 inline-block">🛡️</span>
          <h3 className="text-lg font-bold text-foreground font-display">No Weekly Summary Generated Yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Record a few journal reflections, then generate your weekly report to let Gemini synthesize your habits, wins, and blocker trends.
          </p>
          <div className="mt-5">
            <Button onClick={handleGenerateFresh} loading={generating} className="text-xs font-bold">
              Generate Weekly Summary
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
