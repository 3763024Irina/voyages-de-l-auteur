// assets/js/cookies.js — простой cookie-баннер
(function () {
  const LS_KEY = "cookieConsent.v2";
  if (localStorage.getItem(LS_KEY)) return;

  const box = document.createElement("div");
  box.id = "ck-banner";
  box.style.cssText = "position:fixed;left:1rem;right:1rem;bottom:1rem;background:#fff;border:1px solid #ddd;box-shadow:0 4px 12px rgba(0,0,0,.15);padding:1rem;border-radius:.5rem;z-index:9999;font:14px Inter,Arial";
  box.innerHTML = `
    <b>Cookies</b>: мы используем только необходимые cookie и (с вашего согласия) аналитику.
    <button id="ck-yes" style="margin-left:10px;padding:.4rem .7rem;background:#0D2B1E;color:#fff;border:0;border-radius:.4rem;cursor:pointer">Принять</button>
    <button id="ck-no" style="margin-left:6px;padding:.4rem .7rem;border:1px solid #ccc;background:#f7f7f7;border-radius:.4rem;cursor:pointer">Отклонить</button>
  `;
  document.body.appendChild(box);

  function save(consent) {
    localStorage.setItem(LS_KEY, JSON.stringify(consent));
    document.body.removeChild(box);
  }

  document.getElementById("ck-yes").onclick = () => save({ essential: true, analytics: true, ts: Date.now() });
  document.getElementById("ck-no").onclick  = () => save({ essential: true, analytics: false, ts: Date.now() });
})();
