/**
 * Builders that produce per–Section-Type and per–Section-Extension input data
 * for the four visualization components.
 *
 * The goal is illustrative, not bit-accurate. Bit widths follow the spec where
 * known; otherwise typical defaults are used. Each scenario also picks a
 * plausible PRB layout and DU↔RU sequence so non-experts can grasp the role
 * of the section in context.
 *
 * Extending: add a new entry to BIT_LAYOUT_OVERRIDES or a new branch in
 * buildScenarioForSectionType / buildScenarioForExtension.
 */

import { SECTION_EXTENSIONS, SECTION_TYPES, getSectionExtensionMeta, getSectionTypeMeta } from "../data/curated";
import type { BitField } from "../components/viz/BitLayout";
import type { RbSection } from "../components/viz/RbGrid";
import type { SeqStep } from "../components/viz/MessageSequence";
import type { Ue } from "../components/viz/BeamView";

// ---------- Common C-Plane Section header (illustrative) ----------
const COMMON_HEADER: BitField[] = [
  { name: "dataDirection", bits: 1, description: "0=UL, 1=DL — DU가 송신인지 수신인지 지정" },
  { name: "payloadVersion", bits: 3, description: "C-Plane payload 버전 (기본 0b001)" },
  { name: "filterIndex", bits: 4, description: "PRACH·LTE 등 필터 종류" },
  { name: "frameId", bits: 8, description: "10ms 라디오 프레임 ID (0..255)" },
  { name: "subframeId", bits: 4, description: "1ms 서브프레임 (0..9)" },
  { name: "slotId", bits: 6, description: "누메롤로지에 따른 슬롯 인덱스" },
  { name: "startSymbolId", bits: 6, description: "이 메시지의 시작 OFDM 심볼" },
  { name: "numberOfsections", bits: 8, description: "이 메시지에 담긴 Section 개수" },
  { name: "sectionType", bits: 8, description: "Section Type 번호 (이 페이지의 핵심 식별자)" },
];

const SECTION_HEADER_COMMON: BitField[] = [
  { name: "sectionId", bits: 12, description: "이 Section의 고유 ID" },
  { name: "rb", bits: 1, description: "0=PRB는 모두 같이, 1=interleave" },
  { name: "symInc", bits: 1, description: "동일 PRB가 다음 심볼에도 이어지는지" },
  { name: "startPrbc", bits: 10, description: "이 Section의 시작 PRB" },
  { name: "numPrbc", bits: 8, description: "PRB 개수 (0 = 전체)" },
  { name: "reMask", bits: 12, description: "사용/미사용 Resource Element 마스크" },
  { name: "numSymbol", bits: 4, description: "심볼 길이" },
  { name: "ef", bits: 1, description: "Section Extension flag (1=뒤에 Extension 옴)" },
];

const BEAM_FIELDS: BitField[] = [
  { name: "beamId", bits: 15, description: "사전 정의된 빔 인덱스 (0..32767)" },
];

const UEID_FIELDS: BitField[] = [
  { name: "ueId", bits: 15, description: "UE 식별자 (RNTI 또는 내부 매핑)" },
];

// ---------- Per Section Type scenario ----------

export interface SectionTypeScenario {
  bitLayout: BitField[];
  bitCaption: string;
  rbSections: RbSection[];
  rbCaption: string;
  sequence: SeqStep[];
  beam: {
    N: number;
    steer: number;
    nulls: number[];
    taper: number;
    ues: Ue[];
  };
  beamCaption: string;
}

const FIVE_UES: Ue[] = [
  { id: "UE-A", angleDeg: 18, distance: 0.7, served: true },
  { id: "UE-B", angleDeg: -25, distance: 0.55 },
  { id: "UE-C", angleDeg: 50, distance: 0.85 },
  { id: "UE-D", angleDeg: -55, distance: 0.4 },
];

