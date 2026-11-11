const P = window.PLUSIFY_PRODUCTS || [];
const LOGOS = window.PLUSIFY_LOGOS || {};
const CFG = window.PLUSIFY_CONFIG || {};

/* ---------- helpers ---------- */
const fmt = n => new Intl.NumberFormat('id-ID', {style:'currency', currency:'IDR', maximumFractionDigits:0}).format(n*1000);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
const cart = () => jget('plusify_cart', []);
const saveCart = x => { localStorage.setItem('plusify_cart', JSON.stringify(x)); countCart() };
const orders = () => jget('plusify_orders', []);
const saveOrders = x => localStorage.setItem('plusify_orders', JSON.stringify(x));
const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function countCart(){ const e = document.getElementById('cart-count'); if(e) e.textContent = cart().reduce((s,x) => s + x.qty, 0) }

/* ---------- logo ---------- */
function logo(name, cls=''){
  const L = LOGOS[name] || {color:'#7564d8', domain:'', svg:''};
  const mono = `<b class="mono" style="background:${L.color}">${esc(name[0])}</b>`;
  if(L.svg) return `<span class="logo ${cls}">${L.svg}</span>`;
  const srcs = [`assets/logos/${slug(name)}.png`];
  if(L.domain) srcs.push(`https://www.google.com/s2/favicons?domain=${L.domain}&sz=128`);
  return `<span class="logo ${cls}">${mono}<img alt="Logo ${esc(name)}" loading="lazy" src="${srcs[0]}" data-next="${srcs.slice(1).join('|')}" onerror="plErr(this)" onload="plOk(this)"></span>`;
}
window.plErr = img => { const n = (img.dataset.next || '').split('|').filter(Boolean); if(n.length){ img.dataset.next = n.slice(1).join('|'); img.src = n[0] } else img.remove() };
window.plOk = img => { if(img.naturalWidth < 20) return window.plErr(img); img.classList.add('ok'); img.parentElement.classList.add('has-img') };

/* ---------- kartu produk ---------- */
function card(p){
  const min = Math.min(...p.variants.map(v => v.price));
  return `<article class="card"><div class="thumb">${logo(p.name)}</div><p class="muted">${esc(p.category)}</p><h3>${esc(p.name)}</h3><div class="price">Mulai ${fmt(min)}</div><button class="btn" data-p="${encodeURIComponent(p.name)}">Pilih Paket</button></article>`;
}

/* ---------- nav ---------- */
function nav(){
  const b = document.querySelector('.hamb'), n = document.querySelector('#nav');
  if(b) b.onclick = () => n.classList.toggle('open');
  const d = document.body.dataset.page;
  document.querySelectorAll('[data-link]').forEach(a => { if(a.dataset.link === d) a.classList.add('active') });
  document.querySelectorAll('.brand img').forEach(i => i.addEventListener('error', () => { i.replaceWith(Object.assign(document.createElement('span'), {className:'brand-text', textContent:'Plusify'})) }));
  countCart();
}

/* ---------- home ---------- */
function home(){
  const el = document.querySelector('#featured'); if(!el) return;
  el.innerHTML = ['Canva','CapCut','Netflix','ChatGPT Plus'].map(n => P.find(p => p.name === n)).filter(Boolean).map(card).join('');
  el.onclick = e => { const b = e.target.closest('[data-p]'); if(b) location.href = 'products.html?search=' + b.dataset.p };
  const strip = document.querySelector('#logo-strip');
  if(strip) strip.innerHTML = P.map(p => `<a href="products.html?search=${encodeURIComponent(p.name)}" title="${esc(p.name)}">${logo(p.name)}</a>`).join('');
}

