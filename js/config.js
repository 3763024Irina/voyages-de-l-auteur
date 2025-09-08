/* config.js v1.1 — admin + базовые ссылки WA/TG (без бота)
   • Нормализация WhatsApp номера -> только цифры
   • TG всегда через окно шаринга (t.me/share/url) — текст подставит contact.js при клике
   • Админ-режим: ?admin=SECRET или Ctrl+Shift+A → ввести код
   • Патч ссылок работает и для динамически добавленных элементов (MutationObserver)
*/
window.APP_CONFIG = Object.assign({
  whatsapp: '33759644813',   // можно с +, всё равно очистим до цифр
  telegram_user: 'de_iren',  // ваш @юзер без @ (для fallback-а в других скриптах)
  // ADMIN_SECRET: 'your-secret' // при желании раскомментируйте и задайте
}, window.APP_CONFIG || {});

(function () {
  if (window.__CONFIG_INIT__) { console.warn('[config.js] already initialized'); return; }
  window.__CONFIG_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const digits = (s='') => String(s).replace(/\D/g,'');
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts||false);

  /* ===== Admin ===== */
  const ADMIN_KEY = 'site:admin';
  const isAdmin = () => localStorage.getItem(ADMIN_KEY) === 'on';
  const setAdmin = (onFlag) => {
    localStorage.setItem(ADMIN_KEY, onFlag ? 'on' : 'off');
    document.documentElement.classList.toggle('is-admin', !!onFlag);
    drawAdminBadge();
  };

  function drawAdminBadge(){
    const id = 'admin-badge';
    let el = document.getElementById(id);
    if (!isAdmin()) { if (el) el.remove(); return; }
    if (!el){
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
      on(document.getElementById('admin-logout'), 'click', () => { setAdmin(false); alert('Admin OFF'); }, { once:true });
    }
  }

  function getParam(name){
    const url = new URL(location.href);
    const s1 = url.searchParams.get(name);
    const s2 = new URLSearchParams(url.hash.replace(/^#/, '?')).get(name);
    return s1 || s2;
  }

  function tryAdminLoginFromURL(){
    const s = getParam('admin');
    if (!s) return;
    if (String(s) === String(CFG.ADMIN_SECRET||'')) {
      setAdmin(true);
      const url = new URL(location.href);
      url.searchParams.delete('admin');
      if (url.hash.includes('admin=')) url.hash = '';
      history.replaceState({}, document.title, url.toString());
      alert('Admin ON');
    } else {
      alert('Wrong code');
    }
  }

  on(document, 'keydown', (e)=>{
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase()==='a'){
      const code = prompt('Admin code');
      if (code === String(CFG.ADMIN_SECRET||'')) { setAdmin(true); alert('Admin ON'); }
      else { alert('Wrong code'); }
    }
  });

  /* ===== Базовые href (без текста) ===== */
  const WA_DIGITS = digits(CFG.whatsapp||'');
  // Экспорт пригодится другим скриптам
  window.APP_CONFIG.WA_DIGITS = WA_DIGITS;

  function patchBaseLinks(root=document){
    if (WA_DIGITS){
      qa('[data-whatsapp]', root).forEach(a => {
        a.setAttribute('href', `https://wa.me/${WA_DIGITS}`);
        a.setAttribute('target','_blank');
        a.setAttribute('rel','noopener');
      });
    }
    // TG — всегда окно шаринга; contact.js подставит text/url при клике
    qa('[data-telegram]', root).forEach(a => {
      a.setAttribute('href', 'https://t.me/share/url');
      a.setAttribute('target','_blank');
      a.setAttribute('rel','noopener');
    });
  }

  /* ===== Инициализация + наблюдение за DOM ===== */
  function init(){
    if (isAdmin()) document.documentElement.classList.add('is-admin');
    tryAdminLoginFromURL();
    drawAdminBadge();
    patchBaseLinks();

    // Патчим и динамически добавленные элементы
    const mo = new MutationObserver((muts)=>{
      for (const m of muts){
        m.addedNodes && m.addedNodes.forEach(node=>{
          if (!(node instanceof Element)) return;
          // патчим сам элемент и его потомков
          if (node.matches?.('[data-whatsapp], [data-telegram]')) patchBaseLinks(node.parentElement||document);
          if (node.querySelector?.('[data-whatsapp], [data-telegram]')) patchBaseLinks(node);
        });
      }
    });
    mo.observe(document.documentElement, { childList:true, subtree:true });
    console.log('[config.js] ready — WA/TG base links + admin');
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();

  // экспорт
  window.__setAdmin = setAdmin;
  window.__isAdmin  = isAdmin;
})();
