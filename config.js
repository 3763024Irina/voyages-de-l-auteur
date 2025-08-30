// config.js
// 1) Контакты и ссылки
window.APP_CONFIG = {
  email: '3763024@gmail.com',            // почта для брони
  whatsapp: '33759644813',               // без "+" — подставится в wa.me
  needguide: 'https://needguide.ru/view_guide.php?user_id=22306',

  // 2) Секрет для режима админа (замени на свой!)
  ADMIN_SECRET: 'capion2025'
};

(function () {
  const CFG = window.APP_CONFIG || {};

  // --- helpers
  const qs = (sel) => Array.from(document.querySelectorAll(sel));
  const getParam = (name) => {
    const u = new URL(window.location.href);
    return (
      u.searchParams.get(name) ||
      new URLSearchParams((u.hash || '').replace(/^#/, '?')).get(name)
    );
  };

  // --- ADMIN MODE
  const ADMIN_KEY = 'site:admin';

  function isAdmin() {
    return localStorage.getItem(ADMIN_KEY) === 'on';
  }
  function setAdmin(on) {
    localStorage.setItem(ADMIN_KEY, on ? 'on' : 'off');
    document.documentElement.classList.toggle('is-admin', !!on);
    toggleAdminVisibility();
    drawAdminBadge();
  }

  // Скрываем админ-ссылки от гостей (по умолчанию — скрыты)
  const ADMIN_ONLY_SELECTORS = [
    '[data-i18n="cta_grotte"]',
    '[data-i18n="cta_restaurant"]',
    '[data-i18n="cta_capion"]'
  ];

  function toggleAdminVisibility() {
    const on = isAdmin();
    qs(ADMIN_ONLY_SELECTORS.join(',')).forEach((el) => {
      el.style.display = on ? '' : 'none';
    });
  }

  // Значок/панель админа (виден только в режиме админа)
  function drawAdminBadge() {
    const id = 'admin-badge';
    let badge = document.getElementById(id);
    if (!isAdmin()) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('div');
      badge.id = id;
      badge.innerHTML = `
        <div style="
          position:fixed; right:14px; bottom:14px; z-index:9999;
          background:#0D2B1E; color:#fff; border-radius:12px;
          padding:10px 12px; box-shadow:0 10px 22px rgba(0,0,0,.18);
          font:600 13px/1.2 Inter, system-ui, -apple-system;
          display:flex; gap:8px; align-items:center;">
          <span>Admin</span>
          <a href="${CFG.needguide||'#'}" target="_blank" rel="noopener"
             style="background:#C9B886; color:#1b1b1b; padding:6px 10px; border-radius:10px; font-weight:800; text-decoration:none;">NeedGuide</a>
          <button id="admin-logout" style="background:transparent; color:#fff; border:1px solid rgba(255,255,255,.4); padding:6px 10px; border-radius:10px; cursor:pointer;">Выйти</button>
        </div>`;
      document.body.appendChild(badge);
      document.getElementById('admin-logout')?.addEventListener('click', () => {
        setAdmin(false);
        alert('Admin OFF');
      });
    }
  }

  // Вход админа: ?admin=SECRET или #admin=SECRET или хоткей Ctrl+Shift+A
  function trySecretFromURL() {
    const s = getParam('admin');
    if (s && s === String(CFG.ADMIN_SECRET || '')) {
      setAdmin(true);
      // чистим URL
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      if ((url.hash || '').includes('admin=')) url.hash = '';
      history.replaceState({}, document.title, url.toString());
    }
  }
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      const code = prompt('Admin code');
      if (code === String(CFG.ADMIN_SECRET || '')) {
        setAdmin(true);
        alert('Admin ON');
      } else {
        alert('Wrong code');
      }
    }
  });

  // --- Подстановка WhatsApp из конфигурации (на всякий случай и тут)
  function patchWhatsApp() {
    const phone = String(CFG.whatsapp || '').replace(/\D/g, '');
    if (!phone) return;
    qs('[data-whatsapp]').forEach((a) => a.setAttribute('href', `https://wa.me/${phone}`));
  }

  // Инициализация
  window.addEventListener('DOMContentLoaded', () => {
    trySecretFromURL();
    toggleAdminVisibility();
    drawAdminBadge();
    patchWhatsApp();
    // если уже входили раньше
    if (isAdmin()) setAdmin(true);
  });
})();

