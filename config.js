// config.js
window.APP_CONFIG = {
  email: '3763024@gmail.com',                 // почта для брони
  whatsapp: '33759644813',                    // без "+"
  needguide: 'https://needguide.ru/view_guide.php?user_id=22306',
  ADMIN_SECRET: 'capion2025'                  // секрет входа в админ
};

(function () {
  const CFG = window.APP_CONFIG || {};
  const qsAll = (sel) => Array.from(document.querySelectorAll(sel));

  // === Admin state
  const ADMIN_KEY = 'site:admin';
  const isAdmin = () => localStorage.getItem(ADMIN_KEY) === 'on';
  const setAdmin = (on) => {
    localStorage.setItem(ADMIN_KEY, on ? 'on' : 'off');
    document.documentElement.classList.toggle('is-admin', !!on);
    drawAdminBadge();
  };

  // Admin badge (виден только админу)
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
          <a href="${CFG.needguide||'#'}" target="_blank" rel="noopener"
             style="background:#C9B886; color:#1b1b1b; padding:6px 10px; border-radius:10px; font-weight:800; text-decoration:none;">NeedGuide</a>
          <button id="admin-logout" style="background:transparent; color:#fff; border:1px solid rgba(255,255,255,.4);
                 padding:6px 10px; border-radius:10px; cursor:pointer;">Выйти</button>
        </div>`;
      document.body.appendChild(el);
      document.getElementById('admin-logout')?.addEventListener('click', () => {
        setAdmin(false);
        alert('Admin OFF');
      });
    }
  }

  // Вход по ?admin=SECRET или Ctrl+Shift+A
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
      // чистим URL
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

  // Подстановка WhatsApp из конфига
  function patchWhatsApp() {
    const phone = String(CFG.whatsapp || '').replace(/\D/g, '');
    if (!phone) return;
    qsAll('[data-whatsapp]').forEach(a => a.setAttribute('href', `https://wa.me/${phone}`));
  }

  // Глобальный флажок для быстрой диагностики
  window.__CONFIG_LOADED__ = true;

  window.addEventListener('DOMContentLoaded', () => {
    if (isAdmin()) document.documentElement.classList.add('is-admin');
    tryAdminLoginFromURL();
    patchWhatsApp();
    drawAdminBadge();
    console.log('[config.js] loaded, admin=', isAdmin());
  });
})();

