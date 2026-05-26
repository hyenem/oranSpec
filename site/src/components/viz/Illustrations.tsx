/**
 * Visual illustrations for Section Types and Section Extensions.
 *
 * Each diagram tries to convey the concept with shapes, not text inside boxes.
 * Text is used only as labels on top of/next to visual elements, and font
 * sizes are tuned for readability (≥12px for primary labels).
 *
 * Used by:
 *   - the Beginner Simulator SE tabs
 *   - the per-Section-Type detail page (한눈에 보기 section)
 *   - the per-Section-Extension detail page (한눈에 보기 section)
 */

import type { ReactNode } from "react";

// ====================================================================
// Shared primitives
// ====================================================================
const COL = {
  base: "#0c4faa",
  beam: "#1e7ef0",
  ok: "#10b981",
  warn: "#f59e0b",
  bad: "#ef4444",
  muted: "#94a3b8",
  light: "#e5e7eb",
  ltePurple: "#a855f7",
};

function ODU({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={56} height={28} rx={4} fill={COL.base} />
      <text x={x + 28} y={y + 19} fontSize={12} textAnchor="middle" fill="white" fontWeight={700}>O-DU</text>
    </g>
  );
}

function ORU({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={56} height={28} rx={4} fill={COL.base} />
      <text x={x + 28} y={y + 19} fontSize={12} textAnchor="middle" fill="white" fontWeight={700}>O-RU</text>
    </g>
  );
}

function UEIcon({ x, y, label, color, big }: { x: number; y: number; label?: string; color?: string; big?: boolean }) {
  const r = big ? 13 : 10;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color ?? COL.muted} stroke="white" strokeWidth={2} />
      <text x={x} y={y + 4} fontSize={big ? 13 : 11} textAnchor="middle" fill="white" fontWeight={700}>{label ?? "UE"}</text>
    </g>
  );
}

function Arrow({
  x1, y1, x2, y2, color = COL.beam, label, dashed, strokeWidth = 2,
}: {
  x1: number; y1: number; x2: number; y2: number; color?: string; label?: string; dashed?: boolean; strokeWidth?: number;
}) {
  const id = `arr-${color.replace("#", "")}-${Math.round(x1)}-${Math.round(y1)}`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} strokeDasharray={dashed ? "4 3" : undefined} markerEnd={`url(#${id})`} />
      {label ? (
        <text x={mx} y={my - 6} fontSize={12} textAnchor="middle" fill={color} fontWeight={600}>{label}</text>
      ) : null}
    </g>
  );
}

function AntennaRow({ cx, cy, n, w = 80 }: { cx: number; cy: number; n: number; w?: number }) {
  const spread = Math.min(w, n * 8);
  return (
    <g>
      <rect x={cx - spread / 2 - 4} y={cy - 5} width={spread + 8} height={10} fill={COL.base} rx={2} />
      {Array.from({ length: n }).map((_, i) => {
        const ax = cx - spread / 2 + (n > 1 ? (i * spread) / (n - 1) : 0);
        return <line key={i} x1={ax} y1={cy - 5} x2={ax} y2={cy - 14} stroke={COL.base} strokeWidth={1.5} />;
      })}
    </g>
  );
}

function Beam({ cx, cy, angleDeg, halfWidthDeg, r, color = COL.beam, opacity = 0.4 }: {
  cx: number; cy: number; angleDeg: number; halfWidthDeg: number; r: number; color?: string; opacity?: number;
}) {
  const rL = ((angleDeg - halfWidthDeg) * Math.PI) / 180;
  const rR = ((angleDeg + halfWidthDeg) * Math.PI) / 180;
  const lx = cx + r * Math.sin(rL);
  const ly = cy - r * Math.cos(rL);
  const rx = cx + r * Math.sin(rR);
  const ry = cy - r * Math.cos(rR);
  return (
    <polygon points={`${cx},${cy} ${lx},${ly} ${rx},${ry}`} fill={color} fillOpacity={opacity} stroke={color} strokeOpacity={0.6} />
  );
}

