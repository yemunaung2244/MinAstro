const stars = [
  'အဿဝဏီ', 'ဘရဏီ', 'ကြတ္တိကာ', 'ရောဟဏီ', 'မိဂသီ', 'အဒြ', 'ပုဏ္ဏဖုသျှ', 'ဖုသျှ', 'အဿလိဿ',
  'မာဃ', 'ပြုဗ္ဗဖလဂုဏီ', 'ဥတ္တရဖလဂုဏီ', 'ဟဿတ', 'စိတြ', 'သွာတိ', 'ဝိသာခါ', 'အနုရာဓ', 'ဇေဋ္ဌ',
  'မူလ', 'ပြုဗ္ဗသာဠ်', 'ဥတ္တရသာဠ်', 'သရဝဏ်', 'ဓနသိဒ္ဓိ', 'သတ္တဘိသျှ', 'ပြုဗ္ဗဘဒြပိုဒ်', 'ဥတ္တရဘဒြပိုဒ်', 'ရေဝတီ'
];

const taras = [
  ['ဇနမ', 'မူလနက္ခတ်အုပ်စု'],
  ['သမ္ပတ္တိ', 'ချမ်းသာကြွယ်ဝခြင်း'],
  ['ဝိပတ္တိ', 'အခက်အခဲနှင့် အနှောင့်အယှက်'],
  ['ခေမ', 'ငြိမ်းအေးခြင်း'],
  ['ပြတ္တရ', 'အတားအဆီးနှင့် အခက်အခဲ'],
  ['သာဓက', 'ကြိုးစားအားထုတ်ခြင်း'],
  ['ဗာဓ', 'အဟန့်အတား'],
  ['မိတ္တ', 'မိတ်သဟာယ'],
  ['အတိမိတ္တ', 'ရင်းနှီးသော မိတ်သဟာယ']
];

const chart = document.querySelector('#chart');
const number = new Intl.NumberFormat('my');

function taraMembers(start, index) {
  return [0, 9, 18].map(offset => stars[(start + index + offset) % stars.length]);
}

function renderChart(start, activeTara) {
  const rows = taras.map(([name], index) => {
    const row = document.createElement('tr');
    const current = index === activeTara;
    row.classList.toggle('active-row', current);
    row.innerHTML = `
      <th scope="row"${current ? ' aria-current="true"' : ''}>${name}</th>
      ${taraMembers(start, index).map(star => `<td>${star}</td>`).join('')}
    `;
    return row;
  });
  chart.replaceChildren(...rows);
  document.querySelector('#status').textContent = stars[start] + ' မှ စတင်တွက်ချက်ထားပါသည်။';
}

const field = id => document.getElementById(id);
const form = document.querySelector('form');
const overview = field('overview');
const results = document.querySelector('.results');
const feedback = field('feedback');
const city = field('city');
const places = field('places');
const zone = 'Asia/Yangon';
const normalize = value => value.normalize('NFC').toLowerCase().trim();
const birthFields = ['day', 'month', 'year', 'hour', 'minute', 'second', 'period'];
const numericValue = id => field(id).value.replace(/[၀-၉]/g, digit => '၀၁၂၃၄၅၆၇၈၉'.indexOf(digit));

function listCities() {
  const selected = places.value;
  const query = normalize(city.value).replace(/[\s-]/g, '').replace('naypyidaw', 'naypyitaw');
  const options = MYANMAR_CITIES.flatMap(([my, en, region], index) => {
    const label = [...new Set([my, en, region].filter(Boolean))].join(' · ');
    return normalize(label).replace(/[\s-]/g, '').includes(query) ? [new Option(label, index)] : [];
  });
  places.replaceChildren(new Option(options.length ? 'မြို့ရွေးပါ' : 'မြို့မတွေ့ပါ', ''), ...options);
  if (options.some(option => option.value === selected)) places.value = selected;
  if (options.length === 1) places.value = options[0].value;
}

