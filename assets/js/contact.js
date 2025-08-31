/* assets/js/contact.js
   Авто-общение БЕЗ email: только WhatsApp + Telegram.
   Делегированные обработчики — без дубликатов.
   Нужен window.APP_CONFIG { whatsapp, telegram } из config.js
*/
(function(){
  if (window.__CONTACT_INIT__) return;
  window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const LANG = () => (localStorage.getItem('site:lang') || 'ru');

  // --- Утилиты ---
  const qs = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const digits = (s='') => String(s).replace(/\D/g,'');
  const hasWA = () => !!digits(CFG.whatsapp);
  const hasTG = () => !!(CFG.telegram && String(CFG.telegram).trim());

  function ctxFrom(el){
    const root = el?.closest('[data-program-title],[data-program-id],[data-program]') || document.body;
    const title = (el?.dataset.programTitle) || root.dataset.programTitle || document.title.replace(/\s*[|—-].*$/,'').trim() || 'Программа';
    const id    = (el?.dataset.programId)    || root.dataset.programId    || 'N/A';
    const form  = el?.closest('form') || qs('[data-contact-form]');
    const fd    = form ? new FormData(form) : new FormData();
    const name    = (fd.get('name')    || '').toString().trim();
    const contact = (fd.get('contact') || '').toString().trim();
    const when    = (fd.get('when')    || fd.get('date')    || '').toString().trim();
    const guests  = (fd.get('guests')  || fd.get('persons') || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();
    return { title, id, name, contact, when, guests, message };
  }

  function textRUFR(prefix, c){
    const hello = LANG()==='fr' ? 'Bonjour! ' : 'Здравствуйте! ';
    const lines = [
      hello + (c.name ? `Меня зовут ${c.name}. ` : ''),
      c.message ? c.message : '',
      c.when ? `\nДата: ${c.when}` : '',
      c.guests ? `\nГостей: ${c.guests}` : '',
      `${c.title ? `\nПрограмма: ${c.title}` : ''} ${c.id ? `(${c.id})` : ''}`,
      c.contact ? `\nКонтакт: ${c.contact}` : ''
    ];
    return lines.join('').trim();
  }

  function makeWA(c){
    const t = textRUFR('wa', c);
    const wa = digits(CFG.whatsapp);
    return wa ? `https://wa.me/${wa}?text=${encodeURIComponent(t)}` : '';
  }

  function makeTG(c){
    const t = textRUFR('tg', c);
    const user = (CFG.telegram || '').trim();
    // В DM нельзя префиллить текст → копируем в буфер и открываем профиль
    return { text: t, url: user ? `https://t.me/${user}` : `https://t.me/share/url?text=${encodeURIComponent(t)}` };
  }

  // Патчи видимых ссылок (без текста — только номер/username)
  function patchWhatsApp(){
    const wa = digits(CFG.whatsapp);
    if (!wa) return;
    qa('[data-whatsapp]').forEach(a=>{
      const href = a.getAttribute('href')||'';
      if (!href || href==='#' || href.startsWith('https://wa.me/')) {
        a.setAttribute('href', `https://wa.me/${wa}`);
      }
    });
  }
  function patchTelegram(){
    const user = (CFG.telegram||'').trim();
    qa('[data-telegram]').forEach(a=>{
      const href = a.getAttribute('href')||'';
      if (!href || href==='#' || href.startsWith('https://t.me/')) {
        a.setAttribute('href', user ? `https://t.me/${user}` : 'https://t.me/');
      }
    });
  }

  // Следим за динамикой
  const mo = new MutationObserver(()=>{ patchWhatsApp(); patchTelegram(); });
  mo.observe(document.documentElement, {childList:true, subtree:true});

  // Делегирование кликов
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a,button');
    if (!a) return;

    // Кнопка «Забронировать»/book — без email, выбираем канал
    if (a.matches('[data-book], [data-booking], .js-book, a[href^="#book"]')
        || a.textContent.trim().toLowerCase().includes('заброниров')) {
      e.preventDefault();
      const c = ctxFrom(a);
      // канал из select[name=channel] или data-channel родителя; иначе — WA, если есть; иначе — TG
      const form = a.closest('form');
      const selVal = form?.elements?.channel?.value || a.dataset.channel || a.closest('[data-channel]')?.dataset.channel || '';
      const channel = (selVal || (hasWA() ? 'whatsapp' : 'telegram')).toLowerCase();

      if (channel === 'whatsapp'){
        const url = makeWA(c);
        if (!url) { alert('В config.js не указан WhatsApp'); return; }
        window.open(url, '_blank', 'noopener');
      } else if (channel === 'telegram'){
        const {text,url} = makeTG(c);
        try{ await navigator.clipboard.writeText(text); }catch(_){}
        window.open(url, '_blank', 'noopener');
      } else if (channel === 'both'){
        const url1 = hasWA() ? makeWA(c) : '';
        const {text,url:url2} = makeTG(c);
        try{ await navigator.clipboard.writeText(text); }catch(_){}
        if (url1) window.open(url1, '_blank', 'noopener');
        setTimeout(()=>window.open(url2, '_blank', 'noopener'), 120);
      }
      return;
    }

    // Любая кнопка/ссылка data-whatsapp → дополняем текст на лету
    if (a.matches('[data-whatsapp]')) {
      const url = makeWA(ctxFrom(a));
      if (!url) { alert('В config.js не указан WhatsApp'); e.preventDefault(); return; }
      a.setAttribute('href', url);
      // пусть откроется как задано (target и пр.)
      return;
    }

    // Любая кнопка/ссылка data-telegram → копируем текст и открываем t.me
    if (a.matches('[data-telegram]')) {
      e.preventDefault();
      const {text, url} = makeTG(ctxFrom(a));
      try{ await navigator.clipboard.writeText(text); }catch(_){}
      window.open(url, '_blank', 'noopener');
      return;
    }

    // Скролл до контактов
    if (a.matches('a[href="#contact"], .cta')) {
      e.preventDefault();
      qs('#contact')?.scrollIntoView({behavior:'smooth'});
      return;
    }
  }, true);

  // Submit форм: email отсутствует
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!form.matches('[data-contact-form]')) return;
    e.preventDefault();

    const c = ctxFrom(form);
    const channel = (form.elements['channel']?.value || form.dataset.channel || (hasWA() ? 'whatsapp' : 'telegram')).toLowerCase();

    try{
      if (channel === 'whatsapp'){
        const url = makeWA(c);
        if (!url) throw new Error('whatsapp missing');
        window.open(url, '_blank', 'noopener');
      } else if (channel === 'telegram'){
        const {text, url} = makeTG(c);
        try{ await navigator.clipboard.writeText(text); }catch(_){}
        window.open(url, '_blank', 'noopener');
      } else if (channel === 'both'){
        const url1 = hasWA() ? makeWA(c) : '';
        const {text, url:url2} = makeTG(c);
        try{ await navigator.clipboard.writeText(text); }catch(_){}
        if (url1) window.open(url1, '_blank', 'noopener');
        setTimeout(()=>window.open(url2, '_blank', 'noopener'), 120);
      } else {
        // safety: по умолчанию WhatsApp → Telegram
        if (hasWA()) window.open(makeWA(c), '_blank', 'noopener');
        else { const {text,url} = makeTG(c); try{ await navigator.clipboard.writeText(text); }catch(_{}) ; window.open(url,'_blank','noopener'); }
      }
    } catch(err){
      console.error('[contact] submit error', err);
      alert('Не удалось подготовить отправку. Проверьте config.js (whatsapp/telegram).');
    }
  }, true);

  // Стартовые патчи
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => { patchWhatsApp(); patchTelegram(); }, {once:true});
  } else {
    patchWhatsApp(); patchTelegram();
  }
})();
