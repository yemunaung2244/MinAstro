import { computeLattaSnapshot } from '../latta.js';
import { myanmarBirthInstant } from '../janma.js';
import { panchangAt, tithiName } from '../panchang.js';
import { rashiNames } from '../jamitra.js';
import { yatraNames, connectStarInformation } from '../star-information.js';

const find = id => document.getElementById(id);
const form = find('chart-form');
const results = find('results');
const groups = ['ရိတ္တာ', 'ပုဏ္ဏာ'];
const star = index => yatraNames[index] + 'နက္ခတ်';
const offset = (value, base, size) => (value - base + size) % size;
const group = (value, base, size) => groups[offset(value, base, size) % 2];
const instant = value => myanmarBirthInstant(...value.split('T'));

function addRow(body, title, values) {
  const row = body.insertRow();
  const header = document.createElement('th');
  header.scope = 'row';
  header.textContent = title;
  row.append(header);
  for (const value of values) row.insertCell().textContent = value;
}

function tableFor(headers) {
  const table = document.createElement('table');
  table.className = 'tri-readings-table';
  const row = table.createTHead().insertRow();
  for (const title of headers) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = title;
    row.append(cell);
  }
  return table;
}

function showPage() {
  const visible = location.hash === '#result' && results.childElementCount > 0;
  form.hidden = visible;
  find('output').hidden = !visible;
  if (visible) find('result-title').focus();
  else if (location.hash === '#result') history.replaceState(null, '', '#input');
}

form.elements.transit.value = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Yangon' }).replace(' ', 'T');
form.addEventListener('submit', event => {
  event.preventDefault();
  let birthTime, transitTime;
  try {
    birthTime = instant(form.elements.birth.value);
    transitTime = instant(form.elements.transit.value);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    find('error').hidden = false;
    return;
  }
  const birth = computeLattaSnapshot(birthTime);
  const transit = computeLattaSnapshot(transitTime);
  const summary = tableFor(['ဂြိုဟ်', 'မူလစီးနက္ခတ်', 'ကောဇာစီးနက္ခတ် · အုပ်စု', 'ကောဇာစန်း · အုပ်စု', 'မူလဇနမ · အုပ်စု']);
  const body = summary.createTBody();
  const scroll = document.createElement('div');
  scroll.className = 'tri-table-scroll';
  scroll.append(summary);
  const output = document.createDocumentFragment();
  output.append(scroll);
  for (const planet of birth.planets) {
    const base = planet.starIndex;
    const classify = index => star(index) + ' · ' + group(index, base, 27);
    addRow(body, planet.name, [star(base), classify(transit.byId[planet.id].starIndex),
      classify(transit.byId.moon.starIndex), classify(birth.byId.moon.starIndex)]);
    const detail = document.createElement('details');
    detail.className = 'tri-guide';
    const label = document.createElement('summary');
    label.textContent = planet.name + ' ကုမ္ဘစက်';
    const table = tableFor(['အုပ်စု', 'နက္ခတ်']);
    const stars = Array.from({ length: 27 }, (_, index) => (base + index) % 27);
    const tableBody = table.createTBody();
    groups.forEach((name, parity) => addRow(tableBody, name, [stars.filter((_, index) => index % 2 === parity).map(star).join('၊ ')]));
    detail.append(label, table);
    output.append(detail);
  }
  const other = tableFor(['အမျိုးအစား', 'မူလ', 'ကောဇာ', 'အုပ်စု']);
  const otherBody = other.createTBody();
  for (const planet of birth.planets) {
    const natalSign = Math.floor(planet.longitude / 30);
    const transitSign = Math.floor(transit.byId[planet.id].longitude / 30);
    addRow(otherBody, planet.name + ' စီးရာသီ', [
      rashiNames[natalSign] + 'ရာသီ', rashiNames[transitSign] + 'ရာသီ', group(transitSign, natalSign, 12),
    ]);
  }
  const natalTithi = panchangAt(birthTime).tithi;
  const transitTithi = panchangAt(transitTime).tithi;
  addRow(otherBody, 'တီထိ', [tithiName(natalTithi), tithiName(transitTithi), group(transitTithi, natalTithi, 30)]);
  const more = document.createElement('details');
  more.className = 'tri-guide';
  const moreLabel = document.createElement('summary');
  moreLabel.textContent = 'ရာသီနှင့် တီထိ';
  more.append(moreLabel, other);
  output.append(more);
  results.replaceChildren(output);
  find('error').hidden = true;
  if (location.hash === '#result') showPage();
  else location.hash = '#result';
});
connectStarInformation(document.querySelector('main'));
window.addEventListener('hashchange', showPage);
showPage();
