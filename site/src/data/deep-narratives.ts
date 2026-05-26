/**
 * Deep, step-by-step narratives written for someone who has never seen
 * an O-RAN fronthaul message before.
 *
 * The intent here is *not* to be a spec replacement. The intent is to make
 * a junior engineer think "OK, I get it" within 30 minutes of arriving.
 *
 * Each entry is a list of `Block`s. A block is a structured chunk that
 * renders as a rich UI block (a callout, table, code sample, comparison,
 * etc.). See the `Block` discriminated union below.
 *
 * If a Section Type or Section Extension has an entry here, the detail
 * page renders that entry near the top in addition to the short narrative.
 */

export type Block =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string; emphasis?: "default" | "info" | "warn" | "ok" }
  | { kind: "callout"; flavor: "tldr" | "analogy" | "warn" | "info" | "ok"; title: string; body: string }
  | { kind: "steps"; title?: string; items: { who: "O-DU" | "O-RU" | "UE" | "내부" | "Fronthaul"; what: string; why: string }[] }
  | { kind: "bullets"; title?: string; items: string[] }
  | {
      kind: "fieldTable";
      title?: string;
      caption?: string;
      rows: { name: string; bits?: string; plain: string; example?: string }[];
    }
  | {
      kind: "compare";
      title: string;
      left: { label: string; bullets: string[] };
      right: { label: string; bullets: string[] };
    }
  | { kind: "code"; lang?: string; title?: string; body: string }
  | { kind: "faq"; items: { q: string; a: string }[] }
  | { kind: "qna"; q: string; a: string }
  | {
      kind: "worked";
      title: string;
      scenario: string;
      steps: { label: string; detail: string }[];
      result?: string;
    };

export interface DeepEntry {
  prereq?: string;
  blocks: Block[];
}

