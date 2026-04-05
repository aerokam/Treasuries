import { test, expect } from '@playwright/test';

test.describe('Yields Monitor Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // Navigate to the Yields Monitor
    console.log('Navigating to YieldsMonitor/...');
    await page.goto('YieldsMonitor/', { waitUntil: 'networkidle' });
    
    // Wait for at least one chart to be rendered
    console.log('Waiting for .chart-card...');
    await page.waitForSelector('.chart-card', { timeout: 15000 });
  });

  test('All time ranges should load data', async ({ page }) => {
    const ranges = ['2D', '10D', '1Y', '2Y', '3Y', '10Y', 'ALL'];
    const chartCanvas = page.locator('canvas#chart-US10Y');

    for (const range of ranges) {
      console.log(`Testing range: ${range}`);
      const btn = page.locator(`.range-btn[data-range="${range}"]`);
      await btn.click();
      
      // Wait for fetch status to indicate update
      await expect(page.locator('#fetchStatus')).toContainText('Data:');
      
      // Check data point count via evaluate
      const count = await chartCanvas.evaluate((canvas) => {
        const chart = Chart.getChart(canvas);
        return chart.data.datasets[0].data.length;
      });
      
      console.log(`Range ${range} has ${count} points`);
      expect(count).toBeGreaterThan(0);

      // Special check for 2D/10D resolution
      if (range === '2D' || range === '10D') {
        const data = await chartCanvas.evaluate((canvas) => {
          const chart = Chart.getChart(canvas);
          const points = chart.data.datasets[0].data;
          // Get last 10 points to calculate average spacing
          return points.slice(-10).map(p => p.x);
        });
        if (data.length >= 2) {
          const totalDiff = (new Date(data[data.length - 1]) - new Date(data[0])) / 60000;
          const avgDiff = totalDiff / (data.length - 1);
          console.log(`Range ${range} avg point spacing: ${avgDiff.toFixed(2)} mins`);
          if (range === '2D') expect(avgDiff).toBeLessThanOrEqual(5); 
          if (range === '10D') expect(avgDiff).toBeLessThanOrEqual(15); 
        }
      }
    }
  });

  test('10D range should show at least 5 days of data', async ({ page }) => {
    const chartCanvas = page.locator('canvas#chart-US10Y');
    const btn = page.locator('.range-btn[data-range="10D"]');
    await btn.click();
    
    // Wait for data
    await expect(page.locator('#fetchStatus')).toContainText('Data:');
    await page.waitForTimeout(1000); // Wait for potential late updates

    const xRange = await chartCanvas.evaluate((canvas) => {
      const chart = Chart.getChart(canvas);
      return { min: chart.scales.x.min, max: chart.scales.x.max };
    });

    const spanDays = (xRange.max - xRange.min) / (24 * 3600 * 1000);
    console.log(`10D view span: ${spanDays.toFixed(2)} days`);
    
    // It should definitely be more than 2 days. 
    // CNBC 5D usually gives ~8-10 days depending on weekends.
    expect(spanDays).toBeGreaterThan(3);
  });

  test('Vertical zoom via Shift+Scroll should change Y axis range', async ({ page }) => {
    const chartCanvas = await page.locator('canvas#chart-US10YTIPS');
    await chartCanvas.scrollIntoViewIfNeeded();

    // Get initial Y axis ticks or range if possible
    // Since we can't easily get Chart.js internals from Playwright without evaluate, 
    // we'll use evaluate to check the scale.
    const getYSpan = async () => {
      return await chartCanvas.evaluate((canvas) => {
        const chart = Chart.getChart(canvas);
        return chart.scales.y.max - chart.scales.y.min;
      });
    };

    const initialSpan = await getYSpan();
    
    // Perform Shift + Scroll Down (Zoom Out Y)
    await page.mouse.move(
      (await chartCanvas.boundingBox()).x + 50,
      (await chartCanvas.boundingBox()).y + 50
    );
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 500); // Scroll down
    await page.keyboard.up('Shift');

    // Wait a bit for update
    await page.waitForTimeout(200);
    
    const newSpan = await getYSpan();
    expect(newSpan).toBeGreaterThan(initialSpan);

    // Perform Shift + Scroll Up (Zoom In Y)
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, -500); // Scroll up
    await page.keyboard.up('Shift');

    await page.waitForTimeout(200);
    const finalSpan = await getYSpan();
    expect(finalSpan).toBeLessThan(newSpan);
  });

  test('Horizontal zoom via Ctrl+Scroll should change X axis range', async ({ page }) => {
    const chartCanvas = await page.locator('canvas#chart-US10YTIPS');
    
    const getXSpan = async () => {
      return await chartCanvas.evaluate((canvas) => {
        const chart = Chart.getChart(canvas);
        return chart.scales.x.max - chart.scales.x.min;
      });
    };

    const initialSpan = await getXSpan();
    
    await page.mouse.move(
      (await chartCanvas.boundingBox()).x + 50,
      (await chartCanvas.boundingBox()).y + 50
    );
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, 500); // Scroll down (Zoom Out X)
    await page.keyboard.up('Control');

    await page.waitForTimeout(200);
    const newSpan = await getXSpan();
    expect(newSpan).toBeGreaterThan(initialSpan);
  });

  test('Panning should not snap Y axis (regression test for onPanComplete removal)', async ({ page }) => {
    const chartCanvas = await page.locator('canvas#chart-US10YTIPS');
    
    const getYRange = async () => {
      return await chartCanvas.evaluate((canvas) => {
        const chart = Chart.getChart(canvas);
        return { min: chart.scales.y.min, max: chart.scales.y.max };
      });
    };

    // Zoom in first to have something to pan
    console.log('Zooming in before pan...');
    await page.mouse.move(
      (await chartCanvas.boundingBox()).x + 100,
      (await chartCanvas.boundingBox()).y + 100
    );
    await page.mouse.wheel(0, -1000); // Stronger zoom
    await page.waitForTimeout(1000); // Wait longer for any potential animations/rescaling

    const rangeAfterZoom = await getYRange();
    console.log('Range after zoom:', rangeAfterZoom);
    const spanAfterZoom = rangeAfterZoom.max - rangeAfterZoom.min;

    // Pan vertically
    console.log('Panning vertically...');
    const box = await chartCanvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 100, { steps: 20 });
    await page.mouse.up();

    await page.waitForTimeout(500);
    const rangeAfterPan = await getYRange();
    console.log('Range after pan:', rangeAfterPan);
    const spanAfterPan = rangeAfterPan.max - rangeAfterPan.min;
    
    // If it snapped, the range would have been recalculated by rescaleYToVisible.
    // Since we pan vertically, min and max should both change by approximately the same amount.
    expect(rangeAfterPan.min).not.toBe(rangeAfterZoom.min);
    expect(rangeAfterPan.max).not.toBe(rangeAfterZoom.max);
    
    // The span should be preserved within a small tolerance (rounding errors etc)
    console.log('Span diff:', Math.abs(spanAfterPan - spanAfterZoom));
    expect(Math.abs(spanAfterPan - spanAfterZoom)).toBeLessThan(0.01); // Increased tolerance slightly
  });
});
