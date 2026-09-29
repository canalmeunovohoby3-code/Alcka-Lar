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

  /* --------------------------------------------------- 02 · entrada do hero */
  function startHero() {
    document.documentElement.classList.add('is-ready');
  }

  if (document.readyState === 'complete') {
    window.requestAnimationFrame(startHero);
  } else {
    window.addEventListener('load', function () {
      window.requestAnimationFrame(startHero);
    }, { once: true });
    window.setTimeout(function () {
      if (!document.documentElement.classList.contains('is-ready')) { startHero(); }
    }, 2400);
  }

  /* --------------------------------------------------------- 02 · header fixo */
  var header = $('#siteHeader');
  function headerState() {
    if (!header) { return; }
    header.classList.toggle('is-scrolled', window.scrollY > 44);
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
  var revealsLeft = [];

  /* leitura primeiro, escrita depois — evita refluxo a cada frame */
  function revealPassed() {
    if (!revealsLeft.length) { return; }
    var limit = window.innerHeight * 0.92;
    var done = [];
    var rest = [];
    for (var i = 0; i < revealsLeft.length; i++) {
      if (revealsLeft[i].getBoundingClientRect().bottom < limit) {
        done.push(revealsLeft[i]);
      } else {
        rest.push(revealsLeft[i]);
      }
    }
    for (var j = 0; j < done.length; j++) { done[j].classList.add('is-in'); }
    revealsLeft = rest;
  }

  if ('IntersectionObserver' in window && !reduce) {
    /* threshold 0: elementos com clip-path tem area de interseccao zerada,
       mas ainda assim entram e precisam receber o estado final */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    revealsLeft = reveals.slice();
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* --------------------------------------------------------- 05 · processo */
  var stepsEl = $('#steps');
  var stepsFill = $('#stepsFill');
  var stepsCurrent = $('#stepsCurrent');
  var stepItems = $$('.step');

  var CYCLE = 10000;      /* duração total do ciclo, em ms */
  var FILL_PART = 0.82;   /* fração do ciclo usada para preencher a linha */

  var stepsRunning = false;
  var cycleStart = 0;
  var lastStep = -1;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function paintSteps(pos) {
    /* pos vai de 0 a 1 e volta: preenche, rebobina e recomeça sem corte */
    var seed;
    if (pos < FILL_PART) {
      seed = pos / FILL_PART;
    } else {
      seed = 1 - (pos - FILL_PART) / (1 - FILL_PART);
    }

    if (stepsFill) { stepsFill.style.setProperty('--fill', seed.toFixed(4)); }

    var active = Math.min(stepItems.length - 1, Math.floor(seed * stepItems.length));
    if (active !== lastStep) {
      stepItems.forEach(function (item, i) {
        item.classList.toggle('is-done', i < active);
        item.classList.toggle('is-active', i === active);
      });
      if (stepsCurrent) { stepsCurrent.textContent = pad(active + 1); }
      lastStep = active;
    }
  }

  function stepsLoop(now) {
    if (!stepsRunning) { return; }
    if (!cycleStart) { cycleStart = now; }
    paintSteps(((now - cycleStart) % CYCLE) / CYCLE);
    window.requestAnimationFrame(stepsLoop);
  }

  function startSteps() {
    if (stepsRunning) { return; }
    stepsRunning = true;
    cycleStart = 0;
    lastStep = -1;
    window.requestAnimationFrame(stepsLoop);
  }

  /* O ciclo roda sempre, sem depender de observer ou de scroll.
     O navegador ja pausa o requestAnimationFrame quando a aba fica oculta. */
  if (stepsEl && stepItems.length) {
    startSteps();
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

  /* o botão inverte as cores sobre a seção azul, mantendo o contraste */
  var waZone = $('.highlight');
  if (wa && waZone && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        wa.classList.toggle('wa-float--invert', entry.isIntersecting);
      });
    }, { rootMargin: '-76% 0px 0px -76%' }).observe(waZone);
  }

  /* ------------------------------------------------ 09 · atualização por scroll */
  var ticking = false;
  var heroBg = $('.hero__bg');

  /* parallax muito sutil da fotografia do hero */
  function parallaxHero() {
    if (!heroBg || reduce) { return; }
    var y = window.scrollY;
    if (y > window.innerHeight * 1.15) { return; }
    heroBg.style.transform = 'translate3d(0,' + (y * 0.13).toFixed(2) + 'px,0)';
  }

  function onScroll() {
    headerState();
    progressState();
    navState();
    floatState();
    parallaxHero();
    revealPassed();
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
