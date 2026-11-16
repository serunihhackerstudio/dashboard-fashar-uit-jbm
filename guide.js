/* =========================================================
   MENU PANDUAN — cara memakai dashboard + sumber data tiap menu.
   Menu yang disembunyikan (config.js hiddenPages) tidak ikut ditampilkan.
   ========================================================= */
(function () {
  const sec = $("#page-panduan");
  if (!sec) return;
  const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const hid = id => window.isPageHidden && window.isPageHidden(id);
  const IC = {
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    cui: '<path d="M12 2 7 22M12 2l5 20M8.5 8h7M7.5 13h9"/><circle cx="18" cy="18" r="3"/><path d="m20.2 20.2 1.8 1.8"/>',
    tower: '<path d="M12 3v18M5 8l7-5 7 5M7 13h10M5 21h14"/>',
    trafodb: '<rect x="3" y="9" width="13" height="8" rx="1.5"/><path d="M16 12h3l2 3v2h-5M7 20a1.5 1.5 0 1 0 0-.01M17 20a1.5 1.5 0 1 0 0-.01M7 9V6M12 9V6"/>',
    dcm: '<rect x="3" y="7" width="14" height="10" rx="2"/><path d="M17 10h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2M9 9.5 7.5 12H11l-1.5 2.5"/>',
    alat: '<path d="M4 21h9M7 21V4l12 3.5M7 4 4 8M19 7.5V14"/><path d="M17 14h4v3h-4z"/>',
    fm: '<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z"/><path d="M9 14h6M10 17h4"/>',
    hv: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    ao: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    health: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    jar: '<path d="M12 2 7 22M12 2l5 20M8.5 8h7M7.5 13h9M6.5 18h11"/>',
    gi: '<path d="M4 20h16M6 20V9h12v11M9 9V5h6v4M9 13h2M13 13h2M9 16.5h2M13 16.5h2"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13M8 7h7M8 11h5"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
    cam: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
    layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M13 9h5M13 13h5"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',
    drive: '<path d="M8 3h8l6 10-4 7H6l-4-7 6-10Z"/><path d="M8 3l6 10h8M2 13h12l-4 7"/>',
    app: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
    file: '<path d="M14 3H6v18h12V7l-4-4Z"/><path d="M14 3v4h4M9 13h6M9 17h4"/>',
    screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    map: '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z"/><path d="M9 4v14M15 6v14"/>'
  };
  const ic = k => svg(IC[k] || IC.help);

  /* Rantai sumber data: [jenis ikon, judul, keterangan] */
  const flow = steps => `<div class="gd-flow">${steps.map(([k, t, d], i) => `${i ? `<span class="gd-arrow" aria-hidden="true">${svg('<path d="M5 12h14M13 6l6 6-6 6"/>')}</span>` : ""}
    <div class="gd-node"><span class="gd-node-ic">${ic(k)}</span><b>${t}</b><small>${d}</small></div>`).join("")}</div>`;
  const steps = L => `<ol class="gd-steps">${L.map(x => `<li>${x}</li>`).join("")}</ol>`;
  const bullets = L => `<ul class="gd-list">${L.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const kbd = t => `<span class="gd-btn">${t}</span>`;

  /* ---------- Isi panduan per menu ---------- */
  const MENUS = [
    { id: "home", g: "Umum", t: "Beranda", tone: "primary", sum: "Halaman pertama: sapaan, angka sorotan, dan pintu masuk ke semua menu.",
      use: ["Melihat ringkasan cepat seluruh dashboard (jumlah menu, komponen trafo mobile, tower CUI, unit DC mobile & filter minyak, alat berat).", "Membuka menu lain lewat kartu fitur yang dikelompokkan per bidang."],
      how: [`Klik kartu fitur mana pun (tombol ${kbd("Buka →")}) untuk masuk ke menu tersebut.`, "Label <b>Live</b> pada kartu berarti angkanya dibaca langsung dari Google Sheets saat halaman dibuka.", "Angka sorotan ikut berubah otomatis begitu data di menu asalnya berubah."],
      src: [["screen", "Semua menu", "Angka diambil dari data tiap menu"], ["home", "Beranda", "Ringkasan otomatis"]],
      srcNote: "Beranda tidak punya data sendiri — semua angka dirangkum dari menu lain, jadi sumbernya sama dengan sumber masing-masing menu." },

    { id: "health", g: "Kondisi Aset", t: "Health Index", tone: "violet", sum: "Sebaran prioritas temuan (P1–P3) aset jaringan & gardu induk.",
      use: ["Melihat jumlah temuan prioritas per kategori aset."], how: ["Arahkan kursor ke grafik untuk melihat angka rinci."],
      src: [["file", "Data asesmen", "Rekap health index"], ["screen", "Dashboard", "Data statis"]], srcNote: "Data statis bawaan dashboard." },
    { id: "jar", g: "Kondisi Aset", t: "Asesmen JAR", tone: "violet", sum: "Health index aset jaringan transmisi per UPT.",
      use: ["Membandingkan kondisi aset jaringan antar-UPT."], how: ["Arahkan kursor ke grafik untuk melihat angka rinci."],
      src: [["file", "Data asesmen", "Rekap per UPT"], ["screen", "Dashboard", "Data statis"]], srcNote: "Data statis bawaan dashboard." },
    { id: "gi", g: "Kondisi Aset", t: "Asesmen GI", tone: "violet", sum: "Health index aset gardu induk per UPT.",
      use: ["Membandingkan kondisi aset gardu induk antar-UPT."], how: ["Arahkan kursor ke grafik untuk melihat angka rinci."],
      src: [["file", "Data asesmen", "Rekap per UPT"], ["screen", "Dashboard", "Data statis"]], srcNote: "Data statis bawaan dashboard." },

    { id: "cui", g: "Inspeksi Transmisi", t: "CUI Jarvis", tone: "primary", sum: "Hasil Climb Up Inspection (CUI) tower transmisi dari aplikasi Jarvis.",
      use: ["Memantau jumlah tower yang sudah diinspeksi, tower bertemuan, temuan kritis, dan korosi P1/P2/P3.", "Melihat kondisi per item inspeksi per bagian tower, rekap per penghantar, sampai data per klem."],
      how: ["Saring data dengan filter <b>UPT / ULTG / penghantar / tanggal</b> atau kotak cari di bagian atas.", "Klik <b>kartu ringkasan</b> untuk pop-up rincian (daftar tower bertemuan, lokasi temuan kritis, matriks korosi P1–P3).", "Klik segmen pada grafik <b>kondisi per item inspeksi</b> untuk memfilter tabel.", "Klik baris tabel untuk melihat detail satu klem.",
        `<b>Memperbarui data:</b> klik ${kbd("Unggah file export Jarvis")} → pilih file <code>.xls</code> hasil export Jarvis → masukkan kode akses edit → ${kbd("Simpan permanen")}. Data langsung terlihat oleh semua pengguna.`,
        `Ingin melihat file tanpa menyimpan? Pilih ${kbd("Lihat saja")} — data hanya tampil di browser Anda.`, `Daftar unggahan sebelumnya bisa dilihat lewat tautan ${kbd("Riwayat unggahan")}.`],
      terms: [["Kritis", "PECAH, RANTAS, RETAK, KRITIS"], ["Korosi P1/P2/P3", "Tingkat korosi sesuai nilai inspeksi"], ["Temuan lain", "KOTOR, TIDAK ADA, TIDAK STANDAR, BAHAYA, HILANG, dll."]],
      src: [["app", "Aplikasi Jarvis", "Export hasil CUI (.xls)"], ["file", "Unggah di dashboard", "Kode akses edit"], ["drive", "Google Drive", "Folder CUI Jarvis: file asli + data ringkas"], ["sheet", "Google Sheets", "Spreadsheet database CUI Jarvis: sheet CUI JARVIS DATA & CUI JARVIS UPLOAD"], ["screen", "Dashboard", "Selalu menampilkan unggahan terakhir"]],
      srcNote: "Tanggal <b>Diperbarui</b> = tanggal unggahan terakhir. Item Bottom/Mid Section & Earth Wire dihitung per tower; item Top Section Fasa dihitung per klem." },

    { id: "tower", g: "Peralatan ERS", t: "Tower Emergency", tone: "p2", sum: "Ketersediaan & inventaris tower emergency (ERS).",
      use: ["Menu ini <b>sedang dalam pemeliharaan</b> (under maintenance) dan akan segera kembali dengan data terbaru."], how: ["Untuk sementara belum ada yang perlu dioperasikan di menu ini."],
      src: [["screen", "Dashboard", "Halaman under maintenance"]], srcNote: "Sumber data akan diinformasikan setelah menu aktif kembali." },

    { id: "trafodb", g: "Peralatan ERS", t: "Trafo Mobile", tone: "p2", sum: "Data komponen trafo mobile per trailer: lokasi, kondisi, foto, dan riwayat perpindahan.",
      use: ["Melihat lokasi penempatan trafo mobile di peta dan daftar komponennya.", "Menambah/mengedit komponen, mengunggah foto, dan mencatat perpindahan lokasi beserta dokumen BA mobilisasi."],
      how: ["Klik titik/lokasi di <b>peta</b> untuk menyaring komponen di gardu induk tersebut; tombol " + kbd("Semua lokasi") + " mengembalikan tampilan.", "Gunakan kotak cari (komponen, serial number, merk, lokasi) serta filter lokasi & status.", `Tombol ${kbd("Detail")} menampilkan seluruh informasi komponen, foto, dan timeline riwayat lokasi.`,
        `${kbd("Tambah komponen")} / ${kbd("Edit komponen")}: isi form → masukkan kode akses edit → ${kbd("Simpan")}. UPT & gardu induk dipilih dari daftar; nama aset terbentuk otomatis.`,
        "Saat UPT/gardu induk diubah, isi <b>Perpindahan lokasi</b> (tanggal, alasan, BA). Bisa memindahkan seluruh set sekaligus.", "Foto dikelola di form Edit: tambah, ganti, beri keterangan, atau hapus. Klik foto untuk memperbesar."],
      src: [["sheet", "Google Sheets", "DATABASE ALAT BERAT UIT JBM — sheet 2. TRAFO MOBILE & RIWAYAT LOKASI"], ["drive", "Google Drive", "Folder foto komponen & folder dokumen BA mobilisasi"], ["bolt", "Apps Script", "Penghubung baca/tulis"], ["screen", "Dashboard", "Live; data cadangan bila koneksi gagal"]],
      srcNote: "Tanggal <b>Diperbarui</b> = waktu perubahan data terakhir (dari dashboard maupun edit langsung di sheet). Peta memakai OpenStreetMap; titik gardu induk adalah perkiraan." },

    { id: "dcm", g: "Peralatan ERS", t: "DC Mobile", tone: "p2", sum: "Data unit DC mobile (sistem DC bergerak) per UPT/ULTG.",
      use: ["Melihat jumlah unit, kondisi, status kalibrasi (berlaku / kedaluwarsa / belum), merk & tipe, serta umur unit.", "Menambah/mengedit unit dan foto."],
      how: ["Klik lokasi di <b>peta</b> atau batang <b>grafik sebaran per UPT</b> untuk memfilter.", "Gunakan filter UPT, status kalibrasi, dan kotak cari di atas tabel.", "Klik baris tabel untuk pop-up detail seluruh kolom.", `${kbd("Tambah")} / ${kbd("Edit")} → isi form & foto → masukkan kode akses → ${kbd("Simpan")}.`],
      src: [["app", "Aplikasi alat", "Export DATA DC MOBILE UIT JBM"], ["sheet", "Google Sheets", "DATABASE ALAT BERAT UIT JBM — sheet 4. DC MOBILE (NEW)"], ["drive", "Google Drive", "Subfolder FOTO DC MOBILE"], ["screen", "Dashboard", "Live dari sheet"]],
      srcNote: "Data awal disalin dari file export; setelah itu sheet <b>4. DC MOBILE (NEW)</b> menjadi data utama." },

    { id: "alat", g: "Alat Berat & Alat Bantu", t: "Alat Berat", tone: "p3", sum: "Database kesiapan alat berat UIT JBM: kondisi, kelayakan, ketersediaan, surat izin.",
      use: ["Melihat sebaran alat per lokasi penyimpanan di peta, kondisi (Baik / Perlu Service / Rusak), dan status surat izin.", "Menambah/mengedit alat dan foto."],
      how: ["Klik lokasi di peta atau kartu ringkasan untuk memfilter.", "Pilih tampilan <b>Grid</b> (kartu bergambar) atau <b>List</b> (tabel).", `${kbd("Tambah alat")} / ${kbd("Edit")} → isi form → masukkan kode akses → ${kbd("Simpan")}.`, "Status surat izin <b>Berlaku/Kedaluwarsa</b> dihitung otomatis dari masa berlakunya.", "Di form Edit, pilih foto lalu tentukan <b>foto utama</b>; foto ikut terunggah saat menekan Simpan."],
      src: [["app", "Aplikasi WARNOTO", "Export data alat berat"], ["sheet", "Google Sheets", "DATABASE ALAT BERAT UIT JBM — sheet 3. ALAT BERAT (NEW)"], ["drive", "Google Drive", "Folder foto alat berat (subfolder per alat)"], ["screen", "Dashboard", "Live dari sheet"]],
      srcNote: "Bila belum ada foto di Drive, dashboard memakai gambar dari export WARNOTO." },

    { id: "fm", g: "Alat Berat & Alat Bantu", t: "Filter Minyak", tone: "p3", sum: "Data unit filter minyak trafo UIT JBM.",
      use: ["Melihat jumlah unit, kondisi, status kalibrasi, merk & tipe, dan sebaran per UPT/ULTG.", "Menambah/mengedit unit dan foto."],
      how: ["Cara pakai sama dengan menu DC Mobile: peta, grafik, filter, tabel, dan pop-up detail.", `${kbd("Tambah")} / ${kbd("Edit")} → isi form & foto → masukkan kode akses → ${kbd("Simpan")}.`],
      src: [["app", "Aplikasi alat", "Export FILTER MINYAK UIT JBM"], ["sheet", "Google Sheets", "DATABASE ALAT BERAT UIT JBM — sheet 8. FILTER MINYAK (NEW)"], ["drive", "Google Drive", "Subfolder FOTO FILTER MINYAK"], ["screen", "Dashboard", "Live dari sheet"]],
      srcNote: "Data awal disalin dari file export; setelah itu sheet <b>8. FILTER MINYAK (NEW)</b> menjadi data utama." },

    { id: "hv", g: "Alat Berat & Alat Bantu", t: "HV Test", tone: "p3", sum: "Alat uji tegangan tinggi: kondisi, lokasi, keterangan, dan instruksi kerja.",
      use: ["Melihat kondisi alat (NORMAL / ANOMALI / RUSAK), umur alat, lokasi, dan dokumen instruksi kerja.", "Menambah/mengedit alat dan foto."],
      how: ["Pilih tampilan <b>Grid</b> (kartu bergambar, bawaan) atau <b>List</b> (tabel).", "Klik grafik kondisi/umur atau gunakan pencarian untuk memfilter.", "Klik kartu/baris untuk detail; tautan instruksi kerja langsung membuka dokumennya.", `${kbd("Tambah alat HV test")} / ${kbd("Edit")} → isi form & foto → masukkan kode akses → ${kbd("Simpan")}.`],
      src: [["sheet", "Sheet lama", "7. ALAT HV TEST (disalin sekali)"], ["sheet", "Google Sheets", "DATABASE ALAT BERAT UIT JBM — sheet 7. ALAT HV TEST (NEW)"], ["drive", "Google Drive", "Subfolder FOTO HV TEST"], ["screen", "Dashboard", "Live dari sheet"]],
      srcNote: "Sheet lama tidak diubah; semua perubahan tersimpan di sheet <b>7. ALAT HV TEST (NEW)</b>." },

    { id: "ao", g: "RKAU", t: "AO", tone: "primary", sum: "Monitoring program kerja AO: penyerapan pagu, tahapan, nilai RAB & kontrak.",
      use: ["Memantau progres penyerapan pagu per proker RKAU (pagu, realisasi, sisa, % terserap).", "Melihat posisi tiap program kerja pada 6 tahapan: Penyusunan RAB → Permohonan PA → Proses Kontrak Laksda → Pelaksanaan Pekerjaan → Proses IPMS & VIP → Terbayar."],
      how: ["Klik baris pada <b>Progres penyerapan pagu</b> untuk rincian realisasi per pekerjaan.", "Klik kotak <b>tahapan</b> atau chip filter untuk menyaring program; klik judul kolom tabel untuk mengurutkan.", "Klik baris tabel untuk detail program kerja.",
        `<b>Nilai rupiah & nomor kontrak dirahasiakan</b> (tampil buram). Klik nilai yang buram atau ${kbd("Tampilkan nilai")} → masukkan token akses. Token diingat di komputer itu; ${kbd("Sembunyikan nilai")} memburamkan lagi.`],
      src: [["sheet", "Spreadsheet RKAU", "Sheet MONITORING AO & PROGRES PAGU"], ["bolt", "Apps Script", "Memeriksa token; tanpa token nilai rupiah tidak dikirim"], ["screen", "Dashboard", "Live, hanya baca"]],
      srcNote: "Data AO hanya bisa diubah langsung di spreadsheet RKAU oleh pengelolanya." }
  ].filter(m => !hid(m.id));

  const GROUPS = [...new Set(MENUS.map(m => m.g))];
  const SRC_ROWS = MENUS.filter(m => m.id !== "home");

  const FAQ = [
    ["Data tidak muncul atau terlihat lama", `Klik ${kbd("Muat ulang")} di menu tersebut. Bila tampilan dashboard belum berubah setelah ada pembaruan, tekan <b>Ctrl + F5</b> (Windows) atau <b>Cmd + Shift + R</b> (Mac).`],
    ["Muncul tulisan \"Gagal terhubung\" / \"data cadangan\"", "Dashboard tidak bisa menghubungi Google Sheets (biasanya jaringan). Data yang tampil adalah salinan cadangan terakhir. Coba lagi beberapa saat kemudian."],
    ["\"Kode akses edit salah\"", `Kode yang dimasukkan tidak cocok. Minta kode terbaru ke admin. Kode yang pernah tersimpan di komputer Anda bisa dihapus dengan tautan ${kbd("Lupakan")}.`],
    ["Saya sudah memasukkan kode, kenapa di komputer lain diminta lagi?", "Kode akses dan token disimpan per komputer/browser demi keamanan. Di komputer atau browser lain, kode perlu dimasukkan satu kali lagi."],
    ["Foto tidak tampil", "Foto disimpan di Google Drive; pastikan jaringan bisa membuka Google Drive. Foto yang baru diunggah kadang perlu beberapa detik sebelum tampil."],
    ["Apakah mengubah data di dashboard juga mengubah spreadsheet?", "Ya. Untuk menu yang terhubung Google Sheets (Trafo Mobile, DC Mobile, Alat Berat, Filter Minyak, HV Test, CUI Jarvis), perubahan yang disimpan langsung tertulis ke spreadsheet dan terlihat oleh semua pengguna."],
    ["Bolehkah mengedit langsung di spreadsheet?", "Boleh. Perubahan di spreadsheet akan tampil di dashboard saat halaman dimuat ulang. Hindari mengubah judul kolom dan nama sheet agar dashboard tetap bisa membacanya."],
    ["Bagaimana membagikan kode akses/token?", "Hanya bagikan ke petugas yang berwenang, secara langsung/pribadi. Jangan menuliskannya di grup umum, tangkapan layar, atau dokumen bersama."]
  ].filter(([q]) => !hid("ao") || !/token/i.test(q));

  /* Tabel ringkasan sumber data: [asal data, disimpan di, cara memperbarui] */
  const DASH = "Tambah/Edit di dashboard (kode akses) atau langsung di sheet";
  const TABLE = {
    cui: ["Aplikasi Jarvis<small>Export hasil CUI (.xls)</small>", "Spreadsheet database CUI Jarvis<small>Sheet CUI JARVIS DATA & CUI JARVIS UPLOAD + folder Drive CUI Jarvis</small>", "Unggah file export Jarvis di dashboard"],
    tower: ["—", "—", "Menu sedang dalam pemeliharaan"],
    trafodb: ["Data komponen trafo mobile<small>Dikelola petugas</small>", "DATABASE ALAT BERAT UIT JBM<small>Sheet 2. TRAFO MOBILE & RIWAYAT LOKASI + Drive (foto, BA)</small>", DASH],
    dcm: ["Aplikasi alat<small>Export DATA DC MOBILE UIT JBM</small>", "DATABASE ALAT BERAT UIT JBM<small>Sheet 4. DC MOBILE (NEW) + Drive (foto)</small>", DASH],
    alat: ["Aplikasi WARNOTO<small>Export data alat berat</small>", "DATABASE ALAT BERAT UIT JBM<small>Sheet 3. ALAT BERAT (NEW) + Drive (foto)</small>", DASH],
    fm: ["Aplikasi alat<small>Export FILTER MINYAK UIT JBM</small>", "DATABASE ALAT BERAT UIT JBM<small>Sheet 8. FILTER MINYAK (NEW) + Drive (foto)</small>", DASH],
    hv: ["Sheet lama 7. ALAT HV TEST<small>Disalin sekali ke sheet baru</small>", "DATABASE ALAT BERAT UIT JBM<small>Sheet 7. ALAT HV TEST (NEW) + Drive (foto)</small>", DASH],
    ao: ["Spreadsheet RKAU<small>Diisi pengelola anggaran</small>", "Spreadsheet RKAU<small>Sheet MONITORING AO & PROGRES PAGU</small>", "Langsung di spreadsheet RKAU (dashboard hanya baca)"],
    health: ["Data asesmen", "Data statis dashboard", "Oleh admin dashboard"],
    jar: ["Data asesmen", "Data statis dashboard", "Oleh admin dashboard"],
    gi: ["Data asesmen", "Data statis dashboard", "Oleh admin dashboard"]
  };
  const toneVar = t => ({ primary: "var(--primary)", violet: "var(--violet)", p2: "var(--p2)", p3: "var(--p3)" }[t] || "var(--primary)");

  sec.innerHTML = `
   <div class="gd-hero card">
    <div class="gd-hero-txt">
     <span class="gd-kicker">${ic("book")}Panduan penggunaan</span>
     <h2>Cara memakai Dashboard PDKB &amp; FASHAR</h2>
     <p>Pelajari tampilan, cara memfilter, cara menambah &amp; mengedit data, serta <b>dari mana setiap data berasal</b>. Pilih topik di bawah atau ketik kata kunci.</p>
     <div class="search gd-search"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="gdSearch" type="search" placeholder="Cari panduan… mis. foto, kode akses, peta, unggah" aria-label="Cari panduan"></div>
    </div>
    <div class="gd-hero-art" aria-hidden="true">
     <div class="gd-art-card a1">${ic("sheet")}<span>Google Sheets</span></div>
     <div class="gd-art-card a2">${ic("bolt")}<span>Apps Script</span></div>
     <div class="gd-art-card a3">${ic("screen")}<span>Dashboard</span></div>
    </div>
   </div>

   <nav class="gd-toc" aria-label="Daftar isi panduan">
    ${[["gd-mulai", "Mulai cepat", "bolt"], ["gd-tampilan", "Mengenal tampilan", "layout"], ["gd-menu", "Panduan per menu", "book"], ["gd-edit", "Menambah & mengedit data", "key"], ["gd-sumber", "Sumber data", "db"], ["gd-faq", "Tanya jawab", "help"]]
      .map(([id, t, k]) => `<a href="#panduan" data-go="${id}">${ic(k)}${t}</a>`).join("")}
   </nav>

   <section class="gd-sec" id="gd-mulai" data-gd>
    <h3 class="gd-h">${ic("bolt")}Mulai cepat — 4 langkah</h3>
    <div class="gd-quick">
     ${[["Pilih menu", "Klik nama menu di panel kiri (di HP: tombol ☰ di kiri atas). Menu dikelompokkan per bidang."],
        ["Baca ringkasan", "Kartu angka di bagian atas setiap menu merangkum kondisi terkini. Banyak kartu bisa diklik untuk rincian."],
        ["Saring & cari", "Gunakan peta, grafik, chip filter, dan kotak cari untuk menemukan data. Klik baris untuk detail."],
        ["Perbarui bila berwenang", "Tombol Tambah/Edit/Unggah menyimpan langsung ke Google Sheets setelah kode akses dimasukkan."]]
       .map(([t, d], i) => `<div class="gd-qcard" style="--d:${i * 70}ms"><span class="gd-qno">${i + 1}</span><b>${t}</b><p>${d}</p></div>`).join("")}
    </div>
   </section>

   <section class="gd-sec" id="gd-tampilan" data-gd>
    <h3 class="gd-h">${ic("layout")}Mengenal tampilan</h3>
    <div class="gd-ui">
     <div class="gd-mock" aria-hidden="true">
      <div class="gd-mock-side"><i class="m-logo"></i><i></i><i class="on"></i><i></i><i></i><i></i><span class="gd-pin p1">1</span></div>
      <div class="gd-mock-main">
       <div class="gd-mock-top"><i class="m-title"></i><i class="m-chip"></i><i class="m-btn"></i><span class="gd-pin p2">2</span><span class="gd-pin p3">3</span></div>
       <div class="gd-mock-kpi"><i></i><i></i><i></i><span class="gd-pin p4">4</span></div>
       <div class="gd-mock-body"><i class="m-map"></i><i class="m-table"></i><span class="gd-pin p5">5</span></div>
      </div>
     </div>
     <ol class="gd-legend">
      <li><span class="gd-pin">1</span><div><b>Menu samping</b><p>Daftar semua menu per kelompok. ${kbd("Ciutkan menu")} di bawah membuat layar lebih lega. Di HP, buka dengan tombol ☰.</p></div></li>
      <li><span class="gd-pin">2</span><div><b>Judul halaman</b><p>Nama kelompok, nama menu, dan keterangan singkat isi menu.</p></div></li>
      <li><span class="gd-pin">3</span><div><b>Chip "Diperbarui" &amp; mode gelap</b><p>Menunjukkan kapan data terakhir berubah (arahkan kursor untuk jam). Tombol bulan/matahari mengganti tema terang/gelap.</p></div></li>
      <li><span class="gd-pin">4</span><div><b>Kartu ringkasan</b><p>Angka utama menu. Kartu yang bisa diklik membuka rincian atau memfilter data.</p></div></li>
      <li><span class="gd-pin">5</span><div><b>Peta, grafik &amp; tabel</b><p>Klik titik peta, batang grafik, atau chip untuk memfilter. Klik baris/kartu untuk pop-up detail. Klik foto untuk memperbesar (bisa di-zoom &amp; digeser).</p></div></li>
     </ol>
    </div>
    <div class="gd-badges">
     <div><span class="chip sync live"><i class="live-dot"></i>Live · Google Sheets</span><p>Data dibaca langsung dari spreadsheet saat halaman dibuka.</p></div>
     <div><span class="chip sync error"><i class="live-dot"></i>Data cadangan</span><p>Koneksi gagal; yang tampil adalah salinan terakhir.</p></div>
     <div><span class="gd-spin" aria-hidden="true"></span><p><b>Memuat data…</b> Tunggu sebentar sampai data selesai dimuat.</p></div>
     ${hid("ao") ? "" : `<div><span class="gd-blur">Rp 000.000.000</span><p>Nilai dirahasiakan. Klik lalu masukkan token untuk melihatnya.</p></div>`}
    </div>
   </section>

   <section class="gd-sec" id="gd-menu" data-gd>
    <h3 class="gd-h">${ic("book")}Panduan per menu</h3>
    <p class="muted gd-lead">Klik salah satu menu untuk membuka panduannya. Setiap panduan berisi kegunaan, langkah pemakaian, dan alur sumber datanya.</p>
    ${GROUPS.map(g => `<div class="gd-group"><h4>${esc(g)}</h4>
      ${MENUS.filter(m => m.g === g).map(m => `<details class="gd-menu card" id="gd-m-${m.id}" data-gd style="--c:${toneVar(m.tone)}">
        <summary><span class="gd-mic">${ic(m.id)}</span><span class="gd-mt"><b>${esc(m.t)}</b><small>${m.sum}</small></span><span class="gd-chev" aria-hidden="true">${svg('<path d="m6 9 6 6 6-6"/>')}</span></summary>
        <div class="gd-mbody">
         <div class="gd-cols">
          <div><h5>Untuk apa?</h5>${bullets(m.use)}</div>
          <div><h5>Cara memakai</h5>${steps(m.how)}</div>
         </div>
         ${m.terms ? `<h5>Istilah</h5><dl class="gd-terms">${m.terms.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("")}</dl>` : ""}
         <h5>${ic("db")} Sumber data</h5>${flow(m.src)}
         <p class="gd-note">${m.srcNote}</p>
         <a class="btn primary gd-open" href="#${m.id}">Buka menu ${esc(m.t)} ${svg('<path d="M5 12h14M13 6l6 6-6 6"/>')}</a>
        </div></details>`).join("")}</div>`).join("")}
   </section>

   <section class="gd-sec" id="gd-edit" data-gd>
    <h3 class="gd-h">${ic("key")}Menambah &amp; mengedit data</h3>
    <div class="gd-two">
     <div class="card gd-box">
      <h5>Langkah umum</h5>
      ${steps([`Buka menu, lalu klik ${kbd("Tambah …")} untuk data baru atau ${kbd("Edit")} pada baris/kartu/pop-up detail.`,
        "Isi kolom yang diperlukan. Pilihan seperti UPT, gardu induk, dan kondisi tersedia dalam daftar agar penulisan seragam.",
        `Tambahkan foto bila perlu (${kbd("Tambah foto")}). Foto disiapkan dulu dan baru diunggah saat menyimpan.`,
        "Masukkan <b>kode akses edit</b> (hanya pertama kali di komputer ini).",
        `Klik ${kbd("Simpan")}. Tunggu tanda berhasil — data langsung tersimpan ke Google Sheets dan terlihat oleh semua pengguna.`])}
     </div>
     <div class="card gd-box">
      <h5>${ic("key")} Kode akses edit</h5>
      ${bullets(["Siapa pun bisa <b>melihat</b> data; <b>menyimpan perubahan</b> wajib memakai kode akses edit.", "Cukup dimasukkan <b>sekali per komputer/browser</b>. Setelah berhasil menyimpan, kode diingat dan form berikutnya terisi otomatis.", `Di komputer lain, kode harus dimasukkan lagi. Tautan ${kbd("Lupakan")} menghapus kode dari komputer ini (disarankan di komputer umum).`, "Kode akses hanya diberikan oleh admin kepada petugas yang berwenang."])}
      <h5>${ic("cam")} Foto</h5>
      ${bullets(["Foto otomatis diperkecil sebelum diunggah agar cepat.", "Pilih <b>foto utama</b> untuk ditampilkan di kartu.", "Foto disimpan di Google Drive; foto yang dihapus masuk Sampah Drive dan masih bisa dipulihkan admin.", "Klik foto mana pun untuk membuka tampilan besar yang bisa di-zoom."])}
     </div>
    </div>
   </section>

   <section class="gd-sec" id="gd-sumber" data-gd>
    <h3 class="gd-h">${ic("db")}Sumber data</h3>
    <p class="muted gd-lead">Hampir semua data berasal dari aplikasi/berkas resmi, lalu disimpan di Google Sheets &amp; Google Drive sebagai database, dan dibaca dashboard melalui Google Apps Script.</p>
    ${flow([["app", "Aplikasi & berkas", "Jarvis, WARNOTO, export aplikasi alat"], ["sheet", "Google Sheets", "Database utama per menu"], ["drive", "Google Drive", "Foto, dokumen BA, file unggahan"], ["bolt", "Apps Script", "Penghubung aman (cek kode akses)"], ["screen", "Dashboard", "Tampilan untuk semua pengguna"]])}
    <div class="card gd-table-wrap">
     <table class="table gd-table">
      <thead><tr><th>Menu</th><th>Asal data</th><th>Disimpan di</th><th>Cara memperbarui</th></tr></thead>
      <tbody>${SRC_ROWS.map(m => { const T = TABLE[m.id] || ["—", "—", "—"]; return `<tr><td><a href="#${m.id}" class="gd-tlink"><span class="gd-mic sm" style="--c:${toneVar(m.tone)}">${ic(m.id)}</span>${esc(m.t)}</a></td>
        <td>${T[0]}</td><td>${T[1]}</td><td>${T[2]}</td></tr>`; }).join("")}</tbody>
     </table>
    </div>
    <p class="gd-note">Peta memakai latar © OpenStreetMap; posisi gardu induk/ULTG adalah titik perkiraan untuk membantu orientasi.</p>
   </section>

   <section class="gd-sec" id="gd-faq" data-gd>
    <h3 class="gd-h">${ic("help")}Tanya jawab &amp; kendala umum</h3>
    <div class="gd-faq">${FAQ.map(([q, a]) => `<details class="card gd-q" data-gd><summary>${q}<span class="gd-chev" aria-hidden="true">${svg('<path d="m6 9 6 6 6-6"/>')}</span></summary><p>${a}</p></details>`).join("")}</div>
   </section>
   <p class="gd-empty muted" id="gdEmpty" hidden>Tidak ada panduan yang cocok dengan kata kunci tersebut.</p>`;

  /* Navigasi daftar isi (tanpa mengubah hash halaman) */
  sec.addEventListener("click", e => {
    const a = e.target.closest("[data-go]"); if (!a) return;
    e.preventDefault(); const t = document.getElementById(a.dataset.go); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* Pencarian: tampilkan bagian/menu/FAQ yang memuat kata kunci dan buka panelnya */
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  $("#gdSearch").addEventListener("input", e => {
    const q = norm(e.target.value.trim());
    let any = false;
    sec.querySelectorAll("details[data-gd]").forEach(d => {
      const hit = !q || norm(d.textContent).includes(q);
      d.hidden = !hit; if (q) d.open = hit; else d.open = false;
    });
    sec.querySelectorAll(".gd-group").forEach(g => { g.hidden = ![...g.querySelectorAll("details")].some(d => !d.hidden); });
    sec.querySelectorAll("section[data-gd]").forEach(s => {
      const hit = !q || norm(s.textContent).includes(q) && (!s.querySelector("details") || [...s.querySelectorAll("details")].some(d => !d.hidden) || norm([...s.childNodes].filter(n => !(n.matches && n.matches(".gd-group, .gd-faq"))).map(n => n.textContent).join(" ")).includes(q));
      s.hidden = !hit; if (hit) any = true;
    });
    $("#gdEmpty").hidden = any;
  });

  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  window.PAGE_UPDATED.panduan = () => ({ label: `Panduan · ${MENUS.length} menu`, title: "Panduan penggunaan dashboard" });
  if (location.hash === "#panduan" && typeof setUpdated === "function") setUpdated("panduan");
})();
