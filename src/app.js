// The page: draws the chart, takes the drawn line, shows the reveal and the results.
import { CHARTS, DAY } from './series.js';
import { MAX_POINTS, PER_DAY, hiddenCount, pointsFor, rankFor, shareText, formatValue, total } from './game.js';

/** Drawn points per hidden year. The score uses one value per year; the extra points make the line smooth. */
const SUB = 4;
const NS = 'http://www.w3.org/2000/svg';
const HINT_MS = 3400;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (id) => document.getElementById(id);
const els = {
  ticks: $('ticks'), count: $('count'), helpBtn: $('helpBtn'), help: $('help'),
  play: $('play'), title: $('title'), ask: $('ask'), wrap: $('chartWrap'), chart: $('chart'),
  status: $('status'), actions: $('actions'), clearBtn: $('clearBtn'), doubleBtn: $('doubleBtn'),
  doubleSub: $('doubleSub'), lockBtn: $('lockBtn'),
  result: $('result'), score: $('score'), scoreOf: $('scoreOf'), takeaway: $('takeaway'), nextBtn: $('nextBtn'),
  results: $('results'), resDay: $('resDay'), total: $('total'), verdict: $('verdict'), rows: $('rows'),
  shareBtn: $('shareBtn'), againBtn: $('againBtn'), themeColor: $('themeColor')
};

let run = { index: 0, answers: [] };
/** The state of the chart on the screen. */
let view = null;

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const doubleUsed = () => run.answers.some((answer) => answer.doubled);

function svg(name, attrs = {}, parent) {
  const node = document.createElementNS(NS, name);
  for (const key of Object.keys(attrs)) node.setAttribute(key, attrs[key]);
  if (parent) parent.appendChild(node);
  return node;
}

function html(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const fixed = (value) => value.toFixed(1);
/** A path of straight lines through the points. */
const line = (points) => points.map((p, i) => (i ? 'L' : 'M') + fixed(p[0]) + ' ' + fixed(p[1])).join(' ');
/** A smooth path through the points: each point is the control point of a curve between two midpoints. */
function curve(points) {
  if (points.length < 3) return line(points);
  let d = 'M' + fixed(points[0][0]) + ' ' + fixed(points[0][1]);
  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = (points[i][0] + points[i + 1][0]) / 2;
    const midY = (points[i][1] + points[i + 1][1]) / 2;
    d += ` Q${fixed(points[i][0])} ${fixed(points[i][1])} ${fixed(midX)} ${fixed(midY)}`;
  }
  const end = points[points.length - 1];
  return d + ` L${fixed(end[0])} ${fixed(end[1])}`;
}

