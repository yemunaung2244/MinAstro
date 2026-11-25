import { myanmarMonth } from '../myanmar-calendar.js';
import { Body, Ecliptic, GeoVector, EclipticGeoMoon, MakeTime, MoonPhase, SearchMoonPhase, SunPosition } from '../astronomy-engine.js';

const myanmarTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Yangon', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});
const minute = 60_000;

export function myanmarDateTime(instant = new Date()) {
  const { year, month, day, hour, minute, second } = Object.fromEntries(
    myanmarTime.formatToParts(instant).map(({ type, value }) => [type, value])
  );
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

export function myanmarInstant(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    throw new RangeError('ရက်စွဲနှင့် အချိန် ထည့်ပါ။');
  }
  const normalized = value.length === 16 ? value + ':00' : value;
  const civil = new Date(normalized + 'Z');
  if (!Number.isFinite(+civil) || civil.toISOString().slice(0, 19) !== normalized) {
    throw new RangeError('ရက်စွဲနှင့် အချိန်ကို ပြန်စစ်ပါ။');
  }
  const offsets = new Set();
  for (const days of [-1, 0, 1]) {
    const probe = new Date(+civil + days * 24 * 60 * minute);
    offsets.add(Date.parse(myanmarDateTime(probe) + 'Z') - +probe);
  }
  const candidates = [...offsets].map(offset => new Date(+civil - offset))
    .filter(date => myanmarDateTime(date) === normalized);
  if (candidates.length !== 1) throw new RangeError('ရွေးထားသော ဒေသစံတော်ချိန်ကို အတည်မပြုနိုင်ပါ။');
  return candidates[0];
}

const normalize = angle => ((angle % 360) + 360) % 360;

// Matches the Lahiri approximation used in the reference calculator.
function ayanamsa(instant) {
  const t = MakeTime(instant).tt / 36525;
  return 23.85675 + (5028.796195 * t + 1.1054348 * t ** 2) / 3600;
}

export function starIndex(longitude) {
  const angle = normalize(longitude);
  if (angle >= 276 + 40 / 60 && angle < 280 + 53 / 60 + 20 / 3600) return 21;
  const index = Math.floor(angle * 27 / 360);
  return index + Number(index >= 21);
}

function sunLongitude(instant) {
  return normalize(SunPosition(instant).elon - ayanamsa(instant));
}

export const sunStar = instant => starIndex(sunLongitude(instant));

function moonLongitude(instant) {
  return normalize(EclipticGeoMoon(instant).lon - ayanamsa(instant));
}

export const moonStar = instant => starIndex(moonLongitude(instant));

function ariesIngress(year) {
  let start = Date.UTC(year, 3, 1);
  let end = Date.UTC(year, 4, 1);
  while (end - start > 1000) {
    const middle = Math.floor((start + end) / 2);
    if (sunLongitude(new Date(middle)) > 180) start = middle;
    else end = middle;
  }
  return new Date(Math.ceil(end / 1000) * 1000);
}

export function calculateAnchor(mode, value) {
  const year = Number(value.slice(0, 4));
  if (!Number.isInteger(year) || year < 1600 || year > 2200) {
    throw new RangeError('ခုနှစ်ကို ၁၆၀၀ မှ ၂၂၀၀ အတွင်း ထည့်ပါ။');
  }
  let instant = mode === 4 ? ariesIngress(year) : myanmarInstant(value);
  if (mode === 1) {
    // Natal full moon uses day 15 of the birth month in the Myanmar calendar.
    const civilDay = value.slice(0, 10);
    const { md } = myanmarMonth(civilDay);
    const fullMoonDay = new Date(Date.parse(civilDay + 'T12:00:00Z') + (15 - md) * 86400000);
    instant = myanmarInstant(fullMoonDay.toISOString().slice(0, 10) + 'T06:00');
  }
  if (mode === 2) {
    const fullMoon = SearchMoonPhase(180, instant, MoonPhase(instant) < 180 ? 16 : -16);
    if (!fullMoon) throw new RangeError('သက်ဆိုင်ရာ လပြည့်ချိန်ကို ရှာမတွေ့ပါ။');
    instant = fullMoon.date;
  }
  const longitude = moonLongitude(instant);
  return { anchor: starIndex(longitude), instant: instant.toISOString(), longitude };
}

const planets = [Body.Mars, Body.Mercury, Body.Jupiter, Body.Venus, Body.Saturn];

export function planetaryStars(instant) {
  const time = MakeTime(instant);
  const t = time.tt / 36525;
  const offset = ayanamsa(instant);
  const meanNode = 125.0445479 + t * (-1934.1362891 + t * (0.0020754 + t * (1 / 467441 - t / 60616000)));
  return [
    sunStar(instant), moonStar(instant),
    ...planets.map(body => starIndex(Ecliptic(GeoVector(body, time, true)).elon - offset)),
    starIndex(meanNode - offset), starIndex(meanNode + 180 - offset)
  ];
}
