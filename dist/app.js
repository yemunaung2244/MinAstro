import { janmaAt, myanmarBirthInstant, solarNakshatraAt, suriyaSlot } from './janma.js';
import { foodTitle, foodDescriptions } from './yatra-food.js';
import { catalogs, getRuler, myanmarUtcOffset, nadikaPractices, solarTimes, toMinutes, windowsFor } from './nadika.js';
import { yatra6Title, yatra6Descriptions } from './yatra6.js';

const byId = (id) => document.getElementById(id);
const effectText = (name, effect) => {
  const practice = nadikaPractices.get(name);
  return practice ? effect + '\n\n' + practice : effect;
};
const weekdays = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
const planetName = (number) => weekdays[number - 1] + 'ဂြိုဟ်';
// ချိုးရေ စီရင်နည်း၊ အခန်း ၁၂
const planetMaterials = [
  ['ကုံကုမံ', 'ကြာပွင့်', 'နွယ်ချို', 'ဖလာ', 'အနီရောင်ရှိသည့် မည်သည့်ပန်းမဆို'],
  ['ဟိန္ဒူဘာသာရေး အခမ်းအနားတွေမှာသုံးတဲ့ ခရုသင်းထဲ ထည့်ထားတဲ့ရေ', 'ကျောက်ချဉ်', 'ဥသျှစ်ရွက်', 'ကြာပွင့်'],
  ['ခရမ်းပင်၏ အမြစ်', 'ဥသျှစ်ရွက်', 'ဆီးဖြူသီး', 'ဆီးဖြူရွက်', 'ကုံကုမံ'],
  ['ကြာစေ့', 'ကုံကုမံ', 'ဆန်', 'ပျားရည်'],
  ['မုန်ညင်းစေ့ အဝါ', 'နွယ်ချို', 'ပျားရည်', 'ဆီးဖြူသီး'],
  ['စမုန်စပါး', 'ဖလာ', 'ကုံကုမံ'],
  ['ဒန်းပင်၏ ရရာ အစိတ်အပိုင်း။ ဆေးဆိုးသော ဒန်းမှုန့်အသန့်ရလျှင် အကောင်းဆုံး။ ဒန်းမြစ်သည် ဒုတိယ အကောင်းဆုံး။'],
];

