const chestReading = 'လင်ကို ချစ်မြတ်နိုးသော အမျိုးသမီး။ ချစ်ဖွယ်စကား ပြောကြားတတ်သော အမျိုးသမီး။ လင်ကို မိမိအပေါ် ချစ်မြတ်နိုးမှု တိုးစေတတ်သော အမျိုးသမီး။';

export const regions = [
  { name: 'ဦးခေါင်း', count: 3, reading: 'ညှဉ်းပန်း နှိပ်စက်တတ်သူ။ ပူလောင်သောက ရောက်စေတတ်သူ။ ပစ္စည်းဥစ္စာ မမြဲသူ။' },
  { name: 'မျက်နှာ', count: 7, reading: 'စားကောင်း သောက်ဖွယ် စားသောက်နေရသော အမျိုးသမီး။ သုခချမ်းသာ ပြည့်ဝနေသော အမျိုးသမီး။' },
  { name: 'ညာဘက် ရင်အုံ', count: 4, reading: chestReading },
  { name: 'ဘယ်ဘက် ရင်အုံ', count: 4, reading: chestReading },
  { name: 'ရင်ညွန့်', count: 3, reading: 'ကံကောင်းသူ။ ပြုံးရွှင်နေသူ။ ချစ်ခြင်းဖြင့် အားပြည့်ရွှင်လန်းစေတတ်သူ။' },
  { name: 'ချက် / ဝမ်း', count: 3, reading: 'စိတ်ရွှင်လန်း မြူးထူးနေသူ။ စိတ်တိုလွယ်သူ။ ကံကောင်းသူ။ ကံကောင်းစေတတ်သူ။ ဝီရိယ ကောင်းသူ။ စိတ်ထားကောင်းသူ။' },
  { name: 'လိင်အင်္ဂါ', count: 3, reading: 'လိင်စိတ် ပြင်းပြနေသူ။ မေထုန်များစွာ မှီဝဲသူ။' },
];

export function chartRegions(sun) {
  let offset = 0;
  return regions.map(region => {
    const start = offset;
    offset += region.count;
    const stars = Array.from({ length: region.count }, (_, index) => (sun + start + index) % 27);
    return { ...region, start, stars };
  });
}
