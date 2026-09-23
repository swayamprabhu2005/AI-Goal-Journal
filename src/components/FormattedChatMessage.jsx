import React from "react";

// Parses markdown inline: **bold**, *italic*, `code`
function renderInline(text) {
  if (!text) return null;

  const tokens = [];
  let remaining = text;
  let keyIdx = 0;

  // Match **bold** or `code` or *italic*
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(remaining.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      tokens.push(
        <strong key={keyIdx++} className="font-bold text-[#26261F]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      tokens.push(
        <code
          key={keyIdx++}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 border border-slate-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      tokens.push(
        <em key={keyIdx++} className="italic text-slate-700">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < remaining.length) {
    tokens.push(remaining.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : text;
}

export default function FormattedChatMessage({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let i = 0;
  let keyCounter = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Skip divider lines (--- or ___)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      i++;
      continue;
    }

    // 2. Detect Markdown Table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        // Parse rows
        const rawHeaders = tableLines[0]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

        // Check if line 1 is separator (e.g. |---|---|)
        const isSeparator = /^\|?(\s*:?-+:?\s*\|?)+$/.test(tableLines[1]);
        const bodyLines = isSeparator ? tableLines.slice(2) : tableLines.slice(1);

        const rows = bodyLines.map((rowLine) =>
          rowLine
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        );

        elements.push(
          <div
            key={keyCounter++}
            className="my-3 overflow-x-auto rounded-xl border border-[#E2E9DF] bg-white shadow-2xs"
          >
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2E9DF] bg-[#FAF9F5]">
                  {rawHeaders.map((header, hIdx) => (
                    <th
                      key={hIdx}
                      className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px] text-[#4B5D3C]"
                    >
                      {renderInline(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E9DF]/60 bg-white">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#F4F1E8]/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-slate-700 font-medium">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 3. Headings: ### or ## or #
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const headingText = headingMatch[2];
      elements.push(
        <h4 key={keyCounter++} className="mt-3 mb-1.5 text-sm font-bold text-[#26261F] font-serif">
          {renderInline(headingText)}
        </h4>
      );
      i++;
      continue;
    }

    // 4. Bullet lists: - item or * item
    if (/^[-*]\s+/.test(trimmed)) {
      const listItems = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={keyCounter++} className="my-2 space-y-1.5 pl-2">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4B5D3C]" />
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. Empty lines
    if (!trimmed) {
      elements.push(<div key={keyCounter++} className="h-2" />);
      i++;
      continue;
    }

    // 6. Regular Paragraph
    // Clean up any stray reflection labels if model emitted them:
    const cleanLine = trimmed
      .replace(/^\*\*Reflection\s*(?:prompt|question)?:\*\*\s*/i, "")
      .replace(/^Reflection\s*(?:prompt|question)?:\s*/i, "");

    elements.push(
      <p key={keyCounter++} className="leading-relaxed text-xs sm:text-sm text-slate-800 font-normal">
        {renderInline(cleanLine)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}
