import { test, expect } from '@playwright/test';

// ─── Mock data ────────────────────────────────────────────────────────────────
// FedInvest outlier dataset: 2 extreme notes at 1.5% and 2.0%, 30 normal notes
// 4.00–4.58%, 20 bonds 4.60–5.17%.
//
// With clip ON (IQR fence ≈ 0.50), lo ≈ 3.53% → extreme notes excluded from Y
// scale → bounds.min > 2.5.
//
// With clip OFF, extreme notes pull bounds.min to 1.5 → bounds.min < 2.1.
//
// Market quotes covers the 30 normal notes + 20 bonds (same CUSIPs as FedInvest)
// so the Market source activates and the Spreads button becomes enabled.

const SETTLE = '2026-03-25';

function makeFedOutlierCsv() {
  const rows = [
    SETTLE,
    'type,cusip,maturity,coupon,datedDateCpi,price,yield',
    // 2 extreme-low notes (1.5%, 2.0%) — no Market quotes counterpart. Note root
    // (912828) with suffixes above the 000-029 range used by normal notes below.
    'MARKET BASED NOTE,912828900,2027-01-15,0.01500,,100.000,0.01500',
    'MARKET BASED NOTE,912828901,2028-01-15,0.02000,,100.000,0.02000',
    // 3 TIPS (needed for TIPS tab initial load)
    'TIPS,91282CCA7,2026-04-15,0.00125,262.25027,100.0625,0.000',
    'TIPS,912828S50,2026-07-15,0.00125,239.70132,101.4375,0.000',
    'TIPS,91282CDC2,2026-10-15,0.00125,273.25771,100.96875,0.000',
  ];
  // 30 normal notes (4.00–4.58%) — CUSIPs match Market quotes below. Note root (912828).
  for (let i = 0; i < 30; i++) {
    const y = (0.0400 + i * 0.0002).toFixed(5);
    const cusip = `912828${String(i).padStart(3, '0')}`;
    const matYear = 2029 + Math.floor(i / 2);
    const matMonth = i % 2 === 0 ? '01' : '07';
    rows.push(`MARKET BASED NOTE,${cusip},${matYear}-${matMonth}-15,${y},,100.000,${y}`);
  }
  // 20 bonds (4.60–5.17%) — CUSIPs match Market quotes below. Bond root (912810).
  for (let i = 0; i < 20; i++) {
    const y = (0.0460 + i * 0.0003).toFixed(5);
    const cusip = `912810${String(i).padStart(3, '0')}`;
    rows.push(`MARKET BASED BOND,${cusip},${2057 + i * 2}-01-15,${y},,100.000,${y}`);
  }
  return rows.join('\n');
}

// Market quotes states the coupon as a decimal and prices at par, so each yield equals its coupon.
// Type is classified from the CUSIP root (912828/91282C = Note, 912810 = Bond, 912797 = Bill).
function makeMarketQuotesCsv() {
  const rows = ['2026-03-25 08:27 EDT', 'type,cusip,maturity,coupon,askPrice,bidPrice,adjAskPrice,adjBidPrice'];
  for (let i = 0; i < 30; i++) {
    const coupon = (0.0400 + i * 0.0002).toFixed(5);
    const cusip  = `912828${String(i).padStart(3, '0')}`;
    const yr     = 2029 + Math.floor(i / 2);
    const mo     = i % 2 === 0 ? '01' : '07';
    rows.push(`Treasury,${cusip},${yr}-${mo}-15,${coupon},100,99.9,,`);
  }
  for (let i = 0; i < 20; i++) {
    const coupon = (0.0460 + i * 0.0003).toFixed(5);
    const cusip  = `912810${String(i).padStart(3, '0')}`;
    const yr     = 2057 + i * 2;
    rows.push(`Treasury,${cusip},${yr}-01-15,${coupon},100,99.9,,`);
  }
  // TIPS for broker price overlay
  rows.push('TIPS,91282CCA7,2026-04-15,0.00125,100.132,100.062,124.098594,124.011839');
  rows.push('TIPS,912828S50,2026-07-15,0.00125,101.284,101.231,137.335026,137.263162');
  rows.push('TIPS,91282CDC2,2026-10-15,0.00125,100.738,100.68,119.820799,119.751812');
  return rows.join('\n');
}

const FED_OUTLIER_CSV = makeFedOutlierCsv();
const MARKET_QUOTES_CSV = makeMarketQuotesCsv();

