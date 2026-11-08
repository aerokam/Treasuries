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
  await expect(options.nth(2)).toHaveText(/91282CBZ1\s+1\.750% due 2030-07-15/);
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
  await expect(rows(page).first().locator('.oid-cell')).toHaveText('4,115.23');
  await expect(page.locator('#oid-total')).toHaveText('4,115.23');
  await expect(page.locator('#oid-cusip')).toHaveValue('');
  await expect(page.locator('#oid-quantity')).toHaveValue('');
  await page.getByLabel('Rounded as Treasury rounds it').check();
  await expect(page.locator('#oid-total')).toHaveText('4,115.20');
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
  await expect(rows(page).first().locator('.oid-cell')).toContainText('28.00');
  await expect(rows(page).first().locator('.oid-cell')).toContainText('as of 2025-03-01');
  await expect(page.locator('.oid-note', { hasText: 'The latest known' })).toHaveText('The latest known Ref CPI is that of 2025-03-01. The OID of an entry whose End Date is after it is calculated as of that date.');
});

test('a TIPS acquired on two dates has two entries, a subtotal, and a CUSIP with one entry has none', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-02-01');
  await add(page, { cusip: '91282CBZ1', quantity: 1, end: '2025-01-01' });
  await add(page, { cusip: '91282CBZ1', quantity: 2, start: '2025-01-01', end: '2025-02-01' });
  await add(page, { cusip: '91282CAQ4', quantity: 1, end: '2025-01-01' });
  await expect(rows(page)).toHaveCount(3);
  await expect(rows(page).nth(0)).toContainText('91282CAQ4');
  await expect(rows(page).nth(1).locator('.oid-cell')).toHaveText('13.11');
  await expect(rows(page).nth(2).locator('.oid-cell')).toHaveText('5.73');
  await expect(page.locator('tr.oid-subtotal')).toHaveCount(1);
  await expect(page.locator('tr.oid-subtotal')).toContainText('Subtotal OID of 91282CBZ1');
  await expect(page.locator('tr.oid-subtotal')).toContainText('18.84');
  await expect(page.locator('#oid-total')).toHaveText('37.12');
});

test('Edit puts the entry in the form and out of the table, and Add returns it with the change', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CBZ1', quantity: 1 });
  await expect(page.locator('#oid-total')).toHaveText('13.11');
  await rows(page).first().getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('table.oid-all')).toHaveCount(0);
  await expect(page.locator('#oid-cusip')).toHaveValue('91282CBZ1');
  await expect(page.locator('#oid-quantity')).toHaveValue('1');
  await expect(page.locator('#oid-entry-start')).toHaveValue('2024-07-31');
  await expect(page.locator('#oid-entry-end')).toHaveValue('2025-01-01');
  await page.locator('#oid-quantity').fill('3');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(page.locator('#oid-total')).toHaveText('39.33');
});

test('Remove takes the entry out of the table and out of the total', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CBZ1', quantity: 1 });
  await add(page, { cusip: '91282CAQ4', quantity: 1 });
  await expect(page.locator('#oid-total')).toHaveText('31.39');
  await rows(page).first().getByRole('button', { name: 'Remove' }).click();
  await expect(rows(page)).toHaveCount(1);
  await expect(page.locator('#oid-total')).toHaveText('13.11');
  await rows(page).first().getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('table.oid-all')).toHaveCount(0);
});

test('a change of the range hides the entry of a TIPS not outstanding in it and shows the entry again when it is, and Edit offers the TIPS of its entry', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CBZ1', quantity: 1 });
  await expect(page.locator('#oid-total')).toHaveText('13.11');
  await rows(page).first().getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#oid-cusip')).toHaveValue('91282CBZ1');
  await page.locator('#oid-end').fill('2024-07-01');   // before the Original Issue Date of the second TIPS
  await expect(page.locator('#oid-cusip')).toHaveValue('91282CBZ1');
  await page.locator('#oid-end').fill('2025-01-01');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('#oid-total')).toHaveText('13.11');
  await page.locator('#oid-end').fill('2024-07-01');
  await expect(page.locator('table.oid-all')).toHaveCount(0);
  await page.locator('#oid-end').fill('2025-01-01');
  await expect(page.locator('#oid-total')).toHaveText('13.11');
});

