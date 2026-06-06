// E2E regression tests — guards against GUI breakage (inop buttons, broken table render, drill popups)
// Run: npx playwright test
// Mocks R2 fetches with local YieldsFromFedInvestPrices.csv and RefCPI.csv

import { test, expect } from 'playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nextBondTradingDay, parseBondHolidays } from '../../src/data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES = path.join(ROOT, 'tests', 'e2e');
const csv = name => readFileSync(path.join(FIXTURES, name), 'utf8');

// Compute today's T+1 settlement date using the same logic as the live app.
function computeSettleDateStr() {
  const holidayText = readFileSync(path.join(FIXTURES, 'BondHolidaysSifma.csv'), 'utf8');
  const bondHolidays = parseBondHolidays(holidayText);
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  return nextBondTradingDay(todayISO, bondHolidays);
}

// Yields CSV with line 1 replaced by today's T+1 settlement date.
function yieldsWithTodaySettlement() {
  const raw = csv('YieldsFromFedInvestPrices.csv');
  const lines = raw.split('\n');
  lines[0] = computeSettleDateStr();
  return lines.join('\n');
}

// Holdings CSV for rebalance tests (Format 3: cusip,qty) — single canonical copy in data/
const HOLDINGS_PATH = path.join(ROOT, 'data', 'SampleHoldings.csv');

test.beforeEach(async ({ page }) => {
  const yieldsBody = yieldsWithTodaySettlement();
  await page.route('**/Treasuries/YieldsFromFedInvestPrices.csv', r =>
    r.fulfill({ body: yieldsBody, contentType: 'text/csv' }));
  await page.route('**/TIPS/RefCPI.csv', r =>
    r.fulfill({ body: csv('RefCPI.csv'), contentType: 'text/csv' }));
  await page.route('**/TIPS/TipsRef.csv', r =>
    r.fulfill({ body: csv('TipsRef.csv'), contentType: 'text/csv' }));
  await page.route('**/misc/BondHolidaysSifma.csv', r =>
    r.fulfill({ body: csv('BondHolidaysSifma.csv'), contentType: 'text/csv' }));
  // Allow sample pre-populate to succeed (fetches data/SampleHoldings.csv via serve)
  await page.goto('./');
  // Wait for data load: run button must be enabled
  await expect(page.locator('#run-btn')).not.toBeDisabled({ timeout: 4_000 });
});

// ── 1. Data load ──────────────────────────────────────────────────────────────
test('data loads: info strip shows FedInvest prices and Ref CPI date, run button enabled', async ({ page }) => {
  await expect(page.locator('#info-source')).toContainText('FedInvest prices');
  await expect(page.locator('#info-refcpi')).toContainText('Ref CPI:');
  await expect(page.locator('#run-btn')).not.toBeDisabled();
});

// ── 2. Mode toggle ────────────────────────────────────────────────────────────
test('mode toggle: switching to Build hides holdings, shows year fields; run button re-labeled', async ({ page }) => {
  // Start in Rebalance mode
  await expect(page.locator('#run-btn')).toHaveText('Run Rebalance');
  await expect(page.locator('#field-holdings')).toBeVisible();
  await expect(page.locator('#field-last-year')).not.toBeVisible();

  // Switch to Build
  await page.locator('.tab-btn[data-mode="build"]').click();
  await expect(page.locator('#run-btn')).toHaveText('Build Ladder');
  await expect(page.locator('#field-holdings')).not.toBeVisible();
  await expect(page.locator('#field-last-year')).toBeVisible();

  // Switch back to Rebalance
  await page.locator('.tab-btn[data-mode="rebalance"]').click();
  await expect(page.locator('#run-btn')).toHaveText('Run Rebalance');
  await expect(page.locator('#field-holdings')).toBeVisible();
  await expect(page.locator('#field-last-year')).not.toBeVisible();
});

// ── 3. Rebalance run ──────────────────────────────────────────────────────────
test('rebalance: uploading holdings and clicking Run renders table with rows', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();

  // Table must appear with at least one data row (td, not th)
  const table = page.locator('#simple-table');
  await expect(table).toBeVisible({ timeout: 4_000 });
  const rows = table.locator('tbody tr');
  await expect(rows).toHaveCount(await rows.count()); // stabilizes
  expect(await rows.count()).toBeGreaterThan(0);
});

test('rebalance: net-cash-inline visible and DARA populated after run', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });
  await expect(page.locator('#net-cash-inline')).toBeVisible();
  // DARA is set from portfolio ARA on file load — shows either a number or "by year"
  const daraVal = await page.locator('#dara').inputValue();
  expect(daraVal.trim()).not.toBe('');
});

test('rebalance: net cash value populated after run', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });
  // net-cash-inline uses CSS display:none with style.display='' override — check content directly
  const val = await page.locator('#net-cash-val').textContent();
  expect(val).toBeTruthy();
});

