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
    // попробуем взять ближайшую форму (если есть) — чтобы подтянуть выбранные дата/гостей/контакты
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
        get('date') ? `Дата: ${get('date')}` : '',
        get('guests') ? `Гостей: ${get('guests')}` : '',
        get('name') ? `Имя: ${get('name')}` : '',
        get('contact') ? `Контакт: ${get('contact')}` : '',
        get('message') ? `Сообщение: ${get('message')}` : ''
      ].filter(Boolean);
      return base.concat(tail).join('\n');
    }
    return base.join('\n');
  }

  function openWA(){
    const phone = digits(CFG.whatsapp || '');
    if (!phone) return alert('Не задан номер WhatsApp в APP_CONFIG.');
    const text = buildQuickText();
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  async function openTG(){
    const text = buildQuickText();
    const bot = (CFG.telegram_bot || '').replace(/^@/,'');
    const pre = CFG.bot_prestart_url || '';
    if (bot && pre){
      try{
        const res = await fetch(pre.replace(/\/health\/?$/,'/prestart'), {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, page: location.href })
        });
        const data = await res.json();
        if (data && data.token){
          window.open(`https://t.me/${bot}?start=${encodeURIComponent(data.token)}`, '_blank', 'noopener');
          return;
        }
      }catch(e){}
    }
    const user = (CFG.telegram_user || bot || '').replace(/^@/,'');
    if (!user) return alert('Не задан Telegram в APP_CONFIG.');
    window.open(`https://t.me/${user}`, '_blank', 'noopener');
  }

  function injectStyles(){
    if (document.getElementById('chat-fab-css')) return;
    const css = `
      .chat-fab{position:fixed; right:16px; z-index:9999; border:0; padding:12px 14px; border-radius:22px;
                box-shadow:0 6px 18px rgba(0,0,0,.18); cursor:pointer; font:600 14px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#fff}
      .chat-fab + .chat-fab{margin-top:10px}
      .chat-fab.wa{bottom:76px}
      .chat-fab.tg{bottom:26px}
    `;
    const s = document.createElement('style');
    s.id = 'chat-fab-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  function makeBtn(cls, label, onClick){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chat-fab ' + cls; b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function init(){
    injectStyles();
    document.body.appendChild(makeBtn('wa','WhatsApp', openWA));
    document.body.appendChild(makeBtn('tg','Telegram', openTG));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
</script>
</script>
