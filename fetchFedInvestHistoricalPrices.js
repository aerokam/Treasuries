/**
 * Script to check TreasuryDirect FedInvest Historical Prices.
 * Monitors for the appearance of non-zero end-of-day prices.
 * POSTs to securityPriceDetail with a date, requests CSV format.
 * Writes data/eod-status.html for upload to R2.
 */

const fs  = require('fs');
const URL = 'https://www.treasurydirect.gov/GA-FI/FedInvest/securityPriceDetail';

function mostRecentWeekday() {
    const etStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const [y, m, d] = etStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    if (day === 0) date.setDate(date.getDate() - 2);
    if (day === 6) date.setDate(date.getDate() - 1);
    return date;
}

async function fetchHistoricalPrices() {
    const date  = mostRecentWeekday();
    const day   = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year  = String(date.getFullYear());

    console.log(`Checking Historical Prices for ${year}-${month}-${day} at ${new Date().toLocaleTimeString()}...`);

    const body = new URLSearchParams({
        priceDateDay: day, priceDateMonth: month, priceDateYear: year,
        fileType: 'csv', csv: 'CSV FORMAT'
    });

    const res = await fetch(URL, { method: 'POST', body });
    if (!res.ok) throw new Error(`FedInvest HTTP ${res.status}`);
    const text = await res.text();

    const lines = text.trim().split('\n').filter(l => l.trim());
    const checkedAt = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }) + ' ET';

    if (lines.length < 2) {
        console.log('Could not find data rows. The site might be down or format changed.');
        writeHtml(year, month, day, checkedAt, [], false, 'No data rows returned');
        return;
    }

    const HEADERS = ['CUSIP', 'Type', 'Coupon', 'Maturity', 'col5', 'Buy', 'Sell', 'EOD'];
    const dataRows = lines.slice(0, 5);
    let dataFound = false;

    const parsed = dataRows.map(line => line.split(',').map(s => s.trim()));
    const colWidths = HEADERS.map((h, i) => Math.max(h.length, ...parsed.map(r => (r[i] || '').length)));
    const fmt = row => row.map((v, i) => (v || '').padEnd(colWidths[i])).join('  ');

    console.log('--- First 5 Data Rows ---');
    console.log(fmt(HEADERS));
    console.log(colWidths.map(w => '-'.repeat(w)).join('  '));
    parsed.forEach(cells => {
        console.log(fmt(cells));
        const eod = parseFloat(cells[7]);
        if (!isNaN(eod) && eod !== 0) dataFound = true;
    });

    console.log('------------------------');
    console.log(dataFound
        ? 'STATUS: Non-zero end-of-day prices DETECTED.'
        : 'STATUS: Only zeros or no data found in the EOD price column.');

    writeHtml(year, month, day, checkedAt, parsed, dataFound, null);
}

function writeHtml(year, month, day, checkedAt, parsed, dataFound, errorMsg) {
    const status = errorMsg ? errorMsg : (dataFound ? 'DETECTED' : 'zeros / no data');
    const color  = dataFound ? '#6f6' : (errorMsg ? '#f88' : '#fa0');

    const rows = parsed.map(c =>
        `<tr><td>${c[0]}</td><td>${c[1]}</td><td>${c[2]}</td><td>${c[3]}</td>` +
        `<td>${c[5]}</td><td>${c[6]}</td>` +
        `<td style="color:${parseFloat(c[7]) > 0 ? '#6f6' : '#ddd'}">${c[7]}</td></tr>`
    ).join('\n');

    const tableHtml = parsed.length > 0
        ? `<table><thead><tr><th>CUSIP</th><th>Type</th><th>Coupon</th><th>Maturity</th><th>Buy</th><th>Sell</th><th>EOD</th></tr></thead><tbody>${rows}</tbody></table>`
        : '';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="300">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EOD Price Monitor</title>
<style>
body{font-family:monospace;background:#111;color:#ddd;padding:1.5rem}
h1{color:#fff;font-size:1.2rem}
.status{font-size:2rem;font-weight:bold;color:${color};margin:1rem 0}
table{border-collapse:collapse;margin-top:1rem;font-size:.9rem}
th,td{text-align:left;padding:.3rem 1rem .3rem 0;border-bottom:1px solid #333}
th{color:#aaa}
.note{color:#555;font-size:.8rem;margin-top:1.5rem}
</style></head><body>
<h1>FedInvest EOD Price Monitor</h1>
<div>Date checked: ${year}-${month}-${day}</div>
<div class="status">EOD: ${status}</div>
${tableHtml}
<p class="note">Checked: ${checkedAt} — auto-refreshes every 5 min</p>
</body></html>`;

    fs.writeFileSync('data/eod-status.html', html);
    console.log('Wrote data/eod-status.html');
}

fetchHistoricalPrices().catch(err => { console.error('Error:', err.message); process.exit(1); });
