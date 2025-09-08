/* chat-widget.js — плавающие иконки WA + TG (FAB), v1.3
   Новое:
   • Режим Telegram через APP_CONFIG.telegram_open: 'auto' | 'bot' | 'profile'
   • Бронебойные deeplink-и (iOS/Android/desktop) + web fallback
   • Нормализация PRE_URL (/health → /prestart, http → https)
   • Копирование текста заказа в буфер + локализованный тост (RU/FR)
*/
;(function(){
  if (window.__CHAT_WIDGET__) return; window.__CHAT_WIDGET__ = true;

  // ==== CONFIG ====
  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');
  const UA = navigator.userAgent;
  const isMobile  = /(iPad|iPhone|iPod|Android)/i.test(UA);
  const isiOS     = /iPad|iPhone|iPod/i.test(UA);
  const isAndroid = /Android/i.test(UA);

  const LANG = () => (localStorage.getItem('site:lang') ||
                      ((navigator.language||'').toLowerCase().startsWith('fr') ? 'fr' : 'ru'));
  const L = {
    ru: { toastCopied:'Текст скопирован — вставьте в Telegram' },
    fr: { toastCopied:'Texte copié — collez-le dans Telegram' }
  };
  const t = k => (L[LANG()]||L.ru)[k];

  const WA_NUMBER = digits(CFG.whatsapp || '');
  const TG_USER   = (CFG.telegram_user || '').replace(/^@/,'');
  const TG_BOT    = (CFG.telegram_bot  || '').replace(/^@/,'');
  const TG_MODE   = String(CFG.telegram_open || 'auto').toLowerCase(); // 'auto' | 'bot' | 'profile'

  function normalizePreUrl(u){
    if(!u) return '';
    try{
      let url = new URL(u, location.origin);
      if (url.protocol !== 'https:') url = new URL('https://' + url.host + url.pathname + url.search + url.hash);
      if (/\/health\/?$/i.test(url.pathname)) url.pathname = url.pathname.replace(/\/health\/?$/i, '/prestart');
      if (!/\/prestart\/?$/i.test(url.pathname)) {
        if (!url.pathname.endsWith('/')) url.pathname += '/';
        url.pathname += 'prestart';
      }
      return url.toString();
    }catch{ return u; }
  }
  const PRE_URL = normalizePreUrl(CFG.bot_prestart_url || '');

  // ==== CSS ====
  const css = `
  [data-contact-panel]{display:none!important;}
  .chat-fab{
    position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom));
    width:56px;height:56px;border-radius:999px;border:0;cursor:pointer;
    background:var(--brand,#0D2B1E);color:#fff;box-shadow:0 10px 25px rgba(0,0,0,.15);
    display:flex;align-items:center;justify-content:center;z-index:9999;
    transition:transform .15s ease, box-shadow .15s ease;
  }
  .chat-fab:hover{ transform:translateY(-1px); box-shadow:0 12px 28px rgba(0,0,0,.2); }
  .chat-fab svg{ width:26px;height:26px }
  .chat-menu{
    position:fixed;right:20px;bottom:calc(86px + env(safe-area-inset-bottom));
    background:#fff;border-radius:16px;padding:10px;box-shadow:0 16px 40px rgba(0,0,0,.18);
    z-index:9999;display:none
  }
  .chat-menu[data-open]{display:block}
  .chat-row{display:flex;align-items:center;gap:10px}
  .chat-ico{
    width:44px;height:44px;border-radius:999px;border:1px solid #e8ece9;background:#fff;
    display:flex;align-items:center;justify-content:center;cursor:pointer;
    transition:background .15s ease, transform .1s ease
  }
  .chat-ico:hover{background:#f7f6f3;transform:translateY(-1px)}
  .chat-ico svg{width:20px;height:20px}
  .toast{
    position:fixed;left:50%;transform:translateX(-50%);
    bottom:calc(140px + env(safe-area-inset-bottom));background:#0D2B1E;color:#fff;
    border-radius:10px;padding:8px 12px;font:500 13px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    z-index:10000;box-shadow:0 10px 25px rgba(0,0,0,.2);opacity:0;transition:opacity .2s ease
  }
  .toast[data-show]{opacity:1}`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  // ==== Текст заказа ====
  const getProgramTitle = () =>
    (document.querySelector('[data-program-title]')?.textContent?.trim()) ||
    (document.querySelector('meta[property="og:title"]')?.getAttribute('content')) ||
    (document.querySelector('.hero .title, .program-title, h1')?.textContent?.trim()) ||
    document.title.replace(/\s*[|—-].*$/, '').trim();

  const programId = (document.documentElement?.dataset?.programId) ||
                    (location.pathname.split('/').pop()||'').replace(/\.[a-z0-9]+$/i,'') || 'PAGE';

  const orderText =
`Здравствуйте! Хочу заказать тур.
— Программа: ${getProgramTitle()} (${programId})
— Страница: ${location.href}
— Даты: ____
— Гостей: ____
— Пожелания: ____`;

  // ==== Утилиты ====
  const copyToClipboard = async (txt) => {
    try {
      if (navigator.clipboard && window.isSecureContext) return await navigator.clipboard.writeText(txt);
    } catch(_) {}
    const ta = document.createElement('textarea'); ta.value = txt; ta.readOnly = true;
    ta.style.position = 'fixed'; ta.style.top = '-9999px'; document.body.appendChild(ta);
    ta.select(); try{ document.execCommand('copy'); }catch(_){} ta.remove();
  };
  const showToast = (msg) => {
    const d = document.createElement('div'); d.className='toast'; d.textContent = msg;
    document.body.appendChild(d); requestAnimationFrame(()=>d.setAttribute('data-show',''));
    setTimeout(()=>{ d.removeAttribute('data-show'); setTimeout(()=>d.remove(),250); }, 1800);
  };
  const openDeepLink = (deep, web) => {
    if (isiOS) {
      location.href = deep;
      setTimeout(()=>{ if (document.visibilityState === 'visible') window.open(web,'_blank','noopener'); }, 700);
      return;
    }
    if (isAndroid) {
      const intent = `intent://${deep.replace(/^.*?:\/\//,'')}` +
        `#Intent;scheme=tg;package=org.telegram.messenger;S.browser_fallback_url=${encodeURIComponent(web)};end`;
      try{ location.href = intent; }catch(_){ window.open(web,'_blank','noopener'); }
      return;
    }
    // desktop
    let w; try{ w = window.open(deep,'_blank'); }catch(_){}
    setTimeout(()=>{ try{ if(!w || w.closed) window.open(web,'_blank','noopener'); }catch(_){ window.open(web,'_blank','noopener'); } }, 350);
  };

  // ==== Telegram через БОТА ====
let tgLock = false;
async function openTelegramBot(){
  if (tgLock) return; tgLock = true;

  const CFG = window.APP_CONFIG || {};
  const BOT = (CFG.telegram_bot || '').replace(/^@/, '');
  const PRE = CFG.bot_prestart_url || '';
  if (!BOT || !PRE) { tgLock = false; return openTelegramProfile(); }

  const payload = {
    name: 'Site visitor',
    contact: 'telegram',
    date: new Date().toISOString().slice(0,10),
    guests: '1',
    message: '', // никаких копирований/вставок
    program: {
      title: (document.querySelector('[data-program-title]')?.textContent?.trim())
          || (document.querySelector('meta[property="og:title"]')?.content)
          || document.title,
      id: (document.documentElement?.dataset?.programId)
          || (location.pathname.split('/').pop()||'').replace(/\.[a-z0-9]+$/i,'') || 'PAGE',
      url: location.href
    }
  };

  let token = '';
  try{
    const r = await fetch(PRE, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), keepalive:true });
    const j = await r.json().catch(()=>null);
    token = String(j?.token || '');
  }catch(_){}

  if (!token) { tgLock = false; return openTelegramProfile(); }

  // Переходим к боту В ЭТОЙ ЖЕ ВКЛАДКЕ
  const urlWeb = `https://t.me/${BOT}?start=${encodeURIComponent(token)}`;
  window.location.href = urlWeb;

  setTimeout(()=>{ tgLock = false; }, 800);
}


  // Переходим к боту В ЭТОЙ ЖЕ ВКЛАДКЕ
  const urlWeb = `https://t.me/${BOT}?start=${encodeURIComponent(token)}`;
  window.location.href = urlWeb;

  setTimeout(()=>{ tgLock = false; }, 800);
}


  // ==== Telegram ПРОФИЛЬ ====
  async function openTelegramProfile(){
    const who = TG_USER || TG_BOT;
    if (!who) return; // нечего открывать
    const deep = `tg://resolve?domain=${who}`;
    const web  = `https://t.me/${who}`;
    try{ await copyToClipboard(orderText); showToast(t('toastCopied')); }catch(_){}
    openDeepLink(deep, web);
  }

  // ==== WhatsApp ====
  function openWhatsApp(){
    if (!WA_NUMBER) return;
    const wa = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(orderText)}`;
    window.open(wa, '_blank', 'noopener,noreferrer');
  }

  // ==== FAB ====
  const fab = document.createElement('button');
  fab.type='button'; fab.className='chat-fab'; fab.setAttribute('aria-label','Открыть мессенджеры');
  fab.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M2 12c0-5.5 4.8-10 10.7-10S24 6.5 24 12s-4.8 10-10.7 10c-1.6 0-3.2-.3-4.7-.9L2 22l1.2-5C2.4 15.3 2 13.7 2 12z"/></svg>`;
  document.body.appendChild(fab);

  const menu = document.createElement('div');
  menu.className='chat-menu';
  menu.innerHTML = `
    <div class="chat-row">
      <button class="chat-ico" type="button" data-a="wa" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a11.4 11.4 0 0 0-9.8 17.1L1 24l6.6-1.7A11.4 11.4 0 1 0 12 .5Zm5.9 16.5c-.2.5-1 .9-1.5 1-1.4.1-2.5-.5-3.6-1.1-1.1-.7-2-1.7-2.7-2.8-.5-.9-1.1-2-1-3.1 0-.5.3-1.3.8-1.5.4-.2.9-.2 1.2.2.3.5.7 1.2.8 1.3.1.3.1.5 0 .8-.1.3-.2.4-.4.6l-.3.3c-.2.2-.2.5-.1.7.4.8 1 1.5 1.7 2 .6.5 1.4.9 2.2 1 .3 0 .5 0 .7-.3l.3-.4c.2-.2.4-.3.7-.2.3 0 1.9.9 2.2 1.1.2.1.3.2.4.4.1.3.1.6 0 .9Z" fill="currentColor"/></svg>
      </button>
      <button class="chat-ico" type="button" data-a="tg" aria-label="Telegram">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.6 15.3 9.3 20c.5 0 .8-.2 1-.4l2.4-2.3 5-3.7c.9-.6 1.5-1.1 1.7-1.8.3-.6-.1-1-.9-.8l-6.8 2.6-2.8.9c-.6.2-1 .1-1.3 0-.3-.2-.3-.6.2-.9l4.5-2.2 6.1-3.2c.7-.3 1.2-.6 1.2-1 0-.3-.5-.4-1.2-.2l-10.6 4c-1 .4-1.7.9-1.7 1.5s.6.9 1.5 1l2 .3 7.8 4.9c.8.5 1.5.2 1.7-.7" fill="currentColor"/></svg>
      </button>
    </div>`;
  document.body.appendChild(menu);

  const toggle = () => menu.toggleAttribute('data-open');
  fab.addEventListener('click', toggle);

  menu.addEventListener('click', (e)=>{
    const btn = e.target.closest('.chat-ico'); if(!btn) return;
    const a = btn.dataset.a;
    if (a === 'wa') {
      openWhatsApp();
    } else {
      // Выбор режима
      if (TG_MODE === 'profile') openTelegramProfile();
      else if (TG_MODE === 'bot') {
        if (TG_BOT && PRE_URL) openTelegramBot(); else openTelegramProfile();
      } else { // auto
        if (TG_BOT && PRE_URL) openTelegramBot(); else openTelegramProfile();
      }
    }
    menu.removeAttribute('data-open');
  });

  document.addEventListener('click', (e)=>{
    if(menu.contains(e.target) || fab.contains(e.target)) return;
    menu.removeAttribute('data-open');
  }, true);
})();

