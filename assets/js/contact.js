<script>
;(function(){
  'use strict';
  if (window.__CONTACT_INIT__) return; window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');
  const qs = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // ---------- контекст страницы/программы ----------
  function pageContext(){
    const html = document.documentElement;
    const ctx = {
      url: location.href,
      title: qs('h1, .page-title, .title')?.textContent?.trim() || document.title || '',
      programId: html.getAttribute('data-program-id') || qs('[data-program-id]')?.getAttribute('data-program-id') || '',
      programTitle: html.getAttribute('data-program-title') || qs('[data-program-title]')?.getAttribute('data-program-title') || '',
      programPrice: html.getAttribute('data-program-price') || qs('[data-program-price]')?.getAttribute('data-program-price') || ''
    };
    if (!ctx.programTitle) ctx.programTitle = ctx.title;
    return ctx;
  }

  // ---------- валидация формы ----------
  function validate(form){
    const need = ['date','guests','name','contact']; // message — опционален
    for (const n of need){
      const el = form.querySelector(`[name="${n}"]`);
      if (!el || !String(el.value||'').trim()){
        el?.focus(); throw new Error('Пожалуйста, заполните все обязательные поля.');
      }
    }
  }

  // ---------- сбор текста заказа ----------
  function buildMessage(form=null){
    const ctx = pageContext();
    const f = name => form?.querySelector(`[name="${name}"]`)?.value?.trim() || '';

    const lines = [
      `Заявка с сайта Tours Languedoc by Irène`,
      ctx.programId ? `Программа: ${ctx.programTitle} [${ctx.programId}]` : `Страница: ${ctx.title}`,
      ctx.programPrice ? `Пакет/цена: ${ctx.programPrice}` : '',
      `URL: ${ctx.url}`,
      `—`,
      form ? `Дата: ${f('date')}` : '',
      form ? `Гостей: ${f('guests')}` : '',
      form ? `Имя: ${f('name')}` : '',
      form ? `Контакт: ${f('contact')}` : '',
      form ? `Сообщение: ${f('message')}` : ''
    ].filter(Boolean);

    return lines.join('\n');
  }

  // ---------- каналы ----------
  function openWhatsApp(text){
    const phone = digits(CFG.whatsapp || '');
    if (!phone) throw new Error('Не задан номер WhatsApp в APP_CONFIG.');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  }

  async function openTelegram(text){
    const bot = (CFG.telegram_bot || '').replace(/^@/,'');
    const pre = CFG.bot_prestart_url || '';
    // приоритет: если есть бот + prestart — выписываем токен и открываем бота с /start
    if (bot && pre){
      try{
        const payload = { text, page: location.href };
        const res = await fetch(pre.replace(/\/health\/?$/,'/prestart'), {
          method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data && data.token){
          window.open(`https://t.me/${bot}?start=${encodeURIComponent(data.token)}`, '_blank', 'noopener');
          return;
        }
      }catch(e){ /* тихий фоллбэк ниже */ }
    }
    // фоллбэк: профиль (или сам бот) без токена
    const user = (CFG.telegram_user || bot || '').replace(/^@/,'');
    if (!user) throw new Error('Не задан Telegram в APP_CONFIG.');
    window.open(`https://t.me/${user}`, '_blank', 'noopener');
  }

  // ---------- провода ----------
  function wireHeroButtons(){
    // кнопки в герое
    qsa('[data-whatsapp]').forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true;
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        try{ openWhatsApp(buildMessage(null)); }catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      });
    });
    qsa('[data-telegram]').forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true;
      btn.addEventListener('click', async (e)=>{
        e.preventDefault();
        try{ await openTelegram(buildMessage(null)); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      });
    });
  }

  function wireForm(form){
    if (!form || form.__wired) return; form.__wired = true;

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      try{
        validate(form);
        const text = buildMessage(form);
        const channel = (form.querySelector('[name="channel"]')?.value || 'telegram').toLowerCase();
        if (channel === 'whatsapp') openWhatsApp(text);
        else await openTelegram(text);
      }catch(err){ alert(err.message||'Не удалось отправить заявку'); }
    });

    // дубль-кнопки под формой (если нажали их, а не submit)
    const wa = form.closest('.card')?.querySelector('.form-actions [data-whatsapp]');
    const tg = form.closest('.card')?.querySelector('.form-actions [data-telegram]');
    if (wa && !wa.__wired){
      wa.__wired = true;
      wa.addEventListener('click', (e)=>{
        e.preventDefault();
        try{ validate(form); openWhatsApp(buildMessage(form)); }catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      });
    }
    if (tg && !tg.__wired){
      tg.__wired = true;
      tg.addEventListener('click', async (e)=>{
        e.preventDefault();
        try{ validate(form); await openTelegram(buildMessage(form)); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      });
    }
  }

  function init(){
    wireHeroButtons();
    // формы брони на странице
    qsa('[data-contact-form], [data-order-form]').forEach(wireForm);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
</script>

