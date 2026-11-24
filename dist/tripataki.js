export const tripatakiPlanetNames = {
  1: 'တနင်္ဂနွေ',
  2: 'တနင်္လာ',
  3: 'အင်္ဂါ',
  4: 'ဗုဒ္ဓဟူး',
  5: 'ကြာသပတေး',
  6: 'သောကြာ',
  7: 'စနေ',
  8: 'ရာဟု',
  9: 'ကိတ်',
};

// Pages 76–77: ပုံသေအဟောများ (တစ်လုံး၊ နှစ်လုံး၊ သုံးလုံး)
export const tripatakiSingleReadings = {
  1: 'ဒုက္ခ။',
  2: 'သုခချမ်းသာရှိခြင်း။',
  3: 'ဒုက္ခ။',
  4: 'ကျက်သရေမင်္ဂလာရှိခြင်း။',
  5: 'ဩဇာအာဏာ ကြီးမားခြင်း။',
  6: 'ဩဇာအာဏာ ကြီးမားခြင်း။',
  7: 'အခက်အခဲများပြားခြင်း။',
  8: 'အတွေးအခေါ်အယူအဆမှားတတ်ခြင်း။ အနှောင့်အယှက်ရှိတတ်ခြင်း။ သူတစ်ပါးအတွက် အာမခံပေးခြင်း၊ ကတိခံပေးခြင်း မပြုသင့်သော ကာလဖြစ်ခြင်း။',
  9: 'အနှောင့်အယှက်များခြင်း။ အထူးအားဖြင့် ကိလေသာ ထူပြောခြင်း။',
};

export const tripatakiDoubleReadings = {
  1: 'ဒုက္ခကြီးများ ပေါ်ခြင်း။',
  2: 'မြတ်သော သုခကို ရရှိခြင်း။',
  3: 'မီးကဲ့သို့ ပူလောင်ခြင်း။ မီးလောင်ခြင်း။ ရောဂါရခြင်း။',
  4: 'ချမ်းသာကြွယ်ဝလာမည်။ စုဆောင်းနိုင်မည်။',
  5: 'ဘုရင်သဖွယ် စည်းစိမ်ကြီးခြင်း။',
  6: 'မကုန်ခမ်းနိုင်သော စည်းစိမ်ဥစ္စာတို့ကို ရရှိခြင်း။',
  7: 'အလုံးစုံ ပျက်သုဉ်းခြင်း။',
  8: 'ရန်သူကို ကြောက်နေရခြင်း။',
  9: 'အနှောင့်အယှက်အလွန်များခြင်း။ ကိလေသာအလွန်ထူပြောခြင်း။',
};

export const tripatakiTripleReadings = {
  1: 'စည်းစိမ် ကုန်ခမ်းခြင်း။ နာမည်ဂုဏ်သတင်း ကျဆင်းခြင်း၊ ပျက်စီးခြင်း။',
  2: 'လာဘ်လာဘ ကြီးစွာ ရရှိခြင်း။',
  3: 'သံသယစိတ်ကြောင့် ပျက်စီးခြင်း။',
  4: 'ရတနာများ ရရှိခြင်း။',
  5: 'စည်းစိမ်ဥစ္စာ လေးဆတိုးခြင်း။',
  6: 'စည်းစိမ် ဥစ္စာရရှိခြင်း။ ဥစ္စာ မပြတ်တမ်း ရရှိခြင်း။',
  7: 'အသတ်ခံရခြင်း/ အချုပ်အနှောင် ခံရခြင်း။',
  8: 'လက်နက်ဘေးဖြင့် သေတတ်ခြင်း။',
  9: 'ရောဂါ ရခြင်း။ ရောဂါ ကြီးခြင်း။',
};

export const tripatakiChakraRoles = {
  ketuPataki: 'ပထမလေးလ စိုးမိုး · အလင်း (ကေတု = အလင်း) နှင့် ထင်ရှားပေါ်လွင်မှု',
  ketuChakra: 'ဒုတိယလေးလ စိုးမိုး · စရဏကျင့်ခြင်း (ကေတု = ကိတ်ဂြိုဟ်) နှင့် လွတ်မြောက်မှု',
  guruChakra: 'တတိယလေးလ စိုးမိုး · အားကိုးရာ ဆရာကောင်း၊ တိုင်ပင်ဖော်၊ မိတ်ဆွေကောင်း',
};

