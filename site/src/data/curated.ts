/**
 * Curated, human-friendly metadata for Section Types and Section Extensions.
 * The raw spec text comes from extract.py; this file adds:
 *   - friendly subtitle and one-line "what it's for"
 *   - direction (DL / UL / both / control)
 *   - color (used by visualizations to keep types visually distinct)
 *   - tags
 *   - intent: a 2-3 sentence explanation aimed at a non-specialist
 *
 * To extend: add a new Section Type or Section Extension entry. The site reads
 * this file plus the raw JSON to build the catalog.
 */

export type Direction = "DL" | "UL" | "DL/UL" | "Control" | "Mixed";

export interface SectionTypeMeta {
  id: number;
  name: string;
  subtitle: string;
  shortPurpose: string;
  intent: string;
  direction: Direction;
  color: string;
  tags: string[];
  applicableExtensions?: number[];
  uPlaneRelated: boolean;
}

export interface SectionExtensionMeta {
  id: number;
  name: string;
  shortPurpose: string;
  intent: string;
  color: string;
  tags: string[];
  affects: Array<
    | "beamforming"
    | "compression"
    | "prb-allocation"
    | "ueId"
    | "antenna"
    | "timing"
    | "control"
    | "feedback"
    | "puncturing"
    | "frequency"
  >;
  appliesToSectionTypes: number[];
}

