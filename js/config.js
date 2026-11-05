/* config.js — базовые ссылки WhatsApp/Telegram без клиентской админ-аутентификации */
window.APP_CONFIG = Object.assign({ whatsapp:'33759644813', telegram_user:'de_irene' }, window.APP_CONFIG || {});
(function () {
  if (window.__CONFIG_INIT__) return;
  window.__CONFIG_INIT__ = true;
  const CFG = window.APP_CONFIG || {};
  const qa = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const digits = value => String(value || '').replace(/[^0-9]/g, '');
  const WA_DIGITS = digits(CFG.whatsapp || '');
  window.APP_CONFIG.WA_DIGITS = WA_DIGITS;
  function patchBaseLinks(root=document) {
    if (WA_DIGITS) qa('[data-whatsapp]', root).forEach(a => {
      a.setAttribute('href', 'https://wa.me/' + WA_DIGITS);
      a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener');
    });
    qa('[data-telegram]', root).forEach(a => {
      a.setAttribute('href', 'https://t.me/share/url');
      a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener');
    });
  }
  function init() {
    patchBaseLinks();
    const observer = new MutationObserver(mutations => mutations.forEach(mutation =>
      mutation.addedNodes && mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches && node.matches('[data-whatsapp], [data-telegram]')) patchBaseLinks(node.parentElement || document);
        if (node.querySelector && node.querySelector('[data-whatsapp], [data-telegram]')) patchBaseLinks(node);
      })
    ));
    observer.observe(document.documentElement, {childList:true, subtree:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();