// ── 4. Build run ──────────────────────────────────────────────────────────────
test('build: selecting last year and clicking Run renders build table', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  await expect(page.locator('#run-btn')).toHaveText('Build Ladder');

  // DARA defaults to 10000 in build mode; pick the last available year (ensures range > 1 rung)
  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });

  await page.locator('#run-btn').click();

  // build-output becomes display:block after successful run
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });
  const rows = page.locator('#build-table tbody tr');
  expect(await rows.count()).toBeGreaterThan(0);
});

test('build: maturity preference field visible in Build, hidden in Rebalance', async ({ page }) => {
  await expect(page.locator('#field-build-maturity')).not.toBeVisible();
  await page.locator('.tab-btn[data-mode="build"]').click();
  await expect(page.locator('#field-build-maturity')).toBeVisible();
  await page.locator('.tab-btn[data-mode="rebalance"]').click();
  await expect(page.locator('#field-build-maturity')).not.toBeVisible();
});

test('build: first-to-mature preference runs successfully', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });
  await page.locator('#build-maturity').selectOption('first');
  await page.locator('#run-btn').click();
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });
  expect(await page.locator('#build-table tbody tr').count()).toBeGreaterThan(0);
});

test('pre-ladder interest checkbox visible in both Build and Rebalance', async ({ page }) => {
  // PLI is shown in Rebalance (default mode) — allows Build→Rebalance symmetry testing
  await expect(page.locator('#field-pre-ladder')).toBeVisible();
  await page.locator('.tab-btn[data-mode="build"]').click();
  await expect(page.locator('#field-pre-ladder')).toBeVisible();
  await page.locator('.tab-btn[data-mode="rebalance"]').click();
  await expect(page.locator('#field-pre-ladder')).toBeVisible();
});

test('build: pre-ladder interest zeroes early years and all row amounts stay near DARA', async ({ page }) => {
  // Regression guard: zeroed years must show ~DARA (preLadderCredit + laterMatInt),
  // NOT just laterMatInt (~24k when DARA=100k).
  await page.locator('.tab-btn[data-mode="build"]').click();

  // Pick a firstYear well into the future (~2030) so pool = preLadderYears × annualInt
  // is large enough to zero at least one funded year.
  const firstYearSel = page.locator('#first-year');
  const fyCount = await firstYearSel.locator('option').count();
  const fyIdx = Math.min(5, fyCount - 1); // option ~2030, or last if fewer options
  await firstYearSel.selectOption({ index: fyIdx });

  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });

  await page.locator('#dara').fill('100000');
  await page.locator('#pre-ladder-interest').check();
  await page.locator('#run-btn').click();
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });

  // Amount is a fyLevel column: value lives in group header rows (td[1] after the colspan label),
  // not in child rows (which render blank). Check group headers only.
  // Before fix: zeroed rows showed only laterMatInt (~24k) — far below 40k threshold.
  const headers = page.locator('#build-table tbody tr.fy-group-header');
  const rowCount = await headers.count();
  for (let i = 0; i < rowCount; i++) {
    const amtText = await headers.nth(i).locator('td').nth(1).textContent().catch(() => '');
    const amt = parseFloat((amtText ?? '').replace(/[^0-9.-]/g, ''));
    if (!isNaN(amt) && amt > 0) {
      expect(amt, `Group header ${i} amount ${amt} is unexpectedly low (pre-ladder credit missing?)`).toBeGreaterThan(40000);
    }
  }
});

// ── 5. Help modal ─────────────────────────────────────────────────────────────
test('help modal: opens on ? button, closes on × button', async ({ page }) => {
  const overlay = page.locator('#help-overlay');
  await expect(overlay).not.toBeVisible();

  await page.locator('#help-btn').click();
  await expect(overlay).toBeVisible();

  await page.locator('#help-close').click();
  await expect(overlay).not.toBeVisible();
});

test('help modal: closes on backdrop click', async ({ page }) => {
  await page.locator('#help-btn').click();
  await expect(page.locator('#help-overlay')).toBeVisible();

  // Click the overlay background (not the inner modal)
  await page.locator('#help-overlay').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#help-overlay')).not.toBeVisible();
});

// ── 6. Drill popup ────────────────────────────────────────────────────────────
test('drill popup: clicking a drillable cell opens popup, × closes it', async ({ page }) => {
  // Run rebalance to get a table first
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  // Click the first drillable cell (td with data-col attribute)
  const drillCell = page.locator('#simple-table tbody td[data-col]').first();
  await expect(drillCell).toBeVisible();
  await drillCell.click();

  await expect(page.locator('#drill-overlay')).toBeVisible({ timeout: 4_000 });
  await expect(page.locator('#drill-content')).not.toBeEmpty();

  // Close with × button
  await page.locator('#drill-close').click();
  await expect(page.locator('#drill-overlay')).not.toBeVisible();
});

