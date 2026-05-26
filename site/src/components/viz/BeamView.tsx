import { useEffect, useRef, useState } from "react";

/**
 * 2D top-down beamforming visualization.
 *
 * Renders the O-RU at the origin pointing up, antenna array as a horizontal
 * line of N elements, and an interactive beam pattern computed from a uniform
 * linear array (ULA) model with optional null-steering. UEs sit in the field
 * and the beam direction/width adjusts to the selected configuration.
 *
 * This is a simplified educational model — close enough to convey "what does
 * SE 1 / SE 11 / SE 14 actually do to the beam".
 */

export interface Ue {
  id: string;
  angleDeg: number; // -90 ~ +90
  distance: number; // arbitrary units (0..1)
  served?: boolean;
}

interface Props {
  numAntennas?: number;
  steerDeg?: number;
  nullDegs?: number[];
  ues?: Ue[];
  taperDb?: number; // amplitude taper magnitude in dB (0 = uniform)
  caption?: string;
}

function arrayResponse(N: number, dOverLambda: number, theta: number, steer: number, nulls: number[], taperDb: number) {
  // Uniform Linear Array gain pattern with simple null projection.
  // theta, steer in radians.
  let real = 0;
  let imag = 0;
  // amplitude taper
  const tapers: number[] = [];
  for (let n = 0; n < N; n++) {
    const x = (n - (N - 1) / 2) / Math.max(1, N - 1);
    const dB = -Math.abs(taperDb) * (x * x); // simple cos^2-like taper
    tapers.push(Math.pow(10, dB / 20));
  }
  for (let n = 0; n < N; n++) {
    const phase = 2 * Math.PI * dOverLambda * n * (Math.sin(theta) - Math.sin(steer));
    real += tapers[n] * Math.cos(phase);
    imag += tapers[n] * Math.sin(phase);
  }
  let gain = Math.sqrt(real * real + imag * imag) / N;

  // crude null carving
  for (const nu of nulls) {
    const diff = theta - nu;
    const notch = 1 - Math.exp(-(diff * diff) / 0.02);
    gain *= notch;
  }
  return gain;
}

