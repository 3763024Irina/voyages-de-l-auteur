/* contact.js — единый обработчик форм заявки (WhatsApp + Telegram + Email)
   Подключайте на страницах, где есть <form data-contact-form ...>
*/
(function () {
  "use strict";

  // ==== Конфиг ====
  const CFG = (window.APP_CONFIG || {});
  const cfg = {
    whatsapp: String(CFG.whatsapp || '33759644813').replace(/\D/g,''),
    telegram: (CFG.telegram || 'ToursLanguedocbyIrene').replace(/^@/,''),
    email: (CFG.email || '3763024@gmail.com'),
    siteUrl: location.origin + location.pathname
  };

  // ===== Вспомогалки =====
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = encodeURIComponent;
  const nl = "\n";

  function buildBody({ programTitle, programId, name, contact, when, guests, message }) {
    return [
      `Программа / Programme: ${programTitle} (${programId})`,
      `Имя / Nom: ${name||''}`,
      `Контакт / Contact: ${contact||''}`,
      `Дата / Date: ${when||''}`,
      `Гостей / Personnes: ${guests||''}`,
      `Сообщение / Message: ${message||''}`,
      ``,
      `— Автоподпись / Signature —`,
      `Тур: ${programTitle} (${programId})`,
      `WhatsApp: https://wa.me/${cfg.whatsapp}`,
      `Telegram: https://t.me/${cfg.telegram}`
    ].join(nl);
  }

  function openWhatsApp(body) {
    const url = `https://wa.me/${cfg.whatsapp}?text=${esc(body)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
  function openTelegramShare(body) {
    const url = `https://t.me/share/url?text=${esc(body)}&url=${esc(cfg.siteUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
  function openEmail(subject, body) {
    const url = `mailto:${esc(cfg.email)}?subject=${esc(subject)}&body=${esc(body)}`;
    window.location.href = url;
  }

  function toast(msg, timeout = 3200) {
    let el = document.createElement("div");
    el.setAttribute("style",
      "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0D2B1E;color:#fff;padding:10px 14px;border-radius:12px;font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.18);z-index:99999;max-width:92vw;text-align:center;"
    );
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), timeout);
  }

  function handleSubmit(form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(form);
      const programTitle = form.dataset.programTitle || fd.get("programTitle") || document.title || "Programme";
      const programId    = form.dataset.programId || fd.get("PROGRAM_ID")   || "PROGRAM";

      const name    = fd.get("name")    || "";
      const contact = fd.get("contact") || "";
      const when    = fd.get("when")    || fd.get("date") || "";
      const guests  = fd.get("guests")  || "";
      const message = fd.get("message") || "";

      const channel = (fd.get("channel") || form.dataset.channel || "both").toLowerCase();

      const body = buildBody({ programTitle, programId, name, contact, when, guests, message });
      const subject = `Заявка с сайта | ${programTitle} | Код: ${programId}`;

      // отправка по каналам
      if (channel === "whatsapp") {
        openWhatsApp(body);
      } else if (channel === "telegram") {
        openTelegramShare(body);
      } else if (channel === "email") {
        openEmail(subject, body);
      } else {
        // both: сначала WA, затем TG (небольшая задержка)
        openWhatsApp(body);
        setTimeout(() => openTelegramShare(body), 350);
      }

      toast("Спасибо! Заявка формируется в выбранном мессенджере / почте.");
      form.reset();
    });
  }

  function initContactForms() {
    $$("form[data-contact-form]").forEach(handleSubmit);
  }

  // Автоинициализация
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactForms);
  } else {
    initContactForms();
  }

  // Экспорт
  window.ContactInit = initContactForms;
})();
