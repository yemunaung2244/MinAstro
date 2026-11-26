import { openChartStarInformation, connectStarInformation } from '../star-information.js';
import { dasaExcerpts } from './dasa-excerpts.mjs';
import { nodeRemedies } from './node-remedies.mjs';
import { shadExcerpts } from './shad-excerpts.mjs';
import { dwiExcerpts } from './dwi-excerpts.mjs';
import { dwiVedha, dwiTips, vedhaNames, vedhaColors } from './vedha.mjs';
import { timedSource } from './takkalika-text.mjs';
import { sequences, takkalikaAt, takkalikaPlacements } from './takkalika.mjs';
import { cities } from './cities.mjs';
import { birthStarRoles, birthStarPositions, stars, modes, sections, mod, placement, directions, side } from './calculations.mjs';

import { planetaryStars, yangonDateTime, yangonInstant } from './ephemeris.mjs';

const find = id => document.getElementById(id);
const form = find('chart-form');
const labelOf = section => sections[section][0];
const autoFields = [
  ['rahu', 'ရာဟု'], ['sun', 'တနင်္ဂနွေ'], ['moon', 'တနင်္လာ'],
  ['mars', 'အင်္ဂါ'], ['mercury', 'ဗုဒ္ဓဟူး'], ['jupiter', 'ကြာသပတေး'],
  ['venus', 'သောကြာ'], ['saturn', 'စနေ'], ['lagna', 'လဂ်']
];
const extras = [['karma', 'ကမ္မနက္ခတ်'], ['adhana', 'အဓာနနက္ခတ်']];
const modeTitles = {
  dwi: modes.dwi[0], shad: modes.shad[0], dasa: modes.dasa[0],
  bhumi: 'ဘူမိစက်', 'rahu-wheel': 'ရာဟုဝံစရစက်', 'ketu-wheel': 'ကိတ်စက်', all: 'စက်အားလုံး'
};
let mode = 'dwi';
let positions = {};
const expandedCharts = new Map([['dwi', true]]);

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
}

const selected = id => positions[id] ?? (find(id)?.value ? Number(find(id).value) : null);
const context = () => find('context').value;
const isTimed = () => find('context').selectedIndex === 2;
const timedChart = () => {
  const option = find('timed-method').value;
  return isTimed() && Object.hasOwn(modes, option) ? option : null;
};
const timedPeriod = () => timedChart() ? find('timed-period') : find('timed-method');

function setContext() {
  const timed = isTimed();
  find('chart-time-label').hidden = timed;
  find('chart-time').disabled = timed;
  find('timing').hidden = !timed;
  const standalone = timed && !timedChart();
  find('timed-period-label').hidden = !timedChart();
  find('timed-period').disabled = !timedChart();
  for (const field of form.querySelectorAll('.birth-input')) {
    field.hidden = standalone;
    for (const input of field.querySelectorAll('input, select')) input.disabled = standalone;
  }
  find('city-caption').textContent = timed ? 'တွက်ချက်ရာမြို့' : 'မွေးဖွားရာမြို့';
  find('city-search-caption').textContent = timed ? 'တွက်ချက်ရာမြို့ ရှာရန်' : 'မွေးဖွားရာမြို့ ရှာရန်';

  for (const id of ['start', 'end', 'event-time']) {
    find(id).disabled = !timed;
    find(id).required = timed && id === 'event-time';
  }
}

function card(parent, title, value, note) {
  const item = element('article', '', 'card');
  item.append(element('h3', title), element('p', value, 'value'));
  if (note) item.append(element('p', note, 'hint'));
  parent.append(item);
}

function makeTable(headers, rows) {
  const table = element('table');
  const header = table.createTHead().insertRow();
  for (const name of headers) {
    const th = element('th', name);
    th.scope = 'col';
    header.append(th);
  }
  const body = table.createTBody();
  for (const [values, active] of rows) {
    const tr = body.insertRow();
    if (active) tr.className = 'selected-row';
    values.forEach(value => tr.insertCell().textContent = value);
  }
  return table;
}

function appendCatalog(parent, rahu, ketu, chart) {
  const section = element('details', '', 'catalog');
  section.open = false;
  section.append(element('summary', 'နက္ခတ် ၂၈ လုံး စက်ဇယား'));
  const selectedStars = new Set([...autoFields, ...extras].map(([id]) => selected(id)));
  const rows = stars.map((_, distance) => {
    const star = mod(rahu + distance);
    const group = placement(rahu, star)[chart];
    return [[stars[star], labelOf(group), ...(chart === 'shad' ? [directions[star]] : [])], star === ketu || selectedStars.has(star)];
  });
  section.append(makeTable(['နက္ခတ်', modes[chart][0], ...(chart === 'shad' ? ['ဘူမိအရပ်'] : [])], rows));
  parent.append(section);
}

function appendSides(parent, rahu, ketu, axes = ['rahu-wheel', 'ketu-wheel']) {
  const detail = element('details', '', 'catalog');
  detail.open = axes.length === 1;
  const titles = axes.map(axis => modeTitles[axis]);
  detail.append(element('summary', titles.join(' နှင့် ')));
  const rows = stars.map((name, star) => [
    [name, ...axes.map(axis => side(axis === 'rahu-wheel' ? rahu : ketu, star))], false
  ]);
  detail.append(makeTable(['နက္ခတ်', ...titles], rows));
  parent.append(detail);
}

function appendBhumi(parent, rahu, moon) {
  const moonSection = placement(rahu, moon).shad;
  const bhumi = {
    mu: 'တနင်္လာကို မျက်နှာမမူဘဲ ကျောဘက်ထားပါ။',
    guru: 'တနင်္လာကို မျက်နှာမူပါ။',
    head: 'တနင်္လာကို ဘယ်ဘက်ထားပါ သို့မဟုတ် မျက်နှာမူပါ။',
    tail: 'တနင်္လာကို ဘယ်ဘက်ထားပါ သို့မဟုတ် မျက်နှာမူပါ။',
    chest: 'တနင်္လာကို ညာဘက် သို့မဟုတ် ကျောဘက်ထားပါ။',
    belly: 'တနင်္လာကို ညာဘက် သို့မဟုတ် ကျောဘက်ထားပါ။'
  };
  card(parent, 'ဘူမိစက်', bhumi[moonSection], `တနင်္လာ ရှိရာအရပ် · ${directions[moon]}`);
}

