import { useMemo, useState } from "react";

/**
 * Packet bit layout visualization.
 *
 * Renders an O-RAN style field table where each field has a name, bit width,
 * and optional description. Fields snap into 8-bit rows so the visual matches
 * the typical "octet" diagrams used in the C-Plane spec.
 *
 * Use this for: per-section and per-extension bit-level diagrams.
 */

export interface BitField {
  name: string;
  bits: number;
  description?: string;
  color?: string;
  /** Optional grouping label for the legend. */
  group?: string;
  /** If true, the value is encoded across multiple octets. */
  spans?: boolean;
  /** Example value (decimal) to show in the cell. */
  value?: string;
}

interface Props {
  title?: string;
  fields: BitField[];
  bitsPerRow?: number;
  caption?: string;
  onFieldHover?: (field: BitField | null) => void;
}

const PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#a855f7",
];

export default function BitLayout({ title, fields, bitsPerRow = 8, caption, onFieldHover }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const totalBits = useMemo(() => fields.reduce((a, f) => a + f.bits, 0), [fields]);
  const colored = useMemo(
    () =>
      fields.map((f, i) => ({
        ...f,
        color: f.color || PALETTE[i % PALETTE.length],
      })),
    [fields]
  );

  // Build per-bit cell array
  const cells = useMemo(() => {
    const arr: Array<{ field: BitField & { color: string }; index: number; bitOfField: number }> = [];
    colored.forEach((f, idx) => {
      for (let b = 0; b < f.bits; b++) {
        arr.push({ field: f, index: idx, bitOfField: b });
      }
    });
    return arr;
  }, [colored]);

  const rows = Math.ceil(cells.length / bitsPerRow);

  return (
    <div className="border border-ink-200 dark:border-ink-700 rounded-lg p-4 bg-white dark:bg-ink-900">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="font-semibold">{title ?? "Bit layout"}</h4>
        <div className="text-xs text-ink-500 font-mono">
          {totalBits} bits ({Math.ceil(totalBits / 8)} octets)
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="text-ink-500 font-normal w-12 text-right pr-2">octet</th>
              {Array.from({ length: bitsPerRow }).map((_, i) => (
                <th key={i} className="text-ink-500 font-normal w-8 text-center">
                  {bitsPerRow - 1 - i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                <td className="text-ink-500 text-right pr-2 font-mono">{r}</td>
                {Array.from({ length: bitsPerRow }).map((_, c) => {
                  const cell = cells[r * bitsPerRow + c];
                  if (!cell) {
                    return <td key={c} className="w-8 h-8" />;
                  }
                  const { field, index } = cell;
                  const isStart = cell.bitOfField === 0;
                  const isActive = active === index;
                  return (
                    <td
                      key={c}
                      onMouseEnter={() => {
                        setActive(index);
                        onFieldHover?.(field);
                      }}
                      onMouseLeave={() => {
                        setActive(null);
                        onFieldHover?.(null);
                      }}
                      className={`bit-cell relative w-8 h-8 text-center transition cursor-pointer ${isActive ? "ring-2 ring-offset-0 ring-brand-500 z-10" : ""}`}
                      style={{
                        background: field.color + (isActive ? "" : "cc"),
                        color: "white",
                      }}
                      title={`${field.name} bit ${cell.bitOfField}`}
                    >
                      {isStart && field.bits >= 1 ? (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono">
                          {field.name.slice(0, 4)}
                        </span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption ? <p className="text-xs text-ink-500 mt-3">{caption}</p> : null}
      <div className="mt-4">
        <table className="text-xs w-full">
          <thead>
            <tr className="text-ink-500">
              <th className="text-left font-normal pb-1">Field</th>
              <th className="text-left font-normal pb-1">Bits</th>
              <th className="text-left font-normal pb-1">Description</th>
            </tr>
          </thead>
          <tbody>
            {colored.map((f, i) => (
              <tr
                key={i}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className={`border-t border-ink-100 dark:border-ink-800 ${active === i ? "bg-brand-50 dark:bg-brand-900/20" : ""}`}
              >
                <td className="py-1 pr-3 font-mono">
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                    style={{ background: f.color }}
                  />
                  {f.name}
                </td>
                <td className="py-1 pr-3 font-mono">{f.bits}</td>
                <td className="py-1 text-ink-600 dark:text-ink-300">{f.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
