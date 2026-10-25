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
    const any = qs('[data-program-id],[data-program-title]');

    const ctx = {
      url: location.href,
      title: qs('h1, .page-title, .title')?.textContent?.trim() || document.title || '',
      programId:    (any && any.getAttribute('data-program-id'))    || body.getAttribute('data-program-id') || html.getAttribute('data-program-id') || '',
      programTitle: (any && any.getAttribute('data-program-title')) || body.getAttribute('data-program-title') || html.getAttribute('data-program-title') || '',
    };
    if (!ctx.programTitle) ctx.programTitle = ctx.title;
    return ctx;
  }

  function buildMessage(){
    const ctx = pageContext();
    const isFr = String(document.documentElement.lang || '').toLowerCase().startsWith('fr');
    const title = ctx.programTitle || ctx.title;
    return [
      isFr ? 'Message depuis le site Tours Languedoc by Irène' : 'Сообщение с сайта Tours Languedoc by Irène',
      ctx.programId ? (isFr ? 'Programme : ' : 'Программа: ') + title + ' [' + ctx.programId + ']' : (isFr ? 'Page : ' : 'Страница: ') + ctx.title,
      (isFr ? 'Lien : ' : 'Ссылка: ') + ctx.url
    ].join('\n');
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
      toast('Сообщение скопировано. Выберите чат в Telegram и отправьте.');
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
    toast('Сообщение скопировано. Вставьте в Telegram и отправьте.');
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

    function withMessage(handler){
      return (e)=>{
        try { handler(buildMessage(), e); }
        catch(err){ alert(err.message || 'Не удалось открыть контакт'); }
      };
    }

    // data-атрибуты
    qsa('[data-whatsapp]', root).forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true; hardenClickable(btn);
      btn.addEventListener('click', withMessage(openWhatsApp), { passive:false });
    });

    qsa('[data-telegram]', root).forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true; hardenClickable(btn);
      btn.addEventListener('click', withMessage(openTelegram), { passive:false });
    });

    // футер: классы .js-whatsapp / .js-telegram
    qsa('footer .js-whatsapp', root).forEach(el=>{
      if (el.__wired) return; el.__wired = true; hardenClickable(el);
      el.addEventListener('click', withMessage(openWhatsApp), { passive:false });
    });

    qsa('footer .js-telegram', root).forEach(el=>{
      if (el.__wired) return; el.__wired = true; hardenClickable(el);
      el.addEventListener('click', withMessage(openTelegram), { passive:false });
    });

    // перехват готовых ссылок в футере
    qsa('footer a[href*="wa.me/"]', root).forEach(a=>{
      if (a.__wired) return; a.__wired = true; hardenClickable(a);
      a.addEventListener('click', withMessage(openWhatsApp), { passive:false });
    });

    qsa('footer a[href^="https://t.me/"], footer a[href^="tg://"]', root).forEach(a=>{
      if (a.__wired) return; a.__wired = true; hardenClickable(a);
      a.addEventListener('click', withMessage(openTelegram), { passive:false });
    });
  }

  function init(){
    wireGlobalButtons(document);
  }

  document.addEventListener('DOMContentLoaded', init, { once:true });

  // на случай динамической подгрузки футера/секции
  const mo = new MutationObserver(()=>{
    wireGlobalButtons(document);
  });
  mo.observe(document.documentElement, { childList:true, subtree:true });
})();
