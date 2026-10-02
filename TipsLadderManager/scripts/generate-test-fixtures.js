#!/usr/bin/env node
// scripts/generate-test-fixtures.js
// Reads data/SchwabAllAccounts.csv (private, gitignored)
// Writes sanitized/scaled (÷5) versions to tests/ for use in test suite.
// Also writes data/SampleHoldings.csv (Format 3: cusip,qty in bonds) — the app's pre-populate sample.
// Also writes data/SampleDaraPlan.csv (÷5 of data/DaraPlanKevinRmd.csv, private/gitignored) — the
// app's pre-populate DARA plan, scaled to match SampleHoldings.csv's own ÷5 (both come from the
// Kevin_IRA account, so they must share one scale factor or the sample ladder isn't self-financing
// against its own sample holdings — see KNOWN_ISSUES.md, "sample DARA plan drifted from sample
// holdings" (2026-09-30): this step didn't exist before that, so 18+ SampleHoldings.csv refreshes
// went out with a SampleDaraPlan.csv rescaled only once, by hand, at the pair's creation.
//
// Sanitization rules:
//   - Bond face values: ÷5, rounded to nearest $1000
//   - ETF/MM share counts: ÷5
//   - Gain/loss, cost basis: zeroed / replaced with "--"
//   - Account numbers (Schwab suffix): replaced with sequential fakes
//   - Account NAMES: discarded entirely, replaced with synthetic "Acct<N>" labels that retain ONLY
//     the account-type keyword (IRA / Roth IRA) — the only thing downstream logic needs (see
//     detectAccountType in src/account-allocation.js). No real name can leak: the label is re-derived
//     from the type, never copied, so new or renamed accounts are safe by construction.
//   - Market values: recalculated for bonds, scaled ÷5 for other positions
//   - SampleHoldings.csv: the TIPS of the traditional IRA holding the most TIPS (the richest tIRA).

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { execFileSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT  = path.resolve(__dirname, '..');
const DATA  = path.join(ROOT, 'data');
const TESTS = path.join(ROOT, 'tests');

function die(msg) { console.error('ERROR:', msg); process.exit(1); }

// Account-type detection mirrors src/account-allocation.js detectAccountType: only the IRA / Roth IRA
// distinction is retained from a real account name; everything else (the names) is discarded.
function detectType(name) {
  const u = (name || '').toUpperCase();
  if (u.includes('ROTH')) return 'roth_ira';
  if (u.includes('IRA'))  return 'traditional_ira';
  return 'taxable';
}
function typeSuffix(t) {
  return t === 'roth_ira' ? ' Roth IRA' : t === 'traditional_ira' ? ' IRA' : '';
}

// ─── Schwab Format 2 ─────────────────────────────────────────────────────────
//
// Column order is not fixed: Schwab has added columns (Cost/Share, Cost Basis) between
// exports before. Every account section repeats its own header row, so each section's
// columns are located by name from that row rather than assumed by position.

function parseQuotedRow(line) {
  const cols = [];
  const re = /"([^"]*)"/g;
  let m;
  while ((m = re.exec(line)) !== null) cols.push(m[1]);
  return cols;
}

// Build a quoted CSV row matching headerCols' column order; columns not in `fields` default to "--".
function buildSchwabRow(headerCols, fields) {
  return headerCols.map(h => `"${fields[h] ?? '--'}"`).join(',') + ',';
}

