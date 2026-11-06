// RM Marmoraria — prévia conceitual (Bruno Luque).
// Motion 11.11.17 (vanilla, global `Motion`) para coreografia e cenas ligadas à rolagem; Lenis só na roda do mouse.
// O conteúdo funciona sem este arquivo: os estados escondidos só existem depois de `motion-ready`.
//
// Camadas de motion
//  Assinatura : hero (foto entra em corte reto, cotas se desenham, anel laranja fecha ao lado do "26")
//               + cena presa "Do esquadro à entrega" (régua avança, foto troca em corte de serra, prancha ganha camadas).
//  Narrativa  : régua do hero que continua na cena; cantoneiras de esquadro nas entregas; materiais em máscara com
//               linha de corte; anel do fechamento.
//  Interface  : pressão de botões/chips, filtro com reposicionamento (FLIP) interrompível, CTA fixo no celular, foco.

const root = document.documentElement;
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
const pinMQ = matchMedia('(min-width: 960px)');
const reduce = reduceMQ.matches;
if (reduce) root.classList.add('reduce');

/* tokens (espelham style.css) */
const EASE_OUT = [0.23, 1, 0.32, 1];
const EASE_CUT = [0.65, 0, 0.35, 1];
const SPRING_UI = { type: 'spring', bounce: 0.12, duration: 0.45 };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const M = window.Motion || null;
const prog = (p) => (typeof p === 'number' ? p : p?.y?.progress ?? 0);

/* ------------------------------------------------------------------ */
/* Etiquetas das cotas: a caixa acompanha a largura real do texto       */
/* ------------------------------------------------------------------ */
function fitTags() {
  $$('.cota__tag').forEach((g) => {
    const t = $('text', g), r = $('rect', g);
    if (!t || !r) return;
    let bw = 0;
    try { bw = t.getBBox().width; } catch (e) { return; }
    if (!bw) return;
    const w = Math.ceil(bw + 12);
    r.setAttribute('width', w);
    if (g.classList.contains('cota__tag--left')) { r.setAttribute('x', 0); t.setAttribute('x', w / 2); }
    else { r.setAttribute('x', -w / 2); t.setAttribute('x', 0); }
  });
}
fitTags();
document.fonts?.ready.then(fitTags);
let fitT = 0;
addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(fitTags, 150); });

/* ------------------------------------------------------------------ */
/* Topo sólido depois do início                                        */
/* ------------------------------------------------------------------ */
const top = $('[data-top]');
const onScrollTop = () => top.classList.toggle('is-solid', scrollY > 24);
addEventListener('scroll', onScrollTop, { passive: true }); onScrollTop();

/* ------------------------------------------------------------------ */
/* Rolagem contínua (Lenis): só roda do mouse no desktop; toque nativo  */
/* ------------------------------------------------------------------ */
let lenis = null, lenisRaf = 0;
function startLenis() {
  if (reduce || !window.Lenis || lenis || !fineMQ.matches) return;
  lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
  const raf = (t) => { if (!lenis) return; lenis.raf(t); lenisRaf = requestAnimationFrame(raf); };
  lenisRaf = requestAnimationFrame(raf);
}
startLenis();
reduceMQ.addEventListener('change', () => { if (reduceMQ.matches && lenis) { cancelAnimationFrame(lenisRaf); lenis.destroy(); lenis = null; } });

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = id === '#inicio' ? document.body : $(id);
  if (!target) return;
  e.preventDefault();
  const offset = id === '#inicio' ? 0 : -(top.offsetHeight);
  if (lenis) lenis.scrollTo(id === '#inicio' ? 0 : target, { offset, duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else scrollTo({ top: id === '#inicio' ? 0 : target.getBoundingClientRect().top + scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  if (id !== '#inicio') { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
});

/* ------------------------------------------------------------------ */
/* CTA fixo no celular: aparece depois do hero, some no fechamento      */
/* ------------------------------------------------------------------ */
const dock = $('[data-dock]');
if (dock && 'IntersectionObserver' in window) {
  const seen = { hero: true, close: false, foot: false };
  const upd = () => dock.classList.toggle('is-on', !seen.hero && !seen.close && !seen.foot);
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => { seen[en.target.dataset.dockKey] = en.isIntersecting; });
    upd();
  }, { threshold: 0 });
  [[$('[data-hero] .hero__actions'), 'hero'], [$('.close__actions'), 'close'], [$('.foot'), 'foot']].forEach(([el, k]) => { if (el) { el.dataset.dockKey = k; io.observe(el); } });
}

