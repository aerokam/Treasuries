#!/usr/bin/env node
// Regenerates the A-Z index at the top of knowledge/DATA_DICTIONARY.md from the
// entries below it. Run after adding or renaming an entry:
//   node scripts/build-dd-index.cjs
//
// The body stays grouped by category, which is what makes a missing or
// inconsistent entry visible — bracket year and cover year sit next to each
// other, so a definition that fails to distinguish them is apparent. The index
// gives the alphabetical lookup that grouping costs.
//
// Every anchor is indexed, not only the heading, so a synonym leads to the term
// it is a synonym for: "inflation factor" finds Index Ratio.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'knowledge', 'DATA_DICTIONARY.md');
const START = '<!-- DD-INDEX:START -->';
const END = '<!-- DD-INDEX:END -->';

const text = fs.readFileSync(FILE, 'utf8');
const nl = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(/\r?\n/);

// An entry is a run of anchors followed by either a "### Heading" (sections 3-5)
// or a bold list item like "- <a id="e1"></a>**E1: FedInvest** = ..." (sections 1-2).
const entries = [];
let pending = [];
for (const line of lines) {
  const anchorsOnLine = [...line.matchAll(/<a id="([^"]+)"><\/a>/g)].map(m => m[1]);
  const heading = line.match(/^###\s+(.+?)\s*$/);
  const listItem = line.match(/^-\s+<a id="[^"]+"><\/a>\*\*([^*]+?)\*\*/);

  if (heading) {
    if (pending.length) entries.push({ name: heading[1], anchors: pending });
    pending = [];
    continue;
  }
  if (listItem) {
    entries.push({ name: listItem[1].replace(/\s*=\s*$/, '').trim(), anchors: anchorsOnLine });
    pending = [];
    continue;
  }
  if (anchorsOnLine.length && line.trim() === anchorsOnLine.map(a => `<a id="${a}"></a>`).join('')) {
    pending.push(...anchorsOnLine);
  } else if (line.trim() !== '') {
    pending = [];
  }
}

// Slugs are compared loosely so an anchor that merely respells its own heading
// does not become a synonym entry pointing at itself.
const loose = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const rows = [];
for (const e of entries) {
  if (!e.anchors.length) continue;
  const target = e.anchors[0];
  rows.push({ label: e.name, target, synonym: false });
  for (const a of e.anchors.slice(1)) {
    const spelled = a.replace(/-/g, ' ');
    if (loose(spelled) === loose(e.name)) continue;
    if (/^[es]\d+$/.test(a)) continue;               // store and entity ids, not names
    rows.push({ label: spelled, target, synonym: true, of: e.name });
  }
}
rows.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

const byLetter = new Map();
for (const r of rows) {
  const c = /^[a-z]/i.test(r.label) ? r.label[0].toUpperCase() : '#';
  if (!byLetter.has(c)) byLetter.set(c, []);
  byLetter.get(c).push(r);
}

const out = [START, '', '## Index', '',
  '*Every term below, alphabetically, including synonyms. The entries themselves are grouped by category in the sections that follow.*', ''];
for (const [letter, group] of [...byLetter.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  out.push(`**${letter}** &nbsp; ` + group.map(r =>
    r.synonym ? `[${r.label}](#${r.target}) *(see ${r.of})*` : `[${r.label}](#${r.target})`
  ).join(' &middot; '));
  out.push('');
}
out.push('---', '', END);
const block = out.join(nl);

let updated;
if (text.includes(START) && text.includes(END)) {
  updated = text.slice(0, text.indexOf(START)) + block + text.slice(text.indexOf(END) + END.length);
} else {
  // First run: place the index just above section 0.0, so it is the first thing met.
  const at = text.indexOf('## 0.0 DD Notation');
  if (at < 0) { console.error('could not find section 0.0 to insert before'); process.exit(1); }
  updated = text.slice(0, at) + block + nl + nl + text.slice(at);
}
fs.writeFileSync(FILE, updated);
console.log(`indexed ${rows.length} names (${rows.filter(r => r.synonym).length} synonyms) across ${byLetter.size} letters`);
