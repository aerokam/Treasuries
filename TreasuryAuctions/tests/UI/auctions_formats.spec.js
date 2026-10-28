import { test, expect } from '@playwright/test';

// Every fetch the page makes is mocked: Auctions.csv and the Tentative schedule XML (R2), and the
// upcoming_auctions_v2 feed (FiscalData).

const COLUMNS = [
  'cusip', 'security_type', 'inflation_protected', 'security_term', 'comp_auction_close_date', 'investment_rate',
  'accrued_int', 'accrued_int_per_amount', 'grand_total_par_awarded', 'max_recog_single_rate_bid',
  'allotted_pctage_high_rate', 'price_per_amt', 'low_rate_threshold', 'comp_rate_bid_increments', 'med_rate', 'ref_cpi_on_orig_dated_date',
];
const AUCTIONS_CSV = [
  COLUMNS.join(','),
  'C1,Bill,No,13-Week,2026-10-19,4.195,0.5,1000,101701941200,8750000000,15.670000,100,5,0.005,4.1,334.39761',
].join('\n') + '\n';

test('values format by the rules for the names of the columns of treasury_securities_auctions_v2', async ({ page }) => {
  await page.route('**/Auctions.csv', route => route.fulfill({ status: 200, contentType: 'text/csv', body: AUCTIONS_CSV }));
  await page.route('**/upcoming_auctions**', route => route.fulfill({ status: 200, contentType: 'text/csv', body: 'cusip,announcemt_date,comp_auction_close_date,issue_date,security_term,security_type,reopening\n' }));
  await page.route('**/Tentative-Auction-Schedule.xml', route => route.fulfill({ status: 200, contentType: 'application/xml', body: '<?xml version="1.0"?><AuctionCalendar></AuctionCalendar>' }));
  await page.goto('/TreasuryAuctions/');
  await expect(page.locator('#status')).toContainText('Updated:');

  for (const f of COLUMNS) await page.locator(`#col_${f}`).check();
  const shown = async f => (await page.locator(`#mainTbody td[data-field="${f}"]`).first().textContent());

  expect(await shown('investment_rate')).toBe('4.195%');
  expect(await shown('med_rate')).toBe('4.100%');
  expect(await shown('accrued_int')).toBe('0.500000');
  expect(await shown('ref_cpi_on_orig_dated_date')).toBe('334.39761');
  expect(await shown('comp_auction_close_date')).toBe('10/19/2026');
  // amounts, including the face amounts and the largest bid, read as amounts and not as rates or prices
  expect(await shown('accrued_int_per_amount')).toBe('1,000');
  expect(await shown('price_per_amt')).toBe('100');
  expect(await shown('grand_total_par_awarded')).toBe('101,701,941,200');
  expect(await shown('max_recog_single_rate_bid')).toBe('8,750,000,000');
  // percentages of allotment, thresholds and bid increments show as stored
  expect(await shown('allotted_pctage_high_rate')).toBe('15.670000');
  expect(await shown('low_rate_threshold')).toBe('5');
  expect(await shown('comp_rate_bid_increments')).toBe('0.005');
});
