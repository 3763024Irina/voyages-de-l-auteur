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
    const html = document.documentElement, body = document.body;
    const ctx = {
      url: location.href,
      title: qs('h1, .page-title, .title')?.textContent?.trim() || document.title || '',
      programId: body.getAttribute('data-program-id') || html.getAttribute('data-program-id') || '',
      programTitle: body.getAttribute('data-program-title') || html.getAttribute('data-program-title') || '',
      programPrice: body.getAttribute('data-program-price') || html.getAttribute('data-program-price') || ''
    };
    if (!ctx.programTitle) ctx.programTitle = ctx.title;
    return ctx;
  }

  // -------- валидация формы --------
  function validate(form){
    const need = ['date','guests','name','contact']; // message — опционален
    for (const n of need){
      const el = form.querySelector(`[name="${n}"]`);
      if (!el || !String(el.value||'').trim()){
        el?.focus(); throw new Error('Пожалуйста, заполните дату, гостей, имя и контакт.');
      }
    }
  }

  // -------- сбор текста заявки --------
  function buildMessage(form=null){
    const ctx = pageContext();
    const f = name => form?.querySelector(`[name="${name}"]`)?.value?.trim() || '';

    const lines = [
      `Заявка с сайта Tours Languedoc by Irène`,
      ctx.programId ? `Программа: ${ctx.programTitle} [${ctx.programId}]` : `Страница: ${ctx.title}`,
      ctx.programPrice ? `Пакет/цена: ${ctx.programPrice}` : '',
      `URL: ${ctx.url}`
    ];

    if (form){
      lines.push(
        '—',
        `Дата: ${f('date')}`,
        `Гостей: ${f('guests')}`,
        `Имя: ${f('name')}`,
        `Контакт: ${f('contact')}`
      );
      if (f('message')) lines.push(`Сообщение: ${f('message')}`);
    }

    return lines.filter(Boolean).join('\n');
  }

  // -------- каналы --------
  function openWhatsApp(text){
    const phone = digits(CFG.whatsapp || '');
    if (!phone) throw new Error('Не задан номер WhatsApp в APP_CONFIG.');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  // ✅ Telegram SHARE (без бэкенда): откроет окно «Поделиться» с заполненным текстом
  function openTelegram(text){
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'noopener');
  }

  // -------- кнопки в герое (data-whatsapp / data-telegram) --------
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
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        try{ openTelegram(buildMessage(null)); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      });
    });
  }

  // -------- кнопки в форме (.form-actions [data-whatsapp]/[data-telegram]) --------
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
      tgBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        try{ validate(form); openTelegram(buildMessage(form)); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
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

