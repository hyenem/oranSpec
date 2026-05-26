import { useMemo, useState } from "react";
import Fuse from "fuse.js";

interface Field {
  id: string;
  name: string;
  longName: string;
  category: string;
  headingNumber: string;
  summary?: string;
}

interface Props {
  fields: Field[];
}

export default function FieldSearch({ fields }: Props) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | "common" | "section">("all");

  const fuse = useMemo(
    () =>
      new Fuse(fields, {
        keys: ["name", "longName", "summary"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [fields]
  );

  const filtered = useMemo(() => {
    let result = fields;
    if (cat !== "all") result = result.filter((f) => f.category === cat);
    if (q.trim().length >= 2) {
      const ids = new Set(fuse.search(q).map((r) => r.item.id));
      result = result.filter((f) => ids.has(f.id));
    }
    return result;
  }, [fields, q, cat, fuse]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="search"
          placeholder="필드 이름, 설명 검색 (예: beamId, ueId, frameId)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[260px] px-3 py-2 border border-ink-200 dark:border-ink-700 rounded-md bg-white dark:bg-ink-900 text-sm"
        />
        <div className="flex gap-1 text-xs">
          {(["all", "common", "section"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded ${cat === c ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300"}`}
            >
              {c === "all" ? "전체" : c === "common" ? "Common (7.5.2)" : "Section (7.5.3)"}
            </button>
          ))}
        </div>
        <div className="text-xs text-ink-500 font-mono">{filtered.length} / {fields.length}</div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-ink-200 dark:border-ink-700">
        <table className="w-full text-sm">
          <thead className="bg-ink-100 dark:bg-ink-800 text-left">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Long Name</th>
              <th className="px-3 py-2 hidden md:table-cell">Section</th>
              <th className="px-3 py-2 hidden lg:table-cell">Summary</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-t border-ink-100 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800/50">
                <td className="px-3 py-2 font-mono whitespace-nowrap">{f.name}</td>
                <td className="px-3 py-2">{f.longName}</td>
                <td className="px-3 py-2 font-mono text-xs text-ink-500 hidden md:table-cell">§ {f.headingNumber}</td>
                <td className="px-3 py-2 text-xs text-ink-600 dark:text-ink-300 max-w-md hidden lg:table-cell">
                  {f.summary?.slice(0, 240)}{f.summary && f.summary.length > 240 ? "…" : ""}
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-ink-500 text-sm">결과 없음</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
