import { Body, Ecliptic, EclipticGeoMoon, GeoVector, SunPosition } from './astronomy-engine.js';

// Mean Lahiri ayanamsa approximation anchored at J2000 (consistent with janma.js)
function lahiriAyanamsa(instant) {
  const centuries = (instant.getTime() - Date.UTC(2000, 0, 1, 12)) / 3155760000000;
  return 23.85675 + (5028.796195 * centuries + 1.1054348 * centuries ** 2) / 3600;
}

function toNakshatra(instant, tropicalLongitude) {
  const longitude = ((tropicalLongitude - lahiriAyanamsa(instant)) % 360 + 360) % 360;
  const quarter = Math.floor(longitude * 108 / 360);
  return { index: Math.floor(quarter / 4), pada: quarter % 4 + 1, longitude };
}

// Mean Lunar Ascending Node (Rahu) tropical longitude (Meeus Ch. 47)
function meanRahuTropical(instant) {
  const T = (instant.getTime() - Date.UTC(2000, 0, 1, 12)) / 3155760000000;
  const lon = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  return ((lon % 360) + 360) % 360;
}

function planetTropical(id, instant) {
  switch (id) {
    case 'sun': return SunPosition(instant).elon;
    case 'moon': return EclipticGeoMoon(instant).lon;
    case 'mars': return Ecliptic(GeoVector(Body.Mars, instant, true)).elon;
    case 'mercury': return Ecliptic(GeoVector(Body.Mercury, instant, true)).elon;
    case 'jupiter': return Ecliptic(GeoVector(Body.Jupiter, instant, true)).elon;
    case 'venus': return Ecliptic(GeoVector(Body.Venus, instant, true)).elon;
    case 'saturn': return Ecliptic(GeoVector(Body.Saturn, instant, true)).elon;
    case 'rahu': return meanRahuTropical(instant);
    case 'ketu': return (meanRahuTropical(instant) + 180) % 360;
    default: throw new RangeError('Unknown planet: ' + id);
  }
}

