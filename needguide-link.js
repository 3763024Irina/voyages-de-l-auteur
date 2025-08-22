// /needguide-link.js
(function () {
  const cfg = (window.APP_CONFIG || {});
  const email = (cfg.email || '').trim();
  const waNum = (cfg.whatsapp || '').replace(/[^\d]/g, '');
  const needURL = (cfg.needguide || '').trim();
  const isFR = (document.documentElement.lang || '').toLowerCase().startsWith('fr');

  const t = {
    need: isFR ? 'Profil NeedGuide' : 'Профиль NeedGuide',
    prof: isFR ? 'Profil' : 'Профиль'
  };

  // 1) Шапка: добавить пункт меню перед кнопкой .cta
  const navUl = document.querySelector('header nav ul');
  if (navUl && needURL && !navUl.querySelector('a[href*="needguide.ru"]')) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = needURL; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t.need;
    li.appendChild(a);
    const ctaLi = [...navUl.children].find(el => el.querySelector && el.querySelector('.cta'));
    navUl.insertBefore(li, ctaLi || null);
  }

  // 2) HERO: кнопка рядом с #waHero (если есть)
  const waHero = document.getElementById('waHero');
  if (waHero && needURL && !waHero.parentElement.querySelector('a[href*="needguide.ru"]')) {
    const btn = document.createElement('a');
    btn.className = 'btn';
    btn.href = needURL; btn.target = '_blank'; btn.rel = 'noopener';
    btn.textContent = t.need;
    waHero.insertAdjacentElement('afterend', btn);
  }

  // 3) Блок «Контакты»: добавить раздел «Профиль»
  const contactCard = document.querySelector('#contact .card');
  if (contactCard && needURL && !contactCard.querySelector('a[href*="needguide.ru"]')) {
    const h3 = document.createElement('h3'); h3.textContent = t.prof;
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.className = 'btn'; a.href = needURL; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t.need;
    p.appendChild(a);
    contactCard.appendChild(h3); contactCard.appendChild(p);
  }

  // 4) Футер: добавить ссылку во 2-ю колонку
  const footCols = document.querySelectorAll('footer .footgrid > div');
  if (footCols[1] && needURL && !footCols[1].querySelector('a[href*="needguide.ru"]')) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = needURL; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t.need;
    p.appendChild(a);
    footCols[1].appendChild(p);
  }

  // 5) Почта: заменить все mailto: и перехватить openMail()
  if (email) {
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      a.href = `mailto:${email}`;
      if (!a.textContent.trim() || /example\.com|^hello@/i.test(a.textContent)) a.textContent = email;
    });
    if (typeof window.openMail === 'function') {
      window.openMail = function (e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const subj = 'Запрос тура — сайт';
        const body =
`Имя / Nom: ${fd.get('name')||''}
Контакт / Contact: ${fd.get('contact')||''}
Сообщение / Message: ${fd.get('message')||''}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      };
    }
  }

  // 6) WhatsApp: обновить все wa.me и автотекст на #waHero
  if (waNum) {
    document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
      try {
        const u = new URL(a.href, location.origin);
        u.pathname = `/${waNum}`;
        a.href = u.toString();
      } catch {}
    });
    if (waHero) {
      waHero.addEventListener('click', function () {
        const f = document.getElementById('quickForm');
        if (!f) return;
        const name = f.querySelector('[name="name"]')?.value || '';
        const contact = f.querySelector('[name="contact"]')?.value || '';
        const message = f.querySelector('[name="message"]')?.value || '';
        const hello = isFR ? 'Bonjour ! ' : 'Здравствуйте! ';
        const text = `${hello}${name ? 'Меня зовут ' + name + '. ' : ''}${message}\nКонтакт: ${contact}`;
        this.href = `https://wa.me/${waNum}?text=` + encodeURIComponent(text.trim());
      });
    }
  }
})();
