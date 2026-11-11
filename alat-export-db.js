/* =========================================================
   DATABASE GOOGLE SHEETS untuk halaman alat-export.js (DC Mobile, dst.)
   Apps Script: GET ?action=eq&kind=<kind>, POST eq_seed / eq_add / eq_update / eq_photo_*.
   Dipanggil oleh alatPage() bila konfigurasinya punya `db: { kind, sheet }`.
   ========================================================= */
function alatDbInit(ctx) {
  const { P, C, X } = ctx, KIND = C.db.kind, SHEET = C.db.sheet;
  const API = typeof TDB_API === "string" ? TDB_API : "";
  const STATIC = (ctx.DOC.rows || []).slice();
  const UPTS = ["UPT SURABAYA", "UPT GRESIK", "UPT MALANG", "UPT MADIUN", "UPT PROBOLINGGO", "UPT BALI"];
  const DB = { live: false, updated: null, editing: null, photos: [], cover: null, folder: null, phBusy: "", phErr: "" };
  const q = (a, extra) => `${API}${API.includes("?") ? "&" : "?"}action=${a}&kind=${KIND}${extra || ""}`;
  const el = id => $(`#${P}${id}`);
  const KEYS = ["id", "upt", "ultg", "gi", "lokasi", "nama", "kategori", "bidang", "merk", "tipe", "satuan", "jumlah", "tahun", "sn", "kalibrasi", "sertifikat",
    "tglKalibrasi", "tglKadaluarsa", "rencanaKalibrasi", "lembaga", "kondisi", "kondisiPerbaikan", "anomali", "keterangan", "harga", "noAktiva", "noKontrak"];
  const isoDate = v => /^\d{4}-\d{2}-\d{2}/.test(v || "") ? String(v).slice(0, 10) : "";
  const toSheet = r => Object.fromEntries(KEYS.map(k => [k, k.startsWith("tgl") || k === "rencanaKalibrasi" ? isoDate(r[k])
    : k === "jumlah" ? String(r.jumlah || 1) : k === "kalibrasi" || k === "kondisi" ? String(r[k] || "").toUpperCase() : (r[k] == null ? "" : String(r[k]))]));
  const fromSheet = rows => rows.map(r => ({ ...r, foto: r.fotoUrl || null }));

  /* ---------- Sinkronisasi ---------- */
  function setSync(state, text, note) {
    el("SyncChip").className = "chip sync " + state;
    el("SyncChip").innerHTML = `<i class="live-dot"></i>${esc(text)}`;
    el("SyncNote").textContent = note || "";
  }
  function afterChange() {
    if (location.hash === "#" + P && typeof setUpdated === "function") setUpdated(P);
    if (window.homeRefresh) window.homeRefresh();
  }
  async function load() {
    if (!API) { setSync("static", "Data statis · edit belum aktif", "Isi trafoDbApi di config.js agar data live & bisa diedit."); return; }
    setSync("loading", "Memuat dari Google Sheets…"); el("Reload").hidden = false;
    try {
      const j = await (await fetch(q("eq"), { cache: "no-store" })).json();
      if (!j.ok) throw new Error(j.error || "Gagal memuat");
      if (j.kind !== KIND || !Array.isArray(j.rows)) throw new Error("Apps Script masih versi lama (belum ada fitur " + C.title + "). Tempel Code.gs terbaru lalu deploy New version.");
      DB.updated = j.updated || null;
      if (!j.rows.length) {
        DB.live = false; X.editable = false;
        setSync("error", "Sheet belum berisi data", `Sheet "${SHEET}" masih kosong — menampilkan data dari file Excel.`);
        showSeed(); return;
      }
      DB.live = true; X.editable = true; X.edit = openEdit; el("Seed").hidden = true; el("AddBtn").hidden = false;
      ctx.setRows(fromSheet(j.rows));
      setSync("live", "Live · Google Sheets", `Sheet ${SHEET} · ${j.rows.length} unit · dimuat ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`);
      afterChange();
    } catch (e) { DB.live = false; setSync("error", "Gagal terhubung · menampilkan data statis", String(e.message || e)); }
  }
  window.PAGE_UPDATED[P] = () => {
    if (!DB.live || !DB.updated) return ctx.staticUpdated ? ctx.staticUpdated() : null;
    const d = new Date(DB.updated), pad = n => String(n).padStart(2, "0");
    if (isNaN(d)) return null;
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { date, title: `Perubahan data terakhir: ${fmtTanggal(date)} pukul ${pad(d.getHours())}.${pad(d.getMinutes())} (Google Sheets)` };
  };

  async function post(body, tokInput) {
    const token = ((tokInput && tokInput.value) || tokenGet() || "").trim();
    if (!token) { if (tokInput && tokInput.focus) tokInput.focus(); throw new Error("Masukkan kode akses edit (kolom di bagian bawah form) — wajib setiap kali menyimpan perubahan."); }
    const j = await (await fetch(API, { method: "POST", body: JSON.stringify({ token, kind: KIND, ...body }) })).json();
    if (!j.ok) {
      if (j.code === "auth") { tokenForget(true); tokUi(); }
      throw new Error(/Aksi tidak dikenal|Jenis data tidak dikenal/i.test(j.error || "") ? "Apps Script masih versi lama. Tempel Code.gs terbaru lalu deploy New version." : (j.error || "Gagal menyimpan"));
    }
    if (!DB.batch) tokenClear(); // kode akses wajib diisi ulang untuk perubahan berikutnya
    if (j.updated) DB.updated = j.updated;
    return j;
  }

  /* ---------- Salin data awal ---------- */
  function showSeed() {
    el("Seed").hidden = false;
    el("Seed").innerHTML = `<div><b>Sheet "${esc(SHEET)}" masih kosong.</b> Salin ${STATIC.length} data ${esc(C.noun)} dari file Excel ke sheet agar bisa diedit dari dashboard.</div>
      <div class="ab-seed-act">${tokenGet() ? "" : `<input type="password" id="${P}SeedTok" placeholder="Kode akses edit" autocomplete="new-password">`}
      <button class="btn primary sm" type="button" id="${P}SeedBtn">Salin ${STATIC.length} data ke sheet</button></div>`;
  }
  el("Seed").addEventListener("click", async e => {
    if (!e.target.closest(`#${P}SeedBtn`)) return;
    const btn = el("SeedBtn"); btn.disabled = true; btn.textContent = "Menyalin…";
    try { const j = await post({ action: "eq_seed", rows: STATIC.map(toSheet) }, el("SeedTok")); toast(`${j.rows.length} data disalin ke sheet ${SHEET}`); await load(); }
    catch (x) { toast(String(x.message || x)); btn.disabled = false; btn.textContent = `Salin ${STATIC.length} data ke sheet`; }
  });

  /* ---------- Form tambah / edit ---------- */
  const F = [
    ["id", "ID alat", "text", { placeholder: "Kosongkan = otomatis" }], ["nama", "Nama alat", "text", { required: true }],
    ["kategori", "Kategori", "text", { list: `${P}KatList` }], ["bidang", "Bidang", "text", { list: `${P}BidList` }],
    ["merk", "Merk", "text"], ["tipe", "Type", "text"], ["sn", "Serial number", "text"], ["tahun", "Tahun perolehan", "text", { inputmode: "numeric", placeholder: "mis. 2025" }],
    ["jumlah", "Jumlah", "text", { inputmode: "numeric" }], ["satuan", "Satuan", "text"],
    ["upt", "UPT", "select", { opts: UPTS, required: true }], ["ultg", "ULTG / subunit", "text", { list: `${P}UltgList` }],
    ["gi", "Gardu induk", "text"], ["lokasi", "Lokasi penyimpanan", "text"],
    ["kalibrasi", "Status kalibrasi", "select", { opts: ["AKTIF", "BELUM KALIBRASI", "EXPIRED"] }], ["sertifikat", "Sertifikat kalibrasi", "text"],
    ["tglKalibrasi", "Tgl kalibrasi terakhir", "date"], ["tglKadaluarsa", "Tgl kedaluwarsa kalibrasi", "date"], ["rencanaKalibrasi", "Rencana kalibrasi", "date"],
    ["lembaga", "Lembaga kalibrasi", "text"], ["kondisi", "Kondisi", "select", { opts: ["NORMAL", "PERLU PERBAIKAN", "RUSAK"] }],
    ["kondisiPerbaikan", "Kondisi perbaikan", "text"], ["anomali", "Anomali", "textarea", { wide: true }], ["keterangan", "Keterangan", "textarea", { wide: true }],
    ["harga", "Harga perolehan", "text"], ["noAktiva", "No. aktiva", "text"], ["noKontrak", "No. kontrak", "text"]
  ];
  const dlgId = `${P}EditDlg`;
  document.body.insertAdjacentHTML("beforeend", `<dialog class="modal modal-lg" id="${dlgId}" aria-labelledby="${P}EditTitle">
   <form class="modal-wrap" id="${P}EditForm" novalidate>
    <header class="modal-head"><div><h3 id="${P}EditTitle"></h3><p id="${P}EditSub"></p></div>
     <button class="icon-btn" type="button" onclick="this.closest('dialog').close()" aria-label="Tutup"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>
    <div class="modal-body"><section class="dsec ph-sec ab-ph-sec" id="${P}PhSec"></section><div class="form-grid" id="${P}Fields"></div></div>
    <footer class="modal-foot">
     <div class="fld token"><label class="tok-in" id="${P}TokIn"><span>Kode akses edit</span><input type="password" id="${P}_token" autocomplete="new-password" placeholder="Kode dari admin"><small class="hint">Wajib diisi setiap kali menyimpan perubahan.</small></label>
      <p class="token-saved" id="${P}TokSaved" hidden><svg class="ic xs" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>Kode akses tersimpan di perangkat ini · <button type="button" class="linkbtn" id="${P}TokForget">Lupakan</button></p></div>
     <p class="form-err" id="${P}EditErr" role="alert" hidden></p>
     <div class="modal-btns"><button class="btn ghost" type="button" onclick="this.closest('dialog').close()">Batal</button><button class="btn primary" type="submit" id="${P}Save">Simpan</button></div>
    </footer></form></dialog>`);
  function tokUi() { const t = tokenGet(); $(`#${P}_token`).value = t; el("TokIn").hidden = !!t; el("TokSaved").hidden = !t; }
  function err(m) { el("EditErr").textContent = m || ""; el("EditErr").hidden = !m; }
  function buildForm() {
    const uniq = k => [...new Set(ctx.rows().map(r => r[k]).filter(Boolean))].sort();
    el("Fields").innerHTML = F.map(([k, label, type, o = {}]) => {
      const a = `id="${P}f_${k}"${o.required ? " required" : ""}${o.list ? ` list="${o.list}"` : ""}${o.inputmode ? ` inputmode="${o.inputmode}"` : ""}${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ""}`;
      const input = type === "select" ? `<select ${a}>${o.opts.map(v => `<option>${esc(v)}</option>`).join("")}</select>` : type === "textarea" ? `<textarea ${a} rows="2"></textarea>` : `<input type="${type}" ${a} autocomplete="off">`;
      return `<label class="fld${o.wide ? " wide" : ""}"><span>${label}${o.required ? " <em>*</em>" : ""}</span>${input}</label>`;
    }).join("") + [["KatList", uniq("kategori")], ["BidList", uniq("bidang")], ["UltgList", uniq("ultg")]]
      .map(([id, vs]) => `<datalist id="${P}${id}">${vs.map(v => `<option value="${esc(v)}">`).join("")}</datalist>`).join("");
  }
  function openEdit(id) {
    if (!DB.live) return;
    const r = id ? ctx.byId(id) : null;
    DB.editing = r; DB.photos = []; DB.phErr = ""; buildForm(); err("");
    const v = r || { upt: UPTS[0], kalibrasi: "BELUM KALIBRASI", kondisi: "NORMAL", jumlah: "1", satuan: "Set", bidang: (STATIC[0] && STATIC[0].bidang) || "", nama: C.title.toUpperCase() };
    F.forEach(([k]) => { const x = $(`#${P}f_${k}`); if (x) x.value = v[k] == null ? "" : String(v[k]); });
    $(`#${P}f_id`).disabled = !!r;
    el("EditTitle").textContent = r ? `Edit ${r.nama || r.id}` : `Tambah ${C.noun}`;
    el("EditSub").textContent = `${r ? r.id + " · " : ""}disimpan ke sheet ${SHEET}`;
    tokUi(); PS.reset({ loading: !!r }); if (r) loadPhotos(r);
    if ($(`#${P}Detail`).open) $(`#${P}Detail`).close();
    $("#" + dlgId).showModal();
  }
  el("AddBtn").addEventListener("click", () => openEdit(null));
  el("Reload").addEventListener("click", load);
  el("TokForget").addEventListener("click", () => { tokenForget(); tokUi(); });
  el("EditForm").addEventListener("submit", async e => {
    e.preventDefault();
    const r = DB.editing, data = {};
    F.forEach(([k]) => { const x = $(`#${P}f_${k}`); if (x && !x.disabled) data[k] = x.value.trim(); });
    if (!data.nama) return err("Nama alat wajib diisi.");
    if (data.tahun && !/^\d{4}$/.test(data.tahun)) return err("Tahun perolehan harus 4 digit.");
    const changed = r ? Object.fromEntries(Object.entries(data).filter(([k, v]) => String(r[k] == null ? "" : r[k]) !== v)) : data;
    const phChange = PS.hasChanges();
    if (r && !Object.keys(changed).length && !phChange) { $("#" + dlgId).close(); return toast("Tidak ada perubahan"); }
    const tok = $(`#${P}_token`);
    if (!tok.value.trim()) { tok.focus(); return err("Masukkan kode akses edit untuk menyimpan perubahan."); }
    const btn = el("Save"); btn.disabled = true; btn.textContent = "Menyimpan…"; err(""); DB.batch = true;
    try {
      let id = r && r.id;
      if (!r) { const j = await post({ action: "eq_add", data }, tok); upsert(j.row); id = j.row.id; }
      else if (Object.keys(changed).length) upsert((await post({ action: "eq_update", id, data: changed }, tok)).row);
      if (phChange) { const last = await PS.commit((act, payload) => post({ action: "eq_photo_" + act, id, ...payload }, tok)); if (last) upsert(last); }
      tokenClear(); $("#" + dlgId).close();
      toast(r ? "Perubahan tersimpan ke Google Sheets" : `${id} ditambahkan ke Google Sheets`);
    } catch (x) { err(String(x.message || x)); }
    finally { DB.batch = false; btn.disabled = false; btn.textContent = "Simpan"; }
  });
  function upsert(row) {
    if (!row) return;
    const list = ctx.rows().map(x => ({ ...x })), i = list.findIndex(x => x.id === row.id), m = { ...row, foto: row.fotoUrl || null };
    if (i >= 0) list[i] = m; else list.push(m);
    ctx.setRows(list);
    if (DB.editing && DB.editing.id === row.id) DB.editing = ctx.byId(row.id);
    afterChange();
  }

  /* ---------- Foto (Google Drive) — disiapkan di form, dikirim saat Simpan ---------- */
  const PS = photoStager(el("PhSec"), { prefix: P });
  async function loadPhotos(r) {
    try {
      const j = await (await fetch(q("eq_photos", `&id=${encodeURIComponent(r.id)}`), { cache: "no-store" })).json();
      if (!j.ok) throw new Error(j.error || "Gagal memuat foto");
      if (DB.editing === r) PS.reset({ photos: j.photos, cover: j.cover, folder: j.folder });
    } catch (x) { if (DB.editing === r) PS.reset({ err: String(x.message || x) }); }
  }
  $("#" + dlgId).addEventListener("close", () => { DB.editing = null; PS.reset(); });

  /* ---------- Detail: foto & tombol edit ---------- */
  X.onDetail = r => {
    if (!DB.live) return;
    const body = $(`#${P}DetBody`);
    body.insertAdjacentHTML("afterbegin", `<section class="dsec ab-det-photos" id="${P}DetPh"><h4>Foto <small>memuat…</small></h4></section>`);
    body.insertAdjacentHTML("beforeend", `<div class="ab-det-actions"><button type="button" class="btn primary sm" id="${P}DetEdit">${icon("gear", "ic xs")}Edit data &amp; foto</button></div>`);
    $(`#${P}DetEdit`).addEventListener("click", () => openEdit(r.id));
    fetch(q("eq_photos", `&id=${encodeURIComponent(r.id)}`), { cache: "no-store" }).then(x => x.json()).then(j => {
      const box = $(`#${P}DetPh`); if (!box) return;
      const ph = (j.ok && j.photos) || [];
      box.innerHTML = `<h4>Foto <small>${ph.length} foto${j.folder ? ` · <a href="${esc(j.folder)}" target="_blank" rel="noopener">folder Drive</a>` : ""}</small></h4>` +
        (ph.length ? `<div class="ab-det-strip">${ph.map(p => `<a href="${esc(p.view)}" target="_blank" rel="noopener"><img src="${esc(p.thumb)}" alt="${esc(p.caption || p.name)}" loading="lazy"></a>`).join("")}</div>`
          : `<p class="muted sm">Belum ada foto. Klik “Edit data &amp; foto” untuk menambah.</p>`);
    }).catch(() => { const box = $(`#${P}DetPh`); if (box) box.innerHTML = `<h4>Foto</h4><p class="muted sm">Foto tidak dapat dimuat.</p>`; });
  };

  load();
}
