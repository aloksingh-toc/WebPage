/* ============================================================
   MANGALAM HDPE PIPES — script.js
   All interactive behaviours: sticky header, carousel,
   hover-zoom, modals, tabs, accordion, scroll-to-top
   ============================================================ */

(function () {
  'use strict';

  /* ── Utility helpers ──────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /** Simple email validator regex — shared by all forms */
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ── Page configuration — data separated from logic ─────── */
  const CONFIG = {
    /** Carousel images. Order here = order in UI. Single source of truth. */
    carouselImages: [
      { src: 'assets/images/product_pipes.png',         alt: 'HDPE Pipes' },
      { src: 'assets/images/product_coils.png',         alt: 'HDPE Coils' },
      { src: 'assets/images/pipe_installation.png',     alt: 'Pipe installation' },
      { src: 'assets/images/manufacturing_process.png', alt: 'Manufacturing process' },
      { src: 'assets/images/pipe_testing.png',          alt: 'Pipe testing' },
      { src: 'assets/images/hero_engineer.png',         alt: 'Factory engineer' }
    ],
    /** Contact details — update here to reflect everywhere */
    contact: {
      phone: '+91\u202F98765\u202F43210',
      email: 'info@mangalamhdpe.com',
      address: '2126, Road No. 2, GIDC Sachin, Surat - 394 230 Gujarat, India'
    }
  };

  /**
   * Close a modal overlay and restore body scroll.
   * @param {HTMLElement} overlay
   */
  function closeModal(overlay) {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    /* Restore focus to the element that opened this modal */
    if (overlay._trigger && overlay._trigger.focus) overlay._trigger.focus();
    /* Remove the focus trap we attached on open */
    if (overlay._trapFn) { overlay.removeEventListener('keydown', overlay._trapFn); delete overlay._trapFn; }
  }

  /**
   * Open a modal overlay by its id, lock body scroll, and trap focus inside.
   * Focus returns to the element that opened the modal when it closes.
   * @param {string} id — element id of the modal overlay
   * @param {HTMLElement} [trigger] — the element that triggered the open
   */
  function openModal(id, trigger = document.activeElement) {
    const overlay = $('#' + id);
    if (!overlay) return;
    overlay.classList.add('open');
    overlay._trigger = trigger; // stash so closeModal can restore focus
    document.body.style.overflow = 'hidden';

    const box = overlay.querySelector('.modal-box');
    if (box) box.focus();

    /* Focus trap — keep Tab/Shift+Tab cycling inside the modal */
    const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    overlay._trapFn = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = [...overlay.querySelectorAll(FOCUSABLE)].filter(el => !el.closest('[hidden]'));
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    };
    overlay.addEventListener('keydown', overlay._trapFn);
  }

  /**
   * Show an inline success message, then auto-close the modal
   * after a short delay. Clears any previous pending timer to
   * prevent race conditions on rapid re-submissions.
   *
   * @param {Object} opts
   * @param {HTMLElement}  opts.successEl  — the success banner element
   * @param {string}       opts.modalId    — id of the modal overlay to close
   * @param {Function}     [opts.onReset]  — optional callback to reset the form
   * @param {{ id: number|null }} opts.timerRef — { id } object to store/clear the timer
   */
  function showFormSuccess({ successEl, modalId, onReset, timerRef }) {
    if (!successEl) {
      console.warn('[setupForm] success element not found for modal:', modalId);
      if (onReset) onReset();
      closeModal($('#' + modalId));
      return;
    }
    if (onReset) onReset();
    successEl.style.display = 'block';
    clearTimeout(timerRef.id);
    timerRef.id = setTimeout(() => {
      successEl.style.display = 'none';
      closeModal($('#' + modalId));
    }, 3000);
  }

  /**
   * Validate a single required field and toggle error class.
   * Returns true if valid.
   * @param {HTMLElement} el
   * @param {Function} [testFn] — custom test, defaults to non-empty
   */
  function validateField(el, testFn) {
    const valid = testFn ? testFn(el.value.trim()) : el.value.trim() !== '';
    el.classList.toggle('error', !valid);
    el.classList.toggle('valid', valid);
    return valid;
  }

  /** Close the mobile nav if it's open */
  function closeMobileNav() {
    if (navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Build and return a logo anchor element.
   * Single source of truth — called for both header and footer mounts.
   * @param {boolean} lightText — true for the footer (dark background)
   * @returns {HTMLAnchorElement}
   */
  function createLogo(lightText = false) {
    const a = document.createElement('a');
    a.href = '#hero';
    a.className = 'logo';
    if (!lightText) a.id = 'logo'; // never set id="" (invalid HTML)
    a.innerHTML = `
      <div class="logo-mark">
        <svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="14" stroke="#fff" stroke-width="3"/><path d="M14 20h12M20 14v12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>
      </div>
      <div class="logo-text">
        <div class="brand-name${lightText ? ' brand-name--light' : ''}">Mangalam</div>
        <div class="brand-sub">HDPE Pipes</div>
      </div>`;
    return a;
  }

  /* Inject logos into their mount points */
  const headerLogoMount = $('#logo-mount-header');
  const footerLogoMount = $('#logo-mount-footer');
  if (headerLogoMount) headerLogoMount.replaceWith(createLogo(false));
  if (footerLogoMount)  footerLogoMount.replaceWith(createLogo(true));

  /* ── 0. Inject Configuration Data ────────────────────────── */
  const phoneTop = $('#config-phone-top');
  const emailTop = $('#config-email-top');
  if (phoneTop) phoneTop.textContent = CONFIG.contact.phone;
  if (emailTop) emailTop.textContent = CONFIG.contact.email;

  const addrFooter = $('#config-address-footer');
  const phoneFooter = $('#config-phone-footer');
  const emailFooter = $('#config-email-footer');
  if (addrFooter) addrFooter.textContent = CONFIG.contact.address;
  if (phoneFooter) phoneFooter.textContent = CONFIG.contact.phone;
  if (emailFooter) emailFooter.textContent = CONFIG.contact.email;

  /* ===========================================================
     1. STICKY HEADER
     — Stays static initially
     — Becomes fixed once user scrolls past the hero section
     — Disappears immediately when scrolling back to the top
     =========================================================== */
  const header   = $('#site-header');
  const sentinel = $('#header-sentinel');
  const spacer   = $('#sticky-spacer');

  if (header && sentinel) {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        header.classList.add('is-sticky');
        spacer.style.height = header.offsetHeight + 'px';
        spacer.classList.add('active');
      } else {
        header.classList.remove('is-sticky');
        spacer.classList.remove('active');
        spacer.style.height = '0';
      }
    }, { threshold: 0 });
    io.observe(sentinel);
  }

  /* ===========================================================
     2. MOBILE NAV TOGGLE
     =========================================================== */
  const navToggle = $('#nav-toggle');
  const navLinks  = $('#nav-links');
  const prodDrop  = $('#products-dropdown');
  const dropBtn   = prodDrop ? $('.dropdown-toggle', prodDrop) : null;

  function setProductsDropdown(open) {
    if (!prodDrop || !dropBtn) return;
    prodDrop.classList.toggle('open', open);
    dropBtn.setAttribute('aria-expanded', String(open));
  }

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (dropBtn && prodDrop) {
    dropBtn.addEventListener('click', () => {
      setProductsDropdown(!prodDrop.classList.contains('open'));
    });
    prodDrop.addEventListener('focusin', () => setProductsDropdown(true));
    prodDrop.addEventListener('focusout', () => {
      window.requestAnimationFrame(() => {
        if (!prodDrop.contains(document.activeElement)) setProductsDropdown(false);
      });
    });
    document.addEventListener('click', (e) => {
      if (!prodDrop.contains(e.target)) setProductsDropdown(false);
    });
  }

  /* ===========================================================
     3. PRODUCT CAROUSEL
     — Main image, thumbnails driven from CONFIG.carouselImages
     — Arrow navigation, thumbnail click, keyboard support
     =========================================================== */
  const carouselImages = CONFIG.carouselImages;

  let currentSlide = 0;
  const mainImg      = $('#carousel-img');
  const zoomPanelImg = $('#zoom-panel-img');
  const thumbsWrap   = $('#carousel-thumbs');
  const prevBtn      = $('#carousel-prev');
  const nextBtn      = $('#carousel-next');

  /* ── Build thumbnails from the single carouselImages[] source of truth ── */
  carouselImages.forEach((image, i) => {
    const div = document.createElement('div');
    div.className = 'thumb' + (i === 0 ? ' active' : '');
    div.dataset.idx = i;
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', image.alt);
    div.innerHTML = `<img src="${image.src}" alt="${image.alt}" loading="${i === 0 ? 'eager' : 'lazy'}">`;
    div.addEventListener('click', () => goToSlide(i));
    div.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToSlide(i); } });
    thumbsWrap.appendChild(div);
  });

  /* Cached NodeList — stable after build, no need to re-query */
  const thumbs = $$('.thumb');

  function goToSlide(idx) {
    if (!mainImg) return;
    currentSlide = (idx + carouselImages.length) % carouselImages.length;
    const image = carouselImages[currentSlide];
    mainImg.src = image.src;
    mainImg.alt = image.alt;
    if (zoomPanelImg) zoomPanelImg.src = image.src;
    thumbs.forEach((t, i) => t.classList.toggle('active', i === currentSlide));
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));

  /* ===========================================================
     4. HOVER-ZOOM — Lens highlight + floating side panel
     — A rectangular lens highlights where the cursor is on
       the source image. A panel to the RIGHT shows the zoomed
       view of that highlighted area.
     =========================================================== */
  const carouselMain = $('#carousel-main');
  const zoomLens     = $('#zoom-lens');
  const zoomPanel    = $('#zoom-panel');

  /* Lens dimensions (px) */
  const LENS_W = 140;
  const LENS_H = 110;

  if (carouselMain && zoomLens && zoomPanel && zoomPanelImg) {

    /* Cache the rect on mouseenter — avoids getBoundingClientRect() on every frame */
    let cachedRect = null;
    let zoomRaf   = null;

    carouselMain.addEventListener('mouseenter', () => {
      cachedRect = carouselMain.getBoundingClientRect();
      carouselMain.classList.add('zooming');
    });

    carouselMain.addEventListener('mousemove', (e) => {
      if (zoomRaf) return; /* skip if a frame is already scheduled */
      zoomRaf = requestAnimationFrame(() => {
        zoomRaf = null;
        if (!cachedRect) return;
        const rect   = cachedRect;
        const panelW = zoomPanel.offsetWidth;
        const panelH = zoomPanel.offsetHeight;

        /* Cursor position relative to the image */
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        /* Clamp lens so it stays inside the image */
        let lx = cx - LENS_W / 2;
        let ly = cy - LENS_H / 2;
        lx = Math.max(0, Math.min(lx, rect.width  - LENS_W));
        ly = Math.max(0, Math.min(ly, rect.height - LENS_H));

        /* Position the lens rectangle */
        zoomLens.style.left   = lx + 'px';
        zoomLens.style.top    = ly + 'px';
        zoomLens.style.width  = LENS_W + 'px';
        zoomLens.style.height = LENS_H + 'px';

        /* Scale: how much bigger the panel is than the lens window */
        const scaleX = panelW / LENS_W;
        const scaleY = panelH / LENS_H;

        /* Position the zoomed image in the panel */
        zoomPanelImg.style.width  = (rect.width  * scaleX) + 'px';
        zoomPanelImg.style.height = (rect.height * scaleY) + 'px';
        zoomPanelImg.style.left   = (-lx * scaleX) + 'px';
        zoomPanelImg.style.top    = (-ly * scaleY) + 'px';
      });
    });

    carouselMain.addEventListener('mouseleave', () => {
      carouselMain.classList.remove('zooming');
      cachedRect = null;
      if (zoomRaf) { cancelAnimationFrame(zoomRaf); zoomRaf = null; }
    });
  }

  /* ===========================================================
     5. MODALS — Generic open/close + data-modal wiring
     =========================================================== */
  /* Open modal via data-modal attribute on any button */
  $$('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modal, btn));
  });

  /* Close buttons inside modals */
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
  });

  /* Close on backdrop click (not on the modal box itself) */
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  /* Global Escape key: close any open modal + dropdown */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.modal-overlay.open').forEach(closeModal);
      setProductsDropdown(false);
    }
  });

  /* ===========================================================
     5a. SCROLLSPY — highlight the active nav link as sections
         scroll into view using IntersectionObserver
     =========================================================== */
  const navAnchors = $$('.nav-links a[href^="#"]');
  const spySections = navAnchors
    .map(a => $(a.getAttribute('href')))
    .filter(Boolean);

  if (spySections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const activeId = '#' + entry.target.id;
        navAnchors.forEach(a => {
          const isActive = a.getAttribute('href') === activeId;
          a.classList.toggle('active', isActive);
          a.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
      });
    }, {
      rootMargin: '-40% 0px -55% 0px', /* triggers when section crosses mid-viewport */
      threshold: 0
    });
    spySections.forEach(s => spy.observe(s));
  }

  /* ===========================================================
     5a–5b. FORMS — Generic factory wires validation + success
     =========================================================== */

  /**
   * Wire up a modal form: validate on submit, show success, reset.
   * @param {Object} cfg
   * @param {string}           cfg.formId    — form element id
   * @param {string}           cfg.modalId   — overlay id to close on success
   * @param {Array<{el, test}>} cfg.fields   — fields to validate; test defaults to non-empty
   * @param {string}           [cfg.gateInputId] — optional: id of an input that enables the submit btn live
   */
  function setupForm({ formId, modalId, fields, gateInputId }) {
    const form = $('#' + formId);
    if (!form) return;
    const timerRef = { id: null };

    /* Optional: live enable/disable the submit button as the gate field changes */
    if (gateInputId) {
      const gateEl  = $('#' + gateInputId);
      const submitEl = form.querySelector('[type="submit"]');
      if (gateEl && submitEl) {
        submitEl.disabled = true;
        gateEl.addEventListener('input', () => {
          const val   = gateEl.value.trim();
          const valid = emailRe.test(val);
          submitEl.disabled = !valid;
          gateEl.classList.toggle('valid', valid);
          gateEl.classList.toggle('error', val !== '' && !valid);
          /* Show/hide inline error below the gate field */
          const errEl = $('#' + gateInputId + '-error');
          if (errEl) errEl.classList.toggle('visible', val !== '' && !valid);
        });
      }
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const allValid = fields.every(({ el, test, errId }) => {
        const ok = validateField(el, test);
        if (errId) $('#' + errId)?.classList.toggle('visible', !ok);
        return ok;
      });
      if (!allValid) return;

      showFormSuccess({
        successEl: $('#' + formId + '-success'),
        modalId,
        timerRef,
        onReset: () => {
          form.reset();
          fields.forEach(({ el }) => el.classList.remove('valid', 'error'));
          /* Re-disable the submit button if there's a gate field */
          if (gateInputId) {
            const submitEl = form.querySelector('[type="submit"]');
            if (submitEl) submitEl.disabled = true;
          }
        }
      });
    });
  }

  /* Catalogue form — gate: email must be valid before submit enables */
  setupForm({
    formId:      'catalogue-form',
    modalId:     'catalogue-modal',
    gateInputId: 'cat-email',
    fields: [
      { el: $('#cat-email'), test: v => emailRe.test(v), errId: 'cat-email-error' }
    ]
  });

  /* Quote form — name + email + phone all required */
  setupForm({
    formId:  'quote-form',
    modalId: 'quote-modal',
    fields: [
      { el: $('#q-name') },
      { el: $('#q-email'), test: v => emailRe.test(v), errId: 'q-email-error' },
      { el: $('#q-phone') }
    ]
  });

  /* Blur validation on all required quote form fields so it matches catalogue form UX */
  const quoteFields = [
    { el: $('#q-name'), test: v => v !== '', errId: null },
    { el: $('#q-email'), test: v => emailRe.test(v), errId: 'q-email-error' },
    { el: $('#q-phone'), test: v => v !== '', errId: null }
  ];

  quoteFields.forEach(({ el, test, errId }) => {
    if (!el) return;
    const errEl = errId ? $('#' + errId) : null;
    
    el.addEventListener('blur', () => {
      const val = el.value.trim();
      if (!val) return; // don't flag empty on blur, only on submit
      const ok = test(val);
      el.classList.toggle('valid', ok);
      el.classList.toggle('error', !ok);
      if (errEl) errEl.classList.toggle('visible', !ok);
    });

    el.addEventListener('input', () => {
      /* Clear error state while they're actively correcting */
      if (el.classList.contains('error') && test(el.value.trim())) {
        el.classList.remove('error');
        el.classList.add('valid');
        if (errEl) errEl.classList.remove('visible');
      }
    });
  });

  /* ===========================================================
     6. MANUFACTURING PROCESS TABS (with ARIA + keyboard nav)
     =========================================================== */
  const tabBtns   = $$('.tab-btn');
  const tabPanels = $$('.process-panel');

  function activateTab(btn) {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('tabindex', '-1');
    });
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    btn.setAttribute('tabindex', '0');
    btn.focus();
    const panel = $('#' + target);
    if (panel) panel.classList.add('active');
  }

  tabBtns.forEach(btn => btn.addEventListener('click', () => activateTab(btn)));

  /* Arrow key navigation for tabs */
  const tablist = $('#process-tabs');
  if (tablist) {
    tablist.addEventListener('keydown', (e) => {
      const idx = tabBtns.indexOf(document.activeElement);
      if (idx < 0) return;
      let next;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        next = tabBtns[(idx + 1) % tabBtns.length];
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        next = tabBtns[(idx - 1 + tabBtns.length) % tabBtns.length];
      } else if (e.key === 'Home') {
        e.preventDefault();
        next = tabBtns[0];
      } else if (e.key === 'End') {
        e.preventDefault();
        next = tabBtns[tabBtns.length - 1];
      }
      if (next) activateTab(next);
    });
  }

  /* Set initial tabindex on non-active tabs */
  tabBtns.forEach(btn => {
    if (!btn.classList.contains('active')) btn.setAttribute('tabindex', '-1');
  });

  /* ===========================================================
     7. FAQ ACCORDION (with ARIA)
     =========================================================== */
  function closeAllFaq() {
    $$('.faq-item').forEach(i => {
      i.classList.remove('open');
      const q = i.querySelector('.faq-question');
      if (q) q.setAttribute('aria-expanded', 'false');
    });
  }

  $$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item    = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      closeAllFaq();
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ===========================================================
     8. SCROLL-TO-TOP BUTTON
     =========================================================== */
  const scrollBtn = $('#scroll-top');
  /* Honour user's motion preference for all programmatic scrolling */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      const isVisible = window.scrollY > 600;
      scrollBtn.classList.toggle('visible', isVisible);
      scrollBtn.setAttribute('tabindex', isVisible ? '0' : '-1');
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ===========================================================
     9. SMOOTH SCROLL FOR ANCHOR LINKS
     =========================================================== */
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') { e.preventDefault(); return; }
      const el = $(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        setProductsDropdown(false);
        closeMobileNav();
      }
    });
  });

})();
