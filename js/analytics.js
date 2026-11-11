/* ===== GOOGLE ANALYTICS 4 =====
   Ganti G-XXXXXXXXXX di bawah dengan Measurement ID milikmu (GA > Admin > Data streams > klik stream web).
   File ini sudah dipasang di <head> semua halaman, jadi cukup edit di sini saja. */
(function(){
  var GA_ID = "G-3027G2CL8G";
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ dataLayer.push(arguments) };
  window.track = function(name, params){ if(/^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX') gtag('event', name, params || {}) };
  if(!/^G-[A-Z0-9]{6,}$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') return;   // belum diisi: tidak aktif
  var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID; document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', GA_ID);
})();
