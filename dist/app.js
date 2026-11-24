import { myanmarMonth } from './myanmar-calendar.js';
import { akhaIntervals, akhaMonths, akhaRashis, akhaSourceReading, akhaTimeDivisions } from './akha.js';
import { dailyPanchang, karanaName, tithiName, yogaNames } from './panchang.js';
import { upagraha28At, guruNakshatraAt, natalAscendant, janmaAt, myanmarBirthInstant, solarNakshatraAt, solarNakshatraWindow, suriyaSlot } from './janma.js';
import { foodTitle, foodDescriptions } from './yatra-food.js';
import { catalogs, getRuler, myanmarUtcOffset, nadikaPractices, solarTimes, toMinutes, windowsFor } from './nadika.js';
import { yatra6Title, yatra6Descriptions } from './yatra6.js';
import { tripatakiPlanetNames, tripatakiSingleReadings, tripatakiDoubleReadings, tripatakiTripleReadings, tripatakiChakraRoles, tripatakiCombinationReadings, ketuPatakiHouses, guruChakraHouses, ketuChakraGridHouses, tripatakiForAge, runningAgeAt } from './tripataki.js';
import { wishSelfDirections, wishBlessingDirections, wishDirectionForNakshatra } from './wish-direction.js';

const byId = (id) => document.getElementById(id);
const effectText = (name, effect) => {
  const practice = nadikaPractices.get(name);
  return practice ? effect + '\n\n' + practice : effect;
};
const weekdays = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
const planetName = (number) => weekdays[number - 1] + 'ဂြိုဟ်';
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
const slotMode = byId('slot-mode');
slotMode.value = localStorage.getItem('nadika-slot-mode') === 'fixed' ? 'fixed' : 'equal';
const catalogSlotMode = byId('catalog-slot-mode');
catalogSlotMode.value = slotMode.value;
catalogSlotMode.addEventListener('input', () => {
  slotMode.value = catalogSlotMode.value;
  slotMode.dispatchEvent(new Event('input', { bubbles: true }));
});
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

const savedChartTypes = {
  calculator: ['နာဒီကာ', 'inputs'],
  suriya: ['သူရိယစက်', 'janma-form'],
  guru: ['ဂုရုစက်', 'janma-form'],
  upagraha: ['ဥပဂြဟ (၂၇) လုံးမူ', 'upagraha-form'],
  upagraha28: ['ဥပဂြဟ (၂၈) လုံးမူ', 'upagraha-form'],
  tripataki: ['တြိပတာကီစက်', 'tripataki-form'],
  akha: ['အခါပဒေသာ', 'akha-form'],
  panchang: ['Panchang', 'panchang-form'],
};
const savedChartKey = 'nakshatra-saved-calculations-v1';
let restoringChart = false;
let savedChartError = '';

function readSavedCharts() {
  try {
    const records = JSON.parse(localStorage.getItem(savedChartKey) ?? '[]');
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function saveChart(type, extra = {}) {
  if (restoringChart) return;
  const [, formId] = savedChartTypes[type];
  const fields = [...byId(formId).elements]
    .filter(field => field.id && ['INPUT', 'SELECT'].includes(field.tagName) && field.type !== 'search')
    .map(field => [field.id, field.id === formId + '-name' ? field.value.trim() : field.value]);
  const record = {type, fields, extra};
  try {
    const records = readSavedCharts();
    if (records.some(saved => JSON.stringify(saved) === JSON.stringify(record))) return;
    localStorage.setItem(savedChartKey, JSON.stringify([record, ...records]));
    savedChartError = '';
  } catch {
    savedChartError = 'ဘရောက်ဇာသိုလှောင်မှုတွင် ဇာတာ ထပ်သိမ်း၍ မရပါ။';
  }
}

function openSavedChart(record) {
  const [, formId] = savedChartTypes[record.type];
  restoringChart = true;
  try {
    window.history.pushState(null, '', '#' + record.type);
    showPage();
    const chartForm = byId(formId);
    byId(formId + '-name').value = '';
    for (const search of chartForm.querySelectorAll('input[type="search"]')) {
      if (search === townSearch) continue;
      search.value = '';
      search.dispatchEvent(new Event('input'));
    }
    if (record.type === 'calculator') {
      townSearch.value = '';
      renderLocations('');
    }
    for (const [id, value] of record.fields) {
      const field = byId(id);
      if (field?.form === chartForm) field.value = value;
    }
    if (record.type === 'calculator') {
      timeMode.value = 'manual';
      catalogSlot = record.extra.slot ?? null;
      lastUpdate = '';
      updateResult();
      byId('result').focus();
      return;
    }
    if (formId === 'upagraha-form') {
      upaTransitInstant = record.extra.transit ? new Date(record.extra.transit) : undefined;
      byId('upa-transit-time').value = record.extra.transit ? myanmarDateTimeValue(upaTransitInstant) : '';
    }
    chartForm.requestSubmit();
    if (formId === 'janma-form' && record.extra.transit && birthStarIndex !== undefined) {
      const instant = new Date(record.extra.transit);
      byId('goza-custom-time').value = myanmarDateTimeValue(instant);
      updateGoza(instant);
    }
  } finally {
    restoringChart = false;
  }
}

function myanmarDateTimeValue(instant) {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Yangon', dateStyle: 'short', timeStyle: 'medium',
  });
  return formatter.format(instant).replace(' ', 'T');
}

function renderSavedCharts() {
  const list = byId('saved-chart-list');
  list.replaceChildren();
  const records = readSavedCharts();
  byId('saved-chart-status').textContent = savedChartError ||
    (records.length ? '' : 'သိမ်းထားသော တွက်ချက်မှု မရှိသေးပါ။');
  for (const [type, [label, formId]] of Object.entries(savedChartTypes)) {
    const group = records.filter(record => record.type === type);
    if (!group.length) continue;
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = label + ' · ' + mm(group.length);
    section.append(heading);
    for (const record of group) {
      const fields = Object.fromEntries(record.fields);
      const date = fields.date || fields['akha-date'] || fields['panchang-date'] ||
        ['janma', 'upa', 'tri'].map(prefix => ['day', 'month', 'year'].map(part => fields[prefix + '-' + part]).join('/')).find(value => value && value !== '//');
      const birthPrefix = type === 'suriya' || type === 'guru' ? 'janma' : type === 'tripataki' ? 'tri' : 'upa';
      const birthTime = fields[birthPrefix + '-hour']
        ? ['hour', 'minute', 'second'].map(part => fields[birthPrefix + '-' + part]).join(':') + ' ' + fields[birthPrefix + '-period'] : '';
      const city = fields.location ?? fields['panchang-city'] ?? fields['akha-city'] ?? fields[birthPrefix + '-city'];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'home-choice';
      button.textContent = [fields[formId + '-name'], mm(date ?? ''), mm(fields.time || birthTime), city === 'custom'
        ? fields.latitude + '°, ' + fields.longitude + '°' : towns[Number(city)]?.[0],
        record.extra.transit ? 'ကောဇာ ' + mm(myanmarDateTimeValue(new Date(record.extra.transit)).replace('T', ' ')) : ''].filter(Boolean).join(' · ');
      button.addEventListener('click', () => openSavedChart(record));
      section.append(button);
    }
    list.append(section);
  }
}

function updateResult() {
  const fixed = slotMode.value === 'fixed';
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

  const content = byId('result-content');
  const nameLink = byId('result-name');
  const status = byId('result-note');
  if (!form.checkValidity() || !Number.isFinite(weekdayFor(date.value))) {
    lastUpdate = '';
    content.hidden = true;
    status.hidden = false;
    for (const id of ['sunrise', 'sunset', 'next-rise']) byId(id).value = '—';
    byId('next-field').hidden = true;
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
  const windows = windowsFor(anchor, limit, slotMode.value);
  const slot = catalogSlot === null
    ? windows.find(({ start, end }) => clockMinute >= start && clockMinute < end)
    : windows[catalogSlot - 1];
  const signature = [slotMode.value, live, date.value, lat, lon, night, slot?.number, catalogSlot].join('|');
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
  content.hidden = true;
  status.hidden = false;
  if (!slot || slot.start >= limit) {
    status.textContent = fixed ? 'ဒီအချိန်မှာ ၂၄ မိနစ်စီ စနစ်ရဲ့ အပိုင်း ၃၀ အတွင်း မကျပါ။' : 'နာဒီကာအကွက် မရှိပါ။';
    return;
  }

  const [name, effect, type] = catalogs[weekday][slot.number - 1];
  const route = `#nakshatra/${weekday}/${slot.number}/calculator`;
  const dateOffset = beforeSunrise ? dayMinutes : 0;
  byId('result-label').textContent = `${weekdays[weekday]} · ${night ? 'ညပိုင်း' : 'နေ့ပိုင်း'} · အမှတ် ${mm(slot.number + (night ? 30 : 0))}`;
  byId('result-time').textContent = `${timeLabel(slot.start - dateOffset)} – ${timeLabel(slot.end - dateOffset)}`;
  const seconds = Math.round((slot.end - slot.start) * 60);
  const modeLabel = fixed ? '၂၄ မိနစ်စီ စနစ်' : 'နေ့/ည အညီအမျှ ၃၀ ပိုင်းစီ';
  byId('result-duration').textContent = `${modeLabel} · ဒီအပိုင်းကြာချိန် ${mm(Math.floor(seconds / 60))} မိနစ် ${mm(seconds % 60)} စက္ကန့်`;
  byId('result-effect').textContent = effectText(name, effect);
  const ruler = getRuler(weekday, slot.number, night ? 'night' : 'day');
  byId('result-ruler').textContent = `စိုးမိုးဂြိုဟ် - ${planetName(ruler)}`;
  tag(byId('result-tag'), type);
  nameLink.textContent = name;
  nameLink.href = route;
  let nextSlot = windows[slot.number];
  let nextWeekday = weekday;
  let nextNight = night;
  if (!nextSlot || nextSlot.start >= limit) {
    nextWeekday = night ? (weekday + 1) % 7 : weekday;
    nextNight = !night;
    const nextLimit = night
      ? dayMinutes + solarTimes(offsetDate(cycleDate, 1), lat, lon).sunset
      : dayMinutes + solarTimes(offsetDate(cycleDate, 1), lat, lon).sunrise;
    [nextSlot] = windowsFor(limit, nextLimit, slotMode.value);
  }
  const [nextName, nextEffect, nextType] = catalogs[nextWeekday][nextSlot.number - 1];
  const nextLink = byId('result-next-name');
  nextLink.textContent = nextName;
  nextLink.href = `#nakshatra/${nextWeekday}/${nextSlot.number}/calculator`;
  byId('result-next-time').textContent =
    `${timeLabel(nextSlot.start - dateOffset)} – ${timeLabel(nextSlot.end - dateOffset)}`;
  byId('result-next-effect').textContent = effectText(nextName, nextEffect);
  const nextRuler = getRuler(nextWeekday, nextSlot.number, nextNight ? 'night' : 'day');
  byId('result-next-ruler').textContent = `စိုးမိုးဂြိုဟ် - ${planetName(nextRuler)}`;
  tag(byId('result-next-tag'), nextType);
  content.hidden = false;
  status.hidden = true;
  if (window.location.hash === '#calculator') saveChart('calculator', {slot: catalogSlot});
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
    const reading = effectText(name, effect);
    if (query && !`${id} ${name} ${reading}`.normalize().includes(query)) return;

    const card = byId('entry-template').content.cloneNode(true);
    card.querySelector('.badge').textContent = mm(id);
    const detailLink = document.createElement('a');
    detailLink.className = 'nakshatra-link';
    detailLink.href = `#nakshatra/${weekday}/${id}/catalog`;
    detailLink.textContent = name;
    card.querySelector('h3').append(detailLink);
    tag(card.querySelector('.pill'), type);
    card.querySelector('.effect').textContent = reading;
    card.querySelector('small').textContent = `စိုးမိုးဂြိုဟ် - နေ့ ${planetName(getRuler(weekday, id, 'day'))} / ည ${planetName(getRuler(weekday, id, 'night'))}`;
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
        const preview = Math.min(windowsFor(sunrise, sunset, slotMode.value)[id - 1].start, sunset - 1 / 60);
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
  if (event.target.id === 'inputs-name') return;
  if (event.target === slotMode) {
    catalogSlotMode.value = slotMode.value;
    localStorage.setItem('nadika-slot-mode', slotMode.value);
  }
  if (event.target === townSearch) renderLocations(location.value);
  catalogSlot = null;
  updateResult();
});
function refreshNamedNadikaResult() {
  if (window.location.hash !== '#calculator') return;
  lastUpdate = '';
  updateResult();
}
byId('inputs-name').addEventListener('change', refreshNamedNadikaResult);
form.addEventListener('submit', event => {
  event.preventDefault();
  refreshNamedNadikaResult();
});
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
setInterval(() => {
  if (timeMode.value === 'live') updateResult();
  if (window.location.hash === '#akha-result') highlightCurrentAkhaSlots();
}, 1000);

// Chapter 31 begins with catalog slot 13 and wraps after slot 27.
const yatraDescriptions = [
  "မရိုးပန်း လှူရပါတယ်။ မိမိတို့ရဲ့ ဇာတိ/ မိမိတို့ နေထိုင်ရာ ဒေသက နယ်တော်ရှင်၊ မြို့တော်ရှင်စသော နတ်နန်းတွေမှာ လှူတာလဲ ရပါတယ်။ နတ်နန်းတွေမှာ လှူရင် အရပ်လေးမျက်နှာက နတ်နန်းလေးခုမှာ လှူပြီး လိုရာဆု တစ်ခုပဲတောင်းရင် အင်မတန် စွမ်းပါတယ်။\nမရိုးပန်း မရနိုင်မှ အမွှေးတိုင် အကောင်းစားနဲ့ သက်သတ်လွတ် အသီးအနှံများကို အပေါ်မှာ ရေးပြခဲ့တဲ့ စနစ်အတိုင်း အသုံးပြုပြီး ပူဇော်ပါ။\nဘုရား လှူတာ/ နတ် လှူတာဆိုတာတွေကို အခြေအနေ၊ အချိန်အခါပေါ် မူတည်ပြီး ဉာဏ်နဲ့ယှဉ် ရွေးပါ။",
  "နှမ်း လှူရပါတယ်။ ပျားရည် လှူရပါတယ်။\nဆန် လှူရပါတယ်။",
  "ထောပတ် လှူရပါတယ်။",
  "ထောပတ် လှူရပါတယ်။",
  "နွားနို့ လှူရပါတယ်။",
  "နွားနို့ လှူရပါတယ်။ ထောပတ် လှူရပါတယ်။\nပျားရည် လှူရပါတယ်။",
  "နှမ်း လှူရပါတယ်။ ဆန် လှူရပါတယ်။\nနို့ထမင်း လှူရပါတယ်။ ထောပတ် လှူရပါတယ်။",
  "သပြေညွန့်၊ လင်းနေညွန့်များ ကပ်လှူ ပူဇော်ရပါတယ်။ ဒီလို ပူဇော်ရာမှာ အရှေ့ဘက်ကို ထိုးထွက်နေတဲ့ ကိုင်းကို ယူပြီး ပူဇော်နိုင်ရင် ပိုကောင်းပါတယ်။ အဲဒီလိုပဲ အရှေ့ဘက်ကို ထိုးထွက်နေတဲ့ ကိုင်းကနေ ရလာသော ပန်းများနဲ့ လဲ ပူဇော်နိုင်ပါတယ်။",
  "ထောပတ် လှူရပါတယ်။",
  "ထောပတ် လှူရပါတယ်။ နှမ်း လှူရပါတယ်။\nဆန် လှူရပါတယ်။",
  "ထောပတ် လှူရပါတယ်။",
  "ထောပတ် လှူရပါတယ်။",
  "ဒိန်ချဉ် လှူရပါတယ်။",
  "ထောပတ် လှူရပါတယ်။ ထမင်းလှူရပါတယ်။\nထောပတ်ထမင်း လှူရပါတယ်။",
  "ကုလားစပါးယို လှူရပါတယ်။",
  "နို့ထမင်း လှူရပါတယ်။",
  "ထောပတ် လှူရပါတယ်။",
  "ထောပတ် လှူရပါတယ်။",
  "အရှေ့ မြောက်ဘက်ကို ထိုးထွက်နေတဲ့ ကိုင်းကနေ ရလာသော ရနံ့မွှေးသော ပန်းများနဲ့ ပူဇော်နိုင်ပါတယ်။ ပန်းမရရင် သပြေညွန့် ယူနိုင်ပါတယ်။",
  "မုန့်ညက် လှူရပါတယ်။ မုန့်ညက်ဆိုတာ အစားအစာ လုပ်ဖို့အတွက် ဆန်/ ဂျုံ/ ပဲ စတာတွေကို ကြိတ်ထားတဲ့ အမှုန့်အားလုံးကို ဆိုလိုပါတယ်။ ဒီအမှုန့်တွေကို အာယုဗေဒ ဆေးပညာမှာ လူ့ခန္ဓာကိုယ်ကို တိုက်တဲ့ ဆပ်ပြာအဖြစ်လဲ တွင်တွင်ကျယ်ကျယ် သုံးပါတယ်။ အင်မတန် ကျယ်ပြန့်တဲ့ ပညာခွင် တစ်ခုပါ။ မုန့်လုပ်စားဖို့လဲ လှူနိုင်ပါတယ်။ မုန့်အဖြစ်လဲ ပြုလုပ် လှူဒါန်းနိုင်ပါတယ်။",
  "ဆေးဘက်ဝင်သော အရွက်ခြောက်မျိုး ဘာမဆို ဥပမာ - ကွမ်းရွက်ခြောက် လှူရပါတယ်။",
  "ဝါပွင့်/ ဝါညွန့် လှူနိုင်ပါတယ်။ ဝါချည်နဲ့ ပြုလုပ်ထားသော မည်သို့သော အဝတ်မျိုးမဆို လှူနိုင်ပါတယ်။\nဝါပင် စိုက်လှူနိုင်ပါတယ်။",
  "အရိပ်ရအပင်ကြီးမျိုး စိုက်လှူတာ အကောင်းဆုံး။ ဒီလို အပင်ကြီးက ထွက်သော အသီးများ လှူတာက ဒုတိယ အကောင်းဆုံးပါ။ ဥပမာ - မိန်သီးပေါ့။ နက္ခတ်နဲ့ အပင်တွေကို သီးခြား ရေးပေးထားပါတယ်။",
  "ရေစပ်နား ပေါက်သော အပင်များက ရလာတဲ့ အညွန့်၊ အပွင့် ဘာမဆို လှူနိုင်ပါတယ်။",
  "စွယ်တော်ပန်း၊ စွယ်တော်ညွန့်များ လှူရပါတယ်။\nစွယ်တော်ပင် စိုက်လှူနိုင်ပါတယ်။",
  "မုန့်ညက် လှူရပါတယ်။ ကျန်တာက ပြုဗ္ဗာသဠ်နက္ခတ်မှာ ရေးခဲ့တာနဲ့ အတူတူပါပဲ။",
  "သစ်သီး လှူရပါတယ်။ သစ်သီး လှူရာမှာ ၁၀၈ လုံး လှူတာ အကောင်းဆုံးပါ။\nလိုအပ်ရင် ထမင်းဆုပ်များ ခေါစာ ပစ်ရပါတယ်။"
];
const yatraNames = [...catalogs[0].slice(12, 27), ...catalogs[0].slice(0, 12)].map(([name]) => name);
const yatra2Descriptions = [
  "ဆေးလှူခြင်း၊ ခွေးကို အစာကျွေးခြင်း၊ အဖြူရောင်နှမ်းလှူခြင်း။ အဝတ် အထည် လှူခြင်း၊ ထမင်းဟင်းများလှူခြင်း၊ ငှက်ပျောသီး လှူခြင်း (ရခိုင်ငှက်ပျောသီး ပိုကောင်း)။ ဖလာ လှူခြင်း။",
  "အဆင်တန်ဆာ ပစ္စည်းများ လှူခြင်း၊ အလှပြင်သော ပစ္စည်းများလှူခြင်း၊ အဖြူရောင်အဝတ်အစားများ လှူခြင်း အထူးကောင်းတယ်။",
  "မီးပူဇော်ခြင်း အထူး ကောင်းတယ်။ ရဟန်းတွေကို မုတ်ဆိတ်ရိတ်ဓား၊ ဂျုတ် ဆိုတာတွေ လှူတာ အလွန် ကောင်းတယ်။ ထမင်းချက်ရာမှာ သုံးတဲ့ အိုးခွက် ပန်းကန်များ လှူခြင်း အထူး ကောင်းတယ်။ ရွှေလှူခြင်း၊ အလင်းရောင်လှူခြင်း အလွန် ကောင်းတယ်။",
  "အမျိုးသမီးများကို အလှပြင်ခြင်းနဲ့ သက်ဆိုင်သော ပစ္စည်းများ လှူခြင်း၊ ဇိမ်ခံပစ္စည်းများ လှူခြင်း၊ နွားနို့ လှူခြင်း။ ငွေထည် ပစ္စည်းများ လှူခြင်း။",
  "ပထမ (၂) ပတ်မှာ ထောပတ် ဒါမှမဟုတ် ခါးအောက်ပိုင်း အဝတ်အစားများ လှူခြင်း။\nဒုတိယ (၂) ပတ်မှာ အနီရောင်ရှိသော ဘယ်ပစ္စည်းကိုမဆို လှူခြင်း။\nဒီနက္ခတ်အတွက် နံ့သာနီ၊ နံ့သာဖြူလှူခြင်း အထူး ကောင်းတယ်။ နို့ထမင်းလှူခြင်း အထူး ကောင်းတယ်။",
  "ဒီနက္ခတ် နာနေတယ်ဆိုရင် - ဒီနက္ခတ် စန်းယှဉ်တဲ့ နေ့တိုင်း သက်သတ်လွတ်သာ စားသင့်တယ်။ တိရစ္ဆာန်များကို အစာ ကျွေးသင့်တယ်။ ဒီနက္ခတ်မှာ ခွေးစာကျွေးတာဟာ အကျိုးပေး အလွန်ကောင်းပါတယ်။ ခွေးစာ မကျွေးနိုင်ရင် ခွေးဂေဟာတွေမှာ ငွေလှူတာ ကောင်းပါတယ်။ အခိုက်၊ အညှိ၊ ဘေး၊ ဒဏ်ဟူသမျှ ပြေပျောက်စေပါတယ်။ မျက်ရည်ပေါက်ကြီးငယ်ကျရတဲ့ အဖြစ်တွေက ဝေးစေပါတယ်။ အဝါရောင်ရှိသော အမွှေးနံ့သာ (အလွယ်ကူဆုံးမှာ သနပ်ခါး) လှူခြင်း အထူးကောင်းတယ်။",
  "အစိမ်းရောင်ရှိသော ပစ္စည်းများ လှူဒါန်းခြင်း။\nအစာရေစာ ဝလင်အောင် ကျွေးမွေးခြင်း။\nပဲစင်းငုံ ဟင်းချက်၍လှူခြင်း။\nနှမ်းဖြင့်ပြုလုပ်ထားသော စားသောက်ဖွယ် ရာများ လှူခြင်း။\nသဘာဝမှဖြစ်သော အမွှေးနံ့သာများ လှူခြင်း။\nဟိန္ဒူတွေမှာ မယ်တော်တွေကို အစိမ်းရောင် ဆာရီ လှူတာ အလွန်ကောင်းပါတယ်။",
  "သာသနဌာနများတွင် သစ်ပင်စိုက်ပျိုး၍ လှူဒါန်းခြင်း၊ အဲဒီမှာမှ အပွင့် ဦးစားပေး အပင်များ ပို၍ သင့်တော်သည်။\nဖုံးမသိမ် (ပရုပ်ပြား) မီးရှို့၍ ပူဇော်ခြင်း။\nအနီရောင်ရှိသော အဝတ်အစားများလှူခြင်း အထူးကောင်းသည်။",
  "နွားနို့လှူခြင်း\nနွားနို့ဖြင့် ချိုးတော်ရေ ဆက်ကပ်ခြင်း။\nကုံကုမံလှူခြင်း။\nနှမ်းဖြင့်ပြုလုပ်ထားသော စားသောက် ဖွယ်ရာများ လှူခြင်း။",
  "လွန်လေပြီးသော မိဘဘိုးဘွားများကို အမျှအတန်း ပေးဝေခြင်း။\nအေးသောရေ လှူခြင်း။\nထန်းလျက်နှင့် ကြံသကာ လှူခြင်း။",
  "ဆင်းရဲတဲ့ မိန်းကလေးငယ်တွေကို ကောင်းမွန်တဲ့ အဝတ်အစား၊ အလှပြင်ပစ္စည်း အစရှိတာတွေ လှူသင့်တယ်။\nကွမ်းရွက်ကို ဆေးအဖြစ် ကပ်လှူခြင်း။\nထမင်းဟင်းများ လှူနိုင်တယ်။",
  "ဂျုံနှင့် ပြုလုပ်ထားသော စားသောက်ဖွယ်ရာများ လှူခြင်း\nပုလဲ လှူခြင်း။\nမီးရှို့၍ ပူဇော်ရသော အမွှေးနံ့သာများ (ဥပမာ - အမွှေးတိုင်)လှူခြင်း။",
  "အစိမ်းရောင်ရှိသော ပစ္စည်းများ လှူခြင်း။\nထမင်းဟင်းလှူခြင်း။",
  "ရောင်စုံရှိသောပန်းများ လှူခြင်း။\nဘုရားဖူးခရီး/ ပျော်ပွဲစားခရီးများ စီစဉ်ပေးခြင်း။\nအဝါရောင် အဝတ်အစားလှူခြင်း။\nစာရေးကိရိယာ လှူခြင်း။\nဆက်သွယ်ရေးဆိုင်ရာ ဒါနတွေ ပြုတာ သိပ်ကောင်းပါတယ်။ ဥပမာ - ဖုန်းဘီလ်ဖြည့်ပေးတာမျိုး၊ ဟန်းဆက်လှူတာမျိုးတွေပေါ့လေ။",
  "ဂျုံနဲ့သကြားကို ရေနယ်ပြီး ပိုးပုရွက်စာအဖြစ် ကျွေးသင့်တယ်။ အင်မတန် ကံနိမ့်နေလို့ပါ ဆိုရင်တော့ နှမ်းနဲ့ သကြားကို ရေနယ်ပြီး အပင်ကြီးကြီးတွေရဲ့ ခြေရင်းမှာ ပက်ဖျန်း/ စုပုံထားပြီး ပိုးပုရွက်စာအဖြစ် ကျွေးသင့်ပါတယ်။ ထိုင်ခုံ လှူခြင်း အထူး ကောင်းပါတယ်။",
  "အဖြူရောင်ရှိသော ပန်းများ လှူသင့်တယ်။ အဝါရောင်ရှိသော ငှက်ပျောသီးများ (ဥပမာ - ဖီးကြမ်း/ ရခိုင်)လှူသင့်သည်။ ကြေးထည်ပစ္စည်းတွေ လှူတာ သိပ်ကောင်းပါတယ်။",
  "ဆီလှူခြင်း။\nကြာပွင့်လှူခြင်း။\nဟိန္ဒူများအဖို့ ဟသ်ပြဒါး လှူခြင်း။\nထီးလှူခြင်း။\nအိပ်ယာလှူခြင်း။",
  "မည်သည့် အကြီးအသေးကိုမဆို အစိမ်းရောင်ရှိသော ပစ္စည်းများ လှူခြင်း။\nဖိနပ်လှူခြင်း။",
  "အမွှေးနံ့သာများ လှူဒါန်းခြင်း (မိမိအိမ်တွင် လှူခြင်း) အလွန် ကောင်းပါတယ်။\nသံနှင့်ပြုလုပ်ထားသော ပစ္စည်းများ လှူခြင်း။\nပုလဲဖြင့်ပြုလုပ်ထားသော အဆင်တန်ဆာများ လှူခြင်း။",
  "ဥစ္စာလုံးမွှေးရှင်တော်လှူခြင်း။\nအမျိုးသမီးများအား အလှပြင်ပစ္စည်းလှူခြင်း။\nဟိန္ဒူများတွင် မိမိတို့ ကိုးကွယ်ရာ မယ်တော်များအား အလှပြင်ပစ္စည်းလှူခြင်း။\nခြုံထည်/ စောင်လှူခြင်း။\nနတ်များကို ဥသျှစ်ပင်လှူခြင်း။",
  "ချိုသော စားသောက်ဖွယ်ရာများ လှူခြင်း။\nရတနာ ပစ္စည်း များလှူခြင်း။",
  "နေ့ခင်းပိုင်းတွင် ညောင်ပင်၌ဆီမီးထွန်းညှိပူဇော်ခြင်း။ အဲဒီမှာ - ညနေစောင်းများ၊ ညပိုင်းများမှာ လုံးဝ မပူဇော်ရပါဘူး။ အလွန်နိမ့်ပါတယ်တဲ့။ ဘာကြောင့်လဲ ကျွန်တော်မသိပါဘူး။\nထမင်း ဟင်းလှူခြင်း။ ထိုင်ခုံလှူခြင်း။",
  "ပဲနီလေးလှူခြင်း။\nဆင်းရဲသားများအား အနက်ရောင် ဖိနပ်လှူခြင်း။\nထန်းလျက် (သို့မဟုတ်) ကြံသကာများ ပိုးပုရွက် စာအဖြစ် ကျွေးခြင်း။\nရွှေလှူခြင်း။\nငွေထည်ပစ္စည်းများလှူခြင်း။",
  "ပိုးပုရွက်များအား သကြားကျွေးခြင်း။\nသကြားလှူခြင်း။\nနေရာလှူခြင်း။ နေရာမှာ အမှီအခိုသဘော/ အမိုးအကာသဘော ပါအောင်ထည့်ပြီး လှူနိုင်ရင် ပိုကောင်းပါတယ်။\nတကယ်လို့ ဒီနက္ခတ်နဲ့ စန်းယှဉ်ပြီး မွေးတဲ့သူဟာ ကျန်းမာရေးညံ့ဖျင်းနေရင် လူပေါင်းများစွာကို နို့နဲ့ နို့ထွက်ပစ္စည်း လှူဒါန်းကျွေးမွေးတာ အလွန်ကောင်းပါတယ်။",
  "ရွှေလှူခြင်း။\nသံနှင့်ပြုလုပ်ထားသော ပစ္စည်းများ လှူဒါန်းခြင်း။\nမိမိနှစ်သက်ရာ ပစ္စည်းများ လှူခြင်း။\nအဝါရောင်ရှိသော ချိုသည့်အစားအသောက်များ လှူဒါန်းခြင်း။ အထူးသဖြင့် မိမိ၏ ဆရာကို လှူနိုင်လျှင် ပို၍ကောင်းသည်။",
  "မှည့်သော ငှက်ပျောသီး (၂) လုံးကို ပန်းကန်ပြားတစ်ချပ်တွင်ထည့်၍ ပျားရည်ဆမ်းပြီး ဘုရားကပ်လှူပါ။ အိမ်ထောင်သည် စုံတွဲများကို ထမင်းဖိတ် ကျွေးခြင်း အထူး ကောင်းသည်။ ယာဉ်ဒါနပြုခြင်း ကောင်းသည်။",
  "အစိမ်းရောင်ရှိသော ပစ္စည်းများ၊ ချိုသော အရသာရှိသည့် စားသောက် ဖွယ်ရာများ လှူဒါန်းခြင်း အထူးကောင်းသည်။ မိမိလှူနိုင်သော မည်သည့် အရာကိုမဆို လှူခြင်း ကောင်းသည်။ ထိုသို့လှူရာတွင် ပမာဏများပြားစွာ လှူသင့်သည်။"
];

