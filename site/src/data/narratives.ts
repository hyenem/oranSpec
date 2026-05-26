/**
 * Rich narrative content for each Section Type and Section Extension.
 *
 * Written for a junior engineer who has just joined a fronthaul team and has
 * never seen O-RAN before. Each entry tries to answer:
 *
 *   1) 한 줄 요약 — what is this in one sentence?
 *   2) 비전공자용 비유 — analogy a non-engineer can grasp
 *   3) 무슨 일을 하나요? — multi-paragraph plain explanation
 *   4) 언제 발생하나요? — concrete real-world triggers
 *   5) 동작 흐름 — step by step what DU/RU/UE do
 *   6) 함께 보는 필드들 — the fields a developer touches in code
 *   7) 함께 쓰이는 SE / 다른 ST와의 관계
 *   8) 흔한 함정 — gotchas
 *   9) 실제 예 — a concrete worked example
 *
 * The data here is composed from the O-RAN.WG4.TS.CUS-R005-v20.00 spec plus
 * publicly accessible explanations (Techplayon, TelecomTrainer, O-RAN-SC docs,
 * and public patent filings) — synthesized into junior-friendly language.
 */

export interface FieldNote {
  name: string;
  plain: string;
  example?: string;
  bits?: string;
}

export interface RelatedExt {
  id: number;
  why: string;
}

export interface STNarrative {
  oneLine: string;
  analogy: string;
  whatItIs: string;
  whenUsed: string[];
  howItFlows: string[];
  keyFields: FieldNote[];
  relatedExts: RelatedExt[];
  pitfalls: string[];
  workedExample: string;
  realWorldUseCases: string[];
}

export interface SENarrative {
  oneLine: string;
  analogy: string;
  whatItIs: string;
  whenUsed: string[];
  payload: FieldNote[];
  pairWith: { stId: number; why: string }[];
  pitfalls: string[];
  workedExample: string;
}

// =====================================================================
//                          Section Types
// =====================================================================

