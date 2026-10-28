import { test, expect } from '@playwright/test';

// Every fetch the page makes is mocked: Auctions.csv and the Tentative schedule XML (R2), and the
// upcoming_auctions_v2 feed (FiscalData).

const AUCTIONS_CSV = [
  'cusip,security_type,security_term,comp_auction_close_date,issue_date,maturity_date,inflation_protected,high_yield',
  'HIST0001,Note,10-Year,2026-10-08,2026-10-15,2036-10-15,No,4.100',
  'HIST0002,Note,5-Year,2026-10-15,2026-10-20,2031-10-20,No,3.900',
  'HIST0003,Note,2-Year,2026-10-15,2026-10-20,2028-10-20,No,3.700',
  'HIST0004,Note,7-Year,2026-10-22,2026-10-31,2033-10-31,No,4.000',
  'TIPSCUS1,Note,10-Year,2026-07-16,2026-07-31,2036-07-15,Yes,1.900',
].join('\n') + '\n';

const UPCOMING_HEADER = 'cusip,announcemt_date,comp_auction_close_date,issue_date,security_term,security_type,reopening';
const UPCOMING_CSV = [
  UPCOMING_HEADER,
  // TIPS reopening: term differs from the Tentative schedule, CUSIP is that of a TIPS in Auctions.csv
  'TIPSCUS1,2026-10-01,2026-10-22,2026-10-31,9-Year 10-Month,Note,Yes',
  // Note with an unknown CUSIP; the Tentative schedule row for this date and term is not TIPS
  'NOTECUS9,2026-11-05,2026-11-12,2026-11-16,3-Year,Note,No',
  // Matches only the Tentative schedule (same date and term, TIPS = Y)
  'NEWCUS03,2026-10-08,2026-10-22,2026-10-31,10-Year,Note,No',
  // Empty CUSIP, nothing in the Tentative schedule
  ',2026-11-20,2026-12-01,2026-12-15,5-Year,Note,No',
].join('\n') + '\n';

function tentRow(term, type, reopen, tips, frn, announce, auction, settle) {
  return `<AuctionCalendarDate><SecurityTermWeekYear>${term}</SecurityTermWeekYear><SecurityType>${type}</SecurityType>` +
    `<ReOpeningIndicator>${reopen}</ReOpeningIndicator><TIPS>${tips}</TIPS><FloatingRate>${frn}</FloatingRate>` +
    `<AnnouncementDate>${announce}</AnnouncementDate><AuctionDate>${auction}</AuctionDate><SettlementDate>${settle}</SettlementDate></AuctionCalendarDate>`;
}
const TENT_XML = '<?xml version="1.0"?><AuctionCalendar>' + [
  tentRow('3-Year', 'Note', 'N', 'N', 'N', '2026-10-06', '2026-10-13', '2026-10-15'),
  tentRow('5-Year', 'Note', 'N', 'N', 'N', '2026-10-13', '2026-10-20', '2026-10-31'),
  tentRow('10-Year', 'Note', 'Y', 'Y', 'N', '2026-10-13', '2026-10-20', '2026-10-31'),
  tentRow('10-Year', 'Note', 'Y', 'Y', 'N', '2026-10-15', '2026-10-22', '2026-10-31'),
  tentRow('3-Year', 'Note', 'N', 'N', 'N', '2026-11-05', '2026-11-12', '2026-11-16'),
  tentRow('2-Year', 'FRN', 'N', 'N', 'Y', '2026-10-20', '2026-10-27', '2026-10-31'),
  tentRow('7-Year', 'Note', 'N', 'N', 'N', '2026-10-20', '2026-10-27', '2026-10-31'),
].join('') + '</AuctionCalendar>';