const yatra3Descriptions = [
  "အဖြူရောင် အဝတ် လှူခြင်း သို့မဟုတ် ရွှေလှူခြင်း။",
  "သံထည်ပစ္စည်း လှူခြင်း သို့မဟုတ် အနက်ရောင် အဝတ် လှူခြင်း။",
  "အဖြူရောင် အဝတ် လှူခြင်း သို့မဟုတ် ရွှေလှူခြင်း။",
  "ငွေထည်ပစ္စည်း လှူခြင်း သို့မဟုတ် အနက်ရောင်အဝတ် လှူခြင်း။",
  "အဖြူရောင် အဝတ် လှူခြင်း သို့မဟုတ် သားမွေးထည် လှူခြင်း။",
  "အဖြူရောင် အဝတ် လှူခြင်း သို့မဟုတ် သားမွေးထည် လှူခြင်း။",
  "အနီရောင် သို့မဟုတ် အဝါရောင် ရှိသော အဝတ်များ လှူခြင်း။",
  "အဝါရောင် အဝတ် လှူခြင်း သို့မဟုတ် ရွှေလှူခြင်း။",
  "သံထည်ပစ္စည်း လှူခြင်း သို့မဟုတ် အနက်ရောင် အဝတ်လှူခြင်း။",
  "အဝတ် လှူခြင်း သို့မဟုတ် အစာရေစာ လှူခြင်း။",
  "ချိုသော အရသာရှိသည့် စားသောက်ဖွယ်များ လှူခြင်း။",
  "အနက်ရောင် ရှိသော အဝတ်များ လှူခြင်း။",
  "အနီရောင် ရှိသော အဝတ်များ လှူခြင်း သို့မဟုတ် အနက်ရောင် အခွံရှိသော အသီးများ လှူခြင်း။ ဥပမာ-ထောပတ်သီးတို့၊ ကြက်မောက်သီး တို့ပေါ့လေ။",
  "မည်သည့် အဝတ်ကိုမဆို ပန်းနှင့် ဖုံးလွှမ်းပြီး လှူခြင်း။",
  "အဖြူရောင် အဝတ် လှူခြင်း။",
  "အစာရေစာ လှူခြင်း။",
  "အစာရေစာ လှူခြင်း။",
  "အစာရေစာ လှူခြင်း / ရွှေလှူခြင်း။",
  "အစာရေစာ လှူခြင်း/ ရွှေလှူခြင်း / အထည်လှူခြင်း။",
  "ရွှေလှူခြင်း။",
  "အစာရေစာ လှူခြင်း / ရွှေလှူခြင်း / အထည် လှူခြင်း။",
  "ငွေထည် လှူခြင်း / ရွှေလှူခြင်း / အထည် လှူခြင်း။",
  "အဖြူရောင် ရှိသော အဝတ်များ လှူခြင်း။",
  "ကြမ်းခင်း / ကော်ဇောကဲ့သို့ အသုံးပြုသော အခင်းများ လှူခြင်း။",
  "အနက်ရောင် သားမွေး လှူခြင်း။",
  "အနက်ရောင် ရှိသော ကြမ်းခင်း / ကော်ဇောကဲ့သို့ အသုံးပြုသော အခင်းများလှူခြင်း။",
  "အဖြူရောင် အဝတ်များ လှူခြင်း။"
];

const yatra4Descriptions = [
  "(က) ဆေးလှူရတယ်။ အကျိုးကျေးဇူး ကျမ်းမှာ ပြမထား။\n(ခ) ယာဉ်ဒါန ပြုလုပ်ရတယ်။ တစ်မိသားစုလုံး ချမ်းသာကြွယ်ဝတယ်။ ဩဇာအာဏာ ကြီးမားတယ်။\n(ဂ) ကြေးခွက်မှာ ထောပတ်အပြည့်ထည့်ပြီး လှူရတယ်။ ရောဂါကင်းစေတယ်။",
  "(က) အပြာရောင်ပန်း လှူရတယ် ဒါမှမဟုတ် ပရုပ်ပြား မီးထွန်းပြီး ပူဇော်ရတယ်။ အကာလမရဏဘေးက ကင်းစေတယ်။\n(ခ) နှမ်းလှူရတယ်။ စည်းစိမ်ဥစ္စာ ချမ်းသာကြွယ်ဝစေတယ်။ နာမည်ဂုဏ်သတင်းကောင်း ထင်ပေါ် ကျော်ကြားစေတယ်။ ကောင်းမွန်သော အသိုင်းအဝိုင်းအတွင်းကို ရောက်စေတယ်။ အရေးကြီးသော/ ခက်ခဲသော အလုပ်တွေကို အလွယ်တကူ ပြီးမြောက် အောင်မြင်စေတယ်။",
  "(က) အနီရောင်ပန်း လှူရတယ်။ အနီရောင်ပန်းကုံးချိတ်ဆွဲပြီး လှူရင် ပိုကောင်းတယ် (ဒါမှမဟုတ်) မီးပူဇော်ရမယ်။ အကျိုးကျေးဇူးက အကုသိုလ် အကျိုးပေး ကင်းစေတယ်။ စိတ်ကြည်လင် အေးချမ်းစေတယ်။ အလိုဆန္ဒ ပြည့်ဝစေတယ်။\n(ခ) နို့ထမင်း/ ထောပတ်/ ဒိန်ချဉ်/ နို့/ နို့ထွက်ပစ္စည်းတွေနဲ့ လုပ်ထားတဲ့ အစားအသောက်တွေ လှူဒါန်းကျွေးမွေးရတယ်။ လူများများ ကျွေးနိုင်ရင် ပိုကောင်းတယ်။ အကျိုးကျေးဇူးက ကျန်းမာရေးကို အထူးကောင်းစေတယ်။ ကောင်းမွန်သော အသိုင်းအဝိုင်းအတွင်းကို ရောက်စေတယ်။",
  "(က) ထောပတ်လှူခြင်း၊ ထောပတ်နှင့်ချက်သော ထမင်းဟင်းများကို ကျွေးမွေးခြင်း။ အကျိုးကျေးဇူးမှာ ကျန်းမာရေးအထူးကောင်း၍ အသက်ရှည် စေသည်။ လိုအင်ဆန္ဒ ပြည့်ဝစေသည်။ ကောင်းမွန်သော အသိုင်းအဝိုင်းအတွင်းကို ရောက်စေတယ်။",
  "(က) နွားနို့လှူရတယ်။ အကြွေးကင်းစေတယ်။ ကျန်းမာရေး ကောင်းစေတယ်။\n(ခ) ခွန်အားကိုဖြစ်စေသော ဖျော်ရည်များ၊ အချိုရည်များ လှူဒါန်းရတယ်။ ပညာတိုးစေတယ်။ ကျန်းမာရေးကိုလဲ ကောင်းစေတယ်။",
  "(က) အနံ့မွှေးသော ဘယ်ပန်းမဆို လှူဒါန်းနိုင်တယ်။ အထူးသဖြင့် ကြာပွင့်လှူတာ ပိုကောင်းတယ်။ အောင်မြင်ခြင်း အထွေထွေကို ရရှိစေပါတယ်။\n(ခ) ပဲထမင်းလှူခြင်း၊ နှမ်းလှူခြင်း အထူးကောင်းတယ်။ အခက်အခဲအားလုံးကနေ လွတ်မြောက်စေတယ်။",
  "ထောပတ်လှူခြင်း၊ ထောပတ်နှင့်ချက်သော ထမင်းဟင်းများကို ကျွေးမွေးခြင်း။ မိသားစု သာယာငြိမ်းချမ်းစေတယ်။ နာမည် ဂုဏ်သတင်းကောင်း ထင်ပေါ်ကျော်ကြားစေတယ်။ ချမ်းသာကြွယ်ဝ စေတယ်။ ပီယအားကောင်းစေတယ်။ သွားလေရာမှာ ကာကွယ်ကူညီ စောင့်ရှောက်မှုကို ရစေတယ်။",
  "(က) ပျားရည်လှူရတယ်။ ပညာရေး အထူးကောင်းစေတယ်။ စကားထစ်ခြင်း၊ စကားပြော မကောင်းခြင်းတွေကို ကင်းစင်ပျောက်စေတယ်။\n(ခ) ရွှေလှူရတယ်။ အပြစ်ကင်းစေတယ်။ အခက်အခဲတွေက လွတ်မြောက်စေတယ်။ ပီယအား ကောင်းစေတယ်။",
  "(က) ငွေထည်ပစ္စည်းများ လှူရတယ်။ ဘယ်လောက်ကြီးမားတဲ့ အခက်အခဲကနေမဆို လွယ်လင့်တကူ လွတ်မြောက်စေတယ်။ ဉာဏ်ပညာ ကြီးမားစေတယ်။ ရောဂါကင်းစေတယ်။\nမှတ်ချက်။ နဂါးနဲ့ အဆက်အစပ်ရှိသူတွေကို ဒီနက္ခတ်မှာ နဂါးစာကျွေးခိုင်းတဲ့အခါ အပေါ်မှာ ပြောခဲ့တဲ့ အကျိုးကျေးဇူးတွေ ရတာ တွေ့ရဖူးပါတယ်။",
  "မြေအိုးထဲမှာ နှမ်းအပြည့်ထည့်ပြီး လှူရပါတယ်။ သားသမီးရစေတယ်။ အထူးသဖြင့် သားရစေတယ်။ ချမ်းသာကြွယ်ဝစေတယ်။ ရောဂါကင်းစေတယ်။",
  "(က) ယာဉ်ဒါနပြုလုပ်ရတယ်။ ကောင်းမွန်သော အသိုင်းအဝိုင်းထဲကို ရောက်ရှိစေတယ်။\n(ခ) ဟိန္ဒူများမှာ သျှီဝလိင် လှူရတယ်။ စည်းစိမ်ဥစ္စာ ချမ်းသာကြွယ်ဝစေတယ်။ ကောင်းမွန်တဲ့ အိမ်ထောင်ဘက်ကို ရရှိစေတယ်။ အိမ်ထောင်ရေး သာယာစေတယ်။ ပီယအားကောင်းစေတယ်။",
  "ရွှေလှူခြင်း၊ ကြာပန်းကို ရွှေချ၍ လှူခြင်း၊ ရွှေကြာပန်းလှူခြင်း။\nအခက်အခဲများအားလုံးကို ပြေလည်စေတယ်။ ဘုန်းတန်ခိုး ဩဇာ အာဏာ အထူးကြီးမားစေတယ်။ အနာကင်းပြီး အသက်ရှည်စေတယ်။ ချမ်းသာကြွယ်ဝစေတယ်။ သွားလေရာမှာ အောင်မြင်စေတယ်။",
  "(က) ရနံ့မွှေးသောပန်း လှူရတယ်။ နံ့သာနီအမှုန့်ကို ရေနဲ့ ပျစ်ပျစ်ဖျော်ပြီး ကပ်လှူရတယ်။ အထူးချမ်းသာကြွယ်ဝစေတယ်။\n(ခ) ရွှေလှူရတယ်။ ယာဉ်ရထားတွေ ရရှိစေတယ်။ ဩဇာအာဏာ ကြီးမားစေတယ်။\n(ဂ) ပိုက်ဆံ လှူရသည်။ ရေလှူရသည်။ အကျိုးကျေးဇူးမှာ ရောဂါကင်းစေသည်။",
  "(က) ယာဉ်ဒါနပြုရတယ်။ အထူးသဖြင့် သူတစ်ပါးကို စီးပွားဥစ္စာဖြစ်ထွန်းစေဖို့ ကူညီပေးရတယ်။ မိမိကိုယ်တိုင် အလွန်ချမ်းသာ ကြွယ်ဝလာမယ်။\n(ခ) ကြေးခွက်/ ကြေးထည် လှူရတယ်။ ထောပတ်လှူရတယ်။ ကျက်သရေ မင်္ဂလာရှိစေတယ်။\nအထူးမှတ်ချက်-အပေါ်က အမှတ်စဉ် (က)နဲ့ (ခ) နှစ်မျိုးလုံးမှာ တူတဲ့ အကျိုးကျေးဇူးက- မိမိနဲ့ မိမိရဲ့ မိသားစု ပြီးတော့ မိမိရဲ့ လုပ်ငန်းခွင်မှာ ရန် လုံးဝ ကင်းစေတယ်။",
  "မိမိအနှစ်သက်ဆုံးသောအရာကို လှူရပါတယ်။ လှူတဲ့နေ့မှာ အဲဒီအရာကို မိမိကိုယ်တိုင် မသုံးဆောင်ပဲ ရှောင်နိုင်ရင် အာနိသင် ပိုကောင်းပါတယ်။ နာမည်ဂုဏ်သတင်းကောင်း အထူး ထင်ပေါ်ကျော်ကြားစေတယ်။ စိတ်ကို ငြိမ်းချမ်းစေတယ်။ ဉာဏ်ပညာ အထူးတိုးတက်စေတယ်။",
  "(က) ဆန်၊ ပဲ အစရှိသော အစေ့အဆံများ လှူရတယ် ဒါမှမဟုတ် အဝတ်အထည်နဲ့အတူ ပိုက်ဆံ လှူရတယ်။ အခက်အခဲ အားလုံးကနေ ကင်းလွတ်စေတယ်။\n(ခ) အနီရောင်ပန်း လှူဒါန်းရတယ်။ ချမ်းသာကြွယ်ဝစေတယ်။ ခန္ဓာကိုယ်အသားအရေ အရောင်အဆင်း တောက်ပစေတယ်။",
  "ခြုံထည်တွေ/ စောင်တွေ/ အဝတ်အစားတွေ လှူဒါန်းရတယ်။ ကျန်းမာပြီး အသက်ရှည်စေတယ်။ ကျက်သရေမင်္ဂလာရှိစွာနဲ့ ချမ်းသာကြွယ်ဝစေတယ်။\nအထူးမှတ်ချက်။ အဲလို လှူဒါန်းရာမှာ အသိုင်းအဝိုင်းတစ်ခုအထဲမှာ လူချစ်လူခင် အများဆုံး (ဒါမှမဟုတ်) လွှမ်းမိုးမှု အရှိဆုံး အမျိုးသမီးကို ရှာဖွေပြီး လှူဒါန်းနိုင်ရင် ပိုကောင်းပါတယ်။",
  "(က) မတူညီသော အသီးအနှံအမျိုးမျိုး စုပေါင်းပြီး လှူဒါန်းရတယ်။ ကောင်းမွန်သော အသိုင်းအဝိုင်းအတွင်းသို့ ရောက်ရှိစေတယ်။\n(ခ) အမြစ်မှဖြစ်သော မြေပဲ၊ ကန်စွန်းဥလို အရာများကို လှူဒါန်းရတယ်။ မိမိအလိုရှိသော အရာကို ရရှိစေတတ်တယ်။\nအထူးမှတ်ချက်။ အပေါ်က အလှူနှစ်မျိုးထဲက တစ်မျိုးမျိုး ဒါမှမဟုတ် နှစ်မျိုးလုံးကို အသိုင်းအဝိုင်းတစ်ခုထဲမှာ အာဏာရှိသော / အုပ်ချုပ်ရသော အမျိုးသားတစ်ဦးတစ်ယောက်ဆီကို ပေးပို့လှူဒါန်းနိုင်ရင် မိမိကိုယ်တိုင် ဩဇာအာဏာကြီးမားလာတာ၊ ချမ်းသာ ကြွယ်ဝလာတာကို ထင်ထင်ရှားရှား တွေ့ရပါတယ်။",
  "ဒါနတွေဟာ ဇေဋ္ဌနက္ခတ်နဲ့ တူတယ်။ အကျိုးပေးကတော့ မတူဘူး။ ခု ဒီမှာက အကျိုးပေးဟာ ကောင်းမွန်သော အသိုင်း အဝိုင်းအတွင်းကို ရောက်ရှိစေမယ်။ ကျန်းမာရေး အထူးကောင်းစေတယ်။ ဘဝဟောင်းက ကုသိုလ်တွေ အကျိုးပေးလာစေတယ်။",
  "မြေအိုးထဲမှာ ဒိန်ချဉ်အပြည့်ထည့်ပြီး လှူရတယ်။ သားသမီး၊ မြေးမြစ် များ ရရှိစေတယ်။ ချမ်းသာကြွယ်ဝစေတယ်။ မိသားစု သာယာငြိမ်းချမ်းစေတယ်။ အခက်အခဲများ ပြေလည်စေတယ်။",
  "(က) ထန်းလျက်၊ ကြံသကာ၊ ပျားရည်၊ ထောပတ် မိမိအဆင်ပြေရာ တစ်မျိုးမျိုးကို လှူဒါန်းနိုင်တယ်။ အလိုဆန္ဒများ ပြည့်စေတယ်။ ရောဂါကင်းစေတယ်။\n(ခ) ရနံ့မွှေးသော ပန်းများ လှူရတယ်။ ဆန္ဒ ပြည့်စေတယ်။",
  "(က) စာရေးကိရိယာများ အထူးသဖြင့် စာအုပ်များ/ ဓမ္မစာပေများ လှူဒါန်းရတယ်။ ယာဉ်ရထား ရရှိစေတယ်။ အချုပ်အနှောင် ကင်းစေတယ်။\n(ခ) အဖြူရောင်/ အဝါရောင်/ အပြာရောင်ရှိတဲ့ ပန်းတွေ လှူဒါန်းရတယ်။ အောင်မြင်ခြင်း အထွေထွေကို ရရှိစေတယ်။ ချမ်းသာကြွယ်ဝစေတယ်။",
  "(က) ရနံ့မွှေးသောပန်းများ လှူဒါန်းရတယ် ဒါမှမဟုတ် နံ့သာနီအမှုန့်ကို ရေနဲ့ ပျစ်ပျစ်ဖျော်ပြီး ကပ်လှူရတယ်။ ဘယ်လောက်ကြီးမားသော အခက်အခဲတွေဖြစ်စေ လွယ်လင့်တကူ လွတ်မြောက်စေတယ်။\n(ခ) လင်မယားစုံတွဲ တစ်တွဲကို ဧည့်ခံကျွေးမွေးတာ၊ လက်ဆောင်ပေးတာ ပြုလုပ်ရတယ်။ ရောဂါကင်းစေတယ်။ စည်းစိမ်ဥစ္စာ တိုးပွားစေတယ်။",
  "နံ့သာနီ၊ နံ့သာဖြူ အဆင်ပြေရာ လှူရတယ်။ ရောဂါကင်းစေတယ်။ အထူးအားဖြင့် အဆစ်အမြစ်ရောဂါတွေအတွက် အလွန်ကောင်းတယ်။ ချမ်းသာကြွယ်ဝစေတယ်။ ခွန်အား ကြီးမားစေတယ်။",
  "(က) ပဲစင်းငုံ လှူရတယ်။ အစာရေစာပေါများခြင်း၊ အခက် အခဲများ ပြေလည်ခြင်း၊ သုခ ချမ်းသာတိုးပွားခြင်းဆိုတဲ့ အကျိုးပေးတွေ ရှိတယ်။\n(ခ) သလင်းကျောက် လှူရတယ်။ အဲဒီကျောက်အနာအဆာကင်းရင် ပိုကောင်းတယ်။ ဘုန်းတန်ခိုး ဩဇာအာဏာ အထူးကြီးမားစေတယ်။ သွားလေရာ၊ လုပ်လေရာမှာ အောင်မြင်စေတယ်။",
  "လှပပြီး တန်ဖိုးရှိတဲ့ အဝတ်အထည်တွေ လှူဒါန်းရတယ်။ မိဘဘိုးဘွားတို့ရဲ့ ကောင်းမွန်သော အမွေတွေ ဆက်ခံရရှိစေတယ်။ အထူးငြိမ်းချမ်းစေတယ်။",
  "ကြေးခွက်/ ကြေးထည် လှူရတယ်။ ဆန္ဒပြည့်စေတယ်။ စိတ်ခွန်အား ကောင်းစေတယ်။ အောင်မြင်ခြင်း အထွေထွေ ရရှိစေတယ်။"
];

// Chapter 35, in the same nakshatra order as the other yatra lists.
const yatra5Descriptions = [
  ["မြောက်အရပ်", "အနီရောင်", "၁၄၅၉", "12345"],
  ["မြောက်အရပ်", "အဖြူရောင်။ အနီရောင်", "၄၆၇၉", "134"],
  ["မြောက်အရပ်", "အဖြူရောင်။ အနီရောင်", "၃၄၅၉", "356"],
  ["အရှေ့မြောက်", "အဖြူရောင်", "၁၂၃၄", "346"],
  ["တောင်အရပ်", "အနီရောင်", "၂၃၄၇", "146"],
  ["အရှေ့မြောက်ထောင့်။ အရှေ့", "မီးခိုးရောင်။ အညိုရောင်", "၄", "16"],
  ["အရှေ့အရပ်", "အဝါရောင်", "၂၃၇၉", "146"],
  ["မြောက်အရပ်", "အနက်ရောင်", "၁၃၄၈", "136"],
  ["တောင်အရပ်", "အစိမ်းရောင်", "၅", "1345"],
  ["အနောက်အရပ်", "အရောင်အသွေး စုံလင် စိုပြေသော", "", "034"],
  ["မြောက်အရပ်", "အဖြူရောင်", "၃၅၆၇", "356"],
  ["အရှေ့အရပ်", "အနီရောင်", "၁", "01345"],
  ["အရှေ့တောင်အရပ်", "အဖြူရောင်", "၁၃၅၇", "134"],
  ["တောင်အရပ်", "အနီရောင်", "၂၃၄၆", "236"],
  ["တောင်အရပ်", "မီးခိုးရောင်။ အညိုရောင်", "၃၅၇၉", "456"],
  ["တောင်အရပ်", "အဝါရောင်", "၃၄၆၇", "012"],
  ["အနောက်တောင်အရပ်", "အနက်ရောင်", "၃၇၈၉", "345"],
  ["အနောက်တောင်အရပ်", "အစိမ်းရောင်", "၂၃၄၅", "035"],
  ["အနောက်တောင်အရပ်", "အရောင်အသွေး စုံလင် စိုပြေသော", "၂၃၄၈", "136"],
  ["အနောက်တောင်အရပ်။ အနောက်အရပ်", "အဖြူရောင်", "၃၆၇၉", "046"],
  ["အနောက်", "အနီ", "၁၃၅၉", "023"],
  ["အနောက်အရပ်", "အဖြူရောင်", "၁၄၅၇", "134"],
  ["အနောက်မြောက်အရပ်", "အနီရောင်", "၁၂၃၄", "236"],
  ["အနောက်မြောက်အရပ်", "အညိုရောင်။ မီးခိုးရောင်", "၂၆၇၈", "035"],
  ["အနောက်မြောက်အရပ်", "အဝါရောင်", "၃၄၅၉", "046"],
  ["အနောက်မြောက်အရပ်", "အနက်ရောင်", "၂၄၇၉", "016"],
  ["မြောက်အရပ်", "အစိမ်းရောင်", "၂၅၇၉", "023"]].map(([direction, color, numbers, days]) => [
  `စွမ်းအင်ရှိရာ အရပ် - ${direction}။`,
  `စွမ်းအင်ရှိရာ အရောင် - ${color}။`,
  `စွမ်းအင်ရှိသော ဂဏန်း - ${numbers ? [...numbers].join(' - ') : 'ကျမ်းတွင် ပြမထား'}။`,
  `စွမ်းအင်ရှိသော နေ့ - ${[...days].map(day => weekdays[day]).join('၊ ')}။`,
].join('\n'));

// Chapter 39, in the same nakshatra order as the other yatra lists.
const yatra7Title = 'နက္ခတ်၏ ပြဒါးဓာတ်';
const yatra7Descriptions = [
  'ထောပတ်။',
  'နှမ်း။',
  'ပဲစင်းငုံ။',
  'ဒိန်ချဉ်။',
  'ထောပတ်။',
  'နွားနို့။',
  'သမင်။',
  'သမင်။',
  'နို့ထမင်း။',
  'ငှက်ခါး။',
  'သမင်။',
  'ယုန်။',
  'ဂျုံမှုန့်၊ ဆန်မှုန့်စသည်ဖြင့် ပြုလုပ်သော အစားအစာ။',
  'မြင်းခေါင်းနားယောင်အပင်။',
  'ဂျုံ။',
  'ဒေါင်း။',
  'သလဲသီး။',
  'လိပ်။',
  'ဖြူကောင်။',
  'ပုတ်သင်ညို။',
  'မြင်း။ ဥသျှစ်ပင်။ ဥသျှစ်ရွက်။',
  'ထမနဲ။',
  'ပဲနီလေး သို့မဟုတ် ပဲဝါလေးနှင့် ချက်ထားသော ထမင်း။',
  'ဂျုံမှုန့်။',
  'ငါးဟင်းနှင့် ထမင်း။',
  'ထမနဲ။',
  'ဒိန်ချဉ်ထမင်း။',
];

const yatra8Title = 'နက္ခတ်၏ ကျင့်စဉ်';
const yatra8Groups = [
  [[1, 8, 15], 'တရားထိုင်တာ၊ ဝင်လေ ထွက်လေနဲ့ ပတ်သက်သော ကျင့်စဉ်တွေ၊ ယောဂကျင့်တာ၊ ကျန်းမာရေး လေ့ကျင့်ခန်းတွေ လုပ်တာ အလွန် ကောင်းပါတယ်။'],
  [[2, 9, 16, 22], 'သီလစင်ကြယ်ခြင်းကို ကျင့်စဉ်အနေနဲ့ ကျင့်ရပါတယ်။'],
  [[3, 10, 17, 23], 'ပညာသင်ယူခြင်း၊ ပညာသင်ပေးခြင်းကို နှစ်သက်မြတ်နိုးပါတယ်။ ဒါကိုက ကျင့်စဉ်ပါ။ ဒီပညာဆိုရာမှာ ဘာသာ/သာသနာဆိုင်ရာ စာပေပညာတွေက ပိုကောင်းပါတယ်။ အဲဒီမှာမှ ကိုးကွယ်ရာ သာသနာဆိုင်ရာ ဘာမှမလုပ်နိုင်ရင်တောင် အဲလို လုပ်ဆောင်နေသူတွေကို နိုင်တဲ့ဘက်က ကူညီ၊ ထောက်ပံ့၊ လှူဒါန်းတာ ကောင်းတာပေါ့လေ။'],
  [[4, 11, 18, 24], 'မုဒိတာ ပွားခြင်းကို နှစ်သက်ပါတယ်။'],
  [[5, 12, 19, 25], 'မေတ္တာပွားများခြင်းကို နှစ်သက်ပါတယ်။'],
  [[6, 13, 20, 26], 'သည်းခံ ခွင့်လွှတ်ခြင်းဆိုတဲ့ ခန္တီကို နှစ်သက်ပါတယ်။'],
  [[7, 14, 21, 27], 'မာန်မာန မထား၊ နှိမ့်ချတတ်ခြင်းကို နှစ်သက်ပါတယ်။'],
];
const yatra8Descriptions = yatraNames.map((_, index) =>
  yatra8Groups.find(([numbers]) => numbers.includes(index + 1))[1]
);

function renderYatraCards(containerId, descriptions) {
  const yatraCards = document.createDocumentFragment();
  yatraNames.forEach((name, index) => {
    const card = document.createElement('article');
    card.className = 'entry';
    const heading = document.createElement('h3');
    heading.textContent = `${mm(index + 1)}။ ${name}နက္ခတ်`;
    const body = document.createElement('p');
    body.textContent = descriptions[index];
    card.append(heading, body);
    yatraCards.append(card);
  });
  byId(containerId).append(yatraCards);
}

renderYatraCards('yatra-entries', yatraDescriptions);
renderYatraCards('yatra2-entries', yatra2Descriptions);
renderYatraCards('yatra3-entries', yatra3Descriptions);
renderYatraCards('yatra4-entries', yatra4Descriptions);
renderYatraCards('yatra5-entries', yatra5Descriptions);
renderYatraCards('yatra6-entries', yatra6Descriptions);
renderYatraCards('yatra7-entries', yatra7Descriptions);
renderYatraCards('yatra-food-entries', foodDescriptions);
byId('yatra-food-title').textContent = foodTitle;
byId('yatra7-title').textContent = yatra7Title;
renderYatraCards('yatra8-entries', yatra8Descriptions);
byId('yatra8-title').textContent = yatra8Title;
byId('yatra6-title').textContent = yatra6Title;
const abhijit = document.createElement('article');
abhijit.className = 'entry';
abhijit.innerHTML = '<h3>အဘိဇိနက္ခတ်</h3><p>နို့ထမင်း လှူခြင်း။</p>';
byId('yatra3-entries').children[20].after(abhijit);
const yatra7Abhijit = abhijit.cloneNode(true);
yatra7Abhijit.querySelector('p').textContent = 'ထောပတ်ထမင်း။';
byId('yatra7-entries').children[20].after(yatra7Abhijit);

const yatra8Abhijit = abhijit.cloneNode(true);
yatra8Abhijit.querySelector('p').textContent = yatra8Groups[0][1];
byId('yatra8-entries').children[20].after(yatra8Abhijit);

updateResult();

function renderNakshatraDetail([name], source) {
  byId('nakshatra-back').href = '#' + source;
  byId('nakshatra-title').textContent = 'နက္ခတ် - ' + name;
  const list = byId('nakshatra-yatras');
  list.replaceChildren();
  const index = yatraNames.indexOf(name);
  if (index < 0) {
    list.textContent = 'ဒီနက္ခတ်အတွက် ကျမ်းပါ ယတြာ မရှိပါ။';
    return;
  }
  const wishDescriptions = yatraNames.map((_, idx) => `မိမိအတွက် ဆုတောင်းရန် — ${wishSelfDirections[idx]} မျက်နှာမူပါ။\nသူတစ်ပါးကို ဆုပေးရန် (မိမိအတွက်လည်း သုံးနိုင်) — ${wishBlessingDirections[idx]} မျက်နှာမူပါ။`);
  const descriptions = [wishDescriptions, yatraDescriptions, yatra2Descriptions, yatra3Descriptions, yatra4Descriptions, yatra5Descriptions, yatra6Descriptions, yatra7Descriptions, yatra8Descriptions, foodDescriptions];
  const titles = ["ဆုတောင်းပြည့် အရပ်မျက်နှာ (ကောဇာစန်းယှဉ် · အခန်း ၃၀)", "ဇောတိတတ္ထ နိဿရည်းကျမ်းမှ နက္ခတ်ယတြာ", "နက္ခတ်ညံ့လျှင် လုပ်ရသော ယတြာများ", "နက္ခတ် ညံ့လျှင် လုပ်ရသော ယတြာများ။ (မူကွဲ။)", "နက္ခတ်ကောင်းကျိုးရစေသော ယတြာများ", "နက္ခတ်၏ ထူးခြားသော စနစ်တစ်ခု", yatra6Title, yatra7Title, yatra8Title, foodTitle];
  titles.forEach((title, position) => {
    const heading = document.createElement('h4');
    heading.textContent = title;
    const body = document.createElement('p');
    body.textContent = descriptions[position][index];
    list.append(heading, body);
  });
}

