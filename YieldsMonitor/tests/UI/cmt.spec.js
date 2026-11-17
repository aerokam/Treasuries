import { test, expect } from '@playwright/test';

// CMTs (YieldsMonitor/knowledge/2.1_Assemble_Range_Data.md 2.1.5, 2.5 CMT line, 2.6 and 2.7 CMT overlay).
// The CMT rates (S24) and R-CMT rates (S25) are read from R2, as the app reads them.

const cmtLine = (page, sym) => page.evaluate((s) => {
  const ds = Chart.getChart(document.getElementById(`chart-${s}`))?.data.datasets.find(d => d.tag === 'cmt');
  return ds ? { n: ds.data.length, label: ds.label, xs: ds.data.map(p => +p.x), ys: ds.data.map(p => p.y) } : null;
}, sym);

const curve = (page, id) => page.evaluate((i) => Chart.getChart(document.getElementById(i)).data.datasets.map(d => ({ label: d.label, y: d.data })), id);

test.describe('CMTs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('YieldsMonitor/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.chart-card', { timeout: 15000 });
    await page.locator('.range-btn[data-range="10D"]').click();
    await expect(page.locator('#fetchStatus')).toContainText('TIPS latest:');
  });

  test('is unchecked at first, and its line has a point at 15:30 ET of each Date on the 10D range', async ({ page }) => {
    await expect(page.locator('#showCmt')).not.toBeChecked();
    expect((await cmtLine(page, 'US10Y')).n).toBe(0);

    await page.check('#showCmt');
    await expect.poll(async () => (await cmtLine(page, 'US10Y')).n).toBeGreaterThan(3);
    const line = await cmtLine(page, 'US10Y');
    const hm = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', hour: 'numeric', minute: 'numeric' });
    for (const x of line.xs) expect(hm.format(new Date(x))).toBe('15:30');
    for (const y of line.ys) expect(y).toBeGreaterThan(0.5);

    await page.uncheck('#showCmt');
    expect((await cmtLine(page, 'US10Y')).n).toBe(0);
  });

  test('draws the R-CMT on the 5Y, 10Y and 30Y TIPS charts only', async ({ page }) => {
    await page.locator('#sidebar label.sym-item-check input[value="US1YTIPS"]').check();
    await page.locator('#sidebar label.sym-item-check input[value="US10YTIPS"]').check();
    await page.check('#showCmt');
    await expect.poll(async () => (await cmtLine(page, 'US10YTIPS'))?.n).toBeGreaterThan(3);
    expect(await cmtLine(page, 'US1YTIPS')).toBeNull();
  });

  test('draws the daily ranges at midnight ET of the Date', async ({ page }) => {
    await page.locator('.range-btn[data-range="1Y"]').click();
    await expect(page.locator('#fetchStatus')).toContainText('TIPS latest:');
    await page.check('#showCmt');
    await expect.poll(async () => (await cmtLine(page, 'US10Y')).n).toBeGreaterThan(100);
    const line = await cmtLine(page, 'US10Y');
    const hm = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', hour: 'numeric', minute: 'numeric' });
    expect(hm.format(new Date(line.xs[0]))).toBe('00:00');
  });

  test('adds the CMT to the Yield Curves tab and the CMT BEI to the Breakeven tab', async ({ page }) => {
    await page.check('#showCmt');
    await expect.poll(async () => (await cmtLine(page, 'US10Y')).n).toBeGreaterThan(3);

    await page.click('[data-tab="yieldcurves"]');
    const nominal = await curve(page, 'yield-curve-nominal');
    expect(nominal.length).toBe(4);
    expect(nominal[2].label).toMatch(/^CMT \d\d\/\d\d\/\d{4}$/);
    expect(nominal[2].y.filter(v => v != null).length).toBe(9);
    const tips = await curve(page, 'yield-curve-tips');
    const tipsCmt = tips[tips.length - 2]; // the start date; the end date is today, before its rates are published
    expect(tipsCmt.label).toMatch(/^R-CMT /);
    expect(tipsCmt.y.filter(v => v != null).length).toBe(3);
    expect(tipsCmt.y[0]).toBeNull(); // 1-Year TIPS has no R-CMT

    await page.click('[data-tab="breakeven"]');
    const bei = await curve(page, 'yield-curve-breakeven');
    const beiEnd = bei[bei.length - 2];
    expect(beiEnd.label).toMatch(/^CMT BEI /);
    expect(beiEnd.y.filter(v => v != null).length).toBe(3);
    for (const v of beiEnd.y.filter(v => v != null)) expect(v).toBeGreaterThan(0.5);

    await page.uncheck('#showCmt');
    const off = await curve(page, 'yield-curve-breakeven');
    expect(off.slice(-2).every(d => d.y.every(v => v == null))).toBe(true);
  });
});

test.describe('Market Yields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('YieldsMonitor/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.chart-card', { timeout: 15000 });
    await page.locator('.range-btn[data-range="10D"]').click();
    await expect(page.locator('#fetchStatus')).toContainText('TIPS latest:');
  });

  const yieldLine = (page, sym) => page.evaluate((s) => Chart.getChart(document.getElementById(`chart-${s}`)).data.datasets[0].data.length, sym);

  test('is checked at first and, unchecked, empties the Yield lines and grays out Quoted and SA', async ({ page }) => {
    await expect(page.locator('#showMarket')).toBeChecked();
    await expect(page.locator('#showQuotedYield')).toBeEnabled();
    expect(await yieldLine(page, 'US10Y')).toBeGreaterThan(0);

    await page.check('#showCmt');
    await expect.poll(async () => (await cmtLine(page, 'US10Y')).n).toBeGreaterThan(3);
    await page.uncheck('#showMarket');
    expect(await yieldLine(page, 'US10Y')).toBe(0);
    expect(await yieldLine(page, 'US10YTIPS')).toBe(0);
    expect((await cmtLine(page, 'US10Y')).n).toBeGreaterThan(3);
    await expect(page.locator('#showQuotedYield')).toBeDisabled();
    await expect(page.locator('#showSaYield')).toBeDisabled();

    await page.check('#showMarket');
    expect(await yieldLine(page, 'US10Y')).toBeGreaterThan(0);
    await expect(page.locator('#showQuotedYield')).toBeEnabled();
  });

  test('keeps one of Market Yields and CMTs checked', async ({ page }) => {
    await page.uncheck('#showMarket');
    await expect(page.locator('#showCmt')).toBeChecked();
    await page.uncheck('#showCmt');
    await expect(page.locator('#showMarket')).toBeChecked();
  });

  test('empties the Market datasets of the Yield Curves tab and keeps the CMT ones', async ({ page }) => {
    await page.check('#showCmt');
    await expect.poll(async () => (await cmtLine(page, 'US10Y')).n).toBeGreaterThan(3);
    await page.uncheck('#showMarket');
    await page.click('[data-tab="yieldcurves"]');
    const nominal = await curve(page, 'yield-curve-nominal');
    expect(nominal[0].y.every(v => v == null)).toBe(true);
    expect(nominal[1].y.every(v => v == null)).toBe(true);
    expect(nominal[2].y.filter(v => v != null).length).toBe(9);
  });
});
