import { Body, Ecliptic, EclipticGeoMoon, GeoVector, MakeTime, SiderealTime, SunPosition, e_tilt } from '../astronomy-engine.js';

const yangon = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Yangon', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'longOffset'
});

export function yangonDateTime(instant = new Date()) {
  const fields = Object.fromEntries(yangon.formatToParts(instant).map(({type, value}) => [type, value]));
  return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
}

export function yangonInstant(value) {
  const civil = Date.parse(value + 'Z');
  if (!Number.isFinite(civil)) throw new RangeError('Invalid date and time');
  const approximateInstant = new Date(civil - 390 * 60000);
  const zone = yangon.formatToParts(approximateInstant).find(part => part.type === 'timeZoneName').value;
  const offset = /^GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(zone);
  if (!offset) throw new RangeError('Unknown Myanmar time offset');
  const seconds = Number(offset[2]) * 3600 + Number(offset[3]) * 60 + Number(offset[4] ?? 0);
  return new Date(civil - (offset[1] === '-' ? -seconds : seconds) * 1000);
}

function normalize(longitude) {
  const angle = longitude % 360;
  return angle < 0 ? angle + 360 : angle;
}
const abhijitStart = 276 + 40 / 60;
const abhijitEnd = 280 + 53 / 60 + 20 / 3600;

function zodiacStarIndex(angle) {
  const index = Math.floor(angle * 27 / 360);
  return index + Number(index >= 21);
}

export function starIndex(longitude) {
  const angle = normalize(longitude);
  if (angle >= abhijitStart && angle < abhijitEnd) return 21;
  return zodiacStarIndex(angle);
}

const planets = {
  mars: Body.Mars, mercury: Body.Mercury, jupiter: Body.Jupiter,
  venus: Body.Venus, saturn: Body.Saturn
};

export function planetaryStars(instant, coordinates) {
  const time = MakeTime(instant);
  const centuries = time.tt / 36525;
  // Mean Lahiri approximation and Abhijit limits match the reference app.
  const ayanamsa = 23.85675 + (5028.796195 * centuries + 1.1054348 * centuries ** 2) / 3600;
  const siderealStar = tropical => starIndex(tropical - ayanamsa);
  // Meeus, Astronomical Algorithms, chapter 47. Mean ascending lunar node.
  const t = centuries;
  const meanNode = 125.0445479 + t * (-1934.1362891 + t * (0.0020754 + t * (1 / 467441 - t / 60616000)));
  const tropicalSun = SunPosition(time).elon;
  const tropicalMoon = EclipticGeoMoon(time).lon;
  const result = {
    rahu: siderealStar(meanNode),
    ketu: siderealStar(meanNode + 180),
    sun: siderealStar(tropicalSun),
    zodiacSun: zodiacStarIndex(normalize(tropicalSun - ayanamsa)),
    moon: siderealStar(tropicalMoon),
    birthMoon: zodiacStarIndex(normalize(tropicalMoon - ayanamsa))
  };
  for (const [id, body] of Object.entries(planets)) {
    result[id] = siderealStar(Ecliptic(GeoVector(body, time, true)).elon);
  }
  if (coordinates) {
    const rad = Math.PI / 180;
    const localSidereal = (SiderealTime(time) * 15 + coordinates.longitude) * rad;
    const tilt = e_tilt(time).tobl * rad;
    const tropicalAscendant = Math.atan2(Math.cos(localSidereal),
      -Math.sin(localSidereal) * Math.cos(tilt) - Math.tan(coordinates.latitude * rad) * Math.sin(tilt)) / rad;
    result.lagna = siderealStar(tropicalAscendant);
  }
  return result;
}
