import { refreshMarketFixtures } from './refresh-market-fixtures.js';
export default async function globalSetup() { await refreshMarketFixtures(); }
