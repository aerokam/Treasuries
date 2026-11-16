import { test, expect } from '@playwright/test';
import { routeStores } from './store-routes.js';

// IQR Clip, upper bound (YieldCurves/knowledge/3.2_Render_Charts_And_Tables.md, 3.2.2): a Note far
// above the others sets no upper bound of the Y scale while Clip Outliers is on. The TIPS tab has
// the same checkbox.

const SETTLE = '2026-03-25';
const TIPS_ROWS = [
  'TIPS,91282CCA7,2026-04-15,0.00125,262.25027,100.0625,0.000',
  'TIPS,912828S50,2026-07-15,0.00125,239.70132,101.4375,0.000',
  'TIPS,91282CDC2,2026-10-15,0.00125,273.25771,100.96875,0.000',
];
function fedCsv() {
  const rows = [SETTLE, 'type,cusip,maturity,coupon,datedDateCpi,price,yield',
    'MARKET BASED NOTE,912828900,2026-03-26,0.10405,,100.000,0.10405', ...TIPS_ROWS];
  for (let i = 0; i < 30; i++) {
    const y = (0.0400 + i * 0.0002).toFixed(5);
    rows.push(`MARKET BASED NOTE,912828${String(i).padStart(3, '0')},${2029 + Math.floor(i / 2)}-${i % 2 === 0 ? '01' : '07'}-15,${y},,100.000,${y}`);
  }
  return rows.join('\n');
}
const REF_CPI_CSV = [
  'Ref CPI Date,Ref CPI NSA,Ref CPI SA,SA Factor',
  '2026-04-15,325.96740,326.99493,0.99686',
  '2026-07-15,321.09758,320.44561,1.00203',
  '2026-10-15,323.46710,322.67571,1.00245',
  '2026-03-25,324.74961,326.35442,0.99508',
  '2026-03-26,324.74961,326.35442,0.99508',
].join('\n');

async function load(page) {
  await routeStores(page, { yieldsText: fedCsv(), refCpiText: REF_CPI_CSV, holidayText: '"Wednesday, January 1, 2025",New Year\'s Day\n', quotesText: '2026-03-25 08:27\ntype,cusip,maturity,coupon,askPrice,bidPrice,adjAskPrice,adjBidPrice' });
  await page.goto('./');
  await page.check('#chkTipsFed');
  await expect(page.locator('#saTable tbody tr')).toHaveCount(3, { timeout: 10000 });
}
const yMax = page => page.evaluate(() => Chart.getChart(document.getElementById('yieldChart')).scales.y.max);

test('Treasuries: a Note at 10.4% sets no upper bound while Clip Outliers is on', async ({ page }) => {
  await load(page);
  await page.click('[data-tab="treasuries"]');
  await page.check('#chkFedInvest');
  await expect(page.locator('#nominalsTable tbody tr')).toHaveCount(31, { timeout: 10000 });
  expect(await yMax(page)).toBeLessThan(6);
  await page.click('#clipOutliers');
  expect(await yMax(page)).toBeGreaterThan(10);
});

test('TIPS: the Clip Outliers checkbox is on by default and toggling it redraws the chart', async ({ page }) => {
  await load(page);
  await expect(page.locator('#tipsClipOutliers')).toBeVisible();
  await expect(page.locator('#tipsClipOutliers')).toBeChecked();
  await page.click('#tipsClipOutliers');
  await expect(page.locator('#tipsClipOutliers')).not.toBeChecked();
  expect(await page.evaluate(() => !!Chart.getChart(document.getElementById('yieldChart')))).toBe(true);
});
