function fetchAndWriteTimeRange(sheet, symbols, timeRange) {
  const allBars = {};
  const tradeTimesSet = new Set();
  const collapseByDate = (timeRange === "5Y");

  for (const symbol of symbols) {
    const url = buildUrl(symbol, timeRange);
    try {
      const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const json = JSON.parse(resp.getContentText());
      const priceBars = json?.data?.chartData?.priceBars || [];

      for (const bar of priceBars) {
        const tt = bar.tradeTime;
        if (!tt || tt.length !== 14) continue;

        const year = parseInt(tt.substring(0, 4), 10);
        const month = parseInt(tt.substring(4, 6), 10) - 1;
        const day = parseInt(tt.substring(6, 8), 10);
        const hour = parseInt(tt.substring(8, 10), 10);
        const minute = parseInt(tt.substring(10, 12), 10);
        const second = (timeRange === "5D") ? 0 : parseInt(tt.substring(12, 14), 10);

        let closeVal = bar.close;
        if (typeof closeVal === "string" && closeVal.endsWith("%")) {
          closeVal = closeVal.slice(0, -1);
        }
        const closeNum = (closeVal !== undefined && closeVal !== null && String(closeVal).trim() !== "")
          ? parseFloat(closeVal)
          : "";

        const dateObj = collapseByDate
          ? new Date(year, month, day, 0, 0, 0)
          : new Date(year, month, day, hour, minute, second);
        const key = dateObj.getTime();

        if (!allBars[key]) allBars[key] = {};
        allBars[key][symbol] = closeNum;
        tradeTimesSet.add(key);
      }
    } catch (e) {
      Logger.log("ERROR fetching %s %s: %s", symbol, timeRange, e.message || e);
    }
  }

  const tradeTimes = Array.from(tradeTimesSet).sort((a, b) => a - b);
  const output = tradeTimes.map(t => {
    const row = [new Date(t)];
    for (const symbol of symbols) row.push(allBars[t]?.[symbol] ?? "");
    return row;
  });

  // --- Detect starting column from header ---
  const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const startCol = header.findIndex(h => typeof h === "string" && h.toLowerCase().startsWith("trade")) + 1;
  if (startCol === 0) {
    Logger.log("ERROR: No 'trade' column found in header of sheet '%s'", sheet.getName());
    return;
  }

  // --- Clear existing data rows (excluding header) ---
  const numRows = sheet.getLastRow() - 1;
  const numCols = symbols.length + 1;
  if (numRows > 0) {
    sheet.getRange(2, startCol, numRows, numCols).clearContent();
  }

  // --- Write new data ---
  if (output.length > 0) {
    sheet.getRange(2, startCol, output.length, numCols).setValues(output);
    const fmt = (timeRange === "1D" || timeRange === "5D") ? "MM/dd/yy HH:mm" : "MM/dd/yy";
    sheet.getRange(2, startCol, output.length, 1).setNumberFormat(fmt);
  }

  Logger.log("Wrote %s rows x %s cols to sheet '%s' starting at column %s", output.length, numCols, sheet.getName(), startCol);
}
