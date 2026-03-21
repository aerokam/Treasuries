import https from 'https';

function buildUrl(symbol, timeRange) {
  const base = "https://webql-redesign.cnbcfm.com/graphql";
  const params = {
    operationName: "getQuoteChartData",
    variables: JSON.stringify({ symbol, timeRange }),
    extensions: JSON.stringify({
      persistedQuery: {
        version: 1,
        sha256Hash: "9e1670c29a10707c417a1efd327d4b2b1d456b77f1426e7e84fb7d399416bb6b"
      }
    })
  };
  return base + "?" + Object.entries(params).map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&");
}

const url = buildUrl('US10Y', '1D');
console.log(`Fetching from URL: ${url}\n`);

https.get(url, (res) => {
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
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.log('Raw data received (first 500 chars):', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('Fetch error:', err.message);
});
