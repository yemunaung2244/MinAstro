import { janmaAt, myanmarBirthInstant, solarNakshatraAt, suriyaSlot } from '../janma.js';
import { yatraNames, connectStarInformation } from '../star-information.js';

const readings = [
  'သေမယ်။',
  'ချမ်းသာကြွယ်ဝမယ်။',
  'သေမယ်။',
  'သေမယ်။',
  'သားသမီးကောင်းရမယ်။',
  'သေမယ်။',
  'ဆင်းရဲမယ်။',
  'အလွန် ချမ်းသာမယ်။',
  '(မိမိလုပ်ဆောင်သမျှမှာ) အလွန် တိုးတက် ကြီးပွားမယ်။',
];
const find = id => document.getElementById(id);
const number = new Intl.NumberFormat('my-u-nu-mymr');
const mm = value => number.format(value);
const form = find('chart-form');
const results = find('results');

function row(table, values) {
  const entry = table.insertRow();
  for (const value of values) entry.insertCell().textContent = value;
  return entry;
}

function calculate(title, sun, moon) {
  const distance = suriyaSlot(moon, sun);
  const entry = row(results, [
    title,
    yatraNames[sun] + 'နက္ခတ် → ' + yatraNames[moon] + 'နက္ခတ် · ' + mm(distance + 1) + ' လုံးမြောက်',
    readings[Math.floor(distance / 3)],
  ]);
  entry.className = 'tri-row-active';
}

function chart(value) {
  const instant = myanmarBirthInstant(...value.split('T'));
  return { sun: solarNakshatraAt(instant).index, moon: janmaAt(instant).index };
}

function showPage() {
  const showResult = location.hash === '#result' && results.rows.length > 0;
  form.hidden = showResult;
  find('output').hidden = !showResult;
  if (showResult) find('result-title').focus();
  else if (location.hash === '#result') history.replaceState(null, '', '#input');
}

readings.forEach((reading, index) => {
  row(find('reference'), [mm(index * 3 + 1) + ' – ' + mm(index * 3 + 3), reading]);
});
form.elements.transit.value = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Yangon' }).replace(' ', 'T');
form.addEventListener('submit', event => {
  event.preventDefault();
  const error = find('chart-error');
  try {
    const transit = chart(form.elements.transit.value);
    const natal = form.elements.natal.value ? chart(form.elements.natal.value) : null;
    results.replaceChildren();
    if (natal) {
      calculate('မူလတနင်္ဂနွေ + မူလတနင်္လာ', natal.sun, natal.moon);
      calculate('မူလတနင်္ဂနွေ + ကောဇာတနင်္လာ', natal.sun, transit.moon);
    }
    calculate('ကောဇာတနင်္ဂနွေ + ကောဇာတနင်္လာ', transit.sun, transit.moon);
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
