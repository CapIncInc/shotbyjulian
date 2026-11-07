/* shotbyjulian — content first, motion second. */

const $ = (sel, root = document) => root.querySelector(sel);

const els = {
  nav: $('#nav'),
  hero: $('#hero'),
  heroMedia: $('#heroMedia'),
  heroImg: $('#heroImg'),
  heroCopy: $('.hero__copy'),
  heroCue: $('.hero__cue span'),
  chapters: $('#chapters'),
  grid: $('#grid'),
  photoCount: $('#photoCount'),
  archiveCount: $('#archiveCount'),
  year: $('#year'),
  lb: $('#lightbox'),
  lbImg: $('#lbImg'),
  lbCount: $('#lbCount'),
  lbCaption: $('#lbCaption'),
  lbClose: $('#lbClose'),
  lbPrev: $('#lbPrev'),
  lbNext: $('#lbNext'),
};

const state = { photos: [], current: 0, lastFocused: null };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const pad = (n) => String(n).padStart(2, '0');
const hasGsap = typeof window.gsap !== 'undefined';
const hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== 'undefined';

let closeTimer = 0;
let imageToken = 0;

/* ---------- boot ---------- */

async function boot() {
  els.year.textContent = String(new Date().getFullYear());

  try {
    const res = await fetch('photos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`photos.json → ${res.status}`);
    const data = await res.json();
    state.photos = Array.isArray(data.photos) ? data.photos : [];
  } catch (err) {
    console.error('The archive could not be loaded:', err);
    els.grid.innerHTML = '<p class="archive__count">The archive could not be loaded. Run <code>npm run sync</code>.</p>';
    return;
  }

  els.photoCount.textContent = String(state.photos.length);
  els.archiveCount.textContent = String(state.photos.length);

  renderHero();
  renderChapters();
  renderGallery();
  initNav();
  initLightbox();
  initMotion();

  window.addEventListener('load', () => {
    if (hasScrollTrigger) window.ScrollTrigger.refresh();
  });
}

function altFor(photo, i) {
  return photo.caption || `Photograph by Julian, ${i + 1} of ${state.photos.length}`;
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

/* ---------- chapters ---------- */

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
  section.dataset.index = String(i + 1);

  const stage = document.createElement('div');
  stage.className = 'chapter__stage';

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

  const scrim = document.createElement('div');
  scrim.className = 'chapter__scrim';

  const label = document.createElement('p');
  label.className = 'chapter__label';
  const idx = document.createElement('span');
  idx.textContent = pad(i + 1);
  const line = document.createElement('span');
  line.textContent = `Frame ${i + 2}`;
  label.append(idx, line);

  stage.append(media, scrim, label);
  section.appendChild(stage);
  return section;
}

/* ---------- archive ---------- */

function renderGallery() {
  const frag = document.createDocumentFragment();
  state.photos.forEach((photo, i) => frag.appendChild(buildTile(photo, i)));
  els.grid.appendChild(frag);
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
  img.alt = altFor(photo, i);
  img.loading = 'lazy';
  img.decoding = 'async';
  if (photo.width) img.width = photo.width;
  if (photo.height) img.height = photo.height;

  const num = document.createElement('span');
  num.className = 'tile__num';
  num.textContent = pad(i + 1);

  btn.append(img, num);
  tile.append(btn);
  return tile;
}

/* ---------- motion ---------- */

function initMotion() {
  if (!hasGsap || reduceMotion.matches) return;

  const gsap = window.gsap;
  if (hasScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  gsap.defaults({ ease: 'power3.out' });

  const mm = gsap.matchMedia();

  mm.add({ motion: '(prefers-reduced-motion: no-preference)' }, (context) => {
    if (!context.conditions?.motion) return;

    introTimeline(gsap);
    if (hasScrollTrigger) {
      heroScroll(gsap);
      chapterScroll(gsap);
      archiveReveal(gsap);
      contactReveal(gsap);
    }
    cueLoop(gsap);
  });
}

function introTimeline(gsap) {
  const tl = gsap.timeline({ defaults: { duration: 0.9 } });

  tl.from(els.nav, { autoAlpha: 0, y: -12, duration: 0.6 })
    .from('.hero .eyebrow', { autoAlpha: 0, y: 12, duration: 0.7 }, 0.15)
    .from('.hero__title', { autoAlpha: 0, y: 26, duration: 1.1 }, 0.22)
    .from('.hero__sub', { autoAlpha: 0, y: 14, duration: 0.9 }, 0.4);
}

function cueLoop(gsap) {
  if (!els.heroCue) return;
  gsap.fromTo(
    els.heroCue,
    { scaleY: 0.25, transformOrigin: 'top' },
    { scaleY: 1, transformOrigin: 'top', duration: 1.8, repeat: -1, ease: 'sine.inOut', yoyo: true }
  );
}

function heroScroll(gsap) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: els.hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });

  tl.to(els.heroMedia, {
    '--clip-t': '0%',
    '--clip-r': '0%',
    '--clip-b': '0%',
    '--clip-l': '0%',
    '--clip-radius': '0px',
    ease: 'none',
    duration: 1,
  }, 0)
    .to(els.heroImg, { scale: 1, ease: 'none', duration: 1 }, 0)
    .to(els.heroCopy, { autoAlpha: 0, y: -70, ease: 'none', duration: 0.42 }, 0)
    .to(els.heroCue, { autoAlpha: 0, duration: 0.2 }, 0);
}

