// checkVendorUpdates.js -- compares the libraries in shared/vendor (listed in its README.md) with
// the latest version npm publishes, and asks npm for security advisories on the versions in use.
//
// Writes logs/vendor-update-report.txt only when a library is behind, has an advisory, or the
// check could not complete; removes an existing report when everything is current. Run by the
// VendorUpdateCheck scheduled task (scripts/setup-windows-tasks.ps1).
//
// Usage: node scripts/checkVendorUpdates.js [path/to/README.md]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const README = process.argv[2] || path.join(ROOT, 'shared', 'vendor', 'README.md');
const REPORT = path.join(ROOT, 'logs', 'vendor-update-report.txt');

// The README table rows: | `file` | [package](url) | version | used by |
function listed() {
  const rows = [];
  for (const line of fs.readFileSync(README, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\|\s*`[^`]+`\s*\|\s*\[([^\]]+)\]\([^)]*\)\s*\|\s*([\d.]+)\s*\|/);
    if (m) rows.push({ name: m[1], version: m[2] });
  }
  return rows;
}

const major = v => Number(v.split('.')[0]);
const newer = (a, b) => {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
};

async function latestOf(name) {
  const res = await fetch(`https://registry.npmjs.org/${name}/latest`);
  if (!res.ok) throw new Error(`npm registry answered ${res.status} for ${name}`);
  return (await res.json()).version;
}

async function advisoriesFor(rows) {
  const body = {};
  for (const r of rows) body[r.name] = [r.version];
  const res = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`npm advisory lookup answered ${res.status}`);
  return res.json();
}

async function check() {
  const rows = listed();
  if (!rows.length) throw new Error(`no libraries found in ${README}`);
  const lines = [];
  for (const r of rows) {
    const latest = await latestOf(r.name);
    if (newer(latest, r.version)) {
      lines.push(`${r.name} ${r.version} -> ${latest}${major(latest) > major(r.version) ? ' (new major version: ask before updating)' : ''}`);
    }
  }
  const adv = await advisoriesFor(rows);
  for (const [name, list] of Object.entries(adv)) {
    for (const a of list) lines.push(`${name} ${rows.find(r => r.name === name).version}: advisory, ${a.severity}: ${a.title} (${a.url})`);
  }
  return lines;
}

let lines;
try {
  lines = await check();
} catch (err) {
  lines = [`The check could not complete: ${err.message}`];
}

if (lines.length) {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `Vendored libraries (shared/vendor), checked ${new Date().toLocaleString('sv')}:\n${lines.map(l => '- ' + l).join('\n')}\n`);
  console.log(fs.readFileSync(REPORT, 'utf8'));
} else {
  fs.rmSync(REPORT, { force: true });
  console.log('All vendored libraries are current and have no advisories.');
}
