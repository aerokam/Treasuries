import { test, expect } from '@playwright/test';
import { routeStores } from './store-routes.js';

// CMT as a third source (YieldCurves/knowledge/3.2_Render_Charts_And_Tables.md, 3.2.3 to 3.2.5).
// The CMT rates and R-CMT rates are the fixtures of store-routes.js: the latest Date is
// 2026-03-25, which settles on 2026-03-26.

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
const MARKET_QUOTES_CSV = [
  '2026-03-25 08:27',
  'type,cusip,maturity,coupon,askPrice,bidPrice,adjAskPrice,adjBidPrice',
  'Treasury,912797TB3,2026-06-26,0,99.06,99.04,,',
  'Treasury,91282CBT7,2028-03-25,0.0425,100,99.9,,',
  'Treasury,91282CKH3,2031-03-25,0.0435,100,99.9,,',
  'Treasury,912810PS1,2036-03-25,0.0475,100,99.9,,',
  'Treasury,912810XX1,2056-03-25,0.0485,100,99.9,,',
  'TIPS,91282CCA7,2026-04-15,0.00125,100.132,100.062,124.098594,124.011839',
  'TIPS,912828S50,2026-07-15,0.00125,101.284,101.231,137.335026,137.263162',
  'TIPS,91282CDC2,2026-10-15,0.00125,100.738,100.68,119.820799,119.751812',
].join('\n');

async function load(page, inputs = {}) {
  await routeStores(page, { yieldsText: FED_YIELDS_CSV, refCpiText: REF_CPI_CSV, holidayText: HOLIDAYS_CSV, quotesText: MARKET_QUOTES_CSV, ...inputs });
  await page.goto('./');
  await expect(page.locator('#saTable tbody tr')).toHaveCount(3, { timeout: 10000 });
  await expect(page.locator('#chkTipsCmt')).not.toBeDisabled({ timeout: 5000 });
}

const datasets = page => page.evaluate(() =>
  Chart.getChart(document.getElementById('yieldChart'))?.data.datasets.map(d => ({ label: d.label, n: d.data.length, y: d.data.map(p => p.y) })) || []);
const dataset = async (page, label) => (await datasets(page)).find(d => d.label === label);

test('Treasuries: the CMT is a source, unchecked until checked, and draws 6 points with its dates beside it', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="treasuries"]');
  await expect(page.locator('#chkCmt')).not.toBeDisabled();
  await expect(page.locator('#chkCmt')).not.toBeChecked();
  expect(await dataset(page, 'CMT')).toBeUndefined();

  await page.check('#chkCmt');
  const cmt = await dataset(page, 'CMT');
  expect(cmt.n).toBe(6);
  expect(cmt.y).toEqual([4.12, 4.26, 4.88, 4.98, 5.15, 5.47]);
  await expect(page.locator('#treaCmtMeta')).toHaveText('rates 03/25/2026');

  await page.uncheck('#chkCmt');
  expect(await dataset(page, 'CMT')).toBeUndefined();
  await expect(page.locator('#treaCmtMeta')).toHaveText('');
});

test('Treasuries: the CMT can be drawn with no other source', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="treasuries"]');
  await page.uncheck('#chkMarket');
  await page.check('#chkCmt');
  const all = await datasets(page);
  expect(all.map(d => d.label)).toEqual(['CMT']);
});

test('TIPS: the CMT checkbox draws the R-CMT, 3 points, and mirrors the Treasuries checkbox', async ({ page }) => {
  await load(page);
  await page.check('#chkTipsCmt');
  const real = await dataset(page, 'R-CMT');
  expect(real.n).toBe(3);
  expect(real.y).toEqual([2.68, 2.91, 3.28]);
  await expect(page.locator('#tipsCmtMeta')).toHaveText('rates 03/25/2026');
  await page.click('[data-tab="treasuries"]');
  await expect(page.locator('#chkCmt')).toBeChecked();
  expect((await dataset(page, 'CMT')).n).toBe(6);
});

test('Breakeven: the CMT checkbox draws the CMT less the R-CMT at 5, 10 and 30 years', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="bei"]');
  await expect(page.locator('#chkTipsCmt')).not.toBeDisabled();
  await page.check('#chkTipsCmt');
  const bei = await dataset(page, 'CMT BEI');
  expect(bei.y).toEqual([2.3, 2.24, 2.19]);
});

test('Spread mode shows no CMT checkbox', async ({ page }) => {
  await load(page);
  await expect(page.locator('#tipsCmtLabel')).toBeVisible();
  await page.click('.tab-btn[data-mode="spread"]');
  await expect(page.locator('#tipsCmtLabel')).toBeHidden();
  await page.click('.tab-btn[data-mode="yield"]');
  await expect(page.locator('#tipsCmtLabel')).toBeVisible();
});

