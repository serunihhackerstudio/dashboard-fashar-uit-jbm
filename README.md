# Dashboard FASHAR UIT JBM

Functional web prototype hasil redesign dari Dashboard FASHAR Looker Studio.

## Menu
0. **Beranda** *(halaman awal: sambutan + foto tim, angka sorotan dari seluruh menu, dan kartu fitur per kelompok menu — `home.js`)*
1. Health Index
2. Asesmen JAR
3. Asesmen GI
4. CUI Jarvis (hasil Climb Up Inspection tower dari export Jarvis)
5. Tower Emergency *(Peralatan ERS — sementara menampilkan halaman "under maintenance"; konten lama disembunyikan di `.tower-legacy`)*
6. Trafo Mobile *(Peralatan ERS — data sheet `2. TRAFO MOBILE` dari Google Sheets: peta lokasi, daftar komponen, tambah/edit, foto)*
7. DC Mobile *(Peralatan ERS — data unit DC mobile dari `DATA_DC_MOBILE_UIT_JBM.xlsx`: ringkasan, peta per ULTG, grafik, tabel & detail)*
8. Alat Berat *(grup tersendiri: Alat Berat & Alat Bantu — Database Kesiapan Alat Berat UIT JBM; data dummy, menunggu sinkronisasi data dari aplikasi WARNOTO)*
9. Filter Minyak *(Alat Berat & Alat Bantu — data unit filter minyak trafo dari `FILTER_MINYAK_UIT_JBM.xlsx`)*
10. HV Test *(Alat Berat & Alat Bantu — alat uji tegangan tinggi, live dari sheet `7. ALAT HV TEST (NEW)`: kartu per alat, grafik kondisi & umur, tabel, detail, tambah/edit & foto)*

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

### Tanggal "Diperbarui" Trafo Mobile
- Mengikuti **waktu perubahan data terakhir**: edit/tambah komponen, foto, riwayat lokasi, atau dokumen BA lewat dashboard; edit langsung di sheet `2. TRAFO MOBILE` / `RIWAYAT LOKASI` (simple trigger `onEdit`); atau isi data yang berubah saat dimuat ulang (sinkronisasi, dicek dengan hash). Disimpan di Script Property `TRAFO_UPDATED` dan dikirim sebagai `updated` oleh Apps Script.
- Arahkan kursor ke chip **Diperbarui** untuk melihat jam perubahannya.

### Cara kerja & keamanan
- **Foto di form Edit (Alat Berat, DC Mobile, Filter Minyak, HV Test) disiapkan dulu**: memilih, menghapus, atau menjadikan foto utama tidak langsung dikirim; semuanya diunggah bersama data saat menekan **Simpan** (sekali isi kode akses). Komponen: `photo-stage.js`.
- **Kode akses edit diingat per komputer**: cukup diketik sekali; setelah berhasil menyimpan, semua form di komputer itu terisi otomatis. Komputer lain wajib memasukkan kode. Tautan **Lupakan** menghapusnya.
- Siapa pun yang membuka dashboard dapat **melihat** data (sama seperti sebelumnya). **Menyimpan** perubahan wajib memasukkan kode akses edit (`EDIT_TOKEN`); kode **cukup dimasukkan sekali per komputer/browser** (diingat setelah berhasil menyimpan, bisa dihapus lewat **Lupakan**). Di komputer lain kode harus dimasukkan lagi.
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

### DC Mobile (Peralatan ERS)
- Menu **DC Mobile** menampilkan unit DC mobile per UPT/ULTG: kartu ringkasan (total, kondisi normal, kalibrasi kedaluwarsa, belum kalibrasi, unit baru), peta lokasi per ULTG (posisi perkiraan), grafik sebaran per UPT, status kalibrasi, merk & tipe, kondisi & umur unit, tabel dengan filter UPT / status kalibrasi / pencarian, dan pop-up detail seluruh kolom Excel.
- Memperbarui data: `python3 tools/xlsx_alat_to_js.py "DATA_DC_MOBILE_UIT_JBM.xlsx" data/dc-mobile.js DC_MOBILE` lalu commit `data/dc-mobile.js`. Tanggal **Diperbarui** = tanggal `updated_at`/`created_at` terbaru di file.
- Koordinat ULTG/UPT untuk peta ada di `ULTG_COORD` (`alat-export.js`); tambahkan jika ada lokasi baru.