// Page 63: ကေတုပတာကီစက် (9 houses, 27 nakshatras, 4x3 grid, counter-clockwise)
export const ketuPatakiHouses = [
  { planet: 9, area: '2 / 4 / 3 / 5', nakshatras: [0, 9, 18] },   // ကိတ်: အဿဝဏီ, မာဃ, မူလ
  { planet: 6, area: '1 / 4 / 2 / 5', nakshatras: [1, 10, 19] },  // သောကြာ: ဘရဏီ, ပြုဗ္ဗာဖလဂုဏီ, ပြုဗ္ဗာသာန်
  { planet: 1, area: '1 / 2 / 2 / 4', nakshatras: [2, 11, 20] },  // တနင်္ဂနွေ: ကြတ္တိကာ, ဥတြဖလဂုဏီ, ဥတြာသာန်
  { planet: 2, area: '1 / 1 / 2 / 2', nakshatras: [3, 12, 21] },  // တနင်္လာ: ရောဟဏီ, ဟဿတ, သရဝဏ်
  { planet: 3, area: '2 / 1 / 3 / 2', nakshatras: [4, 13, 22] },  // အင်္ဂါ: မိဂသီ, စိတြ, ဓနသိဒ္ဓိ
  { planet: 4, area: '3 / 1 / 4 / 2', nakshatras: [5, 14, 23] },  // ဗုဒ္ဓဟူး: အဒြ, သွာတိ, သတ္တဘိသ
  { planet: 7, area: '3 / 2 / 4 / 3', nakshatras: [6, 15, 24] },  // စနေ: ပုဏ္ဏဖုသျှု, ဝိသာခါ, ပြုဗ္ဗာဘဒြပိုဒ်
  { planet: 5, area: '3 / 3 / 4 / 4', nakshatras: [7, 16, 25] },  // ကြာသပတေး: ဖုသျှ, အနုရာဓ, ဥတြာဘဒြပိုဒ်
  { planet: 8, area: '3 / 4 / 4 / 5', nakshatras: [8, 17, 26] },  // ရာဟု: အဿလိဿ, ဇေဋ္ဌ, ရေဝတီ
];

// Page 64: ဂုရုစက် (9 houses, 27 nakshatras, 5x2 horizontal grid, counter-clockwise)
export const guruChakraHouses = [
  { planet: 9, area: '1 / 4 / 2 / 5', nakshatras: [0, 9, 18] },   // ကိတ်: အဿဝဏီ, မာဃ, မူလ
  { planet: 2, area: '1 / 2 / 2 / 4', nakshatras: [1, 10, 19] },  // တနင်္လာ: ဘရဏီ, ပြုဗ္ဗာဖလဂုဏီ, ပြုဗ္ဗာသာန်
  { planet: 4, area: '1 / 1 / 2 / 2', nakshatras: [2, 11, 20] },  // ဗုဒ္ဓဟူး: ကြတ္တိကာ, ဥတြဖလဂုဏီ, ဥတြာသာန်
  { planet: 5, area: '2 / 1 / 3 / 2', nakshatras: [3, 12, 21] },  // ကြာသပတေး: ရောဟဏီ, ဟဿတ, သရဝဏ်
  { planet: 6, area: '2 / 2 / 3 / 3', nakshatras: [4, 13, 22] },  // သောကြာ: မိဂသီ, စိတြ, ဓနသိဒ္ဓိ
  { planet: 7, area: '2 / 3 / 3 / 4', nakshatras: [5, 14, 23] },  // စနေ: အဒြ, သွာတိ, သတ္တဘိသ
  { planet: 8, area: '2 / 4 / 3 / 5', nakshatras: [6, 15, 24] },  // ရာဟု: ပုဏ္ဏဖုသျှု, ဝိသာခါ, ပြုဗ္ဗာဘဒြပိုဒ်
  { planet: 1, area: '2 / 5 / 3 / 6', nakshatras: [7, 16, 25] },  // တနင်္ဂနွေ: ဖုသျှ, အနုရာဓ, ဥတြာဘဒြပိုဒ်
  { planet: 3, area: '1 / 5 / 2 / 6', nakshatras: [8, 17, 26] },  // အင်္ဂါ: ဇေဋ္ဌ, ရေဝတီ, အဿလိဿ
];

// Page 65: ကေတုစက် (12 houses around 4x5 perimeter, 28 nakshatras including အဘိဇိ at index 21, counter-clockwise)
export const ketuChakraGridHouses = [
  { planet: 1, area: '1 / 3 / 2 / 4', nakshatras: [0, 27, 26] },  // တနင်္ဂနွေ: အဿဝဏီ, ရေဝတီ, ဥတြာဘဒြပိုဒ်
  { planet: 9, area: '1 / 2 / 2 / 3', nakshatras: [1] },          // ကိတ်: ဘရဏီ
  { planet: 4, area: '1 / 1 / 2 / 2', nakshatras: [2, 3, 4] },    // ဗုဒ္ဓဟူး: ကြတ္တိကာ, ရောဟဏီ, မိဂသီ
  { planet: 3, area: '2 / 1 / 3 / 2', nakshatras: [5, 6, 7] },    // အင်္ဂါ: အဒြ, ပုဏ္ဏဖုသျှု, ဖုသျှ
  { planet: 9, area: '3 / 1 / 4 / 2', nakshatras: [8] },          // ကိတ်: အဿလိဿ
  { planet: 5, area: '4 / 1 / 5 / 2', nakshatras: [9, 10, 11] },  // ကြာသပတေး: မာဃ, ပြုဗ္ဗာဖလဂုဏီ, ဥတြဖလဂုဏီ
  { planet: 2, area: '5 / 1 / 6 / 2', nakshatras: [12, 13, 14] }, // တနင်္လာ: ဟဿတ, စိတြ, သွာတိ
  { planet: 9, area: '5 / 2 / 6 / 3', nakshatras: [15] },         // ကိတ်: ဝိသာခါ
  { planet: 6, area: '5 / 3 / 6 / 4', nakshatras: [16, 17, 18] }, // သောကြာ: အနုရာဓ, ဇေဋ္ဌ, မူလ
  { planet: 8, area: '5 / 4 / 6 / 5', nakshatras: [19, 20, 21] }, // ရာဟု: ပြုဗ္ဗာသာန်, ဥတြာသာန်, အဘိဇိ
  { planet: 9, area: '2 / 4 / 5 / 5', nakshatras: [22] },         // ကိတ်: သရဝဏ်
  { planet: 7, area: '1 / 4 / 2 / 5', nakshatras: [23, 24, 25] }, // စနေ: ဓနသိဒ္ဓိ, သတ္တဘိသ, ပြုဗ္ဗာဘဒြပိုဒ်
];

