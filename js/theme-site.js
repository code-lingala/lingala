// Lingala — site-wide colour theme (blue / red). Green + yellow retired.
//
// The page's dominant field changes per theme; text/“ink” tokens flip with it
// so copy stays readable (yellow is a light field with dark ink). Choice is
// remembered and shared across every page. To avoid a flash of the wrong
// theme, set data-theme inline in <head> before paint, then this wires the
// switcher.

(function () {
  const KEY = 'lingala.theme';
  const THEMES = ['blue', 'red'];

  function current() {
    const t = localStorage.getItem(KEY);
    return THEMES.includes(t) ? t : 'blue';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-btn]').forEach((b) => {
      const on = b.getAttribute('data-theme-btn') === theme;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('active', on);
    });
  }

  function set(theme) {
    if (!THEMES.includes(theme)) return;
    localStorage.setItem(KEY, theme);
    apply(theme);
  }

  function init() {
    apply(current());
    document.querySelectorAll('[data-theme-btn]').forEach((b) => {
      b.addEventListener('click', () => set(b.getAttribute('data-theme-btn')));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.LingalaTheme = { set, current };
})();
