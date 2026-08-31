import { useEffect } from "react";
import {
  Target,
  BookOpen,
  Flame,
  ArrowUpRight,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

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

  useEffect(() => {
    fetchAllData({ quiet: true });
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

  const name = profile?.display_name || user?.displayName || user?.email?.split("@")[0] || "there";

  return (
    <div className="app-page">
      <header className="border-b border-border bg-surface px-5 py-7 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1250px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="section-label">OVERVIEW</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-cream">
              Welcome back, {name}
            </h1>
            <p className="mt-2 text-sm text-beige/60">
              Track daily momentum, conquer blockers, and align your activities with your goals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/journal")}
              className="flex items-center gap-2 rounded-xl bg-surface2 px-4 py-2.5 text-xs font-semibold text-cream border border-border hover:bg-wine/40 transition"
            >
              <BookOpen size={15} />
              New Journal
            </button>
            <button
              onClick={() => navigate("/goals")}
              className="primary-button"
            >
              <Plus size={15} />
              New Goal
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10">
        {loading ? (
          <section className="panel px-6 py-20 text-center shadow-card">
            <p className="text-sm text-beige/55">Loading productivity metrics…</p>
          </section>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Key Metrics Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Target size={18} />}
                label="ACTIVE GOALS"
                value={String(activeGoals.length)}
                detail="in progress"
              />
              <StatCard
                icon={<CheckCircle2 size={18} />}
                label="COMPLETED GOALS"
                value={String(completedGoals.length)}
                detail="achieved"
              />
              <StatCard
                icon={<Flame size={18} />}
                label="CURRENT STREAK"
                value={String(streak)}
                detail="days in a row"
              />
              <StatCard
                icon={<AlertTriangle size={18} />}
                label="ACTIVE BLOCKERS"
                value={String(recentBlockers.length)}
                detail="identified"
              />
            </div>

            {/* AI Reflection Banner */}
            {latestAnalysis ? (
              <section className="panel p-6 bg-gradient-to-br from-burgundy/60 to-surface border border-border shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-beige flex items-center gap-1.5">
                    <Sparkles size={16} className="text-cream" />
                    Latest AI Reflection Insight
                  </span>
                  <span className="text-[11px] text-beige/50 font-mono">
                    {new Date(latestJournal.created_at || latestJournal.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {latestAnalysis.quick_summary && (
                  <p className="text-sm font-medium text-cream italic mb-3 leading-relaxed">
                    "{latestAnalysis.quick_summary}"
                  </p>
                )}

                {latestAnalysis.insights?.length > 0 && (
                  <div className="rounded-xl bg-surface2 p-3.5 border border-border text-xs text-beige/80">
                    <strong className="text-cream font-semibold">Coach Note:</strong> {latestAnalysis.insights[0]}
                  </div>
                )}
              </section>
            ) : (
              <section className="panel p-6 text-center shadow-card">
                <p className="text-xs text-beige/60">
                  You haven't logged any journal entries yet. Record your thoughts to unlock AI insights!
                </p>
                <button
                  onClick={() => navigate("/journal")}
                  className="primary-button mt-3"
                >
                  Write First Journal
                </button>
              </section>
            )}

            {/* Middle Row: AI Coach Summary & Active Blockers */}
            <div className="grid gap-6 md:grid-cols-2">
              <section className="panel p-6 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="section-label flex items-center gap-1.5">
                      <Sparkles size={14} className="text-cream" />
                      AI ACCOUNTABILITY COACH
                    </h3>
                    <button
                      onClick={() => navigate("/coach")}
                      className="text-xs font-semibold text-cream hover:underline flex items-center gap-1"
                    >
                      View Report <ArrowUpRight size={13} />
                    </button>
                  </div>

                  {summary ? (
                    <div>
                      <h4 className="text-base font-bold text-cream mb-2 leading-snug">
                        "{summary.headline}"
                      </h4>
                      {summary.coaching_suggestion && (
                        <p className="text-xs text-beige/70 line-clamp-3 bg-surface2 p-3 rounded-xl border border-border leading-relaxed">
                          {summary.coaching_suggestion}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-beige/50">
                        No weekly summary generated yet.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border">
                  <button
                    onClick={() => navigate("/coach")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-surface2 px-4 py-2.5 text-xs font-semibold text-cream border border-border hover:bg-wine/40 transition"
                  >
                    Open Accountability Coach
                  </button>
                </div>
              </section>

              <section className="panel p-6 shadow-card flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="section-label flex items-center gap-1.5 text-red-400">
                      <AlertTriangle size={14} />
                      ACTIVE BLOCKERS ({recentBlockers.length})
                    </h3>
                    <span className="text-[11px] text-beige/40">From recent logs</span>
                  </div>

                  {recentBlockers.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {recentBlockers.slice(0, 4).map((b, i) => (
                        <li
                          key={i}
                          className="text-xs text-cream flex items-center justify-between gap-2 bg-red-950/20 p-2.5 rounded-xl border border-red-900/30"
                        >
                          <span className="truncate">{b.text}</span>
                          <span className="shrink-0 rounded bg-red-900/30 px-2 py-0.5 text-[10px] font-bold text-red-300 capitalize">
                            {b.category || "other"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-beige/50 italic py-6 text-center">
                      Zero blockers detected in your recent reflections. Smooth sailing!
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border">
                  <button
                    onClick={() => navigate("/journal")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-surface2 px-4 py-2.5 text-xs font-semibold text-beige/70 border border-border hover:text-cream transition"
                  >
                    View Journal History →
                  </button>
                </div>
              </section>
            </div>

            {/* Active Goals Preview */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-cream">Active Goals ({activeGoals.length})</h2>
                <button
                  onClick={() => navigate("/goals")}
                  className="text-xs font-semibold text-cream hover:underline flex items-center gap-1"
                >
                  Manage Goals <ArrowUpRight size={13} />
                </button>
              </div>

              {activeGoals.length === 0 ? (
                <div className="panel p-6 text-center">
                  <p className="text-xs text-beige/60">No active goals currently defined.</p>
                  <button
                    onClick={() => navigate("/goals")}
                    className="primary-button mt-3"
                  >
                    Set a Goal
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {activeGoals.slice(0, 3).map((goal) => (
                    <div
                      key={goal.id}
                      className="panel p-5 hover:border-burgundy transition cursor-pointer"
                      onClick={() => navigate("/goals")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="rounded bg-wine/30 px-2.5 py-0.5 text-[10px] font-bold text-cream border border-wine/50 uppercase">
                          {goal.category || "Goal"}
                        </span>
                        {goal.target_date && (
                          <span className="text-[10px] text-beige/40 font-mono">
                            Due {new Date(goal.target_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-cream leading-snug">{goal.title}</h3>
                      {goal.description && (
                        <p className="mt-1 text-xs text-beige/60 line-clamp-2">{goal.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="panel p-5 shadow-card">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wine/25 text-cream">
        {icon}
      </div>
      <p className="mt-5 section-label">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-cream">{value}</span>
        <span className="text-[11px] text-beige/45">{detail}</span>
      </div>
    </div>
  );
}