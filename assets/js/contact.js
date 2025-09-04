/* contact.js — WhatsApp & Telegram только.
   — Жёсткая валидация: name, contact, date, guests, message — обязательны.
   — WA: сразу чат с номером + текст
   — TG: deeplink к @username (если указан), текст копируется в буфер; иначе share-url
*/
(function(){
  if (window.__CONTACT_INIT__) { console.warn('[contact.js] already initialized'); return; }
  window.__CONTACT_INIT__ = true;

  // --------- конфиг ---------
  const CFG = window.APP_CONFIG || {};                   // { whatsapp: "+33...", telegram_user: "myuser" }
  const LANG = () => (localStorage.getItem('site:lang') || ((navigator.language||'').toLowerCase().startsWith('fr') ? 'fr' : 'ru'));
  const qs = (s, r=document)=>r.querySelector(s);
  const qa = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const digits = (s='') => String(s).replace(/\D/g,'');

  // --------- i18n ---------
  const I18N = {
    ru:{
      required:'Заполните поле',
      badContact:'Укажите телефон (WhatsApp) или @username в Telegram',
      badGuests:'Минимум 1 гость',
      badDate:'Укажите дату',
      firstInvalid:'Проверьте форму — заполните все поля.',
      copiedTG:'Текст заявки скопирован. Откройте чат Telegram и вставьте его.'
    },
    fr:{
      required:'Champ requis',
      badContact:'Indiquez un téléphone (WhatsApp) ou @username Telegram',
      badGuests:'Au moins 1 personne',
      badDate:'Indiquez la date',
      firstInvalid:'Vérifiez le formulaire — remplissez tous les champs.',
      copiedTG:'Texte copié. Ouvrez Telegram et collez-le.'
    }
  };
  const t = k => (I18N[LANG()]||I18N.ru)[k];

  // --------- helpers: ошибки ---------
  function injectErrCSS(){
    if(document.getElementById('contactjs-error-css')) return;
    const style = document.createElement('style');
    style.id='contactjs-error-css';
    style.textContent = `
      .field-error{ color:#d33; font-size:12px; margin-top:6px }
      .is-error{ border-color:#d33 !important; outline:0 }
    `;
    document.head.appendChild(style);
  }
  function clearError(el){
    if(!el) return;
    el.classList.remove('is-error');
    el.removeAttribute('aria-invalid');
    const msg = el.parentElement && el.parentElement.querySelector('.field-error');
    if(msg) msg.remove();
  }
  function showError(el, msg){
    if(!el) return;
    clearError(el);
    el.classList.add('is-error');
    el.setAttribute('aria-invalid','true');
    const m = document.createElement('div');
    m.className = 'field-error';
    m.textContent = msg || t('required');
    el.parentElement && el.parentElement.appendChild(m);
  }

  // --------- валидаторы ---------
  const isPhone = v => /^[+\d][\d\s().-]{6,}$/.test((v||'').trim());
  const isTG    = v => /^@?[a-zA-Z0-9_]{5,}$/.test((v||'').trim());

  function findField(form, variants){
    for(const sel of variants){
      const el = form.querySelector(sel);
      if(el) return el;
    }
    return null;
  }

  function ensureRequiredAttrs(form){
    const map = {
      name:['[name="name"]','#name'],
      contact:['[name="contact"]','#contact'],
      date:['[name="date"]','#when','#date'],
      guests:['[name="guests"]','#guests'],
      message:['[name="message"]','#msg','#message']
    };
    Object.keys(map).forEach(key=>{
      const el = findField(form, map[key]);
      if(el) el.setAttribute('required','required');
    });
  }

  function validateForm(form){
    injectErrCSS();
    let ok = true;

    const fName = findField(form, ['[name="name"]','#name']);
    const fContact = findField(form, ['[name="contact"]','#contact']);
    const fDate = findField(form, ['[name="date"]','#when','#date']);
    const fGuests = findField(form, ['[name="guests"]','#guests']);
    const fMsg = findField(form, ['[name="message"]','#msg','#message']);

    [fName,fContact,fDate,fGuests,fMsg].forEach(el=>clearError(el));

    if(!fName || !fName.value.trim()){ showError(fName||form, t('required')); ok=false; }

    if(!fContact || !fContact.value.trim()){ showError(fContact||form, t('required')); ok=false; }
    else if(!(isPhone(fContact.value)||isTG(fContact.value))){ showError(fContact, t('badContact')); ok=false; }

    if(!fDate || !fDate.value){ showError(fDate||form, t('badDate')); ok=false; }

    const g = parseInt((fGuests && fGuests.value) || '0',10);
    const minG = Math.max(1, Number(fGuests?.min||1));
    if(!Number.isFinite(g) || g < minG){ showError(fGuests||form, t('badGuests')); ok=false; }

    if(!fMsg || !fMsg.value.trim()){ showError(fMsg||form, t('required')); ok=false; }

    if(!ok){
      (form.querySelector('.is-error') || fName || form).focus({preventScroll:false});
      alert(t('firstInvalid'));
    }

    // снять ошибки при вводе
    form.querySelectorAll('input,textarea,select').forEach(el=>{
      el.addEventListener('input', ()=>clearError(el), {once:true});
      el.addEventListener('change', ()=>clearError(el), {once:true});
    });

    return ok;
  }

  // --------- сбор данных для сообщения ---------
  function programInfo(fromEl){
    const root = fromEl?.closest('[data-program],[data-program-title],[data-program-id]') || document.body;
    const heroTitle = qs('.hero .title')?.textContent?.trim() || '';
    const metaTitle = qs('meta[property="og:title"]')?.getAttribute('content') || '';
    const docTitle  = document.title.replace(/\s*[|—-].*$/, '').trim();
    const title = root?.dataset?.programTitle || metaTitle || heroTitle || docTitle || 'Программа';
    const id    = root?.dataset?.programId ||
                  (location.pathname.split('/').pop()||'').replace(/\.[a-z0-9]+$/i,'') || 'N/A';
    return { title, id };
  }
  function ctxFrom(el){
    const form = el?.closest('form') || qs('[data-contact-form]');
    const fd = form ? new FormData(form) : new FormData();
    const first = names => { for(const n of names){ const v = fd.get(n); if(v) return String(v).trim(); } return ''; };
    return {
      name:   first(['name']),
      contact:first(['contact','phone']),
      date:   first(['date','when','day']),
      guests: first(['guests','persons','people']),
      message:first(['message'])
    };
  }
  function buildText(ctx, prog){
    const hello = (LANG()==='fr') ? 'Bonjour! ' : 'Здравствуйте! ';
    const out = [];
    out.push(hello + (ctx.name ? `Меня зовут ${ctx.name}. ` : ''));
    if (ctx.message) out.push(ctx.message);
    if (ctx.date)  out.push(`\nДата: ${ctx.date}`);
    if (ctx.guests)out.push(`\nГостей: ${ctx.guests}`);
    out.push(`\nПрограмма: ${prog.title} (${prog.id})`);
    if (ctx.contact) out.push(`\nКонтакт: ${ctx.contact}`);
    return out.join('').trim();
  }

  // --------- отправители ---------
  function openWA(text){
    const wa = digits(CFG.whatsapp||'');
    if (!wa) { alert('В config.js не указан номер whatsapp'); return; }
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  }
  function openTG(text){
    const user = String(CFG.telegram_user || CFG.telegram || '').replace(/^@/, '');
    try{ navigator.clipboard?.writeText(text); }catch(_){}
    if (user) {
      const deeplink = `tg://resolve?domain=${encodeURIComponent(user)}`;
      const web = `https://t.me/${user}`;
      let w; try{ w = window.open(deeplink,'_blank'); }catch(_){}
      setTimeout(()=>{ if(!w || w.closed) window.open(web,'_blank','noopener'); }, 200);
      setTimeout(()=>alert(t('copiedTG')), 300);
      return;
    }
    const url = `https://t.me/share/url?url=${encodeURIComponent(location.href)}&text=${encodeURIComponent(text)}`;
    window.open(url,'_blank','noopener');
  }

  // --------- перехват submit (data-contact-form) ---------
  document.addEventListener('submit', (e)=>{
    const form = e.target;
    if(!form.matches('[data-contact-form]')) return;
    e.preventDefault();

    ensureRequiredAttrs(form);
    if(!validateForm(form)) return;

    const prog = programInfo(form);
    const ctx  = ctxFrom(form);
    const text = buildText(ctx, prog);

    const ch = (form.elements['channel']?.value || form.dataset.channel || '').toLowerCase();
    const channel = ch || (digits(CFG.whatsapp||'') ? 'whatsapp' : 'telegram');

    if (channel==='whatsapp') openWA(text);
    else openTG(text);
  }, true);

  // --------- клики (кнопки / ссылки) ---------
  document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-whatsapp], a[data-telegram], [data-book], [data-booking], .js-book, a[href^="#book"]');
    if (!a) return;

    // если рядом есть форма — валидируем её
    const form = a.closest('form') || qs('[data-contact-form]');
    if (form) {
      ensureRequiredAttrs(form);
      if(!validateForm(form)){ e.preventDefault(); return; }
    }

    const prog = programInfo(a);
    const ctx  = ctxFrom(a);
    const text = buildText(ctx, prog);

    if (a.matches('[data-whatsapp]')) { e.preventDefault(); openWA(text); return; }
    if (a.matches('[data-telegram]')) { e.preventDefault(); openTG(text); return; }

    if (a.matches('[data-book], [data-booking], .js-book, a[href^="#book"]')){
      e.preventDefault();
      const chSel = (form?.elements?.channel?.value || a.dataset.channel || a.closest('[data-channel]')?.dataset.channel || '').toLowerCase();
      const channel = chSel || (digits(CFG.whatsapp||'') ? 'whatsapp' : 'telegram');
      if (channel==='whatsapp') openWA(text); else openTG(text);
    }
  }, true);

  // --------- базовые href (на случай отсутствия текста) ---------
  function patchBase(){
    const wa = digits(CFG.whatsapp||'');
    if (wa) qa('[data-whatsapp]').forEach(a=>{
      const href = a.getAttribute('href')||'';
      if(!href || href==='#' || href.startsWith('https://wa.me/')){
        a.setAttribute('href', `https://wa.me/${wa}`);
      }
      a.target = '_blank'; a.rel = 'noopener';
    });

    const user = String(CFG.telegram_user || CFG.telegram || '').replace(/^@/,'');
    qa('[data-telegram]').forEach(a=>{
      a.setAttribute('href', user ? `https://t.me/${user}` : 'https://t.me/share/url');
      a.target = '_blank'; a.rel = 'noopener';
    });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', patchBase, {once:true});
  else patchBase();

  console.log('[contact.js] ready (validation + TG deeplink/share fallback)');
})();