// Scale a Schwab position and return { row, mktNum, scaledBonds, isTips }
// scaledBonds is non-null only for Fixed Income with INFL IDX in description.
// headerCols: the section's own header row (array of column names), used to locate fields by name.
function scaleSchwabPos(cols, headerCols) {
  const idx = name => headerCols.indexOf(name);
  const col = name => { const i = idx(name); return i < 0 ? '' : (cols[i] ?? ''); };

  const sym = col('Symbol');
  if (!sym || sym === 'Symbol' || sym === 'Positions Total') return null;

  if (sym === 'Cash & Cash Investments') {
    return {
      row: buildSchwabRow(headerCols, {
        'Symbol': 'Cash & Cash Investments',
        'Mkt Val (Market Value)': '$0.00',
        'Asset Type': 'Cash and Money Market',
      }),
      mktNum: 0,
      scaledBonds: null,
    };
  }

  const desc = col('Description');
  const qty = col('Qty (Quantity)');
  const price = col('Price');
  const mktVal = col('Mkt Val (Market Value)');
  const assetType = col('Asset Type');

  const rawQty = parseFloat(qty.replace(/,/g, ''));
  const isFixed = assetType.includes('Fixed Income');

  let scaledQtyNum, scaledQtyStr;
  if (isFixed) {
    scaledQtyNum = Math.round(rawQty / 5 / 1000) * 1000;
    scaledQtyStr = scaledQtyNum.toLocaleString('en-US');
  } else {
    scaledQtyNum = rawQty / 5;
    const cleanQty = qty.replace(/,/g, '');
    const dotIdx = cleanQty.indexOf('.');
    if (dotIdx >= 0) {
      const dec = cleanQty.length - dotIdx - 1;
      scaledQtyStr = scaledQtyNum.toFixed(dec);
    } else {
      const r = Math.round(scaledQtyNum);
      scaledQtyStr = r >= 1000 ? r.toLocaleString('en-US') : String(r);
    }
  }

  let mktNum;
  if (isFixed) {
    mktNum = scaledQtyNum * parseFloat(price) / 100;
  } else {
    mktNum = parseFloat(mktVal.replace(/[$,]/g, '')) / 5;
  }

  const isTips = isFixed && desc.includes('INFL IDX');
  const scaledBonds = isTips ? scaledQtyNum / 1000 : null;

  return {
    row: buildSchwabRow(headerCols, {
      'Symbol': sym,
      'Description': desc,
      'Qty (Quantity)': scaledQtyStr,
      'Price': price,
      'Mkt Val (Market Value)': `$${mktNum.toFixed(2)}`,
      'Gain $ (Gain/Loss $)': '$0.00',
      'Gain % (Gain/Loss %)': '0%',
      'Asset Type': assetType,
    }),
    mktNum,
    scaledBonds,
    sym,
    isTips,
  };
}

// Account header row: a single quoted field, "Name ...DIGITS" (Schwab quotes this line too).
const ACCOUNT_HEADER_RE = /^"([^"]*\.\.\.\d+)"$/;

function sanitizeSchwab(text) {
  const lines = text.split('\n');
  const outLines = [lines[0]]; // date/time header

  // Parse into account sections
  const sections = [];
  let current = null;
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    const headerMatch = trimmed.match(ACCOUNT_HEADER_RE);
    if (headerMatch) {
      current = { rawName: headerMatch[1].split(' ...')[0], positions: [], headerCols: null };
      sections.push(current);
    } else if (current && trimmed.startsWith('"Symbol"')) {
      current.headerCols = parseQuotedRow(trimmed);
    } else if (current) {
      const cols = parseQuotedRow(trimmed);
      if (cols.length >= 8) current.positions.push(cols);
    }
  }

  // Emit each section under a synthetic label (real name discarded; only IRA/Roth type retained).
  sections.forEach((section, idx) => {
    section.type      = detectType(section.rawName);
    section.tips      = [];   // "CUSIP,bonds" strings for this account's TIPS
    section.tipsBonds = 0;    // total scaled face (in bonds) — used to pick the richest tIRA

    outLines.push('', '');
    outLines.push(`Acct${idx + 1}${typeSuffix(section.type)} ...${String(idx + 1).padStart(3, '0')}`);
    outLines.push(section.headerCols.map(h => `"${h}"`).join(',') + ',');

    let totalMkt = 0;
    for (const cols of section.positions) {
      const result = scaleSchwabPos(cols, section.headerCols);
      if (!result) continue;
      outLines.push(result.row);
      totalMkt += result.mktNum;
      if (result.isTips) {
        section.tips.push(`${result.sym},${result.scaledBonds}`);
        section.tipsBonds += result.scaledBonds;
      }
    }

    outLines.push(buildSchwabRow(section.headerCols, {
      'Symbol': 'Positions Total',
      'Description': '',
      'Mkt Val (Market Value)': `$${totalMkt.toFixed(2)}`,
    }));
  });

  // SampleHoldings source = the traditional IRA holding the most TIPS (by scaled face).
  const richestTIra = sections
    .filter(s => s.type === 'traditional_ira' && s.tips.length)
    .sort((a, b) => b.tipsBonds - a.tipsBonds)[0];
  const sampleTips = richestTIra ? richestTIra.tips : [];

  return { csv: outLines.join('\n') + '\n', sampleTips };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const schwabSrc = path.join(DATA, 'SchwabAllAccounts.csv');

