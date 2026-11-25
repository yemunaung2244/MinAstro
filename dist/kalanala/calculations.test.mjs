import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fourteenSlots } from './chaturdasha.mjs';
import { anchorSlot, rotateStars, stars } from './calculations.mjs';
import { calculateAnchor, myanmarDateTime, myanmarInstant, planetaryStars, starIndex } from './ephemeris.mjs';

test('both Guda charts start at the upper-left star and proceed clockwise', () => {
  assert.equal(anchorSlot, 0);
  for (const anchor of stars.keys()) {
    const chart = rotateStars(anchor);
    assert.equal(chart[anchorSlot].star, anchor);
    assert.deepEqual(chart.map(slot => slot.star), stars.map((_, offset) => (anchor + offset) % stars.length));
    assert.equal(fourteenSlots[anchorSlot], 0);
    assert.equal(new Set(chart.map(slot => slot.star)).size, 28);
    assert.deepEqual([0, 1, 2, 3, 4, 5].map(group => chart.filter(slot => slot.group === group).length),
      [3, 9, 3, 3, 7, 3]);
  }
});

test('Myanmar civil time round-trips and rejects nonexistent dates', () => {
  assert.equal(myanmarInstant('2024-09-18T07:00').toISOString(), '2024-09-18T00:30:00.000Z');
  assert.equal(myanmarDateTime(myanmarInstant('1900-01-01T12:18:02')), '1900-01-01T12:18:02');
  assert.throws(() => myanmarInstant('2024-02-30T12:00'), RangeError);
  assert.throws(() => calculateAnchor(4, '2201'), RangeError);
});

test('full moon on both sides of opposition matches the published UTC date', () => {
  // NASA Daily Moon Guide lists the September 2024 full moon on September 18 UTC.
  const waxing = calculateAnchor(2, '2024-09-18T07:00');
  const waning = calculateAnchor(2, '2024-09-19T07:00');
  assert.ok(waxing.instant.startsWith('2024-09-18T'));
  assert.ok(Math.abs(Date.parse(waxing.instant) - Date.parse(waning.instant)) < 1000);
  assert.equal(waxing.anchor, waning.anchor);
});

test('birth and daily modes use the selected instant, annual uses sidereal ingress', () => {
  assert.deepEqual(calculateAnchor(0, '2024-09-18T07:00'), calculateAnchor(3, '2024-09-18T07:00'));
  const annual = calculateAnchor(4, '2024');
  assert.ok(Date.parse(annual.instant) >= Date.UTC(2024, 3, 13));
  assert.ok(Date.parse(annual.instant) < Date.UTC(2024, 3, 15));
  assert.equal(annual.anchor, starIndex(annual.longitude));
});

test('Abhijit and the ordinary lunar sectors map to chart positions', () => {
  assert.equal(starIndex(278), 21);
  assert.equal(starIndex(281), 22);
  assert.equal(starIndex(360), 0);
});

test('planet chart positions resolve to nine valid stars', () => {
  const positions = planetaryStars(myanmarInstant('2024-09-18T07:00'));
  assert.equal(positions.length, 9);
  assert.ok(positions.every(star => Number.isInteger(star) && stars[star]));
});

test('natal full moon uses the Myanmar calendar full-moon day', () => {
  for (const clock of ['10:45', '22:45']) {
    const birth = '1988-02-03T' + clock;
    assert.equal(stars[calculateAnchor(0, birth).anchor][0], 'အဿလိဿ');
    const natal = calculateAnchor(1, birth);
    assert.equal(myanmarDateTime(new Date(natal.instant)), '1988-02-02T06:00:00');
    assert.equal(stars[natal.anchor][0], 'ဖုသျှ');
  }
});
