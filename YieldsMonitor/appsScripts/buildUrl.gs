// --- Helper to build the CNBC URL ---
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
