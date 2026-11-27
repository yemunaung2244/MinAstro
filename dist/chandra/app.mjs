import { janmaAt } from '../janma.js';
import { myanmarMonth } from '../myanmar-calendar.js';
import { solarTimes } from '../nadika.js';
import { computeLattaSnapshot } from '../latta.js';
import { lagnaNakshatraAt } from '../jamitra.js';
import { calculateAnchor, myanmarInstant, myanmarDateTime } from '../kalanala/ephemeris.mjs';
import { connectStarInformation, yatraNames } from '../star-information.js';
import { chandraRegions } from './rules.mjs';

const find = id => document.getElementById(id);
const form = find('chart-form');
const rows = find('chart-rows');
const mm = value => String(value).replace(/[0-9]/g, digit => '၀၁၂၃၄၅၆၇၈၉'[Number(digit)]);
const star = index => yatraNames[index] + 'နက္ခတ်';
form.elements.reference.value = myanmarDateTime(new Date());
form.elements.mode.addEventListener('change', () => {
  const natal = form.elements.mode.value === 'natal';
  find('reference-field').hidden = natal;
  form.elements.reference.required = !natal;
});

function fullMoonSunrise(value, latitude, longitude) {
  const day = value.slice(0, 10);
  const { md } = myanmarMonth(day);
  const full = new Date(Date.parse(day + 'T12:00:00Z') + (15 - md) * 86400000).toISOString().slice(0, 10);
  const { sunrise } = solarTimes(full, latitude, longitude);
  if (!Number.isFinite(sunrise)) throw new RangeError('Sunrise unavailable');
  // solarTimes returns minutes in Myanmar standard time.
  const civil = new Date(Date.parse(full + 'T00:00:00Z') + Math.round(sunrise * 60) * 1000);
  return myanmarInstant(civil.toISOString().slice(0, 19));
}

function showPage() {
  const visible = location.hash === '#result' && rows.rows.length > 0;
  form.hidden = visible;
  find('output').hidden = !visible;
  if (visible) find('result-title').focus();
  else if (location.hash === '#result') history.replaceState(null, '', '#input');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const error = find('chart-error');
  try {
    const mode = form.elements.mode.value;
    const birth = myanmarInstant(form.elements.birth.value);
    const value = mode === 'natal' ? form.elements.birth.value : form.elements.reference.value;
    const reference = myanmarInstant(value);
    const latitude = form.elements.latitude.valueAsNumber;
    const longitude = form.elements.longitude.valueAsNumber;
    const anchorTime = mode === 'annual' ? new Date(calculateAnchor(4, value).instant)
      : fullMoonSunrise(value, latitude, longitude);
    const anchor = janmaAt(anchorTime).index;
    const natalStar = janmaAt(birth).index;
    const lagna = lagnaNakshatraAt(reference, latitude, longitude).index;
    const regions = chandraRegions(anchor);
    const active = regions.find(region => region.stars.includes(natalStar));
    const lagnaRegion = regions.find(region => region.stars.includes(lagna));
    const planets = computeLattaSnapshot(reference).planets;
    find('summary').textContent = 'အခြေခံနက္ခတ် — ' + star(anchor) + ' · ' + mm(myanmarDateTime(anchorTime).replace('T', ' '));
    find('reading').textContent = 'မူလဇနမ ' + star(natalStar) + ' · ' + active.name + ' · ကျမ်းပါအဟော — ' + active.reading;
    find('lagna').textContent = (mode === 'natal' ? 'မူလ' : 'ကောဇာ') + ' လဂ်စီး ' + star(lagna) + ' · ' + lagnaRegion.name;
    rows.replaceChildren();
    for (const region of regions) {
      const row = rows.insertRow();
      const title = document.createElement('th');
      title.scope = 'row';
      title.textContent = region.name;
      row.append(title);
      for (const value of [mm(region.start + 1) + ' – ' + mm(region.start + region.stars.length),
        region.stars.map(star).join('၊ '), planets.filter(planet => region.stars.includes(planet.starIndex)).map(planet => planet.name).join('၊ ') || '—']) {
        row.insertCell().textContent = value;
      }
      if (region === active) row.className = 'tri-row-active';
    }
    error.hidden = true;
    if (location.hash === '#result') showPage();
    else location.hash = '#result';
  } catch (cause) {
    if (!(cause instanceof RangeError)) throw cause;
    error.hidden = false;
  }
});
connectStarInformation(document.querySelector('main'));
window.addEventListener('hashchange', showPage);
showPage();
