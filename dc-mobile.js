/* =========================================================
   MENU DC MOBILE — Peralatan ERS
   Sumber data: window.DC_MOBILE (data/dc-mobile.js, dibuat oleh
   tools/xlsx_to_dc_mobile.py dari DATA_DC_MOBILE_UIT_JBM.xlsx)
   ========================================================= */
(function () {
  if (!$("#page-dcm") || !window.DC_MOBILE) return;
  const DOC = window.DC_MOBILE;
  const ROWS = (DOC.rows || []).map((r, i) => ({ ...r, _i: i }));

  /* Posisi perkiraan kantor ULTG (untuk peta) */
  const ULTG_COORD = {
    "ULTG BALI UTARA": [-8.12, 115.07], "ULTG BABAT": [-7.112, 112.163], "ULTG MALANG": [-7.97, 112.63],
    "ULTG MOJOKERTO": [-7.47, 112.44], "ULTG JEMBER": [-8.17, 113.70], "ULTG PROBOLINGGO": [-7.755, 113.215],
    "ULTG SURABAYA UTARA": [-7.23, 112.735], "ULTG SURABAYA SELATAN": [-7.33, 112.73], "ULTG GRESIK": [-7.16, 112.65],
    "ULTG BANYUWANGI": [-8.22, 114.37], "ULTG MADIUN": [-7.63, 111.52], "ULTG KEDIRI": [-7.82, 112.01],
    "ULTG BALI SELATAN": [-8.67, 115.21], "ULTG BALI TIMUR": [-8.54, 115.40], "ULTG PAMEKASAN": [-7.16, 113.48]
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
    $("#dcmUpt").innerHTML = [["", "Semua UPT"], ...upts.map(u => [u, short(u)])].map(([v, l]) =>
      `<button type="button" class="ab-chip${S.upt === v ? " on" : ""}" data-upt="${esc(v)}" aria-pressed="${S.upt === v}"><span>${esc(l)}</span><em>${ROWS.filter(r => !v || r.upt === v).length}</em></button>`).join("");
    const base = ROWS.filter(r => !S.upt || r.upt === S.upt);
    $("#dcmKal").innerHTML = [["", "Semua status"], ...Object.entries(KAL).map(([k, v]) => [k, v.label])]
      .map(([v, l]) => `<option value="${v}"${S.kal === v ? " selected" : ""}>${l} (${base.filter(r => !v || kalOf(r) === v).length})</option>`).join("");
  }

  /* ---------- Ringkasan & grafik ---------- */
  function renderSummary(list) {
    const n = list.reduce((a, r) => a + (r.jumlah || 1), 0), k = key => list.filter(r => kalOf(r) === key).length;
    const normal = list.filter(r => kondisiTone(r.kondisi) === "ok").length;
    const baru = list.filter(r => parseInt(r.tahun, 10) >= new Date().getFullYear() - 1).length;
    $("#dcmKpi").innerHTML = [
      ["Total DC mobile", n, "pulse", "primary", `${new Set(list.map(r => r.upt)).size} UPT · ${new Set(list.map(r => r.ultg)).size} ULTG`],
      ["Kondisi normal", normal, "check", "p3", `${pctTxt(normal, list.length)} dari total`],
      ["Kalibrasi kedaluwarsa", k("expired"), "alert", "p1", "Perlu dikalibrasi ulang"],
      ["Belum kalibrasi", k("belum"), "wrench", "p2", "Belum pernah dikalibrasi"],
      ["Unit baru", baru, "truck", "primary", `Perolehan ${new Date().getFullYear() - 1}–${new Date().getFullYear()}`]
    ].map(([l, v, ic, t, sub]) => `<div class="card kpi tone-${t}"><div class="kpi-icon">${icon(ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${esc(sub)}</div></div></div>`).join("");

    $("#dcmLegKal").innerHTML = Object.entries(KAL).filter(([key]) => list.some(r => kalOf(r) === key)).map(([, v]) => v)
      .map(v => `<span><i class="swatch" style="background:${v.color}"></i>${v.label}</span>`).join("");
    // per UPT (bertumpuk per status kalibrasi)
    const ups = [...new Set(list.map(r => r.upt))].map(u => [u, list.filter(r => r.upt === u)]).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
    const maxU = Math.max(1, ...ups.map(x => x[1].length));
    $("#dcmChUpt").innerHTML = ups.length ? `<ul class="bars ab-bars">${ups.map(([u, xs]) => `<li data-upt="${esc(u)}" class="clickable${S.upt === u ? " on" : ""}" title="Filter ${esc(u)}">
      <span class="bl">${esc(short(u))}</span><span class="bt ab-stk" style="--w:${xs.length / maxU * 100}%">${Object.entries(KAL).map(([key, v]) => [v, xs.filter(r => kalOf(r) === key).length]).filter(x => x[1])
        .map(([v, c]) => `<i style="flex:${c};background:${v.color}" title="${v.label}: ${c}"></i>`).join("")}</span><b>${xs.length}</b></li>`).join("")}</ul>` : `<p class="dnil">Tidak ada data.</p>`;
    // donut status kalibrasi
    const kd = Object.entries(KAL).map(([key, v]) => [v, list.filter(r => kalOf(r) === key).length]).filter(x => x[1]);
    let acc = 0;
    const segs = kd.map(([v, c]) => { const p = c / Math.max(list.length, 1) * 100, s = `<circle cx="50" cy="50" r="40" pathLength="100" style="stroke:${v.color};stroke-dasharray:${Math.max(p - .6, .4)} ${100 - p + .6};stroke-dashoffset:${-acc}"><title>${v.label}: ${c}</title></circle>`; acc += p; return s; }).join("");
    $("#dcmChKal").innerHTML = list.length ? `<svg class="donut" viewBox="0 0 100 100" role="img" aria-label="Komposisi status kalibrasi"><circle cx="50" cy="50" r="40" class="d-track"/>${segs}
        <text x="50" y="49" class="d-total">${list.length}</text><text x="50" y="61" class="d-cap">unit</text></svg>
      <div class="ab-donut-legend"><ul class="plist">${kd.map(([v, c]) => `<li><i class="swatch" style="background:${v.color}"></i><span>${v.label}</span><b>${c}</b><em>${pctTxt(c, list.length)}</em></li>`).join("")}</ul>
      <p class="muted sm dcm-note">Unit dengan kalibrasi kedaluwarsa atau belum dikalibrasi perlu dijadwalkan kalibrasi.</p></div>` : `<p class="dnil">Tidak ada data.</p>`;
    // merk & tipe
    const mk = new Map(); list.forEach(r => { const key = [r.merk || "Tidak diketahui", r.tipe || ""].join("|"); mk.set(key, (mk.get(key) || 0) + 1); });
    const mks = [...mk.entries()].sort((a, b) => b[1] - a[1]), maxM = Math.max(1, ...mks.map(x => x[1]));
    $("#dcmChMerk").innerHTML = mks.length ? `<ul class="bars ab-bars dcm-merk">${mks.map(([key, c]) => { const [m, t] = key.split("|");
      return `<li title="${esc(m)} ${esc(t)}: ${c} unit"><span class="bl"><b>${esc(m)}</b><small>${esc(t || "—")}</small></span><span class="bt"><i style="width:${c / maxM * 100}%;background:var(--primary)"></i></span><b>${c}</b></li>`; }).join("")}</ul>` : `<p class="dnil">Tidak ada data.</p>`;
    // kondisi & umur
    const kon = new Map(); list.forEach(r => { const v = r.kondisi || "Tidak ada data"; kon.set(v, (kon.get(v) || 0) + 1); });
    const um = ["< 5 tahun", "5–9 tahun", "10–19 tahun", "≥ 20 tahun", "Tidak diketahui"].map(k => [k, list.filter(r => umurOf(r) === k).length]);
    const UM_C = ["var(--ok)", "var(--primary)", "var(--p2)", "var(--p1)", "var(--text-3)"], TONE_C = { ok: "var(--ok)", warn: "var(--p2)", bad: "var(--p1)", muted: "var(--text-3)" };
    const mini = (h, rows, colorOf) => { const mx = Math.max(1, ...rows.map(r => r[1])); return `<div><h5>${h}</h5><ul class="bars ab-bars">${rows.map(([k, v], i) =>
      `<li><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${v / mx * 100}%;background:${colorOf(k, i)}"></i></span><b>${v}</b></li>`).join("")}</ul></div>`; };
    $("#dcmChUmur").innerHTML = mini("Kondisi", [...kon.entries()].map(([k, v]) => [title1(k), v]), k => TONE_C[kondisiTone(k)]) + mini("Umur unit", um, (k, i) => UM_C[i]);
  }

  /* ---------- Peta lokasi (per ULTG) ---------- */
  const MAP = { map: null, layer: null, tiles: null, fitted: false };
  const isDark = () => typeof tdbIsDark === "function" && tdbIsDark();
  function mapInit() {
    if (MAP.map || !window.L || !$("#dcmMap")) return !!MAP.map;
    MAP.map = L.map("dcmMap", { scrollWheelZoom: false, minZoom: 5 }).setView([-7.8, 113.2], 7);
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
    $("#dcmMapFallback").hidden = ok;
    if (ok) {
      MAP.layer.clearLayers();
      gs.forEach(g => {
        const c = ULTG_COORD[g.ultg]; if (!c) return;
        L.marker(c, { title: `${g.ultg} · ${g.items.length} unit`, keyboard: true, riseOnHover: true,
          icon: L.divIcon({ className: "tm-icon", iconSize: [34, 34], iconAnchor: [17, 17], html: `<span class="tm-pin${S.lok === g.ultg ? " sel" : ""}" style="--c:${gColor(g)}">${g.items.length}</span>` }) })
          .on("click", e => { L.DomEvent.stopPropagation(e); selectLok(g.ultg); })
          .bindTooltip(`<b>${esc(g.ultg)}</b><br>${esc(g.upt)} · ${g.items.length} unit DC mobile`, { direction: "top", offset: [0, -16] })
          .addTo(MAP.layer);
      });
    }
    const sel = S.lok && gs.find(g => g.ultg === S.lok);
    const legend = `<span class="dot" style="background:var(--ok)"></span> kalibrasi berlaku · <span class="dot" style="background:var(--p2)"></span> ada yang belum kalibrasi · <span class="dot" style="background:var(--p1)"></span> ada yang kedaluwarsa`;
    if (!sel) {
      $("#dcmLocPanel").innerHTML = `<div class="lp-head"><h3>${gs.length} lokasi ULTG</h3><p>Klik titik di peta atau pilih lokasi untuk memfilter tabel. ${legend}</p></div>
        <ul class="lp-list">${gs.map(g => `<li><button type="button" data-lok="${esc(g.ultg)}"><i class="dot" style="background:${gColor(g)}"></i>
          <span><b>${esc(g.ultg)}</b><small>${esc(g.upt)}</small></span><em>${g.items.length}</em></button></li>`).join("")}</ul>`;
    } else {
      $("#dcmLocPanel").innerHTML = `<div class="lp-head"><button type="button" class="linkbtn lp-back" data-lok="">‹ Semua lokasi</button><h3>${esc(sel.ultg)}</h3><p>${esc(sel.upt)} · ${sel.items.length} unit</p></div>
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
  window.dcmMapTheme = () => { if (MAP.tiles) MAP.tiles.getContainer().classList.toggle("tiles-dark", isDark()); };

  /* ---------- Tabel ---------- */
  const chip = (tone, text) => `<span class="badge ${tone}">${esc(text)}</span>`;
  function renderTable(list) {
    $("#dcmShown").innerHTML = `Menampilkan <b>${list.length}</b> unit DC mobile${S.lok ? ` di <b>${esc(S.lok)}</b> <button type="button" class="linkbtn" data-clear-lok>hapus filter lokasi</button>` : ""}`;
    $("#dcmRows").innerHTML = list.map((r, i) => { const k = kalOf(r); return `<tr data-id="${r._i}" tabindex="0">
      <td class="num no">${i + 1}</td><td><b>${esc(r.id || "—")}</b></td><td>${esc(r.nama || "—")}<div class="muted sm">${esc(r.kategori || "")}</div></td>
      <td><b>${esc(r.merk || "—")}</b><div class="muted sm">${esc(r.tipe || "—")}</div></td><td>${esc(r.upt || "—")}<div class="muted sm">${esc(r.ultg || "")}</div></td>
      <td class="num">${esc(r.tahun || "—")}</td><td>${r.sn ? esc(r.sn) : `<span class="muted">—</span>`}</td>
      <td>${chip(KAL[k].tone, KAL[k].label)}</td><td>${chip(kondisiTone(r.kondisi), title1(r.kondisi || "Tidak ada data"))}</td>
      <td class="izin">${esc(r.keterangan || "—")}</td><td class="act"><button type="button" class="btn ghost sm" data-id="${r._i}">Detail</button></td></tr>`; }).join("");
    $("#dcmEmpty").hidden = list.length > 0;
    $("#dcmCount").textContent = `${list.length} dari ${ROWS.length} unit`;
    $("#dcmSrc").textContent = `Sumber: ${DOC.source || "DATA DC MOBILE"}`;
  }

  /* ---------- Detail ---------- */
  function openDetail(i) {
    const r = ROWS[i]; if (!r) return;
    const k = kalOf(r);
    $("#dcmDetTitle").textContent = `${r.nama || "DC Mobile"} · ${r.id || ""}`;
    $("#dcmDetSub").innerHTML = `${esc(r.upt || "")} · ${esc(r.ultg || "")} ${chip(KAL[k].tone, KAL[k].label)} ${chip(kondisiTone(r.kondisi), title1(r.kondisi || "Tidak ada data"))}`;
    const sec = (h, rows) => `<section class="dsec"><h4>${h}</h4><dl class="dgrid">${rows.map(([l, v, cls]) =>
      `<div${cls ? ` class="${cls}"` : ""}><dt>${l}</dt><dd class="${v ? "" : "nil"}">${esc(v || "—")}</dd></div>`).join("")}</dl></section>`;
    $("#dcmDetBody").innerHTML =
      sec("Identitas alat", [["ID alat", r.id], ["Nama alat", r.nama], ["Nama alat (TSJ)", r.namaTsj], ["Kategori", r.kategori], ["Sub kategori", r.subKategori], ["Bidang", r.bidang],
        ["Merk", r.merk], ["Tipe", r.tipe], ["No. seri", r.sn], ["Tahun perolehan", r.tahun], ["Jumlah", r.jumlah ? `${r.jumlah} ${r.satuan || ""}` : ""], ["Harga perolehan", r.harga]]) +
      sec("Lokasi", [["UPT", r.upt], ["ULTG", r.ultg], ["Gardu induk", r.gi], ["Lokasi penyimpanan", r.lokasi]]) +
      sec("Kalibrasi", [["Status kalibrasi", r.kalibrasi], ["Sertifikat", r.sertifikat], ["Kalibrasi terakhir", r.tglKalibrasi], ["Kedaluwarsa", r.tglKadaluarsa],
        ["Rencana kalibrasi", r.rencanaKalibrasi], ["Jenis lembaga", r.jenisLembaga], ["Nama lembaga", r.lembaga, "span2"]]) +
      sec("Kondisi & keterangan", [["Kondisi", r.kondisi], ["Kondisi perbaikan", r.kondisiPerbaikan], ["Anomali", r.anomali, "span2"], ["Keterangan", r.keterangan, "wide"]]) +
      sec("Administrasi", [["No. aktiva", r.noAktiva], ["No. kontrak", r.noKontrak, "span2"], ["File IK", r.fileIk], ["File foto", r.namaFile], ["Dicatat oleh", r.dibuatOleh], ["Dibuat", r.dibuat], ["Diperbarui", r.diperbarui]]);
    $("#dcmDetail").showModal();
  }

  function render() {
    renderFilters();
    const list = filtered(false), base = filtered(true);
    renderSummary(base);
    renderMap(base);
    renderTable(list);
  }

  /* ---------- Event ---------- */
  $("#dcmUpt").addEventListener("click", e => { const b = e.target.closest("[data-upt]"); if (b) { S.upt = b.dataset.upt; S.lok = ""; render(); } });
  $("#dcmChUpt").addEventListener("click", e => { const li = e.target.closest("[data-upt]"); if (li) { S.upt = S.upt === li.dataset.upt ? "" : li.dataset.upt; S.lok = ""; render(); } });
  $("#dcmKal").addEventListener("change", e => { S.kal = e.target.value; render(); });
  $("#dcmSearch").addEventListener("input", e => { S.q = e.target.value; render(); });
  $("#dcmLocPanel").addEventListener("click", e => { const b = e.target.closest("[data-lok]"); if (b) return selectLok(b.dataset.lok); const d = e.target.closest("[data-id]"); if (d) openDetail(+d.dataset.id); });
  $("#dcmShown").addEventListener("click", e => { if (e.target.closest("[data-clear-lok]")) selectLok(""); });
  $("#dcmRows").addEventListener("click", e => { const t = e.target.closest("[data-id]"); if (t) openDetail(+t.dataset.id); });
  $("#dcmRows").addEventListener("keydown", e => { const t = e.target.closest("tr[data-id]"); if (t && e.key === "Enter") openDetail(+t.dataset.id); });
  $("#dcmDetail").addEventListener("click", e => { if (e.target === $("#dcmDetail")) $("#dcmDetail").close(); });
  const onShow = () => { if (location.hash === "#dcm") setTimeout(mapResize, 80); };
  addEventListener("hashchange", onShow);

  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  window.PAGE_UPDATED.dcm = () => DOC.diperbarui ? { date: DOC.diperbarui, title: `Data terakhir diperbarui di ${DOC.source || "file Excel"}` } : null;
  render();
  onShow();
  if (location.hash === "#dcm" && typeof setUpdated === "function") setUpdated("dcm");
})();
