// The same three inward rays as the reference wheel, indexed clockwise
// from the top-left star of the current chart.
const axis = Array.from({ length: 7 }, (_, index) => index + 1);
export const tips = [
  ...axis.map(x => [x, 0]), ...axis.map(y => [8, y]),
  ...axis.map(x => [8 - x, 8]), ...axis.map(y => [0, 8 - y])
];
const inward = [[0, 1], [-1, 0], [0, -1], [1, 0]];

export function vedhaTargets(slot) {
  const [x, y] = tips[slot];
  const [dx, dy] = inward[Math.floor(slot / 7)];
  return [[dx - dy, dy + dx], [dx, dy], [dx + dy, dy - dx]].map(([vx, vy]) =>
    tips.findIndex(([tx, ty]) => (tx - x) * vy === (ty - y) * vx &&
      (tx - x) * vx + (ty - y) * vy > 0)
  );
}

export const vedhaNames = ['လက်ယာ', 'သမသတ်', 'လက်ဝဲ'];
export const vedhaColors = ['#895006', '#007f85', '#a72f80'];
