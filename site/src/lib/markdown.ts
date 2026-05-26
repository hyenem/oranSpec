/**
 * Server-side markdown renderer for the pandoc-converted O-RAN spec text.
 *
 * Shared by Astro pages (build time) and the React Markdown.tsx component
 * (client). See Markdown.tsx for the rationale on the trade-offs.
 */

const ALLOWED_INLINE_TAGS = new Set([
  "sup",
  "sub",
  "br",
  "em",
  "strong",
  "b",
  "i",
  "u",
  "code",
  "kbd",
  "mark",
  "small",
  "abbr",
]);

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function renderInline(s: string) {
  const placeholders: string[] = [];
  let work = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g, (match, tag) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_INLINE_TAGS.has(lower)) return match;
    const isClosing = match.startsWith("</");
    const isSelfClosing = match.endsWith("/>") || lower === "br";
    const clean = isClosing ? `</${lower}>` : isSelfClosing ? `<${lower}/>` : `<${lower}>`;
    placeholders.push(clean);
    return `${placeholders.length - 1}`;
  });
  work = escapeHtml(work);
  work = work.replace(/(\d+)/g, (_, i) => placeholders[+i]);
  work = work.replace(/`([^`]+)`/g, "<code>$1</code>");
  work = work.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  work = work.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  work = work.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return work;
}

function isTableRow(line: string) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isTableSeparator(line: string) {
  return /^\s*\|?[\s:-]*\|[\s:|-]+\|?\s*$/.test(line) && line.includes("-");
}

function renderTable(rows: string[]): string {
  const cells = rows.map((r) =>
    r
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim())
  );
  if (cells.length < 2) return "";
  const [header, , ...body] = cells;
  const thead = `<thead><tr>${header.map((h) => `<th>${renderInline(h)}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${body
    .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  return `<div class="overflow-x-auto"><table>${thead}${tbody}</table></div>`;
}

function preprocess(md: string): string {
  let out = md.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/‑/g, "-").replace(/ /g, " ");
  out = out.replace(/\n{3,}/g, "\n\n");
  return out;
}

function isListLine(line: string) {
  return /^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line);
}

function listIndent(line: string): number {
  const m = /^(\s*)/.exec(line);
  return m ? m[1].length : 0;
}

export function markdownToHtml(md: string): string {
  const lines = preprocess(md).split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push(`<pre><code class="lang-${lang}">${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    const h = /^(#{1,6})\s+(.*\S)\s*$/.exec(line);
    if (h) {
      const lvl = Math.min(h[1].length + 2, 6);
      out.push(`<h${lvl}>${renderInline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const buf: string[] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      out.push(renderTable(buf));
      continue;
    }

    if (isListLine(line)) {
      const items = renderListAt(lines, i);
      out.push(items.html);
      i = items.next;
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !isListLine(lines[i]) &&
      !isTableRow(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    if (buf.length) {
      out.push(`<p>${renderInline(buf.join(" "))}</p>`);
    }
  }
  return out.join("\n");
}

function renderListAt(lines: string[], start: number): { html: string; next: number } {
  const firstIndent = listIndent(lines[start]);
  const ordered = /^\s*\d+\.\s+/.test(lines[start]);
  const items: string[] = [];
  let i = start;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j++;
      if (j >= lines.length) break;
      const nextIndent = listIndent(lines[j]);
      if (isListLine(lines[j]) && nextIndent === firstIndent) {
        i = j;
        continue;
      }
      if (nextIndent > firstIndent) {
        i = j;
        continue;
      }
      break;
    }

    const indent = listIndent(line);
    if (indent < firstIndent) break;

    if (isListLine(line) && indent === firstIndent) {
      const text = line.replace(/^\s*([-*+]|\d+\.)\s+/, "");
      const continuation: string[] = [];
      i++;
      while (i < lines.length) {
        const inner = lines[i];
        if (inner.trim() === "") {
          let k = i + 1;
          while (k < lines.length && lines[k].trim() === "") k++;
          if (k >= lines.length) break;
          if (listIndent(lines[k]) > firstIndent) {
            continuation.push("");
            i = k;
            continue;
          }
          break;
        }
        const innerIndent = listIndent(inner);
        if (innerIndent <= firstIndent) break;
        continuation.push(inner);
        i++;
      }
      let itemHtml = renderInline(text);
      if (continuation.length) {
        const minIndent = Math.min(
          ...continuation
            .filter((l) => l.trim() !== "")
            .map((l) => listIndent(l))
        );
        const dedented = continuation.map((l) => (l.length >= minIndent ? l.slice(minIndent) : l)).join("\n");
        itemHtml += markdownToHtml(dedented);
      }
      items.push(`<li>${itemHtml}</li>`);
      continue;
    }

    break;
  }

  const tag = ordered ? "ol" : "ul";
  return { html: `<${tag}>${items.join("")}</${tag}>`, next: i };
}