export const ST_DEEP: Record<number, DeepEntry> = {
  // ============================================================
  //                       SECTION TYPE 1
  // ============================================================
  1: {
    prereq: "이 페이지를 보기 전에 'PRB', 'OFDM 심볼', 'slot', 'beamId'가 무엇인지 한 줄로 답할 수 있어야 합니다. 모른다면 먼저 개념·용어집 페이지를 보세요.",
    blocks: [
      {
        kind: "callout",
        flavor: "tldr",
        title: "5초 요약",
        body:
          "Section Type 1은 '데이터 채널을 어떤 자원·어떤 빔으로 보낼지'를 O-DU가 O-RU에게 알려주는 가장 흔한 컨트롤 메시지입니다. 사용자가 YouTube를 받는 99%의 순간에 이 메시지가 발생합니다.",
      },

      // ---- 1) Big picture story ----
      { kind: "heading", level: 2, text: "🎬 한 편의 짧은 시나리오로 따라가기" },
      {
        kind: "paragraph",
        text:
          "스마트폰으로 영상을 재생하는 'UE-A'라는 손님이 있다고 합시다. 이 손님이 다음 1ms 동안 데이터를 받으려면 어떤 일이 벌어지는지, ST 1의 입장에서 영화처럼 따라가 볼게요.",
      },
      {
        kind: "steps",
        title: "0.5ms 안에 일어나는 일",
        items: [
          {
            who: "O-DU",
            what: "스케줄러가 'UE-A에게 PRB 0~7, 심볼 2~13, MCS 16으로 보내자'를 결정.",
            why: "이전 슬롯에 받은 채널 정보·트래픽 상태·QoS 정책을 바탕으로 결정.",
          },
          {
            who: "O-DU",
            what: "Section Type 1 C-plane 메시지를 만들어 (frameId=10, subframeId=2, slotId=0, startSym=2, numSym=12, startPrbc=0, numPrbc=8, beamId=12)를 채움.",
            why: "이 직사각형 좌표가 곧 'UE-A의 자리'가 됨. beamId=12는 그 방향으로 빔을 만들도록 RU에 사전 학습되어 있음.",
          },
          {
            who: "Fronthaul",
            what: "eCPRI 패킷으로 감싸 광케이블로 RU에 송신. 보통 100~200µs 안에 도착.",
            why: "C-plane은 U-plane보다 먼저 도착해야 RU가 준비할 시간이 있음.",
          },
          {
            who: "O-RU",
            what: "ST1 메시지를 받고 '슬롯 N에서 sym2~13, PRB 0~7, beam=12 — 준비 완료'로 내부 큐에 등록.",
            why: "그 좌표에 들어갈 U-plane 데이터를 기다리고 있음.",
          },
          {
            who: "O-DU",
            what: "사용자 IQ 데이터를 같은 좌표로 U-plane 패킷에 실어 송신.",
            why: "C-plane이 '예약'이고 U-plane이 '실 데이터'. 좌표가 같으니 RU가 짝지을 수 있음.",
          },
          {
            who: "O-RU",
            what: "beam=12 가중치를 안테나 16개에 적용해 OTA로 송신.",
            why: "어레이 안테나 각 소자에 다른 위상·진폭을 줘서 UE-A 방향으로 집중된 빔을 만듬.",
          },
          {
            who: "UE",
            what: "PDSCH 수신 → DMRS로 채널 추정 → 데이터 디코딩 → HARQ ACK 송신.",
            why: "잘 받았으면 ACK, 못 받았으면 NACK. NACK이면 다음 슬롯에 재전송 스케줄.",
          },
        ],
      },

      // ---- 2) Why this exists ----
      { kind: "heading", level: 2, text: "🤔 왜 굳이 'Section Type 1'이라는 게 따로 있나요?" },
      {
        kind: "paragraph",
        text:
          "O-RAN 이전에는 DU와 RU가 한 박스 안에 있었기 때문에 메모리 공유로 모든 정보를 주고받았어요. 분리되고 나서는 '어떤 자원에 어떤 의도로 전송할지'를 RU에게 명시적으로 알려줘야 합니다. 그 컨트롤 메시지의 가장 흔한 종류가 ST 1입니다.",
      },
      {
        kind: "paragraph",
        text:
          "PRACH는 누메롤로지가 다르고(ST 3), UE 단위 빔포밍은 ueId가 필요하고(ST 5), 채널 정보 보고는 데이터가 크고(ST 6), SRS는 트리거가 다릅니다(ST 10). 이렇게 '특수 사정'이 있는 경우는 따로 Section Type을 만들고, 그 나머지 일반적 트래픽이 ST 1에 들어옵니다.",
      },

      // ---- 3) Compare to neighbor STs ----
      { kind: "heading", level: 2, text: "🔀 다른 Section Type과 무엇이 다를까?" },
      {
        kind: "compare",
        title: "ST 1 vs ST 5",
        left: {
          label: "ST 1 (이 페이지)",
          bullets: [
            "beamId로만 빔을 지정 (사전 학습된 빔 인덱스)",
            "UE를 직접 가리키지 않음 (스케줄러가 알아서)",
            "메시지 작음 — 헤더 ~13 바이트 + Section ~7 바이트",
            "가장 흔함. 단일 UE PDSCH/PUSCH는 거의 ST 1",
          ],
        },
        right: {
          label: "ST 5",
          bullets: [
            "ueId를 명시 — '이 자원은 UE-A 것' 선언",
            "MU-MIMO·UE-BF 같은 UE 단위 처리에 필수",
            "ST 1보다 약간 큼 (ueId 15 bits 추가)",
            "SE 11/14와 자주 짝지어짐",
          ],
        },
      },
      {
        kind: "compare",
        title: "ST 1 vs ST 3",
        left: {
          label: "ST 1",
          bullets: [
            "한 슬롯 안의 모든 Section이 같은 누메롤로지",
            "freqOffset 필드 없음",
            "PRACH 표현에는 적합하지 않음",
          ],
        },
        right: {
          label: "ST 3",
          bullets: [
            "PRACH 전용 + 누메롤로지가 섞인 경우",
            "freqOffset 24 bits로 기준 누메롤로지 대비 위치 표현",
            "frameStructure/cpLength 필드 추가",
          ],
        },
      },

      // ---- 4) Field-by-field deep dive ----
      { kind: "heading", level: 2, text: "📦 메시지를 한 바이트씩 뜯어보기" },
      {
        kind: "paragraph",
        text:
          "실제 ST 1 메시지의 비트 구조를 위에서 보셨다면, 이 표는 각 필드를 '왜 이 위치에', '몇 비트로', '뭘 의미하는지' 풀어 설명합니다. 신입 개발자가 코드에서 가장 자주 만지는 필드들 위주.",
      },
      {
        kind: "fieldTable",
        title: "공통 헤더 (Common Header)",
        rows: [
          { name: "dataDirection", bits: "1", plain: "0=UL, 1=DL. O-DU 입장에서 자신이 송신인지 수신인지 표시.", example: "1 (DL)" },
          { name: "payloadVersion", bits: "3", plain: "이 페이로드의 포맷 버전. 거의 항상 1.", example: "1" },
          { name: "filterIndex", bits: "4", plain: "PRACH/LTE 등 특수 필터 종류. ST 1에서는 보통 0.", example: "0" },
          { name: "frameId", bits: "8", plain: "10ms 라디오 프레임 번호 (0..255 순환).", example: "10" },
          { name: "subframeId", bits: "4", plain: "1ms 서브프레임 (0..9).", example: "2" },
          { name: "slotId", bits: "6", plain: "누메롤로지에 따른 슬롯 인덱스.", example: "0" },
          { name: "startSymbolId", bits: "6", plain: "이 메시지 안 첫 Section의 시작 OFDM 심볼.", example: "2" },
          { name: "numberOfsections", bits: "8", plain: "이 메시지에 담긴 Section 개수.", example: "3 (UE-A/B/C 각 1)" },
          { name: "sectionType", bits: "8", plain: "이 메시지가 ST 1임을 알리는 식별자. 항상 1.", example: "1" },
          { name: "udCompHdr", bits: "8", plain: "U-plane IQ 압축 설정 (bitwidth, method).", example: "0x91 (9-bit BFP)" },
        ],
      },
      {
        kind: "fieldTable",
        title: "Section 본체 (Section 마다 반복)",
        rows: [
          { name: "sectionId", bits: "12", plain: "이 Section의 고유 ID. U-plane이 같은 ID로 매칭.", example: "0x001" },
          { name: "rb", bits: "1", plain: "0=모든 PRB 같이, 1=interleave 모드.", example: "0" },
          { name: "symInc", bits: "1", plain: "1이면 동일 PRB가 다음 심볼에도 이어짐.", example: "0" },
          { name: "startPrbc", bits: "10", plain: "이 Section의 시작 PRB.", example: "0" },
          { name: "numPrbc", bits: "8", plain: "PRB 개수. 0이면 셀 전체 대역.", example: "8" },
          { name: "reMask", bits: "12", plain: "사용/미사용 Resource Element 비트마스크 (PRB 안 12 SC).", example: "0xFFF (모두 사용)" },
          { name: "numSymbol", bits: "4", plain: "심볼 길이.", example: "12" },
          { name: "ef", bits: "1", plain: "1이면 뒤에 Section Extension이 따라옴.", example: "0 또는 1" },
          { name: "beamId", bits: "15", plain: "사용할 빔 인덱스 (RU에 사전 학습됨).", example: "12" },
        ],
      },

      // ---- 5) Hands-on hex example ----
      { kind: "heading", level: 2, text: "🧪 실제 메시지 바이트 풀이" },
      {
        kind: "paragraph",
        text:
          "한 가지 시나리오를 정해서 메시지의 바이트를 직접 만들어 봅시다. 신입 개발자가 와이어샤크나 자체 디코더로 처음 볼 모습입니다.",
      },
      {
        kind: "worked",
        title: "시나리오: UE-A에게 PDSCH 1개 Section",
        scenario:
          "frame 10, subframe 2, slot 0의 sym 2~13에서, PRB 0~7을 beam 12로 점유. Section은 1개. Extension 없음.",
        steps: [
          { label: "dataDirection=1, payloadVersion=1, filterIndex=0", detail: "→ 0b1 001 0000 = 0x90" },
          { label: "frameId=10", detail: "→ 0x0A" },
          { label: "subframeId=2, slotId=0", detail: "→ 0b0010_000000 = 0x80 0x00 (4+6 bits, 2 bytes)" },
          { label: "startSymbolId=2, numberOfsections=1", detail: "→ 0b000010 00000001 = 0x02 0x01" },
          { label: "sectionType=1", detail: "→ 0x01" },
          { label: "udCompHdr=0x91 (9-bit BFP)", detail: "→ 0x91" },
          { label: "reserved=0", detail: "→ 0x00" },
          { label: "Section: sectionId=1, rb=0, symInc=0", detail: "→ 0x00 0x10 ..." },
          { label: "startPrbc=0, numPrbc=8", detail: "→ 0x00 0x08" },
          { label: "reMask=0xFFF, numSymbol=12, ef=0, beamId=12", detail: "→ 0xFF 0xFC 0x00 0x0C" },
        ],
        result:
          "공통 헤더 ~13 바이트 + Section ~7 바이트 = 약 20 바이트의 짧은 컨트롤 메시지. 같은 슬롯에 UE-B, UE-C 용 Section을 더 붙이면 numberOfsections=3으로 늘리고 Section 본체를 두 번 더 추가.",
      },

      // ---- 6) Pseudocode O-DU side ----
      { kind: "heading", level: 2, text: "💻 O-DU 측 의사코드" },
      {
        kind: "code",
        lang: "pseudo",
        title: "한 슬롯에 ST 1 C-plane 만들기",
        body: `# 한 슬롯에 대해 스케줄링 결과가 결정되면 ST 1을 만든다.

ues = scheduler.next_slot_decisions(slot)
msg = CPlaneMessage()
msg.header.dataDirection = DL
msg.header.payloadVersion = 1
msg.header.frameId       = slot.frame
msg.header.subframeId    = slot.subframe
msg.header.slotId        = slot.slot
msg.header.startSymbolId = min(u.start_sym for u in ues)
msg.header.sectionType   = 1
msg.header.udCompHdr     = bfp_9bit
msg.header.numberOfsections = len(ues)

for ue in ues:
    s = Section(
        sectionId  = next_section_id(),
        startPrbc  = ue.prb_start,
        numPrbc    = ue.prb_count,
        startSym   = ue.start_sym,
        numSymbol  = ue.num_sym,
        beamId     = ue.beam_id,
        ef         = False,
    )
    msg.sections.append(s)

ecpri_send(msg, dest=ru.id, msg_type=REALTIME_CTRL)`,
      },

      // ---- 7) Common bugs ----
      { kind: "heading", level: 2, text: "🐛 처음 만지면서 흔히 만드는 버그" },
      {
        kind: "bullets",
        title: "ST 1 인코딩에서 자주 보이는 실수",
        items: [
          "numberOfsections를 늘리지 않고 Section만 추가 — 디코더가 그 다음 Section을 못 찾고 패킷이 깨짐.",
          "ef=1로 두고 Extension을 안 붙여서 디코더가 무한정 다음 SE를 기다림.",
          "PRB 영역이 셀 전체 대역폭을 초과 (numPrbc + startPrbc > NRB).",
          "slotId 비트수(6)를 넘기는 값을 넣음 — 누메롤로지가 큰 경우 슬롯이 많아 6비트로 부족할 수 있어 별도 처리 필요.",
          "udCompHdr를 매 메시지마다 바꾸면 RU가 압축 메모리를 매번 새로 세팅해야 해서 성능 저하. 보통 셀당 고정.",
          "C-plane을 U-plane보다 늦게 보냄 — RU가 빈 큐에서 U-plane을 받아 버려질 수 있음. 전송 윈도우 마진 확인 필수.",
        ],
      },

      // ---- 8) FAQ ----
      { kind: "heading", level: 2, text: "❓ 자주 묻는 질문" },
      {
        kind: "faq",
        items: [
          {
            q: "한 슬롯에 ST 1 메시지가 몇 개 흐르나요?",
            a:
              "일반적으로 슬롯당 DL 1개, UL 1개. 각 메시지 안에 여러 Section(UE별)을 담는 게 일반적입니다. 다만 다른 carrier/SCS가 있다면 그만큼 곱해집니다.",
          },
          {
            q: "Section Type이 같은 메시지에 섞일 수 있나요?",
            a:
              "한 C-plane 메시지의 모든 Section은 sectionType이 같아야 합니다. 즉 ST 1과 ST 3을 한 메시지에 섞을 수 없고, 별도 메시지로 보내야 합니다.",
          },
          {
            q: "U-plane은 ST 1 메시지를 어떻게 매칭하나요?",
            a:
              "(frameId, subframeId, slotId, sectionId, startPrbc, ...)로 매칭. 보통 sectionId가 가장 직접적인 키입니다. 또한 eAxC ID 라우팅으로 같은 안테나·캐리어에 묶인 메시지끼리 짝지어집니다.",
          },
          {
            q: "ST 1만으로 빔포밍이 되나요?",
            a:
              "beamId만 적어 보내면 RU에 사전 학습된 빔이 자동 적용됩니다. 동적 가중치가 필요하면 SE 1(beamforming weights)을 첨부합니다. 즉 ST 1 + SE 1 조합으로 실시간 가변 빔이 가능합니다.",
          },
          {
            q: "지연이 얼마나 빠듯한가요?",
            a:
              "보통 T1a (DL C-plane은 OTA 송신보다 미리 RU에 도착해야 함)는 25µs ~ 수백 µs. 자세한 윈도우 정의는 스펙 4.4 / 4.6장. 이 타이밍을 어기면 RU가 메시지를 폐기합니다.",
          },
        ],
      },

      // ---- 9) What if missing ----
      { kind: "heading", level: 2, text: "🚨 이 메시지가 없으면 무슨 일이 일어나요?" },
      {
        kind: "bullets",
        items: [
          "U-plane이 와도 RU가 '어디 좌표에 쓸 데이터인지' 모르므로 폐기.",
          "그 슬롯의 PDSCH/PUSCH는 안 나갑니다. UE는 못 받고 HARQ NACK 또는 무응답.",
          "스케줄러는 다음 슬롯에 재전송을 시도. 결국 사용자 체감 지연이 늘어남.",
          "지속적으로 ST 1이 누락되면 셀 처리량이 무너집니다.",
        ],
      },
    ],
  },

  // ============================================================
  //                       SECTION TYPE 0
  // ============================================================
  0: {
    blocks: [
      {
        kind: "callout",
        flavor: "tldr",
        title: "5초 요약",
        body:
          "Section Type 0은 '이 자원은 우리가 안 씁니다, 비워두세요'라고 O-RU에게 알려주는 메시지입니다. 가드 구간이나 자원 양보 시나리오에 사용.",
      },
      { kind: "heading", level: 2, text: "🤔 왜 '비워둔다'를 굳이 알려야 하나요?" },
      {
        kind: "paragraph",
        text:
          "그냥 자원을 안 쓰면 되는 거 아닌가 싶지만, RU는 미리 알아야 안테나 PA를 켜둘지 끌지, 다른 카운터를 어떻게 처리할지 결정할 수 있습니다. 또한 RU의 송신 윈도우 관리, 인접 셀과의 충돌 회피, 외부 시스템과의 자원 양보에도 이 표시가 필요합니다.",
      },
      { kind: "heading", level: 2, text: "🎬 시나리오: TDD DL→UL 전환 구간" },
      {
        kind: "paragraph",
        text:
          "TDD 셀에서는 같은 주파수로 DL과 UL을 시간으로 번갈아 합니다. 그 사이엔 RF 회로가 송신→수신으로 전환할 시간(전환 갭)이 필요해요. 그 갭에 해당하는 심볼들에 ST 0을 보내 '이 심볼은 비워라'고 명시합니다.",
      },
      {
        kind: "steps",
        items: [
          { who: "O-DU", what: "DL→UL 전환 슬롯에서 마지막 2 심볼을 비울 결정.", why: "TDD 전환 가드." },
          { who: "O-DU", what: "ST 0 메시지로 (startSym=12, numSym=2, PRB=전체) 송신.", why: "RU에게 PA off 안내." },
          { who: "O-RU", what: "해당 영역에 대해 PA 끄고 RF 회로 전환 시작.", why: "다음 슬롯 UL 수신 준비." },
        ],
      },
      {
        kind: "fieldTable",
        title: "ST 0의 핵심 필드",
        rows: [
          { name: "startSymbolId", bits: "6", plain: "비울 영역 시작 심볼.", example: "12" },
          { name: "numSymbol", bits: "4", plain: "심볼 길이.", example: "2" },
          { name: "startPrbc", bits: "10", plain: "PRB 시작.", example: "0" },
          { name: "numPrbc", bits: "8", plain: "PRB 개수 (0=전체 대역).", example: "0" },
        ],
      },
      {
        kind: "callout",
        flavor: "warn",
        title: "⚠️ 주의",
        body:
          "ST 0과 ST 1의 영역이 겹치면 RU 구현에 따라 행동이 달라질 수 있습니다. 스케줄러가 항상 서로 배타적인 영역을 보내도록 검증해야 합니다.",
      },
    ],
  },

  // ============================================================
  //                       SECTION TYPE 3
  // ============================================================
  3: {
    blocks: [
      {
        kind: "callout",
        flavor: "tldr",
        title: "5초 요약",
        body:
          "Section Type 3은 PRACH(랜덤 액세스) 또는 누메롤로지가 섞인 채널 전용입니다. ST 1로는 표현 못 하는 'SCS가 다른 자원'을 한 번에 다룰 수 있습니다.",
      },
      { kind: "heading", level: 2, text: "🤔 왜 PRACH는 별도 ST가 필요할까요?" },
      {
        kind: "paragraph",
        text:
          "PRACH preamble은 보통 일반 데이터(예: 30kHz SCS) 와 다른 SCS(예: 1.25 / 5 kHz long preamble, 또는 30 / 120 kHz short)를 사용합니다. ST 1은 한 메시지 안 모든 자원이 동일 누메롤로지여야 한다는 전제 위에서 만들어졌기 때문에 PRACH가 다른 SCS를 쓰면 ST 1의 (slotId, startSymbolId)만으로 시간 위치를 정확히 표현할 수 없습니다.",
      },
      {
        kind: "paragraph",
        text:
          "ST 3은 freqOffset 24비트와 frameStructure 8비트를 추가로 둬서 'PRACH 자원이 기준 누메롤로지에서 몇 SC 떨어진 곳에, 어떤 SCS로 있는지'를 정확히 표현할 수 있게 합니다.",
      },
      { kind: "heading", level: 2, text: "🎬 시나리오: UE 초기 접속" },
      {
        kind: "steps",
        items: [
          { who: "O-DU", what: "PRACH 윈도우가 다음 슬롯에 있음을 인지.", why: "configuredIndex로 미리 설정." },
          { who: "O-DU", what: "ST 3 메시지로 (filterIndex=PRACH format, freqOffset, frameStructure)를 RU에 송신.", why: "RU가 그 시각에 그 주파수에서 수신 준비." },
          { who: "UE", what: "PRACH preamble 송신.", why: "초기 접속/핸드오버." },
          { who: "O-RU", what: "preamble을 수신해 IQ를 U-plane으로 DU에 반환.", why: "탐지/시간 추정은 DU에서." },
          { who: "O-DU", what: "preamble 시퀀스/타이밍 측정 후 RAR(Random Access Response) 발사 결정.", why: "UE의 PA 절차 시작." },
        ],
      },
      {
        kind: "fieldTable",
        title: "ST 3 추가 필드",
        rows: [
          { name: "filterIndex", bits: "4", plain: "PRACH 포맷 (Format 0/1/2/3, 짧은 포맷 A/B/C 등).", example: "0 (Format 0)" },
          { name: "freqOffset", bits: "24", plain: "기준 누메롤로지 대비 PRACH 시작 위치(서브캐리어 단위).", example: "12 (12 SC)" },
          { name: "frameStructure", bits: "8", plain: "PRACH SCS, CP, 시퀀스 길이 등 인코딩.", example: "0x21" },
          { name: "cpLength", bits: "가변", plain: "Cyclic prefix 길이 (서브캐리어 단위)." },
        ],
      },
      {
        kind: "callout",
        flavor: "warn",
        title: "구현 함정",
        body:
          "일부 RU는 mixed numerology를 옵션으로만 지원합니다. M-plane으로 capability를 확인해 PRACH 전용 모드인지 확인하세요.",
      },
    ],
  },

  // ============================================================
  //                       SECTION TYPE 5
  // ============================================================
  5: {
    blocks: [
      {
        kind: "callout",
        flavor: "tldr",
        title: "5초 요약",
        body:
          "Section Type 5는 ST 1과 비슷하지만 'ueId'를 함께 실어 RU에게 '이 자원은 이 UE 것이다'를 명시합니다. MU-MIMO, UE-BF, Nulling에 필수.",
      },
      { kind: "heading", level: 2, text: "🆚 ST 1과 무엇이 진짜 다른가" },
      {
        kind: "compare",
        title: "동일 슬롯·동일 PRB에서",
        left: {
          label: "ST 1만 사용",
          bullets: [
            "RU는 '이 자원 = 빔 12 적용' 만 알고 누구 것인지는 모름",
            "한 자원에 한 빔만 가능 → SU-MIMO 가능, MU-MIMO 불가",
            "스케줄러가 별도로 UE를 추적해야 함",
          ],
        },
        right: {
          label: "ST 5 사용",
          bullets: [
            "RU가 'PRB 0~7 + ueId=A + 가중치 W_A' 같이 UE-aware 처리 가능",
            "같은 PRB에 ST 5 두 개를 띄우면 두 UE를 동시에 (MU-MIMO)",
            "UE 단위 가중치/널/그룹 차별 적용이 가능",
          ],
        },
      },
      { kind: "heading", level: 2, text: "🎬 시나리오: 4-UE MU-MIMO" },
      {
        kind: "paragraph",
        text:
          "스타디움 셀에서 같은 100 PRB를 4명의 UE에게 동시에 줄 때 ST 5 + SE 11(가중치) + SE 14(널) 조합이 자주 등장합니다.",
      },
      {
        kind: "steps",
        items: [
          { who: "O-RU", what: "이전 SRS로 추정한 채널 H_A, H_B, H_C, H_D를 ST 6로 DU에 보고.", why: "DU가 UE 4명의 채널을 알 필요." },
          { who: "O-DU", what: "ZF/MMSE로 4명용 가중치 W_A..W_D 계산. 페어링 충돌 방지로 SE 14 nulling 정보 함께 작성.", why: "각 UE에게는 본인 빔, 다른 UE 방향에 null." },
          { who: "O-DU", what: "ST 5 메시지에 Section 4개 (각 ueId 다름) + 각 Section에 SE 11 + SE 14를 부착.", why: "한 메시지로 4명 분량 전달." },
          { who: "O-RU", what: "4명 분 가중치를 합성해 어레이에 적용. 같은 PRB에서 4개 빔이 동시에 발사됨.", why: "공간 다중화 (spatial multiplexing)." },
        ],
      },
      {
        kind: "fieldTable",
        title: "ST 5에서 추가되는 필드",
        rows: [
          { name: "ueId", bits: "15", plain: "이 Section이 가리키는 UE의 내부 핸들.", example: "0x1A" },
          { name: "beamId", bits: "15", plain: "사전 학습 빔을 쓸 때 (가중치 SE를 안 쓸 때).", example: "12 또는 0 (가중치 사용 시)" },
          { name: "ef", bits: "1", plain: "보통 1 — 뒤에 SE 11/14/16/17이 연속해서 옴." },
        ],
      },
    ],
  },

  // ============================================================
  //                       SECTION TYPE 6
  // ============================================================
  6: {
    blocks: [
      {
        kind: "callout",
        flavor: "tldr",
        title: "5초 요약",
        body:
          "Section Type 6은 'UE의 채널이 어떻게 생겼는지'를 RU와 DU가 서로 주고받는 메시지입니다. 보통 RU→DU 방향. 좋은 빔포밍을 하려면 채널을 알아야 하니까요.",
      },
      { kind: "heading", level: 2, text: "🧭 채널이란 무엇인가 (1분 복습)" },
      {
        kind: "paragraph",
        text:
          "UE↔RU 사이의 무선 채널은 시간/주파수/공간에 따라 변하는 복소수 행렬 H로 표현됩니다. H의 크기는 (수신 안테나 수 × 송신 안테나 수)고, 매 PRB·매 슬롯마다 다를 수 있어요. 좋은 빔포밍 가중치 W는 이 H로부터 계산됩니다 (예: MMSE는 W = H^H (HH^H + αI)^-1).",
      },
      {
        kind: "paragraph",
        text:
          "여기서 한 가지 문제: H는 데이터가 매우 큽니다. 32 안테나 × 100 PRB × 64비트 복소수 = 약 200KB. 매 슬롯마다 이걸 보내면 fronthaul이 막힙니다. 그래서 ST 6은 압축(ciCompHdr)을 기본으로 하고, SE 27(차원 축소)·SE 28(주파수 해상도 제어)로 추가로 줄입니다.",
      },
      { kind: "heading", level: 2, text: "🎬 시나리오: SRS 후 채널 보고" },
      {
        kind: "steps",
        items: [
          { who: "O-DU", what: "ST 10으로 UE-A에게 다음 슬롯 마지막 심볼에 4-port SRS 송신 지시.", why: "주기적 채널 추적." },
          { who: "UE", what: "SRS 시퀀스 송신.", why: "기지국이 UL 채널 측정할 수 있도록." },
          { who: "O-RU", what: "수신 IQ에서 채널 H 추정 (32 RxAnt × 100 PRB).", why: "PHY 추정 알고리즘 (LS/MMSE)." },
          { who: "O-RU", what: "SE 27 차원 축소 적용 (예: SVD 후 상위 8개 모드만), SE 28 주파수 해상도 (10 PRB 단위로 평균) 적용 후 ST 6로 DU에 송신.", why: "200KB → 약 8KB로 압축." },
          { who: "O-DU", what: "H 받아서 다음 슬롯용 가중치 계산.", why: "최신 채널로 가장 좋은 빔 결정." },
        ],
      },
      {
        kind: "fieldTable",
        title: "ST 6 주요 필드",
        rows: [
          { name: "numberOfUEs", bits: "8", plain: "이 메시지에 담긴 UE 수.", example: "4" },
          { name: "ueId (반복)", bits: "15", plain: "각 UE 식별자.", example: "0x1A, 0x2B, ..." },
          { name: "ciCompHdr", bits: "8", plain: "채널 정보 압축 방식.", example: "0x90 (BFP 9-bit)" },
          { name: "channelInfoBlocks", bits: "가변", plain: "압축된 H. 크기는 압축률·차원에 따라 가변." },
        ],
      },
    ],
  },

  // ============================================================
  //                       SECTION TYPE 11
  // ============================================================
  11: {
    blocks: [
      {
        kind: "callout",
        flavor: "tldr",
        title: "5초 요약",
        body:
          "Section Type 11은 O-DU가 O-RU에 RRM(Radio Resource Management) 측정을 요청하는 메시지입니다. 가장 흔한 사용 예는 '미할당 PRB의 IpN(간섭+잡음)을 측정해 달라'. 응답은 ST 10으로 옵니다.",
      },
      { kind: "heading", level: 2, text: "🤔 왜 'RRM 측정 요청'이 필요할까?" },
      {
        kind: "paragraph",
        text:
          "스케줄러는 'PRB 12~20에 UE-A를 둘까 PRB 50~58에 둘까' 같은 결정을 매 슬롯 합니다. 좋은 결정을 하려면 그 자리에 간섭이 얼마나 있는지 알아야 합니다. 미할당 PRB의 IpN(Interference + Noise)이 바로 그 정보입니다.",
      },
      {
        kind: "paragraph",
        text:
          "ST 11은 그런 측정을 RU에게 명시적으로 요청합니다. RU는 그 시점에 요청 영역을 측정한 뒤 ST 10으로 결과를 회신합니다.",
      },
      { kind: "heading", level: 2, text: "🔁 ST 11 → ST 10 요청-응답 쌍" },
      {
        kind: "steps",
        items: [
          { who: "O-DU", what: "스케줄러가 향후 N 슬롯의 자원 분포에 대해 IpN 측정이 필요하다고 판단.", why: "더 좋은 PRB 선택을 위해." },
          { who: "O-DU", what: "ST 11 메시지에 측정 종류·대상 자원·시간을 채워 RU에 송신.", why: "정확한 요청 명세 전달." },
          { who: "O-RU", what: "지정 시점에 해당 PRB의 IpN 측정.", why: "백그라운드 간섭 수준 계측." },
          { who: "O-RU", what: "ST 10 메시지에 결과를 담아 O-DU에 회신.", why: "DU 스케줄러가 입력으로 활용." },
        ],
      },
      {
        kind: "fieldTable",
        title: "ST 11 주요 필드",
        rows: [
          { name: "dataDirection", bits: "1", plain: "0(uplink) 값으로 설정.", example: "0" },
          { name: "frameId / subframeId / slotId", bits: "8/4/6", plain: "측정 대상 시점 좌표." },
          { name: "참조", plain: "스펙 7.4.13 Table 7.4.13-1에 측정 명령 인코딩 정의." },
        ],
      },
      {
        kind: "callout",
        flavor: "info",
        title: "주의: ST 10이 응답, ST 11이 요청",
        body:
          "초보가 가장 헷갈리는 부분입니다. '11이 더 큰 번호니까 응답인가?' 아닙니다 — 11은 요청, 10이 응답. 외워두세요.",
      },
    ],
  },
};

