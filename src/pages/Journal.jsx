import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Plus,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import { journalApi, goalApi } from "../services/api";
import { useData } from "../context/DataContext";

const ITEMS_PER_PAGE = 6;

export default function Journal() {
  const {
    journals,
    hasLoadedJournals,
    fetchJournals,
    addJournal,
    deleteJournalFromCache,
    addGoal,
  } = useData();

  const [activeTab, setActiveTab] = useState("text"); // 'text' | 'voice'
  const [entryText, setEntryText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [addedGoals, setAddedGoals] = useState({});

  const loadingList = !hasLoadedJournals;

  useEffect(() => {
    fetchJournals({ quiet: hasLoadedJournals });
  }, [fetchJournals, hasLoadedJournals]);

  async function handleSave(contentToSave, source = "text") {
    setError("");
    const content = (contentToSave || entryText).trim();

    if (!content) {
      setError("Please provide reflection text before submitting.");
      return;
    }

    setSubmitting(true);
    setLatestAnalysis(null);

    try {
      const result = await journalApi.createJournal({
        content,
        source,
      });

      addJournal(result);
      setLatestAnalysis(result.ai_analysis);
      setSelectedJournal(result);
      if (source === "text") {
        setEntryText("");
      }
    } catch (err) {
      setError(err.message || "Failed to process journal entry.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleVoiceTranscriptReady(transcriptText) {
    setEntryText(transcriptText);
    setActiveTab("text");
  }

  async function handleDeleteJournal(id) {
    if (!window.confirm("Are you sure you want to delete this journal entry?")) return;

    try {
      await journalApi.deleteJournal(id);
      deleteJournalFromCache(id);
      if (selectedJournal?.id === id) {
        setSelectedJournal(null);
      }
    } catch (err) {
      alert("Failed to delete entry: " + err.message);
    }
  }

  async function handleAcceptAutoGoal(goalText, goalIdx) {
    try {
      const created = await goalApi.createGoal({
        title: goalText,
        status: "Active",
        description: "Auto-detected from daily journal reflection.",
      });
      addGoal(created);
      setAddedGoals((prev) => ({ ...prev, [goalIdx]: true }));
    } catch (err) {
      alert("Failed to add goal: " + err.message);
    }
  }

  const filteredJournals = searchQuery.trim()
    ? journals.filter(
        (j) =>
          j.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : journals;

  // Pagination calculation
  const totalPages = Math.ceil(filteredJournals.length / ITEMS_PER_PAGE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const paginatedJournals = filteredJournals.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  return (
    <div className="app-page">
      <header className="border-b border-border bg-surface px-5 py-7 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[1250px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="section-label">DAILY REFLECTION</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-cream">
              Journaling Workspace
            </h1>
            <p className="mt-2 text-sm text-beige">
              Speak or write conversationally. AI structures your activities, matches goals, and categorizes blockers.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface2 p-1">
            <button
              onClick={() => setActiveTab("text")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "text"
                  ? "bg-teal-700 text-white shadow-card"
                  : "text-beige hover:text-cream"
              }`}
            >
              <FileText size={15} />
              Text Mode
            </button>
            <button
              onClick={() => setActiveTab("voice")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                activeTab === "voice"
                  ? "bg-teal-700 text-white shadow-card"
                  : "text-beige hover:text-cream"
              }`}
            >
              <Mic size={15} />
              Voice Mode (Whisper)
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1250px] px-5 py-7 md:px-8 lg:px-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            <strong>Error: </strong> {error}
          </div>
        )}

        {/* VOICE MODE */}
        {activeTab === "voice" && (
          <VoiceRecorder
            onTranscriptReady={handleVoiceTranscriptReady}
            onDirectSubmit={(text) => handleSave(text, "voice")}
            isSubmitting={submitting}
          />
        )}

        {/* TEXT MODE - STATIC WORKSPACE */}
        {activeTab === "text" && (
          <section className="panel p-6 shadow-card mb-8 border border-border bg-surface">
            <h3 className="text-base font-bold text-cream mb-2 flex items-center gap-2">
              <FileText size={18} className="text-teal-700" /> Write Your Daily Reflection
            </h3>
            <textarea
              rows={5}
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              className="input-dark p-4 text-sm text-cream placeholder:text-slate-400 leading-relaxed mb-3 w-full rounded-xl bg-slate-50 border border-border"
              placeholder="What did you work on today? Any obstacles or progress on your goals?"
            />
            <div className="flex justify-end">
              <button
                onClick={() => handleSave(entryText, "text")}
                disabled={submitting || !entryText.trim()}
                className="primary-button text-xs"
              >
                <Send size={14} />
                {submitting ? "Analyzing with Gemini..." : "Submit Journal & Analyze"}
              </button>
            </div>
          </section>
        )}

        {/* MERGED AI Structured JOURNAL EXTRACTION BANNER WITH MOTION */}
        <AnimatePresence>
          {latestAnalysis && (
            <motion.section
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35 }}
              className="panel p-6 mb-8 bg-gradient-to-br from-teal-50 to-white border border-teal-200 shadow-glow"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-teal-600" /> AI Journal Insights & Actions
                </h3>
                {latestAnalysis.mood && (
                  <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-bold text-teal-800 border border-teal-200">
                    Mood: {latestAnalysis.mood}
                  </span>
                )}
              </div>

              {latestAnalysis.quick_summary && (
                <p className="text-sm font-medium text-slate-800 italic mb-4 leading-relaxed">
                  "{latestAnalysis.quick_summary}"
                </p>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                {latestAnalysis.activities?.length > 0 && (
                  <div className="rounded-xl bg-slate-50 p-4 border border-border">
                    <h4 className="text-xs font-semibold text-slate-900 mb-2">Activities Extracted:</h4>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {latestAnalysis.activities.map((act, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>{act.text} <strong className="text-[10px] text-slate-400">({act.status})</strong></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestAnalysis.blockers?.length > 0 && (
                  <div className="rounded-xl bg-red-50/50 p-4 border border-red-100">
                    <h4 className="text-xs font-semibold text-red-600 mb-2">Active Blockers Detected:</h4>
                    <ul className="space-y-1.5 text-xs text-red-700">
                      {latestAnalysis.blockers.map((b, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <AlertTriangle size={14} className="text-red-500 shrink-0" />
                          <span>{b.text} ({b.category || "other"})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AUTO GOAL EXTRACTION WITH ONE-CLICK ACCEPTANCE */}
                {latestAnalysis.goals?.length > 0 && (
                  <div className="rounded-xl bg-teal-50/50 p-4 border border-teal-100 md:col-span-1">
                    <h4 className="text-xs font-semibold text-teal-900 mb-2 flex items-center gap-1.5">
                      <Target size={14} className="text-teal-700" /> AI Candidate Goals:
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {latestAnalysis.goals.map((g, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-2 p-2 rounded bg-white border border-teal-200">
                          <span className="text-slate-800 text-xs line-clamp-2">{g.text}</span>
                          {addedGoals[idx] ? (
                            <span className="text-[10px] font-bold text-emerald-600 shrink-0">Added ✓</span>
                          ) : (
                            <button
                              onClick={() => handleAcceptAutoGoal(g.text, idx)}
                              className="flex items-center gap-1 rounded bg-teal-700 px-2 py-1 text-[10px] font-bold text-white hover:bg-teal-800 shrink-0 transition"
                            >
                              <Plus size={12} /> Accept
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* JOURNAL HISTORY LIST WITH PAGINATION */}
        <section className="panel p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <p className="section-label">HISTORY</p>
              <h2 className="text-xl font-bold text-cream">Reflection Archive ({journals.length})</h2>
            </div>
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="input-dark px-3.5 py-2 text-xs max-w-xs"
            />
          </div>

          {loadingList ? (
            <p className="text-xs text-beige text-center py-8">Loading journal history...</p>
          ) : filteredJournals.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-cream font-semibold">No journal entries found</p>
              <p className="text-xs text-beige mt-1">Record your daily reflections above to populate your archive.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedJournals.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => setSelectedJournal(j)}
                    className={`panel p-5 cursor-pointer transition border ${
                      selectedJournal?.id === j.id ? "border-teal-700 bg-teal-50/40" : "border-border hover:border-teal-600"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={12} />
                        {new Date(j.created_at || j.createdAt).toLocaleDateString()}
                      </span>
                      <span className="rounded bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                        {j.source || "text"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-cream leading-snug line-clamp-1">
                      {j.title || j.ai_analysis?.title || "Reflection Entry"}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {j.content}
                    </p>
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {j.ai_analysis?.mood ? `Mood: ${j.ai_analysis.mood}` : "Raw Entry"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJournal(j.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                        title="Delete Journal"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-slate-600">
                    Page <strong className="text-slate-900">{safePage}</strong> of <strong className="text-slate-900">{totalPages}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="flex items-center gap-1 rounded-lg border border-border bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setCurrentPage(pg)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                          safePage === pg
                            ? "bg-teal-700 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {pg}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="flex items-center gap-1 rounded-lg border border-border bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 disabled:opacity-40"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}