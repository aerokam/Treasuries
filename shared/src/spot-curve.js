// Nelson-Siegel-Svensson curve fitting — the SAO smooth-curve fit and the price-space
// zero-coupon (spot) curve fit. Single source of truth for both: the YieldCurves browser
// app (src/app.js) and any pipeline script that persists the same fitted curves import
// this module rather than keeping their own copy.
// See YieldCurves/knowledge/3.3_SAO_Adjustment.md and 3.4_Spot_Yield_Curves.md.

import { cashflowSchedule } from './bond-math.js';
import { localDate } from './settlement.js';

// SAO "O" step — a SMOOTH-CURVE FIT, not Canty's inflation-shock outlier factor.
// See knowledge/3.3_SAO_Adjustment.md and SAO_Residual_Analysis.md.
//
// Canty's O_t (Eq 20–21) adjusts for *known, non-seasonal* inflation shocks not yet
// in the CPI (VAT hike, a gasoline move since the last print) — determined analytically
// per event. We do NOT compute that. Our "O" step instead snaps each SA real-yield
// point to a smooth fair-value curve: for a buy-and-hold holder, indifferent to
// liquidity/relative-value, any deviation from a smooth curve that ISN'T explained by
// a value-relevant factor (coupon, index ratio — both empirically immaterial here)
// is noise to be removed. So SAO_i = smoothCurve(maturity_i) for every TIPS.
//
// The smooth curve is Nelson-Siegel-Svensson (the Fed/GSW real-yield-curve standard).
export const SAO_NOISE_YRS = 0.5;  // exclude < this from the FIT (near-maturity SA is price-noise-dominated)

// The deseasonalization residual that motivates smoothing is a front-end phenomenon that
// amortizes with maturity (see 2.2 §2, extended full-curve analysis in 2.2 §6): beyond
// ~5-6yrs the SA curve is already smooth on its own, so snapping it to NSS there would
// smooth away genuine coupon/relative-value structure instead of seasonal residual.
// So the curve-fit weight declines from 1 (full snap) to 0 (report raw SA) over this band;
// between the two the SAO yield is a blend of the two.
export const SAO_BLEND_START_YRS = 5.0;
export const SAO_BLEND_END_YRS = 6.0;

// NSS basis at maturity τ for decay params λ1, λ2: [level, slope, curv1, curv2].
export function nssBasis(tau, l1, l2) {
  const a = tau / l1, b = tau / l2;
  const f1 = a > 1e-6 ? (1 - Math.exp(-a)) / a : 1;
  const fb = b > 1e-6 ? (1 - Math.exp(-b)) / b : 1;
  return [1, f1, f1 - Math.exp(-a), fb - Math.exp(-b)];
}
// OLS for the 4 linear betas (given λ's) via 4×4 normal equations + Gaussian elimination.
export function ols4(X, y) {
  const A = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]], bv = [0,0,0,0];
  for (let k = 0; k < X.length; k++) {
    const xi = X[k];
    for (let i = 0; i < 4; i++) { bv[i] += xi[i] * y[k]; for (let j = 0; j < 4; j++) A[i][j] += xi[i] * xi[j]; }
  }
  const M = A.map((r, i) => [...r, bv[i]]);
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < 4; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 5; k++) M[r][k] -= f * M[c][k]; }
  }
  return [M[0][4]/M[0][0], M[1][4]/M[1][1], M[2][4]/M[2][2], M[3][4]/M[3][3]];
}
// Fit NSS: grid-search the two decay params (betas are linear given λ's), keep best SSR.
// Returns an evaluator τ → yield, or null if degenerate.
export function fitNSS(taus, ys) {
  if (taus.length < 4) return null;
  const grid = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7, 10, 15, 20, 30];
  let best = null;
  for (const l1 of grid) for (const l2 of grid) {
    if (l2 <= l1) continue;
    const X = taus.map(t => nssBasis(t, l1, l2));
    const beta = ols4(X, ys);
    if (!beta) continue;
    let ssr = 0;
    for (let k = 0; k < taus.length; k++) {
      const xb = nssBasis(taus[k], l1, l2);
      const yh = xb[0]*beta[0] + xb[1]*beta[1] + xb[2]*beta[2] + xb[3]*beta[3];
      ssr += (ys[k] - yh) ** 2;
    }
    if (!best || ssr < best.ssr) best = { l1, l2, beta, ssr };
  }
  if (!best) return null;
  const fn = tau => {
    const xb = nssBasis(tau, best.l1, best.l2);
    return xb[0]*best.beta[0] + xb[1]*best.beta[1] + xb[2]*best.beta[2] + xb[3]*best.beta[3];
  };
  fn._params = best;
  return fn;
}

