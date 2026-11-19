import { panchangAt } from './panchang.js';

// Chapter 25. Star numbers are one-based, starting at Asawani.
const adverse = [
  ['အသူဘယုဂ်', {1:[21],2:[17],3:[12,21,26],5:[10],6:[4],7:[13,19],8:[25],9:[3],11:[4],12:[9],13:[14,15]}],
  ['ဆယ်လအတွင်း မကောင်းကျိုး ခံစားရစေတဲ့ယုဂ်', {2:[17],3:[12,21,26],8:[4],10:[5],13:[5],14:[13]}],
  ['ဇွာလာမုခီ (လောင်ကျွမ်းသော) ယုဂ်', {1:[19],5:[2],6:[3],9:[4],10:[9]}],
];
const siddhi = [[12,13,19,20,22,25,27],[23],[1,12,26,27],[3],[6],[11],[15]];
const work = [
  [[8],[1,8,12,13,19,21,23,26]],
  [[9,10],[4,5,8,22,24]],
  [[3,8,13],[1,5,9,19,26]],
  [[2,7,12],[3,4,5,17]],
  [[5,10,15],[1,7,8,16,17,27]],
  [[1,2,6,7,11,12],[1,2,6,12,14,15,20,27]],
  [[2,4,7,9,12,14],[4,10,11,15,22]],
];
const practice = [
  [[1,4,6,7,12],[8,13,19,22,12,21,26]],
  [[7,12],[4,5,7,22,23,24,25]],
  [[3,6,8,11,13],[1,5,14,19,17,12,25]],
  [[2,3,7,8,12,13],[4,5,6,12,17,21]],
  [[4,5,7,9,13,14],[1,7,8,10,15,27,20,25]],
];
const amrita = [[13],[4,5,7,22],[3,5,7,8,9,10,11,13,14,15,26,27],[3,4,6,7,8,9,10,13,14,15,16,17,22,24],[1,7,8,10,15],[1,11,12,17,22,25,26],[3,4,15,24]];
const subha = [[8,12,19,21,26],[4,5,22],[3,8,12,26],[3,4,17,18,24,26],[2,7,8,9,16,17,18,19,20,21,22],[1,11,22],[1,2,5,6,8,10,15,16,17,18,19,23,25,26]];
const lesserSunday = [2,3,4,5,6,7,9,14,15,24,11,20,23,25];

// Rules 7–18 from the continuation of Chapter 25.
const relief = [[2,12,19,21,22,27],[4,5,7,22,15],[1,4,12,13,17,26],[3,5,11,12,17,20,21,25],[1,7,8,10,15],[1,2,19,27],[3,15,24]];
const weekdayWarnings = [
  ['လောင်ကျွမ်းတဲ့ ယုဂ်', [[2],[14],[21],[23],[12],[18],[27]]],
  ['ယမမင်းအဆွယ် ထုတ်တဲ့ ယုဂ်', [[10,23],[16,19],[2,3],[7,27],[1,21],[4,17],[22,24]]],
  ['ယမမင်း ခေါင်းလောင်းတီးတဲ့ ယုဂ်', [[10],[16],[6],[19],[3],[4],[13]]],
  ['ဥပ္ပါတယုဂ်', [[16],[20],[23],[27],[4],[8],[12]]],
  ['မတယုဂ်', [[17,16],[21],[23,24],[1],[5],[9,4,15],[7,9,11,13,14,20]]],
  ['တစ်ဖက်ကန်းယုဂ်', [[18],[],[25],[2],[6],[10],[14]]],
  ['နာသယုဂ်', [[10,16,17,18],[3,12,14,16,20,21,26],[6,16,23,21,24,25],[1,2,19,23,27],[12],[4,8,9,10,16,18],[27]]],
];
const nanda = [1,6,11], bhadra = [2,7,12], jaya = [3,8,13], rikta = [4,9,14], purna = [5,10,15];
const tri = [
  [nanda,[3,6,9,14,15,19,24,27]],
  [bhadra,[11,12,25,28]],
  [nanda,[3,6,9,14,15,19,24,27]],
  [jaya,[2,5,8,22,28]],
  [rikta,[3,4,10,13,18,20,21]],
  [bhadra,[11,12,25,28]],
  [purna,[4,23,13]],
];
const suta = [[[5,7],[8,13,19]],[[5,7],[5,15,22]],[[5],[1,4,12,25,26]],[[5,7],[1,11,20,25]],[[13],[7,20,27]],[nanda,[12,15,24]],[bhadra,[4,15,23]]];
const visa = [[5,3],[2,14],[15,4],[7,2],[13,17],[6,22],[8,27]];
const vinasa = [
  [[3,4,8,9,13,14],[2,5,9,16,17,18,23]],
  [[6,7,11],[2,3,10,17,20,21,26]],
  [[1,2,7,8,10,15],[6,7,18,20,21,22,23,24]],
  [[2,3,8,9],[1,2,8,9,10,19,23,25]],
  [[6,8,9,12,13],[3,4,5,6,12,16,17,24]],
  [[2,3,6,8,10,11],[4,7,10,17,16,18,22,23]],
  [[3,7,9,11],[7,8,11,12,13,20,21,22]],
];

