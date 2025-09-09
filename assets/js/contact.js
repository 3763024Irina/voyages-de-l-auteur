<script>
;(function(){
  'use strict';
  if (window.__CONTACT_INIT__) return; window.__CONTACT_INIT__ = true;

  const CFG = window.APP_CONFIG || {};
  const digits = s => String(s||'').replace(/\D/g,'');

  // --- Страница/Программа: собираем контекст ---
  function pageContext(){
    const html = document.documentElement;
    const ctx = {
      url: location.href,
      title: document.querySelector('h1, .page-title, title')?.textContent?.trim() || document.title,
      programId: html.getAttribute('data-program-id') || '',
      programTitle: html.getAttribute('data-program-title') || '',
      programPrice: html.getAttribute('data-program-price') || ''
    };
    // если атрибутов нет — берём из оглавления/заголовка
    if (!ctx.programTitle) ctx.programTitle = ctx.title;
    return ctx;
  }

  // --- Формируем текст сообщения ---
  function buildMessage(formEl){
    const f = (name) => formEl.querySelector(`[name="${name}"]`)?.value?.trim() || '';
    const ctx = pageContext();

    const lines = [
      `Заявка с сайта Tours Languedoc by Irène`,
      ctx.programId ? `Программа: ${ctx.programTitle} [${ctx.programId}]` : `Страница: ${ctx.title}`,
      ctx.programPrice ? `Цена/пакет: ${ctx.programPrice}` : '',
      `URL: ${ctx.url}`,
      `—`,
      `Имя: ${f('name')}`,
      `Контакт: ${f('contact')}`,
      `Дата: ${f('date')}`,
      `Гостей: ${f('guests')}`,
      `Сообщение: ${f('message')}`
    ].filter(Boolean);

    return lines.join('\n');
  }

  // --- Валидация (минимально строго) ---
  function validate(formEl){
    const need = ['name','contact','date','guests','message'];
    for (const n of need){
      const el = formEl.querySelector(`[name="${n}"]`);
      if (!el || !el.value.trim()){
        el?.focus();
        throw new Error('Пожалуйста, заполните все поля формы.');
      }
    }
  }

  // --- Каналы отправки ---
  function openWhatsApp(text){
    const phone = digits(CFG.whatsapp || '');
    if (!phone) throw new Error('Не задан номер WhatsApp в APP_CONFIG.');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
  }

  async function openTelegram(text){
    const bot = (CFG.telegram_bot || '').replace(/^@/,'');
    const preUrl = CFG.bot_prestart_url || '';

    // Если задан prestart-сервис — попробуем выписать токен и открыть бота
    if (bot && preUrl){
      try{
        const body = { text, page: location.href };
        const res = await fetch(preUrl.replace(/\/health\/?$/,'/prestart'), {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data && data.token){
          window.open(`https://t.me/${bot}?start=${encodeURIComponent(data.token)}`, '_blank', 'noopener');
          return;
        }
      }catch(e){ /* молча падаем на профиль ниже */ }
    }
    // Иначе — открываем профиль/бот без токена
    const user = (CFG.telegram_user || bot || '').replace(/^@/,'');
    if (!user) throw new Error('Не задан Telegram (telegram_user или telegram_bot) в APP_CONFIG.');
    window.open(`https://t.me/${user}`, '_blank', 'noopener');
  }

  // --- Обработчик формы ---
  function wireForm(form){
    if (!form) return;
    if (form.__WIRED__) return; form.__WIRED__ = true;

    form.addEventListener('click', async (e)=>{
      const btn = e.target.closest('[data-channel]');
      if (!btn) return;
      e.preventDefault();
      try{
        validate(form);
        const text = buildMessage(form);
        const ch = btn.getAttribute('data-channel');
        if (ch === 'wa')       openWhatsApp(text);
        else if (ch === 'tg')  await openTelegram(text);
      }catch(err){
        alert(err.message || 'Не удалось отправить заявку.');
      }
    });
  }

  // --- Инициализация: главная форма + любые формы с data-order-form ---
  function init(){
    wireForm(document.querySelector('#quick-request'));     // главная
    document.querySelectorAll('[data-order-form]').forEach(wireForm); // на страницах программ
  }

  document.addEventListener('DOMContentLoaded', init);
})();
</script>

