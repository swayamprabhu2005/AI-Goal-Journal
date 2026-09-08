import React from "react";

/** Short date label for the SVG x-axis (e.g. "5 Feb"). */
export function formatChartDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Human-friendly progress change text: "+5%", "-3%", "0%". */
export function formatChange(value) {
  if (typeof value !== "number") return "0%";
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return "0%";
}

/**
 * Lightweight, responsive SVG trend chart built from backend progress history.
 * No external chart library required — pure SVG/CSS that integrates smoothly into the Calm Moss theme.
 */
export default function TrendChart({ data = [] }) {
  const W = 720;
  const H = 260;
  const padL = 42;
  const padR = 16;
  const padT = 18;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const minV = 0;
  const maxV = 100;
  const n = data.length;

  if (n === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-slate-400 italic">
        No progress checkpoints recorded yet.
      </div>
    );
  }

  const x = (i) => (n <= 1 ? padL + chartW / 2 : padL + (i / (n - 1)) * chartW);
  const y = (v) =>
    padT +
    chartH -
    ((Math.max(minV, Math.min(maxV, v)) - minV) / (maxV - minV)) * chartH;

  const yTicks = [0, 25, 50, 75, 100];
  const labelStep = Math.max(1, Math.ceil(n / 6));

  const last = data[n - 1]?.progress_value;
  const secondLast = data[n - 2]?.progress_value;
  const trendColor =
    n >= 2
      ? last > secondLast
        ? "#059669"
        : last < secondLast
        ? "#e11d48"
        : "#94a3b8"
      : "#6366f1";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="Progress trend chart"
    >
      {/* Horizontal gridlines + Y-axis labels */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={padL}
            y1={y(tick)}
            x2={W - padR}
            y2={y(tick)}
            stroke="#E2E8F0"
            strokeWidth={1}
            strokeDasharray={tick === 0 ? "" : "3 4"}
          />
          <text
            x={padL - 8}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={11}
            fontWeight={600}
            fill="#94A3B8"
          >
            {tick}%
          </text>
        </g>
      ))}

      {/* Trend line segments — each coloured by increase/decrease */}
      {n > 1 &&
        Array.from({ length: n - 1 }).map((_, i) => {
          const from = data[i].progress_value;
          const to = data[i + 1].progress_value;
          const color = to > from ? "#10b981" : to < from ? "#f43f5e" : "#94a3b8";
          return (
            <line
              key={`${data[i].id || i}-${i}`}
              x1={x(i)}
              y1={y(from)}
              x2={x(i + 1)}
              y2={y(to)}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          );
        })}

      {/* Data points for actual backend records */}
      {data.map((p, i) => (
        <g key={p.id || i} className="group cursor-pointer">
          <circle
            cx={x(i)}
            cy={y(p.progress_value)}
            r={i === n - 1 ? 6 : 4.5}
            fill="#ffffff"
            stroke={i === n - 1 ? trendColor : "#6366f1"}
            strokeWidth={i === n - 1 ? 3 : 2}
            className="transition-transform duration-200 hover:scale-125"
          />
          <title>{`${p.progress_value}% on ${formatChartDate(p.created_at)}${p.note ? ` - ${p.note}` : ''}`}</title>
        </g>
      ))}

      {/* X-axis date labels */}
      {data.map((p, i) =>
        i % labelStep === 0 || i === n - 1 ? (
          <text
            key={`label-${p.id || i}`}
            x={x(i)}
            y={H - 14}
            textAnchor="middle"
            fontSize={10}
            fontWeight={600}
            fill="#94A3B8"
          >
            {formatChartDate(p.created_at)}
          </text>
        ) : null
      )}
    </svg>
  );
}
