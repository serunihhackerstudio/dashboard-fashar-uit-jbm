# Dashboard FASHAR UIT JBM

Functional web prototype hasil redesign dari Dashboard FASHAR Looker Studio.

## Menu
1. Health Index
2. Asesmen JAR
3. Asesmen GI
4. Tower Emergency *(Peralatan ERS)*
5. Trafo Mobile *(Peralatan ERS — data sheet `2. TRAFO MOBILE` dari Google Sheets: peta lokasi, daftar komponen, tambah/edit, foto)*
6. Alat Berat *(grup tersendiri: Alat Berat & Alat Bantu — Database Kesiapan Alat Berat UIT JBM, data dummy)*

## Status
Menu Trafo Mobile memakai data live Google Sheets (lihat bagian di bawah). Menu lain masih memakai data statis/mock.

## Menjalankan secara lokal
Cukup buka `index.html` menggunakan browser modern.

## Deploy
Struktur ini sudah siap untuk static hosting seperti Vercel.

## Edit Database Trafo Mobile (Google Sheets)

Menu **Database Trafo Mobile** bisa menambah dan mengedit komponen langsung ke sheet
`2. TRAFO MOBILE` di spreadsheet **DATABASE ALAT BERAT UIT JBM**, melalui Google Apps Script.
Tanpa langkah di bawah, halaman tetap tampil dengan data statis (`data/trafo-mobile-db.js`) dalam mode baca saja.

### Setup (sekali saja, oleh pemilik spreadsheet)
1. Buka spreadsheet → **Extensions → Apps Script**.
2. Hapus isi `Code.gs`, lalu tempel seluruh isi file [`apps-script/Code.gs`](apps-script/Code.gs). Simpan.
3. **Project Settings** (ikon roda gigi) → **Script Properties** → **Add script property**:
   - Property: `EDIT_TOKEN`
   - Value: kode akses edit yang hanya dibagikan ke petugas yang boleh mengedit.
4. **Deploy → New deployment** → tipe **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   Klik **Deploy**, izinkan akses, lalu salin **Web app URL** (berakhiran `/exec`).
5. Tempel URL tersebut ke `config.js`:
   ```js
   window.FASHAR_CONFIG = { trafoDbApi: "https://script.google.com/macros/s/XXXX/exec" };
   ```
   lalu commit & deploy ulang.

Jika `Code.gs` diubah, gunakan **Deploy → Manage deployments → Edit → Version: New version** agar URL tetap sama.

### Cara kerja & keamanan
- Siapa pun yang membuka dashboard dapat **melihat** data (sama seperti sebelumnya). **Menyimpan** perubahan wajib memasukkan kode akses edit (`EDIT_TOKEN`); kode cukup dimasukkan sekali per perangkat (diingat di browser tersebut) dan bisa dihapus lewat tautan **Lupakan** di form. Jika `EDIT_TOKEN` diganti, perangkat yang menyimpan kode lama akan diminta memasukkan kode baru.
- Tombol **Detail** menampilkan seluruh informasi baris (termasuk informasi aset, tautan dokumentasi, dan riwayat lokasi). Kolom nilai aset, referensi, dan riwayat hanya bisa diubah langsung di Google Sheets.
- **UPT** dan **Gardu induk** dipilih dari daftar GI/GIS UIT JBM (`data/gi-uit-jbm.js`, dibuat dengan `python3 tools/xlsx_to_gi_list.py "LIST_GI_SE_UIT_JBM.xlsx"`); unit di luar UIT JBM bisa diisi manual. **Nama aset** dibentuk otomatis dari pilihan UPT + gardu induk. Bila nama aset berupa sel gabungan, skrip memisahkan sel itu dulu agar baris lain dalam satu set tidak ikut berubah.
- Baris baru ditambahkan di bawah baris data terakhir. Sebelum mengedit, skrip memastikan isi baris belum berubah di spreadsheet (jika berubah, muat ulang halaman).
- Untuk mengganti kode akses, ubah nilai `EDIT_TOKEN` di Script Properties.

### Memperbarui data statis
Data cadangan (dipakai bila Google Sheets tidak terhubung) dibuat dari file xlsx:
```bash
python3 tools/xlsx_to_trafo_db.py "DATABASE_ALAT_BERAT_UIT_JBM.xlsx"
```

