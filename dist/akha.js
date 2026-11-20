import { panchangAt } from './panchang.js';

// Chapter 25. Star numbers are one-based, starting at Asawani.
const adverse = [
  ['အသုဘယုဂ်', {1:[21],2:[17],3:[12,21,26],5:[10],6:[4],7:[13,19],8:[25],9:[3],11:[4],12:[9],13:[14,15]}],
  ['ဆယ်လအတွင်း မကောင်းကျိုး ခံစားရစေတဲ့ယုဂ်', {2:[17],3:[12,21,26],8:[4],10:[5],13:[5],14:[13]}],
  ['ဇွာလာမုခီ (လောင်ကျွမ်းသော) ယုဂ်', {1:[19],5:[2],6:[3],9:[4],10:[9]}],
];
const siddhi = [[12,13,19,20,22,25,27],[23],[1,12,26,27],[3],[6],[11],[15]];
const nanda = [1,6,11], bhadra = [2,7,12], jaya = [3,8,13], rikta = [4,9,14], purna = [5,10,15];
const work = [
  [[8],[1,8,12,13,19,21,23,26]],
  [[9,10],[4,5,8,22,24]],
  [[3,8,13],[1,5,9,19,26]],
  [[2,7,12],[3,4,5,17]],
  [[5,10,15],[1,7,8,16,17,27]],
  [[1,2,6,7,11,12],[1,2,6,12,14,15,20,27]],
  [[2,4,7,9,12,14],[4,10,11,15,22]],
];
// Chapter 25, rule 4: the practice and work tables have separate Friday and Saturday rows.
const practice = [
  [[1,4,6,7,12],[8,13,19,22,12,21,26]],
  [[7,12],[4,5,7,22,23,24,25]],
  [[3,6,8,11,13],[1,5,14,19,17,12,25]],
  [[2,3,7,8,12,13],[4,5,6,12,17,21]],
  [[4,5,7,9,13,14],[1,7,8,10,15,27,20,25]],
  [nanda.concat(bhadra),[1,2,6,12,14,15,20,27]],
  [bhadra.concat(rikta),[4,15,16,17,23,24]],
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
// Chapter 25, rules 28–29: each row corresponds to one lunar pada.
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
  // Rule 25 uses the Sun in Vishakha and the Moon in Krittika.
  if (context.sunStar === 16 && star === 3) add('ပုပ္ဖယုဂ်');
  if ([0,2,6].includes(day) && bhadra.includes(tithi)) {
    if ([5,14,23].includes(star)) add('ကြာနှစ်ပွင့်ယုဂ်', 'neutral');
    if ([3,7,12,21,16,25].includes(star)) add('ကြာသုံးပွင့်ယုဂ်', 'neutral');
  }
  if (context.daylight && dinaRoga[context.pada - 1]?.includes(star)) add('ဒိနရောဂနက္ခတ်', 'caution');
  if (context.daylight && dinaMitt[context.pada - 1]?.includes(star)) add('ဒိနမိတ္ထုနက္ခတ်', 'caution');
  if (repair[context.sunSign]?.includes(star)) add('ရာသီပြင်နက္ခတ် (' + rashis[context.sunSign] + 'ရာသီ)', 'neutral');
  if (yata[context.sunSign] === star) add('ယာတနက္ခတ်', 'caution');
  if (badhaka[context.ascendant]?.includes(star)) add('ဗာဓကနက္ခတ်', 'caution');
  if (context.birthStar !== undefined && badhaka[context.ascendant]?.includes(context.birthStar)) add('မူလစန်း ဗာဓကနက္ခတ်', 'caution');
  if (context.birthStar !== undefined && yata[context.sunSign] === context.birthStar) add('မွေးနက္ခတ်အရ ယာတရာသီ', 'caution');
  if (context.birthStar !== undefined && masa[context.month]?.includes(context.birthStar)) add('မွေးနက္ခတ်အရ မာသသုညလ', 'caution');
  if (masa[context.month]?.includes(star)) add('မာသသုညနက္ခတ်', 'caution');
  if ([9,10,11,14,15,16,17,18,19,20,23,24,25,26].includes((star - context.sunStar + 27) % 27 + 1)) add('ရတနာ ဝယ်ယူ၊ စတင်ဝတ်ဆင်ရန် နက္ခတ်');
  if (context.ingress && [8,13,14,12,21,26].includes(star) && [6,7].includes(tithi)) add('တနင်္ဂနွေဂြိုဟ် ရာသီပြောင်းအခါ' + (day === 0 ? ' (တနင်္ဂနွေနေ့ ပိုကောင်း)' : ''));
  // Chapter 25, section 36 is headed “အမှတ်တရ”.
  if ([3,8,9,10,11,20,25].includes(star)) add('အမှတ်တရ');
}