const suriyaRegions = [
  ['ဦးခေါင်းပိုင်း', 3, [[120, 23]]],
  ['မျက်နှာ', 3, [[120, 43]]],
  ['ပခုံးနှစ်ဖက်', 2, [[89, 77], [151, 77]]],
  ['လက်မောင်းနှစ်ဖက်', 2, [[86, 108], [154, 108]]],
  ['လက်ဖျံနှစ်ဖက်', 2, [[79, 139], [161, 139]]],
  ['ရင်ဘတ်', 5, [[120, 89]]],
  ['ဝမ်းဗိုက်', 1, [[120, 132]]],
  ['အင်္ဂါစပ်', 1, [[120, 170]]],
  ['ခြေထောက်ပိုင်း', 6, [[100, 280], [140, 280]]],
  ['ခြေဖမိုးနှစ်ဖက်', 2, [[94, 341], [146, 341]]],
];
const suriyaReadings = [
  "ဦးခေါင်းမှာ ရှိရင် – ချမ်းသာကြွယ်ဝမယ်။",
  "မျက်နှာမှာ ရှိရင် – စားကောင်းသောက်ဖွယ်တွေ စားရမယ်။ စည်းစိမ်ရှိရှိ နေရမယ်။ မျက်နှာ ပွင့်မယ်။ ပြုံးပျော် ရွှင်လန်းနေမယ်။",
  "ပခုံးမှာ ရှိရင် – အလွန် သတ္တိရှိမယ်။ အလှူဒါန ရက်ရောမယ်။ လွတ်လပ်သော အတွေးအခေါ် အယူအဆ ရှိမယ်။ မိသားစုထဲမှာ/ ကျင်လည်ရာ အသိုင်းအဝိုင်းကြားမှာ နှစ်သက်မြတ်နိုးခြင်း ခံရမယ်။",
  "လက်မောင်းနှစ်ဖက်မှာ ရှိရင် – ဇာတိမြေကို စွန့်ခွာသွားလိမ့်မယ်။ ရေခြား မြေခြားမှာ အခြေချ နေထိုင်လိမ့်မယ်။ အဲလို နေထိုင်ပြီးရင် အဲဒီ နေရာဒေသမှာ အင်မတန် နာမည်ဂုဏ်သတင်း ထင်ရှားကျော်ကြားလိမ့်မယ်။ ဒေါသလဲ အလွန် ကြီးသလို သတ္တိလဲ အလွန်ကောင်းပါတယ်။ ဒီလူတွေဟာ ဇာတိမြေမှာ နေထိုင်တယ်ဆိုရင် စွန့်ခွာသင့်ချိန်ကို ဉာဏ်နဲ့ ချိန်ဆပြီး သိရပါမယ်။ မသိခဲ့ရင် ဇာတိမြေမှာ အားလုံး ပျက်စီး ဆုံးရှုံးပြီးမှ ရေခြား မြေခြားကို ထွက်သွားရ တတ်ပါတယ်။",
  "လက်ဖျံနှစ်ဖက်မှာ ရှိရင် – ရာဖြတ် လုပ်ငန်း အလွန် ထူးချွန်လိမ့်မယ်။ ရိုးသားဖြောင့်မတ်မှုဟာ ရှိတစ်လှည့် မရှိတစ်လှည့် ဖြစ်နေတတ်တယ်။ ဒီအချက်ကို သတိထားသင့်တယ်။",
  "ရင်ဘတ်မှာ ရှိရင် – မိသားစု/ ကျင်လည်ရာ အသိုင်းအဝိုင်း ကြားထဲမှာ ဩဇာအာဏာ အလွန် ကြီးပါလိမ့်မယ်။ ကိုယ်ကျင့်သိက္ခာ ကောင်းမွန်မယ်။ ပညာရှိမယ်။",
  "ဝမ်းဗိုက်မှာ ရှိရင် – ကရုဏာတရား ကြီးမားတယ်။ သည်းခံ ခွင့်လွှတ်တတ်တယ်။ အလှူဒါန ရက်ရောတာများဆိုရင် ဝတ်ထားတဲ့ အဝတ်တွေတောင် ချွတ်ပြီး လှူခဲ့တတ်သူ ဖြစ်တယ်။ ပညာရပ်တွေမှာ အထူးသဖြင့် အနုပညာမှာ အင်မတန် ထူးချွန် ထက်မြက်လိမ့်မယ်။ အားကစားဘက်ကို လိုက်စားရင်လဲ အလွန် ပေါက်မြောက်ပါလိမ့်မယ်။",
  "အင်္ဂါစပ်မှာ ရှိခဲ့ရင် – ဆန့်ကျင်ဘက်လိင်တွေ ဝိုင်းဝိုင်းလည်နေလိမ့်မယ်။ ကာမဆက်ဆံမှု အတတ် သူမတူအောင် ထူးချွန်မယ်။ အနုပညာ အရည်အသွေးကောင်းမယ်။ သီချင်းဆိုတာ၊ ကတာ သိပ်တော်မယ်။ ရုပ်ရည် အင်မတန် ချောမယ်။ နာမည် ကျော်ကြားမယ်။",
  "ခြေထောက်တွေမှာ ရှိရင် – ခရီးသွားနေမယ်။ လိင်မှုကို အလွန်အကဲ လိုက်စားသူ ဖြစ်မယ်။ ဖြောင့်မတ် မှန်ကန်မှု နည်းမယ်။",
  "ခြေဖမိုး နှစ်ဖက်မှာ ရှိရင် – အသက်တိုတတ်တယ်။ ဘာသာ သာသနာ သိပ်စိတ်မဝင်စားတတ်ပါ။ စိုက်ပျိုးရေး ဝါသနာပါမယ်။ မိမိရဲ့ တာဝန်များကို ရှောင်ပယ်လေ့ ရှိပါတယ်။"
];
const guruRegions = [
  ['ဦးခေါင်း', 4, [[120, 23]]],
  ['ညာဘက်လက်', 4, [[79, 139]]],
  ['လည်ပင်း', 1, [[120, 62]]],
  ['ရင်ဘတ်', 5, [[120, 89]]],
  ['ညာဘက်ခြေ', 3, [[100, 280]]],
  ['လိင်အင်္ဂါ', 1, [[120, 170]]],
  ['ဘယ်ဘက်ခြေ', 3, [[140, 280]]],
  ['ဘယ်ဘက်လက်', 4, [[161, 139]]],
  ['မျက်လုံး', 3, [[120, 40]]],
];
const guruReadings = [
  `မူလ/ကောဇာ ဇာတာမှာ ကိုယ့်ရဲ့ ဇနမနက္ခတ်ဟာ ဦးခေါင်းမှာ ရှိတိုင်း ဘုရင်ဖြစ်နေတာ မဟုတ်ပါဘူး။ ဘုန်းတန်ခိုး ဩဇာအာဏာ ကြီးမယ်။ စိတ်က ကြံစည်ထားတာထက် ပိုပြီး ထမြောက်အောင်မြင်မယ်လို့ နားလည်ရပါတယ်။ ဒါကြောင့် ကောဇာမှာ ဒီနက္ခတ် စန်းစီးနေချိန်မှာ မိမိ စိတ်က ဖြစ်ချင်/ရချင်တာတွေကို စပြီး အကောင်အထည် ဖော်ပါ။

ကောဇာမှာ ဒီနက္ခတ်လေးလုံးထဲက တစ်လုံးကို အစင်အကြယ် ရွေးယူပြီး အဲဒီကာလမှာ စီးပွားရေးလုပ်ငန်း စပြီး ထူထောင်ရင် အဲဒီ လုပ်ငန်းဟာ အင်မတန် အောင်မြင် ကျယ်ပြန့်ပါလိမ့်မယ်။ သူ လုပ်နေတဲ့ စီးပွားရေးနယ်ပယ်မှာ သူဆုံးဖြတ်ချက်နောက်ကို သူနဲ့ လုပ်ငန်းတူ သူများက လိုက်နာ လုပ်ဆောင်ရပါတယ်။ တစ်နည်းအားဖြင့် ပြောရရင် သူ့ကို ကျော်နိုင်ဖို့ ခက်ပါတယ်။`,
  `ခု ပြောမှာက ညာဘက်လက်အကြောင်းပါ။ အထာ သိပြီဆိုတော့ အကျဉ်းချုပ်ပဲ ရေးပါတော့မယ်။ မူလ/ကောဇာ ဘယ်မှာမဆို ဒီနက္ခတ်တွေမှာ မိမိ ရလို ဖြစ်လိုသမျှကို စပြီး လုပ်ယူပါ။ အနှောင့်အယှက်ကင်းကင်းနဲ့ အောင်လွယ်ပါတယ်။

ဒီနက္ခတ်တွေနဲ့ ဆက်စပ်ပတ်သက်လာတိုင်း နယ်တော်ရှင်၊ မြို့တော်ရှင်အစရှိသော နတ်များရဲ့ မေတ္တာဓာတ်ကို အမြဲ ခံယူရပါတယ်။ သူတို့ မေတ္တာရှိအောင် နေတတ်ရင် ဘဝမှာ ဘာမဆို အရာရာ အောင်လွယ်စေတတ်ပါတယ်။

ဇနမနက္ခတ်ဟာ (မူလ/ကောဇာ) ဒီညာဘက်လက်မှာ ရှိနေရင် ဂါထာမန္တန်တစ်ခုခုကို အောင်ထား/သိဒ္ဓိမြောက်ထားဖို့ လုပ်ထားပါ။ ဘယ်ဂါထာကို လုပ်ထားတယ်ဆိုတာတော့ လူမသိလေ ကောင်းလေပါပဲ။ အဲဒီဂါထာကို အသုံးပြုပြီး ဘဝမှာ မိမိ ဖြစ်လိုရာကို လုပ်ယူနိုင်ပါတယ်။ ဒီလို လုပ်ယူနေလို့ အောင်နေတာကိုလဲ လူမသိပါစေနဲ့။ အတတ်နိုင်ဆုံး လျှို့ဝှက်ထားပါ။ ဘာကြောင့် ဒီစကား ပြောနေရသလဲဆိုရင် ဒီလူတွေဟာ သူတစ်ပါး မနာလို ခံရတာ များလို့ပါ။ ဒါကြောင့် ဒီလူတွေဟာ သိုသိုသိပ်သိပ်၊ နှိမ့်နှိမ့်ချချ နေတတ်ဖို့ သိပ် အရေးကြီးပါတယ်။

ဒီနက္ခတ်တွေမှာ ရောဂါဖြစ်ရင် ပျောက်ကင်းလွယ်ပါတယ်။ အဲဒီလိုပဲ ဒီနက္ခတ်တွေမှာ ဆေးလှူခဲ့ရင် ဆေးလှူကျိုးအပြင် ကျန်းမာသက်ရှည်စေတတ်သော အကျိုးပေးကိုလဲ ရပါတယ်။ ဒီနက္ခတ်တွေမှာ မိမိကိုယ်မိမိ ယဉ်ကျေးအောင် ဆုံးမခြင်း၊ သူတစ်ပါးကို ယဉ်ကျေးအောင် ဆုံးမခြင်းဟာ သိပ်ကောင်းပါတယ်။

ဒီနက္ခတ်ရဲ့ ထူးခြားချက်ဟာ ငွေသတ္တုကို ပလ္လင် ထုလုပ်ပြီး ဘုရား လှူထားပါ။ တစ်သက်လုံး ဘယ်တော့မှ ဘာအတွက်နဲ့မှ မျက်နှာ မငယ်တော့ပါဘူး။ ကျမ်းအလိုအရ ပြောရရင် ဒီဘဝ ပြီးသွားလို့ နောက်ထပ်ဘဝပေါင်း ရှစ်ဆယ်အနည်းဆုံး ထားပြီး အဲဒီ အကျိုးပေးပါလိမ့်မယ်။ ပလ္လင် လုပ်ဖို့ ကုန်ကျစရိတ် မတတ်နိုင်ရင် အပြားခတ်ပြီး ဘုရားရှင် ရုပ်ပွားတော်အောက်မှာ ခင်းလှူလို့ ရပါတယ်။

ဒီနက္ခတ်တွေမှာ သတိကပ်ရတာက ကိုယ်နဲ့ မတန်မရာ/မအပ်မစပ်ဖြစ်တာတွေကို ရချင်စိတ်ကြောင့် ဒုက္ခရောက်ရတတ်တဲ့ ပြဿနာပါ။ အခန့်မသင့်ရင် လူအဖွဲ့အစည်းကိုပါ တော်လှန်ပစ်တတ်တဲ့ သူပုန်ကြီးတွေ ဖြစ်သွားတတ်ပါတယ်။ ဒါလေး တစ်ချက် သတိကပ် ရပါတယ်။`,
  `လည်ပင်းဟာ ချမ်းသာမယ်လို့ ပြောထားတယ်။ အသေးစိတ်တွေ ဆက်ပြောကြတာပေါ့လေ။

– အလွန် အင်မတန် ကံကောင်းခြင်း။
– အရည်အချင်း၊ အစွမ်းအစ အထူး ကြီးမားခြင်း။
– ဂုဏ်သိက္ခာ အလွန် ကြီးမားခြင်း။

ဒီသုံးခုကို ဒီနက္ခတ်က ပေးစွမ်းပါတယ်။ မူလ/ကောဇာ နှစ်မျိုးလုံးကို သိပါ။ အခါရွေးတာတွေကိုလဲ သိပါ။ ဒီနက္ခတ်စန်းယှဉ်ချိန်ကို အစင်အကြယ် ရွေးပြီး စီးပွားတက်စေတတ်သော အစီအရင်များ လုပ်ပါ။ စီးပွားဥစ္စာ ဆတိုးတက်ပါတယ်။

ဒီနက္ခတ်မှာ အဗြဟ္မစရိယာသီလနဲ့ တွဲဖက်ပြီး စရဏ ကျင့်နိုင်ခဲ့ရင် သဘာဝလွန် တန်ခိုးသိဒ္ဓိ တစ်မျိုးမျိုးကို ထင်ထင်ရှားရှား ရရှိစေတတ်ပါတယ်။ မိမိ အလိုရှိသော တန်ခိုးအတွက်လဲ အဓိဋ္ဌာန် တင်နိုင်ပါတယ်။ ဒါမှမဟုတ် ကိုယ့်ဟာကိုယ် နိုင်တဲ့ စရဏလေး ဆောင်ရွက်နေလဲ ဒီနက္ခတ် မိမိ ဇာတာခွင်မှာ ရပ်တည်ရာ ဘာဝအလိုက် သင့်လျော်သော/အတိတ်ကပါသော တန်ခိုးသိဒ္ဓိကို ရမယ်လို့ ပြောနိုင်ပါတယ်။

ဘယ်သူမဆို ဒီနက္ခတ် စန်းယှဉ်ချိန်မှာ မိမိ ရရှိထားပြီးသော/စံစားနေဆဲဖြစ်သော စည်းစိမ်ချမ်းသာကို စွန့်လှူတတ်ခဲ့ရင် – အင်မတန် ချမ်းသာကြွယ်ဝစေတတ်ပါတယ်။ သိပ်အကြီးအကျယ် မစဉ်းစားပါနဲ့။ နမူနာ ရိုးရိုးလေး ပြပါမယ်။ ကိုယ့်အိမ်ထဲမှာ ကိုယ်ထိုင်နေချိန်၊ အိမ်ထဲကို မိမိထက် သက်ကြီးဝါကြီး တစ်ဦးတစ်ယောက် ရောက်လာရင် ကိုယ့်ထိုင်ခုံလေး သူ့အတွက် ဖယ်ပေးလိုက်တာပါပဲ။ ကိုယ်က စားသောက်ဆိုင်မှာ စားစရာ မှာပြီးလို့ ရောက်လာချိန် ဆွမ်းခံကြွလာတဲ့ ရဟန်းကို တွေ့ရင် ကိုယ်မစားတော့ဘဲနဲ့ ဆွမ်းလောင်းလိုက်ပါတယ်။

ဘယ်သူမဆို ဒီနက္ခတ် စန်းယှဉ်ချိန်မှာ မိမိကို လာကန်တော့တဲ့ ပစ္စည်းဥစ္စာများကို မိမိထက် သက်ကြီးဝါကြီးများ၊ နောက်တစ်နည်း ပြောရရင် မိမိကိုယ်တိုင် ရိုသေ ကန်တော့ထိုက်သူများကို လှူရပါတယ်။ ဒါဆိုရင် ဘုန်းတန်ခိုး ဩဇာအာဏာ အင်မတန် ကြီးမားစေပါတယ်။ ပြီးတော့ ကျန်းမာသက်ရှည်စေပါတယ်။ ဒီစနစ်ကို ဆောင်ရွက်ခဲ့ရင် ဇနမနက္ခတ် ဦးခေါင်းရောက်ချိန်မှာ ဘုန်းတန်ခိုး ဩဇာ အာဏာ ဆတိုး တက်စေပါတယ်။

မူလဇာတာအရ ကိုယ့်ရဲ့ ဇနမနက္ခတ် ဒီဌာနမှာ ရှိနေရင် အပေါ်က စနစ်နှစ်မျိုးကို တစ်သက်တာလုံးအတွက် လုပ်နိုင်ပါတယ်။ ကောဇာအရ ဒီဌာနကို ကိုယ့်ရဲ့ ဇနမနက္ခတ် ရောက်လာရင် အဲဒီဌာနမှာ ရှိနေသမျှကာလပတ်လုံး လုပ်နိုင်ပါတယ်။`,

  `ကောဇာမှာ ဇနမနက္ခတ် ညာဘက်လက်မှာ ရှိချိန် လုပ်ထားသမျှ၊ စရဏ၊ သီလ၊ ဒါန အစရှိတာတွေအားလုံးရဲ့ အကျိုးပေးကို ရင်ဘတ်မှာ အကျိုးပေး အပြည့်ခံစားရပါတယ်။

ရင်ဘတ်နက္ခတ်တွေမှာ ပါတိမောက်သီလကို အထူးစင်ကြယ်အောင် စောင့်ထိန်းခဲ့ရင် ဦးခေါင်းနက္ခတ်မှာ ဘုန်းတန်ခိုး ဩဇာအာဏာကို အထူး ကြီးမားစေပါတယ်။

ရင်ဘတ်နက္ခတ်တွေမှာ မေတ္တာနဲ့ ကရုဏာကို ကျင့်ဆောင်တတ်ခဲ့ရင် လည်ပင်းနက္ခတ်မှာ အင်မတန် ချမ်းသာကြွယ်ဝစေတတ်ပါတယ်။

ရင်ဘတ်နက္ခတ်တွေမှာ အစာရေစာ လှူခဲ့ရင် ခြေနှစ်ဖက်မှာ ပြောထားတဲ့ ဆိုးကျိုးတွေကနေ ကင်းစင်ပါလိမ့်မယ်။`,
  `ဒီနက္ခတ်တွေမှာ ဇနမနက္ခတ် ရှိနေတာဟာ စိုးရိမ်စရာ မရှိပါဘူး။ အပေါ်မှာလဲ ပြောခဲ့ပြီးပါပြီ။ သီးခြား ခွဲပြီး ပြောစရာကတော့ ဒီလူတွေဟာ ရန်သဘော ရှိတယ်လို့ သိရသော နေရာတွေကို မသွားဘဲ ရှောင်ရပါတယ်။ ဥပမာ – အရက်ဆိုင်/ကလပ်/ဘားလို နေရာမျိုးပေါ့။ ရန်ပွဲတွေမှာလဲ ဝင်မပါသင့်ပါဘူး။ အခန့်မသင့်ရင် အသက်ပါ ဆုံးတတ်ပါတယ်။ စစ်သားတွေ ရှေ့တန်းထွက်တာမှာတော့ အလုပ်သဘောဖြစ်လို့ ထည့်စဉ်းစားစရာ မလိုပါဘူး။

ဒီနက္ခတ်တွေမှာ ကာယဒါန ပြုရင် ရင်ဘတ်နက္ခတ်မှာ သေချာပေါက် ချမ်းသာကြွယ်ဝပါတယ်။ ကိုယ့်ဇနမနက္ခတ် ဘယ်မှာပဲ ရှိနေ ရှိနေ၊ ဒီခြေထောက်နက္ခတ်တွေမှာ ကောဇာစန်းစီးချိန် ရောက်လာရင် ကာယဒါန လုပ်ရုံနဲ့ ရင်ဘတ်နက္ခတ်တွေမှာ ကောဇာစန်းရောက်ချိန် ငွေဝင်လာမှာ သေချာပါတယ်။ စဉ်းစားနည်းတွေကို အကျဉ်းပဲ ပြောပြနေတာပါ။ ချိန်ဆပြီး သုံးတတ်စေချင်ပါတယ်။`,
  `ဒီနက္ခတ်မှာ အဗြဟ္မစရိယာသီလနဲ့ တွဲဖက်ပြီး စရဏ ကျင့်နိုင်ခဲ့ရင် ဦးခေါင်းနက္ခတ်မှာ ဘုန်းတန်ခိုး ဩဇာအာဏာ အင်မတန် ကြီးမားပါလိမ့်မယ်။ ဘယ်လောက်ထိ ကြီးမားတတ်သလဲဆိုတာကို မြင်သာအောင် ဥပမာ အလွယ်ပေးရရင် မြန်မာရာဇဝင်မှာ နာမည်ကျော်တဲ့ ဒွတ္တဘောင်မင်းကို ဥပမာ ပေးရပါလိမ့်မယ်။

အဲဒီတော့ ဇနမနက္ခတ် ဦးခေါင်းမှာ ရှိနေသူဟာလဲ ဒီလိင်အင်္ဂါနက္ခတ်ကို ကောဇာစန်းစီးချိန်မှာ အဗြဟ္မစရိယာသီလလေး စောင့်ထိန်းရင် မူလက ရှိပြီးဖြစ်သော ဘုန်းတန်ခိုးကို ပိုတက်စေပါတယ်။

မူလဇာတာမှာကိုက ဇနမနက္ခတ် ဒီနေရာမှာ ရှိနေတယ်။ အိမ်ထောင်ကလဲ ပြုမယ်/ပြုတယ်ဆိုရင်လဲ ဒီနက္ခတ် စန်းယှဉ်ချိန်မှာ အဗြဟ္မစရိယာသီလလေး ကျင့်ကြည့်ပေါ့။ အင်မတန် ထူးခြားတာတွေ တွေ့ရပါလိမ့်မယ်။

မူလ/ကောဇာ နှစ်ခုလုံးပေါ့လေ ... ဒီဌာနမှာ ဇနမနက္ခတ် ရှိရင် လိင်ပိုင်းဆိုင်ရာ ကျူးကျော် စော်ကား နှောင့်ယှက်မှုကို ခံရတတ်ပါတယ်။ ဒါမှမဟုတ် ကိုယ်က သူတစ်ပါးကို ကျူးကျော် စော်ကားမိတတ်ပါတယ်။ ဒါတွေကို ဇာတာပါ အခြားနက္ခတ်များနဲ့ ချိန်ပါ။

ခု နမူနာ တွက်ပြထားတဲ့ စက်မှာ မူလနက္ခတ်ဟာ လိင်အင်္ဂါမှာ ရှိနေတယ်။ ဒီနက္ခတ်ဟာ
– အတိတ်နက္ခတ် ဖြစ်တယ် (ပထမတွဲ – အခန်း ၇)
– ဒလိဒ္ဒနက္ခတ် ဖြစ်တယ် (ပထမတွဲ – အခန်း ၁၀)
– ဘီလူးနက္ခတ် ဖြစ်တယ် (ပထမတွဲ – အခန်း ၁၁)
– ကာမနက္ခတ် ဖြစ်တယ် (ပထမတွဲ – အခန်း ၁၃)

လောလောဆယ် စိတ်ကူးပေါက်တဲ့ ပရိယာယ်လေး လေးမျိုး ဆွဲထုတ် ပြလိုက်ပါတယ်။ ဇနမနက္ခတ်ကနေ ကြည့်လိုက်ရင် – အဿဝဏီနက္ခတ် စန်းယှဉ်မွေးသူအတွက်က ဒီမူလနက္ခတ်ဟာ အာခါနက္ခတ်ပါဗျာ။ အဲဒီမယ် မူလ/ကောဇာ ဂြိုဟ်တွေပါ ထည့်လိုက်ဦး။ ပျော်စရာကြီးပေါ့လေ။

အဲသလိုတွေ အဖက်ဖက်က စဉ်းစားတွေးခေါ် ဝေဖန်ချိန်ဆကြရတာပါ။ စာအုပ်ထဲက အလွတ်ကျက် အဟောတွေနဲ့ကတော့ ဈေးထဲက သရောဒယဆရာတွေဆီ သွားပေါ့ဗျာ။`,
  '',
  `သေမယ်ပြောထားပေမယ့် စိုးရိမ်စရာ မရှိပါဘူး။ ခု ဒီစာရေးနေတဲ့ ကျွန်တော်တောင် မူလဇာတာမှာ ဒီနက္ခတ်နဲ့ မွေးတာပါ။ ငယ်စဉ်က ကျန်းမာရေး ညံ့တာတို့၊ သေဘေးတွေ တာတို့ ဘာတို့တွေ ဟောချင် ဟောကြပေါ့။ ကောဇာအရ ဒီကာလမှာ ကျန်းမာရေး ဂရုစိုက်ရတယ်တို့ ဘာတို့ ဒီလိုတွေလဲ ပြောချင် ပြောကြပေါ့။ ဒါတွေက ဗေဒင်ဆရာတွေ ဉာဏ်ကောင်းကြပါတယ်။ အထူး ပြောစရာ မရှိပါဘူး။

ဒီလို စက်တွေဆိုတာက ကျမ်းမှာ ပါတဲ့ အလွတ်ကျက် အဟောတွေ ဟောချင်လဲ ဟော၊ မဟောရင်လဲ ခု ဒီစာအုပ်မှာ ရေးပြနေသလို အစီအရင်တွေအတွက် ဒီစက်တွေကို သုံးချင်သုံးပေါ့။ အနိမိတ် ဟောချင်ရင်တော့ ဒီစက်တွေကို အခြားသော နက္ခတ်များနဲ့ ညှိပြီး ကိုင်ပေါ့။ ဥပမာ မူလဇာတာမှာ ဇနမနက္ခတ်က ခေါင်းကို ရောက်နေပြီး အာခါနက္ခတ်က ဘယ်မှာ၊ သံယောဂနက္ခတ်က ဘယ်မှာ စသည်ဖြင့်တွေ ညှိတတ်ရမယ်လေ။ ဘယ်ဂြိုဟ်က ဘယ်နက္ခတ်မှာ စီးနေပြီး အဲဒီနက္ခတ်က လိင်အင်္ဂါကို ရောက်နေချိန် ဘယ်လို လိင်စိတ်မျိုး ဖြစ်တတ်ပါတယ်တို့ ဘာတို့။ အဲလိုမဟုတ်ဘဲ ငါက သရောဒယတတ်တယ်ကွဆိုပြီး စာအုပ်ထဲ ပါသလောက်နဲ့ အလွတ်ကျက် ဟောတွေ လာဟောလို့ကတော့ မောင်မင်းနိုင်က အရင် ပြုံးစိစိ လုပ်ပြမှာပါပဲ။

ကဲပါလေ ... ထားပါတော့ .... ဒီဘက် ဘယ်ဘက်လက်မှာ ကျွန်တော် ပြောချင်တာက ဒီနက္ခတ်တွေဟာ စရဏနဲ့ ဒါနကို တွဲဖက်ရပါတယ်။ နောက်တစ်နည်းက သက်ကြီးဝါကြီးများရဲ့ မေတ္တာရိပ် ခိုလို့ရပါတယ်။ ဒါဆိုရင် ကျန်းမာရေး ညံ့တဲ့ဘေးတို့၊ အသက်ဘေးတို့က ကင်းပါတယ်။`,
  `တကယ်တော့ ဒီစက်ကို ရေးရခြင်း အကြောင်းက ခုမှ စမှာပါ။ ဒီဌာနမှာ နက္ခတ် သုံးလုံး ရှိပါတယ်။ ပထမဦးဆုံးသော နက္ခတ်ဟာ – ခု ဒီမှာ နမူနာ တွက်ပြထားတာနဲ့ ပြောရမယ်ဆိုရင် ဥတ္တရာဘဒြပုဒ်နက္ခတ်ဟာ ‘တတိယမျက်လုံး’ နက္ခတ် ဖြစ်ပါကြောင်း။ ဖွင့်ချင်ကြရင်ဖြင့် ဖွင့်နိုင်ကြပါကြောင်း။ အခြားသော နက္ခတ်များနဲ့ အနိမိတ် မချိန်ဆခဲ့ရင်၊ ဆရာကောင်း မရှိရင်၊ လောဘတွေကြီးပြီး ထင်ရာစိုင်းခဲ့ရင် ကိုယ့်ထိုက်နဲ့ ကိုယ့်ကံပေါ့လေ။

နောက်တစ်နည်း ပြောရရင် ဒီနက္ခတ်ဟာ ‘အမြင်နက္ခတ်’ ဖြစ်ပါကြောင်း။ ထူးခြားသော အမြင်အာရုံတစ်ခုခု ရှိတတ်တယ်လို့ ပြောချင်တာပါ။ ဒီလို ဇာတာရှင် နှစ်ဦး ကျွန်တော့်ဘဝမှာ တွေ့ဖူးပါတယ်။ တစ်ယောက်က တစ္ဆေ၊ သရဲများကို ရုပ်ရှင်ကြည့်ချိန် မြင်နေရသလိုကို မြင်တတ်သူပါ။ နောက်တစ်ယောက်ကတော့ နတ်လို၊ ရုက္ခစိုးလိုဟာတွေကို မြင်ရသူပါ။ သူကတော့ အစပိုင်းမှာ အလင်းတွေပဲ တွေ့ရတာပါ။ နောက်မှ စရဏတွေ ကျင့်လာပြီးတော့မှ ဒီအလင်းဟာ ရုက္ခစိုး၊ ဒီအလင်းဟာ ဘာ ... အဲလို ခွဲခြား သိမြင်လာတာပါ။ ကောဇာရဲ့ အမြင်သဘောကိုတော့ ပြောမနေတော့ပါဘူးလေ။ ကိုယ်တိုင် သတိထားကြည့်ရင် သိသွားတာပါပဲ။

ကျန်နက္ခတ် နှစ်လုံးကို ကျွန်တော် မသိပါ။ ပြီးတော့ ဒီနက္ခတ် သုံးလုံးမှာ ချမ်းသာမယ်လို့ ပြောခဲ့တာဟာ ဘယ်လိုချမ်းသာမှုမျိုးလဲဆိုတာ ကျွန်တော် မသိပါ။ မူလ/ကောဇာ နှစ်မျိုးလုံးမှာ ဒီလူတွေဟာ ငွေကြေး အပူသောက မရှိသလောက် နည်းတာကိုတော့ သတိထားမိပါတယ်။

လည်ပင်းနက္ခတ်ဟာ ဇနမစန်းရှိသူဟာ ဘဝမှာ တစ်ကြိမ်တစ်ခါတော့ စီးပွား အကြီးအကျယ် ပျက်ရလိမ့်မယ်လို့ ကျမ်းတစ်စောင်မှာ တွေ့ပါတယ်။ ဒီအချက်ကို ကျွန်တော် လက်တွေ့ ဇာတာများနဲ့ မလေ့လာဖူးလို့ ဘာမှ မပြောနိုင်ပါ။ ဒီလည်ပင်းနက္ခတ် စန်းယှဉ်ချိန်မှာ လုပ်ငန်း စတင်ခဲ့ရင် အဲဒီလုပ်ငန်းဟာ တစ်ကြိမ်တစ်ခါပဲဖြစ်ဖြစ် ပြိုကျပျက်စီးမလား .... ဒါလဲ ကျွန်တော် မသိသေးပါဘူး။ ဒါတွေဟာ ဆက်ပြီး လေ့လာရမယ့် အကြောင်းအရာများ ဖြစ်ပါတယ်။

ဒီဂုရုစက်ကို စပြီး တွေ့ခဲ့တာ ဇောတိတတ္ထကျမ်းမှာပါ။ တွေ့တုန်းက အမှတ်တမဲ့ပါပဲ။ ဒီလို ပုံသေဆန်တဲ့ အဟောတွေ မကြိုက်လို့လဲ သရောဒယကျမ်းထဲက ပုံသေ အဟောနဲ့ သွားနေတဲ့ စက်တွေကိုပါ မလေ့လာဘဲ ထားခဲ့တာပါ။ (၂၀၀၉) လောက်ကျမှ တန်တြကျမ်းတစ်စောင်မှာ ဒီဂုရုစက်ကို ပုံသေမဆန်တဲ့ စနစ်နဲ့ တွေ့မိလို့ မှတ်စု ယူထားပြီး သုံးဖြစ်တာပါ။ ရလိုက်တဲ့ မှတ်စုလေးက ပြည့်စုံပြီဆိုတဲ့ အထင်နဲ့ပေါ့လေ။ နောက်တော့မှ ကျမ်းတွေထဲက ဟိုတစ်စ ဒီတစ်စဆိုသလို အချက်အသစ်လေးတွေ တွေ့လာရတာပါ။ (၂၀၂၁) မှာ ဗေဒင်ကို ရသေ့စိတ်ဖြေ လုပ်တော့ချိန်မှာ ဒီဂုရုစက်နဲ့ ပတ်သက်ပြီးတော့ နောက်ထပ် အစအန ရလာတာလေးတွေ ရှိပါတယ်။ ဒါတွေကိုတော့ ကျွန်တော် လက်တွေ့ဇာတာများနဲ့ စနစ်တကျ လေ့လာ မှတ်တမ်းတင်ဖို့ မလွယ်ကူတော့ပါဘူး။

ဟုတ်ကဲ့ ... ဂုရုစက်နဲ့ ပတ်သက်ပြီး ကျွန်တော် လေ့လာ မှတ်သား စုဆောင်းထားမိသမျှ ကုန်ပါပြီ ခင်ဗျာ။`,

];
guruReadings[6] = guruReadings[4] + `

ဘယ်ခြေအတွက် သီးခြား ခွဲပြီး ပြောစရာကတော့ ဒီနက္ခတ်တွေမှာ အကုသိုလ် ထူပြောသော နေရာကို အတတ်နိုင်ဆုံး မသွားရပါဘူး။ ဥပမာ – ပြည့်တန်ဆာခန်း/သားသတ်ရုံဆိုတာတွေပေါ့။ ကိုယ်တိုင်က ဒါကို စီးပွားဖြစ် လုပ်နေတယ်/ရှောင်မရဘူးဆိုရင်လဲ အန္တရာယ်ကင်း အဆောင် ဘာညာလေးတွေ လိုအပ်ပါတယ်။ မမေ့ပါနဲ့။`;
const guruShortReadings = [
  'မင်းအဖြစ်ကို ရစေတတ်တယ်။',
  'ချမ်းသာမယ်။',
  'ချမ်းသာမယ်။',
  'ဇနီးရခြင်းကအစ၊ မိမိ နှစ်လိုသော အရာများ/ မိမိအတွက် နှစ်လိုဖွယ် ဖြစ်စေမယ့် အရာများကို ရမယ်။',
  'ဆင်းရဲမယ်။',
  'ဆင်းရဲမယ်။',
  'ဆင်းရဲမယ်။',
  'သေမယ်။',
  'ချမ်းသာမယ်။',
];
guruReadings.forEach((reading, index) => {
  guruReadings[index] = guruShortReadings[index] + '\n\n' + reading;
});
const guruNames = [...yatraNames.slice(0, 21), 'အဘိဇိ', ...yatraNames.slice(21)];
let chartNames = yatraNames;
let chartRegions = suriyaRegions;
let chartReadings = suriyaReadings;
let chartPlanetAt = solarNakshatraAt;
let chartMode = 'suriya';
let resultMode;
const regionSlots = () => chartRegions.flatMap(([, count], index) => Array(count).fill(index));
const chartSlot = (star, start) => chartMode === 'guru' ? (star - start + 28) % 28 : suriyaSlot(star, start);

