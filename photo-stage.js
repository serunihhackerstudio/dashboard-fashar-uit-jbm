/* =========================================================
   FOTO "DISIAPKAN DULU, DISIMPAN BERSAMA DATA"
   Dipakai form Edit Alat Berat, DC Mobile, Filter Minyak, HV Test.
   Memilih / menghapus / menjadikan foto utama tidak langsung dikirim ke server:
   semuanya dikerjakan saat tombol Simpan ditekan (sekali isi kode akses).
   ========================================================= */
function photoStager(sec, opts) {
  const S = { existing: [], cover: null, folder: null, pending: [], del: new Set(), newCover: null, busy: "", err: "", loading: false, seq: 0 };
  const inputId = (opts.prefix || "ps") + "PhFile";

  function reset(o) {
    S.pending.forEach(p => URL.revokeObjectURL(p.url));
    Object.assign(S, { existing: (o && o.photos) || [], cover: (o && o.cover) || null, folder: (o && o.folder) || null, pending: [], del: new Set(), newCover: null, busy: "", err: (o && o.err) || "", loading: !!(o && o.loading) });
    render();
  }
  const hasChanges = () => S.pending.length > 0 || S.del.size > 0 || (S.newCover != null && S.newCover !== S.cover);
  const isCover = key => (S.newCover != null ? S.newCover : S.cover) === key;
  function render() {
    const n = S.existing.length - S.del.size + S.pending.length;
    const changes = hasChanges();
    sec.innerHTML = `<div class="ph-head"><h4>Foto <small>${n} foto${S.folder ? ` · <a href="${esc(S.folder)}" target="_blank" rel="noopener">buka folder Drive</a>` : ""}</small></h4>
      <label class="btn ghost sm${S.busy ? " disabled" : ""}">${icon("camera", "ic xs")}Tambah foto<input type="file" id="${inputId}" accept="image/*" multiple hidden ${S.busy ? "disabled" : ""}></label></div>
      ${S.loading ? `<div class="ph-grid sk-grid"><span class="sk"></span><span class="sk"></span><span class="sk"></span></div>` : ""}${S.busy ? `<p class="ph-status"><i class="spin"></i>${esc(S.busy)}</p>` : ""}${S.err ? `<p class="form-err">${esc(S.err)}</p>` : ""}
      ${changes ? `<p class="ps-note">${icon("alert", "ic xs")}Perubahan foto belum disimpan — akan diunggah ke Google Drive saat Anda menekan <b>Simpan</b>.</p>` : ""}
      <div class="ph-grid">${S.existing.map(p => { const gone = S.del.has(p.id); return `<figure class="ph-item${isCover(p.id) && !gone ? " cover" : ""}${gone ? " ps-del" : ""}">
          <a class="ph-img" href="${esc(p.view)}" target="_blank" rel="noopener"><img src="${esc(p.thumb)}" alt="${esc(p.caption || p.name)}" loading="lazy"></a>
          <figcaption>${gone ? `<span class="badge bad">Akan dihapus</span>` : isCover(p.id) ? `<span class="badge ok">Foto utama</span>` : ""}<div class="ph-act">
            ${gone ? `<button type="button" class="linkbtn" data-undel="${esc(p.id)}">Batal hapus</button>`
              : `${isCover(p.id) ? "" : `<button type="button" class="linkbtn" data-cover="${esc(p.id)}">Jadikan utama</button>`}<button type="button" class="linkbtn danger" data-del="${esc(p.id)}">Hapus</button>`}</div></figcaption></figure>`; }).join("")}
        ${S.pending.map(p => `<figure class="ph-item ps-new${isCover("p:" + p.k) ? " cover" : ""}"><span class="ph-img"><img src="${p.url}" alt="${esc(p.file.name)}"></span>
          <figcaption><span class="badge info">Baru · belum disimpan</span>${isCover("p:" + p.k) ? ` <span class="badge ok">Foto utama</span>` : ""}<div class="ph-act">
            ${isCover("p:" + p.k) ? "" : `<button type="button" class="linkbtn" data-cover="p:${p.k}">Jadikan utama</button>`}<button type="button" class="linkbtn danger" data-unpend="${p.k}">Batalkan</button></div></figcaption></figure>`).join("")}</div>`;
  }
  sec.addEventListener("change", e => {
    if (e.target.id !== inputId || !e.target.files.length) return;
    const bad = [];
    [...e.target.files].forEach(f => { if (/^image\//.test(f.type)) S.pending.push({ k: ++S.seq, file: f, url: URL.createObjectURL(f) }); else bad.push(f.name); });
    e.target.value = ""; S.err = bad.length ? `Bukan file gambar: ${bad.join(", ")}` : "";
    render();
  });
  sec.addEventListener("click", e => {
    const b = e.target.closest("[data-cover],[data-del],[data-undel],[data-unpend]");
    if (!b || S.busy) return;
    const d = b.dataset;
    if (d.cover) S.newCover = d.cover;
    if (d.del) { S.del.add(d.del); if (isCover(d.del)) S.newCover = ""; }
    if (d.undel) S.del.delete(d.undel);
    if (d.unpend) { const i = S.pending.findIndex(p => String(p.k) === d.unpend); if (i >= 0) { URL.revokeObjectURL(S.pending[i].url); if (S.newCover === "p:" + d.unpend) S.newCover = null; S.pending.splice(i, 1); } }
    render();
  });
  /* Kirim semua perubahan foto. send(action, payload) -> respons server; action: "upload" | "delete" | "cover" */
  async function commit(send) {
    let lastRow = null; const total = S.pending.length; let k = 0;
    try {
      // foto yang berhasil diunggah langsung dikeluarkan dari antrean (aman bila Simpan diulang setelah gagal)
      while (S.pending.length) {
        const p = S.pending[0];
        S.busy = `Mengunggah foto ${++k} dari ${total}…`; render();
        const j = await send("upload", await phPrepare(p.file));
        const id = j.photo && j.photo.id; lastRow = j.row || lastRow;
        if (S.newCover === "p:" + p.k) S.newCover = id || null;
        URL.revokeObjectURL(p.url); S.pending.shift();
        if (j.photo) S.existing.push(j.photo);
      }
      for (const id of [...S.del]) {
        S.busy = "Menghapus foto…"; render();
        const j = await send("delete", { fileId: id }); lastRow = j.row || lastRow;
        S.del.delete(id); S.existing = S.existing.filter(x => x.id !== id);
      }
      if (S.newCover && S.newCover !== S.cover) {
        S.busy = "Menyimpan foto utama…"; render();
        const j = await send("cover", { fileId: S.newCover }); lastRow = j.row || lastRow; S.cover = S.newCover;
      }
      S.newCover = null;
    } finally { S.busy = ""; render(); }
    return lastRow;
  }
  /* Isi foto yang sudah ada di Drive tanpa menghapus foto baru / tanda hapus yang dipilih selama memuat */
  function setExisting(o) {
    Object.assign(S, { existing: (o && o.photos) || [], cover: (o && o.cover) || null, folder: (o && o.folder) || null, loading: false });
    if (o && o.err) S.err = o.err;
    render();
  }
  return { reset, setExisting, render, hasChanges, commit, setLoading: v => { S.loading = v; render(); }, setErr: m => { S.err = m || ""; render(); } };
}
