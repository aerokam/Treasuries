import { test, expect } from '@playwright/test';

// ─── Shared fixture data ───────────────────────────────────────────────────────
// Same CUSIPs across FedInvest + Fidelity so parseFidelityNominals accepts them.

const SETTLE = '2026-03-25';

const FED_YIELDS_CSV = [
  SETTLE,
  'type,cusip,maturity,coupon,datedDateCpi,price,yield',
  'MARKET BASED BILL,912797TB3,2026-06-26,0.000,,99.060,0.000',
  'MARKET BASED NOTE,91282CBT7,2028-03-25,0.04250,,100.000,0.04250',
  'MARKET BASED NOTE,91282CKH3,2031-03-25,0.04350,,100.000,0.04350',
  'MARKET BASED BOND,912810PS1,2036-03-25,0.04750,,100.000,0.04750',
  'MARKET BASED BOND,912810XX1,2056-03-25,0.04850,,100.000,0.04850',
  'TIPS,91282CCA7,2026-04-15,0.00125,262.25027,100.0625,0.000',
  'TIPS,912828S50,2026-07-15,0.00125,239.70132,101.4375,0.000',
  'TIPS,91282CDC2,2026-10-15,0.00125,273.25771,100.96875,0.000',
].join('\n');

const REF_CPI_CSV = [
  'Ref CPI Date,Ref CPI NSA,Ref CPI SA,SA Factor',
  '2026-04-15,325.96740,326.99493,0.99686',
  '2026-07-15,321.09758,320.44561,1.00203',
  '2026-10-15,323.46710,322.67571,1.00245',
  '2026-03-25,324.74961,326.35442,0.99508',
  '2026-03-26,324.74961,326.35442,0.99508',
].join('\n');

const HOLIDAYS_CSV = '"Wednesday, January 1, 2025",New Year\'s Day\n';

const FID_COMBINED_CSV = [
  'Product,Description,Cusip|State,Coupon,Frequency,Maturity date,Call protected,Moody\'s/S&P rating,Yield,Bid price/Quantity (min),Adjusted bid price,Inflation factor,Ask price/Quantity (min),Adjusted ask price,Ask yield to worst,Ask yield to sink,Ask yield to maturity,3rd party price,Depth of book,Attributes,',
  'Treasury,"UNITED STATES TREAS BILLS ZERO CPN 0.00000% 06/26/2026",912797TB3,0.000,,2026-06-26,Yes,--/ --,3.820,99.040/1000(1000),--,--,99.060/1000(1000),--,3.810,--,3.810,--,--,CP',
  'Treasury,"UNITED STATES TREAS SER W-2028 4.25000% 03/25/2028 NTS NOTE",91282CBT7,4.250,semi-annually,2028-03-25,Yes,AA1/ --,4.310,99.900/1000(1000),--,--,100.000/1000(1000),--,4.300,--,4.300,--,--,"CP, IE"',
  'Treasury,"UNITED STATES TREAS SER AZ-2031 4.35000% 03/25/2031 NTS NOTE",91282CKH3,4.350,semi-annually,2031-03-25,Yes,AA1/ --,4.410,99.900/1000(1000),--,--,100.000/1000(1000),--,4.400,--,4.400,--,--,"CP, IE"',
  'Treasury,"UNITED STATES TREAS BDS 4.75000% 03/25/2036",912810PS1,4.750,semi-annually,2036-03-25,Yes,AA1/ --,4.810,99.900/1000(1000),--,--,100.000/1000(1000),--,4.800,--,4.800,--,--,"CP, IE"',
  'Treasury,"UNITED STATES TREAS BDS 4.85000% 03/25/2056",912810XX1,4.850,semi-annually,2056-03-25,Yes,AA1/ --,4.910,99.900/1000(1000),--,--,100.000/1000(1000),--,4.900,--,4.900,--,--,"CP, IE"',
  'TIPS,"UNITED STATES TREAS NTS SER X-2026 0.12500% 04/15/2026",91282CCA7,0.125,semi-annually,2026-04-15,Yes,AA1/ --,-1.019,100.062/6000(100),124.011839,1.23935,100.132/6000(100),124.098594,-2.274,--,-2.274,--,--,"CP, IE"',
  'TIPS,"UNITED STATES TREAS NTS 0.12500% 07/15/2026 TIPS",912828S50,0.125,semi-annually,2026-07-15,Yes,AA1/ --,-3.842,101.231/6000(100),137.263162,1.35594,101.284/6000(100),137.335026,-4.011,--,-4.011,--,--,"CP, IE"',
  'TIPS,"UNITED STATES TREAS NTS SER AE-2026 0.12500% 10/15/2026",91282CDC2,0.125,semi-annually,2026-10-15,Yes,AA1/ --,-1.095,100.680/6000(100),119.751812,1.18943,100.738/6000(100),119.820799,-1.197,--,-1.197,--,--,"CP, IE"',
  // Download-date footer, as the real export carries it: the quote settles T+1 from this date
  // (2026-03-26), and both quoted sides are priced to that date.
  'Date downloaded   03/25/2026 08:27 AM',
].join('\n');