function resolveBirthTime(date, time, zone) {
  const wallTime = Date.parse(date + 'T' + time + 'Z');
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
  function localTime(epoch) {
    const parts = Object.fromEntries(formatter.formatToParts(epoch).map(({type, value}) => [type, value]));
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  }
  // Sampling either side of the input captures both offsets at a clock change.
  const offsets = new Set([-1, 0, 1].map(day => {
    const sample = wallTime + day * 86400000;
    return localTime(sample) - sample;
  }));
  return [...offsets].map(offset => wallTime - offset)
    .filter(epoch => localTime(epoch) === wallTime).sort((a, b) => a - b);
}

function siderealLongitude(longitude, date) {
  const centuries = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 3155760000000;
  const ayanamsha = 23.8531 + 1.39697 * centuries + 0.00031 * centuries ** 2;
  return (longitude - ayanamsha + 360) % 360;
}

const mansionWidth = 360 / 27;

function moonStar(date) {
  const sector = siderealLongitude(Astronomy.EclipticGeoMoon(date).lon, date) / mansionWidth;
  return {index: Math.floor(sector), pada: 1 + Math.floor((sector % 1) * 4)};
}

function validateBirth() {
  feedback.textContent = '';
  if (places.value === '' || !birthFields.every(id => field(id).value)) return;
  const entries = birthFields.slice(0, -1).map(numericValue);
  const [day, month, year, hour, minute, second] = entries.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (!entries.every(value => /^\d+$/.test(value)) || year < 1900 || date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day ||
      hour < 1 || hour > 12 || minute > 59 || second > 59) {
    feedback.textContent = 'မွေးရက်နှင့် မွေးချိန်ကို ပြန်စစ်ပါ။';
    return;
  }
  const hour24 = hour % 12 + (field('period').value === 'PM' ? 12 : 0);
  const time = [hour24, minute, second].map(value => String(value).padStart(2, '0')).join(':');
  const instants = resolveBirthTime(date.toISOString().slice(0, 10), time, zone);
  if (instants[0] > Date.now()) {
    feedback.textContent = 'မွေးရက်နှင့် မွေးချိန်သည် အနာဂတ်တွင် ဖြစ်နေပါသည်။';
    return;
  }
  if (!instants.length) {
    feedback.textContent = 'နာရီအပြောင်းအလဲကြောင့် ဤဒေသစံတော်ချိန် မရှိပါ။ မွေးချိန်ကို ပြန်စစ်ပါ။';
    return;
  }
  return instants;
}

function renderReading(index) {
  field('reading-title').textContent = taras[index][0] + 'တာရာအဟော';
  const content = [];
  function appendSection(paragraphs, heading) {
    if (heading) {
      const title = document.createElement('h3');
      title.textContent = heading;
      content.push(title);
    }
    for (const text of paragraphs) {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      content.push(paragraph);
    }
  }
  appendSection(taraReadings[index]);
  appendSection(taraPractices[index], index >= 7 ? 'မိတ္တနှင့် အတိမိတ္တတာရာ ကျင့်စဉ်' : 'ကျင့်စဉ်');
  if (taraAdditionalReadings[index]) {
    appendSection(taraAdditionalReadings[index], index === 3 ? 'ခေမတာရာ' : 'ပြတ္တရ - လက်ရည်တူတဲ့ ရန်သူ');
  }
  appendSection([taraRelationshipIntro, ...taraRelationships[index]], taraRelationshipHeading);
  const notes = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'ဆက်ဆံရေးအဟော၏ နောက်ဆက်တွဲ';
  notes.append(summary);
  for (const text of taraRelationshipClosing) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    notes.append(paragraph);
  }
  content.push(notes);
  if (index === 0) {
    const [opinion, divisions] = taraJanmaNotes;
    appendSection([opinion.intro], opinion.title);
    for (const group of opinion.groups) {
      const starsList = document.createElement('ul');
      starsList.className = 'reading-stars';
      for (const star of group.stars) {
        const item = document.createElement('li');
        item.textContent = star + 'နက္ခတ်။';
        starsList.append(item);
      }
      content.push(starsList);
      appendSection([group.text]);
    }
    appendSection(divisions.paragraphs, divisions.title);
  }
  appendSection([
    taras[index][0] + 'တာရာ - ' + taraKarakaPlanets[index] + 'ဂြိုဟ်။',
    ...taraKarakaReadings[index]
  ], 'ကာရကဂြိုဟ်နှင့် ယတြာ');
  if (index === 0) appendSection(taraJanmaDoNot, 'ဇနမတာရာမှာ လုပ်အပ်၊ မလုပ်အပ် ... ။');
  appendSection([
    taras[index][0] + 'တာရာနဲ့ စန်းယှဉ်တဲ့ နေ့ - ' + taraDailyPlanets[index] + 'ဂြိုဟ် အကျိုးပေး။'
  ], 'တာရာကိုးပါးစက်ရဲ့ ထူးခြားတဲ့ စနစ် တစ်ခု။');
  field('readings').replaceChildren(...content);
}

