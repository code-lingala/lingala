// PWA install prompt — replaces the .site-cta ("Open today's card") with an
// "Install app" button when the browser fires beforeinstallprompt. Falls back
// to the original CTA when not installable, already installed, or dismissed.
// Dismissal persists in localStorage as 'lingala.installDismissed'.
(function () {
  const KEY_DISMISSED = 'lingala.installDismissed';
  const cta = document.querySelector('.site-cta');
  if (!cta) return;

  // Already running as the installed PWA — leave the CTA alone.
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                     window.navigator.standalone === true;
  if (standalone) return;

  try { if (localStorage.getItem(KEY_DISMISSED) === '1') return; } catch (e) {}

  // Localized label — read site language; default EN.
  let lang = 'en';
  try {
    const saved = localStorage.getItem('lingala.sitelang');
    const url = new URL(window.location.href);
    lang = url.searchParams.get('lang') || saved || 'en';
    if (lang !== 'fr' && lang !== 'ln') lang = 'en';
  } catch (e) {}
  const LABEL = { en: 'Install app', fr: 'Installer l’app', ln: 'Tia app' };

  let deferred = null;
  const originalHref = cta.getAttribute('href');
  const originalI18nKey = cta.getAttribute('data-i18n');
  const originalText = cta.textContent;

  function showInstall() {
    // Remove data-i18n so the i18n re-render does not overwrite the label.
    if (originalI18nKey) cta.removeAttribute('data-i18n');
    cta.textContent = LABEL[lang] || LABEL.en;
    cta.removeAttribute('href');
    cta.style.cursor = 'pointer';
    cta.setAttribute('role', 'button');
    cta.setAttribute('aria-label', 'Install Losako as an app');
  }

  function restoreCta() {
    if (originalI18nKey) cta.setAttribute('data-i18n', originalI18nKey);
    cta.textContent = originalText;
    if (originalHref) cta.setAttribute('href', originalHref);
    cta.style.cursor = '';
    cta.removeAttribute('role');
    cta.removeAttribute('aria-label');
  }

  cta.addEventListener('click', async function (e) {
    if (!deferred) return;     // no prompt available → behave as normal link
    e.preventDefault();
    try {
      deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice && choice.outcome !== 'accepted') {
        try { localStorage.setItem(KEY_DISMISSED, '1'); } catch (e) {}
      }
    } catch (err) { /* ignore */ }
    deferred = null;
    restoreCta();
  });

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    showInstall();
  });

  window.addEventListener('appinstalled', function () {
    try { localStorage.setItem(KEY_DISMISSED, '1'); } catch (e) {}
    restoreCta();
    deferred = null;
  });
})();