// PRB strip — a row of N PRB cells. used[i] = "ok"/"bad"/"muted"
function PrbStrip({ states, label }: { states: ("ok" | "bad" | "muted")[]; label?: string }) {
  const colors = { ok: COL.ok, bad: COL.bad, muted: COL.light } as const;
  const cellW = 16;
  return (
    <g>
      {states.map((s, i) => (
        <rect key={i} x={i * cellW} y={0} width={cellW - 2} height={40} fill={colors[s]} rx={2} />
      ))}
      {label ? <text x={(states.length * cellW) / 2} y={56} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">{label}</text> : null}
    </g>
  );
}

// Card wrapper
function Card({ caption, children, title }: { caption?: string; children: ReactNode; title?: string }) {
  return (
    <div className="rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-3">
      {title ? <div className="text-sm font-semibold mb-2 text-ink-700 dark:text-ink-200">{title}</div> : null}
      {children}
      {caption ? <div className="text-sm text-ink-500 mt-2 text-center">{caption}</div> : null}
    </div>
  );
}

export function BeforeAfter({
  beforeLabel, afterLabel, before, after,
}: {
  beforeLabel: string; afterLabel: string; before: ReactNode; after: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-lg border-2 border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-900/10 p-2.5">
        <div className="text-sm font-semibold mb-2 text-red-700 dark:text-red-300">{beforeLabel}</div>
        {before}
      </div>
      <div className="rounded-lg border-2 border-emerald-300 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-900/10 p-2.5">
        <div className="text-sm font-semibold mb-2 text-emerald-700 dark:text-emerald-300">{afterLabel}</div>
        {after}
      </div>
    </div>
  );
}

// ====================================================================
// Section Type illustrations
// ====================================================================

function ST0Svg() {
  return (
    <svg viewBox="0 0 280 110" className="w-full h-auto">
      <text x={10} y={14} fontSize={12} fill="currentColor" className="text-ink-500">시간(심볼) →</text>
      {Array.from({ length: 14 }).map((_, i) => {
        const guard = i < 2 || i > 11;
        const x = 12 + i * 18;
        return (
          <g key={i}>
            <rect x={x} y={22} width={16} height={55} fill={guard ? COL.muted : COL.beam} fillOpacity={guard ? 0.85 : 0.3} stroke="#0f172a" strokeOpacity={0.1} rx={2} />
            {guard ? <text x={x + 8} y={56} fontSize={16} textAnchor="middle" fill="white" fontWeight={800}>✕</text> : null}
          </g>
        );
      })}
      <text x={140} y={95} fontSize={13} textAnchor="middle" fill="currentColor" className="text-ink-500">회색 ✕ = "이 영역은 사용 안 함"</text>
    </svg>
  );
}

function ST1Svg() {
  return (
    <svg viewBox="0 0 280 120" className="w-full h-auto">
      <ODU x={10} y={45} />
      <ORU x={130} y={45} />
      <Arrow x1={68} y1={52} x2={128} y2={52} label="ST 1 (스케줄)" />
      <Arrow x1={68} y1={70} x2={128} y2={70} color={COL.ok} label="U-plane IQ" />
      <UEIcon x={245} y={59} label="UE" color={COL.ok} big />
      <line x1={188} y1={59} x2={230} y2={59} stroke={COL.beam} strokeWidth={8} strokeOpacity={0.55} />
      <text x={210} y={42} fontSize={12} textAnchor="middle" fill={COL.beam} fontWeight={600}>OTA 빔</text>
      <text x={140} y={110} fontSize={13} textAnchor="middle" fill="currentColor" className="text-ink-500">DU가 스케줄 알리고 → U-plane으로 IQ 전송 → 빔으로 UE에 송신</text>
    </svg>
  );
}

function ST3Svg() {
  return (
    <svg viewBox="0 0 280 120" className="w-full h-auto">
      <ODU x={10} y={45} />
      <ORU x={130} y={45} />
      <UEIcon x={245} y={59} label="UE" color={COL.ltePurple} big />
      <Arrow x1={68} y1={50} x2={128} y2={50} label="ST 3 (PRACH 설정)" />
      <Arrow x1={230} y1={68} x2={188} y2={68} color={COL.ltePurple} label="PRACH preamble" />
      <text x={140} y={110} fontSize={13} textAnchor="middle" fill="currentColor" className="text-ink-500">UE가 처음 접속할 때: RU가 PRACH 받을 자리를 미리 세팅</text>
    </svg>
  );
}

function ST4Svg() {
  return (
    <svg viewBox="0 0 280 130" className="w-full h-auto">
      <ODU x={10} y={50} />
      <ORU x={190} y={50} />
      <Arrow x1={68} y1={64} x2={188} y2={64} label="ST 4 (슬롯 설정 명령)" strokeWidth={2.5} />
      <g transform="translate(140, 90)">
        <rect x={-30} y={0} width={60} height={22} fill={COL.warn} fillOpacity={0.2} stroke={COL.warn} rx={3} />
        <text x={0} y={15} fontSize={12} textAnchor="middle" fill={COL.warn} fontWeight={600}>slot N의 설정 변경</text>
      </g>
    </svg>
  );
}

function ST5Svg() {
  return (
    <svg viewBox="0 0 280 140" className="w-full h-auto">
      <ODU x={10} y={60} />
      <ORU x={110} y={60} />
      <Arrow x1={68} y1={74} x2={108} y2={74} label="ST 5 × N (ueId 별)" />
      <UEIcon x={235} y={25} label="A" color={COL.ok} big />
      <UEIcon x={250} y={75} label="B" color={COL.beam} big />
      <UEIcon x={235} y={120} label="C" color={COL.warn} big />
      <line x1={166} y1={74} x2={222} y2={28} stroke={COL.ok} strokeWidth={6} strokeOpacity={0.5} />
      <line x1={166} y1={74} x2={237} y2={75} stroke={COL.beam} strokeWidth={6} strokeOpacity={0.5} />
      <line x1={166} y1={74} x2={222} y2={117} stroke={COL.warn} strokeWidth={6} strokeOpacity={0.5} />
      <text x={140} y={134} fontSize={13} textAnchor="middle" fill="currentColor" className="text-ink-500">같은 자원·시간에 여러 UE를 각각의 빔으로 (MU-MIMO)</text>
    </svg>
  );
}

function ST6Svg() {
  return (
    <svg viewBox="0 0 280 130" className="w-full h-auto">
      <ODU x={10} y={50} />
      <ORU x={130} y={50} />
      <UEIcon x={245} y={64} label="UE" color={COL.ltePurple} big />
      <line x1={232} y1={64} x2={188} y2={64} stroke={COL.ltePurple} strokeWidth={6} strokeOpacity={0.55} />
      <text x={208} y={48} fontSize={12} textAnchor="middle" fill={COL.ltePurple}>채널 측정</text>
      <Arrow x1={128} y1={78} x2={68} y2={78} color={COL.ok} label="ST 6 채널 H 보고" />
      <text x={140} y={118} fontSize={13} textAnchor="middle" fill="currentColor" className="text-ink-500">RU가 측정한 UE 채널을 DU로 보고 → DU가 다음 빔 계산</text>
    </svg>
  );
}

function ST7Svg() {
  return (
    <svg viewBox="0 0 280 140" className="w-full h-auto">
      <ODU x={10} y={45} />
      <ORU x={190} y={45} />
      <Arrow x1={68} y1={52} x2={188} y2={52} label="LBT 요청" />
      <Arrow x1={188} y1={72} x2={68} y2={72} color={COL.ok} label="결과: 빔" />
      <g transform="translate(120, 95)">
        <rect x={-40} y={0} width={80} height={22} fill={COL.ok} fillOpacity={0.15} stroke={COL.ok} rx={3} />
        <text x={0} y={15} fontSize={12} textAnchor="middle" fill={COL.ok} fontWeight={700}>↓ 비어 있으면 송신 시작</text>
      </g>
      <text x={140} y={132} fontSize={13} textAnchor="middle" fill="currentColor" className="text-ink-500">비면허 대역: 채널 비었는지 RU가 확인하고 응답</text>
    </svg>
  );
}

function ST8Svg() {
  return (
    <svg viewBox="0 0 280 120" className="w-full h-auto">
      <ODU x={10} y={45} />
      <ORU x={190} y={45} />
      <Arrow x1={68} y1={52} x2={188} y2={52} label="명령 + SE 22" />
      <Arrow x1={188} y1={72} x2={68} y2={72} color={COL.ok} label="ST 8 ACK ✓" />
      <text x={140} y={105} fontSize={13} textAnchor="middle" fill="currentColor" className="text-ink-500">명령 받은 RU가 ACK/NACK으로 응답</text>
    </svg>
  );
}

function ST9Svg() {
  return (
    <svg viewBox="0 0 280 130" className="w-full h-auto">
      <ODU x={10} y={50} />
      <ORU x={130} y={50} />
      <UEIcon x={245} y={64} label="UE" color={COL.ltePurple} big />
      <line x1={232} y1={64} x2={188} y2={64} stroke={COL.ltePurple} strokeWidth={6} strokeOpacity={0.55} />
      <text x={208} y={48} fontSize={12} textAnchor="middle" fill={COL.ltePurple}>PUSCH</text>
      <g transform="translate(130, 65)">
        <rect x={20} y={0} width={32} height={20} fill={COL.warn} fillOpacity={0.2} stroke={COL.warn} rx={3} />
        <text x={36} y={13} fontSize={11} textAnchor="middle" fill={COL.warn} fontWeight={600}>등화</text>
      </g>
      <Arrow x1={128} y1={92} x2={68} y2={92} color={COL.ok} label="ST 9 SINR 값" />
      <text x={140} y={120} fontSize={13} textAnchor="middle" fill="currentColor" className="text-ink-500">등화 후 SINR을 측정해 DU로 보고</text>
    </svg>
  );
}

function ST10Svg() {
  return (
    <svg viewBox="0 0 280 140" className="w-full h-auto">
      <ODU x={10} y={50} />
      <ORU x={210} y={50} />
      <g transform="translate(90, 70)">
        {Array.from({ length: 7 }).map((_, i) => {
          const isFree = i < 3 || i > 4;
          const h = isFree ? 5 + Math.random() * 10 : 20 + Math.random() * 12;
          return <rect key={i} x={i * 14} y={30 - h} width={12} height={h} fill={isFree ? COL.muted : COL.bad} fillOpacity={0.7} rx={1} />;
        })}
        <text x={45} y={50} fontSize={11} textAnchor="middle" fill="currentColor" className="text-ink-500">미할당 PRB의 잡음 측정</text>
      </g>
      <Arrow x1={208} y1={64} x2={68} y2={64} color={COL.ok} label="ST 10 결과 보고" />
    </svg>
  );
}

function ST11Svg() {
  return (
    <svg viewBox="0 0 280 130" className="w-full h-auto">
      <ODU x={10} y={45} />
      <ORU x={190} y={45} />
      <Arrow x1={68} y1={52} x2={188} y2={52} label="ST 11 측정 요청" />
      <Arrow x1={188} y1={72} x2={68} y2={72} color={COL.ok} label="ST 10 결과" />
      <text x={140} y={120} fontSize={13} textAnchor="middle" fill="currentColor" className="text-ink-500">11 = 요청, 10 = 응답. 한 쌍으로 동작</text>
    </svg>
  );
}

export function STIllustration({ id, caption }: { id: number; caption?: string }) {
  const map: Record<number, { svg: ReactNode; defaultCaption: string }> = {
    0: { svg: <ST0Svg />, defaultCaption: "Section Type 0 — 이 영역은 사용하지 않음" },
    1: { svg: <ST1Svg />, defaultCaption: "Section Type 1 — 일반 데이터 채널 (가장 흔함)" },
    3: { svg: <ST3Svg />, defaultCaption: "Section Type 3 — PRACH/혼합 누메롤로지" },
    4: { svg: <ST4Svg />, defaultCaption: "Section Type 4 — 슬롯 단위 설정 명령" },
    5: { svg: <ST5Svg />, defaultCaption: "Section Type 5 — UE 단위 스케줄링 (MU-MIMO)" },
    6: { svg: <ST6Svg />, defaultCaption: "Section Type 6 — UE 채널 정보 보고" },
    7: { svg: <ST7Svg />, defaultCaption: "Section Type 7 — LAA / LBT" },
    8: { svg: <ST8Svg />, defaultCaption: "Section Type 8 — ACK/NACK 응답" },
    9: { svg: <ST9Svg />, defaultCaption: "Section Type 9 — 등화 후 SINR 보고" },
    10: { svg: <ST10Svg />, defaultCaption: "Section Type 10 — RRM 측정 보고" },
    11: { svg: <ST11Svg />, defaultCaption: "Section Type 11 — RRM 측정 요청" },
  };
  const entry = map[id];
  if (!entry) return null;
  return <Card caption={caption ?? entry.defaultCaption}>{entry.svg}</Card>;
}

// ====================================================================
// Section Extension illustrations — visual before / after
// ====================================================================

// SE 1: preset beams vs precise beam pointing exactly at UE
function SE1Before() {
  return (
    <svg viewBox="0 0 200 130" className="w-full h-auto">
      <AntennaRow cx={100} cy={115} n={1} />
      {[-45, -15, 15, 45].map((deg) => <Beam key={deg} cx={100} cy={115} angleDeg={deg} halfWidthDeg={10} r={100} color={COL.beam} opacity={0.18} />)}
      <UEIcon x={130} y={48} label="UE" color={COL.muted} />
      <text x={100} y={128} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">정해진 4개 빔만</text>
    </svg>
  );
}
function SE1After() {
  return (
    <svg viewBox="0 0 200 130" className="w-full h-auto">
      <AntennaRow cx={100} cy={115} n={16} />
      <Beam cx={100} cy={115} angleDeg={26} halfWidthDeg={6} r={100} color={COL.ok} opacity={0.45} />
      <UEIcon x={140} y={28} label="UE" color={COL.ok} />
      <text x={100} y={128} fontSize={12} textAnchor="middle" fill={COL.ok} fontWeight={600}>UE 방향으로 정밀하게</text>
    </svg>
  );
}

// SE 2: beam shape unknown vs annotated (az/el/width)
function SE2Before() {
  return (
    <svg viewBox="0 0 200 130" className="w-full h-auto">
      <AntennaRow cx={100} cy={115} n={8} />
      <Beam cx={100} cy={115} angleDeg={20} halfWidthDeg={20} r={100} color={COL.beam} opacity={0.35} />
      <text x={120} y={60} fontSize={18} fill={COL.bad} fontWeight={700} textAnchor="middle">?</text>
      <text x={100} y={128} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">방향/폭 정보 없음</text>
    </svg>
  );
}
function SE2After() {
  return (
    <svg viewBox="0 0 200 130" className="w-full h-auto">
      <AntennaRow cx={100} cy={115} n={8} />
      <Beam cx={100} cy={115} angleDeg={20} halfWidthDeg={20} r={100} color={COL.ok} opacity={0.4} />
      <line x1={100} y1={115} x2={134} y2={20} stroke={COL.ok} strokeDasharray="3 2" />
      <text x={150} y={28} fontSize={12} fill={COL.ok} fontWeight={700}>20°</text>
      <path d="M 65 60 A 50 50 0 0 1 135 60" fill="none" stroke={COL.ok} strokeWidth={1.5} strokeDasharray="2 2" />
      <text x={100} y={56} fontSize={12} fill={COL.ok} fontWeight={700} textAnchor="middle">±20° 폭</text>
      <text x={100} y={128} fontSize={12} textAnchor="middle" fill={COL.ok}>방위·폭 메타 포함</text>
    </svg>
  );
}

// SE 3: 1 stream → 1 antenna vs N layers → MIMO
function SE3Before() {
  return (
    <svg viewBox="0 0 220 130" className="w-full h-auto">
      <rect x={10} y={55} width={50} height={24} rx={3} fill={COL.base} />
      <text x={35} y={71} fontSize={12} textAnchor="middle" fill="white" fontWeight={700}>1 stream</text>
      <Arrow x1={62} y1={67} x2={120} y2={67} />
      <AntennaRow cx={150} cy={67} n={1} w={20} />
      <Beam cx={150} cy={67} angleDeg={0} halfWidthDeg={20} r={50} color={COL.beam} opacity={0.3} />
      <text x={110} y={122} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">단일 안테나 / 단일 레이어</text>
    </svg>
  );
}
function SE3After() {
  return (
    <svg viewBox="0 0 220 130" className="w-full h-auto">
      {/* 4 streams to precoder */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={10} y={20 + i * 22} width={36} height={16} rx={2} fill={COL.beam} fillOpacity={0.8} />
          <text x={28} y={31 + i * 22} fontSize={10} textAnchor="middle" fill="white">L{i}</text>
          <line x1={46} y1={28 + i * 22} x2={88} y2={67} stroke={COL.beam} strokeOpacity={0.4} strokeWidth={1.5} />
        </g>
      ))}
      <rect x={88} y={56} width={22} height={22} rx={3} fill={COL.ok} />
      <text x={99} y={70} fontSize={11} textAnchor="middle" fill="white" fontWeight={700}>W</text>
      <AntennaRow cx={170} cy={67} n={8} />
      <Beam cx={170} cy={67} angleDeg={-10} halfWidthDeg={9} r={50} color={COL.ok} opacity={0.45} />
      <text x={110} y={122} fontSize={12} textAnchor="middle" fill={COL.ok}>4 레이어 + 프리코더 W → 안테나</text>
    </svg>
  );
}