if (!existsSync(schwabSrc))   die(`Missing ${schwabSrc}\n  Copy SchwabAllAccounts.csv from Downloads to data/`);

console.log('Reading', schwabSrc);
const { csv: schwabCsv, sampleTips } = sanitizeSchwab(readFileSync(schwabSrc, 'utf8'));

const schwabOut   = path.join(TESTS, 'SchwabAllAccounts.csv');
const holdingsOut = path.join(DATA,  'SampleHoldings.csv'); // single canonical copy: app pre-populate + tests both read here

writeFileSync(schwabOut,   schwabCsv,   'utf8');

// Guard: never silently overwrite the canonical holdings file with a header-only stub.
// (A prior regen with no richest-tIRA TIPS flattened it and broke pre-populate + e2e.)
if (sampleTips.length === 0) die(`No traditional-IRA TIPS extracted from ${schwabSrc}; refusing to write an empty ${holdingsOut}`);
const holdingsCsv = ['cusip,qty', ...sampleTips].join('\n') + '\n';
writeFileSync(holdingsOut, holdingsCsv, 'utf8');

console.log(`Wrote ${schwabOut}   (${schwabCsv.split('\n').length} lines)`);
console.log(`Wrote ${holdingsOut} (${sampleTips.length} TIPS)`);