function renderWheel(birth, activeTara) {
  const center = field('wheel-center');
  const segments = field('wheel-segments');
  field('wheel-pointer').style.setProperty('--pointer-angle', `${activeTara * 40}deg`);
  const buttons = taras.map(([name], index) => {
    const button = document.createElement('button');
    const angle = (index * 40 - 90) * Math.PI / 180;
    button.type = 'button';
    button.className = 'wheel-segment';
    button.style.left = `${50 + 36 * Math.cos(angle)}%`;
    button.style.top = `${50 + 36 * Math.sin(angle)}%`;
    button.textContent = name;
    button.setAttribute('aria-label', name + 'တာရာ' + (index === activeTara ? '၊ လက်ရှိကျသောတာရာ' : ''));
    button.classList.toggle('current-tara', index === activeTara);
    button.addEventListener('click', () => selectTara(index));
    return button;
  });

  function selectTara(index) {
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    const title = document.createElement('strong');
    title.textContent = taras[index][0] + 'တာရာ';
    const members = document.createElement('ul');
    for (const star of taraMembers(birth.index, index)) {
      const item = document.createElement('li');
      item.textContent = star;
      members.append(item);
    }
    center.replaceChildren(title, members);
    renderReading(index);
  }

  segments.replaceChildren(...buttons);
  selectTara(activeTara);
}

const methods = {
  birth: 'မူလစန်းယှဉ်နက္ခတ်',
  annual: 'နှစ်စက် · တနင်္ဂနွေ မိဿရာသီကူးချိန်',
  monthly: 'လစက် · တနင်္ဂနွေ ရာသီကူးချိန်',
  transit: 'ကောဇာဂြိုဟ် နက္ခတ်ဝင်ချိန်',
  ascendant: 'မူလလဂ်စီးနက္ခတ်',
  comparison: 'မြို့ရွာ / အခြားသူ၏ မူလနက္ခတ်',
  upagraha: 'ဥပဂြဟနက္ခတ်',
  latta: 'လတ္တာစက်နက္ခတ်',
  custom: 'အခြားစနစ်၏ စမှတ်နက္ခတ်'
};

const planets = {
  Sun: 'တနင်္ဂနွေ', Moon: 'တနင်္လာ', Mars: 'အင်္ဂါ', Mercury: 'ဗုဒ္ဓဟူး',
  Jupiter: 'ကြာသပတေး', Venus: 'သောကြာ', Saturn: 'စနေ'
};

const epochFormat = new Intl.DateTimeFormat('my', {dateStyle: 'medium', timeStyle: 'short', timeZone: zone});

function bodyLongitude(body, date) {
  const longitude = body === 'Moon' ? Astronomy.EclipticGeoMoon(date).lon
    : Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon;
  return siderealLongitude(longitude, date);
}

