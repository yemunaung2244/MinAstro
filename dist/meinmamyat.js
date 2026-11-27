import { janmaAt, solarNakshatraAt } from './janma.js';

// 9 boxes in placement order (3 nakshatras per box, starting from Sun's nakshatra).
export const meinmamyatBoxes = [
  {
    index: 0,
    direction: 'အလယ်ကွက်',
    reading: 'နှစ်ဦးနှစ်ဖက် ပျက်စီးမယ်။',
    good: false,
  },
  {
    index: 1,
    direction: 'အရှေ့',
    reading: 'လာဘ်လာဘ ပေါများ။ ကျက်သရေ မင်္ဂလာ ကြီးမား။',
    good: true,
  },
  {
    index: 2,
    direction: 'အရှေ့တောင်',
    reading: 'အဲဒီမိန်းမ သေမယ်။ ဒါမှမဟုတ် အမျိုးကို ဖျက်တဲ့ မိန်းမ ဖြစ်မယ်။',
    good: false,
  },
  {
    index: 3,
    direction: 'တောင်',
    reading: 'အဲဒီ မိန်းမ ကံဆိုး၊ ဆင်းရဲ၊ သေ။',
    good: false,
  },
  {
    index: 4,
    direction: 'အနောက်တောင်',
    reading: 'သားသမီး ရ။ ကံကောင်း ချမ်းသာသုခ ကြီးမား။',
    good: true,
  },
  {
    index: 5,
    direction: 'အနောက်',
    reading: 'မုဆိုးမ ဖြစ်မယ်။',
    good: false,
  },
  {
    index: 6,
    direction: 'အနောက်မြောက်',
    reading: 'ကိုယ်ကျင့်တရား မကောင်းတဲ့ မိန်းမ။',
    good: false,
  },
  {
    index: 7,
    direction: 'မြောက်',
    reading: 'အလွန် ချမ်းသာကြွယ်ဝ။',
    good: true,
  },
  {
    index: 8,
    direction: 'အရှေ့မြောက်',
    reading: 'စည်းစိမ် ကြီးမား။ သုခ ကြီးမား။',
    good: true,
  },
];

// Visual 3x3 layout matching the book's Atthaletkhwin diagram (East=Top, South=Right, West=Bottom, North=Left).
export const meinmamyatGridOrder = [
  8, 1, 2,
  7, 0, 3,
  6, 5, 4,
];

// 23 Nakshatra pairs (Pages 77-78): [first (ယောကျ်ား/နဂို/မူလ/စားသုံးသူ), second (မိန်းမ/မူလီ/ယာယီ/စားသုံးခြင်းခံရသူ), reading, good]
export const meinmamyatPairs = [
  [8, 2, 'နှစ်ဦးစုံ ပျက်စီး။', false],
  [22, 16, 'နှစ်ဦးစုံ ပျက်စီး။', false],
  [14, 8, 'နှစ်ဦးစုံ ပျက်စီး။', false],
  [1, 22, 'နှစ်ဦးစုံ ပျက်စီး။', false],
  [19, 13, 'နှစ်ဦးစုံ ပျက်စီး။', false],
  [2, 23, 'နှစ်ဦးစုံ ပျက်စီး။', false],
  [7, 1, 'မူလသည် အလွန် ကံကောင်း။', true],
  [9, 3, 'အလွန် ပွားစည်း ထွန်းကား။', true],
  [19, 4, 'မူလသည် မူလီနှင့် လမ်းခွဲရပြီး ပူဆွေးရမည်။', false],
  [12, 6, 'နှစ်ဦးပေါင်း လုပ်သမျှ အောင်မြင်သည်။ အကျိုးပေးကောင်းမည်။', true],
  [17, 11, 'လမ်းခွဲကြမည်။', false],
  [18, 12, 'ကျက်သရေ မင်္ဂလာ ကင်းမဲ့သည်။', false],
  [20, 14, 'နှစ်ဦးပေါင်း လုပ်သမျှ အလုပ်သည် နောင်တွင် သူတစ်ပါးကို အကျိုးပြုလိမ့်မည်။', false],
  [21, 15, 'မူလီသည် မူလကို မုန်းတီးမည်။', false],
  [6, 0, 'နှစ်ဦးပေါင်း လုပ်သမျှ အလုပ်သည် နောင်တွင် သူတစ်ပါးကို အကျိုးပြုလိမ့်မည်။', false],
  [26, 20, 'လောကီသုခချမ်းသာ အလွန် ပြည့်စုံသည်။', true],
  [25, 19, 'မူလသည် မူလီကို အလွန် ချစ်မြတ်နိုးမည်။', true],
  [0, 21, 'မူလီသည် မူလကို ထားခဲ့ပြီး ထွက်သွားလိမ့်မည်။', false],
  [23, 17, 'မူလသည် မူလီနှင့် လမ်းခွဲရပြီး ပူဆွေးရမည်။', false],
  [3, 24, 'အလွန် ပွားစည်း ထွန်းကား။', true],
  [4, 25, 'မူလသည် မူလီနှင့် လမ်းခွဲရပြီး ပူဆွေးရမည်။', false],
  [5, 26, 'ပတ်သက်နေသမျှ အဆင်မပြေပါ။ နောင်တွင် လမ်းခွဲကြလိမ့်မည်။', false],
  [15, 9, 'နှစ်ဦးပေါင်း လုပ်သောအလုပ်တို့မှ ဆိုးကျိုးများသာ ဖြစ်လာမည်။', false],
];

export function buildMeinmamyatChart(sunIndex, moonIndex) {
  const boxes = meinmamyatBoxes.map((box, boxIdx) => ({
    ...box,
    stars: [0, 1, 2].map(offset => (sunIndex + boxIdx * 3 + offset) % 27),
  }));
  const distance = (moonIndex - sunIndex + 27) % 27;
  const activeBoxIndex = Math.floor(distance / 3);
  return {
    sunIndex,
    moonIndex,
    distance,
    activeBox: boxes[activeBoxIndex],
    boxes,
  };
}

export function evaluateMeinmamyatAt(instant, overrideSunIndex) {
  const sun = solarNakshatraAt(instant);
  const moon = janmaAt(instant);
  const sunIdx = overrideSunIndex ?? sun.index;
  return {
    instant,
    sun,
    moon,
    ...buildMeinmamyatChart(sunIdx, moon.index),
  };
}

export function findMeinmamyatPair(firstIndex, secondIndex) {
  const idx = meinmamyatPairs.findIndex(([a, b]) => a === firstIndex && b === secondIndex);
  if (idx < 0) return null;
  const [first, second, reading, good] = meinmamyatPairs[idx];
  return { number: idx + 1, first, second, reading, good };
}

export function pairsForStar(starIndex) {
  return meinmamyatPairs
    .map(([first, second, reading, good], i) => ({ number: i + 1, first, second, reading, good }))
    .filter(p => p.first === starIndex || p.second === starIndex);
}
