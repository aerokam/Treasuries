// settlement.js — Settlement-date arithmetic shared across apps.
// Spec: knowledge/DATA_DICTIONARY.md#settlement-date (Trade_Date + 1 Bond Trading Day,
// excluding weekends and SIFMA bond-market holidays).
// Per the project-wide no-redundancy directive (projects/CLAUDE.md §2a), this is the
// one implementation; apps import it instead of keeping their own copy.

// Parses a 'YYYY-MM-DD' string into a local-time Date (midnight local).
export function localDate(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Formats a Date as 'YYYY-MM-DD' using its local-time components.
export function toIsoDate(date) {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}

// T+1 bond trading day: the next day that is not a weekend or a SIFMA bond-market holiday.
export function nextBusinessDay(date, holidaySet) {
  if (!date) return new Date();
  const d = new Date(date.getTime());
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6 || holidaySet.has(toIsoDate(d)));
  return d;
}

// Builds a Set of ISO holiday dates from misc/BondHolidaysSifma.csv rows, parsed via
// shared/src/csv.js's parseCsv(text, false) (no header — one array of cells per row).
// Row format: ["Weekday, Month DD, YYYY", "Holiday Name"] — the weekday prefix is
// stripped before Date parsing.
export function parseHolidaySet(rows) {
  const holidaySet = new Set();
  (rows || []).forEach(row => {
    if (!row || !row[0]) return;
    const datePart = row[0].split(',').slice(1).join(',').trim();
    const d = new Date(datePart);
    if (!isNaN(d.getTime())) holidaySet.add(toIsoDate(d));
  });
  return holidaySet;
}
