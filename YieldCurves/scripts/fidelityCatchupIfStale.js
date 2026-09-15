// Logon-triggered safety net for the FidelityQuotes scheduled task. If today's 5:05/9:35/14:05
// runs were all missed (e.g. the PC was off or restarting through them), this runs the download
// once as soon as the user logs back on, instead of leaving every app on stale data for the rest
// of the day. No-ops when today's data is already on R2, so a normal logon after a successful
// scheduled run doesn't trigger a redundant broker login.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG = path.join(__dirname, '..', 'logs', 'fidelity.log');
const CSV_URL = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/FidelityTreasuriesTips.csv';

// Log directly to the file rather than via inherited stdio: run-fidelity.cmd (invoked
// below) opens the same fidelity.log for its own append redirection, and two processes
// holding that file open via cmd.exe's `>>` at once causes a sharing-violation error that
// silently skips the download while still exiting 0.
function log(line) {
  fs.appendFileSync(LOG, `${line}\n`);
}

const res = await fetch(CSV_URL);
if (!res.ok) throw new Error('FidelityTreasuriesTips.csv: HTTP ' + res.status);
const text = await res.text();

const m = text.match(/Date downloaded\s+(\d{2})\/(\d{2})\/(\d{4})/);
if (!m) throw new Error('No "Date downloaded" footer found in FidelityTreasuriesTips.csv');
const [, mm, dd, yyyy] = m;
const downloadedDate = `${yyyy}-${mm}-${dd}`;

const now = new Date();
const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

if (downloadedDate === todayLocal) {
  log(`[fidelityCatchupIfStale] Already downloaded today (${downloadedDate}) -- skipping logon catch-up.`);
  process.exit(0);
}

log(`[fidelityCatchupIfStale] Last download is ${downloadedDate}, today is ${todayLocal} -- running logon catch-up.`);
execFileSync('cmd.exe', ['/c', path.join(__dirname, 'run-fidelity.cmd')], { stdio: 'inherit' });