// True zero-coupon (spot) curve: fit Svensson so the model price of each bond — its cash
// flows discounted with z(t) — matches the observed dirty price, weighted 1/√duration so
// long bonds don't dominate. Grid-search the two decay params; for each, Gauss-Newton on
// the four (nonlinear) betas from the YTM-fit start. Returns z(t) in %, CONTINUOUSLY
// COMPOUNDED (matches GSW's TIPSY convention), or null.
// specs: [{ t, ytm, dirty, times:[yrs], cf:[per100], wt }]
export function fitSpotNSS(specs) {
  if (specs.length < 5) return null;
  const evalZ = (beta, l1, l2, t) => {
    const p = nssBasis(t, l1, l2);
    return (p[0]*beta[0] + p[1]*beta[1] + p[2]*beta[2] + p[3]*beta[3]) / 100; // decimal
  };
  const modelPrice = (beta, l1, l2, s) => {
    let P = 0;
    for (let k = 0; k < s.times.length; k++) P += s.cf[k] * Math.exp(-evalZ(beta, l1, l2, s.times[k]) * s.times[k]);
    return P;
  };
  const grid = [1, 1.5, 2, 2.5, 3, 4, 5, 7, 10, 15, 20, 30];
  let best = null;
  for (const l1 of grid) for (const l2 of grid) {
    if (l2 <= l1) continue;
    let beta = ols4(specs.map(s => nssBasis(s.t, l1, l2)), specs.map(s => s.ytm));
    if (!beta) continue;
    for (let iter = 0; iter < 8; iter++) {
      const J = [], resid = [];
      for (const s of specs) {
        const sw = Math.sqrt(s.wt);
        const dP = [0, 0, 0, 0];
        let P = 0;
        for (let k = 0; k < s.times.length; k++) {
          const tk = s.times[k], phi = nssBasis(tk, l1, l2);
          const pv = s.cf[k] * Math.exp(-evalZ(beta, l1, l2, tk) * tk);
          P += pv;
          for (let j = 0; j < 4; j++) dP[j] += pv * (-tk * phi[j] / 100);
        }
        resid.push((s.dirty - P) * sw);
        J.push(dP.map(d => d * sw));
      }
      const db = ols4(J, resid);
      if (!db) break;
      beta = beta.map((b, j) => b + db[j]);
      if (Math.max(...db.map(Math.abs)) < 1e-7) break;
    }
    let ssr = 0;
    for (const s of specs) ssr += s.wt * (s.dirty - modelPrice(beta, l1, l2, s)) ** 2;
    if (isFinite(ssr) && (!best || ssr < best.ssr)) best = { l1, l2, beta: [...beta], ssr };
  }
  if (!best) return null;
  const fn = t => evalZ(best.beta, best.l1, best.l2, t) * 100; // % continuous
  fn._params = best;
  return fn;
}

// % continuous → % semi-annual bond-equivalent (so a spot line sits on the same axis as the
// Ask/SA yield scatter).
export const zToSA = zc => 200 * (Math.exp(zc / 200) - 1);

// Fit a zero curve to a set of bonds. Returns { z, tMin, tMax, sane(fn) } or null.
// `z(t)` is the zero yield in % continuous; `sane` reports whether a value stays within
// 2 percentage points of the observed yields (Svensson blows up on a set with a large
// maturity-to-maturity discontinuity — a real curve stays inside the scatter). `priceOf` /
// `yieldOf` pick which price / YTM to fit; bonds under `minT` years are left out.
export function spotCurveFit(bonds, { priceOf, yieldOf, minT = SAO_NOISE_YRS }) {
  const now = Date.now();
  const specs = [];
  for (const b of bonds) {
    const settle = localDate(b.settlementDate);
    const t = (b.maturityDate.getTime() - now) / (365.25 * 86400000);
    const px = priceOf(b), y = yieldOf(b);
    if (!settle || isNaN(settle) || t < minT || !(px > 0) || y == null || isNaN(y)) continue;
    const sch = cashflowSchedule(settle, b.maturityDate, b.coupon);
    if (!sch || !sch.times.length || sch.times.some(isNaN) || sch.amounts.some(isNaN) || isNaN(sch.accrued)) continue;
    specs.push({ t, ytm: y * 100, dirty: px + sch.accrued, times: sch.times, cf: sch.amounts, wt: 1 / Math.max(1, t) });
  }
  if (specs.length < 5) return null;
  const z = fitSpotNSS(specs);
  if (!z) return null;
  const yLo = Math.min(...specs.map(s => s.ytm)) - 2, yHi = Math.max(...specs.map(s => s.ytm)) + 2;
  return {
    z,
    tMin: Math.min(...specs.map(s => s.t)),
    tMax: Math.max(...specs.map(s => s.t)),
    sane: v => Number.isFinite(v) && v >= yLo && v <= yHi,
  };
}