test('a change of the range shows an entry with the dates of the range as the dates of the new range, and an entry with dates the user stated with those dates within the new range, or not at all when none of them are', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CAQ4', quantity: 1 });                                             // takes the dates of the range
  await add(page, { cusip: '91282CAQ4', quantity: 2, start: '2024-06-14', end: '2025-01-01' });      // states its dates
  expect(await tableDates(page)).toEqual([['1', '2024-06-14', '2025-01-01'], ['2', '2024-06-14', '2025-01-01']]);
  await setRange(page, '2024-07-31', '2025-02-01');
  expect(await tableDates(page)).toEqual([['1', '2024-07-31', '2025-02-01'], ['2', '2024-07-31', '2025-01-01']]);
  await setRange(page, '2024-06-14', '2025-01-01');
  expect(await tableDates(page)).toEqual([['1', '2024-06-14', '2025-01-01'], ['2', '2024-06-14', '2025-01-01']]);
  await setRange(page, '2025-01-01', '2025-02-01');                                                 // after the stated End Date
  expect(await tableDates(page)).toEqual([['1', '2025-01-01', '2025-02-01']]);
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

test('the dates of an entry stay within the range: the fields limit them, leaving a field replaces a date outside, and Add refuses one', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await page.locator('#oid-cusip').selectOption('91282CAQ4');
  await expect(page.locator('#oid-entry-start')).toHaveAttribute('min', '2024-06-14');
  await expect(page.locator('#oid-entry-start')).toHaveAttribute('max', '2025-01-01');
  await expect(page.locator('#oid-entry-end')).toHaveAttribute('max', '2025-01-01');
  await page.locator('#oid-entry-start').fill('2024-01-01');
  await page.locator('#oid-entry-start').blur();
  await expect(page.locator('#oid-entry-start')).toHaveValue('2024-06-14');
  await page.locator('#oid-entry-end').fill('2025-06-01');
  await page.locator('#oid-entry-end').blur();
  await expect(page.locator('#oid-entry-end')).toHaveValue('2025-01-01');
  // a date outside the range still in the field when Enter adds the entry, as the field has not been left
  await page.locator('#oid-quantity').fill('1');
  await page.locator('#oid-entry-end').fill('2025-06-01');
  await page.locator('#oid-entry-end').press('Enter');
  await expect(message(page)).toHaveText('The Start Date and End Date of an entry cannot be outside the range.');
  await expect(page.locator('table.oid-all')).toHaveCount(0);
});

// Keystrokes into the date field: the year passes through dates (0002, 0020, 0202) before it is complete.
async function typeDate(page, selector, digits) {
  await page.locator(selector).focus();
  for (const ch of digits) await page.keyboard.type(ch);
}

test('a date typed into the Start Date is left alone while the year is typed, and replaced as soon as the year has four digits', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await page.locator('#oid-cusip').selectOption('91282CAQ4');
  const start = page.locator('#oid-entry-start');
  await typeDate(page, '#oid-entry-start', '0101202');
  await expect(start).toHaveValue('0202-01-01');
  await page.keyboard.type('3');
  await expect(start).toHaveValue('2024-06-14');   // 2023-01-01 is before the range
  await start.blur();
  await typeDate(page, '#oid-entry-start', '09012024');
  await expect(start).toHaveValue('2024-09-01');   // inside the range: kept
  // a month typed into a date whose year is complete is replaced when the field is left, not while it is typed
  await start.blur();
  await typeDate(page, '#oid-entry-start', '01');
  await expect(start).toHaveValue('2024-01-01');
  await start.blur();
  await expect(start).toHaveValue('2024-06-14');
});

