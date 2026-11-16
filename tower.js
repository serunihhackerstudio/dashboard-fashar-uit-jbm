/* =========================================================
   TOWER EMERGENCY (Peralatan ERS) — inventaris TE per lokasi & per NAMA KONTAINER
   Data live : Google Sheets "TOWER EMERGENCY (NEW)" + "TOWER EMERGENCY LOKASI (NEW)" (Apps Script GET ?action=te,
               POST te_seed / te_add / te_update / te_photo_*), foto di Google Drive.
   Data awal : data/tower-emergency.js (tools/sheet_tower_to_js.py) dari spreadsheet Tower Emergency
               (sheet LINDSEY BANGIL, TS BABAT, LINDSEY PACITAN, TS TANDES, TS TANAH LOT, SBB KEBONAGUNG) —
               dipakai sebelum database terisi dan sebagai sumber "Salin data ke sheet".
   ========================================================= */
(function () {
  const sec = $("#page-tower");
  const DOC = window.TOWER_TE;
  if (!sec || !DOC) return;
  const API = typeof TDB_API === "string" ? TDB_API : "";
  const SRC_URL = `https://docs.google.com/spreadsheets/d/${DOC.sheetId}/edit`;
  const DB_SHEET = "TOWER EMERGENCY (NEW)", LOK_SHEET = "TOWER EMERGENCY LOKASI (NEW)";
  const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const MERK_C = { Lindsey: "#1667D9", TS: "#F59E0B", SBB: "#10B981" };
  const KON_C = ["#1667D9", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444", "#0EA5A4"];
  const num = n => (Math.round((n || 0) * 100) / 100).toLocaleString("id-ID");
  const title1 = s => String(s || "").toLowerCase().replace(/(^|[\s/(&-])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bErs\b/g, "ERS").replace(/\bE\.r\.s\./g, "E.R.S.").replace(/\bHpu\b/g, "HPU").replace(/\bOhgw\b/g, "OHGW").replace(/\b(Upt|Ultg|Gis|Gi|Te|Ts|Sbb|Kv)\b/g, m => m.toUpperCase()).replace(/ (And|Of|For|With|Or|The) /g, m => m.toLowerCase());
  const isBad = it => /rusak|tidak lengkap|tidak ada|kurang|karat|hilang|tanpa|tidak memiliki|patah|bengkok/i.test(it.ket || "");
  const q = (a, extra) => `${API}${API.includes("?") ? "&" : "?"}action=${a}${extra || ""}`;
  const BOX = '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>';

  /* ---------- Model data ---------- */
  // data awal dari file (struktur sama dengan respons Apps Script)
  const STATIC = {
    lokasi: DOC.lokasi.map(L => ({ lokasi: L.lokasi, merk: L.merk, sheet: L.sheet, title: L.title, containers: L.containers, lat: L.lat, lng: L.lng, notes: L.notes || [] })),
    rows: DOC.lokasi.flatMap(L => L.items.map(it => ({ lokasi: L.lokasi, merk: L.merk, kat: it.kat, nama: it.nama, part: it.part, ts: it.ts, satuan: it.satuan, q: it.q, total: it.total, ket: it.ket, extra: it.extra, fotoAwal: it.img || "" })))
  };
  let LOK = [], ALL = [];
  function build(model) {
    const coord = Object.fromEntries(STATIC.lokasi.map(x => [x.lokasi, x]));
    LOK = model.lokasi.map((L, li) => ({ ...L, li, key: L.lokasi, color: MERK_C[L.merk] || KON_C[li % KON_C.length],
      lat: L.lat != null && !isNaN(L.lat) ? L.lat : (coord[L.lokasi] || {}).lat, lng: L.lng != null && !isNaN(L.lng) ? L.lng : (coord[L.lokasi] || {}).lng, items: [] }));
    const by = Object.fromEntries(LOK.map(L => [L.lokasi, L]));
    model.rows.forEach(r => {
      let L = by[r.lokasi];
      if (!L) { L = by[r.lokasi] = { lokasi: r.lokasi || "Tanpa lokasi", key: r.lokasi || "Tanpa lokasi", merk: r.merk || "—", sheet: "", title: "", containers: [], notes: [], li: LOK.length, color: "#64748B", items: [] }; LOK.push(L); }
      Object.keys(r.q || {}).forEach(k => { if (!L.containers.includes(k)) L.containers.push(k); }); // kontainer di data tapi belum di daftar lokasi
      L.items.push({ ...r, li: L.li, ii: L.items.length, lok: L.lokasi, kat: title1(r.kat || "Lainnya"), q: r.q || {}, total: Number(r.total) || 0, extra: r.extra || {},
        img: r.fotoUrl || r.fotoAwal || "" });
    });
    ALL = LOK.flatMap(L => L.items);
  }
  build(STATIC);

  const DB = { live: false, updated: null, editing: null, batch: false };
  const S = { lok: "", kon: "", kat: "", q: "", only: "", view: (() => { try { return localStorage.getItem("fashar-te-view") || "grid"; } catch (e) { return "grid"; } })(), page: 1 };
  const PER = 24;
  const curLok = () => LOK.find(L => L.key === S.lok) || null;

  /* ---------- Kerangka halaman ---------- */
  sec.innerHTML = `
   <div class="tdb-bar card ab-bar">
    <div class="tdb-bar-info"><span class="chip sync" id="teSync"></span><span class="muted sm" id="teSyncNote"></span></div>
    <div class="tdb-actions">
     <button class="btn ghost" type="button" id="teReload">${svg('<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/>')}Muat ulang</button>
     <button class="btn primary" type="button" id="teAdd" hidden>${svg('<path d="M12 5v14M5 12h14"/>')}Tambah item</button></div>
   </div>
   <div class="ab-seed card" id="teSeed" hidden></div>
   <div class="ab-kpis te-kpis" id="teKpi"></div>

   <div class="te-top">
    <div class="card te-map-card">
     <div class="card-head"><div><h3>Peta lokasi tower emergency</h3><p>Klik penanda untuk melihat isi lokasi · warna = merek</p></div>
      <div class="te-map-legend" id="teMapLegend"></div></div>
     <div class="tdb-mapwrap te-mapwrap"><div id="teMap" class="alx-map" role="region" aria-label="Peta lokasi tower emergency"></div>
      <p class="muted sm te-map-fb" id="teMapFb" hidden>Peta tidak dapat dimuat.</p></div>
    </div>
    <div class="card te-merk-card">
     <div class="card-head"><div><h3>Komposisi per merek</h3><p>Sebaran kontainer &amp; lokasi tiap merek</p></div></div>
     <div class="card-body" id="teMerk"></div>
    </div>
   </div>

   <div class="te-sec-h"><h3>Lokasi &amp; kontainer</h3><p class="muted">Setiap lokasi berisi satu atau beberapa kontainer (kolom <b>NAMA KONTAINER</b>). Klik kartu lokasi untuk melihat isinya.</p></div>
   <div class="te-loks" id="teLoks"></div>

   <div class="card te-detail" id="teDetail">
    <div class="te-det-head" id="teDetHead"></div>
    <div class="te-kons" id="teKons"></div>
    <div class="te-charts" id="teCharts"></div>
   </div>

   <div class="ab-filters te-filters">
    <div class="ab-chips" id="teKat" role="group" aria-label="Filter kategori"></div>
    <div class="ab-filter-right">
     <div class="ab-chips te-only" role="group" aria-label="Filter khusus">
      <button type="button" class="ab-chip" data-only="ket"><span>Ada catatan</span><em id="teCntKet"></em></button>
      <button type="button" class="ab-chip" data-only="nol"><span>Jumlah 0</span><em id="teCntNol"></em></button>
     </div>
     <div class="search"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="teSearch" type="search" placeholder="Cari item, part no., keterangan…" aria-label="Cari item tower emergency"></div>
     <div class="seg" role="group" aria-label="Tampilan"><button type="button" data-view="grid" title="Tampilan grid">${svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>')}Grid</button><button type="button" data-view="list" title="Tampilan list">${svg('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>')}List</button></div>
    </div>
   </div>
   <p class="muted ab-shown" id="teShown"></p>
   <div id="teItems"></div>
   <div class="te-pager" id="tePager"></div>`;

  document.body.insertAdjacentHTML("beforeend", `<dialog class="modal" id="teDialog" aria-labelledby="teDlgTitle"><div class="modal-wrap">
   <header class="modal-head"><div><h3 id="teDlgTitle"></h3><p id="teDlgSub"></p></div><button class="icon-btn" type="button" onclick="this.closest('dialog').close()" aria-label="Tutup">${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button></header>
   <div class="modal-body" id="teDlgBody"></div>
   <footer class="modal-foot"><div class="modal-btns"><button class="btn ghost" type="button" id="teDlgEdit" hidden>${svg('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m14 6 4 4"/>')}Edit data &amp; foto</button><button class="btn primary" type="button" onclick="this.closest('dialog').close()">Tutup</button></div></footer></div></dialog>

   <dialog class="modal modal-lg" id="teEditDlg" aria-labelledby="teEditTitle">
   <form class="modal-wrap" id="teEditForm" novalidate>
    <header class="modal-head"><div><h3 id="teEditTitle"></h3><p id="teEditSub"></p></div>
     <button class="icon-btn" type="button" onclick="this.closest('dialog').close()" aria-label="Tutup">${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button></header>
    <div class="modal-body">
     <section class="dsec ph-sec ab-ph-sec" id="tePhSec"></section>
     <div class="form-grid">
      <label class="fld"><span>Lokasi <em>*</em></span><select id="te_f_lokasi"></select></label>
      <label class="fld"><span>Kategori</span><input id="te_f_kat" list="teKatList" autocomplete="off"></label>
      <label class="fld wide"><span>Nama item / uraian <em>*</em></span><input id="te_f_nama" autocomplete="off" required></label>
      <label class="fld"><span>Part no.</span><input id="te_f_part" autocomplete="off"></label>
      <label class="fld"><span>Nama TS</span><input id="te_f_ts" autocomplete="off"></label>
      <label class="fld"><span>Satuan</span><input id="te_f_satuan" list="teSatList" autocomplete="off" placeholder="BH / SET / METER"></label>
      <div class="fld wide"><span>Jumlah per kontainer</span><div class="te-qin" id="teQIn"></div><small class="hint" id="teQSum"></small></div>
      <label class="fld wide"><span>Keterangan / kondisi</span><textarea id="te_f_ket" rows="2" placeholder="mis. Kontainer Raung 1 tidak lengkap"></textarea></label>
     </div>
     <datalist id="teKatList"></datalist><datalist id="teSatList"><option value="BH"><option value="SET"><option value="METER"><option value="ROL"><option value="UNIT"></datalist>
    </div>
    <footer class="modal-foot">
     <div class="fld token"><label class="tok-in" id="teTokIn"><span>Kode akses edit</span><input type="password" id="te_token" autocomplete="new-password" placeholder="Kode dari admin"><small class="hint">Cukup sekali — akan diingat di komputer ini.</small></label>
      <p class="token-saved" id="teTokSaved" hidden><svg class="ic xs" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Kode akses tersimpan di komputer ini · <button type="button" class="linkbtn" id="teTokForget">Lupakan</button></p></div>
     <p class="form-err" id="teEditErr" role="alert" hidden></p>
     <div class="modal-btns"><button class="btn ghost" type="button" onclick="this.closest('dialog').close()">Batal</button><button class="btn primary" type="submit" id="teSave">Simpan</button></div>
    </footer></form></dialog>`);

  /* ---------- KPI & komposisi merek ---------- */
  const conArt = c => `<svg class="te-con-art" viewBox="0 0 64 40" aria-hidden="true"><rect x="2" y="6" width="60" height="30" rx="3" fill="${c}"/><path d="M10 10v22M18 10v22M26 10v22M34 10v22M42 10v22M50 10v22" stroke="rgba(255,255,255,.35)" stroke-width="2.4"/><rect x="2" y="6" width="60" height="5" rx="2" fill="rgba(0,0,0,.18)"/><circle cx="56" cy="21" r="1.8" fill="rgba(255,255,255,.8)"/></svg>`;
  function renderKpi() {
    const kon = LOK.reduce((a, L) => a + L.containers.length, 0), ket = ALL.filter(it => it.ket).length, bad = ALL.filter(isBad).length, nol = ALL.filter(it => !it.total).length;
    const merk = [...new Set(LOK.map(L => L.merk))];
    $("#teKpi").innerHTML = [
      ["Lokasi tower emergency", LOK.length, "tower", "primary", `${merk.length} merek: ${merk.join(", ")}`, ""],
      ["Kontainer", kon, "box", "p3", "Sesuai kolom NAMA KONTAINER", ""],
      ["Jenis item", fmt(ALL.length), "doc", "primary", `${new Set(ALL.map(i => i.kat)).size} kategori komponen`, ""],
      ["Item dengan catatan", ket, "alert", "p2", `${bad} indikasi rusak / tidak lengkap`, "ket"],
      ["Item berjumlah 0", nol, "pulse", "p1", "Kosong / dipinjam / belum ada", "nol"]
    ].map(([l, v, ic, t, sub, only]) => `<div class="card kpi tone-${t}${only ? " te-kpi-click" : ""}"${only ? ` data-only="${only}" role="button" tabindex="0" title="Klik untuk menampilkan item"` : ""}><div class="kpi-icon">${ic === "box" ? `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${BOX}</svg>` : icon(ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${esc(sub)}</div></div></div>`).join("");

    // Komposisi per merek: bar bertumpuk + kartu merek dengan ikon kontainer & lokasi yang bisa diklik
    const byM = merk.map(m => { const Ls = LOK.filter(L => L.merk === m); return { m, c: MERK_C[m] || "#64748B", Ls, kon: Ls.reduce((a, L) => a + L.containers.length, 0), it: Ls.reduce((a, L) => a + L.items.length, 0) }; })
      .sort((a, b) => b.kon - a.kon);
    $("#teMerk").innerHTML = `
      <div class="te-mk-total"><div><b>${kon}</b><span>kontainer</span></div><div><b>${LOK.length}</b><span>lokasi</span></div><div><b>${merk.length}</b><span>merek</span></div></div>
      <div class="te-mk-stack" role="img" aria-label="Proporsi kontainer per merek">${byM.map(x => `<i style="flex:${x.kon};background:${x.c}" title="${esc(x.m)}: ${x.kon} kontainer (${Math.round(x.kon / (kon || 1) * 100)}%)"><span>${Math.round(x.kon / (kon || 1) * 100)}%</span></i>`).join("")}</div>
      <div class="te-mk-list">${byM.map(x => `<div class="te-mk" style="--c:${x.c}">
        <div class="te-mk-head"><span class="te-mk-dot"></span><b>${esc(x.m)}</b><span class="te-mk-n">${x.kon}<small>kontainer</small></span></div>
        <div class="te-mk-icons" aria-hidden="true">${x.Ls.flatMap(L => L.containers.map(k => `<span title="${esc(k)} · ${esc(L.lokasi)}">${svg(BOX)}</span>`)).join("")}</div>
        <div class="te-mk-loks">${x.Ls.map(L => `<button type="button" class="te-mk-lok${S.lok === L.key ? " on" : ""}" data-lok="${esc(L.key)}">${esc(L.lokasi)}<em>${L.containers.length}</em></button>`).join("")}</div>
        <small class="te-mk-sub">${x.Ls.length} lokasi · ${fmt(x.it)} jenis item</small></div>`).join("")}</div>`;
    $("#teMapLegend").innerHTML = byM.map(x => `<span><i style="background:${x.c}"></i>${esc(x.m)}</span>`).join("");
  }

  /* ---------- Kartu lokasi ---------- */
  function renderLoks() {
    $("#teLoks").innerHTML = [`<button type="button" class="card te-lok te-lok-all${!S.lok ? " on" : ""}" data-lok="">
        <span class="te-lok-ic">${svg(BOX)}</span>
        <b>Semua lokasi</b><small>${LOK.length} lokasi · ${LOK.reduce((a, L) => a + L.containers.length, 0)} kontainer</small><em>${fmt(ALL.length)} jenis item</em></button>`,
      ...LOK.map(L => { const ket = L.items.filter(it => it.ket).length; return `<button type="button" class="card te-lok${S.lok === L.key ? " on" : ""}" data-lok="${esc(L.key)}" style="--c:${L.color}">
        <span class="te-lok-band"><span class="te-merk-badge">${esc(L.merk)}</span><span class="te-lok-n">${L.containers.length}<small>kontainer</small></span></span>
        <b>${esc(L.lokasi)}</b><small class="te-lok-sub">${esc(title1(L.title))}</small>
        <span class="te-lok-kons">${L.containers.map(k => `<i>${esc(k)}</i>`).join("")}</span>
        <span class="te-lok-stat"><span><b>${fmt(L.items.length)}</b> item</span><span><b>${new Set(L.items.map(i => i.kat)).size}</b> kategori</span>${ket ? `<span class="warn"><b>${ket}</b> catatan</span>` : ""}</span></button>`; })].join("");
  }

  /* ---------- Detail lokasi: kontainer & grafik ---------- */
  function scope() { const L = curLok(); return L ? L.items : ALL; }
  function renderDetail() {
    const L = curLok(), items = scope();
    if (!L) {
      $("#teDetHead").innerHTML = `<div><span class="eyebrow">Ringkasan</span><h3>Semua lokasi tower emergency</h3><p class="muted">Pilih lokasi di peta atau kartu di atas untuk melihat isi tiap kontainer.</p></div>`;
      $("#teKons").innerHTML = `<div class="te-kon-grid">${LOK.map(x => `<button type="button" class="te-kon te-kon-lok" data-lok="${esc(x.key)}" style="--c:${x.color}">${conArt(x.color)}<b>${esc(x.lokasi)}</b><small>${x.containers.map(esc).join(", ")}</small><em>${fmt(x.items.length)} item</em></button>`).join("")}</div>`;
    } else {
      $("#teDetHead").innerHTML = `<div><span class="eyebrow" style="color:${L.color}">${esc(L.merk)}${L.sheet ? ` · sheet ${esc(L.sheet)}` : ""}</span><h3>${esc(L.lokasi)}</h3><p class="muted">${esc(title1(L.title))}${L.title ? " · " : ""}${L.containers.length} kontainer · ${fmt(L.items.length)} jenis item</p></div>
        <button type="button" class="btn ghost" data-lok="">${svg('<path d="M15 6l-6 6 6 6"/>')}Semua lokasi</button>`;
      const per = L.containers.map((k, i) => ({ k, i, n: L.items.filter(it => it.q[k]).length, v: L.items.reduce((a, it) => a + (it.q[k] || 0), 0) }));
      $("#teKons").innerHTML = `<div class="te-kon-grid">${per.map(x => `<button type="button" class="te-kon${S.kon === x.k ? " on" : ""}" data-kon="${esc(x.k)}" style="--c:${KON_C[x.i % KON_C.length]}" aria-pressed="${S.kon === x.k}">
          ${conArt(KON_C[x.i % KON_C.length])}<span class="te-kon-lbl">Kontainer</span><b>${esc(x.k)}</b><em>${x.n} jenis item</em><small>${num(x.v)} total volume</small></button>`).join("")}</div>
        ${L.notes && L.notes.length ? `<div class="te-notes"><b>${svg('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>')}Catatan lokasi</b><ul>${L.notes.map(n => `<li>${esc(String(n).replace(/\n/g, " · "))}</li>`).join("")}</ul></div>` : ""}`;
    }
    const kats = new Map(); items.forEach(it => kats.set(it.kat, (kats.get(it.kat) || 0) + 1));
    const K = [...kats.entries()].sort((a, b) => b[1] - a[1]), mk = Math.max(1, ...K.map(x => x[1]));
    const side = L ? L.containers.map((k, i) => [k, L.items.filter(it => it.q[k]).length, KON_C[i % KON_C.length]]) : LOK.map(x => [x.lokasi, x.items.length, x.color]);
    const ms = Math.max(1, ...side.map(x => x[1]));
    const cond = [["Lengkap / sesuai", items.filter(it => it.total && !it.ket).length, "var(--ok)"], ["Ada catatan", items.filter(it => it.ket && !isBad(it)).length, "var(--p3)"], ["Indikasi rusak / tidak lengkap", items.filter(isBad).length, "var(--p2)"], ["Jumlah 0", items.filter(it => !it.total && !it.ket).length, "var(--p1)"]];
    const ct = cond.reduce((a, x) => a + x[1], 0) || 1;
    let acc = 0;
    $("#teCharts").innerHTML = `
      <div class="te-chart"><h4>Jenis item per kategori</h4><ul class="bars ab-bars">${K.map(([k, v]) => `<li title="${esc(k)}" data-kat="${esc(k)}" class="te-click"><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${v / mk * 100}%;background:var(--primary)"></i></span><b>${v}</b></li>`).join("")}</ul></div>
      <div class="te-chart"><h4>${L ? "Jenis item per kontainer" : "Jenis item per lokasi"}</h4><ul class="bars ab-bars">${side.map(([k, v, c]) => `<li title="${esc(k)}" ${L ? `data-kon="${esc(k)}"` : `data-lok="${esc(k)}"`} class="te-click"><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${v / ms * 100}%;background:${c}"></i></span><b>${v}</b></li>`).join("")}</ul></div>
      <div class="te-chart"><h4>Kondisi data item</h4>
       <div class="te-donut-wrap"><svg viewBox="0 0 42 42" class="te-donut" aria-hidden="true"><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--surface-2)" stroke-width="6"/>${cond.map(([, v, c]) => { const d = v / ct * 100, s = `<circle cx="21" cy="21" r="15.9" fill="none" stroke="${c}" stroke-width="6" stroke-dasharray="${d} ${100 - d}" stroke-dashoffset="${25 - acc}"/>`; acc += d; return s; }).join("")}<text x="21" y="22.5" text-anchor="middle">${fmt(items.length)}</text></svg>
        <ul class="te-legend">${cond.map(([l, v, c]) => `<li><i style="background:${c}"></i>${l}<b>${v}</b></li>`).join("")}</ul></div>
       <p class="muted sm">Berdasarkan isi kolom KETERANGAN dan jumlah item.</p></div>`;
  }

  /* ---------- Daftar item ---------- */
  function filtered(ignoreKat) {
    const qq = S.q.trim().toLowerCase();
    return scope().filter(it => (!S.kon || it.q[S.kon]) && (ignoreKat || !S.kat || it.kat === S.kat) &&
      (!S.only || (S.only === "ket" ? it.ket : !it.total)) &&
      (!qq || [it.id, it.nama, it.part, it.ts, it.ket, it.kat, it.lok, Object.values(it.extra || {}).join(" ")].join(" ").toLowerCase().includes(qq)));
  }
  const qtyPills = it => LOK[it.li].containers.map((k, i) => it.q[k] ? `<span class="te-q" style="--c:${KON_C[i % KON_C.length]}" title="Kontainer ${esc(k)}">${esc(k)} <b>${num(it.q[k])}</b></span>` : "").join("");
  const photo = (it, cls) => it.img ? `<img class="${cls}" src="${esc(it.img)}" alt="${esc(it.nama)}" loading="lazy">` : `<span class="${cls} te-noimg">${svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>')}</span>`;
  function renderItems() {
    const base = filtered(true), L = filtered(false);
    const kc = new Map(); base.forEach(it => kc.set(it.kat, (kc.get(it.kat) || 0) + 1));
    if (S.kat && !kc.has(S.kat)) S.kat = "";
    $("#teKat").innerHTML = [["", "Semua kategori", base.length], ...[...kc.entries()]].map(([v, l, c]) =>
      `<button type="button" class="ab-chip${S.kat === v ? " on" : ""}" data-kat="${esc(v)}" aria-pressed="${S.kat === v}"><span>${esc(v ? v : l)}</span><em>${v ? l : c}</em></button>`).join("");
    const sc = scope();
    $("#teCntKet").textContent = sc.filter(it => it.ket).length; $("#teCntNol").textContent = sc.filter(it => !it.total).length;
    sec.querySelectorAll("[data-only]").forEach(b => { const on = S.only === b.dataset.only; b.classList.toggle("on", on); if (b.tagName === "BUTTON") b.setAttribute("aria-pressed", on); });
    sec.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("on", S.view === b.dataset.view));
    const pages = Math.max(1, Math.ceil(L.length / PER)); S.page = Math.min(S.page, pages);
    const P = L.slice((S.page - 1) * PER, S.page * PER), lokL = curLok(), multi = !lokL;
    $("#teShown").innerHTML = `Menampilkan <b>${L.length}</b> jenis item${lokL ? ` di <b>${esc(lokL.lokasi)}</b>` : " dari semua lokasi"}${S.kon ? ` · kontainer <b>${esc(S.kon)}</b> <button type="button" class="linkbtn" data-kon="${esc(S.kon)}">hapus</button>` : ""}`;
    if (!L.length) { $("#teItems").innerHTML = `<div class="card empty te-empty">Tidak ada item yang cocok dengan filter.</div>`; $("#tePager").innerHTML = ""; return; }
    if (S.view === "grid") {
      $("#teItems").innerHTML = `<div class="te-grid">${P.map(it => `<button type="button" class="card te-item${isBad(it) ? " bad" : ""}" data-it="${it.li}:${it.ii}">
        <span class="te-ph">${photo(it, "te-img")}${it.ket ? `<span class="te-flag" title="${esc(it.ket)}">${svg('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/>')}Catatan</span>` : ""}</span>
        <span class="te-body"><small class="te-kat">${multi ? `${esc(it.lok)} · ` : ""}${esc(it.kat)}</small><b class="te-nm">${esc(it.nama)}</b>${it.part || it.ts ? `<small class="te-part">${esc(it.part || it.ts)}</small>` : ""}
        <span class="te-qs">${qtyPills(it)}</span>
        <span class="te-tot"><b class="${it.total ? "" : "zero"}">${num(it.total)}</b> ${esc(it.satuan || "")}<small>${it.id ? esc(it.id) : "total"}</small></span></span></button>`).join("")}</div>`;
    } else {
      const cons = lokL ? lokL.containers : [];
      $("#teItems").innerHTML = `<div class="card"><div class="table-wrap ab-table te-table"><table class="table"><thead><tr><th></th><th>Item</th>${multi ? "<th>Lokasi</th>" : ""}<th>Kategori</th>${cons.map((k, i) => `<th class="num"><span class="te-th-dot" style="--c:${KON_C[i % KON_C.length]}"></span>${esc(k)}</th>`).join("")}${multi ? "<th>Per kontainer</th>" : ""}<th class="num">Total</th><th>Satuan</th><th>Keterangan</th>${DB.live ? "<th></th>" : ""}</tr></thead><tbody>
        ${P.map(it => `<tr data-it="${it.li}:${it.ii}" tabindex="0"${isBad(it) ? ' class="te-bad"' : ""}><td class="te-tdimg">${photo(it, "te-thumb")}</td><td><b>${esc(it.nama)}</b>${it.part || it.ts ? `<div class="muted sm">${esc(it.part || it.ts)}</div>` : ""}</td>${multi ? `<td class="sm">${esc(it.lok)}</td>` : ""}<td class="sm">${esc(it.kat)}</td>
        ${cons.map(k => `<td class="num">${it.q[k] ? num(it.q[k]) : `<span class="muted">—</span>`}</td>`).join("")}${multi ? `<td><span class="te-qs">${qtyPills(it)}</span></td>` : ""}<td class="num"><b class="${it.total ? "" : "te-zero"}">${num(it.total)}</b></td><td class="sm">${esc(it.satuan || "—")}</td><td class="sm te-ket">${esc(it.ket || "")}</td>${DB.live ? `<td><button type="button" class="btn ghost sm" data-edit="${esc(it.id)}">Edit</button></td>` : ""}</tr>`).join("")}
        </tbody></table></div></div>`;
    }
    $("#tePager").innerHTML = pages > 1 ? `<button type="button" class="btn ghost" data-page="${S.page - 1}" ${S.page <= 1 ? "disabled" : ""}>‹ Sebelumnya</button><span class="muted">Halaman <b>${S.page}</b> dari ${pages}</span><button type="button" class="btn ghost" data-page="${S.page + 1}" ${S.page >= pages ? "disabled" : ""}>Berikutnya ›</button>` : "";
  }

  /* ---------- Pop-up detail item ---------- */
  let DLG = null;
  function openItem(li, ii) {
    const L = LOK[li], it = L && L.items[ii]; if (!it) return;
    DLG = it;
    $("#teDlgTitle").textContent = it.nama;
    $("#teDlgSub").innerHTML = `<span class="te-merk-badge" style="--c:${L.color}">${esc(L.merk)}</span> ${esc(L.lokasi)} · ${esc(it.kat)}${it.id ? ` · ${esc(it.id)}` : ""}`;
    const mx = Math.max(1, ...L.containers.map(k => it.q[k] || 0));
    const dd = (l, v) => `<div><dt>${l}</dt><dd class="${v ? "pre" : "nil"}">${v || "—"}</dd></div>`;
    $("#teDlgBody").innerHTML = `<div class="te-dlg">
      <div class="te-dlg-ph">${it.img ? `<a href="${esc(it.img)}" class="te-zoom" title="Klik untuk memperbesar"><img src="${esc(it.img)}" alt="${esc(it.nama)}"></a><small class="muted">Klik foto untuk memperbesar</small>` : photo(it, "te-img big")}
       <div id="teDlgPh"></div></div>
      <div><dl class="dgrid">${dd("Nama item / uraian", esc(it.nama))}${dd(it.ts && !it.part ? "Nama TS" : "Part no.", esc(it.part || it.ts))}${dd("Satuan", esc(it.satuan))}${dd("Total", `<b>${num(it.total)}</b> ${esc(it.satuan || "")}`)}
        ${Object.entries(it.extra || {}).map(([k, v]) => dd(esc(title1(k)), esc(v))).join("")}</dl>
        <h4 class="te-dlg-h">Jumlah per kontainer</h4>
        <ul class="bars ab-bars">${L.containers.map((k, i) => `<li><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${(it.q[k] || 0) / mx * 100}%;background:${KON_C[i % KON_C.length]}"></i></span><b>${num(it.q[k] || 0)}</b></li>`).join("")}</ul>
        ${it.ket ? `<div class="te-ket-box${isBad(it) ? " bad" : ""}"><b>Keterangan</b><p>${esc(it.ket)}</p></div>` : ""}
        <p class="muted sm">Sumber: ${DB.live ? `sheet <b>${DB_SHEET}</b>${it.diperbarui ? ` · diperbarui ${esc(it.diperbarui)}` : ""}` : `sheet <b>${esc(L.sheet)}</b> · spreadsheet Tower Emergency`}</p></div></div>`;
    $("#teDlgEdit").hidden = !(DB.live && it.id);
    $("#teDialog").showModal();
    if (DB.live && it.id && it.linkFoto) {
      $("#teDlgPh").innerHTML = `<div class="ld-inline"><i class="ld-spin"></i>Memuat foto…</div>`;
      fetch(q("te_photos", `&id=${encodeURIComponent(it.id)}`), { cache: "no-store" }).then(x => x.json()).then(j => {
        const box = $("#teDlgPh"); if (!box || DLG !== it) return;
        const ph = (j.ok && j.photos) || [];
        box.innerHTML = ph.length > 1 || (ph.length && !it.fotoUtama) ? `<div class="ab-det-strip te-strip">${ph.map(p => `<a href="${esc(p.view)}" target="_blank" rel="noopener"><img src="${esc(p.thumb)}" alt="${esc(p.caption || p.name)}" loading="lazy"></a>`).join("")}</div>` : "";
        if (j.folder) box.insertAdjacentHTML("beforeend", `<a class="sm" href="${esc(j.folder)}" target="_blank" rel="noopener">Buka folder foto di Drive</a>`);
      }).catch(() => { const box = $("#teDlgPh"); if (box) box.innerHTML = ""; });
    }
  }

  /* ---------- Peta ---------- */
  const MAP = { map: null, layer: null, fitted: false, ro: null };
  function renderMap() {
    if (!window.L || !$("#teMap")) { $("#teMapFb").hidden = false; return; }
    if (!MAP.map) {
      MAP.map = L.map("teMap", { scrollWheelZoom: false, minZoom: 5, zoomSnap: 0.25 }).setView([-7.8, 113.2], 7);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, className: typeof tdbIsDark === "function" && tdbIsDark() ? "tiles-dark" : "",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(MAP.map);
      MAP.layer = L.layerGroup().addTo(MAP.map);
      const Home = L.Control.extend({ options: { position: "topleft" }, onAdd() {
        const box = L.DomUtil.create("div", "leaflet-bar map-home");
        box.innerHTML = `<a href="#" role="button" title="Tampilkan semua lokasi" aria-label="Tampilkan semua lokasi"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg></a>`;
        L.DomEvent.disableClickPropagation(box);
        L.DomEvent.on(box.querySelector("a"), "click", e => { L.DomEvent.preventDefault(e); select("", false); });
        return box;
      } });
      MAP.map.addControl(new Home());
      // peta baru bisa diukur setelah halaman tampil: sesuaikan ulang saat ukurannya berubah
      if (window.ResizeObserver) { MAP.ro = new ResizeObserver(() => { if ($("#teMap").clientWidth) { MAP.map.invalidateSize(); if (!MAP.fitted) { MAP.fitted = true; mapFit(false); } } }); MAP.ro.observe($("#teMap")); }
    }
    MAP.layer.clearLayers();
    LOK.forEach(x => {
      if (x.lat == null || isNaN(x.lat)) return;
      const sel = S.lok === x.key, dim = S.lok && !sel;
      // label dibalik ke kiri bila ada lokasi lain dekat di sebelah timurnya (agar tidak saling menimpa)
      const flip = LOK.some(o => o !== x && o.lat != null && o.lng > x.lng && o.lng - x.lng < 1 && Math.abs(o.lat - x.lat) < 0.2);
      L.marker([x.lat, x.lng], { title: `${x.lokasi} · ${x.containers.length} kontainer`, riseOnHover: true, zIndexOffset: sel ? 1000 : 0,
        icon: L.divIcon({ className: "te-mk-icon", iconSize: null, iconAnchor: [17, 17],
          html: `<span class="te-mpin${sel ? " sel" : ""}${dim ? " dim" : ""}${flip ? " flip" : ""}" style="--c:${x.color}"><b>${x.containers.length}</b><span class="te-mpin-t"><em>${esc(x.lokasi)}</em><small>${esc(x.merk)} · ${fmt(x.items.length)} item</small></span></span>` }) })
        .on("click", () => select(S.lok === x.key ? "" : x.key, true))
        .bindTooltip(`<b>${esc(x.lokasi)}</b> · ${esc(x.merk)}<br>Kontainer: ${x.containers.map(esc).join(", ")}<br>${fmt(x.items.length)} jenis item`, { direction: "top", offset: [0, -18] })
        .addTo(MAP.layer);
    });
  }
  function mapFit(animate) {
    if (!MAP.map || !$("#teMap").clientWidth) return;
    MAP.map.invalidateSize();
    const L0 = curLok();
    if (L0 && L0.lat != null) MAP.map.setView([L0.lat, L0.lng], 10, { animate: animate !== false });
    else { const pts = LOK.filter(x => x.lat != null && !isNaN(x.lat)).map(x => [x.lat, x.lng]); if (pts.length) MAP.map.fitBounds(pts, { paddingTopLeft: [60, 50], paddingBottomRight: [180, 50], maxZoom: 9, animate: animate !== false }); }
  }

  /* ---------- Interaksi ---------- */
  function select(key, scroll) {
    S.lok = key; S.kon = ""; S.kat = ""; S.page = 1;
    renderKpi(); renderLoks(); renderDetail(); renderItems(); renderMap(); mapFit();
    if (scroll) $("#teDetail").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function render() { if (S.lok && !curLok()) S.lok = ""; renderKpi(); renderLoks(); renderDetail(); renderItems(); renderMap(); }

  sec.addEventListener("click", e => {
    const t = e.target;
    const ed = t.closest("[data-edit]"); if (ed) { e.stopPropagation(); return openEdit(ed.dataset.edit); }
    const lok = t.closest("[data-lok]"); if (lok) return select(lok.dataset.lok, !!lok.closest(".te-loks, .te-kon-grid, .te-chart, .te-mk-loks"));
    const kon = t.closest("[data-kon]"); if (kon) { S.kon = S.kon === kon.dataset.kon ? "" : kon.dataset.kon; S.page = 1; renderDetail(); return renderItems(); }
    const kat = t.closest("[data-kat]"); if (kat) { S.kat = kat.closest(".te-chart") && S.kat === kat.dataset.kat ? "" : kat.dataset.kat; S.page = 1; renderItems(); if (kat.closest(".te-chart")) $("#teKat").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const on = t.closest("[data-only]"); if (on) { S.only = S.only === on.dataset.only ? "" : on.dataset.only; S.page = 1; renderItems(); if (on.classList.contains("kpi")) $("#teKat").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const v = t.closest("[data-view]"); if (v) { S.view = v.dataset.view; try { localStorage.setItem("fashar-te-view", S.view); } catch (er) { } return renderItems(); }
    const pg = t.closest("[data-page]"); if (pg && !pg.disabled) { S.page = +pg.dataset.page; renderItems(); return $("#teShown").scrollIntoView({ behavior: "smooth", block: "start" }); }
    const it = t.closest("[data-it]"); if (it) { const [a, b] = it.dataset.it.split(":").map(Number); openItem(a, b); }
  });
  sec.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const it = e.target.closest("tr[data-it]"); if (it && !e.target.closest("[data-edit]")) { const [a, b] = it.dataset.it.split(":").map(Number); openItem(a, b); }
    const k = e.target.closest(".kpi[data-only]"); if (k) k.click();
  });
  $("#teSearch").addEventListener("input", e => { S.q = e.target.value; S.page = 1; renderItems(); });
  $("#teDialog").addEventListener("click", e => {
    if (e.target === $("#teDialog")) return $("#teDialog").close();
    const z = e.target.closest(".te-zoom"); if (z && window.openLightbox) { e.preventDefault(); openLightbox([{ thumb: z.getAttribute("href"), alt: $("#teDlgTitle").textContent, view: z.getAttribute("href") }], 0); }
  });
  $("#teDlgEdit").addEventListener("click", () => { if (DLG && DLG.id) { $("#teDialog").close(); openEdit(DLG.id); } });

  /* ---------- Sinkronisasi Google Sheets ---------- */
  function setSync(st, t, note) {
    $("#teSync").className = "chip sync " + st; $("#teSync").innerHTML = `<i class="live-dot"></i>${esc(t)}`; $("#teSyncNote").innerHTML = note || "";
    sec.classList.toggle("page-loading", st === "loading");
  }
  const staticNote = () => `Data awal per ${esc(fmtTanggal(DOC.generated))} dari <a href="${SRC_URL}" target="_blank" rel="noopener">spreadsheet Tower Emergency</a> · acuan kolom <b>NAMA KONTAINER</b>`;
  function changed() { if (location.hash === "#tower" && typeof setUpdated === "function") setUpdated("tower"); if (window.homeRefresh) window.homeRefresh(); }
  async function load() {
    if (!API) { setSync("static", "Data spreadsheet (baca saja)", staticNote()); return; }
    setSync("loading", "Memuat dari Google Sheets…");
    try {
      const j = await (await fetch(q("te"), { cache: "no-store" })).json();
      if (!j.ok) throw new Error(j.error || "Gagal memuat");
      if (j.kind !== "te" || !Array.isArray(j.rows)) throw new Error("Apps Script masih versi lama (belum ada fitur Tower Emergency). Tempel Code.gs terbaru lalu deploy New version.");
      DB.updated = j.updated || null;
      if (!j.rows.length) { DB.live = false; $("#teAdd").hidden = true; setSync("error", "Database belum berisi data", staticNote()); showSeed(); return; }
      DB.live = true; $("#teSeed").hidden = true; $("#teAdd").hidden = false;
      build({ lokasi: j.lokasi && j.lokasi.length ? j.lokasi : STATIC.lokasi, rows: j.rows }); render();
      setSync("live", "Live · Google Sheets", `Sheet ${DB_SHEET} · ${j.rows.length} item · ${LOK.length} lokasi · dimuat ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`);
      changed();
    } catch (e) { DB.live = false; setSync("error", "Gagal terhubung · menampilkan data awal", esc(String(e.message || e))); }
  }
  async function post(body, tokInput) {
    const token = ((tokInput && tokInput.value) || tokenGet() || "").trim();
    if (!token) { if (tokInput && tokInput.focus) tokInput.focus(); throw new Error("Masukkan kode akses edit."); }
    const j = await (await fetch(API, { method: "POST", body: JSON.stringify({ token, ...body }) })).json();
    if (!j.ok) {
      if (j.code === "auth") { tokenForget(true); tokUi(); }
      throw new Error(/Aksi tidak dikenal/i.test(j.error || "") ? "Apps Script masih versi lama. Tempel Code.gs terbaru lalu deploy New version." : (j.error || "Gagal menyimpan"));
    }
    if (!DB.batch) tokenClear();
    if (j.updated) DB.updated = j.updated;
    return j;
  }
  function showSeed() {
    const box = $("#teSeed"); box.hidden = false;
    box.innerHTML = `<div><b>Database Tower Emergency belum berisi data.</b> Salin ${fmt(STATIC.rows.length)} item dari ${STATIC.lokasi.length} lokasi (spreadsheet Tower Emergency) ke sheet <b>${DB_SHEET}</b> dan <b>${LOK_SHEET}</b> agar bisa ditambah, diedit, dan diberi foto dari dashboard.</div>
      <div class="ab-seed-act">${tokenGet() ? "" : `<input type="password" id="teSeedTok" placeholder="Kode akses edit" autocomplete="new-password">`}
      <button class="btn primary sm" type="button" id="teSeedBtn">Salin ${fmt(STATIC.rows.length)} item ke sheet</button></div>`;
  }
  $("#teSeed").addEventListener("click", async e => {
    if (!e.target.closest("#teSeedBtn")) return;
    const btn = $("#teSeedBtn"); btn.disabled = true; btn.textContent = "Menyalin…";
    try { const j = await post({ action: "te_seed", lokasi: STATIC.lokasi, rows: STATIC.rows }, $("#teSeedTok")); toast(`${j.rows.length} item disalin ke sheet ${DB_SHEET}`); await load(); }
    catch (x) { toast(String(x.message || x)); btn.disabled = false; btn.textContent = `Salin ${fmt(STATIC.rows.length)} item ke sheet`; }
  });
  $("#teReload").addEventListener("click", load);

  /* ---------- Form tambah / edit ---------- */
  const PS = photoStager($("#tePhSec"), { prefix: "te" });
  const byId = id => ALL.find(x => x.id === id);
  function tokUi() { const t = tokenGet(); $("#te_token").value = t; $("#teTokIn").hidden = !!t; $("#teTokSaved").hidden = !t; }
  function err(m) { $("#teEditErr").textContent = m || ""; $("#teEditErr").hidden = !m; }
  function qtyInputs(lokName, qv) {
    const L = LOK.find(x => x.lokasi === lokName); const cons = L ? L.containers : [];
    $("#teQIn").innerHTML = cons.length ? cons.map((k, i) => `<label class="te-qf" style="--c:${KON_C[i % KON_C.length]}"><span>${conArt(KON_C[i % KON_C.length])}${esc(k)}</span><input type="number" min="0" step="any" inputmode="decimal" data-qk="${esc(k)}" value="${qv && qv[k] ? qv[k] : ""}" placeholder="0"></label>`).join("")
      : `<p class="muted sm">Lokasi ini belum punya daftar kontainer. Isi kolom NAMA KONTAINER di sheet ${LOK_SHEET}.</p>`;
    qtySum();
  }
  function qtySum() { const s = [...$("#teQIn").querySelectorAll("[data-qk]")].reduce((a, i) => a + (Number(i.value) || 0), 0); $("#teQSum").innerHTML = `Total: <b>${num(s)}</b> ${esc($("#te_f_satuan").value || "")}`; }
  $("#teQIn").addEventListener("input", qtySum); $("#te_f_satuan").addEventListener("input", qtySum);
  $("#te_f_lokasi").addEventListener("change", e => { const cur = {}; $("#teQIn").querySelectorAll("[data-qk]").forEach(i => { if (i.value) cur[i.dataset.qk] = Number(i.value); }); qtyInputs(e.target.value, cur); });
  function openEdit(id) {
    if (!DB.live) return;
    const r = id ? byId(id) : null;
    if (id && !r) return toast("Item tidak ditemukan. Muat ulang data.");
    DB.editing = r; err("");
    const lk = r ? r.lok : (curLok() || LOK[0] || {}).lokasi;
    $("#te_f_lokasi").innerHTML = LOK.map(L => `<option value="${esc(L.lokasi)}"${L.lokasi === lk ? " selected" : ""}>${esc(L.lokasi)} · ${esc(L.merk)}</option>`).join("");
    $("#teKatList").innerHTML = [...new Set(ALL.map(x => x.kat))].sort().map(v => `<option value="${esc(v)}">`).join("");
    const v = r || { kat: S.kat || "", nama: "", part: "", ts: "", satuan: "BH", ket: "", q: S.kon ? { [S.kon]: 1 } : {} };
    ["kat", "nama", "part", "ts", "satuan", "ket"].forEach(k => { $("#te_f_" + k).value = v[k] == null ? "" : String(v[k]); });
    qtyInputs(lk, v.q);
    $("#teEditTitle").textContent = r ? `Edit ${r.nama}` : "Tambah item tower emergency";
    $("#teEditSub").textContent = `${r ? r.id + " · " : ""}disimpan ke sheet ${DB_SHEET}`;
    tokUi(); PS.reset({ loading: !!(r && r.linkFoto) });
    if (r && r.linkFoto) loadPhotos(r);
    $("#teEditDlg").showModal();
  }
  async function loadPhotos(r) {
    try {
      const j = await (await fetch(q("te_photos", `&id=${encodeURIComponent(r.id)}`), { cache: "no-store" })).json();
      if (!j.ok) throw new Error(j.error || "Gagal memuat foto");
      if (DB.editing === r) PS.setExisting({ photos: j.photos, cover: j.cover, folder: j.folder });
    } catch (x) { if (DB.editing === r) PS.setExisting({ err: String(x.message || x) }); }
  }
  $("#teEditDlg").addEventListener("close", () => { DB.editing = null; PS.reset(); });
  $("#teTokForget").addEventListener("click", () => { tokenForget(); tokUi(); });
  $("#teAdd").addEventListener("click", () => openEdit(null));
  $("#teEditForm").addEventListener("submit", async e => {
    e.preventDefault();
    const r = DB.editing, data = {};
    ["lokasi", "kat", "nama", "part", "ts", "satuan", "ket"].forEach(k => { data[k] = $("#te_f_" + k).value.trim(); });
    data.satuan = data.satuan.toUpperCase();
    const qv = {}; let bad = "";
    $("#teQIn").querySelectorAll("[data-qk]").forEach(i => { const s = i.value.trim(); if (s === "") return; const n = Number(s); if (isNaN(n) || n < 0) bad = i.dataset.qk; else if (n) qv[i.dataset.qk] = n; });
    if (!data.nama) return err("Nama item wajib diisi.");
    if (bad) return err(`Jumlah untuk kontainer ${bad} harus angka 0 atau lebih.`);
    data.q = qv;
    const changed = r ? Object.fromEntries(Object.entries(data).filter(([k, v]) => k === "q" ? JSON.stringify(v) !== JSON.stringify(Object.fromEntries(Object.entries(r.q || {}).filter(([, x]) => x))) : String(k === "lokasi" ? r.lok : (r[k] == null ? "" : r[k])) !== v)) : data;
    const phChange = PS.hasChanges();
    if (r && !Object.keys(changed).length && !phChange) { $("#teEditDlg").close(); return toast("Tidak ada perubahan"); }
    const tok = $("#te_token");
    if (!tok.value.trim()) { tok.focus(); return err("Masukkan kode akses edit untuk menyimpan perubahan."); }
    const btn = $("#teSave"); btn.disabled = true; btn.textContent = "Menyimpan…"; err(""); DB.batch = true;
    try {
      let id = r && r.id;
      if (!r) { const j = await post({ action: "te_add", data }, tok); id = j.row.id; }
      else if (Object.keys(changed).length) await post({ action: "te_update", id, data: changed }, tok);
      if (phChange) await PS.commit((act, payload) => post({ action: "te_photo_" + act, id, ...payload }, tok));
      tokenClear(); $("#teEditDlg").close();
      toast(r ? "Perubahan tersimpan ke Google Sheets" : `${id} ditambahkan ke Google Sheets`);
      await load();
    } catch (x) { err(String(x.message || x)); }
    finally { DB.batch = false; btn.disabled = false; btn.textContent = "Simpan"; }
  });

  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  window.PAGE_UPDATED.tower = () => {
    if (DB.live && DB.updated) {
      const d = new Date(DB.updated), pad = n => String(n).padStart(2, "0");
      if (!isNaN(d)) { const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; return { date, title: `Perubahan data terakhir: ${fmtTanggal(date)} pukul ${pad(d.getHours())}.${pad(d.getMinutes())} (Google Sheets)` }; }
    }
    return { date: DOC.generated, title: "Tanggal pengambilan data awal dari spreadsheet Tower Emergency" };
  };
  window.TOWER_SUMMARY = () => ({ lokasi: LOK.length, kontainer: LOK.reduce((a, L) => a + L.containers.length, 0), item: ALL.length, live: DB.live });
  addEventListener("hashchange", () => { if (location.hash === "#tower") setTimeout(() => { if (MAP.map) { MAP.map.invalidateSize(); if (!MAP.fitted) { MAP.fitted = true; mapFit(false); } } }, 80); });

  render();
  load();
  if (location.hash === "#tower") setTimeout(() => { if (!MAP.fitted) { MAP.fitted = true; mapFit(false); } }, 120);
})();
