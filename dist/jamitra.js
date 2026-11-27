import { SiderealTime, MakeTime, e_tilt } from './astronomy-engine.js';
import { computeLattaSnapshot } from './latta.js';

export const jamitraMalefics = new Set(['sun', 'mars', 'saturn', 'rahu', 'ketu']);

export const jamitraBenefics = new Set(['moon', 'mercury', 'jupiter', 'venus']);

export const rashiNames = [
  'မိဿ', 'ပြိဿ', 'မေထုန်', 'ကရကဋ်', 'သိဟ်', 'ကန်',
  'တူ', 'ဗြိစ္ဆာ', 'ဓနု', 'မကာရ', 'ကုမ်', 'မိန်',
];

function ayanamsaAt(instant) {
  const centuries = (instant.getTime() - Date.UTC(2000, 0, 1, 12)) / 3155760000000;
  return 23.85675 + (5028.796195 * centuries + 1.1054348 * centuries ** 2) / 3600;
}

export function lagnaNakshatraAt(instant, latitude, longitude) {
  const rad = Math.PI / 180;
  const sidereal = (SiderealTime(instant) * 15 + longitude) * rad;
  const tilt = e_tilt(MakeTime(instant)).tobl * rad;
  const tropical = Math.atan2(
    Math.cos(sidereal),
    -Math.sin(sidereal) * Math.cos(tilt) - Math.tan(latitude * rad) * Math.sin(tilt)
  ) / rad;
  const siderealLon = ((tropical - ayanamsaAt(instant)) % 360 + 360) % 360;
  const quarter = Math.floor(siderealLon * 108 / 360);
  return {
    index: Math.floor(quarter / 4),
    pada: (quarter % 4) + 1,
    rashiIndex: Math.floor(siderealLon / 30),
    longitude: siderealLon,
  };
}

// 12th nakshatra inclusive from base nakshatra (27-nakshatra system).
export function jamitraFrom(starIndex) {
  return (starIndex + 11) % 27;
}

// 16th nakshatra inclusive from base nakshatra (27-nakshatra system).
export function samghatikaFrom(starIndex) {
  return (starIndex + 15) % 27;
}

// Find Myanmar civil day boundaries (UTC+6:30) for the given instant.
function myanmarDayBounds(instant) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Yangon', year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = Object.fromEntries(fmt.formatToParts(instant).map(p => [p.type, p.value]));
  const startMs = Date.parse(`${parts.year}-${parts.month}-${parts.day}T00:00:00+06:30`);
  return { startMs, endMs: startMs + 86400000 };
}

// Find time windows during the selected Myanmar day when Transit Moon sits in Transit Jamitra (12th from Transit Lagna).
export function findTransitJamitraWindows(instant, latitude, longitude) {
  const { startMs, endMs } = myanmarDayBounds(instant);
  const stepMs = 5 * 60000;
  const isMatch = (ms) => {
    const t = new Date(ms);
    const snap = computeLattaSnapshot(t);
    const moonIdx = snap.planets.find(p => p.id === 'moon').starIndex;
    const lagnaIdx = lagnaNakshatraAt(t, latitude, longitude).index;
    return jamitraFrom(lagnaIdx) === moonIdx;
  };

  function refineEdge(a, b, targetState) {
    let lo = a;
    let hi = b;
    while (hi - lo > 1000) {
      const mid = Math.floor((lo + hi) / 2);
      if (isMatch(mid) === targetState) hi = mid;
      else lo = mid;
    }
    return hi;
  }

  const windows = [];
  let prevMs = startMs;
  let prevState = isMatch(prevMs);
  let activeStart = prevState ? prevMs : null;

  for (let ms = startMs + stepMs; ms <= endMs; ms += stepMs) {
    const curState = isMatch(ms);
    if (!prevState && curState) {
      activeStart = refineEdge(prevMs, ms, true);
    } else if (prevState && !curState && activeStart !== null) {
      const endEdge = refineEdge(prevMs, ms, false);
      windows.push({ start: new Date(activeStart), end: new Date(endEdge) });
      activeStart = null;
    }
    prevMs = ms;
    prevState = curState;
  }
  if (activeStart !== null) {
    windows.push({ start: new Date(activeStart), end: new Date(endMs) });
  }
  return windows;
}

