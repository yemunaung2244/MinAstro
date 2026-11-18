import { Body, Ecliptic, EclipticGeoMoon, GeoVector, SunPosition } from './astronomy-engine.js';

// Mean Lahiri ayanamsa approximation anchored at J2000.
function nakshatraAt(instant, tropicalLongitude) {
  const centuries = (instant.getTime() - Date.UTC(2000, 0, 1, 12)) / 3155760000000;
  const ayanamsa = 23.85675 + (5028.796195 * centuries + 1.1054348 * centuries ** 2) / 3600;
  const longitude = (tropicalLongitude - ayanamsa + 360) % 360;
  const quarter = Math.floor(longitude * 108 / 360);
  return { index: Math.floor(quarter / 4), pada: quarter % 4 + 1, longitude };
}

export function janmaAt(instant) {
  return nakshatraAt(instant, EclipticGeoMoon(instant).lon);
}

export function solarNakshatraAt(instant) {
  return nakshatraAt(instant, SunPosition(instant).elon);
}

export function suriyaSlot(moonIndex, sunIndex) {
  return (moonIndex - sunIndex + 27) % 27;
}

export function myanmarBirthInstant(date, time) {
  const civil = new Date(date + 'T' + time + 'Z');
  if (!Number.isFinite(civil.getTime()) || civil.toISOString().slice(0, 10) !== date) {
    throw new RangeError('Invalid birth date or time');
  }
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Yangon', timeZoneName: 'longOffset',
  });
  const guess = new Date(civil.getTime() - 390 * 60000);
  const zone = formatter.formatToParts(guess).find(part => part.type === 'timeZoneName').value;
  const offset = /^GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(zone);
  if (!offset) throw new RangeError('Unknown Myanmar time offset');
  const seconds = (Number(offset[2]) * 3600 + Number(offset[3]) * 60 + Number(offset[4] || 0));
  return new Date(civil.getTime() - (offset[1] === '-' ? -seconds : seconds) * 1000);
}

export function guruNakshatraAt(instant, moon = false) {
  const tropical = moon ? EclipticGeoMoon(instant).lon : Ecliptic(GeoVector(Body.Jupiter, instant, true)).elon;
  const result = nakshatraAt(instant, tropical);
  if (result.longitude >= 276 + 40 / 60 && result.longitude < 280 + 53 / 60 + 20 / 3600) {
    return { ...result, index: 21, pada: Math.floor((result.longitude - (276 + 40 / 60)) * 4 / (4 + 13 / 60 + 20 / 3600)) + 1 };
  }
  return { ...result, index: result.index + Number(result.index >= 21) };
}

export function solarNakshatraWindow(instant, nakshatra = solarNakshatraAt) {
  const { index } = nakshatra(instant);
  const center = instant.getTime();
  const day = 86400000;

  function boundary(direction) {
    let inside = center;
    let outside = center + direction * day;
    while (nakshatra(new Date(outside)).index === index) {
      inside = outside;
      outside += direction * day;
    }
    while (Math.abs(outside - inside) > 1000) {
      const midpoint = Math.round((inside + outside) / 2);
      if (nakshatra(new Date(midpoint)).index === index) inside = midpoint;
      else outside = midpoint;
    }
    return new Date(Math.max(inside, outside));
  }

  return { entry: boundary(-1), exit: boundary(1) };
}
