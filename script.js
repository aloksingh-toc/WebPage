/* ============================================================
   MANGALAM HDPE PIPES — script.js
   All interactive behaviours: sticky header, carousel,
   hover-zoom, modals, tabs, accordion, scroll-to-top
   ============================================================ */

(function () {
  'use strict';

  /* ── Utility ─────────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

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
        /* User has scrolled past the top → make header sticky */
        header.classList.add('is-sticky');
        spacer.style.height = header.offsetHeight + 'px';
        spacer.classList.add('active');
      } else {
        /* User is back at the top → remove sticky */
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
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
  }
  if (dropBtn && prodDrop) {
    dropBtn.addEventListener('click', () => {
      setProductsDropdown(!prodDrop.classList.contains('open'));
    });

    prodDrop.addEventListener('focusin', () => {
      setProductsDropdown(true);
    });

    prodDrop.addEventListener('focusout', () => {
      window.requestAnimationFrame(() => {
        if (!prodDrop.contains(document.activeElement)) {
          setProductsDropdown(false);
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!prodDrop.contains(e.target)) {
        setProductsDropdown(false);
      }
    });
  }

  /* ===========================================================
     3. PRODUCT CAROUSEL
     — Main image, 6 thumbnails
     — Arrow navigation, thumbnail click
     =========================================================== */
  const carouselImages = [
    { src: 'product_pipes.png', alt: 'HDPE Pipes' },
    { src: 'product_coils.png', alt: 'HDPE Coils' },
    { src: 'pipe_installation.png', alt: 'Pipe installation' },
    { src: 'manufacturing_process.png', alt: 'Manufacturing process' },
    { src: 'pipe_testing.png', alt: 'Pipe testing' },
    { src: 'hero_engineer.png', alt: 'Factory engineer' }
  ];

  let currentSlide = 0;
  const mainImg   = $('#carousel-img');
  const zoomImg   = $('#zoom-img');
  const thumbs    = $$('.thumb');
  const prevBtn   = $('#carousel-prev');
  const nextBtn   = $('#carousel-next');

  function goToSlide(idx) {
    currentSlide = (idx + carouselImages.length) % carouselImages.length;
    const image = carouselImages[currentSlide];
    mainImg.src = image.src;
    mainImg.alt = image.alt;
    zoomImg.src = image.src;
    zoomImg.alt = image.alt;
    thumbs.forEach((t, i) => t.classList.toggle('active', i === currentSlide));
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
  thumbs.forEach(t => {
    t.addEventListener('click', () => goToSlide(Number(t.dataset.idx)));
  });

  /* ===========================================================
     4. HOVER-ZOOM on Carousel Main Image
     — Moving mouse over the main image shows a zoomed-in view
     =========================================================== */
  const carouselMain = $('#carousel-main');
  const zoomPreview  = $('#zoom-preview');

  if (carouselMain && zoomPreview && zoomImg) {
    carouselMain.addEventListener('mousemove', (e) => {
      const rect = carouselMain.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;   // 0..1
      const y = (e.clientY - rect.top)  / rect.height;   // 0..1
      /* Shift the 200% image so the cursor area is centred */
      zoomImg.style.left = -(x * rect.width)  + 'px';
      zoomImg.style.top  = -(y * rect.height) + 'px';
    });

    carouselMain.addEventListener('mouseleave', () => {
      zoomPreview.style.display = '';  // CSS handles hide on no-hover
    });
  }

  /* ===========================================================
     5. MODALS — Catalogue & Quote
     =========================================================== */
  /* Open modal via data-modal attribute */
  $$('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modal;
      const overlay = $('#' + id);
      if (overlay) {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  /* Close buttons */
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* Close on overlay click (not box) */
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });

  /* Close on Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      $$('.modal-overlay.open').forEach(m => {
        m.classList.remove('open');
        document.body.style.overflow = '';
      });
      setProductsDropdown(false);
    }
  });

  /* ── Catalogue form: email validation → enable button ──── */
  const catEmail  = $('#cat-email');
  const catSubmit = $('#cat-submit');
  const catError  = $('#cat-email-error');
  const emailRe   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (catEmail && catSubmit) {
    catEmail.addEventListener('input', () => {
      const valid = emailRe.test(catEmail.value.trim());
      catSubmit.disabled = !valid;
      catEmail.classList.toggle('valid', valid);
      catEmail.classList.toggle('error', catEmail.value.trim() !== '' && !valid);
      if (catError) catError.classList.toggle('visible', catEmail.value.trim() !== '' && !valid);
    });
  }

  /* Catalogue form submit */
  const catForm = $('#catalogue-form');
  if (catForm) {
    catForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (emailRe.test(catEmail.value.trim())) {
        alert('Thank you! Your datasheet download link has been sent to ' + catEmail.value.trim());
        catForm.reset();
        catSubmit.disabled = true;
        catEmail.classList.remove('valid');
        $('#catalogue-modal').classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* Quote form submit */
  const quoteForm = $('#quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name  = $('#q-name').value.trim();
      const email = $('#q-email').value.trim();
      const phone = $('#q-phone').value.trim();
      const emailErr = $('#q-email-error');

      let valid = true;
      if (!name)  { valid = false; $('#q-name').classList.add('error'); }
      else        { $('#q-name').classList.remove('error'); }

      if (!emailRe.test(email)) {
        valid = false;
        $('#q-email').classList.add('error');
        if (emailErr) emailErr.classList.add('visible');
      } else {
        $('#q-email').classList.remove('error');
        if (emailErr) emailErr.classList.remove('visible');
      }

      if (!phone) { valid = false; $('#q-phone').classList.add('error'); }
      else        { $('#q-phone').classList.remove('error'); }

      if (valid) {
        alert('Thank you, ' + name + '! Our team will contact you shortly at ' + email + '.');
        quoteForm.reset();
        $$('.field-input', quoteForm).forEach(f => f.classList.remove('valid', 'error'));
        $('#quote-modal').classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ===========================================================
     6. MANUFACTURING PROCESS TABS
     =========================================================== */
  const tabBtns  = $$('.tab-btn');
  const tabPanels = $$('.process-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $('#' + target);
      if (panel) panel.classList.add('active');
    });
  });

  /* ===========================================================
     7. FAQ ACCORDION
     =========================================================== */
  $$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      /* Close all others */
      $$('.faq-item').forEach(i => i.classList.remove('open'));
      /* Toggle this one */
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ===========================================================
     8. SCROLL-TO-TOP BUTTON
     =========================================================== */
  const scrollBtn = $('#scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ===========================================================
     9. SMOOTH SCROLL FOR ANCHOR LINKS
     =========================================================== */
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') {
        e.preventDefault();
        return;
      }
      const el = $(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setProductsDropdown(false);
        /* Close mobile nav if open */
        if (navLinks && navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          navToggle.classList.remove('open');
        }
      }
    });
  });

})();
