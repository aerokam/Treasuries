// Trading-hours X-axis for the 2D, 10D and Custom Time Series charts: every weekday's session, 08:00 to
// 17:05 ET, is laid end to end with a narrow gap between sessions, and the hours and weekends in
// between take no width. Data and axis bounds stay in real timestamps; only the mapping from a
// timestamp to a position on the axis is changed (see createTradingTimeScale).

export const SESSION_OPEN_MIN = 8 * 60;
export const SESSION_CLOSE_MIN = 17 * 60 + 5; // 17:05 ET: the last CNBC bar of the day
const SESSION_MS = (SESSION_CLOSE_MIN - SESSION_OPEN_MIN) * 60000;
const GAP_MS = 20 * 60000; // width of the separator between two sessions, in session time
const PERIOD_MS = SESSION_MS + GAP_MS;
const DAY_MS = 86400000;

const ET_FMT = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });

// UTC ms of ET wall-clock `minutes` after midnight on calendar day number `dayNum` (days since 1970-01-01).
function etMoment(dayNum, minutes) {
  const wall = dayNum * DAY_MS + minutes * 60000;
  let t = wall + 5 * 3600000;
  for (let i = 0; i < 2; i++) {
    const p = ET_FMT.formatToParts(new Date(t)).reduce((a, pt) => ({ ...a, [pt.type]: +pt.value }), {});
    const diff = wall - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    if (diff === 0) break;
    t += diff;
  }
  return t;
}

const dayCache = new Map(); // dayNum -> { midnight, open, close }
function dayInfo(dayNum) {
  let info = dayCache.get(dayNum);
  if (!info) {
    info = { midnight: etMoment(dayNum, 0), open: etMoment(dayNum, SESSION_OPEN_MIN), close: etMoment(dayNum, SESSION_CLOSE_MIN) };
    dayCache.set(dayNum, info);
  }
  return info;
}

// ET calendar day number containing `ms`.
function etDayNum(ms) {
  const d = Math.floor((ms - 5 * 3600000) / DAY_MS);
  return ms >= dayInfo(d + 1).midnight ? d + 1 : d;
}

const mod = (a, n) => ((a % n) + n) % n;

// Bond-market holidays, as the weekday ordinals (weeks * 5 + Monday-based weekday) of the holidays
// that fall on a weekday, ascending. A holiday is a non-trading day like a weekend: no session, no
// width. Set once the holiday list is read; until then every weekday is a trading day.
let holidayOrdinals = [];
const weekdayOrdinal = d => Math.floor((d + 3) / 7) * 5 + mod(d + 3, 7);

// `isoDates`: 'YYYY-MM-DD' strings, the form the shared holiday set holds.
export function setHolidays(isoDates) {
  const ords = [];
  for (const iso of isoDates || []) {
    const [y, m, day] = iso.split('-').map(Number);
    const d = Date.UTC(y, m - 1, day) / DAY_MS;
    if (mod(d + 3, 7) <= 4) ords.push(weekdayOrdinal(d));
  }
  holidayOrdinals = ords.sort((a, b) => a - b);
}

const isHolidayDay = d => holidayOrdinals.includes(weekdayOrdinal(d));
const isNonTradingDay = d => mod(d + 3, 7) > 4 || isHolidayDay(d);

// Trading days before calendar day `d`: weekdays before it, less the holidays among them.
function tradingDaysBefore(d) {
  const dow = mod(d + 3, 7), upTo = Math.floor((d + 3) / 7) * 5 + Math.min(dow, 5);
  let holidays = 0;
  while (holidays < holidayOrdinals.length && holidayOrdinals[holidays] < upTo) holidays++;
  return upTo - holidays;
}

// Position on the compact axis of a real timestamp. A moment outside a session takes the position
// of the nearest session edge of its own day; a weekend or a holiday takes the end of the
// preceding trading day.
export function toTradingTime(ms) {
  const d = etDayNum(ms), n = tradingDaysBefore(d);
  if (isNonTradingDay(d)) return (n - 1) * PERIOD_MS + SESSION_MS;
  const { open } = dayInfo(d);
  return n * PERIOD_MS + Math.min(Math.max(ms - open, 0), SESSION_MS);
}

// Compact-axis position scaled so one session (with its separator) spans one calendar day, for
// choosing a tick unit by the same thresholds as a plain time axis: n visible sessions read as n days.
export function toCalendarScaledTime(ms) {
  return toTradingTime(ms) * (DAY_MS / PERIOD_MS);
}

// Real timestamp at a compact-axis position; a position in the gap between sessions is the close.
export function fromTradingTime(t) {
  const w = Math.floor(t / PERIOD_MS), r = Math.min(Math.max(t - w * PERIOD_MS, 0), SESSION_MS);
  let k = w; // the w-th trading day is the weekday ordinal k once the holidays before it are skipped
  for (const h of holidayOrdinals) if (h <= k) k++;
  const d = Math.floor(k / 5) * 7 + mod(k, 5) - 3;
  return dayInfo(d).open + r;
}

// True for a moment from 08:00 through 17:05 ET on a weekday that is not a holiday.
export function inTradingSession(ms) {
  const d = etDayNum(ms);
  if (isNonTradingDay(d)) return false;
  const { open, close } = dayInfo(d);
  return ms >= open && ms <= close;
}

