import { catalogs, getRuler, myanmarUtcOffset, slotMinutes, solarTimes, toMinutes, windowsFor } from './nadika.js';

const byId = (id) => document.getElementById(id);
const weekdays = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
const digits = '၀၁၂၃၄၅၆၇၈၉';
const mm = (value) => String(value).replace(/[0-9]/g, (digit) => digits[Number(digit)]);
const ascii = (value) => value.replace(/[၀-၉]/g, (digit) => String(digits.indexOf(digit)));
const timeLabel = (minutes) => {
  const seconds = Math.round(minutes * 60);
  const clockSeconds = (seconds + 86400) % 86400;
  const parts = [Math.floor(clockSeconds / 3600), Math.floor(clockSeconds / 60) % 60, clockSeconds % 60];
  return mm(parts.map((part) => String(part).padStart(2, '0')).join(':'))
    + (seconds >= 86400 ? ' (နောက်နေ့)' : seconds < 0 ? ' (မနေ့က)' : '');
};
const towns = JSON.parse(byId('town-data').textContent);
const form = byId('inputs');
const date = byId('date');
const time = byId('time');
const timeMode = byId('time-mode');
const location = byId('location');
const townSearch = byId('town-search');
const latitude = byId('latitude');
const longitude = byId('longitude');
const search = byId('search');
const effectButtons = [...byId('effect-nav').querySelectorAll('button')];
let effectFilter = 'all';
const catalogDay = byId('catalog-day');
const catalogDays = Object.keys(catalogs);
const dayMilliseconds = 86400000;
const dayMinutes = 1440;
let lastUpdate = '';
let lastCatalogDate = '';
let catalogSlot = null;

function myanmarNow() {
  return new Date(Date.now() + myanmarUtcOffset * 60000).toISOString();
}

function offsetDate(value, days) {
  return new Date(Date.parse(value + 'T00:00:00Z') + days * dayMilliseconds).toISOString().slice(0, 10);
}

function weekdayFor(value) {
  return new Date(value + 'T00:00:00Z').getUTCDay();
}

function renderLocations(selected) {
  const query = townSearch.value.trim().normalize().toLowerCase();
  location.replaceChildren();
  towns.forEach(([name, english, region], index) => {
    const label = [name, english, region].filter(Boolean).join(' · ');
    if (label.normalize().toLowerCase().includes(query)) location.add(new Option(label, index));
  });
  if (location.options.length === 0) {
    location.add(new Option('ကိုက်ညီတဲ့ မြို့ မတွေ့ပါ', ''));
  }
  location.add(new Option('လတ္တီတွဒ်၊ လောင်ဂျီတွဒ် ထည့်ရန်', 'custom'));
  if ([...location.options].some((option) => option.value === selected)) location.value = selected;
}

function selectedCoordinates() {
  if (location.value === 'custom') return [latitude.valueAsNumber, longitude.valueAsNumber];
  return towns[Number(location.value)].slice(3);
}

function tag(element, type) {
  element.className = `pill ${type}`;
  element.textContent = type === 'good' ? 'သင့်တော်' : 'သတိပြု';
}

