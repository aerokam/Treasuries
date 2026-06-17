// shared/src/date-picker.js
// Single canonical date picker for all apps (projects/CLAUDE.md §2a).
//
// "The good one" = the styled native <input type="date"> from TipsReference:
// the browser's native calendar + keyboard entry, no custom mask/popup machinery.
// This module is that input, factored out so every app uses the same element and
// behavior. The matching CSS class `.date-picker` lives in shared/src/portal-theme.css.
//
// Values are exchanged as ISO strings ("YYYY-MM-DD") — the native input's own value
// format — so callers never parse locale date text.

/**
 * Configure an existing element as the shared date picker.
 * @param {HTMLInputElement} el  An <input> (forced to type="date").
 * @param {Object} [opts]
 * @param {string} [opts.value]  Initial ISO value "YYYY-MM-DD".
 * @param {string} [opts.min]    Min ISO date.
 * @param {string} [opts.max]    Max ISO date.
 * @param {(value:string, el:HTMLInputElement)=>void} [opts.onChange]
 *        Called on 'change' with the new ISO value (only when non-empty).
 * @param {string} [opts.className] Extra class(es) to add alongside `date-picker`.
 * @returns {HTMLInputElement}
 */
export function initDatePicker(el, opts = {}) {
  el.type = 'date';
  el.classList.add('date-picker');
  if (opts.className) el.classList.add(...opts.className.split(/\s+/).filter(Boolean));
  if (opts.min != null) el.min = opts.min;
  if (opts.max != null) el.max = opts.max;
  if (opts.value != null) el.value = opts.value;
  if (typeof opts.onChange === 'function') {
    el.addEventListener('change', () => { if (el.value) opts.onChange(el.value, el); });
  }
  return el;
}

/**
 * Create a new shared date-picker input.
 * @param {Object} [opts]  Same as initDatePicker, plus optional `id`.
 * @returns {HTMLInputElement}
 */
export function createDatePicker(opts = {}) {
  const el = document.createElement('input');
  if (opts.id) el.id = opts.id;
  return initDatePicker(el, opts);
}