function calculate() {
  const dateTime = find(isTimed() ? 'event-time' : 'chart-time');
  const error = find('error');
  error.hidden = true;
  positions = {};
  if (!dateTime.value || !dateTime.validity.valid) return;

  const city = cities[Number(find('city').value)];
  const coordinates = find('city').value !== '' && city
    ? { latitude: city[2], longitude: city[3] }
    : null;
  try {
    if (isTimed()) {
      const interval = updateTimeInterval();
      if (!interval) throw new Error('Missing interval');
      positions = interval.planets;
      if (timedChart()) {
        const birth = planetaryStars(yangonInstant(find('chart-time').value));
        Object.assign(positions, birthStarPositions(birth.birthMoon));
      }
      return;
    }
    positions = planetaryStars(yangonInstant(dateTime.value), coordinates);
    const birthMoon = positions.birthMoon;
    Object.assign(positions, birthStarPositions(birthMoon));
  } catch {
    positions = {};
    error.textContent = 'နက္ခတ်တွက်၍ မရပါ။ ရက်စွဲနှင့် အချိန်ကို ပြန်စစ်ပါ။';
    error.hidden = false;
  }
}

function createWheel() {
  const diagram = element('figure', '', 'wheel');
  const sheet = element('div', '', 'wheel-sheet');
  const canvas = element('canvas');
  canvas.width = canvas.height = 1200;
  canvas.setAttribute('aria-hidden', 'true');
  sheet.append(canvas);
  const pen = canvas.getContext('2d');
  pen.scale(2, 2);
  pen.strokeStyle = '#234e66';
  function line(x, y, endX, endY) {
    pen.beginPath();
    pen.moveTo(x, y);
    pen.lineTo(endX, endY);
    pen.stroke();
  }
  pen.strokeStyle = '#263d48';
  pen.lineWidth = 1.2;
  pen.strokeRect(8,8,584,584);
  pen.strokeRect(24,24,552,552);
  return { diagram, sheet, canvas, pen, line };
}

function drawWheelGrid(pen, line) {
  const step = 36;
  // Seven-by-seven diamond lattice with seven outward tips on every side.
  for (let row=0;row<7;row++) {
    const y=192+row*step;
    line(156,y,444,y);
    line(y,156,y,444);
    for (let col=0;col<7;col++) {
      const x=192+col*step;
      pen.beginPath();
      pen.moveTo(x,y-step);
      pen.lineTo(x+step,y);
      pen.lineTo(x,y+step);
      pen.lineTo(x-step,y);
      pen.closePath();
      pen.stroke();
    }
  }
}

function wheelPoints() {
  // Clockwise from the mouth at the top centre, matching pp. 36, 59 and 95.
  const perimeter = [];
  for (let n=0;n<7;n++) perimeter.push([192+36*n,144]);
  for (let n=0;n<7;n++) perimeter.push([456,192+36*n]);
  for (let n=0;n<7;n++) perimeter.push([408-36*n,456]);
  for (let n=0;n<7;n++) perimeter.push([144,408-36*n]);
  return [...perimeter.slice(3), ...perimeter.slice(0,3)];
}

function strokeVedha(context, source, target, direction) {
  context.strokeStyle = vedhaColors[direction];
  context.lineWidth = 3.5;
  context.beginPath();
  context.moveTo(...source);
  context.lineTo(...target);
  context.stroke();
}