/* ---------- produk + varian ---------- */
function productsPage(){
  const grid = document.querySelector('#products'); if(!grid) return;
  const s = document.querySelector('#search'), c = document.querySelector('#category'), sort = document.querySelector('#sort'), count = document.querySelector('#count');
  [...new Set(P.map(p => p.category))].forEach(x => c.add(new Option(x, x)));
  const q = new URLSearchParams(location.search);
  if(q.get('cat')) c.value = q.get('cat');
  if(q.get('search')) s.value = q.get('search');
  const minP = p => Math.min(...p.variants.map(v => v.price));

  function render(){
    const a = P.filter(p => (p.name + ' ' + p.category).toLowerCase().includes(s.value.toLowerCase()) && (!c.value || p.category === c.value));
    if(sort.value === 'low') a.sort((x,y) => minP(x) - minP(y));
    if(sort.value === 'high') a.sort((x,y) => minP(y) - minP(x));
    if(sort.value === 'az') a.sort((x,y) => x.name.localeCompare(y.name));
    count.textContent = `${a.length} produk ditemukan`;
    grid.innerHTML = a.length ? a.map(card).join('') : '<div class="empty">Produk tidak ditemukan.</div>';
  }

  let chosen = null, pkg = null, vi = null;
  const modal = document.querySelector('#modal'), choices = document.querySelector('#choices'), add = document.querySelector('#add'), price = document.querySelector('#mprice'), qty = document.querySelector('#qty'), mlogo = document.querySelector('#mlogo');
  const variant = () => (chosen && vi !== null) ? chosen.variants[vi] : null;

  function draw(){
    const pks = [...new Set(chosen.variants.map(v => v.package))];
    const durs = chosen.variants.map((v,i) => ({v,i})).filter(o => o.v.package === pkg);
    const pk = n => Math.min(...chosen.variants.filter(v => v.package === n).map(v => v.price));
    choices.innerHTML =
      `<div class="variant-group"><h4>Pilih Paket (Sharing / Private)</h4><div class="choices">${pks.map(x => `<button type="button" class="choice ${x === pkg ? 'selected' : ''}" data-g="package" data-v="${esc(x)}">${esc(x)}<small>mulai ${fmt(pk(x))}</small></button>`).join('')}</div></div>` +
      (pkg ? `<div class="variant-group"><h4>Pilih Durasi</h4><div class="choices">${durs.map(o => `<button type="button" class="choice ${o.i === vi ? 'selected' : ''}" data-g="duration" data-v="${o.i}">${esc(o.v.duration)}<small>${fmt(o.v.price)}</small></button>`).join('')}</div></div>` : '');
    const v = variant();
    price.textContent = v ? fmt(v.price) : 'Pilih varian';
    add.disabled = !v;
  }
  function open(name){
    chosen = P.find(x => x.name === name); qty.value = 1; pkg = vi = null;
    document.querySelector('#mname').textContent = chosen.name;
    document.querySelector('#mcat').textContent = chosen.category;
    mlogo.innerHTML = logo(chosen.name);
    const pks = [...new Set(chosen.variants.map(v => v.package))];
    if(pks.length === 1){ pkg = pks[0]; const d = chosen.variants.filter(v => v.package === pkg); if(d.length === 1) vi = chosen.variants.indexOf(d[0]) }
    draw(); modal.classList.add('open');
  }
  choices.onclick = e => {
    const b = e.target.closest('.choice'); if(!b) return;
    if(b.dataset.g === 'package'){
      pkg = b.dataset.v; const d = chosen.variants.filter(v => v.package === pkg);
      vi = d.length === 1 ? chosen.variants.indexOf(d[0]) : null;
    } else vi = +b.dataset.v;
    draw();
  };
  grid.onclick = e => { const b = e.target.closest('[data-p]'); if(b) open(decodeURIComponent(b.dataset.p)) };
  document.querySelectorAll('[data-close]').forEach(x => x.onclick = () => modal.classList.remove('open'));
  add.onclick = () => {
    const v = variant(); if(!v) return;
    const qn = Math.max(1, Math.min(20, Number(qty.value) || 1)), a = cart();
    const same = a.find(x => x.name === chosen.name && x.package === v.package && x.duration === v.duration && x.price === v.price);
    if(same) same.qty = Math.min(20, same.qty + qn); else a.push({name:chosen.name, package:v.package, duration:v.duration, price:v.price, qty:qn});
    if(window.track) track('add_to_cart', {currency:'IDR', value:v.price*1000*qn, items:[{item_name:chosen.name, item_variant:v.package + ' ' + v.duration, price:v.price*1000, quantity:qn}]});
    saveCart(a); location.href = 'cart.html';
  };
  [s, c, sort].forEach(x => x.addEventListener('input', render));
  render();
}

