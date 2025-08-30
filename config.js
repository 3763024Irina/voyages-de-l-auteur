// Global runtime configuration + admin-only link gating
// Place this file next to your HTML and ensure it's included BEFORE the main script:
// <script src="./config.js"></script>

window.APP_CONFIG = {
  email: '3763024@gmail.com',            // получатель заявок (mailto)
  whatsapp: '33759644813',               // без "+", только цифры → wa.me/<номер>
  needguide: 'https://needguide.ru/view_guide.php?user_id=22306', // ссылка на профиль (необязательно)
  // SHA-256 от вашего секретного пароля для входа в режим администратора
  // Сгенерируйте хеш так: откройте страницу, потом в консоли выполните
  //   await makeAdminHash('ваш_пароль')
  // и подставьте полученную HEX-строку сюда:
  adminHash: ''
};

(function(){
  const CFG = window.APP_CONFIG || (window.APP_CONFIG = {});
  const PRIVATE_SELECTORS = [
    '[data-i18n="cta_grotte"]',
    '[data-i18n="cta_restaurant"]',
    '[data-i18n="cta_capion"]',
    '[data-needguide]'
  ];

  function $all(sel){ return Array.from(document.querySelectorAll(sel)); }
  function setPrivateVisible(isAdmin){
    const style = isAdmin ? '' : 'none';
    PRIVATE_SELECTORS.forEach(sel => $all(sel).forEach(el => { el.style.display = style; }));
  }

  function hasHash(){ return (CFG.adminHash||'').length > 0; }
  function isAdmin(){ return hasHash() && localStorage.getItem('admin:token') === CFG.adminHash; }

  async function sha256hex(str){
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function login(){
    const lang = (localStorage.getItem('site:lang')||((navigator.language||'').toLowerCase().startsWith('fr')?'fr':'ru'));
    if(!hasHash()){
      alert(lang==='fr' ? "adminHash n'est pas défini dans config.js" : 'adminHash не задан в config.js');
      return;
    }
    const pass = prompt(lang==='fr' ? 'Mot de passe admin' : 'Пароль администратора');
    if(!pass) return;
    const hex = await sha256hex(pass);
    if(hex === CFG.adminHash){
      localStorage.setItem('admin:token', hex);
      document.body.classList.add('admin');
      setPrivateVisible(true);
      alert(lang==='fr' ? 'Mode admin activé' : 'Админ-режим включён');
    } else {
      alert(lang==='fr' ? 'Mot de passe incorrect' : 'Пароль неверный');
    }
  }

  function logout(){
    localStorage.removeItem('admin:token');
    document.body.classList.remove('admin');
    setPrivateVisible(false);
  }

  function init(){
    const ready = () => {
      // скрыть приватные ссылки по умолчанию
      setPrivateVisible(isAdmin());
      if(isAdmin()) document.body.classList.add('admin');
    };
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();

    // хоткеи: Ctrl+Alt+A — login, Ctrl+Alt+L — logout
    window.addEventListener('keydown', (e)=>{
      if(e.ctrlKey && e.altKey){
        const k = e.key.toLowerCase();
        if(k==='a'){ e.preventDefault(); login(); }
        if(k==='l'){ e.preventDefault(); logout(); }
      }
    });

    // быстрый вход через URL (?admin=1 или #admin)
    const qs = new URLSearchParams(location.search);
    if(qs.get('admin')==='1' || location.hash==="#admin"){ setTimeout(login, 100); }
  }

  // экспорт утилит (и хелпер генерации хеша) в window
  window.AdminLinks = { login, logout, isAdmin };
  window.makeAdminHash = async (s)=>sha256hex(s);

  init();
})();