const contrary = [
  [[7,12,14],[16,2,17,10,18]], [[6,11,13],[14,16,20,21]],
  [[1,10],[6,21,23,24,25]], [[1,3,9],[1,2,19,23,27]],
  [[4,6,8],[3,4,5,6,12,24]], [[2,7],[4,8,9,10,18]], [[6,7],[1,2,14,20,21,27]],
];
const success = [
  [[1,3],[1,8,12,13,19,21,26]], [[2,11],[4,5,8,17,22]],
  [[3,9,12],[1,3,9,26]], [[7,9,11],[3,4,5,13,17]],
  [[],[1,17,7,8,27]], [[],[1,17,7,22,27]], [[11,13],[4,15,22]],
];
const rashis = ['မိဿ','ပြိဿ','မေထုန်','ကရကဋ်','သိဟ်','ကန်','တူ','ပြိစ္ဆာ','ဓနု','မကာရ','ကုမ်','မိန်'];
export const akhaRashis = rashis;
export const akhaMonths = ['တန်ခူး','ကဆုန်','နယုန်','ဝါဆို','ဝါခေါင်','တော်သလင်း','သီတင်းကျွတ်','တန်ဆောင်မုန်း','နတ်တော်','ပြာသို','တပို့တွဲ','တပေါင်း'];
const repair = [[1],[4],[6],[8,9],[10,11],[13],[15],[17],[19],[22],[24],[27]];
const yata = [10,13,15,17,19,22,24,27,2,4,6,9];
const badhaka = [[8,17,26],[8,17,26],[7,16,25],[2,11,20],[5,14,23],[7,16,25],[3,12,21],[4,13,22],[9,18,27],[5,14,23],[2,11,20],[9,18,27]];
const masa = [[1,4],[14,15],[7,8,21],[11,23],[20,21,22],[24,27],[25],[3,5,8,10],[14,16,17,26],[1,6,9,13],[19,22],[18,2]];
const dinaRoga = [[9,26],[2,19],[12,22],[15,5]];
const dinaMitt = [[23,13],[6,16],[9,26],[2,19]];