// SE 4: big IQ vs compressed IQ — bytes visualization
function ByteBox({ x, y, w, label, color }: { x: number; y: number; w: number; label: string; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={26} rx={3} fill={color} fillOpacity={0.8} />
      <text x={x + w / 2} y={y + 17} fontSize={12} textAnchor="middle" fill="white" fontWeight={700}>{label}</text>
    </g>
  );
}
function SE4Before() {
  return (
    <svg viewBox="0 0 220 110" className="w-full h-auto">
      <text x={10} y={20} fontSize={12} fill="currentColor" className="text-ink-500">U-plane IQ 데이터</text>
      <ByteBox x={10} y={32} w={200} label="16 bit IQ × N (크다)" color={COL.bad} />
      <text x={110} y={84} fontSize={12} textAnchor="middle" fill={COL.bad}>프론트홀 대역 ↑↑</text>
    </svg>
  );
}
function SE4After() {
  return (
    <svg viewBox="0 0 220 110" className="w-full h-auto">
      <text x={10} y={20} fontSize={12} fill="currentColor" className="text-ink-500">SE 4 압축된 IQ 데이터</text>
      <ByteBox x={10} y={32} w={110} label="9 bit BFP (작다)" color={COL.ok} />
      <text x={170} y={50} fontSize={12} fill={COL.ok} fontWeight={700}>−40%</text>
      <text x={110} y={84} fontSize={12} textAnchor="middle" fill={COL.ok}>같은 정보, 더 작은 메시지</text>
    </svg>
  );
}

