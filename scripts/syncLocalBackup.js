// syncLocalBackup.js -- copies the files that .gitignore lists under its "Local-only" comment
// into the sibling private repository Treasuries-local (same relative paths), then commits and
// pushes when anything changed. .env is never copied.
//
// Run by the LocalBackup scheduled task daily (scripts/setup-windows-tasks.ps1).
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKUP = path.resolve(ROOT, '..', 'Treasuries-local');
const LOG = path.join(ROOT, 'logs', 'local-backup.log');

function log(msg) {
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, `[${new Date().toLocaleString('sv')}] ${msg}\n`);
  console.log(msg);
}

// The entries are the lines after the "# Local-only" comment up to the next blank line.
function localOnlyEntries() {
  const lines = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').split(/\r?\n/);
  const start = lines.findIndex(l => l.startsWith('# Local-only'));
  if (start < 0) throw new Error('.gitignore has no "# Local-only" block');
  const entries = [];
  for (const l of lines.slice(start + 1)) {
    if (!l.trim() || l.startsWith('#')) break;
    entries.push(l.trim());
  }
  return entries;
}

const safe = e => !path.isAbsolute(e) && !e.split('/').includes('..') && !/(^|\/)\.env/.test(e);

function filesUnder(dir) {
  const out = [];
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) out.push(...filesUnder(p));
    else out.push(p);
  }
  return out;
}

const git = (...args) => execFileSync('git', args, { cwd: BACKUP, encoding: 'utf8' });

function sync() {
  if (!fs.existsSync(path.join(BACKUP, '.git'))) throw new Error(`${BACKUP} is not a git repository`);

  const wanted = new Set();
  const dirs = [];
  for (const e of localOnlyEntries()) {
    if (!safe(e)) throw new Error(`refusing to back up ${e}`);
    const src = path.join(ROOT, e);
    if (!fs.existsSync(src)) continue;
    if (e.endsWith('/')) { dirs.push(e); for (const f of filesUnder(src)) wanted.add(path.relative(ROOT, f)); }
    else wanted.add(e.replace(/\//g, path.sep));
  }

  for (const rel of wanted) {
    const from = path.join(ROOT, rel), to = path.join(BACKUP, rel);
    const data = fs.readFileSync(from);
    if (fs.existsSync(to) && fs.readFileSync(to).equals(data)) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, data);
  }

  // A file removed from a backed-up folder is removed from the backup (its history stays in git).
  for (const d of dirs) {
    const dst = path.join(BACKUP, d);
    if (!fs.existsSync(dst)) continue;
    for (const f of filesUnder(dst)) if (!wanted.has(path.relative(BACKUP, f))) fs.unlinkSync(f);
  }

  const changed = git('status', '--porcelain').split('\n').filter(Boolean).map(l => l.slice(3));
  if (!changed.length) return;
  git('add', '-A');
  git('commit', '-q', '-m', `Backup ${new Date().toLocaleString('sv')}: ${changed.join(', ')}`);
  git('push', '-q', 'origin', 'main');
  log(`Backed up ${changed.length} file(s): ${changed.join(', ')}`);
}

try {
  sync();
} catch (err) {
  log(`FAILED: ${err.message}`);
  process.exit(1);
}