function additionalMatches(add, day, tithi, tithiIndex, star, context) {
  const pair = ([tithis, stars]) => tithis.includes(tithi) && stars.includes(star);
  if (pair(contrary[day])) add('ဆန့်ကျင်ဘက် အကျိုးဖြစ်စေသော ယုဂ်', 'caution');
  const [weakened, stars] = success[day];
  if (stars.includes(star)) add(weakened.includes(tithi) ? 'သဗ္ဗတ္ထသိဒ္ဓိယုဂ် (တိထီကြောင့် အကျိုးလျော့)' : 'သဗ္ဗတ္ထသိဒ္ဓိယုဂ်', weakened.includes(tithi) ? 'caution' : 'good');
  if (day === 1 && [2,3,6,8,9,10,11,13,17,18,19,23,24,26,27].includes(star)) add('သောဘနယုဂ်');
  if (day === 5 && [2,3,5,6,7].includes(star)) add('သီရိယုဂ်');
  if ([1,2,3,5].includes(day) && [1,5,6,10,11].includes(tithi) && [1,4,7,10,13,16,19,22,25].includes(star)) add('ကုမာရယုဂ်');
  if ([0,2,3,5].includes(day) && ([2,3,7,12].includes(tithi) || tithiIndex === 14) && [2,5,8,11,14,17,20,23,26].includes(star)) add('ရာဇယုဂ်');
  if ([0,2,6].includes(day) && bhadra.includes(tithi)) {
    if ([5,14,23].includes(star)) add('ကြာနှစ်ပွင့်ယုဂ်', 'neutral');
    if ([3,7,12,21,16,25].includes(star)) add('ကြာသုံးပွင့်ယုဂ်', 'neutral');
  }
  if (context.daylight && dinaRoga[context.pada - 1]?.includes(star)) add('ဒိနရောဂနက္ခတ်', 'caution');
  if (context.daylight && dinaMitt[context.pada - 1]?.includes(star)) add('ဒိနမိတ္ထုနက္ခတ်', 'caution');
  if (repair[context.sunSign]?.includes(star)) add('ရာသီပြင်နက္ခတ် (' + rashis[context.sunSign] + 'ရာသီ)', 'neutral');
  if (yata[context.sunSign] === star) add('ယာတနက္ခတ်', 'caution');
  if (badhaka[context.ascendant]?.includes(star)) add('ဗာဓကနက္ခတ်', 'caution');
  if (masa[context.month]?.includes(star)) add('မာသသုညနက္ခတ်', 'caution');
  if ([9,10,11,14,15,16,17,18,19,20,23,24,25,26].includes((star - context.sunStar + 27) % 27 + 1)) add('ရတနာ ဝယ်ယူ၊ စတင်ဝတ်ဆင်ရန် နက္ခတ်');
  if (context.ingress && [8,13,14,12,21,26].includes(star) && [6,7].includes(tithi)) add('တနင်္ဂနွေဂြိုဟ် ရာသီပြောင်းအခါ' + (day === 0 ? ' (တနင်္ဂနွေနေ့ ပိုကောင်း)' : ''));
  if ([3,8,9,10,11,20,25].includes(star)) add('အမတတရ');
}