const sourceReadings = [
  ['ပုသျှနက္ခတ်', 'ပုသျှနက္ခတ်ဟာ အကောင်းဆုံး၊ အမြတ်ဆုံး နက္ခတ် ဖြစ်ပါတယ်။ ဒီနက္ခတ် စန်းယှဉ်ချိန်မှာ လက်ထပ်တာက လွဲပြီး ကျန်တာ အားလုံး လုပ်လို့ ရတယ်။'],
  ['ရဝိပုသျှယုဂ်', 'ရဝိပုသျှဆိုတာက ပုသျှနက္ခတ် စန်းယှဉ်တဲ့ နေ့ဟာ တနင်္ဂနွေနေ့ ဖြစ်နေရင် ရဝိပုသျှလို့ ခေါ်ပါတယ်။'],
  ['စန္ဒြပုသျှယုဂ်', 'ပုသျှနက္ခတ်နဲ့ စန်းယှဉ်တဲ့ နေ့ဟာ တနင်္လာနေ့ ဖြစ်တာကို ပြောနေတာ။'],
  ['ဂုရုပုသျှယုဂ်', 'ဂုရုပုသျှဆိုတာ ကြာသပတေးနေ့မှာ ပုသျှနက္ခတ် စန်းယှဉ်တာကို ခေါ်တာပေါ့။'],
  ['အမြိတ္တ သိဒ္ဓိယုဂ်', 'အမြိတ္တသိဒ္ဓိယုဂ်တွေမှာ လုပ်တဲ့ အလုပ်တွေဟာ အလွန် အောင်လွယ်ပါတယ်။ ပြီးတော့ ဒီကာလမှာ ပေါက်လာတဲ့ အပင်တောင် နှစ်ထောင်ချီ တည်တံ့မယ်လို့ ဆိုရိုး ရှိပါတယ်။'],
  ['အမြိတ္တ သိဒ္ဓိယုဂ် ပျက်သည်။ ဂုရုပုသျှယုဂ် ရှိဆဲ။', 'ကြာသပတေးနေ့မှာ ပုသျှနက္ခတ် စန်းယှဉ်ပြီး လဆန်း၊ လကွယ် တိထီ ဆယ်လုံး ရရင် အမြိတ္တသိဒ္ဓိယုဂ်ပဲ ပျက်ပါတယ်။ အဆိပ် သုံးပါးသင့်တဲ့ ယုဂ်ကို မရပါဘူး။ ပြီးတော့ ဂုရုပုသျှယုဂ်ကတော့ ရမြဲအတိုင်း ရပါတယ်။'],
  ['အမြိတ္တ သိဒ္ဓိယုဂ် ပျက်သည်။ အဆိပ်သင့်ယုဂ်။', 'ပျက်တဲ့အပြင် အဆိပ်သုံးပါးသင့်တဲ့ ယုဂ်ကို ရစေပါတယ်။ အခါရွေးရာမှာ ရှောင်ရပါမယ်။'],
  ['သိဒ္ဓိယုဂ်', 'သိဒ္ဓိဆိုတာ ပြီးမြောက်အောင်မြင်ခြင်းပါ။'],
  ['တိထီနှင့်တွဲသော သိဒ္ဓိယုဂ် (လုပ်ငန်း)', 'ဒီအခါကို ရွေးပြီး လုပ်ငန်းတွေ စခဲ့ရင် အလွယ်တကူ ပြီးမြောက် အောင်မြင်မယ်လို့ ပြောချင်တာပါ။'],
  ['တိထီနှင့်တွဲသော သိဒ္ဓိယုဂ် (စရဏ)', 'စရဏဆိုင်ရာ ကျင့်စဉ်များကို ကျင့်ရာမှာ တန်ခိုးသိဒ္ဓိများကို ရစေဖို့အတွက် ရွေးချယ် အသုံးပြုရတဲ့ မူပါ။'],
  ['သုဘယုဂ် (အာနိသင်နည်း)', 'တနင်္ဂနွေနေ့မှာပဲ ခု ပြောမယ့် နက္ခတ်တွေနဲ့ စန်းယှဉ်ခဲ့ရင် သုဘယုဂ် ရပါသေးတယ်။ ဒါပေမယ့် ဒီသုဘယုဂ်ရဲ့ အာနိသင်ဟာ အပေါ်မှာ ပြောခဲ့တဲ့ဟာလောက်တော့ အာနိသင် မကြီးဘူးပေါ့။'],
  ['ဒုက္ခငြိမ်းသော ယုဂ်', 'သင့်လျော်ရာ သီလ/စရဏ/ဒါန/ယတြာ/အစီအရင်များ လုပ်ပြီး ကိုယ် ကြုံရောက်နေတဲ့ အခက်အခဲ၊ အပူသောက ပြဿနာများ ပြေလည် လွတ်မြောက်ဖို့ ဆုတောင်းရပါတယ်။'],
  ['လောင်ကျွမ်းတဲ့ ယုဂ်', 'မီးလောင်တာ မလောင်တာထက် အပူသောက များတာကိုလဲ ပြောတာပါ။'],
  ['ယမမင်းအဆွယ် ထုတ်တဲ့ ယုဂ်', 'အသက်ဘေးနဲ့ နီးတယ်လို့ ပြောချင်တာပါ။'],
  ['ယမမင်း ခေါင်းလောင်းတီးတဲ့ ယုဂ်', 'အသက်ဘေးနဲ့ နီးတယ်လို့ ပြောချင်တာပါ။'],
  ['ဥပ္ပါတယုဂ်', 'ကသောင်းကနင်း ဖြစ်စေတတ်တယ်လို့ ပြောနေတာပါ။'],
  ['မတယုဂ်', 'သေတတ်တဲ့ ယုဂ်လို့ ပြောချင်တာပါ။'],
  ['တစ်ဖက်ကန်းယုဂ်', 'ဒီစနစ်မှာ တနင်္လာနေ့အတွက် တစ်ဖက်ကန်းနက္ခတ် ကျွန်တော် မတွေ့ဖူးပါဘူး။'],
  ['နာသယုဂ်', 'ပျက်စီးတဲ့ ယုဂ်လို့ ပြောချင်တာပါ။'],
  ['တြိအမြိတ္တယုဂ်', 'တြိအမြိတ္တယုဂ်ဆိုတာက အမြိုက်သုံးပါးဆုံတဲ့ ယုဂ်လို့ ပြောချင်တာပါ။ အင်မတန် အင်မတန် ကောင်းလွန်းလှတဲ့ အခါပါ။'],
  ['သုတယုဂ်', 'မိမိ အလိုရှိသော ရည်မှန်းသော အကျိုးတရားဟာ မိမိလက်ရောက် ဆက်ကပ် ခံရသလို ပုံစံနဲ့ ရလာစေပါတယ်။'],
  ['ဝိသယုဂ်', 'အဆိပ်သင့်တဲ့ ယုဂ်လို့ ပြောချင်တာပါ။'],
  ['ဝိနာသယုဂ်', 'အလုံးစုံ ပျက်သုဉ်းတဲ့ ယုဂ်လို့ ပြောချင်တာပါ။'],
  ['သဗ္ဗတ္ထသိဒ္ဓိယုဂ်', 'သဗ္ဗ – အလုံးစုံသော၊ အတ္ထ – အကျိုးစီးပွားကို၊ သိဒ္ဓိ – ပြီးစီးစေတတ်သောလို့ အနက်ရပါတယ်။ အင်မတန် ကောင်းလှတဲ့ ယုဂ်ပါ။'],
  ['သဗ္ဗတ္ထသိဒ္ဓိယုဂ် (တိထီကြောင့် အကျိုးလျော့)', 'ဒီယုဂ်ရဲ့ ကောင်းကျိုးကို အများကြီး လျော့သွားစေပါတယ်။ ဒါပေမယ့် အမြိတ္တသိဒ္ဓိယုဂ်လို ဆန့်ကျင်ဘက် အကျိုးကိုတော့ မပေးပါဘူး။'],
  ['သောဘနယုဂ်', 'သောဘနဆိုတာကို အလွယ် ဘာသာပြန်ရင်တော့ မွန်မြတ်ခြင်းလို့ ဘာသာပြန်နိုင်ပါတယ်။'],
  ['သီရိယုဂ်', 'ကျက်သရေ မင်္ဂလာ အင်မတန်ကြီးတဲ့ ယုဂ်ဖြစ်ပါတယ်။'],
  ['ကုမာရယုဂ်', 'ကုမာရယုဂ်ဟာ အင်မတန် ကောင်းတဲ့ ယုဂ်ပါ။ ကုမာရဆိုတဲ့အတိုင်း နုပျိုလန်းဆန်း တက်ကြွစေတတ်ပါတယ်။'],
  ['ရာဇယုဂ်', 'ဒီယုဂ်နဲ့ စန်းယှဉ်မွေးရင် ရာဇယုဂ် ရပါတယ်။ ဘုန်းတန်ခိုးဩဇာအာဏာ အင်မတန် ကြီးမားပါတယ်။'],
  ['ပုပ္ဖယုဂ်', 'ပုပ္ဖဆိုတာ ပန်းပွင့်စေသော ယုဂ်လို့ ခေါ်ပါတယ်။'],
  ['ကြာနှစ်ပွင့်ယုဂ်', 'ကြာနှစ်ပွင့်ဆိုတာက နှစ်ကြိမ်နှစ်ခါ ပြန်ဖြစ်မယ်လို့ ပြောနေတာပါ။ ကောင်းတာ လုပ်ရင်လဲ နှစ်ခါပြန် ဖြစ်ပါလိမ့်မယ်။ မကောင်းတာ လုပ်/ဖြစ်ရင်လဲ နှစ်ခါ ပြန်ဖြစ်ပါလိမ့်မယ်။'],
  ['ကြာသုံးပွင့်ယုဂ်', 'ကြာနှစ်ပွင့်မှာ နှစ်ကြိမ်နှစ်ခါ ဖြစ်တော့ ကြာသုံးပွင့်မှာ သုံးကြိမ်သုံးခါ ပြန်ဖြစ်တာပါ။'],
  ['ဒိနရောဂနက္ခတ်', 'ဒိနဆိုတာ နေ့၊ ရောဂဆိုတာ ရောဂါ။'],
  ['ဒိနမိတ္ထုနက္ခတ်', 'ဒိနဆိုတာ နေ့၊ မိတ္ထုဆိုတာ သေတာ။'],
  ['ရာသီပြင်နက္ခတ်', 'ရာသီတွေကို ပြုပြင်ပေးနိုင်စွမ်း ရှိသော နက္ခတ်တွေ ဖြစ်ပါတယ်။'],
  ['ယာတနက္ခတ်', 'ယာတဆိုတာ သတ်တတ်တယ်လို့ ပြောတာပါ။'],
  ['ဗာဓကနက္ခတ်', 'ဗာဓကဆိုတာ တားဆီးနှောင့်ယှက်တတ်တယ်လို့ ပြောချင်တာပါ။'],
  ['မာသသုညနက္ခတ်', 'ဒီလတွေမှာ ဒီနက္ခတ်တွေဟာ အကျိုးပေး အလွန်ညံ့ပါတယ်။ စီးပွားပျက်စေတတ်ပါတယ်။'],
  ['ရတနာ ဝယ်ယူ၊ စတင်ဝတ်ဆင်ရန် နက္ခတ်', 'ဒါက ရွှေအတုံးအခဲ ဝယ်တာကို ပြောချင်တာ မဟုတ်ပါဘူး။ ခတ်ပြီးသား အထည်ကို ပြောချင်တာပါ။ အဲဒီနေ့မှာ ပန်းထိမ်အပ်ရင်လဲ ရပါတယ်။'],
  ['တနင်္ဂနွေဂြိုဟ် ရာသီပြောင်းအခါ', 'ဒီကာလမှာ တနင်္ဂနွေနဲ့ ပတ်သက်သော ကောင်းမြတ်သော အစီအရင် ဘာမဆို လုပ်ယူနိုင်တယ်။ အင်မတန် မြတ်ပါတယ်။'],
  ['အမှတ်တရ', 'ဒီနက္ခတ် ခုနစ်လုံးနဲ့ စန်းယှဉ်နေချိန်တွေမှာ အကြံအစည် အောင်စေခြင်းနဲ့ စီးပွားဥစ္စာ တိုးတက်စေခြင်းတို့အတွက် ဆောင်ရွက်နိုင်ပါတယ်။ အင်မတန် ကောင်းလှပါတယ်။ လုပ်ကြည့်ပါ။'],
];