export const SECTION_TYPES: SectionTypeMeta[] = [
  {
    id: 0,
    name: "Unused Resource Blocks or symbols",
    subtitle: "유휴 자원 표시",
    shortPurpose: "O-RU가 송수신 없이 비울 자원(RB/심볼)을 알려주는 컨트롤",
    intent:
      "O-DU가 O-RU에게 '이 시간·주파수 자원은 비워두라'고 지시합니다. 전파 발사도, 수신도 없으니 RU는 전력을 아끼거나 다른 작업으로 돌릴 수 있습니다. 채널 점유 회피, LBT 등 비-라디오 구간을 표현하는 데 쓰입니다.",
    direction: "Control",
    color: "#9ca3af",
    tags: ["idle", "no-tx", "power-save"],
    applicableExtensions: [],
    uPlaneRelated: false,
  },
  {
    id: 1,
    name: "Most DL/UL radio channels",
    subtitle: "PDSCH/PUSCH 등 일반 채널 스케줄링",
    shortPurpose: "가장 흔히 쓰이는 일반 DL/UL 채널 스케줄링 + 빔 지정 (PRACH/혼합 누메롤로지 제외)",
    intent:
      "Section Type 1은 'most DL/UL radio channels'에 사용됩니다 — 즉 PRACH나 누메롤로지가 섞인 경우 외 거의 모든 데이터 채널 스케줄링이 이 타입을 통과합니다. 어떤 PRB·심볼 좌표를, 어떤 빔(beamId)으로 사용할지를 지정합니다. ST 1을 PRACH 채널에 쓸 수도 있는데, 그 경우 O-RU는 일반 채널과 동일하게 처리합니다 (스펙 7.4.3 명시).",
    direction: "DL/UL",
    color: "#3b82f6",
    tags: ["pdsch", "pusch", "beamforming", "main-flow"],
    applicableExtensions: [
      1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 19, 20, 23,
    ],
    uPlaneRelated: true,
  },
  {
    id: 2,
    name: "Reserved",
    subtitle: "향후 사용을 위해 예약됨",
    shortPurpose: "스펙상 예약된 번호 — 현재 정의된 동작 없음",
    intent:
      "O-RAN WG4 스펙에서 향후 확장을 위해 비워둔 번호입니다. 현재 구현/사용되지 않습니다.",
    direction: "Control",
    color: "#d4d4d8",
    tags: ["reserved"],
    applicableExtensions: [],
    uPlaneRelated: false,
  },
  {
    id: 3,
    name: "PRACH and mixed-numerology channels",
    subtitle: "PRACH·혼합 누메롤로지 전용",
    shortPurpose: "랜덤액세스(PRACH)나 누메롤로지가 섞인 채널을 위한 별도 스케줄",
    intent:
      "UE가 처음 접속할 때(PRACH) 쓰는 신호처럼 일반 데이터 채널과 다른 시간/주파수 그리드를 갖는 신호용 Section Type입니다. 누메롤로지(서브캐리어 간격)가 다른 자원들을 한 번에 표현해야 할 때도 사용합니다.",
    direction: "DL/UL",
    color: "#8b5cf6",
    tags: ["prach", "mixed-numerology", "initial-access"],
    applicableExtensions: [1, 2, 6, 10, 11, 12, 13, 14, 19],
    uPlaneRelated: true,
  },
  {
    id: 4,
    name: "Slot Configuration Control",
    subtitle: "슬롯 단위 설정 명령",
    shortPurpose: "스펙트럼 공유, LAA 등 슬롯 단위 운용 명령을 전달",
    intent:
      "특정 슬롯에 대해 O-RU의 동작을 바꿔야 할 때 사용합니다. 예: 비면허 대역 LBT 결과 반영, DSS 자원 재할당, ACK/NACK 피드백이 필요한 명령 등. U-Plane 데이터를 직접 운반하지는 않고 운용 제어용입니다.",
    direction: "Control",
    color: "#f59e0b",
    tags: ["lbt", "dss", "slot-config", "ack-nack"],
    applicableExtensions: [22],
    uPlaneRelated: false,
  },
  {
    id: 5,
    name: "UE scheduling information",
    subtitle: "ueId 단위 스케줄링 정보",
    shortPurpose: "어떤 UE를 어떤 자원·빔으로 서빙하는지 명시",
    intent:
      "UE 식별자(ueId)를 함께 실어서, '이 자원은 이 단말의 것'이라고 명시합니다. UE 기반 빔포밍(예: SE 11, SE 14 등)이나 MU-MIMO 스케줄링과 짝을 이루어 사용됩니다.",
    direction: "DL/UL",
    color: "#10b981",
    tags: ["ueId", "mu-mimo", "scheduling"],
    applicableExtensions: [
      1, 2, 3, 5, 6, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21,
    ],
    uPlaneRelated: true,
  },
  {
    id: 6,
    name: "Channel information",
    subtitle: "UE 채널 정보 전달",
    shortPurpose: "O-DU↔O-RU 사이 UE의 채널 추정 결과를 운반",
    intent:
      "UE의 무선 채널 상태(채널 추정치)를 한쪽이 다른 쪽으로 알려주는 데 사용합니다. 빔 형성 가중치 계산, MU-MIMO 사용자 페어링 등 'O-DU가 똑똑하게 결정'하기 위한 입력입니다.",
    direction: "UL",
    color: "#06b6d4",
    tags: ["channel-estimation", "ueId", "feedback"],
    applicableExtensions: [10, 14, 15, 16, 17, 21, 27, 28],
    uPlaneRelated: true,
  },
  {
    id: 7,
    name: "LAA",
    subtitle: "Licensed Assisted Access",
    shortPurpose: "비면허 대역(LAA)에서의 LBT 결과·송신 윈도우 제어",
    intent:
      "5GHz/6GHz 같은 비면허 대역에서는 송신 전에 채널이 비어 있는지 확인(LBT)해야 합니다. Section Type 7은 LAA 동작을 지원하기 위한 메시지로, LBT 관련 정보를 O-DU↔O-RU 간에 주고받는 데 사용됩니다.",
    direction: "Control",
    color: "#ef4444",
    tags: ["laa", "lbt", "unlicensed"],
    applicableExtensions: [],
    uPlaneRelated: false,
  },
  {
    id: 8,
    name: "ACK/NACK feedback",
    subtitle: "O-RU → O-DU 확인 응답",
    shortPurpose: "이전에 받은 컨트롤 명령에 대해 O-RU가 ACK/NACK를 보내는 메시지",
    intent:
      "Section Type 8은 O-RU가 O-DU에게 ACK/NACK feedback을 보내는 데 사용됩니다. 특정 컨트롤 메시지에 대해 RU가 잘 받아 적용했는지(또는 거부했는지) 확인이 필요한 경우 짝을 이루어 동작합니다.",
    direction: "Control",
    color: "#84cc16",
    tags: ["ack", "nack", "feedback", "o-ru-to-o-du"],
    applicableExtensions: [22],
    uPlaneRelated: false,
  },
  {
    id: 9,
    name: "Post-equalization SINR",
    subtitle: "DMRS-BF-EQ 용 SINR 보고",
    shortPurpose: "O-RU가 추정한 등화 후 SINR을 O-DU로 보고 (DMRS-BF-EQ 전용)",
    intent:
      "Section Type 9는 O-RU가 등화(equalization) 후 측정한 SINR(signal-to-interference-plus-noise ratio)을 O-DU로 보고하는 데 사용됩니다. DMRS 기반 빔포밍 + 등화(DMRS-BF-EQ)에 적용되며, U-Plane 메시지와 동일한 Section 헤더 구조를 공유합니다. CP-OFDM, DFT-s-OFDM 모두 지원합니다.",
    direction: "UL",
    color: "#0ea5e9",
    tags: ["sinr", "dmrs-bf", "feedback", "o-ru-to-o-du"],
    applicableExtensions: [27, 28],
    uPlaneRelated: true,
  },
  {
    id: 10,
    name: "RRM measurement report",
    subtitle: "RRM 측정 결과 보고",
    shortPurpose: "O-RU가 무선자원관리(RRM) 측정 결과를 O-DU로 보고",
    intent:
      "Section Type 10은 O-RU가 수행한 RRM(Radio Resource Management) 측정 결과를 O-DU로 보고하는 데 사용됩니다. dataDirection은 항상 UL(0). 셀의 자원 상태·간섭 수준 등을 DU가 파악할 수 있게 합니다.",
    direction: "UL",
    color: "#a855f7",
    tags: ["rrm", "measurement", "report", "o-ru-to-o-du"],
    applicableExtensions: [],
    uPlaneRelated: false,
  },
  {
    id: 11,
    name: "RRM measurement request",
    subtitle: "RRM 측정 요청",
    shortPurpose: "O-DU가 O-RU에 RRM 측정을 요청 (예: 미할당 PRB의 IpN)",
    intent:
      "Section Type 11은 O-DU가 O-RU에 RRM 측정을 요청하는 데 사용됩니다. 대표적으로 미할당 PRB에 대한 IpN(Interference plus Noise) 측정 요청을 지원합니다. dataDirection은 UL(0)로 설정. ST 10이 응답에 해당합니다.",
    direction: "UL",
    color: "#ec4899",
    tags: ["rrm", "measurement", "request", "o-du-to-o-ru", "ipn"],
    applicableExtensions: [],
    uPlaneRelated: false,
  },
];

