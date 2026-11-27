import { janmaAt, myanmarBirthInstant, solarNakshatraAt, suriyaSlot } from '../janma.js';
import { yatraNames, connectStarInformation } from '../star-information.js';
import { chartRegions } from './rules.mjs';

const find = id => document.getElementById(id);
const form = find('chart-form');
const rows = find('chart-rows');
const digits = '၀၁၂၃၄၅၆၇၈၉';
const mm = value => String(value).replace(/[0-9]/g, digit => digits[Number(digit)]);
const starLabel = index => yatraNames[index] + 'နက္ခတ်';

function showPage() {
  const result = location.hash === '#result' && rows.rows.length > 0;
  form.hidden = result;
  find('output').hidden = !result;
  if (result) find('result-title').focus();
  else if (location.hash === '#result') history.replaceState(null, '', '#input');
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const error = find('chart-error');
  let instant;
  try {
    instant = myanmarBirthInstant(...form.elements.birth.value.split('T'));
  } catch {
    error.hidden = false;
    return;
  }
  const sun = solarNakshatraAt(instant).index;
  const moon = janmaAt(instant).index;
  const offset = suriyaSlot(moon, sun);
  const regions = chartRegions(sun);
  const match = regions.find(region => region.stars.includes(moon));
  find('summary').textContent = 'နေစီး ' + starLabel(sun) + ' မှ လစီး ' + starLabel(moon)
    + ' အထိ ' + mm(offset + 1) + ' လုံးမြောက် · ' + match.name;
  find('reading').textContent = 'ကျမ်းပါအဟော — ' + match.reading;
  rows.replaceChildren();
  for (const region of regions) {
    const row = rows.insertRow();
    const title = document.createElement('th');
    title.scope = 'row';
    title.textContent = region.name;
    row.append(title);
    row.insertCell().textContent = mm(region.start + 1) + ' – ' + mm(region.start + region.count);
    row.insertCell().textContent = region.stars.map(starLabel).join('၊ ');
    if (region === match) row.className = 'tri-row-active';
  }
  error.hidden = true;
  if (location.hash === '#result') showPage();
  else location.hash = '#result';
});
connectStarInformation(document.querySelector('main'));
window.addEventListener('hashchange', showPage);
showPage();