const REF_CPI_CSV = [
  'Ref CPI Date,Ref CPI NSA,Ref CPI SA,SA Factor',
  '2026-04-15,325.96740,326.99493,0.99686',
  '2026-07-15,321.09758,320.44561,1.00203',
  '2026-10-15,323.46710,322.67571,1.00245',
  '2026-03-25,324.74961,326.35442,0.99508',
  '2026-03-26,324.74961,326.35442,0.99508',
].join('\n');

const HOLIDAYS_CSV = '"Wednesday, January 1, 2025",New Year\'s Day\n';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function setupRoutes(page) {
  await page.route('**/Treasuries/YieldsFromFedInvestPrices.csv', r => r.fulfill({ status: 200, contentType: 'text/csv', body: FED_OUTLIER_CSV }));
  await page.route('**/TIPS/RefCpiNsaSa.csv',                      r => r.fulfill({ status: 200, contentType: 'text/csv', body: REF_CPI_CSV }));
  await page.route('**/misc/BondHolidaysSifma.csv',                       r => r.fulfill({ status: 200, contentType: 'text/csv', body: HOLIDAYS_CSV }));
  await page.route('**/TIPS/GswTipsCurve.json', r => r.fulfill({ status: 404, body: '' }));  // GSW overlay: force snapshot fallback in tests
  await page.route('**/Treasuries/MarketQuotes.csv',            r => r.fulfill({ status: 200, contentType: 'text/csv', body: MARKET_QUOTES_CSV }));
}

// Y values are stored as percentage (e.g. 4.0 = 4.0%). Extreme notes have Y = 1.5 and 2.0.
// Clip ON excludes them → bounds.min > 2.5. Clip OFF includes them → bounds.min < 2.1.
async function getYBounds(page) {
  return page.evaluate(() => {
    const chart = Chart.getChart(document.getElementById('yieldChart'));
    if (!chart?.scales?.y) return null;
    return { min: chart.scales.y.min, max: chart.scales.y.max };
  });
}

async function assertClipOn(page) {
  const b = await getYBounds(page);
  expect(b, 'Y bounds must exist').not.toBeNull();
  expect(b.min, `bounds.min=${b.min?.toFixed(3)} — clip ON should exclude 1.5%/2.0% outlier notes, min should be >2.5`).toBeGreaterThan(2.5);
}

async function assertClipOff(page) {
  const b = await getYBounds(page);
  expect(b, 'Y bounds must exist').not.toBeNull();
  expect(b.min, `bounds.min=${b.min?.toFixed(3)} — clip OFF should include 1.5% outlier notes, min should be <2.1`).toBeLessThan(2.1);
}

async function assertCheckboxChecked(page) {
  await expect(page.locator('#clipOutliers')).toBeChecked();
}

async function assertCheckboxUnchecked(page) {
  await expect(page.locator('#clipOutliers')).not.toBeChecked();
}

// Navigate to Treasuries tab, wait for FedInvest (52 rows) + Market quotes (Spreads button enabled).
// 52 = 2 extreme notes + 30 normal notes + 20 bonds (all from FedInvest).
// After Market quotes load, table stays at 52 (their CUSIPs are a subset of FedInvest).
async function loadTreasuries(page) {
  await setupRoutes(page);
  await page.goto('./');
  await expect(page.locator('#saTable tbody tr')).toHaveCount(3, { timeout: 10000 });
  // FedInvest defaults off; enable it (even while hidden on the TIPS tab) before switching
  // so the first Treasuries render already includes it — checking afterward would leave
  // the maturity-range inputs auto-narrowed to whatever rendered first (Market only).
  await page.evaluate(() => {
    const el = document.getElementById('chkFedInvest');
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.click('[data-tab="treasuries"]');
  await expect(page.locator('#nominalsTable tbody tr')).toHaveCount(52, { timeout: 10000 });
  await expect(page.locator('.tab-btn[data-mode="spread"]')).not.toBeDisabled({ timeout: 8000 });
}

// ─── Group 1: Initial state ───────────────────────────────────────────────────

test.describe('Clip Outliers — initial state', () => {
  test.beforeEach(async ({ page }) => { await loadTreasuries(page); });

  test('checkbox is checked by default', async ({ page }) => {
    await assertCheckboxChecked(page);
  });

  test('clip is active on first load (extreme notes excluded from Y scale)', async ({ page }) => {
    await assertClipOn(page);
  });
});

// ─── Group 2: Basic toggle sequence ──────────────────────────────────────────

test.describe('Clip Outliers — basic toggle', () => {
  test.beforeEach(async ({ page }) => { await loadTreasuries(page); });

  test('uncheck → extreme notes appear in Y scale (clip OFF)', async ({ page }) => {
    await page.click('#clipOutliers');
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });

  test('uncheck → recheck → clip active again', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await assertClipOff(page);
    await page.click('#clipOutliers'); // ON
    await assertCheckboxChecked(page);
    await assertClipOn(page);
  });

  test('ON → OFF → ON → ends clipping', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('#clipOutliers'); // ON
    await assertCheckboxChecked(page);
    await assertClipOn(page);
  });

  test('ON → OFF → ON → OFF → ends NOT clipping', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('#clipOutliers'); // ON
    await page.click('#clipOutliers'); // OFF
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });
});

