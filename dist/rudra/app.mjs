import { guruNakshatraAt, janmaAt, myanmarBirthInstant, solarNakshatraAt } from '../janma.js';
import { yatraNames, connectStarInformation } from '../star-information.js';
import { ordinals, rudraTargets } from './rules.mjs';

const names28 = [...yatraNames.slice(0, 21), 'အဘိဇိ', ...yatraNames.slice(21)];
const find = id => document.getElementById(id);
const form = find('chart-form');
const results = find('results');
const number = new Intl.NumberFormat('my-u-nu-mymr');
const starLabel = (names, index) => names[index] + 'နက္ခတ်';

function chart(value, useTable) {
  const instant = myanmarBirthInstant(...value.split('T'));
  const sun = solarNakshatraAt(instant);
  if (useTable) return { sun: sun.index, moon: janmaAt(instant).index };
  const inAbhijit = sun.longitude >= 276 + 40 / 60 && sun.longitude < 280 + 53 / 60 + 20 / 3600;
  return { sun: inAbhijit ? 21 : sun.index + Number(sun.index >= 21), moon: guruNakshatraAt(instant, true).index };
}

function addRow(body, values) {
  const row = body.insertRow();
  for (const value of values) row.insertCell().textContent = value;
  return row;
}

function appendComparison(title, sun, moon, names, useTable) {
  const targets = rudraTargets(sun, useTable);
  const hit = targets.indexOf(moon);
  const row = addRow(results, [title, starLabel(names, sun) + ' → ' + starLabel(names, moon),
    hit < 0 ? 'ရုဒြနက္ခတ် မကျပါ။' : 'ရုဒြနက္ခတ် ကျပါသည် · ' + number.format(ordinals[hit]) + ' လုံးမြောက်']);
  if (hit >= 0) row.className = 'tri-row-active';
}

function showPage() {
  const showResult = location.hash === '#result' && results.rows.length > 0;
  form.hidden = showResult;
  find('output').hidden = !showResult;
  if (showResult) find('result-title').focus();
  else if (location.hash === '#result') history.replaceState(null, '', '#input');
}

form.elements.transit.value = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Yangon' }).replace(' ', 'T');
form.addEventListener('submit', event => {
  event.preventDefault();
  const error = find('chart-error');
  try {
    const useTable = form.elements.method.value === 'table';
    const names = useTable ? yatraNames : names28;
    const transit = chart(form.elements.transit.value, useTable);
    const natal = form.elements.natal.value ? chart(form.elements.natal.value, useTable) : null;
    results.replaceChildren();
    find('method-note').textContent = useTable
      ? 'ပုံပါ အဆင်သင့်ဇယားကို အဘိဇိမပါသော ၂၇ တန်းအတိုင်း အသုံးပြုထားသည်။'
      : 'စာပိုဒ်ပါ အဘိဇိပါဝင်သော ၂၈ လုံးမူဖြင့် နေစီးနက္ခတ်ကို ၁ မှစ၍ ရေတွက်ထားသည်။';
    if (natal) {
      appendComparison('မူလနေ + မူလလ', natal.sun, natal.moon, names, useTable);
      appendComparison('မူလနေ + ကောဇာလ', natal.sun, transit.moon, names, useTable);
    }
    appendComparison('ကောဇာနေ + ကောဇာလ', transit.sun, transit.moon, names, useTable);
    const table = document.createElement('table');
    table.className = 'tri-readings-table';
    const caption = table.createCaption();
    caption.textContent = 'ရုဒြနက္ခတ် ၅ လုံး';
    const head = table.createTHead().insertRow();
    for (const label of ['နေစီးနက္ခတ်', ...ordinals.map(value => number.format(value) + ' လုံးမြောက်')]) {
      const header = document.createElement('th');
      header.scope = 'col';
      header.textContent = label;
      head.append(header);
    }
    const body = table.createTBody();
    for (const sun of new Set(natal ? [natal.sun, transit.sun] : [transit.sun])) {
      addRow(body, [sun, ...rudraTargets(sun, useTable)].map(index => starLabel(names, index)));
    }
    const container = find('candidates');
    container.className = 'tri-table-scroll';
    container.replaceChildren(table);
    error.hidden = true;
    if (location.hash === '#result') showPage();
    else location.hash = '#result';
  } catch {
    error.textContent = 'ရက်စွဲနှင့် အချိန်ကို ပြန်စစ်ပါ။';
    error.hidden = false;
  }
});
connectStarInformation(document.querySelector('main'));
window.addEventListener('hashchange', showPage);
showPage();
