import { tips, vedhaTargets, vedhaNames, vedhaColors } from './vedha.mjs';
import { calculateBhumi, bhumiWindows, directionOf, directions as bhumiDirections } from './bhumi.mjs';
import { fourteenGroups, fourteenSlots, fourteenReadings, fourteenNote } from './chaturdasha.mjs';
import { groupSource } from './readings.mjs?v=gudha-text';
import { stars, groups, modes, rotateStars, anchorSlot } from './calculations.mjs?v=clockwise';
import { calculateAnchor, myanmarDateTime, myanmarInstant, planetaryStars } from './ephemeris.mjs?v=natal-full-moon';

const find = id => document.getElementById(id);
const mode = find('mode');
const method = find('method');
const anchor = find('anchor');
const date = find('date');
const year = find('year');
const calculatorStatus = find('calculator-status');
const bhumiForm = '#bhumi';
const bhumiResult = '#bhumi-results';
const bhumiName = 'ကာလရေခါ ဘူမိစက်';
const resultHash = '#results';
const fourteenForm = '#chaturdasha';
const fourteenResult = '#chaturdasha-results';
const fourteenName = 'စတုဒ္ဒဿဂူဍကာလာနလစက်';
const standardName = 'ဂူဍကာလာနလစက်';
const charts = find('charts');
const status = find('status');
const error = find('error');
const restore = find('restore');
const savedActions = find('saved-actions');
const storageKey = 'kalanala.charts.v1';
const sessionKey = 'kalanala.active-charts.v1';
let current;

const notes = [
  'မွေးချိန်ရှိ လ၏နက္ခတ်ကို တွက်သည်။',
  'မွေးရာ မြန်မာလ၏ လပြည့်နေ့ မနက် ၆ နာရီရှိ စန်းစီးနက္ခတ်ကို တွက်သည်။',
  'ရွေးထားသောအချိန် ပါဝင်သည့် လဆန်းမှ လကွယ်အတွင်းရှိ လပြည့်ချိန်ကို တွက်သည်။',
  'ရွေးထားသော နေ့ရက်နှင့် အချိန်ရှိ လ၏နက္ခတ်ကို တွက်သည်။',
  'ရွေးထားသောနှစ်တွင် နေ မိဿရာသီ စတင်ဝင်ချိန်ရှိ လ၏နက္ခတ်ကို တွက်သည်။'
];

function element(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function addOptions(select, entries) {
  entries.forEach(([label], index) => select.add(new Option(label, index)));
}

addOptions(mode, modes);
addOptions(anchor, stars);
date.value = myanmarDateTime().slice(0, 16);
year.value = date.value.slice(0, 4);

function setField(id, control, visible) {
  find(id).hidden = !visible;
  control.disabled = !visible;
}

function updateFields() {
  const bhumi = location.hash === bhumiForm;
  const index = bhumi ? 2 : Number(mode.value);
  const manual = method.value === 'manual';
  find('anchor-label').textContent = modes[index][1];
  find('date-label').textContent = index < 2 ? 'မွေးရက်နှင့် မွေးချိန် (မြန်မာစံတော်ချိန်)' : 'ရက်စွဲနှင့် အချိန် (မြန်မာစံတော်ချိန်)';
  setField('anchor-field', anchor, manual);
  setField('mode-field', mode, !bhumi);
  setField('date-field', date, bhumi || (!manual && index !== 4));
  setField('year-field', year, !manual && index === 4);
  find('method-note').textContent = manual ? 'အခြေခံနက္ခတ်ကို ရွေးပါ။' :
    notes[index];
  if (bhumi) {
    find('date-label').textContent = 'ကြည့်လိုသည့် ရက်စွဲနှင့် အချိန် (မြန်မာစံတော်ချိန်)';
    find('method-note').textContent = 'တစ်လစာအတွက် ကောဇာလပြည့်နက္ခတ်ကို အခြေခံပြီး စန်းနှင့် တနင်္ဂနွေ ရှိရာအရပ်ကို တွက်ပါသည်။';
  }
  error.hidden = true;
}

function lattice() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 8 8');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('lattice');
  const lines = [];
  for (let i = 1; i <= 7; i++) {
    lines.push(`M${i} 0V8 M0 ${i}H8`);
    for (let j = 1; j <= 7; j++) lines.push(`M${i} ${j - 1}l1 1 -1 1 -1 -1Z`);
  }
  for (const [pathData, width] of [[lines.join(' '), '1.25'], ['M-.35 -.35L8.35 8.35 M-.35 8.35L8.35 -.35', '3.4']]) {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#161616');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('stroke-width', width);
    svg.append(path);
  }
  return svg;
}

