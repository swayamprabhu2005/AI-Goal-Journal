import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sparkles, Target, Trophy, AlertTriangle, ArrowRight, Play, CheckCircle2, Shield, Zap, Flame } from "lucide-react";

export default function InteractiveGoalSimulator() {
  const [selectedSample, setSelectedSample] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const samples = [
    {
      id: "sample-1",
      tag: "Student & Coding Sprint",
      input: "Today I finished the ES assignment and wrote unit tests for auth module. Worked out for 45 minutes, but got delayed for 30 mins fixing a CORS header bug.",
      extracted: {
        completed: ["Finished ES Assignment", "Wrote Unit Tests for Auth Module", "45m Workout Session"],
        blockers: [{ type: "Technical", label: "CORS Header configuration bug (30m delay)" }],
        goalMatch: { title: "Complete Fullstack Web Dev Project", delta: "+20%", progress: 85 },
        productivityScore: 92,
        coachTip: "Great work completing the ES assignment! Fix the CORS policy in backend middleware to avoid future auth delays.",
        streak: 12,
      },
    },
    {
      id: "sample-2",
      tag: "Freelancer & Goal Focus",
      input: "Finished 3 client wireframes and read 25 pages of Atomic Habits. Main blocker today was constant notification distractions during deep work.",
      extracted: {
        completed: ["3 Client UI Wireframes Created", "Read 25 pages of Atomic Habits"],
        blockers: [{ type: "Distraction", label: "Phone notifications broken focus (45m lost)" }],
        goalMatch: { title: "Deliver Client Milestone 2", delta: "+30%", progress: 70 },
        productivityScore: 88,
        coachTip: "Turn on Do Not Disturb during 90-minute focus blocks to eliminate notification context switches.",
        streak: 13,
      },
    },
    {
      id: "sample-3",
      tag: "Habit Streak & Milestone",
      input: "Ran 5km in the morning, completed 2 LeetCode problems, and finalized the weekly project roadmap without any major blockers today!",
      extracted: {
        completed: ["Ran 5km Morning Sprint", "2 LeetCode DSA Problems Solved", "Finalized Weekly Project Roadmap"],
        blockers: [],
        goalMatch: { title: "Run 50km Total This Month", delta: "+10%", progress: 100 },
        productivityScore: 98,
        coachTip: "Outstanding day! You hit 100% on your monthly running goal. Time to set your next milestone!",
        streak: 14,
      },
    },
  ];

  const current = samples[selectedSample];

  const handleSelect = (idx) => {
    setSelectedSample(idx);
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 500);
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white via-[#FAF9F5] to-[#F4F1E8] border-y border-[#E2E9DF] overflow-hidden select-none">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        
        {/* Section Header */}
        <span className="px-3.5 py-1 rounded-full bg-[#4B5D3C]/10 text-[#4B5D3C] text-xs font-black uppercase tracking-widest border border-[#4B5D3C]/20 mb-3 flex items-center gap-1.5">
          <Zap size={14} className="fill-[#4B5D3C]" /> LIVE INTERACTIVE DEMO
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-[#26261F] mb-4">
          Test Drive Your AI Coach Live
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mb-10 leading-relaxed">
          Select a sample daily journal below to see Gemini AI analyze reflections, detect blockers, and update goal progress in real-time.
        </p>

        {/* Interactive Sample Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-10">
          {samples.map((sample, idx) => (
            <button
              key={sample.id}
              onClick={() => handleSelect(idx)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 border shadow-xs ${
                selectedSample === idx
                  ? "bg-[#4B5D3C] text-white border-[#4B5D3C] shadow-md scale-105"
                  : "bg-white text-[#26261F] border-[#E2E9DF] hover:bg-[#E2E9DF]/40"
              }`}
            >
              <span>{idx === 0 ? "💻" : idx === 1 ? "🎨" : "🏃‍♂️"}</span>
              <span>{sample.tag}</span>
            </button>
          ))}
        </div>

        {/* Live Simulator Workspace Grid */}
        <div className="w-full grid lg:grid-cols-12 gap-6 items-stretch text-left">
          
          {/* Left Column: User Input & Transcription Card */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-[#E2E9DF] shadow-md flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E9DF] pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#4B5D3C]/10 flex items-center justify-center text-[#4B5D3C]">
                    <Mic size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#26261F]">Voice or Text Input</h3>
                    <p className="text-[10px] text-slate-500 font-mono">faster-whisper CPU INT8</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Ready
                </span>
              </div>

              {/* Animated Waveform Visualizer */}
              <div className="flex items-center gap-1.5 h-8 px-4 bg-[#FAF9F5] rounded-xl border border-[#E2E9DF] mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase mr-2">Audio Input</span>
                {[...Array(16)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: isSimulating ? [6, 22, 10, 26, 8] : [8, 14, 8] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }}
                    className="w-1 rounded-full bg-[#4B5D3C]"
                  />
                ))}
              </div>

              {/* Input Text Box */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2E9DF] relative">
                <span className="text-[10px] font-mono font-bold text-slate-400 block mb-2">RAW JOURNAL STREAM</span>
                <p className="text-xs sm:text-sm font-serif text-[#26261F] leading-relaxed italic">
                  "{current.input}"
                </p>
              </div>
            </div>

            {/* Action Trigger */}
            <div className="pt-2 border-t border-[#E2E9DF] flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 text-[#4B5D3C] font-bold">
                <Shield size={14} /> Encrypted Entry
              </span>
              <button
                onClick={() => handleSelect(selectedSample)}
                className="px-4 py-2 rounded-xl bg-[#C1622C] text-white font-bold hover:bg-[#A85222] transition flex items-center gap-1.5 shadow-sm text-xs"
              >
                <Play size={12} className="fill-white" /> Re-run AI Engine
              </button>
            </div>
          </div>

          {/* Right Column: AI Extraction & Goal Update Dashboard */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-[#E2E9DF] shadow-md flex flex-col justify-between space-y-6 relative overflow-hidden">
            
            {/* Loading Overlay */}
            <AnimatePresence>
              {isSimulating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 text-center"
                >
                  <div className="w-10 h-10 border-3 border-[#4B5D3C] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-[#4B5D3C]">Gemini 3.1 Flash-Lite Analyzing Journal...</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E9DF] pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#C1622C]/10 flex items-center justify-center text-[#C1622C]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#26261F]">Gemini Structured AI Output</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Automatic Categorization & Goal Linking</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    <Flame size={14} className="fill-amber-500 text-amber-500" /> {current.extracted.streak} Days
                  </span>
                  <span className="text-xs font-extrabold text-[#4B5D3C] bg-[#4B5D3C]/10 px-3 py-1 rounded-full border border-[#4B5D3C]/20">
                    Score: {current.extracted.productivityScore}/100
                  </span>
                </div>
              </div>

              {/* Extracted Tasks & Blockers */}
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                {/* Completed Tasks */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2E9DF]">
                  <span className="text-[10px] font-extrabold text-[#4B5D3C] uppercase tracking-wider block mb-2.5">
                    ✅ Extracted Accomplishments
                  </span>
                  <div className="space-y-2">
                    {current.extracted.completed.map((task, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-[#26261F] bg-white p-2 rounded-xl border border-[#E2E9DF]">
                        <CheckCircle2 size={14} className="text-[#4B5D3C] shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Blockers */}
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#E2E9DF]">
                  <span className="text-[10px] font-extrabold text-[#C1622C] uppercase tracking-wider block mb-2.5">
                    🚧 Identified Blockers
                  </span>
                  {current.extracted.blockers.length === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                      🎉 Zero blockers detected today!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {current.extracted.blockers.map((b, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs font-semibold text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200">
                          <AlertTriangle size={14} className="text-[#C1622C] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-[10px] uppercase block text-[#C1622C]">{b.type}</span>
                            <span>{b.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Goal Progress Update Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#4B5D3C]/10 via-[#FAF9F5] to-[#C1622C]/10 border border-[#E2E9DF] mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-[#26261F]">
                    <Target size={15} className="text-[#4B5D3C]" /> {current.extracted.goalMatch.title}
                  </span>
                  <span className="text-xs font-bold text-[#4B5D3C] font-mono">
                    {current.extracted.goalMatch.delta} ({current.extracted.goalMatch.progress}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white border border-[#E2E9DF] overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#4B5D3C] to-[#C1622C] transition-all duration-700"
                    style={{ width: `${current.extracted.goalMatch.progress}%` }}
                  />
                </div>
              </div>

              {/* AI Accountability Coach Tip */}
              <div className="p-4 rounded-2xl bg-[#4B5D3C] text-white flex items-start gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white font-bold">
                  <Trophy size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200 block mb-0.5">
                    Personalized AI Accountability Insight
                  </span>
                  <p className="text-xs font-medium text-white leading-relaxed">
                    "{current.extracted.coachTip}"
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
