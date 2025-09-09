/* contact.js — WA/TG для форм, героев и ФУТЕРА, v2.2
   Требует window.APP_CONFIG = { whatsapp, telegram_user? }
*/
;(function(){
  'use strict';
  if (window.__CONTACT_INIT__) return; window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const enc = s => encodeURIComponent(String(s||''));

  // ---------- utils ----------
  function navigateSafely(href){
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.position = 'fixed';
    a.style.left = '-9999px';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>a.remove(), 400);
  }

  function toast(msg){
    try{
      const note = document.createElement('div');
      note.textContent = msg;
      note.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:10px;font:600 14px/1.2 system-ui;z-index:99999;box-shadow:0 6px 18px rgba(0,0,0,.2)';
      document.body.appendChild(note);
      setTimeout(()=>note.remove(), 2200);
    }catch(_){}
  }

  // ---------- контекст страницы ----------
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

  // ---------- валидация формы ----------
  function validate(form){
    const need = ['date','guests','name','contact'];
    for (const n of need){
      const el = form.querySelector(`[name="${n}"]`);
      if (!el || !String(el.value||'').trim()){
        el?.focus();
        throw new Error('Пожалуйста, заполните дату, гостей, имя и контакт.');
      }
    }
  }

  // ---------- сбор текста заявки ----------
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
        `Гостей: ${f('guests') || f('persons') || f('count')}`,
        `Имя: ${f('name')}`,
        `Контакт: ${f('contact')}`
      );
      if (f('message') || f('notes')) lines.push(`Сообщение: ${f('message') || f('notes')}`);
    }else{
      // быстрый сбор, если на странице есть поля без явной формы
      const root = document;
      const get = n => root.querySelector(`[name="${n}"]`)?.value?.trim() || '';
      const date = get('date');
      const guests = get('guests') || get('persons') || get('count');
      if (date || guests){
        lines.push('—');
        if (date)   lines.push(`Дата: ${date}`);
        if (guests) lines.push(`Гостей: ${guests}`);
      }
    }
    return lines.filter(Boolean).join('\n');
  }

  // ---------- каналы ----------
  function openWhatsApp(text, e){
    e?.preventDefault?.(); e?.stopPropagation?.();
    const phone = digits(CFG.whatsapp || '');
    if (!phone) throw new Error('Не задан номер WhatsApp в APP_CONFIG.');
    navigateSafely(`https://wa.me/${phone}?text=${enc(text)}`);
  }

  function openTelegram(text, e){
    e?.preventDefault?.(); e?.stopPropagation?.();
    const user = (CFG.telegram_user || '').replace(/^@/,'');
    if (!user) throw new Error('Не задан Telegram username в APP_CONFIG (пример: "de_iren").');
    if (navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(text).catch(()=>{});
    }
    navigateSafely(`https://t.me/${enc(user)}`);
    toast('Текст заявки скопирован. Вставьте в Telegram и отправьте.');
  }

  // ---------- хелперы привязки ----------
  function hardenClickable(el){
    if (!el) return;
    if (!el.__hardened){
      el.__hardened = true;
      const stop = e => { e.preventDefault(); e.stopPropagation(); };
      el.addEventListener('mousedown', stop, { passive:false });
      el.addEventListener('touchstart', stop, { passive:false });
    }
    // если это <button>, не даём сабмитить формы
    if (el.tagName === 'BUTTON') el.setAttribute('type','button');
    // если это <a>, косметика
    if (el.tagName === 'A') { el.setAttribute('rel','noopener noreferrer'); el.setAttribute('target','_blank'); }
  }

  // ---------- кнопки глобально (герой, карточки, ФУТЕР) ----------
  function wireGlobalButtons(root=document){
    // 1) универсальные data-атрибуты
    qsa('[data-whatsapp]', root).forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true; hardenClickable(btn);
      btn.addEventListener('click', (e)=>{
        try{ openWhatsApp(buildMessage(null), e); }catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      }, { passive:false });
    });

    qsa('[data-telegram]', root).forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true; hardenClickable(btn);
      btn.addEventListener('click', (e)=>{
        try{ openTelegram(buildMessage(null), e); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      }, { passive:false });
    });

    // 2) селекторы для футера: классы .js-whatsapp / .js-telegram
    qsa('footer .js-whatsapp', root).forEach(el=>{
      if (el.__wired) return; el.__wired = true; hardenClickable(el);
      el.addEventListener('click', (e)=>{
        try{ openWhatsApp(buildMessage(null), e); }catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      }, { passive:false });
    });

    qsa('footer .js-telegram', root).forEach(el=>{
      if (el.__wired) return; el.__wired = true; hardenClickable(el);
      el.addEventListener('click', (e)=>{
        try{ openTelegram(buildMessage(null), e); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      }, { passive:false });
    });

    // 3) перехват «готовых» ссылок в футере (wa.me / t.me), чтобы подставить наш текст
    qsa('footer a[href*="wa.me/"]', root).forEach(a=>{
      if (a.__wired) return; a.__wired = true; hardenClickable(a);
      a.addEventListener('click', (e)=>{
        try{ openWhatsApp(buildMessage(null), e); }catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      }, { passive:false });
    });

    qsa('footer a[href^="https://t.me/"], footer a[href^="tg://"]', root).forEach(a=>{
      if (a.__wired) return; a.__wired = true; hardenClickable(a);
      a.addEventListener('click', (e)=>{
        try{ openTelegram(buildMessage(null), e); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      }, { passive:false });
    });
  }

  // ---------- кнопки в форме (.form-actions ...) ----------
  function wireForm(form){
    if (!form || form.__wired) return; form.__wired = true;

    const card = form.closest('.card') || form;
    const waBtn = card.querySelector('.form-actions [data-whatsapp], .form-actions .js-whatsapp');
    const tgBtn = card.querySelector('.form-actions [data-telegram], .form-actions .js-telegram');

    if (waBtn && !waBtn.__wired){
      waBtn.__wired = true; hardenClickable(waBtn);
      waBtn.addEventListener('click', (e)=>{
        try{ validate(form); openWhatsApp(buildMessage(form), e); }catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      }, { passive:false });
    }
    if (tgBtn && !tgBtn.__wired){
      tgBtn.__wired = true; hardenClickable(tgBtn);
      tgBtn.addEventListener('click', (e)=>{
        try{ validate(form); openTelegram(buildMessage(form), e); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      }, { passive:false });
    }
  }

  function init(){
    // глобальные (герой + футер + любые data-атрибуты)
    wireGlobalButtons(document);

    // формы
    qsa('[data-contact-form], [data-order-form]').forEach(wireForm);
  }

  document.addEventListener('DOMContentLoaded', init, { once:true });

  // на случай динамической подгрузки футера/секции — лёгкий наблюдатель
  const mo = new MutationObserver((muts)=>{
    for (const m of muts){
      if (m.type === 'childList'){
        wireGlobalButtons(document);
        qsa('[data-contact-form], [data-order-form]').forEach(wireForm);
      }
    }
  });
  mo.observe(document.documentElement, { childList:true, subtree:true });
})();

