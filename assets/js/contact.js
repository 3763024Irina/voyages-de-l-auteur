/* contact.js — WA/TG для форм, героев и ФУТЕРА, v2.3
   Требует window.APP_CONFIG = { whatsapp, telegram_user?, telegram_mode?('profile'|'share') }
*/
;(function(){
  'use strict';
  if (window.__CONTACT_INIT__) return; window.__CONTACT_INIT__ = true;

  const CFG    = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const enc = s => encodeURIComponent(String(s||''));

  // ---------- utils ----------
  function navigateSafely(href){
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.style.position = 'fixed'; a.style.left = '-9999px';
    document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(), 400);
  }
  function toast(msg){
    try{
      const note = document.createElement('div');
      note.textContent = msg;
      note.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:10px;font:600 14px/1.2 system-ui;z-index:99999;box-shadow:0 6px 18px rgba(0,0,0,.2)';
      document.body.appendChild(note); setTimeout(()=>note.remove(), 2200);
    }catch(_){}
  }

  // ---------- контекст страницы ----------
  function pageContext(){
    const html = document.documentElement, body = document.body;
    const any = qs('[data-program-id],[data-program-title],[data-program-price]');

    const ctx = {
      url: location.href,
      title: qs('h1, .page-title, .title')?.textContent?.trim() || document.title || '',
      programId:    (any && any.getAttribute('data-program-id'))    || body.getAttribute('data-program-id') || html.getAttribute('data-program-id') || '',
      programTitle: (any && any.getAttribute('data-program-title')) || body.getAttribute('data-program-title') || html.getAttribute('data-program-title') || '',
      programPrice: (any && any.getAttribute('data-program-price')) || body.getAttribute('data-program-price') || html.getAttribute('data-program-price') || ''
    };
    if (!ctx.programTitle) ctx.programTitle = ctx.title;
    return ctx;
  }

  // ---------- валидация формы ----------
  function validate(form){
    // подхватываем возможные синонимы
    const req = {
      date: ['date', 'in-when', 'when'],
      guests: ['guests','persons','count','people'],
      name: ['name','fullname','fio'],
      contact: ['contact','phone','email','telegram','whatsapp']
    };

    function hasAny(names){
      for (const n of names){
        const el = form.querySelector(`[name="${n}"]`);
        if (el && String(el.value||'').trim()) return true;
      }
      return false;
    }

    if (!hasAny(req.date))   { (form.querySelector('[name="date"],[name="in-when"],[name="when"]')||{}).focus?.();   throw new Error('Пожалуйста, укажите дату.'); }
    if (!hasAny(req.guests)) { (form.querySelector('[name="guests"],[name="persons"],[name="count"],[name="people"]')||{}).focus?.(); throw new Error('Укажите количество гостей.'); }
    if (!hasAny(req.name))   { (form.querySelector('[name="name"],[name="fullname"],[name="fio"]')||{}).focus?.();    throw new Error('Введите имя.'); }
    if (!hasAny(req.contact)){ (form.querySelector('[name="contact"],[name="phone"],[name="email"],[name="telegram"],[name="whatsapp"]')||{}).focus?.(); throw new Error('Добавьте контакт для связи.'); }
  }

  // ---------- сбор текста заявки ----------
  function buildMessage(form=null){
    const ctx = pageContext();
    const f = name => form?.querySelector(`[name="${name}"]`)?.value?.trim() || '';

    const readGuests = () => f('guests') || f('persons') || f('count') || f('people') || '';
    const readContact = () => f('contact') || f('phone') || f('email') || f('telegram') || f('whatsapp') || '';

    const lines = [
      `Заявка с сайта Tours Languedoc by Irène`,
      ctx.programId ? `Программа: ${ctx.programTitle} [${ctx.programId}]` : `Страница: ${ctx.title}`,
      ctx.programPrice ? `Пакет/цена: ${ctx.programPrice}` : '',
      `URL: ${ctx.url}`
    ];

    if (form){
      lines.push(
        '—',
        `Дата: ${f('date') || f('in-when') || f('when')}`,
        `Гостей: ${readGuests()}`,
        `Имя: ${f('name') || f('fullname') || f('fio')}`,
        `Контакт: ${readContact()}`
      );
      const msg = f('message') || f('notes') || '';
      if (msg) lines.push(`Сообщение: ${msg}`);
    } else {
      // быстрый сбор с страницы (если кто-то заполнил поля без формы)
      const root = document;
      const get = n => root.querySelector(`[name="${n}"]`)?.value?.trim() || '';
      const date   = get('date') || get('in-when') || get('when');
      const guests = get('guests') || get('persons') || get('count') || get('people');
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

    const mode = String(CFG.telegram_mode || 'profile').toLowerCase();
    const user = (CFG.telegram_user || '').replace(/^@/,'');
    if (!user && mode === 'profile') throw new Error('Не задан Telegram username в APP_CONFIG (пример: "de_iren").');

    // Копируем текст (если можно)
    if (navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(text).catch(()=>{});
    }

    const ctx = pageContext();
    if (mode === 'share'){
      // встроенный Telegram share — текст сразу подставится, пользователь сам выбирает чат
      const shareUrl = `https://t.me/share/url?url=${enc(ctx.url)}&text=${enc(text)}`;
      navigateSafely(shareUrl);
      toast('Текст заявки скопирован. Выберите чат в Telegram и отправьте.');
      return;
    }

    // режим profile — открываем конкретный профиль/чат
    const deep = `tg://resolve?domain=${encodeURIComponent(user)}`;
    const web  = `https://t.me/${encodeURIComponent(user)}`;
    const isMobile = /(iPad|iPhone|iPod|Android)/i.test(navigator.userAgent);

    if (isMobile) {
      try { location.href = deep; } catch(_){}
      setTimeout(()=>{ try{ location.href = web; }catch(_){ navigateSafely(web); } }, 1200);
    } else {
      navigateSafely(web);
    }
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
    if (el.tagName === 'BUTTON') el.setAttribute('type','button');
    if (el.tagName === 'A') { el.setAttribute('rel','noopener noreferrer'); el.setAttribute('target','_blank'); }
  }

  // ---------- кнопки глобально (герой, карточки, ФУТЕР) ----------
  function wireGlobalButtons(root=document){
    const nearestForm = () => qs('[data-contact-form],[data-order-form]', document);

    function withMaybeForm(handler){
      return (e)=>{
        const form = nearestForm();
        try{
          if (form){
            validate(form);
            handler(buildMessage(form), e);
          } else {
            handler(buildMessage(null), e);
          }
        }catch(err){
          alert(err.message || 'Заполните обязательные поля.');
        }
      };
    }

    // data-атрибуты
    qsa('[data-whatsapp]', root).forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true; hardenClickable(btn);
      btn.addEventListener('click', withMaybeForm(openWhatsApp), { passive:false });
    });

    qsa('[data-telegram]', root).forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true; hardenClickable(btn);
      btn.addEventListener('click', withMaybeForm(openTelegram), { passive:false });
    });

    // футер: классы .js-whatsapp / .js-telegram
    qsa('footer .js-whatsapp', root).forEach(el=>{
      if (el.__wired) return; el.__wired = true; hardenClickable(el);
      el.addEventListener('click', withMaybeForm(openWhatsApp), { passive:false });
    });

    qsa('footer .js-telegram', root).forEach(el=>{
      if (el.__wired) return; el.__wired = true; hardenClickable(el);
      el.addEventListener('click', withMaybeForm(openTelegram), { passive:false });
    });

    // перехват готовых ссылок в футере
    qsa('footer a[href*="wa.me/"]', root).forEach(a=>{
      if (a.__wired) return; a.__wired = true; hardenClickable(a);
      a.addEventListener('click', withMaybeForm(openWhatsApp), { passive:false });
    });

    qsa('footer a[href^="https://t.me/"], footer a[href^="tg://"]', root).forEach(a=>{
      if (a.__wired) return; a.__wired = true; hardenClickable(a);
      a.addEventListener('click', withMaybeForm(openTelegram), { passive:false });
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
        try{ validate(form); openWhatsApp(buildMessage(form), e); }
        catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      }, { passive:false });
    }
    if (tgBtn && !tgBtn.__wired){
      tgBtn.__wired = true; hardenClickable(tgBtn);
      tgBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        try { validate(form); openTelegram(buildMessage(form), e); }
        catch(err){ alert(err.message || 'Не удалось открыть Telegram'); }
      }, { passive:false });
    }
  }

  function init(){
    wireGlobalButtons(document);
    qsa('[data-contact-form], [data-order-form]').forEach(wireForm);
  }

  document.addEventListener('DOMContentLoaded', init, { once:true });

  // на случай динамической подгрузки футера/секции
  const mo = new MutationObserver(()=>{
    wireGlobalButtons(document);
    qsa('[data-contact-form], [data-order-form]').forEach(wireForm);
  });
  mo.observe(document.documentElement, { childList:true, subtree:true });
})();
