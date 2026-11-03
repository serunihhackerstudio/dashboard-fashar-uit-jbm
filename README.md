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
8. Database Trafo Mobile (data sheet `2. TRAFO MOBILE`, bisa ditambah & diedit)

## Status
Prototype frontend. Data saat ini masih statis/mock berdasarkan dashboard existing.
Integrasi data live Google Sheets akan dilakukan pada tahap berikutnya.

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
- Siapa pun yang membuka dashboard dapat **melihat** data (sama seperti sebelumnya). **Menyimpan** perubahan wajib memasukkan kode akses edit (`EDIT_TOKEN`); kode disimpan di browser hanya selama tab terbuka.
- Tombol **Detail** menampilkan seluruh informasi baris (termasuk informasi aset, tautan dokumentasi, dan riwayat lokasi). Kolom nilai aset, referensi, dan riwayat hanya bisa diubah langsung di Google Sheets.
- **UPT** dan **Gardu induk** dipilih dari daftar GI/GIS UIT JBM (`data/gi-uit-jbm.js`, dibuat dengan `python3 tools/xlsx_to_gi_list.py "LIST_GI_SE_UIT_JBM.xlsx"`); unit di luar UIT JBM bisa diisi manual. **Nama aset** dibentuk otomatis dari pilihan UPT + gardu induk. Bila nama aset berupa sel gabungan, skrip memisahkan sel itu dulu agar baris lain dalam satu set tidak ikut berubah.
- Baris baru ditambahkan di bawah baris data terakhir. Sebelum mengedit, skrip memastikan isi baris belum berubah di spreadsheet (jika berubah, muat ulang halaman).
- Untuk mengganti kode akses, ubah nilai `EDIT_TOKEN` di Script Properties.

### Memperbarui data statis
Data cadangan (dipakai bila Google Sheets tidak terhubung) dibuat dari file xlsx:
```bash
python3 tools/xlsx_to_trafo_db.py "DATABASE_ALAT_BERAT_UIT_JBM.xlsx"
```