function isRetrograde(id, instant) {
  if (id === 'sun' || id === 'moon') return false;
  if (id === 'rahu' || id === 'ketu') return true;
  const dt = 6 * 3600000;
  const lon1 = planetTropical(id, new Date(instant.getTime() - dt));
  const lon2 = planetTropical(id, new Date(instant.getTime() + dt));
  let diff = lon2 - lon1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

// Chapter 20 (Page 77): 9 Planets Latta Definitions (inclusive 1-based counting)
export const lattaPlanetDefs = [
  {
    id: 'sun',
    name: 'တနင်္ဂနွေ',
    direction: 'forward',
    count: 12,
    offset: 11,
    malefic: true,
    ruleText: 'ရှေ့ ၁၂ လုံးမြောက်',
    janmaReading: 'စည်းစိမ်ဥစ္စာ ပျက်စီးပါတယ်။',
    defenseNote: 'ရှေ့ကာကွယ်ရေးစနစ်',
  },
  {
    id: 'moon',
    name: 'တနင်္လာ',
    direction: 'backward',
    count: 22,
    offset: -21,
    malefic: false,
    ruleText: 'နောက် ၂၂ လုံးမြောက်',
    janmaReading: 'ဘေး သင့်ပါတယ်။',
    defenseNote: 'နောက်ကျောကာကွယ်ရေးစနစ်',
  },
  {
    id: 'mars',
    name: 'အင်္ဂါ',
    direction: 'forward',
    count: 3,
    offset: 2,
    malefic: true,
    ruleText: 'ရှေ့ ၃ လုံးမြောက် (အင်္ဂါမြင်လည်းမြင်သည်)',
    janmaReading: 'သေပါတယ်။',
    defenseNote: 'ရှေ့ကာကွယ်ရေးစနစ်',
  },
  {
    id: 'mercury',
    name: 'ဗုဒ္ဓဟူး',
    direction: 'backward',
    count: 7,
    offset: -6,
    malefic: false,
    ruleText: 'နောက် ၇ လုံးမြောက်',
    janmaReading: 'ဆုံးရှုံးမယ်။ ဘေး သင့်မယ်။',
    defenseNote: 'နောက်ကျောကာကွယ်ရေးစနစ်',
  },
  {
    id: 'jupiter',
    name: 'ကြာသပတေး',
    direction: 'forward',
    count: 6,
    offset: 5,
    malefic: false,
    ruleText: 'ရှေ့ ၆ လုံးမြောက်',
    janmaReading: 'ဆွေမျိုးတွေ ဘေးသင့်မယ်။',
    defenseNote: 'ရှေ့ကာကွယ်ရေးစနစ်',
  },
  {
    id: 'venus',
    name: 'သောကြာ',
    direction: 'backward',
    count: 5,
    offset: -4,
    malefic: false,
    ruleText: 'နောက် ၅ လုံးမြောက်',
    janmaReading: 'လုပ်ငန်းတွေ ဆုတ်ယုတ် ပျက်စီးမယ်။',
    defenseNote: 'နောက်ကျောကာကွယ်ရေးစနစ်',
  },
  {
    id: 'saturn',
    name: 'စနေ',
    direction: 'forward',
    count: 8,
    offset: 7,
    malefic: true,
    ruleText: 'ရှေ့ ၈ လုံးမြောက်',
    janmaReading: 'သေမယ်။',
    defenseNote: 'ရှေ့ကာကွယ်ရေးစနစ်',
  },
  {
    id: 'rahu',
    name: 'ရာဟု',
    direction: 'backward',
    count: 9,
    offset: -8,
    malefic: true,
    ruleText: 'နောက် ၉ လုံးမြောက်',
    janmaReading: 'သေမယ်။ (စနေ လတ္တာနှင့် အကျိုးပေးတူပါတယ်။)',
    defenseNote: 'နောက်ကျောကာကွယ်ရေးစနစ်',
  },
  {
    id: 'ketu',
    name: 'ကိတ်',
    direction: 'backward',
    count: 9,
    offset: -8,
    malefic: true,
    ruleText: 'နောက် ၉ လုံးမြောက် (ရာဟုနှင့် လတ္တာချင်းတူ)',
    janmaReading: 'သေမယ်။ (စနေ လတ္တာနှင့် အကျိုးပေးတူပါတယ်။)',
    defenseNote: 'နောက်ကျောကာကွယ်ရေးစနစ်',
  },
];

// Page 78: တနင်္ဂနွေ လတ္တာသင့်ထားတဲ့ နက္ခတ်မှာ အခြားဂြိုဟ်ရှိရင်
export const sunLattaOccupantReadings = {
  moon: 'ခြေမှာ ရောဂါရမယ်။ ခရီးသွားရမယ်။ အနာ ပေါက်မယ်။',
  mars: 'သူခိုး ဓားပြဘေး သင့်မယ်။ တန်ဖိုးကြီး ပစ္စည်း ပျောက်မယ်။',
  mercury: 'ချစ်ခင်သူတွေနဲ့ ခွဲခွာရမယ်။',
  jupiter: 'မင်းဘေးသင့်မယ်။',
  venus: 'သားမယားနဲ့ ကွဲမယ်။ ဒါမှမဟုတ် မယားသေမယ်။',
  saturn: 'သူခိုး ဓားပြဘေး သင့်မယ်။ တန်ဖိုးကြီး ပစ္စည်း ပျောက်မယ်။',
  rahu: 'အလုံးစုံ ပျက်စီးမယ်။',
  ketu: 'လက်နက်ဘေး သင့်မယ်။',
};

const upagraha27Offsets = [
  ['ဝိဒြုမ', 4], ['သူလ', 7], ['သန္နိပါတ', 13], ['ကေတု', 17],
  ['ဥက္ကလ', 21], ['ကမ္ပ', 22], ['ဝဇိရ', 23], ['နိရ္ဃာတ', 24],
];

export function lattaTargetIndex(starIndex, offset) {
  return ((starIndex + offset) % 27 + 27) % 27;
}

export function computeLattaSnapshot(instant) {
  const planets = lattaPlanetDefs.map(def => {
    const pos = toNakshatra(instant, planetTropical(def.id, instant));
    const lattaIndex = lattaTargetIndex(pos.index, def.offset);
    return {
      ...def,
      starIndex: pos.index,
      pada: pos.pada,
      longitude: pos.longitude,
      lattaIndex,
      retrograde: isRetrograde(def.id, instant),
    };
  });
  const byId = Object.fromEntries(planets.map(p => [p.id, p]));
  const sunLattaIndex = byId.sun.lattaIndex;

  // Check planets occupying Sun's Latta nakshatra (Page 78)
  const sunLattaOccupants = planets
    .filter(p => p.id !== 'sun' && p.starIndex === sunLattaIndex)
    .map(p => ({
      planet: p,
      reading: sunLattaOccupantReadings[p.id],
    }));

  // Check Upagraha + Latta + Malefic occupancy (Page 79)
  const upagrahaHits = [];
  for (const [upaName, offset] of upagraha27Offsets) {
    const idx = (byId.sun.starIndex + offset) % 27;
    const lattaBy = planets.filter(p => p.lattaIndex === idx);
    const maleficsHere = planets.filter(p => p.malefic && p.starIndex === idx);
    if (lattaBy.length && maleficsHere.length) {
      const hasRetro = maleficsHere.some(p => p.retrograde && p.id !== 'rahu' && p.id !== 'ketu');
      upagrahaHits.push({
        starIndex: idx,
        upaName,
        lattaBy,
        maleficsHere,
        hasRetro,
        reading: hasRetro
          ? 'ဥပဂြဟ + လတ္တာ + ပါပဂြိုဟ်စီး (ဝကြပါဝင်) — အနာရောဂါ နှိပ်စက်မယ်၊ ပါပဂြိုဟ် ဝကြသွားသဖြင့် အထူးသတိပြုရမည် (ကျမ်းအလို သေမယ်)။'
          : 'ဥပဂြဟ + လတ္တာ + ပါပဂြိုဟ်စီး — အနာရောဂါ နှိပ်စက်မယ်။',
      });
    }
  }

  return { planets, byId, sunLattaIndex, sunLattaOccupants, upagrahaHits };
}

// Evaluate all Chapter 20 readings for a target nakshatra (e.g. Natal Janma or Transit Moon)
export function evaluateLattaOnStar(targetStarIndex, snapshot) {
  const { planets, byId } = snapshot;
  const lattaHits = planets.filter(p => p.lattaIndex === targetStarIndex);
  const occupants = planets.filter(p => p.starIndex === targetStarIndex);
  const occIds = new Set(occupants.map(p => p.id));
  const hitIds = new Set(lattaHits.map(p => p.id));

  const combinations = [];
  // Page 78 combined rules:
  if (hitIds.has('sun') && (occIds.has('mars') || hitIds.has('mars'))) {
    combinations.push({
      title: occIds.has('mars')
        ? 'အင်္ဂါစီး + တနင်္ဂနွေ လတ္တာသင့်'
        : 'အင်္ဂါနှင့် တနင်္ဂနွေ နှစ်လုံးလုံး လတ္တာသင့်',
      reading: 'နေရာဌာန ပျက်စီးမယ်။ ဝမ်းမှာ ရောဂါရမယ်။',
    });
  }
  if (occIds.has('moon') && occIds.has('mars') && hitIds.has('sun')) {
    combinations.push({
      title: 'တနင်္လာနှင့် အင်္ဂါစီး + တနင်္ဂနွေ လတ္တာသင့်',
      reading: 'ဘေးကြီးသင့်မယ်။',
    });
  }
  if (occIds.has('sun') && hitIds.has('mars')) {
    combinations.push({
      title: 'တနင်္ဂနွေစီး + အင်္ဂါ လတ္တာသင့်',
      reading: 'အိမ်/နေရာ/ဌာန/စီးပွား ပျက်စီးမယ်။ အနာရောဂါ နှိပ်စက်မယ်။ လက်နက်ဘေး သင့်တတ်တယ်။',
    });
  }
  if (occIds.has('sun') && occIds.has('moon') && hitIds.has('mars')) {
    combinations.push({
      title: 'တနင်္ဂနွေနှင့် တနင်္လာစီး + အင်္ဂါ လတ္တာသင့်',
      reading: 'ဘေးကြီးသင့်မယ်။',
    });
  }
  const saturnFamilyHit = ['saturn', 'rahu', 'ketu'].filter(id => hitIds.has(id));
  if (occIds.has('sun') && saturnFamilyHit.length) {
    const names = saturnFamilyHit.map(id => byId[id].name).join('၊ ');
    combinations.push({
      title: `တနင်္ဂနွေစီး + ${names} လတ္တာသင့်`,
      reading: occIds.has('moon')
        ? 'တနင်္ဂနွေနှင့် တနင်္လာ နှစ်လုံးစီးထားသဖြင့် အနာရောဂါ နှိပ်စက်ခြင်း၊ ဘေးကြီးသင့်ခြင်း၊ သူခိုးဓားပြ နှိပ်စက်ခြင်း ဆိုးကျိုးများ ပိုမိုကြီးမားမယ်။'
        : 'အနာရောဂါ နှိပ်စက်မယ်။ ဘေးကြီးသင့်မယ်။ သူခိုးဓားပြ နှိပ်စက်မယ်။',
    });
  }
  if (occIds.has('sun') && hitIds.has('mercury')) {
    combinations.push({
      title: 'တနင်္ဂနွေစီး + ဗုဒ္ဓဟူး လတ္တာသင့်',
      reading: 'ဉာဏ်ပညာ ပျက်ဆီးဆုတ်ယုတ်မယ်။',
    });
  }

  return { lattaHits, occupants, combinations };
}
