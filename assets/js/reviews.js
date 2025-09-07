// /assets/js/reviews.js
// Публикация отзывов в Supabase (Storage + таблица reviews).
// Нужны APP_CONFIG: supabaseUrl, supabaseAnonKey, supabaseBucket.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

function cfg() {
  const c = window.APP_CONFIG || {};
  const miss = ['supabaseUrl', 'supabaseAnonKey', 'supabaseBucket'].filter(k => !c[k]);
  if (miss.length) console.warn('[reviews] APP_CONFIG missing:', miss.join(', '));
  return c;
}

const esc = (s='') => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const fmt = d => { try { return new Date(d).toLocaleDateString(); } catch { return ''; } };

async function uploadPhoto(sb, bucket, file) {
  if (!file) return null;
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `photos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await sb.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  // Для публичного бакета public URL сразу доступен
  const pub = sb.storage.from(bucket).getPublicUrl(path);
  return pub?.data?.publicUrl || null;
}

function renderList(node, rows) {
  if (!node) return;
  node.innerHTML = (rows || []).map(r => `
    <article class="card" style="padding:14px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        ${r.photo_url ? `<img src="${r.photo_url}" alt="Фото гостя" style="width:80px;height:80px;object-fit:cover;border-radius:10px">` : ''}
        <div>
          <div style="font-weight:700">${esc(r.name || 'Гость')} • ★${r.rating ?? 5}</div>
          <div class="section-sub" style="margin:4px 0;color:var(--muted)">${fmt(r.created_at)}</div>
          <p style="margin:6px 0 0">${esc(r.text || '')}</p>
        </div>
      </div>
    </article>
  `).join('') || '<div class="section-sub">Пока нет отзывов — будьте первым!</div>';
}

async function loadReviews(sb, listBox) {
  if (!listBox) return;
  const { data, error } = await sb
    .from('reviews')
    .select('id,name,text,rating,photo_url,created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[reviews] load error:', error);
    listBox.innerHTML = `<div class="section-sub">Не удалось загрузить отзывы: ${esc(error.message || '')}</div>`;
    return;
  }
  renderList(listBox, data);
}

export async function initReviewsSection(opts = {}) {
  const c = cfg();
  const sb = createClient(c.supabaseUrl, c.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const listBox = opts.list || document.getElementById('reviewsList');
  const form    = opts.form || document.getElementById('reviewForm');
  const btn     = opts.button || document.getElementById('sendReviewBtn');
  const msg     = opts.msg || document.getElementById('reviewMsg');

  if (!form) { console.warn('[reviews] #reviewForm not found'); return; }

  await loadReviews(sb, listBox);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = '';

    // Honeypot, если поле есть
    if (form.website && form.website.value.trim() !== '') return;

    const name    = form.name?.value?.trim() || '';
    const text    = form.text?.value?.trim() || '';
    const rating  = Math.min(5, Math.max(1, Number(form.rating?.value || 5)));
    const consent = !!form.consent?.checked;
    const file    = form.photo?.files?.[0];

    if (!name || !text)  { msg && (msg.textContent = 'Заполните имя и отзыв.'); return; }
    if (!consent)        { msg && (msg.textContent = 'Нужно согласиться на публикацию.'); return; }

    let photoUrl = null;

    try {
      if (btn) { btn.disabled = true; btn.textContent = 'Публикуем…'; }

      // 1) Пытаемся загрузить фото (если есть)
      if (file) {
        try {
          photoUrl = await uploadPhoto(sb, c.supabaseBucket, file);
        } catch (err) {
          console.warn('[reviews] photo upload blocked (RLS?) — continue without photo', err);
          msg && (msg.textContent = 'Фото не загрузилось — публикуем отзыв без фото.');
        }
      }

      // 2) Вставляем строку в таблицу (сразу опубликовано)
      const insert = {
        name,
        text,
        rating,
        consent: true,
        is_published: true,
        photo_url: photoUrl
      };

      const { error } = await sb.from('reviews').insert(insert);
      if (error) throw error;

      form.reset();
      msg && (msg.textContent = 'Спасибо! Отзыв опубликован.');
      await loadReviews(sb, listBox);
      listBox?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('[reviews] submit error:', err);
      const reason = err?.message || err?.error_description || 'RLS / сеть / CORS';
      msg && (msg.textContent = `Не удалось опубликовать: ${reason}`);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Отправить отзыв'; }
    }
  });
}

// Автоинициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initReviewsSection());
} else {
  initReviewsSection();
}