function renderSuriyaStars(sunIndex) {
  const markers = byId('suriya-all-markers');
  markers.replaceChildren();
  const svg = 'http://www.w3.org/2000/svg';
  regionSlots().forEach((regionIndex, slot) => {
    const left = slot % 2 === 0;
    const rowY = 13 + Math.floor(slot / 2) * 25;
    const [x, y] = chartRegions[regionIndex][2][0];
    const arrow = document.createElementNS(svg, 'path');
    arrow.setAttribute('d', `M ${left ? -4 : 244} ${rowY} L ${x} ${y}`);
    arrow.setAttribute('class', 'suriya-star-line');
    arrow.setAttribute('marker-end', 'url(#suriya-neutral-arrowhead)');
    const label = document.createElementNS(svg, 'text');
    label.setAttribute('x', left ? -149 : 389);
    label.setAttribute('y', rowY + 3);
    label.setAttribute('text-anchor', left ? 'start' : 'end');
    label.setAttribute('class', 'suriya-marker-label');
    label.textContent = chartNames[(sunIndex + slot) % chartNames.length] + ' (' + chartRegions[regionIndex][0] + ')';
    const group = document.createElementNS(svg, 'g');
    group.setAttribute('role', 'button');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', label.textContent + ' အဟော');
    const showReading = () => {
      byId('suriya-star-title').textContent = group.dataset.gozaName || label.textContent;
      byId('suriya-star-reading').textContent = chartReadings[regionIndex];
      byId('suriya-star-dialog').showModal();
    };
    group.addEventListener('click', showReading);
    group.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showReading();
      }
    });
    group.dataset.slot = slot;
    group.append(arrow);
    if (chartMode === 'guru') group.append(label);
    markers.append(group);
  });
}

function highlightSuriyaSlot(slot, kind) {
  const group = byId('suriya-all-markers').children[slot];
  if (group) group.classList.add(kind);
}

function updateSuriya(starIndex, sunIndex) {
  const regionIndex = regionSlots()[chartSlot(starIndex, sunIndex)];
  const region = chartRegions[regionIndex];
  const starName = chartNames[starIndex];
  byId('suriya-result').textContent = starName + ' — ' + region[0];
  byId('suriya-reading').hidden = false;
  byId('natal-reading-title').textContent = 'မူလအရအဟော';
  byId('natal-reading-info').textContent = 'ဇနမနက္ခတ် - ' + starName + 'နက္ခတ်\nခန္ဓာကိုယ်အစိတ်အပိုင်း - ' + region[0];
  byId('suriya-reading-text').textContent = chartReadings[regionIndex];
  renderSuriyaStars(sunIndex);
  highlightSuriyaSlot(chartSlot(starIndex, sunIndex), 'natal-marker');
}
const readingButtons = [...document.querySelectorAll('[data-reading]')];

function showReadingTab(tab) {
  for (const button of readingButtons) {
    const active = button.dataset.reading === tab;
    button.setAttribute('aria-pressed', String(active));
    byId('reading-' + button.dataset.reading).hidden = !active;
  }
}

for (const button of readingButtons) {
  button.addEventListener('click', () => showReadingTab(button.dataset.reading));
}

function renderChartReadings() {
byId('reading-natal').querySelectorAll('.entry').forEach(card => card.remove());
for (const [index, reading] of chartReadings.entries()) {
  const card = document.createElement('article');
  card.className = 'entry';
  const heading = document.createElement('h3');
  heading.textContent = chartRegions[index][0];
  const paragraph = document.createElement('p');
  paragraph.textContent = reading;
  card.append(heading, paragraph);
  byId('reading-natal').append(card);
}
}

let birthStarIndex;
let chartBirthInstant;
const gozaResult = byId('goza-result');
function updateGoza(instant = new Date()) {
  const markers = byId('suriya-all-markers');
  const previous = markers.querySelector('.goza-marker');
  if (previous) {
    previous.classList.remove('goza-marker');
    previous.setAttribute('aria-label', previous.dataset.originalLabel);
    delete previous.dataset.gozaName;
  }
  byId('goza-time').textContent = new Intl.DateTimeFormat('my-MM', {
    timeZone: 'Asia/Yangon', dateStyle: 'medium', timeStyle: 'medium',
  }).format(instant) + ' (မြန်မာစံတော်ချိန်)';
  byId('goza-panel').hidden = false;
  try {
    const sun = chartPlanetAt(instant);
    const slot = chartSlot(birthStarIndex, sun.index);
    const regionIndex = regionSlots()[slot];
    if (chartMode !== 'guru') highlightSuriyaSlot(slot, 'goza-marker');
    const position = document.createElement('p');
    const starName = chartNames[(sun.index + slot) % chartNames.length];
    const separateMarker = byId('guru-goza-marker');
    separateMarker.hidden = chartMode !== 'guru';
    separateMarker.toggleAttribute('hidden', chartMode !== 'guru');
    if (chartMode === 'guru') {
      const [[x, y]] = chartRegions[regionIndex][2];
      const labelY = 382;
      byId('guru-goza-arrow').setAttribute('d', `M 120 369 L 244 357 L 244 ${y} L ${x} ${y}`);
      const label = byId('guru-goza-label');
      label.setAttribute('x', 120);
      label.setAttribute('y', labelY);
      label.setAttribute('text-anchor', 'middle');
      label.textContent = starName + ' (' + chartRegions[regionIndex][0] + ') (ကောဇာ)';
    }
    const marker = markers.children[slot];
    marker.dataset.gozaName = starName + ' (' + chartRegions[regionIndex][0] + ')';
    marker.dataset.originalLabel = marker.getAttribute('aria-label');
    marker.setAttribute('aria-label', starName + ' အဟော');
    position.textContent = 'ဇနမနက္ခတ် - ' + starName + 'နက္ခတ်\nခန္ဓာကိုယ်အစိတ်အပိုင်း - ' + chartRegions[regionIndex][0];
    byId('goza-reading-title').textContent = 'ကောဇာအရအဟော';
    const reading = document.createElement('p');
    reading.textContent = chartReadings[regionIndex];
    byId('goza-solar-star').textContent = 'ကောဇာ' + chartPlanetLabel() + ' — ' + chartNames[sun.index] + '၊ ပါဒ ' + mm(sun.pada);
    byId('goza-longitude').textContent = chartPlanetName() + ' လောင်ဂျီတွဒ် — ' + mm(sun.longitude.toFixed(4)) + '°';
    const { entry, exit } = solarNakshatraWindow(instant, chartPlanetAt);
    const boundaryFormat = new Intl.DateTimeFormat('my-MM', {
      timeZone: 'Asia/Yangon', dateStyle: 'full', timeStyle: 'short',
    });
    byId('goza-solar-entry').textContent = boundaryFormat.format(entry);
    byId('goza-solar-exit').textContent = boundaryFormat.format(exit);
    byId('goza-solar-window').hidden = false;
    gozaResult.replaceChildren(position, reading);
    byId('suriya-upagraha').hidden = chartMode !== 'suriya';
    if (chartMode === 'suriya') renderSuriyaUpagraha(chartBirthInstant, instant, boundaryFormat);
    saveChart(chartMode, {transit: instant.toISOString()});
  } catch {
    byId('goza-solar-window').hidden = true;
    gozaResult.textContent = 'ကောဇာအဟောကို တွက်မရပါ။';
    byId('suriya-upagraha').hidden = true;
  }
}

byId('goza-custom-form').addEventListener('submit', event => {
  event.preventDefault();
  if (birthStarIndex === undefined) return;
  const [date, time] = byId('goza-custom-time').value.split('T');
  const error = byId('goza-custom-error');
  try {
    updateGoza(myanmarBirthInstant(date, time));
    error.textContent = '';
  } catch {
    error.textContent = 'ရွေးထားတဲ့ ရက်နဲ့ အချိန်ကို ပြန်စစ်ပါ။';
  }
});

byId('goza-now').addEventListener('click', () => {
  if (birthStarIndex === undefined) return;
  byId('goza-custom-time').value = '';
  byId('goza-custom-error').textContent = '';
  updateGoza();
});

function connectTownSearch(prefix) {
  const city = byId(prefix + '-city');
  const search = byId(prefix + '-city-search');
  function renderCities() {
    const selected = city.value;
    const query = search.value.trim().normalize().toLowerCase();
    city.replaceChildren(new Option('မြို့ရွေးပါ', ''));
    for (const [index, [name, english, region]] of towns.entries()) {
      const label = [name, english, region].filter(Boolean).join(' · ');
      if (label.normalize().toLowerCase().includes(query)) {
        city.add(new Option(label, String(index)));
      }
    }
    if (city.options.length === 1) {
      city.options[0].text = 'ကိုက်ညီတဲ့ မြို့ မတွေ့ပါ';
    }
    city.value = [...city.options].some(option => option.value === selected) ? selected : '';
  }
  search.addEventListener('input', renderCities);
  renderCities();
  return city;
}

function readBirthInstant(prefix) {
  const readPart = (name, min, max) => {
    const value = ascii(byId(prefix + '-' + name).value.trim());
    const number = Number(value);
    if (!/^\d+$/.test(value) || number < min || number > max) {
      throw new RangeError('Invalid birth ' + name);
    }
    return number;
  };
  const pad = number => String(number).padStart(2, '0');
  const day = readPart('day', 1, 31);
  const month = readPart('month', 1, 12);
  const year = readPart('year', 1900, 2100);
  const hour = readPart('hour', 1, 12);
  const minute = readPart('minute', 0, 59);
  const second = readPart('second', 0, 59);
  const period = byId(prefix + '-period').value;
  if (!['AM', 'PM'].includes(period)) throw new RangeError('Invalid birth period');
  const hour24 = hour % 12 + (period === 'PM' ? 12 : 0);
  const birthDate = [year, pad(month), pad(day)].join('-');
  const birthTime = [hour24, minute, second].map(pad).join(':');
  return myanmarBirthInstant(birthDate, birthTime);
}

connectTownSearch('janma');

byId('janma-form').addEventListener('submit', event => {
  event.preventDefault();
  const result = byId('janma-result');
  try {
    const instant = readBirthInstant('janma');
    const { index, pada, longitude } = chartMode === 'guru' ? guruNakshatraAt(instant, true) : janmaAt(instant);
    const sun = chartPlanetAt(instant);
    birthStarIndex = index;
    chartBirthInstant = instant;
    showReadingTab('current');
    updateSuriya(index, sun.index);
    updateGoza();
    const degree = mm(longitude.toFixed(4));
    result.textContent = '';
    byId('suriya-calculation').textContent = chartNames[index] + 'နက္ခတ် · ပါဒ ' + mm(pada) + ' · လ ' + degree + '° · ' + chartPlanetLabel() + ' ' + chartNames[sun.index] + ' · ပါဒ ' + mm(sun.pada) + ' · ' + chartPlanetName() + ' ' + mm(sun.longitude.toFixed(4)) + '°';
    resultMode = chartMode;
    window.location.hash = chartMode + '-result';
  } catch {
    birthStarIndex = undefined;
    byId('suriya-all-markers').replaceChildren();
    byId('suriya-result').textContent = '';
    byId('suriya-reading').hidden = true;
    byId('goza-panel').hidden = true;
    gozaResult.replaceChildren();
    result.textContent = 'မွေးရက်၊ မွေးချိန်နှင့် မြို့ကို ပြန်စစ်ပါ။';
  }
});

const chartPlanetName = () => chartMode === 'guru' ? 'ကြာသပတေးဂြိုဟ်' : 'တနင်္ဂနွေဂြိုဟ်';
const chartPlanetLabel = () => chartMode === 'guru' ? 'ကြာသပတေးစီးနက္ခတ်' : 'နေစီးနက္ခတ်';

function selectChart(mode) {
  if (chartMode !== mode) byId('guru-goza-marker').setAttribute('hidden', '');
  chartMode = mode;
  byId('suriya').classList.toggle('guru-chart', mode === 'guru');
  byId('suriya').querySelector('.suriya-figure').setAttribute('viewBox', mode === 'guru' ? '-155 0 550 400' : '-12 0 264 360');
  const guru = mode === 'guru';
  chartNames = guru ? guruNames : yatraNames;
  chartRegions = guru ? guruRegions : suriyaRegions;
  chartReadings = guru ? guruReadings : suriyaReadings;
  chartPlanetAt = guru ? guruNakshatraAt : solarNakshatraAt;
  const title = guru ? 'ဂုရုစက်' : 'သူရိယစက်';
  byId('chart-title').textContent = title;
  byId('suriya-output-title').textContent = title + ' ရလဒ်';
  byId('chart-edit').href = '#' + mode;
  byId('chart-entry-label').textContent = chartPlanetName() + ' နက္ခတ်ထဲ ဝင်ချိန်';
  byId('chart-exit-label').textContent = chartPlanetName() + ' နက္ခတ်မှ ထွက်ချိန်';
  renderChartReadings();
}

