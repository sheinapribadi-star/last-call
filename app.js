// Last Call. All the math lives here; see scripts/derive.py for where LINE and the 4.3 h come from.
const LINE = 26.9;          // mg on board at lights out that both Gardiner et al. (2023) cut-offs agree on
const TMAX = 0.79;          // h to peak, Abernethy & Todd (1985) controls
const NIGHT = 8;            // h of sleep we protect after lights out
const DAY_START = 5 * 60;   // the day starts at 5:00 AM
const STORE = 'last-call:v1';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

let DRINKS = [];
const byId = (id) => DRINKS.find((d) => d.id === id);

// ---------- pharmacokinetics ----------
// one-compartment, first-order absorption and elimination (Bateman function)
const kaCache = new Map();
function kaFor(ke) {
  const key = ke.toFixed(5);
  if (kaCache.has(key)) return kaCache.get(key);
  let lo = ke * 1.0001, hi = 50;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (Math.log(mid / ke) / (mid - ke) - TMAX > 0) lo = mid; else hi = mid;
  }
  const ka = (lo + hi) / 2;
  kaCache.set(key, ka);
  return ka;
}
function frac(hours, half) {
  if (hours <= 0) return 0;
  const ke = Math.LN2 / half, ka = kaFor(ke);
  return (ka / (ka - ke)) * (Math.exp(-ke * hours) - Math.exp(-ka * hours));
}
// minutes since the day started (5 AM) so that 1 AM lands after 11 PM
const dayMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  let t = h * 60 + m;
  if (t < DAY_START) t += 1440;
  return t;
};
const loadAt = (drinks, t, half) => drinks.reduce((s, d) => s + d.mg * frac((t - d.t) / 60, half), 0);
// the most caffeine on board at any point between lights out and waking
function nightPeak(drinks, bed, half) {
  let peak = 0;
  for (let t = bed; t <= bed + NIGHT * 60; t += 5) peak = Math.max(peak, loadAt(drinks, t, half));
  return peak;
}
// the latest time `mg` can be drunk on top of `others` and stay under the line all night
function lastCall(mg, others, bed, half) {
  const ok = (t) => nightPeak([...others, { mg, t }], bed, half) <= LINE;
  if (!ok(DAY_START)) return { kind: 'never' };
  if (ok(bed)) return { kind: 'any' };
  let lo = DAY_START, hi = bed;
  while (hi - lo > 1) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
  return { kind: 'at', t: Math.floor(lo) };
}

