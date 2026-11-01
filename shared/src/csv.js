// csv.js — Single canonical CSV parser for browser-side apps.
// Per the project-wide no-redundancy directive (projects/CLAUDE.md §2a), this
// is the one implementation; apps import it instead of keeping their own copy.

// Parses `text` into rows. With a header row (default), returns objects keyed
// by header name. Without one, returns arrays of cell values per row.
// Handles quoted fields (commas inside quotes) but not embedded newlines.
export function parseCsv(text, hasHeader = true) {
  const result = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return result;

  const parseRow = (line) => {
    const parts = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    parts.push(cur.trim());
    return parts.map(p => p.replace(/^"|"$/g, '').trim());
  };

  if (hasHeader) {
    const headers = parseRow(lines[0]);
    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      const obj = {};
      headers.forEach((h, idx) => {
        if (h) obj[h] = values[idx];
      });
      result.push(obj);
    }
  } else {
    return lines.map(parseRow);
  }
  return result;
}

// Serializes a header row and data rows (arrays of cell values) to CSV text.
// A cell containing a comma, a double quote or a line break is quoted, and a double quote inside it is doubled.
// Rows are joined with CRLF, per RFC 4180.
export function formatCsv(headerRow, rows) {
  const cell = v => {
    const s = v == null ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headerRow, ...rows].map(r => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

// Saves `csvText` as `filename` through the browser's download. A leading byte-order mark makes Excel read the file as UTF-8.
export function downloadCsv(filename, csvText) {
  const blob = new Blob(['﻿', csvText], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
