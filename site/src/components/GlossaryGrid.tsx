import { useMemo, useState } from "react";
import { GLOSSARY, GLOSSARY_CATEGORIES, type GlossaryEntry } from "../data/glossary";

export default function GlossaryGrid() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let arr = GLOSSARY;
    if (cat !== "all") arr = arr.filter((g) => g.category === cat);
    if (q.trim().length >= 1) {
      const s = q.toLowerCase();
      arr = arr.filter(
        (g) =>
          g.term.toLowerCase().includes(s) ||
          g.longForm?.toLowerCase().includes(s) ||
          g.oneLine.toLowerCase().includes(s) ||
          g.analogy.toLowerCase().includes(s) ||
          g.explain.toLowerCase().includes(s)
      );
    }
    return arr;
  }, [q, cat]);

  const open = openSlug ? GLOSSARY.find((g) => g.slug === openSlug) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="search"
          placeholder="용어 검색 (예: PRB, beamId, eAxC, PRACH)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[260px] px-3 py-2 border border-ink-200 dark:border-ink-700 rounded-md bg-white dark:bg-ink-900 text-sm"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-3 py-2 border border-ink-200 dark:border-ink-700 rounded-md text-sm bg-white dark:bg-ink-900"
        >
          <option value="all">전체 카테고리</option>
          {GLOSSARY_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-500 font-mono">{filtered.length}/{GLOSSARY.length}</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((g) => (
          <button
            key={g.slug}
            onClick={() => setOpenSlug(g.slug)}
            className="text-left rounded-xl border border-ink-200 dark:border-ink-700 p-4 bg-white dark:bg-ink-900 hover:shadow-md hover:-translate-y-0.5 transition"
          >
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-semibold font-mono">{g.term}</span>
              {g.longForm ? <span className="text-[11px] text-ink-500">{g.longForm}</span> : null}
            </div>
            <p className="text-sm text-ink-700 dark:text-ink-200">{g.oneLine}</p>
            <p className="text-xs text-ink-500 mt-2 italic">💬 {g.analogy}</p>
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setOpenSlug(null)}
        >
          <div
            className="bg-white dark:bg-ink-900 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-ink-200 dark:border-ink-700">
              <div className="flex items-baseline gap-3 mb-1">
                <h2 className="text-2xl font-bold font-mono">{open.term}</h2>
                {open.longForm ? <span className="text-sm text-ink-500">{open.longForm}</span> : null}
              </div>
              <p className="text-ink-700 dark:text-ink-200">{open.oneLine}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-brand-50 dark:bg-brand-900/20 border-l-4 border-brand-500 p-3 rounded">
                <div className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">💬 비유로 이해하기</div>
                <p className="text-sm">{open.analogy}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-ink-500 mb-2">자세히</div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">{open.explain}</div>
              </div>
              {open.relatedTo.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold text-ink-500 mb-2">관련 용어</div>
                  <div className="flex flex-wrap gap-1">
                    {open.relatedTo.map((slug) => {
                      const rel = GLOSSARY.find((g) => g.slug === slug);
                      if (!rel) return null;
                      return (
                        <button
                          key={slug}
                          onClick={() => setOpenSlug(slug)}
                          className="text-xs font-mono px-2 py-1 rounded bg-ink-100 dark:bg-ink-800 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition"
                        >
                          {rel.term}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {open.inSpec ? (
                <div className="text-xs text-ink-500">
                  스펙 출처: § {open.inSpec}
                </div>
              ) : null}
            </div>
            <div className="px-6 py-3 border-t border-ink-200 dark:border-ink-700 flex justify-end">
              <button
                onClick={() => setOpenSlug(null)}
                className="text-sm px-3 py-1.5 rounded bg-ink-100 dark:bg-ink-800 hover:bg-ink-200"
              >
                닫기 (Esc)
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
