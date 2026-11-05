import { test, expect } from '@playwright/test';

// The 0.125% TIPS due 2025-10-15 of the AMD example in TIPS_OID_Tax_Reference.md, with its dated date
// Ref CPI and the Ref CPI of 2024-06-14. The other Ref CPI values are chosen for the cases, not published.
// The Original Issue Date of the first TIPS is set to its dated date so the cases that start there keep the Start Date as entered.
// The second TIPS is issued after the start of the range of the Show all cases, and the third matured before it.
const TIPS_REF = 'cusip,maturity,datedDate,coupon,datedDateRefCpi,term,originalIssueDate\n91282CAQ4,2025-10-15,2020-10-15,0.00125,259.46997,5-Year,2020-10-15\n91282CBZ1,2030-07-15,2024-07-15,0.0175,313,5-Year,2024-07-31\n91282CXX0,2022-10-15,2017-10-15,0.00625,250,5-Year,2017-10-31\n';
const REF_CPI = 'date,refCpi\n2020-10-15,259.46997\n2024-06-14,312.85893\n2024-07-31,313.5\n2025-01-01,317.60300\n2025-02-01,318.50000\n';

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

// ---- Show all (8.3 Show all) ----

async function showAll(page, start, end) {
  await page.locator('#oid-start').fill(start);
  await page.locator('#oid-end').fill(end);
  await page.getByRole('button', { name: 'Show all' }).click();
}
const row = (page, cusip) => page.locator(`table.oid-all tbody tr[data-cusip="${cusip}"]`);

test('Show all lists the TIPS outstanding in the range by maturity, each with Quantity 1, and the total OID', async ({ page }) => {
  await open(page);
  await showAll(page, '2024-06-14', '2025-01-01');
  await expect(page.locator('table.oid-all tbody tr')).toHaveCount(2);
  await expect(page.locator('table.oid-all tbody tr').nth(0)).toContainText('91282CAQ4');
  await expect(page.locator('table.oid-all tbody tr').nth(1)).toContainText('91282CBZ1');
  await expect(page.locator('table.oid-all')).not.toContainText('91282CXX0');
  await expect(row(page, '91282CAQ4').locator('.oid-qty')).toHaveValue('1');
  await expect(row(page, '91282CAQ4').locator('.oid-cell')).toHaveText('$18.28');
  await expect(row(page, '91282CBZ1').locator('.oid-cell')).toHaveText('$13.11');
  await expect(page.locator('#oid-total')).toHaveText('$31.39');
  await expect(page.getByRole('button', { name: 'Show one CUSIP' })).toBeVisible();
  await expect(page.locator('#oid-cusip')).toBeHidden();
});

test('a row issued after the range starts takes the Original Issue Date as its Start Date', async ({ page }) => {
  await open(page);
  await showAll(page, '2024-06-14', '2025-01-01');
  await expect(row(page, '91282CBZ1').locator('.oid-row-start')).toHaveValue('2024-07-31');
  await expect(row(page, '91282CAQ4').locator('.oid-row-start')).toHaveValue('2024-06-14');
});

test('Set all to 0, then a Quantity for one row, gives that row as the total', async ({ page }) => {
  await open(page);
  await showAll(page, '2024-06-14', '2025-01-01');
  await page.locator('#oid-set-all-value').fill('0');
  await page.locator('#oid-set-all').click();
  await expect(page.locator('#oid-total')).toHaveText('$0.00');
  await row(page, '91282CBZ1').locator('.oid-qty').fill('3');
  await expect(row(page, '91282CBZ1').locator('.oid-cell')).toHaveText('$39.33');
  await expect(page.locator('#oid-total')).toHaveText('$39.33');
});

test('Set checked changes only the checked rows, and a Shift-click checks the rows between', async ({ page }) => {
  await open(page);
  await showAll(page, '2024-06-14', '2025-01-01');
  await page.locator('#oid-set-all-value').fill('2');
  await page.locator('#oid-set-all').click();
  await row(page, '91282CAQ4').locator('.oid-check').check();
  await page.locator('#oid-set-checked-value').fill('0');
  await page.locator('#oid-set-checked').click();
  await expect(row(page, '91282CAQ4').locator('.oid-qty')).toHaveValue('0');
  await expect(row(page, '91282CBZ1').locator('.oid-qty')).toHaveValue('2');
  await row(page, '91282CAQ4').locator('.oid-check').uncheck();
  await row(page, '91282CAQ4').locator('.oid-check').click();
  await row(page, '91282CBZ1').locator('.oid-check').click({ modifiers: ['Shift'] });
  await expect(row(page, '91282CAQ4').locator('.oid-check')).toBeChecked();
  await expect(row(page, '91282CBZ1').locator('.oid-check')).toBeChecked();
});