// SE 5: base compression vs fine-tuned scale/bias
function SE5Before() {
  return (
    <svg viewBox="0 0 220 110" className="w-full h-auto">
      <text x={110} y={20} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">기본 압축 — 신호 일부 어긋남</text>
      <polyline points="10,60 30,55 50,65 70,52 90,68 110,55 130,72 150,50 170,70 190,55 210,68" stroke={COL.bad} strokeWidth={2} fill="none" />
      <polyline points="10,55 30,52 50,58 70,55 90,60 110,52 130,62 150,50 170,58 190,52 210,55" stroke={COL.muted} strokeWidth={1} fill="none" strokeDasharray="2 2" />
      <text x={110} y={95} fontSize={11} textAnchor="middle" fill={COL.bad}>점선=원본, 실선=복원</text>
    </svg>
  );
}
function SE5After() {
  return (
    <svg viewBox="0 0 220 110" className="w-full h-auto">
      <text x={110} y={20} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 5 보정 — 거의 일치</text>
      <polyline points="10,55 30,52 50,58 70,55 90,60 110,52 130,62 150,50 170,58 190,52 210,55" stroke={COL.ok} strokeWidth={2} fill="none" />
      <polyline points="10,55 30,52 50,58 70,55 90,60 110,52 130,62 150,50 170,58 190,52 210,55" stroke={COL.muted} strokeWidth={1} fill="none" strokeDasharray="2 2" />
      <text x={110} y={95} fontSize={11} textAnchor="middle" fill={COL.ok}>스케일/바이어스 보정으로 정확</text>
    </svg>
  );
}

// SE 6: PRB strip — contiguous block hitting LTE vs non-contiguous avoiding LTE
function SE6Before() {
  const lte = [6, 7, 8];
  return (
    <svg viewBox="0 0 240 90" className="w-full h-auto">
      <text x={10} y={16} fontSize={12} fill="currentColor" className="text-ink-500">주파수 →</text>
      {Array.from({ length: 12 }).map((_, i) => {
        const isLte = lte.includes(i);
        const used = i >= 3 && i <= 10;
        return <rect key={i} x={12 + i * 18} y={24} width={16} height={42} fill={isLte ? COL.bad : used ? COL.ok : COL.light} rx={2} />;
      })}
      <text x={12 + 7 * 18 - 2} y={82} fontSize={12} textAnchor="middle" fill={COL.bad} fontWeight={700}>LTE 영역과 충돌!</text>
    </svg>
  );
}
function SE6After() {
  const lte = [6, 7, 8];
  return (
    <svg viewBox="0 0 240 90" className="w-full h-auto">
      <text x={10} y={16} fontSize={12} fill="currentColor" className="text-ink-500">주파수 →</text>
      {Array.from({ length: 12 }).map((_, i) => {
        const isLte = lte.includes(i);
        const used = (i >= 0 && i <= 5) || (i >= 9 && i <= 11);
        return <rect key={i} x={12 + i * 18} y={24} width={16} height={42} fill={isLte ? COL.bad : used ? COL.ok : COL.light} rx={2} />;
      })}
      <text x={120} y={82} fontSize={12} textAnchor="middle" fill={COL.ok} fontWeight={700}>LTE 회피, 띄엄띄엄 점유</text>
    </svg>
  );
}

// SE 7: eAxC mask — 4 separate messages vs 1 message with mask
function SE7Before() {
  return (
    <svg viewBox="0 0 240 130" className="w-full h-auto">
      <rect x={10} y={50} width={40} height={24} rx={3} fill={COL.base} />
      <text x={30} y={66} fontSize={11} textAnchor="middle" fill="white" fontWeight={700}>DU</text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <Arrow x1={52} y1={62} x2={180} y2={20 + i * 30} label={`메시지 ${i + 1}`} />
          <rect x={183} y={10 + i * 30} width={50} height={20} rx={3} fill={COL.muted} />
          <text x={208} y={24 + i * 30} fontSize={11} textAnchor="middle" fill="white">eAxC {i}</text>
        </g>
      ))}
      <text x={120} y={123} fontSize={12} textAnchor="middle" fill={COL.bad}>같은 명령을 4번 반복</text>
    </svg>
  );
}
function SE7After() {
  return (
    <svg viewBox="0 0 240 130" className="w-full h-auto">
      <rect x={10} y={50} width={40} height={24} rx={3} fill={COL.base} />
      <text x={30} y={66} fontSize={11} textAnchor="middle" fill="white" fontWeight={700}>DU</text>
      <Arrow x1={52} y1={62} x2={150} y2={62} label="메시지 1번 + 마스크 1111" color={COL.ok} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <line x1={150} y1={62} x2={183} y2={20 + i * 30} stroke={COL.ok} strokeWidth={1.5} />
          <rect x={183} y={10 + i * 30} width={50} height={20} rx={3} fill={COL.ok} />
          <text x={208} y={24 + i * 30} fontSize={11} textAnchor="middle" fill="white">eAxC {i}</text>
        </g>
      ))}
      <text x={120} y={123} fontSize={12} textAnchor="middle" fill={COL.ok}>한 번에 4개에 적용</text>
    </svg>
  );
}

// SE 8: regularization — jagged unstable beam vs smooth beam
function SE8Before() {
  return (
    <svg viewBox="0 0 200 130" className="w-full h-auto">
      <AntennaRow cx={100} cy={115} n={8} />
      <polygon points="100,115 60,20 65,55 80,40 95,60 110,30 130,55 145,35 160,55 140,20" fill={COL.bad} fillOpacity={0.3} stroke={COL.bad} />
      <text x={100} y={128} fontSize={12} textAnchor="middle" fill={COL.bad}>빔이 들쭉날쭉</text>
    </svg>
  );
}
function SE8After() {
  return (
    <svg viewBox="0 0 200 130" className="w-full h-auto">
      <AntennaRow cx={100} cy={115} n={8} />
      <Beam cx={100} cy={115} angleDeg={0} halfWidthDeg={20} r={100} color={COL.ok} opacity={0.4} />
      <text x={100} y={128} fontSize={12} textAnchor="middle" fill={COL.ok}>정규화로 빔 안정</text>
    </svg>
  );
}

// SE 9: DSS — overlapping LTE/NR vs separated time-frequency
function SE9Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">같은 주파수에 LTE + NR</text>
      <rect x={20} y={26} width={200} height={30} fill={COL.bad} fillOpacity={0.5} />
      <text x={120} y={45} fontSize={13} textAnchor="middle" fill="white" fontWeight={700}>LTE</text>
      <rect x={20} y={62} width={200} height={30} fill={COL.beam} fillOpacity={0.5} />
      <text x={120} y={81} fontSize={13} textAnchor="middle" fill="white" fontWeight={700}>NR</text>
      <text x={120} y={104} fontSize={12} textAnchor="middle" fill={COL.bad}>서로 영역을 모름 → 충돌</text>
    </svg>
  );
}
function SE9After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">DSS — 같은 대역, 시간 분리</text>
      <rect x={20} y={26} width={100} height={60} fill={COL.bad} fillOpacity={0.5} />
      <text x={70} y={62} fontSize={13} textAnchor="middle" fill="white" fontWeight={700}>LTE</text>
      <rect x={120} y={26} width={100} height={60} fill={COL.ok} fillOpacity={0.5} />
      <text x={170} y={62} fontSize={13} textAnchor="middle" fill="white" fontWeight={700}>NR</text>
      <text x={120} y={104} fontSize={12} textAnchor="middle" fill={COL.ok}>회피 정보를 함께 전송</text>
    </svg>
  );
}