function findBoundary(date, segmentAt, direction, stepHours, limitDays) {
  const sector = segmentAt(date);
  let near = date.getTime();
  const step = direction * stepHours * 3600000;
  const count = Math.ceil(limitDays * 24 / stepHours);
  for (let i = 0; i < count; i++) {
    let far = near + step;
    if (segmentAt(new Date(far)) !== sector) {
      while (Math.abs(near - far) > 1) {
        const middle = Math.floor((near + far) / 2);
        if (segmentAt(new Date(middle)) === sector) near = middle;
        else far = middle;
      }
      return new Date(Math.max(near, far));
    }
    near = far;
  }
  throw new Error('Boundary not found');
}

function anchorPeriod(entered, ends, label) {
  return {
    index: moonStar(entered).index,
    note: label,
    entered,
    ends
  };
}

function ascendantAnchor(date, city) {
  const [, , , latitude, longitude] = city;
  const rad = Math.PI / 180;
  const theta = (Astronomy.SiderealTime(date) * 15 + longitude) * rad;
  const centuries = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 3155760000000;
  const obliquity = (23.439291 - 0.0130042 * centuries) * rad;
  const rising = Math.atan2(Math.cos(theta),
    -Math.sin(theta) * Math.cos(obliquity) - Math.tan(latitude * rad) * Math.sin(obliquity)
  ) / rad;
  const sector = siderealLongitude(rising, date) / mansionWidth;
  return {index: Math.floor(sector), note: 'လဂ်ပါဒ ' + number.format(1 + Math.floor((sector % 1) * 4))};
}

function getAnchor(method, birth, now, birthDate, city) {
  if (method === 'birth') return {index: birth.index, note: 'ပါဒ ' + number.format(birth.pada)};
  if (method === 'ascendant') return ascendantAnchor(birthDate, city);
  if (method === 'annual' || method === 'monthly') {
    const annual = method === 'annual';
    const day = 86400000;
    const sunSector = date => Math.floor(bodyLongitude('Sun', date) / (annual ? 180 : 30));
    // For the annual search, bracket the Pisces–Aries crossing away from Libra.
    const start = annual
      ? new Date(Math.min(now.getTime(), now.getTime() - bodyLongitude('Sun', now) / 1.02 * day + 22 * day))
      : now;
    const entered = findBoundary(start, sunSector, -1, 12, annual ? 60 : 40);
    const endStart = annual ? new Date(entered.getTime() + 345 * day) : now;
    const ends = findBoundary(endStart, sunSector, 1, 12, 40);
    return anchorPeriod(entered, ends, annual ? 'မိဿရာသီကူးချိန်' : 'ရာသီကူးချိန်');
  }
  if (method === 'transit') {
    const body = field('planet').value;
    const sectorAt = date => Math.floor(bodyLongitude(body, date) / mansionWidth);
    const entered = findBoundary(now, sectorAt, -1, 3, 1500);
    const ends = findBoundary(now, sectorAt, 1, 3, 1500);
    const anchor = anchorPeriod(entered, ends, planets[body] + ' နက္ခတ်ဝင်ချိန်');
    // For the Moon, the entering mansion is itself the lunar anchor.
    if (body === 'Moon') anchor.index = sectorAt(now);
    anchor.transitStar = sectorAt(now);
    return anchor;
  }
  return {index: Number(field('anchor').value), note: 'ရွေးထားသော စမှတ်နက္ခတ်'};
}

