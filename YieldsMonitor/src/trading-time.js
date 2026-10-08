// Trading-hours X-axis for the 2D and 10D Time Series charts: every weekday's session, 08:00 to
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

// Position on the compact axis of a real timestamp. A moment outside a session takes the position
// of the nearest session edge of its own day; a weekend takes the end of the preceding Friday.
export function toTradingTime(ms) {
  const d = etDayNum(ms), dow = mod(d + 3, 7), weekNum = Math.floor((d + 3) / 7); // Monday = 0
  if (dow > 4) return (weekNum * 5 + 4) * PERIOD_MS + SESSION_MS;
  const { open } = dayInfo(d);
  return (weekNum * 5 + dow) * PERIOD_MS + Math.min(Math.max(ms - open, 0), SESSION_MS);
}

// Real timestamp at a compact-axis position; a position in the gap between sessions is the close.
export function fromTradingTime(t) {
  const w = Math.floor(t / PERIOD_MS), r = Math.min(Math.max(t - w * PERIOD_MS, 0), SESSION_MS);
  const d = Math.floor(w / 5) * 7 + mod(w, 5) - 3;
  return dayInfo(d).open + r;
}

// True for a weekday moment from 08:00 through 17:05 ET.
export function inTradingSession(ms) {
  const d = etDayNum(ms);
  if (mod(d + 3, 7) > 4) return false;
  const { open, close } = dayInfo(d);
  return ms >= open && ms <= close;
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
      const ticks = super.buildTicks();
      if (!this.options.compact || this.options.time.unit !== 'hour') return ticks;
      return ticks.filter(t => inTradingSession(t.value));
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
