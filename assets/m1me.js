// M1me · the lab. mine two memes, pair them, take the child to pump.fun. nothing here holds keys or money.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isMint = s => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
const DS = 'https://api.dexscreener.com';
const toast = (t, ms = 2600) => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), ms); };
const ago = t => { if (!t) return ''; const m = Math.max(0, (Date.now() - t) / 60000); return m < 60 ? `${Math.round(m)}m old` : m < 1440 ? `${Math.round(m / 60)}h old` : `${Math.round(m / 1440)}d old`; };
const via = u => u && /^https:/.test(u) ? `/api/img?u=${encodeURIComponent(u)}` : u;

// ---------------------------------------------------------------- the screen on the PC: a little log that types itself
const tty = $('#tty');
const LOG = { lines: [], busy: false };
async function type(line, cls = '', speed = 26) {
  const row = document.createElement('div'); if (cls) row.className = cls; tty.appendChild(row);
  for (let i = 1; i <= line.length; i++) { row.textContent = line.slice(0, i); await sleep(RM ? 0 : speed); }
  while (tty.children.length > 8) tty.firstChild.remove();
}
async function screenLoop() {
  await type('M1ME lab · v1', 'm', 18);
  await type('> mine a meme');
  await type('> pair it with another');
  await type('> launch what comes out');
  await sleep(1400);
  for (;;) {
    const f = FRESH.list; if (f.length < 2) { await sleep(2000); continue; }
    const a = f[Math.floor(Math.random() * f.length)], b = f[Math.floor(Math.random() * f.length)]; if (a === b) continue;
    await type(`> mined  $${a.sym}`); await sleep(500);
    await type(`> mined  $${b.sym}`); await sleep(500);
    await type('> pairing…', 'm'); await sleep(700);
    await type(`> child  $${tick(a.sym, b.sym, 0)}`, 'g'); await sleep(2600);
  }
}

// ---------------------------------------------------------------- intro: the machine comes out of the dark, its screen wakes, the page arrives
async function intro() {
  const img = $('.rig .pc'), seen = (() => { try { return sessionStorage.getItem('m1me:in'); } catch { return null; } })();
  try { await img.decode(); } catch {}
  const go = () => { $('.rig').classList.add('pull'); document.body.classList.remove('booting'); $('.screen').classList.add('on'); try { sessionStorage.setItem('m1me:in', '1'); } catch {} };
  $('.skip').addEventListener('click', go);
  addEventListener('keydown', go, { once: true });
  if (seen || RM) { go(); } else { $('.screen').classList.add('on'); tty.innerHTML = ''; await type('booting the lab…', 'm', 22); await sleep(350); go(); }
  setTimeout(() => { tty.innerHTML = ''; screenLoop(); }, seen ? 200 : 1600);
}

// ---------------------------------------------------------------- fresh memes, live from dexscreener
const FRESH = { list: [], at: 0 };
async function loadFresh() {
  try {
    const prof = await (await fetch(`${DS}/token-profiles/latest/v1`)).json();
    const sol = (Array.isArray(prof) ? prof : []).filter(p => p.chainId === 'solana').slice(0, 30);
    const icon = Object.fromEntries(sol.map(p => [p.tokenAddress, p.icon]));
    const ids = sol.map(p => p.tokenAddress);
    if (!ids.length) throw new Error('none');
    const pairs = await (await fetch(`${DS}/tokens/v1/solana/${ids.join(',')}`)).json();
    const by = new Map();
    for (const p of Array.isArray(pairs) ? pairs : []) {
      const t = p.baseToken; if (!t || !ids.includes(t.address)) continue;
      const o = by.get(t.address); if (o && (o.liq || 0) > (p.liquidity && p.liquidity.usd || 0)) continue;
      by.set(t.address, { mint: t.address, name: t.name, sym: t.symbol, img: (p.info && p.info.imageUrl) || icon[t.address], born: p.pairCreatedAt, liq: p.liquidity && p.liquidity.usd || 0 });
    }
    const list = ids.map(i => by.get(i)).filter(x => x && x.img && x.sym);
    if (list.length) { FRESH.list = list.sort((a, b) => (b.born || 0) - (a.born || 0)); FRESH.at = Date.now(); drawFresh(); drawPairs(); }
    else if (!FRESH.list.length) $('#grid').innerHTML = '<p class="wait">nothing fresh to show right now. paste an address or upload an image instead.</p>';
  } catch {
    if (!FRESH.list.length) $('#grid').innerHTML = '<p class="wait">the feed did not answer. paste an address or upload an image instead.</p>';
  }
}
function drawFresh() {
  const L = FRESH.list.slice(0, 24);
  $('#grid').innerHTML = L.map((c, i) => `<div class="card" style="animation-delay:${i * 40}ms" data-i="${i}">
    <div class="im"><img loading="lazy" src="${esc(c.img)}" alt=""></div>
    <div class="cb"><div class="cn">${esc(c.name)}</div><div class="ct">$${esc(c.sym)}</div><div class="ca">${esc(ago(c.born))}</div>
    <div class="go"><button type="button" data-to="a">→ a</button><button type="button" data-to="b">→ b</button></div></div></div>`).join('');
  const t = L.map(c => `<span><b>$${esc(c.sym)}</b> ${esc(c.name)} · ${esc(ago(c.born))}</span>`).join('');
  $('#tape').innerHTML = t + t;
}
$('#grid').addEventListener('click', e => {
  const card = e.target.closest('.card'); if (!card) return;
  const c = FRESH.list[+card.dataset.i]; if (!c) return;
  const to = e.target.dataset.to || (!SLOT.a ? 'a' : !SLOT.b ? 'b' : 'a');
  fill(to, { name: c.name, sym: c.sym, src: `mined from ${c.mint.slice(0, 4)}…${c.mint.slice(-4)}`, url: via(c.img), mint: c.mint });
  $('#lab').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
});

