/* assets/js/contact.js — авто-отправка в WhatsApp/Telegram (без email)
   — Собирает: Программа (название + ID), Дата, Гостей, Имя, Контакт, Сообщение
   — Работает для форм [data-contact-form] и ссылок/кнопок [data-whatsapp] / [data-telegram]
*/
(function(){
  if (window.__CONTACT_INIT__) { console.warn('[contact.js] already initialized'); return; }
  window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qs = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const digits = (s='') => String(s).replace(/\D/g,'');
  const LANG = () => (localStorage.getItem('site:lang') || ((navigator.language||'').toLowerCase().startsWith('fr') ? 'fr' : 'ru'));

  /* -------- helpers -------- */
  function programInfo(fromEl){
    const root = fromEl?.closest('[data-program-title],[data-program-id],[data-program]') || document.body;
    const heroTitle = qs('.hero .title')?.textContent?.trim() || '';
    const metaTitle = qs('meta[property="og:title"]')?.getAttribute('content') || '';
    const docTitle  = document.title.replace(/\s*[|—-].*$/, '').trim();
    const title = root?.dataset?.programTitle || metaTitle || heroTitle || docTitle || 'Программа';
    const id    = root?.dataset?.programId ||
                  (location.pathname.split('/').pop()||'').replace(/\.[a-z0-9]+$/i,'') ||
                  'N/A';
    return { title, id };
  }
  function getVal(fd, keys){
    for (const k of keys){ const v = fd.get(k); if (v) return String(v).trim(); }
    return '';
  }
  function formCtx(el){
    const form = el?.closest('form') || qs('[data-contact-form]') || null;
    const fd = form ? new FormData(form) : new FormData();
    return {
      name   : getVal(fd, ['name']),
      contact: getVal(fd, ['contact','phone']),
      date   : getVal(fd, ['date','when','day']),
      guests : getVal(fd, ['guests','persons','people']),
      message: getVal(fd, ['message'])
    };
  }
  function buildText(ctx, prog){
    const hello = (LANG()==='fr') ? 'Bonjour! ' : 'Здравствуйте! ';
    const parts = [];
    parts.push(hello + (ctx.name ? `Меня зовут ${ctx.name}. ` : ''));
    if (ctx.message) parts.push(ctx.message);
    if (ctx.date)    parts.push(`\nДата: ${ctx.date}`);
    if (ctx.guests)  parts.push(`\nГостей: ${ctx.guests}`);
    parts.push(`\nПрограмма: ${prog.title} (${prog.id})`);
    if (ctx.contact) parts.push(`\nКонтакт: ${ctx.contact}`);
    return parts.join('').trim();
  }

  /* -------- openers -------- */
  function openWhatsApp(text){
    const wa = digits(CFG.whatsapp || '');
    if (!wa) { alert('В config.js не указан номер WhatsApp'); return; }
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  }
  function openTelegram(text){
    const phone = digits(CFG.whatsapp || ''); // тот же номер
    const appUrl   = phone ? `tg://resolve?phone=${phone}` : '';
    const webShare = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
    if (appUrl){
      const hadFocus = document.hasFocus();
      // пробуем открыть приложение
      window.location.href = appUrl;
      setTimeout(()=>{ if (document.hasFocus() === hadFocus) window.open(webShare, '_blank', 'noopener'); }, 700);
    } else {
      window.open(webShare, '_blank', 'noopener');
    }
  }

  /* -------- idempotent base patch (вдруг DOM динамический) -------- */
  function patchBaseLinks(){
    const wa = digits(CFG.whatsapp || '');
    if (wa) {
      qa('[data-whatsapp]').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (!href || href === '#' || href.startsWith('https://wa.me/')) a.setAttribute('href', `https://wa.me/${wa}`);
      });
      qa('[data-telegram]').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (!href || href === '#' || href.startsWith('tg://resolve?phone=')) a.setAttribute('href', `tg://resolve?phone=${wa}`);
      });
    } else {
      qa('[data-telegram]').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (!href || href === '#') a.setAttribute('href', 'https://t.me/share/url');
      });
    }
  }

  /* -------- listeners -------- */
  // Submit всех форм с data-contact-form
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!form.matches('[data-contact-form]')) return;
    e.preventDefault();

    const prog = programInfo(form);
    const ctx  = formCtx(form);
    const text = buildText(ctx, prog);

    try { await navigator.clipboard.writeText(text); } catch(_) {}

    const sel = (form.elements['channel']?.value || form.dataset.channel || '').toLowerCase();
    const channel = sel || (digits(CFG.whatsapp||'') ? 'whatsapp' : 'telegram');

    if (channel === 'whatsapp')      openWhatsApp(text);
    else if (channel === 'telegram') openTelegram(text);
    else if (channel === 'both')    { openWhatsApp(text); setTimeout(()=>openTelegram(text), 120); }
  }, true);

  // Клики по ссылкам data-whatsapp / data-telegram
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a[data-whatsapp], a[data-telegram], [data-book], [data-booking], .js-book, a[href^="#book"]');
    if (!a) return;

    // общий контекст + текст
    const prog = programInfo(a);
    const ctx  = formCtx(a);
    const text = buildText(ctx, prog);
    try { await navigator.clipboard.writeText(text); } catch(_) {}

    // если это классические кнопки брони — определим канал
    if (a.matches('[data-book], [data-booking], .js-book, a[href^="#book"]')){
      e.preventDefault();
      const form = a.closest('form');
      const sel  = (form?.elements?.channel?.value || a.dataset.channel || a.closest('[data-channel]')?.dataset.channel || '').toLowerCase();
      const channel = sel || (digits(CFG.whatsapp||'') ? 'whatsapp' : 'telegram');

      if (channel === 'whatsapp')      openWhatsApp(text);
      else if (channel === 'telegram') openTelegram(text);
      else if (channel === 'both')    { openWhatsApp(text); setTimeout(()=>openTelegram(text), 120); }
      return;
    }

    if (a.matches('[data-whatsapp]')) { e.preventDefault(); openWhatsApp(text); return; }
    if (a.matches('[data-telegram]')) { e.preventDefault(); openTelegram(text); return; }
  }, true);

  // Патчим базовые href при загрузке и на динамических изменениях
  function init(){
    patchBaseLinks();
    const mo = new MutationObserver(()=>patchBaseLinks());
    mo.observe(document.documentElement, {childList:true, subtree:true});
    console.log('[contact.js] ready');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();
