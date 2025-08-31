/* contact.js — единый обработчик форм заявки (WhatsApp + Telegram)
   Требование: подключать ПОСЛЕ config.js, чтобы был window.APP_CONFIG
   Работает с формами <form data-contact-form ...>
*/

(function () {
  "use strict";

  // ===== Источник настроек: APP_CONFIG -> дефолты =====
  const APP = (window.APP_CONFIG || {});
  const DEFAULTS = {
    whatsapp: "33612345678",
    telegram: "ToursLanguedocbyIrene",
  };

  // Нормализация конфигурации (цифры для WA, без @ для TG)
  function normalizedConfig(over = {}) {
    const wa = String(over.whatsapp || APP.whatsapp || DEFAULTS.whatsapp || "").replace(/\D/g, "");
    const tg = String(over.telegram || APP.telegram || DEFAULTS.telegram || "").replace(/^@/, "").trim();
    return {
      whatsapp: wa,
      telegram: tg,
      siteUrl: location.origin + location.pathname
    };
  }

  // ===== Вспомогалки =====
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = encodeURIComponent;

  function toast(msg, timeout = 3500) {
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
      "Программа / Programme: " + programTitle + " (" + programId + ")",
      "Имя / Nom: " + (name || ""),
      "Контакт / Contact: " + (contact || ""),
      "Дата / Date: " + (when || ""),
      "Гостей / Personnes: " + (guests || ""),
      "Сообщение / Message: " + (message || ""),
      "",
      "— Автоподпись / Signature —",
      "Тур: " + programTitle + " (" + programId + ")",
      (cfg.whatsapp ? "WhatsApp: https://wa.me/" + cfg.whatsapp : ""),
      (cfg.telegram ? "Telegram: https://t.me/" + cfg.telegram : "")
    ].filter(Boolean);
    return lines.join("\n");
  }

  function openWhatsApp(cfg, body) {
    if (!cfg.whatsapp) return false;
    const url = "https://wa.me/" + cfg.whatsapp + "?text=" + esc(body);
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }

  function openTelegramShare(cfg, body) {
    if (!cfg.telegram) return false;
    const url = "https://t.me/share/url?text=" + esc(body) + "&url=" + esc(cfg.siteUrl || (location.origin + location.pathname));
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }

  function handleSubmit(form) {
    // локальный override конфигурации с формы (если задано)
    const perFormCfg = normalizedConfig({
      whatsapp: form.dataset.whatsapp,
      telegram: form.dataset.telegram
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(form);

      // Читаем мета-данные программы
      const programTitle =
        form.dataset.programTitle ||
        fd.get("programTitle") ||
        document.title ||
        "Programme";

      const programId =
        form.dataset.programId ||
        fd.get("PROGRAM_ID") ||
        fd.get("programId") ||
        "PROGRAM";

      // Поля пользователя
      const name = fd.get("name") || "";
      const contact = fd.get("contact") || "";
      // поддерживаем оба варианта: when ИЛИ date
      const when = fd.get("when") || fd.get("date") || "";
      const guests = fd.get("guests") || "";
      const message = fd.get("message") || "";

      // Канал отправки: whatsapp | telegram | both (по умолчанию both)
      const channel = (fd.get("channel") || form.dataset.channel || "both").toLowerCase();

      const body = buildBody({
        programTitle,
        programId,
        name,
        contact,
        when,
        guests,
        message,
        cfg: perFormCfg
      });

      let anyOpened = false;

      if (channel === "whatsapp") {
        anyOpened = openWhatsApp(perFormCfg, body);
        if (!anyOpened) toast("Не задан номер WhatsApp в конфиге.");
      } else if (channel === "telegram") {
        anyOpened = openTelegramShare(perFormCfg, body);
        if (!anyOpened) toast("Не задан Telegram username в конфиге.");
      } else {
        // both: пытаемся открыть WA, затем TG (может быть заблокировано браузером)
        const okWA = openWhatsApp(perFormCfg, body);
        setTimeout(() => openTelegramShare(perFormCfg, body), 250);
        anyOpened = okWA; // хотя бы одно окно
      }

      toast("Спасибо! Заявка подготовлена. Завершите отправку в открывшемся окне.");
      form.reset();

      // если оба канала отсутствуют — даём подсказку
      if (!perFormCfg.whatsapp && !perFormCfg.telegram) {
        console.warn("[contact.js] Ни WhatsApp, ни Telegram не заданы. Проверьте config.js или data-* на форме.");
        toast("Контакты не настроены. Проверьте конфиг.");
      }
    });
  }

  // Инициализация на всех формах с data-contact-form
  function initContactForms() {
    const forms = $$("form[data-contact-form]");
    forms.forEach(handleSubmit);
    if (!forms.length) {
      console.info("[contact.js] Форм с data-contact-form не найдено.");
    }
  }

  // Автоинициализация
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactForms);
  } else {
    initContactForms();
  }

  // Экспорт на всякий случай (если динамически добавляете форму)
  window.ContactInit = initContactForms;
})();