export const ST_NARRATIVES: Record<number, STNarrative> = {
  0: {
    oneLine: "어떤 시간×주파수 영역을 '비워둘 것'이라고 O-RU에게 통보하는 컨트롤.",
    analogy:
      "공연 큐 시트의 '15:00~15:05 휴식' 줄과 같습니다. 스피커가 잠시 꺼져 있어도 운영팀이 미리 알고 있게 알려주는 것.",
    whatItIs:
      "ST 0은 'unused resource blocks/symbols' Section Type입니다. 보통은 두 가지 경우에 사용됩니다.\n\n(a) **가드 구간**: 다음 메시지가 시작되기 전 RU가 안정화될 시간이 필요할 때, 슬롯의 처음 몇 심볼을 비워두라고 명시.\n\n(b) **공유 스펙트럼 회피**: LTE/NR DSS나 RU 외부 시스템이 같은 자원을 쓸 때, O-DU가 '이 영역엔 우리가 안 들어간다'고 알려서 충돌을 피함.\n\nU-plane 데이터가 따라붙지 않는다는 점이 핵심입니다. 즉 RU 입장에서 ST 0을 받으면 '저 좌표엔 IQ가 오지 않으니까 PA를 켤 필요도 없다'고 판단할 수 있어요.",
    whenUsed: [
      "슬롯 경계에서의 가드 구간 확보 (특히 mixed-numerology 환경)",
      "DSS 환경에서 LTE 영역을 NR 측이 피해갈 때",
      "TDD UL/DL 전환 갭에서 송수신 전환 시간을 확보할 때",
      "측정 윈도우 등 RU가 자원을 비워야 할 때",
    ],
    howItFlows: [
      "O-DU 스케줄러가 다음 슬롯에서 비울 영역을 결정한다.",
      "ST 0 C-plane 메시지를 만들어 (startSymbolId, numSymbol, startPrbc, numPrbc)로 영역을 지정한다.",
      "O-RU는 메시지를 받고 해당 영역에 대해 PA/송신 회로를 비활성화하거나 RF 입력을 무시한다.",
      "U-plane 데이터는 이 영역에 대해서는 송신되지 않는다.",
    ],
    keyFields: [
      { name: "startSymbolId", plain: "비워둘 영역의 시작 OFDM 심볼", example: "0 (슬롯 맨 앞)" },
      { name: "numSymbol", plain: "몇 심볼을 비울지", example: "2" },
      { name: "startPrbc", plain: "비울 PRB 시작 인덱스", example: "0 (전체 대역)" },
      { name: "numPrbc", plain: "비울 PRB 개수 (0이면 전체 대역)", example: "0" },
    ],
    relatedExts: [],
    pitfalls: [
      "ST 0과 ST 1의 영역이 겹치면 RU가 어떤 쪽을 따라야 하는지 모호해질 수 있다. 스케줄러가 명확히 분리해야 함.",
      "ST 0은 U-plane이 없으니 압축 헤더(udCompHdr) 같은 필드를 채우지 말 것 — Section Type별 필드 구성이 다릅니다.",
    ],
    workedExample:
      "한 슬롯(14 심볼) 중 마지막 두 심볼을 SRS에 양보하기 위해 비울 예: ST 0 (sym 12~13, PRB 0~273 전체). 동시에 슬롯의 sym 0~11은 ST 1로 PDSCH가 송신됨.",
    realWorldUseCases: [
      "TDD DL→UL 전환 구간 확보",
      "외부 시스템(예: 다른 캐리어)과 공존하기 위한 자원 양보",
      "맞춤형 측정 신호 삽입을 위해 일부 심볼 비우기",
    ],
  },

  1: {
    oneLine: "5G 트래픽의 대부분이 통과하는 일반 DL/UL 데이터 채널 스케줄링 메시지.",
    analogy:
      "공연 큐 시트의 '본 곡 항목' 그 자체. 어떤 곡(데이터)을, 어느 스피커(빔)로, 몇 분부터 몇 분까지(자원) 틀지 적어둔 가장 흔한 한 줄.",
    whatItIs:
      "ST 1은 'most DL/UL radio channels' Section Type으로, **PDSCH/PUSCH 같은 데이터 채널을 스케줄**하는 기본 메시지입니다. 5G에서 사용자에게 다운로드되거나 사용자가 업로드하는 트래픽의 거의 모든 자원 할당이 이 ST 1을 통과합니다.\n\n메시지 안에는 (시간/주파수 좌표) + (beamId 또는 ueId) + 옵션적으로 Section Extension이 따라붙습니다. 빔포밍 가중치를 직접 내리고 싶다면 SE 1(beamforming weights)을, 비연속 PRB를 쓰려면 SE 6/12를, MU-MIMO 그루핑이 필요하면 SE 10/17 같은 식으로 조합합니다.\n\n흔히 'C-plane이 메시지의 의도와 좌표를 선언하고, 같은 좌표로 U-plane이 실제 IQ를 운반한다'고 표현하는데, 그 'C-plane이 의도를 선언하는' 부분의 대표 주자가 ST 1입니다.",
    whenUsed: [
      "사용자가 YouTube/Netflix 같은 DL 트래픽을 받을 때 (PDSCH)",
      "사용자가 사진을 업로드할 때 (PUSCH)",
      "RRC reconfiguration, SIB 전송 같은 시스템 시그널링도 PDSCH로 나가므로 ST 1 사용",
      "MU-MIMO로 여러 UE를 같은 자원에 묶을 때 (보통 SE 10/17과 함께)",
    ],
    howItFlows: [
      "O-DU 스케줄러가 '다음 슬롯에 어떤 UE에게, 어디에, 어떤 빔으로 보낼지' 결정.",
      "ST 1 C-plane 메시지를 생성. 필요하면 SE 1(가중치) 또는 SE 6(비연속 PRB)을 첨부.",
      "같은 슬롯에 들어갈 사용자 IQ를 U-plane으로 별도 송신.",
      "O-RU는 C-plane으로 알려진 좌표에 들어갈 U-plane IQ를 받아 그 직사각형 영역에만 송신.",
      "DL이면 빔으로 OTA 송신, UL이면 같은 좌표에서 수신하여 IQ를 U-plane으로 DU에 반환.",
    ],
    keyFields: [
      { name: "sectionType", plain: "이 메시지가 ST 1임을 알리는 식별자", example: "1", bits: "8" },
      { name: "dataDirection", plain: "0=UL, 1=DL", bits: "1" },
      { name: "frameId / subframeId / slotId", plain: "어느 시점의 슬롯인지", bits: "8 / 4 / 6" },
      { name: "startSymbolId", plain: "이 Section의 시작 심볼", example: "2" },
      { name: "numSymbol", plain: "심볼 길이 (보통 PDSCH는 10~12)", example: "12" },
      { name: "startPrbc", plain: "PRB 시작", example: "0" },
      { name: "numPrbc", plain: "PRB 개수 (0이면 전체 대역)", example: "8" },
      { name: "beamId", plain: "사용할 빔 인덱스. RU에 사전 등록된 빔 ID.", example: "12", bits: "15" },
      { name: "ef", plain: "1이면 뒤에 Section Extension이 따라옴", bits: "1" },
    ],
    relatedExts: [
      { id: 1, why: "빔 가중치를 직접 내려보낼 때 (beamId 대신 가중치)" },
      { id: 3, why: "DL 프리코딩 파라미터(MIMO 레이어 등) 지정" },
      { id: 6, why: "PDSCH가 연속 PRB가 아니라 비연속 PRB에 흩어질 때" },
      { id: 10, why: "여러 안테나 포트를 그룹으로 묶어 일괄 적용" },
      { id: 11, why: "큰 어레이용 유연한 빔 가중치 표현" },
      { id: 20, why: "CRS/SSB와 충돌을 피하기 위한 펑처링" },
    ],
    pitfalls: [
      "freqOffset이 다른 누메롤로지를 ST 1로 표현하려고 하지 말 것 — ST 3을 사용해야 합니다.",
      "한 메시지 안에 여러 Section을 담을 때 sectionType이 모두 같아야 함 (서로 다른 ST를 섞을 수 없음).",
      "ef=1로 SE를 붙였으면 SE 페이로드 길이(extLen)를 정확히 채워야 함. 잘못된 extLen은 파서가 다음 Section을 못 찾게 만듬.",
    ],
    workedExample:
      "예: 슬롯 (frame=10, subframe=2, slot=0)에서 (sym 2~13)의 PRB 0~7을 UE-A에게 beamId=12로 PDSCH 송신. 메시지 구성은 [공통 헤더] + [Section: sectionType=1, startSym=2, numSym=12, startPrbc=0, numPrbc=8, beamId=12, ef=0]. 동시에 같은 좌표로 SE 1을 붙여 빔 가중치까지 직접 내려보낸다면 ef=1로 설정하고 뒤에 SE 1 페이로드(가중치 16개 × 12+12 bits)를 추가.",
    realWorldUseCases: [
      "스마트폰 YouTube 4K 스트리밍 → 연속된 슬롯마다 ST 1 PDSCH 다발",
      "FWA CPE의 대용량 UL 업로드 → ST 1 PUSCH",
      "Massive MIMO 환경에서 64 안테나로 동시 MU-MIMO → ST 1 + SE 10 + SE 11",
    ],
  },

  2: {
    oneLine: "예약된 Section Type 번호. 현재 정의된 동작 없음.",
    analogy: "메뉴판의 '준비 중인 메뉴' 자리. 자리만 비워두고 미래 추가를 기다리는 상태.",
    whatItIs:
      "Section Type 2는 O-RAN.WG4.TS.CUS 스펙에서 향후 확장을 위해 예약된 번호입니다. 현재 구현/사용되지 않으며, ST 2를 보내거나 받는 경로를 코드에 만들 필요가 없습니다.",
    whenUsed: ["현 시점 사용 없음"],
    howItFlows: [],
    keyFields: [],
    relatedExts: [],
    pitfalls: ["sectionType=2를 우연히 보내지 않도록 인코더에서 방어 코드를 두는 게 안전합니다."],
    workedExample: "해당 없음.",
    realWorldUseCases: [],
  },

  3: {
    oneLine: "PRACH(랜덤 액세스) 또는 누메롤로지가 섞인 채널 전용 스케줄링.",
    analogy:
      "공연 입장 시간에 '잠깐, 새 손님 입장 라인 열어주세요'라고 외치는 신호. 본 공연(ST 1) 와는 다른 시간 단위로 잠시 들어오는 흐름.",
    whatItIs:
      "ST 3은 두 가지 시나리오를 동시에 다룹니다.\n\n(1) **PRACH 처리**: UE가 셀에 처음 붙을 때 보내는 PRACH preamble은 일반 데이터 채널과 다른 SCS·필터·시간 단위를 씁니다. ST 1로는 그 차이를 충분히 표현할 수 없어서 ST 3이 따로 정의되었습니다.\n\n(2) **혼합 누메롤로지(mixed numerology)**: 한 메시지에 SCS가 다른 영역이 섞일 때, 각 영역의 freqOffset과 numerology를 명시적으로 표현. 만약 ST 1로 표현하려 했다면 freqOffset이 다를 때마다 따로 C-plane 메시지를 보내야 해서 시그널링 오버헤드가 컸을 것입니다. ST 3이 이를 한 번에 묶어 줄여줍니다.\n\n일부 RU 구현은 ST 3을 PRACH 전용으로만 지원합니다. mixed numerology까지는 옵션적으로 구현됩니다.",
    whenUsed: [
      "UE가 새로 셀에 붙어 PRACH preamble을 보내는 시점 (셀 검색/핸드오버)",
      "주기적 PRACH 윈도우 (configurable)",
      "PUSCH가 더 큰 SCS, PRACH가 작은 SCS처럼 한 슬롯에 numerology가 섞인 환경",
    ],
    howItFlows: [
      "O-DU가 PRACH 발생 가능 시간/주파수 윈도우를 미리 계산.",
      "ST 3 C-plane 메시지를 RU에 송신: PRACH 필터, freqOffset, 시간 좌표.",
      "RU는 그 시간에 RF를 그 주파수에 맞춰 두고, PRACH preamble 수신을 대기.",
      "UE가 random access preamble을 송신.",
      "RU는 수신 IQ를 U-plane으로 DU에 보내고, DU가 preamble 탐지·시간 추정.",
    ],
    keyFields: [
      { name: "filterIndex", plain: "PRACH 필터 종류(Format 0/1/2/3, 길이 등)", example: "1", bits: "4" },
      { name: "freqOffset", plain: "기준 누메롤로지 대비 주파수 오프셋(서브캐리어 단위)", bits: "24" },
      { name: "frameStructure", plain: "PRACH 프레임 구조 (SCS·CP 등)", bits: "8" },
      { name: "cpLength", plain: "Cyclic prefix 길이" },
    ],
    relatedExts: [
      { id: 10, why: "PRACH 수신을 위해 안테나 포트를 그룹으로 묶을 때" },
    ],
    pitfalls: [
      "PRACH preamble은 데이터 채널보다 훨씬 긴 시퀀스라 numSymbol이 클 수 있음. RU의 수신 윈도우와 정렬 필수.",
      "mixed numerology 구현은 옵션이라 RU에 따라 거부될 수 있음. M-plane으로 capability 확인.",
    ],
    workedExample:
      "예: SCS 30kHz가 기본인 셀에서 PRACH는 1.25kHz SCS의 long preamble (Format 0)을 사용. ST 3 메시지에 filterIndex=Format0, freqOffset로 PRACH 슬롯 시작 SC 위치, frameStructure로 SCS 정보 명시.",
    realWorldUseCases: [
      "지하철에서 UE가 새 셀로 핸드오버할 때 PRACH 송신",
      "IoT 디바이스 주기적 짧은 wake-up 후 random access",
    ],
  },

  4: {
    oneLine: "슬롯 레벨의 설정 명령을 RU에 전달하는 컨트롤 메시지 (Slot Level Configuration).",
    analogy:
      "공연 중 매 곡 사이에 콘솔이 스피커 셋업을 살짝 바꾸는 즉석 지시. 본 곡 자체가 아니라 곡 시작 전 RU에게 슬롯 단위로 환경을 맞춰 두라는 컨트롤.",
    whatItIs:
      "Section Type 4는 'Slot Level Configuration'을 위해 사용됩니다. 슬롯 단위로 RU에 적용되는 설정 정보를 운반합니다.\n\nST 4의 공통 헤더에는 filterIndex 대신 **scs**(sub-carrier spacing) 필드가 들어가는 것이 특이점입니다. 즉 이 슬롯에서 어떤 SCS로 동작할지를 명시.\n\n자세한 명령 인코딩과 적용 절차는 스펙 7.4.6(Table 7.4.6-1/2) 및 7.2.9 (Section Type 4 commands)를 참조하세요.",
    whenUsed: [
      "특정 슬롯에 대한 슬롯 레벨 설정이 필요한 경우",
      "참조: 스펙 7.2.9 (Section Type 4 commands)에서 사용 사례를 정리",
    ],
    howItFlows: [
      "O-DU가 슬롯 레벨 설정 변경 결정.",
      "ST 4 메시지 작성 (scs 필드 포함, 자원 좌표 사용 방식은 명령 정의에 따름).",
      "ACK 필요 시 SE 22를 첨부, RU는 ST 8(ACK/NACK)으로 응답.",
    ],
    keyFields: [
      { name: "dataDirection", plain: "방향 표시", bits: "1" },
      { name: "scs", plain: "Sub-carrier spacing (ST 4 헤더는 filterIndex 대신 scs를 사용)", bits: "4" },
      { name: "frameId / subframeId / slotId / startSymbolId", plain: "적용 슬롯 좌표" },
    ],
    relatedExts: [{ id: 22, why: "응답이 필요할 때 첨부" }],
    pitfalls: [
      "ST 4 헤더의 4비트가 ST 1과 달리 scs임에 주의 (filterIndex 아님).",
      "구체 명령 인코딩은 스펙 7.4.6 표의 Table 7.4.6-1/2를 반드시 확인.",
    ],
    workedExample:
      "예: 슬롯 N에 대한 슬롯 레벨 설정을 RU에 전달. 응답이 필요하면 SE 22로 ackNackReqId를 표시하고 RU가 ST 8(ACK/NACK)으로 회신.",
    realWorldUseCases: [
      "슬롯 단위 운용 파라미터 조정 (자세한 명령은 스펙 7.2.9 참조)",
    ],
  },

  5: {
    oneLine: "UE 단위로 '이 자원은 이 단말의 것'을 명시하는 스케줄링 메시지.",
    analogy:
      "큐 시트에 좌석번호가 적힌 줄. '02:30~03:00은 11번 좌석 손님 전용'처럼 자원을 사람(UE)에 묶음.",
    whatItIs:
      "ST 5는 ST 1과 비슷하게 데이터 채널을 스케줄하지만, **ueId**(UE 식별자)를 명시적으로 함께 운반합니다.\n\n왜 따로 있느냐? UE 기반 빔포밍(UE-BF), MU-MIMO 페어링, UE 단위 널링(SE 14) 같은 동작은 'O-RU가 어떤 UE에 대해 작업하는지'를 알아야 합니다. ST 1만으로는 ueId가 없으므로(beamId만 있음), UE 단위 가중치 적용·UE 채널 정보 활용 같은 작업이 어려웠습니다.\n\nST 5는 'UE-aware한 RU 처리'를 가능하게 만드는 컨트롤이라고 보면 됩니다. ST 1 + ueId 정도로 단순히 생각해도 좋습니다.",
    whenUsed: [
      "MU-MIMO: 같은 자원을 여러 UE에 동시에 보낼 때 (UE 단위 가중치 차별화 필요)",
      "UE 단위 빔포밍 (SE 11 + SE 14)",
      "UE별 채널 정보(ST 6)를 활용한 정밀 빔",
    ],
    howItFlows: [
      "O-DU가 ST 6 등으로 UE의 채널을 알고 있음.",
      "이를 바탕으로 UE별 가중치/널을 계산.",
      "ST 5 C-plane으로 (좌표 + ueId + SE 11 가중치 또는 SE 14 널)을 RU에 송신.",
      "RU는 UE별로 다른 빔포밍을 적용해 같은 자원에 동시 송신 (MU-MIMO).",
    ],
    keyFields: [
      { name: "ueId", plain: "이 Section이 가리키는 UE의 내부 핸들", bits: "15" },
      { name: "beamId", plain: "기본 빔 인덱스 (가중치 없이 쓸 때)", bits: "15" },
      { name: "ef", plain: "보통 1로 두고 뒤에 UE-BF 관련 SE를 줄줄이 붙임" },
    ],
    relatedExts: [
      { id: 11, why: "SE 11 — UE 단위 유연한 빔 가중치" },
      { id: 14, why: "SE 14 — 다른 UE 방향에 널 형성" },
      { id: 16, why: "SE 16 — 안테나 포트 매핑" },
      { id: 17, why: "SE 17 — 유저 포트 그룹 표시" },
    ],
    pitfalls: [
      "ueId 매핑은 O-DU와 O-RU가 합의해 둔 내부 ID. M-plane으로 사전 동기화되어 있어야 함.",
      "MU-MIMO 페어링 알고리즘이 잘못되면 ST 5 + SE 14를 보내도 간섭이 줄지 않을 수 있음.",
    ],
    workedExample:
      "예: 같은 PRB 8~15, sym 2~13을 UE-A(beam steer 18°)와 UE-B(steer -30°)에 동시에 송신. ST 5 Section 두 개를 한 메시지에 담고, 각 Section에 SE 11로 16개 안테나 가중치, SE 14로 상대 UE 방향 널을 명시.",
    realWorldUseCases: [
      "Massive MIMO 셀에서 동시 8 UE 서빙",
      "고밀집 환경(스타디움)에서 사용자 분리 빔",
    ],
  },

  6: {
    oneLine: "UE의 채널 상태(추정 결과)를 O-DU↔O-RU 사이에 명시적으로 운반.",
    analogy:
      "음향팀이 좌석별 음향 측정 결과를 콘솔에 다시 올려주는 보고서. 다음 곡을 어떻게 들려줄지 결정하는 입력 자료.",
    whatItIs:
      "ST 6은 'channel information' Section Type입니다. UE↔RU 사이 무선 채널은 시간/주파수에 따라 변하므로, 좋은 빔/MIMO를 하려면 채널을 알아야 합니다. ST 6은 그 채널 추정 결과(H 또는 압축본)를 운반합니다.\n\n방향은 보통 **O-RU → O-DU**: RU가 SRS나 DMRS에서 추정한 채널을 DU에 보고. DU는 이를 받아 다음 슬롯의 빔 가중치/프리코더를 계산. 그 결과가 다시 ST 5 + SE 11 등으로 RU에 내려가 빔이 형성됩니다.\n\n채널 정보는 데이터 양이 크기 때문에 O-DU가 SE 27(차원 축소)·SE 28(주파수 해상도 제어)로 보고량을 줄이도록 지시할 수 있습니다.",
    whenUsed: [
      "UE 단위 빔포밍/MU-MIMO를 위한 채널 정보 수집",
      "SRS·DMRS 등에서 추정한 UE 채널 정보를 O-DU와 O-RU 사이에 운반",
      "MU-MIMO 페어링/프리코더 결정에 필요한 입력 자료",
    ],
    howItFlows: [
      "RU가 SRS 또는 DMRS 수신 후 채널 응답 H를 추정.",
      "H 또는 압축본을 ST 6 C-plane 메시지로 묶어 DU에 송신.",
      "DU가 H를 받아 다음 슬롯용 가중치 W를 계산 (예: MMSE).",
      "DU가 ST 1/ST 5 + SE 1/SE 11로 W를 RU에 다시 내려보냄.",
    ],
    keyFields: [
      { name: "numberOfUEs", plain: "이 메시지에 담긴 UE 수", bits: "8" },
      { name: "ueId", plain: "각 UE 식별자 (반복)" },
      { name: "ciCompHdr", plain: "채널 정보 압축 헤더 (bitwidth, method)", bits: "8" },
      { name: "channelInfoBlocks", plain: "압축된 채널 추정치 (가변 길이)" },
    ],
    relatedExts: [
      { id: 10, why: "다중 포트 그룹 설정" },
      { id: 16, why: "안테나 포트 매핑 (UE 채널정보 기반 UL BF)" },
      { id: 21, why: "PRB 그룹 크기 가변" },
      { id: 27, why: "O-DU 주도 차원 축소" },
      { id: 28, why: "SINR 보고 주파수 해상도 제어" },
    ],
    pitfalls: [
      "채널 정보는 양이 크므로 압축 없이 보내면 프론트홀이 막힐 수 있음. ciCompHdr 설정 필수.",
      "차원/해상도를 너무 줄이면 빔 품질이 떨어짐. SE 27/28로 트레이드오프 조정.",
    ],
    workedExample:
      "예: SRS 수신 후 32 안테나 × 100 PRB 채널 H를 추정. ST 6 + SE 27로 32×100 → 8 SVD 모드 × 25 PRB 그룹으로 차원 축소, 9비트 IQ 압축 적용. 메시지 크기가 1/10 수준으로 감소.",
    realWorldUseCases: [
      "Massive MIMO 셀의 정밀 빔포밍을 위한 정기 채널 보고",
      "고속 이동 UE의 빠른 채널 변화 추적",
    ],
  },

  7: {
    oneLine: "비면허 대역(LAA/NR-U)에서 LBT 결과를 RU와 DU가 협의하기 위한 메시지.",
    analogy:
      "공용 회의실 들어가기 전에 '비었나요?' 확인하고 '비었습니다, 들어가세요'라고 답하는 절차의 통신.",
    whatItIs:
      "ST 7은 LAA(Licensed Assisted Access) 또는 NR-U에서 사용됩니다. 5GHz/6GHz 같은 비면허 대역은 Wi-Fi 등과 공유하므로 송신 전에 채널이 비어 있는지(LBT) 확인해야 합니다.\n\nLBT는 RU의 RF가 실제로 수행해야 합니다(라디오에 가까이 있어야 정확). 그래서 'DU가 LBT를 요청 → RU가 측정 후 결과 응답' 구조가 필요하고, 이 협의가 ST 7으로 표현됩니다.",
    whenUsed: [
      "NR-U 캐리어에서 매 송신 윈도우 시작 전",
      "LAA 셀에서 채널 가용성 확인 시",
    ],
    howItFlows: [
      "O-DU가 ST 7로 LBT_DL_REQ 송신 (CW 설정 포함).",
      "O-RU가 LBT 수행 후 결과를 ST 7 LBT_DL_RSP로 응답.",
      "성공 시 O-DU가 ST 1로 실제 데이터 송신 시작.",
    ],
    keyFields: [
      { name: "laaMsgType", plain: "LBT_DL_REQ, LBT_DL_RSP 등" },
      { name: "lbtCwConfig", plain: "Contention Window 설정" },
      { name: "lbtOffset", plain: "송신 시작 오프셋" },
    ],
    relatedExts: [],
    pitfalls: [
      "ST 7 응답이 늦으면 송신 윈도우를 놓침. 프론트홀 지연 마진 확보 필요.",
      "LBT 실패 시 ST 1을 보내지 말 것 (RU가 거부할 수 있음).",
    ],
    workedExample: "예: NR-U 5GHz 캐리어에서 매 1ms마다 LBT 시도. 성공률에 따라 ST 1 PDSCH 발사가 결정됨.",
    realWorldUseCases: ["기업/실내 5GHz NR-U 셀", "공공 Wi-Fi 대역 활용 5G"],
  },

  8: {
    oneLine: "O-RU가 받은 컨트롤 명령에 대해 O-DU로 ACK/NACK 응답을 보내는 Section Type.",
    analogy: "'잘 받았습니다' / '못 받았습니다' 회신. 본 곡과는 무관한 짧은 응답 신호.",
    whatItIs:
      "Section Type 8은 O-RU가 O-DU로 ACK/NACK feedback을 보내는 데 사용됩니다 (스펙 7.4.10). SE 22(ACK/NACK request)가 첨부된 컨트롤 메시지를 받은 RU가 그 처리 결과를 ST 8로 응답합니다.\n\n정확한 필드 구성은 스펙 7.4.10 Table 7.4.10-1을 참조하세요.",
    whenUsed: [
      "SE 22 ACK 요청이 첨부된 컨트롤 메시지에 대한 응답",
      "RU가 명령을 거부했을 때 NACK 회신",
    ],
    howItFlows: [
      "O-DU가 컨트롤 명령(예: ST 4) + SE 22 송신.",
      "O-RU가 명령을 적용/검증.",
      "O-RU가 ST 8로 ACK 또는 NACK 응답.",
      "O-DU가 ID 매칭으로 응답을 원래 명령과 짝지움.",
    ],
    keyFields: [
      { name: "dataDirection", plain: "방향 표시", bits: "1" },
      { name: "frameId / subframeId / slotId", plain: "응답 대상 시점 좌표" },
      { name: "참조", plain: "정확한 필드 구성은 스펙 7.4.10 Table 7.4.10-1" },
    ],
    relatedExts: [{ id: 22, why: "ACK/NACK 요청을 트리거한 SE" }],
    pitfalls: [
      "ACK 매칭 키와 타임아웃 처리를 DU 측 워치독에 반드시 구현.",
      "ST 8을 자원 점유 메시지로 오해하지 말 것 — 컨트롤 응답.",
    ],
    workedExample:
      "O-DU가 ST 4 + SE 22를 보냄 → O-RU가 명령 적용 후 ST 8로 ACK 응답.",
    realWorldUseCases: ["신뢰성이 필요한 슬롯 레벨 명령(ST 4)의 응답"],
  },

  9: {
    oneLine: "O-RU가 등화 후 측정한 SINR을 O-DU에 보고 (DMRS-BF-EQ 전용).",
    analogy:
      "음향팀이 곡이 끝난 뒤 좌석별 '음 잘 들렸나요? 잡음이 얼마나 됐어요?'를 콘솔에 올리는 측정 보고서.",
    whatItIs:
      "Section Type 9는 O-RU가 등화(equalization) 후 측정한 post-equalization SINR을 O-DU로 보고하는 데 사용됩니다 (스펙 7.4.11). DMRS 기반 빔포밍 + 등화(DMRS-BF-EQ)에 적용됩니다.\n\n특이한 점: ST 9의 Section 헤더 구조와 파라미터가 **U-Plane 메시지와 동일**합니다 (몇 개 필드는 사용 제한 있음). 두 가지 보고 모드를 지원합니다 — 주파수 다중값 보고(Table 7.4.11-1, CP-OFDM/DFT-s-OFDM)와 Section당 단일 값 보고(Table 7.4.11-2, DFT-s-OFDM).\n\nSINR 보고 자체에 대한 자세한 절차는 스펙 7.2.11을 참조하세요.",
    whenUsed: [
      "DMRS-BF-EQ 동작 중 등화 품질을 DU에 보고할 때",
      "주파수 영역에서 정밀한 SINR 분포가 필요한 경우(다중값)",
      "메시지 크기를 최소화해야 할 경우(단일값)",
    ],
    howItFlows: [
      "O-RU가 PUSCH 수신·등화 후 post-equalization SINR 측정.",
      "Section마다 또는 주파수 빈마다 SINR 값을 채워 ST 9 메시지 생성.",
      "O-RU → O-DU 송신.",
      "O-DU가 SINR을 활용해 후속 MCS/스케줄링 결정.",
    ],
    keyFields: [
      { name: "dataDirection", plain: "항상 0(uplink)", bits: "1" },
      { name: "참조", plain: "정확한 필드 구성과 SINR 인코딩은 스펙 7.4.11 Table 7.4.11-1/2" },
    ],
    relatedExts: [
      { id: 27, why: "차원 축소로 보고량 절감" },
      { id: 28, why: "SINR 보고 주파수 해상도 제어" },
    ],
    pitfalls: [
      "ST 9 헤더는 U-Plane 헤더와 같은 모양이라 디코더에서 구분이 까다로움. sectionType=9를 우선 확인.",
      "DMRS-BF-EQ 미지원 RU에 보내지 말 것.",
    ],
    workedExample:
      "100 PRB PUSCH 등화 후 PRB 그룹별 SINR을 ST 9(다중값 보고)로 송신. SE 28로 해상도를 10-PRB 단위로 줄여 메시지 크기 절감.",
    realWorldUseCases: [
      "DMRS-BF-EQ 동작 중 정밀 등화 품질 모니터링",
      "MCS 적응을 위한 등화 후 채널 품질 추적",
    ],
  },

  10: {
    oneLine: "O-RU가 수행한 RRM 측정 결과를 O-DU에 보고 (O-RU → O-DU).",
    analogy:
      "셀의 자원 상태와 간섭 수준을 정기 보고하는 측정 리포트. '저 자원 영역은 비어 있고, 백그라운드 잡음은 이만큼이었다'.",
    whatItIs:
      "Section Type 10은 O-RU가 RRM(Radio Resource Management) 측정 결과를 O-DU에 보고하는 데 사용됩니다 (스펙 7.4.12). dataDirection은 항상 0(uplink).\n\nRRM 측정은 셀의 무선 자원 상태를 파악하는 작업입니다 — 예를 들어 미할당 PRB에서의 IpN(Interference plus Noise) 같은 값. DU의 스케줄러는 이 측정치로 더 좋은 자원 할당을 결정합니다.\n\nST 10의 정확한 필드 구성과 지원 측정 종류는 스펙 7.4.12 Table 7.4.12-1을 참조하세요.",
    whenUsed: [
      "O-DU가 ST 11(RRM measurement request)로 측정을 요청했을 때 그 응답",
      "정기 RRM 보고가 설정되어 있을 때",
    ],
    howItFlows: [
      "O-DU가 ST 11로 측정 요청 (또는 사전 설정으로 정기 보고).",
      "O-RU가 측정 수행 (예: 미할당 PRB IpN).",
      "O-RU가 ST 10에 결과를 담아 O-DU로 송신.",
    ],
    keyFields: [
      { name: "dataDirection", plain: "항상 0(uplink) 값으로 설정", bits: "1" },
      { name: "참조", plain: "측정 종류·인코딩은 스펙 7.4.12 Table 7.4.12-1" },
    ],
    relatedExts: [],
    pitfalls: ["ST 10은 보고(response), ST 11이 요청(request). 혼동 주의."],
    workedExample:
      "O-DU가 ST 11로 '미할당 PRB의 IpN을 알려달라' 요청 → O-RU가 측정 후 ST 10으로 IpN 결과 보고.",
    realWorldUseCases: [
      "셀 간섭 모니터링과 스케줄링 적응",
      "용량 계획을 위한 RRM 통계 수집",
    ],
  },

  11: {
    oneLine: "O-DU가 O-RU에 RRM 측정을 요청하는 Section Type (O-DU → O-RU).",
    analogy:
      "음향팀에게 '비어 있는 좌석 영역의 배경 소음을 좀 측정해주세요'라고 보내는 요청.",
    whatItIs:
      "Section Type 11은 O-DU가 O-RU에 RRM 측정을 요청하는 데 사용됩니다 (스펙 7.4.13). 대표적으로 미할당 PRB의 IpN(Interference plus Noise) 측정 요청을 지원합니다. dataDirection은 0(uplink)로 설정.\n\nO-RU는 요청을 받아 측정한 뒤 ST 10(RRM measurement report)으로 응답합니다.\n\n정확한 명령/파라미터 인코딩은 스펙 7.4.13 Table 7.4.13-1을 참조하세요.",
    whenUsed: [
      "O-DU가 특정 시점·자원에 대한 RRM 측정이 필요할 때",
      "미할당 PRB의 IpN을 알아내려고 할 때",
    ],
    howItFlows: [
      "O-DU가 ST 11로 측정 요청 (대상 자원/시간 명시).",
      "O-RU가 요청된 측정을 수행.",
      "O-RU가 ST 10으로 결과 보고.",
    ],
    keyFields: [
      { name: "dataDirection", plain: "0(uplink)로 설정", bits: "1" },
      { name: "참조", plain: "스펙 7.4.13 Table 7.4.13-1" },
    ],
    relatedExts: [],
    pitfalls: [
      "ST 11은 요청, ST 10은 응답. 헷갈리지 말 것.",
      "측정 시점이 미래 슬롯이라면 충분한 처리 마진 확보 필수.",
    ],
    workedExample:
      "셀 부하 모니터링용으로 매 100ms마다 ST 11로 '미할당 PRB IpN' 요청 → O-RU가 ST 10으로 회신.",
    realWorldUseCases: [
      "Adaptive scheduling을 위한 간섭 측정",
      "SON/RRM 알고리즘 입력 수집",
    ],
  },
};

