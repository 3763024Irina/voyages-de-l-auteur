(function(){
fr:{title:"Cookies", text:"Nous utilisons des cookies essentiels et, avec votre accord, des cookies d’analyse (Yandex Metrica/GA4).", opt:"Analyse (optionnel)", decline:"Refuser", accept:"Accepter", more:"Vous pouvez modifier votre choix plus tard : ", settings:"Paramètres cookies"}
}[lang];


const wrapper = document.createElement('div');
wrapper.id = 'cookie-banner';
wrapper.setAttribute('role','dialog');
wrapper.setAttribute('aria-live','polite');
wrapper.innerHTML = `
<h3>${t.title}</h3>
<p>${t.text}</p>
<div class="opt">
<label><input id="ck-analytics" type="checkbox"> <span>${t.opt}</span></label>
</div>
<div class="row">
<button id="ck-decline" class="ghost">${t.decline}</button>
<button id="ck-accept" class="primary">${t.accept}</button>
</div>
<p><small>${t.more}<button id="cookie-settings">${t.settings}</button></small></p>
`;


// ---- Utils ----
const $ = s => document.querySelector(s);
function save(c){ localStorage.setItem(LS_KEY, JSON.stringify(c)); }
function read(){ try{return JSON.parse(localStorage.getItem(LS_KEY)||"");}catch(e){return null;} }
function show(){ document.body.appendChild(wrapper); wrapper.style.display='block'; }
function hide(){ if(wrapper.parentNode) wrapper.parentNode.removeChild(wrapper); }
function loadScript(src, cb){ const s=document.createElement('script'); s.async=true; s.src=src; s.onload=cb||null; document.head.appendChild(s); }


// ---- Analytics loaders (deferred) ----
function enableGA(){
if(!GA_ID || window.dataLayer) return;
window.dataLayer = window.dataLayer || [];
window.gtag = function gtag(){ dataLayer.push(arguments); };
gtag('js', new Date());
gtag('config', GA_ID, { anonymize_ip: true });
loadScript("https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(GA_ID));
}
function enableYM(){
if(!YM_ID || window.ym) return;
(function(m,e,t,r,i,k,a){ m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)}; m[i].l=1*new Date();
for (var j=0;j<document.scripts.length;j++){ if (document.scripts[j].src===r) return; }
k=e.createElement(t),a=e.getElementsByTagName(t)[0]; k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
window.ym(YM_ID, 'init', {clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true});
}
function applyConsent(c){ if(c.analytics){ enableGA(); enableYM(); } }


// ---- Events ----
function wire(){
const chk = wrapper.querySelector('#ck-analytics');
wrapper.querySelector('#ck-accept').addEventListener('click', function(){ const c={essential:true, analytics:!!chk.checked, ts:Date.now()}; save(c); applyConsent(c); hide(); });
wrapper.querySelector('#ck-decline').addEventListener('click', function(){ const c={essential:true, analytics:false, ts:Date.now()}; save(c); hide(); });
document.body.addEventListener('click', function(e){ if(e.target && e.target.id==='cookie-settings'){ e.preventDefault(); show(); } });
}


// ---- Init ----
const saved = read();
if(saved){ applyConsent(saved); } else { document.addEventListener('DOMContentLoaded', function(){ show(); wire(); }); return; }
// уже есть согласие — добавим невидимую кнопку настроек
document.addEventListener('DOMContentLoaded', function(){ wire(); });
})();
