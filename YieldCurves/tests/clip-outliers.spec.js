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
// Fidelity CSV covers the 30 normal notes + 20 bonds (same CUSIPs as FedInvest)
// so the Market source activates and the Spreads button becomes enabled.
// Fidelity yields are in PERCENTAGE form (e.g., "4.000" for 4%) as required
// by parseFidelityNominals which divides by 100 internally.

const SETTLE = '2026-03-25';

function makeFedOutlierCsv() {
  const rows = [
    SETTLE,
    'type,cusip,maturity,coupon,datedDateCpi,price,yield',
    // 2 extreme-low notes (1.5%, 2.0%) — no Fidelity counterpart
    'MARKET BASED NOTE,NLOW00001,2027-01-15,0.01500,,100.000,0.01500',
    'MARKET BASED NOTE,NLOW00002,2028-01-15,0.02000,,100.000,0.02000',
    // 3 TIPS (needed for TIPS tab initial load)
    'TIPS,91282CCA7,2026-04-15,0.00125,262.25027,100.0625,0.000',
    'TIPS,912828S50,2026-07-15,0.00125,239.70132,101.4375,0.000',
    'TIPS,91282CDC2,2026-10-15,0.00125,273.25771,100.96875,0.000',
  ];
  // 30 normal notes (4.00–4.58%) — CUSIPs match Fidelity below
  for (let i = 0; i < 30; i++) {
    const y = (0.0400 + i * 0.0002).toFixed(5);
    const cusip = `NORM${String(i).padStart(5, '0')}`;
    const matYear = 2029 + Math.floor(i / 2);
    const matMonth = i % 2 === 0 ? '01' : '07';
    rows.push(`MARKET BASED NOTE,${cusip},${matYear}-${matMonth}-15,${y},,100.000,${y}`);
  }
  // 20 bonds (4.60–5.17%) — CUSIPs match Fidelity below
  for (let i = 0; i < 20; i++) {
    const y = (0.0460 + i * 0.0003).toFixed(5);
    const cusip = `BNDX${String(i).padStart(5, '0')}`;
    rows.push(`MARKET BASED BOND,${cusip},${2057 + i * 2}-01-15,${y},,100.000,${y}`);
  }
  return rows.join('\n');
}

// Fidelity yields must be in PERCENTAGE form (parseFidelityNominals divides by 100).
// Description must contain "NOTE" (for notes) or no "BILL"/"NOTE" (for bonds → BDS).
function makeFidCombinedCsv() {
  const HDR = 'Product,Description,Cusip|State,Coupon,Frequency,Maturity date,Call protected,'
    + "Moody's/S&P rating,Yield,Bid price/Quantity (min),Adjusted bid price,Inflation factor,"
    + 'Ask price/Quantity (min),Adjusted ask price,Ask yield to worst,Ask yield to sink,'
    + 'Ask yield to maturity,3rd party price,Depth of book,Attributes,';
  const rows = [HDR];
  for (let i = 0; i < 30; i++) {
    const yDec   = 0.0400 + i * 0.0002;
    const yPct   = (yDec * 100).toFixed(3);
    const bidPct = ((yDec + 0.0001) * 100).toFixed(3);
    const coupon = (yDec * 100).toFixed(3);
    const cusip  = `NORM${String(i).padStart(5, '0')}`;
    const yr     = 2029 + Math.floor(i / 2);
    const mo     = i % 2 === 0 ? '01' : '07';
    rows.push(`Treasury,"US TREAS NOTE ${yPct}% ${mo}/15/${yr}",${cusip},${coupon},semi-annually,${yr}-${mo}-15,Yes,AA1/ --,${bidPct},99.900/1000(1000),--,--,100.000/1000(1000),--,${yPct},--,${yPct},--,--,CP`);
  }
  for (let i = 0; i < 20; i++) {
    const yDec   = 0.0460 + i * 0.0003;
    const yPct   = (yDec * 100).toFixed(3);
    const bidPct = ((yDec + 0.0001) * 100).toFixed(3);
    const coupon = (yDec * 100).toFixed(3);
    const cusip  = `BNDX${String(i).padStart(5, '0')}`;
    const yr     = 2057 + i * 2;
    rows.push(`Treasury,"US TREAS BDS ${yPct}% 01/15/${yr}",${cusip},${coupon},semi-annually,${yr}-01-15,Yes,AA1/ --,${bidPct},99.900/1000(1000),--,--,100.000/1000(1000),--,${yPct},--,${yPct},--,--,CP`);
  }
  // TIPS for broker price overlay
  rows.push('TIPS,"US TREAS TIPS 0.125% 04/15/2026",91282CCA7,0.125,semi-annually,2026-04-15,Yes,AA1/ --,-1.019,100.062/6000(100),124.011839,1.23935,100.132/6000(100),124.098594,-2.274,--,-2.274,--,--,"CP, IE"');
  rows.push('TIPS,"US TREAS TIPS 0.125% 07/15/2026",912828S50,0.125,semi-annually,2026-07-15,Yes,AA1/ --,-3.842,101.231/6000(100),137.263162,1.35594,101.284/6000(100),137.335026,-4.011,--,-4.011,--,--,"CP, IE"');
  rows.push('TIPS,"US TREAS TIPS 0.125% 10/15/2026",91282CDC2,0.125,semi-annually,2026-10-15,Yes,AA1/ --,-1.095,100.680/6000(100),119.751812,1.18943,100.738/6000(100),119.820799,-1.197,--,-1.197,--,--,"CP, IE"');
  return rows.join('\n');
}

const FED_OUTLIER_CSV = makeFedOutlierCsv();
const FID_COMBINED_CSV = makeFidCombinedCsv();

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
  await page.route('**/Treasuries/FidelityTreasuriesTips.csv',            r => r.fulfill({ status: 200, contentType: 'text/csv', body: FID_COMBINED_CSV }));
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

// Navigate to Treasuries tab, wait for FedInvest (52 rows) + Fidelity (Spreads button enabled).
// 52 = 2 extreme notes + 30 normal notes + 20 bonds (all from FedInvest).
// After Fidelity loads, table stays at 52 (Fidelity CUSIPs are a subset of FedInvest).
async function loadTreasuries(page) {
  await setupRoutes(page);
  await page.goto('./');
  await expect(page.locator('#saTable tbody tr')).toHaveCount(3, { timeout: 10000 });
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
// Clipping uses Notes IQR exclusively. When Notes are hidden, clipping is
// short-circuited (no Notes yields for IQR). Tests confirm that:
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
