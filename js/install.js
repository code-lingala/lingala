// PWA install — a floating button (like back-to-top) in the bottom-right.
// The original .site-cta ("Open today's card") is left untouched. The button
// is created in JS and injected on every page. Click behavior:
//   - If beforeinstallprompt was captured → trigger the native install prompt.
//   - Otherwise → show an OS-appropriate popover (iOS: Share → Add to Home
//     Screen; desktop: browser menu → Install).
// The button is hidden when:
//   - already running as the installed PWA (standalone mode);
//   - the user dismissed it previously (saved as lingala.installDismissed).
// A small × on the button lets the user dismiss it without installing.

// Service worker registration. Chrome's install criteria require a SW with a
// fetch handler; without registration, beforeinstallprompt never fires.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
  });
}

(function () {
  const KEY_DISMISSED = 'lingala.installDismissed';

  // Already installed → don't show the button.
  const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                     window.navigator.standalone === true;
  if (standalone) return;

  try { if (localStorage.getItem(KEY_DISMISSED) === '1') return; } catch (e) {}

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);

  // Language (matches install-button label and the popover copy).
  let lang = 'en';
  try {
    const saved = localStorage.getItem('lingala.sitelang');
    const url = new URL(window.location.href);
    lang = url.searchParams.get('lang') || saved || 'en';
    if (lang !== 'fr' && lang !== 'ln') lang = 'en';
  } catch (e) {}
  const T = {
    en: {
      btn: 'Install',
      ariaInstall: 'Install Lingala as an app',
      ariaDismiss: 'Dismiss install prompt',
      iosTitle: 'Install on iPhone',
      iosBody: 'Tap the Share button below, then choose "Add to Home Screen".',
      desktopTitle: 'Install in your browser',
      desktopBody: 'Open your browser menu and choose "Install Lingala" (or look for an install icon in the address bar).',
      androidTitle: 'Install on Android',
      androidBody: 'Open the browser menu and choose "Install app" or "Add to Home screen".',
      close: 'Got it',
    },
    fr: {
      btn: 'Installer',
      ariaInstall: 'Installer Lingala comme application',
      ariaDismiss: 'Fermer l’invite d’installation',
      iosTitle: 'Installer sur iPhone',
      iosBody: 'Appuie sur le bouton Partager en bas, puis choisis « Sur l’écran d’accueil ».',
      desktopTitle: 'Installer dans le navigateur',
      desktopBody: 'Ouvre le menu du navigateur et choisis « Installer Lingala ».',
      androidTitle: 'Installer sur Android',
      androidBody: 'Ouvre le menu du navigateur et choisis « Installer l’application ».',
      close: 'OK',
    },
    ln: {
      btn: 'Tia',
      ariaInstall: 'Tia Lingala lokola app',
      ariaDismiss: 'Kanga liloba ya kotia',
      iosTitle: 'Tia na iPhone',
      iosBody: 'Finá bouton ya Partager na nse, sima poná « Add to Home Screen ».',
      desktopTitle: 'Tia na navigateur',
      desktopBody: 'Fungola menu ya navigateur, poná « Install Lingala ».',
      androidTitle: 'Tia na Android',
      androidBody: 'Fungola menu ya navigateur, poná « Install app ».',
      close: 'Malamu',
    },
  };
  const t = T[lang] || T.en;

  // —— Build the floating button —— //
  function buildButton() {
    if (document.getElementById('install-fab-wrap')) return;

    // Wrapper so the × can sit at the corner, overlapping outside the card.
    const wrap = document.createElement('div');
    wrap.id = 'install-fab-wrap';
    wrap.style.cssText = [
      'position:fixed',
      'bottom:calc(84px + env(safe-area-inset-bottom))',
      'right:18px',
      'z-index:250',
      'width:104px',
    ].join(';');

    // The square card itself.
    const btn = document.createElement('button');
    btn.id = 'install-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label', t.ariaInstall);
    btn.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:flex-start',
      'gap:10px',
      'width:104px',
      'padding:12px 12px 14px',
      'background:#C8202A',          // brand red — change to #1F5B33 for forest green
      'color:#fff',
      'border:0',
      'border-radius:18px',
      'font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'font-size:13px',
      'font-weight:800',
      'letter-spacing:0.08em',
      'text-transform:uppercase',
      'box-shadow:0 10px 28px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.16)',
      'cursor:pointer',
      'transition:transform .15s ease, box-shadow .15s ease',
    ].join(';');
    // White inset holding the mascot logo, then the label below.
    btn.innerHTML =
      '<span style="display:flex;align-items:center;justify-content:center;width:72px;height:72px;background:#fff;border-radius:14px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.04);">' +
        '<img src="/android-icon-192x192.png" alt="" width="64" height="64" style="display:block;width:64px;height:64px;">' +
      '</span>' +
      '<span style="line-height:1.1">' + t.btn + '</span>';

    btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 14px 36px rgba(0,0,0,0.36), 0 4px 10px rgba(0,0,0,0.20)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; btn.style.boxShadow = '0 10px 28px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.16)'; });
    btn.addEventListener('click', onMainClick);

    // Dismiss × — black circle, sits at the top-right corner, overlapping out.
    const x = document.createElement('button');
    x.type = 'button';
    x.id = 'install-fab-x';
    x.setAttribute('aria-label', t.ariaDismiss);
    x.textContent = '×';
    x.style.cssText = [
      'position:absolute',
      'top:-8px', 'right:-8px',
      'width:26px', 'height:26px',
      'border-radius:50%',
      'background:#0E0E12',
      'color:#fff',
      'border:2px solid #fff',
      'font-size:16px',
      'line-height:1',
      'font-family:inherit',
      'cursor:pointer',
      'padding:0',
      'display:inline-flex',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 2px 6px rgba(0,0,0,0.25)',
    ].join(';');
    x.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });

    wrap.appendChild(btn);
    wrap.appendChild(x);
    document.body.appendChild(wrap);
  }

  function removeButton() {
    const wrap = document.getElementById('install-fab-wrap');
    if (wrap) wrap.remove();
  }

  function dismiss() {
    try { localStorage.setItem(KEY_DISMISSED, '1'); } catch (e) {}
    removeButton();
    const hint = document.getElementById('install-hint');
    if (hint) hint.remove();
  }

  let deferred = null;

  async function onMainClick(e) {
    if (e.target && e.target.id === 'install-fab-x') return; // X handled separately
    if (deferred) {
      try {
        deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice && choice.outcome === 'accepted') {
          try { localStorage.setItem(KEY_DISMISSED, '1'); } catch (e) {}
          removeButton();
        }
      } catch (err) { /* ignore */ }
      deferred = null;
    } else {
      showFallbackHint();
    }
  }

  function showFallbackHint() {
    const prev = document.getElementById('install-hint');
    if (prev) { prev.remove(); return; } // toggle off if already open

    const title = isIOS ? t.iosTitle : isAndroid ? t.androidTitle : t.desktopTitle;
    const body  = isIOS ? t.iosBody  : isAndroid ? t.androidBody  : t.desktopBody;

    const wrap = document.createElement('div');
    wrap.id = 'install-hint';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', title);
    wrap.style.cssText = [
      'position:fixed', 'left:16px', 'right:16px',
      // Sit above the install-fab itself (which sits above the ambient footer).
      'bottom:calc(140px + env(safe-area-inset-bottom))',
      'max-width:420px', 'margin:0 auto',
      'background:#0E0E12', 'color:#F0EAD6',
      'padding:18px 20px', 'border-radius:14px',
      'box-shadow:0 14px 44px rgba(0,0,0,0.40)',
      'font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'font-size:14px', 'line-height:1.55',
      'z-index:260',
      'display:flex', 'flex-direction:column', 'gap:10px',
    ].join(';');
    wrap.innerHTML =
      '<strong style="font-size:15px">' + title + '</strong>' +
      '<span style="opacity:.85">' + body + '</span>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">' +
        '<button type="button" id="install-hint-close" style="background:#C8202A;color:#fff;border:0;padding:8px 16px;border-radius:8px;font:inherit;cursor:pointer;font-weight:600">' + t.close + '</button>' +
      '</div>';
    document.body.appendChild(wrap);
    wrap.querySelector('#install-hint-close').addEventListener('click', () => wrap.remove());
  }

  // —— Bootstrap —— //
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildButton);
  } else {
    buildButton();
  }

  // —— Footer "Install app" re-entry. Lets the user bring the FAB back after
  //    they dismissed it. Any element with [data-action="install-app"] works. ——
  function wireReopenLinks() {
    document.querySelectorAll('[data-action="install-app"]').forEach((el) => {
      if (el._installWired) return;
      el._installWired = true;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        try { localStorage.removeItem(KEY_DISMISSED); } catch (e) {}
        if (!document.getElementById('install-fab-wrap')) buildButton();
        // Scroll the FAB into the viewport on long pages so the user sees it.
        const fab = document.getElementById('install-fab-wrap');
        if (fab) fab.animate(
          [ { transform: 'scale(0.85)', opacity: 0.6 }, { transform: 'scale(1.08)' }, { transform: 'scale(1)', opacity: 1 } ],
          { duration: 360, easing: 'ease-out' }
        );
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireReopenLinks);
  } else {
    wireReopenLinks();
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    // Button already built — clicks now route to the native prompt instead of the popover.
  });

  window.addEventListener('appinstalled', function () {
    try { localStorage.setItem(KEY_DISMISSED, '1'); } catch (e) {}
    removeButton();
    deferred = null;
  });
})();
