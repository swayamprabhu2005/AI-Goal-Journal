import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Sparkles, Trophy, Zap, Shield, CheckCircle2 } from "lucide-react";

export default function InteractiveGrowthCube() {
  const [rotX, setRotX] = useState(-20);
  const [rotY, setRotY] = useState(25);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [solvedState, setSolvedState] = useState(85);
  const [celebrating, setCelebrating] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setAutoRotate(false);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setRotY((prev) => prev + deltaX * 0.5);
    setRotX((prev) => Math.max(-60, Math.min(60, prev - deltaY * 0.5)));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScramble = () => {
    setRotX(Math.floor(Math.random() * 180) - 90);
    setRotY(Math.floor(Math.random() * 360));
    setSolvedState(Math.floor(Math.random() * 30) + 40);
    setCelebrating(false);
  };

  const handleSolve = () => {
    setRotX(-20);
    setRotY(25);
    setSolvedState(100);
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 3000);
  };

  const cubeFaces = [
    { label: "AI JOURNAL", color: "#4B5D3C", bg: "from-emerald-700 to-green-900", icon: "✍️" },
    { label: "HABIT TRACKER", color: "#C1622C", bg: "from-amber-600 to-orange-800", icon: "🔥" },
    { label: "GOAL TRACKING", color: "#2563EB", bg: "from-blue-600 to-indigo-900", icon: "🎯" },
    { label: "GEMINI AI", color: "#7C3AED", bg: "from-purple-600 to-violet-900", icon: "🧠" },
    { label: "AI COACH", color: "#059669", bg: "from-teal-600 to-emerald-900", icon: "🤝" },
    { label: "ANALYTICS", color: "#D97706", bg: "from-amber-500 to-yellow-800", icon: "📊" },
  ];

  return (
    <div className="w-full py-16 px-4 bg-gradient-to-b from-[#FAF9F5] via-[#F4F1E8] to-[#EBE7DC] border-y border-[#E2E9DF] overflow-hidden select-none relative">
      
      {/* Dynamic Celebration Particles */}
      {celebrating && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          {[...Array(35)].map((_, idx) => (
            <motion.div
              key={idx}
              initial={{ x: 0, y: 0, scale: 0.5, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.8) * 500,
                rotate: Math.random() * 360,
                opacity: 0,
                scale: Math.random() * 1.5 + 0.5,
              }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute w-3 h-3 rounded-full shadow-lg"
              style={{
                backgroundColor: ["#4B5D3C", "#C1622C", "#F59E0B", "#10B981", "#6366F1"][idx % 5],
              }}
            />
          ))}
        </div>
      )}

      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        
        {/* Section Header */}
        <span className="px-3.5 py-1 rounded-full bg-[#4B5D3C]/10 text-[#4B5D3C] text-xs font-black uppercase tracking-widest border border-[#4B5D3C]/20 mb-3 flex items-center gap-1.5">
          <Zap size={14} className="fill-[#4B5D3C]" /> Interactive 3D Growth Matrix
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-[#26261F] mb-4">
          Align Your Daily Habits in 3D
        </h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mb-10 leading-relaxed">
          Drag and spin the interactive Rubik's Growth Cube to see how journaling, habit tracking, and AI accountability lock together.
        </p>

        {/* 3D Cube Canvas Container */}
        <div className="grid lg:grid-cols-12 gap-8 items-center w-full my-4">
          
          {/* Interactive 3D Perspective Playground */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px] relative">
            
            {/* Ambient Backlight Glow */}
            <div className="absolute w-[280px] h-[280px] rounded-full bg-[#4B5D3C]/20 blur-[90px] pointer-events-none" />

            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="cursor-grab active:cursor-grabbing p-12 touch-none relative z-10"
              style={{ perspective: "1000px" }}
            >
              <div
                className={`w-52 h-52 sm:w-64 sm:h-64 relative transition-transform duration-300 ${
                  autoRotate ? "animate-[spin_20s_linear_infinite]" : ""
                }`}
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                }}
              >
                {/* FRONT FACE */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#4B5D3C] to-[#3A492E] border-2 border-white/40 p-4 text-white shadow-2xl flex flex-col justify-between"
                  style={{ transform: "translateZ(104px)" }}
                >
                  <div className="flex justify-between items-center text-xs font-black tracking-wider uppercase opacity-80">
                    <span>{cubeFaces[0].icon} {cubeFaces[0].label}</span>
                    <span>98%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 my-auto">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-xs font-bold shadow-inner">
                        {i === 4 ? "✍️" : "✓"}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-medium text-emerald-200">Daily Voice Reflection Active</p>
                </div>

                {/* BACK FACE */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C1622C] to-[#9E4C1D] border-2 border-white/40 p-4 text-white shadow-2xl flex flex-col justify-between"
                  style={{ transform: "rotateY(180deg) translateZ(104px)" }}
                >
                  <div className="flex justify-between items-center text-xs font-black tracking-wider uppercase opacity-80">
                    <span>{cubeFaces[1].icon} {cubeFaces[1].label}</span>
                    <span>14 Days</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 my-auto">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
                        🔥
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-medium text-amber-200">Habit Streaks Synced</p>
                </div>

                {/* RIGHT FACE */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] border-2 border-white/40 p-4 text-white shadow-2xl flex flex-col justify-between"
                  style={{ transform: "rotateY(90deg) translateZ(104px)" }}
                >
                  <div className="flex justify-between items-center text-xs font-black tracking-wider uppercase opacity-80">
                    <span>{cubeFaces[2].icon} {cubeFaces[2].label}</span>
                    <span>100%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 my-auto">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
                        🎯
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-medium text-blue-200">Milestone System</p>
                </div>

                {/* LEFT FACE */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#6D28D9] to-[#4C1D95] border-2 border-white/40 p-4 text-white shadow-2xl flex flex-col justify-between"
                  style={{ transform: "rotateY(-90deg) translateZ(104px)" }}
                >
                  <div className="flex justify-between items-center text-xs font-black tracking-wider uppercase opacity-80">
                    <span>{cubeFaces[3].icon} {cubeFaces[3].label}</span>
                    <span>Flash-Lite</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 my-auto">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
                        🧠
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-medium text-purple-200">Semantic Extraction</p>
                </div>

                {/* TOP FACE */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#047857] to-[#064E3B] border-2 border-white/40 p-4 text-white shadow-2xl flex flex-col justify-between"
                  style={{ transform: "rotateX(90deg) translateZ(104px)" }}
                >
                  <div className="flex justify-between items-center text-xs font-black tracking-wider uppercase opacity-80">
                    <span>{cubeFaces[4].icon} {cubeFaces[4].label}</span>
                    <span>Active</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 my-auto">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
                        🤝
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-medium text-emerald-200">AI Coach</p>
                </div>

                {/* BOTTOM FACE */}
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#B45309] to-[#78350F] border-2 border-white/40 p-4 text-white shadow-2xl flex flex-col justify-between"
                  style={{ transform: "rotateX(-90deg) translateZ(104px)" }}
                >
                  <div className="flex justify-between items-center text-xs font-black tracking-wider uppercase opacity-80">
                    <span>{cubeFaces[5].icon} {cubeFaces[5].label}</span>
                    <span>+18%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 my-auto">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="h-10 rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center text-xs font-bold">
                        📈
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-medium text-amber-200">Velocity Tracker</p>
                </div>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-500 mt-4 animate-pulse">
              👈 Drag mouse or touch to spin the 3D Growth Cube in real-time 👉
            </p>
          </div>

          {/* Controls & Metrics Panel */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E9DF] shadow-md flex flex-col justify-between space-y-6 text-left">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-[#4B5D3C] uppercase tracking-wider">System Alignment</span>
                <span className="text-sm font-extrabold text-[#26261F] font-mono">{solvedState}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-3 rounded-full bg-[#F4F1E8] border border-[#E2E9DF] overflow-hidden p-0.5 mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${solvedState}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-[#4B5D3C] to-[#C1622C]"
                />
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 text-xs font-semibold text-slate-700">
                  <CheckCircle2 size={16} className="text-[#4B5D3C] shrink-0 mt-0.5" />
                  <span>Interactive 3D geometry mapped directly to your habit consistency score.</span>
                </div>
                <div className="flex items-start gap-3 text-xs font-semibold text-slate-700">
                  <Sparkles size={16} className="text-[#C1622C] shrink-0 mt-0.5" />
                  <span>Each side coordinates your daily voice journal with AI milestone extraction.</span>
                </div>
                <div className="flex items-start gap-3 text-xs font-semibold text-slate-700">
                  <Shield size={16} className="text-[#4B5D3C] shrink-0 mt-0.5" />
                  <span>AES-256-GCM encrypted data layer stored securely in your workspace.</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSolve}
                className="flex-1 py-3 px-4 rounded-xl bg-[#4B5D3C] hover:bg-[#3A492E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <Trophy size={14} /> Align All Faces (100%)
              </button>
              <button
                onClick={handleScramble}
                className="py-3 px-4 rounded-xl bg-[#F4F1E8] hover:bg-[#E2E9DF] text-[#26261F] text-xs font-bold border border-[#E2E9DF] flex items-center justify-center gap-2 transition active:scale-95"
              >
                <RefreshCw size={14} /> Shuffle Cube
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