const upaReadings = [
`နေစီးနက္ခတ်ကနေ (၅) လုံးမြောက် နက္ခတ်ဟာ ဝိဒြုမနက္ခတ်လို့ ခေါ်ပါတယ်။ ဝိဒြုမဆိုတာ အဆင်းကနေ အလင်းရောင်တွေ ပြိုးပြိုးပြက်ပြက်ထွက်နေတဲ့ နတ်သစ်ပင်ကြီးက သူ့ရဲ့ အဆင်းထဲ ထည့်ပြီး ဝှက်ထားတဲ့ နက္ခတ်လို့ ပြောချင်တာပါ။ ဒီနက္ခတ်မှာ အကျိုးပေးကို ဘာပြောထားလဲဆိုတော့ သားသမီး သေမယ်လို့ ပြောထားပါတယ်။ မူလဇာတာမှာ ဒီနက္ခတ်နဲ့ စန်းယှဉ်မွေးထားသူဟာ သားသမီး သေတတ်ပါတယ်။ ဒီလို သေရမှာ ပထမသားဦးလေး သေတာ ဖြစ်ဖို့ ရာခိုင်နှုန်း အများဆုံးပါ။ သေရမှာလဲ ပိုက်ထဲ သေတာ၊ မွေးပြီးပြီးချင်း လေးငါးလကနေ တစ်နှစ်အတွင်း သေတာ ဖြစ်ဖို့ ရာခိုင်နှုန်း အများဆုံးပါ။ ဒီအတွက်က လင်မယား နှစ်ယောက်လုံးရဲ့ ဇာတာကို စစ်ရပါတယ်။ တစ်ယောက်မှာ ဒီအချက်ပါလာရင်တောင် အဲဒီလို သားဦးကလေး ပျက်စီးဖို့ သေချာသလောက်ပါပဲ။ ကလေး ဘယ်တော့ သေမယ်ဆိုတာ ကလေးဇာတာကနေ စစ်ရပါတယ်။

ဒီကလေးဟာ မသေဘူးဆိုရင်တောင် လုံးဝ အမှီပြု ဖြေနိုင်တာက ဟောဒီကလေးဟာ မိဘအိမ်က ထွက်သွားပါလိမ့်မယ်။ ထွက်သွားပြီးရင် ပြန်မလာတော့ပါ။ ပြန်လာရင်လဲ သူ့သဘောနဲ့ သူပဲ ပြန်လာတာ ဖြစ်ပါလိမ့်မယ်။ ဒါမှမဟုတ် ယတြာတွေ ဘာတွေနဲ့ မရမက ခေါ်ထားလို့ ပြန်လာတာပါ။ ပြန်လာပြီးရင်လဲ သခင့်တေ့လိုပဲ နေသွားပါလိမ့်မယ်။ သေချာတာက ဒီကလေးမျိုးဟာ ဘယ်တော့မှ မိဘ လက်ထက်လက်ရင်း အမွေ မဆက်ခံပါ။ နောက်ပြီး ဒီကလေးဟာ မိဘတွေနဲ့ အနေအထိုင် အကျင့်အကြံများအားလုံးနဲ့ ဖြောင့်ဖြောင့်ကြီး ဆန့်ကျင်ပါလိမ့်မယ်။ ဒီလို မပြောလို့ မကောင်းဘူး ဘာညာကချည်း တွေးမနေကြပါနဲ့။ မိဘတွေကို ပစ်သွားပြီး တောထွက် တရားရှာနေတဲ့ သူတော်စင်ကြီးတွေမှာလဲ သူတို့မိဘ နှစ်ပါးထဲက တစ်ပါးဟာ ဝိဒြုမ သင့်ထားသူတွေပါ။

ကျွန်တော် မွေးလာတော့ ရပ်ကွက်ထဲက ဗေဒင်ဆရာကြီး တစ်ယောက်က အဖေနဲ့ အမေကို မေးပါတယ်။ ကိုယ်ဝန်ပျက်ဖူးသလားတဲ့။ ပျက်မကျဖူးပါဘူးဆိုတော့ ‘ဒါဆို ဒီကလေးကို နင်တို့ သားအရင်းလို မမှတ်ပါနဲ့တော့။ ကိုယ့်ဆီ ခဏ လာလည်တဲ့ ဧည့်သည်အဖြစ် မှတ်ကြပါ။ ဒီဘဝကို သူ့အလုပ် သူလုပ်ဖို့ပဲ လာတာပါ။ နင်တို့ အလုပ် လုပ်ဖို့ လာတာ မဟုတ်ပါဘူး။ အလုပ်မရ နင်တို့ဆီ ဆက်နေတာပြီး အားဖြည့်တဲ့ သဘောပါ’ လို့ ပြောပါတယ်။

ဆက်ပြောဦးမယ်။ ဝိဒြုမ သင့်ထားသူဟာ အမြင့်ကနေ ပြုတ်ကျပြီး ခြေထောက်ကျိုးတာ၊ သေတာပါ ဒုက္ခရတာ ဖြစ်တတ်ပါတယ်။ မူလဇာတာမှာ ဝိဒြုမသင့်ထားသူတွေကို ကျွန်တော် လေ့လာမိသလောက်က ခါးအောက်ပိုင်းမှာ ဖြစ်ကြတာ များပါတယ်။

လောကမှာ အကောင်းနဲ့ မကောင်းဟာ အမြဲ နှစ်တွဲနေတတ်ပါတယ်။ ဝိဒြုမဟာလဲ အင်မတန် ကောင်းတာတွေ ရှိပါတယ်။ မူလဇာတာမှာ ဝိဒြုမ သင့်ထားသူများဟာ ‘အလိုလို ကြိုတင်သိတဲ့ စိတ်’ အလွန် အားကောင်းပါတယ်။ ပြီးတော့ သူတို့တွေ စဉ်းစားဆင်ခြင်ပြီး မေ့လိုက်တဲ့ အနာဂတ်ကို ခန့်မှန်းစကားတွေဟာ ကြောက်စရာ ကောင်းအောင် မှန်တတ်ပါတယ်။ ဒီလူတွေမှာ နောက်ထပ် ထူးခြားချက်က ဘာလဲဆိုရင် စဉ်းစားတွေးခေါ် အကွက်ချတာ သိပ်တော်တဲ့ အချက်ပါ။ နောက်ပြီး သူတို့ဟာ ဘဝမှာ အခွင့်အလမ်းကောင်းတွေကို လမ်းသွားရင်း ခလုတ်တိုက် ကောက်ရသလို မကြာခဏ ရလေ့ရှိကြပါတယ်။ ဒီလူတွေဟာ ပစ္စည်းပျောက် ရှာတာကအစ ပြဿနာတွေကို အဖြေရှာတာအဆုံး စိတ်ကို လျှော့ပေး လွှတ်ပေးပြီးရင် စိတ်က ပေါ်လာသလို လိုက်လုပ်တဲ့အခါ ချက်ချင်းပဲ သူများ မသိနိုင် မရနိုင်တာတွေကို ရတတ်ကြပါတယ်။ အရေးကြီး အလုပ်တစ်ခုခုကို (ဘာအစီအစဉ်မှ ကြိုတင်ချထားလို့ မရတာတွေမှာ) လုပ်တော့မယ်ဆိုရင်လဲ စောစောက ပြောထားတဲ့ အလိုလို ကြိုတင်သိတဲ့ စိတ် အားကိုးနဲ့ လုပ်သွားရင် စိတ်ထဲက ပေါ်လာသလို လျှောက်လုပ်သွားရင် အံ့ဩစရာ အောင်မြင်မှုတွေ ရကြပါတယ်။

ဒါကြောင့် .... မိမိရဲ့ ဇနမနက္ခတ်ဟာ ကောဇာတနင်္ဂနွေကနေ ကြည့်လို့ ဝိဒြုမ သင့်ချိန်မှာ အကြားအမြင် ရဖို့ အဓိဋ္ဌာန် စပြီး ဝင်နိုင်ပါတယ်။ ဗေဒင်ဆရာတွေကလဲ ဗေဒင် အဟောမှန်ဖို့ ဒီကာလမှာ အဓိဋ္ဌာန် ဝင်နိုင်ပါတယ်။ အပေါ်မှာ ပြောထားတဲ့ ကောင်းကျိုးတွေအတွက်လဲ ဒီကာလမှာ ဆောင်ရွက်နိုင်ပါတယ်။ ကိုယ့်ရဲ့ ဇနမနက္ခတ်နဲ့ မကြည့်ဘဲ ကောဇာ စန်းစီးနက္ခတ်နဲ့ ကြည့်ပြီး လုပ်လဲ ရတာပါပဲ။ အခွင့်သင့် နည်းနည်းပဲ ကွာတာပါ။

ဝိဒြုမ မကောင်းကျိုးတွေ ပယ်ဖို့ ယတြာ လုပ်ချင်ရင် တနင်္ဂနွေ ယတြာကို လုပ်ရပါတယ်။ မူလဇာတာအတွက်ဆိုရင်တော့ တစ်သက်တာ လုပ်နေရပါလိမ့်မယ်။ ကောဇာ တနင်္ဂနွေစီး နက္ခတ်ကနေ ကိုယ့်ရဲ့ ဇနမနက္ခတ် ဝိဒြုမ သင့်တာဆိုရင်တော့ သင့်နေတဲ့ ရက်ကလေးတွေမှာ လုပ်ရင် ရပါတယ်။

တနင်္ဂနွေဟာ နက္ခတ် တစ်လုံးပေါ်ကို ပျမ်းမျှ (၁၃) ရက်ခွဲပါတယ်။ ဒီကာလတွေမှာ မိမိ မောင်းနေကျ မဟုတ်တဲ့ ယာဉ်တွေ မောင်းတာမျိုး၊ တက်နေကျမဟုတ်တဲ့ အမြင့် တက်တာမျိုးကို ရှောင်ရပါတယ်။ မဖြစ်မနေ လုပ်ရမယ်ဆိုရင်တော့ တနင်္ဂနွေ ယတြာ နဝနဝင်း၊ ဘေးကင်းစေတဲ့ အဆောင်တွေ ဆောင်ပြီးမှ လုပ်သင့်ပါတယ်။

စကားစပ်မိလို့ ပြောရရင် ကောဇာတနင်္ဂနွေဟာ ကိုယ့်ရဲ့ ဇနမနက္ခတ်ပေါ် စီးလာရင်လဲ တနင်္ဂနွေ ယတြာပဲ ချေရပါတယ်။ အခြားသော ပါပဂြိုဟ်များမှာလဲ ဒီသဘောတရားအတိုင်းပဲ ဒီဂြိုဟ်တွေရဲ့ ယတြာကိုပဲ ချေရပါတယ်။

မိမိရဲ့ မူလဇာတာက တနင်္ဂနွေစီးသော နက္ခတ်ကို ကောဇာတနင်္ဂနွေ လာစီးရင်လဲ တနင်္ဂနွေယတြာပဲ ချေရပါတယ်။ အဲသလိုပဲ မူလနဲ့ ကောဇာဇာတာမှာ အခြားဂြိုဟ်များကိုလဲ သိထားပါ။`,
`နေစီးနက္ခတ်ကနေ (၈) လုံးမြောက် နက္ခတ်ဟာ သူလနက္ခတ်လို့ ခေါ်ပါတယ်။ သူလနက္ခတ်မှာ ပြောထားတဲ့ အကျိုးပေးကတော့ ဆွေထွက်မျိုး ဖြစ်မယ်၊ ပင်ပန်းဒုက္ခတွေ့ရမယ်၊ စိတ်ဒဏ်ရာတွေ ရမယ်။ mental trauma လို့ခေါ်တဲ့ စိတ်ဒဏ်ရာတွေဟာ ဘယ်လောက်ဆိုးရွားတယ်ဆိုတာကို ခံစားဖူးသူတွေမှာ သိကြတာပါ။

အမျိုးသမီးများဟာ မူလဇာတာမှာ သူလသင့်ထားရင် မုဆိုးမ ဖြစ်မယ်။ မင်္ဂလာဆောင်ချိန်မှာ စန်းယှဉ်နက္ခတ်ဟာ သူလသင့်နေရင်လဲ ယောကျ်ားဖြစ်သူ သေမယ်။ သူ့ဇာတာမှာ သေဖို့ ကံပါခဲ့ရင် လင်မယား ကွဲမယ်။ မကွဲရင် အဲဒီယောကျ်ား တဖြည်းဖြည်းနဲ့ အသက်တိုမယ်။

မူလဇာတာမှာ သူလသင့်ထားသူတွေဟာ သွေးထွက်သံယို ခဏခဏ ဖြစ်တတ်တာက အသေးစားမှားများ၊ ဆရာဝန်တွေ၊ ဆေးတွေ ရှိတယ်။ သေခါနီးလို သွေးသားလဲ သေချင်နဲ့ သေလုမတတ်ဖြစ်လာမှကြားရေး သုံးပါးဆိုတဲ့ အသုဘာ ကမ္မဋ္ဌာန်းကို ထိုင်ဖို့မဟုတ်ဘဲ ကိုယ့်လက်လေးပါ ရေးထားတယ်။ အင်မတန် ဆိုးတာက ငယ်စဉ်မှာ ဘာမှမရှိ စိတ်ထဲကိုက်တတ်၊ စိတ်ဒဏ်ရာ ရတတ်တာက အရူးမ လင်လိုချင်သလို အသေကို အနေနဲ့အထိုင် ခက်တာပါဗျာ။ ဒါပေမယ့် ဒီလူတွေဟာ သူတို့ကို ချစ်အောင် စွဲအောင် နည်းနည်းလေး ပြောပေး၊ လုပ်ပေးလိုက်တာနဲ့ အင်မတန် စွဲလမ်း ချစ်ခင် တွယ်တာနေတတ်ကြပါတယ်။

မူလဇာတာတွေကို ဘေးကပ်ထား .... ကောဇာမှာ သူလသင့်ထားသော နက္ခတ်မှာ စကားပြောတာကအစ အပြုအမူများ အားလုံးကို အထူး ဆင်ခြင်ရပါတယ်။ ကိုယ်က သာမန် ပြောလိုက်/လုပ်လိုက်တာဟာ တစ်ဖက်သား ရင်ထဲ အင်မတန် ထိခိုက်နာကျင် ဝမ်းနည်းစရာ ဖြစ်တတ်ပါတယ်။ အဲသလိုပဲ ကိုယ့်ရင်ထဲမှာလဲ စိတ်ထိခိုက်ဝမ်းနည်းလွယ်၊ စိတ်ဒဏ်ရာ ရလွယ်စေတတ်ပါတယ်။ စွဲလမ်း ချစ်ခင် တွယ်တာစေတတ်တာလဲ အပေါ်မှာ ရေးခဲ့သလိုပဲ နားလည်ပြီး သုံးတတ်စေချင်ပါတယ်။ ကောဇာမှာ သူ့တစ်ပါးရင်ထဲ နေရာယူဖို့ အကောင်းဆုံး နက္ခတ်ပါ။

မူလဇာတာမှာ သူလသင့်ထားသူဟာ တံတွေးထွေးတတ်၊ ချွဲဟပ်တတ်တဲ့ အကျင့်ရှိရင် ပိုဆိုးတတ်ပါတယ်။ သူလသင့်ရင် ရတတ်တယ်ဆိုတဲ့ ဆိုးကျိုးတွေ ပိုရမယ်လို့ ပြောတာပါ။ ကွမ်းစားပြီး ကွမ်းတံတွေး ထွေးတာရင် ပိုဆိုးပါပြီ။ ဘာလို့လဲဆိုတော့ သူလဆိုတာ တံတွေးလိုလဲ အနက်ရလို့ပါ။ လက်တွေ့ ဇာတာတွေနဲ့ လူပေါင်းများစွာကို လေ့လာပြီးမှ ဒီစကား ကျွန်တော် ပြောတာပါ။

ကောဇာ တနင်္ဂနွေစီးနက္ခတ်ကနေ ကိုယ့်ရဲ့ ဇနမနက္ခတ် သူလသင့်တာဆိုရင် အဲဒီရက်တွေမှာ မိမိ ကိုင်တွယ်နေကျ မဟုတ်သော ချွန်ထက်တဲ့ ပစ္စည်းများကို ကိုင်တွယ်မယ်ဆိုရင် အထူး သတိထား ကိုင်တွယ်ရပါတယ်။

သူလဆိုတာ တံကျင်လိုလဲ အနက်ရပါတယ်။ ရှေးခေတ်မှာ တံကျင်လျှိုပြီး သတ်စေလို အပေးခံရသူတွေဟာ ဒီနက္ခတ်နဲ့ သက်ဆိုင်ပါတယ်။ ဒါကြောင့် ဒီနက္ခတ်သဘောတရားဟာ ပင့် တစ်မျိုးမျိုးနဲ့ မင်းပြစ်မင်းဒဏ် သင့်တတ်ပါတယ်။ စူးဒဏ်အရာမှာ ဒဏ်ပေးခံရတယ်ဆိုတာလဲ ဒီနက္ခတ်နဲ့ သက်ဆိုင်ပါတယ်။ သူလသင့်နေချိန်မှာ အကုသိုလ်စေလိုလို့ပဲ လယ်သမားဖြစ်စေ၊ မဆိုင်လို လယ်သမားဖြစ်စေ၊ အဲဒီလူတွေဟာ လိပ်ခေါင်း ထတတ်ပါတယ်။ လိပ်ခေါင်း တက်တဲ့ဆိုမှဟာ တံကျင်လျှိုခံရသလိုမျိုး။

သူလဆိုတာ ဝံ့ရံ့၊ အလိုလိုလဲ အနက်ရပါတယ်။ ဒါကြောင့် သူလမကောင်းကျိုးများ ကျေပျောက်/လျော့ပါးစေဖို့ ဝံ့ရံ့၊ သဘောနဲ့အလိုလိုသူတွေလဲ ဆက်သွယ်အဆင် အကျိုးပေးပါတယ်။ ဒါကြောင့် သူလ သင့်ထားသူများဟာ တာဝန်ထမ်းဆောင်နေလို့ နာမည်ဂုဏ်သတင်း ကျော်ကြားမှုကို ရတတ်ပါတယ်။ ဒါပေမယ့် ကောဇာမှာ သူလသင့်ချိန်မှာတော့ နာမည်ကြီးဖို့ အဓိဋ္ဌာန်လုပ်တာများ မလုပ်သင့်ပါဘူး။ နာမည်ကြီးလာရင်လဲ စိတ်ထိခိုက်လွယ်တာက တွဲပါလာတတ်တာမျိုးလို့ပါ။

သူလဆိုတာ လှံတံလို့ ပြောနေတော့ပါ။ ဒီကာလမှာ မိမိ ကိုးကွယ်ရာ နတ်များမှာ လှံကိုင်တဲ့ နတ်ကို လှံတံ လှူခဲ့ရင် ပြောခဲ့သမျှ ဆိုးကျိုးတွေ အကုန်လုံးနီးပါး ကျေပျောက်ပါတယ်။ ပြီးတော့ စိတ်မှာ ရှိပြီး ဒဏ်ရာများလဲ ကျေပျောက်လွယ်သလို စိတ်နှလုံးကြံ့ခိုင်လာပြီး နောင်မှာ စိတ်ဒဏ်ရာ အလွယ်တကူ မရတော့ပါ။

သီဝဟာ ခရင်းခွ သုံးခွပါတဲ့ လှံတံကို ကိုင်တာပါ။ ဒေဝသယျကို တနင်္လာ စီးမိုးပါတယ်။ သီဝဟာ တနင်္ဂနွေဂြိုဟ်ကို စီးမိုးပါတယ်။ အဲဒီတော့ ဒေဝလုပ်ထားတဲ့ သုံးခွပါတဲ့ လှံကလေးတစ်ချောင်းကို ဟောဒီ သူလသင့်ထားချိန်မှာ သူ့ကို လှူထားခဲ့ရင် ....

သူလနက္ခတ်အတွက်က တနင်္လာ ယတြာကို ချေနေရပါတယ်။`,
`နေစီးနက္ခတ်ကနေ ၁၄ လုံးမြောက် နက္ခတ်ဟာ သန္နိပါတနက္ခတ်လို့ ခေါ်ပါတယ်။ သန္နိပါတဆိုတာ အဖျားပါ။ တိုက်ဖွိုက်/ငှက်ဖျား/ကိုဗစ်လို အဖျားမျိုးတွေကို ပြောတာပါ။ တကယ်တမ်းက ကျမ်းက ပြောချင်တဲ့ အဖျားဆိုတာက မြန်မာဆေးပညာမှာ သန္နိပါတအဖျားလို့ ခေါ်တဲ့ အဖျားပါ။ ဒီအဖျားအကြောင်း အတိအကျ သိချင်ရင် ဆေးကျမ်းတွေမှာ သွားကြည့်ပါလို့ပဲ ပြောရမယ်။ ဗေဒင်ပညာရှင်ကတော့ ဒီလူတွေဟာ မကြာခဏ ဖျားတတ်ပါတယ်။ သေရင်လဲ အဖျားနဲ့ သေတာက များပါတယ်။ ကောဇာမှာ စန်းယှဉ်နက္ခတ်ဟာ မူလ/ကောဇာ တနင်္ဂနွေကနေ သန္နိပါတသင့်ထားတယ်ဆိုရင် အဲဒီကာလမှာ မဖျားဖို့ အထူးဂရုစိုက်ရပါတယ်။ ဖျားရင် အဖျား တအားကြီးပါလိမ့်မယ်။

မူလဇာတာမှာ စန်းယှဉ်နက္ခတ်ဟာ သန္နိပါတသင့်နေတဲ့ မိန်းမတွေဟာ လင်သေသော ဖြစ်မယ်လို့ ဆိုပါတယ်။ ယောကျ်ားတွေမှာတော့ မယားသေတတ် မရှိဘူးလို့ ဆိုပါတယ်။ သဘာဝက ရှိမရှိ မသိပါ။ ဒီစာအုပ်မှာ ရေးထားတာတွေကို ကျွန်တော် အနိမိတ် မလေ့လာဖူးပါ။

မူလဇာတာမှာ စန်းယှဉ်နက္ခတ်ဟာ သန္နိပါတသင့်နေရင် အပြင်းအထန် ထိခိုက် ဒဏ်ရာ ရတတ်ပါတယ်။ ကောဇာမှာလဲ ဒီအချက်ကို အထူး သတိကပ်ရပါတယ်။

မူလဇာတာမှာ စန်းယှဉ်နက္ခတ်ဟာ သန္နိပါတသင့်နေရင် ဒီလူဟာ တစ်သက်မှာ အနည်းဆုံး တစ်ကြိမ်ဖြစ်စေ စီးပွားရေးဟာ လုံးဝ ပြိုလဲ ပျက်စီးပါလိမ့်မယ်။ သန္နိပါတသင့်နေချိန် ဆောက်တဲ့အိမ်ဟာ ပြိုကျခြင်း/မီးလောင်ခြင်းဘေး အထူးသတိထားရပါတယ်။ ဘာလို့လဲဆိုတော့ သန္နိပါတဟာ ပြိုကျပျက်စီးခြင်းပါ။

သန္နိပါတဟာ အဆောက်အဦပြိုလဲခြင်းလို့လဲ အနက်ရပါတယ်။ ဒါကြောင့် ကောဇာမှာ သန္နိပါတသင့်ချိန်မှာ ခေါင်မိုး မိုးရတာသစ်၊ အထူး အခွင့်အရေး ရှိတာပါဗျာ။ သုံးကြည့်ကြပေါ့လေ။ ဒီတော့ ကောဇာမှာ သန္နိပါတသင့်သူများဟာ မုဆိုး/ကိုယ်စားလှယ်/သဘာဝန်/ဓာတုဗေဒပစ္စည်းများ ရောင်းဝယ်သူ စသည်ဖြင့် အလုပ်များ လုပ်ခဲ့ရင် .... စွန့်ဦးတီထွင်မှု လုပ်ရင်မှာလဲ ဒီလူတွေဟာ သိပ်တော်တာပါ။ ဒါဖြင့် ကောဇာမှာ သန္နိပါတသင့်ချိန်မှာ ဘယ်သူမဆို စွန့်ဦးတီထွင်မှု လုပ်ခဲ့ရင် ....

သန္နိပါတဆိုတာ စုစည်းခြင်း/စုဝေးခြင်းလို့လဲ အနက်ရပါတယ်။ ဘုရားရှင်တို့ရဲ့ လက်ထက်တော်ပိုင်းမှာ မဟာသန္နိပါတအစည်းအဝေးဆိုပြီး ကျမ်းတော်ထဲမှာ သိကြမှာပါ။ အဲဒီ စုပြီး ဖျားကြတာ မဟုတ်ရပါဘူးဗျာ။ ဒါကြောင့် မူလဇာတာမှာ သန္နိပါတ သင့်ထားသူများဟာ အစုအဝေး အစုအဆောင်း အလွန်ကောင်းပါတယ်။ ပျောက်ထားလိုမျိုးကအစ ဘာကိစ္စအတွက်မဆို လူစုချင်ရင်လဲ သူတို့ကို ခိုင်းရင် အလွန်လွယ်တာပါ။

သန္နိပါတဆိုတာ အပ်ကျသံမကြားရလောက်အောင် တိတ်ဆိတ်ငြိမ်သက်ခြင်းကို ခေါ်ပါတယ်။ ဒါကြောင့် ဒီလူတွေဟာ စကားနည်းပြီး အတွေးများကြပါတယ်။ ကျမ်းတွေမှာ ဘယ်လောက်ထိ ပြောလဲဆိုရင် ဒီလူတွေဟာ သေတာတောင် ထူးပါးပါး အော်ဟစ်သေစရာ မရှိကြပါဘူးတဲ့ဗျာ။

မူလဇာတာမှာ စန်းယှဉ်နက္ခတ် သန္နိပါတသင့်နေသူများဟာ လိင်ဆက်ဆံရာမှာ ပြင်းထန် ကြမ်းတမ်းတတ်ပါတယ်။ မမှန် မဟုတ်သော လိင်ဆက်ဆံမှုတွေ ပြုတတ်ပါတယ်။ ဒါဟာ ဖြစ်တတ်သော သဘောတရားကိုပဲ ပြောတာပါ။ တွေ့သမျှ ပုံသေ ထင်မနေကြစေချင်ပါ။

ကောဇာမှာ သန္နိပါတသင့်နေချိန်မှာ (မူလဇာတာတွေ လုံးဝ ထည့်မစဉ်းစားဘဲ) မမှန်မဟုတ်သော လိင်ဆက်ဆံမှုများကို ဖတ်မစဉ်းစားခဲ့ရင် အဆင်ပြေ လွယ်ပါတယ်။ အဲဒီတော့ပဲ ဘာလုပ်လို့ လုပ်ဖို့ပါ။ အိမ်တံခါးကိုတော့ ဖွင့်နေရင် သွားမပစ်ပါနဲ့။ အဲလို အဖတ်ကို မိန်းကလေးတစ်ယောက်နဲ့ တွေ့လို့ အကြိမ်မှာ အားမစားပဲ ဒါကြီး ကြိုနေတာ အဲလို အကြောင်းတွေ ပြောမိချိန်မှာ .... မောင်မင်းနိုင်ပဲ တို့ကို ကျောက်ကပ်ခွဲရင်တောင် ပြန်ကောက်ကြွားသလိုပြောခဲ့ရတယ်လို့ သိပါတယ်။

အယူအဆ မမှားမလို့ ထပ်ပြောဦးမယ်။ ခု ဒီမှာ ပြောနေတဲ့ လိင်ကိစ္စဆိုင်ရာ အချက်တွေဟာ သန္နိပါတသင့်ထားတိုင်း ဖြစ်ရမယ်လို့ မဟုတ်ပါ။ ပညာ သက်နဲ့ ထိန်းတတ်သူများကိုလဲ တွေ့ဖူးပါတယ်။

သန္နိပါတဟာ စနေလို ဆိုးကျိုးပေးတယ်လို့ ကျမ်းတွေက ပြောကြပါတယ်။ ဒီနက္ခတ်ပေါ်မှာ မူလ စနေလွန်းအား၊ မူလ စနေစီးနေရင် ဇာတာရှင်ကို စနေခိုလို့ပဲ မွေးသဘောအဖြစ် သတ်မှတ်ပါတယ်။ မူလဇာတာမှာ စန်းယှဉ်နက္ခတ်ဟာ သန္နိပါတ မဟုတ်ဘဲ မူလ စနေက ဟောဒီ နက္ခတ်ပေါ် စီးနေရင်လဲ ဇာတာရှင်ဟာ တစ်သက်လုံးမှာ အပေါ်က ပြောခဲ့တဲ့ ဆိုးကျိုးများကို အမြဲ သတိကပ်ရပါတယ်။ ကောဇာမှာ ဒီနက္ခတ်ပေါ် စနေစီးနေချိန်တွေမှာလဲ အထူး သတိကပ်ပြီး နေထိုင်ရပါတယ်။ အဲဒီကာလမှာ ဘာစီးပွားရေးမှ မချဲ့ပါနဲ့။ ကလေးလဲ မယူသင့်ပါ။

ဒီနက္ခတ်အတွက် အင်္ဂါ ယတြာ ချေရပါတယ်။`,
`နေစီးနက္ခတ်ကနေ (၁၈) လုံးမြောက် နက္ခတ်ဟာ ကေတုနက္ခတ်ပါ။ ဒီနေရာမှာ ပြောနေတဲ့ ကေတုဟာ ကိတ်ဂြိုဟ်ကို ပြောနေတာ မဟုတ်ပါဘူး။

ဇနမနက္ခတ်ဟာ ကေတုနက္ခတ် သင့်လာရင် အင်မတန်မှ နာမည်ဂုဏ်သတင်းကောင်း ထင်ရှား ကျော်ကြားပါလိမ့်မယ်။ ရိုးရိုး လာဘ်လာဘများတာ မဟုတ်ဘဲ မိမိရဲ့ ကောင်းမြတ်တဲ့ စွမ်းဆောင်ရည် တစ်ခုခုကြောင့် နာမည်ကျော်ကြား ထင်ရှားတာမျိုးပါ။ ဒီလူတွေဟာ ဂုဏ်ပြုမှု အမျိုးမျိုး ချီးမြှင့်မြှောက်စားမှု အမျိုးမျိုးကိုလဲ မကြာခဏ ရတတ်ကြပါတယ်။

ကောဇာ တနင်္ဂနွေကနေ ကြည့်လို့ မိမိရဲ့ ဇနမနက္ခတ် ကေတုသင့်ချိန်မှာ အပေါ်က စာပိုဒ်မှာ ပြောထားတဲ့ ကောင်းကျိုးတွေ ရဖို့ ဆောင်ရွက်နိုင်ပါတယ်။ ဇနမနက္ခတ်ကို မကြည့်ဘဲ ကောဇာ တနင်္ဂနွေနဲ့ တနင်္လာစီးထားသော နက္ခတ်များကို ကြည့်ပြီးတော့လဲ လိုသလို လုပ်ယူနိုင်ပါတယ်။ ဒါပေမယ့် ပင်ကိုယ် အရည်အသွေး မရှိဘဲ နာမည်ကြီးချင်တာဆိုရင်တော့လဲ ....

ကေတုဟာ တံခွန်တိုင်လို့လဲ အနက်ရပါတယ်။ ဒီတော့ ဒီနက္ခတ်မှာ ထီး၊ တံခွန် လှူခြင်းများဟာဖြင့်ရင် ....

ကေတုဆိုတဲ့ စကားလုံးရဲ့ အနက်ဟာ လင်းလက်တောက်ခြင်းလို့လဲ ပါတယ်။ အဲဒီတော့ မီးအလင်းဓာတ် လူရင် .... ဒီကာလမှာ နာမည်ကျော်ချင်တဲ့ နာမည်ကို နီယွန်မီးဆိုင်းဘုတ်ကလေးနဲ့ ရေးပြီး ချိတ်လိုက်ရင် .... လုပ်ငန်းနာမည်ကို ဒီကာလမှာ မီးထောင်တဲ့ ဆိုင်းဘုတ်ကလေး လုပ်ပြီး ချိတ်ရင် .... တနင်္ဂနွေ ယူထားသော နက္ခတ်များဆိုတဲ့ အခန်းမှာ ဒီနက္ခတ်ကို အဂ္ဂိဂြိုဟ် စီးမိုးကြောင်း ပြောခဲ့ပါတယ်။ အဲဒီတော့ ဆိုင်းဘုတ်က မီးအလင်းရောင်ကို အနီရောင် သုံးရင် .... ကျွန်တော် ပြောခဲ့တယ် ... ချိန်ဆတတ်ပါစေတော့ဗျာ။

ဒီနက္ခတ်ဟာ ခန့်မှန်းရ ခက်ခဲခြင်းကိုလဲ ပေးတတ်ပါတယ်။ ဒီတစ်ချက်ကို ဉာဏ်ရှိသလောက် စိတ်ကြိုက်ချဲ့ပြီး သုံးကြည့်ပါ။ အရသာ ရှိလိုက်တာလို့ ပြောရပါလိမ့်မယ်။

ဒါပေမယ့် မူလဇာတာမှာ ကေတုသင့်ထားသူများဟာ ရောဂါဖြစ်ရင်တော့ ဆရာကောင်း၊ သမားကောင်းနဲ့ စနစ်တကျ ကုရပါတယ်။ အလွယ်ဆေး ဆရာနဲ့ တွေ့ရင် ရောဂါကို ခန့်မှန်းတာတွေ လွဲပြီး အနာတရ ဆေးတစ်ခြား သေတတ်တယ်ပေါ့လေ။ ရောဂါပျောက်တာကို ပြန်နာတာကအစ ကောဇာမှာ ကေတုသင့်နေချိန် ဖြစ်နိုင်ရင် ရောဂါကုဆရာက အရမ်းအဆင်ဆင် လွဲတာက ကိုယ်တွေ့ပါပဲ ခင်ဗျာ။

ဒီနက္ခတ်ဟာ အမျိုးသမီးဖြစ်သူရဲ့ ဇာတာမှာ ရှိနေချိန်မှာ ဖခင်လင်ဆောင်တယ်ဆိုရင် လင်ဖြစ်သူရဲ့ အသက် သိပ်မကြာဘူး။ သင်္ဂြိုဟ် သေပေါက်မယ်။ ဒီနက္ခတ်ဟာ အမျိုးသားဖြစ်သူရဲ့ ဇာတာမှာ ရှိနေချိန်မှာ မင်္ဂလာဆောင်တယ်ဆိုရင် မယားဖြစ်သူရဲ့ မောင်ကြီး သို့မဟုတ် မောင်ငယ် သေပါလိမ့်မယ်။ ဒီအတွက်က လက်ထပ်သူတို့ရဲ့ မင်္ဂလာဇာတာမှာ တနင်္ဂနွေစီးနေတဲ့ နက္ခတ်နဲ့ လက်ထပ်ချိန်ရဲ့ စန်းစီးနက္ခတ်ကို ကြည့်တာပါ။ လက်ထပ်တဲ့ အခါမှာ ကေတုသင့်နေတော့ အခါ မကောင်းအပ်ပါ။

ဒီနက္ခတ်အတွက် မကောင်းကျိုးတွေ ပယ်ဖို့ ဗုဒ္ဓဟူးဂြိုဟ် ယတြာ လုပ်နေရပါတယ်။`,
`နေစီးနက္ခတ်ကနေ (၂၂) လုံးမြောက် နက္ခတ်ဟာ ဥက္ကလနက္ခတ်ပါ။ ဘေးသင့်မယ် ဒါမှမဟုတ် စီးပွားဥစ္စာ ပျက်စီးဆုံးရှုံးမယ်လို့ ကျမ်းတွေက ပြောပါတယ်။

ဥက္ကပျံ ကြယ်တံခွန် ဘာတို့ဆိုတာတွေ ကြားဖူးကြမှာပေါ့။ အဲဒီ ဥက္ကပျံနဲ့ ဒီဥက္ကလနဲ့ အတူတူပါပဲ။ အဲဒီတော့ အလင်းရောင်ပေါ့လေ။ ဟိုအရင်မှာ ပြောခဲ့တဲ့ ကေတုကလဲ အလင်း၊ ခု ဒီမှာ ပြောနေတဲ့ ဥက္ကလကလဲ အလင်းပါပဲ။ ဒီတော့ ဒီနက္ခတ်တွေမှာ ချွေးထွက်အလွန်သော အမှုများ ပြုရင် .... ဝင်ဝင်ကြီးပေါ့ဗျာ။ ပြီးတော့ ဒီနက္ခတ်တွေမှာ သူတစ်ပါး ချွေးထွက်ထားတာတွေကို လိုက်မလို့ အလွန် လွယ်ပါတယ်။ အဲဒီမှာ ကောဇာထက် ဒီ ဥက္ကလက ပိုလွယ်ပါတယ်။ အဲဒါ ဘာကြောင့်မှန်း မသိပါ။ ပြန်နိုင်တာကိုပဲ ပြောပြပါတယ်။ ဥက္ကလဟာ အလွန်အကျွံဖြစ်ခြင်း၊ ပိုက်ကိုမှားခြင်းကို အထူး ပေးတတ်ပါတယ်။ ဒါကြောင့် မိမိကလုပ်တာ ပြန်နိုင်ပါတယ်။ တစ်ဖက်မှာ ကေတုကလဲ တံခွန်တိုင်ဆိုတော့ ထင်ရှားပေါ်လွင်နေပြန်ရော .... အဲဒီတော့ ချွေးထွက်သော အမှုကို ဒီနက္ခတ်မှာ ပြုမရ ....

သူလနက္ခတ်မှာ အခိုးခံရ/ပျောက်တဲ့ ပစ္စည်းကို ပြန်ရနိုင်တယ်ဆိုတာကို ဟောဒီ နက္ခတ်မှာ ယတြာလုပ်ပြီး ရှာပေးဖူးပါတယ်။ ခက်တာက ကြာတာ နည်းနည်းပဲ ရတတ်ပါတယ်။ ဘယ်လောက်ထိ ချိန်ဆစရာ ကောင်းသလဲဆိုရင် ပစ္စည်းပျောက် ပြန်ရဖို့ ယတြာလုပ်တဲ့ ဒီဥက္ကလနက္ခတ်ဟာ သလေယာနက္ခတ် ဖြစ်နေရင်တော့ ပျောက်တဲ့ပစ္စည်း ပြန်ရတတ်ပါတယ်။ ဗေဒင်မှာ ပစ္စည်းပျောက် ဟောတာမှန်ချင်ရင် ဒီကာလမှာ အဓိဋ္ဌာန် စပြီး ဝင်ရပါတယ်။ စိတ်ဝင်စားရင် လုပ်ကြည့်ပါ။ တကယ် သိတာ ထင်ရှားပါတယ်။

အဲဒါ စကားစပ်မိလို့ ပြောပြဦးမယ်။ ပစ္စည်းပျောက်ရှာ ဗေဒင်ကိန်းတွေကို စနစ်တကျ သုတေသန လုပ်ထားတဲ့ အိန္ဒိယက ဗေဒင်ဆရာ တစ်ယောက်ဟာ ဒီကိန်းတွေကို အသုံးပြုပြီး မြေအောက်က ရွှေတို့၊ သတ္တုတို့ ရှာပေးကြောင်း ကျွန်တော် သတင်းသဲ့သဲ့ ကြားဖူးပါတယ်။ ဘာဆိုင်လိုက်နဲ့ဟာလိုပဲ တွေးမိပါတယ်။ ဟုတ်ရင်လဲ ဟုတ်နေမှာလို့လဲ တွေးမိပြန်ပါတယ်။ ပညာရှင်ချင်းသာ မန်းမ ဝန်ခံကြ မကျတတ်တဲ့ ဗေဒင်လောကမှာ ဒီလို မရေရာ မသေချာတာက တစ်ခုနှစ်ခု ကြားရဖို့တောင် သိပ်ခက်တာပါ။ ဒါကြောင့် မရေရာတဲ့ စကားလေးကိုပဲ ချရေးပေးလိုက်ပါတယ်။ စိတ်ဝင်စားရင် ဆက်ပြီး စူးစမ်းကြည့်စေချင်ပါတယ်။

မူလဇာတာမှာ ဥက္ကလသင့်ပြီး မွေးထားသူများဟာ စိတ်ကူးတွေ လွယ်လွယ်ကြပါတယ်။ စိတ်ကူးများရင် အလွန်အကျွံတွေ လုပ်တတ်ကြပါတယ်။ ဥက္ကလနက္ခတ် စန်းယှဉ်မွေးထားတာ သနားစရာ မျက်နှာ ရှိတတ်ပါတယ်။ သူတို့ ပရိယာယ်/မာယာအတတ်ကိုလဲ ကောင်းတတ်ကြပါတယ်။ သူတို့ရဲ့ အားနည်းချက်က ဘာလဲဆိုရင် သူတစ်ပါးအတွက် အရမ်း စွမ်းစွမ်းပေးတတ်တာပါ။ ဒီအပေါ်မှာ သူတို့ကို ယုံကြည်မြတ်နိုးစွာ လိုက်ပါနေတတ်တဲ့ နောက်လိုက်နောက်ပါများ အနည်းနဲ့အများ ရှိတတ်ကြပါတယ်။

မူလကတည်းက ဒီနက္ခတ်တွေကို ဥပပေးလာနေပြီးဆိုတော့ မူလ/ကောဇာတွေမှာ သုံးပြီး ချိန်ဆနည်းများကို သိနေတော့ကြပြီမို့ အသေးစိတ် မရေးတော့ပါဘူး။ ဒီနက္ခတ်အတွက် ကြာသပတေးဂြိုဟ်ယတြာကို ချေရပါတယ်။`,
`နေစီးနက္ခတ်ကနေ (၂၃) လုံးမြောက် နက္ခတ်ကို ကမ္ပနက္ခတ်လို့ ခေါ်ပါတယ်။ ကမ္ပဆိုတာ တုန်လှုပ် ချောက်ချားတာကို ခေါ်ပါတယ်။ ဒါကြောင့် ဒီနက္ခတ်နဲ့ စန်းယှဉ်မွေးသူတွေဟာ စိတ်နှလုံး တုန်လှုပ်ချောက်ချားတာ၊ နှလုံးခုန်မမှန်တာ၊ နှလုံး လေဝင်ပြီး သေတာတွေ ဖြစ်လွယ်ပါတယ်။ အဲဒီတော့ ကောဇာမှာ ဒီနက္ခတ် ရှိနေချိန် စိတ်ဓာတ်အားကို ကြောက်အောင် ခြောက်ရင် .... သူ့ကိုခြောက်တတ်တယ်လို့ သိထားတဲ့ နေရာတွေကို သွားမိရင် .... အဲလိုတွေ အကျယ်ချဲ့ပြီး ရေးပေးမနေတော့ပါဘူး။ ဉာဏ်ကြီးသူတွေအတွက် ရေးပေးနေတဲ့ စာတွေအဖြစ် ခံယူထားလို့ပါ။

နတ်ပူး/သူပူး/နဂါးပူးဆိုတာတွေမှာ အဲဒီလူတွေ ခန္ဓာကိုယ် တုန်နေတတ်တာ တွေ့ဖူးကြပါလိမ့်မယ်။ ဒါကလဲ မူလ/ကောဇာမှာ ဒီကမ္ပနက္ခတ်နဲ့ ဆက်စပ်နေတာ သတိထားမိပါတယ်။ ဒါပေမယ့် မူလဇာတာမှာ ကမ္ပနက္ခတ် သင့်နေသူတိုင်း နတ်ပူးမယ်လို့ ပုံသေ မပြောနိုင်ပါဘူး။

ကမ္ပဆိုတာ ပျက်စီးတာကိုလဲ ခေါ်ပါတယ်။ ဒါကြောင့် ဒီလူတွေဟာ အငြိမ်မနေနဲ့ တစ်ခုခု လုပ်နေတတ်ပါတယ်။ ပတ်စိတ်/ပုတီးစိတ် အစရှိတာတွေ လုပ်နေချိန်မှာ ခန္ဓာကိုယ် လှုပ်နေတတ်သူတွေဟာ ဒီနက္ခတ်နဲ့ ဆက်စပ်နေသူတွေ ဖြစ်ဖို့ များပါတယ်။

ကမ္ပဟာ စက်ပစ္စည်းတွေနဲ့ သက်ဆိုင်ပါတယ်။ ဒါကြောင့် ဒီလူတွေဟာ စက်မှုလုပ်ငန်းတွေနဲ့ စက်ပစ္စည်းအသစ် တီထွင်တာတွေနဲ့ သိပ္ပံကို အကျိုးပေးပါတယ်။ နောက်ပြီး လေဟာ အနိမ့်အမြင့် အမျိုးမျိုး၊ လေထုလေတိုက် အမျိုးမျိုးကို လွယ်လင့်တကူ ပြောင်းလဲ လှုပ်ရှားတတ်ခြင်းဟာ ဒီနက္ခတ်နဲ့ ဆိုင်ပါတယ်။ စကားပြောကောင်းခြင်းဟာလဲ ဒီနက္ခတ်နဲ့ ဆိုင်ပါတယ်။

ဒီနက္ခတ် မကောင်းကျိုးတွေ ပယ်ဖို့ စနေယတြာ ချေရပါတယ်။`,
`နေစီးနက္ခတ်ကနေ (၂၄) လုံးမြောက် နက္ခတ်ကို ဝဇိရနက္ခတ်လို့ ခေါ်ပါတယ်။ ဝဇိရကို ဝရဇိန်လို့လဲ ရေးကြပါသေးတယ်။ သိကြားမင်းကိုင်တဲ့ ဝရဇိန်လက်နက်ပေါ့လေ။ ဒီနက္ခတ်မှာ အခိုးအငွေ့ အလုပ်/စီးပွားရေးတွေမှာ ဆောင်ရွက်တတ်တယ်။ မယုံကြည်နိုင်လောက်အောင် အထူးအစွမ်းအကောင်းကို ရတယ်။ လက်နက်ဘေး သင့်မယ်။ လိင်ဆက်ဆံမှုကနေ အန္တရာယ် သင့်မယ်လို့ ကျမ်းတွေက ရေးကြပါတယ်။ မူလဇာတာမှာ ဝဇိရသင့်ထားသူများအနေနဲ့ ဒီအကျိုးပေးများကို ပြောထားပါတယ်။

မိုးကြိုးကိုလဲ ဝဇိရလို့ ခေါ်ပါတယ်။ ဒါလဲ သိသင့်ပါတယ်။ ဒီလူတွေက ဝဇိရသင့်ထားတော့ ဝရဇိန်လက်နက် ကိုင်ရမလား အောင့်မေ့ပေါ့မယ် .... လက်နက်ကောင်း သင်မယ်ဆိုတော့ ..... အဲဒီတော့ ဒီလူတွေကို ပန်းတိမ်ထည် မတပ်ခိုင်းပါဘူး။ စိန်လောကမှာ ရင်းနှီးမြှုပ်နှံတာ မလုပ်ခိုင်းရပါဘူး။ ဘာလို့လဲဆိုတော့ ဝဇိရဆိုတာ စိန်ကိုလဲ ခေါ်သေးတယ်။ မောင်မင်းနိုင် အားခါနည်းပြီး စိတ်ကူးယဉ်ပြီး ရေးနေတာ မဟုတ်ပါ .... လက်တွေ့တွေ ကျောက်ကပ်လောက်ပြီးမှ ရေးတာ ဖြစ်ပါကြောင်း ....

ဝဇိရသင့်ထားသူများဟာ စိတ်ဓာတ် အင်မတန် လေးနက် တည်ကြည်ပါတယ်။ အပြုံးအရယ် အတော် နည်းပါတယ်။ သူတို့ဟာ ဘယ်အရာကိုမဆို စိတ်ပါဝင်စားပြီး လုပ်ပြီဆိုရင် အဆုံးထိ ဇောက်ချလုပ်တတ်ပါတယ်။ ပညာတစ်ခုကို သင်ယူရင်လဲ လိုက်နိုင်သမျှ တစ်ဆင့်ပိုလှမ်းဖို့ အမြဲကြိုးစားနေတတ်ကြပါတယ်။

ဝဇိရဟာ ပေါင်းစည်းတတ်ခြင်းမှာ အင်မတန် တော်ပါတယ်။ ဒီကက အယူအဆတစ်ခုကို ဟိုဘက်က ပစ္စည်းနဲ့ လာပေါင်းကြည့်ပြီး ပစ္စည်းသစ် ထွင်တာ/အယူအဆ သဘောတစ်ခု ရှာဖွေတာတို့ဆိုတာတွေဟာ ဒီနက္ခတ်နဲ့ အဓိက သက်ဆိုင်ပါတယ်။

ဝဇိရဟာ မီးဆိုတဲ့ ဓာတ်အရှိန်ကို အလွန်နိုင်နင်းပါတယ်။ ဒါကြောင့် ဒီလူတွေဟာ/ဒီကာလမှာ မီးနဲ့ ပတ်သက်တဲ့ အလုပ်တွေ လုပ်ရင် အလွန် အောင်လွယ်စေတတ်ပါတယ်။ ဥပမာ – အရက်ချက်တာတို့၊ ဓာတ်ဆေးများ ဖော်တာတို့ပေါ့လေ ... အဲဒီမယ် လက်တွေ့ ဘေးသင့်စေတတ်တယ်ပြောထားတော့ အခါရွေးအပ် အခန့်မသင့်ရင် ထပြီး ပေါက်ကွဲတတ်သော အရာတွေကိုတော့ သတိကပ်ပေါ့။

ဝဇိရဟာ ထူးခြားတာက ပြောရတာ အားနာလောက်ပါတယ်။ ဒီတစ်ချက်ကို တန်ဖိုးထား သုံးတတ်ကြရင်ဖြင့် .... မူလဇာတာမှာ ဝဇိရသင့်သူများဟာ စကားပြော ရင်ခွင်ထဲ ကြမ်းတမ်းတာက တစ်ဖက်သားကို အင်မတန် နာကျင်အောင် ပြောတတ်တာတွေ မရှိသင့်ဘူး။ ရှိတတ်တာ များပါတယ်။ ရှိခဲ့ရင် ပြောထား အာဏာ မတည်တဲ့အပြင် လက်နက်ဘေးလဲ သေချာပေါက် သင့်ပါလိမ့်မယ်။

ဝဇိရဟာ ရောဂါတွေကို ပျောက်ကင်းစေတတ်သော အနိသင်လဲ ရှိပါတယ်။ ဒီတော့ အပေါ်မှာ ပြောခဲ့တဲ့ အချက်အလက်တွေကို ပေါင်းစပ်ကြည့်ကြရအောင် .... ဒီလူတွေဟာ မီးနဲ့ချက်သော ဆေးမျိုး ဖော်စပ်ပြီး သူ့ရင် တစ်သက်လုံး လက်နက်ဘေးက လွတ်ပါတယ်။ ဒီလူတွေဟာ ဆေးကျရမှာ သုံးတဲ့ စက်ပစ္စည်းတွေကို တီထွင်ရင် .... ဒီလူတွေဟာ ကောဇာမှာ ဝဇိရသင့်ချိန်မှာ အဓိဋ္ဌာန်ဝင်ပြီး ရောဂါများကို ပျောက်စေလို ပြုလုပ်ပေးသော အနိသင်ကို ရယူရင် .... ဒီလို အဓိဋ္ဌာန်မျိုးကို ကျွန်တော့်ဆရာ ပေးလို့ လုပ်ဖူးပြီး အောင်မြင်သွားသူ တကယ် ရှိပါတယ်။ မူလဇာတာမှာ ဝဇိရသင့်ထားသူများအဖို့ ပိုပြီး ပိုကောင်းပါတယ်။

အိန္ဒိယက ဆရာတစ်ယောက်က ဝဇိရ ယောဂမှာ ဝဇိရဒါသလို့ ခေါ်တဲ့ဟာ တစ်ခုကို ဒီနက္ခတ်သဘောတွေမှာ ဆိုးကျိုးတွေ ပြေပျောက်ဖို့ လုပ်နိုင်တယ်လို့ ဆိုပါတယ်။ ဝရဇိန်လို့ ခေါ်တဲ့ အပင်တစ်မျိုး ရှိတယ်လို့ ပြောတယ်။ အဲဒီ အပင် စိုက်ခဲ့ရင် ဒီနက္ခတ်ရဲ့ ဆိုးကျိုးတွေ ကျေမယ်လို့ ပြောပါတယ်။ တချို့က ပြောကြတာတော့ ရှားစောင်းလက်ပတ်က ဝရဇိန်အပင်ပါတဲ့။ သိကြားမင်းကိုင်တဲ့ ဝရဇိန်ဟာ အနိမ့်အရာလည်းရှိလို့ အနိမ့်ရင် ရှိသော လျှပ်စစ်တွေ လုပ်မယ်လို့လဲ ပြောကြပါတယ်။

အပေါ်က စာပိုဒ်မှာ ရေးခဲ့သမျှတော့ အားလုံး ကျွန်တော် ဘာမှ မသိပါ။ အခွင့်ရရင် အသေးစိတ် လေ့လာမိပြီး စုဆောင်းထားတဲ့ မှတ်စုတွေက ရေးပေးလိုက်တာပါ။ ဗုဒ္ဓဟူးဂြိုဟ်ကတော့ ဒီနက္ခတ်အတွက်က သောကြာဂြိုဟ် ယတြာချေရတယ်လို့ပဲ ဆိုပါတယ်။

ဒီနက္ခတ်မှာ ကျွန်တော် သတိထားတာက လိင်ဆက်ဆံရာက ဘေးသင့်မယ်ဆိုတာရယ်၊ ဒီလူတွေဟာ ဝရဇိန်လိုပဲ စိတ်ဓာတ် ကြံ့ခိုင်ရာကနေ ခေါင်းမာတဲ့ဘက်ကို ရောက်သွားတတ်သလားဆိုတာပါပဲ .... စနစ်တကျ လေ့လာခွင့် မရခဲ့ပါဘူး။ ခက်တာက သူတို့ စိတ်ဓာတ်က မာ၊ ခေါင်းပဲ မာမာ .... မောင်မင်းနိုင်ရဲ့ ခြေဖျားကိုတော့ မမီကြသေးတော့ အနုနည်းပါပဲလေ .....`,
`နေစီးနက္ခတ်ကနေ (၂၅) လုံးမြောက် နက္ခတ်ကို နိရ္ဃာတနက္ခတ်လို့ ခေါ်ပါတယ်။ ဒီနက္ခတ်နဲ့ ပတ်သက်လို့ ရေးစရာ အဓိက စာကြောင်း တစ်ကြောင်းပဲ ရှိပါတယ်။ သူဟာ ရှေးမှာ ရေးခဲ့တဲ့ ဝဇိရနဲ့ အကုန်လုံးနီးပါး တူပါတယ်။ မတူတာတွေ သီးခြား ရေးပေးပါမယ်။

နိရ္ဃာတမှာ မိသားစုနဲ့ ခွဲရမယ်လို့ ဆိုပါတယ်။
နိရ္ဃာတဟာ ဆိုးကျိုးပေးရင် ဝဇိရထက် ဆိုးပါတယ်။
နိရ္ဃာတဟာ ဝဇိရလောက် ခေါင်းမမာပါ။ နှုတ်မကြမ်းပါ။
နိရ္ဃာတဟာ စီမံခန့်ခွဲမှုရော ကြိုတင် ပြင်ဆင်မှုရော အလွန်ကောင်းပါတယ်။
နိရ္ဃာတဆိုးကျိုးများ ကျေဖို့ ရာဟုယတြာ လုပ်ရပါတယ်။

ဥပဂြဟတွေနဲ့ ပတ်သက်လာရင် ဘယ်ကျမ်းထဲမှာမှ မတွေ့ရမယ့် စကားတစ်ခွန်းကို ကျွန်တော် ဒီမှာ ထပ်ပြောပေးပါဦးမယ်။ ဇနမနက္ခတ်ကနေ ကြည့်ပြီး မဟိတ်နက္ခတ်တွေကို သိထားပါ။ ဒီမဟိတ်နက္ခတ် တစ်လုံးလုံးပေါ်မှာ မူလ တနင်္ဂနွေစီးထားတယ်။ အဲဒီ တနင်္ဂနွေစီးနက္ခတ်ကနေ ပြန်ကြည့်လိုက်လို့ ကိုယ့်ရဲ့ ဇနမနက္ခတ်ဟာ ဥပဂြဟ သင့်နေတယ်ဆိုရင် ဥပဂြဟရဲ့ ဆိုးကျိုး အားလုံးကနေ ကင်းလွတ်ငြိမ်းပါတယ်။ ကောင်းကျိုးတွေကတော့ အပြည့်အဝ ရပါတယ်။ ကျွန်တော် အမှတ်မရှိ လက်မှတ်ထိုးပေးပါတယ်။ ဒီအမျိုးတွေ ရေးရတာဟာ ပညာဒါနပြုနေတာ ဖြစ်လို့ အင်မတန် ကြည်နူး ကျေနပ်စွာ ရေးပါတယ်။ ဒီတော့ နောက်ထပ်တစ်ချက် ဆက်ပြောပါဦးမယ်ဗျာ။

ဥပဂြဟတွေကို ကိုင်တွယ်ရင် သူရိယစက်ကိုလဲ ကိုင်တွယ်ရပါတယ်။ ဒါကို သီးခြား ရေးပေးပါဦးမယ်။`,
];