export function akhaSourceReading(name) {
  const sourceName = {
    'မူလစန်း ဗာဓကနက္ခတ်': 'ဗာဓကနက္ခတ်',
    'မွေးနက္ခတ်အရ ယာတရာသီ': 'ယာတနက္ခတ်',
    'မွေးနက္ခတ်အရ မာသသုညလ': 'မာသသုညနက္ခတ်',
  }[name] ?? name;
  return sourceReadings.find(([title]) => sourceName === title)?.[1]
    ?? sourceReadings.find(([title]) => sourceName.startsWith(title + ' ('))?.[1];
}

// လက်ကျန် အခါရွေး စနစ်များ, rules 1–9. Star numbers start at Asawani.
const yataPadas = [[3,1],[10,2],[24,3],[10,3],[23,1],[6,3],[19,2],[4,4],[25,3],[10,4],[19,4],[25,3]];
const mahaMangalaStars = [1,8,21,26,5,4,14,15,23,27,7,12,22,17];
const amritaRestrictions = {
  2: 'အင်္ဂါနေ့မှာ ရလာတဲ့ အမြိတ္တသိဒ္ဓိယုဂ်မှာ အိမ်သစ် မတက်ကောင်းပါဘူး။',
  4: 'ကြာသပတေးနေ့မှာ ရလာတဲ့ အမြိတ္တသိဒ္ဓိယုဂ်မှာ မင်္ဂလာ မဆောင်ကောင်းပါဘူး။',
  6: 'စနေနေ့မှာ ရလာတဲ့ အမြိတ္တသိဒ္ဓိယုဂ်မှာ ခရီးမသွားကောင်းပါဘူး။',
};
const burmeseNumber = number => String(number).replace(/\d/g, digit => '၀၁၂၃၄၅၆၇၈၉'[digit]);