function countUp(node, target, prefix = '') {
  if (reduceMotion || target === 0) { node.textContent = prefix + target; return; }
  const start = performance.now();
  const step = (now) => {
    const share = Math.min(1, (now - start) / 700);
    node.textContent = prefix + Math.round(target * (1 - Math.pow(1 - share, 3)));
    if (share < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function setProgress(done, label) {
  [...els.ticks.children].forEach((tick, i) => tick.classList.toggle('on', i < done));
  els.count.textContent = label;
}

/* ---------- one chart ---------- */

function startChart() {
  stopHint();
  const chart = CHARTS[run.index];
  const hidden = hiddenCount(chart);
  view = {
    chart, hidden, n: hidden * SUB, fine: Array(hidden * SUB).fill(null),
    locked: false, doubled: false, answer: null, last: null, down: false, geo: null, parts: null, hintFrame: 0
  };
  els.title.textContent = chart.title;
  els.ask.textContent = `What happened after ${chart.years[chart.cut - 1]}?`;
  setProgress(run.index + 1, `${run.index + 1}/${PER_DAY}`);
  els.result.hidden = true;
  els.actions.hidden = false;
  els.status.hidden = false;
  layout();
  refresh();
}

/** The number of drawn points, counted from the dot. The line never has a gap. */
function filled() {
  let count = 0;
  while (count < view.n && view.fine[count] != null) count += 1;
  return count;
}

/** Builds the chart for the size of its box. Runs again when the box changes size. */
function layout() {
  if (!view) return;
  const W = els.wrap.clientWidth;
  const H = els.wrap.clientHeight;
  if (!W || !H) return;
  stopHint();

  const { years, values, cut, axis, unit } = view.chart;
  const wide = W >= 700;
  const padX = wide ? 2 : 24;
  const top = 24;
  const bottom = H - 36;
  const x0 = padX;
  const x1 = W - padX;
  const xAt = (index) => x0 + ((x1 - x0) * index) / (years.length - 1);
  const yAt = (value) => bottom - ((value - axis[0]) / (axis[1] - axis[0])) * (bottom - top);
  const vAt = (y) => axis[0] + ((bottom - y) / (bottom - top)) * (axis[1] - axis[0]);
  const xs = xAt(cut - 1);
  const ys = yAt(values[cut - 1]);
  const lastYear = years[years.length - 1];
  view.geo = { W, H, top, bottom, x0, x1, xs, ys, step: (x1 - xs) / view.n, xAt, yAt, vAt, wide };

  const root = els.chart;
  root.setAttribute('viewBox', `0 0 ${W} ${H}`);
  root.replaceChildren();

  svg('rect', { class: 'zone', x: xs, y: top - 4, width: x1 - xs, height: bottom - top + 4 }, root);

  for (let i = 0; i <= 3; i += 1) {
    const value = axis[0] + ((axis[1] - axis[0]) * i) / 3;
    const y = Math.round(yAt(value)) + 0.5;
    svg('line', { class: i === 0 ? 'axis' : 'grid', x1: x0, y1: y, x2: x1, y2: y }, root);
    const text = (Number.isInteger(value) ? String(value) : value.toFixed(1)) + (unit === '%' ? '%' : '');
    svg('text', { class: 'tick-label', x: x0, y: y - 6 }, root).textContent = text;
  }
  svg('line', { class: 'finish', x1: x1 - 0.5, y1: top - 4, x2: x1 - 0.5, y2: bottom }, root);

  const labelY = bottom + 20;
  svg('text', { class: 'year-label', x: x0, y: labelY }, root).textContent = years[0];
  svg('text', { class: 'year-label cut', x: xs, y: labelY, 'text-anchor': 'middle' }, root).textContent = years[cut - 1];
  svg('text', { class: 'year-label', x: x1, y: labelY, 'text-anchor': 'end' }, root).textContent = lastYear;

  const known = values.slice(0, cut).map((value, index) => [xAt(index), yAt(value)]);
  svg('path', { class: 'known', d: line(known) }, root);

  const gap = svg('path', { class: 'gap', d: '' }, root);
  const user = svg('path', { class: 'user', d: '' }, root);
  const tip = svg('circle', { class: 'tip', r: 0 }, root);
  const real = svg('path', { class: 'real', d: '' }, root);

  const hint = svg('g', { 'aria-hidden': 'true' }, root);
  const ghost = svg('path', { class: 'ghost', d: ghostPath(view.geo) }, hint);
  const finger = svg('circle', { class: 'finger', r: 13, cx: xs, cy: ys }, hint);
  svg('circle', { class: 'pulse', r: 7, cx: xs, cy: ys }, hint);
  const below = ys < (top + bottom) / 2;
  const hintText = svg('text', { class: 'hint-text', 'text-anchor': 'middle' }, hint);
  const hintX = xs + (x1 - xs) / 2;
  const hintY = below ? ys + 58 : ys - 66;
  if (x1 - xs < 190) {
    svg('tspan', { x: hintX, y: hintY }, hintText).textContent = 'Drag from the dot';
    svg('tspan', { x: hintX, y: hintY + 18 }, hintText).textContent = `to ${lastYear}`;
  } else {
    svg('tspan', { x: hintX, y: hintY }, hintText).textContent = `Drag from the dot to ${lastYear}`;
  }

  svg('circle', { class: 'dot', r: wide ? 7 : 6, cx: xs, cy: ys }, root);
  const labels = svg('g', {}, root);

  view.parts = { gap, user, tip, real, hint, ghost, finger, labels };
  paintUser();
  hint.style.display = 'none';
  if (view.locked) drawReveal(false);
  else if (filled() === 0) startHint();
}

/* ---------- the hint: a hand-drawn stroke that shows where to drag ---------- */

/** A loose wobble from the dot to the right edge. It ends near the level of the dot, so it does not suggest an answer. */
function ghostPath(geo) {
  const width = geo.x1 - geo.xs;
  const scale = clamp(width / 137, 1, 1.8);
  const shape = [
    [0.064, -5.4], [0.123, -16.4], [0.203, -13.4],
    [0.284, -10.4], [0.298, 8.6], [0.393, 6.6],
    [0.488, 4.6], [0.525, -21.4], [0.62, -22.4],
    [0.715, -23.4], [0.744, -3.4], [0.832, -2.4],
    [0.898, -1.4], [0.949, -7.4], [1, -11.4]
  ];
  const points = shape.map(([share, dy]) => [geo.xs + share * width, clamp(geo.ys + dy * scale, geo.top + 4, geo.bottom - 4)]);
  let d = `M${fixed(geo.xs)} ${fixed(geo.ys)}`;
  for (let i = 0; i < points.length; i += 3) {
    d += ` C${fixed(points[i][0])} ${fixed(points[i][1])} ${fixed(points[i + 1][0])} ${fixed(points[i + 1][1])} ${fixed(points[i + 2][0])} ${fixed(points[i + 2][1])}`;
  }
  return d;
}

/** Time to progress along the stroke. A hand is fast on the straight parts and slow on the turns. */
const HINT_KEYS = [[0, 0], [0.06, 0], [0.2, 0.24], [0.27, 0.31], [0.41, 0.55], [0.47, 0.6], [0.6, 0.84], [0.66, 0.88], [0.76, 1], [1, 1]];
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
function hintProgress(t) {
  for (let i = 1; i < HINT_KEYS.length; i += 1) {
    if (t <= HINT_KEYS[i][0]) {
      const [t0, p0] = HINT_KEYS[i - 1];
      const [t1, p1] = HINT_KEYS[i];
      return p0 + (p1 - p0) * ease((t - t0) / (t1 - t0));
    }
  }
  return 1;
}

function startHint() {
  stopHint();
  if (!view || !view.parts || view.locked || filled() > 0) return;
  const { hint, ghost, finger } = view.parts;
  hint.style.display = '';
  const length = ghost.getTotalLength();
  ghost.style.strokeDasharray = length;
  if (reduceMotion) {
    ghost.style.strokeDashoffset = 0;
    ghost.style.opacity = 0.55;
    finger.style.opacity = 0;
    return;
  }
  const start = performance.now();
  const frame = (now) => {
    const t = ((now - start) % HINT_MS) / HINT_MS;
    const progress = hintProgress(t);
    const shown = t < 0.06 ? t / 0.06 : t > 0.88 ? (1 - t) / 0.12 : 1;
    const at = ghost.getPointAtLength(length * progress);
    ghost.style.strokeDashoffset = length * (1 - progress);
    ghost.style.opacity = 0.55 * shown;
    finger.setAttribute('cx', at.x);
    finger.setAttribute('cy', at.y);
    finger.setAttribute('r', 13 * (1 + 0.35 * (1 - shown)));
    finger.style.opacity = shown;
    view.hintFrame = requestAnimationFrame(frame);
  };
  view.hintFrame = requestAnimationFrame(frame);
}

function stopHint() {
  if (!view) return;
  if (view.hintFrame) cancelAnimationFrame(view.hintFrame);
  view.hintFrame = 0;
  if (view.parts) view.parts.hint.style.display = 'none';
}

/* ---------- drawing ---------- */

/** The drawn line as points on the screen. Each point is softened by its neighbours, so a shaky hand gives a calm line. */
function userPoints() {
  const { fine, geo, chart, n } = view;
  const points = [[geo.xs, geo.ys]];
  const start = chart.values[chart.cut - 1];
  for (let k = 0; k < n && fine[k] != null; k += 1) {
    const prev = k === 0 ? start : fine[k - 1];
    const next = k + 1 < n && fine[k + 1] != null ? fine[k + 1] : fine[k];
    const value = k === n - 1 ? fine[k] : (prev + 2 * fine[k] + next) / 4;
    points.push([geo.xs + (k + 1) * geo.step, geo.yAt(value)]);
  }
  return points;
}

function paintUser() {
  const { user, tip } = view.parts;
  const points = userPoints();
  user.setAttribute('d', points.length > 1 ? curve(points) : '');
  const end = points[points.length - 1];
  tip.setAttribute('cx', end[0]);
  tip.setAttribute('cy', end[1]);
  tip.setAttribute('r', points.length > 1 && !view.locked ? 5 : 0);
}

function pointFrom(event) {
  const box = els.chart.getBoundingClientRect();
  const { geo, chart, n } = view;
  const x = (event.clientX - box.left) * (geo.W / box.width);
  const y = (event.clientY - box.top) * (geo.H / box.height);
  return {
    x,
    k: clamp(Math.round((x - geo.xs) / geo.step) - 1, 0, n - 1),
    v: clamp(geo.vAt(y), chart.axis[0], chart.axis[1])
  };
}

/** Puts a point into the line. Points between the last one and this one get values on a straight line. */
function addPoint(point) {
  const { fine, chart } = view;
  let from = view.last;
  if (!from) {
    let i = point.k - 1;
    while (i >= 0 && fine[i] == null) i -= 1;
    from = i >= 0 ? { k: i, v: fine[i] } : { k: -1, v: chart.values[chart.cut - 1] };
  }
  if (point.k === from.k) {
    fine[point.k] = point.v;
  } else {
    const step = point.k > from.k ? 1 : -1;
    for (let i = from.k + step; i !== point.k + step; i += step) {
      if (i >= 0) fine[i] = from.v + ((point.v - from.v) * (i - from.k)) / (point.k - from.k);
    }
  }
  view.last = { k: point.k, v: point.v };
  if (!view.span) view.span = { low: point.k, high: point.k };
  view.span.low = Math.min(view.span.low, point.k);
  view.span.high = Math.max(view.span.high, point.k);
}

/**
 * Joins a new stroke to the line that was there before. Without this, a stroke over part of an old line
 * leaves a sharp step at each end, and a single tap leaves a spike.
 */
function blendEnds() {
  const { fine, span, n } = view;
  if (!span) return;
  const reach = SUB * 2;
  for (const [from, direction] of [[span.low, -1], [span.high, 1]]) {
    for (let d = 1; d <= reach; d += 1) {
      const i = from + direction * d;
      if (i < 0 || i >= n || fine[i] == null) break;
      const weight = Math.pow(1 - d / (reach + 1), 2);
      fine[i] += (fine[from] - fine[i]) * weight;
    }
  }
  view.span = null;
}

/** A finger stops a little before the right edge. A short gap at the end continues at the last value. */
function closeTail() {
  const count = filled();
  const tail = Math.max(2, Math.ceil(view.hidden * 0.1)) * SUB;
  if (count > 0 && count < view.n && view.n - count <= tail) view.fine.fill(view.fine[count - 1], count);
}

function onDown(event) {
  if (!view || view.locked || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const point = pointFrom(event);
  if (point.x < view.geo.xs - 28) return;
  event.preventDefault();
  try { els.chart.setPointerCapture(event.pointerId); } catch (error) { /* the pointer is gone */ }
  view.down = true;
  view.last = null;
  view.span = null;
  stopHint();
  addPoint(point);
  paintUser();
  refresh();
}

function onMove(event) {
  if (!view || !view.down || view.locked) return;
  addPoint(pointFrom(event));
  paintUser();
  refresh();
}

function onUp() {
  if (!view || !view.down) return;
  view.down = false;
  view.last = null;
  blendEnds();
  closeTail();
  paintUser();
  refresh();
}

/** Sets the status line and the buttons from the state of the line. */
function refresh() {
  const { chart } = view;
  const count = filled();
  const done = count === view.n;
  const used = doubleUsed();
  const lastYear = chart.years[chart.years.length - 1];

  els.clearBtn.hidden = count === 0;
  els.lockBtn.disabled = !done;
  els.doubleBtn.disabled = used;
  els.doubleBtn.setAttribute('aria-pressed', String(view.doubled && !used));
  els.doubleSub.textContent = used ? 'USED' : 'SCORE';

  const state = done ? `done:${view.fine[view.n - 1].toFixed(2)}:${view.doubled}` : count ? 'partial' : 'empty';
  if (els.status.dataset.state === state) return;
  const wasDone = (els.status.dataset.state || '').startsWith('done');
  els.status.dataset.state = state;
  els.status.replaceChildren();
  if (done) {
    els.status.append(html('div', wasDone ? 'say still' : 'say', `You say ${formatValue(view.fine[view.n - 1], chart.unit)} by ${lastYear}.`));
    if (view.doubled && !used) els.status.append(html('div', 'note', 'Doubled. This chart counts twice.'));
  } else if (count) {
    els.status.append(html('div', 'keep', `Keep going to ${lastYear}.`));
  }
}

function clearLine() {
  view.fine.fill(null);
  view.last = null;
  paintUser();
  refresh();
  startHint();
}

/* ---------- lock in and reveal ---------- */

function lockIn() {
  if (!view || view.locked || filled() < view.n) return;
  const { chart } = view;
  const guess = Array.from({ length: view.hidden }, (_, year) => view.fine[(year + 1) * SUB - 1]);
  const doubled = view.doubled && !doubleUsed();
  const base = pointsFor(chart, guess);
  view.answer = { guess, doubled, base, points: base * (doubled ? 2 : 1) };
  run.answers.push(view.answer);
  view.locked = true;
  stopHint();
  paintUser();
  drawReveal(true);
  showResult();
}

/** Draws the real line over the drawn line, shades the space between them and labels both ends. */
function drawReveal(animate) {
  const { chart, geo, parts, answer } = view;
  const { values, cut, unit } = chart;
  const realPoints = values.slice(cut - 1).map((value, i) => [geo.xAt(cut - 1 + i), geo.yAt(value)]);
  const userLine = userPoints();

  parts.gap.setAttribute('d', line(userLine) + ' ' + line(realPoints.slice().reverse()).replace('M', 'L') + ' Z');
  parts.gap.classList.toggle('fade', animate && !reduceMotion);

  parts.real.setAttribute('d', line(realPoints));
  parts.real.classList.remove('draw');
  parts.real.style.strokeDasharray = '';
  parts.real.style.strokeDashoffset = '';
  if (animate && !reduceMotion) {
    const length = parts.real.getTotalLength();
    parts.real.style.strokeDasharray = length;
    parts.real.style.strokeDashoffset = length;
    parts.real.getBoundingClientRect();
    parts.real.classList.add('draw');
    parts.real.style.strokeDashoffset = 0;
  }

  const realValue = values[values.length - 1];
  const userValue = answer.guess[answer.guess.length - 1];
  const realY = geo.yAt(realValue);
  const userY = geo.yAt(userValue);
  const userBelow = userY >= realY;
  const keep = (y) => clamp(y, geo.top + 8, geo.bottom - 6);
  let realLabel = keep(userBelow ? realY - 10 : realY + 20);
  let userLabel = keep(userBelow ? userY + 20 : userY - 10);
  if (Math.abs(realLabel - userLabel) < 15) {
    if (userBelow) userLabel = realLabel + 15; else realLabel = userLabel + 15;
  }
  parts.labels.replaceChildren();
  const late = animate && !reduceMotion ? ' late' : '';
  svg('text', { class: 'end-label is-real' + late, x: geo.x1 - 8, y: realLabel, 'text-anchor': 'end' }, parts.labels)
    .textContent = `REAL ${formatValue(realValue, unit)}`;
  svg('text', { class: 'end-label is-you' + late, x: geo.x1 - 8, y: userLabel, 'text-anchor': 'end' }, parts.labels)
    .textContent = `YOU ${formatValue(userValue, unit)}`;
}

function showResult() {
  const { chart, answer } = view;
  const lastYear = chart.years[chart.years.length - 1];
  const realValue = chart.values[chart.values.length - 1];
  const userValue = answer.guess[answer.guess.length - 1];

  els.actions.hidden = true;
  els.status.hidden = true;
  els.result.hidden = false;
  countUp(els.score, answer.points, '+');
  els.scoreOf.textContent = answer.doubled ? `OF ${MAX_POINTS * 2} · DOUBLED` : `OF ${MAX_POINTS}`;

  const source = html('a', '', `Source: ${chart.sourceName.split(',')[0]}`);
  source.href = chart.source;
  source.target = '_blank';
  source.rel = 'noopener';
  els.takeaway.replaceChildren(
    `In ${lastYear} it was `, html('strong', '', formatValue(realValue, chart.unit)),
    '. You drew ', html('strong', '', formatValue(userValue, chart.unit)), '.', source
  );
  els.nextBtn.textContent = run.answers.length >= PER_DAY ? 'See the result' : 'Next chart';
}

function next() {
  if (run.answers.length >= PER_DAY) { showResults(); return; }
  run.index = run.answers.length;
  startChart();
}

/* ---------- results ---------- */

/** A small chart for a row of the results: the known line, the drawn line and the real line. */
function miniChart(chart, answer) {
  const { years, values, cut, axis } = chart;
  const x = (index) => 2 + (72 * index) / (years.length - 1);
  const y = (value) => 45 - ((value - axis[0]) / (axis[1] - axis[0])) * 42;
  const root = svg('svg', { class: 'mini', viewBox: '0 0 76 48', 'aria-hidden': 'true' });
  const start = [x(cut - 1), y(values[cut - 1])];
  svg('path', { class: 'k', d: line(values.slice(0, cut).map((value, i) => [x(i), y(value)])) }, root);
  svg('path', { class: 'u', d: line([start, ...answer.guess.map((value, i) => [x(cut + i), y(value)])]) }, root);
  svg('path', { class: 'r', d: line(values.slice(cut - 1).map((value, i) => [x(cut - 1 + i), y(value)])) }, root);
  svg('circle', { cx: start[0], cy: start[1], r: 2.4 }, root);
  return root;
}

function showResults() {
  stopHint();
  view = null;
  const points = total(run);
  els.play.hidden = true;
  els.results.hidden = false;
  window.scrollTo(0, 0);
  setProgress(PER_DAY, `${PER_DAY}/${PER_DAY}`);
  els.resDay.textContent = `DAY ${DAY}`;
  countUp(els.total, points);
  els.verdict.textContent = `${rankFor(points)}.`;

  els.rows.replaceChildren(...run.answers.map((answer, i) => {
    const chart = CHARTS[i];
    const lastYear = chart.years[chart.years.length - 1];
    const row = html('li');
    const text = html('div', 'row-text');
    text.append(
      html('div', 'row-title', chart.title),
      html('div', 'row-sub', `${formatValue(chart.values[chart.values.length - 1], chart.unit)} in ${lastYear} · you ${formatValue(answer.guess[answer.guess.length - 1], chart.unit)}`)
    );
    const score = html('div', 'row-score');
    score.append(html('b', '', String(answer.points)));
    if (answer.doubled) score.append(html('span', '', '2× SCORE'));
    row.append(miniChart(chart, answer), text, score);
    return row;
  }));
}

async function share() {
  const text = shareText(DAY, run, window.location.href.split('#')[0]);
  const flash = (label) => {
    els.shareBtn.textContent = label;
    setTimeout(() => { els.shareBtn.textContent = 'Share result'; }, 1600);
  };
  if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
    try { await navigator.share({ text }); return; } catch (error) { if (error.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text); flash('Copied'); } catch (error) { flash('Could not copy'); }
}

function playAgain() {
  run = { index: 0, answers: [] };
  els.results.hidden = true;
  els.play.hidden = false;
  els.status.dataset.state = '';
  startChart();
}

/* ---------- theme ---------- */

function setTheme(name, save) {
  document.documentElement.dataset.theme = name;
  els.themeColor.setAttribute('content', name === 'night' ? '#0C0D10' : '#F5F5F2');
  document.querySelectorAll('[data-theme-pick]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.themePick === name));
  });
  if (save) { try { localStorage.setItem('ftl-demo-theme', name); } catch (error) { /* no storage */ } }
}

/* ---------- wiring ---------- */

els.chart.addEventListener('pointerdown', onDown);
els.chart.addEventListener('pointermove', onMove);
els.chart.addEventListener('pointerup', onUp);
els.chart.addEventListener('pointercancel', onUp);
els.clearBtn.addEventListener('click', clearLine);
els.doubleBtn.addEventListener('click', () => {
  if (doubleUsed()) return;
  view.doubled = !view.doubled;
  refresh();
});
els.lockBtn.addEventListener('click', lockIn);
els.nextBtn.addEventListener('click', next);
els.shareBtn.addEventListener('click', share);
els.againBtn.addEventListener('click', playAgain);
els.helpBtn.addEventListener('click', () => els.help.showModal());
els.help.addEventListener('click', (event) => { if (event.target === els.help) els.help.close(); });
document.querySelectorAll('[data-theme-pick]').forEach((button) => {
  button.addEventListener('click', () => setTheme(button.dataset.themePick, true));
});

new ResizeObserver(() => layout()).observe(els.wrap);

setTheme(document.documentElement.dataset.theme || 'paper', false);
startChart();
