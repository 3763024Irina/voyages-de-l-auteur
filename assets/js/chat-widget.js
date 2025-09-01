/* assets/js/chat-widget.js — плавающая кнопка чата (WA + TG)
   Требует window.APP_CONFIG.whatsapp = '+33 6 12 34 56 78' (или любой номер)
   Спрячет блок с атрибутом [data-contact-panel] (если он остался в верстке).
*/
;(function(){
  if (window.__CHAT_WIDGET__) return; window.__CHAT_WIDGET__ = true;

  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');

  /* ---- CSS ---- */
  const css = `
  [data-contact-panel]{display:none!important;} /* спрятать старую панель, если она есть */

  .chat-fab{
    position:fixed; right:20px; bottom:calc(20px + env(safe-area-inset-bottom));
    width:56px; height:56px; border-radius:999px; border:0; cursor:pointer;
    background:var(--brand,#0D2B1E); color:#fff; box-shadow:0 10px 25px rgba(0,0,0,.15);
    display:flex; align-items:center; justify-content:center; z-index:9999;
    transition:transform .15s ease, box-shadow .15s ease, opacity .2s;
  }
  .chat-fab:hover{ transform:translateY(-1px); box-shadow:0 12px 28px rgba(0,0,0,.2); }
  .chat-fab svg{ width:26px; height:26px; }

  .chat-menu{
    position:fixed; right:20px; bottom:calc(86px + env(safe-area-inset-bottom));
    width:260px; background:#fff; border-radius:16px; padding:12px;
    box-shadow:0 16px 40px rgba(0,0,0,.18); z-index:9999; display:none;
  }
  .chat-menu[data-open]{ display:block; }
  .chat-menu h4{ margin:6px 8px 10px; font-size:14px; color:#415149; font-weight:600;
    font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  .chat-menu .btn{
    width:100%; border:1px solid #e8ece9; border-radius:12px; padding:12px 14px;
    font:600 15px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    background:#fff; cursor:pointer; display:flex; align-items:center; gap:10px; margin:8px 0;
  }
  .chat-menu .btn:hover{ background:#f7f6f3; }
  .chat-menu .btn svg{ width:18px; height:18px; }
  .chat-menu .sub{ margin-left:auto; font-weight:500; font-size:12px; color:#6b7b73; }
  `;
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  /* ---- Текст для чата / текущая программа ---- */
  const getProgramTitle = () =>
    (document.querySelector('[data-program-title]')?.textContent?.trim()) ||
    (document.querySelector('h1')?.textContent?.trim()) || document.title;

  const text = `Здравствуйте! Интересуюсь программой: ${getProgramTitle()} — ${location.href}`;

  const wa = digits(CFG.whatsapp||''); // номер из APP_CONFIG
  const waUrl = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null;
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;

  /* ---- FAB ---- */
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label','Открыть чат');
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M2 12c0-5.5 4.8-10 10.7-10S24 6.5 24 12s-4.8 10-10.7 10c-1.6 0-3.2-.3-4.7-.9L2 22l1.2-5C2.4 15.3 2 13.7 2 12z"/>
    </svg>`;
  document.body.appendChild(fab);

  /* ---- Меню ---- */
  const menu = document.createElement('div');
  menu.className = 'chat-menu';
  menu.innerHTML = `
    <h4>Быстрый чат</h4>
    ${waUrl ? `<button class="btn" data-a="wa" type="button" aria-label="Написать в WhatsApp">
      <svg viewBox="0 0 24 24"><path d="M12 .5a11.4 11.4 0 0 0-9.8 17.1L1 24l6.6-1.7A11.4 11.4 0 1 0 12 .5Zm5.9 16.5c-.2.5-1 .9-1.5 1-1.4.1-2.5-.5-3.6-1.1-1.1-.7-2-1.7-2.7-2.8-.5-.9-1.1-2-1-3.1 0-.5.3-1.3.8-1.5.4-.2.9-.2 1.2.2.3.5.7 1.2.8 1.3.1.3.1.5 0 .8-.1.3-.2.4-.4.6l-.3.3c-.2.2-.2.5-.1.7.4.8 1 1.5 1.7 2 .6.5 1.4.9 2.2 1 .3 0 .5 0 .7-.3l.3-.4c.2-.2.4-.3.7-.2.3 0 1.9.9 2.2 1.1.2.1.3.2.4.4.1.3.1.6 0 .9Z" fill="currentColor"/></svg>
      <span>WhatsApp</span><span class="sub">Открыть чат</span>
    </button>` : ``}
    <button class="btn" data-a="tg" type="button" aria-label="Поделиться в Telegram">
      <svg viewBox="0 0 24 24"><path d="M9.6 15.3 9.3 20c.5 0 .8-.2 1-.4l2.4-2.3 5-3.7c.9-.6 1.5-1.1 1.7-1.8.3-.6-.1-1-.9-.8l-6.8 2.6-2.8.9c-.6.2-1 .1-1.3 0-.3-.2-.3-.6.2-.9l4.5-2.2 6.1-3.2c.7-.3 1.2-.6 1.2-1 0-.3-.5-.4-1.2-.2l-10.6 4c-1 .4-1.7.9-1.7 1.5s.6.9 1.5 1l2 .3 7.8 4.9c.8.5 1.5.2 1.7-.7" fill="currentColor"/></svg>
      <span>Telegram</span><span class="sub">Поделиться</span>
    </button>
  `;
  document.body.appendChild(menu);

  /* ---- Логика ---- */
  const toggle = () => menu.toggleAttribute('data-open');
  fab.addEventListener('click', toggle);

  const copyFallback = () => { try { navigator.clipboard?.writeText(text); } catch(_){} };

  menu.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn'); if(!btn) return;
    const a = btn.dataset.a;
    copyFallback();
    const href = (a==='wa' && waUrl) ? waUrl : tgUrl;
    window.open(href, '_blank', 'noopener,noreferrer');
    menu.removeAttribute('data-open');
  });

  document.addEventListener('click', (e)=>{
    if(menu.contains(e.target) || fab.contains(e.target)) return;
    menu.removeAttribute('data-open');
  }, true);
})();