function supplementalMatches(matches, day, tithiIndex, star, context) {
  const add = (name, reading, type = 'good') => matches.push({name, reading, type});
  const tithi = tithiIndex % 15 + 1;
  const waning = tithiIndex >= 15;
  if (context.sunStar >= 1 && context.sunStar <= 27) {
    const distance = (star - context.sunStar + 27) % 27 + 1;
    const remainder = (distance * 3 + tithi) % 7;
    // Sunday is day 1, with remainder 0 representing Saturday.
    if (remainder === (day + 1) % 7) {
      add('စားကြွင်းအရ အခါကောင်း', 'ဒီအခါမှာ လုပ်သမျှ အလုပ်ဟာ မအောင်ဘဲ မရှိဘူးလို့ ဆိုပါတယ်။');
      matches.at(-1).note = '(' +
        burmeseNumber(distance) + ' × ၃ + ' + burmeseNumber(tithi) + ') ÷ ၇ · အကြွင်း ' +
        burmeseNumber(remainder);
    }
  }
  const yata = yataPadas[context.sunSign];
  if (yata?.[0] === star && yata[1] === context.pada) {
    add('ယာတနက္ခတ်ပါဒ', '', 'caution');
    matches.at(-1).note = rashis[context.sunSign] + 'ရာသီ · ပါဒ ' + burmeseNumber(context.pada);
  }
  if (mahaMangalaStars.includes(star)) {
    add('မဟာမင်္ဂလာနက္ခတ်', 'ဒီနက္ခတ် (၁၄) လုံး စန်းယှဉ်ချိန်မှာ ကောင်းမြတ်တဲ့ အလုပ်မှန်ရင် ဘာကိုမဆို လုပ်ပါ။ လွယ်လင့်တကူ အောင်မြင်စေပါတယ်။');
    if (mahaMangalaStars.includes(context.birthStar)) matches.at(-1).note = 'မွေးနက္ခတ်လည်း မဟာမင်္ဂလာနက္ခတ် ၁၄ လုံးထဲတွင် ပါဝင်သည်။';
  }
  if (amritaRestrictions[day] && matches.some(match => match.name === 'အမြိတ္တ သိဒ္ဓိယုဂ်')) {
    add('အမြိတ္တသိဒ္ဓိယုဂ်၏ နေ့အလိုက် ခြွင်းချက်', amritaRestrictions[day], 'caution');
  }
  const vyatipata = context.yoga === 16;
  const donation = 'ဒီကာလမှာ အလှူပေးခဲ့ရင် အင်မတန် ကြီးမြတ်သော ကောင်းကျိုးကို ရပါတယ်။';
  if (context.month === 5 && waning && tithi === 6 && day === 2 && star === 4 &&
    vyatipata && context.sunStar === 13 && context.daylight) {
    add('တော်သလင်းလဆုတ် ၆ တိထီ အလှူအခါ', donation);
  }
  if (context.month === 5 && waning && star === 13 && context.sunStar === 13) {
    add('တော်သလင်းလဆုတ် ဟဿတနက္ခတ် အလှူအခါ', donation);
  }
  if (context.month === 9 && waning && day === 0 && vyatipata && star === 22) {
    add('ပြာသိုလဆုတ် ဗျတီပါတယုဂ် အလှူအခါ', (context.daylight ? 'နေ့ခင်းပိုင်းမှာ ရှိရင် ပိုကောင်းပါတယ်။ ' : '') + donation);
  }
}