function updateResult() {
  const live = timeMode.value === 'live';
  const now = myanmarNow();
  if (live) {
    date.value = now.slice(0, 10);
    time.value = now.slice(11, 19);
    byId('live-clock').textContent = mm(date.value.split('-').reverse().join('/') + ' · ' + time.value);
  }
  byId('live-clock').hidden = !live;
  byId('manual-time').hidden = live;
  const custom = location.value === 'custom';
  byId('coordinates').hidden = !custom;
  latitude.required = longitude.required = custom;
  latitude.disabled = longitude.disabled = !custom;

  const detail = byId('result-detail');
  if (!form.checkValidity() || !Number.isFinite(weekdayFor(date.value))) {
    lastUpdate = '';
    detail.hidden = true;
    byId('result-label').textContent = '';
    for (const id of ['sunrise', 'sunset', 'next-rise']) byId(id).value = '—';
    byId('next-field').hidden = true;
    byId('result-time').textContent = 'တည်နေရာ၊ ရက်စွဲနဲ့ အချိန် စစ်ပေးပါ';
    byId('result-note').textContent = 'စာရင်းထဲက မြို့တစ်မြို့ ရွေးပါ၊ သို့မဟုတ် တည်နေရာကို လတ္တီတွဒ်နဲ့ လောင်ဂျီတွဒ် ထည့်ပါ။';
    return;
  }

  const [lat, lon] = selectedCoordinates();
  const { sunrise, sunset } = solarTimes(date.value, lat, lon);
  const minute = toMinutes(time.value);
  const beforeSunrise = minute < sunrise;
  const night = beforeSunrise || minute >= sunset;
  const cycleDate = beforeSunrise ? offsetDate(date.value, -1) : date.value;
  const weekday = weekdayFor(cycleDate);
  const anchor = beforeSunrise ? solarTimes(cycleDate, lat, lon).sunset
    : night ? sunset : sunrise;
  const nextRise = night && !beforeSunrise ? solarTimes(offsetDate(date.value, 1), lat, lon).sunrise : sunrise;
  const limit = night ? dayMinutes + nextRise : sunset;
  const clockMinute = beforeSunrise ? dayMinutes + minute : minute;
  const windows = windowsFor(anchor, limit);
  const slot = catalogSlot === null
    ? windows.find(({ start, end }) => clockMinute >= start && clockMinute < end)
    : windows[catalogSlot - 1];
  const signature = [live, date.value, lat, lon, night, slot?.number, catalogSlot].join('|');
  if (signature === lastUpdate) return;
  lastUpdate = signature;

  if (cycleDate !== lastCatalogDate) {
    lastCatalogDate = cycleDate;
    catalogDay.value = weekday;
    renderCatalog();
  }
  byId('sunrise').value = timeLabel(sunrise);
  byId('sunset').value = timeLabel(sunset);
  byId('next-field').hidden = !night;
  if (night) byId('next-rise').value = timeLabel(nextRise + (beforeSunrise ? 0 : dayMinutes));
  detail.hidden = true;
  byId('result-label').textContent = `${weekdays[weekday]} · ${night ? 'ညပိုင်း' : 'နေ့ပိုင်း'}${slot ? ' · အမှတ် ' + mm(slot.number) : ''}`;

  if (!slot || slot.start >= limit) {
    byId('result-time').textContent = 'နာဒီကာအကွက် မရှိပါ';
    byId('result-note').textContent = slot ? 'ဒီအကွက်မစခင် အချိန်ပိုင်း ကုန်ဆုံးပါတယ်။'
      : 'ကျမ်းပါ ၂၄ မိနစ်စာ အကွက် ၃၀ ကုန်ဆုံးသွားပါပြီ။';
    return;
  }

  const dateOffset = beforeSunrise ? dayMinutes : 0;
  byId('result-time').textContent = `${timeLabel(slot.start - dateOffset)} – ${timeLabel(slot.end - dateOffset)}`;
  const seconds = Math.round((slot.end - slot.start) * 60);
  byId('result-note').textContent = seconds < slotMinutes * 60
    ? `အချိန်ပိုင်းကုန်ဆုံးချိန်အထိ ${mm(Math.floor(seconds / 60))} မိနစ် ${mm(seconds % 60)} စက္ကန့်သာ ကျန်ပါတယ်။`
    : `${night ? 'နေဝင်ချိန်' : 'နေထွက်ချိန်'}မှ ရေတွက်ထားတဲ့ ၂၄ မိနစ်စာ အကွက်ဖြစ်ပါတယ်။`;
  const [name, effect, type] = catalogs[weekday][slot.number - 1];
  byId('result-name').textContent = name;
  byId('result-effect').textContent = effect;
  byId('result-ruler').textContent = `စိုးမိုးဂြိုဟ် အမှတ် ${mm(getRuler(weekday, slot.number, night ? 'night' : 'day'))}`;
  tag(byId('result-tag'), type);
  detail.hidden = false;
}

