/**
 * Field-paired Simulator.
 *
 * Design principle: every C-plane field gets its own dedicated visualization
 * paired next to its input. Changing a field updates ONLY that field's
 * visualization (plus a small "전체 결과" summary at the very top). This makes
 * each field's meaning visual, not just numeric.
 *
 * Flow:
 *   1. User picks a Section Type (ST 0/1/3/5/6)
 *   2. The ST's relevant fields appear, each as a row of [label/input | viz]
 *   3. User can toggle Section Extensions (SE 1/6/14/22)
 *   4. When an SE is on, its fields appear in the same row pattern
 */
import { useState } from "react";

// ====================================================================
// Types & defaults
// ====================================================================

type Ext = "se1" | "se6" | "se14" | "se22";
type ST = 0 | 1 | 3 | 5 | 6;

interface State {
  sectionType: ST;
  // Common header
  dataDirection: 0 | 1;
  frameId: number;
  subframeId: number;
  slotId: number;
  startSymbolId: number;
  numSymbol: number;
  sectionId: number;
  udCompHdr: number;
  filterIndex: number;
  // Section body
  startPrbc: number;
  numPrbc: number;
  reMask: number;
  rb: 0 | 1;
  symInc: 0 | 1;
  beamId: number;
  beamAngleDeg: number;
  ueId: number;
  // Extensions
  exts: Record<Ext, boolean>;
  se6Mask: number;
  se6RbgSize: number;
  se14NullDeg: number;
  se22ReqId: number;
  // Env
  numerology: 0 | 1 | 2 | 3;
  oruAntennas: number;
}

const DEFAULT: State = {
  sectionType: 1,
  dataDirection: 1,
  frameId: 10,
  subframeId: 2,
  slotId: 0,
  startSymbolId: 2,
  numSymbol: 12,
  sectionId: 1,
  udCompHdr: 0x91,
  filterIndex: 0,
  startPrbc: 0,
  numPrbc: 8,
  reMask: 0xfff,
  rb: 0,
  symInc: 0,
  beamId: 12,
  beamAngleDeg: 15,
  ueId: 0x1a,
  exts: { se1: false, se6: false, se14: false, se22: false },
  se6Mask: 0b1010_1010_1010_1010,
  se6RbgSize: 4,
  se14NullDeg: -25,
  se22ReqId: 42,
  numerology: 1,
  oruAntennas: 16,
};

const SCS_KHZ = [15, 30, 60, 120] as const;
const slotMs = (mu: number) => 1 / Math.pow(2, mu);
const symbolUs = (mu: number) => (slotMs(mu) * 1000) / 14;

const ST_OPTIONS: { id: ST; emoji: string; name: string; tagline: string; hint: string; color: string }[] = [
  { id: 1, emoji: "📡", name: "ST 1", tagline: "일반 데이터 (PDSCH/PUSCH)", hint: "가장 흔한 메시지. 데이터 채널 스케줄링.", color: "#3b82f6" },
  { id: 5, emoji: "👥", name: "ST 5", tagline: "UE 단위 (MU-MIMO)", hint: "ueId 명시 → 한 자원에 여러 UE 동시.", color: "#10b981" },
  { id: 0, emoji: "🚫", name: "ST 0", tagline: "유휴 (자원 비움)", hint: "RU에게 '이 영역은 송수신 없음'.", color: "#9ca3af" },
  { id: 3, emoji: "🚪", name: "ST 3", tagline: "PRACH (초기 접속)", hint: "다른 누메롤로지 채널 표현.", color: "#a855f7" },
  { id: 6, emoji: "📊", name: "ST 6", tagline: "채널 정보", hint: "RU가 측정한 UE 채널을 DU로 보고.", color: "#06b6d4" },
];

// ====================================================================
// Small helpers
// ====================================================================

function bits(n: number, w: number) {
  const m = (1 << w) - 1;
  return (n & m).toString(2).padStart(w, "0");
}

function popcount12(mask: number) {
  let c = 0;
  for (let i = 0; i < 12; i++) if ((mask >> i) & 1) c++;
  return c;
}

// ====================================================================
// Visualization atoms — one per field family
// ====================================================================

// 1) dataDirection — big arrow showing DU ↔ UE
function VizDirection({ dir }: { dir: 0 | 1 }) {
  const isDl = dir === 1;
  return (
    <svg viewBox="0 0 320 110" className="w-full max-w-md h-auto">
      <rect x={6} y={32} width={70} height={46} rx={4} fill="#0c4faa" />
      <text x={41} y={59} textAnchor="middle" fill="white" fontSize={13} fontWeight={700}>O-DU</text>
      <rect x={130} y={32} width={70} height={46} rx={4} fill="#0c4faa" />
      <text x={165} y={59} textAnchor="middle" fill="white" fontSize={13} fontWeight={700}>O-RU</text>
      <circle cx={280} cy={55} r={20} fill="#10b981" />
      <text x={280} y={60} textAnchor="middle" fill="white" fontSize={13} fontWeight={700}>UE</text>
      {/* DU↔RU arrows */}
      {isDl ? (
        <g>
          <line x1={76} y1={48} x2={128} y2={48} stroke="#1e7ef0" strokeWidth={3} markerEnd="url(#arrR)" />
          <line x1={200} y1={62} x2={258} y2={62} stroke="#1e7ef0" strokeWidth={3} markerEnd="url(#arrR)" />
        </g>
      ) : (
        <g>
          <line x1={128} y1={48} x2={78} y2={48} stroke="#10b981" strokeWidth={3} markerEnd="url(#arrL)" />
          <line x1={258} y1={62} x2={202} y2={62} stroke="#10b981" strokeWidth={3} markerEnd="url(#arrL)" />
        </g>
      )}
      <text x={102} y={28} textAnchor="middle" fontSize={12} fill={isDl ? "#1e7ef0" : "#10b981"} fontWeight={700}>
        {isDl ? "DL · 송신" : "UL · 수신"}
      </text>
      <defs>
        <marker id="arrR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e7ef0" />
        </marker>
        <marker id="arrL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
        </marker>
      </defs>
    </svg>
  );
}

