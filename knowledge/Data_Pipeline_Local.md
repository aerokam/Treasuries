# Data Pipeline — Local Automation

This document is **gitignored**. Do not reference publicly or commit to remote.
Public pipeline architecture is in `knowledge/Data_Pipeline.md`.

---

## Automated Broker Download Pipeline (LOCAL MACHINE ONLY)

**Script:** `YieldCurves/scripts/fidelityDownload.js` (gitignored)

### How it works
- Spawns real `chrome.exe` with `--remote-debugging-port=9222` and a dedicated Chrome profile at `YieldCurves/.chrome-profile/`
- Connects Playwright via CDP (`chromium.connectOverCDP`) — no Playwright/Chromium automation flags, bypasses Fidelity bot detection
- Navigates to Fidelity signin; if session active, skips login
- If login needed: fills `#dom-username-input` / `#dom-pswd-input`, clicks `#dom-login-button`
- MFA: handled manually in the headed browser window; script waits up to 5 min
- Navigates to Treasuries and TIPS search URLs, grabs `a[href*="CSVDOWNLOAD"]` href
- Downloads CSVs via `fetch` with session cookies (more reliable than Playwright download events over CDP)
- Saves to `~/Downloads/FidelityTreasuries.csv` and `FidelityTips.csv`
- Spawns `uploadFidelityDownload.js` to push both files to R2

### Why CDP (not Playwright launch)
- `launchPersistentContext` (Chromium or real Chrome) sets `navigator.webdriver = true` — Fidelity detects and blocks
- `patchright` also fails (crashes on existing profile; still detected with fresh profile)
- Spawning real `chrome.exe` directly and connecting via CDP: Chrome has no automation flags — bot detection passes
- Do NOT add jitter/delays before login button click — triggers detection
- Do NOT spoof `navigator.webdriver` — makes it worse

### Scheduled Tasks (Windows Task Scheduler)
Three tasks registered via `YieldCurves/scripts/setup-tasks.ps1` (gitignored):
- `FidelityDownload-Morning`: 5:00 AM PT (8 AM ET), retries every 30 min × 9
- `FidelityDownload-Midday`: 10:00 AM PT (1 PM ET)
- `FidelityDownload-Close`: 2:00 PM PT (5 PM ET)

Wrapper: `YieldCurves/scripts/run-fidelity.cmd` (gitignored)
Log: `YieldCurves/logs/fidelity.log` (gitignored)

### Credentials
`FIDELITY_USERNAME` and `FIDELITY_PASSWORD` in root `.env` (gitignored)
Chrome exe: `C:\Program Files\Google\Chrome\Application\chrome.exe`

### Public cover story
Broker data is populated manually. If asked: "I log in and download the CSV myself."
The UI says "Market" — no broker name is exposed anywhere in the public UI or README.