// =====================================================================
//                       Section Extensions
// =====================================================================
//
// Note: To keep this file manageable, only the most frequently-touched
// extensions have a full narrative below. The remaining ones inherit
// sensible defaults built in the page from the `curated.ts` metadata.

export const SE_NARRATIVES: Record<number, SENarrative> = {
  1: {
    oneLine: "사전 정의된 beamId 대신 빔 가중치(W)를 직접 메시지에 실어 보내는 확장.",
    analogy: "조명 프리셋 번호 대신 '각 조명에 이만큼 밝기, 이 색'을 한 번에 묶어서 던지는 것.",
    whatItIs:
      "SE 1은 '실시간 가변 빔포밍'의 핵심 도구입니다. O-DU가 채널 정보로 계산한 가중치 W(복소수)를 안테나 수만큼 배열로 만들어 SE 1 페이로드에 실어 RU에 보냅니다.\n\nbeamId는 RU에 미리 학습된 빔만 쓸 수 있다는 제약이 있는데, SE 1은 그 제약이 없습니다. 대신 메시지 크기가 커지므로 압축 헤더(bfwCompHdr)를 동봉합니다. 일반적으로 9비트 BFP(block floating point) 같은 압축이 사용됩니다.",
    whenUsed: ["채널 정보(SRS) 기반 reciprocity 빔포밍", "동적 환경 빔 트래킹", "MU-MIMO UE별 다른 빔"],
    payload: [
      { name: "bfwCompHdr", plain: "가중치 압축 헤더 (bitwidth, method)", bits: "8" },
      { name: "numBfw", plain: "포함된 가중치 수 (= 안테나/포트 수)", bits: "8" },
      { name: "bfwI", plain: "가중치 실수부 (반복)", bits: "보통 9~12" },
      { name: "bfwQ", plain: "가중치 허수부 (반복)", bits: "보통 9~12" },
    ],
    pairWith: [
      { stId: 1, why: "가장 흔함. PDSCH/PUSCH에 가중치 직접 적용" },
      { stId: 5, why: "ueId별 가중치 (MU-MIMO)" },
      { stId: 8, why: "일반 빔포밍" },
      { stId: 6, why: "채널 정보 보고에 관련 가중치 동봉" },
    ],
    pitfalls: [
      "압축 설정이 RU와 일치하지 않으면 가중치가 깨짐. M-plane으로 사전 합의 필수.",
      "안테나 수가 많을수록 메시지 비대해짐 → SE 11(flexible) 또는 SE 19(compact) 고려.",
    ],
    workedExample: "예: 16-안테나 어레이 + 4 레이어 → 64개 복소수 가중치 = 64 × (9+9) = 1152 비트. SE 1 페이로드로 부착.",
  },
  6: {
    oneLine: "비트맵으로 비연속 PRB를 표현 — 인터리브 할당이나 펑처링된 PRB 패턴 전달.",
    analogy: "좌석 배치도에 '체크 표시된 좌석만 우리 손님'이라고 표시하는 비트맵.",
    whatItIs:
      "SE 6은 RBG(Resource Block Group) 단위 비트맵을 운반합니다. PRB 영역이 연속이 아닌 경우 — 예: '0~3, 8~11, 16~19'처럼 띄엄띄엄 — Section 헤더의 (startPrbc, numPrbc)만으로는 표현이 어렵습니다. 그래서 SE 6의 rbgMask 비트맵으로 사용 RBG를 표시합니다.",
    whenUsed: ["주파수 인터리브 할당", "CRS/SSB 충돌 회피로 일부 RBG 펑처링", "DSS에서 LTE 영역을 비울 때"],
    payload: [
      { name: "rbgSize", plain: "비트맵 한 비트가 표현하는 PRB 수", bits: "4" },
      { name: "rbgMask", plain: "사용 RBG 비트맵", bits: "28" },
      { name: "priority", plain: "우선순위", bits: "2" },
      { name: "symbolMask", plain: "각 심볼별 사용 여부", bits: "14" },
    ],
    pairWith: [
      { stId: 1, why: "비연속 PDSCH/PUSCH 할당" },
      { stId: 3, why: "PRACH 인접 자원 회피" },
      { stId: 5, why: "ueId별 비연속 PRB" },
    ],
    pitfalls: ["rbgSize와 rbgMask 비트수의 곱이 실제 numPrbc와 맞아야 함."],
    workedExample: "예: rbgSize=4, rbgMask=0b1010_1010_1010_1010 → PRB 0~3, 8~11, 16~19, ... 짝수 RBG만 사용.",
  },
  11: {
    oneLine: "큰 안테나 어레이용 가변 길이 빔 가중치 표현 (SE 1의 확장형).",
    analogy: "SE 1이 표준 크기 봉투라면 SE 11은 가변 길이 봉투. 안테나가 많을수록 SE 11이 효율적.",
    whatItIs:
      "SE 11은 SE 1과 비슷하지만 가중치 묶음 길이를 더 유연하게 표현합니다. Massive MIMO처럼 안테나가 32/64개 이상일 때, SE 1보다 SE 11이 헤더 오버헤드를 줄일 수 있습니다.",
    whenUsed: ["Massive MIMO (≥32 안테나)", "PRB 그룹 단위 가중치 적용 (PRG)"],
    payload: [
      { name: "extendedNumBundPrb", plain: "묶음 PRB 수 (확장형)", bits: "8" },
      { name: "bfwCompHdr", plain: "가중치 압축 헤더", bits: "8" },
      { name: "numBundPrb", plain: "묶음 안의 PRB 수", bits: "8" },
      { name: "bfwI/bfwQ", plain: "복소수 가중치 (반복)" },
    ],
    pairWith: [
      { stId: 1, why: "큰 어레이에서 PDSCH 가중치" },
      { stId: 5, why: "UE-BF (ueId 단위)" },
      { stId: 8, why: "일반 빔포밍" },
    ],
    pitfalls: ["bundleOffset 처리가 RU 펌웨어 버전에 따라 다를 수 있음. 호환성 매트릭스 확인 권장."],
    workedExample: "예: 64 안테나 × 100 PRB → 4-PRB 묶음 = 25 묶음 × 64 가중치, SE 11로 압축 전송.",
  },
  14: {
    oneLine: "특정 UE 방향에 '널(0)'을 만들어 간섭을 줄이는 nulling layer 정보.",
    analogy: "여러 사람을 향해 동시에 소리치되, 한 사람에게는 그 소리가 닿지 않게 입 모양을 만드는 것.",
    whatItIs:
      "SE 14는 UE 기반 빔포밍에서 '이 레이어는 특정 방향으로 0이 되게 가중치를 설계해주세요'를 표현합니다. MU-MIMO에서 같은 자원에 묶인 다른 UE에게 간섭을 만들지 않기 위해 사용합니다.",
    whenUsed: ["MU-MIMO 페어 UE 간 간섭 회피", "인접 셀 UE에게 간섭 안 주려고 (CoMP-like)"],
    payload: [
      { name: "nullLayerInd", plain: "널을 만들 레이어 인덱스", bits: "4" },
      { name: "antPortBitmap", plain: "사용 안테나 포트", bits: "16" },
    ],
    pairWith: [
      { stId: 5, why: "ueId-BF에서 다른 UE 방향 널" },
      { stId: 1, why: "특정 PRB만 널링" },
      { stId: 11, why: "PUSCH UL 널링" },
    ],
    pitfalls: ["널이 너무 깊으면 의도 빔 이득도 일부 줄어듦. 정규화(SE 8) 동반 권장."],
    workedExample: "예: 같은 자원에 UE-A(steer 18°), UE-B(steer -25°) 동시 송신 시 UE-A 가중치에 SE 14로 -25° 널 명시.",
  },
  22: {
    oneLine: "이 컨트롤 명령에 대해 ACK/NACK 응답을 달라고 요청.",
    analogy: "택배 송장 옆에 '수령 확인 사인 필수' 도장. 보낸 측이 받았는지 확인하고 싶을 때.",
    whatItIs:
      "SE 22는 보통 ST 4 같은 슬롯 단위 명령에 첨부됩니다. 명령이 RU에 잘 적용됐는지 확인이 필요한 경우, SE 22로 응답을 요청하면 RU가 같은 ID로 ST 9 응답을 돌려보냅니다.",
    whenUsed: ["LBT 명령처럼 즉시 확인이 필요한 ST 4 명령", "안테나 상태 변경(ASM)"],
    payload: [{ name: "ackNackReqId", plain: "응답에 사용할 식별자", bits: "16" }],
    pairWith: [{ stId: 4, why: "거의 항상 ST 4와 짝" }],
    pitfalls: ["요청해놓고 응답 타임아웃 처리를 안 해두면 망가짐. 워치독 필수."],
    workedExample: "ST 4 cmd id=42 + SE 22 ackNackReqId=42 → RU가 ST 9 ackNackId=42, ackNack=1.",
  },
};

export function getSTNarrative(id: number): STNarrative | undefined {
  return ST_NARRATIVES[id];
}

export function getSENarrative(id: number): SENarrative | undefined {
  return SE_NARRATIVES[id];
}
