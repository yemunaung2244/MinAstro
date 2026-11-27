import { myanmarBirthInstant } from '../janma.js';
import { panchangAt, tithiName } from '../panchang.js';
import { yatraNames, connectStarInformation } from '../star-information.js';
import { groups, tithiGroup } from './rules.mjs';

const find = id => document.getElementById(id);
const form = find('chart-form');
const results = find('result-rows');
const signs = ['မိဿ', 'ပြိဿ', 'မေထုန်', 'ကရကဋ်', 'သိဟ်', 'ကန်', 'တူ', 'ဗြိစ္ဆာ', 'ဓနု', 'မကာရ', 'ကုမ်', 'မိန်'];
const mm = value => String(value).replace(/[0-9]/g, digit => '၀၁၂၃၄၅၆၇၈၉'[Number(digit)]);

function addRow(body, heading, values) {
  const row = body.insertRow();
  const header = document.createElement('th');
  header.scope = 'row';
  header.textContent = heading;
  row.append(header);
  for (const value of values) row.insertCell().textContent = value;
}

function showPage() {
  const result = location.hash === '#result' && results.rows.length > 0;
  form.hidden = result;
  find('output').hidden = !result;
  if (result) find('result-title').focus();
  else if (location.hash === '#result') history.replaceState(null, '', '#input');
}

const reference = find('reference');
const splitLabels = names => groups.map((_, group) => names.filter((_, index) => index % 2 === group).join('၊ '));
addRow(reference, 'နက္ခတ်', splitLabels(yatraNames.map(name => name + 'နက္ခတ်')));
addRow(reference, 'ရာသီ', splitLabels(signs.map(name => name + 'ရာသီ')));
addRow(reference, 'တီထိ', groups.map((_, group) => {
  const days = Array.from({ length: 14 }, (_, index) => index).filter(index => tithiGroup(index) === group);
  const boundary = group === 0 ? 'လပြည့်တီထိ' : 'လကွယ်တီထိ';
  return 'လဆန်းနှင့် လပြည့်ကျော် ' + days.map(index => mm(index + 1)).join('၊ ') + ' လုံး၊ ' + boundary;
}));

form.elements.time.value = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Yangon' }).replace(' ', 'T');
form.addEventListener('submit', event => {
  event.preventDefault();
  const error = find('error');
  let instant;
  try {
    instant = myanmarBirthInstant(...form.elements.time.value.split('T'));
  } catch (cause) {
    if (!(cause instanceof RangeError)) throw cause;
    error.hidden = false;
    return;
  }
  const { moon, sun, nakshatra, tithi } = panchangAt(instant);
  const tithiLabel = tithi === 14 ? 'လပြည့်တီထိ' : tithi === 29 ? 'လကွယ်တီထိ' : tithiName(tithi);
  results.replaceChildren();
  addRow(results, 'စန်းစီးနက္ခတ်', [yatraNames[nakshatra] + 'နက္ခတ်', groups[nakshatra % 2]]);
  for (const [label, longitude] of [['စန်းစီးရာသီ', moon.longitude], ['နေစီးရာသီ', sun.longitude]]) {
    const sign = Math.floor(longitude / 30);
    addRow(results, label, [signs[sign] + 'ရာသီ', groups[sign % 2]]);
  }
  addRow(results, 'တီထိ', [tithiLabel, groups[tithiGroup(tithi)]]);
  error.hidden = true;
  if (location.hash === '#result') showPage();
  else location.hash = '#result';
});
connectStarInformation(document.querySelector('main'));
window.addEventListener('hashchange', showPage);
showPage();