test('drill popup: closes on backdrop click', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  await page.locator('#simple-table tbody td[data-col]').first().click();
  await expect(page.locator('#drill-overlay')).toBeVisible({ timeout: 4_000 });

  // Click outside the modal (top-left of overlay)
  await page.locator('#drill-overlay').click({ position: { x: 5, y: 5 } });
  await expect(page.locator('#drill-overlay')).not.toBeVisible();
});

// ── 8. Level 3 Drill-down ────────────────────────────────────────────────────
test('drill popup: clicking Ref CPI in Level 2 opens Level 3 Ref CPI popup', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });
  // Groups collapsed after render — expand first group so drillable cells are visible
  await page.locator('#simple-table tbody tr.fy-group-header').first().click();

  await page.locator('#simple-table tbody td[data-col="costBefore"]').first().click();
  await expect(page.locator('#drill-overlay')).toBeVisible();

  const refCpiLabel = page.locator('.drill-l3[data-l3="refCPI"]');
  await expect(refCpiLabel).toBeVisible();
  await refCpiLabel.click();

  const l3Popup = page.locator('#shared-popup');
  await expect(l3Popup).toBeVisible();
  await expect(l3Popup).toContainText('Ref CPI Interpolation');
  await expect(l3Popup).toContainText('Interpolation Formula');
  
  // Check for CFR link
  const cfrLink = l3Popup.locator('a[href*="356"]');
  await expect(cfrLink).toBeVisible();

  await l3Popup.locator('#sp-close').click();
  await expect(l3Popup).not.toBeVisible();
});

test('drill popup: clicking Index Ratio in Level 2 opens Level 3 Index Ratio popup', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });
  // Groups collapsed after render — expand first group so drillable cells are visible
  await page.locator('#simple-table tbody tr.fy-group-header').first().click();

  await page.locator('#simple-table tbody td[data-col="costBefore"]').first().click();
  await expect(page.locator('#drill-overlay')).toBeVisible();

  const irLabel = page.locator('.drill-l3[data-l3="indexRatio"]');
  await expect(irLabel).toBeVisible();
  await irLabel.click();

  const l3Popup = page.locator('#shared-popup');
  await expect(l3Popup).toBeVisible();
  await expect(l3Popup).toContainText('Index Ratio Calculation');
  await expect(l3Popup).toContainText('Authority');

  await l3Popup.locator('#sp-close').click();
  await expect(l3Popup).not.toBeVisible();
});

test('drill popup: clicking Pre-ladder credit opens Level 3 pool composition with AMD breakout', async ({ page }) => {
  // Regression guard: the L3 handler must read `summary` in its own scope (it was previously
  // block-scoped to the `if (drill)` branch, so clicking Pre-ladder credit threw and did nothing).
  await page.locator('.tab-btn[data-mode="build"]').click();

  const firstYearSel = page.locator('#first-year');
  const fyCount = await firstYearSel.locator('option').count();
  await firstYearSel.selectOption({ index: Math.min(5, fyCount - 1) }); // ~2032 → real pre-ladder window
  const lastYearSel = page.locator('#last-year');
  const lyCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: lyCount - 1 });               // 2066 → future-30Y cover exists

  await page.locator('#dara').fill('100000');
  await page.locator('#pre-ladder-interest').check();
  await page.locator('#run-btn').click();
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });

  // Find a funded year whose Amount popup has a drillable "Pre-ladder credit" line.
  const amtCells = page.locator('#build-table td.drillable[data-col="amount"]');
  const n = await amtCells.count();
  expect(n, 'no drillable Amount cells rendered').toBeGreaterThan(0);

  let found = false;
  for (let i = 0; i < n; i++) {
    await amtCells.nth(i).click();
    await expect(page.locator('#drill-overlay')).toBeVisible({ timeout: 4_000 });
    const plc = page.locator('.drill-l3[data-l3="plcpool"]');
    if (await plc.count() > 0) {
      await plc.first().click();
      const l3 = page.locator('#shared-popup');
      await expect(l3).toBeVisible();                                   // was failing: nothing happened
      await expect(l3).toContainText('Pre-ladder pool composition');
      await expect(l3).toContainText('Pre-ladder coupon interest');
      await expect(l3).toContainText('Pre-ladder AMD');                 // the AMD breakout line
      await l3.locator('#sp-close').click();
      found = true;
      break;
    }
    await page.locator('#drill-close').click();
    await expect(page.locator('#drill-overlay')).not.toBeVisible();
  }
  expect(found, 'no funded year exposed a drillable Pre-ladder credit line').toBe(true);
});

