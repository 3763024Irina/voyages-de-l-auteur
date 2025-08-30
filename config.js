// Global runtime configuration + admin-only link gating
// Подключи этот файл ПЕРЕД основным скриптом страницы.

window.APP_CONFIG = {
  email: '3763024@gmail.com',                  // получатель заявок (mailto)
  whatsapp: '33759644813',                     // без "+", только цифры → wa.me/<номер>
  needguide: 'https://needguide.ru/view_guide.php?user_id=22306',

  // ДВА варианта входа админа:
  // 1) Укажи adminPass (простой пароль, работает ВЕЗДЕ, в т.ч. file://).
  adminPass: 'замени-на-свой-пароль',

  // 2) ЛИБО используй adminHash (SHA-256 hex). Работает на HTTPS/localhost.
  // Чтобы получить хеш: открой страницу на https, в консоли:  await makeAdminHash('мой_пароль')
  adminHash: '',

  // Включи при отладке
  debug: false
};

(function(){
  const CFG = window.APP_CONFIG || {};
  const PRIVATE_SELECTORS = [
    '[data-i18n="cta_grotte"]',
    '[data-i18n="cta_restaurant"]',
    '[data-i18n="cta_capion"]',
    '[data-needguide"]', // на всякий случай
    '[data-needguide]'
  ];
  const HIDE_ATTR = 'data-private';

  function injectCSS(){
    if (document.getElementById('admin-gate-style')) return;
    const s = document.createElement('style');
    s.id = 'admin-gate-style';
    // всё, что помечено data-private — скрыто, пока нет класса body.admin
    s.textContent = `
      [${HIDE_ATTR}]{display:none!important}
      body.admin [${HIDE_ATTR}]{display:inline-flex!important}
      body.admin a[${HIDE_ATTR}]{display:inline-flex!important}
      body.admin li[${HIDE_ATTR}]{display:list-item!important}
      body.admin p[${HIDE_ATTR}]{display:block!important}
    `;
    document.head.appendChild(s);
  }

  function markPrivate(){
    const nodes = PRIVATE_SELECTORS.flatMap(sel => Array.from(document.querySelectorAll(sel)));
    nodes.forEach(el => el.setAttribute(HIDE_ATTR,''));
    if (CFG.debug) console.log('[config] private nodes marked:', nodes);
  }

  function isSecure(){ return location.protocol === 'https:' || location.hostname === 'localhost'; }

  async function sha256hex(str){
    if (window.crypto && crypto.subtle && isSecure()){
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
    }
    return null; // на file:// или http не получится
  }

  async function checkPass(pass){
    if (CFG.adminHash){
      const h = await sha256hex(pass);
      if (!h){
        if (CFG.debug) console.warn('[config] crypto.subtle недоступен; перехожу на adminPass');
        return !!CFG.adminPass && pass === CFG.adminPass;
      }
      return h === CFG.adminHash.toLowerCase();
    }
    if (CFG.adminPass) return pass === CFG.adminPass;
    return false;
  }

  function setAdmin(on){
    document.body.classList.toggle('admin', !!on);
    if (on) localStorage.setItem('admin:on','1'); else localStorage.removeItem('admin:on');
  }

  async function login(){
    const langFR = (localStorage.getItem('site:lang')||'').startsWith('fr') || (navigator.language||'').toLowerCase().startsWith('fr');
    const pass = prompt(langFR ? 'Mot de passe admin' : 'Пароль администратора');
    if (!pass) return;
    const ok = await checkPass(pass);
    alert(ok ? (langFR ? 'Mode admin activé' : 'Админ-режим включён')
             : (langFR ? 'Mot de passe incorrect' : 'Пароль неверный'));
    setAdmin(ok);
  }
  function logout(){ setAdmin(false); }

  function init(){
    injectCSS();
    const ready = () => {
      // помечаем приватные элементы, даже если они уже отрисованы
      markPrivate();
      // восстанавливаем режим из localStorage
      if (localStorage.getItem('admin:on')==='1') setAdmin(true);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();

    // хоткеи: Ctrl+Alt+A — login, Ctrl+Alt+L — logout
    window.addEventListener('keydown', (e)=>{
      if(e.ctrlKey && e.altKey){
        const k = e.key.toLowerCase();
        if(k==='a'){ e.preventDefault(); login(); }
        if(k==='l'){ e.preventDefault(); logout(); }
      }
    });

    // быстрый вход: ?admin=1 или #admin → сразу спросит пароль
    const qs = new URLSearchParams(location.search);
    if (qs.get('admin')==='1' || location.hash==='#admin') setTimeout(login, 50);
  }

  // экспорт утилит для консоли
  window.AdminLinks = { login, logout };
  window.makeAdminHash = async (s)=>{
    const h = await sha256hex(s);
    if (!h) { alert('crypto.subtle недоступен здесь — создай хеш на https или используй adminPass'); return ''; }
    console.log('[adminHash]', h);
    return h;
  };

  init();
})();
