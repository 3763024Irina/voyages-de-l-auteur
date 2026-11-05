// /assets/js/cookies.js
(function () {
  // ====== Конфиг из страницы ======
  const CFG      = window.ANALYTICS_CONFIG || {};
  const GA_ID    = (CFG.GA_ID || "").trim();     // напр. "G-ABC1234"
  const YM_ID    = Number(CFG.YM_ID || 0) || 0;  // напр. 12345678
  const VERSION  = String(CFG.consentVersion || "v1");
  const LS_KEY   = `cookieConsent.${VERSION}`;

  // ====== Заглушка Consent Mode (v2): denied по умолчанию ======
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments); };
  gtag('consent', 'default', {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  // ====== Если выбор уже сохранён — применяем и выходим ======
  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (saved) { apply(saved); return; }
  } catch (_) {}

  // ====== Тексты RU/FR ======
  const lang = (document.documentElement.lang || "ru").toLowerCase().startsWith("fr") ? "fr" : "ru";
  const T = lang === "fr" ? {
    title:  "🍪 Cookies",
    text:   "Nous utilisons des cookies essentiels pour le bon fonctionnement du site et, avec votre accord, l’analyse (GA4 / Yandex) pour améliorer nos services.",
    accept: "Tout accepter",
    essential: "Essentiels seulement"
  } : {
    title:  "🍪 Cookies",
    text:   "Мы используем необходимые файлы cookie для работы сайта и, с вашего согласия, аналитику (GA4 / Яндекс) для улучшения сервиса.",
    accept: "Согласиться",
    essential: "Только необходимые"
  };

  // ====== Стили баннера ======
  const style = document.createElement("style");
  style.textContent = `
#ck-banner{position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:9999;max-width:900px;margin:auto;
  background:#fff;border:1px solid #e6e6e6;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:14px 16px;border-radius:12px;
  font:14px/1.45 Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial}
#ck-banner h3{margin:0 0 6px 0;font-size:16px;color:#0D2B1E}
#ck-banner p{margin:0 0 10px 0}
#ck-banner .row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
#ck-banner button{cursor:pointer;border:1px solid #d0d0d0;background:#fff;border-radius:10px;padding:8px 12px;font-weight:600}
#ck-banner .primary{background:#0D2B1E;color:#fff;border-color:#0D2B1E}
  `;
  document.head.appendChild(style);

  // ====== Разметка баннера ======
  const box = document.createElement("div");
  box.id = "ck-banner";
  box.innerHTML = `
    <h3>${T.title}</h3>
    <p>${T.text}</p>
    <div class="row">
      <button id="ck-essential">${T.essential}</button>
      <button id="ck-accept" class="primary">${T.accept}</button>
    </div>
  `;

  // Показ баннера
  function show() {
    if (!document.getElementById("ck-banner")) {
      if (document.body) document.body.appendChild(box);
      else document.addEventListener("DOMContentLoaded", () => document.body.appendChild(box), {once:true});
    }
  }

  // Сохраняем выбор пользователя
  function save(consent) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(consent)); } catch(_) {}
  }

  // ====== Подключение аналитики ======
  function loadScript(src, onload) {
    const s = document.createElement("script");
    s.async = true; s.src = src; if (onload) s.onload = onload;
    document.head.appendChild(s);
  }

  // Google Analytics 4
  function enableGA() {
    if (!GA_ID || window.__ga_enabled__) return;
    window.__ga_enabled__ = true;

    // Разрешаем только аналитическое хранилище: рекламные функции сайту не нужны.
    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true, send_page_view: true });

    loadScript("https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(GA_ID));
    console.log("[cookies] GA4 enabled:", GA_ID);
  }

  // Яндекс.Метрика
  function enableYM() {
    if (!YM_ID || window.__ym_enabled__) return;
    window.__ym_enabled__ = true;

    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){ (m[i].a=m[i].a||[]).push(arguments); };
      m[i].l=1*new Date();
      k=e.createElement(t),a=e.getElementsByTagName(t)[0];
      k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

    window.ym(YM_ID, "init", {
      clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true
    });
    console.log("[cookies] Yandex Metrica enabled:", YM_ID);
  }

  function apply(consent) {
    if (consent && consent.analytics) {
      enableGA();
      enableYM();
    }
  }

  // Единая аналитика событий на всех страницах сайта.
  function trackEvent(name, params) {
    const data = params || {};
    if (window.__ga_enabled__ && typeof window.gtag === "function") {
      window.gtag("event", name, data);
    }
    if (window.__ym_enabled__ && typeof window.ym === "function") {
      window.ym(YM_ID, "reachGoal", name, data);
    }
  }

  document.addEventListener("click", function (event) {
    const link = event.target && event.target.closest
      ? event.target.closest("a, button, [data-whatsapp], [data-telegram]")
      : null;
    if (!link) return;

    const href = (link.getAttribute("href") || "").toLowerCase();
    const label = (link.innerText || link.getAttribute("aria-label") || link.title || "").trim().slice(0, 100);
    let method = "";
    if (link.hasAttribute("data-whatsapp") || /wa\.me|whatsapp/.test(href)) method = "whatsapp";
    else if (link.hasAttribute("data-telegram") || /t\.me|telegram/.test(href)) method = "telegram";
    else if (href.startsWith("tel:")) method = "phone";
    else if (href.startsWith("mailto:")) method = "email";
    if (method) trackEvent("contact_click", { contact_method: method, link_url: href, link_text: label });
  }, true);

  document.addEventListener("submit", function (event) {
    const form = event.target;
    if (form && form.tagName === "FORM") {
      trackEvent("lead_form_submit", {
        form_id: form.id || "",
        form_name: form.getAttribute("name") || "",
        page_path: location.pathname
      });
    }
  }, true);

  // Отдельное событие просмотра карточки программы.
  document.addEventListener("DOMContentLoaded", function () {
    const page = document.querySelector("[data-program-id]");
    if (page) {
      trackEvent("view_program", {
        program_id: page.getAttribute("data-program-id") || "",
        program_title: page.getAttribute("data-program-title") || document.title
      });
    }
  }, { once: true });

  // ====== Обработчики ======
  function acceptAll() {
    const c = { essential:true, analytics:true, ts:Date.now() };
    save(c); apply(c); box.remove();
  }
  function essentialsOnly() {
    const c = { essential:true, analytics:false, ts:Date.now() };
    save(c); box.remove();
  }

  function bind() {
    const yes = document.getElementById("ck-accept");
    const no  = document.getElementById("ck-essential");
    if (yes && no) {
      yes.addEventListener("click", acceptAll, {once:true});
      no.addEventListener("click", essentialsOnly, {once:true});
    }
  }

  // Показ при загрузке
  show();
  if (document.readyState === "complete" || document.readyState === "interactive") bind();
  else document.addEventListener("DOMContentLoaded", bind, {once:true});

  // ====== API для повторного открытия/сброса ======
  window.cookieConsent = {
    reset() { try { localStorage.removeItem(LS_KEY); } catch(_) {} location.reload(); },
    open()  { show(); bind(); }
  };
})();
