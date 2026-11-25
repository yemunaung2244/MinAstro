import { planetaryStars } from './ephemeris.mjs';
import { stars } from './calculations.mjs';
import { Body, Observer, SearchRiseSet, SearchMoonPhase, MoonPhase } from '../astronomy-engine.js';

// Nakshatra Notes, volume 5, pp. 106–108. Counts include the starting star.
export const sequences = {
  pakkha: [['ketu',12],['mercury',17],['venus',4],['rahu',14],['mars',18],['jupiter',13],['saturn',10],['moon',15]],
  dina: [['mars',7],['mercury',4],['jupiter',5],['venus',6],['saturn',7],['sun',9],['rahu',9],['ketu',9]],
  khana: [['moon',3],['mars',5],['mercury',7],['jupiter',8],['venus',8],['saturn',14],['rahu',8],['ketu',7]]
};

const zodiac = stars.map((_, index) => index).filter(index => stars[index] !== 'အဘိဇိ');

export function takkalikaPlacements(method, anchorStar) {
  const anchor = method === 'dina' ? 'moon' : 'sun';
  let index = zodiac.indexOf(anchorStar);
  const planets = { [anchor]: anchorStar };
  for (const [planet, count] of sequences[method]) {
    index = (index + count - 1) % zodiac.length;
    planets[planet] = zodiac[index];
  }
  return planets;
}

export function takkalikaAt(instant, location, method) {
  let start, end, slot;
  const anchor = method === 'dina' ? 'moon' : 'sun';
  let anchorTime;
  if (method === 'pakkha') {
    const phase = MoonPhase(instant) < 180 ? 0 : 180;
    start = SearchMoonPhase(phase, instant, -20).date;
    end = SearchMoonPhase(180-phase, start, 20).date;
    anchorTime = start;
  } else {
    const observer = new Observer(location.latitude, location.longitude, 0);
    const solar = (direction, from, span) => SearchRiseSet(Body.Sun, observer, direction, from, span).date;
    start = solar(1, instant, -2);
    end = solar(1, new Date(+start+1000), 2);
    anchorTime = start;
    if (method === 'khana') {
      const sunset = solar(-1, start, 1);
      if (instant >= sunset) start = sunset;
      else end = sunset;
      const part = (+end-start)/30;
      const index = Math.min(29,Math.floor((instant-start)/part));
      const base = +start;
      start = new Date(Math.ceil(base+index*part));
      end = new Date(Math.ceil(base+(index+1)*part));
      slot = index+1;
    }
  }
  const anchors = planetaryStars(anchorTime);
  return { start, end, slot, planets: takkalikaPlacements(method,
    anchor === 'moon' ? anchors.birthMoon : anchors.zodiacSun) };
}
