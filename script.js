/* ============================================================
   Unentdecktes Tokio – main script
   ============================================================ */

(function () {
  'use strict';

  // ── Theme toggle ──────────────────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme  = localStorage.getItem('ut-theme') || 'light';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ut-theme', theme);
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  applyTheme(savedTheme);

  // ── Language toggle ──────────────────────────────────────────
  let currentLang = 'de';

  const langButtons = document.querySelectorAll('.lang-btn');
  const i18nNodes   = document.querySelectorAll('[data-de], [data-en]');

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;

    langButtons.forEach(btn =>
      btn.classList.toggle('active', btn.dataset.lang === lang)
    );

    i18nNodes.forEach(el => {
      const text = el.dataset[lang];
      if (!text) return;

      if (el.tagName === 'OPTION') {
        el.textContent = text;
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    });

    document.querySelectorAll('.i18n-de, .i18n-en').forEach(el => {
      el.hidden = !el.classList.contains('i18n-' + lang);
    });

    // Force select elements to re-render their displayed value after option text updates
    document.querySelectorAll('select').forEach(sel => {
      const v = sel.value;
      sel.value = '';
      sel.value = v;
    });

    document.querySelectorAll('.i18n-placeholder').forEach(el => {
      const ph = el.dataset['placeholder' + lang.charAt(0).toUpperCase() + lang.slice(1)];
      if (ph) el.placeholder = ph;
    });
  }

  langButtons.forEach(btn =>
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang))
  );

  // ── Sticky header ─────────────────────────────────────────────
  const header = document.getElementById('header');

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 24);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // ── Mobile hamburger ─────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-label', isOpen
      ? (currentLang === 'de' ? 'Menü schließen' : 'Close menu')
      : (currentLang === 'de' ? 'Menü öffnen'   : 'Open menu')
    );
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', e => {
    if (!header.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  // ── Smooth scroll for anchor links ───────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = 80; // nav height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── Intersection Observer — fade-in cards ────────────────────
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ── Contact form ─────────────────────────────────────────────
  const form      = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Basic validation feedback
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = '#c0392b';
        valid = false;
        field.addEventListener('input', () => {
          field.style.borderColor = '';
        }, { once: true });
      }
    });
    if (!valid) return;

    // Success state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = currentLang === 'de'
      ? '✓ Nachricht gesendet!'
      : '✓ Message sent!';
    submitBtn.style.background = 'var(--forest-light)';
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.textContent = currentLang === 'de'
        ? 'Nachricht senden'
        : 'Send Message';
      submitBtn.style.background = '';
      submitBtn.disabled = false;
      form.reset();
    }, 3500);
  });

})();