// SE 10: port group — independent ports vs grouped
function SE10Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <rect x={10 + i * 28} y={40} width={22} height={28} rx={2} fill={COL.beam} fillOpacity={0.6} />
          <text x={10 + i * 28 + 11} y={58} fontSize={12} textAnchor="middle" fill="white" fontWeight={700}>P{i}</text>
        </g>
      ))}
      <text x={120} y={100} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">포트 8개를 각각 설정</text>
    </svg>
  );
}
function SE10After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <rect x={6} y={32} width={120} height={44} fill={COL.ok} fillOpacity={0.15} stroke={COL.ok} strokeDasharray="3 2" rx={4} />
      <rect x={130} y={32} width={108} height={44} fill={COL.warn} fillOpacity={0.15} stroke={COL.warn} strokeDasharray="3 2" rx={4} />
      <text x={66} y={28} fontSize={11} textAnchor="middle" fill={COL.ok} fontWeight={700}>그룹 A</text>
      <text x={184} y={28} fontSize={11} textAnchor="middle" fill={COL.warn} fontWeight={700}>그룹 B</text>
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <rect x={10 + i * 28} y={40} width={22} height={28} rx={2} fill={i < 4 ? COL.ok : COL.warn} fillOpacity={0.7} />
          <text x={10 + i * 28 + 11} y={58} fontSize={12} textAnchor="middle" fill="white" fontWeight={700}>P{i}</text>
        </g>
      ))}
      <text x={120} y={100} fontSize={12} textAnchor="middle" fill={COL.ok}>그룹 단위로 한 번에 설정</text>
    </svg>
  );
}

// SE 11: SE 1 with N=64 takes huge message vs SE 11 bundles PRBs
function SE11Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 1: PRB마다 안테나별 가중치</text>
      {Array.from({ length: 12 }).map((_, i) => (
        <ByteBox key={i} x={10 + i * 18} y={28} w={16} label="64w" color={COL.bad} />
      ))}
      <text x={120} y={84} fontSize={12} textAnchor="middle" fill={COL.bad} fontWeight={700}>메시지가 매우 큼</text>
    </svg>
  );
}
function SE11After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 11: PRB를 묶어서 가중치 공유</text>
      {Array.from({ length: 3 }).map((_, i) => (
        <g key={i}>
          <ByteBox x={10 + i * 76} y={28} w={70} label="64w (4 PRB 공유)" color={COL.ok} />
        </g>
      ))}
      <text x={120} y={84} fontSize={12} textAnchor="middle" fill={COL.ok} fontWeight={700}>−75% 크기</text>
    </svg>
  );
}

// SE 12: bitmap vs range tuples
function SE12Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 6 비트맵 (28 비트)</text>
      {Array.from({ length: 28 }).map((_, i) => {
        const on = [0, 1, 2, 3, 7, 8, 9, 14, 15].includes(i);
        return <rect key={i} x={10 + i * 7.5} y={30} width={6} height={28} fill={on ? COL.bad : COL.light} />;
      })}
      <text x={120} y={88} fontSize={11} textAnchor="middle" fill="currentColor" className="text-ink-500">28 비트 고정</text>
    </svg>
  );
}
function SE12After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 12: (시작, 길이) 범위 표현</text>
      {[{ s: 0, l: 4 }, { s: 7, l: 3 }, { s: 14, l: 2 }].map((r, i) => (
        <g key={i}>
          <rect x={10 + r.s * 7.5} y={30} width={r.l * 7.5 - 1} height={28} fill={COL.ok} rx={2} />
          <text x={10 + r.s * 7.5 + (r.l * 7.5) / 2} y={48} fontSize={10} textAnchor="middle" fill="white" fontWeight={700}>{r.s}+{r.l}</text>
        </g>
      ))}
      <text x={120} y={88} fontSize={11} textAnchor="middle" fill={COL.ok}>적은 비트로 표현 가능</text>
    </svg>
  );
}

// SE 13: frequency hopping — same PRB block vs jumping
function SE13Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">시간 →</text>
      {Array.from({ length: 8 }).map((_, t) => (
        <rect key={t} x={20 + t * 24} y={45} width={20} height={28} fill={COL.beam} fillOpacity={0.7} rx={2} />
      ))}
      <text x={120} y={95} fontSize={11} textAnchor="middle" fill="currentColor" className="text-ink-500">한 주파수에 고정</text>
    </svg>
  );
}
function SE13After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">시간 →</text>
      {Array.from({ length: 8 }).map((_, t) => {
        const ys = [25, 60, 25, 60, 25, 60, 25, 60];
        return <rect key={t} x={20 + t * 24} y={ys[t]} width={20} height={20} fill={COL.ok} fillOpacity={0.8} rx={2} />;
      })}
      <text x={120} y={102} fontSize={11} textAnchor="middle" fill={COL.ok}>주파수가 점프 (호핑)</text>
    </svg>
  );
}

// SE 14: two UEs - both interfered vs UE-B nulled
function SE14Before() {
  return (
    <svg viewBox="0 0 220 130" className="w-full h-auto">
      <AntennaRow cx={110} cy={115} n={1} />
      <Beam cx={110} cy={115} angleDeg={-22} halfWidthDeg={22} r={100} color={COL.beam} opacity={0.4} />
      <Beam cx={110} cy={115} angleDeg={22} halfWidthDeg={22} r={100} color={COL.beam} opacity={0.4} />
      <UEIcon x={70} y={30} label="A" color={COL.bad} big />
      <UEIcon x={150} y={30} label="B" color={COL.bad} big />
      <text x={110} y={128} fontSize={12} textAnchor="middle" fill={COL.bad} fontWeight={700}>둘 다 잡음 (간섭)</text>
    </svg>
  );
}
function SE14After() {
  return (
    <svg viewBox="0 0 220 130" className="w-full h-auto">
      <AntennaRow cx={110} cy={115} n={16} />
      <Beam cx={110} cy={115} angleDeg={-22} halfWidthDeg={8} r={100} color={COL.ok} opacity={0.5} />
      <line x1={110} y1={115} x2={150} y2={30} stroke={COL.bad} strokeDasharray="4 3" strokeWidth={2.5} />
      <text x={172} y={22} fontSize={12} fill={COL.bad} fontWeight={700}>NULL</text>
      <UEIcon x={70} y={30} label="A" color={COL.ok} big />
      <UEIcon x={150} y={30} label="B" color={COL.muted} big />
      <text x={110} y={128} fontSize={12} textAnchor="middle" fill={COL.ok}>A로만 가고 B는 차단</text>
    </svg>
  );
}

// SE 15: same SCS vs mixed SCS PRBs
function SE15Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">단일 SCS (PRB 크기 같음)</text>
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={12 + i * 22} y={30} width={20} height={50} fill={COL.beam} fillOpacity={0.6} rx={2} />
      ))}
    </svg>
  );
}
function SE15After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">혼합 SCS (PRB 크기 다름)</text>
      {[20, 20, 40, 20, 40, 40, 20, 20].map((w, i) => {
        const x = [12, 32, 52, 92, 112, 152, 192, 212][i];
        return <rect key={i} x={x} y={30} width={w - 2} height={50} fill={i % 2 === 0 ? COL.ok : COL.warn} fillOpacity={0.7} rx={2} />;
      })}
    </svg>
  );
}

// SE 16: channels not mapped vs mapped to specific ports
function SE16Before() {
  return (
    <svg viewBox="0 0 240 130" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">채널이 안테나에 무작위 매핑</text>
      {Array.from({ length: 4 }).map((_, i) => (
        <g key={i}>
          <circle cx={30} cy={36 + i * 18} r={9} fill={COL.beam} />
          <text x={30} y={40 + i * 18} fontSize={10} textAnchor="middle" fill="white">H{i}</text>
          <line x1={40} y1={36 + i * 18} x2={195} y2={36 + ((i + 2) % 4) * 18} stroke={COL.muted} strokeDasharray="2 2" />
          <rect x={195} y={28 + i * 18} width={28} height={16} rx={2} fill={COL.muted} />
          <text x={209} y={40 + i * 18} fontSize={10} textAnchor="middle" fill="white">P{i}</text>
        </g>
      ))}
    </svg>
  );
}
function SE16After() {
  return (
    <svg viewBox="0 0 240 130" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 16: 채널 ↔ 포트 매핑 명시</text>
      {Array.from({ length: 4 }).map((_, i) => (
        <g key={i}>
          <circle cx={30} cy={36 + i * 18} r={9} fill={COL.ok} />
          <text x={30} y={40 + i * 18} fontSize={10} textAnchor="middle" fill="white">H{i}</text>
          <line x1={40} y1={36 + i * 18} x2={195} y2={36 + i * 18} stroke={COL.ok} strokeWidth={1.5} />
          <rect x={195} y={28 + i * 18} width={28} height={16} rx={2} fill={COL.ok} />
          <text x={209} y={40 + i * 18} fontSize={10} textAnchor="middle" fill="white">P{i}</text>
        </g>
      ))}
    </svg>
  );
}

