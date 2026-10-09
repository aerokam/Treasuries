import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { calculateDuration, termYears, calcMktWtdAvg } from "../shared/src/bond-math.js";
import { parseCsv } from "../shared/src/csv.js";
import { upload } from "../shared/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");

const YIELDS_SA_SAO_URL = "https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/TIPS/YieldsSaSao.csv";
const FIDELITY_URL = "https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev/Treasuries/FidelityTreasuriesTips.csv";

async function fetchCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  return parseCsv(await res.text());
}

function parseDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

async function loadYieldSources() {
  const [tipsRows, fidRows] = await Promise.all([
    fetchCsv(YIELDS_SA_SAO_URL),
    fetchCsv(FIDELITY_URL)
  ]);

  const tipsByCusip = new Map(tipsRows.map(r => [r.cusip, r]));
  // FIDELITY_URL is a combined file (Treasury + TIPS rows); nominals are the non-TIPS rows.
  const nominalByCusip = new Map(
    fidRows.filter(r => (r.Product || "").toLowerCase() !== "tips").map(r => [r.Cusip, r])
  );
  return { tipsByCusip, nominalByCusip };
}

// CUSIP presence in the TIPS SA/SAO file is the source of truth for "is this a
// TIPS holding" — more reliable than the holding name text or a per-fund flag,
// and correctly handles a fund that mixes TIPS and nominal holdings.
function enrichRow(row, settle, { tipsByCusip, nominalByCusip }) {
  const cusip = row.CUSIP;

  // MKTLIQ (Vanguard) and SSC GOVERNMENT MM GVMXX (PIMCO and Schwab share the
  // same State Street sweep vehicle) are cash-sweep vehicles, not bonds — all
  // providers report a placeholder far-future maturity for them. Treat as
  // maturing tomorrow so Term reads as ~overnight instead of a meaningless
  // multi-year figure.
  const isCashSweep = row["Holding Name"] === "MKTLIQ" || row["Holding Name"] === "SSC GOVERNMENT MM GVMXX";
  const maturity = isCashSweep
    ? new Date(settle.getFullYear(), settle.getMonth(), settle.getDate() + 1)
    : row["Maturity Date"] ? parseDate(row["Maturity Date"]) : null;

  const enriched = {
    ...row,
    // Blank out the bogus placeholder date rather than displaying/sorting on it.
    "Maturity Date": isCashSweep ? "" : row["Maturity Date"],
    "Ask Yield": "",
    "SA Yield": "",
    "SAO Yield": "",
    Term: "",
    Duration: ""
  };

  if (maturity && maturity > settle) {
    enriched.Term = termYears(settle, maturity);
  }

  const tips = cusip && tipsByCusip.get(cusip);
  const nominal = cusip && nominalByCusip.get(cusip);

  let askYield = null;
  let coupon = null;

  if (tips) {
    askYield = Number(tips.ask_yield);
    coupon = Number(tips.coupon);
    enriched["Ask Yield"] = askYield;
    enriched["SA Yield"] = Number(tips.sa_yield);
    enriched["SAO Yield"] = Number(tips.sao_yield);
  } else if (nominal) {
    askYield = Number(nominal["Ask yield to maturity"]) / 100;
    coupon = Number(nominal.Coupon) / 100;
    enriched["Ask Yield"] = askYield;
  }

  // Coupon (display, percent-scale, matching the raw fetchers' convention)
  // always comes from the matched S10/S7 row, overwriting whatever the
  // fund's own raw export reported: some providers round it in their export
  // (e.g. BlackRock/ICPI reports "0.13" for TIPS's actual 0.125% coupon).
  // `coupon` above is a true fraction in both branches, so *100 recovers the
  // display value uniformly.
  if (coupon != null) enriched.Coupon = coupon * 100;

  if (maturity && maturity > settle && askYield != null && coupon != null && !Number.isNaN(askYield)) {
    const duration = calculateDuration(settle, maturity, coupon, askYield);
    if (duration != null) enriched.Duration = duration;
  } else if (maturity && maturity > settle && !isCashSweep && !tips && !nominal && /\bbill\b/i.test(row["Holding Name"])) {
    // Zero-coupon Treasury bill the yield source doesn't carry: Macaulay
    // duration of a zero-coupon instrument equals its term (spec 1.0 Enrichment Logic).
    enriched.Duration = enriched.Term;
  }

  return enriched;
}

const WEEKS_PER_YEAR = 365.25 / 7;
const TABLE_COLS = ["CUSIP", "Holding Name", "Maturity Date", "Coupon", "% of Fund", "Market Value", "Ask Yield", "SA Yield", "SAO Yield", "Term", "Duration"];

