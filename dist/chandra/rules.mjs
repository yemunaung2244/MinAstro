const arms = 'အရည်အချင်း အစွမ်းအစ အလွန်ကောင်းမယ်။';
const guda = 'ကျက်သရေ မင်္ဂလာ အလွန် ကြီးမားမယ်။';
const feet = 'အပူသောက မရှိ၊ ငြိမ်းချမ်းမယ်။';

const parts = [
  ['ဦးခေါင်း', 3, 'စီးပွားဥစ္စာ ဖြစ်ထွန်းမယ်။'],
  ['မျက်နှာ', 3, guda],
  ['ညာဘက်လက်', 3, arms],
  ['ဘယ်ဘက်လက်', 3, arms],
  ['ရင်ဘတ်', 3, 'အလွန် ကောင်းမြတ်တယ်။'],
  ['ဝမ်းဗိုက်', 3, 'လမ်းခရီးမှာ သေမယ်။'],
  ['ဂုဒ · ညာဘက်ခြမ်း', 1, guda],
  ['ဂုဒ · ဘယ်ဘက်ခြမ်း', 1, guda],
  ['ဂုဒ · စအို', 1, guda],
  ['ညာဘက်ခြေ', 3, feet],
  ['ဘယ်ဘက်ခြေ', 3, feet],
];

export function chandraRegions(anchor) {
  let offset = 0;
  return parts.map(([name, count, reading]) => {
    const start = offset;
    offset += count;
    return { name, reading, start, stars: Array.from({ length: count }, (_, i) => (anchor + start + i) % 27) };
  });
}
