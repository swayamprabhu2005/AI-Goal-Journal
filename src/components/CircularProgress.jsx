import { useEffect, useState } from "react";

/**
 * src/components/CircularProgress.jsx
 * Circular progress indicator built with SVG.
 */
export default function CircularProgress({
  value,
  className = "w-24 h-24",
  trackClass = "stroke-slate-200",
  fillClass = "stroke-indigo-600",
  center,
}) {
  const safeValue = (() => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(100, Math.max(0, Math.round(n)));
  })();

  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(safeValue);
      return undefined;
    }

    setShown(0);
    const id = requestAnimationFrame(() => setShown(safeValue));
    return () => cancelAnimationFrame(id);
  }, [safeValue]);

  const dashoffset = circumference - (shown / 100) * circumference;

  return (
    <div className={"relative inline-flex items-center justify-center " + className}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        className="block"
        role="img"
        aria-label={`Progress: ${safeValue}%`}
      >
        <circle
          className={trackClass}
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          strokeWidth={strokeWidth}
        />
        <g transform="rotate(-90 50 50)">
          <circle
            className={fillClass}
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{
              transition: "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1), stroke 500ms ease",
            }}
          />
        </g>
      </svg>
      <span className="absolute pointer-events-none text-xs font-bold text-slate-900 sm:text-sm">
        {center ?? `${safeValue}%`}
      </span>
    </div>
  );
}
