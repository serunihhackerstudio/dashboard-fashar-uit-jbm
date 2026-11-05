/* =========================================================
   DATABASE — Alat Berat & Alat Bantu UIT JBM
   Sengaja dikosongkan: menunggu data asli diunggah.
   Struktur:
   alat[]       : { id, kategori (crane|forklift|manlift|pendukung), nama, merk, tipe, kapasitas, tahun, noSeri,
                    upt, lokasi, status, layak, kondisi, fungsi, suratIzin, terakhirDipinjam, foto }
   peminjaman[] : { id, alatId, peminjam, pic, pekerjaan, tujuan, mulai, selesai, status, histori[] }
   koordinat    : { "<nama lokasi>": [lat, lng] }  (untuk peta)
   ========================================================= */
window.ALAT_BERAT = { alat: [], peminjaman: [], koordinat: {} };
