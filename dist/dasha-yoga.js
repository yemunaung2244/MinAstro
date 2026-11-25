import { computeLattaSnapshot } from './latta.js';

// Chapter 3 (Page 36): 10 Dasha Yoga Remainders & Exact Readings (27-Nakshatra System)
export const dashaYogaReadings = {
  0: 'လေဘေး သင့်မယ်။',
  1: 'တိမ်ထူမယ်။ မိုးဒဏ် သင့်မယ်။',
  4: 'မီးဘေးသင့်မယ်။',
  6: 'ရာဇဒဏ်သင့်မယ်။',
  10: 'သူခိုးဘေးသင့်မယ်။',
  11: 'သေမယ်။',
  15: 'ရောဂါဘေးသင့်မယ်။',
  18: 'လက်နက်ဘေးသင့်မယ်။',
  19: 'သဘောထား အကြီးအကျယ် ကွဲလွဲမယ်။',
  20: 'စီးပွားဥစ္စာ ပျက်သုဉ်းမယ်။',
};

export const dashaYogaRemainders = [0, 1, 4, 6, 10, 11, 15, 18, 19, 20];

const upagraha27ByOffset = new Map([
  [4, 'ဝိဒြုမ'],
  [7, 'သူလ'],
  [13, 'သန္နိပါတ'],
  [17, 'ကေတု'],
  [21, 'ဥက္ကလ'],
  [22, 'ကမ္ပ'],
  [23, 'ဝဇိရ'],
  [24, 'နိရ္ဃာတ'],
]);

const ABHIJIT_START = 276 + 40 / 60;
const ABHIJIT_END = 280 + 53 / 60 + 20 / 3600;

export function longitudeToStar28(longitude, star27Index) {
  if (longitude >= ABHIJIT_START && longitude < ABHIJIT_END) return 21;
  return star27Index + Number(star27Index >= 21);
}

export function star27ToStar28(star27Index) {
  return star27Index + Number(star27Index >= 21);
}

// Part 1 (27-star sum % 27) & Part 2 (14-row x 2-col 28-star Samasatta Vedha table)
export function computeDashaYoga(sun27Index, moon27Index) {
  const sunNum = sun27Index + 1;
  const moonNum = moon27Index + 1;
  const rawSum = sunNum + moonNum;
  const remainder = rawSum % 27;
  const reading = dashaYogaReadings[remainder] ?? null;
  const hasFault = reading !== null;
  const raviYoga = ((moon27Index - sun27Index + 27) % 27) === 8;

  // Part 2 (Pages 37–38): Samasatta Vedha 14-row table (28-Nakshatra system)
  const evenSum = rawSum % 2 === 1 ? rawSum + 1 : rawSum;
  const half = evenSum / 2;
  const with14 = half + 14;
  const start28Num = ((with14 - 1) % 28) + 1;
  const start28Index = start28Num - 1;

  const rows = [];
  for (let r = 0; r < 14; r++) {
    rows.push({
      rowNumber: r + 1,
      left28Index: (start28Index + r) % 28,
      right28Index: (start28Index + 27 - r) % 28,
    });
  }

  return {
    sun27Index,
    moon27Index,
    sunNum,
    moonNum,
    rawSum,
    remainder,
    reading,
    hasFault,
    raviYoga,
    effectiveFault: hasFault && !raviYoga,
    evenSum,
    half,
    with14,
    start28Num,
    start28Index,
    rows,
  };
}

export function oppositeInTable(rows, star28Index) {
  for (const row of rows) {
    if (row.left28Index === star28Index) {
      return { rowNumber: row.rowNumber, side: 'left', opposite28Index: row.right28Index };
    }
    if (row.right28Index === star28Index) {
      return { rowNumber: row.rowNumber, side: 'right', opposite28Index: row.left28Index };
    }
  }
  return null;
}

// Page 37 (Rule 2): 10 Dasha Yoga Nakshatras derived from a Sun Nakshatra (Natal or Transit)
export function dashaYogaStarsForSun(sun27Index) {
  const sunNum = sun27Index + 1;
  return dashaYogaRemainders.map(remainder => {
    const moonNum = ((remainder - sunNum) % 27 + 27) % 27 || 27;
    const star27Index = moonNum - 1;
    const distance = (star27Index - sun27Index + 27) % 27;
    return {
      remainder,
      reading: dashaYogaReadings[remainder],
      star27Index,
      starNum: moonNum,
      raviYoga: distance === 8,
      upagraha: upagraha27ByOffset.get(distance) ?? null,
    };
  });
}

// Full evaluation at an instant (optionally using Natal Sun nakshatra with Transit planets)
export function evaluateDashaYogaAt(instant, overrideSun27Index = null) {
  const snap = computeLattaSnapshot(instant);
  const planets = snap.planets.map(p => ({
    ...p,
    star28Index: longitudeToStar28(p.longitude, p.starIndex),
  }));
  const byId = Object.fromEntries(planets.map(p => [p.id, p]));
  const sun27Index = overrideSun27Index !== null ? overrideSun27Index : byId.sun.starIndex;
  const moon27Index = byId.moon.starIndex;
  const base = computeDashaYoga(sun27Index, moon27Index);

  const moon28Index = byId.moon.star28Index;
  const moonPos = oppositeInTable(base.rows, moon28Index);
  const moonOpposite28Index = moonPos ? moonPos.opposite28Index : -1;

  const planetsByStar28 = new Map();
  for (const p of planets) {
    if (!planetsByStar28.has(p.star28Index)) planetsByStar28.set(p.star28Index, []);
    planetsByStar28.get(p.star28Index).push(p);
  }

  const moonOccupants = (planetsByStar28.get(moon28Index) ?? []).filter(p => p.id !== 'moon');
  const moonPiercers = planetsByStar28.get(moonOpposite28Index) ?? [];

  const sunPiercesMoon = moonPiercers.some(p => p.id === 'sun');
  const maleficsPiercingMoon = moonPiercers.filter(p => ['rahu', 'saturn', 'mars', 'ketu'].includes(p.id));
  const beneficCancels = [
    ...moonOccupants.filter(p => p.id === 'jupiter' || p.id === 'venus').map(p => ({ planet: p, mode: 'စီး' })),
    ...moonPiercers.filter(p => p.id === 'jupiter' || p.id === 'venus').map(p => ({ planet: p, mode: 'သမသတ်ထွင်း' })),
  ];

  let status = 'clear';
  if (base.raviYoga) {
    status = 'ravi_yoga';
  } else if (base.hasFault) {
    if (beneficCancels.length) status = 'cancelled';
    else if (sunPiercesMoon || maleficsPiercingMoon.length) status = 'severe';
    else status = 'fault';
  }

  const sunDashaStars = dashaYogaStarsForSun(sun27Index).map(item => {
    const s28 = star27ToStar28(item.star27Index);
    const opp = oppositeInTable(base.rows, s28);
    const piercers = opp ? (planetsByStar28.get(opp.opposite28Index) ?? []) : [];
    const occupants = planetsByStar28.get(s28) ?? [];
    return {
      ...item,
      isTransitMoon: item.star27Index === moon27Index,
      occupants,
      piercers,
    };
  });

  return {
    ...base,
    planets,
    byId,
    planetsByStar28,
    moon28Index,
    moonRowNumber: moonPos ? moonPos.rowNumber : -1,
    moonOpposite28Index,
    moonOccupants,
    moonPiercers,
    sunPiercesMoon,
    maleficsPiercingMoon,
    beneficCancels,
    status,
    sunDashaStars,
  };
}
