/* =========================================================
   MENU ALAT BERAT — Daftar Alat & Peminjaman (data dummy)
   Sumber data: window.ALAT_BERAT_DUMMY (data/alat-berat-dummy.js)
   Perubahan (pengajuan/approval) hanya disimpan di memori browser.
   ========================================================= */
(function () {
  if (!$("#page-alat") || !window.ALAT_BERAT_DUMMY) return;
  const AB = {
    alat: window.ALAT_BERAT_DUMMY.alat.map(a => ({ ...a })),
    pj: window.ALAT_BERAT_DUMMY.peminjaman.map(p => ({ ...p, histori: p.histori.map(h => ({ ...h })) })),
    kat: "", kondisi: "", q: "", pjStatus: "", pjQ: "", tab: "daftar", detail: null, pjDetail: null
  };
  const KAT = {
    crane: { label: "Crane", ic: '<path d="M4 21h9M7 21V4l12 3.5M7 4 4 8M19 7.5V14"/><path d="M17 14h4v3h-4z"/>' },
    forklift: { label: "Forklift", ic: '<path d="M3 18h10M5 18V9h5l3 4v5M16 4v14M16 15h5"/><circle cx="6" cy="19" r="1.5"/><circle cx="11" cy="19" r="1.5"/>' },
    manlift: { label: "Manlift", ic: '<path d="M6 21h12M8 21v-3h8v3M9 18l6-5M15 18l-6-5M8 10h8V5H8z"/>' },
    pendukung: { label: "Alat Pendukung", ic: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z"/>' }
  };
  const ALL_IC = '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>';
  const svg = (p, cls = "ic") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  const PJ_TONE = { "Menunggu Approval": "warn", "Disetujui": "info", "Dipinjam": "info", "Dikembalikan": "ok", "Ditolak": "bad" };
  const ST_TONE = { Tersedia: "info", Dipinjam: "warn", Perbaikan: "bad" };
  const fmtDate = d => { const m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : (d || "—"); };
  const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
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
  const busyIds = () => new Set(AB.pj.filter(p => ["Menunggu Approval", "Disetujui", "Dipinjam"].includes(p.status)).map(p => p.alatId));
  const KONDISI_OPT = [
    ["", "Semua Alat", () => true], ["Tersedia", "Tersedia", a => statusOf(a) === "Tersedia"], ["Dipinjam", "Sedang dipinjam", a => statusOf(a) === "Dipinjam"],
    ["Perbaikan", "Dalam perbaikan", a => statusOf(a) === "Perbaikan"], ["Layak", "Layak", a => a.layak], ["TidakLayak", "Tidak layak", a => !a.layak]
  ];

  /* ---------------- Daftar Alat ---------------- */
  function renderDaftar() {
    const inKat = AB.alat.filter(a => !AB.kat || a.kategori === AB.kat);
    const kf = KONDISI_OPT.find(k => k[0] === AB.kondisi)[2];
    const q = AB.q.trim().toLowerCase();
    const list = inKat.filter(kf).filter(a => !q || [a.id, a.nama, a.merk, a.kapasitas, a.noSeri, a.upt, a.lokasi].join(" ").toLowerCase().includes(q));
    const cnt = k => AB.alat.filter(a => !k || a.kategori === k).length;
    $("#abKat").innerHTML = [["", "Semua", ALL_IC], ...Object.entries(KAT).map(([k, v]) => [k, v.label, v.ic])]
      .map(([k, l, ic]) => `<button type="button" class="ab-chip${AB.kat === k ? " on" : ""}" data-k="${k}" aria-pressed="${AB.kat === k}">${svg(ic)}<span>${l}</span><em>${cnt(k)}</em></button>`).join("");
    $("#abKondisi").innerHTML = KONDISI_OPT.map(([v, l, f]) => `<option value="${v}"${AB.kondisi === v ? " selected" : ""}>${l} (${inKat.filter(f).length})</option>`).join("");
    $("#abCount").textContent = `${list.length} alat sesuai filter`;
    $("#abShown").innerHTML = `Menampilkan <b>${list.length}</b> alat`;
    $("#abGrid").innerHTML = list.length ? list.map(card).join("") : `<div class="card ab-empty">Tidak ada alat yang cocok dengan filter.</div>`;
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
        <div><dt>Kondisi</dt><dd>${esc(a.kondisi)}</dd></div><div><dt>Surat Izin</dt><dd>${esc(a.suratIzin)}</dd></div>
      </dl>
      ${last ? `<p class="ab-last">Terakhir dipinjam oleh <b>${esc(last.oleh)}</b> untuk pekerjaan <b>${esc(last.pekerjaan)}</b>.</p>` : ""}
    </article>`;
  }
  function openDetail(id) {
    const a = byId(id); if (!a) return;
    AB.detail = id;
    const st = statusOf(a), loans = AB.pj.filter(p => p.alatId === id).sort((x, y) => x.mulai < y.mulai ? 1 : -1);
    const canBorrow = st === "Tersedia" && a.layak && !busyIds().has(id);
    $("#abDetailTitle").textContent = a.nama;
    $("#abDetailSub").innerHTML = `${esc(a.id)} · ${esc(a.upt)} • ${esc(a.lokasi)} <span class="badge ${ST_TONE[st]}">${st}</span>`;
    $("#abDetailBody").innerHTML = `<div class="ab-detail-top"><div class="ab-photo big">${photo(a, true)}</div>
        <dl class="dgrid ab-dgrid">${[["Kategori", KAT[a.kategori].label], ["Merk/Type", a.merk], ["Kapasitas", a.kapasitas], ["Tahun", a.tahun], ["No. Seri", a.noSeri],
          ["Fungsi", a.fungsi], ["Kelayakan", a.layak ? "Layak" : "Tidak layak"], ["Kondisi", a.kondisi], ["Surat Izin (SIA/SILO)", a.suratIzin], ["Lokasi", `${a.upt} • ${a.lokasi}`]]
          .map(([l, v]) => `<div><dt>${l}</dt><dd class="${v ? "" : "nil"}">${esc(v || "—")}</dd></div>`).join("")}</dl></div>
      <section class="dsec"><h4>${icon("rotate", "ic xs")}Riwayat peminjaman</h4>
        ${loans.length ? `<div class="table-wrap flat"><table class="table"><thead><tr><th>No. Pengajuan</th><th>Peminjam</th><th>Pekerjaan</th><th>Periode</th><th>Status</th></tr></thead><tbody>
          ${loans.map(p => `<tr><td><button type="button" class="linkbtn" data-pj="${p.id}">${p.id}</button></td><td>${esc(p.peminjam)}</td><td>${esc(p.pekerjaan)}</td><td>${fmtDate(p.mulai)} – ${fmtDate(p.selesai)}</td><td><span class="badge ${PJ_TONE[p.status]}">${p.status}</span></td></tr>`).join("")}
          </tbody></table></div>` : `<p class="dnil">Belum ada riwayat peminjaman untuk alat ini.</p>`}</section>`;
    $("#abDetailBorrow").hidden = !canBorrow;
    $("#abDetail").showModal();
  }

  /* ---------------- Peminjaman & Histori ---------------- */
  const PJ_ST = ["Menunggu Approval", "Disetujui", "Dipinjam", "Dikembalikan", "Ditolak"];
  function renderPinjam() {
    const c = s => AB.pj.filter(p => p.status === s).length;
    $("#abPjKpi").innerHTML = [["Menunggu Approval", c("Menunggu Approval"), "alert", "p2"], ["Disetujui (belum diambil)", c("Disetujui"), "check", "p3"],
      ["Sedang dipinjam", c("Dipinjam"), "out", "primary"], ["Selesai / dikembalikan", c("Dikembalikan"), "check", "ok"]]
      .map(([l, v, ic, t]) => `<div class="card kpi tone-${t}"><div class="kpi-icon">${icon(ic)}</div><div><div class="kpi-label">${l}</div><div class="kpi-value">${v}</div></div></div>`).join("");
    $("#abPjStatus").innerHTML = [["", "Semua", AB.pj.length], ...PJ_ST.map(s => [s, s, c(s)])]
      .map(([v, l, n]) => `<button type="button" data-v="${v}" class="${AB.pjStatus === v ? "on" : ""}" aria-pressed="${AB.pjStatus === v}">${l} <small>${n}</small></button>`).join("");
    const q = AB.pjQ.trim().toLowerCase();
    const list = AB.pj.filter(p => !AB.pjStatus || p.status === AB.pjStatus)
      .filter(p => { const a = byId(p.alatId) || {}; return !q || [p.id, p.peminjam, p.pekerjaan, p.tujuan, p.pic, a.nama, a.id].join(" ").toLowerCase().includes(q); })
      .sort((x, y) => x.id < y.id ? 1 : -1);
    $("#abPjRows").innerHTML = list.map(p => {
      const a = byId(p.alatId) || {};
      return `<tr><td><b>${p.id}</b><div class="muted sm">Diajukan ${fmtDate(p.histori[0].t)}</div></td>
        <td><b>${esc(a.nama || "-")}</b><div class="muted sm">${esc(a.id || "")} · ${esc(a.kapasitas || "")}</div></td>
        <td>${esc(p.peminjam)}<div class="muted sm">PIC: ${esc(p.pic)}</div></td>
        <td class="ab-job">${esc(p.pekerjaan)}<div class="muted sm">${esc(p.tujuan)}</div></td>
        <td>${fmtDate(p.mulai)}<div class="muted sm">s.d. ${fmtDate(p.selesai)}</div></td>
        <td><span class="badge ${PJ_TONE[p.status]}">${p.status}</span></td>
        <td class="act"><button type="button" class="btn ghost sm" data-pj="${p.id}">Detail</button></td></tr>`;
    }).join("");
    $("#abPjEmpty").hidden = list.length > 0;
    $("#abPjCount").textContent = `${list.length} pengajuan`;
  }
  function openPj(id) {
    const p = AB.pj.find(x => x.id === id); if (!p) return;
    AB.pjDetail = id;
    const a = byId(p.alatId) || {};
    $("#abPjTitle").textContent = p.id;
    $("#abPjSub").innerHTML = `${esc(a.nama || "")} · ${esc(a.id || "")} <span class="badge ${PJ_TONE[p.status]}">${p.status}</span>`;
    $("#abPjBody").innerHTML = `<dl class="dgrid">${[["Alat", `${a.nama || "-"} (${a.kapasitas || "-"})`], ["Asal alat", `${a.upt || ""} • ${a.lokasi || ""}`], ["Peminjam", p.peminjam], ["PIC", p.pic],
        ["Pekerjaan", p.pekerjaan, true], ["Lokasi tujuan", p.tujuan], ["Periode", `${fmtDate(p.mulai)} s.d. ${fmtDate(p.selesai)}`]]
        .map(([l, v, w]) => `<div class="${w ? "span2" : ""}"><dt>${l}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      <section class="dsec"><h4>${icon("rotate", "ic xs")}Histori approval</h4><ul class="mv-tl">${p.histori.map(h => `<li class="mv-item"><span class="mv-dot"></span><div class="mv-body">
        <div class="mv-date">${fmtDate(h.t)} <small>${esc(h.oleh)}</small></div><div class="mv-route"><span>${esc(h.s)}</span></div>${h.catatan ? `<p>${esc(h.catatan)}</p>` : ""}</div></li>`).join("")}</ul></section>
      ${p.status === "Menunggu Approval" ? `<label class="fld ab-note"><span>Catatan approval <small>(wajib bila ditolak)</small></span><textarea id="abPjNote" rows="2" placeholder="Catatan untuk peminjam"></textarea></label>` : ""}`;
    const acts = { "Menunggu Approval": [["Tolak", "Ditolak", "ghost danger"], ["Setujui", "Disetujui", "primary"]], "Disetujui": [["Serahkan alat (mulai dipinjam)", "Dipinjam", "primary"]], "Dipinjam": [["Tandai dikembalikan", "Dikembalikan", "primary"]] }[p.status] || [];
    $("#abPjActs").innerHTML = `<button class="btn ghost" type="button" onclick="$('#abPjDetail').close()">Tutup</button>` +
      acts.map(([l, s, cls]) => `<button class="btn ${cls}" type="button" data-to="${s}">${l}</button>`).join("");
    $("#abPjErr").hidden = true;
    if (!$("#abPjDetail").open) $("#abPjDetail").showModal();
  }
  function pjAction(to) {
    const p = AB.pj.find(x => x.id === AB.pjDetail); if (!p) return;
    const note = ($("#abPjNote") && $("#abPjNote").value.trim()) || "";
    if (to === "Ditolak" && !note) { const e = $("#abPjErr"); e.textContent = "Isi catatan alasan penolakan."; e.hidden = false; $("#abPjNote").focus(); return; }
    const a = byId(p.alatId) || {};
    const oleh = to === "Disetujui" || to === "Ditolak" ? "TL Pemeliharaan UIT JBM" : "Petugas gudang " + (a.lokasi || "");
    p.status = to; p.histori.push({ t: today(), s: to, oleh, catatan: note });
    renderAll(); openPj(p.id);
    toast(`Pengajuan ${p.id}: ${to} (data contoh)`);
  }

  /* ---------------- Form pengajuan ---------------- */
  function openForm(alatId) {
    const busy = busyIds();
    const avail = AB.alat.filter(a => statusOf(a) === "Tersedia" && a.layak && !busy.has(a.id));
    $("#abF_alat").innerHTML = `<option value="">Pilih alat…</option>` + Object.entries(KAT).map(([k, v]) => {
      const opts = avail.filter(a => a.kategori === k);
      return opts.length ? `<optgroup label="${v.label}">${opts.map(a => `<option value="${a.id}">${esc(a.nama)} · ${esc(a.kapasitas)} — ${esc(a.upt.replace(/^UPT /, ""))} • ${esc(a.lokasi)} (${a.id})</option>`).join("")}</optgroup>` : "";
    }).join("");
    $("#abFormEl").reset();
    $("#abF_alat").value = alatId && avail.some(a => a.id === alatId) ? alatId : "";
    $("#abF_mulai").value = today();
    $("#abF_tujuanList").innerHTML = (window.GI_UIT_JBM || []).map(g => `<option value="${esc(g.gi)}"></option>`).join("");
    $("#abFormErr").hidden = true;
    $("#abForm").showModal();
  }
  function submitForm(ev) {
    ev.preventDefault();
    const f = $("#abFormEl"); if (!f.reportValidity()) return;
    const v = id => $("#" + id).value.trim();
    if (v("abF_selesai") < v("abF_mulai")) { const e = $("#abFormErr"); e.textContent = "Tanggal selesai tidak boleh sebelum tanggal mulai."; e.hidden = false; return; }
    const num = AB.pj.reduce((m, p) => Math.max(m, +(p.id.match(/(\d+)$/) || [0, 0])[1]), 0) + 1;
    const p = { id: "PJ-2026-" + String(num).padStart(3, "0"), alatId: v("abF_alat"), peminjam: v("abF_peminjam"), pic: v("abF_pic"), pekerjaan: v("abF_pekerjaan"),
      tujuan: v("abF_tujuan"), mulai: v("abF_mulai"), selesai: v("abF_selesai"), status: "Menunggu Approval",
      histori: [{ t: today(), s: "Diajukan", oleh: "Admin " + v("abF_peminjam"), catatan: v("abF_catatan") }] };
    AB.pj.push(p);
    $("#abForm").close(); renderAll(); switchTab("pinjam");
    toast(`Pengajuan ${p.id} dibuat (data contoh — belum tersimpan permanen)`);
  }

  /* ---------------- Umum ---------------- */
  function switchTab(t) {
    AB.tab = t;
    document.querySelectorAll(".ab-tab").forEach(b => { const on = b.dataset.tab === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    $("#abDaftar").hidden = t !== "daftar"; $("#abPinjam").hidden = t !== "pinjam";
  }
  function renderAll() { renderDaftar(); renderPinjam(); }

  $("#abKat").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (b) { AB.kat = b.dataset.k; AB.kondisi = AB.kondisi; renderDaftar(); } });
  $("#abKondisi").addEventListener("change", e => { AB.kondisi = e.target.value; renderDaftar(); });
  $("#abSearch").addEventListener("input", e => { AB.q = e.target.value; renderDaftar(); });
  $("#abGrid").addEventListener("click", e => { const c = e.target.closest("[data-id]"); if (c) openDetail(c.dataset.id); });
  $("#abGrid").addEventListener("keydown", e => { const c = e.target.closest("[data-id]"); if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openDetail(c.dataset.id); } });
  document.querySelectorAll(".ab-tab").forEach(b => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  $("#abPjStatus").addEventListener("click", e => { const b = e.target.closest("button[data-v]"); if (b) { AB.pjStatus = b.dataset.v; renderPinjam(); } });
  $("#abPjSearch").addEventListener("input", e => { AB.pjQ = e.target.value; renderPinjam(); });
  $("#abPjRows").addEventListener("click", e => { const b = e.target.closest("[data-pj]"); if (b) openPj(b.dataset.pj); });
  $("#abDetailBody").addEventListener("click", e => { const b = e.target.closest("[data-pj]"); if (b) { $("#abDetail").close(); openPj(b.dataset.pj); } });
  $("#abPjActs").addEventListener("click", e => { const b = e.target.closest("[data-to]"); if (b) pjAction(b.dataset.to); });
  $("#abNewBtn").addEventListener("click", () => openForm());
  $("#abDetailBorrow").addEventListener("click", () => { const id = AB.detail; $("#abDetail").close(); openForm(id); });
  $("#abFormEl").addEventListener("submit", submitForm);
  ["#abDetail", "#abPjDetail", "#abForm"].forEach(d => $(d).addEventListener("click", e => { if (e.target === $(d)) $(d).close(); }));
  renderAll();
})();
