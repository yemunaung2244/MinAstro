import { calculateAnchor, moonStar, myanmarInstant, sunStar } from './ephemeris.mjs';

export const directions = [
  'အရှေ့မြောက်ထောင့်', 'အရှေ့အရပ်', 'အရှေ့တောင်ထောင့်', 'တောင်အရပ်',
  'အနောက်တောင်အရပ်', 'အနောက်အရပ်', 'အနောက်မြောက်ထောင့်', 'မြောက်အရပ်'
];

const slots = directions.flatMap((_, index) => Array(index % 2 === 0 ? 4 : 3).fill(index));
const minute = 60_000;
const hour = 60 * minute;
export const moonPeriod = 408 * minute;
export const sunPeriod = (3 * 24 * 60 + 528) * minute;

export function directionOf(star, anchor) {
  return slots[(star - anchor + 2 + slots.length) % slots.length];
}

// Find the real ingress that bounds the symbolic sequence on either side.
function boundary(starAt, time, star, direction) {
  let inside = time;
  let outside = inside + direction * hour;
  const searchLimit = 40 * 24 * hour;
  while (starAt(new Date(outside)) === star) {
    if (Math.abs(outside - time) >= searchLimit) throw new RangeError('နက္ခတ်ပြောင်းချိန်ကို ရှာမတွေ့ပါ။');
    inside = outside;
    outside += direction * hour;
  }
  while (Math.abs(outside - inside) > 1) {
    const middle = Math.floor((inside + outside) / 2);
    if (starAt(new Date(middle)) === star) inside = middle;
    else outside = middle;
  }
  return direction < 0 ? inside : outside;
}

export function progressionWindow(starAt, instant, period) {
  const time = +instant;
  const realStar = starAt(instant);
  const ingress = boundary(starAt, time, realStar, -1);
  const nextIngress = boundary(starAt, time, realStar, 1);
  const step = Math.floor((time - ingress) / period);
  const start = ingress + step * period;
  const nominalEnd = start + period;
  return {
    star: (realStar + step) % slots.length,
    start,
    end: Math.min(nominalEnd, nextIngress),
    nextIngress,
    resets: nextIngress <= nominalEnd
  };
}

export function bhumiWindows(value) {
  const instant = myanmarInstant(value);
  return [[moonStar, moonPeriod], [sunStar, sunPeriod]].map(([starAt, period]) => {
    const current = progressionWindow(starAt, instant, period);
    return { current, next: progressionWindow(starAt, new Date(current.end), period) };
  });
}

export function calculateBhumi(value, manualAnchor) {
  const fullMoon = manualAnchor === undefined ? calculateAnchor(2, value) : null;
  const anchor = manualAnchor ?? fullMoon.anchor;
  const [{ current: moon }, { current: sun }] = bhumiWindows(value);
  return { anchor, instant: fullMoon?.instant ?? null, moon: moon.star, sun: sun.star };
}
