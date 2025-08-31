/* contact.js — только WhatsApp и Telegram (share-url).
   — WA: сразу в чат с номером + готовый текст
   — TG: окно шаринга с готовым текстом (официальный способ передать текст без бота)
   — Текст также копируется в буфер на всякий случай
*/
(function(){
  if (window.__CONTACT_INIT__) { console.warn('[contact.js] already initialized'); return; }
  window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qs = (s, r=document)=>r.querySelector(s);
  const qa = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const digits = (s='') => String(s).replace(/\D/g,'');
  const LANG = () => (localStorage.getItem('site:lang') || ((navigator.language||'').toLowerCase().startsWith('fr') ? 'fr' : 'ru'));

  /* ------- сбор данных ------- */
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
  function val(fd, list){ for (const k of list){ const v = fd.get(k); if (v) return String(v).trim(); } return ''; }
  function ctxFrom(el){
    const form = el?.closest('form') || qs('[data-contact-form]');
    const fd = form ? new FormData(form) : new FormData();
    return {
      name:   val(fd, ['name']),
      contact:val(fd, ['contact','phone']),
      date:   val(fd, ['date','when','day']),
      guests: val(fd, ['guests','persons','people']),
      msg:    val(fd, ['message'])
    };
  }
  function buildText(ctx, prog){
    const hello = (LANG()==='fr') ? 'Bonjour! ' : 'Здравствуйте! ';
    const out = [];
    out.push(hello + (ctx.name ? `Меня зовут ${ctx.name}. ` : ''));
    if (ctx.msg)   out.push(ctx.msg);
    if (ctx.date)  out.push(`\nДата: ${ctx.date}`);
    if (ctx.guests)out.push(`\nГостей: ${ctx.guests}`);
    out.push(`\nПрограмма: ${prog.title} (${prog.id})`);
    if (ctx.contact) out.push(`\nКонтакт: ${ctx.contact}`);
    return out.join('').trim();
  }

  /* ------- отправители ------- */
  function openWA(text){
    const wa = digits(CFG.whatsapp||'');
    if (!wa) { alert('В config.js не указан whatsapp'); return; }
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  }
  function openTG(text){
    // Официальный путь для передачи текста — окно шаринга
    const url = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;
    try { navigator.clipboard?.writeText(text); } catch(_) {}
    window.open(url, '_blank', 'noopener');
  }

  /* ------- логика сабмита ------- */
  document.addEventListener('submit', (e)=>{
    const form = e.target;
    if (!form.matches('[data-contact-form]')) return;
    e.preventDefault();

    const prog = programInfo(form);
    const ctx  = ctxFrom(form);
    const text = buildText(ctx, prog);

    const chSel = (form.elements['channel']?.value || form.dataset.channel || '').toLowerCase();
    const channel = chSel || (digits(CFG.whatsapp||'') ? 'whatsapp' : 'telegram');

    if (channel==='whatsapp') openWA(text);
    else if (channel==='telegram') openTG(text);
    else { openWA(text); setTimeout(()=>openTG(text), 120); } // both
  }, true);

  /* ------- клики по кнопкам ------- */
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-whatsapp], a[data-telegram], [data-book], [data-booking], .js-book, a[href^="#book"]');
    if (!a) return;

    const prog = programInfo(a);
    const ctx  = ctxFrom(a);
    const text = buildText(ctx, prog);

    if (a.matches('[data-whatsapp]')) { e.preventDefault(); openWA(text); return; }
    if (a.matches('[data-telegram]')) { e.preventDefault(); openTG(text); return; }

    if (a.matches('[data-book], [data-booking], .js-book, a[href^="#book"]')){
      e.preventDefault();
      const form = a.closest('form');
      const chSel = (form?.elements?.channel?.value || a.dataset.channel || a.closest('[data-channel]')?.dataset.channel || '').toLowerCase();
      const channel = chSel || (digits(CFG.whatsapp||'') ? 'whatsapp' : 'telegram');
      if (channel==='whatsapp') openWA(text);
      else if (channel==='telegram') openTG(text);
      else { openWA(text); setTimeout(()=>openTG(text), 120); }
    }
  }, true);

  /* ------- стартовые href без текста ------- */
  function patchBase(){
    const wa = digits(CFG.whatsapp||'');
    if (wa) qa('[data-whatsapp]').forEach(a => {
      const href = a.getAttribute('href')||'';
      if (!href || href==='#' || href.startsWith('https://wa.me/')) a.setAttribute('href', `https://wa.me/${wa}`);
    });
    qa('[data-telegram]').forEach(a => a.setAttribute('href', 'https://t.me/share/url'));
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', patchBase, {once:true});
  else patchBase();

  console.log('[contact.js] ready (share-url mode)');
})();
