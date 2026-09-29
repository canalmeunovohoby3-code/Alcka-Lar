/* =========================================================================
   ALCKA-LAR — comportamento de interface
   Sem dependências. Progressivo: se este arquivo não carregar, a página
   continua legível e navegável (a classe .js é removida em 3 s).
   ========================================================================= */
(function () {
  'use strict';

  document.documentElement.setAttribute('data-ready', '');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ------------------------------------------------------- 01 · ano do rodapé */
  var year = $('#year');
  if (year) { year.textContent = String(new Date().getFullYear()); }

  /* --------------------------------------------------------- 02 · header fixo */
  var header = $('#siteHeader');
  function headerState() {
    if (!header) { return; }
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }

  /* ------------------------------------------------ 03 · progresso de leitura */
  var bar = $('#progressBar');
  function progressState() {
    if (!bar) { return; }
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }

  /* ------------------------------------------------- 04 · reveal sob scroll */
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* --------------------------------------------------------- 05 · processo */
  var stepsEl = $('#steps');
  var stepsFill = $('#stepsFill');
  var stepItems = $$('.step');

  function stepsState() {
    if (!stepsEl || !stepItems.length) { return; }
    var r = stepsEl.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh - r.top) / (vh + r.height * 0.8);
    p = clamp(p, 0, 1);

    if (stepsFill) { stepsFill.style.setProperty('--fill', p.toFixed(4)); }

    var active = Math.min(stepItems.length - 1, Math.floor(p * stepItems.length));
    stepItems.forEach(function (item, i) {
      item.classList.toggle('is-active', i <= active);
    });
  }

  /* ------------------------------------------------------ 06 · seção corrente */
  var navRoot = $('.nav__list');
  var navLinks = navRoot ? $$('a[data-nav]', navRoot) : [];
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      return id && id.charAt(0) === '#' ? document.getElementById(id.slice(1)) : null;
    })
    .filter(Boolean)
    .sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });

  function navState() {
    if (!sections.length) { return; }
    var marker = window.innerHeight * 0.32;
    var current = sections[0];
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= marker) { current = section; }
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + current.id);
    });
  }

  /* -------------------------------------------------- 07 · menu em telas pequenas */
  var burger = $('#burger');
  var overlay = $('#navOverlay');
  var lastFocus = null;

  function openMenu() {
    if (!overlay || !burger) { return; }
    lastFocus = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fechar menu');
    document.body.style.overflow = 'hidden';
    var first = $('a', overlay);
    if (first) { first.focus({ preventScroll: true }); }
  }

  function closeMenu() {
    if (!overlay || !burger) { return; }
    overlay.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
    window.setTimeout(function () { overlay.hidden = true; }, 360);
    if (lastFocus && lastFocus.focus) { lastFocus.focus({ preventScroll: true }); }
  }

  if (burger && overlay) {
    burger.addEventListener('click', function () {
      if (burger.getAttribute('aria-expanded') === 'true') { closeMenu(); } else { openMenu(); }
    });
    overlay.addEventListener('click', function (e) {
      if (e.target.closest('a')) { closeMenu(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { closeMenu(); }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && burger.getAttribute('aria-expanded') === 'true') { closeMenu(); }
    });
  }

  /* --------------------------------------------------- 08 · botão flutuante */
  var wa = $('.wa-float');
  function floatState() {
    if (!wa) { return; }
    wa.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.55);
  }

  /* ------------------------------------------------ 09 · atualização por scroll */
  var ticking = false;

  function onScroll() {
    headerState();
    progressState();
    stepsState();
    navState();
    floatState();
  }

  window.addEventListener('scroll', function () {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });

  window.addEventListener('resize', function () { onScroll(); }, { passive: true });

  /* ---------------------------------------------------- 10 · âncoras suaves */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') { return; }
      var target = document.getElementById(id.slice(1));
      if (!target) { return; }
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight + 10 : 0);
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      if (history.replaceState) { history.replaceState(null, '', id); }
    });
  });

  /* ------------------------------------------------------- 11 · inicialização */
  onScroll();
})();