test('a date typed into the End Date after the range is replaced by the End Date of the range, and a Start Date before the Original Issue Date by it', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await page.locator('#oid-cusip').selectOption('91282CBZ1');
  await typeDate(page, '#oid-entry-end', '06012025');
  await expect(page.locator('#oid-entry-end')).toHaveValue('2025-01-01');
  await typeDate(page, '#oid-entry-start', '06202024');
  await expect(page.locator('#oid-entry-start')).toHaveValue('2024-07-31');
});

test('coupons are shown as n.nnn%, no value has a dollar sign, and the values that make up the total are bold', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-02-01');
  await expect(page.locator('#oid-cusip option').nth(2)).toHaveText(/1\.750% due 2030-07-15/);
  await add(page, { cusip: '91282CBZ1', quantity: 1, end: '2025-01-01' });
  await add(page, { cusip: '91282CBZ1', quantity: 2, start: '2025-01-01', end: '2025-02-01' });
  await add(page, { cusip: '91282CAQ4', quantity: 1, end: '2025-01-01' });
  await expect(rows(page).nth(0)).toContainText('0.125%');
  await expect(rows(page).nth(1)).toContainText('1.750%');
  await expect(page.locator('table.oid-all')).not.toContainText('$');
  const weight = loc => loc.evaluate(el => getComputedStyle(el).fontWeight);
  expect(Number(await weight(rows(page).nth(0).locator('.oid-cell')))).toBeGreaterThanOrEqual(700);   // one entry: counts as it is
  expect(Number(await weight(rows(page).nth(1).locator('.oid-cell')))).toBeLessThan(700);             // inside a subtotal
  expect(Number(await weight(rows(page).nth(2).locator('.oid-cell')))).toBeLessThan(700);
  expect(Number(await weight(page.locator('tr.oid-subtotal td').nth(1)))).toBeGreaterThanOrEqual(700);
  expect(Number(await weight(page.locator('#oid-total')))).toBeGreaterThanOrEqual(700);
});

test('an End Date that is the first of a month after the last Ref CPI date uses the CPI-U of three months before', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-03-01');
  await add(page, { cusip: '91282CAQ4', quantity: 1 });
  await expect(page.locator('#oid-total')).toHaveText('28.00');
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


// ---- Import CSV (8.3 Import) ----

const importFile = (page, text) => page.locator('#oid-import').setInputFiles({ name: 'orders.csv', mimeType: 'text/csv', buffer: Buffer.from(text) });
const importMessage = page => page.locator('#oid-import-message');
// [Quantity, Start Date, End Date] of each entry, in the order of the table
const tableDates = async page => (await rows(page).evaluateAll(trs => trs.map(tr => [...tr.querySelectorAll('td')].slice(3, 6).map(td => td.textContent.trim()))));

test('a CSV file of purchases gives an entry for each line: par in dollars, a quoted quantity, MM/DD/YYYY or YYYY-MM-DD, an earlier Settlement Date held from the range, and the range End Date as the End Date', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await importFile(page, [
    'CUSIP,QTY,Settlement date',
    '91282CAQ4,"20,000",06/14/2024',
    '91282CAQ4,"$10,000",09/18/2023',
    '91282CBZ1,"1,000",2024-07-31',
    '',
  ].join('\r\n'));
  await expect(importMessage(page)).toHaveText('3 out of 3 rows have TIPS that were outstanding in the date range.');
  await expect(rows(page)).toHaveCount(3);
  // the Settlement Date of 2023 is held from the Start Date of the range
  await expect(rows(page).nth(0)).toContainText('91282CAQ4');
  await expect(rows(page).nth(0).locator('td').nth(3)).toHaveText('20');
  await expect(rows(page).nth(0).locator('td').nth(4)).toHaveText('2024-06-14');
  await expect(rows(page).nth(0).locator('td').nth(5)).toHaveText('2025-01-01');
  await expect(rows(page).nth(0).locator('.oid-cell')).toHaveText('365.67');
  await expect(rows(page).nth(1).locator('td').nth(3)).toHaveText('10');
  await expect(rows(page).nth(1).locator('td').nth(4)).toHaveText('2024-06-14');
  await expect(rows(page).nth(1).locator('.oid-cell')).toHaveText('182.84');
  await expect(rows(page).nth(2).locator('td').nth(4)).toHaveText('2024-07-31');
  await expect(rows(page).nth(2).locator('.oid-cell')).toHaveText('13.11');
  await expect(page.locator('tr.oid-subtotal')).toContainText('Subtotal OID of 91282CAQ4');
  await expect(page.locator('#oid-total')).toHaveText('561.62');
});

