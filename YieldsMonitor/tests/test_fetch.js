import https from 'https';

const symbol = process.argv[2] || 'US10Y';
const timeRange = process.argv[3] || '5D';

function buildUrl(symbol, timeRange) {
  const base = "https://webql-redesign.cnbcfm.com/graphql";
  const params = {
    operationName: "getQuoteChartData",
    variables: JSON.stringify({ symbol, timeRange, interval: "10" }),
    extensions: JSON.stringify({
      persistedQuery: {
        version: 1,
        sha256Hash: "9e1670c29a10707c417a1efd327d4b2b1d456b77f1426e7e84fb7d399416bb6b"
      }
    })
  };
  return base + "?" + Object.entries(params).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
}

const url = buildUrl(symbol, timeRange);
console.log(`Fetching ${symbol} ${timeRange} from URL: ${url}\n`);

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const priceBars = json?.data?.chartData?.priceBars || [];
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Success: Found ${priceBars.length} price bars.`);
      if (priceBars.length > 0) {
        console.log(`First Bar: ${JSON.stringify(priceBars[0])}`);
        console.log(`Last Bar:  ${JSON.stringify(priceBars[priceBars.length - 1])}`);
        
        // Calculate resolution
        if (priceBars.length > 1) {
          const t1 = parseInt(priceBars[0].tradeTimeinMills);
          const t2 = parseInt(priceBars[1].tradeTimeinMills);
          console.log(`Approx Resolution: ${(t2 - t1) / 60000} minutes`);
        }
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Fetch error:', err.message);
});
