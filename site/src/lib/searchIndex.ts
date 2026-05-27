import fields from "../data/fields.json";
import sectionTypes from "../data/section-types.json";
import sectionExtensions from "../data/section-extensions.json";
import { GLOSSARY } from "../data/glossary";

export type SearchKind =
  | "section-type"
  | "extension"
  | "field"
  | "glossary"
  | "page";

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  description?: string;
  heading?: string;
  href: string;
  keywords?: string;
}

function clean(s: string | undefined, max = 280): string {
  if (!s) return "";
  return s
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/[*_`#>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function buildSearchIndex(base: string): SearchEntry[] {
  const b = base.endsWith("/") ? base : base + "/";
  const entries: SearchEntry[] = [];

  for (const st of sectionTypes as Array<{
    id: string;
    sectionType: number;
    title: string;
    shortTitle?: string;
    headingNumber: string;
    summary?: string;
    reserved?: boolean;
  }>) {
    entries.push({
      id: `st-${st.id}`,
      kind: "section-type",
      title: `Section Type ${st.sectionType}`,
      subtitle: st.shortTitle || st.title,
      description: clean(st.summary),
      heading: st.headingNumber,
      href: `${b}section-types/${st.id}/`,
      keywords: `ST${st.sectionType} section type ${st.sectionType}`,
    });
  }

  for (const se of sectionExtensions as Array<{
    id: string;
    extId: number;
    title: string;
    headingNumber: string;
    summary?: string;
  }>) {
    entries.push({
      id: `se-${se.id}`,
      kind: "extension",
      title: `Section Extension ${se.extId}`,
      subtitle: se.title,
      description: clean(se.summary),
      heading: se.headingNumber,
      href: `${b}extensions/${se.id}/`,
      keywords: `SE${se.extId} extension ext ${se.extId}`,
    });
  }

  for (const f of fields as Array<{
    id: string;
    name: string;
    longName: string;
    headingNumber: string;
    category: string;
    summary?: string;
  }>) {
    entries.push({
      id: `field-${f.id}`,
      kind: "field",
      title: f.name,
      subtitle: f.longName,
      description: clean(f.summary),
      heading: f.headingNumber,
      href: `${b}fields/#${f.id}`,
      keywords: f.category,
    });
  }

  for (const g of GLOSSARY) {
    entries.push({
      id: `glossary-${g.slug}`,
      kind: "glossary",
      title: g.term,
      subtitle: g.longForm,
      description: clean(g.oneLine + (g.analogy ? " — " + g.analogy : "")),
      heading: g.inSpec,
      href: `${b}concepts/#${g.slug}`,
      keywords: `${g.category} ${g.longForm ?? ""}`,
    });
  }

  const pages: Array<Omit<SearchEntry, "kind">> = [
    {
      id: "page-home",
      title: "홈",
      description: "O-RAN Spec Explorer 시작 페이지",
      href: b,
    },
    {
      id: "page-concepts",
      title: "개념·용어집",
      description: "PRB, beamId, eAxC, DMRS 등 핵심 약어를 비유로 풀어 설명",
      href: `${b}concepts/`,
    },
    {
      id: "page-architecture",
      title: "아키텍처",
      description: "O-DU ↔ O-RU ↔ UE 한 슬롯 흐름",
      href: `${b}architecture/`,
    },
    {
      id: "page-section-types",
      title: "Section Types",
      description: "Section Type 0~11 인덱스",
      href: `${b}section-types/`,
    },
    {
      id: "page-extensions",
      title: "Extensions",
      description: "Section Extension 1~30 인덱스",
      href: `${b}extensions/`,
    },
    {
      id: "page-fields",
      title: "Fields",
      description: "공통 필드 (7.5.2) · 섹션 필드 (7.5.3) 카탈로그",
      href: `${b}fields/`,
    },
    {
      id: "page-simulator",
      title: "시뮬레이터",
      description: "C-Plane 메시지 조합·시뮬레이션",
      href: `${b}simulator/`,
    },
    {
      id: "page-playground",
      title: "Playground",
      description: "Section Type + Extension 조합 실험",
      href: `${b}playground/`,
    },
  ];
  for (const p of pages) entries.push({ ...p, kind: "page" });

  return entries;
}
