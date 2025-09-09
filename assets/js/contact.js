<script>
;(function(){
  'use strict';
  if (window.__CONTACT_INIT__) return; window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');
  const qs  = (sel, root=document) => root.querySelector(sel);
  const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // -------- контекст страницы --------
  function pageContext(){
    const html = document.documentElement, body = document.body;
    const ctx = {
      url: location.href,
      title: qs('h1, .page-title, .title')?.textContent?.trim() || document.title || '',
      programId: body.getAttribute('data-program-id') || html.getAttribute('data-program-id') || '',
      programTitle: body.getAttribute('data-program-title') || html.getAttribute('data-program-title') || '',
      programPrice: body.getAttribute('data-program-price') || html.getAttribute('data-program-price') || ''
    };
    if (!ctx.programTitle) ctx.programTitle = ctx.title;
    return ctx;
  }

  // -------- валидация формы --------
  function validate(form){
    const need = ['date','guests','name','contact']; // message — опционален
    for (const n of need){
      const el = form.querySelector(`[name="${n}"]`);
      if (!el || !String(el.value||'').trim()){
        el?.focus(); throw new Error('Пожалуйста, заполните дату, гостей, имя и контакт.');
      }
    }
  }

  // -------- сбор текста заявки --------
  function buildMessage(form=null){
    const ctx = pageContext();
    const f = name => form?.querySelector(`[name="${name}"]`)?.value?.trim() || '';

    const lines = [
      `Заявка с сайта Tours Languedoc by Irène`,
      ctx.programId ? `Программа: ${ctx.programTitle} [${ctx.programId}]` : `Страница: ${ctx.title}`,
      ctx.programPrice ? `Пакет/цена: ${ctx.programPrice}` : '',
      `URL: ${ctx.url}`
    ];

    if (form){
      lines.push(
        '—',
        `Дата: ${f('date')}`,
        `Гостей: ${f('guests')}`,
        `Имя: ${f('name')}`,
        `Контакт: ${f('contact')}`
      );
      if (f('message')) lines.push(`Сообщение: ${f('message')}`);
    }

    return lines.filter(Boolean).join('\n');
  }

  // -------- каналы --------
  function openWhatsApp(text){
    const phone = digits(CFG.whatsapp || '');
    if (!phone) throw new Error('Не задан номер WhatsApp в APP_CONFIG.');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  // ✅ Telegram SHARE (без бэкенда): откроет окно «Поделиться» с заполненным текстом
 <script>
function openTelegram(text){
  const user = (window.APP_CONFIG?.telegram_user || '').replace(/^@/,'');
  if (!user) { alert('Не задан Telegram username в APP_CONFIG. Пример: telegram_user: "de_iren"'); return; }

  // 1) Копируем заявку в буфер обмена (тихо).
  // Если копирование не получится (http/https/разрешения), просто продолжаем.
  if (navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).catch(()=>{});
  }

  // 2) Открываем чат с вашим контактам — клиент сразу попадает в диалог с вами.
  window.open(`https://t.me/${encodeURIComponent(user)}`, '_blank', 'noopener');

  // 3) Подсказка: что текст уже скопирован (чтобы клиент вставил и отправил).
  try {
    const note = document.createElement('div');
    note.textContent = 'Текст заявки скопирован. Вставьте в Telegram и отправьте.';
    note.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:10px;font:600 14px/1.2 system-ui;z-index:99999;box-shadow:0 6px 18px rgba(0,0,0,.2)';
    document.body.appendChild(note);
    setTimeout(()=>note.remove(), 2500);
  } catch(_) {}
}
</script>


  // -------- кнопки в герое (data-whatsapp / data-telegram) --------
  function wireHero(){
    qsa('[data-whatsapp]').forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true;
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        try{ openWhatsApp(buildMessage(null)); }catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      });
    });
    qsa('[data-telegram]').forEach(btn=>{
      if (btn.__wired) return; btn.__wired = true;
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        try{ openTelegram(buildMessage(null)); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      });
    });
  }

  // -------- кнопки в форме (.form-actions [data-whatsapp]/[data-telegram]) --------
  function wireForm(form){
    if (!form || form.__wired) return; form.__wired = true;

    const waBtn = form.closest('.card')?.querySelector('.form-actions [data-whatsapp]');
    const tgBtn = form.closest('.card')?.querySelector('.form-actions [data-telegram]');

    if (waBtn && !waBtn.__wired){
      waBtn.__wired = true;
      waBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        try{ validate(form); openWhatsApp(buildMessage(form)); }catch(err){ alert(err.message||'Не удалось открыть WhatsApp'); }
      });
    }
    if (tgBtn && !tgBtn.__wired){
      tgBtn.__wired = true;
      tgBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        try{ validate(form); openTelegram(buildMessage(form)); }catch(err){ alert(err.message||'Не удалось открыть Telegram'); }
      });
    }
  }

  function init(){
    wireHero();
    qsa('[data-contact-form], [data-order-form]').forEach(wireForm);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
</script>