function showResult({instants, values}) {
  const birthDate = new Date(instants[0]);
  const birth = moonStar(birthDate);
  const city = MYANMAR_CITIES[values.places];
  const instant = new Date();
  const now = moonStar(instant);
  const method = field('method').value;
  field('planet-input').hidden = method !== 'transit';
  field('anchor-input').hidden = ['birth', 'annual', 'monthly', 'transit', 'ascendant'].includes(method);
  field('method-note').textContent = '';
  if (!field('anchor-input').hidden && field('anchor').value === '') {
    field('method-note').textContent = 'ဤနည်းအတွက် မူရင်းစနစ်မှ သိထားသော စမှတ်နက္ခတ်ကို ရွေးပါ။';
    overview.hidden = field('method-output').hidden = true;
    return;
  }
  let anchor;
  try {
    anchor = getAnchor(method, birth, instant, birthDate, city);
  } catch {
    field('method-note').textContent = 'ကူးချိန်ကို ရှာမတွေ့ပါ။ အခြားစနစ်ကို ရွေးပါ။';
    overview.hidden = field('method-output').hidden = true;
    return;
  }
  const activeTara = (now.index - anchor.index + 27) % 9;
  const todayTara = taras[activeTara][0];
  const summary = [
    [methods[method], stars[anchor.index], anchor.note],
    ['လက်ရှိ တနင်္လာစီးနက္ခတ်', stars[now.index], todayTara + 'တာရာ']
  ];
  overview.replaceChildren(...summary.map(([label, value, note]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const definition = document.createElement('dd');
    const star = document.createElement('strong');
    star.textContent = value;
    const detail = document.createElement('span');
    detail.textContent = note;
    definition.append(star, detail);
    row.append(term, definition);
    return row;
  }));
  feedback.textContent = instants.length > 1
    ? zone + ' · နာရီထပ်နေသဖြင့် ပထမအကြိမ်ကို သုံးထားပါသည်။'
    : zone;
  const [my, en] = city;
  feedback.textContent = (my || en) + ' · ' + feedback.textContent;
  if (anchor.entered) {
    const transit = anchor.transitStar === undefined ? '' : ' · စီးနေသောနက္ခတ် ' + stars[anchor.transitStar];
    field('method-note').textContent = anchor.note + transit + ' · ' +
      epochFormat.format(anchor.entered) + ' မှ ' + epochFormat.format(anchor.ends) + ' အထိ (မြန်မာစံတော်ချိန်)';
  }
  if (method === 'ascendant' || !field('anchor-input').hidden) {
    const originalTara = taras[(now.index - birth.index + 27) % 9][0];
    field('method-note').textContent = 'မူလစန်းယှဉ်နက္ခတ် ' + stars[birth.index] + ' အရ လက်ရှိ ' + originalTara + 'တာရာ ကျပါသည်။';
  }
  renderWheel(anchor, activeTara);
  renderChart(anchor.index, activeTara);
  overview.hidden = field('method-output').hidden = false;
}

const storageKey = 'tara-birth-result';
const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');

if (form) {
  if (saved) {
    for (const id of [...birthFields, 'city']) field(id).value = saved.values[id];
  }
  listCities();
  if (saved) places.value = saved.values.places;
  city.addEventListener('input', listCities);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const instants = validateBirth();
    if (!instants) return;
    const values = Object.fromEntries([...birthFields, 'city', 'places'].map(id => [id, field(id).value]));
    sessionStorage.setItem(storageKey, JSON.stringify({instants, values}));
    location.assign('result.html');
  });
} else if (saved) {
  for (const [id, options] of [['method', Object.entries(methods)], ['planet', Object.entries(planets)], ['anchor', stars.map((star, index) => [index, star])]]) {
    const select = field(id);
    select.replaceChildren(...options.map(([value, label]) => new Option(label, value)));
    select.addEventListener('change', () => showResult(saved));
  }
  field('anchor').prepend(new Option('နက္ခတ်ရွေးပါ', '', true, true));
  for (const [id, sections] of [['election-sections', taraElectionSections], ['karaka-sections', taraKarakaTopics], ['nakshatra-sections', taraNakshatraTopics]]) {
    const fragment = document.createDocumentFragment();
    for (const [heading, paragraphs] of sections) {
      const title = document.createElement('h3');
      title.textContent = heading;
      fragment.append(title);
      for (const text of paragraphs) {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        fragment.append(paragraph);
      }
    }
    field(id).append(fragment);
  }
  results.hidden = false;
  showResult(saved);
} else {
  feedback.textContent = 'ရလဒ်ကြည့်ရန် မွေးဖွားမှုအချက်အလက်များ ဖြည့်ပြီး တွက်မည်ကို နှိပ်ပါ။';
}
