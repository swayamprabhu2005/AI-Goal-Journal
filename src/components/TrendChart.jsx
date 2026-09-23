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
 * Supports both single dataset (`data = []`) and multi-goal comparison (`multiSeries = [...]`).
 * No external chart library required — pure SVG/CSS that integrates smoothly into the Calm Moss theme.
 */
export default function TrendChart({ data = [], multiSeries = null }) {
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
  const yTicks = [0, 25, 50, 75, 100];

  const y = (v) =>
    padT +
    chartH -
    ((Math.max(minV, Math.min(maxV, v)) - minV) / (maxV - minV)) * chartH;

  // --- MULTI-SERIES RENDERING ---
  if (multiSeries && multiSeries.length > 0) {
    // Collect all unique dates across series to build a coherent x-axis
    const dateMap = new Map();
    multiSeries.forEach((s) => {
      (s.points || []).forEach((pt) => {
        const dStr = formatChartDate(pt.date || pt.created_at);
        if (dStr && !dateMap.has(dStr)) {
          dateMap.set(dStr, new Date(pt.date || pt.created_at).getTime() || 0);
        }
      });
    });

    const sortedDates = Array.from(dateMap.keys());
    const numCols = Math.max(2, sortedDates.length);
    const xPos = (colIdx) => padL + (colIdx / (numCols - 1)) * chartW;

    return (
      <div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Multi-goal progress trend chart"
        >
          {/* Horizontal gridlines + Y-axis labels */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padL}
                y1={y(tick)}
                x2={W - padR}
                y2={y(tick)}
                stroke="#E2E9DF"
                strokeWidth={1}
                strokeDasharray={tick === 0 ? "" : "3 4"}
              />
              <text
                x={padL - 8}
                y={y(tick) + 4}
                textAnchor="end"
                fontSize={11}
                fontWeight={600}
                fill="#64748B"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Render lines for each goal series */}
          {multiSeries.map((series) => {
            const pts = series.points || [];
            if (pts.length < 2) {
              if (pts.length === 1) {
                const singleY = y(pts[0].progress_value);
                return (
                  <circle
                    key={series.id}
                    cx={padL + chartW / 2}
                    cy={singleY}
                    r={5}
                    fill={series.color}
                  />
                );
              }
              return null;
            }

            const stepX = chartW / (pts.length - 1);
            return (
              <g key={series.id}>
                {Array.from({ length: pts.length - 1 }).map((_, i) => (
                  <line
                    key={`${series.id}-${i}`}
                    x1={padL + i * stepX}
                    y1={y(pts[i].progress_value)}
                    x2={padL + (i + 1) * stepX}
                    y2={y(pts[i + 1].progress_value)}
                    stroke={series.color}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                ))}
                {pts.map((pt, i) => (
                  <g key={`${series.id}-pt-${i}`} className="group cursor-pointer">
                    <circle
                      cx={padL + i * stepX}
                      cy={y(pt.progress_value)}
                      r={i === pts.length - 1 ? 6 : 4.5}
                      fill="#ffffff"
                      stroke={series.color}
                      strokeWidth={2.5}
                      className="transition-transform duration-200 hover:scale-125"
                    />
                    <title>{`${series.label}: ${pt.progress_value}%`}</title>
                  </g>
                ))}
              </g>
            );
          })}

          {/* X-axis date labels */}
          {sortedDates.length <= 1 ? (
            <>
              <text x={padL} y={H - 14} textAnchor="start" fontSize={10} fontWeight={600} fill="#94A3B8">
                Milestone Start
              </text>
              <text x={W - padR} y={H - 14} textAnchor="end" fontSize={10} fontWeight={600} fill="#94A3B8">
                {sortedDates[0] || "Current"}
              </text>
            </>
          ) : (
            sortedDates.map((dateStr, i) =>
              i % Math.max(1, Math.ceil(sortedDates.length / 6)) === 0 || i === sortedDates.length - 1 ? (
                <text
                  key={`label-${dateStr}-${i}`}
                  x={xPos(i)}
                  y={H - 14}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill="#94A3B8"
                >
                  {dateStr}
                </text>
              ) : null
            )
          )}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#E2E9DF]">
          {multiSeries.map((s) => (
            <div
              key={s.id}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#F4F1E8]/70 border border-[#E2E9DF] text-xs text-[#26261F] font-semibold shadow-2xs"
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="truncate max-w-[170px]">{s.label}</span>
              <span
                className="text-[11px] font-bold px-1.5 py-0.2 rounded-md font-mono"
                style={{ backgroundColor: `${s.color}18`, color: s.color }}
              >
                {s.currentProgress}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- SINGLE DATASET RENDERING ---
  const n = data.length;

  if (n === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-slate-400 italic">
        No progress checkpoints recorded yet.
      </div>
    );
  }

  const x = (i) => (n <= 1 ? padL + chartW / 2 : padL + (i / (n - 1)) * chartW);
  const labelStep = Math.max(1, Math.ceil(n / 6));

  const last = data[n - 1]?.progress_value;
  const secondLast = data[n - 2]?.progress_value;
  const trendColor =
    n >= 2
      ? last > secondLast
        ? "#4B5D3C"
        : last < secondLast
        ? "#C1622C"
        : "#7A9672"
      : "#4B5D3C";

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
            stroke="#E2E9DF"
            strokeWidth={1}
            strokeDasharray={tick === 0 ? "" : "3 4"}
          />
          <text
            x={padL - 8}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={11}
            fontWeight={600}
            fill="#64748B"
          >
            {tick}%
          </text>
        </g>
      ))}

      {/* Trend line segments */}
      {n > 1 &&
        Array.from({ length: n - 1 }).map((_, i) => {
          const from = data[i].progress_value;
          const to = data[i + 1].progress_value;
          const color = to > from ? "#4B5D3C" : to < from ? "#C1622C" : "#7A9672";
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
            stroke={i === n - 1 ? trendColor : "#4B5D3C"}
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