// ============================================================
//                  SECTION EXTENSIONS (deep)
// ============================================================

export const SE_DEEP: Record<number, DeepEntry> = {
  1: {
    blocks: [
      {
        kind: "callout",
        flavor: "tldr",
        title: "5초 요약",
        body:
          "SE 1은 빔 가중치(복소수)를 메시지에 직접 실어 보냅니다. 사전에 RU에 등록된 빔 인덱스(beamId)에 의존하지 않고, '이번에 이 빔으로 가라'를 즉시 지시.",
      },
      { kind: "heading", level: 2, text: "🧮 빔 가중치란 무엇인가 (10초 복습)" },
      {
        kind: "paragraph",
        text:
          "안테나 N개가 일렬로 있다고 합시다. 각 안테나에 같은 신호 s를 보내면 신호들은 합쳐져 사방으로 퍼집니다(omni). 만약 안테나 n에 s × w_n (w_n은 복소수 가중치)를 보내면, 어떤 방향에서는 신호들이 보강 간섭하고 어떤 방향에서는 상쇄돼서 특정 방향으로만 강한 빔이 만들어집니다. SE 1은 이 w_0, w_1, ..., w_{N-1}을 메시지에 그대로 실어 보냅니다.",
      },
      { kind: "heading", level: 2, text: "📦 SE 1의 페이로드 구조" },
      {
        kind: "fieldTable",
        rows: [
          { name: "extType", bits: "7", plain: "Section Extension 번호 (= 1).", example: "1" },
          { name: "ef", bits: "1", plain: "뒤에 또 다른 SE가 오면 1.", example: "0" },
          { name: "extLen", bits: "8", plain: "이 SE의 길이 (4바이트 단위).", example: "9" },
          { name: "bfwCompHdr", bits: "8", plain: "가중치 압축 방식. 보통 9-bit BFP.", example: "0x91" },
          { name: "numBfw", bits: "8 (구현에 따라)", plain: "포함된 가중치 수 (= 안테나/포트 수).", example: "16" },
          { name: "bfwI / bfwQ (반복)", bits: "각 9~12", plain: "복소수 가중치 실수부/허수부.", example: "16번 반복" },
        ],
      },
      { kind: "heading", level: 2, text: "🎬 ST 1 + SE 1 메시지 흐름" },
      {
        kind: "steps",
        items: [
          { who: "O-DU", what: "최근 SRS·CSI로 채널 H 추정 → MMSE로 W 계산.", why: "최신 채널에 맞춘 빔." },
          { who: "O-DU", what: "ST 1 Section 끝에 ef=1을 켜고 SE 1 페이로드(W 16개 가중치)를 부착.", why: "한 메시지로 자원 + 빔 가중치 모두 전달." },
          { who: "Fronthaul", what: "압축된 가중치 + Section 헤더 합쳐서 보통 한 PDSCH당 +30~50 bytes 추가.", why: "BFP 9비트 압축 기준." },
          { who: "O-RU", what: "가중치를 안테나에 적용 → OTA 송신.", why: "실시간 빔 트래킹이 됨." },
        ],
      },
      {
        kind: "callout",
        flavor: "warn",
        title: "⚠️ 압축 일치 필수",
        body:
          "bfwCompHdr가 RU 펌웨어 설정과 다르면 RU가 가중치를 잘못 복원해 빔이 엉뚱한 방향으로 나갑니다. M-plane으로 사전 합의 필수.",
      },
    ],
  },

  14: {
    blocks: [
      {
        kind: "callout",
        flavor: "tldr",
        title: "5초 요약",
        body:
          "SE 14는 '이 빔을 만들 때, 다른 특정 UE 방향으로는 절대 신호가 가지 않게 해라'고 알리는 nulling 지시입니다. MU-MIMO 페어 UE 간 간섭을 줄이는 핵심.",
      },
      { kind: "heading", level: 2, text: "🤔 왜 굳이 null을 만들어야 하나" },
      {
        kind: "paragraph",
        text:
          "MU-MIMO에서는 같은 자원(PRB·심볼)에 여러 UE를 동시에 보냅니다. UE-A에게 가는 빔이 UE-B 방향으로도 강하면 UE-B의 입장에서는 큰 간섭이 됩니다. 그래서 UE-A 가중치 W_A를 계산할 때 'UE-B 방향에서 W_A가 0이 되도록' 제약을 추가합니다 (이게 ZF=Zero Forcing의 핵심).",
      },
      { kind: "heading", level: 2, text: "🎬 시나리오: 두 UE를 가까운 각도에서 동시 서빙" },
      {
        kind: "steps",
        items: [
          { who: "O-RU", what: "UE-A는 +18°, UE-B는 -25°에 있다고 채널 추정 (ST 6).", why: "각도 차이 43° 정도." },
          { who: "O-DU", what: "UE-A용 가중치를 계산할 때 -25° 방향에 null을 강제하는 제약 추가.", why: "UE-B로의 누설 차단." },
          { who: "O-DU", what: "ST 5 + SE 11(가중치) + SE 14(null layer 정보)로 RU에 전달.", why: "RU가 가중치를 적용할 때 null 검증도 가능." },
          { who: "O-RU", what: "어레이에 가중치 적용. UE-A 방향엔 강한 빔, UE-B 방향엔 깊은 null.", why: "두 UE 간 간섭 ≈ -30dB로 억제." },
        ],
      },
      { kind: "heading", level: 2, text: "📦 SE 14의 페이로드" },
      {
        kind: "fieldTable",
        rows: [
          { name: "nullLayerInd", bits: "8", plain: "널을 만들 레이어 인덱스 비트마스크 (spec §7.7.14의 유일한 파라미터).", example: "0b00000010 — 레이어 1만 널" },
        ],
      },
      {
        kind: "callout",
        flavor: "info",
        title: "💡 팁",
        body:
          "null이 너무 깊으면(예: -40dB) 의도 빔의 이득도 약간 손해 봅니다. SE 8(regularization)을 곁들이면 부드럽게 절충 가능.",
      },
    ],
  },

  22: {
    blocks: [
      {
        kind: "callout",
        flavor: "tldr",
        title: "5초 요약",
        body:
          "SE 22는 '이 명령에 대해 RU가 ACK/NACK를 돌려달라'고 표시합니다. spec §7.7.22: O-DU → O-RU 방향의 모든 SE 지원 ST에 첨부 가능 (ST 0/1/3/4/5/10/11). 응답은 **ST 8 (ACK/NACK feedback)** 으로 옵니다.",
      },
      { kind: "heading", level: 2, text: "🤔 왜 모든 명령에 응답이 필요하지 않나" },
      {
        kind: "paragraph",
        text:
          "ST 1처럼 매 슬롯 자주 흐르는 메시지에 일일이 응답을 받으면 fronthaul이 응답으로 가득 차서 지연이 늘어납니다. 그래서 일반 데이터 채널 스케줄링은 'fire-and-forget'(응답 없음). 다만 'LBT 결과 적용'이나 '안테나 모드 변경' 같은 ST 4 명령은 잘못 적용되면 시스템이 망가지므로 응답을 받습니다. SE 22가 그 응답을 트리거하는 표시입니다. (ST 4의 경우 native ackNackReqId 필드로도 동일한 동작이 가능합니다.)",
      },
      { kind: "heading", level: 2, text: "🔁 요청-응답 사이클" },
      {
        kind: "steps",
        items: [
          { who: "O-DU", what: "ST 4 cmd 작성. ackNackReqId=42를 SE 22에 넣어 첨부.", why: "응답에서 매칭할 수 있는 키." },
          { who: "O-RU", what: "명령 수신 후 적용. 성공이면 ackNack=1, 실패면 ackNack=0.", why: "원자적 확인." },
          { who: "O-RU", what: "ST 8 메시지 송신 (ackId=42 또는 nackId=42).", why: "DU의 워치독이 매칭." },
          { who: "O-DU", what: "타임아웃 안에 ST 8이 안 오면 NACK으로 간주하고 재시도 / 알람.", why: "신뢰성 보장." },
        ],
      },
      {
        kind: "callout",
        flavor: "warn",
        title: "⚠️ 워치독 필수",
        body:
          "SE 22를 보내놓고 응답을 안 기다리면 의미가 없습니다. 보통 SE 22 송신 → 100µs ~ 1ms 안에 ST 8을 기대하고, 타임아웃 시 재시도 / NACK 처리하는 상태기계가 DU 측에 필요. (ST 9가 아니라 ST 8입니다 — ST 9는 SINR 보고용.)",
      },
    ],
  },
};

export function getSTDeep(id: number): DeepEntry | undefined {
  return ST_DEEP[id];
}
export function getSEDeep(id: number): DeepEntry | undefined {
  return SE_DEEP[id];
}
