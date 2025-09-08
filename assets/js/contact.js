/* assets/js/contact.js — WhatsApp & Telegram (c /prestart и robust deep-link)
   Обязательные поля: name, contact, date, guests, message, program{title,id,url}

   Логика:
   1) Собираем payload, валидируем.
   2) POST -> CFG.bot_prestart_url (/prestart) — получаем token (и/или url).
   3) Открываем Telegram через openTelegramDeepLink (tg:// + t.me fallback), без рефреша страницы.

   Конфиг в HTML (до этого файла):
   <script>
     window.APP_CONFIG = {
       whatsapp: '+33 7 59 64 48 13',
       telegram_user: 'de_iren',                 // резервный username
       telegram_bot:  'de_iren_order_bot',       // имя бота БЕЗ @
       bot_prestart_url: 'https://<ТВОЙ_СЕРВЕР>/prestart'
     };
   </script>
*/

(function () {
  'use strict';

  if (window.__CONTACT_INIT__) {
    console.warn('[contact.js] already initialized');
    return;
  }
  window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const isMobile = /(iPad|iPhone|iPod|Android)/i.test(navigator.userAgent);

  // --------- утилиты ----------
  const $ = (sel) => document.querySelector(sel);
  function val(id) {
    const el = typeof id === 'string' ? $(id) : id;
    return (el?.value || '').trim();
  }
  function toIntSafe(v, dflt = 1) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : dflt;
  }
  function toast(msg, ok = false) {
    try {
      // минималистичный toast
      let box = document.getElementById('contact-toast');
      if (!box) {
        box = document.createElement('div');
        box.id = 'contact-toast';
        document.body.appendChild(box);
      }
      box.textContent = msg;
      box.style.cssText = `
        position:fixed;left:50%;top:20px;transform:translateX(-50%);
        background:${ok ? '#0a7f4f' : '#b00020'};color:#fff;padding:10px 14px;
        border-radius:10px;z-index:99999;font:14px/1.3 system-ui;box-shadow:0 6px 20px rgba(0,0,0,.2)
      `;
      box.style.opacity = '1';
      setTimeout(() => { box.style.opacity = '0'; }, 2400);
    } catch (_) {}
  }

  // «бронебойный» открыватель Telegram
  function openTelegramDeepLink({ botUser, token }) {
    const username = String(botUser || CFG.telegram_bot || CFG.telegram_user || '').replace(/^@/, '');
    if (!username || !token) {
      alert('Ошибка: не получена ссылка для Telegram. Попробуйте ещё раз.');
      return;
    }
    const tgApp = `tg://resolve?domain=${encodeURIComponent(username)}&start=${encodeURIComponent(token)}`;
    const tgWeb = `https://t.me/${encodeURIComponent(username)}?start=${encodeURIComponent(token)}`;

    let win = null; let opened = false;
    try { win = window.open('', '_blank', 'noopener,noreferrer'); } catch (_) {}

    const tryOpen = (url) => {
      if (win) { win.location = url; opened = true; }
      else {
        const w = window.open(url, '_blank', 'noopener,noreferrer');
        opened = !!w;
      }
    };

    if (isMobile) {
      tryOpen(tgApp);
      setTimeout(() => { if (!opened) tryOpen(tgWeb); }, 800);
    } else {
      tryOpen(tgWeb);
    }

    setTimeout(() => {
      if (!opened) {
        const a = document.createElement('a');
        a.href = tgWeb; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = 'Открыть Telegram';
        Object.assign(a.style, {
          display: 'inline-block', padding: '10px 14px', border: '1px solid #ccc',
          borderRadius: '8px', marginTop: '8px'
        });
        const box = document.createElement('div');
        box.innerHTML = '<p>Браузер заблокировал открытие Telegram. Нажмите ссылку ниже:</p>';
        Object.assign(box.style, {
          position: 'fixed', left: '50%', top: '70px', transform: 'translateX(-50%)',
          background: '#fff', padding: '12px 14px', borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,.15)', zIndex: '99999'
        });
        box.appendChild(a);
        document.body.appendChild(box);
      }
    }, 1200);
  }

  // --------- сбор payload из формы ----------
  function collectPayload() {
    // Подстрой под свои id/селекторы полей
    const name    = val('#req_name')    || val('[name="name"]');
    const contact = val('#req_contact') || val('[name="contact"]');
    const date    = val('#req_date')    || val('[name="date"]');
    const guests  = toIntSafe(val('#req_guests') || val('[name="guests"]') || '1', 1);
    const message = val('#req_message') || val('[name="message"]');

    // Информация о программе (может быть в data-* атрибутах на странице)
    const program = {
      title: document.documentElement.getAttribute('data-program-title') ||
             (document.querySelector('meta[property="og:title"]')?.content) ||
             document.title || '',
      id:    document.documentElement.getAttribute('data-program-id') || '',
      url:   location.href
    };

    return { name, contact, date, guests, message, program };
  }

  function validatePayload(p) {
    const miss = [];
    if (!p.name)    miss.push('имя');
    if (!p.contact) miss.push('контакт');
    if (!p.date)    miss.push('дата');
    if (!p.guests)  miss.push('гости');
    if (!p.message) miss.push('сообщение');
    if (!p.program?.title) miss.push('программа');
    if (miss.length) {
      toast('Заполните поля: ' + miss.join(', '));
      return false;
    }
    return true;
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const t = await res.text().catch(()=> '');
      throw new Error(`HTTP ${res.status}: ${t || res.statusText}`);
    }
    return res.json();
  }

  // --------- обработчики кнопок ----------
  async function onSendTelegram(e) {
    if (e) e.preventDefault();
    const btn = e?.currentTarget;
    try {
      if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }

      const payload = collectPayload();
      if (!validatePayload(payload)) return;

      const preUrl = String(CFG.bot_prestart_url || '').trim();
      if (!preUrl) throw new Error('Не указан bot_prestart_url в APP_CONFIG');

      const resp = await postJSON(preUrl, payload);
      if (!resp?.ok) throw new Error('prestart failed');

      const token = resp.token;
      // если сервер прислал готовый url — можно просто открыть его:
      // const deep = resp.url || `https://t.me/${(CFG.telegram_bot||'').replace(/^@/,'')}?start=${token}`;
      openTelegramDeepLink({ botUser: (CFG.telegram_bot || CFG.telegram_user || '').replace(/^@/, ''), token });

      toast('Открываю Telegram…', true);
    } catch (err) {
      console.error('[contact.js][tg] error:', err);
      toast('Не удалось открыть Telegram. ' + (err?.message || ''), false);
    } finally {
      if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
    }
  }

  async function onSendWhatsApp(e) {
    if (e) e.preventDefault();
    const btn = e?.currentTarget;
    try {
      if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }

      const p = collectPayload();
      if (!validatePayload(p)) return;

      const phone = String(CFG.whatsapp || '').replace(/[^\d]/g, '');
      if (!phone) throw new Error('Не указан номер WhatsApp в APP_CONFIG');

      const lines = [
        `Имя: ${p.name}`,
        `Контакт: ${p.contact}`,
        `Дата: ${p.date}`,
        `Гостей: ${p.guests}`,
        `Программа: ${p.program?.title}${p.program?.id ? ` (${p.program.id})` : ''}`,
        `Страница: ${p.program?.url}`,
        p.message ? `Сообщение: ${p.message}` : ''
      ].filter(Boolean);

      const text = encodeURIComponent(lines.join('\n'));
      const waUrl = `https://wa.me/${phone}?text=${text}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      toast('Открываю WhatsApp…', true);
    } catch (err) {
      console.error('[contact.js][wa] error:', err);
      toast('Не удалось открыть WhatsApp. ' + (err?.message || ''), false);
    } finally {
      if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
    }
  }

  // --------- привязка кнопок ----------
  function bind() {
    // Кнопки Телеграм/WA — подстрой селекторы под твой HTML
    const tgBtn = document.getElementById('btn-telegram') || document.querySelector('[data-action="telegram"]');
    const waBtn = document.getElementById('btn-whatsapp') || document.querySelector('[data-action="whatsapp"]');
    tgBtn && tgBtn.addEventListener('click', onSendTelegram);
    waBtn && waBtn.addEventListener('click', onSendWhatsApp);

    // Если у тебя были <a href="#"> — отменяем дефолт, чтобы не было рефреша
    document.querySelectorAll('a[href="#"][data-action]').forEach(a => {
      a.addEventListener('click', (e) => e.preventDefault());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
