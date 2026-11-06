import { test, expect } from '@playwright/test';

// The 0.125% TIPS due 2025-10-15 of the AMD example in TIPS_OID_Tax_Reference.md, with its dated date
// Ref CPI and the Ref CPI of 2024-06-14. The other Ref CPI values are chosen for the cases, not published.
// The Original Issue Date of the first TIPS is set to its dated date so the cases that start there keep the Start Date as entered.
// The second TIPS is issued after the start of the range of most cases, and the third matured before it.
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

async function setRange(page, start, end) {
  await page.locator('#oid-start').fill(start);
  await page.locator('#oid-end').fill(end);
}

// Choose a CUSIP, state the Quantity and any dates, and press Add.
async function add(page, { cusip, quantity, start, end }) {
  await page.locator('#oid-cusip').selectOption(cusip);
  if (quantity !== undefined) await page.locator('#oid-quantity').fill(String(quantity));
  if (start) await page.locator('#oid-entry-start').fill(start);
  if (end) await page.locator('#oid-entry-end').fill(end);
  await page.getByRole('button', { name: 'Add' }).click();
}

const rows = page => page.locator('table.oid-all tbody tr[data-id]');
const message = page => page.locator('#oid-form-message');

test('the OID Calculator opens from the left pane with a blank Quantity, Index Ratio not rounded and no entries', async ({ page }) => {
  await open(page);
  await expect(page.locator('#oid-quantity')).toHaveValue('');
  await expect(page.locator('input[name="oid-rounding"]:checked')).toHaveValue('none');
  await expect(message(page)).toHaveText('Enter a Start Date and an End Date for the range.');
  await expect(page.locator('#oid-cusip option')).toHaveCount(1);
  await expect(page.locator('table.oid-all')).toHaveCount(0);
  await expect(page.locator('.oid-help')).toContainText('Start Date is the first day the TIPS is held in the tax year:');
  await expect(page.locator('#oid-start')).toHaveClass(/date-picker/);
});

test('the CUSIP list holds the TIPS outstanding in the range, by Maturity Date, and follows the range', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  const options = page.locator('#oid-cusip option');
  await expect(options).toHaveCount(3);
  await expect(options.nth(0)).toHaveText('');
  await expect(options.nth(1)).toHaveText(/91282CAQ4\s+0\.125% due 2025-10-15/);
  await expect(options.nth(2)).toHaveText(/91282CBZ1\s+1\.75% due 2030-07-15/);
  await expect(page.locator('#oid-cusip')).not.toContainText('91282CXX0');
  await expect(message(page)).toHaveText('');
  await page.locator('#oid-end').fill('2024-07-01');   // before the Original Issue Date of the second TIPS
  await expect(options).toHaveCount(2);
  await page.locator('#oid-end').fill('2024-01-01');
  await expect(message(page)).toHaveText('The Start Date is after the End Date.');
  await expect(options).toHaveCount(1);
});

test('an entry takes the dates of the range, and Add puts it in the table and clears the CUSIP and Quantity', async ({ page }) => {
  await open(page);
  await setRange(page, '2020-10-15', '2024-06-14');
  await page.locator('#oid-cusip').selectOption('91282CAQ4');
  await expect(page.locator('#oid-entry-start')).toHaveValue('2020-10-15');
  await expect(page.locator('#oid-entry-end')).toHaveValue('2024-06-14');
  await page.locator('#oid-quantity').fill('20');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('91282CAQ4');
  await expect(rows(page).first()).toContainText('2025-10-15');
  await expect(rows(page).first()).toContainText('0.125%');
  await expect(rows(page).first().locator('.oid-cell')).toHaveText('$4,115.23');
  await expect(page.locator('#oid-total')).toHaveText('$4,115.23');
  await expect(page.locator('#oid-cusip')).toHaveValue('');
  await expect(page.locator('#oid-quantity')).toHaveValue('');
  await page.getByLabel('Rounded as Treasury rounds it').check();
  await expect(page.locator('#oid-total')).toHaveText('$4,115.20');
});

test('Enter in a field of the form adds the entry', async ({ page }) => {
  await open(page);
  await setRange(page, '2020-10-15', '2024-06-14');
  await page.locator('#oid-cusip').selectOption('91282CAQ4');
  await page.locator('#oid-quantity').fill('20');
  await page.locator('#oid-quantity').press('Enter');
  await expect(rows(page)).toHaveCount(1);
});

test('a TIPS issued after the range starts takes the Original Issue Date as its Start Date', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await page.locator('#oid-cusip').selectOption('91282CBZ1');
  await expect(page.locator('#oid-entry-start')).toHaveValue('2024-07-31');
  await page.locator('#oid-cusip').selectOption('91282CAQ4');
  await expect(page.locator('#oid-entry-start')).toHaveValue('2024-06-14');
});

test('a Start Date entered before the Original Issue Date is replaced in the field by it', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await page.locator('#oid-cusip').selectOption('91282CBZ1');
  const start = page.locator('#oid-entry-start');
  await start.fill('2024-06-20');
  await start.blur();
  await expect(start).toHaveValue('2024-07-31');
});

test('a range ending after a Maturity Date locks the End Date at the Maturity Date, and the OID is as of the latest known Ref CPI', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2026-01-01');
  await page.locator('#oid-cusip').selectOption('91282CAQ4');
  await expect(page.locator('#oid-entry-end')).toHaveValue('2025-10-15');
  await expect(page.locator('#oid-entry-end')).toBeDisabled();
  await page.locator('#oid-cusip').selectOption('91282CBZ1');
  await expect(page.locator('#oid-entry-end')).toHaveValue('2026-01-01');
  await expect(page.locator('#oid-entry-end')).toBeEnabled();
  await add(page, { cusip: '91282CAQ4', quantity: 1 });
  await expect(rows(page).first().locator('.oid-cell')).toContainText('$28.00');
  await expect(rows(page).first().locator('.oid-cell')).toContainText('as of 2025-03-01');
  await expect(page.locator('.oid-note', { hasText: 'The latest known' })).toHaveText('The latest known Ref CPI is that of 2025-03-01. The OID of an entry whose End Date is after it is calculated as of that date.');
});

