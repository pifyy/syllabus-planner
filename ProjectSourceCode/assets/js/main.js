
(function () {
  const mq = window.matchMedia('(prefers-color-scheme: light)');

  function applyTheme(isLight) {
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
  }

  // Apply immediately (before first paint to avoid flash)
  applyTheme(mq.matches);

  // Update whenever the OS preference changes
  mq.addEventListener('change', e => applyTheme(e.matches));
})();

const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

const _fadeObserver = new IntersectionObserver((entries) => {
entries.forEach(entry => {
    if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    _fadeObserver.unobserve(entry.target);
    }
});
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => _fadeObserver.observe(el));
