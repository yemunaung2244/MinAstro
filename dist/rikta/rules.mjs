export const groups = ['ရိတ္တာ', 'ပုဏ္ဏာ'];

export function tithiGroup(index) {
  if (index === 14) return 0; // Full moon tithi.
  if (index === 29) return 1; // New moon tithi.
  return (index % 15) % 2;
}
