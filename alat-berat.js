/* =========================================================
   MENU ALAT BERAT — Daftar Alat (data dummy)
   Sumber data: window.ALAT_BERAT_DUMMY (data/alat-berat-dummy.js)
   Status "Dipinjam" & info terakhir dipinjam diturunkan dari data peminjaman contoh.
   ========================================================= */
(function () {
  if (!$("#page-alat") || !window.ALAT_BERAT_DUMMY) return;
  const AB = {
    alat: window.ALAT_BERAT_DUMMY.alat.map(a => ({ ...a })),
    pj: window.ALAT_BERAT_DUMMY.peminjaman.map(p => ({ ...p, histori: p.histori.map(h => ({ ...h })) })),
    kat: "", kondisi: "", q: "",
    view: "tabel", lok: "", page: 1, all: false, coords: window.ALAT_BERAT_DUMMY.koordinat || {}
  };
  const KAT = {
    crane: { label: "Crane", ic: '<path d="M4 21h9M7 21V4l12 3.5M7 4 4 8M19 7.5V14"/><path d="M17 14h4v3h-4z"/>' },
    forklift: { label: "Forklift", ic: '<path d="M3 18h10M5 18V9h5l3 4v5M16 4v14M16 15h5"/><circle cx="6" cy="19" r="1.5"/><circle cx="11" cy="19" r="1.5"/>' },
    manlift: { label: "Manlift", ic: '<path d="M6 21h12M8 21v-3h8v3M9 18l6-5M15 18l-6-5M8 10h8V5H8z"/>' },
    pendukung: { label: "Alat Pendukung", ic: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z"/>' }
  };
  const ALL_IC = '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>';
  const svg = (p, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const ST_TONE = { Tersedia: "info", Dipinjam: "warn", Perbaikan: "bad" };
  const KONDISI_TONE = { "Baik": "ok", "Service Time": "info", "Rusak Ringan": "warn", "Rusak Berat": "bad" };
  const kondisiChip = k => `<span class="badge ${KONDISI_TONE[k] || "muted"}">${esc(k || "-")}</span>`;
  const byId = id => AB.alat.find(a => a.id === id);

  /* Status alat diturunkan dari peminjaman aktif */
  function statusOf(a) {
    if (a.status === "Perbaikan") return "Perbaikan";
    return AB.pj.some(p => p.alatId === a.id && p.status === "Dipinjam") ? "Dipinjam" : "Tersedia";
  }
  function lastLoan(a) {
    const l = AB.pj.filter(p => p.alatId === a.id && (p.status === "Dipinjam" || p.status === "Dikembalikan")).sort((x, y) => x.mulai < y.mulai ? 1 : -1)[0];
    return l ? { oleh: l.peminjam.replace(/^UPT /, ""), pekerjaan: l.pekerjaan } : a.terakhirDipinjam;
  }
  const KONDISI_OPT = [
    ["", "Semua Alat", () => true], ["Tersedia", "Tersedia", a => statusOf(a) === "Tersedia"], ["Dipinjam", "Sedang dipinjam", a => statusOf(a) === "Dipinjam"],
    ["Perbaikan", "Dalam perbaikan", a => statusOf(a) === "Perbaikan"], ["Layak", "Layak", a => a.layak], ["TidakLayak", "Tidak layak", a => !a.layak]
  ];

  /* ---------------- Daftar Alat ---------------- */
  const PER_PAGE = 10;
  /* Hasil filter kategori + kondisi + pencarian (belum filter lokasi) */
  function filtered() {
    const inKat = AB.alat.filter(a => !AB.kat || a.kategori === AB.kat);
    const kf = KONDISI_OPT.find(k => k[0] === AB.kondisi)[2];
    const q = AB.q.trim().toLowerCase();
    return { inKat, list: inKat.filter(kf).filter(a => !q || [a.id, a.nama, a.merk, a.kapasitas, a.noSeri, a.upt, a.lokasi].join(" ").toLowerCase().includes(q)) };
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
        <td><b>${esc(a.nama)}</b><div class="muted sm">${esc(KAT[a.kategori].label)}${a.fungsi !== KAT[a.kategori].label ? " · " + esc(a.fungsi) : ""}</div></td>
        <td>${esc(a.merk || "-")}</td><td class="num">${esc(a.kapasitas || "-")}</td><td class="num">${esc(a.tahun || "-")}</td><td><code>${esc(a.noSeri || "—")}</code></td>
        <td>${esc(a.lokasi)}<div class="muted sm">${esc(a.upt)}</div></td>
        <td><span class="badge ${ST_TONE[st]}">${st}</span></td><td><span class="badge ${a.layak ? "ok" : "bad"}">${a.layak ? "Layak" : "Tidak layak"}</span></td>
        <td>${kondisiChip(a.kondisi)}</td><td class="izin">${esc(a.suratIzin)}</td>
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

  /* ---------------- Peta lokasi alat ---------------- */
  const MAP = { map: null, layer: null, tiles: null };
  function mapInit() {
    if (MAP.map || !window.L || !$("#abMap")) return !!MAP.map;
    MAP.map = L.map("abMap", { scrollWheelZoom: false, minZoom: 5 }).setView([-7.7, 112.8], 7);
    MAP.tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, className: (typeof tdbIsDark === "function" && tdbIsDark()) ? "tiles-dark" : "",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(MAP.map);
    MAP.layer = L.layerGroup().addTo(MAP.map);
    MAP.map.on("click", () => selectLok(""));
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
    if (!MAP.fitted) { const pts = Object.values(AB.coords); if (pts.length) MAP.map.fitBounds(pts, { padding: [40, 40] }); MAP.fitted = true; }
  }
  function photo(a, big) {
    return a.foto ? `<img src="${esc(a.foto)}" alt="${esc(a.nama)}" loading="lazy">`
      : `<div class="ab-ph${big ? " big" : ""}">${svg(KAT[a.kategori].ic)}<span>${esc(KAT[a.kategori].label)}</span><small>Foto belum tersedia</small></div>`;
  }
  function card(a) {
    const st = statusOf(a), last = lastLoan(a);
    return `<article class="card ab-card" tabindex="0" role="button" aria-label="Detail ${esc(a.nama)} ${esc(a.id)}" data-id="${a.id}">
      <div class="ab-photo">${photo(a)}</div>
      <div class="ab-title"><div><h3>${esc(a.nama)}</h3><p>${esc(a.upt.replace(/^UPT /, ""))} • ${esc(a.lokasi)}</p></div><span class="badge ${ST_TONE[st]}">${st}</span></div>
      <div class="ab-tags"><span class="badge ${a.layak ? "ok" : "bad"}">${a.layak ? "Layak" : "Tidak layak"}</span><span class="badge muted">${esc(a.fungsi)}</span></div>
      <dl class="ab-dl">
        <div><dt>Merk/Type</dt><dd>${esc(a.merk || "-")}</dd></div><div><dt>Kapasitas</dt><dd>${esc(a.kapasitas || "-")}</dd></div>
        <div><dt>Tahun</dt><dd>${esc(a.tahun || "-")}</dd></div><div><dt>No. Seri</dt><dd>${esc(a.noSeri || "-")}</dd></div>
        <div><dt>Kondisi</dt><dd>${kondisiChip(a.kondisi)}</dd></div><div><dt>Surat Izin</dt><dd>${esc(a.suratIzin)}</dd></div>
      </dl>
      ${last ? `<p class="ab-last">Terakhir dipinjam oleh <b>${esc(last.oleh)}</b> untuk pekerjaan <b>${esc(last.pekerjaan)}</b>.</p>` : ""}
    </article>`;
  }
  function openDetail(id) {
    const a = byId(id); if (!a) return;
    const st = statusOf(a);
    $("#abDetailTitle").textContent = a.nama;
    $("#abDetailSub").innerHTML = `${esc(a.id)} · ${esc(a.upt)} • ${esc(a.lokasi)} <span class="badge ${ST_TONE[st]}">${st}</span>`;
    $("#abDetailBody").innerHTML = `<div class="ab-detail-top"><div class="ab-photo big">${photo(a, true)}</div>
        <dl class="dgrid ab-dgrid">${[["Kategori", KAT[a.kategori].label], ["Merk/Type", a.merk], ["Kapasitas", a.kapasitas], ["Tahun", a.tahun], ["No. Seri", a.noSeri],
          ["Fungsi", a.fungsi], ["Kelayakan", a.layak ? "Layak" : "Tidak layak"], ["Kondisi", a.kondisi], ["Surat Izin (SIA/SILO)", a.suratIzin], ["Lokasi", `${a.upt} • ${a.lokasi}`]]
          .map(([l, v]) => `<div><dt>${l}</dt><dd class="${v ? "" : "nil"}">${esc(v || "—")}</dd></div>`).join("")}</dl></div>`;
    $("#abDetail").showModal();
  }

  /* ---------------- Umum ---------------- */
  /* Pemberitahuan data contoh: tampil sekali, tidak muncul lagi setelah ditutup */
  const DEMO_KEY = "fashar-ab-demo-closed";
  let demoClosed = false;
  try { demoClosed = localStorage.getItem(DEMO_KEY) === "1"; } catch (e) { }
  $("#abDemo").hidden = demoClosed;
  $("#abDemoClose").addEventListener("click", () => { $("#abDemo").hidden = true; try { localStorage.setItem(DEMO_KEY, "1"); } catch (e) { } });

  $("#abKat").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) { AB.kat = b.dataset.k; AB.kondisi = AB.kondisi; renderDaftar(); } });
  $("#abKondisi").addEventListener("change", e => { AB.kondisi = e.target.value; renderDaftar(); });
  $("#abSearch").addEventListener("input", e => { AB.q = e.target.value; renderDaftar(); });
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
