export const ordinals = [4, 11, 18, 25, 28];

// The printed lookup has 27 rows. Its last two columns advance 23 and
// 26 positions in that list, while the prose counts on a 28-star wheel.
const tableOffsets = [3, 10, 17, 23, 26];

export function rudraTargets(sun, useTable) {
  const size = useTable ? 27 : 28;
  return ordinals.map((ordinal, index) => (sun + (useTable ? tableOffsets[index] : ordinal - 1)) % size);
}
