import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: 'tests',
  // Failures should fail fast, but the cap must sit just ABOVE the spec's inline { timeout: 4_000 }
  // assertion waits, else a slow-but-legit test races the cap and flakes. 4.5s is that floor; to go
  // shorter, lower the per-assertion 4_000 waits in app.spec.js too.
  timeout: 4_500,
  use: {
    baseURL: 'http://127.0.0.1:8080/TipsLadderManager/',
    headless: true,
  },
  webServer: {
    command: 'cmd /c npx serve .. -p 8080',
    port: 8080,
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