### Peta Lokasi Penempatan
- Peta memakai [Leaflet](https://leafletjs.com) (disimpan di `vendor/leaflet`, lisensi BSD-2) dengan latar peta © OpenStreetMap (tanpa API key; mode gelap memakai filter warna).
- Koordinat tiap gardu induk adalah **perkiraan** dan disimpan di `TDB_COORDS` pada `app.js` (kunci = nama GI tanpa jenis/tegangan, mis. `KALISARI`, `PAITON`). Lokasi baru yang belum punya koordinat tetap tampil di daftar dengan keterangan "belum ada titik peta".

### Foto komponen (Google Drive)
- Foto dikelola di form **Edit komponen**: **Tambah foto** (beberapa sekaligus, maks. 10 per unggahan), **Ganti**, **Keterangan**, dan **Hapus**; perubahan foto langsung tersimpan ke Drive. Pop-up **Detail** menampilkan foto untuk dilihat saja. Klik foto untuk memperbesar.
- Foto disimpan di folder Google Drive `PHOTO_ROOT_ID` pada `apps-script/Code.gs` (bisa diganti lewat Script Property `PHOTO_FOLDER_ID`). Setiap komponen mendapat subfolder sendiri; link subfolder ditulis otomatis ke kolom **LINK FOTO PERALATAN** (kolom Y).
- Foto diperkecil di browser (sisi terpanjang 1920 px, JPEG) sebelum diunggah. Foto yang diganti/dihapus dipindahkan ke **Sampah** Google Drive dan masih bisa dipulihkan.
- Mengunggah/mengubah foto memakai kode akses edit yang sama.
- **Setup:** tempel ulang `apps-script/Code.gs`, lalu **Deploy → Manage deployments → Edit → New version**. Saat diminta, izinkan akses Google Drive. Akun pemilik skrip harus punya akses edit ke folder foto.
- Agar foto tampil di dashboard untuk semua pengguna, folder foto perlu dibagikan **"Siapa saja yang memiliki link — Viewer"**.

### Riwayat perpindahan lokasi
- Setiap komponen diberi **ID tetap** (`TM-0001`, …) di kolom **ID DASHBOARD** (kolom AP) sheet `2. TRAFO MOBILE`; diisi otomatis oleh skrip.
- Riwayat disimpan di sheet **RIWAYAT LOKASI** (dibuat otomatis): tanggal pindah, ID komponen, dari/ke UPT & gardu induk, alasan, no/link BA, waktu pencatatan, sumber.
- Saat **UPT/Gardu induk** diubah di form Edit, muncul isian **Perpindahan lokasi** (tanggal, BA, alasan). Bila komponen lain dengan **Nama aset** sama berada di lokasi yang sama, tersedia pilihan **pindahkan seluruh set** — semua komponen ikut dipindah dan masing-masing tercatat riwayatnya.
- Riwayat lama dapat ditambahkan/dihapus di bagian **Riwayat perpindahan** form Edit. Pop-up Detail menampilkan timeline; tabel menampilkan tanggal pindah terakhir; peta menampilkan rute perpindahan untuk lokasi yang dipilih (hanya GI yang sudah punya koordinat di `TDB_COORDS`).
- **Dokumen BA mobilisasi** dapat diunggah di kotak Perpindahan lokasi maupun di form Tambah riwayat (PDF/JPG/PNG/DOC/DOCX, maks. 15 MB). File disimpan di folder Drive `BA_ROOT_ID` (`apps-script/Code.gs`, bisa diganti lewat Script Property `BA_FOLDER_ID`) dengan nama `BA_Mobilisasi_[GI_ASAL]_ke_[GI_TUJUAN]_[tanggal_diupload]` (mis. `BA_Mobilisasi_GIS_150KV_TANDES_ke_GI_150KV_KALISARI_2026-11-04.pdf`); link-nya tersimpan di kolom NO / LINK BA riwayat. Akun pemilik skrip harus punya akses edit ke folder tersebut.
- Setelah memperbarui `apps-script/Code.gs`, buat **New version** pada deployment.

### Alat Berat (data dummy)
- Menu **Alat Berat** (Database Kesiapan Alat Berat UIT JBM) berisi **Daftar Alat**: filter kategori Crane/Forklift/Manlift/Alat Pendukung, filter kondisi, pencarian, **peta lokasi penyimpanan** yang memfilter tabel, **tabel** 10 data/halaman dengan Tampilkan semua, atau tampilan kartu, serta pop-up detail alat. Pemberitahuan data contoh tampil sekali dan tidak muncul lagi di perangkat itu setelah ditutup.
- Semua data masih **contoh**, dibuat di `data/alat-berat-dummy.js` (52 alat, 18 data peminjaman contoh untuk status "Dipinjam" & info terakhir dipinjam, koordinat perkiraan 7 lokasi). Logika tampilan ada di `alat-berat.js`.
- Untuk data asli: ganti isi `window.ALAT_BERAT_DUMMY` dengan struktur yang sama (`alat[]`: id, kategori, nama, merk, kapasitas, tahun, noSeri, upt, lokasi, status, layak, kondisi, fungsi, suratIzin, foto; `peminjaman[]`: id, alatId, peminjam, pic, pekerjaan, tujuan, mulai, selesai, status, histori[]), atau sambungkan ke Google Sheets seperti menu Trafo Mobile.
