import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Target,
  TrendingUp,
  RotateCcw,
  Zap,
  Clock,
  Lightbulb,
} from "lucide-react";

const PRESETS = [
  {
    id: "tech",
    label: "🚀 Product Launch",
    input:
      "Finished implementing backend routing and in-memory repositories today. Currently writing the automated unit test suite. Was delayed for 20 minutes by CORS headers. Tomorrow I will connect the voice recorder.",
    extracted: {
      mood: "Motivated",
      moodConfidence: 95,
      completed: [
        "FastAPI routing & in-memory repositories",
        "Configured Firebase ID token validation",
      ],
      ongoing: ["Writing automated unit test suite"],
      blockers: ["CORS headers configuration spike (20m)"],
      coachInsight:
        "Great execution speed! Timebox configuration spikes to 30 minutes to preserve high creative momentum.",
      goalUpdates: [
        { name: "Launch AI Journal MVP", before: 65, after: 85, delta: 20 },
      ],
      productivityBoost: 16,
    },
  },
  {
    id: "study",
    label: "📚 Deep Study Session",
    input:
      "Completed 3 chapters on Graph Algorithms & Dijkstra's shortest path. Struggled with dynamic programming edge cases for 45 mins. Tomorrow: finish mock exams and flashcards.",
    extracted: {
      mood: "Focused",
      moodConfidence: 90,
      completed: [
        "3 Chapters on Graph Algorithms",
        "Dijkstra's shortest path proofs",
      ],
      ongoing: ["Dynamic programming practice problems"],
      blockers: ["DP state transition edge cases (45m)"],
      coachInsight:
        "Solid conceptual foundation. Break complex DP states into smaller visual sub-problems before coding.",
      goalUpdates: [
        { name: "Master CS Algorithms Exam", before: 40, after: 62, delta: 22 },
      ],
      productivityBoost: 18,
    },
  },
  {
    id: "fitness",
    label: "🏋️ Health & Fitness",
    input:
      "Ran 5km in 24 minutes this morning. Drank 3L water. Missed my evening stretching session due to an unexpected client call. Plan: 6km run tomorrow at 7 AM.",
    extracted: {
      mood: "Energized",
      moodConfidence: 92,
      completed: ["5km Morning Run (24m pace)", "3 Liters Water Intake"],
      ongoing: ["Daily hydration goal"],
      blockers: ["Client call conflict (Skipped evening stretch)"],
      coachInsight:
        "Consistent aerobic endurance! Schedule a 10-minute bedtime mobility stretch to compensate for missed evening session.",
      goalUpdates: [
        { name: "Half-Marathon Preparation", before: 50, after: 70, delta: 20 },
      ],
      productivityBoost: 14,
    },
  },
];

