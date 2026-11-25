export const stars = [
  'အဿဝဏီ', 'ဘရဏီ', 'ကြတ္တိကာ', 'ရောဟဏီ', 'မိဂသီ', 'အဒြ', 'ပုဏ္ဏဖုသျှ',
  'ဖုသျှ', 'အဿလိသ', 'မာဃ', 'ပြုဗ္ဗဖလဂုဏီ', 'ဥတ္တရဖလဂုဏီ', 'ဟဿတ', 'စိတြ',
  'သွာတိ', 'ဝိသာခါ', 'အနုရာဓ', 'ဇေဋ္ဌ', 'မူလ', 'ပြုဗ္ဗာသာဠ်', 'ဥတ္တရာသာဠ်',
  'အဘိဇိ', 'သရဝဏ်', 'ဓနသိဒ္ဓိ', 'သတ္တဘိသျှ', 'ပြုဗ္ဗာဘဒြပိုဒ်', 'ဥတ္တရာဘဒြပိုဒ်', 'ရေဝတီ'
];

export const sections = {
  mu: ['မုခ', 'ရာဟုစီးနက္ခတ်', 38],
  guru: ['ဂူဍ', 'စက်စည်းကမ်းအရ ကိတ်စီးနက္ခတ်', 44],
  jiva: ['ဇီဝပက္ခ', 'ရာဟု စီးပြီးသော နက္ခတ်အစု', 46],
  mata: ['မတပက္ခ', 'ရာဟု ဆက်စီးမည့် နက္ခတ်အစု', 46],
  chest: ['ရင်ခြမ်း', 'ယာယီအားကောင်းရာ၊ အလင်းနှင့် အဝေးသဘော', 71],
  belly: ['ဝမ်းခြမ်း', 'နဂိုအားကောင်းရာ၊ အမှောင်နှင့် အနီးသဘော', 71],
  tail: ['အမြီးခြမ်း', 'ယာယီအားကောင်းရာ၊ အလင်းနှင့် အဝေးသဘော', 71],
  head: ['ဦးခေါင်းခြမ်း', 'နဂိုအားကောင်းရာ၊ အမှောင်နှင့် အနီးသဘော', 71],
  flower: ['ပုပ္ဖိတ', 'အပွင့်သဘော · စာအုပ်အရ တစ်လ', 96],
  fruit: ['ဖလိတ', 'အသီးသဘော · စာအုပ်အရ တစ်ပက္ခ (၁၅ ရက်)', 96],
  barren: ['နိဖ္ဖလ', 'အသီးကင်းခြင်းသဘော · စာအုပ်အရ ခြောက်လ', 96],
  decline: ['ဇဋိလ', 'မွဲယုတ်ရုပ်ဆိုးခြင်းသဘော · စာအုပ်အရ တစ်နှစ်', 96],
  rajas: ['ရာဇသ', 'ခေါင်းပါးခြင်းသဘော · စာအုပ်အရ တစ်နှစ်', 97],
  tamas: ['တာမသ', 'ပိုင်ဆိုင်မှုနှင့် အင်အား ယုတ်လျော့ခြင်းသဘော · စာအုပ်အရ ခြောက်လ', 97],
  vuddha: ['ဝုဒ္ဓ', 'ပြန်လည်ရုန်းထရန် ခက်ခဲခြင်းသဘော · စာအုပ်အရ တစ်လ', 97],
  death: ['မတ', 'ဆွေးမြေ့ခြင်းသဘော · စာအုပ်အရ တစ်ပက္ခ (၁၅ ရက်)', 97]
};

export const modes = {
  dwi: ['ဒွိဒင်', 36, 58],
  shad: ['ဆဒ္ဒင်', 59, 94],
  dasa: ['ဒသင်', 95, 126]
};

export const mod = n => (n % stars.length + stars.length) % stars.length;

// နက္ခတ်မှတ်စု အတွဲ ၇၊ စာ ၄၉၊ ၅၃။ ဇနမကို ၁ အဖြစ် ရေတွက်သည်။
export const birthStarRoles = [
  ['birth', 'ဇနမနက္ခတ်', 1],
  ['karma', 'ကမ္မနက္ခတ်', 10],
  ['samudayika', 'သာမုဒါယိကနက္ခတ်', 18],
  ['sanghatika', 'သံဃာဋိကနက္ခတ်', 16],
  ['jati', 'ဇာတိနက္ခတ်', 25],
  ['nidhana', 'နိဓနနက္ခတ်', 7],
  ['desa', 'ဒေသနက္ခတ်', 26],
  ['abhisheka', 'အဘိသေကနက္ခတ်', 27],
  ['adhana', 'အာဓာနနက္ခတ်', 19],
  ['vinashaka', 'ဝိနာသကနက္ခတ်', 23]
];

export function birthStarPositions(birth) {
  const abhijit = stars.indexOf('အဘိဇိ');
  const zodiac = stars.map((_, index) => index).filter(index => index !== abhijit);
  const start = zodiac.indexOf(birth);
  return Object.fromEntries(birthStarRoles.map(([id, , ordinal]) => [
    id, zodiac[(start + ordinal - 1) % zodiac.length]
  ]));
}

