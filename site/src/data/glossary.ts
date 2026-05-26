/**
 * Glossary of terms used across the C/U/S-plane spec.
 *
 * For each term we keep:
 *  - acronym (the short form developers actually see in code/spec)
 *  - longForm (what the letters stand for)
 *  - oneLine: 한 줄 설명 (시각적 카드용)
 *  - analogy: 비유 (전공자가 아니어도 이해되도록)
 *  - explain: 본문 설명 (2~5 단락)
 *  - relatedTo: 관련 용어 slug 배열 (사이트 내 링크)
 *  - inSpec: 스펙 챕터 번호 (출처 명시)
 *  - category: 그룹화용 ("network" | "radio" | "spec" | "ue" | "antenna" | "timing")
 */

export type GlossaryCategory =
  | "network"
  | "radio"
  | "spec"
  | "ue"
  | "antenna"
  | "timing"
  | "channel"
  | "feature";

export interface GlossaryEntry {
  slug: string;
  term: string;
  longForm?: string;
  oneLine: string;
  analogy: string;
  explain: string;
  relatedTo: string[];
  inSpec?: string;
  category: GlossaryCategory;
}

export const GLOSSARY: GlossaryEntry[] = [
  // ---------- 네트워크 구성요소 ----------
  {
    slug: "o-du",
    term: "O-DU",
    longForm: "Open Distributed Unit",
    oneLine: "디지털 신호 처리(스케줄링·암호화·HARQ 등)를 담당하는 기지국 두뇌",
    analogy: "공연장의 '음향 콘솔'. 어떤 노래(데이터)를 누가 듣는 스피커로 보낼지 결정하고 신호를 다듬는 곳.",
    explain:
      "O-DU는 베이스밴드 처리를 맡습니다. UE 스케줄링, MAC/RLC/PDCP, HARQ, 빔포밍 가중치 계산 같은 '계산 무거운' 일은 모두 여기서. \n\nO-RAN에서는 이 O-DU와 O-RU가 표준화된 인터페이스(Open Fronthaul, eCPRI 위)로 통신합니다. 그래서 두 박스의 제조사가 달라도 동작합니다.\n\n프론트홀 메시지(C/U/S-plane)는 항상 'O-DU가 보내는' 또는 'O-DU가 받는' 시점을 기준으로 표현됩니다. 예를 들어 `dataDirection`은 'O-DU 입장에서 송신=DL, 수신=UL'.",
    relatedTo: ["o-ru", "fronthaul", "c-plane", "u-plane", "s-plane"],
    inSpec: "4.1",
    category: "network",
  },
  {
    slug: "o-ru",
    term: "O-RU",
    longForm: "Open Radio Unit",
    oneLine: "안테나·RF·일부 PHY를 담당하는 무선 끝단 박스",
    analogy: "공연장의 '스피커 + 앰프'. 음향 콘솔이 보낸 신호를 실제 공기로 내보내는 장치.",
    explain:
      "O-RU는 안테나와 PA/LNA 같은 RF 회로, 그리고 일부 PHY 처리를 합니다. 어떤 분할(7-2x 등)을 쓰느냐에 따라 RU에서 처리하는 PHY 범위가 달라집니다.\n\nO-RU는 O-DU의 컨트롤(C-plane)을 받아서 OTA로 송수신을 수행하고, 받은 IQ 데이터를 U-plane으로 다시 O-DU에 올려보냅니다.\n\n빔포밍(아날로그·디지털·하이브리드)을 실제로 수행하는 곳도 O-RU입니다. 단, '어떤 빔으로'는 O-DU가 결정합니다(beamId 또는 빔 가중치 형태로 내려보냄).",
    relatedTo: ["o-du", "antenna-array", "beamforming", "eaxc"],
    inSpec: "4.1",
    category: "network",
  },
  {
    slug: "ue",
    term: "UE",
    longForm: "User Equipment",
    oneLine: "단말기 — 스마트폰, IoT 디바이스, FWA CPE 등",
    analogy: "공연장의 '관객 한 명'. 콘솔/스피커는 이 관객들이 잘 듣게 만들기 위해 움직임.",
    explain:
      "UE는 기지국이 서빙하는 무선 단말입니다. RRC 시그널링으로 식별·연결 상태를 관리하지만, 프론트홀 레벨에서는 UE를 직접 다루지 않고 'ueId'라는 내부 핸들로 참조합니다.\n\nUE 단위로 자원을 할당하는 ST 5(ueId-BF), 채널 정보를 RU에 전달하는 ST 6, UE 단위 RRM 측정 보고(ST 10) 등이 UE를 명시적으로 다루는 메시지입니다.",
    relatedTo: ["ueid", "rnti", "section-type-5"],
    category: "ue",
  },
  {
    slug: "fronthaul",
    term: "Fronthaul (FH)",
    oneLine: "O-DU ↔ O-RU 사이의 전송망. 보통 광케이블 + 이더넷.",
    analogy: "음향 콘솔과 무대 스피커 사이의 케이블 다발.",
    explain:
      "Fronthaul은 보통 eCPRI 또는 IEEE 1914.3 인캡슐레이션 위에서 동작하는 L2/L3 이더넷 네트워크입니다.\n\n프론트홀에는 세 가지 트래픽 클래스가 흐릅니다:\n- **C-plane (Control)**: 스케줄·빔·UE 정보 등 '무엇을, 언어 / 언제, 어떻게'를 지정\n- **U-plane (User)**: 실제 IQ 데이터 (송신할 신호 또는 수신한 신호)\n- **S-plane (Sync)**: 시간/위상 동기 (PTP/SyncE)\n\n프론트홀 지연·지터가 매우 작아야 하므로 우선순위·전송 윈도우 같은 개념이 스펙 4장에 등장합니다.",
    relatedTo: ["o-du", "o-ru", "c-plane", "u-plane", "s-plane", "ecpri"],
    inSpec: "5.1",
    category: "network",
  },
  {
    slug: "ecpri",
    term: "eCPRI",
    longForm: "enhanced Common Public Radio Interface",
    oneLine: "Fronthaul에서 IQ/제어를 이더넷으로 캡슐화하는 표준",
    analogy: "케이블 다발 안을 흐르는 '봉투 규격'. 어떤 봉투에 어떤 내용물(메시지 타입)을 넣는지 약속.",
    explain:
      "eCPRI는 페이로드 앞에 작은 헤더를 붙여 'IQ 데이터, 실시간 컨트롤, ACK/NACK' 같은 메시지 종류를 구분합니다.\n\nO-RAN WG4는 eCPRI(또는 1914.3) 위에 'application layer'를 정의해 우리가 지금 다루는 Section Type/Extension 구조를 얹습니다. 즉 eCPRI 메시지 하나의 페이로드 안에 여러 Section이 들어갈 수 있습니다.",
    relatedTo: ["fronthaul", "section", "c-plane", "u-plane"],
    inSpec: "5.1.3",
    category: "network",
  },

  // ---------- 프레임 / 시간 / 무선 자원 ----------
  {
    slug: "frame",
    term: "Frame",
    oneLine: "10ms 단위의 가장 큰 시간 블록 (radio frame)",
    analogy: "달력의 '한 달'. 그 안에 '주(subframe)'와 '일(slot)'이 있음.",
    explain:
      "1 frame = 10ms = 10 subframes. frameId는 0~255 순환하는 8비트 인덱스입니다. C-plane 메시지가 어느 frame을 가리키는지 frameId/subframeId/slotId 조합으로 정확히 표현합니다.",
    relatedTo: ["subframe", "slot", "symbol", "numerology"],
    inSpec: "7.5.2.4",
    category: "timing",
  },
  {
    slug: "subframe",
    term: "Subframe",
    oneLine: "1ms 길이의 시간 블록 (frame을 10등분)",
    analogy: "한 달 안의 '한 주' 같은 단위. 늘 1ms로 고정.",
    explain:
      "Subframe은 항상 1ms입니다. 누메롤로지가 어떻든 1ms는 그대로지만, 그 안의 slot 개수가 달라집니다(μ=0이면 1슬롯/subframe, μ=1이면 2슬롯/subframe, …).",
    relatedTo: ["frame", "slot", "numerology"],
    inSpec: "7.5.2.5",
    category: "timing",
  },
  {
    slug: "slot",
    term: "Slot",
    oneLine: "스케줄링의 기본 단위. 14 OFDM 심볼이 들어가는 시간 슬라이스",
    analogy: "콘서트의 '한 곡 길이'. 보통 14 음표(심볼)로 구성.",
    explain:
      "Normal CP에서 한 슬롯은 14 OFDM 심볼입니다. 슬롯 길이는 누메롤로지(서브캐리어 간격)에 반비례합니다: μ=0(15kHz) → 1ms/slot, μ=1(30kHz) → 0.5ms/slot, μ=3(120kHz) → 0.125ms/slot.\n\n대부분의 C-plane 메시지는 '한 슬롯을 어떻게 쓸지'를 표현합니다.",
    relatedTo: ["frame", "subframe", "symbol", "numerology", "prb"],
    inSpec: "7.5.2.6",
    category: "timing",
  },
  {
    slug: "symbol",
    term: "OFDM Symbol",
    oneLine: "OFDM의 가장 작은 시간 단위. 한 슬롯에 14개 들어감",
    analogy: "한 곡(slot) 안의 '음표 하나'. 매 음표마다 여러 주파수(서브캐리어)가 동시에 울림.",
    explain:
      "OFDM은 시간과 주파수를 격자로 나눠 사용하는 방식입니다. 시간 축의 한 격자가 'symbol', 주파수 축의 12개 서브캐리어 묶음이 'PRB'.\n\nC-plane Section은 (startSymbolId, numSymbol)로 시간 범위를, (startPrbc, numPrbc)로 주파수 범위를 지정해 '이 직사각형 영역이 내 것'이라고 선언합니다.",
    relatedTo: ["slot", "prb", "rb-grid"],
    inSpec: "7.5.2.7",
    category: "timing",
  },
  {
    slug: "numerology",
    term: "Numerology (μ)",
    oneLine: "서브캐리어 간격(SCS)을 결정하는 지수. μ=0 → 15kHz, μ=1 → 30kHz, ...",
    analogy: "악보의 '박자'. μ가 클수록 한 박자가 짧아짐 → 같은 시간에 더 많은 음을 빠르게.",
    explain:
      "Numerology μ에 따라 SCS = 15·2^μ kHz입니다. SCS가 커지면 슬롯 길이가 짧아지고, 한 PRB가 차지하는 주파수 폭은 넓어집니다.\n\nμ가 다른 자원이 한 메시지에 섞이면(예: PRACH는 다른 SCS) ST 3 같은 'mixed-numerology' 전용 Section Type이나 SE 15가 등장합니다.",
    relatedTo: ["scs", "slot", "symbol", "section-type-3"],
    inSpec: "7.5.2.16",
    category: "timing",
  },
  {
    slug: "scs",
    term: "SCS",
    longForm: "Sub-Carrier Spacing",
    oneLine: "서브캐리어 간격. 15·2^μ kHz.",
    analogy: "악보의 5선지 사이 간격. 넓으면 음을 더 또렷이 구분하지만 같은 옥타브에 들어가는 음 수가 적어짐.",
    explain:
      "SCS 결정은 채널·서비스에 따라 바뀝니다. eMBB DL은 15/30/60kHz, mmWave는 120/240kHz 등.",
    relatedTo: ["numerology", "prb"],
    category: "radio",
  },
  {
    slug: "prb",
    term: "PRB",
    longForm: "Physical Resource Block",
    oneLine: "12개의 연속 서브캐리어. 주파수 자원 할당의 기본 단위",
    analogy: "12 음이 묶인 '한 마디'. 스케줄러는 마디 단위로 자리를 배정.",
    explain:
      "한 PRB는 시간 축 1 심볼 × 주파수 축 12 서브캐리어를 차지합니다. C-plane Section은 'PRB 단위로' 자원을 잡습니다(startPrbc, numPrbc).\n\nPRB는 PRG(PRB Group)로 묶어 같은 프리코더를 공유하기도 합니다.",
    relatedTo: ["symbol", "rb-grid", "prg", "section-extension-6"],
    inSpec: "7.5.3",
    category: "radio",
  },
  {
    slug: "rb-grid",
    term: "RB Grid (시간×주파수 격자)",
    oneLine: "X=심볼(시간), Y=PRB(주파수)인 2차원 격자. 자원 배정 시각화의 기본",
    analogy: "달력의 '시간표'. 가로가 교시, 세로가 강의실. 누가 어떤 칸을 쓰는지 색칠해 표현.",
    explain:
      "이 사이트의 모든 'RB 그리드' 시각화는 한 슬롯(14 심볼) × 24 PRB 정도의 작은 격자에 Section의 점유 영역을 그립니다. 비전공자도 '저 색칠된 칸이 이 메시지의 영역'으로 직관적 이해 가능.",
    relatedTo: ["prb", "symbol", "slot"],
    category: "radio",
  },

  // ---------- 안테나 / 빔 ----------
  {
    slug: "antenna-array",
    term: "Antenna Array",
    oneLine: "여러 안테나 소자를 일정 간격으로 배열한 것. 보통 λ/2 간격.",
    analogy: "스피커 여러 개를 일렬로 세워 놓은 'PA 라인 어레이'.",
    explain:
      "어레이의 각 소자에 다른 위상·진폭을 주면(=가중치) 특정 방향으로 보강 간섭이 일어나 빔이 형성됩니다. 소자가 많을수록 빔이 좁고 정확해집니다.",
    relatedTo: ["beamforming", "beamid", "ula", "section-extension-1"],
    inSpec: "12.2",
    category: "antenna",
  },
  {
    slug: "ula",
    term: "ULA",
    longForm: "Uniform Linear Array",
    oneLine: "동일 간격 직선 배열. 가장 단순한 어레이 모델",
    analogy: "줄 맞춰 세운 똑같은 스피커들.",
    explain:
      "이 사이트의 빔 시각화는 ULA 모델을 사용합니다. 실제 5G 안테나는 보통 평면(Planar) 또는 cross-pol이지만, ULA로도 '안테나 수 늘리면 빔이 좁아진다', '조향각이 늘면 어레이 이득이 낮아진다' 같은 핵심 직관은 그대로 전달됩니다.",
    relatedTo: ["antenna-array", "beamforming"],
    category: "antenna",
  },
  {
    slug: "beamforming",
    term: "Beamforming",
    oneLine: "여러 안테나에서 송신하는 신호의 위상/진폭을 맞춰 특정 방향에 빔을 만드는 기술",
    analogy: "여러 사람이 같은 가사를 동시에 외칠 때, 한 방향으로만 또렷이 들리게 입을 맞추는 것.",
    explain:
      "5G에서 빔포밍은 거의 모든 송수신의 기본입니다. C-plane은 '어떤 빔으로'를 두 가지 방식으로 지정합니다:\n\n1. **beamId** — 미리 RU에 학습/저장된 빔 인덱스를 가리킴 (간단·작음)\n2. **빔 가중치(weights)** — SE 1 또는 SE 11로 가중치 자체를 매번 내려줌 (유연·큼)\n\n수신(UL)에서도 같은 개념이 작동합니다(빔포밍을 받는 쪽이라고 보면 됨).",
    relatedTo: ["antenna-array", "beamid", "section-extension-1", "section-extension-11", "section-extension-14"],
    inSpec: "12",
    category: "antenna",
  },
  {
    slug: "beamid",
    term: "beamId",
    oneLine: "사전 정의된 빔 인덱스 (0..32767)",
    analogy: "조명 콘솔의 'preset 번호'. 12번 누르면 '주연 배우 비추는 조명' 식으로 미리 저장된 빔이 켜짐.",
    explain:
      "RU에 미리 학습/등록된 빔 가중치 테이블의 인덱스입니다. C-plane Section에 beamId만 적어 보내면 RU가 그 인덱스의 빔을 재생합니다.\n\n장점: 메시지 작음(15비트). 단점: 미등록 빔은 못 씀.",
    relatedTo: ["beamforming", "section-type-1", "section-extension-1"],
    inSpec: "7.5.3",
    category: "antenna",
  },
  {
    slug: "ueid",
    term: "ueId",
    oneLine: "Fronthaul 내부에서 UE를 가리키는 짧은 핸들",
    analogy: "공연장에서 '11번 좌석' 같은 좌석 번호. 관객 본인 이름이 아니라 그 자리만 가리키는 코드.",
    explain:
      "RRC 레벨의 C-RNTI 등을 그대로 Fronthaul에 보내는 대신, O-DU/O-RU가 합의한 짧은 ID(ueId)로 추상화합니다. ST 5, ST 6, SE 14 등 'UE 단위'를 다루는 메시지에서 등장합니다.",
    relatedTo: ["ue", "rnti", "section-type-5"],
    inSpec: "7.5.2",
    category: "ue",
  },
  {
    slug: "eaxc",
    term: "eAxC",
    longForm: "extended Antenna-Carrier",
    oneLine: "안테나 포트 × 캐리어 조합을 가리키는 식별자",
    analogy: "스피커 한 대(안테나) + 음원 한 채널(캐리어) 조합. '왼쪽 스피커의 클래식 채널' 같은 식.",
    explain:
      "한 RU 안에는 여러 안테나가 있고, 각 안테나는 여러 캐리어를 동시 운용할 수 있습니다. 그 모든 조합 하나하나가 eAxC 인스턴스이고, eCPRI 메시지마다 어느 eAxC에 해당하는지 ID로 라우팅됩니다.\n\nSE 7(eAxC mask)을 쓰면 한 메시지로 여러 eAxC에 동일 명령을 보낼 수 있습니다.",
    relatedTo: ["antenna-array", "section-extension-7"],
    inSpec: "3.1",
    category: "antenna",
  },

  // ---------- 채널 / 신호 ----------
  {
    slug: "pdsch",
    term: "PDSCH",
    longForm: "Physical Downlink Shared Channel",
    oneLine: "DL 사용자 데이터를 실어 나르는 채널 (가장 흔함)",
    analogy: "스피커에서 흘러나오는 '본 콘서트 곡'. 관객(UE)이 실제로 듣는 음악.",
    explain:
      "PDSCH는 사용자에게 보내는 다운링크 데이터 전송 채널입니다. 거의 모든 다운로드 트래픽이 PDSCH로 전달됩니다. C-plane Section Type 1이 가장 일반적인 PDSCH 스케줄링에 사용됩니다.",
    relatedTo: ["section-type-1", "u-plane", "dmrs"],
    category: "channel",
  },
  {
    slug: "pusch",
    term: "PUSCH",
    longForm: "Physical Uplink Shared Channel",
    oneLine: "UL 사용자 데이터를 실어 나르는 채널",
    analogy: "관객이 손 들고 답하는 마이크. UE가 기지국으로 데이터를 보내는 채널.",
    explain:
      "PUSCH는 UE의 업링크 데이터 채널입니다. ST 1(일반) 또는 ST 11(DMRS 중심) Section으로 스케줄됩니다. 복조에는 DMRS가 필수입니다.",
    relatedTo: ["section-type-1", "section-type-11", "dmrs"],
    category: "channel",
  },
  {
    slug: "prach",
    term: "PRACH",
    longForm: "Physical Random Access Channel",
    oneLine: "UE가 처음 접속할 때 보내는 신호용 채널",
    analogy: "콘서트 입장 시 '저 들어가도 돼요?' 하고 외치는 한 마디.",
    explain:
      "UE가 셀에 접속하려면 PRACH preamble을 송신해 기지국에 자기 존재를 알립니다. PRACH는 일반 데이터와 누메롤로지가 다른 경우가 많아 ST 3(PRACH/mixed numerology) 전용 Section Type이 따로 있습니다.",
    relatedTo: ["section-type-3", "ue"],
    category: "channel",
  },
  {
    slug: "dmrs",
    term: "DMRS",
    longForm: "DeModulation Reference Signal",
    oneLine: "복조용 참조 신호. 수신 측이 채널 추정에 사용",
    analogy: "노래방의 가이드 보컬. 진짜 노래(데이터)와 함께 들려서 누가 부르는지/박자가 맞는지 알려줌.",
    explain:
      "PDSCH/PUSCH 안에 일정한 위치로 끼워 보내는 알려진 신호입니다. UE/RU는 이 'known' 신호를 받아 채널 응답을 추정합니다. C-Plane 차원에서 PUSCH DMRS 구성에 영향을 주는 SE로는 SE 24(PUSCH DMRS configuration), SE 25(symbol reordering for DMRS-BF) 등이 있습니다.",
    relatedTo: ["pdsch", "pusch", "section-extension-24"],
    category: "channel",
  },
  {
    slug: "srs",
    term: "SRS",
    longForm: "Sounding Reference Signal",
    oneLine: "UE가 보내는 UL 사운딩 신호. 기지국이 UL 채널 추정에 사용",
    analogy: "관객이 가끔 '아아 마이크 테스트' 외치는 소리. 음향팀이 그 소리로 좌석별 음향을 보정.",
    explain:
      "UE가 정기적으로 SRS를 송신하면 O-DU는 UL 채널을 측정하고, 이를 바탕으로 빔 가중치/스케줄을 결정합니다. (참고: SRS 송신 자체의 스케줄링은 일반적으로 ST 1로 처리되며, ST 10/11은 RRM measurement report/request로 사용됩니다.)",
    relatedTo: ["channel-estimation"],
    category: "channel",
  },

  // ---------- 스펙 / 메시지 ----------
  {
    slug: "c-plane",
    term: "C-Plane",
    longForm: "Control Plane",
    oneLine: "'무엇을, 언제, 어떤 빔으로'를 지정하는 컨트롤 메시지",
    analogy: "음향 콘솔이 스피커에게 보내는 '큐 시트'. 어떤 곡을, 몇 분에, 어느 스피커로 틀지 미리 알려줌.",
    explain:
      "C-plane은 Section Type 0~11 그리고 그에 붙는 Section Extension 1~30으로 구성됩니다. 자원/UE/빔/압축/피드백 모든 의도를 표현합니다.\n\n이 사이트의 모든 Section Type/Extension 페이지가 다루는 대상이 바로 C-plane 메시지입니다.",
    relatedTo: ["u-plane", "s-plane", "section", "section-extension"],
    inSpec: "7",
    category: "spec",
  },
  {
    slug: "u-plane",
    term: "U-Plane",
    longForm: "User Plane",
    oneLine: "실제 IQ 데이터를 운반하는 메시지",
    analogy: "큐 시트에 적힌 대로 실제로 흘러나가는 '음원 데이터'.",
    explain:
      "U-plane은 베이스밴드 IQ 샘플(또는 압축된 IQ)을 실어 나릅니다. C-plane으로 '여기 PRB 4~11, 심볼 2~12, beamId 12'를 알린 뒤 U-plane이 그 영역에 들어갈 데이터를 보냅니다.\n\n프론트홀 대역폭 절약을 위해 다양한 압축(SE 4, SE 5, SE 23) 옵션이 있습니다.",
    relatedTo: ["c-plane", "compression", "iq"],
    inSpec: "8",
    category: "spec",
  },
  {
    slug: "s-plane",
    term: "S-Plane",
    longForm: "Synchronization Plane",
    oneLine: "O-DU ↔ O-RU 사이 시간/위상 동기 (PTP/SyncE)",
    analogy: "오케스트라의 메트로놈. 모두가 정확히 같은 박자에 들어가게 해주는 신호.",
    explain:
      "C-plane이 '슬롯 N, 심볼 K'를 지칭하려면 양쪽이 같은 시계를 봐야 합니다. S-plane(IEEE 1588 PTP 등)이 그 시계 동기를 책임집니다. 동기가 깨지면 모든 자원 할당이 어긋납니다.",
    relatedTo: ["c-plane", "u-plane"],
    inSpec: "11",
    category: "spec",
  },
  {
    slug: "section",
    term: "Section",
    oneLine: "C-plane 메시지 안에서 '한 직사각형 자원 묶음'을 표현하는 단위",
    analogy: "큐 시트의 '한 항목'. (시간 02:30~03:00, 스피커 A·B, beamId 7) 같은 한 줄.",
    explain:
      "C-plane 메시지 한 통에는 여러 Section이 들어갑니다. 각 Section은:\n- (startSymbolId, numSymbol) — 시간 범위\n- (startPrbc, numPrbc) — 주파수 범위\n- beamId 또는 ueId\n- 기타 옵션(ef=1이면 뒤에 Section Extension이 옴)\n\nSection의 '의도'를 결정하는 것이 sectionType 필드(0~11)입니다.",
    relatedTo: ["section-type", "section-extension", "c-plane"],
    inSpec: "7.4",
    category: "spec",
  },
  {
    slug: "section-type",
    term: "Section Type",
    oneLine: "Section의 '의도/카테고리'를 나타내는 0~11 번호",
    analogy: "큐 시트 항목 옆의 '구분 태그'. 'PDSCH', 'PRACH', 'SRS' 같은 식.",
    explain:
      "Section Type은 이 사이트의 핵심 분류입니다. 12개(0~11) 중 하나를 골라 메시지의 의도를 선언합니다. ST별로 따라붙는 필드 구성, 호환 가능한 Section Extension 목록이 달라집니다.",
    relatedTo: ["section", "section-extension"],
    inSpec: "7.4",
    category: "spec",
  },
  {
    slug: "section-extension",
    term: "Section Extension (SE)",
    oneLine: "Section 뒤에 덧붙여 추가 정보를 운반하는 보조 블록 (SE 1~30)",
    analogy: "큐 시트 항목에 메모지처럼 붙는 포스트잇. '이 곡 빔포밍 가중치는 따로 첨부' 같은 부가 지시.",
    explain:
      "Section 헤더의 ef(extension flag) 비트가 1이면 그 뒤에 SE가 이어 붙습니다. 한 Section에 여러 SE를 연쇄로 붙일 수도 있고(각 SE의 ef로 표시), SE마다 페이로드 의미가 다릅니다.",
    relatedTo: ["section", "section-type"],
    inSpec: "7.6",
    category: "spec",
  },
  {
    slug: "lbt",
    term: "LBT",
    longForm: "Listen-Before-Talk",
    oneLine: "비면허 대역에서 송신 전 채널이 비어 있는지 듣고 결정하는 절차",
    analogy: "공유 회의실 들어가기 전에 문 열고 비어 있는지 확인하는 것.",
    explain:
      "5GHz/6GHz 같은 비면허 대역(NR-U / LAA)은 다른 시스템(Wi-Fi)과 공유하므로, 송신 직전 채널을 측정해 비어 있어야 합니다. ST 7이 이 LBT 결과를 O-DU↔O-RU 사이에 주고받는 데 사용됩니다.",
    relatedTo: ["section-type-7"],
    category: "feature",
  },
  {
    slug: "dss",
    term: "DSS",
    longForm: "Dynamic Spectrum Sharing",
    oneLine: "같은 대역을 LTE와 NR이 동적으로 공유",
    analogy: "회의실 하나를 시간/구역 나눠 두 팀이 함께 쓰기.",
    explain:
      "DSS는 운용 중 트래픽 비율에 따라 같은 대역의 LTE/NR 자원을 동적으로 조절합니다. SE 9가 DSS 자원 회피·표시를 전달합니다.",
    relatedTo: ["section-extension-9"],
    category: "feature",
  },
  {
    slug: "compression",
    term: "Compression (BFW/IQ)",
    oneLine: "프론트홀 대역을 줄이기 위해 IQ 또는 빔 가중치를 작게 인코딩",
    analogy: "큰 사진을 JPEG으로 줄여 보내는 것. 약간의 화질을 포기하고 용량을 줄임.",
    explain:
      "압축 종류:\n- **bitwidth reduction**: 16비트 IQ를 9비트 등으로 줄임 (블록 floating point)\n- **modulation compression** (SE 4, 5, 23): 변조 정보 활용\n- **BFW 압축** (SE 1, SE 11): 빔 가중치 자체를 압축\n\n압축 헤더(udCompHdr, bfwCompHdr 등)가 메시지에 함께 들어갑니다.",
    relatedTo: ["section-extension-4", "section-extension-5", "u-plane"],
    inSpec: "6",
    category: "feature",
  },
  {
    slug: "channel-estimation",
    term: "Channel Estimation",
    oneLine: "송수신단 사이의 채널 응답(H)을 측정/추정하는 과정",
    analogy: "음향팀이 'pink noise'를 틀어 좌석마다 음향이 어떻게 변하는지 측정하는 것.",
    explain:
      "UE↔RU 사이 무선 채널은 시간·주파수에 따라 변하므로, 빔 가중치·MIMO 프리코더를 잘 계산하려면 채널을 알아야 합니다. UL에서는 SRS·PUSCH DMRS로, DL에서는 UE 피드백/CSI로 얻습니다. (스펙상 SRS는 일반적으로 ST 1로 스케줄되며, ST 10/11은 RRM 측정 보고/요청 메시지입니다.)\n\nST 6은 O-DU가 가진 UE-specific 채널 정보를 O-RU에 내려주는 메시지입니다.",
    relatedTo: ["srs", "dmrs", "section-type-6"],
    category: "channel",
  },
  {
    slug: "harq",
    term: "HARQ",
    longForm: "Hybrid Automatic Repeat reQuest",
    oneLine: "ACK/NACK 기반의 재전송 메커니즘 (PHY+MAC 결합)",
    analogy: "택배 영수증. 받지 못했으면 다시 보내달라고 요청.",
    explain:
      "HARQ는 보통 MAC 레이어/Layer 1 (PUCCH) 메커니즘이라 프론트홀 CUS-plane 직접 다루지 않습니다. 다만 프론트홀 컨트롤 메시지의 적용 확인이 필요할 때는 SE 22(또는 ST 4의 native ackNackReqId)로 요청 → ST 8 (ACK/NACK feedback)으로 응답 받습니다.",
    relatedTo: ["section-type-4", "section-type-8", "section-extension-22"],
    category: "feature",
  },
];

export function getGlossaryEntry(slug: string): GlossaryEntry | undefined {
  return GLOSSARY.find((g) => g.slug === slug);
}

export const GLOSSARY_CATEGORIES: { key: GlossaryCategory; label: string }[] = [
  { key: "network", label: "네트워크 구성요소" },
  { key: "timing", label: "시간 / 프레임" },
  { key: "radio", label: "무선 자원" },
  { key: "antenna", label: "안테나 / 빔" },
  { key: "ue", label: "UE" },
  { key: "channel", label: "채널 / 신호" },
  { key: "spec", label: "스펙 / 메시지" },
  { key: "feature", label: "기능 / 옵션" },
];
