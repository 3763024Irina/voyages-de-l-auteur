<script>
;(function(){
  'use strict';
  if (window.__CONTACT_INIT__) return; window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // -------- контекст страницы --------
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

  // -------- валидация --------
  function validate(form){
    const need = ['date','guests','name','contact']; // message — опционален
    for (const n of need){
      const el = form.querySelector(`[name="${n}"]`);
      if (!el || !String(el.value||'').trim()){
        el?.focus(); throw new Error('Пожалуйста, заполните все обязательные поля.');
      }
    }
  }

  // -------- сбор текста --------
  function buildMessage(form=null){
    const ctx = pageContext();
    const f = name => form?.querySelector(`[name="${name}"]`)?.value?.trim() || '';

    const parts = [
      `Заявка с сайта Tours Languedoc by Irène`,
      ctx.programId ? `Программа: ${ctx.programTitle} [${ctx.programId}]` : `Страница: ${ctx.title}`,
      ctx.programPrice ? `Пакет/цена: ${ctx.programPrice}` : '',
      `URL: ${ctx.url}`,
      form ? '—' : '',
      form ? `Дата: ${f('date')}` : '',
      form ? `Гостей: ${f('guests')}` : '',
      form ? `Имя: ${f('name')}` : '',
      form ? `Контакт: ${f('contact')}` : '',
      form ? (f('message') ? `Сообщение: ${f('message')}` : '') : ''
    ].filter(Boolean);

    return parts.join('\n');
  }

  // -------- каналы --------
  function openWhatsApp(text){
    const phone = digits(CFG.whatsapp || '');
    if (!phone) throw new Error('Не задан номер WhatsApp в APP_CONFIG.');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  async function openTelegram(text){
    const bot = (CFG.telegram_bot || '').replace(/^@/,'');
    const pre = CFG.bot_prestart_url || '';
    if (bot && pre){
      try{
        const res = await fetch(pre.replace(/\/health\/?$/,'/prestart'), {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ text, page: location.href })
        });
        const data = await res.json();
        if (data && data.token){
          window.open(`https://t.me/${bot}?start=${encodeURIComponent(data.token)}`, '_blank', 'noopener');
          return;
        }
      }catch(e){ /* fallback ниже */ }
    }
    const user = (CFG.telegram_user || bot || '').replace(/^@/,'');
    if (!user) throw new Error('Не задан Telegram в APP_CONFIG.');
    window.open(`https://t.me/${user}`, '_blank', 'noopener');
  }

  // -------- кнопки в герое --------
  function wireHero(){
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

  // -------- форма без submit: только WA/TG --------
  function wireForm(form){
    if (!form || form.__wired) return; form.__wired = true;

    const waBtn = form.closest('.card')?.querySelector('.form-actions [data-whatsapp]');
    const tgBtn = form.closest('.card')?.querySelector('.form-actions [data-telegram]');

    if (waBtn && !waBtn.__wired){
      waBtn.__wired = true;
      waBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        try{ validate(form); openWhatsApp(buildMessage(form)); }catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      });
    }
    if (tgBtn && !tgBtn.__wired){
      tgBtn.__wired = true;
      tgBtn.addEventListener('click', async (e)=>{
        e.preventDefault();
        try{ validate(form); await openTelegram(buildMessage(form)); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      });
    }
  }

  function init(){
    wireHero();
    qsa('[data-contact-form], [data-order-form]').forEach(wireForm);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
</script>