function materialList(number) {
  const list = document.createElement('ol');
  list.className = 'planet-materials';
  for (const [index, material] of planetMaterials[number - 1].entries()) {
    const item = document.createElement('li');
    item.textContent = `${mm(index + 1)}။ ${material}`;
    list.append(item);
  }
  return list;
}

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
  byId('result-materials').replaceChildren(materialList(ruler));
  tag(byId('result-tag'), type);
  nameLink.textContent = name;
  nameLink.href = route;
  content.hidden = false;
  status.hidden = true;
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
    const materials = card.querySelector('.entry-materials');
    for (const [period, label] of [['day', 'နေ့ပိုင်း'], ['night', 'ညပိုင်း']]) {
      const ruler = getRuler(weekday, id, period);
      const heading = document.createElement('p');
      heading.textContent = `${label} - ${planetName(ruler)}`;
      materials.append(heading, materialList(ruler));
    }
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
  if (event.target === slotMode) {
    catalogSlotMode.value = slotMode.value;
    localStorage.setItem('nadika-slot-mode', slotMode.value);
  }
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
setInterval(() => {
  if (timeMode.value === 'live') updateResult();
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
  const descriptions = [yatraDescriptions, yatra2Descriptions, yatra3Descriptions, yatra4Descriptions, yatra5Descriptions, yatra6Descriptions, yatra7Descriptions, yatra8Descriptions, foodDescriptions];
  const titles = ["ဇောတိတတ္ထ နိဿရည်းကျမ်းမှ နက္ခတ်ယတြာ", "နက္ခတ်ညံ့လျှင် လုပ်ရသော ယတြာများ", "နက္ခတ် ညံ့လျှင် လုပ်ရသော ယတြာများ။ (မူကွဲ။)", "နက္ခတ်ကောင်းကျိုးရစေသော ယတြာများ", "နက္ခတ်၏ ထူးခြားသော စနစ်တစ်ခု", yatra6Title, yatra7Title, yatra8Title, foodTitle];
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
const suriyaRegionForStar = suriyaRegions.flatMap(([, count], index) => Array(count).fill(index));

function renderSuriyaStars(sunIndex) {
  const markers = byId('suriya-all-markers');
  markers.replaceChildren();
  const svg = 'http://www.w3.org/2000/svg';
  suriyaRegionForStar.forEach((regionIndex, slot) => {
    const left = slot % 2 === 0;
    const rowY = 13 + Math.floor(slot / 2) * 25;
    const [x, y] = suriyaRegions[regionIndex][2][0];
    const arrow = document.createElementNS(svg, 'path');
    arrow.setAttribute('d', `M ${left ? -4 : 244} ${rowY} L ${x} ${y}`);
    arrow.setAttribute('class', 'suriya-star-line');
    arrow.setAttribute('marker-end', 'url(#suriya-neutral-arrowhead)');
    const label = document.createElementNS(svg, 'text');
    label.setAttribute('x', left ? -84 : 324);
    label.setAttribute('y', rowY + 3);
    label.setAttribute('text-anchor', left ? 'start' : 'end');
    label.setAttribute('class', 'suriya-marker-label');
    label.textContent = yatraNames[(sunIndex + slot) % yatraNames.length];
    const group = document.createElementNS(svg, 'g');
    group.setAttribute('role', 'button');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', label.textContent + ' အဟော');
    const showReading = () => {
      byId('suriya-star-title').textContent = label.textContent + ' — ' + suriyaRegions[regionIndex][0];
      byId('suriya-star-reading').textContent = suriyaReadings[regionIndex];
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
    group.append(arrow, label);
    markers.append(group);
  });
}

function highlightSuriyaSlot(slot, kind) {
  const group = byId('suriya-all-markers').children[slot];
  if (group) group.classList.add(kind);
}

function updateSuriya(starIndex, sunIndex) {
  const regionIndex = suriyaRegionForStar[suriyaSlot(starIndex, sunIndex)];
  const region = suriyaRegions[regionIndex];
  const starName = yatraNames[starIndex];
  byId('suriya-result').textContent = starName + ' — ' + region[0];
  byId('suriya-reading').hidden = false;
  byId('suriya-reading-text').textContent = suriyaReadings[regionIndex];
  renderSuriyaStars(sunIndex);
  highlightSuriyaSlot(suriyaSlot(starIndex, sunIndex), 'natal-marker');
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

for (const [tab, readings] of [['natal', suriyaReadings], ['transit', suriyaReadings]]) {
  for (const [index, reading] of Object.entries(readings)) {
    const card = document.createElement('article');
    card.className = 'entry';
    const heading = document.createElement('h3');
    heading.textContent = suriyaRegions[index][0];
    const paragraph = document.createElement('p');
    paragraph.textContent = reading;
    card.append(heading, paragraph);
    byId('reading-' + tab).append(card);
  }
}

let birthStarIndex;
const gozaResult = byId('goza-result');
function updateGoza(natalSunIndex) {
  const instant = new Date();
  byId('goza-time').textContent = new Intl.DateTimeFormat('my-MM', {
    timeZone: 'Asia/Yangon', dateStyle: 'medium', timeStyle: 'short',
  }).format(instant) + ' (မြန်မာစံတော်ချိန်)';
  byId('goza-panel').hidden = false;
  try {
    const sun = solarNakshatraAt(instant);
    const slot = suriyaSlot(birthStarIndex, sun.index);
    const regionIndex = suriyaRegionForStar[slot];
    highlightSuriyaSlot(slot, 'goza-marker');
    const position = document.createElement('p');
    const starName = yatraNames[(natalSunIndex + slot) % yatraNames.length];
    position.textContent = 'ကောဇာအရ ဇနမနက္ခတ် — ' + starName + '။';
    const reading = document.createElement('p');
    reading.textContent = suriyaReadings[regionIndex];
    gozaResult.replaceChildren(position, reading);
  } catch {
    gozaResult.textContent = 'ကောဇာအဟောကို တွက်မရပါ။';
  }
}

const janmaCity = byId('janma-city');
const janmaCitySearch = byId('janma-city-search');

function renderJanmaCities() {
  const selected = janmaCity.value;
  const query = janmaCitySearch.value.trim().normalize().toLowerCase();
  janmaCity.replaceChildren(new Option('မြို့ရွေးပါ', ''));
  for (const [index, [name, english, region]] of towns.entries()) {
    const label = [name, english, region].filter(Boolean).join(' · ');
    if (label.normalize().toLowerCase().includes(query)) {
      janmaCity.add(new Option(label, String(index)));
    }
  }
  if (janmaCity.options.length === 1) {
    janmaCity.options[0].text = 'ကိုက်ညီတဲ့ မြို့ မတွေ့ပါ';
  }
  janmaCity.value = [...janmaCity.options].some(option => option.value === selected) ? selected : '';
}

janmaCitySearch.addEventListener('input', renderJanmaCities);
renderJanmaCities();

byId('janma-form').addEventListener('submit', event => {
  event.preventDefault();
  const result = byId('janma-result');
  try {
    const readPart = (name, min, max) => {
      const value = ascii(byId('janma-' + name).value.trim());
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
    const hour24 = hour % 12 + (byId('janma-period').value === 'PM' ? 12 : 0);
    const birthDate = [year, pad(month), pad(day)].join('-');
    const birthTime = [hour24, minute, second].map(pad).join(':');
    const instant = myanmarBirthInstant(birthDate, birthTime);
    const { index, pada, longitude } = janmaAt(instant);
    const sun = solarNakshatraAt(instant);
    birthStarIndex = index;
    showReadingTab('current');
    updateSuriya(index, sun.index);
    updateGoza(sun.index);
    const degree = mm(longitude.toFixed(4));
    result.textContent = '';
    byId('suriya-calculation').textContent = yatraNames[index] + 'နက္ခတ် · ပါဒ ' + mm(pada) + ' · လ ' + degree + '° · နေစီးနက္ခတ် ' + yatraNames[sun.index] + ' · ပါဒ ' + mm(sun.pada) + ' · နေ ' + mm(sun.longitude.toFixed(4)) + '°';
    window.location.hash = 'suriya-result';
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

function showPage() {
  const rawHash = window.location.hash.slice(1);
  const hash = rawHash === 'yatra8' ? 'practice'
    : rawHash === 'suriya-result' ? 'suriya' : rawHash;
  const route = /^nakshatra\/([0-6])\/([1-9]|[12][0-9]|30)\/(calculator|catalog)$/.exec(hash);
  const entry = route && catalogs[Number(route[1])]?.[Number(route[2]) - 1];
  const yatraTabs = byId('yatra-tabs');
  const yatraLinks = [...yatraTabs.querySelectorAll('[data-yatra-tab]')];
  const isYatraPage = yatraLinks.some(link => link.dataset.yatraTab === hash);
  const generalTabs = byId('general-tabs');
  const generalLinks = [...generalTabs.querySelectorAll('[data-yatra-tab]')];
  const isGeneralPage = generalLinks.some(link => link.dataset.yatraTab === hash);
  const page = entry ? 'nakshatra-detail'
    : ['catalog', 'calculator', 'suriya'].includes(hash) || isGeneralPage || isYatraPage ? hash : 'home';
  const isHome = page === 'home';
  byId('home').hidden = !isHome;
  byId('back-home').hidden = isHome;
  const isSuriya = page === 'suriya';
  byId('suriya').hidden = !isSuriya;
  const showSuriyaResult = isSuriya && rawHash === 'suriya-result' && birthStarIndex !== undefined;
  byId('janma-form').hidden = showSuriyaResult;
  byId('suriya-output').hidden = !showSuriyaResult;
  if (showSuriyaResult) byId('suriya-output-title').focus();
  else if (rawHash === 'suriya-result') window.history.replaceState(null, '', '#suriya');
  byId('nadika-hero').hidden = isHome || isSuriya;
  byId('nadika-tabs').hidden = isHome || isSuriya;
  byId('nakshatra-detail').hidden = !entry;
  if (entry) {
    renderNakshatraDetail(entry, route[3]);
    byId('nakshatra-title').focus();
  }
  yatraTabs.hidden = !isYatraPage;
  generalTabs.hidden = !isGeneralPage;
  for (const link of [...yatraLinks, ...generalLinks]) {
    const active = link.dataset.yatraTab === page;
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

window.addEventListener('hashchange', showPage);
showPage();