test('a sale (negative quantity) ends the earliest acquisitions of its CUSIP first, and an acquisition ended in part continues with the rest', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-02-01');
  await importFile(page, [
    'CUSIP,QTY,Settlement date',
    '91282CAQ4,"20,000",06/14/2024',
    '91282CAQ4,"10,000",07/31/2024',
    '91282CAQ4,"-25,000",01/01/2025',
  ].join('\n'));
  await expect(importMessage(page)).toHaveText('3 out of 3 rows have TIPS that were outstanding in the date range.');
  expect(await tableDates(page)).toEqual([
    ['20', '2024-06-14', '2025-01-01'],
    ['5', '2024-07-31', '2025-02-01'],
    ['5', '2024-07-31', '2025-01-01'],
  ]);
});

test('a sale of more than the acquisitions of the file was acquired before the range, a sale before the range ends an acquisition and gives no entry, and a purchase and a sale of one day give no entry', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-02-01');
  await importFile(page, [
    'CUSIP,QTY,Settlement date',
    '91282CAQ4,"2,000",01/02/2024',          // 2: bought and sold before the range
    '91282CAQ4,"-2,000",05/01/2024',         // 3
    '91282CAQ4,"5,000",07/31/2024',          // 4: bought in the range
    '91282CAQ4,"-10,000",01/01/2025',        // 5: sells those 5 and 5 held before the range
    '91282CBZ1,"-1,000",07/31/2024',         // 6: a sale ahead of its purchase in the file, on one day
    '91282CBZ1,"1,000",07/31/2024',          // 7
  ].join('\n'));
  await expect(importMessage(page)).toHaveText('6 out of 6 rows have TIPS that were outstanding in the date range.');
  expect(await tableDates(page)).toEqual([
    ['5', '2024-06-14', '2025-01-01'],
    ['5', '2024-07-31', '2025-01-01'],
  ]);
});

test('a line that gives no transaction is skipped with its line number and reason, the cells after the third are not read, and the other lines are imported', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await importFile(page, [
    'CUSIP,QTY,Settlement date',                              // line 1
    '91282CAQ4,"20,000",06/14/2024,09/01/2024',               // line 2: good, the fourth cell is not read
    '912828ZZZ,"1,000",06/14/2024',                           // line 3
    '91282CAQ4,"1,500",06/14/2024',                           // line 4
    '91282CAQ4,"1,000",06/31/2024',                           // line 5
    '91282CAQ4,"1,000",03/01/2025',                           // line 6: after the range, gives no entry
    '91282CAQ4',                                              // line 7
    '91282CAQ4,0,06/14/2024',                                 // line 8
    '91282CXX0,"1,000",06/14/2024',                           // line 9: matured before the range, so not counted
  ].join('\r\n'));
  await expect(importMessage(page).locator('p')).toHaveText('2 out of 8 rows have TIPS that were outstanding in the date range.');
  expect(await tableDates(page)).toEqual([['20', '2024-06-14', '2025-01-01']]);
  await expect(importMessage(page).locator('li')).toHaveText([
    'Line 3: 912828ZZZ is not in the TIPS reference data.',
    'Line 4: Quantity is a par amount that is a multiple of 1,000, negative for a sale.',
    'Line 5: Settlement Date is not a date.',
    'Line 7: Needs a CUSIP, a quantity and a Settlement Date.',
    'Line 8: Quantity is a par amount that is a multiple of 1,000, negative for a sale.',
  ]);
});

