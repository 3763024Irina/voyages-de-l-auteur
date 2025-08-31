/* contact.js — авто-отправка в WhatsApp/Telegram (без email)
   Telegram открывается через https://t.me/share/url?text=..., чтобы ГАРАНТИРОВАННО был текст.
*/
(function(){
  if (window.__CONTACT_INIT__) { console.warn('[contact.js] already initialized'); return; }
  window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qs = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const digits = (s='') => String(s).replace(/\D/g,'');
  const LANG = () => (localStorage.getItem('site:lang') || ((navigator.language||'').toLowerCase().startsWith('fr') ? 'fr' : 'ru'));

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
  function getVal(fd, keys){ for (const k of keys){ const v = fd.get(k); if (v) return String(v).trim(); } return ''; }
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

  function openWhatsApp(text){
    const wa = digits(CFG.whatsapp || '');
    if (!wa) { alert('В config.js не указан номер WhatsApp'); return; }
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  }
  // ✅ всегда share-url, чтобы был ТЕКСТ
  function openTelegram(text){
    const share = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;
    window.open(share, '_blank', 'noopener');
  }

  function patchBaseLinks(){
    const wa = digits(CFG.whatsapp || '');
    if (wa) qa('[data-whatsapp]').forEach(a => {
      const href = a.getAttribute('href')||'';
      if (!href || href==='#' || href.startsWith('https://wa.me/')) a.setAttribute('href', `https://wa.me/${wa}`);
    });
    qa('[data-telegram]').forEach(a => a.setAttribute('href', 'https://t.me/share/url'));
  }

  // Submit всех форм
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

  // Клики по ссылкам/кнопкам
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a[data-whatsapp], a[data-telegram], [data-book], [data-booking], .js-book, a[href^="#book"]');
    if (!a) return;

    const prog = programInfo(a);
    const ctx  = formCtx(a);
    const text = buildText(ctx, prog);
    try { await navigator.clipboard.writeText(text); } catch(_) {}

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
