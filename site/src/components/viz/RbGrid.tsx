import { useMemo, useState } from "react";

/**
 * Time × Frequency grid (RB occupancy map).
 *
 * X axis = OFDM symbols inside a slot (default 14)
 * Y axis = PRBs (default 24)
 *
 * Sections are passed as objects with a (symbol range, PRB range) plus a label.
 * Hovering a cell highlights the owning section and shows its metadata.
 *
 * This is intentionally cell-by-cell rather than a smooth heatmap so that
 * even non-experts can see "each cell is one RE-time-slice this section owns".
 */

export interface RbSection {
  id: string;
  label: string;
  color: string;
  /** Inclusive start symbol */
  symStart: number;
  /** Number of symbols */
  symLen: number;
  /** Inclusive start PRB */
  prbStart: number;
  /** Number of PRBs */
  prbLen: number;
  /** Optional: applied extensions or notes */
  meta?: Record<string, string>;
}

interface Props {
  sections: RbSection[];
  symbols?: number;
  prbs?: number;
  title?: string;
  caption?: string;
}

export default function RbGrid({
  sections,
  symbols = 14,
  prbs = 24,
  title = "시간 × 주파수 그리드 (한 슬롯, RB 점유)",
  caption,
}: Props) {
  const [hoverCell, setHoverCell] = useState<{ sym: number; prb: number } | null>(null);

  const ownerMap = useMemo(() => {
    const map = new Map<string, RbSection>();
    for (const s of sections) {
      for (let dx = 0; dx < s.symLen; dx++) {
        for (let dy = 0; dy < s.prbLen; dy++) {
          const sym = s.symStart + dx;
          const prb = s.prbStart + dy;
          if (sym < 0 || sym >= symbols) continue;
          if (prb < 0 || prb >= prbs) continue;
          map.set(`${sym},${prb}`, s);
        }
      }
    }
    return map;
  }, [sections, symbols, prbs]);

  const cell = 22;
  const padLeft = 36;
  const padTop = 24;
  const width = padLeft + symbols * cell;
  const height = padTop + prbs * cell;

  const hovered = hoverCell ? ownerMap.get(`${hoverCell.sym},${hoverCell.prb}`) : undefined;

  return (
    <div className="border border-ink-200 dark:border-ink-700 rounded-lg p-4 bg-white dark:bg-ink-900">
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="font-semibold">{title}</h4>
        <div className="text-xs text-ink-500 font-mono">
          {symbols} sym × {prbs} PRB
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          style={{ maxWidth: "100%", height: "auto" }}
          className="select-none"
          preserveAspectRatio="xMinYMin meet"
        >
          {/* Axis labels */}
          {Array.from({ length: symbols }).map((_, x) => (
            <text
              key={x}
              x={padLeft + x * cell + cell / 2}
              y={16}
              fontSize={10}
              textAnchor="middle"
              fill="currentColor"
              className="text-ink-500"
            >
              {x}
            </text>
          ))}
          {Array.from({ length: prbs }).map((_, y) => (
            <text
              key={y}
              x={padLeft - 4}
              y={padTop + y * cell + cell / 2 + 3}
              fontSize={10}
              textAnchor="end"
              fill="currentColor"
              className="text-ink-500"
            >
              {y}
            </text>
          ))}
          {/* Cells */}
          {Array.from({ length: prbs }).map((_, y) =>
            Array.from({ length: symbols }).map((_, x) => {
              const owner = ownerMap.get(`${x},${y}`);
              const fx = padLeft + x * cell;
              const fy = padTop + y * cell;
              const fill = owner ? owner.color : "transparent";
              const stroke = owner ? owner.color : "#e5e7eb";
              return (
                <rect
                  key={`${x}-${y}`}
                  x={fx + 0.5}
                  y={fy + 0.5}
                  width={cell - 1}
                  height={cell - 1}
                  fill={fill}
                  fillOpacity={owner ? (hovered && hovered.id !== owner.id ? 0.25 : 0.85) : 0}
                  stroke={stroke}
                  strokeWidth={0.5}
                  onMouseEnter={() => setHoverCell({ sym: x, prb: y })}
                  onMouseLeave={() => setHoverCell(null)}
                />
              );
            })
          )}
          {/* Section borders */}
          {sections.map((s) => (
            <rect
              key={s.id}
              x={padLeft + s.symStart * cell + 0.5}
              y={padTop + s.prbStart * cell + 0.5}
              width={s.symLen * cell - 1}
              height={s.prbLen * cell - 1}
              fill="none"
              stroke={hovered?.id === s.id ? "#111" : s.color}
              strokeWidth={hovered?.id === s.id ? 2 : 1.2}
              strokeOpacity={hovered?.id === s.id ? 1 : 0.7}
              pointerEvents="none"
            />
          ))}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {sections.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
            <span className="font-mono">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs h-6 text-ink-600 dark:text-ink-300">
        {hovered ? (
          <span>
            <span className="font-mono font-semibold">{hovered.label}</span> — sym {hovered.symStart}~
            {hovered.symStart + hovered.symLen - 1}, PRB {hovered.prbStart}~
            {hovered.prbStart + hovered.prbLen - 1}
            {hovered.meta
              ? " · " +
                Object.entries(hovered.meta)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(", ")
              : ""}
          </span>
        ) : (
          <span className="text-ink-400">셀에 마우스를 올려보세요</span>
        )}
      </div>
      {caption ? <p className="text-xs text-ink-500 mt-2">{caption}</p> : null}
    </div>
  );
}