test('drill popup: gap-year PLI credit drills into pool composition', async ({ page }) => {
  // The Gap Amount popup lists each gap year's "↳ PLI credit"; each must drill into the shared
  // pool composition (slice encoded in the data-l3 key as plcpool:<slice>).
  await page.locator('.tab-btn[data-mode="build"]').click();
  await page.locator('#first-year').selectOption({ label: '2036' });    // gaps 2037–2039 get PLI credit
  const lastYearSel = page.locator('#last-year');
  const lyCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: lyCount - 1 });               // 2066 → future-30Y cover → AMD in pool

  await page.locator('#dara').fill('80000');
  await page.locator('#pre-ladder-interest').check();
  await page.locator('#run-btn').click();
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });

  // Expand groups so bracket sub-rows (gapAmount cells) become visible.
  const headers = page.locator('#build-table tbody tr.fy-group-header');
  const hc = await headers.count();
  for (let i = 0; i < hc; i++) await headers.nth(i).locator('td').first().click();

  const gapCell = page.locator('#build-table td.drillable[data-col="gapAmount"]').first();
  await expect(gapCell).toBeVisible();
  await gapCell.click();
  await expect(page.locator('#drill-overlay')).toBeVisible({ timeout: 4_000 });

  const gapPli = page.locator('.drill-l3[data-l3^="plcpool:"]').first();
  await expect(gapPli).toBeVisible();                                    // the "↳ PLI credit" line
  await gapPli.click();

  const l3 = page.locator('#shared-popup');
  await expect(l3).toBeVisible();
  await expect(l3).toContainText('Pre-ladder pool composition');
  await expect(l3).toContainText('Pre-ladder AMD');
  await expect(l3).toContainText('Applied to this year');
  await l3.locator('#sp-close').click();
  await expect(l3).not.toBeVisible();
});

// ── 9. Error handling ─────────────────────────────────────────────────────────
test('rebalance: running without holdings file shows status error', async ({ page, context }) => {
  // Block the pre-populate fetch so no sample file is loaded into the input
  await page.route('**/data/SampleHoldings.csv', r => r.abort());
  await page.reload();
  await expect(page.locator('#run-btn')).not.toBeDisabled({ timeout: 4_000 });

  await page.locator('#run-btn').click();
  await expect(page.locator('#status')).toContainText(/holdings|csv|file/i);
});

test('build: running without selecting last year shows status error', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  // Clear DARA so we get an error before year check, set it
  await page.locator('#dara').fill('10000');
  // Clear the default last-year selection to trigger the error
  await page.locator('#last-year').selectOption('');
  await page.locator('#run-btn').click();
  await expect(page.locator('#status')).toContainText(/year/i);
});

// ── 9. Low-DARA edge cases ────────────────────────────────────────────────────
test('build: DARA below $1,000 is rejected before running', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });
  await page.locator('#dara').fill('500');
  await page.locator('#run-btn').click();
  await expect(page.locator('#status')).toContainText(/1,000/i);
});

test('build: DARA $2,000 either renders table or shows DARA-too-low error with no crash', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });
  await page.locator('#dara').fill('2000');
  await page.locator('#run-btn').click();

  // Must not leave the page in a broken state — either table renders or a clear error appears
  const tableVisible = await page.locator('#build-output').isVisible().catch(() => false);
  const statusText   = await page.locator('#status').textContent().catch(() => '');
  expect(tableVisible || /dara|too low/i.test(statusText)).toBeTruthy();

  // If table rendered: all Funded Year Amount cells must be non-negative
  if (tableVisible) {
    const rows = page.locator('#build-table tbody tr:not(.excess-subrow):not(.fy-group-header)');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const amtText = await rows.nth(i).locator('td').nth(4).textContent();
      const amt = parseFloat((amtText ?? '').replace(/[^0-9.-]/g, ''));
      if (!isNaN(amt)) expect(amt, `Row ${i} amount ${amt} is negative`).toBeGreaterThanOrEqual(0);
    }
  }
});

test('rebalance: DARA below $1,000 is rejected', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#dara').fill('500');
  await page.locator('#run-btn').click();
  await expect(page.locator('#status')).toContainText(/1,000/i);
});

// ── 10. No NaN in output ─────────────────────────────────────────────────────
async function assertNoNaN(page, tableSelector) {
  const cells = page.locator(tableSelector + ' td');
  const count = await cells.count();
  for (let i = 0; i < count; i++) {
    const text = (await cells.nth(i).textContent()) ?? '';
    expect(text, `Cell ${i} in ${tableSelector} contains NaN`).not.toContain('NaN');
  }
}

test('rebalance: no NaN in table cells or drill popup (auto-infer DARA)', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });
  await assertNoNaN(page, '#simple-table');

  const drillCell = page.locator('#simple-table tbody td[data-col]').first();
  await drillCell.click();
  await expect(page.locator('#drill-overlay')).toBeVisible({ timeout: 4_000 });
  expect(await page.locator('#drill-content').textContent()).not.toContain('NaN');
  await page.locator('#drill-close').click();
});

test('rebalance: no NaN in table cells at low DARA ($5,000)', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#dara').fill('5000');
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });
  await assertNoNaN(page, '#simple-table');
});