function chapterScroll(gsap) {
  document.querySelectorAll('.chapter').forEach((chapter) => {
    const img = $('img', chapter);
    const label = $('.chapter__label', chapter);

    gsap.fromTo(
      img,
      { yPercent: -7 },
      {
        yPercent: 7,
        ease: 'none',
        scrollTrigger: {
          trigger: chapter,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    gsap.from(label, {
      autoAlpha: 0,
      y: 18,
      duration: 0.8,
      scrollTrigger: { trigger: chapter, start: 'top 65%', once: true },
    });
  });
}

function archiveReveal(gsap) {
  const tiles = gsap.utils.toArray('.tile');
  if (!tiles.length) return;

  gsap.set(tiles, { autoAlpha: 0, y: 28 });

  window.ScrollTrigger.batch(tiles, {
    start: 'top 94%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.06,
        overwrite: true,
      }),
  });
}

function contactReveal(gsap) {
  const mail = $('.contact__mail');

  gsap.timeline({
    scrollTrigger: { trigger: '.contact', start: 'top 78%', once: true },
  })
    .from('.contact .eyebrow', { autoAlpha: 0, y: 10, duration: 0.6 })
    .from(mail, { autoAlpha: 0, y: 24, duration: 0.9 }, 0.08)
    .from('.contact__note', { autoAlpha: 0, y: 10, duration: 0.6 }, 0.22);
}

/* ---------- nav ---------- */

function initNav() {
  const update = () => els.nav.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ---------- lightbox ---------- */

function initLightbox() {
  els.grid.addEventListener('click', (event) => {
    const btn = event.target.closest('.tile__btn');
    if (btn) openLightbox(Number(btn.dataset.index));
  });

  els.lbClose.addEventListener('click', closeLightbox);
  els.lbPrev.addEventListener('click', () => step(-1));
  els.lbNext.addEventListener('click', () => step(1));
  els.lb.addEventListener('click', (event) => {
    if (event.target === els.lb) closeLightbox();
  });

  let startX = 0;
  let startY = 0;
  els.lb.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
    startY = event.clientY;
  });
  els.lb.addEventListener('pointerup', (event) => {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  });
}

function openLightbox(index) {
  if (!state.photos.length) return;
  window.clearTimeout(closeTimer);
  state.current = clampIndex(index);
  state.lastFocused = document.activeElement;

  els.lb.hidden = false;
  document.body.classList.add('no-scroll');
  showPhoto(state.current, 0);

  if (hasGsap) {
    window.gsap.fromTo(
      els.lb,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.35, ease: 'power2.out' }
    );
    window.gsap.fromTo(
      els.lbClose,
      { autoAlpha: 0, scale: 0.9 },
      { autoAlpha: 1, scale: 1, duration: 0.4, delay: 0.06, ease: 'power2.out' }
    );
  }

  els.lbClose.focus({ preventScroll: true });
  document.addEventListener('keydown', onKeydown);
}

function closeLightbox() {
  if (els.lb.hidden) return;

  document.body.classList.remove('no-scroll');
  document.removeEventListener('keydown', onKeydown);

  const finish = () => {
    els.lb.hidden = true;
    els.lbImg.removeAttribute('src');
    if (state.lastFocused instanceof HTMLElement) {
      state.lastFocused.focus({ preventScroll: true });
    }
  };

  if (hasGsap) {
    window.gsap.to(els.lb, { autoAlpha: 0, duration: 0.3, ease: 'power2.in' });
  }
  closeTimer = window.setTimeout(finish, hasGsap ? 300 : 0);
}

function step(delta) {
  state.current = clampIndex(state.current + delta);
  showPhoto(state.current, delta);
}

function clampIndex(i) {
  const n = state.photos.length;
  return ((i % n) + n) % n;
}

function showPhoto(index, direction) {
  const photo = state.photos[index];
  if (!photo) return;

  const token = ++imageToken;
  els.lbCount.textContent = `${pad(index + 1)} / ${pad(state.photos.length)}`;
  els.lbCaption.textContent = photo.caption || '';
  els.lbImg.alt = altFor(photo, index);
  if (photo.width) els.lbImg.width = photo.width;
  if (photo.height) els.lbImg.height = photo.height;

  const reveal = () => {
    if (token !== imageToken) return;
    if (hasGsap) {
      window.gsap.fromTo(
        els.lbImg,
        { autoAlpha: 0, scale: 1.015, x: direction * 14 },
        { autoAlpha: 1, scale: 1, x: 0, duration: 0.45, ease: 'power2.out' }
      );
    }
  };

  if (hasGsap) {
    window.gsap.to(els.lbImg, {
      autoAlpha: 0,
      duration: 0.16,
      ease: 'power1.out',
      onComplete: () => {
        if (token !== imageToken) return;
        els.lbImg.src = photo.src;
        if (els.lbImg.complete) reveal();
        else els.lbImg.addEventListener('load', reveal, { once: true });
      },
    });
  } else {
    els.lbImg.src = photo.src;
  }

  preload(index + 1);
  preload(index - 1);
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

boot();