test('a TIPS acquired on two dates has two entries, a subtotal, and a CUSIP with one entry has none', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CBZ1', quantity: 1 });
  await add(page, { cusip: '91282CBZ1', quantity: 2, start: '2025-01-01', end: '2025-02-01' });
  await add(page, { cusip: '91282CAQ4', quantity: 1 });
  await expect(rows(page)).toHaveCount(3);
  await expect(rows(page).nth(0)).toContainText('91282CAQ4');
  await expect(rows(page).nth(1).locator('.oid-cell')).toHaveText('$13.11');
  await expect(rows(page).nth(2).locator('.oid-cell')).toHaveText('$5.73');
  await expect(page.locator('tr.oid-subtotal')).toHaveCount(1);
  await expect(page.locator('tr.oid-subtotal')).toContainText('Subtotal OID of 91282CBZ1');
  await expect(page.locator('tr.oid-subtotal')).toContainText('$18.84');
  await expect(page.locator('#oid-total')).toHaveText('$37.12');
});

test('Edit puts the entry in the form and out of the table, and Add returns it with the change', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CBZ1', quantity: 1 });
  await expect(page.locator('#oid-total')).toHaveText('$13.11');
  await rows(page).first().getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('table.oid-all')).toHaveCount(0);
  await expect(page.locator('#oid-cusip')).toHaveValue('91282CBZ1');
  await expect(page.locator('#oid-quantity')).toHaveValue('1');
  await expect(page.locator('#oid-entry-start')).toHaveValue('2024-07-31');
  await expect(page.locator('#oid-entry-end')).toHaveValue('2025-01-01');
  await page.locator('#oid-quantity').fill('3');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(page.locator('#oid-total')).toHaveText('$39.33');
});

test('Remove takes the entry out of the table and out of the total', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CBZ1', quantity: 1 });
  await add(page, { cusip: '91282CAQ4', quantity: 1 });
  await expect(page.locator('#oid-total')).toHaveText('$31.39');
  await rows(page).first().getByRole('button', { name: 'Remove' }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(page.locator('#oid-total')).toHaveText('$13.11');
  await rows(page).first().getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('table.oid-all')).toHaveCount(0);
});

test('a change of the range leaves the entries as they are, and Edit offers the TIPS of its entry', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CBZ1', quantity: 1 });
  await page.locator('#oid-end').fill('2024-07-01');
  await expect(page.locator('#oid-cusip option')).toHaveCount(2);
  await expect(page.locator('#oid-total')).toHaveText('$13.11');
  await rows(page).first().getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#oid-cusip')).toHaveValue('91282CBZ1');
  await expect(page.locator('#oid-entry-end')).toHaveValue('2025-01-01');
});

test('Add with no CUSIP, a blank Quantity, or a Start Date after the End Date shows its message and adds nothing', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(message(page)).toHaveText('Choose a CUSIP.');
  await page.locator('#oid-cusip').selectOption('91282CAQ4');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(message(page)).toHaveText('Quantity is a whole number of 1 or more.');
  await page.locator('#oid-quantity').fill('1.5');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(message(page)).toHaveText('Quantity is a whole number of 1 or more.');
  await page.locator('#oid-quantity').fill('1');
  await page.locator('#oid-entry-start').fill('2025-01-01');
  await page.locator('#oid-entry-end').fill('2024-06-14');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(message(page)).toHaveText('The Start Date is after the End Date.');
  await expect(page.locator('table.oid-all')).toHaveCount(0);
});

test('an End Date after the Maturity Date typed before the range allows it shows its message', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CAQ4', quantity: 1, end: '2026-01-01' });
  await expect(message(page)).toHaveText('The End Date is after the Maturity Date, 2025-10-15. For a TIPS held to maturity, enter the Maturity Date.');
});

test('an End Date that is the first of a month after the last Ref CPI date uses the CPI-U of three months before', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-03-01');
  await add(page, { cusip: '91282CAQ4', quantity: 1 });
  await expect(page.locator('#oid-total')).toHaveText('$28.00');
  await expect(page.locator('.oid-note')).toHaveText('Treasury has not yet published the Ref CPI of 2025-03-01. Each is known from the CPI-U of the month three months earlier, as 31 CFR 356 Appendix B §I.B.3 states for the first day of a month.');
  await expect(rows(page).first().locator('.oid-cell')).not.toContainText('as of');
});

test('a Start Date after the latest known Ref CPI shows the dates for which Ref CPI values are available', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-07-01');
  await add(page, { cusip: '91282CAQ4', quantity: 1, start: '2025-06-01', end: '2025-07-01' });
  await expect(message(page)).toHaveText('There is no Ref CPI for the Start Date. Ref CPI values are available from 2020-10-15 through 2025-03-01.');
});

test('a failed load shows the load error and no table', async ({ page }) => {
  await page.route('**/TIPS/TipsRef.csv', route => route.fulfill({ status: 500, body: '' }));
  await page.route('**/TIPS/RefCPI.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: REF_CPI }));
  await page.route('**/bls/CPI_history.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: CPI_HISTORY }));
  await page.goto('/TaxationOfTreasuries/');
  await page.getByRole('button', { name: /OID Calculator/ }).click();
  await expect(page.locator('#oid-status')).toContainText('Load error: TipsRef.csv: HTTP 500');
});