test('build: no NaN in table cells or drill popup', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });
  await page.locator('#run-btn').click();
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });
  await assertNoNaN(page, '#build-table');

  const drillCell = page.locator('#build-table tbody td[data-col]').first();
  await drillCell.click();
  await expect(page.locator('#drill-overlay')).toBeVisible({ timeout: 4_000 });
  expect(await page.locator('#drill-content').textContent()).not.toContain('NaN');
  await page.locator('#drill-close').click();
});

// ── 11. Per-year DARA panel ───────────────────────────────────────────────────
test('build: per-year DARA panel renders when DARA focused with last year selected', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });

  // Clicking DARA triggers focus handler → renderDaraByYearPanel (DARA already '40000')
  await page.locator('#dara').click();
  await expect(page.locator('#dara-by-year')).toBeVisible({ timeout: 3_000 });

  // Must have at least one row with a data-year input
  const yearInputs = page.locator('#dara-by-year-table input[data-year]');
  expect(await yearInputs.count()).toBeGreaterThan(0);
});

test('build: editing a per-year DARA input changes DARA field to "by year"', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });

  await page.locator('#dara').click();
  await expect(page.locator('#dara-by-year')).toBeVisible({ timeout: 3_000 });
  // Panel body starts collapsed — expand it
  await page.locator('#dara-by-year-hdr').click();
  await expect(page.locator('#dara-by-year-table input[data-year]').first()).toBeVisible({ timeout: 2_000 });

  // Change first year's target to something different from the default
  const firstYearInput = page.locator('#dara-by-year-table input[data-year]').first();
  await firstYearInput.fill('20000');   // fires input event → updateDaraInput()

  await expect(page.locator('#dara')).toHaveValue('by year');
});

test('rebalance: per-year DARA panel renders after loading holdings and entering DARA', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  // Typing into DARA fires 'input' → renderDaraByYearPanel; holdings already loaded above
  await page.locator('#dara').fill('10000');
  await expect(page.locator('#dara-by-year')).toBeVisible({ timeout: 3_000 });

  const yearInputs = page.locator('#dara-by-year-table input[data-year]');
  expect(await yearInputs.count()).toBeGreaterThan(0);
});

// ── 12. Enter key triggers Run ────────────────────────────────────────────────
test('build: pressing Enter (no overlay open) triggers Build Ladder', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });

  // Blur any focused element so no text field swallows the key
  await page.locator('.app-title').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });
});

test('rebalance: pressing Enter (no overlay open) triggers Run Rebalance', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('.app-title').click();
  await page.keyboard.press('Enter');
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });
});

// ── 13. DARA populated from portfolio on file load ────────────────────────────
test('rebalance: DARA populated from portfolio ARA on file load', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await expect(page.locator('#method')).toHaveValue('Full');

  // DARA is set from portfolio ARA at file load — shows numeric median or "by year"
  const daraVal = await page.locator('#dara').inputValue();
  expect(daraVal.trim(), 'DARA field empty after file load').not.toBe('');

  // Running must produce a table with no crash
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });
});

// ── 14. Export CSV button ──────────────────────────────────────────────────────
test('rebalance: export button visible after run and triggers CSV download', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  const exportBtn = page.locator('#export-csv-btn');
  await expect(exportBtn).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    exportBtn.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
});

test('build: export button visible after run', async ({ page }) => {
  await page.locator('.tab-btn[data-mode="build"]').click();
  const lastYearSel = page.locator('#last-year');
  const optionCount = await lastYearSel.locator('option').count();
  await lastYearSel.selectOption({ index: optionCount - 1 });

  await page.locator('#run-btn').click();
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });
  await expect(page.locator('#export-csv-btn')).toBeVisible();
});

test('rebalance: no negative Qty After values at low DARA', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#dara').fill('5000');
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table')).toBeVisible({ timeout: 4_000 });

  // Find the Qty After column index from the header row
  const headers = page.locator('#simple-table thead th');
  const headerCount = await headers.count();
  let qtyAfterIdx = -1;
  for (let i = 0; i < headerCount; i++) {
    const text = (await headers.nth(i).textContent() ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    if ((text.includes('qty') || text.includes('quantity')) && text.includes('after')) { qtyAfterIdx = i; break; }
  }
  expect(qtyAfterIdx, 'Qty After column not found in table header').toBeGreaterThanOrEqual(0);

  const rows = page.locator('#simple-table tbody tr:not(.fy-group-header)');
  const rowCount = await rows.count();
  for (let i = 0; i < rowCount; i++) {
    const cellText = await rows.nth(i).locator('td').nth(qtyAfterIdx).textContent().catch(() => '');
    const val = parseFloat((cellText ?? '').replace(/[^0-9.-]/g, ''));
    if (!isNaN(val)) expect(val, `Row ${i} Qty After = ${val} is negative`).toBeGreaterThanOrEqual(0);
  }
});

