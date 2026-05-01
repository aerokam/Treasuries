import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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
    const holidays = new Set(
      holidayText.trim().split('\n')
        .map(line => {
          const m = line.match(/"[^,]+,\s+(\w+ \d+, \d{4})"/);
          if (!m) return null;
          const d = new Date(m[1]);
          return isNaN(d) ? null : d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
        })
        .filter(Boolean)
    );
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
const LOGIN_URL = 'https://digital.fidelity.com/prgw/digital/signin/retail';
const DEBUG_PORT = 9222;

const SEARCHES = [
  {
    url: 'https://fixedincome.fidelity.com/ftgw/fi/FIIndividualBondsSearch?prodmajor=TREAS&requestpage=FISearchTreasury&pageName=FISearchTreasury&sortby=MA&operation=&minmaturity=11%2F2025&maxmaturity=&askYield=ALL&minyield=&maxyield=&prodminor=ALL&dummybondtierind=All&bondotherind=Y&bondtierind=Y&askQuantity=ALL&minQuantity=&maxQuantity=&bidQuantity=ALL&minQuantityBid=&maxQuantityBid=&zerocpn=&askPrice=ALL&minprice=&maxprice=&coupon=ALL&mincoupon=&maxcoupon=&callind=&displayFormat=TABLE&isAdvSearch=Y&advDataId=REQ691f6ab15fd58a129e23ccd1d1c1aa33',
    filename: 'FidelityTreasuries.csv',
  },
  {
    url: 'https://fixedincome.fidelity.com/ftgw/fi/FIIndividualBondsSearch?prodmajor=TREAS&prodminor=TIPS&requestpage=FISearchTIPS&sortby=MA&operation=&minmaturity=11%2F2025&maxmaturity=&askYield=ALL&minyield=&maxyield=&askPrice=ALL&minprice=&maxprice=&coupon=ALL&mincoupon=&maxcoupon=&displayFormat=TABLE&isAdvSearch=Y&advDataId=REQ691e1609c14fe22d8a1deb32f095aa33',
    filename: 'FidelityTips.csv',
  },
];

async function ensureLoggedIn(page) {
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

  if (!page.url().includes('/signin/') && !page.url().includes('/login/')) {
    console.log('Session active.');
    return;
  }

  console.log('Logging in...');
  await page.waitForSelector('#dom-username-input', { timeout: 15_000 });
  await page.fill('#dom-username-input', process.env.FIDELITY_USERNAME);
  await page.waitForSelector('#dom-pswd-input:not([disabled])', { timeout: 10_000 });
  await page.fill('#dom-pswd-input', process.env.FIDELITY_PASSWORD);
  await page.click('#dom-login-button');

  // Complete any MFA prompt manually — script waits 5 min.
  await page.waitForURL(
    url => !url.href.includes('/signin/') && !url.href.includes('/login/'),
    { timeout: 300_000 }
  );
  console.log('Logged in.');
}

async function downloadSearch(context, page, { url, filename }) {
  console.log(`Loading ${filename}...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('table', { timeout: 30_000 });
  await jitter(1500, 2500);

  const href = await page.getAttribute('a[href*="CSVDOWNLOAD"]', 'href');
  if (!href) throw new Error(`Download link not found on page for ${filename}`);

  const downloadUrl = new URL(href, 'https://fixedincome.fidelity.com').href;
  await jitter(800, 1500);

  // Use cookies from the live session to fetch the CSV directly
  const cookies = await context.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  const response = await fetch(downloadUrl, { headers: { Cookie: cookieHeader } });
  if (!response.ok) throw new Error(`Download request failed: ${response.status} for ${filename}`);

  const buffer = await response.arrayBuffer();
  const savePath = path.join(DOWNLOADS_DIR, filename);
  await fs.writeFile(savePath, Buffer.from(buffer));
  console.log(`Saved: ${savePath}`);
  await jitter(1000, 2000);
}

async function runUpload() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(__dirname, 'uploadFidelityDownload.js')],
      { stdio: 'inherit' }
    );
    child.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`Upload script exited with code ${code}`))
    );
  });
}

// Patch Chrome's Preferences to mark the last exit as clean.
// When Chrome is killed (chrome.kill()), it leaves exit_type="Crashed" which triggers
// the "restore last session?" modal on next launch. Setting it to "Normal" suppresses it.
const profileDefault = path.join(CHROME_PROFILE, 'Default');
const prefsPath = path.join(profileDefault, 'Preferences');
try {
  const prefsRaw = await fs.readFile(prefsPath, 'utf8');
  const prefs = JSON.parse(prefsRaw);
  if (!prefs.profile) prefs.profile = {};
  prefs.profile.exit_type = 'Normal';
  prefs.profile.exited_cleanly = true;
  await fs.writeFile(prefsPath, JSON.stringify(prefs));
} catch { /* profile not yet created — fine, Chrome will create it fresh */ }

// Launch real Chrome (no automation flags) and connect via CDP
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

try {
  await ensureLoggedIn(page);

  for (const search of SEARCHES) {
    await downloadSearch(context, page, search);
  }

  console.log('\nUploading to R2...');
  await runUpload();
  console.log('Done.');
} finally {
  await browser.close();
  // Wait for Chrome to exit cleanly (saves session state as clean so no restore dialog on next run).
  // Fall back to force-kill after 4s only if it hasn't already exited.
  let chromeClosed = false;
  await Promise.race([
    new Promise(resolve => chrome.on('close', () => { chromeClosed = true; resolve(); })),
    sleep(4000),
  ]);
  if (!chromeClosed) chrome.kill();
}
