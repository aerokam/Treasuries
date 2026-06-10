// dumpFeed.js — investigation tool (not part of the pipeline).
// Dumps a raw CNBC intraday feed to a local JSON file with ET-annotated times,
// so we can study cadence and close-window behavior offline.
//
// Usage:  node scripts/dumpFeed.js US5YTIPS 1D
//         node scripts/dumpFeed.js US5YTIPS 5D
// Output: data/intraday-samples/{symbol}_{range}_{fetchedAtET}.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../data/intraday-samples');

const ET_FMT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});

function parseT(s) {
  const y = +s.slice(0, 4), mo = +s.slice(4, 6) - 1, d = +s.slice(6, 8);
  const h = +s.slice(8, 10) || 0, mi = +s.slice(10, 12) || 0, se = +s.slice(12, 14) || 0;
  let dt = new Date(Date.UTC(y, mo, d, h, mi, se));
  for (let i = 0; i < 2; i++) {
    const p = ET_FMT.formatToParts(dt).reduce((a, x) => ({ ...a, [x.type]: x.value }), {});
    const diff = Date.UTC(y, mo, d, h, mi, se) - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    if (diff === 0) break;
    dt = new Date(dt.getTime() + diff);
  }
  return dt;
}

function buildUrl(symbol, timeRange) {
  const params = {
    operationName: 'getQuoteChartData',
    variables: JSON.stringify({ symbol, timeRange }),
    extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: '9e1670c29a10707c417a1efd327d4b2b1d456b77f1426e7e84fb7d399416bb6b' } })
  };
  return 'https://webql-redesign.cnbcfm.com/graphql?' + Object.entries(params).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
}

async function main() {
  const symbol = process.argv[2] || 'US5YTIPS';
  const range = process.argv[3] || '1D';
  const res = await fetch(buildUrl(symbol, range));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const bars = (json?.data?.chartData?.priceBars || []).map(b => ({
    raw: b.tradeTime,
    et: ET_FMT.format(parseT(b.tradeTime)),
    close: b.close
  }));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stamp = ET_FMT.format(new Date()).replace(/[/:, ]/g, '').slice(0, 14);
  const file = path.join(OUT_DIR, `${symbol}_${range}_${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify({
    symbol, range,
    fetchedAtET: ET_FMT.format(new Date()),
    barCount: bars.length,
    firstBarET: bars[0]?.et, lastBarET: bars[bars.length - 1]?.et,
    bars
  }, null, 2));
  console.log(`Wrote ${bars.length} bars -> ${path.relative(process.cwd(), file)}`);
  console.log(`  span: ${bars[0]?.et}  ->  ${bars[bars.length - 1]?.et} ET`);
}

main().catch(e => { console.error(e); process.exit(1); });
