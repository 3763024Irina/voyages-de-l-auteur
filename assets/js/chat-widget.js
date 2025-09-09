<script>
;(function(){
  if (window.__CHAT_WIDGET__) return; window.__CHAT_WIDGET__ = true;

  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');

  function pageContext(){
    const html = document.documentElement;
    return {
      url: location.href,
      title: document.querySelector('h1, .page-title, title')?.textContent?.trim() || document.title,
      programId: html.getAttribute('data-program-id') || ''
    };
  }

  function makeBtn(cls, label, onClick){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chat-fab ' + cls;
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function openWA(){
    const ctx = pageContext();
    const phone = digits(CFG.whatsapp || '');
    if (!phone) return alert('Не задан номер WhatsApp в APP_CONFIG.');
    const text = `Здравствуйте! Интересуюсь: ${ctx.programId ? '['+ctx.programId+'] ' : ''}${ctx.title}\n${ctx.url}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  function openTG(){
    const ctx = pageContext();
    const bot = (CFG.telegram_bot || '').replace(/^@/,'');
    const user = (CFG.telegram_user || bot || '').replace(/^@/,'');
    if (!user) return alert('Не задан Telegram в APP_CONFIG.');
    window.open(`https://t.me/${user}`, '_blank', 'noopener');
  }

  function injectStyles(){
    if (document.getElementById('chat-fab-css')) return;
    const css = `
      .chat-fab{position:fixed; right:16px; z-index:9999; border:0; padding:10px 12px; border-radius:22px;
                box-shadow:0 6px 18px rgba(0,0,0,.18); cursor:pointer; font:600 14px/1.1 system-ui, -apple-system, Segoe UI, Roboto, Arial}
      .chat-fab + .chat-fab{margin-top:10px}
      .chat-fab.wa{bottom:76px}
      .chat-fab.tg{bottom:26px}
    `;
    const s = document.createElement('style');
    s.id = 'chat-fab-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  function init(){
    injectStyles();
    const wa = makeBtn('wa','WhatsApp', openWA);
    const tg = makeBtn('tg','Telegram', openTG);
    document.body.appendChild(wa);
    document.body.appendChild(tg);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
</script>
