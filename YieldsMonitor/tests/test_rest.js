import https from 'https';

const symbol = process.argv[2] || 'US10Y';
const range = process.argv[3] || '5D';

const url = `https://ts-api.cnbcfm.com/pyret-api/v1/charts/quotes?symbol=${symbol}&range=${range}&interval=10`;
console.log(`Fetching ${symbol} ${range} from REST URL: ${url}\n`);

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const bars = json?.data?.[0]?.priceBars || [];
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Success: Found ${bars.length} price bars.`);
      if (bars.length > 0) {
        console.log(`First Bar: ${JSON.stringify(bars[0])}`);
        console.log(`Last Bar:  ${JSON.stringify(bars[bars.length - 1])}`);
        
        if (bars.length > 1) {
          const t1 = new Date(bars[0].tradeTime).getTime();
          const t2 = new Date(bars[1].tradeTime).getTime();
          console.log(`Approx Resolution: ${(t2 - t1) / 60000} minutes`);
        }
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.log('Raw data received (first 500 chars):', data.substring(0, 500));
    }
  });
}).on('error', (err) => {
  console.error('Fetch error:', err.message);
});