/* ------------------------------------------------------------------ */
/* Mira de alinhamento sobre a foto do hero (ponteiro fino; opcional)   */
/* ------------------------------------------------------------------ */
const heroShot = $('[data-hero-shot]');
const cross = $('[data-cross]');
const crossRead = $('[data-cross-read]');
if (heroShot && cross && fineMQ.matches && !reduce) {
  let raf = 0, px = 0, py = 0, w = 1, h = 1;
  const paint = () => {
    raf = 0;
    cross.style.setProperty('--cx', px.toFixed(1) + 'px');
    cross.style.setProperty('--cy', py.toFixed(1) + 'px');
    crossRead.textContent = `x ${String(Math.round((px / w) * 100)).padStart(2, '0')} · y ${String(Math.round((py / h) * 100)).padStart(2, '0')}`;
  };
  heroShot.addEventListener('pointerenter', () => { const r = heroShot.getBoundingClientRect(); w = r.width; h = r.height; cross.classList.add('is-on'); });
  heroShot.addEventListener('pointerleave', () => cross.classList.remove('is-on'));
  heroShot.addEventListener('pointermove', (e) => {
    const r = heroShot.getBoundingClientRect(); w = r.width; h = r.height;
    px = clamp(e.clientX - r.left, 0, w); py = clamp(e.clientY - r.top, 0, h);
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
}

/* ------------------------------------------------------------------ */
/* Entregas: filtro por ambiente (funciona sem Motion)                  */
/* ------------------------------------------------------------------ */
const chips = $$('[data-filter]');
const works = $$('[data-grid] .work');
const status = $('[data-filter-status]');
let currentFilter = 'todas';
function applyFilter(cat) {
  currentFilter = cat;
  chips.forEach((c) => { const on = c.dataset.filter === cat; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
  const animate = M && !reduce ? M.animate : null;
  const first = new Map(works.filter((w) => !w.hidden).map((w) => [w, w.getBoundingClientRect()]));
  works.forEach((w) => { w.hidden = !(cat === 'todas' || w.dataset.cat === cat); });
  const shown = works.filter((w) => !w.hidden);
  if (status) {
    const label = chips.find((c) => c.dataset.filter === cat)?.childNodes[0].textContent.trim();
    status.textContent = `Mostrando ${shown.length} entregas${cat === 'todas' ? '' : ': ' + label}.`;
  }
  if (!animate) return;
  shown.forEach((w, i) => {
    const f = first.get(w), l = w.getBoundingClientRect();
    w.classList.add('is-in');
    if (f) {
      const dx = f.left - l.left, dy = f.top - l.top;
      if (Math.abs(dx) + Math.abs(dy) > 1) animate(w, { transform: [`translate(${dx}px, ${dy}px)`, 'translate(0px, 0px)'] }, SPRING_UI);
    } else {
      animate(w, { opacity: [0, 1], transform: ['scale(.94)', 'scale(1)'] }, { duration: 0.32, delay: i * 0.03, ease: EASE_OUT });
    }
  });
}
chips.forEach((c) => c.addEventListener('click', () => {
  const cat = c.dataset.filter;
  applyFilter(cat === currentFilter && cat !== 'todas' ? 'todas' : cat); // chip ativo funciona como etiqueta removível
}));

/* ------------------------------------------------------------------ */
/* Motion: coreografia                                                  */
/* ------------------------------------------------------------------ */
if (!M) console.warn('Motion indisponível; página segue estática.');

const scene = $('[data-scene]');
const pin = $('[data-pin]');
const steps = $$('[data-step]');
const shots = $$('[data-shot]');
const blade = $('[data-blade] line');
const bladeSvg = $('[data-blade]');
const ruler = $('.ruler');
const rulerMarks = $$('.ruler__marks li');
const layers = $$('[data-layer]');
const planN = $('[data-plan-n]');

function setStepState(k) {
  steps.forEach((s, i) => s.classList.toggle('is-active', i === k));
  shots.forEach((s, i) => s.classList.toggle('is-on', i === k));
  layers.forEach((l, i) => l.classList.toggle('is-on', i <= k));
  rulerMarks.forEach((m, i) => m.classList.toggle('is-on', i <= k));
  if (planN) planN.textContent = String(k + 1).padStart(2, '0');
}

if (M && !reduce) {
  const { animate, scroll, inView, stagger } = M;
  root.classList.add('motion-ready');

  /* ---------------- HERO: entrada (CTA não espera a cena) ---------------- */
  const count = $('[data-count]');
  const ring = $('[data-ring]');
  animate('.hero .kicker', { opacity: [0, 1] }, { duration: 0.4 });
  animate('.hero__title .line > span', { transform: ['translateY(105%)', 'translateY(0%)'] }, { duration: 0.9, delay: stagger(0.07, { startDelay: 0.05 }), ease: EASE_OUT });
  animate('.hero__lead, .hero__actions, .hero__note', { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] }, { duration: 0.6, delay: stagger(0.07, { startDelay: 0.3 }), ease: EASE_OUT });
  // a foto entra num corte reto, da esquerda para a direita
  animate('.shot--hero', { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }, { duration: 1.05, delay: 0.2, ease: EASE_CUT });
  animate('.shot--hero img', { transform: ['scale(1.12)', 'scale(1)'] }, { duration: 1.6, delay: 0.2, ease: EASE_OUT });
  // cotas: um grupo de cada vez
  $$('[data-cota]', heroShot).forEach((g, i) => {
    $$('path, .cota__tag', g).forEach((n) => { n.style.transitionDelay = `${(0.15 + i * 0.32).toFixed(2)}s`; });
  });
  setTimeout(() => heroShot.classList.add('is-on'), 1050);
  // anel do logo se desenha e assenta ao lado do 26; o número conta uma vez
  if (ring) ring.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1500, delay: 600, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' });
  if (count) {
    count.textContent = '00';
    animate(0, 26, { duration: 1.5, delay: 0.6, ease: EASE_CUT, onUpdate: (v) => { count.textContent = String(Math.round(v)).padStart(2, '0'); } })
      .then(() => { count.textContent = '26'; });
  }

  /* ---------------- HERO: saída ligada à rolagem (régua avança) ---------------- */
  const heroRule = $('[data-hero-rule]');
  const heroCotas = $('.cotas', heroShot);
  scroll((p) => {
    const t = prog(p);
    heroRule.style.setProperty('--p', (0.06 + t * 0.94).toFixed(4));
    heroCotas.style.opacity = (1 - clamp(t * 1.6)).toFixed(3);
  }, { target: $('[data-hero]'), offset: ['start start', 'end start'] });

  /* ---------------- CENA PRESA: do esquadro à entrega ---------------- */
  const W = 0.07;                 // meia-largura da janela de corte em torno de cada fronteira
  const SLANT = 16;               // inclinação do corte (em % da largura)
  let lastStep = -1;
  const cutPoly = (t) => {
    const e = t * (100 + SLANT);
    return `polygon(0% 0%, ${e.toFixed(2)}% 0%, ${(e - SLANT).toFixed(2)}% 100%, 0% 100%)`;
  };
  const renderPinned = (p) => {
    ruler.style.setProperty('--p', p.toFixed(4));
    let bladeAt = -1;
    for (let k = 1; k < shots.length; k++) {
      const t = clamp((p - (k / 4 - W)) / (2 * W));
      const fig = shots[k];
      const cp = t <= 0 ? 'polygon(0% 0%, 0% 0%, -16% 100%, 0% 100%)' : t >= 1 ? 'none' : cutPoly(t);
      if (fig._cp !== cp) { fig._cp = cp; fig.style.clipPath = cp; }
      const sc = (1 + (1 - t) * 0.06).toFixed(4);
      const img = fig.firstElementChild;
      if (img._sc !== sc) { img._sc = sc; img.style.transform = `scale(${sc})`; }
      if (t > 0 && t < 1) bladeAt = t;
    }
    if (bladeAt >= 0) {
      const e = bladeAt * (100 + SLANT);
      blade.setAttribute('x1', e.toFixed(2)); blade.setAttribute('x2', (e - SLANT).toFixed(2));
      bladeSvg.style.opacity = '1';
    } else bladeSvg.style.opacity = '0';
    const k = Math.min(3, Math.floor(clamp(p, 0, 0.9999) * 4));
    if (k !== lastStep) { lastStep = k; setStepState(k); }
  };
  const resetPinned = () => {
    shots.forEach((f) => { f.style.clipPath = ''; f._cp = null; const im = f.firstElementChild; im.style.transform = ''; im._sc = null; });
    if (bladeSvg) bladeSvg.style.opacity = '0';
  };

  // modo lista (celular): trilho que se preenche, fotos entram em corte reto, cotas e prancha se desenham
  const stepsList = $('[data-steps]');
  const listRevealed = new WeakSet();
  const listMode = () => {
    if (!pinMQ.matches) shots.forEach((f) => { if (f.getBoundingClientRect().top > innerHeight) f.style.clipPath = cutPoly(0); });
    steps.forEach((s, i) => {
      inView(s, () => {
        if (pinMQ.matches) return;
        const fig = shots[i];
        fig.classList.add('is-on');
        if (!listRevealed.has(fig)) {
          listRevealed.add(fig);
          animate(fig, { clipPath: [cutPoly(0), cutPoly(1)] }, { duration: 0.9, ease: EASE_CUT }).then(() => { if (!pinMQ.matches) fig.style.clipPath = ''; });
        }
      }, { amount: 0.35 });
    });
    inView($('.plan'), () => {
      if (pinMQ.matches) return;
      layers.forEach((l, i) => setTimeout(() => l.classList.add('is-on'), 200 + i * 380));
      if (planN) planN.textContent = '04';
    }, { amount: 0.5 });
  };
  listMode();

  scroll((p) => {
    if (!pinMQ.matches) return;
    renderPinned(prog(p));
  }, { target: scene, offset: ['start start', 'end end'] });
  scroll((p) => {
    if (pinMQ.matches) return;
    stepsList.style.setProperty('--rail', prog(p).toFixed(4));
  }, { target: stepsList, offset: ['start 0.75', 'end 0.6'] });

  const onModeChange = () => {
    lastStep = -1;
    if (pinMQ.matches) { stepsList.style.removeProperty('--rail'); shots[0].style.clipPath = ''; }
    else { resetPinned(); shots.forEach((f) => f.classList.add('is-on')); layers.forEach((l) => l.classList.add('is-on')); }
  };
  pinMQ.addEventListener('change', onModeChange);
  if (!pinMQ.matches) stepsList.style.setProperty('--rail', '0');
  else setStepState(0);

  /* ---------------- Títulos em máscara (line-mask) ---------------- */
  $$('[data-mask]').forEach((h) => {
    if (h.getBoundingClientRect().top < innerHeight) return;
    h.style.clipPath = 'inset(0 0 100% 0)';
    h.style.transform = 'translateY(28px)';
    inView(h.parentElement, () => {
      animate(h, { clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% -15% 0%)'], transform: 'translateY(0px)' }, { duration: 0.95, ease: EASE_OUT });
    }, { amount: 0.2 });
  });

  /* ---------------- Entregas: cantoneiras de esquadro se desenham ---------------- */
  works.forEach((w, i) => {
    $('.corners path', w).style.transitionDelay = `${(i % 4) * 0.08}s`;
    inView(w, () => { w.classList.add('is-in'); }, { amount: 0.4 });
  });

  /* ---------------- Materiais: palavras em máscara + linha de corte ---------------- */
  $$('.mat').forEach((m) => {
    const word = $('.mat__word > span', m);
    inView(m, () => {
      m.classList.add('is-in');
      animate(word, { transform: ['translateY(102%)', 'translateY(0%)'] }, { duration: 0.9, delay: 0.12, ease: EASE_OUT });
    }, { amount: 0.6 });
  });

  /* ---------------- Fechamento: o anel volta e fecha ---------------- */
  const closeRing = $('[data-close-ring]');
  if (closeRing) {
    scroll((p) => {
      const t = prog(p);
      closeRing.style.strokeDashoffset = (1 - clamp(t * 1.25)).toFixed(4);
    }, { target: $('#orcamento'), offset: ['start end', 'center center'] });
  }
}
// sem Motion ou com movimento reduzido: nenhum estado escondido é aplicado (tudo aceso e estático).
