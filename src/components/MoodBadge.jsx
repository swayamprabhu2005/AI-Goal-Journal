export const MOOD_META = {
  accomplishment: {
    label: "Accomplishment",
    pillClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dotClass: "bg-emerald-600",
    emoji: "🏆",
    vibe: "Significant progress achieved; goals accomplished.",
  },
  motivation: {
    label: "High Motivation",
    pillClass: "bg-lime-50 text-lime-900 border-lime-300",
    dotClass: "bg-lime-600",
    emoji: "⚡",
    vibe: "High drive, determination, and forward ambition.",
  },
  motivated: {
    label: "Motivated",
    pillClass: "bg-lime-50 text-lime-900 border-lime-300",
    dotClass: "bg-lime-600",
    emoji: "⚡",
    vibe: "High drive and forward momentum.",
  },
  focus: {
    label: "Deep Focus",
    pillClass: "bg-teal-50 text-teal-800 border-teal-200/80",
    dotClass: "bg-teal-500",
    emoji: "🎯",
    vibe: "High cognitive absorption and flow state.",
  },
  gratitude: {
    label: "Gratitude & Calm",
    pillClass: "bg-[#E2E9DF] text-[#4B5D3C] border-[#4B5D3C]/30",
    dotClass: "bg-[#4B5D3C]",
    emoji: "🌿",
    vibe: "Reflective appreciation, peace, and grounded mind.",
  },
  calm: {
    label: "Calm & Centered",
    pillClass: "bg-[#E2E9DF] text-[#4B5D3C] border-[#4B5D3C]/30",
    dotClass: "bg-[#4B5D3C]",
    emoji: "🌿",
    vibe: "Grounded, mindful, and unhurried clarity.",
  },
  breakthrough: {
    label: "Breakthrough!",
    pillClass: "bg-amber-50 text-amber-900 border-amber-300",
    dotClass: "bg-amber-500",
    emoji: "💡",
    vibe: "Solved a difficult bottleneck or found fresh clarity.",
  },
  burnout: {
    label: "Exhausted / Burnout",
    pillClass: "bg-stone-100 text-stone-900 border-stone-300",
    dotClass: "bg-stone-600",
    emoji: "🔋",
    vibe: "Energy depleted; recovery and gentle pace required.",
  },
  overwhelmed: {
    label: "Overwhelmed",
    pillClass: "bg-red-50 text-red-900 border-red-200",
    dotClass: "bg-red-500",
    emoji: "🌋",
    vibe: "Cognitive overload; prioritize 1 single next action.",
  },
  frustration: {
    label: "Frustrated / Friction",
    pillClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotClass: "bg-rose-400",
    emoji: "😤",
    vibe: "Facing stubborn bottlenecks or unexpected resistance.",
  },
  frustrated: {
    label: "Frustrated / Friction",
    pillClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotClass: "bg-rose-400",
    emoji: "😤",
    vibe: "Facing stubborn bottlenecks or unexpected resistance.",
  },
  guilt: {
    label: "Friction & Guilt",
    pillClass: "bg-orange-50 text-orange-900 border-orange-200",
    dotClass: "bg-orange-400",
    emoji: "⏳",
    vibe: "Feeling behind; be compassionate and take a 2-min restart step.",
  },
  celebration: {
    label: "Celebrating Win",
    pillClass: "bg-amber-50 text-amber-900 border-amber-300",
    dotClass: "bg-amber-500",
    emoji: "🎉",
    vibe: "Acknowledging meaningful progress and victory.",
  },
  neutral: {
    label: "Balanced / Steady",
    pillClass: "bg-slate-50 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
    emoji: "⚖️",
    vibe: "Stable, routine baseline reflection.",
  },
};

export default function MoodBadge({ mood, confidence, keywords = [], size = "md", showKeywords = true }) {
  if (!mood) return null;

  const key = String(mood).toLowerCase().trim();
  const meta = MOOD_META[key] || {
    label: key.charAt(0).toUpperCase() + key.slice(1),
    pillClass: "bg-[#E2E9DF] text-[#4B5D3C] border-[#4B5D3C]/30",
    dotClass: "bg-[#4B5D3C]",
    emoji: "💭",
    vibe: "Personal emotional reflection state.",
  };

  const confPct = confidence ? Math.round(Number(confidence) * (Number(confidence) <= 1.0 ? 100 : 1)) : null;

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border shadow-2xs ${meta.pillClass}`}
        title={`${meta.label}${confPct ? ` (${confPct}% confidence)` : ""}`}
      >
        <span>{meta.emoji}</span>
        <span>{meta.label}</span>
        {confPct !== null && <span className="opacity-70 text-[9px] font-mono">{confPct}%</span>}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold border shadow-2xs ${meta.pillClass}`}
      >
        <span className="text-sm">{meta.emoji}</span>
        <span>{meta.label}</span>
        {confPct !== null && (
          <span className="rounded-full bg-white/70 px-1.5 py-0.2 text-[10px] font-mono text-slate-700">
            {confPct}% conf
          </span>
        )}
      </div>

      {showKeywords && Array.isArray(keywords) && keywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {keywords.slice(0, 4).map((kw, i) => (
            <span
              key={i}
              className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-[#E2E9DF]"
            >
              #{kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
