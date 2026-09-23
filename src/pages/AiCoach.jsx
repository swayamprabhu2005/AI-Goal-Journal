import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  User,
  Send,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { coachApi } from "../services/api";
import { useData } from "../context/DataContext";
import MoodBadge from "../components/MoodBadge";
import FormattedChatMessage from "../components/FormattedChatMessage";

const SUGGESTED_PROMPTS = [
  "I'm feeling friction starting my tasks today. How can I build momentum?",
  "Break down my most urgent goal into 3 low-friction daily actions.",
  "Look at my recent blockers and suggest a practical workaround.",
  "Give me an energizing 45-minute focus routine for today.",
];

export default function AiCoach() {
  const { journals, goals, profile } = useData();

  // Conversational AI Coach state
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your personal coach. I could help you with anything related based on your goals and habits. What would you like to focus on today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const chatEndRef = useRef(null);

  const latestJournal = journals && journals.length > 0 ? journals[0] : null;
  const currentMood = latestJournal?.detected_mood;
  const moodConfidence = latestJournal?.mood_confidence;
  const triggerKeywords = latestJournal?.trigger_keywords || [];

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(textToSend) {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    setInputMessage("");
    setChatError("");

    const newHistory = [...messages, { role: "user", content: text }];
    setMessages(newHistory);
    setSending(true);

    try {
      const apiHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await coachApi.chat(text, apiHistory);
      const reply =
        res.reply ||
        "Taking a steady step forward today is what counts most. How can we simplify your next task?";
      setMessages([...newHistory, { role: "assistant", content: reply, model: res.model }]);
    } catch (err) {
      console.error("Coach chat error:", err);
      setChatError(err.message || "Failed to connect to AI Coach. Please try again.");
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content:
            "I encountered a temporary connection issue reaching the coaching engine. Keep your focus on your single next high-priority task, and we'll sync back up shortly!",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <div className="app-page bg-[#F4F1E8] min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-5 md:px-6 lg:px-8 space-y-4 animate-rise">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#4B5D3C]">
              ACCOUNTABILITY PARTNER
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#26261F]">
              AI Coach
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Two-way conversational guidance grounded in your live goals, habits, and emotional rhythms.
            </p>
          </div>

          {currentMood && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Current Emotional Pulse:
              </span>
              <MoodBadge mood={currentMood} confidence={moodConfidence} size="sm" showKeywords={false} />
            </div>
          )}
        </div>

        {/* Dedicated Conversational Chat Container */}
        <div className="flex flex-col rounded-2xl bg-white border border-[#E2E9DF] shadow-xs overflow-hidden h-[calc(100vh-210px)] min-h-[580px]">
          {/* Coach Header Banner */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E9DF] bg-gradient-to-r from-[#E2E9DF]/60 via-white to-[#F4F1E8]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4B5D3C] text-white shadow-2xs">
                <Bot size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#26261F] flex items-center gap-2">
                  Personal AI Coach
                  <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                    Active
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Grounded in your {goals.length} active {goals.length === 1 ? "goal" : "goals"} and recent reflections.
                </p>
              </div>
            </div>

            {currentMood && (
              <div className="flex md:hidden">
                <MoodBadge mood={currentMood} confidence={moodConfidence} size="sm" showKeywords={false} />
              </div>
            )}
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FBFBFA]">
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-fade-in`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs text-xs font-bold ${
                      isUser ? "bg-[#26261F] text-white" : "bg-[#4B5D3C] text-white"
                    }`}
                  >
                    {isUser ? <User size={15} /> : <Bot size={16} />}
                  </div>

                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-[#3A492E] text-white rounded-tr-none font-medium"
                        : "bg-white text-[#26261F] border border-[#E2E9DF] rounded-tl-none font-medium"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-line">{m.content}</p>
                    ) : (
                      <FormattedChatMessage content={m.content} />
                    )}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start gap-3 animate-pulse">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#4B5D3C] text-white shadow-2xs">
                  <Bot size={16} />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white p-4 border border-[#E2E9DF] text-xs text-slate-500 shadow-2xs flex items-center gap-2 font-medium">
                  <RefreshCw size={14} className="animate-spin text-[#4B5D3C]" />
                  <span>Coach is reviewing your goals and reflecting...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggested Prompt Pills */}
          <div className="px-4 py-2 border-t border-[#E2E9DF] bg-white flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Lightbulb size={12} className="text-[#C1622C]" /> Quick Focus:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={sending}
                className="rounded-full bg-[#F4F1E8] px-3 py-1 text-[11px] font-semibold text-slate-700 border border-[#E2E9DF] hover:bg-[#E2E9DF] hover:text-[#26261F] transition disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 border-t border-[#E2E9DF] bg-white">
            {chatError && (
              <div className="mb-2 text-[11px] font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                {chatError}
              </div>
            )}
            <div className="flex items-center gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coach anything about your goals, habits, blockers, or mindset..."
                rows={1}
                disabled={sending}
                className="input-field flex-1 resize-none py-2.5 px-4 text-xs sm:text-sm bg-[#FBFBFA] border border-[#E2E9DF] rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#4B5D3C] focus:ring-1 focus:ring-[#4B5D3C]"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || sending}
                className="primary-button h-10 w-10 !p-0 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 shadow-xs"
                title="Send message"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center font-medium">
              Press Enter to send. Your reflections remain encrypted and private.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
