import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";
import { upload } from "../shared/upload.js";

function ensureDirs() {
  if (!fs.existsSync("logs")) fs.mkdirSync("logs");
  if (!fs.existsSync("data")) fs.mkdirSync("data");
}

function log(msg) {
  const line = `${msg}\n`;
  fs.appendFileSync("logs/BondHolidaySchedule.log", line);
  console.log(msg);
}

async function updateHolidays() {
  ensureDirs();

  const url = "https://www.marketbeat.com/bond-market-holidays/";

  const tStart = Date.now();
  log(`[START] ${new Date().toISOString()}`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/120.0.0.0 Safari/537.36"
  );

  log("Loading page…");
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("table.scroll-table");

  const html = await page.content();
  await browser.close();

  const $ = cheerio.load(html);
  const table = $("table.scroll-table");
  if (!table.length) throw new Error("Could not find scroll-table");

  const rows = [];
  table.find("tr").each((i, el) => {
    const row = [];
    $(el).find("th, td").each((j, cell) => { row.push($(cell).text().trim()); });
    if (row.length > 0) rows.push(row);
  });

  log(`Parsed ${rows.length} rows from table`);

  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const filename = path.join("data", "BondMarketHolidays.csv");
  fs.writeFileSync(filename, csv, "utf8");
  log(`Wrote ${filename}`);

  try {
    await upload(filename, "misc");
    log("Upload complete");
  } catch (err) {
    log(`Upload failed: ${err}`);
  }

  log(`Total runtime: ${Date.now() - tStart} ms`);
  log(`[END] ${new Date().toISOString()}`);
}

updateHolidays().catch(err => {
  console.error(`Scraper failed: ${err}`);
  process.exit(1);
});
