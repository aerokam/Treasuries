// account-allocation.js -- Layer 2: Account-aware allocation for multi-account rebalancing
// Implements 3.2_Multi_Account_Rebalancing.md Phase 5

/**
 * Detect account type from account name
 * @param {string} accountName - e.g., "Owner4 ROTH IRA", "Owner4 IRA", "Owner14 Joint WROS"
 * @returns {string} - "roth_ira" | "traditional_ira" | "taxable"
 */
export function detectAccountType(accountName) {
  if (!accountName) return 'taxable';
  const name = accountName.toUpperCase();
  if (name.includes('ROTH')) return 'roth_ira';
  if (name.includes('IRA')) return 'traditional_ira';
  return 'taxable';
}

/**
 * Allocate target quantities to accounts using a liquidate-and-rebuild model.
 *
 * All accounts are treated as fully liquidated. Target bonds are placed longest-
 * maturity first into IRA accounts (tIRA, then Roth), then taxable, until each
 * account's budget is exhausted. No tier buckets — the IRA/taxable boundary is
 * the natural cutoff where IRA runs out of money.
 *
 * @param {Object} params
 * @param {Object} params.accountMetadata - { [name]: { name, type, sizeInDollars } }
 * @param {Object} params.targetQuantities - { [cusip][year] = targetQty }
 * @param {Object} params.costPerBond - { [cusip] = cost }
 * @param {Object} [params.rmdByAccount] - { [tIRAaccountName]: rmdAnnualAmountDollars }
 * @param {Set<string>} [params.excludedFromBuy] - CUSIPs that cannot be purchased
 * @returns {Object} - { allocation, accountDollarsSpent, infeasibilities }
 */