function drawPairs() {
  const L = FRESH.list; if (L.length < 2) return; const out = [];
  for (let i = 0; i < Math.min(6, Math.floor(L.length / 2)); i++) out.push([L[i * 2], L[i * 2 + 1]]);
  PAIRS = out;
  $('#pairlist').innerHTML = out.map(([a, b], i) => `<div class="pr" data-p="${i}" style="animation-delay:${i * 60}ms"><img src="${esc(a.img)}" alt=""><span class="x">×</span><img src="${esc(b.img)}" alt=""><div class="kid"><b>${esc(child(a.name, b.name, 0))}</b><span>$${esc(tick(a.sym, b.sym, 0))}</span></div></div>`).join('');
}
let PAIRS = [];
$('#pairlist').addEventListener('click', e => { const el = e.target.closest('.pr'); if (!el) return; const [a, b] = PAIRS[+el.dataset.p] || []; if (!a) return;
  const m = c => ({ name: c.name, sym: c.sym, src: `mined from ${c.mint.slice(0, 4)}…${c.mint.slice(-4)}`, url: via(c.img), mint: c.mint });
  fill('a', m(a)); fill('b', m(b)); $('#lab').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); setTimeout(pair, 700); });

// ---------------------------------------------------------------- the two slots
const SLOT = { a: null, b: null };
function slotEl(k) { return $(`.slot[data-slot="${k}"]`); }
function msg(k, t, err) { const m = $('.msg', slotEl(k)); m.textContent = t || ''; m.classList.toggle('err', !!err); }
function fill(k, m) {
  SLOT[k] = m; const el = slotEl(k);
  $('.art img', el).src = m.url; $('.nm', el).value = m.name; $('.tk', el).textContent = m.sym ? `$${m.sym}` : ''; $('.src', el).textContent = m.src || '';
  el.classList.add('filled'); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); msg(k, '');
  readyPair();
}
function clear(k) { SLOT[k] = null; slotEl(k).classList.remove('filled'); readyPair(); }
function readyPair() { $('.pair').disabled = !(SLOT.a && SLOT.b); }
for (const k of ['a', 'b']) {
  const el = slotEl(k);
  $('.clr', el).addEventListener('click', () => clear(k));
  $('.nm', el).addEventListener('input', e => { if (SLOT[k]) SLOT[k].name = e.target.value.trim() || SLOT[k].name; });
  $('.mine', el).addEventListener('submit', async e => {
    e.preventDefault(); const v = $('input', e.target).value.trim();
    if (!isMint(v)) return msg(k, 'that is not a solana address.', true);
    msg(k, 'mining…');
    try {
      const ps = await (await fetch(`${DS}/tokens/v1/solana/${v}`)).json();
      const p = (Array.isArray(ps) ? ps : []).find(x => x.baseToken && x.baseToken.address === v);
      if (!p) return msg(k, 'not on the lists yet. try again in a minute, or upload its picture.', true);
      const img = p.info && p.info.imageUrl;
      if (!img) return msg(k, 'that coin has no picture yet. upload one instead.', true);
      fill(k, { name: p.baseToken.name, sym: p.baseToken.symbol, src: `mined from ${v.slice(0, 4)}…${v.slice(-4)}`, url: via(img), mint: v });
      $('input', e.target).value = '';
    } catch { msg(k, 'the lists did not answer. try again.', true); }
  });
  $('.up input', el).addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (!/^image\//.test(f.type)) return msg(k, 'that is not an image.', true);
    if (f.size > 8e6) return msg(k, 'keep it under 8 MB.', true);
    const r = new FileReader(); r.onload = () => { const name = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 24) || 'untitled'; fill(k, { name, sym: name.replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase() || 'MEME', src: 'your upload · stays in this browser', url: r.result }); };
    r.readAsDataURL(f); e.target.value = '';
  });
}
$$('.pick').forEach(a => a.addEventListener('click', () => toast('pick one from the fresh memes below')));

