#!/usr/bin/env python3
"""Extract Section Types, Section Extensions, and Common Fields from the
pandoc-converted O-RAN.WG4.TS.CUS markdown into structured JSON.

Output:
  src/data/section-types.json
  src/data/section-extensions.json
  src/data/fields.json
  src/data/index.json
"""

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC_MD = ROOT / "extract" / "spec.md"
OUT_DIR = ROOT / "site" / "src" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def read_lines():
    return SPEC_MD.read_text(encoding="utf-8").splitlines()


def find_headings(lines):
    """Return list of (lineno, level, raw_title) for headings."""
    out = []
    for i, line in enumerate(lines):
        m = re.match(r"^(#{1,6})\s+(.*\S)\s*$", line)
        if m:
            out.append((i, len(m.group(1)), m.group(2)))
    return out


def extract_range(lines, start, end):
    """Return joined markdown content (inclusive of start heading body, up to end)."""
    return "\n".join(lines[start + 1 : end]).strip()


def parse_section_types(lines, headings):
    """Sections 7.4.2 ... 7.4.13 — Section Type 0..11 plus 7.4.4 reserved."""
    result = []
    type_re = re.compile(r"^7\.4\.(\d+)\s+(.*)$")
    # Determine range of 7.4 chapter
    chapter_start = None
    chapter_end = None
    for idx, (ln, lvl, title) in enumerate(headings):
        if lvl == 2 and title.startswith("7.4 "):
            chapter_start = idx
        elif chapter_start is not None and lvl == 2 and idx > chapter_start:
            chapter_end = idx
            break
    if chapter_start is None:
        return result

    # Walk 7.4.X headings inside chapter
    relevant = []
    for idx in range(chapter_start + 1, chapter_end or len(headings)):
        ln, lvl, title = headings[idx]
        if lvl == 3 and type_re.match(title):
            relevant.append((idx, ln, lvl, title))

    for j, (idx, ln, lvl, title) in enumerate(relevant):
        next_ln = relevant[j + 1][1] if j + 1 < len(relevant) else (
            headings[chapter_end][0] if chapter_end else len(lines)
        )
        m = type_re.match(title)
        sub = int(m.group(1))
        head_title = m.group(2)
        # Map subsection (7.4.X) → Section Type number
        # 7.4.1 Overview, 7.4.2 SType 0, 7.4.3 SType 1, 7.4.4 reserved (2),
        # 7.4.5 SType 3, 7.4.6 SType 4, 7.4.7 SType 5, 7.4.8 SType 6,
        # 7.4.9 SType 7, 7.4.10 SType 8, 7.4.11 SType 9, 7.4.12 SType 10,
        # 7.4.13 SType 11.
        if sub == 1:
            continue  # 7.4.1 Overview
        if sub == 2:
            stype = 0
        elif sub == 3:
            stype = 1
        elif sub == 4:
            stype = 2  # reserved
        else:
            stype = sub - 2  # 5->3, 6->4, ...
        # Clean title (strip "Section Type N elements")
        st_title = re.sub(r"Section Type \d+ elements?", "", head_title, flags=re.I).strip(": ").strip()
        # Sub-headings (level 4) within this section
        sub_headings = []
        for hi in range(idx + 1, len(headings)):
            hln, hlvl, htitle = headings[hi]
            if hln >= next_ln:
                break
            if hlvl == 4:
                sub_headings.append({"line": hln, "title": htitle})
        body = extract_range(lines, ln, next_ln)
        result.append(
            {
                "id": str(stype),
                "sectionType": stype,
                "reserved": stype == 2,
                "headingNumber": f"7.4.{sub}",
                "title": head_title.strip(),
                "shortTitle": st_title or head_title.strip(),
                "rawMarkdown": body,
                "subSections": sub_headings,
            }
        )
    result.sort(key=lambda x: x["sectionType"])
    return result


