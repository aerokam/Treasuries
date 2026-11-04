import { test, expect } from '@playwright/test';

// The 0.125% TIPS due 2025-10-15 of the AMD example in TIPS_OID_Tax_Reference.md, with its dated date
// Ref CPI and the Ref CPI of 2024-06-14. The other Ref CPI values are chosen for the cases, not published.
const TIPS_REF = 'cusip,maturity,datedDate,coupon,datedDateRefCpi,term\n91282CAQ4,2025-10-15,2020-10-15,0.00125,259.46997,5-Year\n';
const REF_CPI = 'date,refCpi\n2020-10-15,259.46997\n2024-06-14,312.85893\n2025-01-01,317.60300\n2025-02-01,318.50000\n';

// CPI history (S8) holds December 2024, the month three months before 2025-03-01.
const CPI_HISTORY = 'Year,Period,PeriodName,NSA,SA\n2024,M12,December,320.123,\n';

async function open(page) {
  await page.route('**/TIPS/TipsRef.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: TIPS_REF }));
  await page.route('**/TIPS/RefCPI.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: REF_CPI }));
  await page.route('**/bls/CPI_history.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: CPI_HISTORY }));
  await page.goto('/TaxationOfTreasuries/');
  await page.getByRole('button', { name: /OID Calculator/ }).click();
  await expect(page.locator('#oid-status')).toContainText('Ref CPI from 2020-10-15 through 2025-02-01');
}

async function enter(page, { cusip, quantity, start, end }) {
  await page.locator('#oid-cusip').fill(cusip);
  if (quantity !== undefined) await page.locator('#oid-quantity').fill(String(quantity));
  await page.locator('#oid-start').fill(start);
  await page.locator('#oid-end').fill(end);
}

test('the OID Calculator opens from the left pane with Quantity 1 and Index Ratio not rounded', async ({ page }) => {
  await open(page);
  await expect(page.locator('#oid-quantity')).toHaveValue('1');
  await expect(page.locator('input[name="oid-rounding"]:checked')).toHaveValue('none');
  await expect(page.locator('#oid-result')).toContainText('Enter a CUSIP, a Start Date and an End Date.');
  await expect(page.locator('.oid-help')).toContainText('Start Date is the first day the TIPS is held in the tax year:');
});

test('OID of $20,000 par from the dated date to 2024-06-14, not rounded and rounded as Treasury rounds it', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '91282caq4', quantity: 20, start: '2020-10-15', end: '2024-06-14' });
  await expect(page.locator('#oid-result .oid-amount')).toHaveText('OID $4,115.23');
  await expect(page.locator('#oid-result')).toContainText('0.125% TIPS due 2025-10-15');
  await page.getByLabel('Rounded as Treasury rounds it').check();
  await expect(page.locator('#oid-result .oid-amount')).toHaveText('OID $4,115.20');
  await expect(page.locator('#oid-result')).toContainText('1.20576');
});

test('an End Date after the last Ref CPI date is calculated at the last date, with a note', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '91282CAQ4', start: '2024-06-14', end: '2025-10-15' });
  await expect(page.locator('#oid-result')).toContainText('2025-03-01 (entered 2025-10-15)');
  await expect(page.locator('#oid-result .oid-note', { hasText: 'The latest known' })).toContainText('The latest known Ref CPI is that of 2025-03-01. The OID is calculated as of that date, not as of the End Date entered.');
  await expect(page.locator('#oid-result .oid-amount')).toHaveText('OID $28.00');
  await expect(page.locator('#oid-result')).not.toContainText('Treasury has not yet published');
});

test('an End Date after the Maturity Date shows its message', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '91282CAQ4', start: '2024-06-14', end: '2026-01-01' });
  await expect(page.locator('#oid-result .oid-message')).toHaveText('The End Date is after the Maturity Date, 2025-10-15. For a TIPS held to maturity, enter the Maturity Date.');
});

test('an unknown CUSIP and a Start Date after the End Date show their messages', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '000000000', start: '2024-06-14', end: '2025-01-01' });
  await expect(page.locator('#oid-result .oid-message')).toHaveText('No TIPS has this CUSIP.');
  await enter(page, { cusip: '91282CAQ4', start: '2025-01-01', end: '2024-06-14' });
  await expect(page.locator('#oid-result .oid-message')).toHaveText('The Start Date is after the End Date.');
});

test('an End Date that is the first of a month after the last Ref CPI date uses the CPI-U of three months before', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '91282CAQ4', start: '2024-06-14', end: '2025-03-01' });
  await expect(page.locator('#oid-result .oid-amount')).toHaveText('OID $28.00');
  await expect(page.locator('#oid-result .oid-note')).toHaveText('Treasury has not yet published the Ref CPI of 2025-03-01. It is known from the CPI-U of December 2024, as 31 CFR 356 Appendix B §I.B.3 states for the first day of a month.');
  await expect(page.locator('#oid-result')).not.toContainText('(entered');
});

test('a failed load shows the load error and no result', async ({ page }) => {
  await page.route('**/TIPS/TipsRef.csv', route => route.fulfill({ status: 500, body: '' }));
  await page.route('**/TIPS/RefCPI.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: REF_CPI }));
  await page.route('**/bls/CPI_history.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: CPI_HISTORY }));
  await page.goto('/TaxationOfTreasuries/');
  await page.getByRole('button', { name: /OID Calculator/ }).click();
  await expect(page.locator('#oid-status')).toContainText('Load error: TipsRef.csv: HTTP 500');
});

test('a Start Date after the latest known Ref CPI shows the dates for which Ref CPI values are available', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '91282CAQ4', start: '2025-06-01', end: '2025-07-01' });
  await expect(page.locator('#oid-result .oid-message')).toHaveText('There is no Ref CPI for the Start Date. Ref CPI values are available from 2020-10-15 through 2025-03-01.');
});
