/* assets/js/chat-widget.js — плавающие иконки чата (WA + TG, только иконки)
   По умолчанию: WhatsApp +33759644813, Telegram @de_iren.
   Можно переопределить через window.APP_CONFIG.whatsapp и .telegram_user.
*/
;(function(){
  if (window.__CHAT_WIDGET__) return; window.__CHAT_WIDGET__ = true;

  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');

  const WA_DEFAULT = '+33 7 59 64 48 13';
  const TG_DEFAULT = 'de_iren';

  /* ---- CSS ---- */
  const css = `
  [data-contact-panel]{display:none!important;} /* спрятать старую панель, если она есть */

  .chat-fab{ /* главная круглая кнопка (пузырь) */
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
    background:#fff; border-radius:16px; padding:10px;
    box-shadow:0 16px 40px rgba(0,0,0,.18); z-index:9999; display:none;
  }
  .chat-menu[data-open]{ display:block; }

  .chat-row{
    display:flex; align-items:center; gap:10px;
  }
  .chat-ico{
    width:44px; height:44px; border-radius:999px; border:1px solid #e8ece9;
    background:#fff; display:flex; align-items:center; justify-content:center;
    cursor:pointer;
    transition:background .15s ease, transform .1s ease;
  }
  .chat-ico:hover{ background:#f7f6f3; transform:translateY(-1px); }
  .chat-ico svg{ width:20px; height:20px; }
  `;
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  /* ---- Подготовка ссылок ---- */
  const getProgramTitle = () =>
    (document.querySelector('[data-program-title]')?.textContent?.trim()) ||
    (document.querySelector('h1')?.textContent?.trim()) || document.title;

  const text = `Здравствуйте! Интересуюсь программой: ${getProgramTitle()} — ${location.href}`;

  const waNum = digits(CFG.whatsapp || WA_DEFAULT);
  const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(text)}`;

  const tgUser = (CFG.telegram_user || TG_DEFAULT).replace(/^@/,'');
  // По тз — открыть профиль/чат с пользователем. (Если захотите вернуться к "share", замените строку ниже.)
  const tgUrl = `https://t.me/${tgUser}`;

  /* ---- FAB ---- */
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'chat-fab';
  fab.setAttribute('aria-label','Открыть быстрые мессенджеры');
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M2 12c0-5.5 4.8-10 10.7-10S24 6.5 24 12s-4.8 10-10.7 10c-1.6 0-3.2-.3-4.7-.9L2 22l1.2-5C2.4 15.3 2 13.7 2 12z"/>
    </svg>`;
  document.body.appendChild(fab);

  /* ---- Меню с ИКОНКАМИ ---- */
  const menu = document.createElement('div');
  menu.className = 'chat-menu';
  menu.innerHTML = `
    <div class="chat-row">
      <button class="chat-ico" type="button" data-a="wa" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 .5a11.4 11.4 0 0 0-9.8 17.1L1 24l6.6-1.7A11.4 11.4 0 1 0 12 .5Zm5.9 16.5c-.2.5-1 .9-1.5 1-1.4.1-2.5-.5-3.6-1.1-1.1-.7-2-1.7-2.7-2.8-.5-.9-1.1-2-1-3.1 0-.5.3-1.3.8-1.5.4-.2.9-.2 1.2.2.3.5.7 1.2.8 1.3.1.3.1.5 0 .8-.1.3-.2.4-.4.6l-.3.3c-.2.2-.2.5-.1.7.4.8 1 1.5 1.7 2 .6.5 1.4.9 2.2 1 .3 0 .5 0 .7-.3l.3-.4c.2-.2.4-.3.7-.2.3 0 1.9.9 2.2 1.1.2.1.3.2.4.4.1.3.1.6 0 .9Z" fill="currentColor"/>
        </svg>
      </button>
      <button class="chat-ico" type="button" data-a="tg" aria-label="Telegram">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9.6 15.3 9.3 20c.5 0 .8-.2 1-.4l2.4-2.3 5-3.7c.9-.6 1.5-1.1 1.7-1.8.3-.6-.1-1-.9-.8l-6.8 2.6-2.8.9c-.6.2-1 .1-1.3 0-.3-.2-.3-.6.2-.9l4.5-2.2 6.1-3.2c.7-.3 1.2-.6 1.2-1 0-.3-.5-.4-1.2-.2l-10.6 4c-1 .4-1.7.9-1.7 1.5s.6.9 1.5 1l2 .3 7.8 4.9c.8.5 1.5.2 1.7-.7" fill="currentColor"/>
        </svg>
      </button>
    </div>
  `;
  document.body.appendChild(menu);

  /* ---- Логика ---- */
  const toggle = () => menu.toggleAttribute('data-open');
  fab.addEventListener('click', toggle);

  // Копируем текст в буфер при клике (на случай вставки в WA)
  const copyFallback = () => { try { navigator.clipboard?.writeText(text); } catch(_){} };

  menu.addEventListener('click', (e)=>{
    const btn = e.target.closest('.chat-ico'); if(!btn) return;
    const a = btn.dataset.a;
    copyFallback();
    const href = (a==='wa') ? waUrl : tgUrl;
    window.open(href, '_blank', 'noopener,noreferrer');
    menu.removeAttribute('data-open');
  });

  // Закрытие по клику вне
  document.addEventListener('click', (e)=>{
    if(menu.contains(e.target) || fab.contains(e.target)) return;
    menu.removeAttribute('data-open');
  }, true);
})();
