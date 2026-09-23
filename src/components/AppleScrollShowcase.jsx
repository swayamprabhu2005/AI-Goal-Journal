import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, Mic, Target, Trophy, Shield, Cpu } from "lucide-react";

export default function AppleScrollShowcase() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Apple-style 3D perspective transforms
  const rotateX = useTransform(scrollYProgress, [0.1, 0.5, 0.9], [22, 0, -8]);
  const scale = useTransform(scrollYProgress, [0.1, 0.5, 0.8], [0.88, 1, 0.96]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.3]);
  
  // Parallax badge transforms
  const leftBadgeX = useTransform(scrollYProgress, [0.1, 0.5], [-70, 0]);
  const rightBadgeX = useTransform(scrollYProgress, [0.1, 0.5], [70, 0]);
  const badgeOpacity = useTransform(scrollYProgress, [0.15, 0.45], [0, 1]);

  return (
    <section ref={containerRef} className="py-24 px-4 bg-gradient-to-b from-[#FAF9F5] via-[#F4F1E8] to-[#EEF3EC] text-[#26261F] relative overflow-hidden border-t border-[#E2E9DF]">
      {/* Soft Ambient Backlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#4B5D3C]/10 blur-[130px] pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10">
        
        {/* Header */}
        <motion.div style={{ opacity }} className="max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#4B5D3C]/10 text-[#4B5D3C] text-xs font-mono font-bold tracking-widest uppercase border border-[#4B5D3C]/20 mb-4 shadow-xs">
            <Cpu size={14} /> Next-Gen AI Workspace
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-[#26261F] mb-5 leading-tight">
            Designed for Focus. <br />
            <span className="text-[#4B5D3C]">Powered by Intelligence.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            Scroll down to watch your daily reflections transform into structured goals and real-time productivity metrics.
          </p>
        </motion.div>

        {/* Floating Parallax Badges & 3D Window Container */}
        <div className="w-full relative min-h-[460px] sm:min-h-[520px] flex items-center justify-center">
          
          {/* Floating Left Badge */}
          <motion.div
            style={{ x: leftBadgeX, opacity: badgeOpacity }}
            className="hidden md:flex absolute -left-4 top-14 z-30 items-center gap-3 p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#E2E9DF] shadow-xl text-left max-w-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#4B5D3C]/10 flex items-center justify-center text-[#4B5D3C] shrink-0 border border-[#4B5D3C]/20">
              <Mic size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#26261F]">Offline Voice Processing</p>
              <p className="text-[11px] text-slate-500 font-mono">`faster-whisper` INT8 on CPU</p>
            </div>
          </motion.div>

          {/* Floating Right Badge */}
          <motion.div
            style={{ x: rightBadgeX, opacity: badgeOpacity }}
            className="hidden md:flex absolute -right-4 bottom-16 z-30 items-center gap-3 p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#E2E9DF] shadow-xl text-left max-w-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C1622C]/10 flex items-center justify-center text-[#C1622C] shrink-0 border border-[#C1622C]/20">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#26261F]">0–100 Productivity Velocity</p>
              <p className="text-[11px] text-slate-500 font-mono">Deterministic scoring engine</p>
            </div>
          </motion.div>

          {/* Apple-Style 3D Light Window Frame */}
          <motion.div
            style={{ rotateX, scale, opacity }}
            className="w-full max-w-4xl rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-white via-white/90 to-[#FAF9F5] backdrop-blur-2xl border border-[#E2E9DF] shadow-[0_25px_70px_rgba(75,93,60,0.12)]"
          >
            <div className="w-full rounded-2xl overflow-hidden border border-[#E2E9DF] bg-white text-left shadow-sm">
              
              {/* Window Bar */}
              <div className="px-4 py-3 bg-[#FAF9F5] border-b border-[#E2E9DF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono font-bold text-slate-500">ai-goal-journal.app/dashboard</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#4B5D3C] bg-[#4B5D3C]/10 px-2.5 py-1 rounded-full border border-[#4B5D3C]/20">
                  <Shield size={12} /> AES-256-GCM
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 sm:p-8 space-y-6 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E9DF] pb-5">
                  <div>
                    <h3 className="text-2xl font-bold font-serif text-[#26261F]">Today's Reflection & Growth Overview</h3>
                    <p className="text-xs text-slate-500 mt-1">Synced live with Gemini 3.1 Flash-Lite Engine</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#4B5D3C]/10 px-3.5 py-2 rounded-xl border border-[#4B5D3C]/20 text-xs font-bold text-[#4B5D3C]">
                    <Sparkles size={14} className="text-[#C1622C]" /> Productivity Score: 92/100
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2E9DF]">
                    <span className="text-[10px] uppercase font-extrabold text-[#4B5D3C] tracking-wider">Completed Tasks</span>
                    <p className="text-xl font-bold text-[#26261F] mt-1">4 Deliverables</p>
                    <p className="text-[11px] text-slate-500 mt-1">Linked to active goals</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2E9DF]">
                    <span className="text-[10px] uppercase font-extrabold text-[#C1622C] tracking-wider">Habit Consistency</span>
                    <p className="text-xl font-bold text-[#26261F] mt-1">14-Day Streak 🔥</p>
                    <p className="text-[11px] text-slate-500 mt-1">No missed milestones</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2E9DF]">
                    <span className="text-[10px] uppercase font-extrabold text-purple-700 tracking-wider">Active Blockers</span>
                    <p className="text-xl font-bold text-[#26261F] mt-1">0 Critical</p>
                    <p className="text-[11px] text-slate-500 mt-1">Resolved CORS & auth</p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