function drawDepartments(board, placements, definitions, openDepartment) {
  const edges = ['top', 'right', 'bottom', 'left'];
  for (let edge = 0; edge < edges.length; edge++) {
    let start = 0;
    while (start < 7) {
      const group = placements[edge * 7 + start].group;
      let end = start + 1;
      while (end < 7 && placements[edge * 7 + end].group === group) end++;
      const bracket = element('div', '', 'department department-' + edges[edge]);
      bracket.dataset.group = group % groups.length;
      const areas = [
        [2, 4 + start, 3, 4 + end],
        [4 + start, 12, 4 + end, 13],
        [12, 11 - end, 13, 11 - start],
        [11 - end, 2, 11 - start, 3]
      ];
      bracket.style.gridArea = areas[edge].join(' / ');
      const button = element('button', definitions[group][0], 'department-button');
      button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog');
      button.addEventListener('click', () => openDepartment(group));
      bracket.append(button);
      board.append(bracket);
      start = end;
    }
  }
}

const planetNames = ['တနင်္ဂနွေ', 'စန်း', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ', 'ရာဟု', 'ကိတ်'];

function vedhaPanel(data, placements, svg) {
  const panel = element('details', '', 'source-details vedha-panel');
  panel.append(element('summary', 'မူလ / ကောဇာ ဂြိုဟ်အထွင်း'));
  const fields = element('div', '', 'vedha-fields');
  const kindLabel = element('label', 'ဂြိုဟ်အမျိုးအစား');
  const kind = element('select', '');
  addOptions(kind, [['မူလ'], ['ကောဇာ']]);
  const timeLabel = element('label', '');
  const timeCaption = element('span', '');
  const time = element('input', '');
  time.type = 'datetime-local';
  time.step = '1';
  time.min = date.min;
  time.max = date.max;
  const planetLabel = element('label', 'ထွင်းမည့်ဂြိုဟ်');
  const planet = element('select', '');
  kindLabel.append(kind);
  timeLabel.append(timeCaption, time);
  planetLabel.append(planet);
  fields.append(kindLabel, timeLabel, planetLabel);
  const output = element('div', '', 'vedha-output');
  output.setAttribute('aria-live', 'polite');
  panel.append(fields, output);

  const dates = [
    data.birthTime ?? (!data.bhumi && data.mode === 0 && data.instant ? myanmarDateTime(new Date(data.instant)) : ''),
    data.transitTime ?? (data.bhumi ? data.requested : myanmarDateTime())
  ];
  const selectedPlanets = [0, 0];
  const layer = document.createElementNS(svg.namespaceURI, 'g');
  layer.classList.add('vedha-lines');
  svg.append(layer);

  function update() {
    layer.replaceChildren();
    planet.replaceChildren();
    output.replaceChildren();
    planet.disabled = true;
    if (!panel.open) return;
    if (!time.value || !time.validity.valid) {
      output.textContent = 'သက်ဆိုင်ရာ ရက်စွဲနှင့် အချိန် ထည့်ပါ။';
      return;
    }
    let positions;
    try {
      positions = planetaryStars(myanmarInstant(time.value));
    } catch {
      output.textContent = 'ရက်စွဲနှင့် အချိန်ကို ပြန်စစ်ပါ။';
      return;
    }
    planetNames.forEach((name, index) => planet.add(new Option(name + ' · ' + stars[positions[index]][0], index)));
    planet.disabled = false;
    planet.value = selectedPlanets[kind.value];
    const source = placements.findIndex(({ star }) => star === positions[Number(planet.value)]);
    const [x, y] = tips[source];
    const list = element('ul', '');
    vedhaTargets(source).forEach((target, index) => {
      const [tx, ty] = tips[target];
      const ray = document.createElementNS(svg.namespaceURI, 'path');
      ray.setAttribute('d', `M${x} ${y}L${tx} ${ty}`);
      ray.setAttribute('stroke', vedhaColors[index]);
      layer.append(ray);
      const row = element('li', vedhaNames[index] + ' · ' + stars[placements[target].star][0]);
      row.style.borderColor = vedhaColors[index];
      list.append(row);
    });
    output.append(list);
  }

  function changeKind() {
    const caption = kind.value === '0' ? 'မွေးရက်နှင့် မွေးချိန်' : 'ကောဇာ ရက်စွဲနှင့် အချိန်';
    timeCaption.textContent = caption + ' (မြန်မာစံတော်ချိန်)';
    time.value = dates[kind.value];
    update();
  }
  kind.value = dates[0] ? '0' : '1';
  kind.addEventListener('change', changeKind);
  time.addEventListener('change', () => {
    dates[kind.value] = time.value;
    update();
  });
  planet.addEventListener('change', () => {
    selectedPlanets[kind.value] = Number(planet.value);
    update();
    planet.focus();
  });
  panel.addEventListener('toggle', update);
  changeKind();
  return panel;
}

function starGridPosition(slot) {
  const edge = Math.floor(slot / 7);
  const index = slot % 7;
  return [[2, 4 + index], [4 + index, 12], [12, 10 - index], [10 - index, 2]][edge].join(' / ');
}

function bhumiView(data) {
  const card = element('article', '', 'card');
  const windows = bhumiWindows(data.requested);
  const [moon, sun] = windows.map(({ current }) => directionOf(current.star, data.anchor));
  card.append(element('h2', bhumiName),
    element('p', 'လပြည့်နက္ခတ် — ' + stars[data.anchor][0]),
    element('p', 'တွက်ချက်ချိန် — ' + data.requested.replace('T', ' ') + ' (မြန်မာစံတော်ချိန်)'));
  if (!data.manual) card.append(element('p', 'လပြည့်ချိန် — ' + myanmarDateTime(new Date(data.instant)).replace('T', ' ')));
  const timings = element('div', '', 'bhumi-grid bhumi-timings');
  const formatTime = value => myanmarDateTime(new Date(Math.ceil(value / 1000) * 1000)).replace('T', ' ');
  windows.forEach(({ current, next }, index) => {
    const title = index === 0 ? 'စန်း' : 'တနင်္ဂနွေ';
    const position = window => stars[window.star][0] + ' · ' + bhumiDirections[directionOf(window.star, data.anchor)];
    const tile = element('section', '', 'group');
    tile.append(
      element('h3', title + ' — ' + position(current)),
      element('p', 'စီးချိန်အစ — ' + formatTime(current.start)),
      element('p', 'စီးချိန်အဆုံး — ' + formatTime(current.end)),
      element('p', 'နောက်စီးမည့်နက္ခတ် — ' + position(next)),
      element('p', 'နောက်စီးချိန်အဆုံး — ' + formatTime(next.end)),
      element('p', 'နက္ခတ်အစစ်ပြောင်း၍ ပြန်တွက်ချိန် — ' + formatTime(current.nextIngress))
    );
    timings.append(tile);
  });
  card.append(timings);
  if ((sun + 4) % 8 === moon) {
    card.append(element('p', 'စန်းကို လက်ဝဲ၊ တနင်္ဂနွေကို လက်ယာထားလျှင် မျက်နှာမူရာ — ' + bhumiDirections[(moon + 6) % 8]),
      element('p', 'စန်းကို မျက်နှာမူ၍ တနင်္ဂနွေကို ကျောဘက်ထားလျှင် — ' + bhumiDirections[moon]));
  }
  if ((sun + 4) % 8 !== moon) {
    card.append(element('p', 'စန်းနှင့် တနင်္ဂနွေ ဆန့်ကျင်ဘက်အရပ်တွင် ရှိချိန်၌ မျက်နှာမူရာကို ပြပါသည်။', 'hint'));
  }
  card.append(element('h3', 'အရပ် ၈ မျက်နှာနှင့် နက္ခတ်များ'));
  const grid = element('div', '', 'bhumi-grid');
  bhumiDirections.forEach((direction, index) => {
    const tile = element('section', '', 'group');
    tile.append(element('h3', direction), element('p', stars.filter((_, star) =>
      directionOf(star, data.anchor) === index).map(([name]) => name).join('၊ ')));
    grid.append(tile);
  });
  const note = element('details', '', 'source-details');
  note.append(element('summary', 'စက်ချနည်း · အခန်း (၂၃)'), element('p',
    'ကောဇာ လပြည့်နက္ခတ်ကနေ စပြီး စက်ချနည်းကိုပဲ သုံးလို့ရပါမယ်။ စက်တစ်လုံးဟာ တစ်လအတွက်ပါ။ လပြည့်နက္ခတ် ပြောင်းတိုင်း စက်ပြောင်းပါမယ်။ စန်းသည် နက္ခတ်တစ်လုံးလျှင် ၆ နာရီ ၄၈ မိနစ်၊ တနင်္ဂနွေသည် ၃ ရက် ၈ နာရီ ၄၈ မိနစ် စီးသည်။', 'chapter-note'));
  note.append(element('p',
    'စန်း သို့မဟုတ် တနင်္ဂနွေက နက္ခတ်အစစ် ပြောင်းသွားလျှင် လက်ရှိစီးချိန်ကို အဲဒီပြောင်းချိန်မှာ ရပ်ပြီး နက္ခတ်အသစ်ကနေ ပြန်တွက်ပါသည်။ ပြထားတဲ့ အချိန်အားလုံး မြန်မာစံတော်ချိန် ဖြစ်ပါသည်။', 'chapter-note'));
  const placements = rotateStars(data.anchor, 2);
  const board = element('div', '', 'board bhumi-vedha-board');
  const svg = lattice();
  board.append(svg);
  placements.forEach(({ star }, slot) => {
    const label = element('span', stars[star][0], 'star');
    label.classList.add(['top-label', 'right-label', 'bottom-label', 'left-label'][Math.floor(slot / 7)]);
    label.style.gridArea = starGridPosition(slot);
    board.append(label);
  });
  const overlay = vedhaPanel(data, placements, svg);
  overlay.append(board);
  card.append(grid, overlay, note);
  return card;
}

function chartView(data) {
  const card = find('chart-template').content.firstElementChild.cloneNode(true);
  const part = name => card.querySelector(`[data-part="${name}"]`);
  const groupDefinitions = data.fourteen ? fourteenGroups : groups;
  const startLabel = 'ဘယ်ဘက်အပေါ် ပထမနေရာ';
  const placements = rotateStars(data.anchor).map((placement, slot) =>
    data.fourteen ? { ...placement, group: fourteenSlots[slot] } : placement
  );
  part('title').textContent = data.fourteen ? fourteenName : modes[data.mode][0];
  if (data.fourteen) part('summary').append(element('p', modes[data.mode][0]));
  const when = data.instant && myanmarDateTime(new Date(data.instant)).replace('T', ' ');
  part('summary').append(element('p', 'အခြေခံနက္ခတ် — ' + stars[data.anchor][0] + ' · ' + startLabel));
  if (when) part('summary').append(element('p', `${when} (မြန်မာစံတော်ချိန်)`));
  const board = part('board');
  const svg = lattice();
  board.append(svg);
  board.after(vedhaPanel(data, placements, svg));
  drawDepartments(board, placements, groupDefinitions, openDepartment);
  const startMarker = document.createElementNS(svg.namespaceURI, 'circle');
  const [startX, startY] = tips[anchorSlot];
  startMarker.setAttribute('cx', startX);
  startMarker.setAttribute('cy', startY);
  startMarker.setAttribute('r', '.13');
  startMarker.classList.add('start-position');
  svg.append(startMarker);
  for (const [side, name] of [
    ['east', 'အရှေ့အရပ်'], ['south', 'တောင်အရပ်'],
    ['west', 'အနောက်အရပ်'], ['north', 'မြောက်အရပ်']
  ]) {
    board.append(element('span', name, 'direction ' + side));
  }
  const buttons = placements.map(({ star, group }, slot) => {
    const edge = Math.floor(slot / 7);
    const isAnchor = slot === anchorSlot;
    const button = element('button', stars[star][0], 'star');
    button.classList.add(['top-label', 'right-label', 'bottom-label', 'left-label'][edge]);
    button.dataset.group = group;
    button.classList.toggle('anchor', isAnchor);
    button.style.gridArea = starGridPosition(slot);
    button.type = 'button';
    button.title = isAnchor ? startLabel + ' · အခြေခံနက္ခတ်' : groupDefinitions[group][0];
    button.setAttribute('aria-label', [stars[star][0], groupDefinitions[group][0], isAnchor ? startLabel + 'ရှိ အခြေခံနက္ခတ်' : ''].filter(Boolean).join('၊ '));
    button.addEventListener('click', () => {
      showReading(star);
      rememberCharts();
    });
    board.append(button);
    return button;
  });

  function readingParagraphs(group) {
    return data.fourteen
      ? fourteenReadings[group].split('\n\n').map(text => element('p', text))
      : groupSource(group);
  }

  function openDepartment(group) {
    const [name, meaning] = groupDefinitions[group];
    const members = placements.filter(slot => slot.group === group).map(slot => stars[slot.star][0]);
    find('department-title').textContent = name;
    find('department-stars').textContent = members.join('၊ ');
    find('department-meaning').textContent = meaning;
    const excerpt = find('department-excerpt');
    excerpt.replaceChildren(...readingParagraphs(group));
    if (data.fourteen && group >= 12) excerpt.append(element('p', fourteenNote));
    find('department-dialog').showModal();
    excerpt.parentElement.scrollTop = 0;
  }

  let displayedGroup;

  function showReading(star) {
    data.selected = star;
    const group = placements.find(entry => entry.star === star).group;
    const [name, meaning] = groupDefinitions[group];
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', placements[index].star === star));
    part('reading').dataset.group = group;
    part('reading').replaceChildren(
      element('h3', stars[star][0] + 'နက္ခတ် · ' + name),
      element('p', meaning)
    );
    if (displayedGroup !== group) {
      part('excerpt').replaceChildren(...readingParagraphs(group));
      displayedGroup = group;
    }
  }

  if (data.fourteen) {
    const note = element('details', '', 'source-details');
    note.append(element('summary', 'ဟနုကနှင့် ဒွံသနအတွက် ကျမ်းမှတ်ချက်'), element('p', fourteenNote, 'chapter-note'));
    card.append(note);
  }
  showReading(data.selected);
  return card;
}

function render() {
  charts.replaceChildren(current.bhumi ? bhumiView(current) : chartView(current));
  find('view-result').hidden = false;
}

function validChart(data) {
  return data && (!data.bhumi || (
    typeof data.requested === 'string' && Number.isInteger(data.moon) && stars[data.moon] &&
    Number.isInteger(data.sun) && stars[data.sun]
  )) && Number.isInteger(data.mode) && modes[data.mode] &&
    Number.isInteger(data.anchor) && stars[data.anchor] &&
    Number.isInteger(data.selected) && stars[data.selected] &&
    (data.instant === null || (typeof data.instant === 'string' && Number.isFinite(Date.parse(data.instant))));
}

function readCharts(getValue) {
  try {
    const saved = JSON.parse(getValue());
    return Array.isArray(saved) && validChart(saved[0]) ? saved[0] : null;
  } catch {
    return null;
  }
}

function readSaved() {
  return readCharts(() => localStorage.getItem(storageKey));
}

function rememberCharts() {
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify([current]));
  } catch {
    // Keep the active chart in memory if tab storage is unavailable.
  }
}

