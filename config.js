/* config.js — Admin + базовые ссылки для WA/TG (без email)
   Telegram: если указан bot_username — кнопки TG ведут на диплинк бота.
*/
window.APP_CONFIG = window.APP_CONFIG || {
  // whatsapp: '33759644813',
  // bot_username: 'ToursLanguedocBot', // <- юзернейм вашего бота
  // ADMIN_SECRET: 'capion2025'
};

(function () {
  if (window.__CONFIG_INIT__) { console.warn('[config.js] already initialized'); return; }
  window.__CONFIG_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const digits = (s='') => String(s).replace(/\D/g,'');

  /* ========== ADMIN ========== */
  const ADMIN_KEY = 'site:admin';
  const isAdmin = () => localStorage.getItem(ADMIN_KEY) === 'on';
  const setAdmin = (on) => {
    localStorage.setItem(ADMIN_KEY, on ? 'on' : 'off');
    document.documentElement.classList.toggle('is-admin', !!on);
    drawAdminBadge();
  };
  function drawAdminBadge() {
    const id = 'admin-badge';
    let el = document.getElementById(id);
    if (!isAdmin()) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.innerHTML = `
        <div style="position:fixed; right:14px; bottom:14px; z-index:9999;
                    background:#0D2B1E; color:#fff; border-radius:12px;
                    padding:10px 12px; box-shadow:0 10px 22px rgba(0,0,0,.18);
                    font:600 13px/1.2 Inter, system-ui; display:flex; gap:8px; align-items:center;">
          <span>Admin</span>
          <button id="admin-logout" style="background:transparent; color:#fff; border:1px solid rgba(255,255,255,.4);
                 padding:6px 10px; border-radius:10px; cursor:pointer;">Выйти</button>
        </div>`;
      document.body.appendChild(el);
      document.getElementById('admin-logout')?.addEventListener('click', () => {
        setAdmin(false);
        alert('Admin OFF');
      }, { once:true });
    }
  }
  function getParam(name) {
    const url = new URL(window.location.href);
    const s1 = url.searchParams.get(name);
    const s2 = new URLSearchParams(url.hash.replace(/^#/, '?')).get(name);
    return s1 || s2;
  }
  function tryAdminLoginFromURL() {
    const s = getParam('admin');
    if (s && s === String(CFG.ADMIN_SECRET || '')) {
      setAdmin(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      if (url.hash.includes('admin=')) url.hash = '';
      history.replaceState({}, document.title, url.toString());
      alert('Admin ON');
    }
  }
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      const code = prompt('Admin code');
      if (code === String(CFG.ADMIN_SECRET || '')) { setAdmin(true); alert('Admin ON'); }
      else { alert('Wrong code'); }
    }
  });

  /* ========== Базовые href для WA/TG (без текста) ========== */
  function patchBaseLinks() {
    const wa = digits(CFG.whatsapp || '');
    if (wa) qa('[data-whatsapp]').forEach(a => a.setAttribute('href', `https://wa.me/${wa}`));

    // Если есть bot_username — ведём на бота (текст подставит contact.js через payload)
    if (CFG.bot_username) {
      qa('[data-telegram]').forEach(a => a.setAttribute('href', `https://t.me/${CFG.bot_username}`));
    } else {
      // иначе: окно шаринга (с текстом), это безопасный фолбэк
      qa('[data-telegram]').forEach(a => a.setAttribute('href', 'https://t.me/share/url'));
    }
  }

  /* ========== INIT ========== */
  window.__CONFIG_LOADED__ = true;
  window.__setAdmin = setAdmin;
  window.__isAdmin  = isAdmin;

  function init(){
    if (isAdmin()) document.documentElement.classList.add('is-admin');
    tryAdminLoginFromURL();
    drawAdminBadge();
    patchBaseLinks();
    console.log('[config.js] ready, admin=', isAdmin());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();