export const akhaAscendantNote = 'မူလလဂ် သို့မဟုတ် အခါလဂ်နှင့် နေ၊ လ ပူး၍ နေနှင့်လ အားကောင်းလျှင် ဥပဂြဟ၊ လတ္တာ၊ ပါတဒေါသတို့ကို ထည့်စဉ်းစားရန် မလိုကြောင်း မူရင်းတွင် ဆိုထားသည်။ အားကောင်းမှု သတ်မှတ်ချက်ကို ညွှန်းထားသော ဒုတိယတွဲ အခန်း ၁၉ နှင့် တိုက်စစ်ရမည်။';

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
  if (matchesPair(tri[day]) || (abhijit && matchesPair(tri[day], 28))) {
    const overridden = new Set([...adverse, ...weekdayWarnings].map(([name]) => name));
    for (const match of matches) {
      if (overridden.has(match.name)) {
        match.type = 'neutral';
        match.note = 'တြိအမြိတ္တယုဂ်ကြောင့် ဤနေ့နှင့်နက္ခတ် သို့မဟုတ် တိထီနှင့်နက္ခတ်အတွဲ၏ ဆိုးကျိုးကို ပယ်သည်။';
      }
    }
    add('တြိအမြိတ္တယုဂ်');
  }
  if (matchesPair(suta[day])) add('သုတယုဂ်');
  if (visa[day][0] === tithi && visa[day][1] === star && (day !== 2 || tithiIndex === 14)) add('ဝိသယုဂ်', 'caution');
  if (matchesPair(vinasa[day]) && !(day === 2 && tithiIndex === 29)) add('ဝိနာသယုဂ်', 'caution');
  additionalMatches(add, day, tithi, tithiIndex, star, context);
  supplementalMatches(matches, day, tithiIndex, star, context);
  return matches;
}