export function tripatakiForAge(star27Index, star28Index, runningAge) {
  const step = runningAge - 1;

  const kpStart = ketuPatakiHouses.findIndex(h => h.nakshatras.includes(star27Index));
  const kpIndex = (kpStart + step) % ketuPatakiHouses.length;

  const guruStart = guruChakraHouses.findIndex(h => h.nakshatras.includes(star27Index));
  const guruIndex = (guruStart + step) % guruChakraHouses.length;

  const ketuStart = ketuChakraGridHouses.findIndex(h => h.nakshatras.includes(star28Index));
  const ketuIndex = (ketuStart + step) % ketuChakraGridHouses.length;

  return {
    runningAge,
    ketuPataki: {
      startIndex: kpStart,
      currentIndex: kpIndex,
      planet: ketuPatakiHouses[kpIndex].planet,
      startPlanet: ketuPatakiHouses[kpStart].planet,
    },
    ketuChakra: {
      startIndex: ketuStart,
      currentIndex: ketuIndex,
      planet: ketuChakraGridHouses[ketuIndex].planet,
      startPlanet: ketuChakraGridHouses[ketuStart].planet,
    },
    guruChakra: {
      startIndex: guruStart,
      currentIndex: guruIndex,
      planet: guruChakraHouses[guruIndex].planet,
      startPlanet: guruChakraHouses[guruStart].planet,
    },
  };
}

export function tripatakiCombinationReadings(res) {
  const counts = new Map();
  for (const p of [res.ketuPataki.planet, res.ketuChakra.planet, res.guruChakra.planet]) {
    counts.set(p, (counts.get(p) || 0) + 1);
  }
  const items = [];
  for (const [planet, count] of counts.entries()) {
    if (count === 3) {
      items.push({
        planet,
        count: 3,
        label: `${tripatakiPlanetNames[planet]} သုံးလုံး`,
        reading: tripatakiTripleReadings[planet],
      });
    } else if (count === 2) {
      items.push({
        planet,
        count: 2,
        label: `${tripatakiPlanetNames[planet]} နှစ်လုံး`,
        reading: tripatakiDoubleReadings[planet],
      });
    }
  }
  return items;
}

function addMonthsIso(year, month, day, monthsToAdd) {
  const totalMonths = (year * 12 + (month - 1)) + monthsToAdd;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  const maxDay = new Date(Date.UTC(newYear, newMonth, 0)).getUTCDate();
  const clampedDay = Math.min(day, maxDay);
  const pad = n => String(n).padStart(2, '0');
  return `${newYear}-${pad(newMonth)}-${pad(clampedDay)}`;
}

export function runningAgeAt(birthDateStr, targetDateStr) {
  const [by, bm, bd] = birthDateStr.split('-').map(Number);
  const [ty, tm, td] = targetDateStr.split('-').map(Number);
  if (ty < by || (ty === by && (tm < bm || (tm === bm && td < bd)))) {
    throw new RangeError('Target date precedes birth date');
  }
  let completed = ty - by;
  if (tm < bm || (tm === bm && td < bd)) completed -= 1;
  const startYear = by + completed;
  const p0Start = addMonthsIso(startYear, bm, bd, 0);
  const p1Start = addMonthsIso(startYear, bm, bd, 4);
  const p2Start = addMonthsIso(startYear, bm, bd, 8);
  const p2End = addMonthsIso(startYear, bm, bd, 12);
  const periods = [
    { key: 'ketuPataki', label: 'ပထမလေးလ', start: p0Start, end: p1Start },
    { key: 'ketuChakra', label: 'ဒုတိယလေးလ', start: p1Start, end: p2Start },
    { key: 'guruChakra', label: 'တတိယလေးလ', start: p2Start, end: p2End },
  ].map(p => ({
    ...p,
    active: targetDateStr >= p.start && targetDateStr < p.end,
  }));
  return {
    completed,
    running: completed + 1,
    periodStart: p0Start,
    periodEnd: p2End,
    periods,
  };
}
