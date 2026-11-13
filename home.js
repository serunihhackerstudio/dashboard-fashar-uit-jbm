/* =========================================================
   BERANDA — ringkasan semua fitur dashboard
   Angka diambil dari data yang sudah dimuat halaman lain (Trafo Mobile live,
   CUI Jarvis dari Google Drive, DC Mobile, Filter Minyak, Alat Berat, Health Index).
   ========================================================= */
(function () {
  if (!$("#page-home")) return;
  const n = v => (typeof v === "number" ? fmt(v) : v);
  const sumAll = rows => rows.reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0);
  const p1Of = rows => rows.reduce((a, r) => a + r[0], 0);

  /* Kelompok menu (warna aksen per grup, sama urutan dengan sidebar) */
  const GROUPS = [
    { key: "kondisi", label: "Kondisi Aset", tone: "violet", desc: "Pantau kesehatan aset jaringan & gardu induk" },
    { key: "inspeksi", label: "Inspeksi Transmisi", tone: "blue", desc: "Hasil climb up inspection tower dari Jarvis" },
    { key: "ers", label: "Peralatan ERS", tone: "orange", desc: "Kesiapan peralatan emergency restoration" },
    { key: "alat", label: "Alat Berat & Alat Bantu", tone: "green", desc: "Inventaris & kesiapan alat kerja" },
    { key: "rkau", label: "RKAU", tone: "violet", desc: "Monitoring program kerja & anggaran" }
  ];

  /* Kartu fitur: id halaman, grup, ikon (path svg), judul, deskripsi, statistik ringkas */
  function features() {
    const D = typeof DATA !== "undefined" ? DATA : {}, hj = D.healthJar || [], hg = D.healthGI || [];
    const tdb = typeof TDB !== "undefined" ? TDB : { rows: [] }, tRows = tdb.rows || [];
    const tSt = s => tRows.filter(r => String(r.status || "").toUpperCase() === s).length;
    const cui = window.CUI_SUMMARY ? window.CUI_SUMMARY() : null;
    const dcm = (window.DC_MOBILE && window.DC_MOBILE.rows) || [], fm = (window.FILTER_MINYAK && window.FILTER_MINYAK.rows) || [];
    const kal = (rows, re) => rows.filter(r => re.test(String(r.kalibrasi || ""))).length;
    const hv = window.HV_SUMMARY ? window.HV_SUMMARY() : null;
    const ao = window.AO_SUMMARY ? window.AO_SUMMARY() : null;
    const ab = ((window.ALAT_BERAT || window.ALAT_BERAT_DUMMY) || {}).alat || [];
    const tw = (D.towerKpi || []).map(x => x[1]);
    return [
      { id: "health", g: "kondisi", ic: '<path d="M3 12h4l2-5 4 10 2-5h6"/>', t: "Health Index", d: "Sebaran prioritas temuan P1–P3 aset jaringan & gardu induk per kategori.",
        s: [["Temuan JAR", sumAll(hj)], ["Temuan GI", sumAll(hg)], ["P1", p1Of(hj) + p1Of(hg)]] },
      { id: "jar", g: "kondisi", ic: '<path d="M12 2 7 22M12 2l5 20M8.5 8h7M7.5 13h9M6.5 18h11"/>', t: "Asesmen JAR", d: "Health index aset jaringan transmisi per UPT.", s: [["UPT", 6], ["Kategori", 4]] },
      { id: "gi", g: "kondisi", ic: '<path d="M4 20h16M6 20V9h12v11M9 9V5h6v4M9 13h2M13 13h2M9 16.5h2M13 16.5h2"/>', t: "Asesmen GI", d: "Health index aset gardu induk per UPT.", s: [["UPT", 6], ["Kategori", 4]] },
      { id: "cui", g: "inspeksi", ic: '<path d="M12 2v20M7 22l5-13 5 13M8 6h8M6 10h12"/>', t: "CUI Jarvis", d: "Kondisi tower, isolator, konduktor & earth wire hasil inspeksi; unggah export Jarvis tersimpan permanen.",
        s: cui && cui.klem ? [["Tower", cui.tower], ["Klem", cui.klem], ["Kritis", cui.kritis]] : [["Status", cui && cui.loading ? "Memuat…" : "Belum ada data"]] },
      { id: "tower", g: "ers", ic: '<path d="M12 3v18M5 8l7-5 7 5M7 13h10M5 21h14"/>', t: "Tower Emergency", d: "Ketersediaan & inventaris tower emergency (ERS). Halaman sedang dalam pengembangan.", pending: "Under maintenance",
        s: [] },
      { id: "trafodb", g: "ers", ic: '<rect x="3" y="9" width="13" height="8" rx="1.5"/><path d="M16 12h3l2 3v2h-5M7 20a1.5 1.5 0 1 0 0-.01M17 20a1.5 1.5 0 1 0 0-.01M7 9V6M12 9V6"/>', t: "Trafo Mobile",
        d: "Database trafo mobile per trailer: peta lokasi, edit langsung ke Google Sheets, foto, riwayat pindah & BA.", live: !!tdb.live,
        s: [["Komponen", tRows.length], ["Operasi", tSt("OPERASI")], ["Standby", tSt("STANDBY")], ["Rusak", tSt("RUSAK")]] },
      { id: "dcm", g: "ers", ic: '<rect x="3" y="7" width="14" height="10" rx="2"/><path d="M17 10h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2M9 9.5 7.5 12H11l-1.5 2.5"/>', t: "DC Mobile",
        d: "Unit sistem DC bergerak per UPT/ULTG beserta status kalibrasi.", s: [["Unit", dcm.length], ["Kedaluwarsa", kal(dcm, /EXPIRED/i)], ["Belum kalibrasi", kal(dcm, /BELUM/i)]] },
      { id: "alat", g: "alat", ic: '<path d="M4 21h9M7 21V4l12 3.5M7 4 4 8M19 7.5V14"/><path d="M17 14h4v3h-4z"/>', t: "Alat Berat", d: "Database kesiapan crane, forklift, manlift & alat pendukung lengkap dengan peta lokasi.", pending: window.ALAT_BERAT ? "" : "Menunggu sinkronisasi WARNOTO", src: window.ALAT_BERAT ? "Data WARNOTO" : "",
        s: [["Alat", ab.length], ["Lokasi", new Set(ab.map(a => a.lokasi)).size]] },
      { id: "fm", g: "alat", ic: '<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z"/><path d="M9 14h6M10 17h4"/>', t: "Filter Minyak", d: "Unit filter minyak trafo per UPT/ULTG dan status kalibrasinya.",
        s: [["Unit", fm.length], ["Kalibrasi aktif", kal(fm, /AKTIF|BERLAKU/i)], ["Kedaluwarsa", kal(fm, /EXPIRED/i)]] },
      { id: "hv", g: "alat", ic: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>', t: "HV Test", d: "Alat uji tegangan tinggi: kondisi, lokasi, keterangan & instruksi kerja, terhubung ke sheet 7. ALAT HV TEST (NEW).",
        live: hv && hv.live, s: hv ? [["Alat", hv.total], ["Normal", hv.normal], ["Anomali / rusak", hv.anomali + hv.rusak]] : [] }
      ,{ id: "ao", g: "rkau", ic: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', t: "AO", d: "Monitoring program kerja AO: nilai RAB vs kontrak, serapan anggaran, dan progres tahapan. Nilai rupiah dibuka dengan token.",
        live: ao && ao.live, s: ao ? [["Program", ao.n], ["Nilai kontrak", ao.rpShort(ao.kontrak)], ["Terbayar", ao.paid]] : [] }
    ];
  }

  function greet() {
    const h = new Date().getHours();
    return h < 11 ? "Selamat pagi" : h < 15 ? "Selamat siang" : h < 18 ? "Selamat sore" : "Selamat malam";
  }
  const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;

  function render() {
    const F = features(), byG = g => F.filter(f => f.g === g);
    const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const tdb = F.find(f => f.id === "trafodb"), cui = F.find(f => f.id === "cui"), hi = F.find(f => f.id === "health");
    const dcm = F.find(f => f.id === "dcm"), fm = F.find(f => f.id === "fm"), ab = F.find(f => f.id === "alat");
    const hl = [
      ["Menu fitur", F.length, "grid", "Dalam 4 kelompok"],
      ["Temuan P1 aset", hi.s[2][1], "alert", "Health Index JAR + GI"],
      ["Komponen trafo mobile", tdb.s[0][1], "truck", tdb.live ? "Live dari Google Sheets" : "Data statis"],
      ["Tower terinspeksi CUI", cui.s[0][0] === "Tower" ? cui.s[0][1] : "—", "tower", cui.s[0][0] === "Tower" ? "Dari unggahan Jarvis terakhir" : "Unggah file export Jarvis"],
      ["Unit DC mobile & filter minyak", dcm.s[0][1] + fm.s[0][1], "pulse", `${dcm.s[0][1]} DC mobile · ${fm.s[0][1]} filter minyak`],
      ["Alat berat & bantu", ab.s[0][1], "wrench", `${ab.s[1][1]} lokasi penyimpanan`]
    ];
    $("#page-home").innerHTML = `
      <div class="home-hero">
        <div class="hh-text">
          <span class="hh-kicker"><i class="live-dot"></i>${esc(today)}</span>
          <h2>${greet()}, Tim <span>PDKB &amp; FASHAR</span></h2>
          <p>Satu dashboard untuk memantau kondisi aset, hasil inspeksi transmisi, kesiapan peralatan ERS, serta alat berat &amp; alat bantu HARTRANS Unit Induk Transmisi Jawa Bagian Timur dan Bali.</p>
          <div class="hh-cta">
            <a class="btn hh-btn-primary" href="#health">${svg('<path d="M3 12h4l2-5 4 10 2-5h6"/>')}Lihat Health Index</a>
            <a class="btn hh-btn-ghost" href="#trafodb">${svg('<rect x="3" y="9" width="13" height="8" rx="1.5"/><path d="M16 12h3l2 3v2h-5"/>')}Trafo Mobile</a>
            <a class="btn hh-btn-ghost" href="#cui">${svg('<path d="M12 2v20M7 22l5-13 5 13M8 6h8"/>')}CUI Jarvis</a>
          </div>
        </div>
        <figure class="hh-photo"><img src="assets/logo-tim.jpg" alt="Tim PDKB &amp; FASHAR HARTRANS UIT JBM"><figcaption>Tim PDKB &amp; FASHAR · HARTRANS UIT JBM</figcaption></figure>
        <span class="hh-orb o1"></span><span class="hh-orb o2"></span>
      </div>

      <div class="home-hl">${hl.map(([l, v, ic, sub], i) => `<div class="card hl-card" style="--d:${i * 60}ms"><div class="hl-ic">${ic === "grid" ? svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>') : icon(ic)}</div>
        <div><div class="hl-v">${n(v)}</div><div class="hl-l">${esc(l)}</div><div class="hl-s">${esc(sub)}</div></div></div>`).join("")}</div>

      ${GROUPS.map(G => `<section class="home-group tone-${G.tone}">
        <div class="hg-head"><h3>${esc(G.label)}</h3><p>${esc(G.desc)}</p></div>
        <div class="hg-grid">${byG(G.key).map((f, i) => `<a class="card feat" href="#${f.id}" style="--d:${i * 70}ms" aria-label="Buka ${esc(f.t)}">
          <div class="feat-top"><span class="feat-ic">${svg(f.ic)}</span>${f.live ? `<span class="feat-live"><i class="live-dot"></i>Live</span>` : ""}${f.pending ? `<span class="feat-pending">${esc(f.pending)}</span>` : ""}${f.src ? `<span class="feat-live"><i class="live-dot"></i>${esc(f.src)}</span>` : ""}</div>
          <h4>${esc(f.t)}</h4><p>${esc(f.d)}</p>
          ${f.s.length ? `<div class="feat-stats" style="--n:${f.s.length}">${f.s.map(([l, v]) => `<div><b>${n(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>` : ""}
          <span class="feat-go">Buka ${svg('<path d="M5 12h14M13 6l6 6-6 6"/>')}</span></a>`).join("")}</div>
      </section>`).join("")}

      <div class="card home-tips">
        <div class="ht-ic">${icon("search")}</div>
        <div><h4>Tips cepat</h4><ul>
          <li>Klik kartu ringkasan, bar grafik, atau titik di peta untuk memfilter data dan membuka detail.</li>
          <li>Data <b>Trafo Mobile</b> dan <b>CUI Jarvis</b> tersimpan di Google Sheets/Drive — perubahan langsung terlihat oleh semua pengguna.</li>
          <li>Gunakan tombol bulan/matahari di kanan atas untuk mode gelap, dan “Ciutkan menu” untuk layar yang lebih lega.</li>
        </ul></div>
      </div>`;
  }

  /* Tanggal "Diperbarui" beranda = tanggal terbaru dari semua menu yang punya tanggal sendiri */
  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  window.PAGE_UPDATED.home = () => {
    const ds = Object.entries(window.PAGE_UPDATED).filter(([k]) => k !== "home").map(([, f]) => { try { return f(); } catch (e) { return null; } })
      .filter(v => v && v.date).map(v => v.date).sort();
    return ds.length ? { date: ds[ds.length - 1], title: "Perubahan data terbaru dari seluruh menu" } : null;
  };
  /* Dipanggil ulang saat beranda dibuka atau data menu lain selesai dimuat */
  window.homeRefresh = () => { if ((location.hash.slice(1) || "home") === "home") { render(); if (typeof setUpdated === "function") setUpdated("home"); } };
  addEventListener("hashchange", window.homeRefresh);
  window.homeRefresh();
})();
