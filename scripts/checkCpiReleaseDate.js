// Check whether today (Eastern) is a Release Date of CPI release schedule (S19), read from R2.
// Exit 0 = release day, exit 1 = not a release day, exit 2 = the schedule could not be read.
//
// Usage: node scripts/checkCpiReleaseDate.js

const R2_BASE = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';
const URL = `${R2_BASE}/bls/CpiReleaseSchedule.csv`;

// Header row, then `Reference Month,Release Date,Release Time`: the Release Date is YYYY-MM-DD.
function releaseDates(csv) {
  return csv.split(/\r?\n/).slice(1).map(line => line.split(',')[1]).filter(Boolean);
}

async function main() {
  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  console.log(`Today (ET): ${todayET}`);

  const res = await fetch(URL);
  if (!res.ok) {
    console.error(`CPI release schedule not readable: HTTP ${res.status} from ${URL}`);
    process.exitCode = 2;
    return;
  }
  if (releaseDates(await res.text()).includes(todayET)) {
    console.log('MATCH — CPI release day.');
    process.exitCode = 0;
  } else {
    console.log('Not a CPI release day.');
    process.exitCode = 1;
  }
}

// Set exitCode and let the event loop drain naturally; calling process.exit()
// while fetch handles are still closing aborts with a libuv assertion on Windows.
main().catch(err => { console.error(err); process.exitCode = 2; });