async function mockFeeds(page, { auctions = AUCTIONS_CSV, upcoming = UPCOMING_CSV, xml = TENT_XML } = {}) {
  await page.route('**/Auctions.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: auctions }));
  await page.route('**/upcoming_auctions**', route => route.fulfill({ status: 200, contentType: 'text/csv', body: upcoming }));
  await page.route('**/Tentative-Auction-Schedule.xml', route => route.fulfill({ status: 200, contentType: 'application/xml', body: xml }));
}

async function openApp(page, feeds) {
  await mockFeeds(page, feeds);
  await page.goto('/TreasuryAuctions/');
  await expect(page.locator('#status')).toContainText('Updated:');
}

const rowTexts = (page, tbody) => page.locator(`${tbody} tr`).evaluateAll(trs => trs.map(tr => [...tr.cells].map(c => c.textContent)));

test.describe('Tentative Schedule date filters', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await page.locator('.tab-btn[data-tab="tentative"]').click();
    await expect(page.locator('#tentative-tbody tr')).toHaveCount(6);
  });

  test('Tentative dates display as mm/dd/yyyy and the count stays blank', async ({ page }) => {
    const rows = await rowTexts(page, '#tentative-tbody');
    // Columns: Auction Date, Term, Type, Reopen, TIPS, Announcement Date, Settlement Date
    expect(rows[0]).toEqual(['10/13/2026', '3-Year', 'Note', 'No', 'No', '10/06/2026', '10/15/2026']);
    for (const row of rows) {
      for (const i of [0, 5, 6]) expect(row[i]).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    }
    await expect(page.locator('#row-count')).toHaveText('');
  });

  test('typing 10202026 in the Auction Date filter leaves only the rows of 10/20/2026', async ({ page }) => {
    const input = page.locator('#tentative-thead .filter-input[data-field="auction_date"]');
    await input.fill('10202026');
    await expect(input).toHaveValue('10/20/2026');
    await expect(page.locator('#tentative-tbody tr')).toHaveCount(2);
    const rows = await rowTexts(page, '#tentative-tbody');
    expect(rows.map(r => r[0])).toEqual(['10/20/2026', '10/20/2026']);
  });

  test('a range filter on the Auction Date leaves only the later rows', async ({ page }) => {
    const input = page.locator('#tentative-thead .filter-input[data-field="auction_date"]');
    await input.fill('>10/20/2026');
    await expect(input).toHaveValue('>10/20/2026');
    await expect(page.locator('#tentative-tbody tr')).toHaveCount(3);
    const rows = await rowTexts(page, '#tentative-tbody');
    expect(rows.map(r => r[0])).toEqual(['10/22/2026', '10/27/2026', '11/12/2026']);
  });

  test('a range filter works on the Settlement Date and combines with a text filter', async ({ page }) => {
    await page.locator('#tentative-thead .filter-input[data-field="settlement_date"]').fill('<=10/15/2026');
    await expect(page.locator('#tentative-tbody tr')).toHaveCount(1);
    await page.locator('#tentative-thead .filter-input[data-field="settlement_date"]').fill('');
    await page.locator('#tentative-thead .filter-input[data-field="security_term"]').fill('10-year');
    await expect(page.locator('#tentative-tbody tr')).toHaveCount(2);
  });

  test('sorting the Auction Date column orders by the underlying date', async ({ page }) => {
    const th = page.locator('#tentative-thead th[data-field="auction_date"]');
    await th.click(); // ascending
    await th.click(); // descending
    const rows = await rowTexts(page, '#tentative-tbody');
    expect(rows.map(r => r[0])).toEqual(['11/12/2026', '10/27/2026', '10/22/2026', '10/20/2026', '10/20/2026', '10/13/2026']);
  });
});

test.describe('Upcoming Auctions TIPS flag', () => {
  test('flags a TIPS reopening by CUSIP, a Tentative schedule match, and leaves other rows No', async ({ page }) => {
    await openApp(page);
    await page.locator('.tab-btn[data-tab="upcoming"]').click();
    const headers = await page.locator('#upcoming-thead th').allTextContents();
    const tipsCol = headers.findIndex(h => h.trim() === 'TIPS');
    expect(tipsCol).toBeGreaterThanOrEqual(0);
    const rows = await rowTexts(page, '#upcoming-tbody');
    const tipsOf = cusip => {
      const matches = rows.filter(r => r[0] === cusip);
      expect(matches).toHaveLength(1);
      return matches[0][tipsCol];
    };
    // Reopening: term "9-Year 10-Month" is not in the Tentative schedule; the CUSIP is a TIPS in Auctions.csv
    expect(tipsOf('TIPSCUS1')).toBe('Yes');
    // Unknown CUSIP, Tentative row for this date and term is not TIPS
    expect(tipsOf('NOTECUS9')).toBe('No');
    // Unknown CUSIP, same date and term as a Tentative row with TIPS = Y
    expect(tipsOf('NEWCUS03')).toBe('Yes');
    // Empty CUSIP matches nothing
    expect(rows.filter(r => r[0] === '').map(r => r[tipsCol])).toEqual(['No']);
  });
});

test.describe('Historical date filter', () => {
  test('typing a date or a range operator and a date filters the Issue Date', async ({ page }) => {
    await openApp(page);
    const input = page.locator('#mainThead .filter-input[data-field="issue_date"]');
    await expect(page.locator('#mainTbody tr')).toHaveCount(5);

    await input.fill('10202026');
    await expect(input).toHaveValue('10/20/2026');
    await expect(page.locator('#mainTbody tr')).toHaveCount(2);

    await input.fill('>10/20/2026');
    await expect(page.locator('#mainTbody tr')).toHaveCount(1);
    await expect(page.locator('#mainTbody tr').first()).toContainText('HIST0004');

    await input.fill('<=10/15/2026');
    await expect(page.locator('#mainTbody tr')).toHaveCount(2);
  });
});

test.describe('#row-count belongs to the active tab', () => {
  test('Refresh while the Upcoming tab is active shows the upcoming count', async ({ page }) => {
    await openApp(page);
    await page.locator('.tab-btn[data-tab="upcoming"]').click();
    await expect(page.locator('#row-count')).toHaveText('4 upcoming auctions');

    await page.locator('#refreshBtn').click();
    await expect(page.locator('#status')).toContainText('Updated:');
    await expect(page.locator('#row-count')).toHaveText('4 upcoming auctions');
  });

  test('Refresh while the Tentative tab is active leaves the count blank', async ({ page }) => {
    await openApp(page);
    await page.locator('.tab-btn[data-tab="tentative"]').click();
    await expect(page.locator('#row-count')).toHaveText('');

    await page.locator('#refreshBtn').click();
    await expect(page.locator('#status')).toContainText('Updated:');
    await expect(page.locator('#row-count')).toHaveText('');
  });

  test('an upcoming feed with no rows shows 0 upcoming auctions', async ({ page }) => {
    await openApp(page, { upcoming: UPCOMING_HEADER + '\n' });
    await page.locator('.tab-btn[data-tab="upcoming"]').click();
    await expect(page.locator('#upcoming-tbody')).toContainText('No upcoming auctions found.');
    await expect(page.locator('#row-count')).toHaveText('0 upcoming auctions');
  });
});
