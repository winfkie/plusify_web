/* ========= PENGATURAN TOKO PLUSIFY (EDIT DI SINI) ========= */
window.PLUSIFY_CONFIG = {
  // Nomor WhatsApp admin, format internasional tanpa + / spasi / 0 di depan. Contoh: 6281234567890
  ADMIN_WA: "628111115150",

  // Gambar QRIS kamu. Taruh file di assets/qris.jpeg (atau ganti nama file di sini).
  QRIS_IMAGE: "assets/qris.jpeg",
  QRIS_NAME: "Plusify",

  // Kode referral yang valid (hanya 5 ini yang diterima, selain ini dianggap salah)
  REFERRAL_CODES: ["PLFY-8K2M9", "PLFY-7X4N2", "PLFY-5Q9R3", "PLFY-6T2P8", "PLFY-9W3L5"],

  // Daftar e-wallet tujuan transfer (isi holder jika mau menampilkan atas nama).
  // Hapus baris e-wallet yang tidak kamu pakai.
  EWALLETS: [
    { id: "ShopeePay", number: "08111115150", holder: "reginaegin12", color: "#EE4D2D" },
    { id: "GoPay",     number: "08111115150", holder: "regina", color: "#00AA13" }
  ]
};
