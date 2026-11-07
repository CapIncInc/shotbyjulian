/* shotbyjulian — innehållet först, rörelsen sen. */

const $ = (sel, root = document) => root.querySelector(sel);

const els = {
  nav: $('#nav'),
  navProgress: $('#navProgress'),
  hero: $('#hero'),
  heroMedia: $('#heroMedia'),
  heroImg: $('#heroImg'),
  heroCopy: $('.hero__copy'),
  heroTitle: $('.hero__title'),
  cue: $('.hero__cue span'),
  chapters: $('#chapters'),
  grid: $('#grid'),
  heroCount: $('#heroCount'),
  archiveCount: $('#archiveCount'),
  year: $('#year'),
};

const state = { photos: [] };
const pad = (n) => String(n).padStart(2, '0');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hasGsap = typeof window.gsap !== 'undefined';
const hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== 'undefined';

/* ---------- start ---------- */

async function boot() {
  els.year.textContent = String(new Date().getFullYear());

  try {
    const res = await fetch('photos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`photos.json → ${res.status}`);
    const data = await res.json();
    state.photos = Array.isArray(data.photos) ? data.photos : [];
  } catch (err) {
    console.error('arkivet kunde inte läsas:', err);
    els.grid.innerHTML = '<p class="archive__count">arkivet kunde inte läsas. kör npm run sync.</p>';
    return;
  }

  els.heroCount.textContent = String(state.photos.length);
  els.archiveCount.textContent = String(state.photos.length);

  renderHero();
  renderChapters();
  renderGallery();
  initNav();
  initMotion();

  window.addEventListener('load', () => {
    if (hasScrollTrigger) window.ScrollTrigger.refresh();
  });
}

function altFor(photo, i) {
  return photo.caption || `fotografi av julian, ${i + 1} av ${state.photos.length}`;
}

/* ---------- hero ---------- */

function renderHero() {
  const photo = state.photos[0];
  if (!photo) return;

  els.heroImg.src = photo.src;
  els.heroImg.alt = altFor(photo, 0);
  if (photo.width) els.heroImg.width = photo.width;
  if (photo.height) els.heroImg.height = photo.height;
  els.heroImg.fetchPriority = 'high';
}

/* ---------- kapitel ---------- */

function renderChapters() {
  const picks = state.photos.slice(1, 4);
  if (!picks.length) {
    els.chapters.remove();
    return;
  }

  const frag = document.createDocumentFragment();
  picks.forEach((photo, i) => frag.appendChild(buildChapter(photo, i)));
  els.chapters.appendChild(frag);
}

function buildChapter(photo, i) {
  const section = document.createElement('section');
  section.className = 'chapter';

  const stage = document.createElement('div');
  stage.className = 'chapter__stage';

  const figure = document.createElement('figure');
  figure.className = 'chapter__figure';

  const media = document.createElement('div');
  media.className = 'chapter__media';

  const img = document.createElement('img');
  img.src = photo.src;
  img.alt = altFor(photo, i + 1);
  img.loading = 'lazy';
  img.decoding = 'async';
  if (photo.width) img.width = photo.width;
  if (photo.height) img.height = photo.height;

  media.appendChild(img);

  const label = document.createElement('figcaption');
  label.className = 'chapter__label';
  const idx = document.createElement('span');
  idx.textContent = pad(i + 1);
  const text = document.createElement('span');
  text.textContent = `fotografi ${pad(i + 2)}`;
  label.append(idx, text);

  figure.append(media, label);
  stage.appendChild(figure);
  section.appendChild(stage);
  return section;
}

/* ---------- arkivet ---------- */

function renderGallery() {
  const frag = document.createDocumentFragment();
  state.photos.forEach((photo, i) => frag.appendChild(buildTile(photo, i)));
  els.grid.appendChild(frag);
}

function buildTile(photo, i) {
  const tile = document.createElement('figure');
  tile.className = 'tile';

  const frame = document.createElement('div');
  frame.className = 'tile__frame';

  const img = document.createElement('img');
  img.className = 'tile__img';
  img.src = photo.src;
  img.alt = altFor(photo, i);
  img.loading = 'lazy';
  img.decoding = 'async';
  if (photo.width) img.width = photo.width;
  if (photo.height) img.height = photo.height;

  const num = document.createElement('figcaption');
  num.className = 'tile__num';
  num.textContent = pad(i + 1);

  frame.appendChild(img);
  tile.append(frame, num);
  return tile;
}

/* ---------- rörelse ---------- */

function initMotion() {
  if (!hasGsap || reduceMotion.matches) return;

  const gsap = window.gsap;
  if (hasScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  gsap.defaults({ ease: 'power3.out', duration: 0.9 });

  const mm = gsap.matchMedia();

  mm.add({ motion: '(prefers-reduced-motion: no-preference)' }, (context) => {
    if (!context.conditions?.motion) return;

    intro();
    cueLoop();

    if (!hasScrollTrigger) return;
    heroScroll();
    chaptersMotion();
    archiveMotion();
    outroMotion();
    progressBar();
  });
}

function intro() {
  const gsap = window.gsap;
  const tl = gsap.timeline({ defaults: { duration: 0.9 } });

  tl.from(els.nav, { autoAlpha: 0, y: -10, duration: 0.6 })
    .from('.hero .label', { autoAlpha: 0, y: 10, duration: 0.6 }, 0.12)
    .from(els.heroTitle, { autoAlpha: 0, y: 24, duration: 1.1 }, 0.18)
    .from('.hero__sub', { autoAlpha: 0, y: 12, duration: 0.8 }, 0.34)
    .from(els.heroMedia, { autoAlpha: 0, y: 26, scale: 0.97, duration: 1.2 }, 0.26);

  countTo(els.heroCount, state.photos.length, 1.6, 0.5);
}

function cueLoop() {
  if (!els.cue) return;
  window.gsap.fromTo(
    els.cue,
    { scaleY: 0.25, transformOrigin: 'top center' },
    { scaleY: 1, transformOrigin: 'top center', duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' }
  );
}

function heroScroll() {
  const gsap = window.gsap;

  gsap
    .timeline({
      scrollTrigger: {
        trigger: els.hero,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    })
    .to(els.heroMedia, { scale: 1, ease: 'none', duration: 1 }, 0)
    .to(els.heroCopy, { autoAlpha: 0, y: -50, ease: 'none', duration: 0.45 }, 0)
    .to(els.cue, { autoAlpha: 0, duration: 0.2 }, 0);
}

function chaptersMotion() {
  const gsap = window.gsap;

  document.querySelectorAll('.chapter').forEach((chapter, i) => {
    const figure = $('.chapter__figure', chapter);
    const media = $('.chapter__media', chapter);
    const img = $('img', chapter);
    const label = $('.chapter__label', chapter);

    gsap.from(img, {
      autoAlpha: 0,
      scale: 0.95,
      y: 24,
      duration: 1.2,
      scrollTrigger: { trigger: chapter, start: 'top 78%', once: true },
    });

    gsap.from(label, {
      autoAlpha: 0,
      y: 14,
      duration: 0.8,
      delay: 0.15,
      scrollTrigger: { trigger: chapter, start: 'top 70%', once: true },
    });

    gsap.fromTo(
      figure,
      { yPercent: -3 },
      {
        yPercent: 3,
        ease: 'none',
        scrollTrigger: {
          trigger: chapter,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    gsap.fromTo(
      media,
      { boxShadow: '0 0 0 rgba(0,0,0,0)' },
      {
        boxShadow: '0 40px 90px rgba(0,0,0,0.55)',
        ease: 'none',
        scrollTrigger: { trigger: chapter, start: 'top center', end: 'bottom center', scrub: true },
      }
    );

    gsap.set(figure, { '--i': i });
  });
}

function archiveMotion() {
  const gsap = window.gsap;
  const tiles = gsap.utils.toArray('.tile');
  if (!tiles.length) return;

  gsap.from('.archive__title', {
    autoAlpha: 0,
    y: 22,
    duration: 1,
    scrollTrigger: { trigger: '.archive__head', start: 'top 82%', once: true },
  });

  gsap.from('.archive__head', {
    scaleX: 0.92,
    transformOrigin: 'left center',
    duration: 1,
    ease: 'power3.out',
  });

  gsap.set(tiles, { autoAlpha: 0, y: 32 });
  gsap.set('.tile__img', { yPercent: 7, scale: 1.05 });

  window.ScrollTrigger.batch(tiles, {
    start: 'top 93%',
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, overwrite: true });
      gsap.to(
        batch.map((tile) => $('.tile__img', tile)),
        { yPercent: 0, scale: 1, duration: 1.25, stagger: 0.06, ease: 'power3.out', overwrite: true }
      );
    },
  });

  window.ScrollTrigger.create({
    trigger: '.archive__head',
    start: 'top 85%',
    once: true,
    onEnter: () => countTo(els.archiveCount, state.photos.length, 1.4, 0),
  });
}

function outroMotion() {
  const gsap = window.gsap;

  gsap
    .timeline({ scrollTrigger: { trigger: '.outro', start: 'top 80%', once: true } })
    .from('.outro .label', { autoAlpha: 0, y: 10, duration: 0.6 })
    .from('.outro__link', { autoAlpha: 0, y: 26, duration: 0.9 }, 0.08)
    .from('.outro__note', { autoAlpha: 0, y: 10, duration: 0.6 }, 0.24);
}

function progressBar() {
  if (!els.navProgress) return;
  window.gsap.to(els.navProgress, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });
}

function countTo(el, target, duration, delay) {
  if (!el) return;
  const counter = { value: 0 };
  window.gsap.to(counter, {
    value: target,
    duration,
    delay,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = String(Math.round(counter.value));
    },
  });
}

/* ---------- nav ---------- */

function initNav() {
  const update = () => els.nav.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

boot();
