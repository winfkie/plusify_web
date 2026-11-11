/* ========= PENGATURAN RATING & REVIEW (isi sesuai PANDUAN_REVIEW.txt) ========= */
window.PLUSIFY_REVIEWS = {
  // OPSIONAL - biarkan kosong. Ulasan sudah aktif tanpa ini (data dari js/reviews-data.js). Isi hanya jika mau pakai Firebase.
  // Dari Firebase Console > Project settings > Your apps (Web app)
  PROJECT_ID: "",   // contoh: "plusify-reviews"
  API_KEY: "",      // contoh: "AIzaSy...."

  // false = ulasan baru harus kamu setujui dulu (disarankan, anti spam)
  // true  = ulasan langsung tampil (aturan Firestore harus disesuaikan, lihat panduan)
  AUTO_PUBLISH: false
};
