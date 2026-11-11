/* =========================================================
   HALAMAN DATA ALAT (export aplikasi alat: DC Mobile, Filter Minyak, ...)
   Satu modul untuk beberapa menu. Data: data/<nama>.js dari tools/xlsx_alat_to_js.py
   Pemakaian: alatPage({ page: "dcm", data: window.DC_MOBILE, title: "DC Mobile", noun: "DC mobile" })
   ========================================================= */
function alatPage(C) {
  const PAGE = C.page, P = C.page; // id elemen = <page><Nama>, mis. dcmKpi
  const sec = $("#page-" + PAGE);
  if (!sec || !C.data) return;
  sec.innerHTML = alatPageHtml(P, C);
  document.body.insertAdjacentHTML("beforeend", alatDetailHtml(P));
  const DOC = C.data;
  const prep = rows => (rows || []).map((r, i) => ({ ...r, _i: i, merk: r.merk ? r.merk.toUpperCase() : r.merk, jumlah: Number(r.jumlah) || 1 }));
  let ROWS = prep(DOC.rows);
  const X = { editable: false, onDetail: null }; // diisi alat-export-db.js bila halaman punya database (C.db)

  /* Posisi perkiraan kantor ULTG (untuk peta) */
  const ULTG_COORD = {
    "ULTG BALI UTARA": [-8.12, 115.07], "ULTG BABAT": [-7.112, 112.163], "ULTG MALANG": [-7.97, 112.63],
    "ULTG MOJOKERTO": [-7.47, 112.44], "ULTG JEMBER": [-8.17, 113.70], "ULTG PROBOLINGGO": [-7.755, 113.215],
    "ULTG SURABAYA UTARA": [-7.23, 112.735], "ULTG SURABAYA SELATAN": [-7.33, 112.73], "ULTG GRESIK": [-7.16, 112.65],
    "ULTG BANYUWANGI": [-8.22, 114.37], "ULTG MADIUN": [-7.63, 111.52], "ULTG KEDIRI": [-7.82, 112.01],
    "ULTG BALI SELATAN": [-8.67, 115.21], "ULTG BALI TIMUR": [-8.54, 115.40], "ULTG PAMEKASAN": [-7.16, 113.48],
    "ULTG BANGIL": [-7.60, 112.78], "ULTG SIDOARJO": [-7.45, 112.70], "ULTG KRIAN": [-7.41, 112.58], "ULTG BOJONEGORO": [-7.15, 111.88],
    "UPT SURABAYA": [-7.29, 112.76], "UPT GRESIK": [-7.18, 112.62], "UPT MALANG": [-7.95, 112.66], "UPT MADIUN": [-7.60, 111.55],
    "UPT PROBOLINGGO": [-7.73, 113.24], "UPT BALI": [-8.65, 115.24]
  };
  /* Status kalibrasi → kelompok */
  const KAL = {
    berlaku: { label: "Berlaku", tone: "ok", color: "var(--ok)" },
    expired: { label: "Kedaluwarsa", tone: "bad", color: "var(--p1)" },
    belum: { label: "Belum kalibrasi", tone: "warn", color: "var(--p2)" },
    na: { label: "Tidak ada data", tone: "muted", color: "var(--text-3)" }
  };
  const kalOf = r => { const v = String(r.kalibrasi || "").toUpperCase(); return !v ? "na" : /EXPIRED|KADALUARSA|KEDALUWARSA/.test(v) ? "expired" : /BELUM/.test(v) ? "belum" : "berlaku"; };
  const kondisiTone = v => /NORMAL|BAIK/i.test(v || "") ? "ok" : /RUSAK BERAT|TIDAK/i.test(v || "") ? "bad" : v ? "warn" : "muted";
  const title1 = s => String(s || "").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const short = u => title1(String(u || "").replace(/^(UPT|ULTG) /, ""));
  const umurOf = r => { const t = parseInt(r.tahun, 10); if (!t) return "Tidak diketahui"; const u = new Date().getFullYear() - t; return u < 5 ? "< 5 tahun" : u < 10 ? "5–9 tahun" : u < 20 ? "10–19 tahun" : "≥ 20 tahun"; };
  const pctTxt = (n, t) => t ? Math.round(n / t * 100) + "%" : "0%";
  const S = { upt: "", kal: "", q: "", lok: "" };

  function filtered(skipLok) {
    const q = S.q.trim().toLowerCase();
    return ROWS.filter(r => (!S.upt || r.upt === S.upt) && (!S.kal || kalOf(r) === S.kal) && (skipLok || !S.lok || r.ultg === S.lok)
      && (!q || [r.id, r.nama, r.merk, r.tipe, r.sn, r.upt, r.ultg, r.keterangan, r.noKontrak].join(" ").toLowerCase().includes(q)));
  }

  /* ---------- Filter atas ---------- */
  function renderFilters() {
    const upts = [...new Set(ROWS.map(r => r.upt))].sort();
    $(`#${P}Upt`).innerHTML = [["", "Semua UPT"], ...upts.map(u => [u, short(u)])].map(([v, l]) =>
      `<button type="button" class="ab-chip${S.upt === v ? " on" : ""}" data-upt="${esc(v)}" aria-pressed="${S.upt === v}"><span>${esc(l)}</span><em>${ROWS.filter(r => !v || r.upt === v).length}</em></button>`).join("");
    const base = ROWS.filter(r => !S.upt || r.upt === S.upt);
    $(`#${P}Kal`).innerHTML = [["", "Semua status"], ...Object.entries(KAL).map(([k, v]) => [k, v.label])]
      .map(([v, l]) => `<option value="${v}"${S.kal === v ? " selected" : ""}>${l} (${base.filter(r => !v || kalOf(r) === v).length})</option>`).join("");
  }

  /* ---------- Ringkasan & grafik ---------- */
  function renderSummary(list) {
    const n = list.reduce((a, r) => a + (r.jumlah || 1), 0), k = key => list.filter(r => kalOf(r) === key).length;
    const normal = list.filter(r => kondisiTone(r.kondisi) === "ok").length;
    const baru = list.filter(r => parseInt(r.tahun, 10) >= new Date().getFullYear() - 1).length;
    $(`#${P}Kpi`).innerHTML = [
      [`Total ${C.noun}`, n, "pulse", "primary", `${new Set(list.map(r => r.upt)).size} UPT · ${new Set(list.map(r => r.ultg)).size} lokasi ULTG/UPT`],
      ["Kondisi normal", normal, "check", "p3", `${pctTxt(normal, list.length)} dari total`],
      ROWS.some(r => kalOf(r) === "berlaku") && ["Kalibrasi berlaku", k("berlaku"), "shield", "p3", "Status aktif / berlaku"],
      ["Kalibrasi kedaluwarsa", k("expired"), "alert", "p1", "Perlu dikalibrasi ulang"],
      ["Belum kalibrasi", k("belum"), "wrench", "p2", "Belum pernah dikalibrasi"],
      ROWS.some(r => parseInt(r.tahun, 10)) && ["Unit baru", baru, "truck", "primary", `Perolehan ${new Date().getFullYear() - 1}–${new Date().getFullYear()}`]
    ].filter(Boolean).map(([l, v, ic, t, sub]) => `<div class="card kpi tone-${t}"><div class="kpi-icon">${icon(ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${esc(sub)}</div></div></div>`).join("");

    $(`#${P}LegKal`).innerHTML = Object.entries(KAL).filter(([key]) => list.some(r => kalOf(r) === key)).map(([, v]) => v)
      .map(v => `<span><i class="swatch" style="background:${v.color}"></i>${v.label}</span>`).join("");
    // per UPT (bertumpuk per status kalibrasi)
    const ups = [...new Set(list.map(r => r.upt))].map(u => [u, list.filter(r => r.upt === u)]).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    const maxU = Math.max(1, ...ups.map(x => x[1].length));
    $(`#${P}ChUpt`).innerHTML = ups.length ? `<ul class="bars ab-bars">${ups.map(([u, xs]) => `<li data-upt="${esc(u)}" class="clickable${S.upt === u ? " on" : ""}" title="Filter ${esc(u)}">
      <span class="bl">${esc(short(u))}</span><span class="bt ab-stk" style="--w:${xs.length / maxU * 100}%">${Object.entries(KAL).map(([key, v]) => [v, xs.filter(r => kalOf(r) === key).length]).filter(x => x[1])
        .map(([v, c]) => `<i style="flex:${c};background:${v.color}" title="${v.label}: ${c}"></i>`).join("")}</span><b>${xs.length}</b></li>`).join("")}</ul>` : `<p class="dnil">Tidak ada data.</p>`;
    // donut status kalibrasi
    const kd = Object.entries(KAL).map(([key, v]) => [v, list.filter(r => kalOf(r) === key).length]).filter(x => x[1]);
    let acc = 0;
    const segs = kd.map(([v, c]) => { const p = c / Math.max(list.length, 1) * 100, s = `<circle cx="50" cy="50" r="40" pathLength="100" style="stroke:${v.color};stroke-dasharray:${Math.max(p - .6, .4)} ${100 - p + .6};stroke-dashoffset:${-acc}"><title>${v.label}: ${c}</title></circle>`; acc += p; return s; }).join("");
    $(`#${P}ChKal`).innerHTML = list.length ? `<svg class="donut" viewBox="0 0 100 100" role="img" aria-label="Komposisi status kalibrasi"><circle cx="50" cy="50" r="40" class="d-track"/>${segs}
        <text x="50" y="49" class="d-total">${list.length}</text><text x="50" y="61" class="d-cap">unit</text></svg>
      <div class="ab-donut-legend"><ul class="plist">${kd.map(([v, c]) => `<li><i class="swatch" style="background:${v.color}"></i><span>${v.label}</span><b>${c}</b><em>${pctTxt(c, list.length)}</em></li>`).join("")}</ul>
      <p class="muted sm alx-note">Unit dengan kalibrasi kedaluwarsa atau belum dikalibrasi perlu dijadwalkan kalibrasi.</p></div>` : `<p class="dnil">Tidak ada data.</p>`;
    // merk & tipe
    // merk (huruf besar disamakan) — tipe yang tercatat ditampilkan di bawahnya
    const mk = new Map(); list.forEach(r => { const m = (r.merk || "Tidak diketahui").replace(/\s+ELECTRIC$/, " ELECTRIC"); const o = mk.get(m) || { n: 0, t: new Set() }; o.n++; if (r.tipe) o.t.add(r.tipe); mk.set(m, o); });
    const mks = [...mk.entries()].sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0])), maxM = Math.max(1, ...mks.map(x => x[1].n));
    $(`#${P}ChMerk`).innerHTML = mks.length ? `<ul class="bars ab-bars alx-merk">${mks.map(([m, o]) => { const t = [...o.t].join(", "), c = o.n;
      return `<li title="${esc(m)}${t ? " (" + esc(t) + ")" : ""}: ${c} unit"><span class="bl"><b>${esc(m)}</b><small>${esc(t || "Tipe tidak tercatat")}</small></span><span class="bt"><i style="width:${c / maxM * 100}%;background:var(--primary)"></i></span><b>${c}</b></li>`; }).join("")}</ul>` : `<p class="dnil">Tidak ada data.</p>`;
    // kondisi & umur
    const kon = new Map(); list.forEach(r => { const v = r.kondisi || "Tidak ada data"; kon.set(v, (kon.get(v) || 0) + 1); });
    const um = ["< 5 tahun", "5–9 tahun", "10–19 tahun", "≥ 20 tahun", "Tidak diketahui"].map(k => [k, list.filter(r => umurOf(r) === k).length]);
    const UM_C = ["var(--ok)", "var(--primary)", "var(--p2)", "var(--p1)", "var(--text-3)"], TONE_C = { ok: "var(--ok)", warn: "var(--p2)", bad: "var(--p1)", muted: "var(--text-3)" };
    const mini = (h, rows, colorOf) => { const mx = Math.max(1, ...rows.map(r => r[1])); return `<div><h5>${h}</h5><ul class="bars ab-bars">${rows.map(([k, v], i) =>
      `<li><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${v / mx * 100}%;background:${colorOf(k, i)}"></i></span><b>${v}</b></li>`).join("")}</ul></div>`; };
    $(`#${P}ChUmur`).innerHTML = mini("Kondisi", [...kon.entries()].map(([k, v]) => [title1(k), v]), k => TONE_C[kondisiTone(k)]) + mini("Umur unit", um, (k, i) => UM_C[i]);
  }

  /* ---------- Peta lokasi (per ULTG) ---------- */
  const MAP = { map: null, layer: null, tiles: null, fitted: false };
  const isDark = () => typeof tdbIsDark === "function" && tdbIsDark();
  function mapInit() {
    if (MAP.map || !window.L || !$(`#${P}Map`)) return !!MAP.map;
    MAP.map = L.map(P + "Map", { scrollWheelZoom: false, minZoom: 5 }).setView([-7.8, 113.2], 7);
    MAP.tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, className: isDark() ? "tiles-dark" : "",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(MAP.map);
    MAP.layer = L.layerGroup().addTo(MAP.map);
    MAP.map.on("click", () => selectLok(""));
    const Home = L.Control.extend({ options: { position: "topleft" }, onAdd() {
      const box = L.DomUtil.create("div", "leaflet-bar map-home");
      box.innerHTML = `<a href="#" role="button" title="Tampilan awal" aria-label="Kembalikan tampilan peta"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/></svg></a>`;
      L.DomEvent.disableClickPropagation(box);
      L.DomEvent.on(box.querySelector("a"), "click", e => { L.DomEvent.preventDefault(e); mapHome(true); });
      return box;
    } });
    MAP.map.addControl(new Home());
    return true;
  }
  function groups(list) {
    const m = new Map();
    list.forEach(r => { const k = r.ultg || "Tanpa ULTG"; if (!m.has(k)) m.set(k, { ultg: k, upt: r.upt, items: [] }); m.get(k).items.push(r); });
    return [...m.values()].sort((a, b) => b.items.length - a.items.length || a.ultg.localeCompare(b.ultg));
  }
  const gColor = g => g.items.some(r => kalOf(r) === "expired") ? "var(--p1)" : g.items.some(r => kalOf(r) === "belum") ? "var(--p2)" : "var(--ok)";
  function renderMap(list) {
    const gs = groups(list), ok = mapInit();
    $(`#${P}MapFallback`).hidden = ok;
    if (ok) {
      MAP.layer.clearLayers();
      gs.forEach(g => {
        const c = ULTG_COORD[g.ultg]; if (!c) return;
        L.marker(c, { title: `${g.ultg} · ${g.items.length} unit`, keyboard: true, riseOnHover: true,
          icon: L.divIcon({ className: "tm-icon", iconSize: [34, 34], iconAnchor: [17, 17], html: `<span class="tm-pin${S.lok === g.ultg ? " sel" : ""}" style="--c:${gColor(g)}">${g.items.length}</span>` }) })
          .on("click", e => { L.DomEvent.stopPropagation(e); selectLok(g.ultg); })
          .bindTooltip(`<b>${esc(g.ultg)}</b><br>${esc(g.upt)} · ${g.items.length} unit ${C.noun}`, { direction: "top", offset: [0, -16] })
          .addTo(MAP.layer);
      });
    }
    const sel = S.lok && gs.find(g => g.ultg === S.lok);
    const legend = `<span class="dot" style="background:var(--ok)"></span> kalibrasi berlaku · <span class="dot" style="background:var(--p2)"></span> ada yang belum kalibrasi · <span class="dot" style="background:var(--p1)"></span> ada yang kedaluwarsa`;
    if (!sel) {
      $(`#${P}LocPanel`).innerHTML = `<div class="lp-head"><h3>${gs.length} lokasi ULTG / UPT</h3><p>Klik titik di peta atau pilih lokasi untuk memfilter tabel. ${legend}</p></div>
        <ul class="lp-list">${gs.map(g => `<li><button type="button" data-lok="${esc(g.ultg)}"><i class="dot" style="background:${gColor(g)}"></i>
          <span><b>${esc(g.ultg)}</b><small>${esc(g.upt)}</small></span><em>${g.items.length}</em></button></li>`).join("")}</ul>`;
    } else {
      $(`#${P}LocPanel`).innerHTML = `<div class="lp-head"><button type="button" class="linkbtn lp-back" data-lok="">‹ Semua lokasi</button><h3>${esc(sel.ultg)}</h3><p>${esc(sel.upt)} · ${sel.items.length} unit</p></div>
        <ul class="lp-list">${sel.items.map(r => `<li><button type="button" data-id="${r._i}"><i class="dot" style="background:${KAL[kalOf(r)].color}"></i>
          <span><b>${esc(r.id || r.nama)}</b><small>${esc(r.merk || "")} ${esc(r.tipe || "")} · ${esc(KAL[kalOf(r)].label)}</small></span><em>${esc(r.tahun || "—")}</em></button></li>`).join("")}</ul>`;
    }
  }
  function selectLok(lok) {
    S.lok = lok || ""; render();
    const c = S.lok && ULTG_COORD[S.lok];
    if (MAP.map && c) MAP.map.flyTo(c, Math.max(MAP.map.getZoom(), 10), { duration: .6 });
  }
  function mapHome(animate) {
    const pts = groups(ROWS).map(g => ULTG_COORD[g.ultg]).filter(Boolean); if (!MAP.map || !pts.length) return;
    animate ? MAP.map.flyToBounds(pts, { padding: [40, 40], duration: .6 }) : MAP.map.fitBounds(pts, { padding: [40, 40] });
  }
  function mapResize() { if (!MAP.map) return; MAP.map.invalidateSize(); if (!MAP.fitted) { mapHome(false); MAP.fitted = true; } }
  window.ALAT_MAP_THEMES = window.ALAT_MAP_THEMES || [];
  window.ALAT_MAP_THEMES.push(() => { if (MAP.tiles) MAP.tiles.getContainer().classList.toggle("tiles-dark", isDark()); });

  /* ---------- Tabel ---------- */
  const chip = (tone, text) => `<span class="badge ${tone}">${esc(text)}</span>`;
  function renderTable(list) {
    $(`#${P}Shown`).innerHTML = `Menampilkan <b>${list.length}</b> unit ${C.noun}${S.lok ? ` di <b>${esc(S.lok)}</b> <button type="button" class="linkbtn" data-clear-lok>hapus filter lokasi</button>` : ""}`;
    $(`#${P}Rows`).innerHTML = list.map((r, i) => { const k = kalOf(r); return `<tr data-id="${r._i}" tabindex="0">
      <td class="num no">${i + 1}</td><td><b>${esc(r.id || "—")}</b></td><td>${esc(r.nama || "—")}<div class="muted sm">${esc(r.kategori || "")}</div></td>
      <td><b>${esc(r.merk || "—")}</b><div class="muted sm">${esc(r.tipe || "—")}</div></td><td>${esc(r.upt || "—")}<div class="muted sm">${esc(r.ultg || "")}</div></td>
      <td class="num">${esc(r.tahun || "—")}</td><td>${r.sn ? esc(r.sn) : `<span class="muted">—</span>`}</td>
      <td>${chip(KAL[k].tone, KAL[k].label)}</td><td>${chip(kondisiTone(r.kondisi), title1(r.kondisi || "Tidak ada data"))}</td>
      <td class="izin">${esc(r.keterangan || "—")}</td><td class="act"><button type="button" class="btn ghost sm" data-id="${r._i}">Detail</button>${X.editable ? ` <button type="button" class="btn ghost sm" data-edit="${esc(r.id)}">Edit</button>` : ""}</td></tr>`; }).join("");
    $(`#${P}Empty`).hidden = list.length > 0;
    $(`#${P}Count`).textContent = `${list.length} dari ${ROWS.length} unit`;
    $(`#${P}Src`).textContent = `Sumber: ${DOC.source || "file Excel"}`;
  }

  /* ---------- Detail ---------- */
  function openDetail(i) {
    const r = ROWS[i]; if (!r) return;
    const k = kalOf(r);
    $(`#${P}DetTitle`).textContent = `${r.nama || C.title} · ${r.id || ""}`;
    $(`#${P}DetSub`).innerHTML = `${esc(r.upt || "")} · ${esc(r.ultg || "")} ${chip(KAL[k].tone, KAL[k].label)} ${chip(kondisiTone(r.kondisi), title1(r.kondisi || "Tidak ada data"))}`;
    const sec = (h, rows) => `<section class="dsec"><h4>${h}</h4><dl class="dgrid">${rows.map(([l, v, cls]) =>
      `<div${cls ? ` class="${cls}"` : ""}><dt>${l}</dt><dd class="${v ? "" : "nil"}">${esc(v || "—")}</dd></div>`).join("")}</dl></section>`;
    $(`#${P}DetBody`).innerHTML =
      sec("Identitas alat", [["ID alat", r.id], ["Nama alat", r.nama], ["Nama alat (TSJ)", r.namaTsj], ["Kategori", r.kategori], ["Sub kategori", r.subKategori], ["Bidang", r.bidang],
        ["Merk", r.merk], ["Tipe", r.tipe], ["No. seri", r.sn], ["Tahun perolehan", r.tahun], ["Jumlah", r.jumlah ? `${r.jumlah} ${r.satuan || ""}` : ""], ["Harga perolehan", r.harga]]) +
      sec("Lokasi", [["UPT", r.upt], ["ULTG", r.ultg], ["Gardu induk", r.gi], ["Lokasi penyimpanan", r.lokasi]]) +
      sec("Kalibrasi", [["Status kalibrasi", r.kalibrasi], ["Sertifikat", r.sertifikat], ["Kalibrasi terakhir", r.tglKalibrasi], ["Kedaluwarsa", r.tglKadaluarsa],
        ["Rencana kalibrasi", r.rencanaKalibrasi], ["Jenis lembaga", r.jenisLembaga], ["Nama lembaga", r.lembaga, "span2"]]) +
      sec("Kondisi & keterangan", [["Kondisi", r.kondisi], ["Kondisi perbaikan", r.kondisiPerbaikan], ["Anomali", r.anomali, "span2"], ["Keterangan", r.keterangan, "wide"]]) +
      sec("Administrasi", [["No. aktiva", r.noAktiva], ["No. kontrak", r.noKontrak, "span2"], ["File IK", r.fileIk], ["File foto", r.namaFile], ["Dicatat oleh", r.dibuatOleh], ["Dibuat", r.dibuat], ["Diperbarui", r.diperbarui]]);
    if (X.onDetail) X.onDetail(r);
    $(`#${P}Detail`).showModal();
  }

  function render() {
    renderFilters();
    const list = filtered(false), base = filtered(true);
    renderSummary(base);
    renderMap(base);
    renderTable(list);
  }

  /* ---------- Event ---------- */
  $(`#${P}Upt`).addEventListener("click", e => { const b = e.target.closest("[data-upt]"); if (b) { S.upt = b.dataset.upt; S.lok = ""; render(); } });
  $(`#${P}ChUpt`).addEventListener("click", e => { const li = e.target.closest("[data-upt]"); if (li) { S.upt = S.upt === li.dataset.upt ? "" : li.dataset.upt; S.lok = ""; render(); } });
  $(`#${P}Kal`).addEventListener("change", e => { S.kal = e.target.value; render(); });
  $(`#${P}Search`).addEventListener("input", e => { S.q = e.target.value; render(); });
  $(`#${P}LocPanel`).addEventListener("click", e => { const b = e.target.closest("[data-lok]"); if (b) return selectLok(b.dataset.lok); const d = e.target.closest("[data-id]"); if (d) openDetail(+d.dataset.id); });
  $(`#${P}Shown`).addEventListener("click", e => { if (e.target.closest("[data-clear-lok]")) selectLok(""); });
  $(`#${P}Rows`).addEventListener("click", e => { const ed = e.target.closest("[data-edit]"); if (ed && X.edit) return X.edit(ed.dataset.edit); const t = e.target.closest("[data-id]"); if (t) openDetail(+t.dataset.id); });
  $(`#${P}Rows`).addEventListener("keydown", e => { const t = e.target.closest("tr[data-id]"); if (t && e.key === "Enter") openDetail(+t.dataset.id); });
  $(`#${P}Detail`).addEventListener("click", e => { if (e.target === $(`#${P}Detail`)) $(`#${P}Detail`).close(); });
  const onShow = () => { if (location.hash === "#" + PAGE) setTimeout(mapResize, 80); };
  addEventListener("hashchange", onShow);

  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  window.PAGE_UPDATED[PAGE] = () => DOC.diperbarui ? { date: DOC.diperbarui, title: `Data terakhir diperbarui di ${DOC.source || "file Excel"}` } : null;
  render();
  onShow();
  if (location.hash === "#" + PAGE && typeof setUpdated === "function") setUpdated(PAGE);
  /* Database Google Sheets (tambah/edit/foto) — lihat alat-export-db.js */
  if (C.db && typeof alatDbInit === "function") alatDbInit({
    P, C, X, DOC, ULTG_COORD,
    rows: () => ROWS, byId: id => ROWS.find(r => r.id === id),
    setRows: rows => { ROWS = prep(rows); render(); },
    render, staticUpdated: window.PAGE_UPDATED[PAGE]
  });
}

