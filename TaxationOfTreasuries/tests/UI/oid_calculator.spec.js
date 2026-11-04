import { test, expect } from '@playwright/test';

// The 0.125% TIPS due 2025-10-15 of the AMD example in TIPS_OID_Tax_Reference.md, with its dated date
// Ref CPI and the Ref CPI of 2024-06-14. The other Ref CPI values are chosen for the cases, not published.
const TIPS_REF = 'cusip,maturity,datedDate,coupon,datedDateRefCpi,term\n91282CAQ4,2025-10-15,2020-10-15,0.00125,259.46997,5-Year\n';
const REF_CPI = 'date,refCpi\n2020-10-15,259.46997\n2024-06-14,312.85893\n2025-01-01,317.60300\n2025-02-01,318.50000\n';

async function open(page) {
  await page.route('**/TIPS/TipsRef.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: TIPS_REF }));
  await page.route('**/TIPS/RefCPI.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: REF_CPI }));
  await page.goto('/TaxationOfTreasuries/');
  await page.getByRole('button', { name: /OID Calculator/ }).click();
  await expect(page.locator('#oid-status')).toContainText('Ref CPI from 2020-10-15 through 2025-02-01');
}

async function enter(page, { cusip, quantity, acquisition, valuation }) {
  await page.locator('#oid-cusip').fill(cusip);
  if (quantity !== undefined) await page.locator('#oid-quantity').fill(String(quantity));
  await page.locator('#oid-acquisition').fill(acquisition);
  await page.locator('#oid-valuation').fill(valuation);
}

test('the OID Calculator opens from the left pane with Quantity 1 and Index Ratio not rounded', async ({ page }) => {
  await open(page);
  await expect(page.locator('#oid-quantity')).toHaveValue('1');
  await expect(page.locator('input[name="oid-rounding"]:checked')).toHaveValue('none');
  await expect(page.locator('#oid-result')).toContainText('Enter a CUSIP, an Acquisition Date and a Valuation Date.');
  await expect(page.locator('.oid-help')).toContainText('Acquisition Date is the Settlement Date of the purchase, not the Trade Date.');
});

test('OID of $20,000 par from the dated date to 2024-06-14, not rounded and rounded as Treasury rounds it', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '91282caq4', quantity: 20, acquisition: '2020-10-15', valuation: '2024-06-14' });
  await expect(page.locator('#oid-result .oid-amount')).toHaveText('OID $4,115.23');
  await expect(page.locator('#oid-result')).toContainText('0.125% TIPS due 2025-10-15');
  await page.getByLabel('Rounded as Treasury rounds it').check();
  await expect(page.locator('#oid-result .oid-amount')).toHaveText('OID $4,115.20');
  await expect(page.locator('#oid-result')).toContainText('1.20576');
});

test('a Valuation Date after the last Ref CPI date is calculated at the last date, with a note', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '91282CAQ4', acquisition: '2024-06-14', valuation: '2025-10-15' });
  await expect(page.locator('#oid-result')).toContainText('2025-02-01 (entered 2025-10-15)');
  await expect(page.locator('#oid-result .oid-note')).toContainText('Ref CPI is published through 2025-02-01. The OID is calculated as of that date, not as of the Valuation Date entered.');
  await expect(page.locator('#oid-result .oid-amount')).toHaveText('OID $21.74');
});

test('a Valuation Date after the Maturity Date shows its message', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '91282CAQ4', acquisition: '2024-06-14', valuation: '2026-01-01' });
  await expect(page.locator('#oid-result .oid-message')).toHaveText('The Valuation Date is after the Maturity Date, 2025-10-15. For a TIPS held to maturity, enter the Maturity Date.');
});

test('an unknown CUSIP and an Acquisition Date after the Valuation Date show their messages', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '000000000', acquisition: '2024-06-14', valuation: '2025-01-01' });
  await expect(page.locator('#oid-result .oid-message')).toHaveText('No TIPS has this CUSIP.');
  await enter(page, { cusip: '91282CAQ4', acquisition: '2025-01-01', valuation: '2024-06-14' });
  await expect(page.locator('#oid-result .oid-message')).toHaveText('The Acquisition Date is after the Valuation Date.');
});

test('a failed load shows the load error and no result', async ({ page }) => {
  await page.route('**/TIPS/TipsRef.csv', route => route.fulfill({ status: 500, body: '' }));
  await page.route('**/TIPS/RefCPI.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: REF_CPI }));
  await page.goto('/TaxationOfTreasuries/');
  await page.getByRole('button', { name: /OID Calculator/ }).click();
  await expect(page.locator('#oid-status')).toContainText('Load error: TipsRef.csv: HTTP 500');
});