const sourceReadings = [
  ['အမြိတ္တ သိဒ္ဓိယုဂ်', 'အမြိတ္တသိဒ္ဓိယုဂ်တွေမှာ လုပ်တဲ့ အလုပ်တွေဟာ အလွန် အောင်လွယ်ပါတယ်။ ပြီးတော့ ဒီကာလမှာ ပေါက်လာတဲ့ အပင်တောင် နှစ်ထောင်ချီ တည်တံ့မယ်လို့ ဆိုရိုး ရှိပါတယ်။'],
  ['ဒုက္ခငြိမ်းသော ယုဂ်', 'ဒီယုဂ်ဟာ ကျွန်တော် အကြိုက်ဆုံး ယုဂ်တစ်ခုပါ။ အင်မတန်မှကို ထူးထူးခြားခြား စွမ်းလွန်းလှပါတယ်။ သင့်လျော်ရာ သီလ/စရဏ/ဒါန/ယတြာ/အစီအရင်များ လုပ်ပြီး ကိုယ် ကြုံရောက်နေတဲ့ အခက်အခဲ၊ အပူသောက ပြဿနာများ ပြေလည် လွတ်မြောက်ဖို့ ဆုတောင်းရပါတယ်။'],
  ['လောင်ကျွမ်းတဲ့ ယုဂ်', 'မီးလောင်တာ မလောင်တာထက် အပူသောက များတာကိုလဲ ပြောတာပါ။'],
  ['ယမမင်းအဆွယ် ထုတ်တဲ့ ယုဂ်', 'အသက်ဘေးနဲ့ နီးတယ်လို့ ပြောချင်တာပါ။'],
  ['ယမမင်း ခေါင်းလောင်းတီးတဲ့ ယုဂ်', 'အသက်ဘေးနဲ့ နီးတယ်လို့ ပြောချင်တာပါ။'],
  ['ဥပ္ပါတယုဂ်', 'ကသောင်းကနင်း ဖြစ်စေတတ်တယ်လို့ ပြောနေတာပါ။'],
  ['မတယုဂ်', 'သေတတ်တဲ့ ယုဂ်လို့ ပြောချင်တာပါ။'],
  ['နာသယုဂ်', 'ပျက်စီးတဲ့ ယုဂ်လို့ ပြောချင်တာပါ။'],
  ['ဝိသယုဂ်', 'အဆိပ်သင့်တဲ့ ယုဂ်လို့ ပြောချင်တာပါ။'],
  ['ဝိနာသယုဂ်', 'အလုံးစုံ ပျက်သုဉ်းတဲ့ ယုဂ်လို့ ပြောချင်တာပါ။'],
  ['တြိအမြိတ္တယုဂ်', 'တြိအမြိတ္တယုဂ်ဆိုတာက အမြိုက်သုံးပါးဆုံတဲ့ ယုဂ်လို့ ပြောချင်တာပါ။ အင်မတန် အင်မတန် ကောင်းလွန်းလှတဲ့ အခါပါ။'],
  ['ရာဇယုဂ်', 'ဒီယုဂ်နဲ့ စန်းယှဉ်မွေးရင် ရာဇယုဂ် ရပါတယ်။ ဘုန်းတန်ခိုးဩဇာအာဏာ အင်မတန် ကြီးမားပါတယ်။'],
  ['သဗ္ဗတ္ထသိဒ္ဓိယုဂ်', 'သဗ္ဗ – အလုံးစုံသော၊ အတ္ထ – အကျိုးစီးပွားကို၊ သိဒ္ဓိ – ပြီးစီးစေတတ်သောလို့ အနက်ရပါတယ်။ အင်မတန် ကောင်းလှတဲ့ ယုဂ်ပါ။'],
  ['သောဘနယုဂ်', 'သောဘနဆိုတာကို အလွယ် ဘာသာပြန်ရင်တော့ မွန်မြတ်ခြင်းလို့ ဘာသာပြန်နိုင်ပါတယ်။ တကယ်တော့ ဒီဝေါဟာရမှာ အနက်တွေ များစွာ ရှိပါတယ်။'],
  ['သီရိယုဂ်', 'ကျက်သရေ မင်္ဂလာ အင်မတန်ကြီးတဲ့ ယုဂ်ဖြစ်ပါတယ်။'],
  ['ကြာနှစ်ပွင့်ယုဂ်', 'ကြာနှစ်ပွင့်ဆိုတာက နှစ်ကြိမ်နှစ်ခါ ပြန်ဖြစ်မယ်လို့ ပြောနေတာပါ။ ကောင်းတာ လုပ်ရင်လဲ နှစ်ခါပြန် ဖြစ်ပါလိမ့်မယ်။ မကောင်းတာ လုပ်/ဖြစ်ရင်လဲ နှစ်ခါ ပြန်ဖြစ်ပါလိမ့်မယ်။'],
  ['ကြာသုံးပွင့်ယုဂ်', 'ကြာနှစ်ပွင့်မှာ နှစ်ကြိမ်နှစ်ခါ ဖြစ်တော့ ကြာသုံးပွင့်မှာ သုံးကြိမ်သုံးခါ ပြန်ဖြစ်တာပါ။'],
  ['အမတတရ', 'ဒီနက္ခတ် ခုနစ်လုံးနဲ့ စန်းယှဉ်နေချိန်တွေမှာ အကြံအစည် အောင်စေခြင်းနဲ့ စီးပွားဥစ္စာ တိုးတက်စေခြင်းတို့အတွက် ဆောင်ရွက်နိုင်ပါတယ်။ အင်မတန် ကောင်းလှပါတယ်။ လုပ်ကြည့်ပါ။'],
];

export function akhaSourceReading(name) {
  return sourceReadings.find(([title]) => title === name || name === title + ' (တိထီကြောင့် အကျိုးလျော့)')?.[1];
}