export function buildScenarioForSectionType(stId: number): SectionTypeScenario {
  const meta = getSectionTypeMeta(stId);
  if (!meta) throw new Error(`unknown section type ${stId}`);

  // Defaults shared by most section types
  let bitLayout: BitField[] = [...COMMON_HEADER, ...SECTION_HEADER_COMMON, ...BEAM_FIELDS];
  let bitCaption =
    "C-Plane 공통 헤더 + Section 헤더 + beamId의 기본형. 실제 비트 폭은 일부 필드에서 구현에 따라 달라질 수 있습니다.";
  let rbSections: RbSection[] = [
    {
      id: `ST${stId}-1`,
      label: `ST${stId} #1`,
      color: meta.color,
      symStart: 2,
      symLen: 10,
      prbStart: 4,
      prbLen: 12,
      meta: { dir: meta.direction },
    },
  ];
  let rbCaption = `${meta.name} 점유 예시 (단일 Section).`;
  let sequence: SeqStep[] = [
    {
      from: "O-DU",
      to: "O-RU",
      label: `C-Plane ST${stId}`,
      st: stId,
      note: `${meta.shortPurpose}`,
    },
  ];
  let beam = { N: 8, steer: 15, nulls: [] as number[], taper: 0, ues: FIVE_UES };
  let beamCaption = "(기본 ULA 모델) — 슬라이더로 자유롭게 조정해 보세요.";

  switch (stId) {
    case 0: {
      bitLayout = [...COMMON_HEADER, ...SECTION_HEADER_COMMON];
      bitCaption = "Section Type 0은 'unused' 표시 자체가 목적이라 beamId는 없습니다.";
      rbSections = [
        { id: "guard", label: "ST0 unused", color: meta.color, symStart: 0, symLen: 2, prbStart: 0, prbLen: 24 },
        { id: "guard2", label: "ST0 unused", color: meta.color, symStart: 12, symLen: 2, prbStart: 0, prbLen: 24 },
      ];
      rbCaption = "슬롯 양 끝의 심볼을 비워두는 보호 구간 예시. 색칠된 영역은 송수신 없음.";
      sequence = [
        { from: "O-DU", to: "O-RU", label: "C-Plane ST0 (unused)", st: 0, note: "O-RU에게 이 영역은 비워두라고 통지" },
      ];
      break;
    }
    case 1: {
      bitLayout = [...COMMON_HEADER, ...SECTION_HEADER_COMMON, ...BEAM_FIELDS];
      bitCaption = "ST1은 가장 일반적인 데이터 채널 스케줄링. beamId로 빔을 지정.";
      rbSections = [
        { id: "pdsch-A", label: "ST1 → UE-A", color: meta.color, symStart: 2, symLen: 10, prbStart: 0, prbLen: 8, meta: { ueId: "A", beamId: "12" } },
        { id: "pdsch-B", label: "ST1 → UE-B", color: "#10b981", symStart: 2, symLen: 10, prbStart: 8, prbLen: 8, meta: { ueId: "B", beamId: "21" } },
        { id: "pdsch-C", label: "ST1 → UE-C", color: "#f59e0b", symStart: 2, symLen: 10, prbStart: 16, prbLen: 8, meta: { ueId: "C", beamId: "30" } },
      ];
      rbCaption = "한 슬롯에 ST1으로 세 UE에게 서로 다른 PRB·빔으로 전송하는 시나리오.";
      sequence = [
        { from: "O-DU", to: "O-RU", label: "C-Plane ST1 (DL)", st: 1, ses: [1, 6], note: "DL 데이터 채널 스케줄. SE1=빔 가중치, SE6=비연속 PRB 매핑" },
        { from: "O-DU", to: "O-RU", label: "U-Plane IQ", st: 1, note: "스케줄에 맞춰 사용자 데이터(IQ) 송신" },
        { from: "O-RU", to: "UE", label: "OTA 다운링크", st: 1, note: "안테나로 무선 전송" },
      ];
      beam = { N: 16, steer: 18, nulls: [], taper: 6, ues: FIVE_UES };
      beamCaption = "ST1은 보통 SE1(weights) 또는 SE3(precoding)과 함께 사용됩니다.";
      break;
    }
    case 2: {
      bitLayout = [...COMMON_HEADER];
      bitCaption = "ST2는 reserved — 정의된 필드 없음.";
      rbSections = [];
      rbCaption = "예약된 Section Type이라 자원 점유 예시가 없습니다.";
      sequence = [];
      break;
    }
    case 3: {
      bitLayout = [
        ...COMMON_HEADER,
        ...SECTION_HEADER_COMMON,
        ...BEAM_FIELDS,
        { name: "freqOffset", bits: 24, description: "기준 누메롤로지에 대한 주파수 오프셋 (정수 서브캐리어)" },
      ];
      bitCaption = "ST3은 PRACH/혼합 누메롤로지를 다루기 위한 freqOffset 같은 추가 필드를 포함.";
      rbSections = [
        { id: "prach", label: "ST3 PRACH", color: meta.color, symStart: 0, symLen: 14, prbStart: 18, prbLen: 6 },
        { id: "data", label: "ST1 data", color: "#3b82f6", symStart: 2, symLen: 10, prbStart: 0, prbLen: 16 },
      ];
      rbCaption = "PRACH(ST3)와 일반 데이터(ST1)가 한 슬롯에서 공존하는 예.";
      sequence = [
        { from: "O-DU", to: "O-RU", label: "C-Plane ST3 (PRACH)", st: 3, ses: [10], note: "PRACH 위치/포맷을 설정" },
        { from: "UE", to: "O-RU", label: "PRACH preamble", st: 3, note: "초기 접속을 위한 무선 신호" },
        { from: "O-RU", to: "O-DU", label: "U-Plane PRACH IQ", st: 3, note: "감지한 PRACH IQ를 DU로 전달" },
      ];
      break;
    }
    case 4: {
      bitLayout = [
        ...COMMON_HEADER,
        { name: "cmdScope", bits: 4, description: "명령 적용 범위 (Cell/Carrier/etc)" },
        { name: "numberOfST4Cmds", bits: 8, description: "이 메시지에 담긴 ST4 명령 수" },
        { name: "cmdType", bits: 8, description: "TIME_OFFSET, ASM, DSS 등 명령 종류" },
        { name: "cmdParam", bits: 16, description: "명령별 파라미터" },
      ];
      bitCaption = "ST4는 슬롯 단위 운용 명령. cmdType에 따라 cmdParam의 해석이 달라집니다.";
      rbSections = [];
      rbCaption = "ST4는 자원 점유보다 컨트롤 명령에 가깝습니다.";
      sequence = [
        { from: "O-DU", to: "O-RU", label: "C-Plane ST4 (slot cmd)", st: 4, ses: [22], note: "SE22 또는 native ackNackReqId로 ACK 요청" },
        { from: "O-RU", to: "O-DU", label: "C-Plane ST8 (ACK/NACK)", st: 8, note: "명령 수신 확인 (ackId/nackId echo)" },
      ];
      break;
    }
    case 5: {
      bitLayout = [
        ...COMMON_HEADER,
        ...SECTION_HEADER_COMMON,
        ...BEAM_FIELDS,
        ...UEID_FIELDS,
      ];
      bitCaption = "ST5는 ueId를 함께 전달해 'UE 단위 스케줄' 의도를 명시합니다.";
      rbSections = [
        { id: "ue-A", label: "ST5 UE-A", color: meta.color, symStart: 2, symLen: 6, prbStart: 0, prbLen: 12, meta: { ueId: "A" } },
        { id: "ue-B", label: "ST5 UE-B", color: "#3b82f6", symStart: 8, symLen: 6, prbStart: 0, prbLen: 12, meta: { ueId: "B" } },
        { id: "ue-C", label: "ST5 UE-C", color: "#f59e0b", symStart: 2, symLen: 12, prbStart: 12, prbLen: 12, meta: { ueId: "C" } },
      ];
      rbCaption = "동일 슬롯 내 여러 UE에 대해 ueId별 Section을 띄운 예.";
      sequence = [
        { from: "O-DU", to: "O-RU", label: "C-Plane ST5 (ueId-BF)", st: 5, ses: [11, 14], note: "SE11 유연 가중치 + SE14 널링" },
        { from: "O-RU", to: "UE", label: "OTA — UE-A 빔", st: 5, note: "선택된 UE 방향으로 빔 송신" },
      ];
      beam = { N: 16, steer: 18, nulls: [-25], taper: 6, ues: FIVE_UES };
      beamCaption = "ST5 + SE14: UE-A 방향으로 빔, UE-B 방향에는 널(간섭 회피).";
      break;
    }
    case 6: {
      bitLayout = [
        ...COMMON_HEADER,
        { name: "numberOfUEs", bits: 8, description: "이 메시지에 담긴 UE 수" },
        { name: "ueId", bits: 15, description: "UE 식별자 (반복)" },
        { name: "ciCompHdr", bits: 8, description: "채널 정보 압축 헤더" },
        { name: "channelInfoBlocks", bits: 24, description: "압축된 채널 추정치 (가변 길이)" },
      ];
      bitCaption = "ST6는 압축된 채널 추정치를 여러 UE에 대해 운반.";
      rbSections = [
        { id: "ch-A", label: "ST6 ch-est UE-A", color: meta.color, symStart: 4, symLen: 2, prbStart: 0, prbLen: 24 },
        { id: "ch-B", label: "ST6 ch-est UE-B", color: "#10b981", symStart: 10, symLen: 2, prbStart: 0, prbLen: 24 },
      ];
      rbCaption = "DMRS 심볼 위치에서 추정한 채널 정보를 ST6으로 보고하는 예.";
      sequence = [
        { from: "O-RU", to: "O-DU", label: "C-Plane ST6 (ch-info)", st: 6, ses: [27, 28], note: "O-DU 지시로 차원/해상도 축소" },
        { from: "O-DU", to: "O-DU", label: "DU 내부: 빔 가중치 계산", st: 6, note: "수신한 채널로 다음 슬롯의 빔포밍 결정" },
      ];
      break;
    }
    case 7: {
      bitLayout = [
        ...COMMON_HEADER,
        { name: "laaMsgType", bits: 8, description: "LBT_DL_REQ, LBT_DL_RSP 등" },
        { name: "lbtCwConfig", bits: 16, description: "Contention Window 설정" },
        { name: "lbtOffset", bits: 16, description: "송신 시작 오프셋" },
      ];
      bitCaption = "ST7은 비면허 LBT(Listen-Before-Talk) 협의 메시지.";
      rbSections = [
        { id: "lbt-gap", label: "ST7 LBT gap", color: meta.color, symStart: 0, symLen: 1, prbStart: 0, prbLen: 24 },
        { id: "data", label: "ST1 data", color: "#3b82f6", symStart: 1, symLen: 13, prbStart: 0, prbLen: 24 },
      ];
      rbCaption = "LBT 결과를 기다린 뒤 ST1 데이터 송신을 시작.";
      sequence = [
        { from: "O-DU", to: "O-RU", label: "ST7 LBT_DL_REQ", st: 7, note: "LBT 시도 요청" },
        { from: "O-RU", to: "O-DU", label: "ST7 LBT_DL_RSP", st: 7, note: "감지 결과 회신" },
        { from: "O-DU", to: "O-RU", label: "ST1 data", st: 1, note: "성공 시 데이터 송신" },
      ];
      break;
    }
    case 8: {
      bitLayout = [
        ...COMMON_HEADER,
        { name: "ackNack", bits: 1, description: "ACK(1) / NACK(0). 정확한 인코딩은 스펙 7.4.10 Table 7.4.10-1 참조" },
        { name: "reasonCode", bits: 7, description: "NACK 시 사유 코드 (구현마다 다름)" },
      ];
      bitCaption = "ST8은 O-RU → O-DU 방향 ACK/NACK 응답. 위 비트 레이아웃은 단순화된 예시이며 정확한 필드는 스펙 7.4.10 Table 7.4.10-1을 따르세요.";
      rbSections = [];
      rbCaption = "ST8은 자원 점유와 무관한 컨트롤 응답.";
      sequence = [
        { from: "O-DU", to: "O-RU", label: "ST4 cmd", st: 4, ses: [22], note: "ACK 요청 포함" },
        { from: "O-RU", to: "O-DU", label: "ST8 ACK/NACK", st: 8, note: "명령 수신·적용 결과" },
      ];
      break;
    }
    case 9: {
      bitLayout = [
        ...COMMON_HEADER,
        { name: "(U-plane 공유 헤더)", bits: 16, description: "ST 9는 U-Plane 메시지와 동일한 Section 헤더 구조를 공유" },
        { name: "sinrValues", bits: 16, description: "post-equalization SINR 값 (다중값 또는 단일값 모드). 인코딩은 스펙 7.4.11 참조" },
      ];
      bitCaption = "ST9는 등화 후 SINR 보고. 정확한 필드는 스펙 7.4.11 Table 7.4.11-1/2 참조 — 위는 시각적 단순화 예시.";
      rbSections = [
        { id: "sinr-report", label: "ST9 SINR 보고 (PRB별)", color: meta.color, symStart: 0, symLen: 14, prbStart: 0, prbLen: 24 },
      ];
      rbCaption = "PRB(또는 PRB 그룹)별로 SINR 값을 보고. SE 28로 주파수 해상도 줄이기 가능.";
      sequence = [
        { from: "UE", to: "O-RU", label: "PUSCH UL", note: "사용자 데이터 송신" },
        { from: "O-RU", to: "O-RU", label: "등화 + SINR 측정", note: "DMRS-BF-EQ 처리 후 post-eq SINR 계산" },
        { from: "O-RU", to: "O-DU", label: "ST9 SINR 보고", st: 9, ses: [27, 28], note: "주파수 해상도/차원 축소 가능" },
      ];
      break;
    }
    case 10: {
      bitLayout = [
        ...COMMON_HEADER,
        { name: "measurementType", bits: 8, description: "어떤 RRM 측정의 결과인지 (예: IpN). 정확한 인코딩은 스펙 7.4.12 Table 7.4.12-1 참조" },
        { name: "measurementValues", bits: 32, description: "측정 결과 (가변 길이; 측정 종류에 따라 다름)" },
      ];
      bitCaption = "ST10은 RRM 측정 결과 보고. dataDirection=0 (uplink). 정확한 필드는 스펙 7.4.12 Table 7.4.12-1.";
      rbSections = [
        { id: "ipn-region", label: "ST10 측정 영역 (예: 미할당 PRB)", color: meta.color, symStart: 0, symLen: 14, prbStart: 16, prbLen: 8 },
        { id: "data", label: "할당된 자원 (ST1)", color: "#3b82f6", symStart: 2, symLen: 10, prbStart: 0, prbLen: 16 },
      ];
      rbCaption = "할당되지 않은 PRB 영역에서 IpN 같은 측정치를 RU가 측정해 보고하는 시나리오.";
      sequence = [
        { from: "O-DU", to: "O-RU", label: "ST11 측정 요청", st: 11, note: "예: 미할당 PRB의 IpN" },
        { from: "O-RU", to: "O-RU", label: "RRM 측정 수행", note: "백그라운드 간섭/잡음 계측" },
        { from: "O-RU", to: "O-DU", label: "ST10 측정 보고", st: 10, note: "스케줄러 입력" },
      ];
      break;
    }
    case 11: {
      bitLayout = [
        ...COMMON_HEADER,
        { name: "measurementRequestType", bits: 8, description: "어떤 RRM 측정을 요청하는지. 예: 미할당 PRB의 IpN. 정확한 인코딩은 스펙 7.4.13 Table 7.4.13-1" },
        { name: "targetPrbRange", bits: 16, description: "측정 대상 PRB 범위" },
      ];
      bitCaption = "ST11은 O-DU가 O-RU에 보내는 RRM 측정 요청. dataDirection=0. 정확한 필드는 스펙 7.4.13 Table 7.4.13-1.";
      rbSections = [
        { id: "target", label: "ST11 측정 대상 PRB", color: meta.color, symStart: 0, symLen: 14, prbStart: 16, prbLen: 8 },
      ];
      rbCaption = "O-DU가 표시한 측정 대상 자원 영역. RU가 이 영역의 IpN 등을 측정.";
      sequence = [
        { from: "O-DU", to: "O-RU", label: "ST11 측정 요청", st: 11, note: "예: 미할당 PRB IpN" },
        { from: "O-RU", to: "O-DU", label: "ST10 측정 결과", st: 10, note: "응답" },
      ];
      break;
    }
  }

  return {
    bitLayout,
    bitCaption,
    rbSections,
    rbCaption,
    sequence,
    beam,
    beamCaption,
  };
}