function renderTakkalika(body) {
  const method = find('timed-method').value;
  const anchor = method === 'dina' ? 'moon' : 'sun';
  const order = [anchor, ...sequences[method].map(([id]) => id)];
  const names = new Map([...autoFields, ['ketu', 'ကိတ်']]);
  const number = value => value.toLocaleString('my-MM');
  card(body, 'အခါပိုင်း', find('interval-note').textContent);
  const interval = element('div', '', 'two');
  card(interval, 'အစ', find('start').value);
  card(interval, 'အဆုံး', find('end').value);
  body.append(interval);

  const { diagram, sheet, pen, line } = createWheel();
  drawWheelGrid(pen, line);
  const caption = element('figcaption', 'ဂြိုဟ် သို့မဟုတ် ဂြိုဟ်စီးနက္ခတ်ကို နှိပ်၍ အထွင်းမျဉ်း ကြည့်ပါ။');
  caption.setAttribute('aria-live', 'polite');
  const abhijit = stars.indexOf('အဘိဇိ');
  const chartButtons = new Map();
  const planetOrder = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
  const points = wheelPoints();
  const overlay = element('canvas', '', 'vedha-overlay');
  overlay.width = overlay.height = 600;
  overlay.setAttribute('aria-hidden', 'true');
  sheet.append(overlay);
  const ink = overlay.getContext('2d');
  const readout = element('div', '', 'vedha-readout');
  readout.setAttribute('aria-live', 'polite');
  const planetsAt = star => planetOrder.filter(id => positions[id] === star);
  let selectedStar;

  function showVedha(star) {
    ink.clearRect(0, 0, 600, 600);
    readout.replaceChildren();
    if (star === undefined) return;
    const source = dwiTips[mod(star - positions.rahu)];
    const list = element('ul');
    dwiVedha(positions.rahu, star).forEach((target, direction) => {
      strokeVedha(ink, source, dwiTips[mod(target - positions.rahu)], direction);
      const label = target === abhijit ? 'စက်ကွက်လွတ်' : stars[target];
      const targets = planetsAt(target).map(id => names.get(id));
      const row = element('li', [vedhaNames[direction], label, ...targets].join(' · '));
      row.style.setProperty('--vedha-color', vedhaColors[direction]);
      list.append(row);
    });
    readout.append(element('strong', [stars[star], ...planetsAt(star).map(id => names.get(id))].join(' · ')), list);
  }

  function previewVedha(button, star) {
    button.addEventListener('pointerenter', () => showVedha(star));
    button.addEventListener('pointerleave', () => showVedha(selectedStar));
    button.addEventListener('focus', () => showVedha(star));
    button.addEventListener('blur', () => showVedha(selectedStar));
  }

  points.forEach(([x, y], index) => {
    const star = mod(positions.rahu + index);
    if (star === abhijit) return;
    const occupants = planetsAt(star);
    const button = element('button', number(star < abhijit ? star + 1 : star));
    button.type = 'button';
    button.style.left = x / 6 + '%';
    button.style.top = y / 6 + '%';
    const description = [stars[star], ...occupants.map(id => names.get(id))].join(' · ');
    button.setAttribute('aria-label', description);
    button.title = description;
    if (occupants.length) {
      button.classList.add('occupied');
      const edge = Math.floor(((index + 3) % 28) / 7);
      const dx = [0, 1, 0, -1][edge];
      const dy = [-1, 0, 1, 0][edge];
      pen.save();
      pen.translate(x + dx * 26, y + dy * 26);
      if (dy) pen.rotate(-Math.PI / 2);
      pen.fillStyle = '#15547b';
      pen.font = 'bold 17px sans-serif';
      pen.textAlign = 'center';
      pen.textBaseline = 'middle';
      pen.fillText(occupants.map(id => number(planetOrder.indexOf(id) + 1)).join('·'), 0, 0, 36);
      pen.restore();
    }
    if (star === positions.rahu || star === positions.ketu) button.classList.add('axis');
    button.setAttribute('aria-haspopup', 'dialog');
    button.onclick = event => {
      sheet.querySelector('.active')?.classList.remove('active');
      button.classList.add('active');
      caption.textContent = description;
      selectedStar = occupants.length ? star : undefined;
      showVedha(selectedStar);
      if (event.isTrusted) openChartStarInformation(star);
    };
    if (occupants.length) previewVedha(button, star);
    chartButtons.set(star, button);
    sheet.append(button);
  });
  const legend = element('div', '', 'wheel-planets');
  for (const id of planetOrder) {
    const chip = element('button', number(planetOrder.indexOf(id) + 1) + ' · ' + names.get(id));
    chip.type = 'button';
    chip.onclick = () => chartButtons.get(positions[id]).click();
    previewVedha(chip, positions[id]);
    legend.append(chip);
  }
  diagram.append(sheet, caption, legend, readout);
  body.append(diagram);

  const placements = element('section', '', 'card');
  placements.append(element('h3', 'တက္ကာလိက ဂြိုဟ်ချဇယား'));
  placements.append(makeTable(['ဂြိုဟ်', 'စီးနက္ခတ်'], order.map(id => [
    [names.get(id), stars[positions[id]]], id === anchor
  ])));
  body.append(placements);

  const source = element('details', '', 'card catalog');
  source.append(element('summary', 'တက္ကာလိက မူရင်းနည်း'),
    ...timedSource[method].map(text => element('p', text)));
  source.append(makeTable(['စီးနက္ခတ်မှ', 'လုံးမြောက်', 'ဂြိုဟ်'], sequences[method].map(([id, count], index) => [
    [names.get(order[index]), number(count), names.get(id)], false
  ])));
  body.append(source);

  const lookup = element('details', '', 'card catalog');
  lookup.append(element('summary', 'နက္ခတ် ၂၇ လုံး ဂြိုဟ်မြင်ဇယား'));
  const scroll = element('div', '', 'star-change-list');
  scroll.tabIndex = 0;
  scroll.setAttribute('aria-label', 'နက္ခတ် ၂၇ လုံး ဂြိုဟ်မြင်ဇယား');
  const rows = stars.flatMap((name, star) => {
    if (name === 'အဘိဇိ') return [];
    const planets = takkalikaPlacements(method, star);
    return [[order.map(id => stars[planets[id]]), star === positions[anchor]]];
  });
  scroll.append(makeTable(order.map(id => names.get(id)), rows));
  lookup.append(scroll);
  body.append(lookup);
}

