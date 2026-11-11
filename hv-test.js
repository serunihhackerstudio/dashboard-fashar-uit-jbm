/* =========================================================
   MENU HV TEST — alat uji tegangan tinggi
   Data live: sheet "7. ALAT HV TEST" (Apps Script ?action=hv), cadangan: data/hv-test.js
   Tambah / edit / foto dengan kode akses (wajib setiap perubahan).
   ========================================================= */
(function () {
  const sec = $("#page-hv");
  if (!sec) return;
  const API = typeof TDB_API === "string" ? TDB_API : "";
  const SHEET = "7. ALAT HV TEST";
  const DOC = window.HV_TEST || { rows: [] };
  const K = { NORMAL: { label: "Normal", tone: "ok", color: "var(--ok)" }, ANOMALI: { label: "Anomali", tone: "warn", color: "var(--p2)" },
    RUSAK: { label: "Rusak", tone: "bad", color: "var(--p1)" }, "": { label: "Belum diisi", tone: "muted", color: "var(--text-3)" } };
  const kOf = r => K[String(r.kondisi || "").toUpperCase()] ? String(r.kondisi || "").toUpperCase() : "";
  const S = { rows: DOC.rows.slice(), q: "", k: "", live: false, updated: null, editing: null, photos: [], cover: null, folder: null, phBusy: "", phErr: "", batch: false };
  const yearOf = r => { const m = String(r.tahun || "").match(/(19|20)\d{2}/); return m ? +m[0] : null; };
  const umur = r => { const y = yearOf(r); return y ? new Date().getFullYear() - y : null; };
  const lines = t => String(t || "").split("\n").map(x => x.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
  const chip = r => { const k = K[kOf(r)]; return `<span class="badge ${k.tone}">${k.label}</span>`; };
  const svg = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const BOLT = '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>';

  sec.innerHTML = `
   <div class="tdb-bar card ab-bar">
    <div class="tdb-bar-info"><span class="chip sync" id="hvSync"></span><span class="muted sm" id="hvSyncNote"></span></div>
    <div class="tdb-actions"><button class="btn ghost" type="button" id="hvReload" hidden>${svg('<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/>')}Muat ulang</button>
     <button class="btn primary" type="button" id="hvAddBtn" hidden>${svg('<path d="M12 5v14M5 12h14"/>')}Tambah alat HV test</button></div>
   </div>
   <div class="ab-kpis" id="hvKpi"></div>
   <div class="ab-filters hv-filters">
    <div class="ab-chips" id="hvK" role="group" aria-label="Filter kondisi"></div>
    <div class="ab-filter-right"><div class="search"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="hvSearch" type="search" placeholder="Cari nama, merek, tipe, lokasi…" aria-label="Cari alat HV test"></div></div>
   </div>
   <div class="hv-grid" id="hvGrid"></div>
   <div class="grid g2 ab-charts">
    <div class="card"><div class="card-head"><div><h3>Kondisi alat</h3><p>Komposisi kondisi alat HV test</p></div></div><div class="card-body ab-donut-wrap" id="hvChK"></div></div>
    <div class="card"><div class="card-head"><div><h3>Umur alat</h3><p>Berdasarkan tahun pembuatan / perolehan</p></div></div><div class="card-body" id="hvChU"></div></div>
   </div>
   <div class="card hv-table-card">
    <div class="table-wrap ab-table hv-table"><table class="table"><thead><tr><th class="num">No</th><th>Nama alat</th><th>Merek / Tipe</th><th>Kondisi</th><th class="num">Tahun</th><th>Lokasi</th><th>Instruksi kerja</th><th></th></tr></thead>
     <tbody id="hvRows"></tbody></table><div class="empty" id="hvEmpty" hidden>Tidak ada alat yang cocok dengan filter.</div></div>
    <div class="card-foot tdb-foot"><span class="muted" id="hvCount"></span><span class="muted sm" id="hvSrc"></span></div>
   </div>`;
  document.body.insertAdjacentHTML("beforeend", `
  <dialog class="modal modal-lg" id="hvDetail" aria-labelledby="hvDetTitle"><div class="modal-wrap">
   <header class="modal-head"><div><h3 id="hvDetTitle"></h3><p id="hvDetSub"></p></div><button class="icon-btn" type="button" onclick="this.closest('dialog').close()" aria-label="Tutup">${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button></header>
   <div class="modal-body" id="hvDetBody"></div>
   <footer class="modal-foot"><div class="modal-btns"><button class="btn ghost" type="button" onclick="this.closest('dialog').close()">Tutup</button></div></footer></div></dialog>
  <dialog class="modal modal-lg" id="hvEditDlg" aria-labelledby="hvEditTitle"><form class="modal-wrap" id="hvEditForm" novalidate>
   <header class="modal-head"><div><h3 id="hvEditTitle"></h3><p id="hvEditSub"></p></div><button class="icon-btn" type="button" onclick="this.closest('dialog').close()" aria-label="Tutup">${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button></header>
   <div class="modal-body"><section class="dsec ph-sec ab-ph-sec" id="hvPhSec"></section>
    <div class="form-grid">
     <label class="fld wide"><span>Nama alat <em>*</em></span><input id="hvf_nama" required autocomplete="off" placeholder="mis. AC HV TEST 150 KV"></label>
     <label class="fld"><span>Merek</span><input id="hvf_merk" autocomplete="off"></label>
     <label class="fld"><span>Tipe</span><input id="hvf_tipe" autocomplete="off"></label>
     <label class="fld"><span>Kondisi</span><select id="hvf_kondisi"><option>NORMAL</option><option>ANOMALI</option><option>RUSAK</option></select></label>
     <label class="fld"><span>Tahun</span><input id="hvf_tahun" autocomplete="off" placeholder="mis. 2019 atau 1990-an"></label>
     <label class="fld wide"><span>Lokasi <small>satu baris per lokasi / bagian alat</small></span><textarea id="hvf_lokasi" rows="2"></textarea></label>
     <label class="fld wide"><span>Keterangan <small>satu baris per catatan</small></span><textarea id="hvf_keterangan" rows="4"></textarea></label>
     <label class="fld"><span>Instruksi kerja (nama file)</span><input id="hvf_ik" autocomplete="off" placeholder="mis. IK HV TEST 150 KV.pdf"></label>
     <label class="fld wide2"><span>Link instruksi kerja</span><input id="hvf_ikUrl" type="url" autocomplete="off" placeholder="https://drive.google.com/…"></label>
    </div></div>
   <footer class="modal-foot">
    <div class="fld token"><label class="tok-in"><span>Kode akses edit</span><input type="password" id="hv_token" autocomplete="new-password" placeholder="Kode dari admin"><small class="hint">Wajib diisi setiap kali menyimpan perubahan.</small></label></div>
    <p class="form-err" id="hvEditErr" role="alert" hidden></p>
    <div class="modal-btns"><button class="btn ghost" type="button" onclick="this.closest('dialog').close()">Batal</button><button class="btn primary" type="submit" id="hvSave">Simpan</button></div>
   </footer></form></dialog>`);

  /* ---------- Render ---------- */
  function list() {
    const q = S.q.trim().toLowerCase();
    return S.rows.filter(r => (!S.k || kOf(r) === S.k) && (!q || [r.nama, r.merk, r.tipe, r.lokasi, r.keterangan, r.ik].join(" ").toLowerCase().includes(q)));
  }
  function render() {
    const all = S.rows, L = list(), cnt = k => all.filter(r => kOf(r) === k).length;
    $("#hvKpi").innerHTML = [["Total alat HV test", all.length, "tower", "primary", "Sheet " + SHEET], ["Normal", cnt("NORMAL"), "check", "p3", "Siap dipakai"],
      ["Anomali", cnt("ANOMALI"), "alert", "p2", "Perlu perhatian"], ["Rusak", cnt("RUSAK"), "x", "p1", "Tidak dapat dipakai"],
      ["Instruksi kerja", all.filter(r => r.ikUrl).length, "doc", "primary", `dari ${all.length} alat punya IK`]]
      .map(([l, v, ic, t, sub]) => `<div class="card kpi tone-${t}"><div class="kpi-icon">${icon(ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${esc(sub)}</div></div></div>`).join("");
    $("#hvK").innerHTML = [["", "Semua"], ["NORMAL", "Normal"], ["ANOMALI", "Anomali"], ["RUSAK", "Rusak"]].map(([k, l]) =>
      `<button type="button" class="ab-chip${S.k === k ? " on" : ""}" data-k="${k}" aria-pressed="${S.k === k}"><span>${l}</span><em>${k ? cnt(k) : all.length}</em></button>`).join("");
    $("#hvGrid").innerHTML = L.length ? L.map(r => `<article class="card hv-card tone-${K[kOf(r)].tone}" data-row="${r._row}" tabindex="0" role="button" aria-label="Detail ${esc(r.nama)}">
        <div class="hv-photo">${r.fotoUrl ? `<img src="${esc(r.fotoUrl)}" alt="${esc(r.nama)}" loading="lazy">` : `<div class="hv-ph">${svg(BOLT)}<small>Foto belum tersedia</small></div>`}${chip(r)}</div>
        <div class="hv-body"><h3>${esc(r.nama)}</h3><p class="muted sm">${esc([r.merk, r.tipe].filter(Boolean).join(" · ") || "Merek/tipe belum diisi")}${r.tahun ? ` · ${esc(r.tahun)}` : ""}${umur(r) != null ? ` <span class="hv-age">${umur(r)} th</span>` : ""}</p>
          <div class="hv-info"><b>${icon("location", "ic xs")}Lokasi</b><ul>${lines(r.lokasi).map(x => `<li>${esc(x)}</li>`).join("") || "<li class='muted'>—</li>"}</ul></div>
          ${r.keterangan ? `<div class="hv-info"><b>${icon("alert", "ic xs")}Keterangan</b><ul>${lines(r.keterangan).slice(0, 3).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
          <div class="hv-act">${r.ikUrl ? `<a class="btn ghost sm" href="${esc(r.ikUrl)}" target="_blank" rel="noopener" data-stop>${icon("doc", "ic xs")}Instruksi kerja</a>` : ""}
            ${S.live ? `<button type="button" class="btn ghost sm" data-edit="${r._row}">Edit</button>` : ""}</div></div></article>`).join("")
      : `<div class="card ab-empty">Tidak ada alat yang cocok dengan filter.</div>`;
    // grafik kondisi
    const kd = ["NORMAL", "ANOMALI", "RUSAK", ""].map(k => [k, cnt(k)]).filter(x => x[1]), n = all.length;
    let acc = 0;
    const segs = kd.map(([k, v]) => { const p = v / Math.max(n, 1) * 100, s = `<circle cx="50" cy="50" r="40" pathLength="100" style="stroke:${K[k].color};stroke-dasharray:${Math.max(p - .6, .4)} ${100 - p + .6};stroke-dashoffset:${-acc}"><title>${K[k].label}: ${v}</title></circle>`; acc += p; return s; }).join("");
    $("#hvChK").innerHTML = n ? `<svg class="donut" viewBox="0 0 100 100" role="img" aria-label="Komposisi kondisi"><circle cx="50" cy="50" r="40" class="d-track"/>${segs}<text x="50" y="49" class="d-total">${n}</text><text x="50" y="61" class="d-cap">alat</text></svg>
      <div class="ab-donut-legend"><ul class="plist">${kd.map(([k, v]) => `<li><i class="swatch" style="background:${K[k].color}"></i><span>${K[k].label}</span><b>${v}</b><em>${Math.round(v / n * 100)}%</em></li>`).join("")}</ul></div>` : `<p class="dnil">Tidak ada data.</p>`;
    const ages = all.map(r => [r, umur(r)]).sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1)), mx = Math.max(1, ...ages.map(a => a[1] || 0));
    $("#hvChU").innerHTML = `<ul class="bars ab-bars hv-age-bars">${ages.map(([r, u]) => `<li title="${esc(r.nama)}: ${u != null ? u + " tahun" : "tahun tidak diketahui"}"><span class="bl">${esc(r.nama)}</span>
      <span class="bt"><i style="width:${u != null ? u / mx * 100 : 0}%;background:${u == null ? "var(--text-3)" : u >= 30 ? "var(--p1)" : u >= 15 ? "var(--p2)" : "var(--ok)"}"></i></span><b>${u != null ? u + " th" : "—"}</b></li>`).join("")}</ul>`;
    // tabel
    $("#hvRows").innerHTML = L.map((r, i) => `<tr data-row="${r._row}" tabindex="0"><td class="num no">${esc(r.no || i + 1)}</td><td><b>${esc(r.nama)}</b></td>
      <td>${esc(r.merk || "—")}<div class="muted sm">${esc(r.tipe || "")}</div></td><td>${chip(r)}</td><td class="num">${esc(r.tahun || "—")}</td>
      <td class="izin">${lines(r.lokasi).map(esc).join("<br>") || "—"}</td>
      <td class="izin">${r.ikUrl ? `<a href="${esc(r.ikUrl)}" target="_blank" rel="noopener" data-stop>${esc(lines(r.ik)[0] || "Buka IK")}</a>` : esc(lines(r.ik)[0] || "—")}</td>
      <td class="act"><button type="button" class="btn ghost sm" data-row="${r._row}">Detail</button>${S.live ? ` <button type="button" class="btn ghost sm" data-edit="${r._row}">Edit</button>` : ""}</td></tr>`).join("");
    $("#hvEmpty").hidden = L.length > 0;
    $("#hvCount").textContent = `${L.length} dari ${all.length} alat`;
    $("#hvSrc").textContent = S.live ? `Sumber: Google Sheets · ${SHEET}` : `Sumber: ${DOC.source || SHEET} (data cadangan)`;
  }
  const byRow = row => S.rows.find(r => String(r._row) === String(row));

  /* ---------- Detail ---------- */
  function openDetail(row) {
    const r = byRow(row); if (!r) return;
    $("#hvDetTitle").textContent = r.nama;
    $("#hvDetSub").innerHTML = `${esc([r.merk, r.tipe].filter(Boolean).join(" · "))} ${chip(r)}`;
    const item = (l, v, cls) => `<div${cls ? ` class="${cls}"` : ""}><dt>${l}</dt><dd class="${v ? "pre" : "nil"}">${v || "—"}</dd></div>`;
    $("#hvDetBody").innerHTML = `${S.live ? `<section class="dsec ab-det-photos" id="hvDetPh"><h4>Foto <small>memuat…</small></h4></section>` : ""}
      <dl class="dgrid">${item("No", esc(r.no))}${item("Merek", esc(r.merk))}${item("Tipe", esc(r.tipe))}${item("Tahun", esc(r.tahun) + (umur(r) != null ? ` <span class="muted">(${umur(r)} tahun)</span>` : ""))}
        ${item("Kondisi", chip(r))}${item("Lokasi", lines(r.lokasi).map(esc).join("\n"), "span2")}${item("Keterangan", lines(r.keterangan).map(x => "• " + esc(x)).join("\n"), "wide")}
        ${item("Instruksi kerja", (lines(r.ik).map(esc).join("\n") || "") + (r.ikUrl ? `\n<a href="${esc(r.ikUrl)}" target="_blank" rel="noopener">Buka dokumen IK ↗</a>` : ""), "wide")}
        ${r.diperbarui ? item("Diperbarui", esc(r.diperbarui)) : ""}</dl>
      ${S.live ? `<div class="ab-det-actions"><button type="button" class="btn primary sm" id="hvDetEdit">${icon("gear", "ic xs")}Edit data &amp; foto</button></div>` : ""}`;
    if (S.live) {
      $("#hvDetEdit").addEventListener("click", () => openEdit(r._row));
      fetch(`${API}${API.includes("?") ? "&" : "?"}action=hv_photos&row=${r._row}&expect=${encodeURIComponent(r.nama)}`, { cache: "no-store" }).then(x => x.json()).then(j => {
        const box = $("#hvDetPh"); if (!box) return;
        const ph = (j.ok && j.photos) || [];
        box.innerHTML = `<h4>Foto <small>${ph.length} foto${j.folder ? ` · <a href="${esc(j.folder)}" target="_blank" rel="noopener">folder Drive</a>` : ""}</small></h4>` +
          (ph.length ? `<div class="ab-det-strip">${ph.map(p => `<a href="${esc(p.view)}" target="_blank" rel="noopener"><img src="${esc(p.thumb)}" alt="${esc(p.name)}" loading="lazy"></a>`).join("")}</div>`
            : `<p class="muted sm">Belum ada foto. Klik “Edit data &amp; foto” untuk menambah.</p>`);
      }).catch(() => {});
    }
    $("#hvDetail").showModal();
  }

  /* ---------- Muat dari Google Sheets ---------- */
  function setSync(st, t, note) { $("#hvSync").className = "chip sync " + st; $("#hvSync").innerHTML = `<i class="live-dot"></i>${esc(t)}`; $("#hvSyncNote").textContent = note || ""; }
  async function load() {
    if (!API) { setSync("static", "Data statis · edit belum aktif"); return; }
    setSync("loading", "Memuat dari Google Sheets…"); $("#hvReload").hidden = false;
    try {
      const j = await (await fetch(`${API}${API.includes("?") ? "&" : "?"}action=hv`, { cache: "no-store" })).json();
      if (!j.ok) throw new Error(j.error || "Gagal memuat");
      if (j.sheet !== SHEET || !Array.isArray(j.rows)) throw new Error("Apps Script masih versi lama (belum ada fitur HV Test). Tempel Code.gs terbaru lalu deploy New version.");
      S.rows = j.rows; S.live = true; S.updated = j.updated; $("#hvAddBtn").hidden = false;
      setSync("live", "Live · Google Sheets", `Sheet ${SHEET} · ${j.rows.length} alat · dimuat ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`);
      render(); changed();
    } catch (e) { S.live = false; setSync("error", "Gagal terhubung · menampilkan data cadangan", String(e.message || e)); render(); }
  }
  function changed() { if (location.hash === "#hv" && typeof setUpdated === "function") setUpdated("hv"); if (window.homeRefresh) window.homeRefresh(); }
  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  window.PAGE_UPDATED.hv = () => {
    if (!S.live || !S.updated) return DOC.generated ? { date: DOC.generated, title: "Data cadangan" } : null;
    const d = new Date(S.updated), pad = n => String(n).padStart(2, "0");
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { date, title: `Perubahan data terakhir: ${fmtTanggal(date)} pukul ${pad(d.getHours())}.${pad(d.getMinutes())} (Google Sheets)` };
  };
  window.HV_SUMMARY = () => ({ total: S.rows.length, normal: S.rows.filter(r => kOf(r) === "NORMAL").length, anomali: S.rows.filter(r => kOf(r) === "ANOMALI").length, rusak: S.rows.filter(r => kOf(r) === "RUSAK").length, live: S.live });

  /* ---------- Simpan (kode akses wajib setiap perubahan) ---------- */
  async function post(body) {
    const token = ($("#hv_token").value || "").trim();
    if (!token) { $("#hv_token").focus(); throw new Error("Masukkan kode akses edit (kolom di bagian bawah form) — wajib setiap kali menyimpan perubahan."); }
    const j = await (await fetch(API, { method: "POST", body: JSON.stringify({ token, ...body }) })).json();
    if (!j.ok) throw new Error(/Aksi tidak dikenal/i.test(j.error || "") ? "Apps Script masih versi lama. Tempel Code.gs terbaru lalu deploy New version." : (j.error || "Gagal menyimpan"));
    if (!S.batch) tokenClear();
    if (j.updated) S.updated = j.updated;
    return j;
  }
  const F = ["nama", "merk", "tipe", "kondisi", "tahun", "lokasi", "keterangan", "ik", "ikUrl"];
  function err(m) { $("#hvEditErr").textContent = m || ""; $("#hvEditErr").hidden = !m; }
  function openEdit(row) {
    if (!S.live) return;
    const r = row ? byRow(row) : null;
    S.editing = r; S.photos = []; S.phErr = ""; err("");
    F.forEach(k => { $("#hvf_" + k).value = r ? (r[k] || "") : (k === "kondisi" ? "NORMAL" : ""); });
    $("#hv_token").value = "";
    $("#hvEditTitle").textContent = r ? `Edit ${r.nama}` : "Tambah alat HV test";
    $("#hvEditSub").textContent = `${r ? "Baris " + r._row + " · " : ""}disimpan ke sheet ${SHEET}`;
    r ? loadPhotos() : renderPhotos();
    if ($("#hvDetail").open) $("#hvDetail").close();
    $("#hvEditDlg").showModal();
  }
  $("#hvEditForm").addEventListener("submit", async e => {
    e.preventDefault();
    const r = S.editing, data = {};
    F.forEach(k => { data[k] = $("#hvf_" + k).value.replace(/\r/g, "").trim(); });
    if (!data.nama) return err("Nama alat wajib diisi.");
    let body;
    if (r) {
      const ch = Object.fromEntries(Object.entries(data).filter(([k, v]) => (r[k] || "") !== v));
      if (!Object.keys(ch).length) { $("#hvEditDlg").close(); return toast("Tidak ada perubahan"); }
      body = { action: "hv_update", row: r._row, expect: r.nama, data: ch };
    } else body = { action: "hv_add", data };
    const b = $("#hvSave"); b.disabled = true; b.textContent = "Menyimpan…"; err("");
    try {
      const j = await post(body);
      upsert(j.row);
      if (r) { $("#hvEditDlg").close(); toast("Perubahan tersimpan ke Google Sheets"); }
      else { toast("Alat baru ditambahkan — sekarang Anda bisa menambah foto"); openEdit(j.row._row); }
    } catch (x) { err(String(x.message || x)); }
    finally { b.disabled = false; b.textContent = "Simpan"; }
  });
  function upsert(row) {
    if (!row) return;
    const i = S.rows.findIndex(x => x._row === row._row);
    if (i >= 0) S.rows[i] = row; else S.rows.push(row);
    if (S.editing && S.editing._row === row._row) S.editing = row;
    render(); changed();
  }

  /* ---------- Foto ---------- */
  async function loadPhotos() {
    const r = S.editing; if (!r) return;
    S.phBusy = "Memuat foto…"; renderPhotos();
    try {
      const j = await (await fetch(`${API}${API.includes("?") ? "&" : "?"}action=hv_photos&row=${r._row}&expect=${encodeURIComponent(r.nama)}`, { cache: "no-store" })).json();
      if (!j.ok) throw new Error(j.error || "Gagal memuat foto");
      S.photos = j.photos || []; S.cover = j.cover; S.folder = j.folder;
    } catch (x) { S.phErr = String(x.message || x); }
    S.phBusy = ""; renderPhotos();
  }
  function renderPhotos() {
    const el = $("#hvPhSec");
    if (!S.editing) { el.innerHTML = `<h4>Foto alat</h4><p class="muted sm">Foto dapat ditambahkan setelah data alat disimpan.</p>`; return; }
    el.innerHTML = `<div class="ph-head"><h4>Foto alat <small>${S.photos.length} foto${S.folder ? ` · <a href="${esc(S.folder)}" target="_blank" rel="noopener">buka folder Drive</a>` : ""}</small></h4>
      <label class="btn ghost sm${S.phBusy ? " disabled" : ""}">${icon("camera", "ic xs")}Tambah foto<input type="file" id="hvPhFile" accept="image/*" multiple hidden></label></div>
      ${S.phBusy ? `<p class="muted sm">${esc(S.phBusy)}</p>` : ""}${S.phErr ? `<p class="form-err">${esc(S.phErr)}</p>` : ""}
      <div class="ph-grid">${S.photos.map(p => `<figure class="ph-item${p.id === S.cover ? " cover" : ""}"><a class="ph-img" href="${esc(p.view)}" target="_blank" rel="noopener"><img src="${esc(p.thumb)}" alt="${esc(p.name)}" loading="lazy"></a>
        <figcaption>${p.id === S.cover ? `<span class="badge ok">Foto utama</span>` : ""}<div class="ph-act">${p.id === S.cover ? "" : `<button type="button" class="linkbtn" data-cover="${esc(p.id)}">Jadikan utama</button>`}
        <button type="button" class="linkbtn danger" data-del="${esc(p.id)}">Hapus</button></div></figcaption></figure>`).join("")}</div>`;
  }
  $("#hvPhSec").addEventListener("change", async e => {
    if (e.target.id !== "hvPhFile" || !e.target.files.length) return;
    const files = [...e.target.files]; e.target.value = ""; S.batch = true; S.phErr = "";
    for (let i = 0; i < files.length; i++) {
      S.phBusy = `Mengunggah foto ${i + 1} dari ${files.length}…`; renderPhotos();
      try { const p = await phPrepare(files[i]); const j = await post({ action: "hv_photo_upload", row: S.editing._row, expect: S.editing.nama, ...p }); upsert(j.row); }
      catch (x) { S.phErr = String(x.message || x); break; }
    }
    S.batch = false; tokenClear(); S.phBusy = ""; await loadPhotos();
  });
  $("#hvPhSec").addEventListener("click", async e => {
    const c = e.target.closest("[data-cover]"), d = e.target.closest("[data-del]");
    if (!c && !d) return;
    if (d && !confirm("Hapus foto ini? File dipindah ke sampah Google Drive.")) return;
    S.phErr = ""; S.phBusy = c ? "Menyimpan foto utama…" : "Menghapus foto…"; renderPhotos();
    try { const j = await post({ action: c ? "hv_photo_cover" : "hv_photo_delete", row: S.editing._row, expect: S.editing.nama, fileId: (c || d).dataset[c ? "cover" : "del"] }); upsert(j.row); }
    catch (x) { S.phErr = String(x.message || x); }
    S.phBusy = ""; await loadPhotos();
  });
  $("#hvEditDlg").addEventListener("close", () => { S.editing = null; });

  /* ---------- Event ---------- */
  $("#hvK").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) { S.k = b.dataset.k; render(); } });
  $("#hvSearch").addEventListener("input", e => { S.q = e.target.value; render(); });
  const onClick = e => {
    if (e.target.closest("[data-stop]")) return;
    const ed = e.target.closest("[data-edit]"); if (ed) return openEdit(ed.dataset.edit);
    const t = e.target.closest("[data-row]"); if (t) openDetail(t.dataset.row);
  };
  $("#hvGrid").addEventListener("click", onClick); $("#hvRows").addEventListener("click", onClick);
  $("#hvGrid").addEventListener("keydown", e => { const t = e.target.closest(".hv-card[data-row]"); if (t && e.key === "Enter") openDetail(t.dataset.row); });
  $("#hvAddBtn").addEventListener("click", () => openEdit(null));
  $("#hvReload").addEventListener("click", load);
  $("#hvDetail").addEventListener("click", e => { if (e.target === $("#hvDetail")) $("#hvDetail").close(); });

  render();
  load();
})();
