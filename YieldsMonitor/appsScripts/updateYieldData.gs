function updateYieldData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  // --- Fetch 1D & 5D ---
  const dataSheets = {};
  for (const tr of ["1D", "5D"]) {
    const sheet = sheets.find(s => s.getName().startsWith(tr));
    if (!sheet) continue;

    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const tradeCol = header.findIndex(h => typeof h === "string" && h.toLowerCase().startsWith("trade"));
    if (tradeCol === -1) continue;

    let lastCol = tradeCol + 1;
    while (lastCol < header.length && header[lastCol]) lastCol++;

    const symbols = header.slice(tradeCol + 1, lastCol).filter(s => typeof s === "string" && s.trim() !== "");
    if (!symbols.length) continue;

    Logger.log("Fetching %s data for symbols: %s", tr, JSON.stringify(symbols));
    fetchAndWriteTimeRange(sheet, symbols, tr);

    const data = sheet.getDataRange().getValues();
    if (data.length > 1) dataSheets[tr] = data.slice(1);
  }

  const source1D = dataSheets["1D"] || [];
  if (!source1D.length) {
    Logger.log("No 1D source data, skipping update sheets.");
    return;
  }

  // --- Update longer-range sheets ---
  for (const sheet of sheets) {
    const name = sheet.getName();

    // Only allow ALL or NX=MY pattern
    const isAll = name === "ALL";
    const isNXeqMY = /^\d+[MY]=\d+Y$/.test(name);  // e.g. 1M=1Y, 5Y=10Y
    if (!(isAll || isNXeqMY)) {
      Logger.log("Skipping sheet: %s (not ALL or NX=MY)", name);
      continue;
    }

    Logger.log("Updating sheet: %s", name);

    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const tradeCol = header.findIndex(h => typeof h === "string" && h.toLowerCase().startsWith("trade"));
    if (tradeCol === -1) {
      Logger.log("Skipping %s: no Trade column", name);
      continue;
    }

    let lastCol = tradeCol + 1;
    while (lastCol < header.length && header[lastCol]) lastCol++;

    const symbols = header.slice(tradeCol + 1, lastCol).filter(s => typeof s === "string" && s.trim() !== "");
    if (!symbols.length) {
      Logger.log("Skipping %s: no symbols", name);
      continue;
    }

    const lastRowSheet = sheet.getLastRow();
    const existingDates = lastRowSheet > 1
      ? sheet.getRange(2, tradeCol + 1, lastRowSheet - 1, 1).getValues().map(r => {
          const d = new Date(r[0]);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        })
      : [];

    // Find latest valid date in 1D source
    let latestDateOnly = null;
    for (let i = source1D.length - 1; i >= 0; i--) {
      const dt = source1D[i][0];
      if (!(dt instanceof Date) || isNaN(dt.getTime())) continue;
      if (dt.getHours() < 17 || (dt.getHours() === 17 && dt.getMinutes() <= 5)) {
        latestDateOnly = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        break;
      }
    }
    if (!latestDateOnly) {
      Logger.log("Skipping %s: no valid latest date found", name);
      continue;
    }

    const latestRow = [latestDateOnly];
    for (let col = 1; col <= symbols.length; col++) {
      let val = null;
      for (let i = source1D.length - 1; i >= 0; i--) {
        const dt = source1D[i][0];
        if (!(dt instanceof Date)) continue;
        const rowDateOnly = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        if (rowDateOnly.getTime() !== latestDateOnly.getTime()) continue;
        if (dt.getHours() > 17 || (dt.getHours() === 17 && dt.getMinutes() > 5)) continue;

        const candidate = source1D[i][col];
        if (candidate !== "" && candidate !== null && candidate !== undefined) {
          val = candidate;
          break;
        }
      }
      latestRow.push(val);
    }

    const dateKey = latestDateOnly.getTime();
    const idx = existingDates.indexOf(dateKey);
    const trimmedRow = latestRow.slice(0, lastCol - tradeCol);

    if (idx >= 0) {
      const targetRow = idx + 2;
      sheet.getRange(targetRow, tradeCol + 1, 1, trimmedRow.length).setValues([trimmedRow]);
      Logger.log("Updated existing row for %s at row %d", name, targetRow);
    } else {
      sheet.getRange(sheet.getLastRow() + 1, tradeCol + 1, 1, trimmedRow.length).setValues([trimmedRow]);
      Logger.log("Appended new row for %s", name);
    }

    sheet.getRange(2, tradeCol + 1, sheet.getLastRow() - 1, 1).setNumberFormat("MM/dd/yy");
  }
}