// ---------- formatting ----------
function clock(dm) {
  let m = Math.round(dm) % 1440;
  const h24 = Math.floor(m / 60), mm = m % 60;
  const h = ((h24 + 11) % 12) + 1;
  return `${h}:${String(mm).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
const hhmm = (dm) => { const m = Math.round(dm) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const mgText = (x) => (x >= 10 ? String(Math.round(x)) : String(Math.round(x * 10) / 10));
const mgExact = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
const hoursText = (h) => `${h.toFixed(1)} h`;

// ---------- state ----------
const DEFAULT = {
  bed: '23:00',
  half: 4.3,
  next: 'drip12',
  ticket: [
    { id: 'drip12', time: '09:00' },
    { id: 'black8', time: '15:00' },
  ],
};
let state = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(STORE)); if (s && s.bed && Array.isArray(s.ticket)) return s; } catch (e) { /* first visit */ }
  return structuredClone(DEFAULT);
}
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } };

const ticketDrinks = () => state.ticket.map((r) => ({ mg: r.id === 'custom' ? Number(r.mg) || 0 : byId(r.id).mg, t: dayMin(r.time), row: r }));
const label = (d) => `${d.name}, ${d.size}`;

// ---------- render: setup ----------
function renderSetup() {
  $('#bed').value = state.bed;
  const bed = dayMin(state.bed);
  $('#wake-hint').textContent = `Up around ${clock(bed + NIGHT * 60)}, after ${NIGHT} hours`;
  $('#half').value = state.half;
  $('#half-out').textContent = hoursText(state.half);
  $$('input[name="speed"]').forEach((r) => { r.checked = Math.abs(Number(r.value) - state.half) < 0.05; });
}

// ---------- render: board ----------
function renderBoard() {
  const bed = dayMin(state.bed);
  $('#board-sub').textContent = `for lights out at ${clock(bed)}, on an otherwise caffeine-free day`;
  const now = new Date();
  const nowM = dayMin(`${now.getHours()}:${now.getMinutes()}`);
  const list = $('#board-list');
  list.replaceChildren(...DRINKS.map((d) => {
    const lc = lastCall(d.mg, [], bed, state.half);
    const li = document.createElement('li');
    li.className = 'item';
    let when = 'any time', cls = 'is-any';
    if (lc.kind === 'never') { when = 'not tonight'; cls = 'is-never'; }
    if (lc.kind === 'at') { when = clock(lc.t); cls = nowM > lc.t && nowM < bed ? 'is-closed' : ''; }
    if (cls) li.classList.add(cls);
    li.innerHTML = `<span class="item__name"></span><span class="item__size"></span><span class="item__mg"></span><span class="item__meta" aria-hidden="true"></span><span class="item__dots" aria-hidden="true"></span><span class="item__when"></span>`;
    $('.item__meta', li).textContent = `${d.size} \u00b7 ${mgExact(d.mg)} mg`;
    $('.item__name', li).textContent = d.name;
    $('.item__size', li).textContent = d.size;
    $('.item__mg', li).textContent = `${mgExact(d.mg)} mg`;
    $('.item__when', li).textContent = when;
    if (cls === 'is-closed') li.title = 'Already past for today';
    return li;
  }));
}

// ---------- render: ticket ----------
function drinkOptions(select, selected, withCustom) {
  select.replaceChildren(...DRINKS.map((d) => new Option(`${label(d)} (${mgExact(d.mg)} mg)`, d.id, false, d.id === selected)));
  if (withCustom) select.append(new Option('Something else (enter mg)', 'custom', false, selected === 'custom'));
}
function renderTicket() {
  const tpl = $('#row-tpl');
  const ol = $('#ledger');
  ol.replaceChildren(...state.ticket.map((r, i) => {
    const li = tpl.content.firstElementChild.cloneNode(true);
    $('.ledger__no', li).textContent = String(i + 1).padStart(2, '0');
    const time = $('.ledger__time', li); time.value = r.time;
    const sel = $('.ledger__drink', li); drinkOptions(sel, r.id, true);
    const mg = $('.ledger__mg input', li);
    const custom = r.id === 'custom';
    mg.value = custom ? (r.mg ?? 100) : byId(r.id).mg;
    mg.readOnly = !custom;
    li.classList.toggle('is-custom', custom);
    time.addEventListener('change', () => { if (time.value) { r.time = time.value; update(); } });
    sel.addEventListener('change', () => { r.id = sel.value; if (r.id === 'custom' && r.mg == null) r.mg = 100; renderTicket(); update(); });
    mg.addEventListener('input', () => { if (custom) { r.mg = Math.max(0, Math.min(1000, Number(mg.value) || 0)); update(false); } });
    $('.ledger__x', li).addEventListener('click', () => { state.ticket.splice(i, 1); renderTicket(); update(); });
    return li;
  }));
  if (!state.ticket.length) {
    const li = document.createElement('li');
    li.className = 'ledger__empty';
    li.textContent = 'Nothing yet today. Add what you drink as you go.';
    ol.append(li);
  }
  const d = new Date();
  $('#tk-date').textContent = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

// ---------- render: readout ----------
function renderReadout() {
  const bed = dayMin(state.bed);
  const drinks = ticketDrinks();
  const atBed = loadAt(drinks, bed, state.half);
  const peak = nightPeak(drinks, bed, state.half);
  const total = drinks.reduce((s, d) => s + d.mg, 0);
  $('#sum-total').textContent = `${mgText(total)} mg`;
  $('#ro-mg').textContent = mgText(atBed);
  const v = $('#ro-verdict');
  const over = peak > LINE;
  v.classList.toggle('is-over', over);
  if (!drinks.length) v.textContent = 'Nothing on the ticket yet, so nothing on board.';
  else if (over) v.textContent = peak > atBed + 0.5
    ? `It keeps climbing after lights out to ${mgText(peak)} mg, ${mgText(peak - LINE)} mg over the 27 mg line.`
    : `That is ${mgText(peak - LINE)} mg over the 27 mg line.`;
  else v.textContent = `Under the 27 mg line with ${mgText(LINE - peak)} mg to spare.`;

  // last call for one more of the chosen drink
  const next = byId(state.next) || DRINKS[0];
  const lc = lastCall(next.mg, drinks, bed, state.half);
  const stamp = $('#stamp');
  stamp.classList.remove('is-never', 'is-any');
  const st = $('#stamp-time');
  const now = new Date();
  const nowM = dayMin(`${now.getHours()}:${now.getMinutes()}`);
  const floor = Math.max(nowM < bed ? nowM : 0, ...drinks.map((d) => d.t));
  if (lc.kind === 'at' && lc.t < floor) { lc.kind = 'never'; }
  if (lc.kind === 'at') st.textContent = clock(lc.t);
  if (lc.kind === 'any') { st.textContent = 'any time'; stamp.classList.add('is-any'); }
  if (lc.kind === 'never') { st.textContent = 'closed'; stamp.classList.add('is-never'); }

  // the fix: move the latest drink earlier, or swap it
  const fix = $('#ro-fix');
  fix.textContent = '';
  if (!over && lc.kind === 'never') {
    const fits = DRINKS.map((d) => ({ d, c: lastCall(d.mg, drinks, bed, state.half) }))
      .filter(({ c }) => c.kind === 'any' || (c.kind === 'at' && c.t >= floor))
      .sort((a, b) => b.d.mg - a.d.mg)[0];
    if (fits) fix.textContent = `Still room for something smaller: ${/^[aeiou]/i.test(fits.d.name) ? 'an' : 'a'} ${fits.d.name.toLowerCase()} (${fits.d.size}) ${fits.c.kind === 'any' ? 'any time tonight' : `until ${clock(fits.c.t)}`}.`;
  }
  if (over && drinks.length) {
    const sorted = [...drinks].sort((a, b) => b.t - a.t);
    const last = sorted[0];
    const others = sorted.slice(1);
    const name = last.row.id === 'custom' ? `${mgText(last.mg)} mg drink` : byId(last.row.id).name.toLowerCase();
    const move = lastCall(last.mg, others, bed, state.half);
    const swap = DRINKS.filter((d) => d.mg < last.mg && nightPeak([...others, { mg: d.mg, t: last.t }], bed, state.half) <= LINE)
      .sort((a, b) => b.mg - a.mg)[0];
    const parts = [];
    if (move.kind === 'at' && move.t < last.t) parts.push(`move your ${clock(last.t)} ${name} to ${clock(move.t)} or earlier`);
    if (swap) parts.push(`swap it for ${/^[aeiou]/i.test(swap.name) ? 'an' : 'a'} ${swap.name.toLowerCase()} (${swap.size}, ${mgExact(swap.mg)} mg)`);
    if (parts.length) fix.textContent = `To get under: ${parts.join(', or ')}.`;
    else fix.textContent = `Moving or swapping your last drink is not enough tonight; the earlier ones already put you over.`;
  }
}

// ---------- render: chart ----------
const SVGNS = 'http://www.w3.org/2000/svg';
function el(name, attrs = {}, text) {
  const n = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}
function renderChart() {
  const svg = $('#chart');
  const W = Math.max(320, Math.round(svg.parentElement.clientWidth - 2 * parseFloat(getComputedStyle(svg.parentElement).paddingLeft || 0)) || 760);
  const narrow = W < 560;
  const H = narrow ? 250 : 280, L = narrow ? 34 : 46, R = narrow ? 8 : 16, T = 22, B = 40;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const bed = dayMin(state.bed);
  const t0 = DAY_START, t1 = bed + NIGHT * 60;
  const drinks = ticketDrinks();
  const pts = [];
  let ymax = LINE * 2;
  for (let t = t0; t <= t1; t += 5) { const y = loadAt(drinks, t, state.half); pts.push([t, y]); ymax = Math.max(ymax, y); }
  ymax = Math.ceil((ymax * 1.12) / 25) * 25;
  const x = (t) => L + ((t - t0) / (t1 - t0)) * (W - L - R);
  const y = (v) => T + (1 - v / ymax) * (H - T - B);
  svg.replaceChildren();

  // night band
  svg.append(el('rect', { x: x(bed), y: T, width: x(t1) - x(bed), height: H - T - B, class: 'c-night' }));
  svg.append(el('text', { x: x(bed) + 8, y: T + 16, class: 'c-night-t' }, 'asleep'));

  // y grid
  const step = ymax > 200 ? 100 : ymax > 100 ? 50 : 25;
  for (let v = 0; v <= ymax; v += step) {
    svg.append(el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'c-grid' }));
    svg.append(el('text', { x: L - 8, y: y(v) + 4, class: 'c-ytick' }, String(v)));
  }
  svg.append(el('text', { x: 4, y: T - 8, class: 'c-unit' }, 'mg on board'));

  // x ticks every 3 hours from 6 AM
  for (let t = 6 * 60; t <= t1; t += narrow ? 360 : 180) {
    if (t < t0) continue;
    svg.append(el('line', { x1: x(t), x2: x(t), y1: H - B, y2: H - B + 5, class: 'c-axis' }));
    svg.append(el('text', { x: x(t), y: H - B + 19, class: 'c-xtick' }, clock(t).replace(':00', '')));
  }
  svg.append(el('line', { x1: L, x2: W - R, y1: H - B, y2: H - B, class: 'c-axis' }));

  // area + curve
  const d = pts.map(([t, v], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join('');
  svg.append(el('path', { d: `${d}L${x(t1)},${y(0)}L${x(t0)},${y(0)}Z`, class: 'c-area' }));
  svg.append(el('path', { d, class: 'c-curve' }));

  // the line
  svg.append(el('line', { x1: L, x2: W - R, y1: y(LINE), y2: y(LINE), class: 'c-line' }));
  svg.append(el('text', { x: L + 6, y: y(LINE) - 6, class: 'c-line-t' }, 'the line, 27 mg'));

  // lights out
  svg.append(el('line', { x1: x(bed), x2: x(bed), y1: T, y2: H - B, class: 'c-bed' }));
  const atBed = loadAt(drinks, bed, state.half);
  svg.append(el('circle', { cx: x(bed), cy: y(atBed), r: 4.5, class: atBed > LINE ? 'c-dot is-over' : 'c-dot' }));
  svg.append(el('text', { x: x(bed) - 8, y: H - B + 33, class: 'c-bed-t' }, `lights out ${clock(bed)}`));

  // drink markers
  drinks.forEach((dr, i) => {
    const cx = x(dr.t);
    svg.append(el('line', { x1: cx, x2: cx, y1: H - B, y2: H - B - 8, class: 'c-drink' }));
    svg.append(el('text', { x: cx + 4, y: H - B - 12, class: 'c-drink-t' }, String(state.ticket.indexOf(dr.row) + 1).padStart(2, '0')));
  });
}

// ---------- render: self-check ----------
function renderCheck() {
  const H = 4.3, bed = 22 * 60;
  const rows = [
    { name: 'Coffee, 107 mg', paper: '8.8 h before bed', mg: 107 },
    { name: 'Pre-workout, 217.5 mg', paper: '13.2 h before bed', mg: 217.5 },
    { name: 'Black tea, 47 mg', paper: 'no cut-off found', mg: 47 },
  ];
  $('#check-body').replaceChildren(...rows.map((r) => {
    const lc = lastCall(r.mg, [], bed, H);
    const ours = lc.kind === 'at' ? `${((bed - lc.t) / 60).toFixed(1)} h before bed` : lc.kind === 'any' ? 'any time' : 'not that day';
    const tr = document.createElement('tr');
    tr.innerHTML = '<th scope="row"></th><td></td><td></td>';
    tr.children[0].textContent = r.name; tr.children[1].textContent = r.paper; tr.children[2].textContent = ours;
    return tr;
  }));
}

// ---------- wiring ----------
function update(redrawTicket = false) {
  if (redrawTicket) renderTicket();
  renderSetup(); renderBoard(); renderReadout(); renderChart();
  save();
}
function bind() {
  $('#bed').addEventListener('change', (e) => { if (e.target.value) { state.bed = e.target.value; update(); } });
  $$('.nudge').forEach((b) => b.addEventListener('click', () => {
    let m = dayMin(state.bed) + Number(b.dataset.nudge);
    m = Math.max(18 * 60, Math.min(27 * 60, m)); // 6 PM to 3 AM
    state.bed = hhmm(m); update();
  }));
  $$('input[name="speed"]').forEach((r) => r.addEventListener('change', () => { state.half = Number(r.value); update(); }));
  $('#half').addEventListener('input', (e) => { state.half = Number(e.target.value); update(); });
  const next = $('#next');
  drinkOptions(next, state.next, false);
  next.addEventListener('change', () => { state.next = next.value; update(); });
  $('#add').addEventListener('click', () => {
    const last = state.ticket.length ? dayMin(state.ticket[state.ticket.length - 1].time) : 8 * 60;
    const now = new Date();
    const nowM = dayMin(`${now.getHours()}:${now.getMinutes()}`);
    const t = Math.min(dayMin(state.bed) - 30, Math.max(last + 60, nowM < dayMin(state.bed) ? nowM : last + 60));
    state.ticket.push({ id: 'black8', time: hhmm(Math.round(t / 5) * 5) });
    update(true);
    $$('.ledger__drink').at(-1)?.focus();
  });
  $('#clear').addEventListener('click', () => { state.ticket = []; update(true); });
}

async function boot() {
  const res = await fetch('data/drinks.json');
  DRINKS = (await res.json()).drinks;
  state.ticket = state.ticket.filter((r) => r.id === 'custom' || byId(r.id));
  if (!byId(state.next)) state.next = DEFAULT.next;
  bind();
  renderCheck();
  update(true);
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(renderChart, 120); });
  document.documentElement.classList.add('is-ready');
}
boot();