// Chapter 2: Sunday starts with Asawani. Each weekday advances four places
// in the 28-star cycle, with Abhijit between Uttarasadha and Sravana.
const weekdayYugaStarts = [0, 4, 8, 12, 16, 20, 24];
const yuga28 = [
  ['အာနန္ဒယုဂ်', 'သိဒ္ဓိ ပြီးမြောက်ခြင်း။'],
  ['ကာလဒဏ္ဍယုဂ်', 'သေခြင်းတရား။'],
  ['ဓူမရယုဂ်', 'အခက်အခဲ ကြီးမားခြင်း။'],
  ['ဓာတာယုဂ်', 'ကံကောင်းခြင်း။'],
  ['သောမယုဂ်', 'ချမ်းသာ သုခ ကြီးမားခြင်း။'],
  ['ဓွံသယုဂ်', 'စီးပွားပျက်ခြင်း။'],
  ['ကေတုယုဂ်', 'ကံဆိုးခြင်း။'],
  ['သီရိဝစ္ဆယုဂ်', 'ချမ်းသာ သုခ ကြီးမားခြင်း။'],
  ['ဝဇိရယုဂ်', 'ကုန်ခန်း ပျက်စီးခြင်း။'],
  ['မုဒ္ဂရယုဂ်', 'စီးပွားဥစ္စာ ပျက်စီးခြင်း။'],
  ['ဆတ္တယုဂ်', 'မင်းအစိုးရ၏ ချီးမြှောက်ခံရခြင်း။'],
  ['မိတ္တယုဂ်', 'ပြည့်ဝခြင်း။ ပေါလော ပေါများခြင်း။'],
  ['မာနသယုဂ်', 'ကံကောင်းခြင်း။'],
  ['ပဒုမယုဂ်', 'စီးပွားဥစ္စာ တိုးတက်ခြင်း။'],
  ['လုမ္ဗယုဂ်', 'စီးပွား ကုန်ခန်းခြင်း။'],
  ['ဥပ္ပါတယုဂ်', 'သေခြင်း။'],
  ['မိတ္ထုယုဂ်', 'သေခြင်း။'],
  ['ကာဏယုဂ်', 'အခက်အခဲ၊ အပူသောက များခြင်း။'],
  ['သိဒ္ဓိယုဂ်', 'သိဒ္ဓိ ပြီးမြောက်ခြင်း။'],
  ['သုဘယုဂ်', 'ကျက်သရေ မင်္ဂလာ ချမ်းသာသုခရှိခြင်း။'],
  ['အမြိတ္တယုဂ်', 'မင်းအစိုးရ၏ ချီးမြှောက်ခံရခြင်း။'],
  ['မူသလယုဂ်', 'စီးပွား ကုန်ခန်းခြင်း။'],
  ['ဂဒါယုဂ်', 'ရောဂါဘေးသင့်ခြင်း။'],
  ['မာတင်္ဂယုဂ်', 'အမျိုးအနွယ် တိုးပွားခြင်း။'],
  ['ရက္ခယုဂ်', 'အခက်အခဲ အပူသောက အလွန်ကြီးခြင်း။'],
  ['စရယုဂ်', 'လုပ်သမျှ အောင်မြင်ခြင်း။'],
  ['သုထိရယုဂ်', 'အိုးအိမ် ပိုင်ဆိုင်ခြင်း။'],
  ['ဝဍ္ဎမာနယုဂ်', 'အိမ်ထောင်ဖက်ကောင်း ရရှိခြင်း။'],
];
// Chapter 2 gives practices for these yugas and refers Ketu and Vajira to Upagraha.
const kalaDandaRemedy = 'နာရေး/ သေရေးကိစ္စတွေမှာ မိမိ စွမ်းတဲ့ဘက်က ကူညီပေးရင် ဘဝမှာ အခက်အခဲတွေ ပြေလည်ပြီး ချမ်းသာစေတတ်ပါတယ်။ ဒီယုဂ်သင့်ချိန်မှာ ဘယ်သူမဆို သေနေတဲ့ ခွေး/ကြောင်/ကြက်များကို တွေ့ရင် မြေမြှုပ်ခြင်း စသည်ဖြင့် မိမိ နိုင်တဲ့ဘက်က လုပ်ပေးခဲ့ရင် အင်မတန် ချမ်းသာကြွယ်ဝ စေပါတယ်။ ယမမင်း ကိုင်တဲ့ လက်နက်လို့ ပြောထားတာ ဖြစ်လို့ မိမိ ကိုးကွယ်သော နတ်များကို လက်နက်များ ကပ်လှူတာကိုလဲ သိပါ။';
const yugaRemedies = {
  1: 'ဒီလူတွေဟာ သူတစ်ပါး အပျော်ကို မနှောင့်ယှက်ရပါဘူး။ မိမိကိုယ်တိုင်လဲ ပြုံးပျော်ရွှင်လန်း နေထိုင်တတ်ရပါတယ်။ သူတစ်ပါးကိုလဲ အတတ်နိုင်ဆုံး ပျော်အောင် ထားပေးရပါတယ်။ ဒီယုဂ်ရချိန်မှာ အငြိမ့်ပွဲ ပေးရင်း စီးပွားတက်ပြီး ချမ်းသာသွားသူ ရှိပါတယ်။',
  2: kalaDandaRemedy,
  3: 'အမွှေးတိုင် ထွန်းပြီး လှူတာကအစ အောက်ဆီဂျင် လှူတာအဆုံး အားလုံးသိပါ။',
  4: 'ကပ်စေးနည်းရင် ဒီယုဂ်က ပြောထားသော ကောင်းကျိုးများကို မရပါဘူး။ ဒီယုဂ်ရှိချိန်မှာ ပုံမျိုးစုံ၊ နည်းမျိုးစုံနဲ့ လှူသာ လှူပါ။ ဘယ်သူမဆို လုပ်နိုင်ပါတယ်။',
  5: 'အစားအစာ၊ အဝတ်အထည်၊ ဂီတတွေမှာကအစ နူးညံ့ခြင်းသာ စွဲမက်ရှိတာကို ပြောနေတာပါ။ ဒါကြောင့် ဒီယုဂ်သင့်ချိန်မှာ ဒါမျိုးတွေကို ကိုယ်တိုင် ခံစားတာ၊ သူတစ်ပါးကို ပေးလှူတာတွေဟာ အလွန်ကောင်းမြတ်ပါတယ်။',
  6: 'ဘုန်းကြီးကျောင်း/ ဘုရားစေတီအစရှိတဲ့ သာသနာ့ဌာနတွေမှာ မြက်နှုတ် ပေါင်းသင်၊ ရုပ်ပွားတော်များကို ရောင်တော်ဖွင့်ခြင်းစသော ကုသိုလ်များ အလွန် လုပ်ကောင်းပါတယ်။',
  8: 'ဒီယုဂ်မရမီ တစ်ရက်ကြိုပြီး အိမ်သန့်ရှင်းရေး လုပ်ထားရပါတယ်။ ဒီယုဂ်ရချိန်မှာ လာဘ်လာဘ ပွင့်စေသော အစီအရင်များကို အိမ်မှာ လုပ်ချင်တိုင်း လုပ်လို့ ရပါတယ်။ ကောဇာမှာ ဒီယုဂ်သင့်ချိန် မိမိ တတ်စွမ်းသမျှ ရတနာ လှူတာဟာ အင်မတန် ချမ်းသာကြွယ်ဝ စေပါတယ်။ ရွှေလှူတာလဲ ရပါတယ်။',
  10: 'လက်နက်လို့ ပြောထားတာ ဖြစ်လို့ မိမိ ကိုးကွယ်သော နတ်များကို လက်နက်များ ကပ်လှူလို့ ရပါတယ်။ ဒါကို ဘယ်သူမဆို လုပ်နိုင်ပါတယ်။',
  15: 'မရှိဆင်းရဲသားများ ကောင်းစွာ ဝလင်စေမယ့် အစားရေစာ လှူတာဟာ ဒီယုဂ်ရဲ့ ဆိုးကျိုးကို အထူး ပယ်ရှားနိုင်စွမ်း ရှိပါတယ်။ ကောင်းကျိုးတွေ ရစေပါတယ်။',
  16: 'မနက်စောစော နေထွက်ချိန်မှာ အရှေ့အရပ်ကို မျက်နှာမူပြီး ဆန်စေ့/ စပါးစေ့စသည်များကို ခိုစာ/ ငှက်စာအဖြစ် ကြဲပက်ကျွေးရင် ဒီယုဂ်ဆိုးကျိုး ပြေပါသတဲ့။',
  17: 'ကာလဒဏ္ဍမှာ ရေးခဲ့တာတွေ ပြန်ဖတ်ပါ။ မရဏာနုဿတိ ပွားတာလဲ ရပါတယ်။\n\n' + kalaDandaRemedy,
  18: 'မျက်စိနဲ့ ပတ်သက်သော၊ အလင်းနဲ့ ပတ်သက်သော အလှူဒါနများ ပေးလှူတာဟာ ဆိုးကျိုးများ ပယ်စေပါတယ်။',
  20: 'ကျက်သရေ မင်္ဂလာရှိသော ပြုမူပြောဆို နေထိုင်ပုံတွေ ရှိသင့်တာပေါ့။',
  28: 'အိမ်ထောင်ရေး ဖောက်ပြန်မှုများ ပြုခဲ့ရင် စီးပွားပျက်၊ ဘဝပျက်အောင် ခိုက်တတ်ပါတယ်။ မူလဇာတာမှာလဲ ဒီအချက်တွေ သိထားရပါမယ်။',
};
const yugaUpagrahaReferences = {7: 'ကေတု', 9: 'ဝဇိရ'};

