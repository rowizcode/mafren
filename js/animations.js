// ============================================
// ANIMATIONS v3 — Mafren Jewelry Atelier
// Performance-first: single GSAP ticker RAF,
// merged cursor loop, no video scale parallax
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

  // ==========================================
  // SCROLL PROGRESS BAR (native scroll)
  // ==========================================
  const progressBar = document.getElementById('scroll-progress-bar');
  const progressLineEl = document.getElementById('progress-line');

  const setProgress = (p) => {
    const pct = Math.min(Math.max(p, 0), 1);
    if (progressBar) progressBar.style.width = `${pct * 100}%`;
    if (progressLineEl) progressLineEl.style.setProperty('--progress', `${pct * 100}%`);
  };

  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(max > 0 ? window.scrollY / max : 0);
  }, { passive: true });

  // ==========================================
  // NAVBAR HIDE/SHOW
  // ==========================================
  const navbar = document.getElementById('navbar');
  let lastScrollY = 0, scrollDelta = 0;
  const SCROLL_THRESHOLD = 60;

  const updateNav = () => {
    if (!navbar) return;
    const currentY = window.scrollY;
    const heroHeight = document.getElementById('home')?.offsetHeight || 700;

    // Scrolled class — solid navbar background after hero
    if (currentY > heroHeight - 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Hide/show navbar on scroll direction
    if (currentY > heroHeight) {
      scrollDelta += currentY - lastScrollY;
      if (scrollDelta > SCROLL_THRESHOLD) {
        navbar.classList.add('nav-hidden'); scrollDelta = 0;
      } else if (scrollDelta < -SCROLL_THRESHOLD) {
        navbar.classList.remove('nav-hidden'); scrollDelta = 0;
      }
    } else {
      navbar.classList.remove('nav-hidden'); scrollDelta = 0;
    }

    // Hero-past class for navbar color swap
    if (currentY > heroHeight * 0.85) {
      document.body.classList.add('scrolled-past-hero');
    } else {
      document.body.classList.remove('scrolled-past-hero');
    }

    lastScrollY = currentY;
  };

  window.addEventListener('scroll', updateNav, { passive: true });

  // ==========================================
  // HERO TITLE REVEAL
  // ==========================================
  const heroTitle = document.querySelector('.hero-title');
  const heroEyebrow = document.querySelector('.hero-eyebrow');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const heroActions = document.querySelector('.hero-actions');
  const heroContent = document.querySelector('.hero-content');

  [heroEyebrow, heroSubtitle, heroActions].forEach((el) => {
    if (el) el.classList.remove('fade-in', 'delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5');
  });

  gsap.set([heroEyebrow, heroSubtitle, heroActions], { opacity: 0, y: 24 });

  if (heroTitle) {
    const titleSpans = heroTitle.querySelectorAll(':scope > span');
    titleSpans.forEach((span) => {
      span.classList.remove('fade-in', 'delay-1', 'delay-2', 'delay-3', 'delay-4', 'delay-5');
      const html = span.innerHTML.trim();
      span.innerHTML = `<span class="title-word"><span class="title-word-inner">${html}</span></span>`;
    });

    const wordInners = heroTitle.querySelectorAll('.title-word-inner');
    wordInners.forEach((el, i) => gsap.set(el, { y: i % 2 === 0 ? '110%' : '-110%' }));

    gsap.to(wordInners, {
      y: '0%', duration: 1.1, stagger: 0.1, ease: 'power4.out', delay: 0.3,
    });
  }

  gsap.timeline({ delay: 0.6 })
    .to(heroEyebrow, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
    .to(heroSubtitle, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.6')
    .to(heroActions, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.6');

  // Hero content parallax (content only, NOT video — video scale causes compositing jank)
  if (heroContent) {
    gsap.to(heroContent, {
      y: 120, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 }
    });
  }

  // ==========================================
  // CURSOR — SINGLE UNIFIED RAF LOOP
  // ==========================================
  if (!isTouchDevice && !prefersReducedMotion) {
    const cursorDot = document.getElementById('cursor-dot');
    const cursorLabel = document.getElementById('cursor-dot-label');
    const cursorRing = document.getElementById('cursor-ring');
    const cursorGlow = document.getElementById('cursor-glow');
    const heroEl = document.getElementById('home');

    let dotX = 0, dotY = 0;
    let ringX = -200, ringY = -200;
    let glowX = 0, glowY = 0;
    let targetX = 0, targetY = 0;
    let cursorVisible = false;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!cursorVisible) {
        dotX = targetX; dotY = targetY;
        ringX = targetX; ringY = targetY;
        glowX = targetX; glowY = targetY;
        cursorVisible = true;
        if (cursorDot) cursorDot.classList.add('visible');
        if (cursorRing) cursorRing.classList.add('visible');
      }

      // Hero glow-light detection (moved from app.js)
      if (cursorGlow && heroEl) {
        const heroRect = heroEl.getBoundingClientRect();
        const isOverHero = e.clientY >= heroRect.top && e.clientY <= heroRect.bottom;
        cursorGlow.classList.toggle('glow-light', isOverHero);
      }
    });

    // ONE loop for all cursors — GPU-accelerated via transform
    const tickCursors = () => {
      if (!cursorVisible) { requestAnimationFrame(tickCursors); return; }

      dotX += (targetX - dotX) * 0.18;
      dotY += (targetY - dotY) * 0.18;
      ringX += (targetX - ringX) * 0.08;
      ringY += (targetY - ringY) * 0.08;
      glowX += (targetX - glowX) * 0.05;
      glowY += (targetY - glowY) * 0.05;

      const dxR = Math.round(dotX);
      const dyR = Math.round(dotY);
      const rxR = Math.round(ringX);
      const ryR = Math.round(ringY);
      const gxR = Math.round(glowX);
      const gyR = Math.round(glowY);

      if (cursorDot) {
        cursorDot.style.transform = `translate3d(${dxR}px, ${dyR}px, 0) translate(-50%, -50%)`;
      }
      if (cursorLabel) {
        cursorLabel.style.transform = `translate3d(${dxR}px, ${dyR + 20}px, 0) translate(-50%, -50%)`;
      }
      if (cursorRing) {
        cursorRing.style.transform = `translate3d(${rxR}px, ${ryR}px, 0) translate(-50%, -50%)`;
      }
      if (cursorGlow) {
        cursorGlow.style.transform = `translate3d(${gxR}px, ${gyR}px, 0) translate(-50%, -50%)`;
      }

      requestAnimationFrame(tickCursors);
    };
    requestAnimationFrame(tickCursors);

    // Cursor state changes on hover
    const interactiveEls = document.querySelectorAll('a, button, .product-card, .btn, .btn-book');
    interactiveEls.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (cursorDot) cursorDot.classList.add('active');
        const label = el.dataset.cursorLabel;
        if (label && cursorLabel) { cursorLabel.textContent = label; cursorLabel.classList.add('visible'); }
        // Ring: expand on cards, contract on buttons
        if (cursorRing) {
          if (el.classList.contains('product-card')) {
            cursorRing.classList.remove('ring-contract'); cursorRing.classList.add('ring-expand');
          } else if (el.classList.contains('btn') || el.classList.contains('btn-book')) {
            cursorRing.classList.remove('ring-expand'); cursorRing.classList.add('ring-contract');
          }
        }
      });
      el.addEventListener('mouseleave', () => {
        if (cursorDot) cursorDot.classList.remove('active');
        if (cursorLabel) { cursorLabel.classList.remove('visible'); cursorLabel.textContent = ''; }
        if (cursorRing) cursorRing.classList.remove('ring-expand', 'ring-contract');
      });
    });
  }

  // ==========================================
  // ABOUT: LINE REVEAL + EYEBROW SCROLL TRIGGER
  // ==========================================
  const eyebrows = document.querySelectorAll('.section-eyebrow');
  eyebrows.forEach((eb) => {
    ScrollTrigger.create({
      trigger: eb, start: 'top 85%',
      onEnter: () => eb.classList.add('is-visible'),
    });
  });

  const aboutLead = document.querySelector('.about-text .about-lead');
  if (aboutLead) {
    const sentences = aboutLead.innerHTML.split(/(?<=\.)|(?<=—)/);
    aboutLead.innerHTML = sentences.map((s) =>
      `<span class="line-reveal"><span class="line-reveal-inner">${s}</span></span>`
    ).join('');
    ScrollTrigger.create({
      trigger: aboutLead, start: 'top 80%',
      onEnter: () => aboutLead.classList.add('is-visible'),
    });
  }

  // ==========================================
  // ABOUT TEXT + FEATURE CARDS
  // ==========================================
  const aboutText = document.querySelector('.about-text p:not(.about-lead)');
  if (aboutText) {
    gsap.from(aboutText, {
      opacity: 0, y: 20, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: aboutText, start: 'top 85%' }
    });
  }

  const featureCards = document.querySelectorAll('.feature-card');
  if (featureCards.length) {
    gsap.to(featureCards, {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.about-features', start: 'top 80%' }
    });
  }

  // ==========================================
  // PRODUCT CARDS CLIP-PATH REVEAL
  // ==========================================
  const observeCards = () => {
    const cards = document.querySelectorAll('.product-card:not([data-observed])');
    cards.forEach((card) => {
      card.dataset.observed = '1';
      ScrollTrigger.create({
        trigger: card, start: 'top 88%',
        onEnter: () => {
          gsap.to(card, {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.85, ease: 'power3.inOut',
          });
        },
      });
    });
  };

  // Set initial clip state via GSAP (not CSS class)
  const initCards = () => {
    document.querySelectorAll('.product-card:not([data-observed])').forEach((card) => {
      gsap.set(card, { clipPath: 'inset(100% 0% 0% 0%)' });
    });
  };

  const productGrid = document.getElementById('product-grid');
  if (productGrid) {
    new MutationObserver(() => {
      initCards();
      requestAnimationFrame(() => { observeCards(); ScrollTrigger.refresh(); });
    }).observe(productGrid, { childList: true });
  }

  // ==========================================
  // PRODUCT CARD 3D TILT (desktop only)
  // ==========================================
  if (!isTouchDevice && !prefersReducedMotion) {
    const setupCardTilt = () => {
      document.querySelectorAll('.product-card:not([data-tilt])').forEach((card) => {
        card.dataset.tilt = '1';
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, { rotateY: x * 8, rotateX: -y * 6, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
        });
      });
    };
    if (productGrid) {
      new MutationObserver(() => requestAnimationFrame(setupCardTilt)).observe(productGrid, { childList: true });
    }
  }

  // ==========================================
  // BOOKING SECTION REVEAL
  // ==========================================
  const bookingHeader = document.querySelector('.booking-header');
  if (bookingHeader) {
    gsap.from(bookingHeader.children, {
      opacity: 0, y: 30, duration: 0.9, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: bookingHeader, start: 'top 85%' }
    });
  }

  const formGroups = document.querySelectorAll('.form-group, .form-row');
  if (formGroups.length) {
    gsap.from(formGroups, {
      opacity: 0, y: 20, duration: 0.6, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.booking-form', start: 'top 85%' }
    });
  }

  const contactMethods = document.querySelectorAll('.method');
  if (contactMethods.length) {
    gsap.from(contactMethods, {
      opacity: 0, x: -20, duration: 0.7, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.booking-info', start: 'top 85%' }
    });
  }

  // ==========================================
  // MARQUEE — velocity linked to scroll speed
  // ==========================================
  const marqueeTrack = document.querySelector('.marquee-track');
  if (marqueeTrack && lenis) {
    let velocity = 1;
    let currentSpeed = 1;
    lenis.on('scroll', ({ velocity: v }) => { velocity = Math.abs(v) || 1; });

    gsap.ticker.add(() => {
      currentSpeed += (velocity - currentSpeed) * 0.1;
      marqueeTrack.style.animationDuration = `${Math.max(8 / currentSpeed, 1.5)}s`;
    });
  }

  // ==========================================
  // MAGNETIC BUTTONS
  // ==========================================
  if (!isTouchDevice && !prefersReducedMotion) {
    document.querySelectorAll('.btn-gold, .btn-ghost, .btn-book').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.18, duration: 0.35, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'power3.out' }));
    });
  }

  // ==========================================
  // SECTION DIVIDERS
  // ==========================================
  document.querySelectorAll('.section-divider').forEach((div) => {
    ScrollTrigger.create({
      trigger: div, start: 'top 85%',
      onEnter: () => div.classList.add('is-visible'),
    });
  });

  // ==========================================
  // FOOTER REVEAL
  // ==========================================
  const footer = document.querySelector('footer');
  if (footer) {
    gsap.from(['.footer-brand', '.footer-nav', '.footer-contact'], {
      opacity: 0, y: 28, duration: 0.8, stagger: 0.14, ease: 'power3.out',
      scrollTrigger: { trigger: footer, start: 'top 90%' }
    });
  }

  // ==========================================
  // NEW: HERO BRAND GIANT TEXT PARALLAX
  // ==========================================
  const heroBrandGiant = document.querySelector('.hero-brand-giant');
  if (heroBrandGiant && !prefersReducedMotion) {
    gsap.fromTo(heroBrandGiant,
      { opacity: 0, scale: 1.05 },
      { opacity: 1, scale: 1, duration: 1.8, ease: 'power3.out', delay: 0.8 }
    );
    gsap.to(heroBrandGiant, {
      y: -60, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 2 }
    });
  }

  // ==========================================
  // NEW: HORIZONTAL GOLD LINE WIPE per section title
  // ==========================================
  document.querySelectorAll('.section-title:not(.hero-title)').forEach((title) => {
    const wipe = document.createElement('span');
    wipe.className = 'title-line-wipe';
    title.parentElement.insertBefore(wipe, title);
    ScrollTrigger.create({
      trigger: title, start: 'top 88%',
      onEnter: () => wipe.classList.add('is-visible'),
    });
  });

  // ==========================================
  // NEW: WORD-BY-WORD TITLE REVEAL (.js-title-chars)
  // (splits by word, not char — safe for Vietnamese diacritics)
  // ==========================================
  if (!prefersReducedMotion) {
    document.querySelectorAll('.js-title-chars').forEach((titleEl) => {
      const fragment = document.createDocumentFragment();
      let wordIdx = 0;

      const processNode = (node, container) => {
        if (node.nodeType === Node.TEXT_NODE) {
          node.textContent.split(/( +)/).forEach((part) => {
            if (!part) return;
            if (/^ +$/.test(part)) {
              container.appendChild(document.createTextNode('\u00a0'));
              return;
            }
            const wrap = document.createElement('span');
            wrap.className = 'char-wrap';
            const inner = document.createElement('span');
            inner.className = 'char';
            inner.style.transitionDelay = `${wordIdx * 0.05}s`;
            inner.textContent = part;
            wrap.appendChild(inner);
            container.appendChild(wrap);
            wordIdx++;
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const clone = document.createElement(node.tagName.toLowerCase());
          Array.from(node.attributes).forEach((a) => clone.setAttribute(a.name, a.value));
          Array.from(node.childNodes).forEach((c) => processNode(c, clone));
          container.appendChild(clone);
        }
      };

      Array.from(titleEl.childNodes).forEach((n) => processNode(n, fragment));
      titleEl.innerHTML = '';
      titleEl.appendChild(fragment);

      ScrollTrigger.create({
        trigger: titleEl, start: 'top 87%',
        onEnter: () => titleEl.classList.add('chars-visible'),
      });
    });
  }

  // ==========================================
  // NEW: SCRUB TEXT — about paragraph brightens by scroll
  // ==========================================
  const scrubParaEl = document.querySelector('.about-text p:not(.about-lead)');
  if (scrubParaEl && !prefersReducedMotion) {
    const words = scrubParaEl.textContent.trim().split(/\s+/);
    scrubParaEl.innerHTML = words
      .map((w) => `<span class="scrub-text-word">${w}</span>`)
      .join(' ');
    const wordEls = scrubParaEl.querySelectorAll('.scrub-text-word');
    const total = wordEls.length;

    ScrollTrigger.create({
      trigger: scrubParaEl, start: 'top 80%', end: 'bottom 30%', scrub: 1.2,
      onUpdate: ({ progress }) => {
        const lit = Math.round(progress * total * 1.15);
        wordEls.forEach((w, i) => w.classList.toggle('lit', i <= lit));
      },
    });
  }

  // ==========================================
  // RESIZE
  // ==========================================
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 300);
  });

});
