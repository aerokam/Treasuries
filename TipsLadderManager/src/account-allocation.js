// account-allocation.js -- Layer 2: Account-aware allocation for multi-account rebalancing
// Implements 3.2_Multi_Account_Rebalancing.md Phase 5

/**
 * Detect account type from account name
 * @param {string} accountName - e.g., "Harry ROTH IRA", "Harry IRA", "McNeill Joint WROS"
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
 * Get buy preference order for a maturity tier
 * @param {string} tier - "short" | "medium" | "long"
 * @returns {string[]} - account types in preference order (most preferred first)
 */
function getTierPreference(tier) {
  switch (tier) {
    case 'short':  return ['taxable', 'roth_ira', 'traditional_ira'];
    case 'medium': return ['roth_ira', 'traditional_ira', 'taxable'];
    case 'long':   return ['traditional_ira', 'roth_ira', 'taxable'];
    default:       return ['taxable', 'roth_ira', 'traditional_ira'];
  }
}

/**
 * Allocate target quantities to accounts using direction-preserving algorithm.
 *
 * Core constraint: within a single account, for any funded year, all transactions
 * must be in one direction (buy OR sell, never both). Cross-account sell+buy of the
 * same TIPS is allowed.
 *
 * @param {Object} params
 * @param {Object} params.accountMetadata - { [name]: { name, type, sizeInDollars } }
 * @param {Object} params.targetQuantities - { [cusip][year] = targetQty }
 * @param {Map<number, string>} params.maturityTiers - year → "short" | "medium" | "long"
 * @param {Object} params.costPerBond - { [cusip] = cost }
 * @param {Object} [params.rmdByAccount] - { [tIRAaccountName]: rmdAnnualAmountDollars }
 * @param {Object} [params.currentHoldingsByAccount] - { [accountName][cusip][year] = qty }
 * @param {Set<string>} [params.excludedFromBuy] - CUSIPs that cannot be purchased
 * @returns {Object} - { allocation, accountDollarsSpent, infeasibilities }
 */
