import { useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import Reveal from "../components/Reveal";
import { Target, Mic, Sparkles, Trophy, ArrowRight } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Public Header */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-24 md:pb-32 px-5 md:px-8">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none animate-orb" />
        <div className="absolute top-10 left-[8%] h-40 w-40 rounded-full bg-violet-200/40 blur-3xl pointer-events-none animate-orb" style={{ animationDelay: "1.2s" }} />
        <div className="absolute bottom-10 right-[12%] h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none animate-orb" style={{ animationDelay: "2s" }} />

        <div className="relative mx-auto max-w-[1250px] text-center">
          {/* Tagline Pill */}
          <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-md mb-6">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>AI Journal & Accountability Coach</span>
          </div>

          {/* Main Headline */}
          <h1 className="animate-rise text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12] max-w-4xl mx-auto" style={{ animationDelay: "80ms" }}>
            Turn daily reflections into structured momentum.
          </h1>

          {/* Subheading */}
          <p className="animate-rise mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium" style={{ animationDelay: "140ms" }}>
            Speak or write naturally about your day. Google Gemini and local Whisper AI extract completed activities, identify blockers, track goals, and deliver weekly accountability coaching.
          </p>

          {/* Action CTAs */}
          <div className="animate-rise mt-8 flex flex-col sm:flex-row items-center justify-center gap-3" style={{ animationDelay: "200ms" }}>
            <button
              onClick={() => navigate("/register")}
              className="primary-button w-full sm:w-auto px-7 py-3.5 text-sm"
            >
              Start Journaling Free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition shadow-sm"
            >
              Sign In to Workspace
            </button>
          </div>

          <p className="mt-3.5 text-xs text-slate-500 font-medium">
            No credit card required • Local CPU Whisper speech-to-text • Zero cloud audio fees
          </p>

          {/* Visual Interactive Preview */}
          <div className="animate-rise mt-14 mx-auto max-w-4xl panel p-5 sm:p-7 shadow-lg border border-slate-200 bg-white text-left hover-lift" style={{ animationDelay: "280ms" }}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-bold text-slate-900">Interactive AI Extraction Pipeline Preview</span>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-600 border border-indigo-100">
                Live Engine • Gemini Flash-Lite
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Raw Journal Input Box */}
              <div className="flex flex-col justify-between rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <Mic size={14} className="text-indigo-600" /> Daily Reflection (Voice or Text)
                    </span>
                    <span className="text-[10px] bg-indigo-600 px-2 py-0.5 rounded text-white font-bold">Raw Input</span>
                  </div>
                  <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200 font-medium">
                    "Finished implementing backend routing and in-memory repositories today. Currently writing the automated unit test suite. Was delayed for 20 minutes by CORS headers. Tomorrow I will connect the voice recorder."
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>🎙️ Transcribed locally via faster-whisper Tiny</span>
                  <span className="font-mono">42 words</span>
                </div>
              </div>

              {/* Structured AI Analysis Box */}
              <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white p-4 border border-indigo-200 shadow-sm">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-900 mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-purple-600" /> Structured AI Breakdown
                    </span>
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] text-purple-700 font-bold border border-purple-200">
                      Mood: Motivated (95%)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="rounded bg-white p-2.5 border border-indigo-100 text-[11px] flex items-center gap-2 shadow-sm font-medium">
                      <span className="font-bold text-emerald-600 uppercase text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                        Completed
                      </span>
                      <span className="text-slate-800">FastAPI routes & in-memory repositories</span>
                    </div>

                    <div className="rounded bg-white p-2.5 border border-indigo-100 text-[11px] flex items-center gap-2 shadow-sm font-medium">
                      <span className="font-bold text-indigo-600 uppercase text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 shrink-0">
                        Ongoing
                      </span>
                      <span className="text-slate-800">Writing automated unit test suite</span>
                    </div>

                    <div className="rounded bg-white p-2.5 border border-indigo-100 text-[11px] flex items-center gap-2 shadow-sm font-medium">
                      <span className="font-bold text-red-600 uppercase text-[9px] bg-red-50 px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                        Blocker
                      </span>
                      <span className="text-red-600 font-semibold">CORS headers configuration (20m)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-indigo-100 text-[11px] text-slate-700 font-medium">
                  <strong className="text-indigo-600 font-bold">Coach Insight:</strong> Great momentum. Timebox configuration spikes to 30m to maintain creative energy.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section id="features" className="py-20 px-5 md:px-8 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-[1250px]">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <span className="section-label">CORE CAPABILITIES</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">
              Designed to eliminate manual productivity friction.
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed font-medium">
              Traditional goal apps require manual status logging and rigid checkboxes. Goal Journal lets you speak naturally and uses AI to organize the rest.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-2">
            <Reveal className="panel p-6 shadow-sm hover-lift" delay={40}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4 transition-transform duration-300 hover:scale-110">
                <Mic size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Voice Reflection (faster-whisper Tiny)
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Speak your stream of consciousness after work or study. Transcribed locally on CPU using INT8 quantization with zero cloud audio fees and full reviewable transcript editing.
              </p>
            </Reveal>

            <Reveal className="panel p-6 shadow-sm hover-lift" delay={90}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4 transition-transform duration-300 hover:scale-110">
                <Sparkles size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Gemini Semantic Extraction
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Google Gemini Flash-Lite extracts what you completed today versus what you plan for tomorrow, categorizing blockers (technical, time, distraction) and tracking mood confidence.
              </p>
            </Reveal>

            <Reveal className="panel p-6 shadow-sm hover-lift" delay={140}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4 transition-transform duration-300 hover:scale-110">
                <Target size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Deterministic Goal Progress
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Define milestones with target dates. The system automatically links daily journal activities to your active goals using deterministic matching without cluttering your board.
              </p>
            </Reveal>

            <Reveal className="panel p-6 shadow-sm hover-lift" delay={190}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-4 transition-transform duration-300 hover:scale-110">
                <Trophy size={22} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Weekly AI Accountability Coach
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                On-demand weekly reviews that synthesize your week's accomplishments, surface recurring blocker patterns, and provide personalized coaching guidance to unlock your next level.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section id="how-it-works" className="py-20 px-5 md:px-8">
        <Reveal className="mx-auto max-w-4xl rounded-2xl p-8 sm:p-12 text-center shadow-lg border border-indigo-200 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white hover-lift">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to turn reflection into real progress?
          </h2>
          <p className="mt-3 text-sm text-indigo-100 max-w-xl mx-auto leading-relaxed font-medium">
            Create your account in seconds and experience effortless AI goal journaling.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/register")}
              className="rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition shadow-sm"
            >
              Get Started Free <ArrowRight size={16} className="inline ml-1" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-700/50 px-7 py-3.5 text-sm font-semibold text-white border border-indigo-500 hover:bg-indigo-700 transition"
            >
              Sign In to Workspace
            </button>
          </div>
        </Reveal>
      </section>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