function renderCatalog() {
  const query = ascii(search.value.trim()).normalize();
  const entries = byId('entries');
  const cards = document.createDocumentFragment();
  let visible = 0;

  const weekday = Number(catalogDay.value);
  catalogs[weekday].forEach(([name, effect, type], index) => {
    const id = index + 1;
    if (effectFilter !== 'all' && type !== effectFilter) return;
    if (query && !`${id} ${name} ${effect}`.normalize().includes(query)) return;

    const card = byId('entry-template').content.cloneNode(true);
    card.querySelector('.badge').textContent = mm(id);
    card.querySelector('h3').textContent = name;
    tag(card.querySelector('.pill'), type);
    card.querySelector('.effect').textContent = effect;
    card.querySelector('small').textContent = `စိုးမိုးဂြိုဟ် · နေ့ ${mm(getRuler(weekday, id, 'day'))} / ည ${mm(getRuler(weekday, id, 'night'))}`;
    const button = card.querySelector('button');
    button.setAttribute('aria-label', `အမှတ် ${mm(id)} ${name} အချိန်ကြည့်`);
    button.addEventListener('click', () => {
      const today = myanmarNow().slice(0, 10);
      const baseDate = Number.isFinite(weekdayFor(date.value)) ? date.value : today;
      date.value = offsetDate(baseDate, (weekday - weekdayFor(baseDate) + 7) % 7);
      timeMode.value = 'manual';
      catalogSlot = id;
      const coordinates = location.value ? selectedCoordinates() : [];
      if (coordinates.length && coordinates.every(Number.isFinite)) {
        const { sunrise, sunset } = solarTimes(date.value, ...coordinates);
        const preview = Math.min(sunrise + (id - 1) * slotMinutes, sunset - 1 / 60);
        time.value = new Date(Math.round(preview * 60) * 1000).toISOString().slice(11, 19);
      }
      updateResult();
      window.location.hash = 'calculator';
      showPage();
      byId('result').focus({ preventScroll: true });
      byId('calculator').scrollIntoView({ block: 'start' });
    });
    cards.append(card);
    visible += 1;
  });

  entries.replaceChildren(cards);
  byId('count').textContent = visible ? `${mm(visible)} ခု တွေ့ရှိသည်` : 'ကိုက်ညီတဲ့ နက္ခတ် မတွေ့ပါ။';
}

for (const day of catalogDays) {
  catalogDay.add(new Option(weekdays[day], day));
}
renderLocations(String(towns.findIndex(([, english]) => english === 'Yangon')));
form.addEventListener('input', (event) => {
  if (event.target === townSearch) renderLocations(location.value);
  catalogSlot = null;
  updateResult();
});
form.addEventListener('submit', (event) => event.preventDefault());
search.addEventListener('input', renderCatalog);
for (const button of effectButtons) {
  button.addEventListener('click', () => {
    effectFilter = button.dataset.effect;
    for (const item of effectButtons) item.setAttribute('aria-pressed', item === button);
    renderCatalog();
    byId('catalog').scrollIntoView({ block: 'start' });
  });
}
catalogDay.addEventListener('change', renderCatalog);
updateResult();
setInterval(() => {
  if (timeMode.value === 'live') updateResult();
}, 1000);

function showPage() {
  const page = window.location.hash === '#catalog' ? 'catalog' : 'calculator';
  byId('calculator').hidden = page !== 'calculator';
  byId('calculator-intro').hidden = page !== 'calculator';
  byId('catalog').hidden = page !== 'catalog';
  for (const link of document.querySelectorAll('[data-page]')) {
    if (link.dataset.page === page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

window.addEventListener('hashchange', showPage);
showPage();
