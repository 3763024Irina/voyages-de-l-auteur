/* chat-widget.js — мини-чат WA/TG, v2.2
   Требует: window.APP_CONFIG = {
     whatsapp,                 // номер (любая форма) -> очистится до цифр
     telegram_user?,           // username без @ (резерв)
     telegram_bot?,            // @бот (можно без @)
     telegram_open?='auto',    // 'auto' | 'bot' | 'profile'
     bot_prestart_url?,        // URL сервера: .../prestart (или .../health — заменим)
     chat_widget?='on'         // 'off' чтобы отключить виджет на странице
   }
*/
;(function(){
  if (window.__CHAT_WIDGET__) return; window.__CHAT_WIDGET__ = true;

  // ---------- helpers ----------
  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');
  const qs = (sel, root=document) => root.querySelector(sel);
  const enc = s => encodeURIComponent(String(s||''));

  function pageContext(){
    const html = document.documentElement;
    return {
      url: location.href,
      // предпочитаем явные заголовки, потом <title>
      title: qs('[data-program-title]')?.getAttribute?.('data-program-title')
          || qs('h1, .page-title, .title')?.textContent?.trim()
          || document.title
          || '',
      programId: html.getAttribute('data-program-id')
               || qs('[data-program-id]')?.getAttribute('data-program-id')
               || ''
    };
  }

  function pickField(form, names){
    for (const n of names){
      const v = form?.querySelector(`[name="${n}"]`)?.value?.trim();
      if (v) return v;
    }
    return '';
  }

  function buildQuickText(){
    const form = qs('[data-contact-form], [data-order-form]');
    const ctx  = pageContext();

    const base = [
      `Заявка с сайта Tours Languedoc by Irène`,
      ctx.programId ? `Программа: ${ctx.title} [${ctx.programId}]` : `Страница: ${ctx.title}`,
      `URL: ${ctx.url}`
    ];

    if (form){
      const date    = pickField(form, ['date']);
      const guests  = pickField(form, ['guests','persons','count']);
      const name    = pickField(form, ['name']);
      const contact = pickField(form, ['contact']);
      const message = pickField(form, ['message','notes']);

      const tail = [
        '—',
        date    && `Дата: ${date}`,
        guests  && `Гостей: ${guests}`,
        name    && `Имя: ${name}`,
        contact && `Контакт: ${contact}`,
        message && `Сообщение: ${message}`
      ].filter(Boolean);
      return base.concat(tail).join('\n');
    }
    return base.join('\n');
  }

  // ---------- навигация без window.open ----------
  function navigateSafely(href){
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.style.position='fixed'; a.style.left='-9999px';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>a.remove(), 300);
  }

  // ---------- WA ----------
  function openWA(e){
    e?.preventDefault?.(); e?.stopPropagation?.();
    const phone = digits(CFG.whatsapp || '');
    if (!phone){ alert('Не задан номер WhatsApp в APP_CONFIG.'); return; }
    const text = buildQuickText();
    navigateSafely(`https://wa.me/${phone}?text=${enc(text)}`);
  }

  // ---------- TG ----------
  async function openTG(e){
    e?.preventDefault?.(); e?.stopPropagation?.();
    const text = buildQuickText();

    // пробуем скопировать — удобно вставить в чат (в HTTPS)
    try{ await navigator.clipboard.writeText(text); }catch(_){}

    const user = (CFG.telegram_user||'').replace(/^@/,'');
    const bot  = (CFG.telegram_bot ||'').replace(/^@/,'');
    const mode = String(CFG.telegram_open||'auto').toLowerCase();

    let pre = String(CFG.bot_prestart_url||'')
                .replace(/\/health\/?$/,'/prestart')
                .replace(/\/$/,'/prestart');

    // 1) если есть prestart и бот, и режим разрешает — пробуем токен
    if ((mode==='auto' || mode==='bot') && bot && pre){
      try{
        const r = await fetch(pre, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            text,
            program: pageContext().programId || pageContext().title || '',
            url: location.href
          })
        });
        const j = await r.json().catch(()=>({}));

        if (j?.tme){                       // сервер дал готовую t.me-ссылку
          navigateSafely(j.tme);
          return;
        }
        if (j?.token){                     // deep-link для мобилы + веб fallback
          const deep = `tg://resolve?domain=${bot}&start=${enc(j.token)}`;
          try { location.href = deep; } catch(_) {}
          navigateSafely(`https://t.me/${bot}?start=${enc(j.token)}`);
          return;
        }
      }catch(_){ /* пойдём вfallback ниже */ }
    }

    // 2) принудительные режимы
    if (mode==='bot' && bot){ navigateSafely(`https://t.me/${bot}`); return; }
    if (mode==='profile' && user){ navigateSafely(`https://t.me/${user}`); return; }

    // 3) авто: сначала профиль, потом бот, потом официальный share
    if (user){ navigateSafely(`https://t.me/${user}`); return; }
    if (bot){  navigateSafely(`https://t.me/${bot}`);  return; }

    // 4) Share URL (всегда доступно)
    navigateSafely(`https://t.me/share/url?url=${enc(location.href)}&text=${enc(text)}`);
  }

  // ---------- стили ----------
  function injectStyles(){
    if (document.getElementById('chat-fab-css')) return;
    const s = document.createElement('style');
    s.id = 'chat-fab-css';
    s.textContent = `
      .chat-fab.cw{position:fixed; right:16px; z-index:9999; border:0; padding:14px; border-radius:999px;
                   box-shadow:0 6px 18px rgba(0,0,0,.18); cursor:pointer; background:#fff; color:#fff;
                   display:grid; place-items:center; transition:transform .12s ease, box-shadow .12s ease}
      .chat-fab.cw:hover{ transform: translateY(-1px); box-shadow:0 8px 22px rgba(0,0,0,.22) }
      .chat-fab.cw svg{width:22px; height:22px; display:block}
      .chat-fab.cw.wa{bottom:76px; background:#25D366}
      .chat-fab.cw.tg{bottom:26px; background:#229ED9}
      @media (max-width: 480px){
        .chat-fab.cw.wa{bottom:86px}
        .chat-fab.cw.tg{bottom:36px}
      }
    `;
    document.head.appendChild(s);
  }

  function makeBtn(cls, svg, onClick, label){
    const b = document.createElement('button');
    b.type='button';
    b.className='chat-fab cw '+cls;
    b.innerHTML=svg;
    b.setAttribute('aria-label',label);
    b.title=label;

    // защита от делегированных обработчиков
    const stop = e => { e.preventDefault(); e.stopPropagation(); };
    b.addEventListener('click', onClick, { passive:false });
    b.addEventListener('mousedown', stop, { passive:false });
    b.addEventListener('touchstart', stop, { passive:false });

    return b;
  }

  // биндим уже существующие элементы страницы
  function bindExisting(){
    const bindOne = (el, fn) => {
      if (!el || el.dataset.cwBound) return;
      el.addEventListener('click', (e)=>{ e.preventDefault(); fn(e); }, { passive:false });
      el.dataset.cwBound = '1';
    };

    document.querySelectorAll('[data-whatsapp]').forEach(el=> bindOne(el, openWA));
    document.querySelectorAll('[data-telegram]').forEach(el=> bindOne(el, openTG));
    document.querySelectorAll('[data-chat-open]').forEach(el=>{
      const mode = (el.getAttribute('data-chat-open')||'').toLowerCase();
      bindOne(el, mode==='whatsapp' ? openWA : openTG);
    });
  }

  function init(){
    // возможность глобально отключить виджет
    if (String((window.APP_CONFIG||{}).chat_widget||'on').toLowerCase()==='off') return;

    // если уже есть любые чат-кнопки — просто привяжем клики и выйдем (не рисуем свои)
    bindExisting();
    if (document.querySelector('.chat-fab, [data-chat-open], [data-whatsapp], [data-telegram]')) return;

    // иначе — ставим свои FAB
    injectStyles();

    const waSVG = `
      <svg viewBox="0 0 256 256" aria-hidden="true" role="img">
        <path fill="currentColor" d="M128 24a104 104 0 0 0-89.7 156.2L24 232l52.8-13.6A104 104 0 1 0 128 24m0 192a88 88 0 0 1-44.9-12.5l-3-1.8l-31.8 8.2l8.5-31l-1.9-3.1A88 88 0 1 1 128 216"/>
        <path fill="currentColor" d="M188.5 152.7c-2.9 8.4-13.9 15.6-22.6 17.6c-6 1.4-13.7 2.6-44.7-9.3c-37.5-14.9-61.7-53.4-63.5-55.8s-15.1-20.1-15.1-38.5s9.4-27.4 13-31.1s7.1-4.6 9.5-4.6s4.7 0 6.7.1s5.2-.8 8.1 6.2c2.9 7 9.9 24.2 10.7 26s1.2 3.6.2 5.8s-1.5 3.7-3 5.7c-1.5 2-3.1 4.5-4.5 6s-3 3.2-1.3 6.2s7.2 11.8 15.5 19.1c10.7 9.5 19.7 12.5 22.7 13.9s5 .9 6.9-.5s4-4.5 6.3-7.5s4.1-6.3 6.2-7.1s3.9-.4 6.5.4s16.9 8 19.8 9.4s4.9 2.2 5.6 3.4s.6 8.9-2.3 17.3"/>
      </svg>`;
    const tgSVG = `
      <svg viewBox="0 0 256 256" aria-hidden="true" role="img">
        <path fill="currentColor" d="M232.6 25.3a12 12 0 0 0-12.2-2.3L17.9 99.1A12 12 0 0 0 20 121l43.6 15.5l21 68.2a12 12 0 0 0 19.5 5.4l30.8-27.8l47.6 36.4a12 12 0 0 0 18.7-7.2l36.8-176a12 12 0 0 0-5.4-12.2M188.1 202.6l-40.1-30.7a12 12 0 0 0-15.4.6l-26 23.5l-16.2-52.7l99.4-62.1z"/>
      </svg>`;

    document.body.appendChild(makeBtn('wa', waSVG, openWA, 'WhatsApp'));
    document.body.appendChild(makeBtn('tg', tgSVG, openTG, 'Telegram'));
  }

  document.addEventListener('DOMContentLoaded', init, { once:true });
})();
);