export default function InteractiveLab() {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [inputText, setInputText] = useState(PRESETS[0].input);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStage, setActiveStage] = useState(3); // 1: Audio Intake, 2: Gemini Parsing, 3: Complete
  const [activeTab, setActiveTab] = useState("extraction"); // extraction | goals | score

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setInputText(preset.input);
    runSimulation(preset);
  };

  const runSimulation = (presetData = selectedPreset) => {
    setIsProcessing(true);
    setActiveStage(1);

    setTimeout(() => {
      setActiveStage(2);
    }, 700);

    setTimeout(() => {
      setActiveStage(3);
      setIsProcessing(false);
    }, 1400);
  };

  const currentData = selectedPreset.extracted;

  return (
    <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-7 shadow-2xl shadow-indigo-100/50 backdrop-blur-xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200">
            <Zap size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Interactive AI Transformation Lab
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Live Simulator
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Click a preset scenario or test how natural journal input transforms into structured goals
            </p>
          </div>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          {PRESETS.map((preset) => {
            const isActive = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-bold scale-[1.02]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Lab Grid */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Natural Input & Pipeline Controls (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl bg-slate-50/90 p-4 border border-slate-200/80 shadow-inner flex flex-col justify-between h-full min-h-[280px]">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2.5">
                <span className="flex items-center gap-1.5">
                  <Mic size={15} className="text-indigo-600 animate-pulse" />
                  Your Journal Entry (Voice or Text)
                </span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                  Raw Reflection
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-32 rounded-xl bg-white p-3 text-xs text-slate-800 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition resize-none font-medium leading-relaxed shadow-sm"
                placeholder="Type or describe your day here..."
              />
            </div>

            {/* Audio Wave Visualizer Simulation */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500 font-medium">Whisper Voice Wave:</span>
                <div className="flex items-center gap-0.5 h-4 px-2 bg-indigo-50 rounded-lg border border-indigo-100">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: isProcessing ? [4, 14, 6, 16, 4] : [4, 8, 4],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: i * 0.1,
                      }}
                      className="w-1 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => runSimulation()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Sparkles size={14} className="animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} /> Re-Run Pipeline
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pipeline Step Progress Bar */}
          <div className="rounded-xl bg-slate-900 p-3.5 text-white flex items-center justify-between text-xs shadow-md">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  activeStage >= 1 ? "bg-emerald-400 animate-ping" : "bg-slate-600"
                }`}
              />
              <span className="font-mono text-[11px] text-slate-300">
                {activeStage === 1 && "Stage 1: Speech Intake (Whisper INT8)"}
                {activeStage === 2 && "Stage 2: Gemini Reasoning..."}
                {activeStage === 3 && "Stage 3: Structured AI Ready"}
              </span>
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-indigo-300 font-bold border border-slate-700">
              {activeStage === 3 ? "100% Complete" : "Processing"}
            </span>
          </div>
        </div>

        {/* Right Column: Output Interactive Tabs & Cards (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {/* Tab Navigation Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("extraction")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === "extraction"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles size={14} /> AI Extraction
              </button>
              <button
                onClick={() => setActiveTab("goals")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === "goals"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Target size={14} /> Goal Alignment
              </button>
              <button
                onClick={() => setActiveTab("score")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === "score"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp size={14} /> Productivity Score
              </button>
            </div>

            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
              Model: <code className="text-indigo-600 font-mono">gemini-3.1-flash-lite</code>
            </span>
          </div>

          {/* Animated Tab Content Container */}
          <div className="min-h-[290px] rounded-2xl bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50 p-4 border border-indigo-100 shadow-sm">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-64 gap-3 text-center"
                >
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                    <Sparkles
                      size={20}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600"
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Extracting completed tasks, friction blockers & mood...
                  </p>
                </motion.div>
              ) : activeTab === "extraction" ? (
                <motion.div
                  key="extraction"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3"
                >
                  {/* Mood & Sentiment Banner */}
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-indigo-100 shadow-sm">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Detected Mood & Energy
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-extrabold text-emerald-700 border border-emerald-200">
                      {currentData.mood} ({currentData.moodConfidence}%)
                    </span>
                  </div>

                  {/* Extracted Completed Items */}
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-sm">
                    <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider block mb-2">
                      ✅ Completed Milestones
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {currentData.completed.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-slate-800 font-semibold bg-emerald-50/50 p-2 rounded-lg border border-emerald-100"
                        >
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extracted Blockers */}
                  <div className="rounded-xl bg-white p-3 border border-red-100 shadow-sm">
                    <span className="text-[11px] font-extrabold text-red-700 uppercase tracking-wider block mb-1.5">
                      🚨 Active Blocker Identified
                    </span>
                    {currentData.blockers.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50/70 p-2 rounded-lg border border-red-200"
                      >
                        <AlertTriangle size={15} className="text-red-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Coach Advice Rationale */}
                  <div className="rounded-xl bg-indigo-600 p-3 text-white text-xs shadow-sm flex items-start gap-2.5">
                    <Lightbulb size={18} className="text-yellow-300 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-indigo-100 block">
                        Weekly Coach Rationale:
                      </strong>
                      <p className="mt-0.5 text-indigo-50 font-medium leading-relaxed">
                        {currentData.coachInsight}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === "goals" ? (
                <motion.div
                  key="goals"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3"
                >
                  <div className="rounded-xl bg-white p-3 border border-indigo-100 shadow-sm">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <Target size={15} className="text-indigo-600" />
                      Automatic Goal Matching Engine
                    </span>
                    <p className="text-xs text-slate-600 font-medium mb-3">
                      Your journal reflection matched the active goal below and automatically calculated progress delta!
                    </p>

                    {currentData.goalUpdates.map((goal, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">{goal.name}</span>
                          <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-[11px] font-extrabold text-indigo-700">
                            +{goal.delta}% Progress
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                          <motion.div
                            initial={{ width: `${goal.before}%` }}
                            animate={{ width: `${goal.after}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                          />
                        </div>

                        <div className="flex justify-between text-[11px] font-medium text-slate-500">
                          <span>Previous: {goal.before}%</span>
                          <span className="font-bold text-emerald-600">Updated: {goal.after}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="score"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center justify-center p-4 text-center gap-4 bg-white rounded-xl border border-indigo-100 shadow-sm"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full border-8 border-indigo-100 border-t-indigo-600 flex items-center justify-center">
                      <span className="text-2xl font-extrabold text-slate-900">
                        88<span className="text-xs text-slate-400 font-normal">/100</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                      <TrendingUp size={14} /> +{currentData.productivityBoost} Pts Productivity Score Boost
                    </span>
                    <p className="mt-2 text-xs text-slate-600 max-w-sm font-medium">
                      Calculated from your activity volume, goal milestones, and streak consistency.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
