// Check if today (ET) is a CPI release day by reading CpiReleaseSchedule CSVs from R2.
// Exit 0 = release day, exit 1 = not a release day.
//
// Usage: node scripts/checkCpiReleaseDate.js

const R2_BASE = 'https://pub-ba11062b177640459f72e0a88d0261ae.r2.dev';

async function fetchScheduleCsv(year) {
  const url = `${R2_BASE}/bls/CpiReleaseSchedule${year}.csv`;
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`No schedule found for ${year} (${res.status})`);
    return null;
  }
  return res.text();
}

function parseDates(csv) {
  const dates = [];
  for (const line of csv.split('\n')) {
    // Format: "Tuesday, January 13, 2026","08:30 AM","Consumer Price Index..."
    const m = line.match(/^"([^"]+)"/);
    if (!m || m[1] === 'Date') continue;
    dates.push(m[1]); // e.g. "Friday, April 10, 2026"
  }
  return dates;
}

async function main() {
  const now = new Date();
  const todayET = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/New_York',
  });
  console.log(`Today (ET): ${todayET}`);

  const currentYear = now.getFullYear();
  const years = [currentYear, currentYear + 1];
  const allDates = [];

  for (const year of years) {
    const csv = await fetchScheduleCsv(year);
    if (csv) allDates.push(...parseDates(csv));
  }

  if (allDates.includes(todayET)) {
    console.log('MATCH — CPI release day.');
    process.exitCode = 0;
  } else {
    console.log('Not a CPI release day.');
    process.exitCode = 1;
  }
}

// Set exitCode and let the event loop drain naturally; calling process.exit()
// while fetch handles are still closing aborts with a libuv assertion on Windows.
main().catch(err => { console.error(err); process.exitCode = 1; });