const yugaWarnings = {3:1, 6:5, 9:5, 10:5, 14:4, 15:4, 18:2, 22:2, 23:7};
const favorableYugas = [1,4,5,8,11,12,13,14,19,20,21,24,26,27,28];
const hour = 3600000;

export function akhaYuga28(weekday, starIndex) {
  const index = (starIndex - weekdayYugaStarts[weekday] + 28) % 28;
  const [name, effect] = yuga28[index];
  const number = index + 1;
  return {number, name, reading: effect, remedy: yugaRemedies[number],
    upagraha: yugaUpagrahaReferences[number],
    type: favorableYugas.includes(number) ? 'good' : 'caution',
    avoidMinutes: (yugaWarnings[number] ?? 0) * 24};
}

function lunarYugaIndex(moon) {
  if (moon.longitude >= 276 + 40/60 && moon.longitude < 280 + 53/60 + 20/3600) return 21;
  return moon.index + Number(moon.index >= 21);
}

function firstChangedMillisecond(low, high, valueAt, previous) {
  while (high - low > 1) {
    const mid = Math.floor((high + low) / 2);
    if (valueAt(mid) === previous) low = mid;
    else high = mid;
  }
  return high;
}

export function akhaIntervals(data, weekday, filters = {}) {
  const start = data.sunrise.getTime();
  const end = data.nextSunrise.getTime();
  const boundaries = new Set([start, end]);
  const ingressTimes = [];
  if (data.sunset && +data.sunset > start && +data.sunset < end) boundaries.add(+data.sunset);
  const isAbhijit = moon => moon.longitude >= 276 + 40/60 && moon.longitude < 280 + 53/60 + 20/3600;
  const sunSign = sun => Math.floor(sun.longitude / 30);
  const transitions = [
    [position => position.tithi],
    [position => position.yoga],
    [position => position.nakshatra],
    [position => position.moon.pada],
    [position => isAbhijit(position.moon)],
    [position => position.sun.index],
    [position => sunSign(position.sun), true],
  ];
  for (const [read, isIngress] of transitions) {
    const valueAt = time => read(panchangAt(new Date(time)));
    for (let from = start; from < end;) {
      const to = Math.min(end, from + 3600000);
      const prev = valueAt(from);
      if (prev !== valueAt(to)) {
        let low = from, high = to;
        while (high - low > 1) {
          const mid = Math.floor((high + low) / 2);
          if (valueAt(mid) === prev) low = mid;
          else high = mid;
        }
        if (isIngress && high < end) ingressTimes.push(high);
        boundaries.add(high);
      }
      from = to;
    }
  }
  const yugaIndexAt = time => lunarYugaIndex(panchangAt(new Date(time)).moon);
  const yugaStarts = new Map();
  let currentStar = yugaIndexAt(start);
  let earlier = start - hour;
  while (yugaIndexAt(earlier) === currentStar) earlier -= hour;
  let entry = firstChangedMillisecond(earlier, earlier + hour, yugaIndexAt, yugaIndexAt(earlier));
  for (const time of [...boundaries].sort((a, b) => a - b)) {
    if (time === end) break;
    const star = yugaIndexAt(time);
    if (star !== currentStar) {
      currentStar = star;
      entry = time;
    }
    const yuga = akhaYuga28(weekday, star);
    const avoidUntil = entry + yuga.avoidMinutes * 60000;
    yugaStarts.set(time, { ...yuga, starIndex: star, avoidUntil });
    if (avoidUntil > time && avoidUntil < end && yugaIndexAt(avoidUntil) === star) {
      boundaries.add(avoidUntil);
      yugaStarts.set(avoidUntil, { ...yuga, starIndex: star, avoidUntil });
    }
  }
  const times = [...boundaries].sort((a,b) => a-b);
  return times.slice(0,-1).map((from,index) => {
    const to = times[index+1];
    const mid = (from + to) / 2;
    const {tithi, nakshatra, moon, sun, yoga} = panchangAt(new Date(mid));
    const context = {...filters, yoga, pada: moon.pada, sunSign: sunSign(sun),
      sunStar: sun.index + 1, daylight: data.sunset && mid < +data.sunset};
    const matches = akhaMatches(weekday, tithi, nakshatra, isAbhijit(moon), context);
    const events = ingressTimes.filter(time => time === from).flatMap(time => {
      const position = panchangAt(new Date(time));
      return akhaMatches(weekday, position.tithi, position.nakshatra, isAbhijit(position.moon), { ingress: true })
        .filter(match => match.name.startsWith('တနင်္ဂနွေဂြိုဟ် ရာသီပြောင်း'))
        .map(match => ({ ...match, time: new Date(time) }));
    });
    const yuga = yugaStarts.get(from);
    return {from:new Date(from), to:new Date(to), tithi, nakshatra, pada:moon.pada, matches, events,
      yuga: {...yuga, avoid: from < yuga.avoidUntil}};
  });
}