// spotCurveFit → a half-year { x, y } grid (y in semi-annual %) for a chart line, or null.
// `yToX` maps years-to-maturity to the caller's x-axis unit; drawn from the shortest fitted bond.
export function spotCurveGrid(bonds, opts) {
  const fit = spotCurveFit(bonds, opts);
  if (!fit) return null;
  const grid = [];
  const point = t => {
    const y = parseFloat(zToSA(fit.z(t)).toFixed(3));
    if (!fit.sane(y)) return false;   // blown-up fit — drop the whole line
    grid.push({ x: opts.yToX(t), y });
    return true;
  };
  let lastT = -Infinity;
  for (let t = Math.ceil(fit.tMin * 2) / 2; t <= fit.tMax + 1e-9; t += 0.5) {
    if (!point(t)) return null;
    lastT = t;
  }
  // The 0.5-step grid can land short of tMax (the longest fitted bond) — always
  // draw through the actual endpoint rather than stopping early. Never extrapolate
  // past it: GSW's own published TIPS curve (TIPSY02-TIPSY20) likewise never
  // extends past the instruments it is fit to.
  if (fit.tMax - lastT > 1e-6 && !point(fit.tMax)) return null;
  return grid.length >= 3 ? grid : null;
}

// Snap each bond's SA yield to a smooth NSS fair-value curve, with the snap weight declining
// to 0 over the blend band in years-to-maturity (see 3.3_SAO_Adjustment.md). Mutates each bond with _saoFit /
// _saoWeight / _saoDevBps / _saoMode diagnostics; returns the SAO yield array.
export function calculateSAO(bonds) {
  const n = bonds.length;
  const sao = new Array(n);
  if (n === 0) return sao;

  const settle = localDate(bonds[0].settlementDate) || new Date();
  const yrs = bonds.map(b => (b.maturityDate - settle) / 31557600000);

  // Fit on reliable points only; near-maturity SA yields are price-noise-dominated.
  const fitIdx = [];
  for (let i = 0; i < n; i++) if (yrs[i] >= SAO_NOISE_YRS) fitIdx.push(i);
  const curve = fitNSS(fitIdx.map(i => yrs[i]), fitIdx.map(i => bonds[i].saYield));
  // Below the shortest fitted maturity the global NSS form is unconstrained and its
  // extrapolation diverges (a near-maturity TIPS can swing hundreds of bps negative).
  // Hold the curve flat at its shortest-anchor value there instead of extrapolating
  // (see 3.3_SAO_Adjustment.md §"The very short end").
  const tMin = fitIdx.length ? Math.min(...fitIdx.map(i => yrs[i])) : 0;

  for (let i = 0; i < n; i++) {
    const b = bonds[i];
    const fit = curve ? curve(Math.max(yrs[i], tMin)) : b.saYield;
    const weight = yrs[i] < SAO_NOISE_YRS
      ? 1
      : Math.min(1, Math.max(0, (SAO_BLEND_END_YRS - yrs[i]) / (SAO_BLEND_END_YRS - SAO_BLEND_START_YRS)));
    b._saoFit = fit;
    b._saoWeight = weight;
    b._saoDevBps = (b.saYield - fit) * 10000;   // how far the SA point sat off the smooth curve (rich/cheap)
    b._saoMode = yrs[i] < SAO_NOISE_YRS ? 'noise' : weight >= 1 ? 'smooth' : weight <= 0 ? 'raw' : 'blend';
    sao[i] = fit * weight + b.saYield * (1 - weight);
  }
  return sao;
}