/* ---------- keranjang ---------- */
function cartPage(){
  const el = document.querySelector('#cart'); if(!el) return;
  function render(){
    const a = cart();
    if(!a.length){ el.innerHTML = '<div class="empty"><h2>Keranjang masih kosong</h2><a class="btn" href="products.html">Cari Produk</a></div>'; return }
    const total = a.reduce((s,x) => s + x.price * x.qty, 0);
    el.innerHTML = a.map((x,i) => `<div class="cart-row"><div class="cart-item">${logo(x.name,'sm')}<div><b>${esc(x.name)}</b><p>${esc(x.package)} · ${esc(x.duration)}</p><strong>${fmt(x.price*x.qty)}</strong></div></div><div><input type="number" min="1" max="20" value="${x.qty}" data-qty="${i}"> <button class="remove" data-del="${i}">Hapus</button></div></div>`).join('')
      + `<div class="cart-bottom"><div>Total belanja<br><strong>${fmt(total)}</strong></div><a class="btn" href="checkout.html">Lanjut Checkout</a></div>`;
  }
  el.onchange = e => { if(e.target.dataset.qty !== undefined){ const a = cart(); a[+e.target.dataset.qty].qty = Math.max(1, Math.min(20, +e.target.value || 1)); saveCart(a); render() } };
  el.onclick = e => { if(e.target.dataset.del !== undefined){ const a = cart(); a.splice(+e.target.dataset.del, 1); saveCart(a); render() } };
  render();
}

/* ---------- checkout: data diri + metode pembayaran ---------- */
function checkout(){
  const f = document.querySelector('#form'), sum = document.querySelector('#summary'); if(!f) return;
  const a = cart();
  if(!a.length){ sum.innerHTML = '<p>Keranjang kosong.</p><a class="btn" href="products.html">Pilih produk</a>'; f.querySelector('button[type=submit]').disabled = true; return }
  const total = a.reduce((s,x) => s + x.price * x.qty, 0);
  sum.innerHTML = '<h2>Ringkasan Pesanan</h2>' + a.map(x => `<div class="summary-row"><span class="cart-item">${logo(x.name,'sm')}<span>${esc(x.name)}<br><small>${esc(x.package)} · ${esc(x.duration)} × ${x.qty}</small></span></span><b>${fmt(x.price*x.qty)}</b></div>`).join('') + `<div class="summary-total"><span>Total</span><b>${fmt(total)}</b></div>`;

  // pilihan metode
  const wallets = CFG.EWALLETS || [];
  const wbox = document.querySelector('#wallet-box');
  wbox.innerHTML = wallets.map((w,i) => `<label class="wallet"><input type="radio" name="wallet" value="${esc(w.id)}" ${i===0?'checked':''}><span class="wdot" style="background:${w.color}">${esc(w.id[0])}</span>${esc(w.id)}</label>`).join('');
  const toggle = () => { wbox.style.display = f.method.value === 'E-Wallet' ? 'grid' : 'none' };
  f.querySelectorAll('[name=method]').forEach(r => r.addEventListener('change', toggle)); toggle();

  f.onsubmit = e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const phone = String(d.phone).replace(/[^0-9+]/g, '');
    if(phone.replace(/\D/g, '').length < 9){ alert('Nomor WhatsApp belum valid.'); return }
    d.phone = phone;
    const method = d.method === 'E-Wallet' ? 'E-Wallet ' + (d.wallet || '') : 'QRIS';
    const o = {id:'PLS' + Date.now().toString().slice(-8), date:new Date().toLocaleString('id-ID'), buyer:{name:d.name.trim(), email:d.email.trim(), phone, note:(d.note||'').trim()}, method:d.method, wallet:d.method === 'E-Wallet' ? d.wallet : '', methodLabel:method.trim(), items:a, total, status:'Menunggu pembayaran'};
    const os = orders(); os.unshift(o); saveOrders(os);
    localStorage.setItem('plusify_last_order', JSON.stringify(o));
    if(window.track) track('begin_checkout', {currency:'IDR', value:total*1000, payment_type:method.trim()});
    saveCart([]); location.href = 'payment.html';
  };
}

