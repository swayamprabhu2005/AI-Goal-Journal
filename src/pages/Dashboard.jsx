import { useEffect, useState, useMemo } from "react";
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
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { DashboardSkeleton } from "../components/LoadingSkeleton";
import AnimatedNumber from "../components/AnimatedNumber";
import { progressApi } from "../services/api";
import TrendChart, { formatChange } from "../components/TrendChart";
import MoodBadge, { MOOD_META } from "../components/MoodBadge";

const trendCache = new Map();
const GOAL_COLORS = ["#4B5D3C", "#C1622C", "#2563EB", "#7C3AED", "#059669", "#D97706"];

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

  // --- REAL PROGRESS ANALYTICS & TREND STATE (Panshobh) ---
  const [selectedGoalId, setSelectedGoalId] = useState("all");
  const [trendData, setTrendData] = useState(null);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState(null);

  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeJournals = Array.isArray(journals) ? journals : [];

  const activeGoals = useMemo(
    () => safeGoals.filter((g) => g.status?.toLowerCase() === "active"),
    [safeGoals]
  );

  const displayGoals = useMemo(
    () => safeGoals.filter((g) => g.status?.toLowerCase() !== "archived"),
    [safeGoals]
  );

  // Default to "all" so all goals are rendered on the trajectory by default
  const primaryGoalId = !selectedGoalId || selectedGoalId === "all"
    ? "all"
    : safeGoals.some((g) => g.id === selectedGoalId)
    ? selectedGoalId
    : "all";

  // Multi-series representation for all goals with distinct colors
  const multiSeries = useMemo(() => {
    if (displayGoals.length === 0) return null;
    return displayGoals.slice(0, 8).map((g, idx) => {
      const prog = g.status === "Completed" ? 100 : (g.progress_value || 0);
      const createdDate = g.created_at || g.createdAt || new Date().toISOString();
      return {
        id: g.id,
        label: g.title,
        color: GOAL_COLORS[idx % GOAL_COLORS.length],
        currentProgress: prog,
        points: [
          { progress_value: 0, date: createdDate },
          { progress_value: prog, date: new Date().toISOString() },
        ],
      };
    });
  }, [displayGoals]);

  useEffect(() => {
    if (!primaryGoalId || primaryGoalId === "all") {
      setTrendError(null);
      setIsTrendLoading(false);
      return;
    }

    let isMounted = true;
    if (trendCache.has(primaryGoalId)) {
      setTrendData(trendCache.get(primaryGoalId));
      setIsTrendLoading(false);
      setTrendError(null);
    } else {
      setIsTrendLoading(true);
      setTrendError(null);
    }

    progressApi
      .getProgressTrend(primaryGoalId)
      .then((data) => {
        if (data) trendCache.set(primaryGoalId, data);
        if (isMounted) {
          setTrendData(data);
          setTrendError(null);
        }
      })
      .catch((err) => {
        if (isMounted && !trendCache.has(primaryGoalId)) {
          setTrendError(err?.message || "Failed to load progress trend data");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsTrendLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [primaryGoalId]);

  const selectedTrendGoal = goals.find((g) => g.id === primaryGoalId) || null;

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
  const completedGoals = goals.filter((g) => g.status?.toLowerCase() === "completed");

  const recentBlockers = [];
  journals.slice(0, 5).forEach((j) => {
    const blockers = j.ai_analysis?.blockers || [];
    blockers.forEach((b) => recentBlockers.push(b));
  });

  const recentMoods = journals
    .slice(0, 10)
    .map((j) => j.detected_mood || j.ai_analysis?.detected_mood)
    .filter(Boolean);

  const moodCounts = {};
  recentMoods.forEach((m) => {
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  });

  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || latestJournal?.detected_mood || null;

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

    // 3. Completed Activities (20%) & Consistency (30%) & Blockers (-10%)
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
      0.30 * goalProgressScore +
      0.20 * goalCompletionScore +
      0.20 * completedActivitiesScore +
      0.30 * journalConsistencyScore;

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

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="app-page min-h-screen bg-[#EEF3EC]">
      <header className="border-b border-[#E2E9DF] bg-white/80 backdrop-blur-md px-6 py-5 md:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#26261F] font-serif flex items-center gap-2">
                {greeting}, {name} <span className="animate-wave">👋</span>
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBEBE3] px-3 py-1 text-xs font-bold text-[#C1622C] border border-[#C1622C]/20 shadow-xs">
                <Flame size={15} className="text-[#C1622C] fill-[#C1622C]" /> {streak} days streak
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium">
              Track daily momentum, conquer blockers, and align your activities with your goals.
            </p>
          </div>

          <div>
            <button
              onClick={() => navigate("/journal")}
              className="primary-button px-5 py-2.5 text-xs sm:text-sm font-bold shadow-sm"
            >
              <BookOpen size={16} />
              + New Journal Entry
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 md:px-8">
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Top Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 stagger-in">
              <div
                onClick={() => setShowScoreModal(true)}
                className="panel p-5 shadow-xs flex flex-col justify-between hover-lift cursor-pointer bg-gradient-to-br from-[#E2E9DF]/80 via-white to-[#F4F1E8] border-[#E2E9DF]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4B5D3C] text-white shadow-xs">
                    <Zap size={18} className="fill-current" />
                  </div>
                  <HelpCircle size={16} className="text-slate-400 hover:text-[#4B5D3C]" />
                </div>
                <div>
                  <p className="mt-4 section-label text-[10px] font-extrabold tracking-wider text-[#4B5D3C]">PRODUCTIVITY SCORE</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <AnimatedNumber value={String(productivityScoreData.finalScore)} className="text-3xl font-extrabold text-[#26261F]" />
                    <span className="text-xs text-[#4B5D3C] font-semibold">/ 100</span>
                  </div>
                </div>
              </div>

              <StatCard
                icon={<Target size={18} className="text-[#4B5D3C]" />}
                iconBg="bg-[#E2E9DF]"
                label="ACTIVE GOALS"
                value={String(activeGoals.length)}
                detail="in progress"
              />
              <StatCard
                icon={<CheckCircle2 size={18} className="text-[#4B5D3C]" />}
                iconBg="bg-[#E2E9DF]"
                label="COMPLETED GOALS"
                value={String(completedGoals.length)}
                detail="achieved"
              />
              <StatCard
                icon={<Flame size={18} className="text-[#C1622C]" />}
                iconBg="bg-[#FBEBE3]"
                label="CURRENT STREAK"
                value={String(streak)}
                detail="days active"
              />
              <StatCard
                icon={<AlertTriangle size={18} className="text-[#C1622C]" />}
                iconBg="bg-[#FBEBE3]"
                label="ACTIVE BLOCKERS"
                value={String(recentBlockers.length)}
                detail="identified"
              />
            </div>

            {/* AI Reflection Banner */}
            {latestAnalysis ? (
              <section className="animate-rise rounded-2xl p-6 bg-gradient-to-r from-[#E2E9DF]/80 via-white to-[#F4F1E8] border border-[#E2E9DF] shadow-xs hover-lift">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#4B5D3C] flex items-center gap-2">
                    <Sparkles size={16} className="text-[#4B5D3C] animate-pulse" />
                    Latest AI Reflection Insight
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-semibold">
                    {new Date(latestJournal.created_at || latestJournal.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {latestAnalysis.quick_summary && (
                  <p className="text-lg font-bold text-[#26261F] italic mb-3 leading-relaxed">
                    "{latestAnalysis.quick_summary}"
                  </p>
                )}

                {latestAnalysis.insights?.length > 0 && (
                  <div className="rounded-xl bg-white/95 p-4 border border-[#E2E9DF] text-sm text-[#26261F] shadow-2xs leading-relaxed font-medium">
                    <strong className="text-[#4B5D3C] font-bold">Coach Note:</strong> {latestAnalysis.insights[0]}
                  </div>
                )}
              </section>
            ) : (
              <section className="panel p-6 text-center shadow-xs animate-rise">
                <p className="text-sm text-slate-600 font-medium">
                  You haven't logged any journal entries yet. Record your thoughts to unlock AI insights!
                </p>
                <button
                  onClick={() => navigate("/journal")}
                  className="primary-button mt-3 text-xs font-bold"
                >
                  Write First Journal
                </button>
              </section>
            )}

            {/* Middle Row: AI Coach Summary, Mood Rhythm & Active Blockers Cards */}
            <div className="grid gap-6 lg:grid-cols-3 stagger-in">
              <section className="rounded-2xl p-6 bg-gradient-to-br from-[#E2E9DF]/70 via-white to-[#F4F1E8] border border-[#E2E9DF] shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300 min-h-[280px]">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E2E9DF] px-3 py-0.5 text-xs font-extrabold text-[#4B5D3C] border border-[#4B5D3C]/20 shadow-2xs">
                      <Sparkles size={14} className="text-[#4B5D3C] animate-pulse" />
                      AI COACH
                    </span>
                    <button
                      onClick={() => navigate("/coach")}
                      className="text-xs font-bold text-[#4B5D3C] hover:text-[#3A492E] flex items-center gap-1 group transition"
                    >
                      View Report <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </div>

                  {summary ? (
                    <div className="mt-3">
                      <h4 className="text-lg sm:text-xl font-bold text-[#26261F] mb-3 leading-snug tracking-tight">
                        "{summary.headline}"
                      </h4>
                      {summary.coaching_suggestion && (
                        <div className="border-l-4 border-[#4B5D3C] bg-white/90 p-4 rounded-r-xl shadow-2xs border border-[#E2E9DF] text-sm text-[#26261F] leading-relaxed font-medium">
                          {summary.coaching_suggestion}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/80 rounded-xl border border-[#E2E9DF] my-2">
                      <Sparkles size={28} className="mx-auto text-[#4B5D3C] mb-2 animate-pulse" />
                      <p className="text-sm text-[#26261F] font-bold">No weekly summary generated yet</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Reflect daily to unlock weekly AI coaching summaries.</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[#E2E9DF]">
                  <button
                    onClick={() => navigate("/coach")}
                    className="primary-button w-full py-2.5 text-xs font-bold shadow-xs"
                  >
                    <Sparkles size={15} />
                    Open AI Coach →
                  </button>
                </div>
              </section>

              {/* Card 2: Emotional State & Mood Rhythm */}
              <section className="rounded-2xl p-6 bg-gradient-to-br from-[#F4F1E8] via-white to-[#E2E9DF]/70 border border-[#E2E9DF] shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300 min-h-[280px]">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E2E9DF] px-3 py-0.5 text-xs font-extrabold text-[#4B5D3C] border border-[#4B5D3C]/20 shadow-2xs">
                      <span className="text-sm">🌿</span>
                      MOOD RHYTHM & WELL-BEING
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">10-Class AI</span>
                  </div>

                  {dominantMood ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Current Emotional State
                        </p>
                        <MoodBadge
                          mood={dominantMood}
                          confidence={latestJournal?.mood_confidence || 0.85}
                          keywords={latestJournal?.trigger_keywords || []}
                          size="md"
                        />
                      </div>

                      {Object.keys(moodCounts).length > 0 && (
                        <div className="pt-2 border-t border-[#E2E9DF]">
                          <p className="text-[11px] font-bold text-slate-500 mb-1.5">
                            Recent Reflection Spectrum:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(moodCounts).map(([m, cnt]) => {
                              const meta = MOOD_META[m] || { label: m, emoji: "💭" };
                              return (
                                <span
                                  key={m}
                                  className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-[#E2E9DF] shadow-2xs"
                                >
                                  <span>{meta.emoji}</span>
                                  <span>{meta.label}</span>
                                  <span className="text-[#4B5D3C] font-extrabold font-mono">×{cnt}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/80 rounded-xl border border-[#E2E9DF] my-2">
                      <span className="text-2xl mb-1 block">🌿</span>
                      <p className="text-sm text-[#26261F] font-bold">No emotional data yet</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Log a reflection to track your cognitive state & mood patterns.</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[#E2E9DF]">
                  <button
                    onClick={() => navigate("/journal")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F4F1E8] px-4 py-2.5 text-xs font-bold text-[#26261F] border border-[#E2E9DF] hover:bg-[#E2E9DF] hover:text-[#4B5D3C] transition-all shadow-2xs"
                  >
                    Check Emotional Trends →
                  </button>
                </div>
              </section>

              <section className="panel p-6 shadow-xs bg-white border border-[#E2E9DF] rounded-2xl flex flex-col justify-between hover:shadow-md transition-all duration-300 min-h-[280px]">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FBEBE3] px-3 py-0.5 text-xs font-bold text-[#C1622C] border border-[#C1622C]/20 shadow-2xs">
                      <AlertTriangle size={14} className="text-[#C1622C]" />
                      ACTIVE BLOCKERS ({recentBlockers.length})
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">From recent logs</span>
                  </div>

                  {recentBlockers.length > 0 ? (
                    <ul className="flex flex-col gap-2.5 mt-3">
                      {recentBlockers.slice(0, 4).map((b, i) => (
                        <li
                          key={i}
                          className="text-sm text-[#26261F] flex items-center justify-between gap-3 bg-[#FBEBE3]/60 p-3 rounded-xl border border-[#C1622C]/15 transition-all hover:bg-[#FBEBE3] font-semibold"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">⚠️</span>
                            <span className="truncate">{b.text}</span>
                          </div>
                          <span className="shrink-0 rounded-lg bg-[#FBEBE3] px-2.5 py-0.5 text-[11px] font-bold text-[#C1622C] capitalize border border-[#C1622C]/20">
                            {b.category || "other"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-xl bg-[#E2E9DF]/60 border border-[#E2E9DF] p-5 my-2 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4B5D3C] text-white mx-auto mb-2 shadow-xs">
                        <CheckCircle2 size={20} />
                      </div>
                      <h4 className="text-sm font-bold text-[#26261F] mb-1">Zero Active Blockers Detected</h4>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        Your goal momentum is smooth sailing! Keep reflecting to catch future friction early.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[#E2E9DF]">
                  <button
                    onClick={() => navigate("/journal")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#F4F1E8] px-4 py-2.5 text-xs font-bold text-[#26261F] border border-[#E2E9DF] hover:bg-[#E2E9DF] hover:text-[#4B5D3C] transition-all shadow-2xs"
                  >
                    View Journal History →
                  </button>
                </div>
              </section>
            </div>

        {/* FOCUS NEXT SPOTLIGHT COMPONENT */}
        {(() => {
          const activeList = goals.filter((g) => g.status !== 'Completed' && (g.progress_value || 0) < 100);
          if (activeList.length === 0) return null;

          // Derive top priority goal dynamically
          const focusGoal = activeList.sort((a, b) => {
            const pA = (a.priority || '').includes('High') ? 3 : (a.priority || '').includes('Medium') ? 2 : 1;
            const pB = (b.priority || '').includes('High') ? 3 : (b.priority || '').includes('Medium') ? 2 : 1;
            return pB - pA;
          })[0];

          const diffDays = focusGoal.target_date
            ? Math.round((new Date(focusGoal.target_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))
            : null;

          const reason = `${focusGoal.priority || 'High Priority'}${
            diffDays !== null ? (diffDays < 0 ? `, ${Math.abs(diffDays)}d overdue` : diffDays === 0 ? ', due today' : `, due in ${diffDays}d`) : ''
          }, currently at ${focusGoal.progress_value || 0}% progress.`;

          const nextAction = (focusGoal.progress_value || 0) < 50
            ? `Dedicate a 45-minute focus session to push past 50%.`
            : `Complete final deliverables and wrap up this milestone.`;

          return (
            <section className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-[#26261F] via-[#3A492E] to-[#4B5D3C] text-[#F4F1E8] shadow-md">
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E2E9DF]/20 px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#E2E9DF] border border-[#E2E9DF]/30">
                  <Zap size={13} className="fill-[#E2E9DF] text-[#E2E9DF]" /> Focus Next
                </span>
                <span className="text-xs text-[#E2E9DF]/80 font-mono">
                  {focusGoal.category || 'Milestone'}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold text-white tracking-tight">{focusGoal.title}</h3>
                  <p className="text-xs text-[#E2E9DF]">
                    <strong className="text-white">Reason:</strong> {reason}
                  </p>
                  <div className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-[#E2E9DF] border border-white/15">
                    <strong>Next Action:</strong> {nextAction}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/goals')}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#26261F] shadow-xs hover:bg-[#E2E9DF] transition"
                >
                  Open Goal Milestone →
                </button>
              </div>
            </section>
          );
        })()}           
            
        {/* PROGRESS ANALYTICS & REAL-TIME TREND SECTION */}
        <section className="panel p-5 sm:p-6 shadow-xs bg-white rounded-2xl border border-[#E2E9DF]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-[#E2E9DF]">
            <div>
              <span className="section-label text-[#4B5D3C]">PROGRESS ANALYTICS</span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <h2 className="text-xl font-bold text-[#26261F]">
                  Progress History & Trend
                </h2>
                {trendData?.trend_direction && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                    trendData.trend_direction === 'improving'
                      ? 'bg-[#E2E9DF] text-[#4B5D3C] border-[#4B5D3C]/30'
                      : trendData.trend_direction === 'declining'
                      ? 'bg-[#FBEBE3] text-[#C1622C] border-[#C1622C]/30'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {trendData.trend_direction}
                  </span>
                )}
                {(selectedTrendGoal?.status?.toLowerCase() === "completed" || (selectedTrendGoal?.progress_value || 0) >= 100) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border bg-[#E2E9DF] text-[#4B5D3C] border-[#4B5D3C]/30">
                    <CheckCircle2 size={11} className="text-[#4B5D3C]" />
                    Completed
                  </span>
                )}
              </div>
              {primaryGoalId === "all" ? (
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Tracking: <strong className="text-[#26261F]">All Active Goals ({activeGoals.length})</strong>
                </p>
              ) : selectedTrendGoal ? (
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Tracking: <strong className="text-[#26261F]">{selectedTrendGoal.title}</strong>
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2.5">
              {goals.length > 1 && (
                <div className="relative">
                  <select
                    value={primaryGoalId || ""}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="appearance-none rounded-xl border border-[#E2E9DF] bg-white pl-3 pr-8 py-1.5 text-xs font-semibold text-[#26261F] shadow-2xs transition focus:border-[#4B5D3C] focus:ring-1 focus:ring-[#4B5D3C]"
                    aria-label="Select goal for trend chart"
                  >
                    <option value="all">All Active Goals</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title || "Untitled Goal"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              )}

              <button
                onClick={() => navigate("/progress")}
                className="text-xs font-bold text-[#4B5D3C] hover:text-[#3A492E] flex items-center gap-1 transition shrink-0"
              >
                Full Analytics <ArrowUpRight size={14} />
              </button>
            </div>
          </div>

          {goals.length === 0 ? (
            <div className="py-10 text-center rounded-xl bg-[#F4F1E8]/50 border border-[#E2E9DF]">
              <Target size={32} className="mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-bold text-[#26261F]">No active goals yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create a goal milestone to track historical progress curves, trend velocity, and checkpoints.
              </p>
              <button
                onClick={() => navigate("/goals")}
                className="primary-button mt-3 text-xs font-bold py-2 px-3.5"
              >
                + Create Goal
              </button>
            </div>
          ) : isTrendLoading ? (
            <div className="space-y-3 animate-pulse py-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-slate-100" />
                ))}
              </div>
              <div className="h-48 w-full rounded-xl bg-slate-100 mt-3" />
            </div>
          ) : trendError ? (
            <div className="rounded-xl border border-[#C1622C]/30 bg-[#FBEBE3] p-4 text-center">
              <p className="text-xs font-semibold text-[#C1622C] mb-2">{trendError}</p>
              <button
                onClick={() => {
                  if (primaryGoalId) {
                    setIsTrendLoading(true);
                    setTrendError(null);
                    progressApi.getProgressTrend(primaryGoalId)
                      .then((data) => setTrendData(data))
                      .catch((e) => setTrendError(e?.message || "Failed to load trend"))
                      .finally(() => setIsTrendLoading(false));
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#C1622C] text-white hover:bg-[#A75223] shadow-xs transition"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-[#F4F1E8]/70 p-3.5 border border-[#E2E9DF] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {primaryGoalId === "all" ? "Average Progress" : "Current Progress"}
                  </span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-[#26261F]">
                      {primaryGoalId === "all"
                        ? (displayGoals.length > 0
                            ? Math.round(displayGoals.reduce((sum, g) => sum + (g.status === "Completed" ? 100 : (g.progress_value || 0)), 0) / displayGoals.length)
                            : 0)
                        : (trendData?.current_progress ?? (selectedTrendGoal?.progress_value || 0))}%
                    </span>
                    <div className="w-14 h-2 rounded-full bg-[#E2E9DF] overflow-hidden">
                      <div
                        className="h-full bg-[#4B5D3C] rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, primaryGoalId === "all"
                            ? (displayGoals.length > 0 ? Math.round(displayGoals.reduce((sum, g) => sum + (g.status === "Completed" ? 100 : (g.progress_value || 0)), 0) / displayGoals.length) : 0)
                            : (trendData?.current_progress ?? (selectedTrendGoal?.progress_value || 0)))}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    {primaryGoalId === "all" ? "Across all active & completed goals" : "Goal milestone completion"}
                  </span>
                </div>

                <div className="rounded-xl bg-[#F4F1E8]/70 p-3.5 border border-[#E2E9DF] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {primaryGoalId === "all" ? "Goals Portfolio" : "Recent Trend"}
                  </span>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E2E9DF] text-[#4B5D3C]">
                      <TrendingUp size={16} />
                    </div>
                    <span className="text-lg font-bold text-[#26261F] capitalize">
                      {primaryGoalId === "all"
                        ? `${displayGoals.length} Tracked`
                        : (trendData?.trend_direction || "Stagnant")}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    {primaryGoalId === "all"
                      ? `${completedGoals.length} completed, ${displayGoals.length - completedGoals.length} active`
                      : (trendData?.history?.length > 1
                        ? `${formatChange(trendData.history[trendData.history.length - 1].change_from_previous)} on last update`
                        : "Baseline established")}
                  </span>
                </div>

                <div className="rounded-xl bg-[#F4F1E8]/70 p-3.5 border border-[#E2E9DF] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {primaryGoalId === "all" ? "Top Milestone" : "Net Milestone Gain"}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold text-[#4B5D3C]">
                      {primaryGoalId === "all"
                        ? (displayGoals.length > 0
                            ? `${Math.max(...displayGoals.map((g) => g.status === "Completed" ? 100 : (g.progress_value || 0)))}%`
                            : "0%")
                        : formatChange(trendData?.net_change || 0)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-[200px]">
                    {primaryGoalId === "all"
                      ? (displayGoals.slice().sort((a, b) => (b.progress_value || 0) - (a.progress_value || 0))[0]?.title || "None")
                      : `From initial ${trendData?.initial_progress ?? 0}% baseline`}
                  </span>
                </div>

                <div className="rounded-xl bg-[#F4F1E8]/70 p-3.5 border border-[#E2E9DF] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {primaryGoalId === "all" ? "Active Goal Series" : "Checkpoints Logged"}
                  </span>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-[#26261F]">
                      {primaryGoalId === "all" ? displayGoals.length : (trendData?.total_updates ?? 0)}
                    </span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E2E9DF] text-[#4B5D3C]">
                      <Target size={16} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium mt-1">
                    {primaryGoalId === "all" ? "Visualized in trajectory chart" : "Historical progress entries"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white p-4 border border-[#E2E9DF]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#26261F] uppercase tracking-wider">Progress Trajectory</span>
                  <span className="text-[11px] text-slate-400 font-medium">Timeline checkpoints (0 - 100%)</span>
                </div>
                {primaryGoalId === "all" && multiSeries ? (
                  <TrendChart multiSeries={multiSeries} />
                ) : (
                  <TrendChart data={trendData?.history || []} />
                )}
              </div>
            </div>
          )}
        </section>
            
        {/* Active Goals Preview */}
        <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#26261F]">Active Goals ({activeGoals.length})</h2>
                <button
                  onClick={() => navigate("/goals")}
                  className="text-xs font-bold text-[#4B5D3C] hover:text-[#3A492E] flex items-center gap-1 group"
                >
                  Manage Goals <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>

              {activeGoals.length === 0 ? (
                <div className="panel p-6 text-center">
                  <p className="text-sm text-slate-500 font-medium">No active goals currently defined.</p>
                  <button
                    onClick={() => navigate("/goals")}
                    className="primary-button mt-3 text-xs font-bold"
                  >
                    Set a Goal
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
                  {activeGoals.slice(0, 3).map((goal) => (
                    <div
                      key={goal.id}
                      className="panel p-5 hover:border-[#4B5D3C] cursor-pointer flex flex-col justify-between hover-lift"
                      onClick={() => navigate("/goals")}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-full bg-[#E2E9DF] px-2.5 py-0.5 text-[10px] font-bold text-[#4B5D3C] border border-[#4B5D3C]/20">
                              On Track
                            </span>
                            {goal.priority && (
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                                goal.priority.includes('High')
                                  ? 'bg-[#FBEBE3] text-[#C1622C] border-[#C1622C]/30'
                                  : goal.priority.includes('Low')
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-[#E2E9DF] text-[#4B5D3C] border border-[#4B5D3C]/30'
                              }`}>
                                {goal.priority}
                              </span>
                            )}
                          </div>
                          {goal.target_date && (
                            <span className="text-[11px] text-slate-500 font-mono font-semibold">
                              Due {new Date(goal.target_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-[#26261F] leading-snug">{goal.title}</h3>
                        {goal.description && (
                          <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">{goal.description}</p>
                        )}
                        {goal.estimated_days_remaining !== null && goal.estimated_days_remaining !== undefined && (
                          <p className="mt-2 text-[11px] font-semibold text-[#4B5D3C]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#26261F]/40 backdrop-blur-sm p-4">
          <div className="relative my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#E2E9DF] animate-rise max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E9DF]">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4B5D3C] text-white">
                  <Zap size={18} className="fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#26261F]">Score Formula Breakdown</h3>
                  <p className="text-xs text-slate-500 font-medium">Deterministic calculation based on activity</p>
                </div>
              </div>
              <button onClick={() => setShowScoreModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 my-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#26261F]">Goal Progress (30%)</p>
                  <p className="text-[10px] text-slate-500">Average across {activeGoals.length} active goals</p>
                </div>
                <span className="font-bold text-[#26261F]">{productivityScoreData.goalProgressScore} / 100</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#26261F]">Goal Completion (20%)</p>
                  <p className="text-[10px] text-slate-500">{completedGoals.length} completed of {goals.length} total</p>
                </div>
                <span className="font-bold text-[#26261F]">{productivityScoreData.goalCompletionScore} / 100</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#26261F]">Completed Activities (20%)</p>
                  <p className="text-[10px] text-slate-500">{productivityScoreData.completedActivitiesCount} done (Target: 10/wk)</p>
                </div>
                <span className="font-bold text-[#26261F]">{productivityScoreData.completedActivitiesScore} / 100</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#26261F]">Journal Consistency (30%)</p>
                  <p className="text-[10px] text-slate-500">{productivityScoreData.daysJournaled} active days (Target: 5/wk)</p>
                </div>
                <span className="font-bold text-[#26261F]">{productivityScoreData.journalConsistencyScore} / 100</span>
              </div>

              <div className="flex items-center justify-between text-[#C1622C] pt-2 border-t border-[#E2E9DF]">
                <div>
                  <p className="font-semibold">Blocker Penalty (Deduction)</p>
                  <p className="text-[10px] opacity-80">{productivityScoreData.blockerCount} blockers detected (-3 pts each)</p>
                </div>
                <span className="font-bold">-{productivityScoreData.blockerPenalty} pts</span>
              </div>
            </div>

            <div className="rounded-xl bg-[#E2E9DF] p-3 flex items-center justify-between border border-[#4B5D3C]/20">
              <span className="text-xs font-bold text-[#26261F]">Total Productivity Score</span>
              <span className="text-xl font-extrabold text-[#4B5D3C]">{productivityScoreData.finalScore}/100</span>
            </div>

            <button
              onClick={() => setShowScoreModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#26261F] text-white font-bold text-xs hover:bg-[#3A492E] transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, iconBg = "bg-[#E2E9DF]", label, value, detail }) {
  return (
    <div className="panel p-5 shadow-xs flex flex-col justify-between hover-lift">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} shadow-2xs transition-transform duration-300 hover:scale-105`}>
        {icon}
      </div>
      <div>
        <p className="mt-4 section-label text-[10px] font-extrabold tracking-wider">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <AnimatedNumber value={value} className="text-3xl font-bold text-[#26261F]" />
          <span className="text-xs text-slate-500 font-semibold">{detail}</span>
        </div>
      </div>
    </div>
  );
}