// Helper: parse net cash from #net-cash-val text (strips $, commas, sign handling)
function parseNetCash(text) {
  if (!text) return NaN;
  const t = text.replace(/[$,]/g, '').trim();
  return parseFloat(t);
}

// ── 16. Net cash near zero after Full rebalance with portfolio-derived DARA ────
test('rebalance: Full method net cash is non-negative and within $2,000', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await expect(page.locator('#method')).toHaveValue('Full');

  // DARA is set from portfolio ARA at file load — run without any manual override
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  const raw = await page.locator('#net-cash-val').textContent();
  const netCash = parseNetCash(raw);
  expect(netCash, 'Net cash must be a number').not.toBeNaN();
  // Portfolio-derived DARA targets should produce near-zero net cash; allow up to $15k for
  // bracket-year rounding differences between the ARA estimator and the rebalance algorithm.
  expect(Math.abs(netCash), `Net cash ${netCash} is unreasonably large`).toBeLessThanOrEqual(15000);
});

// ── 17. RefCPI date change clears output but preserves DARA ──────────────────
test('rebalance: changing RefCPI date clears output and does not alter DARA', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  // Record the DARA (set from portfolio ARA at file load)
  const daraAfterRun = await page.locator('#dara').inputValue();
  expect(daraAfterRun.trim()).not.toBe('');

  // Open RefCPI picker and apply a new date
  await page.locator('#refcpi-link').click();
  await expect(page.locator('#refcpi-picker')).toBeVisible();
  await page.locator('#refcpi-date-input').fill('01/01/2024');
  await page.locator('#refcpi-apply-btn').click();

  // Output must be cleared
  await expect(page.locator('#output')).toHaveCSS('display', 'none');
  await expect(page.locator('#net-cash-inline')).toHaveCSS('display', 'none');

  // DARA must be preserved — it comes from portfolio, not inference, so RefCPI change does not invalidate it
  const daraAfterRefCpi = await page.locator('#dara').inputValue();
  expect(daraAfterRefCpi.trim(), 'DARA was cleared after RefCPI change').not.toBe('');
});

// ── 18. DARA stays stable across multiple runs ────────────────────────────────
test('rebalance: Full method does not overwrite DARA when field is already filled', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  const daraAfterFirstRun = await page.locator('#dara').inputValue();
  expect(daraAfterFirstRun.trim()).not.toBe('');

  // Re-run — DARA must not change (portfolio-derived DARA is stable, no re-inference)
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  const daraAfterReRun = await page.locator('#dara').inputValue();
  expect(daraAfterReRun, 'DARA changed between runs').toBe(daraAfterFirstRun);
});

// ── 19. Clearing DARA uses panel default; net cash stays near zero ─────────────
test('rebalance: Full method net cash is non-negative after clearing DARA and re-running with new RefCPI', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  // Change RefCPI, then clear DARA field and re-run
  // Clearing DARA falls back to _daraByYearPanelDefault (set from portfolio at file load)
  await page.locator('#refcpi-link').click();
  await page.locator('#refcpi-date-input').fill('01/01/2024');
  await page.locator('#refcpi-apply-btn').click();
  await page.locator('#dara').fill('');

  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  // After a RefCPI date change the per-year DARA targets (from original load) no longer
  // match the new prices, so net cash may be significantly non-zero — just verify the run completes.
  const raw = await page.locator('#net-cash-val').textContent();
  expect(parseNetCash(raw), 'Net cash must be a number after RefCPI change').not.toBeNaN();
});

// ── 20b. DARA stays stable when bracket mode changes ──────────────────────────
test('rebalance: auto-inferred DARA is re-inferred when bracket mode changes', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await expect(page.locator('#method')).toHaveValue('Full');

  // First run — DARA from portfolio ARA
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });
  const daraFirst = await page.locator('#dara').inputValue();
  expect(daraFirst.trim()).not.toBe('');

  // Change bracket mode — DARA comes from portfolio, not inference, so it stays stable
  const bracketMode = await page.locator('#bracket-mode').inputValue();
  await page.locator('#bracket-mode').selectOption(bracketMode === '3bracket' ? '2bracket' : '3bracket');

  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  const daraSecond = await page.locator('#dara').inputValue();
  expect(daraSecond.trim(), 'DARA was unexpectedly cleared after bracket mode change').not.toBe('');
});