// ---------- Per Section Extension scenario ----------

export interface ExtensionScenario {
  bitLayout: BitField[];
  bitCaption: string;
  rbSections: RbSection[];
  rbCaption: string;
  beam: SectionTypeScenario["beam"];
  beamCaption: string;
  sequence: SeqStep[];
}

export function buildScenarioForExtension(seId: number): ExtensionScenario {
  const meta = getSectionExtensionMeta(seId);
  if (!meta) throw new Error(`unknown extension ${seId}`);

  // Default bit layout: extension header + a couple payload fields
  const header: BitField[] = [
    { name: "extType", bits: 7, description: `Section Extension 번호 (= ${seId})` },
    { name: "ef", bits: 1, description: "뒤에 또 다른 Extension이 오면 1" },
    { name: "extLen", bits: 8, description: "Extension 길이 (octets)" },
  ];

  let payload: BitField[] = [
    { name: "payload", bits: 16, description: "Extension 별 페이로드" },
  ];
  let bitCaption = `${meta.shortPurpose}`;
  let rbSections: RbSection[] = [
    { id: `host-ST`, label: "Host Section", color: "#94a3b8", symStart: 2, symLen: 10, prbStart: 4, prbLen: 16 },
    { id: `se-${seId}`, label: `SE${seId} 영향`, color: meta.color, symStart: 2, symLen: 10, prbStart: 4, prbLen: 16 },
  ];
  let rbCaption = "Host Section의 자원에 이 Extension이 적용되는 위치를 강조했습니다.";
  let beam = { N: 8, steer: 0, nulls: [] as number[], taper: 0, ues: FIVE_UES };
  let beamCaption = "기본 빔 (Extension이 빔에 직접 영향 없을 때).";
  let sequence: SeqStep[] = [
    { from: "O-DU", to: "O-RU", label: `Host Section + SE${seId}`, ses: [seId], note: meta.intent },
  ];

  switch (seId) {
    case 1: {
      payload = [
        { name: "bfwCompHdr", bits: 8, description: "가중치 압축 헤더 (bitwidth/method)" },
        { name: "numBfw", bits: 8, description: "포함된 가중치 수 (= 안테나/포트 수)" },
        { name: "bfwI", bits: 12, description: "가중치 실수부 (반복)" },
        { name: "bfwQ", bits: 12, description: "가중치 허수부 (반복)" },
      ];
      beam = { N: 16, steer: 25, nulls: [], taper: 8, ues: FIVE_UES };
      beamCaption = "SE1로 가중치를 내려 보낸 직후의 빔. N=16, steer=25°.";
      break;
    }
    case 2: {
      payload = [
        { name: "bfAzPtWidth", bits: 3, description: "방위각 포인팅 정밀도" },
        { name: "bfZePtWidth", bits: 3, description: "앙각 포인팅 정밀도" },
        { name: "bfAz3ddWidth", bits: 3, description: "방위각 3dB 폭" },
        { name: "bfZe3ddWidth", bits: 3, description: "앙각 3dB 폭" },
        { name: "bfAzPt", bits: 16, description: "방위각 (스케일된 정수)" },
        { name: "bfZePt", bits: 16, description: "앙각" },
      ];
      beam = { N: 16, steer: 30, nulls: [], taper: 4, ues: FIVE_UES };
      beamCaption = "SE2의 azPt/zePt가 빔의 조향 방향을 정의.";
      break;
    }
    case 6: {
      payload = [
        { name: "rbgSize", bits: 4, description: "비트맵 한 비트가 표현하는 RBG 크기" },
        { name: "rbgMask", bits: 28, description: "사용 RBG 비트맵" },
        { name: "priority", bits: 2, description: "우선순위" },
        { name: "symbolMask", bits: 14, description: "각 심볼별 사용 여부" },
      ];
      rbSections = [
        { id: "use-A", label: "SE6 RBG #1", color: meta.color, symStart: 2, symLen: 10, prbStart: 0, prbLen: 4 },
        { id: "use-B", label: "SE6 RBG #3", color: meta.color, symStart: 2, symLen: 10, prbStart: 8, prbLen: 4 },
        { id: "use-C", label: "SE6 RBG #5", color: meta.color, symStart: 2, symLen: 10, prbStart: 16, prbLen: 4 },
      ];
      rbCaption = "SE6 비트맵으로 비연속 PRB(짝수 RBG만) 점유.";
      break;
    }
    case 9: {
      rbSections = [
        { id: "nr", label: "NR (active)", color: meta.color, symStart: 0, symLen: 14, prbStart: 0, prbLen: 18 },
        { id: "lte", label: "LTE 보호", color: "#ef4444", symStart: 0, symLen: 14, prbStart: 18, prbLen: 6 },
      ];
      rbCaption = "DSS — 같은 대역에서 NR과 LTE가 시간·주파수를 나눠 쓰기.";
      break;
    }
    case 11: {
      payload = [
        { name: "extendedNumBundPrb", bits: 8, description: "묶음 PRB 수 (확장형)" },
        { name: "bfwCompHdr", bits: 8, description: "가중치 압축 헤더" },
        { name: "numBundPrb", bits: 8, description: "묶음 안의 PRB 수" },
        { name: "bfwI", bits: 12, description: "가중치 실수부 (반복)" },
        { name: "bfwQ", bits: 12, description: "가중치 허수부 (반복)" },
      ];
      beam = { N: 32, steer: 20, nulls: [], taper: 10, ues: FIVE_UES };
      beamCaption = "SE11은 큰 어레이용 가변 길이 가중치. N=32 예시.";
      break;
    }
    case 14: {
      payload = [
        { name: "nullLayerInd", bits: 4, description: "널을 만들 레이어 인덱스" },
        { name: "antPortBitmap", bits: 16, description: "사용 안테나 포트" },
      ];
      beam = { N: 16, steer: 18, nulls: [-30, 45], taper: 6, ues: FIVE_UES };
      beamCaption = "SE14: 두 개의 간섭 UE 방향에 널을 형성.";
      break;
    }
    case 22: {
      payload = [
        { name: "ackNackReqId", bits: 16, description: "응답에 사용할 식별자" },
      ];
      sequence = [
        { from: "O-DU", to: "O-RU", label: "Host (ST4) + SE22", st: 4, ses: [22], note: "응답 요청을 동봉" },
        { from: "O-RU", to: "O-DU", label: "ST8 ACK/NACK", st: 8, note: "동일한 ackNackReqId가 ackId/nackId로 echo" },
      ];
      break;
    }
  }

  return {
    bitLayout: [...header, ...payload],
    bitCaption,
    rbSections,
    rbCaption,
    beam,
    beamCaption,
    sequence,
  };
}
