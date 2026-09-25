// XPDevs Common Scripts
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.setAttribute('aria-expanded', 'false');
    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav-backdrop';
    document.body.appendChild(backdrop);
    function setNavState(open) {
      hamburger.classList.toggle('active', open);
      mobileNav.classList.toggle('open', open);
      backdrop.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    }
    function closeNav() {
      setNavState(false);
    }
    hamburger.addEventListener('click', () => {
      setNavState(!mobileNav.classList.contains('open'));
    });
    backdrop.addEventListener('click', closeNav);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeNav();
    });
  }
}
document.addEventListener('DOMContentLoaded', initHamburger);
