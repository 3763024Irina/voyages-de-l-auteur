/* config.js — Admin + базовые ссылки WhatsApp/Telegram (без email/NeedGuide)
   Telegram: используем окно шаринга, чтобы гарантировать текст.
*/
window.APP_CONFIG = window.APP_CONFIG || {
  // whatsapp: '33759644813',
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

  /* ========== Admin Link UX ========== */
  function initAdminLinkUX() {
    if (!document.getElementById('admin-link-style')) {
      const st = document.createElement('style');
      st.id = 'admin-link-style';
      st.textContent = `
        html:not(.is-admin) [data-admin-only] { display: none !important; }
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
    document.addEventListener('click', (e) => {
      if (!isAdmin()) return;
      const a = e.target.closest('a[data-admin-link]');
      if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const href = a.getAttribute('href') || '';
      navigator.clipboard?.writeText(href).catch(()=>{});
      toast('Скопировано: ' + href);
    }, true);
  }

  /* ========== Базовые href для WA/TG (без текста) ========== */
  function patchBaseLinks() {
    const wa = digits(CFG.whatsapp || '');
    if (wa) {
      qa('[data-whatsapp]').forEach(a => a.setAttribute('href', `https://wa.me/${wa}`));
    }
    // Telegram — всегда окно шаринга, чтобы текст точно подставлялся
    qa('[data-telegram]').forEach(a => a.setAttribute('href', 'https://t.me/share/url'));
  }

  /* ========== INIT ========== */
  window.__CONFIG_LOADED__ = true;
  window.__setAdmin = setAdmin;
  window.__isAdmin  = isAdmin;

  function init(){
    if (isAdmin()) document.documentElement.classList.add('is-admin');
    tryAdminLoginFromURL();
    drawAdminBadge();
    initAdminLinkUX();
    patchBaseLinks();
    console.log('[config.js] ready, admin=', isAdmin());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();