function render() {
  find('result-type').textContent = context();
  const body = find('result-body');
  for (const group of body.querySelectorAll('.chart-group')) {
    expandedCharts.set(group.dataset.chart, group.open);
  }
  body.replaceChildren();
  const rahu = selected('rahu');
  if (rahu === null) {
    find('result-heading').textContent = 'ရက်စွဲနှင့် အချိန် ထည့်ပါ';
    return;
  }
  if (isTimed() && !timedChart()) {
    find('result-heading').textContent = titles.takka;
    renderTakkalika(body);
    return;
  }
  const guru = mod(rahu + 14);
  const ketu = isTimed() ? positions.ketu : guru;
  find('result-heading').textContent = titles[mode];
  if (isTimed()) {
    card(body, 'တက္ကာလိက အခါပိုင်း', find('interval-note').textContent);
    const interval = element('div', '', 'two');
    card(interval, 'အစ', find('start').value);
    card(interval, 'အဆုံး', find('end').value);
    body.append(interval);
  }
  const nodes = element('div', '', 'two');
  card(nodes, 'ရာဟု · မုခ', stars[rahu], mode === 'shad' ? directions[rahu] : undefined);
  card(nodes, 'ဂူဍ · စက်ဗဟို', stars[guru], mode === 'shad' ? directions[guru] : undefined);
  if (mode === 'shad') {
    const labels = [['rahu', 'ရာဟု ယတြာများ'], ['ketu', 'ကိတ် ယတြာများ']];
    labels.forEach(([id, title], index) => {
      const detail = element('details', '', 'node-remedies');
      detail.append(
        element('summary', title),
        ...nodeRemedies[id].map(text => element('p', text))
      );
      nodes.children[index].append(detail);
    });
  }
  const { diagram, sheet, canvas, pen, line } = createWheel();
  const dwiColors = { mata: '#b54b38', jiva: '#167561', mu: '#804ca1', guru: '#2765a5' };
  const showVedha = mode in modes;
  const colorSections = mode === 'shad' || mode === 'dasa';
  const sectionColors = {
    mu: ['#eadcf9', '#643094'], guru: ['#dce8fa', '#234f98'],
    chest: ['#d9efe2', '#196745'], belly: ['#fff1cc', '#84550b'],
    head: ['#f9dedb', '#963d36'], tail: ['#dbefee', '#136365'],
    flower: ['#fbe2ef', '#932659'], fruit: ['#d9efe2', '#196745'],
    barren: ['#fff1cc', '#84550b'], decline: ['#ffe3cf', '#983f16'],
    rajas: ['#f9dedb', '#963d36'], tamas: ['#e5e9ed', '#465565'],
    vuddha: ['#dbefee', '#136365'], death: ['#ece1d8', '#714730']
  };
  const dwiRegions = [
    ['mata',192,192,90,216,'#fcece5'],
    ['mu',282,192,36,108,'#f1e6fa'],
    ['guru',282,300,36,108,'#e5effb'],
    ['jiva',318,192,90,216,'#e0f3eb']
  ];
  if (mode === 'dwi') {
    for (const [,x,y,width,height,color] of dwiRegions) {
      pen.fillStyle = color;
      pen.fillRect(x,y,width,height);
    }
  }
  drawWheelGrid(pen, line);
  const lattice = showVedha ? element('canvas') : null;
  if (lattice) {
    lattice.width = lattice.height = 600;
    lattice.getContext('2d').drawImage(canvas, 0, 0, 600, 600);
  }
  const caption = element('figcaption', 'နက္ခတ်နေရာကို နှိပ်၍ စက်အပိုင်း ကြည့်ပါ။');
  caption.setAttribute('aria-live', 'polite');
  const points = wheelPoints();
  // Bracket spans come directly from placement(), as do the readings and table.
  const chart = mode in modes ? mode : 'dwi';
  const dwiLabelAreas = [];
  const bracketLevels = [[0,'dwi'],[1,'shad'],[2,'dasa']];
  for (const [level,key] of bracketLevels) {
    if (mode === 'dwi' && key !== 'dwi') continue;
    if (mode === 'shad' && key !== 'shad') continue;
    if (mode === 'dasa' && key !== 'dasa') continue;
    const depth = [43,68,94][level];
    for (let sideIndex=0;sideIndex<4;sideIndex++) {
      pen.save();
      pen.translate(300,300);
      pen.rotate(sideIndex*Math.PI/2);
      pen.translate(-300,-300);
      const runs=[];
      for (let n=0;n<7;n++) {
        const distance=mod(sideIndex*7+n-3);
        const section=placement(rahu,mod(rahu+distance))[key];
        const last=runs.at(-1);
        if(last?.section===section) last.end=n;
        else runs.push({section,start:n,end:n});
      }
      for(const run of runs) {
        const left=192+36*run.start-16;
        const right=192+36*run.end+16;
        if (colorSections) {
          const [fill, stroke] = sectionColors[run.section];
          pen.fillStyle = fill;
          pen.fillRect(left, depth, right-left, 133-depth);
          pen.strokeStyle = stroke;
        }
        line(left,133,left,depth);
        line(left,depth,right,depth);
        line(right,depth,right,133);
        pen.fillStyle = colorSections ? sectionColors[run.section][1]
          : mode === 'dwi' ? dwiColors[run.section] : key===chart ? '#124f72' : '#465b66';
        pen.font = (key===chart ? 'bold ' : '')+'11px "Myanmar Sangam MN",sans-serif';
        pen.textAlign='center';
        pen.textBaseline='bottom';
        const title = labelOf(run.section);
        const center = (left+right)/2;
        pen.fillText(title,center,depth-3,right-left);
        if (mode === chart && showVedha && key === chart) {
          const midpoint = pen.getTransform().transformPoint({ x: center, y: depth-9 });
          const labelWidth = Math.max(24, Math.min(right-left, pen.measureText(title).width+8));
          const sideways = sideIndex % 2 !== 0;
          const width = sideways ? 24 : labelWidth;
          const height = sideways ? labelWidth : 24;
          dwiLabelAreas.push([run.section,midpoint.x/2-width/2,midpoint.y/2-height/2,width,height]);
        }
      }
      pen.restore();
    }
  }
  const chartOverlay = showVedha ? element('canvas', '', 'vedha-overlay') : null;
  if (chartOverlay) {
    chartOverlay.width = chartOverlay.height = 600;
    chartOverlay.setAttribute('aria-hidden', 'true');
    sheet.append(chartOverlay);
  }
  const vedhaReadout = element('div', '', 'vedha-readout');
  vedhaReadout.setAttribute('aria-live', 'polite');
  function showLines(index, sourcePlanet) {
    if (!showVedha) return;
    const chartInk = chartOverlay.getContext('2d');
    chartInk.clearRect(0, 0, 600, 600);
    vedhaReadout.replaceChildren();
    if (index === null) return;
    const [sourceX, sourceY] = dwiTips[index];
    const sourceStar = mod(rahu + index);
    const overlay = element('canvas', '', 'vedha-grid');
    overlay.width = overlay.height = 600;
    overlay.setAttribute('aria-hidden', 'true');
    vedhaReadout.append(overlay);
    const ink = overlay.getContext('2d');
    ink.drawImage(lattice, 0, 0, 600, 600);
    ink.font = '22px sans-serif';
    ink.textAlign = 'center';
    ink.textBaseline = 'middle';
    const source = sourcePlanet || planetsAt(sourceStar).filter(name => name !== 'လဂ်').join('၊ ');
    vedhaReadout.append(element('strong', source + ' · ' + stars[sourceStar]));
    const list = element('ul');
    vedhaReadout.append(list);
    const targets = dwiVedha(rahu, sourceStar);
    targets.forEach((star, direction) => {
      const [targetX, targetY] = dwiTips[mod(star - rahu)];
      for (const context of [chartInk, ink]) {
        strokeVedha(context, [sourceX, sourceY], [targetX, targetY], direction);
      }
      const targetPlanets = planetsAt(star).filter(name => name !== 'လဂ်');
      const row = element('li', vedhaNames[direction] + ' · ' + stars[star] + ' · '
        + (targetPlanets.length ? targetPlanets.join('၊ ') + 'ကို ထွင်း' : 'ဂြိုဟ်မရှိ'));
      row.style.setProperty('--vedha-color', vedhaColors[direction]);
      list.append(row);
    });
    stars.forEach((name, star) => {
      const [sx,sy] = points[mod(star - rahu)];
      const direction = targets.indexOf(star);
      ink.fillStyle = direction >= 0 ? vedhaColors[direction] : star === sourceStar ? '#15547b' : '#fff';
      ink.beginPath();
      ink.arc(sx,sy,16,0,Math.PI*2);
      ink.fill();
      ink.fillStyle = direction >= 0 || star === sourceStar ? '#fff' : '#183448';
      ink.fillText(star === abhijitIndex ? '×' : (star < abhijitIndex ? star+1 : star).toLocaleString('my-MM'),sx,sy);
    });

  }
  const planetsAt = star => [
    ...autoFields.filter(([id]) => positions[id] === star).map(([,name]) => name),
    ...(ketu === star ? ['ကိတ်'] : [])
  ];
  const abhijitIndex = stars.indexOf('အဘိဇိ');
  const birthLabels = new Map(birthStarRoles.map(([id, title], index) => [
    positions[id], { title, number: (index + 1).toLocaleString('my-MM') }
  ]));
  points.forEach(([x,y], index) => {
    const star = mod(rahu + index);
    const button = element('button');
    button.type = 'button';
    button.style.left = (100*x/600) + '%';
    button.style.top = (100*y/600) + '%';
    const occupants = planetsAt(star);
    button.textContent = star === abhijitIndex
      ? '×'
      : (star < abhijitIndex ? star + 1 : star).toLocaleString('my-MM');
    button.dataset.star = String(star);
    button.dataset.section = placement(rahu,star)[chart];
    if (colorSections) {
      const [fill, stroke] = sectionColors[button.dataset.section];
      button.style.backgroundColor = fill;
      button.style.color = stroke;
      button.style.boxShadow = 'inset 0 0 0 1px ' + stroke;
    }
    const birthMarker = birthLabels.get(star);
    const birthLabel = birthMarker?.title;
    const accessibleLabel = [stars[star], birthLabel, ...occupants].filter(Boolean).join(' · ');
    button.setAttribute('aria-label', accessibleLabel);
    button.title = accessibleLabel;
    if (birthMarker) {
      const marker = element('span', birthMarker.number, 'birth-star-marker');
      marker.setAttribute('aria-hidden', 'true');
      marker.dataset.edge = String(Math.floor(((index + 3) % 28) / 7));
      button.append(marker);
    }
    if (occupants.length) {
      button.classList.add('occupied');
      const symbols = { 'တနင်္ဂနွေ': '၁', 'တနင်္လာ': '၂', 'အင်္ဂါ': '၃', 'ဗုဒ္ဓဟူး': '၄', 'ကြာသပတေး': '၅', 'သောကြာ': '၆', 'စနေ': '၇', 'ရာဟု': '၈', 'ကိတ်': '၉', 'လဂ်': 'လဂ်' };
      const direction = Math.floor(((index + 3) % 28) / 7);
      const dx = [0, 1, 0, -1][direction];
      const dy = [-1, 0, 1, 0][direction];
      pen.save();
      pen.translate(x + dx * 26, y + dy * 26);
      if (dy) pen.rotate(-Math.PI / 2);
      pen.fillStyle = '#15547b';
      pen.font = 'bold 17px sans-serif';
      pen.textAlign = 'center';
      pen.textBaseline = 'middle';
      pen.fillText(occupants.map(name => symbols[name]).join(''), 0, 0, 62);
      pen.restore();
      if (showVedha && occupants.some(name => name !== 'လဂ်')) {
        const marker = element('button', '', 'vedha-marker');
        marker.type = 'button';
        marker.tabIndex = -1;
        marker.setAttribute('aria-label', occupants.join('၊ '));
        marker.style.left = (x + dx*26)/6 + '%';
        marker.style.top = (y + dy*26)/6 + '%';
        marker.addEventListener('pointerenter', () => showLines(index));
        marker.addEventListener('pointerleave', () => showLines(null));
        marker.addEventListener('click', () => button.click());
        sheet.append(marker);
      }
    }
    if (star === rahu || star === guru) button.classList.add('axis');
    const group = placement(rahu, star);
    if (star !== abhijitIndex) button.setAttribute('aria-haspopup', 'dialog');
    const describe = () => {
      const readings = mode in modes ? [labelOf(group[mode])]
        : mode === 'bhumi' ? [directions[star]]
        : mode.endsWith('-wheel') ? [side(mode === 'rahu-wheel' ? rahu : ketu, star)]
        : Object.keys(modes).map(key => modeTitles[key] + ' · ' + labelOf(group[key]));
      caption.textContent = [stars[star], birthLabel, ...occupants, ...readings].filter(Boolean).join(' / ');
      sheet.querySelector('.active')?.classList.remove('active');
      button.classList.add('active');
    };
    button.addEventListener('click', event => {
      describe();
      showLines(occupants.some(name => name !== 'လဂ်') ? index : null);
      if (event.isTrusted && star !== abhijitIndex) openChartStarInformation(star);
    });
    if (showVedha && occupants.some(name => name !== 'လဂ်')) {
      button.addEventListener('pointerenter', () => showLines(index));
      button.addEventListener('pointerleave', () => showLines(null));
      button.addEventListener('focus', () => showLines(index));
      button.addEventListener('blur', () => showLines(null));
    }
    sheet.append(button);
    if (!showVedha && rahu === star) describe();
  });
  const legend = element('div', '', 'wheel-planets');
  for (const [id, name] of [...autoFields, ['ketu', 'ကိတ်']]) {
    const star = id === 'ketu' ? ketu : positions[id];
    if (star === undefined) continue;
    const chip = element('button', name + ' · ' + stars[star]);
    chip.type = 'button';
    const index = mod(star - rahu);
    const selectPlanet = () => {
      sheet.querySelectorAll('button[data-star]')[index].click();
      if (showVedha && id !== 'lagna') showLines(index, name);
    };
    chip.addEventListener('click', selectPlanet);
    if (showVedha && id !== 'lagna') {
      chip.addEventListener('pointerenter', () => showLines(index, name));
      chip.addEventListener('pointerleave', () => showLines(null));
      chip.addEventListener('focus', () => showLines(index, name));
      chip.addEventListener('blur', () => showLines(null));
    }
    legend.append(chip);
  }
  diagram.append(sheet, caption, vedhaReadout, legend);
  if (showVedha) {
    const dialog = element('dialog', '', 'dwi-dialog');
    const heading = element('h3');
    heading.id = 'dwi-dialog-heading';
    dialog.setAttribute('aria-labelledby', heading.id);
    const sectionReading = element('section');
    const close = element('button', 'ပိတ်ရန်');
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    dialog.append(close, heading, sectionReading);
    if (mode === 'dwi') {
      const planetFields = [...autoFields.filter(([id]) => id !== 'lagna'), ['ketu', 'ကိတ်']];
      const details = element('div', '', 'dwi-dialog-data');
      const transitTime = new Date();
      const changes = starChanges('ဂြိုဟ်ကိုးပါး နက္ခတ်ပြောင်းချိန် · နောက် ၃၀ ရက်', planetFields, transitTime);

      const natal = planetaryStars(yangonInstant(find('chart-time').value));
      const transit = planetaryStars(transitTime);
      const natalPoints = birthStarRoles.map(([id, title]) => [title, positions[id]]);
      for (const [label, chartPositions] of [['မူလ ဂြိုဟ်စီး၊ နင်း၊ ထွင်း', natal], ['ကောဇာ ဂြိုဟ်စီး၊ နင်း၊ ထွင်း', transit]]) {
        const group = element('details');
        group.append(element('summary', label));
        const rows = planetFields.map(([id,name]) => {
          const star = id === 'ketu' ? mod(chartPositions.rahu + 14) : chartPositions[id];
          const contacts = natalPoints.filter(([,index]) => index === star).map(([title]) => title);
          return [[name, stars[star], contacts.join('၊ ') || '—',
            ...dwiVedha(chartPositions.rahu, star).map(index => stars[index])],false];
        });
        group.append(makeTable(['ဂြိုဟ်','စီးနက္ခတ်','မူလနက္ခတ်ပေါ် နင်းမှု',...vedhaNames], rows));
        details.append(group);
      }
      diagram.append(details, changes);
    }

    for (const [key,x,y,width,height] of (mode === 'dwi' ? [...dwiRegions, ...dwiLabelAreas] : dwiLabelAreas)) {
      const area = element('button', '', 'dwi-region');
      area.type = 'button';
      area.setAttribute('aria-label', labelOf(key) + ' ပရိယာယ်');
      area.setAttribute('aria-haspopup', 'dialog');
      area.style.left = (x+width/2)/6 + '%';
      area.style.top = (y+height/2)/6 + '%';
      area.style.width = width/6 + '%';
      area.style.height = height/6 + '%';
      area.addEventListener('click', () => {
        heading.textContent = labelOf(key);
        const excerpts = mode === 'dwi' ? dwiExcerpts.sections[key]
          : mode === 'dasa' ? dasaExcerpts.topics[key] : shadExcerpts.topics[key] ?? [sections[key][1]];
        sectionReading.replaceChildren(...excerpts.map(text => element('p', text)));
        dialog.scrollTop = 0;
        dialog.showModal();
      });
      sheet.append(area);
    }
    diagram.append(dialog);
  }
  body.append(diagram, nodes);
  const birthStars = element('section', '', 'card birth-stars');
  birthStars.append(element('h3', 'ဇနမနှင့် ဆက်စပ်နက္ခတ်များ'));
  const rows = birthStarRoles.map(([id, title]) => {
    const star = positions[id];
    return [[birthLabels.get(star).number, title, stars[star], labelOf(placement(rahu, star)[chart])], id === 'birth'];
  });
  birthStars.append(makeTable(['စဉ်', 'အမျိုးအစား', 'နက္ခတ်', 'စက်ဌာန'], rows));
  body.append(birthStars);

  if (mode === 'bhumi') {
    appendBhumi(body, rahu, positions.moon);
  } else if (mode === 'rahu-wheel' || mode === 'ketu-wheel') {
    appendSides(body, rahu, ketu, [mode]);
  } else if (mode === 'all') {
    for (const chart of Object.keys(modes)) {
      const group = element('details', '', 'catalog chart-group');
      group.dataset.chart = chart;
      group.open = expandedCharts.get(chart) ?? false;
      const content = element('div', '', 'chart-content');
      group.append(element('summary', modeTitles[chart]), content);
      renderChart(content, chart, rahu, ketu);
      body.append(group);
    }
    appendSides(body, rahu, ketu);
  } else {
    renderChart(body, mode, rahu, ketu);
    if (!(mode in modes)) appendSides(body, rahu, ketu);
  }
}

