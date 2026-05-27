import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import type { SearchEntry, SearchKind } from "../lib/searchIndex";

interface Props {
  entries: SearchEntry[];
}

const KIND_LABEL: Record<SearchKind, string> = {
  "section-type": "ST",
  extension: "SE",
  field: "FLD",
  glossary: "GLO",
  page: "PG",
};

const KIND_FULL: Record<SearchKind, string> = {
  "section-type": "Section Type",
  extension: "Extension",
  field: "Field",
  glossary: "Glossary",
  page: "Page",
};

const KIND_ORDER: SearchKind[] = [
  "section-type",
  "extension",
  "field",
  "glossary",
  "page",
];

const KIND_ACCENT: Record<SearchKind, string> = {
  "section-type": "text-brand-600 dark:text-brand-300",
  extension: "text-emerald-600 dark:text-emerald-300",
  field: "text-amber-600 dark:text-amber-300",
  glossary: "text-violet-600 dark:text-violet-300",
  page: "text-ink-500 dark:text-ink-300",
};

const KIND_DOT: Record<SearchKind, string> = {
  "section-type": "bg-brand-500",
  extension: "bg-emerald-500",
  field: "bg-amber-500",
  glossary: "bg-violet-500",
  page: "bg-ink-400",
};

export default function SiteSearch({ entries }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: [
          { name: "title", weight: 3 },
          { name: "subtitle", weight: 2 },
          { name: "keywords", weight: 1.5 },
          { name: "description", weight: 1 },
          { name: "heading", weight: 0.5 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true,
        minMatchCharLength: 1,
      }),
    [entries]
  );

  const results = useMemo(() => {
    const term = q.trim();
    if (!term) {
      return entries
        .filter((e) => e.kind === "section-type" || e.kind === "page")
        .slice(0, 12);
    }
    return fuse.search(term, { limit: 50 }).map((r) => r.item);
  }, [q, entries, fuse]);

  const grouped = useMemo(() => {
    const map = new Map<SearchKind, SearchEntry[]>();
    for (const r of results) {
      if (!map.has(r.kind)) map.set(r.kind, []);
      map.get(r.kind)!.push(r);
    }
    return KIND_ORDER.flatMap((k) =>
      map.has(k) ? [{ kind: k, items: map.get(k)! }] : []
    );
  }, [results]);

  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isModK) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "/" && !open) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQ("");
    }
  }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (entry: SearchEntry) => {
    window.location.href = entry.href;
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[active]) go(flat[active]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 text-[12px] rounded-md border hairline bg-white/60 dark:bg-ink-900/40 text-ink-500 hover:text-ink-900 dark:hover:text-white hover:border-ink-300 dark:hover:border-ink-600 min-w-[200px] transition-colors"
        aria-label="사이트 검색 열기 (Cmd K)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="flex-1 text-left font-mono tracking-tight">
          <span className="opacity-60">spec://</span>search
        </span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border hairline bg-ink-50 dark:bg-ink-800/60 text-ink-500">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="사이트 검색"
        >
          <div
            className="absolute inset-0 bg-ink-900/70 dark:bg-black/70 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-2xl">
            {/* corner brackets */}
            <span className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t border-l border-brand-500" aria-hidden="true" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t border-r border-brand-500" aria-hidden="true" />
            <span className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b border-l border-brand-500" aria-hidden="true" />
            <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b border-r border-brand-500" aria-hidden="true" />

            <div className="relative bg-white dark:bg-ink-900 border hairline shadow-2xl overflow-hidden">
              {/* top scanline */}
              <div className="relative h-px overflow-hidden bg-ink-200/40 dark:bg-ink-700/40" aria-hidden="true">
                <div className="absolute top-0 h-px w-1/3 scanline animate-sweep" />
              </div>

              {/* meta strip */}
              <div className="flex items-center justify-between px-4 pt-2 pb-1 text-[10px] font-mono uppercase tracking-[0.22em] text-ink-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-brand-500 animate-pulseLine" />
                  spec.lookup
                </span>
                <span>{entries.length} indexed</span>
              </div>

              <div className="flex items-center gap-3 px-4 py-2.5 border-b hairline">
                <span className="font-mono text-[12px] text-brand-600 dark:text-brand-400 select-none">›</span>
                <input
                  ref={inputRef}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={onInputKey}
                  placeholder="ST1, beamId, DMRS, beamforming weights…"
                  className="flex-1 bg-transparent outline-none text-[15px] font-mono tracking-tight placeholder:text-ink-400 placeholder:font-sans placeholder:tracking-normal"
                  spellCheck={false}
                  autoComplete="off"
                />
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border hairline bg-ink-50 dark:bg-ink-800/60 text-ink-500">
                  ESC
                </kbd>
              </div>

              <div
                ref={listRef}
                className="max-h-[60vh] overflow-y-auto"
                role="listbox"
              >
                {grouped.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400 mb-3">
                      ⎯⎯ no signal ⎯⎯
                    </div>
                    <div className="font-display italic text-lg text-ink-500">
                      No matches in the spec.
                    </div>
                    <div className="text-xs text-ink-400 mt-1.5">
                      Try a Section Type number, a field name, or an acronym.
                    </div>
                  </div>
                ) : (
                  grouped.map((g, gi) => (
                    <div key={g.kind} className={gi > 0 ? "border-t hairline" : ""}>
                      <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-1.5 bg-ink-50/95 dark:bg-ink-800/80 backdrop-blur-sm border-b hairline">
                        <span className={`w-1 h-1 rounded-full ${KIND_DOT[g.kind]}`} aria-hidden="true" />
                        <span className={`font-mono text-[10px] uppercase tracking-[0.24em] ${KIND_ACCENT[g.kind]}`}>
                          {KIND_FULL[g.kind]}
                        </span>
                        <span className="ml-auto font-mono text-[10px] tabular text-ink-400">
                          {String(g.items.length).padStart(2, "0")}
                        </span>
                      </div>
                      {g.items.map((item) => {
                        const idx = flat.indexOf(item);
                        const isActive = idx === active;
                        return (
                          <button
                            key={item.id}
                            data-idx={idx}
                            type="button"
                            onClick={() => go(item)}
                            onMouseEnter={() => setActive(idx)}
                            className={`relative block w-full text-left pl-5 pr-4 py-2.5 transition-colors ${
                              isActive
                                ? "bg-brand-50/80 dark:bg-brand-900/15"
                                : "hover:bg-ink-50/60 dark:hover:bg-ink-800/40"
                            }`}
                            role="option"
                            aria-selected={isActive}
                          >
                            {/* active indicator */}
                            <span
                              className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] transition-all ${
                                isActive ? "bg-brand-500" : "bg-transparent"
                              }`}
                              aria-hidden="true"
                            />
                            <div className="flex items-baseline gap-3">
                              <span className={`font-mono text-[9px] uppercase tracking-[0.18em] tabular w-7 shrink-0 ${KIND_ACCENT[item.kind]}`}>
                                {KIND_LABEL[item.kind]}
                              </span>
                              <span className="font-mono text-[13px] font-medium tracking-tight">
                                {item.title}
                              </span>
                              {item.subtitle ? (
                                <span className="font-display italic text-[13px] text-ink-500 dark:text-ink-400 truncate">
                                  {item.subtitle}
                                </span>
                              ) : null}
                              {item.heading ? (
                                <span className="ml-auto font-mono text-[10px] tabular text-ink-400 shrink-0">
                                  §{item.heading}
                                </span>
                              ) : null}
                            </div>
                            {item.description ? (
                              <div className="mt-1 ml-10 text-[12px] text-ink-600 dark:text-ink-400 leading-relaxed line-clamp-2 text-pretty">
                                {item.description}
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between px-4 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-400 border-t hairline bg-ink-50/60 dark:bg-ink-800/30">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="font-mono px-1 py-0.5 rounded border hairline bg-white dark:bg-ink-900 text-ink-500 normal-case tracking-normal">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="font-mono px-1 py-0.5 rounded border hairline bg-white dark:bg-ink-900 text-ink-500 normal-case tracking-normal">↵</kbd>
                    open
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="font-mono px-1 py-0.5 rounded border hairline bg-white dark:bg-ink-900 text-ink-500 normal-case tracking-normal">/</kbd>
                    focus
                  </span>
                </div>
                <span className="tabular">
                  {String(flat.length).padStart(3, "0")} · TS.CUS v20
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
