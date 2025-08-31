/* assets/js/contact.js
   Авто-бронь без дубликатов: один делегированный обработчик на весь документ.
   Требует window.APP_CONFIG { email, whatsapp, telegram } из config.js
*/
(function(){
  if (window.__CONTACT_INIT__) return;
  window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const LANG = () => (localStorage.getItem('site:lang') || 'ru');

  // --- Утилиты ---
  const qs = (s, r=document) => r.querySelector(s);
  const qa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const onlyDigits = (s='') => String(s).replace(/\D/g,'');
  const isExt = (href='') => /^(https?:|mailto:|tel:|sms:|whatsapp:|\/\/)/i.test(href) || href.startsWith('#');

  function getProgramContext(fromEl){
    const root = fromEl?.closest('[data-program-title],[data-program-id],[data-program]') || document.body;
    const title = (fromEl?.dataset.programTitle) || root.dataset.programTitle || document.title.replace(/\s*[|—-].*$/,'').trim() || 'Программа';
    const id    = (fromEl?.dataset.programId)    || root.dataset.programId    || 'N/A';

    // Ищем ближайшую форму (если клик из формы) — берём значения
    const form = fromEl?.closest('form') || qs('[data-contact-form]');
    const fd = form ? new FormData(form) : new FormData();
    const name    = (fd.get('name')    || '').toString().trim();
    const contact = (fd.get('contact') || '').toString().trim();
    const when    = (fd.get('when')    || fd.get('date')    || '').toString().trim();
    const guests  = (fd.get('guests')  || fd.get('persons') || '').toString().trim();
    const message = (fd.get('message') || '').toString().trim();

    return {title, id, name, contact, when, guests, message};
  }

  function makeEmail({title,id,name,contact,when,guests,message}){
    const subject = encodeURIComponent(`Бронирование: ${title}`);
    const body = encodeURIComponent(
`Программа / Programme: ${title} (${id})
Имя / Nom: ${name}
Контакт / Contact: ${contact}
Дата / Date: ${when}
Гостей / Personnes: ${guests}
Сообщение / Message: ${message}

— Автоподпись / Signature —
Тур: ${title} (${id})
WhatsApp: https://wa.me/${onlyDigits(CFG.whatsapp)}
Telegram: https://t.me/${CFG.telegram||''}`
    );
    const mail = (CFG.email||'').trim() || 'info@example.com';
    return `mailto:${mail}?subject=${subject}&body=${body}`;
  }

  function makeWA({title,id,name,contact,message}){
    const hello = LANG()==='fr' ? 'Bonjour! ' : 'Здравствуйте! ';
    const text = `${hello}${name ? 'Меня зовут ' + name + '. ' : ''}${message ? message + '\n' : ''}${title ? 'Программа: ' + title + ' ' : ''}${id ? '('+id+') ' : ''}${contact ? '\nКонтакт: ' + contact : ''}`.trim();
    const wa = onlyDigits(CFG.whatsapp);
    return wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : '';
  }

  function makeTG({title,id,name,contact,message}){
    // Нельзя гарантированно префиллить текст прямо в DM с юзернеймом.
    // Делаем два шага: 1) копируем текст в буфер; 2) открываем t.me/username.
    const hello = LANG()==='fr' ? 'Bonjour! ' : 'Здравствуйте! ';
    const text = `${hello}${name ? 'Меня зовут ' + name + '. ' : ''}${message ? message + '\n' : ''}${title ? 'Программа: ' + title + ' ' : ''}${id ? '('+id+') ' : ''}${contact ? '\nКонтакт: ' + contact : ''}`.trim();
    const user = (CFG.telegram||'').trim();
    return { text, url: user ? `https://t.me/${user}` : `https://t.me/share/url?text=${encodeURIComponent(text)}` };
  }

  // Патч всех ссылок data-whatsapp — только номер (текст добавим по клику)
  function patchWhatsApp(){
    const wa = onlyDigits(CFG.whatsapp);
    if (!wa) return;
    qa('[data-whatsapp]').forEach(a=>{
      const raw = a.getAttribute('href') || '';
      if (!raw || !/^https?:/.test(raw)) a.setAttribute('href', `https://wa.me/${wa}`);
    });
  }

  // email линк в боксе контактов
  function patchEmailLink(){
    const el = qs('#emailLink');
    const mail = (CFG.email||'').trim();
    if (el && mail){
      el.href = `mailto:${mail}?subject=${encodeURIComponent('Запрос с сайта')}`;
      el.textContent = mail;
    }
  }

  // Следим за новыми нодами (если что-то дорисуешь динамически)
  const mo = new MutationObserver(() => patchWhatsApp());
  mo.observe(document.documentElement, {childList:true, subtree:true});

  // --- Делегирование кликов (один обработчик на документ) ---
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('a,button');

    // 1) Кнопка/ссылка "Забронировать" (без копипасты)
    if (a && (a.matches('[data-book], [data-booking], .js-book, a[href^="#book"]') || a.textContent.trim().toLowerCase().includes('забронировать'))) {
      const ctx = getProgramContext(a);
      const mailto = makeEmail(ctx);
      if (a.tagName === 'A'){
        a.setAttribute('href', mailto); // перезаписываем каждый раз, не дописывая!
        // даём браузеру перейти по ссылке сам
      } else {
        e.preventDefault();
        window.location.href = mailto;
      }
      return;
    }

    // 2) Любая ссылка с data-whatsapp — дополняем текст на лету
    if (a && a.matches('[data-whatsapp]')) {
      const url = makeWA(getProgramContext(a));
      if (!url){ alert('В config.js не задан номер WhatsApp'); e.preventDefault(); return; }
      a.setAttribute('href', url);
      // пусть откроется в той же/новой вкладке как задано в HTML
      return;
    }

    // 3) Быстрый скролл к контакту
    if (a && a.matches('a[href="#contact"], .cta')) {
      e.preventDefault();
      qs('#contact')?.scrollIntoView({behavior:'smooth'});
      return;
    }
  }, true); // capture — чтобы обогнать другие скрипты

  // --- Делегирование submit форм брони ---
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!form.matches('[data-contact-form]')) return;
    e.preventDefault();

    const ctx = getProgramContext(form);
    // Канал из <select name="channel"> или из data-channel формы
    const channel = (form.elements['channel']?.value || form.dataset.channel || 'email').toLowerCase();

    try{
      if (channel === 'email'){
        window.location.href = makeEmail(ctx);
      } else if (channel === 'whatsapp'){
        const url = makeWA(ctx);
        if (!url) throw new Error('whatsapp number missing');
        window.open(url, '_blank', 'noopener');
      } else if (channel === 'telegram'){
        const {text, url} = makeTG(ctx);
        try { await navigator.clipboard.writeText(text); } catch(_){}
        window.open(url, '_blank', 'noopener');
      } else if (channel === 'both'){
        const url1 = makeWA(ctx);
        const {text, url:url2} = makeTG(ctx);
        try { await navigator.clipboard.writeText(text); } catch(_){}
        if (url1) window.open(url1, '_blank', 'noopener');
        setTimeout(()=>window.open(url2, '_blank', 'noopener'), 120);
      } else {
        // по умолчанию — email
        window.location.href = makeEmail(ctx);
      }
    } catch(err){
      console.error('[contact] submit error', err);
      alert('Не удалось подготовить отправку. Проверьте config.js');
    }
  }, true);

  // --- Стартовые патчи один раз ---
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => {
      patchWhatsApp();
      patchEmailLink();
    }, {once:true});
  } else {
    patchWhatsApp();
    patchEmailLink();
  }
})();
