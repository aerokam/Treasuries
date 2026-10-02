import { defineConfig } from '@playwright/test';

// UI tests for the apps that have no Playwright config of their own, one project per app, each
// run by its own `npm run test:UI:<App>` script. TipsLadderManager and YieldCurves keep their own
// configs (their own timeouts and base paths).
//
// localhost, not 127.0.0.1: only localhost:8080 is on the R2 CORS allowlist
// (knowledge/Data_Pipeline.md §3.1), so from 127.0.0.1 every unmocked R2 read fails.
export default defineConfig({
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:8080/',
    headless: true,
  },
  projects: [
    { name: 'TreasuryAuctions', testDir: './TreasuryAuctions/tests/UI' },
    { name: 'YieldsMonitor', testDir: './YieldsMonitor/tests/UI' },
    { name: 'KnowledgeMap', testDir: './knowledge/tests/UI' },
  ],
  webServer: {
    command: 'npx serve . -p 8080',
    port: 8080,
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