// ─── Group 3: Tab switch state persistence ────────────────────────────────────
// Failure mode: nominalsClipOutliers JS state gets out of sync with checkbox
// when switching tabs (TIPS has no #clipOutliers and doesn't touch the variable).

test.describe('Clip Outliers — state persists across tab switches', () => {
  test.beforeEach(async ({ page }) => { await loadTreasuries(page); });

  test('clip ON → switch to TIPS → switch back → still ON', async ({ page }) => {
    await page.click('[data-tab="tips"]');
    await page.click('[data-tab="treasuries"]');
    await assertCheckboxChecked(page);
    await assertClipOn(page);
  });

  test('clip OFF → switch to TIPS → switch back → still OFF', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await assertClipOff(page);
    await page.click('[data-tab="tips"]');
    await page.click('[data-tab="treasuries"]');
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });

  test('clip OFF → two tab round-trips → still OFF', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('[data-tab="tips"]');
    await page.click('[data-tab="treasuries"]');
    await page.click('[data-tab="tips"]');
    await page.click('[data-tab="treasuries"]');
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });
});

// ─── Group 4: Spread mode interaction ────────────────────────────────────────
// Failure mode: switchChartMode or FedInvest-state save/restore logic
// accidentally resets or overrides nominalsClipOutliers.

test.describe('Clip Outliers — spread mode interaction', () => {
  test.beforeEach(async ({ page }) => { await loadTreasuries(page); });

  test('clip ON → enter Spreads → exit Spreads → still ON', async ({ page }) => {
    await page.click('.tab-btn[data-mode="spread"]');
    await expect(page.locator('#spreadChartWrap')).toBeVisible();
    await page.click('.tab-btn[data-mode="yield"]');
    await expect(page.locator('#yieldChartWrap')).toBeVisible();
    await assertCheckboxChecked(page);
    await assertClipOn(page);
  });

  test('clip OFF → enter Spreads → exit Spreads → still OFF', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await assertClipOff(page);
    await page.click('.tab-btn[data-mode="spread"]');
    await expect(page.locator('#spreadChartWrap')).toBeVisible();
    await page.click('.tab-btn[data-mode="yield"]');
    await expect(page.locator('#yieldChartWrap')).toBeVisible();
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });

  test('clip ON → Spreads → TIPS → Treasuries → Yield Curves → still ON', async ({ page }) => {
    await page.click('.tab-btn[data-mode="spread"]');
    await page.click('[data-tab="tips"]');
    await page.click('[data-tab="treasuries"]');
    await page.click('.tab-btn[data-mode="yield"]');
    await assertCheckboxChecked(page);
    await assertClipOn(page);
  });

  test('clip OFF → Spreads → TIPS → Treasuries → Yield Curves → still OFF', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('.tab-btn[data-mode="spread"]');
    await page.click('[data-tab="tips"]');
    await page.click('[data-tab="treasuries"]');
    await page.click('.tab-btn[data-mode="yield"]');
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });
});

// ─── Group 5: Notes toggle interaction ───────────────────────────────────────
// Clipping uses Bills + Notes IQR. This fixture has no Bills rows, so hiding
// Notes removes the only IQR source and clipping is short-circuited. Tests confirm that:
// (a) showing Notes while clip is ON activates clipping immediately,
// (b) clip state is not corrupted by Notes visibility changes.