function alatPageHtml(P, C) {
  const bar = C.db ? `<div class="tdb-bar card ab-bar">
    <div class="tdb-bar-info"><span class="chip sync" id="${P}SyncChip"></span><span class="muted sm" id="${P}SyncNote"></span></div>
    <div class="tdb-actions"><button class="btn ghost" type="button" id="${P}Reload" hidden><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/></svg>Muat ulang</button><button class="btn primary" type="button" id="${P}AddBtn" hidden><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Tambah ${esc(C.noun)}</button></div>
   </div>
   <div class="callout warn ab-seed" id="${P}Seed" hidden></div>` : "";
  return bar + `<div class="ab-filters">
    <div class="ab-chips" id="${P}Upt" role="group" aria-label="Filter UPT"></div>
    <div class="ab-filter-right">
     <div class="search"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="${P}Search" type="search" placeholder="Cari ID, merk, tipe, no. seri, lokasi…" aria-label="Cari ${C.noun}"></div>
     <label class="fld ab-kondisi"><span>Status kalibrasi</span><select id="${P}Kal"></select></label>
    </div>
   </div>
   <div class="ab-kpis" id="${P}Kpi"></div>
   <div class="card tdb-mapcard ab-mapcard">
    <div class="tdb-mapwrap"><div id="${P}Map" class="alx-map" role="region" aria-label="Peta lokasi ${C.noun}"></div>
     <p class="map-fallback" id="${P}MapFallback" hidden>Peta tidak dapat dimuat. Gunakan daftar lokasi di samping.</p>
     <span class="map-note">Posisi titik perkiraan (lokasi ULTG/UPT) · angka = jumlah unit</span></div>
    <aside class="tdb-locpanel" id="${P}LocPanel" aria-live="polite"></aside>
   </div>
   <div class="grid g2 ab-charts">
    <div class="card"><div class="card-head"><div><h3>Sebaran per UPT</h3><p>Jumlah unit per status kalibrasi · klik untuk memfilter</p></div><div class="legend" id="${P}LegKal"></div></div><div class="card-body" id="${P}ChUpt"></div></div>
    <div class="card"><div class="card-head"><div><h3>Status kalibrasi</h3><p>Komposisi status kalibrasi unit</p></div></div><div class="card-body ab-donut-wrap" id="${P}ChKal"></div></div>
    <div class="card"><div class="card-head"><div><h3>Merk &amp; tipe</h3><p>Jumlah unit per merk / tipe</p></div></div><div class="card-body" id="${P}ChMerk"></div></div>
    <div class="card"><div class="card-head"><div><h3>Kondisi &amp; umur unit</h3><p>Kondisi terakhir dan umur berdasarkan tahun perolehan</p></div></div><div class="card-body ab-two" id="${P}ChUmur"></div></div>
   </div>
   <div class="ab-listbar"><p class="muted ab-shown" id="${P}Shown"></p></div>
   <div class="card">
    <div class="table-wrap ab-table alx-table"><table class="table">
     <thead><tr><th class="num">No</th><th>ID Alat</th><th>Nama alat</th><th>Merk / Tipe</th><th>UPT / ULTG</th><th class="num">Tahun</th><th>No. Seri</th><th>Status kalibrasi</th><th>Kondisi</th><th>Keterangan</th><th></th></tr></thead>
     <tbody id="${P}Rows"></tbody>
    </table><div class="empty" id="${P}Empty" hidden>Tidak ada unit yang cocok dengan filter.</div></div>
    <div class="card-foot tdb-foot"><span class="muted" id="${P}Count"></span><span class="muted sm" id="${P}Src"></span></div>
   </div>`;
}
function alatDetailHtml(P) {
  return `<dialog class="modal modal-lg" id="${P}Detail" aria-labelledby="${P}DetTitle">
 <div class="modal-wrap">
  <header class="modal-head"><div><h3 id="${P}DetTitle"></h3><p id="${P}DetSub"></p></div><button class="icon-btn" type="button" onclick="this.closest('dialog').close()" aria-label="Tutup"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>
  <div class="modal-body" id="${P}DetBody"></div>
  <footer class="modal-foot"><div class="modal-btns"><button class="btn ghost" type="button" onclick="this.closest('dialog').close()">Tutup</button></div></footer>
 </div>
</dialog>`;
}

alatPage({ page: "dcm", data: window.DC_MOBILE, title: "DC Mobile", noun: "DC mobile", db: { kind: "dcm", sheet: "4. DC MOBILE (NEW)" } });
alatPage({ page: "fm", data: window.FILTER_MINYAK, title: "Filter Minyak", noun: "filter minyak", db: { kind: "fm", sheet: "8. FILTER MINYAK (NEW)" } });