const upaDefinitions = [
  ['ဝိဒြုမ', 4], ['သူလ', 7], ['သန္နိပါတ', 13], ['ကေတု', 17],
  ['ဥက္ကလ', 21], ['ကမ္ပ', 22], ['ဝဇိရ', 23], ['နိရ္ဃာတ', 24],
];
const upa28Definitions = [
  ['နေစီးနက္ခတ် (ဘူကမ္ပ၊ မြေလျှော၊ လုပ်ငန်းနှင့် ကုလ)', 0],
  ['ဝိဒြုမ / နိရ္ဃာတ', 4], ['သူလ', 6], ['ဝဇိရ / နိရ္ဃာတ', 8],
  ['သန္နိပါတ', 13], ['စဏ္ဍာလ', 14], ['ကေတု', 17], ['ဥက္ကလ', 18],
  ['သောက', 19], ['ဥက္ကလ / နိရ္ဃာတ', 20], ['ကမ္ပ', 21], ['ဝဇိရ', 22],
  ['နိရ္ဃာတ / ပရိဝေသ', 23],
];
const upa28Readings = [
  'ဤနက္ခတ်သည် ဇာတာရှင်ကို ဆောက်တည်ရာမရ ဖြစ်စေတတ်သည်။ ပတ်ဝန်းကျင်နှင့် သဘောထားများ ပြောင်းလဲလာတိုင်း အတွင်းစိတ်လှုပ်ရှားမှု၊ ပြဿနာနှင့် စိတ်မတည်ငြိမ်မှု ဖြစ်စေတတ်သည်။',
  'နက္ခတ်တူသော်လည်း ၂၇ လုံးမူ ဝိဒြုမနှင့် သဘောတရားချင်း အနည်းငယ်ကွာသည်။ နိရ္ဃာတနက္ခတ်ဟုလည်း ခေါ်သည်။',
  'သူလ။',
  'ဝဇိရ၊ နိရ္ဃာတ။',
  'သန္နိပါတ။',
  'အလွန် ရက်စက် ကြမ်းကြုတ်မယ်။ အဲသလို ရက်စက် ကြမ်းကြုတ်ရင် ဘဝဟာ ဆင်းရဲနွမ်းပါးမယ်။ ဒါမှမဟုတ် အနေအထိုင်အစားအသောက် ညစ်ညမ်း ပတ်တတ်မယ်။ အဲသလို ညစ်ညမ်း ပတ်တတ်ခဲ့ရင် ရောဂါကြီး တစ်မျိုးမျိုး ဝင်လိမ့်မယ်။ အသက်တိုမယ်။ ဒါမှမဟုတ် အောက်လမ်း အပြင်းအထန် အတိုက်ခံရမယ်။ အကျိုးပေး သုံးမျိုး ပြောထားပါတယ်။ ဇာတာပါ နက္ခတ်များနဲ့ ညှိယူ ချိန်ဆပြီးမှ ဆုံးဖြတ်ရပါတယ်။',
  'ကေတု။',
  'ဥက္ကလ။',
  'ဇာတာရှင်ကို မောဟ ကြီးကျယ်စွာ ဖုံးလွှမ်းစေသော နက္ခတ် ဖြစ်သည်။ ဥပဂြဟအားလုံးထဲတွင် ကြောက်စရာ အကောင်းဆုံးဟု ကျမ်းက ဖော်ပြထားသည်။',
  'ဥက္ကလ၊ နိရ္ဃာတ။',
  'ကမ္ပနက္ခတ်ကို မဟာကမ္ပဟုလည်း ခေါ်သည်။',
  'ဝဇိရ။',
  'ပရိဒေသမှာ ရေကြောင်း ဘေးသင့်ခြင်း၊ ကြွေးတင် ကျွန်ဖြစ်ခြင်း၊ အချုပ်အနှောင်ခံရခြင်းတို့ကို ပြောပါတယ်။ အစာရေစာ လှူခြင်း၊ အဝတ်အထည် လှူခြင်းများ လုပ်ရမယ်လို့ ပြောပါတယ်။',
];
const upa28Extra = {
  1: 'နက္ခတ် တူကွဲပေမယ့် ဝိဒြုမရဲ့ သဘောတရားချင်း အတူတူပါပဲ။ နောင်မှာ အဲလို သဘောတရားချင်း ကွာတာတွေကို ပြည့်စုံနားလည်ပေးတော့ပါ။ အဲလို ညှိနားလည်ရင် သဘာဝပေါက်စေချင်ပါတယ်။ ဒီနက္ခတ်ကို နိရ္ဃာတနက္ခတ်လို့လဲ ခေါ်ပါသေးတယ်။ ဒီမှာလဲ သဘောတရား တူပါတယ်။',
  5: 'အလွန် ရက်စက် ကြမ်းကြုတ်မယ်။ အဲလို ရက်စက် ကြမ်းကြုတ်ရင် ဘဝဟာ ဆင်းရဲနွမ်းပါးမယ်။ ဒါမှမဟုတ် အနေအထိုင် အစားအသောက် ညစ်ညမ်း ပတ်တတ်မယ်။ အဲလို ညစ်ညမ်း ပတ်တတ်ခဲ့ရင် ရောဂါကြီးတွေ တစ်မျိုးပြီး တစ်မျိုး ဝင်လိမ့်မယ်။ အသက်တိုမယ်။ ဒါမှမဟုတ် အောက်လမ်း အပြင်းအထန် အတိုက်ခံရမယ်။\n\nအကျိုးပေး သုံးမျိုး ပြောထားပါတယ်။ ဒါကို ဇာတာပါ နက္ခတ်များနဲ့ ညှိယူ ချိန်ဆပြီးမှ ဆုံးဖြတ်ရပါတယ်။',
  8: 'ဇာတာရှင်ကို မောဟ ကြီးကျယ်စွာ ဖုံးလွှမ်းစေသော နက္ခတ် ဖြစ်ပါတယ်။ ဥပဂြဟတွေ အားလုံးထဲမှာ ကြောက်စရာ အကောင်းဆုံး ဖြစ်တယ်လို့ ကျမ်းက ပြောပါတယ်။',
  10: 'ဒီနက္ခတ်ကို မဟာကမ္ပလို့လဲ ခေါ်ပါသေးတယ်။',
  12: 'ပရိဝေသမှာ ရေကြောင်း ဘေးသင့်ခြင်း၊ ကြွေးတင် ကျွန်ဖြစ်ခြင်း၊ အချုပ်အနှောင် ခံရခြင်းတို့ကို ပြောပါတယ်။ ဒီမှာက အစာရေစာ လှူခြင်း၊ အဝတ်အထည် လှူခြင်းများ လုပ်ရမယ်လို့ ပြောပါတယ်။',
};
for (const [index, text] of Object.entries(upa28Extra)) upa28Readings[index] = text;

const upa28Marriage = {
  1: 'ဝိဒြုမ သင့်နေရင် — သား သေမယ်။',
  2: 'သူလ သင့်နေရင် — လင် သေမယ်။',
  4: 'သန္နိပါတ သင့်နေရင် — လက်ထပ်ပြီး ဆယ်ရက်မြောက်နေ့မှာ လင်ဖြစ်သူ သေရာသေ မသေရင် ဒဏ်ရာ အကြီးအကျယ် ရမယ်။',
  6: 'ကေတု သင့်နေရင် — မတ်ဖြစ်သူ သေရာသေ မသေရင် ဒဏ်ရာ အကြီးအကျယ် ရမယ်။',
  7: 'ဥက္ကလ သင့်နေရင် — စီးပွား ပျက်မယ်။',
  11: 'ဝဇိရ သင့်နေရင် — လင်ငယ် နေမိမယ်။ ဒါမှမဟုတ် တခြားသော ယောကျ်ားက မုဒိမ်းကျင့်တာ ခံရမယ်။',
  10: 'ကမ္ပ သင့်နေရင် — အိုးအိမ်နေရာ ပျက်စီးမယ်။',
  12: 'နိရ္ဃာတ သင့်နေရင် — တစ်မျိုး တစ်ဆွေလုံး သေမယ်။',
};
for (const [index, text] of Object.entries(upa28Marriage)) {
  upa28Readings[index] += '\n\nမင်္ဂလာဆောင်ချိန်၏ နက္ခတ်အတွက် ကျမ်းဖော်ပြချက်\n' + text;
}
const nameOnly = [2, 3, 4, 6, 7, 9, 11];
for (const index of nameOnly) {
  const note = 'ပေးထားသော ၂၈ လုံးမူစာမျက်နှာတွင် ဤရေတွက်နေရာအတွက် ဥပဂြဟအမည်ကို ဖော်ပြထားပြီး သီးခြားအဟောရှည် မဖော်ပြထားပါ။';
  upa28Readings[index] += '\n\n' + note;
}

let upaMode = 'upagraha';
let upaResultMode;
const upaNames = (mode = upaMode) => mode === 'upagraha28' ? guruNames : yatraNames;
const upaRules = (mode = upaMode) => mode === 'upagraha28' ? upa28Definitions : upaDefinitions;
const upaPosition = (instant, moon = false, mode = upaMode) => mode === 'upagraha28'
  ? upagraha28At(instant, moon) : moon ? janmaAt(instant) : solarNakshatraAt(instant);
const upaCity = byId('upa-city');
function renderUpaCities() {
  const selected = upaCity.value;
  const query = byId('upa-city-search').value.trim().normalize().toLowerCase();
  upaCity.replaceChildren(new Option('မြို့ရွေးပါ', ''));
  towns.forEach(([name, english, region], index) => {
    const label = [name, english, region].filter(Boolean).join(' · ');
    if (label.normalize().toLowerCase().includes(query)) upaCity.add(new Option(label, String(index)));
  });
  if (upaCity.options.length === 1) upaCity.options[0].text = 'ကိုက်ညီတဲ့ မြို့ မတွေ့ပါ';
  upaCity.value = [...upaCity.options].some(option => option.value === selected) ? selected : '';
}
byId('upa-city-search').addEventListener('input', renderUpaCities);
renderUpaCities();
const upaTargets = (start, mode = upaMode) => upaRules(mode).map(([name, offset], ruleIndex) => ({
  name, ruleIndex, index: (start + offset) % upaNames(mode).length,
}));

function appendUpaChecks(output, mode, {birth, transit, birthSun, transitSun, star, transitMoon}, formatter) {
  const names = upaNames(mode);
  const readings = mode === 'upagraha28' ? upa28Readings : upaReadings;
  const checks = [
    ['မူလနေစီးနက္ခတ် → မူလဇနမနက္ခတ်', birthSun, star, birth],
    ['ကောဇာနေစီးနက္ခတ် → မူလဇနမနက္ခတ်', transitSun, star, transit],
    ['မူလနေစီးနက္ခတ် → ကောဇာစန်းယှဉ်နက္ခတ်', birthSun, transitMoon.index, transit],
    ['ကောဇာနေစီးနက္ခတ် → ကောဇာစန်းယှဉ်နက္ခတ်', transitSun, transitMoon.index, transit],
  ];
  for (const [title, sun, targetIndex, instant] of checks) {
    const card = document.createElement('article');
    card.className = 'entry';
    const heading = document.createElement('h2');
    heading.textContent = title;
    const info = document.createElement('p');
    const distance = (targetIndex - sun.index + names.length) % names.length;
    info.textContent = formatter.format(instant) + '။ နေစီးနက္ခတ် - ' + names[sun.index]
      + '။ စစ်ဆေးသောနက္ခတ် - ' + names[targetIndex]
      + '။ နေစီးနက္ခတ်ကို ၁ အဖြစ် ထည့်ရေတွက်လျှင် ' + mm(distance + 1) + ' လုံးမြောက်။';
    card.append(heading, info);
    const match = upaTargets(sun.index, mode).find(target => target.index === targetIndex);
    if (match) {
      const result = document.createElement('h3');
      result.className = 'upa-match';
      result.textContent = match.name + ' သင့်နေသည်။';
      const reading = document.createElement('div');
      reading.className = 'upa-reading';
      const text = document.createElement('p');
      text.textContent = readings[match.ruleIndex];
      reading.append(text);
      card.append(result, reading);
    } else {
      const note = document.createElement('p');
      note.textContent = 'ဤတိုက်ဆိုင်စစ်ဆေးမှုတွင် ဥပဂြဟသင့်ခြင်း မရှိပါ။';
      card.append(note);
    }
    output.append(card);
  }
}

function renderSuriyaUpagraha(birth, transit, formatter) {
  const output = byId('suriya-upagraha-results');
  const open = [...output.children].map(panel => panel.open);
  output.replaceChildren();
  for (const [index, mode] of ['upagraha', 'upagraha28'].entries()) {
    const names = upaNames(mode);
    const panel = document.createElement('details');
    panel.open = open[index] ?? true;
    const title = document.createElement('summary');
    title.textContent = 'ဥပဂြဟ (' + mm(names.length) + ') လုံးမူ';
    const birthSun = upaPosition(birth, false, mode);
    const transitSun = upaPosition(transit, false, mode);
    const star = upaPosition(birth, true, mode).index;
    const transitMoon = upaPosition(transit, true, mode);
    const solarPosition = mode === 'upagraha28' ? upagraha28At : solarNakshatraAt;
    const { entry, exit } = solarNakshatraWindow(transit, solarPosition);
    const solarWindow = document.createElement('p');
    solarWindow.textContent = 'ကောဇာနေစီးနက္ခတ် ဝင်ချိန် – ထွက်ချိန် · '
      + formatter.format(entry) + ' – ' + formatter.format(exit);
    panel.append(title, solarWindow);

    const table = document.createElement('table');
    const header = table.createTHead().insertRow();
    const body = table.createTBody();
    for (const label of ['ဥပဂြဟ', 'မူလ', 'ကောဇာ']) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = label;
      header.append(cell);
    }
    const natalTargets = upaTargets(birthSun.index, mode);
    const transitTargets = upaTargets(transitSun.index, mode);
    for (const [label, natal, goza] of [
      ['နေစီးနက္ခတ်', birthSun.index, transitSun.index],
      ['စန်းယှဉ်နက္ခတ်', star, transitMoon.index],
      ...natalTargets.map((target, column) => [target.name, target.index, transitTargets[column].index]),
    ]) {
      const row = body.insertRow();
      const heading = document.createElement('th');
      heading.scope = 'row';
      heading.textContent = label;
      row.append(heading);
      for (const star of [natal, goza]) {
        const cell = row.insertCell();
        if (names[star] === 'မူလ') {
          const link = document.createElement('a');
          link.href = '#';
          link.dataset.starInformation = names[star];
          link.textContent = names[star];
          cell.append(link);
        } else {
          cell.textContent = names[star];
        }
      }
    }
    panel.append(table);
    appendUpaChecks(panel, mode, {birth, transit, birthSun, transitSun, star, transitMoon}, formatter);
    output.append(panel);
  }
}

function upaTable(starts) {
  const table = document.createElement('table');
  const header = table.createTHead().insertRow();
  for (const name of ['နေစီးနက္ခတ်', ...upaRules().map(([name]) => name)]) {
    const cell = document.createElement('th');
    cell.textContent = name;
    header.append(cell);
  }
  const body = table.createTBody();
  for (const start of starts) {
    const row = body.insertRow();
    for (const name of [upaNames()[start], ...upaTargets(start).map(target => upaNames()[target.index])]) {
      row.insertCell().textContent = name;
    }
  }
  return table;
}

byId('upa-fullscreen').addEventListener('click', async () => {
  const panel = byId('upa-table-panel');
  if (document.fullscreenElement === panel) {
    await document.exitFullscreen();
  } else if (panel.requestFullscreen) {
    try { await panel.requestFullscreen(); }
    catch { panel.classList.toggle('upa-expanded'); }
  } else {
    panel.classList.toggle('upa-expanded');
  }
  byId('upa-fullscreen').textContent = document.fullscreenElement === panel || panel.classList.contains('upa-expanded')
    ? 'ပိတ်ရန်' : 'မျက်နှာပြင်အပြည့်';
});
document.addEventListener('fullscreenchange', () => {
  byId('upa-fullscreen').textContent = document.fullscreenElement ? 'ပိတ်ရန်' : 'မျက်နှာပြင်အပြည့်';
});
window.addEventListener('hashchange', () => byId('upa-table-panel').classList.remove('upa-expanded'));

function showUpaTab(tab) {
  byId('upa-result').hidden = tab !== 'result';
  byId('upa-all-readings').hidden = tab !== 'all';
  for (const button of document.querySelectorAll('[data-upa-tab]')) {
    button.setAttribute('aria-pressed', String(button.dataset.upaTab === tab));
  }
}
for (const button of document.querySelectorAll('[data-upa-tab]')) {
  button.addEventListener('click', () => showUpaTab(button.dataset.upaTab));
}
function renderAllUpaReadings() {
  const container = byId('upa-all-readings');
  container.replaceChildren();
  const readings = upaMode === 'upagraha28' ? upa28Readings : upaReadings;
  if (upaMode === 'upagraha28') {
    const notes = document.createElement('p');
    notes.className = 'upa-reading-notes';
    notes.textContent = 'မင်္ဂလာဆောင်ချိန်၏ နက္ခတ်အဟောများကို ကျမ်းတွင် ဖော်ပြထားသည်။ ယင်းအဟောကို မွေးဖွားမှု သို့မဟုတ် လက်ရှိကောဇာတစ်ခုတည်းနှင့် မင်္ဂလာအခါအဖြစ် အလိုအလျောက်မယူဘဲ သက်ဆိုင်ရာ အခါနက္ခတ်နှင့် ချိန်ဆရန် လိုသည်။ စာရေးသူက နက္ခတ်ပေါ် ဂြိုဟ်စီးမှု၊ သက်ဆိုင်ရာနက္ခတ်၏ အခြားသဘောများကိုပါ ပေါင်းစပ်ချိန်ဆရန် ဖော်ပြထားသည်။ ဥပမာတွင် ပါပဂြိုဟ်စီးနက္ခတ်၊ ဂြိုဟ်၏ ဝေဓနက္ခတ်တို့နှင့် တွဲဖက်၍ စဉ်းစားထားသည်။';
    container.append(notes);
  }
  upaRules().forEach(([name, offset], index) => {
    const card = document.createElement('article');
    card.className = 'entry upa-reading';
    const heading = document.createElement('h3');
    heading.textContent = name;
    const position = document.createElement('p');
    position.textContent = 'နေစီးနက္ခတ်မှ ' + mm(offset + 1) + ' လုံးမြောက်';
    const text = document.createElement('p');
    text.textContent = readings[index];
    card.append(heading, position, text);
    container.append(card);
  });
}
let upaHasResult = false;
let upaTransitInstant;
byId('upa-transit-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const [date, time] = byId('upa-transit-time').value.split('T');
    upaTransitInstant = myanmarBirthInstant(date, time);
    byId('upa-transit-error').textContent = '';
    byId('upagraha-form').requestSubmit();
  } catch {
    byId('upa-transit-error').textContent = 'ရက်နှင့် အချိန်ကို ပြန်စစ်ပါ။';
  }
});
byId('upa-transit-now').addEventListener('click', () => {
  upaTransitInstant = undefined;
  byId('upa-transit-time').value = '';
  byId('upa-transit-error').textContent = '';
  byId('upagraha-form').requestSubmit();
});

