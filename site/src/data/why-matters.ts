/**
 * "왜 쓰이는지" 직관 박스 데이터.
 *
 * 각 ST/SE에 대해 비포(없다면)·애프터(있으면)·실제 영향을 짝지어 적어
 * 신입사원이 한 번에 이 메시지의 존재 이유를 체감하도록 돕는다.
 */

export interface WhyMatters {
  trigger: string;
  withoutThis: string;
  withThis: string;
  realImpact: string;
}

export const ST_WHY: Record<number, WhyMatters> = {
  0: {
    trigger: "TDD 슬롯 사이 송수신 전환이나 외부 시스템과의 자원 양보가 필요한 순간",
    withoutThis:
      "O-RU는 자기 자원이 어디까지인지 모르므로 외부 충돌 영역에서도 PA를 켜고 있을 수 있습니다. 인접 셀과의 전파 간섭, 불필요한 전력 소비, DSS LTE 영역 침범 같은 문제가 발생합니다.",
    withThis:
      "O-DU가 '이 사각형 영역은 우리가 쓰지 않습니다' 라고 명시해 RU가 PA를 끄거나 송수신 회로를 전환 모드로 둘 수 있습니다. 인접 셀·외부 시스템과의 공존이 깔끔해집니다.",
    realImpact:
      "TDD에서 DL→UL 전환 갭이 안 잡히면 RU가 자기 송신 신호를 수신단으로 흘려보내 UL 데이터가 망가집니다. ST 0이 그 가드 구간을 RU에 알리는 가장 직접적인 수단입니다.",
  },
  1: {
    trigger: "사용자가 영상 스트리밍·웹사이트 로딩·게임 데이터 같은 일반 트래픽을 주고받는 매 슬롯",
    withoutThis:
      "O-RU는 '지금 슬롯에 누구 데이터를, 어느 PRB에, 어느 빔으로 보내야 할지'를 알 수 없습니다. U-plane으로 IQ가 와도 어디에 매핑할지 모르므로 전부 폐기됩니다. 결과적으로 셀의 데이터 전송이 정지됩니다.",
    withThis:
      "O-DU의 스케줄링 결과(시간/주파수 좌표, 빔)를 RU에 명확히 전달해 U-plane IQ가 정확한 자원에 자리잡고, 빔이 UE 쪽을 향하도록 형성됩니다.",
    realImpact:
      "ST 1이 한 슬롯이라도 누락되면 그 슬롯의 PDSCH/PUSCH는 전혀 송수신되지 않습니다. 사용자는 데이터 끊김으로 체감하고, 스케줄러는 HARQ 재전송 부담이 누적됩니다.",
  },
  2: {
    trigger: "(예약된 번호 — 향후 확장 대비)",
    withoutThis: "현재 정의된 동작이 없어 영향이 없습니다.",
    withThis: "스펙 진화 시 새로운 메시지 의미를 부여할 여지를 남겨둡니다.",
    realImpact: "구현체는 sectionType=2를 수신하면 안전하게 무시하거나 에러로 처리해야 합니다.",
  },
  3: {
    trigger: "UE가 셀에 새로 접속하기 위해 PRACH preamble을 보내는 순간 (셀 검색, 핸드오버)",
    withoutThis:
      "PRACH는 일반 데이터 채널과 다른 SCS·시퀀스 길이를 씁니다. ST 1만 있으면 그 누메롤로지 차이를 표현할 수 없어, PRACH 윈도우마다 별도 메시지를 여러 번 보내야 하고 RU가 정확한 시점에 RF를 맞추기 어렵습니다.",
    withThis:
      "freqOffset, frameStructure, cpLength 등을 한 메시지로 묶어 RU에 알릴 수 있습니다. PRACH 수신 윈도우가 정확히 잡히고 mixed-numerology 시나리오도 효율적으로 처리됩니다.",
    realImpact:
      "ST 3이 없으면 UE 초기 접속 성공률이 떨어지고 RACH 시도가 반복돼 배터리·지연·시그널링 트래픽이 늘어납니다.",
  },
  4: {
    trigger: "슬롯 단위로 RU의 운용 모드를 조정해야 할 때 (예: SCS 명시, 슬롯 컨피그 변경)",
    withoutThis:
      "RU의 슬롯 레벨 설정을 O-DU 측에서 동기화할 수단이 없어 자원 할당과 RU 동작이 어긋날 수 있습니다.",
    withThis:
      "O-DU가 슬롯 레벨 설정을 RU에 직접 지시할 수 있고, 필요하면 SE 22로 응답까지 받아 신뢰성을 보장합니다.",
    realImpact:
      "운용 환경에서 슬롯 단위 컨피그가 안정적으로 적용되어 셀 동작 모드 전환이 매끄러워집니다.",
  },
  5: {
    trigger: "여러 UE를 같은 시간·주파수 자원에 동시 서빙해야 할 때 (MU-MIMO, UE 단위 빔포밍)",
    withoutThis:
      "ST 1만 있으면 'PRB 0~7은 누구 빔으로'까지만 표현되고 'PRB 0~7은 UE-A의 것'은 명시되지 않습니다. UE 단위 가중치·널·차별 처리가 사실상 불가능합니다.",
    withThis:
      "ueId를 함께 전달해 RU가 'PRB 0~7 + UE-A + 가중치 W_A' 같이 UE-aware 처리를 할 수 있습니다. MU-MIMO로 같은 자원에 여러 UE를 동시에 묶어 셀 용량을 배로 늘릴 수 있습니다.",
    realImpact:
      "ST 5 + SE 11/14가 없으면 Massive MIMO의 핵심인 동시 다중 UE 서빙이 불가능합니다. 사용자 1인당 평균 속도와 셀 총 처리량이 모두 크게 떨어집니다.",
  },
  6: {
    trigger: "O-DU가 다음 슬롯의 빔/프리코더를 결정해야 하는 순간, 채널 상태가 필요한 모든 경우",
    withoutThis:
      "DU는 채널 H를 알 수 없으니 항상 보수적인 빔만 쓰게 됩니다. Reciprocity 기반 빔포밍·정밀 MU-MIMO 페어링 같은 고급 동작이 모두 불가능합니다.",
    withThis:
      "RU가 측정한 채널 H를 압축·차원 축소한 형태로 DU에 운반합니다. DU는 최신 채널에 맞춰 W를 계산해 정밀 빔을 RU로 다시 내려줄 수 있습니다.",
    realImpact:
      "ST 6 누락이 누적되면 빔이 부정확해지고 SINR 하락·MCS 하향·처리량 저하로 직결됩니다. 특히 고속 이동 UE에 더 큰 영향이 갑니다.",
  },
  7: {
    trigger: "5GHz/6GHz 같은 비면허 대역(NR-U / LAA)에서 송신 직전 채널 가용성 확인이 필요한 순간",
    withoutThis:
      "RU가 LBT 없이 송신하면 Wi-Fi 등 공존 시스템에 큰 간섭을 일으키고 규정 위반이 됩니다. 반대로 LBT 결과를 DU가 모르면 송신 시작 시점을 못 맞춥니다.",
    withThis:
      "DU↔RU 사이에 LBT 요청/응답이 표준화돼 RU가 측정한 결과가 DU의 스케줄링에 즉시 반영됩니다.",
    realImpact:
      "비면허 대역에서 안정적인 공존이 가능해져 NR-U/LAA 셀의 송신 성공률이 올라가고 인접 Wi-Fi 사용자에 대한 영향이 최소화됩니다.",
  },
  8: {
    trigger: "신뢰성이 요구되는 컨트롤 명령(예: ST 4의 슬롯 레벨 설정)이 RU에 잘 적용됐는지 DU가 확인해야 할 때",
    withoutThis:
      "DU는 RU가 명령을 받고 적용했는지 알 수 없습니다. RU가 명령을 거부했거나 처리하지 못한 채로 다음 슬롯을 진행하면 셀이 잘못된 상태에서 동작하게 됩니다.",
    withThis:
      "RU가 ACK/NACK를 회신해 DU의 워치독이 명령 적용 여부를 추적할 수 있습니다. NACK이면 재시도 또는 알람.",
    realImpact:
      "Critical config 명령(예: DSS 자원 변경, 안테나 모드 전환)이 누락 없이 일관되게 적용돼 셀 운용 안정성이 올라갑니다.",
  },
  9: {
    trigger: "DMRS-BF-EQ 동작 중 등화 후 신호 품질을 DU가 확인하고 다음 MCS/스케줄링에 반영해야 할 때",
    withoutThis:
      "DU는 RU 내부에서 등화된 결과의 품질(SINR)을 모르므로 MCS 선택이 보수적으로 됩니다. 가능 처리량을 다 못 끌어냅니다.",
    withThis:
      "주파수별 또는 Section별 post-eq SINR을 DU가 받아 MCS·재전송 결정을 정밀화합니다.",
    realImpact:
      "동일 채널 환경에서도 적응적 MCS로 처리량을 5~20% 추가 끌어올릴 여지가 생기고, 재전송 빈도가 줄어 지연이 안정화됩니다.",
  },
  10: {
    trigger: "O-DU 스케줄러가 셀 자원 상태(예: 미할당 PRB의 간섭+잡음)를 알아야 할 때",
    withoutThis:
      "DU는 자원 영역별 간섭 수준을 알 수 없어 PRB 할당이 부정확해집니다. 특히 셀 간 간섭이 큰 환경에서는 사용자 체감이 급격히 나빠집니다.",
    withThis:
      "RU가 측정한 RRM 결과(IpN 등)가 DU에 전달돼 자원 할당 알고리즘의 입력으로 쓰입니다.",
    realImpact:
      "스케줄러가 간섭 적은 자원을 우선 골라 사용해 동일 조건에서 셀 처리량과 사용자 SINR이 개선됩니다.",
  },
  11: {
    trigger: "DU가 RU에 특정 자원·시점의 RRM 측정을 요청해야 할 때 (예: 미할당 PRB IpN)",
    withoutThis:
      "RRM 측정 요청 절차가 없으면 DU는 RU에서 어떤 측정도 능동적으로 끌어올 수 없고, 정적·주기적인 보고에만 의존하게 됩니다.",
    withThis:
      "필요한 시점에 정확한 측정을 명시적으로 요청하고 ST 10으로 결과를 받습니다. SON/RRM 알고리즘의 입력 품질이 향상됩니다.",
    realImpact:
      "Adaptive 스케줄링·셀 부하 모니터링·간섭 회피 등 운영 측면 알고리즘이 더 정확한 데이터를 가지고 동작합니다.",
  },
};