// SE 17: ports independent vs grouped (similar to SE 10 but for user ports)
function SE17Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i}>
          <circle cx={30 + i * 36} cy={55} r={14} fill={COL.beam} />
          <text x={30 + i * 36} y={60} fontSize={11} textAnchor="middle" fill="white" fontWeight={700}>UE{i}</text>
        </g>
      ))}
      <text x={120} y={95} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">UE들이 별개로 보임</text>
    </svg>
  );
}
function SE17After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <rect x={6} y={30} width={120} height={50} fill={COL.ok} fillOpacity={0.15} stroke={COL.ok} strokeDasharray="3 2" rx={6} />
      <rect x={132} y={30} width={102} height={50} fill={COL.warn} fillOpacity={0.15} stroke={COL.warn} strokeDasharray="3 2" rx={6} />
      <text x={66} y={28} fontSize={11} textAnchor="middle" fill={COL.ok} fontWeight={700}>그룹 1</text>
      <text x={183} y={28} fontSize={11} textAnchor="middle" fill={COL.warn} fontWeight={700}>그룹 2</text>
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i}>
          <circle cx={30 + i * 36} cy={55} r={14} fill={i < 3 ? COL.ok : COL.warn} />
          <text x={30 + i * 36} y={60} fontSize={11} textAnchor="middle" fill="white" fontWeight={700}>UE{i}</text>
        </g>
      ))}
    </svg>
  );
}

// SE 18: UL timing misaligned vs aligned
function SE18Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">시간 →</text>
      <line x1={20} y1={75} x2={220} y2={75} stroke={COL.muted} />
      <rect x={30} y={45} width={50} height={20} fill={COL.bad} fillOpacity={0.7} rx={2} />
      <text x={55} y={59} fontSize={10} textAnchor="middle" fill="white">UE A 도착</text>
      <rect x={100} y={45} width={50} height={20} fill={COL.bad} fillOpacity={0.7} rx={2} />
      <text x={125} y={59} fontSize={10} textAnchor="middle" fill="white">UE B 도착</text>
      <text x={120} y={98} fontSize={12} textAnchor="middle" fill={COL.bad}>도착 시각이 들쭉날쭉</text>
    </svg>
  );
}
function SE18After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">시간 →</text>
      <line x1={20} y1={75} x2={220} y2={75} stroke={COL.muted} />
      <rect x={70} y={45} width={50} height={20} fill={COL.ok} fillOpacity={0.7} rx={2} />
      <text x={95} y={59} fontSize={10} textAnchor="middle" fill="white">UE A</text>
      <rect x={130} y={45} width={50} height={20} fill={COL.ok} fillOpacity={0.7} rx={2} />
      <text x={155} y={59} fontSize={10} textAnchor="middle" fill="white">UE B</text>
      <line x1={70} y1={70} x2={70} y2={80} stroke={COL.ok} strokeWidth={2} />
      <line x1={180} y1={70} x2={180} y2={80} stroke={COL.ok} strokeWidth={2} />
      <text x={120} y={98} fontSize={12} textAnchor="middle" fill={COL.ok}>TA 보정으로 정렬</text>
    </svg>
  );
}

// SE 19: 4 ports each long vs single compact block
function SE19Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <text x={5} y={30 + i * 18} fontSize={10} fill="currentColor" className="text-ink-500">P{i}:</text>
          <ByteBox x={22} y={20 + i * 18} w={200} label="weights" color={COL.bad} />
        </g>
      ))}
      <text x={120} y={104} fontSize={11} textAnchor="middle" fill={COL.bad}>포트마다 헤더+가중치 반복</text>
    </svg>
  );
}
function SE19After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <ByteBox x={20} y={28} w={200} label="공통 헤더 + 4 포트 가중치 (콤팩트)" color={COL.ok} />
      <text x={120} y={84} fontSize={11} textAnchor="middle" fill={COL.ok}>한 블록에 4 포트 정보</text>
    </svg>
  );
}

// SE 20: data collides with SSB vs SSB punctured
function SE20Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">데이터(파랑) + SSB(빨강) RE</text>
      {Array.from({ length: 12 }).map((_, i) =>
        Array.from({ length: 4 }).map((_, j) => {
          const isSsb = i >= 4 && i <= 7 && j === 1;
          return <rect key={`${i}-${j}`} x={20 + i * 16} y={28 + j * 14} width={14} height={12} fill={isSsb ? COL.bad : COL.beam} fillOpacity={0.7} rx={1} />;
        })
      )}
      <text x={120} y={102} fontSize={11} textAnchor="middle" fill={COL.bad}>SSB와 충돌 → 데이터 깨짐</text>
    </svg>
  );
}
function SE20After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 20: 충돌 RE를 펑처링</text>
      {Array.from({ length: 12 }).map((_, i) =>
        Array.from({ length: 4 }).map((_, j) => {
          const isSsb = i >= 4 && i <= 7 && j === 1;
          return <rect key={`${i}-${j}`} x={20 + i * 16} y={28 + j * 14} width={14} height={12} fill={isSsb ? COL.muted : COL.ok} fillOpacity={isSsb ? 0.4 : 0.7} rx={1} />;
        })
      )}
      <text x={120} y={102} fontSize={11} textAnchor="middle" fill={COL.ok}>회색=전송 안 함, 충돌 없음</text>
    </svg>
  );
}

// SE 21: fixed PRG size vs variable
function SE21Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">PRG 크기 고정 (4 PRB)</text>
      {Array.from({ length: 4 }).map((_, i) => (
        <rect key={i} x={20 + i * 52} y={30} width={48} height={36} fill={COL.beam} fillOpacity={0.65} rx={2} />
      ))}
    </svg>
  );
}
function SE21After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">PRG 크기 가변 (정밀↑ / 헤더↑)</text>
      {[26, 26, 52, 26, 52, 26].map((w, i) => {
        const xs = [20, 50, 80, 136, 166, 222];
        return <rect key={i} x={xs[i]} y={30} width={w - 2} height={36} fill={i % 2 === 0 ? COL.ok : COL.warn} fillOpacity={0.7} rx={2} />;
      })}
    </svg>
  );
}

// SE 22: silent vs ACK loop
function SE22Before() {
  return (
    <svg viewBox="0 0 280 110" className="w-full h-auto">
      <ODU x={20} y={35} />
      <ORU x={200} y={35} />
      <Arrow x1={78} y1={49} x2={198} y2={49} label="명령" />
      <text x={140} y={92} fontSize={13} textAnchor="middle" fill={COL.bad} fontWeight={700}>답이 없다 — 잘 적용됐는지 모름</text>
    </svg>
  );
}
function SE22After() {
  return (
    <svg viewBox="0 0 280 110" className="w-full h-auto">
      <ODU x={20} y={35} />
      <ORU x={200} y={35} />
      <Arrow x1={78} y1={42} x2={198} y2={42} label="명령 + SE 22" />
      <Arrow x1={198} y1={62} x2={78} y2={62} color={COL.ok} label="ST 8 ACK ✓" />
      <text x={140} y={92} fontSize={13} textAnchor="middle" fill={COL.ok} fontWeight={700}>응답 받음 — 결과 확인됨</text>
    </svg>
  );
}