export function allocateToAccounts({
  accountMetadata,
  targetQuantities,
  costPerBond,
  rmdByAccount = {},
  excludedFromBuy = new Set(),
  // unused legacy params kept for call-site compatibility:
  maturityTiers,
  currentHoldingsByAccount,
}) {
  const accounts = Object.values(accountMetadata);
  const allocation = {};
  const accountDollarsSpent = {};
  const infeasibilities = [];

  const allCosts = Object.values(costPerBond);
  const avgCostPerTIPS = allCosts.length > 0
    ? allCosts.reduce((s, c) => s + c, 0) / allCosts.length
    : 1000;

  for (const acc of accounts) {
    allocation[acc.name] = {};
    accountDollarsSpent[acc.name] = 0;
  }

  // Bonds too close to maturity cannot be traded — keep them in their current accounts.
  // Without this, the liquidate-from-zero model would show them as SELL everywhere.
  if (currentHoldingsByAccount) {
    for (const [accName, holdingsByCusip] of Object.entries(currentHoldingsByAccount)) {
      if (!allocation[accName]) continue;
      for (const [cusip, holdingsByYear] of Object.entries(holdingsByCusip)) {
        if (!excludedFromBuy.has(cusip)) continue;
        for (const [yearStr, qty] of Object.entries(holdingsByYear)) {
          if (qty <= 0) continue;
          const cost = costPerBond[cusip] ?? avgCostPerTIPS;
          if (!allocation[accName][cusip]) allocation[accName][cusip] = {};
          allocation[accName][cusip][parseInt(yearStr)] = qty;
          accountDollarsSpent[accName] += qty * cost;
        }
      }
    }
  }

  // Pre-lock RMD bonds in tIRA for years where current holdings already cover the minimum.
  // Without this, the liquidate model treats all IRA bonds as sold, leaving zero for RMD.
  // "If enough there, keep it" — lock rmdMinQty from existing holdings before any fill runs.
  const rmdSatisfiedYears = {}; // { [accName]: Set<year> } — year already covered, skip Pass 1
  if (currentHoldingsByAccount && Object.keys(rmdByAccount).length > 0) {
    for (const [accName, rmdAmount] of Object.entries(rmdByAccount)) {
      const acc = accountMetadata[accName];
      if (!acc || acc.type !== 'traditional_ira') continue;
      const holdingsByCusip = currentHoldingsByAccount[accName] || {};

      const yearsWithHoldings = new Set();
      for (const cusip in holdingsByCusip) {
        if (excludedFromBuy.has(cusip)) continue;
        for (const yearStr in holdingsByCusip[cusip]) {
          if ((holdingsByCusip[cusip][yearStr] || 0) > 0) yearsWithHoldings.add(parseInt(yearStr));
        }
      }

      for (const year of yearsWithHoldings) {
        const cusipsInYear = [];
        for (const cusip in holdingsByCusip) {
          if (excludedFromBuy.has(cusip)) continue;
          const qty = holdingsByCusip[cusip][year] || 0;
          if (qty <= 0) continue;
          cusipsInYear.push({ cusip, qty, cost: costPerBond[cusip] ?? avgCostPerTIPS });
        }
        if (cusipsInYear.length === 0) continue;

        const repCost = cusipsInYear[0].cost;
        const rmdMinQty = Math.ceil(rmdAmount / repCost);
        const totalCurrentQty = cusipsInYear.reduce((s, c) => s + c.qty, 0);
        if (totalCurrentQty < rmdMinQty) continue; // shortfall — Pass 1 handles it

        // Lock rmdMinQty bonds (current CUSIP order; "sell earlier maturity" means
        // prefer keeping later-maturity CUSIPs, but single-CUSIP years need no sort).
        let toLock = rmdMinQty;
        for (const { cusip, qty, cost } of cusipsInYear) {
          const lockQty = Math.min(toLock, qty);
          if (lockQty <= 0) break;
          if (!allocation[accName][cusip]) allocation[accName][cusip] = {};
          allocation[accName][cusip][year] = (allocation[accName][cusip][year] || 0) + lockQty;
          accountDollarsSpent[accName] += lockQty * cost;
          toLock -= lockQty;
          if (toLock <= 0) break;
        }

        if (!rmdSatisfiedYears[accName]) rmdSatisfiedYears[accName] = new Set();
        rmdSatisfiedYears[accName].add(year);
      }
    }
  }

  // Fill order: tIRA first, then Roth IRA, then taxable
  const TYPE_ORDER = ['traditional_ira', 'roth_ira', 'taxable'];
  const orderedAccounts = [...accounts].sort(
    (a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)
  );

  // All target bonds sorted longest to shortest
  const allTargets = [];
  for (const cusip in targetQuantities) {
    for (const yearStr in targetQuantities[cusip]) {
      const year = parseInt(yearStr);
      const targetQty = targetQuantities[cusip][yearStr] || 0;
      if (targetQty <= 0 || excludedFromBuy.has(cusip)) continue;
      allTargets.push({ cusip, year, targetQty });
    }
  }
  allTargets.sort((a, b) => b.year - a.year);

  // Pre-scan: mark accounts as committed sellers for a funded year when they hold
  // a CUSIP whose global target is 0 (CUSIP being fully exited). Those accounts
  // cannot also buy a different CUSIP for the same funded year — direction constraint.
  // Excluded bonds (held in place, not traded) are exempt from this scan.
  const sellYearsByAccount = {};
  if (currentHoldingsByAccount) {
    for (const [accName, holdingsByCusip] of Object.entries(currentHoldingsByAccount)) {
      for (const [cusip, holdingsByYear] of Object.entries(holdingsByCusip)) {
        if (excludedFromBuy.has(cusip)) continue;
        for (const [yearStr, qty] of Object.entries(holdingsByYear)) {
          if (qty <= 0) continue;
          const year = parseInt(yearStr);
          if (qty > (targetQuantities[cusip]?.[year] ?? 0)) {
            if (!sellYearsByAccount[accName]) sellYearsByAccount[accName] = new Set();
            sellYearsByAccount[accName].add(year);
          }
        }
      }
    }
  }

  // Pass 1 — RMD reservation (shortest-first so near-term years are covered first).
  // Pre-place rmdMinQty bonds into each tIRA for every year before the main fill
  // runs. Without this, the IRA fills up with the longest bonds and has no budget
  // left when short-year RMD bonds are processed.
  if (Object.keys(rmdByAccount).length > 0) {
    const shortestFirst = [...allTargets].sort((a, b) => a.year - b.year);
    for (const [accName, rmdAmount] of Object.entries(rmdByAccount)) {
      const acc = accountMetadata[accName];
      if (!acc || acc.type !== 'traditional_ira') continue;
      for (const { cusip, year, targetQty } of shortestFirst) {
        if (rmdSatisfiedYears[accName]?.has(year)) continue; // already locked via pre-lock
        if (sellYearsByAccount[accName]?.has(year)) continue;
        const cost = costPerBond[cusip] ?? avgCostPerTIPS;
        const rmdMinQty = Math.ceil(rmdAmount / cost);
        const toReserve = Math.min(
          rmdMinQty, targetQty,
          Math.floor((acc.sizeInDollars - accountDollarsSpent[accName]) / cost)
        );
        if (toReserve > 0) {
          if (!allocation[accName][cusip]) allocation[accName][cusip] = {};
          allocation[accName][cusip][year] = (allocation[accName][cusip][year] || 0) + toReserve;
          accountDollarsSpent[accName] += toReserve * cost;
        }
      }
    }
  }

  // Pass 2 — fill remaining longest-first, IRA then taxable
  for (const { cusip, year, targetQty } of allTargets) {
    const costThisCusip = costPerBond[cusip] ?? avgCostPerTIPS;

    // Count bonds already placed (from RMD reservation)
    let alreadyPlaced = 0;
    for (const acc of accounts) alreadyPlaced += allocation[acc.name][cusip]?.[year] || 0;
    let remaining = targetQty - alreadyPlaced;

    // Fill accounts in order until remaining is satisfied
    for (const acc of orderedAccounts) {
      if (remaining <= 0) break;
      if (sellYearsByAccount[acc.name]?.has(year)) continue;
      const budgetAvail = acc.sizeInDollars - accountDollarsSpent[acc.name];
      const toAdd = Math.min(remaining, Math.floor(budgetAvail / costThisCusip));
      if (toAdd > 0) {
        if (!allocation[acc.name][cusip]) allocation[acc.name][cusip] = {};
        allocation[acc.name][cusip][year] = (allocation[acc.name][cusip][year] || 0) + toAdd;
        accountDollarsSpent[acc.name] += toAdd * costThisCusip;
        remaining -= toAdd;
      }
    }

    if (remaining > 0) {
      infeasibilities.push({
        cusip, year, remainingQty: remaining,
        reason: 'Insufficient total account capacity to accommodate all target TIPS',
      });
    }
  }

  return { allocation, accountDollarsSpent, infeasibilities };
}

