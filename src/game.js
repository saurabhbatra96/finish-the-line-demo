// The rules, kept the same as the live game. Pure code: no page, no clock, no storage.
export const PER_DAY = 3;
export const MAX_POINTS = 100;
/** A mean error of this share of the chart's height scores zero. */
export const ZERO_AT = 0.25;

/** The number of years the player must draw. */
export const hiddenCount = (chart) => chart.years.length - chart.cut;

/** The mean distance between the drawn line and the real line, as a share of the chart's height. */
export function errorShare(chart, guess) {
  const real = chart.values.slice(chart.cut);
  const height = chart.axis[1] - chart.axis[0];
  const sum = real.reduce((total, value, index) => total + Math.abs(guess[index] - value), 0);
  return sum / real.length / height;
}

export function pointsFor(chart, guess) {
  return Math.round(MAX_POINTS * Math.max(0, 1 - errorShare(chart, guess) / ZERO_AT));
}

export const total = (run) => run.answers.reduce((sum, answer) => sum + answer.points, 0);

export function markFor(answer) {
  if (answer.base >= 80) return '🎯';
  if (answer.base >= 50) return '🟩';
  return answer.base >= 20 ? '🟨' : '🟥';
}

export function shareText(day, run, url) {
  const marks = run.answers.map((answer) => markFor(answer) + (answer.doubled ? '×2' : '')).join(' ');
  return `Finish the Line #${day}\n${marks}\n${total(run)} of ${MAX_POINTS * (PER_DAY + 1)} points\n${url}`;
}

export function rankFor(points) {
  if (points >= 320) return 'Oracle';
  if (points >= 240) return 'Sharp';
  if (points >= 160) return 'Solid';
  return points >= 80 ? 'Hazy' : 'Rough day';
}

/** A short form of a value for labels: 8.2 billion, 45%, $12,100, 84.0 years. */
export function formatValue(value, unit) {
  const size = Math.abs(value);
  let text;
  if (size >= 1e9) text = (value / 1e9).toFixed(size >= 1e10 ? 1 : 2) + ' billion';
  else if (size >= 1e6) text = (value / 1e6).toFixed(size >= 1e8 ? 0 : 1) + ' million';
  else if (size >= 1000) text = Math.round(value).toLocaleString('en-GB');
  else text = value.toFixed(size >= 100 ? 0 : size >= 10 ? 1 : 2);
  if (unit === '%') return text + '%';
  if (unit === '$') return '$' + text;
  return `${text} ${unit}`;
}