test.describe('Clip Outliers — Notes toggle interaction', () => {
  test.beforeEach(async ({ page }) => { await loadTreasuries(page); });

  test('clip ON → hide Notes → show Notes → clip re-activates', async ({ page }) => {
    await assertClipOn(page);
    await page.click('#filterNotes'); // hide Notes → only Bonds visible (~4.6–5.17%)
    // Notes hidden: IQR source disappears, so clip cannot apply — bounds widen to Bonds range
    const hiddenBounds = await getYBounds(page);
    expect(hiddenBounds.min, 'Bonds-only min should be ~4.6%').toBeGreaterThan(4.5);
    await page.click('#filterNotes'); // show Notes again
    // Notes visible + clip ON → extreme notes (1.5%, 2.0%) excluded → min > 2.5
    await assertCheckboxChecked(page);
    await assertClipOn(page);
  });

  test('clip OFF → hide Notes → show Notes → still NOT clipping', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('#filterNotes'); // hide Notes
    await page.click('#filterNotes'); // show Notes
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });

  test('clip ON → hide Notes → turn clip OFF → show Notes → remains OFF', async ({ page }) => {
    await page.click('#filterNotes'); // hide Notes
    await page.click('#clipOutliers'); // turn clip OFF while Notes hidden
    await page.click('#filterNotes'); // show Notes
    // Clip was turned off while Notes were hidden — must stay off when Notes reappear
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });

  test('clip OFF → hide Notes → turn clip ON → show Notes → activates clipping', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('#filterNotes'); // hide Notes
    await page.click('#clipOutliers'); // ON while Notes hidden
    await page.click('#filterNotes'); // show Notes
    await assertCheckboxChecked(page);
    await assertClipOn(page);
  });
});

// ─── Group 6: Checkbox/state consistency under mixed sequences ────────────────
// Directly targets the reported bug: "sometimes clipped when not checked,
// sometimes not clipped when checked — depends on keystroke sequence."

test.describe('Clip Outliers — checkbox/state consistency', () => {
  test.beforeEach(async ({ page }) => { await loadTreasuries(page); });

  test('checkbox checked → Y scale must be clipped (no divergence)', async ({ page }) => {
    await assertCheckboxChecked(page);
    await assertClipOn(page);
  });

  test('checkbox unchecked → Y scale must NOT be clipped (no divergence)', async ({ page }) => {
    await page.click('#clipOutliers');
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });

  test('after tab switch: checkbox state matches actual clipping', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('[data-tab="tips"]');
    await page.click('[data-tab="treasuries"]');
    const checked = await page.locator('#clipOutliers').isChecked();
    expect(checked, 'checkbox should still be unchecked after tab round-trip').toBe(false);
    await assertClipOff(page);
  });

  test('after spread mode: checkbox state matches actual clipping', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('.tab-btn[data-mode="spread"]');
    await page.click('.tab-btn[data-mode="yield"]');
    const checked = await page.locator('#clipOutliers').isChecked();
    expect(checked, 'checkbox should still be unchecked after spread round-trip').toBe(false);
    await assertClipOff(page);
  });

  test('compound sequence (tab + Notes + spread) → clip OFF persists', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('[data-tab="tips"]');
    await page.click('[data-tab="treasuries"]');
    await page.click('#filterNotes');  // hide Notes
    await page.click('#filterNotes');  // show Notes
    await page.click('.tab-btn[data-mode="spread"]');
    await page.click('.tab-btn[data-mode="yield"]');
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });

  test('rapid toggle OFF–ON: ends ON and is clipping', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('#clipOutliers'); // ON
    await assertCheckboxChecked(page);
    await assertClipOn(page);
  });

  test('rapid toggle OFF–ON–OFF: ends OFF and is not clipping', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    await page.click('#clipOutliers'); // ON
    await page.click('#clipOutliers'); // OFF
    await assertCheckboxUnchecked(page);
    await assertClipOff(page);
  });
});

// ─── Group 7: Bills outlier (regression) ─────────────────────────────────────
// Real-world bug: a near-maturity Bill traded at a tiny premium showed -0.639% YTM,
// which the old algorithm didn't clip because IQR/floor were sourced from Notes only.
// Fixture has 2 extreme-low Bills, normal Bills/Notes/Bonds, and no extreme Notes —
// clip must still activate because Bills now feed the IQR source too.

// Bills are zero-coupon: yieldFromPrice uses the simple 365/d investment-rate formula
// (100/price - 1) * 365/days when days-to-maturity < ~182.5. Compute price from the
// desired yield with that same formula so the round-trip is exact, and keep every
// bill within the 182-day window so the simple formula (not bond math) always applies.
const SETTLE_DATE = new Date(2026, 2, 25); // 2026-03-25
function addDays(days) { const d = new Date(SETTLE_DATE); d.setDate(d.getDate() + days); return d; }
function isoDate(d) { return d.toISOString().slice(0, 10); }
function billPriceForYield(yieldFrac, days) { return 100 / (1 + yieldFrac * days / 365); }