// ---------------------------------------------------------------- names: two parents make one child
function cut(s) { s = String(s || '').trim(); const v = /[aeiouy]/i; let m = Math.ceil(s.length / 2); for (let i = m; i < s.length - 1; i++) if (v.test(s[i])) { m = i; break; } return [s.slice(0, m), s.slice(m)]; }
function child(a, b, v) {
  const [a1, a2] = cut(a), [b1, b2] = cut(b);
  const opts = [a1 + b2, b1 + a2, (a.length + b.length <= 14 ? a + b : a1 + b), a1 + b1.slice(-2) + b2, b1 + a2.slice(0, 3) + b2.slice(-2)];
  let out = opts[v % opts.length].replace(/\s+/g, ' ').trim();
  if (!out || out.length < 3) out = a + b;
  return out.slice(0, 32);
}
function tick(a, b, v) {
  a = String(a || 'MEME').replace(/[^a-z0-9]/gi, '').toUpperCase(); b = String(b || 'MEME').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const opts = [a.slice(0, Math.ceil(a.length / 2)) + b.slice(Math.floor(b.length / 2)), b.slice(0, Math.ceil(b.length / 2)) + a.slice(Math.floor(a.length / 2)), a.slice(0, 2) + b.slice(-3), b.slice(0, 2) + a.slice(-3)];
  return (opts[v % opts.length] || a + b).slice(0, 10);
}