export const SECTION_EXTENSIONS: SectionExtensionMeta[] = [
  {
    id: 1,
    name: "Beamforming weights",
    shortPurpose: "실시간 빔포밍 가중치 직접 전달",
    intent:
      "사전 정의된 beamId 테이블을 쓰지 않고, O-DU가 직접 안테나별 빔 가중치(복소수 W)를 실어 O-RU에 내려보냅니다. 디지털 빔포밍에서 가장 핵심적인 확장 중 하나입니다.",
    color: "#0ea5e9",
    tags: ["beamforming", "weights", "complex"],
    affects: ["beamforming", "antenna"],
    appliesToSectionTypes: [1, 3, 5, 6],
  },
  {
    id: 2,
    name: "Beamforming attributes",
    shortPurpose: "빔의 방향·폭 등 속성 메타데이터",
    intent:
      "빔의 방위각/앙각/반치폭 같은 물리적 속성을 메타로 전달합니다. 가중치 자체보다는 빔 관리(추적·갱신)에 활용됩니다.",
    color: "#22d3ee",
    tags: ["beamforming", "metadata", "tracking"],
    affects: ["beamforming", "antenna"],
    appliesToSectionTypes: [1, 3, 5, 8],
  },
  {
    id: 3,
    name: "DL precoding parameters",
    shortPurpose: "DL 프리코딩 파라미터",
    intent:
      "DL 송신을 위한 프리코딩(레이어→안테나 포트 변환) 파라미터를 전달합니다. MIMO 레이어 수, 프리코더 인덱스 등이 포함됩니다.",
    color: "#3b82f6",
    tags: ["precoding", "mimo", "dl"],
    affects: ["beamforming"],
    appliesToSectionTypes: [1, 5],
  },
  {
    id: 4,
    name: "Modulation compression parameters",
    shortPurpose: "변조 압축 파라미터",
    intent:
      "프론트홀 대역폭을 줄이기 위해 변조 차원에서 IQ를 압축할 때 쓰는 파라미터입니다. 압축 알고리즘, 비트수 등을 지정합니다.",
    color: "#6366f1",
    tags: ["compression", "modulation", "iq"],
    affects: ["compression"],
    appliesToSectionTypes: [1],
  },
  {
    id: 5,
    name: "Modulation compression additional parameters",
    shortPurpose: "변조 압축 부가 파라미터",
    intent:
      "SE 4를 보완하는 부가 파라미터(스케일·바이어스 등)를 전달합니다.",
    color: "#7c3aed",
    tags: ["compression", "iq"],
    affects: ["compression"],
    appliesToSectionTypes: [1, 5],
  },
  {
    id: 6,
    name: "Non-contiguous PRB allocation (time/freq)",
    shortPurpose: "불연속 PRB 할당",
    intent:
      "PRB가 연속되지 않을 때(예: 인터리브 할당) 비트맵 형태로 사용 PRB를 명시합니다. 작은 RB 단위로 자원을 잘게 쓰는 시나리오에 필수입니다.",
    color: "#8b5cf6",
    tags: ["prb", "non-contiguous", "bitmap"],
    affects: ["prb-allocation", "frequency"],
    appliesToSectionTypes: [1, 3, 5],
  },
  {
    id: 7,
    name: "eAxC mask",
    shortPurpose: "eAxC 비트마스크",
    intent:
      "특정 안테나-캐리어 인스턴스(eAxC)에 동일한 Section을 적용하기 위한 마스크입니다. 다수 eAxC에 한 번에 명령을 보낼 때 효율적입니다.",
    color: "#a855f7",
    tags: ["eaxc", "antenna", "mask"],
    affects: ["antenna"],
    appliesToSectionTypes: [1],
  },
  {
    id: 8,
    name: "Regularization factor",
    shortPurpose: "정규화 계수",
    intent:
      "채널 역행렬 기반 프리코더(MMSE 등)에서 사용하는 정규화 계수를 전달합니다.",
    color: "#c084fc",
    tags: ["mmse", "precoding", "regularization"],
    affects: ["beamforming"],
    appliesToSectionTypes: [1],
  },
  {
    id: 9,
    name: "DSS parameters",
    shortPurpose: "동적 스펙트럼 공유",
    intent:
      "LTE↔NR 동적 스펙트럼 공유(DSS)에서 필요한 자원 회피·표시 정보를 전달합니다.",
    color: "#d946ef",
    tags: ["dss", "lte-nr"],
    affects: ["frequency"],
    appliesToSectionTypes: [1, 4],
  },
  {
    id: 10,
    name: "Group configuration of multiple ports",
    shortPurpose: "다중 포트 그룹 설정",
    intent:
      "여러 안테나 포트를 그룹으로 묶어 일괄 설정합니다. 채널 정보(ST 6)·일반 데이터(ST 1) 등과 짝을 이룹니다.",
    color: "#ec4899",
    tags: ["antenna", "ports", "group"],
    affects: ["antenna"],
    appliesToSectionTypes: [1, 3, 5, 6],
  },
  {
    id: 11,
    name: "Flexible beamforming weights",
    shortPurpose: "유연한 빔포밍 가중치",
    intent:
      "SE 1의 확장형으로, 가중치 길이/포맷을 더 유연하게 표현합니다. 큰 안테나 어레이에 유리합니다.",
    color: "#f43f5e",
    tags: ["beamforming", "flexible", "weights"],
    affects: ["beamforming", "antenna"],
    appliesToSectionTypes: [1, 3, 5, 8],
  },
  {
    id: 12,
    name: "Non-contiguous PRB with frequency ranges",
    shortPurpose: "주파수 범위형 불연속 PRB",
    intent:
      "SE 6과 달리 비트맵 대신 (시작 PRB, 길이) 범위 묶음으로 비연속 PRB를 표현합니다.",
    color: "#fb7185",
    tags: ["prb", "non-contiguous", "range"],
    affects: ["prb-allocation"],
    appliesToSectionTypes: [1, 3, 5],
  },
  {
    id: 13,
    name: "PRB allocation with frequency hopping",
    shortPurpose: "주파수 호핑",
    intent:
      "주파수 호핑(시간에 따라 PRB가 점프) 패턴을 표현합니다. PUSCH 호핑 등에 사용.",
    color: "#fb923c",
    tags: ["hopping", "prb"],
    affects: ["prb-allocation", "frequency"],
    appliesToSectionTypes: [1, 3],
  },
  {
    id: 14,
    name: "Nulling layer info (ueId-BF)",
    shortPurpose: "널링 레이어 정보 (ueId 기반)",
    intent:
      "UE 기반 빔포밍에서 간섭 UE를 향해 널(zero)을 만들기 위한 레이어 정보를 전달합니다. 이름에 명시되어 있듯 ueId 기반 빔포밍이 적용되는 ST와 짝을 이룹니다.",
    color: "#f59e0b",
    tags: ["nulling", "interference", "ueId"],
    affects: ["beamforming", "ueId"],
    appliesToSectionTypes: [5],
  },
  {
    id: 15,
    name: "Mixed numerology info (ueId-BF)",
    shortPurpose: "혼합 누메롤로지 정보",
    intent:
      "한 UE의 자원이 서로 다른 누메롤로지에 걸칠 때 필요한 부가 정보를 전달합니다.",
    color: "#eab308",
    tags: ["numerology", "ueId"],
    affects: ["frequency", "ueId"],
    appliesToSectionTypes: [1, 5],
  },
  {
    id: 16,
    name: "Antenna mapping (UE-CH UL BF)",
    shortPurpose: "안테나 매핑",
    intent:
      "UE 채널 정보 기반 UL 빔포밍에서 사용하는 안테나-포트 매핑 표를 실어 보냅니다.",
    color: "#a3e635",
    tags: ["antenna", "ueId", "ul"],
    affects: ["antenna", "ueId"],
    appliesToSectionTypes: [1, 5, 6],
  },
  {
    id: 17,
    name: "User port group indication",
    shortPurpose: "유저 포트 그룹 표시",
    intent:
      "동일 그룹에 속하는 유저 포트들을 표시해 후속 처리(공동 프리코딩 등)에 사용합니다.",
    color: "#22c55e",
    tags: ["ports", "group", "ueId"],
    affects: ["ueId"],
    appliesToSectionTypes: [1, 5],
  },
  {
    id: 18,
    name: "Uplink transmission management",
    shortPurpose: "UL 송신 관리",
    intent:
      "UE의 UL 송신을 RU 레벨에서 관리하기 위한 보조 정보(예: TA 보정, 윈도우 조정 등)를 전달합니다.",
    color: "#10b981",
    tags: ["ul", "management"],
    affects: ["timing", "control"],
    appliesToSectionTypes: [1, 5],
  },
  {
    id: 19,
    name: "Compact beamforming (multi-port)",
    shortPurpose: "콤팩트 다중 포트 빔포밍",
    intent:
      "여러 포트에 대한 빔포밍 정보를 압축된 형태로 전달합니다. 메시지 크기를 줄이는 최적화 확장입니다.",
    color: "#14b8a6",
    tags: ["beamforming", "compact", "multi-port"],
    affects: ["beamforming"],
    appliesToSectionTypes: [1, 3, 5, 8],
  },
  {
    id: 20,
    name: "Dedicated puncturing",
    shortPurpose: "전용 펑처링",
    intent:
      "특정 자원(예: CRS, SSB)과 충돌을 피하기 위해 일부 RE를 펑처링(전송 제외)하도록 지시합니다.",
    color: "#06b6d4",
    tags: ["puncturing", "collision"],
    affects: ["puncturing", "prb-allocation"],
    appliesToSectionTypes: [1],
  },
  {
    id: 21,
    name: "Variable PRB group size (CH info)",
    shortPurpose: "가변 PRB 그룹 크기",
    intent:
      "채널 정보 보고(ST 6 등)에서 PRB 그룹 크기를 가변으로 두어 정밀도/오버헤드를 트레이드오프합니다. 정확한 적용 가능 ST는 스펙 7.6/7.7 표를 확인하세요.",
    color: "#0ea5e9",
    tags: ["prb", "channel", "group"],
    affects: ["prb-allocation", "feedback"],
    appliesToSectionTypes: [1, 5, 6],
  },
  {
    id: 22,
    name: "ACK/NACK request",
    shortPurpose: "ACK/NACK 요청",
    intent:
      "현재 보내는 컨트롤에 대해 응답(ACK/NACK)을 요청합니다. Section Type 4와 자주 짝을 이룹니다.",
    color: "#6366f1",
    tags: ["ack", "nack", "control"],
    affects: ["control", "feedback"],
    appliesToSectionTypes: [4],
  },
  {
    id: 23,
    name: "Arbitrary symbol pattern modulation compression",
    shortPurpose: "임의 심볼 패턴 변조 압축",
    intent:
      "심볼별로 서로 다른 변조 압축을 적용할 수 있도록 패턴을 표현합니다.",
    color: "#8b5cf6",
    tags: ["compression", "symbol"],
    affects: ["compression"],
    appliesToSectionTypes: [1],
  },
  {
    id: 24,
    name: "PUSCH DMRS configuration",
    shortPurpose: "PUSCH DMRS 설정",
    intent:
      "PUSCH 채널의 DMRS 포트·시퀀스·매핑을 더 상세히 지정합니다. PUSCH 스케줄링 Section과 함께 사용됩니다.",
    color: "#a855f7",
    tags: ["pusch", "dmrs"],
    affects: ["ueId"],
    appliesToSectionTypes: [1, 5],
  },
  {
    id: 25,
    name: "Symbol reordering for DMRS-BF",
    shortPurpose: "DMRS-BF용 심볼 재정렬",
    intent:
      "DMRS 기반 빔포밍에서 심볼 처리 순서를 재정렬할 수 있는 정보를 전달합니다.",
    color: "#d946ef",
    tags: ["dmrs", "beamforming"],
    affects: ["beamforming"],
    appliesToSectionTypes: [1, 5],
  },
  {
    id: 26,
    name: "Frequency offset feedback",
    shortPurpose: "주파수 오프셋 피드백",
    intent:
      "수신 측이 추정한 캐리어/주파수 오프셋을 송신 측에 피드백하기 위한 확장입니다.",
    color: "#f43f5e",
    tags: ["frequency", "feedback"],
    affects: ["frequency", "feedback"],
    appliesToSectionTypes: [6],
  },
  {
    id: 27,
    name: "O-DU controlled dimensionality reduction",
    shortPurpose: "O-DU 주도 차원 축소",
    intent:
      "채널 정보(ST 6) / SINR 보고(ST 9) 같은 RU→DU 보고에 대해 O-DU가 차원 축소를 지시해 오버헤드를 줄입니다. 정확한 적용 ST는 스펙 표 확인.",
    color: "#fb7185",
    tags: ["channel", "reduction"],
    affects: ["feedback"],
    appliesToSectionTypes: [6, 9],
  },
  {
    id: 28,
    name: "O-DU controlled freq resolution for SINR",
    shortPurpose: "SINR 보고 주파수 해상도 제어",
    intent:
      "SINR 보고의 주파수 해상도를 O-DU가 지정해 양/정밀도를 조정합니다. ST 9(post-equalization SINR)와 짝을 이룹니다.",
    color: "#f97316",
    tags: ["sinr", "channel", "frequency"],
    affects: ["feedback", "frequency"],
    appliesToSectionTypes: [9],
  },
  {
    id: 29,
    name: "Cyclic delay adjustment",
    shortPurpose: "순환 지연 조정",
    intent:
      "여러 안테나/레이어에 순환 지연을 부여해 다양성을 만드는 빔포밍 보조 설정입니다.",
    color: "#facc15",
    tags: ["cdd", "antenna"],
    affects: ["beamforming", "antenna", "timing"],
    appliesToSectionTypes: [1, 5],
  },
  {
    id: 30,
    name: "PUSCH repetition indication",
    shortPurpose: "PUSCH 반복 지시",
    intent:
      "PUSCH가 반복 송신되는 경우(신뢰성 향상용) 그 위치/카운트를 표시합니다.",
    color: "#84cc16",
    tags: ["pusch", "repetition", "reliability"],
    affects: ["control", "feedback"],
    appliesToSectionTypes: [1, 5],
  },
];

export function getSectionTypeMeta(id: number): SectionTypeMeta | undefined {
  return SECTION_TYPES.find((s) => s.id === id);
}

export function getSectionExtensionMeta(id: number): SectionExtensionMeta | undefined {
  return SECTION_EXTENSIONS.find((s) => s.id === id);
}
