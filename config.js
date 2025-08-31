/* config.js — конфиг + админ + WhatsApp/Telegram авто-отправка (телеграм = тот же номер) */
window.APP_CONFIG = window.APP_CONFIG || {
  // Достаточно указать только whatsapp — его же используем для Telegram
  // whatsapp: '33759644813',
  // needguide: 'https://needguide.ru/view_guide.php?user_id=22306',
  // ADMIN_SECRET: 'capion2025'
};

(function () {
  if (window.__CONFIG_INIT__) { console.warn('[config.js] already initialized'); return; }
  window.__CONFIG_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qs = (sel, root=document) => root.querySelector(sel);
  const qa = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const digits = (s='') => String(s).replace(/\D/g,'');
  const lang = () => localStorage.getItem('site:lang') || ((navigator.language||'').toLowerCase().startsWith('fr') ? 'fr' : 'ru');

  /* ================== ADMIN ================== */
  const ADMIN_KEY = 'site:admin';
  const isAdmin = () => localStorage.getItem(ADMIN_KEY) === 'on';
  const setAdmin = (on) => {
    localStorage.setItem(ADMIN_KEY, on ? 'on' : 'off');
    document.documentElement.classList.toggle('is-admin', !!on);
    drawAdminBadge();
  };

  function drawAdminBadge() {
    const id = 'admin-badge';
    let el = document.getElementById(id);
    if (!isAdmin()) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.innerHTML = `
        <div style="position:fixed; right:14px; bottom:14px; z-index:9999;
                    background:#0D2B1E; color:#fff; border-radius:12px;
                    padding:10px 12px; box-shadow:0 10px 22px rgba(0,0,0,.18);
                    font:600 13px/1.2 Inter, system-ui; display:flex; gap:8px; align-items:center;">
          <span>Admin</span>
          <a href="${CFG.needguide||'#'}" target="_blank" rel="noopener"
             style="background:#C9B886; color:#1b1b1b; padding:6px 10px; border-radius:10px; font-weight:800; text-decoration:none;">NeedGuide</a>
          <button id="admin-logout" style="background:transparent; color:#fff; border:1px solid rgba(255,255,255,.4);
                 padding:6px 10px; border-radius:10px; cursor:pointer;">Выйти</button>
        </div>`;
      document.body.appendChild(el);
      document.getElementById('admin-logout')?.addEventListener('click', () => {
        setAdmin(false);
        alert('Admin OFF');
      }, { once: true });
    }
  }

  function getParam(name) {
    const url = new URL(window.location.href);
    const s1 = url.searchParams.get(name);
    const s2 = new URLSearchParams(url.hash.replace(/^#/, '?')).get(name);
    return s1 || s2;
  }
  function tryAdminLoginFromURL() {
    const s = getParam('admin');
    if (s && s === String(CFG.ADMIN_SECRET || '')) {
      setAdmin(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      if (url.hash.includes('admin=')) url.hash = '';
      history.replaceState({}, document.title, url.toString());
      alert('Admin ON');
    }
  }
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      const code = prompt('Admin code');
      if (code === String(CFG.ADMIN_SECRET || '')) { setAdmin(true); alert('Admin ON'); }
      else { alert('Wrong code'); }
    }
  });

  /* ====== Патч видимых ссылок WhatsApp (без текста) ====== */
  function patchWhatsAppHrefOnly() {
    const wa = digits(CFG.whatsapp || '');
    if (!wa) return;
    qa('[data-whatsapp]').forEach(a => {
      // просто номер, без текста (текст добавляем на клик)
      a.setAttribute('href', `https://wa.me/${wa}`);
    });
  }

  /* ================== МЕССЕНДЖЕРЫ (WA/TG) ================== */

  // Заголовок/ID программы — берём из ближайшей разметки или из страницы
  function getProgramInfo(fromEl){
    const root = fromEl?.closest('[data-program-title],[data-program-id],[data-program]') || document.body;
    const metaTitle = qs('meta[property="og:title"]')?.getAttribute('content') || '';
    // document.title без хвостов после | — если надо
    const docTitle = document.title.replace(/\s*[|—-].*$/, '').trim();
    const title = root?.dataset?.programTitle || metaTitle || docTitle || 'Программа';
    // id: data-program-id, иначе имя файла URL
    const id = root?.dataset?.programId ||
               (location.pathname.split('/').pop()||'').replace(/\.[a-z0-9]+$/i,'') ||
               'N/A';
    return { title, id };
  }

  function ctxFrom(el){
    const form = el?.closest('form') || qs('[data-contact-form]') || null;
    const fd = form ? new FormData(form) : new FormData();
    return {
      name   : (fd.get('name')   || '').toString().trim(),
      contact: (fd.get('contact')|| '').toString().trim(),
      date   : (fd.get('date')   || fd.get('when') || '').toString().trim(),
      guests : (fd.get('guests') || fd.get('persons') || '').toString().trim(),
      message: (fd.get('message')|| '').toString().trim()
    };
  }

  function buildText(ctx, prog){
    const hello = (lang()==='fr') ? 'Bonjour! ' : 'Здравствуйте! ';
    const lines = [
      hello + (ctx.name ? `Меня зовут ${ctx.name}. ` : ''),
      ctx.message ? ctx.message : '',
      ctx.date   ? `\nДата: ${ctx.date}` : '',
      ctx.guests ? `\nГостей: ${ctx.guests}` : '',
      `\nПрограмма: ${prog.title} (${prog.id})`,
      ctx.contact? `\nКонтакт: ${ctx.contact}` : ''
    ];
    return lines.join('').trim();
  }

  function openWhatsApp(text){
    const wa = digits(CFG.whatsapp || '');
    if (!wa) { alert('В config.js не указан номер WhatsApp'); return; }
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  }

  // В Telegram пробуем открыть чат по телефону (tg://resolve?phone=), если не сработает — веб-шэр с текстом
  function openTelegram(text){
    const phone = digits(CFG.whatsapp || ''); // Тот же номер, что и для WhatsApp
    const appUrl = phone ? `tg://resolve?phone=${phone}` : '';
    const webShare = `https://t.me/share/url?text=${encodeURIComponent(text)}`;

    if (appUrl){
      // Попытка открыть приложение; если фокуса не потеряли — откроем веб-шер
      const hadFocus = document.hasFocus();
      // попытка навигации в приложение
      window.location.href = appUrl;
      setTimeout(()=>{
        // Если остаёмся на странице (фокус не ушёл), открываем веб-шер
        if (document.hasFocus() === hadFocus) window.open(webShare, '_blank', 'noopener');
      }, 700);
    } else {
      window.open(webShare, '_blank', 'noopener');
    }
  }

  function initMessenger() {
    // Делегированный submit всех форм брони
    document.addEventListener('submit', async (e) => {
      const form = e.target;
      if (!form.matches('[data-contact-form]')) return;
      e.preventDefault();

      const prog = getProgramInfo(form);
      const ctx  = ctxFrom(form);
      const text = buildText(ctx, prog);
      try { await navigator.clipboard.writeText(text); } catch(_) {}

      const channel = (form.elements['channel']?.value || form.dataset.channel || 'telegram').toLowerCase();
      if (channel === 'whatsapp')      openWhatsApp(text);
      else if (channel === 'telegram') openTelegram(text);
      else if (channel === 'both')    { openWhatsApp(text); setTimeout(()=>openTelegram(text), 120); }
    }, true);

    // Делегированные клики по кнопкам WA/TG (подставляем текст на лету)
    document.addEventListener('click', async (e) => {
      const a = e.target.closest('a[data-whatsapp], a[data-telegram]');
      if (!a) return;

      const prog = getProgramInfo(a);
      const ctx  = ctxFrom(a);
      const text = buildText(ctx, prog);
      try { await navigator.clipboard.writeText(text); } catch(_) {}

      if (a.matches('[data-whatsapp]')) {
        e.preventDefault();
        openWhatsApp(text);
        return;
      }
      if (a.matches('[data-telegram]')) {
        e.preventDefault();
        openTelegram(text);
        return;
      }
    }, true);

    // Изначально проставим «голые» ссылки (без текста) по номеру
    patchWhatsAppHrefOnly();
    const phone = digits(CFG.whatsapp || '');
    qa('[data-telegram]').forEach(a=>{
      // пробуем указать app-схему; текст всё равно добавим по клику
      if (phone) a.setAttribute('href', `tg://resolve?phone=${phone}`);
      else a.setAttribute('href', 'https://t.me/share/url');
    });
  }

  /* ================== Admin Link UX (как было) ================== */
  function initAdminLinkUX() {
    if (!document.getElementById('admin-link-style')) {
      const st = document.createElement('style');
      st.id = 'admin-link-style';
      st.textContent = `
        html:not(.is-admin) [data-admin-only] { display: none !important; }
        html.is-admin a[data-admin-link] { outline: 1px dashed #C9B886; outline-offset: 2px; }
      `;
      document.head.appendChild(st);
    }

    const toast = (msg) => {
      const el = document.createElement('div');
      el.textContent = msg;
      Object.assign(el.style, {
        position:'fixed', left:'50%', bottom:'20px', transform:'translateX(-50%)',
        background:'#0D2B1E', color:'#fff', padding:'10px 14px', borderRadius:'10px',
        boxShadow:'0 10px 22px rgba(0,0,0,.18)', font:'600 13px/1 Inter,system-ui', zIndex: 99999,
      });
      document.body.appendChild(el);
      setTimeout(()=> el.remove(), 1800);
    };

    document.addEventListener('click', (e) => {
      const loginBtn = e.target.closest('[data-admin-login]');
      if (loginBtn) {
        e.preventDefault();
        const code = prompt('Admin code');
        if (code === String(CFG.ADMIN_SECRET || '')) { setAdmin(true); alert('Admin ON'); }
        else { alert('Wrong code'); }
        return;
      }
      const logoutBtn = e.target.closest('[data-admin-logout]');
      if (logoutBtn) {
        e.preventDefault();
        setAdmin(false);
        alert('Admin OFF');
        return;
      }

      if (!isAdmin()) return;
      const a = e.target.closest('a[data-admin-link]');
      if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const href = a.getAttribute('href') || '';
      navigator.clipboard?.writeText(href).catch(()=>{});
      toast('Скопировано: ' + href);
    }, true);
  }

  /* ================== INIT ================== */
  window.__CONFIG_LOADED__ = true;
  window.__setAdmin = setAdmin;
  window.__isAdmin  = isAdmin;

  window.addEventListener('DOMContentLoaded', () => {
    if (isAdmin()) document.documentElement.classList.add('is-admin');
    tryAdminLoginFromURL();
    drawAdminBadge();
    initAdminLinkUX();
    initMessenger(); // <<=== ВКЛЮЧАЕМ АВТО-ОТПРАВКУ WA/TG ПО ВСЕЙ СТРАНИЦЕ
    console.log('[config.js] ready, admin=', isAdmin());
  });
})();
