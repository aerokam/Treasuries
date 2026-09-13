# UI Redesign Status Report - April 11, 2026

*Status: Archived — the state of the redesign on 2026-04-11. The open items it lists were settled afterwards, and the names it proposes are not all in the code.*

## Progress Summary
- **DARA Restoration:** Successfully returned the DARA input to the visible grid (Row 2).
- **Row Architecture:** Standardized a 4-row structure for Rebalance and a consolidated 3-row structure for Build.
- **Width Management:** Solved the "card too wide" issue using `display: table; width: auto;` on the `.app-container`.
- **Dynamic Summaries:** Implemented "Ladder Term" (inclusive count) and "Ladder Range" displays that update live.

## Row Mapping (Current)
| Row | Rebalance Mode | Build Mode |
|---|---|---|
| **1** | Actions (Mode, Run) + Info Stack | Actions + Info Stack |
| **2** | Holdings CSV, DARA, FY, LY | DARA, FY, LY, PLI, Maturity (Consolidated) |
| **3** | Method, Brackets, PLI, Maturity | (Hidden via #break-1) |
| **4** | Term, Range, Net Cash | Term, Range, Total Cost |

## Technical Findings
1. **Shrink-Wrap Initializer:** `display: table` on the container is the most reliable way to force the teal card to match the width of the form fields before data is loaded.
2. **Post-Render Sync:** The `_syncWidth()` function is still necessary to expand the card if the resulting data table is wider than the form.
3. **Break Toggling:** Using IDs on `<div class="break">` allows for surgical control of row wrapping between modes.

## Known Issues for Next Session
- **The "5th Row":** There is still a ghost row appearing at the bottom of the card. Candidates: `#status`, `#info-strip`, or trailing whitespace in the `.fields` flex container.
- **Layout Alignment:** Verify that vertical spacing remains consistent when fields are hidden/shown.
