/* =========================================================
   ALAT BERAT — database live di Google Sheets
   Sheet "3. ALAT BERAT (NEW)" di spreadsheet DATABASE ALAT BERAT UIT JBM (Apps Script yang sama
   dengan Trafo Mobile). Tambah / edit data dan kelola foto per alat (Google Drive).
   Tanpa koneksi, halaman memakai data statis data/alat-berat.js (export WARNOTO).
   ========================================================= */
(function () {
  const C = window.AB_CTX;
  if (!C || !$("#page-alat")) return;
  const API = typeof TDB_API === "string" ? TDB_API : "";
  const SHEET = "3. ALAT BERAT (NEW)";
  const STATIC = (window.ALAT_BERAT && window.ALAT_BERAT.alat) || [];
  const STATIC_FOTO = Object.fromEntries(STATIC.filter(a => a.foto).map(a => [a.id, a.foto]));
  const KAT_LABEL = { crane: "Crane", forklift: "Forklift", manlift: "Manlift", pendukung: "Alat Pendukung", truck: "Truck" };
  const KAT_KEY = Object.fromEntries(Object.entries(KAT_LABEL).map(([k, v]) => [v, k]));
  const UPTS = ["UPT Surabaya", "UPT Gresik", "UPT Malang", "UPT Madiun", "UPT Probolinggo", "UPT Bali"];
  const UPT_C = { "UPT Surabaya": [-7.29, 112.74], "UPT Gresik": [-7.18, 112.63], "UPT Malang": [-7.97, 112.63], "UPT Madiun": [-7.63, 111.52],
    "UPT Probolinggo": [-7.75, 113.21], "UPT Bali": [-8.65, 115.22] };
  const DB = { live: false, sheet: false, updated: null, editing: null, photos: [], cover: null, folder: null, phBusy: "", phErr: "" };
  const todayIso = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

  /* ---------- Pemetaan baris sheet <-> data tampilan ---------- */
  function toModel(r) {
    let izin = "Tidak ada", teks = "Tidak ada";
    if (r.izinBerlaku) {
      const exp = r.izinBerlaku < todayIso();
      izin = exp ? "Kedaluwarsa" : "Berlaku"; teks = exp ? `Kedaluwarsa (${fmtTanggal(r.izinBerlaku)})` : `Berlaku s.d. ${fmtTanggal(r.izinBerlaku)}`;
    } else if (r.suratIzin === "Perlu perpanjangan") { izin = teks = "Perlu perpanjangan"; }
    else if (r.suratIzin === "Ada") { izin = "Ada dokumen"; teks = "Ada"; }
    return {
      id: r.id, kategori: KAT_KEY[r.kategori] || "pendukung", nama: r.nama || "(tanpa nama)", merk: r.merk, tipe: "", kapasitas: r.kapasitas,
      tahun: r.tahun, noSeri: r.noSeri, upt: r.upt || "-", lokasi: r.lokasi || "Tanpa lokasi", fungsi: r.fungsi, jenisAset: r.jenisAset,
      jumlah: r.jumlah, satuan: r.satuan, spesifikasi: r.spesifikasi, kondisi: r.kondisi || "Baik", kondisiCatatan: r.kondisiCatatan,
      layak: r.kelayakan !== "Tidak layak", statusAlat: r.kelayakan,
      status: r.ketersediaan === "Dipinjam" ? "Dipinjam" : (r.kondisi === "Rusak" ? "Perbaikan" : "Tersedia"),
      izin, suratIzin: teks, suratIzinUrl: r.suratIzinUrl, izinBerlaku: r.izinBerlaku, terakhirDipinjam: null,
      foto: r.fotoUrl || STATIC_FOTO[r.id] || null, linkFoto: r.linkFoto, _raw: r
    };
  }
  function toSheet(a) { // data statis (export WARNOTO) -> kolom sheet
    const iz = a.izin === "Perlu perpanjangan" ? "Perlu perpanjangan" : (a.izin === "Tidak ada" || !a.izin ? "Tidak ada" : "Ada");
    return { id: a.id, upt: a.upt, lokasi: a.lokasi, nama: a.nama, kategori: KAT_LABEL[a.kategori] || "Alat Pendukung", fungsi: a.fungsi || "",
      jenisAset: a.jenisAset || "Alat Berat", merk: a.merk || "", kapasitas: a.kapasitas || "", noSeri: a.noSeri || "", tahun: a.tahun || "",
      kondisi: a.kondisi || "Baik", kondisiCatatan: a.kondisiCatatan || "", kelayakan: a.layak ? "Layak" : "Tidak layak",
      ketersediaan: a.status === "Dipinjam" ? "Dipinjam" : "Tersedia", jumlah: String(a.jumlah || 1), satuan: a.satuan || "unit",
      suratIzin: iz, izinBerlaku: a.izinBerlaku || "", suratIzinUrl: a.suratIzinUrl || "", spesifikasi: a.spesifikasi || "" };
  }
  function ensureCoords(list) {
    list.forEach((a, i) => {
      if (C.AB.coords[a.lokasi]) return;
      const c = UPT_C[a.upt] || [-7.8, 112.9], h = [...a.lokasi].reduce((x, ch) => x + ch.charCodeAt(0), 0);
      C.AB.coords[a.lokasi] = [c[0] + ((h % 7) - 3) * 0.012, c[1] + ((h % 5) - 2) * 0.015];
    });
  }

  /* ---------- Status sinkronisasi ---------- */
  function setSync(state, text, note) {
    $("#abSyncChip").className = "chip sync " + state;
    $("#abSyncChip").innerHTML = `<i class="live-dot"></i>${esc(text)}`;
    $("#abSyncNote").textContent = note || "";
  }
  function apply(rows) {
    C.AB.alat = rows.map(toModel);
    ensureCoords(C.AB.alat);
    C.render(true);
    if (location.hash === "#alat" && typeof setUpdated === "function") setUpdated("alat");
    if (window.homeRefresh) window.homeRefresh();
  }
  async function load() {
    if (!API) { setSync("static", "Data statis · edit belum aktif", "Isi trafoDbApi di config.js agar data live & bisa diedit."); return; }
    setSync("loading", "Memuat dari Google Sheets…");
    $("#abReload").hidden = false;
    try {
      const j = await (await fetch(API + (API.includes("?") ? "&" : "?") + "action=ab", { cache: "no-store" })).json();
      if (!j.ok) throw new Error(j.error || "Gagal memuat");
      // Apps Script versi lama mengabaikan ?action=ab dan mengirim data Trafo Mobile (punya "rows" tetapi tanpa "sheet")
      if (!("sheet" in j) || !Array.isArray(j.rows)) throw new Error("Apps Script masih versi lama (belum ada fitur Alat Berat). Tempel Code.gs terbaru lalu deploy New version.");
      DB.sheet = j.sheet; DB.updated = j.updated || null;
      if (!j.rows.length) {
        DB.live = false;
        setSync("error", "Sheet belum berisi data", `Sheet "${SHEET}" masih kosong — menampilkan data export WARNOTO.`);
        showSeed();
        return;
      }
      DB.live = true; $("#abSeed").hidden = true; $("#abAddBtn").hidden = false;
      window.abEdit = openEdit;
      apply(j.rows);
      setSync("live", "Live · Google Sheets", `Sheet ${SHEET} · ${j.rows.length} alat · dimuat ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (e) {
      DB.live = false;
      setSync("error", "Gagal terhubung · menampilkan data statis", String(e.message || e));
    }
  }
  window.PAGE_UPDATED = window.PAGE_UPDATED || {};
  const staticUpdated = window.PAGE_UPDATED.alat;
  window.PAGE_UPDATED.alat = () => {
    if (!DB.live || !DB.updated) return staticUpdated ? staticUpdated() : null;
    const d = new Date(DB.updated), pad = n => String(n).padStart(2, "0");
    if (isNaN(d)) return null;
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { date, title: `Perubahan data terakhir: ${fmtTanggal(date)} pukul ${pad(d.getHours())}.${pad(d.getMinutes())} (Google Sheets)` };
  };

  /* ---------- Kode akses ---------- */
  function tokUi(prefix) {
    const tok = tokenGet();
    $(`#${prefix}_token`).value = tok; $(`#${prefix}TokIn`).hidden = !!tok; $(`#${prefix}TokSaved`).hidden = !tok;
  }
  async function post(body, tokenInput) {
    const token = ((tokenInput && tokenInput.value) || tokenGet() || "").trim();
    if (!token) throw new Error("Masukkan kode akses edit.");
    const j = await (await fetch(API, { method: "POST", body: JSON.stringify({ token, ...body }) })).json();
    if (!j.ok) {
      if (j.code === "auth") { tokenForget(true); if ($("#abEditDlg").open) tokUi("ab"); }
      throw new Error(/Aksi tidak dikenal/i.test(j.error || "") ? "Apps Script masih versi lama. Tempel Code.gs terbaru lalu deploy New version." : (j.error || "Gagal menyimpan"));
    }
    tokenSave(token);
    if (j.updated) DB.updated = j.updated;
    return j;
  }

  /* ---------- Salin data awal ke sheet kosong ---------- */
  function showSeed() {
    $("#abSeed").hidden = false;
    $("#abSeed").innerHTML = `<div><b>Sheet "${esc(SHEET)}" masih kosong.</b> Salin ${STATIC.length} data alat dari export WARNOTO ke sheet agar bisa diedit dari dashboard.</div>
      <div class="ab-seed-act">${tokenGet() ? "" : `<input type="password" id="abSeedTok" placeholder="Kode akses edit" autocomplete="current-password">`}
      <button class="btn primary sm" type="button" id="abSeedBtn">Salin ${STATIC.length} data ke sheet</button></div>`;
  }
  $("#abSeed").addEventListener("click", async e => {
    if (!e.target.closest("#abSeedBtn")) return;
    const btn = $("#abSeedBtn"); btn.disabled = true; btn.textContent = "Menyalin…";
    try {
      const j = await post({ action: "ab_seed", rows: STATIC.map(toSheet) }, $("#abSeedTok"));
      toast(`${j.rows.length} data alat disalin ke sheet ${SHEET}`);
      await load();
    } catch (err) { toast(String(err.message || err)); btn.disabled = false; btn.textContent = `Salin ${STATIC.length} data ke sheet`; }
  });

  /* ---------- Form tambah / edit ---------- */
  const F = [
    ["id", "ID alat", "text", { placeholder: "Kosongkan = otomatis (HE-xxx)" }],
    ["nama", "Nama alat", "text", { required: true, placeholder: "mis. TRUCK CRANE" }],
    ["kategori", "Kategori", "select", { opts: Object.values(KAT_LABEL) }],
    ["fungsi", "Fungsi", "text", { list: "abFungsiList", placeholder: "Angkat / Angkut / Angkat Angkut" }],
    ["jenisAset", "Jenis aset", "select", { opts: ["Alat Berat", "Alat Bantu"] }],
    ["merk", "Merk / Type", "text"],
    ["kapasitas", "Kapasitas", "text", { placeholder: "mis. 5 TON" }],
    ["noSeri", "No. seri", "text"],
    ["tahun", "Tahun", "text", { inputmode: "numeric", pattern: "\\d{4}", placeholder: "mis. 2024" }],
    ["upt", "UPT", "select", { opts: UPTS, required: true }],
    ["lokasi", "Gudang / lokasi", "text", { list: "abLokList", required: true }],
    ["jumlah", "Jumlah", "text", { inputmode: "numeric" }],
    ["satuan", "Satuan", "text", { placeholder: "unit" }],
    ["kondisi", "Kondisi", "select", { opts: ["Baik", "Perlu Service", "Rusak"] }],
    ["kelayakan", "Kelayakan", "select", { opts: ["Layak", "Tidak layak"] }],
    ["ketersediaan", "Ketersediaan", "select", { opts: ["Tersedia", "Dipinjam"] }],
    ["kondisiCatatan", "Catatan kondisi", "textarea", { wide: true, placeholder: "mis. Bocor seal oli, kondisi fisik 60%" }],
    ["suratIzin", "Surat izin (SIA/SILO)", "select", { opts: ["Tidak ada", "Ada", "Perlu perpanjangan"] }],
    ["izinBerlaku", "Masa berlaku surat izin", "date"],
    ["suratIzinUrl", "Link dokumen surat izin", "url", { placeholder: "https://…" }],
    ["spesifikasi", "Spesifikasi", "textarea", { wide: true }]
  ];
  function buildForm() {
    const lok = [...new Set(C.AB.alat.map(a => a.lokasi))].sort();
    $("#abFields").innerHTML = F.map(([k, label, type, o = {}]) => {
      const attrs = `id="abf_${k}" name="${k}"${o.required ? " required" : ""}${o.list ? ` list="${o.list}"` : ""}${o.inputmode ? ` inputmode="${o.inputmode}"` : ""}${o.pattern ? ` pattern="${o.pattern}"` : ""}${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ""}`;
      const input = type === "select" ? `<select ${attrs}>${o.required ? "" : ""}${o.opts.map(v => `<option>${esc(v)}</option>`).join("")}</select>`
        : type === "textarea" ? `<textarea ${attrs} rows="2"></textarea>` : `<input type="${type}" ${attrs} autocomplete="off">`;
      return `<label class="fld${o.wide ? " wide" : ""}"><span>${label}${o.required ? " <em>*</em>" : ""}</span>${input}</label>`;
    }).join("") + `<datalist id="abLokList">${lok.map(v => `<option value="${esc(v)}">`).join("")}</datalist>
      <datalist id="abFungsiList"><option value="Angkat"><option value="Angkut"><option value="Angkat Angkut"></datalist>`;
  }
  function err(msg) { $("#abEditErr").textContent = msg || ""; $("#abEditErr").hidden = !msg; }
  function openEdit(id) {
    if (!DB.live) return;
    const a = id ? C.byId(id) : null;
    DB.editing = a; DB.photos = []; DB.phErr = "";
    buildForm(); err("");
    const raw = a ? a._raw : { kategori: "Alat Pendukung", jenisAset: "Alat Berat", kondisi: "Baik", kelayakan: "Layak", ketersediaan: "Tersedia", suratIzin: "Tidak ada", jumlah: "1", satuan: "unit", upt: UPTS[0] };
    F.forEach(([k]) => { const el = $("#abf_" + k); if (el) el.value = raw[k] || ""; });
    $("#abf_id").disabled = !!a;
    $("#abEditTitle").textContent = a ? `Edit ${a.nama}` : "Tambah alat baru";
    $("#abEditSub").textContent = a ? `${a.id} · ${a.upt} • ${a.lokasi} · disimpan ke sheet ${SHEET}` : `Disimpan ke sheet ${SHEET}`;
    tokUi("ab");
    $("#abPhSec").hidden = false;
    if (a) loadPhotos(); else renderPhotos();
    if ($("#abDetail").open) $("#abDetail").close();
    $("#abEditDlg").showModal();
  }
  $("#abAddBtn").addEventListener("click", () => openEdit(null));
  $("#abReload").addEventListener("click", load);
  $("#abTokForget").addEventListener("click", () => { tokenForget(); tokUi("ab"); });
  $("#abEditForm").addEventListener("submit", async e => {
    e.preventDefault();
    const a = DB.editing, data = {};
    F.forEach(([k]) => { const el = $("#abf_" + k); if (el && !el.disabled) data[k] = el.value.trim(); });
    if (!data.nama) return err("Nama alat wajib diisi.");
    if (!data.lokasi) return err("Gudang / lokasi wajib diisi.");
    if (data.tahun && !/^\d{4}$/.test(data.tahun)) return err("Tahun harus 4 digit, mis. 2024.");
    let body;
    if (a) {
      const changed = Object.fromEntries(Object.entries(data).filter(([k, v]) => (a._raw[k] || "") !== v));
      if (!Object.keys(changed).length) { $("#abEditDlg").close(); return toast("Tidak ada perubahan"); }
      body = { action: "ab_update", id: a.id, data: changed };
    } else body = { action: "ab_add", data };
    const btn = $("#abSave"); btn.disabled = true; btn.textContent = "Menyimpan…"; err("");
    try {
      const j = await post(body, $("#ab_token"));
      upsert(j.row);
      if (a) { $("#abEditDlg").close(); toast("Perubahan tersimpan ke Google Sheets"); }
      else { toast(`${j.row.id} ditambahkan — sekarang Anda bisa menambah foto`); openEdit(j.row.id); }
    } catch (x) { err(String(x.message || x)); }
    finally { btn.disabled = false; btn.textContent = "Simpan"; }
  });
  function upsert(row) {
    if (!row) return;
    const m = toModel(row), i = C.AB.alat.findIndex(x => x.id === m.id);
    if (i >= 0) C.AB.alat[i] = m; else C.AB.alat.push(m);
    ensureCoords([m]);
    if (DB.editing && DB.editing.id === m.id) DB.editing = m;
    C.render(true);
    if (location.hash === "#alat" && typeof setUpdated === "function") setUpdated("alat");
  }

  /* ---------- Foto alat (Google Drive) ---------- */
  async function loadPhotos() {
    const a = DB.editing; if (!a) return;
    DB.phBusy = "Memuat foto…"; renderPhotos();
    try {
      const j = await (await fetch(`${API}${API.includes("?") ? "&" : "?"}action=ab_photos&id=${encodeURIComponent(a.id)}`, { cache: "no-store" })).json();
      if (!j.ok) throw new Error(j.error || "Gagal memuat foto");
      DB.photos = j.photos || []; DB.cover = j.cover; DB.folder = j.folder; DB.phErr = "";
    } catch (e) { DB.phErr = String(e.message || e); }
    DB.phBusy = ""; renderPhotos();
  }
  function renderPhotos() {
    const a = DB.editing, sec = $("#abPhSec");
    if (!a) { sec.innerHTML = `<h4>Foto alat</h4><p class="muted sm">Foto dapat ditambahkan setelah data alat disimpan.</p>`; return; }
    const st = STATIC_FOTO[a.id] && !DB.photos.length ? `<p class="muted sm">Saat ini memakai foto dari export WARNOTO (thumbnail). Unggah foto baru untuk menggantinya.</p>` : "";
    sec.innerHTML = `<div class="ph-head"><h4>Foto alat <small>${DB.photos.length} foto${DB.folder ? ` · <a href="${esc(DB.folder)}" target="_blank" rel="noopener">buka folder Drive</a>` : ""}</small></h4>
        <label class="btn ghost sm${DB.phBusy ? " disabled" : ""}">${icon("camera", "ic xs")}Tambah foto<input type="file" id="abPhFile" accept="image/*" multiple hidden></label></div>
      ${DB.phBusy ? `<p class="muted sm">${esc(DB.phBusy)}</p>` : ""}${DB.phErr ? `<p class="form-err">${esc(DB.phErr)}</p>` : ""}${st}
      <div class="ph-grid">${DB.photos.map(p => `<figure class="ph-item${p.id === DB.cover ? " cover" : ""}">
        <a class="ph-img" href="${esc(p.view)}" target="_blank" rel="noopener"><img src="${esc(p.thumb)}" alt="${esc(p.caption || p.name)}" loading="lazy"></a>
        <figcaption>${p.id === DB.cover ? `<span class="badge ok">Foto utama</span>` : ""}<div class="ph-act">
          ${p.id === DB.cover ? "" : `<button type="button" class="linkbtn" data-cover="${esc(p.id)}">Jadikan utama</button>`}
          <button type="button" class="linkbtn danger" data-del="${esc(p.id)}">Hapus</button></div></figcaption></figure>`).join("")}</div>`;
  }
  $("#abPhSec").addEventListener("change", async e => {
    if (e.target.id !== "abPhFile" || !e.target.files.length) return;
    const files = [...e.target.files]; e.target.value = "";
    for (let i = 0; i < files.length; i++) {
      DB.phBusy = `Mengunggah foto ${i + 1} dari ${files.length}…`; DB.phErr = ""; renderPhotos();
      try {
        const p = await phPrepare(files[i]);
        const j = await post({ action: "ab_photo_upload", id: DB.editing.id, ...p }, $("#ab_token"));
        DB.photos.push(j.photo); upsert(j.row); DB.cover = j.row.fotoUtama;
      } catch (x) { DB.phErr = String(x.message || x); break; }
    }
    DB.phBusy = ""; await loadPhotos();
  });
  $("#abPhSec").addEventListener("click", async e => {
    const c = e.target.closest("[data-cover]"), d = e.target.closest("[data-del]");
    if (!c && !d) return;
    if (d && !confirm("Hapus foto ini? File dipindah ke sampah Google Drive.")) return;
    DB.phBusy = c ? "Menyimpan foto utama…" : "Menghapus foto…"; renderPhotos();
    try {
      const j = await post({ action: c ? "ab_photo_cover" : "ab_photo_delete", id: DB.editing.id, fileId: (c || d).dataset[c ? "cover" : "del"] }, $("#ab_token"));
      upsert(j.row);
    } catch (x) { DB.phErr = String(x.message || x); }
    DB.phBusy = ""; await loadPhotos();
  });

  /* ---------- Detail: galeri foto & tombol edit ---------- */
  window.abOnDetail = a => {
    if (!DB.live) return;
    $("#abDetailBody").insertAdjacentHTML("beforeend", `<section class="dsec ab-det-photos" id="abDetPh"><h4>Foto <small>memuat…</small></h4></section>
      <div class="ab-det-actions"><button type="button" class="btn primary sm" id="abDetEdit">${icon("gear", "ic xs")}Edit data &amp; foto</button></div>`);
    $("#abDetEdit").addEventListener("click", () => openEdit(a.id));
    fetch(`${API}${API.includes("?") ? "&" : "?"}action=ab_photos&id=${encodeURIComponent(a.id)}`, { cache: "no-store" }).then(r => r.json()).then(j => {
      const box = $("#abDetPh"); if (!box) return;
      const ph = (j.ok && j.photos) || [];
      box.innerHTML = `<h4>Foto <small>${ph.length} foto${j.folder ? ` · <a href="${esc(j.folder)}" target="_blank" rel="noopener">folder Drive</a>` : ""}</small></h4>` +
        (ph.length ? `<div class="ab-det-strip">${ph.map(p => `<a href="${esc(p.view)}" target="_blank" rel="noopener"><img src="${esc(p.thumb)}" alt="${esc(p.caption || p.name)}" loading="lazy"></a>`).join("")}</div>`
          : `<p class="muted sm">Belum ada foto di Google Drive. Klik “Edit data &amp; foto” untuk menambah.</p>`);
    }).catch(() => { const box = $("#abDetPh"); if (box) box.innerHTML = `<h4>Foto</h4><p class="muted sm">Foto tidak dapat dimuat.</p>`; });
  };
  $("#abEditDlg").addEventListener("close", () => { DB.editing = null; });

  load();
})();
