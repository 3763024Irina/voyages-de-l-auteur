/* assets/js/contact.js  — универсальный коннектор (v1.2: delegated capture bind)
   Подключается одной строкой на любой странице.

   Нужен window.APP_CONFIG:
   <script>
     window.APP_CONFIG = {
       whatsapp: '+33 7 59 64 48 13',
       telegram_user: 'de_iren',          // профиль
       telegram_bot:  'de_iren_order_bot',// бот для заявок
       bot_prestart_url: 'https://iren-order-bot.onrender.com/prestart'
     };
   </script>
*/
(function () {
  'use strict';

  if (window.__CONTACT_INIT__) return;
  window.__CONTACT_INIT__ = true;

  // ---- CONFIG ----
  const CFG = Object.assign({
    whatsapp: '',
    telegram_user: '',
    telegram_bot: '',
    bot_prestart_url: ''
  }, window.APP_CONFIG || {});

  // ---- UTILS ----
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $  = (sel, root = document) => root.querySelector(sel);
  const isMobile = /(iPad|iPhone|iPod|Android)/i.test(navigator.userAgent);

  function toast(msg, ok = false) {
    try {
      let box = $('#contact-toast');
      if (!box) {
        box = document.createElement('div');
        box.id = 'contact-toast';
        document.body.appendChild(box);
      }
      box.textContent = msg;
      box.style.cssText =
        `position:fixed;left:50%;top:20px;transform:translateX(-50%);
         background:${ok?'#0a7f4f':'#b00020'};color:#fff;padding:10px 14px;
         border-radius:10px;z-index:99999;font:14px/1.3 system-ui;box-shadow:0 6px 20px rgba(0,0,0,.2);opacity:1`;
      setTimeout(() => { box.style.opacity = '0'; }, 2000);
    } catch {}
  }

  function findForm(fromEl) {
    return fromEl?.closest?.('form')
        || $('[data-contact-form]')
        || $('form');
  }

  function valByNames(form, names) {
    for (const n of names) {
      const el = form.querySelector(`[name="${n}"]`);
      if (el && 'value' in el) return String(el.value).trim();
    }
    return '';
  }

  function toIntSafe(v, dflt=1){ const n = parseInt(v,10); return Number.isFinite(n) && n>0 ? n : dflt; }

  function collectPayload(fromEl) {
    const form = findForm(fromEl) || document;

    const name    = valByNames(form, ['name']);
    const contact = valByNames(form, ['contact']);
    const date    = valByNames(form, ['date']);
    const guests  = toIntSafe(valByNames(form, ['guests']) || '1', 1);
    const message = valByNames(form, ['message']);

    const program = {
      title: form?.dataset?.programTitle
          || document.documentElement.getAttribute('data-program-title')
          || $('meta[property="og:title"]')?.content
          || document.title
          || '',
      id: form?.dataset?.programId
          || document.documentElement.getAttribute('data-program-id')
          || '',
      url: location.href
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
    if (miss.length) { toast('Заполните: ' + miss.join(', ')); return false; }
    return true;
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // ---- OPENERS ----
  function openTelegramDeepLink({ botUser, token }) {
    const username = String(botUser || CFG.telegram_bot || CFG.telegram_user || '').replace(/^@/, '');
    if (!username || !token) { alert('Не получена ссылка для Telegram.'); return; }

    const tgApp = `tg://resolve?domain=${encodeURIComponent(username)}&start=${encodeURIComponent(token)}`;
    const tgWeb = `https://t.me/${encodeURIComponent(username)}?start=${encodeURIComponent(token)}`;

    let win = null, opened = false;
    try { win = window.open('', '_blank', 'noopener,noreferrer'); } catch {}
    const go = (url)=>{ if (win) { win.location = url; opened = true; } else { opened = !!window.open(url, '_blank','noopener,noreferrer'); } };

    if (isMobile) { go(tgApp); setTimeout(()=>{ if(!opened) go(tgWeb); }, 700); }
    else { go(tgWeb); }

    setTimeout(()=>{ if(!opened){ const a=document.createElement('a'); a.href=tgWeb; a.target='_blank'; a.textContent='Открыть Telegram'; a.style.cssText='position:fixed;left:50%;top:70px;transform:translateX(-50%);background:#fff;padding:10px 14px;border:1px solid #ccc;border-radius:10px;z-index:99999'; document.body.appendChild(a);} }, 1100);
  }

  function openTelegramProfile(username) {
    const u = String(username || CFG.telegram_user || CFG.telegram_bot || '').replace(/^@/, '');
    if (!u) { alert('Не задан telegram_user'); return; }
    const tgApp = `tg://resolve?domain=${encodeURIComponent(u)}`;
    const tgWeb = `https://t.me/${encodeURIComponent(u)}`;

    let win = null, opened = false;
    try { win = window.open('', '_blank', 'noopener,noreferrer'); } catch {}
    const go = (url)=>{ if (win) { win.location = url; opened = true; } else { opened = !!window.open(url, '_blank','noopener,noreferrer'); } };

    if (isMobile) { go(tgApp); setTimeout(()=>{ if(!opened) go(tgWeb); }, 600); }
    else { go(tgWeb); }
  }

  function openWhatsApp(p) {
    const phone = String(CFG.whatsapp || '').replace(/[^\d]/g,'');
    if (!phone) { alert('Не указан номер WhatsApp в APP_CONFIG'); return; }

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
  }

  // ---- HANDLERS ----
  async function onSendTelegram(e) {
    e && e.preventDefault();
    const btn = e?.currentTarget && e.currentTarget.nodeType === 1 ? e.currentTarget : undefined;
    try {
      if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }

      const payload = collectPayload(btn);
      if (!validatePayload(payload)) return;

      const preUrl = String(CFG.bot_prestart_url || '').trim();
      if (!preUrl) { openTelegramProfile(CFG.telegram_user || CFG.telegram_bot); toast('Открываю Telegram…', true); return; }

      const resp = await postJSON(preUrl, payload);
      if (!resp?.ok) throw new Error('prestart failed');
      const token = resp.token;
      openTelegramDeepLink({ botUser: (CFG.telegram_bot || CFG.telegram_user).replace(/^@/, ''), token });
      toast('Открываю Telegram…', true);
    } catch (err) {
      console.error('[contact.js][tg] error:', err);
      toast('Не удалось открыть Telegram.', false);
    } finally {
      if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
    }
  }

  async function onSendWhatsApp(e) {
    e && e.preventDefault();
    const btn = e?.currentTarget && e.currentTarget.nodeType === 1 ? e.currentTarget : undefined;
    try {
      if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }
      const p = collectPayload(btn);
      if (!validatePayload(p)) return;
      openWhatsApp(p);
      toast('Открываю WhatsApp…', true);
    } catch (err) {
      console.error('[contact.js][wa] error:', err);
      toast('Не удалось открыть WhatsApp.', false);
    } finally {
      if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
    }
  }

  function onOpenTelegramProfile(e){
    e && e.preventDefault();
    openTelegramProfile(CFG.telegram_user || CFG.telegram_bot);
    toast('Открываю Telegram…', true);
  }

  // Вспомогалки для делегированного клика
  const callTG  = (el)=> onSendTelegram({ currentTarget: el, preventDefault(){} });
  const c