byId('upagraha-form').addEventListener('submit', event => {
  event.preventDefault();
  const output = byId('upa-result');
  output.replaceChildren();
  try {
    const readPart = (name, min, max) => {
      const value = ascii(byId('upa-' + name).value.trim());
      const number = Number(value);
      if (!/^\d+$/.test(value) || number < min || number > max) throw new RangeError('Invalid birth input');
      return number;
    };
    const pad = number => String(number).padStart(2, '0');
    const day = readPart('day', 1, 31);
    const month = readPart('month', 1, 12);
    const year = readPart('year', 1900, 2100);
    const hour = readPart('hour', 1, 12);
    const minute = readPart('minute', 0, 59);
    const second = readPart('second', 0, 59);
    const hour24 = hour % 12 + (byId('upa-period').value === 'PM' ? 12 : 0);
    const birth = myanmarBirthInstant([year, pad(month), pad(day)].join('-'), [hour24, minute, second].map(pad).join(':'));
    const star = upaPosition(birth, true).index;
    const transit = upaTransitInstant || new Date();
    const formatter = new Intl.DateTimeFormat('my-MM', {timeZone: 'Asia/Yangon', dateStyle: 'full', timeStyle: 'short'});
    const birthSun = upaPosition(birth);
    const transitSun = upaPosition(transit);
    const transitMoon = upaPosition(transit, true);
    const solarPosition = upaMode === 'upagraha28' ? upagraha28At : solarNakshatraAt;
    const { entry, exit } = solarNakshatraWindow(transit, solarPosition);
    byId('upa-solar-name').textContent = 'ကောဇာနေစီးနက္ခတ် - ' + upaNames()[transitSun.index] + ' (နက္ခတ်ပြောင်းချိန်)';
    byId('upa-solar-at').textContent = 'ကြည့်ရှုချိန် - ' + formatter.format(transit);
    byId('upa-solar-degree').textContent = 'နေလောင်ဂျီတွဒ် - ' + mm(transitSun.longitude.toFixed(4)) + '°';
    byId('upa-solar-entry').textContent = formatter.format(entry);
    byId('upa-solar-exit').textContent = formatter.format(exit);

    byId('upa-table').replaceChildren(upaTable([birthSun.index, transitSun.index]));
    const rows = byId('upa-table').querySelectorAll('tbody tr');
    rows.forEach((row, rowIndex) => {
      const start = rowIndex === 0 ? birthSun.index : transitSun.index;
      const natal = rowIndex === 0;
      const goza = rowIndex === 1;
      row.classList.toggle('upa-natal-row', natal);
      row.classList.toggle('upa-goza-row', goza);
      row.cells[0].textContent = upaNames()[start]
        + (natal ? ' (မူလ)' : '') + (goza ? ' (ကောဇာ)' : '');
      upaTargets(start).forEach((target, column) => {
        const cell = row.cells[column + 1];
        cell.replaceChildren(document.createTextNode(upaNames()[target.index]));
        cell.classList.remove('upa-hit', 'upa-hit-janma', 'upa-hit-moon');
        cell.removeAttribute('aria-label');
        const matches = [];
        if ((natal || goza) && target.index === star) matches.push('ဇနမနက္ခတ်');
        if ((natal || goza) && target.index === transitMoon.index) matches.push('စန်းယှဉ်နက္ခတ်');
        if (matches.length) {
          cell.classList.add('upa-hit');
          cell.classList.toggle('upa-hit-janma', target.index === star);
          cell.classList.toggle('upa-hit-moon', target.index === transitMoon.index);
          const pointer = document.createElement('span');
          pointer.className = 'upa-cell-arrow';
          pointer.textContent = '➜';
          pointer.setAttribute('aria-hidden', 'true');
          cell.prepend(pointer);
          cell.setAttribute('aria-label', target.name + ' - ' + upaNames()[target.index]
            + '။ ' + matches.join('၊ ') + ' သင့်နေသည်');
          cell.title = matches.join('၊ ') + ' သင့်နေသည်';
        }
      });
    });

    const comparison = document.createElement('table');
    comparison.className = 'upa-comparison';
    const comparisonHeader = comparison.createTHead().insertRow();
    for (const name of ['ဥပဂြဟ', 'မူလ', 'ကောဇာ']) {
      const heading = document.createElement('th');
      heading.scope = 'col';
      heading.textContent = name;
      comparisonHeader.append(heading);
    }
    const comparisonBody = comparison.createTBody();
    const originalHeaders = byId('upa-table').querySelectorAll('thead th');
    originalHeaders.forEach((original, index) => {
      const row = comparisonBody.insertRow();
      const heading = document.createElement('th');
      heading.scope = 'row';
      if (index === 0) {
        heading.textContent = original.textContent;
      } else {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'upa-reading-link';
        button.textContent = original.textContent.replaceAll(' / ', '\n');
        button.setAttribute('aria-haspopup', 'dialog');
        button.addEventListener('click', () => {
          const readings = upaMode === 'upagraha28' ? upa28Readings : upaReadings;
          byId('upa-reading-dialog-title').textContent = upaRules()[index - 1][0];
          byId('upa-reading-dialog-text').textContent = readings[index - 1];
          byId('upa-reading-dialog').showModal();
        });
        heading.append(button);
      }
      row.append(heading);
      rows.forEach((source, column) => {
        const cell = source.cells[index].cloneNode(true);
        cell.classList.add(column === 0 ? 'upa-natal-cell' : 'upa-goza-cell');
        if (index === 0) cell.textContent = upaNames()[column === 0 ? birthSun.index : transitSun.index];
        row.append(cell);
      });
    });
    byId('upa-table').replaceChildren(comparison);

    const overview = document.createElement('p');
    overview.textContent = 'မူလဇနမနက္ခတ် - ' + upaNames()[star] + '။ လက်ရှိစန်းယှဉ်နက္ခတ် - '
      + upaNames()[transitMoon.index] + '၊ ပါဒ ' + mm(transitMoon.pada) + '။';
    output.append(overview);
    appendUpaChecks(output, upaMode, {birth, transit, birthSun, transitSun, star, transitMoon}, formatter);
    byId('upa-error').textContent = '';
    renderAllUpaReadings();
    showUpaTab('result');
    upaHasResult = true;
    upaResultMode = upaMode;
    saveChart(upaMode, {transit: transit.toISOString()});
    window.location.hash = upaMode + '-result';
  } catch {
    byId('upa-error').textContent = 'ရက်နှင့် အချိန်ကို ပြန်စစ်ပါ။';
  }
});

const panchangCity = byId('panchang-city');
function panchangCities() {
  const current = panchangCity.value;
  const query = byId('panchang-search').value.trim().toLowerCase();
  panchangCity.replaceChildren();
  towns.forEach(([name, english, region], index) => {
    const label = [name, english, region].join(' · ');
    if (label.toLowerCase().includes(query)) panchangCity.add(new Option(label, String(index)));
  });
  if ([...panchangCity.options].some(option => option.value === current)) panchangCity.value = current;
}
panchangCities();
const mandalay = towns.findIndex(town => town[1] === 'Mandalay');
if (mandalay >= 0) panchangCity.value = String(mandalay);
byId('panchang-date').value = myanmarNow().slice(0, 10);
byId('panchang-search').addEventListener('input', panchangCities);
let panchangHasResult = false;
byId('panchang-form').addEventListener('submit', event => {
  event.preventDefault();
  const container = byId('panchang-result');
  container.replaceChildren();
  try {
    const town = towns[Number(panchangCity.value)];
    if (!town || panchangCity.value === '') throw new RangeError('Select city');
    const date = byId('panchang-date').value;
    const data = dailyPanchang(date, town[3], town[4]);
    const clock = byId('panchang-clock').value;
    const format = instant => {
      if (!instant) return 'ဤပြက္ခဒိန်ရက်အတွင်း မရှိ';
      const days = Math.floor((instant - data.midnight) / 86400000);
      if (clock === 'plus') {
        const minutes = Math.floor((instant - data.midnight) / 60000);
        return mm(String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0')) + (days ? '+' : '');
      }
      return new Intl.DateTimeFormat('my-MM', {timeZone:'Asia/Yangon', hour:'2-digit', minute:'2-digit', hour12:clock === '12'}).format(instant)
        + (days > 0 ? ' (နောက်နေ့)' : '');
    };
    const heading = document.createElement('h2');
    heading.textContent = new Intl.DateTimeFormat('my-MM', {timeZone:'Asia/Yangon', dateStyle:'full'}).format(data.midnight) + ' · ' + town[0];
    container.append(heading);
    const phase = document.createElement('p');
    phase.textContent = tithiName(data.periods.tithi[0].index) + ' · လအလင်း ' + mm(Math.round(data.illumination * 100)) + '%';
    container.append(phase);
    const table = document.createElement('table');
    table.className = 'panchang-table';
    const row = (label, value) => {
      const line = table.insertRow();
      const title = document.createElement('th');
      title.scope = 'row';
      title.textContent = label;
      const text = document.createElement('td');
      text.textContent = value;
      line.append(title, text);
    };
    for (const [label, key] of [['နေထွက်ချိန်','sunrise'],['နေဝင်ချိန်','sunset'],['လထွက်ချိန်','moonrise'],['လဝင်ချိန်','moonset']]) row(label, format(data[key]));
    for (const [label, key, name] of [
      ['တီထိ','tithi',tithiName],
      ['နက္ခတ်','nakshatra', index => yatraNames[index] + 'နက္ခတ်'],
      ['ယောဂ','yoga', index => yogaNames[index]],
      ['ကရဏ','karana',karanaName],
    ]) data.periods[key].forEach((period, index) => row(label + (key === 'karana' ? ' ' + mm(index + 1) : ''), name(period.index) + ' — ' + format(period.end) + ' အထိ'));
    row('နေ့အမည်', weekdays[new Date(date + 'T12:00:00Z').getUTCDay()]);
    const nak = data.periods.nakshatra[0].index;
    row('ပဉ္စက', nak >= 23 || (nak === 22 && janmaAt(data.sunrise).pada >= 3) ? 'ရှိ' : 'မရှိ');
    container.append(table);
    byId('panchang-error').textContent = '';
    panchangHasResult = true;
    saveChart('panchang');
    window.location.hash = 'panchang-result';
  } catch {
    byId('panchang-error').textContent = 'ရက်စွဲနဲ့ မြို့ကို ပြန်စစ်ပါ။';
  }
});

const akhaCity = connectTownSearch('akha');
if (mandalay >= 0) akhaCity.value = String(mandalay);
byId('akha-date').value = myanmarNow().slice(0, 10);
const akhaBirthCity = connectTownSearch('akha-birth');
let akhaHasResult = false;

function highlightCurrentAkhaSlots() {
  const now = Date.now();
  for (const row of byId('akha-result').querySelectorAll('.akha-time-divisions[open] tr[data-slot-start]')) {
    const current = now >= Number(row.dataset.slotStart) && now < Number(row.dataset.slotEnd);
    if (current === row.hasAttribute('aria-current')) continue;
    if (current) row.setAttribute('aria-current', 'time');
    else row.removeAttribute('aria-current');
    row.querySelector('.akha-current-label').hidden = !current;
  }
}

function akhaSlotStarButton(index) {
  const name = yatraNames[index];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'akha-slot-star';
  button.dataset.starInformation = name;
  button.setAttribute('aria-haspopup', 'dialog');
  button.textContent = name + 'နက္ခတ်';
  return button;
}

function renderAkhaTimeDivisions(data) {
  const dateFormat = new Intl.DateTimeFormat('my-MM', {
    timeZone: 'Asia/Yangon', day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const timeFormat = new Intl.DateTimeFormat('my-MM', {
    timeZone: 'Asia/Yangon', hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const section = document.createElement('details');
  section.className = 'akha-time-divisions';
  const summary = document.createElement('summary');
  summary.textContent = 'နက္ခတ်အခါပိုင်း တွက်နည်း ၃ မျိုး';
  section.append(summary);
  section.addEventListener('toggle', () => {
    if (!section.open) return;
    if (section.children.length > 1) {
      highlightCurrentAkhaSlots();
      return;
    }
    for (const method of akhaTimeDivisions(data)) {
      const detail = document.createElement('details');
      const label = document.createElement('summary');
      label.textContent = method.title;
      const description = document.createElement('p');
      description.className = 'akha-reading-text';
      description.textContent = method.description;
      const table = document.createElement('table');
      table.setAttribute('aria-label', method.title);
      const heading = table.createTHead();
      const groups = heading.insertRow();
      for (const [text, grouped] of [
        ['လွှမ်းမိုးနက္ခတ်', false], ['စချိန်', true], ['ဆုံးချိန်', true], ['ကြာချိန်', false],
      ]) {
        const cell = document.createElement('th');
        cell.scope = grouped ? 'colgroup' : 'col';
        if (grouped) cell.colSpan = 2;
        else cell.rowSpan = 2;
        cell.textContent = text;
        groups.append(cell);
      }
      const columns = heading.insertRow();
      for (const text of ['ရက်စွဲ', 'နာရီ', 'ရက်စွဲ', 'နာရီ']) {
        const cell = document.createElement('th');
        cell.scope = 'col';
        cell.textContent = text;
        columns.append(cell);
      }
      const body = table.createTBody();
      for (const slot of method.slots) {
        const row = body.insertRow();
        row.dataset.slotStart = String(+slot.from);
        row.dataset.slotEnd = String(+slot.to);
        const starCell = row.insertCell();
        starCell.append(akhaSlotStarButton(slot.star));
        const currentLabel = document.createElement('span');
        currentLabel.className = 'akha-current-label';
        currentLabel.textContent = 'ရောက်ဆဲ';
        currentLabel.hidden = true;
        starCell.append(currentLabel);
        if (slot.sourceStar !== undefined) {
          const source = document.createElement('small');
          source.append('မူလ ', akhaSlotStarButton(slot.sourceStar));
          if (slot.pada) source.append(' · ပါဒ ' + mm(slot.pada));
          row.cells[0].append(source);
        }
        for (const [period, instant] of [['စချိန်', slot.from], ['ဆုံးချိန်', slot.to]]) {
          for (const [label, formatter] of [['ရက်စွဲ', dateFormat], ['နာရီ', timeFormat]]) {
            const cell = row.insertCell();
            cell.className = 'akha-slot-value';
            const mobileLabel = document.createElement('span');
            mobileLabel.className = 'akha-slot-mobile-label';
            mobileLabel.setAttribute('aria-hidden', 'true');
            mobileLabel.textContent = period + ' · ' + label;
            cell.append(mobileLabel, formatter.format(instant));
          }
        }
        const seconds = Math.round((slot.to - slot.from) / 1000);
        row.insertCell().textContent = mm(Math.floor(seconds / 60)) + ' မိနစ်'
          + (seconds % 60 ? ' ' + mm(seconds % 60) + ' စက္ကန့်' : '');
      }
      const scroll = document.createElement('div');
      scroll.className = 'akha-slot-scroll';
      scroll.tabIndex = 0;
      scroll.setAttribute('role', 'region');
      scroll.setAttribute('aria-label', method.title);
      scroll.append(table);
      detail.append(label, description, scroll);
      section.append(detail);
    }
    highlightCurrentAkhaSlots();
  });
  return section;
}

byId('akha-form').addEventListener('submit', event => {
  event.preventDefault();
  const output = byId('akha-result');
  const error = byId('akha-error');
  akhaHasResult = false;
  error.textContent = '';
  output.replaceChildren();
  try {
    const date = byId('akha-date').value;
    const [name,,, latitude, longitude] = towns[Number(akhaCity.value)];
    const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
    const data = dailyPanchang(date, latitude, longitude);
    const format = new Intl.DateTimeFormat('my-MM', {
      timeZone: 'Asia/Yangon', dateStyle: 'short', timeStyle: 'medium',
    });
    const overview = document.createElement('header');
    overview.className = 'akha-overview';
    const heading = document.createElement('h3');
    heading.textContent = name;
    const calendar = document.createElement('p');
    const dateFormat = new Intl.DateTimeFormat('my-MM', {
      timeZone: 'Asia/Yangon', dateStyle: 'full',
    });
    calendar.textContent = dateFormat.format(data.sunrise);
    overview.append(calendar, heading);
    const lunar = myanmarMonth(date);
    const month = lunar.mm === 0 ? 3 : (lunar.mm - 1) % 12;
    const monthName = lunar.mm === 0 ? 'ပထမဝါဆို' : lunar.mm === 4 && lunar.myt
      ? 'ဒုတိယဝါဆို' : (lunar.mm > 12 ? 'နှောင်း' : '') + akhaMonths[month];
    const hasBirthDetails = ['day', 'month', 'year', 'hour', 'minute', 'second', 'period', 'city']
      .some(part => byId('akha-birth-' + part).value.trim());
    const filters = {month};
    const notice = document.createElement('p');
    notice.textContent = 'မြန်မာလ — ' + monthName;
    if (hasBirthDetails) {
      try {
        if (!akhaBirthCity.value) throw new RangeError('Missing birth city');
        const [, , , lat, lon] = towns[Number(akhaBirthCity.value)];
        const birthInstant = readBirthInstant('akha-birth');
        filters.ascendant = natalAscendant(birthInstant, lat, lon);
        filters.birthStar = janmaAt(birthInstant).index + 1;
      } catch {
        error.textContent = 'မွေးရက်၊ မွေးချိန်နှင့် မွေးမြို့ကို ပြည့်စုံမှန်ကန်အောင် ဖြည့်ပါ။';
        return;
      }
      notice.textContent += ' · မူလလဂ် — ' + akhaRashis[filters.ascendant] + 'ရာသီ'
        + ' · မွေးနက္ခတ် — ' + yatraNames[filters.birthStar - 1] + 'နက္ခတ်';
    } else {
      notice.textContent += '။ မူလလဂ်၊ မွေးနက္ခတ်နှင့် ဆိုင်သော အဟောအတွက် မွေးရက်၊ မွေးချိန်နှင့် မွေးမြို့ကို ဖြည့်ပါ။';
    }
    overview.append(notice);
    output.append(overview, renderAkhaTimeDivisions(data));
    const timeline = document.createElement('section');
    timeline.className = 'akha-timeline';
    const timelineTitle = document.createElement('h3');
    timelineTitle.textContent = 'အချိန်ပိုင်းအလိုက် အဟော';
    timeline.append(timelineTitle);
    for (const interval of akhaIntervals(data, weekday, filters)) {
      const card = document.createElement('article');
      card.className = 'akha-interval';
      const header = document.createElement('header');
      const time = document.createElement('h4');
      time.textContent = format.format(interval.from) + ' – ' + format.format(interval.to);
      const basis = document.createElement('p');
      basis.className = 'akha-basis';
      for (const value of [
        tithiName(interval.tithi),
        yatraNames[interval.nakshatra] + 'နက္ခတ် · ပါဒ ' + mm(interval.pada),
      ]) {
        const chip = document.createElement('span');
        chip.textContent = value;
        basis.append(chip);
      }
      header.append(time, basis);
      card.append(header);
      const readings = document.createElement('ul');
      readings.className = 'akha-readings';
      const yuga = interval.yuga;
      const yugaMatch = {
        name: 'ယုဂ် ၂၈ မျိုး · ' + mm(yuga.number) + '။ ' + yuga.name,
        type: yuga.avoid ? 'caution' : yuga.type,
        reading: yuga.reading,
        note: guruNames[yuga.starIndex] + 'နက္ခတ်',
      };
      if (yuga.avoidMinutes) {
        yugaMatch.note += ' · ' + (yuga.avoid
          ? 'ပထမ ' + mm(yuga.avoidMinutes / 24) + ' ယာမ (' + mm(yuga.avoidMinutes) + ' မိနစ်) ရှောင်ရန် · ' + format.format(yuga.avoidUntil) + ' အထိ'
          : 'ပထမ ' + mm(yuga.avoidMinutes / 24) + ' ယာမ ရှောင်ရမည့်အချိန် ကျော်လွန်ပြီး · ' + format.format(yuga.avoidUntil) + ' အထိ');
      }
      for (const match of [yugaMatch, ...interval.matches, ...interval.events]) {
        const item = document.createElement('li');
        const title = document.createElement('p');
        title.className = 'akha-reading-title';
        if (match.type === 'caution' || match.type === 'good') {
          const badge = document.createElement('span');
          badge.className = 'akha-status';
          badge.dataset.type = match.type;
          badge.textContent = match.type === 'caution' ? 'သတိပြု' : 'ကောင်း';
          title.append(badge);
        }
        const name = document.createElement('strong');
        name.textContent = match.name + (match.time ? ' · ' + format.format(match.time) : '');
        title.append(name);
        item.append(title);
        if (match.note) {
          const note = document.createElement('p');
          note.className = 'akha-match-note';
          note.textContent = match.note;
          item.append(note);
        }
        const original = match.reading ?? akhaSourceReading(match.name);
        if (original) {
          const reading = document.createElement('p');
          reading.className = 'akha-reading-text';
          reading.textContent = original;
          item.append(reading);
        }
        if (match === yugaMatch && (yuga.remedy || yuga.upagraha || yuga.avoidMinutes)) {
          const remedy = document.createElement('details');
          remedy.className = 'upa-reading';
          const heading = document.createElement('summary');
          heading.textContent = 'သက်ဆိုင်ရာ ယတြာ';
          remedy.append(heading);
          if (yuga.remedy || yuga.upagraha) {
            const text = document.createElement('p');
            text.textContent = yuga.remedy ?? upaReadings[upaDefinitions.findIndex(([name]) => name === yuga.upagraha)];
            remedy.append(text);
          }
          if (yuga.avoidMinutes) {
            const timing = document.createElement('p');
            timing.textContent = 'ယတြာတွေမှာက ဒီယုဂ်အတွက် ယတြာ လုပ်တာပါဆိုရင်တော့ ဒီယာမတွေကိုပဲ အမိအရဖမ်းပြီး လုပ်ရမှာပေါ့။';
            remedy.append(timing);
          }
          item.append(remedy);
        }
        readings.append(item);
      }
      card.append(readings);
      timeline.append(card);
    }
    output.append(timeline);
    akhaHasResult = true;
    saveChart('akha');
    window.location.hash = 'akha-result';
  } catch {
    error.textContent = 'ရက်စွဲနှင့် မြို့ကို ပြန်စစ်ပါ။';
  }
});

const bookCacheName = 'minastro-book-downloads-v1';
for (const link of byId('books').querySelectorAll('.book-download')) {
  if (!('caches' in window)) continue;
  const label = link.querySelector('span');
  const source = link.href;
  const filename = link.download;
  const status = byId('book-download-status');
  let downloaded = false;
  let busy = false;
  const markDownloaded = value => {
    downloaded = value;
    label.textContent = value ? 'Open' : 'Download PDF';
  };
  caches.open(bookCacheName).then(cache => cache.match(source)).then(response => {
    if (!busy) markDownloaded(Boolean(response));
  }).catch(() => { /* The download link remains available. */ });

  link.addEventListener('click', async event => {
    event.preventDefault();
    if (busy) return;
    const opening = downloaded;
    const viewer = opening ? window.open('about:blank', '_blank') : null;
    if (viewer) viewer.opener = null;
    busy = true;
    link.setAttribute('aria-busy', 'true');
    label.textContent = 'Loading…';
    status.textContent = opening ? 'စာအုပ်ဖွင့်နေပါသည်။' : 'စာအုပ် ဒေါင်းလုဒ်ဆွဲနေပါသည်။';
    try {
      const cache = await caches.open(bookCacheName);
      let response = await cache.match(source);
      if (!response) {
        response = await fetch(source);
        if (!response.ok || !response.headers.get('content-type')?.includes('application/pdf')) {
          throw new Error('PDF unavailable');
        }
        await cache.put(source, response.clone());
      }
      const objectURL = URL.createObjectURL(await response.blob());
      if (opening) {
        if (viewer) viewer.location.replace(objectURL);
        else window.location.assign(objectURL);
      } else {
        const download = document.createElement('a');
        download.href = objectURL;
        download.download = filename;
        document.body.append(download);
        download.click();
        download.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectURL), 60000);
      }
      markDownloaded(true);
      status.textContent = opening ? '' : 'ဒေါင်းလုဒ်ပြီးပါပြီ။';
    } catch {
      viewer?.close();
      markDownloaded(false);
      status.textContent = 'စာအုပ်ဖိုင်ကို ရယူ၍ မရပါ။ ထပ်မံကြိုးစားပါ။';
    } finally {
      busy = false;
      link.removeAttribute('aria-busy');
    }
  });
}

connectTownSearch('tri');
byId('tri-target-date').value = myanmarNow().slice(0, 10);
const triQuickStar = byId('tri-quick-star');
yatraNames.forEach((name, idx) => {
  triQuickStar.add(new Option(`${mm(idx + 1)}။ ${name}နက္ခတ်`, String(idx)));
});
triQuickStar.add(new Option('အဘိဇိနက္ခတ် (၂၈ လုံးမူ)', 'abhijit'));

let triHasResult = false;
let triCurrentTab = 'birth';
const triTabButtons = [...document.querySelectorAll('[data-tri-tab]')];

function showTriTab(tab) {
  triCurrentTab = tab;
  for (const button of triTabButtons) {
    const active = button.dataset.triTab === tab;
    button.setAttribute('aria-pressed', String(active));
  }
  byId('tri-panel-birth').hidden = tab !== 'birth';
  byId('tri-panel-quick').hidden = tab !== 'quick';
  byId('tri-panel-reference').hidden = tab !== 'reference';
  if (tab === 'reference' && !byId('tri-reference-content').childElementCount) {
    renderTripatakiReference();
  }
}

for (const button of triTabButtons) {
  button.addEventListener('click', () => showTriTab(button.dataset.triTab));
}

function buildTriHouseCard(planet, starIndices, names, startMatch, currentMatch, extraClass = '') {
  const cell = document.createElement('div');
  cell.className = 'tri-house' + (extraClass ? ' ' + extraClass : '')
    + (startMatch ? ' tri-house-natal' : '') + (currentMatch ? ' tri-house-current' : '');
  const header = document.createElement('div');
  header.className = 'tri-house-planet';
  header.textContent = tripatakiPlanetNames[planet] + 'ဂြိုဟ်ပိုင်';
  const badges = document.createElement('div');
  badges.className = 'tri-house-badges';
  if (startMatch) {
    const b = document.createElement('span');
    b.className = 'tri-badge tri-badge-natal';
    b.textContent = 'မူလ';
    badges.append(b);
  }
  if (currentMatch) {
    const b = document.createElement('span');
    b.className = 'tri-badge tri-badge-current';
    b.textContent = 'ရောက်ဆဲ';
    badges.append(b);
  }
  const list = document.createElement('ul');
  list.className = 'tri-house-stars';
  for (const idx of starIndices) {
    const li = document.createElement('li');
    li.textContent = names[idx];
    list.append(li);
  }
  cell.append(header);
  if (badges.childElementCount) cell.append(badges);
  cell.append(list);
  return cell;
}

function renderTriChakraDiagrams(container, result) {
  const wrap = document.createElement('div');
  wrap.className = 'tri-chakras';

  // 1. Ketu Pataki Chakra (Page 63 — 4x3 grid with blank center)
  const kpSection = document.createElement('section');
  kpSection.className = 'tri-chakra-card';
  const kpTitle = document.createElement('h3');
  kpTitle.textContent = 'ကေတုပတာကီစက်';
  const kpScroll = document.createElement('div');
  kpScroll.className = 'tri-board-scroll';
  const kpGrid = document.createElement('div');
  kpGrid.className = 'tri-board tri-ketupataki-grid';
  const kpCenter = document.createElement('div');
  kpCenter.className = 'tri-chakra-center tri-kp-center';
  kpCenter.setAttribute('aria-hidden', 'true');
  kpGrid.append(kpCenter);
  ketuPatakiHouses.forEach((h, i) => {
    const cell = buildTriHouseCard(
      h.planet, h.nakshatras, yatraNames,
      result && result.ketuPataki.startIndex === i,
      result && result.ketuPataki.currentIndex === i
    );
    cell.style.gridArea = h.area;
    kpGrid.append(cell);
  });
  kpScroll.append(kpGrid);
  kpSection.append(kpTitle, kpScroll);

  // 2. Guru Chakra (Page 64 — 5x2 horizontal grid)
  const guruSection = document.createElement('section');
  guruSection.className = 'tri-chakra-card';
  const guruTitle = document.createElement('h3');
  guruTitle.textContent = 'ဂုရုစက်';
  const guruScroll = document.createElement('div');
  guruScroll.className = 'tri-board-scroll';
  const guruGrid = document.createElement('div');
  guruGrid.className = 'tri-board tri-guru-grid';
  guruChakraHouses.forEach((h, i) => {
    const cell = buildTriHouseCard(
      h.planet, h.nakshatras, yatraNames,
      result && result.guruChakra.startIndex === i,
      result && result.guruChakra.currentIndex === i
    );
    cell.style.gridArea = h.area;
    guruGrid.append(cell);
  });
  guruScroll.append(guruGrid);
  guruSection.append(guruTitle, guruScroll);

  // 3. Ketu Chakra (Page 65 — 4x5 perimeter grid with blank center)
  const ketuSection = document.createElement('section');
  ketuSection.className = 'tri-chakra-card';
  const ketuTitle = document.createElement('h3');
  ketuTitle.textContent = 'ကေတုစက်';
  const ketuScroll = document.createElement('div');
  ketuScroll.className = 'tri-board-scroll';
  const ketuGrid = document.createElement('div');
  ketuGrid.className = 'tri-board tri-ketu-grid';
  const ketuCenter = document.createElement('div');
  ketuCenter.className = 'tri-chakra-center tri-ketu-center';
  ketuCenter.setAttribute('aria-hidden', 'true');
  ketuGrid.append(ketuCenter);
  ketuChakraGridHouses.forEach((h, i) => {
    const cell = buildTriHouseCard(
      h.planet, h.nakshatras, guruNames,
      result && result.ketuChakra.startIndex === i,
      result && result.ketuChakra.currentIndex === i,
      h.area === '2 / 4 / 5 / 5' ? 'tri-house-vcenter' : ''
    );
    cell.style.gridArea = h.area;
    ketuGrid.append(cell);
  });
  ketuScroll.append(ketuGrid);
  ketuSection.append(ketuTitle, ketuScroll);

  wrap.append(kpSection, guruSection, ketuSection);
  container.append(wrap);
}

function renderTripatakiResult({ star27Index, star28Index, starLabel, birthDateLabel, targetDateLabel, ageInfo, quickMode }) {
  const output = byId('tri-result');
  output.replaceChildren();
  const age = ageInfo.running;
  const res = tripatakiForAge(star27Index, star28Index, age);

  const overview = document.createElement('header');
  overview.className = 'akha-overview';
  const heading = document.createElement('h3');
  heading.textContent = starLabel;
  const ageLine = document.createElement('p');
  ageLine.textContent = quickMode
    ? `ရောက်ဆဲအသက် — ${mm(age)} နှစ် (${mm(age - 1)} နှစ်ပြည့်ပြီး ${mm(age)} နှစ်ထဲ)`
    : `ရောက်ဆဲအသက် — ${mm(age)} နှစ် (${mm(ageInfo.completed)} နှစ်ပြည့်ပြီး)`;
  overview.append(heading, ageLine);
  if (!quickMode) {
    const datesLine = document.createElement('p');
    datesLine.textContent = `မွေးသက္ကရာဇ် ${birthDateLabel} · စစ်ဆေးသည့်ရက် ${targetDateLabel} · အသက် ${mm(age)} နှစ်ကာလ (${mm(ageInfo.periodStart.split('-').reverse().join('/'))} – ${mm(ageInfo.periodEnd.split('-').reverse().join('/'))})`;
    overview.append(datesLine);
  }
  output.append(overview);

  const periodByKey = Object.fromEntries((ageInfo.periods || []).map(p => [p.key, p]));
  const fmtDate = iso => mm(iso.split('-').reverse().join('/'));
  const cards = document.createElement('div');
  cards.className = 'tri-summary-grid';
  for (const [key, title, periodLabel, cycleText, data] of [
    ['ketuPataki', 'ကေတုပတာကီစက်', 'ပထမလေးလ', '၉ နှစ်စက် (နာရီလက်တံ ပြောင်းပြန်)', res.ketuPataki],
    ['ketuChakra', 'ကေတုစက်', 'ဒုတိယလေးလ', '၁၂ နှစ်စက် (နာရီလက်တံ ပြောင်းပြန်)', res.ketuChakra],
    ['guruChakra', 'ဂုရုစက်', 'တတိယလေးလ', '၉ နှစ်စက် (နာရီလက်တံ ပြောင်းပြန်)', res.guruChakra],
  ]) {
    const period = periodByKey[key];
    const card = document.createElement('article');
    card.className = 'entry tri-planet-card' + (period?.active ? ' tri-planet-card-active' : '');
    const head = document.createElement('div');
    head.className = 'tri-card-head';
    const h = document.createElement('h3');
    h.textContent = title;
    head.append(h);
    if (period?.active) {
      const activeBadge = document.createElement('span');
      activeBadge.className = 'tri-period-badge';
      activeBadge.textContent = 'ရောက်ဆဲကာလ';
      head.append(activeBadge);
    }
    const periodLine = document.createElement('p');
    periodLine.className = 'tri-period-line';
    periodLine.textContent = !quickMode && period
      ? `${periodLabel} · ${fmtDate(period.start)} – ${fmtDate(period.end)}`
      : `${periodLabel} စိုးမိုးဂြိုဟ်`;
    const planet = document.createElement('p');
    planet.className = 'tri-planet-main';
    planet.textContent = `${tripatakiPlanetNames[data.planet]}ဂြိုဟ် (${mm(data.planet)})`;
    const readingBox = document.createElement('p');
    readingBox.className = 'tri-reading-box';
    readingBox.textContent = `ပုံသေအဟော — ${tripatakiSingleReadings[data.planet]}`;
    const roleNote = document.createElement('p');
    roleNote.className = 'tri-role-note';
    roleNote.textContent = tripatakiChakraRoles[key];
    const meta = document.createElement('p');
    meta.className = 'ruler';
    meta.textContent = `မူလအစဂြိုဟ် - ${tripatakiPlanetNames[data.startPlanet]}ဂြိုဟ် (${mm(data.startPlanet)}) · ${cycleText}`;
    card.append(head, periodLine, planet, readingBox, roleNote, meta);
    cards.append(card);
  }
  output.append(cards);

  const combos = tripatakiCombinationReadings(res);
  const comboPanel = document.createElement('section');
  comboPanel.className = 'entry tri-combo-panel';
  const comboTitle = document.createElement('h3');
  comboTitle.textContent = 'ပုံသေအဟော (တစ်နှစ်တာ ပေါင်းစပ်ချက်)';
  comboPanel.append(comboTitle);
  if (combos.length) {
    for (const item of combos) {
      const p = document.createElement('p');
      p.className = 'tri-combo-item';
      const strong = document.createElement('strong');
      strong.textContent = `${item.label} (${mm(item.planet)}) — `;
      p.append(strong, item.reading);
      comboPanel.append(p);
    }
  } else {
    const p = document.createElement('p');
    p.textContent = 'ဤအသက်တွင် စက်သုံးခုလုံး၏ စိုးမိုးဂြိုဟ်များ တစ်လုံးစီ ကွဲပြားနေပါသည်။ လေးလပိုင်းအလိုက် သက်ဆိုင်ရာ တစ်လုံးချင်း ပုံသေအဟောများကို တွဲဖက်ကြည့်ရှုပါ။';
    comboPanel.append(p);
  }
  const balanceNote = document.createElement('p');
  balanceNote.className = 'hint';
  balanceNote.textContent = 'မှတ်ချက် — ပုံသေအဟောတစ်ခုတည်းသာမက မူလဇာတာနှင့် ကောဇာဇာတာတွင် အဆိုပါ စိုးမိုးဂြိုဟ်များ ရပ်တည်နေပုံ (ဥစ်/နိစ်/ကသစ် စသည်) နှင့် ညှိနှိုင်းဟောကြားမှသာ ပိုမိုမှန်ကန်ပါသည်။';
  comboPanel.append(balanceNote);
  output.append(comboPanel);

  renderTriChakraDiagrams(output, res);

  const cycleTitle = document.createElement('h3');
  cycleTitle.className = 'tri-section-title';
  cycleTitle.textContent = `${starLabel} · အသက် ၁ မှ ၁၀၀ စိုးမိုးဂြိုဟ်ဇယား (၃၆ နှစ်စက်ဝန်း)`;
  output.append(cycleTitle);

  const scroll = document.createElement('div');
  scroll.className = 'tri-table-scroll';
  const table = document.createElement('table');
  table.className = 'tri-cycle-table';
  const thead = table.createTHead().insertRow();
  for (const label of ['ရောက်ဆဲအသက်', 'ကေတုပတာကီစက်', 'ကေတုစက်', 'ဂုရုစက်']) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = label;
    thead.append(th);
  }
  const tbody = table.createTBody();
  const activeCycleSlot = ((age - 1) % 36) + 1;
  for (let c = 1; c <= 36; c++) {
    const row = tbody.insertRow();
    if (c === activeCycleSlot) row.className = 'tri-row-active';
    const ages = [c, c + 36, c + 72].filter(a => a <= 100);
    const ageCell = document.createElement('th');
    ageCell.scope = 'row';
    ageCell.textContent = ages.map(a => mm(a)).join(' / ');
    row.append(ageCell);
    const r = tripatakiForAge(star27Index, star28Index, c);
    for (const p of [r.ketuPataki.planet, r.ketuChakra.planet, r.guruChakra.planet]) {
      row.insertCell().textContent = `${tripatakiPlanetNames[p]} (${mm(p)})`;
    }
  }
  scroll.append(table);
  output.append(scroll);
}

function renderTripatakiReference() {
  const container = byId('tri-reference-content');
  container.replaceChildren();

  const legend = document.createElement('p');
  legend.className = 'hint';
  legend.textContent = 'ဂြိုဟ်အမှတ်အသား — ' + Object.entries(tripatakiPlanetNames).map(([n, name]) => `${mm(n)} = ${name}`).join(' · ') + '။ (အကွက်တစ်ခုစီတွင် အပေါ် = ကေတုပတာကီ၊ အလယ် = ကေတုစက်၊ အောက် = ဂုရုစက်)';
  container.append(legend);

  renderTriChakraDiagrams(container, null);

  const readingsTitle = document.createElement('h3');
  readingsTitle.className = 'tri-section-title';
  readingsTitle.textContent = 'ပုံသေအဟောများ (တစ်လုံး / နှစ်လုံး / သုံးလုံး)';
  container.append(readingsTitle);
  const rScroll = document.createElement('div');
  rScroll.className = 'tri-table-scroll';
  const rTable = document.createElement('table');
  rTable.className = 'tri-readings-table';
  const rHead = rTable.createTHead().insertRow();
  for (const col of ['ဂြိုဟ်', 'တစ်လုံး', 'နှစ်လုံးတူ', 'သုံးလုံးတူ']) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = col;
    rHead.append(th);
  }
  const rBody = rTable.createTBody();
  for (let p = 1; p <= 9; p++) {
    const row = rBody.insertRow();
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = `${tripatakiPlanetNames[p]} (${mm(p)})`;
    row.append(th);
    row.insertCell().textContent = tripatakiSingleReadings[p];
    row.insertCell().textContent = tripatakiDoubleReadings[p];
    row.insertCell().textContent = tripatakiTripleReadings[p];
  }
  rScroll.append(rTable);
  container.append(rScroll);

  const tableTitle = document.createElement('h3');
  tableTitle.className = 'tri-section-title';
  tableTitle.textContent = 'တြိပတာကီစက် ဇယားအပြည့်အစုံ (နက္ခတ် ၂၇ လုံး · အသက် ၁ – ၁၀၀)';
  container.append(tableTitle);

  for (const [label, startCol, endCol] of [
    ['အသက် ၁–၁၂ / ၃၇–၄၈ / ၇၃–၈၄', 1, 12],
    ['အသက် ၁၃–၂၅ / ၄၉–၆၁ / ၈၅–၉၇', 13, 25],
    ['အသက် ၂၆–၃၆ / ၆၂–၇၂ / ၉၈–၁၀၀', 26, 36],
  ]) {
    const sub = document.createElement('h4');
    sub.textContent = label;
    container.append(sub);
    const scroll = document.createElement('div');
    scroll.className = 'tri-table-scroll';
    const table = document.createElement('table');
    table.className = 'tri-ref-table';
    const thead = table.createTHead().insertRow();
    const corner = document.createElement('th');
    corner.scope = 'col';
    corner.textContent = 'နေမနက္ခတ် \ အသက်';
    thead.append(corner);
    for (let c = startCol; c <= endCol; c++) {
      const th = document.createElement('th');
      th.scope = 'col';
      const ages = [c, c + 36, c + 72].filter(a => a <= 100);
      th.innerHTML = ages.map(a => mm(a)).join('<br>');
      thead.append(th);
    }
    const tbody = table.createTBody();
    yatraNames.forEach((starName, star27Index) => {
      const star28Index = star27Index + (star27Index >= 21 ? 1 : 0);
      const row = tbody.insertRow();
      const th = document.createElement('th');
      th.scope = 'row';
      th.textContent = starName;
      row.append(th);
      for (let c = startCol; c <= endCol; c++) {
        const r = tripatakiForAge(star27Index, star28Index, c);
        const td = row.insertCell();
        td.innerHTML = `${mm(r.ketuPataki.planet)}<br>${mm(r.ketuChakra.planet)}<br>${mm(r.guruChakra.planet)}`;
      }
    });
    scroll.append(table);
    container.append(scroll);
  }
}

byId('tripataki-form').addEventListener('submit', event => {
  event.preventDefault();
  const error = byId('tri-error');
  try {
    const birthInstant = readBirthInstant('tri');
    const pad = n => String(n).padStart(2, '0');
    const bd = `${ascii(byId('tri-year').value.trim())}-${pad(Number(ascii(byId('tri-month').value.trim())))}-${pad(Number(ascii(byId('tri-day').value.trim())))}`;
    const targetDate = byId('tri-target-date').value;
    const ageInfo = runningAgeAt(bd, targetDate);
    const moon27 = janmaAt(birthInstant);
    const moon28 = upagraha28At(birthInstant, true);
    const birthDateLabel = mm(bd.split('-').reverse().join('/'));
    const targetDateLabel = mm(targetDate.split('-').reverse().join('/'));
    const starLabel = moon28.index === 21
      ? `ဥတြာသာန် / အဘိဇိနက္ခတ် · ပါဒ ${mm(moon27.pada)}`
      : `${yatraNames[moon27.index]}နက္ခတ် · ပါဒ ${mm(moon27.pada)}`;
    renderTripatakiResult({
      star27Index: moon27.index,
      star28Index: moon28.index,
      starLabel,
      birthDateLabel,
      targetDateLabel,
      ageInfo,
      quickMode: false,
    });
    error.textContent = '';
    triHasResult = true;
    saveChart('tripataki');
    window.location.hash = 'tripataki-result';
  } catch (err) {
    error.textContent = err instanceof RangeError && err.message.includes('Target date')
      ? 'စစ်ဆေးလိုသည့် ရက်စွဲသည် မွေးသက္ကရာဇ်ထက် နောက်ကျရမည်။'
      : 'မွေးရက်၊ မွေးချိန်နှင့် စစ်ဆေးလိုသည့် ရက်စွဲကို ပြန်စစ်ပါ။';
  }
});

byId('tri-quick-form').addEventListener('submit', event => {
  event.preventDefault();
  const val = triQuickStar.value;
  const age = Math.max(1, Math.min(100, Number(byId('tri-quick-age').value) || 1));
  const isAbhijit = val === 'abhijit';
  const star27Index = isAbhijit ? 20 : Number(val);
  const star28Index = isAbhijit ? 21 : star27Index + (star27Index >= 21 ? 1 : 0);
  const starLabel = isAbhijit ? 'အဘိဇိနက္ခတ် (၂၈ လုံးမူ)' : `${yatraNames[star27Index]}နက္ခတ်`;
  renderTripatakiResult({
    star27Index,
    star28Index,
    starLabel,
    ageInfo: { running: age, completed: age - 1 },
    quickMode: true,
  });
  triHasResult = true;
  window.location.hash = 'tripataki-result';
});

let wishTransitInstant;

function buildWishCompassSvg(selfAngle, blessingAngle) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '-36 -14 332 288');
  svg.setAttribute('class', 'wish-compass-svg');
  svg.setAttribute('aria-label', 'အရပ် ၈ မျက်နှာ သံလိုက်အိမ်မြှောင်');
  const cx = 130, cy = 130, r = 86;
  const ring = document.createElementNS(ns, 'circle');
  ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('r', r);
  ring.setAttribute('fill', '#ffffff'); ring.setAttribute('stroke', '#9fcce8'); ring.setAttribute('stroke-width', '2');
  svg.append(ring);
  const inner = document.createElementNS(ns, 'circle');
  inner.setAttribute('cx', cx); inner.setAttribute('cy', cy); inner.setAttribute('r', 44);
  inner.setAttribute('fill', 'none'); inner.setAttribute('stroke', '#d7ebf8'); inner.setAttribute('stroke-dasharray', '3 3');
  svg.append(inner);
  const labels = [
    [0, 'မြောက်'], [45, 'အရှေ့မြောက်'], [90, 'အရှေ့'], [135, 'အရှေ့တောင်'],
    [180, 'တောင်'], [225, 'အနောက်တောင်'], [270, 'အနောက်'], [315, 'အနောက်မြောက်'],
  ];
  for (const [deg, text] of labels) {
    const rad = (deg - 90) * Math.PI / 180;
    const tick = document.createElementNS(ns, 'line');
    tick.setAttribute('x1', cx + Math.cos(rad) * (r - 6));
    tick.setAttribute('y1', cy + Math.sin(rad) * (r - 6));
    tick.setAttribute('x2', cx + Math.cos(rad) * r);
    tick.setAttribute('y2', cy + Math.sin(rad) * r);
    tick.setAttribute('stroke', '#647889'); tick.setAttribute('stroke-width', '1.5');
    svg.append(tick);
    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', cx + Math.cos(rad) * (r + 22));
    lbl.setAttribute('y', cy + Math.sin(rad) * (r + 22) + 4);
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('class', 'wish-compass-label');
    lbl.textContent = text;
    svg.append(lbl);
  }
  const drawArrow = (deg, color, len) => {
    const rad = (deg - 90) * Math.PI / 180;
    const x2 = cx + Math.cos(rad) * len;
    const y2 = cy + Math.sin(rad) * len;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', cx); line.setAttribute('y1', cy);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', color); line.setAttribute('stroke-width', '4');
    line.setAttribute('stroke-linecap', 'round');
    const headLen = 11;
    const a1 = rad + Math.PI * 0.82;
    const a2 = rad - Math.PI * 0.82;
    const poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', `${x2},${y2} ${x2 + Math.cos(a1) * headLen},${y2 + Math.sin(a1) * headLen} ${x2 + Math.cos(a2) * headLen},${y2 + Math.sin(a2) * headLen}`);
    poly.setAttribute('fill', color);
    svg.append(line, poly);
  };
  drawArrow(selfAngle, '#15547b', r - 12);
  drawArrow(blessingAngle, '#854078', r - 22);
  const dot = document.createElementNS(ns, 'circle');
  dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('r', 5);
  dot.setAttribute('fill', '#142e45');
  svg.append(dot);
  return svg;
}