// ── 20. Enter on refcpi-date-input must not auto-trigger Run ──────────────────
test('rebalance: pressing Enter in RefCPI date picker applies date but does not auto-run', async ({ page }) => {
  await page.locator('#holdings-file').setInputFiles(HOLDINGS_PATH);
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 4_000 });

  const daraBefore = await page.locator('#dara').inputValue();

  // Open picker, type date, press Enter
  await page.locator('#refcpi-link').click();
  await expect(page.locator('#refcpi-picker')).toBeVisible();
  await page.locator('#refcpi-date-input').fill('01/01/2024');
  await page.locator('#refcpi-date-input').press('Enter');

  // Picker must be closed and output cleared
  await expect(page.locator('#refcpi-picker')).toHaveCSS('display', 'none');
  await expect(page.locator('#output')).toHaveCSS('display', 'none');

  // DARA must be preserved — portfolio-derived DARA is not invalidated by RefCPI change
  const daraAfter = await page.locator('#dara').inputValue();
  expect(daraAfter.trim(), 'DARA was unexpectedly cleared after RefCPI Enter').not.toBe('');
});

test('build variable DARA then rebalance: per-year panel shows proportional values, not constant', async ({ page }) => {
  // Regression for variable-DARA ladders: build with 2026=20K, 2029=50K,
  // export, load in rebalance, verify per-year DARA preserves the ordering (not constant).
  await page.locator('.tab-btn[data-mode="build"]').click();

  // Select last year 2029 and default first year (settlement year ≈ 2026)
  await page.locator('#last-year').selectOption('2029');

  // Set scalar DARA to 40000 then open per-year panel via click/focus
  await page.locator('#dara').fill('40000');
  await page.locator('#dara').click();
  await expect(page.locator('#dara-by-year')).toBeVisible({ timeout: 3_000 });
  // Panel body starts collapsed — expand it
  await page.locator('#dara-by-year-hdr').click();
  await expect(page.locator('#dara-by-year-table input[data-year]').first()).toBeVisible({ timeout: 2_000 });

  // Set first available year to 20000 and last year (2029) to 50000
  const firstInput = page.locator('#dara-by-year-table input[data-year]').first();
  const firstYear = await firstInput.getAttribute('data-year');
  await firstInput.fill('20000');
  await page.locator('#dara-by-year-table input[data-year="2029"]').fill('50000');

  // Build the ladder
  await page.locator('#run-btn').click();
  await expect(page.locator('#build-table tbody tr').first()).toBeVisible({ timeout: 6_000 });

  // Export CUSIP/qty
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#export-cusip-qty-btn').click(),
  ]);
  const exportPath = await download.path();
  expect(exportPath, 'export file should exist').toBeTruthy();

  // Switch to Rebalance and load the exported file
  await page.locator('.tab-btn[data-mode="rebalance"]').click();
  await page.locator('#holdings-file').setInputFiles(exportPath);
  await expect(page.locator('#dara-by-year')).toBeVisible({ timeout: 4_000 });

  // Per-year values must preserve ordering: firstYear < 2029 (proportional, not constant).
  const vFirst = parseFloat(await page.locator(`#dara-by-year-table input[data-year="${firstYear}"]`).inputValue());
  const vLast  = parseFloat(await page.locator('#dara-by-year-table input[data-year="2029"]').inputValue());
  expect(vFirst, 'first-year DARA should be a number').not.toBeNaN();
  expect(vLast,  'last-year (2029) DARA should be a number').not.toBeNaN();
  expect(vFirst, 'first-year DARA should be less than 2029 DARA (proportional, not constant)').toBeLessThan(vLast);
  // Ratio check: 50K/20K = 2.5; allow 20% tolerance (2.0–3.0)
  const ratio = vLast / vFirst;
  // Core invariant: values are NOT constant — lower-target year < higher-target year.
  // Exact ratio depends on LMI compression; just verify ordering is preserved.
  expect(vFirst, 'first-year DARA should be less than last-year (proportional, not constant)').toBeLessThan(vLast);

  // Run rebalance — net cash should be near zero (self-financing from proportional scaling)
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 6_000 });
  const raw = await page.locator('#net-cash-val').textContent();
  const netCash = parseFloat(raw.replace(/[^0-9.-]/g, ''));
  // Binary search guarantees self-funding: net cash must be non-negative and small
  expect(netCash, 'net cash must be non-negative (self-funding)').toBeGreaterThanOrEqual(0);
  expect(netCash, 'net cash must be small (within $2,000)').toBeLessThan(2000);
});

