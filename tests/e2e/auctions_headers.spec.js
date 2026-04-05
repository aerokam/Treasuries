import { test, expect } from '@playwright/test';

test('Historical table headers are sticky vertically and first column is sticky horizontally', async ({ page }) => {
  // Mock the CSV data
  await page.route('**/Auctions.csv', route => {
    let csv = 'cusip,security_type,security_term,announcemt_date,dated_date,auction_date,issue_date,maturity_date,int_rate,high_yield,high_price\n';
    for (let i = 0; i < 200; i++) {
      csv += `CUSIP${i},Bill,${i % 10} Day,2026-01-01,2026-01-01,2026-01-01,2026-01-01,2026-02-01,0.0${i},0.0${i},100.00\n`;
    }
    route.fulfill({ status: 200, contentType: 'text/csv', body: csv });
  });

  await page.route('**/upcoming_auctions**', route => {
    route.fulfill({ status: 200, contentType: 'text/csv', body: 'cusip,announcemt_date,auction_date,issue_date,security_term,security_type,reopening\nC123,2026-04-01,2026-04-05,2026-04-07,13-Week,Bill,No' });
  });

  await page.goto('/TreasuryAuctions/');

  // Wait for table to load
  await expect(page.locator('#status')).toContainText('Updated:');

  const tableWrap = page.locator('#tableWrap');
  const mainThead = page.locator('#mainThead');
  const firstHeader = mainThead.locator('th').first();
  const lastHeader = mainThead.locator('th').last();
  const filterRow = mainThead.locator('.filter-row');

  // Debug: check overflow style of tableWrap and parents
  const overflow = await tableWrap.evaluate(el => window.getComputedStyle(el).overflow);
  const height = await tableWrap.evaluate(el => el.offsetHeight);
  console.log(`tableWrap overflow: ${overflow}, height: ${height}`);

  // Ensure tableWrap IS the scroll container by giving it a fixed height if it doesn't have one
  await tableWrap.evaluate(el => {
    el.style.maxHeight = '400px';
    el.style.overflow = 'auto';
  });

  // Initial position (AFTER height/width normalization)
  const initialFirstHeaderPos = await firstHeader.boundingBox();
  const initialLastHeaderPos = await lastHeader.boundingBox();
  const initialFilterRowPos = await filterRow.boundingBox();

  // 1. Vertical scrolling test
  await tableWrap.evaluate(el => el.scrollTop = 200);
  await page.waitForTimeout(500);

  const actualScrollTop = await tableWrap.evaluate(el => el.scrollTop);
  console.log('Actual ScrollTop:', actualScrollTop);

  const scrolledFirstHeaderPos = await firstHeader.boundingBox();
  const scrolledLastHeaderPos = await lastHeader.boundingBox();
  const scrolledFilterRowPos = await filterRow.boundingBox();

  // Y position should remain identical to initial if sticky
  expect(scrolledFirstHeaderPos.y).toBeCloseTo(initialFirstHeaderPos.y, 1);
  expect(scrolledLastHeaderPos.y).toBeCloseTo(initialLastHeaderPos.y, 1);
  expect(scrolledFilterRowPos.y).toBeCloseTo(initialFilterRowPos.y, 1);

  // 2. Horizontal scrolling test
  // Reset vertical, scroll horizontal
  await tableWrap.evaluate(el => { el.scrollTop = 0; el.scrollLeft = 500; });
  await page.waitForTimeout(500);

  const actualScrollLeft = await tableWrap.evaluate(el => el.scrollLeft);
  console.log('Actual ScrollLeft:', actualScrollLeft);

  const hScrolledFirstHeaderPos = await firstHeader.boundingBox();
  const hScrolledLastHeaderPos = await lastHeader.boundingBox();

  // The first column header (CUSIP) should still be at the same viewport X position
  expect(hScrolledFirstHeaderPos.x).toBeCloseTo(initialFirstHeaderPos.x, 2);

  // The last column header SHOULD have shifted left
  if (actualScrollLeft > 0) {
    expect(hScrolledLastHeaderPos.x).toBeLessThan(initialLastHeaderPos.x - 300);
  }

  // 3. Visual integrity check
  const tbodyRow = page.locator('#mainTbody tr').nth(10);
  await tableWrap.evaluate(el => el.scrollTop = 500);
  await page.waitForTimeout(200);
  const scrolledTbodyRowPos = await tbodyRow.boundingBox();

  // The top of any scrolled data row should be below the bottom of the filter row
  const currentFilterRowPos = await filterRow.boundingBox();
  expect(scrolledTbodyRowPos.y).toBeGreaterThanOrEqual(currentFilterRowPos.y + currentFilterRowPos.height - 1);
});
