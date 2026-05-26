# O-RAN Spec Explorer

O-RAN WG4 CUS-plane (TS.CUS v20.00) Section Type 및 Section Extension을 한곳에서 시각적·인터랙티브하게 탐색하는 정적 문서 사이트.

## 구성

- **Source spec**: `O-RAN.WG4.TS.CUS.0-R005-v20.00.docx`
- **추출 파이프라인**:
  1. `pandoc`으로 docx → GFM 마크다운 변환 (`extract/spec.md`)
  2. `site/scripts/extract.py`가 Section Type / Extension / 필드 정의를 정규화된 JSON으로 변환 (`site/src/data/*.json`)
- **사이트 코드**: `site/` (Astro 5 + React + Tailwind + MDX)
- **시각화 4종**: 패킷 비트 레이아웃, 시간×주파수 RB 그리드, 빔포밍 패턴(인터랙티브), DU↔RU 메시지 시퀀스
- **배포**: GitHub Pages (`.github/workflows/deploy.yml`)

## 로컬 실행

```bash
cd site
npm install
npm run extract   # docx → JSON 재생성 (선택)
npm run dev       # http://localhost:4321/oranSpec
npm run build     # 정적 빌드 → site/dist
```

> 첫 실행 시 `pandoc`이 필요합니다 (`brew install pandoc`).

## 새 Section Type 또는 Extension 추가 절차

1. **메타데이터 등록**: `site/src/data/curated.ts`의 `SECTION_TYPES` 또는 `SECTION_EXTENSIONS`에 항목 추가.
2. **시각화 시나리오**: `site/src/lib/scenarios.ts`의 `buildScenarioForSectionType` / `buildScenarioForExtension`에 switch 케이스 추가.
3. **스펙 원문**: 새 docx를 교체하고 `npm run extract`로 JSON 재생성.
4. 끝. 라우트(`/section-types/<id>/`, `/extensions/<id>/`)는 `getStaticPaths`로 자동 생성됩니다.

## GitHub Pages 배포

- 리포지토리 Settings → Pages → Source를 "GitHub Actions"로 설정.
- `main` 브랜치 푸시 시 워크플로우가 빌드 후 배포합니다.
- 사이트 경로는 `https://<user>.github.io/<repo>/` 가 됩니다. (워크플로우가 `BASE_PATH`를 자동으로 `/<repo>` 로 설정)

## 디렉터리

```
.
├── O-RAN.WG4.TS.CUS.0-R005-v20.00.docx
├── extract/                  # pandoc 결과 (gitignore 권장)
├── .github/workflows/deploy.yml
└── site/
    ├── astro.config.mjs
    ├── scripts/extract.py
    └── src/
        ├── components/
        │   ├── viz/          # BitLayout, RbGrid, BeamView, MessageSequence
        │   ├── Playground.tsx
        │   ├── FieldSearch.tsx
        │   └── ...
        ├── data/
        │   ├── curated.ts    # 큐레이팅된 친절 메타데이터
        │   └── *.json        # extract.py 결과물
        ├── layouts/
        ├── lib/scenarios.ts  # ST/SE → 시각화 입력 빌더
        ├── pages/
        │   ├── index.astro
        │   ├── section-types/{index,[id]}.astro
        │   ├── extensions/{index,[id]}.astro
        │   ├── fields/index.astro
        │   └── playground/index.astro
        └── styles/global.css
```
