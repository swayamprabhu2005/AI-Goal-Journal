import { useEffect, useState } from "react";
import {
  Target,
  BookOpen,
  Flame,
  ArrowUpRight,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  HelpCircle,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { DashboardSkeleton } from "../components/LoadingSkeleton";
import AnimatedNumber from "../components/AnimatedNumber";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    profile,
    goals = [],
    journals = [],
    summary,
    initialLoading,
    fetchAllData,
  } = useData();

  const [showScoreModal, setShowScoreModal] = useState(false);

  useEffect(() => {
    fetchAllData({ quiet: true });

    // Refresh goals & stats whenever user returns to this window/tab
    const onFocus = () => fetchAllData({ quiet: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAllData]);

  const loading = initialLoading && !profile && goals.length === 0 && journals.length === 0;

  const latestJournal = journals[0];
  const latestAnalysis = latestJournal?.ai_analysis;
  const activeGoals = goals.filter((g) => g.status?.toLowerCase() === "active");
  const completedGoals = goals.filter((g) => g.status?.toLowerCase() === "completed");

  const recentBlockers = [];
  journals.slice(0, 5).forEach((j) => {
    const blockers = j.ai_analysis?.blockers || [];
    blockers.forEach((b) => recentBlockers.push(b));
  });

  const streak = (() => {
    if (!journals.length) return 0;
    const dates = new Set(
      journals.map((j) => new Date(j.created_at || j.createdAt).toDateString())
    );
    let count = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      if (dates.has(cursor.toDateString())) {
        count++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  })();

  // --- DETERMINISTIC PRODUCTIVITY SCORE CALCULATION ---
  const productivityScoreData = (() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // 1. Goal Progress Score (30%)
    let goalProgressScore = 0;
    if (activeGoals.length > 0) {
      const effectiveScores = activeGoals.map((g) => {
        let p = g.progress_percent !== undefined && g.progress_percent !== null ? Number(g.progress_percent) : 50;
        const updatedAt = new Date(g.updated_at || g.created_at || now);
        const daysStale = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
        if (daysStale > 30) {
          const decay = Math.max(0, 1 - (daysStale - 30) / 30);
          p *= decay;
        }
        return p;
      });
      goalProgressScore = effectiveScores.reduce((acc, curr) => acc + curr, 0) / effectiveScores.length;
    }

    // 2. Goal Completion Score (20%)
    let goalCompletionScore = 0;
    if (goals.length > 0) {
      let ratio = (completedGoals.length / goals.length) * 100;
      if (goals.length < 3) ratio *= 0.8;
      goalCompletionScore = Math.min(100, ratio);
    }

    // 3. Completed Activities (20%) & Consistency (20%) & Blockers (-10%)
    let completedActivitiesCount = 0;
    let blockerCount = 0;
    const journalDays = new Set();

    journals.forEach((j) => {
      const createdAt = new Date(j.created_at || j.createdAt);
      if (createdAt >= sevenDaysAgo) {
        journalDays.add(createdAt.toDateString());
        const analysis = j.ai_analysis || {};
        (analysis.activities || []).forEach((act) => {
          if ((typeof act === "object" && act.status === "completed") || typeof act === "string") {
            completedActivitiesCount++;
          }
        });
        blockerCount += (analysis.blockers || []).length;
      }
    });

    const completedActivitiesScore = Math.min(100, (completedActivitiesCount / 10) * 100);
    const journalConsistencyScore = Math.min(100, (journalDays.size / 5) * 100);
    const blockerPenalty = Math.min(15, blockerCount * 3);

    const baseScore =
      0.3 * goalProgressScore +
      0.2 * goalCompletionScore +
      0.2 * completedActivitiesScore +
      0.2 * journalConsistencyScore;

    const finalScore = Math.round(Math.max(0, Math.min(100, baseScore - blockerPenalty)));

    return {
      finalScore,
      goalProgressScore: Math.round(goalProgressScore),
      goalCompletionScore: Math.round(goalCompletionScore),
      completedActivitiesScore: Math.round(completedActivitiesScore),
      journalConsistencyScore: Math.round(journalConsistencyScore),
      blockerPenalty: Math.round(blockerPenalty),
      blockerCount,
      completedActivitiesCount,
      daysJournaled: journalDays.size,
    };
  })();

  const name = profile?.display_name || user?.displayName || user?.email?.split("@")[0] || "there";

  return (
    <div className="app-page bg-slate-50 min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-8 md:px-10 lg:px-12">
        <div className="mx-auto max-w-[1350px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-3.5">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                Good day, {name} <span className="animate-wave">👋</span>
              </h1>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-700 border border-amber-200 shadow-sm">
                <Flame size={16} className="text-amber-500 fill-amber-400" /> {streak} days streak
              </span>
            </div>
            <p className="mt-2.5 text-base text-slate-600 font-medium">
              Track daily momentum, conquer blockers, and align your activities with your goals.
            </p>
          </div>

          <div>
            <button
              onClick={() => navigate("/journal")}
              className="primary-button px-6 py-3 text-sm font-bold shadow-md hover:shadow-indigo-200 hover:-translate-y-0.5"
            >
              <BookOpen size={18} />
              + New Journal Entry
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1350px] px-6 py-8 md:px-10 lg:px-12">
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="flex flex-col gap-8">
            {/* Top Metrics Grid: Updated to 5-col layout on large screens */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 stagger-in">
              <div
                onClick={() => setShowScoreModal(true)}
                className="panel p-6 sm:p-7 shadow-sm flex flex-col justify-between hover-lift cursor-pointer bg-gradient-to-br from-indigo-50/70 to-purple-50/50 border-indigo-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                    <Zap size={22} className="fill-current" />
                  </div>
                  <HelpCircle size={18} className="text-slate-400 hover:text-indigo-600" />
                </div>
                <div>
                  <p className="mt-5 section-label text-xs font-bold tracking-wider text-indigo-700">PRODUCTIVITY SCORE</p>
                  <div className="mt-1.5 flex items-baseline gap-2.5">
                    <AnimatedNumber value={String(productivityScoreData.finalScore)} className="text-4xl font-extrabold text-indigo-900" />
                    <span className="text-sm text-indigo-600 font-semibold">/ 100</span>
                  </div>
                </div>
              </div>

              <StatCard
                icon={<Target size={22} className="text-indigo-600" />}
                iconBg="bg-indigo-50"
                label="ACTIVE GOALS"
                value={String(activeGoals.length)}
                detail="in progress"
              />
              <StatCard
                icon={<CheckCircle2 size={22} className="text-emerald-600" />}
                iconBg="bg-emerald-50"
                label="COMPLETED GOALS"
                value={String(completedGoals.length)}
                detail="achieved"
              />
              <StatCard
                icon={<Flame size={22} className="text-amber-500" />}
                iconBg="bg-amber-50"
                label="CURRENT STREAK"
                value={String(streak)}
                detail="days active"
              />
              <StatCard
                icon={<AlertTriangle size={22} className="text-purple-600" />}
                iconBg="bg-purple-50"
                label="ACTIVE BLOCKERS"
                value={String(recentBlockers.length)}
                detail="identified"
              />
            </div>

            {/* AI Reflection Banner */}
            {latestAnalysis ? (
              <section className="animate-rise rounded-3xl p-7 md:p-9 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-white border border-indigo-200/90 shadow-md hover-lift">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <span className="text-sm font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                    <Sparkles size={20} className="text-purple-600 animate-pulse" />
                    Latest AI Reflection Insight
                  </span>
                  <span className="text-sm text-slate-500 font-mono font-semibold">
                    {new Date(latestJournal.created_at || latestJournal.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {latestAnalysis.quick_summary && (
                  <p className="text-xl font-bold text-slate-900 italic mb-4 leading-relaxed">
                    "{latestAnalysis.quick_summary}"
                  </p>
                )}

                {latestAnalysis.insights?.length > 0 && (
                  <div className="rounded-2xl bg-white/95 p-5 border border-indigo-100 text-base text-slate-800 shadow-sm leading-relaxed font-medium">
                    <strong className="text-indigo-600 font-bold">Coach Note:</strong> {latestAnalysis.insights[0]}
                  </div>
                )}
              </section>
            ) : (
              <section className="panel p-8 text-center shadow-sm animate-rise">
                <p className="text-base text-slate-600 font-medium">
                  You haven't logged any journal entries yet. Record your thoughts to unlock AI insights!
                </p>
                <button
                  onClick={() => navigate("/journal")}
                  className="primary-button mt-4 text-sm font-bold"
                >
                  Write First Journal
                </button>
              </section>
            )}

            {/* Middle Row: AI Coach Summary & Active Blockers Cards */}
            <div className="grid gap-7 md:grid-cols-2 stagger-in">
              <section className="rounded-3xl p-7 sm:p-8 bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white border border-indigo-200/90 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[320px]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-3.5 py-1 text-xs font-bold text-purple-700 border border-purple-200 shadow-sm">
                      <Sparkles size={16} className="text-purple-600 animate-pulse" />
                      AI ACCOUNTABILITY COACH
                    </span>
                    <button
                      onClick={() => navigate("/coach")}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group transition"
                    >
                      View Report <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>

                  {summary ? (
                    <div className="mt-4">
                      <h4 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3.5 leading-snug tracking-tight">
                        "{summary.headline}"
                      </h4>
                      {summary.coaching_suggestion && (
                        <div className="border-l-4 border-indigo-500 bg-white/90 p-4.5 rounded-r-2xl shadow-sm border border-slate-100 text-base text-slate-700 leading-relaxed font-medium">
                          {summary.coaching_suggestion}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white/80 rounded-2xl border border-indigo-100 my-2">
                      <Sparkles size={32} className="mx-auto text-purple-400 mb-2 animate-pulse" />
                      <p className="text-base text-slate-700 font-bold">No weekly summary generated yet</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Reflect daily to unlock weekly accountability coaching.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-indigo-100">
                  <button
                    onClick={() => navigate("/coach")}
                    className="primary-button w-full py-3.5 text-sm font-bold shadow-md hover:shadow-indigo-200"
                  >
                    <Sparkles size={16} />
                    Open Accountability Coach →
                  </button>
                </div>
              </section>

              <section className="panel p-7 sm:p-8 shadow-md bg-white border border-slate-200 rounded-3xl flex flex-col justify-between hover:shadow-lg transition-all duration-300 min-h-[320px]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3.5 py-1 text-xs font-bold text-rose-700 border border-rose-200 shadow-sm">
                      <AlertTriangle size={16} className="text-rose-500" />
                      ACTIVE BLOCKERS ({recentBlockers.length})
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">From recent logs</span>
                  </div>

                  {recentBlockers.length > 0 ? (
                    <ul className="flex flex-col gap-3 mt-4">
                      {recentBlockers.slice(0, 4).map((b, i) => (
                        <li
                          key={i}
                          className="text-base text-slate-800 flex items-center justify-between gap-3 bg-rose-50/70 p-4 rounded-2xl border border-rose-100 transition-all hover:bg-rose-100/60 font-semibold"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg shrink-0">⚠️</span>
                            <span className="truncate">{b.text}</span>
                          </div>
                          <span className="shrink-0 rounded-lg bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700 capitalize border border-rose-200">
                            {b.category || "other"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-6 my-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mx-auto mb-3 shadow-sm">
                        <CheckCircle2 size={24} />
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mb-1">Zero Active Blockers Detected</h4>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        Your goal momentum is smooth sailing! Keep reflecting to catch future friction early.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => navigate("/journal")}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-800 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                  >
                    View Journal History →
                  </button>
                </div>
              </section>
            </div>

            {/* Active Goals Preview */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-slate-900">Active Goals ({activeGoals.length})</h2>
                <button
                  onClick={() => navigate("/goals")}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                >
                  Manage Goals <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>

              {activeGoals.length === 0 ? (
                <div className="panel p-8 text-center">
                  <p className="text-base text-slate-500 font-medium">No active goals currently defined.</p>
                  <button
                    onClick={() => navigate("/goals")}
                    className="primary-button mt-4 text-sm font-bold"
                  >
                    Set a Goal
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
                  {activeGoals.slice(0, 3).map((goal) => (
                    <div
                      key={goal.id}
                      className="panel p-7 hover:border-indigo-300 cursor-pointer flex flex-col justify-between hover-lift"
                      onClick={() => navigate("/goals")}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-200">
                              On Track
                            </span>
                            {goal.priority && (
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                                goal.priority.includes('High')
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : goal.priority.includes('Low')
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {goal.priority}
                              </span>
                            )}
                          </div>
                          {goal.target_date && (
                            <span className="text-xs text-slate-500 font-mono font-semibold">
                              Due {new Date(goal.target_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-snug">{goal.title}</h3>
                        {goal.description && (
                          <p className="mt-2.5 text-base text-slate-600 line-clamp-2 leading-relaxed font-medium">{goal.description}</p>
                        )}
                        {goal.estimated_days_remaining !== null && goal.estimated_days_remaining !== undefined && (
                          <p className="mt-3 text-xs font-semibold text-indigo-600">
                            ~{goal.estimated_days_remaining} {goal.estimated_days_remaining === 1 ? 'day' : 'days'} to completion
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* AUDITABLE SCORE BREAKDOWN MODAL */}
      {showScoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-rise">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Zap size={20} className="fill-current" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Score Formula Breakdown</h3>
                  <p className="text-xs text-slate-500 font-medium">Deterministic calculation based on your activity</p>
                </div>
              </div>
              <button onClick={() => setShowScoreModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 my-6">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-slate-800">Goal Progress (30%)</p>
                  <p className="text-xs text-slate-500">Average across {activeGoals.length} active goals</p>
                </div>
                <span className="font-bold text-slate-900">{productivityScoreData.goalProgressScore} / 100</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-slate-800">Goal Completion (20%)</p>
                  <p className="text-xs text-slate-500">{completedGoals.length} completed of {goals.length} total</p>
                </div>
                <span className="font-bold text-slate-900">{productivityScoreData.goalCompletionScore} / 100</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-slate-800">Completed Activities (20%)</p>
                  <p className="text-xs text-slate-500">{productivityScoreData.completedActivitiesCount} done (Target: 10/wk)</p>
                </div>
                <span className="font-bold text-slate-900">{productivityScoreData.completedActivitiesScore} / 100</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-slate-800">Journal Consistency (20%)</p>
                  <p className="text-xs text-slate-500">{productivityScoreData.daysJournaled} active days (Target: 5/wk)</p>
                </div>
                <span className="font-bold text-slate-900">{productivityScoreData.journalConsistencyScore} / 100</span>
              </div>

              <div className="flex items-center justify-between text-sm text-rose-600 pt-2 border-t border-slate-100">
                <div>
                  <p className="font-semibold">Blocker Penalty (Deduction)</p>
                  <p className="text-xs text-rose-400">{productivityScoreData.blockerCount} blockers detected (-3 pts each, max -15)</p>
                </div>
                <span className="font-bold">-{productivityScoreData.blockerPenalty} pts</span>
              </div>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-4 flex items-center justify-between border border-indigo-100">
              <span className="text-sm font-bold text-indigo-900">Total Productivity Score</span>
              <span className="text-2xl font-extrabold text-indigo-700">{productivityScoreData.finalScore}/100</span>
            </div>

            <button
              onClick={() => setShowScoreModal(false)}
              className="mt-6 w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, iconBg = "bg-indigo-50", label, value, detail }) {
  return (
    <div className="panel p-6 sm:p-7 shadow-sm flex flex-col justify-between hover-lift">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} shadow-sm transition-transform duration-300 hover:scale-110`}>
        {icon}
      </div>
      <div>
        <p className="mt-5 section-label text-xs font-bold tracking-wider">{label}</p>
        <div className="mt-1.5 flex items-baseline gap-2.5">
          <AnimatedNumber value={value} className="text-4xl font-bold text-slate-900" />
          <span className="text-sm text-slate-500 font-semibold">{detail}</span>
        </div>
      </div>
    </div>
  );
}