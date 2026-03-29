import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import { upload } from "../shared/upload.js";

async function updateCpiReleaseSchedules() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  for (const year of years) {
    const url = `https://www.bls.gov/schedule/${year}/home.htm`;
    console.log(`Processing ${year}...`);

    let response;
    try {
      response = await fetch(url);
    } catch (err) {
      console.error(`Fetch failed for ${year}:`, err);
      continue;
    }

    if (response.status !== 200) {
      console.log(`Skipping ${year} (status ${response.status})`);
      continue;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const rows = [];

    $(".release-list tbody tr").each((i, el) => {
      const date = $(el).find(".date-cell").text().trim();
      const time = $(el).find(".time-cell").text().trim();
      const desc = $(el).find(".desc-cell").text().trim();

      if (desc.includes("Consumer Price Index")) {
        rows.push({ date, time, desc });
      }
    });

    if (rows.length === 0) {
      console.log(`No CPI rows found for ${year}. Skipping.`);
      continue;
    }

    let csv = "Date,Time,Description\n";
    for (const r of rows) {
      csv += `"${r.date}","${r.time}","${r.desc}"\n`;
    }

    if (!fs.existsSync("data")) fs.mkdirSync("data", { recursive: true });
    const filename = `data/CpiReleaseSchedule${year}.csv`;
    fs.writeFileSync(filename, csv, "utf8");
    console.log(`Wrote ${filename}`);

    try {
      await upload(filename, "bls");
    } catch (err) {
      console.error(`Upload failed for ${filename}:`, err);
    }
  }
}

updateCpiReleaseSchedules().catch(err => {
  console.error("updateCpiReleaseSchedules failed:", err);
});
