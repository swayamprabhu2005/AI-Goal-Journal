import { useState, useEffect } from "react";
import { Sparkles, Trophy, AlertTriangle, Target, Zap } from "lucide-react";
import { summaryApi } from "../services/api";
import { useData } from "../context/DataContext";
import { CoachLoadingState } from "../components/LoadingSkeleton";

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
    <div className="app-page bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10 animate-rise">
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleGenerateFresh}
            disabled={generating}
            className="primary-button text-xs"
          >
            <Zap size={15} />
            {generating ? "Analyzing with Gemini..." : "Generate Fresh Summary"}
          </button>
        </div>
        {error && (
          <div role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-xs text-red-600 border border-red-200">
            <strong>Notice: </strong> {error}
          </div>
        )}

        {loading || generating ? (
          <CoachLoadingState />
        ) : summary ? (
          <div className="flex flex-col gap-6">
            {/* Executive Headline & Coaching Advice Banner */}
            <section className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-white border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 border border-indigo-200">
                  Weekly Evaluation
                </span>

                {summary.mood_trend && (
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${
                      summary.mood_trend === "improving"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : summary.mood_trend === "declining"
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    Trend: {summary.mood_trend}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 leading-snug">
                "{summary.headline}"
              </h2>

              {summary.coaching_suggestion && (
                <div className="rounded-xl bg-white p-4 border border-indigo-100 shadow-sm text-sm text-slate-800 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">
                    <Sparkles size={14} /> Coach Recommendation
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {summary.coaching_suggestion}
                  </p>
                </div>
              )}

              <div className="mt-4 text-right text-[11px] text-slate-400 font-mono font-medium">
                Report Generated: {new Date(summary.created_at).toLocaleString()}
              </div>
            </section>

            {/* Wins and Blockers Columns */}
            <div className="grid gap-6 md:grid-cols-2">
              <section className="panel p-6 shadow-sm">
                <h3 className="section-label text-emerald-600 mb-3 flex items-center gap-2">
                  <Trophy size={16} /> Key Wins & Progress ({summary.wins?.length || 0})
                </h3>
                {summary.wins && summary.wins.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {summary.wins.map((win, i) => (
                      <li key={i} className="text-xs text-slate-800 flex items-start gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100 font-medium">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span className="leading-relaxed">{win}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Keep recording your daily activities to surface wins.
                  </p>
                )}
              </section>

              <section className="panel p-6 shadow-sm">
                <h3 className="section-label text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} /> Recurring Blockers & Hazards ({summary.recurring_blockers?.length || 0})
                </h3>
                {summary.recurring_blockers && summary.recurring_blockers.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {summary.recurring_blockers.map((blk, i) => (
                      <li key={i} className="text-xs text-slate-800 flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-100 font-medium">
                        <span className="text-red-500 font-bold">!</span>
                        <span className="leading-relaxed">{blk}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    No major recurring blockers detected this week. Excellent flow!
                  </p>
                )}
              </section>
            </div>

            {/* Goal Status Evolutions */}
            {summary.goal_status_changes && summary.goal_status_changes.length > 0 && (
              <section className="panel p-6 shadow-sm">
                <h3 className="section-label mb-3 flex items-center gap-2 text-indigo-600">
                  <Target size={16} /> Goal Milestones Evolution
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {summary.goal_status_changes.map((g, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">{g.goal_title}</div>
                      <div className="text-slate-600 mt-1 font-medium">{g.change}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <section className="panel p-12 text-center shadow-sm">
            <Sparkles size={36} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No Weekly Summary Generated Yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
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
