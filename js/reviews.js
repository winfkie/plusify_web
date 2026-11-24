/* Rating & Review Plusify (Firebase Firestore via REST). Tidak mengubah file lain selain pemanggilnya di app.js */
(function(){
  const RC = window.PLUSIFY_REVIEWS || {}, P = window.PLUSIFY_PRODUCTS || [];
  const ok = v => !!v && !/^ISI_/i.test(String(v).trim());
  const FB = ok(RC.PROJECT_ID) && ok(RC.API_KEY);   // true = ulasan disimpan & dibaca dari Firebase (langsung tampil, tanpa WhatsApp)
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const base = `https://firestore.googleapis.com/v1/projects/${RC.PROJECT_ID}/databases/(default)/documents`;
  const stars = (n, size) => { const r = Math.round(n); return `<span class="stars" ${size ? `style="font-size:${size}px"` : ''}>${'★'.repeat(r)}<span class="off">${'★'.repeat(5 - r)}</span></span>` };
  const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
  const fmtDate = t => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) };

  /* ---------- API ---------- */
  let cache = null;
  async function load(force){
    if(cache && !force) return cache;
    if(!FB){
      cache = (window.PLUSIFY_REVIEW_DATA || []).map(r => ({product:r.product || '', rating:Number(r.rating), name:r.name || 'Anonim', text:r.text || '', date:r.date || ''}))
        .filter(r => r.rating >= 1 && r.rating <= 5 && r.text).sort((a,b) => new Date(b.date) - new Date(a.date));
      return cache;
    }
    const res = await fetch(`${base}:runQuery?key=${RC.API_KEY}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({structuredQuery:{from:[{collectionId:'reviews'}], where:{fieldFilter:{field:{fieldPath:'approved'}, op:'EQUAL', value:{booleanValue:true}}}, limit:500}})});
    if(!res.ok) throw new Error('load ' + res.status);
    const rows = await res.json();
    cache = rows.filter(r => r.document).map(r => { const f = r.document.fields || {};
      return {product:f.product?.stringValue || '', rating:Number(f.rating?.integerValue || 0), name:f.name?.stringValue || 'Anonim', text:f.text?.stringValue || '', date:f.createdAt?.timestampValue || r.document.createTime || ''} })
      .filter(r => r.rating >= 1 && r.rating <= 5).sort((a,b) => new Date(b.date) - new Date(a.date));
    return cache;
  }
  async function submit(r){
    const body = {fields:{product:{stringValue:r.product}, rating:{integerValue:String(r.rating)}, name:{stringValue:r.name}, text:{stringValue:r.text}, approved:{booleanValue:true}, createdAt:{timestampValue:new Date().toISOString()}}};
    const res = await fetch(`${base}/reviews?key=${RC.API_KEY}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    if(!res.ok) throw new Error('submit ' + res.status);
  }
  const stat = (list, product) => { const a = product ? list.filter(r => r.product === product) : list; return {n:a.length, avg:a.length ? a.reduce((s,r) => s + r.rating, 0) / a.length : 0} };

  /* ---------- nav ---------- */
  function navLink(){
    const nav = document.querySelector('#nav'); if(!nav || nav.querySelector('[data-link=reviews]')) return;
    const a = document.createElement('a'); a.href = 'reviews.html'; a.dataset.link = 'reviews'; a.textContent = 'Ulasan';
    if(document.body.dataset.page === 'reviews') a.classList.add('active');
    nav.insertBefore(a, nav.querySelector('a[href="cart.html"]'));
  }

  /* ---------- rating di kartu produk ---------- */
  function decorate(list){
    document.querySelectorAll('.card h3').forEach(h => {
      const card = h.closest('.card'); if(card.querySelector('.rate-line')) return;
      const name = h.textContent, s = stat(list, name), d = document.createElement('div'); d.className = 'rate-line';
      d.innerHTML = s.n ? `${stars(s.avg)} <b>${s.avg.toFixed(1)}</b> <a href="reviews.html?product=${encodeURIComponent(name)}">(${s.n} ulasan)</a>` : `<a href="reviews.html?product=${encodeURIComponent(name)}">Belum ada ulasan</a>`;
      h.after(d);
    });
  }
  function watchCards(list){
    decorate(list);
    ['#products', '#featured'].forEach(sel => { const el = document.querySelector(sel); if(el) new MutationObserver(() => decorate(list)).observe(el, {childList:true}) });
  }

  /* ---------- item ulasan ---------- */
  const item = (r, showProd=true) => `<article class="rv-item"><div class="top"><div><b>${esc(r.name)}</b><div class="rv-meta">${stars(r.rating)} <span>${fmtDate(r.date)}</span></div></div>${showProd ? `<span class="rv-prod">${esc(r.product)}</span>` : ''}</div><p>${esc(r.text)}</p></article>`;

  /* ---------- beranda: ulasan terbaru ---------- */
  function homeSection(list){
    const band = document.querySelector('.about-band'); if(!band || document.body.dataset.page !== 'home' || !list.length) return;
    const s = stat(list), sec = document.createElement('section'); sec.className = 'wrap section';
    sec.innerHTML = `<div class="section-title"><h2>Ulasan Pelanggan</h2><a href="reviews.html">Lihat semua →</a></div><p class="muted">${stars(s.avg)} <b>${s.avg.toFixed(1)}</b> dari ${s.n} ulasan</p><div class="rv-home">${list.slice(0,3).map(r => item(r)).join('')}</div>`;
    band.before(sec);
  }

  /* ---------- halaman reviews.html ---------- */
  function page(list){
    const root = document.querySelector('#reviews-page'); if(!root) return;
    const q = new URLSearchParams(location.search).get('product') || '';
    const names = P.map(p => p.name);
    root.innerHTML = `<div class="rv-grid"><div><div class="panel"><div id="rv-summary"></div></div><select id="rv-filter" class="rv-filter" style="margin-top:14px"><option value="">Semua produk</option>${names.map(n => `<option>${esc(n)}</option>`).join('')}</select><div id="rv-list" class="rv-list"></div></div>
    <div class="panel"><h2>Tulis Ulasan</h2><form id="rv-form" novalidate><label>Produk<select name="product" class="rv-filter" required><option value="">Pilih produk</option>${names.map(n => `<option>${esc(n)}</option>`).join('')}</select></label><div><b style="font-size:13px">Rating</b><div class="starpick" id="rv-stars">${[1,2,3,4,5].map(i => `<button type="button" data-s="${i}" aria-label="${i} bintang">★</button>`).join('')}</div></div><label>Nama<input name="name" maxlength="40" placeholder="Nama kamu" required></label><label>Ulasan<textarea name="text" rows="4" maxlength="500" placeholder="Ceritakan pengalamanmu..." required></textarea></label><div class="hp"><input name="website" tabindex="-1" autocomplete="off"></div><button class="btn full" type="submit">Kirim Ulasan</button><div id="rv-msg"></div></form></div></div>`;
    const sel = root.querySelector('#rv-filter'), form = root.querySelector('#rv-form'), msg = root.querySelector('#rv-msg');
    if(names.includes(q)){ sel.value = q; form.elements.product.value = q }
    let rating = 0;
    const paintStars = () => root.querySelectorAll('#rv-stars button').forEach(b => b.classList.toggle('on', +b.dataset.s <= rating));
    root.querySelector('#rv-stars').onclick = e => { const b = e.target.closest('button'); if(b){ rating = +b.dataset.s; paintStars() } };

    function draw(){
      const a = sel.value ? list.filter(r => r.product === sel.value) : list, s = stat(list, sel.value);
      const dist = [5,4,3,2,1].map(n => { const c = a.filter(r => r.rating === n).length; return `<div class="rv-bar"><span>${n}</span><i><span style="width:${a.length ? c / a.length * 100 : 0}%"></span></i><span>${c}</span></div>` }).join('');
      root.querySelector('#rv-summary').innerHTML = `<div class="rv-sum"><div><div class="rv-big">${s.n ? s.avg.toFixed(1) : '–'}</div>${stars(s.avg, 20)}<div class="muted" style="font-size:13px">${s.n} ulasan${sel.value ? ' · ' + esc(sel.value) : ''}</div></div><div class="rv-bars">${dist}</div></div>`;
      root.querySelector('#rv-list').innerHTML = a.length ? a.map(r => item(r, !sel.value)).join('') : '<div class="empty">Belum ada ulasan. Jadilah yang pertama!</div>';
    }
    sel.onchange = draw; draw();

    form.onsubmit = async e => {
      e.preventDefault(); msg.className = ''; msg.textContent = '';
      const d = Object.fromEntries(new FormData(form)); if(d.website) return;
      const r = {product:d.product, rating, name:(d.name || '').trim().slice(0,40), text:(d.text || '').trim().slice(0,500)};
      const bad = !names.includes(r.product) ? 'Pilih produk dulu.' : !rating ? 'Pilih rating bintang dulu.' : !r.name ? 'Nama wajib diisi.' : r.text.length < 5 ? 'Ulasan minimal 5 karakter.' : '';
      const done = FB ? jget('plusify_reviewed', []) : [];
      if(bad || done.includes(r.product) || Date.now() - (+localStorage.getItem('plusify_review_last') || 0) < 30000){
        msg.className = 'rv-msg err'; msg.textContent = bad || (done.includes(r.product) ? 'Kamu sudah memberi ulasan untuk produk ini.' : 'Tunggu sebentar sebelum mengirim ulasan lagi.'); return }
      if(!FB){ msg.className = 'rv-msg err'; msg.textContent = 'Fitur ulasan belum dikonfigurasi. Hubungi admin.'; return }
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Mengirim...';
      try{
        await submit(r);
        done.push(r.product); localStorage.setItem('plusify_reviewed', JSON.stringify(done)); localStorage.setItem('plusify_review_last', String(Date.now()));
        msg.className = 'rv-msg ok'; msg.textContent = 'Terima kasih! Ulasanmu sudah tayang.';
        form.reset(); rating = 0; paintStars();
        try{ list = await load(true) }catch(_){ list = [{product:r.product, rating:r.rating, name:r.name, text:r.text, date:new Date().toISOString()}, ...list] } draw();
      }catch(err){ msg.className = 'rv-msg err'; msg.textContent = 'Gagal mengirim ulasan. Coba lagi nanti.' }
      btn.disabled = false; btn.textContent = 'Kirim Ulasan';
    };
  }

  /* ---------- start ---------- */
  async function start(){
    const root = document.querySelector('#reviews-page');
    navLink();
    let list = [];
    try{ list = await load() }catch(e){ if(root) root.innerHTML = '<div class="empty">Ulasan belum bisa dimuat. Coba lagi nanti.</div>'; return }
    watchCards(list); homeSection(list); page(list);
  }
  start();
})();