// True for a Saturday or Sunday moment, ET.
export function isWeekendMoment(ms) {
  return mod(etDayNum(ms) + 3, 7) > 4;
}

// True for a moment on a weekend or a holiday, ET: a day with no width on the compact axis.
export function isNonTradingMoment(ms) {
  return isNonTradingDay(etDayNum(ms));
}

// Tick step for a visible span: the smallest step from a short list of round intervals that leaves
// at most maxTicks ticks, so the count stays near maxTicks at every zoom rather than jumping
// between units. Returns null when the span is long enough that the calendar unit
// (month, year) is used instead.
const MIN_MS = 60000, HOUR_MS = 3600000;
export const TICK_STEPS_MS = [1, 2, 5, 10, 15, 30].map(m => m * MIN_MS)
  .concat([1, 2, 3, 6, 12].map(h => h * HOUR_MS))
  .concat([1, 2, 5, 10, 15, 30].map(d => d * DAY_MS));
export function niceTickStep(spanMs, maxTicks) {
  for (const step of TICK_STEPS_MS) if (spanMs / step <= maxTicks) return step;
  return null;
}

// ET wall-clock offset from UTC at a moment, in ms (negative).
function etOffsetMs(ms) {
  const p = ET_FMT.formatToParts(new Date(ms)).reduce((a, pt) => ({ ...a, [pt.type]: +pt.value }), {});
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
}

// Moments in [min, max] at multiples of stepMs of ET wall-clock time (a step of a day or more falls
// on midnight ET).
export function alignedTicks(min, max, stepMs) {
  const out = [];
  const off0 = etOffsetMs(min);
  for (let wall = Math.ceil((min + off0) / stepMs) * stepMs; ; wall += stepMs) {
    let t = wall - off0;
    t = wall - etOffsetMs(t);
    if (t > max) break;
    if (t >= min) out.push(t);
    if (out.length > 500) break;
  }
  return out;
}

// Chart.js scale: a time scale whose axis positions run through toTradingTime when its
// `compact` option is on, and that behaves as a plain time scale when it is off.
export function createTradingTimeScale(Chart) {
  const TimeScale = Chart.registry.getScale('time');
  return class TradingTimeScale extends TimeScale {
    static id = 'tradingTime';
    #span() {
      const a = toTradingTime(this.min), b = toTradingTime(this.max);
      return b > a ? { a, b } : null;
    }
    getDecimalForValue(value) {
      const s = this.options.compact ? this.#span() : null;
      if (!s || value === null) return super.getDecimalForValue(value);
      return (toTradingTime(value) - s.a) / (s.b - s.a);
    }
    getValueForPixel(pixel) {
      const s = this.options.compact ? this.#span() : null;
      if (!s) return super.getValueForPixel(pixel);
      const offsets = this._offsets;
      const pos = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
      return fromTradingTime(s.a + pos * (s.b - s.a));
    }
    buildTicks() {
      // The parent's pass also sets the scale's offsets, so it always runs; its ticks are used
      // where the stepping below does not apply (month and year units).
      const base = super.buildTicks();
      const { min, max } = this;
      const compact = this.options.compact;
      const unitTicks = () => {
        if (!compact) return base;
        if (this.options.time.unit === 'day') return base.filter(t => !isNonTradingMoment(t.value));
        if (this.options.time.unit !== 'hour' && this.options.time.unit !== 'minute') return base;
        return base.filter(t => inTradingSession(t.value));
      };
      if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return unitTicks();
      const maxTicks = Math.min(10, Math.max(5, Math.floor((this.width || 450) / 70)));
      // Compact: a visible span of 3 sessions or more is read in days, one per session; a shorter
      // one is read in the drawn hours, in steps of the round intervals.
      const days = compact ? toCalendarScaledTime(max) - toCalendarScaledTime(min) : max - min;
      const span = compact && days < 3 * DAY_MS ? toTradingTime(max) - toTradingTime(min) : days;
      const step = niceTickStep(span, maxTicks);
      if (step === null || step > 30 * DAY_MS || days >= 90 * DAY_MS) return unitTicks();
      let values = alignedTicks(min, max, step);
      if (compact) values = step >= DAY_MS ? values.filter(v => !isNonTradingMoment(v)) : values.filter(inTradingSession);
      return values.map(value => ({ value }));
    }
  };
}

// Shades the gap between two consecutive sessions on a compact axis.
export const tradingGapPlugin = {
  id: 'tradingGap',
  beforeDatasetsDraw(chart) {
    const x = chart.scales.x;
    if (!x || !x.options.compact) return;
    const a = toTradingTime(x.min), b = toTradingTime(x.max);
    if (!(b > a)) return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    ctx.clip();
    ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
    for (let w = Math.floor(a / PERIOD_MS); w * PERIOD_MS <= b; w++) {
      const gs = w * PERIOD_MS + SESSION_MS, ge = (w + 1) * PERIOD_MS;
      const left = x.getPixelForDecimal((gs - a) / (b - a)), right = x.getPixelForDecimal((ge - a) / (b - a));
      ctx.fillRect(left, chartArea.top, right - left, chartArea.height);
    }
    ctx.restore();
  }
};