// နက္ခတ်နှင့် အခါပိုင်းစနစ်များ: the nine fixed durations repeat three times.
const fixedAkhaMinutes = [28, 80, 24, 40, 28, 72, 64, 76, 68];

function lunarAkhaSlots(start, end, byPada) {
  const valueAt = time => {
    const moon = panchangAt(new Date(time)).moon;
    return byPada ? moon.index * 4 + moon.pada - 1 : moon.index;
  };
  const slots = [];
  let value = valueAt(start);
  let low = start - hour;
  while (valueAt(low) === value) low -= hour;
  let entry = firstChangedMillisecond(low, low + hour, valueAt, valueAt(low));
  while (entry < end) {
    let high = entry + hour;
    while (valueAt(high) === value) high += hour;
    const exit = firstChangedMillisecond(high - hour, high, valueAt, value);
    const star = byPada ? Math.floor(value / 4) : value;
    const pada = byPada ? value % 4 + 1 : undefined;
    for (let step = 0; step < 27; step++) {
      const from = entry + Math.round((exit - entry) * step / 27);
      const to = entry + Math.round((exit - entry) * (step + 1) / 27);
      if (to > start && from < end) {
        slots.push({star: (star + step) % 27, sourceStar: star, pada,
          from: new Date(Math.max(start, from)), to: new Date(Math.min(end, to))});
      }
    }
    entry = exit;
    value = valueAt(entry);
  }
  return slots;
}

export function akhaTimeDivisions(data) {
  const start = +data.sunrise;
  const end = +data.nextSunrise;
  const fixed = [];
  let star = panchangAt(data.sunrise).nakshatra;
  for (let from = start; from < end;) {
    const minutes = fixedAkhaMinutes[star % fixedAkhaMinutes.length];
    const to = Math.min(end, from + minutes * 60000);
    fixed.push({star, from: new Date(from), to: new Date(to)});
    star = (star + 1) % 27;
    from = to;
  }
  return [
    {title: 'နက္ခတ်ဝင်ချိန်မှ ၂၇ ပိုင်း', description: 'ဒီနက္ခတ် ဘယ်အချိန်က စပြီး ဘယ်အချိန်မှာ ကုန်မလဲဆိုတာ အတိအကျ သိရပါမယ်။ အဲဒီအချိန်ကာလကို ၂၇ ပုံ အညီအမျှ ပုံလိုက်ပါ။', slots: lunarAkhaSlots(start, end, false)},
    {title: 'ပါဒဝင်ချိန်မှ ၂၇ ပိုင်း', description: 'လိုအပ်ရင် နက္ခတ် တစ်ပါဒကို စန်းစီးတဲ့ ၆ နာရီတာကာလကို ခုလိုပဲ နက္ခတ် ၂၇ လုံး အပြည့်ရအောင် ပြေးကြည့်လို့ ရပါသေးတယ်။', slots: lunarAkhaSlots(start, end, true)},
    {title: 'နေထွက်ချိန်မှ သတ်မှတ်မိနစ်အလိုက်', description: 'မနက် နေထွက်ချိန်မှာ ဘယ်နက္ခတ် စန်းယှဉ်သလဲဆိုတာ ကြည့်ပါမယ်။ ပြီးရင် အဲဒီနက္ခတ်ကနေ စပြီး ဒီအခါပိုင်းစနစ်ကို သုံးပါမယ်။', slots: fixed},
  ];
}
