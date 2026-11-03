# Dashboard FASHAR UIT JBM

Functional web prototype hasil redesign dari Dashboard FASHAR Looker Studio.

## Menu
1. Kinerja PDKB
2. Optimalisasi PDKB
3. Health Index
4. Asesmen JAR
5. Asesmen GI
6. Tower Emergency
7. Trafo Mobile

## Tampilan (redesign UI/UX)
- Sidebar dikelompokkan (Kinerja · Kondisi Aset · Peralatan ERS), bisa diciutkan, jadi drawer di HP.
- Navigasi berbasis URL (`#kinerja`, `#tower`, …): bisa di-refresh, di-bookmark, dan tombol Back berfungsi.
- Mode terang/gelap (mengikuti sistem, tersimpan di browser).
- Gauge & donut kini proporsional terhadap data; bar chart punya garis target 100% dan nilai < 80% ditandai merah.
- Asesmen per UPT ditampilkan sebagai bar bertumpuk P1/P2/P3.
- Tabel material: pencarian + urutkan per kolom.
- Kartu Trafo Mobile dengan badge status (Berbeban/Standby/Dipinjam/Rusak) dan label informasi yang jelas.

## Status
Prototype frontend. Data saat ini masih statis/mock berdasarkan dashboard existing.
Integrasi data live Google Sheets akan dilakukan pada tahap berikutnya.

## Menjalankan secara lokal
Cukup buka `index.html` menggunakan browser modern.

## Deploy
Struktur ini sudah siap untuk static hosting seperti Vercel.