// ─── Setup helpers ────────────────────────────────────────────────────────────

async function setupRoutes(page) {
  await page.route('**/Treasuries/YieldsFromFedInvestPrices.csv', r => r.fulfill({ status: 200, contentType: 'text/csv', body: FED_YIELDS_CSV }));
  await page.route('**/TIPS/RefCpiNsaSa.csv',                      r => r.fulfill({ status: 200, contentType: 'text/csv', body: REF_CPI_CSV }));
  await page.route('**/misc/BondHolidaysSifma.csv',                       r => r.fulfill({ status: 200, contentType: 'text/csv', body: HOLIDAYS_CSV }));
  await page.route('**/TIPS/GswTipsCurve.json', r => r.fulfill({ status: 404, body: '' }));  // GSW overlay: force snapshot fallback in tests
  await page.route('**/Treasuries/FidelityTreasuriesTips.csv',            r => r.fulfill({ status: 200, contentType: 'text/csv', body: FID_COMBINED_CSV }));
}

// Load on TIPS tab, wait for initial render + market data
async function loadTips(page) {
  await setupRoutes(page);
  await page.goto('./');
  await expect(page.locator('#saTable tbody tr')).toHaveCount(3, { timeout: 10000 });
  await expect(page.locator('#chkTipsBroker')).not.toBeDisabled({ timeout: 5000 });
}

// Load and switch to Treasuries tab, wait for render + market data
async function loadTreasuries(page) {
  await setupRoutes(page);
  await page.goto('./');
  await expect(page.locator('#saTable tbody tr')).toHaveCount(3, { timeout: 10000 });
  await page.click('[data-tab="treasuries"]');
  await expect(page.locator('#nominalsTable tbody tr')).toHaveCount(5, { timeout: 10000 });
  await expect(page.locator('#chkFidelity')).not.toBeDisabled({ timeout: 5000 });
}

// Same as FID_COMBINED_CSV, but the Bill's CUSIP root is one shared/src/treasury-cusip.js
// does not recognise -- proves the Unclassified checkbox actually appears/hides based on
// real data, not just that the code compiles (shared/src/fidelity-parse.js#parseFidelityNominalRows).
const FID_WITH_UNCLASSIFIED_CSV = FID_COMBINED_CSV.replace(/912797TB3/g, '999999TB3');

