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
 * Assign each (CUSIP, year) in the target ladder to a maturity tier
 * @param {number[]} fundedYears - all funded years in the ladder, sorted
 * @returns {Map<number, string>} - year → "short" | "medium" | "long"
 */
function assignMaturityTiers(fundedYears) {
  const tierMap = new Map();
  if (fundedYears.length === 0) return tierMap;

  const thirdSize = Math.ceil(fundedYears.length / 3);
  fundedYears.forEach((year, idx) => {
    if (idx < thirdSize) {
      tierMap.set(year, 'short');
    } else if (idx < 2 * thirdSize) {
      tierMap.set(year, 'medium');
    } else {
      tierMap.set(year, 'long');
    }
  });

  return tierMap;
}

/**
 * Get preference order for allocating a given maturity tier
 * @param {string} tier - "short" | "medium" | "long"
 * @returns {string[]} - account types in preference order
 */
function getTierPreference(tier) {
  switch (tier) {
    case 'short':
      return ['taxable', 'roth_ira', 'traditional_ira'];
    case 'medium':
      return ['roth_ira', 'traditional_ira', 'taxable'];
    case 'long':
      return ['traditional_ira', 'roth_ira', 'taxable'];
    default:
      return ['taxable', 'roth_ira', 'traditional_ira'];
  }
}

/**
 * Allocate target quantities to accounts respecting tax preferences and capacity
 *
 * @param {Object} params
 * @param {Map<string, Object>} params.accountMetadata - { name, type, sizeInDollars, capacityInTIPS }
 * @param {Object} params.targetQuantities - { [cusip][year] = qty }
 * @param {Map<number, string>} params.maturityTiers - year → tier
 * @param {Object} params.costPerBond - { [cusip] = cost }
 * @returns {Object} - { allocation, accountCapacitiesUsed, infeasible }
 */
export function allocateToAccounts({
  accountMetadata,
  targetQuantities,
  maturityTiers,
  costPerBond,
}) {
  const accounts = Object.values(accountMetadata);
  const allocation = {}; // { [accountName][cusip][year] = qty }
  const accountDollarsSpent = {}; // track dollars allocated to each account
  const infeasibilities = [];

  // Initialize allocation structure
  for (const acc of accounts) {
    allocation[acc.name] = {};
    accountDollarsSpent[acc.name] = 0;
  }

  // Compute fallback avgCostPerTIPS from costPerBond values
  const allCosts = Object.values(costPerBond);
  const avgCostPerTIPS = allCosts.length > 0
    ? allCosts.reduce((s, c) => s + c, 0) / allCosts.length
    : 1000;

  // Greedy fill: create flat list of all target TIPS, sorted by maturity (longest first)
  const allTargets = [];
  for (const cusip in targetQuantities) {
    for (const yearStr in targetQuantities[cusip]) {
      const year = parseInt(yearStr);
      const qty = targetQuantities[cusip][year];
      if (qty > 0) {
        allTargets.push({ cusip, year, qty });
      }
    }
  }

  // Sort by maturity year descending (longest maturity first)
  allTargets.sort((a, b) => b.year - a.year);

  // Account type preference order: Traditional IRA first (gets longest TIPS), then Roth, then Taxable
  const typePreferenceOrder = ['traditional_ira', 'roth_ira', 'taxable'];

  // Greedy allocation: fill accounts in type preference order
  for (const { cusip, year, qty } of allTargets) {
    let remaining = qty;

    // Try each account type in preference order
    for (const accountType of typePreferenceOrder) {
      if (remaining <= 0) break;

      // Find first account of this type with available capacity
      for (const acc of accounts) {
        if (acc.type !== accountType || remaining <= 0) continue;

        const costThisCusip = costPerBond[cusip] ?? avgCostPerTIPS;
        const remainingBudget = acc.sizeInDollars - (accountDollarsSpent[acc.name] || 0);
        const maxAffordable = Math.floor(remainingBudget / costThisCusip);
        const toAllocate = Math.min(remaining, maxAffordable);

        if (toAllocate > 0) {
          if (!allocation[acc.name][cusip]) {
            allocation[acc.name][cusip] = {};
          }
          allocation[acc.name][cusip][year] = toAllocate;
          accountDollarsSpent[acc.name] = (accountDollarsSpent[acc.name] || 0) + toAllocate * costThisCusip;
          remaining -= toAllocate;
        }
      }
    }

    // If still remaining after all accounts, record as infeasible
    if (remaining > 0) {
      infeasibilities.push({
        cusip,
        year,
        remainingQty: remaining,
        reason: 'Insufficient total account capacity to accommodate all target TIPS',
      });
    }
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

    // Informational: current value of TIPS in this account
    let currentValue = 0;
    for (const cusip in accountCurrent) {
      for (const yearStr in accountCurrent[cusip]) {
        const qty = accountCurrent[cusip][yearStr];
        const cost = costPerBond[cusip] || 0;
        currentValue += qty * cost;
      }
    }

    // Feasibility check: does new allocation cost fit within budget?
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
