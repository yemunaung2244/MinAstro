import { mod } from './calculations.mjs';

// The chart starts at the top centre and proceeds clockwise.
const axis = Array.from({ length: 7 }, (_, index) => 192 + 36 * index);
const perimeter = [
  ...axis.map(x => [x, 156]),
  ...axis.map(y => [444, y]),
  ...axis.map((_, index) => [axis[6 - index], 444]),
  ...axis.map((_, index) => [156, axis[6 - index]])
];

export const dwiTips = [...perimeter.slice(3), ...perimeter.slice(0, 3)];

const inward = [[0, 1], [-1, 0], [0, -1], [1, 0]];
const chartTargets = dwiTips.map(([x, y], index) => {
  const [dx, dy] = inward[Math.floor(((index + 3) % 28) / 7)];
  return [[dx - dy, dy + dx], [dx, dy], [dx + dy, dy - dx]].map(([vx, vy]) =>
    dwiTips.findIndex(([tx, ty]) => {
      const horizontal = tx - x;
      const vertical = ty - y;
      return horizontal * vy === vertical * vx && horizontal * vx + vertical * vy > 0;
    })
  );
});

export const dwiVedha = (rahu, star) => chartTargets[mod(star - rahu)].map(index => mod(rahu + index));
export const vedhaNames = ['လက်ယာ', 'သမသတ်', 'လက်ဝဲ'];
export const vedhaColors = ['#895006', '#007f85', '#a72f80'];
