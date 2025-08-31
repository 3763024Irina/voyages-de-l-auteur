/* contact.js — единый обработчик форм заявки (WhatsApp + Telegram + Email)
   Подключайте ПОСЛЕ config.js. Работает с формами <form data-contact-form ...>
*/
(function () {
  "use strict";

  const APP = (window.APP_CONFIG || {});
  const DEFAULTS = { whatsapp: "", telegram: "" };

  function normalizedConfig(over = {}) {
    const wa = String(over.whatsapp || APP.whatsapp || DEFAULTS.whatsapp || "").replace(/\D/g, "");
    const tg = String(over.telegram || APP.telegram || DEFAULTS.telegram || "").replace(/^@/, "").trim();
    const email = String(over.email || APP.email || "").trim();
    return { whatsapp: wa, telegram: tg, email, siteUrl: location.origin + location.pathname };
  }

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = encodeURIComponent;

  function toast(msg, timeout = 3000) {
    const el = document.createElement("div");
    el.setAttribute("style", `
      position:fixed;left:50%;bottom:24px;transform:translateX(-50%);
      background:#0D2B1E;color:#fff;padding:12px 16px;border-radius:12px;
      font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      box-shadow:0 6px 24px rgba(0,0,0,.18);z-index:99999;max-width:90vw;text-align:center;
    `);
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), timeout);
  }

  function buildBody({ programTitle, programId, name, contact, when, guests, message, cfg }) {
    const lines = [
      `Программа / Programme: ${programTitle} (${programId})`,
      `Имя / Nom: ${name || ""}`,
      `Контакт / Contact: ${contact || ""}`,
      `Дата / Date: ${when || ""}`,
      `Гостей / Personnes: ${guests || ""}`,
      `Сообщение / Message: ${message || ""}`,
      "",
      "— Автоподпись / Signature —",
      `Тур: ${programTitle} (${programId})`,
      (cfg.whatsapp ? `WhatsApp: https://wa.me/${cfg.whatsapp}` : ""),
      (cfg.telegram ? `Telegram: https://t.me/${cfg.telegram}` : "")
    ].filter(Boolean);
    return lines.join("\n");
  }

  function openWhatsApp(cfg, body) {
    if (!cfg.whatsapp) return false;
    window.open(`https://wa.me/${cfg.whatsapp}?text=${esc(body)}`, "_blank", "noopener,noreferrer");
    return true;
  }

  function openTelegram(cfg, body) {
    // откроет окно шаринга Telegram с уже подставленным текстом
    if (!cfg.telegram) return false;
    window.open(`https://t.me/share/url?text=${esc(body)}&url=${esc(cfg.siteUrl)}`, "_blank", "noopener,noreferrer");
    return true;
  }

  function openEmail(cfg, subject, body) {
    if (!cfg.email) return false;
    // mailto с темой и телом: в большинстве клиентов подставится автоматически
    const href = `mailto:${esc(cfg.email)}?subject=${esc(subject)}&body=${esc(body)}`;
    window.location.href = href;
    return true;
  }

  function handleSubmit(form) {
    const perFormCfg = normalizedConfig({
      whatsapp: form.dataset.whatsapp,
      telegram: form.dataset.telegram,
      email: form.dataset.email
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(form);

      const programTitle = form.dataset.programTitle || fd.get("programTitle") || document.title || "Programme";
      const programId    = form.dataset.programId    || fd.get("PROGRAM_ID")   || fd.get("programId") || "PROGRAM";

      const name    = fd.get("name")    || "";
      const contact = fd.get("contact") || "";
      const when    = fd.get("when")    || fd.get("date") || "";
      const guests  = fd.get("guests")  || "";
      const message = fd.get("message") || "";

      const body = buildBody({ programTitle, programId, name, contact, when, guests, message, cfg: perFormCfg });
      const subject = `Заявка: ${programTitle} (${programId})`;

      // Канал: whatsapp | telegram | email | both
      const channel = (fd.get("channel") || form.dataset.channel || "whatsapp").toLowerCase();

      let opened = false;
      if (channel === "whatsapp") {
        opened = openWhatsApp(perFormCfg, body);
        if (!opened) toast("Не задан номер WhatsApp в config.js");
      } else if (channel === "telegram") {
        opened = openTelegram(perFormCfg, body);
        if (!opened) toast("Не задан Telegram username в config.js");
      } else if (channel === "email") {
        opened = openEmail(perFormCfg, subject, body);
        if (!opened) toast("Не задан email в config.js");
      } else {
        // both
        const okWA = openWhatsApp(perFormCfg, body);
        setTimeout(() => openTelegram(perFormCfg, body), 200);
        opened = okWA;
      }

      if (opened) toast("Черновик открыт с подставленным текстом.");
      form.reset();
    });
  }

  function initContactForms() {
    const forms = $$("form[data-contact-form]");
    forms.forEach(handleSubmit);
    if (!forms.length) console.info("[contact.js] нет форм с data-contact-form");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactForms);
  } else {
    initContactForms();
  }

  window.ContactInit = initContactForms;
})();