export function evaluateTransitJamitra(instant, latitude, longitude) {
  const snap = computeLattaSnapshot(instant);
  const lagna = lagnaNakshatraAt(instant, latitude, longitude);
  const jamitraIndex = jamitraFrom(lagna.index);
  const moon = snap.planets.find(p => p.id === 'moon');
  const samghatikaIndex = samghatikaFrom(moon.starIndex);

  const occupantsOnJamitra = snap.planets.filter(p => p.starIndex === jamitraIndex);
  const maleficsOnJamitra = occupantsOnJamitra.filter(p => jamitraMalefics.has(p.id));
  const beneficsOnJamitra = occupantsOnJamitra.filter(p => jamitraBenefics.has(p.id));
  const moonInJamitra = moon.starIndex === jamitraIndex;
  const windows = findTransitJamitraWindows(instant, latitude, longitude);

  return {
    instant,
    lagna,
    moon,
    jamitraIndex,
    samghatikaIndex,
    planets: snap.planets,
    occupantsOnJamitra,
    maleficsOnJamitra,
    beneficsOnJamitra,
    hasJamitraDosha: maleficsOnJamitra.length > 0,
    moonInJamitra,
    windows,
  };
}

export function evaluateNatalJamitra(birthInstant, birthLat, birthLon, transitInstant) {
  const natalSnap = computeLattaSnapshot(birthInstant);
  const transitSnap = computeLattaSnapshot(transitInstant);
  const natalLagna = lagnaNakshatraAt(birthInstant, birthLat, birthLon);
  const natalMoon = natalSnap.planets.find(p => p.id === 'moon');
  const transitMoon = transitSnap.planets.find(p => p.id === 'moon');

  const natalJamitraIndex = jamitraFrom(natalLagna.index);
  const natalSamghatikaIndex = samghatikaFrom(natalMoon.starIndex);

  const natalOnJamitra = natalSnap.planets.filter(p => p.starIndex === natalJamitraIndex);
  const natalOnSamghatika = natalSnap.planets.filter(p => p.starIndex === natalSamghatikaIndex);
  const transitOnJamitra = transitSnap.planets.filter(p => p.starIndex === natalJamitraIndex);
  const transitOnSamghatika = transitSnap.planets.filter(p => p.starIndex === natalSamghatikaIndex);

  const natalMaleficsOnJamitra = natalOnJamitra.filter(p => jamitraMalefics.has(p.id));
  const transitMaleficsOnJamitra = transitOnJamitra.filter(p => jamitraMalefics.has(p.id));

  const natalSunOnJamitra = natalOnJamitra.some(p => p.id === 'sun');
  const natalSunOnSamghatika = natalOnSamghatika.some(p => p.id === 'sun');
  const transitMoonOnNatalJamitra = transitMoon.starIndex === natalJamitraIndex;
  const transitMoonOnNatalSamghatika = transitMoon.starIndex === natalSamghatikaIndex;

  // Page 61: For each of the 9 natal planets, compute its 12th (Jamitra) and 16th (Samghatika) nakshatras.
  const planetMatrix = natalSnap.planets.map(planet => {
    const jIdx = jamitraFrom(planet.starIndex);
    const sIdx = samghatikaFrom(planet.starIndex);
    return {
      planet,
      jamitraIndex: jIdx,
      samghatikaIndex: sIdx,
      natalOnJamitra: natalSnap.planets.filter(p => p.starIndex === jIdx),
      transitOnJamitra: transitSnap.planets.filter(p => p.starIndex === jIdx),
      natalOnSamghatika: natalSnap.planets.filter(p => p.starIndex === sIdx),
      transitOnSamghatika: transitSnap.planets.filter(p => p.starIndex === sIdx),
      transitMoonOnJamitra: transitMoon.starIndex === jIdx,
      transitMoonOnSamghatika: transitMoon.starIndex === sIdx,
    };
  });

  return {
    birthInstant,
    transitInstant,
    natalLagna,
    natalMoon,
    transitMoon,
    natalJamitraIndex,
    natalSamghatikaIndex,
    natalOnJamitra,
    natalOnSamghatika,
    transitOnJamitra,
    transitOnSamghatika,
    natalMaleficsOnJamitra,
    transitMaleficsOnJamitra,
    hasNatalDosha: natalMaleficsOnJamitra.length > 0,
    hasTransitDosha: transitMaleficsOnJamitra.length > 0,
    natalSunOnJamitra,
    natalSunOnSamghatika,
    transitMoonOnNatalJamitra,
    transitMoonOnNatalSamghatika,
    planetMatrix,
  };
}
