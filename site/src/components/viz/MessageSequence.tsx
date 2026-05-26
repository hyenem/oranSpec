import { useMemo, useState } from "react";

/**
 * DU ↔ RU message sequence diagram.
 *
 * Lanes: O-DU on the left, O-RU on the right (and optionally UE on far right).
 * Each step is an arrow with a label (Section Type / Extension chips).
 *
 * Use this on a section type page to show the conversation it participates in.
 */

export type Lane = "O-DU" | "O-RU" | "UE";

export interface SeqStep {
  from: Lane;
  to: Lane;
  /** Header line, e.g. "C-Plane Section Type 1" */
  label: string;
  /** Section Type id for color coding */
  st?: number;
  /** Section Extensions piggy-backed on this message */
  ses?: number[];
  /** Short description shown on hover/expand */
  note?: string;
}

interface Props {
  steps: SeqStep[];
  lanes?: Lane[];
  title?: string;
  caption?: string;
  /** Color lookup by Section Type id */
  stColors?: Record<number, string>;
  seColors?: Record<number, string>;
}

const DEFAULT_LANES: Lane[] = ["O-DU", "O-RU", "UE"];

export default function MessageSequence({
  steps,
  lanes = DEFAULT_LANES,
  title = "DU ↔ RU 메시지 시퀀스",
  caption,
  stColors = {},
  seColors = {},
}: Props) {
  const [active, setActive] = useState<number | null>(null);

  const laneCount = lanes.length;
  const laneWidth = 220;
  const padX = 60;
  const rowH = 60;
  const headerH = 40;
  const width = padX * 2 + laneWidth * (laneCount - 1);
  const height = headerH + rowH * (steps.length + 1);

  const laneX = (lane: Lane) => padX + lanes.indexOf(lane) * laneWidth;

  return (
    <div className="border border-ink-200 dark:border-ink-700 rounded-lg p-4 bg-white dark:bg-ink-900">
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          style={{ maxWidth: "100%", height: "auto" }}
          preserveAspectRatio="xMinYMin meet"
        >
          {/* Lane headers and dashed lines */}
          {lanes.map((lane) => (
            <g key={lane}>
              <rect x={laneX(lane) - 40} y={6} width={80} height={26} rx={4} fill="#0c4faa" />
              <text x={laneX(lane)} y={24} textAnchor="middle" fontSize={12} fill="white" fontWeight={600}>
                {lane}
              </text>
              <line
                x1={laneX(lane)}
                y1={headerH}
                x2={laneX(lane)}
                y2={height - 10}
                stroke="#94a3b8"
                strokeDasharray="3 4"
              />
            </g>
          ))}
          {/* Steps */}
          {steps.map((s, i) => {
            const y = headerH + rowH * (i + 0.5);
            const x1 = laneX(s.from);
            const x2 = laneX(s.to);
            const dir = x2 > x1 ? 1 : -1;
            const color = (s.st !== undefined && stColors[s.st]) || "#1e7ef0";
            const isActive = active === i;
            const tipX = x2 - dir * 8;
            return (
              <g key={i} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} style={{ cursor: "pointer" }}>
                <rect x={Math.min(x1, x2)} y={y - rowH / 2 + 4} width={Math.abs(x2 - x1)} height={rowH - 8} fill={isActive ? color + "22" : "transparent"} />
                <line x1={x1} y1={y} x2={tipX} y2={y} stroke={color} strokeWidth={isActive ? 2.5 : 1.6} />
                <polygon
                  points={`${x2},${y} ${tipX},${y - 5} ${tipX},${y + 5}`}
                  fill={color}
                />
                <foreignObject x={Math.min(x1, x2) + 8} y={y - 28} width={Math.abs(x2 - x1) - 16} height={24}>
                  <div className="text-[12px] text-center" style={{ color: color, fontWeight: 600 }}>
                    {s.label}
                  </div>
                </foreignObject>
                <foreignObject x={Math.min(x1, x2) + 8} y={y + 4} width={Math.abs(x2 - x1) - 16} height={26}>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {s.ses?.map((se) => (
                      <span
                        key={se}
                        className="text-[10px] font-mono px-1.5 rounded"
                        style={{ background: (seColors[se] || "#64748b") + "33", color: seColors[se] || "#64748b" }}
                      >
                        SE{se}
                      </span>
                    ))}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
      {active !== null && steps[active]?.note ? (
        <p className="text-xs mt-2 text-ink-600 dark:text-ink-300">{steps[active].note}</p>
      ) : null}
      {caption ? <p className="text-xs text-ink-500 mt-2">{caption}</p> : null}
    </div>
  );
}
