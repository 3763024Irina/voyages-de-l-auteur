/* config.js — конфиг + админ + WhatsApp (без логики бронирования) */
window.APP_CONFIG = window.APP_CONFIG || {
  // Пример (можно переопределить раньше этим же объектом):
  // email: '3763024@gmail.com',
  // whatsapp: '33759644813',
  // needguide: 'https://needguide.ru/view_guide.php?user_id=22306',
  // ADMIN_SECRET: 'capion2025',
  // telegram: 'ToursLanguedocbyIrene'
};

(function () {
  if (window.__CONFIG_INIT__) { console.warn('[config.js] already initialized'); return; }
  window.__CONFIG_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qsAll = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // === Admin state ===
  const ADMIN_KEY = 'site:admin';
  const isAdmin = () => localStorage.getItem(ADMIN_KEY) === 'on';
  const setAdmin = (on) => {
    localStorage.setItem(ADMIN_KEY, on ? 'on' : 'off');
    document.documentElement.classList.toggle('is-admin', !!on);
    drawAdminBadge();
  };

  // Бейдж админа
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
      }, { once: true });
    }
  }

  // Вход по ?admin=SECRET или #admin=SECRET
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

  // Горячая клавиша — Ctrl+Shift+A
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      const code = prompt('Admin code');
      if (code === String(CFG.ADMIN_SECRET || '')) { setAdmin(true); alert('Admin ON'); }
      else { alert('Wrong code'); }
    }
  });

  // Подстановка WhatsApp на все ссылки с data-whatsapp
  function patchWhatsApp() {
    const phone = String(CFG.whatsapp || '').replace(/\D/g, '');
    if (!phone) return;
    qsAll('[data-whatsapp]').forEach(a => a.setAttribute('href', `https://wa.me/${phone}`));
  }

  // === Admin Link UX ===
  function initAdminLinkUX() {
    // Стили — один раз
    if (!document.getElementById('admin-link-style')) {
      const st = document.createElement('style');
      st.id = 'admin-link-style';
      st.textContent = `
        /* показывать только админу */
        html:not(.is-admin) [data-admin-only] { display: none !important; }
        /* визуальная метка ссылок, которые копируются */
        html.is-admin a[data-admin-link] { outline: 1px dashed #C9B886; outline-offset: 2px; }
      `;
      document.head.appendChild(st);
    }

    const toast = (msg) => {
      const el = document.createElement('div');
      el.textContent = msg;
      Object.assign(el.style, {
        position:'fixed', left:'50%', bottom:'20px', transform:'translateX(-50%)',
        background:'#0D2B1E', color:'#fff', padding:'10px 14px', borderRadius:'10px',
        boxShadow:'0 10px 22px rgba(0,0,0,.18)', font:'600 13px/1 Inter,system-ui', zIndex: 99999,
      });
      document.body.appendChild(el);
      setTimeout(()=> el.remove(), 1800);
    };

    // Делегированный клик — копирование admin-link
    document.addEventListener('click', (e) => {
      // Тогглеры админа (удобные кнопки в UI)
      const loginBtn = e.target.closest('[data-admin-login]');
      if (loginBtn) {
        e.preventDefault();
        const code = prompt('Admin code');
        if (code === String(CFG.ADMIN_SECRET || '')) { setAdmin(true); alert('Admin ON'); }
        else { alert('Wrong code'); }
        return;
      }
      const logoutBtn = e.target.closest('[data-admin-logout]');
      if (logoutBtn) {
        e.preventDefault();
        setAdmin(false);
        alert('Admin OFF');
        return;
      }

      if (!isAdmin()) return;
      const a = e.target.closest('a[data-admin-link]');
      if (!a) return;

      // модификаторы — открыть как обычно
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      // иначе копируем href и не переходим
      e.preventDefault();
      const href = a.getAttribute('href') || '';
      navigator.clipboard?.writeText(href).catch(()=>{});
      toast('Скопировано: ' + href);
    }, true);
  }

  // Экспорт в глобал (по желанию)
  window.__CONFIG_LOADED__ = true;
  window.__patchWhatsApp = patchWhatsApp;
  window.__setAdmin = setAdmin;
  window.__isAdmin = isAdmin;

  window.addEventListener('DOMContentLoaded', () => {
    if (isAdmin()) document.documentElement.classList.add('is-admin');
    tryAdminLoginFromURL();
    patchWhatsApp();
    drawAdminBadge();
    initAdminLinkUX();
    console.log('[config.js] ready, admin=', isAdmin());
  });
})();
