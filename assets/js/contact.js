/* contact.js — авто-отправка в WA/TG
   — TG при наличии bot_username использует диплинк: https://t.me/<bot>?start=<payload>
   — payload ≤ 64 байт: base64url(JSON с короткими ключами). Если не влезает → fallback на share-url.
*/
(function(){
  if (window.__CONTACT_INIT__) { console.warn('[contact.js] already initialized'); return; }
  window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qs = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const digits = (s='') => String(s).replace(/\D/g,'');
  const LANG = () => (localStorage.getItem('site:lang') || ((navigator.language||'').toLowerCase().startsWith('fr') ? 'fr' : 'ru'));

  /* ------------ helpers ------------ */
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
      n: getVal(fd, ['name']).slice(0, 32),                 // name
      c: getVal(fd, ['contact','phone']).slice(0, 32),      // contact
      d: getVal(fd, ['date','when','day']).slice(0, 16),    // date
      g: getVal(fd, ['guests','persons','people']).slice(0,6), // guests
      m: getVal(fd, ['message']).slice(0, 140)              // message (trim)
    };
  }

  function buildHumanText(ctx, prog){
    const hello = (LANG()==='fr') ? 'Bonjour! ' : 'Здравствуйте! ';
    const parts = [];
    parts.push(hello + (ctx.n ? `Меня зовут ${ctx.n}. ` : ''));
    if (ctx.m) parts.push(ctx.m);
    if (ctx.d) parts.push(`\nДата: ${ctx.d}`);
    if (ctx.g) parts.push(`\nГостей: ${ctx.g}`);
    parts.push(`\nПрограмма: ${prog.title} (${prog.id})`);
    if (ctx.c) parts.push(`\nКонтакт: ${ctx.c}`);
    return parts.join('').trim();
  }

  // base64url без паддинга
  const b64url = (s) => {
    const b = btoa(unescape(encodeURIComponent(s)));
    return b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  };

  // Сборка короткого payload для /start (≤64 байт). Поля: p=programId, t=short title, d,g,n,c
  function buildShortPayload(ctx, prog){
    // максимально сжимаем
    const obj = {
      p: String(prog.id || '').slice(0, 32),
      t: String(prog.title || '').slice(0, 40),
      d: ctx.d || '',
      g: ctx.g || '',
      n: ctx.n || '',
      c: ctx.c || ''
    };
    let json = JSON.stringify(obj);
    let out = b64url(json);
    if (out.length <= 64) return out;

    // постепенно урезаем: t, m отсутствует в payload (боту не обязателен), затем n, затем c
    obj.t = ''; json = JSON.stringify(obj); out = b64url(json);
    if (out.length <= 64) return out;

    obj.n = ''; json = JSON.stringify(obj); out = b64url(json);
    if (out.length <= 64) return out;

    obj.c = ''; json = JSON.stringify(obj); out = b64url(json);
    if (out.length <= 64) return out;

    // в крайнем случае — только p,d,g
    const tiny = { p: obj.p, d: obj.d, g: obj.g };
    return b64url(JSON.stringify(tiny)); // точно <64
  }

  /* ------------ openers ------------ */
  function openWhatsApp(text){
    const wa = digits(CFG.whatsapp || '');
    if (!wa) { alert('В config.js не указан номер WhatsApp'); return; }
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  }

  // Telegram: если есть bot_username → диплинк со start payload; иначе — окно шаринга с текстом
  function openTelegram(ctx, prog){
    const text = buildHumanText(ctx, prog);
    if (CFG.bot_username) {
      const payload = buildShortPayload(ctx, prog);
      const url = `https://t.me/${CFG.bot_username}?start=${payload}`;
      // на всякий случай — копия текста в буфер
      try { navigator.clipboard?.writeText(text); } catch(_) {}
      window.open(url, '_blank', 'noopener');
    } else {
      const share = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;
      window.open(share, '_blank', 'noopener');
    }
  }

  function patchBaseLinks(){
    const wa = digits(CFG.whatsapp || '');
    if (wa) qa('[data-whatsapp]').forEach(a => {
      const href = a.getAttribute('href')||'';
      if (!href || href==='#' || href.startsWith('https://wa.me/')) a.setAttribute('href', `https://wa.me/${wa}`);
    });
    qa('[data-telegram]').forEach(a => {
      const href = a.getAttribute('href')||'';
      if (!href || href==='#') {
        a.setAttribute('href', CFG.bot_username ? `https://t.me/${CFG.bot_username}` : 'https://t.me/share/url');
      }
    });
  }

  /* ------------ listeners ------------ */
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!form.matches('[data-contact-form]')) return;
    e.preventDefault();

    const prog = programInfo(form);
    const ctx  = formCtx(form);
    const channel = (form.elements['channel']?.value || form.dataset.channel || '').toLowerCase() ||
                    (digits(CFG.whatsapp||'') ? 'whatsapp' : 'telegram');

    if (channel === 'whatsapp') {
      openWhatsApp(buildHumanText(ctx, prog));
    } else if (channel === 'telegram') {
      openTelegram(ctx, prog);
    } else if (channel === 'both') {
      openWhatsApp(buildHumanText(ctx, prog));
      setTimeout(()=>openTelegram(ctx, prog), 120);
    }
  }, true);

  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a[data-whatsapp], a[data-telegram], [data-book], [data-booking], .js-book, a[href^="#book"]');
    if (!a) return;

    const prog = programInfo(a);
    const ctx  = formCtx(a);

    if (a.matches('[data-book], [data-booking], .js-book, a[href^="#book"]')){
      e.preventDefault();
      const form = a.closest('form');
      const channel = (form?.elements?.channel?.value || a.dataset.channel || a.closest('[data-channel]')?.dataset.channel || '').toLowerCase()
                      || (digits(CFG.whatsapp||'') ? 'whatsapp' : 'telegram');
      if (channel === 'whatsapp') openWhatsApp(buildHumanText(ctx, prog));
      else if (channel === 'telegram') openTelegram(ctx, prog);
      else if (channel === 'both') { openWhatsApp(buildHumanText(ctx, prog)); setTimeout(()=>openTelegram(ctx, prog), 120); }
      return;
    }
    if (a.matches('[data-whatsapp]')) { e.preventDefault(); openWhatsApp(buildHumanText(ctx, prog)); return; }
    if (a.matches('[data-telegram]')) { e.preventDefault(); openTelegram(ctx, prog); return; }
  }, true);

  function init(){
    patchBaseLinks();
    const mo = new MutationObserver(()=>patchBaseLinks());
    mo.observe(document.documentElement, {childList:true, subtree:true});
    console.log('[contact.js] ready (bot_username:', CFG.bot_username||'—', ')');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
