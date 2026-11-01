import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// Every fetch the page makes is mocked: Auctions.csv and the Tentative schedule XML (R2), and the
// upcoming_auctions_v2 feed (FiscalData).

const HEADER = 'cusip,security_type,security_term,comp_auction_close_date,issue_date,maturity_date,inflation_protected,high_yield,offering_amt';
function auctionsCsv() {
  let csv = HEADER + '\n';
  // 150 Notes, so the 100-row cap applies in the All view
  for (let i = 0; i < 150; i++) {
    csv += `NOTE${String(i).padStart(4, '0')},Note,10-Year,2026-10-08,2026-10-15,2036-10-15,No,4.100,58000000000\n`;
  }
  csv += 'TIPSCUS1,Note,10-Year,2026-07-16,2026-07-31,2036-07-15,Yes,1.900,19000000000\n';
  return csv;
}

const UPCOMING_CSV = [
  'cusip,announcemt_date,comp_auction_close_date,issue_date,security_term,security_type,reopening',
  'TIPSCUS1,2026-10-01,2026-10-22,2026-10-31,9-Year 10-Month,Note,Yes',
  'NOTECUS9,2026-11-05,2026-11-12,2026-11-16,3-Year,Note,No',
].join('\n') + '\n';

function tentRow(term, type, reopen, tips, frn, announce, auction, settle) {
  return `<AuctionCalendarDate><SecurityTermWeekYear>${term}</SecurityTermWeekYear><SecurityType>${type}</SecurityType>` +
    `<ReOpeningIndicator>${reopen}</ReOpeningIndicator><TIPS>${tips}</TIPS><FloatingRate>${frn}</FloatingRate>` +
    `<AnnouncementDate>${announce}</AnnouncementDate><AuctionDate>${auction}</AuctionDate><SettlementDate>${settle}</SettlementDate></AuctionCalendarDate>`;
}
const TENT_XML = '<?xml version="1.0"?><AuctionCalendar>' + [
  tentRow('3-Year', 'Note', 'N', 'N', 'N', '2026-10-06', '2026-10-13', '2026-10-15'),
  tentRow('10-Year', 'Note', 'Y', 'Y', 'N', '2026-10-13', '2026-10-20', '2026-10-31'),
  tentRow('2-Year', 'FRN', 'N', 'N', 'Y', '2026-10-20', '2026-10-27', '2026-10-31'),
].join('') + '</AuctionCalendar>';

async function openApp(page) {
  await page.route('**/Auctions.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: auctionsCsv() }));
  await page.route('**/upcoming_auctions**', route => route.fulfill({ status: 200, contentType: 'text/csv', body: UPCOMING_CSV }));
  await page.route('**/Tentative-Auction-Schedule.xml', route => route.fulfill({ status: 200, contentType: 'application/xml', body: TENT_XML }));
  await page.goto('/TreasuryAuctions/');
  await expect(page.locator('#status')).toContainText('Updated:');
}

// Clicks Export CSV and returns the suggested file name and the text of the download, minus the byte-order mark.
async function exportCsv(page) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#exportBtn').click()]);
  const text = fs.readFileSync(await download.path(), 'utf8');
  expect(text.charCodeAt(0)).toBe(0xFEFF);
  return { name: download.suggestedFilename(), lines: text.slice(1).split('\r\n') };
}

const TODAY = /\d{4}-\d{2}-\d{2}/;

