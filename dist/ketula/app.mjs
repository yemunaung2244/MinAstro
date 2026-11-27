import { computeLattaSnapshot } from '../latta.js';
import { myanmarBirthInstant } from '../janma.js';
import { yatraNames, connectStarInformation } from '../star-information.js';

const names = [...yatraNames.slice(0, 21), 'အဘိဇိ', ...yatraNames.slice(21)];
// The source lists mirrored rows between the two endpoints.
const opposite = index => index === 2 ? 16 : index === 16 ? 2 : (32 - index) % names.length;
const number = value => new Intl.NumberFormat('my').format(value);
const find = id => document.getElementById(id);

function position(planet) {
  const start = 276 + 40 / 60;
  const end = 280 + 53 / 60 + 20 / 3600;
  if (planet.longitude >= start && planet.longitude < end) {
    return { index: 21, pada: 1 + Math.floor(4 * (planet.longitude - start) / (end - start)) };
  }
  return { index: planet.starIndex + Number(planet.starIndex >= 21), pada: planet.pada };
}

function starLabel(index) {
  return names[index] + 'နက္ခတ်';
}

function append(parent, tag, value) {
  const node = document.createElement(tag);
  node.textContent = value;
  parent.append(node);
  return node;
}

function compare(parent, title, source, target) {
  const a = position(source);
  const b = position(target);
  const matchesStar = opposite(a.index) === b.index;
  append(parent, 'p', title + ' · ' + starLabel(a.index) + ' ပါဒ ' + number(a.pada) +
    ' ↔ ' + starLabel(b.index) + ' ပါဒ ' + number(b.pada) +
    (matchesStar ? (a.pada + b.pada === 5 ? ' · နက္ခတ်နှင့် ပါဒထွင်း' : ' · နက္ခတ်ထွင်း') : ' · သမသတ်ထွင်းမှု မရှိ'));
}

function snapshot(value) {
  return computeLattaSnapshot(myanmarBirthInstant(...value.split('T')));
}

const pairs = find('ketula-pairs');
for (let index = 0; index < 14; index++) {
  const first = (30 - index) % 28;
  const row = pairs.insertRow();
  for (const value of [number(index + 1), starLabel(first), starLabel(opposite(first))]) {
    row.insertCell().textContent = value;
  }
}
for (const index of [0, 4, 6, 7, 12, 13, 23, 27]) {
  append(find('ketula-notes'), 'li', starLabel(index));
}

const form = find('ketula-form');
const results = find('ketula-results');
form.elements.transit.value = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Yangon' }).replace(' ', 'T');
form.addEventListener('submit', event => {
  event.preventDefault();
  results.replaceChildren();
  find('ketula-error').textContent = '';
  try {
    const transit = snapshot(form.elements.transit.value);
    const natal = form.elements.natal.value ? snapshot(form.elements.natal.value) : null;
    const card = append(results, 'article', '');
    card.className = 'entry';
    for (const [scope, chart] of [['ကောဇာ', transit], ['မူလ', natal]]) {
      if (!chart) continue;
      const source = position(chart.byId.sun);
      append(card, 'h2', scope + ' တနင်္ဂနွေ အထွင်း');
      append(card, 'p', starLabel(source.index) + ' → ' + starLabel(opposite(source.index)) +
        ' · ထွင်းပါဒ ' + number(5 - source.pada));
      const matches = chart.planets.filter(planet => position(planet).index === opposite(source.index));
      append(card, 'p', 'အထွင်းခံ ဂြိုဟ်များ — ' + (matches.map(planet => planet.name).join('၊ ') || 'မရှိပါ'));
      compare(card, scope + ' တနင်္ဂနွေ နှင့် တနင်္လာ', chart.byId.sun, chart.byId.moon);
    }
    if (natal) {
      compare(card, 'မူလ တနင်္ဂနွေ နှင့် ကောဇာ တနင်္လာ', natal.byId.sun, transit.byId.moon);
      compare(card, 'မူလ တနင်္လာ နှင့် ကောဇာ တနင်္ဂနွေ', natal.byId.moon, transit.byId.sun);
    }
    location.hash = 'result';
  } catch {
    results.replaceChildren();
    find('ketula-error').textContent = 'ရက်စွဲနှင့် အချိန်ကို ပြန်စစ်ပါ။';
  }
});
connectStarInformation(document.querySelector('main'));
function showPage() {
  const showResult = location.hash === '#result' && results.childElementCount > 0;
  find('ketula-input').hidden = showResult;
  find('ketula-output').hidden = !showResult;
  if (showResult) find('ketula-result-title').focus();
  else if (location.hash === '#result') history.replaceState(null, '', '#input');
}

window.addEventListener('hashchange', showPage);
showPage();
