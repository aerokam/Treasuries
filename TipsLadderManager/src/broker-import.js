// broker-import.js -- Parses broker export CSVs (Fidelity, Schwab)
// Extracts TIPS holdings and aggregates them into a single list.

function parseCSVLine(str) {
  const arr = [];
  let quote = false;
  let col = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '"') {
      quote = !quote;
    } else if (c === ',' && !quote) {
      arr.push(col.trim());
      col = '';
    } else {
      col += c;
    }
  }
  arr.push(col.trim());
  return arr.map(s => s.replace(/^"|"$/g, '').trim());
}

export function parseBrokerCSV(csvText, tipsMap) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  let map = { accountNum: -1, accountName: -1, symbol: -1, quantity: -1 };
  let currentSchwabAccount = null;
  const accounts = {}; // Key: AccountName -> Map<cusip, qty>

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Schwab account header: "Positions for account [Name] ...[Last 4 Digits] as of ..."
    // Extract text before the "...DIGITS" pattern
    const schwabMatch = line.match(/\.\.\.\d+/);
    if (schwabMatch) {
      // Find what comes before the "...DIGITS" part
      const beforeDots = line.substring(0, line.indexOf('...'));
      // Extract account name (remove "Positions for account" prefix and quotes)
      const acctName = beforeDots.replace(/^["']?Positions\s+for\s+account\s+/, '').replace(/["']?\s*$/, '').trim();
      if (acctName) {
        currentSchwabAccount = acctName;
        continue;
      }
    }
    if (line.startsWith('"Account Total"') || line.startsWith('Account Total')) {
      currentSchwabAccount = null;
      continue;
    }

    const cols = parseCSVLine(line);
    const lowerCols = cols.map(c => c.toLowerCase());

    const qIdx = lowerCols.findIndex(c => c === 'quantity' || c.startsWith('qty'));
    const sIdx = lowerCols.findIndex(c => c === 'symbol' || c === 'cusip');

    if (qIdx > -1 && sIdx > -1) {
      map.quantity = qIdx;
      map.symbol = sIdx;
      map.accountNum = lowerCols.findIndex(c => c.includes('account number') || c === 'account');
      map.accountName = lowerCols.findIndex(c => c.includes('account name'));
      continue;
    }

    if (map.symbol === -1 || map.quantity === -1) continue;
    if (cols.length <= map.quantity) continue; // Short row

    const rawSym = cols[map.symbol];
    if (!rawSym || rawSym.includes('Total')) continue;

    // Validate CUSIP against our loaded TIPS map
    if (tipsMap.has(rawSym)) {
      const rawQtyStr = cols[map.quantity].replace(/[^0-9.-]/g, ''); // Remove non-numeric chars
      const faceValue = parseFloat(rawQtyStr);
      if (isNaN(faceValue) || faceValue <= 0) continue;

      const qty = Math.round(faceValue / 1000);
      if (qty <= 0) continue;

      let acctKey = 'Unknown Account';
      if (currentSchwabAccount) {
        acctKey = currentSchwabAccount;
      } else if (map.accountNum > -1 && cols[map.accountNum]) {
        acctKey = cols[map.accountNum];
        if (map.accountName > -1 && cols[map.accountName]) {
          const name = cols[map.accountName];
          if (name && name !== 'nan') acctKey = name;
        }
      }

      if (!accounts[acctKey]) accounts[acctKey] = new Map();
      accounts[acctKey].set(rawSym, (accounts[acctKey].get(rawSym) || 0) + qty);
    }
  }

  const result = {};
  for (const [acct, posMap] of Object.entries(accounts)) {
    result[acct] = Array.from(posMap, ([cusip, qty]) => ({ cusip, qty }));
  }
  return result;
}