def parse_section_extensions(lines, headings):
    """Sections 7.7.1 ... 7.7.N — Section Extension 1..N."""
    result = []
    ext_re = re.compile(r"^7\.7\.(\d+)\s+SE\s+(\d+):\s*(.*)$", re.I)
    chapter_start = None
    chapter_end = None
    for idx, (ln, lvl, title) in enumerate(headings):
        if lvl == 2 and title.startswith("7.7 "):
            chapter_start = idx
        elif chapter_start is not None and lvl == 2 and idx > chapter_start:
            chapter_end = idx
            break
    relevant = []
    for idx in range(chapter_start + 1, chapter_end or len(headings)):
        ln, lvl, title = headings[idx]
        if lvl == 3 and ext_re.match(title):
            relevant.append((idx, ln, lvl, title))

    for j, (idx, ln, lvl, title) in enumerate(relevant):
        next_ln = relevant[j + 1][1] if j + 1 < len(relevant) else (
            headings[chapter_end][0] if chapter_end else len(lines)
        )
        m = ext_re.match(title)
        sub = int(m.group(1))
        seid = int(m.group(2))
        se_title = m.group(3).strip()
        sub_headings = []
        for hi in range(idx + 1, len(headings)):
            hln, hlvl, htitle = headings[hi]
            if hln >= next_ln:
                break
            if hlvl == 4:
                sub_headings.append({"line": hln, "title": htitle})
        body = extract_range(lines, ln, next_ln)
        result.append(
            {
                "id": str(seid),
                "extId": seid,
                "headingNumber": f"7.7.{sub}",
                "title": se_title,
                "rawMarkdown": body,
                "subSections": sub_headings,
            }
        )
    result.sort(key=lambda x: x["extId"])
    return result


def parse_fields(lines, headings):
    """Common parameter fields under 7.5.2 + section-specific fields under 7.5.3."""
    result = []
    field_re = re.compile(r"^(7\.5\.[23])\.(\d+)\s+([a-zA-Z][\w]*)\s*\((.+)\)\s*$")

    # all 7.5.2.x and 7.5.3.x as level-4 headings (####)
    candidates = []
    for idx, (ln, lvl, title) in enumerate(headings):
        if lvl != 4:
            continue
        m = field_re.match(title)
        if m:
            candidates.append((idx, ln, m))
    for j, (idx, ln, m) in enumerate(candidates):
        next_ln = candidates[j + 1][1] if j + 1 < len(candidates) else None
        if next_ln is None:
            # find next heading at level <= 4
            for hi in range(idx + 1, len(headings)):
                if headings[hi][1] <= 4:
                    next_ln = headings[hi][0]
                    break
            else:
                next_ln = len(lines)
        body = extract_range(lines, ln, next_ln)
        chapter, sub, name, desc = m.group(1), m.group(2), m.group(3), m.group(4)
        result.append(
            {
                "id": name,
                "name": name,
                "longName": desc.strip(),
                "headingNumber": f"{chapter}.{sub}",
                "category": "common" if chapter == "7.5.2" else "section",
                "rawMarkdown": body,
            }
        )
    return result


def extract_summary(md, max_chars=600):
    # Drop tables and HTML tags for a clean blurb
    text = re.sub(r"<[^>]+>", "", md)
    text = re.sub(r"\|[^\n]*\|", "", text)
    text = re.sub(r"^[-=]{3,}.*$", "", text, flags=re.M)
    text = re.sub(r"\n{2,}", "\n\n", text).strip()
    # Take first paragraph or two
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    summary = ""
    for p in paras:
        if len(summary) + len(p) > max_chars:
            break
        summary += (("\n\n" if summary else "") + p)
    return summary.strip()


def write_json(name, data):
    path = OUT_DIR / name
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {path} ({len(data) if isinstance(data, list) else 'index'} entries)")


def main():
    if not SPEC_MD.exists():
        print(f"missing {SPEC_MD}", file=sys.stderr)
        sys.exit(1)
    lines = read_lines()
    headings = find_headings(lines)
    stypes = parse_section_types(lines, headings)
    sexts = parse_section_extensions(lines, headings)
    fields = parse_fields(lines, headings)

    # Attach summaries
    for entry in stypes + sexts + fields:
        entry["summary"] = extract_summary(entry["rawMarkdown"])

    # Save full and index versions
    write_json("section-types.json", stypes)
    write_json("section-extensions.json", sexts)
    write_json("fields.json", fields)

    index = {
        "sectionTypes": [
            {
                "id": s["id"],
                "sectionType": s["sectionType"],
                "title": s["title"],
                "shortTitle": s["shortTitle"],
                "reserved": s["reserved"],
                "summary": s["summary"],
                "headingNumber": s["headingNumber"],
            }
            for s in stypes
        ],
        "sectionExtensions": [
            {
                "id": s["id"],
                "extId": s["extId"],
                "title": s["title"],
                "summary": s["summary"],
                "headingNumber": s["headingNumber"],
            }
            for s in sexts
        ],
        "fields": [
            {
                "id": f["id"],
                "name": f["name"],
                "longName": f["longName"],
                "category": f["category"],
                "headingNumber": f["headingNumber"],
            }
            for f in fields
        ],
    }
    write_json("index.json", index)


if __name__ == "__main__":
    main()
