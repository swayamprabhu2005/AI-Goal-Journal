import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import Reveal from "../components/Reveal";
import { Target, Mic, Sparkles, Trophy, ArrowRight, Flag, Compass, CheckCircle2, AlertTriangle, Bot, Heart, Repeat } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track window scroll progress for top progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(currentProgress);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = () => {
    window.scrollTo({
      top: window.innerHeight * 0.78,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E2E9DF] via-[#EEF3EC] to-[#D6E0D3] text-[#26261F] flex flex-col selection:bg-[#4B5D3C]/20 selection:text-[#26261F] font-sans">
      {/* Top Scroll Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-[#E2E9DF] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#4B5D3C] via-[#3A492E] to-[#C1622C] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Public Header */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-20 px-5 md:px-8">
        {/* Dynamic Glowing Ambient Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-[#4B5D3C]/12 rounded-full blur-[140px] pointer-events-none animate-bg-orb-1" />
        <div className="absolute top-20 right-[10%] h-56 w-56 rounded-full bg-[#C1622C]/8 blur-3xl pointer-events-none animate-bg-orb-2" />
        <div className="absolute bottom-10 left-[8%] h-48 w-48 rounded-full bg-[#95B08A]/20 blur-3xl pointer-events-none animate-pulse" />

        <div className="relative mx-auto max-w-[1200px]">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 text-center lg:text-left">
              {/* Tagline Pill */}
              <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-[#4B5D3C]/30 bg-white/80 px-4 py-1.5 text-xs font-bold text-[#4B5D3C] shadow-xs backdrop-blur-md mb-5">
                <span className="h-2 w-2 rounded-full bg-[#4B5D3C] animate-pulse" />
                <span>🌱 AI Goal Journal & Coach</span>
              </div>

              {/* Main Headline */}
              <h1
                className="animate-rise text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#26261F] font-serif leading-[1.15]"
                style={{ animationDelay: "80ms" }}
              >
                Turn daily reflections into structured goal progress.
              </h1>

              {/* Subheading */}
              <p
                className="animate-rise mt-5 text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-lg mx-auto lg:mx-0"
                style={{ animationDelay: "140ms" }}
              >
                Speak or write naturally about your day. Google Gemini & local Whisper AI automatically extract completed activities, identify active blockers, and map your path to the summit.
              </p>

              {/* Action CTAs */}
              <div
                className="animate-rise mt-7 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5"
                style={{ animationDelay: "200ms" }}
              >
                <button
                  onClick={() => navigate("/register")}
                  className="rounded-full bg-[#4B5D3C] hover:bg-[#3A492E] text-white px-7 py-3 text-xs sm:text-sm font-bold shadow-md shadow-[#4B5D3C]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Start Your Journey Free <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-full bg-white text-[#26261F] px-7 py-3 text-xs sm:text-sm font-bold border border-[#E2E9DF] hover:bg-[#E2E9DF]/60 transition-all shadow-xs"
                >
                  Sign In to Workspace
                </button>
              </div>
            </div>

            {/* Right Column: 3D Mountain Journey Graphic Card (Balanced Proportions) */}
            <div className="lg:col-span-6 animate-rise" style={{ animationDelay: "260ms" }}>
              <div className="relative mx-auto max-w-[450px] rounded-[28px] p-2.5 bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_50px_-15px_rgba(38,38,31,0.12)] group hover-lift">
                
                {/* Image Graphic container */}
                <div className="relative rounded-[22px] overflow-hidden aspect-4/3 sm:aspect-square">
                  <img
                    src="/mountain_journey.jpg"
                    alt="Goal Mountain Journey"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#26261F]/70 via-transparent to-transparent" />

                  {/* Floating Interactive Milestone Badges */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/60 text-[11px] font-bold text-[#26261F] shadow-xs">
                    <Flag size={13} className="text-[#C1622C]" />
                    <span>Peak Summit: 100% Progress</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/80 text-left shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-[#4B5D3C] uppercase tracking-wider">Active Milestone</span>
                      <span className="text-[11px] font-extrabold text-[#26261F]">Streak: 14 Days 🔥</span>
                    </div>
                    <p className="text-xs font-serif font-bold text-[#26261F]">
                      "Finished core module implementation & verified goal tracking"
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Bouncing Scroll Down Indicator Button */}
          <div className="mt-10 flex justify-center">
            <button
              onClick={scrollToSection}
              className="group flex flex-col items-center gap-1.5 text-xs font-bold text-[#4B5D3C] hover:text-[#3A492E] transition-all cursor-pointer"
            >
              <span className="uppercase tracking-widest text-[10px] font-extrabold">Scroll to explore</span>
              <div className="w-7 h-10 rounded-full border-2 border-[#4B5D3C]/40 flex items-start justify-center p-1 bg-white/60 backdrop-blur-sm group-hover:border-[#4B5D3C] transition-colors shadow-xs">
                <div className="w-1.5 h-2.5 bg-[#4B5D3C] rounded-full animate-bounce mt-1" />
              </div>
            </button>
          </div>

        </div>
      </section>

      {/* How Your AI Coach Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 px-5 md:px-8 bg-white border-t border-[#E2E9DF]">
        <div className="mx-auto max-w-[1150px]">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-extrabold tracking-widest text-[#4B5D3C] uppercase bg-[#4B5D3C]/10 px-3 py-1 rounded-full">
              FOUR-STEP SYSTEM
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold font-serif text-[#26261F]">
              How Your AI Coach Works
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Write naturally. Let AI understand what happened, track your goals, and keep you accountable every step of the way.
            </p>
          </Reveal>

          {/* Landing Page Visual Process Diagram */}
          <Reveal className="mb-16">
            <div className="bg-[#FAF9F5] border border-[#E2E9DF] rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 relative">
                {/* Process Step 01 */}
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-[#E2E9DF] shadow-xs relative">
                  <span className="text-xs font-mono font-bold text-[#4B5D3C] mb-1">01</span>
                  <div className="text-2xl mb-1">✍️</div>
                  <span className="text-xs font-black tracking-wider text-[#26261F] uppercase mb-1">WRITE</span>
                  <p className="text-[11px] font-medium text-slate-500">Journal your day</p>
                </div>

                {/* Process Step 02 */}
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-[#E2E9DF] shadow-xs relative">
                  <span className="text-xs font-mono font-bold text-[#C1622C] mb-1">02</span>
                  <div className="text-2xl mb-1">🧠</div>
                  <span className="text-xs font-black tracking-wider text-[#26261F] uppercase mb-1">ANALYZE</span>
                  <p className="text-[11px] font-medium text-slate-500">Gemini understands everything</p>
                </div>

                {/* Process Step 03 */}
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-[#E2E9DF] shadow-xs relative">
                  <span className="text-xs font-mono font-bold text-[#4B5D3C] mb-1">03</span>
                  <div className="text-2xl mb-1">🎯</div>
                  <span className="text-xs font-black tracking-wider text-[#26261F] uppercase mb-1">TRACK</span>
                  <p className="text-[11px] font-medium text-slate-500">Goals update automatically</p>
                </div>

                {/* Process Step 04 */}
                <div className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-[#E2E9DF] shadow-xs relative">
                  <span className="text-xs font-mono font-bold text-[#C1622C] mb-1">04</span>
                  <div className="text-2xl mb-1">🤝</div>
                  <span className="text-xs font-black tracking-wider text-[#26261F] uppercase mb-1">COACH</span>
                  <p className="text-[11px] font-medium text-slate-500">Personalized guidance</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Detailed 4-Step Cards */}
          <div className="space-y-16">
            {/* Step 1 */}
            <Reveal className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-6 order-2 md:order-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#4B5D3C]/10 text-[11px] font-extrabold text-[#4B5D3C] mb-2">
                  01 — WRITE
                </div>
                <h3 className="text-2xl font-bold font-serif text-[#26261F] mb-3">
                  Write Your Journal
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-4">
                  Share what you did, how you felt, what you achieved, or what stopped you today.
                </p>
                <div className="flex items-center gap-3 text-xs font-bold text-[#4B5D3C]">
                  <span className="flex items-center gap-1.5 bg-[#F4F1E8] px-3 py-1.5 rounded-full border border-[#E2E9DF] text-[11px]">
                    <Mic size={13} /> Voice & Text Reflection
                  </span>
                </div>
              </div>
              <div className="md:col-span-6 order-1 md:order-2 flex justify-center">
                <div className="w-full max-w-[440px] rounded-[24px] p-2.5 bg-[#F4F1E8] border border-[#E2E9DF] shadow-sm overflow-hidden hover-lift">
                  <img
                    src="/step_write_journal.jpg"
                    alt="01 Write Your Journal"
                    className="w-full h-60 sm:h-68 object-cover rounded-[18px]"
                  />
                </div>
              </div>
            </Reveal>

            {/* Step 2 */}
            <Reveal className="grid md:grid-cols-12 gap-8 items-center" delay={100}>
              <div className="md:col-span-6 flex justify-center">
                <div className="w-full max-w-[440px] rounded-[24px] p-2.5 bg-[#F4F1E8] border border-[#E2E9DF] shadow-sm overflow-hidden hover-lift">
                  <img
                    src="/step_gemini_analyze.jpg"
                    alt="02 Gemini Understands You"
                    className="w-full h-60 sm:h-68 object-cover rounded-[18px]"
                  />
                </div>
              </div>
              <div className="md:col-span-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#C1622C]/10 text-[11px] font-extrabold text-[#C1622C] mb-2">
                  02 — ANALYZE
                </div>
                <h3 className="text-2xl font-bold font-serif text-[#26261F] mb-3">
                  Gemini Understands You
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-4">
                  AI analyzes your journal to identify goals, completed tasks, emotions, habits, blockers, progress, and important patterns.
                </p>
                <div className="flex items-center gap-3 text-xs font-bold text-[#C1622C]">
                  <span className="flex items-center gap-1.5 bg-[#F4F1E8] px-3 py-1.5 rounded-full border border-[#E2E9DF] text-[11px]">
                    <Sparkles size={13} /> Gemini 3.1 Flash-Lite Engine
                  </span>
                </div>
              </div>
            </Reveal>

            {/* Step 3 */}
            <Reveal className="grid md:grid-cols-12 gap-8 items-center" delay={150}>
              <div className="md:col-span-6 order-2 md:order-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#4B5D3C]/10 text-[11px] font-extrabold text-[#4B5D3C] mb-2">
                  03 — TRACK
                </div>
                <h3 className="text-2xl font-bold font-serif text-[#26261F] mb-3">
                  Your Progress Updates Automatically
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-4">
                  Goals are automatically marked as Completed, In Progress, Missed, or Blocked based on what you write.
                </p>
                <div className="flex items-center gap-3 text-xs font-bold text-[#4B5D3C]">
                  <span className="flex items-center gap-1.5 bg-[#F4F1E8] px-3 py-1.5 rounded-full border border-[#E2E9DF] text-[11px]">
                    <Target size={13} /> Automatic Status & Milestone Sync
                  </span>
                </div>
              </div>
              <div className="md:col-span-6 order-1 md:order-2 flex justify-center">
                <div className="w-full max-w-[440px] rounded-[24px] p-2.5 bg-[#F4F1E8] border border-[#E2E9DF] shadow-sm overflow-hidden hover-lift">
                  <img
                    src="/step_track_goals.jpg"
                    alt="03 Progress Updates Automatically"
                    className="w-full h-60 sm:h-68 object-cover rounded-[18px]"
                  />
                </div>
              </div>
            </Reveal>

            {/* Step 4 */}
            <Reveal className="grid md:grid-cols-12 gap-8 items-center" delay={200}>
              <div className="md:col-span-6 flex justify-center">
                <div className="w-full max-w-[440px] rounded-[24px] p-2.5 bg-[#F4F1E8] border border-[#E2E9DF] shadow-sm overflow-hidden hover-lift">
                  <img
                    src="/step_ai_coach.jpg"
                    alt="04 Get Personalized Accountability"
                    className="w-full h-60 sm:h-68 object-cover rounded-[18px]"
                  />
                </div>
              </div>
              <div className="md:col-span-6">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#C1622C]/10 text-[11px] font-extrabold text-[#C1622C] mb-2">
                  04 — COACH
                </div>
                <h3 className="text-2xl font-bold font-serif text-[#26261F] mb-3">
                  Get Personalized Coaching
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-4">
                  Your AI Coach gives you insights, next actions, motivation, reminders, and accountability based on your actual progress.
                </p>
                <div className="flex items-center gap-3 text-xs font-bold text-[#C1622C]">
                  <span className="flex items-center gap-1.5 bg-[#F4F1E8] px-3 py-1.5 rounded-full border border-[#E2E9DF] text-[11px]">
                    <Trophy size={13} /> AI Coach Reviews & Weekly Insights
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Interactive AI Pipeline Section */}
      <section id="journey" className="py-16 md:py-20 px-5 md:px-8 border-t border-[#E2E9DF] bg-[#F4F1E8]">
        <div className="mx-auto max-w-[1150px]">
          <Reveal className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[11px] font-extrabold tracking-widest text-[#4B5D3C] uppercase">INTELLIGENT PIPELINE</span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold font-serif text-[#26261F]">
              How conversational journals turn into progress.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              You don't need to fill out spreadsheets. Just talk or type, and Gemini extracts activities and surfaces blockers automatically.
            </p>
          </Reveal>

          {/* Interactive AI Extraction Card */}
          <div className="mx-auto max-w-3xl rounded-[24px] p-5 sm:p-7 bg-white border border-[#E2E9DF] shadow-sm hover-lift">
            <div className="flex items-center justify-between border-b border-[#E2E9DF] pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C1622C]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#95B08A]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#4B5D3C]" />
                <span className="ml-1.5 text-xs font-bold text-[#26261F]">Live Extraction Preview</span>
              </div>
              <span className="rounded-full bg-[#4B5D3C]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#4B5D3C] border border-[#4B5D3C]/20">
                Gemini Flash-Lite Engine
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Input */}
              <div className="flex flex-col justify-between rounded-xl bg-[#F4F1E8]/60 p-4 border border-[#E2E9DF]">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    <span className="flex items-center gap-1.5 text-[#26261F]">
                      <Mic size={14} className="text-[#4B5D3C]" /> Reflection Input
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3.5 rounded-lg border border-[#E2E9DF] font-serif">
                    "Finished implementing backend routing and in-memory repository today. Writing automated unit tests. Was delayed for 20m by CORS headers."
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>🎙️ Transcribed via faster-whisper CPU</span>
                  <span className="font-mono text-[#4B5D3C] font-bold">28 words</span>
                </div>
              </div>

              {/* Output Breakdown */}
              <div className="flex flex-col justify-between rounded-xl bg-[#F4F1E8]/60 p-4 border border-[#4B5D3C]/30 shadow-xs">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#26261F] mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#C1622C]" /> Structured AI Breakdown
                    </span>
                    <span className="rounded-full bg-[#4B5D3C]/10 px-2 py-0.5 text-[9px] text-[#4B5D3C] font-extrabold">
                      Confidence: 96%
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg bg-white p-2.5 border border-[#E2E9DF] text-[11px] flex items-center gap-2 font-medium">
                      <CheckCircle2 size={15} className="text-[#4B5D3C] shrink-0" />
                      <span className="text-[#26261F]">FastAPI routes & in-memory repositories</span>
                    </div>

                    <div className="rounded-lg bg-white p-2.5 border border-[#E2E9DF] text-[11px] flex items-center gap-2 font-medium">
                      <Compass size={15} className="text-[#4B5D3C] shrink-0" />
                      <span className="text-[#26261F]">Writing automated test suite</span>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-[11px] flex items-center gap-2 font-medium text-amber-900">
                      <AlertTriangle size={15} className="text-[#C1622C] shrink-0" />
                      <span>Blocker: CORS header configuration (20m)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 text-[10px] text-slate-700 font-medium">
                  <strong className="text-[#4B5D3C]">AI Coach Note:</strong> Great momentum. Timebox configuration spikes to 30m.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Section */}
      <section id="features" className="py-16 md:py-20 px-5 md:px-8 bg-white border-t border-[#E2E9DF]">
        <div className="mx-auto max-w-[1100px]">
          <Reveal className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[11px] font-extrabold tracking-widest text-[#4B5D3C] uppercase">CORE CAPABILITIES</span>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold font-serif text-[#26261F]">
              Everything you need for goal consistency.
            </h2>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Voice Reflection */}
            <Reveal className="rounded-[24px] p-6 bg-[#F4F1E8]/60 border border-[#E2E9DF] shadow-xs hover-lift flex flex-col justify-between" delay={40}>
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2E9DF] text-[#4B5D3C] mb-4">
                  <Mic size={22} />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#26261F]">
                  Voice Reflection
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Speak freely after work or study. Transcribed locally on CPU with faster-whisper Tiny INT8, zero audio upload fees, and instant editable text.
                </p>
              </div>
            </Reveal>

            {/* 2. Gemini Semantic Extraction */}
            <Reveal className="rounded-[24px] p-6 bg-[#F4F1E8]/60 border border-[#E2E9DF] shadow-xs hover-lift flex flex-col justify-between" delay={80}>
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2E9DF] text-[#4B5D3C] mb-4">
                  <Sparkles size={22} />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#26261F]">
                  Gemini Semantic Extraction
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Google Gemini Flash-Lite extracts completed tasks, upcoming plans, active blockers (technical, distraction, fatigue), and goal connections.
                </p>
              </div>
            </Reveal>

            {/* 3. 10-Class Neural Mood Analyzer */}
            <Reveal className="rounded-[24px] p-6 bg-[#F4F1E8]/60 border border-[#E2E9DF] shadow-xs hover-lift flex flex-col justify-between" delay={120}>
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2E9DF] text-[#4B5D3C] mb-4">
                  <Heart size={22} />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#26261F]">
                  10-Class Mood Analyzer
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Custom PyTorch 4-Head Attention BiLSTM running on CPU. Detects emotional states with genuine confidence scoring and keyword extraction.
                </p>
              </div>
            </Reveal>

            {/* 4. AI Conversational Coach */}
            <Reveal className="rounded-[24px] p-6 bg-[#F4F1E8]/60 border border-[#E2E9DF] shadow-xs hover-lift flex flex-col justify-between" delay={160}>
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2E9DF] text-[#4B5D3C] mb-4">
                  <Bot size={22} />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#26261F]">
                  AI Conversational Coach
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Two-way interactive coaching grounded in your real goals, habits, and emotional rhythm. Provides actionable advice and thoughtful questions.
                </p>
              </div>
            </Reveal>

            {/* 5. Habits Tracker */}
            <Reveal className="rounded-[24px] p-6 bg-[#F4F1E8]/60 border border-[#E2E9DF] shadow-xs hover-lift flex flex-col justify-between" delay={200}>
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2E9DF] text-[#4B5D3C] mb-4">
                  <Repeat size={22} />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#26261F]">
                  Habits Tracker
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Build unbreakable consistency with Monday–Sunday weekly streaks, 0 ms instant optimistic check-offs, and a one-way daily completion lock.
                </p>
              </div>
            </Reveal>

            {/* 6. AI Goal Roadmaps */}
            <Reveal className="rounded-[24px] p-6 bg-[#F4F1E8]/60 border border-[#E2E9DF] shadow-xs hover-lift flex flex-col justify-between" delay={240}>
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E2E9DF] text-[#4B5D3C] mb-4">
                  <Target size={22} />
                </div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#26261F]">
                  Goal Roadmaps & Milestones
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Transform broad ambitions into structured, sequential milestones with AI roadmaps, progress rings, and Google Calendar deadline sync.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section id="how-it-works" className="py-16 md:py-20 px-5 md:px-8 bg-[#F4F1E8]">
        <Reveal className="mx-auto max-w-3xl rounded-[30px] p-8 sm:p-12 text-center shadow-lg bg-gradient-to-br from-[#4B5D3C] via-[#3A492E] to-[#26261F] text-white hover-lift">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
            Ready to climb your personal goal peak?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-[#E7E4D6] max-w-lg mx-auto leading-relaxed font-medium">
            Create your account in seconds and experience effortless AI goal journaling.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/register")}
              className="rounded-full bg-white px-7 py-3 text-xs sm:text-sm font-bold text-[#4B5D3C] hover:bg-[#F4F1E8] transition shadow-sm active:scale-95"
            >
              Get Started Free <ArrowRight size={15} className="inline ml-1" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-full bg-white/10 px-7 py-3 text-xs sm:text-sm font-bold text-white border border-white/30 hover:bg-white/20 transition"
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
