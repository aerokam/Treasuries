// marketQuotesDownload.js -- downloads Market quotes source (E6) and hands it to
// uploadMarketQuotes.js. Spec: knowledge/1.2_Download_Market_Quotes.md
//
// What is specific to the site (where to sign in, how to answer its challenge, how to filter and
// download) is in quoteSource.local.js, which is not in the repository.
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseHolidaySet } from '../../shared/src/settlement.js';
import { parseCsv } from '../../shared/src/csv.js';
import * as source from './quoteSource.local.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Skip runs on weekends and bond market holidays
const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
const dayET = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/New_York' }).format(new Date());
if (dayET === 'Sat' || dayET === 'Sun') {
  console.log(`Skipping run: Weekend (${dayET}) in ET.`);
  process.exit(0);
}

try {
  const holidayRes = await fetch('https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/misc/BondHolidaysSifma.csv');
  if (holidayRes.ok) {
    const holidayText = await holidayRes.text();
    const holidays = parseHolidaySet(parseCsv(holidayText, false));
    if (holidays.has(todayET)) {
      console.log(`Skipping run: Bond market holiday (${todayET}).`);
      process.exit(0);
    }
  }
} catch (e) {
  console.error('Failed to fetch holiday calendar, proceeding with run:', e.message);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const jitter = (min, max) => sleep(min + Math.random() * (max - min));

const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PROFILE = path.join(__dirname, '../.chrome-profile');
const DOWNLOADS_DIR = path.join(os.homedir(), 'Downloads');
const DEBUG_PORT = 9222;
const DOWNLOAD_FILENAME = 'MarketQuotesExport.csv';
const PHONE_LINK_OTP_SCRIPT = path.join(__dirname, 'readPhoneLinkOtp.ps1');
const PHONE_LINK_OTP_TIMEOUT_SEC = 90;

function getPhoneLinkOtpBaseline() {
  const res = spawnSync('powershell', ['-NoProfile', '-File', PHONE_LINK_OTP_SCRIPT, '-Mode', 'baseline'], { encoding: 'utf8' });
  return (res.stdout || '').trim();
}

function waitForPhoneLinkOtp(baseline) {
  const res = spawnSync(
    'powershell',
    ['-NoProfile', '-File', PHONE_LINK_OTP_SCRIPT, '-Mode', 'wait', '-Baseline', baseline, '-TimeoutSec', String(PHONE_LINK_OTP_TIMEOUT_SEC)],
    { encoding: 'utf8', timeout: (PHONE_LINK_OTP_TIMEOUT_SEC + 15) * 1000 }
  );
  const code = (res.stdout || '').trim();
  if (res.status !== 0 || !/^\d{6}$/.test(code)) {
    throw new Error(`Phone Link OTP read failed: ${res.stderr || 'no code received within timeout'}`);
  }
  return code;
}

// What the site-specific steps use from this script.
const ctx = { getPhoneLinkOtpBaseline, waitForPhoneLinkOtp, jitter, sleep };

// Safety net if the automated sign-in does not match what is on screen (the flow changed,
// Phone Link unreachable, etc.) — wait for a human to finish it manually, dumping page state so
// the new flow can be inspected after.
async function waitForManualLogin(page) {
  const debugDir = path.join(__dirname, '../logs/mfa-debug');
  const deadline = Date.now() + 300_000;
  let dumped = false;
  while (Date.now() < deadline) {
    const url = page.url();
    if (!source.isLoginUrl(url)) return;
    if (!dumped) {
      console.log('Waiting for manual login completion. Dumping page state to logs/mfa-debug/...');
      dumped = true;
    }
    try {
      await fs.mkdir(debugDir, { recursive: true });
      await fs.writeFile(path.join(debugDir, 'latest.html'), await page.content());
      await page.screenshot({ path: path.join(debugDir, 'latest.png'), fullPage: true });
      await fs.writeFile(path.join(debugDir, 'latest-url.txt'), `${new Date().toISOString()}\n${url}\n`);
    } catch (e) {
      console.error('Debug dump failed:', e.message);
    }
    await sleep(5000);
  }
  throw new Error('Timed out waiting for login to complete (MFA challenge?)');
}

async function ensureLoggedIn(page) {
  await page.goto(source.LOGIN_URL, { waitUntil: 'domcontentloaded' });

  if (!source.isLoginUrl(page.url())) {
    console.log('Session active.');
    return;
  }

  console.log('Logging in...');
  if (await source.signIn(page, ctx)) {
    console.log('Logged in.');
    return;
  }

  await waitForManualLogin(page);
  console.log('Logged in.');
}

async function downloadCombined(page) {
  await source.downloadExport(page, path.join(DOWNLOADS_DIR, DOWNLOAD_FILENAME), ctx);
}

async function runUpload() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(__dirname, 'uploadMarketQuotes.js')],
      { stdio: 'inherit' }
    );
    child.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`Upload script exited with code ${code}`))
    );
  });
}

// Patch Chrome's Preferences to mark the last exit as clean.
const profileDefault = path.join(CHROME_PROFILE, 'Default');
const prefsPath = path.join(profileDefault, 'Preferences');
try {
  const prefsRaw = await fs.readFile(prefsPath, 'utf8');
  const prefs = JSON.parse(prefsRaw);
  if (!prefs.profile) prefs.profile = {};
  prefs.profile.exit_type = 'Normal';
  prefs.profile.exited_cleanly = true;
  await fs.writeFile(prefsPath, JSON.stringify(prefs));
} catch { /* profile not yet created — fine */ }

// Launch real Chrome and connect via CDP
const chrome = spawn(CHROME_EXE, [
  `--remote-debugging-port=${DEBUG_PORT}`,
  `--user-data-dir=${CHROME_PROFILE}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-save-password-bubble',
  '--disable-session-crashed-bubble',
], { detached: false });

chrome.on('error', err => { console.error('Chrome spawn error:', err); process.exit(1); });
console.log('Chrome launched, pid:', chrome.pid);
await sleep(2000);

const browser = await chromium.connectOverCDP(`http://localhost:${DEBUG_PORT}`);
const context = browser.contexts()[0];
const page = context.pages()[0] ?? await context.newPage();

const MAX_DOWNLOAD_ATTEMPTS = 3;

try {
  await ensureLoggedIn(page);

  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_DOWNLOAD_ATTEMPTS; attempt++) {
    try {
      await downloadCombined(page);
      console.log('\nUploading to R2...');
      await runUpload();
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      // A login/session was reachable and the capture still came back broken or the upload
      // rejected it (uploadMarketQuotes.js's row-count guard) -- a one-off glitch in the
      // page (filter not applied in time, page not finished loading), not a login
      // problem. Retry the download itself, same logged-in page, no fresh login/MFA.
      console.error(`Attempt ${attempt}/${MAX_DOWNLOAD_ATTEMPTS} failed: ${err.message}`);
      if (attempt < MAX_DOWNLOAD_ATTEMPTS) {
        console.log('Retrying download...');
        await sleep(5000);
      }
    }
  }
  if (lastErr) throw lastErr;

  console.log('Done.');
} finally {
  await browser.close();
  let chromeClosed = false;
  await Promise.race([
    new Promise(resolve => chrome.on('close', () => { chromeClosed = true; resolve(); })),
    sleep(4000),
  ]);
  if (!chromeClosed) chrome.kill();
}