// SE 23: uniform compression vs per-symbol pattern
function SE23Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">모든 심볼 같은 압축</text>
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={10 + i * 16} y={30} width={14} height={40} fill={COL.beam} fillOpacity={0.7} rx={1} />
      ))}
    </svg>
  );
}
function SE23After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">심볼마다 다른 압축</text>
      {Array.from({ length: 14 }).map((_, i) => {
        const heights = [40, 30, 50, 35, 45, 25, 50, 30, 45, 40, 35, 50, 25, 40];
        return <rect key={i} x={10 + i * 16} y={70 - heights[i]} width={14} height={heights[i]} fill={COL.ok} fillOpacity={0.75} rx={1} />;
      })}
    </svg>
  );
}

// SE 24: basic DMRS vs detailed
function SE24Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">기본 DMRS (포트 1, 위치 고정)</text>
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i} x={10 + i * 16} y={30} width={14} height={40} fill={i === 2 ? COL.warn : COL.beam} fillOpacity={i === 2 ? 0.9 : 0.4} rx={1} />
      ))}
      <text x={42} y={86} fontSize={11} fill={COL.warn} fontWeight={700}>↑ DMRS (sym 2)</text>
    </svg>
  );
}
function SE24After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 24: DMRS 포트 4개·심볼 2개</text>
      {Array.from({ length: 14 }).map((_, i) => {
        const dmrs = i === 2 || i === 11;
        return <rect key={i} x={10 + i * 16} y={30} width={14} height={40} fill={dmrs ? COL.ok : COL.beam} fillOpacity={dmrs ? 0.9 : 0.4} rx={1} />;
      })}
      <text x={120} y={86} fontSize={11} fill={COL.ok} fontWeight={700}>↑ DMRS sym 2, 11 — 4 포트 사용</text>
    </svg>
  );
}

// SE 25: default order vs reordered
function SE25Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">기본 순서 0 → 1 → 2 → 3</text>
      {[0, 1, 2, 3].map((n, i) => (
        <g key={n}>
          <rect x={20 + i * 52} y={30} width={40} height={32} fill={COL.beam} fillOpacity={0.7} rx={2} />
          <text x={40 + i * 52} y={50} fontSize={14} textAnchor="middle" fill="white" fontWeight={700}>{n}</text>
        </g>
      ))}
    </svg>
  );
}
function SE25After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 25: 재정렬 0 → 2 → 1 → 3</text>
      {[0, 2, 1, 3].map((n, i) => (
        <g key={i}>
          <rect x={20 + i * 52} y={30} width={40} height={32} fill={COL.ok} fillOpacity={0.7} rx={2} />
          <text x={40 + i * 52} y={50} fontSize={14} textAnchor="middle" fill="white" fontWeight={700}>{n}</text>
        </g>
      ))}
    </svg>
  );
}

// SE 26: frequency drift unaddressed vs corrected
function SE26Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">주파수 드리프트 누적</text>
      <line x1={20} y1={60} x2={220} y2={60} stroke={COL.muted} strokeDasharray="3 3" />
      <polyline points="20,60 50,55 80,52 110,48 140,42 170,35 200,28 220,22" stroke={COL.bad} fill="none" strokeWidth={2.5} />
      <text x={210} y={20} fontSize={11} fill={COL.bad} textAnchor="end" fontWeight={700}>↑ drift</text>
    </svg>
  );
}
function SE26After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 26: 피드백으로 보정</text>
      <line x1={20} y1={60} x2={220} y2={60} stroke={COL.muted} strokeDasharray="3 3" />
      <polyline points="20,60 50,57 80,62 110,58 140,61 170,59 200,60 220,61" stroke={COL.ok} fill="none" strokeWidth={2.5} />
      <text x={210} y={50} fontSize={11} fill={COL.ok} textAnchor="end" fontWeight={700}>안정</text>
    </svg>
  );
}

// SE 27: full matrix vs reduced
function SE27Before() {
  return (
    <svg viewBox="0 0 240 130" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">채널 행렬 32×100 (큼)</text>
      <rect x={50} y={30} width={140} height={80} fill={COL.bad} fillOpacity={0.5} stroke={COL.bad} />
      <text x={120} y={72} fontSize={14} textAnchor="middle" fill="white" fontWeight={700}>H 32×100</text>
    </svg>
  );
}
function SE27After() {
  return (
    <svg viewBox="0 0 240 130" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 27: 차원 축소 8×25</text>
      <rect x={50} y={30} width={140} height={80} fill={COL.muted} fillOpacity={0.2} stroke={COL.muted} strokeDasharray="3 3" />
      <rect x={50} y={30} width={40} height={20} fill={COL.ok} fillOpacity={0.7} stroke={COL.ok} />
      <text x={70} y={45} fontSize={11} textAnchor="middle" fill="white" fontWeight={700}>8×25</text>
      <text x={130} y={84} fontSize={11} textAnchor="middle" fill={COL.ok} fontWeight={700}>−93% 크기</text>
    </svg>
  );
}

// SE 28: fine resolution vs coarse
function SE28Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SINR 보고: 모든 PRB</text>
      {Array.from({ length: 24 }).map((_, i) => {
        const h = 10 + Math.sin(i * 0.5) * 18 + 20;
        return <rect key={i} x={10 + i * 9} y={70 - h} width={7} height={h} fill={COL.bad} fillOpacity={0.7} rx={1} />;
      })}
    </svg>
  );
}
function SE28After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 28: 4 PRB 묶음으로 보고</text>
      {Array.from({ length: 6 }).map((_, i) => {
        const h = 10 + Math.sin(i * 2) * 18 + 20;
        return <rect key={i} x={10 + i * 36} y={70 - h} width={32} height={h} fill={COL.ok} fillOpacity={0.7} rx={1} />;
      })}
    </svg>
  );
}

// SE 29: signals aligned vs cyclically delayed
function SE29Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">모든 안테나 같은 위상</text>
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d="M 20 70 Q 60 30 100 70 Q 140 110 180 70 Q 200 50 220 70" fill="none" stroke={COL.beam} strokeOpacity={0.5} strokeWidth={1.5} transform={`translate(0, ${-15 + i * 8})`} />
      ))}
    </svg>
  );
}
function SE29After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">SE 29: 안테나별 위상 다양화</text>
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d="M 20 70 Q 60 30 100 70 Q 140 110 180 70 Q 200 50 220 70" fill="none" stroke={COL.ok} strokeOpacity={0.7} strokeWidth={1.5} transform={`translate(${i * 10}, ${-15 + i * 8})`} />
      ))}
    </svg>
  );
}

// SE 30: single PUSCH vs 4× repetition
function SE30Before() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">시간(슬롯) →</text>
      <rect x={30} y={40} width={32} height={30} fill={COL.beam} fillOpacity={0.8} rx={2} />
      <text x={46} y={59} fontSize={11} textAnchor="middle" fill="white" fontWeight={700}>PUSCH</text>
      <text x={120} y={98} fontSize={12} textAnchor="middle" fill={COL.bad}>한 번 실패하면 끝</text>
    </svg>
  );
}
function SE30After() {
  return (
    <svg viewBox="0 0 240 110" className="w-full h-auto">
      <text x={120} y={16} fontSize={12} textAnchor="middle" fill="currentColor" className="text-ink-500">시간(슬롯) →</text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={20 + i * 52} y={40} width={42} height={30} fill={COL.ok} fillOpacity={0.7} rx={2} />
          <text x={41 + i * 52} y={59} fontSize={11} textAnchor="middle" fill="white" fontWeight={700}>PUSCH</text>
        </g>
      ))}
      <text x={120} y={98} fontSize={12} textAnchor="middle" fill={COL.ok} fontWeight={700}>4번 반복 → 신뢰성↑</text>
    </svg>
  );
}

interface SEEntry {
  before: ReactNode;
  after: ReactNode;
  beforeLabel: string;
  afterLabel: string;
  defaultCaption?: string;
}