// 2) frame/subframe/slot — nested timeline visualization
function VizTimeloc({ frameId, subframeId, slotId, mu }: { frameId: number; subframeId: number; slotId: number; mu: number }) {
  const slotsPerSubframe = Math.pow(2, mu);
  return (
    <div className="text-xs space-y-2 w-full max-w-md">
      {/* Frame row */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-ink-500">Frame (10 ms × 256)</span>
          <span className="font-mono">Frame {frameId}</span>
        </div>
        <div className="h-3 bg-ink-100 dark:bg-ink-800 rounded relative overflow-hidden">
          <div className="h-full bg-brand-500" style={{ width: "100%", transform: `translateX(${((frameId / 256) * 100) - 50}%)`, opacity: 0.3 }} />
          <div className="absolute top-0 h-full w-1 bg-brand-600" style={{ left: `${(frameId / 256) * 100}%` }} />
        </div>
      </div>
      {/* Subframe row */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-ink-500">Subframe (한 frame 안 10 × 1 ms)</span>
          <span className="font-mono">Subframe {subframeId}</span>
        </div>
        <div className="grid grid-cols-10 gap-0.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`h-4 rounded text-[9px] flex items-center justify-center font-mono ${i === subframeId ? "bg-brand-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-400"}`}>{i}</div>
          ))}
        </div>
      </div>
      {/* Slot row */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-ink-500">Slot (한 subframe 안 {slotsPerSubframe}개)</span>
          <span className="font-mono">Slot {slotId} · {slotMs(mu)} ms</span>
        </div>
        <div className={`grid gap-0.5`} style={{ gridTemplateColumns: `repeat(${slotsPerSubframe}, minmax(0, 1fr))` }}>
          {Array.from({ length: slotsPerSubframe }).map((_, i) => (
            <div key={i} className={`h-4 rounded text-[9px] flex items-center justify-center font-mono ${i === slotId ? "bg-brand-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-400"}`}>{i}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 3) startSymbolId / numSymbol — 14-cell strip
function VizSymStrip({ start, length, mu }: { start: number; length: number; mu: number }) {
  const symUs = symbolUs(mu);
  return (
    <div className="w-full max-w-md">
      <div className="grid grid-cols-14 gap-0.5">
        {Array.from({ length: 14 }).map((_, i) => {
          const on = i >= start && i < start + length;
          return (
            <div key={i} className={`h-9 rounded flex items-center justify-center text-[10px] font-mono ${on ? "bg-brand-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-400"}`}>{i}</div>
          );
        })}
      </div>
      <div className="text-[11px] text-ink-500 mt-2 flex justify-between font-mono">
        <span>심볼 0 (슬롯 시작)</span>
        <span>심볼 13 (슬롯 끝)</span>
      </div>
      <div className="text-[11px] text-ink-700 dark:text-ink-200 mt-1">
        점유: <b>심볼 {start} ~ {start + length - 1}</b> · <b>{(length * symUs).toFixed(1)} µs</b> ({((length / 14) * 100).toFixed(0)}% of slot)
      </div>
    </div>
  );
}

// 4) startPrbc / numPrbc / rb — 24-cell strip
function VizPrbStrip({ start, length, rb, mu, oruMaxPrb }: { start: number; length: number; rb: 0 | 1; mu: number; oruMaxPrb: number }) {
  const cellMaxPrb = 24; // visual cap
  const used = new Set<number>();
  for (let i = 0; i < length; i++) {
    const prb = start + (rb === 0 ? i : i * 2);
    if (prb >= 0 && prb < cellMaxPrb) used.add(prb);
  }
  const prbKHz = SCS_KHZ[mu] * 12;
  const bwMHz = (used.size * prbKHz) / 1000;
  return (
    <div className="w-full max-w-md">
      <div className="grid grid-cols-24 gap-0.5">
        {Array.from({ length: cellMaxPrb }).map((_, i) => (
          <div key={i} className={`h-9 rounded flex items-center justify-center text-[8px] font-mono ${used.has(i) ? "bg-emerald-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-400"}`}>{i}</div>
        ))}
      </div>
      <div className="text-[11px] text-ink-500 mt-2 flex justify-between">
        <span>낮은 주파수</span>
        <span>높은 주파수</span>
      </div>
      <div className="text-[11px] text-ink-700 dark:text-ink-200 mt-1">
        점유 PRB <b>{used.size}개</b> · <b>{bwMHz.toFixed(2)} MHz</b> {rb === 1 ? "(인터리브)" : "(연속)"}
      </div>
    </div>
  );
}

// 5) reMask — 12 SC clickable boxes
function VizReMask({ mask }: { mask: number }) {
  const used = popcount12(mask);
  return (
    <div className="w-full max-w-md">
      <div className="text-[11px] text-ink-500 mb-1">PRB 한 개의 12 서브캐리어</div>
      <div className="grid grid-cols-12 gap-0.5">
        {Array.from({ length: 12 }).map((_, i) => {
          const idx = 11 - i;
          const on = ((mask >> idx) & 1) === 1;
          return (
            <div key={i} className={`h-10 rounded flex items-center justify-center text-[10px] font-mono ${on ? "bg-brand-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-400"}`}>{idx}</div>
          );
        })}
      </div>
      <div className="text-[11px] text-ink-700 dark:text-ink-200 mt-1">
        활성 <b>{used}/12 SC</b> · 0x{mask.toString(16).padStart(3, "0")}
      </div>
    </div>
  );
}

// 6) symInc — visualize whether same PRB extends across symbols
function VizSymInc({ symInc, startSym, numSym, startPrb, numPrb }: { symInc: 0 | 1; startSym: number; numSym: number; startPrb: number; numPrb: number }) {
  const cellW = 18;
  const cellH = 8;
  return (
    <div className="w-full max-w-md">
      <svg viewBox={`0 0 ${14 * cellW + 30} ${8 * cellH + 30}`} className="w-full h-auto">
        <text x={4} y={12} fontSize={9} fill="currentColor" className="text-ink-500">PRB ↓</text>
        {Array.from({ length: 14 }).map((_, x) =>
          Array.from({ length: 8 }).map((_, y) => {
            const inSym = x >= startSym && x < startSym + numSym;
            // For symInc=0: PRB stays put. For symInc=1: PRB shifts across symbols (visual demo)
            const prb = symInc === 1 ? y - (x - startSym) : y;
            const inPrb = prb >= startPrb && prb < startPrb + numPrb;
            return (
              <rect
                key={`${x}-${y}`}
                x={25 + x * cellW}
                y={20 + y * cellH}
                width={cellW - 1}
                height={cellH - 1}
                fill={inSym && inPrb ? "#1e7ef0" : "#e5e7eb"}
                fillOpacity={inSym && inPrb ? 0.85 : 0.4}
                stroke="#0f172a"
                strokeOpacity={0.05}
              />
            );
          })
        )}
        <text x={25 + 7 * cellW} y={20 + 8 * cellH + 14} fontSize={9} textAnchor="middle" fill="currentColor" className="text-ink-500">시간(심볼) →</text>
      </svg>
      <div className="text-[11px] text-ink-700 dark:text-ink-200">
        {symInc === 0 ? "symInc=0 — PRB가 모든 심볼에서 같은 위치" : "symInc=1 — PRB가 심볼마다 이동 (드문 케이스)"}
      </div>
    </div>
  );
}

// 7) beamId / beamAngle — compass dial
function VizBeam({ angleDeg, antennas, withNull, nullDeg }: { angleDeg: number; antennas: number; withNull?: boolean; nullDeg?: number }) {
  const W = 280;
  const H = 130;
  const cx = W / 2;
  const cy = H - 16;
  const r = H - 32;
  const a = (angleDeg * Math.PI) / 180;
  const tip = { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
  const beamWidth = Math.max(6, 30 / Math.sqrt(antennas));
  const aL = ((angleDeg - beamWidth) * Math.PI) / 180;
  const aR = ((angleDeg + beamWidth) * Math.PI) / 180;
  const lx = cx + r * Math.sin(aL);
  const ly = cy - r * Math.cos(aL);
  const rx = cx + r * Math.sin(aR);
  const ry = cy - r * Math.cos(aR);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md h-auto">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} stroke="#94a3b8" strokeOpacity={0.4} fill="none" strokeDasharray="2 3" />
      {[-60, -30, 0, 30, 60].map((d) => {
        const ar = (d * Math.PI) / 180;
        const x = cx + r * Math.sin(ar);
        const y = cy - r * Math.cos(ar);
        return (
          <g key={d}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#94a3b8" strokeOpacity={0.2} />
            <text x={x} y={y - 3} fontSize={10} textAnchor="middle" fill="currentColor" className="text-ink-500">{d}°</text>
          </g>
        );
      })}
      <polygon points={`${cx},${cy} ${lx},${ly} ${rx},${ry}`} fill="#1e7ef0" fillOpacity={0.4} stroke="#1e7ef0" strokeWidth={1.5} />
      <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#1e7ef0" strokeWidth={2.5} />
      {withNull && nullDeg !== undefined ? (
        (() => {
          const na = (nullDeg * Math.PI) / 180;
          const nx = cx + r * Math.sin(na);
          const ny = cy - r * Math.cos(na);
          return (
            <g>
              <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 3" />
              <text x={nx} y={ny - 4} fontSize={10} textAnchor="middle" fill="#ef4444" fontWeight={700}>NULL</text>
            </g>
          );
        })()
      ) : null}
      {/* antenna bar */}
      {Array.from({ length: antennas }).map((_, i) => {
        const spread = Math.min(60, antennas * 5);
        const ax = cx - spread / 2 + (antennas > 1 ? (i * spread) / (antennas - 1) : 0);
        return <rect key={i} x={ax - 1.5} y={cy - 4} width={3} height={8} fill="#0c4faa" />;
      })}
      <text x={cx} y={cy + 18} fontSize={10} textAnchor="middle" fill="currentColor" className="text-ink-500">
        안테나 {antennas}개 · 빔 {angleDeg > 0 ? "+" : ""}{angleDeg}°
      </text>
    </svg>
  );
}

// 8) sectionId — visual showing match between C-plane and U-plane
function VizSectionId({ id }: { id: number }) {
  return (
    <svg viewBox="0 0 280 70" className="w-full max-w-md h-auto">
      <rect x={6} y={10} width={70} height={20} rx={3} fill="#1e7ef0" />
      <text x={41} y={25} textAnchor="middle" fill="white" fontSize={11} fontWeight={700}>C-plane</text>
      <rect x={6} y={40} width={70} height={20} rx={3} fill="#10b981" />
      <text x={41} y={55} textAnchor="middle" fill="white" fontSize={11} fontWeight={700}>U-plane</text>
      <text x={120} y={22} fontSize={10} fill="currentColor" className="text-ink-500">sectionId =</text>
      <rect x={170} y={10} width={80} height={50} rx={3} fill="#fef3c7" stroke="#f59e0b" strokeWidth={2} />
      <text x={210} y={42} textAnchor="middle" fill="#92400e" fontSize={20} fontWeight={700}>{id}</text>
      <line x1={76} y1={20} x2={168} y2={25} stroke="#94a3b8" strokeDasharray="2 2" />
      <line x1={76} y1={50} x2={168} y2={45} stroke="#94a3b8" strokeDasharray="2 2" />
    </svg>
  );
}

// 9) udCompHdr — IQ compression visualization (bit width)
function VizUdComp({ udCompHdr }: { udCompHdr: number }) {
  // Map known values
  const widthMap: Record<number, { name: string; iqBits: number; method: string }> = {
    0x00: { name: "압축 없음", iqBits: 32, method: "raw" },
    0x91: { name: "9-bit BFP", iqBits: 19, method: "BFP" },
    0xA1: { name: "12-bit BFP", iqBits: 25, method: "BFP" },
  };
  const cur = widthMap[udCompHdr] ?? { name: `0x${udCompHdr.toString(16)}`, iqBits: 19, method: "?" };
  const pct = Math.min(100, (cur.iqBits / 32) * 100);
  return (
    <div className="w-full max-w-md">
      <div className="text-[11px] text-ink-500 mb-1">IQ 샘플 1개에 들어가는 비트 수</div>
      <div className="h-7 rounded bg-ink-100 dark:bg-ink-800 relative overflow-hidden">
        <div className="h-full bg-brand-500 flex items-center justify-center text-white text-xs font-mono" style={{ width: `${pct}%` }}>
          {cur.iqBits}b
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-ink-500 mt-0.5">
        <span>0</span><span>16</span><span>32 (비압축)</span>
      </div>
      <div className="text-[11px] text-ink-700 dark:text-ink-200 mt-1">
        <b>{cur.name}</b> — IQ 1샘플 = <b>{cur.iqBits} 비트</b>
        {cur.iqBits < 32 ? <span className="text-emerald-600 ml-2">−{Math.round((1 - cur.iqBits / 32) * 100)}% 압축</span> : null}
      </div>
    </div>
  );
}

// 10) ueId — UE chip
function VizUeId({ ueId }: { ueId: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-[9px] opacity-80">UE</div>
          <div className="text-sm font-bold font-mono">{ueId}</div>
        </div>
      </div>
      <div className="text-xs text-ink-600 dark:text-ink-300">
        <div>이 자원은 <b>UE-{ueId}</b> 전용</div>
        <div className="text-ink-500 mt-1">MU-MIMO에서 같은 자원의 다른 UE와 구분</div>
      </div>
    </div>
  );
}

// 11) filterIndex — PRACH format labels
function VizFilterIndex({ idx, sectionType }: { idx: number; sectionType: ST }) {
  const prachFormats: Record<number, string> = {
    0: "기본 (PRACH 아님)",
    1: "PRACH Format 0",
    2: "PRACH Format 1",
    3: "PRACH Format 2",
    4: "PRACH Format 3",
    5: "PRACH Format A1 (짧음)",
  };
  const label = sectionType === 3 ? prachFormats[idx] ?? `Format ${idx}` : "ST 1·5·6에선 0 (특수 처리 없음)";
  return (
    <div className="text-xs">
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-ink-100 dark:bg-ink-800">
        <span className="font-mono font-bold">{idx}</span>
        <span>·</span>
        <span>{label}</span>
      </div>
    </div>
  );
}

// SE-1 — beam compass with antenna spread + weights count
function VizSe1Beam({ angleDeg, antennas }: { angleDeg: number; antennas: number }) {
  return (
    <div>
      <VizBeam angleDeg={angleDeg} antennas={antennas} />
      <div className="text-[11px] text-ink-700 dark:text-ink-200 mt-1">
        가중치 <b>{antennas}개</b> (안테나마다 1개) × 24비트 = <b>{antennas * 24}비트 = {antennas * 3} 바이트</b>
      </div>
    </div>
  );
}

// SE-6 — RBG bitmap → resulting PRB pattern
function VizSe6({ mask, rbgSize, oruMaxPrb }: { mask: number; rbgSize: number; oruMaxPrb: number }) {
  // Compute the PRB set from mask + rbgSize, then visualize on a 24-cell strip
  const used = new Set<number>();
  for (let i = 0; i < 28; i++) {
    if ((mask >> i) & 1) {
      const base = (27 - i) * rbgSize;
      for (let k = 0; k < rbgSize; k++) if (base + k < 24) used.add(base + k);
    }
  }
  return (
    <div className="w-full max-w-md space-y-2">
      <div>
        <div className="text-[11px] text-ink-500 mb-1">rbgMask 28비트 (활성된 RBG)</div>
        <div className="grid grid-cols-14 gap-0.5">
          {Array.from({ length: 28 }).map((_, i) => {
            const idx = 27 - i;
            const on = ((mask >> idx) & 1) === 1;
            return <div key={i} className={`h-5 rounded text-[8px] flex items-center justify-center font-mono ${on ? "bg-amber-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-400"}`}>{idx}</div>;
          })}
        </div>
      </div>
      <div>
        <div className="text-[11px] text-ink-500 mb-1">→ 결과 PRB 점유 (rbgSize={rbgSize})</div>
        <div className="grid grid-cols-24 gap-0.5">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className={`h-5 rounded text-[7px] flex items-center justify-center font-mono ${used.has(i) ? "bg-emerald-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-400"}`}>{i}</div>
          ))}
        </div>
        <div className="text-[11px] text-ink-700 dark:text-ink-200 mt-1">점유 PRB <b>{used.size}개</b> (비연속)</div>
      </div>
    </div>
  );
}

// SE-22 — ACK/NACK flow
function VizSe22({ reqId }: { reqId: number }) {
  return (
    <svg viewBox="0 0 280 90" className="w-full max-w-md h-auto">
      <rect x={10} y={30} width={60} height={30} rx={4} fill="#0c4faa" />
      <text x={40} y={49} textAnchor="middle" fill="white" fontSize={12} fontWeight={700}>O-DU</text>
      <rect x={210} y={30} width={60} height={30} rx={4} fill="#0c4faa" />
      <text x={240} y={49} textAnchor="middle" fill="white" fontSize={12} fontWeight={700}>O-RU</text>
      <line x1={70} y1={38} x2={208} y2={38} stroke="#1e7ef0" strokeWidth={2} markerEnd="url(#a22r)" />
      <text x={140} y={32} textAnchor="middle" fontSize={10} fill="#1e7ef0" fontWeight={700}>명령 + SE 22 (id={reqId})</text>
      <line x1={208} y1={56} x2={70} y2={56} stroke="#10b981" strokeWidth={2} markerEnd="url(#a22l)" />
      <text x={140} y={78} textAnchor="middle" fontSize={10} fill="#10b981" fontWeight={700}>ST 8 ACK (id={reqId})</text>
      <defs>
        <marker id="a22r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1e7ef0" /></marker>
        <marker id="a22l" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" /></marker>
      </defs>
    </svg>
  );
}

// ====================================================================
// FieldRow — left: input + label, right: visualization
// ====================================================================

function FieldRow({
  name,
  bits,
  hint,
  detail,
  controls,
  viz,
}: {
  name: string;
  bits?: string;
  hint?: string;
  detail?: React.ReactNode;
  controls: React.ReactNode;
  viz: React.ReactNode;
}) {
  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4 py-4 border-t border-ink-200 dark:border-ink-700">
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-bold">{name}</span>
          {bits ? <span className="text-[10px] text-ink-500">{bits}</span> : null}
        </div>
        {controls}
        {hint ? <div className="text-xs text-ink-500 leading-relaxed">{hint}</div> : null}
        {detail ? (
          <details className="text-xs">
            <summary className="cursor-pointer text-brand-600 hover:underline">▸ 더 자세히</summary>
            <div className="mt-1 text-ink-600 dark:text-ink-300 space-y-1 leading-relaxed">{detail}</div>
          </details>
        ) : null}
      </div>
      <div className="flex items-start justify-start lg:justify-center">
        {viz}
      </div>
    </div>
  );
}