export function allocateToAccounts({
  accountMetadata,
  targetQuantities,
  maturityTiers,
  costPerBond,
  rmdByAccount = {},
  currentHoldingsByAccount = {},
  excludedFromBuy = new Set(),
}) {
  const accounts = Object.values(accountMetadata);
  const allocation = {}; // { [accountName][cusip][year] = qty }
  const accountDollarsSpent = {};
  const infeasibilities = [];

  // Average cost for unknown CUSIPs
  const allCosts = Object.values(costPerBond);
  const avgCostPerTIPS = allCosts.length > 0
    ? allCosts.reduce((s, c) => s + c, 0) / allCosts.length
    : 1000;

  // Initialize allocation and budget from current holdings
  for (const acc of accounts) {
    allocation[acc.name] = {};
    accountDollarsSpent[acc.name] = 0;
  }

  for (const [accName, holdingsByCusip] of Object.entries(currentHoldingsByAccount)) {
    if (!allocation[accName]) allocation[accName] = {};
    for (const [cusip, holdingsByYear] of Object.entries(holdingsByCusip)) {
      if (!allocation[accName][cusip]) allocation[accName][cusip] = {};
      for (const [yearStr, qty] of Object.entries(holdingsByYear)) {
        if (qty <= 0) continue;
        const year = parseInt(yearStr);
        allocation[accName][cusip][year] = qty;
        const cost = costPerBond[cusip] ?? avgCostPerTIPS;
        accountDollarsSpent[accName] = (accountDollarsSpent[accName] || 0) + qty * cost;
      }
    }
  }

  // Build complete set of (cusip, year) pairs: targets + current holdings
  const pairsMap = new Map(); // `${cusip}|${year}` → { cusip, year, targetQty }

  for (const cusip in targetQuantities) {
    for (const yearStr in targetQuantities[cusip]) {
      const year = parseInt(yearStr);
      pairsMap.set(`${cusip}|${year}`, { cusip, year, targetQty: targetQuantities[cusip][yearStr] || 0 });
    }
  }

  for (const holdingsByCusip of Object.values(currentHoldingsByAccount)) {
    for (const cusip in holdingsByCusip) {
      for (const yearStr in holdingsByCusip[cusip]) {
        const year = parseInt(yearStr);
        const key = `${cusip}|${year}`;
        if (!pairsMap.has(key)) {
          pairsMap.set(key, { cusip, year, targetQty: 0 });
        }
      }
    }
  }

  // Compute netDelta for each pair
  const allTargets = [];
  for (const { cusip, year, targetQty } of pairsMap.values()) {
    let totalCurrent = 0;
    for (const accName in currentHoldingsByAccount) {
      totalCurrent += (currentHoldingsByAccount[accName][cusip]?.[year] || 0);
    }
    const netDelta = targetQty - totalCurrent;
    allTargets.push({ cusip, year, targetQty, netDelta });
  }

  // Sort: ALL sells before ALL buys (so sell proceeds free budget before any buy runs),
  // then year DESC within each group (longest-maturity sells/buys first).
  // Direction-preservation is maintained because sellYearsByAccount is fully populated
  // before any buy is processed.
  allTargets.sort((a, b) => {
    const aIsSell = a.netDelta < 0 ? 0 : 1;
    const bIsSell = b.netDelta < 0 ? 0 : 1;
    if (aIsSell !== bIsSell) return aIsSell - bIsSell;
    return b.year - a.year;
  });

  // Pre-scan: accounts holding a CUSIP whose target is 0 are committed sellers for that year
  const sellYearsByAccount = {}; // { [accName]: Set<year> }

  for (const [accName, holdingsByCusip] of Object.entries(currentHoldingsByAccount)) {
    for (const cusip in holdingsByCusip) {
      for (const [yearStr, qty] of Object.entries(holdingsByCusip[cusip])) {
        if (qty <= 0) continue;
        const year = parseInt(yearStr);
        const targetQty = targetQuantities[cusip]?.[year] ?? 0;
        if (targetQty === 0) {
          if (!sellYearsByAccount[accName]) sellYearsByAccount[accName] = new Set();
          sellYearsByAccount[accName].add(year);
        }
      }
    }
  }

  // Main allocation loop
  for (const { cusip, year, netDelta } of allTargets) {
    const costThisCusip = costPerBond[cusip] ?? avgCostPerTIPS;
    const tier = maturityTiers instanceof Map ? maturityTiers.get(year) : maturityTiers[year];
    const prefOrder = getTierPreference(tier);

    if (netDelta > 0 && !excludedFromBuy.has(cusip)) {
      // ── NET BUY ──
      let remaining = netDelta;

      // RMD priority: fill tIRA accounts first to ensure minimum bonds for distributions.
      // Intentionally does NOT check sellYearsByAccount — RMD is a legal obligation that
      // supersedes the direction-preserving constraint (e.g. CUSIP transitions where the
      // old CUSIP is sold and the new one must still land in the IRA to cover RMDs).
      for (const [accName, rmdAmount] of Object.entries(rmdByAccount)) {
        if (remaining <= 0) break;
        const acc = accounts.find(a => a.name === accName && a.type === 'traditional_ira');
        if (!acc) continue;

        const rmdMinQty = Math.ceil(rmdAmount / costThisCusip);
        const currentInAcc = allocation[accName][cusip]?.[year] || 0;
        const additionalForRMD = Math.max(0, rmdMinQty - currentInAcc);
        if (additionalForRMD <= 0) continue;

        const budgetAvail = acc.sizeInDollars - (accountDollarsSpent[accName] || 0);
        const maxAffordable = Math.floor(budgetAvail / costThisCusip);
        const toAdd = Math.min(additionalForRMD, remaining, maxAffordable);

        if (toAdd > 0) {
          if (!allocation[accName][cusip]) allocation[accName][cusip] = {};
          allocation[accName][cusip][year] = (allocation[accName][cusip][year] || 0) + toAdd;
          accountDollarsSpent[accName] = (accountDollarsSpent[accName] || 0) + toAdd * costThisCusip;
          remaining -= toAdd;
        }
      }

      // Tier-preference fill for remaining quantity
      for (const accountType of prefOrder) {
        if (remaining <= 0) break;
        for (const acc of accounts) {
          if (acc.type !== accountType || remaining <= 0) continue;
          if (sellYearsByAccount[acc.name]?.has(year)) continue;

          const budgetAvail = acc.sizeInDollars - (accountDollarsSpent[acc.name] || 0);
          const maxAffordable = Math.floor(budgetAvail / costThisCusip);
          const toAdd = Math.min(remaining, maxAffordable);

          if (toAdd > 0) {
            if (!allocation[acc.name][cusip]) allocation[acc.name][cusip] = {};
            allocation[acc.name][cusip][year] = (allocation[acc.name][cusip][year] || 0) + toAdd;
            accountDollarsSpent[acc.name] = (accountDollarsSpent[acc.name] || 0) + toAdd * costThisCusip;
            remaining -= toAdd;
          }
        }
      }

      if (remaining > 0) {
        infeasibilities.push({
          cusip,
          year,
          remainingQty: remaining,
          reason: 'Insufficient total account capacity to accommodate all target TIPS',
        });
      }

    } else if (netDelta < 0) {
      // ── NET SELL ── remove from least-preferred accounts first
      let toRemove = -netDelta;
      const reversePrefOrder = [...prefOrder].reverse();

      for (const accountType of reversePrefOrder) {
        if (toRemove <= 0) break;
        for (const acc of accounts) {
          if (acc.type !== accountType || toRemove <= 0) continue;

          const currentHeld = allocation[acc.name][cusip]?.[year] || 0;

          // tIRA: never sell below the RMD floor for this year
          const rmdFloor = (acc.type === 'traditional_ira' && rmdByAccount[acc.name])
            ? Math.ceil(rmdByAccount[acc.name] / costThisCusip)
            : 0;
          const canRemove = Math.min(toRemove, Math.max(0, currentHeld - rmdFloor));

          if (canRemove > 0) {
            allocation[acc.name][cusip][year] -= canRemove;
            accountDollarsSpent[acc.name] = (accountDollarsSpent[acc.name] || 0) - canRemove * costThisCusip;
            toRemove -= canRemove;
            if (!sellYearsByAccount[acc.name]) sellYearsByAccount[acc.name] = new Set();
            sellYearsByAccount[acc.name].add(year);
          }
        }
      }
    }
    // netDelta === 0: allocation already initialized from current holdings, no action
  }

  return {
    allocation,
    accountDollarsSpent,
    infeasibilities,
  };
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