test('importing replaces the entries of the table, an entry added afterward joins them, and a file that gives no entry leaves them', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await add(page, { cusip: '91282CBZ1', quantity: 5 });
  await expect(rows(page)).toHaveCount(1);
  await importFile(page, 'CUSIP,QTY,Settlement date\n91282CAQ4,"20,000",06/14/2024\n');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('91282CAQ4');
  await add(page, { cusip: '91282CBZ1', quantity: 1 });
  await expect(rows(page)).toHaveCount(2);
  await importFile(page, 'CUSIP,QTY,Settlement date\n912828ZZZ,"1,000",06/14/2024\n');
  await expect(importMessage(page).locator('p')).toHaveText('0 out of 1 rows have TIPS that were outstanding in the date range.');
  await expect(rows(page)).toHaveCount(2);
  await importFile(page, 'CUSIP,QTY,Settlement date\n');
  await expect(importMessage(page)).toHaveText('The file has no lines to import.');
  await expect(rows(page)).toHaveCount(2);
});

test('importing waits for the range', async ({ page }) => {
  await open(page);
  await importFile(page, 'CUSIP,QTY,Settlement date\n91282CAQ4,"20,000",06/14/2024\n');
  await expect(importMessage(page)).toHaveText('Enter a Start Date and an End Date for the range.');
  await expect(page.locator('table.oid-all')).toHaveCount(0);
  await setRange(page, '2024-06-14', '2025-01-01');
  await importFile(page, 'CUSIP,QTY,Settlement date\n91282CAQ4,"20,000",06/14/2024\n');
  await expect(rows(page)).toHaveCount(1);
});

test('the file stays loaded: a change of the range derives its entries again, and the message counts the rows with a TIPS outstanding in the range', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await importFile(page, [
    'CUSIP,QTY,Settlement date',
    '91282CAQ4,"20,000",06/14/2024',
    '91282CBZ1,"1,000",07/31/2024',
    '91282CXX0,"1,000",06/14/2021',          // matured 2022-10-15
  ].join('\n'));
  await expect(importMessage(page)).toHaveText('2 out of 3 rows have TIPS that were outstanding in the date range.');
  expect(await tableDates(page)).toEqual([['20', '2024-06-14', '2025-01-01'], ['1', '2024-07-31', '2025-01-01']]);
  await expect(page.locator('#oid-total')).toHaveText('378.78');
  await setRange(page, '2025-01-01', '2025-02-01');
  await expect(importMessage(page)).toHaveText('2 out of 3 rows have TIPS that were outstanding in the date range.');
  expect(await tableDates(page)).toEqual([['20', '2025-01-01', '2025-02-01'], ['1', '2025-01-01', '2025-02-01']]);
  await setRange(page, '2024-06-14', '2025-01-01');
  await expect(page.locator('#oid-total')).toHaveText('378.78');
});

test('an entry added by hand after an import stays with the entries of the file when the range changes', async ({ page }) => {
  await open(page);
  await setRange(page, '2024-06-14', '2025-01-01');
  await importFile(page, 'CUSIP,QTY,Settlement date\n91282CAQ4,"20,000",06/14/2024\n');
  await add(page, { cusip: '91282CBZ1', quantity: 1 });
  expect(await tableDates(page)).toEqual([['20', '2024-06-14', '2025-01-01'], ['1', '2024-07-31', '2025-01-01']]);
  await setRange(page, '2025-01-01', '2025-02-01');
  expect(await tableDates(page)).toEqual([['20', '2025-01-01', '2025-02-01'], ['1', '2025-01-01', '2025-02-01']]);
});
