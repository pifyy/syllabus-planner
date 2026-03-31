//JS elements for the pages
const _fadeObserver = new IntersectionObserver((entries) => {
entries.forEach(entry => {
    if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    _fadeObserver.unobserve(entry.target);
    }
});
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => _fadeObserver.observe(el));
