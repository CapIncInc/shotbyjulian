const $ = (sel, root = document) => root.querySelector(sel);

const els = {
  grid: $('#grid'),
  count: $('#photoCount'),
  year: $('#year'),
  head: $('#siteHead'),
  heroA: $('#heroA'),
  heroB: $('#heroB'),
  heroFrameA: $('.hero__frame--a'),
  heroFrameB: $('.hero__frame--b'),
  lb: $('#lightbox'),
  lbImg: $('#lbImg'),
  lbIndex: $('#lbIndex'),
  lbCaption: $('#lbCaption'),
  lbClose: $('#lbClose'),
  lbPrev: $('#lbPrev'),
  lbNext: $('#lbNext'),
  lbStage: $('#lbStage'),
};

const state = { photos: [], current: 0, lastFocused: null };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const pad = (n) => String(n).padStart(2, '0');

let closeTimer = 0;

/* ---------- data ---------- */

async function boot() {
  els.year.textContent = String(new Date().getFullYear());

  try {
    const res = await fetch('photos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`photos.json → ${res.status}`);
    const data = await res.json();
    state.photos = Array.isArray(data.photos) ? data.photos : [];
  } catch (err) {
    console.error('Could not load the photo archive:', err);
    els.grid.innerHTML = '<p class="empty">The archive could not be loaded. Run <code>npm run sync</code> and reload.</p>';
    return;
  }

  els.count.textContent = String(state.photos.length);
  renderHero();
  renderGallery();
  initHeader();
  initLightbox();
}

function altFor(photo, i) {
  return photo.caption || `Photograph by Julian, frame ${i + 1} of ${state.photos.length}`;
}

/* ---------- hero ---------- */

function renderHero() {
  const picks = [state.photos[0], state.photos[3] || state.photos[1]].filter(Boolean);
  const frames = [
    { img: els.heroA, frame: els.heroFrameA, photo: picks[0] },
    { img: els.heroB, frame: els.heroFrameB, photo: picks[1] },
  ];

  for (const { img, frame, photo } of frames) {
    if (!photo) {
      if (frame) frame.classList.add('is-empty');
      continue;
    }
    img.src = photo.src;
    if (photo.width) img.width = photo.width;
    if (photo.height) img.height = photo.height;
    img.alt = '';
    frame?.classList.remove('is-empty');
  }
}

/* ---------- gallery ---------- */

function renderGallery() {
  els.grid.textContent = '';
  state.photos.forEach((photo, i) => els.grid.appendChild(buildTile(photo, i)));
}

function buildTile(photo, i) {
  const tile = document.createElement('figure');
  tile.className = 'tile';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tile__btn';
  btn.dataset.index = String(i);
  btn.setAttribute('aria-label', `Open photograph ${i + 1} of ${state.photos.length}`);

  const img = document.createElement('img');
  img.className = 'tile__img';
  img.src = photo.src;
  if (photo.width) img.width = photo.width;
  if (photo.height) img.height = photo.height;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = altFor(photo, i);

  const meta = document.createElement('span');
  meta.className = 'tile__meta';

  const num = document.createElement('span');
  num.className = 'tile__num';
  num.textContent = pad(i + 1);

  const cap = document.createElement('span');
  cap.className = 'tile__cap';
  cap.textContent = photo.caption || 'View frame';

  meta.append(num, cap);
  btn.append(img, meta);
  tile.append(btn);
  return tile;
}

function revealTiles() {
  const tiles = [...document.querySelectorAll('.tile')];
  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    tiles.forEach((t) => t.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const tile = entry.target;
        const delay = (Number(tile.dataset.order) % 3) * 70;
        tile.style.transitionDelay = `${delay}ms`;
        tile.classList.add('is-visible');
        io.unobserve(tile);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  tiles.forEach((tile, i) => {
    tile.dataset.order = String(i);
    io.observe(tile);
  });
}

/* ---------- lightbox ---------- */

function initLightbox() {
  els.grid.addEventListener('click', (event) => {
    const btn = event.target.closest('.tile__btn');
    if (!btn) return;
    openLightbox(Number(btn.dataset.index));
  });

  els.lbClose.addEventListener('click', closeLightbox);
  els.lbPrev.addEventListener('click', () => step(-1));
  els.lbNext.addEventListener('click', () => step(1));
  els.lb.addEventListener('click', (event) => {
    if (event.target === els.lb || event.target === els.lbStage) closeLightbox();
  });

  els.lbImg.addEventListener('load', () => els.lbImg.classList.add('is-ready'));
  els.lbImg.addEventListener('error', () => els.lbImg.classList.remove('is-ready'));

  let startX = 0;
  let startY = 0;
  els.lbStage.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    startY = event.clientY;
  });
  els.lbStage.addEventListener('pointerup', (event) => {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  });

  revealTiles();
}

function openLightbox(index) {
  if (!state.photos.length) return;
  window.clearTimeout(closeTimer);
  state.current = clampIndex(index);
  state.lastFocused = document.activeElement;

  els.lb.hidden = false;
  document.body.classList.add('no-scroll');
  updateLightbox();

  requestAnimationFrame(() => els.lb.classList.add('is-open'));
  els.lbClose.focus({ preventScroll: true });
  document.addEventListener('keydown', onKeydown);
}

function closeLightbox() {
  if (els.lb.hidden) return;
  els.lb.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
  document.removeEventListener('keydown', onKeydown);

  closeTimer = window.setTimeout(() => {
    els.lb.hidden = true;
    els.lbImg.removeAttribute('src');
    els.lbImg.classList.remove('is-ready');
  }, 320);

  if (state.lastFocused instanceof HTMLElement) {
    state.lastFocused.focus({ preventScroll: true });
  }
}

function step(delta) {
  state.current = clampIndex(state.current + delta);
  updateLightbox();
}

function clampIndex(i) {
  const n = state.photos.length;
  return ((i % n) + n) % n;
}

function updateLightbox() {
  const photo = state.photos[state.current];
  if (!photo) return;

  els.lbImg.classList.remove('is-ready');
  els.lbImg.src = photo.src;
  els.lbImg.alt = altFor(photo, state.current);
  if (photo.width) els.lbImg.width = photo.width;
  if (photo.height) els.lbImg.height = photo.height;

  els.lbIndex.textContent = `${pad(state.current + 1)} / ${pad(state.photos.length)}`;
  els.lbCaption.textContent = photo.caption || 'Shot by Julian';

  preload(state.current + 1);
  preload(state.current - 1);
}

function preload(index) {
  const photo = state.photos[clampIndex(index)];
  if (!photo) return;
  const img = new Image();
  img.src = photo.src;
}

function onKeydown(event) {
  switch (event.key) {
    case 'Escape':
      closeLightbox();
      break;
    case 'ArrowRight':
      event.preventDefault();
      step(1);
      break;
    case 'ArrowLeft':
      event.preventDefault();
      step(-1);
      break;
    case 'Tab':
      trapFocus(event);
      break;
    default:
      break;
  }
}

function trapFocus(event) {
  const focusables = [els.lbClose, els.lbPrev, els.lbNext];
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* ---------- header ---------- */

function initHeader() {
  const update = () => els.head.classList.toggle('is-stuck', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

boot();
