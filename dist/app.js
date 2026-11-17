import { catalogs, getRuler, myanmarUtcOffset, solarTimes, toMinutes, windowsFor } from './nadika.js';

const byId = (id) => document.getElementById(id);
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

let resultDetails;

function updateResult() {
  const fixed = slotMode.value === 'fixed';
  byId('dial-number').textContent = fixed ? '၂၄' : '၃၀';
  byId('dial-unit').textContent = fixed ? 'မိနစ်စီ' : 'အပိုင်းစီ';
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

  const nameLink = byId('result-name');
  const status = byId('result-note');
  if (!form.checkValidity() || !Number.isFinite(weekdayFor(date.value))) {
    lastUpdate = '';
    nameLink.hidden = true;
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
  nameLink.hidden = true;
  status.hidden = false;
  if (!slot || slot.start >= limit) {
    status.textContent = fixed ? 'ဒီအချိန်မှာ ၂၄ မိနစ်စီ စနစ်ရဲ့ အပိုင်း ၃၀ အတွင်း မကျပါ။' : 'နာဒီကာအကွက် မရှိပါ။';
    return;
  }

  const [name] = catalogs[weekday][slot.number - 1];
  const route = `#nakshatra/${weekday}/${slot.number}/calculator`;
  const dateOffset = beforeSunrise ? dayMinutes : 0;
  resultDetails = {
    route,
    lines: [
      `${weekdays[weekday]} · ${night ? 'ညပိုင်း' : 'နေ့ပိုင်း'} · အမှတ် ${mm(slot.number + (night ? 30 : 0))}`,
      `${timeLabel(slot.start - dateOffset)} – ${timeLabel(slot.end - dateOffset)}`,
      `စိုးမိုးဂြိုဟ် - ${planetName(getRuler(weekday, slot.number, night ? 'night' : 'day'))}`,
    ],
  };
  nameLink.textContent = name;
  nameLink.href = route;
  nameLink.hidden = false;
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
    if (query && !`${id} ${name} ${effect}`.normalize().includes(query)) return;

    const card = byId('entry-template').content.cloneNode(true);
    card.querySelector('.badge').textContent = mm(id);
    const detailLink = document.createElement('a');
    detailLink.className = 'nakshatra-link';
    detailLink.href = `#nakshatra/${weekday}/${id}/catalog`;
    detailLink.textContent = name;
    card.querySelector('h3').append(detailLink);
    tag(card.querySelector('.pill'), type);
    card.querySelector('.effect').textContent = effect;
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
const abhijit = document.createElement('article');
abhijit.className = 'entry';
abhijit.innerHTML = '<h3>အဘိဇိနက္ခတ်</h3><p>နို့ထမင်း လှူခြင်း။</p>';
byId('yatra3-entries').children[20].after(abhijit);

updateResult();

function renderNakshatraDetail([name, effect], source) {
  byId('nakshatra-back').href = '#' + source;
  byId('nakshatra-title').textContent = 'နက္ခတ် - ' + name;
  byId('nakshatra-effect').textContent = effect;
  const timing = byId('nakshatra-timing');
  const lines = resultDetails?.route === window.location.hash ? resultDetails.lines : [];
  timing.replaceChildren(...lines.map(line => {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    return paragraph;
  }));
  timing.hidden = lines.length === 0;
  const list = byId('nakshatra-yatras');
  list.replaceChildren();
  const index = yatraNames.indexOf(name);
  if (index < 0) {
    list.textContent = 'ဒီနက္ခတ်အတွက် ကျမ်းပါ ယတြာ မရှိပါ။';
    return;
  }
  const descriptions = [yatraDescriptions, yatra2Descriptions, yatra3Descriptions];
  const titles = ["ဇောတိတတ္ထ နိဿရည်းကျမ်းမှ နက္ခတ်ယတြာ", "နက္ခတ်ညံ့လျှင် လုပ်ရသော ယတြာများ", "နက္ခတ် ညံ့လျှင် လုပ်ရသော ယတြာများ။ (မူကွဲ။)"];
  titles.forEach((title, position) => {
    const heading = document.createElement('h4');
    heading.textContent = title;
    const body = document.createElement('p');
    body.textContent = descriptions[position][index];
    list.append(heading, body);
  });
}

function showPage() {
  const hash = window.location.hash.slice(1);
  const route = /^nakshatra\/([0-6])\/([1-9]|[12][0-9]|30)\/(calculator|catalog)$/.exec(hash);
  const entry = route && catalogs[Number(route[1])]?.[Number(route[2]) - 1];
  const page = entry ? 'nakshatra-detail'
    : ['catalog', 'yatra', 'yatra2', 'yatra3'].includes(hash) ? hash : 'calculator';
  byId('nakshatra-detail').hidden = !entry;
  if (entry) {
    renderNakshatraDetail(entry, route[3]);
    byId('nakshatra-title').focus();
  }
  byId('yatra3').hidden = page !== 'yatra3';
  byId('yatra2').hidden = page !== 'yatra2';
  byId('yatra').hidden = page !== 'yatra';
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
