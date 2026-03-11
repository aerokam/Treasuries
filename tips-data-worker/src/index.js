/**
 * Cloudflare Worker: TIPS Data Jobs
 *
 * Replaces three GitHub Actions workflows:
 *   fetchTipsRef.js  → cron "0 14 * * 1"      (Mon 10am ET) → R2: TipsRef.csv
 *   fetchRefCpi.js   → cron "0 15 12 * *"      (12th/month)  → R2: RefCPI.csv
 *   getTipsYields.js → cron "0,5 17,18 * * 1-5" (1pm ET)     → R2: TipsYields.csv
 *
 * HTTP GET on the worker URL returns a status page showing last-updated times.
 */

const TIPS_REF_CRON   = '0 14 * * 1';
const REF_CPI_CRON    = '0 15 12 * *';

// ─── Entry point ─────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const run = new URL(request.url).searchParams.get('run');
    if (run === 'tipsref')  { try { await runTipsRef(env);    return new Response('TipsRef done');    } catch(e) { return new Response('TipsRef ERROR: ' + e.message, {status:500}); } }
    if (run === 'refcpi')   { try { await runRefCpi(env);     return new Response('RefCPI done');     } catch(e) { return new Response('RefCPI ERROR: ' + e.message,  {status:500}); } }
    if (run === 'yields')   { try { await runTipsYields(env); return new Response('TipsYields done'); } catch(e) { return new Response('Yields ERROR: ' + e.message,  {status:500}); } }

    const [ref, cpi, yields] = await Promise.all([
      env.R2.head('TIPS/TipsRef.csv'),
      env.R2.head('TIPS/RefCPI.csv'),
      env.R2.head('TIPS/TipsYields.csv'),
    ]);
    return new Response(renderStatus(ref, cpi, yields), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },

  async scheduled(event, env, ctx) {
    if (event.cron === TIPS_REF_CRON) {
      ctx.waitUntil(runTipsRef(env));
    } else if (event.cron === REF_CPI_CRON) {
      ctx.waitUntil(runRefCpi(env));
    } else {
      ctx.waitUntil(runTipsYields(env));
    }
  },
};

// ─── Job: TipsRef ─────────────────────────────────────────────────────────────

async function runTipsRef(env) {
  const url = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query' +
    '?format=json&sort=maturity_date' +
    '&filter=inflation_index_security:eq:Yes,reopening:eq:No' +
    '&fields=cusip,ref_cpi_on_dated_date,dated_date,maturity_date,security_term,int_rate' +
    '&page[number]=1&page[size]=150';

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TipsRef HTTP ${res.status}`);
  const json = await res.json();

  const header = 'cusip,maturity,datedDate,coupon,baseCpi,term';
  const lines = json.data.map(r => {
    const coupon = parseFloat(r.int_rate) / 100;
    return `${r.cusip},${r.maturity_date},${r.dated_date},${coupon},${r.ref_cpi_on_dated_date},${r.security_term}`;
  });
  const csv = [header, ...lines].join('\n') + '\n';

  await env.R2.put('TIPS/TipsRef.csv', csv, { httpMetadata: { contentType: 'text/csv' } });
  console.log(`TipsRef: wrote ${lines.length} rows`);
}

// ─── Job: RefCPI ──────────────────────────────────────────────────────────────

async function runRefCpi(env) {
  const CUSIP = '912810FD5';
  const url = 'https://www.treasurydirect.gov/TA_WS/secindex/search' +
    `?cusip=${CUSIP}&format=jsonp&callback=jQuery_CUSIP_FETCHER` +
    `&filterscount=0&groupscount=0` +
    `&sortdatafield=indexDate&sortorder=asc` +
    `&pagenum=0&pagesize=1000&recordstartindex=0&recordendindex=1000` +
    `&_=${Date.now()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`RefCPI HTTP ${res.status}`);
  const text = await res.text();

  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Could not parse RefCPI JSONP response');
  const rows = JSON.parse(match[0]).map(r => ({
    date:   r.indexDate.split('T')[0],
    refCpi: parseFloat(r.refCpi),
  }));

  const header = 'date,refCpi';
  const lines = rows.map(r => `${r.date},${r.refCpi}`);
  const csv = [header, ...lines].join('\n') + '\n';

  await env.R2.put('TIPS/RefCPI.csv', csv, { httpMetadata: { contentType: 'text/csv' } });
  console.log(`RefCPI: wrote ${rows.length} rows`);
}

