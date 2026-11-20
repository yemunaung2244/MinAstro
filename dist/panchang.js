import { Body, Observer, SearchRiseSet, MoonPhase, Illumination } from './astronomy-engine.js';
import { janmaAt, solarNakshatraAt, myanmarBirthInstant } from './janma.js';

const circle = angle => (angle % 360 + 360) % 360;
export function panchangAt(instant) {
  const moon = janmaAt(instant);
  const sun = solarNakshatraAt(instant);
  const phase = MoonPhase(instant);
  return {
    tithi: Math.floor(phase / 12),
    nakshatra: moon.index,
    yoga: Math.floor(circle(moon.longitude + sun.longitude) / (360 / 27)),
    karana: Math.floor(phase / 6),
    phase, moon, sun,
  };
}
export function karanaName(index) {
  const moving = ['ဗဝ', 'ဗာလဝ', 'ကောလဝ', 'တဲတိလ', 'ဂရဇ', 'ဝဏိဇ', 'ဝိဋ္ဌိ'];
  return index === 0 ? 'ကိံသ္တုဃ္န' : index >= 57
    ? ['သကုနိ', 'စတုပ္ပဒ', 'နာဂ'][index - 57] : moving[(index - 1) % 7];
}
export const yogaNames = ['ဝိရှကမ္ဘ','ပ்ரீတိ','အာယုရှ္မန်','သောဘာန','အတိဂဏ္ဍ','သုကရ္မ','ဓြိတိ','သူလ','ဂဏ္ဍ','ဝြိဒ္ဓိ','ဓြုဝ','ဗျာဃာတ','ဟရ်ရှဏ','ဝဇြ','သိဒ္ဓိ','ဗျတီပါတ','ဝရီယန်','ပရိဃ','သိဝ','သိဒ္ဓ','သာဓျ','သုဘ','သုက္လ','ဗြဟ္မ','အိန္ဒြ','ဝဲဓြိတိ'];
yogaNames.splice(3, 0, 'သောဘာဂျ');
export function tithiName(index) {
  const phase = index < 15 ? 'လဆန်း' : 'လပြည့်ကျော်';
  const number = String(index % 15 + 1).replace(/[0-9]/g, digit => '၀၁၂၃၄၅၆၇၈၉'[Number(digit)]);
  return phase + 'တီထိ ' + number + ' လုံး';
}
export function dailyPanchang(date, latitude, longitude) {
  const midnight = myanmarBirthInstant(date, '00:00:00');
  const observer = new Observer(latitude, longitude, 0);
  const event = (body, direction, start = midnight, limit = 1) =>
    SearchRiseSet(body, observer, direction, start, limit)?.date ?? null;
  const sunrise = event(Body.Sun, 1);
  if (!sunrise) throw new RangeError('No sunrise');
  const nextSunrise = event(Body.Sun, 1, new Date(sunrise.getTime() + 60000), 2);
  const sunset = event(Body.Sun, -1);
  const moonrise = event(Body.Moon, 1);
  const moonset = event(Body.Moon, -1);
  const stop = nextSunrise.getTime();
  const periods = {};
  for (const key of ['tithi', 'nakshatra', 'yoga', 'karana']) {
    let start = sunrise.getTime();
    const list = [];
    while (start < stop) {
      const index = panchangAt(new Date(start))[key];
      let outside = start + 3600000;
      while (outside < start + 3 * 86400000 && panchangAt(new Date(outside))[key] === index) outside += 3600000;
      let inside = outside - 3600000;
      while (outside - inside > 1000) {
        const middle = (inside + outside) / 2;
        if (panchangAt(new Date(middle))[key] === index) inside = middle;
        else outside = middle;
      }
      list.push({ index, end: new Date(outside) });
      start = outside + 1000;
    }
    periods[key] = list;
  }
  return { midnight, sunrise, sunset, moonrise, moonset, nextSunrise, periods,
    illumination: Illumination(Body.Moon, sunrise).phase_fraction };
}