test('a range ending after a Maturity Date locks that End Date, and a date after the latest known Ref CPI states its date', async ({ page }) => {
  await open(page);
  await showAll(page, '2024-06-14', '2026-01-01');
  await expect(row(page, '91282CAQ4').locator('.oid-row-end')).toHaveValue('2025-10-15');
  await expect(row(page, '91282CAQ4').locator('.oid-row-end')).toBeDisabled();
  await expect(row(page, '91282CBZ1').locator('.oid-row-end')).toBeEnabled();
  await expect(row(page, '91282CAQ4').locator('.oid-cell')).toContainText('$28.00');
  await expect(row(page, '91282CAQ4').locator('.oid-cell')).toContainText('as of 2025-03-01');
  await expect(page.locator('#oid-total')).toHaveText('$49.16');
  await expect(page.locator('#oid-all-notes')).toContainText('The latest known Ref CPI is that of 2025-03-01. The OID of a row whose End Date is after it is calculated as of that date.');
});

test('a row whose dates were changed keeps them when the range changes, and Use range restores the range', async ({ page }) => {
  await open(page);
  await showAll(page, '2024-06-14', '2025-01-01');
  await row(page, '91282CAQ4').locator('.oid-row-end').fill('2025-02-01');
  await row(page, '91282CAQ4').locator('.oid-row-start').fill('2025-01-01');
  await expect(row(page, '91282CAQ4').locator('.oid-cell')).toHaveText('$3.46');
  await page.locator('#oid-start').fill('2024-07-31');
  await expect(row(page, '91282CAQ4').locator('.oid-row-start')).toHaveValue('2025-01-01');
  await expect(row(page, '91282CBZ1').locator('.oid-row-start')).toHaveValue('2024-07-31');
  await row(page, '91282CAQ4').getByRole('button', { name: 'Use range' }).click();
  await expect(row(page, '91282CAQ4').locator('.oid-row-start')).toHaveValue('2024-07-31');
  await expect(row(page, '91282CAQ4').locator('.oid-row-end')).toHaveValue('2025-01-01');
});

test('a Start Date entered before the Original Issue Date is replaced in the field by it', async ({ page }) => {
  await open(page);
  await showAll(page, '2024-06-14', '2025-01-01');
  const start = row(page, '91282CBZ1').locator('.oid-row-start');
  await start.fill('2024-06-20');
  await start.blur();
  await expect(start).toHaveValue('2024-07-31');
});

test('a row with an invalid Quantity shows its message and is left out of the total with a count', async ({ page }) => {
  await open(page);
  await showAll(page, '2024-06-14', '2025-01-01');
  await row(page, '91282CBZ1').locator('.oid-qty').fill('1.5');
  await expect(row(page, '91282CBZ1').locator('.oid-cell')).toContainText('Quantity is a whole number of 0 or more.');
  await expect(page.locator('#oid-total')).toContainText('$18.28');
  await expect(page.locator('#oid-total')).toContainText('no OID for 1 row');
});

test('Show one CUSIP restores the CUSIP and Quantity fields and the result of one TIPS', async ({ page }) => {
  await open(page);
  await showAll(page, '2024-06-14', '2025-01-01');
  await page.getByRole('button', { name: 'Show one CUSIP' }).click();
  await expect(page.locator('#oid-cusip')).toBeVisible();
  await expect(page.locator('#oid-quantity')).toBeVisible();
  await expect(page.locator('#oid-result')).toContainText('Enter a CUSIP, a Start Date and an End Date.');
});

test('one TIPS with a Start Date before its Original Issue Date is calculated from it, with a note', async ({ page }) => {
  await open(page);
  await enter(page, { cusip: '91282CBZ1', start: '2024-06-14', end: '2025-01-01' });
  await expect(page.locator('#oid-result .oid-amount')).toHaveText('OID $13.11');
  await expect(page.locator('#oid-result')).toContainText('2024-07-31 (entered 2024-06-14)');
  await expect(page.locator('#oid-result .oid-note')).toHaveText('The Start Date is before the Original Issue Date. The OID is calculated from the Original Issue Date, 2024-07-31.');
  await enter(page, { cusip: '91282CBZ1', start: '2024-06-14', end: '2024-07-15' });
  await expect(page.locator('#oid-result .oid-message')).toHaveText('The End Date is before the Original Issue Date, 2024-07-31.');
});