// ====================================================================
// Section headers
// ====================================================================

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mt-8 mb-2 pb-2 border-b-2 border-brand-200 dark:border-brand-900/40">
      <h3 className="text-lg font-bold">{title}</h3>
      {hint ? <p className="text-xs text-ink-500 mt-0.5">{hint}</p> : null}
    </div>
  );
}

// ====================================================================
// ST picker
// ====================================================================

function StPicker({ value, onChange }: { value: ST; onChange: (v: ST) => void }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">1️⃣ 어떤 메시지를 만들까요? (Section Type 선택)</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {ST_OPTIONS.map((o) => {
          const sel = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              className={`text-left rounded-xl p-3 border-2 transition ${sel ? "shadow-md" : "hover:border-brand-300"}`}
              style={{ borderColor: sel ? o.color : undefined, background: sel ? o.color + "12" : undefined }}
            >
              <div className="text-2xl">{o.emoji}</div>
              <div className="font-semibold text-sm">{o.name}</div>
              <div className="text-xs font-mono" style={{ color: o.color }}>{o.tagline}</div>
              <div className="text-[11px] text-ink-500 mt-1 leading-snug">{o.hint}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ====================================================================
// SE Card
// ====================================================================

interface SeCardProps {
  s: State;
  upd: <K extends keyof State>(k: K, v: State[K]) => void;
  updExt: (k: Ext, v: boolean) => void;
}

function SeCard({ se, s, upd, updExt }: SeCardProps & { se: Ext }) {
  const META: Record<Ext, { num: number; emoji: string; name: string; desc: string; color: string }> = {
    se1: { num: 1, emoji: "🎯", name: "정밀 빔 가중치", desc: "안테나별 가중치를 직접 보내 정확한 빔", color: "#0ea5e9" },
    se6: { num: 6, emoji: "🧩", name: "비연속 PRB 비트맵", desc: "띄엄띄엄 PRB 점유 (LTE 회피 등)", color: "#f59e0b" },
    se14: { num: 14, emoji: "🚧", name: "Null (간섭 회피)", desc: "옆 UE 방향에 null로 차단", color: "#ef4444" },
    se22: { num: 22, emoji: "✉️", name: "ACK 요청", desc: "RU가 ST 8로 응답", color: "#6366f1" },
  };
  const m = META[se];
  const on = s.exts[se];
  return (
    <div className={`rounded-xl border-2 p-4 transition ${on ? "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10" : "border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{m.emoji}</div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm">SE {m.num}</span>
              <span className="text-sm">· {m.name}</span>
            </div>
            <div className="text-xs text-ink-600 dark:text-ink-300">{m.desc}</div>
          </div>
        </div>
        <button onClick={() => updExt(se, !on)} className={`px-4 py-2 rounded-lg text-sm font-medium ${on ? "bg-emerald-500 text-white" : "bg-ink-100 dark:bg-ink-800"}`}>
          {on ? "✓ 부착됨" : "부착"}
        </button>
      </div>

      {on ? (
        <div className="mt-4 space-y-2">
          {se === "se1" ? (
            <FieldRow
              name="numBfw"
              bits="8"
              hint="포함될 가중치 수 = O-RU 안테나 수. 안테나가 많을수록 빔이 좁고 정확."
              detail={<p>이 시뮬에서 'O-RU 환경'의 안테나 수가 자동으로 numBfw에 들어가요. 메시지 크기는 numBfw × 24 비트(가중치당 I/Q)만큼 추가됩니다.</p>}
              controls={
                <div className="flex items-center gap-2 text-sm">
                  <input type="range" min={2} max={64} step={2} value={s.oruAntennas} onChange={(e) => upd("oruAntennas", +e.target.value)} className="flex-1" />
                  <span className="font-mono w-10 text-right">{s.oruAntennas}</span>
                </div>
              }
              viz={<VizSe1Beam angleDeg={s.beamAngleDeg} antennas={s.oruAntennas} />}
            />
          ) : null}

          {se === "se6" ? (
            <>
              <FieldRow
                name="rbgMask"
                bits="28"
                hint="28비트 비트맵. 각 비트 = 한 RBG. 켜진 비트의 PRB만 점유."
                detail={<p>SE 6은 기본 Section의 연속 PRB 패턴을 대체해 비트맵으로 띄엄띄엄 점유합니다. 옆 칸의 결과 PRB 점유로 즉시 반영.</p>}
                controls={
                  <div className="space-y-2">
                    <div className="grid grid-cols-14 gap-0.5">
                      {Array.from({ length: 28 }).map((_, j) => {
                        const idx = 27 - j;
                        const on = ((s.se6Mask >> idx) & 1) === 1;
                        return (
                          <button key={j} onClick={() => upd("se6Mask", s.se6Mask ^ (1 << idx))} className={`h-7 text-[9px] font-mono rounded ${on ? "bg-amber-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-500"}`}>{idx}</button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1 text-xs">
                      <button onClick={() => upd("se6Mask", 0xFFFFFFF)} className="px-2 py-1 rounded bg-ink-100 dark:bg-ink-800">전체</button>
                      <button onClick={() => upd("se6Mask", 0x0AAAAAA)} className="px-2 py-1 rounded bg-ink-100 dark:bg-ink-800">짝수</button>
                      <button onClick={() => upd("se6Mask", 0x0555555)} className="px-2 py-1 rounded bg-ink-100 dark:bg-ink-800">홀수</button>
                    </div>
                  </div>
                }
                viz={<VizSe6 mask={s.se6Mask} rbgSize={s.se6RbgSize} oruMaxPrb={24} />}
              />
              <FieldRow
                name="rbgSize"
                bits="4"
                hint="한 비트가 표현하는 PRB 묶음 크기. 1/2/4/8 중 선택."
                controls={
                  <select value={s.se6RbgSize} onChange={(e) => upd("se6RbgSize", +e.target.value)} className="px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm">
                    <option value={1}>1 PRB</option>
                    <option value={2}>2 PRB</option>
                    <option value={4}>4 PRB</option>
                    <option value={8}>8 PRB</option>
                  </select>
                }
                viz={<div className="text-xs text-ink-600 dark:text-ink-300">현재 비트 1개 = <b>{s.se6RbgSize} PRB</b>. 위 결과 PRB 점유에 즉시 반영.</div>}
              />
            </>
          ) : null}

          {se === "se14" ? (
            <FieldRow
              name="null 방향 (°)"
              bits="가변"
              hint="이 방향에 있는 UE에게는 신호가 거의 가지 않게 빔 가중치를 조정. MU-MIMO 페어 UE 간섭 회피용."
              detail={<p>실제 스펙엔 nullLayerInd와 antPortBitmap 같은 비트로 표현되지만, 여기서는 직관 위해 '각도'로 단순화했습니다.</p>}
              controls={
                <div className="flex items-center gap-2 text-sm">
                  <input type="range" min={-75} max={75} value={s.se14NullDeg} onChange={(e) => upd("se14NullDeg", +e.target.value)} className="flex-1" />
                  <span className="font-mono w-12 text-right">{s.se14NullDeg}°</span>
                </div>
              }
              viz={<VizBeam angleDeg={s.beamAngleDeg} antennas={s.exts.se1 ? s.oruAntennas : 1} withNull nullDeg={s.se14NullDeg} />}
            />
          ) : null}

          {se === "se22" ? (
            <FieldRow
              name="ackNackReqId"
              bits="16"
              hint="ACK 요청 식별자. RU가 같은 ID로 ST 8 응답을 회신."
              detail={<p>워치독: 일정 시간 내 응답 없으면 NACK으로 간주하고 재시도. 일반 ST 1엔 보통 안 붙이고 ST 4 같은 중요 명령에 사용.</p>}
              controls={
                <input type="number" min={0} max={65535} value={s.se22ReqId} onChange={(e) => upd("se22ReqId", +e.target.value)} className="w-32 px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm font-mono" />
              }
              viz={<VizSe22 reqId={s.se22ReqId} />}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ====================================================================
// Top summary banner
// ====================================================================

function TopSummary({ s }: { s: State }) {
  const st = ST_OPTIONS.find((o) => o.id === s.sectionType)!;
  const symUs = symbolUs(s.numerology);
  const prbKHz = SCS_KHZ[s.numerology] * 12;
  const usedSc = popcount12(s.reMask);
  const prbsLen = (() => {
    if (s.exts.se6) {
      const u = new Set<number>();
      for (let i = 0; i < 28; i++) if ((s.se6Mask >> i) & 1) {
        const base = (27 - i) * s.se6RbgSize;
        for (let k = 0; k < s.se6RbgSize; k++) if (base + k < 24) u.add(base + k);
      }
      return u.size;
    }
    const u = new Set<number>();
    for (let i = 0; i < s.numPrbc; i++) {
      const p = s.startPrbc + (s.rb === 0 ? i : i * 2);
      if (p >= 0 && p < 24) u.add(p);
    }
    return u.size;
  })();
  const activeExts = (Object.keys(s.exts) as Ext[]).filter((k) => s.exts[k]);
  return (
    <div className="rounded-2xl border-2 p-4 sticky top-16 z-10 backdrop-blur" style={{ borderColor: st.color, background: st.color + "0d" }}>
      <div className="flex flex-wrap items-baseline gap-3 mb-2">
        <span className="text-2xl">{st.emoji}</span>
        <span className="text-lg font-bold">{st.name} · {st.tagline}</span>
        <span className="px-2 py-0.5 rounded text-xs font-mono" style={{ background: st.color + "22", color: st.color }}>
          {s.dataDirection === 1 ? "⬇️ DL" : "⬆️ UL"}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <Stat label="시간" value={`${(s.numSymbol * symUs).toFixed(1)} µs`} sub={`심볼 ${s.startSymbolId}~${s.startSymbolId + s.numSymbol - 1}`} />
        <Stat label="주파수" value={`${((prbsLen * prbKHz) / 1000).toFixed(2)} MHz`} sub={`${prbsLen} PRB · ${usedSc}/12 SC`} />
        <Stat label="빔" value={`${s.beamAngleDeg > 0 ? "+" : ""}${s.beamAngleDeg}°`} sub={`beamId ${s.beamId}`} />
        <Stat label="UE" value={s.sectionType === 5 ? `${s.ueId}` : "—"} sub={s.sectionType === 5 ? "ueId 명시" : "ST 1·3·6은 안 적음"} />
        <Stat label="Ext" value={activeExts.length === 0 ? "없음" : activeExts.map((e) => "SE " + e.slice(2)).join(", ")} sub={`ef = ${activeExts.length === 0 ? 0 : 1}`} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded bg-white/60 dark:bg-ink-900/60 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className="text-sm font-bold font-mono leading-tight">{value}</div>
      {sub ? <div className="text-[10px] text-ink-500 truncate">{sub}</div> : null}
    </div>
  );
}

// ====================================================================
// Main
// ====================================================================

export default function Simulator() {
  const [s, setS] = useState<State>(DEFAULT);
  const upd = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const updExt = (k: Ext, v: boolean) => setS((p) => ({ ...p, exts: { ...p.exts, [k]: v } }));

  const hasSection = s.sectionType !== 0; // ST 0 has just empty Sections
  const hasUePart = s.sectionType === 5;

  return (
    <div className="space-y-6">
      {/* Top sticky summary */}
      <TopSummary s={s} />

      {/* ST picker */}
      <StPicker value={s.sectionType} onChange={(v) => upd("sectionType", v)} />

      {/* O-RU env (small) */}
      <details className="rounded-lg border border-ink-200 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-800/30 px-3 py-2">
        <summary className="cursor-pointer text-xs font-mono text-ink-500 select-none">⚙️ O-RU 환경 (메시지 필드 아님 — 우리가 통신할 RU 속성)</summary>
        <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
          <label className="block">
            <div className="text-xs text-ink-500 mb-1">안테나 수</div>
            <div className="flex items-center gap-2">
              <input type="range" min={2} max={64} step={2} value={s.oruAntennas} onChange={(e) => upd("oruAntennas", +e.target.value)} className="flex-1" />
              <span className="font-mono w-10 text-right">{s.oruAntennas}</span>
            </div>
          </label>
          <label className="block">
            <div className="text-xs text-ink-500 mb-1">누메롤로지 μ</div>
            <select value={s.numerology} onChange={(e) => upd("numerology", +e.target.value as 0 | 1 | 2 | 3)} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800">
              <option value={0}>μ=0 · 15 kHz · 슬롯 1 ms</option>
              <option value={1}>μ=1 · 30 kHz · 슬롯 0.5 ms</option>
              <option value={2}>μ=2 · 60 kHz · 슬롯 0.25 ms</option>
              <option value={3}>μ=3 · 120 kHz · 슬롯 0.125 ms</option>
            </select>
          </label>
        </div>
      </details>

      {/* ===== Common Header Fields ===== */}
      <div>
        <SectionHeader title="2️⃣ 공통 헤더 필드" hint="모든 Section Type이 공유하는 필드들. 각 필드 옆 그림이 그 필드의 효과를 보여줍니다." />

        <FieldRow
          name="dataDirection"
          bits="1"
          hint="O-DU 입장에서 송신 방향. 1=DL (UE에게 보냄), 0=UL (UE로부터 받음)."
          detail={<p>RRM 측정 류(ST 10/11) 등은 dataDirection이 항상 0(UL)으로 고정.</p>}
          controls={
            <div className="flex gap-2">
              <button onClick={() => upd("dataDirection", 1)} className={`flex-1 px-3 py-2 rounded text-sm font-medium ${s.dataDirection === 1 ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-ink-800"}`}>⬇️ DL (1)</button>
              <button onClick={() => upd("dataDirection", 0)} className={`flex-1 px-3 py-2 rounded text-sm font-medium ${s.dataDirection === 0 ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-ink-800"}`}>⬆️ UL (0)</button>
            </div>
          }
          viz={<VizDirection dir={s.dataDirection} />}
        />

        <FieldRow
          name="frameId · subframeId · slotId"
          bits="8 · 4 · 6"
          hint="이 메시지가 가리키는 시점의 좌표. 프레임 10ms → 서브프레임 1ms → 슬롯(누메롤로지 의존)."
          detail={
            <>
              <p>frameId 0~255 (8비트, 순환). subframeId 0~9 (4비트). slotId는 한 서브프레임 안 슬롯 인덱스 (μ=1이면 0~1, μ=3이면 0~7).</p>
              <p>잘못 두면 RU/DU 동기가 어긋나 메시지가 미래/과거 슬롯으로 매핑됨 → 폐기.</p>
            </>
          }
          controls={
            <div className="grid grid-cols-3 gap-2 text-sm">
              <label className="block">
                <div className="text-[10px] text-ink-500">frameId</div>
                <input type="number" min={0} max={255} value={s.frameId} onChange={(e) => upd("frameId", +e.target.value)} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 font-mono" />
              </label>
              <label className="block">
                <div className="text-[10px] text-ink-500">subframeId</div>
                <input type="number" min={0} max={9} value={s.subframeId} onChange={(e) => upd("subframeId", +e.target.value)} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 font-mono" />
              </label>
              <label className="block">
                <div className="text-[10px] text-ink-500">slotId</div>
                <input type="number" min={0} max={Math.pow(2, s.numerology) - 1} value={s.slotId} onChange={(e) => upd("slotId", +e.target.value)} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 font-mono" />
              </label>
            </div>
          }
          viz={<VizTimeloc frameId={s.frameId} subframeId={s.subframeId} slotId={s.slotId} mu={s.numerology} />}
        />

        <FieldRow
          name="startSymbolId · numSymbol"
          bits="6 · 4"
          hint="이 메시지가 점유하는 시간 구간. 한 슬롯은 14 OFDM 심볼."
          detail={
            <>
              <p>심볼 1개 길이 = 슬롯 길이 / 14. 30 kHz SCS면 1 심볼 ≈ 35.7 µs.</p>
              <p>심볼 0~1은 보통 PDCCH(컨트롤)에 양보, 데이터(PDSCH)는 보통 심볼 2~13.</p>
            </>
          }
          controls={
            <div className="grid grid-cols-2 gap-2 text-sm">
              <label className="block">
                <div className="text-[10px] text-ink-500">startSymbolId</div>
                <input type="number" min={0} max={13} value={s.startSymbolId} onChange={(e) => upd("startSymbolId", Math.max(0, Math.min(13, +e.target.value)))} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 font-mono" />
              </label>
              <label className="block">
                <div className="text-[10px] text-ink-500">numSymbol</div>
                <input type="number" min={1} max={14 - s.startSymbolId} value={s.numSymbol} onChange={(e) => upd("numSymbol", Math.max(1, Math.min(14 - s.startSymbolId, +e.target.value)))} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 font-mono" />
              </label>
            </div>
          }
          viz={<VizSymStrip start={s.startSymbolId} length={s.numSymbol} mu={s.numerology} />}
        />

        <FieldRow
          name="udCompHdr"
          bits="8"
          hint="U-plane IQ 압축 방식. 같은 자원에 들어갈 IQ 샘플 크기를 결정."
          detail={
            <>
              <p>0x91 (9-bit BFP): 셀 운용에서 가장 흔함. 4 PRB 단위 공통 지수 + 9비트 가수.</p>
              <p>0xA1 (12-bit BFP): 정밀도 높지만 큼. 0x00 (비압축): 16-bit IQ 그대로.</p>
              <p>이 값은 보통 셀 단위로 고정. 매번 바꾸면 RU가 압축 메모리를 새로 세팅.</p>
            </>
          }
          controls={
            <select value={s.udCompHdr} onChange={(e) => upd("udCompHdr", +e.target.value)} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm font-mono">
              <option value={0x00}>0x00 (압축 없음)</option>
              <option value={0x91}>0x91 (9-bit BFP, 기본)</option>
              <option value={0xA1}>0xA1 (12-bit BFP)</option>
            </select>
          }
          viz={<VizUdComp udCompHdr={s.udCompHdr} />}
        />

        <FieldRow
          name="filterIndex"
          bits="4"
          hint="PRACH 포맷 등 특수 필터 인덱스. ST 1/5/6에선 0 고정."
          controls={
            <input type="number" min={0} max={15} value={s.filterIndex} onChange={(e) => upd("filterIndex", +e.target.value)} className="w-24 px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm font-mono" />
          }
          viz={<VizFilterIndex idx={s.filterIndex} sectionType={s.sectionType} />}
        />
      </div>

      {/* ===== Section Body Fields ===== */}
      {hasSection ? (
        <div>
          <SectionHeader title="3️⃣ Section 본체 필드" hint="이 Section이 점유하는 자원·UE·빔을 정의." />

          <FieldRow
            name="sectionId"
            bits="12"
            hint="이 Section의 고유 번호. U-plane이 동일 ID로 매칭."
            detail={<p>슬롯 안에서 1부터 증가. 두 Section이 같은 ID면 RU가 매핑 못 함.</p>}
            controls={
              <input type="number" min={0} max={4095} value={s.sectionId} onChange={(e) => upd("sectionId", +e.target.value)} className="w-32 px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm font-mono" />
            }
            viz={<VizSectionId id={s.sectionId} />}
          />

          <FieldRow
            name="startPrbc · numPrbc · rb"
            bits="10 · 8 · 1"
            hint="주파수 영역에서 어느 PRB부터 몇 개를 점유할지. rb=1이면 한 칸씩 건너뛰며 인터리브."
            detail={<p>PRB 1개 = 12 서브캐리어. 30 kHz SCS면 PRB 1개 = 360 kHz. 비연속 점유가 필요하면 SE 6을 부착.</p>}
            controls={
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="block">
                    <div className="text-[10px] text-ink-500">startPrbc</div>
                    <input type="number" min={0} max={23} value={s.startPrbc} onChange={(e) => upd("startPrbc", +e.target.value)} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 font-mono" />
                  </label>
                  <label className="block">
                    <div className="text-[10px] text-ink-500">numPrbc</div>
                    <input type="number" min={1} max={24 - s.startPrbc} value={s.numPrbc} onChange={(e) => upd("numPrbc", +e.target.value)} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 font-mono" />
                  </label>
                </div>
                <div className="flex gap-1 text-xs">
                  <button onClick={() => upd("rb", 0)} className={`flex-1 px-2 py-1 rounded ${s.rb === 0 ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-ink-800"}`}>rb=0 (연속)</button>
                  <button onClick={() => upd("rb", 1)} className={`flex-1 px-2 py-1 rounded ${s.rb === 1 ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-ink-800"}`}>rb=1 (인터리브)</button>
                </div>
              </div>
            }
            viz={<VizPrbStrip start={s.startPrbc} length={s.numPrbc} rb={s.rb} mu={s.numerology} oruMaxPrb={24} />}
          />

          <FieldRow
            name="reMask"
            bits="12"
            hint="한 PRB 안 12 서브캐리어 중 어느 것을 쓸지 비트마스크. CRS/PT-RS 회피용."
            detail={<p>대부분의 데이터 채널은 0xFFF (전체 ON). 일부 SC를 꺼야 할 때만 활용.</p>}
            controls={
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-0.5">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const idx = 11 - i;
                    const on = ((s.reMask >> idx) & 1) === 1;
                    return <button key={i} onClick={() => upd("reMask", s.reMask ^ (1 << idx))} className={`h-7 text-[9px] font-mono rounded ${on ? "bg-brand-500 text-white" : "bg-ink-100 dark:bg-ink-800 text-ink-500"}`}>{idx}</button>;
                  })}
                </div>
                <div className="flex gap-1 text-xs">
                  <button onClick={() => upd("reMask", 0xfff)} className="px-2 py-1 rounded bg-ink-100 dark:bg-ink-800">전체 ON</button>
                  <button onClick={() => upd("reMask", 0xaaa)} className="px-2 py-1 rounded bg-ink-100 dark:bg-ink-800">짝수</button>
                  <button onClick={() => upd("reMask", 0x555)} className="px-2 py-1 rounded bg-ink-100 dark:bg-ink-800">홀수</button>
                </div>
              </div>
            }
            viz={<VizReMask mask={s.reMask} />}
          />

          <FieldRow
            name="symInc"
            bits="1"
            hint="0=PRB가 모든 심볼에서 같은 위치 / 1=심볼마다 PRB가 이동 (드문 케이스)."
            controls={
              <div className="flex gap-1 text-sm">
                <button onClick={() => upd("symInc", 0)} className={`flex-1 px-3 py-2 rounded ${s.symInc === 0 ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-ink-800"}`}>0 (독립)</button>
                <button onClick={() => upd("symInc", 1)} className={`flex-1 px-3 py-2 rounded ${s.symInc === 1 ? "bg-brand-600 text-white" : "bg-ink-100 dark:bg-ink-800"}`}>1 (이어짐)</button>
              </div>
            }
            viz={<VizSymInc symInc={s.symInc} startSym={s.startSymbolId} numSym={s.numSymbol} startPrb={s.startPrbc} numPrb={s.numPrbc} />}
          />

          <FieldRow
            name="beamId · 빔 방향"
            bits="15"
            hint="사전 학습된 빔 인덱스 (0~32767). 각도 슬라이더가 beamId를 자동 계산."
            detail={<p>SE 1을 켜면 beamId 대신 가중치가 메시지에 실리고, 안테나 수에 따라 빔 폭이 좁아짐.</p>}
            controls={
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-[10px] text-ink-500">빔 각도 (°)</div>
                  <div className="flex items-center gap-2">
                    <input type="range" min={-75} max={75} value={s.beamAngleDeg} onChange={(e) => { const a = +e.target.value; upd("beamAngleDeg", a); upd("beamId", 12 + Math.round(a / 5)); }} className="flex-1" />
                    <span className="font-mono w-10 text-right">{s.beamAngleDeg}°</span>
                  </div>
                </div>
                <label className="block">
                  <div className="text-[10px] text-ink-500">beamId (직접)</div>
                  <input type="number" min={0} max={32767} value={s.beamId} onChange={(e) => upd("beamId", +e.target.value)} className="w-full px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 font-mono" />
                </label>
              </div>
            }
            viz={<VizBeam angleDeg={s.beamAngleDeg} antennas={s.exts.se1 ? s.oruAntennas : 1} withNull={s.exts.se14} nullDeg={s.se14NullDeg} />}
          />

          {hasUePart ? (
            <FieldRow
              name="ueId"
              bits="15"
              hint="이 자원의 주인 UE (ST 5에서만 등장). MU-MIMO에서 같은 자원의 다른 UE와 구분."
              detail={<p>RRC 레벨 C-RNTI를 그대로 쓰지 않고 O-DU↔O-RU가 합의한 짧은 ID로 추상화.</p>}
              controls={
                <input type="number" min={0} max={32767} value={s.ueId} onChange={(e) => upd("ueId", +e.target.value)} className="w-32 px-2 py-1 rounded border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-sm font-mono" />
              }
              viz={<VizUeId ueId={s.ueId} />}
            />
          ) : null}
        </div>
      ) : null}

      {/* ===== Section Extensions ===== */}
      <div>
        <SectionHeader title="4️⃣ Section Extension 부착 (선택)" hint="기본 메시지로 모자랄 때 추가 정보 부착. 토글하면 그 SE의 필드들이 펼쳐집니다." />
        <div className="space-y-3">
          {(["se1", "se6", "se14", "se22"] as Ext[]).map((se) => (
            <SeCard key={se} se={se} s={s} upd={upd} updExt={updExt} />
          ))}
        </div>
      </div>
    </div>
  );
}
