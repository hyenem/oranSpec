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
  "span",
]);

// Block-level tags that pandoc emits for docx tables. These are passed through
// verbatim (with attribute sanitization) instead of being escaped.
const ALLOWED_BLOCK_TAGS = new Set([
  "table",
  "colgroup",
  "col",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "div",
  "p",
  "ul",
  "ol",
  "li",
]);

// Attributes kept on block-HTML pass-through. `style` is further filtered by
// sanitizeStyle to a layout-only allowlist.
const ALLOWED_ATTRS = new Set([
  "style",
  "colspan",
  "rowspan",
  "span",
  "scope",
  "align",
  "valign",
  "width",
  "height",
  "title",
  "class",
]);

const ALLOWED_STYLE_PROPS = new Set([
  "text-align",
  "vertical-align",
  "width",
  "height",
  "padding",
  "padding-left",
  "padding-right",
  "padding-top",
  "padding-bottom",
  "font-weight",
  "background",
  "background-color",
]);

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function sanitizeStyle(value: string): string {
  return value
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const idx = decl.indexOf(":");
      if (idx < 0) return "";
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const val = decl.slice(idx + 1).trim();
      if (!ALLOWED_STYLE_PROPS.has(prop)) return "";
      if (/url\s*\(|expression\s*\(|javascript:/i.test(val)) return "";
      return `${prop}: ${val}`;
    })
    .filter(Boolean)
    .join("; ");
}

function sanitizeAttrs(raw: string): string {
  const out: string[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const name = m[1].toLowerCase();
    if (!ALLOWED_ATTRS.has(name)) continue;
    const value = m[3] ?? m[4] ?? m[5] ?? "";
    if (/^on/i.test(name)) continue;
    const cleaned = name === "style" ? sanitizeStyle(value) : value;
    if (!cleaned) continue;
    out.push(`${name}="${escapeHtml(cleaned)}"`);
  }
  return out.length ? " " + out.join(" ") : "";
}

function sanitizeBlockHtml(html: string): string {
  return html.replace(
    /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (_, slash, tag, attrs) => {
      const lower = tag.toLowerCase();
      if (!ALLOWED_BLOCK_TAGS.has(lower) && !ALLOWED_INLINE_TAGS.has(lower)) return "";
      if (slash) return `</${lower}>`;
      const isSelfClosing = lower === "col" || lower === "br";
      const cleanAttrs = sanitizeAttrs(attrs);
      return isSelfClosing ? `<${lower}${cleanAttrs} />` : `<${lower}${cleanAttrs}>`;
    }
  );
}

function isBlockHtmlStart(line: string): string | null {
  const m = /^\s*<\s*([a-zA-Z][a-zA-Z0-9]*)\b/.exec(line);
  if (m && ALLOWED_BLOCK_TAGS.has(m[1].toLowerCase())) return m[1].toLowerCase();
  return null;
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

    const blockTag = isBlockHtmlStart(line);
    if (blockTag) {
      const buf: string[] = [];
      const openRe = new RegExp(`<\\s*${blockTag}\\b`, "gi");
      const closeRe = new RegExp(`<\\s*/\\s*${blockTag}\\s*>`, "gi");
      let depth = 0;
      while (i < lines.length) {
        const l = lines[i];
        buf.push(l);
        depth += (l.match(openRe) || []).length;
        depth -= (l.match(closeRe) || []).length;
        i++;
        if (depth <= 0) break;
      }
      let html = sanitizeBlockHtml(buf.join("\n"));
      if (blockTag === "table") {
        html = `<div class="overflow-x-auto">${html}</div>`;
      }
      out.push(html);
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
