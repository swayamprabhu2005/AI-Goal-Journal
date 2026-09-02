import {
  Sparkles,
  TrendingUp,
  Target,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Insights() {
  const navigate = useNavigate();

  const insights = [
    {
      icon: TrendingUp,
      title: "Your consistency is improving",
      text: "You have been showing up regularly. Keeping the habit small and consistent can help maintain your momentum.",
    },
    {
      icon: Target,
      title: "Focus on one priority",
      text: "Choose one important goal for the next few days and give it your main attention.",
    },
    {
      icon: BookOpen,
      title: "Reflection can reveal patterns",
      text: "Your journal entries can help you notice what improves or affects your productivity.",
    },
  ];

  return (
    <div className="app-page bg-slate-50 min-h-screen">
      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10 animate-rise">
        <section className="rounded-2xl p-7 md:p-9 bg-gradient-to-r from-indigo-600 to-indigo-800 border border-indigo-700 shadow-md text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md text-white">
            <Sparkles size={22} />
          </div>

          <h2 className="mt-6 text-2xl font-bold text-white">
            Your personal growth snapshot
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-indigo-100 font-medium">
            Your progress is built from the small actions you take every day. Keep your goals realistic, reflect regularly, and focus on consistency rather than perfection.
          </p>

          <button
            onClick={() => navigate("/progress")}
            className="mt-6 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition shadow-sm"
          >
            View progress
            <ArrowUpRight size={14} />
          </button>
        </section>

        <div className="mt-6 grid gap-5 md:grid-cols-3 stagger-in">
          {insights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="panel p-6 shadow-sm hover-lift">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon size={18} />
                </div>
                <h3 className="mt-5 font-bold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 font-medium">{item.text}</p>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
