;(function(){
  'use strict';
  if (window.__CONTACT_INIT__) return; window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qs  = (sel, root=document) => root.querySelector(sel);
  const digits = s => String(s||'').replace(/\D/g,'');

  function pageContext(){
    const html = document.documentElement, body = document.body;
    const title = qs('h1, .page-title, .title')?.textContent?.trim() || document.title || '';
    return {
      url: location.href,
      title,
      programId: body.getAttribute('data-program-id') || html.getAttribute('data-program-id') || '',
      programTitle: body.getAttribute('data-program-title') || html.getAttribute('data-program-title') || title
    };
  }

  function buildMessage(form=null){
    const ctx = pageContext();
    const f = n => form?.querySelector(`[name="${n}"]`)?.value?.trim() || '';
    const lines = [
      'Заявка с сайта Tours Languedoc by Irène',
      ctx.programId ? `Программа: ${ctx.programTitle} [${ctx.programId}]` : `Страница: ${ctx.title}`,
      `URL: ${ctx.url}`
    ];
    if (form){
      lines.push('—', `Дата: ${f('date')}`, `Гостей: ${f('guests')}`, `Имя: ${f('name')}`, `Контакт: ${f('contact')}`);
      if (f('message')) lines.push(`Сообщение: ${f('message')}`);
    }
    return lines.filter(Boolean).join('\n');
  }

  function validate(form){
    if (!form) return;
    for (const n of ['date','guests','name','contact']){
      const el = form.querySelector(`[name="${n}"]`);
      if (!el || !String(el.value||'').trim()){ el?.focus(); throw new Error('Заполните: дату, гостей, имя и контакт.'); }
    }
  }

  function openWA(text){
    const phone = digits(CFG.whatsapp || '');
    if (!phone) { alert('Не задан номер WhatsApp в APP_CONFIG.'); return; }
    const a = document.createElement('a');
    a.href = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    a.target = '_blank'; a.rel='noopener';
    document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(), 50);
  }

  // --- ВАЖНО: новый openTG без ожидания в обработчике клика ---
  async function openTG(text){
    const bot = (CFG.telegram_bot || '').replace(/^@/,'');
    const user = (CFG.telegram_user || '').replace(/^@/,'');
    const pre  = CFG.bot_prestart_url || '';
    const UA   = navigator.userAgent;
    const isMobile  = /(iPad|iPhone|iPod|Android)/i.test(UA);

    const domain = bot || user;
    if (!domain) { alert('Не задан Telegram (bot или username) в APP_CONFIG.'); return; }

    const deepBase = `tg://resolve?domain=${domain}`;
    const webBase  = `https://t.me/${domain}`;

    const openURL = (url)=>{
      if (isMobile) {
        try { location.href = url; }
        catch(_){
          const a=document.createElement('a'); a.href=url; a.target='_self';
          document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),50);
        }
      } else {
        const a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener';
        document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),50);
      }
    };

    openURL(deepBase);

    if (bot && pre){
      try{
        const res = await fetch(pre.replace(/\/health\/?$/,'/prestart'), {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ text, page: location.href })
        });
        if (res.ok){
          const data = await res.json();
          if (data && data.token){
            setTimeout(()=> openURL(`tg://resolve?domain=${bot}&start=${encodeURIComponent(data.token)}`), 200);
          }
        }
      }catch(_){}
    }

    setTimeout(()=> openURL(webBase), 1200);
  }

  function wireForm(){
    const form = qs('[data-contact-form]');
    if (!form) return;
    const waBtn = form.querySelector('[data-whatsapp]');
    const tgBtn = form.querySelector('[data-telegram]');
    if (waBtn && !waBtn.__wired){
      waBtn.__wired = true; waBtn.setAttribute('type','button');
      waBtn.addEventListener('click', e=>{
        e.preventDefault();
        try{ validate(form); openWA(buildMessage(form)); }catch(err){ alert(err.message); }
      }, {passive:false});
    }
    if (tgBtn && !tgBtn.__wired){
      tgBtn.__wired = true; tgBtn.setAttribute('type','button');
      // ВАЖНО: без async/await
      tgBtn.addEventListener('click', e=>{
        e.preventDefault();
        try{ validate(form); openTG(buildMessage(form)); }catch(err){ alert(err.message); }
      }, {passive:false});
    }
  }

  document.addEventListener('DOMContentLoaded', wireForm, {once:true});
})();
