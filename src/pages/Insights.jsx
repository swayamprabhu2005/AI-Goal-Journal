import { useState, useEffect } from "react";
import {
  Sparkles,
  Trophy,
  AlertTriangle,
  Target,
  Zap,
  RefreshCw,
  TrendingUp,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { summaryApi } from "../services/api";
import { useData } from "../context/DataContext";
import { CoachLoadingState } from "../components/LoadingSkeleton";
import { useNavigate } from "react-router-dom";

export default function Insights() {
  const navigate = useNavigate();
  const { summary, hasLoadedSummary, fetchSummary, setSummaryInCache, goals } = useData();

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loading = !hasLoadedSummary;

  useEffect(() => {
    fetchSummary({ quiet: hasLoadedSummary });
  }, [fetchSummary, hasLoadedSummary]);

  async function handleGenerateFresh() {
    setGenerating(true);
    setError("");
    try {
      const fresh = await summaryApi.generateSummary();
      setSummaryInCache(fresh);
    } catch (err) {
      console.error("Generate summary error:", err);
      setError(err.message || "Failed to generate weekly summary. Ensure journals exist.");
    } finally {
      setGenerating(false);
    }
  }

  const staticTips = [
    {
      icon: TrendingUp,
      title: "Consistency over Intensity",
      text: "Showing up for 15 minutes every day creates vastly more compounding momentum than occasional heroic sprints.",
    },
    {
      icon: Target,
      title: "Protect One Focus Goal",
      text: "Identify your single highest-leverage goal for the week and tackle it before handling reactive requests.",
    },
    {
      icon: BookOpen,
      title: "Patterns Reveal Friction",
      text: "Daily reflections uncover recurring emotional and technical blockers, letting you design practical workarounds.",
    },
  ];

  return (
    <div className="app-page bg-[#F4F1E8] min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 space-y-6 animate-rise">
        {/* Page Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4B5D3C]">
              INTELLIGENCE & REFLECTION
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#26261F]">
              Weekly AI Insights
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Synthesis of your daily momentum, emotional trends, and recurring friction points.
            </p>
          </div>

          <button
            onClick={handleGenerateFresh}
            disabled={generating}
            className="primary-button text-xs font-bold self-start sm:self-auto shrink-0 shadow-xs"
          >
            {generating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Synthesizing with Gemini...
              </>
            ) : (
              <>
                <Zap size={14} />
                Generate Fresh Summary
              </>
            )}
          </button>
        </div>

        {error && (
          <div role="alert" className="rounded-xl bg-red-50 p-4 text-xs text-red-600 border border-red-200 font-medium">
            <strong>Notice: </strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading || generating ? (
          <CoachLoadingState />
        ) : summary ? (
          <div className="flex flex-col gap-6">
            {/* Executive Headline & Coaching Advice Banner */}
            <section className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-[#E2E9DF]/80 via-[#FAF8F5] to-white border border-[#E2E9DF] shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <span className="rounded-full bg-[#E2E9DF] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#3A492E] border border-[#E2E9DF]">
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

              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#26261F] mb-4 leading-snug">
                "{summary.headline}"
              </h2>

              {summary.coaching_suggestion && (
                <div className="rounded-xl bg-white p-4 border border-[#E2E9DF] shadow-2xs text-sm text-slate-800 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4B5D3C] mb-2">
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
              <section className="panel p-6 shadow-xs">
                <h3 className="section-label text-emerald-600 mb-3 flex items-center gap-2">
                  <Trophy size={16} /> Key Wins & Progress ({summary.wins?.length || 0})
                </h3>
                {summary.wins && summary.wins.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {summary.wins.map((win, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-800 flex items-start gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100 font-medium"
                      >
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

              <section className="panel p-6 shadow-xs">
                <h3 className="section-label text-rose-600 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} /> Recurring Blockers & Hazards ({summary.recurring_blockers?.length || 0})
                </h3>
                {summary.recurring_blockers && summary.recurring_blockers.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {summary.recurring_blockers.map((blk, i) => (
                      <li
                        key={i}
                        className="text-xs text-slate-800 flex items-start gap-2 bg-rose-50 p-3 rounded-xl border border-rose-100 font-medium"
                      >
                        <span className="text-rose-500 font-bold">!</span>
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
              <section className="panel p-6 shadow-xs">
                <h3 className="section-label mb-3 flex items-center gap-2 text-[#4B5D3C]">
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
          <section className="panel p-12 text-center shadow-xs">
            <Sparkles size={36} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 font-serif">No Weekly Summary Generated Yet</h3>
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

        {/* Growth Architecture Insights */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {staticTips.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="panel p-5 shadow-xs border-[#E2E9DF] hover-lift">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E2E9DF] text-[#4B5D3C]">
                  <Icon size={18} />
                </div>
                <h3 className="mt-4 font-bold text-[#26261F] text-sm font-serif">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 font-medium">{item.text}</p>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