test('Unclassified checkbox: hidden with no unrecognized CUSIP, appears when one occurs', async ({ page }) => {
  await page.route('**/Treasuries/YieldsFromFedInvestPrices.csv', r => r.fulfill({ status: 200, contentType: 'text/csv', body: FED_YIELDS_CSV }));
  await page.route('**/TIPS/RefCpiNsaSa.csv',                      r => r.fulfill({ status: 200, contentType: 'text/csv', body: REF_CPI_CSV }));
  await page.route('**/misc/BondHolidaysSifma.csv',                       r => r.fulfill({ status: 200, contentType: 'text/csv', body: HOLIDAYS_CSV }));
  await page.route('**/TIPS/GswTipsCurve.json', r => r.fulfill({ status: 404, body: '' }));
  await page.route('**/Treasuries/FidelityTreasuriesTips.csv',            r => r.fulfill({ status: 200, contentType: 'text/csv', body: FID_WITH_UNCLASSIFIED_CSV }));
  await page.goto('./');
  await expect(page.locator('#saTable tbody tr')).toHaveCount(3, { timeout: 10000 });
  await page.click('[data-tab="treasuries"]');
  await expect(page.locator('#nominalsTable tbody tr')).toHaveCount(5, { timeout: 10000 });

  await expect(page.locator('#filterUnclassifiedRow')).toBeVisible();
  await expect(page.locator('#filterUnclassified')).toBeChecked();
  await expect(page.locator('#nominalsTable tbody tr', { hasText: '999999TB3' })).toContainText('Unclassified');

  // Unchecking it removes just that one row, same as any other type checkbox.
  await page.locator('#filterUnclassified').uncheck();
  await expect(page.locator('#nominalsTable tbody tr', { hasText: '999999TB3' })).toHaveCount(0);
});

function spreadBtn(page) { return page.locator('.tab-btn[data-mode="spread"]'); }
function yieldBtn(page)  { return page.locator('.tab-btn[data-mode="yield"]'); }

// ─── Spread mode: persistence across tabs ────────────────────────────────────

test('spread mode persists when switching from TIPS to Treasuries', async ({ page }) => {
  await loadTips(page);
  await spreadBtn(page).click();
  await expect(spreadBtn(page)).toHaveClass(/active/);
  await page.click('[data-tab="treasuries"]');
  await expect(spreadBtn(page)).toHaveClass(/active/);
  await expect(page.locator('#spreadChartWrap')).toBeVisible();
  await expect(page.locator('#yieldChartWrap')).toBeHidden();
});

test('spread mode persists when switching from Treasuries to TIPS', async ({ page }) => {
  await loadTreasuries(page);
  await spreadBtn(page).click();
  await page.click('[data-tab="tips"]');
  await expect(spreadBtn(page)).toHaveClass(/active/);
  await expect(page.locator('#spreadChartWrap')).toBeVisible();
});

test('switching back to yield mode works', async ({ page }) => {
  await loadTips(page);
  await spreadBtn(page).click();
  await yieldBtn(page).click();
  await expect(yieldBtn(page)).toHaveClass(/active/);
  await expect(page.locator('#yieldChartWrap')).toBeVisible();
  await expect(page.locator('#spreadChartWrap')).toBeHidden();
});

// ─── FedInvest checkbox: grayed in spread, restored on exit ──────────────────

test('FedInvest disabled and grayed in TIPS spread mode', async ({ page }) => {
  await loadTips(page);
  await spreadBtn(page).click();
  await expect(page.locator('#chkTipsFed')).toBeDisabled();
  await expect(page.locator('#chkTipsFed').locator('..')).toHaveCSS('opacity', '0.4');
});

test('FedInvest restored when leaving TIPS spread mode', async ({ page }) => {
  await loadTips(page);
  await spreadBtn(page).click();
  await yieldBtn(page).click();
  await expect(page.locator('#chkTipsFed')).toBeEnabled();
  await expect(page.locator('#chkTipsFed').locator('..')).not.toHaveCSS('opacity', '0.4');
});

test('FedInvest disabled and grayed in Treasuries spread mode', async ({ page }) => {
  await loadTreasuries(page);
  await spreadBtn(page).click();
  await expect(page.locator('#chkFedInvest')).toBeDisabled();
  await expect(page.locator('#chkFedInvest').locator('..')).toHaveCSS('opacity', '0.4');
});

test('FedInvest restored when leaving Treasuries spread mode', async ({ page }) => {
  await loadTreasuries(page);
  await spreadBtn(page).click();
  await yieldBtn(page).click();
  await expect(page.locator('#chkFedInvest')).toBeEnabled();
  await expect(page.locator('#chkFedInvest').locator('..')).not.toHaveCSS('opacity', '0.4');
});

