// config.js
"use strict";

// === ГЛОБАЛЬНАЯ КОНФИГУРАЦИЯ САЙТА ===
window.APP_CONFIG = {
  email: '3763024@gmail.com',                 // почта для брони
  whatsapp: '33759644813',                    // без "+"
  // telegram (необязательно): username без @, например 'ToursLanguedocbyIrene'
  telegram: '',                               // можно оставить пустым
  needguide: 'https://needguide.ru/view_guide.php?user_id=22306',
  ADMIN_SECRET: 'capion2025'                  // секрет входа в админ
};

(function () {
  const CFG = window.APP_CONFIG || {};
  const qsAll = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const ADMIN_KEY = 'site:admin';

  // ===== Admin state =====
  const isAdmin = () => localStorage.getItem(ADMIN_KEY) === 'on';
  const applyAdminClass = (on) => {
    document.documentElement.classList.toggle('is-admin', !!on);
  };
  const setAdmin = (on) => {
    localStorage.setItem(ADMIN_KEY, on ? 'on' : 'off');
    applyAdminClass(on);
    drawAdminBadge();
  };

  // Ставим класс сразу (до DOMContentLoaded), чтобы не мигало скрыто/показано
  applyAdminClass(isAdmin());

  // ===== Admin badge =====
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

  // ===== Вход по URL (?admin=SECRET) и по хоткею (Ctrl+Shift+A) =====
  function getParam(name) {
    try {
      const url = new URL(window.location.href);
      const s1 = url.searchParams.get(name);
      const s2 = new URLSearchParams(url.hash.replace(/^#/, '?')).get(name);
      return s1 || s2;
    } catch { return null; }
  }

  function tryAdminLoginFromURL() {
    const s = getParam('admin');
    if (s && s === String(CFG.ADMIN_SECRET || '')) {
      setAdmin(true);
      // чистим URL
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('admin');
        if (url.hash.includes('admin=')) url.hash = '';
        history.replaceState({}, document.title, url.toString());
      } catch {}
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

  // ===== Патчи контактов по дата-атрибутам =====
  function patchContacts() {
    // WhatsApp
    const phone = String(CFG.whatsapp || '').replace(/\D/g, '');
    if (phone) {
      qsAll('[data-whatsapp]').forEach(a => a.setAttribute('href', `https://wa.me/${phone}`));
    }

    // Telegram (если задан username)
    const tg = String(CFG.telegram || '').trim();
    if (tg) {
      qsAll('[data-telegram]').forEach(a => a.setAttribute('href', `https://t.me/${tg}`));
    }

    // Email (если пометили data-email)
    const email = String(CFG.email || '').trim();
    if (email) {
      qsAll('[data-email]').forEach(a => a.setAttribute('href', `mailto:${email}`));
    }
  }

  // Экспорт полезных методов (по желанию)
  window.Admin = {
    on: () => setAdmin(true),
    off: () => setAdmin(false),
    state: () => isAdmin(),
  };

  // Диагностика
  window.__CONFIG_LOADED__ = true;

  // Инициализация после загрузки DOM
  window.addEventListener('DOMContentLoaded', () => {
    tryAdminLoginFromURL();
    patchContacts();
    drawAdminBadge();
    console.log('[config.js] loaded, admin =', isAdmin(), 'cfg:', { email: CFG.email, whatsapp: CFG.whatsapp, telegram: CFG.telegram });
  });
})();