function renderWishDirection(instant = wishTransitInstant || new Date()) {
  const live = byId('wish-live');
  const tableWrap = byId('wish-table');
  live.replaceChildren();
  const moon = janmaAt(instant);
  const info = wishDirectionForNakshatra(moon.index);
  const { entry, exit } = solarNakshatraWindow(instant, janmaAt);
  const fullFmt = new Intl.DateTimeFormat('my-MM', { timeZone: 'Asia/Yangon', dateStyle: 'full', timeStyle: 'short' });
  const timeFmt = new Intl.DateTimeFormat('my-MM', { timeZone: 'Asia/Yangon', dateStyle: 'medium', timeStyle: 'medium' });

  const overview = document.createElement('header');
  overview.className = 'akha-overview';
  const h = document.createElement('h3');
  h.textContent = `${yatraNames[moon.index]}နက္ခတ် · ပါဒ ${mm(moon.pada)}`;
  const atLine = document.createElement('p');
  atLine.textContent = `ကြည့်ရှုချိန် — ${timeFmt.format(instant)} (မြန်မာစံတော်ချိန်) · ကောဇာစန်း လောင်ဂျီတွဒ် ${mm(moon.longitude.toFixed(4))}°`;
  const winLine = document.createElement('p');
  winLine.textContent = `ကောဇာစန်း နက္ခတ်ကာလ — ${fullFmt.format(entry)} မှ ${fullFmt.format(exit)} အထိ`;
  overview.append(h, atLine, winLine);
  live.append(overview);

  const grid = document.createElement('div');
  grid.className = 'wish-summary-grid';
  const selfCard = document.createElement('article');
  selfCard.className = 'entry wish-card-self';
  selfCard.innerHTML = `<h3>မိမိအတွက် ဆုတောင်းပြည့် အရပ်မျက်နှာ</h3><p class="wish-dir-main">${info.selfText}</p><p class="hint">မိမိ လိုရာ ဆုတစ်ခုတည်းကိုသာ တောင်းပါ။</p>`;
  const blessCard = document.createElement('article');
  blessCard.className = 'entry wish-card-blessing';
  blessCard.innerHTML = `<h3>သူတစ်ပါးကို ဆုပေးလျှင်လည်း ပြည့်စေသော အရပ်</h3><p class="wish-dir-main">${info.blessingText}</p><p class="hint">သူတစ်ပါးကို ဆုပေးရန်နှင့် မိမိအတွက်ပါ အသုံးပြုနိုင်ပါသည်။</p>`;
  grid.append(selfCard, blessCard);
  live.append(grid);

  const compassWrap = document.createElement('div');
  compassWrap.className = 'wish-compass-wrap';
  compassWrap.append(buildWishCompassSvg(info.selfAngle, info.blessingAngle));
  const legend = document.createElement('p');
  legend.className = 'wish-legend';
  legend.innerHTML = '<span class="wish-dot-self">●</span> မိမိအတွက် ဆုတောင်းရန် &nbsp;&nbsp; <span class="wish-dot-blessing">●</span> သူတစ်ပါးကို ဆုပေးရန် / မိမိအတွက်';
  compassWrap.append(legend);
  live.append(compassWrap);

  const table = document.createElement('table');
  table.className = 'tri-readings-table wish-table';
  const thead = table.createTHead().insertRow();
  for (const col of ['စဉ်', 'ကောဇာ စန်းယှဉ်နက္ခတ်', 'မိမိအတွက် ဆုတောင်းရန်', 'သူတစ်ပါးကို ဆုပေးရန် (မိမိအတွက်လည်းရ)']) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = col;
    thead.append(th);
  }
  const tbody = table.createTBody();
  yatraNames.forEach((name, idx) => {
    const row = tbody.insertRow();
    if (idx === moon.index) row.className = 'tri-row-active';
    row.insertCell().textContent = mm(idx + 1);
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = name + 'နက္ခတ်' + (idx === moon.index ? ' (ရောက်ဆဲ)' : '');
    row.append(th);
    row.insertCell().textContent = wishSelfDirections[idx] + ' မျက်နှာမူပါ။';
    row.insertCell().textContent = wishBlessingDirections[idx] + ' မျက်နှာမူပါ။';
  });
  tableWrap.replaceChildren(table);
}

byId('wish-time-form').addEventListener('submit', event => {
  event.preventDefault();
  const err = byId('wish-time-error');
  try {
    const [d, t] = byId('wish-custom-time').value.split('T');
    wishTransitInstant = myanmarBirthInstant(d, t);
    err.textContent = '';
    renderWishDirection(wishTransitInstant);
  } catch {
    err.textContent = 'ရွေးထားသည့် ရက်နှင့် အချိန်ကို ပြန်စစ်ပါ။';
  }
});

byId('wish-now').addEventListener('click', () => {
  wishTransitInstant = undefined;
  byId('wish-custom-time').value = '';
  byId('wish-time-error').textContent = '';
  renderWishDirection(new Date());
});

function showPage() {
  const rawHash = window.location.hash.slice(1);
  const hash = ['practice', 'yatra7', 'yatra-food', 'yatra8'].includes(rawHash) ? 'yatra'
    : ['suriya-result', 'guru-result', 'upagraha-result', 'upagraha28-result', 'tripataki-result', 'panchang-result', 'akha-result'].includes(rawHash) ? rawHash.slice(0, -7) : rawHash;
  const route = /^nakshatra\/([0-6])\/([1-9]|[12][0-9]|30)\/(calculator|catalog)$/.exec(hash);
  const entry = route && catalogs[Number(route[1])]?.[Number(route[2]) - 1];
  const yatraTabs = byId('yatra-tabs');
  const yatraLinks = [...yatraTabs.querySelectorAll('[data-yatra-tab]')];
  const isYatraPage = yatraLinks.some(link => link.dataset.yatraTab === hash);
  const generalTabs = byId('general-tabs');
  const generalLinks = [...generalTabs.querySelectorAll('[data-yatra-tab]')];
  const isGeneralPage = generalLinks.some(link => link.dataset.yatraTab === hash);
  const page = entry ? 'nakshatra-detail'
    : ['catalog', 'calculator', 'suriya', 'guru', 'upagraha', 'upagraha28', 'tripataki', 'wish', 'panchang', 'akha', 'saved', 'books'].includes(hash) || isGeneralPage || isYatraPage ? hash : 'home';
  byId('akha').hidden = page !== 'akha';
  const showAkhaResult = rawHash === 'akha-result' && akhaHasResult;
  byId('akha-form-title').hidden = showAkhaResult;
  byId('akha-form').hidden = showAkhaResult;
  byId('akha-output').hidden = !showAkhaResult;
  if (showAkhaResult) byId('akha-output-title').focus();
  else if (rawHash === 'akha-result') window.history.replaceState(null, '', '#akha');
  byId('panchang').hidden = page !== 'panchang';
  const showPanchangResult = page === 'panchang' && rawHash === 'panchang-result' && panchangHasResult;
  byId('panchang-form').hidden = showPanchangResult;
  byId('panchang-error').hidden = showPanchangResult;
  byId('panchang-output').hidden = !showPanchangResult;
  if (showPanchangResult) byId('panchang-output-title').focus();
  else if (rawHash === 'panchang-result') window.history.replaceState(null, '', '#panchang');
  const isUpa = page === 'upagraha' || page === 'upagraha28';
  if (isUpa && upaMode !== page) {
    upaTransitInstant = undefined;
    byId('upa-transit-time').value = '';
    byId('upa-transit-error').textContent = '';
  }
  if (isUpa) upaMode = page;
  byId('upa-title').textContent = upaMode === 'upagraha28' ? 'ဥပဂြဟ (၂၈) လုံးမူ' : 'ဥပဂြဟ (၂၇) လုံးမူ';
  byId('upa-edit').href = '#' + upaMode;
  byId('upagraha').hidden = !isUpa;
  const showUpaResult = isUpa && rawHash === page + '-result' && upaHasResult && upaResultMode === page;
  byId('upagraha-form').hidden = showUpaResult;
  byId('upa-output').hidden = !showUpaResult;
  for (const details of byId('upagraha').querySelectorAll(':scope > details')) details.hidden = !showUpaResult;
  if (showUpaResult) byId('upa-output-title').focus();
  else if (isUpa && rawHash.endsWith('-result')) window.history.replaceState(null, '', '#' + page);
  const isHome = page === 'home';
  byId('home').hidden = !isHome;
  byId('saved-chart-link').hidden = !isHome;
  const isBooks = page === 'books';
  byId('books').hidden = !isBooks;
  if (isBooks) byId('books-title').focus();
  const isSaved = page === 'saved';
  byId('saved-charts').hidden = !isSaved;
  if (isSaved) renderSavedCharts();
  if (page === 'calculator' && !restoringChart) {
    lastUpdate = '';
    updateResult();
  }
  byId('back-home').hidden = isHome;
  const isSuriya = page === 'suriya' || page === 'guru';
  if (isSuriya) selectChart(page);
  byId('suriya').hidden = !isSuriya;
  const showSuriyaResult = isSuriya && rawHash === page + '-result' && resultMode === page && birthStarIndex !== undefined;
  byId('janma-form').hidden = showSuriyaResult;
  byId('suriya-output').hidden = !showSuriyaResult;
  if (showSuriyaResult) byId('suriya-output-title').focus();
  else if (isSuriya && rawHash.endsWith('-result')) window.history.replaceState(null, '', '#' + page);
  byId('tripataki').hidden = page !== 'tripataki';
  const showTriResult = page === 'tripataki' && rawHash === 'tripataki-result' && triHasResult;
  byId('tripataki').querySelector('.tri-mode-tabs').hidden = showTriResult;
  byId('tri-panel-birth').hidden = showTriResult || triCurrentTab !== 'birth';
  byId('tri-panel-quick').hidden = showTriResult || triCurrentTab !== 'quick';
  byId('tri-panel-reference').hidden = showTriResult || triCurrentTab !== 'reference';
  byId('tripataki-output').hidden = !showTriResult;
  if (showTriResult) byId('tri-output-title').focus();
  else if (page === 'tripataki' && rawHash === 'tripataki-result') window.history.replaceState(null, '', '#tripataki');
  byId('wish').hidden = page !== 'wish';
  if (page === 'wish') {
    renderWishDirection();
    byId('wish-title').focus();
  }
  byId('nadika-hero').hidden = isHome || isSuriya || isUpa || isYatraPage || page === 'tripataki' || page === 'wish' || page === 'panchang' || page === 'akha' || isSaved || isBooks;
  byId('nadika-tabs').hidden = isHome || isSuriya || isUpa || isYatraPage || page === 'tripataki' || page === 'wish' || page === 'panchang' || page === 'akha' || isSaved || isBooks;
  byId('nakshatra-detail').hidden = !entry;
  if (entry) {
    renderNakshatraDetail(entry, route[3]);
    byId('nakshatra-title').focus();
  }
  yatraTabs.hidden = true;
  generalTabs.hidden = !isGeneralPage;
  for (const link of [...yatraLinks, ...generalLinks]) {
    const active = yatraLinks.includes(link) ? isYatraPage && link.dataset.yatraTab === 'yatra' : link.dataset.yatraTab === page;
    byId(link.dataset.yatraTab).hidden = !active;
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  byId('calculator').hidden = page !== 'calculator';
  byId('calculator-intro').hidden = page !== 'calculator';
  byId('catalog').hidden = page !== 'catalog';
  for (const link of document.querySelectorAll('[data-page]')) {
    if (link.dataset.page === page || (link.dataset.page === 'yatras' && isYatraPage) || (link.dataset.page === 'general' && isGeneralPage)) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

byId('yatra-entries').replaceChildren(...guruNames.map(name => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'entry star-list-button';
  button.dataset.starInformation = name;
  button.setAttribute('aria-haspopup', 'dialog');
  button.textContent = name + 'နက္ခတ်';
  return button;
}));
const starDialog = document.createElement('dialog');
starDialog.id = 'star-information';
const starDialogTitle = document.createElement('h2');
const starDialogBody = document.createElement('div');
const starClose = document.createElement('button');
starClose.textContent = 'ပိတ်ရန်';
starClose.addEventListener('click', () => starDialog.close());
starDialog.append(starDialogTitle, starDialogBody, starClose);
document.body.append(starDialog);
function openStarInformation(name) {
  const index = yatraNames.indexOf(name);
  starDialogTitle.textContent = name + 'နက္ခတ်';
  starDialogBody.replaceChildren();
  const wishDescriptions = yatraNames.map((_, idx) => `မိမိအတွက် ဆုတောင်းရန် — ${wishSelfDirections[idx]} မျက်နှာမူပါ။\nသူတစ်ပါးကို ဆုပေးရန် (မိမိအတွက်လည်း သုံးနိုင်) — ${wishBlessingDirections[idx]} မျက်နှာမူပါ။`);
  const sets = [wishDescriptions, yatraDescriptions, yatra2Descriptions, yatra3Descriptions, yatra4Descriptions, yatra5Descriptions, yatra6Descriptions, yatra7Descriptions, yatra8Descriptions, foodDescriptions];
  const titles = ['ဆုတောင်းပြည့် အရပ်မျက်နှာ (ကောဇာစန်းယှဉ် · အခန်း ၃၀)', 'ဇောတိတတ္ထ နိဿရည်းကျမ်းမှ နက္ခတ်ယတြာ', 'နက္ခတ်ညံ့လျှင် လုပ်ရသော ယတြာများ', 'နက္ခတ် ညံ့လျှင် လုပ်ရသော ယတြာများ (မူကွဲ)', 'နက္ခတ်ကောင်းကျိုးရစေသော ယတြာများ', 'နက္ခတ်၏ ထူးခြားသော စနစ်တစ်ခု', yatra6Title, yatra7Title, yatra8Title, foodTitle];
  titles.forEach((title, position) => {
    const value = index >= 0 ? sets[position][index]
      : position === 3 ? abhijit.querySelector('p').textContent : position === 7 ? 'ထောပတ်ထမင်း။' : position === 8 ? yatra8Groups[0][1] : '';
    if (!value) return;
    const heading = document.createElement('h3');
    heading.textContent = title;
    const text = document.createElement('p');
    text.textContent = value;
    starDialogBody.append(heading, text);
  });
  if (!starDialogBody.childElementCount) starDialogBody.textContent = 'ဤနက္ခတ်အတွက် ထည့်သွင်းထားသော အချက်အလက် မရှိသေးပါ။';
  if (!starDialog.open) starDialog.showModal();
}
document.addEventListener('click', event => {
  const link = event.target.closest('[data-star-information]');
  if (!link) return;
  event.preventDefault();
  openStarInformation(link.dataset.starInformation);
});
// မူလ is also a natal label. Link it only where a calculated star is known.
const starNames = [...yatraNames.filter(name => name !== 'မူလ'), 'အဘိဇိ'].sort((a, b) => b.length - a.length);
const starPattern = new RegExp('(' + starNames.join('|') + ')(နက္ခတ်)?', 'gu');
function linkStarNames(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement.closest('a, button, select, input, textarea, script, style, svg, #star-information, #akha')) nodes.push(node);
  }
  for (const node of nodes) {
    const text = node.textContent;
    const matches = [...text.matchAll(starPattern)];
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const match of matches) {
      fragment.append(text.slice(cursor, match.index));
      const link = document.createElement('a');
      link.href = '#';
      link.dataset.starInformation = match[1];
      link.textContent = match[0];
      fragment.append(link);
      cursor = match.index + match[0].length;
    }
    fragment.append(text.slice(cursor));
    node.replaceWith(fragment);
  }
}
linkStarNames(document.querySelector('main'));
const starObserver = new MutationObserver(records => {
  starObserver.disconnect();
  for (const record of records) {
    if (record.type === 'characterData') linkStarNames(record.target.parentElement);
    else for (const node of record.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) linkStarNames(node);
      else if (node.nodeType === Node.TEXT_NODE && node.parentElement) linkStarNames(node.parentElement);
    }
  }
  starObserver.observe(document.querySelector('main'), {childList:true, subtree:true, characterData:true});
});
starObserver.observe(document.querySelector('main'), {childList:true, subtree:true, characterData:true});

window.addEventListener('hashchange', showPage);
showPage();