/* ---------- template chat WhatsApp ---------- */
function waLink(o){
  const lines = ['Halo Admin Plusify, saya sudah melakukan pembayaran. Berikut detail pesanan saya:', '', `Order ID: ${o.id}`, ''];
  o.items.forEach((x,i) => lines.push(`${i+1}. ${x.name}`, `   • Jenis: ${x.package}`, `   • Durasi: ${x.duration}`, `   • Jumlah: ${x.qty}`, `   • Harga: ${fmt(x.price*x.qty)}`));
  lines.push('', `Total bayar: ${fmt(o.total)}`, `Metode pembayaran: ${o.methodLabel}`, `Kode referral: ${o.referral || '-'}`, '', 'Data pembeli:', `Nama: ${o.buyer.name}`, `Email: ${o.buyer.email}`, `WhatsApp: ${o.buyer.phone}`);
  if(o.buyer.note) lines.push(`Catatan: ${o.buyer.note}`);
  lines.push('', 'Mohon diproses ya kak, terima kasih.');
  const num = String(CFG.ADMIN_WA || '').replace(/\D/g, '');
  return `https://wa.me/${num}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/* ---------- halaman pembayaran ---------- */
function payment(){
  const el = document.querySelector('#payment'); if(!el) return;
  const o = jget('plusify_last_order', null);
  if(!o){ el.innerHTML = '<h2>Belum ada pesanan</h2><p class="muted">Pilih produk dulu, lalu lanjut checkout.</p><a class="btn" href="products.html">Lihat produk</a>'; return }
  const items = o.items.map(x => `<div class="summary-row"><span class="cart-item">${logo(x.name,'sm')}<span>${esc(x.name)}<br><small>${esc(x.package)} · ${esc(x.duration)} × ${x.qty}</small></span></span><b>${fmt(x.price*x.qty)}</b></div>`).join('');
  let how;
  if(o.method === 'QRIS'){
    how = `<h3>Bayar dengan QRIS</h3><p class="muted">Scan QRIS di bawah memakai aplikasi bank / e-wallet apa pun, lalu masukkan nominal <b>tepat</b> sesuai total.</p><div class="qris"><img src="${esc(CFG.QRIS_IMAGE)}" alt="QRIS ${esc(CFG.QRIS_NAME)}" onerror="this.outerHTML='<div class=&quot;qris-missing&quot;>Gambar QRIS belum dipasang.<br>Simpan file QRIS di <b>assets/qris.jpeg</b></div>'"></div><a class="btn ghost" href="${esc(CFG.QRIS_IMAGE)}" download="QRIS-Plusify.jpg">Simpan gambar QRIS</a>`;
  } else {
    const w = (CFG.EWALLETS || []).find(x => x.id === o.wallet) || {};
    how = `<h3>Transfer ke ${esc(o.wallet)}</h3><p class="muted">Kirim nominal <b>tepat</b> sesuai total ke nomor berikut:</p><div class="wallet-card" style="--c:${w.color || '#7564d8'}"><span class="wdot big" style="background:${w.color || '#7564d8'}">${esc((o.wallet||'?')[0])}</span><div><small>${esc(o.wallet)}</small><strong id="wnum">${esc(w.number || '-')}</strong>${w.holder ? `<span>a.n. ${esc(w.holder)}</span>` : ''}</div><button type="button" class="btn ghost" id="copy-num">Salin nomor</button></div>`;
  }
  el.innerHTML = `<div class="pay-grid"><div><small>ORDER ${o.id}</small><h2>Selesaikan Pembayaran</h2><p>Status: <b id="ostatus">${esc(o.status)}</b></p><div class="amount"><span>Total yang harus dibayar</span><strong>${fmt(o.total)}</strong><button type="button" class="link" id="copy-amt">Salin nominal</button></div>${how}</div><div><h3>Pesanan kamu</h3>${items}<div class="summary-total"><span>Total</span><b>${fmt(o.total)}</b></div><p class="muted">Pembeli: ${esc(o.buyer.name)} · ${esc(o.buyer.phone)}</p><ol class="steps"><li>Bayar sesuai nominal &amp; metode di sebelah.</li><li>Screenshot bukti pembayaran.</li><li>Klik tombol di bawah, WhatsApp akan terbuka dengan pesan pesananmu. Kirim, lalu lampirkan bukti bayar.</li></ol><div class="ref-box"><label for="ref-input"><b>Kode Referral</b> <span class="muted">(opsional)</span></label><div class="ref-row"><input id="ref-input" placeholder="Contoh: PLFY-XXXXX" autocomplete="off" value="${esc(o.referral || '')}"><button type="button" class="btn ghost" id="ref-apply">Terapkan</button></div><div id="ref-msg" class="ref-msg"></div></div><a id="wa" class="btn wa full" href="${waLink(o)}" target="_blank" rel="noopener">Saya Sudah Bayar, Chat Admin via WhatsApp</a></div></div>`;
  const copy = (txt, btn) => { (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).catch(() => { const t = document.createElement('textarea'); t.value = txt; document.body.append(t); t.select(); document.execCommand('copy'); t.remove() }); const old = btn.textContent; btn.textContent = 'Tersalin ✓'; setTimeout(() => btn.textContent = old, 1500) };
  const cn = document.querySelector('#copy-num'); if(cn) cn.onclick = () => copy(document.querySelector('#wnum').textContent, cn);
  const ca = document.querySelector('#copy-amt'); ca.onclick = () => copy(String(o.total * 1000), ca);
  /* referral: hanya kode di CFG.REFERRAL_CODES yang valid */
  const codes = (CFG.REFERRAL_CODES || []).map(c => c.toUpperCase());
  const rin = document.querySelector('#ref-input'), rmsg = document.querySelector('#ref-msg'), wa = document.querySelector('#wa');
  const setMsg = (t, ok) => { rmsg.textContent = t; rmsg.className = 'ref-msg ' + (t ? (ok ? 'ok' : 'err') : '') };
  const persist = () => { const all = orders(), x = all.find(z => z.id === o.id); if(x){ x.referral = o.referral; saveOrders(all) } localStorage.setItem('plusify_last_order', JSON.stringify(o)); wa.href = waLink(o) };
  function applyRef(){
    const v = rin.value.trim().toUpperCase();
    if(!v){ o.referral = ''; persist(); setMsg('', true); return true }
    if(codes.includes(v)){ o.referral = v; rin.value = v; persist(); setMsg('Kode referral berhasil dipakai ✓', true); if(window.track) track('referral_applied', {code:v}); return true }
    o.referral = ''; persist(); setMsg('Kode referral tidak valid.', false); return false;
  }
  document.querySelector('#ref-apply').onclick = applyRef;
  rin.addEventListener('keydown', e => { if(e.key === 'Enter') applyRef() });
  if(o.referral) setMsg('Kode referral berhasil dipakai ✓', true);
  wa.addEventListener('click', e => { if(!applyRef()){ e.preventDefault(); rin.focus() } else if(window.track) track('click_whatsapp_admin', {order_id:o.id, value:o.total*1000, currency:'IDR'}) });
  document.querySelector('#wa').addEventListener('click', () => {
    const all = orders(), x = all.find(z => z.id === o.id);
    if(x){ x.status = 'Menunggu konfirmasi admin'; saveOrders(all); o.status = x.status; localStorage.setItem('plusify_last_order', JSON.stringify(o)); document.querySelector('#ostatus').textContent = x.status }
  });
}

/* ---------- profil ---------- */
function profile(){
  const d = document.querySelector('#details'), h = document.querySelector('#history'); if(!d) return;
  const a = orders(), o = a[0];
  d.innerHTML = o ? `<p><b>${esc(o.buyer.name)}</b></p><p>${esc(o.buyer.email)}</p><p>${esc(o.buyer.phone)}</p>` : '<p class="muted">Data pembeli akan muncul setelah checkout.</p>';
  h.innerHTML = a.length ? a.map(x => `<div class="order"><b>${x.id}</b> <span class="status">${esc(x.status)}</span><p>${esc(x.date)} · ${fmt(x.total)}</p><p class="muted">${x.items.map(i => esc(i.name)).join(', ')}</p></div>`).join('') : '<p class="muted">Belum ada riwayat pesanan.</p>';
}

document.addEventListener('DOMContentLoaded', () => { nav(); home(); productsPage(); cartPage(); checkout(); payment(); profile() });

/* ---------- rating & review (opsional, aktif jika js/reviews-config.js diisi) ---------- */
(function(){
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/reviews.css'; document.head.append(l);
  ['js/reviews-config.js', 'js/reviews-data.js', 'js/reviews.js'].forEach(src => { const s = document.createElement('script'); s.src = src; s.async = false; document.body.append(s) });
})();
