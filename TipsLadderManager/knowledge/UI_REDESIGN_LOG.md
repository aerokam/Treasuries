# UI Redesign Log - April 2026

*Status: Archived — a record of the April 2026 redesign session. The layout it works toward shipped, and the names it proposes are not all in the code.*

## Objective
Modernize the TipsLadderManager top card into a compact, 4-row layout where card width matches the data table width.

## Target Row Structure (Rebalance)
- **Row 1:** Mode Toggle, Run Button, Info/Market Status.
- **Row 2:** Holdings CSV, First Year, Last Year.
- **Row 3:** Method, Brackets, Pre-ladder Interest.
- **Row 4:** Ladder Term (inclusive: last-first+1), Ladder Range (e.g. 2026-2047), Net Cash.

## Target Row Structure (Build)
- Consolidate all configuration boxes (Years, PLI, Maturity) to **Row 2** for a tighter look.

## Key Technical Learnings
- **Initial Width:** Setting `.app-container` to `display: table; width: auto;` allows the card to "shrink-wrap" the fields at startup.
- **Width Sync:** A JS function `_syncWidth()` is needed to measure `scrollWrap.offsetWidth` and apply it to `.form-card` after rendering to ensure the teal card matches the table footprint exactly.
- **Row Management:** Using `<div class="break"></div>` with `flex-basis: 100%` is effective for forcing row wraps. These breaks can be toggled (`display: none/block`) based on mode.
- **DARA Selector:** User wants DARA available as a selector/input (not hidden).

## Current Issues to Fix
- DARA field was accidentally hidden/removed.
- Extra "5th row" appearing due to layout flow issues.
- Need to ensure DARA is prominent in Row 1 or Row 2.