function showPage(focus = false) {
  const hash = location.hash;
  const fourteen = hash === fourteenForm || hash === fourteenResult;
  const bhumi = hash === bhumiForm || hash === bhumiResult;
  const result = hash === resultHash || hash === fourteenResult || hash === bhumiResult;
  const hasResult = Boolean(current) && Boolean(current.fourteen) === fourteen && Boolean(current.bhumi) === bhumi;
  let page;
  if (result && hasResult) {
    page = 'results';
  } else if (result || hash === '#calculator' || hash === fourteenForm || hash === bhumiForm) {
    page = 'calculator';
    if (result) history.replaceState(null, '', bhumi ? bhumiForm : fourteen ? fourteenForm : '#calculator');
  } else {
    location.replace('../index.html#home');
    return;
  }
  const name = bhumi ? bhumiName : fourteen ? fourteenName : standardName;
  document.title = `${name} · Nakshatra (နက္ခတ်)`;
  find('calculator-title').textContent = name;
  find('view-result').hidden = !hasResult;
  savedActions.hidden = bhumi || fourteen || !readSaved();
  if (page === 'calculator') updateFields();
  for (const view of ['calculator', 'results']) find(view).hidden = view !== page;
  if (focus) {
    find(page + '-title').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

function navigate(hash) {
  if (location.hash !== hash) history.pushState(null, '', hash);
  showPage(true);
}

function formMessage(message) {
  calculatorStatus.textContent = message;
  calculatorStatus.hidden = !message;
}

window.addEventListener('popstate', () => showPage(true));
find('edit').addEventListener('click', () => navigate(current?.bhumi ? bhumiForm : current?.fourteen ? fourteenForm : '#calculator'));
find('view-result').addEventListener('click', () => navigate(current?.bhumi ? bhumiResult : current?.fourteen ? fourteenResult : resultHash));

find('chart-form').addEventListener('submit', event => {
  event.preventDefault();
  const bhumi = location.hash === bhumiForm;
  const index = bhumi ? 2 : Number(mode.value);
  const manual = method.value === 'manual';
  try {
    if (bhumi) {
      const reading = calculateBhumi(date.value, manual ? Number(anchor.value) : undefined);
      current = { ...reading, bhumi: true, manual, requested: date.value, mode: 2, selected: reading.moon };
    } else {
      const computed = manual ? { anchor: Number(anchor.value), instant: null } :
        calculateAnchor(index, index === 4 ? year.value : date.value);
      current = { fourteen: location.hash === fourteenForm, mode: index, anchor: computed.anchor, instant: computed.instant,
        selected: computed.anchor,
        birthTime: !manual && index < 2 ? date.value : undefined,
        transitTime: !manual && index >= 2 && index !== 4 ? date.value : undefined };
    }
    error.hidden = true;
    status.textContent = '';
    formMessage('');
    render();
    rememberCharts();
    navigate(current.bhumi ? bhumiResult : current.fourteen ? fourteenResult : resultHash);
  } catch (failure) {
    error.textContent = failure instanceof RangeError ? failure.message : 'နက္ခတ်တွက်ချက်မှု မအောင်မြင်ပါ။';
    error.hidden = false;
  }
});

mode.addEventListener('change', updateFields);
method.addEventListener('change', updateFields);
restore.addEventListener('click', () => {
  const saved = readSaved();
  if (!saved) return;
  current = saved;
  render();
  rememberCharts();
  formMessage('');
  status.textContent = 'သိမ်းထားသော စက်ရလဒ်ကို ဖွင့်ထားပါသည်။';
  navigate(resultHash);
});
find('clear-saved').addEventListener('click', () => {
  try {
    localStorage.removeItem(storageKey);
    savedActions.hidden = true;
    formMessage('သိမ်းထားသော စက်ရလဒ်ကို ဖယ်ပြီးပါပြီ။');
  } catch {
    formMessage('သိမ်းထားသော စက်ရလဒ်ကို မဖယ်နိုင်ပါ။');
  }
});
savedActions.hidden = !readSaved();
updateFields();
const active = readCharts(() => sessionStorage.getItem(sessionKey));
if (active) {
  current = active;
  render();
}
showPage();
