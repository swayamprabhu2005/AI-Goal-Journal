import { useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import { Target, Mic, Sparkles, Trophy, ArrowRight, ShieldCheck } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-cream flex flex-col selection:bg-burgundy selection:text-cream">
      {/* Public Header */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-24 md:pb-32 px-5 md:px-8">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-burgundy/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-[1250px] text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface2 px-4 py-1.5 text-xs font-semibold text-cream shadow-card backdrop-blur-md mb-6">
            <span className="h-2 w-2 rounded-full bg-burgundy animate-pulse" />
            <span>AI Goal Journal & Accountability Coach</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-cream leading-[1.12] max-w-4xl mx-auto">
            Turn daily reflections into structured momentum.
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-beige/70 max-w-2xl mx-auto leading-relaxed font-normal">
            Speak or write naturally about your day. Google Gemini and local Whisper AI extract completed activities, identify blockers, track goals, and deliver weekly accountability coaching.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/register")}
              className="primary-button w-full sm:w-auto px-7 py-3.5 text-sm"
            >
              Start Journaling Free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-surface2 px-7 py-3.5 text-sm font-semibold text-cream border border-border hover:bg-wine/40 transition"
            >
              Sign In to Workspace
            </button>
          </div>

          <p className="mt-3.5 text-xs text-beige/50">
            No credit card required • Local CPU Whisper speech-to-text • Zero cloud audio fees
          </p>

          {/* Visual Interactive Preview */}
          <div className="mt-14 mx-auto max-w-4xl panel p-5 sm:p-7 shadow-glow text-left">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-900/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-900/80" />
                <span className="h-3 w-3 rounded-full bg-green-900/80" />
                <span className="ml-2 text-xs font-semibold text-cream">Interactive AI Extraction Pipeline Preview</span>
              </div>
              <span className="rounded bg-wine/30 px-2.5 py-0.5 text-[11px] font-bold text-cream border border-wine/50">
                Live Engine • Gemini Flash-Lite
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Raw Journal Input Box */}
              <div className="flex flex-col justify-between rounded-xl bg-surface2 p-4 border border-border">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-beige/60 mb-2.5">
                    <span className="flex items-center gap-1.5 text-cream">
                      <Mic size={14} /> Daily Reflection (Voice or Text)
                    </span>
                    <span className="text-[10px] bg-burgundy px-2 py-0.5 rounded text-cream">Raw Input</span>
                  </div>
                  <p className="text-xs text-beige/90 italic leading-relaxed bg-surface p-3.5 rounded-xl border border-border">
                    "Finished implementing backend routing and in-memory repositories today. Currently writing the automated unit test suite. Was delayed for 20 minutes by CORS headers. Tomorrow I will connect the voice recorder."
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-border flex items-center justify-between text-[10px] text-beige/50">
                  <span>🎙️ Transcribed locally via faster-whisper Tiny</span>
                  <span className="font-mono">42 words</span>
                </div>
              </div>

              {/* Structured AI Analysis Box */}
              <div className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-burgundy/40 to-surface p-4 border border-border shadow-card">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cream mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-cream" /> Structured AI Breakdown
                    </span>
                    <span className="rounded-full bg-wine/40 px-2.5 py-0.5 text-[10px] text-cream font-bold border border-wine/50">
                      Mood: Motivated (95%)
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="rounded bg-surface2 p-2.5 border border-border text-[11px] flex items-center gap-2">
                      <span className="font-bold text-green-400 uppercase text-[9px] bg-green-950/40 px-1.5 py-0.5 rounded border border-green-900/40 shrink-0">
                        Completed
                      </span>
                      <span className="text-cream">FastAPI routes & in-memory repositories</span>
                    </div>

                    <div className="rounded bg-surface2 p-2.5 border border-border text-[11px] flex items-center gap-2">
                      <span className="font-bold text-cream uppercase text-[9px] bg-wine/40 px-1.5 py-0.5 rounded border border-wine/50 shrink-0">
                        Ongoing
                      </span>
                      <span className="text-cream">Writing automated unit test suite</span>
                    </div>

                    <div className="rounded bg-surface2 p-2.5 border border-border text-[11px] flex items-center gap-2">
                      <span className="font-bold text-red-400 uppercase text-[9px] bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/40 shrink-0">
                        Blocker
                      </span>
                      <span className="text-red-300 font-medium">CORS headers configuration (20m)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-border text-[11px] text-beige/80">
                  <strong className="text-cream">Coach Insight:</strong> Great momentum. Timebox configuration spikes to 30m to maintain creative energy.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars Section */}
      <section className="py-20 px-5 md:px-8 bg-surface2/50 border-y border-border">
        <div className="mx-auto max-w-[1250px]">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="section-label">CORE CAPABILITIES</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-cream">
              Designed to eliminate manual productivity friction.
            </h2>
            <p className="mt-3 text-sm text-beige/60 leading-relaxed">
              Traditional goal apps require manual status logging and rigid checkboxes. Goal Journal lets you speak naturally and uses AI to organize the rest.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="panel p-6 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-burgundy text-cream mb-4">
                <Mic size={22} />
              </div>
              <h3 className="text-xl font-bold text-cream">
                Voice Reflection (faster-whisper Tiny)
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-beige/70 leading-relaxed">
                Speak your stream of consciousness after work or study. Transcribed locally on CPU using INT8 quantization with zero cloud audio fees and full reviewable transcript editing.
              </p>
            </div>

            <div className="panel p-6 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-burgundy text-cream mb-4">
                <Sparkles size={22} />
              </div>
              <h3 className="text-xl font-bold text-cream">
                Gemini Semantic Extraction
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-beige/70 leading-relaxed">
                Google Gemini Flash-Lite extracts what you completed today versus what you plan for tomorrow, categorizing blockers (technical, time, distraction) and tracking mood confidence.
              </p>
            </div>

            <div className="panel p-6 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-burgundy text-cream mb-4">
                <Target size={22} />
              </div>
              <h3 className="text-xl font-bold text-cream">
                Deterministic Goal Progress
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-beige/70 leading-relaxed">
                Define milestones with target dates. The system automatically links daily journal activities to your active goals using deterministic matching without cluttering your board.
              </p>
            </div>

            <div className="panel p-6 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-burgundy text-cream mb-4">
                <Trophy size={22} />
              </div>
              <h3 className="text-xl font-bold text-cream">
                Weekly AI Accountability Coach
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-beige/70 leading-relaxed">
                On-demand weekly reviews that synthesize your week's accomplishments, surface recurring blocker patterns, and provide personalized coaching guidance to unlock your next level.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-5 md:px-8">
        <div className="mx-auto max-w-4xl panel p-8 sm:p-12 text-center shadow-glow border border-border bg-gradient-to-br from-burgundy/60 to-surface">
          <h2 className="text-3xl sm:text-4xl font-bold text-cream">
            Ready to turn reflection into real progress?
          </h2>
          <p className="mt-3 text-sm text-beige/80 max-w-xl mx-auto leading-relaxed">
            Create your account in seconds and experience effortless AI goal journaling.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/register")}
              className="primary-button px-7 py-3.5 text-sm"
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center justify-center gap-2 rounded-xl bg-surface2 px-7 py-3.5 text-sm font-semibold text-cream border border-border hover:bg-wine/40 transition"
            >
              Sign In to Workspace
            </button>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
}