export function placement(rahu, star) {
  const distance = mod(star - rahu);
  if (distance === 0) return { dwi: 'mu', shad: 'mu', dasa: 'mu' };
  if (distance === 14) return { dwi: 'guru', shad: 'guru', dasa: 'guru' };
  const past = distance < 14;
  const count = past ? distance : 28 - distance;
  const group = past
    ? (count <= 7 ? 'chest' : 'belly')
    : (count <= 7 ? 'head' : 'tail');
  const subgroups = past
    ? ['flower', 'fruit', 'barren', 'decline']
    : ['death', 'vuddha', 'tamas', 'rajas'];
  const boundaries = [3, 7, 10];
  const sub = boundaries.filter(limit => count > limit).length;
  return { dwi: past ? 'jiva' : 'mata', shad: group, dasa: subgroups[sub] };
}

// အဘိဇိပါဝင်သည့် ၂၈ လုံးအစဉ်၊ စာမျက်နှာ ၈၅။
const compass = [
  ['အရှေ့မြောက်', 4], ['အရှေ့', 3], ['အရှေ့တောင်', 4], ['တောင်', 3],
  ['အနောက်တောင်', 4], ['အနောက်', 3], ['အနောက်မြောက်', 4], ['မြောက်', 3]
];
export const directions = compass.flatMap(([direction, count]) => Array(count).fill(direction));

export function side(axis, star) {
  const distance = mod(star - axis);
  if (distance === 0) return 'ဗဟို';
  if (distance === 14) return 'ဆန့်ကျင်ဘက်ဗဟို';
  return distance < 14 ? 'ညာဘက်ခြမ်း' : 'ဘယ်ဘက်ခြမ်း';
}

export function dwiTiming(rahu, sun, moon) {
  const group = star => ['guru', 'jiva'].includes(placement(rahu, star).dwi);
  if (group(sun) && group(moon)) return 'နှစ်ပါးလုံး ဇီဝဘက်တွင်ရှိသည်။ စာအုပ်အရ အခါရွေးရာတွင် ကောင်းသောအနေအထား။';
  if (!group(sun) && !group(moon)) return 'နှစ်ပါးလုံး မတဘက်တွင်ရှိသည်။ စာအုပ်အရ အခါရွေးရာတွင် ရှောင်ရန်။';
  return group(sun)
    ? 'တနင်္ဂနွေ ဇီဝဘက်၊ တနင်္လာ မတဘက်။ စိတ်အလိုကို ရုပ်မလိုက်သဖြင့် စာအုပ်အရ ယတြာအခါ ရှောင်ရန်။'
    : 'တနင်္လာ ဇီဝဘက်၊ တနင်္ဂနွေ မတဘက်။ စိတ်အလိုကို ရုပ်က လိုက်သဖြင့် စာအုပ်အရ ယတြာအခါ သင့်လျော်သည်။';
}

// မုခနှင့် ဂူဍကို သီးခြားစဉ်းစားသည့် စာမျက်နှာ ၅၃ နည်း။
export function dwiContest(rahu, sun, moon) {
  const sunGroup = placement(rahu, sun).dwi;
  const moonGroup = placement(rahu, moon).dwi;
  const pairs = {
    'mata/jiva': 'ယာယီ အောင်၊ နဂို ရှုံး',
    'jiva/mata': 'နဂို အောင်၊ ယာယီ ရှုံး',
    'mu/guru': 'ယာယီ အနည်းငယ် အသာစီး',
    'guru/mu': 'နဂို အနည်းငယ် အသာစီး',
    'jiva/jiva': 'စေ့စပ်ညှိနှိုင်းနိုင်',
    'mata/mata': 'နှစ်ဘက်လုံး ထိခိုက်'
  };
  const broadGroup = { mu: 'mata', guru: 'jiva', mata: 'mata', jiva: 'jiva' };
  return pairs[`${sunGroup}/${moonGroup}`] ?? pairs[`${broadGroup[sunGroup]}/${broadGroup[moonGroup]}`];
}

// Rows are Sun, columns are Moon. See pp. 72, 79–80, 82–83.
export const pairOrder = ['mu', 'chest', 'belly', 'guru', 'tail', 'head'];
const contest = [
  ['နှစ်ဘက်လုံး ပင်ပန်း', 'ယာယီ အောင်', 'ယာယီ အသာစီး', 'ယာယီ အောင်', 'နဂို အောင်', 'အားရှိသူ အောင်'],
  ['နဂို အောင်', 'ယာယီ အောင်', 'ယာယီ အောင်', 'ယာယီ အောင်', 'နဂို အောင်', 'နဂို အနည်းငယ် အသာစီး'],
  ['နဂို အောင်', 'ယာယီ အောင်', 'စေ့စပ်ညှိနှိုင်းနိုင်', 'နဂို အနည်းငယ် အသာစီး', 'နဂို အောင်', 'နဂို အောင်'],
  ['နဂို အနည်းငယ် အသာစီး', 'ယာယီ အောင်', 'ယာယီ အောင်', 'ယာယီ အနည်းငယ် အသာစီး', 'နဂို အောင်', 'နဂို အောင်'],
  ['နဂို အောင်', 'ယာယီ အောင်', 'ယာယီ အောင်', 'ယာယီ အနည်းငယ် အသာစီး', 'နှစ်ဘက် ထိခိုက်', 'နဂို အောင်'],
  ['နဂို အောင်', 'နဂို အောင်', 'ယာယီ အောင်', 'ယာယီ အောင်', 'နှစ်ဘက် ထိပ်တိုက်တွေ့', 'ယာယီ ထိခိုက်']
];
export function shadTiming(rahu, sun, moon) {
  return contest[pairOrder.indexOf(placement(rahu, sun).shad)][pairOrder.indexOf(placement(rahu, moon).shad)];
}
