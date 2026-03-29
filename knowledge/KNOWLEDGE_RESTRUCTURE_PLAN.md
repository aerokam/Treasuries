# Knowledge Restructure Plan

Tracks remaining phases of the knowledge base restructure. Delete when complete.

---

## Status

- [x] Phase 1 — Fix gitignore + split Data_Pipeline *(done 2026-03-29)*
- [x] Phase 2 — Rename/renumber files + update cross-references *(done 2026-03-29)*
- [x] Phase 3 — Build KNOWLEDGE_MAP.md *(done 2026-03-29)*
- [ ] Phase 4 — DD completeness audit + link strategy

---

## Phase 2 — Rename/Renumber + Cross-References

### Root `knowledge/` — drop number prefixes (no chain here)

| Current | New |
|---|---|
| `knowledge/1.0_Bond_Basics.md` | `knowledge/Bond_Basics.md` |
| `knowledge/2.1_TIPS_Basics.md` | `knowledge/TIPS_Basics.md` |
| `TipsLadderManager/knowledge/AuctionsQuery_Reference.md` | `knowledge/AuctionsQuery_Reference.md` |
| `YieldsMonitor/knowledge/1.0_API_Mapping.md` | `YieldsMonitor/knowledge/API_Mapping.md` |

### `TipsLadderManager/knowledge/` — renumber to restart at 1

| Current | New |
|---|---|
| `2.0_Bond_Ladders.md` | `1.0_Bond_Ladders.md` |
| `3.0_TIPS_Ladders.md` | `2.0_TIPS_Ladders.md` |
| `4.1_Broker_Import.md` | `2.1_Broker_Import.md` |
| `4.0_TIPS_Ladder_Rebalancing.md` | `3.0_TIPS_Ladder_Rebalancing.md` |
| `3.1_Data_Pipeline.md` | `3.1_Data_Pipeline.md` *(unchanged)* |
| `5.0_Computation_Modules.md` | `4.0_Computation_Modules.md` |
| `6.0_UI_Schema.md` | `5.0_UI_Schema.md` |
| `PROJECT_VISION.md` | *(unchanged)* |
| `TECHNICAL_REFERENCE.md` | *(unchanged — pending Phase 4 decision on merging into DD)* |

### `YieldCurves/knowledge/` — unchanged
All files keep current names and numbers (1.0–3.0 local to app).

### `TreasuryAuctions/knowledge/` — unchanged

### After renaming: update all `## Dependencies` sections
Each file must list its prereqs by new name. Verify these are complete:

- `Bond_Basics.md` — no deps
- `TIPS_Basics.md` — depends on Bond_Basics
- `Treasury_CUSIP_Reference.md` — no deps
- `AuctionsQuery_Reference.md` — no deps
- `DATA_DICTIONARY.md` — no deps
- `DataFlow.md` — depends on DATA_DICTIONARY
- `Data_Pipeline.md` — depends on DataFlow
- `Admin_Dashboard.md` — depends on Data_Pipeline; references all 4 apps
- `YieldCurves/1.0_Seasonal_Adjustments.md` — depends on TIPS_Basics
- `YieldCurves/2.0_SAO_Adjustment.md` — depends on 1.0_SA
- `YieldCurves/2.1_SA_Intuition.md` — depends on 1.0_SA
- `YieldCurves/3.0_Visual_Standards.md` — depends on 1.0_SA, 2.0_SAO
- `TipsLadderManager/1.0_Bond_Ladders.md` — depends on Bond_Basics
- `TipsLadderManager/2.0_TIPS_Ladders.md` — depends on 1.0_Bond_Ladders, TIPS_Basics
- `TipsLadderManager/2.1_Broker_Import.md` — depends on TIPS_Basics
- `TipsLadderManager/3.0_TIPS_Ladder_Rebalancing.md` — depends on 2.0_TIPS_Ladders, 2.1_Broker_Import
- `TipsLadderManager/3.1_Data_Pipeline.md` — depends on TIPS_Basics
- `TipsLadderManager/4.0_Computation_Modules.md` — depends on 3.0_Rebalancing, TIPS_Basics
- `TipsLadderManager/5.0_UI_Schema.md` — depends on 3.0_Rebalancing, 4.0_Modules
- `TreasuryAuctions/Data_Pipeline.md` — depends on AuctionsQuery_Reference
- `YieldsMonitor/API_Mapping.md` — depends on DATA_DICTIONARY

---

## Phase 3 — KNOWLEDGE_MAP.md

Create `knowledge/KNOWLEDGE_MAP.md` with a Mermaid flowchart:
- Nodes = all knowledge files
- Edges = dependency relationships (arrows point from dependent → dependency)
- Subgraphs: Root / YieldCurves / TipsLadderManager / TreasuryAuctions / YieldsMonitor
- DATA_DICTIONARY at top as a shared foundation node feeding all others
- Canty.md shown as an authority reference (dashed arrow) to SA docs
- `Data_Pipeline_Local.md` shown as gitignored (note in label)

---

## Phase 4 — DD Completeness Audit + Link Strategy

### Terms to add to DATA_DICTIONARY.md
Audit YieldCurves docs for terms not yet in DD:
- SA / Seasonal Adjustment, SAO (SA with Outlier adjustment)
- SACP (Seasonally Adjusted Clean Price), FACP (Fully Adjusted Clean Price) — from Canty
- Blend weights, anchor (long end), sliding window
- Outlier clipping, IQR floor

### Link strategy (agreed: section header approach)
Each doc gets a `## Terms` section listing terms used, each linked to the DD anchor:
```
## Terms
- [Index ratio](../knowledge/DATA_DICTIONARY.md#index-ratio)
- [Par value](../knowledge/DATA_DICTIONARY.md#par-value)
```
Prose uses plain names; links live in the Terms section only.

### TECHNICAL_REFERENCE decision
Decide whether to merge code variable mappings (`indexRatio`, `principalPerBond`, etc.) into DD
as an additional column/section, making TECHNICAL_REFERENCE a pure pointer file or deleting it.

---

## Notes

- `Canty.md` is an academic reference — no number, no deps, keep as-is
- `PROJECT_VISION.md` — strategic doc, no number
- `TECHNICAL_REFERENCE.md` — pending Phase 4 decision
- `Data_Pipeline_Local.md` — gitignored, not in KNOWLEDGE_MAP node list (show as note only)
- All file renames require updating any in-code references (e.g., if scripts reference knowledge files by path)
