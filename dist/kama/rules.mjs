// The source begins its first group with Revati, followed by Ashwini.
export const groups = [
  { name: 'အစ', stars: [26, 0, 1, 2, 3, 4] },
  { name: 'အလယ်', stars: Array.from({ length: 12 }, (_, index) => index + 5) },
  { name: 'အဆုံး', stars: Array.from({ length: 9 }, (_, index) => index + 17) },
];

const sameGroup = 'အုပ်စုတူသဖြင့် တစ်ဦးကိုတစ်ဦး အလွန်ချစ်ခင်၊ စွဲလမ်းတတ်သည်ဟု ကျမ်းတွင် ဖော်ပြထားသည်။ ';
const extremePair = 'တွေ့ခါစတွင် အလွန်စွဲလမ်းတပ်မက်တတ်သည်။ ရေရှည်တွင် သဘောထား အကြီးအကျယ် ကွဲလွဲပြီး အနှောင့်အယှက် ကြီးမားတတ်ကြောင်း ကျမ်းတွင် ဖော်ပြထားသည်။';
const readings = [
  [sameGroup + 'နှစ်ဦးလုံး အစနက္ခတ်ဖြစ်လျှင် အမျိုးသမီးက အမျိုးသားကို ပိုချစ်တတ်သည်။',
    'အစအုပ်စုဝင်က အလယ်အုပ်စုဝင်ကို သနားစိတ်ဖြင့် ချစ်မြတ်နိုးတတ်သည်။', extremePair],
  ['အလယ်အုပ်စုဝင်က အစအုပ်စုဝင်ကို အထင်ကြီး၊ အားကိုး၊ ယုံကြည်၊ လေးစားမှုဖြင့် ချစ်တတ်သည်။',
    sameGroup + 'နှစ်ဦးလုံး အလယ်နက္ခတ်ဖြစ်လျှင် အမျိုးသားက အမျိုးသမီးကို ပိုချစ်တတ်သည်။',
    'အလယ်အုပ်စုဝင်က အဆုံးအုပ်စုဝင်ကို သနားစိတ်ဖြင့် ချစ်မြတ်နိုးတတ်သည်။'],
  [extremePair, 'အဆုံးအုပ်စုဝင်က အလယ်အုပ်စုဝင်ကို အထင်ကြီး၊ အားကိုး၊ ယုံကြည်၊ လေးစားမှုဖြင့် ချစ်တတ်သည်။',
    sameGroup + 'နှစ်ဦးလုံး အဆုံးနက္ခတ်ဖြစ်လျှင် ချစ်ခင်မှုထက် တပ်မက်မှု ပိုများတတ်သည်။'],
];

export function compareStars(man, woman) {
  const first = groups.findIndex(group => group.stars.includes(man));
  const second = groups.findIndex(group => group.stars.includes(woman));
  const reading = readings[first][second];
  return { first: groups[first], second: groups[second], reading: Math.abs(first - second) === 1
    ? reading + ' ' + readings[second][first] : reading };
}