- **Database Google Sheets `4. DC MOBILE (NEW)`** (Apps Script bagian PERALATAN LAIN, `EQ_CFG.dcm`): sheet dibuat otomatis; tombol **Salin 7 data ke sheet** saat sheet kosong; **Tambah DC mobile** / **Edit** (tabel & pop-up detail) menyimpan ke sheet (ID baru `DCM-xxx`); foto per unit diunggah ke subfolder Drive (default folder `FOTO DC MOBILE` di dalam folder foto alat berat, bisa diganti lewat Script Property `DCM_PHOTO_FOLDER_ID`). Modul dashboard: `alat-export-db.js` (aktif bila `alatPage({ db: { kind, sheet } })`).

### HV Test (Alat Berat & Alat Bantu)
- Terhubung ke sheet baru **`7. ALAT HV TEST (NEW)`** (Apps Script bagian ALAT HV TEST), dibuat otomatis (NO, NAMA ALAT, MEREK, TIPE, KONDISI + dropdown, TAHUN, LOKASI, KETERANGAN, INSTRUKSI KERJA, LINK FOTO, ID FOTO UTAMA, DIPERBARUI). Saat sheet baru kosong, tombol **Salin data ke sheet baru** menyalin isi sheet lama `7. ALAT HV TEST` (termasuk hyperlink instruksi kerja); sheet lama tidak diubah. Baris diidentifikasi dengan nomor baris + nama alat (cegah salah tulis bila sheet berubah).
- Tambah/edit (kondisi NORMAL/ANOMALI/RUSAK, lokasi & keterangan multi-baris, nama file + link instruksi kerja ditulis sebagai hyperlink), foto per alat di subfolder `FOTO HV TEST` (atau Script Property `HV_PHOTO_FOLDER_ID`).
- Data cadangan: `python3 tools/xlsx_hv_test_to_js.py "HV_TEST.xlsx"` → `data/hv-test.js`.

### Filter Minyak (Alat Berat & Alat Bantu)
- Tampilan sama dengan DC Mobile (modul bersama `alat-export.js`, fungsi `alatPage()`), data dari `FILTER_MINYAK_UIT_JBM.xlsx`.
- Memperbarui data: `python3 tools/xlsx_alat_to_js.py "FILTER_MINYAK_UIT_JBM.xlsx" data/filter-minyak.js FILTER_MINYAK` lalu commit.
- **Database Google Sheets `8. FILTER MINYAK (NEW)`** (`EQ_CFG.fm`): sama seperti DC Mobile — salin 9 data awal, tambah/edit (ID baru `FM-xxx`), foto per unit di subfolder `FOTO FILTER MINYAK` (atau Script Property `FM_PHOTO_FOLDER_ID`).
- Menu baru dengan format export aplikasi alat yang sama cukup: buat file data dengan perintah di atas, tambah `<section id="page-xx" class="page"></section>`, item menu, entri `PAGES` di `app.js`, dan satu baris `alatPage({...})` di akhir `alat-export.js`.

### Alat Berat (Google Sheets "3. ALAT BERAT (NEW)")
- Database live di sheet **`3. ALAT BERAT (NEW)`** pada spreadsheet DATABASE ALAT BERAT UIT JBM, lewat Apps Script yang sama dengan Trafo Mobile (`apps-script/Code.gs`, bagian ALAT BERAT). Sheet dibuat otomatis (header, dropdown validasi, format teks).
- **Pertama kali:** halaman Alat Berat menampilkan tombol **Salin 52 data ke sheet** (butuh kode akses edit) untuk mengisi sheet dari export WARNOTO.
- **Tambah alat** / **Edit** (tabel atau pop-up detail) menyimpan ke sheet; ID baru otomatis `HE-xxx`. Kondisi (Baik / Perlu Service / Rusak), kelayakan, ketersediaan (Tersedia / Dipinjam), surat izin (Tidak ada / Ada / Perlu perpanjangan) + masa berlaku → status Berlaku/Kedaluwarsa dihitung otomatis.
- **Foto per alat** diunggah dari form Edit ke folder Google Drive `AB_PHOTO_ROOT_ID` (subfolder per alat, link di kolom LINK FOTO); bisa pilih **foto utama** dan hapus. Tanpa foto Drive, dipakai thumbnail dari export WARNOTO (`assets/alat-berat/`).
- Tanggal **Diperbarui** = perubahan terakhir (dashboard atau edit langsung di sheet lewat `onEdit`).
- Tanpa koneksi Apps Script, halaman memakai data statis `data/alat-berat.js` (dibuat `python3 tools/xlsx_alat_berat_to_js.py "Alat_Berat_UIT-JBM_<tanggal>.xlsx"`).