/**
 * Compute per-account allocation feasibility (liquidate-and-rebuild model)
 *
 * @param {Object} params
 * @param {Object} params.allocation - { [accountName][cusip][year] = allocatedQty }
 * @param {Object} params.currentHoldings - { [accountName][cusip][year] = currentQty }
 * @param {Object} params.costPerBond - { [cusip] = cost }
 * @param {Object} params.accountSizes - { [accountName]: sizeInDollars }
 * @returns {Object} - { [accountName]: { currentValue, newAllocationCost, budget, shortfall, feasible } }
 */
export function computeAccountCashFlows({
  allocation,
  currentHoldings,
  costPerBond,
  accountSizes,
}) {
  const accountCashFlows = {};
  const accounts = Object.keys(allocation);

  for (const accountName of accounts) {
    const budget = accountSizes[accountName] ?? 0;

    const accountAlloc = allocation[accountName] || {};
    const accountCurrent = currentHoldings[accountName] || {};

    let currentValue = 0;
    for (const cusip in accountCurrent) {
      for (const yearStr in accountCurrent[cusip]) {
        const qty = accountCurrent[cusip][yearStr];
        const cost = costPerBond[cusip] || 0;
        currentValue += qty * cost;
      }
    }

    let newAllocationCost = 0;
    for (const cusip in accountAlloc) {
      for (const yearStr in accountAlloc[cusip]) {
        const qty = accountAlloc[cusip][yearStr];
        const cost = costPerBond[cusip] || 0;
        newAllocationCost += qty * cost;
      }
    }

    const shortfall = Math.max(0, newAllocationCost - budget);
    const feasible = shortfall === 0;

    accountCashFlows[accountName] = {
      currentValue: Math.round(currentValue * 100) / 100,
      newAllocationCost: Math.round(newAllocationCost * 100) / 100,
      budget: Math.round(budget * 100) / 100,
      shortfall: Math.round(shortfall * 100) / 100,
      feasible,
    };
  }

  return accountCashFlows;
}

/**
 * Generate a feasibility report
 *
 * @param {Object} accountCashFlows - from computeAccountCashFlows
 * @returns {Object} - { feasible, infeasibleAccounts, summary }
 */
export function generateFeasibilityReport(accountCashFlows) {
  const infeasibleAccounts = [];
  let feasible = true;

  for (const [accountName, flows] of Object.entries(accountCashFlows)) {
    if (!flows.feasible) {
      feasible = false;
      infeasibleAccounts.push({
        account: accountName,
        shortfall: flows.shortfall,
        newAllocationCost: flows.newAllocationCost,
        budget: flows.budget,
        reason: `Allocation costs $${flows.newAllocationCost.toFixed(2)} but budget is $${flows.budget.toFixed(2)} (shortfall: $${flows.shortfall.toFixed(2)}).`,
      });
    }
  }

  return {
    feasible,
    infeasibleAccounts,
    summary: accountCashFlows,
  };
}
