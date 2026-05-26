import { useState } from "react";

/**
 * High-level O-RAN architecture diagram for the architecture overview page.
 *
 * Renders the canonical pipeline:
 *   SMO ─ M-plane ─┬─ O-DU ─┬─ FH ── O-RU ── ((( antennas ))) ── UE
 *                  │        ├─ C-plane (Section Types 0-11 + Section Extensions)
 *                  │        ├─ U-plane (IQ data)
 *                  │        └─ S-plane (PTP sync)
 *
 * Each lane and node is clickable to surface a description in the side panel.
 */

type Selection =
  | "smo"
  | "o-du"
  | "o-ru"
  | "ue"
  | "fh"
  | "c-plane"
  | "u-plane"
  | "s-plane"
  | "m-plane"
  | null;

const DESCRIPTIONS: Record<Exclude<Selection, null>, { title: string; body: string }> = {
  smo: {
    title: "SMO (Service Management & Orchestration)",
    body: "운영자가 망 전체를 관리하는 컨트롤 타워. NETCONF/HTTPS로 O-DU/O-RU에 설정을 내려보내고, 펌웨어 업데이트·KPI 모니터링·장애 관리를 합니다. 우리 사이트의 메시지(C/U/S)와는 별개의 '관리 평면'(M-plane).",
  },
  "o-du": {
    title: "O-DU (Open Distributed Unit)",
    body: "베이스밴드 두뇌. UE 스케줄링, MAC/RLC/PDCP, HARQ, 빔포밍 가중치 계산을 담당. C-plane 메시지는 모두 'O-DU 입장에서 송신/수신' 기준으로 표현됩니다. 즉 dataDirection=DL이면 O-DU가 보내는 방향.",
  },
  "o-ru": {
    title: "O-RU (Open Radio Unit)",
    body: "안테나·RF·일부 PHY 담당. C-plane으로 받은 스케줄에 따라 OTA로 송수신, 받은 IQ는 U-plane으로 O-DU에 다시 올림. 빔포밍을 '실제로 실행하는' 곳도 여기지만 '어떤 빔으로'는 O-DU가 결정.",
  },
  ue: {
    title: "UE (User Equipment)",
    body: "단말기 — 스마트폰, IoT, FWA CPE 등. Fronthaul 레벨에서 UE는 'ueId'라는 짧은 핸들로 추상화되어 등장합니다. ST 5/6/11 같은 UE 단위 메시지에서 자주 나옴.",
  },
  fh: {
    title: "Fronthaul Network",
    body: "O-DU↔O-RU 사이 전송망. 보통 광섬유 위의 이더넷. eCPRI 또는 IEEE 1914.3로 인캡슐화. 지연이 매우 짧아야 하므로(수십~수백 마이크로초) 우선순위·전송 윈도우가 스펙 4장에 정의되어 있음.",
  },
  "c-plane": {
    title: "C-Plane (Control Plane)",
    body: "이 사이트의 핵심. '어떤 자원을, 어떤 UE에게, 어떤 빔으로 쓰겠다'를 알리는 컨트롤 메시지. Section Type(0~11)과 Section Extension(1~30)으로 구성. O-DU에서 O-RU로 매 슬롯(혹은 그 이상 주기로) 흐름.",
  },
  "u-plane": {
    title: "U-Plane (User Plane)",
    body: "실제 IQ 샘플을 운반. C-plane이 '여기 PRB 4~11, 심볼 2~12, beamId 12로 보낸다'고 선언한 뒤, 같은 좌표를 가진 U-plane 메시지가 그 영역에 들어갈 데이터를 보냄. 다양한 압축(BFP, 변조 압축)을 적용 가능.",
  },
  "s-plane": {
    title: "S-Plane (Sync Plane)",
    body: "PTP(IEEE 1588)와 SyncE로 O-DU와 O-RU의 시계를 정렬. C-plane이 'slot 7, symbol 3'을 가리키려면 양쪽이 같은 시간 축을 보고 있어야 하므로 필수. 동기가 어긋나면 모든 자원 할당이 깨짐.",
  },
  "m-plane": {
    title: "M-Plane (Management Plane)",
    body: "운영자가 SMO에서 NETCONF over SSH/TLS로 O-RU/O-DU를 설정·모니터링. 우리가 다루는 C/U/S와 달리 실시간성 요구가 낮음. M-plane은 별도 스펙 문서(O-RAN.WG4.MP)에 정의됨.",
  },
};

