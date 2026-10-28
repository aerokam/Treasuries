# Filtering and Columns

**Implemented by:** `TreasuryAuctions/src/app.js` (`detectFmt`, `fmtVal`, `autoMaskDateFilter`, `rowMatchesFilters`, `wireFilterInputs`, `getActiveRows`, `renderTable`, `renderTentative`, `initResizing`)

The Historical Auctions table and the Tentative Schedule table format their values, filter their rows and sort them by the rules below. The Historical Auctions table is specified in [Render Historical Auctions (5.2)](./5.2_Render_Historical_Auctions.md) and the Tentative Schedule table in [Render Tentative Schedule (5.4)](./5.4_Render_Tentative_Schedule.md).

<a id="column-formats"></a>
## Column Formats

- Format a value by the first rule that its field name satisfies:

  | Field name | Display |
  |---|---|
  | contains `cpi` | 5 decimal places |
  | is `bid_to_cover_ratio` | 2 decimal places |
  | contains `ratio` | 5 decimal places |
  | ends with `_date` or `_dt` | mm/dd/yyyy |
  | contains `amt`, `amount`, `awarded`, `awrd`, `recog`, `accepted` or `tendered` | the number with thousands separators |
  | contains `pct`, `threshold` or `increm` | as stored |
  | contains `_rate` or `_yield` | 3 decimal places followed by % |
  | contains `price` or `accrued` | 6 decimal places |
  | any other | as stored |

- Show a value that is not a number as stored. Show an empty value as blank.
- Label a column with the text of its entry in the label table of `app.js` (`FIELD_LABELS`). A field with no entry takes its field name with each underscore replaced by a space and each word capitalized.
- Store the dates of the tentative schedule as `YYYY-MM-DD` and show them as mm/dd/yyyy, as the dates of [Auction results (S5)](../../knowledge/DATA_DICTIONARY.md#s5) are.

<a id="typed-filters"></a>
## Typed Filters

- Place a filter box under each column header of the Historical Auctions table and of the Tentative Schedule table. A row is shown when it satisfies the boxes that hold text. Re-draw the rows 200 ms after the last keystroke.
- Decide whether a row satisfies a box in one function (`rowMatchesFilters`) and wire the boxes in one function (`wireFilterInputs`), each used by both tables.
- Compare a plain entry with the text the cell displays, ignoring case: the row is shown when the displayed text contains the entry. For a date column the displayed text is mm/dd/yyyy, so a typed `10/20` finds 10/20/2026 and never the stored `2026-10-20`.
- Treat an entry that begins with `>`, `<`, `>=` or `<=` as a comparison with the rest of the entry:
  - Exclude a row whose value is empty.
  - For a date column, or an entry that is a date, read the entry as mm/dd/yyyy or m/d/yyyy, convert it to `YYYY-MM-DD`, and compare it with the first 10 characters of the stored value.
  - Otherwise, when the stored value and the entry are both numbers, compare the two numbers. The stored value is compared, not the displayed text, so `>4` on High Yield compares with 4 and not with `4.000%`.
  - Otherwise, treat the whole entry as a plain entry.
- Insert slashes while the user types in a date column's filter box: `10312026` becomes `10/31/2026`. Keep a leading operator in front of the digits, so `>07162026` becomes `>07/16/2026`. Read at most 8 digits.

<a id="calendar-ranges"></a>
## Calendar Date Ranges

- Place a calendar button in the filter cell of each date column of the Historical Auctions table. It opens a From and a To date picker, with Clear and Done buttons, for that column (`shared/src/date-range-filter.js`).
- Show the rows whose stored date is on or after From and on or before To, comparing `YYYY-MM-DD` text. A row with no date in the column is excluded when From is set.
- Highlight the button of a column that has a range set.

<a id="sorting"></a>
## Sorting

- Sort a table by a click on a column header: the first click sorts ascending and each further click on the same header reverses the order. A different header starts ascending.
- Sort a column whose format is a number, a percentage or an amount by its numeric value, and place empty values last in either direction.
- Sort any other column by comparing the stored text, which orders dates correctly.
- Leave the Historical Auctions table in the order of S5 until a header is clicked.

<a id="column-chooser"></a>
## Column Chooser

The sidebar of the Historical Auctions tab lists every column of S5 for the selected view.

- List first the default columns of the view ([Render Historical Auctions](./5.2_Render_Historical_Auctions.md#historical-auctions)), then the other columns in the order of S5.
- Show a column in the table when its box is checked. Clear the box, or click the ✕ in the column header, to hide it.
- Reorder a column by dragging its list entry or its header onto another.
- Narrow the list to the columns whose label or field name contains the text typed in the search box.
- Move the checked columns ahead of the unchecked ones, keeping each group's order, with Sort Selected.
- Restore the view's default columns, their order and the default widths with Reset Defaults.
- Empty the typed filters and the calendar date ranges with Clear Filters. The sort is kept.
- Keep all of this for the page session only. Nothing is stored in the browser.

<a id="column-widths"></a>
## Column Widths

- Size a column to the widest of its header label, its filter box and its cells, unless a width is set.
- Set a width by dragging the right edge of a header, down to a minimum of 30 px. Clear it with a double-click on that edge.
- Start `issue_date` and `maturity_date` at 82 px (`DEFAULT_COL_WIDTHS`), wide enough for a typed mm/dd/yyyy. Their labels, Issue Date and Maturity, are narrower.
- Restore these defaults with Reset Defaults. The widths are held for the page session only.