export default function BeamView({
  numAntennas: initialN = 8,
  steerDeg: initialSteer = 15,
  nullDegs: initialNulls = [],
  ues = [
    { id: "UE-A", angleDeg: 15, distance: 0.7, served: true },
    { id: "UE-B", angleDeg: -30, distance: 0.6 },
    { id: "UE-C", angleDeg: 45, distance: 0.85 },
  ],
  taperDb: initialTaper = 0,
  caption,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(initialN);
  const [steer, setSteer] = useState(initialSteer);
  const [taper, setTaper] = useState(initialTaper);
  const [nullsCsv, setNullsCsv] = useState(initialNulls.join(","));
  const [w, setW] = useState(560);
  const h = 360;

  useEffect(() => {
    function resize() {
      const el = ref.current;
      if (!el) return;
      setW(Math.max(280, el.clientWidth));
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const cx = w / 2;
  const cy = h - 30;
  const radius = Math.min(w / 2, h) - 30;

  const nullsRad = nullsCsv
    .split(",")
    .map((s) => parseFloat(s))
    .filter((x) => !Number.isNaN(x))
    .map((deg) => (deg * Math.PI) / 180);

  // sample the pattern from -90° to +90°
  const samples = 181;
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const deg = -90 + (180 * i) / samples;
    const theta = (deg * Math.PI) / 180;
    const g = arrayResponse(n, 0.5, theta, (steer * Math.PI) / 180, nullsRad, taper);
    const r = g * radius;
    const x = cx + r * Math.sin(theta);
    const y = cy - r * Math.cos(theta);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return (
    <div className="border border-ink-200 dark:border-ink-700 rounded-lg p-4 bg-white dark:bg-ink-900" ref={ref}>
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="font-semibold">빔포밍 패턴 (탑뷰)</h4>
        <div className="text-xs text-ink-500 font-mono">
          N={n}, steer={steer}°, nulls=[{nullsCsv || "—"}]
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_220px] gap-4">
        <div>
          <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="auto" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="beam-grad" cx={cx} cy={cy} r={radius} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1e7ef0" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#1e7ef0" stopOpacity={0.05} />
              </radialGradient>
            </defs>
            {/* polar reference rings */}
            {[0.25, 0.5, 0.75, 1].map((f, i) => (
              <path
                key={i}
                d={`M ${cx - radius * f} ${cy} A ${radius * f} ${radius * f} 0 0 1 ${cx + radius * f} ${cy}`}
                stroke="#94a3b8"
                strokeOpacity={0.3}
                fill="none"
                strokeDasharray="2 3"
              />
            ))}
            {/* angle marks */}
            {[-60, -30, 0, 30, 60].map((deg) => {
              const theta = (deg * Math.PI) / 180;
              const x = cx + radius * Math.sin(theta);
              const y = cy - radius * Math.cos(theta);
              return (
                <g key={deg}>
                  <line x1={cx} y1={cy} x2={x} y2={y} stroke="#94a3b8" strokeOpacity={0.25} />
                  <text x={x} y={y - 4} fontSize={10} textAnchor="middle" fill="currentColor" className="text-ink-500">
                    {deg}°
                  </text>
                </g>
              );
            })}
            {/* beam polygon */}
            <polygon points={`${cx},${cy} ${pts.join(" ")}`} fill="url(#beam-grad)" stroke="#1e7ef0" strokeWidth={1.5} />
            {/* nulls */}
            {nullsRad.map((nu, i) => {
              const x = cx + radius * Math.sin(nu);
              const y = cy - radius * Math.cos(nu);
              return (
                <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#ef4444" strokeDasharray="4 3" />
              );
            })}
            {/* antenna array */}
            {Array.from({ length: n }).map((_, i) => {
              const spread = Math.min(120, n * 14);
              const ax = cx - spread / 2 + (i * spread) / Math.max(1, n - 1);
              return <rect key={i} x={ax - 4} y={cy - 4} width={8} height={8} fill="#0c4faa" />;
            })}
            {/* UEs */}
            {ues.map((ue) => {
              const theta = (ue.angleDeg * Math.PI) / 180;
              const r = ue.distance * radius;
              const x = cx + r * Math.sin(theta);
              const y = cy - r * Math.cos(theta);
              return (
                <g key={ue.id}>
                  <circle cx={x} cy={y} r={6} fill={ue.served ? "#10b981" : "#94a3b8"} stroke="white" strokeWidth={1.5} />
                  <text x={x + 8} y={y + 4} fontSize={11} fill="currentColor">{ue.id}</text>
                </g>
              );
            })}
            {/* origin label */}
            <text x={cx} y={cy + 18} fontSize={10} textAnchor="middle" fill="currentColor" className="text-ink-500">
              O-RU (antenna array)
            </text>
          </svg>
        </div>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-ink-500 text-xs">안테나 수 (N)</span>
            <input type="range" min={2} max={32} value={n} onChange={(e) => setN(+e.target.value)} className="w-full" />
            <span className="font-mono text-xs">{n}</span>
          </label>
          <label className="block">
            <span className="text-ink-500 text-xs">조향각 (steer)</span>
            <input type="range" min={-75} max={75} value={steer} onChange={(e) => setSteer(+e.target.value)} className="w-full" />
            <span className="font-mono text-xs">{steer}°</span>
          </label>
          <label className="block">
            <span className="text-ink-500 text-xs">테이퍼 (taper, dB)</span>
            <input type="range" min={0} max={20} value={taper} onChange={(e) => setTaper(+e.target.value)} className="w-full" />
            <span className="font-mono text-xs">{taper} dB</span>
          </label>
          <label className="block">
            <span className="text-ink-500 text-xs">널 (nulls, ° CSV)</span>
            <input
              type="text"
              placeholder="-30, 45"
              value={nullsCsv}
              onChange={(e) => setNullsCsv(e.target.value)}
              className="w-full text-xs font-mono border border-ink-200 dark:border-ink-700 rounded px-2 py-1 bg-white dark:bg-ink-800"
            />
          </label>
          <p className="text-[11px] leading-snug text-ink-500">
            SE 1 (weights) · SE 11 (flexible weights) — N과 steer로 빔 형태 결정.
            <br />SE 14 (nulling) — 특정 UE 방향에 null을 만들어 간섭 회피.
            <br />SE 8 (regularization) — taper와 유사한 부드러움 효과.
          </p>
        </div>
      </div>
      {caption ? <p className="text-xs text-ink-500 mt-3">{caption}</p> : null}
    </div>
  );
}