function makeBillsOutlierCsv() {
  const rows = [
    SETTLE,
    'type,cusip,maturity,coupon,datedDateCpi,price,yield',
    // 2 extreme-low bills (-0.639%, -1.200%) — the reported bug shape
    `MARKET BASED BILL,BLOW00001,${isoDate(addDays(170))},0.00000,,${billPriceForYield(-0.00639, 170).toFixed(3)},-0.00639`,
    `MARKET BASED BILL,BLOW00002,${isoDate(addDays(140))},0.00000,,${billPriceForYield(-0.0120, 140).toFixed(3)},-0.01200`,
    // 3 TIPS (needed for TIPS tab initial load)
    'TIPS,91282CCA7,2026-04-15,0.00125,262.25027,100.0625,0.000',
    'TIPS,912828S50,2026-07-15,0.00125,239.70132,101.4375,0.000',
    'TIPS,91282CDC2,2026-10-15,0.00125,273.25771,100.96875,0.000',
  ];
  // 10 normal bills (4.00–4.09%), all within the 182-day zero-coupon window
  for (let i = 0; i < 10; i++) {
    const y = 0.0400 + i * 0.001;
    const days = 60 + i * 10;
    rows.push(`MARKET BASED BILL,BNRM${String(i).padStart(5, '0')},${isoDate(addDays(days))},0.00000,,${billPriceForYield(y, days).toFixed(3)},${y.toFixed(5)}`);
  }
  // 10 normal notes (4.10–4.19%) — coupon bond priced at par yields exactly its coupon
  for (let i = 0; i < 10; i++) {
    const y = (0.0410 + i * 0.001).toFixed(5);
    rows.push(`MARKET BASED NOTE,NNRM${String(i).padStart(5, '0')},${2029 + i}-01-15,${y},,100.000,${y}`);
  }
  // 10 bonds (4.60–4.69%)
  for (let i = 0; i < 10; i++) {
    const y = (0.0460 + i * 0.001).toFixed(5);
    rows.push(`MARKET BASED BOND,BDRM${String(i).padStart(5, '0')},${2057 + i * 2}-01-15,${y},,100.000,${y}`);
  }
  return rows.join('\n');
}

const MARKET_QUOTES_EMPTY_CSV = '2026-03-25 08:27 EDT\ntype,cusip,maturity,coupon,askPrice,bidPrice,adjAskPrice,adjBidPrice';

const BILLS_OUTLIER_CSV = makeBillsOutlierCsv();

test.describe('Clip Outliers — Bills outlier regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/Treasuries/YieldsFromFedInvestPrices.csv', r => r.fulfill({ status: 200, contentType: 'text/csv', body: BILLS_OUTLIER_CSV }));
    await page.route('**/TIPS/RefCpiNsaSa.csv',                      r => r.fulfill({ status: 200, contentType: 'text/csv', body: REF_CPI_CSV }));
    await page.route('**/misc/BondHolidaysSifma.csv',                       r => r.fulfill({ status: 200, contentType: 'text/csv', body: HOLIDAYS_CSV }));
    await page.route('**/TIPS/GswTipsCurve.json', r => r.fulfill({ status: 404, body: '' }));  // GSW overlay: force snapshot fallback in tests
    await page.route('**/Treasuries/MarketQuotes.csv',            r => r.fulfill({ status: 200, contentType: 'text/csv', body: MARKET_QUOTES_EMPTY_CSV }));
    await page.goto('./');
    // FedInvest defaults off and Market quotes is empty in this fixture, so it's the only source.
    await page.check('#chkTipsFed');
    await expect(page.locator('#saTable tbody tr')).toHaveCount(3, { timeout: 10000 });
    await page.click('[data-tab="treasuries"]');
    await page.check('#chkFedInvest');
    await expect(page.locator('#nominalsTable tbody tr')).toHaveCount(32, { timeout: 10000 });
  });

  test('clip ON excludes extreme-low Bills from Y scale', async ({ page }) => {
    await assertCheckboxChecked(page);
    const b = await getYBounds(page);
    expect(b, 'Y bounds must exist').not.toBeNull();
    expect(b.min, `bounds.min=${b.min?.toFixed(3)} — clip ON should exclude -0.639%/-1.2% outlier bills, min should be >2.5`).toBeGreaterThan(2.5);
  });

  test('clip OFF includes extreme-low Bills in Y scale', async ({ page }) => {
    await page.click('#clipOutliers'); // OFF
    const b = await getYBounds(page);
    expect(b, 'Y bounds must exist').not.toBeNull();
    expect(b.min, `bounds.min=${b.min?.toFixed(3)} — clip OFF should include -1.2% outlier bill, min should be <0`).toBeLessThan(0);
  });
});