// data/SampleDaraPlan.csv: ÷5 of data/DaraPlanKevinRmd.csv (private/gitignored, same Kevin_IRA
// account SampleHoldings.csv is drawn from). Non-fatal if the source isn't there — unlike the
// holdings guard above, a missing DARA plan source shouldn't block the Schwab/holdings
// regen that real accounts' e2e coverage depends on; it just means the sample plan goes stale
// again until the source file is refreshed in data/.
const daraPlanSrc = path.join(DATA, 'DaraPlanKevinRmd.csv');
const daraPlanOut = path.join(DATA, 'SampleDaraPlan.csv');
if (existsSync(daraPlanSrc)) {
  const lines = readFileSync(daraPlanSrc, 'utf8').trim().split('\n');
  const out = [lines[0]];
  for (let i = 1; i < lines.length; i++) {
    const [yr, v] = lines[i].split(',');
    out.push(`${yr},${Math.round(parseFloat(v) / 5)}`);
  }
  writeFileSync(daraPlanOut, out.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${daraPlanOut} (${out.length - 1} years)`);
} else {
  console.log(`Skipped ${daraPlanOut}: no ${daraPlanSrc} (copy dara-plan-kevin-rmd.csv from Downloads there to keep the sample plan in sync).`);
}

// ─── Auto-commit + push ────────────────────────────────────────────────────
// Regenerated fixtures never sit dirty across sessions (was causing repeated noise in
// `git status`): commit them here immediately, then push -- the repo's pre-push hook
// (.githooks/pre-push -> scripts/pre-push-tests.js) runs TipsLadderManager's test suites
// and blocks the push if anything fails, so a bad regen never reaches the remote.
//
// Only this commit is pushed. Other sessions' unpushed commits on main are work the developer
// has not reviewed yet, so they stay local: the fixture change is rebuilt as its own commit on
// top of origin/main (a temporary index, no checkout) and that commit alone is pushed, then
// folded back into local main with `merge -s ours` (Treasuries/CLAUDE.md §Shipping less than all
// of `main`, steps 3-4). The commit also names its paths, so nothing another session has
// staged is swept into it.
const REPO_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim();
const fixtureFiles = [schwabOut, holdingsOut, daraPlanOut];
const git = (args, opts = {}) => execFileSync('git', args, { cwd: REPO_ROOT, ...opts }).toString().trim();

const dirty = git(['status', '--porcelain', '--', ...fixtureFiles]);
if (!dirty) {
  console.log('\nFixtures unchanged; nothing to commit.');
} else {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const msg = 'TipsLadderManager: refresh sample/test holdings fixtures';

  git(['add', '--', ...fixtureFiles]);
  execFileSync('git', ['commit', '-m', msg, '--', ...fixtureFiles], { cwd: REPO_ROOT, stdio: 'inherit' });

  if (branch !== 'main') {
    console.log(`\nCommitted on branch "${branch}" (not main) -- not auto-pushing. Merge to main and push manually.`);
  } else {
    try {
      git(['fetch', 'origin']);
      const fixtureSha = git(['rev-parse', 'HEAD']);
      const unpushed = git(['rev-list', 'origin/main..HEAD']).split('\n').filter(Boolean);

      if (unpushed.length === 1 && unpushed[0] === fixtureSha) {
        // Nothing else waiting on main: a plain push carries only this commit.
        execFileSync('git', ['push', 'origin', 'main'], { cwd: REPO_ROOT, stdio: 'inherit' });
        console.log('\nPushed.');
      } else {
        console.log(`\n${unpushed.length - 1} other unpushed commit(s) on main stay local; pushing the fixture commit alone.`);
        const relPaths = fixtureFiles.map(f => path.relative(REPO_ROOT, f).split(path.sep).join('/'));
        const tmpIndex = path.join(REPO_ROOT, '.git', 'fixture-ship.index');
        const env = { ...process.env, GIT_INDEX_FILE: tmpIndex };
        try {
          git(['read-tree', 'origin/main'], { env });
          for (const rel of relPaths) {
            const entry = git(['ls-tree', fixtureSha, '--', rel]); // "<mode> blob <sha>\t<path>"
            if (!entry) continue;
            const [mode, , blob] = entry.split(/\s+/);
            git(['update-index', '--add', '--cacheinfo', `${mode},${blob},${rel}`], { env });
          }
          const tree = git(['write-tree'], { env });
          if (tree === git(['rev-parse', 'origin/main^{tree}'])) {
            console.log('origin/main already has these fixtures; nothing to push.');
          } else {
            const shipSha = git(['commit-tree', tree, '-p', 'origin/main', '-m', msg]);
            execFileSync('git', ['push', 'origin', `${shipSha}:refs/heads/main`], { cwd: REPO_ROOT, stdio: 'inherit' });
            console.log('\nPushed the fixture commit alone.');
          }
        } finally {
          try { unlinkSync(tmpIndex); } catch {}
        }
        // Fold back: the same commit `merge -s ours` makes (local tree, parents HEAD and
        // origin/main), but built with commit-tree and reached by fast-forward, because git
        // refuses any real merge while another session has files staged -- the normal state
        // here. The tree is unchanged, so staged and unstaged work is untouched. If a commit
        // lands on main in between, --ff-only refuses instead of losing it.
        try {
          git(['fetch', 'origin']);
          const foldSha = git(['commit-tree', 'HEAD^{tree}', '-p', 'HEAD', '-p', 'origin/main', '-m', 'Merge origin/main (fixture commit already shipped on its own)']);
          git(['merge', '--ff-only', foldSha]);
          console.log('Folded origin/main back into local main (working tree and index unchanged).');
        } catch (e) {
          console.error(`\nPushed, but folding origin/main back into local main failed: ${e.message}\nRe-run the fold-back (commit-tree HEAD^{tree} -p HEAD -p origin/main, then merge --ff-only) before the next push.`);
          process.exitCode = 1;
        }
      }
    } catch {
      console.error('\nPush BLOCKED (pre-push hook failed, likely a broken fixture regen). The commit is local -- fix the failing test, then push it.');
      process.exitCode = 1;
    }
  }
}