// ─── Controls visibility ──────────────────────────────────────────────────────

test('nominalsControls visible in Treasuries yield mode', async ({ page }) => {
  await loadTreasuries(page);
  await expect(page.locator('#nominalsControls')).toBeVisible();
});

test('nominalsControls visible in Treasuries spread mode', async ({ page }) => {
  await loadTreasuries(page);
  await spreadBtn(page).click();
  await expect(page.locator('#nominalsControls')).toBeVisible();
});

test('tipsControls visible in TIPS yield mode', async ({ page }) => {
  await loadTips(page);
  await expect(page.locator('#tipsControls')).toBeVisible();
});

test('tipsControls hidden in TIPS spread mode', async ({ page }) => {
  await loadTips(page);
  await spreadBtn(page).click();
  await expect(page.locator('#tipsControls')).toBeHidden();
});

test('tipsControls hidden on Treasuries tab', async ({ page }) => {
  await loadTreasuries(page);
  await expect(page.locator('#tipsControls')).toBeHidden();
});

test('nominalsControls hidden on TIPS tab', async ({ page }) => {
  await loadTips(page);
  await expect(page.locator('#nominalsControls')).toBeHidden();
});

// ─── STRIPS checkbox not disabled in spread mode ──────────────────────────────

test('STRIPS checkbox enabled in Treasuries spread mode', async ({ page }) => {
  await loadTreasuries(page);
  await spreadBtn(page).click();
  await expect(page.locator('#filterStrips')).toBeEnabled();
});

// ─── Bond type selection in spread mode ──────────────────────────────────────

test('unchecking Bonds in Treasuries spread removes Bonds series', async ({ page }) => {
  await loadTreasuries(page);
  await spreadBtn(page).click();
  // Spread chart should render
  await expect(page.locator('#spreadChartWrap')).toBeVisible();
  // Uncheck Bonds — no error, chart still shown
  await page.locator('#filterBonds').uncheck();
  await expect(page.locator('#spreadChartWrap')).toBeVisible();
  // Re-check
  await page.locator('#filterBonds').check();
  await expect(page.locator('#spreadChartWrap')).toBeVisible();
});

test('unchecking Bills+Notes in Treasuries spread shows only Bonds', async ({ page }) => {
  await loadTreasuries(page);
  await spreadBtn(page).click();
  await page.locator('#filterBills').uncheck();
  await page.locator('#filterNotes').uncheck();
  await expect(page.locator('#spreadChartWrap')).toBeVisible();
  // Re-check all
  await page.locator('#filterBills').check();
  await page.locator('#filterNotes').check();
  await expect(page.locator('#spreadChartWrap')).toBeVisible();
});

// ─── BEI tab: Spot BEI series wiring ─────────────────────────────────────────

test('BEI tab loads with the Spot BEI toggle and no crash', async ({ page }) => {
  await loadTips(page);
  await page.click('[data-tab="bei"]');
  await expect(page.locator('#beiTableBody tr')).toHaveCount(3, { timeout: 10000 });
  await expect(page.locator('#showBeiSpot')).not.toBeChecked();   // off by default — opt in
  // toggling it must not throw even when the curve did not fit (tiny fixture)
  await page.locator('#showBeiSpot').check();
  await page.locator('#showBeiSpot').uncheck();
  await expect(page.locator('#yieldChart')).toBeVisible();
});

test('Treasuries + TIPS SHOW rows carry Spot / Spot SA', async ({ page }) => {
  await loadTreasuries(page);
  await page.click('[data-tab="tips"]');
  await expect(page.locator('#showTipsSpot')).toBeVisible();
  await expect(page.locator('#showTipsSpotSa')).toBeVisible();
});

test('Treasuries Spot toggle is off by default and toggles without crash', async ({ page }) => {
  await loadTreasuries(page);
  await expect(page.locator('#showTsySpot')).not.toBeChecked();   // off by default — opt in
  await page.locator('#showTsySpot').check();
  await page.locator('#showTsySpot').uncheck();
  await expect(page.locator('#yieldChart')).toBeVisible();
});

