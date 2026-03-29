import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { upload } from "../shared/upload.js";

const url = "https://www.sifma.org/resources/guides-playbooks/holiday-schedule?_rsc=9cl3v";

const res = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/html",
  },
});

const text = await res.text();

const holidayRegex = /\[\\"\$\\",\s*\\"h3\\"[\s\S]*?\\"children\\":\\"([^"]+)\\"[\s\S]*?\[\\"\$\\",\s*\\"span\\"[\s\S]*?\\"children\\":\\"([^"]+)\\"/g;

let match;
let holidays = [];

while ((match = holidayRegex.exec(text)) !== null) {
  holidays.push({
    name: match[1],
    date: match[2]
  });
}

function extractYearFromDate(dateStr) {
  const m = dateStr.match(/(\d{4})$/);
  return m ? Number(m[1]) : null;
}

const availableYears = new Set();
for (const h of holidays) {
  const y = extractYearFromDate(h.date);
  if (y) availableYears.add(y);
}

const years = Array.from(availableYears).sort();

const baseUSNames = [
  "Martin Luther King Day",
  "Presidents Day",
  "Good Friday",
  "Memorial Day",
  "Juneteenth",
  "U.S. Independence Day",
  "Labor Day",
  "Columbus Day",
  "Veterans Day",
  "Thanksgiving Day",
  "Christmas Day"
];

function newYearsName(year) {
  return `New Year's Day ${year - 1}/${year}`;
}

function usNamesForYear(year) {
  return new Set([newYearsName(year), ...baseUSNames]);
}

function isYear(date, year) {
  return new RegExp(`\\b${year}$`).test(date);
}

function extractYearHolidays(holidays, year) {
  const nameSet = usNamesForYear(year);
  let filtered = holidays.filter(h =>
    isYear(h.date, year) && nameSet.has(h.name.trim())
  );

  const seen = new Set();
  let deduped = [];

  for (const h of filtered) {
    if (h.name.trim() === "Juneteenth" && !h.date.includes("June")) continue;
    if (h.date.startsWith("Early Close")) continue;

    const key = h.name.trim();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(h);
    }
  }

  return deduped.map(h => ({
    date: h.date,
    name: h.name.trim()
  }));
}

let flatResults = [];
const MIN_HOLIDAYS_PER_YEAR = 10;

for (const year of years) {
  const list = extractYearHolidays(holidays, year);
  if (list.length >= MIN_HOLIDAYS_PER_YEAR) {
    flatResults.push(...list);
  }
}

function parseDate(d) {
  const cleaned = d.includes(":") ? d.split(":").pop().trim() : d;
  return new Date(cleaned);
}
flatResults.sort((a, b) => parseDate(a.date) - parseDate(b.date));

const outDir = path.join(process.cwd(), "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const csvContent = flatResults
  .map(r => `"${r.date}",${r.name}`)
  .join("\n");

const outFile = path.join(outDir, "BondHolidaysSifma.csv");
fs.writeFileSync(outFile, csvContent, "utf8");
console.log(`Wrote ${outFile} (${flatResults.length} holidays)`);

try {
  await upload(outFile, "misc");
} catch (err) {
  console.error(`Upload failed: ${err.message}`);
}
