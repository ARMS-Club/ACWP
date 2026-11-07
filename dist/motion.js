(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealed = new WeakSet();
  let observer;
  const isMoving = () => !reduced.matches;

  function finishEntrance(element) {
    element.classList.remove('motion-enter', 'panel-enter');
  }

  function reveal(element) {
    if (revealed.has(element)) return;
    revealed.add(element);
    if (isMoving()) element.classList.add('motion-enter');
  }

  function watch(elements) {
    elements.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 75}ms`);
      if (revealed.has(element)) return;
      if (!observer || !isMoving() || element.getBoundingClientRect().bottom < 88) {
        revealed.add(element);
      } else {
        observer.observe(element);
      }
    });
  }

  function updatePreference() {
    root.classList.toggle('motion-enabled', !reduced.matches);
    if (!isMoving()) document.querySelectorAll('.motion-enter,.panel-enter').forEach(finishEntrance);
  }

  updatePreference();
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  }
  watch(document.querySelectorAll('.section-top,.about-grid h2,.about-copy,.mission-line,.section-intro h2,.section-intro>p,.filters,.project-card,.own-idea,.path-tabs,.step-panel,.future-grid article,.faq-heading,.faq-list,.join-copy,.join-panel'));
  document.addEventListener('animationend', event => {
    if (event.animationName === 'soft-rise' || event.animationName === 'panel-rise') finishEntrance(event.target);
  });
  document.addEventListener('focusin', event => {
    // Keyboard focus never lands on content still waiting for a visual entrance.
    const element = event.target.closest('.motion-enter,.panel-enter');
    if (element) finishEntrance(element);
  });
  reduced.addEventListener('change', updatePreference);

  // Filters and tabs reuse their existing behavior, with motion applied to new content.
  const grid = document.querySelector('#project-grid');
  const stepPanel = document.querySelector('#step-panel');
  const updates = new MutationObserver(records => {
    records.forEach(record => {
      if (record.target === grid) watch(grid.querySelectorAll('.project-card'));
      if (record.target === stepPanel && isMoving()) {
        finishEntrance(stepPanel);
        stepPanel.getBoundingClientRect();
        stepPanel.classList.add('panel-enter');
      }
    });
  });
  updates.observe(grid, { childList: true });
  updates.observe(stepPanel, { childList: true });

  const strip = document.querySelector('.discipline-strip');
  if ('IntersectionObserver' in window) {
    const tickerVisibility = new IntersectionObserver(entries => {
      strip.classList.toggle('ticker-away', !entries[0].isIntersecting);
    });
    tickerVisibility.observe(strip);
    document.addEventListener('visibilitychange', () => root.classList.toggle('page-away', document.hidden));
  }
})();
