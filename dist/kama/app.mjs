import { janmaAt, myanmarBirthInstant } from '../janma.js';
import { yatraNames, connectStarInformation } from '../star-information.js';
import { groups, compareStars } from './rules.mjs';

const find = id => document.getElementById(id);
const form = find('chart-form');
const results = find('result-rows');
const star = index => yatraNames[index] + 'နက္ခတ်';
const birthStar = value => janmaAt(myanmarBirthInstant(...value.split('T'))).index;

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

for (const group of groups) {
  addRow(find('groups'), group.name, [group.stars.map(star).join('၊ ')]);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const error = find('error');
  try {
    const man = birthStar(form.elements.man.value);
    const woman = birthStar(form.elements.woman.value);
    const { first, second, reading } = compareStars(man, woman);
    results.replaceChildren();
    addRow(results, 'အမျိုးသား', [star(man), first.name]);
    addRow(results, 'အမျိုးသမီး', [star(woman), second.name]);
    find('reading').textContent = reading;
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