// ---------------------------------------------------------------- the splice
const C = $('#child'), X = C.getContext('2d'), N = 1024;
function load(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; }); }
function cover(g, im, x = 0, y = 0, w = N, h = N) { const s = Math.max(w / im.width, h / im.height), dw = im.width * s, dh = im.height * s; g.drawImage(im, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); }
function layer(im) { const c = document.createElement('canvas'); c.width = c.height = N; cover(c.getContext('2d'), im); return c; }
const MODES = {
  splice(g, A, B, v) {
    g.drawImage(A, 0, 0); g.save(); g.beginPath(); const teeth = 9, amp = 34 + (v % 3) * 10, mid = N / 2;
    g.moveTo(N, 0); g.lineTo(mid, 0);
    for (let i = 0; i <= teeth * 2; i++) g.lineTo(mid + (i % 2 ? amp : -amp), (i / (teeth * 2)) * N);
    g.lineTo(N, N); g.closePath(); g.clip(); g.drawImage(B, 0, 0); g.restore();
  },
  ghost(g, A, B) { g.drawImage(A, 0, 0); g.globalCompositeOperation = 'screen'; g.globalAlpha = .62; g.drawImage(B, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'multiply'; g.globalAlpha = .25; g.drawImage(A, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; },
  graft(g, A, B) {
    const a = A.getContext('2d').getImageData(0, 0, N, N), b = B.getContext('2d').getImageData(0, 0, N, N).data;
    // B's dark and light: averages below and above its middle brightness
    let lo = [0, 0, 0, 0], hi = [0, 0, 0, 0];
    for (let i = 0; i < b.length; i += 64) { const l = .3 * b[i] + .59 * b[i + 1] + .11 * b[i + 2], t = l < 128 ? lo : hi; t[0] += b[i]; t[1] += b[i + 1]; t[2] += b[i + 2]; t[3]++; }
    lo = lo[3] ? lo.map(x => x / lo[3]) : [10, 10, 10]; hi = hi[3] ? hi.map(x => x / hi[3]) : [245, 240, 230];
    const d = a.data; for (let i = 0; i < d.length; i += 4) { const l = (.3 * d[i] + .59 * d[i + 1] + .11 * d[i + 2]) / 255, k = l * l * (3 - 2 * l); d[i] = lo[0] + (hi[0] - lo[0]) * k; d[i + 1] = lo[1] + (hi[1] - lo[1]) * k; d[i + 2] = lo[2] + (hi[2] - lo[2]) * k; }
    g.putImageData(a, 0, 0);
  },
  mosaic(g, A, B, v) { const n = 8 + (v % 2) * 4, s = N / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const src = (x + y) % 2 ? B : A; g.drawImage(src, x * s, y * s, s, s, x * s, y * s, s, s); } g.strokeStyle = '#0a0a0b'; g.lineWidth = 3; for (let i = 1; i < n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, N); g.moveTo(0, i * s); g.lineTo(N, i * s); g.stroke(); } },
};
function finish(g) { g.fillStyle = 'rgba(0,0,0,.07)'; for (let y = 0; y < N; y += 4) g.fillRect(0, y, N, 2); const v = g.createRadialGradient(N / 2, N / 2, N * .35, N / 2, N / 2, N * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = v; g.fillRect(0, 0, N, N); }

const LAB = { mode: 'splice', v: 0, A: null, B: null };
$$('.modes button').forEach(b => b.addEventListener('click', () => { $$('.modes button').forEach(x => x.classList.toggle('on', x === b)); LAB.mode = b.dataset.mode; if (LAB.A) render(true); }));
async function pair() {
  const btn = $('.pair'); if (btn.disabled) return; btn.classList.add('busy');
  try {
    const [ia, ib] = await Promise.all([load(SLOT.a.url), load(SLOT.b.url)]);
    LAB.A = layer(ia); LAB.B = layer(ib); LAB.v = 0;
    $('#out').hidden = false; await render(true);
    $('#out').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
  } catch { toast('one of the pictures would not load. try another meme.'); }
  btn.classList.remove('busy');
}
async function render(anim) {
  const { A, B } = LAB; const fin = document.createElement('canvas'); fin.width = fin.height = N; const g = fin.getContext('2d');
  MODES[LAB.mode](g, A, B, LAB.v); finish(g);
  const a = SLOT.a, b = SLOT.b;
  $('#cname').value = child(a.name, b.name, LAB.v); $('#ctick').value = tick(a.sym || a.name, b.sym || b.name, LAB.v);
  $('#cdesc').textContent = `$${a.sym || a.name} × $${b.sym || b.name}. mined and paired in the m1me lab.`;
  const out = $('#out'); out.classList.remove('scan'); void out.offsetWidth; out.classList.add('scan');
  if (!anim || RM) { X.drawImage(fin, 0, 0); return; }
  const t0 = performance.now(), D = 1100;
  await new Promise(done => { const step = now => {
    const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - Math.min(1, k * 1.6), 3);
    X.fillStyle = '#0f0f10'; X.fillRect(0, 0, N, N);
    X.globalAlpha = 1 - Math.max(0, k - .55) / .45; X.drawImage(A, -N * (1 - e) * .6, 0); X.globalAlpha *= .6; X.drawImage(B, N * (1 - e) * .6, 0);
    X.globalAlpha = Math.max(0, (k - .45) / .55); X.drawImage(fin, 0, 0); X.globalAlpha = 1;
    k < 1 ? requestAnimationFrame(step) : done(); }; requestAnimationFrame(step); setTimeout(done, D + 400); });
  X.drawImage(fin, 0, 0);
}
$('.pair').addEventListener('click', pair);
$('#reroll').addEventListener('click', () => { const ms = Object.keys(MODES); LAB.v++; LAB.mode = ms[(ms.indexOf(LAB.mode) + 1) % ms.length]; $$('.modes button').forEach(x => x.classList.toggle('on', x.dataset.mode === LAB.mode)); render(true); });
function blob() { return new Promise(r => C.toBlob(r, 'image/png')); }
async function save() { const b = await blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${($('#ctick').value || 'm1me').toLowerCase()}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
$('#save').addEventListener('click', async () => { await save(); toast('image saved'); });
$('#launch').addEventListener('click', async () => {
  const w = window.open('https://pump.fun/create', '_blank', 'noopener');
  const text = `${$('#cname').value}\n$${$('#ctick').value.toUpperCase()}\n${$('#cdesc').textContent}`;
  try { await navigator.clipboard.writeText(text); } catch {}
  await save();
  toast(w ? 'image saved · name, ticker and line copied · paste them on pump.fun' : 'image saved · details copied · open pump.fun/create', 4200);
});

// ---------------------------------------------------------------- reveal on scroll
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { threshold: .12 });
$$('.band .eyebrow, .band h2, .bench, .steps .step, .faq details, .grid').forEach((el, i) => { el.classList.add('rv'); el.style.transitionDelay = `${(i % 3) * 80}ms`; io.observe(el); });

intro();
loadFresh(); setInterval(() => { if (!document.hidden) loadFresh(); }, 60000);
