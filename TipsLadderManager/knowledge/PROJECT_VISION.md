# TIPS Ladder Manager: Project Vision

## Purpose

A web-based tool for building and rebalancing [TIPS Ladders](../../knowledge/DATA_DICTIONARY.md#tips-ladder). It is meant to support investment decisions and to teach: every number on screen can be explained down to first principles.

---

## What the App Does

- **Build** constructs a TIPS Ladder from a [DARA](../../knowledge/DATA_DICTIONARY.md#dara), a First Year and a Last Year ([Build Ladder (4.3)](./4.3_Build_Ladder.md)).
- **Rebalance** reads the user's holdings and computes the trades that bring them to the ladder ([Rebalance Ladder (4.4)](./4.4_Rebalance_Ladder.md), [TIPS Ladder Rebalancing (3.0)](./3.0_TIPS_Ladder_Rebalancing.md)).

---

## Design Principles

### 1. Educational over opaque
Every displayed value traces from popup to formula to spec section. A user who clicks through every popup sees how a TIPS Ladder is constructed.

### 2. Spec-first development
The knowledge files are the source of truth. The code implements the spec, and the spec is not inferred from the code. A calculation question is answered from the spec first and then verified in the code.

### 3. Build and Rebalance share one foundation
Both calculate the same quantities from the same formulas and differ only in the state before the run: Rebalance has the holdings, Build has none. The code follows that foundation, and [TIPS Ladder Rebalancing (3.0)](./3.0_TIPS_Ladder_Rebalancing.md) §Build ≡ Rebalance states the invariant.

### 4. Progressive disclosure
- The main table shows the values the user acts on.
- A popup, one click from a cell, shows the calculation chain of that cell.
- A second-level popup, one click from a popup row, shows a component of the chain, such as a duration calculation ([4.5.2 Show drill popups](./4.5.2_Show_Drill_Popups.md)).

---

## Knowledge Architecture

The `knowledge/` directory is the spec layer. Lower-numbered specs are the foundation of higher-numbered ones:

- **1.0** [Bond Ladders](./1.0_Bond_Ladders.md), which requires [Bond Basics](../../knowledge/Bond_Basics.md)
- **2.0** [TIPS Ladders](./2.0_TIPS_Ladders.md); requires [TIPS Basics](../../knowledge/TIPS_Basics.md)
- **3.0** [TIPS Ladder Rebalancing](./3.0_TIPS_Ladder_Rebalancing.md), with **3.1** [Data Pipeline](./3.1_Data_Pipeline.md)
- **4.0** [Computation Modules](./4.0_Computation_Modules.md), with **4.1** to **4.6**, one spec for each process
- **6.0** [UI Layout](./6.0_UI_Layout.md)

The terms are defined once, in the [Data Dictionary](../../knowledge/DATA_DICTIONARY.md). The [Technical Reference](./TECHNICAL_REFERENCE.md) maps them to code symbols.

A new displayed value is specified in the appropriate spec first and then implemented. The chain from the screen to the code:

```
UI display → popup row (4.5.2) → spec section (2.0, 3.0 or 4.x) → code symbol (Technical Reference) → implementation
```
