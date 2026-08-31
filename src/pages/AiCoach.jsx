import { useState, useEffect } from "react";
import { Sparkles, Trophy, AlertTriangle, Target, Zap } from "lucide-react";
import { summaryApi } from "../services/api";
import { useData } from "../context/DataContext";

export default function AiCoach() {
  const { summary, hasLoadedSummary, fetchSummary, setSummaryInCache } = useData();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loading = !hasLoadedSummary;

  useEffect(() => {
    fetchSummary({ quiet: hasLoadedSummary });
  }, [fetchSummary, hasLoadedSummary]);

  async function handleGenerateFresh() {
    try {
      setGenerating(true);
      setError("");
      const data = await summaryApi.generateWeeklySummary();
      setSummaryInCache(data);
    } catch (err) {
      console.error("Failed to generate summary:", err);
      setError(err.message || "Could not generate weekly summary.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="app-page">
      <header className="border-b border-border bg-surface px-5 py-7 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1250px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="section-label">ACCOUNTABILITY COACH</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-cream flex items-center gap-2.5">
              <Sparkles className="text-cream" size={26} /> Weekly AI Accountability Coach
            </h1>
            <p className="mt-2 text-sm text-beige/60">
              Synthesizes your recent reflections, goal progress, and recurring blockers into actionable coaching insights.
            </p>
          </div>

          <button
            onClick={handleGenerateFresh}
            disabled={generating}
            className="primary-button text-xs"
          >
            <Zap size={15} />
            {generating ? "Analyzing with Gemini..." : "Generate Fresh Summary"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10">
        {error && (
          <div role="alert" className="mb-6 rounded-xl bg-red-950/30 p-4 text-xs text-red-400 border border-red-900/40">
            <strong>Notice: </strong> {error}
          </div>
        )}

        {loading ? (
          <section className="panel px-6 py-20 text-center shadow-card">
            <p className="text-sm text-beige/55">Synthesizing weekly accountability report...</p>
          </section>
        ) : summary ? (
          <div className="flex flex-col gap-6">
            {/* Executive Headline & Coaching Advice Banner */}
            <section className="panel p-6 md:p-8 bg-gradient-to-br from-burgundy/60 to-surface border border-border shadow-card">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="rounded-lg bg-wine/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cream border border-wine/50">
                  Weekly Evaluation
                </span>

                {summary.mood_trend && (
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${
                      summary.mood_trend === "improving"
                        ? "bg-green-950/40 text-green-400 border border-green-900/40"
                        : summary.mood_trend === "declining"
                        ? "bg-red-950/40 text-red-400 border border-red-900/40"
                        : "bg-surface2 text-cream border border-border"
                    }`}
                  >
                    Trend: {summary.mood_trend}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-cream mb-4 leading-snug">
                "{summary.headline}"
              </h2>

              {summary.coaching_suggestion && (
                <div className="rounded-xl bg-surface2 p-4 border border-border text-sm text-cream leading-relaxed">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-beige mb-2">
                    <Sparkles size={14} /> Coach Recommendation
                  </div>
                  <p className="text-xs sm:text-sm text-beige/90 leading-relaxed">
                    {summary.coaching_suggestion}
                  </p>
                </div>
              )}

              <div className="mt-4 text-right text-[11px] text-beige/50 font-mono">
                Report Generated: {new Date(summary.created_at).toLocaleString()}
              </div>
            </section>

            {/* Wins and Blockers Columns */}
            <div className="grid gap-6 md:grid-cols-2">
              <section className="panel p-6 shadow-card">
                <h3 className="section-label text-green-400 mb-3 flex items-center gap-2">
                  <Trophy size={16} /> Key Wins & Progress ({summary.wins?.length || 0})
                </h3>
                {summary.wins && summary.wins.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {summary.wins.map((win, i) => (
                      <li key={i} className="text-xs text-cream flex items-start gap-2 bg-green-950/20 p-3 rounded-xl border border-green-900/30">
                        <span className="text-green-400 font-bold">✓</span>
                        <span className="leading-relaxed">{win}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-beige/50 italic py-2">
                    Keep recording your daily activities to surface wins.
                  </p>
                )}
              </section>

              <section className="panel p-6 shadow-card">
                <h3 className="section-label text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} /> Recurring Blockers & Hazards ({summary.recurring_blockers?.length || 0})
                </h3>
                {summary.recurring_blockers && summary.recurring_blockers.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {summary.recurring_blockers.map((blk, i) => (
                      <li key={i} className="text-xs text-cream flex items-start gap-2 bg-red-950/20 p-3 rounded-xl border border-red-900/30">
                        <span className="text-red-400 font-bold">!</span>
                        <span className="leading-relaxed">{blk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-beige/50 italic py-2">
                    No major recurring blockers detected this week. Excellent flow!
                  </p>
                )}
              </section>
            </div>

            {/* Goal Status Evolutions */}
            {summary.goal_status_changes && summary.goal_status_changes.length > 0 && (
              <section className="panel p-6 shadow-card">
                <h3 className="section-label mb-3 flex items-center gap-2">
                  <Target size={16} /> Goal Milestones Evolution
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.goal_status_changes.map((g, i) => (
                    <div key={i} className="rounded-xl bg-surface2 p-3.5 border border-border text-xs">
                      <div className="font-bold text-cream">{g.goal_title}</div>
                      <div className="text-beige/60 mt-1">{g.change}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <section className="panel p-12 text-center shadow-card">
            <Sparkles size={36} className="mx-auto text-beige/40 mb-3" />
            <h3 className="text-lg font-bold text-cream">No Weekly Summary Generated Yet</h3>
            <p className="mt-1 text-xs text-beige/60 max-w-md mx-auto leading-relaxed">
              Record a few journal reflections, then generate your weekly report to let Gemini synthesize your habits, wins, and blocker trends.
            </p>
            <div className="mt-5">
              <button onClick={handleGenerateFresh} disabled={generating} className="primary-button text-xs">
                Generate Weekly Summary
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
