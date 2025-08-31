/* contact.js — единый обработчик форм заявки (WhatsApp + Telegram) */
/* Подключайте на всех страницах, где есть форма с data-contact-form */

(function () {
  "use strict";

  // ==== Конфиг (поменяйте под себя один раз) ====
  const cfg = {
    // Номер WhatsApp в международном формате без "+" и пробелов
    whatsapp: "33612345678",
    // Ваш Telegram username без @, вариант: "ToursLanguedocIrène" -> "ToursLanguedocIrène"
    telegram: "ToursLanguedocbyIrene",
    // Базовый UTM/URL вашей страницы (для t.me/share/url — опционально)
    siteUrl: location.origin + location.pathname
  };

  // ===== Вспомогалки =====
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = encodeURIComponent;

  function toast(msg, timeout = 3500) {
    let el = document.createElement("div");
    el.setAttribute(
      "style",
      `
      position:fixed;left:50%;bottom:24px;transform:translateX(-50%);
      background:#0D2B1E;color:#fff;padding:12px 16px;border-radius:12px;
      font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      box-shadow:0 6px 24px rgba(0,0,0,.18);z-index:99999;max-width:90vw;text-align:center;
    `
    );
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), timeout);
  }

  function buildBody({ programTitle, programId, name, contact, when, guests, message }) {
    return (
      "Программа / Programme: " + programTitle + " (" + programId + ")\n" +
      "Имя / Nom: " + (name || "") + "\n" +
      "Контакт / Contact: " + (contact || "") + "\n" +
      "Дата / Date: " + (when || "") + "\n" +
      "Гостей / Personnes: " + (guests || "") + "\n" +
      "Сообщение / Message: " + (message || "") + "\n\n" +
      "— Автоподпись / Signature —\n" +
      "Тур: " + programTitle + " (" + programId + ")\n" +
      "WhatsApp: https://wa.me/" + cfg.whatsapp + "\n" +
      "Telegram: https://t.me/" + cfg.telegram
    );
  }

  function openWhatsApp(body) {
    const url = "https://wa.me/" + cfg.whatsapp + "?text=" + esc(body);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openTelegramShare(body) {
    // Откроет приложение/веб Telegram с подготовленным текстом.
    // Если хотите — можно добавить &url= для предпросмотра ссылки.
    const url = "https://t.me/share/url?text=" + esc(body) + "&url=" + esc(cfg.siteUrl);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleSubmit(form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const fd = new FormData(form);

      // Читаем данные из формы
      const programTitle =
        form.dataset.programTitle ||
        fd.get("programTitle") ||
        document.title ||
        "Programme";
      const programId =
        form.dataset.programId ||
        fd.get("PROGRAM_ID") ||
        "PROGRAM";

      const name = fd.get("name") || "";
      const contact = fd.get("contact") || "";
      const when = fd.get("when") || "";
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
        message
      });

      // Отправляем
      if (channel === "whatsapp") {
        openWhatsApp(body);
      } else if (channel === "telegram") {
        openTelegramShare(body);
      } else {
        // both
        openWhatsApp(body);
        // небольшая задержка, чтобы окна не блокировались одним событием
        setTimeout(() => openTelegramShare(body), 350);
      }

      // «Автоматический ответ» на странице — уведомление + очистка формы
      toast("Спасибо! Заявка отправлена. Мы свяжемся с вами в WhatsApp/Telegram.");
      form.reset();
    });
  }

  // Инициализация на всех формах с data-contact-form
  function initContactForms() {
    $$("form[data-contact-form]").forEach(handleSubmit);
  }

  // Автоинициализация
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactForms);
  } else {
    initContactForms();
  }

  // Экспорт на всякий случай
  window.ContactInit = initContactForms;
})();