### CUI Jarvis (Climb Up Inspection)
- Menu **CUI Jarvis** (grup Inspeksi Transmisi) menampilkan hasil inspeksi tower dari export Jarvis: filter UPT/ULTG/penghantar/tanggal/cari, ringkasan (tower diinspeksi, tower dengan temuan, temuan kritis, korosi P1/P2/P3, temuan lain), grafik per UPT & progres mingguan, **kondisi per item inspeksi** per bagian tower (klik segmen untuk memfilter), **rekap per penghantar** (bisa diurutkan), dan **tabel data per klem** dengan pop-up detail.
- Item Bottom Section, Mid Section (ROW), dan Earth Wire dihitung **per tower** (nilainya sama untuk semua klem di tower tersebut); item Top Section Fasa dihitung **per klem**.
- Pengelompokan keparahan: *Kritis* = PECAH, RANTAS, RETAK, KRITIS; *Korosi P1/P2/P3* sesuai nilai; *Temuan lain* = nilai bukan normal lainnya (KOTOR, TIDAK ADA, TIDAK STANDAR, BAHAYA, HILANG, dll.).
- **Memperbarui data (permanen, tanpa commit):** klik **Unggah file export Jarvis** → pilih file `.xls` dari Jarvis → masukkan kode akses edit (sama dengan Trafo Mobile) → **Simpan permanen**. Apps Script (`apps-script/Code.gs`, aksi `cui_upload`) menyimpan:
  - file asli + data ringkas `CUI_JARVIS_<tanggal_jam>.json` di folder Google Drive CUI Jarvis (`CUI_ROOT_ID`, bisa diganti lewat Script Property `CUI_FOLDER_ID`);
  - isi data terbaru ke sheet **CUI JARVIS DATA** (ditimpa setiap unggahan);
  - catatan unggahan ke sheet **CUI JARVIS UPLOAD** (riwayat, tidak dihapus).
  Kedua sheet berada di spreadsheet khusus **database CUI Jarvis** (`CUI_SPREADSHEET_ID` = `1ZZIjI52Ea2Pg-LslfUGBvaHyqQLMDsf3JXkhIY4VPgc`, bisa diganti lewat Script Property `CUI_SPREADSHEET_ID`), terpisah dari spreadsheet Trafo Mobile; dibuat otomatis saat unggahan pertama. Akun pemilik Apps Script harus punya akses **Editor** ke spreadsheet tersebut. Setelah menempel `Code.gs` baru, jalankan sekali fungsi **`izinkanAkses`** dari editor Apps Script (pilih fungsi → **Run** → izinkan), lalu deploy **New version** — tanpa ini muncul error *You do not have permission to call DriveApp…*.
  Dashboard selalu membaca unggahan terakhir (`GET ?action=cui`) untuk semua pengguna; tanggal **Diperbarui** = tanggal unggah. Daftar unggahan bisa dilihat lewat tautan **Riwayat unggahan**. Tombol **Lihat saja** menampilkan file hanya di browser tanpa menyimpan.
- Data bawaan `data/cui-jarvis.js` saat ini **dikosongkan** (`window.CUI_JARVIS = null`); halaman menampilkan "Belum ada data CUI" sampai ada unggahan. Untuk mengisi data bawaan (dipakai bila Apps Script belum diatur / belum ada unggahan): `python3 tools/jarvis_to_js.py "Jarvis_per_<tanggal>.xls" [--tanggal YYYY-MM-DD]` lalu commit `data/cui-jarvis.js`.
- Kartu ringkasan dapat diklik untuk pop-up detail: rincian per UPT/ULTG & tipe tower, daftar tower bertemuan (urut terparah), rekap & lokasi temuan kritis / korosi P1 (dengan matriks P1–P3) / temuan lain. Baris di pop-up membuka detail klem.