export function akhaMatches(day, tithiIndex, starIndex, abhijit = false, context = {}) {
  const tithi = tithiIndex % 15 + 1;
  const star = starIndex + 1;
  const matches = [];
  const add = (name, type = 'good') => matches.push({name, type});
  adverse.forEach(([name, rules], index) => {
    if (rules[tithi]?.includes(star) || (index === 1 && tithiIndex === 14 && star === 13)) add(name, 'caution');
  });
  if (star === [13,5,1,17,8,27,4][day]) {
    if (tithi !== [5,6,7,8,10,10,11][day]) add('အမြိတ္တ သိဒ္ဓိယုဂ်');
    else add(day === 4 ? 'အမြိတ္တ သိဒ္ဓိယုဂ် ပျက်သည်။ ဂုရုပုသျှယုဂ် ရှိဆဲ။' : 'အမြိတ္တ သိဒ္ဓိယုဂ် ပျက်သည်။ အဆိပ်သင့်ယုဂ်။', 'caution');
  }
  if (siddhi[day].includes(star)) add('သိဒ္ဓိယုဂ်');
  if (work[day][0].includes(tithi) && work[day][1].includes(star)) add('တိထီနှင့်တွဲသော သိဒ္ဓိယုဂ် (လုပ်ငန်း)');
  if (practice[day]?.[0].includes(tithi) && practice[day][1].includes(star)) add('တိထီနှင့်တွဲသော သိဒ္ဓိယုဂ် (စရဏ)');
  if (amrita[day].includes(star)) add('အမြိုက်ယုဂ်');
  if (subha[day].includes(star)) add('သုဘယုဂ်');
  else if (day === 0 && lesserSunday.includes(star)) add('သုဘယုဂ် (အာနိသင်နည်း)');
  if (star === 8) {
    add('ပုသျှနက္ခတ်');
    const special = {0:'ရဝိပုသျှယုဂ်',1:'စန္ဒြပုသျှယုဂ်',4:'ဂုရုပုသျှယုဂ်'};
    if (special[day]) add(special[day]);
  }
  if (relief[day].includes(star) && !rikta.includes(tithi)) add('ဒုက္ခငြိမ်းသော ယုဂ်');
  for (const [name, stars] of weekdayWarnings) {
    if (stars[day].includes(star)) add(name, 'caution');
  }
  const matchesPair = ([tithis, stars], number = star) => tithis.includes(tithi) && stars.includes(number);
  if (matchesPair(tri[day], abhijit ? 28 : star)) add('တြိအမြိတ္တယုဂ်');
  if (matchesPair(suta[day])) add('သုတယုဂ်');
  if (visa[day][0] === tithi && visa[day][1] === star && (day !== 2 || tithiIndex === 14)) add('ဝိသယုဂ်', 'caution');
  if (matchesPair(vinasa[day]) && !(day === 2 && tithiIndex === 29)) add('ဝိနာသယုဂ်', 'caution');
  additionalMatches(add, day, tithi, tithiIndex, star, context);
  return matches;
}

export function akhaIntervals(data, weekday, filters = {}) {
  const start = data.sunrise.getTime();
  const end = data.nextSunrise.getTime();
  const boundaries = new Set([start, end]);
  const ingressTimes = [];
  if (data.sunset && +data.sunset > start && +data.sunset < end) boundaries.add(+data.sunset);
  for (const period of [...data.periods.tithi, ...data.periods.nakshatra]) {
    const time = period.end.getTime();
    if (time > start && time < end) boundaries.add(time);
  }
  const isAbhijit = time => {
    const {moon} = panchangAt(new Date(time));
    return moon.longitude >= 276 + 40/60 && moon.longitude < 280 + 53/60 + 20/3600;
  };
  const transitions = [
    isAbhijit,
    time => panchangAt(new Date(time)).moon.pada,
    time => panchangAt(new Date(time)).sun.index,
    time => Math.floor(panchangAt(new Date(time)).sun.longitude / 30),
  ];
  transitions.forEach((valueAt, index) => {
    for (let from = start; from < end;) {
      const to = Math.min(end, from + 3600000);
      const prev = valueAt(from);
      if (prev !== valueAt(to)) {
        let low = from, high = to;
        while (high - low > 250) {
          const mid = (high + low) / 2;
          if (valueAt(mid) === prev) low = mid;
          else high = mid;
        }
        if (index === 3 && high < end) ingressTimes.push(high);
        if (![...boundaries].some(time => Math.abs(time - high) <= 1000)) boundaries.add(high);
      }
      from = to;
    }
  });
  const times = [...boundaries].sort((a,b) => a-b);
  return times.slice(0,-1).map((from,index) => {
    const to = times[index+1];
    const mid = (from + to) / 2;
    const {tithi, nakshatra, moon, sun} = panchangAt(new Date(mid));
    const context = {...filters, pada: moon.pada, sunSign: Math.floor(sun.longitude / 30),
      sunStar: sun.index + 1, daylight: data.sunset && mid < +data.sunset};
    const matches = akhaMatches(weekday, tithi, nakshatra, isAbhijit(mid), context);
    const events = ingressTimes.filter(time => time >= from - 1000 && time < to - 1000).flatMap(time => {
      const position = panchangAt(new Date(time));
      return akhaMatches(weekday, position.tithi, position.nakshatra, isAbhijit(time), { ingress: true })
        .filter(match => match.name.startsWith('တနင်္ဂနွေဂြိုဟ် ရာသီပြောင်း'))
        .map(match => ({ ...match, time: new Date(time) }));
    });
    return {from:new Date(from), to:new Date(to), tithi, nakshatra, pada:moon.pada, matches, events};
  });
}