test('Historical export writes the visible columns, labelled and formatted as shown, for every row past the 100-row cap', async ({ page }) => {
  await openApp(page);
  await expect(page.locator('#row-count')).toContainText('Showing 100 of 151 rows');
  const { name, lines } = await exportCsv(page);
  expect(name).toMatch(new RegExp(`^auctions-historical-all-${TODAY.source}\.csv$`));
  const shown = await page.locator('#mainThead tr:first-child th').evaluateAll(ths => ths.map(th => th.textContent.replace('✕', '').trim()));
  expect(lines[0].split(',')).toEqual(shown);
  expect(lines[0].split(',')).toEqual(['CUSIP', 'Type', 'TIPS', 'Term', 'Orig Term', 'Maturity', 'Auction Date', 'Issue Date', 'High Yield', 'Coupon', 'High Inv Rate', 'High Price']);
  // header + 151 rows + the empty string after the final CRLF
  expect(lines.length).toBe(1 + 151 + 1);
  expect(lines[1]).toBe('NOTE0000,Note,No,10-Year,,10/15/2036,10/08/2026,10/15/2026,4.100%,,,');
});

test('Historical export follows the column chooser and the typed filters', async ({ page }) => {
  await openApp(page);
  await page.locator('.view-btn[data-view="tips"]').click();
  await page.locator('#mainThead tr:first-child th[data-field="issue_date"]').hover();
  await page.locator('#mainThead tr:first-child th[data-field="issue_date"] .col-delete').click();
  const { name, lines } = await exportCsv(page);
  expect(name).toMatch(/^auctions-historical-tips-/);
  expect(lines[0].split(',')).not.toContain('Issue Date');
  expect(lines.length).toBe(1 + 1 + 1);
  expect(lines[1].startsWith('TIPSCUS1,')).toBe(true);

  await page.locator('.view-btn[data-view="all"]').click();
  await page.locator('#mainThead .filter-input[data-field="cusip"]').fill('NOTE0007');
  await expect(page.locator('#mainTbody tr')).toHaveCount(1);
  const filtered = await exportCsv(page);
  expect(filtered.lines.length).toBe(1 + 1 + 1);
  expect(filtered.lines[1].startsWith('NOTE0007,')).toBe(true);
});

test('Historical export quotes an amount with thousands separators', async ({ page }) => {
  await openApp(page);
  await page.locator('#col_offering_amt').check();
  const { lines } = await exportCsv(page);
  const cols = lines[0].split(',');
  expect(cols).toContain('Offering Amt');
  expect(lines[1]).toContain('"58,000,000,000"');
});

test('Upcoming export writes all eight columns of the table', async ({ page }) => {
  await openApp(page);
  await page.locator('.tab-btn[data-tab="upcoming"]').click();
  const { name, lines } = await exportCsv(page);
  expect(name).toMatch(new RegExp(`^auctions-upcoming-${TODAY.source}\.csv$`));
  expect(lines[0]).toBe('CUSIP,Announced,Auction Date,Issue Date,Term,Type,Reopen,TIPS');
  expect(lines[1]).toBe('TIPSCUS1,10/01/2026,10/22/2026,10/31/2026,9-Year 10-Month,Note,Yes,Yes');
  expect(lines[2]).toBe('NOTECUS9,11/05/2026,11/12/2026,11/16/2026,3-Year,Note,No,No');
  expect(lines.length).toBe(1 + 2 + 1);
});

test('Tentative export writes the filtered rows without FRNs', async ({ page }) => {
  await openApp(page);
  await page.locator('.tab-btn[data-tab="tentative"]').click();
  const all = await exportCsv(page);
  expect(all.name).toMatch(new RegExp(`^auctions-tentative-${TODAY.source}\.csv$`));
  expect(all.lines[0]).toBe('Auction Date,Term,Type,Reopen,TIPS,Announcement Date,Settlement Date');
  expect(all.lines.length).toBe(1 + 2 + 1);
  expect(all.lines[1]).toBe('10/13/2026,3-Year,Note,No,No,10/06/2026,10/15/2026');

  await page.locator('#tentative-thead .filter-input[data-field="security_term"]').fill('10-year');
  await expect(page.locator('#tentative-tbody tr')).toHaveCount(1);
  const filtered = await exportCsv(page);
  expect(filtered.lines.length).toBe(1 + 1 + 1);
  expect(filtered.lines[1]).toBe('10/20/2026,10-Year,Note,Yes,Yes,10/13/2026,10/31/2026');
});