export const SE_WHY: Record<number, WhyMatters> = {
  1: {
    trigger: "사전 등록된 beamId만으론 표현 못 하는 동적·정밀 빔이 필요한 순간 (Reciprocity 기반 BF, 빔 트래킹)",
    withoutThis:
      "RU는 사전 학습된 빔 인덱스만 쓸 수 있습니다. UE가 빔 사이를 오가면 끊김이 생기고, 새로운 환경(이동, 반사체 변화)에 빠르게 적응하지 못합니다.",
    withThis:
      "DU가 매 슬롯 계산한 가중치를 그대로 RU에 내려보냅니다. 실시간으로 어떤 방향·모양의 빔이든 만들 수 있고, 압축으로 메시지 크기도 합리적으로 관리됩니다.",
    realImpact:
      "Massive MIMO의 핵심 — UE별 정밀 빔, 빔 트래킹, MU-MIMO 페어링이 모두 SE 1(또는 SE 11) 위에서 동작합니다. 이게 없으면 셀 용량과 사용자 SINR이 크게 떨어집니다.",
  },
  6: {
    trigger: "PRB 할당이 연속이 아니어야 할 때 (CRS·SSB 회피, 인터리브, DSS LTE 영역 회피)",
    withoutThis:
      "Section 헤더의 (startPrbc, numPrbc)만으론 띄엄띄엄한 PRB를 표현할 수 없습니다. 연속 영역으로만 잘라 보내야 해서 Section을 여러 개 띄워야 하고, C-plane 오버헤드가 늘어납니다.",
    withThis:
      "비트맵 한 번으로 짝수 RBG, 홀수 RBG, CRS 회피 패턴 등 모든 비연속 분포를 표현합니다. 메시지 크기도 작아집니다.",
    realImpact:
      "DSS·LTE-NR 공존이나 SSB와의 충돌 회피가 단일 메시지로 깔끔히 처리돼 셀 운용 효율이 올라갑니다.",
  },
  11: {
    trigger: "32 이상 대형 안테나 어레이에서 빔 가중치를 효율적으로 운반해야 할 때",
    withoutThis:
      "SE 1로 보내면 안테나 수가 늘수록 헤더 오버헤드가 비례 증가합니다. Massive MIMO에서는 프론트홀 대역폭이 빠르게 한계에 도달합니다.",
    withThis:
      "PRB 묶음 단위·가변 길이 표현으로 가중치 전송 효율을 끌어올립니다. 같은 정밀도를 더 적은 비트로 표현.",
    realImpact:
      "64/128 안테나 셀에서도 프론트홀이 막히지 않고 정밀 빔포밍을 유지할 수 있습니다.",
  },
  14: {
    trigger: "MU-MIMO에서 두 UE를 같은 자원에 묶었을 때 한 쪽 빔이 다른 UE에 간섭이 큰 경우",
    withoutThis:
      "UE 두 명이 가까운 각도에 있으면 서로에게 강한 간섭이 가서 SINR이 떨어지고, 결국 둘 다 MCS를 낮춰야 합니다. MU-MIMO의 이득이 거의 사라집니다.",
    withThis:
      "각 UE 가중치를 계산할 때 상대 UE 방향에 null을 강제해 간섭을 -30dB 수준까지 억제합니다. 두 UE가 동시에 높은 SINR로 서빙됩니다.",
    realImpact:
      "MU-MIMO 페어링 성공률이 올라가고 셀 sum throughput이 1.5~2배까지 늘어납니다. Massive MIMO의 약속을 실제로 실현하는 핵심 SE.",
  },
  22: {
    trigger: "RU의 컨피그를 바꾸는 명령(예: ST 4)이 잘 적용됐는지 DU가 확실히 알아야 할 때",
    withoutThis:
      "DU는 명령을 보내고 그냥 잊습니다. RU가 명령을 거부했거나 처리 못 했어도 모르고, 시스템이 의도와 다르게 동작합니다.",
    withThis:
      "ackNackReqId로 매칭되는 ST 8 응답이 돌아옵니다. 타임아웃 시 재시도/알람으로 신뢰성을 확보합니다.",
    realImpact:
      "Critical 컨피그 명령의 결과가 가시화돼 운영 사고가 줄고, 자동 복구 로직을 짤 수 있게 됩니다.",
  },
};

export function getSTWhy(id: number) {
  return ST_WHY[id];
}
export function getSEWhy(id: number) {
  return SE_WHY[id];
}