// ─── Job: TipsYields ──────────────────────────────────────────────────────────

async function runTipsYields(env) {
  // Read TipsRef from R2
  const refObj = await env.R2.get('TIPS/TipsRef.csv');
  if (!refObj) throw new Error('TipsRef.csv not found in R2 — run TipsRef job first');
  const refText = await refObj.text();

  const refRows = refText.trim().split('\n').slice(1).filter(l => l.trim()).map(line => {
    const [cusip, maturity, datedDate, coupon, baseCpi, term] = line.split(',');
    return { cusip, maturity, datedDate, coupon: parseFloat(coupon), baseCpi: parseFloat(baseCpi), term };
  });
  const refMap = new Map(refRows.map(r => [r.cusip, r]));

  // Fetch prices from FedInvest
  const { rows: priceRows, settleDateStr } = await fetchTipsPrices();
  if (priceRows.length === 0) throw new Error('No TIPS price data from FedInvest');

  // Merge and calculate yields
  const rows = [];
  for (const p of priceRows) {
    const ref = refMap.get(p.cusip);
    if (!ref) continue;
    const price = p.sell || p.eod || p.buy || null;
    const yld   = price ? yieldFromPrice(price, ref.coupon, settleDateStr, ref.maturity) : null;
    rows.push({
      settlementDate: settleDateStr,
      cusip:    p.cusip,
      maturity: ref.maturity,
      coupon:   ref.coupon,
      baseCpi:  ref.baseCpi,
      price:    price ?? '',
      yield:    yld != null ? yld.toFixed(8) : '',
    });
  }

  const header = 'settlementDate,cusip,maturity,coupon,baseCpi,price,yield';
  const lines = rows.map(r =>
    `${r.settlementDate},${r.cusip},${r.maturity},${r.coupon},${r.baseCpi},${r.price},${r.yield}`
  );
  const csv = [header, ...lines].join('\n') + '\n';

  await env.R2.put('TIPS/TipsYields.csv', csv, { httpMetadata: { contentType: 'text/csv' } });
  console.log(`TipsYields: wrote ${rows.length} rows, settlement ${settleDateStr}`);
}

// ─── FedInvest fetch (from getTipsYields.js) ──────────────────────────────────

async function fetchTipsPrices() {
  const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
  const FEDINVEST_URL = 'https://www.treasurydirect.gov/GA-FI/FedInvest/todaySecurityPriceDetail';

  const [htmlRes, csvRes] = await Promise.all([
    fetch(FEDINVEST_URL),
    fetch(FEDINVEST_URL, { method: 'POST', body: new URLSearchParams({ fileType: 'csv', csv: 'CSV FORMAT' }) }),
  ]);
  if (!htmlRes.ok) throw new Error(`FedInvest HTML HTTP ${htmlRes.status}`);
  if (!csvRes.ok)  throw new Error(`FedInvest CSV HTTP ${csvRes.status}`);
  const [html, text] = await Promise.all([htmlRes.text(), csvRes.text()]);

  const m = html.match(/Prices For:\s+(\d{4})\s+(\w{3})\s+(\d+)/);
  if (!m) throw new Error('Could not parse settlement date from FedInvest');
  const settleDateStr = new Date(+m[1], months[m[2]], +m[3]).toLocaleDateString('en-CA');

  const rows = text.trim().split('\n')
    .filter(l => /^[A-Z0-9]{9},/.test(l))
    .map(line => {
      const c = line.split(',').map(s => s.trim());
      return { cusip: c[0], type: c[1], coupon: parseFloat(c[2]), maturity: c[3],
               buy: parseFloat(c[5]) || 0, sell: parseFloat(c[6]) || 0, eod: parseFloat(c[7]) || 0 };
    })
    .filter(r => r.type === 'TIPS');

  return { rows, settleDateStr };
}

// ─── Yield from price (from getTipsYields.js) ────────────────────────────────

function localDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function yieldFromPrice(cleanPrice, coupon, settleDateStr, maturityStr) {
  if (!cleanPrice || cleanPrice <= 0) return null;
  const settle = localDate(settleDateStr);
  const mature = localDate(maturityStr);
  if (settle >= mature) return null;

  const semiCoupon = (coupon / 2) * 100;
  const matMon = mature.getMonth() + 1;
  const cm1 = matMon <= 6 ? matMon : matMon - 6;
  const cm2 = cm1 + 6;

  function nextCouponOnOrAfter(d) {
    const candidates = [];
    for (let y = d.getFullYear() - 1; y <= d.getFullYear() + 1; y++) {
      candidates.push(new Date(y, cm1 - 1, 15));
      candidates.push(new Date(y, cm2 - 1, 15));
    }
    candidates.sort((a, b) => a - b);
    return candidates.find(c => c >= d && c <= mature) || null;
  }

  const nextCoupon = nextCouponOnOrAfter(settle);
  if (!nextCoupon) return null;
  const lastCoupon = new Date(nextCoupon.getFullYear(), nextCoupon.getMonth() - 6, 15);

  const days = (a, b) => (b - a) / 86400000;
  const E = days(lastCoupon, nextCoupon);
  const A = days(lastCoupon, settle);
  const DSC = days(settle, nextCoupon);
  const accrued = semiCoupon * (A / E);
  const dirtyPrice = cleanPrice + accrued;
  const w = DSC / E;

  const coupons = [];
  let d = new Date(nextCoupon);
  while (d <= mature) {
    coupons.push(new Date(d));
    d = new Date(d.getFullYear(), d.getMonth() + 6, 15);
  }
  const N = coupons.length;
  if (N === 0) return null;

  function pv(y) {
    const r = y / 2;
    let s = 0;
    for (let k = 0; k < N; k++) {
      const cf = k === N - 1 ? semiCoupon + 100 : semiCoupon;
      s += cf / Math.pow(1 + r, w + k);
    }
    return s;
  }
  function dpv(y) {
    const r = y / 2;
    let s = 0;
    for (let k = 0; k < N; k++) {
      const cf = k === N - 1 ? semiCoupon + 100 : semiCoupon;
      s += (-cf * (w + k)) / (2 * Math.pow(1 + r, w + k + 1));
    }
    return s;
  }

  let y = coupon > 0.005 ? coupon : 0.02;
  for (let i = 0; i < 200; i++) {
    const diff = pv(y) - dirtyPrice;
    if (Math.abs(diff) < 1e-10) break;
    const deriv = dpv(y);
    if (Math.abs(deriv) < 1e-15) break;
    y -= diff / deriv;
  }
  return y;
}

// ─── Status page ─────────────────────────────────────────────────────────────

function renderStatus(ref, cpi, yields) {
  const fmt = obj => obj
    ? new Date(obj.uploaded).toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false }) + ' ET'
    : 'not found';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="300">
<title>TIPS Data Worker</title>
<style>
  body { font-family: monospace; padding: 1rem 2rem; background: #111; color: #ddd; }
  h1 { color: #fff; }
  table { border-collapse: collapse; margin-top: 1rem; }
  th, td { text-align: left; padding: .4rem 1.2rem .4rem 0; border-bottom: 1px solid #333; }
  th { color: #aaa; }
  .ok { color: #6f6; }
  .missing { color: #f88; }
</style>
</head>
<body>
<h1>TIPS Data Worker — R2 Status</h1>
<table>
<thead><tr><th>File</th><th>Last Updated</th><th>Job</th><th>Schedule</th></tr></thead>
<tbody>
<tr><td>TipsRef.csv</td><td class="${ref ? 'ok' : 'missing'}">${fmt(ref)}</td><td>fetchTipsRef</td><td>Mon 10am ET</td></tr>
<tr><td>RefCPI.csv</td><td class="${cpi ? 'ok' : 'missing'}">${fmt(cpi)}</td><td>fetchRefCpi</td><td>12th of month</td></tr>
<tr><td>TipsYields.csv</td><td class="${yields ? 'ok' : 'missing'}">${fmt(yields)}</td><td>getTipsYields</td><td>1pm ET Mon–Fri</td></tr>
</tbody>
</table>
<p style="color:#555;font-size:.85rem;margin-top:1.5rem">Page auto-refreshes every 5 min.</p>
</body>
</html>`;
}
