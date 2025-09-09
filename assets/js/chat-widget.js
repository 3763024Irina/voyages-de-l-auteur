<script>
;(function(){
  if (window.__CHAT_WIDGET__) return; window.__CHAT_WIDGET__ = true;

  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');
  const qs = (sel, root=document) => root.querySelector(sel);

  function pageContext(){
    const html = document.documentElement;
    return {
      url: location.href,
      title: qs('h1, .page-title, .title')?.textContent?.trim() || document.title || '',
      programId: html.getAttribute('data-program-id') || qs('[data-program-id]')?.getAttribute('data-program-id') || ''
    };
  }

  function buildQuickText(){
    const form = qs('[data-contact-form], [data-order-form]');
    const get = n => form?.querySelector(`[name="${n}"]`)?.value?.trim() || '';
    const ctx = pageContext();

    const base = [
      `Заявка с сайта Tours Languedoc by Irène`,
      ctx.programId ? `Программа: ${ctx.title} [${ctx.programId}]` : `Страница: ${ctx.title}`,
      `URL: ${ctx.url}`
    ];

    if (form){
      const tail = [
        `—`,
        get('date')    ? `Дата: ${get('date')}`       : '',
        get('guests')  ? `Гостей: ${get('guests')}`   : '',
        get('name')    ? `Имя: ${get('name')}`        : '',
        get('contact') ? `Контакт: ${get('contact')}` : '',
        get('message') ? `Сообщение: ${get('message')}` : ''
      ].filter(Boolean);
      return base.concat(tail).join('\n');
    }
    return base.join('\n');
  }

  // ---------- надёжное открытие через скрытые <a>, без window.open ----------
  function navigateSafely(href){
    // создаём одноразовую ссылку и кликаем
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    // в iOS/Android иногда помогает принудительное добавление в DOM
    a.style.position = 'fixed';
    a.style.left = '-9999px';
    document.body.appendChild(a);
    a.click();
    // небольшая задержка перед удалением — чтобы не было сбоев на iOS WebKit
    setTimeout(() => a.remove(), 500);
  }

  function openWA(e){
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const phone = digits(CFG.whatsapp || '');
    if (!phone){
      alert('Не задан номер WhatsApp в APP_CONFIG.');
      return;
    }
    const text = buildQuickText();
    const href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    navigateSafely(href);
  }

  function openTG(e){
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const text = buildQuickText();
    // офиц. шаринг Telegram — на мобилках открывает приложение, на десктопе — Web/Native TG
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;
    navigateSafely(shareUrl);
  }

  // ---------- стили кнопок ----------
  function injectStyles(){
    if (document.getElementById('chat-fab-css')) return;
    const css = `
      .chat-fab{position:fixed; right:16px; z-index:9999; border:0; padding:14px; border-radius:999px;
                box-shadow:0 6px 18px rgba(0,0,0,.18); cursor:pointer; background:#fff; display:grid; place-items:center}
      .chat-fab svg{width:22px; height:22px; display:block}
      .chat-fab.wa{bottom:76px}
      .chat-fab.tg{bottom:26px}
      @media (max-width: 480px){
        .chat-fab.wa{bottom:86px}
        .chat-fab.tg{bottom:36px}
      }
    `;
    const s = document.createElement('style');
    s.id = 'chat-fab-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  function makeBtn(cls, svg, onClick, label){
    const b = document.createElement('button');
    b.type = 'button'; // защита от submit в формах
    b.className = 'chat-fab ' + cls;
    b.innerHTML = svg;
    b.setAttribute('aria-label', label);
    b.title = label;

    // Жёстко блокируем любые делегированные обработчики сверху
    b.addEventListener('click', onClick, { passive: false });
    b.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); }, { passive: false });
    b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); }, { passive: false });

    return b;
  }

  function init(){
    injectStyles();

    const waSVG = `
      <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
        <path fill="#05a884" d="M128 24a104 104 0 0 0-89.7 156.2L24 232l52.8-13.6A104 104 0 1 0 128 24m0 192a88 88 0 0 1-44.9-12.5l-3-1.8l-31.8 8.2l8.5-31l-1.9-3.1A88 88 0 1 1 128 216"/>
        <path fill="#05a884" d="M188.5 152.7c-2.9 8.4-13.9 15.6-22.6 17.6c-6 1.4-13.7 2.6-44.7-9.3c-37.5-14.9-61.7-53.4-63.5-55.8s-15.1-20.1-15.1-38.5s9.4-27.4 13-31.1s7.1-4.6 9.5-4.6s4.7 0 6.7.1s5.2-.8 8.1 6.2c2.9 7 9.9 24.2 10.7 26s1.2 3.6.2 5.8s-1.5 3.7-3 5.7c-1.5 2-3.1 4.5-4.5 6s-3 3.2-1.3 6.2s7.2 11.8 15.5 19.1c10.7 9.5 19.7 12.5 22.7 13.9s5 .9 6.9-.5s4-4.5 6.3-7.5s4.1-6.3 6.2-7.1s3.9-.4 6.5.4s16.9 8 19.8 9.4s4.9 2.2 5.6 3.4s.6 8.9-2.3 17.3"/>
      </svg>`;
    const tgSVG = `
      <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img">
        <path fill="#008ad6" d="M232.6 25.3a12 12 0 0 0-12.2-2.3L17.9 99.1A12 12 0 0 0 20 121l43.6 15.5l21 68.2a12 12 0 0 0 19.5 5.4l30.8-27.8l47.6 36.4a12 12 0 0 0 18.7-7.2l36.8-176a12 12 0 0 0-5.4-12.2M188.1 202.6l-40.1-30.7a12 12 0 0 0-15.4.6l-26 23.5l-16.2-52.7l99.4-62.1z"/>
      </svg>`;

    document.body.appendChild(makeBtn('wa', waSVG, openWA, 'WhatsApp'));
    document.body.appendChild(makeBtn('tg', tgSVG, openTG, 'Telegram'));
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
</script>
