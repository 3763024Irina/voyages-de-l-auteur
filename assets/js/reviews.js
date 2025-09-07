// /assets/js/reviews.js
// Публикация отзывов: загрузка фото в Supabase Storage и запись в таблицу "reviews".
// Требует APP_CONFIG: supabaseUrl, supabaseAnonKey, supabaseBucket.

// используем ESM-версию SDK — не нужен отдельный <script> supabase-js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

function getConfig() {
  const c = (window.APP_CONFIG || {});
  const missing = ['supabaseUrl', 'supabaseAnonKey', 'supabaseBucket'].filter(k => !c[k]);
  if (missing.length) {
    console.warn('[reviews] Отсутствуют ключи в APP_CONFIG:', missing.join(', '));
  }
  return c;
}

function esc(s = '') {
  return s.replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#039;' }[m]));
}

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString(); } catch { return ''; }
}

async function uploadPhoto(sb, bucket, file) {
  if (!file) return null;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

function renderList(node, rows) {
  if (!node) return;
  node.innerHTML = (rows || []).map(r => `
    <article class="card" style="padding:14px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        ${r.photo_url ? `<img src="${r.photo_url}" alt="Фото гостя" style="width:80px;height:80px;object-fit:cover;border-radius:10px">` : ''}
        <div>
          <div style="font-weight:700">${esc(r.name || 'Гость')} • ★${r.rating}</div>
          <div class="section-sub" style="margin:4px 0;color:var(--muted)">${fmtDate(r.created_at)}</div>
          <p style="margin:6px 0 0">${esc(r.text || '')}</p>
        </div>
      </div>
    </article>
  `).join('') || '<div class="section-sub">Пока нет отзывов — будьте первым!</div>';
}

async function loadReviews(sb, listBox) {
  const { data, error } = await sb
    .from('reviews')
    .select('id,name,text,rating,photo_url,created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.warn('[reviews] load error:', error);
    if (listBox) listBox.innerHTML = '<div class="section-sub">Не удалось загрузить отзывы.</div>';
    return;
  }
  renderList(listBox, data);
}

export async function initReviewsSection(opts = {}) {
  const cfg = getConfig();
  const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

  const listBox = opts.list || document.getElementById('reviewsList');
  const form = opts.form || document.getElementById('reviewForm');
  const btn = opts.button || document.getElementById('sendReviewBtn');
  const msg = opts.msg || document.getElementById('reviewMsg');

  if (!form) {
    console.warn('[reviews] Форма не найдена (#reviewForm). Инициализация пропущена.');
    return;
  }

  // первичная загрузка
  loadReviews(sb, listBox);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = '';

    // honeypot
    if (form.website && form.website.value.trim() !== '') return;

    const name = form.name?.value?.trim() || '';
    const rating = Number(form.rating?.value || 5);
    const text = form.text?.value?.trim() || '';
    const consent = !!form.consent?.checked;
    const file = form.photo?.files?.[0];

    if (!name || !text) { if (msg) msg.textContent = 'Заполните имя и отзыв.'; return; }
    if (!consent) { if (msg) msg.textContent = 'Нужно согласиться на публикацию.'; return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Публикуем…'; }
    try {
      let photoUrl = null;
      if (file) photoUrl = await uploadPhoto(sb, cfg.supabaseBucket, file);

      const { error } = await sb.from('reviews').insert({
        name, rating, text, photo_url: photoUrl, consent: true, is_published: true
      });
      if (error) throw error;

      form.reset();
      if (msg) msg.textContent = 'Спасибо! Отзыв опубликован.';
      await loadReviews(sb, listBox);
      listBox?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('[reviews] submit error:', err);
      if (msg) msg.textContent = 'Не удалось опубликовать. Попробуйте ещё раз.';
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Отправить отзыв'; }
    }
  });
}

// автоинициализация после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initReviewsSection());
} else {
  initReviewsSection();
}
