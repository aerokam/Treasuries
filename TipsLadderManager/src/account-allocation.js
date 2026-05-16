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
 * Compute account capacity (in TIPS) given account size in dollars
 * Accounts for average cost per TIPS (including index ratio markup)
 *
 * @param {number} sizeInDollars - e.g., 50000
 * @param {number} avgCostPerTIPS - e.g., 1005 (accounts for index ratio)
 * @returns {number} - estimated capacity in TIPS
 */
export function computeAccountCapacity(sizeInDollars, avgCostPerTIPS) {
  if (avgCostPerTIPS <= 0) return 0;
  return Math.round(sizeInDollars / avgCostPerTIPS);
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
  const accountCapacitiesUsed = {}; // track how many TIPS allocated to each account
  const infeasibilities = [];

  // Initialize allocation structure
  for (const acc of accounts) {
    allocation[acc.name] = {};
    accountCapacitiesUsed[acc.name] = 0;
  }

  // Get all funded years and assign tiers
  const fundedYears = Array.from(maturityTiers.keys()).sort((a, b) => a - b);

  // For each CUSIP and each year in target, allocate to accounts by preference
  for (const cusip in targetQuantities) {
    for (const yearStr in targetQuantities[cusip]) {
      const year = parseInt(yearStr);
      const targetQty = targetQuantities[cusip][year];
      if (targetQty <= 0) continue;

      const tier = maturityTiers.get(year) || 'medium';
      const preference = getTierPreference(tier);

      let remaining = targetQty;

      // Try to allocate in preference order
      for (const accountType of preference) {
        if (remaining <= 0) break;

        // Find first account of this type with available capacity
        for (const acc of accounts) {
          if (acc.type !== accountType || remaining <= 0) continue;

          const availableCapacity = acc.capacityInTIPS - (accountCapacitiesUsed[acc.name] || 0);
          const toAllocate = Math.min(remaining, availableCapacity);

          if (toAllocate > 0) {
            if (!allocation[acc.name][cusip]) {
              allocation[acc.name][cusip] = {};
            }
            allocation[acc.name][cusip][year] = toAllocate;
            accountCapacitiesUsed[acc.name] =
              (accountCapacitiesUsed[acc.name] || 0) + toAllocate;
            remaining -= toAllocate;
          }
        }
      }

      // If there's still remaining qty, record as overflow (infeasible if any account overflows)
      if (remaining > 0) {
        infeasibilities.push({
          cusip,
          year,
          remainingQty: remaining,
          reason: 'Insufficient account capacity across all accounts for this maturity',
        });
      }
    }
  }

  return {
    allocation,
    accountCapacitiesUsed,
    infeasibilities,
  };
}

/**
 * Compute per-account cash flows (sell proceeds vs. buy needs)
 *
 * @param {Object} params
 * @param {Object} params.allocation - { [accountName][cusip][year] = allocatedQty }
 * @param {Object} params.currentHoldings - { [accountName][cusip][year] = currentQty }
 * @param {Object} params.costPerBond - { [cusip] = cost }
 * @returns {Object} - { [accountName]: { sellProceeds, buyNeeds, netCash } }
 */
export function computeAccountCashFlows({
  allocation,
  currentHoldings,
  costPerBond,
}) {
  const accountCashFlows = {};
  const accounts = Object.keys(allocation);

  for (const accountName of accounts) {
    let sellProceeds = 0;
    let buyNeeds = 0;

    const accountAlloc = allocation[accountName] || {};
    const accountCurrent = currentHoldings[accountName] || {};

    for (const cusip in accountAlloc) {
      for (const yearStr in accountAlloc[cusip]) {
        const year = parseInt(yearStr);
        const allocatedQty = accountAlloc[cusip][year];
        const currentQty = accountCurrent[cusip]?.[year] || 0;
        const qtyDelta = allocatedQty - currentQty;

        const cost = costPerBond[cusip] || 0;

        if (qtyDelta < 0) {
          sellProceeds += Math.abs(qtyDelta) * cost;
        } else if (qtyDelta > 0) {
          buyNeeds += qtyDelta * cost;
        }
      }
    }

    const netCash = sellProceeds - buyNeeds;
    accountCashFlows[accountName] = {
      sellProceeds: Math.round(sellProceeds * 100) / 100,
      buyNeeds: Math.round(buyNeeds * 100) / 100,
      netCash: Math.round(netCash * 100) / 100,
      feasible: netCash >= 0,
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
        netCash: flows.netCash,
        shortfall: Math.abs(flows.netCash),
        reason: `Account would need $${Math.abs(flows.netCash).toFixed(2)} to complete rebalance but only generates $${flows.sellProceeds.toFixed(2)} in sales.`,
      });
    }
  }

  return {
    feasible,
    infeasibleAccounts,
    summary: accountCashFlows,
  };
}
