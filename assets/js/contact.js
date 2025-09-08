/* contact.js — WhatsApp & Telegram (бот + жёсткая валидация) — v3.3
   Изменения v3.3:
   • Фикс редких опечаток и гонок при openTG()
   • Ещё надёжнее deeplink: iOS → tg:// → web → AppStore; Android → intent:// → web
   • Нормализация bot_prestart_url: http→https, /health→/prestart
   • Строже сбор заголовка программы (og:title → [data-program-title] → .hero/.program-title/h1 → document.title)
*/
(function () {
  'use strict';
  if (window.__CONTACT_INIT__) { console.warn('[contact.js] already initialized'); return; }
  window.__CONTACT_INIT__ = true;

  // ---------- config ----------
  const CFG = window.APP_CONFIG || {};
  const DEF_WA = '+33 7 59 64 48 13';
  const DEF_TG = 'de_iren';
  const digits = (s='') => String(s).replace(/\D/g,'');

  const WA_DIGITS = digits(CFG.whatsapp || DEF_WA);

  function normalizePreUrl(u){
    if(!u) return '';
    try{
      let url = new URL(u, location.origin);
      // force https
      if (url.protocol !== 'https:') url = new URL('https://' + url.host + url.pathname + url.search + url.hash);
      // /health -> /prestart
      if (/\/health\/?$/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/health\/?$/i, '/prestart');
      }
      return url.toString();
    }catch{ return u; }
  }
  const TG_BOT = String(CFG.telegram_bot||'').replace(/^@/,'');
  const PRE_URL = normalizePreUrl(CFG.bot_prestart_url||'');

  const UA = navigator.userAgent;
  const isiOS = /iPad|iPhone|iPod/i.test(UA);
  const isAndroid = /Android/i.test(UA);

  const LANG = () => (localStorage.getItem('site:lang') || ((navigator.language||'').toLowerCase().startsWith('fr') ? 'fr' : 'ru'));
  const qs = (s,r=document)=>r.querySelector(s);
  const qa = (s,r=document)=>Array.from(r.querySelectorAll(s));

  // ---------- i18n ----------
  const I18N = {
    ru:{
      required:'Заполните поле',
      badContact:'Укажите телефон (WhatsApp), @username в Telegram или email',
      badGuests:'Минимум 1 гость',
      badDate:'Укажите дату',
      firstInvalid:'Проверьте форму — заполните все поля.',
      copiedTG:'Текст заявки скопирован. Откройте Telegram и вставьте его.',
      botFail:'Не удалось связаться с ботом. Попробуйте ещё раз или выберите WhatsApp.',
      waMissing:'В config.js не указан корректный номер WhatsApp',
      msgHello:(name)=> name?`Здравствуйте! Меня зовут ${name}. `:`Здравствуйте! `,
      msgDate:(v)=>`\nДата: ${v}`,
      msgGuests:(v)=>`\nГостей: ${v}`,
      msgProgram:(t,id)=>`\nПрограмма: ${t}${id?` (${id})`:''}`,
      msgPage:(u)=>`\nСтраница: ${u}`,
      msgContact:(c)=>`\nКонтакт: ${c}`
    },
    fr:{
      required:'Champ requis',
      badContact:'Indiquez un téléphone (WhatsApp), @username Telegram ou email',
      badGuests:'Au moins 1 personne',
      badDate:'Indiquez la date',
      firstInvalid:'Vérifiez le formulaire — remplissez tous les champs.',
      copiedTG:'Texte copié. Ouvrez Telegram et collez-le.',
      botFail:"Impossible de contacter le bot. Réessayez ou choisissez WhatsApp.",
      waMissing:"Le numéro WhatsApp n'est pas correctement configuré",
      msgHello:(name)=> name?`Bonjour ! Je m’appelle ${name}. `:`Bonjour ! `,
      msgDate:(v)=>`\nDate : ${v}`,
      msgGuests:(v)=>`\nPersonnes : ${v}`,
      msgProgram:(t,id)=>`\nProgramme : ${t}${id?` (${id})`:''}`,
      msgPage:(u)=>`\nPage : ${u}`,
      msgContact:(c)=>`\nContact : ${c}`
    }
  };
  const t = (k)=> (I18N[LANG()]||I18N.ru)[k];

  // ---------- helpers (copy/toast) ----------
  let toastLock=false;
  function legacyCopy(text){
    const ta=document.createElement('textarea');
    ta.value=text; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.top='-9999px';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(_){}
    document.body.removeChild(ta);
  }
  async function copyText(text){
    try{ if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(text); } else { legacyCopy(text); } }
    catch(_){ legacyCopy(text); }
  }
  function toast(msg){
    if(toastLock) return; toastLock=true;
    const el=document.createElement('div');
    el.textContent=msg;
    el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:120px;background:#0D2B1E;color:#fff;padding:8px 12px;border-radius:10px;font:500 13px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 10px 25px rgba(0,0,0,.2);z-index:10000;opacity:0;transition:opacity .2s';
    document.body.appendChild(el); requestAnimationFrame(()=>el.style.opacity='1');
    setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>{ el.remove(); toastLock=false; },250); },1600);
  }

  // ---------- errors ----------
  function injectErrCSS(){
    if(document.getElementById('contactjs-error-css')) return;
    const style=document.createElement('style');
    style.id='contactjs-error-css';
    style.textContent=`.field-error{color:#d33;font-size:12px;margin-top:6px}.is-error{border-color:#d33!important;outline:0}`;
    document.head.appendChild(style);
  }
  function clearError(el){
    if(!el) return;
    el.classList.remove('is-error'); el.removeAttribute('aria-invalid');
    const msg=el.parentElement && el.parentElement.querySelector('.field-error'); if(msg) msg.remove();
  }
  function showError(el,msg){
    if(!el) return;
    clearError(el); el.classList.add('is-error'); el.setAttribute('aria-invalid','true');
    const m=document.createElement('div'); m.className='field-error'; m.textContent=msg||t('required');
    el.parentElement && el.parentElement.appendChild(m);
  }

  // ---------- validators ----------
  const isPhone = v => /^[+\d][\d\s().-]{6,}$/.test((v||'').trim());
  const isTG    = v => /^@?[a-zA-Z0-9_]{5,}$/.test((v||'').trim());
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||'').trim());

  function findField(form,variants){ for(const sel of variants){ const el=form.querySelector(sel); if(el) return el; } return null; }
  function ensureRequiredAttrs(form){
    const map = {
      name:['[name="name"]','#name'],
      contact:['[name="contact"]','#contact'],
      date:['[name="date"]','#when','#date'],
      guests:['[name="guests"]','#guests'],
      message:['[name="message"]','#msg','#message','#comment']
    };
    Object.keys(map).forEach(key=>{ const el=findField(form,map[key]); if(el) el.setAttribute('required','required'); });
  }
  function validateForm(form){
    injectErrCSS(); let ok=true;

    const fName    = findField(form,['[name="name"]','#name']);
    const fContact = findField(form,['[name="contact"]','#contact']);
    const fDate    = findField(form,['[name="date"]','#when','#date']);
    const fGuests  = findField(form,['[name="guests"]','#guests']);
    const fMsg     = findField(form,['[name="message"]','#msg','#message','#comment']);

    [fName,fContact,fDate,fGuests,fMsg].forEach(el=>clearError(el));

    if(!fName || !fName.value.trim()){ showError(fName||form,t('required')); ok=false; }

    if(!fContact || !fContact.value.trim()){ showError(fContact||form,t('required')); ok=false; }
    else if(!(isPhone(fContact.value) || isTG(fContact.value) || isEmail(fContact.value))){
      showError(fContact,t('badContact')); ok=false;
    }

    if(!fDate || !fDate.value){ showError(fDate||form,t('badDate')); ok=false; }

    const g=parseInt((fGuests && fGuests.value)||'0',10);
    const minG=Math.max(1, Number(fGuests?.min||1));
    if(!Number.isFinite(g) || g<minG){ showError(fGuests||form,t('badGuests')); ok=false; }

    if(!fMsg || !fMsg.value.trim()){ showError(fMsg||form,t('required')); ok=false; }

    if(!ok){
      (form.querySelector('.is-error')||fName||form).focus({preventScroll:false});
      alert(t('firstInvalid'));
    }

    form.querySelectorAll('input,textarea,select').forEach(el=>{
      el.addEventListener('input',()=>clearError(el),{once:true});
      el.addEventListener('change',()=>clearError(el),{once:true});
    });
    return ok;
  }

  // ---------- data builders ----------
  function programInfo(fromEl){
    const root = fromEl?.closest('[data-program],[data-program-title],[data-program-id]') || document.documentElement;
    const ogTitle = qs('meta[property="og:title"]')?.getAttribute('content') || '';
    const dataTitle = root?.dataset?.programTitle || '';
    const heroTitle = qs('.hero .title, .program-title, h1')?.textContent?.trim() || '';
    const docTitle  = document.title.replace(/\s*[|—-].*$/, '').trim();
    const title = dataTitle || ogTitle || heroTitle || docTitle || 'Программа';
    const id    = root?.dataset?.programId ||
                  (location.pathname.split('/').pop()||'').replace(/\.[a-z0-9]+$/i,'') || '';
    return { title, id };
  }
  function ctxFrom(el){
    const form = el?.closest('form') || qs('[data-contact-form]') || document.querySelector('form');
    const fd = form ? new FormData(form) : new FormData();
    const first = names => { for(const n of names){ const v = fd.get(n); if(v) return String(v).trim(); } return ''; };
    return {
      name:   first(['name']),
      contact:first(['contact','phone']),
      date:   first(['date','when','day']),
      guests: first(['guests','persons','people']),
      message:first(['message','comment'])
    };
  }
  function buildText(ctx, prog){
    const L = (I18N[LANG()]||I18N.ru);
    const out = [];
    out.push(L.msgHello(ctx.name));
    if (ctx.message) out.push(ctx.message);
    if (ctx.date)   out.push(L.msgDate(ctx.date));
    if (ctx.guests) out.push(L.msgGuests(ctx.guests));
    out.push(L.msgProgram(prog.title, prog.id));
    out.push(L.msgPage(location.href));
    if (ctx.contact) out.push(L.msgContact(ctx.contact));
    return out.join('').trim();
  }

  // ---------- senders ----------
  function openWA(text){
    if(!WA_DIGITS){ alert(t('waMissing')); return; }
    const url = `https://wa.me/${WA_DIGITS}?text=${encodeURIComponent(text)}`;
    window.open(url,'_blank','noopener');
  }

  let clickLock=false;
  async function openTG(text, ctx, prog){
    if(clickLock) return; clickLock=true;

    const bot  = (CFG.telegram_bot||'').replace(/^@/,'');
    const user = (CFG.telegram_user||CFG.telegram||DEF_TG).replace(/^@/,'');
    const who  = bot || user || DEF_TG;

    // 1) пред-вкладка (user gesture)
    const tab = window.open('', '_blank');

    // 2) скопировать текст
    try{ await copyText(text); toast(t('copiedTG')); }catch(_){}

    // 3) токен у бота
    let token = '';
    if (bot && PRE_URL){
      try{
        const payload = {
          name:ctx?.name, contact:ctx?.contact, date:ctx?.date, guests:ctx?.guests, message:ctx?.message,
          program:{ title:prog?.title, id:prog?.id, url:location.href }, origin: location.origin
        };
        const r = await fetch(PRE_URL, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify(payload), keepalive:true
        });
        const j = await r.json().catch(()=>null);
        if (j?.token) token = String(j.token);
        else if (j?.ok && j?.id) token = String(j.id);
        else console.warn('[contact.js] prestart bad response:', {status:r.status, body:j});
      }catch(e){ console.warn('[contact.js] prestart failed:', e); }
    }

    // 4) deeplinks
    const deep   = `tg://resolve?domain=${who}${token?`&start=${encodeURIComponent(token)}`:''}`;
    const web    = `https://t.me/${who}${token?`?start=${encodeURIComponent(token)}`:''}`;
    const intent = `intent://resolve?domain=${who}${token?`&start=${encodeURIComponent(token)}`:''}` +
                   `#Intent;scheme=tg;package=org.telegram.messenger;S.browser_fallback_url=${encodeURIComponent(web)};end`;
    const appStore = 'https://apps.apple.com/app/telegram-messenger/id686449807';

    try{
      if (isiOS){
        if(tab) tab.location = web;
        location.href = deep;
        setTimeout(()=>{ if(document.visibilityState==='visible'){ location.href = web; setTimeout(()=>{ if(document.visibilityState==='visible') location.href = appStore; },900); } }, 800);
      } else if (isAndroid){
        if(tab) tab.location = intent; else location.href=intent;
      } else {
        if(tab) tab.location = deep; else location.href=deep;
        setTimeout(()=>{
          try{ if(!tab || tab.closed) window.open(web, '_self'); else tab.location = web; }
          catch(_){ location.href = web; }
        }, 500);
      }
    } finally {
      setTimeout(()=>{ clickLock=false; }, 1200);
    }
  }

  // ---------- submit (data-contact-form) ----------
  document.addEventListener('submit',(e)=>{
    const form=e.target; if(!form.matches('[data-contact-form]')) return;
    e.preventDefault();
    ensureRequiredAttrs(form);
    if(!validateForm(form)) return;

    const prog = programInfo(form);
    const ctx  = ctxFrom(form);
    const text = buildText(ctx, prog);

    const ch = (form.elements['channel']?.value || form.dataset.channel || '').toLowerCase();
    const channel = ch || (WA_DIGITS ? 'whatsapp' : 'telegram');

    if(channel==='whatsapp') openWA(text); else openTG(text, ctx, prog);
  }, true);

  // ---------- clicks (кнопки/ссылки) ----------
  document.addEventListener('click',(e)=>{
    const a = e.target.closest('a[data-whatsapp], a[data-telegram], [data-book], [data-booking], .js-book, a[href^="#book"]');
    if(!a) return;

    const form = a.closest('form') || qs('[data-contact-form]');
    if (form){
      ensureRequiredAttrs(form);
      if(!validateForm(form)){ e.preventDefault(); return; }
    }

    const prog = programInfo(a);
    const ctx  = ctxFrom(a);
    const text = buildText(ctx, prog);

    if (a.matches('[data-whatsapp]')) { e.preventDefault(); openWA(text); return; }
    if (a.matches('[data-telegram]')) { e.preventDefault(); openTG(text, ctx, prog); return; }

    if (a.matches('[data-book], [data-booking], .js-book, a[href^="#book"]')){
      e.preventDefault();
      const chSel = (form?.elements?.channel?.value || a.dataset.channel || a.closest('[data-channel]')?.dataset.channel || '').toLowerCase();
      const channel = chSel || (WA_DIGITS ? 'whatsapp' : 'telegram');
      if (channel==='whatsapp') openWA(text); else openTG(text, ctx, prog);
    }
  }, true);

  // ---------- базовые href-подстановки ----------
  function patchBase(){
    if (WA_DIGITS) qa('[data-whatsapp]').forEach(a=>{
      const href=a.getAttribute('href')||'';
      if(!href || href==='#' || href.startsWith('https://wa.me/')) a.setAttribute('href', `https://wa.me/${WA_DIGITS}`);
      a.target='_blank'; a.rel='noopener';
    });

    const user = (TG_BOT || String(CFG.telegram_user||CFG.telegram||DEF_TG).replace(/^@/,''));
    qa('[data-telegram]').forEach(a=>{
      a.setAttribute('href', `https://t.me/${user}`);
      a.target='_blank'; a.rel='noopener';
    });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', patchBase, {once:true});
  else patchBase();

   
  // debug
  window.CONTACT_DEBUG = { WA_DIGITS, TG_BOT, PRE_URL };
  console.log('[contact.js] ready (v3.3) — validation + WA normalize + TG prestart + robust deeplink/intent + fallbacks');
})();