test('A CMT store that cannot be read leaves its checkbox disabled and the rest of the page working', async ({ page }) => {
  await load(page, { cmtText: '' });
  // R-CMT is readable, so the TIPS-strip checkbox is enabled; the Treasuries one needs the CMT.
  await page.click('[data-tab="treasuries"]');
  await expect(page.locator('#chkCmt')).toBeDisabled();
  await expect(page.locator('#nominalsTable tbody tr')).toHaveCount(5);
});

test('Term axis: each CMT sits at its published term, and its tooltip names that term', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="treasuries"]');
  await page.check('#chkCmt');
  await page.check('input[name="xAxisMode"][value="ttm"]');
  const pts = await page.evaluate(() => Chart.getChart(document.getElementById('yieldChart')).data.datasets.find(d => d.label === 'CMT').data.map(p => ({ m: p.x / (365.25 / 12 / 7), term: p.term })));
  expect(pts.length).toBe(6);
  for (const p of pts) {
    const months = /Yr/.test(p.term) ? parseFloat(p.term) * 12 : parseFloat(p.term);
    if (p.term === '1.5 Mo') expect(p.m * (365.25 / 12 / 7)).toBeCloseTo(6, 6);
    else expect(p.m).toBeCloseTo(months, 6);
  }
});

test('Term axis reads in months below one year, and in weeks only for Bills alone', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="treasuries"]');
  await page.check('input[name="xAxisMode"][value="ttm"]');
  const labels = () => page.evaluate(() => { const s = Chart.getChart(document.getElementById('yieldChart')).scales.x; return s.ticks.map(t => s.options.ticks.callback.call(s, t.value)); });
  await page.uncheck('#chkMarket'); await page.check('#chkCmt');
  await page.evaluate(() => { const e = document.getElementById('endMaturity'); e.value = '2027-03-26'; e.dispatchEvent(new Event('change', { bubbles: true })); });
  const m = await labels();
  expect(m).toContain('3m');
  expect(m.some(l => /w$/.test(l))).toBe(false);
  await page.uncheck('#chkCmt'); await page.check('#chkMarket');
  await page.uncheck('#filterNotes'); await page.uncheck('#filterBonds');
  expect((await labels()).some(l => /w$/.test(l))).toBe(true);
});

test('Term axis: a security sits at its Maturity Date less the Settlement Date of its source, not today', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="treasuries"]');
  await page.check('#chkFedInvest');
  await page.uncheck('#chkMarket');
  await page.check('input[name="xAxisMode"][value="ttm"]');
  const xs = await page.evaluate(() => Chart.getChart(document.getElementById('yieldChart')).data.datasets.find(d => d.label === 'Notes').data.map(p => Math.round(p.x * 7)));
  expect(xs[0]).toBe(731); // 2028-03-25 less the FedInvest Settlement Date 2026-03-25
});

test('Breakeven: the Market checkbox can be unchecked, leaving the CMT alone', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="bei"]');
  await expect(page.locator('#chkTipsBroker')).not.toBeDisabled();
  await page.check('#chkTipsCmt');
  await page.uncheck('#chkTipsBroker');
  expect((await datasets(page)).map(d => d.label)).toEqual(['CMT BEI']);
  await page.check('#chkTipsBroker');
  expect((await datasets(page)).map(d => d.label)).toContain('Ask BEI');
});

test('Breakeven: the FedInvest checkbox is selectable and draws the FedInvest breakeven beside the Market one', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="bei"]');
  await expect(page.locator('#chkTipsFed')).not.toBeDisabled();
  await page.check('#chkTipsFed');
  const labels = (await datasets(page)).map(d => d.label);
  expect(labels).toEqual(expect.arrayContaining(['Ask BEI (Fed)', 'SA BEI (Fed)', 'SAO BEI (Fed)', 'Ask BEI (Market)', 'SAO BEI (Market)']));
  await page.uncheck('#chkTipsBroker');
  const only = (await datasets(page)).map(d => d.label);
  expect(only).toContain('Ask BEI');
  expect(only.some(l => /Market/.test(l))).toBe(false);
  await expect(page.locator('#tipsFedMeta')).toHaveText('03/25/2026');
});

test('TIPS: a CMT checked on the Treasuries tab leaves the Maturity Range of the TIPS tab spanning all 3 R-CMT points', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="treasuries"]');
  await page.check('#chkCmt');
  await page.click('[data-tab="tips"]');
  expect((await dataset(page, 'R-CMT')).n).toBe(3);
  expect((await dataset(page, 'R-CMT')).y[2]).toBe(3.28);
});