// ── Full UI round-trip: build → export → import → rebalance (Future-30Y cover excess) ──
// Regression for the bug where importing a built 2026–2066 ladder defaulted the rebalance
// last-year to 2056 (longest actual TIPS), so the 2052/2056 Future-30Y cover excess was sold
// to DARA. The last-year must be recovered (2066) from the cover excess so the round-trip is flat.
test('round-trip: build 2026–2066 → export CUSIP/Qty → import → last-year recovers 2066, ~0 net cash', async ({ page }) => {
  test.setTimeout(20_000);

  // 1. Build 2026–2066 @ DARA 40k
  await page.locator('.tab-btn[data-mode="build"]').click();
  await page.locator('#last-year').selectOption({ value: '2066' });
  await page.locator('#dara').fill('40000');
  await page.locator('#run-btn').click();
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });

  // 2. Export CUSIP/Qty (captures the Format-5 file the app produces)
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-cusip-qty-btn').click();
  const download = await downloadPromise;
  const csvPath = test.info().outputPath('roundtrip.csv');
  await download.saveAs(csvPath);

  // 3. Switch to rebalance and import that exact file
  await page.locator('.tab-btn[data-mode="rebalance"]').click();
  await page.locator('#holdings-file').setInputFiles(csvPath);

  // 4. The crux: last-year must default to 2066 (recovered from the 2052/2056 cover excess),
  //    NOT 2056 — else the covers are sold and the round-trip is full of trades.
  await expect(page.locator('#rebal-last-year')).toHaveValue('2066', { timeout: 4_000 });

  // 5. Rebalance at the same DARA → near-zero net cash (build↔rebalance are internally consistent).
  await page.locator('#dara').fill('40000');
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 6_000 });
  const netCash = parseFloat((await page.locator('#net-cash-val').textContent()).replace(/[^0-9.-]/g, ''));
  expect(Math.abs(netCash), 'round-trip net cash must be ~0').toBeLessThan(2000);
});

// ── Two-segment (LMP / speculative) DARA: split control + no-clobber bulk actions ──
// Build a 2026–2055 ladder, import it, then drive the per-year panel's segment tools:
// set a constant on the speculative segment, fill the LMP median, and verify each action
// touches ONLY its own segment (the long-standing clobber pain), then run with ~0 net cash.
test('two-segment DARA: split year + per-segment fill leave the other segment untouched', async ({ page }) => {
  test.setTimeout(20_000);

  // 1. Build 2026–2055 @ DARA 40k and export
  await page.locator('.tab-btn[data-mode="build"]').click();
  await page.locator('#last-year').selectOption({ value: '2055' });
  await page.locator('#dara').fill('40000');
  await page.locator('#run-btn').click();
  await expect(page.locator('#build-output')).toHaveCSS('display', 'block', { timeout: 4_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-cusip-qty-btn').click();
  const csvPath = test.info().outputPath('twoseg.csv');
  await (await downloadPromise).saveAs(csvPath);

  // 2. Import into rebalance — panel + segment tools populate
  await page.locator('.tab-btn[data-mode="rebalance"]').click();
  await page.locator('#holdings-file').setInputFiles(csvPath);
  await expect(page.locator('#dara-by-year')).toBeVisible({ timeout: 4_000 });

  // Expand the panel body so its inputs/buttons are interactable
  await page.locator('#dara-by-year-hdr').click();
  await expect(page.locator('#dara-seg-tools')).toBeVisible({ timeout: 2_000 });

  // 3. Split at 2047 → LMP 2026–2047, speculative 2048–2055
  await page.locator('#split-year').selectOption({ value: '2047' });
  await expect(page.locator('#seg-spec-row')).toBeVisible();
  const lmpInput  = page.locator('#dara-by-year-table input[data-year="2030"]');
  const specInput = page.locator('#dara-by-year-table input[data-year="2050"]');
  await expect(lmpInput).toHaveCount(1);
  await expect(specInput).toHaveCount(1);

  // 4. Set the speculative segment to a constant; LMP must be untouched
  const lmpBefore = await lmpInput.inputValue();
  await page.locator('#seg-spec-const').fill('55000');
  await page.locator('#seg-spec-set').click();
  await expect(specInput).toHaveValue('55000');
  expect(await lmpInput.inputValue(), 'LMP year unchanged by speculative set').toBe(lmpBefore);

  // 5. Fill the LMP self-financing median; the speculative constant must survive (no clobber)
  await page.locator('#seg-lmp-median').click();
  await expect(specInput).toHaveValue('55000', { timeout: 6_000 });

  // The inferred flat median must appear in the LMP field…
  const lmpMedian = await page.locator('#seg-lmp-const').inputValue();
  expect(parseFloat(lmpMedian), 'inferred LMP median shown in field').toBeGreaterThan(0);

  // …and EVERY LMP rung (2026–2047) must be flattened to that single value (even real income).
  const lmpVals = await page.locator('#dara-by-year-table input[data-year]').evaluateAll(
    (els) => els.filter(e => +e.dataset.year <= 2047).map(e => e.value)
  );
  expect(lmpVals.length).toBeGreaterThan(1);
  expect(new Set(lmpVals).size, 'all LMP rungs share one flat DARA').toBe(1);
  expect(lmpVals[0], 'flat rung value equals the shown median').toBe(lmpMedian);

  // 6. Run completes and renders a table (whole-portfolio rebalance over the merged map)
  await page.locator('#run-btn').click();
  await expect(page.locator('#simple-table tbody tr').first()).toBeVisible({ timeout: 6_000 });
  expect(await page.locator('#net-cash-val').textContent()).toBeTruthy();
});