export default function ArchitectureDiagram() {
  const [sel, setSel] = useState<Selection>("c-plane");
  const w = 880;
  const h = 380;

  const node = (
    id: Exclude<Selection, null>,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    label: string,
    fill: string,
    sub?: string
  ) => {
    const active = sel === id;
    return (
      <g onClick={() => setSel(id)} style={{ cursor: "pointer" }}>
        <rect
          x={cx - rx}
          y={cy - ry}
          width={rx * 2}
          height={ry * 2}
          rx={10}
          fill={fill}
          stroke={active ? "#1e7ef0" : "#0c4faa"}
          strokeWidth={active ? 3 : 1.5}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={14} fontWeight={700} fill="white">{label}</text>
        {sub ? (
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fill="white" opacity={0.85}>{sub}</text>
        ) : null}
      </g>
    );
  };

  const plane = (
    id: Exclude<Selection, null>,
    y: number,
    label: string,
    color: string,
    note: string
  ) => {
    const active = sel === id;
    return (
      <g onClick={() => setSel(id)} style={{ cursor: "pointer" }}>
        <line x1={250} y1={y} x2={560} y2={y} stroke={color} strokeWidth={active ? 5 : 3} markerEnd="url(#arr)" opacity={active ? 1 : 0.7} />
        <line x1={560} y1={y + 2} x2={250} y2={y + 2} stroke={color} strokeWidth={0} />
        <rect x={350} y={y - 14} width={140} height={28} rx={6} fill={color} opacity={active ? 1 : 0.85} />
        <text x={420} y={y + 4} textAnchor="middle" fontSize={12} fill="white" fontWeight={600}>{label}</text>
        <text x={760} y={y + 4} fontSize={11} fill="currentColor" className="text-ink-500">{note}</text>
      </g>
    );
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4 border border-ink-200 dark:border-ink-700 rounded-xl p-4 bg-white dark:bg-ink-900">
      <div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
          <defs>
            <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          {/* SMO on top */}
          {node("smo", 130, 50, 70, 26, "SMO", "#103a72", "OAM/Orchestration")}
          <line x1={130} y1={76} x2={130} y2={170} stroke="#94a3b8" strokeDasharray="4 4" />
          <text x={140} y={130} fontSize={11} className="cursor-pointer" onClick={() => setSel("m-plane")} fill="currentColor">M-plane (NETCONF)</text>

          {/* O-DU left, O-RU middle, UE right */}
          {node("o-du", 130, 220, 70, 40, "O-DU", "#0c4faa", "baseband / 스케줄러")}
          {node("o-ru", 480, 220, 80, 40, "O-RU", "#0c4faa", "RF / antennas")}
          {node("ue", 780, 220, 50, 30, "UE", "#10b981", "단말")}

          {/* Antennas */}
          <g>
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={560 + i * 9} y={210} width={6} height={20} fill="#0c4faa" />
            ))}
            <path d="M 600 210 Q 700 150 770 200" stroke="#1e7ef0" strokeWidth={1.5} fill="none" strokeDasharray="3 3" />
            <text x={665} y={170} fontSize={11} fill="currentColor">OTA</text>
          </g>

          {/* Planes between O-DU and O-RU */}
          {plane("c-plane", 300, "C-plane", "#1e7ef0", "Section Type 0~11 + SE 1~30 (이 사이트 본문)")}
          {plane("u-plane", 340, "U-plane", "#10b981", "IQ data (압축 가능)")}
          {plane("s-plane", 380, "S-plane", "#f59e0b", "PTP·SyncE — 시간 동기")}

          <text x={130} y={285} fontSize={11} fill="currentColor" className="text-ink-500" onClick={() => setSel("fh")} style={{ cursor: "pointer" }}>Fronthaul (eCPRI / 1914.3)</text>
        </svg>
      </div>
      <div>
        {sel ? (
          <div>
            <div className="text-xs font-mono text-ink-500 mb-1">선택됨</div>
            <h3 className="text-lg font-semibold mb-2">{DESCRIPTIONS[sel].title}</h3>
            <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-200">{DESCRIPTIONS[sel].body}</p>
          </div>
        ) : (
          <p className="text-sm text-ink-500">다이어그램의 박스나 화살표를 클릭하면 설명이 여기에 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}
