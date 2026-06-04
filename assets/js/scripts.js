// XPDevs Common Scripts
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav-backdrop';
    document.body.appendChild(backdrop);
    function closeNav() {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('open');
      backdrop.classList.remove('open');
    }
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
      backdrop.classList.toggle('open');
    });
    backdrop.addEventListener('click', closeNav);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeNav();
    });
  }
}
document.addEventListener('DOMContentLoaded', initHamburger);
