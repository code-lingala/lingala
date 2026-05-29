(function () {
  const btn = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.nav-right');
  if (!btn || !drawer) return;

  const setOpen = (on) => {
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    drawer.classList.toggle('open', on);
    document.body.style.overflow = on ? 'hidden' : '';
  };

  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  drawer.addEventListener('click', (e) => { if (e.target.tagName === 'A') setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  // Mark active link
  const here = location.pathname.replace(/\/$/, '') || '/';
  drawer.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    if (href === here) a.classList.add('active');
  });
})();
