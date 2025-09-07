// /assets/js/reviews.js
// Отзывы: загрузка фото в Supabase Storage + запись в таблицу "reviews".
// Требует APP_CONFIG: supabaseUrl, supabaseAnonKey, supabaseBucket ('reviews' по вашим политикам).
// Подключение в HTML: <script type="module" src="assets/js/reviews.js"></script>

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/* ==========================
   ВСПОМОГАТЕЛЬНОЕ
   ========================== */

function getConfig() {
  const c = (window.APP_CONFIG || {});
  const need = ['supabaseUrl', 'supabaseAnonKey', 'supabaseBucket'];
  const missing = need.filter(k => !c[k]);
  if (missing.length) {
    console.warn('[reviews] В APP_CONFIG отсутствуют ключи:', missing.join(', '));
  }
  return c;
}

function esc(s = '') {
  return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString(); } catch { return ''; }
}

// Читает File -> DataURL
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// Сжимает изображение в JPEG с ограничением по стороне и размеру.
// Возвращает новый File (image/jpeg) или исходный, если сжатие не требуется/неудачно.
async function maybeResizeImage(file, { maxSide = 1280, quality = 0.85, maxBytes = 2_500_000 } = {}) {
  try {
    if (!/^image\//.test(file.type)) return file;

    // Быстрый фильтр: если исходный уже маленький
    if (file.size <= maxBytes && !/png|heic|heif|webp/i.test(file.type)) return file;

    const dataURL = await fileToDataURL(file);
    const img = new Image();
    const loaded = new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    img.src = dataURL;
    await loaded;

    const max = Math.max(img.width, img.height);
    const ratio = Math.min(maxSide / max, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    // Итеративно снижаем качество, пока не впишемся в maxBytes (3 шага максимум)
    let q = quality;
    let blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', q));
    for (let i = 0; i < 3 && blob && blob.size > maxBytes; i++) {
      q = Math.max(0.6, q - 0.1);
      blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', q));
    }

    if (!blob) return file;
    if (blob.size > maxBytes && ratio === 1) {
      // размер всё ещё велик, но масштабировать ниже maxSide нельзя — вернём исходный
      return file;
    }

    const outName = (file.name.replace(/\.(\w+)$/, '') || 'photo') + '.jpg';
    return new File([blob], outName, { type: 'image/jpeg', lastModified: Date.now() });
  } catch (e) {
    console.warn('[reviews] resize error:', e);
    return file;
  }
}

async function uploadPhoto(sb, bucket, file) {
  if (!file) return null;

  // Клиентская валидация: 5 МБ жёстко
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Файл больше 5 МБ — выберите поменьше');
  }

  // Мягкое сжатие до JPEG ≤ ~2.5 МБ
  const safe = await maybeResizeImage(file, { maxSide: 1280, quality: 0.85, maxBytes: 2_500_000 });

  const ext = (safe.name.split('.').pop() || 'jpg').toLowerCase();
  const key = `photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: upErr } = await sb
    .storage
    .from(bucket)
    .upload(key, safe, {
      cacheControl: '3600',
      upsert: false,
      contentType: safe.type || 'image/jpeg'
    });

  if (upErr) throw upErr;

  const { data: pub } = sb.storage.from(bucket).getPublicUrl(key);
  return pub?.publicUrl || null;
}

function renderList(node, rows) {
  if (!node) return;
  node.innerHTML = (rows || []).map(r => `
    <article class="card" style="padding:14px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        ${r.photo_url ? `<img src="${r.photo_url}" alt="Фото гостя" style="width:80px;height:80px;object-fit:cover;border-radius:10px">` : ''}
        <div>
          <div style="font-weight:700">${esc(r.name || 'Гость')} • ★${r.rating ?? 5}</div>
          <div class="section-sub" style="margin:4px 0;color:var(--muted)">${fmtDate(r.created_at)}</div>
          <p style="margin:6px 0 0">${esc(r.text || '')}</p>
        </div>
      </div>
    </article>
  `).join('') || '<div class="section-sub">Пока нет отзывов — будьте первым!</div>';
}

async function loadReviews(sb, listBox) {
  if (!listBox) return;

  listBox.innerHTML = '<div class="section-sub">Загружаем отзывы…</div>';
  const { data, error } = await sb
    .from('reviews')
    .select('id,name,text,rating,photo_url,created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.warn('[reviews] load error:', error);
    listBox.innerHTML = '<div class="section-sub">Не удалось загрузить отзывы.</div>';
    return;
  }
  renderList(listBox, data);
}

/* ==========================
   ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
   ========================== */

export async function initReviewsSection(opts = {}) {
  const cfg = getConfig();
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  const listBox = opts.list || document.getElementById('reviewsList');
  const form    = opts.form || document.getElementById('reviewForm');
  const btn     = opts.button || document.getElementById('sendReviewBtn');
  const msg     = opts.msg || document.getElementById('reviewMsg');

  if (!form) {
    console.warn('[reviews] Форма не найдена (#reviewForm). Инициализация пропущена.');
    return;
  }

  // Первая загрузка списка
  loadReviews(sb, listBox);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = '';

    // honeypot
    if (form.website && form.website.value.trim() !== '') return;

    const name    = form.name?.value?.trim() || '';
    const rating  = Math.min(5, Math.max(1, Number(form.rating?.value || 5)));
    const text    = form.text?.value?.trim() || '';
    const consent = !!form.consent?.checked;
    const file    = form.photo?.files?.[0];

    if (!name || !text) { if (msg) msg.textContent = 'Заполните имя и отзыв.'; return; }
    if (!consent)       { if (msg) msg.textContent = 'Нужно согласиться на публикацию.'; return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Публикуем…'; }

    try {
      let photoUrl = null;
      if (file) {
        photoUrl = await uploadPhoto(sb, cfg.supabaseBucket, file);
      }

      // Публикуем сразу (без модерации)
      const { error: insErr } = await sb.from('reviews').insert({
        name, rating, text, photo_url: photoUrl, consent: true, is_published: true
      });
      if (insErr) throw insErr;

      form.reset();
      if (msg) msg.textContent = 'Спасибо! Отзыв опубликован.';
      await loadReviews(sb, listBox);
      listBox?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      console.error('[reviews] submit error:', err);
      // Сообщение пользователю + подробности в консоли
      const supaMsg = err?.message || '';
      if (/new row violates row-level security|RLS/i.test(supaMsg)) {
        if (msg) msg.textContent = 'Доступ запрещён политиками RLS. Проверьте настройки Supabase.';
      } else if (/payload too large|413/i.test(supaMsg)) {
        if (msg) msg.textContent = 'Файл слишком большой. Выберите фото поменьше.';
      } else {
        if (msg) msg.textContent = 'Не удалось опубликовать. Проверьте соединение и попробуйте ещё раз.';
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Отправить отзыв'; }
    }
  });
}

/* ==========================
   АВТОЗАПУСК
   ========================== */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initReviewsSection());
} else {
  initReviewsSection();
}