const num = v => (v === "" || v == null ? null : Number(v));
const clean = n => Number(n.toPrecision(15));
const text = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
const plain = n => (n == null ? "" : clean(n));
const pct = n => (n == null ? "" : `${clean(n)}%`);          // n already percent-scale
const fracPct = n => (n == null ? "" : `${clean(n * 100)}%`);  // n is a fraction

// Provider as-of dates arrive as ISO or MM/DD/YYYY; the file carries ISO.
function isoDate(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : s;
}

// Layout and averaging rules: knowledge/1.0_FundHoldings.md §File Layout and §Display.
function buildFundCsv(ticker, enriched, meta) {
  const hasSaSao = enriched.some(r => r["SA Yield"] !== "");
  const cols = hasSaSao ? TABLE_COLS : TABLE_COLS.filter(c => c !== "SA Yield" && c !== "SAO Yield");

  // Cash/sweep lines carry no maturity (sweeps are blanked by enrichRow).
  const nonCash = enriched.filter(r => r["Maturity Date"] !== "");
  // Yield group: rows with a yield-source match. Duration group: every non-cash holding with a value.
  const yieldRows = enriched.filter(r => r["Ask Yield"] !== "");
  const avg = (rows, c) => calcMktWtdAvg(rows.map(r => num(r[c])), rows.map(r => num(r["Market Value"]) ?? 0));
  const durRows = c => nonCash.filter(r => r[c] !== "");
  const sum = c => enriched.reduce((s, r) => s + (num(r[c]) ?? 0), 0);

  const terms = durRows("Term").map(r => num(r.Term));
  const weeks = terms.length > 0 && terms.every(t => t < 1);
  const termHeader = weeks ? "Term (w)" : "Term (y)";
  const termOut = n => (n == null ? "" : plain(weeks ? n * WEEKS_PER_YEAR : n));
  const header = cols.map(c => (c === "Term" ? termHeader : c === "Duration" ? "Duration (y)" : c));

  const cell = (c, r) => {
    switch (c) {
      case "Coupon": case "% of Fund": return pct(num(r[c]));
      case "Ask Yield": case "SA Yield": case "SAO Yield": return fracPct(num(r[c]));
      case "Market Value": case "Duration": return plain(num(r[c]));
      case "Term": return termOut(num(r.Term));
      default: return text(r[c]);
    }
  };

  const lines = [];
  lines.push(["Ticker", "Fund Name", "As of", "Expense Ratio", "", "Holdings", "30-Day SEC Yield"].map(text).join(","));
  lines.push([text(ticker), text(meta.fundName), text(isoDate(enriched[0]["As of"])), pct(meta.expenseRatio), "", enriched.length, pct(meta.secYield)].join(","));
  lines.push(header.map(text).join(","));
  for (const r of enriched) lines.push(cols.map(c => cell(c, r)).join(","));

  const total = {
    CUSIP: text("Total / Wtg Avg"),
    Coupon: pct(avg(yieldRows, "Coupon")),
    "% of Fund": pct(Math.round(sum("% of Fund") * 1e8) / 1e8),
    "Market Value": plain(sum("Market Value")),
    "Ask Yield": fracPct(avg(yieldRows, "Ask Yield")),
    "SA Yield": fracPct(avg(yieldRows, "SA Yield")),
    "SAO Yield": fracPct(avg(yieldRows, "SAO Yield")),
    Term: termOut(avg(durRows("Term"), "Term")),
    Duration: plain(avg(durRows("Duration"), "Duration"))
  };
  lines.push(cols.map(c => total[c] ?? "").join(","));
  return lines.join("\n") + "\n";
}

export async function enrichHoldingsFile(ticker) {
  const filename = path.join(DATA_DIR, `${ticker}-Raw.csv`);
  const rows = parseCsv(fs.readFileSync(filename, "utf8"));
  const sources = await loadYieldSources();
  const settle = new Date();
  settle.setHours(0, 0, 0, 0);

  const enriched = rows.map(r => enrichRow(r, settle, sources));
  const meta = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "FundMeta.json"), "utf8"))[ticker] ?? {};

  const outFilename = path.join(DATA_DIR, `${ticker}.csv`);
  fs.writeFileSync(outFilename, buildFundCsv(ticker, enriched, meta), "utf8");
  await upload(outFilename, "FundHoldings");
  return enriched;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tickers = process.argv.slice(2);
  for (const ticker of tickers.length ? tickers : ["VBIL"]) {
    await enrichHoldingsFile(ticker);
  }
}
