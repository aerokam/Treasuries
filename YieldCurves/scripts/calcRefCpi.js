import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
import { uploadToR2 } from './r2.js';
// Single canonical home for the 31 CFR App. B interpolation (no-redundancy directive).
import { refCpiFromMonthly, monthlyCpiMap } from '../../shared/src/ref-cpi.js';

const OBJECT_KEY = "TIPS/RefCpiNsaSa.csv";
const CPI_CSV_URL = "https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/bls/CPI.csv";

async function calcAndUploadRefCpi() {
  console.log(`Fetching CPI data from ${CPI_CSV_URL}...`);
  const res = await fetch(CPI_CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch CPI data: ${res.status}`);
  const csv = await res.text();

  const cpiData = {};
  const lines = csv.trim().split("\n");
  lines.slice(1).forEach(line => {
    const [year, period, periodName, NSA, SA] = line.split(",");
    if (!period.startsWith("M")) return;
    cpiData[`${year}-${period}`] = { year, period, NSA, SA };
  });

  // --- Build monthly NSA/SA maps for the shared App. B interpolation ---
  // Shape expected by monthlyCpiMap: [{ year, period:'M01'..'M12', value }]
  const cpiList = Object.values(cpiData).filter(r => r.period && r.period.startsWith("M"));
  const monthlyNsa = monthlyCpiMap(cpiList.map(r => ({ year: r.year, period: r.period, value: parseFloat(r.NSA) })));
  const monthlySa  = monthlyCpiMap(cpiList.map(r => ({ year: r.year, period: r.period, value: parseFloat(r.SA)  })));

  const monthKeys = Object.keys(monthlyNsa).map(k => k.split("-").map(Number))
    .sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
  if (monthKeys.length === 0) throw new Error("No CPI data found");

  const [fy, fm] = monthKeys[0];
  const [ly, lm] = monthKeys[monthKeys.length - 1];

  // Output month range: earliest = firstCpiMonth + 3 (needs CPI(M-3)=firstCpiMonth)
  //                     latest   = lastCpiMonth  + 3 (day 1 needs CPI(M-3); days 2+ skipped if CPI(M-2) missing)
  let startYr = fy, startMo = fm + 3;
  while (startMo > 12) { startMo -= 12; startYr++; }

  let endYr = ly, endMo = lm + 3;
  while (endMo > 12) { endMo -= 12; endYr++; }

  const daysInMo = (yr, mo) => new Date(yr, mo, 0).getDate();
  const rows = [];
  let yr = startYr, mo = startMo;

  while (yr < endYr || (yr === endYr && mo <= endMo)) {
    const D = daysInMo(yr, mo);
    for (let d = 1; d <= D; d++) {
      const dateStr = `${yr}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const nsa = refCpiFromMonthly(dateStr, monthlyNsa);
      if (nsa == null) break;  // month-1 value missing (d=1) or next-month value missing (d>1)
      const sa = refCpiFromMonthly(dateStr, monthlySa);
      rows.push([dateStr, nsa.toFixed(5), sa.toFixed(5), (nsa / sa).toFixed(5)]);
    }
    if (++mo > 12) { mo = 1; yr++; }
  }

  // Sort descending (newest first)
  rows.sort((a, b) => b[0].localeCompare(a[0]));

  const outputCsv = [
    ["Ref CPI Date", "Ref CPI NSA", "Ref CPI SA", "SA Factor"].join(","),
    ...rows.map(r => r.join(","))
  ].join("\n");

  await uploadToR2(OBJECT_KEY, outputCsv);
  console.log(`calcAndUploadRefCpi: uploaded ${rows.length} daily rows to ${OBJECT_KEY}`);
}

calcAndUploadRefCpi().catch(err => {
  console.error(err);
  process.exit(1);
});