function starChanges(title, planetFields, transitTime = new Date()) {
  const changes = element('details');
  changes.append(element('summary', title));
  const changeList = element('div', '', 'star-change-list');
  changes.append(changeList);
  const formatTime = new Intl.DateTimeFormat('my-MM', {
    timeZone: 'Asia/Yangon', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  changes.addEventListener('toggle', () => {
    if (!changes.open || changeList.childNodes.length) return;
    const rows = [];
    const step = 2*3600000;
    let previous = planetaryStars(transitTime);
    for (let end = +transitTime+step; end <= +transitTime+30*86400000; end += step) {
      const current = planetaryStars(new Date(end));
      for (const [id,name] of planetFields) {
        if (current[id] === previous[id]) continue;
        let low = end-step, high = end;
        while (high-low > 1000) {
          const mid = Math.floor((low+high)/2);
          if (planetaryStars(new Date(mid))[id] === previous[id]) low = mid;
          else high = mid;
        }
        rows.push({ time: high, values: [name, stars[previous[id]], stars[current[id]], formatTime.format(high)] });
      }
      previous = current;
    }
    rows.sort((a,b) => a.time-b.time);
    changeList.append(rows.length
      ? makeTable(['ဂြိုဟ်','မှ','သို့','မြန်မာစံတော်ချိန်'], rows.map(row => [row.values,false]))
      : element('p','ဤကာလအတွင်း နက္ခတ်ပြောင်းမှု မတွေ့ပါ။'));
  });
  return changes;
}

function appendShadContest(parent, rahu, sun, moon) {
  const section = element('section', '', 'card shad-contest');
  section.append(element('h3', 'နဂို / ယာယီ'));
  const placements = element('div', '', 'two');
  card(placements, 'နဂို · တနင်္ဂနွေ', stars[sun], labelOf(placement(rahu, sun).shad));
  card(placements, 'ယာယီ · တနင်္လာ', stars[moon], labelOf(placement(rahu, moon).shad));
  const changes = starChanges('တနင်္ဂနွေ၊ တနင်္လာ နက္ခတ်ပြောင်းချိန် · နောက် ၃၀ ရက်', [
    ['sun', 'တနင်္ဂနွေ'], ['moon', 'တနင်္လာ']
  ]);
  const reading = element('details');
  reading.append(
    element('summary', 'နဂို / ယာယီ အဟော'),
    element('p', shadExcerpts.contest[placement(rahu, sun).shad][placement(rahu, moon).shad], 'value'),
    element('p', 'တနင်္ဂနွေ နောက်ဘက် သို့မဟုတ် ညာဘက်တွင် ရှိစေပါ။', 'hint')
  );
  section.append(placements, changes, reading);
  parent.append(section);
}

function renderChart(body, chart, rahu, ketu) {
  const sun = selected('sun');
  const moon = selected('moon');
  if (sun !== null && moon !== null) {
    if (chart === 'dwi') {
      const sunGroup = placement(rahu, sun).dwi;
      const moonGroup = placement(rahu, moon).dwi;
      const sunLiving = isLiving(sunGroup);
      const moonLiving = isLiving(moonGroup);
      const timingIndex = sunLiving ? (moonLiving ? 3 : 0) : (moonLiving ? 1 : 2);
      const contestIndex = sunGroup === 'mu' && moonGroup === 'guru' ? 2
        : sunGroup === 'guru' && moonGroup === 'mu' ? 3
        : [1, 0, 5, 4][timingIndex];
      card(body, 'အခါရွေး', dwiExcerpts.timing[timingIndex]);
      card(body, 'နဂိုနှင့် ယာယီ', dwiExcerpts.contest[contestIndex]);
    }
    if (chart === 'shad') {
      appendShadContest(body, rahu, sun, moon);
      appendBhumi(body, rahu, moon);
    }
  }
  if (chart === 'dasa') {
    card(body, 'နဂိုနှင့် ယာယီ', 'လောကနှင့် ဂြိုဟ်နက္ခတ်များ = နဂို။ မိမိ = ယာယီ။', 'စစ်လိုသော နက္ခတ်၏ ဌာနနှင့် သဘောကို ဇယားတွင် ကြည့်ပါ။');
  }

  const planets = element('details', '', 'catalog');
  planets.append(element('summary', 'ဂြိုဟ်စီးနက္ခတ်များ'));
  body.append(planets);
  for (const [id, label] of [...autoFields.slice(1), ['birth', 'ဇနမနက္ခတ်'], ...extras]) {
    const star = selected(id);
    if (star === null) continue;
    const [group, description] = sections[placement(rahu, star)[chart]];
    card(planets, `${label} · ${stars[star]}`, group, chart === 'shad' ? `${description} · ${directions[star]}` : description);
  }
  appendCatalog(body, rahu, ketu, chart);
  appendFullReadings(body, chart);
}

const isLiving = group => group === 'jiva' || group === 'guru';
let chapterTextPromise;

function appendFullReadings(parent, chart) {
  const chartPositions = { ...positions };
  const section = element('section', '', 'full-readings');
  section.append(element('h2', 'အဟောနှင့် ယတြာ'));
  section.append(element('p', 'ရိုးရာဗေဒင်ကျမ်းမှ အဟောများဖြစ်သည်။ ကျန်းမာရေးနှင့် ဆိုင်သောအဆိုများကို ဆေးကုသမှုဆုံးဖြတ်ချက်အဖြစ် အသုံးမပြုပါနှင့်။', 'hint'));
  parent.append(section);
  const readingRoles = chart !== 'dwi' ? birthStarRoles : [['birth','ဇနမနက္ခတ်'], ...extras];
  for (const [role,title] of readingRoles) {
    const star = chartPositions[role];
    const group = placement(chartPositions.rahu,star);
    const reading = element('article', '', 'card');
    reading.append(element('h3', title + ' · ' + stars[star]));
    reading.append(element('p', labelOf(group[chart]), 'value'));
    if (chart === 'shad') {
      const rule = shadExcerpts.rules[group.shad]?.[role];
      if (!rule) continue;
      reading.append(element('p', rule));
    } else if(chart === 'dasa') {
      const rule = dasaExcerpts.rules[role]?.[group.dasa];
      if (!rule) continue;
      reading.append(element('p', rule));
    }
    const living = Number(isLiving(group.dwi));
    if (chart === 'dwi') {
      if (role === 'birth') {
        reading.append(element('p', context() === 'မူလ' ? dwiExcerpts.natal[living] : dwiExcerpts.transit));
        reading.append(element('h4', 'သက်ဆိုင်သော ယတြာ'));
        for (const text of dwiExcerpts.remedies[living]) reading.append(element('p', text));
      }

    }
    section.append(reading);
  }
  if (chart === 'shad') {
    for (const [title, paragraphs] of shadExcerpts.notes) {
      const detail = element('details', '', 'card catalog');
      detail.append(element('summary', title), ...paragraphs.map(text => element('p', text)));
      section.append(detail);
    }
    const moonGroup = placement(chartPositions.rahu, chartPositions.moon).shad;
    const birthGroup = placement(chartPositions.rahu, chartPositions.birth).shad;
    const excerpts = [
      moonGroup !== 'guru' && shadExcerpts.remedies[moonGroup],
      birthGroup === 'guru' && shadExcerpts.remedies.guru
    ].filter(Boolean);
    if (excerpts.length) {
      const remedy = element('article', '', 'card');
      remedy.append(element('h3', 'သက်ဆိုင်သော ယတြာ'));
      for (const excerpt of excerpts) remedy.append(element('p', excerpt));
      section.append(remedy);
    }
  }
  if (chart === 'dasa') {
    const chapter = element('details', '', 'card catalog');
    chapter.append(element('summary', 'ဒဿင်္ဂ ပညာရပ်ဆိုင်ရာ မူရင်းစာ'));
    chapter.addEventListener('toggle', async () => {
      if (!chapter.open || chapter.childElementCount > 1) return;
      const content = element('div', 'စာသား ရယူနေသည်…', 'reading-pages');
      chapter.append(content);
      try {
        chapterTextPromise ??= fetch('./readings-text.json').then(response => {
          if (!response.ok) throw new Error('Cannot load source text');
          return response.json();
        }).catch(error => { chapterTextPromise = null; throw error; });
        const pages = await chapterTextPromise;
        const fragment = document.createDocumentFragment();
        for (const [page, start, end] of dasaExcerpts.studyRanges) {
          for (const { text, heading } of pages[page].slice(start, end ?? undefined)) {
            fragment.append(element(heading ? 'h4' : 'p', text));
          }
        }
        content.replaceChildren(fragment);
      } catch {
        content.remove();
        chapter.open = false;
        chapter.firstElementChild.textContent = 'ဒဿင်္ဂ မူရင်းစာ ပြန်ရယူရန်';
      }
    });
    section.append(chapter);
  }
  if (chart === 'dwi') {
    const saturnSection = placement(chartPositions.rahu, chartPositions.saturn).dwi;
    const guidance = element('article', '', 'card');
    guidance.append(element('h3', 'စနေဂြိုဟ်အတွက် ဆီရွေးခြင်း'));
    for (const text of dwiExcerpts.saturn[Number(isLiving(saturnSection))]) {
      guidance.append(element('p', text));
    }
    section.append(guidance);
    const offerings = element('article', '', 'card');
    offerings.append(element('h3', 'ဇီဝပက္ခနှင့် မတပက္ခ ယတြာ'));
    for (const text of dwiExcerpts.offeringRemedies) offerings.append(element('p', text));
    const hindu = element('article', '', 'card');
    const [heading, ...paragraphs] = dwiExcerpts.hinduRemedies;
    hindu.append(element('h3', heading));
    for (const text of paragraphs) hindu.append(element('p', text));
    section.append(offerings, hindu);
  }

}

function refresh() {
  setContext();
  calculate();
  render();
}


const titles = { dwi: 'ဒွိဒင်္ဂ ရာဟုကာလာနစက်', shad: 'ဆဋ္ဌင်္ဂ ရာဟုကာလာနစက်', dasa: 'ဒဿင်္ဂ ရာဟုကာလာနစက်', takka: 'တက္ကလိကာ' };
function filterCities() {
  const current = find('city').value;
  find('city').replaceChildren(new Option('မြို့ ရွေးပါ',''));
  cities.forEach(([name, english, latitude, longitude, region], index) => {
    if ((name + ' ' + english + ' ' + region).normalize('NFC').toLowerCase().includes(find('city-search').value.normalize('NFC').trim().toLowerCase())) {
      find('city').add(new Option(name + ' · ' + english + ' · ' + region, String(index)));
    }
  });
  find('city').value = current;
}
find('city-search').addEventListener('input', filterCities);
filterCities();
let chosen = 'dwi';
let hasResult = false;
function route() {
  const page = location.hash.slice(1);
  const result = page === 'result' && hasResult;
  const entry = page === 'input' || (page === 'result' && !hasResult);
  find('home').hidden = entry || result;
  form.hidden = !entry;
  find('result').hidden = !result;
  find('back-home').hidden = !(entry || result);
  find('form-title').hidden = !entry;
  find('form-title').textContent = titles[chosen];
  window.scrollTo(0,0);
}
for (const button of document.querySelectorAll('[data-mode]')) {
  button.addEventListener('click', () => {
    chosen = button.dataset.mode;
    hasResult = false;
    mode = chosen;
    find('context').selectedIndex = chosen === 'takka' ? 2 : 1;
    setContext();
    find('chart-time-label').hidden = true;
    location.hash = 'input';
    route();
  });
}
find('back-home').onclick = () => { location.hash = 'home'; };
find('edit-data').onclick = () => { location.hash = 'input'; };
window.addEventListener('hashchange', route);
function updateTimeInterval() {
  const input=find('event-time');
  find('start').value = '';
  find('end').value = '';
  find('interval-note').textContent = '';
  const city = cities[Number(find('city').value)];
  if(!input.value || !input.validity.valid || !find('city').value || !city) return;
  try {
    const interval=takkalikaAt(yangonInstant(input.value), {latitude:city[2],longitude:city[3]}, timedPeriod().value);
    const formatter=new Intl.DateTimeFormat('en-GB',{
      timeZone:'Asia/Yangon', year:'numeric',month:'2-digit',day:'2-digit',
      hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
    });
    for(const [id,date] of [['start',interval.start],['end',interval.end]]) {
      find(id).value=formatter.format(date)+' (မြန်မာစံတော်ချိန်)';
    }
    const method = timedPeriod();
    find('interval-note').textContent = method.selectedOptions[0].textContent
      + (interval.slot ? ' · အပိုင်း '+interval.slot.toLocaleString('my-MM') : '');
    return interval;
  } catch {
    find('start').value='';
    find('end').value='';
    find('interval-note').textContent='ရက်စွဲနှင့် အချိန်ကို ပြန်စစ်ပါ။';
  }
}
find('event-time').addEventListener('input',updateTimeInterval);
for (const id of ['city', 'timed-period']) find(id).addEventListener('change', updateTimeInterval);
find('timed-method').addEventListener('change', () => {
  setContext();
  updateTimeInterval();
});

form.addEventListener('invalid', event => {
  const label = event.target.closest('label')?.childNodes[0]?.textContent?.trim() || 'အချက်အလက်';
  find('error').textContent = label + 'ကို မှန်ကန်စွာ ဖြည့်ပါ။';
  find('error').hidden = false;
}, true);
form.addEventListener('input', () => {
  find('error').hidden = true;
});

form.addEventListener('submit', event => {
  event.preventDefault();
  mode = timedChart() ?? chosen;
  if (isTimed() && !timedChart()) {
    refresh();
    if (positions.rahu === undefined) return;
    hasResult = true;
    find('person-output').textContent = cities[Number(find('city').value)][0];
    location.hash = 'result';
    route();
    return;
  }
  const date = [find('year').value,find('month').value.padStart(2,'0'),find('day').value.padStart(2,'0')].join('-');
  const hour = Number(find('hour').value) % 12 + (find('meridiem').value === 'PM' ? 12 : 0);
  const value = date + 'T' + String(hour).padStart(2,'0') + ':' + find('minute').value.padStart(2,'0') + ':' + find('second').value.padStart(2,'0');
  const check = new Date(value + 'Z');
  if (!Number.isFinite(check.getTime()) || check.toISOString().slice(0,10) !== date) {
    find('error').textContent = 'မွေးသက္ကရာဇ်ကို ပြန်စစ်ပါ။';
    find('error').hidden = false;
    return;
  }
  find('chart-time').value = value;
  const city = cities[Number(find('city').value)];
  refresh();
  if (positions.rahu === undefined) return;
  hasResult = true;
  find('person-output').textContent = [find('person-name').value, date, city[0]].filter(Boolean).join(' · ');
  location.hash = 'result';
  route();
});
const current = yangonDateTime();
const [datePart,timePart] = current.split('T');
const [year,month,day] = datePart.split('-');
const [hour,minute] = timePart.split(':');
for (const [id,value] of Object.entries({year,month,day,minute,hour:Number(hour)%12 || 12})) find(id).value=value;
find('meridiem').value=Number(hour)>=12?'PM':'AM';
find('chart-time').value=current;
find('event-time').value=current;
updateTimeInterval();
route();

connectStarInformation(document.getElementById('result-body'), stars);
