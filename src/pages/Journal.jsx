import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Mic,
  FileText,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Calendar,
  Search,
  Flag,
  Target,
  Plus,
  Check,
} from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import Pagination from "../components/Pagination";
import MoodBadge from "../components/MoodBadge";
import { journalApi, goalApi } from "../services/api";
import { useData } from "../context/DataContext";
import { useModal, useToast } from "../context/ModalContext";
import { GridSkeleton, JournalLoadingState } from "../components/LoadingSkeleton";
import GoalCelebration from "../components/GoalCelebration";

export default function Journal() {
  const {
    journals,
    goals,
    hasLoadedJournals,
    fetchJournals,
    addJournal,
    addGoal,
    deleteJournalFromCache,
    fetchAllData,
    recentlyCompletedGoal,
    triggerGoalCompletion,
    clearCompletedGoalTrigger,
  } = useData();

  const [activeTab, setActiveTab] = useState("text"); // 'text' | 'voice'
  const [entryText, setEntryText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [showCompose, setShowCompose] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [acceptedGoalTitles, setAcceptedGoalTitles] = useState(new Set());
  const [acceptingTitle, setAcceptingTitle] = useState(null);

  const resultsRef = useRef(null);

  const loadingList = !hasLoadedJournals;

  const autoCreatedGoals =
    latestAnalysis?.goals?.filter((g) => g.is_new || g.auto_created_goal_id) || [];

  useEffect(() => {
    // Always fetch fresh journals on component load
    fetchJournals({ quiet: false });
  }, [fetchJournals]);

  // Smooth auto-scroll when an analysis or selected journal is loaded
  useEffect(() => {
    if (latestAnalysis || selectedJournal) {
      const timer = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [latestAnalysis, selectedJournal]);

  // Reset pagination when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  async function handleSave(contentToSave, source = "text") {
    setError("");
    const content = (contentToSave || entryText).trim();

    if (!content) {
      setError("Please provide reflection text before submitting.");
      return;
    }

    setSubmitting(true);
    setLatestAnalysis(null);
    const prevGoals = goals || [];

    try {
      const result = await journalApi.createJournal({
        content,
        source,
      });

      // 1. Immediately display analysis, select journal, and unblock compose overlay
      addJournal(result);
      setLatestAnalysis(result.ai_analysis);
      setSelectedJournal(result);
      setShowCompose(false);
      setSubmitting(false);
      setCurrentPage(1);
      if (source === "text") {
        setEntryText("");
      }

      // 2. Refresh goals and milestones in background without blocking the UI
      goalApi.listGoals().then((updatedGoals) => {
        if (!updatedGoals) return;
        const newlyCompletedGoal = updatedGoals.find((ug) => {
          const is100 = ug.progress_value >= 100 || ug.status === "Completed";
          const prevGoal = prevGoals.find((g) => g.id === ug.id);
          const wasNot100 = !prevGoal || (prevGoal.progress_value < 100 && prevGoal.status !== "Completed");
          return is100 && wasNot100;
        });

        if (newlyCompletedGoal) {
          triggerGoalCompletion(newlyCompletedGoal);
        } else {
          const aiUpdates = result.ai_analysis?.progress_updates || [];
          const hasCompletionUpdate = aiUpdates.some(
            (pu) => pu.effort_level === "completion" || (pu.quantified_completed && pu.quantified_total && pu.quantified_completed >= pu.quantified_total)
          );
          const hasCompletionText = /goal (was|is)?\s*completed|completed (my|the)?\s*goal/i.test(content);

          if (hasCompletionUpdate || hasCompletionText) {
            const completedGoal = updatedGoals.find((g) => g.status === "Completed" || g.progress_value >= 100) || {
              title: result.ai_analysis?.title || "Goal Milestone Accomplished!",
              status: "Completed",
              progress_value: 100,
            };
            triggerGoalCompletion(completedGoal);
          }
        }
      }).catch((e) => console.warn("Background goal refresh note:", e));

      fetchAllData({ quiet: true }).catch((e) => console.warn("Background fetchAllData note:", e));
    } catch (err) {
      setError(err.message || "Failed to process journal entry.");
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleVoiceTranscriptReady(transcriptText) {
    setEntryText(transcriptText);
    setActiveTab("text");
  }

  const { confirm } = useModal();
  const toast = useToast();

  async function handleDeleteJournal(id) {
    const confirmed = await confirm({
      title: "Delete AI Journal Entry",
      message: "Are you sure you want to delete this AI Journal entry? This action cannot be undone.",
      confirmText: "Delete AI Journal Entry",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;

    try {
      await journalApi.deleteJournal(id);
      deleteJournalFromCache(id);
      if (selectedJournal?.id === id) {
        setSelectedJournal(null);
      }
      toast.success("AI Journal entry deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete entry: " + err.message);
    }
  }

  async function handleAcceptGoal(goalData) {
    const rawTitle = (goalData.title || goalData.text || "").trim();
    if (!rawTitle) return;

    setAcceptingTitle(rawTitle);
    try {
      const payload = {
        title: rawTitle,
        description: goalData.description || `Extracted from journal reflection.`,
        category: goalData.category || "Learning",
        status: "Active",
        target_date: goalData.due_date || goalData.target_date || null,
        progress_value: 0,
      };

      const created = await goalApi.createGoal(payload);
      if (created) {
        addGoal(created);
      }
      setAcceptedGoalTitles((prev) => new Set([...prev, rawTitle.toLowerCase()]));
      toast.success("Goal created successfully!");
    } catch (err) {
      toast.error("Failed to create goal: " + err.message);
    } finally {
      setAcceptingTitle(null);
    }
  }

  const filteredJournals = searchQuery.trim()
    ? journals.filter(
        (j) =>
          j.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : journals;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJournals = filteredJournals.slice(startIndex, startIndex + itemsPerPage);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const charCount = entryText.length;
  const wordCount = entryText.trim() ? entryText.trim().split(/\s+/).length : 0;

  function getTagsForJournal(j) {
    const tags = [];
    const lower = (j.content || "").toLowerCase();
    if (lower.includes("react") || lower.includes("dsa") || lower.includes("code") || lower.includes("question")) tags.push("Dev");
    if (lower.includes("dsa")) tags.push("DSA");
    if (j.ai_analysis?.blockers?.length || lower.includes("blocker") || lower.includes("stuck")) tags.push("Blocker");
    if (!tags.length) tags.push(j.source === "voice" ? "Voice" : "Reflection");
    return tags;
  }

  function getEmojiForJournal(j) {
    if (j.ai_analysis?.blockers?.length) return "⌛";
    if (j.ai_analysis?.activities?.length) return "🧠";
    return "🎯";
  }

  return (
    <div className="app-page min-h-screen bg-[#F4F1E8]">
      {recentlyCompletedGoal && (
        <GoalCelebration
          goal={recentlyCompletedGoal}
          onClose={clearCompletedGoalTrigger}
        />
      )}
      <main className="mx-auto max-w-7xl w-full px-5 py-6 md:px-8">
        {error && (
          <div className="mb-5 rounded-xl border border-[#C1622C]/30 bg-[#FBEBE3] px-4 py-3 text-xs text-[#C1622C] font-medium">
            <strong>Error: </strong> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT MAIN WORKSPACE COLUMN */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6 min-w-0">
            {/* 1. WRITE REFLECTION PANEL */}
            {showCompose && (
              <section className="panel p-6 sm:p-7 shadow-xs bg-white border border-[#E2E9DF] rounded-2xl animate-rise relative overflow-hidden">
                {submitting && (
                  <div className="absolute inset-0 z-20 bg-white/85 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in select-none">
                    <div className="relative mb-4 flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full border-4 border-[#E2E9DF] border-t-[#4B5D3C] animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={20} className="text-[#4B5D3C] animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-[#26261F] mb-1.5 font-serif">
                      Analyzing reflection with Gemini...
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm font-medium leading-relaxed">
                      Please wait while we extract your tracked goals, completed activities, and active blockers. Your text has been locked.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E2E9DF]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4B5D3C]">
                      TODAY'S AI JOURNAL ENTRY
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#4B5D3C] font-semibold bg-[#E2E9DF] px-2.5 py-0.5 rounded-full border border-[#4B5D3C]/20">
                      ☁ Autosaved
                    </span>
                  </div>

                  {/* Mode Switcher Pills */}
                  <div className="flex items-center gap-1 rounded-xl border border-[#E2E9DF] bg-[#F4F1E8] p-1 self-start sm:self-auto">
                    <button
                      onClick={() => setActiveTab("text")}
                      disabled={submitting}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        activeTab === "text"
                          ? "bg-[#4B5D3C] text-white shadow-2xs font-bold"
                          : "text-slate-600 hover:text-[#26261F]"
                      } ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <FileText size={15} />
                      Text Mode
                    </button>
                    <button
                      onClick={() => setActiveTab("voice")}
                      disabled={submitting}
                      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        activeTab === "voice"
                          ? "bg-[#4B5D3C] text-white shadow-2xs font-bold"
                          : "text-slate-600 hover:text-[#26261F]"
                      } ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <Mic size={15} />
                      Voice Mode (Whisper)
                    </button>
                  </div>
                </div>

                {/* Main Headline Date */}
                <h2 className="text-xl sm:text-2xl font-bold text-[#26261F] font-serif mb-3 tracking-tight">
                  Writing {todayFormatted}
                </h2>

                {/* Reflection Workspace Content */}
                {activeTab === "voice" ? (
                  <div className="mb-5">
                    <VoiceRecorder
                      onTranscriptReady={handleVoiceTranscriptReady}
                      onDirectSubmit={(text) => handleSave(text, "voice")}
                      isSubmitting={submitting}
                    />
                  </div>
                ) : (
                  <div className="mb-5">
                    <textarea
                      rows={6}
                      value={entryText}
                      onChange={(e) => setEntryText(e.target.value)}
                      disabled={submitting}
                      readOnly={submitting}
                      className="w-full p-4 text-sm text-[#26261F] placeholder:text-slate-400 leading-relaxed bg-white border border-[#E2E9DF] rounded-xl outline-none transition-all duration-200 focus:border-[#4B5D3C] focus:ring-2 focus:ring-[#4B5D3C]/20 disabled:bg-[#F4F1E8]/70 disabled:cursor-not-allowed disabled:text-slate-500 disabled:select-none"
                      placeholder="Today I managed to build... Mention specific hours, goal progress, or task blockers."
                    />
                  </div>
                )}

                {/* Tip Banner */}
                <div className="rounded-xl bg-[#E2E9DF]/70 border border-[#E2E9DF] p-3 mb-5 text-xs text-[#26261F] flex items-center gap-2.5 font-medium">
                  <Sparkles size={16} className="text-[#4B5D3C] shrink-0 animate-pulse" />
                  <span>
                    <strong>Tip:</strong> Mention specific hours and task blocker details for more detailed AI Coaching feedback.
                  </span>
                </div>

                {/* Bottom Action Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E2E9DF]">
                  <div className="text-xs text-slate-400 font-medium font-mono">
                    {charCount} characters • {wordCount} words
                  </div>

                  <button
                    onClick={() => handleSave(entryText, "text")}
                    disabled={submitting || !entryText.trim()}
                    className="primary-button px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles size={16} />
                    {submitting ? "Analyzing with Gemini..." : "Analyze Entry ✨"}
                  </button>
                </div>
              </section>
            )}

            {/* 2. IN-PLACE TRANSITION BANNER */}
            {!showCompose && (latestAnalysis || selectedJournal?.ai_analysis) && (
              <div className="panel p-5 bg-gradient-to-r from-[#E2E9DF]/80 via-white to-[#F4F1E8] border border-[#E2E9DF] rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#4B5D3C] flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#4B5D3C]" /> Active Reflection Analysis
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      • {selectedJournal ? new Date(selectedJournal.created_at || selectedJournal.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : todayFormatted}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 line-clamp-2 italic leading-relaxed">
                    "{selectedJournal?.content && !selectedJournal.content.startsWith("enc:v1:")
                      ? selectedJournal.content
                      : (selectedJournal?.title || selectedJournal?.ai_analysis?.quick_summary || "Your journal entry was analyzed and goals/activities tracked.")}"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompose(true);
                    setLatestAnalysis(null);
                    setSelectedJournal(null);
                    setEntryText("");
                    setSubmitting(false);
                    setError("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#4B5D3C] hover:bg-[#3A492E] text-white px-3.5 py-2 text-xs font-bold transition shadow-2xs shrink-0 self-start sm:self-center"
                >
                  <Plus size={14} /> Write New Reflection
                </button>
              </div>
            )}

            {/* LATEST AI EXTRACTION BANNER */}
            {(latestAnalysis || selectedJournal?.ai_analysis) && (() => {
              const currentAi = latestAnalysis || selectedJournal?.ai_analysis;
              const goalsExtractedList = currentAi.goalsExtracted || currentAi.goals || [];
              const completedTasksList = currentAi.completedTasks || currentAi.activities?.filter(a => a.status === "completed").map(a => a.text) || [];
              const blockersList = currentAi.blockers || [];

              return (
                <section ref={resultsRef} className="rounded-2xl p-6 bg-white border border-[#E2E9DF] shadow-xs animate-fade-in space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E9DF] pb-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#4B5D3C] flex items-center gap-2">
                      <Sparkles size={16} className="text-[#4B5D3C]" /> AI Structured Journal Extraction
                    </h3>

                    {autoCreatedGoals.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E2E9DF] px-3 py-0.5 text-xs font-bold text-[#4B5D3C] border border-[#4B5D3C]/20">
                        <CheckCircle2 size={13} className="text-[#4B5D3C]" />
                        {autoCreatedGoals.length} Goal{autoCreatedGoals.length > 1 ? "s" : ""} Auto-Created!
                      </span>
                    )}
                  </div>

                  {currentAi.quick_summary && (
                    <p className="text-sm font-semibold text-[#26261F] italic leading-relaxed">
                      "{currentAi.quick_summary}"
                    </p>
                  )}

                  {/* EMOTIONAL STATE PULSE (NEURAL MOOD ANALYZER) */}
                  {(currentAi.detected_mood || selectedJournal?.detected_mood) && (
                    <div className="rounded-xl bg-[#F4F1E8]/70 border border-[#E2E9DF] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B5D3C]">
                            Detected Emotional Rhythm
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            (10-Class Attention BiLSTM)
                          </span>
                        </div>
                        <MoodBadge
                          mood={currentAi.detected_mood || selectedJournal?.detected_mood}
                          confidence={currentAi.mood_confidence || selectedJournal?.mood_confidence}
                          keywords={currentAi.trigger_keywords || selectedJournal?.trigger_keywords}
                        />
                      </div>
                    </div>
                  )}

                  {/* 1. GOALS EXTRACTED */}
                  {goalsExtractedList.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#26261F] mb-3">
                        Goals Extracted & Tracked
                      </h4>
                      <div className="flex flex-col gap-3">
                        {goalsExtractedList.map((g, idx) => {
                          const rawConf = g.confidence_pct ?? g.confidence ?? 90;
                          const conf = typeof rawConf === 'number' && rawConf <= 1.0 ? Math.round(rawConf * 100) : Math.round(Number(rawConf) || 90);
                          const goalTitle = (g.title || g.text || "").trim();
                          const normTitle = goalTitle.toLowerCase();

                          const isRegistered = goals.some(ex => ex.title?.toLowerCase().trim() === normTitle) || acceptedGoalTitles.has(normTitle);
                          const isProcessing = acceptingTitle === goalTitle;

                          return (
                            <div
                              key={idx}
                              className="rounded-xl bg-[#F4F1E8]/60 p-4 border border-[#E2E9DF] shadow-2xs hover:border-[#4B5D3C]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 font-bold text-[#26261F] text-sm">
                                    <Flag size={16} className="text-[#4B5D3C] shrink-0" />
                                    <span>{goalTitle}</span>
                                  </div>
                                  <span className="shrink-0 rounded-full bg-[#E2E9DF] px-2 py-0.5 text-[10px] font-bold text-[#4B5D3C] border border-[#4B5D3C]/20">
                                    {conf}% Confidence
                                  </span>
                                  {g.category && (
                                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                      {g.category}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                  {g.description || (g.due_date ? `Target Date: ${g.due_date}` : "Extracted task from journal analysis.")}
                                </p>
                              </div>

                              <div className="shrink-0 flex items-center justify-end sm:self-center">
                                {isRegistered ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E2E9DF] text-[#4B5D3C] font-bold text-xs border border-[#4B5D3C]/20">
                                    <CheckCircle2 size={13} className="text-[#4B5D3C]" />
                                    Goal Registered
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleAcceptGoal(g)}
                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#4B5D3C] hover:bg-[#3A492E] active:scale-95 disabled:opacity-50 text-white font-semibold text-xs shadow-2xs transition-all cursor-pointer"
                                  >
                                    {isProcessing ? (
                                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
                                    ) : (
                                      <Plus size={14} />
                                    )}
                                    Accept Goal
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. DETECTED COMPLETED TASKS */}
                  {completedTasksList.length > 0 && (
                    <div className="rounded-xl bg-[#F4F1E8]/60 p-4 border border-[#E2E9DF] shadow-2xs">
                      <h4 className="text-sm font-bold text-[#26261F] mb-2.5">
                        Detected Completed Tasks
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-700 font-medium">
                        {completedTasksList.map((taskText, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 size={15} className="text-[#4B5D3C] shrink-0 mt-0.5" />
                            <span className="text-xs font-medium text-[#26261F]">{taskText}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. ACTIVE BLOCKERS DETECTED */}
                  {blockersList.length > 0 && (
                    <div className="rounded-xl bg-[#FBEBE3] p-4 border border-[#C1622C]/20">
                      <h4 className="text-xs font-bold text-[#C1622C] uppercase tracking-wider mb-2">
                        Active Blockers Detected
                      </h4>
                      <ul className="space-y-1.5 text-xs text-[#C1622C] font-medium">
                        {blockersList.map((b, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <AlertTriangle size={14} className="text-[#C1622C] shrink-0" />
                            <span>{b.text || b.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })()}
          </div>

          {/* RIGHT SIDEBAR COLUMN ("AI Journal History") */}
          <div className="lg:col-span-5 xl:col-span-4 min-w-0">
            <section className="sticky top-24 panel p-5 sm:p-6 shadow-xs bg-white border border-[#E2E9DF] rounded-2xl overflow-hidden min-w-0">
              <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-[#E2E9DF]">
                <h2 className="text-base font-bold text-[#26261F]">
                  AI Journal History ({journals.length})
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search AI Journal entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E9DF] bg-[#F4F1E8]/70 py-2 pl-9 pr-3 text-xs text-[#26261F] outline-none focus:border-[#4B5D3C] focus:bg-white focus:ring-1 focus:ring-[#4B5D3C]/20 transition shadow-2xs"
                />
              </div>

              {loadingList ? (
                <JournalLoadingState />
              ) : hasLoadedJournals && filteredJournals.length === 0 ? (
                <div className="p-6 text-center bg-[#F4F1E8]/50 rounded-xl border border-[#E2E9DF]">
                  <BookOpen size={28} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-[#26261F] font-bold">No AI Journal entries found</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Record your daily reflections to populate your archive.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1 animate-fade-in">
                    {paginatedJournals.map((j) => {
                      const tags = getTagsForJournal(j);
                      const emoji = getEmojiForJournal(j);
                      return (
                        <div
                          key={j.id}
                          onClick={() => {
                            setSelectedJournal(j);
                            setLatestAnalysis(j.ai_analysis);
                            setShowCompose(false);
                            setSubmitting(false);
                            setError("");
                          }}
                          className={`group rounded-xl p-4 border transition-all duration-200 cursor-pointer ${
                            selectedJournal?.id === j.id
                              ? "border-[#4B5D3C] bg-[#E2E9DF]/50 ring-2 ring-[#4B5D3C]/20 shadow-xs"
                              : "border-[#E2E9DF] bg-[#F4F1E8]/40 hover:bg-white hover:border-[#4B5D3C]/40 hover:shadow-xs"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-[#26261F] flex items-center gap-1.5">
                              <Calendar size={13} className="text-[#4B5D3C]" />
                              {new Date(j.created_at || j.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {j.detected_mood && (
                                <MoodBadge
                                  mood={j.detected_mood}
                                  confidence={j.mood_confidence}
                                  size="sm"
                                  showKeywords={false}
                                />
                              )}
                              <span className="text-xs bg-white rounded-md px-1.5 py-0.5 border border-[#E2E9DF] shadow-2xs">
                                {emoji}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-medium mb-2.5">
                            {j.content && !j.content.startsWith("enc:v1:")
                              ? j.content
                              : (j.title || j.ai_analysis?.quick_summary || j.ai_analysis?.title || "Journal Reflection")}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-[#E2E9DF]">
                            <div className="flex flex-wrap items-center gap-1">
                              {j.trigger_keywords?.slice(0, 2).map((kw, i) => (
                                <span
                                  key={`kw-${i}`}
                                  className="rounded-md bg-emerald-50 text-emerald-800 px-1.5 py-0.5 text-[9px] font-semibold border border-emerald-200"
                                >
                                  #{kw}
                                </span>
                              ))}
                              {tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-[#26261F] border border-[#E2E9DF]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJournal(j.id);
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                              title="Delete AI Journal Entry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalItems={filteredJournals.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(newLimit) => {
                      setItemsPerPage(newLimit);
                      setCurrentPage(1);
                    }}
                    itemsPerPageOptions={[5, 10, 20]}
                  />
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}