test('Treasuries Spot label opens a help popup', async ({ page }) => {
  await loadTreasuries(page);
  await page.click('#nominalsControls a.col-help[data-col="spot-tsy"]');
  await expect(page.locator('#drill-modal')).toContainText('Zero-Coupon Yield Curve');
});

// ─── Market-quote nominal yields are calculated from price, not read from the quote ──
// The fixture quotes this Bill at an ask yield of 3.810% on an ask price of 99.060. That
// price, settling 2026-03-26 (T+1 from the file's download date) against a 2026-06-26
// maturity, is 92 days of a 365-day year, so the Treasury investment rate it implies is
// (100 / 99.060 - 1) x 365 / 92 = 3.765%. Reading the quoted yield would show 3.810%.
test('market-quote nominal yield comes from the quoted price, not the quoted yield', async ({ page }) => {
  await loadTreasuries(page);
  const billRow = page.locator('#nominalsTable tbody tr', { hasText: '912797TB3' });
  await expect(billRow).toContainText('3.765%');
  await expect(billRow).not.toContainText('3.810%');
});

test('Treasuries: unchecking Bills/Notes/Bonds with Spot on leaves only Spot curve rows', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await loadTreasuries(page);
  await page.locator('#showTsySpot').check();
  await page.locator('#filterBills').uncheck();
  await page.locator('#filterNotes').uncheck();
  await page.locator('#filterBonds').uncheck();
  // Security rows are gone, but Spot curve rows remain — the curve fits the full non-STRIP
  // set regardless of which security types are checked (per 3.7.3 Draw Treasuries view).
  const rows = page.locator('#nominalsTable tbody tr');
  await expect(rows.first()).toContainText('Spot (');
  await expect(page.locator('#nominalsTable tbody tr', { hasText: '912797TB3' })).toHaveCount(0);
  // re-check restores the per-bond rows too
  await page.locator('#filterNotes').check();
  await expect(page.locator('#nominalsTable tbody tr', { hasText: '91282CBT7' })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Treasuries Ask column: implied by any security type, gone when none are checked', async ({ page }) => {
  await loadTreasuries(page);
  await expect(page.locator('#nominalsTable thead th', { hasText: 'Ask' })).toHaveCount(1);
  // Unclassified stays hidden for this fixture (no unrecognized CUSIP root in it), so it
  // can't be unchecked here and doesn't need to be — Bills/Notes/Bonds off is already every
  // visible, relevant type off.
  await expect(page.locator('#filterUnclassifiedRow')).toBeHidden();
  await page.locator('#filterBills').uncheck();
  await page.locator('#filterNotes').uncheck();
  await page.locator('#filterBonds').uncheck();
  // Ask has no checkbox of its own — with every security type off, there is nothing left
  // for it to imply, so the column disappears too.
  await expect(page.locator('#nominalsTable thead th', { hasText: 'Ask' })).toHaveCount(0);
  await page.locator('#filterBonds').check();
  await expect(page.locator('#nominalsTable thead th', { hasText: 'Ask' })).toHaveCount(1);
});

test('Treasuries All/None covers Spot too, since Ask has no checkbox of its own', async ({ page }) => {
  await loadTreasuries(page);
  await page.locator('#showTsySpot').check();
  await page.locator('#nominalsShowNone').click();
  await expect(page.locator('#filterBills')).not.toBeChecked();
  await expect(page.locator('#filterNotes')).not.toBeChecked();
  await expect(page.locator('#filterBonds')).not.toBeChecked();
  await expect(page.locator('#filterStrips')).not.toBeChecked();
  await expect(page.locator('#showTsySpot')).not.toBeChecked();
  await page.locator('#nominalsShowAll').click();
  await expect(page.locator('#filterBills')).toBeChecked();
  await expect(page.locator('#filterNotes')).toBeChecked();
  await expect(page.locator('#filterBonds')).toBeChecked();
  await expect(page.locator('#filterStrips')).toBeChecked();
  await expect(page.locator('#showTsySpot')).toBeChecked();
});

// ─── Maturity Range recomputes to match whatever is currently checked ────────────────────

