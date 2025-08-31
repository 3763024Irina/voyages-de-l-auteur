<script>
/* config.js */
window.APP_CONFIG = window.APP_CONFIG || {};

(function () {
  // ---- ГЛОБАЛЬНЫЙ ГАРД: не инициализировать повторно ----
  if (window.__CONFIG_INIT__) {
    console.warn('[config.js] already initialized, skip.');
    return;
  }
  window.__CONFIG_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const qsAll = (sel) => Array.from(document.querySelectorAll(sel));

  // === Admin state
  const ADMIN_KEY = 'site:admin';
  const isAdmin = () => localStorage.getItem(ADMIN_KEY) === 'on';
  const setAdmin = (on) => {
    localStorage.setItem(ADMIN_KEY, on ? 'on' : 'off');
    document.documentElement.classList.toggle('is-admin', !!on);
    drawAdminBadge();
  };

  // Admin badge (виден только админу)
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

  // Вход по ?admin=SECRET или Ctrl+Shift+A
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

  // Подстановка WhatsApp на все ссылки с data-whatsapp
  function patchWhatsApp() {
    const phone = String(CFG.whatsapp || '').replace(/\D/g, '');
    if (!phone) return;
    qsAll('[data-whatsapp]').forEach(a => a.setAttribute('href', `https://wa.me/${phone}`));
  }

  // ====== ФИКС «копипаста» на кнопке ЗАБРОНИРОВАТЬ ======
  // Навешиваем обработчик один раз и всегда формируем mailto с нуля.
  const _bookingBound = new WeakSet();
  function wireBookingMailto() {
    const SELECTOR = [
      '[data-book]', '[data-booking]', '.js-book', 'a[href^="#book"]'
    ].join(',');

    const targets = qsAll(SELECTOR);
    if (!targets.length) return;

    targets.forEach(el => {
      if (_bookingBound.has(el)) return; // уже привязан
      _bookingBound.add(el);

      el.addEventListener('click', (ev) => {
        // Собираем данные: из data-*, ближайшей формы и т.д.
        const root = el.closest('[data-program], [data-program-title], [data-program-id]') || document.body;
        const programTitle =
          el.dataset.programTitle ||
          root?.dataset?.programTitle ||
          document.title.replace(/\s*[|—-].*$/, '').trim() ||
          'Программа';

        const programId =
          el.dataset.programId ||
          root?.dataset?.programId ||
          'N/A';

        // Ищем ближайшую форму (если есть) — берём значения
        const form = el.closest('form');
        const fd = form ? new FormData(form) : new FormData();
        const when   = fd.get('when')   || fd.get('date')    || '';
        const guests = fd.get('guests') || fd.get('persons') || '';
        const name   = fd.get('name')   || '';
        const contact= fd.get('contact')|| '';
        const msg    = fd.get('message')|| '';

        const body = encodeURIComponent(
`Программа / Programme: ${programTitle} (${programId})
Имя / Nom: ${name}
Контакт / Contact: ${contact}
Дата / Date: ${when}
Гостей / Personnes: ${guests}
Сообщение / Message: ${msg}

— Автоподпись / Signature —
Тур: ${programTitle} (${programId})
WhatsApp: https://wa.me/${String(CFG.whatsapp || '').replace(/\D/g,'')}
Telegram: https://t.me/${CFG.telegram || ''}`
        );
        const subject = encodeURIComponent(`Бронирование: ${programTitle}`);
        const mail = String(CFG.email || '').trim() || 'info@example.com';
        const mailto = `mailto:${mail}?subject=${subject}&body=${body}`;

        // Важно: НЕ добавляем к существующему href, а ПЕРЕЗАПИСЫВАЕМ
        if (el.tagName === 'A') {
          el.setAttribute('href', mailto);
          // Для надёжности даём браузеру следовать по ссылке
        } else {
          ev.preventDefault();
          window.location.href = mailto;
        }
      }, { capture: true }); // capture — чтобы перехватить до других слушателей
    });
  }

  // Глобальный флажок для диагностики
  window.__CONFIG_LOADED__ = true;
  // Экспорт хелперов (по желанию)
  window.__wireBookingMailto = wireBookingMailto;
  window.__patchWhatsApp = patchWhatsApp;

  window.addEventListener('DOMContentLoaded', () => {
    if (isAdmin()) document.documentElement.classList.add('is-admin');
    tryAdminLoginFromURL();
    patchWhatsApp();
    drawAdminBadge();
    wireBookingMailto();
    console.log('[config.js] loaded, admin=', isAdmin());
  });
})();
</script>

