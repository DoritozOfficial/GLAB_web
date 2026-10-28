(() => {
  const pages = new Set(['home', 'socials', 'maps']);
  function showPage() {
    const requested = location.hash.slice(1).toLowerCase();
    const current = pages.has(requested) ? requested : 'home';
    document.querySelectorAll('.page').forEach(page => { page.hidden = page.id !== current; });
    document.querySelectorAll('[data-page]').forEach(link => {
      if (link.dataset.page === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.title = current === 'home' ? "Gorilla's Lab" : `${current === 'socials' ? 'Socials' : 'Maps'} | Gorilla's Lab`;
  }
  window.addEventListener('hashchange', showPage);
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    if (link.classList.contains('skip-link')) return;
    link.addEventListener('click', () => {
      requestAnimationFrame(() => document.getElementById('page-content').focus({preventScroll:true}));
    });
  });
  showPage();
})();
