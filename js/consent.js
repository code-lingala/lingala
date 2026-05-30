// GDPR consent banner — Google Consent Mode v2.
// The GA4 inline snippet sets ad_storage / analytics_storage to 'denied' by
// default, so nothing is collected until the visitor clicks Accept here.
// Choice persists in localStorage under 'lingala.consent' ('granted' | 'denied').
(function () {
  const KEY = 'lingala.consent';
  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (stored === 'granted' || stored === 'denied') return;   // already decided

  // Pick a language for the banner copy. Fall back to EN.
  let lang = 'en';
  try {
    const saved = localStorage.getItem('lingala.sitelang');
    const url = new URL(window.location.href);
    lang = url.searchParams.get('lang') || saved || (navigator.language || 'en').slice(0, 2);
    if (lang !== 'fr' && lang !== 'ln') lang = 'en';
  } catch (e) {}

  const T = {
    en: {
      title: 'A note on cookies',
      body: 'We use Google Analytics to understand how Losako is used. Nothing personal — just aggregate visits. You can decline; it doesn’t change anything for you.',
      accept: 'Accept',
      decline: 'Decline',
    },
    fr: {
      title: 'Au sujet des cookies',
      body: 'Nous utilisons Google Analytics pour comprendre comment Losako est utilisé. Aucune donnée personnelle — uniquement des visites agrégées. Vous pouvez refuser ; cela ne change rien pour vous.',
      accept: 'Accepter',
      decline: 'Refuser',
    },
    ln: {
      title: 'Liloba mpo na « cookies »',
      body: 'Tosaleli Google Analytics mpo na koyeba ndenge Losako esalaka. Bato moko te bakoyebana — kaka motango ya bato bayei. Okoki koboya ; ekobongola eloko te mpo na yo.',
      accept: 'Endima',
      decline: 'Boya',
    },
  };
  const t = T[lang] || T.en;

  function applyConsent(decision) {
    try { localStorage.setItem(KEY, decision); } catch (e) {}
    if (typeof window.gtag === 'function' && decision === 'granted') {
      window.gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      });
    }
  }

  function show() {
    const wrap = document.createElement('div');
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', t.title);
    wrap.id = 'consent-banner';
    wrap.style.cssText = [
      'position:fixed',
      'left:16px',
      'right:16px',
      // Sit above the ambient footer (its base height is ~64px + safe-area).
      'bottom:calc(76px + env(safe-area-inset-bottom))',
      'max-width:520px',
      'margin:0 auto',
      'background:#0E0E12',
      'color:#F0EAD6',
      'padding:16px 18px',
      'border-radius:12px',
      'box-shadow:0 12px 40px rgba(0,0,0,0.35)',
      'font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'font-size:14px',
      'line-height:1.5',
      'z-index:300',
      'display:flex',
      'flex-direction:column',
      'gap:10px',
    ].join(';');
    wrap.innerHTML =
      '<strong style="font-size:15px">' + t.title + '</strong>' +
      '<span style="opacity:.85">' + t.body + '</span>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">' +
        '<button type="button" id="consent-no" style="background:transparent;color:#F0EAD6;border:1px solid rgba(240,234,214,0.3);padding:8px 14px;border-radius:8px;font:inherit;cursor:pointer">' + t.decline + '</button>' +
        '<button type="button" id="consent-yes" style="background:#C8202A;color:#fff;border:0;padding:8px 14px;border-radius:8px;font:inherit;cursor:pointer;font-weight:600">' + t.accept + '</button>' +
      '</div>';
    document.body.appendChild(wrap);

    function close() { wrap.remove(); }
    wrap.querySelector('#consent-yes').addEventListener('click', () => { applyConsent('granted'); close(); });
    wrap.querySelector('#consent-no').addEventListener('click', () => { applyConsent('denied'); close(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();
