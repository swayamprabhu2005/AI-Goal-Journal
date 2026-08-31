import {
  Sparkles,
  TrendingUp,
  Target,
  BookOpen,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";

export default function Insights() {
  const navigate = useNavigate();
  const { journals = [], goals = [] } = useData();

  const activeGoals = goals.filter((g) => g.status === "Active");
  const completedGoals = goals.filter((g) => g.status === "Completed");

  // Extract all blockers from journals
  const extractedBlockers = [];
  journals.forEach((j) => {
    const blockers = j.ai_analysis?.blockers || [];
    blockers.forEach((b) => {
      extractedBlockers.push({
        text: b.text,
        category: b.category || "other",
        date: new Date(j.created_at || j.createdAt).toLocaleDateString(),
      });
    });
  });

  // Extract key activities
  const extractedActivities = [];
  journals.slice(0, 3).forEach((j) => {
    const acts = j.ai_analysis?.activities || [];
    acts.forEach((a) => extractedActivities.push(a));
  });

  return (
    <div className="app-page">
      <header className="border-b border-slate-200 bg-white px-5 py-7 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1250px]">
          <p className="section-label">PERSONAL INTELLIGENCE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            AI Pattern Insights
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Real-time pattern recognition synthesized from your daily reflections and goal velocity.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10 space-y-6">
        <section className="panel p-7 md:p-9 bg-gradient-to-br from-teal-700 to-teal-800 text-white border border-teal-600 shadow-glow">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-teal-800 shadow-md">
            <Sparkles size={22} />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-white">
            Your Personal Growth Snapshot
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-teal-100">
            You currently have <strong className="text-white font-bold">{activeGoals.length} active goals</strong> and <strong className="text-white font-bold">{completedGoals.length} completed milestones</strong> across {journals.length} daily reflection journals.
          </p>

          <button
            onClick={() => navigate("/progress")}
            className="mt-6 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-teal-800 hover:bg-teal-50 transition shadow-sm"
          >
            View Progress Metrics
            <ArrowUpRight size={14} />
          </button>
        </section>

        {/* DYNAMIC EXTRACTED BLOCKERS CARD */}
        {extractedBlockers.length > 0 && (
          <section className="panel p-6 bg-red-50/50 border border-red-200 shadow-card">
            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-600" /> Active Blockers Identified ({extractedBlockers.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {extractedBlockers.map((b, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-red-200 shadow-sm text-xs">
                  <span className="font-bold text-red-700 block line-clamp-1">{b.text}</span>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="uppercase font-semibold text-slate-500">Category: {b.category}</span>
                    <span>{b.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <article className="panel p-6 shadow-card bg-white border border-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <TrendingUp size={18} />
            </div>
            <h3 className="mt-5 font-bold text-slate-900">Consistency Pattern</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Logged {journals.length} reflections. Daily conversational logging increases goal completion probability by 42%.
            </p>
          </article>

          <article className="panel p-6 shadow-card bg-white border border-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <Target size={18} />
            </div>
            <h3 className="mt-5 font-bold text-slate-900">Goal Alignment</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {activeGoals.length > 0 ? `${activeGoals.length} goals in progress. Focus on your highest priority milestone.` : 'Set an active goal to align daily reflections.'}
            </p>
          </article>

          <article className="panel p-6 shadow-card bg-white border border-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <BookOpen size={18} />
            </div>
            <h3 className="mt-5 font-bold text-slate-900">Extracted Activities</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {extractedActivities.length > 0 ? (
                extractedActivities.slice(0, 3).map((act, i) => (
                  <li key={i} className="flex items-center gap-1.5 line-clamp-1">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>{act.text}</span>
                  </li>
                ))
              ) : (
                <li>Submit daily reflections to view extracted activities.</li>
              )}
            </ul>
          </article>
        </div>
      </main>
    </div>
  );
}