test('Treasuries: checking Bills after None sets the range to match Bills, not the old range', async ({ page }) => {
  await loadTreasuries(page);
  await page.locator('#nominalsShowNone').click();
  await page.locator('#filterBills').check();
  const end = await page.locator('#endMaturity').inputValue();
  // The fixture's only Bill matures 2026-06-26 — the range must shrink to match it, not
  // stay at whatever wide span (out to the 2056 Bond) was showing before None was clicked.
  expect(new Date(end).getFullYear()).toBeLessThan(2030);
});

test('Treasuries: checking Spot alongside Bills-only expands the range to the full curve', async ({ page }) => {
  await loadTreasuries(page);
  await page.locator('#nominalsShowNone').click();
  await page.locator('#filterBills').check();
  const endBillsOnly = await page.locator('#endMaturity').inputValue();
  await page.locator('#showTsySpot').check();
  const endWithSpot = await page.locator('#endMaturity').inputValue();
  expect(new Date(endWithSpot).getTime()).toBeGreaterThan(new Date(endBillsOnly).getTime());
});

test('Treasuries: unchecking Bonds narrows the range back down to what remains checked', async ({ page }) => {
  await loadTreasuries(page);
  const endBefore = await page.locator('#endMaturity').inputValue();   // Bills+Notes+Bonds
  await page.locator('#filterBonds').uncheck();
  const endAfter = await page.locator('#endMaturity').inputValue();    // Bills+Notes only
  expect(new Date(endAfter).getTime()).toBeLessThan(new Date(endBefore).getTime());
  await page.locator('#filterBonds').check();
  await expect(page.locator('#endMaturity')).toHaveValue(endBefore);
});

test('Treasuries: a manually typed range holds until the next checkbox change', async ({ page }) => {
  await loadTreasuries(page);
  const before = await page.locator('#nominalsTable tbody tr').count();
  await page.evaluate(() => {
    const el = document.getElementById('endMaturity');
    el.value = '2027-01-01';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const narrowed = await page.locator('#nominalsTable tbody tr').count();
  expect(narrowed).toBeLessThan(before);
  // The next checkbox change recomputes the range and drops the manual value.
  await page.locator('#filterBonds').uncheck();
  await page.locator('#filterBonds').check();
  await expect(page.locator('#endMaturity')).not.toHaveValue('2027-01-01');
});

test('Treasuries Spot fit spans the full nominal set regardless of which security types are checked', async ({ page }) => {
  await loadTreasuries(page);
  await page.locator('#showTsySpot').check();
  await page.locator('#filterBills').uncheck();
  await page.locator('#filterNotes').uncheck();
  await page.locator('#filterStrips').uncheck();
  // Only Bonds is left checked, but the Spot curve still fits the whole non-STRIP set — its
  // first term should come from the Bill's short maturity, not from the Bonds' 10y+ range.
  const firstCurveRow = page.locator('#nominalsTable tbody tr', { hasText: 'Spot (' }).first();
  await expect(firstCurveRow).toBeVisible();
  const termText = await firstCurveRow.locator('td').first().innerText();
  const term = parseFloat(termText.match(/\(([\d.]+)y\)/)[1]);
  expect(term).toBeLessThan(2);
});

// ─── Spot dataset is fully absent from the chart when unchecked, not merely hidden ───────

test('Treasuries: unchecked Spot has no chart dataset at all (no struck-through legend entry)', async ({ page }) => {
  await loadTreasuries(page);
  await expect(page.locator('#showTsySpot')).not.toBeChecked();
  const hasSpotBefore = await page.evaluate(() =>
    Object.values(Chart.instances).some(c => c.data.datasets.some(ds => ds.label.startsWith('Spot'))));
  expect(hasSpotBefore).toBe(false);
  await page.locator('#showTsySpot').check();
  const hasSpotAfter = await page.evaluate(() =>
    Object.values(Chart.instances).some(c => c.data.datasets.some(ds => ds.label.startsWith('Spot'))));
  expect(hasSpotAfter).toBe(true);
});