const SE_ILLUSTRATIONS: Record<number, SEEntry> = {
  1:  { before: <SE1Before />,  after: <SE1After />,  beforeLabel: "❌ 정해진 빔만 사용",      afterLabel: "✅ 정밀 빔 (가중치 직접)",   defaultCaption: "SE 1 — UE 방향으로 정확한 빔" },
  2:  { before: <SE2Before />,  after: <SE2After />,  beforeLabel: "❌ 방향·폭 정보 없음",    afterLabel: "✅ 메타 정보 포함",          defaultCaption: "SE 2 — 빔 속성 메타데이터" },
  3:  { before: <SE3Before />,  after: <SE3After />,  beforeLabel: "❌ 단일 레이어",          afterLabel: "✅ 다중 레이어 + 프리코더", defaultCaption: "SE 3 — DL MIMO 프리코딩" },
  4:  { before: <SE4Before />,  after: <SE4After />,  beforeLabel: "❌ 큰 IQ 메시지",          afterLabel: "✅ 압축으로 작아짐",         defaultCaption: "SE 4 — 변조 압축 파라미터" },
  5:  { before: <SE5Before />,  after: <SE5After />,  beforeLabel: "❌ 압축 오차",            afterLabel: "✅ 스케일/바이어스 보정",   defaultCaption: "SE 5 — 압축 보정 파라미터" },
  6:  { before: <SE6Before />,  after: <SE6After />,  beforeLabel: "❌ 연속 PRB만 → 충돌",    afterLabel: "✅ 비트맵으로 띄엄띄엄",     defaultCaption: "SE 6 — 비연속 PRB (LTE 회피)" },
  7:  { before: <SE7Before />,  after: <SE7After />,  beforeLabel: "❌ 메시지 4번 반복",      afterLabel: "✅ 마스크로 한 번에",        defaultCaption: "SE 7 — eAxC mask" },
  8:  { before: <SE8Before />,  after: <SE8After />,  beforeLabel: "❌ 들쭉날쭉 빔",          afterLabel: "✅ 안정된 빔",               defaultCaption: "SE 8 — 정규화 계수" },
  9:  { before: <SE9Before />,  after: <SE9After />,  beforeLabel: "❌ LTE/NR 충돌",          afterLabel: "✅ DSS 회피 정보",           defaultCaption: "SE 9 — DSS 파라미터" },
  10: { before: <SE10Before />, after: <SE10After />, beforeLabel: "❌ 포트별 따로 설정",     afterLabel: "✅ 그룹 단위 설정",         defaultCaption: "SE 10 — 다중 포트 그룹" },
  11: { before: <SE11Before />, after: <SE11After />, beforeLabel: "❌ 메시지 너무 큼",       afterLabel: "✅ PRB 묶음으로 공유",       defaultCaption: "SE 11 — 큰 어레이용 유연한 가중치" },
  12: { before: <SE12Before />, after: <SE12After />, beforeLabel: "❌ 비트맵 고정 28비트",   afterLabel: "✅ 범위 표현",               defaultCaption: "SE 12 — 범위형 비연속 PRB" },
  13: { before: <SE13Before />, after: <SE13After />, beforeLabel: "❌ 한 주파수 고정",       afterLabel: "✅ 주파수 호핑",             defaultCaption: "SE 13 — 주파수 호핑" },
  14: { before: <SE14Before />, after: <SE14After />, beforeLabel: "❌ 옆 UE에 간섭",          afterLabel: "✅ null로 차단",             defaultCaption: "SE 14 — UE 단위 nulling" },
  15: { before: <SE15Before />, after: <SE15After />, beforeLabel: "❌ 단일 SCS",             afterLabel: "✅ 혼합 SCS",                defaultCaption: "SE 15 — 혼합 누메롤로지" },
  16: { before: <SE16Before />, after: <SE16After />, beforeLabel: "❌ 채널/포트 무관",       afterLabel: "✅ 채널→포트 매핑",         defaultCaption: "SE 16 — UL BF 안테나 매핑" },
  17: { before: <SE17Before />, after: <SE17After />, beforeLabel: "❌ UE 별개 처리",         afterLabel: "✅ UE 그룹 표시",           defaultCaption: "SE 17 — 유저 포트 그룹" },
  18: { before: <SE18Before />, after: <SE18After />, beforeLabel: "❌ UL 도착 시각 어긋남",  afterLabel: "✅ TA로 정렬",               defaultCaption: "SE 18 — UL 송신 관리" },
  19: { before: <SE19Before />, after: <SE19After />, beforeLabel: "❌ 포트마다 헤더 반복",   afterLabel: "✅ 콤팩트 인코딩",           defaultCaption: "SE 19 — 콤팩트 다중 포트 빔포밍" },
  20: { before: <SE20Before />, after: <SE20After />, beforeLabel: "❌ 데이터-SSB 충돌",      afterLabel: "✅ 충돌 RE 펑처링",          defaultCaption: "SE 20 — 전용 펑처링" },
  21: { before: <SE21Before />, after: <SE21After />, beforeLabel: "❌ PRG 크기 고정",        afterLabel: "✅ 가변 PRG 크기",           defaultCaption: "SE 21 — 가변 PRB 그룹" },
  22: { before: <SE22Before />, after: <SE22After />, beforeLabel: "❌ 답이 없음",            afterLabel: "✅ ACK 응답 받음",           defaultCaption: "SE 22 — ACK 요청" },
  23: { before: <SE23Before />, after: <SE23After />, beforeLabel: "❌ 모든 심볼 같은 압축",  afterLabel: "✅ 심볼별 다른 압축",       defaultCaption: "SE 23 — 임의 심볼 변조 압축" },
  24: { before: <SE24Before />, after: <SE24After />, beforeLabel: "❌ 단순 DMRS",            afterLabel: "✅ 다중 포트·심볼 DMRS",    defaultCaption: "SE 24 — PUSCH DMRS 상세 설정" },
  25: { before: <SE25Before />, after: <SE25After />, beforeLabel: "❌ 기본 순서",            afterLabel: "✅ 재정렬",                  defaultCaption: "SE 25 — DMRS-BF 심볼 재정렬" },
  26: { before: <SE26Before />, after: <SE26After />, beforeLabel: "❌ 드리프트 누적",         afterLabel: "✅ 피드백 보정",             defaultCaption: "SE 26 — 주파수 오프셋 피드백" },
  27: { before: <SE27Before />, after: <SE27After />, beforeLabel: "❌ 행렬 크기 큼",         afterLabel: "✅ 차원 축소",               defaultCaption: "SE 27 — 차원 축소" },
  28: { before: <SE28Before />, after: <SE28After />, beforeLabel: "❌ 모든 PRB 보고",        afterLabel: "✅ 묶음 단위 보고",         defaultCaption: "SE 28 — SINR 해상도 제어" },
  29: { before: <SE29Before />, after: <SE29After />, beforeLabel: "❌ 위상 동일",            afterLabel: "✅ 위상 다양화",             defaultCaption: "SE 29 — Cyclic delay" },
  30: { before: <SE30Before />, after: <SE30After />, beforeLabel: "❌ 한 번 송신",           afterLabel: "✅ N번 반복",                defaultCaption: "SE 30 — PUSCH 반복" },
};

export function SEIllustration({ id, caption, hideCaption }: { id: number; caption?: string; hideCaption?: boolean }) {
  const entry = SE_ILLUSTRATIONS[id];
  if (!entry) return null;
  return (
    <div>
      <BeforeAfter beforeLabel={entry.beforeLabel} afterLabel={entry.afterLabel} before={entry.before} after={entry.after} />
      {!hideCaption && (caption ?? entry.defaultCaption) ? (
        <div className="text-sm text-ink-500 mt-2 text-center">{caption ?? entry.defaultCaption}</div>
      ) : null}
    </div>
  );
}

export function getSEIllustrationCaption(id: number): string | undefined {
  return SE_ILLUSTRATIONS[id]?.defaultCaption;
}

export const SE_IDS_WITH_ILLUSTRATION = Object.keys(SE_ILLUSTRATIONS).map(Number);
