/* =========================================================
   MENU ALAT BERAT — Daftar Alat
   Sumber data: window.ALAT_BERAT (data/alat-berat.js, export aplikasi WARNOTO,
   dibuat oleh tools/xlsx_alat_berat_to_js.py). Foto: assets/alat-berat/<ID>.jpg
   ========================================================= */
(function () {
  const SRC = window.ALAT_BERAT || window.ALAT_BERAT_DUMMY;
  if (!$("#page-alat") || !SRC) return;
  const AB = {
    alat: SRC.alat.map(a => ({ ...a })),
    pj: (SRC.peminjaman || []).map(p => ({ ...p, histori: (p.histori || []).map(h => ({ ...h })) })),
    kat: "", kondisi: "", q: "",
    view: "tabel", lok: "", page: 1, all: false, coords: SRC.koordinat || {}
  };
  const KAT = {
    crane: { label: "Crane", ic: '<path d="M4 21h9M7 21V4l12 3.5M7 4 4 8M19 7.5V14"/><path d="M17 14h4v3h-4z"/>' },
    forklift: { label: "Forklift", ic: '<path d="M3 18h10M5 18V9h5l3 4v5M16 4v14M16 15h5"/><circle cx="6" cy="19" r="1.5"/><circle cx="11" cy="19" r="1.5"/>' },
    manlift: { label: "Manlift", ic: '<path d="M6 21h12M8 21v-3h8v3M9 18l6-5M15 18l-6-5M8 10h8V5H8z"/>' },
    pendukung: { label: "Alat Pendukung", ic: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z"/>' },
    truck: { label: "Truck", ic: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>' }
  };
  const ALL_IC = '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>';
  const svg = (p, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const ST_TONE = { Tersedia: "info", Dipinjam: "warn", Perbaikan: "bad" };
  const KONDISI_TONE = SRC === window.ALAT_BERAT ? { "Baik": "ok", "Perlu Service": "warn", "Rusak": "bad" }
    : { "Baik": "ok", "Service Time": "info", "Rusak Ringan": "warn", "Rusak Berat": "bad" };
  const kondisiChip = (k, note) => `<span class="badge ${KONDISI_TONE[k] || "muted"}"${note ? ` title="${esc(note)}"` : ""}>${esc(k || "-")}</span>`;
  const katLabel = a => (KAT[a.kategori] || KAT.pendukung).label;
  const byId = id => AB.alat.find(a => a.id === id);

  /* Status alat diturunkan dari peminjaman aktif */
  function statusOf(a) {
    if (a.status === "Perbaikan") return "Perbaikan";
    if (a.status === "Dipinjam") return "Dipinjam";
    return AB.pj.some(p => p.alatId === a.id && p.status === "Dipinjam") ? "Dipinjam" : "Tersedia";
  }
  function lastLoan(a) {
    const l = AB.pj.filter(p => p.alatId === a.id && (p.status === "Dipinjam" || p.status === "Dikembalikan")).sort((x, y) => x.mulai < y.mulai ? 1 : -1)[0];
    return l ? { oleh: l.peminjam.replace(/^UPT /, ""), pekerjaan: l.pekerjaan } : a.terakhirDipinjam;
  }
  const KONDISI_OPT = [
    ["", "Semua Alat", () => true], ["Tersedia", "Tersedia", a => statusOf(a) === "Tersedia"], ["Dipinjam", "Sedang dipinjam", a => statusOf(a) === "Dipinjam"],
    ["Perbaikan", "Rusak / perbaikan", a => statusOf(a) === "Perbaikan"], ["Layak", "Layak", a => a.layak], ["TidakLayak", "Tidak layak", a => !a.layak]
  ];

  /* ---------------- Daftar Alat ---------------- */
  const PER_PAGE = 10;
  /* Hasil filter kategori + kondisi + pencarian (belum filter lokasi) */
  function filtered() {
    const inKat = AB.alat.filter(a => !AB.kat || a.kategori === AB.kat);
    const kf = KONDISI_OPT.find(k => k[0] === AB.kondisi)[2];
    const q = AB.q.trim().toLowerCase();
    return { inKat, list: inKat.filter(kf).filter(a => !q || [a.id, a.nama, a.merk, a.kapasitas, a.noSeri, a.upt, a.lokasi, a.kondisiCatatan, a.fungsi].join(" ").toLowerCase().includes(q)) };
  }
  function renderDaftar(keepPage) {
    if (!keepPage) AB.page = 1;
    const { inKat, list: base } = filtered();
    const list = base.filter(a => !AB.lok || a.lokasi === AB.lok);
    const cnt = k => AB.alat.filter(a => !k || a.kategori === k).length;
    $("#abKat").innerHTML = [["", "Semua", ALL_IC], ...Object.entries(KAT).map(([k, v]) => [k, v.label, v.ic])]
      .map(([k, l, ic]) => `<button type="button" class="ab-chip${AB.kat === k ? " on" : ""}" data-k="${k}" aria-pressed="${AB.kat === k}">${svg(ic)}<span>${l}</span><em>${cnt(k)}</em></button>`).join("");
    $("#abKondisi").innerHTML = KONDISI_OPT.map(([v, l, f]) => `<option value="${v}"${AB.kondisi === v ? " selected" : ""}>${l} (${inKat.filter(f).length})</option>`).join("");
    $("#abShown").innerHTML = `Menampilkan <b>${list.length}</b> alat${AB.lok ? ` di <b>${esc(AB.lok)}</b> <button type="button" class="linkbtn" data-clear-lok>hapus filter lokasi</button>` : ""}`;
    renderMap(base);
    renderCharts(list);
    // tampilan
    $("#abTableCard").hidden = AB.view !== "tabel"; $("#abGrid").hidden = AB.view !== "kartu";
    document.querySelectorAll("#abView button").forEach(b => { const on = b.dataset.v === AB.view; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    if (AB.view === "kartu") {
      $("#abGrid").innerHTML = list.length ? list.map(card).join("") : `<div class="card ab-empty">Tidak ada alat yang cocok dengan filter.</div>`;
      return;
    }
    const per = AB.all ? Math.max(list.length, 1) : PER_PAGE, pages = Math.max(1, Math.ceil(list.length / per));
    AB.page = Math.min(Math.max(1, AB.page), pages);
    const from = (AB.page - 1) * per, rows = list.slice(from, from + per);
    $("#abRows").innerHTML = rows.map((a, i) => {
      const st = statusOf(a);
      return `<tr data-id="${a.id}" tabindex="0"><td class="num no">${from + i + 1}</td><td class="muted">${a.id}</td>
        <td><b>${esc(a.nama)}</b><div class="muted sm">${esc(katLabel(a))}${a.fungsi && a.fungsi !== katLabel(a) ? " · " + esc(a.fungsi) : ""}${a.foto ? " · 📷" : ""}</div></td>
        <td>${esc(a.merk || "-")}</td><td class="num">${esc(a.kapasitas || "-")}</td><td class="num">${esc(a.tahun || "-")}</td><td><code>${esc(a.noSeri || "—")}</code></td>
        <td>${esc(a.lokasi)}<div class="muted sm">${esc(a.upt)}</div></td>
        <td><span class="badge ${ST_TONE[st]}">${st}</span></td><td><span class="badge ${a.layak ? "ok" : "bad"}">${a.layak ? "Layak" : "Tidak layak"}</span></td>
        <td>${kondisiChip(a.kondisi, a.kondisiCatatan)}${a.kondisiCatatan ? `<div class="muted sm ab-note">${esc(a.kondisiCatatan)}</div>` : ""}</td><td class="izin">${izinCell(a)}</td>
        <td class="act"><button type="button" class="btn ghost sm" data-id="${a.id}">Detail</button></td></tr>`;
    }).join("");
    $("#abEmpty").hidden = list.length > 0;
    $("#abTCount").textContent = list.length ? `Menampilkan ${from + 1}–${from + rows.length} dari ${list.length} alat` : "Menampilkan 0 alat";
    const nums = [];
    for (let p = 1; p <= pages; p++) { if (p === 1 || p === pages || Math.abs(p - AB.page) <= 1) nums.push(p); else if (nums[nums.length - 1] !== "…") nums.push("…"); }
    $("#abPager").innerHTML = pages <= 1 ? "" : `<button type="button" class="pg" data-p="${AB.page - 1}" ${AB.page === 1 ? "disabled" : ""} aria-label="Halaman sebelumnya">‹</button>` +
      nums.map(p => p === "…" ? `<span class="pg-gap">…</span>` : `<button type="button" class="pg${p === AB.page ? " on" : ""}" data-p="${p}"${p === AB.page ? ' aria-current="page"' : ""}>${p}</button>`).join("") +
      `<button type="button" class="pg" data-p="${AB.page + 1}" ${AB.page === pages ? "disabled" : ""} aria-label="Halaman berikutnya">›</button>`;
    $("#abAll").hidden = list.length <= PER_PAGE;
    $("#abAll").textContent = AB.all ? `Tampilkan ${PER_PAGE} per halaman` : `Tampilkan semua (${list.length})`;
  }

  /* ---------------- Ringkasan & grafik ---------------- */
  const ST_COLOR = { Tersedia: "var(--primary)", Dipinjam: "var(--p2)", Perbaikan: "var(--p1)" };
  const KD_COLOR = { "Baik": "var(--ok)", "Service Time": "var(--primary)", "Rusak Ringan": "var(--p2)", "Rusak Berat": "var(--p1)" };
  const izinOf = a => a.izin || (/berlaku/i.test(a.suratIzin || "") ? "Berlaku" : /kedaluwarsa|kadaluarsa/i.test(a.suratIzin || "") ? "Kedaluwarsa" : "Belum ada data");
  const IZIN_KEYS = a => a.izin !== undefined ? ["Berlaku", "Ada dokumen", "Perlu perpanjangan", "Kedaluwarsa", "Tidak ada"] : ["Berlaku", "Kedaluwarsa", "Belum ada data"];
  const IZIN_TL = ["Kedaluwarsa", "Perlu perpanjangan"]; // perlu tindak lanjut
  const IZIN_TONE = { "Berlaku": "ok", "Ada dokumen": "info", "Perlu perpanjangan": "warn", "Kedaluwarsa": "bad" };
  function izinCell(a) {
    const k = izinOf(a), tone = IZIN_TONE[k];
    const t = tone ? `<span class="badge ${tone}">${esc(a.suratIzin || k)}</span>` : `<span class="muted">${esc(a.suratIzin || "—")}</span>`;
    return a.suratIzinUrl ? `${t} <a class="linkbtn" href="${esc(a.suratIzinUrl)}" target="_blank" rel="noopener">Lihat</a>` : t;
  }
  const umurOf = a => { const t = parseInt(a.tahun, 10); if (!t) return "Tidak diketahui"; const u = new Date().getFullYear() - t; return u < 10 ? "< 10 tahun" : u < 20 ? "10–19 tahun" : u < 30 ? "20–29 tahun" : "≥ 30 tahun"; };
  const countBy = (list, fn, keys) => { const m = new Map(keys.map(k => [k, 0])); list.forEach(a => { const k = fn(a); m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()]; };
  const pctTxt = (n, t) => t ? Math.round(n / t * 100) + "%" : "0%";
  function stackRow(label, parts, total, max, extra) {
    return `<li${extra || ""}><span class="bl">${esc(label)}</span><span class="bt ab-stk" style="--w:${total / max * 100}%">${parts.filter(p => p[1]).map(([k, n, c]) =>
      `<i style="flex:${n};background:${c}" title="${esc(k)}: ${n}"></i>`).join("")}</span><b>${total}</b></li>`;
  }
  function renderCharts(list) {
    const n = list.length, st = s => list.filter(a => statusOf(a) === s).length;
    const izinBad = list.filter(a => SRC === window.ALAT_BERAT ? IZIN_TL.includes(izinOf(a)) : izinOf(a) !== "Berlaku").length;
    $("#abKpi").innerHTML = [["Total alat", n, "tower", "primary"], ["Tersedia", st("Tersedia"), "check", "p3"], ["Dipinjam", st("Dipinjam"), "out", "p2"],
      ["Rusak / perbaikan", st("Perbaikan"), "wrench", "p1"], ["Tidak layak", list.filter(a => !a.layak).length, "x", "p1"], ["Surat izin perlu tindak lanjut", izinBad, "doc", "p2"]]
      .map(([l, v, ic, t]) => `<div class="card kpi tone-${t}"><div class="kpi-icon">${icon(ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div>${l !== "Total alat" ? `<div class="kpi-sub">${pctTxt(v, n)} dari total</div>` : ""}</div></div>`).join("");
    $("#abLegStatus").innerHTML = Object.entries(ST_COLOR).map(([k, c]) => `<span><i class="swatch" style="background:${c}"></i>${k}</span>`).join("");
    // per kategori
    const kats = Object.entries(KAT).map(([k, v]) => { const xs = list.filter(a => a.kategori === k); return [k, v.label, xs]; }).filter(x => x[2].length);
    const maxK = Math.max(1, ...kats.map(x => x[2].length));
    $("#abChKat").innerHTML = kats.length ? `<ul class="bars ab-bars">${kats.map(([k, l, xs]) => stackRow(l, Object.keys(ST_COLOR).map(s => [s, xs.filter(a => statusOf(a) === s).length, ST_COLOR[s]]), xs.length, maxK,
      ` data-kat="${k}" class="clickable${AB.kat === k ? " on" : ""}" title="Filter ${esc(l)}"`)).join("")}</ul>` : `<p class="dnil">Tidak ada data.</p>`;
    // kondisi (donut) + kelayakan
    const kd = countBy(list, a => a.kondisi, Object.keys(KD_COLOR)).filter(x => x[1]);
    let acc = 0;
    const segs = kd.map(([k, v]) => { const p = v / Math.max(n, 1) * 100, s = `<circle cx="50" cy="50" r="40" pathLength="100" style="stroke:${KD_COLOR[k] || "var(--text-3)"};stroke-dasharray:${Math.max(p - .6, .4)} ${100 - p + .6};stroke-dashoffset:${-acc}"><title>${esc(k)}: ${v}</title></circle>`; acc += p; return s; }).join("");
    const layak = list.filter(a => a.layak).length;
    $("#abChKondisi").innerHTML = n ? `<svg class="donut" viewBox="0 0 100 100" role="img" aria-label="Komposisi kondisi alat"><circle cx="50" cy="50" r="40" class="d-track"/>${segs}
        <text x="50" y="49" class="d-total">${n}</text><text x="50" y="61" class="d-cap">alat</text></svg>
      <div class="ab-donut-legend"><ul class="plist">${kd.map(([k, v]) => `<li><i class="swatch" style="background:${KD_COLOR[k]}"></i><span>${esc(k)}</span><b>${v}</b><em>${pctTxt(v, n)}</em></li>`).join("")}</ul>
        <div class="ab-layak"><span>Kelayakan</span><div class="split-bar"><i style="flex:${layak};background:var(--ok)" title="Layak: ${layak}"></i><i style="flex:${n - layak};background:var(--p1)" title="Tidak layak: ${n - layak}"></i></div>
        <small><b>${layak}</b> layak · <b>${n - layak}</b> tidak layak</small></div></div>` : `<p class="dnil">Tidak ada data.</p>`;
    // per UPT
    const ups = [...new Set(list.map(a => a.upt))].map(u => [u, list.filter(a => a.upt === u)]).sort((a, b) => b[1].length - a[1].length);
    const maxU = Math.max(1, ...ups.map(x => x[1].length));
    $("#abChUpt").innerHTML = ups.length ? `<ul class="bars ab-bars">${ups.map(([u, xs]) => stackRow(u.replace(/^UPT /, ""), Object.keys(ST_COLOR).map(s => [s, xs.filter(a => statusOf(a) === s).length, ST_COLOR[s]]), xs.length, maxU)).join("")}</ul>` : `<p class="dnil">Tidak ada data.</p>`;
    // surat izin & umur
    const iz = countBy(list, izinOf, IZIN_KEYS(list[0] || {})), IZ_C = { "Berlaku": "var(--ok)", "Ada dokumen": "var(--primary)", "Perlu perpanjangan": "var(--p2)", "Kedaluwarsa": "var(--p1)", "Belum ada data": "var(--text-3)", "Tidak ada": "var(--text-3)" };
    const um = countBy(list, umurOf, ["< 10 tahun", "10–19 tahun", "20–29 tahun", "≥ 30 tahun", "Tidak diketahui"]), UM_C = ["var(--ok)", "var(--primary)", "var(--p2)", "var(--p1)", "var(--text-3)"];
    const mini = (title, rows, colorOf) => { const mx = Math.max(1, ...rows.map(r => r[1])); return `<div><h5>${title}</h5><ul class="bars ab-bars">${rows.map(([k, v], i) =>
      `<li><span class="bl">${esc(k)}</span><span class="bt"><i style="width:${v / mx * 100}%;background:${colorOf(k, i)}"></i></span><b>${v}</b></li>`).join("")}</ul></div>`; };
    $("#abChIzin").innerHTML = mini("Surat izin (SIA/SILO)", iz, k => IZ_C[k]) + mini("Umur alat", um, (k, i) => UM_C[i]);
  }

  /* ---------------- Peta lokasi alat ---------------- */
  const MAP = { map: null, layer: null, tiles: null };
  function mapInit() {
    if (MAP.map || !window.L || !$("#abMap")) return !!MAP.map;
    MAP.map = L.map("abMap", { scrollWheelZoom: false, minZoom: 5 }).setView([-7.7, 112.8], 7);
    MAP.tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, className: (typeof tdbIsDark === "function" && tdbIsDark()) ? "tiles-dark" : "",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(MAP.map);
    MAP.layer = L.layerGroup().addTo(MAP.map);
    MAP.map.on("click", () => selectLok(""));
    /* Tombol "Tampilan awal": kembalikan peta ke posisi semula (semua lokasi terlihat) */
    const Home = L.Control.extend({ options: { position: "topleft" }, onAdd() {
      const box = L.DomUtil.create("div", "leaflet-bar map-home");
      box.innerHTML = `<a href="#" role="button" title="Kembalikan tampilan peta" aria-label="Kembalikan tampilan peta ke semula"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg></a>`;
      L.DomEvent.disableClickPropagation(box);
      L.DomEvent.on(box.querySelector("a"), "click", e => { L.DomEvent.preventDefault(e); mapHome(true); });
      return box;
    } });
    MAP.map.addControl(new Home());
    return true;
  }
  function locGroups(base) {
    const m = new Map();
    base.forEach(a => { if (!m.has(a.lokasi)) m.set(a.lokasi, { lokasi: a.lokasi, upt: a.upt, items: [] }); m.get(a.lokasi).items.push(a); });
    return [...m.values()].sort((x, y) => y.items.length - x.items.length);
  }
  const avail = g => g.items.filter(a => statusOf(a) === "Tersedia").length;
  function renderMap(base) {
    const groups = locGroups(base), ok = mapInit();
    $("#abMapFallback").hidden = ok;
    if (ok) {
      MAP.layer.clearLayers();
      groups.forEach(g => {
        const c = AB.coords[g.lokasi]; if (!c) return;
        const col = avail(g) ? "var(--ok)" : "var(--p2)";
        L.marker(c, { title: `${g.lokasi} · ${g.items.length} alat`, keyboard: true, riseOnHover: true,
          icon: L.divIcon({ className: "tm-icon", iconSize: [34, 34], iconAnchor: [17, 17], html: `<span class="tm-pin${AB.lok === g.lokasi ? " sel" : ""}" style="--c:${col}">${g.items.length}</span>` }) })
          .on("click", e => { L.DomEvent.stopPropagation(e); selectLok(g.lokasi); })
          .bindTooltip(`<b>${esc(g.lokasi)}</b><br>${esc(g.upt)} · ${g.items.length} alat (${avail(g)} tersedia)`, { direction: "top", offset: [0, -16] })
          .addTo(MAP.layer);
      });
    }
    const sel = AB.lok && groups.find(g => g.lokasi === AB.lok);
    if (!sel) {
      $("#abLocPanel").innerHTML = `<div class="lp-head"><h3>${groups.length} lokasi penyimpanan</h3><p>Klik titik di peta atau pilih lokasi untuk memfilter tabel. <span class="dot" style="background:var(--ok)"></span> ada alat tersedia · <span class="dot" style="background:var(--p2)"></span> tidak ada yang tersedia</p></div>
        <ul class="lp-list">${groups.map(g => `<li><button type="button" data-lok="${esc(g.lokasi)}"><i class="dot" style="background:${avail(g) ? "var(--ok)" : "var(--p2)"}"></i>
          <span><b>${esc(g.lokasi)}</b><small>${esc(g.upt)} · ${avail(g)} tersedia</small></span><em>${g.items.length}</em></button></li>`).join("")}</ul>`;
    } else {
      const byKat = Object.entries(KAT).map(([k, v]) => [v, sel.items.filter(a => a.kategori === k).length]).filter(x => x[1]);
      const n = s => sel.items.filter(a => statusOf(a) === s).length;
      $("#abLocPanel").innerHTML = `<div class="lp-head"><button type="button" class="linkbtn lp-back" data-lok="">‹ Semua lokasi</button><h3>${esc(sel.lokasi)}</h3><p>${esc(sel.upt)} · ${sel.items.length} alat</p>
          ${lpChips("Kelayakan", [["Layak", "ok", sel.items.filter(x => x.layak).length], ["Tidak layak", "bad", sel.items.filter(x => !x.layak).length]])}
          ${lpChips("Kondisi", Object.keys(KONDISI_TONE).map(k => [k, KONDISI_TONE[k], sel.items.filter(x => x.kondisi === k).length]))}</div>
        <ul class="lp-cat">${byKat.map(([v, c]) => `<li><span>${svg(v.ic)}${v.label}</span><b>${c}</b></li>`).join("")}</ul>`;
    }
  }
  /* Baris chip ringkasan di panel lokasi; nilai 0 ditampilkan redup */
  const lpChips = (label, items) => `<div class="lp-chiprow"><span class="lp-chiplabel">${label}</span><div class="lp-counts">${items
    .map(([l, tone, c]) => `<span class="badge ${tone}${c ? "" : " zero"}">${c} ${esc(l)}</span>`).join("")}</div></div>`;
  function selectLok(lok) {
    AB.lok = lok || "";
    renderDaftar();
    const c = AB.lok && AB.coords[AB.lok];
    if (MAP.map) { if (c) MAP.map.flyTo(c, Math.max(MAP.map.getZoom(), 10), { duration: .6 }); }
  }
  function mapResize() {
    if (!MAP.map) return;
    MAP.map.invalidateSize();
    if (!MAP.fitted) { mapHome(false); MAP.fitted = true; }
  }
  function mapHome(animate) {
    const pts = Object.values(AB.coords); if (!MAP.map || !pts.length) return;
    animate ? MAP.map.flyToBounds(pts, { padding: [40, 40], duration: .6 }) : MAP.map.fitBounds(pts, { padding: [40, 40] });
  }
  function photo(a, big) {
    // foto dari export WARNOTO berupa thumbnail kecil: tampil utuh (contain) di atas latar foto yang diburamkan
    return a.foto ? `<div class="ab-img" style="--bg:url('${esc(a.foto)}')"><img src="${esc(a.foto)}" alt="${esc(a.nama)}" loading="lazy"></div>`
      : `<div class="ab-ph${big ? " big" : ""}">${svg((KAT[a.kategori] || KAT.pendukung).ic)}<span>${esc(katLabel(a))}</span><small>Foto belum tersedia</small></div>`;
  }
  function card(a) {
    const st = statusOf(a), last = lastLoan(a);
    return `<article class="card ab-card" tabindex="0" role="button" aria-label="Detail ${esc(a.nama)} ${esc(a.id)}" data-id="${a.id}">
      <div class="ab-photo">${photo(a)}</div>
      <div class="ab-title"><div><h3>${esc(a.nama)}</h3><p>${esc(a.upt.replace(/^UPT /, ""))} • ${esc(a.lokasi)}</p></div><span class="badge ${ST_TONE[st]}">${st}</span></div>
      <div class="ab-tags"><span class="badge ${a.layak ? "ok" : "bad"}">${a.layak ? "Layak" : "Tidak layak"}</span>${a.fungsi ? `<span class="badge muted">${esc(a.fungsi)}</span>` : ""}</div>
      <dl class="ab-dl">
        <div><dt>Merk/Type</dt><dd>${esc(a.merk || "-")}</dd></div><div><dt>Kapasitas</dt><dd>${esc(a.kapasitas || "-")}</dd></div>
        <div><dt>Tahun</dt><dd>${esc(a.tahun || "-")}</dd></div><div><dt>No. Seri</dt><dd>${esc(a.noSeri || "-")}</dd></div>
        <div><dt>Kondisi</dt><dd>${kondisiChip(a.kondisi, a.kondisiCatatan)}</dd></div><div><dt>Surat Izin</dt><dd>${esc(a.suratIzin || "—")}</dd></div>
      </dl>
      ${last ? `<p class="ab-last">Terakhir dipinjam oleh <b>${esc(last.oleh)}</b> untuk pekerjaan <b>${esc(last.pekerjaan)}</b>.</p>` : ""}
    </article>`;
  }
  function openDetail(id) {
    const a = byId(id); if (!a) return;
    const st = statusOf(a);
    $("#abDetailTitle").textContent = a.nama;
    $("#abDetailSub").innerHTML = `${esc(a.id)} · ${esc(a.upt)} • ${esc(a.lokasi)} <span class="badge ${ST_TONE[st]}">${st}</span>`;
    $("#abDetailBody").innerHTML = `<div class="ab-detail-top"><div class="ab-photo big">${a.foto ? `<a href="${esc(a.foto)}" target="_blank" rel="noopener" title="Buka foto ukuran penuh">${photo(a, true)}</a>` : photo(a, true)}</div>
        <dl class="dgrid ab-dgrid">${[["Kategori", katLabel(a)], ["Jenis aset", a.jenisAset], ["Merk/Type", a.merk], ["Kapasitas", a.kapasitas], ["Tahun", a.tahun], ["No. Seri", a.noSeri],
          ["Fungsi", a.fungsi], ["Jumlah", a.jumlah ? `${a.jumlah} ${a.satuan || ""}` : ""], ["Status alat", a.statusAlat], ["Kelayakan", a.layak ? "Layak" : "Tidak layak"], ["Kondisi", a.kondisi],
          ["Catatan kondisi", a.kondisiCatatan], ["Surat Izin (SIA/SILO)", a.suratIzin], ["Spesifikasi", a.spesifikasi], ["Lokasi", `${a.upt} • ${a.lokasi}`]]
          .filter(([l, v]) => v || !["Jenis aset", "Status alat", "Catatan kondisi", "Spesifikasi", "Jumlah"].includes(l))
          .map(([l, v]) => `<div${l === "Catatan kondisi" || l === "Lokasi" ? ' class="span2"' : ""}><dt>${l}</dt><dd class="${v ? "" : "nil"}">${esc(v || "—")}${l === "Surat Izin (SIA/SILO)" && a.suratIzinUrl ? ` · <a class="linkbtn" href="${esc(a.suratIzinUrl)}" target="_blank" rel="noopener">Lihat dokumen</a>` : ""}</dd></div>`).join("")}</dl></div>`;
    $("#abDetail").showModal();
  }

  /* ---------------- Umum ---------------- */
  /* Sumber data: export aplikasi WARNOTO (tanggal export = tanggal "Diperbarui") */
  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  const synced = SRC === window.ALAT_BERAT;
  window.PAGE_UPDATED.alat = () => synced
    ? { date: SRC.generated, title: `Sinkron dari ${SRC.sumber || "aplikasi WARNOTO"} · file ${SRC.source}` }
    : { label: "Menunggu sinkronisasi WARNOTO", pending: true, title: "Menunggu sinkronisasi data dari aplikasi WARNOTO" };
  if (synced) {
    const nf = AB.alat.filter(a => a.foto).length;
    $("#abSync").classList.add("done");
    $("#abSync").innerHTML = `<span class="ab-sync-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></span>
      <div><b>Data tersinkron dari ${esc(SRC.sumber || "Aplikasi WARNOTO")}</b><p>Export inventaris ${esc(fmtTanggal(SRC.generated))} · ${AB.alat.length} alat di ${new Set(AB.alat.map(a => a.upt)).size} UPT · ${nf} foto · sumber: ${esc(SRC.source)}</p></div>`;
  }
  if (location.hash === "#alat" && typeof setUpdated === "function") setUpdated("alat");

  $("#abKat").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) { AB.kat = b.dataset.k; AB.kondisi = AB.kondisi; renderDaftar(); } });
  $("#abKondisi").addEventListener("change", e => { AB.kondisi = e.target.value; renderDaftar(); });
  $("#abSearch").addEventListener("input", e => { AB.q = e.target.value; renderDaftar(); });
  $("#abChKat").addEventListener("click", e => { const li = e.target.closest("[data-kat]"); if (li) { AB.kat = AB.kat === li.dataset.kat ? "" : li.dataset.kat; renderDaftar(); } });
  $("#abView").addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { AB.view = b.dataset.v; renderDaftar(); } });
  $("#abPager").addEventListener("click", e => { const b = e.target.closest("button[data-p]"); if (b && !b.disabled) { AB.page = +b.dataset.p; renderDaftar(true); } });
  $("#abAll").addEventListener("click", () => { AB.all = !AB.all; renderDaftar(); });
  $("#abRows").addEventListener("click", e => { const t = e.target.closest("[data-id]"); if (t) openDetail(t.dataset.id); });
  $("#abRows").addEventListener("keydown", e => { const t = e.target.closest("tr[data-id]"); if (t && e.key === "Enter") openDetail(t.dataset.id); });
  $("#abLocPanel").addEventListener("click", e => { const b = e.target.closest("[data-lok]"); if (b) selectLok(b.dataset.lok); });
  $("#abShown").addEventListener("click", e => { if (e.target.closest("[data-clear-lok]")) selectLok(""); });
  const onShow = () => { if (location.hash === "#alat") setTimeout(mapResize, 80); };
  addEventListener("hashchange", onShow);
  $("#abGrid").addEventListener("click", e => { const c = e.target.closest("[data-id]"); if (c) openDetail(c.dataset.id); });
  $("#abGrid").addEventListener("keydown", e => { const c = e.target.closest("[data-id]"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openDetail(c.dataset.id); } });
  $("#abDetail").addEventListener("click", e => { if (e.target === $("#abDetail")) $("#abDetail").close(); });
  renderDaftar();
  onShow();
  window.abMapTheme = () => { if (MAP.tiles) MAP.tiles.getContainer && MAP.tiles.getContainer().classList.toggle("tiles-dark", typeof tdbIsDark === "function" && tdbIsDark()); };
})();
